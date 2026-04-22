---
read_when:
    - Du siehst die Warnung OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED
    - Du siehst die Warnung OPENCLAW_EXTENSION_API_DEPRECATED
    - Du aktualisierst ein Plugin auf die moderne Plugin-Architektur
    - Du betreust ein externes OpenClaw-Plugin
sidebarTitle: Migrate to SDK
summary: Von der alten Rückwärtskompatibilitätsschicht zum modernen Plugin SDK migrieren
title: Plugin SDK-Migration
x-i18n:
    generated_at: "2026-04-22T04:25:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: 72c9fc2d77f5feda336a1119fc42ebe088d5037f99c2b3843e9f06efed20386d
    source_path: plugins/sdk-migration.md
    workflow: 15
---

# Plugin SDK-Migration

OpenClaw ist von einer breiten Rückwärtskompatibilitätsschicht zu einer modernen Plugin-Architektur mit fokussierten, dokumentierten Imports übergegangen. Wenn dein Plugin vor der neuen Architektur erstellt wurde, hilft dir dieser Leitfaden bei der Migration.

## Was sich ändert

Das alte Plugin-System stellte zwei weit offene Oberflächen bereit, über die Plugins alles importieren konnten, was sie von einem einzigen Einstiegspunkt aus benötigten:

- **`openclaw/plugin-sdk/compat`** — ein einzelner Import, der Dutzende von Helfern re-exportierte. Er wurde eingeführt, damit ältere hook-basierte Plugins weiter funktionieren konnten, während die neue Plugin-Architektur aufgebaut wurde.
- **`openclaw/extension-api`** — eine Brücke, die Plugins direkten Zugriff auf hostseitige Helfer wie den eingebetteten Agent-Runner gab.

Beide Oberflächen sind jetzt **deprecated**. Sie funktionieren zur Laufzeit weiterhin, aber neue Plugins dürfen sie nicht verwenden, und bestehende Plugins sollten migrieren, bevor das nächste Major-Release sie entfernt.

<Warning>
  Die Rückwärtskompatibilitätsschicht wird in einem zukünftigen Major-Release entfernt.
  Plugins, die weiterhin von diesen Oberflächen importieren, werden dann nicht mehr funktionieren.
</Warning>

## Warum sich das geändert hat

Der alte Ansatz verursachte Probleme:

- **Langsamer Start** — der Import eines Helfers lud Dutzende nicht zusammenhängender Module
- **Zirkuläre Abhängigkeiten** — breite Re-Exports machten es leicht, Importzyklen zu erzeugen
- **Unklare API-Oberfläche** — es gab keine Möglichkeit zu erkennen, welche Exporte stabil und welche intern waren

Das moderne Plugin SDK behebt das: Jeder Importpfad (`openclaw/plugin-sdk/\<subpath\>`) ist ein kleines, in sich geschlossenes Modul mit klarem Zweck und dokumentiertem Vertrag.

Legacy-Provider-Komfort-Seams für gebündelte Kanäle gibt es ebenfalls nicht mehr. Imports wie `openclaw/plugin-sdk/slack`, `openclaw/plugin-sdk/discord`, `openclaw/plugin-sdk/signal`, `openclaw/plugin-sdk/whatsapp`, kanalmarkierte Helfer-Seams und `openclaw/plugin-sdk/telegram-core` waren private Monorepo-Abkürzungen, keine stabilen Plugin-Verträge. Verwende stattdessen schmale generische SDK-Unterpfade. Innerhalb des gebündelten Plugin-Workspaces sollten Provider-eigene Helfer in der eigenen `api.ts` oder `runtime-api.ts` dieses Plugins bleiben.

Aktuelle Beispiele für gebündelte Provider:

- Anthropic hält Claude-spezifische Stream-Helfer in seinem eigenen `api.ts`- / `contract-api.ts`-Seam
- OpenAI hält Provider-Builder, Helfer für Standardmodelle und Realtime-Provider-Builder in seinem eigenen `api.ts`
- OpenRouter hält Provider-Builder sowie Onboarding-/Konfigurationshelfer in seinem eigenen `api.ts`

## So migrierst du

