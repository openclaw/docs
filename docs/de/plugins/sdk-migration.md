---
read_when:
    - Sie sehen die Warnung `OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED`.
    - Sie sehen die Warnung `OPENCLAW_EXTENSION_API_DEPRECATED`.
    - Sie haben `api.registerEmbeddedExtensionFactory` vor OpenClaw 2026.4.25 verwendet.
    - Sie aktualisieren ein Plugin auf die moderne Plugin-Architektur.
    - Sie pflegen ein externes OpenClaw-Plugin.
sidebarTitle: Migrate to SDK
summary: Von der Legacy-Kompatibilitätsschicht auf das moderne Plugin-SDK migrieren
title: Migration des Plugin-SDK
x-i18n:
    generated_at: "2026-04-25T13:52:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: e3a1410d9353156b4597d16a42a931f83189680f89c320a906aa8d2c8196792f
    source_path: plugins/sdk-migration.md
    workflow: 15
---

OpenClaw ist von einer breiten Legacy-Kompatibilitätsschicht zu einer modernen Plugin-
Architektur mit fokussierten, dokumentierten Imports übergegangen. Wenn Ihr Plugin vor
der neuen Architektur erstellt wurde, hilft Ihnen diese Anleitung bei der Migration.

## Was sich ändert

Das alte Plugin-System stellte zwei weit offene Oberflächen bereit, über die Plugins
alles, was sie benötigten, von einem einzigen Einstiegspunkt importieren konnten:

- **`openclaw/plugin-sdk/compat`** — ein einzelner Import, der Dutzende von
  Helpern erneut exportierte. Er wurde eingeführt, um ältere hook-basierte Plugins funktionsfähig zu halten, während die
  neue Plugin-Architektur aufgebaut wurde.
- **`openclaw/extension-api`** — eine Brücke, die Plugins direkten Zugriff auf
  hostseitige Helper wie den eingebetteten Agent-Runner gab.
- **`api.registerEmbeddedExtensionFactory(...)`** — ein entfernter Pi-only-Bundle-
  Extension-Hook, der eingebettete Runner-Ereignisse wie
  `tool_result` beobachten konnte.

Die breiten Import-Oberflächen sind jetzt **veraltet**. Sie funktionieren zur Laufzeit noch,
aber neue Plugins dürfen sie nicht mehr verwenden, und bestehende Plugins sollten migrieren, bevor das nächste Major-Release sie entfernt. Die Pi-only-API zur Registrierung
der Embedded Extension Factory wurde entfernt; verwenden Sie stattdessen Tool-Result-Middleware.

OpenClaw entfernt oder interpretiert dokumentiertes Plugin-Verhalten nicht neu in derselben
Änderung, die einen Ersatz einführt. Änderungen, die den Vertrag brechen, müssen zuerst
über einen Kompatibilitäts-Adapter, Diagnosen, Dokumentation und ein Deprecation-Fenster laufen.
Das gilt für SDK-Imports, Manifest-Felder, Setup-APIs, Hooks und Runtime-
Registrierungsverhalten.

<Warning>
  Die Legacy-Kompatibilitätsschicht wird in einem zukünftigen Major-Release entfernt.
  Plugins, die weiterhin von diesen Oberflächen importieren, werden dann kaputtgehen.
  Pi-only-Registrierungen der Embedded Extension Factory werden bereits nicht mehr geladen.
</Warning>

## Warum sich das geändert hat

Der alte Ansatz verursachte Probleme:

- **Langsamer Start** — der Import eines einzelnen Helpers lud Dutzende nicht zusammenhängende Module
- **Zirkuläre Abhängigkeiten** — breite Re-Exports machten es leicht, Importzyklen zu erzeugen
- **Unklare API-Oberfläche** — es gab keine Möglichkeit zu erkennen, welche Exporte stabil bzw. intern waren

Das moderne Plugin-SDK behebt dies: Jeder Importpfad (`openclaw/plugin-sdk/\<subpath\>`)
ist ein kleines, eigenständiges Modul mit einem klaren Zweck und dokumentiertem Vertrag.

Alte Provider-Convenience-Seams für gebündelte Kanäle sind ebenfalls verschwunden. Imports
wie `openclaw/plugin-sdk/slack`, `openclaw/plugin-sdk/discord`,
`openclaw/plugin-sdk/signal`, `openclaw/plugin-sdk/whatsapp`,
kanalbezogene Helper-Seams und
`openclaw/plugin-sdk/telegram-core` waren private Mono-Repo-Abkürzungen, keine
stabilen Plugin-Verträge. Verwenden Sie stattdessen schmale generische SDK-Subpfade. Innerhalb des
gebündelten Plugin-Workspaces sollten provider-eigene Helper im eigenen
`api.ts` oder `runtime-api.ts` des Plugins verbleiben.

Aktuelle gebündelte Provider-Beispiele:

- Anthropic behält Claude-spezifische Stream-Helper in seinem eigenen `api.ts` /
  `contract-api.ts`-Seam
- OpenAI behält Provider-Builder, Helper für Standardmodelle und Realtime-Provider-
  Builder in seinem eigenen `api.ts`
- OpenRouter behält Provider-Builder sowie Onboarding-/Konfigurations-Helper in seinem eigenen
  `api.ts`

## Kompatibilitätsrichtlinie

Für externe Plugins folgt Kompatibilitätsarbeit dieser Reihenfolge:

1. neuen Vertrag hinzufügen
2. altes Verhalten über einen Kompatibilitäts-Adapter verdrahtet lassen
3. eine Diagnose oder Warnung ausgeben, die alten Pfad und Ersatz nennt
4. beide Pfade in Tests abdecken
5. die Deprecation und den Migrationspfad dokumentieren
6. erst nach dem angekündigten Migrationsfenster entfernen, in der Regel in einem Major-Release

Wenn ein Manifest-Feld noch akzeptiert wird, können Plugin-Autoren es weiter verwenden, bis
Dokumentation und Diagnosen etwas anderes sagen. Neuer Code sollte den dokumentierten
Ersatz bevorzugen, aber bestehende Plugins sollten in normalen Minor-Releases nicht kaputtgehen.

## So migrieren Sie

