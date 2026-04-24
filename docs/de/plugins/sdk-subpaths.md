---
read_when:
    - Den richtigen plugin-sdk-Subpfad für einen Plugin-Import auswählen
    - Subpfade gebündelter Plugins und Hilfsoberflächen prüfen
summary: 'Plugin-SDK-Subpfad-Katalog: Welche Imports wo liegen, nach Bereichen gruppiert'
title: Plugin-SDK-Subpfade
x-i18n:
    generated_at: "2026-04-24T09:00:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: 20b923e392b3ec65cfc958ccc7452b52d82bc372ae57cc9becad74a5085ed71b
    source_path: plugins/sdk-subpaths.md
    workflow: 15
---

  Das Plugin-SDK wird als Satz enger Subpfade unter `openclaw/plugin-sdk/` bereitgestellt.
  Diese Seite katalogisiert die häufig verwendeten Subpfade nach Zweck gruppiert. Die generierte
  vollständige Liste mit mehr als 200 Subpfaden liegt in `scripts/lib/plugin-sdk-entrypoints.json`;
  reservierte Hilfs-Subpfade für gebündelte Plugins erscheinen dort ebenfalls, sind aber ein
  Implementierungsdetail, sofern eine Dokumentationsseite sie nicht ausdrücklich hervorhebt.

  Den Leitfaden zum Schreiben von Plugins finden Sie unter [Plugin SDK overview](/de/plugins/sdk-overview).

  ## Plugin-Einstieg

  | Subpfad                    | Wichtige Exporte                                                                                                                       |
  | -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
  | `plugin-sdk/plugin-entry`  | `definePluginEntry`                                                                                                                    |
  | `plugin-sdk/core`          | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema` |
  | `plugin-sdk/config-schema` | `OpenClawSchema`                                                                                                                       |
  | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry`                                                                                                     |

  <AccordionGroup>
  <Accordion title="Channel-Subpfade">
    | Subpfad | Wichtige Exporte |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | Root-`openclaw.json`-Zod-Schema-Export (`OpenClawSchema`) |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, plus `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | Gemeinsame Hilfsfunktionen für Setup-Assistenten, Allowlist-Prompts, Setup-Status-Builder |
    | `plugin-sdk/setup-runtime` | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | `createEnvPatchedAccountSetupAdapter` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | Hilfsfunktionen für Multi-Account-Config/Aktions-Gates, Hilfsfunktionen für den Fallback auf den Standard-Account |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, Hilfsfunktionen zur Normalisierung von Account-IDs |
    | `plugin-sdk/account-resolution` | Hilfsfunktionen für Account-Lookup + Standard-Fallback |
    | `plugin-sdk/account-helpers` | Enge Hilfsfunktionen für Account-Listen/Account-Aktionen |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | `createChannelReplyPipeline` |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter` |
    | `plugin-sdk/channel-config-schema` | Typen für das Channel-Config-Schema |
    | `plugin-sdk/telegram-command-config` | Hilfsfunktionen zur Normalisierung/Validierung benutzerdefinierter Telegram-Befehle mit Fallback auf den gebündelten Vertrag |
    | `plugin-sdk/command-gating` | Enge Hilfsfunktionen für Gates zur Befehlsautorisierung |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-lifecycle` | `createAccountStatusSink`, Hilfsfunktionen für Lifecycle/Abschluss von Entwurfsstreams |
    | `plugin-sdk/inbound-envelope` | Gemeinsame Hilfsfunktionen für Inbound-Routing + Envelope-Builder |
    | `plugin-sdk/inbound-reply-dispatch` | Gemeinsame Hilfsfunktionen für Inbound-Aufzeichnung und -Dispatch |
    | `plugin-sdk/messaging-targets` | Hilfsfunktionen zum Parsen/Abgleichen von Zielen |
    | `plugin-sdk/outbound-media` | Gemeinsame Hilfsfunktionen zum Laden ausgehender Medien |
    | `plugin-sdk/outbound-runtime` | Hilfsfunktionen für ausgehende Identität, Sendedelegation und Payload-Planung |
    | `plugin-sdk/poll-runtime` | Enge Hilfsfunktionen zur Umfrage-Normalisierung |
    | `plugin-sdk/thread-bindings-runtime` | Hilfsfunktionen für den Lifecycle und Adapter von Thread-Bindings |
    | `plugin-sdk/agent-media-payload` | Veralteter Builder für Agent-Medien-Payload |
    | `plugin-sdk/conversation-runtime` | Hilfsfunktionen für Conversation-/Thread-Binding, Pairing und konfiguriertes Binding |
    | `plugin-sdk/runtime-config-snapshot` | Hilfsfunktion für Runtime-Config-Snapshots |
    | `plugin-sdk/runtime-group-policy` | Hilfsfunktionen zur Auflösung von Runtime-Gruppenrichtlinien |
    | `plugin-sdk/channel-status` | Gemeinsame Hilfsfunktionen für Channel-Status-Snapshots/-Zusammenfassungen |
    | `plugin-sdk/channel-config-primitives` | Enge Primitive für das Channel-Config-Schema |
    | `plugin-sdk/channel-config-writes` | Hilfsfunktionen zur Autorisierung von Channel-Config-Schreibvorgängen |
    | `plugin-sdk/channel-plugin-common` | Gemeinsame Prelude-Exporte für Channel-Plugins |
    | `plugin-sdk/allowlist-config-edit` | Hilfsfunktionen zum Bearbeiten/Lesen der Allowlist-Config |
    | `plugin-sdk/group-access` | Gemeinsame Hilfsfunktionen für Entscheidungen zum Gruppenzugriff |
    | `plugin-sdk/direct-dm` | Gemeinsame Hilfsfunktionen für Authentifizierung/Guards bei direkten DMs |
    | `plugin-sdk/interactive-runtime` | Semantische Nachrichtendarstellung, Zustellung und veraltete Hilfsfunktionen für interaktive Antworten. Siehe [Message Presentation](/de/plugins/message-presentation) |
    | `plugin-sdk/channel-inbound` | Kompatibilitäts-Barrel für Inbound-Debounce, Erwähnungsabgleich, Hilfsfunktionen für Erwähnungsrichtlinien und Envelope-Hilfsfunktionen |
    | `plugin-sdk/channel-inbound-debounce` | Enge Hilfsfunktionen für Inbound-Debounce |
    | `plugin-sdk/channel-mention-gating` | Enge Hilfsfunktionen für Erwähnungsrichtlinien und Erwähnungstext ohne die breitere Inbound-Runtime-Oberfläche |
    | `plugin-sdk/channel-envelope` | Enge Hilfsfunktionen für die Formatierung von Inbound-Envelopes |
    | `plugin-sdk/channel-location` | Hilfsfunktionen für Kontext und Formatierung von Channel-Standorten |
    | `plugin-sdk/channel-logging` | Hilfsfunktionen für Channel-Logging bei verworfenen Inbounds und Fehlern bei Typing/Ack |
    | `plugin-sdk/channel-send-result` | Typen für Antwortergebnisse |
    | `plugin-sdk/channel-actions` | Hilfsfunktionen für Channel-Nachrichtenaktionen sowie veraltete native Schema-Hilfsfunktionen, die für die Plugin-Kompatibilität beibehalten werden |
    | `plugin-sdk/channel-targets` | Hilfsfunktionen zum Parsen/Abgleichen von Zielen |
    | `plugin-sdk/channel-contract` | Channel-Vertragstypen |
    | `plugin-sdk/channel-feedback` | Wiring für Feedback/Reaktionen |
    | `plugin-sdk/channel-secret-runtime` | Enge Hilfsfunktionen für Secret-Verträge wie `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment` und Secret-Zieltypen |
  </Accordion>

  <Accordion title="Provider-Subpfade">
    | Subpfad | Wichtige Exporte |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/provider-setup` | Kuratierte Hilfsfunktionen für das Setup lokaler/self-hosted Provider |
    | `plugin-sdk/self-hosted-provider-setup` | Fokussierte Hilfsfunktionen für das Setup self-hosted OpenAI-kompatibler Provider |
    | `plugin-sdk/cli-backend` | CLI-Backend-Standards + Watchdog-Konstanten |
    | `plugin-sdk/provider-auth-runtime` | Hilfsfunktionen zur API-Key-Auflösung zur Laufzeit für Provider-Plugins |
    | `plugin-sdk/provider-auth-api-key` | Hilfsfunktionen für API-Key-Onboarding/Profilschreibvorgänge wie `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | Standard-Builder für OAuth-Authentifizierungsergebnisse |
    | `plugin-sdk/provider-auth-login` | Gemeinsame Hilfsfunktionen für interaktiven Login bei Provider-Plugins |
    | `plugin-sdk/provider-env-vars` | Hilfsfunktionen für das Lookup von Provider-Auth-Umgebungsvariablen |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, gemeinsame Builder für Replay-Richtlinien, Hilfsfunktionen für Provider-Endpunkte und Hilfsfunktionen zur Normalisierung von Modell-IDs wie `normalizeNativeXaiModelId` |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | Generische Hilfsfunktionen für HTTP/Endpunkt-Capabilities von Providern, einschließlich Hilfsfunktionen für Multipart-Formulare bei Audio-Transkription |
    | `plugin-sdk/provider-web-fetch-contract` | Enge Hilfsfunktionen für Web-Fetch-Config-/Auswahlverträge wie `enablePluginInConfig` und `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | Hilfsfunktionen für Registrierung/Cache von Web-Fetch-Providern |
    | `plugin-sdk/provider-web-search-config-contract` | Enge Hilfsfunktionen für Web-Search-Config/Anmeldeinformationen für Provider, die kein Wiring zur Plugin-Aktivierung benötigen |
    | `plugin-sdk/provider-web-search-contract` | Enge Hilfsfunktionen für Web-Search-Config-/Anmeldedatenverträge wie `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` sowie Scoped-Setter/Getter für Anmeldedaten |
    | `plugin-sdk/provider-web-search` | Hilfsfunktionen für Registrierung/Cache/Runtime von Web-Search-Providern |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, Gemini-Schema-Bereinigung + Diagnosen sowie xAI-Kompatibilitäts-Hilfsfunktionen wie `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
    | `plugin-sdk/provider-usage` | `fetchClaudeUsage` und Ähnliches |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, Stream-Wrapper-Typen und gemeinsame Wrapper-Hilfsfunktionen für Anthropic/Bedrock/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
    | `plugin-sdk/provider-transport-runtime` | Native Hilfsfunktionen für Provider-Transporte wie geschütztes Fetch, Transformationen von Transportnachrichten und beschreibbare Transport-Ereignisströme |
    | `plugin-sdk/provider-onboard` | Hilfsfunktionen für das Patchen der Onboarding-Config |
    | `plugin-sdk/global-singleton` | Hilfsfunktionen für prozesslokale Singleton-/Map-/Cache-Strukturen |
    | `plugin-sdk/group-activation` | Enge Hilfsfunktionen für Gruppenaktivierungsmodi und Befehlsparsing |
  </Accordion>

  <Accordion title="Subpfade für Authentifizierung und Sicherheit">
    | Subpfad | Wichtige Exporte |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, Hilfsfunktionen für die Befehlsregistrierung, Hilfsfunktionen für die Absenderautorisierung |
    | `plugin-sdk/command-status` | Builder für Befehls-/Hilfenachrichten wie `buildCommandsMessagePaginated` und `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | Hilfsfunktionen für die Auflösung von Approvern und Action-Auth im selben Chat |
    | `plugin-sdk/approval-client-runtime` | Hilfsfunktionen für native Exec-Freigabeprofile/-Filter |
    | `plugin-sdk/approval-delivery-runtime` | Adapter für native Freigabe-Capabilities/-Zustellung |
    | `plugin-sdk/approval-gateway-runtime` | Gemeinsame Hilfsfunktion für die Auflösung des Freigabe-Gateways |
    | `plugin-sdk/approval-handler-adapter-runtime` | Leichtgewichtige Hilfsfunktionen zum Laden nativer Freigabe-Adapter für Hot-Channel-Entry-Points |
    | `plugin-sdk/approval-handler-runtime` | Umfassendere Runtime-Hilfsfunktionen für Freigabe-Handler; bevorzugen Sie die engeren Adapter-/Gateway-Seams, wenn diese ausreichen |
    | `plugin-sdk/approval-native-runtime` | Hilfsfunktionen für native Freigabeziele + Account-Bindings |
    | `plugin-sdk/approval-reply-runtime` | Hilfsfunktionen für Reply-Payloads bei Exec-/Plugin-Freigaben |
    | `plugin-sdk/reply-dedupe` | Enge Hilfsfunktionen zum Zurücksetzen der Deduplizierung eingehender Antworten |
    | `plugin-sdk/channel-contract-testing` | Enge Testhilfsfunktionen für Channel-Verträge ohne das breite Testing-Barrel |
    | `plugin-sdk/command-auth-native` | Native Hilfsfunktionen für Befehlsauthentifizierung + native Sitzungsziele |
    | `plugin-sdk/command-detection` | Gemeinsame Hilfsfunktionen zur Befehlserkennung |
    | `plugin-sdk/command-primitives-runtime` | Leichtgewichtige Prädikate für Befehlstext auf Hot-Channel-Pfaden |
    | `plugin-sdk/command-surface` | Hilfsfunktionen für die Normalisierung von Befehlsinhalt und Befehlsoberfläche |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | Enge Hilfsfunktionen für die Sammlung von Secret-Verträgen auf Channel-/Plugin-Secret-Oberflächen |
    | `plugin-sdk/secret-ref-runtime` | Enge Hilfsfunktionen für `coerceSecretRef` und SecretRef-Typisierung für das Parsen von Secret-Verträgen/Config |
    | `plugin-sdk/security-runtime` | Gemeinsame Hilfsfunktionen für Vertrauen, DM-Gating, externe Inhalte und Secret-Sammlung |
    | `plugin-sdk/ssrf-policy` | Hilfsfunktionen für Host-Allowlist und SSRF-Richtlinien für private Netzwerke |
    | `plugin-sdk/ssrf-dispatcher` | Enge Hilfsfunktionen für angeheftete Dispatcher ohne die breite Infra-Runtime-Oberfläche |
    | `plugin-sdk/ssrf-runtime` | Hilfsfunktionen für angeheftete Dispatcher, SSRF-geschütztes Fetch und SSRF-Richtlinien |
    | `plugin-sdk/secret-input` | Hilfsfunktionen zum Parsen von Secret-Eingaben |
    | `plugin-sdk/webhook-ingress` | Hilfsfunktionen für Webhook-Anfragen/-Ziele |
    | `plugin-sdk/webhook-request-guards` | Hilfsfunktionen für Body-Größe/Timeout bei Anfragen |
  </Accordion>

  <Accordion title="Subpfade für Runtime und Speicher">
    | Subpfad | Wichtige Exporte |
    | --- | --- |
    | `plugin-sdk/runtime` | Umfassende Hilfsfunktionen für Runtime/Logging/Backups/Plugin-Installation |
    | `plugin-sdk/runtime-env` | Enge Hilfsfunktionen für Runtime-Umgebung, Logger, Timeout, Retry und Backoff |
    | `plugin-sdk/channel-runtime-context` | Generische Hilfsfunktionen für Registrierung und Lookup des Channel-Runtime-Kontexts |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Gemeinsame Hilfsfunktionen für Plugin-Befehle/-Hooks/-HTTP/-Interaktivität |
    | `plugin-sdk/hook-runtime` | Gemeinsame Hilfsfunktionen für Webhook-/interne Hook-Pipelines |
    | `plugin-sdk/lazy-runtime` | Hilfsfunktionen für Lazy-Runtime-Import/Binding wie `createLazyRuntimeModule`, `createLazyRuntimeMethod` und `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | Hilfsfunktionen für die Ausführung von Prozessen |
    | `plugin-sdk/cli-runtime` | Hilfsfunktionen für CLI-Formatierung, Warten und Version |
    | `plugin-sdk/gateway-runtime` | Hilfsfunktionen für Gateway-Client und Patches des Channel-Status |
    | `plugin-sdk/config-runtime` | Hilfsfunktionen zum Laden/Schreiben von Config und zum Lookup von Plugin-Config |
    | `plugin-sdk/telegram-command-config` | Hilfsfunktionen zur Normalisierung von Telegram-Befehlsnamen/-beschreibungen und zu Prüfungen auf Duplikate/Konflikte, auch wenn die gebündelte Telegram-Vertragsoberfläche nicht verfügbar ist |
    | `plugin-sdk/text-autolink-runtime` | Erkennung von Autolinks für Dateireferenzen ohne das breite `text-runtime`-Barrel |
    | `plugin-sdk/approval-runtime` | Hilfsfunktionen für Exec-/Plugin-Freigaben, Builder für Freigabe-Capabilities, Auth-/Profil-Hilfsfunktionen, natives Routing/Runtime |
    | `plugin-sdk/reply-runtime` | Gemeinsame Inbound-/Reply-Runtime-Hilfsfunktionen, Chunking, Dispatch, Heartbeat, Reply-Planer |
    | `plugin-sdk/reply-dispatch-runtime` | Enge Hilfsfunktionen für Reply-Dispatch/-Abschluss und Konversationslabels |
    | `plugin-sdk/reply-history` | Gemeinsame Hilfsfunktionen für den Antwortverlauf in kurzen Fenstern wie `buildHistoryContext`, `recordPendingHistoryEntry` und `clearHistoryEntriesIfEnabled` |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | Enge Hilfsfunktionen für Text-/Markdown-Chunking |
    | `plugin-sdk/session-store-runtime` | Hilfsfunktionen für Pfade des Sitzungsstores + `updated-at` |
    | `plugin-sdk/state-paths` | Hilfsfunktionen für Pfade von State-/OAuth-Verzeichnissen |
    | `plugin-sdk/routing` | Hilfsfunktionen für Route-/Sitzungsschlüssel-/Account-Bindings wie `resolveAgentRoute`, `buildAgentSessionKey` und `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | Gemeinsame Hilfsfunktionen für Zusammenfassungen des Channel-/Account-Status, Runtime-State-Standards und Metadaten zu Problemen |
    | `plugin-sdk/target-resolver-runtime` | Gemeinsame Hilfsfunktionen für den Target-Resolver |
    | `plugin-sdk/string-normalization-runtime` | Hilfsfunktionen zur Slug-/String-Normalisierung |
    | `plugin-sdk/request-url` | String-URLs aus Fetch-/Request-ähnlichen Eingaben extrahieren |
    | `plugin-sdk/run-command` | Runner für zeitgesteuerte Befehle mit normalisierten Ergebnissen für stdout/stderr |
    | `plugin-sdk/param-readers` | Allgemeine Param-Reader für Tools/CLI |
    | `plugin-sdk/tool-payload` | Normalisierte Payloads aus Objekten für Tool-Ergebnisse extrahieren |
    | `plugin-sdk/tool-send` | Kanonische Ziel-Felder für Send aus Tool-Argumenten extrahieren |
    | `plugin-sdk/temp-path` | Gemeinsame Hilfsfunktionen für Pfade temporärer Downloads |
    | `plugin-sdk/logging-core` | Hilfsfunktionen für Subsystem-Logger und Redaction |
    | `plugin-sdk/markdown-table-runtime` | Hilfsfunktionen für Markdown-Tabellenmodus und -Konvertierung |
    | `plugin-sdk/json-store` | Kleine Hilfsfunktionen zum Lesen/Schreiben von JSON-State |
    | `plugin-sdk/file-lock` | Wiederbetretbare Hilfsfunktionen für Dateisperren |
    | `plugin-sdk/persistent-dedupe` | Hilfsfunktionen für festplattenbasierten Dedupe-Cache |
    | `plugin-sdk/acp-runtime` | Hilfsfunktionen für ACP-Runtime/Sitzung und Reply-Dispatch |
    | `plugin-sdk/acp-binding-resolve-runtime` | Schreibgeschützte Auflösung von ACP-Bindings ohne Lifecycle-Startup-Imports |
    | `plugin-sdk/agent-config-primitives` | Enge Primitive für das Runtime-Config-Schema des Agents |
    | `plugin-sdk/boolean-param` | Lockere Param-Auslesung für Boolean |
    | `plugin-sdk/dangerous-name-runtime` | Hilfsfunktionen zur Auflösung von Abgleichen für gefährliche Namen |
    | `plugin-sdk/device-bootstrap` | Hilfsfunktionen für Device-Bootstrap und Pairing-Token |
    | `plugin-sdk/extension-shared` | Gemeinsame Primitive für passive Channels, Status und Ambient-Proxy-Helfer |
    | `plugin-sdk/models-provider-runtime` | Hilfsfunktionen für `/models`-Befehl/Provider-Antworten |
    | `plugin-sdk/skill-commands-runtime` | Hilfsfunktionen zum Auflisten von Skill-Befehlen |
    | `plugin-sdk/native-command-registry` | Hilfsfunktionen für Registrieren/Erstellen/Serialisieren nativer Befehle |
    | `plugin-sdk/agent-harness` | Experimentelle Oberfläche für vertrauenswürdige Plugins für Low-Level-Agent-Harnesses: Harness-Typen, Hilfsfunktionen zum Steuern/Abbrechen aktiver Läufe, OpenClaw-Tool-Bridge-Hilfsfunktionen, Hilfsfunktionen für Tool-Fortschrittsformatierung/-details und Hilfsfunktionen für Versuchsergebnisse |
    | `plugin-sdk/provider-zai-endpoint` | Hilfsfunktionen zur Erkennung von Z.AI-Endpunkten |
    | `plugin-sdk/infra-runtime` | Hilfsfunktionen für Systemereignisse/Heartbeat |
    | `plugin-sdk/collection-runtime` | Kleine Hilfsfunktionen für begrenzte Caches |
    | `plugin-sdk/diagnostic-runtime` | Hilfsfunktionen für Diagnose-Flags und -Ereignisse |
    | `plugin-sdk/error-runtime` | Hilfsfunktionen für Fehlergraph, Formatierung, gemeinsame Fehlerklassifizierung, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | Hilfsfunktionen für umhülltes Fetch, Proxy und angeheftetes Lookup |
    | `plugin-sdk/runtime-fetch` | Dispatcher-sensitives Runtime-Fetch ohne Importe für Proxy/geschütztes Fetch |
    | `plugin-sdk/response-limit-runtime` | Begrenzter Reader für Response-Bodys ohne die breite Media-Runtime-Oberfläche |
    | `plugin-sdk/session-binding-runtime` | Aktueller Konversations-Binding-Status ohne Routing für konfigurierte Bindings oder Pairing-Stores |
    | `plugin-sdk/session-store-runtime` | Hilfsfunktionen zum Lesen des Sitzungsstores ohne breite Importe für Config-Schreibvorgänge/Wartung |
    | `plugin-sdk/context-visibility-runtime` | Auflösung der Kontextsichtigkeit und Filterung zusätzlichen Kontexts ohne breite Importe für Config/Sicherheit |
    | `plugin-sdk/string-coerce-runtime` | Enge Hilfsfunktionen für primitive Records/String-Coercion und Normalisierung ohne Importe für Markdown/Logging |
    | `plugin-sdk/host-runtime` | Hilfsfunktionen zur Normalisierung von Hostnamen und SCP-Hosts |
    | `plugin-sdk/retry-runtime` | Hilfsfunktionen für Retry-Config und Retry-Runner |
    | `plugin-sdk/agent-runtime` | Hilfsfunktionen für Agent-Verzeichnis/Identität/Workspace |
    | `plugin-sdk/directory-runtime` | Config-gestützte Verzeichnisabfrage/-Deduplizierung |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Subpfade für Capabilities und Tests">
    | Subpfad | Wichtige Exporte |
    | --- | --- |
    | `plugin-sdk/media-runtime` | Gemeinsame Hilfsfunktionen für Media-Fetch/Transformation/Speicherung sowie Builder für Media-Payloads |
    | `plugin-sdk/media-store` | Enge Hilfsfunktionen für Media-Store wie `saveMediaBuffer` |
    | `plugin-sdk/media-generation-runtime` | Gemeinsame Hilfsfunktionen für Failover bei Media-Generierung, Kandidatenauswahl und Meldungen bei fehlenden Modellen |
    | `plugin-sdk/media-understanding` | Providertypen für Medienverständnis sowie providerseitige Hilfs-Exporte für Bild/Audio |
    | `plugin-sdk/text-runtime` | Gemeinsame Hilfsfunktionen für Text/Markdown/Logging wie das Entfernen von für Assistants sichtbarem Text, Hilfsfunktionen für Markdown-Rendering/-Chunking/-Tabellen, Hilfsfunktionen für Redaction, Hilfsfunktionen für Directive-Tags und Hilfsfunktionen für sicheren Text |
    | `plugin-sdk/text-chunking` | Hilfsfunktion für das Chunking ausgehenden Texts |
    | `plugin-sdk/speech` | Speech-Providertypen sowie providerseitige Hilfsfunktionen für Directive, Registry und Validierung |
    | `plugin-sdk/speech-core` | Gemeinsame Hilfsfunktionen für Speech-Providertypen, Registry, Directive und Normalisierung |
    | `plugin-sdk/realtime-transcription` | Providertypen für Echtzeit-Transkription, Hilfsfunktionen für Registries und gemeinsame WebSocket-Sitzungshilfsfunktion |
    | `plugin-sdk/realtime-voice` | Providertypen für Echtzeit-Stimme und Hilfsfunktionen für Registries |
    | `plugin-sdk/image-generation` | Providertypen für Bildgenerierung |
    | `plugin-sdk/image-generation-core` | Gemeinsame Hilfsfunktionen für Typen, Failover, Auth und Registry bei Bildgenerierung |
    | `plugin-sdk/music-generation` | Provider-/Anfrage-/Ergebnistypen für Musikgenerierung |
    | `plugin-sdk/music-generation-core` | Gemeinsame Hilfsfunktionen für Typen, Failover, Provider-Lookup und Modellreferenz-Parsen bei Musikgenerierung |
    | `plugin-sdk/video-generation` | Provider-/Anfrage-/Ergebnistypen für Videogenerierung |
    | `plugin-sdk/video-generation-core` | Gemeinsame Hilfsfunktionen für Typen, Failover, Provider-Lookup und Modellreferenz-Parsen bei Videogenerierung |
    | `plugin-sdk/webhook-targets` | Hilfsfunktionen für Webhook-Ziel-Registry und Routeninstallation |
    | `plugin-sdk/webhook-path` | Hilfsfunktionen zur Normalisierung von Webhook-Pfaden |
    | `plugin-sdk/web-media` | Gemeinsame Hilfsfunktionen zum Laden entfernter/lokaler Medien |
    | `plugin-sdk/zod` | Re-exportiertes `zod` für Verbraucher des Plugin-SDK |
    | `plugin-sdk/testing` | `installCommonResolveTargetErrorCases`, `shouldAckReaction` |
  </Accordion>

  <Accordion title="Memory-Subpfade">
    | Subpfad | Wichtige Exporte |
    | --- | --- |
    | `plugin-sdk/memory-core` | Gebündelte Hilfsoberfläche von memory-core für Hilfsfunktionen zu Manager/Config/Datei/CLI |
    | `plugin-sdk/memory-core-engine-runtime` | Runtime-Fassade für Speicherindex/Suche |
    | `plugin-sdk/memory-core-host-engine-foundation` | Exporte der Foundation-Engine des Memory-Hosts |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Embedding-Verträge des Memory-Hosts, Registry-Zugriff, lokaler Provider sowie generische Hilfsfunktionen für Batch/Remote |
    | `plugin-sdk/memory-core-host-engine-qmd` | Exporte der QMD-Engine des Memory-Hosts |
    | `plugin-sdk/memory-core-host-engine-storage` | Exporte der Storage-Engine des Memory-Hosts |
    | `plugin-sdk/memory-core-host-multimodal` | Multimodale Hilfsfunktionen des Memory-Hosts |
    | `plugin-sdk/memory-core-host-query` | Query-Hilfsfunktionen des Memory-Hosts |
    | `plugin-sdk/memory-core-host-secret` | Secret-Hilfsfunktionen des Memory-Hosts |
    | `plugin-sdk/memory-core-host-events` | Hilfsfunktionen für das Ereignisjournal des Memory-Hosts |
    | `plugin-sdk/memory-core-host-status` | Status-Hilfsfunktionen des Memory-Hosts |
    | `plugin-sdk/memory-core-host-runtime-cli` | CLI-Runtime-Hilfsfunktionen des Memory-Hosts |
    | `plugin-sdk/memory-core-host-runtime-core` | Core-Runtime-Hilfsfunktionen des Memory-Hosts |
    | `plugin-sdk/memory-core-host-runtime-files` | Datei-/Runtime-Hilfsfunktionen des Memory-Hosts |
    | `plugin-sdk/memory-host-core` | Anbieterneutraler Alias für Core-Runtime-Hilfsfunktionen des Memory-Hosts |
    | `plugin-sdk/memory-host-events` | Anbieterneutraler Alias für Hilfsfunktionen für das Ereignisjournal des Memory-Hosts |
    | `plugin-sdk/memory-host-files` | Anbieterneutraler Alias für Datei-/Runtime-Hilfsfunktionen des Memory-Hosts |
    | `plugin-sdk/memory-host-markdown` | Gemeinsame Hilfsfunktionen für verwaltetes Markdown für Memory-nahe Plugins |
    | `plugin-sdk/memory-host-search` | Active Memory Runtime-Fassade für den Zugriff auf Search-Manager |
    | `plugin-sdk/memory-host-status` | Anbieterneutraler Alias für Status-Hilfsfunktionen des Memory-Hosts |
    | `plugin-sdk/memory-lancedb` | Gebündelte Hilfsoberfläche von memory-lancedb |
  </Accordion>

  <Accordion title="Reservierte Subpfade für gebündelte Hilfsfunktionen">
    | Familie | Aktuelle Subpfade | Vorgesehene Verwendung |
    | --- | --- | --- |
    | Browser | `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support` | Hilfsfunktionen zur Unterstützung des gebündelten Browser-Plugins (`browser-support` bleibt das Kompatibilitäts-Barrel) |
    | Matrix | `plugin-sdk/matrix`, `plugin-sdk/matrix-helper`, `plugin-sdk/matrix-runtime-heavy`, `plugin-sdk/matrix-runtime-shared`, `plugin-sdk/matrix-runtime-surface`, `plugin-sdk/matrix-surface`, `plugin-sdk/matrix-thread-bindings` | Gebündelte Hilfs-/Runtime-Oberfläche für Matrix |
    | Line | `plugin-sdk/line`, `plugin-sdk/line-core`, `plugin-sdk/line-runtime`, `plugin-sdk/line-surface` | Gebündelte Hilfs-/Runtime-Oberfläche für LINE |
    | IRC | `plugin-sdk/irc`, `plugin-sdk/irc-surface` | Gebündelte Hilfsoberfläche für IRC |
    | Channel-spezifische Hilfsfunktionen | `plugin-sdk/googlechat`, `plugin-sdk/zalouser`, `plugin-sdk/bluebubbles`, `plugin-sdk/bluebubbles-policy`, `plugin-sdk/mattermost`, `plugin-sdk/mattermost-policy`, `plugin-sdk/feishu-conversation`, `plugin-sdk/msteams`, `plugin-sdk/nextcloud-talk`, `plugin-sdk/nostr`, `plugin-sdk/tlon`, `plugin-sdk/twitch` | Gebündelte Kompatibilitäts-/Hilfs-Seams für Channels |
    | Auth-/plugin-spezifische Hilfsfunktionen | `plugin-sdk/github-copilot-login`, `plugin-sdk/github-copilot-token`, `plugin-sdk/diagnostics-otel`, `plugin-sdk/diffs`, `plugin-sdk/llm-task`, `plugin-sdk/thread-ownership`, `plugin-sdk/voice-call` | Gebündelte Feature-/Plugin-Hilfs-Seams; `plugin-sdk/github-copilot-token` exportiert derzeit `DEFAULT_COPILOT_API_BASE_URL`, `deriveCopilotApiBaseUrlFromToken` und `resolveCopilotApiToken` |
  </Accordion>
</AccordionGroup>

## Verwandt

- [Plugin SDK overview](/de/plugins/sdk-overview)
- [Plugin SDK setup](/de/plugins/sdk-setup)
- [Plugins erstellen](/de/plugins/building-plugins)