<Steps>
  <Step title="Approval-native Handler auf Capability-Fakten migrieren">
    Kanal-Plugins mit Approval-Unterstützung stellen natives Approval-Verhalten jetzt über
    `approvalCapability.nativeRuntime` plus die gemeinsame Laufzeitkontext-Registry bereit.

    Wichtige Änderungen:

    - Ersetze `approvalCapability.handler.loadRuntime(...)` durch
      `approvalCapability.nativeRuntime`
    - Verschiebe Approval-spezifische Auth-/Zustelllogik aus der alten Verkabelung `plugin.auth` /
      `plugin.approvals` auf `approvalCapability`
    - `ChannelPlugin.approvals` wurde aus dem öffentlichen Vertrag für Kanal-Plugins
      entfernt; verschiebe Zustellungs-/Native-/Render-Felder auf `approvalCapability`
    - `plugin.auth` bleibt nur für Kanal-Login-/Logout-Flows bestehen; dortige Approval-Auth-Hooks
      werden vom Core nicht mehr gelesen
    - Registriere kanal-eigene Laufzeitobjekte wie Clients, Tokens oder Bolt-Apps über
      `openclaw/plugin-sdk/channel-runtime-context`
    - Sende aus nativen Approval-Handlern keine Plugin-eigenen Hinweise zum Umleiten;
      der Core besitzt jetzt Hinweise zu „anderswo geroutet“ auf Basis tatsächlicher Zustellungsergebnisse
    - Wenn du `channelRuntime` an `createChannelManager(...)` übergibst, stelle eine
      echte Oberfläche `createPluginRuntime().channel` bereit. Partielle Stubs werden abgelehnt.

    Siehe `/plugins/sdk-channel-plugins` für das aktuelle Layout der Approval-Capability.

  </Step>

  <Step title="Fallback-Verhalten des Windows-Wrappers prüfen">
    Wenn dein Plugin `openclaw/plugin-sdk/windows-spawn` verwendet, schlagen nicht aufgelöste Windows-
    `.cmd`-/`.bat`-Wrapper jetzt kontrolliert fehl, sofern du nicht explizit `allowShellFallback: true` übergibst.

    ```typescript
    // Vorher
    const program = applyWindowsSpawnProgramPolicy({ candidate });

    // Nachher
    const program = applyWindowsSpawnProgramPolicy({
      candidate,
      // Nur für vertrauenswürdige Kompatibilitätsaufrufer setzen, die
      // bewusst shellvermittelten Fallback akzeptieren.
      allowShellFallback: true,
    });
    ```

    Wenn dein Aufrufer nicht absichtlich auf Shell-Fallback angewiesen ist, setze
    `allowShellFallback` nicht und behandle stattdessen den ausgelösten Fehler.

  </Step>

  <Step title="Deprecated Imports finden">
    Durchsuche dein Plugin nach Imports von einer der beiden deprecated Oberflächen:

    ```bash
    grep -r "plugin-sdk/compat" my-plugin/
    grep -r "openclaw/extension-api" my-plugin/
    ```

  </Step>

  <Step title="Durch fokussierte Imports ersetzen">
    Jeder Export aus der alten Oberfläche wird auf einen bestimmten modernen Importpfad abgebildet:

    ```typescript
    // Vorher (deprecated Rückwärtskompatibilitätsschicht)
    import {
      createChannelReplyPipeline,
      createPluginRuntimeStore,
      resolveControlCommandGate,
    } from "openclaw/plugin-sdk/compat";

    // Nachher (moderne fokussierte Imports)
    import { createChannelReplyPipeline } from "openclaw/plugin-sdk/channel-reply-pipeline";
    import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
    import { resolveControlCommandGate } from "openclaw/plugin-sdk/command-auth";
    ```

    Für hostseitige Helfer verwende die injizierte Plugin-Laufzeit, statt direkt zu importieren:

    ```typescript
    // Vorher (deprecated extension-api-Brücke)
    import { runEmbeddedPiAgent } from "openclaw/extension-api";
    const result = await runEmbeddedPiAgent({ sessionId, prompt });

    // Nachher (injizierte Laufzeit)
    const result = await api.runtime.agent.runEmbeddedPiAgent({ sessionId, prompt });
    ```

    Dasselbe Muster gilt für andere Legacy-Brückenhelfer:

    | Alter Import | Modernes Äquivalent |
    | --- | --- |
    | `resolveAgentDir` | `api.runtime.agent.resolveAgentDir` |
    | `resolveAgentWorkspaceDir` | `api.runtime.agent.resolveAgentWorkspaceDir` |
    | `resolveAgentIdentity` | `api.runtime.agent.resolveAgentIdentity` |
    | `resolveThinkingDefault` | `api.runtime.agent.resolveThinkingDefault` |
    | `resolveAgentTimeoutMs` | `api.runtime.agent.resolveAgentTimeoutMs` |
    | `ensureAgentWorkspace` | `api.runtime.agent.ensureAgentWorkspace` |
    | Helfer für den Sitzungsspeicher | `api.runtime.agent.session.*` |

  </Step>

  <Step title="Build und Tests ausführen">
    ```bash
    pnpm build
    pnpm test -- my-plugin/
    ```
  </Step>
</Steps>

