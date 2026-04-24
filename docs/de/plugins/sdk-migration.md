---
read_when:
    - Du siehst die Warnung `OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED`
    - Du siehst die Warnung `OPENCLAW_EXTENSION_API_DEPRECATED`
    - Du aktualisierst ein Plugin auf die moderne Plugin-Architektur
    - Du pflegst ein externes OpenClaw-Plugin
sidebarTitle: Migrate to SDK
summary: Von der alten Abwärtskompatibilitätsschicht auf das moderne Plugin-SDK migrieren
title: Plugin-SDK-Migration
x-i18n:
    generated_at: "2026-04-24T08:59:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: d1461ae8a7de0a802c9deb59f843e7d93d9d73bea22c27d837ca2db8ae9d14b7
    source_path: plugins/sdk-migration.md
    workflow: 15
---

OpenClaw hat sich von einer breiten Abwärtskompatibilitätsschicht zu einer modernen Plugin-
Architektur mit fokussierten, dokumentierten Imports weiterentwickelt. Wenn dein Plugin vor
der neuen Architektur erstellt wurde, hilft dir diese Anleitung bei der Migration.

## Was sich ändert

Das alte Plugin-System stellte zwei sehr offene Flächen bereit, über die Plugins
alles importieren konnten, was sie über einen einzigen Einstiegspunkt benötigten:

- **`openclaw/plugin-sdk/compat`** — ein einzelner Import, der Dutzende von
  Helfern re-exportierte. Er wurde eingeführt, damit ältere Hook-basierte Plugins weiter funktionieren,
  während die neue Plugin-Architektur aufgebaut wurde.
- **`openclaw/extension-api`** — eine Brücke, die Plugins direkten Zugriff auf
  Host-seitige Helfer wie den eingebetteten Agent-Runner gab.

Beide Flächen sind jetzt **deprecated**. Sie funktionieren zur Laufzeit weiterhin, aber neue
Plugins dürfen sie nicht verwenden, und bestehende Plugins sollten migrieren, bevor die nächste
Major-Release sie entfernt.

OpenClaw entfernt oder interpretiert dokumentiertes Plugin-Verhalten nicht in derselben
Änderung neu, in der ein Ersatz eingeführt wird. Breaking-Contract-Änderungen müssen zuerst
über einen Kompatibilitätsadapter, Diagnostik, Dokumentation und ein Deprecation-Zeitfenster laufen.
Das gilt für SDK-Imports, Manifest-Felder, Setup-APIs, Hooks und das Laufzeitverhalten bei der Registrierung.

<Warning>
  Die Abwärtskompatibilitätsschicht wird in einer zukünftigen Major-Release entfernt.
  Plugins, die weiterhin von diesen Flächen importieren, werden dann nicht mehr funktionieren.
</Warning>

## Warum sich das geändert hat

Der alte Ansatz verursachte Probleme:

- **Langsamer Start** — beim Import eines Helfers wurden Dutzende nicht zusammenhängende Module geladen
- **Zirkuläre Abhängigkeiten** — breite Re-Exports machten es leicht, Import-Zyklen zu erzeugen
- **Unklare API-Fläche** — es gab keine Möglichkeit zu erkennen, welche Exporte stabil bzw. intern waren

Das moderne Plugin-SDK behebt das: Jeder Importpfad (`openclaw/plugin-sdk/\<subpath\>`)
ist ein kleines, in sich abgeschlossenes Modul mit klarem Zweck und dokumentiertem Vertrag.

Legacy-Provider-Comfort-Seams für gebündelte Kanäle sind ebenfalls entfernt. Imports
wie `openclaw/plugin-sdk/slack`, `openclaw/plugin-sdk/discord`,
`openclaw/plugin-sdk/signal`, `openclaw/plugin-sdk/whatsapp`,
kanalgebrandete Helper-Seams und
`openclaw/plugin-sdk/telegram-core` waren private Mono-Repo-Shortcuts, keine
stabilen Plugin-Verträge. Verwende stattdessen schmale generische SDK-Subpaths. Innerhalb des
gebündelten Plugin-Workspace belasse Provider-eigene Helfer in der eigenen
`api.ts` oder `runtime-api.ts` dieses Plugins.

Aktuelle Beispiele für gebündelte Provider:

- Anthropic belässt Claude-spezifische Stream-Helfer in seinem eigenen `api.ts` /
  `contract-api.ts`-Seam
- OpenAI belässt Provider-Builder, Default-Model-Helfer und Realtime-Provider-
  Builder in seinem eigenen `api.ts`
- OpenRouter belässt Provider-Builder sowie Onboarding-/Konfigurationshelfer in seinem eigenen
  `api.ts`

## Kompatibilitätsrichtlinie

Für externe Plugins folgt Kompatibilitätsarbeit dieser Reihenfolge:

1. den neuen Vertrag hinzufügen
2. das alte Verhalten über einen Kompatibilitätsadapter weiterverdrahten
3. eine Diagnose oder Warnung ausgeben, die den alten Pfad und den Ersatz benennt
4. beide Pfade in Tests abdecken
5. die Deprecation und den Migrationspfad dokumentieren
6. erst nach dem angekündigten Migrationszeitfenster entfernen, normalerweise in einer Major-Release

