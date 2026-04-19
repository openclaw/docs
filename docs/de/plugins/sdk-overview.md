---
read_when:
    - Sie müssen wissen, aus welchem SDK-Subpfad importiert werden soll
    - Sie möchten eine Referenz für alle Registrierungsmethoden in OpenClawPluginApi
    - Sie suchen einen bestimmten SDK-Export heraus
sidebarTitle: SDK Overview
summary: Import-Map, Referenz zur Registrierungs-API und SDK-Architektur
title: Plugin SDK – Übersicht
x-i18n:
    generated_at: "2026-04-19T01:11:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: 522c2c542bc0ea4793541fda18931b963ad71f07e9c83e4f22f05184eb1ba91a
    source_path: plugins/sdk-overview.md
    workflow: 15
---

# Plugin SDK – Übersicht

Das Plugin SDK ist der typisierte Vertrag zwischen Plugins und dem Core. Diese Seite ist die
Referenz für **was importiert werden soll** und **was registriert werden kann**.

<Tip>
  **Suchen Sie nach einer Schritt-für-Schritt-Anleitung?**
  - Erstes Plugin? Beginnen Sie mit [Getting Started](/de/plugins/building-plugins)
  - Kanal-Plugin? Siehe [Channel Plugins](/de/plugins/sdk-channel-plugins)
  - Provider-Plugin? Siehe [Provider Plugins](/de/plugins/sdk-provider-plugins)
</Tip>

## Importkonvention

Importieren Sie immer aus einem spezifischen Subpfad:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

Jeder Subpfad ist ein kleines, in sich geschlossenes Modul. Das hält den Start schnell und
verhindert Probleme mit zirkulären Abhängigkeiten. Für kanalspezifische Entry-/Build-Helfer
bevorzugen Sie `openclaw/plugin-sdk/channel-core`; verwenden Sie `openclaw/plugin-sdk/core` für
die breitere Oberflächen-API und gemeinsame Helfer wie
`buildChannelConfigSchema`.

Fügen Sie keine providerbenannten Convenience-Seams hinzu und hängen Sie nicht von solchen ab, wie
`openclaw/plugin-sdk/slack`, `openclaw/plugin-sdk/discord`,
`openclaw/plugin-sdk/signal`, `openclaw/plugin-sdk/whatsapp` oder
kanalgebrandeten Helper-Seams. Gebündelte Plugins sollten generische
SDK-Subpfade innerhalb ihrer eigenen `api.ts`- oder `runtime-api.ts`-Barrels zusammensetzen, und der Core
sollte entweder diese pluginlokalen Barrels verwenden oder einen schmalen generischen SDK-
Vertrag hinzufügen, wenn der Bedarf tatsächlich kanalübergreifend ist.

Die generierte Export-Map enthält weiterhin eine kleine Menge gebündelter Plugin-Helper-Seams
wie `plugin-sdk/feishu`, `plugin-sdk/feishu-setup`,
`plugin-sdk/zalo`, `plugin-sdk/zalo-setup` und `plugin-sdk/matrix*`. Diese
Subpfade existieren nur für die Wartung gebündelter Plugins und zur Kompatibilität; sie werden
in der gemeinsamen Tabelle unten bewusst ausgelassen und sind nicht der empfohlene
Importpfad für neue Drittanbieter-Plugins.

## Subpfad-Referenz

Die am häufigsten verwendeten Subpfade, nach Zweck gruppiert. Die generierte vollständige Liste mit
mehr als 200 Subpfaden befindet sich in `scripts/lib/plugin-sdk-entrypoints.json`.

Reservierte Helper-Subpfade für gebündelte Plugins erscheinen weiterhin in dieser generierten Liste.
Behandeln Sie diese als Implementierungsdetail-/Kompatibilitätsoberflächen, sofern nicht eine Dokuseite
eine davon ausdrücklich als öffentlich bewirbt.

### Plugin-Entry

| Subpfad                    | Wichtige Exporte                                                                                                                       |
| -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/plugin-entry`   | `definePluginEntry`                                                                                                                    |
| `plugin-sdk/core`           | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema` |
| `plugin-sdk/config-schema`  | `OpenClawSchema`                                                                                                                       |
| `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry`                                                                                                      |

