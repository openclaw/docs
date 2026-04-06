---
read_when:
    - Sie sehen die Warnung OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED
    - Sie sehen die Warnung OPENCLAW_EXTENSION_API_DEPRECATED
    - Sie aktualisieren ein Plugin auf die moderne Plugin-Architektur
    - Sie pflegen ein externes OpenClaw-Plugin
sidebarTitle: Migrate to SDK
summary: Von der veralteten Rückwärtskompatibilitätsschicht auf das moderne Plugin SDK migrieren
title: Migration des Plugin SDK
x-i18n:
    generated_at: "2026-04-06T03:10:34Z"
    model: gpt-5.4
    provider: openai
    source_hash: b71ce69b30c3bb02da1b263b1d11dc3214deae5f6fc708515e23b5a1c7bb7c8f
    source_path: plugins/sdk-migration.md
    workflow: 15
---

# Migration des Plugin SDK

OpenClaw hat sich von einer breiten Rückwärtskompatibilitätsschicht zu einer modernen Plugin-Architektur
mit fokussierten, dokumentierten Imports entwickelt. Wenn Ihr Plugin vor
der neuen Architektur erstellt wurde, hilft Ihnen dieser Leitfaden bei der Migration.

## Was sich ändert

Das alte Plugin-System stellte zwei weit offene Oberflächen bereit, über die Plugins
alles importieren konnten, was sie über einen einzigen Einstiegspunkt benötigten:

- **`openclaw/plugin-sdk/compat`** — ein einzelner Import, der Dutzende von
  Hilfsfunktionen re-exportierte. Er wurde eingeführt, damit ältere hook-basierte Plugins weiter funktionieren,
  während die neue Plugin-Architektur aufgebaut wurde.
- **`openclaw/extension-api`** — eine Brücke, die Plugins direkten Zugriff auf
  hostseitige Hilfsfunktionen wie den eingebetteten Agent-Runner gab.

Beide Oberflächen sind jetzt **veraltet**. Sie funktionieren zur Laufzeit weiterhin, aber neue
Plugins dürfen sie nicht verwenden, und bestehende Plugins sollten vor der nächsten
Hauptversion migrieren, in der sie entfernt werden.

<Warning>
  Die Rückwärtskompatibilitätsschicht wird in einer zukünftigen Hauptversion entfernt.
  Plugins, die weiterhin aus diesen Oberflächen importieren, funktionieren dann nicht mehr.
</Warning>

## Warum sich das geändert hat

Der alte Ansatz verursachte Probleme:

- **Langsamer Start** — der Import einer Hilfsfunktion lud Dutzende nicht zusammenhängender Module
- **Zirkuläre Abhängigkeiten** — breite Re-Exports machten es leicht, Import-Zyklen zu erzeugen
- **Unklare API-Oberfläche** — es gab keine Möglichkeit zu erkennen, welche Exporte stabil und welche intern waren

Das moderne Plugin SDK behebt dies: Jeder Importpfad (`openclaw/plugin-sdk/\<subpath\>`)
ist ein kleines, in sich geschlossenes Modul mit klarem Zweck und dokumentiertem Vertrag.

Veraltete bequeme Provider-Seams für gebündelte Kanäle sind ebenfalls verschwunden. Imports
wie `openclaw/plugin-sdk/slack`, `openclaw/plugin-sdk/discord`,
`openclaw/plugin-sdk/signal`, `openclaw/plugin-sdk/whatsapp`,
kanalmarkenspezifische Helper-Seams und
`openclaw/plugin-sdk/telegram-core` waren private Monorepo-Abkürzungen, keine
stabilen Plugin-Verträge. Verwenden Sie stattdessen schmale generische SDK-Subpaths. Innerhalb des
gebündelten Plugin-Workspace behalten Sie Provider-eigene Hilfsfunktionen in der eigenen
`api.ts` oder `runtime-api.ts` dieses Plugins.

Aktuelle Beispiele für gebündelte Provider:

- Anthropic behält Claude-spezifische Stream-Hilfsfunktionen in seiner eigenen `api.ts` /
  `contract-api.ts`-Seam
- OpenAI behält Provider-Builder, Helfer für Standardmodelle und Realtime-Provider-Builder
  in seiner eigenen `api.ts`
- OpenRouter behält Provider-Builder sowie Hilfsfunktionen für Onboarding/Konfiguration in seiner eigenen
  `api.ts`

## So migrieren Sie

