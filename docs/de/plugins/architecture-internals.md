---
read_when:
    - Implementierung von Provider-Laufzeit-Hooks, Channel-Lifecycle oder Paket-Packs
    - Fehlersuche bei der Plugin-Ladereihenfolge oder dem Registry-Status
    - Hinzufügen einer neuen Plugin-Fähigkeit oder eines Context-Engine-Plugins
summary: 'Plugin-Architektur-Interna: Lade-Pipeline, Registry, Laufzeit-Hooks, HTTP-Routen und Referenztabellen'
title: Plugin-Architektur-Interna
x-i18n:
    generated_at: "2026-04-24T08:57:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9370788c5f986e9205b1108ae633e829edec8890e442a49f80d84bb0098bb393
    source_path: plugins/architecture-internals.md
    workflow: 15
---

Für das öffentliche Fähigkeitsmodell, Plugin-Formen und Eigentums-/Ausführungs-
Verträge siehe [Plugin architecture](/de/plugins/architecture). Diese Seite ist die
Referenz für die internen Mechanismen: Lade-Pipeline, Registry, Laufzeit-Hooks,
Gateway-HTTP-Routen, Importpfade und Schematabellen.

## Lade-Pipeline

Beim Start führt OpenClaw grob Folgendes aus:

1. mögliche Plugin-Roots erkennen
2. native oder kompatible Bundle-Manifeste und Paketmetadaten lesen
3. unsichere Kandidaten ablehnen
4. Plugin-Konfiguration normalisieren (`plugins.enabled`, `allow`, `deny`, `entries`,
   `slots`, `load.paths`)
5. Aktivierung für jeden Kandidaten festlegen
6. aktivierte native Module laden: gebaute gebündelte Module verwenden einen nativen Loader;
   ungebaute native Plugins verwenden jiti
7. native `register(api)`-Hooks aufrufen und Registrierungen in der Plugin-Registry sammeln
8. die Registry für Befehle/Laufzeit-Oberflächen verfügbar machen

<Note>
`activate` ist ein Legacy-Alias für `register` — der Loader löst jeweils auf, was vorhanden ist (`def.register ?? def.activate`), und ruft es an derselben Stelle auf. Alle gebündelten Plugins verwenden `register`; bevorzugen Sie `register` für neue Plugins.
</Note>

Die Sicherheitsprüfungen erfolgen **vor** der Laufzeitausführung. Kandidaten werden blockiert,
wenn der Entry aus der Plugin-Root ausbricht, der Pfad weltbeschreibbar ist oder
der Pfadbesitz bei nicht gebündelten Plugins verdächtig aussieht.

### Manifest-first-Verhalten

Das Manifest ist die Control-Plane-Quelle der Wahrheit. OpenClaw verwendet es, um:

- das Plugin zu identifizieren
- deklarierte Channels/Skills/Konfigurationsschema oder Bundle-Fähigkeiten zu erkennen
- `plugins.entries.<id>.config` zu validieren
- Labels/Platzhalter der Control UI anzureichern
- Installations-/Katalogmetadaten anzuzeigen
- günstige Aktivierungs- und Einrichtungsdeskriptoren zu bewahren, ohne die Plugin-Laufzeit zu laden

Bei nativen Plugins ist das Laufzeitmodul der Data-Plane-Teil. Es registriert
das tatsächliche Verhalten wie Hooks, Tools, Befehle oder Provider-Flows.

Optionale Manifestblöcke `activation` und `setup` bleiben auf der Control Plane.
Sie sind reine Metadaten-Deskriptoren für Aktivierungsplanung und Setup-Erkennung;
sie ersetzen keine Laufzeitregistrierung, `register(...)` oder `setupEntry`.
Die ersten Verbraucher der Live-Aktivierung nutzen jetzt Manifest-Hinweise für Befehle, Channels und Provider,
um das Laden von Plugins vor einer breiteren Materialisierung der Registry einzugrenzen:

- Das CLI-Laden wird auf Plugins eingegrenzt, denen der angeforderte primäre Befehl gehört
- Channel-Setup/Plugin-Auflösung wird auf Plugins eingegrenzt, denen die angeforderte
  Channel-ID gehört
- explizite Provider-Setup-/Laufzeit-Auflösung wird auf Plugins eingegrenzt, denen die
  angeforderte Provider-ID gehört

Der Aktivierungsplaner stellt sowohl eine reine IDs-API für bestehende Aufrufer als auch eine
Plan-API für neue Diagnosen bereit. Planeinträge melden, warum ein Plugin ausgewählt wurde,
und trennen explizite `activation.*`-Planungshinweise von Manifest-Eigentums-
Fallbacks wie `providers`, `channels`, `commandAliases`, `setup.providers`,
`contracts.tools` und Hooks. Diese Aufteilung der Gründe ist die Kompatibilitätsgrenze:
vorhandene Plugin-Metadaten funktionieren weiterhin, während neuer Code breite Hinweise
oder Fallback-Verhalten erkennen kann, ohne die Semantik des Laufzeitladens zu ändern.

Die Setup-Erkennung bevorzugt jetzt descriptor-eigene IDs wie `setup.providers` und
`setup.cliBackends`, um Kandidaten-Plugins einzugrenzen, bevor auf
`setup-api` für Plugins zurückgegriffen wird, die weiterhin Setup-Laufzeit-Hooks benötigen. Wenn mehr als
ein erkanntes Plugin dieselbe normalisierte Setup-Provider- oder CLI-Backend-
ID beansprucht, verweigert die Setup-Suche den mehrdeutigen Eigentümer, statt sich auf die Erkennungsreihenfolge zu verlassen.

### Was der Loader zwischenspeichert

OpenClaw hält kurze In-Process-Caches für:

- Erkennungsergebnisse
- Manifest-Registry-Daten
- geladene Plugin-Registries

Diese Caches reduzieren Bursts beim Start und den Aufwand für wiederholte Befehle. Man kann sie sich
sicher als kurzlebige Performance-Caches vorstellen, nicht als Persistenz.

Hinweis zur Performance:

- Setzen Sie `OPENCLAW_DISABLE_PLUGIN_DISCOVERY_CACHE=1` oder
  `OPENCLAW_DISABLE_PLUGIN_MANIFEST_CACHE=1`, um diese Caches zu deaktivieren.
- Passen Sie die Cache-Fenster mit `OPENCLAW_PLUGIN_DISCOVERY_CACHE_MS` und
  `OPENCLAW_PLUGIN_MANIFEST_CACHE_MS` an.

## Registry-Modell

Geladene Plugins verändern nicht direkt beliebige globale Core-Zustände. Sie registrieren sich in einer
zentralen Plugin-Registry.

Die Registry verfolgt:

- Plugin-Datensätze (Identität, Quelle, Ursprung, Status, Diagnosen)
- Tools
- Legacy-Hooks und typisierte Hooks
- Channels
- Provider
- Gateway-RPC-Handler
- HTTP-Routen
- CLI-Registrare
- Hintergrunddienste
- Plugin-eigene Befehle

Core-Funktionen lesen dann aus dieser Registry, statt direkt mit Plugin-Modulen
zu sprechen. Dadurch bleibt das Laden gerichtet:

- Plugin-Modul -> Registry-Registrierung
- Core-Laufzeit -> Registry-Nutzung

Diese Trennung ist wichtig für die Wartbarkeit. Sie bedeutet, dass die meisten Core-Oberflächen nur
einen Integrationspunkt brauchen: „die Registry lesen“, nicht „jedes Plugin-Modul speziell behandeln“.

## Callbacks für Conversation-Bindings

Plugins, die eine Conversation binden, können reagieren, wenn eine Genehmigung aufgelöst wird.

Verwenden Sie `api.onConversationBindingResolved(...)`, um einen Callback zu erhalten, nachdem eine Bind-
Anfrage genehmigt oder abgelehnt wurde:

```ts
export default {
  id: "my-plugin",
  register(api) {
    api.onConversationBindingResolved(async (event) => {
      if (event.status === "approved") {
        // Für dieses Plugin + diese Conversation existiert jetzt eine Bindung.
        console.log(event.binding?.conversationId);
        return;
      }

      // Die Anfrage wurde abgelehnt; lokalen Pending-Status bereinigen.
      console.log(event.request.conversation.conversationId);
    });
  },
};
```

