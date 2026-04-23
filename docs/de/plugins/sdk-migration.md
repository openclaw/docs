---
read_when:
    - Sie sehen die Warnung OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED
    - Sie sehen die Warnung OPENCLAW_EXTENSION_API_DEPRECATED
    - Sie aktualisieren ein Plugin auf die moderne Plugin-Architektur
    - Sie warten ein externes OpenClaw Plugin
sidebarTitle: Migrate to SDK
summary: Von der veralteten Abwärtskompatibilitätsschicht zur modernen Plugin-SDK migrieren
title: Plugin-SDK-Migration
x-i18n:
    generated_at: "2026-04-23T06:31:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8f21fc911a961bf88f6487dae0c1c2f54c0759911b2a992ae6285aa2f8704006
    source_path: plugins/sdk-migration.md
    workflow: 15
---

# Plugin-SDK-Migration

OpenClaw ist von einer breiten Abwärtskompatibilitätsschicht zu einer modernen Plugin-
Architektur mit fokussierten, dokumentierten Imports übergegangen. Wenn Ihr Plugin vor
der neuen Architektur erstellt wurde, hilft Ihnen diese Anleitung bei der Migration.

## Was sich ändert

Das alte Plugin-System stellte zwei weit offene Oberflächen bereit, über die Plugins
alles, was sie brauchten, aus einem einzigen Einstiegspunkt importieren konnten:

- **`openclaw/plugin-sdk/compat`** — ein einzelner Import, der Dutzende von
  Hilfsfunktionen re-exportierte. Er wurde eingeführt, um ältere hookbasierte Plugins
  funktionsfähig zu halten, während die neue Plugin-Architektur aufgebaut wurde.
- **`openclaw/extension-api`** — eine Bridge, die Plugins direkten Zugriff auf
  hostseitige Hilfsfunktionen wie den eingebetteten Agent-Runner gab.

Beide Oberflächen sind jetzt **veraltet**. Sie funktionieren zur Laufzeit weiterhin,
aber neue Plugins dürfen sie nicht verwenden, und bestehende Plugins sollten vor dem
nächsten Major-Release migrieren, in dem sie entfernt werden.

<Warning>
  Die Abwärtskompatibilitätsschicht wird in einem zukünftigen Major-Release entfernt.
  Plugins, die weiterhin aus diesen Oberflächen importieren, werden dann nicht mehr funktionieren.
</Warning>

## Warum sich das geändert hat

Der alte Ansatz verursachte Probleme:

- **Langsamer Start** — das Importieren einer Hilfsfunktion lud Dutzende nicht zusammenhängender Module
- **Zirkuläre Abhängigkeiten** — breite Re-Exports machten es leicht, Importzyklen zu erzeugen
- **Unklare API-Oberfläche** — es gab keine Möglichkeit zu erkennen, welche Exporte stabil bzw. intern waren

Die moderne Plugin-SDK behebt das: Jeder Importpfad (`openclaw/plugin-sdk/\<subpath\>`)
ist ein kleines, in sich geschlossenes Modul mit klarem Zweck und dokumentiertem Vertrag.

Veraltete Convenience-Schnittstellen für Provider gebündelter Kanäle sind ebenfalls verschwunden. Importe
wie `openclaw/plugin-sdk/slack`, `openclaw/plugin-sdk/discord`,
`openclaw/plugin-sdk/signal`, `openclaw/plugin-sdk/whatsapp`,
kanalmarkenspezifische Hilfsschnittstellen und
`openclaw/plugin-sdk/telegram-core` waren private Shortcuts des Mono-Repositorys, keine
stabilen Plugin-Verträge. Verwenden Sie stattdessen schmale generische SDK-Unterpfade. Innerhalb des
Workspace für gebündelte Plugins sollten provider-eigene Hilfsfunktionen im eigenen
`api.ts` oder `runtime-api.ts` dieses Plugins bleiben.

Aktuelle Beispiele gebündelter Provider:

- Anthropic hält Claude-spezifische Stream-Helfer in der eigenen Schnittstelle `api.ts` /
  `contract-api.ts`
- OpenAI hält Provider-Builder, Standardmodell-Helfer und Realtime-Provider-
  Builder in der eigenen `api.ts`
- OpenRouter hält Provider-Builder sowie Onboarding-/Konfigurationshelfer in der eigenen
  `api.ts`

## So migrieren Sie