<AccordionGroup>
  <Accordion title="Kanal-Subpfade">
    | Subpfad | Wichtige Exporte |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | Root-`openclaw.json`-Zod-Schemaexport (`OpenClawSchema`) |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, plus `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | Gemeinsame Setup-Wizard-Helfer, Allowlist-Eingabeaufforderungen, Builder für Setup-Status |
    | `plugin-sdk/setup-runtime` | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | `createEnvPatchedAccountSetupAdapter` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | Hilfen für Multi-Account-Konfiguration/Aktions-Gates, Hilfen für Default-Account-Fallback |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, Hilfen zur Normalisierung von Account-IDs |
    | `plugin-sdk/account-resolution` | Account-Lookup + Hilfen für Default-Fallback |
    | `plugin-sdk/account-helpers` | Schmale Hilfen für Account-Liste/Account-Aktionen |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | `createChannelReplyPipeline` |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter` |
    | `plugin-sdk/channel-config-schema` | Typen für Kanalkonfigurationsschemas |
    | `plugin-sdk/telegram-command-config` | Hilfen zur Normalisierung/Validierung benutzerdefinierter Telegram-Befehle mit gebündeltem Vertrags-Fallback |
    | `plugin-sdk/command-gating` | Schmale Hilfen für Command-Autorisierungs-Gates |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-lifecycle` | `createAccountStatusSink` |
    | `plugin-sdk/inbound-envelope` | Gemeinsame Hilfen für eingehende Routen + Envelope-Builder |
    | `plugin-sdk/inbound-reply-dispatch` | Gemeinsame Hilfen zum Erfassen und Dispatchen eingehender Daten |
    | `plugin-sdk/messaging-targets` | Hilfen zum Parsen/Abgleichen von Zielen |
    | `plugin-sdk/outbound-media` | Gemeinsame Hilfen zum Laden ausgehender Medien |
    | `plugin-sdk/outbound-runtime` | Hilfen für ausgehende Identität/Sende-Delegation |
    | `plugin-sdk/poll-runtime` | Schmale Hilfen zur Umfrage-Normalisierung |
    | `plugin-sdk/thread-bindings-runtime` | Hilfen für Lebenszyklus und Adapter von Thread-Bindings |
    | `plugin-sdk/agent-media-payload` | Legacy-Builder für Agent-Medien-Payloads |
    | `plugin-sdk/conversation-runtime` | Hilfen für Konversations-/Thread-Binding, Pairing und konfigurierte Bindings |
    | `plugin-sdk/runtime-config-snapshot` | Hilfsfunktion für Runtime-Konfigurations-Snapshots |
    | `plugin-sdk/runtime-group-policy` | Hilfen zur Auflösung von Runtime-Gruppenrichtlinien |
    | `plugin-sdk/channel-status` | Gemeinsame Hilfen für Snapshots/Zusammenfassungen des Kanalstatus |
    | `plugin-sdk/channel-config-primitives` | Schmale Primitive für Kanalkonfigurationsschemas |
    | `plugin-sdk/channel-config-writes` | Hilfen für die Autorisierung von Kanalkonfigurations-Schreibvorgängen |
    | `plugin-sdk/channel-plugin-common` | Gemeinsame Prelude-Exporte für Kanal-Plugins |
    | `plugin-sdk/allowlist-config-edit` | Hilfen zum Bearbeiten/Lesen von Allowlist-Konfigurationen |
    | `plugin-sdk/group-access` | Gemeinsame Hilfen für Entscheidungen zum Gruppenzugriff |
    | `plugin-sdk/direct-dm` | Gemeinsame Hilfen für Auth/Guards bei direkten DMs |
    | `plugin-sdk/interactive-runtime` | Hilfen zur Normalisierung/Reduktion interaktiver Antwort-Payloads |
    | `plugin-sdk/channel-inbound` | Kompatibilitäts-Barrel für Inbound-Debounce, Mention-Abgleich, Mention-Policy-Helfer und Envelope-Helfer |
    | `plugin-sdk/channel-mention-gating` | Schmale Mention-Policy-Helfer ohne die breitere Inbound-Runtime-Oberfläche |
    | `plugin-sdk/channel-location` | Hilfen für Kanallokationskontext und Formatierung |
    | `plugin-sdk/channel-logging` | Kanal-Logging-Helfer für eingehende Drops und Fehler bei Typing/Ack |
    | `plugin-sdk/channel-send-result` | Antwortergebnis-Typen |
    | `plugin-sdk/channel-actions` | `createMessageToolButtonsSchema`, `createMessageToolCardSchema` |
    | `plugin-sdk/channel-targets` | Hilfen zum Parsen/Abgleichen von Zielen |
    | `plugin-sdk/channel-contract` | Kanalvertragstypen |
    | `plugin-sdk/channel-feedback` | Verdrahtung von Feedback/Reaktionen |
    | `plugin-sdk/channel-secret-runtime` | Schmale Secret-Contract-Helfer wie `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment` und Secret-Zieltypen |
  </Accordion>

  <Accordion title="Provider-Subpfade">
    | Subpfad | Wichtige Exporte |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/provider-setup` | Kuratierte Setup-Helfer für lokale/selbst gehostete Provider |
    | `plugin-sdk/self-hosted-provider-setup` | Fokussierte Setup-Helfer für OpenAI-kompatible selbst gehostete Provider |
    | `plugin-sdk/cli-backend` | CLI-Backend-Standards + Watchdog-Konstanten |
    | `plugin-sdk/provider-auth-runtime` | Runtime-Hilfen zur Auflösung von API-Schlüsseln für Provider-Plugins |
    | `plugin-sdk/provider-auth-api-key` | Hilfen für API-Schlüssel-Onboarding/Profilschreibvorgänge wie `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | Standard-Builder für OAuth-Auth-Ergebnisse |
    | `plugin-sdk/provider-auth-login` | Gemeinsame Hilfen für interaktive Anmeldung bei Provider-Plugins |
    | `plugin-sdk/provider-env-vars` | Hilfen zum Lookup von Auth-Umgebungsvariablen für Provider |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, gemeinsame Builder für Replay-Richtlinien, Hilfen für Provider-Endpunkte und Hilfen zur Normalisierung von Modell-IDs wie `normalizeNativeXaiModelId` |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | Generische Hilfen für HTTP/Endpunkt-Fähigkeiten von Providern |
    | `plugin-sdk/provider-web-fetch-contract` | Schmale Vertragshilfen für Konfiguration/Auswahl von Web-Fetch wie `enablePluginInConfig` und `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | Hilfen für Registrierung/Cache von Web-Fetch-Providern |
    | `plugin-sdk/provider-web-search-config-contract` | Schmale Hilfen für Web-Search-Konfiguration/Credentials für Provider, die keine Plugin-Enable-Verdrahtung benötigen |
    | `plugin-sdk/provider-web-search-contract` | Schmale Vertragshilfen für Web-Search-Konfiguration/Credentials wie `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` und bereichsspezifische Setter/Getter für Credentials |
    | `plugin-sdk/provider-web-search` | Hilfen für Registrierung/Cache/Runtime von Web-Search-Providern |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, Gemini-Schema-Bereinigung + Diagnose sowie xAI-Kompatibilitätshilfen wie `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
    | `plugin-sdk/provider-usage` | `fetchClaudeUsage` und ähnliche |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, Stream-Wrapper-Typen und gemeinsame Wrapper-Helfer für Anthropic/Bedrock/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
    | `plugin-sdk/provider-transport-runtime` | Native Hilfen für Provider-Transport wie guarded fetch, Transportnachrichten-Transformationen und beschreibbare Transport-Event-Streams |
    | `plugin-sdk/provider-onboard` | Hilfen zum Patchen der Onboarding-Konfiguration |
    | `plugin-sdk/global-singleton` | Hilfen für prozesslokale Singletons/Maps/Caches |
  </Accordion>

  <Accordion title="Auth- und Sicherheits-Subpfade">
    | Subpfad | Wichtige Exporte |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, Hilfen für Befehlsregister, Hilfen für Sender-Autorisierung |
    | `plugin-sdk/command-status` | Builder für Befehls-/Hilfenachrichten wie `buildCommandsMessagePaginated` und `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | Hilfen für Approver-Auflösung und Action-Auth im selben Chat |
    | `plugin-sdk/approval-client-runtime` | Hilfen für native Ausführungsfreigabe-Profile/-Filter |
    | `plugin-sdk/approval-delivery-runtime` | Native Adapter für Freigabefähigkeiten/-zustellung |
    | `plugin-sdk/approval-gateway-runtime` | Gemeinsame Hilfsfunktion für die Auflösung des Freigabe-Gateways |
    | `plugin-sdk/approval-handler-adapter-runtime` | Leichtgewichtige Hilfen zum Laden nativer Freigabe-Adapter für Hot-Channel-Entrypoints |
    | `plugin-sdk/approval-handler-runtime` | Breitere Runtime-Helfer für Freigabe-Handler; bevorzugen Sie die schmaleren Adapter-/Gateway-Seams, wenn diese ausreichen |
    | `plugin-sdk/approval-native-runtime` | Hilfen für native Freigabeziele + Account-Bindings |
    | `plugin-sdk/approval-reply-runtime` | Hilfen für Antwort-Payloads bei Ausführungs-/Plugin-Freigaben |
    | `plugin-sdk/command-auth-native` | Native Befehlsauthentifizierung + native Hilfen für Session-Ziele |
    | `plugin-sdk/command-detection` | Gemeinsame Hilfen zur Befehlserkennung |
    | `plugin-sdk/command-surface` | Hilfen zur Normalisierung von Befehls-Body und zur Befehlsoberfläche |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | Schmale Hilfen zur Secret-Contract-Sammlung für Secret-Oberflächen von Kanälen/Plugins |
    | `plugin-sdk/secret-ref-runtime` | Schmale Hilfen für `coerceSecretRef` und SecretRef-Typisierung für Secret-Contract-/Konfigurations-Parsing |
    | `plugin-sdk/security-runtime` | Gemeinsame Hilfen für Vertrauen, DM-Gating, externe Inhalte und Secret-Sammlung |
    | `plugin-sdk/ssrf-policy` | Hilfen für Host-Allowlist und SSRF-Richtlinien für private Netzwerke |
    | `plugin-sdk/ssrf-dispatcher` | Schmale Hilfen für angeheftete Dispatcher ohne die breite Infra-Runtime-Oberfläche |
    | `plugin-sdk/ssrf-runtime` | Angehefteter Dispatcher, SSRF-geschütztes Fetch und Hilfen für SSRF-Richtlinien |
    | `plugin-sdk/secret-input` | Hilfen zum Parsen geheimer Eingaben |
    | `plugin-sdk/webhook-ingress` | Hilfen für Webhook-Anfragen/Ziele |
    | `plugin-sdk/webhook-request-guards` | Hilfen für Größe/Timeout von Request-Bodys |
  </Accordion>

  <Accordion title="Runtime- und Speicher-Subpfade">
    | Subpfad | Wichtige Exporte |
    | --- | --- |
    | `plugin-sdk/runtime` | Breite Runtime-/Logging-/Backup-/Plugin-Install-Helfer |
    | `plugin-sdk/runtime-env` | Schmale Hilfen für Runtime-Umgebung, Logger, Timeout, Retry und Backoff |
    | `plugin-sdk/channel-runtime-context` | Generische Hilfen für Registrierung und Lookup von Channel-Runtime-Kontexten |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Gemeinsame Hilfen für Plugin-Befehle/-Hooks/-HTTP/-Interaktionen |
    | `plugin-sdk/hook-runtime` | Gemeinsame Hilfen für Pipelines interner/Webhook-Hooks |
    | `plugin-sdk/lazy-runtime` | Hilfen für Lazy-Runtime-Import/-Binding wie `createLazyRuntimeModule`, `createLazyRuntimeMethod` und `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | Hilfen für die Prozessausführung |
    | `plugin-sdk/cli-runtime` | Hilfen für CLI-Formatierung, Warten und Version |
    | `plugin-sdk/gateway-runtime` | Hilfen für Gateway-Client und Kanalstatus-Patches |
    | `plugin-sdk/config-runtime` | Hilfen zum Laden/Schreiben von Konfigurationen |
    | `plugin-sdk/telegram-command-config` | Normalisierung von Telegram-Befehlsnamen/-beschreibungen und Prüfungen auf Duplikate/Konflikte, auch wenn die gebündelte Telegram-Vertragsoberfläche nicht verfügbar ist |
    | `plugin-sdk/text-autolink-runtime` | Erkennung von Autolinks für Dateireferenzen ohne das breite `text-runtime`-Barrel |
    | `plugin-sdk/approval-runtime` | Hilfen für Ausführungs-/Plugin-Freigabe, Builder für Freigabefähigkeiten, Auth-/Profil-Helfer, native Routing-/Runtime-Helfer |
    | `plugin-sdk/reply-runtime` | Gemeinsame Inbound-/Reply-Runtime-Helfer, Chunking, Dispatch, Heartbeat, Reply-Planer |
    | `plugin-sdk/reply-dispatch-runtime` | Schmale Hilfen für Reply-Dispatch/-Finalisierung |
    | `plugin-sdk/reply-history` | Gemeinsame Hilfen für kurzfristigen Antwortverlauf wie `buildHistoryContext`, `recordPendingHistoryEntry` und `clearHistoryEntriesIfEnabled` |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | Schmale Hilfen für Text-/Markdown-Chunking |
    | `plugin-sdk/session-store-runtime` | Hilfen für Session-Store-Pfade + `updated-at` |
    | `plugin-sdk/state-paths` | Hilfen für Pfade zu Status-/OAuth-Verzeichnissen |
    | `plugin-sdk/routing` | Hilfen für Route-/Session-Key-/Account-Bindings wie `resolveAgentRoute`, `buildAgentSessionKey` und `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | Gemeinsame Hilfen für Zusammenfassungen des Kanal-/Account-Status, Runtime-Status-Standards und Issue-Metadaten |
    | `plugin-sdk/target-resolver-runtime` | Gemeinsame Hilfen für Target-Resolver |
    | `plugin-sdk/string-normalization-runtime` | Hilfen zur Slug-/String-Normalisierung |
    | `plugin-sdk/request-url` | String-URLs aus Fetch-/Request-ähnlichen Eingaben extrahieren |
    | `plugin-sdk/run-command` | Zeitgesteuerter Command-Runner mit normalisierten `stdout`-/`stderr`-Ergebnissen |
    | `plugin-sdk/param-readers` | Gängige Param-Reader für Tools/CLI |
    | `plugin-sdk/tool-payload` | Normalisierte Payloads aus Tool-Ergebnisobjekten extrahieren |
    | `plugin-sdk/tool-send` | Kanonische Sendefelder für Ziele aus Tool-Argumenten extrahieren |
    | `plugin-sdk/temp-path` | Gemeinsame Hilfen für Temp-Download-Pfade |
    | `plugin-sdk/logging-core` | Hilfen für Subsystem-Logger und Redaction |
    | `plugin-sdk/markdown-table-runtime` | Hilfen für den Markdown-Tabellenmodus |
    | `plugin-sdk/json-store` | Kleine Hilfen zum Lesen/Schreiben von JSON-Status |
    | `plugin-sdk/file-lock` | Hilfen für reentrante Dateisperren |
    | `plugin-sdk/persistent-dedupe` | Hilfen für festplattenbasierte Dedupe-Caches |
    | `plugin-sdk/acp-runtime` | Hilfen für ACP-Runtime/Session und Reply-Dispatch |
    | `plugin-sdk/acp-binding-resolve-runtime` | Schreibgeschützte ACP-Binding-Auflösung ohne Lifecycle-Startup-Importe |
    | `plugin-sdk/agent-config-primitives` | Schmale Primitive für Agent-Runtime-Konfigurationsschemas |
    | `plugin-sdk/boolean-param` | Toleranter Boolean-Param-Reader |
    | `plugin-sdk/dangerous-name-runtime` | Hilfen zur Auflösung gefährlicher Namensabgleiche |
    | `plugin-sdk/device-bootstrap` | Hilfen für Device-Bootstrap und Pairing-Token |
    | `plugin-sdk/extension-shared` | Gemeinsame Primitive für passive Kanäle, Status und Ambient-Proxy-Helfer |
    | `plugin-sdk/models-provider-runtime` | Hilfen für `/models`-Befehle/Provider-Antworten |
    | `plugin-sdk/skill-commands-runtime` | Hilfen zum Auflisten von Skill-Befehlen |
    | `plugin-sdk/native-command-registry` | Hilfen für Build/Serialisierung nativer Befehlsregister |
    | `plugin-sdk/agent-harness` | Experimentelle Trusted-Plugin-Oberfläche für Agent-Harnesses auf niedriger Ebene: Harness-Typen, Hilfen zum Steuern/Abbrechen aktiver Läufe, OpenClaw-Tool-Bridge-Helfer und Utilities für Versuchsresultate |
    | `plugin-sdk/provider-zai-endpoint` | Hilfen zur Erkennung von Z.AI-Endpunkten |
    | `plugin-sdk/infra-runtime` | Hilfen für Systemereignisse/Heartbeat |
    | `plugin-sdk/collection-runtime` | Kleine Hilfen für begrenzte Caches |
    | `plugin-sdk/diagnostic-runtime` | Hilfen für Diagnose-Flags und -Ereignisse |
    | `plugin-sdk/error-runtime` | Fehlergraph, Formatierung, gemeinsame Hilfen zur Fehlerklassifizierung, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | Hilfen für Wrapped Fetch, Proxy und angeheftete Lookups |
    | `plugin-sdk/runtime-fetch` | Dispatcher-bewusstes Runtime-Fetch ohne Proxy-/Guarded-Fetch-Importe |
    | `plugin-sdk/response-limit-runtime` | Reader für begrenzte Response-Bodys ohne die breite Media-Runtime-Oberfläche |
    | `plugin-sdk/session-binding-runtime` | Aktueller Status von Konversations-Bindings ohne Routing konfigurierte Bindings oder Pairing-Stores |
    | `plugin-sdk/session-store-runtime` | Hilfen zum Lesen von Session-Stores ohne breite Konfigurationsschreib-/Wartungsimporte |
    | `plugin-sdk/context-visibility-runtime` | Auflösung der Kontextsichtigkeit und Filtern ergänzender Kontexte ohne breite Konfigurations-/Sicherheitsimporte |
    | `plugin-sdk/string-coerce-runtime` | Schmale Hilfen zur Coercion und Normalisierung primitiver Records/Strings ohne Markdown-/Logging-Importe |
    | `plugin-sdk/host-runtime` | Hilfen zur Normalisierung von Hostnamen und SCP-Hosts |
    | `plugin-sdk/retry-runtime` | Hilfen für Retry-Konfiguration und Retry-Runner |
    | `plugin-sdk/agent-runtime` | Hilfen für Agent-Verzeichnis, Identität und Workspace |
    | `plugin-sdk/directory-runtime` | Konfigurationsgestützte Verzeichnisabfrage/Deduplizierung |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Fähigkeits- und Test-Subpfade">
    | Subpfad | Wichtige Exporte |
    | --- | --- |
    | `plugin-sdk/media-runtime` | Gemeinsame Hilfen für Medienabruf/-umwandlung/-speicherung sowie Builder für Medien-Payloads |
    | `plugin-sdk/media-generation-runtime` | Gemeinsame Hilfen für Media-Generation-Failover, Kandidatenauswahl und Meldungen für fehlende Modelle |
    | `plugin-sdk/media-understanding` | Provider-Typen für Media Understanding sowie providerseitige Image-/Audio-Helper-Exporte |
    | `plugin-sdk/text-runtime` | Gemeinsame Hilfen für Text/Markdown/Logging wie das Entfernen agentensichtbaren Texts, Hilfen für Markdown-Rendering/-Chunking/-Tabellen, Redaction-Helfer, Directive-Tag-Helfer und Safe-Text-Utilities |
    | `plugin-sdk/text-chunking` | Hilfsfunktion für Outbound-Text-Chunking |
    | `plugin-sdk/speech` | Speech-Provider-Typen sowie providerseitige Hilfen für Directive, Registry und Validierung |
    | `plugin-sdk/speech-core` | Gemeinsame Hilfen für Speech-Provider-Typen, Registry, Directive und Normalisierung |
    | `plugin-sdk/realtime-transcription` | Provider-Typen und Registry-Helfer für Realtime-Transkription |
    | `plugin-sdk/realtime-voice` | Provider-Typen und Registry-Helfer für Realtime-Voice |
    | `plugin-sdk/image-generation` | Provider-Typen für Bildgenerierung |
    | `plugin-sdk/image-generation-core` | Gemeinsame Hilfen für Bildgenerierungs-Typen, Failover, Auth und Registry |
    | `plugin-sdk/music-generation` | Provider-/Request-/Ergebnistypen für Musikgenerierung |
    | `plugin-sdk/music-generation-core` | Gemeinsame Hilfen für Musikgenerierungs-Typen, Failover-Helfer, Provider-Lookup und Model-Ref-Parsing |
    | `plugin-sdk/video-generation` | Provider-/Request-/Ergebnistypen für Videogenerierung |
    | `plugin-sdk/video-generation-core` | Gemeinsame Hilfen für Videogenerierungs-Typen, Failover-Helfer, Provider-Lookup und Model-Ref-Parsing |
    | `plugin-sdk/webhook-targets` | Hilfen für Webhook-Zielregister und Routeninstallation |
    | `plugin-sdk/webhook-path` | Hilfen zur Normalisierung von Webhook-Pfaden |
    | `plugin-sdk/web-media` | Gemeinsame Hilfen zum Laden entfernter/lokaler Medien |
    | `plugin-sdk/zod` | Re-exportiertes `zod` für Plugin-SDK-Nutzer |
    | `plugin-sdk/testing` | `installCommonResolveTargetErrorCases`, `shouldAckReaction` |
  </Accordion>

  <Accordion title="Memory-Subpfade">
    | Subpfad | Wichtige Exporte |
    | --- | --- |
    | `plugin-sdk/memory-core` | Gebündelte `memory-core`-Helper-Oberfläche für Hilfen zu Manager/Konfiguration/Datei/CLI |
    | `plugin-sdk/memory-core-engine-runtime` | Runtime-Fassade für Memory-Index/-Suche |
    | `plugin-sdk/memory-core-host-engine-foundation` | Exporte der Foundation-Engine des Memory-Hosts |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Embedding-Verträge des Memory-Hosts, Registry-Zugriff, lokaler Provider und generische Batch-/Remote-Helfer |
    | `plugin-sdk/memory-core-host-engine-qmd` | Exporte der QMD-Engine des Memory-Hosts |
    | `plugin-sdk/memory-core-host-engine-storage` | Exporte der Storage-Engine des Memory-Hosts |
    | `plugin-sdk/memory-core-host-multimodal` | Multimodale Hilfen des Memory-Hosts |
    | `plugin-sdk/memory-core-host-query` | Query-Hilfen des Memory-Hosts |
    | `plugin-sdk/memory-core-host-secret` | Secret-Hilfen des Memory-Hosts |
    | `plugin-sdk/memory-core-host-events` | Hilfen für Event-Journale des Memory-Hosts |
    | `plugin-sdk/memory-core-host-status` | Status-Hilfen des Memory-Hosts |
    | `plugin-sdk/memory-core-host-runtime-cli` | CLI-Runtime-Hilfen des Memory-Hosts |
    | `plugin-sdk/memory-core-host-runtime-core` | Core-Runtime-Hilfen des Memory-Hosts |
    | `plugin-sdk/memory-core-host-runtime-files` | Datei-/Runtime-Hilfen des Memory-Hosts |
    | `plugin-sdk/memory-host-core` | Herstellerneutraler Alias für Core-Runtime-Hilfen des Memory-Hosts |
    | `plugin-sdk/memory-host-events` | Herstellerneutraler Alias für Hilfen für Event-Journale des Memory-Hosts |
    | `plugin-sdk/memory-host-files` | Herstellerneutraler Alias für Datei-/Runtime-Hilfen des Memory-Hosts |
    | `plugin-sdk/memory-host-markdown` | Gemeinsame Hilfen für verwaltetes Markdown für speichernahe Plugins |
    | `plugin-sdk/memory-host-search` | Active Memory-Runtime-Fassade für den Zugriff auf Search-Manager |
    | `plugin-sdk/memory-host-status` | Herstellerneutraler Alias für Status-Hilfen des Memory-Hosts |
    | `plugin-sdk/memory-lancedb` | Gebündelte `memory-lancedb`-Helper-Oberfläche |
  </Accordion>

  <Accordion title="Reservierte gebündelte Helper-Subpfade">
    | Familie | Aktuelle Subpfade | Beabsichtigte Verwendung |
    | --- | --- | --- |
    | Browser | `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support` | Gebündelte Support-Helfer für Browser-Plugins (`browser-support` bleibt das Kompatibilitäts-Barrel) |
    | Matrix | `plugin-sdk/matrix`, `plugin-sdk/matrix-helper`, `plugin-sdk/matrix-runtime-heavy`, `plugin-sdk/matrix-runtime-shared`, `plugin-sdk/matrix-runtime-surface`, `plugin-sdk/matrix-surface`, `plugin-sdk/matrix-thread-bindings` | Gebündelte Helper-/Runtime-Oberfläche für Matrix |
    | Line | `plugin-sdk/line`, `plugin-sdk/line-core`, `plugin-sdk/line-runtime`, `plugin-sdk/line-surface` | Gebündelte Helper-/Runtime-Oberfläche für LINE |
    | IRC | `plugin-sdk/irc`, `plugin-sdk/irc-surface` | Gebündelte Helper-Oberfläche für IRC |
    | Kanalspezifische Helfer | `plugin-sdk/googlechat`, `plugin-sdk/zalouser`, `plugin-sdk/bluebubbles`, `plugin-sdk/bluebubbles-policy`, `plugin-sdk/mattermost`, `plugin-sdk/mattermost-policy`, `plugin-sdk/feishu-conversation`, `plugin-sdk/msteams`, `plugin-sdk/nextcloud-talk`, `plugin-sdk/nostr`, `plugin-sdk/tlon`, `plugin-sdk/twitch` | Gebündelte Kompatibilitäts-/Helper-Seams für Kanäle |
    | Auth-/pluginspezifische Helfer | `plugin-sdk/github-copilot-login`, `plugin-sdk/github-copilot-token`, `plugin-sdk/diagnostics-otel`, `plugin-sdk/diffs`, `plugin-sdk/llm-task`, `plugin-sdk/thread-ownership`, `plugin-sdk/voice-call` | Gebündelte Feature-/Plugin-Helper-Seams; `plugin-sdk/github-copilot-token` exportiert derzeit `DEFAULT_COPILOT_API_BASE_URL`, `deriveCopilotApiBaseUrlFromToken` und `resolveCopilotApiToken` |
  </Accordion>