## Referenz für Importpfade

  <Accordion title="Tabelle häufiger Importpfade">
  | Importpfad | Zweck | Wichtige Exporte |
  | --- | --- | --- |
  | `plugin-sdk/plugin-entry` | Kanonischer Plugin-Entry-Helper | `definePluginEntry` |
  | `plugin-sdk/core` | Altes Umbrella-Re-Export für Definitionen/Builder von Kanal-Entrypoints | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | Root-Konfigurationsschema-Export | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | Single-Provider-Entry-Helper | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | Fokussierte Definitionen und Builder für Kanal-Entrypoints | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
  | `plugin-sdk/setup` | Gemeinsame Helfer für den Einrichtungsassistenten | Allowlist-Prompts, Setup-Status-Builder |
  | `plugin-sdk/setup-runtime` | Laufzeithelfer für die Einrichtung | Importsichere Setup-Patch-Adapter, Helfer für Lookup-Hinweise, `promptResolvedAllowFrom`, `splitSetupEntries`, delegierte Setup-Proxys |
  | `plugin-sdk/setup-adapter-runtime` | Helfer für Setup-Adapter | `createEnvPatchedAccountSetupAdapter` |
  | `plugin-sdk/setup-tools` | Helfer für Setup-Tooling | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | Helfer für mehrere Accounts | Helfer für Account-Liste/Konfiguration/Aktions-Gates |
  | `plugin-sdk/account-id` | Helfer für Account-IDs | `DEFAULT_ACCOUNT_ID`, Normalisierung von Account-IDs |
  | `plugin-sdk/account-resolution` | Helfer für Account-Lookups | Helfer für Account-Lookup + Standard-Fallback |
  | `plugin-sdk/account-helpers` | Schmale Account-Helfer | Helfer für Account-Liste/Account-Aktionen |
  | `plugin-sdk/channel-setup` | Adapter für den Einrichtungsassistenten | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, plus `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | Primitive für DM-Pairing | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | Verkabelung für Antwortpräfix + Tippanzeige | `createChannelReplyPipeline` |
  | `plugin-sdk/channel-config-helpers` | Factorys für Konfigurationsadapter | `createHybridChannelConfigAdapter` |
  | `plugin-sdk/channel-config-schema` | Builder für Konfigurationsschemata | Typen für Kanal-Konfigurationsschemata |
  | `plugin-sdk/telegram-command-config` | Helfer für Telegram-Befehlskonfiguration | Normalisierung von Befehlsnamen, Kürzen von Beschreibungen, Validierung von Duplikaten/Konflikten |
  | `plugin-sdk/channel-policy` | Auflösung von Gruppen-/DM-Richtlinien | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | Helfer für Account-Status und Draft-Stream-Lifecycle | `createAccountStatusSink`, Helfer zum Finalisieren von Draft-Previews |
  | `plugin-sdk/inbound-envelope` | Helfer für Inbound-Envelopes | Gemeinsame Helfer für Route- und Envelope-Builder |
  | `plugin-sdk/inbound-reply-dispatch` | Helfer für Inbound-Antworten | Gemeinsame Helfer für Aufzeichnen und Dispatch |
  | `plugin-sdk/messaging-targets` | Parsing von Messaging-Zielen | Helfer zum Parsen/Abgleichen von Zielen |
  | `plugin-sdk/outbound-media` | Helfer für Outbound-Medien | Gemeinsames Laden von Outbound-Medien |
  | `plugin-sdk/outbound-runtime` | Laufzeithelfer für Outbound | Helfer für Outbound-Identität/Sende-Delegation und Payload-Planung |
  | `plugin-sdk/thread-bindings-runtime` | Helfer für Thread-Bindings | Helfer für Thread-Binding-Lifecycle und Adapter |
  | `plugin-sdk/agent-media-payload` | Alte Helfer für Medien-Payloads | Builder für Agent-Medien-Payloads für alte Feldlayouts |
  | `plugin-sdk/channel-runtime` | Deprecated Kompatibilitäts-Shim | Nur alte Kanal-Laufzeit-Utilities |
  | `plugin-sdk/channel-send-result` | Typen für Sendeergebnisse | Typen für Antwortergebnisse |
  | `plugin-sdk/runtime-store` | Persistenter Plugin-Speicher | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | Breite Laufzeithelfer | Helfer für Runtime/Logging/Backup/Plugin-Installation |
  | `plugin-sdk/runtime-env` | Schmale Helfer für die Laufzeitumgebung | Logger/Laufzeitumgebung, Timeout-, Retry- und Backoff-Helfer |
  | `plugin-sdk/plugin-runtime` | Gemeinsame Helfer für die Plugin-Laufzeit | Helfer für Plugin-Befehle/Hooks/HTTP/Interaktivität |
  | `plugin-sdk/hook-runtime` | Helfer für Hook-Pipelines | Gemeinsame Helfer für Webhook-/interne Hook-Pipelines |
  | `plugin-sdk/lazy-runtime` | Helfer für Lazy Runtime | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | Prozesshelfer | Gemeinsame Exec-Helfer |
  | `plugin-sdk/cli-runtime` | CLI-Laufzeithelfer | Helfer für Befehlsformatierung, Warten, Versionen |
  | `plugin-sdk/gateway-runtime` | Gateway-Helfer | Gateway-Client und Helfer für Patches des Kanalstatus |
  | `plugin-sdk/config-runtime` | Konfigurationshelfer | Helfer zum Laden/Schreiben von Konfiguration |
  | `plugin-sdk/telegram-command-config` | Helfer für Telegram-Befehle | Telegram-Befehlsvalidierung mit stabilem Fallback, wenn die gebündelte Telegram-Vertragsoberfläche nicht verfügbar ist |
  | `plugin-sdk/approval-runtime` | Helfer für Approval-Prompts | Payloads für Exec-/Plugin-Approval, Helfer für Approval-Capability/Profile, Helfer für Routing/Laufzeit nativer Approvals |
  | `plugin-sdk/approval-auth-runtime` | Helfer für Approval-Auth | Auflösung von Approvern, Auth für Aktionen im selben Chat |
  | `plugin-sdk/approval-client-runtime` | Helfer für Approval-Clients | Helfer für Profile/Filter nativer Exec-Approvals |
  | `plugin-sdk/approval-delivery-runtime` | Helfer für Approval-Zustellung | Adapter für native Approval-Capability/Zustellung |
  | `plugin-sdk/approval-gateway-runtime` | Helfer für Approval-Gateway | Gemeinsamer Helfer zur Gateway-Auflösung für Approvals |
  | `plugin-sdk/approval-handler-adapter-runtime` | Helfer für Approval-Adapter | Leichtgewichtige Helfer zum Laden nativer Approval-Adapter für heiße Kanal-Entrypoints |
  | `plugin-sdk/approval-handler-runtime` | Helfer für Approval-Handler | Breitere Laufzeithelfer für Approval-Handler; bevorzuge die schmaleren Adapter-/Gateway-Seams, wenn sie ausreichen |
  | `plugin-sdk/approval-native-runtime` | Helfer für Approval-Ziele | Helfer für Bindings nativer Approval-Ziele/Accounts |
  | `plugin-sdk/approval-reply-runtime` | Helfer für Approval-Antworten | Helfer für Antwort-Payloads von Exec-/Plugin-Approvals |
  | `plugin-sdk/channel-runtime-context` | Helfer für den Kanal-Laufzeitkontext | Generische Helfer für Register/Get/Watch des Kanal-Laufzeitkontexts |
  | `plugin-sdk/security-runtime` | Sicherheitshelfer | Gemeinsame Helfer für Vertrauen, DM-Gating, externe Inhalte und Secret-Sammlung |
  | `plugin-sdk/ssrf-policy` | Helfer für SSRF-Richtlinien | Helfer für Host-Allowlist und Richtlinien für private Netzwerke |
  | `plugin-sdk/ssrf-runtime` | SSRF-Laufzeithelfer | Helfer für Pinned Dispatcher, Guarded Fetch und SSRF-Richtlinien |
  | `plugin-sdk/collection-runtime` | Helfer für begrenzte Caches | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | Helfer für Diagnose-Gating | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | Helfer für Fehlerformatierung | `formatUncaughtError`, `isApprovalNotFoundError`, Helfer für Fehlergraphen |
  | `plugin-sdk/fetch-runtime` | Helfer für Wrapped Fetch/Proxy | `resolveFetch`, Proxy-Helfer |
  | `plugin-sdk/host-runtime` | Helfer zur Host-Normalisierung | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | Retry-Helfer | `RetryConfig`, `retryAsync`, Policy-Runner |
  | `plugin-sdk/allow-from` | Allowlist-Formatierung | `formatAllowFromLowercase` |
  | `plugin-sdk/allowlist-resolution` | Zuordnung von Allowlist-Eingaben | `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | Befehls-Gating und Helfer für Befehlsoberflächen | `resolveControlCommandGate`, Helfer für Sender-Autorisierung, Helfer für Befehlsregistrierung |
  | `plugin-sdk/command-status` | Renderer für Befehlsstatus/-hilfe | `buildCommandsMessage`, `buildCommandsMessagePaginated`, `buildHelpMessage` |
  | `plugin-sdk/secret-input` | Parsing von Secret-Eingaben | Helfer für Secret-Eingaben |
  | `plugin-sdk/webhook-ingress` | Helfer für Webhook-Requests | Utilities für Webhook-Ziele |
  | `plugin-sdk/webhook-request-guards` | Helfer für Guards von Webhook-Bodys | Helfer zum Lesen/Begrenzen von Request-Bodys |
  | `plugin-sdk/reply-runtime` | Gemeinsame Antwort-Laufzeit | Inbound-Dispatch, Heartbeat, Antwortplanung, Chunking |
  | `plugin-sdk/reply-dispatch-runtime` | Schmale Helfer für Antwort-Dispatch | Helfer für Finalisierung + Provider-Dispatch |
  | `plugin-sdk/reply-history` | Helfer für Antwortverlauf | `buildHistoryContext`, `buildPendingHistoryContextFromMap`, `recordPendingHistoryEntry`, `clearHistoryEntriesIfEnabled` |
  | `plugin-sdk/reply-reference` | Planung von Antwortreferenzen | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | Helfer für Antwort-Chunking | Helfer für Text-/Markdown-Chunking |
  | `plugin-sdk/session-store-runtime` | Helfer für Sitzungsspeicher | Helfer für Speicherpfade + `updated-at` |
  | `plugin-sdk/state-paths` | Helfer für Statuspfade | Helfer für State- und OAuth-Verzeichnisse |
  | `plugin-sdk/routing` | Helfer für Routing/Sitzungsschlüssel | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId`, Helfer zur Normalisierung von Sitzungsschlüsseln |
  | `plugin-sdk/status-helpers` | Helfer für Kanalstatus | Builder für Kanal-/Account-Statuszusammenfassungen, Standards für Laufzeitzustand, Helfer für Issue-Metadaten |
  | `plugin-sdk/target-resolver-runtime` | Helfer für Zielauflösung | Gemeinsame Helfer für Target-Resolver |
  | `plugin-sdk/string-normalization-runtime` | Helfer für String-Normalisierung | Helfer für Slug-/String-Normalisierung |
  | `plugin-sdk/request-url` | Helfer für Request-URLs | String-URLs aus request-ähnlichen Eingaben extrahieren |
  | `plugin-sdk/run-command` | Helfer für zeitgesteuerte Befehle | Runner für zeitgesteuerte Befehle mit normalisiertem stdout/stderr |
  | `plugin-sdk/param-readers` | Param-Reader | Gemeinsame Param-Reader für Tool/CLI |
  | `plugin-sdk/tool-payload` | Extraktion von Tool-Payloads | Normalisierte Payloads aus Tool-Ergebnisobjekten extrahieren |
  | `plugin-sdk/tool-send` | Extraktion für Tool-Senden | Kanonische Felder für Sendeziele aus Tool-Argumenten extrahieren |
  | `plugin-sdk/temp-path` | Helfer für temporäre Pfade | Gemeinsame Helfer für Pfade temporärer Downloads |
  | `plugin-sdk/logging-core` | Logging-Helfer | Helfer für Subsystem-Logger und Redaction |
  | `plugin-sdk/markdown-table-runtime` | Helfer für Markdown-Tabellen | Helfer für Modi von Markdown-Tabellen |
  | `plugin-sdk/reply-payload` | Typen für Nachrichtenantworten | Typen für Antwort-Payloads |
  | `plugin-sdk/provider-setup` | Kuratierte Helfer für die Einrichtung lokaler/self-hosted Provider | Helfer für Discovery/Konfiguration self-hosted Provider |
  | `plugin-sdk/self-hosted-provider-setup` | Fokussierte Helfer für die Einrichtung OpenAI-kompatibler self-hosted Provider | Dieselben Helfer für Discovery/Konfiguration self-hosted Provider |
  | `plugin-sdk/provider-auth-runtime` | Helfer für Runtime-Auth von Providern | Helfer zur Auflösung von Runtime-API-Keys |
  | `plugin-sdk/provider-auth-api-key` | Helfer für die Einrichtung von Provider-API-Keys | Helfer für API-Key-Onboarding/Profile-Schreiben |
  | `plugin-sdk/provider-auth-result` | Helfer für Auth-Ergebnisse von Providern | Standard-Builder für OAuth-Auth-Ergebnisse |
  | `plugin-sdk/provider-auth-login` | Helfer für interaktive Provider-Logins | Gemeinsame Helfer für interaktive Logins |
  | `plugin-sdk/provider-env-vars` | Helfer für Provider-Umgebungsvariablen | Helfer zum Lookup von Umgebungsvariablen für Provider-Auth |
  | `plugin-sdk/provider-model-shared` | Gemeinsame Helfer für Provider-Modelle/Wiederholung | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, gemeinsame Builder für Replay-Policies, Helfer für Provider-Endpunkte und Helfer zur Normalisierung von Modell-IDs |
  | `plugin-sdk/provider-catalog-shared` | Gemeinsame Helfer für Provider-Kataloge | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
| `plugin-sdk/provider-onboard` | Patches für Provider-Onboarding | Helfer für Onboarding-Konfiguration |
| `plugin-sdk/provider-http` | Helfer für Provider-HTTP | Generische Helfer für Provider-HTTP/Endpunkt-Fähigkeiten |
| `plugin-sdk/provider-web-fetch` | Helfer für Web-Fetch von Providern | Helfer für Registrierung/Cache von Web-Fetch-Providern |
| `plugin-sdk/provider-web-search-config-contract` | Helfer für Provider-Web-Search-Konfiguration | Schmale Helfer für Web-Search-Konfiguration/Anmeldedaten für Provider, die keine Verkabelung zum Aktivieren von Plugins benötigen |
| `plugin-sdk/provider-web-search-contract` | Helfer für den Vertrag von Provider-Web-Search | Schmale Helfer für den Vertrag von Web-Search-Konfiguration/Anmeldedaten wie `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` und bereichsbezogene Setter/Getter für Anmeldedaten |
| `plugin-sdk/provider-web-search` | Helfer für Provider-Web-Search | Helfer für Registrierung/Cache/Laufzeit von Web-Search-Providern |
| `plugin-sdk/provider-tools` | Helfer für Provider-Tool-/Schema-Kompatibilität | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, Gemini-Schema-Bereinigung + Diagnostik und xAI-Kompatibilitätshelfer wie `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
| `plugin-sdk/provider-usage` | Helfer für Provider-Nutzung | `fetchClaudeUsage`, `fetchGeminiUsage`, `fetchGithubCopilotUsage` und andere Helfer zur Provider-Nutzung |
| `plugin-sdk/provider-stream` | Helfer für Provider-Stream-Wrapper | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, Typen für Stream-Wrapper und gemeinsame Wrapper-Helfer für Anthropic/Bedrock/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
| `plugin-sdk/provider-transport-runtime` | Helfer für Provider-Transport | Native Helfer für Provider-Transport wie Guarded Fetch, Transformationen von Transportnachrichten und beschreibbare Event-Streams für Transporte |
| `plugin-sdk/keyed-async-queue` | Geordnete asynchrone Warteschlange | `KeyedAsyncQueue` |
| `plugin-sdk/media-runtime` | Gemeinsame Medienhelfer | Helfer für Abruf/Transformation/Speicherung von Medien plus Builder für Medien-Payloads |
| `plugin-sdk/media-generation-runtime` | Gemeinsame Helfer für Mediengenerierung | Gemeinsame Helfer für Failover, Kandidatenauswahl und Meldungen bei fehlenden Modellen für Bild-/Video-/Musikgenerierung |
| `plugin-sdk/media-understanding` | Helfer für Medienverständnis | Provider-Typen für Medienverständnis plus providerseitige Exporte von Bild-/Audio-Helfern |
| `plugin-sdk/text-runtime` | Gemeinsame Texthelfer | Entfernen von für Assistenten sichtbarem Text, Helfer für Markdown-Rendering/Chunking/Tabellen, Helfer für Redaction, Helfer für Directive-Tags, Safe-Text-Utilities und zugehörige Text-/Logging-Helfer |
| `plugin-sdk/text-chunking` | Helfer für Text-Chunking | Helfer für Outbound-Text-Chunking |
| `plugin-sdk/speech` | Helfer für Sprache | Typen für Speech-Provider plus providerseitige Helfer für Directives, Registry und Validierung |
| `plugin-sdk/speech-core` | Gemeinsamer Speech-Core | Typen für Speech-Provider, Registry, Directives, Normalisierung |
| `plugin-sdk/realtime-transcription` | Helfer für Realtime-Transkription | Provider-Typen und Registry-Helfer |
| `plugin-sdk/realtime-voice` | Helfer für Realtime-Voice | Provider-Typen und Registry-Helfer |
| `plugin-sdk/image-generation-core` | Gemeinsamer Core für Bildgenerierung | Helfer für Typen, Failover, Auth und Registry bei Bildgenerierung |
| `plugin-sdk/music-generation` | Helfer für Musikgenerierung | Typen für Provider/Requests/Ergebnisse der Musikgenerierung |
| `plugin-sdk/music-generation-core` | Gemeinsamer Core für Musikgenerierung | Typen für Musikgenerierung, Helfer für Failover, Provider-Lookup und Parsen von Modell-Refs |
| `plugin-sdk/video-generation` | Helfer für Videogenerierung | Typen für Provider/Requests/Ergebnisse der Videogenerierung |
| `plugin-sdk/video-generation-core` | Gemeinsamer Core für Videogenerierung | Typen für Videogenerierung, Helfer für Failover, Provider-Lookup und Parsen von Modell-Refs |
| `plugin-sdk/interactive-runtime` | Helfer für interaktive Antworten | Normalisierung/Reduktion interaktiver Antwort-Payloads |
| `plugin-sdk/channel-config-primitives` | Primitive für Kanalkonfiguration | Schmale Primitive für Kanal-Konfigurationsschemata |
| `plugin-sdk/channel-config-writes` | Helfer für Schreibvorgänge in der Kanalkonfiguration | Helfer für die Autorisierung von Schreibvorgängen in der Kanalkonfiguration |
| `plugin-sdk/channel-plugin-common` | Gemeinsames Kanal-Prelude | Exporte des gemeinsamen Kanal-Preludes |
| `plugin-sdk/channel-status` | Helfer für Kanalstatus | Gemeinsame Helfer für Snapshots/Zusammenfassungen des Kanalstatus |
| `plugin-sdk/allowlist-config-edit` | Helfer für Allowlist-Konfiguration | Helfer zum Bearbeiten/Lesen von Allowlist-Konfiguration |
| `plugin-sdk/group-access` | Helfer für Gruppenzugriff | Gemeinsame Helfer für Entscheidungen zum Gruppenzugriff |
| `plugin-sdk/direct-dm` | Helfer für direkte DMs | Gemeinsame Helfer für Auth/Guards bei direkten DMs |
| `plugin-sdk/extension-shared` | Gemeinsame Extension-Helfer | Primitive für passive Kanäle/Status und ambienten Proxy |
| `plugin-sdk/webhook-targets` | Helfer für Webhook-Ziele | Helfer für Registry und Routeninstallation von Webhook-Zielen |
| `plugin-sdk/webhook-path` | Helfer für Webhook-Pfade | Helfer zur Normalisierung von Webhook-Pfaden |
| `plugin-sdk/web-media` | Gemeinsame Helfer für Web-Medien | Helfer zum Laden von Remote-/lokalen Medien |
| `plugin-sdk/zod` | Zod-Re-Export | Re-exportiertes `zod` für Plugin-SDK-Konsumenten |
| `plugin-sdk/memory-core` | Gebündelte Helfer für Memory-Core | Helferoberfläche für Memory-Manager/Konfiguration/Dateien/CLI |
| `plugin-sdk/memory-core-engine-runtime` | Laufzeit-Fassade für Memory-Engine | Laufzeit-Fassade für Memory-Index/Suche |
| `plugin-sdk/memory-core-host-engine-foundation` | Host-Foundation-Engine für Memory | Exporte der Host-Foundation-Engine für Memory |
| `plugin-sdk/memory-core-host-engine-embeddings` | Host-Embedding-Engine für Memory | Verträge für Memory-Embeddings, Registry-Zugriff, lokaler Provider und generische Batch-/Remote-Helfer; konkrete Remote-Provider leben in ihren besitzenden Plugins |
| `plugin-sdk/memory-core-host-engine-qmd` | Host-QMD-Engine für Memory | Exporte der Host-QMD-Engine für Memory |
| `plugin-sdk/memory-core-host-engine-storage` | Host-Storage-Engine für Memory | Exporte der Host-Storage-Engine für Memory |
| `plugin-sdk/memory-core-host-multimodal` | Host-Helfer für multimodales Memory | Host-Helfer für multimodales Memory |
| `plugin-sdk/memory-core-host-query` | Host-Helfer für Memory-Abfragen | Host-Helfer für Memory-Abfragen |
| `plugin-sdk/memory-core-host-secret` | Host-Helfer für Memory-Secrets | Host-Helfer für Memory-Secrets |
| `plugin-sdk/memory-core-host-events` | Helfer für das Host-Ereignisjournal von Memory | Helfer für das Host-Ereignisjournal von Memory |
| `plugin-sdk/memory-core-host-status` | Host-Helfer für Memory-Status | Host-Helfer für Memory-Status |
| `plugin-sdk/memory-core-host-runtime-cli` | Host-CLI-Laufzeit für Memory | Host-CLI-Laufzeithelfer für Memory |
| `plugin-sdk/memory-core-host-runtime-core` | Host-Core-Laufzeit für Memory | Host-Core-Laufzeithelfer für Memory |
| `plugin-sdk/memory-core-host-runtime-files` | Host-Datei-/Laufzeithelfer für Memory | Host-Datei-/Laufzeithelfer für Memory |
| `plugin-sdk/memory-host-core` | Alias für die Host-Core-Laufzeit von Memory | Anbieterneutraler Alias für Host-Core-Laufzeithelfer von Memory |
| `plugin-sdk/memory-host-events` | Alias für das Host-Ereignisjournal von Memory | Anbieterneutraler Alias für Helfer des Host-Ereignisjournals von Memory |
| `plugin-sdk/memory-host-files` | Alias für Host-Datei-/Laufzeit von Memory | Anbieterneutraler Alias für Host-Datei-/Laufzeithelfer von Memory |
| `plugin-sdk/memory-host-markdown` | Helfer für verwaltetes Markdown | Gemeinsame Helfer für verwaltetes Markdown für Plugins im Umfeld von Memory |
| `plugin-sdk/memory-host-search` | Such-Fassade für Active Memory | Lazy Laufzeit-Fassade des Search-Managers für Active Memory |
| `plugin-sdk/memory-host-status` | Alias für Host-Status von Memory | Anbieterneutraler Alias für Host-Status-Helfer von Memory |
| `plugin-sdk/memory-lancedb` | Gebündelte Helfer für Memory-LanceDB | Helferoberfläche für Memory-LanceDB |
| `plugin-sdk/testing` | Test-Utilities | Testhelfer und Mocks |
</Accordion>

