---
read_when:
    - Implementieren von Provider-Runtime-Hooks, Kanal-Lifecycle oder Package-Packs
    - Ladereihenfolge von Plugins oder Registry-Status debuggen
    - Eine neue Plugin-Capability oder ein Context-Engine-Plugin hinzufügen
summary: 'Interne Architektur von Plugins: Ladepipeline, Registry, Runtime-Hooks, HTTP-Routen und Referenztabellen'
title: Interne Architektur von Plugins
x-i18n:
    generated_at: "2026-04-25T13:50:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0e505155ee2acc84f7f26fa81b62121f03a998b249886d74f798c0f258bd8da4
    source_path: plugins/architecture-internals.md
    workflow: 15
---

Für das öffentliche Capability-Modell, Plugin-Formen sowie Verträge zu Ownership/Ausführung siehe [Plugin architecture](/de/plugins/architecture). Diese Seite ist die
Referenz für die internen Mechanismen: Ladepipeline, Registry, Runtime-Hooks,
Gateway-HTTP-Routen, Importpfade und Schematabellen.

## Ladepipeline

Beim Start macht OpenClaw ungefähr Folgendes:

1. potenzielle Plugin-Roots entdecken
2. native oder kompatible Bundle-Manifeste und Paketmetadaten lesen
3. unsichere Kandidaten ablehnen
4. Plugin-Konfiguration normalisieren (`plugins.enabled`, `allow`, `deny`, `entries`,
   `slots`, `load.paths`)
5. Aktivierung für jeden Kandidaten entscheiden
6. aktivierte native Module laden: gebaute gebündelte Module verwenden einen nativen Loader;
   ungebaute native Plugins verwenden jiti
7. native Hooks `register(api)` aufrufen und Registrierungen in die Plugin-Registry sammeln
8. die Registry für Befehls-/Runtime-Oberflächen bereitstellen

<Note>
`activate` ist ein veralteter Alias für `register` — der Loader löst auf, was vorhanden ist (`def.register ?? def.activate`), und ruft es am selben Punkt auf. Alle gebündelten Plugins verwenden `register`; bevorzugen Sie `register` für neue Plugins.
</Note>

Die Sicherheitsprüfungen erfolgen **vor** der Laufzeitausführung. Kandidaten werden blockiert,
wenn der Einstiegspunkt aus der Plugin-Root ausbricht, der Pfad weltweit beschreibbar ist oder
die Besitzverhältnisse des Pfads bei nicht gebündelten Plugins verdächtig wirken.

### Manifest-first-Verhalten

Das Manifest ist die Source of Truth der Control Plane. OpenClaw verwendet es, um:

- das Plugin zu identifizieren
- deklarierte Kanäle/Skills/Config-Schema oder Bundle-Capabilities zu entdecken
- `plugins.entries.<id>.config` zu validieren
- Labels/Platzhalter der Control UI zu erweitern
- Installations-/Katalogmetadaten anzuzeigen
- günstige Aktivierungs- und Setup-Deskriptoren zu bewahren, ohne die Plugin-Runtime zu laden

Bei nativen Plugins ist das Runtime-Modul der Teil der Data Plane. Es registriert
tatsächliches Verhalten wie Hooks, Tools, Befehle oder Provider-Flows.

Optionale Manifest-Blöcke `activation` und `setup` bleiben in der Control Plane.
Sie sind rein metadatenbasierte Deskriptoren für Aktivierungsplanung und Setup-Erkennung;
sie ersetzen weder Runtime-Registrierung, `register(...)` noch `setupEntry`.
Die ersten Live-Aktivierungs-Consumer verwenden jetzt Manifest-Hinweise für Befehle, Kanäle und Provider,
um das Laden von Plugins vor einer breiteren Materialisierung der Registry einzugrenzen:

- CLI-Laden wird auf Plugins eingegrenzt, die den angeforderten primären Befehl besitzen
- Kanal-Setup/Plugin-Auflösung wird auf Plugins eingegrenzt, die die angeforderte
  Kanal-ID besitzen
- explizite Provider-Setup-/Runtime-Auflösung wird auf Plugins eingegrenzt, die die
  angeforderte Provider-ID besitzen

Der Aktivierungsplaner stellt sowohl eine API nur für IDs für bestehende Aufrufer als auch eine
Plan-API für neue Diagnosefunktionen bereit. Planeinträge melden, warum ein Plugin ausgewählt wurde,
und trennen explizite Planer-Hinweise aus `activation.*` von Manifest-Ownership-
Fallbacks wie `providers`, `channels`, `commandAliases`, `setup.providers`,
`contracts.tools` und Hooks. Diese Trennung der Gründe ist die Kompatibilitätsgrenze:
bestehende Plugin-Metadaten funktionieren weiter, während neuer Code breite Hinweise
oder Fallback-Verhalten erkennen kann, ohne die Semantik des Runtime-Ladens zu ändern.

Die Setup-Erkennung bevorzugt jetzt Descriptor-eigene IDs wie `setup.providers` und
`setup.cliBackends`, um Kandidaten-Plugins einzugrenzen, bevor sie auf
`setup-api` für Plugins zurückfällt, die weiterhin Setup-Hooks zur Laufzeit benötigen. Der Provider-
Setup-Flow verwendet zuerst Manifest-`providerAuthChoices` und fällt dann aus
Kompatibilitätsgründen auf Runtime-Wizard-Choices und Install-Katalog-Choices zurück. Explizites
`setup.requiresRuntime: false` ist eine descriptorbasierte Abbruchgrenze; weggelassenes
`requiresRuntime` behält für Kompatibilität den veralteten `setup-api`-Fallback bei. Wenn mehr
als ein entdecktes Plugin dieselbe normalisierte Setup-Provider- oder CLI-
Backend-ID beansprucht, verweigert die Setup-Suche den mehrdeutigen Owner, statt sich
auf die Entdeckungsreihenfolge zu verlassen. Wenn Setup-Runtime tatsächlich ausgeführt wird, melden
Registry-Diagnosen Abweichungen zwischen `setup.providers` / `setup.cliBackends` und den Providern oder CLI-
Backends, die von setup-api registriert wurden, ohne veraltete Plugins zu blockieren.

### Was der Loader cached

OpenClaw behält kurze prozessinterne Caches für:

- Discovery-Ergebnisse
- Registry-Daten aus Manifesten
- geladene Plugin-Registries

Diese Caches verringern sprunghafte Startlast und den Overhead wiederholter Befehle. Es ist sicher,
sie als kurzlebige Performance-Caches und nicht als Persistenz zu betrachten.

Hinweis zur Performance:

- Setzen Sie `OPENCLAW_DISABLE_PLUGIN_DISCOVERY_CACHE=1` oder
  `OPENCLAW_DISABLE_PLUGIN_MANIFEST_CACHE=1`, um diese Caches zu deaktivieren.
- Passen Sie Cache-Fenster mit `OPENCLAW_PLUGIN_DISCOVERY_CACHE_MS` und
  `OPENCLAW_PLUGIN_MANIFEST_CACHE_MS` an.

## Registry-Modell

Geladene Plugins mutieren nicht direkt beliebige globale Core-Zustände. Sie registrieren sich in einer
zentralen Plugin-Registry.

Die Registry verfolgt:

- Plugin-Records (Identität, Quelle, Ursprung, Status, Diagnose)
- Tools
- veraltete Hooks und typisierte Hooks
- Kanäle
- Provider
- Gateway-RPC-Handler
- HTTP-Routen
- CLI-Registrars
- Hintergrunddienste
- plugin-eigene Befehle

