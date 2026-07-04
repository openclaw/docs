---
read_when:
    - Den richtigen plugin-sdk-Unterpfad für einen Plugin-Import auswählen
    - Überprüfung von Unterpfaden gebündelter Plugins und Hilfsschnittstellen
summary: 'Plugin-SDK-Unterpfadkatalog: welche Importe wo liegen, nach Bereich gruppiert'
title: Plugin-SDK-Unterpfade
x-i18n:
    generated_at: "2026-07-04T10:36:59Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2a77f70197aca279d44d2b9db62bf9f936594311bb46c3da682413c3fa1378e5
    source_path: plugins/sdk-subpaths.md
    workflow: 16
---

Das Plugin-SDK wird als Satz schmaler öffentlicher Unterpfade unter
`openclaw/plugin-sdk/` bereitgestellt. Diese Seite katalogisiert die häufig
verwendeten Unterpfade, nach Zweck gruppiert. Das generierte Inventar der
Compiler-Einstiegspunkte liegt in `scripts/lib/plugin-sdk-entrypoints.json`;
Package-Exports sind die öffentliche Teilmenge nach Abzug der repo-lokalen
Test-/internen Unterpfade, die in
`scripts/lib/plugin-sdk-private-local-only-subpaths.json` aufgeführt sind.
Maintainer können die Anzahl öffentlicher Exporte mit `pnpm plugin-sdk:surface`
und aktive reservierte Hilfsunterpfade mit
`pnpm plugins:boundary-report:summary` prüfen; ungenutzte reservierte
Hilfsexporte lassen den CI-Bericht fehlschlagen, anstatt als ruhende
Kompatibilitätsschuld im öffentlichen SDK zu verbleiben.

Den Leitfaden zur Plugin-Erstellung finden Sie unter [Plugin-SDK-Übersicht](/de/plugins/sdk-overview).

## Plugin-Einstieg

| Unterpfad                      | Wichtige Exporte                                                                                                                                                       |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/plugin-entry`      | `definePluginEntry`                                                                                                                                                    |
| `plugin-sdk/core`              | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema`, `buildJsonChannelConfigSchema` |
| `plugin-sdk/config-schema`     | `OpenClawSchema`                                                                                                                                                       |
| `plugin-sdk/provider-entry`    | `defineSingleProviderPluginEntry`                                                                                                                                      |
| `plugin-sdk/migration`         | Hilfsfunktionen für Migration-Provider-Elemente wie `createMigrationItem`, Begründungskonstanten, Elementstatus-Markierungen, Redaktionshilfen und `summarizeMigrationItems` |
| `plugin-sdk/migration-runtime` | Runtime-Migrationshilfen wie `copyMigrationFileItem`, `resolvePlannedMigrationTargets`, `withCachedMigrationConfigRuntime` und `writeMigrationReport`                  |
| `plugin-sdk/health`            | Registrierung, Erkennung, Reparatur, Auswahl, Schweregrad und Finding-Typen für Doctor-Health-Checks für gebündelte Health-Consumer                                    |

### Veraltete Kompatibilitäts- und Testhilfen

Veraltete Unterpfade bleiben für ältere Plugins exportiert, neuer Code sollte
jedoch die fokussierten SDK-Unterpfade unten verwenden. Die gepflegte Liste ist
`scripts/lib/plugin-sdk-deprecated-public-subpaths.json`; CI weist gebündelte
Produktionsimporte daraus zurück. Breite Barrels wie `compat`, `config-types`,
`infra-runtime`, `text-runtime` und `zod` dienen nur der Kompatibilität.
Importieren Sie `zod` direkt aus `zod`.

Die Vitest-gestützten Testhilfen-Unterpfade von OpenClaw sind nur repo-lokal und
sind keine Package-Exports mehr: `agent-runtime-test-contracts`,
`channel-contract-testing`, `channel-target-testing`, `channel-test-helpers`,
`plugin-test-api`, `plugin-test-contracts`, `plugin-test-runtime`,
`provider-http-test-mocks`, `provider-test-contracts`, `test-env`,
`test-fixtures`, `test-node-mocks` und `testing`.

### Reservierte Hilfsunterpfade für gebündelte Plugins

