---
read_when:
    - Sie sehen die Warnung OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED
    - Sie sehen die Warnung OPENCLAW_EXTENSION_API_DEPRECATED
    - Sie haben vor OpenClaw 2026.4.25 `api.registerEmbeddedExtensionFactory` verwendet
    - Sie aktualisieren ein Plugin auf die moderne Plugin-Architektur
    - Sie pflegen ein externes OpenClaw Plugin
sidebarTitle: Migrate to SDK
summary: Von der alten Abwärtskompatibilitätsschicht zum modernen Plugin SDK migrieren
title: Migration des Plugin SDK
x-i18n:
    generated_at: "2026-04-25T18:20:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: c7ab0369fc6e43961a41cff882b0c05653a6a1e3f919ef8a3620c868c16c02ce
    source_path: plugins/sdk-migration.md
    workflow: 15
---

OpenClaw ist von einer breit angelegten Abwärtskompatibilitätsschicht zu einer modernen Plugin-Architektur mit fokussierten, dokumentierten Importen übergegangen. Wenn Ihr Plugin vor der neuen Architektur erstellt wurde, hilft Ihnen diese Anleitung bei der Migration.

## Was sich ändert

Das alte Plugin-System stellte zwei weit offene Oberflächen bereit, über die Plugins alles importieren konnten, was sie über einen einzigen Einstiegspunkt benötigten:

- **`openclaw/plugin-sdk/compat`** — ein einzelner Import, der Dutzende von Hilfsfunktionen erneut exportierte. Er wurde eingeführt, um ältere Hook-basierte Plugins funktionsfähig zu halten, während die neue Plugin-Architektur aufgebaut wurde.
- **`openclaw/extension-api`** — eine Brücke, die Plugins direkten Zugriff auf hostseitige Hilfsfunktionen wie den eingebetteten Agent-Runner gab.
- **`api.registerEmbeddedExtensionFactory(...)`** — ein entfernter, nur für Pi verfügbarer Hook für gebündelte Erweiterungen, der eingebettete Runner-Ereignisse wie `tool_result` beobachten konnte.

Die breiten Importoberflächen sind jetzt **veraltet**. Sie funktionieren zur Laufzeit weiterhin, aber neue Plugins dürfen sie nicht verwenden, und bestehende Plugins sollten migrieren, bevor die nächste Major-Release sie entfernt. Die nur für Pi verfügbare API zur Registrierung eingebetteter Erweiterungsfabriken wurde entfernt; verwenden Sie stattdessen Tool-Result-Middleware.

OpenClaw entfernt dokumentiertes Plugin-Verhalten nicht und interpretiert es nicht neu in derselben Änderung, die eine Ersetzung einführt. Änderungen an Breaking Contracts müssen zuerst über einen Kompatibilitätsadapter, Diagnosen, Dokumentation und ein Deprecation-Fenster laufen. Das gilt für SDK-Importe, Manifest-Felder, Setup-APIs, Hooks und das Laufzeitverhalten bei der Registrierung.

<Warning>
  Die Abwärtskompatibilitätsschicht wird in einer zukünftigen Major-Release entfernt.
  Plugins, die weiterhin aus diesen Oberflächen importieren, werden dann nicht mehr funktionieren.
  Registrierungen eingebetteter Erweiterungsfabriken nur für Pi werden bereits nicht mehr geladen.
</Warning>

## Warum sich das geändert hat

Der alte Ansatz verursachte Probleme:

- **Langsamer Start** — das Importieren einer Hilfsfunktion lud Dutzende nicht zusammenhängender Module
- **Zirkuläre Abhängigkeiten** — breite Re-Exports machten es leicht, Importzyklen zu erzeugen
- **Unklare API-Oberfläche** — es gab keine Möglichkeit zu erkennen, welche Exporte stabil und welche intern waren

Das moderne Plugin SDK behebt dies: Jeder Importpfad (`openclaw/plugin-sdk/\<subpath\>`) ist ein kleines, in sich geschlossenes Modul mit einem klaren Zweck und dokumentiertem Vertrag.

Veraltete Convenience-Seams für Provider gebündelter Kanäle sind ebenfalls entfernt. Importe wie `openclaw/plugin-sdk/slack`, `openclaw/plugin-sdk/discord`, `openclaw/plugin-sdk/signal`, `openclaw/plugin-sdk/whatsapp`, kanalgebrandete Helper-Seams und `openclaw/plugin-sdk/telegram-core` waren private Mono-Repo-Abkürzungen, keine stabilen Plugin-Verträge. Verwenden Sie stattdessen schmale generische SDK-Unterpfade. Innerhalb des Arbeitsbereichs für gebündelte Plugins behalten Sie provider-eigene Hilfsfunktionen im jeweiligen eigenen `api.ts` oder `runtime-api.ts` des Plugins.

Aktuelle Beispiele für gebündelte Provider:

- Anthropic hält Claude-spezifische Stream-Hilfsfunktionen in seinem eigenen `api.ts` / `contract-api.ts`-Seam
- OpenAI hält Provider-Builder, Hilfsfunktionen für Standardmodelle und Realtime-Provider-Builder in seinem eigenen `api.ts`
- OpenRouter hält den Provider-Builder sowie Onboarding-/Konfigurationshilfsfunktionen in seinem eigenen `api.ts`

## Kompatibilitätsrichtlinie

Für externe Plugins folgt Kompatibilitätsarbeit dieser Reihenfolge:

1. den neuen Vertrag hinzufügen
2. das alte Verhalten über einen Kompatibilitätsadapter verdrahtet beibehalten
3. eine Diagnose oder Warnung ausgeben, die den alten Pfad und die Ersetzung nennt
4. beide Pfade in Tests abdecken
5. die Deprecation und den Migrationspfad dokumentieren
6. erst nach dem angekündigten Migrationsfenster entfernen, in der Regel in einer Major-Release

Wenn ein Manifest-Feld weiterhin akzeptiert wird, können Plugin-Autoren es weiter verwenden, bis die Dokumentation und Diagnosen etwas anderes sagen. Neuer Code sollte die dokumentierte Ersetzung bevorzugen, aber bestehende Plugins sollten in normalen Minor-Releases nicht kaputtgehen.

## Migration