</AccordionGroup>

## Registrierungs-API

Der Callback `register(api)` erhält ein `OpenClawPluginApi`-Objekt mit diesen
Methoden:

### Fähigkeitsregistrierung

| Methode                                          | Was registriert wird                  |
| ------------------------------------------------ | ------------------------------------- |
| `api.registerProvider(...)`                      | Textinferenz (LLM)                    |
| `api.registerAgentHarness(...)`                  | Experimenteller Agent-Executor auf niedriger Ebene |
| `api.registerCliBackend(...)`                    | Lokales CLI-Inferenz-Backend          |
| `api.registerChannel(...)`                       | Messaging-Kanal                       |
| `api.registerSpeechProvider(...)`                | Text-to-Speech- / STT-Synthese        |
| `api.registerRealtimeTranscriptionProvider(...)` | Streaming-Echtzeittranskription       |
| `api.registerRealtimeVoiceProvider(...)`         | Duplex-Echtzeit-Sprachsitzungen       |
| `api.registerMediaUnderstandingProvider(...)`    | Bild-/Audio-/Videoanalyse             |
| `api.registerImageGenerationProvider(...)`       | Bildgenerierung                       |
| `api.registerMusicGenerationProvider(...)`       | Musikgenerierung                      |
| `api.registerVideoGenerationProvider(...)`       | Videogenerierung                      |
| `api.registerWebFetchProvider(...)`              | Web-Fetch-/Scrape-Provider            |
| `api.registerWebSearchProvider(...)`             | Websuche                              |