Diese Tabelle ist absichtlich das häufige Migrations-Subset, nicht die vollständige SDK-Oberfläche. Die vollständige Liste mit über 200 Einstiegspunkten befindet sich in
`scripts/lib/plugin-sdk-entrypoints.json`.

Diese Liste enthält weiterhin einige Hilfs-Seams für gebündelte Plugins wie
`plugin-sdk/feishu`, `plugin-sdk/feishu-setup`, `plugin-sdk/zalo`,
`plugin-sdk/zalo-setup` und `plugin-sdk/matrix*`. Diese bleiben für die
Wartung gebündelter Plugins und aus Kompatibilitätsgründen exportiert, werden
aber absichtlich aus der häufigen Migrationstabelle ausgelassen und sind nicht
das empfohlene Ziel für neuen Plugin-Code.

Dieselbe Regel gilt für andere Familien gebündelter Hilfen wie:

- Browser-Support-Helfer: `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support`
- Matrix: `plugin-sdk/matrix*`
- LINE: `plugin-sdk/line*`
- IRC: `plugin-sdk/irc*`
- gebündelte Hilfs-/Plugin-Oberflächen wie `plugin-sdk/googlechat`,
  `plugin-sdk/zalouser`, `plugin-sdk/bluebubbles*`,
  `plugin-sdk/mattermost*`, `plugin-sdk/msteams`,
  `plugin-sdk/nextcloud-talk`, `plugin-sdk/nostr`, `plugin-sdk/tlon`,
  `plugin-sdk/twitch`,
  `plugin-sdk/github-copilot-login`, `plugin-sdk/github-copilot-token`,
  `plugin-sdk/diagnostics-otel`, `plugin-sdk/diffs`, `plugin-sdk/llm-task`,
  `plugin-sdk/thread-ownership` und `plugin-sdk/voice-call`

