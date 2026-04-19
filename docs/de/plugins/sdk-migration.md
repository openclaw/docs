---
read_when:
    - Sie sehen die Warnung `OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED`
    - Sie sehen die Warnung `OPENCLAW_EXTENSION_API_DEPRECATED`
    - Sie aktualisieren ein Plugin auf die moderne Plugin-Architektur
    - Sie pflegen ein externes OpenClaw Plugin
sidebarTitle: Migrate to SDK
summary: Migrieren Sie von der veralteten Abwärtskompatibilitätsschicht zum modernen Plugin SDK
title: Plugin SDK-Migration
x-i18n:
    generated_at: "2026-04-19T01:11:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: e0df202ed35b3e72bfec1d23201d0e83294fe09cec2caf6e276835098491a899
    source_path: plugins/sdk-migration.md
    workflow: 15
---

# Plugin SDK-Migration

OpenClaw ist von einer breiten Abwärtskompatibilitätsschicht zu einer modernen Plugin-Architektur mit gezielten, dokumentierten Imports übergegangen. Wenn Ihr Plugin vor der neuen Architektur erstellt wurde, hilft Ihnen dieser Leitfaden bei der Migration.

## Was sich ändert

Das alte Plugin-System stellte zwei weit offene Oberflächen bereit, über die Plugins alles importieren konnten, was sie über einen einzigen Einstiegspunkt benötigten:

- **`openclaw/plugin-sdk/compat`** — ein einzelner Import, der Dutzende von Hilfsfunktionen re-exportierte. Er wurde eingeführt, um ältere hook-basierte Plugins weiter funktionsfähig zu halten, während die neue Plugin-Architektur entwickelt wurde.
- **`openclaw/extension-api`** — eine Brücke, die Plugins direkten Zugriff auf hostseitige Hilfsfunktionen wie den eingebetteten Agent-Runner gab.

Beide Oberflächen sind jetzt **veraltet**. Sie funktionieren zur Laufzeit weiterhin, aber neue Plugins dürfen sie nicht verwenden, und bestehende Plugins sollten vor der nächsten Hauptversion migrieren, die sie entfernt.

<Warning>
  Die Abwärtskompatibilitätsschicht wird in einer zukünftigen Hauptversion entfernt.
  Plugins, die weiterhin von diesen Oberflächen importieren, werden dann nicht mehr funktionieren.
</Warning>

## Warum sich das geändert hat

Der alte Ansatz verursachte Probleme:

- **Langsamer Start** — das Importieren einer Hilfsfunktion lud Dutzende nicht zusammenhängender Module
- **Zirkuläre Abhängigkeiten** — breite Re-Exports machten es leicht, Importzyklen zu erzeugen
- **Unklare API-Oberfläche** — es gab keine Möglichkeit zu erkennen, welche Exporte stabil und welche intern waren

Das moderne Plugin SDK behebt dies: Jeder Importpfad (`openclaw/plugin-sdk/\<subpath\>`) ist ein kleines, in sich geschlossenes Modul mit einem klaren Zweck und dokumentiertem Vertrag.

Veraltete Komfort-Schnittstellen für Provider in gebündelten Kanälen sind ebenfalls entfernt. Imports wie `openclaw/plugin-sdk/slack`, `openclaw/plugin-sdk/discord`, `openclaw/plugin-sdk/signal`, `openclaw/plugin-sdk/whatsapp`, kanalmarkierte Hilfs-Schnittstellen und `openclaw/plugin-sdk/telegram-core` waren private Mono-Repo-Abkürzungen, keine stabilen Plugin-Verträge. Verwenden Sie stattdessen schmale generische SDK-Unterpfade. Innerhalb des gebündelten Plugin-Workspaces sollten provider-eigene Hilfsfunktionen im eigenen `api.ts` oder `runtime-api.ts` dieses Plugins bleiben.

Aktuelle Beispiele für gebündelte Provider:

- Anthropic hält Claude-spezifische Stream-Hilfsfunktionen in seiner eigenen `api.ts`- / `contract-api.ts`-Schnittstelle
- OpenAI hält Provider-Builder, Hilfsfunktionen für Standardmodelle und Realtime-Provider-Builder in seiner eigenen `api.ts`
- OpenRouter hält Provider-Builder sowie Onboarding-/Konfigurationshilfsfunktionen in seiner eigenen `api.ts`

## So migrieren Sie