### Tools und Befehle

| Methode                         | Was registriert wird                           |
| ------------------------------ | ---------------------------------------------- |
| `api.registerTool(tool, opts?)` | Agent-Tool (erforderlich oder `{ optional: true }`) |
| `api.registerCommand(def)`      | Benutzerdefinierter Befehl (umgeht das LLM)    |

### Infrastruktur

| Methode                                        | Was registriert wird                  |
| --------------------------------------------- | ------------------------------------- |
| `api.registerHook(events, handler, opts?)`     | Ereignis-Hook                         |
| `api.registerHttpRoute(params)`                | Gateway-HTTP-Endpunkt                 |
| `api.registerGatewayMethod(name, handler)`     | Gateway-RPC-Methode                   |
| `api.registerCli(registrar, opts?)`            | CLI-Unterbefehl                       |
| `api.registerService(service)`                 | Hintergrunddienst                     |
| `api.registerInteractiveHandler(registration)` | Interaktiver Handler                  |
| `api.registerMemoryPromptSupplement(builder)`  | Additiver speicherbezogener Prompt-Abschnitt |
| `api.registerMemoryCorpusSupplement(adapter)`  | Additiver Such-/Lese-Korpus für Memory |

Reservierte Core-Admin-Namespaces (`config.*`, `exec.approvals.*`, `wizard.*`,
`update.*`) bleiben immer `operator.admin`, auch wenn ein Plugin versucht, einen
engeren Geltungsbereich für eine Gateway-Methode zuzuweisen. Bevorzugen Sie pluginspezifische Präfixe für
plugin-eigene Methoden.

