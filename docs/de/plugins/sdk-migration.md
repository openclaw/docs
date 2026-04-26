---
read_when:
    - Sie sehen die Warnung `OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED`
    - Sie sehen die Warnung `OPENCLAW_EXTENSION_API_DEPRECATED`
    - Sie haben `api.registerEmbeddedExtensionFactory` vor OpenClaw 2026.4.25 verwendet.
    - Sie aktualisieren ein Plugin auf die moderne Plugin-Architektur.
    - Sie pflegen ein externes OpenClaw-Plugin.
sidebarTitle: Migrate to SDK
summary: Von der Legacy-Abwärtskompatibilitätsschicht zum modernen Plugin SDK migrieren
title: Plugin SDK-Migration
x-i18n:
    generated_at: "2026-04-26T11:35:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: ecff17f6be8bcbc310eac24bf53348ec0f7dfc06cc94de5e3a38967031737ccb
    source_path: plugins/sdk-migration.md
    workflow: 15
---

OpenClaw ist von einer breit angelegten Abwärtskompatibilitätsschicht zu einer modernen Plugin-Architektur mit gezielten, dokumentierten Imports übergegangen. Wenn Ihr Plugin vor der neuen Architektur erstellt wurde, hilft Ihnen dieser Leitfaden bei der Migration.

## Was sich ändert

Das alte Plugin-System stellte zwei weit offene Oberflächen bereit, über die Plugins alles importieren konnten, was sie von einem einzigen Einstiegspunkt aus benötigten:

- **`openclaw/plugin-sdk/compat`** — ein einzelner Import, der Dutzende von Hilfsfunktionen erneut exportierte. Er wurde eingeführt, damit ältere hook-basierte Plugins weiter funktionieren konnten, während die neue Plugin-Architektur entwickelt wurde.
- **`openclaw/extension-api`** — eine Brücke, die Plugins direkten Zugriff auf hostseitige Hilfsfunktionen wie den eingebetteten Agent-Runner gab.
- **`api.registerEmbeddedExtensionFactory(...)`** — ein entferntes, nur für Pi verfügbares Hook für gebündelte Erweiterungen, das Embedded-Runner-Ereignisse wie `tool_result` beobachten konnte.

Die breiten Import-Oberflächen sind jetzt **veraltet**. Sie funktionieren zur Laufzeit weiterhin, aber neue Plugins dürfen sie nicht verwenden, und bestehende Plugins sollten migrieren, bevor sie in der nächsten Hauptversion entfernt werden. Die API zur Registrierung von Embedded Extension Factorys nur für Pi wurde entfernt; verwenden Sie stattdessen Tool-Result-Middleware.

OpenClaw entfernt oder interpretiert dokumentiertes Plugin-Verhalten nicht in derselben Änderung neu, in der ein Ersatz eingeführt wird. Änderungen mit inkompatiblen Vertragsbrüchen müssen zunächst über einen Kompatibilitätsadapter, Diagnosen, Dokumentation und ein Veraltungsfenster laufen. Das gilt für SDK-Imports, Manifest-Felder, Setup-APIs, Hooks und das Registrierungsverhalten zur Laufzeit.

<Warning>
  Die Abwärtskompatibilitätsschicht wird in einer zukünftigen Hauptversion entfernt.
  Plugins, die weiterhin aus diesen Oberflächen importieren, werden dann nicht mehr funktionieren.
  Registrierungen von Embedded Extension Factorys nur für Pi werden bereits nicht mehr geladen.
</Warning>

## Warum sich das geändert hat

Der alte Ansatz verursachte Probleme:

- **Langsamer Start** — der Import einer Hilfsfunktion lud Dutzende nicht zusammenhängender Module
- **Zirkuläre Abhängigkeiten** — breite Re-Exports machten es leicht, Importzyklen zu erzeugen
- **Unklare API-Oberfläche** — es gab keine Möglichkeit zu erkennen, welche Exporte stabil und welche intern waren

Das moderne Plugin SDK behebt das: Jeder Importpfad (`openclaw/plugin-sdk/\<subpath\>`) ist ein kleines, in sich geschlossenes Modul mit einem klaren Zweck und dokumentiertem Vertrag.

Veraltete Convenience-Seams für Provider bei gebündelten Channels sind ebenfalls entfernt. Imports wie `openclaw/plugin-sdk/slack`, `openclaw/plugin-sdk/discord`, `openclaw/plugin-sdk/signal`, `openclaw/plugin-sdk/whatsapp`, markenspezifische Helper-Seams für Channels und `openclaw/plugin-sdk/telegram-core` waren private Shortcuts für das Monorepo, keine stabilen Plugin-Verträge. Verwenden Sie stattdessen schmale generische SDK-Subpaths. Innerhalb des Arbeitsbereichs eines gebündelten Plugins sollten Provider-eigene Hilfsfunktionen in dessen eigenem `api.ts` oder `runtime-api.ts` bleiben.

Aktuelle Beispiele für gebündelte Provider:

- Anthropic behält Claude-spezifische Stream-Hilfsfunktionen in seinem eigenen Seam `api.ts` / `contract-api.ts`
- OpenAI behält Provider-Builder, Hilfsfunktionen für Standardmodelle und Builder für Realtime-Provider in seinem eigenen `api.ts`
- OpenRouter behält Provider-Builder sowie Onboarding-/Konfigurationshilfsfunktionen in seinem eigenen `api.ts`

## Kompatibilitätsrichtlinie

Für externe Plugins erfolgt Kompatibilitätsarbeit in dieser Reihenfolge:

1. den neuen Vertrag hinzufügen
2. das alte Verhalten über einen Kompatibilitätsadapter weiter verdrahten
3. eine Diagnose oder Warnung ausgeben, die den alten Pfad und den Ersatz nennt
4. beide Pfade in Tests abdecken
5. die Veraltung und den Migrationspfad dokumentieren
6. erst nach dem angekündigten Migrationsfenster entfernen, normalerweise in einer Hauptversion

Wenn ein Manifest-Feld weiterhin akzeptiert wird, können Plugin-Autoren es weiter verwenden, bis die Dokumentation und Diagnosen etwas anderes sagen. Neuer Code sollte den dokumentierten Ersatz bevorzugen, aber bestehende Plugins sollten bei normalen Minor-Releases nicht kaputtgehen.

## So migrieren Sie