<Steps>
  <Step title="Pi-Tool-Result-Erweiterungen auf Middleware migrieren">
    Gebündelte Plugins müssen Tool-Result-Handler nur für Pi aus
    `api.registerEmbeddedExtensionFactory(...)` durch laufzeitneutrale Middleware ersetzen.

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

    Externe Plugins können keine Tool-Result-Middleware registrieren, weil sie Tool-Ausgaben mit hohem Vertrauen umschreiben kann, bevor das Modell sie sieht.

  </Step>

  <Step title="Approval-native Handler auf Capability-Fakten migrieren">
    Kanal-Plugins mit Approval-Fähigkeit stellen natives Approval-Verhalten jetzt über
    `approvalCapability.nativeRuntime` plus die gemeinsame Laufzeitkontext-Registry bereit.

    Wichtige Änderungen:

    - Ersetzen Sie `approvalCapability.handler.loadRuntime(...)` durch
      `approvalCapability.nativeRuntime`
    - Verschieben Sie approval-spezifische Authentifizierung/Zustellung von der veralteten Verdrahtung `plugin.auth` /
      `plugin.approvals` auf `approvalCapability`
    - `ChannelPlugin.approvals` wurde aus dem öffentlichen Vertrag für Kanal-Plugins
      entfernt; verschieben Sie delivery/native/render-Felder auf `approvalCapability`
    - `plugin.auth` bleibt nur für Kanal-Login-/Logout-Abläufe bestehen; Approval-Auth-Hooks
      dort werden vom Core nicht mehr gelesen
    - Registrieren Sie kanal-eigene Laufzeitobjekte wie Clients, Tokens oder Bolt-
      Apps über `openclaw/plugin-sdk/channel-runtime-context`
    - Senden Sie keine plugin-eigenen Umleitungsmitteilungen aus nativen Approval-Handlern;
      der Core besitzt jetzt Mitteilungen „anderswo geroutet“ anhand tatsächlicher Zustellungsergebnisse
    - Wenn Sie `channelRuntime` an `createChannelManager(...)` übergeben, stellen Sie eine
      echte Oberfläche `createPluginRuntime().channel` bereit. Partielle Stubs werden abgelehnt.

    Siehe `/plugins/sdk-channel-plugins` für das aktuelle Layout der Approval-Capability.

  </Step>

  <Step title="Fallback-Verhalten für Windows-Wrapper prüfen">
    Wenn Ihr Plugin `openclaw/plugin-sdk/windows-spawn` verwendet, schlagen nicht aufgelöste Windows-
    Wrapper `.cmd`/`.bat` jetzt fail-closed fehl, es sei denn, Sie übergeben explizit `allowShellFallback: true`.

    ```typescript
    // Vorher
    const program = applyWindowsSpawnProgramPolicy({ candidate });

    // Nachher
    const program = applyWindowsSpawnProgramPolicy({
      candidate,
      // Nur für vertrauenswürdige Kompatibilitätsaufrufer setzen, die
      // bewusst shell-vermittelten Fallback akzeptieren.
      allowShellFallback: true,
    });
    ```

    Wenn Ihr Aufrufer nicht absichtlich auf Shell-Fallback angewiesen ist, setzen Sie
    `allowShellFallback` nicht und behandeln Sie stattdessen den ausgelösten Fehler.

  </Step>

  <Step title="Veraltete Importe finden">
    Suchen Sie in Ihrem Plugin nach Importen aus einer der beiden veralteten Oberflächen:

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

    Für hostseitige Hilfsfunktionen verwenden Sie die injizierte Plugin-Laufzeit, statt direkt zu importieren:

    ```typescript
    // Vorher (veraltete extension-api-Brücke)
    import { runEmbeddedPiAgent } from "openclaw/extension-api";
    const result = await runEmbeddedPiAgent({ sessionId, prompt });

    // Nachher (injizierte Laufzeit)
    const result = await api.runtime.agent.runEmbeddedPiAgent({ sessionId, prompt });
    ```

    Dasselbe Muster gilt für andere veraltete Hilfsfunktionen der Bridge:

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
  | `plugin-sdk/plugin-entry` | Kanonische Hilfsfunktion für Plugin-Einstiegspunkte | `definePluginEntry` |
  | `plugin-sdk/core` | Veralteter Umbrella-Re-Export für Definitionen/Builder von Kanaleinstiegspunkten | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | Export des Root-Konfigurationsschemas | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | Hilfsfunktion für Einstiegspunkte einzelner Provider | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | Fokussierte Definitionen und Builder für Kanaleinstiegspunkte | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
  | `plugin-sdk/setup` | Gemeinsame Hilfsfunktionen für Setup-Assistenten | Allowlist-Eingabeaufforderungen, Builder für den Setup-Status |
  | `plugin-sdk/setup-runtime` | Laufzeithilfsfunktionen zur Setup-Zeit | importsichere Setup-Patch-Adapter, Hilfsfunktionen für Suchhinweise, `promptResolvedAllowFrom`, `splitSetupEntries`, delegierte Setup-Proxys |
  | `plugin-sdk/setup-adapter-runtime` | Hilfsfunktionen für Setup-Adapter | `createEnvPatchedAccountSetupAdapter` |
  | `plugin-sdk/setup-tools` | Hilfsfunktionen für Setup-Tools | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | Hilfsfunktionen für mehrere Konten | Hilfsfunktionen für Kontolisten/Konfiguration/Aktions-Gating |
  | `plugin-sdk/account-id` | Hilfsfunktionen für Konto-IDs | `DEFAULT_ACCOUNT_ID`, Normalisierung von Konto-IDs |
  | `plugin-sdk/account-resolution` | Hilfsfunktionen für die Kontoauflösung | Hilfsfunktionen für Kontosuche + Standard-Fallback |
  | `plugin-sdk/account-helpers` | Schmale Hilfsfunktionen für Konten | Hilfsfunktionen für Kontolisten/Kontoaktionen |
  | `plugin-sdk/channel-setup` | Adapter für Setup-Assistenten | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, plus `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | Primitive für DM-Kopplung | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | Verdrahtung für Antwortpräfix + Tippanzeige | `createChannelReplyPipeline` |
  | `plugin-sdk/channel-config-helpers` | Fabriken für Konfigurationsadapter | `createHybridChannelConfigAdapter` |
  | `plugin-sdk/channel-config-schema` | Builder für Konfigurationsschemata | Gemeinsame Primitive für Kanalkonfigurationsschemata; benannte Schema-Exporte für gebündelte Kanäle dienen nur der veralteten Kompatibilität |
  | `plugin-sdk/telegram-command-config` | Hilfsfunktionen für die Telegram-Befehlskonfiguration | Normalisierung von Befehlsnamen, Kürzen von Beschreibungen, Validierung von Duplikaten/Konflikten |
  | `plugin-sdk/channel-policy` | Auflösung von Gruppen-/DM-Richtlinien | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | Hilfsfunktionen für Kontostatus und den Lifecycle von Draft-Streams | `createAccountStatusSink`, Hilfsfunktionen für die Finalisierung von Draft-Vorschauen |
  | `plugin-sdk/inbound-envelope` | Hilfsfunktionen für eingehende Envelopes | Gemeinsame Hilfsfunktionen zum Erstellen von Routen + Envelopes |
  | `plugin-sdk/inbound-reply-dispatch` | Hilfsfunktionen für eingehende Antworten | Gemeinsame Hilfsfunktionen zum Aufzeichnen und Dispatchen |
  | `plugin-sdk/messaging-targets` | Parsing von Messaging-Zielen | Hilfsfunktionen zum Parsen/Abgleichen von Zielen |
  | `plugin-sdk/outbound-media` | Hilfsfunktionen für ausgehende Medien | Gemeinsames Laden ausgehender Medien |
  | `plugin-sdk/outbound-runtime` | Laufzeithilfsfunktionen für ausgehende Kommunikation | Hilfsfunktionen für ausgehende Zustellung, Identity-/Sende-Delegate, Sitzung, Formatierung und Payload-Planung |
  | `plugin-sdk/thread-bindings-runtime` | Hilfsfunktionen für Thread-Bindings | Hilfsfunktionen für Lifecycle und Adapter von Thread-Bindings |
  | `plugin-sdk/agent-media-payload` | Veraltete Hilfsfunktionen für Medien-Payloads | Builder für Agent-Medien-Payloads für veraltete Feldlayouts |
  | `plugin-sdk/channel-runtime` | Veralteter Kompatibilitäts-Shim | Nur veraltete Utilities für die Kanal-Laufzeit |
  | `plugin-sdk/channel-send-result` | Typen für Sendeergebnisse | Typen für Antwortergebnisse |
  | `plugin-sdk/runtime-store` | Persistenter Plugin-Speicher | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | Breite Laufzeithilfsfunktionen | Hilfsfunktionen für Laufzeit/Logging/Backup/Plugin-Installation |
  | `plugin-sdk/runtime-env` | Schmale Hilfsfunktionen für die Laufzeitumgebung | Logger-/Laufzeitumgebungs-, Timeout-, Retry- und Backoff-Hilfsfunktionen |
  | `plugin-sdk/plugin-runtime` | Gemeinsame Hilfsfunktionen für die Plugin-Laufzeit | Hilfsfunktionen für Plugin-Befehle/Hooks/HTTP/interaktive Funktionen |
  | `plugin-sdk/hook-runtime` | Hilfsfunktionen für Hook-Pipelines | Gemeinsame Hilfsfunktionen für Webhook-/interne Hook-Pipelines |
  | `plugin-sdk/lazy-runtime` | Hilfsfunktionen für Lazy Runtime | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | Hilfsfunktionen für Prozesse | Gemeinsame Exec-Hilfsfunktionen |
  | `plugin-sdk/cli-runtime` | Laufzeithilfsfunktionen für CLI | Hilfsfunktionen für Befehlsformatierung, Waits und Versionen |
  | `plugin-sdk/gateway-runtime` | Hilfsfunktionen für Gateway | Gateway-Client und Hilfsfunktionen für Patches des Kanalstatus |
  | `plugin-sdk/config-runtime` | Hilfsfunktionen für Konfiguration | Hilfsfunktionen zum Laden/Schreiben von Konfiguration |
  | `plugin-sdk/telegram-command-config` | Hilfsfunktionen für Telegram-Befehle | Fallback-stabile Hilfsfunktionen zur Telegram-Befehlsvalidierung, wenn die gebündelte Telegram-Vertragsoberfläche nicht verfügbar ist |
  | `plugin-sdk/approval-runtime` | Hilfsfunktionen für Approval-Aufforderungen | Payload für Exec-/Plugin-Approval, Hilfsfunktionen für Approval-Capability/-Profile, native Approval-Routing-/Laufzeithilfsfunktionen und Formatierung strukturierter Approval-Anzeigepfade |
  | `plugin-sdk/approval-auth-runtime` | Hilfsfunktionen für Approval-Authentifizierung | Auflösung von Approvern, Authentifizierung von Aktionen im selben Chat |
  | `plugin-sdk/approval-client-runtime` | Hilfsfunktionen für Approval-Clients | Hilfsfunktionen für native Exec-Approval-Profile/-Filter |
  | `plugin-sdk/approval-delivery-runtime` | Hilfsfunktionen für Approval-Zustellung | Adapter für native Approval-Capability/-Zustellung |
  | `plugin-sdk/approval-gateway-runtime` | Hilfsfunktionen für Approval-Gateway | Gemeinsame Hilfsfunktion für die Auflösung von Approval-Gateways |
  | `plugin-sdk/approval-handler-adapter-runtime` | Hilfsfunktionen für Approval-Adapter | Leichtgewichtige Hilfsfunktionen zum Laden nativer Approval-Adapter für Hot-Kanal-Einstiegspunkte |
  | `plugin-sdk/approval-handler-runtime` | Hilfsfunktionen für Approval-Handler | Breitere Laufzeithilfsfunktionen für Approval-Handler; bevorzugen Sie die schmaleren Adapter-/Gateway-Seams, wenn diese ausreichen |
  | `plugin-sdk/approval-native-runtime` | Hilfsfunktionen für Approval-Ziele | Hilfsfunktionen für native Approval-Ziel-/Kontobindung |
  | `plugin-sdk/approval-reply-runtime` | Hilfsfunktionen für Approval-Antworten | Hilfsfunktionen für Antwort-Payloads von Exec-/Plugin-Approval |
  | `plugin-sdk/channel-runtime-context` | Hilfsfunktionen für den Kanal-Laufzeitkontext | Generische Hilfsfunktionen zum Registrieren/Abrufen/Beobachten des Kanal-Laufzeitkontexts |
  | `plugin-sdk/security-runtime` | Hilfsfunktionen für Sicherheit | Gemeinsame Hilfsfunktionen für Vertrauen, DM-Gating, externe Inhalte und Secret-Erfassung |
  | `plugin-sdk/ssrf-policy` | Hilfsfunktionen für SSRF-Richtlinien | Hilfsfunktionen für Host-Allowlist und Richtlinien für private Netzwerke |
  | `plugin-sdk/ssrf-runtime` | Laufzeithilfsfunktionen für SSRF | Pinned-Dispatcher, guarded fetch, SSRF-Richtlinienhilfsfunktionen |
  | `plugin-sdk/collection-runtime` | Hilfsfunktionen für begrenzte Caches | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | Hilfsfunktionen für diagnostisches Gating | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | Hilfsfunktionen für Fehlerformatierung | `formatUncaughtError`, `isApprovalNotFoundError`, Hilfsfunktionen für Fehlergraphen |
  | `plugin-sdk/fetch-runtime` | Hilfsfunktionen für umhülltes Fetch/Proxy | `resolveFetch`, Proxy-Hilfsfunktionen |
  | `plugin-sdk/host-runtime` | Hilfsfunktionen für Host-Normalisierung | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | Hilfsfunktionen für Wiederholungsversuche | `RetryConfig`, `retryAsync`, Runner für Richtlinien |
  | `plugin-sdk/allow-from` | Formatierung von Allowlists | `formatAllowFromLowercase` |
  | `plugin-sdk/allowlist-resolution` | Zuordnung von Allowlist-Eingaben | `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | Befehls-Gating und Hilfsfunktionen für Befehlsoberflächen | `resolveControlCommandGate`, Hilfsfunktionen für Senderautorisierung, Hilfsfunktionen für Befehlsregister einschließlich dynamischer Formatierung von Argumentmenüs |
  | `plugin-sdk/command-status` | Renderer für Befehlsstatus/-hilfe | `buildCommandsMessage`, `buildCommandsMessagePaginated`, `buildHelpMessage` |
  | `plugin-sdk/secret-input` | Parsing geheimer Eingaben | Hilfsfunktionen für geheime Eingaben |
  | `plugin-sdk/webhook-ingress` | Hilfsfunktionen für Webhook-Requests | Utilities für Webhook-Ziele |
  | `plugin-sdk/webhook-request-guards` | Hilfsfunktionen für Guards von Webhook-Bodys | Hilfsfunktionen zum Lesen/Begrenzen von Request-Bodys |
  | `plugin-sdk/reply-runtime` | Gemeinsame Antwort-Laufzeit | Eingehender Dispatch, Heartbeat, Antwortplaner, Chunking |
  | `plugin-sdk/reply-dispatch-runtime` | Schmale Hilfsfunktionen für Antwort-Dispatch | Hilfsfunktionen für Finalisierung, Provider-Dispatch und Konversationslabels |
  | `plugin-sdk/reply-history` | Hilfsfunktionen für Antwortverlauf | `buildHistoryContext`, `buildPendingHistoryContextFromMap`, `recordPendingHistoryEntry`, `clearHistoryEntriesIfEnabled` |
  | `plugin-sdk/reply-reference` | Planung von Antwortreferenzen | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | Hilfsfunktionen für Antwort-Chunks | Hilfsfunktionen für Text-/Markdown-Chunking |
  | `plugin-sdk/session-store-runtime` | Hilfsfunktionen für Sitzungsspeicher | Hilfsfunktionen für Speicherpfad + `updated-at` |
  | `plugin-sdk/state-paths` | Hilfsfunktionen für Zustandspfade | Hilfsfunktionen für State- und OAuth-Verzeichnisse |
  | `plugin-sdk/routing` | Hilfsfunktionen für Routing/Sitzungsschlüssel | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId`, Hilfsfunktionen zur Normalisierung von Sitzungsschlüsseln |
  | `plugin-sdk/status-helpers` | Hilfsfunktionen für Kanalstatus | Builder für Zusammenfassungen von Kanal-/Kontostatus, Standardwerte für Laufzeitzustand, Hilfsfunktionen für Issue-Metadaten |
  | `plugin-sdk/target-resolver-runtime` | Hilfsfunktionen für Zielauflösung | Gemeinsame Hilfsfunktionen für Zielauflösung |
  | `plugin-sdk/string-normalization-runtime` | Hilfsfunktionen für String-Normalisierung | Hilfsfunktionen für Slug-/String-Normalisierung |
  | `plugin-sdk/request-url` | Hilfsfunktionen für Request-URLs | String-URLs aus request-ähnlichen Eingaben extrahieren |
  | `plugin-sdk/run-command` | Hilfsfunktionen für zeitgesteuerte Befehle | Runner für zeitgesteuerte Befehle mit normalisiertem stdout/stderr |
  | `plugin-sdk/param-readers` | Param-Reader | Gemeinsame Param-Reader für Tools/CLI |
  | `plugin-sdk/tool-payload` | Extraktion von Tool-Payloads | Normalisierte Payloads aus Tool-Ergebnisobjekten extrahieren |
  | `plugin-sdk/tool-send` | Extraktion von Tool-Sendungen | Kanonische Felder für Sendeziele aus Tool-Argumenten extrahieren |
  | `plugin-sdk/temp-path` | Hilfsfunktionen für temporäre Pfade | Gemeinsame Hilfsfunktionen für temporäre Download-Pfade |
  | `plugin-sdk/logging-core` | Hilfsfunktionen für Logging | Hilfsfunktionen für Subsystem-Logger und Redaction |
  | `plugin-sdk/markdown-table-runtime` | Hilfsfunktionen für Markdown-Tabellen | Hilfsfunktionen für Modi von Markdown-Tabellen |
  | `plugin-sdk/reply-payload` | Typen für Nachrichtenantworten | Typen für Antwort-Payloads |
  | `plugin-sdk/provider-setup` | Kuratierte Hilfsfunktionen für Setup lokaler/self-hosted Provider | Hilfsfunktionen für Discovery/Konfiguration self-hosted Provider |
  | `plugin-sdk/self-hosted-provider-setup` | Fokussierte Hilfsfunktionen für Setup selbstgehosteter OpenAI-kompatibler Provider | Dieselben Hilfsfunktionen für Discovery/Konfiguration self-hosted Provider |
  | `plugin-sdk/provider-auth-runtime` | Laufzeithilfsfunktionen für Provider-Authentifizierung | Hilfsfunktionen zur Laufzeitauflösung von API-Keys |
  | `plugin-sdk/provider-auth-api-key` | Hilfsfunktionen für Setup von Provider-API-Keys | Hilfsfunktionen für API-Key-Onboarding/Profilschreiben |
  | `plugin-sdk/provider-auth-result` | Hilfsfunktionen für Provider-Authentifizierungsergebnisse | Standard-Builder für OAuth-Authentifizierungsergebnisse |
  | `plugin-sdk/provider-auth-login` | Hilfsfunktionen für interaktiven Provider-Login | Gemeinsame Hilfsfunktionen für interaktiven Login |
  | `plugin-sdk/provider-selection-runtime` | Hilfsfunktionen für Provider-Auswahl | Auswahl konfigurierte-oder-automatische Provider und Zusammenführung roher Provider-Konfigurationen |
  | `plugin-sdk/provider-env-vars` | Hilfsfunktionen für Provider-Env-Vars | Hilfsfunktionen zur Suche nach Env-Vars für Provider-Authentifizierung |
  | `plugin-sdk/provider-model-shared` | Gemeinsame Hilfsfunktionen für Providermodelle/-replay | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, gemeinsame Builder für Replay-Richtlinien, Hilfsfunktionen für Provider-Endpunkte und Hilfsfunktionen zur Normalisierung von Modell-IDs |
  | `plugin-sdk/provider-catalog-shared` | Gemeinsame Hilfsfunktionen für Provider-Kataloge | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
  | `plugin-sdk/provider-onboard` | Patches für Provider-Onboarding | Hilfsfunktionen für die Onboarding-Konfiguration |
  | `plugin-sdk/provider-http` | Hilfsfunktionen für Provider-HTTP | Generische Hilfsfunktionen für Provider-HTTP/Endpunkt-Fähigkeiten, einschließlich Multipart-Form-Hilfsfunktionen für Audiotranskription |
  | `plugin-sdk/provider-web-fetch` | Hilfsfunktionen für Provider-Web-Fetch | Hilfsfunktionen für Registrierung/Cache von Web-Fetch-Providern |
  | `plugin-sdk/provider-web-search-config-contract` | Hilfsfunktionen für die Web-Search-Konfiguration von Providern | Schmale Hilfsfunktionen für Web-Search-Konfiguration/Credentials für Provider, die keine Verdrahtung zur Plugin-Aktivierung benötigen |
  | `plugin-sdk/provider-web-search-contract` | Hilfsfunktionen für den Web-Search-Vertrag von Providern | Schmale Hilfsfunktionen für den Web-Search-Konfigurations-/Credential-Vertrag wie `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` und bereichsbezogene Setter/Getter für Credentials |
  | `plugin-sdk/provider-web-search` | Hilfsfunktionen für Provider-Web-Search | Hilfsfunktionen für Registrierung/Cache/Laufzeit von Web-Search-Providern |
  | `plugin-sdk/provider-tools` | Hilfsfunktionen für Provider-Tool-/Schema-Kompatibilität | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, Gemini-Schema-Bereinigung + Diagnosen und xAI-Kompatibilitätsfunktionen wie `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
  | `plugin-sdk/provider-usage` | Hilfsfunktionen für Provider-Nutzung | `fetchClaudeUsage`, `fetchGeminiUsage`, `fetchGithubCopilotUsage` und weitere Hilfsfunktionen für Provider-Nutzung |
  | `plugin-sdk/provider-stream` | Hilfsfunktionen für Provider-Stream-Wrapper | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, Typen für Stream-Wrapper und gemeinsame Hilfsfunktionen für Wrapper von Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
  | `plugin-sdk/provider-transport-runtime` | Hilfsfunktionen für Provider-Transport | Native Hilfsfunktionen für Provider-Transport wie guarded fetch, Transformationen von Transportnachrichten und beschreibbare Transport-Event-Streams |
  | `plugin-sdk/keyed-async-queue` | Geordnete asynchrone Queue | `KeyedAsyncQueue` |
  | `plugin-sdk/media-runtime` | Gemeinsame Medienhilfsfunktionen | Hilfsfunktionen für Medienabruf/-transformation/-speicherung sowie Builder für Medien-Payloads |
  | `plugin-sdk/media-generation-runtime` | Gemeinsame Hilfsfunktionen für Medienerzeugung | Gemeinsame Hilfsfunktionen für Failover, Kandidatenauswahl und Meldungen bei fehlenden Modellen für Bild-/Video-/Musikerzeugung |
  | `plugin-sdk/media-understanding` | Hilfsfunktionen für Medienverständnis | Providertypen für Medienverständnis sowie providerseitige Exporte für Bild-/Audiohilfsfunktionen |
  | `plugin-sdk/text-runtime` | Gemeinsame Texthilfsfunktionen | Entfernen assistentensichtbaren Texts, Hilfsfunktionen für Rendering/Chunking/Tabellen von Markdown, Redaction-Hilfsfunktionen, Hilfsfunktionen für Directive-Tags, Safe-Text-Utilities und verwandte Hilfsfunktionen für Text/Logging |
  | `plugin-sdk/text-chunking` | Hilfsfunktionen für Text-Chunking | Hilfsfunktion für das Chunking ausgehender Texte |
  | `plugin-sdk/speech` | Hilfsfunktionen für Speech | Speech-Providertypen sowie providerseitige Hilfsfunktionen für Direktiven, Register und Validierung |
  | `plugin-sdk/speech-core` | Gemeinsamer Speech-Core | Speech-Providertypen, Register, Direktiven, Normalisierung |
  | `plugin-sdk/realtime-transcription` | Hilfsfunktionen für Realtime-Transkription | Providertypen, Hilfsfunktionen für Register und gemeinsame Hilfsfunktion für WebSocket-Sitzungen |
  | `plugin-sdk/realtime-voice` | Hilfsfunktionen für Realtime-Voice | Providertypen, Hilfsfunktionen für Register/Auflösung und Hilfsfunktionen für Bridge-Sitzungen |
  | `plugin-sdk/image-generation-core` | Gemeinsamer Bildgenerierungs-Core | Hilfsfunktionen für Bildgenerierungstypen, Failover, Auth und Register |
  | `plugin-sdk/music-generation` | Hilfsfunktionen für Musikerzeugung | Provider-/Request-/Ergebnis-Typen für Musikerzeugung |
  | `plugin-sdk/music-generation-core` | Gemeinsamer Musikerzeugungs-Core | Hilfsfunktionen für Musikerzeugungstypen, Failover, Provider-Suche und Parsing von Modellreferenzen |
  | `plugin-sdk/video-generation` | Hilfsfunktionen für Videoerzeugung | Provider-/Request-/Ergebnis-Typen für Videoerzeugung |
  | `plugin-sdk/video-generation-core` | Gemeinsamer Videoerzeugungs-Core | Hilfsfunktionen für Videoerzeugungstypen, Failover, Provider-Suche und Parsing von Modellreferenzen |
  | `plugin-sdk/interactive-runtime` | Hilfsfunktionen für interaktive Antworten | Normalisierung/Reduktion interaktiver Antwort-Payloads |
  | `plugin-sdk/channel-config-primitives` | Primitive für Kanalkonfiguration | Schmale Primitive für Kanal-Konfigurationsschemas |
  | `plugin-sdk/channel-config-writes` | Hilfsfunktionen für Schreibvorgänge in die Kanalkonfiguration | Hilfsfunktionen für die Autorisierung von Schreibvorgängen in die Kanalkonfiguration |
  | `plugin-sdk/channel-plugin-common` | Gemeinsame Kanal-Präambel | Gemeinsame Exporte für die Präambel von Kanal-Plugins |
  | `plugin-sdk/channel-status` | Hilfsfunktionen für Kanalstatus | Gemeinsame Hilfsfunktionen für Snapshots/Zusammenfassungen des Kanalstatus |
  | `plugin-sdk/allowlist-config-edit` | Hilfsfunktionen für die Allowlist-Konfiguration | Hilfsfunktionen zum Bearbeiten/Lesen der Allowlist-Konfiguration |
  | `plugin-sdk/group-access` | Hilfsfunktionen für Gruppenzugriff | Gemeinsame Hilfsfunktionen für Entscheidungen zum Gruppenzugriff |
  | `plugin-sdk/direct-dm` | Hilfsfunktionen für direkte DMs | Gemeinsame Hilfsfunktionen für Auth/Guards direkter DMs |
  | `plugin-sdk/extension-shared` | Gemeinsame Hilfsfunktionen für Erweiterungen | Primitive für passive Kanal-/Status- und ambient-proxy-Hilfsfunktionen |
  | `plugin-sdk/webhook-targets` | Hilfsfunktionen für Webhook-Ziele | Register für Webhook-Ziele und Hilfsfunktionen zur Routeninstallation |
  | `plugin-sdk/webhook-path` | Hilfsfunktionen für Webhook-Pfade | Hilfsfunktionen zur Normalisierung von Webhook-Pfaden |
  | `plugin-sdk/web-media` | Gemeinsame Hilfsfunktionen für Web-Medien | Hilfsfunktionen zum Laden entfernter/lokaler Medien |
  | `plugin-sdk/zod` | Zod-Re-Export | Re-exportiertes `zod` für Konsumenten des Plugin SDK |
  | `plugin-sdk/memory-core` | Gebündelte Hilfsfunktionen für memory-core | Hilfsoberfläche für Speicher-Manager/Konfiguration/Datei/CLI |
  | `plugin-sdk/memory-core-engine-runtime` | Laufzeit-Fassade für Memory-Engine | Laufzeit-Fassade für Speicherindex/-suche |
  | `plugin-sdk/memory-core-host-engine-foundation` | Foundation-Engine des Memory-Hosts | Exporte der Foundation-Engine des Memory-Hosts |
  | `plugin-sdk/memory-core-host-engine-embeddings` | Embedding-Engine des Memory-Hosts | Embedding-Verträge für Speicher, Registerzugriff, lokaler Provider und generische Hilfsfunktionen für Batch/Remote; konkrete Remote-Provider leben in ihren owning plugins |
  | `plugin-sdk/memory-core-host-engine-qmd` | QMD-Engine des Memory-Hosts | Exporte der QMD-Engine des Memory-Hosts |
  | `plugin-sdk/memory-core-host-engine-storage` | Storage-Engine des Memory-Hosts | Exporte der Storage-Engine des Memory-Hosts |
  | `plugin-sdk/memory-core-host-multimodal` | Multimodale Hilfsfunktionen für den Memory-Host | Multimodale Hilfsfunktionen für den Memory-Host |
  | `plugin-sdk/memory-core-host-query` | Abfragehilfsfunktionen für den Memory-Host | Abfragehilfsfunktionen für den Memory-Host |
  | `plugin-sdk/memory-core-host-secret` | Secret-Hilfsfunktionen für den Memory-Host | Secret-Hilfsfunktionen für den Memory-Host |
  | `plugin-sdk/memory-core-host-events` | Hilfsfunktionen für das Ereignisjournal des Memory-Hosts | Hilfsfunktionen für das Ereignisjournal des Memory-Hosts |
  | `plugin-sdk/memory-core-host-status` | Statushilfsfunktionen für den Memory-Host | Statushilfsfunktionen für den Memory-Host |
  | `plugin-sdk/memory-core-host-runtime-cli` | CLI-Laufzeit des Memory-Hosts | CLI-Laufzeithilfsfunktionen für den Memory-Host |
  | `plugin-sdk/memory-core-host-runtime-core` | Core-Laufzeit des Memory-Hosts | Core-Laufzeithilfsfunktionen für den Memory-Host |
  | `plugin-sdk/memory-core-host-runtime-files` | Datei-/Laufzeithilfsfunktionen für den Memory-Host | Datei-/Laufzeithilfsfunktionen für den Memory-Host |
  | `plugin-sdk/memory-host-core` | Alias für die Core-Laufzeit des Memory-Hosts | Anbieterneutraler Alias für Core-Laufzeithilfsfunktionen des Memory-Hosts |
  | `plugin-sdk/memory-host-events` | Alias für das Ereignisjournal des Memory-Hosts | Anbieterneutraler Alias für Hilfsfunktionen des Ereignisjournals des Memory-Hosts |
  | `plugin-sdk/memory-host-files` | Alias für Datei-/Laufzeit des Memory-Hosts | Anbieterneutraler Alias für Datei-/Laufzeithilfsfunktionen des Memory-Hosts |
  | `plugin-sdk/memory-host-markdown` | Hilfsfunktionen für verwaltetes Markdown | Gemeinsame Hilfsfunktionen für verwaltetes Markdown für speichernahe Plugins |
  | `plugin-sdk/memory-host-search` | Fassade für Active Memory-Suche | Lazy Laufzeit-Fassade für den Suchmanager von Active Memory |
  | `plugin-sdk/memory-host-status` | Alias für den Status des Memory-Hosts | Anbieterneutraler Alias für Statushilfsfunktionen des Memory-Hosts |
  | `plugin-sdk/memory-lancedb` | Gebündelte Hilfsfunktionen für memory-lancedb | Hilfsoberfläche für Memory-lancedb |
  | `plugin-sdk/testing` | Test-Utilities | Testhilfsfunktionen und Mocks |