### CLI-Registrierungsmetadaten

`api.registerCli(registrar, opts?)` akzeptiert zwei Arten von Metadaten der obersten Ebene:

- `commands`: explizite Befehlswurzeln, die dem Registrar gehören
- `descriptors`: Befehlsdeskriptoren zur Parse-Zeit, verwendet für CLI-Hilfe der Root-Ebene,
  Routing und Lazy-Registrierung von Plugin-CLI

Wenn ein Plugin-Befehl im normalen Root-CLI-Pfad lazy geladen bleiben soll,
geben Sie `descriptors` an, die jede Befehlswurzel der obersten Ebene abdecken, die von diesem
Registrar bereitgestellt wird.

```typescript
api.registerCli(
  async ({ program }) => {
    const { registerMatrixCli } = await import("./src/cli.js");
    registerMatrixCli({ program });
  },
  {
    descriptors: [
      {
        name: "matrix",
        description: "Manage Matrix accounts, verification, devices, and profile state",
        hasSubcommands: true,
      },
    ],
  },
);
```

Verwenden Sie `commands` allein nur dann, wenn Sie keine Lazy-Registrierung in der Root-CLI benötigen.
Dieser eager Kompatibilitätspfad wird weiterhin unterstützt, installiert jedoch keine
deskriptorgestützten Platzhalter für das Lazy Loading zur Parse-Zeit.