<Steps>
  <Step title="Fallback-Verhalten des Windows-Wrapper prüfen">
    Wenn Ihr Plugin `openclaw/plugin-sdk/windows-spawn` verwendet, schlagen nicht aufgelöste Windows-
    `.cmd`/`.bat`-Wrapper jetzt fail-closed fehl, sofern Sie nicht explizit
    `allowShellFallback: true` übergeben.

    ```typescript
    // Before
    const program = applyWindowsSpawnProgramPolicy({ candidate });

    // After
    const program = applyWindowsSpawnProgramPolicy({
      candidate,
      // Only set this for trusted compatibility callers that intentionally
      // accept shell-mediated fallback.
      allowShellFallback: true,
    });
    ```

    Wenn Ihr Aufrufer nicht absichtlich auf Shell-Fallback angewiesen ist, setzen Sie
    `allowShellFallback` nicht und behandeln Sie stattdessen den ausgelösten Fehler.

  </Step>

  <Step title="Veraltete Imports finden">
    Durchsuchen Sie Ihr Plugin nach Imports aus einer der beiden veralteten Oberflächen:

    ```bash
    grep -r "plugin-sdk/compat" my-plugin/
    grep -r "openclaw/extension-api" my-plugin/
    ```

  </Step>

  <Step title="Durch fokussierte Imports ersetzen">
    Jeder Export aus der alten Oberfläche wird auf einen spezifischen modernen Importpfad abgebildet:

    ```typescript
    // Before (deprecated backwards-compatibility layer)
    import {
      createChannelReplyPipeline,
      createPluginRuntimeStore,
      resolveControlCommandGate,
    } from "openclaw/plugin-sdk/compat";

    // After (modern focused imports)
    import { createChannelReplyPipeline } from "openclaw/plugin-sdk/channel-reply-pipeline";
    import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
    import { resolveControlCommandGate } from "openclaw/plugin-sdk/command-auth";
    ```

    Für hostseitige Hilfsfunktionen verwenden Sie die injizierte Plugin-Runtime, anstatt direkt
    zu importieren:

    ```typescript
    // Before (deprecated extension-api bridge)
    import { runEmbeddedPiAgent } from "openclaw/extension-api";
    const result = await runEmbeddedPiAgent({ sessionId, prompt });

    // After (injected runtime)
    const result = await api.runtime.agent.runEmbeddedPiAgent({ sessionId, prompt });
    ```

    Dasselbe Muster gilt für andere veraltete Bridge-Hilfsfunktionen:

    | Alter Import | Modernes Äquivalent |
    | --- | --- |
    | `resolveAgentDir` | `api.runtime.agent.resolveAgentDir` |
    | `resolveAgentWorkspaceDir` | `api.runtime.agent.resolveAgentWorkspaceDir` |
    | `resolveAgentIdentity` | `api.runtime.agent.resolveAgentIdentity` |
    | `resolveThinkingDefault` | `api.runtime.agent.resolveThinkingDefault` |
    | `resolveAgentTimeoutMs` | `api.runtime.agent.resolveAgentTimeoutMs` |
    | `ensureAgentWorkspace` | `api.runtime.agent.ensureAgentWorkspace` |
    | Sitzungsstore-Hilfsfunktionen | `api.runtime.agent.session.*` |

  </Step>

  <Step title="Build und Tests ausführen">
    ```bash
    pnpm build
    pnpm test -- my-plugin/
    ```
  </Step>
</Steps>

## Referenz der Importpfade