<Steps>
  <Step title="Migrieren Sie Approval-native Handler zu Capability-Fakten">
    Kanal-Plugins mit Approval-Unterstützung stellen natives Approval-Verhalten jetzt über
    `approvalCapability.nativeRuntime` plus die gemeinsame Laufzeitkontext-Registry bereit.

    Wichtige Änderungen:

    - Ersetzen Sie `approvalCapability.handler.loadRuntime(...)` durch
      `approvalCapability.nativeRuntime`
    - Verschieben Sie Approval-spezifische Authentifizierung/Zustellung aus der veralteten Verdrahtung `plugin.auth` /
      `plugin.approvals` auf `approvalCapability`
    - `ChannelPlugin.approvals` wurde aus dem öffentlichen Kanal-Plugin-Vertrag entfernt;
      verschieben Sie delivery/native/render-Felder auf `approvalCapability`
    - `plugin.auth` bleibt nur für Kanal-Login-/Logout-Abläufe bestehen; Approval-Authentifizierungs-
      Hooks dort werden von Core nicht mehr gelesen
    - Registrieren Sie kanal-eigene Laufzeitobjekte wie Clients, Tokens oder Bolt-
      Apps über `openclaw/plugin-sdk/channel-runtime-context`
    - Senden Sie keine plugin-eigenen Umleitungs-Hinweise aus nativen Approval-Handlern;
      Core verwaltet jetzt routed-elsewhere-Hinweise aus tatsächlichen Zustellungsergebnissen
    - Wenn Sie `channelRuntime` an `createChannelManager(...)` übergeben, stellen Sie eine
      echte `createPluginRuntime().channel`-Oberfläche bereit. Teilweise Stubs werden abgelehnt.

    Siehe `/plugins/sdk-channel-plugins` für das aktuelle Layout der Approval-Capability.

  </Step>

  <Step title="Prüfen Sie das Fallback-Verhalten des Windows-Wrappers">
    Wenn Ihr Plugin `openclaw/plugin-sdk/windows-spawn` verwendet, schlagen nicht aufgelöste Windows-
    `.cmd`-/`.bat`-Wrapper jetzt standardmäßig fehl, es sei denn, Sie übergeben explizit
    `allowShellFallback: true`.

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

  <Step title="Suchen Sie nach veralteten Imports">
    Durchsuchen Sie Ihr Plugin nach Imports aus einer der beiden veralteten Oberflächen:

    ```bash
    grep -r "plugin-sdk/compat" my-plugin/
    grep -r "openclaw/extension-api" my-plugin/
    ```

  </Step>

  <Step title="Ersetzen Sie sie durch gezielte Imports">
    Jeder Export aus der alten Oberfläche entspricht einem bestimmten modernen Importpfad:

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

    Verwenden Sie für hostseitige Hilfsfunktionen die injizierte Plugin-Laufzeit, anstatt
    direkt zu importieren:

    ```typescript
    // Before (deprecated extension-api bridge)
    import { runEmbeddedPiAgent } from "openclaw/extension-api";
    const result = await runEmbeddedPiAgent({ sessionId, prompt });

    // After (injected runtime)
    const result = await api.runtime.agent.runEmbeddedPiAgent({ sessionId, prompt });
    ```

    Dasselbe Muster gilt für andere veraltete Brücken-Hilfsfunktionen:

    | Alter Import | Modernes Äquivalent |
    | --- | --- |
    | `resolveAgentDir` | `api.runtime.agent.resolveAgentDir` |
    | `resolveAgentWorkspaceDir` | `api.runtime.agent.resolveAgentWorkspaceDir` |
    | `resolveAgentIdentity` | `api.runtime.agent.resolveAgentIdentity` |
    | `resolveThinkingDefault` | `api.runtime.agent.resolveThinkingDefault` |
    | `resolveAgentTimeoutMs` | `api.runtime.agent.resolveAgentTimeoutMs` |
    | `ensureAgentWorkspace` | `api.runtime.agent.ensureAgentWorkspace` |
    | session store helpers | `api.runtime.agent.session.*` |

  </Step>

  <Step title="Erstellen und testen">
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
  | `plugin-sdk/plugin-entry` | Kanonische Hilfsfunktion für Plugin-Einstiegspunkte | `definePluginEntry` |
  | `plugin-sdk/core` | Veralteter übergreifender Re-Export für Kanal-Einstiegsdefinitionen/-Builder | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | Export des Root-Konfigurationsschemas | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | Hilfsfunktion für Einstiegspunkte mit einem einzelnen Provider | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | Gezielt ausgerichtete Kanal-Einstiegsdefinitionen und -Builder | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
  | `plugin-sdk/setup` | Gemeinsame Hilfsfunktionen für den Setup-Assistenten | Allowlist-Eingabeaufforderungen, Builder für Setup-Status |
  | `plugin-sdk/setup-runtime` | Laufzeit-Hilfsfunktionen zur Setup-Zeit | Importsichere Setup-Patch-Adapter, Hilfsfunktionen für Lookup-Hinweise, `promptResolvedAllowFrom`, `splitSetupEntries`, delegierte Setup-Proxys |
  | `plugin-sdk/setup-adapter-runtime` | Hilfsfunktionen für Setup-Adapter | `createEnvPatchedAccountSetupAdapter` |
  | `plugin-sdk/setup-tools` | Hilfsfunktionen für Setup-Tooling | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | Hilfsfunktionen für mehrere Konten | Hilfsfunktionen für Kontolisten/Konfiguration/Action-Gates |
  | `plugin-sdk/account-id` | Hilfsfunktionen für Konto-IDs | `DEFAULT_ACCOUNT_ID`, Normalisierung von Konto-IDs |
  | `plugin-sdk/account-resolution` | Hilfsfunktionen für die Kontoermittlung | Hilfsfunktionen für Kontoermittlung + Standard-Fallback |
  | `plugin-sdk/account-helpers` | Schmale Hilfsfunktionen für Konten | Hilfsfunktionen für Kontolisten/Kontoaktionen |
  | `plugin-sdk/channel-setup` | Adapter für den Setup-Assistenten | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, plus `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | Primitive Bausteine für DM-Pairing | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | Verdrahtung für Antwort-Präfix + Tippen | `createChannelReplyPipeline` |
  | `plugin-sdk/channel-config-helpers` | Fabriken für Konfigurationsadapter | `createHybridChannelConfigAdapter` |
  | `plugin-sdk/channel-config-schema` | Builder für Konfigurationsschemas | Typen für Kanal-Konfigurationsschemas |
  | `plugin-sdk/telegram-command-config` | Hilfsfunktionen für Telegram-Befehlskonfiguration | Normalisierung von Befehlsnamen, Kürzen von Beschreibungen, Validierung von Duplikaten/Konflikten |
  | `plugin-sdk/channel-policy` | Auflösung von Gruppen-/DM-Richtlinien | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | Verfolgung des Kontostatus | `createAccountStatusSink` |
  | `plugin-sdk/inbound-envelope` | Hilfsfunktionen für eingehende Umschläge | Gemeinsame Hilfsfunktionen für Routing + Umschlag-Builder |
  | `plugin-sdk/inbound-reply-dispatch` | Hilfsfunktionen für eingehende Antworten | Gemeinsame Hilfsfunktionen zum Aufzeichnen und Weiterleiten |
  | `plugin-sdk/messaging-targets` | Parsen von Messaging-Zielen | Hilfsfunktionen zum Parsen/Abgleichen von Zielen |
  | `plugin-sdk/outbound-media` | Hilfsfunktionen für ausgehende Medien | Gemeinsames Laden ausgehender Medien |
  | `plugin-sdk/outbound-runtime` | Laufzeit-Hilfsfunktionen für ausgehende Vorgänge | Hilfsfunktionen für ausgehende Identität/Sende-Delegierung |
  | `plugin-sdk/thread-bindings-runtime` | Hilfsfunktionen für Thread-Bindings | Hilfsfunktionen für Lebenszyklus und Adapter von Thread-Bindings |
  | `plugin-sdk/agent-media-payload` | Veraltete Hilfsfunktionen für Medien-Payloads | Agent-Medien-Payload-Builder für veraltete Feldlayouts |
  | `plugin-sdk/channel-runtime` | Veralteter Kompatibilitäts-Shim | Nur veraltete Kanal-Laufzeit-Utilities |
  | `plugin-sdk/channel-send-result` | Typen für Sendeergebnisse | Typen für Antwortergebnisse |
  | `plugin-sdk/runtime-store` | Persistenter Plugin-Speicher | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | Breite Laufzeit-Hilfsfunktionen | Hilfsfunktionen für Laufzeit/Logging/Backups/Plugin-Installation |
  | `plugin-sdk/runtime-env` | Schmale Hilfsfunktionen für die Laufzeitumgebung | Logger-/Laufzeitumgebungs-, Timeout-, Retry- und Backoff-Hilfsfunktionen |
  | `plugin-sdk/plugin-runtime` | Gemeinsame Plugin-Laufzeit-Hilfsfunktionen | Hilfsfunktionen für Plugin-Befehle/Hooks/HTTP/interaktive Funktionen |
  | `plugin-sdk/hook-runtime` | Hilfsfunktionen für Hook-Pipelines | Gemeinsame Hilfsfunktionen für Webhook-/interne Hook-Pipelines |
  | `plugin-sdk/lazy-runtime` | Hilfsfunktionen für verzögerte Laufzeit | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | Prozess-Hilfsfunktionen | Gemeinsame Exec-Hilfsfunktionen |
  | `plugin-sdk/cli-runtime` | CLI-Laufzeit-Hilfsfunktionen | Hilfsfunktionen für Befehlsformatierung, Wartezeiten und Versionen |
  | `plugin-sdk/gateway-runtime` | Gateway-Hilfsfunktionen | Hilfsfunktionen für Gateway-Client und Kanalstatus-Patches |
  | `plugin-sdk/config-runtime` | Konfigurations-Hilfsfunktionen | Hilfsfunktionen zum Laden/Schreiben von Konfiguration |
  | `plugin-sdk/telegram-command-config` | Hilfsfunktionen für Telegram-Befehle | Telegram-Befehlsvalidierungs-Hilfsfunktionen mit stabilem Fallback, wenn die gebündelte Telegram-Vertragsoberfläche nicht verfügbar ist |
  | `plugin-sdk/approval-runtime` | Hilfsfunktionen für Approval-Aufforderungen | Hilfsfunktionen für Exec-/Plugin-Approval-Payload, Approval-Capability/-Profile, natives Approval-Routing/-Laufzeit |
  | `plugin-sdk/approval-auth-runtime` | Hilfsfunktionen für Approval-Authentifizierung | Approver-Auflösung, Authentifizierung von Same-Chat-Aktionen |
  | `plugin-sdk/approval-client-runtime` | Hilfsfunktionen für Approval-Clients | Hilfsfunktionen für native Exec-Approval-Profile/-Filter |
  | `plugin-sdk/approval-delivery-runtime` | Hilfsfunktionen für Approval-Zustellung | Native Adapter für Approval-Capability/-Zustellung |
  | `plugin-sdk/approval-gateway-runtime` | Hilfsfunktionen für Approval-Gateway | Gemeinsame Hilfsfunktion zur Approval-Gateway-Auflösung |
  | `plugin-sdk/approval-handler-adapter-runtime` | Hilfsfunktionen für Approval-Adapter | Leichtgewichtige Hilfsfunktionen zum Laden nativer Approval-Adapter für Hot-Channel-Einstiegspunkte |
  | `plugin-sdk/approval-handler-runtime` | Hilfsfunktionen für Approval-Handler | Breitere Laufzeit-Hilfsfunktionen für Approval-Handler; bevorzugen Sie die schmaleren Adapter-/Gateway-Schnittstellen, wenn sie ausreichen |
  | `plugin-sdk/approval-native-runtime` | Hilfsfunktionen für Approval-Ziele | Hilfsfunktionen für native Approval-Ziel-/Kontobindung |
  | `plugin-sdk/approval-reply-runtime` | Hilfsfunktionen für Approval-Antworten | Hilfsfunktionen für Exec-/Plugin-Approval-Antwort-Payload |
  | `plugin-sdk/channel-runtime-context` | Hilfsfunktionen für Kanal-Laufzeitkontext | Generische Hilfsfunktionen zum Registrieren/Abrufen/Beobachten von Kanal-Laufzeitkontext |
  | `plugin-sdk/security-runtime` | Sicherheits-Hilfsfunktionen | Gemeinsame Hilfsfunktionen für Vertrauen, DM-Gating, externe Inhalte und Secret-Erfassung |
  | `plugin-sdk/ssrf-policy` | Hilfsfunktionen für SSRF-Richtlinien | Hilfsfunktionen für Host-Allowlist und Private-Network-Richtlinien |
  | `plugin-sdk/ssrf-runtime` | SSRF-Laufzeit-Hilfsfunktionen | Hilfsfunktionen für Pinned Dispatcher, Guarded Fetch, SSRF-Richtlinien |
  | `plugin-sdk/collection-runtime` | Hilfsfunktionen für begrenzte Caches | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | Hilfsfunktionen für Diagnostic-Gating | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | Hilfsfunktionen für Fehlerformatierung | `formatUncaughtError`, `isApprovalNotFoundError`, Hilfsfunktionen für Fehlergraphen |
  | `plugin-sdk/fetch-runtime` | Hilfsfunktionen für Wrapped Fetch/Proxys | `resolveFetch`, Proxy-Hilfsfunktionen |
  | `plugin-sdk/host-runtime` | Hilfsfunktionen für Host-Normalisierung | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | Retry-Hilfsfunktionen | `RetryConfig`, `retryAsync`, Policy-Runner |
  | `plugin-sdk/allow-from` | Allowlist-Formatierung | `formatAllowFromLowercase` |
  | `plugin-sdk/allowlist-resolution` | Zuordnung von Allowlist-Eingaben | `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | Hilfsfunktionen für Command-Gating und Befehlsoberflächen | `resolveControlCommandGate`, Hilfsfunktionen für Sender-Autorisierung, Hilfsfunktionen für Befehlsregistry |
  | `plugin-sdk/command-status` | Renderer für Befehlsstatus/-hilfe | `buildCommandsMessage`, `buildCommandsMessagePaginated`, `buildHelpMessage` |
  | `plugin-sdk/secret-input` | Parsen von Secret-Eingaben | Hilfsfunktionen für Secret-Eingaben |
  | `plugin-sdk/webhook-ingress` | Hilfsfunktionen für Webhook-Anfragen | Utilities für Webhook-Ziele |
  | `plugin-sdk/webhook-request-guards` | Hilfsfunktionen für Guards des Webhook-Bodys | Hilfsfunktionen zum Lesen/Begrenzen des Request-Bodys |
  | `plugin-sdk/reply-runtime` | Gemeinsame Antwort-Laufzeit | Eingehende Dispatches, Heartbeat, Antwortplanung, Chunking |
  | `plugin-sdk/reply-dispatch-runtime` | Schmale Hilfsfunktionen für Antwort-Dispatch | Hilfsfunktionen zum Finalisieren + Provider-Dispatch |
  | `plugin-sdk/reply-history` | Hilfsfunktionen für Antwortverlauf | `buildHistoryContext`, `buildPendingHistoryContextFromMap`, `recordPendingHistoryEntry`, `clearHistoryEntriesIfEnabled` |
  | `plugin-sdk/reply-reference` | Planung von Antwortreferenzen | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | Hilfsfunktionen für Antwort-Chunks | Hilfsfunktionen für Text-/Markdown-Chunking |
  | `plugin-sdk/session-store-runtime` | Hilfsfunktionen für Session Store | Hilfsfunktionen für Store-Pfad + updated-at |
  | `plugin-sdk/state-paths` | Hilfsfunktionen für State-Pfade | Hilfsfunktionen für State- und OAuth-Verzeichnisse |
  | `plugin-sdk/routing` | Hilfsfunktionen für Routing/Session-Schlüssel | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId`, Hilfsfunktionen zur Normalisierung von Session-Schlüsseln |
  | `plugin-sdk/status-helpers` | Hilfsfunktionen für Kanalstatus | Builder für Kanal-/Kontostatuszusammenfassungen, Standardwerte für Laufzeitstatus, Hilfsfunktionen für Issue-Metadaten |
  | `plugin-sdk/target-resolver-runtime` | Hilfsfunktionen für Zielauflösung | Gemeinsame Hilfsfunktionen für Zielauflösung |
  | `plugin-sdk/string-normalization-runtime` | Hilfsfunktionen für String-Normalisierung | Hilfsfunktionen für Slug-/String-Normalisierung |
  | `plugin-sdk/request-url` | Hilfsfunktionen für Request-URLs | String-URLs aus Request-ähnlichen Eingaben extrahieren |
  | `plugin-sdk/run-command` | Hilfsfunktionen für zeitgesteuerte Befehle | Timed Command Runner mit normalisiertem stdout/stderr |
  | `plugin-sdk/param-readers` | Param-Reader | Gemeinsame Param-Reader für Tool/CLI |
  | `plugin-sdk/tool-payload` | Extraktion von Tool-Payloads | Normalisierte Payloads aus Tool-Ergebnisobjekten extrahieren |
  | `plugin-sdk/tool-send` | Extraktion von Tool-Sendewerten | Kanonische Sendefeld-Ziele aus Tool-Argumenten extrahieren |
  | `plugin-sdk/temp-path` | Hilfsfunktionen für temporäre Pfade | Gemeinsame Hilfsfunktionen für temporäre Download-Pfade |
  | `plugin-sdk/logging-core` | Logging-Hilfsfunktionen | Hilfsfunktionen für Subsystem-Logger und Redaction |
  | `plugin-sdk/markdown-table-runtime` | Hilfsfunktionen für Markdown-Tabellen | Hilfsfunktionen für Modi von Markdown-Tabellen |
  | `plugin-sdk/reply-payload` | Typen für Nachrichtenantworten | Typen für Antwort-Payloads |
  | `plugin-sdk/provider-setup` | Kuratierte Hilfsfunktionen für das Setup lokaler/self-hosted Provider | Hilfsfunktionen für Erkennung/Konfiguration self-hosted Provider |
  | `plugin-sdk/self-hosted-provider-setup` | Gezielt ausgerichtete Hilfsfunktionen für das Setup OpenAI-kompatibler self-hosted Provider | Dieselben Hilfsfunktionen für Erkennung/Konfiguration self-hosted Provider |
  | `plugin-sdk/provider-auth-runtime` | Hilfsfunktionen für Provider-Laufzeit-Authentifizierung | Hilfsfunktionen für Laufzeit-API-Key-Auflösung |
  | `plugin-sdk/provider-auth-api-key` | Hilfsfunktionen für die Einrichtung von Provider-API-Keys | Hilfsfunktionen für API-Key-Onboarding/Profilschreibung |
  | `plugin-sdk/provider-auth-result` | Hilfsfunktionen für Provider-Authentifizierungsergebnisse | Standard-Builder für OAuth-Authentifizierungsergebnisse |
  | `plugin-sdk/provider-auth-login` | Hilfsfunktionen für interaktive Provider-Anmeldung | Gemeinsame Hilfsfunktionen für interaktive Anmeldung |
  | `plugin-sdk/provider-env-vars` | Hilfsfunktionen für Provider-Umgebungsvariablen | Hilfsfunktionen für die Suche nach Provider-Authentifizierungs-Umgebungsvariablen |
  | `plugin-sdk/provider-model-shared` | Gemeinsame Hilfsfunktionen für Provider-Modelle/-Replay | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, gemeinsame Builder für Replay-Richtlinien, Hilfsfunktionen für Provider-Endpunkte und Hilfsfunktionen zur Modell-ID-Normalisierung |
  | `plugin-sdk/provider-catalog-shared` | Gemeinsame Hilfsfunktionen für Provider-Kataloge | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
  | `plugin-sdk/provider-onboard` | Patches für Provider-Onboarding | Hilfsfunktionen für Onboarding-Konfiguration |
  | `plugin-sdk/provider-http` | Hilfsfunktionen für Provider-HTTP | Generische Hilfsfunktionen für Provider-HTTP/Endpunkt-Capabilities |
  | `plugin-sdk/provider-web-fetch` | Hilfsfunktionen für Provider-Web-Fetch | Hilfsfunktionen für Registrierung/Cache von Web-Fetch-Providern |
  | `plugin-sdk/provider-web-search-config-contract` | Hilfsfunktionen für Provider-Web-Search-Konfiguration | Schmale Hilfsfunktionen für Web-Search-Konfiguration/Credentials für Provider, die keine Verdrahtung zur Plugin-Aktivierung benötigen |
  | `plugin-sdk/provider-web-search-contract` | Hilfsfunktionen für Provider-Web-Search-Verträge | Schmale Hilfsfunktionen für Web-Search-Konfigurations-/Credential-Verträge wie `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` und bereichsbezogene Setter/Getter für Credentials |
  | `plugin-sdk/provider-web-search` | Hilfsfunktionen für Provider-Web-Search | Hilfsfunktionen für Registrierung/Cache/Laufzeit von Web-Search-Providern |
  | `plugin-sdk/provider-tools` | Hilfsfunktionen für Provider-Tool-/Schema-Kompatibilität | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, Gemini-Schema-Bereinigung + Diagnosefunktionen sowie xAI-Kompatibilitätsfunktionen wie `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
  | `plugin-sdk/provider-usage` | Hilfsfunktionen für Provider-Nutzung | `fetchClaudeUsage`, `fetchGeminiUsage`, `fetchGithubCopilotUsage` und weitere Hilfsfunktionen für Provider-Nutzung |
  | `plugin-sdk/provider-stream` | Hilfsfunktionen für Provider-Stream-Wrapper | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, Typen für Stream-Wrapper sowie gemeinsame Hilfsfunktionen für Wrapper von Anthropic/Bedrock/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
  | `plugin-sdk/provider-transport-runtime` | Hilfsfunktionen für Provider-Transport | Hilfsfunktionen für nativen Provider-Transport wie Guarded Fetch, Transport-Nachrichtentransformationen und beschreibbare Transport-Event-Streams |
  | `plugin-sdk/keyed-async-queue` | Geordnete asynchrone Warteschlange | `KeyedAsyncQueue` |
  | `plugin-sdk/media-runtime` | Gemeinsame Hilfsfunktionen für Medien | Hilfsfunktionen für Medienabruf/-transformation/-speicherung plus Builder für Medien-Payloads |
  | `plugin-sdk/media-generation-runtime` | Gemeinsame Hilfsfunktionen für Mediengenerierung | Gemeinsame Hilfsfunktionen für Failover, Kandidatenauswahl und Meldungen bei fehlenden Modellen für Bild-/Video-/Musikgenerierung |
  | `plugin-sdk/media-understanding` | Hilfsfunktionen für Medienverständnis | Typen für Medienverständnis-Provider plus providerseitige Exporte von Bild-/Audio-Hilfsfunktionen |
  | `plugin-sdk/text-runtime` | Gemeinsame Hilfsfunktionen für Text | Hilfsfunktionen zum Entfernen von für Assistenten sichtbarem Text, Markdown-Rendering/-Chunking/-Tabellen-Hilfsfunktionen, Redaction-Hilfsfunktionen, Hilfsfunktionen für Directive-Tags, Safe-Text-Utilities und verwandte Text-/Logging-Hilfsfunktionen |
  | `plugin-sdk/text-chunking` | Hilfsfunktionen für Text-Chunking | Hilfsfunktion für das Chunking ausgehender Texte |
  | `plugin-sdk/speech` | Hilfsfunktionen für Sprache | Typen für Sprach-Provider plus providerseitige Hilfsfunktionen für Direktiven, Registry und Validierung |
  | `plugin-sdk/speech-core` | Gemeinsamer Speech Core | Typen für Sprach-Provider, Registry, Direktiven, Normalisierung |
  | `plugin-sdk/realtime-transcription` | Hilfsfunktionen für Realtime-Transkription | Hilfsfunktionen für Provider-Typen und Registry |
  | `plugin-sdk/realtime-voice` | Hilfsfunktionen für Realtime-Voice | Hilfsfunktionen für Provider-Typen und Registry |
  | `plugin-sdk/image-generation-core` | Gemeinsamer Core für Bildgenerierung | Hilfsfunktionen für Typen, Failover, Auth und Registry der Bildgenerierung |
  | `plugin-sdk/music-generation` | Hilfsfunktionen für Musikgenerierung | Typen für Musikgenerierungs-Provider/-Anfragen/-Ergebnisse |
  | `plugin-sdk/music-generation-core` | Gemeinsamer Core für Musikgenerierung | Hilfsfunktionen für Typen, Failover, Provider-Lookup und Modell-Ref-Parsing der Musikgenerierung |
  | `plugin-sdk/video-generation` | Hilfsfunktionen für Videogenerierung | Typen für Videogenerierungs-Provider/-Anfragen/-Ergebnisse |
  | `plugin-sdk/video-generation-core` | Gemeinsamer Core für Videogenerierung | Hilfsfunktionen für Typen, Failover, Provider-Lookup und Modell-Ref-Parsing der Videogenerierung |
  | `plugin-sdk/interactive-runtime` | Hilfsfunktionen für interaktive Antworten | Normalisierung/Reduktion von Payloads interaktiver Antworten |
  | `plugin-sdk/channel-config-primitives` | Primitive Bausteine für Kanal-Konfiguration | Schmale Primitive für Kanal-Konfigurationsschemas |
  | `plugin-sdk/channel-config-writes` | Hilfsfunktionen für Kanal-Konfigurationsschreibvorgänge | Hilfsfunktionen für die Autorisierung von Kanal-Konfigurationsschreibvorgängen |
  | `plugin-sdk/channel-plugin-common` | Gemeinsames Kanal-Präludium | Exporte des gemeinsamen Kanal-Plugin-Präludiums |
  | `plugin-sdk/channel-status` | Hilfsfunktionen für Kanalstatus | Gemeinsame Hilfsfunktionen für Snapshots/Zusammenfassungen des Kanalstatus |
  | `plugin-sdk/allowlist-config-edit` | Hilfsfunktionen für Allowlist-Konfiguration | Hilfsfunktionen zum Bearbeiten/Lesen von Allowlist-Konfigurationen |
  | `plugin-sdk/group-access` | Hilfsfunktionen für Gruppenzugriff | Gemeinsame Hilfsfunktionen für Entscheidungen zum Gruppenzugriff |
  | `plugin-sdk/direct-dm` | Hilfsfunktionen für direkte DMs | Gemeinsame Hilfsfunktionen für Authentifizierung/Guards bei direkten DMs |
  | `plugin-sdk/extension-shared` | Gemeinsame Hilfsfunktionen für Erweiterungen | Primitive Hilfsfunktionen für passive Kanäle/Status und ambient Proxy |
  | `plugin-sdk/webhook-targets` | Hilfsfunktionen für Webhook-Ziele | Hilfsfunktionen für Registry und Routeninstallation von Webhook-Zielen |
  | `plugin-sdk/webhook-path` | Hilfsfunktionen für Webhook-Pfade | Hilfsfunktionen zur Normalisierung von Webhook-Pfaden |
  | `plugin-sdk/web-media` | Gemeinsame Hilfsfunktionen für Web-Medien | Hilfsfunktionen zum Laden entfernter/lokaler Medien |
  | `plugin-sdk/zod` | Zod-Re-Export | Re-exportiertes `zod` für Plugin-SDK-Konsumenten |
  | `plugin-sdk/memory-core` | Gebündelte Hilfsfunktionen für memory-core | Hilfsoberfläche für Memory-Manager/Konfiguration/Datei/CLI |
  | `plugin-sdk/memory-core-engine-runtime` | Laufzeit-Fassade der Memory-Engine | Laufzeit-Fassade für Memory-Index/Suche |
  | `plugin-sdk/memory-core-host-engine-foundation` | Foundation-Engine des Memory-Hosts | Exporte der Foundation-Engine des Memory-Hosts |
  | `plugin-sdk/memory-core-host-engine-embeddings` | Embedding-Engine des Memory-Hosts | Memory-Embedding-Verträge, Registry-Zugriff, lokaler Provider und generische Batch-/Remote-Hilfsfunktionen; konkrete Remote-Provider befinden sich in ihren jeweiligen Plugins |
  | `plugin-sdk/memory-core-host-engine-qmd` | QMD-Engine des Memory-Hosts | Exporte der QMD-Engine des Memory-Hosts |
  | `plugin-sdk/memory-core-host-engine-storage` | Storage-Engine des Memory-Hosts | Exporte der Storage-Engine des Memory-Hosts |
  | `plugin-sdk/memory-core-host-multimodal` | Multimodale Hilfsfunktionen des Memory-Hosts | Multimodale Hilfsfunktionen des Memory-Hosts |
  | `plugin-sdk/memory-core-host-query` | Query-Hilfsfunktionen des Memory-Hosts | Query-Hilfsfunktionen des Memory-Hosts |
  | `plugin-sdk/memory-core-host-secret` | Secret-Hilfsfunktionen des Memory-Hosts | Secret-Hilfsfunktionen des Memory-Hosts |
  | `plugin-sdk/memory-core-host-events` | Hilfsfunktionen für Event-Journale des Memory-Hosts | Hilfsfunktionen für Event-Journale des Memory-Hosts |
  | `plugin-sdk/memory-core-host-status` | Hilfsfunktionen für Status des Memory-Hosts | Hilfsfunktionen für Status des Memory-Hosts |
  | `plugin-sdk/memory-core-host-runtime-cli` | CLI-Laufzeit des Memory-Hosts | CLI-Laufzeit-Hilfsfunktionen des Memory-Hosts |
  | `plugin-sdk/memory-core-host-runtime-core` | Core-Laufzeit des Memory-Hosts | Core-Laufzeit-Hilfsfunktionen des Memory-Hosts |
  | `plugin-sdk/memory-core-host-runtime-files` | Datei-/Laufzeit-Hilfsfunktionen des Memory-Hosts | Datei-/Laufzeit-Hilfsfunktionen des Memory-Hosts |
  | `plugin-sdk/memory-host-core` | Alias der Core-Laufzeit des Memory-Hosts | Anbieterneutraler Alias für Core-Laufzeit-Hilfsfunktionen des Memory-Hosts |
  | `plugin-sdk/memory-host-events` | Alias des Event-Journals des Memory-Hosts | Anbieterneutraler Alias für Hilfsfunktionen des Event-Journals des Memory-Hosts |
  | `plugin-sdk/memory-host-files` | Alias für Datei-/Laufzeit des Memory-Hosts | Anbieterneutraler Alias für Datei-/Laufzeit-Hilfsfunktionen des Memory-Hosts |
  | `plugin-sdk/memory-host-markdown` | Hilfsfunktionen für verwaltetes Markdown | Gemeinsame Hilfsfunktionen für verwaltetes Markdown für memory-nahe Plugins |
  | `plugin-sdk/memory-host-search` | Fassade für Active Memory-Suche | Lazy Laufzeit-Fassade für den Suchmanager von Active Memory |
  | `plugin-sdk/memory-host-status` | Alias für Status des Memory-Hosts | Anbieterneutraler Alias für Status-Hilfsfunktionen des Memory-Hosts |
  | `plugin-sdk/memory-lancedb` | Gebündelte Hilfsfunktionen für memory-lancedb | Hilfsoberfläche für memory-lancedb |
  | `plugin-sdk/testing` | Test-Utilities | Test-Hilfsfunktionen und Mocks |