Diese Unterpfade sind Plugin-eigene Kompatibilitätsoberflächen für ihr
besitzendes gebündeltes Plugin, keine allgemeinen SDK-APIs:
`plugin-sdk/codex-mcp-projection` und
`plugin-sdk/codex-native-task-runtime`. Owner-übergreifende Plugin-Importe
werden durch Leitplanken des Paketvertrags blockiert.

  <AccordionGroup>
  <Accordion title="Channel subpaths">
    | Unterpfad | Wichtige Exporte |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | Stamm-`openclaw.json`-Zod-Schemaexport (`OpenClawSchema`) |
    | `plugin-sdk/json-schema-runtime` | Zwischengespeicherte JSON Schema-Validierungshilfe für Plugin-eigene Schemas |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, plus `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | Gemeinsame Hilfsfunktionen für den Einrichtungsassistenten, Einrichtungsübersetzer, Allowlist-Eingabeaufforderungen, Builder für Einrichtungsstatus |
    | `plugin-sdk/setup-runtime` | `createSetupTranslator`, `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | Veralteter Kompatibilitätsalias; verwenden Sie `plugin-sdk/setup-runtime` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | Hilfsfunktionen für Mehrkonten-Konfiguration und Aktions-Gates, Fallback-Hilfsfunktionen für Standardkonten |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, Hilfsfunktionen zur Normalisierung von Konto-IDs |
    | `plugin-sdk/account-resolution` | Hilfsfunktionen für Kontosuche und Standard-Fallback |
    | `plugin-sdk/account-helpers` | Eng gefasste Hilfsfunktionen für Kontolisten und Kontoaktionen |
    | `plugin-sdk/access-groups` | Hilfsfunktionen zum Parsen von Zugriffgruppen-Allowlists und für redigierte Gruppendiagnosen |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | Veraltete Kompatibilitätsfassade. Verwenden Sie `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
    | `plugin-sdk/channel-config-schema` | Gemeinsame Primitive für Kanalkonfigurationsschemas sowie Zod- und direkte JSON/TypeBox-Builder |
    | `plugin-sdk/bundled-channel-config-schema` | Gebündelte OpenClaw-Kanalkonfigurationsschemas nur für gepflegte gebündelte Plugins |
    | `plugin-sdk/chat-channel-ids` | `BUNDLED_CHAT_CHANNEL_IDS`, `BUNDLED_CHAT_CHANNEL_ENVELOPE_PREFIXES`, `ChatChannelId`. Kanonische gebündelte/offizielle Chat-Kanal-IDs plus Formatierer-Labels/-Aliasse für Plugins, die Text mit Envelope-Präfix erkennen müssen, ohne eine eigene Tabelle hart zu codieren. |
    | `plugin-sdk/channel-config-schema-legacy` | Veralteter Kompatibilitätsalias für Konfigurationsschemas gebündelter Kanäle |
    | `plugin-sdk/telegram-command-config` | Hilfsfunktionen zur Normalisierung/Validierung benutzerdefinierter Telegram-Befehle mit Fallback für gebündelte Verträge |
    | `plugin-sdk/command-gating` | Eng gefasste Hilfsfunktionen für Befehlsautorisierungs-Gates |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-ingress` | Veraltete Low-Level-Kompatibilitätsfassade für Kanaleingang. Neue Empfangspfade sollten `plugin-sdk/channel-ingress-runtime` verwenden. |
    | `plugin-sdk/channel-ingress-runtime` | Experimenteller High-Level-Runtime-Resolver für Kanaleingang und Builder für Routenfakten für migrierte Kanalempfangspfade. Ziehen Sie dies dem Zusammensetzen effektiver Allowlists, Befehls-Allowlists und Legacy-Projektionen in jedem Plugin vor. Siehe [Kanaleingangs-API](/de/plugins/sdk-channel-ingress). |
    | `plugin-sdk/channel-lifecycle` | Veraltete Kompatibilitätsfassade. Verwenden Sie `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-outbound` | Verträge für den Nachrichtenlebenszyklus plus Optionen für die Antwortpipeline, Empfangsbestätigungen, Live-Vorschau/Streaming, Lebenszyklus-Hilfsfunktionen, ausgehende Identität, Payload-Planung, dauerhafte Sendevorgänge und Hilfsfunktionen für den Nachrichtensendekontext. Siehe [API für ausgehende Kanäle](/de/plugins/sdk-channel-outbound). |
    | `plugin-sdk/channel-message` | Veralteter Kompatibilitätsalias für `plugin-sdk/channel-outbound` plus Legacy-Fassaden für Antwort-Dispatch. |
    | `plugin-sdk/channel-message-runtime` | Veralteter Kompatibilitätsalias für `plugin-sdk/channel-outbound` plus Legacy-Fassaden für Antwort-Dispatch. |
    | `plugin-sdk/inbound-envelope` | Gemeinsame Hilfsfunktionen für eingehende Routen und Envelope-Builder |
    | `plugin-sdk/inbound-reply-dispatch` | Veraltete Kompatibilitätsfassade. Verwenden Sie `plugin-sdk/channel-inbound` für eingehende Runner und Dispatch-Prädikate und `plugin-sdk/channel-outbound` für Hilfsfunktionen zur Nachrichtenzustellung. |
    | `plugin-sdk/messaging-targets` | Veralteter Alias für Zielparsing; verwenden Sie `plugin-sdk/channel-targets` |
    | `plugin-sdk/outbound-media` | Gemeinsame Hilfsfunktionen zum Laden ausgehender Medien und für den Status gehosteter Medien |
    | `plugin-sdk/outbound-send-deps` | Veraltete Kompatibilitätsfassade. Verwenden Sie `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/outbound-runtime` | Veraltete Kompatibilitätsfassade. Verwenden Sie `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/poll-runtime` | Eng gefasste Hilfsfunktionen zur Umfragenormalisierung |
    | `plugin-sdk/thread-bindings-runtime` | Hilfsfunktionen für Lebenszyklus und Adapter der Thread-Bindung |
    | `plugin-sdk/agent-media-payload` | Legacy-Builder für Agent-Medien-Payloads |
    | `plugin-sdk/conversation-runtime` | Hilfsfunktionen für Konversations-/Thread-Bindung, Kopplung und konfigurierte Bindungen |
    | `plugin-sdk/runtime-config-snapshot` | Hilfsfunktion für Runtime-Konfigurations-Snapshots |
    | `plugin-sdk/runtime-group-policy` | Hilfsfunktionen zur Runtime-Auflösung von Gruppenrichtlinien |
    | `plugin-sdk/channel-status` | Gemeinsame Hilfsfunktionen für Kanalstatus-Snapshots/-Zusammenfassungen |
    | `plugin-sdk/channel-config-primitives` | Eng gefasste Primitive für Kanalkonfigurationsschemas |
    | `plugin-sdk/channel-config-writes` | Hilfsfunktionen zur Autorisierung von Kanalkonfigurations-Schreibvorgängen |
    | `plugin-sdk/channel-plugin-common` | Gemeinsame Prelude-Exporte für Kanal-Plugins |
    | `plugin-sdk/allowlist-config-edit` | Hilfsfunktionen zum Bearbeiten/Lesen von Allowlist-Konfigurationen |
    | `plugin-sdk/group-access` | Gemeinsame Hilfsfunktionen für Gruppen-Zugriffsentscheidungen |
    | `plugin-sdk/direct-dm`, `plugin-sdk/direct-dm-access` | Veraltete Kompatibilitätsfassaden. Verwenden Sie `plugin-sdk/channel-inbound`. |
    | `plugin-sdk/direct-dm-guard-policy` | Eng gefasste Hilfsfunktionen für Schutzrichtlinien vor Krypto bei Direktnachrichten |
    | `plugin-sdk/discord` | Veraltete Discord-Kompatibilitätsfassade für veröffentlichte `@openclaw/discord@2026.3.13` und nachverfolgte Eigentümerkompatibilität; neue Plugins sollten generische Unterpfade des Kanal-SDK verwenden |
    | `plugin-sdk/telegram-account` | Veraltete Telegram-Kompatibilitätsfassade zur Kontoauflösung für nachverfolgte Eigentümerkompatibilität; neue Plugins sollten injizierte Runtime-Hilfsfunktionen oder generische Unterpfade des Kanal-SDK verwenden |
    | `plugin-sdk/zalouser` | Veraltete Zalo Personal-Kompatibilitätsfassade für veröffentlichte Lark/Zalo-Pakete, die weiterhin Befehlsautorisierung für Absender importieren; neue Plugins sollten `plugin-sdk/command-auth` verwenden |
    | `plugin-sdk/interactive-runtime` | Semantische Nachrichtendarstellung, Zustellung und Legacy-Hilfsfunktionen für interaktive Antworten. Siehe [Nachrichtendarstellung](/de/plugins/message-presentation) |
    | `plugin-sdk/channel-inbound` | Gemeinsame Hilfsfunktionen für eingehende Nachrichten zur Ereignisklassifizierung, Kontextbildung, Formatierung, Roots, Entprellung, Erwähnungsabgleich, Erwähnungsrichtlinie und Eingangsprotokollierung |
    | `plugin-sdk/channel-inbound-debounce` | Eng gefasste Hilfsfunktionen zur Entprellung eingehender Nachrichten |
    | `plugin-sdk/channel-mention-gating` | Eng gefasste Hilfsfunktionen für Erwähnungsrichtlinien, Erwähnungsmarker und Erwähnungstext ohne die breitere Runtime-Oberfläche für eingehende Nachrichten |
    | `plugin-sdk/channel-envelope`, `plugin-sdk/channel-inbound-roots`, `plugin-sdk/channel-location`, `plugin-sdk/channel-logging` | Veraltete Kompatibilitätsfassaden. Verwenden Sie `plugin-sdk/channel-inbound` oder `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-pairing-paths` | Veraltete Kompatibilitätsfassade. Verwenden Sie `plugin-sdk/channel-pairing`. |
    | `plugin-sdk/channel-reply-options-runtime` | Veraltete Kompatibilitätsfassade. Verwenden Sie `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-streaming` | Veraltete Kompatibilitätsfassade. Verwenden Sie `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-send-result` | Antwort-Ergebnistypen |
    | `plugin-sdk/channel-actions` | Hilfsfunktionen für Kanal-Nachrichtenaktionen plus veraltete native Schema-Hilfsfunktionen, die für Plugin-Kompatibilität beibehalten werden |
    | `plugin-sdk/channel-route` | Gemeinsame Hilfsfunktionen für Routennormalisierung, parsergesteuerte Zielauflösung, Stringifizierung von Thread-IDs, Deduplizierungs-/kompakte Routenschlüssel, geparste Zieltypen und Routen-/Zielvergleich |
    | `plugin-sdk/channel-targets` | Hilfsfunktionen für Zielparsing; Aufrufer für Routenvergleiche sollten `plugin-sdk/channel-route` verwenden |
    | `plugin-sdk/channel-contract` | Kanalvertragstypen |
    | `plugin-sdk/channel-feedback` | Feedback-/Reaktionsverdrahtung |
    | `plugin-sdk/channel-secret-runtime` | Eng gefasste Hilfsfunktionen für Secret-Verträge wie `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment` und Secret-Zieltypen |
  </Accordion>