Core-Features lesen dann aus dieser Registry, statt direkt mit Plugin-Modulen zu sprechen.
Dadurch bleibt das Laden unidirektional:

- Plugin-Modul -> Registrierung in der Registry
- Core-Runtime -> Konsum aus der Registry

Diese Trennung ist wichtig für die Wartbarkeit. Sie bedeutet, dass die meisten Core-Oberflächen nur
einen Integrationspunkt brauchen: „Registry lesen“ statt „jedes Plugin-Modul speziell behandeln“.

## Conversation-Binding-Callbacks

Plugins, die eine Unterhaltung binden, können reagieren, wenn eine Genehmigung aufgelöst wird.

Verwenden Sie `api.onConversationBindingResolved(...)`, um einen Callback zu erhalten, nachdem eine Bindungs-
Anfrage genehmigt oder abgelehnt wurde:

```ts
export default {
  id: "my-plugin",
  register(api) {
    api.onConversationBindingResolved(async (event) => {
      if (event.status === "approved") {
        // Für dieses Plugin + diese Unterhaltung existiert jetzt eine Bindung.
        console.log(event.binding?.conversationId);
        return;
      }

      // Die Anfrage wurde abgelehnt; lokalen Pending-Status bereinigen.
      console.log(event.request.conversation.conversationId);
    });
  },
};
```

Felder der Callback-Payload:

- `status`: `"approved"` oder `"denied"`
- `decision`: `"allow-once"`, `"allow-always"` oder `"deny"`
- `binding`: die aufgelöste Bindung für genehmigte Anfragen
- `request`: die ursprüngliche Anfragesummary, Detach-Hinweis, Absender-ID und
  Unterhaltungsmetadaten

Dieser Callback dient nur zur Benachrichtigung. Er ändert nicht, wer eine Unterhaltung
binden darf, und läuft, nachdem die Core-Behandlung der Genehmigung abgeschlossen ist.

## Provider-Runtime-Hooks

Provider-Plugins haben drei Ebenen:

- **Manifest-Metadaten** für günstige Lookups vor der Runtime:
  `setup.providers[].envVars`, veraltete Kompatibilität `providerAuthEnvVars`,
  `providerAuthAliases`, `providerAuthChoices` und `channelEnvVars`.
- **Hooks zur Konfigurationszeit**: `catalog` (veraltet `discovery`) plus
  `applyConfigDefaults`.