</Accordion>

Diese Tabelle ist absichtlich die gängige Migrations-Teilmenge und nicht die vollständige SDK-
Oberfläche. Die vollständige Liste mit über 200 Einstiegspunkten befindet sich in
`scripts/lib/plugin-sdk-entrypoints.json`.

Diese Liste enthält weiterhin einige Hilfs-Schnittstellen für gebündelte Plugins wie
`plugin-sdk/feishu`, `plugin-sdk/feishu-setup`, `plugin-sdk/zalo`,
`plugin-sdk/zalo-setup` und `plugin-sdk/matrix*`. Diese bleiben für die Wartung
gebündelter Plugins und aus Kompatibilitätsgründen exportiert, werden aber bewusst
nicht in die gängige Migrationstabelle aufgenommen und sind nicht das empfohlene Ziel für
neuen Plugin-Code.

Dieselbe Regel gilt für andere Familien gebündelter Hilfsfunktionen, zum Beispiel:

- Browser-Support-Hilfsfunktionen: `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support`
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

`plugin-sdk/github-copilot-token` stellt derzeit die schmale Token-Hilfsoberfläche
`DEFAULT_COPILOT_API_BASE_URL`,
`deriveCopilotApiBaseUrlFromToken` und `resolveCopilotApiToken` bereit.

