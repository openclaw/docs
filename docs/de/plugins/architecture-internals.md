---
read_when:
    - Laufzeit-Hooks für Provider, Channel-Lebenszyklus oder Paket-Packs implementieren
    - Fehlerbehebung bei der Ladereihenfolge von Plugins oder dem Zustand der Registry
    - Neue Plugin-Fähigkeit oder Plugin für die Kontext-Engine hinzufügen
summary: 'Interne Aspekte der Plugin-Architektur: Ladepipeline, Registry, Laufzeit-Hooks, HTTP-Routen und Referenztabellen'
title: Interne Aspekte der Plugin-Architektur
x-i18n:
    generated_at: "2026-04-26T11:34:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9a435e118dc6acbacd44008f0b1c47b51da32dc3f17c24fe4c99f75c8cbd9311
    source_path: plugins/architecture-internals.md
    workflow: 15
---

Für das öffentliche Fähigkeitsmodell, Plugin-Formen und Eigentums-/Ausführungs-
verträge siehe [Plugin-Architektur](/de/plugins/architecture). Diese Seite ist die
Referenz für die internen Mechanismen: Ladepipeline, Registry, Laufzeit-Hooks,
Gateway-HTTP-Routen, Importpfade und Schematabellen.

## Ladepipeline

Beim Start macht OpenClaw grob Folgendes:

1. mögliche Plugin-Roots erkennen
2. native oder kompatible Bundle-Manifeste und Paketmetadaten lesen
3. unsichere Kandidaten ablehnen
4. Plugin-Konfiguration normalisieren (`plugins.enabled`, `allow`, `deny`, `entries`,
   `slots`, `load.paths`)
5. Aktivierung für jeden Kandidaten entscheiden
6. aktivierte native Module laden: gebaute gebündelte Module verwenden einen nativen Loader;
   ungebaute native Plugins verwenden jiti
7. native Hooks `register(api)` aufrufen und Registrierungen in der Plugin-Registry sammeln
8. die Registry für Befehls-/Laufzeitoberflächen bereitstellen

<Note>
`activate` ist ein veralteter Alias für `register` — der Loader löst jeweils den vorhandenen Eintrag auf (`def.register ?? def.activate`) und ruft ihn an derselben Stelle auf. Alle gebündelten Plugins verwenden `register`; bevorzugen Sie `register` für neue Plugins.
</Note>

Die Sicherheitsprüfungen erfolgen **vor** der Laufzeitausführung. Kandidaten werden blockiert,
wenn der Entry den Plugin-Root verlässt, der Pfad weltweit beschreibbar ist oder der Pfadbesitz
bei nicht gebündelten Plugins verdächtig aussieht.

### Manifest-first-Verhalten

Das Manifest ist die Quelle der Wahrheit für die Control Plane. OpenClaw verwendet es, um:

- das Plugin zu identifizieren
- deklarierte Channels/Skills/Config-Schema oder Bundle-Fähigkeiten zu erkennen
- `plugins.entries.<id>.config` zu validieren
- Bezeichnungen/Platzhalter der Control UI zu erweitern
- Installations-/Katalogmetadaten anzuzeigen
- kostengünstige Aktivierungs- und Setup-Deskriptoren zu bewahren, ohne die Plugin-Laufzeit zu laden

Für native Plugins ist das Laufzeitmodul der Teil der Data Plane. Es registriert
das tatsächliche Verhalten wie Hooks, Tools, Befehle oder Provider-Flows.

Optionale Manifest-Blöcke `activation` und `setup` bleiben auf der Control Plane.
Sie sind rein metadatenbasierte Deskriptoren für Aktivierungsplanung und Setup-Erkennung;
sie ersetzen weder die Laufzeitregistrierung, `register(...)` noch `setupEntry`.
Die ersten Live-Aktivierungs-Consumer verwenden jetzt Hinweise aus dem Manifest zu Befehlen, Channels und Providern,
um das Laden von Plugins vor einer breiteren Materialisierung der Registry einzugrenzen:

- Das Laden der CLI wird auf Plugins eingegrenzt, denen der angeforderte primäre Befehl gehört
- Die Auflösung von Channel-Setup/Plugin wird auf Plugins eingegrenzt, denen die angeforderte
  Channel-ID gehört
- Die explizite Auflösung von Provider-Setup/-Laufzeit wird auf Plugins eingegrenzt, denen die
  angeforderte Provider-ID gehört

Der Aktivierungsplaner stellt sowohl eine reine IDs-API für bestehende Aufrufer als auch eine
Plan-API für neue Diagnosen bereit. Planeinträge melden, warum ein Plugin ausgewählt wurde,
und trennen explizite Planerhinweise `activation.*` von Manifest-Eigentums-Fallbacks wie
`providers`, `channels`, `commandAliases`, `setup.providers`,
`contracts.tools` und Hooks. Diese Trennung der Gründe ist die Kompatibilitätsgrenze:
bestehende Plugin-Metadaten funktionieren weiterhin, während neuer Code breite Hinweise
oder Fallback-Verhalten erkennen kann, ohne die Semantik des Laufzeitladens zu ändern.

Die Setup-Erkennung bevorzugt jetzt Descriptor-eigene IDs wie `setup.providers` und
`setup.cliBackends`, um Kandidaten-Plugins einzugrenzen, bevor auf
`setup-api` für Plugins zurückgegriffen wird, die weiterhin Laufzeit-Hooks zur Setup-Zeit benötigen. Provider-
Setup-Listen verwenden Manifest-`providerAuthChoices`, aus Deskriptoren abgeleitete Setup-
Auswahlen und Installations-Katalogmetadaten, ohne die Provider-Laufzeit zu laden. Explizites
`setup.requiresRuntime: false` ist ein rein deskriptorbasierter Cutoff; ein
weggelassenes `requiresRuntime` behält den Legacy-Fallback auf setup-api aus Kompatibilitätsgründen bei. Wenn mehr
als ein erkanntes Plugin dieselbe normalisierte Setup-Provider- oder CLI-
Backend-ID beansprucht, verweigert die Setup-Suche den mehrdeutigen Besitzer, statt sich auf
die Reihenfolge der Erkennung zu verlassen. Wenn Setup-Laufzeit tatsächlich ausgeführt wird, melden
Registry-Diagnosen Drift zwischen `setup.providers` / `setup.cliBackends` und den Providern
oder CLI-Backends, die von setup-api registriert wurden, ohne Legacy-Plugins zu blockieren.

### Was der Loader zwischenspeichert

OpenClaw behält kurze In-Process-Caches für:

- Erkennungsergebnisse
- Daten der Manifest-Registry
- geladene Plugin-Registries

Diese Caches reduzieren stoßartigen Startaufwand und den Overhead wiederholter Befehle. Es ist sicher,
sie als kurzlebige Performance-Caches und nicht als Persistenz zu betrachten.

Hinweis zur Performance:

- Setzen Sie `OPENCLAW_DISABLE_PLUGIN_DISCOVERY_CACHE=1` oder
  `OPENCLAW_DISABLE_PLUGIN_MANIFEST_CACHE=1`, um diese Caches zu deaktivieren.
- Passen Sie die Cache-Fenster mit `OPENCLAW_PLUGIN_DISCOVERY_CACHE_MS` und
  `OPENCLAW_PLUGIN_MANIFEST_CACHE_MS` an.

## Registry-Modell

Geladene Plugins verändern nicht direkt beliebige globale Core-Zustände. Sie registrieren sich in einer
zentralen Plugin-Registry.