<Accordion title="Tabelle mit häufigen Importpfaden">
  | Importpfad | Zweck | Wichtige Exporte |
  | --- | --- | --- |
  | `plugin-sdk/plugin-entry` | Kanonische Hilfsfunktion für Plugin-Einstiegspunkt | `definePluginEntry` |
  | `plugin-sdk/core` | Veralteter Sammel-Re-Export für Definitionen/Builder von Kanaleinstiegspunkten | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | Export des Root-Konfigurationsschemas | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | Hilfsfunktion für Single-Provider-Einstiegspunkt | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | Fokussierte Definitionen und Builder für Kanaleinstiegspunkte | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
  | `plugin-sdk/setup` | Gemeinsame Hilfsfunktionen für Setup-Assistenten | Allowlist-Prompts, Builder für Setup-Status |
  | `plugin-sdk/setup-runtime` | Runtime-Hilfsfunktionen zur Setup-Zeit | Import-sichere Setup-Patch-Adapter, Hilfsfunktionen für Lookup-Hinweise, `promptResolvedAllowFrom`, `splitSetupEntries`, delegierte Setup-Proxys |
  | `plugin-sdk/setup-adapter-runtime` | Hilfsfunktionen für Setup-Adapter | `createEnvPatchedAccountSetupAdapter` |
  | `plugin-sdk/setup-tools` | Hilfsfunktionen für Setup-Tooling | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | Hilfsfunktionen für mehrere Konten | Hilfsfunktionen für Kontolisten/Konfiguration/Action-Gates |
  | `plugin-sdk/account-id` | Hilfsfunktionen für Account-IDs | `DEFAULT_ACCOUNT_ID`, Normalisierung von Account-IDs |
  | `plugin-sdk/account-resolution` | Hilfsfunktionen für Kontosuche | Kontosuche + Hilfsfunktionen für Standard-Fallback |
  | `plugin-sdk/account-helpers` | Schmale Hilfsfunktionen für Konten | Hilfsfunktionen für Kontolisten/Kontoaktionen |
  | `plugin-sdk/channel-setup` | Adapter für Setup-Assistenten | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, plus `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | Primitive für DM-Kopplung | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | Verdrahtung für Antwortpräfix + Eingabeanzeige | `createChannelReplyPipeline` |
  | `plugin-sdk/channel-config-helpers` | Factorys für Konfigurationsadapter | `createHybridChannelConfigAdapter` |
  | `plugin-sdk/channel-config-schema` | Builder für Konfigurationsschemas | Typen für Kanalkonfigurationsschemas |
  | `plugin-sdk/telegram-command-config` | Hilfsfunktionen für Telegram-Befehlskonfiguration | Normalisierung von Befehlsnamen, Kürzen von Beschreibungen, Validierung von Duplikaten/Konflikten |
  | `plugin-sdk/channel-policy` | Auflösung von Gruppen-/DM-Richtlinien | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | Verfolgung des Kontostatus | `createAccountStatusSink` |
  | `plugin-sdk/inbound-envelope` | Hilfsfunktionen für Inbound-Umschläge | Gemeinsame Hilfsfunktionen für Route- + Umschlag-Builder |
  | `plugin-sdk/inbound-reply-dispatch` | Hilfsfunktionen für eingehende Antworten | Gemeinsame Hilfsfunktionen für Aufzeichnung und Dispatch |
  | `plugin-sdk/messaging-targets` | Parsen von Messaging-Zielen | Hilfsfunktionen zum Parsen/Abgleichen von Zielen |
  | `plugin-sdk/outbound-media` | Hilfsfunktionen für ausgehende Medien | Gemeinsames Laden ausgehender Medien |
  | `plugin-sdk/outbound-runtime` | Runtime-Hilfsfunktionen für Outbound | Hilfsfunktionen für ausgehende Identität/Sende-Delegation |
  | `plugin-sdk/thread-bindings-runtime` | Hilfsfunktionen für Thread-Bindings | Hilfsfunktionen für Lebenszyklus und Adapter von Thread-Bindings |
  | `plugin-sdk/agent-media-payload` | Veraltete Hilfsfunktionen für Medien-Payloads | Builder für Agent-Medien-Payloads für veraltete Feldlayouts |
  | `plugin-sdk/channel-runtime` | Veralteter Kompatibilitäts-Shim | Nur veraltete Kanal-Runtime-Hilfsfunktionen |
  | `plugin-sdk/channel-send-result` | Typen für Sendeergebnisse | Typen für Antwortergebnisse |
  | `plugin-sdk/runtime-store` | Persistenter Plugin-Speicher | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | Breite Runtime-Hilfsfunktionen | Hilfsfunktionen für Runtime/Logging/Backup/Plugin-Installation |
  | `plugin-sdk/runtime-env` | Schmale Hilfsfunktionen für Runtime-Umgebung | Logger/Runtime-Umgebung, Timeout-, Retry- und Backoff-Hilfsfunktionen |
  | `plugin-sdk/plugin-runtime` | Gemeinsame Plugin-Runtime-Hilfsfunktionen | Hilfsfunktionen für Plugin-Befehle/Hooks/HTTP/interaktive Funktionen |
  | `plugin-sdk/hook-runtime` | Hilfsfunktionen für Hook-Pipelines | Gemeinsame Hilfsfunktionen für Webhook-/interne Hook-Pipelines |
  | `plugin-sdk/lazy-runtime` | Hilfsfunktionen für Lazy Runtime | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | Prozesshilfsfunktionen | Gemeinsame Exec-Hilfsfunktionen |
  | `plugin-sdk/cli-runtime` | CLI-Runtime-Hilfsfunktionen | Befehlsformatierung, Wartezeiten, Versionshilfsfunktionen |
  | `plugin-sdk/gateway-runtime` | Gateway-Hilfsfunktionen | Gateway-Client und Hilfsfunktionen für Patches des Kanalstatus |
  | `plugin-sdk/config-runtime` | Konfigurationshilfsfunktionen | Hilfsfunktionen zum Laden/Schreiben von Konfiguration |
  | `plugin-sdk/telegram-command-config` | Hilfsfunktionen für Telegram-Befehle | Fallback-stabile Hilfsfunktionen zur Telegram-Befehlsvalidierung, wenn die Vertragsoberfläche des gebündelten Telegram-Plugins nicht verfügbar ist |
  | `plugin-sdk/approval-runtime` | Hilfsfunktionen für Genehmigungs-Prompts | Exec-/Plugin-Genehmigungs-Payload, Hilfsfunktionen für Genehmigungsfähigkeit/-profil, native Genehmigungs-Routing-/Runtime-Hilfsfunktionen |
  | `plugin-sdk/approval-auth-runtime` | Hilfsfunktionen für Genehmigungs-Authentifizierung | Auflösung von Genehmigenden, Authentifizierung für Aktionen im selben Chat |
  | `plugin-sdk/approval-client-runtime` | Hilfsfunktionen für Genehmigungs-Client | Hilfsfunktionen für Profile/Filter nativer Exec-Genehmigungen |
  | `plugin-sdk/approval-delivery-runtime` | Hilfsfunktionen für Genehmigungszustellung | Adapter für native Genehmigungsfähigkeit/-zustellung |
  | `plugin-sdk/approval-native-runtime` | Hilfsfunktionen für Genehmigungsziele | Hilfsfunktionen für native Genehmigungsziel-/Kontobindung |
  | `plugin-sdk/approval-reply-runtime` | Hilfsfunktionen für Genehmigungsantworten | Hilfsfunktionen für Antwort-Payloads von Exec-/Plugin-Genehmigungen |
  | `plugin-sdk/security-runtime` | Sicherheitshilfsfunktionen | Gemeinsame Hilfsfunktionen für Vertrauen, DM-Gating, externe Inhalte und Secret-Erfassung |
  | `plugin-sdk/ssrf-policy` | Hilfsfunktionen für SSRF-Richtlinien | Hilfsfunktionen für Host-Allowlist und Richtlinien für private Netzwerke |
  | `plugin-sdk/ssrf-runtime` | SSRF-Runtime-Hilfsfunktionen | Pinned-Dispatcher, Guarded Fetch, SSRF-Richtlinienhilfsfunktionen |
  | `plugin-sdk/collection-runtime` | Hilfsfunktionen für begrenzten Cache | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | Hilfsfunktionen für Diagnose-Gating | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | Hilfsfunktionen zur Fehlerformatierung | `formatUncaughtError`, `isApprovalNotFoundError`, Hilfsfunktionen für Fehlergraphen |
  | `plugin-sdk/fetch-runtime` | Wrapped Fetch-/Proxy-Hilfsfunktionen | `resolveFetch`, Proxy-Hilfsfunktionen |
  | `plugin-sdk/host-runtime` | Hilfsfunktionen zur Host-Normalisierung | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | Retry-Hilfsfunktionen | `RetryConfig`, `retryAsync`, Policy-Runner |
  | `plugin-sdk/allow-from` | Formatierung von Allowlists | `formatAllowFromLowercase` |
  | `plugin-sdk/allowlist-resolution` | Mapping von Allowlist-Eingaben | `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | Befehls-Gating- und Hilfsfunktionen für Befehlsoberflächen | `resolveControlCommandGate`, Hilfsfunktionen für Sender-Autorisierung, Hilfsfunktionen für Befehlsregistrierung |
  | `plugin-sdk/secret-input` | Parsing von Secret-Eingaben | Hilfsfunktionen für Secret-Eingaben |
  | `plugin-sdk/webhook-ingress` | Hilfsfunktionen für Webhook-Anfragen | Hilfsfunktionen für Webhook-Ziele |
  | `plugin-sdk/webhook-request-guards` | Hilfsfunktionen für Guards von Webhook-Bodys | Hilfsfunktionen zum Lesen/Begrenzen von Request-Bodys |
  | `plugin-sdk/reply-runtime` | Gemeinsame Antwort-Runtime | Inbound-Dispatch, Heartbeat, Antwortplanung, Chunking |
  | `plugin-sdk/reply-dispatch-runtime` | Schmale Hilfsfunktionen für Antwort-Dispatch | Hilfsfunktionen für Finalisierung + Provider-Dispatch |
  | `plugin-sdk/reply-history` | Hilfsfunktionen für Antwortverlauf | `buildHistoryContext`, `buildPendingHistoryContextFromMap`, `recordPendingHistoryEntry`, `clearHistoryEntriesIfEnabled` |
  | `plugin-sdk/reply-reference` | Planung von Antwortreferenzen | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | Hilfsfunktionen für Antwort-Chunks | Hilfsfunktionen für Text-/Markdown-Chunking |
  | `plugin-sdk/session-store-runtime` | Hilfsfunktionen für Session-Store | Hilfsfunktionen für Store-Pfad + updated-at |
  | `plugin-sdk/state-paths` | Hilfsfunktionen für State-Pfade | Hilfsfunktionen für State- und OAuth-Verzeichnisse |
  | `plugin-sdk/routing` | Hilfsfunktionen für Routing/Sitzungsschlüssel | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId`, Hilfsfunktionen zur Normalisierung von Sitzungsschlüsseln |
  | `plugin-sdk/status-helpers` | Hilfsfunktionen für Kanalstatus | Builder für Zusammenfassungen von Kanal-/Kontostatus, Runtime-State-Standards, Hilfsfunktionen für Issue-Metadaten |
  | `plugin-sdk/target-resolver-runtime` | Hilfsfunktionen für Target Resolver | Gemeinsame Hilfsfunktionen für Target Resolver |
  | `plugin-sdk/string-normalization-runtime` | Hilfsfunktionen für String-Normalisierung | Hilfsfunktionen für Slug-/String-Normalisierung |
  | `plugin-sdk/request-url` | Hilfsfunktionen für Request-URLs | String-URLs aus request-ähnlichen Eingaben extrahieren |
  | `plugin-sdk/run-command` | Hilfsfunktionen für zeitgesteuerte Befehle | Timed Command Runner mit normalisiertem stdout/stderr |
  | `plugin-sdk/param-readers` | Param-Reader | Gemeinsame Param-Reader für Tool/CLI |
  | `plugin-sdk/tool-send` | Extraktion von Tool-Send | Kanonische Send-Zielfelder aus Tool-Argumenten extrahieren |
  | `plugin-sdk/temp-path` | Hilfsfunktionen für Temp-Pfade | Gemeinsame Hilfsfunktionen für Temp-Download-Pfade |
  | `plugin-sdk/logging-core` | Logging-Hilfsfunktionen | Subsystem-Logger und Hilfsfunktionen für Schwärzung |
  | `plugin-sdk/markdown-table-runtime` | Hilfsfunktionen für Markdown-Tabellen | Hilfsfunktionen für Modus von Markdown-Tabellen |
  | `plugin-sdk/reply-payload` | Typen für Nachrichtenantworten | Typen für Antwort-Payloads |
  | `plugin-sdk/provider-setup` | Kuratierte Hilfsfunktionen für das Setup lokaler/self-hosted Provider | Hilfsfunktionen für Discovery/Konfiguration self-hosted Provider |
  | `plugin-sdk/self-hosted-provider-setup` | Fokussierte Hilfsfunktionen für das Setup self-hosted OpenAI-kompatibler Provider | Dieselben Hilfsfunktionen für Discovery/Konfiguration self-hosted Provider |
  | `plugin-sdk/provider-auth-runtime` | Runtime-Hilfsfunktionen für Provider-Authentifizierung | Hilfsfunktionen zur Auflösung von Runtime-API-Schlüsseln |
  | `plugin-sdk/provider-auth-api-key` | Hilfsfunktionen für die Einrichtung von Provider-API-Schlüsseln | Hilfsfunktionen für API-Key-Onboarding/Profilschreibvorgänge |
  | `plugin-sdk/provider-auth-result` | Hilfsfunktionen für Provider-Auth-Ergebnisse | Standard-Builder für OAuth-Auth-Ergebnisse |
  | `plugin-sdk/provider-auth-login` | Hilfsfunktionen für interaktive Provider-Anmeldung | Gemeinsame Hilfsfunktionen für interaktive Anmeldung |
  | `plugin-sdk/provider-env-vars` | Hilfsfunktionen für Provider-Env-Variablen | Hilfsfunktionen für die Suche von Env-Variablen für Provider-Authentifizierung |
  | `plugin-sdk/provider-model-shared` | Gemeinsame Hilfsfunktionen für Provider-Modell/Wiedergabe | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, gemeinsame Builder für Replay-Richtlinien, Hilfsfunktionen für Provider-Endpunkte und Normalisierung von Modell-IDs |
  | `plugin-sdk/provider-catalog-shared` | Gemeinsame Hilfsfunktionen für Provider-Kataloge | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
  | `plugin-sdk/provider-onboard` | Patches für Provider-Onboarding | Hilfsfunktionen für Onboarding-Konfiguration |
  | `plugin-sdk/provider-http` | Hilfsfunktionen für Provider-HTTP | Generische Hilfsfunktionen für HTTP-/Endpunktfähigkeiten von Providern |
  | `plugin-sdk/provider-web-fetch` | Hilfsfunktionen für Web-Fetch von Providern | Hilfsfunktionen für Registrierung/Cache von Web-Fetch-Providern |
  | `plugin-sdk/provider-web-search` | Hilfsfunktionen für Web-Suche von Providern | Hilfsfunktionen für Registrierung/Cache/Konfiguration von Web-Such-Providern |
  | `plugin-sdk/provider-tools` | Hilfsfunktionen für Provider-Tool-/Schema-Kompatibilität | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, Gemini-Schema-Bereinigung + Diagnostik und xAI-Kompatibilitäts-Hilfsfunktionen wie `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
  | `plugin-sdk/provider-usage` | Hilfsfunktionen für Provider-Nutzung | `fetchClaudeUsage`, `fetchGeminiUsage`, `fetchGithubCopilotUsage` und andere Hilfsfunktionen für Provider-Nutzung |
  | `plugin-sdk/provider-stream` | Hilfsfunktionen für Provider-Stream-Wrapper | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, Typen für Stream-Wrapper und gemeinsame Wrapper-Hilfsfunktionen für Anthropic/Bedrock/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
  | `plugin-sdk/keyed-async-queue` | Geordnete Async-Warteschlange | `KeyedAsyncQueue` |
  | `plugin-sdk/media-runtime` | Gemeinsame Medienhilfsfunktionen | Hilfsfunktionen für Media Fetch/Transform/Store plus Builder für Medien-Payloads |
  | `plugin-sdk/media-understanding` | Hilfsfunktionen für Medienverständnis | Typen für Media-Understanding-Provider plus providerseitige Exporte für Bild-/Audio-Hilfsfunktionen |
  | `plugin-sdk/text-runtime` | Gemeinsame Texthilfsfunktionen | Entfernen von assistant-sichtbarem Text, Hilfsfunktionen für Rendern/Chunking/Tabellen von Markdown, Schwärzungshilfsfunktionen, Directive-Tag-Hilfsfunktionen, Safe-Text-Utilities und verwandte Hilfsfunktionen für Text/Logging |
  | `plugin-sdk/text-chunking` | Hilfsfunktionen für Text-Chunking | Hilfsfunktion für ausgehendes Text-Chunking |
  | `plugin-sdk/speech` | Hilfsfunktionen für Speech | Typen für Speech-Provider plus providerseitige Hilfsfunktionen für Direktiven, Registry und Validierung |
  | `plugin-sdk/speech-core` | Gemeinsamer Speech-Kern | Typen für Speech-Provider, Registry, Direktiven, Normalisierung |
  | `plugin-sdk/realtime-transcription` | Hilfsfunktionen für Realtime-Transkription | Hilfsfunktionen für Provider-Typen und Registry |
  | `plugin-sdk/realtime-voice` | Hilfsfunktionen für Realtime-Voice | Hilfsfunktionen für Provider-Typen und Registry |
  | `plugin-sdk/image-generation-core` | Gemeinsamer Bildgenerierungs-Kern | Hilfsfunktionen für Bildgenerierungstypen, Failover, Auth und Registry |
  | `plugin-sdk/music-generation` | Hilfsfunktionen für Musikgenerierung | Typen für Musikgenerierungs-Provider/Requests/Ergebnisse |
  | `plugin-sdk/music-generation-core` | Gemeinsamer Musikgenerierungs-Kern | Hilfsfunktionen für Musikgenerierungstypen, Failover, Providersuche und Parsen von Modellreferenzen |
  | `plugin-sdk/video-generation` | Hilfsfunktionen für Videogenerierung | Typen für Videogenerierungs-Provider/Requests/Ergebnisse |
  | `plugin-sdk/video-generation-core` | Gemeinsamer Videogenerierungs-Kern | Hilfsfunktionen für Videogenerierungstypen, Failover, Providersuche und Parsen von Modellreferenzen |
  | `plugin-sdk/interactive-runtime` | Hilfsfunktionen für interaktive Antworten | Normalisierung/Reduktion von Payloads für interaktive Antworten |
  | `plugin-sdk/channel-config-primitives` | Primitive für Kanalkonfiguration | Schmale Primitive für Kanalkonfigurationsschemas |
  | `plugin-sdk/channel-config-writes` | Hilfsfunktionen für Schreibvorgänge an Kanalkonfiguration | Hilfsfunktionen für Autorisierung von Schreibvorgängen an Kanalkonfiguration |
  | `plugin-sdk/channel-plugin-common` | Gemeinsames Kanal-Präludium | Exporte für gemeinsames Kanal-Plugin-Präludium |
  | `plugin-sdk/channel-status` | Hilfsfunktionen für Kanalstatus | Gemeinsame Hilfsfunktionen für Snapshot/Zusammenfassung des Kanalstatus |
  | `plugin-sdk/allowlist-config-edit` | Hilfsfunktionen für Allowlist-Konfiguration | Hilfsfunktionen zum Bearbeiten/Lesen von Allowlist-Konfiguration |
  | `plugin-sdk/group-access` | Hilfsfunktionen für Gruppenzugriff | Gemeinsame Hilfsfunktionen für Entscheidungen zum Gruppenzugriff |
  | `plugin-sdk/direct-dm` | Hilfsfunktionen für direkte DMs | Gemeinsame Hilfsfunktionen für Auth/Guards direkter DMs |
  | `plugin-sdk/extension-shared` | Gemeinsame Erweiterungshilfsfunktionen | Primitive Hilfsfunktionen für passive Kanäle/Status |
  | `plugin-sdk/webhook-targets` | Hilfsfunktionen für Webhook-Ziele | Registry für Webhook-Ziele und Hilfsfunktionen zur Routeninstallation |
  | `plugin-sdk/webhook-path` | Hilfsfunktionen für Webhook-Pfade | Hilfsfunktionen zur Normalisierung von Webhook-Pfaden |
  | `plugin-sdk/web-media` | Gemeinsame Hilfsfunktionen für Web-Medien | Hilfsfunktionen zum Laden entfernter/lokaler Medien |
  | `plugin-sdk/zod` | Re-Export von Zod | Re-exportiertes `zod` für Konsumenten des Plugin SDK |
  | `plugin-sdk/memory-core` | Gebündelte Hilfsfunktionen für memory-core | Oberfläche von Hilfsfunktionen für Memory-Manager/Konfiguration/Datei/CLI |
  | `plugin-sdk/memory-core-engine-runtime` | Runtime-Fassade für Memory-Engine | Runtime-Fassade für Memory-Index/-Suche |
  | `plugin-sdk/memory-core-host-engine-foundation` | Foundation-Engine für Memory-Host | Exporte der Foundation-Engine für Memory-Host |
  | `plugin-sdk/memory-core-host-engine-embeddings` | Embedding-Engine für Memory-Host | Exporte der Embedding-Engine für Memory-Host |
  | `plugin-sdk/memory-core-host-engine-qmd` | QMD-Engine für Memory-Host | Exporte der QMD-Engine für Memory-Host |
  | `plugin-sdk/memory-core-host-engine-storage` | Storage-Engine für Memory-Host | Exporte der Storage-Engine für Memory-Host |
  | `plugin-sdk/memory-core-host-multimodal` | Multimodale Hilfsfunktionen für Memory-Host | Multimodale Hilfsfunktionen für Memory-Host |
  | `plugin-sdk/memory-core-host-query` | Query-Hilfsfunktionen für Memory-Host | Query-Hilfsfunktionen für Memory-Host |
  | `plugin-sdk/memory-core-host-secret` | Secret-Hilfsfunktionen für Memory-Host | Secret-Hilfsfunktionen für Memory-Host |
  | `plugin-sdk/memory-core-host-status` | Status-Hilfsfunktionen für Memory-Host | Status-Hilfsfunktionen für Memory-Host |
  | `plugin-sdk/memory-core-host-runtime-cli` | CLI-Runtime für Memory-Host | CLI-Runtime-Hilfsfunktionen für Memory-Host |
  | `plugin-sdk/memory-core-host-runtime-core` | Core-Runtime für Memory-Host | Core-Runtime-Hilfsfunktionen für Memory-Host |
  | `plugin-sdk/memory-core-host-runtime-files` | Datei-/Runtime-Hilfsfunktionen für Memory-Host | Datei-/Runtime-Hilfsfunktionen für Memory-Host |
  | `plugin-sdk/memory-lancedb` | Gebündelte Hilfsfunktionen für memory-lancedb | Hilfsoberfläche für memory-lancedb |
  | `plugin-sdk/testing` | Test-Utilities | Test-Hilfsfunktionen und Mocks |