<Steps>
  <Step title="Pi-Tool-Result-Erweiterungen auf Middleware migrieren">
    Gebündelte Plugins müssen Pi-only-
    Tool-Result-Handler mit `api.registerEmbeddedExtensionFactory(...)` durch
    runtime-neutrale Middleware ersetzen.

    ```typescript
    // Dynamische Tools für Pi- und Codex-Laufzeit
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
    hochvertrauenswürdige Tool-Ausgaben umschreiben könnte, bevor das Modell sie sieht.

  </Step>

  <Step title="Approval-native Handler auf Capability Facts migrieren">
    Approval-fähige Kanal-Plugins stellen natives Approval-Verhalten jetzt über
    `approvalCapability.nativeRuntime` sowie die gemeinsame Runtime-Context-Registry bereit.

    Wichtige Änderungen:

    - Ersetzen Sie `approvalCapability.handler.loadRuntime(...)` durch
      `approvalCapability.nativeRuntime`
    - Verschieben Sie approval-spezifische Auth/Delivery weg von alter Verdrahtung über `plugin.auth` /
      `plugin.approvals` hin zu `approvalCapability`
    - `ChannelPlugin.approvals` wurde aus dem öffentlichen Vertrag für Kanal-Plugins
      entfernt; verschieben Sie Delivery-/native-/render-Felder nach `approvalCapability`
    - `plugin.auth` bleibt nur für Login-/Logout-Abläufe von Kanälen; Approval-
      Auth-Hooks dort werden vom Core nicht mehr gelesen
    - Registrieren Sie kanal-eigene Runtime-Objekte wie Clients, Tokens oder Bolt-
      Apps über `openclaw/plugin-sdk/channel-runtime-context`
    - Senden Sie keine plugin-eigenen Reroute-Hinweise aus nativen Approval-Handlern;
      der Core besitzt jetzt Routed-Elsewhere-Hinweise aus tatsächlichen Delivery-Ergebnissen
    - Wenn Sie `channelRuntime` in `createChannelManager(...)` übergeben, stellen Sie eine
      echte Oberfläche `createPluginRuntime().channel` bereit. Partielle Stubs werden abgelehnt.

    Siehe `/plugins/sdk-channel-plugins` für das aktuelle Layout der
    Approval-Fähigkeit.

  </Step>

  <Step title="Fallback-Verhalten von Windows-Wrappern prüfen">
    Wenn Ihr Plugin `openclaw/plugin-sdk/windows-spawn` verwendet,
    schlagen nicht aufgelöste Windows-Wrapper `.cmd`/`.bat` jetzt fail-closed fehl, sofern Sie nicht explizit `allowShellFallback: true` übergeben.

    ```typescript
    // Vorher
    const program = applyWindowsSpawnProgramPolicy({ candidate });

    // Nachher
    const program = applyWindowsSpawnProgramPolicy({
      candidate,
      // Dies nur für vertrauenswürdige Kompatibilitäts-Aufrufer setzen, die
      // absichtlich shell-vermittelten Fallback akzeptieren.
      allowShellFallback: true,
    });
    ```

    Wenn Ihr Aufrufer absichtlich nicht auf Shell-Fallback angewiesen ist, setzen Sie
    `allowShellFallback` nicht und behandeln Sie stattdessen den ausgelösten Fehler.

  </Step>

  <Step title="Veraltete Imports finden">
    Durchsuchen Sie Ihr Plugin nach Imports von einer der beiden veralteten Oberflächen:

    ```bash
    grep -r "plugin-sdk/compat" my-plugin/
    grep -r "openclaw/extension-api" my-plugin/
    ```

  </Step>

  <Step title="Durch fokussierte Imports ersetzen">
    Jeder Export der alten Oberfläche wird einem bestimmten modernen Importpfad zugeordnet:

    ```typescript
    // Vorher (veraltete Legacy-Kompatibilitätsschicht)
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

    Verwenden Sie für hostseitige Helper die injizierte Plugin-Runtime, statt direkt
    zu importieren:

    ```typescript
    // Vorher (veraltete extension-api-Brücke)
    import { runEmbeddedPiAgent } from "openclaw/extension-api";
    const result = await runEmbeddedPiAgent({ sessionId, prompt });

    // Nachher (injizierte Runtime)
    const result = await api.runtime.agent.runEmbeddedPiAgent({ sessionId, prompt });
    ```

    Dasselbe Muster gilt für andere alte Bridge-Helper:

    | Alter Import | Modernes Äquivalent |
    | --- | --- |
    | `resolveAgentDir` | `api.runtime.agent.resolveAgentDir` |
    | `resolveAgentWorkspaceDir` | `api.runtime.agent.resolveAgentWorkspaceDir` |
    | `resolveAgentIdentity` | `api.runtime.agent.resolveAgentIdentity` |
    | `resolveThinkingDefault` | `api.runtime.agent.resolveThinkingDefault` |
    | `resolveAgentTimeoutMs` | `api.runtime.agent.resolveAgentTimeoutMs` |
    | `ensureAgentWorkspace` | `api.runtime.agent.ensureAgentWorkspace` |
    | Helper für Session Store | `api.runtime.agent.session.*` |

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
  | `plugin-sdk/plugin-entry` | Kanonischer Helper für Plugin-Einstiegspunkte | `definePluginEntry` |
  | `plugin-sdk/core` | Altes Umbrella-Re-Export für Definitionen/Builder von Kanaleinstiegspunkten | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | Export des Root-Konfigurationsschemas | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | Einstiegspunkt-Helper für einzelne Provider | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | Fokussierte Definitionen und Builder für Kanaleinstiegspunkte | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
  | `plugin-sdk/setup` | Gemeinsame Helper für Setup-Assistenten | Allowlist-Prompts, Builder für Setup-Status |
  | `plugin-sdk/setup-runtime` | Runtime-Helper zur Setup-Zeit | Importsichere Adapter für Setup-Patches, Lookup-Note-Helper, `promptResolvedAllowFrom`, `splitSetupEntries`, delegierte Setup-Proxys |
  | `plugin-sdk/setup-adapter-runtime` | Setup-Adapter-Helper | `createEnvPatchedAccountSetupAdapter` |
  | `plugin-sdk/setup-tools` | Helper für Setup-Tooling | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | Helper für mehrere Konten | Helper für Kontoliste/Konfiguration/Aktions-Gates |
  | `plugin-sdk/account-id` | Account-ID-Helper | `DEFAULT_ACCOUNT_ID`, Normalisierung von Account-IDs |
  | `plugin-sdk/account-resolution` | Helper für Konto-Lookup | Helper für Konto-Lookup + Default-Fallback |
  | `plugin-sdk/account-helpers` | Schmale Konto-Helper | Helper für Kontoliste/Kontoaktionen |
  | `plugin-sdk/channel-setup` | Adapter für Setup-Assistenten | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, plus `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | Primitive für DM-Pairing | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | Verdrahtung von Antwortpräfix + Tippanzeige | `createChannelReplyPipeline` |
  | `plugin-sdk/channel-config-helpers` | Fabriken für Konfigurationsadapter | `createHybridChannelConfigAdapter` |
  | `plugin-sdk/channel-config-schema` | Builder für Konfigurationsschemata | Gemeinsame Primitiven für Kanalkonfigurationsschemata; schema-spezifische Exporte für gebündelte Kanäle sind nur alte Kompatibilität |
  | `plugin-sdk/telegram-command-config` | Helper für Telegram-Befehlskonfiguration | Normalisierung von Befehlsnamen, Kürzen von Beschreibungen, Validierung von Duplikaten/Konflikten |
  | `plugin-sdk/channel-policy` | Auflösung von Gruppen-/DM-Richtlinien | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | Helper für Kontostatus und Draft-Stream-Lifecycle | `createAccountStatusSink`, Helper zur Finalisierung von Draft-Previews |
  | `plugin-sdk/inbound-envelope` | Helper für Inbound-Umschläge | Gemeinsame Helper zum Bauen von Route + Umschlag |
  | `plugin-sdk/inbound-reply-dispatch` | Helper für eingehende Antworten | Gemeinsame Helper für Record-and-Dispatch |
  | `plugin-sdk/messaging-targets` | Parsen von Messaging-Zielen | Helper zum Parsen/Abgleichen von Zielen |
  | `plugin-sdk/outbound-media` | Helper für ausgehende Medien | Gemeinsames Laden ausgehender Medien |
  | `plugin-sdk/outbound-runtime` | Helper für Outbound-Runtime | Helper für Outbound-Delivery, Identity-/Send-Delegation, Sitzung, Formatierung und Payload-Planung |
  | `plugin-sdk/thread-bindings-runtime` | Helper für Thread-Bindings | Helper für Lifecycle und Adapter von Thread-Bindings |
  | `plugin-sdk/agent-media-payload` | Alte Helper für Medien-Payloads | Builder für Agenten-Medien-Payloads bei alten Feldlayouts |
  | `plugin-sdk/channel-runtime` | Veralteter Kompatibilitäts-Shim | Nur alte Utilities für Channel-Runtime |
  | `plugin-sdk/channel-send-result` | Typen für Sendeergebnisse | Antwort-Ergebnistypen |
  | `plugin-sdk/runtime-store` | Persistenter Plugin-Speicher | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | Breite Runtime-Helper | Helper für Runtime/Logging/Backup/Plugin-Installation |
  | `plugin-sdk/runtime-env` | Schmale Runtime-Env-Helper | Logger-/Runtime-Env-, Timeout-, Retry- und Backoff-Helper |
  | `plugin-sdk/plugin-runtime` | Gemeinsame Plugin-Runtime-Helper | Helper für Plugin-Befehle/Hooks/HTTP/Interaktivität |
  | `plugin-sdk/hook-runtime` | Helper für Hook-Pipelines | Gemeinsame Helper für Webhook-/interne Hook-Pipelines |
  | `plugin-sdk/lazy-runtime` | Helper für Lazy-Runtime | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | Prozess-Helper | Gemeinsame Exec-Helper |
  | `plugin-sdk/cli-runtime` | Helper für CLI-Runtime | Formatierung von Befehlen, Waits, Versions-Helper |
  | `plugin-sdk/gateway-runtime` | Gateway-Helper | Gateway-Client und Helper für Patches des Kanalstatus |
  | `plugin-sdk/config-runtime` | Konfigurations-Helper | Helper zum Laden/Schreiben der Konfiguration |
  | `plugin-sdk/telegram-command-config` | Telegram-Befehls-Helper | Fallback-stabile Telegram-Befehlsvalidierungs-Helper, wenn die gebündelte Telegram-Vertragsoberfläche nicht verfügbar ist |
  | `plugin-sdk/approval-runtime` | Helper für Approval-Prompts | Payload für Exec-/Plugin-Approvals, Helper für Approval-Fähigkeiten/Profile, native Approval-Routing-/Runtime-Helper und strukturierte Pfadformatierung für Approval-Anzeigen |
  | `plugin-sdk/approval-auth-runtime` | Helper für Approval-Auth | Auflösung von Genehmigern, Auth für Aktionen im selben Chat |
  | `plugin-sdk/approval-client-runtime` | Helper für Approval-Clients | Helper für native Exec-Approval-Profile/Filter |
  | `plugin-sdk/approval-delivery-runtime` | Helper für Approval-Delivery | Adapter für native Approval-Fähigkeiten/Delivery |
  | `plugin-sdk/approval-gateway-runtime` | Helper für Approval-Gateway | Gemeinsamer Helper zur Auflösung des Approval-Gateways |
  | `plugin-sdk/approval-handler-adapter-runtime` | Helper für Approval-Adapter | Leichtgewichtige Lade-Helper für native Approval-Adapter bei Hot-Channel-Einstiegspunkten |
  | `plugin-sdk/approval-handler-runtime` | Helper für Approval-Handler | Breitere Runtime-Helper für Approval-Handler; bevorzugen Sie die schmaleren Adapter-/Gateway-Seams, wenn diese ausreichen |
  | `plugin-sdk/approval-native-runtime` | Helper für Approval-Ziele | Helper für native Approval-Ziel-/Kontobindungen |
  | `plugin-sdk/approval-reply-runtime` | Helper für Approval-Antworten | Helper für Antwort-Payloads bei Exec-/Plugin-Approvals |
  | `plugin-sdk/channel-runtime-context` | Helper für Channel-Runtime-Context | Generische Helper zum Registrieren/Abrufen/Überwachen von Channel-Runtime-Context |
  | `plugin-sdk/security-runtime` | Sicherheits-Helper | Gemeinsame Helper für Trust, DM-Gating, externe Inhalte und Secret-Erfassung |
  | `plugin-sdk/ssrf-policy` | SSRF-Richtlinien-Helper | Helper für Host-Allowlist und Richtlinien für private Netzwerke |
  | `plugin-sdk/ssrf-runtime` | SSRF-Runtime-Helper | Helper für Pinned-Dispatcher, Guarded Fetch und SSRF-Richtlinien |
  | `plugin-sdk/collection-runtime` | Helper für begrenzte Caches | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | Helper für Diagnostic-Gating | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | Helper für Fehlerformatierung | `formatUncaughtError`, `isApprovalNotFoundError`, Helper für Fehlergraphen |
  | `plugin-sdk/fetch-runtime` | Helper für Wrapped Fetch/Proxy | `resolveFetch`, Proxy-Helper |
  | `plugin-sdk/host-runtime` | Helper für Host-Normalisierung | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | Retry-Helper | `RetryConfig`, `retryAsync`, Policy-Runner |
  | `plugin-sdk/allow-from` | Formatierung von Allowlists | `formatAllowFromLowercase` |
  | `plugin-sdk/allowlist-resolution` | Mapping von Allowlist-Eingaben | `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | Befehls-Gating und Helper für Befehlsoberflächen | `resolveControlCommandGate`, Helper zur Sender-Autorisierung, Helper für Befehls-Registry einschließlich dynamischer Menüformatierung für Argumente |
  | `plugin-sdk/command-status` | Renderer für Befehlsstatus/-hilfe | `buildCommandsMessage`, `buildCommandsMessagePaginated`, `buildHelpMessage` |
  | `plugin-sdk/secret-input` | Parsen von Secret-Eingaben | Helper für Secret-Eingaben |
  | `plugin-sdk/webhook-ingress` | Helper für Webhook-Anfragen | Utilities für Webhook-Ziele |
  | `plugin-sdk/webhook-request-guards` | Helper für Guards von Webhook-Bodys | Helper zum Lesen/Begrenzen von Request-Bodys |
  | `plugin-sdk/reply-runtime` | Gemeinsame Antwort-Runtime | Inbound-Dispatch, Heartbeat, Reply-Planner, Chunking |
  | `plugin-sdk/reply-dispatch-runtime` | Schmale Helper für Reply-Dispatch | Finalisierung, Provider-Dispatch und Helper für Gesprächsbezeichnungen |
  | `plugin-sdk/reply-history` | Helper für Antwortverlauf | `buildHistoryContext`, `buildPendingHistoryContextFromMap`, `recordPendingHistoryEntry`, `clearHistoryEntriesIfEnabled` |
  | `plugin-sdk/reply-reference` | Planung von Antwortreferenzen | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | Helper für Antwort-Chunks | Helper für Text-/Markdown-Chunking |
  | `plugin-sdk/session-store-runtime` | Helper für Session Store | Helper für Store-Pfad + updated-at |
  | `plugin-sdk/state-paths` | Helper für Statuspfade | Helper für Status- und OAuth-Verzeichnisse |
  | `plugin-sdk/routing` | Helper für Routing/Sitzungsschlüssel | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId`, Helper zur Normalisierung von Sitzungsschlüsseln |
  | `plugin-sdk/status-helpers` | Helper für Kanalstatus | Builder für Zusammenfassungen des Kanal-/Kontostatus, Standards für Runtime-Status, Helper für Issue-Metadaten |
  | `plugin-sdk/target-resolver-runtime` | Helper für Target Resolver | Gemeinsame Helper für Target Resolver |
  | `plugin-sdk/string-normalization-runtime` | Helper für String-Normalisierung | Helper zur Slug-/String-Normalisierung |
  | `plugin-sdk/request-url` | Helper für Request-URLs | String-URLs aus request-ähnlichen Eingaben extrahieren |
  | `plugin-sdk/run-command` | Helper für zeitgesteuerte Befehle | Runner für zeitgesteuerte Befehle mit normalisiertem stdout/stderr |
  | `plugin-sdk/param-readers` | Param-Reader | Gemeinsame Param-Reader für Tools/CLI |
  | `plugin-sdk/tool-payload` | Extraktion von Tool-Payloads | Normalisierte Payloads aus Objekten mit Tool-Ergebnissen extrahieren |
  | `plugin-sdk/tool-send` | Extraktion von Tool-Sendefeldern | Kanonische Send-Zielfelder aus Tool-Args extrahieren |
  | `plugin-sdk/temp-path` | Helper für temporäre Pfade | Gemeinsame Helper für temporäre Download-Pfade |
  | `plugin-sdk/logging-core` | Logging-Helper | Helper für Subsystem-Logger und Redaction |
  | `plugin-sdk/markdown-table-runtime` | Helper für Markdown-Tabellen | Helper für Modi von Markdown-Tabellen |
  | `plugin-sdk/reply-payload` | Typen für Message-Reply | Typen für Antwort-Payloads |
  | `plugin-sdk/provider-setup` | Kuratierte lokale/self-hosted Helper für Provider-Setup | Helper für Discovery/Konfiguration von self-hosted Providern |
  | `plugin-sdk/self-hosted-provider-setup` | Fokussierte Helper für OpenAI-kompatibles self-hosted Provider-Setup | Dieselben Helper für Discovery/Konfiguration von self-hosted Providern |
  | `plugin-sdk/provider-auth-runtime` | Helper für Provider-Runtime-Auth | Helper zur Auflösung von API-Keys zur Laufzeit |
  | `plugin-sdk/provider-auth-api-key` | Helper für Setup von Provider-API-Keys | Helper für Onboarding/Profile-Writes von API-Keys |
  | `plugin-sdk/provider-auth-result` | Helper für Provider-Auth-Ergebnisse | Standard-Builder für OAuth-Auth-Ergebnisse |
  | `plugin-sdk/provider-auth-login` | Helper für interaktiven Provider-Login | Gemeinsame Helper für interaktiven Login |
  | `plugin-sdk/provider-selection-runtime` | Helper für Providerauswahl | Auswahl von konfiguriertem oder automatischem Provider und Merging roher Provider-Konfiguration |
  | `plugin-sdk/provider-env-vars` | Helper für Provider-Env-Variablen | Helper zum Lookup von Env-Variablen für Provider-Auth |
  | `plugin-sdk/provider-model-shared` | Gemeinsame Helper für Provider-Modelle/Replays | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, gemeinsame Builder für Replay-Richtlinien, Helper für Provider-Endpunkte und Helper zur Normalisierung von Modell-IDs |
  | `plugin-sdk/provider-catalog-shared` | Gemeinsame Helper für Provider-Kataloge | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
  | `plugin-sdk/provider-onboard` | Patches für Provider-Onboarding | Helper für Onboarding-Konfiguration |
  | `plugin-sdk/provider-http` | Provider-HTTP-Helper | Generische Helper für HTTP-/Endpunkt-Fähigkeiten von Providern, einschließlich Multipart-Form-Helper für Audiotranskription |
  | `plugin-sdk/provider-web-fetch` | Helper für Provider-Web-Fetch | Helper für Registrierung/Cache von Web-Fetch-Providern |
  | `plugin-sdk/provider-web-search-config-contract` | Helper für Konfiguration von Provider-Web-Suche | Schmale Konfigurations-/Anmeldedaten-Helper für Web-Suche bei Providern, die keine Verdrahtung der Plugin-Aktivierung benötigen |
  | `plugin-sdk/provider-web-search-contract` | Vertrags-Helper für Provider-Web-Suche | Schmale Vertrags-Helper für Konfiguration/Anmeldedaten der Web-Suche wie `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` und bereichsbezogene Setter/Getter für Anmeldedaten |
  | `plugin-sdk/provider-web-search` | Helper für Provider-Web-Suche | Helper für Registrierung/Cache/Runtime von Web-Such-Providern |
  | `plugin-sdk/provider-tools` | Kompatibilitäts-Helper für Provider-Tools/-Schemas | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, Gemini-Schema-Bereinigung + Diagnosen sowie xAI-Kompatibilitäts-Helper wie `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
  | `plugin-sdk/provider-usage` | Helper für Provider-Nutzung | `fetchClaudeUsage`, `fetchGeminiUsage`, `fetchGithubCopilotUsage` und weitere Helper für Provider-Nutzung |
  | `plugin-sdk/provider-stream` | Wrapper-Helper für Provider-Streams | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, Typen für Stream-Wrapper und gemeinsame Wrapper-Helper für Anthropic/Bedrock/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
  | `plugin-sdk/provider-transport-runtime` | Helper für Provider-Transport | Native Helper für Provider-Transport wie Guarded Fetch, Message-Transforms für Transport und beschreibbare Transport-Event-Streams |
  | `plugin-sdk/keyed-async-queue` | Geordnete asynchrone Queue | `KeyedAsyncQueue` |
  | `plugin-sdk/media-runtime` | Gemeinsame Medien-Helper | Helper zum Abrufen/Transformieren/Speichern von Medien sowie Builder für Medien-Payloads |
  | `plugin-sdk/media-generation-runtime` | Gemeinsame Helper für Mediengenerierung | Gemeinsame Fallback-Helper, Kandidatenauswahl und Hinweise zu fehlenden Modellen für Bild-/Video-/Musikgenerierung |
  | `plugin-sdk/media-understanding` | Helper für Medienverständnis | Typen für Provider von Medienverständnis sowie providerseitige Exporte von Bild-/Audio-Helpern |
  | `plugin-sdk/text-runtime` | Gemeinsame Text-Helper | Entfernen von für Assistenten sichtbarem Text, Helper für Rendern/Chunking/Tabellen in Markdown, Redaction-Helper, Helper für Directive-Tags, Safe-Text-Utilities und verwandte Text-/Logging-Helper |
  | `plugin-sdk/text-chunking` | Helper für Text-Chunking | Helper für Outbound-Text-Chunking |
  | `plugin-sdk/speech` | Sprach-Helper | Typen für Sprach-Provider sowie providerseitige Helper für Directives, Registry und Validierung |
  | `plugin-sdk/speech-core` | Gemeinsamer Speech-Core | Typen für Sprach-Provider, Registry, Directives, Normalisierung |
  | `plugin-sdk/realtime-transcription` | Helper für Realtime-Transkription | Provider-Typen, Registry-Helper und gemeinsamer WebSocket-Sitzungs-Helper |
  | `plugin-sdk/realtime-voice` | Helper für Realtime-Stimme | Provider-Typen, Helper für Registry/Auflösung und Bridge-Sitzungs-Helper |
  | `plugin-sdk/image-generation-core` | Gemeinsamer Core für Bildgenerierung | Typen, Fallback, Auth und Registry-Helper für Bildgenerierung |
  | `plugin-sdk/music-generation` | Helper für Musikgenerierung | Typen für Provider/Anfrage/Ergebnis der Musikgenerierung |
  | `plugin-sdk/music-generation-core` | Gemeinsamer Core für Musikgenerierung | Typen, Fallback-Helper, Provider-Lookup und Parsing von Modell-Refs für Musikgenerierung |
  | `plugin-sdk/video-generation` | Helper für Videogenerierung | Typen für Provider/Anfrage/Ergebnis der Videogenerierung |
  | `plugin-sdk/video-generation-core` | Gemeinsamer Core für Videogenerierung | Typen, Fallback-Helper, Provider-Lookup und Parsing von Modell-Refs für Videogenerierung |
  | `plugin-sdk/interactive-runtime` | Helper für interaktive Antworten | Normalisierung/Reduktion von Payloads für interaktive Antworten |
  | `plugin-sdk/channel-config-primitives` | Primitive für Kanalkonfiguration | Schmale Primitive für Kanalkonfigurationsschemata |
  | `plugin-sdk/channel-config-writes` | Helper für Schreibvorgänge in die Kanalkonfiguration | Helper für die Autorisierung von Schreibvorgängen in die Kanalkonfiguration |
  | `plugin-sdk/channel-plugin-common` | Gemeinsames Prelude für Kanäle | Gemeinsame Prelude-Exporte für Kanal-Plugins |
  | `plugin-sdk/channel-status` | Helper für Kanalstatus | Gemeinsame Helper für Snapshots/Zusammenfassungen des Kanalstatus |
  | `plugin-sdk/allowlist-config-edit` | Helper für Allowlist-Konfiguration | Helper zum Bearbeiten/Lesen von Allowlist-Konfiguration |
  | `plugin-sdk/group-access` | Helper für Gruppenzugriff | Gemeinsame Entscheidungs-Helper für Gruppenzugriff |
  | `plugin-sdk/direct-dm` | Helper für direkte DMs | Gemeinsame Auth-/Guard-Helper für direkte DMs |
  | `plugin-sdk/extension-shared` | Gemeinsame Helper für Erweiterungen | Primitive für passive Kanäle/Status und Ambient-Proxy-Helper |
  | `plugin-sdk/webhook-targets` | Helper für Webhook-Ziele | Registry für Webhook-Ziele und Helper zur Routeninstallation |
  | `plugin-sdk/webhook-path` | Helper für Webhook-Pfade | Helper zur Normalisierung von Webhook-Pfaden |
  | `plugin-sdk/web-media` | Gemeinsame Web-Medien-Helper | Helper zum Laden entfernter/lokaler Medien |
  | `plugin-sdk/zod` | Re-Export von Zod | Re-exportiertes `zod` für Nutzer des Plugin-SDK |
  | `plugin-sdk/memory-core` | Gebündelte Helper für Memory-Core | Helper-Oberfläche für Memory-Manager/Konfiguration/Datei/CLI |
  | `plugin-sdk/memory-core-engine-runtime` | Runtime-Fassade für Memory-Engine | Runtime-Fassade für Memory-Index/Suche |
  | `plugin-sdk/memory-core-host-engine-foundation` | Foundation-Engine für Memory-Host | Exporte der Foundation-Engine für Memory-Host |
  | `plugin-sdk/memory-core-host-engine-embeddings` | Embedding-Engine für Memory-Host | Verträge für Memory-Embeddings, Zugriff auf Registry, lokaler Provider und generische Batch-/Remote-Helper; konkrete Remote-Provider liegen in ihren besitzenden Plugins |
  | `plugin-sdk/memory-core-host-engine-qmd` | QMD-Engine für Memory-Host | Exporte der QMD-Engine für Memory-Host |
  | `plugin-sdk/memory-core-host-engine-storage` | Storage-Engine für Memory-Host | Exporte der Storage-Engine für Memory-Host |
  | `plugin-sdk/memory-core-host-multimodal` | Multimodale Helper für Memory-Host | Multimodale Helper für Memory-Host |
  | `plugin-sdk/memory-core-host-query` | Query-Helper für Memory-Host | Query-Helper für Memory-Host |
  | `plugin-sdk/memory-core-host-secret` | Secret-Helper für Memory-Host | Secret-Helper für Memory-Host |
  | `plugin-sdk/memory-core-host-events` | Helper für Event-Journal des Memory-Hosts | Helper für Event-Journal des Memory-Hosts |
  | `plugin-sdk/memory-core-host-status` | Status-Helper für Memory-Host | Status-Helper für Memory-Host |
  | `plugin-sdk/memory-core-host-runtime-cli` | CLI-Runtime für Memory-Host | CLI-Runtime-Helper für Memory-Host |
  | `plugin-sdk/memory-core-host-runtime-core` | Core-Runtime für Memory-Host | Core-Runtime-Helper für Memory-Host |
  | `plugin-sdk/memory-core-host-runtime-files` | Datei-/Runtime-Helper für Memory-Host | Datei-/Runtime-Helper für Memory-Host |
  | `plugin-sdk/memory-host-core` | Alias der Core-Runtime für Memory-Host | Vendor-neutraler Alias für Core-Runtime-Helper des Memory-Hosts |
  | `plugin-sdk/memory-host-events` | Alias für Event-Journal des Memory-Hosts | Vendor-neutraler Alias für Helper des Event-Journals des Memory-Hosts |
  | `plugin-sdk/memory-host-files` | Alias für Datei-/Runtime des Memory-Hosts | Vendor-neutraler Alias für Datei-/Runtime-Helper des Memory-Hosts |
  | `plugin-sdk/memory-host-markdown` | Helper für verwaltetes Markdown | Gemeinsame Helper für verwaltetes Markdown für Memory-nahe Plugins |
  | `plugin-sdk/memory-host-search` | Fassade für Active Memory Search | Lazy-Runtime-Fassade für den Search Manager von Active Memory |
  | `plugin-sdk/memory-host-status` | Alias für Status des Memory-Hosts | Vendor-neutraler Alias für Status-Helper des Memory-Hosts |
  | `plugin-sdk/memory-lancedb` | Gebündelte Helper für Memory-LanceDB | Helper-Oberfläche für Memory-LanceDB |
  | `plugin-sdk/testing` | Test-Utilities | Test-Helper und Mocks |