</Accordion>

Diese Tabelle ist absichtlich die häufige Migrations-Teilmenge, nicht die vollständige Oberfläche des SDK. Die vollständige Liste mit mehr als 200 Einstiegspunkten befindet sich in
`scripts/lib/plugin-sdk-entrypoints.json`.

Diese Liste enthält weiterhin einige Hilfs-Seams für gebündelte Plugins wie
`plugin-sdk/feishu`, `plugin-sdk/feishu-setup`, `plugin-sdk/zalo`,
`plugin-sdk/zalo-setup` und `plugin-sdk/matrix*`. Diese bleiben für die Pflege gebündelter Plugins und für Kompatibilität exportiert, sind aber absichtlich nicht in der häufigen Migrationstabelle enthalten und nicht das empfohlene Ziel für neuen Plugin-Code.

Dieselbe Regel gilt für andere Familien gebündelter Hilfsfunktionen wie:

- Hilfsfunktionen für Browser-Unterstützung: `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support`
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

Verwenden Sie den schmalsten Import, der zur Aufgabe passt. Wenn Sie einen Export nicht finden können, prüfen Sie den Quellcode unter `src/plugin-sdk/` oder fragen Sie in Discord.

## Aktive Deprecations

Schmalere Deprecations, die für Plugin SDK, Provider-Vertrag,
Laufzeitoberfläche und Manifest gelten. Jede davon funktioniert heute noch, wird aber in einer zukünftigen Major-Release entfernt. Der Eintrag unter jedem Punkt ordnet die alte API ihrer kanonischen Ersetzung zu.