</Accordion>

Diese Tabelle ist absichtlich die häufige Migrations-Teilmenge, nicht die vollständige
SDK-Oberfläche. Die vollständige Liste mit mehr als 200 Einstiegspunkten befindet sich in
`scripts/lib/plugin-sdk-entrypoints.json`.

Diese Liste enthält weiterhin einige Helper-Seams für gebündelte Plugins wie
`plugin-sdk/feishu`, `plugin-sdk/feishu-setup`, `plugin-sdk/zalo`,
`plugin-sdk/zalo-setup` und `plugin-sdk/matrix*`. Diese bleiben für die Wartung
gebündelter Plugins und aus Kompatibilitätsgründen exportiert, werden aber absichtlich
nicht in der Tabelle häufiger Migrationen aufgeführt und sind kein empfohlenes Ziel für
neuen Plugin-Code.

Dieselbe Regel gilt für andere Familien gebündelter Hilfsfunktionen, wie:

- Browser-Support-Hilfsfunktionen: `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support`
- Matrix: `plugin-sdk/matrix*`
- LINE: `plugin-sdk/line*`
- IRC: `plugin-sdk/irc*`
- gebündelte Helper-/Plugin-Oberflächen wie `plugin-sdk/googlechat`,
  `plugin-sdk/zalouser`, `plugin-sdk/bluebubbles*`,
  `plugin-sdk/mattermost*`, `plugin-sdk/msteams`,
  `plugin-sdk/nextcloud-talk`, `plugin-sdk/nostr`, `plugin-sdk/tlon`,
  `plugin-sdk/twitch`,
  `plugin-sdk/github-copilot-login`, `plugin-sdk/github-copilot-token`,
  `plugin-sdk/diagnostics-otel`, `plugin-sdk/diffs`, `plugin-sdk/llm-task`,
  `plugin-sdk/thread-ownership` und `plugin-sdk/voice-call`