### CLI-Backend-Registrierung

Mit `api.registerCliBackend(...)` kann ein Plugin die Standardkonfiguration für ein lokales
KI-CLI-Backend wie `codex-cli` besitzen.

- Die `id` des Backends wird zum Provider-Präfix in Modell-Refs wie `codex-cli/gpt-5`.
- Das `config` des Backends verwendet dieselbe Form wie `agents.defaults.cliBackends.<id>`.
- Benutzerkonfiguration hat weiterhin Vorrang. OpenClaw merged `agents.defaults.cliBackends.<id>` über den
  Plugin-Standardwert, bevor die CLI ausgeführt wird.
- Verwenden Sie `normalizeConfig`, wenn ein Backend nach dem Merge Kompatibilitätsumschreibungen benötigt
  (z. B. zum Normalisieren alter Flag-Formen).

### Exklusive Slots

| Methode                                    | Was registriert wird                                                                                                                                        |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `api.registerContextEngine(id, factory)`   | Context Engine (jeweils nur eine aktiv). Der Callback `assemble()` erhält `availableTools` und `citationsMode`, damit die Engine Prompt-Ergänzungen passend anpassen kann. |
| `api.registerMemoryCapability(capability)` | Einheitliche Memory-Fähigkeit                                                                                                                                |
| `api.registerMemoryPromptSection(builder)` | Builder für Memory-Prompt-Abschnitte                                                                                                                         |
| `api.registerMemoryFlushPlan(resolver)`    | Resolver für Memory-Flush-Pläne                                                                                                                              |
| `api.registerMemoryRuntime(runtime)`       | Memory-Runtime-Adapter                                                                                                                                       |

