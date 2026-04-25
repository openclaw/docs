---
read_when:
    - Den richtigen `plugin-sdk`-Subpfad für einen Plugin-Import auswählen
    - Subpfade und Helper-Oberflächen gebündelter Plugins prüfen
summary: 'Katalog der Plugin-SDK-Subpfade: welche Importe wo liegen, nach Bereichen gruppiert'
title: Plugin-SDK-Subpfade
x-i18n:
    generated_at: "2026-04-25T13:54:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0f2e655d660a37030c53826b8ff156ac1897ecd3e753c1b0b43c75d456e2dfba
    source_path: plugins/sdk-subpaths.md
    workflow: 15
---

  Das Plugin-SDK wird als Satz schmaler Subpfade unter `openclaw/plugin-sdk/` bereitgestellt.
  Diese Seite katalogisiert die häufig verwendeten Subpfade, nach Zweck gruppiert. Die generierte
  vollständige Liste mit mehr als 200 Subpfaden liegt in `scripts/lib/plugin-sdk-entrypoints.json`;
  reservierte Helper-Subpfade für gebündelte Plugins erscheinen dort ebenfalls, sind aber ein
  Implementierungsdetail, sofern eine Dokumentationsseite sie nicht ausdrücklich hervorhebt.

  Den Leitfaden zum Schreiben von Plugins finden Sie unter [Plugin SDK overview](/de/plugins/sdk-overview).

  ## Plugin-Entry

  | Subpfad                    | Wichtige Exporte                                                                                                                      |
  | -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
  | `plugin-sdk/plugin-entry`  | `definePluginEntry`                                                                                                                    |
  | `plugin-sdk/core`          | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema` |
  | `plugin-sdk/config-schema` | `OpenClawSchema`                                                                                                                       |
  | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry`                                                                                                     |

  <AccordionGroup>
  <Accordion title="Kanal-Subpfade">
    | Subpfad | Wichtige Exporte |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | Zod-Schema-Export für Root-`openclaw.json` (`OpenClawSchema`) |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard` sowie `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | Gemeinsame Helper für Setup-Assistenten, Allowlist-Prompts, Builder für Setup-Status |
    | `plugin-sdk/setup-runtime` | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | `createEnvPatchedAccountSetupAdapter` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | Helper für Multi-Account-Konfiguration/Aktions-Gates, Helper für Fallback auf das Standardkonto |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, Helper zur Normalisierung von Konto-IDs |
    | `plugin-sdk/account-resolution` | Helper für Kontosuche + Standard-Fallback |
    | `plugin-sdk/account-helpers` | Schmale Helper für Kontolisten/Kontoaktionen |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | `createChannelReplyPipeline` |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter` |
    | `plugin-sdk/channel-config-schema` | Typen für Kanal-Konfigurationsschema |
    | `plugin-sdk/telegram-command-config` | Helper zur Normalisierung/Validierung benutzerdefinierter Telegram-Befehle mit Fallback für gebündelte Verträge |
    | `plugin-sdk/command-gating` | Schmale Helper für Gates zur Befehlsautorisierung |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-lifecycle` | `createAccountStatusSink`, Helper für Draft-Stream-Lebenszyklus/Finalisierung |
    | `plugin-sdk/inbound-envelope` | Gemeinsame Helper für Route + Umschlag eingehender Nachrichten |
    | `plugin-sdk/inbound-reply-dispatch` | Gemeinsame Helper für Record-and-Dispatch eingehender Nachrichten |
    | `plugin-sdk/messaging-targets` | Helper zum Parsen/Matchen von Zielen |
    | `plugin-sdk/outbound-media` | Gemeinsame Helper zum Laden ausgehender Medien |
    | `plugin-sdk/outbound-runtime` | Helper für ausgehende Zustellung, Identität, Sendedelegates, Sitzung, Formatierung und Payload-Planung |
    | `plugin-sdk/poll-runtime` | Schmale Helper zur Normalisierung von Umfragen |
    | `plugin-sdk/thread-bindings-runtime` | Helper für Lebenszyklus und Adapter von Thread-Bindings |
    | `plugin-sdk/agent-media-payload` | Legacy-Builder für Agenten-Medien-Payload |
    | `plugin-sdk/conversation-runtime` | Helper für Gesprächs-/Thread-Binding, Kopplung und konfigurierte Bindungen |
    | `plugin-sdk/runtime-config-snapshot` | Helper für Laufzeit-Konfigurations-Snapshot |
    | `plugin-sdk/runtime-group-policy` | Helper zur Auflösung von Gruppenrichtlinien zur Laufzeit |
    | `plugin-sdk/channel-status` | Gemeinsame Helper für Status-Snapshot/Zusammenfassung von Kanälen |
    | `plugin-sdk/channel-config-primitives` | Schmale Primitive für Kanal-Konfigurationsschema |
    | `plugin-sdk/channel-config-writes` | Helper zur Autorisierung von Schreibvorgängen in der Kanal-Konfiguration |
    | `plugin-sdk/channel-plugin-common` | Gemeinsame Prelude-Exporte für Kanal-Plugins |
    | `plugin-sdk/allowlist-config-edit` | Helper zum Bearbeiten/Lesen der Allowlist-Konfiguration |
    | `plugin-sdk/group-access` | Gemeinsame Helper für Entscheidungen zum Gruppenzugriff |
    | `plugin-sdk/direct-dm` | Gemeinsame Helper für Auth/Guards bei direkten DMs |
    | `plugin-sdk/interactive-runtime` | Semantische Darstellung und Zustellung von Nachrichten sowie Legacy-Helper für interaktive Antworten. Siehe [Message Presentation](/de/plugins/message-presentation) |
    | `plugin-sdk/channel-inbound` | Kompatibilitäts-Barrel für Inbound-Debounce, Matching von Erwähnungen, Helper für Erwähnungsrichtlinien und Umschlag-Helper |
    | `plugin-sdk/channel-inbound-debounce` | Schmale Helper für Inbound-Debounce |
    | `plugin-sdk/channel-mention-gating` | Schmale Helper für Erwähnungsrichtlinie und Erwähnungstext ohne die breitere Inbound-Runtime-Oberfläche |
    | `plugin-sdk/channel-envelope` | Schmale Helper zur Formatierung eingehender Umschläge |
    | `plugin-sdk/channel-location` | Helper für Kontext und Formatierung von Kanalstandorten |
    | `plugin-sdk/channel-logging` | Kanal-Logging-Helper für verworfene Inbound-Nachrichten und Fehler bei Typing/Ack |
    | `plugin-sdk/channel-send-result` | Typen für Antwortergebnisse |
    | `plugin-sdk/channel-actions` | Helper für Kanal-Nachrichtenaktionen sowie veraltete native Schema-Helper, die aus Kompatibilitätsgründen für Plugins beibehalten werden |
    | `plugin-sdk/channel-targets` | Helper zum Parsen/Matchen von Zielen |
    | `plugin-sdk/channel-contract` | Typen für Kanalverträge |
    | `plugin-sdk/channel-feedback` | Verdrahtung von Feedback/Reaktionen |
    | `plugin-sdk/channel-secret-runtime` | Schmale Helper für Secret-Verträge wie `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment` und Secret-Zieltypen |
  </Accordion>

  <Accordion title="Provider-Subpfade">
    | Subpfad | Wichtige Exporte |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/provider-setup` | Kuratierte Setup-Helper für lokale/self-hosted Provider |
    | `plugin-sdk/self-hosted-provider-setup` | Fokussierte Setup-Helper für OpenAI-kompatible self-hosted Provider |
    | `plugin-sdk/cli-backend` | Standards für CLI-Backends + Watchdog-Konstanten |
    | `plugin-sdk/provider-auth-runtime` | Laufzeit-Helper zur Auflösung von API-Keys für Provider-Plugins |
    | `plugin-sdk/provider-auth-api-key` | Helper für Onboarding/Profilschreibvorgänge von API-Keys wie `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | Standard-Builder für OAuth-Auth-Ergebnisse |
    | `plugin-sdk/provider-auth-login` | Gemeinsame interaktive Login-Helper für Provider-Plugins |
    | `plugin-sdk/provider-env-vars` | Helper für die Suche nach Auth-Umgebungsvariablen von Providern |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, gemeinsame Builder für Replay-Richtlinien, Helper für Provider-Endpunkte und Helper zur Normalisierung von Modell-IDs wie `normalizeNativeXaiModelId` |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | Generische Helper für HTTP-/Endpunkt-Fähigkeiten von Providern, HTTP-Fehler von Providern und Multipart-Form-Helper für Audiotranskription |
    | `plugin-sdk/provider-web-fetch-contract` | Schmale Helper für Verträge zur Konfiguration/Auswahl von Web-Fetch wie `enablePluginInConfig` und `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | Helper für Registrierung/Cache von Web-Fetch-Providern |
    | `plugin-sdk/provider-web-search-config-contract` | Schmale Helper für Konfiguration/Credentials von Websuche für Provider, die keine Verdrahtung zum Aktivieren von Plugins benötigen |
    | `plugin-sdk/provider-web-search-contract` | Schmale Helper für Verträge zu Konfiguration/Credentials der Websuche wie `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` und scoped Setter/Getter für Credentials |
    | `plugin-sdk/provider-web-search` | Helper für Registrierung/Cache/Laufzeit von Websuche-Providern |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, Gemini-Schema-Bereinigung + Diagnostik sowie xAI-Kompatibilitäts-Helper wie `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
    | `plugin-sdk/provider-usage` | `fetchClaudeUsage` und ähnliche |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, Wrapper-Typen für Streams und gemeinsame Wrapper-Helper für Anthropic/Bedrock/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
    | `plugin-sdk/provider-transport-runtime` | Native Helper für Provider-Transport wie geschütztes Fetch, Transformationen von Transportnachrichten und beschreibbare Event-Streams des Transports |
    | `plugin-sdk/provider-onboard` | Helper für Konfigurations-Patches beim Onboarding |
    | `plugin-sdk/global-singleton` | Prozesslokale Helper für Singleton/Map/Cache |
    | `plugin-sdk/group-activation` | Schmale Helper für Modus der Gruppenaktivierung und Befehls-Parsing |
  </Accordion>

  <Accordion title="Subpfade für Authentifizierung und Sicherheit">
    | Subpfad | Wichtige Exporte |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, Helper für Command-Registry einschließlich Formatierung dynamischer Argumentmenüs, Helper für Absenderautorisierung |
    | `plugin-sdk/command-status` | Builder für Command-/Hilfenachrichten wie `buildCommandsMessagePaginated` und `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | Helper für Auflösung von Approvern und Action-Auth im selben Chat |
    | `plugin-sdk/approval-client-runtime` | Helper für Profile/Filter nativer Exec-Genehmigungen |
    | `plugin-sdk/approval-delivery-runtime` | Adapter für Fähigkeiten/Zustellung nativer Genehmigungen |
    | `plugin-sdk/approval-gateway-runtime` | Gemeinsamer Helper zur Auflösung des Genehmigungs-Gateway |
    | `plugin-sdk/approval-handler-adapter-runtime` | Leichtgewichtige Lade-Helper für Adapter nativer Genehmigungen an heißen Kanal-Entrypoints |
    | `plugin-sdk/approval-handler-runtime` | Breitere Laufzeit-Helper für Genehmigungs-Handler; bevorzugen Sie die schmaleren Adapter-/Gateway-Nähte, wenn diese ausreichen |
    | `plugin-sdk/approval-native-runtime` | Helper für native Genehmigungsziele + Kontobindungen |
    | `plugin-sdk/approval-reply-runtime` | Helper für Antwort-Payloads bei Exec-/Plugin-Genehmigungen |
    | `plugin-sdk/approval-runtime` | Helper für Payloads von Exec-/Plugin-Genehmigungen, Helper für natives Genehmigungsrouting/Laufzeit und strukturierte Helper für die Darstellung von Genehmigungen wie `formatApprovalDisplayPath` |
    | `plugin-sdk/reply-dedupe` | Schmale Helper zum Zurücksetzen der Deduplizierung eingehender Antworten |
    | `plugin-sdk/channel-contract-testing` | Schmale Test-Helper für Kanalverträge ohne die breite Testing-Barrel |
    | `plugin-sdk/command-auth-native` | Native Command-Auth, Formatierung dynamischer Argumentmenüs und native Helper für Sitzungsziele |
    | `plugin-sdk/command-detection` | Gemeinsame Helper zur Erkennung von Befehlen |
    | `plugin-sdk/command-primitives-runtime` | Leichtgewichtige Prädikate für Command-Text auf heißen Kanalpfaden |
    | `plugin-sdk/command-surface` | Helper für Normalisierung des Command-Body und Command-Surface |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | Schmale Helper für Sammlung von Secret-Verträgen für Secret-Oberflächen von Kanal/Plugin |
    | `plugin-sdk/secret-ref-runtime` | Schmale Helper für `coerceSecretRef` und SecretRef-Typisierung für Parsing von Secret-Verträgen/Konfiguration |
    | `plugin-sdk/security-runtime` | Gemeinsame Helper für Vertrauensmodell, DM-Gating, externe Inhalte und Secret-Sammlung |
    | `plugin-sdk/ssrf-policy` | Helper für Host-Allowlist und SSRF-Richtlinien für private Netzwerke |
    | `plugin-sdk/ssrf-dispatcher` | Schmale Helper für gepinnte Dispatcher ohne die breite Infra-Runtime-Oberfläche |
    | `plugin-sdk/ssrf-runtime` | Helper für gepinnte Dispatcher, SSRF-geschütztes Fetch und SSRF-Richtlinien |
    | `plugin-sdk/secret-input` | Helper für Parsing geheimer Eingaben |
    | `plugin-sdk/webhook-ingress` | Helper für Webhook-Anfragen/Ziele |
    | `plugin-sdk/webhook-request-guards` | Helper für Größe/Timeout von Request-Bodys |
  </Accordion>

  <Accordion title="Subpfade für Laufzeit und Speicherung">
    | Subpfad | Wichtige Exporte |
    | --- | --- |
    | `plugin-sdk/runtime` | Breite Helper für Laufzeit/Logging/Backup/Plugin-Installation |
    | `plugin-sdk/runtime-env` | Schmale Helper für Laufzeit-Umgebung, Logger, Timeout, Retry und Backoff |
    | `plugin-sdk/channel-runtime-context` | Generische Helper für Registrierung und Lookup von Laufzeitkontexten für Kanäle |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Gemeinsame Helper für Plugin-Befehle/Hooks/HTTP/interaktive Funktionen |
    | `plugin-sdk/hook-runtime` | Gemeinsame Helper für Webhook-/interne Hook-Pipelines |
    | `plugin-sdk/lazy-runtime` | Helper für lazy Import/Binding der Laufzeit wie `createLazyRuntimeModule`, `createLazyRuntimeMethod` und `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | Helper für Ausführung von Prozessen |
    | `plugin-sdk/cli-runtime` | Helper für CLI-Formatierung, Warten, Version, Aufruf von Argumenten und lazy Befehlsgruppen |
    | `plugin-sdk/gateway-runtime` | Helper für Gateway-Client und Patches für Kanalstatus |
    | `plugin-sdk/config-runtime` | Helper zum Laden/Schreiben von Konfiguration und Helper zum Lookup von Plugin-Konfiguration |
    | `plugin-sdk/telegram-command-config` | Normalisierung von Telegram-Befehlsnamen/-Beschreibungen und Prüfungen auf Duplikate/Konflikte, auch wenn die gebündelte Vertragsoberfläche für Telegram nicht verfügbar ist |
    | `plugin-sdk/text-autolink-runtime` | Erkennung von Dateireferenz-Autolinks ohne die breite `text-runtime`-Barrel |
    | `plugin-sdk/approval-runtime` | Helper für Exec-/Plugin-Genehmigungen, Builder für Genehmigungs-Fähigkeiten, Helper für Auth/Profile, natives Routing/Laufzeit und strukturierte Formatierung von Darstellungs-Pfaden für Genehmigungen |
    | `plugin-sdk/reply-runtime` | Gemeinsame Laufzeit-Helper für Inbound/Antworten, Chunking, Dispatch, Heartbeat, Reply-Planer |
    | `plugin-sdk/reply-dispatch-runtime` | Schmale Helper für Dispatch/Finalisierung von Antworten und Gesprächslabels |
    | `plugin-sdk/reply-history` | Gemeinsame Helper für Verlauf von Antworten in kurzen Fenstern wie `buildHistoryContext`, `recordPendingHistoryEntry` und `clearHistoryEntriesIfEnabled` |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | Schmale Helper für Text-/Markdown-Chunking |
    | `plugin-sdk/session-store-runtime` | Helper für Pfad des Sitzungsspeichers + `updated-at` |
    | `plugin-sdk/state-paths` | Pfad-Helper für Status-/OAuth-Verzeichnisse |
    | `plugin-sdk/routing` | Helper für Route/Sitzungsschlüssel/Kontobindung wie `resolveAgentRoute`, `buildAgentSessionKey` und `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | Gemeinsame Helper für Kanal-/Konto-Statuszusammenfassung, Standards für Runtime-Status und Metadaten zu Problemen |
    | `plugin-sdk/target-resolver-runtime` | Gemeinsame Helper für Ziel-Resolver |
    | `plugin-sdk/string-normalization-runtime` | Helper zur Normalisierung von Slugs/Strings |
    | `plugin-sdk/request-url` | String-URLs aus fetch-/request-artigen Eingaben extrahieren |
    | `plugin-sdk/run-command` | Zeitgesteuerter Command-Runner mit normalisierten Ergebnissen für stdout/stderr |
    | `plugin-sdk/param-readers` | Gemeinsame Reader für Tool-/CLI-Parameter |
    | `plugin-sdk/tool-payload` | Normalisierte Payloads aus Tool-Ergebnisobjekten extrahieren |
    | `plugin-sdk/tool-send` | Kanonische Ziel-Felder zum Senden aus Tool-Argumenten extrahieren |
    | `plugin-sdk/temp-path` | Gemeinsame Pfad-Helper für temporäre Downloads |
    | `plugin-sdk/logging-core` | Subsystem-Logger und Redaction-Helper |
    | `plugin-sdk/markdown-table-runtime` | Helper für Modus und Konvertierung von Markdown-Tabellen |
    | `plugin-sdk/json-store` | Kleine Helper zum Lesen/Schreiben von JSON-Status |
    | `plugin-sdk/file-lock` | Re-entrant File-Lock-Helper |
    | `plugin-sdk/persistent-dedupe` | Helper für festplattenbasierten Dedupe-Cache |
    | `plugin-sdk/acp-runtime` | Helper für ACP-Laufzeit/Sitzung und Reply-Dispatch |
    | `plugin-sdk/acp-binding-resolve-runtime` | Read-only-Auflösung von ACP-Bindings ohne Importe für den Start des Lebenszyklus |
    | `plugin-sdk/agent-config-primitives` | Schmale Primitive für das Konfigurationsschema der Agenten-Laufzeit |
    | `plugin-sdk/boolean-param` | Reader für lose Boolesche Parameter |
    | `plugin-sdk/dangerous-name-runtime` | Helper zur Auflösung gefährlicher Namens-Matches |
    | `plugin-sdk/device-bootstrap` | Helper für Geräte-Bootstrap und Pairing-Token |
    | `plugin-sdk/extension-shared` | Gemeinsame Primitive für passive Kanäle, Status und Ambient-Proxy-Helper |
    | `plugin-sdk/models-provider-runtime` | Helper für Antworten von `/models`-Befehlen/Providern |
    | `plugin-sdk/skill-commands-runtime` | Helper zum Auflisten von Skill-Befehlen |
    | `plugin-sdk/native-command-registry` | Helper für Registry/Build/Serialisierung nativer Befehle |
    | `plugin-sdk/agent-harness` | Experimentelle Oberfläche für vertrauenswürdige Plugins für Low-Level-Agenten-Harnesses: Harness-Typen, Helper zum Steuern/Abbrechen aktiver Läufe, Helper für die OpenClaw-Tool-Bridge, Helper für Fortschrittsformatierung/Details von Tools und Utilities für Versuchsergebnisse |
    | `plugin-sdk/provider-zai-endpoint` | Helper zur Erkennung von Z.AI-Endpunkten |
    | `plugin-sdk/infra-runtime` | Helper für Systemereignisse/Heartbeat |
    | `plugin-sdk/collection-runtime` | Kleine Helper für begrenzte Caches |
    | `plugin-sdk/diagnostic-runtime` | Helper für Diagnostik-Flags und -Ereignisse |
    | `plugin-sdk/error-runtime` | Fehlergraph, Formatierung, gemeinsame Helper zur Fehlerklassifikation, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | Gewrapptes Fetch sowie Proxy- und Lookup-Helper mit Pinning |
    | `plugin-sdk/runtime-fetch` | Dispatcher-bewusstes Runtime-Fetch ohne Importe für Proxy/guarded-fetch |
    | `plugin-sdk/response-limit-runtime` | Begrenzter Reader für Response-Bodys ohne die breite Medien-Laufzeitoberfläche |
    | `plugin-sdk/session-binding-runtime` | Aktueller Status von Gesprächs-Bindings ohne Routing für konfigurierte Bindungen oder Pairing-Stores |
    | `plugin-sdk/session-store-runtime` | Read-Helper für den Sitzungsspeicher ohne breite Importe für Konfigurationsschreibvorgänge/Wartung |
    | `plugin-sdk/context-visibility-runtime` | Auflösung der Kontextsichtbarkeit und Filterung ergänzender Kontexte ohne breite Importe für Konfiguration/Sicherheit |
    | `plugin-sdk/string-coerce-runtime` | Schmale Helper für primitive Record-/String-Koerzierung und -Normalisierung ohne Imports für Markdown/Logging |
    | `plugin-sdk/host-runtime` | Helper zur Normalisierung von Hostnamen und SCP-Hosts |
    | `plugin-sdk/retry-runtime` | Helper für Retry-Konfiguration und Retry-Runner |
    | `plugin-sdk/agent-runtime` | Helper für Agentenverzeichnis/Identity/Workspace |
    | `plugin-sdk/directory-runtime` | Konfigurationsgestützte Verzeichnisabfrage/Deduplizierung |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Subpfade für Fähigkeiten und Tests">
    | Subpfad | Wichtige Exporte |
    | --- | --- |
    | `plugin-sdk/media-runtime` | Gemeinsame Helper für Abrufen/Transformieren/Speichern von Medien sowie Builder für Medien-Payloads |
    | `plugin-sdk/media-store` | Schmale Medien-Store-Helper wie `saveMediaBuffer` |
    | `plugin-sdk/media-generation-runtime` | Gemeinsame Helper für Failover bei Mediengenerierung, Kandidatenauswahl und Meldungen bei fehlenden Modellen |
    | `plugin-sdk/media-understanding` | Provider-Typen für Media Understanding sowie providerseitige Exporte von Bild-/Audio-Helpern |
    | `plugin-sdk/text-runtime` | Gemeinsame Helper für Text/Markdown/Logging wie Entfernen von für Assistenten sichtbarem Text, Rendern/Chunking/Tabellen für Markdown, Redaction-Helper, Helper für Directive-Tags und Utilities für sicheren Text |
    | `plugin-sdk/text-chunking` | Chunking-Helper für ausgehenden Text |
    | `plugin-sdk/speech` | Typen für Speech-Provider sowie providerseitige Exporte für Direktiven, Registry, Validierung und Speech-Helper |
    | `plugin-sdk/speech-core` | Gemeinsame Typen für Speech-Provider, Registry, Direktiven, Normalisierung und Speech-Helper |
    | `plugin-sdk/realtime-transcription` | Typen für Provider der Echtzeit-Transkription, Registry-Helper und gemeinsamer WebSocket-Sitzungs-Helper |
    | `plugin-sdk/realtime-voice` | Typen für Realtime-Voice-Provider und Registry-Helper |
    | `plugin-sdk/image-generation` | Typen für Bildgenerierungs-Provider |
    | `plugin-sdk/image-generation-core` | Gemeinsame Typen für Bildgenerierung, Failover, Auth und Registry-Helper |
    | `plugin-sdk/music-generation` | Typen für Provider/Request/Result der Musikgenerierung |
    | `plugin-sdk/music-generation-core` | Gemeinsame Typen für Musikgenerierung, Failover-Helper, Provider-Lookup und Parsing von Modell-Referenzen |
    | `plugin-sdk/video-generation` | Typen für Provider/Request/Result der Videogenerierung |
    | `plugin-sdk/video-generation-core` | Gemeinsame Typen für Videogenerierung, Failover-Helper, Provider-Lookup und Parsing von Modell-Referenzen |
    | `plugin-sdk/webhook-targets` | Registry für Webhook-Ziele und Helper zur Routeninstallation |
    | `plugin-sdk/webhook-path` | Helper zur Normalisierung von Webhook-Pfaden |
    | `plugin-sdk/web-media` | Gemeinsame Helper zum Laden entfernter/lokaler Medien |
    | `plugin-sdk/zod` | Re-exportiertes `zod` für Konsumenten des Plugin-SDK |
    | `plugin-sdk/testing` | `installCommonResolveTargetErrorCases`, `shouldAckReaction` |
  </Accordion>

  <Accordion title="Memory-Subpfade">
    | Subpfad | Wichtige Exporte |
    | --- | --- |
    | `plugin-sdk/memory-core` | Gebündelte Helper-Oberfläche `memory-core` für Manager-/Konfigurations-/Datei-/CLI-Helper |
    | `plugin-sdk/memory-core-engine-runtime` | Laufzeit-Fassade für Index/Suche von Memory |
    | `plugin-sdk/memory-core-host-engine-foundation` | Exporte der Foundation-Engine des Memory-Host |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Verträge für Embeddings des Memory-Host, Registry-Zugriff, lokaler Provider und generische Helper für Batch/Remote |
    | `plugin-sdk/memory-core-host-engine-qmd` | Exporte der QMD-Engine des Memory-Host |
    | `plugin-sdk/memory-core-host-engine-storage` | Exporte der Storage-Engine des Memory-Host |
    | `plugin-sdk/memory-core-host-multimodal` | Multimodale Helper des Memory-Host |
    | `plugin-sdk/memory-core-host-query` | Query-Helper des Memory-Host |
    | `plugin-sdk/memory-core-host-secret` | Secret-Helper des Memory-Host |
    | `plugin-sdk/memory-core-host-events` | Event-Journal-Helper des Memory-Host |
    | `plugin-sdk/memory-core-host-status` | Status-Helper des Memory-Host |
    | `plugin-sdk/memory-core-host-runtime-cli` | CLI-Laufzeit-Helper des Memory-Host |
    | `plugin-sdk/memory-core-host-runtime-core` | Core-Laufzeit-Helper des Memory-Host |
    | `plugin-sdk/memory-core-host-runtime-files` | Datei-/Laufzeit-Helper des Memory-Host |
    | `plugin-sdk/memory-host-core` | Anbieterneutraler Alias für Core-Laufzeit-Helper des Memory-Host |
    | `plugin-sdk/memory-host-events` | Anbieterneutraler Alias für Event-Journal-Helper des Memory-Host |
    | `plugin-sdk/memory-host-files` | Anbieterneutraler Alias für Datei-/Laufzeit-Helper des Memory-Host |
    | `plugin-sdk/memory-host-markdown` | Gemeinsame Helper für verwaltetes Markdown für Plugins in der Nähe von Memory |
    | `plugin-sdk/memory-host-search` | Active-Memory-Laufzeit-Fassade für Zugriff auf Search Manager |
    | `plugin-sdk/memory-host-status` | Anbieterneutraler Alias für Status-Helper des Memory-Host |
    | `plugin-sdk/memory-lancedb` | Gebündelte Helper-Oberfläche `memory-lancedb` |
  </Accordion>

  <Accordion title="Reservierte Subpfade für gebündelte Helper">
    | Familie | Aktuelle Subpfade | Beabsichtigte Verwendung |
    | --- | --- | --- |
    | Browser | `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support` | Helper für Unterstützung gebündelter Browser-Plugins. `browser-profiles` exportiert `resolveBrowserConfig`, `resolveProfile`, `ResolvedBrowserConfig`, `ResolvedBrowserProfile` und `ResolvedBrowserTabCleanupConfig` für die normalisierte Form von `browser.tabCleanup`. `browser-support` bleibt die Kompatibilitäts-Barrel. |
    | Matrix | `plugin-sdk/matrix`, `plugin-sdk/matrix-helper`, `plugin-sdk/matrix-runtime-heavy`, `plugin-sdk/matrix-runtime-shared`, `plugin-sdk/matrix-runtime-surface`, `plugin-sdk/matrix-surface`, `plugin-sdk/matrix-thread-bindings` | Oberfläche für Helper/Laufzeit des gebündelten Matrix-Supports |
    | Line | `plugin-sdk/line`, `plugin-sdk/line-core`, `plugin-sdk/line-runtime`, `plugin-sdk/line-surface` | Oberfläche für Helper/Laufzeit des gebündelten LINE-Supports |
    | IRC | `plugin-sdk/irc`, `plugin-sdk/irc-surface` | Oberfläche für Helper des gebündelten IRC-Supports |
    | Kanalspezifische Helper | `plugin-sdk/googlechat`, `plugin-sdk/zalouser`, `plugin-sdk/bluebubbles`, `plugin-sdk/bluebubbles-policy`, `plugin-sdk/mattermost`, `plugin-sdk/mattermost-policy`, `plugin-sdk/feishu-conversation`, `plugin-sdk/msteams`, `plugin-sdk/nextcloud-talk`, `plugin-sdk/nostr`, `plugin-sdk/tlon`, `plugin-sdk/twitch` | Kompatibilitäts-/Helper-Nähte für gebündelte Kanäle |
    | Auth-/pluginspezifische Helper | `plugin-sdk/github-copilot-login`, `plugin-sdk/github-copilot-token`, `plugin-sdk/diagnostics-otel`, `plugin-sdk/diffs`, `plugin-sdk/llm-task`, `plugin-sdk/thread-ownership`, `plugin-sdk/voice-call` | Helper-Nähte für gebündelte Features/Plugins; `plugin-sdk/github-copilot-token` exportiert derzeit `DEFAULT_COPILOT_API_BASE_URL`, `deriveCopilotApiBaseUrlFromToken` und `resolveCopilotApiToken` |
  </Accordion>
</AccordionGroup>

## Verwandt

- [Plugin SDK overview](/de/plugins/sdk-overview)
- [Plugin SDK setup](/de/plugins/sdk-setup)
- [Building plugins](/de/plugins/building-plugins)