Die Registry verfolgt:

- Plugin-Datensätze (Identität, Quelle, Herkunft, Status, Diagnosen)
- Tools
- Legacy-Hooks und typisierte Hooks
- Channels
- Provider
- Gateway-RPC-Handler
- HTTP-Routen
- CLI-Registrars
- Hintergrunddienste
- Plugin-eigene Befehle

Core-Funktionen lesen dann aus dieser Registry, statt direkt mit Plugin-Modulen
zu sprechen. So bleibt das Laden einseitig:

- Plugin-Modul -> Registry-Registrierung
- Core-Laufzeit -> Registry-Konsum

Diese Trennung ist wichtig für die Wartbarkeit. Sie bedeutet, dass die meisten Core-Oberflächen nur
einen Integrationspunkt benötigen: „die Registry lesen“, nicht „jedes Plugin-Modul speziell behandeln“.

## Callbacks für Konversations-Bindings

Plugins, die eine Konversation binden, können reagieren, wenn eine Genehmigung aufgelöst wird.

Verwenden Sie `api.onConversationBindingResolved(...)`, um einen Callback zu erhalten, nachdem eine Bind-
Anfrage genehmigt oder abgelehnt wurde:

```ts
export default {
  id: "my-plugin",
  register(api) {
    api.onConversationBindingResolved(async (event) => {
      if (event.status === "approved") {
        // Eine Bindung für dieses Plugin + diese Konversation existiert jetzt.
        console.log(event.binding?.conversationId);
        return;
      }

      // Die Anfrage wurde abgelehnt; lokalen Pending-Zustand löschen.
      console.log(event.request.conversation.conversationId);
    });
  },
};
```

Felder der Callback-Payload:

- `status`: `"approved"` oder `"denied"`
- `decision`: `"allow-once"`, `"allow-always"` oder `"deny"`
- `binding`: die aufgelöste Bindung für genehmigte Anfragen
- `request`: die ursprüngliche Anfragenzusammenfassung, Detach-Hinweis, Sender-ID und
  Konversationsmetadaten

Dieser Callback dient nur der Benachrichtigung. Er ändert nicht, wer eine Konversation
binden darf, und läuft, nachdem die Core-Behandlung der Genehmigung abgeschlossen ist.

## Provider-Laufzeit-Hooks

Provider-Plugins haben drei Ebenen:

- **Manifest-Metadaten** für kostengünstige Suche vor der Laufzeit:
  `setup.providers[].envVars`, veraltete Kompatibilitätsoption `providerAuthEnvVars`,
  `providerAuthAliases`, `providerAuthChoices` und `channelEnvVars`.
- **Hooks zur Konfigurationszeit**: `catalog` (Legacy `discovery`) plus
  `applyConfigDefaults`.