`plugin-sdk/github-copilot-token` stellt derzeit die schmale
Token-Helper-Oberfläche `DEFAULT_COPILOT_API_BASE_URL`,
`deriveCopilotApiBaseUrlFromToken` und `resolveCopilotApiToken` bereit.

Verwenden Sie den schmalsten Import, der zur Aufgabe passt. Wenn Sie keinen Export finden können,
prüfen Sie den Quellcode unter `src/plugin-sdk/` oder fragen Sie in Discord.

## Zeitplan für die Entfernung

| Wann | Was passiert |
| --- | --- |
| **Jetzt** | Veraltete Oberflächen geben Runtime-Warnungen aus |
| **Nächste Hauptversion** | Veraltete Oberflächen werden entfernt; Plugins, die sie noch verwenden, schlagen fehl |

Alle Core-Plugins wurden bereits migriert. Externe Plugins sollten vor
der nächsten Hauptversion migrieren.

## Warnungen vorübergehend unterdrücken

Setzen Sie diese Umgebungsvariablen, während Sie an der Migration arbeiten:

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

Dies ist eine vorübergehende Notlösung, keine dauerhafte Lösung.

## Verwandt

- [Erste Schritte](/de/plugins/building-plugins) — Ihr erstes Plugin erstellen
- [SDK Overview](/de/plugins/sdk-overview) — vollständige Referenz für Subpath-Imports
- [Channel Plugins](/de/plugins/sdk-channel-plugins) — Channel-Plugins erstellen
- [Provider Plugins](/de/plugins/sdk-provider-plugins) — Provider-Plugins erstellen
- [Plugin Internals](/de/plugins/architecture) — tiefer Einblick in die Architektur
- [Plugin Manifest](/de/plugins/manifest) — Referenz zum Manifest-Schema