<AccordionGroup>
  <Accordion title="command-auth-Hilfsfunktionen für Hilfe → command-status">
    **Alt (`openclaw/plugin-sdk/command-auth`)**: `buildCommandsMessage`,
    `buildCommandsMessagePaginated`, `buildHelpMessage`.

    **Neu (`openclaw/plugin-sdk/command-status`)**: gleiche Signaturen, gleiche
    Exporte — nur aus dem schmaleren Unterpfad importiert. `command-auth`
    re-exportiert sie als Kompatibilitäts-Stubs.

    ```typescript
    // Vorher
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-auth";

    // Nachher
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-status";
    ```

  </Accordion>

  <Accordion title="Hilfsfunktionen für Erwähnungs-Gating → resolveInboundMentionDecision">
    **Alt**: `resolveInboundMentionRequirement({ facts, policy })` und
    `shouldDropInboundForMention(...)` aus
    `openclaw/plugin-sdk/channel-inbound` oder
    `openclaw/plugin-sdk/channel-mention-gating`.

    **Neu**: `resolveInboundMentionDecision({ facts, policy })` — gibt ein
    einzelnes Entscheidungsobjekt statt zweier getrennter Aufrufe zurück.

    Nachgelagerte Kanal-Plugins (Slack, Discord, Matrix, Microsoft Teams) haben bereits umgestellt.

  </Accordion>

  <Accordion title="Kanal-Laufzeit-Shim und Hilfsfunktionen für Kanal-Aktionen">
    `openclaw/plugin-sdk/channel-runtime` ist ein Kompatibilitäts-Shim für ältere
    Kanal-Plugins. Importieren Sie ihn nicht in neuem Code; verwenden Sie
    `openclaw/plugin-sdk/channel-runtime-context` zum Registrieren von Laufzeitobjekten.

    Hilfsfunktionen `channelActions*` in `openclaw/plugin-sdk/channel-actions` sind
    zusammen mit rohen Kanal-Exporten für „actions“ veraltet. Stellen Sie Fähigkeiten
    stattdessen über die semantische `presentation`-Oberfläche bereit — Kanal-Plugins
    deklarieren, was sie rendern (Cards, Buttons, Selects), statt welche rohen
    Aktionsnamen sie akzeptieren.

  </Accordion>

  <Accordion title="Web-Search-Provider-Hilfsfunktion tool() → createTool() im Plugin">
    **Alt**: Factory `tool()` aus `openclaw/plugin-sdk/provider-web-search`.

    **Neu**: Implementieren Sie `createTool(...)` direkt im Provider-Plugin.
    OpenClaw benötigt die SDK-Hilfsfunktion nicht mehr, um den Tool-Wrapper zu registrieren.

  </Accordion>

  <Accordion title="Plaintext-Kanal-Envelopes → BodyForAgent">
    **Alt**: `formatInboundEnvelope(...)` (und
    `ChannelMessageForAgent.channelEnvelope`), um einen flachen Plaintext-Prompt-
    Envelope aus eingehenden Kanalnachrichten zu erstellen.

    **Neu**: `BodyForAgent` plus strukturierte Benutzerkontext-Blöcke. Kanal-
    Plugins hängen Routing-Metadaten (Thread, Thema, Reply-to, Reaktionen) als
    typisierte Felder an, statt sie in einen Prompt-String zu verketten. Die
    Hilfsfunktion `formatAgentEnvelope(...)` wird für synthetisierte
    assistant-seitige Envelopes weiterhin unterstützt, aber eingehende Plaintext-
    Envelopes werden schrittweise abgeschafft.

    Betroffene Bereiche: `inbound_claim`, `message_received` und jedes benutzerdefinierte
    Kanal-Plugin, das den Text von `channelEnvelope` nachverarbeitet hat.

  </Accordion>

  <Accordion title="Typen für Provider-Discovery → Typen für Provider-Kataloge">
    Vier Alias-Typen für Discovery sind jetzt dünne Wrapper um die
    Typen aus der Katalog-Ära:

    | Alter Alias               | Neuer Typ                |
    | ------------------------- | ------------------------ |
    | `ProviderDiscoveryOrder`  | `ProviderCatalogOrder`   |
    | `ProviderDiscoveryContext`| `ProviderCatalogContext` |
    | `ProviderDiscoveryResult` | `ProviderCatalogResult`  |
    | `ProviderPluginDiscovery` | `ProviderPluginCatalog`  |

    Dazu kommt das veraltete statische Objekt `ProviderCapabilities` — Provider-Plugins
    sollten Fähigkeitsfakten über den Vertrag der Provider-Laufzeit anhängen
    statt über ein statisches Objekt.

  </Accordion>

  <Accordion title="Thinking-Policy-Hooks → resolveThinkingProfile">
    **Alt** (drei separate Hooks auf `ProviderThinkingPolicy`):
    `isBinaryThinking(ctx)`, `supportsXHighThinking(ctx)` und
    `resolveDefaultThinkingLevel(ctx)`.

    **Neu**: ein einzelnes `resolveThinkingProfile(ctx)`, das ein
    `ProviderThinkingProfile` mit der kanonischen `id`, optionalem `label` und
    einer nach Rang geordneten Ebenenliste zurückgibt. OpenClaw stuft veraltete
    gespeicherte Werte nach Profilrang automatisch herab.

    Implementieren Sie einen Hook statt drei. Die veralteten Hooks funktionieren
    während des Deprecation-Fensters weiter, werden aber nicht mit dem Profilergebnis kombiniert.

  </Accordion>

  <Accordion title="Fallback für externen OAuth-Provider → contracts.externalAuthProviders">
    **Alt**: Implementierung von `resolveExternalOAuthProfiles(...)`, ohne
    den Provider im Plugin-Manifest zu deklarieren.

    **Neu**: Deklarieren Sie `contracts.externalAuthProviders` im Plugin-Manifest
    **und** implementieren Sie `resolveExternalAuthProfiles(...)`. Der alte Pfad
    für „auth fallback“ gibt zur Laufzeit eine Warnung aus und wird entfernt.

    ```json
    {
      "contracts": {
        "externalAuthProviders": ["anthropic", "openai"]
      }
    }
    ```

  </Accordion>

  <Accordion title="Suche nach Provider-Env-Var → setup.providers[].envVars">
    **Altes** Manifest-Feld: `providerAuthEnvVars: { anthropic: ["ANTHROPIC_API_KEY"] }`.

    **Neu**: Spiegeln Sie dieselbe Suche nach Env-Vars in `setup.providers[].envVars`
    im Manifest wider. Dadurch werden Env-Metadaten für Setup/Status an einer
    Stelle konsolidiert, und die Plugin-Laufzeit muss nicht gestartet werden,
    nur um Env-Var-Lookups zu beantworten.

    `providerAuthEnvVars` bleibt über einen Kompatibilitätsadapter unterstützt,
    bis das Deprecation-Fenster geschlossen wird.

  </Accordion>

  <Accordion title="Registrierung von Memory-Plugins → registerMemoryCapability">
    **Alt**: drei separate Aufrufe —
    `api.registerMemoryPromptSection(...)`,
    `api.registerMemoryFlushPlan(...)`,
    `api.registerMemoryRuntime(...)`.

    **Neu**: ein Aufruf auf der API für den Speicherzustand —
    `registerMemoryCapability(pluginId, { promptBuilder, flushPlanResolver, runtime })`.

    Gleiche Slots, ein einzelner Registrierungsaufruf. Additive Speicherhilfsfunktionen
    (`registerMemoryPromptSupplement`, `registerMemoryCorpusSupplement`,
    `registerMemoryEmbeddingProvider`) sind nicht betroffen.

  </Accordion>

  <Accordion title="Typen für Subagent-Sitzungsnachrichten umbenannt">
    Zwei veraltete Alias-Typen werden weiterhin aus `src/plugins/runtime/types.ts` exportiert:

    | Alt                         | Neu                            |
    | --------------------------- | ------------------------------ |
    | `SubagentReadSessionParams` | `SubagentGetSessionMessagesParams` |
    | `SubagentReadSessionResult` | `SubagentGetSessionMessagesResult` |

    Die Laufzeitmethode `readSession` ist zugunsten von
    `getSessionMessages` veraltet. Gleiche Signatur; die alte Methode ruft die
    neue auf.

  </Accordion>

  <Accordion title="runtime.tasks.flow → runtime.tasks.flows">
    **Alt**: `runtime.tasks.flow` (Singular) gab einen Live-Accessor für TaskFlow zurück.

    **Neu**: `runtime.tasks.flows` (Plural) gibt DTO-basierten Zugriff auf TaskFlow zurück,
    der importsicher ist und nicht erfordert, dass die vollständige Task-Laufzeit geladen wird.

    ```typescript
    // Vorher
    const flow = api.runtime.tasks.flow(ctx);
    // Nachher
    const flows = api.runtime.tasks.flows(ctx);
    ```

  </Accordion>

  <Accordion title="Embedded Extension Factories → Agent-Tool-Result-Middleware">
    Behandelt in „Migration → Pi-Tool-Result-Erweiterungen auf
    Middleware migrieren“ oben. Hier der Vollständigkeit halber: der entfernte, nur für Pi
    verfügbare Pfad `api.registerEmbeddedExtensionFactory(...)` wird ersetzt durch
    `api.registerAgentToolResultMiddleware(...)` mit einer expliziten Laufzeit-
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
`extensions/`) werden innerhalb ihrer eigenen Barrels `api.ts` und `runtime-api.ts`
nachverfolgt. Sie betreffen keine Plugin-Verträge von Drittanbietern und sind hier nicht aufgeführt.
Wenn Sie das lokale Barrel eines gebündelten Plugins direkt verwenden, lesen Sie vor dem
Upgrade die Deprecation-Kommentare in diesem Barrel.
</Note>

