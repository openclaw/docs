---
read_when:
    - Auswahl des richtigen plugin-sdk-Unterpfads für einen Plugin-Import
    - Prüfung gebündelter Plugin-Unterpfade und Hilfsoberflächen
summary: 'Plugin-SDK-Unterpfadkatalog: Welche Importe wo liegen, nach Bereichen gruppiert'
title: Plugin-SDK-Unterpfade
x-i18n:
    generated_at: "2026-04-25T18:20:46Z"
    model: gpt-5.4
    provider: openai
    source_hash: b143fcc177c4d0d03fbcb4058291c99a7bb9f1f7fd04cca3916a7dbb4c22fd14
    source_path: plugins/sdk-subpaths.md
    workflow: 15
---

  Das Plugin-SDK wird als Satz schmaler Unterpfade unter `openclaw/plugin-sdk/` bereitgestellt.
  Diese Seite katalogisiert die häufig verwendeten Unterpfade nach Zweck gruppiert. Die generierte
  vollständige Liste mit mehr als 200 Unterpfaden liegt in `scripts/lib/plugin-sdk-entrypoints.json`;
  reservierte Hilfsunterpfade für gebündelte Plugins erscheinen dort ebenfalls, sind aber ein
  Implementierungsdetail, sofern nicht eine Dokumentationsseite sie ausdrücklich hervorhebt.

  Für die Anleitung zum Erstellen von Plugins siehe [Plugin SDK overview](/de/plugins/sdk-overview).

  ## Plugin-Einstieg

  | Unterpfad                  | Wichtige Exporte                                                                                                                      |
  | -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
  | `plugin-sdk/plugin-entry`  | `definePluginEntry`                                                                                                                   |
  | `plugin-sdk/core`          | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema` |
  | `plugin-sdk/config-schema` | `OpenClawSchema`                                                                                                                      |
  | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry`                                                                                                     |

  <AccordionGroup>
  <Accordion title="Channel-Unterpfade">
    | Unterpfad | Wichtige Exporte |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | Zod-Schema-Export des Root-`openclaw.json` (`OpenClawSchema`) |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, sowie `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | Gemeinsame Hilfen für den Setup-Assistenten, Allowlist-Prompts, Builder für Setup-Status |
    | `plugin-sdk/setup-runtime` | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | `createEnvPatchedAccountSetupAdapter` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | Hilfen für Multi-Account-Konfiguration/Aktions-Gates, Hilfen für Fallback auf Standard-Account |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, Hilfen zur Normalisierung von Account-IDs |
    | `plugin-sdk/account-resolution` | Hilfen für Account-Lookup + Standard-Fallback |
    | `plugin-sdk/account-helpers` | Schmale Hilfen für Account-Liste/Account-Aktionen |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | `createChannelReplyPipeline` |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter` |
    | `plugin-sdk/channel-config-schema` | Channel-Konfigurationsschema-Typen |
    | `plugin-sdk/telegram-command-config` | Hilfen zur Normalisierung/Validierung benutzerdefinierter Telegram-Befehle mit Fallback auf gebündelten Vertrag |
    | `plugin-sdk/command-gating` | Schmale Hilfen für Autorisierungs-Gates von Befehlen |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-lifecycle` | `createAccountStatusSink`, Hilfen für Lifecycle/Finalisierung von Entwurfs-Streams |
    | `plugin-sdk/inbound-envelope` | Gemeinsame Hilfen für eingehendes Routing + Envelope-Builder |
    | `plugin-sdk/inbound-reply-dispatch` | Gemeinsame Hilfen für das Aufzeichnen und Dispatchen eingehender Daten |
    | `plugin-sdk/messaging-targets` | Hilfen zum Parsen/Abgleichen von Zielen |
    | `plugin-sdk/outbound-media` | Gemeinsame Hilfen zum Laden ausgehender Medien |
    | `plugin-sdk/outbound-runtime` | Hilfen für ausgehende Zustellung, Identität, Send-Delegat, Sitzung, Formatierung und Planung von Payloads |
    | `plugin-sdk/poll-runtime` | Schmale Hilfen zur Poll-Normalisierung |
    | `plugin-sdk/thread-bindings-runtime` | Hilfen für Lifecycle und Adapter von Thread-Bindings |
    | `plugin-sdk/agent-media-payload` | Veralteter Builder für Medien-Payloads von Agenten |
    | `plugin-sdk/conversation-runtime` | Hilfen für Konversations-/Thread-Binding, Pairing und konfigurierte Bindings |
    | `plugin-sdk/runtime-config-snapshot` | Hilfsfunktion für Runtime-Konfigurations-Snapshots |
    | `plugin-sdk/runtime-group-policy` | Hilfen zur Auflösung von Gruppenrichtlinien zur Laufzeit |
    | `plugin-sdk/channel-status` | Gemeinsame Hilfen für Snapshots/Zusammenfassungen des Channel-Status |
    | `plugin-sdk/channel-config-primitives` | Schmale Primitive für Channel-Konfigurationsschemata |
    | `plugin-sdk/channel-config-writes` | Hilfen zur Autorisierung von Schreibvorgängen in der Channel-Konfiguration |
    | `plugin-sdk/channel-plugin-common` | Gemeinsame Prelude-Exporte für Channel-Plugins |
    | `plugin-sdk/allowlist-config-edit` | Hilfen zum Bearbeiten/Lesen der Allowlist-Konfiguration |
    | `plugin-sdk/group-access` | Gemeinsame Hilfen für Entscheidungen zum Gruppenzugriff |
    | `plugin-sdk/direct-dm` | Gemeinsame Hilfen für Auth/Guards bei direkten DMs |
    | `plugin-sdk/interactive-runtime` | Hilfen für semantische Nachrichtendarstellung, Zustellung und veraltete interaktive Antworten. Siehe [Message Presentation](/de/plugins/message-presentation) |
    | `plugin-sdk/channel-inbound` | Kompatibilitäts-Barrel für eingehende Entprellung, Mention-Matching, Hilfen für Mention-Policies und Envelope-Hilfen |
    | `plugin-sdk/channel-inbound-debounce` | Schmale Hilfen für eingehende Entprellung |
    | `plugin-sdk/channel-mention-gating` | Schmale Hilfen für Mention-Policy und Mention-Text ohne die breitere Inbound-Runtime-Oberfläche |
    | `plugin-sdk/channel-envelope` | Schmale Hilfen für die Formatierung eingehender Envelopes |
    | `plugin-sdk/channel-location` | Hilfen für Channel-Standortkontext und -Formatierung |
    | `plugin-sdk/channel-logging` | Channel-Logging-Hilfen für verworfene eingehende Daten und Tipp-/Ack-Fehler |
    | `plugin-sdk/channel-send-result` | Typen für Antwortergebnisse |
    | `plugin-sdk/channel-actions` | Hilfen für Nachrichtenaktionen in Channels sowie veraltete native Schema-Hilfen, die aus Plugin-Kompatibilitätsgründen beibehalten werden |
    | `plugin-sdk/channel-targets` | Hilfen zum Parsen/Abgleichen von Zielen |
    | `plugin-sdk/channel-contract` | Typen für den Channel-Vertrag |
    | `plugin-sdk/channel-feedback` | Verdrahtung von Feedback/Reaktionen |
    | `plugin-sdk/channel-secret-runtime` | Schmale Hilfen für Secret-Verträge wie `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment` und Secret-Zieltypen |
  </Accordion>

  <Accordion title="Provider-Unterpfade">
    | Unterpfad | Wichtige Exporte |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/provider-setup` | Kuratierte Setup-Hilfen für lokale/selbst gehostete Provider |
    | `plugin-sdk/self-hosted-provider-setup` | Fokussierte Setup-Hilfen für selbst gehostete OpenAI-kompatible Provider |
    | `plugin-sdk/cli-backend` | CLI-Backend-Standards + Watchdog-Konstanten |
    | `plugin-sdk/provider-auth-runtime` | Laufzeit-Hilfen zur API-Schlüssel-Auflösung für Provider-Plugins |
    | `plugin-sdk/provider-auth-api-key` | Hilfen für API-Key-Onboarding/Profilschreibvorgänge wie `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | Standard-Builder für OAuth-Auth-Ergebnisse |
    | `plugin-sdk/provider-auth-login` | Gemeinsame Hilfen für interaktive Logins bei Provider-Plugins |
    | `plugin-sdk/provider-env-vars` | Hilfen für das Lookup von Auth-Umgebungsvariablen bei Providern |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, gemeinsame Builder für Replay-Policies, Hilfen für Provider-Endpunkte und Hilfen zur Modell-ID-Normalisierung wie `normalizeNativeXaiModelId` |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | Generische Hilfen für HTTP/Endpunkt-Fähigkeiten von Providern, HTTP-Fehler von Providern und Hilfen für Multipart-Formulare bei Audio-Transkription |
    | `plugin-sdk/provider-web-fetch-contract` | Schmale Hilfen für Verträge zur Konfiguration/Auswahl von Web-Fetch wie `enablePluginInConfig` und `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | Hilfen für Registrierung/Cache von Web-Fetch-Providern |
    | `plugin-sdk/provider-web-search-config-contract` | Schmale Hilfen für Konfiguration/Credentials von Web-Suche bei Providern, die keine Plugin-Aktivierungsverdrahtung benötigen |
    | `plugin-sdk/provider-web-search-contract` | Schmale Hilfen für Verträge zu Konfiguration/Credentials der Web-Suche wie `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` und bereichsspezifische Setter/Getter für Credentials |
    | `plugin-sdk/provider-web-search` | Hilfen für Registrierung/Cache/Laufzeit von Web-Such-Providern |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, Schema-Bereinigung + Diagnostik für Gemini und xAI-Kompatibilitätshilfen wie `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
    | `plugin-sdk/provider-usage` | `fetchClaudeUsage` und Ähnliches |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, Stream-Wrapper-Typen und gemeinsame Wrapper-Hilfen für Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
    | `plugin-sdk/provider-transport-runtime` | Native Hilfen für Provider-Transporte wie geschütztes Fetch, Transport-Nachrichtentransformationen und beschreibbare Streams für Transportereignisse |
    | `plugin-sdk/provider-onboard` | Hilfen für Konfigurations-Patches beim Onboarding |
    | `plugin-sdk/global-singleton` | Hilfen für prozesslokale Singleton-/Map-/Cache-Strukturen |
    | `plugin-sdk/group-activation` | Schmale Hilfen für Gruppenaktivierungsmodi und Befehlsanalyse |
  </Accordion>

  <Accordion title="Unterpfade für Auth und Sicherheit">
    | Unterpfad | Wichtige Exporte |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, Hilfen für die Befehls-Registry einschließlich Formatierung dynamischer Argumentmenüs, Hilfen zur Sender-Autorisierung |
    | `plugin-sdk/command-status` | Builder für Befehls-/Hilfenachrichten wie `buildCommandsMessagePaginated` und `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | Hilfen für Approver-Auflösung und Aktions-Auth im selben Chat |
    | `plugin-sdk/approval-client-runtime` | Hilfen für native Exec-Approval-Profile/-Filter |
    | `plugin-sdk/approval-delivery-runtime` | Native Adapter für Approval-Fähigkeiten/-Zustellung |
    | `plugin-sdk/approval-gateway-runtime` | Gemeinsame Hilfsfunktion zur Auflösung von Approval-Gateways |
    | `plugin-sdk/approval-handler-adapter-runtime` | Schlanke Hilfen zum Laden nativer Approval-Adapter für schnelle Channel-Entrypoints |
    | `plugin-sdk/approval-handler-runtime` | Breitere Runtime-Hilfen für Approval-Handler; bevorzugen Sie die schmaleren Adapter-/Gateway-Seams, wenn diese ausreichen |
    | `plugin-sdk/approval-native-runtime` | Hilfen für native Approval-Ziele + Account-Bindings |
    | `plugin-sdk/approval-reply-runtime` | Hilfen für Antwort-Payloads bei Exec-/Plugin-Approvals |
    | `plugin-sdk/approval-runtime` | Hilfen für Payloads bei Exec-/Plugin-Approvals, Hilfen für natives Approval-Routing/-Runtime und strukturierte Hilfen für die Approval-Anzeige wie `formatApprovalDisplayPath` |
    | `plugin-sdk/reply-dedupe` | Schmale Hilfen zum Zurücksetzen der Deduplizierung eingehender Antworten |
    | `plugin-sdk/channel-contract-testing` | Schmale Hilfen zum Testen von Channel-Verträgen ohne das breite Testing-Barrel |
    | `plugin-sdk/command-auth-native` | Native Befehlsauthentifizierung, Formatierung dynamischer Argumentmenüs und native Hilfen für Sitzungsziele |
    | `plugin-sdk/command-detection` | Gemeinsame Hilfen zur Befehlserkennung |
    | `plugin-sdk/command-primitives-runtime` | Schlanke Prädikate für Befehlstext in schnellen Channel-Pfaden |
    | `plugin-sdk/command-surface` | Hilfen zur Normalisierung von CommandBody und zur Befehlsoberfläche |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | Schmale Hilfen zur Sammlung von Secret-Verträgen für Secret-Oberflächen von Channels/Plugins |
    | `plugin-sdk/secret-ref-runtime` | Schmale Hilfen für `coerceSecretRef` und SecretRef-Typisierung für Secret-Verträge/Konfigurationsparsing |
    | `plugin-sdk/security-runtime` | Gemeinsame Hilfen für Trust, DM-Gating, externe Inhalte und Secret-Sammlung |
    | `plugin-sdk/ssrf-policy` | Hilfen für Host-Allowlist und SSRF-Richtlinien für private Netzwerke |
    | `plugin-sdk/ssrf-dispatcher` | Schmale Hilfen für angeheftete Dispatcher ohne die breite Infra-Runtime-Oberfläche |
    | `plugin-sdk/ssrf-runtime` | Hilfen für angeheftete Dispatcher, SSRF-geschütztes Fetch und SSRF-Richtlinien |
    | `plugin-sdk/secret-input` | Hilfen zum Parsen von Secret-Eingaben |
    | `plugin-sdk/webhook-ingress` | Hilfen für Webhook-Anfragen/-Ziele |
    | `plugin-sdk/webhook-request-guards` | Hilfen für Anfragetextgröße/-Timeouts |
  </Accordion>

  <Accordion title="Unterpfade für Runtime und Speicher">
    | Unterpfad | Wichtige Exporte |
    | --- | --- |
    | `plugin-sdk/runtime` | Breite Hilfen für Runtime/Logging/Backups/Plugin-Installation |
    | `plugin-sdk/runtime-env` | Schmale Hilfen für Runtime-Umgebung, Logger, Timeout, Retry und Backoff |
    | `plugin-sdk/channel-runtime-context` | Generische Hilfen für Registrierung und Lookup des Channel-Runtime-Kontexts |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Gemeinsame Hilfen für Plugin-Befehle/Hooks/HTTP/interaktive Funktionen |
    | `plugin-sdk/hook-runtime` | Gemeinsame Hilfen für Webhook-/interne Hook-Pipelines |
    | `plugin-sdk/lazy-runtime` | Hilfen für lazy Runtime-Import/Binding wie `createLazyRuntimeModule`, `createLazyRuntimeMethod` und `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | Hilfen für Prozessausführung |
    | `plugin-sdk/cli-runtime` | Hilfen für CLI-Formatierung, Warten, Version, Argumentaufruf und lazy Befehlsgruppen |
    | `plugin-sdk/gateway-runtime` | Hilfen für Gateway-Client und Patches des Channel-Status |
    | `plugin-sdk/config-runtime` | Hilfen zum Laden/Schreiben von Konfiguration und Hilfen für Plugin-Konfigurations-Lookups |
    | `plugin-sdk/telegram-command-config` | Hilfen zur Normalisierung von Telegram-Befehlsnamen/-beschreibungen und zu Prüfungen auf Duplikate/Konflikte, auch wenn die gebündelte Telegram-Vertragsoberfläche nicht verfügbar ist |
    | `plugin-sdk/text-autolink-runtime` | Erkennung von Dateireferenz-Autolinks ohne das breite `text-runtime`-Barrel |
    | `plugin-sdk/approval-runtime` | Hilfen für Exec-/Plugin-Approvals, Builder für Approval-Fähigkeiten, Hilfen für Auth/Profile, natives Routing/Runtime und strukturierte Formatierung von Approval-Anzeigepfaden |
    | `plugin-sdk/reply-runtime` | Gemeinsame Runtime-Hilfen für Inbound/Antworten, Chunking, Dispatch, Heartbeat, Antwortplaner |
    | `plugin-sdk/reply-dispatch-runtime` | Schmale Hilfen für Antwort-Dispatch/-Finalisierung und Konversationslabels |
    | `plugin-sdk/reply-history` | Gemeinsame Hilfen für Antwortverläufe in kurzen Fenstern wie `buildHistoryContext`, `recordPendingHistoryEntry` und `clearHistoryEntriesIfEnabled` |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | Schmale Hilfen für Text-/Markdown-Chunking |
    | `plugin-sdk/session-store-runtime` | Hilfen für Pfad und `updated-at` des Sitzungsspeichers |
    | `plugin-sdk/state-paths` | Hilfen für Pfade zu State-/OAuth-Verzeichnissen |
    | `plugin-sdk/routing` | Hilfen für Route/Sitzungsschlüssel/Account-Binding wie `resolveAgentRoute`, `buildAgentSessionKey` und `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | Gemeinsame Hilfen für Zusammenfassungen des Channel-/Account-Status, Standardwerte für Runtime-Status und Metadaten für Probleme |
    | `plugin-sdk/target-resolver-runtime` | Gemeinsame Hilfen für Ziel-Resolver |
    | `plugin-sdk/string-normalization-runtime` | Hilfen zur Slug-/String-Normalisierung |
    | `plugin-sdk/request-url` | Extrahiert String-URLs aus Fetch-/Request-ähnlichen Eingaben |
    | `plugin-sdk/run-command` | Zeitgesteuerter Befehls-Runner mit normalisierten stdout-/stderr-Ergebnissen |
    | `plugin-sdk/param-readers` | Gemeinsame Param-Reader für Tools/CLI |
    | `plugin-sdk/tool-payload` | Extrahiert normalisierte Payloads aus Tool-Ergebnisobjekten |
    | `plugin-sdk/tool-send` | Extrahiert kanonische Send-Zielfelder aus Tool-Argumenten |
    | `plugin-sdk/temp-path` | Gemeinsame Hilfen für temporäre Download-Pfade |
    | `plugin-sdk/logging-core` | Hilfen für Subsystem-Logger und Redaction |
    | `plugin-sdk/markdown-table-runtime` | Hilfen für Markdown-Tabellenmodus und -Konvertierung |
    | `plugin-sdk/json-store` | Kleine Hilfen zum Lesen/Schreiben von JSON-Status |
    | `plugin-sdk/file-lock` | Reentrante Hilfen für Dateisperren |
    | `plugin-sdk/persistent-dedupe` | Hilfen für festplattenbasierte Deduplizierungs-Caches |
    | `plugin-sdk/acp-runtime` | ACP-Runtime-/Sitzungs- und Antwort-Dispatch-Hilfen |
    | `plugin-sdk/acp-binding-resolve-runtime` | Schreibgeschützte ACP-Binding-Auflösung ohne Lifecycle-Startup-Importe |
    | `plugin-sdk/agent-config-primitives` | Schmale Primitive für Runtime-Konfigurationsschemata von Agenten |
    | `plugin-sdk/boolean-param` | Lockerer Boolescher Param-Reader |
    | `plugin-sdk/dangerous-name-runtime` | Hilfen zur Auflösung beim Abgleich gefährlicher Namen |
    | `plugin-sdk/device-bootstrap` | Hilfen für Device-Bootstrap und Pairing-Tokens |
    | `plugin-sdk/extension-shared` | Gemeinsame Primitive für passive Channels, Status und Ambient-Proxy-Hilfen |
    | `plugin-sdk/models-provider-runtime` | Hilfen für `/models`-Befehle/Provider-Antworten |
    | `plugin-sdk/skill-commands-runtime` | Hilfen zum Auflisten von Skill-Befehlen |
    | `plugin-sdk/native-command-registry` | Hilfen für native Befehls-Registry/Build/Serialisierung |
    | `plugin-sdk/agent-harness` | Experimentelle vertrauenswürdige Plugin-Oberfläche für Low-Level-Agent-Harnesses: Harness-Typen, Hilfen für Steer/Abort aktiver Läufe, OpenClaw-Tool-Bridge-Hilfen, Hilfen für Formatierung/Details des Tool-Fortschritts und Hilfsfunktionen für Versuchsergebnisse |
    | `plugin-sdk/provider-zai-endpoint` | Hilfen zur Erkennung von Z.AI-Endpunkten |
    | `plugin-sdk/infra-runtime` | Hilfen für Systemereignisse/Heartbeat |
    | `plugin-sdk/collection-runtime` | Kleine Hilfen für begrenzte Caches |
    | `plugin-sdk/diagnostic-runtime` | Hilfen für Diagnose-Flags und -Ereignisse |
    | `plugin-sdk/error-runtime` | Hilfen für Fehlergraph, Formatierung, gemeinsame Fehlerklassifizierung, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | Hilfen für umhülltes Fetch, Proxy und angeheftete Lookups |
    | `plugin-sdk/runtime-fetch` | Dispatcher-bewusstes Runtime-Fetch ohne Proxy-/Guarded-Fetch-Importe |
    | `plugin-sdk/response-limit-runtime` | Begrenzter Reader für Antworttexte ohne die breite Media-Runtime-Oberfläche |
    | `plugin-sdk/session-binding-runtime` | Aktueller Konversations-Binding-Status ohne Routing für konfigurierte Bindings oder Pairing-Stores |
    | `plugin-sdk/session-store-runtime` | Hilfen zum Lesen des Sitzungsspeichers ohne breite Importe für Konfigurationsschreibvorgänge/Wartung |
    | `plugin-sdk/context-visibility-runtime` | Hilfen zur Auflösung der Kontextsichtbarkeit und zum Filtern ergänzender Kontexte ohne breite Importe für Konfiguration/Sicherheit |
    | `plugin-sdk/string-coerce-runtime` | Schmale Hilfen zum Coercen und Normalisieren primitiver Records/Strings ohne Markdown-/Logging-Importe |
    | `plugin-sdk/host-runtime` | Hilfen zur Normalisierung von Hostnamen und SCP-Hosts |
    | `plugin-sdk/retry-runtime` | Hilfen für Retry-Konfiguration und Retry-Runner |
    | `plugin-sdk/agent-runtime` | Hilfen für Agent-Verzeichnis/Identität/Workspace |
    | `plugin-sdk/directory-runtime` | Konfigurationsgestützte Verzeichnisabfrage/-Deduplizierung |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Unterpfade für Fähigkeiten und Tests">
    | Unterpfad | Wichtige Exporte |
    | --- | --- |
    | `plugin-sdk/media-runtime` | Gemeinsame Hilfen für Medien-Fetch/-Transformation/-Speicherung sowie Builder für Medien-Payloads |
    | `plugin-sdk/media-store` | Schmale Hilfen für Medienspeicher wie `saveMediaBuffer` |
    | `plugin-sdk/media-generation-runtime` | Gemeinsame Hilfen für Failover bei Medienerzeugung, Kandidatenauswahl und Meldungen zu fehlenden Modellen |
    | `plugin-sdk/media-understanding` | Provider-Typen für Medienverständnis sowie providerseitige Exporte für Bild-/Audio-Hilfen |
    | `plugin-sdk/text-runtime` | Gemeinsame Hilfen für Text/Markdown/Logging wie das Entfernen von für Assistenten sichtbarem Text, Hilfen für Markdown-Rendering/-Chunking/-Tabellen, Redaction-Hilfen, Hilfen für Direktiven-Tags und Safe-Text-Utilities |
    | `plugin-sdk/text-chunking` | Hilfsfunktion für ausgehendes Text-Chunking |
    | `plugin-sdk/speech` | Speech-Provider-Typen sowie providerseitige Exporte für Direktiven, Registry, Validierung und Speech-Hilfen |
    | `plugin-sdk/speech-core` | Gemeinsame Exporte für Speech-Provider-Typen, Registry, Direktiven, Normalisierung und Speech-Hilfen |
    | `plugin-sdk/realtime-transcription` | Provider-Typen für Realtime-Transkription, Registry-Hilfen und gemeinsame Hilfsfunktion für WebSocket-Sitzungen |
    | `plugin-sdk/realtime-voice` | Provider-Typen und Registry-Hilfen für Realtime-Voice |
    | `plugin-sdk/image-generation` | Provider-Typen für Bildgenerierung |
    | `plugin-sdk/image-generation-core` | Gemeinsame Hilfen für Typen, Failover, Auth und Registry der Bildgenerierung |
    | `plugin-sdk/music-generation` | Provider-/Anfrage-/Ergebnis-Typen für Musikgenerierung |
    | `plugin-sdk/music-generation-core` | Gemeinsame Hilfen für Typen, Failover, Provider-Lookup und Parsing von Modell-Refs der Musikgenerierung |
    | `plugin-sdk/video-generation` | Provider-/Anfrage-/Ergebnis-Typen für Videogenerierung |
    | `plugin-sdk/video-generation-core` | Gemeinsame Hilfen für Typen, Failover, Provider-Lookup und Parsing von Modell-Refs der Videogenerierung |
    | `plugin-sdk/webhook-targets` | Hilfen für Registry und Routeninstallation von Webhook-Zielen |
    | `plugin-sdk/webhook-path` | Hilfen zur Normalisierung von Webhook-Pfaden |
    | `plugin-sdk/web-media` | Gemeinsame Hilfen zum Laden entfernter/lokaler Medien |
    | `plugin-sdk/zod` | Re-exportiertes `zod` für Verbraucher des Plugin-SDK |
    | `plugin-sdk/testing` | `installCommonResolveTargetErrorCases`, `shouldAckReaction` |
  </Accordion>

  <Accordion title="Memory-Unterpfade">
    | Unterpfad | Wichtige Exporte |
    | --- | --- |
    | `plugin-sdk/memory-core` | Gebündelte Hilfsoberfläche `memory-core` für Manager-/Konfigurations-/Datei-/CLI-Hilfen |
    | `plugin-sdk/memory-core-engine-runtime` | Runtime-Fassade für Speicherindex/-suche |
    | `plugin-sdk/memory-core-host-engine-foundation` | Exporte der Foundation-Engine des Memory-Hosts |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Embedding-Verträge des Memory-Hosts, Registry-Zugriff, lokaler Provider und generische Batch-/Remote-Hilfen |
    | `plugin-sdk/memory-core-host-engine-qmd` | Exporte der QMD-Engine des Memory-Hosts |
    | `plugin-sdk/memory-core-host-engine-storage` | Exporte der Storage-Engine des Memory-Hosts |
    | `plugin-sdk/memory-core-host-multimodal` | Multimodale Hilfen des Memory-Hosts |
    | `plugin-sdk/memory-core-host-query` | Query-Hilfen des Memory-Hosts |
    | `plugin-sdk/memory-core-host-secret` | Secret-Hilfen des Memory-Hosts |
    | `plugin-sdk/memory-core-host-events` | Hilfen für das Event-Journal des Memory-Hosts |
    | `plugin-sdk/memory-core-host-status` | Status-Hilfen des Memory-Hosts |
    | `plugin-sdk/memory-core-host-runtime-cli` | CLI-Runtime-Hilfen des Memory-Hosts |
    | `plugin-sdk/memory-core-host-runtime-core` | Core-Runtime-Hilfen des Memory-Hosts |
    | `plugin-sdk/memory-core-host-runtime-files` | Datei-/Runtime-Hilfen des Memory-Hosts |
    | `plugin-sdk/memory-host-core` | Anbieterneutraler Alias für Core-Runtime-Hilfen des Memory-Hosts |
    | `plugin-sdk/memory-host-events` | Anbieterneutraler Alias für Hilfen für das Event-Journal des Memory-Hosts |
    | `plugin-sdk/memory-host-files` | Anbieterneutraler Alias für Datei-/Runtime-Hilfen des Memory-Hosts |
    | `plugin-sdk/memory-host-markdown` | Gemeinsame Hilfen für verwaltetes Markdown für speichernahe Plugins |
    | `plugin-sdk/memory-host-search` | Active Memory-Runtime-Fassade für den Zugriff auf den Search-Manager |
    | `plugin-sdk/memory-host-status` | Anbieterneutraler Alias für Status-Hilfen des Memory-Hosts |
    | `plugin-sdk/memory-lancedb` | Gebündelte Hilfsoberfläche `memory-lancedb` |
  </Accordion>

  <Accordion title="Reservierte Unterpfade für gebündelte Hilfen">
    | Familie | Aktuelle Unterpfade | Vorgesehene Verwendung |
    | --- | --- | --- |
    | Browser | `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support` | Hilfen zur Unterstützung gebündelter Browser-Plugins. `browser-profiles` exportiert `resolveBrowserConfig`, `resolveProfile`, `ResolvedBrowserConfig`, `ResolvedBrowserProfile` und `ResolvedBrowserTabCleanupConfig` für die normalisierte Form von `browser.tabCleanup`. `browser-support` bleibt das Kompatibilitäts-Barrel. |
    | Matrix | `plugin-sdk/matrix`, `plugin-sdk/matrix-helper`, `plugin-sdk/matrix-runtime-heavy`, `plugin-sdk/matrix-runtime-shared`, `plugin-sdk/matrix-runtime-surface`, `plugin-sdk/matrix-surface`, `plugin-sdk/matrix-thread-bindings` | Gebündelte Hilfs-/Runtime-Oberfläche für Matrix |
    | Line | `plugin-sdk/line`, `plugin-sdk/line-core`, `plugin-sdk/line-runtime`, `plugin-sdk/line-surface` | Gebündelte Hilfs-/Runtime-Oberfläche für LINE |
    | IRC | `plugin-sdk/irc`, `plugin-sdk/irc-surface` | Gebündelte Hilfsoberfläche für IRC |
    | Channelspezifische Hilfen | `plugin-sdk/googlechat`, `plugin-sdk/zalouser`, `plugin-sdk/bluebubbles`, `plugin-sdk/bluebubbles-policy`, `plugin-sdk/mattermost`, `plugin-sdk/mattermost-policy`, `plugin-sdk/feishu-conversation`, `plugin-sdk/msteams`, `plugin-sdk/nextcloud-talk`, `plugin-sdk/nostr`, `plugin-sdk/tlon`, `plugin-sdk/twitch` | Gebündelte Kompatibilitäts-/Hilfs-Seams für Channels |
    | Auth-/pluginspezifische Hilfen | `plugin-sdk/github-copilot-login`, `plugin-sdk/github-copilot-token`, `plugin-sdk/diagnostics-otel`, `plugin-sdk/diffs`, `plugin-sdk/llm-task`, `plugin-sdk/thread-ownership`, `plugin-sdk/voice-call` | Gebündelte Feature-/Plugin-Hilfs-Seams; `plugin-sdk/github-copilot-token` exportiert derzeit `DEFAULT_COPILOT_API_BASE_URL`, `deriveCopilotApiBaseUrlFromToken` und `resolveCopilotApiToken` |
  </Accordion>
</AccordionGroup>

## Verwandt

- [Plugin SDK overview](/de/plugins/sdk-overview)
- [Plugin SDK setup](/de/plugins/sdk-setup)
- [Building plugins](/de/plugins/building-plugins)