### Memory-Embedding-Adapter

| Methode                                        | Was registriert wird                         |
| --------------------------------------------- | -------------------------------------------- |
| `api.registerMemoryEmbeddingProvider(adapter)` | Memory-Embedding-Adapter für das aktive Plugin |

- `registerMemoryCapability` ist die bevorzugte exklusive Memory-Plugin-API.
- `registerMemoryCapability` kann auch `publicArtifacts.listArtifacts(...)` bereitstellen,
  damit Companion-Plugins exportierte Memory-Artefakte über
  `openclaw/plugin-sdk/memory-host-core` nutzen können, statt in das private Layout
  eines bestimmten Memory-Plugins hineinzugreifen.
- `registerMemoryPromptSection`, `registerMemoryFlushPlan` und
  `registerMemoryRuntime` sind legacy-kompatible exklusive Memory-Plugin-APIs.
- `registerMemoryEmbeddingProvider` ermöglicht es dem aktiven Memory-Plugin, eine oder
  mehrere Embedding-Adapter-IDs zu registrieren (zum Beispiel `openai`, `gemini` oder eine
  benutzerdefinierte, plugindefinierte ID).
- Benutzerkonfiguration wie `agents.defaults.memorySearch.provider` und
  `agents.defaults.memorySearch.fallback` wird anhand dieser registrierten
  Adapter-IDs aufgelöst.

### Ereignisse und Lebenszyklus

| Methode                                      | Was sie bewirkt             |
| ------------------------------------------- | --------------------------- |
| `api.on(hookName, handler, opts?)`           | Typisierter Lebenszyklus-Hook |
| `api.onConversationBindingResolved(handler)` | Callback für Konversations-Bindings |

### Semantik von Hook-Entscheidungen