- **Laufzeit-Hooks**: 40+ optionale Hooks für Authentifizierung, Modellauflösung,
  Stream-Wrapping, Thinking-Level, Replay-Richtlinie und Usage-Endpunkte. Siehe
  die vollständige Liste unter [Hook-Reihenfolge und Verwendung](#hook-order-and-usage).

OpenClaw besitzt weiterhin die generische Agenten-Schleife, Failover, Transkriptverarbeitung und
Tool-Richtlinie. Diese Hooks sind die Erweiterungsoberfläche für providerspezifisches
Verhalten, ohne einen vollständig benutzerdefinierten Inferenztransport zu benötigen.

Verwenden Sie Manifest-`setup.providers[].envVars`, wenn der Provider umgebungsbasierte
Anmeldedaten hat, die generische Authentifizierungs-/Status-/Modell-Auswahlpfade ohne Laden
der Plugin-Laufzeit sehen sollen. Das veraltete `providerAuthEnvVars` wird vom
Kompatibilitätsadapter während des Deprecation-Fensters weiterhin gelesen, und nicht gebündelte Plugins,
die es verwenden, erhalten eine Manifest-Diagnose. Verwenden Sie Manifest-`providerAuthAliases`,
wenn eine Provider-ID die Env-Variablen, Authentifizierungsprofile,
konfigurationsgestützte Authentifizierung und die API-Key-Onboarding-Auswahl einer anderen Provider-ID wiederverwenden soll. Verwenden Sie Manifest-
`providerAuthChoices`, wenn Onboarding-/Auth-Choice-CLI-Oberflächen die Choice-ID,
Gruppenbezeichnungen und einfache Authentifizierungsverdrahtung mit einem Flag des Providers kennen sollen, ohne
die Provider-Laufzeit zu laden. Behalten Sie Provider-Laufzeit-
`envVars` für operatorseitige Hinweise wie Onboarding-Bezeichnungen oder OAuth-
Client-ID-/Client-Secret-Setup-Variablen bei.

Verwenden Sie Manifest-`channelEnvVars`, wenn ein Channel env-gesteuerte Authentifizierung oder
ein Setup hat, das generische Shell-Env-Fallbacks, Konfigurations-/Statusprüfungen oder Setup-Prompts
sehen sollen, ohne die Channel-Laufzeit zu laden.

### Hook-Reihenfolge und Verwendung

Für Modell-/Provider-Plugins ruft OpenClaw Hooks ungefähr in dieser Reihenfolge auf.
Die Spalte „Wann verwenden“ ist der schnelle Entscheidungsleitfaden.

| #   | Hook                              | Was er tut                                                                                                     | Wann verwenden                                                                                                                                 |
| --- | --------------------------------- | -------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `catalog`                         | Veröffentlicht die Provider-Konfiguration in `models.providers` während der Generierung von `models.json`     | Der Provider besitzt einen Katalog oder Standardwerte für `baseUrl`                                                                            |
| 2   | `applyConfigDefaults`             | Wendet providerseitige globale Standardwerte während der Materialisierung der Konfiguration an                 | Standardwerte hängen vom Authentifizierungsmodus, der Umgebung oder der Semantik der Modellfamilie des Providers ab                           |
| --  | _(integrierte Modellsuche)_       | OpenClaw versucht zuerst den normalen Registry-/Katalogpfad                                                    | _(kein Plugin-Hook)_                                                                                                                           |
| 3   | `normalizeModelId`                | Normalisiert veraltete oder Preview-Aliasse von Modell-IDs vor der Suche                                      | Der Provider besitzt Alias-Bereinigung vor der kanonischen Modellauflösung                                                                    |
| 4   | `normalizeTransport`              | Normalisiert providerfamilienbezogene `api` / `baseUrl` vor der generischen Modellzusammenstellung            | Der Provider besitzt Transport-Bereinigung für benutzerdefinierte Provider-IDs in derselben Transportfamilie                                 |
| 5   | `normalizeConfig`                 | Normalisiert `models.providers.<id>` vor der Laufzeit-/Provider-Auflösung                                     | Der Provider benötigt Konfigurationsbereinigung, die beim Plugin liegen sollte; gebündelte Google-Familien-Helper stützen auch unterstützte Google-Konfigurationseinträge ab |
| 6   | `applyNativeStreamingUsageCompat` | Wendet Kompatibilitäts-Umschreibungen für native Streaming-Nutzung auf Konfigurationsprovider an              | Der Provider benötigt metadatengesteuerte Korrekturen für native Streaming-Nutzung je Endpunkt                                                |
| 7   | `resolveConfigApiKey`             | Löst Env-Marker-Authentifizierung für Konfigurationsprovider vor dem Laden der Laufzeit-Authentifizierung auf | Der Provider hat eine providerseitige Auflösung von Env-Markern für API-Keys; `amazon-bedrock` hat hier zusätzlich einen eingebauten AWS-Env-Marker-Resolver |
| 8   | `resolveSyntheticAuth`            | Macht lokale/selbst gehostete oder konfigurationsgestützte Authentifizierung sichtbar, ohne Klartext zu persistieren | Der Provider kann mit einem synthetischen/lokalen Anmeldedaten-Marker arbeiten                                                               |
| 9   | `resolveExternalAuthProfiles`     | Legt providerseitige externe Authentifizierungsprofile über; Standard für `persistence` ist `runtime-only` bei CLI-/app-eigenen Anmeldedaten | Der Provider verwendet externe Authentifizierungs-Anmeldedaten wieder, ohne kopierte Refresh-Tokens zu persistieren; deklarieren Sie `contracts.externalAuthProviders` im Manifest |
| 10  | `shouldDeferSyntheticProfileAuth` | Ordnet gespeicherte Platzhalter für synthetische Profile hinter env-/konfigurationsgestützter Authentifizierung ein | Der Provider speichert Platzhalterprofile, die in der Priorität nicht gewinnen sollen                                                       |
| 11  | `resolveDynamicModel`             | Synchroner Fallback für providerseitige Modell-IDs, die noch nicht in der lokalen Registry stehen             | Der Provider akzeptiert beliebige Upstream-Modell-IDs                                                                                         |
| 12  | `prepareDynamicModel`             | Asynchrones Warm-up, danach wird `resolveDynamicModel` erneut ausgeführt                                      | Der Provider benötigt Netzwerkmetadaten, bevor unbekannte IDs aufgelöst werden können                                                        |
| 13  | `normalizeResolvedModel`          | Letzte Umschreibung, bevor der eingebettete Runner das aufgelöste Modell verwendet                            | Der Provider benötigt Transport-Umschreibungen, verwendet aber weiterhin einen Core-Transport                                                |
| 14  | `contributeResolvedModelCompat`   | Liefert Kompatibilitäts-Flags für Vendor-Modelle hinter einem anderen kompatiblen Transport                   | Der Provider erkennt eigene Modelle auf Proxy-Transporten, ohne selbst die Kontrolle über den Provider zu übernehmen                        |
| 15  | `capabilities`                    | Providerseitige Metadaten für Transkripte/Tooling, die von gemeinsamer Core-Logik verwendet werden           | Der Provider benötigt Besonderheiten für Transkripte/Providerfamilien                                                                        |
| 16  | `normalizeToolSchemas`            | Normalisiert Tool-Schemata, bevor der eingebettete Runner sie sieht                                           | Der Provider benötigt transportfamilienbezogene Bereinigung von Schemata                                                                     |
| 17  | `inspectToolSchemas`              | Macht providerseitige Schemadiagnosen nach der Normalisierung sichtbar                                        | Der Provider möchte Warnungen zu Schlüsselwörtern ausgeben, ohne dem Core providerspezifische Regeln beizubringen                           |
| 18  | `resolveReasoningOutputMode`      | Wählt nativen vs. getaggten Vertrag für Reasoning-Ausgabe                                                     | Der Provider benötigt getaggtes Reasoning/finale Ausgabe statt nativer Felder                                                                |
| 19  | `prepareExtraParams`              | Normalisierung von Request-Parametern vor generischen Wrappern für Stream-Optionen                            | Der Provider benötigt Standard-Request-Parameter oder providerseitige Bereinigung einzelner Parameter                                       |
| 20  | `createStreamFn`                  | Ersetzt den normalen Stream-Pfad vollständig durch einen benutzerdefinierten Transport                        | Der Provider benötigt ein benutzerdefiniertes Wire-Protocol und nicht nur einen Wrapper                                                     |
| 21  | `wrapStreamFn`                    | Stream-Wrapper, nachdem generische Wrapper angewendet wurden                                                  | Der Provider benötigt Wrapper für Request-Header/Body/Modell-Kompatibilität ohne benutzerdefinierten Transport                              |
| 22  | `resolveTransportTurnState`       | Hängt native Header oder Metadaten pro Turn für den Transport an                                              | Der Provider möchte, dass generische Transporte providernative Turn-Identität senden                                                        |
| 23  | `resolveWebSocketSessionPolicy`   | Hängt native WebSocket-Header oder eine Session-Cool-down-Richtlinie an                                       | Der Provider möchte, dass generische WS-Transporte Session-Header oder Fallback-Richtlinien abstimmen                                       |
| 24  | `formatApiKey`                    | Formatter für Authentifizierungsprofile: Gespeichertes Profil wird zur Laufzeitzeichenfolge `apiKey`         | Der Provider speichert zusätzliche Authentifizierungsmetadaten und benötigt eine benutzerdefinierte Laufzeit-Tokenform                     |
| 25  | `refreshOAuth`                    | OAuth-Refresh-Überschreibung für benutzerdefinierte Refresh-Endpunkte oder Refresh-Fehlerrichtlinien         | Der Provider passt nicht zu den gemeinsamen `pi-ai`-Refreshers                                                                              |
| 26  | `buildAuthDoctorHint`             | Reparaturhinweis, der angehängt wird, wenn OAuth-Refresh fehlschlägt                                          | Der Provider benötigt providerseitige Hinweise zur Authentifizierungsreparatur nach einem Refresh-Fehler                                    |
| 27  | `matchesContextOverflowError`     | Providerseitiger Matcher für Overflow des Kontextfensters                                                     | Der Provider hat rohe Overflow-Fehler, die von generischen Heuristiken übersehen würden                                                     |
| 28  | `classifyFailoverReason`          | Providerseitige Klassifizierung des Failover-Grunds                                                           | Der Provider kann rohe API-/Transportfehler auf Ratenlimit/Überlastung usw. abbilden                                                       |
| 29  | `isCacheTtlEligible`              | Richtlinie für Prompt-Cache bei Proxy-/Backhaul-Providern                                                    | Der Provider benötigt proxy-spezifisches Cache-TTL-Gating                                                                                   |
| 30  | `buildMissingAuthMessage`         | Ersetzung für die generische Wiederherstellungsnachricht bei fehlender Authentifizierung                      | Der Provider benötigt einen providerspezifischen Hinweis zur Wiederherstellung bei fehlender Authentifizierung                              |
| 31  | `suppressBuiltInModel`            | Unterdrückung veralteter Upstream-Modelle plus optionaler benutzerseitiger Fehlerhinweis                     | Der Provider muss veraltete Upstream-Zeilen ausblenden oder durch einen Vendor-Hinweis ersetzen                                             |
| 32  | `augmentModelCatalog`             | Synthetische/finale Katalogzeilen werden nach der Erkennung angehängt                                         | Der Provider benötigt synthetische Zeilen für Vorwärtskompatibilität in `models list` und Auswahlen                                        |
| 33  | `resolveThinkingProfile`          | Modellspezifische Menge von `/think`-Levels, Anzeige-Labels und Standard                                      | Der Provider stellt für ausgewählte Modelle eine benutzerdefinierte Thinking-Stufenleiter oder ein binäres Label bereit                     |
| 34  | `isBinaryThinking`                | Kompatibilitäts-Hook für Reasoning-Umschaltung an/aus                                                         | Der Provider unterstützt nur binäres Thinking an/aus                                                                                         |
| 35  | `supportsXHighThinking`           | Kompatibilitäts-Hook für Unterstützung von `xhigh`-Reasoning                                                  | Der Provider möchte `xhigh` nur auf einer Teilmenge von Modellen anbieten                                                                   |
| 36  | `resolveDefaultThinkingLevel`     | Kompatibilitäts-Hook für das Standardniveau von `/think`                                                      | Der Provider besitzt die Standardrichtlinie für `/think` einer Modellfamilie                                                                |
| 37  | `isModernModelRef`                | Matcher für moderne Modelle für Filter lebender Profile und Auswahl von Smoke-Tests                           | Der Provider besitzt das Matching bevorzugter Modelle für Live-/Smoke-Szenarien                                                              |
| 38  | `prepareRuntimeAuth`              | Tauscht ein konfiguriertes Anmeldedatum unmittelbar vor der Inferenz in das tatsächliche Laufzeit-Token/-Key um | Der Provider benötigt einen Token-Austausch oder kurzlebige Request-Anmeldedaten                                                            |
| 39  | `resolveUsageAuth`                | Löst Nutzungs-/Abrechnungs-Anmeldedaten für `/usage` und verwandte Statusoberflächen auf                      | Der Provider benötigt benutzerdefiniertes Parsing von Nutzungs-/Quota-Tokens oder andere Nutzungs-Anmeldedaten                              |
| 40  | `fetchUsageSnapshot`              | Holt und normalisiert providerspezifische Snapshots zu Nutzung/Quota, nachdem die Authentifizierung aufgelöst wurde | Der Provider benötigt einen providerspezifischen Nutzungsendpunkt oder Payload-Parser                                                      |
| 41  | `createEmbeddingProvider`         | Baut einen providerseitigen Embedding-Adapter für Memory/Suche                                                | Das Verhalten von Memory-Embeddings gehört zum Provider-Plugin                                                                               |
| 42  | `buildReplayPolicy`               | Gibt eine Replay-Richtlinie zurück, die die Behandlung von Transkripten für den Provider steuert             | Der Provider benötigt eine benutzerdefinierte Transkript-Richtlinie (zum Beispiel das Entfernen von Thinking-Blöcken)                      |
| 43  | `sanitizeReplayHistory`           | Schreibt den Replay-Verlauf nach generischer Bereinigung des Transkripts um                                   | Der Provider benötigt providerspezifische Umschreibungen des Replay-Verlaufs über gemeinsame Compaction-Helper hinaus                       |
| 44  | `validateReplayTurns`             | Letzte Validierung oder Umformung von Replay-Turns vor dem eingebetteten Runner                               | Der Provider-Transport benötigt strengere Validierung von Turns nach generischer Bereinigung                                                |
| 45  | `onModelSelected`                 | Führt providerseitige Seiteneffekte nach der Modellauswahl aus                                                | Der Provider benötigt Telemetrie oder providerseitigen Zustand, wenn ein Modell aktiv wird                                                  |

`normalizeModelId`, `normalizeTransport` und `normalizeConfig` prüfen zuerst das
gematchte Provider-Plugin und gehen dann andere Hook-fähige Provider-Plugins durch,
bis eines die Modell-ID oder den Transport/die Konfiguration tatsächlich ändert. Das hält
Alias-/Kompatibilitäts-Shims für Provider funktionsfähig, ohne dass der Aufrufer wissen muss, welches
gebündelte Plugin die Umschreibung besitzt. Wenn kein Provider-Hook einen unterstützten
Google-Familien-Konfigurationseintrag umschreibt, wendet der gebündelte Google-Konfigurations-Normalisierer
diese Kompatibilitätsbereinigung dennoch an.

Wenn der Provider ein vollständig benutzerdefiniertes Wire-Protocol oder einen benutzerdefinierten
Request-Executor benötigt, ist das eine andere Klasse von Erweiterung. Diese Hooks sind für
Provider-Verhalten gedacht, das weiterhin auf der normalen Inferenzschleife von OpenClaw läuft.

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

Gebündelte Provider-Plugins kombinieren die obigen Hooks, um zu den Anforderungen jedes Vendors
für Katalog, Authentifizierung, Thinking, Replay und Usage zu passen. Der maßgebliche Hook-Satz liegt bei
jedem Plugin unter `extensions/`; diese Seite veranschaulicht die Formen, statt
die Liste zu spiegeln.

<AccordionGroup>
  <Accordion title="Pass-through-Katalogprovider">
    OpenRouter, Kilocode, Z.AI und xAI registrieren `catalog` plus
    `resolveDynamicModel` / `prepareDynamicModel`, damit sie Upstream-
    Modell-IDs vor dem statischen Katalog von OpenClaw sichtbar machen können.
  </Accordion>
  <Accordion title="OAuth- und Usage-Endpunkt-Provider">
    GitHub Copilot, Gemini CLI, ChatGPT Codex, MiniMax, Xiaomi und z.ai kombinieren
    `prepareRuntimeAuth` oder `formatApiKey` mit `resolveUsageAuth` +
    `fetchUsageSnapshot`, um Token-Austausch und `/usage`-Integration zu steuern.
  </Accordion>
  <Accordion title="Familien für Replay und Transkript-Bereinigung">
    Gemeinsame benannte Familien (`google-gemini`, `passthrough-gemini`,
    `anthropic-by-model`, `hybrid-anthropic-openai`) erlauben Providern,
    über `buildReplayPolicy` eine Transkript-Richtlinie zu verwenden, statt dass jedes Plugin
    die Bereinigung selbst erneut implementiert.
  </Accordion>
  <Accordion title="Nur-Katalog-Provider">
    `byteplus`, `cloudflare-ai-gateway`, `huggingface`, `kimi-coding`, `nvidia`,
    `qianfan`, `synthetic`, `together`, `venice`, `vercel-ai-gateway` und
    `volcengine` registrieren nur `catalog` und nutzen die gemeinsame Inferenzschleife.
  </Accordion>
  <Accordion title="Anthropic-spezifische Stream-Helper">
    Beta-Header, `/fast` / `serviceTier` und `context1m` liegen innerhalb der
    öffentlichen Abgrenzung `api.ts` / `contract-api.ts` des Anthropic-Plugins
    (`wrapAnthropicProviderStream`, `resolveAnthropicBetas`,
    `resolveAnthropicFastMode`, `resolveAnthropicServiceTier`) und nicht
    im generischen SDK.
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
- Verwendet die Core-Konfiguration `messages.tts` und Providerauswahl.
- Gibt PCM-Audiopuffer + Abtastrate zurück. Plugins müssen für Provider neu sampeln/kodieren.
- `listVoices` ist pro Provider optional. Verwenden Sie es für vendorseitige Voice-Picker oder Setup-Flows.
- Voice-Listen können reichhaltigere Metadaten wie Locale, Geschlecht und Personality-Tags für providerbewusste Picker enthalten.
- OpenAI und ElevenLabs unterstützen heute Telephony. Microsoft nicht.

Plugins können auch Sprach-Provider über `api.registerSpeechProvider(...)` registrieren.

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

- Behalten Sie TTS-Richtlinie, Fallback und Zustellung von Antworten im Core.
- Verwenden Sie Sprach-Provider für vendorseitiges Syntheseverhalten.
- Veraltete Microsoft-Eingabe `edge` wird auf die Provider-ID `microsoft` normalisiert.
- Das bevorzugte Eigentumsmodell ist unternehmensorientiert: Ein Vendor-Plugin kann
  Text-, Sprach-, Bild- und künftige Medienprovider besitzen, wenn OpenClaw diese
  Fähigkeitsverträge hinzufügt.

Für Bild-/Audio-/Videoverständnis registrieren Plugins einen typisierten
Provider für Medienverständnis statt einer generischen Key-/Value-Tasche:

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
- Behalten Sie Vendor-Verhalten im Provider-Plugin.
- Additive Erweiterung sollte typisiert bleiben: neue optionale Methoden, neue optionale
  Ergebnisfelder, neue optionale Fähigkeiten.
- Videogenerierung folgt bereits demselben Muster:
  - der Core besitzt den Fähigkeitsvertrag und den Laufzeit-Helper
  - Vendor-Plugins registrieren `api.registerVideoGenerationProvider(...)`
  - Feature-/Channel-Plugins verwenden `api.runtime.videoGeneration.*`

Für Laufzeit-Helper des Medienverständnisses können Plugins Folgendes aufrufen:

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

Für Audiotranskription können Plugins entweder die Laufzeit des Medienverständnisses
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
- Verwendet die Core-Audiokonfiguration für Medienverständnis (`tools.media.audio`) und die Fallback-Reihenfolge der Provider.
- Gibt `{ text: undefined }` zurück, wenn keine Transkriptionsausgabe erzeugt wird (zum Beispiel bei übersprungenen/nicht unterstützten Eingaben).
- `api.runtime.stt.transcribeAudioFile(...)` bleibt als Kompatibilitätsalias bestehen.

Plugins können auch Hintergrundläufe von Subagenten über `api.runtime.subagent` starten:

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

- `provider` und `model` sind optionale Überschreibungen pro Lauf, keine persistenten Sitzungsänderungen.
- OpenClaw berücksichtigt diese Überschreibungsfelder nur für vertrauenswürdige Aufrufer.
- Für pluginseitige Fallback-Läufe müssen Operatoren sich mit `plugins.entries.<id>.subagent.allowModelOverride: true` ausdrücklich dafür entscheiden.
- Verwenden Sie `plugins.entries.<id>.subagent.allowedModels`, um vertrauenswürdige Plugins auf bestimmte kanonische Ziele `provider/model` zu beschränken, oder `"*"` um explizit jedes Ziel zu erlauben.
- Nicht vertrauenswürdige Subagent-Läufe von Plugins funktionieren weiterhin, aber Überschreibungsanfragen werden abgelehnt, statt stillschweigend zurückzufallen.

Für Websuche können Plugins den gemeinsamen Laufzeit-Helper verwenden, statt
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

Plugins können auch Websuch-Provider über
`api.registerWebSearchProvider(...)` registrieren.

Hinweise:

- Behalten Sie Providerauswahl, Auflösung von Anmeldedaten und gemeinsame Request-Semantik im Core.
- Verwenden Sie Websuch-Provider für vendorspezifische Suchtransporte.
- `api.runtime.webSearch.*` ist die bevorzugte gemeinsame Oberfläche für Feature-/Channel-Plugins, die Suchverhalten benötigen, ohne vom Tool-Wrapper des Agenten abhängig zu sein.

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

- `generate(...)`: ein Bild mit der konfigurierten Provider-Kette für Bildgenerierung erzeugen.
- `listProviders(...)`: verfügbare Provider für Bildgenerierung und deren Fähigkeiten auflisten.

## Gateway-HTTP-Routen

Plugins können mit `api.registerHttpRoute(...)` HTTP-Endpunkte bereitstellen.

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

- `path`: Routenpfad unter dem HTTP-Server des Gateway.
- `auth`: erforderlich. Verwenden Sie `"gateway"`, um normale Gateway-Authentifizierung zu verlangen, oder `"plugin"` für pluginverwaltete Authentifizierung/Webhook-Verifizierung.
- `match`: optional. `"exact"` (Standard) oder `"prefix"`.
- `replaceExisting`: optional. Erlaubt es demselben Plugin, seine eigene bestehende Routenregistrierung zu ersetzen.
- `handler`: gibt `true` zurück, wenn die Route die Anfrage behandelt hat.

Hinweise:

- `api.registerHttpHandler(...)` wurde entfernt und verursacht einen Plugin-Ladefehler. Verwenden Sie stattdessen `api.registerHttpRoute(...)`.
- Plugin-Routen müssen `auth` explizit deklarieren.
- Exakte Konflikte bei `path + match` werden abgelehnt, sofern nicht `replaceExisting: true` gesetzt ist, und ein Plugin kann die Route eines anderen Plugins nicht ersetzen.
- Überlappende Routen mit unterschiedlichen `auth`-Stufen werden abgelehnt. Behalten Sie Fallthrough-Ketten für `exact`/`prefix` nur auf derselben Auth-Stufe.
- Routen mit `auth: "plugin"` erhalten **nicht** automatisch Operator-Laufzeitbereiche. Sie sind für pluginverwaltete Webhooks/Signaturverifizierung gedacht, nicht für privilegierte Gateway-Helper-Aufrufe.
- Routen mit `auth: "gateway"` laufen innerhalb eines Laufzeitbereichs für Gateway-Anfragen, aber dieser Bereich ist absichtlich konservativ:
  - gemeinsame Secret-Bearer-Authentifizierung (`gateway.auth.mode = "token"` / `"password"`) hält die Laufzeitbereiche von Plugin-Routen fest auf `operator.write`, selbst wenn der Aufrufer `x-openclaw-scopes` sendet
  - vertrauenswürdige identitätstragende HTTP-Modi (zum Beispiel `trusted-proxy` oder `gateway.auth.mode = "none"` bei privatem Ingress) berücksichtigen `x-openclaw-scopes` nur, wenn der Header explizit vorhanden ist
  - wenn `x-openclaw-scopes` bei solchen identitätstragenden Anfragen an Plugin-Routen fehlt, fällt der Laufzeitbereich auf `operator.write` zurück
- Praktische Regel: Gehen Sie nicht davon aus, dass eine gateway-authentifizierte Plugin-Route implizit eine Admin-Oberfläche ist. Wenn Ihre Route Admin-only-Verhalten benötigt, verlangen Sie einen identitätstragenden Authentifizierungsmodus und dokumentieren Sie den expliziten Vertrag für den Header `x-openclaw-scopes`.

## Plugin-SDK-Importpfade

Verwenden Sie schmale SDK-Unterpfade statt des monolithischen Root-
Barrels `openclaw/plugin-sdk`, wenn Sie neue Plugins schreiben. Wichtige Unterpfade:

| Unterpfad                           | Zweck                                              |
| ----------------------------------- | -------------------------------------------------- |
| `openclaw/plugin-sdk/plugin-entry`  | Primitive für die Plugin-Registrierung             |
| `openclaw/plugin-sdk/channel-core`  | Entry-/Build-Helper für Channels                   |
| `openclaw/plugin-sdk/core`          | Generische gemeinsame Helper und übergreifender Vertrag |
| `openclaw/plugin-sdk/config-schema` | Zod-Schema des Root-`openclaw.json` (`OpenClawSchema`) |

Channel-Plugins wählen aus einer Familie schmaler Abgrenzungen — `channel-setup`,
`setup-runtime`, `setup-adapter-runtime`, `setup-tools`, `channel-pairing`,
`channel-contract`, `channel-feedback`, `channel-inbound`, `channel-lifecycle`,
`channel-reply-pipeline`, `command-auth`, `secret-input`, `webhook-ingress`,
`channel-targets` und `channel-actions`. Genehmigungsverhalten sollte sich auf
einen einzigen Vertrag `approvalCapability` konsolidieren, statt über nicht
zusammenhängende Plugin-Felder gemischt zu werden. Siehe [Channel-Plugins](/de/plugins/sdk-channel-plugins).

Laufzeit- und Konfigurations-Helper befinden sich unter passenden Unterpfaden
`*-runtime`
(`approval-runtime`, `config-runtime`, `infra-runtime`, `agent-runtime`,
`lazy-runtime`, `directory-runtime`, `text-runtime`, `runtime-store` usw.).

<Info>
`openclaw/plugin-sdk/channel-runtime` ist veraltet — ein Kompatibilitäts-Shim für
ältere Plugins. Neuer Code sollte stattdessen schmalere generische Primitive importieren.
</Info>

Repository-interne Entry-Points (pro Root des jeweiligen gebündelten Plugin-Pakets):

- `index.js` — Entry des gebündelten Plugins
- `api.js` — Barrel für Helper/Typen
- `runtime-api.js` — Barrel nur für die Laufzeit
- `setup-entry.js` — Entry für das Setup-Plugin

Externe Plugins sollten nur Unterpfade `openclaw/plugin-sdk/*` importieren. Importieren Sie niemals
`src/*` eines anderen Plugin-Pakets aus dem Core oder aus einem anderen Plugin.
Über Facades geladene Entry-Points bevorzugen den aktiven Snapshot der Laufzeitkonfiguration, wenn vorhanden,
und greifen sonst auf die aufgelöste Konfigurationsdatei auf der Festplatte zurück.

Fähigkeitsspezifische Unterpfade wie `image-generation`, `media-understanding`
und `speech` existieren, weil gebündelte Plugins sie heute verwenden. Sie sind
nicht automatisch langfristig eingefrorene externe Verträge — prüfen Sie die
jeweilige SDK-Referenzseite, wenn Sie sich auf sie verlassen.

## Schemata des Nachrichten-Tools

Plugins sollten channel-spezifische Beiträge zu `describeMessageTool(...)`-
Schemata für Nicht-Nachrichten-Primitive wie Reaktionen, Lesevorgänge und Umfragen
besitzen. Die gemeinsame Präsentation beim Senden sollte den generischen Vertrag
`MessagePresentation` verwenden statt provider-native Felder für Buttons, Komponenten, Blöcke oder Karten.
Den Vertrag, Fallback-Regeln, Provider-Mapping und die Checkliste für Plugin-Autoren finden Sie unter
[Message Presentation](/de/plugins/message-presentation).

Plugins mit Sendefähigkeit deklarieren, was sie über Nachrichtenfähigkeiten rendern können:

- `presentation` für semantische Präsentationsblöcke (`text`, `context`, `divider`, `buttons`, `select`)
- `delivery-pin` für Anfragen zur fixierten Zustellung

Der Core entscheidet, ob die Präsentation nativ gerendert oder auf Text degradiert wird.
Stellen Sie keine provider-nativen Escape-Hatches für die UI aus dem generischen Nachrichtentool bereit.
Veraltete SDK-Helper für Legacy-native Schemata bleiben für bestehende
Drittanbieter-Plugins exportiert, aber neue Plugins sollten sie nicht verwenden.

## Auflösung von Channel-Zielen

Channel-Plugins sollten channel-spezifische Zielsemantik besitzen. Halten Sie den gemeinsamen
Outbound-Host generisch und verwenden Sie die Oberfläche des Messaging-Adapters für Provider-Regeln:

- `messaging.inferTargetChatType({ to })` entscheidet, ob ein normalisiertes Ziel
  vor der Verzeichnissuche als `direct`, `group` oder `channel` behandelt werden soll.
- `messaging.targetResolver.looksLikeId(raw, normalized)` teilt dem Core mit, ob
  eine Eingabe direkt zur id-artigen Auflösung übersprungen werden soll, statt eine Verzeichnissuche durchzuführen.
- `messaging.targetResolver.resolveTarget(...)` ist der Fallback des Plugins, wenn
  der Core nach der Normalisierung oder nach einem Verzeichnis-Fehlschlag eine endgültige providerseitige Auflösung benötigt.
- `messaging.resolveOutboundSessionRoute(...)` besitzt die providerspezifische Konstruktion der Sitzungsroute, sobald ein Ziel aufgelöst wurde.

Empfohlene Aufteilung:

- Verwenden Sie `inferTargetChatType` für Kategorieentscheidungen, die vor
  der Suche nach Peers/Gruppen erfolgen sollten.
- Verwenden Sie `looksLikeId` für Prüfungen der Form „dies als explizite/native Ziel-ID behandeln“.
- Verwenden Sie `resolveTarget` für providerspezifische Normalisierungs-Fallbacks, nicht für
  breite Verzeichnissuche.
- Behalten Sie provider-native IDs wie Chat-IDs, Thread-IDs, JIDs, Handles und Raum-
  IDs innerhalb von `target`-Werten oder providerspezifischen Parametern, nicht in generischen SDK-
  Feldern.

## Konfigurationsgestützte Verzeichnisse

Plugins, die Verzeichniseinträge aus Konfiguration ableiten, sollten diese Logik im
Plugin halten und die gemeinsamen Helper aus
`openclaw/plugin-sdk/directory-runtime` wiederverwenden.

Verwenden Sie dies, wenn ein Channel konfigurationsgestützte Peers/Gruppen benötigt, etwa:

- DM-Peers, die durch Allowlists gesteuert werden
- konfigurierte Channel-/Gruppen-Zuordnungen
- statische Verzeichnis-Fallbacks pro Account

Die gemeinsamen Helper in `directory-runtime` behandeln nur generische Vorgänge:

- Query-Filterung
- Anwenden von Limits
- Deduplizierungs-/Normalisierungs-Helper
- Erzeugen von `ChannelDirectoryEntry[]`

Channelspezifische Account-Inspektion und ID-Normalisierung sollten in der
Plugin-Implementierung verbleiben.

## Provider-Kataloge

Provider-Plugins können Modellkataloge für Inferenz definieren mit
`registerProvider({ catalog: { run(...) { ... } } })`.

`catalog.run(...)` gibt dieselbe Form zurück, die OpenClaw in
`models.providers` schreibt:

- `{ provider }` für einen einzelnen Providereintrag
- `{ providers }` für mehrere Providereinträge

Verwenden Sie `catalog`, wenn das Plugin providerspezifische Modell-IDs, Standardwerte für `baseUrl`
oder auth-geschützte Modellmetadaten besitzt.

`catalog.order` steuert, wann der Katalog eines Plugins relativ zu den impliziten
eingebauten Providern von OpenClaw zusammengeführt wird:

- `simple`: einfache API-Key- oder env-gesteuerte Provider
- `profile`: Provider, die erscheinen, wenn Authentifizierungsprofile vorhanden sind
- `paired`: Provider, die mehrere zusammengehörige Providereinträge synthetisieren
- `late`: letzter Durchlauf, nach anderen impliziten Providern

Spätere Provider gewinnen bei Schlüsselkollisionen, sodass Plugins absichtlich einen
eingebauten Providereintrag mit derselben Provider-ID überschreiben können.

Kompatibilität:

- `discovery` funktioniert weiterhin als veralteter Alias
- wenn sowohl `catalog` als auch `discovery` registriert sind, verwendet OpenClaw `catalog`

## Schreibgeschützte Channel-Inspektion

Wenn Ihr Plugin einen Channel registriert, bevorzugen Sie die Implementierung von
`plugin.config.inspectAccount(cfg, accountId)` neben `resolveAccount(...)`.

Warum:

- `resolveAccount(...)` ist der Laufzeitpfad. Er darf annehmen, dass Anmeldedaten
  vollständig materialisiert sind, und kann schnell fehlschlagen, wenn erforderliche Secrets fehlen.
- Schreibgeschützte Befehlspfade wie `openclaw status`, `openclaw status --all`,
  `openclaw channels status`, `openclaw channels resolve` und Doctor-/Konfigurations-
  Reparaturabläufe sollten Laufzeit-Anmeldedaten nicht materialisieren müssen, nur
  um Konfiguration zu beschreiben.

Empfohlenes Verhalten von `inspectAccount(...)`:

- Nur beschreibenden Account-Status zurückgeben.
- `enabled` und `configured` beibehalten.
- Relevante Felder zur Quelle/zum Status von Anmeldedaten einbeziehen, etwa:
  - `tokenSource`, `tokenStatus`
  - `botTokenSource`, `botTokenStatus`
  - `appTokenSource`, `appTokenStatus`
  - `signingSecretSource`, `signingSecretStatus`
- Sie müssen keine rohen Token-Werte zurückgeben, nur um schreibgeschützte
  Verfügbarkeit zu melden. Es reicht, `tokenStatus: "available"` (und das passende
  Feld zur Quelle) für statusartige Befehle zurückzugeben.
- Verwenden Sie `configured_unavailable`, wenn ein Anmeldedatum über SecretRef konfiguriert ist, im aktuellen Befehlspfad aber nicht verfügbar ist.

Damit können schreibgeschützte Befehle „konfiguriert, aber in diesem Befehlspfad nicht verfügbar“ melden,
statt abzustürzen oder den Account fälschlich als nicht konfiguriert anzuzeigen.

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

Jeder Eintrag wird zu einem Plugin. Wenn das Pack mehrere Extensions aufführt, wird die Plugin-ID
zu `name/<fileBase>`.

Wenn Ihr Plugin npm-Abhängigkeiten importiert, installieren Sie sie in diesem Verzeichnis, damit
`node_modules` verfügbar ist (`npm install` / `pnpm install`).

Sicherheitsleitplanke: Jeder Eintrag in `openclaw.extensions` muss nach der Auflösung von Symlinks innerhalb des Plugin-
Verzeichnisses bleiben. Einträge, die das Paketverzeichnis verlassen, werden
abgelehnt.

Sicherheitshinweis: `openclaw plugins install` installiert Plugin-Abhängigkeiten mit einem
projektlokalen `npm install --omit=dev --ignore-scripts` (keine Lifecycle-Skripte,
keine Dev-Abhängigkeiten zur Laufzeit) und ignoriert geerbte globale npm-Installationseinstellungen.
Halten Sie Plugin-Abhängigkeitsbäume „reines JS/TS“ und vermeiden Sie Pakete, die
`postinstall`-Builds erfordern.

Optional: `openclaw.setupEntry` kann auf ein leichtgewichtiges nur für Setup gedachtes Modul zeigen.
Wenn OpenClaw Setup-Oberflächen für ein deaktiviertes Channel-Plugin benötigt oder
wenn ein Channel-Plugin aktiviert, aber noch nicht konfiguriert ist, lädt es `setupEntry`
statt des vollständigen Plugin-Entrys. Das hält Start und Setup leichter,
wenn Ihr Haupteintrag auch Tools, Hooks oder anderen nur zur Laufzeit benötigten
Code verdrahtet.

Optional: `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`
kann ein Channel-Plugin für dieselbe `setupEntry`-Pfadwahl während der
Startphase des Gateway vor `listen` optieren lassen, selbst wenn der Channel bereits konfiguriert ist.

Verwenden Sie dies nur, wenn `setupEntry` die Startup-Oberfläche vollständig abdeckt, die
vor dem Lauschen des Gateway vorhanden sein muss. In der Praxis bedeutet das, dass der
Setup-Entry jede channel-eigene Fähigkeit registrieren muss, von der der Start abhängt, wie:

- die Channel-Registrierung selbst
- alle HTTP-Routen, die verfügbar sein müssen, bevor das Gateway zu lauschen beginnt
- alle Gateway-Methoden, Tools oder Dienste, die in diesem selben Zeitfenster vorhanden sein müssen

Wenn Ihr vollständiger Entry weiterhin irgendeine erforderliche Startup-Fähigkeit besitzt, aktivieren Sie
dieses Flag nicht. Behalten Sie das Standardverhalten des Plugins bei und lassen Sie OpenClaw
den vollständigen Entry beim Start laden.

Gebündelte Channels können auch nur für Setup gedachte Helper für Vertragsoberflächen veröffentlichen, die der Core
abfragen kann, bevor die vollständige Channel-Laufzeit geladen ist. Die aktuelle Oberfläche zur
Setup-Promotion ist:

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

Der Core verwendet diese Oberfläche, wenn er eine Legacy-Single-Account-Channel-
Konfiguration nach `channels.<id>.accounts.*` hochstufen muss, ohne den vollständigen Plugin-Entry zu laden.
Matrix ist das aktuelle gebündelte Beispiel: Es verschiebt nur Auth-/Bootstrap-Schlüssel in einen
benannten hochgestuften Account, wenn benannte Accounts bereits vorhanden sind, und es kann einen
konfigurierten nicht kanonischen Standard-Account-Schlüssel beibehalten, statt immer
`accounts.default` zu erzeugen.

Diese Setup-Patch-Adapter halten die Erkennung gebündelter Vertragsoberflächen lazy. Die Import-
Zeit bleibt leicht; die Promotionsoberfläche wird nur beim ersten Gebrauch geladen, statt beim Modulimport
erneut in den Startup gebündelter Channels einzusteigen.

Wenn diese Startup-Oberflächen Gateway-RPC-Methoden einschließen, behalten Sie sie unter einem
plugin-spezifischen Präfix. Core-Admin-Namespaces (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) bleiben reserviert und werden immer
zu `operator.admin` aufgelöst, selbst wenn ein Plugin einen engeren Bereich anfordert.

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

### Katalogmetadaten für Channels

Channel-Plugins können Setup-/Erkennungsmetadaten über `openclaw.channel` und
Installationshinweise über `openclaw.install` bewerben. Dadurch bleiben die Katalogdaten im Core frei von Inhalten.

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

Nützliche Felder von `openclaw.channel` über das minimale Beispiel hinaus:

- `detailLabel`: sekundäre Bezeichnung für reichhaltigere Katalog-/Statusoberflächen
- `docsLabel`: überschreibt den Linktext für den Doku-Link
- `preferOver`: Plugin-/Channel-IDs mit niedrigerer Priorität, die dieser Katalogeintrag übertreffen soll
- `selectionDocsPrefix`, `selectionDocsOmitLabel`, `selectionExtras`: Steuerung von Texten auf Auswahloberflächen
- `markdownCapable`: markiert den Channel als markdownfähig für Entscheidungen zur ausgehenden Formatierung
- `exposure.configured`: blendet den Channel auf Oberflächen für konfigurierte Channels aus, wenn auf `false` gesetzt
- `exposure.setup`: blendet den Channel in interaktiven Setup-/Konfigurations-Auswahlen aus, wenn auf `false` gesetzt
- `exposure.docs`: markiert den Channel als intern/privat für Oberflächen der Doku-Navigation
- `showConfigured` / `showInSetup`: veraltete Aliasse, die aus Kompatibilitätsgründen weiterhin akzeptiert werden; bevorzugen Sie `exposure`
- `quickstartAllowFrom`: nimmt den Channel in den standardmäßigen `allowFrom`-Flow des Schnellstarts auf
- `forceAccountBinding`: erzwingt explizites Account-Binding auch dann, wenn nur ein Account existiert
- `preferSessionLookupForAnnounceTarget`: bevorzugt Sitzungsauflösung beim Auflösen von Announcement-Zielen

OpenClaw kann auch **externe Channel-Kataloge** zusammenführen (zum Beispiel einen Export aus
einer MPM-Registry). Legen Sie dazu eine JSON-Datei unter einem der folgenden Pfade ab:

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

Oder zeigen Sie `OPENCLAW_PLUGIN_CATALOG_PATHS` (oder `OPENCLAW_MPM_CATALOG_PATHS`) auf
eine oder mehrere JSON-Dateien (durch Komma/Semikolon/`PATH` getrennt). Jede Datei sollte
`{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }` enthalten. Der Parser akzeptiert außerdem `"packages"` oder `"plugins"` als Legacy-Aliasse für den Schlüssel `"entries"`.

Generierte Einträge im Channel-Katalog und Einträge im Installationskatalog für Provider stellen
normalisierte Fakten zur Installationsquelle neben dem rohen Block `openclaw.install` bereit. Die
normalisierten Fakten geben an, ob die npm-Spezifikation eine exakte Version oder ein
gleitender Selektor ist, ob erwartete Integritätsmetadaten vorhanden sind und ob zusätzlich
ein lokaler Quellpfad verfügbar ist. Wenn die Identität des Katalogs/Pakets bekannt ist,
warnen die normalisierten Fakten, wenn der geparste Name des npm-Pakets von dieser Identität abweicht.
Sie warnen auch, wenn `defaultChoice` ungültig ist oder auf eine Quelle zeigt, die
nicht verfügbar ist, und wenn npm-Integritätsmetadaten ohne gültige npm-Quelle vorhanden sind.
Consumer sollten `installSource` als additiven optionalen Feld behandeln, damit
manuell gebaute Einträge und Katalog-Shims es nicht synthetisieren müssen.
Dadurch können Onboarding und Diagnosen den Zustand der Source Plane erklären, ohne
die Plugin-Laufzeit zu importieren.

Offizielle externe npm-Einträge sollten eine exakte `npmSpec` plus
`expectedIntegrity` bevorzugen. Reine Paketnamen und Dist-Tags funktionieren aus
Kompatibilitätsgründen weiterhin, führen aber zu Warnungen auf Ebene der Source Plane, damit sich der Katalog
in Richtung gepinnter, integritätsgeprüfter Installationen bewegen kann, ohne bestehende Plugins zu
brechen. Wenn Onboarding aus einem lokalen Katalogpfad installiert, zeichnet es einen verwalteten Plugin-
Indexeintrag mit `source: "path"` und einem relativ zum Workspace angegebenen
`sourcePath` auf, wenn möglich. Der absolute operative Ladepfad bleibt in
`plugins.load.paths`; der Installationsdatensatz vermeidet das Duplizieren lokaler Arbeitsstationspfade
in langlebiger Konfiguration. So bleiben lokale Entwicklungsinstallationen für
Diagnosen auf Ebene der Source Plane sichtbar, ohne eine zweite rohe Oberfläche zur Offenlegung von Dateisystempfaden
hinzuzufügen. Der persistierte Plugin-Index `plugins/installs.json` ist die Quelle der Wahrheit für Installationen und kann
aktualisiert werden, ohne Plugin-Laufzeitmodule zu laden.
Seine Zuordnung `installRecords` ist dauerhaft, auch wenn ein Plugin-Manifest fehlt oder
ungültig ist; sein Array `plugins` ist eine neu aufbaubare Sicht auf Manifest/Cache.

## Plugins für die Kontext-Engine

Plugins für die Kontext-Engine besitzen die Orchestrierung des Sitzungskontexts für Aufnahme, Zusammenstellung
und Compaction. Registrieren Sie sie aus Ihrem Plugin mit
`api.registerContextEngine(id, factory)` und wählen Sie dann die aktive Engine mit
`plugins.slots.contextEngine`.

Verwenden Sie dies, wenn Ihr Plugin die Standardpipeline für Kontext
ersetzen oder erweitern muss, statt nur Memory-Suche oder Hooks hinzuzufügen.

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

## Eine neue Fähigkeit hinzufügen

Wenn ein Plugin Verhalten benötigt, das nicht zur aktuellen API passt, umgehen Sie
das Plugin-System nicht mit einem privaten Reach-in. Fügen Sie die fehlende Fähigkeit hinzu.

Empfohlene Reihenfolge:

1. Core-Vertrag definieren
   Entscheiden Sie, welches gemeinsame Verhalten der Core besitzen soll: Richtlinie, Fallback, Konfigurations-Merge,
   Lebenszyklus, channelseitige Semantik und Form des Laufzeit-Helpers.
2. Typisierte Plugin-Registrierungs-/Laufzeitoberflächen hinzufügen
   Erweitern Sie `OpenClawPluginApi` und/oder `api.runtime` um die kleinste nützliche
   typisierte Fähigkeitsoberfläche.
3. Core + Consumer aus Channel/Features verdrahten
   Channels und Feature-Plugins sollten die neue Fähigkeit über den Core verwenden,
   nicht durch direkten Import einer Vendor-Implementierung.
4. Vendor-Implementierungen registrieren
   Vendor-Plugins registrieren dann ihre Backends gegenüber der Fähigkeit.
5. Vertragsabdeckung hinzufügen
   Fügen Sie Tests hinzu, damit Eigentümerschaft und Form der Registrierung im Lauf der Zeit explizit bleiben.

So bleibt OpenClaw meinungsstark, ohne fest an die Sichtweise eines
einzelnen Providers gebunden zu werden. Eine konkrete Dateicheckliste und ein ausgearbeitetes Beispiel finden Sie im [Capability Cookbook](/de/plugins/architecture).

### Checkliste für Fähigkeiten

Wenn Sie eine neue Fähigkeit hinzufügen, sollte die Implementierung diese
Oberflächen normalerweise gemeinsam berühren:

- Core-Vertragstypen in `src/<capability>/types.ts`
- Core-Runner/Laufzeit-Helper in `src/<capability>/runtime.ts`
- Plugin-API-Registrierungsoberfläche in `src/plugins/types.ts`
- Verdrahtung der Plugin-Registry in `src/plugins/registry.ts`
- Exposition der Plugin-Laufzeit in `src/plugins/runtime/*`, wenn Feature-/Channel-
  Plugins sie verwenden müssen
- Capture-/Test-Helper in `src/test-utils/plugin-registration.ts`
- Assertions zu Eigentümerschaft/Vertrag in `src/plugins/contracts/registry.ts`
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

Muster für Vertragstests:

```ts
expect(findVideoGenerationProviderIdsForPlugin("openai")).toEqual(["openai"]);
```

Damit bleibt die Regel einfach:

- der Core besitzt den Fähigkeitsvertrag + die Orchestrierung
- Vendor-Plugins besitzen die Vendor-Implementierungen
- Feature-/Channel-Plugins verwenden Laufzeit-Helper
- Vertragstests halten die Eigentümerschaft explizit

## Verwandte Inhalte

- [Plugin-Architektur](/de/plugins/architecture) — öffentliches Fähigkeitsmodell und Formen
- [Plugin-SDK-Unterpfade](/de/plugins/sdk-subpaths)
- [Plugin-SDK-Setup](/de/plugins/sdk-setup)
- [Plugins erstellen](/de/plugins/building-plugins)