</Accordion>

Diese Tabelle ist absichtlich die häufige Teilmenge für Migrationen, nicht die vollständige SDK-
Oberfläche. Die vollständige Liste mit mehr als 200 Einstiegspunkten liegt in
`scripts/lib/plugin-sdk-entrypoints.json`.

Diese Liste enthält weiterhin einige Helper-Seams für gebündelte Plugins wie
`plugin-sdk/feishu`, `plugin-sdk/feishu-setup`, `plugin-sdk/zalo`,
`plugin-sdk/zalo-setup` und `plugin-sdk/matrix*`. Diese bleiben für die Pflege gebündelter Plugins und aus
Kompatibilitätsgründen exportiert, sind aber absichtlich
nicht in der häufigen Migrationstabelle enthalten und nicht das empfohlene Ziel für
neuen Plugin-Code.

Dieselbe Regel gilt für andere Familien gebündelter Helper wie:

- Helper für Browser-Support: `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support`
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

`plugin-sdk/github-copilot-token` stellt derzeit die schmale Token-Helper-
Oberfläche `DEFAULT_COPILOT_API_BASE_URL`,
`deriveCopilotApiBaseUrlFromToken` und `resolveCopilotApiToken` bereit.

Verwenden Sie den schmalsten Import, der zur Aufgabe passt. Wenn Sie einen Export nicht finden,
prüfen Sie den Quellcode unter `src/plugin-sdk/` oder fragen Sie in Discord.