`plugin-sdk/github-copilot-token` stellt derzeit die schmale Token-Helfer-Oberfläche
`DEFAULT_COPILOT_API_BASE_URL`,
`deriveCopilotApiBaseUrlFromToken` und `resolveCopilotApiToken` bereit.

Verwende den schmalsten Import, der zur Aufgabe passt. Wenn du einen Export
nicht finden kannst, prüfe den Quellcode unter `src/plugin-sdk/` oder frage in Discord.

## Zeitplan für die Entfernung

| Wann                   | Was passiert                                                           |
| ---------------------- | ---------------------------------------------------------------------- |
| **Jetzt**              | Deprecated Oberflächen geben Laufzeitwarnungen aus                     |
| **Nächstes Major-Release** | Deprecated Oberflächen werden entfernt; Plugins, die sie weiterhin verwenden, schlagen fehl |

Alle Core-Plugins wurden bereits migriert. Externe Plugins sollten vor dem
nächsten Major-Release migrieren.

## Die Warnungen vorübergehend unterdrücken

Setze diese Umgebungsvariablen, während du an der Migration arbeitest:

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

Dies ist ein temporärer Notausgang, keine dauerhafte Lösung.

## Verwandt

- [Erste Schritte](/de/plugins/building-plugins) — dein erstes Plugin erstellen
- [SDK Overview](/de/plugins/sdk-overview) — vollständige Referenz für Subpath-Imports
- [Kanal-Plugins](/de/plugins/sdk-channel-plugins) — Kanal-Plugins erstellen
- [Provider-Plugins](/de/plugins/sdk-provider-plugins) — Provider-Plugins erstellen
- [Plugin Internals](/de/plugins/architecture) — Architektur im Detail
- [Plugin Manifest](/de/plugins/manifest) — Referenz für das Manifest-Schema