Wenn ein Manifest-Feld weiterhin akzeptiert wird, können Plugin-Autoren es weiter verwenden, bis
die Dokumentation und Diagnostik etwas anderes sagen. Neuer Code sollte den dokumentierten
Ersatz bevorzugen, aber bestehende Plugins sollten in gewöhnlichen Minor-Releases nicht kaputtgehen.

## So migrierst du

<Steps>
  <Step title="Approval-native-Handler auf Capability-Fakten migrieren">
    Approval-fähige Kanal-Plugins stellen natives Approval-Verhalten jetzt über
    `approvalCapability.nativeRuntime` plus die gemeinsame Runtime-Context-Registry bereit.

    Wichtige Änderungen:

    - Ersetze `approvalCapability.handler.loadRuntime(...)` durch
      `approvalCapability.nativeRuntime`
    - Verschiebe Approval-spezifische Authentifizierung/Zustellung aus der Legacy-
      Verdrahtung `plugin.auth` / `plugin.approvals` nach `approvalCapability`
    - `ChannelPlugin.approvals` wurde aus dem öffentlichen Channel-Plugin-
      Vertrag entfernt; verschiebe Zustellungs-/Native-/Render-Felder nach `approvalCapability`
    - `plugin.auth` bleibt nur für Login-/Logout-Flows des Kanals bestehen; Approval-
      Auth-Hooks dort werden vom Core nicht mehr gelesen
    - Registriere kanal-eigene Runtime-Objekte wie Clients, Tokens oder Bolt-
      Apps über `openclaw/plugin-sdk/channel-runtime-context`
    - Sende keine Plugin-eigenen Reroute-Hinweise aus nativen Approval-Handlern;
      der Core besitzt jetzt Routed-Elsewhere-Hinweise auf Basis tatsächlicher Zustellungsergebnisse
    - Wenn du `channelRuntime` an `createChannelManager(...)` übergibst, stelle eine
      echte `createPluginRuntime().channel`-Fläche bereit. Partielle Stubs werden abgelehnt.

    Siehe `/plugins/sdk-channel-plugins` für das aktuelle Layout der Approval-Capability.

  </Step>

  <Step title="Fallback-Verhalten des Windows-Wrapper prüfen">
    Wenn dein Plugin `openclaw/plugin-sdk/windows-spawn` verwendet,
    schlagen nicht aufgelöste Windows-Wrapper `.cmd`/`.bat` jetzt fail-closed fehl, sofern du nicht
    ausdrücklich `allowShellFallback: true` übergibst.

    ```typescript
    // Vorher
    const program = applyWindowsSpawnProgramPolicy({ candidate });

    // Nachher
    const program = applyWindowsSpawnProgramPolicy({
      candidate,
      // Setze dies nur für vertrauenswürdige Kompatibilitäts-Caller, die
      // bewusst einen shell-vermittelten Fallback akzeptieren.
      allowShellFallback: true,
    });
    ```

    Wenn dein Caller nicht absichtlich auf Shell-Fallback angewiesen ist, setze
    `allowShellFallback` nicht und behandle stattdessen den ausgelösten Fehler.

  </Step>

  <Step title="Deprecated Imports finden">
    Durchsuche dein Plugin nach Imports aus einer der beiden deprecated Flächen:

    ```bash
    grep -r "plugin-sdk/compat" my-plugin/
    grep -r "openclaw/extension-api" my-plugin/
    ```

  </Step>

  <Step title="Durch fokussierte Imports ersetzen">
    Jeder Export aus der alten Fläche wird einem spezifischen modernen Importpfad zugeordnet:

    ```typescript
    // Vorher (deprecated Abwärtskompatibilitätsschicht)
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

    Verwende für Host-seitige Helfer die injizierte Plugin-Runtime, statt direkt zu importieren:

    ```typescript
    // Vorher (deprecated extension-api bridge)
    import { runEmbeddedPiAgent } from "openclaw/extension-api";
    const result = await runEmbeddedPiAgent({ sessionId, prompt });

    // Nachher (injizierte Runtime)
    const result = await api.runtime.agent.runEmbeddedPiAgent({ sessionId, prompt });
    ```

    Dasselbe Muster gilt für andere Legacy-Bridge-Helfer:

    | Alter Import | Modernes Äquivalent |
    | --- | --- |
    | `resolveAgentDir` | `api.runtime.agent.resolveAgentDir` |
    | `resolveAgentWorkspaceDir` | `api.runtime.agent.resolveAgentWorkspaceDir` |
    | `resolveAgentIdentity` | `api.runtime.agent.resolveAgentIdentity` |
    | `resolveThinkingDefault` | `api.runtime.agent.resolveThinkingDefault` |
    | `resolveAgentTimeoutMs` | `api.runtime.agent.resolveAgentTimeoutMs` |
    | `ensureAgentWorkspace` | `api.runtime.agent.ensureAgentWorkspace` |
    | Session-Store-Helfer | `api.runtime.agent.session.*` |

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
  | `plugin-sdk/plugin-entry` | Kanonischer Hilfsbaustein für Plugin-Einstiegspunkte | `definePluginEntry` |
  | `plugin-sdk/core` | Legacy-Umbrella-Re-Export für Kanal-Einstiegsdefinitionen/-Builder | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | Export des Root-Konfigurationsschemas | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | Hilfsbaustein für Ein-Provider-Einstiegspunkte | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | Fokussierte Kanal-Einstiegsdefinitionen und -Builder | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
  | `plugin-sdk/setup` | Gemeinsame Hilfsbausteine für Setup-Assistenten | Allowlist-Abfragen, Setup-Status-Builder |
  | `plugin-sdk/setup-runtime` | Runtime-Hilfsbausteine für das Setup | import-sichere Setup-Patch-Adapter, Lookup-Note-Hilfsbausteine, `promptResolvedAllowFrom`, `splitSetupEntries`, delegierte Setup-Proxys |
  | `plugin-sdk/setup-adapter-runtime` | Hilfsbausteine für Setup-Adapter | `createEnvPatchedAccountSetupAdapter` |
  | `plugin-sdk/setup-tools` | Hilfsbausteine für Setup-Tools | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | Hilfsbausteine für mehrere Accounts | Hilfsbausteine für Account-Liste/Konfiguration/Action-Gate |
  | `plugin-sdk/account-id` | Hilfsbausteine für Account-IDs | `DEFAULT_ACCOUNT_ID`, Normalisierung von Account-IDs |
  | `plugin-sdk/account-resolution` | Hilfsbausteine für Account-Lookup | Hilfsbausteine für Account-Lookup + Default-Fallback |
  | `plugin-sdk/account-helpers` | Schmale Account-Hilfsbausteine | Hilfsbausteine für Account-Liste/Account-Aktionen |
  | `plugin-sdk/channel-setup` | Adapter für Setup-Assistenten | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, plus `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | Primitive für DM-Pairing | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | Verdrahtung von Antwortpräfix + Tippstatus | `createChannelReplyPipeline` |
  | `plugin-sdk/channel-config-helpers` | Fabriken für Konfigurationsadapter | `createHybridChannelConfigAdapter` |
  | `plugin-sdk/channel-config-schema` | Builder für Konfigurationsschemata | Typen für Kanal-Konfigurationsschema |
  | `plugin-sdk/telegram-command-config` | Hilfsbausteine für Telegram-Befehlskonfiguration | Normalisierung von Befehlsnamen, Kürzen von Beschreibungen, Prüfung auf Duplikate/Konflikte |
  | `plugin-sdk/channel-policy` | Auflösung von Gruppen-/DM-Richtlinien | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | Hilfsbausteine für Account-Status und Draft-Stream-Lifecycle | `createAccountStatusSink`, Hilfsbausteine für die Finalisierung von Draft-Previews |
  | `plugin-sdk/inbound-envelope` | Hilfsbausteine für Inbound-Envelopes | Gemeinsame Hilfsbausteine für Route + Envelope-Builder |
  | `plugin-sdk/inbound-reply-dispatch` | Hilfsbausteine für Inbound-Antworten | Gemeinsame Hilfsbausteine für Record-and-Dispatch |
  | `plugin-sdk/messaging-targets` | Parsing von Messaging-Zielen | Hilfsbausteine für Parsing/Abgleich von Zielen |
  | `plugin-sdk/outbound-media` | Hilfsbausteine für Outbound-Medien | Gemeinsames Laden von Outbound-Medien |
  | `plugin-sdk/outbound-runtime` | Runtime-Hilfsbausteine für Outbound | Hilfsbausteine für Outbound-Identität/Send-Delegate und Payload-Planung |
  | `plugin-sdk/thread-bindings-runtime` | Hilfsbausteine für Thread-Bindings | Hilfsbausteine für Lifecycle und Adapter von Thread-Bindings |
  | `plugin-sdk/agent-media-payload` | Legacy-Hilfsbausteine für Media-Payloads | Builder für Agent-Media-Payload bei Legacy-Feldlayouts |
  | `plugin-sdk/channel-runtime` | Deprecated Kompatibilitäts-Shim | Nur Legacy-Hilfsbausteine für Kanal-Runtime |
  | `plugin-sdk/channel-send-result` | Typen für Sendeergebnisse | Typen für Antwortergebnisse |
  | `plugin-sdk/runtime-store` | Persistenter Plugin-Speicher | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | Breite Runtime-Hilfsbausteine | Hilfsbausteine für Runtime/Logging/Backup/Plugin-Installation |
  | `plugin-sdk/runtime-env` | Schmale Hilfsbausteine für Runtime-Umgebung | Logger-/Runtime-Umgebung, Timeout-, Retry- und Backoff-Hilfsbausteine |
  | `plugin-sdk/plugin-runtime` | Gemeinsame Hilfsbausteine für Plugin-Runtime | Hilfsbausteine für Plugin-Befehle/Hooks/HTTP/interaktive Funktionen |
  | `plugin-sdk/hook-runtime` | Hilfsbausteine für Hook-Pipelines | Gemeinsame Hilfsbausteine für Webhook-/interne Hook-Pipelines |
  | `plugin-sdk/lazy-runtime` | Hilfsbausteine für Lazy Runtime | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | Hilfsbausteine für Prozesse | Gemeinsame Hilfsbausteine für exec |
  | `plugin-sdk/cli-runtime` | Hilfsbausteine für CLI-Runtime | Hilfsbausteine für Befehlsformatierung, Waits, Versionshelfer |
  | `plugin-sdk/gateway-runtime` | Hilfsbausteine für Gateway | Hilfsbausteine für Gateway-Client und Channel-Status-Patches |
  | `plugin-sdk/config-runtime` | Hilfsbausteine für Konfiguration | Hilfsbausteine zum Laden/Schreiben von Konfiguration |
  | `plugin-sdk/telegram-command-config` | Hilfsbausteine für Telegram-Befehle | Fallback-stabile Prüfung von Telegram-Befehlen, wenn die gebündelte Telegram-Vertragsfläche nicht verfügbar ist |
  | `plugin-sdk/approval-runtime` | Hilfsbausteine für Approval-Prompts | Payload für exec-/Plugin-Approval, Hilfsbausteine für Approval-Capability/-Profil, native Approval-Routing-/Runtime-Hilfsbausteine |
  | `plugin-sdk/approval-auth-runtime` | Hilfsbausteine für Approval-Authentifizierung | Auflösung von Approvern, Same-Chat-Action-Auth |
  | `plugin-sdk/approval-client-runtime` | Hilfsbausteine für Approval-Clients | Hilfsbausteine für native exec-Approval-Profile/-Filter |
  | `plugin-sdk/approval-delivery-runtime` | Hilfsbausteine für Approval-Zustellung | Adapter für native Approval-Capability/-Zustellung |
  | `plugin-sdk/approval-gateway-runtime` | Hilfsbausteine für Approval-Gateway | Gemeinsamer Hilfsbaustein zur Auflösung von Approval-Gateway |
  | `plugin-sdk/approval-handler-adapter-runtime` | Hilfsbausteine für Approval-Adapter | Leichtgewichtige Hilfsbausteine zum Laden nativer Approval-Adapter für heiße Kanal-Einstiegspunkte |
  | `plugin-sdk/approval-handler-runtime` | Hilfsbausteine für Approval-Handler | Umfassendere Runtime-Hilfsbausteine für Approval-Handler; bevorzuge die schmaleren Adapter-/Gateway-Seams, wenn sie ausreichen |
  | `plugin-sdk/approval-native-runtime` | Hilfsbausteine für Approval-Ziele | Hilfsbausteine für native Approval-Ziel-/Account-Bindings |
  | `plugin-sdk/approval-reply-runtime` | Hilfsbausteine für Approval-Antworten | Hilfsbausteine für Antwort-Payloads bei exec-/Plugin-Approval |
  | `plugin-sdk/channel-runtime-context` | Hilfsbausteine für Kanal-Runtime-Context | Generische Hilfsbausteine zum Registrieren/Abrufen/Beobachten von Kanal-Runtime-Context |
  | `plugin-sdk/security-runtime` | Hilfsbausteine für Sicherheit | Gemeinsame Hilfsbausteine für Trust, DM-Gating, externe Inhalte und Secret-Erfassung |
  | `plugin-sdk/ssrf-policy` | Hilfsbausteine für SSRF-Richtlinien | Hilfsbausteine für Host-Allowlist und Richtlinien für private Netzwerke |
  | `plugin-sdk/ssrf-runtime` | Runtime-Hilfsbausteine für SSRF | Hilfsbausteine für Pinned-Dispatcher, geschütztes Fetch, SSRF-Richtlinien |
  | `plugin-sdk/collection-runtime` | Hilfsbausteine für begrenzte Caches | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | Hilfsbausteine für Diagnostic-Gating | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | Hilfsbausteine für Fehlerformatierung | `formatUncaughtError`, `isApprovalNotFoundError`, Hilfsbausteine für Fehlergraphen |
  | `plugin-sdk/fetch-runtime` | Hilfsbausteine für Wrapped Fetch/Proxy | `resolveFetch`, Proxy-Hilfsbausteine |
  | `plugin-sdk/host-runtime` | Hilfsbausteine für Host-Normalisierung | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | Hilfsbausteine für Retry | `RetryConfig`, `retryAsync`, Policy-Runner |
  | `plugin-sdk/allow-from` | Formatierung von Allowlists | `formatAllowFromLowercase` |
  | `plugin-sdk/allowlist-resolution` | Zuordnung von Allowlist-Eingaben | `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | Hilfsbausteine für Command-Gating und Command-Surfaces | `resolveControlCommandGate`, Hilfsbausteine für Sender-Autorisierung, Hilfsbausteine für Befehlsregistrierung |
  | `plugin-sdk/command-status` | Renderer für Command-Status/Hilfe | `buildCommandsMessage`, `buildCommandsMessagePaginated`, `buildHelpMessage` |
  | `plugin-sdk/secret-input` | Parsing von Secret-Eingaben | Hilfsbausteine für Secret-Eingaben |
  | `plugin-sdk/webhook-ingress` | Hilfsbausteine für Webhook-Requests | Hilfsbausteine für Webhook-Ziele |
  | `plugin-sdk/webhook-request-guards` | Hilfsbausteine für Guards von Webhook-Request-Bodies | Hilfsbausteine zum Lesen/Begrenzen von Request-Bodies |
  | `plugin-sdk/reply-runtime` | Gemeinsame Antwort-Runtime | Inbound-Dispatch, Heartbeat, Reply-Planer, Chunking |
  | `plugin-sdk/reply-dispatch-runtime` | Schmale Hilfsbausteine für Reply-Dispatch | Finalisierung, Provider-Dispatch und Hilfsbausteine für Konversationslabels |
  | `plugin-sdk/reply-history` | Hilfsbausteine für Antwortverlauf | `buildHistoryContext`, `buildPendingHistoryContextFromMap`, `recordPendingHistoryEntry`, `clearHistoryEntriesIfEnabled` |
  | `plugin-sdk/reply-reference` | Planung von Antwortreferenzen | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | Hilfsbausteine für Antwort-Chunking | Hilfsbausteine für Text-/Markdown-Chunking |
  | `plugin-sdk/session-store-runtime` | Hilfsbausteine für Session-Store | Hilfsbausteine für Store-Pfad + updated-at |
  | `plugin-sdk/state-paths` | Hilfsbausteine für State-Pfade | Hilfsbausteine für State- und OAuth-Verzeichnisse |
  | `plugin-sdk/routing` | Hilfsbausteine für Routing/Session-Key | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId`, Hilfsbausteine zur Normalisierung von Session-Keys |
  | `plugin-sdk/status-helpers` | Hilfsbausteine für Kanalstatus | Builder für Kanal-/Account-Statuszusammenfassungen, Defaults für Runtime-State, Hilfsbausteine für Issue-Metadaten |
  | `plugin-sdk/target-resolver-runtime` | Hilfsbausteine für Zielauflösung | Gemeinsame Hilfsbausteine für Zielauflösung |
  | `plugin-sdk/string-normalization-runtime` | Hilfsbausteine für String-Normalisierung | Hilfsbausteine für Slug-/String-Normalisierung |
  | `plugin-sdk/request-url` | Hilfsbausteine für Request-URLs | String-URLs aus request-ähnlichen Eingaben extrahieren |
  | `plugin-sdk/run-command` | Hilfsbausteine für zeitgesteuerte Befehle | Runner für zeitgesteuerte Befehle mit normalisiertem stdout/stderr |
  | `plugin-sdk/param-readers` | Param-Reader | Gemeinsame Param-Reader für Tool/CLI |
  | `plugin-sdk/tool-payload` | Extraktion von Tool-Payload | Normalisierte Payloads aus Tool-Ergebnisobjekten extrahieren |
  | `plugin-sdk/tool-send` | Extraktion von Tool-Send | Kanonische Send-Zielfelder aus Tool-Argumenten extrahieren |
  | `plugin-sdk/temp-path` | Hilfsbausteine für temporäre Pfade | Gemeinsame Hilfsbausteine für Temp-Download-Pfade |
  | `plugin-sdk/logging-core` | Hilfsbausteine für Logging | Subsystem-Logger und Hilfsbausteine für Redaction |
  | `plugin-sdk/markdown-table-runtime` | Hilfsbausteine für Markdown-Tabellen | Hilfsbausteine für Markdown-Tabellenmodi |
  | `plugin-sdk/reply-payload` | Typen für Nachrichtenantworten | Typen für Antwort-Payload |
  | `plugin-sdk/provider-setup` | Kuratierte Hilfsbausteine für lokales/selbst gehostetes Provider-Setup | Hilfsbausteine für Discovery/Konfiguration selbst gehosteter Provider |
  | `plugin-sdk/self-hosted-provider-setup` | Fokussierte Hilfsbausteine für das Setup selbst gehosteter OpenAI-kompatibler Provider | Dieselben Hilfsbausteine für Discovery/Konfiguration selbst gehosteter Provider |
  | `plugin-sdk/provider-auth-runtime` | Runtime-Hilfsbausteine für Provider-Authentifizierung | Hilfsbausteine zur Auflösung von API-Keys zur Laufzeit |
  | `plugin-sdk/provider-auth-api-key` | Hilfsbausteine für Setup von Provider-API-Keys | Hilfsbausteine für Onboarding/Profilschreiben von API-Keys |
  | `plugin-sdk/provider-auth-result` | Hilfsbausteine für Provider-Authentifizierungsergebnisse | Standard-Builder für OAuth-Authentifizierungsergebnisse |
  | `plugin-sdk/provider-auth-login` | Hilfsbausteine für interaktiven Provider-Login | Gemeinsame Hilfsbausteine für interaktiven Login |
  | `plugin-sdk/provider-selection-runtime` | Hilfsbausteine für Providerauswahl | Auswahl konfigurierter oder automatischer Provider und Merging roher Provider-Konfiguration |
  | `plugin-sdk/provider-env-vars` | Hilfsbausteine für Provider-Umgebungsvariablen | Hilfsbausteine für Lookup von Auth-Umgebungsvariablen von Providern |
  | `plugin-sdk/provider-model-shared` | Gemeinsame Hilfsbausteine für Provider-Modell/Replay | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, gemeinsame Builder für Replay-Richtlinien, Hilfsbausteine für Provider-Endpunkte und Hilfsbausteine zur Normalisierung von Model-IDs |
  | `plugin-sdk/provider-catalog-shared` | Gemeinsame Hilfsbausteine für Provider-Kataloge | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
  | `plugin-sdk/provider-onboard` | Patches für Provider-Onboarding | Hilfsbausteine für Onboarding-Konfiguration |
  | `plugin-sdk/provider-http` | Hilfsbausteine für Provider-HTTP | Generische Hilfsbausteine für Provider-HTTP/Endpunkt-Capabilities, einschließlich Hilfsbausteinen für Multipart-Formulare bei Audio-Transkription |
  | `plugin-sdk/provider-web-fetch` | Hilfsbausteine für Provider-Web-Fetch | Hilfsbausteine für Registrierung/Cache von Web-Fetch-Providern |
  | `plugin-sdk/provider-web-search-config-contract` | Hilfsbausteine für Provider-Web-Search-Konfiguration | Schmale Hilfsbausteine für Web-Search-Konfiguration/Credentials bei Providern, die keine Verdrahtung zur Plugin-Aktivierung benötigen |
  | `plugin-sdk/provider-web-search-contract` | Hilfsbausteine für Provider-Web-Search-Verträge | Schmale Hilfsbausteine für Web-Search-Konfigurations-/Credential-Verträge wie `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` und bereichsbezogene Setter/Getter für Credentials |
  | `plugin-sdk/provider-web-search` | Hilfsbausteine für Provider-Web-Search | Hilfsbausteine für Registrierung/Cache/Runtime von Web-Search-Providern |
  | `plugin-sdk/provider-tools` | Hilfsbausteine für Provider-Tool-/Schema-Kompatibilität | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, Gemini-Schema-Bereinigung + Diagnostik und xAI-Kompatibilitätshelfer wie `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
  | `plugin-sdk/provider-usage` | Hilfsbausteine für Provider-Nutzung | `fetchClaudeUsage`, `fetchGeminiUsage`, `fetchGithubCopilotUsage` und andere Hilfsbausteine für Provider-Nutzung |
  | `plugin-sdk/provider-stream` | Hilfsbausteine für Provider-Stream-Wrapper | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, Typen für Stream-Wrapper und gemeinsame Wrapper-Hilfsbausteine für Anthropic/Bedrock/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
  | `plugin-sdk/provider-transport-runtime` | Hilfsbausteine für Provider-Transport | Native Hilfsbausteine für Provider-Transport wie geschütztes Fetch, Transformationen von Transportnachrichten und beschreibbare Transport-Event-Streams |
  | `plugin-sdk/keyed-async-queue` | Geordnete Async-Queue | `KeyedAsyncQueue` |
  | `plugin-sdk/media-runtime` | Gemeinsame Hilfsbausteine für Medien | Hilfsbausteine für Medien-Fetch/Transformation/Speicherung plus Builder für Media-Payloads |
  | `plugin-sdk/media-generation-runtime` | Gemeinsame Hilfsbausteine für Mediengenerierung | Gemeinsame Hilfsbausteine für Failover, Kandidatenauswahl und Meldungen bei fehlenden Modellen für Bild-/Video-/Musikgenerierung |
  | `plugin-sdk/media-understanding` | Hilfsbausteine für Medienverständnis | Typen für Media-Understanding-Provider plus Provider-seitige Exporte von Bild-/Audio-Hilfsbausteinen |
  | `plugin-sdk/text-runtime` | Gemeinsame Hilfsbausteine für Text | Entfernen von für Assistenten sichtbarem Text, Hilfsbausteine für Markdown-Rendering/Chunking/Tabellen, Hilfsbausteine für Redaction, Hilfsbausteine für Directive-Tags, Safe-Text-Utilities und verwandte Hilfsbausteine für Text/Logging |
  | `plugin-sdk/text-chunking` | Hilfsbausteine für Text-Chunking | Hilfsbaustein für Outbound-Text-Chunking |
  | `plugin-sdk/speech` | Hilfsbausteine für Sprache | Typen für Speech-Provider plus Provider-seitige Hilfsbausteine für Directives, Registry und Validierung |
  | `plugin-sdk/speech-core` | Gemeinsamer Speech-Core | Typen für Speech-Provider, Registry, Directives, Normalisierung |
  | `plugin-sdk/realtime-transcription` | Hilfsbausteine für Realtime-Transkription | Provider-Typen, Registry-Hilfsbausteine und gemeinsamer Hilfsbaustein für WebSocket-Sitzungen |
  | `plugin-sdk/realtime-voice` | Hilfsbausteine für Realtime-Voice | Provider-Typen, Hilfsbausteine für Registry/Auflösung und Hilfsbausteine für Bridge-Sitzungen |
  | `plugin-sdk/image-generation-core` | Gemeinsamer Core für Bildgenerierung | Typen, Failover-, Auth- und Registry-Hilfsbausteine für Bildgenerierung |
  | `plugin-sdk/music-generation` | Hilfsbausteine für Musikgenerierung | Typen für Provider/Requests/Ergebnisse der Musikgenerierung |
  | `plugin-sdk/music-generation-core` | Gemeinsamer Core für Musikgenerierung | Typen für Musikgenerierung, Hilfsbausteine für Failover, Provider-Lookup und Parsing von Model-Refs |
  | `plugin-sdk/video-generation` | Hilfsbausteine für Videogenerierung | Typen für Provider/Requests/Ergebnisse der Videogenerierung |
  | `plugin-sdk/video-generation-core` | Gemeinsamer Core für Videogenerierung | Typen für Videogenerierung, Hilfsbausteine für Failover, Provider-Lookup und Parsing von Model-Refs |
  | `plugin-sdk/interactive-runtime` | Hilfsbausteine für interaktive Antworten | Normalisierung/Reduktion von Payloads für interaktive Antworten |
  | `plugin-sdk/channel-config-primitives` | Primitive für Kanal-Konfiguration | Schmale Primitive für channel-config-schema |
  | `plugin-sdk/channel-config-writes` | Hilfsbausteine für Schreibvorgänge in Kanal-Konfiguration | Hilfsbausteine für Autorisierung von Schreibvorgängen in Kanal-Konfiguration |
  | `plugin-sdk/channel-plugin-common` | Gemeinsames Channel-Prelude | Exporte des gemeinsamen Channel-Plugin-Preludes |
  | `plugin-sdk/channel-status` | Hilfsbausteine für Kanalstatus | Gemeinsame Hilfsbausteine für Snapshots/Zusammenfassungen des Kanalstatus |
  | `plugin-sdk/allowlist-config-edit` | Hilfsbausteine für Allowlist-Konfiguration | Hilfsbausteine zum Bearbeiten/Lesen von Allowlist-Konfiguration |
  | `plugin-sdk/group-access` | Hilfsbausteine für Gruppenzugriff | Gemeinsame Hilfsbausteine für Entscheidungen zum Gruppenzugriff |
  | `plugin-sdk/direct-dm` | Hilfsbausteine für direkte DMs | Gemeinsame Hilfsbausteine für Auth/Guards direkter DMs |
  | `plugin-sdk/extension-shared` | Gemeinsame Hilfsbausteine für Extensions | Primitive Hilfsbausteine für Passive-Channel/Status und Ambient-Proxy |
  | `plugin-sdk/webhook-targets` | Hilfsbausteine für Webhook-Ziele | Hilfsbausteine für Webhook-Ziel-Registry und Route-Installation |
  | `plugin-sdk/webhook-path` | Hilfsbausteine für Webhook-Pfade | Hilfsbausteine zur Normalisierung von Webhook-Pfaden |
  | `plugin-sdk/web-media` | Gemeinsame Hilfsbausteine für Web-Medien | Hilfsbausteine zum Laden entfernter/lokaler Medien |
  | `plugin-sdk/zod` | Zod-Re-Export | Re-exportiertes `zod` für Verbraucher des Plugin-SDK |
  | `plugin-sdk/memory-core` | Gebündelte Hilfsbausteine für memory-core | Hilfsoberfläche für Speicherverwaltung/Konfiguration/Dateien/CLI |
  | `plugin-sdk/memory-core-engine-runtime` | Runtime-Fassade für Memory-Engine | Runtime-Fassade für Speicherindex/Suche |
  | `plugin-sdk/memory-core-host-engine-foundation` | Foundation-Engine für Memory-Host | Exporte der Foundation-Engine für Memory-Host |
  | `plugin-sdk/memory-core-host-engine-embeddings` | Embedding-Engine für Memory-Host | Embedding-Verträge für Memory, Registry-Zugriff, lokaler Provider und generische Batch-/Remote-Hilfsbausteine; konkrete Remote-Provider leben in ihren jeweiligen Plugins |
  | `plugin-sdk/memory-core-host-engine-qmd` | QMD-Engine für Memory-Host | Exporte der QMD-Engine für Memory-Host |
  | `plugin-sdk/memory-core-host-engine-storage` | Storage-Engine für Memory-Host | Exporte der Storage-Engine für Memory-Host |
  | `plugin-sdk/memory-core-host-multimodal` | Multimodale Hilfsbausteine für Memory-Host | Multimodale Hilfsbausteine für Memory-Host |
  | `plugin-sdk/memory-core-host-query` | Query-Hilfsbausteine für Memory-Host | Query-Hilfsbausteine für Memory-Host |
  | `plugin-sdk/memory-core-host-secret` | Secret-Hilfsbausteine für Memory-Host | Secret-Hilfsbausteine für Memory-Host |
  | `plugin-sdk/memory-core-host-events` | Hilfsbausteine für Event-Journal von Memory-Host | Hilfsbausteine für Event-Journal von Memory-Host |
  | `plugin-sdk/memory-core-host-status` | Hilfsbausteine für Status von Memory-Host | Hilfsbausteine für Status von Memory-Host |
  | `plugin-sdk/memory-core-host-runtime-cli` | CLI-Runtime für Memory-Host | CLI-Runtime-Hilfsbausteine für Memory-Host |
  | `plugin-sdk/memory-core-host-runtime-core` | Core-Runtime für Memory-Host | Core-Runtime-Hilfsbausteine für Memory-Host |
  | `plugin-sdk/memory-core-host-runtime-files` | Datei-/Runtime-Hilfsbausteine für Memory-Host | Datei-/Runtime-Hilfsbausteine für Memory-Host |
  | `plugin-sdk/memory-host-core` | Alias für Core-Runtime von Memory-Host | Anbieterneutraler Alias für Core-Runtime-Hilfsbausteine von Memory-Host |
  | `plugin-sdk/memory-host-events` | Alias für Event-Journal von Memory-Host | Anbieterneutraler Alias für Hilfsbausteine des Event-Journals von Memory-Host |
  | `plugin-sdk/memory-host-files` | Alias für Datei-/Runtime von Memory-Host | Anbieterneutraler Alias für Datei-/Runtime-Hilfsbausteine von Memory-Host |
  | `plugin-sdk/memory-host-markdown` | Hilfsbausteine für verwaltetes Markdown | Gemeinsame Hilfsbausteine für verwaltetes Markdown in speichernahen Plugins |
  | `plugin-sdk/memory-host-search` | Fassade für Active Memory-Suche | Lazy-Runtime-Fassade für Active-Memory-Suchmanager |
  | `plugin-sdk/memory-host-status` | Alias für Status von Memory-Host | Anbieterneutraler Alias für Status-Hilfsbausteine von Memory-Host |
  | `plugin-sdk/memory-lancedb` | Gebündelte Hilfsbausteine für memory-lancedb | Hilfsoberfläche für memory-lancedb |
  | `plugin-sdk/testing` | Test-Utilities | Test-Hilfsbausteine und Mocks |
</Accordion>

Diese Tabelle ist bewusst das gängige Migrations-Subset und nicht die vollständige SDK-
Fläche. Die vollständige Liste mit mehr als 200 Einstiegspunkten befindet sich in
`scripts/lib/plugin-sdk-entrypoints.json`.

Diese Liste enthält weiterhin einige Helper-Seams für gebündelte Plugins wie
`plugin-sdk/feishu`, `plugin-sdk/feishu-setup`, `plugin-sdk/zalo`,
`plugin-sdk/zalo-setup` und `plugin-sdk/matrix*`. Diese bleiben für die Wartung
gebündelter Plugins und zur Kompatibilität exportiert, sind aber bewusst nicht in der
gängigen Migrationstabelle enthalten und nicht das empfohlene Ziel für neuen Plugin-Code.

Dieselbe Regel gilt für andere Familien gebündelter Helfer wie:

- Browser-Support-Helfer: `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support`
- Matrix: `plugin-sdk/matrix*`
- LINE: `plugin-sdk/line*`
- IRC: `plugin-sdk/irc*`
- gebündelte Helper-/Plugin-Flächen wie `plugin-sdk/googlechat`,
  `plugin-sdk/zalouser`, `plugin-sdk/bluebubbles*`,
  `plugin-sdk/mattermost*`, `plugin-sdk/msteams`,
  `plugin-sdk/nextcloud-talk`, `plugin-sdk/nostr`, `plugin-sdk/tlon`,
  `plugin-sdk/twitch`,
  `plugin-sdk/github-copilot-login`, `plugin-sdk/github-copilot-token`,
  `plugin-sdk/diagnostics-otel`, `plugin-sdk/diffs`, `plugin-sdk/llm-task`,
  `plugin-sdk/thread-ownership` und `plugin-sdk/voice-call`

`plugin-sdk/github-copilot-token` stellt derzeit die schmale
Token-Hilfsoberfläche `DEFAULT_COPILOT_API_BASE_URL`,
`deriveCopilotApiBaseUrlFromToken` und `resolveCopilotApiToken` bereit.

Verwende den schmalsten Import, der zur Aufgabe passt. Wenn du einen Export nicht finden kannst,
prüfe den Quellcode unter `src/plugin-sdk/` oder frage in Discord nach.

## Zeitplan für die Entfernung

| Wann | Was passiert |
| ---------------------- | ----------------------------------------------------------------------- |
| **Jetzt** | Deprecated Flächen geben Laufzeitwarnungen aus |
| **Nächste Major-Release** | Deprecated Flächen werden entfernt; Plugins, die sie noch verwenden, schlagen fehl |

Alle Core-Plugins wurden bereits migriert. Externe Plugins sollten vor der nächsten
Major-Release migrieren.

## Warnungen vorübergehend unterdrücken

Setze diese Umgebungsvariablen, während du an der Migration arbeitest:

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

Dies ist ein vorübergehender Escape Hatch, keine dauerhafte Lösung.

## Verwandt

- [Erste Schritte](/de/plugins/building-plugins) — dein erstes Plugin erstellen
- [SDK-Überblick](/de/plugins/sdk-overview) — vollständige Referenz für Subpath-Imports
- [Channel-Plugins](/de/plugins/sdk-channel-plugins) — Channel-Plugins erstellen
- [Provider-Plugins](/de/plugins/sdk-provider-plugins) — Provider-Plugins erstellen
- [Plugin-Interna](/de/plugins/architecture) — ausführlicher Architekturüberblick
- [Plugin-Manifest](/de/plugins/manifest) — Referenz zum Manifest-Schema