## Aktive Deprecations

Schmalere Deprecations, die für Plugin-SDK, Provider-Vertrag,
Runtime-Oberfläche und Manifest gelten. Jeder dieser Punkte funktioniert heute noch, wird aber
in einem zukünftigen Major-Release entfernt. Der Eintrag unter jedem Punkt ordnet die alte API ihrem
kanonischen Ersatz zu.

<AccordionGroup>
  <Accordion title="command-auth Help-Builder → command-status">
    **Alt (`openclaw/plugin-sdk/command-auth`)**: `buildCommandsMessage`,
    `buildCommandsMessagePaginated`, `buildHelpMessage`.

    **Neu (`openclaw/plugin-sdk/command-status`)**: gleiche Signaturen, gleiche
    Exporte — nur aus dem schmaleren Subpfad importiert. `command-auth`
    exportiert sie erneut als Kompatibilitäts-Stubs.

    ```typescript
    // Vorher
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-auth";

    // Nachher
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-status";
    ```

  </Accordion>

  <Accordion title="Helper für Mention-Gating → resolveInboundMentionDecision">
    **Alt**: `resolveInboundMentionRequirement({ facts, policy })` und
    `shouldDropInboundForMention(...)` aus
    `openclaw/plugin-sdk/channel-inbound` oder
    `openclaw/plugin-sdk/channel-mention-gating`.

    **Neu**: `resolveInboundMentionDecision({ facts, policy })` — gibt ein
    einzelnes Entscheidungsobjekt zurück statt zweier getrennter Aufrufe.

    Nachgelagerte Kanal-Plugins (Slack, Discord, Matrix, MS Teams) wurden bereits
    umgestellt.

  </Accordion>

  <Accordion title="Channel-Runtime-Shim und Helper für Channel-Aktionen">
    `openclaw/plugin-sdk/channel-runtime` ist ein Kompatibilitäts-Shim für ältere
    Kanal-Plugins. Importieren Sie ihn nicht in neuem Code; verwenden Sie
    `openclaw/plugin-sdk/channel-runtime-context` für die Registrierung von Runtime-
    Objekten.

    `channelActions*`-Helper in `openclaw/plugin-sdk/channel-actions` sind
    zusammen mit rohen Channel-Exporten für „actions“ veraltet. Stellen Sie Fähigkeiten
    stattdessen über die semantische Oberfläche `presentation` bereit — Kanal-Plugins
    deklarieren, was sie rendern (Cards, Buttons, Selects), statt welche rohen
    Aktionsnamen sie akzeptieren.

  </Accordion>

  <Accordion title="tool()-Helper für Web-Such-Provider → createTool() im Plugin">
    **Alt**: Factory `tool()` aus `openclaw/plugin-sdk/provider-web-search`.

    **Neu**: `createTool(...)` direkt im Provider-Plugin implementieren.
    OpenClaw benötigt den SDK-Helper nicht mehr, um den Tool-Wrapper zu registrieren.

  </Accordion>

  <Accordion title="Klartext-Kanal-Umschläge → BodyForAgent">
    **Alt**: `formatInboundEnvelope(...)` (und
    `ChannelMessageForAgent.channelEnvelope`), um einen flachen Klartext-
    Prompt-Umschlag aus eingehenden Kanalnachrichten zu bauen.

    **Neu**: `BodyForAgent` plus strukturierte Benutzerkontext-Blöcke. Kanal-
    Plugins hängen Routing-Metadaten (Thread, Topic, Reply-to, Reaktionen) als
    typisierte Felder an, statt sie zu einem Prompt-String zu verketten. Der
    Helper `formatAgentEnvelope(...)` wird weiterhin für synthetisierte, an Assistenten gerichtete
    Umschläge unterstützt, aber eingehende Klartext-Umschläge werden
    schrittweise abgeschafft.

    Betroffene Bereiche: `inbound_claim`, `message_received` und jedes benutzerdefinierte
    Kanal-Plugin, das Text in `channelEnvelope` nachverarbeitet hat.

  </Accordion>

  <Accordion title="Provider-Discovery-Typen → Provider-Katalog-Typen">
    Vier Discovery-Typ-Aliasse sind jetzt nur noch dünne Wrapper über die
    Typen der Katalog-Ära:

    | Alter Alias               | Neuer Typ               |
    | ------------------------- | ----------------------- |
    | `ProviderDiscoveryOrder`  | `ProviderCatalogOrder`  |
    | `ProviderDiscoveryContext`| `ProviderCatalogContext`|
    | `ProviderDiscoveryResult` | `ProviderCatalogResult` |
    | `ProviderPluginDiscovery` | `ProviderPluginCatalog` |

    Hinzu kommt die alte statische Bag `ProviderCapabilities` — Provider-Plugins
    sollten Fakten zu Fähigkeiten über den Runtime-Vertrag des Providers anhängen
    statt über ein statisches Objekt.

  </Accordion>

  <Accordion title="Hooks für Thinking-Richtlinien → resolveThinkingProfile">
    **Alt** (drei separate Hooks auf `ProviderThinkingPolicy`):
    `isBinaryThinking(ctx)`, `supportsXHighThinking(ctx)` und
    `resolveDefaultThinkingLevel(ctx)`.

    **Neu**: ein einzelnes `resolveThinkingProfile(ctx)`, das ein
    `ProviderThinkingProfile` mit der kanonischen `id`, optionalem `label` und
    einer gerankten Liste von Stufen zurückgibt. OpenClaw stuft veraltete gespeicherte Werte anhand
    des Profilrangs automatisch herab.

    Implementieren Sie einen Hook statt drei. Die alten Hooks funktionieren
    während des Deprecation-Fensters weiterhin, werden aber nicht mit dem
    Profilergebnis kombiniert.

  </Accordion>

  <Accordion title="Fallback für externe OAuth-Provider → contracts.externalAuthProviders">
    **Alt**: Implementierung von `resolveExternalOAuthProfiles(...)` ohne
    den Provider im Plugin-Manifest zu deklarieren.

    **Neu**: `contracts.externalAuthProviders` im Plugin-Manifest deklarieren
    **und** `resolveExternalAuthProfiles(...)` implementieren. Der alte „Auth-
    Fallback“-Pfad gibt zur Laufzeit eine Warnung aus und wird entfernt.

    ```json
    {
      "contracts": {
        "externalAuthProviders": ["anthropic", "openai"]
      }
    }
    ```

  </Accordion>

  <Accordion title="Lookup von Provider-Env-Variablen → setup.providers[].envVars">
    **Altes** Manifest-Feld: `providerAuthEnvVars: { anthropic: ["ANTHROPIC_API_KEY"] }`.

    **Neu**: Spiegeln Sie denselben Lookup von Env-Variablen in `setup.providers[].envVars`
    im Manifest wider. Dies konsolidiert Env-Metadaten für Setup/Status an einer
    Stelle und vermeidet das Starten der Plugin-Runtime nur für den Lookup
    von Env-Variablen.

    `providerAuthEnvVars` bleibt über einen Kompatibilitäts-Adapter unterstützt,
    bis das Deprecation-Fenster endet.

  </Accordion>

  <Accordion title="Registrierung von Memory-Plugins → registerMemoryCapability">
    **Alt**: drei separate Aufrufe —
    `api.registerMemoryPromptSection(...)`,
    `api.registerMemoryFlushPlan(...)`,
    `api.registerMemoryRuntime(...)`.

    **Neu**: ein Aufruf auf der API für Memory-Status —
    `registerMemoryCapability(pluginId, { promptBuilder, flushPlanResolver, runtime })`.

    Gleiche Slots, ein einziger Registrierungsaufruf. Additive Memory-Helper
    (`registerMemoryPromptSupplement`, `registerMemoryCorpusSupplement`,
    `registerMemoryEmbeddingProvider`) sind davon nicht betroffen.

  </Accordion>

  <Accordion title="Typen für Subagent-Session-Nachrichten umbenannt">
    Zwei alte Typ-Aliasse werden weiterhin aus `src/plugins/runtime/types.ts` exportiert:

    | Alt                           | Neu                                |
    | ----------------------------- | ---------------------------------- |
    | `SubagentReadSessionParams`   | `SubagentGetSessionMessagesParams` |
    | `SubagentReadSessionResult`   | `SubagentGetSessionMessagesResult` |

    Die Runtime-Methode `readSession` ist zugunsten von
    `getSessionMessages` veraltet. Gleiche Signatur; die alte Methode ruft die
    neue intern auf.

  </Accordion>

  <Accordion title="runtime.tasks.flow → runtime.tasks.flows">
    **Alt**: `runtime.tasks.flow` (Singular) gab einen Live-Accessor für TaskFlow zurück.

    **Neu**: `runtime.tasks.flows` (Plural) gibt DTO-basierten Zugriff auf TaskFlow zurück,
    der importsicher ist und nicht das Laden der vollständigen Task-Runtime erfordert.

    ```typescript
    // Vorher
    const flow = api.runtime.tasks.flow(ctx);
    // Nachher
    const flows = api.runtime.tasks.flows(ctx);
    ```

  </Accordion>

  <Accordion title="Embedded Extension Factories → Agent Tool-Result-Middleware">
    Behandelt in „So migrieren Sie → Pi-Tool-Result-Erweiterungen auf
    Middleware migrieren“ oben. Der Vollständigkeit halber hier enthalten: Der entfernte Pi-only-
    Pfad `api.registerEmbeddedExtensionFactory(...)` wird ersetzt durch
    `api.registerAgentToolResultMiddleware(...)` mit einer expliziten Runtime-
    Liste in `contracts.agentToolResultMiddleware`.
  </Accordion>

  <Accordion title="Alias OpenClawSchemaType → OpenClawConfig">
    `OpenClawSchemaType`, erneut exportiert aus `openclaw/plugin-sdk`, ist jetzt ein
    einzeiliger Alias für `OpenClawConfig`. Bevorzugen Sie den kanonischen Namen.

    ```typescript
    // Vorher
    import type { OpenClawSchemaType } from "openclaw/plugin-sdk";
    // Nachher
    import type { OpenClawConfig } from "openclaw/plugin-sdk/config-schema";
    ```

  </Accordion>