Verwenden Sie den schmalsten Import, der zur Aufgabe passt. Wenn Sie einen Export nicht finden können,
prüfen Sie den Quellcode unter `src/plugin-sdk/` oder fragen Sie in Discord nach.

## Zeitplan für die Entfernung

| Wann | Was passiert |
| ---------------------- | ----------------------------------------------------------------------- |
| **Jetzt** | Veraltete Oberflächen geben Laufzeitwarnungen aus |
| **Nächste Hauptversion** | Veraltete Oberflächen werden entfernt; Plugins, die sie weiterhin verwenden, schlagen fehl |

Alle Core-Plugins wurden bereits migriert. Externe Plugins sollten vor der nächsten Hauptversion migrieren.

## Warnungen vorübergehend unterdrücken

Setzen Sie diese Umgebungsvariablen, während Sie an der Migration arbeiten:

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

Dies ist ein temporärer Notausgang, keine dauerhafte Lösung.

## Verwandt

- [Erste Schritte](/de/plugins/building-plugins) — Erstellen Sie Ihr erstes Plugin
- [SDK-Überblick](/de/plugins/sdk-overview) — vollständige Referenz für Unterpfad-Imports
- [Kanal-Plugins](/de/plugins/sdk-channel-plugins) — Erstellen von Kanal-Plugins
- [Provider-Plugins](/de/plugins/sdk-provider-plugins) — Erstellen von Provider-Plugins
- [Plugin-Interna](/de/plugins/architecture) — tiefer Einblick in die Architektur
- [Plugin-Manifest](/de/plugins/manifest) — Referenz des Manifest-Schemas