- `before_tool_call`: Die Rückgabe von `{ block: true }` ist final. Sobald ein Handler dies setzt, werden Handler mit niedrigerer Priorität übersprungen.
- `before_tool_call`: Die Rückgabe von `{ block: false }` wird als keine Entscheidung behandelt (genau wie das Weglassen von `block`), nicht als Überschreibung.
- `before_install`: Die Rückgabe von `{ block: true }` ist final. Sobald ein Handler dies setzt, werden Handler mit niedrigerer Priorität übersprungen.
- `before_install`: Die Rückgabe von `{ block: false }` wird als keine Entscheidung behandelt (genau wie das Weglassen von `block`), nicht als Überschreibung.
- `reply_dispatch`: Die Rückgabe von `{ handled: true, ... }` ist final. Sobald ein Handler den Dispatch beansprucht, werden Handler mit niedrigerer Priorität und der standardmäßige Model-Dispatch-Pfad übersprungen.
- `message_sending`: Die Rückgabe von `{ cancel: true }` ist final. Sobald ein Handler dies setzt, werden Handler mit niedrigerer Priorität übersprungen.
- `message_sending`: Die Rückgabe von `{ cancel: false }` wird als keine Entscheidung behandelt (genau wie das Weglassen von `cancel`), nicht als Überschreibung.

### API-Objektfelder

| Feld                     | Typ                       | Beschreibung                                                                                |
| ------------------------ | ------------------------- | ------------------------------------------------------------------------------------------- |
| `api.id`                 | `string`                  | Plugin-ID                                                                                   |
| `api.name`               | `string`                  | Anzeigename                                                                                 |
| `api.version`            | `string?`                 | Plugin-Version (optional)                                                                   |
| `api.description`        | `string?`                 | Plugin-Beschreibung (optional)                                                              |
| `api.source`             | `string`                  | Quellpfad des Plugins                                                                       |
| `api.rootDir`            | `string?`                 | Root-Verzeichnis des Plugins (optional)                                                     |
| `api.config`             | `OpenClawConfig`          | Aktueller Konfigurations-Snapshot (aktiver In-Memory-Runtime-Snapshot, wenn verfügbar)     |
| `api.pluginConfig`       | `Record<string, unknown>` | Plugin-spezifische Konfiguration aus `plugins.entries.<id>.config`                          |
| `api.runtime`            | `PluginRuntime`           | [Runtime-Helfer](/de/plugins/sdk-runtime)                                                      |
| `api.logger`             | `PluginLogger`            | Bereichsspezifischer Logger (`debug`, `info`, `warn`, `error`)                              |
| `api.registrationMode`   | `PluginRegistrationMode`  | Aktueller Lademodus; `"setup-runtime"` ist das leichtgewichtige Startup-/Setup-Fenster vor dem vollständigen Entry |
| `api.resolvePath(input)` | `(string) => string`      | Pfad relativ zum Plugin-Root auflösen                                                       |

## Interne Modulkonvention

Verwenden Sie innerhalb Ihres Plugins lokale Barrel-Dateien für interne Importe:

```
my-plugin/
  api.ts            # Öffentliche Exporte für externe Nutzer
  runtime-api.ts    # Nur interne Runtime-Exporte
  index.ts          # Plugin-Entry-Point
  setup-entry.ts    # Leichtgewichtiger Entry nur für Setup (optional)
```

<Warning>
  Importieren Sie Ihr eigenes Plugin im Produktivcode niemals über `openclaw/plugin-sdk/<your-plugin>`.
  Leiten Sie interne Importe über `./api.ts` oder
  `./runtime-api.ts`. Der SDK-Pfad ist nur der externe Vertrag.
</Warning>

Per Fassade geladene öffentliche Oberflächen gebündelter Plugins (`api.ts`, `runtime-api.ts`,
`index.ts`, `setup-entry.ts` und ähnliche öffentliche Entry-Dateien) bevorzugen jetzt den
aktiven Runtime-Konfigurations-Snapshot, wenn OpenClaw bereits läuft. Falls noch kein Runtime-
Snapshot existiert, greifen sie auf die auf der Festplatte aufgelöste Konfigurationsdatei zurück.

Provider-Plugins können außerdem ein schmales pluginlokales Vertrags-Barrel bereitstellen, wenn ein
Helfer bewusst provider-spezifisch ist und noch nicht in einen generischen SDK-Subpfad gehört.
Aktuelles gebündeltes Beispiel: Der Anthropic-Provider hält seine Claude-
Stream-Helfer in seiner eigenen öffentlichen `api.ts`- / `contract-api.ts`-Seam, statt
Anthropic-Beta-Header- und `service_tier`-Logik in einen generischen
`plugin-sdk/*`-Vertrag zu überführen.

Weitere aktuelle gebündelte Beispiele:

- `@openclaw/openai-provider`: `api.ts` exportiert Provider-Builder,
  Hilfen für Standardmodelle und Builder für Realtime-Provider
- `@openclaw/openrouter-provider`: `api.ts` exportiert den Provider-Builder sowie
  Onboarding-/Konfigurations-Helfer

<Warning>
  Produktivcode von Extensions sollte auch Importe von `openclaw/plugin-sdk/<other-plugin>`
  vermeiden. Wenn ein Helfer wirklich gemeinsam genutzt wird, verschieben Sie ihn in einen neutralen SDK-Subpfad
  wie `openclaw/plugin-sdk/speech`, `.../provider-model-shared` oder eine andere
  fähigkeitsorientierte Oberfläche, statt zwei Plugins miteinander zu koppeln.
</Warning>

## Verwandt

- [Entry Points](/de/plugins/sdk-entrypoints) — Optionen für `definePluginEntry` und `defineChannelPluginEntry`
- [Runtime Helpers](/de/plugins/sdk-runtime) — vollständige Referenz für den Namespace `api.runtime`
- [Setup and Config](/de/plugins/sdk-setup) — Paketierung, Manifeste, Konfigurationsschemas
- [Testing](/de/plugins/sdk-testing) — Test-Utilities und Lint-Regeln
- [SDK Migration](/de/plugins/sdk-migration) — Migration von veralteten Oberflächen
- [Plugin Internals](/de/plugins/architecture) — Detaillierte Architektur und Fähigkeitsmodell