</AccordionGroup>

<Note>
Deprecations auf Erweiterungsebene (innerhalb gebündelter Kanal-/Provider-Plugins unter
`extensions/`) werden in ihren eigenen Barrels `api.ts` und `runtime-api.ts`
nachverfolgt. Sie betreffen keine Verträge für Drittanbieter-Plugins und werden hier
nicht aufgeführt. Wenn Sie direkt das lokale Barrel eines gebündelten Plugins verwenden, lesen Sie vor dem Upgrade die
Deprecation-Kommentare in diesem Barrel.
</Note>

## Zeitplan für die Entfernung

| Wann                   | Was passiert                                                           |
| ---------------------- | ---------------------------------------------------------------------- |
| **Jetzt**              | Veraltete Oberflächen geben Runtime-Warnungen aus                      |
| **Nächstes Major-Release** | Veraltete Oberflächen werden entfernt; Plugins, die sie noch verwenden, schlagen fehl |

Alle Core-Plugins wurden bereits migriert. Externe Plugins sollten
vor dem nächsten Major-Release migrieren.

## Warnungen vorübergehend unterdrücken

Setzen Sie diese Umgebungsvariablen, während Sie an der Migration arbeiten:

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

Dies ist ein vorübergehender Escape Hatch, keine dauerhafte Lösung.

## Verwandt

- [Erste Schritte](/de/plugins/building-plugins) — Ihr erstes Plugin entwickeln
- [SDK Overview](/de/plugins/sdk-overview) — vollständige Referenz für Subpfad-Imports
- [Channel Plugins](/de/plugins/sdk-channel-plugins) — Entwicklung von Kanal-Plugins
- [Provider Plugins](/de/plugins/sdk-provider-plugins) — Entwicklung von Provider-Plugins
- [Plugin Internals](/de/plugins/architecture) — tiefer Einblick in die Architektur
- [Plugin Manifest](/de/plugins/manifest) — Referenz für das Manifest-Schema