<Steps>
  <Step title="Pi-Tool-Result-Erweiterungen auf Middleware migrieren">
    Gebündelte Plugins müssen nur für Pi verfügbare
    `api.registerEmbeddedExtensionFactory(...)`-Tool-Result-Handler durch
    laufzeitneutrale Middleware ersetzen.

    ```typescript
    // Pi and Codex runtime dynamic tools
    api.registerAgentToolResultMiddleware(async (event) => {
      return compactToolResult(event);
    }, {
      runtimes: ["pi", "codex"],
    });
    ```

    Aktualisieren Sie gleichzeitig das Plugin-Manifest:

    ```json
    {
      "contracts": {
        "agentToolResultMiddleware": ["pi", "codex"]
      }
    }
    ```

    Externe Plugins können keine Tool-Result-Middleware registrieren, weil sie
    Tool-Ausgaben mit hohem Vertrauensniveau umschreiben kann, bevor das Modell sie sieht.

  </Step>

  <Step title="Approval-native Handler auf Capability-Facts migrieren">
    Channel-Plugins mit Approval-Fähigkeiten stellen natives Approval-Verhalten jetzt über
    `approvalCapability.nativeRuntime` sowie die gemeinsame Runtime-Context-Registry bereit.

    Wichtige Änderungen:

    - Ersetzen Sie `approvalCapability.handler.loadRuntime(...)` durch
      `approvalCapability.nativeRuntime`
    - Verschieben Sie approval-spezifische Authentifizierung/Zustellung von der veralteten Verdrahtung `plugin.auth` /
      `plugin.approvals` auf `approvalCapability`
    - `ChannelPlugin.approvals` wurde aus dem öffentlichen Vertrag für Channel-Plugins
      entfernt; verschieben Sie delivery-/native-/render-Felder auf `approvalCapability`
    - `plugin.auth` bleibt nur für Channel-Login-/Logout-Abläufe bestehen; Approval-Auth-
      Hooks dort werden vom Core nicht mehr gelesen
    - Registrieren Sie channel-eigene Laufzeitobjekte wie Clients, Tokens oder Bolt-
      Apps über `openclaw/plugin-sdk/channel-runtime-context`
    - Senden Sie keine plugin-eigenen Hinweise zur Umleitung aus nativen Approval-Handlern;
      der Core ist jetzt für „anderswo zugestellt“-Hinweise aus tatsächlichen Zustellergebnissen zuständig
    - Wenn Sie `channelRuntime` an `createChannelManager(...)` übergeben, stellen Sie eine
      echte Oberfläche `createPluginRuntime().channel` bereit. Teilweise Stubs werden abgelehnt.

    Die aktuelle Struktur von Approval-Capability finden Sie unter `/plugins/sdk-channel-plugins`.

  </Step>

  <Step title="Fallback-Verhalten des Windows-Wrappers prüfen">
    Wenn Ihr Plugin `openclaw/plugin-sdk/windows-spawn` verwendet, schlagen nicht aufgelöste Windows-
    Wrapper `.cmd`/`.bat` jetzt standardmäßig geschlossen fehl, sofern Sie nicht ausdrücklich `allowShellFallback: true` übergeben.

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

  <Step title="Durch gezielte Imports ersetzen">
    Jeder Export aus der alten Oberfläche wird einem spezifischen modernen Importpfad zugeordnet:

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

    Für hostseitige Hilfsfunktionen verwenden Sie die injizierte Plugin-Runtime, anstatt direkt zu importieren:

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
    | session store helpers | `api.runtime.agent.session.*` |

  </Step>

  <Step title="Build und Test">
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
  | `plugin-sdk/plugin-entry` | Kanonische Hilfsfunktion für den Plugin-Einstieg | `definePluginEntry` |
  | `plugin-sdk/core` | Veralteter Umbrella-Re-Export für Definitionen/Builder von Channel-Einstiegen | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | Export des Root-Konfigurationsschemas | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | Hilfsfunktion für Single-Provider-Einstiege | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | Fokussierte Definitionen und Builder für Channel-Einstiege | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
  | `plugin-sdk/setup` | Gemeinsame Hilfsfunktionen für den Setup-Assistenten | Allowlist-Prompts, Builder für den Setup-Status |
  | `plugin-sdk/setup-runtime` | Laufzeit-Hilfsfunktionen für das Setup | Import-sichere Setup-Patch-Adapter, Hilfsfunktionen für Lookup-Hinweise, `promptResolvedAllowFrom`, `splitSetupEntries`, delegierte Setup-Proxys |
  | `plugin-sdk/setup-adapter-runtime` | Hilfsfunktionen für Setup-Adapter | `createEnvPatchedAccountSetupAdapter` |
  | `plugin-sdk/setup-tools` | Hilfsfunktionen für Setup-Werkzeuge | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | Hilfsfunktionen für mehrere Konten | Hilfsfunktionen für Kontolisten/Konfiguration/Action-Gates |
  | `plugin-sdk/account-id` | Hilfsfunktionen für Konto-IDs | `DEFAULT_ACCOUNT_ID`, Normalisierung von Konto-IDs |
  | `plugin-sdk/account-resolution` | Hilfsfunktionen für die Kontosuche | Hilfsfunktionen für Kontosuche und Default-Fallback |
  | `plugin-sdk/account-helpers` | Schmale Hilfsfunktionen für Konten | Hilfsfunktionen für Kontolisten/Kontoaktionen |
  | `plugin-sdk/channel-setup` | Adapter für den Setup-Assistenten | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard` sowie `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | Primitive für DM-Pairing | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | Verdrahtung für Antwortpräfix und Schreibindikator | `createChannelReplyPipeline` |
  | `plugin-sdk/channel-config-helpers` | Fabriken für Konfigurationsadapter | `createHybridChannelConfigAdapter` |
  | `plugin-sdk/channel-config-schema` | Builder für Konfigurationsschemata | Gemeinsame Primitive für Channel-Konfigurationsschemata; namensspezifische Schema-Exporte für gebündelte Channels sind nur noch veraltete Kompatibilität |
  | `plugin-sdk/telegram-command-config` | Hilfsfunktionen für Telegram-Befehlskonfiguration | Normalisierung von Befehlsnamen, Kürzen von Beschreibungen, Validierung von Duplikaten/Konflikten |
  | `plugin-sdk/channel-policy` | Auflösung von Gruppen-/DM-Richtlinien | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | Hilfsfunktionen für Kontostatus und den Lebenszyklus von Draft-Streams | `createAccountStatusSink`, Hilfsfunktionen für den Abschluss von Draft-Vorschauen |
  | `plugin-sdk/inbound-envelope` | Hilfsfunktionen für Inbound-Umschläge | Gemeinsame Hilfsfunktionen für Routen und Umschlag-Builder |
  | `plugin-sdk/inbound-reply-dispatch` | Hilfsfunktionen für Inbound-Antworten | Gemeinsame Hilfsfunktionen für Aufzeichnen und Dispatch |
  | `plugin-sdk/messaging-targets` | Parsing von Messaging-Zielen | Hilfsfunktionen zum Parsen/Abgleichen von Zielen |
  | `plugin-sdk/outbound-media` | Hilfsfunktionen für ausgehende Medien | Gemeinsames Laden ausgehender Medien |
  | `plugin-sdk/outbound-send-deps` | Hilfsfunktionen für Abhängigkeiten beim ausgehenden Senden | Leichtgewichtige Suche `resolveOutboundSendDep`, ohne die vollständige Outbound-Runtime zu importieren |
  | `plugin-sdk/outbound-runtime` | Hilfsfunktionen für die Outbound-Runtime | Hilfsfunktionen für ausgehende Zustellung, Identity-/Send-Delegates, Sessions, Formatierung und Payload-Planung |
  | `plugin-sdk/thread-bindings-runtime` | Hilfsfunktionen für Thread-Bindings | Hilfsfunktionen für den Lebenszyklus von Thread-Bindings und Adapter |
  | `plugin-sdk/agent-media-payload` | Veraltete Hilfsfunktionen für Medien-Payloads | Builder für Agent-Medien-Payloads für veraltete Feldlayouts |
  | `plugin-sdk/channel-runtime` | Veralteter Kompatibilitäts-Shim | Nur veraltete Channel-Runtime-Utilities |
  | `plugin-sdk/channel-send-result` | Typen für Sendeergebnisse | Typen für Antwortergebnisse |
  | `plugin-sdk/runtime-store` | Persistenter Plugin-Speicher | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | Breite Laufzeit-Hilfsfunktionen | Hilfsfunktionen für Runtime/Logging/Backup/Plugin-Installation |
  | `plugin-sdk/runtime-env` | Schmale Hilfsfunktionen für die Runtime-Umgebung | Hilfsfunktionen für Logger/Runtime-Umgebung, Timeout, Retry und Backoff |
  | `plugin-sdk/plugin-runtime` | Gemeinsame Hilfsfunktionen für die Plugin-Runtime | Hilfsfunktionen für Plugin-Befehle/Hooks/HTTP/interaktive Abläufe |
  | `plugin-sdk/hook-runtime` | Hilfsfunktionen für Hook-Pipelines | Gemeinsame Hilfsfunktionen für Webhook-/interne Hook-Pipelines |
  | `plugin-sdk/lazy-runtime` | Hilfsfunktionen für Lazy Runtime | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | Hilfsfunktionen für Prozesse | Gemeinsame Hilfsfunktionen für `exec` |
  | `plugin-sdk/cli-runtime` | Hilfsfunktionen für die CLI-Runtime | Hilfsfunktionen für Befehlsformatierung, Wartezeiten und Versionen |
  | `plugin-sdk/gateway-runtime` | Hilfsfunktionen für Gateway | Hilfsfunktionen für Gateway-Clients und Patches für den Channel-Status |
  | `plugin-sdk/config-runtime` | Hilfsfunktionen für Konfiguration | Hilfsfunktionen zum Laden/Schreiben von Konfiguration |
  | `plugin-sdk/telegram-command-config` | Hilfsfunktionen für Telegram-Befehle | Fallback-stabile Hilfsfunktionen zur Telegram-Befehlsvalidierung, wenn die gebündelte Telegram-Vertragsoberfläche nicht verfügbar ist |
  | `plugin-sdk/approval-runtime` | Hilfsfunktionen für Approval-Prompts | Hilfsfunktionen für Payloads von Exec-/Plugin-Approvals, Approval-Capability/-Profilen, natives Approval-Routing/-Runtime sowie strukturierte Formatierung von Approval-Anzeigepfaden |
  | `plugin-sdk/approval-auth-runtime` | Hilfsfunktionen für Approval-Authentifizierung | Auflösung von Approvern, Authentifizierung für Aktionen im selben Chat |
  | `plugin-sdk/approval-client-runtime` | Hilfsfunktionen für Approval-Clients | Hilfsfunktionen für native Exec-Approval-Profile/-Filter |
  | `plugin-sdk/approval-delivery-runtime` | Hilfsfunktionen für Approval-Zustellung | Adapter für native Approval-Capability/Zustellung |
  | `plugin-sdk/approval-gateway-runtime` | Hilfsfunktionen für Approval-Gateway | Gemeinsame Hilfsfunktion zur Auflösung des Approval-Gateways |
  | `plugin-sdk/approval-handler-adapter-runtime` | Hilfsfunktionen für Approval-Adapter | Leichtgewichtige Hilfsfunktionen zum Laden nativer Approval-Adapter für schnelle Channel-Einstiegspunkte |
  | `plugin-sdk/approval-handler-runtime` | Hilfsfunktionen für Approval-Handler | Breitere Laufzeit-Hilfsfunktionen für Approval-Handler; bevorzugen Sie die schmaleren Adapter-/Gateway-Seams, wenn diese ausreichen |
  | `plugin-sdk/approval-native-runtime` | Hilfsfunktionen für Approval-Ziele | Hilfsfunktionen für native Approval-Ziele/Kontobindung |
  | `plugin-sdk/approval-reply-runtime` | Hilfsfunktionen für Approval-Antworten | Hilfsfunktionen für Antwort-Payloads von Exec-/Plugin-Approvals |
  | `plugin-sdk/channel-runtime-context` | Hilfsfunktionen für den Channel-Runtime-Context | Generische Hilfsfunktionen zum Registrieren/Abrufen/Beobachten des Channel-Runtime-Context |
  | `plugin-sdk/security-runtime` | Hilfsfunktionen für Sicherheit | Gemeinsame Hilfsfunktionen für Vertrauen, DM-Gating, externe Inhalte und Secret-Erfassung |
  | `plugin-sdk/ssrf-policy` | Hilfsfunktionen für SSRF-Richtlinien | Hilfsfunktionen für Host-Allowlists und Richtlinien für private Netzwerke |
  | `plugin-sdk/ssrf-runtime` | Hilfsfunktionen für die SSRF-Runtime | Hilfsfunktionen für Pinned Dispatcher, Guarded Fetch und SSRF-Richtlinien |
  | `plugin-sdk/collection-runtime` | Hilfsfunktionen für begrenzte Caches | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | Hilfsfunktionen für Diagnostic-Gating | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | Hilfsfunktionen für Fehlerformatierung | `formatUncaughtError`, `isApprovalNotFoundError`, Hilfsfunktionen für Fehlergraphen |
  | `plugin-sdk/fetch-runtime` | Hilfsfunktionen für umschlossenes Fetch/Proxy | `resolveFetch`, Proxy-Hilfsfunktionen |
  | `plugin-sdk/host-runtime` | Hilfsfunktionen für Host-Normalisierung | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | Hilfsfunktionen für Retry | `RetryConfig`, `retryAsync`, Policy-Runner |
  | `plugin-sdk/allow-from` | Formatierung von Allowlists | `formatAllowFromLowercase` |
  | `plugin-sdk/allowlist-resolution` | Zuordnung von Allowlist-Eingaben | `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | Befehlsgating und Hilfsfunktionen für Befehlsoberflächen | `resolveControlCommandGate`, Hilfsfunktionen für Sender-Autorisierung, Hilfsfunktionen für Befehlsregister einschließlich Formatierung dynamischer Argumentmenüs |
  | `plugin-sdk/command-status` | Renderer für Befehlsstatus/-hilfe | `buildCommandsMessage`, `buildCommandsMessagePaginated`, `buildHelpMessage` |
  | `plugin-sdk/secret-input` | Parsing geheimer Eingaben | Hilfsfunktionen für geheime Eingaben |
  | `plugin-sdk/webhook-ingress` | Hilfsfunktionen für Webhook-Anfragen | Utilities für Webhook-Ziele |
  | `plugin-sdk/webhook-request-guards` | Hilfsfunktionen für Guards von Webhook-Bodys | Hilfsfunktionen zum Lesen/Begrenzen von Request-Bodys |
  | `plugin-sdk/reply-runtime` | Gemeinsame Antwort-Runtime | Inbound-Dispatch, Heartbeat, Antwortplanung, Chunking |
  | `plugin-sdk/reply-dispatch-runtime` | Schmale Hilfsfunktionen für Antwort-Dispatch | Hilfsfunktionen für Abschluss, Provider-Dispatch und Konversationslabels |
  | `plugin-sdk/reply-history` | Hilfsfunktionen für Antwortverlauf | `buildHistoryContext`, `buildPendingHistoryContextFromMap`, `recordPendingHistoryEntry`, `clearHistoryEntriesIfEnabled` |
  | `plugin-sdk/reply-reference` | Planung von Antwortreferenzen | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | Hilfsfunktionen für Antwort-Chunks | Hilfsfunktionen für Text-/Markdown-Chunking |
  | `plugin-sdk/session-store-runtime` | Hilfsfunktionen für Session Store | Hilfsfunktionen für Store-Pfade und `updated-at` |
  | `plugin-sdk/state-paths` | Hilfsfunktionen für State-Pfade | Hilfsfunktionen für State- und OAuth-Verzeichnisse |
  | `plugin-sdk/routing` | Hilfsfunktionen für Routing/Session-Schlüssel | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId`, Hilfsfunktionen zur Normalisierung von Session-Schlüsseln |
  | `plugin-sdk/status-helpers` | Hilfsfunktionen für Channel-Status | Builder für Zusammenfassungen von Channel-/Kontostatus, Defaults für Runtime-Status, Hilfsfunktionen für Issue-Metadaten |
  | `plugin-sdk/target-resolver-runtime` | Hilfsfunktionen für Zielauflösung | Gemeinsame Hilfsfunktionen für Zielauflösung |
  | `plugin-sdk/string-normalization-runtime` | Hilfsfunktionen für String-Normalisierung | Hilfsfunktionen für Slug-/String-Normalisierung |
  | `plugin-sdk/request-url` | Hilfsfunktionen für Request-URLs | String-URLs aus Request-ähnlichen Eingaben extrahieren |
  | `plugin-sdk/run-command` | Hilfsfunktionen für zeitgesteuerte Befehle | Runner für zeitgesteuerte Befehle mit normalisiertem stdout/stderr |
  | `plugin-sdk/param-readers` | Param-Reader | Gemeinsame Param-Reader für Tools/CLI |
  | `plugin-sdk/tool-payload` | Extraktion von Tool-Payloads | Normalisierte Payloads aus Tool-Ergebnisobjekten extrahieren |
  | `plugin-sdk/tool-send` | Extraktion von Tool-Sendewerten | Kanonische Sendefeld-Ziele aus Tool-Argumenten extrahieren |
  | `plugin-sdk/temp-path` | Hilfsfunktionen für temporäre Pfade | Gemeinsame Hilfsfunktionen für temporäre Download-Pfade |
  | `plugin-sdk/logging-core` | Hilfsfunktionen für Logging | Hilfsfunktionen für Subsystem-Logger und Redaction |
  | `plugin-sdk/markdown-table-runtime` | Hilfsfunktionen für Markdown-Tabellen | Hilfsfunktionen für Modi von Markdown-Tabellen |
  | `plugin-sdk/reply-payload` | Typen für Nachrichtenantworten | Typen für Antwort-Payloads |
  | `plugin-sdk/provider-setup` | Kuratierte Hilfsfunktionen für das Setup lokaler/self-hosted Provider | Hilfsfunktionen für Discovery/Konfiguration self-hosted Provider |
  | `plugin-sdk/self-hosted-provider-setup` | Fokussierte Hilfsfunktionen für das Setup OpenAI-kompatibler self-hosted Provider | Dieselben Hilfsfunktionen für Discovery/Konfiguration self-hosted Provider |
  | `plugin-sdk/provider-auth-runtime` | Hilfsfunktionen für Provider-Runtime-Authentifizierung | Hilfsfunktionen für die Laufzeit-Auflösung von API-Schlüsseln |
  | `plugin-sdk/provider-auth-api-key` | Hilfsfunktionen für das Setup von Provider-API-Schlüsseln | Hilfsfunktionen für API-Key-Onboarding/Profilschreiben |
  | `plugin-sdk/provider-auth-result` | Hilfsfunktionen für Provider-Authentifizierungsergebnisse | Standard-Builder für OAuth-Authentifizierungsergebnisse |
  | `plugin-sdk/provider-auth-login` | Hilfsfunktionen für interaktive Provider-Anmeldung | Gemeinsame Hilfsfunktionen für interaktive Anmeldung |
  | `plugin-sdk/provider-selection-runtime` | Hilfsfunktionen für Providerauswahl | Auswahl konfigurierte-oder-automatische Provider und Zusammenführung roher Provider-Konfiguration |
  | `plugin-sdk/provider-env-vars` | Hilfsfunktionen für Provider-Umgebungsvariablen | Hilfsfunktionen zur Suche von Provider-Auth-Umgebungsvariablen |
  | `plugin-sdk/provider-model-shared` | Gemeinsame Hilfsfunktionen für Provider-Modelle/Replays | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, gemeinsame Builder für Replay-Richtlinien, Hilfsfunktionen für Provider-Endpunkte und Hilfsfunktionen zur Normalisierung von Modell-IDs |
  | `plugin-sdk/provider-catalog-shared` | Gemeinsame Hilfsfunktionen für Provider-Kataloge | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
  | `plugin-sdk/provider-onboard` | Onboarding-Patches für Provider | Hilfsfunktionen für Onboarding-Konfiguration |
  | `plugin-sdk/provider-http` | Hilfsfunktionen für Provider-HTTP | Generische Hilfsfunktionen für Provider-HTTP/Endpunkt-Capabilities, einschließlich Hilfsfunktionen für Multipart-Formulare bei Audio-Transkription |
  | `plugin-sdk/provider-web-fetch` | Hilfsfunktionen für Provider-Web-Fetch | Hilfsfunktionen für Registrierung/Cache von Web-Fetch-Providern |
  | `plugin-sdk/provider-web-search-config-contract` | Hilfsfunktionen für Provider-Websuche-Konfiguration | Schmale Hilfsfunktionen für Websuche-Konfiguration/Anmeldedaten für Provider, die keine Verdrahtung zur Plugin-Aktivierung benötigen |
  | `plugin-sdk/provider-web-search-contract` | Hilfsfunktionen für den Vertrag der Provider-Websuche | Schmale Vertrags-Hilfsfunktionen für Websuche-Konfiguration/Anmeldedaten wie `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` und bereichsspezifische Setter/Getter für Anmeldedaten |
  | `plugin-sdk/provider-web-search` | Hilfsfunktionen für Provider-Websuche | Hilfsfunktionen für Registrierung/Cache/Runtime von Websuche-Providern |
  | `plugin-sdk/provider-tools` | Hilfsfunktionen für Provider-Tool-/Schema-Kompatibilität | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, Bereinigung und Diagnosen für Gemini-Schemas sowie xAI-Kompatibilitäts-Hilfsfunktionen wie `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
  | `plugin-sdk/provider-usage` | Hilfsfunktionen für Providernutzung | `fetchClaudeUsage`, `fetchGeminiUsage`, `fetchGithubCopilotUsage` und weitere Hilfsfunktionen für Providernutzung |
  | `plugin-sdk/provider-stream` | Hilfsfunktionen für Provider-Stream-Wrapper | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, Stream-Wrapper-Typen und gemeinsame Wrapper-Hilfsfunktionen für Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
  | `plugin-sdk/provider-transport-runtime` | Hilfsfunktionen für Provider-Transport | Native Hilfsfunktionen für Provider-Transport wie Guarded Fetch, Transformationen von Transportnachrichten und beschreibbare Transport-Event-Streams |
  | `plugin-sdk/keyed-async-queue` | Geordnete asynchrone Queue | `KeyedAsyncQueue` |
  | `plugin-sdk/media-runtime` | Gemeinsame Hilfsfunktionen für Medien | Hilfsfunktionen für Medienabruf/-transformation/-speicherung sowie Builder für Medien-Payloads |
  | `plugin-sdk/media-generation-runtime` | Gemeinsame Hilfsfunktionen für Mediengenerierung | Gemeinsame Hilfsfunktionen für Failover, Kandidatenauswahl und Meldungen bei fehlenden Modellen für Bild-/Video-/Musikgenerierung |
  | `plugin-sdk/media-understanding` | Hilfsfunktionen für Medienverständnis | Provider-Typen für Medienverständnis sowie providerseitige Exporte von Hilfsfunktionen für Bild/Audio |
  | `plugin-sdk/text-runtime` | Gemeinsame Hilfsfunktionen für Text | Entfernung von für Assistenten sichtbarem Text, Hilfsfunktionen für Rendern/Chunking/Tabellen in Markdown, Hilfsfunktionen für Redaction, Directive-Tag-Hilfsfunktionen, Safe-Text-Utilities und verwandte Hilfsfunktionen für Text/Logging |
  | `plugin-sdk/text-chunking` | Hilfsfunktionen für Text-Chunking | Hilfsfunktion für Chunking ausgehenden Texts |
  | `plugin-sdk/speech` | Hilfsfunktionen für Sprache | Sprach-Provider-Typen sowie providerseitige Hilfsfunktionen für Directives, Registry und Validierung |
  | `plugin-sdk/speech-core` | Gemeinsamer Sprach-Core | Sprach-Provider-Typen, Registry, Directives, Normalisierung |
  | `plugin-sdk/realtime-transcription` | Hilfsfunktionen für Realtime-Transkription | Provider-Typen, Registry-Hilfsfunktionen und gemeinsame WebSocket-Session-Hilfsfunktion |
  | `plugin-sdk/realtime-voice` | Hilfsfunktionen für Realtime-Sprache | Provider-Typen, Hilfsfunktionen für Registry/Auflösung und Bridge-Session-Hilfsfunktionen |
  | `plugin-sdk/image-generation-core` | Gemeinsamer Bildgenerierungs-Core | Hilfsfunktionen für Bildgenerierungs-Typen, Failover, Auth und Registry |
  | `plugin-sdk/music-generation` | Hilfsfunktionen für Musikgenerierung | Provider-/Request-/Ergebnis-Typen für Musikgenerierung |
  | `plugin-sdk/music-generation-core` | Gemeinsamer Musikgenerierungs-Core | Hilfsfunktionen für Musikgenerierungs-Typen, Failover, Providersuche und Parsing von Modell-Refs |
  | `plugin-sdk/video-generation` | Hilfsfunktionen für Videogenerierung | Provider-/Request-/Ergebnis-Typen für Videogenerierung |
  | `plugin-sdk/video-generation-core` | Gemeinsamer Videogenerierungs-Core | Hilfsfunktionen für Videogenerierungs-Typen, Failover, Providersuche und Parsing von Modell-Refs |
  | `plugin-sdk/interactive-runtime` | Hilfsfunktionen für interaktive Antworten | Normalisierung/Reduzierung von Payloads interaktiver Antworten |
  | `plugin-sdk/channel-config-primitives` | Primitive für Channel-Konfiguration | Schmale Primitive für Channel-Konfigurationsschemata |
  | `plugin-sdk/channel-config-writes` | Hilfsfunktionen für Channel-Konfigurationsschreibvorgänge | Hilfsfunktionen für die Autorisierung von Channel-Konfigurationsschreibvorgängen |
  | `plugin-sdk/channel-plugin-common` | Gemeinsames Channel-Prelude | Gemeinsame Prelude-Exporte für Channel-Plugins |
  | `plugin-sdk/channel-status` | Hilfsfunktionen für Channel-Status | Gemeinsame Hilfsfunktionen für Snapshots/Zusammenfassungen des Channel-Status |
  | `plugin-sdk/allowlist-config-edit` | Hilfsfunktionen für Allowlist-Konfiguration | Hilfsfunktionen zum Bearbeiten/Lesen von Allowlist-Konfiguration |
  | `plugin-sdk/group-access` | Hilfsfunktionen für Gruppenzugriff | Gemeinsame Hilfsfunktionen für Entscheidungen zum Gruppenzugriff |
  | `plugin-sdk/direct-dm` | Hilfsfunktionen für direkte DMs | Gemeinsame Hilfsfunktionen für Authentifizierung/Guards bei direkten DMs |
  | `plugin-sdk/extension-shared` | Gemeinsame Hilfsfunktionen für Erweiterungen | Primitive Hilfsfunktionen für passive Channels/Status und Ambient Proxy |
  | `plugin-sdk/webhook-targets` | Hilfsfunktionen für Webhook-Ziele | Hilfsfunktionen für Webhook-Ziel-Registry und Routeninstallation |
  | `plugin-sdk/webhook-path` | Hilfsfunktionen für Webhook-Pfade | Hilfsfunktionen zur Normalisierung von Webhook-Pfaden |
  | `plugin-sdk/web-media` | Gemeinsame Hilfsfunktionen für Web-Medien | Hilfsfunktionen zum Laden entfernter/lokaler Medien |
  | `plugin-sdk/zod` | Zod-Re-Export | Re-exportiertes `zod` für Verbraucher des Plugin SDK |
  | `plugin-sdk/memory-core` | Gebündelte Hilfsfunktionen für memory-core | Hilfsoberfläche für Memory-Manager/Konfiguration/Dateien/CLI |
  | `plugin-sdk/memory-core-engine-runtime` | Runtime-Fassade für die Memory-Engine | Runtime-Fassade für Memory-Index/Suche |
  | `plugin-sdk/memory-core-host-engine-foundation` | Foundation-Engine für den Memory-Host | Exporte der Foundation-Engine für den Memory-Host |
  | `plugin-sdk/memory-core-host-engine-embeddings` | Embedding-Engine für den Memory-Host | Embedding-Verträge für Memory, Registry-Zugriff, lokaler Provider und generische Batch-/Remote-Hilfsfunktionen; konkrete Remote-Provider liegen in ihren jeweiligen Plugins |
  | `plugin-sdk/memory-core-host-engine-qmd` | QMD-Engine für den Memory-Host | Exporte der QMD-Engine für den Memory-Host |
  | `plugin-sdk/memory-core-host-engine-storage` | Storage-Engine für den Memory-Host | Exporte der Storage-Engine für den Memory-Host |
  | `plugin-sdk/memory-core-host-multimodal` | Multimodale Hilfsfunktionen für den Memory-Host | Multimodale Hilfsfunktionen für den Memory-Host |
  | `plugin-sdk/memory-core-host-query` | Query-Hilfsfunktionen für den Memory-Host | Query-Hilfsfunktionen für den Memory-Host |
  | `plugin-sdk/memory-core-host-secret` | Secret-Hilfsfunktionen für den Memory-Host | Secret-Hilfsfunktionen für den Memory-Host |
  | `plugin-sdk/memory-core-host-events` | Hilfsfunktionen für das Event-Journal des Memory-Hosts | Hilfsfunktionen für das Event-Journal des Memory-Hosts |
  | `plugin-sdk/memory-core-host-status` | Hilfsfunktionen für den Status des Memory-Hosts | Hilfsfunktionen für den Status des Memory-Hosts |
  | `plugin-sdk/memory-core-host-runtime-cli` | CLI-Runtime für den Memory-Host | Hilfsfunktionen für die CLI-Runtime des Memory-Hosts |
  | `plugin-sdk/memory-core-host-runtime-core` | Core-Runtime für den Memory-Host | Hilfsfunktionen für die Core-Runtime des Memory-Hosts |
  | `plugin-sdk/memory-core-host-runtime-files` | Datei-/Runtime-Hilfsfunktionen für den Memory-Host | Datei-/Runtime-Hilfsfunktionen für den Memory-Host |
  | `plugin-sdk/memory-host-core` | Core-Runtime-Alias für den Memory-Host | Herstellerneutraler Alias für Hilfsfunktionen der Core-Runtime des Memory-Hosts |
  | `plugin-sdk/memory-host-events` | Event-Journal-Alias für den Memory-Host | Herstellerneutraler Alias für Hilfsfunktionen des Event-Journals des Memory-Hosts |
  | `plugin-sdk/memory-host-files` | Datei-/Runtime-Alias für den Memory-Host | Herstellerneutraler Alias für Datei-/Runtime-Hilfsfunktionen des Memory-Hosts |
  | `plugin-sdk/memory-host-markdown` | Hilfsfunktionen für verwaltetes Markdown | Gemeinsame Hilfsfunktionen für verwaltetes Markdown für memory-nahe Plugins |
  | `plugin-sdk/memory-host-search` | Active Memory-Suchfassade | Lazy Runtime-Fassade des Suchmanagers für Active Memory |
  | `plugin-sdk/memory-host-status` | Status-Alias für den Memory-Host | Herstellerneutraler Alias für Hilfsfunktionen zum Status des Memory-Hosts |
  | `plugin-sdk/memory-lancedb` | Gebündelte Hilfsfunktionen für memory-lancedb | Hilfsoberfläche für memory-lancedb |
  | `plugin-sdk/testing` | Test-Utilities | Test-Hilfsfunktionen und Mocks |
</Accordion>

Diese Tabelle ist absichtlich nur die gängige Migrations-Teilmenge, nicht die vollständige Oberfläche des SDK. Die vollständige Liste mit mehr als 200 Einstiegspunkten befindet sich in
`scripts/lib/plugin-sdk-entrypoints.json`.

Diese Liste enthält weiterhin einige Hilfs-Seams für gebündelte Plugins wie
`plugin-sdk/feishu`, `plugin-sdk/feishu-setup`, `plugin-sdk/zalo`,
`plugin-sdk/zalo-setup` und `plugin-sdk/matrix*`. Diese bleiben für die Wartung
gebündelter Plugins und aus Kompatibilitätsgründen exportiert, werden aber
absichtlich aus der gängigen Migrationstabelle ausgelassen und sind nicht das
empfohlene Ziel für neuen Plugin-Code.

Dieselbe Regel gilt für andere Familien gebündelter Hilfsfunktionen wie:

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
  `plugin-sdk/diagnostics-otel`, `plugin-sdk/diagnostics-prometheus`,
  `plugin-sdk/diffs`, `plugin-sdk/llm-task`, `plugin-sdk/thread-ownership`,
  und `plugin-sdk/voice-call`

`plugin-sdk/github-copilot-token` stellt derzeit die schmale Oberfläche der
Token-Hilfsfunktionen `DEFAULT_COPILOT_API_BASE_URL`,
`deriveCopilotApiBaseUrlFromToken` und `resolveCopilotApiToken` bereit.

Verwenden Sie den schmalsten Import, der zur Aufgabe passt. Wenn Sie einen Export nicht finden können,
prüfen Sie den Quellcode unter `src/plugin-sdk/` oder fragen Sie in Discord.

## Aktive Veraltungen

Schmalere Veraltungen, die im gesamten Plugin SDK, im Provider-Vertrag, in der
Laufzeitoberfläche und im Manifest gelten. Jede davon funktioniert heute noch,
wird aber in einer zukünftigen Hauptversion entfernt. Der Eintrag unter jedem
Punkt ordnet die alte API ihrem kanonischen Ersatz zu.

<AccordionGroup>
  <Accordion title="command-auth-Hilfsfunktionen für Hilfe-Builder → command-status">
    **Alt (`openclaw/plugin-sdk/command-auth`)**: `buildCommandsMessage`,
    `buildCommandsMessagePaginated`, `buildHelpMessage`.

    **Neu (`openclaw/plugin-sdk/command-status`)**: dieselben Signaturen, dieselben
    Exporte — nur aus dem schmaleren Subpath importiert. `command-auth`
    re-exportiert sie als Kompatibilitäts-Stubs.

    ```typescript
    // Before
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-auth";

    // After
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-status";
    ```

  </Accordion>

  <Accordion title="Mention-Gating-Hilfsfunktionen → resolveInboundMentionDecision">
    **Alt**: `resolveInboundMentionRequirement({ facts, policy })` und
    `shouldDropInboundForMention(...)` aus
    `openclaw/plugin-sdk/channel-inbound` oder
    `openclaw/plugin-sdk/channel-mention-gating`.

    **Neu**: `resolveInboundMentionDecision({ facts, policy })` — gibt ein
    einzelnes Entscheidungsobjekt statt zwei aufgeteilten Aufrufen zurück.

    Nachgelagerte Channel-Plugins (Slack, Discord, Matrix, Microsoft Teams) wurden bereits
    umgestellt.

  </Accordion>

  <Accordion title="Channel-Runtime-Shim und Hilfsfunktionen für Channel-Aktionen">
    `openclaw/plugin-sdk/channel-runtime` ist ein Kompatibilitäts-Shim für ältere
    Channel-Plugins. Importieren Sie ihn nicht in neuem Code; verwenden Sie
    `openclaw/plugin-sdk/channel-runtime-context` zum Registrieren von Laufzeitobjekten.

    `channelActions*`-Hilfsfunktionen in `openclaw/plugin-sdk/channel-actions` sind
    zusammen mit rohen „actions“-Channel-Exporten veraltet. Stellen Sie Capabilities
    stattdessen über die semantische Oberfläche `presentation` bereit — Channel-Plugins
    deklarieren, was sie rendern (Karten, Buttons, Auswahlen), statt welche rohen
    Aktionsnamen sie akzeptieren.

  </Accordion>

  <Accordion title="tool()-Hilfsfunktion für Websuche-Provider → createTool() im Plugin">
    **Alt**: Factory `tool()` aus `openclaw/plugin-sdk/provider-web-search`.

    **Neu**: Implementieren Sie `createTool(...)` direkt im Provider-Plugin.
    OpenClaw benötigt die SDK-Hilfsfunktion nicht mehr, um den Tool-Wrapper zu registrieren.

  </Accordion>

  <Accordion title="Klartext-Channel-Umschläge → BodyForAgent">
    **Alt**: `formatInboundEnvelope(...)` (und
    `ChannelMessageForAgent.channelEnvelope`), um aus eingehenden Channel-Nachrichten
    einen flachen Klartext-Prompt-Umschlag zu erstellen.

    **Neu**: `BodyForAgent` plus strukturierte User-Context-Blöcke. Channel-Plugins
    hängen Routing-Metadaten (Thread, Topic, Reply-to, Reaktionen) als typisierte Felder
    an, statt sie zu einer Prompt-Zeichenfolge zusammenzuketten. Die
    Hilfsfunktion `formatAgentEnvelope(...)` wird für synthetisierte, für den Assistenten
    sichtbare Umschläge weiterhin unterstützt, aber eingehende Klartext-Umschläge werden
    schrittweise entfernt.

    Betroffene Bereiche: `inbound_claim`, `message_received` und jedes benutzerdefinierte
    Channel-Plugin, das Text aus `channelEnvelope` nachverarbeitet hat.

  </Accordion>

  <Accordion title="Typen für Provider Discovery → Typen für Provider-Katalog">
    Vier Typaliasse für Discovery sind jetzt schmale Wrapper über die Typen aus der
    Katalog-Ära:

    | Alter Alias                | Neuer Typ                 |
    | ------------------------- | ------------------------- |
    | `ProviderDiscoveryOrder`  | `ProviderCatalogOrder`    |
    | `ProviderDiscoveryContext`| `ProviderCatalogContext`  |
    | `ProviderDiscoveryResult` | `ProviderCatalogResult`   |
    | `ProviderPluginDiscovery` | `ProviderPluginCatalog`   |

    Zusätzlich die veraltete statische Bag `ProviderCapabilities` — Provider-Plugins
    sollten Capability-Facts über den Provider-Runtime-Vertrag anhängen
    statt über ein statisches Objekt.

  </Accordion>

  <Accordion title="Thinking-Policy-Hooks → resolveThinkingProfile">
    **Alt** (drei separate Hooks in `ProviderThinkingPolicy`):
    `isBinaryThinking(ctx)`, `supportsXHighThinking(ctx)` und
    `resolveDefaultThinkingLevel(ctx)`.

    **Neu**: ein einzelnes `resolveThinkingProfile(ctx)`, das ein
    `ProviderThinkingProfile` mit der kanonischen `id`, optionalem `label` und
    einer sortierten Liste von Levels zurückgibt. OpenClaw stuft veraltete gespeicherte Werte
    anhand des Profilrangs automatisch herunter.

    Implementieren Sie einen Hook statt drei. Die veralteten Hooks funktionieren während
    des Veraltungsfensters weiterhin, werden aber nicht mit dem Profilergebnis kombiniert.

  </Accordion>

  <Accordion title="Fallback für externen OAuth-Provider → contracts.externalAuthProviders">
    **Alt**: Implementierung von `resolveExternalOAuthProfiles(...)`, ohne
    den Provider im Plugin-Manifest zu deklarieren.

    **Neu**: Deklarieren Sie `contracts.externalAuthProviders` im Plugin-Manifest
    **und** implementieren Sie `resolveExternalAuthProfiles(...)`. Der alte „Auth-
    Fallback“-Pfad gibt zur Laufzeit eine Warnung aus und wird entfernt.

    ```json
    {
      "contracts": {
        "externalAuthProviders": ["anthropic", "openai"]
      }
    }
    ```

  </Accordion>

  <Accordion title="Suche nach Provider-Umgebungsvariablen → setup.providers[].envVars">
    **Altes** Manifest-Feld: `providerAuthEnvVars: { anthropic: ["ANTHROPIC_API_KEY"] }`.

    **Neu**: Spiegeln Sie dieselbe Suche nach Umgebungsvariablen in `setup.providers[].envVars`
    im Manifest wider. Dadurch werden Setup-/Status-Metadaten für Umgebungsvariablen an einer
    Stelle zusammengeführt, und es muss nicht die Plugin-Runtime gestartet werden,
    nur um Suchen nach Umgebungsvariablen zu beantworten.

    `providerAuthEnvVars` bleibt über einen Kompatibilitätsadapter unterstützt,
    bis das Veraltungsfenster geschlossen wird.

  </Accordion>

  <Accordion title="Registrierung von Memory-Plugins → registerMemoryCapability">
    **Alt**: drei separate Aufrufe —
    `api.registerMemoryPromptSection(...)`,
    `api.registerMemoryFlushPlan(...)`,
    `api.registerMemoryRuntime(...)`.

    **Neu**: ein Aufruf in der Memory-State-API —
    `registerMemoryCapability(pluginId, { promptBuilder, flushPlanResolver, runtime })`.

    Dieselben Slots, ein einzelner Registrierungsaufruf. Additive Memory-Hilfsfunktionen
    (`registerMemoryPromptSupplement`, `registerMemoryCorpusSupplement`,
    `registerMemoryEmbeddingProvider`) sind davon nicht betroffen.

  </Accordion>

  <Accordion title="Typen für Subagent-Session-Nachrichten umbenannt">
    Zwei veraltete Typaliasse werden weiterhin aus `src/plugins/runtime/types.ts` exportiert:

    | Alt                           | Neu                             |
    | ----------------------------- | ------------------------------- |
    | `SubagentReadSessionParams`   | `SubagentGetSessionMessagesParams` |
    | `SubagentReadSessionResult`   | `SubagentGetSessionMessagesResult` |

    Die Laufzeitmethode `readSession` ist zugunsten von
    `getSessionMessages` veraltet. Dieselbe Signatur; die alte Methode ruft die
    neue auf.

  </Accordion>

  <Accordion title="runtime.tasks.flow → runtime.tasks.flows">
    **Alt**: `runtime.tasks.flow` (Singular) gab einen Live-TaskFlow-Accessor zurück.

    **Neu**: `runtime.tasks.flows` (Plural) gibt DTO-basierten TaskFlow-Zugriff zurück,
    der import-sicher ist und nicht erfordert, dass die vollständige Task-Runtime geladen wird.

    ```typescript
    // Before
    const flow = api.runtime.tasks.flow(ctx);
    // After
    const flows = api.runtime.tasks.flows(ctx);
    ```

  </Accordion>

  <Accordion title="Embedded Extension Factorys → Agent-Tool-Result-Middleware">
    Behandelt in „So migrieren Sie → Pi-Tool-Result-Erweiterungen auf
    Middleware migrieren“ oben. Der Vollständigkeit halber hier enthalten: Der entfernte,
    nur für Pi verfügbare Pfad `api.registerEmbeddedExtensionFactory(...)` wird ersetzt durch
    `api.registerAgentToolResultMiddleware(...)` mit einer expliziten Laufzeitliste
    in `contracts.agentToolResultMiddleware`.
  </Accordion>

  <Accordion title="Alias OpenClawSchemaType → OpenClawConfig">
    `OpenClawSchemaType`, re-exportiert aus `openclaw/plugin-sdk`, ist jetzt ein
    einzeiliger Alias für `OpenClawConfig`. Bevorzugen Sie den kanonischen Namen.

    ```typescript
    // Before
    import type { OpenClawSchemaType } from "openclaw/plugin-sdk";
    // After
    import type { OpenClawConfig } from "openclaw/plugin-sdk/config-schema";
    ```

  </Accordion>
</AccordionGroup>

<Note>
Veraltungen auf Erweiterungsebene (innerhalb gebündelter Channel-/Provider-Plugins unter
`extensions/`) werden in ihren eigenen Barrels `api.ts` und `runtime-api.ts`
nachverfolgt. Sie betreffen keine Plugin-Verträge von Drittanbietern und werden hier
nicht aufgeführt. Wenn Sie direkt ein lokales Barrel eines gebündelten Plugins nutzen,
lesen Sie vor dem Upgrade die Veraltungskommentare in diesem Barrel.
</Note>

## Zeitplan für die Entfernung

| Wann                   | Was passiert                                                            |
| ---------------------- | ----------------------------------------------------------------------- |
| **Jetzt**              | Veraltete Oberflächen geben Laufzeitwarnungen aus                       |
| **Nächste Hauptversion** | Veraltete Oberflächen werden entfernt; Plugins, die sie weiter verwenden, schlagen fehl |

Alle Core-Plugins wurden bereits migriert. Externe Plugins sollten vor der
nächsten Hauptversion migrieren.

## Warnungen vorübergehend unterdrücken

Setzen Sie diese Umgebungsvariablen, während Sie an der Migration arbeiten:

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

Dies ist ein vorübergehender Notausgang, keine dauerhafte Lösung.

## Verwandt

- [Erste Schritte](/de/plugins/building-plugins) — Erstellen Sie Ihr erstes Plugin
- [SDK-Überblick](/de/plugins/sdk-overview) — vollständige Referenz für Subpath-Imports
- [Channel-Plugins](/de/plugins/sdk-channel-plugins) — Channel-Plugins erstellen
- [Provider-Plugins](/de/plugins/sdk-provider-plugins) — Provider-Plugins erstellen
- [Plugin-Interna](/de/plugins/architecture) — tiefer Einblick in die Architektur
- [Plugin-Manifest](/de/plugins/manifest) — Referenz für das Manifest-Schema
