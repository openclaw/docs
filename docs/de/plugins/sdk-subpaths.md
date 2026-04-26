---
read_when:
    - Die richtige plugin-sdk-Unterpfad-Auswahl für einen Plugin-Import treffen
    - Unterpfade von gebündelten Plugins und Hilfsoberflächen auditieren
summary: 'Plugin-SDK-Unterpfadkatalog: welche Importe wo liegen, nach Bereichen gruppiert'
title: Plugin-SDK-Unterpfade
x-i18n:
    generated_at: "2026-04-26T11:36:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: fcb49ee51301b79985d43470cd8c149c858e79d685908605317de253121d4736
    source_path: plugins/sdk-subpaths.md
    workflow: 15
---

  Das Plugin SDK wird als Satz schmaler Unterpfade unter `openclaw/plugin-sdk/` bereitgestellt.
  Diese Seite katalogisiert die häufig verwendeten Unterpfade nach Zweck gruppiert. Die generierte
  vollständige Liste mit mehr als 200 Unterpfaden befindet sich in `scripts/lib/plugin-sdk-entrypoints.json`;
  reservierte Hilfs-Unterpfade für gebündelte Plugins erscheinen dort, sind aber ein Implementierungs-
  detail, sofern nicht eine Dokumentationsseite sie ausdrücklich hervorhebt.

  Für den Leitfaden zur Plugin-Erstellung siehe [Plugin SDK overview](/de/plugins/sdk-overview).

  ## Plugin-Einstieg

  | Unterpfad                   | Zentrale Exporte                                                                                                                      |
  | --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
  | `plugin-sdk/plugin-entry`   | `definePluginEntry`                                                                                                                   |
  | `plugin-sdk/core`           | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema` |
  | `plugin-sdk/config-schema`  | `OpenClawSchema`                                                                                                                      |
  | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry`                                                                                                     |

  <AccordionGroup>
  <Accordion title="Kanal-Unterpfade">
    | Unterpfad | Zentrale Exporte |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | Root-`openclaw.json`-Zod-Schemaexport (`OpenClawSchema`) |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, plus `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | Gemeinsame Helfer für Setup-Assistenten, Allowlist-Prompts, Builder für Setup-Status |
    | `plugin-sdk/setup-runtime` | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | `createEnvPatchedAccountSetupAdapter` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | Helfer für Multi-Account-Konfiguration/Aktions-Gates, Helfer für Fallback auf Standardkonto |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, Helfer zur Normalisierung von Account-IDs |
    | `plugin-sdk/account-resolution` | Helfer für Account-Lookup + Standard-Fallback |
    | `plugin-sdk/account-helpers` | Schmale Helfer für Account-Listen/Account-Aktionen |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | `createChannelReplyPipeline` |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter` |
    | `plugin-sdk/channel-config-schema` | Typen für Kanal-Konfigurationsschema |
    | `plugin-sdk/telegram-command-config` | Helfer zur Normalisierung/Validierung benutzerdefinierter Telegram-Befehle mit Fallback auf gebündelten Vertrag |
    | `plugin-sdk/command-gating` | Schmale Helfer für Autorisierungs-Gates von Befehlen |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-lifecycle` | `createAccountStatusSink`, Helfer für Lebenszyklus/Finalisierung von Draft-Streams |
    | `plugin-sdk/inbound-envelope` | Gemeinsame Helfer zum Bauen eingehender Routen + Envelopes |
    | `plugin-sdk/inbound-reply-dispatch` | Gemeinsame Helfer zum Aufzeichnen und Dispatchen eingehender Antworten |
    | `plugin-sdk/messaging-targets` | Helfer zum Parsen/Abgleichen von Zielen |
    | `plugin-sdk/outbound-media` | Gemeinsame Helfer zum Laden ausgehender Medien |
    | `plugin-sdk/outbound-send-deps` | Leichtgewichtiger Lookup für Abhängigkeiten beim Outbound-Senden für Kanal-Adapter |
    | `plugin-sdk/outbound-runtime` | Helfer für Outbound-Zustellung, Identität, Send-Delegate, Sitzung, Formatierung und Nutzlastplanung |
    | `plugin-sdk/poll-runtime` | Schmale Helfer zur Poll-Normalisierung |
    | `plugin-sdk/thread-bindings-runtime` | Helfer für Lebenszyklus und Adapter von Thread-Bindings |
    | `plugin-sdk/agent-media-payload` | Legacy-Builder für Medien-Nutzlasten von Agents |
    | `plugin-sdk/conversation-runtime` | Helfer für Konversations-/Thread-Binding, Kopplung und konfigurierte Bindings |
    | `plugin-sdk/runtime-config-snapshot` | Helfer für Laufzeit-Konfigurations-Snapshots |
    | `plugin-sdk/runtime-group-policy` | Helfer zur Auflösung von Laufzeit-Gruppenrichtlinien |
    | `plugin-sdk/channel-status` | Gemeinsame Helfer für Kanalstatus-Snapshots/-Zusammenfassungen |
    | `plugin-sdk/channel-config-primitives` | Schmale Primitive für Kanal-Konfigurationsschema |
    | `plugin-sdk/channel-config-writes` | Helfer für Autorisierung von Schreibvorgängen in die Kanalkonfiguration |
    | `plugin-sdk/channel-plugin-common` | Gemeinsame Prelude-Exporte für Kanal-Plugins |
    | `plugin-sdk/allowlist-config-edit` | Helfer zum Bearbeiten/Lesen von Allowlist-Konfigurationen |
    | `plugin-sdk/group-access` | Gemeinsame Helfer für Entscheidungen über Gruppenzugriff |
    | `plugin-sdk/direct-dm` | Gemeinsame Helfer für Auth/Guards bei Direktnachrichten |
    | `plugin-sdk/interactive-runtime` | Helfer für semantische Nachrichtenpräsentation, Zustellung und Legacy-interaktive Antworten. Siehe [Message Presentation](/de/plugins/message-presentation) |
    | `plugin-sdk/channel-inbound` | Kompatibilitäts-Barrel für Inbound-Debounce, Mention-Matching, Mention-Policy-Helfer und Envelope-Helfer |
    | `plugin-sdk/channel-inbound-debounce` | Schmale Helfer für Inbound-Debounce |
    | `plugin-sdk/channel-mention-gating` | Schmale Mention-Policy- und Mention-Text-Helfer ohne die breitere Inbound-Laufzeitoberfläche |
    | `plugin-sdk/channel-envelope` | Schmale Helfer zur Formatierung eingehender Envelopes |
    | `plugin-sdk/channel-location` | Helfer für Kanal-Standortkontext und Formatierung |
    | `plugin-sdk/channel-logging` | Helfer für Kanal-Logging bei verworfenen Eingaben und Fehlern bei Typing/Ack |
    | `plugin-sdk/channel-send-result` | Typen für Antwortergebnisse |
    | `plugin-sdk/channel-actions` | Helfer für Kanal-Nachrichtenaktionen sowie veraltete native Schema-Helfer, die aus Plugin-Kompatibilitätsgründen beibehalten werden |
    | `plugin-sdk/channel-targets` | Helfer zum Parsen/Abgleichen von Zielen |
    | `plugin-sdk/channel-contract` | Typen für Kanal-Verträge |
    | `plugin-sdk/channel-feedback` | Verdrahtung für Feedback/Reaktionen |
    | `plugin-sdk/channel-secret-runtime` | Schmale Helfer für Secret-Verträge wie `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment` und Secret-Zieltypen |
  </Accordion>

  <Accordion title="Provider-Unterpfade">
    | Unterpfad | Zentrale Exporte |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/provider-setup` | Kuratierte Helfer für Setup lokaler/selbst gehosteter Provider |
    | `plugin-sdk/self-hosted-provider-setup` | Fokussierte Helfer für das Setup selbst gehosteter OpenAI-kompatibler Provider |
    | `plugin-sdk/cli-backend` | CLI-Backend-Standards + Watchdog-Konstanten |
    | `plugin-sdk/provider-auth-runtime` | Helfer zur API-Key-Auflösung zur Laufzeit für Provider-Plugins |
    | `plugin-sdk/provider-auth-api-key` | Helfer für API-Key-Onboarding/Profile-Schreibvorgänge wie `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | Standard-Builder für OAuth-Authentifizierungsergebnisse |
    | `plugin-sdk/provider-auth-login` | Gemeinsame Helfer für interaktive Logins bei Provider-Plugins |
    | `plugin-sdk/provider-env-vars` | Helfer für Lookup von Env-Variablen zur Provider-Authentifizierung |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, gemeinsame Builder für Replay-Richtlinien, Helfer für Provider-Endpunkte und Helfer zur Normalisierung von Modell-IDs wie `normalizeNativeXaiModelId` |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | Generische Helfer für HTTP/Endpunktfähigkeiten von Providern, Provider-HTTP-Fehler und Helfer für Multipart-Formulare bei Audio-Transkription |
    | `plugin-sdk/provider-web-fetch-contract` | Schmale Helfer für Verträge von Web-Fetch-Konfiguration/-Auswahl wie `enablePluginInConfig` und `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | Helfer für Registrierung/Cache von Web-Fetch-Providern |
    | `plugin-sdk/provider-web-search-config-contract` | Schmale Helfer für Web-Search-Konfiguration/Zugangsdaten für Provider, die keine Plugin-Aktivierungsverdrahtung benötigen |
    | `plugin-sdk/provider-web-search-contract` | Schmale Helfer für Verträge von Web-Search-Konfiguration/Zugangsdaten wie `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` und scoped Setter/Getter für Zugangsdaten |
    | `plugin-sdk/provider-web-search` | Helfer für Registrierung/Cache/Laufzeit von Web-Search-Providern |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, Bereinigung + Diagnostik für Gemini-Schemata und xAI-Kompatibilitätshelfer wie `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
    | `plugin-sdk/provider-usage` | `fetchClaudeUsage` und Ähnliches |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, Typen für Stream-Wrapper und gemeinsame Wrapper-Helfer für Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
    | `plugin-sdk/provider-transport-runtime` | Native Helfer für Provider-Transporte wie guarded fetch, Transport-Nachrichtentransformationen und beschreibbare Transport-Event-Streams |
    | `plugin-sdk/provider-onboard` | Helfer für Konfigurations-Patches beim Onboarding |
    | `plugin-sdk/global-singleton` | Prozesslokale Helfer für Singleton/Map/Cache |
    | `plugin-sdk/group-activation` | Schmale Helfer für Gruppenaktivierungsmodus und Befehlssyntax |
  </Accordion>

  <Accordion title="Auth- und Sicherheits-Unterpfade">
    | Unterpfad | Zentrale Exporte |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, Helfer für Befehlsregister einschließlich Formatierung dynamischer Argumentmenüs, Helfer für Autorisierung von Absendern |
    | `plugin-sdk/command-status` | Builder für Befehls-/Hilfenachrichten wie `buildCommandsMessagePaginated` und `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | Helfer für Auflösung von Genehmigern und Action-Auth im selben Chat |
    | `plugin-sdk/approval-client-runtime` | Helfer für native Exec-Genehmigungsprofile/-Filter |
    | `plugin-sdk/approval-delivery-runtime` | Adapter für native Genehmigungsfähigkeiten/-zustellung |
    | `plugin-sdk/approval-gateway-runtime` | Gemeinsamer Helfer zur Auflösung des Genehmigungs-Gateway |
    | `plugin-sdk/approval-handler-adapter-runtime` | Leichtgewichtige Helfer zum Laden nativer Genehmigungsadapter für Hot-Channel-Entrypoints |
    | `plugin-sdk/approval-handler-runtime` | Breitere Laufzeithelfer für Genehmigungs-Handler; bevorzugen Sie die schmaleren Adapter-/Gateway-Nähte, wenn diese ausreichen |
    | `plugin-sdk/approval-native-runtime` | Helfer für natives Genehmigungsziel + Account-Binding |
    | `plugin-sdk/approval-reply-runtime` | Helfer für Antwort-Nutzlasten bei Exec-/Plugin-Genehmigungen |
    | `plugin-sdk/approval-runtime` | Helfer für Exec-/Plugin-Genehmigungs-Nutzlasten, Helfer für Routing/Laufzeit nativer Genehmigungen und strukturierte Anzeigen für Genehmigungen wie `formatApprovalDisplayPath` |
    | `plugin-sdk/reply-dedupe` | Schmale Helfer zum Zurücksetzen von Dedupe bei eingehenden Antworten |
    | `plugin-sdk/channel-contract-testing` | Schmale Testhelfer für Kanalverträge ohne das breite Testing-Barrel |
    | `plugin-sdk/command-auth-native` | Native Befehlsauth, Formatierung dynamischer Argumentmenüs und Helfer für native Sitzungsziele |
    | `plugin-sdk/command-detection` | Gemeinsame Helfer zur Befehlserkennung |
    | `plugin-sdk/command-primitives-runtime` | Leichtgewichtige Prädikate für Befehlstexte auf Hot-Channel-Pfaden |
    | `plugin-sdk/command-surface` | Helfer zur Normalisierung von Befehls-Bodies und für Befehlsoberflächen |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | Schmale Helfer zum Sammeln von Secret-Verträgen für Secret-Oberflächen von Kanälen/Plugins |
    | `plugin-sdk/secret-ref-runtime` | Schmale Helfer für `coerceSecretRef` und SecretRef-Typisierung für Parsing von Secret-Verträgen/Konfiguration |
    | `plugin-sdk/security-runtime` | Gemeinsame Helfer für Trust, DM-Gating, externe Inhalte und Secret-Sammlung |
    | `plugin-sdk/ssrf-policy` | Helfer für Host-Allowlist und SSRF-Richtlinie für private Netzwerke |
    | `plugin-sdk/ssrf-dispatcher` | Schmale Helfer für pinned dispatcher ohne die breite Infra-Laufzeitoberfläche |
    | `plugin-sdk/ssrf-runtime` | Helfer für pinned dispatcher, SSRF-geschütztes Fetch und SSRF-Richtlinie |
    | `plugin-sdk/secret-input` | Helfer zum Parsen von Secret-Eingaben |
    | `plugin-sdk/webhook-ingress` | Helfer für Webhook-Anfragen/Ziele |
    | `plugin-sdk/webhook-request-guards` | Helfer für Größe/Timeout von Request-Bodies |
  </Accordion>

  <Accordion title="Laufzeit- und Speicher-Unterpfade">
    | Unterpfad | Zentrale Exporte |
    | --- | --- |
    | `plugin-sdk/runtime` | Breite Helfer für Laufzeit/Logging/Backup/Plugin-Installation |
    | `plugin-sdk/runtime-env` | Schmale Helfer für Laufzeit-Env, Logger, Timeout, Retry und Backoff |
    | `plugin-sdk/channel-runtime-context` | Generische Helfer für Registrierung und Lookup von Kanal-Laufzeitkontext |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Gemeinsame Helfer für Befehle/Hooks/HTTP/interaktive Oberflächen von Plugins |
    | `plugin-sdk/hook-runtime` | Gemeinsame Helfer für Pipelines aus Webhooks/internen Hooks |
    | `plugin-sdk/lazy-runtime` | Helfer für Lazy-Import/Binding von Laufzeiten wie `createLazyRuntimeModule`, `createLazyRuntimeMethod` und `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | Helfer für Process-Exec |
    | `plugin-sdk/cli-runtime` | Helfer für CLI-Formatierung, Warten, Version, Argument-Aufruf und Lazy-Befehlsgruppen |
    | `plugin-sdk/gateway-runtime` | Helfer für Gateway-Client und Patches des Kanalstatus |
    | `plugin-sdk/config-runtime` | Helfer zum Laden/Schreiben von Konfiguration und zum Lookup von Plugin-Konfiguration |
    | `plugin-sdk/telegram-command-config` | Normalisierung von Telegram-Befehlsname/-beschreibung und Prüfungen auf Duplikate/Konflikte, auch wenn die gebündelte Telegram-Vertragsoberfläche nicht verfügbar ist |
    | `plugin-sdk/text-autolink-runtime` | Erkennung von Autolinks für Dateireferenzen ohne das breite Barrel `text-runtime` |
    | `plugin-sdk/approval-runtime` | Helfer für Exec-/Plugin-Genehmigungen, Builder für Genehmigungsfähigkeiten, Helfer für Auth/Profile, natives Routing/Laufzeit und Formatierung strukturierter Anzeige-Pfade für Genehmigungen |
    | `plugin-sdk/reply-runtime` | Gemeinsame Laufzeithelfer für Eingaben/Antworten, Chunking, Dispatch, Heartbeat, Antwortplaner |
    | `plugin-sdk/reply-dispatch-runtime` | Schmale Helfer für Dispatch/Finalisierung von Antworten und Gesprächslabels |
    | `plugin-sdk/reply-history` | Gemeinsame Helfer für Antwortverlauf in kurzen Fenstern wie `buildHistoryContext`, `recordPendingHistoryEntry` und `clearHistoryEntriesIfEnabled` |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | Schmale Helfer für Text-/Markdown-Chunking |
    | `plugin-sdk/session-store-runtime` | Helfer für Pfade und `updated-at` des Sitzungsspeichers |
    | `plugin-sdk/state-paths` | Helfer für Pfade von State-/OAuth-Verzeichnissen |
    | `plugin-sdk/routing` | Helfer für Routen-/Sitzungsschlüssel-/Account-Binding wie `resolveAgentRoute`, `buildAgentSessionKey` und `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | Gemeinsame Helfer für Zusammenfassungen des Kanal-/Account-Status, Standards für Laufzeitzustand und Issue-Metadaten |
    | `plugin-sdk/target-resolver-runtime` | Gemeinsame Helfer zur Zielauflösung |
    | `plugin-sdk/string-normalization-runtime` | Helfer zur Slug-/String-Normalisierung |
    | `plugin-sdk/request-url` | String-URLs aus fetch-/request-ähnlichen Eingaben extrahieren |
    | `plugin-sdk/run-command` | Zeitgesteuerter Befehlsrunner mit normalisierten stdout-/stderr-Ergebnissen |
    | `plugin-sdk/param-readers` | Gemeinsame Param-Reader für Tool/CLI |
    | `plugin-sdk/tool-payload` | Normalisierte Nutzlasten aus Tool-Result-Objekten extrahieren |
    | `plugin-sdk/tool-send` | Kanonische Zielfelder für Senden aus Tool-Args extrahieren |
    | `plugin-sdk/temp-path` | Gemeinsame Helfer für temporäre Download-Pfade |
    | `plugin-sdk/logging-core` | Helfer für Subsystem-Logger und Redaction |
    | `plugin-sdk/markdown-table-runtime` | Helfer für Markdown-Tabellenmodus und Konvertierung |
    | `plugin-sdk/json-store` | Kleine Helfer zum Lesen/Schreiben von JSON-State |
    | `plugin-sdk/file-lock` | Reentrant-Helfer für Dateisperren |
    | `plugin-sdk/persistent-dedupe` | Helfer für diskgestützte Dedupe-Caches |
    | `plugin-sdk/acp-runtime` | Helfer für ACP-Laufzeit/Sitzung und Reply-Dispatch |
    | `plugin-sdk/acp-binding-resolve-runtime` | Schreibgeschützte ACP-Bindungsauflösung ohne Lifecycle-Startup-Imports |
    | `plugin-sdk/agent-config-primitives` | Schmale Primitive des Agent-Laufzeit-Konfigurationsschemas |
    | `plugin-sdk/boolean-param` | Loser Boolean-Param-Reader |
    | `plugin-sdk/dangerous-name-runtime` | Helfer zur Auflösung gefährlicher Namensabgleiche |
    | `plugin-sdk/device-bootstrap` | Helfer für Device-Bootstrap und Pairing-Token |
    | `plugin-sdk/extension-shared` | Gemeinsame Primitive für passive Kanäle, Status und Ambient-Proxy-Helfer |
    | `plugin-sdk/models-provider-runtime` | Helfer für Antworten von `/models`-Befehl/Provider |
    | `plugin-sdk/skill-commands-runtime` | Helfer zum Auflisten von Skills-Befehlen |
    | `plugin-sdk/native-command-registry` | Helfer für Register/Aufbau/Serialisierung nativer Befehle |
    | `plugin-sdk/agent-harness` | Experimentelle Oberfläche für vertrauenswürdige Plugins für Low-Level-Agent-Harnesses: Harness-Typen, Helfer für Steer/Abort aktiver Läufe, Bridge-Helfer für OpenClaw-Tools, Helfer für Tool-Richtlinien in Runtime-Plänen, Klassifikation terminaler Ergebnisse, Helfer für Formatierung/Details von Tool-Fortschritt und Utilities für Versuchsergebnisse |
    | `plugin-sdk/provider-zai-endpoint` | Helfer zur Erkennung von Z.AI-Endpunkten |
    | `plugin-sdk/infra-runtime` | Helfer für Systemereignisse/Heartbeat |
    | `plugin-sdk/collection-runtime` | Kleine Helfer für begrenzte Caches |
    | `plugin-sdk/diagnostic-runtime` | Helfer für Diagnose-Flags und -Ereignisse |
    | `plugin-sdk/error-runtime` | Helfer für Fehlergraph, Formatierung, gemeinsame Fehlerklassifikation, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | Helfer für Wrapped Fetch, Proxy und Pinned Lookup |
    | `plugin-sdk/runtime-fetch` | Dispatcher-bewusstes Runtime-Fetch ohne Imports für Proxy/Guarded-Fetch |
    | `plugin-sdk/response-limit-runtime` | Reader für begrenzte Response-Bodies ohne die breite Medien-Laufzeitoberfläche |
    | `plugin-sdk/session-binding-runtime` | Aktueller Zustand von Gesprächsbindungen ohne konfiguriertes Binding-Routing oder Pairing-Stores |
    | `plugin-sdk/session-store-runtime` | Helfer zum Lesen des Sitzungsspeichers ohne breite Imports für Config-Schreibvorgänge/Wartung |
    | `plugin-sdk/context-visibility-runtime` | Auflösung der Kontextsichtbarkeit und Filterung ergänzender Kontexte ohne breite Imports für Config/Sicherheit |
    | `plugin-sdk/string-coerce-runtime` | Schmale Helfer für Primitive Record-/String-Koerzierung und Normalisierung ohne Imports für Markdown/Logging |
    | `plugin-sdk/host-runtime` | Helfer zur Normalisierung von Hostnamen und SCP-Hosts |
    | `plugin-sdk/retry-runtime` | Helfer für Retry-Konfiguration und Retry-Runner |
    | `plugin-sdk/agent-runtime` | Helfer für Agent-Verzeichnis/Identität/Workspace |
    | `plugin-sdk/directory-runtime` | Konfigurationsgestützte Verzeichnisabfragen/-Dedupe |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Unterpfade für Fähigkeiten und Tests">
    | Unterpfad | Zentrale Exporte |
    | --- | --- |
    | `plugin-sdk/media-runtime` | Gemeinsame Helfer für Abruf/Transformation/Speicherung von Medien sowie Builder für Medien-Nutzlasten |
    | `plugin-sdk/media-store` | Schmale Helfer für Medienspeicher wie `saveMediaBuffer` |
    | `plugin-sdk/media-generation-runtime` | Gemeinsame Helfer für Failover bei Mediengenerierung, Kandidatenauswahl und Meldungen für fehlende Modelle |
    | `plugin-sdk/media-understanding` | Provider-Typen für Medienverständnis sowie providerseitige Exporte für Bild-/Audio-Helfer |
    | `plugin-sdk/text-runtime` | Gemeinsame Helfer für Text/Markdown/Logging wie das Entfernen von für den Assistant sichtbarem Text, Helfer für Rendering/Chunking/Tabellen in Markdown, Redaction-Helfer, Helfer für Directive-Tags und Utilities für sicheren Text |
    | `plugin-sdk/text-chunking` | Helfer für Chunking ausgehender Texte |
    | `plugin-sdk/speech` | Provider-Typen für Sprache sowie providerseitige Exporte für Direktiven, Register, Validierung und Sprach-Helfer |
    | `plugin-sdk/speech-core` | Gemeinsame Provider-Typen für Sprache, Register, Direktiven, Normalisierung und Sprach-Helfer |
    | `plugin-sdk/realtime-transcription` | Provider-Typen für Realtime-Transkription, Helfer für Register und gemeinsamer WebSocket-Sitzungshelfer |
    | `plugin-sdk/realtime-voice` | Provider-Typen und Register-Helfer für Realtime-Voice |
    | `plugin-sdk/image-generation` | Provider-Typen für Bildgenerierung |
    | `plugin-sdk/image-generation-core` | Gemeinsame Typen, Failover-, Auth- und Register-Helfer für Bildgenerierung |
    | `plugin-sdk/music-generation` | Provider-/Request-/Result-Typen für Musikgenerierung |
    | `plugin-sdk/music-generation-core` | Gemeinsame Typen, Failover-Helfer, Provider-Lookup und Parsing von Modell-Refs für Musikgenerierung |
    | `plugin-sdk/video-generation` | Provider-/Request-/Result-Typen für Videogenerierung |
    | `plugin-sdk/video-generation-core` | Gemeinsame Typen, Failover-Helfer, Provider-Lookup und Parsing von Modell-Refs für Videogenerierung |
    | `plugin-sdk/webhook-targets` | Helfer für Webhook-Zielregister und Installation von Routen |
    | `plugin-sdk/webhook-path` | Helfer zur Normalisierung von Webhook-Pfaden |
    | `plugin-sdk/web-media` | Gemeinsame Helfer zum Laden von Remote-/lokalen Medien |
    | `plugin-sdk/zod` | Re-exportiertes `zod` für Konsumenten des Plugin SDK |
    | `plugin-sdk/testing` | `installCommonResolveTargetErrorCases`, `shouldAckReaction` |
  </Accordion>

  <Accordion title="Memory-Unterpfade">
    | Unterpfad | Zentrale Exporte |
    | --- | --- |
    | `plugin-sdk/memory-core` | Gebündelte Hilfsoberfläche `memory-core` für Manager-/Config-/Datei-/CLI-Helfer |
    | `plugin-sdk/memory-core-engine-runtime` | Laufzeit-Fassade für Memory-Index/Suche |
    | `plugin-sdk/memory-core-host-engine-foundation` | Exporte der Foundation-Engine des Memory-Hosts |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Embedding-Verträge des Memory-Hosts, Registerzugriff, lokaler Provider und generische Batch-/Remote-Helfer |
    | `plugin-sdk/memory-core-host-engine-qmd` | Exporte der QMD-Engine des Memory-Hosts |
    | `plugin-sdk/memory-core-host-engine-storage` | Exporte der Storage-Engine des Memory-Hosts |
    | `plugin-sdk/memory-core-host-multimodal` | Multimodale Helfer des Memory-Hosts |
    | `plugin-sdk/memory-core-host-query` | Query-Helfer des Memory-Hosts |
    | `plugin-sdk/memory-core-host-secret` | Secret-Helfer des Memory-Hosts |
    | `plugin-sdk/memory-core-host-events` | Helfer für Event-Journal des Memory-Hosts |
    | `plugin-sdk/memory-core-host-status` | Status-Helfer des Memory-Hosts |
    | `plugin-sdk/memory-core-host-runtime-cli` | CLI-Laufzeithelfer des Memory-Hosts |
    | `plugin-sdk/memory-core-host-runtime-core` | Kern-Laufzeithelfer des Memory-Hosts |
    | `plugin-sdk/memory-core-host-runtime-files` | Datei-/Laufzeithelfer des Memory-Hosts |
    | `plugin-sdk/memory-host-core` | Anbieterneutraler Alias für Kern-Laufzeithelfer des Memory-Hosts |
    | `plugin-sdk/memory-host-events` | Anbieterneutraler Alias für Helfer des Event-Journals des Memory-Hosts |
    | `plugin-sdk/memory-host-files` | Anbieterneutraler Alias für Datei-/Laufzeithelfer des Memory-Hosts |
    | `plugin-sdk/memory-host-markdown` | Gemeinsame Helfer für verwaltetes Markdown für speichernahe Plugins |
    | `plugin-sdk/memory-host-search` | Active Memory Laufzeit-Fassade für Zugriff auf Search-Manager |
    | `plugin-sdk/memory-host-status` | Anbieterneutraler Alias für Status-Helfer des Memory-Hosts |
    | `plugin-sdk/memory-lancedb` | Gebündelte Hilfsoberfläche `memory-lancedb` |
  </Accordion>

  <Accordion title="Reservierte Unterpfade für gebündelte Helfer">
    | Familie | Aktuelle Unterpfade | Beabsichtigte Verwendung |
    | --- | --- | --- |
    | Browser | `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support` | Unterstützende Helfer für das gebündelte Browser-Plugin. `browser-profiles` exportiert `resolveBrowserConfig`, `resolveProfile`, `ResolvedBrowserConfig`, `ResolvedBrowserProfile` und `ResolvedBrowserTabCleanupConfig` für die normalisierte Form `browser.tabCleanup`. `browser-support` bleibt das Kompatibilitäts-Barrel. |
    | Matrix | `plugin-sdk/matrix`, `plugin-sdk/matrix-helper`, `plugin-sdk/matrix-runtime-heavy`, `plugin-sdk/matrix-runtime-shared`, `plugin-sdk/matrix-runtime-surface`, `plugin-sdk/matrix-surface`, `plugin-sdk/matrix-thread-bindings` | Gebündelte Helfer-/Laufzeitoberfläche für Matrix |
    | Line | `plugin-sdk/line`, `plugin-sdk/line-core`, `plugin-sdk/line-runtime`, `plugin-sdk/line-surface` | Gebündelte Helfer-/Laufzeitoberfläche für LINE |
    | IRC | `plugin-sdk/irc`, `plugin-sdk/irc-surface` | Gebündelte Helferoberfläche für IRC |
    | Kanalspezifische Helfer | `plugin-sdk/googlechat`, `plugin-sdk/zalouser`, `plugin-sdk/bluebubbles`, `plugin-sdk/bluebubbles-policy`, `plugin-sdk/mattermost`, `plugin-sdk/mattermost-policy`, `plugin-sdk/feishu-conversation`, `plugin-sdk/msteams`, `plugin-sdk/nextcloud-talk`, `plugin-sdk/nostr`, `plugin-sdk/tlon`, `plugin-sdk/twitch` | Gebündelte Kompatibilitäts-/Helfer-Nähte für Kanäle |
    | Auth-/Plugin-spezifische Helfer | `plugin-sdk/github-copilot-login`, `plugin-sdk/github-copilot-token`, `plugin-sdk/diagnostics-otel`, `plugin-sdk/diagnostics-prometheus`, `plugin-sdk/diffs`, `plugin-sdk/llm-task`, `plugin-sdk/thread-ownership`, `plugin-sdk/voice-call` | Gebündelte Helfer-Nähte für Funktionen/Plugins; `plugin-sdk/github-copilot-token` exportiert derzeit `DEFAULT_COPILOT_API_BASE_URL`, `deriveCopilotApiBaseUrlFromToken` und `resolveCopilotApiToken` |
  </Accordion>
</AccordionGroup>

## Verwandt

- [Plugin SDK overview](/de/plugins/sdk-overview)
- [Plugin SDK setup](/de/plugins/sdk-setup)
- [Building plugins](/de/plugins/building-plugins)