Felder der Callback-Nutzlast:

- `status`: `"approved"` oder `"denied"`
- `decision`: `"allow-once"`, `"allow-always"` oder `"deny"`
- `binding`: die aufgelöste Bindung für genehmigte Anfragen
- `request`: die ursprüngliche Anfragenzusammenfassung, Detach-Hinweis, Sender-ID und
  Conversation-Metadaten

Dieser Callback dient nur der Benachrichtigung. Er ändert nicht, wer eine
Conversation binden darf, und er läuft, nachdem die Core-Genehmigungsbehandlung abgeschlossen ist.

## Provider-Laufzeit-Hooks

Provider-Plugins haben drei Ebenen:

- **Manifest-Metadaten** für günstige Lookup-Vorgänge vor der Laufzeit: `providerAuthEnvVars`,
  `providerAuthAliases`, `providerAuthChoices` und `channelEnvVars`.
- **Hooks zur Konfigurationszeit**: `catalog` (Legacy-`discovery`) plus
  `applyConfigDefaults`.
- **Laufzeit-Hooks**: mehr als 40 optionale Hooks für Auth, Modellauflösung,
  Stream-Wrapping, Thinking-Levels, Replay-Richtlinie und Usage-Endpunkte. Siehe
  die vollständige Liste unter [Reihenfolge und Verwendung der Hooks](#hook-order-and-usage).

OpenClaw besitzt weiterhin die generische Agent-Schleife, Failover, Transcript-Verarbeitung und
Tool-Richtlinie. Diese Hooks sind die Erweiterungsoberfläche für provider-spezifisches
Verhalten, ohne einen vollständig benutzerdefinierten Inference-Transport zu benötigen.

Verwenden Sie Manifest-`providerAuthEnvVars`, wenn der Provider env-basierte Zugangsdaten hat,
die generische Auth-/Status-/Model-Picker-Pfade sehen sollen, ohne die Plugin-Laufzeit zu laden.
Verwenden Sie Manifest-`providerAuthAliases`, wenn eine Provider-ID die env-Variablen,
Auth-Profile, konfigurationsgestützte Auth und die API-Key-Onboarding-Auswahl einer anderen Provider-ID
wiederverwenden soll. Verwenden Sie Manifest-`providerAuthChoices`, wenn CLI-Oberflächen für Onboarding/Auth-Auswahl
die Choice-ID, Gruppen-Labels und einfache Auth-Verdrahtung mit nur einem Flag des Providers kennen sollen, ohne die Provider-Laufzeit zu laden.
Behalten Sie Laufzeit-`envVars` des Providers für operatorseitige Hinweise wie Onboarding-Labels oder
Setup-Variablen für OAuth-Client-ID/Client-Secret bei.

Verwenden Sie Manifest-`channelEnvVars`, wenn ein Channel env-gesteuerte Auth oder Einrichtung hat,
die generischer Shell-env-Fallback, Konfigurations-/Statusprüfungen oder Setup-Prompts sehen sollen,
ohne die Channel-Laufzeit zu laden.

### Reihenfolge und Verwendung der Hooks

Für Modell-/Provider-Plugins ruft OpenClaw Hooks grob in dieser Reihenfolge auf.
Die Spalte „Wann verwenden“ ist die schnelle Entscheidungshilfe.

| #   | Hook                              | Funktion                                                                                                       | Wann verwenden                                                                                                                                |
| --- | --------------------------------- | -------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `catalog`                         | Provider-Konfiguration während der `models.json`-Generierung in `models.providers` veröffentlichen            | Der Provider besitzt einen Katalog oder Standardwerte für `base URL`                                                                          |
| 2   | `applyConfigDefaults`             | Provider-eigene globale Konfigurationsstandardwerte während der Konfigurationsmaterialisierung anwenden       | Standardwerte hängen von Auth-Modus, env oder der Semantik der Provider-Modellfamilie ab                                                     |
| --  | _(integrierte Modellauflösung)_   | OpenClaw versucht zuerst den normalen Registry-/Katalogpfad                                                   | _(kein Plugin-Hook)_                                                                                                                          |
| 3   | `normalizeModelId`                | Legacy- oder Preview-Aliasse für Modell-IDs vor der Auflösung normalisieren                                   | Der Provider besitzt Alias-Bereinigung vor der kanonischen Modellauflösung                                                                    |
| 4   | `normalizeTransport`              | `api` / `baseUrl` der Provider-Familie vor der generischen Modellassemblierung normalisieren                  | Der Provider besitzt Transport-Bereinigung für benutzerdefinierte Provider-IDs in derselben Transportfamilie                                 |
| 5   | `normalizeConfig`                 | `models.providers.<id>` vor der Laufzeit-/Provider-Auflösung normalisieren                                    | Der Provider benötigt Konfigurationsbereinigung, die beim Plugin liegen sollte; gebündelte Helper der Google-Familie sichern auch unterstützte Google-Konfigurationseinträge ab |
| 6   | `applyNativeStreamingUsageCompat` | Native Streaming-Usage-Kompatibilitätsumschreibungen auf Konfigurations-Provider anwenden                     | Der Provider benötigt endpunktgesteuerte Korrekturen für native Streaming-Usage-Metadaten                                                    |
| 7   | `resolveConfigApiKey`             | Env-Marker-Auth für Konfigurations-Provider vor dem Laden der Laufzeit-Auth auflösen                          | Der Provider besitzt eine provider-eigene API-Key-Auflösung für env-Marker; `amazon-bedrock` hat hier ebenfalls einen integrierten AWS-env-Marker-Resolver |
| 8   | `resolveSyntheticAuth`            | lokale/self-hosted oder konfigurationsgestützte Auth sichtbar machen, ohne Klartext zu persistieren           | Der Provider kann mit einem synthetischen/lokalen Credential-Marker arbeiten                                                                  |
| 9   | `resolveExternalAuthProfiles`     | Provider-eigene externe Auth-Profile überlagern; Standard für `persistence` ist `runtime-only` für CLI-/App-eigene Zugangsdaten | Der Provider verwendet externe Auth-Zugangsdaten erneut, ohne kopierte Refresh-Tokens zu persistieren; deklarieren Sie `contracts.externalAuthProviders` im Manifest |
| 10  | `shouldDeferSyntheticProfileAuth` | gespeicherte synthetische Profil-Platzhalter hinter env-/konfigurationsgestützte Auth zurückstufen           | Der Provider speichert synthetische Platzhalterprofile, die nicht die höchste Priorität haben sollen                                         |
| 11  | `resolveDynamicModel`             | synchrones Fallback für provider-eigene Modell-IDs, die noch nicht in der lokalen Registry sind               | Der Provider akzeptiert beliebige Upstream-Modell-IDs                                                                                         |
| 12  | `prepareDynamicModel`             | asynchrones Warm-up, danach läuft `resolveDynamicModel` erneut                                                | Der Provider benötigt Netzwerkmetadaten, bevor unbekannte IDs aufgelöst werden können                                                        |
| 13  | `normalizeResolvedModel`          | letzte Umschreibung, bevor der eingebettete Runner das aufgelöste Modell verwendet                            | Der Provider benötigt Transport-Umschreibungen, verwendet aber weiterhin einen Core-Transport                                                 |
| 14  | `contributeResolvedModelCompat`   | Kompatibilitäts-Flags für Vendor-Modelle hinter einem anderen kompatiblen Transport beitragen                 | Der Provider erkennt seine eigenen Modelle auf Proxy-Transporten, ohne die Kontrolle über den Provider zu übernehmen                         |
| 15  | `capabilities`                    | provider-eigene Transcript-/Tooling-Metadaten, die von gemeinsam genutzter Core-Logik verwendet werden       | Der Provider benötigt Besonderheiten für Transcript/Provider-Familie                                                                          |
| 16  | `normalizeToolSchemas`            | Tool-Schemas normalisieren, bevor der eingebettete Runner sie sieht                                           | Der Provider benötigt Schema-Bereinigung für die Transportfamilie                                                                             |
| 17  | `inspectToolSchemas`              | provider-eigene Schema-Diagnosen nach der Normalisierung sichtbar machen                                      | Der Provider möchte Keyword-Warnungen ausgeben, ohne dem Core provider-spezifische Regeln beizubringen                                       |
| 18  | `resolveReasoningOutputMode`      | Vertrag für nativen vs. getaggten Reasoning-Output auswählen                                                  | Der Provider benötigt getaggten Reasoning-/Final-Output statt nativer Felder                                                                  |
| 19  | `prepareExtraParams`              | Normalisierung von Request-Parametern vor generischen Stream-Options-Wrappern                                 | Der Provider benötigt Standard-Request-Parameter oder provider-spezifische Parameter-Bereinigung                                              |
| 20  | `createStreamFn`                  | den normalen Stream-Pfad vollständig durch einen benutzerdefinierten Transport ersetzen                       | Der Provider benötigt ein benutzerdefiniertes Wire-Protokoll, nicht nur einen Wrapper                                                        |
| 21  | `wrapStreamFn`                    | Stream-Wrapper, nachdem generische Wrapper angewendet wurden                                                  | Der Provider benötigt Wrapper für Request-Header/Body/Modell-Kompatibilität ohne benutzerdefinierten Transport                               |
| 22  | `resolveTransportTurnState`       | native Transport-Header oder Metadaten pro Turn anhängen                                                      | Der Provider möchte, dass generische Transporte provider-native Turn-Identität senden                                                         |
| 23  | `resolveWebSocketSessionPolicy`   | native WebSocket-Header oder Session-Cool-down-Richtlinie anhängen                                            | Der Provider möchte, dass generische WS-Transporte Session-Header oder Fallback-Richtlinien abstimmen                                        |
| 24  | `formatApiKey`                    | Formatter für Auth-Profile: gespeichertes Profil wird zum Laufzeit-String `apiKey`                            | Der Provider speichert zusätzliche Auth-Metadaten und benötigt eine benutzerdefinierte Laufzeit-Token-Form                                   |
| 25  | `refreshOAuth`                    | OAuth-Refresh-Override für benutzerdefinierte Refresh-Endpunkte oder Richtlinie bei Refresh-Fehlern          | Der Provider passt nicht zu den gemeinsam genutzten `pi-ai`-Refreshers                                                                        |
| 26  | `buildAuthDoctorHint`             | Reparaturhinweis, der angehängt wird, wenn OAuth-Refresh fehlschlägt                                          | Der Provider benötigt provider-eigene Hinweise zur Auth-Reparatur nach einem Refresh-Fehler                                                  |
| 27  | `matchesContextOverflowError`     | provider-eigener Matcher für Context-Window-Überläufe                                                         | Der Provider hat rohe Overflow-Fehler, die generische Heuristiken übersehen würden                                                           |
| 28  | `classifyFailoverReason`          | provider-eigene Klassifizierung des Failover-Grunds                                                           | Der Provider kann rohe API-/Transportfehler auf Rate-Limit/Überlastung/usw. abbilden                                                         |
| 29  | `isCacheTtlEligible`              | Prompt-Cache-Richtlinie für Proxy-/Backhaul-Provider                                                          | Der Provider benötigt proxy-spezifisches Cache-TTL-Gating                                                                                     |
| 30  | `buildMissingAuthMessage`         | Ersatz für die generische Wiederherstellungsnachricht bei fehlender Auth                                      | Der Provider benötigt einen provider-spezifischen Wiederherstellungshinweis bei fehlender Auth                                                |
| 31  | `suppressBuiltInModel`            | Unterdrückung veralteter Upstream-Modelle plus optionaler nutzerseitiger Fehlerhinweis                       | Der Provider muss veraltete Upstream-Zeilen ausblenden oder durch einen Vendor-Hinweis ersetzen                                              |
| 32  | `augmentModelCatalog`             | synthetische/finale Katalogzeilen, die nach der Erkennung angehängt werden                                    | Der Provider benötigt synthetische Forward-Compat-Zeilen in `models list` und Auswahlfeldern                                                 |
| 33  | `resolveThinkingProfile`          | modellspezifischer `/think`-Level-Satz, Anzeige-Labels und Standardwert                                       | Der Provider stellt für ausgewählte Modelle eine benutzerdefinierte Thinking-Stufenleiter oder binäre Bezeichnung bereit                     |
| 34  | `isBinaryThinking`                | Kompatibilitäts-Hook für Reasoning-Umschaltung an/aus                                                         | Der Provider bietet nur binäres Thinking an/aus an                                                                                            |
| 35  | `supportsXHighThinking`           | Kompatibilitäts-Hook für `xhigh`-Reasoning-Unterstützung                                                      | Der Provider möchte `xhigh` nur für eine Teilmenge von Modellen aktivieren                                                                    |
| 36  | `resolveDefaultThinkingLevel`     | Kompatibilitäts-Hook für den Standardwert von `/think`                                                        | Der Provider besitzt die Standardrichtlinie für `/think` einer Modellfamilie                                                                  |
| 37  | `isModernModelRef`                | Matcher für moderne Modelle für Live-Profilfilter und Smoke-Auswahl                                           | Der Provider besitzt das Matching bevorzugter Modelle für Live/Smoke                                                                          |
| 38  | `prepareRuntimeAuth`              | eine konfigurierte Zugangsinformation unmittelbar vor der Inferenz in das tatsächliche Laufzeit-Token/den Schlüssel umtauschen | Der Provider benötigt einen Token-Austausch oder kurzlebige Anfrage-Zugangsdaten                                                             |
| 39  | `resolveUsageAuth`                | Usage-/Billing-Zugangsdaten für `/usage` und verwandte Statusoberflächen auflösen                             | Der Provider benötigt benutzerdefiniertes Parsing von Usage-/Quota-Token oder andere Usage-Zugangsdaten                                      |
| 40  | `fetchUsageSnapshot`              | provider-spezifische Usage-/Quota-Snapshots abrufen und normalisieren, nachdem Auth aufgelöst wurde          | Der Provider benötigt einen provider-spezifischen Usage-Endpunkt oder Payload-Parser                                                         |
| 41  | `createEmbeddingProvider`         | einen provider-eigenen Embedding-Adapter für Memory/Search erstellen                                          | Das Verhalten von Memory-Embeddings gehört zum Provider-Plugin                                                                                |
| 42  | `buildReplayPolicy`               | eine Replay-Richtlinie zurückgeben, die die Transcript-Verarbeitung für den Provider steuert                  | Der Provider benötigt eine benutzerdefinierte Transcript-Richtlinie (zum Beispiel das Entfernen von Thinking-Blöcken)                        |
| 43  | `sanitizeReplayHistory`           | Replay-Verlauf nach der generischen Transcript-Bereinigung umschreiben                                        | Der Provider benötigt provider-spezifische Replay-Umschreibungen über gemeinsam genutzte Compaction-Helper hinaus                            |
| 44  | `validateReplayTurns`             | endgültige Replay-Turn-Validierung oder Umformung vor dem eingebetteten Runner                                | Der Provider-Transport benötigt nach der generischen Bereinigung eine strengere Turn-Validierung                                             |
| 45  | `onModelSelected`                 | provider-eigene Seiteneffekte nach der Modellauswahl ausführen                                                | Der Provider benötigt Telemetrie oder provider-eigenen Status, wenn ein Modell aktiv wird                                                    |

`normalizeModelId`, `normalizeTransport` und `normalizeConfig` prüfen zuerst das
zugeordnete Provider-Plugin und fallen dann auf andere hook-fähige Provider-Plugins
zurück, bis eines die Modell-ID oder den Transport/die Konfiguration tatsächlich ändert. So bleiben
Alias-/Kompatibilitäts-Provider-Shims funktionsfähig, ohne dass der Aufrufer wissen muss, welches
gebündelte Plugin die Umschreibung besitzt. Wenn kein Provider-Hook einen unterstützten
Google-Familien-Konfigurationseintrag umschreibt, wendet der gebündelte Google-Konfigurations-Normalizer
diese Kompatibilitätsbereinigung weiterhin an.

Wenn der Provider ein vollständig benutzerdefiniertes Wire-Protokoll oder einen benutzerdefinierten Request-Executor benötigt,
ist das eine andere Klasse von Erweiterung. Diese Hooks sind für Provider-Verhalten gedacht,
das weiterhin auf der normalen Inferenzschleife von OpenClaw läuft.

### Provider-Beispiel

```ts
api.registerProvider({
  id: "example-proxy",
  label: "Example Proxy",
  auth: [],
  catalog: {
    order: "simple",
    run: async (ctx) => {
      const apiKey = ctx.resolveProviderApiKey("example-proxy").apiKey;
      if (!apiKey) {
        return null;
      }
      return {
        provider: {
          baseUrl: "https://proxy.example.com/v1",
          apiKey,
          api: "openai-completions",
          models: [{ id: "auto", name: "Auto" }],
        },
      };
    },
  },
  resolveDynamicModel: (ctx) => ({
    id: ctx.modelId,
    name: ctx.modelId,
    provider: "example-proxy",
    api: "openai-completions",
    baseUrl: "https://proxy.example.com/v1",
    reasoning: false,
    input: ["text"],
    cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
    contextWindow: 128000,
    maxTokens: 8192,
  }),
  prepareRuntimeAuth: async (ctx) => {
    const exchanged = await exchangeToken(ctx.apiKey);
    return {
      apiKey: exchanged.token,
      baseUrl: exchanged.baseUrl,
      expiresAt: exchanged.expiresAt,
    };
  },
  resolveUsageAuth: async (ctx) => {
    const auth = await ctx.resolveOAuthToken();
    return auth ? { token: auth.token } : null;
  },
  fetchUsageSnapshot: async (ctx) => {
    return await fetchExampleProxyUsage(ctx.token, ctx.timeoutMs, ctx.fetchFn);
  },
});
```

### Integrierte Beispiele

Gebündelte Provider-Plugins kombinieren die oben genannten Hooks, um den Katalog,
die Auth, das Thinking, das Replay und die Usage-Anforderungen jedes Anbieters abzudecken. Der maßgebliche Hook-Satz lebt bei
jedem Plugin unter `extensions/`; diese Seite veranschaulicht die Formen, statt
die Liste zu spiegeln.

<AccordionGroup>
  <Accordion title="Pass-through-Katalog-Provider">
    OpenRouter, Kilocode, Z.AI, xAI registrieren `catalog` plus
    `resolveDynamicModel` / `prepareDynamicModel`, damit sie Upstream-
    Modell-IDs vor dem statischen Katalog von OpenClaw sichtbar machen können.
  </Accordion>
  <Accordion title="OAuth- und Usage-Endpunkt-Provider">
    GitHub Copilot, Gemini CLI, ChatGPT Codex, MiniMax, Xiaomi, z.ai kombinieren
    `prepareRuntimeAuth` oder `formatApiKey` mit `resolveUsageAuth` +
    `fetchUsageSnapshot`, um Token-Austausch und `/usage`-Integration selbst zu steuern.
  </Accordion>
  <Accordion title="Replay- und Transcript-Bereinigungsfamilien">
    Gemeinsam genutzte benannte Familien (`google-gemini`, `passthrough-gemini`,
    `anthropic-by-model`, `hybrid-anthropic-openai`) erlauben Providern, über
    `buildReplayPolicy` in die Transcript-Richtlinie einzusteigen, statt dass jedes Plugin
    die Bereinigung neu implementiert.
  </Accordion>
  <Accordion title="Nur-Katalog-Provider">
    `byteplus`, `cloudflare-ai-gateway`, `huggingface`, `kimi-coding`, `nvidia`,
    `qianfan`, `synthetic`, `together`, `venice`, `vercel-ai-gateway` und
    `volcengine` registrieren nur `catalog` und nutzen die gemeinsame Inferenzschleife.
  </Accordion>
  <Accordion title="Anthropic-spezifische Stream-Helper">
    Beta-Header, `/fast` / `serviceTier` und `context1m` liegen innerhalb der
    öffentlichen `api.ts`- / `contract-api.ts`-Schnittstelle des Anthropic-Plugins
    (`wrapAnthropicProviderStream`, `resolveAnthropicBetas`,
    `resolveAnthropicFastMode`, `resolveAnthropicServiceTier`) statt im
    generischen SDK.
  </Accordion>
</AccordionGroup>

## Laufzeit-Helper

Plugins können über `api.runtime` auf ausgewählte Core-Helper zugreifen. Für TTS:

```ts
const clip = await api.runtime.tts.textToSpeech({
  text: "Hello from OpenClaw",
  cfg: api.config,
});

const result = await api.runtime.tts.textToSpeechTelephony({
  text: "Hello from OpenClaw",
  cfg: api.config,
});

const voices = await api.runtime.tts.listVoices({
  provider: "elevenlabs",
  cfg: api.config,
});
```

Hinweise:

- `textToSpeech` gibt die normale Core-TTS-Ausgabe-Payload für Datei-/Sprachnotiz-Oberflächen zurück.
- Verwendet die Core-Konfiguration `messages.tts` und die Provider-Auswahl.
- Gibt einen PCM-Audiopuffer + Sample-Rate zurück. Plugins müssen für Provider neu sampeln/kodieren.
- `listVoices` ist je nach Provider optional. Verwenden Sie es für provider-eigene Voice-Picker oder Setup-Flows.
- Voice-Listen können umfangreichere Metadaten wie Gebietsschema, Geschlecht und Personality-Tags für providerbewusste Picker enthalten.
- OpenAI und ElevenLabs unterstützen heute Telephony. Microsoft nicht.

Plugins können auch Speech-Provider über `api.registerSpeechProvider(...)` registrieren.

```ts
api.registerSpeechProvider({
  id: "acme-speech",
  label: "Acme Speech",
  isConfigured: ({ config }) => Boolean(config.messages?.tts),
  synthesize: async (req) => {
    return {
      audioBuffer: Buffer.from([]),
      outputFormat: "mp3",
      fileExtension: ".mp3",
      voiceCompatible: false,
    };
  },
});
```

Hinweise:

- Behalten Sie TTS-Richtlinie, Fallback und Antwortzustellung im Core.
- Verwenden Sie Speech-Provider für anbieterbezogenes Syntheseverhalten.
- Legacy-Microsoft-`edge`-Eingaben werden auf die Provider-ID `microsoft` normalisiert.
- Das bevorzugte Ownership-Modell ist unternehmensorientiert: Ein Vendor-Plugin kann
  Text-, Speech-, Bild- und künftige Medien-Provider besitzen, während OpenClaw diese
  Fähigkeitsverträge erweitert.

Für Bild-/Audio-/Videoverständnis registrieren Plugins einen einzelnen typisierten
Media-Understanding-Provider statt eines generischen Key/Value-Bags:

```ts
api.registerMediaUnderstandingProvider({
  id: "google",
  capabilities: ["image", "audio", "video"],
  describeImage: async (req) => ({ text: "..." }),
  transcribeAudio: async (req) => ({ text: "..." }),
  describeVideo: async (req) => ({ text: "..." }),
});
```

Hinweise:

- Behalten Sie Orchestrierung, Fallback, Konfiguration und Channel-Verdrahtung im Core.
- Behalten Sie anbieterbezogenes Verhalten im Provider-Plugin.
- Additive Erweiterung sollte typisiert bleiben: neue optionale Methoden, neue optionale
  Ergebnisfelder, neue optionale Fähigkeiten.
- Die Videogenerierung folgt bereits demselben Muster:
  - der Core besitzt den Fähigkeitsvertrag und den Laufzeit-Helper
  - Vendor-Plugins registrieren `api.registerVideoGenerationProvider(...)`
  - Feature-/Channel-Plugins nutzen `api.runtime.videoGeneration.*`

Für Laufzeit-Helper des Media-Understanding können Plugins Folgendes aufrufen:

```ts
const image = await api.runtime.mediaUnderstanding.describeImageFile({
  filePath: "/tmp/inbound-photo.jpg",
  cfg: api.config,
  agentDir: "/tmp/agent",
});

const video = await api.runtime.mediaUnderstanding.describeVideoFile({
  filePath: "/tmp/inbound-video.mp4",
  cfg: api.config,
});
```

Für Audiotranskription können Plugins entweder die Media-Understanding-Laufzeit
oder den älteren STT-Alias verwenden:

```ts
const { text } = await api.runtime.mediaUnderstanding.transcribeAudioFile({
  filePath: "/tmp/inbound-audio.ogg",
  cfg: api.config,
  // Optional, wenn der MIME-Typ nicht zuverlässig abgeleitet werden kann:
  mime: "audio/ogg",
});
```

Hinweise:

- `api.runtime.mediaUnderstanding.*` ist die bevorzugte gemeinsame Oberfläche für
  Bild-/Audio-/Videoverständnis.
- Verwendet die Audio-Konfiguration des Core für Media-Understanding (`tools.media.audio`) und die Fallback-Reihenfolge der Provider.
- Gibt `{ text: undefined }` zurück, wenn keine Transkriptionsausgabe erzeugt wird (zum Beispiel bei übersprungenen/nicht unterstützten Eingaben).
- `api.runtime.stt.transcribeAudioFile(...)` bleibt als Kompatibilitätsalias bestehen.

Plugins können auch Hintergrund-Subagent-Läufe über `api.runtime.subagent` starten:

```ts
const result = await api.runtime.subagent.run({
  sessionKey: "agent:main:subagent:search-helper",
  message: "Expand this query into focused follow-up searches.",
  provider: "openai",
  model: "gpt-4.1-mini",
  deliver: false,
});
```

Hinweise:

- `provider` und `model` sind optionale Overrides pro Lauf, keine persistenten Session-Änderungen.
- OpenClaw berücksichtigt diese Override-Felder nur für vertrauenswürdige Aufrufer.
- Für Plugin-eigene Fallback-Läufe müssen Operatoren mit `plugins.entries.<id>.subagent.allowModelOverride: true` explizit zustimmen.
- Verwenden Sie `plugins.entries.<id>.subagent.allowedModels`, um vertrauenswürdige Plugins auf bestimmte kanonische Ziele `provider/model` zu beschränken, oder `"*"`, um jedes Ziel explizit zuzulassen.
- Nicht vertrauenswürdige Plugin-Subagent-Läufe funktionieren weiterhin, aber Override-Anfragen werden abgelehnt, statt stillschweigend auf Fallback umzuschalten.

Für Websuche können Plugins den gemeinsamen Laufzeit-Helper nutzen, statt
in die Tool-Verdrahtung des Agenten einzugreifen:

```ts
const providers = api.runtime.webSearch.listProviders({
  config: api.config,
});

const result = await api.runtime.webSearch.search({
  config: api.config,
  args: {
    query: "OpenClaw plugin runtime helpers",
    count: 5,
  },
});
```

Plugins können Websuche-Provider auch über
`api.registerWebSearchProvider(...)` registrieren.

Hinweise:

- Behalten Sie Provider-Auswahl, Auflösung der Zugangsdaten und gemeinsame Request-Semantik im Core.
- Verwenden Sie Websuche-Provider für anbieterspezifische Suchtransporte.
- `api.runtime.webSearch.*` ist die bevorzugte gemeinsame Oberfläche für Feature-/Channel-Plugins, die Suchverhalten benötigen, ohne vom Agent-Tool-Wrapper abzuhängen.

### `api.runtime.imageGeneration`

```ts
const result = await api.runtime.imageGeneration.generate({
  config: api.config,
  args: { prompt: "A friendly lobster mascot", size: "1024x1024" },
});

const providers = api.runtime.imageGeneration.listProviders({
  config: api.config,
});
```

- `generate(...)`: Ein Bild mit der konfigurierten Provider-Kette für Bildgenerierung erzeugen.
- `listProviders(...)`: Verfügbare Provider für Bildgenerierung und deren Fähigkeiten auflisten.

## Gateway-HTTP-Routen

Plugins können HTTP-Endpunkte mit `api.registerHttpRoute(...)` verfügbar machen.

```ts
api.registerHttpRoute({
  path: "/acme/webhook",
  auth: "plugin",
  match: "exact",
  handler: async (_req, res) => {
    res.statusCode = 200;
    res.end("ok");
    return true;
  },
});
```

Routenfelder:

- `path`: Routenpfad unter dem Gateway-HTTP-Server.
- `auth`: erforderlich. Verwenden Sie `"gateway"`, um normale Gateway-Auth zu verlangen, oder `"plugin"` für Plugin-verwaltete Auth/Webhook-Verifizierung.
- `match`: optional. `"exact"` (Standard) oder `"prefix"`.
- `replaceExisting`: optional. Erlaubt demselben Plugin, seine eigene vorhandene Routenregistrierung zu ersetzen.
- `handler`: gibt `true` zurück, wenn die Route die Anfrage verarbeitet hat.

Hinweise:

- `api.registerHttpHandler(...)` wurde entfernt und verursacht einen Plugin-Ladefehler. Verwenden Sie stattdessen `api.registerHttpRoute(...)`.
- Plugin-Routen müssen `auth` explizit deklarieren.
- Exakte Konflikte bei `path + match` werden abgelehnt, sofern nicht `replaceExisting: true` gesetzt ist, und ein Plugin kann keine Route eines anderen Plugins ersetzen.
- Überlappende Routen mit unterschiedlichen `auth`-Stufen werden abgelehnt. Halten Sie `exact`-/`prefix`-Fallthrough-Ketten nur auf derselben Auth-Stufe.
- Routen mit `auth: "plugin"` erhalten **nicht** automatisch Runtime-Scopes für Operatoren. Sie sind für Plugin-verwaltete Webhooks/Signaturverifizierung gedacht, nicht für privilegierte Gateway-Helper-Aufrufe.
- Routen mit `auth: "gateway"` laufen innerhalb eines Gateway-Request-Runtime-Scopes, aber dieser Scope ist absichtlich konservativ:
  - Shared-Secret-Bearer-Auth (`gateway.auth.mode = "token"` / `"password"`) hält Runtime-Scopes für Plugin-Routen auf `operator.write` fest, selbst wenn der Aufrufer `x-openclaw-scopes` sendet
  - vertrauenswürdige HTTP-Modi mit Identitätsträgern (zum Beispiel `trusted-proxy` oder `gateway.auth.mode = "none"` bei privatem Ingress) berücksichtigen `x-openclaw-scopes` nur, wenn der Header explizit vorhanden ist
  - wenn `x-openclaw-scopes` bei solchen Plugin-Routenanfragen mit Identitätsträgern fehlt, fällt der Runtime-Scope auf `operator.write` zurück
- Praktische Regel: Gehen Sie nicht davon aus, dass eine per Gateway-auth geschützte Plugin-Route implizit eine Admin-Oberfläche ist. Wenn Ihre Route reines Admin-Verhalten benötigt, verlangen Sie einen HTTP-Modus mit Identitätsträgern und dokumentieren Sie den expliziten Header-Vertrag für `x-openclaw-scopes`.

## Plugin-SDK-Importpfade

Verwenden Sie schmale SDK-Unterpfade statt des monolithischen Root-
Barrels `openclaw/plugin-sdk`, wenn Sie neue Plugins erstellen. Zentrale Unterpfade:

| Unterpfad                            | Zweck                                              |
| ------------------------------------ | -------------------------------------------------- |
| `openclaw/plugin-sdk/plugin-entry`   | Primitive für die Plugin-Registrierung             |
| `openclaw/plugin-sdk/channel-core`   | Helper für Channel-Entry/Build                     |
| `openclaw/plugin-sdk/core`           | Generische gemeinsame Helper und Umbrella-Vertrag  |
| `openclaw/plugin-sdk/config-schema`  | Zod-Schema für Root-`openclaw.json` (`OpenClawSchema`) |

Channel-Plugins wählen aus einer Familie schmaler Schnittstellen — `channel-setup`,
`setup-runtime`, `setup-adapter-runtime`, `setup-tools`, `channel-pairing`,
`channel-contract`, `channel-feedback`, `channel-inbound`, `channel-lifecycle`,
`channel-reply-pipeline`, `command-auth`, `secret-input`, `webhook-ingress`,
`channel-targets` und `channel-actions`. Genehmigungsverhalten sollte auf einem
einzigen Vertrag `approvalCapability` konsolidiert werden, statt es über nicht zusammenhängende
Plugin-Felder zu vermischen. Siehe [Channel plugins](/de/plugins/sdk-channel-plugins).

Laufzeit- und Konfigurations-Helper liegen unter passenden Unterpfaden mit `*-runtime`
(`approval-runtime`, `config-runtime`, `infra-runtime`, `agent-runtime`,
`lazy-runtime`, `directory-runtime`, `text-runtime`, `runtime-store` usw.).

<Info>
`openclaw/plugin-sdk/channel-runtime` ist veraltet — ein Kompatibilitäts-Shim für
ältere Plugins. Neuer Code sollte stattdessen schmalere generische Primitive importieren.
</Info>

Repo-interne Einstiegspunkte (pro Root-Paket eines gebündelten Plugins):

- `index.js` — Einstiegspunkt für gebündelte Plugins
- `api.js` — Barrel für Helper/Typen
- `runtime-api.js` — reines Laufzeit-Barrel
- `setup-entry.js` — Einstiegspunkt für Setup-Plugins

Externe Plugins sollten nur `openclaw/plugin-sdk/*`-Unterpfade importieren. Importieren Sie niemals
`src/*` eines anderen Plugin-Pakets aus dem Core oder aus einem anderen Plugin.
Über Fassade geladene Einstiegspunkte bevorzugen den aktiven Laufzeit-Konfigurations-Snapshot, wenn einer
vorhanden ist, und fallen sonst auf die auf der Festplatte aufgelöste Konfigurationsdatei zurück.

Fähigkeitsspezifische Unterpfade wie `image-generation`, `media-understanding`
und `speech` existieren, weil gebündelte Plugins sie heute verwenden. Sie sind nicht
automatisch langfristig eingefrorene externe Verträge — prüfen Sie die relevante SDK-
Referenzseite, wenn Sie sich darauf verlassen.

## Message-Tool-Schemas

Plugins sollten channel-spezifische Schema-Beiträge für `describeMessageTool(...)`
für Nicht-Nachrichten-Primitive wie Reaktionen, Lesebestätigungen und Umfragen besitzen.
Die gemeinsame Send-Darstellung sollte den generischen Vertrag `MessagePresentation`
anstelle von provider-nativen Feldern für Buttons, Components, Blocks oder Cards verwenden.
Siehe [Message Presentation](/de/plugins/message-presentation) für den Vertrag,
Fallback-Regeln, Provider-Zuordnung und die Checkliste für Plugin-Autoren.

Plugins mit Sendefähigkeit deklarieren über Message-Fähigkeiten, was sie rendern können:

- `presentation` für semantische Darstellungsblöcke (`text`, `context`, `divider`, `buttons`, `select`)
- `delivery-pin` für Anfragen zur angehefteten Zustellung

Der Core entscheidet, ob die Darstellung nativ gerendert oder zu Text degradiert wird.
Stellen Sie keine provider-nativen UI-Notfallausgänge aus dem generischen Message-Tool bereit.
Veraltete SDK-Helper für Legacy-native Schemas werden für bestehende
Drittanbieter-Plugins weiterhin exportiert, aber neue Plugins sollten sie nicht verwenden.

## Auflösung von Channel-Zielen

Channel-Plugins sollten channel-spezifische Zielsemantik besitzen. Halten Sie den gemeinsamen
Outbound-Host generisch und verwenden Sie die Oberfläche des Messaging-Adapters für Provider-Regeln:

- `messaging.inferTargetChatType({ to })` entscheidet, ob ein normalisiertes Ziel
  vor der Directory-Suche als `direct`, `group` oder `channel` behandelt werden
  soll.
- `messaging.targetResolver.looksLikeId(raw, normalized)` teilt dem Core mit, ob eine
  Eingabe direkt zur id-artigen Auflösung springen soll statt zur Directory-Suche.
- `messaging.targetResolver.resolveTarget(...)` ist der Plugin-Fallback, wenn der
  Core nach der Normalisierung oder nach einem Directory-Fehlschlag eine abschließende provider-eigene Auflösung benötigt.
- `messaging.resolveOutboundSessionRoute(...)` besitzt den Aufbau der provider-spezifischen Session-
  Route, sobald ein Ziel aufgelöst wurde.

Empfohlene Aufteilung:

- Verwenden Sie `inferTargetChatType` für Kategorieentscheidungen, die vor
  der Suche nach Peers/Gruppen erfolgen sollten.
- Verwenden Sie `looksLikeId` für Prüfungen im Stil „als explizite/native Ziel-ID behandeln“.
- Verwenden Sie `resolveTarget` als provider-spezifischen Normalisierungs-Fallback, nicht für
  breit angelegte Directory-Suche.
- Behalten Sie provider-native IDs wie Chat-IDs, Thread-IDs, JIDs, Handles und Raum-
  IDs in `target`-Werten oder provider-spezifischen Parametern, nicht in generischen SDK-
  Feldern.

## Konfigurationsgestützte Directories

Plugins, die Directory-Einträge aus der Konfiguration ableiten, sollten diese Logik im
Plugin behalten und die gemeinsamen Helper aus
`openclaw/plugin-sdk/directory-runtime` wiederverwenden.

Verwenden Sie dies, wenn ein Channel konfigurationsgestützte Peers/Gruppen benötigt wie:

- durch Allowlist gesteuerte DM-Peers
- konfigurierte Channel-/Gruppenzuordnungen
- kontobezogene statische Directory-Fallbacks

Die gemeinsamen Helper in `directory-runtime` behandeln nur generische Operationen:

- Query-Filterung
- Anwendung von Limits
- Deduping-/Normalisierungs-Helper
- Aufbau von `ChannelDirectoryEntry[]`

Channel-spezifische Kontoinspektion und ID-Normalisierung sollten in der
Plugin-Implementierung bleiben.

## Provider-Kataloge

Provider-Plugins können Modellkataloge für Inferenz definieren mit
`registerProvider({ catalog: { run(...) { ... } } })`.

`catalog.run(...)` gibt dieselbe Form zurück, die OpenClaw in
`models.providers` schreibt:

- `{ provider }` für einen Provider-Eintrag
- `{ providers }` für mehrere Provider-Einträge

Verwenden Sie `catalog`, wenn das Plugin provider-spezifische Modell-IDs, Standardwerte für `base URL`
oder auth-gesteuerte Modellmetadaten besitzt.

`catalog.order` steuert, wann der Katalog eines Plugins relativ zu den
integrierten impliziten Providern von OpenClaw zusammengeführt wird:

- `simple`: einfache API-Key- oder env-gesteuerte Provider
- `profile`: Provider, die erscheinen, wenn Auth-Profile existieren
- `paired`: Provider, die mehrere zusammengehörige Provider-Einträge synthetisieren
- `late`: letzter Durchlauf, nach anderen impliziten Providern

Spätere Provider gewinnen bei Schlüsselkollisionen, daher können Plugins absichtlich einen
integrierten Provider-Eintrag mit derselben Provider-ID überschreiben.

Kompatibilität:

- `discovery` funktioniert weiterhin als Legacy-Alias
- wenn sowohl `catalog` als auch `discovery` registriert sind, verwendet OpenClaw `catalog`

## Schreibgeschützte Channel-Inspektion

Wenn Ihr Plugin einen Channel registriert, implementieren Sie bevorzugt
`plugin.config.inspectAccount(cfg, accountId)` zusammen mit `resolveAccount(...)`.

Warum:

- `resolveAccount(...)` ist der Laufzeitpfad. Er darf annehmen, dass Zugangsdaten
  vollständig materialisiert sind, und kann schnell fehlschlagen, wenn erforderliche Secrets fehlen.
- Schreibgeschützte Befehlswege wie `openclaw status`, `openclaw status --all`,
  `openclaw channels status`, `openclaw channels resolve` und Doctor-/Config-
  Repair-Flows sollten Laufzeit-Zugangsdaten nicht materialisieren müssen, nur um
  die Konfiguration zu beschreiben.

Empfohlenes Verhalten für `inspectAccount(...)`:

- Geben Sie nur beschreibenden Kontostatus zurück.
- Behalten Sie `enabled` und `configured` bei.
- Schließen Sie relevante Felder für Quelle/Status von Zugangsdaten ein, zum Beispiel:
  - `tokenSource`, `tokenStatus`
  - `botTokenSource`, `botTokenStatus`
  - `appTokenSource`, `appTokenStatus`
  - `signingSecretSource`, `signingSecretStatus`
- Sie müssen keine rohen Token-Werte zurückgeben, nur um schreibgeschützte
  Verfügbarkeit zu melden. Die Rückgabe von `tokenStatus: "available"` (und dem passenden Quellfeld)
  reicht für Befehle im Stil von Status aus.
- Verwenden Sie `configured_unavailable`, wenn Zugangsdaten über SecretRef konfiguriert, aber
  im aktuellen Befehlsweg nicht verfügbar sind.

So können schreibgeschützte Befehle „konfiguriert, aber in diesem Befehlsweg nicht verfügbar“
melden, statt abzustürzen oder das Konto fälschlich als nicht konfiguriert zu melden.

## Paket-Packs

Ein Plugin-Verzeichnis kann eine `package.json` mit `openclaw.extensions` enthalten:

```json
{
  "name": "my-pack",
  "openclaw": {
    "extensions": ["./src/safety.ts", "./src/tools.ts"],
    "setupEntry": "./src/setup-entry.ts"
  }
}
```

Jeder Eintrag wird zu einem Plugin. Wenn das Pack mehrere Extensions auflistet, wird die Plugin-ID
zu `name/<fileBase>`.

Wenn Ihr Plugin npm-Abhängigkeiten importiert, installieren Sie sie in diesem Verzeichnis, damit
`node_modules` verfügbar ist (`npm install` / `pnpm install`).

Sicherheitsleitplanke: Jeder Eintrag in `openclaw.extensions` muss nach der Symlink-Auflösung innerhalb des Plugin-
Verzeichnisses bleiben. Einträge, die aus dem Paketverzeichnis ausbrechen, werden
abgelehnt.

Sicherheitshinweis: `openclaw plugins install` installiert Plugin-Abhängigkeiten mit
`npm install --omit=dev --ignore-scripts` (keine Lifecycle-Skripte, keine Entwicklungsabhängigkeiten zur Laufzeit). Halten Sie die Plugin-Abhängigkeits-
Bäume „reines JS/TS“ und vermeiden Sie Pakete, die `postinstall`-Builds erfordern.

Optional: `openclaw.setupEntry` kann auf ein leichtgewichtiges Modul nur für Setup zeigen.
Wenn OpenClaw Setup-Oberflächen für ein deaktiviertes Channel-Plugin benötigt oder
wenn ein Channel-Plugin aktiviert, aber noch nicht konfiguriert ist, lädt es `setupEntry`
anstelle des vollständigen Plugin-Einstiegspunkts. Dadurch bleiben Start und Setup leichter,
wenn Ihr Haupteinstiegspunkt auch Tools, Hooks oder anderen nur zur Laufzeit benötigten
Code verdrahtet.

Optional: `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`
kann ein Channel-Plugin für denselben `setupEntry`-Pfad während der
Pre-Listen-Startphase des Gateway aktivieren, selbst wenn der Channel bereits konfiguriert ist.

Verwenden Sie dies nur, wenn `setupEntry` die Startoberfläche vollständig abdeckt, die
vor dem Beginn des Listen des Gateway existieren muss. In der Praxis bedeutet das, dass der Setup-Einstiegspunkt
jede channel-eigene Fähigkeit registrieren muss, von der der Start abhängt, zum Beispiel:

- die Channel-Registrierung selbst
- alle HTTP-Routen, die verfügbar sein müssen, bevor das Gateway beginnt zuzuhören
- alle Gateway-Methoden, Tools oder Dienste, die in diesem selben Zeitraum vorhanden sein müssen

Wenn Ihr vollständiger Einstiegspunkt noch eine erforderliche Startfähigkeit besitzt, aktivieren Sie
dieses Flag nicht. Behalten Sie das Standardverhalten bei und lassen Sie OpenClaw beim
Start den vollständigen Einstiegspunkt laden.

Gebündelte Channels können auch Helper mit reiner Setup-Vertragsoberfläche veröffentlichen, die der Core
abfragen kann, bevor die vollständige Channel-Laufzeit geladen ist. Die aktuelle Setup-
Promotion-Oberfläche ist:

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

Der Core verwendet diese Oberfläche, wenn er eine Legacy-Konfiguration eines Single-Account-Channels
in `channels.<id>.accounts.*` promoten muss, ohne den vollständigen Plugin-Einstiegspunkt zu laden.
Matrix ist das aktuelle gebündelte Beispiel: Es verschiebt nur Auth-/Bootstrap-Schlüssel in ein
benanntes promotetes Konto, wenn bereits benannte Konten existieren, und es kann einen
konfigurierten nicht-kanonischen Standard-Kontoschlüssel bewahren, statt immer
`accounts.default` zu erstellen.

Diese Setup-Patch-Adapter halten die Erkennung der gebündelten Vertragsoberfläche lazy. Die Importzeit
bleibt gering; die Promotionsoberfläche wird erst bei der ersten Verwendung geladen, statt den
Start des gebündelten Channels beim Modulimport erneut zu betreten.

Wenn diese Startoberflächen Gateway-RPC-Methoden enthalten, behalten Sie sie auf einem
plugin-spezifischen Präfix. Core-Admin-Namespaces (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) bleiben reserviert und werden immer
zu `operator.admin` aufgelöst, selbst wenn ein Plugin einen schmaleren Scope anfordert.

Beispiel:

```json
{
  "name": "@scope/my-channel",
  "openclaw": {
    "extensions": ["./index.ts"],
    "setupEntry": "./setup-entry.ts",
    "startup": {
      "deferConfiguredChannelFullLoadUntilAfterListen": true
    }
  }
}
```

### Channel-Katalogmetadaten

Channel-Plugins können Setup-/Erkennungsmetadaten über `openclaw.channel` und
Installationshinweise über `openclaw.install` bereitstellen. Dadurch bleiben die Core-Katalogdaten frei von Daten.

Beispiel:

```json
{
  "name": "@openclaw/nextcloud-talk",
  "openclaw": {
    "extensions": ["./index.ts"],
    "channel": {
      "id": "nextcloud-talk",
      "label": "Nextcloud Talk",
      "selectionLabel": "Nextcloud Talk (self-hosted)",
      "docsPath": "/channels/nextcloud-talk",
      "docsLabel": "nextcloud-talk",
      "blurb": "Self-hosted-Chat über Nextcloud-Talk-Webhook-Bots.",
      "order": 65,
      "aliases": ["nc-talk", "nc"]
    },
    "install": {
      "npmSpec": "@openclaw/nextcloud-talk",
      "localPath": "<bundled-plugin-local-path>",
      "defaultChoice": "npm"
    }
  }
}
```

Nützliche `openclaw.channel`-Felder über das Minimalbeispiel hinaus:

- `detailLabel`: sekundäres Label für umfangreichere Katalog-/Statusoberflächen
- `docsLabel`: überschreibt den Linktext für den Docs-Link
- `preferOver`: Plugin-/Channel-IDs mit geringerer Priorität, die dieser Katalogeintrag übertreffen soll
- `selectionDocsPrefix`, `selectionDocsOmitLabel`, `selectionExtras`: Textsteuerungen für die Auswahloberfläche
- `markdownCapable`: markiert den Channel als Markdown-fähig für Entscheidungen zur ausgehenden Formatierung
- `exposure.configured`: blendet den Channel aus Oberflächen zur Auflistung konfigurierter Channels aus, wenn auf `false` gesetzt
- `exposure.setup`: blendet den Channel aus interaktiven Setup-/Configure-Auswahlfeldern aus, wenn auf `false` gesetzt
- `exposure.docs`: markiert den Channel für Docs-Navigationsoberflächen als intern/privat
- `showConfigured` / `showInSetup`: Legacy-Aliasse werden aus Kompatibilitätsgründen weiterhin akzeptiert; bevorzugen Sie `exposure`
- `quickstartAllowFrom`: aktiviert für den Channel den standardmäßigen Quickstart-Flow `allowFrom`
- `forceAccountBinding`: verlangt explizites Account-Binding, auch wenn nur ein Konto existiert
- `preferSessionLookupForAnnounceTarget`: bevorzugt Session-Lookup beim Auflösen von Ankündigungszielen

OpenClaw kann auch **externe Channel-Kataloge** zusammenführen (zum Beispiel einen Export aus einer MPM-
Registry). Legen Sie eine JSON-Datei an einem der folgenden Orte ab:

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

Oder verweisen Sie `OPENCLAW_PLUGIN_CATALOG_PATHS` (oder `OPENCLAW_MPM_CATALOG_PATHS`) auf
eine oder mehrere JSON-Dateien (durch Komma/Semikolon/`PATH` getrennt). Jede Datei sollte
`{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }` enthalten. Der Parser akzeptiert auch `"packages"` oder `"plugins"` als Legacy-Aliasse für den Schlüssel `"entries"`.

Generierte Channel-Katalogeinträge und Provider-Installationskatalogeinträge legen
normalisierte Fakten zur Installationsquelle neben den rohen `openclaw.install`-Block. Die
normalisierten Fakten identifizieren, ob die npm-Spezifikation eine exakte Version oder ein schwebender
Selektor ist, ob erwartete Integritätsmetadaten vorhanden sind und ob auch ein lokaler
Quellpfad verfügbar ist. Verbraucher sollten `installSource` als additives optionales Feld behandeln, damit
ältere handgebaute Einträge und Kompatibilitäts-Shims es nicht synthetisieren
müssen. Dadurch können Onboarding und Diagnose
den Zustand der Quellseite erklären, ohne die Plugin-Laufzeit zu importieren.

Offizielle externe npm-Einträge sollten eine exakte `npmSpec` plus
`expectedIntegrity` bevorzugen. Reine Paketnamen und Dist-Tags funktionieren aus
Kompatibilitätsgründen weiterhin, erzeugen aber Warnungen auf der Quellseite, damit sich der Katalog
in Richtung gepinnter, integritätsgeprüfter Installationen bewegen kann, ohne bestehende Plugins zu beschädigen.
Wenn das Onboarding aus einem lokalen Katalogpfad installiert, zeichnet es einen
Eintrag in `plugins.installs` mit `source: "path"` und einem workspace-relativen
`sourcePath` auf, wenn möglich. Der absolute operative Ladepfad bleibt in
`plugins.load.paths`; der Installationsdatensatz vermeidet es, lokale Workstation-
Pfade in langlebige Konfiguration zu duplizieren. Dadurch bleiben lokale Entwicklungsinstallationen für
Diagnosen auf der Quellseite sichtbar, ohne eine zweite rohe Offenlegungsoberfläche
für Dateisystempfade hinzuzufügen.

## Context-Engine-Plugins

Context-Engine-Plugins besitzen die Orchestrierung des Session-Kontexts für Ingest, Zusammenstellung
und Compaction. Registrieren Sie sie aus Ihrem Plugin mit
`api.registerContextEngine(id, factory)` und wählen Sie dann die aktive Engine mit
`plugins.slots.contextEngine`.

Verwenden Sie dies, wenn Ihr Plugin die Standard-
Context-Pipeline ersetzen oder erweitern muss, statt nur Memory-Suche oder Hooks hinzuzufügen.

```ts
import { buildMemorySystemPromptAddition } from "openclaw/plugin-sdk/core";

export default function (api) {
  api.registerContextEngine("lossless-claw", () => ({
    info: { id: "lossless-claw", name: "Lossless Claw", ownsCompaction: true },
    async ingest() {
      return { ingested: true };
    },
    async assemble({ messages, availableTools, citationsMode }) {
      return {
        messages,
        estimatedTokens: 0,
        systemPromptAddition: buildMemorySystemPromptAddition({
          availableTools: availableTools ?? new Set(),
          citationsMode,
        }),
      };
    },
    async compact() {
      return { ok: true, compacted: false };
    },
  }));
}
```

Wenn Ihre Engine den Compaction-Algorithmus **nicht** besitzt, lassen Sie `compact()`
implementiert und delegieren Sie ihn explizit:

```ts
import {
  buildMemorySystemPromptAddition,
  delegateCompactionToRuntime,
} from "openclaw/plugin-sdk/core";

export default function (api) {
  api.registerContextEngine("my-memory-engine", () => ({
    info: {
      id: "my-memory-engine",
      name: "My Memory Engine",
      ownsCompaction: false,
    },
    async ingest() {
      return { ingested: true };
    },
    async assemble({ messages, availableTools, citationsMode }) {
      return {
        messages,
        estimatedTokens: 0,
        systemPromptAddition: buildMemorySystemPromptAddition({
          availableTools: availableTools ?? new Set(),
          citationsMode,
        }),
      };
    },
    async compact(params) {
      return await delegateCompactionToRuntime(params);
    },
  }));
}
```

## Hinzufügen einer neuen Fähigkeit

Wenn ein Plugin Verhalten benötigt, das nicht zur aktuellen API passt, umgehen Sie
das Plugin-System nicht mit einem privaten Direkteingriff. Fügen Sie die fehlende Fähigkeit hinzu.

Empfohlene Reihenfolge:

1. den Core-Vertrag definieren
   Entscheiden Sie, welches gemeinsame Verhalten der Core besitzen soll: Richtlinie, Fallback, Konfigurationszusammenführung,
   Lifecycle, channelseitige Semantik und Form des Laufzeit-Helpers.
2. typisierte Plugin-Registrierungs-/Laufzeitoberflächen hinzufügen
   Erweitern Sie `OpenClawPluginApi` und/oder `api.runtime` um die kleinste nützliche
   typisierte Fähigkeitsoberfläche.
3. Core + Verbraucher in Channels/Features verdrahten
   Channels und Feature-Plugins sollten die neue Fähigkeit über den Core nutzen,
   nicht indem sie direkt eine Vendor-Implementierung importieren.
4. Vendor-Implementierungen registrieren
   Vendor-Plugins registrieren dann ihre Backends für die Fähigkeit.
5. Vertragsabdeckung hinzufügen
   Fügen Sie Tests hinzu, damit Eigentümerschaft und Registrierungsform im Lauf der Zeit explizit bleiben.

So bleibt OpenClaw meinungsstark, ohne auf das Weltbild eines einzelnen
Providers hartkodiert zu werden. Siehe das [Capability Cookbook](/de/plugins/architecture)
für eine konkrete Dateicheckliste und ein durchgearbeitetes Beispiel.

### Checkliste für Fähigkeiten

Wenn Sie eine neue Fähigkeit hinzufügen, sollte die Implementierung diese
Oberflächen normalerweise gemeinsam berühren:

- Core-Vertragstypen in `src/<capability>/types.ts`
- Core-Runner/Laufzeit-Helper in `src/<capability>/runtime.ts`
- Plugin-API-Registrierungsoberfläche in `src/plugins/types.ts`
- Plugin-Registry-Verdrahtung in `src/plugins/registry.ts`
- Plugin-Laufzeit-Exponierung in `src/plugins/runtime/*`, wenn Feature-/Channel-
  Plugins sie nutzen müssen
- Capture-/Test-Helper in `src/test-utils/plugin-registration.ts`
- Assertions für Eigentümerschaft/Vertrag in `src/plugins/contracts/registry.ts`
- Operator-/Plugin-Dokumentation in `docs/`

Wenn eine dieser Oberflächen fehlt, ist das normalerweise ein Zeichen dafür, dass die Fähigkeit
noch nicht vollständig integriert ist.

### Vorlage für Fähigkeiten

Minimales Muster:

```ts
// Core-Vertrag
export type VideoGenerationProviderPlugin = {
  id: string;
  label: string;
  generateVideo: (req: VideoGenerationRequest) => Promise<VideoGenerationResult>;
};

// Plugin-API
api.registerVideoGenerationProvider({
  id: "openai",
  label: "OpenAI",
  async generateVideo(req) {
    return await generateOpenAiVideo(req);
  },
});

// gemeinsamer Laufzeit-Helper für Feature-/Channel-Plugins
const clip = await api.runtime.videoGeneration.generate({
  prompt: "Show the robot walking through the lab.",
  cfg,
});
```

Vertragstestmuster:

```ts
expect(findVideoGenerationProviderIdsForPlugin("openai")).toEqual(["openai"]);
```

Dadurch bleibt die Regel einfach:

- der Core besitzt den Fähigkeitsvertrag + die Orchestrierung
- Vendor-Plugins besitzen Vendor-Implementierungen
- Feature-/Channel-Plugins nutzen Laufzeit-Helper
- Vertragstests halten Eigentümerschaft explizit

## Verwandt

- [Plugin architecture](/de/plugins/architecture) — öffentliches Fähigkeitsmodell und Formen
- [Plugin SDK subpaths](/de/plugins/sdk-subpaths)
- [Plugin SDK setup](/de/plugins/sdk-setup)
- [Building plugins](/de/plugins/building-plugins)