- **Runtime-Hooks**: 40+ optionale Hooks für Auth, Modellauflösung,
  Stream-Wrapping, Denkstufen, Replay-Richtlinie und Usage-Endpunkte. Siehe
  die vollständige Liste unter [Hook-Reihenfolge und Verwendung](#hook-order-and-usage).

OpenClaw besitzt weiterhin die generische Agentenschleife, Failover, Transcript-Verarbeitung und
Tool-Richtlinie. Diese Hooks sind die Erweiterungsoberfläche für providerspezifisches
Verhalten, ohne dass ein vollständig eigener Inference-Transport erforderlich ist.

Verwenden Sie Manifest-`setup.providers[].envVars`, wenn der Provider env-basierte
Anmeldedaten hat, die generische Pfade für Auth/Status/Model-Picker sehen sollen, ohne die Plugin-Runtime zu
laden. Veraltetes `providerAuthEnvVars` wird im Kompatibilitätsadapter während des
Deprecation-Fensters weiterhin gelesen, und nicht gebündelte Plugins, die es verwenden, erhalten
eine Manifest-Diagnose. Verwenden Sie Manifest-`providerAuthAliases`, wenn eine Provider-ID die
env vars, Auth-Profile, config-gestützte Authentifizierung und die API-Key-Onboarding-Auswahl einer anderen Provider-ID wiederverwenden soll. Verwenden Sie Manifest-
`providerAuthChoices`, wenn Onboarding-/Auth-Choice-CLI-Oberflächen die Choice-ID, Gruppenlabels und einfache One-Flag-Auth-Verkabelung des Providers kennen sollen, ohne die Provider-Runtime zu laden. Behalten Sie `envVars` in der Provider-
Runtime für operatorseitige Hinweise wie Onboarding-Labels oder Setup-Variablen für OAuth-
client-id/client-secret.

Verwenden Sie Manifest-`channelEnvVars`, wenn ein Kanal env-gesteuerte Auth oder Setup hat, die
generische Shell-env-Fallbacks, Config-/Statusprüfungen oder Setup-Prompts sehen sollen,
ohne die Kanal-Runtime zu laden.

### Hook-Reihenfolge und Verwendung

Für Modell-/Provider-Plugins ruft OpenClaw Hooks in ungefähr dieser Reihenfolge auf.
Die Spalte „When to use“ ist der schnelle Entscheidungsleitfaden.

| #   | Hook                              | Was er tut                                                                                                     | Wann verwenden                                                                                                                                 |
| --- | --------------------------------- | -------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `catalog`                         | Provider-Konfiguration während der Generierung von `models.json` in `models.providers` veröffentlichen        | Provider besitzt einen Katalog oder Standardwerte für `baseUrl`                                                                                |
| 2   | `applyConfigDefaults`             | Provider-eigene globale Konfigurationsstandardwerte während der Materialisierung der Konfiguration anwenden    | Standardwerte hängen von Auth-Modus, Env oder Semantik der Provider-Modellfamilie ab                                                          |
| --  | _(built-in model lookup)_         | OpenClaw versucht zuerst den normalen Pfad über Registry/Katalog                                               | _(kein Plugin-Hook)_                                                                                                                           |
| 3   | `normalizeModelId`                | Veraltete oder Preview-Aliasse von Modell-IDs vor dem Lookup normalisieren                                    | Provider besitzt Alias-Bereinigung vor der kanonischen Modellauflösung                                                                         |
| 4   | `normalizeTransport`              | `api` / `baseUrl` einer Provider-Familie vor der generischen Modellzusammenstellung normalisieren             | Provider besitzt Transport-Bereinigung für benutzerdefinierte Provider-IDs in derselben Transportfamilie                                      |
| 5   | `normalizeConfig`                 | `models.providers.<id>` vor Laufzeit-/Provider-Auflösung normalisieren                                        | Provider benötigt Konfigurationsbereinigung, die beim Plugin liegen sollte; gebündelte Hilfen für die Google-Familie stützen außerdem unterstützte Google-Konfigurationseinträge ab |
| 6   | `applyNativeStreamingUsageCompat` | Native Rewrites für Streaming-Usage-Kompatibilität auf Konfigurationsprovider anwenden                        | Provider benötigt endpointgesteuerte Korrekturen für native Streaming-Usage-Metadaten                                                         |
| 7   | `resolveConfigApiKey`             | Authentifizierung per Env-Marker für Konfigurationsprovider vor dem Laden der Runtime-Authentifizierung auflösen | Provider besitzt provider-eigene API-Key-Auflösung per Env-Marker; `amazon-bedrock` hat hier außerdem einen eingebauten AWS-Env-Marker-Resolver |
| 8   | `resolveSyntheticAuth`            | Lokale/self-hosted oder konfigurationsgestützte Authentifizierung bereitstellen, ohne Klartext zu persistieren | Provider kann mit einem synthetischen/lokalen Marker für Anmeldedaten arbeiten                                                                |
| 9   | `resolveExternalAuthProfiles`     | Provider-eigene externe Auth-Profile überlagern; Standard für `persistence` ist `runtime-only` für CLI-/App-eigene Anmeldedaten | Provider verwendet externe Auth-Anmeldedaten wieder, ohne kopierte Refresh-Tokens zu persistieren; deklarieren Sie `contracts.externalAuthProviders` im Manifest |
| 10  | `shouldDeferSyntheticProfileAuth` | Gespeicherte synthetische Platzhalterprofile hinter env-/konfigurationsgestützte Authentifizierung zurückstellen | Provider speichert synthetische Platzhalterprofile, die keine Priorität haben sollten                                                         |
| 11  | `resolveDynamicModel`             | Synchroner Fallback für provider-eigene Modell-IDs, die noch nicht in der lokalen Registry stehen            | Provider akzeptiert beliebige Upstream-Modell-IDs                                                                                              |
| 12  | `prepareDynamicModel`             | Asynchrone Vorwärmung, dann wird `resolveDynamicModel` erneut ausgeführt                                       | Provider benötigt Netzwerkmetadaten, bevor unbekannte IDs aufgelöst werden können                                                             |
| 13  | `normalizeResolvedModel`          | Letzte Umschreibung, bevor der eingebettete Runner das aufgelöste Modell verwendet                             | Provider benötigt Transport-Rewrites, verwendet aber weiterhin einen Core-Transport                                                            |
| 14  | `contributeResolvedModelCompat`   | Kompatibilitäts-Flags für Vendor-Modelle hinter einem anderen kompatiblen Transport beisteuern               | Provider erkennt eigene Modelle auf Proxy-Transporten, ohne den Provider zu übernehmen                                                        |
| 15  | `capabilities`                    | Provider-eigene Transcript-/Tooling-Metadaten, die von gemeinsamer Core-Logik verwendet werden               | Provider benötigt Besonderheiten der Transcript-/Provider-Familie                                                                              |
| 16  | `normalizeToolSchemas`            | Tool-Schemas normalisieren, bevor der eingebettete Runner sie sieht                                           | Provider benötigt Schema-Bereinigung für die Transportfamilie                                                                                  |
| 17  | `inspectToolSchemas`              | Provider-eigene Schema-Diagnosen nach der Normalisierung bereitstellen                                        | Provider möchte Schlüsselwort-Warnungen anzeigen, ohne dem Core providerspezifische Regeln beizubringen                                       |
| 18  | `resolveReasoningOutputMode`      | Vertrag für native vs. markierte Reasoning-Ausgabe auswählen                                                  | Provider benötigt markierte Reasoning-/Final-Ausgabe statt nativer Felder                                                                      |
| 19  | `prepareExtraParams`              | Normalisierung von Anforderungsparametern vor generischen Wrappern für Stream-Optionen                        | Provider benötigt Standard-Anforderungsparameter oder providerbezogene Bereinigung von Parametern                                              |
| 20  | `createStreamFn`                  | Den normalen Stream-Pfad vollständig durch einen benutzerdefinierten Transport ersetzen                       | Provider benötigt ein eigenes Wire-Protokoll, nicht nur einen Wrapper                                                                          |
| 21  | `wrapStreamFn`                    | Stream-Wrapper, nachdem generische Wrapper angewendet wurden                                                  | Provider benötigt Wrapper für Header/Body/Modell-Kompatibilität der Anfrage ohne benutzerdefinierten Transport                                |
| 22  | `resolveTransportTurnState`       | Native Header oder Metadaten pro Turn an den Transport anhängen                                               | Provider möchte, dass generische Transporte providernative Turn-Identität senden                                                               |
| 23  | `resolveWebSocketSessionPolicy`   | Native WebSocket-Header oder Session-Cool-down-Richtlinie anhängen                                            | Provider möchte, dass generische WS-Transporte Session-Header oder Fallback-Richtlinien abstimmen                                             |
| 24  | `formatApiKey`                    | Formatter für Auth-Profile: gespeichertes Profil wird zur Runtime-Zeichenfolge `apiKey`                      | Provider speichert zusätzliche Auth-Metadaten und benötigt eine benutzerdefinierte Runtime-Tokenform                                          |
| 25  | `refreshOAuth`                    | Überschreibung für OAuth-Refresh bei benutzerdefinierten Refresh-Endpunkten oder Richtlinien bei Refresh-Fehlern | Provider passt nicht zu den gemeinsamen `pi-ai`-Refreshern                                                                                     |
| 26  | `buildAuthDoctorHint`             | Reparaturhinweis, der angehängt wird, wenn OAuth-Refresh fehlschlägt                                          | Provider benötigt provider-eigene Auth-Reparaturhinweise nach einem fehlgeschlagenen Refresh                                                  |
| 27  | `matchesContextOverflowError`     | Provider-eigener Matcher für Überläufe des Kontextfensters                                                    | Provider hat rohe Overflow-Fehler, die generische Heuristiken übersehen würden                                                                |
| 28  | `classifyFailoverReason`          | Provider-eigene Klassifikation des Failover-Grunds                                                            | Provider kann rohe API-/Transportfehler auf Rate Limit/Überlastung usw. abbilden                                                              |
| 29  | `isCacheTtlEligible`              | Richtlinie für Prompt-Cache bei Proxy-/Backhaul-Providern                                                     | Provider benötigt proxiespezifische Steuerung für Cache-TTL                                                                                    |
| 30  | `buildMissingAuthMessage`         | Ersatz für die generische Wiederherstellungsnachricht bei fehlender Authentifizierung                         | Provider benötigt einen providerspezifischen Hinweis zur Wiederherstellung bei fehlender Authentifizierung                                     |
| 31  | `suppressBuiltInModel`            | Unterdrückung veralteter Upstream-Modelle plus optionaler benutzerseitiger Fehlerhinweis                     | Provider muss veraltete Upstream-Zeilen ausblenden oder durch einen Vendor-Hinweis ersetzen                                                   |
| 32  | `augmentModelCatalog`             | Synthetische/finale Katalogzeilen nach der Discovery anhängen                                                 | Provider benötigt synthetische Zeilen für Vorwärtskompatibilität in `models list` und Pickern                                                 |
| 33  | `resolveThinkingProfile`          | Modellbezogener `/think`-Levelsatz, Anzeigelabels und Standard                                                | Provider stellt eine benutzerdefinierte Thinking-Leiter oder ein binäres Label für ausgewählte Modelle bereit                                 |
| 34  | `isBinaryThinking`                | Kompatibilitäts-Hook für On/Off-Reasoning-Toggle                                                              | Provider unterstützt nur binäres Thinking an/aus                                                                                               |
| 35  | `supportsXHighThinking`           | Kompatibilitäts-Hook für `xhigh`-Reasoning-Unterstützung                                                      | Provider möchte `xhigh` nur für eine Teilmenge von Modellen                                                                                    |
| 36  | `resolveDefaultThinkingLevel`     | Kompatibilitäts-Hook für den Standardwert von `/think`                                                        | Provider besitzt die Standardrichtlinie für `/think` einer Modellfamilie                                                                       |
| 37  | `isModernModelRef`                | Matcher für moderne Modelle für Filter von Live-Profilen und Smoke-Auswahl                                    | Provider besitzt das Matching bevorzugter Modelle für Live/Smoke                                                                              |
| 38  | `prepareRuntimeAuth`              | Tauscht konfigurierte Anmeldedaten direkt vor der Inferenz in das tatsächliche Runtime-Token/den tatsächlichen Schlüssel um | Provider benötigt einen Tokentausch oder kurzlebige Anmeldedaten für Anfragen                                                                |
| 39  | `resolveUsageAuth`                | Löst Anmeldedaten für Usage/Abrechnung für `/usage` und verwandte Statusoberflächen auf                       | Provider benötigt benutzerdefiniertes Parsing von Usage-/Quota-Token oder andere Anmeldedaten für Usage                                      |
| 40  | `fetchUsageSnapshot`              | Provider-spezifische Usage-/Quota-Snapshots abrufen und normalisieren, nachdem die Authentifizierung aufgelöst wurde | Provider benötigt einen providerspezifischen Usage-Endpunkt oder einen Payload-Parser                                                        |
| 41  | `createEmbeddingProvider`         | Einen provider-eigenen Embedding-Adapter für Memory/Search erstellen                                          | Verhalten von Memory-Embeddings gehört zum Provider-Plugin                                                                                    |
| 42  | `buildReplayPolicy`               | Eine Replay-Richtlinie zurückgeben, die die Transcript-Verarbeitung für den Provider steuert                  | Provider benötigt eine benutzerdefinierte Transcript-Richtlinie (zum Beispiel Entfernen von Thinking-Blöcken)                                |
| 43  | `sanitizeReplayHistory`           | Replay-Verlauf nach der generischen Transcript-Bereinigung umschreiben                                        | Provider benötigt provider-spezifische Replay-Rewrites über gemeinsame Compaction-Helfer hinaus                                              |
| 44  | `validateReplayTurns`             | Endgültige Validierung oder Umformung von Replay-Turns vor dem eingebetteten Runner                           | Provider-Transport benötigt strengere Turn-Validierung nach der generischen Bereinigung                                                      |
| 45  | `onModelSelected`                 | Provider-eigene Side Effects nach der Modellauswahl ausführen                                                 | Provider benötigt Telemetrie oder provider-eigenen Zustand, wenn ein Modell aktiv wird                                                       |

`normalizeModelId`, `normalizeTransport` und `normalizeConfig` prüfen zuerst das
gematchte Provider-Plugin und fallen dann durch andere hook-fähige Provider-Plugins,
bis eines die Modell-ID oder den Transport/die Konfiguration tatsächlich ändert. Dadurch bleiben
Alias-/Kompatibilitäts-Shims für Provider funktionsfähig, ohne dass der Aufrufer wissen muss, welches
gebündelte Plugin die Umschreibung besitzt. Wenn kein Provider-Hook einen unterstützten
Google-Familien-Konfigurationseintrag umschreibt, greift weiterhin der gebündelte Google-Konfigurations-Normalisierer,
um diese Kompatibilitätsbereinigung anzuwenden.

Wenn der Provider ein vollständig benutzerdefiniertes Wire-Protokoll oder einen benutzerdefinierten
Request-Executor benötigt, ist das eine andere Klasse von Erweiterung. Diese Hooks sind für Provider-Verhalten gedacht,
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

### Eingebaute Beispiele

Gebündelte Provider-Plugins kombinieren die oben genannten Hooks, um zu den Anforderungen jedes Vendors
für Katalog, Authentifizierung, Thinking, Replay und Usage zu passen. Die maßgebliche Hook-Menge lebt bei
jedem Plugin unter `extensions/`; diese Seite veranschaulicht die Formen, statt
die Liste zu spiegeln.

<AccordionGroup>
  <Accordion title="Pass-through-Katalogprovider">
    OpenRouter, Kilocode, Z.AI, xAI registrieren `catalog` plus
    `resolveDynamicModel` / `prepareDynamicModel`, damit sie Upstream-
    Modell-IDs vor dem statischen Katalog von OpenClaw bereitstellen können.
  </Accordion>
  <Accordion title="OAuth- und Usage-Endpunkt-Provider">
    GitHub Copilot, Gemini CLI, ChatGPT Codex, MiniMax, Xiaomi, z.ai kombinieren
    `prepareRuntimeAuth` oder `formatApiKey` mit `resolveUsageAuth` +
    `fetchUsageSnapshot`, um Tokentausch und Integration von `/usage` zu besitzen.
  </Accordion>
  <Accordion title="Replay- und Transcript-Bereinigungsfamilien">
    Gemeinsame benannte Familien (`google-gemini`, `passthrough-gemini`,
    `anthropic-by-model`, `hybrid-anthropic-openai`) lassen Provider
    über `buildReplayPolicy` an Transcript-Richtlinien teilnehmen, statt dass jedes Plugin
    die Bereinigung neu implementiert.
  </Accordion>
  <Accordion title="Nur-Katalog-Provider">
    `byteplus`, `cloudflare-ai-gateway`, `huggingface`, `kimi-coding`, `nvidia`,
    `qianfan`, `synthetic`, `together`, `venice`, `vercel-ai-gateway` und
    `volcengine` registrieren nur `catalog` und verwenden die gemeinsame Inferenzschleife.
  </Accordion>
  <Accordion title="Anthropic-spezifische Stream-Helfer">
    Beta-Header, `/fast` / `serviceTier` und `context1m` liegen innerhalb der
    öffentlichen Naht `api.ts` / `contract-api.ts` des Anthropic-Plugins
    (`wrapAnthropicProviderStream`, `resolveAnthropicBetas`,
    `resolveAnthropicFastMode`, `resolveAnthropicServiceTier`) statt im
    generischen SDK.
  </Accordion>
</AccordionGroup>

## Runtime-Helfer

Plugins können über `api.runtime` auf ausgewählte Core-Helfer zugreifen. Für TTS:

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
- Verwendet die Core-Konfiguration `messages.tts` und Provider-Auswahl.
- Gibt PCM-Audiopuffer + Abtastrate zurück. Plugins müssen für Provider neu samplen/kodieren.
- `listVoices` ist pro Provider optional. Verwenden Sie es für Vendor-eigene Voice-Picker oder Setup-Flows.
- Voice-Listen können reichhaltigere Metadaten wie Locale, Geschlecht und Persönlichkeitstags für providerbewusste Picker enthalten.
- OpenAI und ElevenLabs unterstützen heute Telefonie. Microsoft nicht.

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
- Verwenden Sie Speech-Provider für Vendor-eigenes Syntheseverhalten.
- Veraltete Microsoft-Eingabe `edge` wird auf die Provider-ID `microsoft` normalisiert.
- Das bevorzugte Ownership-Modell ist unternehmensorientiert: Ein Vendor-Plugin kann
  Text-, Speech-, Bild- und zukünftige Medienprovider besitzen, wenn OpenClaw diese
  Capability-Verträge erweitert.

Für Bild-/Audio-/Videoverständnis registrieren Plugins einen typisierten
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

- Behalten Sie Orchestrierung, Fallback, Konfiguration und Kanalverdrahtung im Core.
- Behalten Sie Vendor-Verhalten im Provider-Plugin.
- Additive Erweiterung sollte typisiert bleiben: neue optionale Methoden, neue optionale
  Ergebnisfelder, neue optionale Capabilities.
- Videogenerierung folgt bereits demselben Muster:
  - der Core besitzt den Capability-Vertrag und den Runtime-Helfer
  - Vendor-Plugins registrieren `api.registerVideoGenerationProvider(...)`
  - Feature-/Kanal-Plugins verwenden `api.runtime.videoGeneration.*`

Für Runtime-Helfer des Medienverständnisses können Plugins Folgendes aufrufen:

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

Für Audiotranskription können Plugins entweder die Runtime des Medienverständnisses
oder den älteren STT-Alias verwenden:

```ts
const { text } = await api.runtime.mediaUnderstanding.transcribeAudioFile({
  filePath: "/tmp/inbound-audio.ogg",
  cfg: api.config,
  // Optional, wenn MIME nicht zuverlässig abgeleitet werden kann:
  mime: "audio/ogg",
});
```

Hinweise:

- `api.runtime.mediaUnderstanding.*` ist die bevorzugte gemeinsame Oberfläche für
  Bild-/Audio-/Videoverständnis.
- Verwendet die Audio-Konfiguration des Core-Medienverständnisses (`tools.media.audio`) und die Fallback-Reihenfolge für Provider.
- Gibt `{ text: undefined }` zurück, wenn keine Transkriptionsausgabe erzeugt wird (zum Beispiel bei übersprungener/nicht unterstützter Eingabe).
- `api.runtime.stt.transcribeAudioFile(...)` bleibt als Kompatibilitätsalias erhalten.

Plugins können über `api.runtime.subagent` auch Hintergrundläufe von Subagents starten:

```ts
const result = await api.runtime.subagent.run({
  sessionKey: "agent:main:subagent:search-helper",
  message: "Erweitere diese Abfrage zu fokussierten Nachfolgesuchen.",
  provider: "openai",
  model: "gpt-4.1-mini",
  deliver: false,
});
```

Hinweise:

- `provider` und `model` sind optionale Überschreibungen pro Lauf, keine dauerhaften Sitzungsänderungen.
- OpenClaw berücksichtigt diese Überschreibungsfelder nur für vertrauenswürdige Aufrufer.
- Für plugin-eigene Fallback-Läufe müssen Operatoren mit `plugins.entries.<id>.subagent.allowModelOverride: true` zustimmen.
- Verwenden Sie `plugins.entries.<id>.subagent.allowedModels`, um vertrauenswürdige Plugins auf bestimmte kanonische Ziele `provider/model` zu beschränken, oder `"*"` um explizit jedes Ziel zuzulassen.
- Läufe untrusted Plugin-Subagents funktionieren weiterhin, aber Überschreibungsanfragen werden abgewiesen, statt stillschweigend auf Fallback zurückzufallen.

Für Websuche können Plugins den gemeinsamen Runtime-Helfer verwenden, statt
in die Verdrahtung der Agenten-Tools einzugreifen:

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

Plugins können auch Web-Suchprovider über
`api.registerWebSearchProvider(...)` registrieren.

Hinweise:

- Behalten Sie Provider-Auswahl, Auflösung von Anmeldedaten und gemeinsame Request-Semantik im Core.
- Verwenden Sie Web-Suchprovider für vendorspezifische Suchtransporte.
- `api.runtime.webSearch.*` ist die bevorzugte gemeinsame Oberfläche für Feature-/Kanal-Plugins, die Suchverhalten benötigen, ohne vom Agenten-Tool-Wrapper abzuhängen.

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
- `listProviders(...)`: Verfügbare Provider für Bildgenerierung und ihre Capabilities auflisten.

## Gateway-HTTP-Routen

Plugins können HTTP-Endpunkte mit `api.registerHttpRoute(...)` bereitstellen.

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

Felder einer Route:

- `path`: Routenpfad unter dem Gateway-HTTP-Server.
- `auth`: erforderlich. Verwenden Sie `"gateway"`, um normale Gateway-Authentifizierung zu verlangen, oder `"plugin"` für vom Plugin verwaltete Auth/Webhook-Verifizierung.
- `match`: optional. `"exact"` (Standard) oder `"prefix"`.
- `replaceExisting`: optional. Erlaubt demselben Plugin, die eigene vorhandene Routenregistrierung zu ersetzen.
- `handler`: gibt `true` zurück, wenn die Route die Anfrage verarbeitet hat.

Hinweise:

- `api.registerHttpHandler(...)` wurde entfernt und verursacht einen Fehler beim Laden des Plugins. Verwenden Sie stattdessen `api.registerHttpRoute(...)`.
- Plugin-Routen müssen `auth` explizit deklarieren.
- Konflikte bei exaktem `path + match` werden abgewiesen, sofern nicht `replaceExisting: true` gesetzt ist, und ein Plugin kann keine Route eines anderen Plugins ersetzen.
- Überlappende Routen mit unterschiedlichen `auth`-Ebenen werden abgewiesen. Behalten Sie Fallthrough-Ketten mit `exact`/`prefix` nur innerhalb derselben Auth-Ebene.
- Routen mit `auth: "plugin"` erhalten **nicht** automatisch Operator-Runtime-Scopes. Sie sind für vom Plugin verwaltete Webhooks/Signaturprüfung gedacht, nicht für privilegierte Gateway-Helferaufrufe.
- Routen mit `auth: "gateway"` laufen innerhalb eines Gateway-Request-Runtime-Scope, aber dieser Scope ist bewusst konservativ:
  - Bearer-Authentifizierung mit gemeinsamem Geheimnis (`gateway.auth.mode = "token"` / `"password"`) hält Runtime-Scopes von Plugin-Routen auf `operator.write` fest, selbst wenn der Aufrufer `x-openclaw-scopes` sendet
  - HTTP-Modi mit vertrauenswürdiger Identität (zum Beispiel `trusted-proxy` oder `gateway.auth.mode = "none"` bei privatem Ingress) berücksichtigen `x-openclaw-scopes` nur, wenn der Header explizit vorhanden ist
  - wenn `x-openclaw-scopes` bei solchen identitätsbehafteten Plugin-Route-Anfragen fehlt, fällt der Runtime-Scope auf `operator.write` zurück
- Praktische Regel: Gehen Sie nicht davon aus, dass eine gateway-authentifizierte Plugin-Route implizit eine Admin-Oberfläche ist. Wenn Ihre Route adminexklusives Verhalten benötigt, verlangen Sie einen identitätsbehafteten Auth-Modus und dokumentieren Sie den expliziten Header-Vertrag `x-openclaw-scopes`.

## Importpfade des Plugin SDK

Verwenden Sie schmale SDK-Subpfade statt des monolithischen Root-
Barrels `openclaw/plugin-sdk`, wenn Sie neue Plugins schreiben. Zentrale Subpfade:

| Subpfad                            | Zweck                                              |
| ---------------------------------- | -------------------------------------------------- |
| `openclaw/plugin-sdk/plugin-entry` | Primitive für Plugin-Registrierung                 |
| `openclaw/plugin-sdk/channel-core` | Helfer zum Aufbau von Kanälen/Entry                |
| `openclaw/plugin-sdk/core`         | Generische gemeinsame Helfer und Umbrella-Vertrag  |
| `openclaw/plugin-sdk/config-schema` | Zod-Schema für Root-`openclaw.json` (`OpenClawSchema`) |

Kanal-Plugins wählen aus einer Familie schmaler Nähte — `channel-setup`,
`setup-runtime`, `setup-adapter-runtime`, `setup-tools`, `channel-pairing`,
`channel-contract`, `channel-feedback`, `channel-inbound`, `channel-lifecycle`,
`channel-reply-pipeline`, `command-auth`, `secret-input`, `webhook-ingress`,
`channel-targets` und `channel-actions`. Verhalten bei Genehmigungen sollte auf
einen einzigen Vertrag `approvalCapability` konsolidiert werden, statt es über nicht zusammenhängende
Plugin-Felder zu mischen. Siehe [Channel plugins](/de/plugins/sdk-channel-plugins).

Runtime- und Konfigurationshelfer liegen unter passenden Subpfaden
`*-runtime` (`approval-runtime`, `config-runtime`, `infra-runtime`, `agent-runtime`,
`lazy-runtime`, `directory-runtime`, `text-runtime`, `runtime-store` usw.).

<Info>
`openclaw/plugin-sdk/channel-runtime` ist veraltet — ein Kompatibilitäts-Shim für
ältere Plugins. Neuer Code sollte stattdessen schmalere generische Primitive importieren.
</Info>

Repo-interne Einstiegspunkte (pro gebündelter Plugin-Paket-Root):

- `index.js` — Einstiegspunkt für gebündeltes Plugin
- `api.js` — Barrel für Helfer/Typen
- `runtime-api.js` — Barrel nur für Runtime
- `setup-entry.js` — Einstiegspunkt für Setup-Plugin

Externe Plugins sollten nur `openclaw/plugin-sdk/*`-Subpfade importieren. Importieren Sie niemals
`src/*` eines anderen Plugin-Pakets aus dem Core oder aus einem anderen Plugin.
Über eine Fassade geladene Einstiegspunkte bevorzugen den aktiven Runtime-Config-Snapshot, wenn vorhanden,
und fallen dann auf die auf dem Datenträger aufgelöste Konfigurationsdatei zurück.

Capability-spezifische Subpfade wie `image-generation`, `media-understanding`
und `speech` existieren, weil gebündelte Plugins sie heute verwenden. Sie sind nicht
automatisch langfristig eingefrorene externe Verträge — prüfen Sie die relevante SDK-
Referenzseite, wenn Sie sich darauf verlassen.

## Schemas für Message-Tools

Plugins sollten provider-spezifische Beiträge zum Schema `describeMessageTool(...)`
für Nicht-Nachrichten-Primitive wie Reaktionen, Reads und Polls besitzen.
Gemeinsame Sendepräsentation sollte den generischen Vertrag `MessagePresentation`
verwenden statt provider-nativer Felder für Buttons, Komponenten, Blöcke oder Karten.
Siehe [Message Presentation](/de/plugins/message-presentation) für Vertrag,
Fallback-Regeln, Provider-Mapping und die Checkliste für Plugin-Autoren.

Plugins, die senden können, deklarieren über Message-Capabilities, was sie rendern können:

- `presentation` für semantische Präsentationsblöcke (`text`, `context`, `divider`, `buttons`, `select`)
- `delivery-pin` für Anforderungen an angeheftete Zustellung

Der Core entscheidet, ob die Präsentation nativ gerendert oder zu Text degradiert wird.
Stellen Sie keine provider-nativen UI-Escape-Hatches aus dem generischen Message-Tool bereit.
Veraltete SDK-Helfer für ältere native Schemas werden für bestehende
Drittanbieter-Plugins weiterhin exportiert, neue Plugins sollten sie aber nicht verwenden.

## Auflösung von Kanalzielen

Kanal-Plugins sollten kanalspezifische Zielsemantik besitzen. Halten Sie den gemeinsamen
Outbound-Host generisch und verwenden Sie die Oberfläche des Messaging-Adapters für Provider-Regeln:

- `messaging.inferTargetChatType({ to })` entscheidet, ob ein normalisiertes Ziel
  vor dem Directory-Lookup als `direct`, `group` oder `channel` behandelt werden soll.
- `messaging.targetResolver.looksLikeId(raw, normalized)` teilt dem Core mit, ob eine
  Eingabe direkt zu einer id-ähnlichen Auflösung springen soll statt zu einer Directory-Suche.
- `messaging.targetResolver.resolveTarget(...)` ist der Plugin-Fallback, wenn
  der Core nach der Normalisierung oder nach einem Directory-Fehlschlag eine endgültige provider-eigene Auflösung braucht.
- `messaging.resolveOutboundSessionRoute(...)` besitzt den provider-spezifischen Aufbau der Sitzungsroute,
  sobald ein Ziel aufgelöst wurde.

Empfohlene Aufteilung:

- Verwenden Sie `inferTargetChatType` für Kategorisierungsentscheidungen, die vor
  der Suche nach Peers/Gruppen erfolgen sollten.
- Verwenden Sie `looksLikeId` für Prüfungen wie „dies als explizite/native Ziel-ID behandeln“.
- Verwenden Sie `resolveTarget` für provider-spezifischen Normalisierungs-Fallback, nicht für
  eine breite Directory-Suche.
- Behalten Sie provider-native IDs wie Chat-IDs, Thread-IDs, JIDs, Handles und Raum-
  IDs innerhalb von `target`-Werten oder provider-spezifischen Parametern, nicht in generischen SDK-
  Feldern.

## Konfigurationsgestützte Directories

Plugins, die Directory-Einträge aus der Konfiguration ableiten, sollten diese Logik im
Plugin behalten und die gemeinsamen Helfer aus
`openclaw/plugin-sdk/directory-runtime` wiederverwenden.

Verwenden Sie dies, wenn ein Kanal konfigurationsgestützte Peers/Gruppen benötigt wie:

- durch Allowlists gesteuerte DM-Peers
- konfigurierte Kanal-/Gruppen-Maps
- statische Directory-Fallbacks pro Konto

Die gemeinsamen Helfer in `directory-runtime` behandeln nur generische Operationen:

- Query-Filterung
- Anwendung von Limits
- Deduplizierungs-/Normalisierungshelfer
- Aufbau von `ChannelDirectoryEntry[]`

Kanal-spezifische Kontoprüfung und ID-Normalisierung sollten in der
Plugin-Implementierung bleiben.

## Provider-Kataloge

Provider-Plugins können Modellkataloge für Inferenz definieren mit
`registerProvider({ catalog: { run(...) { ... } } })`.

`catalog.run(...)` gibt dieselbe Form zurück, die OpenClaw in
`models.providers` schreibt:

- `{ provider }` für einen Provider-Eintrag
- `{ providers }` für mehrere Provider-Einträge

Verwenden Sie `catalog`, wenn das Plugin provider-spezifische Modell-IDs, Standardwerte für `baseUrl` oder auth-gesteuerte Modellmetadaten besitzt.

`catalog.order` steuert, wann der Katalog eines Plugins relativ zu den
eingebauten impliziten Providern von OpenClaw zusammengeführt wird:

- `simple`: einfache Provider mit API-Schlüssel oder env-Steuerung
- `profile`: Provider, die erscheinen, wenn Auth-Profile existieren
- `paired`: Provider, die mehrere zusammenhängende Provider-Einträge synthetisieren
- `late`: letzter Durchlauf, nach anderen impliziten Providern

Spätere Provider gewinnen bei Schlüsselkollisionen, sodass Plugins absichtlich einen
eingebauten Provider-Eintrag mit derselben Provider-ID überschreiben können.

Kompatibilität:

- `discovery` funktioniert weiterhin als veralteter Alias
- wenn sowohl `catalog` als auch `discovery` registriert sind, verwendet OpenClaw `catalog`

## Schreibgeschützte Kanalprüfung

Wenn Ihr Plugin einen Kanal registriert, implementieren Sie vorzugsweise
`plugin.config.inspectAccount(cfg, accountId)` zusätzlich zu `resolveAccount(...)`.

Warum:

- `resolveAccount(...)` ist der Runtime-Pfad. Er darf annehmen, dass Anmeldedaten
  vollständig materialisiert sind, und schnell fehlschlagen, wenn erforderliche Secrets fehlen.
- Schreibgeschützte Befehlspfade wie `openclaw status`, `openclaw status --all`,
  `openclaw channels status`, `openclaw channels resolve` sowie Doctor-/Config-
  Reparaturabläufe sollten Runtime-Anmeldedaten nicht materialisieren müssen, nur um
  die Konfiguration zu beschreiben.

Empfohlenes Verhalten von `inspectAccount(...)`:

- Nur beschreibenden Kontostatus zurückgeben.
- `enabled` und `configured` beibehalten.
- Relevante Felder für Quelle/Status von Anmeldedaten einschließen, zum Beispiel:
  - `tokenSource`, `tokenStatus`
  - `botTokenSource`, `botTokenStatus`
  - `appTokenSource`, `appTokenStatus`
  - `signingSecretSource`, `signingSecretStatus`
- Sie müssen keine rohen Tokenwerte zurückgeben, nur um die schreibgeschützte
  Verfügbarkeit zu melden. `tokenStatus: "available"` (und das passende
  Quellfeld) reicht für statusartige Befehle aus.
- Verwenden Sie `configured_unavailable`, wenn Anmeldedaten über SecretRef konfiguriert sind, im aktuellen Befehlspfad aber nicht verfügbar.

Dadurch können schreibgeschützte Befehle „konfiguriert, aber in diesem Befehlspfad nicht verfügbar“
melden, statt abzustürzen oder das Konto fälschlich als nicht konfiguriert zu melden.

## Package-Packs

Ein Plugin-Verzeichnis kann ein `package.json` mit `openclaw.extensions` enthalten:

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

Sicherheits-Guardrail: Jeder Eintrag in `openclaw.extensions` muss nach der Auflösung von Symlinks innerhalb des Plugin-
Verzeichnisses bleiben. Einträge, die aus dem Paketverzeichnis ausbrechen, werden
abgewiesen.

Sicherheitshinweis: `openclaw plugins install` installiert Plugin-Abhängigkeiten mit
`npm install --omit=dev --ignore-scripts` (keine Lifecycle-Skripte, keine Dev-Abhängigkeiten zur Laufzeit). Halten Sie Bäume von Plugin-Abhängigkeiten
„pure JS/TS“ und vermeiden Sie Pakete, die `postinstall`-Builds erfordern.

Optional: `openclaw.setupEntry` kann auf ein leichtgewichtiges Modul nur für Setup zeigen.
Wenn OpenClaw Setup-Oberflächen für ein deaktiviertes Kanal-Plugin benötigt oder
wenn ein Kanal-Plugin aktiviert, aber noch nicht konfiguriert ist, lädt es `setupEntry`
statt des vollständigen Plugin-Einstiegspunkts. Dadurch bleiben Start und Setup leichter,
wenn Ihr Haupteinstiegspunkt außerdem Tools, Hooks oder anderen Code nur für die Runtime verdrahtet.

Optional: `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`
kann ein Kanal-Plugin dafür optieren lassen, denselben Pfad `setupEntry` während der
Startphase des Gateway vor dem Listen zu verwenden, selbst wenn der Kanal bereits konfiguriert ist.

Verwenden Sie dies nur, wenn `setupEntry` die Startoberfläche vollständig abdeckt, die
vor dem Beginn des Listen des Gateway existieren muss. In der Praxis bedeutet das, dass der Setup-Einstiegspunkt
jede kanalbezogene Capability registrieren muss, von der der Start abhängt, wie etwa:

- Kanalregistrierung selbst
- alle HTTP-Routen, die verfügbar sein müssen, bevor das Gateway mit dem Listen beginnt
- alle Gateway-Methoden, Tools oder Services, die in demselben Zeitfenster existieren müssen

Wenn Ihr vollständiger Einstiegspunkt weiterhin eine erforderliche Start-Capability besitzt, aktivieren Sie
dieses Flag nicht. Behalten Sie das Standardverhalten des Plugins bei und lassen Sie OpenClaw beim
Start den vollständigen Einstiegspunkt laden.

Gebündelte Kanäle können außerdem Helfer der Contract-Oberfläche nur für Setup veröffentlichen, die der Core
abfragen kann, bevor die vollständige Kanal-Runtime geladen ist. Die aktuelle Oberfläche für Setup-
Promotion ist:

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

Der Core verwendet diese Oberfläche, wenn eine veraltete Einzelkonto-Kanalkonfiguration nach
`channels.<id>.accounts.*` hochgestuft werden muss, ohne den vollständigen Plugin-Einstiegspunkt zu laden.
Matrix ist das aktuelle gebündelte Beispiel: Es verschiebt nur Auth-/Bootstrap-Schlüssel in ein
benanntes hochgestuftes Konto, wenn bereits benannte Konten existieren, und es kann einen
konfigurierten nicht kanonischen Standardkontoschlüssel beibehalten, statt immer
`accounts.default` zu erstellen.

Diese Setup-Patch-Adapter halten die Discovery der gebündelten Contract-Oberfläche lazy. Die Import-
Zeit bleibt leicht; die Oberfläche für Promotion wird nur bei der ersten Verwendung geladen, statt
beim Modulimport den Start gebündelter Kanäle erneut zu betreten.

Wenn diese Startoberflächen Gateway-RPC-Methoden enthalten, halten Sie sie auf einem
plugin-spezifischen Präfix. Core-Admin-Namespaces (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) bleiben reserviert und lösen immer
zu `operator.admin` auf, selbst wenn ein Plugin einen engeren Scope anfordert.

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

### Kanal-Katalogmetadaten

Kanal-Plugins können Setup-/Discovery-Metadaten über `openclaw.channel` und
Installationshinweise über `openclaw.install` bewerben. Dadurch bleibt der Core-Katalog ohne Daten.

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
      "blurb": "Self-hosted chat via Nextcloud Talk webhook bots.",
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

Nützliche `openclaw.channel`-Felder über das minimale Beispiel hinaus:

- `detailLabel`: sekundäres Label für reichhaltigere Katalog-/Statusoberflächen
- `docsLabel`: Linktext für den Doku-Link überschreiben
- `preferOver`: Plugin-/Kanal-IDs mit geringerer Priorität, die dieser Katalogeintrag übertreffen soll
- `selectionDocsPrefix`, `selectionDocsOmitLabel`, `selectionExtras`: Steuerung für Text auf Auswahloberflächen
- `markdownCapable`: markiert den Kanal als Markdown-fähig für Entscheidungen zur ausgehenden Formatierung
- `exposure.configured`: den Kanal aus Oberflächen zur Auflistung konfigurierter Kanäle ausblenden, wenn auf `false` gesetzt
- `exposure.setup`: den Kanal aus interaktiven Setup-/Configure-Pickern ausblenden, wenn auf `false` gesetzt
- `exposure.docs`: den Kanal für Doku-Navigationsoberflächen als intern/privat markieren
- `showConfigured` / `showInSetup`: veraltete Aliasse, die aus Kompatibilitätsgründen weiterhin akzeptiert werden; bevorzugen Sie `exposure`
- `quickstartAllowFrom`: den Kanal in den Standard-Quickstart-Flow `allowFrom` aufnehmen
- `forceAccountBinding`: explizite Kontobindung verlangen, auch wenn nur ein Konto existiert
- `preferSessionLookupForAnnounceTarget`: beim Auflösen von Ankündigungszielen Session-Lookup bevorzugen

OpenClaw kann außerdem **externe Kanalkataloge** zusammenführen (zum Beispiel einen Export aus einer MPM-
Registry). Legen Sie eine JSON-Datei an einem der folgenden Orte ab:

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

Oder weisen Sie `OPENCLAW_PLUGIN_CATALOG_PATHS` (oder `OPENCLAW_MPM_CATALOG_PATHS`) auf
eine oder mehrere JSON-Dateien (durch Komma/Semikolon/`PATH` getrennt). Jede Datei sollte
`{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }` enthalten. Der Parser akzeptiert auch `"packages"` oder `"plugins"` als veraltete Aliasse für den Schlüssel `"entries"`.

Generierte Kanalkatalogeinträge und Installationskatalogeinträge für Provider stellen
normalisierte Fakten zur Installationsquelle neben dem rohen Block `openclaw.install` bereit. Die
normalisierten Fakten identifizieren, ob die npm-Spezifikation eine exakte Version oder ein gleitender
Selektor ist, ob erwartete Integritätsmetadaten vorhanden sind und ob außerdem ein lokaler
Quellpfad verfügbar ist. Wenn die Identität von Katalog/Paket bekannt ist, warnen die
normalisierten Fakten, wenn der geparste npm-Paketname von dieser Identität abweicht.
Sie warnen auch, wenn `defaultChoice` ungültig ist oder auf eine Quelle zeigt, die
nicht verfügbar ist, und wenn npm-Integritätsmetadaten ohne gültige npm-Quelle vorhanden sind.
Consumer sollten `installSource` als additive optionale Felder behandeln, damit ältere handgebaute Einträge und Kompatibilitäts-Shims es nicht synthetisieren müssen.
Dadurch können Onboarding und Diagnose den Zustand der Source Plane erklären, ohne die Plugin-Runtime zu importieren.

Offizielle externe npm-Einträge sollten eine exakte `npmSpec` plus
`expectedIntegrity` bevorzugen. Reine Paketnamen und Dist-Tags funktionieren aus
Kompatibilitätsgründen weiterhin, erzeugen aber Warnungen auf Ebene der Source Plane, damit sich der Katalog
zu gepinnten, integritätsgeprüften Installationen entwickeln kann, ohne bestehende Plugins zu brechen.
Wenn Onboarding aus einem lokalen Katalogpfad installiert, wird ein
Eintrag `plugins.installs` mit `source: "path"` und möglichst einem zum Workspace relativen
`sourcePath` aufgezeichnet. Der absolute operative Ladepfad bleibt in
`plugins.load.paths`; der Installationseintrag vermeidet es, lokale Arbeitsstationspfade in
langfristig bestehende Konfigurationen zu duplizieren. Dadurch bleiben lokale Entwicklungsinstallationen für
Diagnosen der Source Plane sichtbar, ohne eine zweite rohe Offenlegungsoberfläche für Dateisystempfade
hinzuzufügen.

## Context-Engine-Plugins

Context-Engine-Plugins besitzen die Orchestrierung des Sitzungs-Kontexts für Ingest, Zusammenstellung
und Compaction. Registrieren Sie sie aus Ihrem Plugin mit
`api.registerContextEngine(id, factory)` und wählen Sie dann die aktive Engine mit
`plugins.slots.contextEngine`.

Verwenden Sie dies, wenn Ihr Plugin die Standardpipeline für Kontext ersetzen oder erweitern muss,
statt nur Memory-Suche oder Hooks hinzuzufügen.

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

Wenn Ihre Engine den Compaction-Algorithmus **nicht** besitzt, halten Sie `compact()`
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

## Eine neue Capability hinzufügen

Wenn ein Plugin Verhalten benötigt, das nicht zur aktuellen API passt, umgehen Sie
das Plugin-System nicht mit einem privaten Reach-in. Fügen Sie die fehlende Capability hinzu.

Empfohlene Reihenfolge:

1. den Core-Vertrag definieren
   Entscheiden Sie, welches gemeinsame Verhalten der Core besitzen soll: Richtlinie, Fallback, Konfigurationszusammenführung,
   Lifecycle, Semantik für kanalbezogene Oberflächen und Form der Runtime-Helfer.
2. typisierte Oberflächen für Plugin-Registrierung/Runtime hinzufügen
   Erweitern Sie `OpenClawPluginApi` und/oder `api.runtime` um die kleinste nützliche
   typisierte Capability-Oberfläche.
3. Core + Consumer aus Kanal/Feature verdrahten
   Kanäle und Feature-Plugins sollten die neue Capability über den Core verwenden,
   nicht durch direkten Import einer Vendor-Implementierung.
4. Vendor-Implementierungen registrieren
   Vendor-Plugins registrieren dann ihre Backends für die Capability.
5. Contract-Coverage hinzufügen
   Fügen Sie Tests hinzu, damit Ownership und Registrierungsform über die Zeit explizit bleiben.

So bleibt OpenClaw meinungsstark, ohne auf das Weltbild eines einzelnen
Providers fest verdrahtet zu sein. Siehe das [Capability Cookbook](/de/plugins/architecture)
für eine konkrete Dateicheckliste und ein ausgearbeitetes Beispiel.

### Capability-Checkliste

Wenn Sie eine neue Capability hinzufügen, sollte die Implementierung diese
Oberflächen in der Regel gemeinsam berühren:

- Core-Vertragstypen in `src/<capability>/types.ts`
- Core-Runner/Runtime-Helfer in `src/<capability>/runtime.ts`
- Oberfläche für Plugin-API-Registrierung in `src/plugins/types.ts`
- Verdrahtung der Plugin-Registry in `src/plugins/registry.ts`
- Bereitstellung in der Plugin-Runtime unter `src/plugins/runtime/*`, wenn Feature-/Kanal-
  Plugins sie verwenden müssen
- Capture-/Test-Helfer in `src/test-utils/plugin-registration.ts`
- Assertions zu Ownership/Vertrag in `src/plugins/contracts/registry.ts`
- Operator-/Plugin-Dokumentation in `docs/`

Wenn eine dieser Oberflächen fehlt, ist das meist ein Zeichen dafür, dass die Capability
noch nicht vollständig integriert ist.

### Capability-Template

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

// gemeinsamer Runtime-Helfer für Feature-/Kanal-Plugins
const clip = await api.runtime.videoGeneration.generate({
  prompt: "Show the robot walking through the lab.",
  cfg,
});
```

Muster für Contract-Tests:

```ts
expect(findVideoGenerationProviderIdsForPlugin("openai")).toEqual(["openai"]);
```

Damit bleibt die Regel einfach:

- der Core besitzt den Capability-Vertrag + die Orchestrierung
- Vendor-Plugins besitzen Vendor-Implementierungen
- Feature-/Kanal-Plugins verwenden Runtime-Helfer
- Contract-Tests halten Ownership explizit

## Verwandt

- [Plugin architecture](/de/plugins/architecture) — öffentliches Capability-Modell und Formen
- [Plugin SDK subpaths](/de/plugins/sdk-subpaths)
- [Plugin SDK setup](/de/plugins/sdk-setup)
- [Building plugins](/de/plugins/building-plugins)