<Steps>
  <Step title="Approval-native Handler auf Capability-Facts migrieren">
    Approval-fähige Kanal-Plugins stellen natives Approval-Verhalten jetzt über
    `approvalCapability.nativeRuntime` plus das gemeinsame Laufzeitkontext-Register bereit.

    Wichtige Änderungen:

    - Ersetzen Sie `approvalCapability.handler.loadRuntime(...)` durch
      `approvalCapability.nativeRuntime`
    - Verschieben Sie approvalspezifische Auth-/Zustelllogik aus der veralteten Verdrahtung `plugin.auth` /
      `plugin.approvals` auf `approvalCapability`
    - `ChannelPlugin.approvals` wurde aus dem öffentlichen Vertrag für Kanal-Plugins
      entfernt; verschieben Sie Felder für Zustellung/Nativ/Rendering nach `approvalCapability`
    - `plugin.auth` bleibt nur für Kanal-Login-/Logout-Flows bestehen; dortige Approval-Auth-
      Hooks werden vom Core nicht mehr gelesen
    - Registrieren Sie kanaleigene Laufzeitobjekte wie Clients, Tokens oder Bolt-
      Apps über `openclaw/plugin-sdk/channel-runtime-context`
    - Senden Sie keine plugin-eigenen Umleitungsbenachrichtigungen aus nativen Approval-Handlern;
      der Core besitzt jetzt Benachrichtigungen „anderswo geroutet“ aus tatsächlichen Zustellergebnissen
    - Wenn Sie `channelRuntime` an `createChannelManager(...)` übergeben, stellen Sie eine
      echte Oberfläche `createPluginRuntime().channel` bereit. Partielle Stubs werden abgelehnt.

    Siehe `/plugins/sdk-channel-plugins` für das aktuelle Layout der Approval-Fähigkeiten.

  </Step>

  <Step title="Fallback-Verhalten des Windows-Wrappers prüfen">
    Wenn Ihr Plugin `openclaw/plugin-sdk/windows-spawn` verwendet, schlagen nicht aufgelöste Windows-
    Wrapper `.cmd`/`.bat` jetzt standardmäßig fehl, sofern Sie nicht explizit
    `allowShellFallback: true` übergeben.

    ```typescript
    // Vorher
    const program = applyWindowsSpawnProgramPolicy({ candidate });

    // Nachher
    const program = applyWindowsSpawnProgramPolicy({
      candidate,
      // Nur für vertrauenswürdige Kompatibilitätsaufrufer setzen, die bewusst
      // shellvermittelten Fallback akzeptieren.
      allowShellFallback: true,
    });
    ```

    Wenn Ihr Aufrufer nicht bewusst auf Shell-Fallback angewiesen ist, setzen Sie
    `allowShellFallback` nicht und behandeln Sie stattdessen den ausgelösten Fehler.

  </Step>

  <Step title="Veraltete Importe finden">
    Durchsuchen Sie Ihr Plugin nach Importen aus einer der beiden veralteten Oberflächen:

    ```bash
    grep -r "plugin-sdk/compat" my-plugin/
    grep -r "openclaw/extension-api" my-plugin/
    ```

  </Step>

  <Step title="Durch fokussierte Importe ersetzen">
    Jeder Export aus der alten Oberfläche wird einem bestimmten modernen Importpfad zugeordnet:

    ```typescript
    // Vorher (veraltete Abwärtskompatibilitätsschicht)
    import {
      createChannelReplyPipeline,
      createPluginRuntimeStore,
      resolveControlCommandGate,
    } from "openclaw/plugin-sdk/compat";

    // Nachher (moderne fokussierte Importe)
    import { createChannelReplyPipeline } from "openclaw/plugin-sdk/channel-reply-pipeline";
    import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
    import { resolveControlCommandGate } from "openclaw/plugin-sdk/command-auth";
    ```

    Für hostseitige Hilfsfunktionen verwenden Sie die injizierte Plugin-Laufzeit statt
    direkter Imports:

    ```typescript
    // Vorher (veraltete extension-api-Bridge)
    import { runEmbeddedPiAgent } from "openclaw/extension-api";
    const result = await runEmbeddedPiAgent({ sessionId, prompt });

    // Nachher (injizierte Laufzeit)
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
    | Hilfsfunktionen für den Sitzungsspeicher | `api.runtime.agent.session.*` |

  </Step>

  <Step title="Bauen und testen">
    ```bash
    pnpm build
    pnpm test -- my-plugin/
    ```
  </Step>
</Steps>

## Referenz der Importpfade

  <Accordion title="Tabelle häufiger Importpfade">
  | Importpfad | Zweck | Wichtige Exporte |
  | --- | --- | --- |
  | `plugin-sdk/plugin-entry` | Kanonischer Plugin-Entry-Helfer | `definePluginEntry` |
  | `plugin-sdk/core` | Veralteter Umbrella-Re-Export für Kanal-Entry-Definitionen/-Builder | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | Root-Konfigurationsschema-Export | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | Entry-Helfer für einzelne Provider | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | Fokussierte Kanal-Entry-Definitionen und -Builder | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
  | `plugin-sdk/setup` | Gemeinsame Helfer für den Setup-Assistenten | Allowlist-Prompts, Setup-Status-Builder |
  | `plugin-sdk/setup-runtime` | Laufzeithelfer für die Setup-Zeit | Importsichere Adapter für Setup-Patches, Lookup-Note-Helfer, `promptResolvedAllowFrom`, `splitSetupEntries`, delegierte Setup-Proxys |
  | `plugin-sdk/setup-adapter-runtime` | Helfer für Setup-Adapter | `createEnvPatchedAccountSetupAdapter` |
  | `plugin-sdk/setup-tools` | Helfer für Setup-Tools | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | Helfer für mehrere Konten | Helfer für Kontolisten/Konfiguration/Aktions-Gates |
  | `plugin-sdk/account-id` | Helfer für Konto-IDs | `DEFAULT_ACCOUNT_ID`, Konto-ID-Normalisierung |
  | `plugin-sdk/account-resolution` | Helfer für Kontonachschläge | Helfer für Kontonachschlag + Standard-Fallback |
  | `plugin-sdk/account-helpers` | Schmale Kontohelfer | Helfer für Kontolisten/Kontoaktionen |
  | `plugin-sdk/channel-setup` | Adapter für den Setup-Assistenten | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, plus `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | Primitive für DM-Pairing | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | Verdrahtung von Antwortpräfix + Tippen | `createChannelReplyPipeline` |
  | `plugin-sdk/channel-config-helpers` | Fabriken für Konfigurationsadapter | `createHybridChannelConfigAdapter` |
  | `plugin-sdk/channel-config-schema` | Builder für Konfigurationsschemata | Typen für Kanalkonfigurationsschemata |
  | `plugin-sdk/telegram-command-config` | Helfer für Telegram-Befehlskonfiguration | Normalisierung von Befehlsnamen, Kürzen von Beschreibungen, Validierung von Duplikaten/Konflikten |
  | `plugin-sdk/channel-policy` | Auflösung von Gruppen-/DM-Richtlinien | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | Helfer für Kontostatus und Lebenszyklus von Entwurfs-Streams | `createAccountStatusSink`, Helfer für die Finalisierung von Entwurfsvorschauen |
  | `plugin-sdk/inbound-envelope` | Helfer für eingehende Envelopes | Gemeinsame Helfer für Routen- + Envelope-Builder |
  | `plugin-sdk/inbound-reply-dispatch` | Helfer für eingehende Antworten | Gemeinsame Helfer für Aufzeichnen und Dispatch |
  | `plugin-sdk/messaging-targets` | Parsing von Messaging-Zielen | Helfer für Ziel-Parsing/-Matching |
  | `plugin-sdk/outbound-media` | Helfer für ausgehende Medien | Gemeinsames Laden ausgehender Medien |
  | `plugin-sdk/outbound-runtime` | Laufzeithelfer für ausgehende Daten | Helfer für ausgehende Identität/Sende-Delegation und Payload-Planung |
  | `plugin-sdk/thread-bindings-runtime` | Helfer für Thread-Bindings | Helfer für Lebenszyklus und Adapter von Thread-Bindings |
  | `plugin-sdk/agent-media-payload` | Veraltete Helfer für Medien-Payloads | Agent-Medien-Payload-Builder für veraltete Feldlayouts |
  | `plugin-sdk/channel-runtime` | Veralteter Kompatibilitäts-Shim | Nur veraltete Kanal-Laufzeit-Hilfsfunktionen |
  | `plugin-sdk/channel-send-result` | Typen für Sendeergebnisse | Antwortergebnistypen |
  | `plugin-sdk/runtime-store` | Persistenter Plugin-Speicher | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | Breite Laufzeithelfer | Laufzeit-/Logging-/Backup-/Plugin-Installationshelfer |
  | `plugin-sdk/runtime-env` | Schmale Helfer für die Laufzeitumgebung | Logger/Laufzeitumgebung, Timeout-, Retry- und Backoff-Helfer |
  | `plugin-sdk/plugin-runtime` | Gemeinsame Plugin-Laufzeithelfer | Helfer für Plugin-Befehle/Hooks/HTTP/Interaktivität |
  | `plugin-sdk/hook-runtime` | Helfer für Hook-Pipelines | Gemeinsame Helfer für Webhook-/interne Hook-Pipelines |
  | `plugin-sdk/lazy-runtime` | Helfer für Lazy Runtime | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | Prozesshelfer | Gemeinsame `exec`-Helfer |
  | `plugin-sdk/cli-runtime` | CLI-Laufzeithelfer | Helfer für Befehlsformatierung, Warten, Versionshelfer |
  | `plugin-sdk/gateway-runtime` | Gateway-Helfer | Gateway-Client und Helfer für Channel-Status-Patches |
  | `plugin-sdk/config-runtime` | Konfigurationshelfer | Helfer für Laden/Schreiben von Konfiguration |
  | `plugin-sdk/telegram-command-config` | Helfer für Telegram-Befehle | Fallback-stabile Telegram-Befehlsvalidierung, wenn die gebündelte Telegram-Vertragsoberfläche nicht verfügbar ist |
  | `plugin-sdk/approval-runtime` | Helfer für Approval-Prompts | Payload für `exec`-/Plugin-Approvals, Helfer für Approval-Fähigkeiten/-Profile, native Approval-Routing-/Laufzeithelfer |
  | `plugin-sdk/approval-auth-runtime` | Auth-Helfer für Approvals | Auflösung von Genehmigenden, Auth für Aktionen im selben Chat |
  | `plugin-sdk/approval-client-runtime` | Client-Helfer für Approvals | Native Helfer für Profile/Filter von `exec`-Approvals |
  | `plugin-sdk/approval-delivery-runtime` | Zustellhelfer für Approvals | Native Adapter für Approval-Fähigkeiten/-Zustellung |
  | `plugin-sdk/approval-gateway-runtime` | Gateway-Helfer für Approvals | Gemeinsamer Helfer zur Auflösung des Approval-Gateway |
  | `plugin-sdk/approval-handler-adapter-runtime` | Adapter-Helfer für Approvals | Leichtgewichtige Ladehelfer für native Approval-Adapter für Hot-Channel-Entrypoints |
  | `plugin-sdk/approval-handler-runtime` | Handler-Helfer für Approvals | Umfassendere Laufzeithelfer für Approval-Handler; bevorzugen Sie die schmaleren Adapter-/Gateway-Schnittstellen, wenn sie ausreichen |
  | `plugin-sdk/approval-native-runtime` | Zielhelfer für Approvals | Native Helfer für Ziel-/Kontobindung von Approvals |
  | `plugin-sdk/approval-reply-runtime` | Antworthelfer für Approvals | Helfer für Antwort-Payloads von `exec`-/Plugin-Approvals |
  | `plugin-sdk/channel-runtime-context` | Helfer für Kanal-Laufzeitkontext | Generische Helfer zum Registrieren/Abrufen/Beobachten von Kanal-Laufzeitkontext |
  | `plugin-sdk/security-runtime` | Sicherheitshilfen | Gemeinsame Helfer für Trust, DM-Gating, externe Inhalte und Secret-Erfassung |
  | `plugin-sdk/ssrf-policy` | SSRF-Richtlinienhelfer | Helfer für Host-Allowlist und Richtlinien für private Netzwerke |
  | `plugin-sdk/ssrf-runtime` | SSRF-Laufzeithelfer | Helfer für Pinned Dispatcher, Guarded Fetch und SSRF-Richtlinien |
  | `plugin-sdk/collection-runtime` | Helfer für begrenzte Caches | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | Helfer für Diagnostic-Gating | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | Helfer für Fehlerformatierung | `formatUncaughtError`, `isApprovalNotFoundError`, Helfer für Fehlergraphen |
  | `plugin-sdk/fetch-runtime` | Helfer für Wrapped Fetch/Proxy | `resolveFetch`, Proxy-Helfer |
  | `plugin-sdk/host-runtime` | Helfer für Host-Normalisierung | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | Retry-Helfer | `RetryConfig`, `retryAsync`, Policy-Runner |
  | `plugin-sdk/allow-from` | Formatierung von Allowlists | `formatAllowFromLowercase` |
  | `plugin-sdk/allowlist-resolution` | Mapping von Allowlist-Eingaben | `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | Helfer für Command-Gating und Command-Oberflächen | `resolveControlCommandGate`, Helfer für Sender-Autorisierung, Helfer für Command-Register |
  | `plugin-sdk/command-status` | Renderer für Befehlsstatus/-hilfe | `buildCommandsMessage`, `buildCommandsMessagePaginated`, `buildHelpMessage` |
  | `plugin-sdk/secret-input` | Parsing von Secret-Eingaben | Helfer für Secret-Eingaben |
  | `plugin-sdk/webhook-ingress` | Helfer für Webhook-Anfragen | Hilfsfunktionen für Webhook-Ziele |
  | `plugin-sdk/webhook-request-guards` | Guard-Helfer für Webhook-Bodys | Helfer für Lesen/Limitieren von Request-Bodys |
  | `plugin-sdk/reply-runtime` | Gemeinsame Antwort-Laufzeit | Inbound-Dispatch, Heartbeat, Antwort-Planer, Chunking |
  | `plugin-sdk/reply-dispatch-runtime` | Schmale Helfer für Antwort-Dispatch | Helfer für Finalisierung + Provider-Dispatch |
  | `plugin-sdk/reply-history` | Helfer für Antwortverlauf | `buildHistoryContext`, `buildPendingHistoryContextFromMap`, `recordPendingHistoryEntry`, `clearHistoryEntriesIfEnabled` |
  | `plugin-sdk/reply-reference` | Planung von Antwortreferenzen | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | Helfer für Antwort-Chunks | Helfer für Text-/Markdown-Chunking |
  | `plugin-sdk/session-store-runtime` | Helfer für Sitzungsspeicher | Helfer für Speicherpfad + `updated-at` |
  | `plugin-sdk/state-paths` | Helfer für Statuspfade | Helfer für Status- und OAuth-Verzeichnisse |
  | `plugin-sdk/routing` | Helfer für Routing/Sitzungsschlüssel | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId`, Helfer für Sitzungsschlüssel-Normalisierung |
  | `plugin-sdk/status-helpers` | Helfer für Kanalstatus | Builder für Kanal-/Kontostatuszusammenfassungen, Standardwerte für Laufzeitstatus, Helfer für Issue-Metadaten |
  | `plugin-sdk/target-resolver-runtime` | Helfer für Zielauflösung | Gemeinsame Helfer für Zielauflösung |
  | `plugin-sdk/string-normalization-runtime` | Helfer für String-Normalisierung | Helfer für Slug-/String-Normalisierung |
  | `plugin-sdk/request-url` | Helfer für Request-URLs | String-URLs aus request-ähnlichen Eingaben extrahieren |
  | `plugin-sdk/run-command` | Helfer für zeitgesteuerte Befehle | Runner für zeitgesteuerte Befehle mit normalisiertem stdout/stderr |
  | `plugin-sdk/param-readers` | Param-Reader | Gemeinsame Param-Reader für Tool/CLI |
  | `plugin-sdk/tool-payload` | Extraktion von Tool-Payloads | Normalisierte Payloads aus Tool-Ergebnisobjekten extrahieren |
  | `plugin-sdk/tool-send` | Extraktion von Tool-Sendefeldern | Kanonische Sendefelder für Ziele aus Tool-Argumenten extrahieren |
  | `plugin-sdk/temp-path` | Helfer für temporäre Pfade | Gemeinsame Helfer für Pfade temporärer Downloads |
  | `plugin-sdk/logging-core` | Logging-Helfer | Helfer für Subsystem-Logger und Redaction |
  | `plugin-sdk/markdown-table-runtime` | Helfer für Markdown-Tabellen | Helfer für Modi von Markdown-Tabellen |
  | `plugin-sdk/reply-payload` | Typen für Nachrichtenantworten | Typen für Antwort-Payloads |
  | `plugin-sdk/provider-setup` | Kuratierte Helfer für Setup lokaler/self-hosted Provider | Helfer für Discovery/Konfiguration self-hosted Provider |
  | `plugin-sdk/self-hosted-provider-setup` | Fokussierte Helfer für Setup OpenAI-kompatibler self-hosted Provider | Dieselben Helfer für Discovery/Konfiguration self-hosted Provider |
  | `plugin-sdk/provider-auth-runtime` | Laufzeit-Auth-Helfer für Provider | Laufzeithelfer zur API-Key-Auflösung |
  | `plugin-sdk/provider-auth-api-key` | Setup-Helfer für Provider-API-Keys | Helfer für API-Key-Onboarding/Schreiben von Profilen |
  | `plugin-sdk/provider-auth-result` | Helfer für Provider-Auth-Ergebnisse | Standard-Builder für OAuth-Auth-Ergebnisse |
  | `plugin-sdk/provider-auth-login` | Helfer für interaktive Provider-Anmeldung | Gemeinsame Helfer für interaktive Anmeldung |
  | `plugin-sdk/provider-env-vars` | Helfer für Provider-Umgebungsvariablen | Helfer für Nachschlag von Provider-Auth-Umgebungsvariablen |
  | `plugin-sdk/provider-model-shared` | Gemeinsame Helfer für Provider-Modelle/-Replay | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, gemeinsame Builder für Replay-Richtlinien, Helfer für Provider-Endpunkte und Helfer für Modell-ID-Normalisierung |
  | `plugin-sdk/provider-catalog-shared` | Gemeinsame Helfer für Provider-Kataloge | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
  | `plugin-sdk/provider-onboard` | Patches für Provider-Onboarding | Helfer für Onboarding-Konfiguration |
  | `plugin-sdk/provider-http` | HTTP-Helfer für Provider | Generische Helfer für Provider-HTTP/Endpunkt-Fähigkeiten, einschließlich Multipart-Formularhelfern für Audio-Transkription |
  | `plugin-sdk/provider-web-fetch` | Web-Fetch-Helfer für Provider | Helfer für Registrierung/Cache von Web-Fetch-Providern |
  | `plugin-sdk/provider-web-search-config-contract` | Konfigurationshelfer für Provider-Web-Suche | Schmale Helfer für Web-Suche-Konfiguration/Anmeldedaten für Provider, die keine Verdrahtung zur Plugin-Aktivierung benötigen |
  | `plugin-sdk/provider-web-search-contract` | Vertragshilfen für Provider-Web-Suche | Schmale Vertragshilfen für Web-Suche-Konfiguration/Anmeldedaten wie `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` und bereichsbezogene Setter/Getter für Anmeldedaten |
  | `plugin-sdk/provider-web-search` | Helfer für Provider-Web-Suche | Helfer für Registrierung/Cache/Laufzeit von Web-Suche-Providern |
  | `plugin-sdk/provider-tools` | Kompatibilitätshilfen für Provider-Tools/-Schemas | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, Gemini-Schema-Bereinigung + Diagnose sowie xAI-Kompatibilitätshilfen wie `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
  | `plugin-sdk/provider-usage` | Helfer für Provider-Nutzung | `fetchClaudeUsage`, `fetchGeminiUsage`, `fetchGithubCopilotUsage` und weitere Helfer für Provider-Nutzung |
  | `plugin-sdk/provider-stream` | Helfer für Provider-Stream-Wrapper | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, Stream-Wrapper-Typen und gemeinsame Anthropic-/Bedrock-/Google-/Kilocode-/Moonshot-/OpenAI-/OpenRouter-/Z.A.I-/MiniMax-/Copilot-Wrapper-Helfer |
  | `plugin-sdk/provider-transport-runtime` | Transporthelfer für Provider | Native Transporthelfer für Provider wie Guarded Fetch, Transformationen von Transportnachrichten und beschreibbare Ereignis-Streams für den Transport |
  | `plugin-sdk/keyed-async-queue` | Geordnete asynchrone Warteschlange | `KeyedAsyncQueue` |
  | `plugin-sdk/media-runtime` | Gemeinsame Medienhelfer | Helfer für Medienabruf/-transformation/-speicherung plus Builder für Medien-Payloads |
  | `plugin-sdk/media-generation-runtime` | Gemeinsame Helfer für Mediengenerierung | Gemeinsame Helfer für Failover, Kandidatenauswahl und Meldungen zu fehlenden Modellen für Bild-/Video-/Musikgenerierung |
  | `plugin-sdk/media-understanding` | Helfer für Medienverständnis | Typen für Medienverständnis-Provider plus providerseitige Hilfsexporte für Bilder/Audio |
  | `plugin-sdk/text-runtime` | Gemeinsame Texthelfer | Helfer zum Entfernen von für den Assistant sichtbarem Text, Helfer für Markdown-Rendering/Chunking/Tabellen, Redaction-Helfer, Helfer für Directive-Tags, Safe-Text-Utilities und verwandte Text-/Logging-Helfer |
  | `plugin-sdk/text-chunking` | Helfer für Text-Chunking | Helfer für ausgehendes Text-Chunking |
  | `plugin-sdk/speech` | Helfer für Sprache | Typen für Sprach-Provider plus providerseitige Helfer für Directives, Register und Validierung |
  | `plugin-sdk/speech-core` | Gemeinsamer Sprach-Core | Typen für Sprach-Provider, Register, Directives, Normalisierung |
  | `plugin-sdk/realtime-transcription` | Helfer für Echtzeit-Transkription | Provider-Typen, Registerhelfer und gemeinsamer Helfer für WebSocket-Sitzungen |
  | `plugin-sdk/realtime-voice` | Helfer für Echtzeitstimme | Provider-Typen und Registerhelfer |
  | `plugin-sdk/image-generation-core` | Gemeinsamer Core für Bildgenerierung | Typen für Bildgenerierung, Failover-, Auth- und Registerhelfer |
  | `plugin-sdk/music-generation` | Helfer für Musikgenerierung | Typen für Musikgenerierungs-Provider/-Requests/-Ergebnisse |
  | `plugin-sdk/music-generation-core` | Gemeinsamer Core für Musikgenerierung | Typen für Musikgenerierung, Failover-Helfer, Provider-Lookup und Parsing von Modell-Referenzen |
  | `plugin-sdk/video-generation` | Helfer für Videogenerierung | Typen für Videogenerierungs-Provider/-Requests/-Ergebnisse |
  | `plugin-sdk/video-generation-core` | Gemeinsamer Core für Videogenerierung | Typen für Videogenerierung, Failover-Helfer, Provider-Lookup und Parsing von Modell-Referenzen |
  | `plugin-sdk/interactive-runtime` | Helfer für interaktive Antworten | Normalisierung/Reduktion interaktiver Antwort-Payloads |
  | `plugin-sdk/channel-config-primitives` | Primitive für Kanalkonfiguration | Schmale Primitive für Kanalkonfigurationsschemata |
  | `plugin-sdk/channel-config-writes` | Helfer für Schreibvorgänge in Kanalkonfigurationen | Helfer für Autorisierung beim Schreiben von Kanalkonfigurationen |
  | `plugin-sdk/channel-plugin-common` | Gemeinsames Kanal-Präludium | Exporte des gemeinsamen Kanal-Plugin-Präludiums |
  | `plugin-sdk/channel-status` | Helfer für Kanalstatus | Gemeinsame Helfer für Snapshots/Zusammenfassungen des Kanalstatus |
  | `plugin-sdk/allowlist-config-edit` | Helfer für Allowlist-Konfiguration | Helfer zum Bearbeiten/Lesen von Allowlist-Konfigurationen |
  | `plugin-sdk/group-access` | Helfer für Gruppenzugriff | Gemeinsame Helfer für Entscheidungen zum Gruppenzugriff |
  | `plugin-sdk/direct-dm` | Helfer für direkte DM | Gemeinsame Helfer für Auth/Guards bei direkten DM |
  | `plugin-sdk/extension-shared` | Gemeinsame Helfer für Erweiterungen | Primitive für passive Kanäle/Status und Ambient-Proxy-Helfer |
  | `plugin-sdk/webhook-targets` | Helfer für Webhook-Ziele | Helfer für Webhook-Zielregister und Routeninstallation |
  | `plugin-sdk/webhook-path` | Helfer für Webhook-Pfade | Helfer für Normalisierung von Webhook-Pfaden |
  | `plugin-sdk/web-media` | Gemeinsame Helfer für Web-Medien | Helfer zum Laden entfernter/lokaler Medien |
  | `plugin-sdk/zod` | Zod-Re-Export | Re-exportiertes `zod` für Nutzer der Plugin-SDK |
  | `plugin-sdk/memory-core` | Gebündelte `memory-core`-Helfer | Hilfsoberfläche für Memory-Manager/Konfiguration/Datei/CLI |
  | `plugin-sdk/memory-core-engine-runtime` | Laufzeit-Fassade für Memory-Engine | Laufzeit-Fassade für Memory-Index/Suche |
  | `plugin-sdk/memory-core-host-engine-foundation` | Foundation-Engine für Memory-Host | Exporte der Foundation-Engine für Memory-Host |
  | `plugin-sdk/memory-core-host-engine-embeddings` | Embedding-Engine für Memory-Host | Embedding-Verträge für Memory, Registerzugriff, lokaler Provider und generische Batch-/Remote-Helfer; konkrete Remote-Provider leben in ihren besitzenden Plugins |
  | `plugin-sdk/memory-core-host-engine-qmd` | QMD-Engine für Memory-Host | Exporte der QMD-Engine für Memory-Host |
  | `plugin-sdk/memory-core-host-engine-storage` | Storage-Engine für Memory-Host | Exporte der Storage-Engine für Memory-Host |
  | `plugin-sdk/memory-core-host-multimodal` | Multimodale Helfer für Memory-Host | Multimodale Helfer für Memory-Host |
  | `plugin-sdk/memory-core-host-query` | Query-Helfer für Memory-Host | Query-Helfer für Memory-Host |
  | `plugin-sdk/memory-core-host-secret` | Secret-Helfer für Memory-Host | Secret-Helfer für Memory-Host |
  | `plugin-sdk/memory-core-host-events` | Helfer für Event-Journal des Memory-Host | Helfer für Event-Journal des Memory-Host |
  | `plugin-sdk/memory-core-host-status` | Statushelfer für Memory-Host | Statushelfer für Memory-Host |
  | `plugin-sdk/memory-core-host-runtime-cli` | CLI-Laufzeit für Memory-Host | CLI-Laufzeithelfer für Memory-Host |
  | `plugin-sdk/memory-core-host-runtime-core` | Core-Laufzeit für Memory-Host | Core-Laufzeithelfer für Memory-Host |
  | `plugin-sdk/memory-core-host-runtime-files` | Datei-/Laufzeithelfer für Memory-Host | Datei-/Laufzeithelfer für Memory-Host |
  | `plugin-sdk/memory-host-core` | Alias für Core-Laufzeit von Memory-Host | Anbieterneutraler Alias für Core-Laufzeithelfer von Memory-Host |
  | `plugin-sdk/memory-host-events` | Alias für Event-Journal von Memory-Host | Anbieterneutraler Alias für Helfer des Event-Journals von Memory-Host |
  | `plugin-sdk/memory-host-files` | Alias für Datei-/Laufzeit von Memory-Host | Anbieterneutraler Alias für Datei-/Laufzeithelfer von Memory-Host |
  | `plugin-sdk/memory-host-markdown` | Helfer für verwaltetes Markdown | Gemeinsame Helfer für verwaltetes Markdown für Memory-nahe Plugins |
  | `plugin-sdk/memory-host-search` | Fassade für Active Memory-Suche | Lazy Laufzeit-Fassade des Search-Manager für Active Memory |
  | `plugin-sdk/memory-host-status` | Alias für Status von Memory-Host | Anbieterneutraler Alias für Statushelfer von Memory-Host |
  | `plugin-sdk/memory-lancedb` | Gebündelte `memory-lancedb`-Helfer | Hilfsoberfläche für `memory-lancedb` |
  | `plugin-sdk/testing` | Testhilfen | Testhelfer und Mocks |
</Accordion>

Diese Tabelle ist absichtlich nur die häufige Migrations-Teilmenge, nicht die vollständige SDK-
Oberfläche. Die vollständige Liste mit mehr als 200 Entry-Points steht in
`scripts/lib/plugin-sdk-entrypoints.json`.

Diese Liste enthält weiterhin einige Hilfsschnittstellen gebündelter Plugins wie
`plugin-sdk/feishu`, `plugin-sdk/feishu-setup`, `plugin-sdk/zalo`,
`plugin-sdk/zalo-setup` und `plugin-sdk/matrix*`. Diese bleiben für
die Wartung und Kompatibilität gebündelter Plugins exportiert, sind aber absichtlich
nicht in der häufigen Migrationstabelle enthalten und nicht das empfohlene Ziel für
neuen Plugin-Code.

Dieselbe Regel gilt für andere Familien gebündelter Hilfsschnittstellen wie:

- Browser-Support-Helfer: `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support`
- Matrix: `plugin-sdk/matrix*`
- LINE: `plugin-sdk/line*`
- IRC: `plugin-sdk/irc*`
- gebündelte Helfer-/Plugin-Oberflächen wie `plugin-sdk/googlechat`,
  `plugin-sdk/zalouser`, `plugin-sdk/bluebubbles*`,
  `plugin-sdk/mattermost*`, `plugin-sdk/msteams`,
  `plugin-sdk/nextcloud-talk`, `plugin-sdk/nostr`, `plugin-sdk/tlon`,
  `plugin-sdk/twitch`,
  `plugin-sdk/github-copilot-login`, `plugin-sdk/github-copilot-token`,
  `plugin-sdk/diagnostics-otel`, `plugin-sdk/diffs`, `plugin-sdk/llm-task`,
  `plugin-sdk/thread-ownership` und `plugin-sdk/voice-call`

`plugin-sdk/github-copilot-token` stellt derzeit die schmale Token-Helfer-
Oberfläche `DEFAULT_COPILOT_API_BASE_URL`,
`deriveCopilotApiBaseUrlFromToken` und `resolveCopilotApiToken` bereit.

Verwenden Sie den schmalsten Import, der zur Aufgabe passt. Wenn Sie einen Export
nicht finden können, prüfen Sie den Quellcode unter `src/plugin-sdk/` oder fragen Sie in Discord nach.

## Zeitplan für die Entfernung

| Wann                   | Was passiert                                                            |
| ---------------------- | ----------------------------------------------------------------------- |
| **Jetzt**              | Veraltete Oberflächen geben Laufzeitwarnungen aus                       |
| **Nächstes Major-Release** | Veraltete Oberflächen werden entfernt; Plugins, die sie weiterhin verwenden, schlagen fehl |

Alle Core-Plugins wurden bereits migriert. Externe Plugins sollten vor dem nächsten
Major-Release migrieren.

## Warnungen vorübergehend unterdrücken

Setzen Sie diese Umgebungsvariablen, während Sie an der Migration arbeiten:

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

Dies ist ein vorübergehender Ausweg, keine dauerhafte Lösung.

## Verwandt

- [Getting Started](/de/plugins/building-plugins) — Ihr erstes Plugin erstellen
- [SDK Overview](/de/plugins/sdk-overview) — vollständige Referenz für Unterpfad-Importe
- [Channel Plugins](/de/plugins/sdk-channel-plugins) — Kanal-Plugins erstellen
- [Provider Plugins](/de/plugins/sdk-provider-plugins) — Provider-Plugins erstellen
- [Plugin Internals](/de/plugins/architecture) — tiefer Einblick in die Architektur
- [Plugin Manifest](/de/plugins/manifest) — Referenz des Manifest-Schemas