## Zeitplan für die Entfernung

| Wann                   | Was passiert                                                           |
| ---------------------- | ---------------------------------------------------------------------- |
| **Jetzt**              | Veraltete Oberflächen geben Laufzeitwarnungen aus                      |
| **Nächste Major-Release** | Veraltete Oberflächen werden entfernt; Plugins, die sie noch verwenden, schlagen fehl |

Alle Core-Plugins wurden bereits migriert. Externe Plugins sollten vor der nächsten Major-Release migrieren.

## Warnungen vorübergehend unterdrücken

Setzen Sie diese Umgebungsvariablen, während Sie an der Migration arbeiten:

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

Dies ist ein vorübergehender Escape Hatch, keine dauerhafte Lösung.

## Verwandte Inhalte

- [Erste Schritte](/de/plugins/building-plugins) — Ihr erstes Plugin erstellen
- [SDK-Überblick](/de/plugins/sdk-overview) — vollständige Referenz für Unterpfad-Importe
- [Kanal-Plugins](/de/plugins/sdk-channel-plugins) — Kanal-Plugins erstellen
- [Provider-Plugins](/de/plugins/sdk-provider-plugins) — Provider-Plugins erstellen
- [Plugin-Interna](/de/plugins/architecture) — tiefgehender Einblick in die Architektur
- [Plugin-Manifest](/de/plugins/manifest) — Referenz für das Manifest-Schema