Veraltete Channel-Helper-Familien bleiben nur für die Kompatibilität mit veröffentlichten Plugins verfügbar. Der Entfernungsplan lautet: Sie bleiben während des externen Plugin-Migrationsfensters erhalten, Repo-/gebündelte Plugins bleiben auf `channel-inbound` und `channel-outbound`, anschließend werden die Kompatibilitäts-Subpfade bei der nächsten größeren SDK-Bereinigung entfernt. Dies gilt für die alten Channel-Message-/Runtime-, Channel-Streaming-, Direct-DM-Zugriffs-, Inbound-Helper-Splinter-, Reply-Options- und Pairing-Path-Familien.

  <Accordion title="Provider-Unterpfade">
    | Unterpfad | Wichtige Exporte |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/lmstudio` | Unterstützte LM Studio-Provider-Fassade für Einrichtung, Katalogerkennung und Laufzeit-Modellvorbereitung |
    | `plugin-sdk/lmstudio-runtime` | Unterstützte LM Studio-Laufzeit-Fassade für lokale Server-Standardwerte, Modellerkennung, Request-Header und Hilfsfunktionen für geladene Modelle |
    | `plugin-sdk/provider-setup` | Kuratierte lokale/selbst gehostete Provider-Einrichtungshelfer |
    | `plugin-sdk/self-hosted-provider-setup` | Fokussierte OpenAI-kompatible Einrichtungshelfer für selbst gehostete Provider |
    | `plugin-sdk/cli-backend` | CLI-Backend-Standardwerte + Watchdog-Konstanten |
    | `plugin-sdk/provider-auth-runtime` | Laufzeit-Hilfsfunktionen zur Auflösung von API-Keys für Provider-Plugins |
    | `plugin-sdk/provider-oauth-runtime` | Generische OAuth-Callback-Typen für Provider, Rendering von Callback-Seiten, PKCE-/State-Hilfsfunktionen, Parsing von Autorisierungseingaben, Hilfsfunktionen für Token-Ablauf und Abbruch-Hilfsfunktionen |
    | `plugin-sdk/provider-auth-api-key` | Hilfsfunktionen für API-Key-Onboarding und Profilschreiben wie `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | Standard-Builder für OAuth-Authentifizierungsergebnisse |
    | `plugin-sdk/provider-env-vars` | Hilfsfunktionen für die Suche nach Provider-Authentifizierungs-Umgebungsvariablen |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials`, OpenAI Codex-Hilfsfunktionen für Authentifizierungsimporte, veralteter Kompatibilitätsexport `resolveOpenClawAgentDir` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, gemeinsame Builder für Replay-Richtlinien, Provider-Endpunkt-Hilfsfunktionen und gemeinsame Hilfsfunktionen zur Normalisierung von Modell-IDs |
    | `plugin-sdk/provider-catalog-live-runtime` | Live-Hilfsfunktionen für Provider-Modellkataloge für geschützte Erkennung im Stil von `/models`: `buildLiveModelProviderConfig`, `fetchLiveProviderModelRows`, `getCachedLiveProviderModelRows`, `fetchLiveProviderModelIds`, `LiveModelCatalogHttpError`, `clearLiveCatalogCacheForTests`, Modell-ID-Filterung, TTL-Cache und statischer Fallback |
    | `plugin-sdk/provider-catalog-runtime` | Laufzeit-Hook für Provider-Katalogerweiterung und Plugin-Provider-Registry-Seams für Vertragstests |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | Generische Provider-HTTP-/Endpunkt-Capability-Hilfsfunktionen, Provider-HTTP-Fehler und Multipart-Form-Hilfsfunktionen für Audiotranskription |
    | `plugin-sdk/provider-web-fetch-contract` | Schmale Hilfsfunktionen für Web-Fetch-Konfiguration/-Auswahlverträge wie `enablePluginInConfig` und `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | Hilfsfunktionen für Registrierung/Cache von Web-Fetch-Providern |
    | `plugin-sdk/provider-web-search-config-contract` | Schmale Hilfsfunktionen für Web-Search-Konfiguration/Anmeldedaten für Provider, die keine Plugin-Aktivierungsverdrahtung benötigen |
    | `plugin-sdk/provider-web-search-contract` | Schmale Hilfsfunktionen für Web-Search-Konfiguration/Anmeldedaten-Verträge wie `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` sowie bereichsbezogene Setter/Getter für Anmeldedaten |
    | `plugin-sdk/provider-web-search` | Hilfsfunktionen für Registrierung/Cache/Laufzeit von Web-Search-Providern |
    | `plugin-sdk/embedding-providers` | Allgemeine Embedding-Provider-Typen und Lese-Hilfsfunktionen, einschließlich `EmbeddingProviderAdapter`, `getEmbeddingProvider(...)` und `listEmbeddingProviders(...)`; Plugins registrieren Provider über `api.registerEmbeddingProvider(...)`, damit Manifest-Ownership erzwungen wird |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks` und DeepSeek-/Gemini-/OpenAI-Schema-Bereinigung + Diagnostik |
    | `plugin-sdk/provider-usage` | Snapshot-Typen für Provider-Nutzung, gemeinsame Hilfsfunktionen zum Abrufen der Nutzung und Provider-Fetcher wie `fetchClaudeUsage` |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, Stream-Wrapper-Typen, Plain-Text-Kompatibilität für Tool-Aufrufe und gemeinsame Wrapper-Hilfsfunktionen für Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
    | `plugin-sdk/provider-stream-shared` | Öffentliche gemeinsame Hilfsfunktionen für Provider-Stream-Wrapper, einschließlich `composeProviderStreamWrappers`, `createOpenAICompatibleCompletionsThinkingOffWrapper`, `createPlainTextToolCallCompatWrapper`, `createPayloadPatchStreamWrapper`, `createToolStreamWrapper`, `normalizeOpenAICompatibleReasoningPayload`, `setQwenChatTemplateThinking` und Anthropic-/DeepSeek-/OpenAI-kompatible Stream-Dienstprogramme |
    | `plugin-sdk/provider-transport-runtime` | Native Provider-Transport-Hilfsfunktionen wie geschützter Fetch, Textextraktion aus Tool-Ergebnissen, Transport-Nachrichtentransformationen und beschreibbare Transport-Event-Streams |
    | `plugin-sdk/provider-onboard` | Hilfsfunktionen für Onboarding-Konfigurationspatches |
    | `plugin-sdk/global-singleton` | Prozesslokale Singleton-/Map-/Cache-Hilfsfunktionen |
    | `plugin-sdk/group-activation` | Schmale Hilfsfunktionen für Gruppenaktivierungsmodus und Befehlsparsing |
  </Accordion>

Provider-Nutzungssnapshots melden normalerweise ein oder mehrere Quota-`windows`,
jeweils mit Label, genutztem Prozentwert und optionaler Zurücksetzungszeit.
Provider, die Balance- oder Kontostandstext statt zurücksetzbarer Quota-Fenster
bereitstellen, sollten `summary` mit einem leeren `windows`-Array zurückgeben,
statt Prozentsätze zu erfinden. OpenClaw zeigt diesen Zusammenfassungstext in der
Statusausgabe an; verwenden Sie `error` nur, wenn der Nutzungs-Endpunkt
fehlgeschlagen ist oder keine verwertbaren Nutzungsdaten zurückgegeben hat.

  <Accordion title="Authentifizierungs- und Sicherheitsunterpfade">
    | Unterpfad | Wichtige Exporte |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, Hilfsfunktionen für Befehls-Registry einschließlich dynamischer Formatierung von Argumentmenüs, Hilfsfunktionen für Senderautorisierung |
    | `plugin-sdk/command-status` | Builder für Befehls-/Hilfemeldungen wie `buildCommandsMessagePaginated` und `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | Hilfsfunktionen für Approver-Auflösung und Action-Authentifizierung im selben Chat |
    | `plugin-sdk/approval-client-runtime` | Hilfsfunktionen für native Exec-Genehmigungsprofile/-filter |
    | `plugin-sdk/approval-delivery-runtime` | Native Adapter für Genehmigungs-Capability/-Zustellung |
    | `plugin-sdk/approval-gateway-runtime` | Gemeinsame Hilfsfunktion zur Genehmigungs-Gateway-Auflösung |
    | `plugin-sdk/approval-handler-adapter-runtime` | Leichtgewichtige Hilfsfunktionen zum Laden nativer Genehmigungsadapter für Hot-Channel-Einstiegspunkte |
    | `plugin-sdk/approval-handler-runtime` | Breitere Laufzeit-Hilfsfunktionen für Genehmigungs-Handler; bevorzugen Sie die schmaleren Adapter-/Gateway-Seams, wenn sie ausreichen |
    | `plugin-sdk/approval-native-runtime` | Hilfsfunktionen für native Genehmigungsziele, Kontobindung, Routen-Gates, Weiterleitungs-Fallback und Unterdrückung lokaler nativer Exec-Prompts |
    | `plugin-sdk/approval-reaction-runtime` | Hartcodierte Genehmigungsreaktions-Bindings, Reaktions-Prompt-Payloads, Reaktionsziel-Stores, Hilfsfunktionen für Reaktionshinweistexte und Kompatibilitätsexport für die Unterdrückung lokaler nativer Exec-Prompts |
    | `plugin-sdk/approval-reply-runtime` | Hilfsfunktionen für Exec-/Plugin-Genehmigungsantwort-Payloads |
    | `plugin-sdk/approval-runtime` | Hilfsfunktionen für Exec-/Plugin-Genehmigungs-Payloads, Routing-/Laufzeit-Hilfsfunktionen für native Genehmigungen und Hilfsfunktionen für strukturierte Genehmigungsanzeigen wie `formatApprovalDisplayPath` |
    | `plugin-sdk/reply-dedupe` | Schmale Reset-Hilfsfunktionen für Deduplizierung eingehender Antworten |
    | `plugin-sdk/channel-contract-testing` | Schmale Hilfsfunktionen für Channel-Vertragstests ohne das breite Testing-Barrel |
    | `plugin-sdk/command-auth-native` | Native Befehlsauthentifizierung, dynamische Formatierung von Argumentmenüs und native Hilfsfunktionen für Sitzungsziele |
    | `plugin-sdk/command-detection` | Gemeinsame Hilfsfunktionen für Befehlserkennung |
    | `plugin-sdk/command-primitives-runtime` | Leichtgewichtige Befehls-Textprädikate für Hot-Channel-Pfade |
    | `plugin-sdk/command-surface` | Hilfsfunktionen für Befehlsrumpf-Normalisierung und Befehlsoberflächen |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/provider-auth-login-flow-runtime` | Lazy-Hilfsfunktionen für Provider-Authentifizierungs-Login-Flows für private Channels und Web-UI-Device-Code-Pairing |
    | `plugin-sdk/channel-secret-runtime` | Schmale Hilfsfunktionen zur Sammlung von Secret-Verträgen für Channel-/Plugin-Secret-Oberflächen |
    | `plugin-sdk/secret-ref-runtime` | Schmale `coerceSecretRef`- und SecretRef-Typisierungs-Hilfsfunktionen für Secret-Vertrags-/Konfigurationsparsing |
    | `plugin-sdk/secret-provider-integration` | Nur-Typ-Manifest für SecretRef-Provider-Integration und Preset-Verträge für Plugins, die externe Secret-Provider-Presets veröffentlichen |
    | `plugin-sdk/security-runtime` | Gemeinsame Hilfsfunktionen für Vertrauen, DM-Gating, root-begrenzte Datei-/Pfadzugriffe einschließlich Create-only-Schreibvorgängen, synchronem/asynchronem atomarem Dateiersatz, Geschwister-Temp-Schreibvorgängen, Cross-Device-Move-Fallback, privaten File-Store-Hilfsfunktionen, Symlink-Parent-Guards, externen Inhalten, Schwärzung sensibler Texte, Secret-Vergleich in konstanter Zeit und Secret-Sammlung |
    | `plugin-sdk/ssrf-policy` | Hilfsfunktionen für Host-Allowlist und Private-Network-SSRF-Richtlinien |
    | `plugin-sdk/ssrf-dispatcher` | Schmale Hilfsfunktionen für gepinnte Dispatcher ohne die breite Infrastruktur-Laufzeitoberfläche |
    | `plugin-sdk/ssrf-runtime` | Gepinnter Dispatcher, SSRF-geschützter Fetch, SSRF-Fehler und SSRF-Richtlinien-Hilfsfunktionen |
    | `plugin-sdk/secret-input` | Hilfsfunktionen für Secret-Eingabeparsing |
    | `plugin-sdk/webhook-ingress` | Webhook-Request-/Ziel-Hilfsfunktionen und rohe WebSocket-/Body-Koerzierung |
    | `plugin-sdk/webhook-request-guards` | Hilfsfunktionen für Request-Body-Größe/Timeout |
  </Accordion>

  <Accordion title="Runtime and storage subpaths">
    | Unterpfad | Wichtige Exporte |
    | --- | --- |
    | `plugin-sdk/runtime` | Breite Hilfsfunktionen für Runtime, Protokollierung, Sicherung und Plugin-Installation |
    | `plugin-sdk/runtime-env` | Schlanke Hilfsfunktionen für Runtime-Umgebung, Logger, Timeout, Wiederholung und Backoff |
    | `plugin-sdk/browser-config` | Unterstützte Browser-Konfigurationsfassade für normalisierte Profile/Standards, CDP-URL-Parsing und Hilfsfunktionen für Browser-Control-Authentifizierung |
    | `plugin-sdk/agent-harness-task-runtime` | Generische Hilfsfunktionen für Aufgabenlebenszyklus und Abschlusszustellung für harness-gestützte Agents mit einem vom Host ausgegebenen Aufgaben-Scope |
    | `plugin-sdk/codex-mcp-projection` | Reservierte gebündelte Codex-Hilfsfunktion zum Projizieren der Benutzer-MCP-Serverkonfiguration in die Codex-Thread-Konfiguration; nicht für Drittanbieter-Plugins |
    | `plugin-sdk/codex-native-task-runtime` | Private gebündelte Codex-Hilfsfunktion für native Aufgaben-Spiegelung/Runtime-Verkabelung; nicht für Drittanbieter-Plugins |
    | `plugin-sdk/channel-runtime-context` | Generische Hilfsfunktionen für Registrierung und Lookup des Channel-Runtime-Kontexts |
    | `plugin-sdk/matrix` | Veraltete Matrix-Kompatibilitätsfassade für ältere Drittanbieter-Channel-Pakete; neue Plugins sollten `plugin-sdk/run-command` direkt importieren |
    | `plugin-sdk/mattermost` | Veraltete Mattermost-Kompatibilitätsfassade für ältere Drittanbieter-Channel-Pakete; neue Plugins sollten generische SDK-Unterpfade direkt importieren |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Gemeinsame Hilfsfunktionen für Plugin-Befehle, Hooks, HTTP und interaktive Abläufe |
    | `plugin-sdk/hook-runtime` | Gemeinsame Hilfsfunktionen für Webhook-/interne Hook-Pipelines |
    | `plugin-sdk/lazy-runtime` | Hilfsfunktionen für Lazy-Runtime-Import/-Binding wie `createLazyRuntimeModule`, `createLazyRuntimeMethod` und `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | Hilfsfunktionen für Prozessausführung |
    | `plugin-sdk/cli-runtime` | Hilfsfunktionen für CLI-Formatierung, Warten, Version, Argumentaufruf und Lazy-Befehlsgruppen |
    | `plugin-sdk/qa-live-transport-scenarios` | Gemeinsame Live-Transport-QA-Szenario-IDs, Hilfsfunktionen für Baseline-Abdeckung und Szenarioauswahl |
    | `plugin-sdk/gateway-method-runtime` | Reservierte Gateway-Hilfsfunktion für Methodendispatch bei Plugin-HTTP-Routen, die `contracts.gatewayMethodDispatch: ["authenticated-request"]` deklarieren |
    | `plugin-sdk/gateway-runtime` | Gateway-Client, Hilfsfunktion zum Starten eines event-loop-bereiten Clients, Gateway-CLI-RPC, Gateway-Protokollfehler, Auflösung des angekündigten LAN-Hosts und Hilfsfunktionen für Channel-Status-Patches |
    | `plugin-sdk/config-contracts` | Fokussierte reine Typ-Konfigurationsoberfläche für Plugin-Konfigurationsformen wie `OpenClawConfig` und Channel-/Provider-Konfigurationstypen |
    | `plugin-sdk/plugin-config-runtime` | Hilfsfunktionen für Runtime-Plugin-Konfigurations-Lookups wie `requireRuntimeConfig`, `resolvePluginConfigObject` und `resolveLivePluginConfigObject` |
    | `plugin-sdk/config-mutation` | Hilfsfunktionen für transaktionale Konfigurationsmutationen wie `mutateConfigFile`, `replaceConfigFile` und `logConfigUpdated` |
    | `plugin-sdk/message-tool-delivery-hints` | Gemeinsame Hinweisstrings für Zustellungsmetadaten von Nachrichtentools |
    | `plugin-sdk/runtime-config-snapshot` | Hilfsfunktionen für aktuelle Prozess-Konfigurations-Snapshots wie `getRuntimeConfig`, `getRuntimeConfigSnapshot` und Test-Snapshot-Setter |
    | `plugin-sdk/telegram-command-config` | Normalisierung von Telegram-Befehlsnamen/-beschreibungen und Prüfungen auf Duplikate/Konflikte, auch wenn die gebündelte Telegram-Vertragsoberfläche nicht verfügbar ist |
    | `plugin-sdk/text-autolink-runtime` | Autolink-Erkennung für Dateireferenzen ohne das breite Text-Barrel |
    | `plugin-sdk/approval-reaction-runtime` | Fest codierte Approval-Reaktionsbindungen, Reaktionsprompt-Payloads, Reaktionsziel-Speicher, Hilfsfunktionen für Reaktionshinweistexte und Kompatibilitätsexport für die Unterdrückung lokaler nativer Exec-Prompts |
    | `plugin-sdk/approval-runtime` | Hilfsfunktionen für Exec-/Plugin-Approval, Builder für Approval-Fähigkeiten, Auth-/Profilhilfen, native Routing-/Runtime-Hilfsfunktionen und Formatierung strukturierter Approval-Anzeigepfade |
    | `plugin-sdk/reply-runtime` | Gemeinsame Runtime-Hilfsfunktionen für eingehende Nachrichten/Antworten, Chunking, Dispatch, Heartbeat, Antwortplaner |
    | `plugin-sdk/reply-dispatch-runtime` | Schlanke Hilfsfunktionen für Antwortdispatch/-Finalisierung und Konversationslabels |
    | `plugin-sdk/reply-history` | Gemeinsame Hilfsfunktionen für Antwortverlauf in kurzen Zeitfenstern. Neuer Nachrichtenturn-Code sollte `createChannelHistoryWindow` verwenden; Low-Level-Map-Hilfsfunktionen bleiben nur veraltete Kompatibilitätsexporte |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | Schlanke Hilfsfunktionen für Text-/Markdown-Chunking |
    | `plugin-sdk/session-store-runtime` | Hilfsfunktionen für Session-Workflows (`getSessionEntry`, `listSessionEntries`, `patchSessionEntry`, `upsertSessionEntry`), begrenzte Lesezugriffe auf aktuelle Benutzer-/Assistant-Transkripttexte nach Session-Identität, Hilfsfunktionen für Legacy-Session-Speicherpfade/-Session-Schlüssel, updated-at-Lesezugriffe und nur für Übergänge gedachte Kompatibilitätsfunktionen für Whole-Store/Dateipfade |
    | `plugin-sdk/session-transcript-runtime` | Transkriptidentität, bereichsbezogene Ziel-/Lese-/Schreibhilfen, Update-Veröffentlichung, Schreibsperren und Treffer-Schlüssel für Transkript-Memory |
    | `plugin-sdk/sqlite-runtime` | Fokussierte SQLite-Hilfsfunktionen für Agent-Schema, Pfade und Transaktionen für First-Party-Runtime |
    | `plugin-sdk/cron-store-runtime` | Hilfsfunktionen für Cron-Speicherpfad, Laden und Speichern |
    | `plugin-sdk/state-paths` | Hilfsfunktionen für State-/OAuth-Verzeichnispfade |
    | `plugin-sdk/plugin-state-runtime` | SQLite-Keyed-State-Typen für Plugin-Sidecars plus zentralisierte Einrichtung von Verbindungs-Pragmas und WAL-Wartung für Plugin-eigene Datenbanken |
    | `plugin-sdk/routing` | Hilfsfunktionen für Routen-/Session-Schlüssel-/Account-Bindings wie `resolveAgentRoute`, `buildAgentSessionKey` und `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | Gemeinsame Hilfsfunktionen für Channel-/Account-Statuszusammenfassungen, Runtime-State-Standards und Issue-Metadaten |
    | `plugin-sdk/target-resolver-runtime` | Gemeinsame Hilfsfunktionen für Zielauflösung |
    | `plugin-sdk/string-normalization-runtime` | Hilfsfunktionen für Slug-/String-Normalisierung |
    | `plugin-sdk/request-url` | String-URLs aus fetch-/request-ähnlichen Eingaben extrahieren |
    | `plugin-sdk/run-command` | Zeitgesteuerter Befehlsrunner mit normalisierten stdout-/stderr-Ergebnissen |
    | `plugin-sdk/param-readers` | Gemeinsame Leser für Tool-/CLI-Parameter |
    | `plugin-sdk/tool-plugin` | Ein einfaches typisiertes Agent-Tool-Plugin definieren und statische Metadaten für die Manifestgenerierung bereitstellen |
    | `plugin-sdk/tool-payload` | Normalisierte Payloads aus Tool-Ergebnisobjekten extrahieren |
    | `plugin-sdk/tool-send` | Kanonische Sendeziel-Felder aus Tool-Argumenten extrahieren |
    | `plugin-sdk/sandbox` | Sandbox-Backend-Typen und SSH-/OpenShell-Befehlshilfen, einschließlich fail-fast Exec-Befehls-Preflight |
    | `plugin-sdk/temp-path` | Gemeinsame Hilfsfunktionen für temporäre Downloadpfade und private sichere temporäre Arbeitsbereiche |
    | `plugin-sdk/logging-core` | Subsystem-Logger und Redaktionshilfen |
    | `plugin-sdk/markdown-table-runtime` | Hilfsfunktionen für Markdown-Tabellenmodus und Konvertierung |
    | `plugin-sdk/model-session-runtime` | Hilfsfunktionen für Modell-/Session-Overrides wie `applyModelOverrideToSessionEntry` und `resolveAgentMaxConcurrent` |
    | `plugin-sdk/talk-config-runtime` | Hilfsfunktionen zur Auflösung der Talk-Provider-Konfiguration |
    | `plugin-sdk/json-store` | Kleine Hilfsfunktionen zum Lesen/Schreiben von JSON-State |
    | `plugin-sdk/json-unsafe-integers` | JSON-Parsing-Hilfsfunktionen, die unsichere Integer-Literale als Strings erhalten |
    | `plugin-sdk/file-lock` | Re-entrant-Dateisperren-Hilfsfunktionen |
    | `plugin-sdk/persistent-dedupe` | Datenträgergestützte Dedupe-Cache-Hilfsfunktionen |
    | `plugin-sdk/acp-runtime` | Hilfsfunktionen für ACP-Runtime/-Session und Antwortdispatch |
    | `plugin-sdk/acp-runtime-backend` | Leichtgewichtige Hilfsfunktionen für ACP-Backend-Registrierung und Antwortdispatch für beim Start geladene Plugins |
    | `plugin-sdk/acp-binding-resolve-runtime` | Schreibgeschützte ACP-Binding-Auflösung ohne Lifecycle-Startimporte |
    | `plugin-sdk/agent-config-primitives` | Schlanke Primitive für Agent-Runtime-Konfigurationsschema |
    | `plugin-sdk/boolean-param` | Leser für lockere boolesche Parameter |
    | `plugin-sdk/dangerous-name-runtime` | Hilfsfunktionen zur Auflösung von Dangerous-Name-Matching |
    | `plugin-sdk/device-bootstrap` | Hilfsfunktionen für Geräte-Bootstrap und Pairing-Token |
    | `plugin-sdk/extension-shared` | Gemeinsame Primitive für passive Channels, Status und Ambient-Proxy-Hilfen |
    | `plugin-sdk/models-provider-runtime` | Hilfsfunktionen für `/models`-Befehls-/Provider-Antworten |
    | `plugin-sdk/skill-commands-runtime` | Hilfsfunktionen zum Auflisten von Skill-Befehlen |
    | `plugin-sdk/native-command-registry` | Hilfsfunktionen für Registrierung, Build und Serialisierung nativer Befehle |
    | `plugin-sdk/agent-harness` | Experimentelle Oberfläche für vertrauenswürdige Plugins bei Low-Level-Agent-Harnesses: Harness-Typen, Hilfsfunktionen zum Steuern/Abbrechen aktiver Runs, OpenClaw-Tool-Bridge-Hilfsfunktionen, Hilfsfunktionen für Runtime-Plan-Tool-Policies, Klassifizierung von Terminalergebnissen, Formatierungs-/Detailhilfen für Tool-Fortschritt und Hilfsprogramme für Versuchsergebnisse |
    | `plugin-sdk/provider-zai-endpoint` | Veraltete Provider-eigene Z.AI-Fassade zur Endpoint-Erkennung; verwenden Sie die öffentliche API des Z.AI-Plugins |
    | `plugin-sdk/async-lock-runtime` | Prozesslokale Async-Lock-Hilfsfunktion für kleine Runtime-State-Dateien |
    | `plugin-sdk/channel-activity-runtime` | Hilfsfunktion für Channel-Aktivitätstelemetrie |
    | `plugin-sdk/concurrency-runtime` | Hilfsfunktion für begrenzte Nebenläufigkeit asynchroner Aufgaben |
    | `plugin-sdk/dedupe-runtime` | In-Memory- und persistenzgestützte Dedupe-Cache-Hilfsfunktionen |
    | `plugin-sdk/delivery-queue-runtime` | Hilfsfunktion zum Leeren ausstehender ausgehender Zustellungen |
    | `plugin-sdk/file-access-runtime` | Hilfsfunktionen für sichere lokale Datei- und Medienquellenpfade |
    | `plugin-sdk/heartbeat-runtime` | Hilfsfunktionen für Heartbeat-Wake, -Ereignisse und -Sichtbarkeit |
    | `plugin-sdk/number-runtime` | Hilfsfunktion für numerische Koerzierung |
    | `plugin-sdk/secure-random-runtime` | Hilfsfunktionen für sichere Token/UUIDs |
    | `plugin-sdk/system-event-runtime` | Hilfsfunktionen für Systemereigniswarteschlangen |
    | `plugin-sdk/transport-ready-runtime` | Hilfsfunktion zum Warten auf Transportbereitschaft |
    | `plugin-sdk/exec-approvals-runtime` | Hilfsfunktionen für Exec-Approval-Policy-Dateien ohne das breite Infra-Runtime-Barrel |
    | `plugin-sdk/infra-runtime` | Veralteter Kompatibilitäts-Shim; verwenden Sie die fokussierten Runtime-Unterpfade oben |
    | `plugin-sdk/collection-runtime` | Kleine Hilfsfunktionen für begrenzte Caches |
    | `plugin-sdk/diagnostic-runtime` | Hilfsfunktionen für Diagnoseflags, Ereignisse und Trace-Kontext |
    | `plugin-sdk/error-runtime` | Fehlergraph, Formatierung, gemeinsame Hilfsfunktionen zur Fehlerklassifizierung, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | Wrapped-Fetch-, Proxy-, EnvHttpProxyAgent-Options- und Pinned-Lookup-Hilfsfunktionen |
    | `plugin-sdk/runtime-fetch` | Dispatcher-bewusster Runtime-Fetch ohne Proxy-/Guarded-Fetch-Importe |
    | `plugin-sdk/inline-image-data-url-runtime` | Sanitizer für Inline-Bilddaten-URLs und Hilfsfunktionen für Signature-Sniffing ohne die breite Media-Runtime-Oberfläche |
    | `plugin-sdk/response-limit-runtime` | Begrenzter Response-Body-Leser ohne die breite Media-Runtime-Oberfläche |
    | `plugin-sdk/session-binding-runtime` | Aktueller Konversations-Binding-State ohne konfigurierte Binding-Routings oder Pairing-Speicher |
    | `plugin-sdk/session-store-runtime` | Session-Store-Hilfsfunktionen ohne breite Konfigurationsschreib-/Wartungsimporte |
    | `plugin-sdk/sqlite-runtime` | Fokussierte SQLite-Hilfsfunktionen für Agent-Schema, Pfade und Transaktionen ohne Datenbank-Lifecycle-Steuerungen |
    | `plugin-sdk/context-visibility-runtime` | Auflösung der Kontextsichtbarkeit und Filterung ergänzenden Kontexts ohne breite Konfigurations-/Sicherheitsimporte |
    | `plugin-sdk/string-coerce-runtime` | Schlanke Hilfsfunktionen für primitive Record-/String-Koerzierung und Normalisierung ohne Markdown-/Protokollierungsimporte |
    | `plugin-sdk/host-runtime` | Hilfsfunktionen für Hostnamen- und SCP-Host-Normalisierung |
    | `plugin-sdk/retry-runtime` | Hilfsfunktionen für Wiederholungskonfiguration und Wiederholungsrunner |
    | `plugin-sdk/agent-runtime` | Hilfsfunktionen für Agent-Verzeichnis, -Identität und -Arbeitsbereich, einschließlich `resolveAgentDir`, `resolveDefaultAgentDir` und veraltetem Kompatibilitätsexport `resolveOpenClawAgentDir` |
    | `plugin-sdk/directory-runtime` | Konfigurationsgestützte Verzeichnisabfrage/-Deduplizierung |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Fähigkeits- und Test-Subpfade">
    | Subpfad | Wichtige Exporte |
    | --- | --- |
    | `plugin-sdk/media-runtime` | Gemeinsame Helfer zum Abrufen/Transformieren/Speichern von Medien, darunter `saveRemoteMedia`, `saveResponseMedia`, `readRemoteMediaBuffer` und das veraltete `fetchRemoteMedia`; bevorzugen Sie Store-Helfer vor Buffer-Lesevorgängen, wenn eine URL zu OpenClaw-Medien werden soll |
    | `plugin-sdk/media-mime` | Schmale MIME-Normalisierung, Dateierweiterungszuordnung, MIME-Erkennung und Helfer für Medienarten |
    | `plugin-sdk/media-store` | Schmale Medienspeicher-Helfer wie `saveMediaBuffer` und `saveMediaStream` |
    | `plugin-sdk/media-generation-runtime` | Gemeinsame Failover-Helfer für Mediengenerierung, Kandidatenauswahl und Meldungen zu fehlenden Modellen |
    | `plugin-sdk/media-understanding` | Provider-Typen für Medienverständnis sowie Provider-seitige Helferexporte für Bild/Audio/strukturierte Extraktion |
    | `plugin-sdk/text-chunking` | Helfer für Text- und Markdown-Chunking/-Rendering, Markdown-Tabellenkonvertierung, Entfernen von Directive-Tags und Safe-Text-Dienstprogramme |
    | `plugin-sdk/text-chunking` | Helfer für ausgehendes Text-Chunking |
    | `plugin-sdk/speech` | Speech-Provider-Typen sowie Provider-seitige Exporte für Directive, Registry, Validierung, OpenAI-kompatiblen TTS-Builder und Speech-Helfer |
    | `plugin-sdk/speech-core` | Gemeinsame Speech-Provider-Typen, Registry-, Directive-, Normalisierungs- und Speech-Helferexporte |
    | `plugin-sdk/realtime-transcription` | Provider-Typen für Echtzeit-Transkription, Registry-Helfer und gemeinsamer WebSocket-Sitzungshelfer |
    | `plugin-sdk/realtime-bootstrap-context` | Echtzeit-Profil-Bootstrap-Helfer für begrenzte Kontextinjektion von `IDENTITY.md`, `USER.md` und `SOUL.md` |
    | `plugin-sdk/realtime-voice` | Provider-Typen für Echtzeit-Sprache, Registry-Helfer und gemeinsame Verhaltenshelfer für Echtzeit-Sprache, einschließlich Tracking der Ausgabeaktivität |
    | `plugin-sdk/image-generation` | Provider-Typen für Bildgenerierung sowie Helfer für Bild-Assets/Daten-URLs und der OpenAI-kompatible Bild-Provider-Builder |
    | `plugin-sdk/image-generation-core` | Gemeinsame Bildgenerierungstypen, Failover-, Auth- und Registry-Helfer |
    | `plugin-sdk/music-generation` | Provider-/Request-/Result-Typen für Musikgenerierung |
    | `plugin-sdk/music-generation-core` | Gemeinsame Musikgenerierungstypen, Failover-Helfer, Provider-Lookup und Model-Ref-Parsing |
    | `plugin-sdk/video-generation` | Provider-/Request-/Result-Typen für Videogenerierung |
    | `plugin-sdk/video-generation-core` | Gemeinsame Videogenerierungstypen, Failover-Helfer, Provider-Lookup und Model-Ref-Parsing |
    | `plugin-sdk/transcripts` | Gemeinsame Provider-Typen für Transkriptquellen, Registry-Helfer, Sitzungsdeskriptoren und Äußerungsmetadaten |
    | `plugin-sdk/webhook-targets` | Registry für Webhook-Ziele und Helfer zur Routeninstallation |
    | `plugin-sdk/webhook-path` | Veralteter Kompatibilitätsalias; verwenden Sie `plugin-sdk/webhook-ingress` |
    | `plugin-sdk/web-media` | Gemeinsame Helfer zum Laden entfernter/lokaler Medien |
    | `plugin-sdk/zod` | Veralteter Kompatibilitäts-Re-Export; importieren Sie `zod` direkt aus `zod` |
    | `plugin-sdk/testing` | Repo-lokales, veraltetes Kompatibilitäts-Barrel für ältere OpenClaw-Tests. Neue Repo-Tests sollten stattdessen fokussierte lokale Test-Subpfade importieren, etwa `plugin-sdk/agent-runtime-test-contracts`, `plugin-sdk/plugin-test-runtime`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/test-env` oder `plugin-sdk/test-fixtures` |
    | `plugin-sdk/plugin-test-api` | Repo-lokaler minimaler `createTestPluginApi`-Helfer für direkte Unit-Tests zur Plugin-Registrierung, ohne Repo-Test-Helper-Bridges zu importieren |
    | `plugin-sdk/agent-runtime-test-contracts` | Repo-lokale native Contract-Fixtures für Agent-Runtime-Adapter für Auth-, Zustellungs-, Fallback-, Tool-Hook-, Prompt-Overlay-, Schema- und Transkriptionsprojektionstests |
    | `plugin-sdk/channel-test-helpers` | Repo-lokale channel-orientierte Testhelfer für generische Aktionen/Setup-/Status-Contracts, Verzeichnisassertionen, Account-Startlebenszyklus, Send-Config-Threading, Runtime-Mocks, Statusprobleme, ausgehende Zustellung und Hook-Registrierung |
    | `plugin-sdk/channel-target-testing` | Repo-lokale gemeinsame Suite für Fehlerfälle bei Zielauflösung in Channel-Tests |
    | `plugin-sdk/plugin-test-contracts` | Repo-lokale Contract-Helfer für Plugin-Paket, Registrierung, öffentliche Artefakte, direkten Import, Runtime-API und Import-Nebeneffekte |
    | `plugin-sdk/provider-test-contracts` | Repo-lokale Contract-Helfer für Provider-Runtime, Auth, Discovery, Onboarding, Katalog, Wizard, Medienfähigkeit, Replay-Policy, Echtzeit-STT-Live-Audio, Web-Suche/-Fetch und Stream |
    | `plugin-sdk/provider-http-test-mocks` | Repo-lokale optionale Vitest-HTTP-/Auth-Mocks für Provider-Tests, die `plugin-sdk/provider-http` ausüben |
    | `plugin-sdk/test-fixtures` | Repo-lokale generische Fixtures für CLI-Runtime-Erfassung, Sandbox-Kontext, Skill-Writer, Agent-Message, System-Event, Modul-Neuladen, gebündelten Plugin-Pfad, Terminal-Text, Chunking, Auth-Token und typisierte Fälle |
    | `plugin-sdk/test-node-mocks` | Repo-lokale fokussierte Mock-Helfer für eingebaute Node-Module zur Verwendung in Vitest-`vi.mock("node:*")`-Factories |
  </Accordion>

  <Accordion title="Memory-Subpfade">
    | Subpfad | Wichtige Exporte |
    | --- | --- |
    | `plugin-sdk/memory-core` | Gebündelte memory-core-Helferoberfläche für Manager-/Config-/Datei-/CLI-Helfer |
    | `plugin-sdk/memory-core-engine-runtime` | Runtime-Fassade für Memory-Index/-Suche |
    | `plugin-sdk/memory-core-host-embedding-registry` | Leichtgewichtige Registry-Helfer für Memory-Embedding-Provider |
    | `plugin-sdk/memory-core-host-engine-foundation` | Exporte der Memory-Host-Foundation-Engine |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Memory-Host-Embedding-Contracts, Registry-Zugriff, lokaler Provider und generische Batch-/Remote-Helfer. `registerMemoryEmbeddingProvider` auf dieser Oberfläche ist veraltet; verwenden Sie für neue Provider die generische Embedding-Provider-API. |
    | `plugin-sdk/memory-core-host-engine-qmd` | Exporte der Memory-Host-QMD-Engine |
    | `plugin-sdk/memory-core-host-engine-storage` | Exporte der Memory-Host-Storage-Engine |
    | `plugin-sdk/memory-core-host-multimodal` | Multimodale Memory-Host-Helfer |
    | `plugin-sdk/memory-core-host-query` | Memory-Host-Query-Helfer |
    | `plugin-sdk/memory-core-host-secret` | Memory-Host-Secret-Helfer |
    | `plugin-sdk/memory-core-host-events` | Veralteter Kompatibilitätsalias; verwenden Sie `plugin-sdk/memory-host-events` |
    | `plugin-sdk/memory-core-host-status` | Memory-Host-Statushelfer |
    | `plugin-sdk/memory-core-host-runtime-cli` | CLI-Runtime-Helfer für Memory-Host |
    | `plugin-sdk/memory-core-host-runtime-core` | Core-Runtime-Helfer für Memory-Host |
    | `plugin-sdk/memory-core-host-runtime-files` | Datei-/Runtime-Helfer für Memory-Host |
    | `plugin-sdk/memory-host-core` | Vendor-neutraler Alias für Core-Runtime-Helfer von Memory-Host |
    | `plugin-sdk/memory-host-events` | Vendor-neutraler Alias für Event-Journal-Helfer von Memory-Host |
    | `plugin-sdk/memory-host-files` | Veralteter Kompatibilitätsalias; verwenden Sie `plugin-sdk/memory-core-host-runtime-files` |
    | `plugin-sdk/memory-host-markdown` | Gemeinsame Managed-Markdown-Helfer für Memory-nahe Plugins |
    | `plugin-sdk/memory-host-search` | Active Memory-Runtime-Fassade für Search-Manager-Zugriff |
    | `plugin-sdk/memory-host-status` | Veralteter Kompatibilitätsalias; verwenden Sie `plugin-sdk/memory-core-host-status` |
  </Accordion>

  <Accordion title="Reservierte Subpfade für gebündelte Helfer">
    Reservierte SDK-Subpfade für gebündelte Helfer sind schmale, eigentümerspezifische Oberflächen für
    gebündelten Plugin-Code. Sie werden im SDK-Inventar nachverfolgt, damit Paket-
    Builds und Aliasing deterministisch bleiben, sind aber keine allgemeinen APIs
    für die Plugin-Erstellung. Neue wiederverwendbare Host-Contracts sollten generische SDK-Subpfade
    wie `plugin-sdk/gateway-runtime`, `plugin-sdk/security-runtime` und
    `plugin-sdk/plugin-config-runtime` verwenden.

    | Subpfad | Eigentümer und Zweck |
    | --- | --- |
    | `plugin-sdk/codex-mcp-projection` | Gebündelter Codex-Plugin-Helfer zum Projizieren der MCP-Serverkonfiguration des Benutzers in die Thread-Konfiguration des Codex-App-Servers |
    | `plugin-sdk/codex-native-task-runtime` | Gebündelter Codex-Plugin-Helfer zum Spiegeln nativer Codex-App-Server-Subagents in den OpenClaw-Task-Zustand |

  </Accordion>
</AccordionGroup>

## Verwandte Themen

- [Plugin-SDK-Überblick](/de/plugins/sdk-overview)
- [Plugin-SDK-Einrichtung](/de/plugins/sdk-setup)
- [Plugins erstellen](/de/plugins/building-plugins)
