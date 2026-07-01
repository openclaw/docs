---
read_when:
    - Den richtigen plugin-sdk-Unterpfad für einen Plugin-Import auswählen
    - Gebündelte Plugin-Unterpfade und Hilfsoberflächen prüfen
summary: 'Plugin-SDK-Unterpfadkatalog: welche Importe wo liegen, nach Bereich gruppiert'
title: Plugin-SDK-Unterpfade
x-i18n:
    generated_at: "2026-07-01T08:00:11Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 689af6c9c17eb6b3231c5f445d7de0af97d1a8a087bdbc26640851d4b11ada2b
    source_path: plugins/sdk-subpaths.md
    workflow: 16
---

Das Plugin SDK wird als Satz eng gefasster öffentlicher Unterpfade unter
`openclaw/plugin-sdk/` bereitgestellt. Diese Seite katalogisiert die häufig verwendeten Unterpfade, gruppiert nach
Zweck. Das generierte Inventar der Compiler-Einstiegspunkte befindet sich in
`scripts/lib/plugin-sdk-entrypoints.json`; Package-Exporte sind die öffentliche Teilmenge,
nachdem repo-lokale Test-/interne Unterpfade abgezogen wurden, die in
`scripts/lib/plugin-sdk-private-local-only-subpaths.json` aufgeführt sind. Maintainer können die
Anzahl öffentlicher Exporte mit `pnpm plugin-sdk:surface` und aktive reservierte
Hilfsunterpfade mit `pnpm plugins:boundary-report:summary` prüfen; ungenutzte reservierte
Hilfsexporte lassen den CI-Bericht fehlschlagen, statt als ruhende Kompatibilitätsschuld
im öffentlichen SDK zu verbleiben.

Den Leitfaden zum Erstellen von Plugins finden Sie unter [Plugin SDK-Übersicht](/de/plugins/sdk-overview).

## Plugin-Einstieg

| Unterpfad                      | Wichtige Exporte                                                                                                                                                       |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/plugin-entry`      | `definePluginEntry`                                                                                                                                                    |
| `plugin-sdk/core`              | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema`, `buildJsonChannelConfigSchema` |
| `plugin-sdk/config-schema`     | `OpenClawSchema`                                                                                                                                                       |
| `plugin-sdk/provider-entry`    | `defineSingleProviderPluginEntry`                                                                                                                                      |
| `plugin-sdk/migration`         | Hilfsfunktionen für Migration-Provider-Elemente wie `createMigrationItem`, Grundkonstanten, Elementstatus-Marker, Hilfsfunktionen zur Schwärzung und `summarizeMigrationItems` |
| `plugin-sdk/migration-runtime` | Laufzeit-Migrationshilfen wie `copyMigrationFileItem`, `withCachedMigrationConfigRuntime` und `writeMigrationReport`                                                   |
| `plugin-sdk/health`            | Registrierung, Erkennung, Reparatur, Auswahl, Schweregrad und Ergebnistypen für Doctor-Integritätsprüfungen für gebündelte Integritäts-Consumer                         |

### Veraltete Kompatibilitäts- und Test-Hilfsfunktionen

Veraltete Unterpfade bleiben für ältere Plugins exportiert, neuer Code sollte jedoch die
fokussierten SDK-Unterpfade unten verwenden. Die gepflegte Liste ist
`scripts/lib/plugin-sdk-deprecated-public-subpaths.json`; CI weist gebündelte
Produktionsimporte daraus zurück. Breite Barrels wie `compat`, `config-types`,
`infra-runtime`, `text-runtime` und `zod` dienen nur der Kompatibilität. Importieren Sie `zod`
direkt aus `zod`.

Die Vitest-basierten Test-Hilfsunterpfade von OpenClaw sind nur repo-lokal und sind
keine Package-Exporte mehr: `agent-runtime-test-contracts`,
`channel-contract-testing`, `channel-target-testing`, `channel-test-helpers`,
`plugin-test-api`, `plugin-test-contracts`, `plugin-test-runtime`,
`provider-http-test-mocks`, `provider-test-contracts`, `test-env`,
`test-fixtures`, `test-node-mocks` und `testing`.

### Reservierte Hilfsunterpfade für gebündelte Plugins

Diese Unterpfade sind plugin-eigene Kompatibilitätsoberflächen für ihr jeweils besitzendes gebündeltes
Plugin, keine allgemeinen SDK-APIs: `plugin-sdk/codex-mcp-projection` und
`plugin-sdk/codex-native-task-runtime`. Erweiterungsimporte über Besitzergrenzen hinweg werden
durch Package-Vertragsleitplanken blockiert.

<AccordionGroup>
  <Accordion title="Kanal-Unterpfade">
    | Unterpfad | Wichtige Exporte |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | Root-Export des Zod-Schemas für `openclaw.json` (`OpenClawSchema`) |
    | `plugin-sdk/json-schema-runtime` | Zwischengespeicherte JSON-Schema-Validierungshilfe für Plugin-eigene Schemas |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, plus `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | Gemeinsame Hilfsfunktionen für Einrichtungsassistenten, Setup-Übersetzer, Allowlist-Eingabeaufforderungen und Builder für Einrichtungsstatus |
    | `plugin-sdk/setup-runtime` | `createSetupTranslator`, `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | Veralteter Kompatibilitätsalias; verwenden Sie `plugin-sdk/setup-runtime` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | Hilfsfunktionen für Multi-Account-Konfiguration und Action Gates sowie Fallback-Hilfen für Standardkonten |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, Hilfsfunktionen zur Normalisierung von Konto-IDs |
    | `plugin-sdk/account-resolution` | Hilfsfunktionen für Kontosuche und Standard-Fallbacks |
    | `plugin-sdk/account-helpers` | Schmale Hilfsfunktionen für Kontolisten und Kontoaktionen |
    | `plugin-sdk/access-groups` | Hilfsfunktionen zum Parsen von Access-Group-Allowlists und für redigierte Gruppendiagnosen |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | Veraltete Kompatibilitätsfassade. Verwenden Sie `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
    | `plugin-sdk/channel-config-schema` | Gemeinsame Primitive für Kanal-Konfigurationsschemas plus Zod- und direkte JSON/TypeBox-Builder |
    | `plugin-sdk/bundled-channel-config-schema` | Gebündelte OpenClaw-Kanal-Konfigurationsschemas nur für gepflegte gebündelte Plugins |
    | `plugin-sdk/chat-channel-ids` | `BUNDLED_CHAT_CHANNEL_IDS`, `BUNDLED_CHAT_CHANNEL_ENVELOPE_PREFIXES`, `ChatChannelId`. Kanonische gebündelte/offizielle Chat-Kanal-IDs plus Formatierer-Labels/-Aliase für Plugins, die Envelope-präfixierten Text erkennen müssen, ohne eine eigene Tabelle fest zu codieren. |
    | `plugin-sdk/channel-config-schema-legacy` | Veralteter Kompatibilitätsalias für gebündelte Kanal-Konfigurationsschemas |
    | `plugin-sdk/telegram-command-config` | Hilfsfunktionen zur Normalisierung/Validierung benutzerdefinierter Telegram-Befehle mit Fallback auf den gebündelten Vertrag |
    | `plugin-sdk/command-gating` | Schmale Hilfsfunktionen für Befehlsautorisierungs-Gates |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-ingress` | Veraltete Low-Level-Kompatibilitätsfassade für eingehende Kanaldaten. Neue Empfangspfade sollten `plugin-sdk/channel-ingress-runtime` verwenden. |
    | `plugin-sdk/channel-ingress-runtime` | Experimenteller High-Level-Runtime-Resolver für eingehende Kanaldaten und Builder für Routenfakten für migrierte Empfangspfade von Kanälen. Bevorzugen Sie dies gegenüber dem Zusammensetzen effektiver Allowlists, Befehls-Allowlists und Legacy-Projektionen in jedem Plugin. Siehe [Channel Ingress API](/de/plugins/sdk-channel-ingress). |
    | `plugin-sdk/channel-lifecycle` | Veraltete Kompatibilitätsfassade. Verwenden Sie `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-outbound` | Verträge für Nachrichtenlebenszyklen plus Optionen für Reply-Pipelines, Belege, Live-Vorschau/Streaming, Lebenszyklus-Hilfsfunktionen, ausgehende Identität, Payload-Planung, dauerhafte Sendevorgänge und Hilfsfunktionen für Nachrichtenversand-Kontexte. Siehe [Channel Outbound API](/de/plugins/sdk-channel-outbound). |
    | `plugin-sdk/channel-message` | Veralteter Kompatibilitätsalias für `plugin-sdk/channel-outbound` plus Legacy-Fassaden für Reply-Dispatch. |
    | `plugin-sdk/channel-message-runtime` | Veralteter Kompatibilitätsalias für `plugin-sdk/channel-outbound` plus Legacy-Fassaden für Reply-Dispatch. |
    | `plugin-sdk/inbound-envelope` | Gemeinsame Hilfsfunktionen für eingehende Routen und Envelope-Builder |
    | `plugin-sdk/inbound-reply-dispatch` | Veraltete Kompatibilitätsfassade. Verwenden Sie `plugin-sdk/channel-inbound` für eingehende Runner und Dispatch-Prädikate und `plugin-sdk/channel-outbound` für Hilfsfunktionen zur Nachrichtenzustellung. |
    | `plugin-sdk/messaging-targets` | Veralteter Alias für Ziel-Parsing; verwenden Sie `plugin-sdk/channel-targets` |
    | `plugin-sdk/outbound-media` | Gemeinsame Hilfsfunktionen zum Laden ausgehender Medien und für Hosted-Media-Status |
    | `plugin-sdk/outbound-send-deps` | Veraltete Kompatibilitätsfassade. Verwenden Sie `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/outbound-runtime` | Veraltete Kompatibilitätsfassade. Verwenden Sie `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/poll-runtime` | Schmale Hilfsfunktionen zur Poll-Normalisierung |
    | `plugin-sdk/thread-bindings-runtime` | Hilfsfunktionen für Thread-Binding-Lebenszyklen und Adapter |
    | `plugin-sdk/agent-media-payload` | Legacy-Builder für Agent-Medien-Payloads |
    | `plugin-sdk/conversation-runtime` | Hilfsfunktionen für Conversation-/Thread-Binding, Pairing und konfigurierte Bindings |
    | `plugin-sdk/runtime-config-snapshot` | Hilfsfunktion für Runtime-Konfigurations-Snapshots |
    | `plugin-sdk/runtime-group-policy` | Hilfsfunktionen zur Auflösung von Runtime-Gruppenrichtlinien |
    | `plugin-sdk/channel-status` | Gemeinsame Hilfsfunktionen für Kanalstatus-Snapshots/-Zusammenfassungen |
    | `plugin-sdk/channel-config-primitives` | Schmale Primitive für Kanal-Konfigurationsschemas |
    | `plugin-sdk/channel-config-writes` | Hilfsfunktionen zur Autorisierung von Schreibvorgängen an der Kanal-Konfiguration |
    | `plugin-sdk/channel-plugin-common` | Gemeinsame Prelude-Exporte für Kanal-Plugins |
    | `plugin-sdk/allowlist-config-edit` | Hilfsfunktionen zum Bearbeiten/Lesen der Allowlist-Konfiguration |
    | `plugin-sdk/group-access` | Gemeinsame Hilfsfunktionen für Entscheidungen zum Gruppenzugriff |
    | `plugin-sdk/direct-dm`, `plugin-sdk/direct-dm-access` | Veraltete Kompatibilitätsfassaden. Verwenden Sie `plugin-sdk/channel-inbound`. |
    | `plugin-sdk/direct-dm-guard-policy` | Schmale Hilfsfunktionen für Direct-DM-Guard-Richtlinien vor der Kryptografie |
    | `plugin-sdk/discord` | Veraltete Discord-Kompatibilitätsfassade für das veröffentlichte `@openclaw/discord@2026.3.13` und nachverfolgte Owner-Kompatibilität; neue Plugins sollten generische Kanal-SDK-Unterpfade verwenden |
    | `plugin-sdk/telegram-account` | Veraltete Telegram-Kompatibilitätsfassade für Kontoauflösung für nachverfolgte Owner-Kompatibilität; neue Plugins sollten injizierte Runtime-Hilfsfunktionen oder generische Kanal-SDK-Unterpfade verwenden |
    | `plugin-sdk/zalouser` | Veraltete Zalo-Personal-Kompatibilitätsfassade für veröffentlichte Lark-/Zalo-Pakete, die weiterhin Befehlsautorisierung für Absender importieren; neue Plugins sollten `plugin-sdk/command-auth` verwenden |
    | `plugin-sdk/interactive-runtime` | Semantische Nachrichtendarstellung, Zustellung und Legacy-Hilfsfunktionen für interaktive Antworten. Siehe [Nachrichtendarstellung](/de/plugins/message-presentation) |
    | `plugin-sdk/channel-inbound` | Gemeinsame Hilfsfunktionen für Ereignisklassifizierung, Kontextaufbau, Formatierung, Roots, Debounce, Mention-Abgleich, Mention-Richtlinien und Inbound-Logging |
    | `plugin-sdk/channel-inbound-debounce` | Schmale Hilfsfunktionen für Inbound-Debounce |
    | `plugin-sdk/channel-mention-gating` | Schmale Hilfsfunktionen für Mention-Richtlinien, Mention-Marker und Mention-Text ohne die breitere Inbound-Runtime-Oberfläche |
    | `plugin-sdk/channel-envelope`, `plugin-sdk/channel-inbound-roots`, `plugin-sdk/channel-location`, `plugin-sdk/channel-logging` | Veraltete Kompatibilitätsfassaden. Verwenden Sie `plugin-sdk/channel-inbound` oder `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-pairing-paths` | Veraltete Kompatibilitätsfassade. Verwenden Sie `plugin-sdk/channel-pairing`. |
    | `plugin-sdk/channel-reply-options-runtime` | Veraltete Kompatibilitätsfassade. Verwenden Sie `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-streaming` | Veraltete Kompatibilitätsfassade. Verwenden Sie `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-send-result` | Ergebnistypen für Antworten |
    | `plugin-sdk/channel-actions` | Hilfsfunktionen für Kanal-Nachrichtenaktionen plus veraltete native Schema-Hilfsfunktionen, die für Plugin-Kompatibilität beibehalten werden |
    | `plugin-sdk/channel-route` | Gemeinsame Hilfsfunktionen für Routennormalisierung, parsergestützte Zielauflösung, Stringifizierung von Thread-IDs, Deduplizierung/kompakte Routenschlüssel, geparste Zieltypen und Routen-/Zielvergleich |
    | `plugin-sdk/channel-targets` | Hilfsfunktionen zum Parsen von Zielen; Aufrufer für Routenvergleiche sollten `plugin-sdk/channel-route` verwenden |
    | `plugin-sdk/channel-contract` | Kanalvertragstypen |
    | `plugin-sdk/channel-feedback` | Verdrahtung von Feedback/Reaktionen |
    | `plugin-sdk/channel-secret-runtime` | Schmale Hilfsfunktionen für Secret-Verträge wie `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment` und Secret-Zieltypen |
  </Accordion>

Veraltete Familien von Kanal-Hilfsfunktionen bleiben nur für die
Kompatibilität veröffentlichter Plugins verfügbar. Der Entfernungsplan lautet:
Sie bleiben während des Migrationsfensters für externe Plugins erhalten,
Repo-/gebündelte Plugins bleiben auf `channel-inbound` und `channel-outbound`,
danach werden die Kompatibilitäts-Unterpfade bei der nächsten größeren
SDK-Bereinigung entfernt. Dies gilt für die alten Familien für Channel
Message/Runtime, Channel Streaming, Direct-DM-Zugriff, Inbound-Helper-Splinter,
Reply-Options und Pairing-Paths.

  <Accordion title="Provider-Unterpfade">
    | Unterpfad | Wichtige Exporte |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/lmstudio` | Unterstützte LM Studio-Provider-Fassade für Einrichtung, Katalogerkennung und Laufzeit-Modellvorbereitung |
    | `plugin-sdk/lmstudio-runtime` | Unterstützte LM Studio-Laufzeitfassade für lokale Server-Standardeinstellungen, Modellerkennung, Anfrage-Header und Hilfsfunktionen für geladene Modelle |
    | `plugin-sdk/provider-setup` | Kuratierte Hilfsfunktionen zur Einrichtung lokaler/selbst gehosteter Provider |
    | `plugin-sdk/self-hosted-provider-setup` | Fokussierte Hilfsfunktionen zur Einrichtung OpenAI-kompatibler selbst gehosteter Provider |
    | `plugin-sdk/cli-backend` | CLI-Backend-Standardeinstellungen + Watchdog-Konstanten |
    | `plugin-sdk/provider-auth-runtime` | Laufzeit-Hilfsfunktionen zur API-Schlüsselauflösung für Provider-Plugins |
    | `plugin-sdk/provider-oauth-runtime` | Generische Provider-OAuth-Callback-Typen, Callback-Seiten-Rendering, PKCE/State-Hilfsfunktionen, Parsing von Autorisierungseingaben, Hilfsfunktionen für Token-Ablauf und Abbruch-Hilfsfunktionen |
    | `plugin-sdk/provider-auth-api-key` | Hilfsfunktionen für API-Schlüssel-Onboarding/Profilschreiben wie `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | Standardmäßiger OAuth-Auth-Result-Builder |
    | `plugin-sdk/provider-env-vars` | Hilfsfunktionen zur Suche nach Provider-Auth-Umgebungsvariablen |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials`, OpenAI Codex-Auth-Import-Hilfsfunktionen, veralteter Kompatibilitätsexport `resolveOpenClawAgentDir` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, gemeinsame Replay-Policy-Builder, Provider-Endpunkt-Hilfsfunktionen und gemeinsame Hilfsfunktionen zur Modell-ID-Normalisierung |
    | `plugin-sdk/provider-catalog-live-runtime` | Live-Hilfsfunktionen für Provider-Modellkataloge zur abgesicherten Erkennung im Stil von `/models`: `buildLiveModelProviderConfig`, `fetchLiveProviderModelRows`, `getCachedLiveProviderModelRows`, `fetchLiveProviderModelIds`, `LiveModelCatalogHttpError`, `clearLiveCatalogCacheForTests`, Modell-ID-Filterung, TTL-Cache und statischer Fallback |
    | `plugin-sdk/provider-catalog-runtime` | Laufzeit-Hook zur Provider-Katalogerweiterung und Plugin-Provider-Registry-Übergänge für Vertragstests |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | Generische Hilfsfunktionen für Provider-HTTP/Endpunkt-Fähigkeiten, Provider-HTTP-Fehler und Multipart-Formular-Hilfsfunktionen für Audiotranskription |
    | `plugin-sdk/provider-web-fetch-contract` | Enger Vertrag für Web-Fetch-Konfiguration/-Auswahl mit Hilfsfunktionen wie `enablePluginInConfig` und `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | Hilfsfunktionen für Web-Fetch-Provider-Registrierung/-Cache |
    | `plugin-sdk/provider-web-search-config-contract` | Enger Vertrag für Web-Search-Konfiguration/Anmeldedaten für Provider, die keine Plugin-Aktivierungsverdrahtung benötigen |
    | `plugin-sdk/provider-web-search-contract` | Enger Vertrag für Web-Search-Konfiguration/Anmeldedaten mit Hilfsfunktionen wie `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` und bereichsgebundenen Settern/Gettern für Anmeldedaten |
    | `plugin-sdk/provider-web-search` | Hilfsfunktionen für Web-Search-Provider-Registrierung/-Cache/-Laufzeit |
    | `plugin-sdk/embedding-providers` | Allgemeine Typen und Lese-Hilfsfunktionen für Embedding-Provider, einschließlich `EmbeddingProviderAdapter`, `getEmbeddingProvider(...)` und `listEmbeddingProviders(...)`; Plugins registrieren Provider über `api.registerEmbeddingProvider(...)`, damit Manifest-Eigentümerschaft erzwungen wird |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks` und DeepSeek/Gemini/OpenAI-Schemabereinigung + Diagnosen |
    | `plugin-sdk/provider-usage` | Snapshot-Typen für Provider-Nutzung, gemeinsame Hilfsfunktionen zum Abrufen von Nutzung und Provider-Abrufmodule wie `fetchClaudeUsage` |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, Stream-Wrapper-Typen, Klartext-Tool-Call-Kompatibilität und gemeinsame Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot-Wrapper-Hilfsfunktionen |
    | `plugin-sdk/provider-stream-shared` | Öffentliche gemeinsame Hilfsfunktionen für Provider-Stream-Wrapper, einschließlich `composeProviderStreamWrappers`, `createOpenAICompatibleCompletionsThinkingOffWrapper`, `createPlainTextToolCallCompatWrapper`, `createPayloadPatchStreamWrapper`, `createToolStreamWrapper`, `normalizeOpenAICompatibleReasoningPayload`, `setQwenChatTemplateThinking` und Anthropic/DeepSeek/OpenAI-kompatiblen Stream-Dienstprogrammen |
    | `plugin-sdk/provider-transport-runtime` | Native Provider-Transport-Hilfsfunktionen wie abgesichertes Fetching, Textextraktion aus Tool-Ergebnissen, Transportnachrichten-Transformationen und beschreibbare Transportereignis-Streams |
    | `plugin-sdk/provider-onboard` | Hilfsfunktionen für Onboarding-Konfigurationspatches |
    | `plugin-sdk/global-singleton` | Prozesslokale Singleton-/Map-/Cache-Hilfsfunktionen |
    | `plugin-sdk/group-activation` | Hilfsfunktionen für engen Gruppenaktivierungsmodus und Befehlsparsing |
  </Accordion>

Provider-Nutzungs-Snapshots melden normalerweise ein oder mehrere Kontingent-`windows`, jeweils mit
einer Bezeichnung, prozentualer Nutzung und optionaler Zurücksetzungszeit. Provider, die Saldo- oder
Kontostandstext statt zurücksetzbarer Kontingentfenster offenlegen, sollten
`summary` mit einem leeren `windows`-Array zurückgeben, statt Prozentsätze zu erfinden.
OpenClaw zeigt diesen Zusammenfassungstext in der Statusausgabe an; verwenden Sie `error` nur, wenn der
Nutzungsendpunkt fehlgeschlagen ist oder keine nutzbaren Nutzungsdaten zurückgegeben hat.

  <Accordion title="Authentifizierungs- und Sicherheitsunterpfade">
    | Unterpfad | Wichtige Exporte |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, Befehlsregistry-Hilfsfunktionen einschließlich dynamischer Argumentmenü-Formatierung, Hilfsfunktionen zur Senderautorisierung |
    | `plugin-sdk/command-status` | Builder für Befehls-/Hilfenachrichten wie `buildCommandsMessagePaginated` und `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | Hilfsfunktionen zur Auflösung von Genehmigenden und zur Aktionsauthentifizierung im selben Chat |
    | `plugin-sdk/approval-client-runtime` | Hilfsfunktionen für native Exec-Genehmigungsprofile/-Filter |
    | `plugin-sdk/approval-delivery-runtime` | Native Adapter für Genehmigungsfähigkeit/-Zustellung |
    | `plugin-sdk/approval-gateway-runtime` | Gemeinsame Hilfsfunktion zur Genehmigungs-Gateway-Auflösung |
    | `plugin-sdk/approval-handler-adapter-runtime` | Leichtgewichtige Hilfsfunktionen zum Laden nativer Genehmigungsadapter für heiße Kanal-Einstiegspunkte |
    | `plugin-sdk/approval-handler-runtime` | Breitere Laufzeit-Hilfsfunktionen für Genehmigungs-Handler; bevorzugen Sie die engeren Adapter-/Gateway-Übergänge, wenn diese ausreichen |
    | `plugin-sdk/approval-native-runtime` | Hilfsfunktionen für natives Genehmigungsziel, Kontobindung, Routen-Gate, Weiterleitungs-Fallback und Unterdrückung lokaler nativer Exec-Aufforderungen |
    | `plugin-sdk/approval-reaction-runtime` | Hartcodierte Genehmigungsreaktions-Bindings, Reaktionsaufforderungs-Payloads, Reaktionsziel-Speicher und Kompatibilitätsexport für die Unterdrückung lokaler nativer Exec-Aufforderungen |
    | `plugin-sdk/approval-reply-runtime` | Hilfsfunktionen für Exec-/Plugin-Genehmigungsantwort-Payloads |
    | `plugin-sdk/approval-runtime` | Hilfsfunktionen für Exec-/Plugin-Genehmigungs-Payloads, native Genehmigungs-Routing-/Laufzeit-Hilfsfunktionen und strukturierte Hilfsfunktionen zur Genehmigungsanzeige wie `formatApprovalDisplayPath` |
    | `plugin-sdk/reply-dedupe` | Enge Hilfsfunktionen zum Zurücksetzen der Deduplizierung eingehender Antworten |
    | `plugin-sdk/channel-contract-testing` | Enge Test-Hilfsfunktionen für Kanalverträge ohne das breite Testing-Barrel |
    | `plugin-sdk/command-auth-native` | Native Befehlsauthentifizierung, dynamische Argumentmenü-Formatierung und native Hilfsfunktionen für Sitzungsziele |
    | `plugin-sdk/command-detection` | Gemeinsame Hilfsfunktionen zur Befehlserkennung |
    | `plugin-sdk/command-primitives-runtime` | Leichtgewichtige Befehls-Textprädikate für heiße Kanalpfade |
    | `plugin-sdk/command-surface` | Hilfsfunktionen zur Befehlsrumpf-Normalisierung und Befehlsoberfläche |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | Enge Hilfsfunktionen zur Secret-Vertragssammlung für Kanal-/Plugin-Secret-Oberflächen |
    | `plugin-sdk/secret-ref-runtime` | Enge `coerceSecretRef`- und SecretRef-Typisierungshilfsfunktionen für Secret-Vertrags-/Konfigurationsparsing |
    | `plugin-sdk/secret-provider-integration` | Reine Typverträge für SecretRef-Provider-Integrationsmanifest und Presets für Plugins, die externe Secret-Provider-Presets veröffentlichen |
    | `plugin-sdk/security-runtime` | Gemeinsame Hilfsfunktionen für Vertrauen, DM-Gating, root-begrenzte Dateien/Pfade einschließlich reiner Erstellschreibvorgänge, synchroner/asynchroner atomarer Dateiersetzung, Geschwister-Temp-Schreibvorgängen, Cross-Device-Move-Fallback, privaten Dateispeicher-Hilfsfunktionen, Symlink-Parent-Guards, externen Inhalten, Schwärzung sensibler Texte, Secret-Vergleich in konstanter Zeit und Secret-Sammlung |
    | `plugin-sdk/ssrf-policy` | Hilfsfunktionen für Host-Allowlist und Private-Network-SSRF-Policy |
    | `plugin-sdk/ssrf-dispatcher` | Enge Hilfsfunktionen für angeheftete Dispatcher ohne die breite Infrastruktur-Laufzeitoberfläche |
    | `plugin-sdk/ssrf-runtime` | Angehefteter Dispatcher, SSRF-abgesichertes Fetching, SSRF-Fehler und SSRF-Policy-Hilfsfunktionen |
    | `plugin-sdk/secret-input` | Hilfsfunktionen zum Parsen von Secret-Eingaben |
    | `plugin-sdk/webhook-ingress` | Webhook-Anfrage-/Ziel-Hilfsfunktionen und rohe Websocket-/Body-Koersion |
    | `plugin-sdk/webhook-request-guards` | Hilfsfunktionen für Anfrage-Body-Größe/-Timeout |
  </Accordion>

  <Accordion title="Runtime- und Speicher-Unterpfade">
    | Unterpfad | Wichtige Exporte |
    | --- | --- |
    | `plugin-sdk/runtime` | Breite Runtime-/Logging-/Backup-/Plugin-Installationshelfer |
    | `plugin-sdk/runtime-env` | Enge Helfer für Runtime-Umgebung, Logger, Timeout, Wiederholung und Backoff |
    | `plugin-sdk/browser-config` | Unterstützte Browser-Konfigurationsfassade für normalisierte Profile/Defaults, CDP-URL-Parsing und Authentifizierungshelfer für Browser-Steuerung |
    | `plugin-sdk/agent-harness-task-runtime` | Generische Helfer für Task-Lebenszyklus und Abschlusszustellung für Harness-gestützte Agents mit einem vom Host ausgegebenen Task-Scope |
    | `plugin-sdk/codex-mcp-projection` | Reservierter gebündelter Codex-Helfer zum Projizieren der Benutzer-MCP-Serverkonfiguration in die Codex-Thread-Konfiguration; nicht für Drittanbieter-Plugins |
    | `plugin-sdk/codex-native-task-runtime` | Privater gebündelter Codex-Helfer für native Task-Spiegel-/Runtime-Verdrahtung; nicht für Drittanbieter-Plugins |
    | `plugin-sdk/channel-runtime-context` | Generische Helfer für Registrierung und Lookup des Kanal-Runtime-Kontexts |
    | `plugin-sdk/matrix` | Veraltete Matrix-Kompatibilitätsfassade für ältere Drittanbieter-Kanalpakete; neue Plugins sollten `plugin-sdk/run-command` direkt importieren |
    | `plugin-sdk/mattermost` | Veraltete Mattermost-Kompatibilitätsfassade für ältere Drittanbieter-Kanalpakete; neue Plugins sollten generische SDK-Unterpfade direkt importieren |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Gemeinsame Helfer für Plugin-Befehle, Hooks, HTTP und interaktive Nutzung |
    | `plugin-sdk/hook-runtime` | Gemeinsame Pipeline-Helfer für Webhook/interne Hooks |
    | `plugin-sdk/lazy-runtime` | Helfer für verzögerten Runtime-Import und -Binding wie `createLazyRuntimeModule`, `createLazyRuntimeMethod` und `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | Helfer für Prozessausführung |
    | `plugin-sdk/cli-runtime` | Helfer für CLI-Formatierung, Warten, Version, Argumentaufruf und verzögerte Befehlsgruppen |
    | `plugin-sdk/qa-live-transport-scenarios` | Gemeinsame Live-Transport-QA-Szenario-IDs, Baseline-Coverage-Helfer und Helfer zur Szenarioauswahl |
    | `plugin-sdk/gateway-method-runtime` | Reservierter Gateway-Methoden-Dispatch-Helfer für Plugin-HTTP-Routen, die `contracts.gatewayMethodDispatch: ["authenticated-request"]` deklarieren |
    | `plugin-sdk/gateway-runtime` | Gateway-Client, Helfer zum Starten eines Event-Loop-bereiten Clients, Gateway-CLI-RPC, Gateway-Protokollfehler und Helfer für Kanalstatus-Patches |
    | `plugin-sdk/config-contracts` | Fokussierte reine Typ-Konfigurationsoberfläche für Plugin-Konfigurationsformen wie `OpenClawConfig` und Kanal-/Provider-Konfigurationstypen |
    | `plugin-sdk/plugin-config-runtime` | Runtime-Helfer für Plugin-Konfigurations-Lookups wie `requireRuntimeConfig`, `resolvePluginConfigObject` und `resolveLivePluginConfigObject` |
    | `plugin-sdk/config-mutation` | Transaktionale Konfigurationsmutationshelfer wie `mutateConfigFile`, `replaceConfigFile` und `logConfigUpdated` |
    | `plugin-sdk/message-tool-delivery-hints` | Gemeinsame Metadaten-Hinweisstrings für Message-Tool-Zustellung |
    | `plugin-sdk/runtime-config-snapshot` | Helfer für aktuelle Prozesskonfigurations-Snapshots wie `getRuntimeConfig`, `getRuntimeConfigSnapshot` und Test-Snapshot-Setter |
    | `plugin-sdk/telegram-command-config` | Normalisierung von Telegram-Befehlsnamen/-beschreibungen und Duplikat-/Konfliktprüfungen, selbst wenn die gebündelte Telegram-Vertragsoberfläche nicht verfügbar ist |
    | `plugin-sdk/text-autolink-runtime` | Autolink-Erkennung für Dateireferenzen ohne das breite Text-Barrel |
    | `plugin-sdk/approval-reaction-runtime` | Fest codierte Approval-Reaktionsbindungen, Reaction-Prompt-Payloads, Reaction-Target-Stores und Kompatibilitätsexport für lokale native Unterdrückung von Exec-Prompts |
    | `plugin-sdk/approval-runtime` | Exec-/Plugin-Approval-Helfer, Approval-Capability-Builder, Auth-/Profilhelfer, native Routing-/Runtime-Helfer und strukturierte Approval-Anzeigepfadformatierung |
    | `plugin-sdk/reply-runtime` | Gemeinsame Helfer für eingehende Antworten/Reply-Runtime, Chunking, Dispatch, Heartbeat, Reply-Planner |
    | `plugin-sdk/reply-dispatch-runtime` | Enge Helfer für Reply-Dispatch/-Finalisierung und Konversationslabels |
    | `plugin-sdk/reply-history` | Gemeinsame Helfer für Kurzfenster-Reply-Verlauf. Neuer Message-Turn-Code sollte `createChannelHistoryWindow` verwenden; Low-Level-Map-Helfer bleiben nur veraltete Kompatibilitätsexporte |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | Enge Helfer für Text-/Markdown-Chunking |
    | `plugin-sdk/session-store-runtime` | Sitzungsworkflow-Helfer (`getSessionEntry`, `listSessionEntries`, `patchSessionEntry`, `upsertSessionEntry`), begrenzte Lesevorgänge für aktuelle Benutzer-/Assistenten-Transkripttexte nach Sitzungsidentität, Legacy-Helfer für Sitzungsspeicherpfad/Sitzungsschlüssel, Updated-at-Lesevorgänge und nur für Übergänge gedachte Kompatibilitätshelfer für gesamten Store/Dateipfad |
    | `plugin-sdk/session-transcript-runtime` | Transkriptidentität, bereichsbezogene Target-/Lese-/Schreibhelfer, Update-Veröffentlichung, Schreibsperren und Treffer-Schlüssel für Transkript-Memory |
    | `plugin-sdk/sqlite-runtime` | Fokussierte SQLite-Agent-Schema-, Pfad- und Transaktionshelfer für First-Party-Runtime |
    | `plugin-sdk/cron-store-runtime` | Helfer für Cron-Store-Pfad/Laden/Speichern |
    | `plugin-sdk/state-paths` | Helfer für State-/OAuth-Verzeichnispfade |
    | `plugin-sdk/plugin-state-runtime` | SQLite-Keyed-State-Typen für Plugin-Sidecars plus zentralisiertes Connection-Pragma und WAL-Wartungseinrichtung für Plugin-eigene Datenbanken |
    | `plugin-sdk/routing` | Helfer für Route-/Sitzungsschlüssel-/Account-Bindings wie `resolveAgentRoute`, `buildAgentSessionKey` und `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | Gemeinsame Helfer für Kanal-/Account-Statuszusammenfassungen, Runtime-State-Defaults und Issue-Metadaten |
    | `plugin-sdk/target-resolver-runtime` | Gemeinsame Target-Resolver-Helfer |
    | `plugin-sdk/string-normalization-runtime` | Slug-/String-Normalisierungshelfer |
    | `plugin-sdk/request-url` | String-URLs aus Fetch-/Request-ähnlichen Eingaben extrahieren |
    | `plugin-sdk/run-command` | Zeitbegrenzter Command-Runner mit normalisierten stdout-/stderr-Ergebnissen |
    | `plugin-sdk/param-readers` | Gemeinsame Tool-/CLI-Parameterleser |
    | `plugin-sdk/tool-plugin` | Ein einfaches typisiertes Agent-Tool-Plugin definieren und statische Metadaten für Manifestgenerierung bereitstellen |
    | `plugin-sdk/tool-payload` | Normalisierte Payloads aus Tool-Ergebnisobjekten extrahieren |
    | `plugin-sdk/tool-send` | Kanonische Send-Target-Felder aus Tool-Argumenten extrahieren |
    | `plugin-sdk/sandbox` | Sandbox-Backend-Typen und SSH-/OpenShell-Command-Helfer, einschließlich Fail-Fast-Exec-Command-Preflight |
    | `plugin-sdk/temp-path` | Gemeinsame Helfer für temporäre Download-Pfade und private sichere temporäre Arbeitsbereiche |
    | `plugin-sdk/logging-core` | Subsystem-Logger und Redaktionshelfer |
    | `plugin-sdk/markdown-table-runtime` | Helfer für Markdown-Tabellenmodus und -Konvertierung |
    | `plugin-sdk/model-session-runtime` | Helfer für Modell-/Sitzungs-Overrides wie `applyModelOverrideToSessionEntry` und `resolveAgentMaxConcurrent` |
    | `plugin-sdk/talk-config-runtime` | Helfer zur Auflösung der Talk-Provider-Konfiguration |
    | `plugin-sdk/json-store` | Kleine Helfer zum Lesen/Schreiben von JSON-State |
    | `plugin-sdk/json-unsafe-integers` | JSON-Parsing-Helfer, die unsichere Integer-Literale als Strings erhalten |
    | `plugin-sdk/file-lock` | Reentrante File-Lock-Helfer |
    | `plugin-sdk/persistent-dedupe` | Datenträgergestützte Dedupe-Cache-Helfer |
    | `plugin-sdk/acp-runtime` | ACP-Runtime-/Sitzungs- und Reply-Dispatch-Helfer |
    | `plugin-sdk/acp-runtime-backend` | Leichtgewichtige ACP-Backend-Registrierungs- und Reply-Dispatch-Helfer für beim Start geladene Plugins |
    | `plugin-sdk/acp-binding-resolve-runtime` | Schreibgeschützte ACP-Binding-Auflösung ohne Lifecycle-Startimporte |
    | `plugin-sdk/agent-config-primitives` | Enge Agent-Runtime-Konfigurationsschema-Primitiven |
    | `plugin-sdk/boolean-param` | Lockerer boolescher Parameterleser |
    | `plugin-sdk/dangerous-name-runtime` | Helfer zur Auflösung von Dangerous-Name-Abgleichen |
    | `plugin-sdk/device-bootstrap` | Helfer für Geräte-Bootstrap und Pairing-Token |
    | `plugin-sdk/extension-shared` | Gemeinsame Primitive für passive Kanäle, Status und Ambient-Proxy-Helfer |
    | `plugin-sdk/models-provider-runtime` | Antworthelfer für `/models`-Befehl/Provider |
    | `plugin-sdk/skill-commands-runtime` | Helfer zum Auflisten von Skill-Befehlen |
    | `plugin-sdk/native-command-registry` | Helfer für native Command-Registry, Build und Serialisierung |
    | `plugin-sdk/agent-harness` | Experimentelle Trusted-Plugin-Oberfläche für Low-Level-Agent-Harnesses: Harness-Typen, Helfer zum Steuern/Abbrechen aktiver Runs, OpenClaw-Tool-Bridge-Helfer, Runtime-Plan-Tool-Policy-Helfer, Klassifizierung terminaler Ergebnisse, Formatierungs-/Detailhelfer für Tool-Fortschritt und Utilities für Attempt-Ergebnisse |
    | `plugin-sdk/provider-zai-endpoint` | Veraltete Provider-eigene Z.AI-Endpunkterkennungsfassade; verwenden Sie die öffentliche API des Z.AI-Plugins |
    | `plugin-sdk/async-lock-runtime` | Prozesslokaler Async-Lock-Helfer für kleine Runtime-State-Dateien |
    | `plugin-sdk/channel-activity-runtime` | Helfer für Kanalaktivitätstelemetrie |
    | `plugin-sdk/concurrency-runtime` | Helfer für begrenzte Async-Task-Parallelität |
    | `plugin-sdk/dedupe-runtime` | In-Memory-Dedupe-Cache-Helfer |
    | `plugin-sdk/delivery-queue-runtime` | Helfer zum Leeren ausstehender ausgehender Zustellungen |
    | `plugin-sdk/file-access-runtime` | Helfer für sichere lokale Dateien und Medienquellenpfade |
    | `plugin-sdk/heartbeat-runtime` | Helfer für Heartbeat-Wecken, -Ereignisse und -Sichtbarkeit |
    | `plugin-sdk/number-runtime` | Helfer für numerische Koerzierung |
    | `plugin-sdk/secure-random-runtime` | Helfer für sichere Token/UUIDs |
    | `plugin-sdk/system-event-runtime` | Helfer für Systemereignis-Queue |
    | `plugin-sdk/transport-ready-runtime` | Helfer zum Warten auf Transportbereitschaft |
    | `plugin-sdk/exec-approvals-runtime` | Helfer für Exec-Approval-Policy-Dateien ohne das breite Infra-Runtime-Barrel |
    | `plugin-sdk/infra-runtime` | Veralteter Kompatibilitäts-Shim; verwenden Sie die fokussierten Runtime-Unterpfade oben |
    | `plugin-sdk/collection-runtime` | Kleine Helfer für begrenzte Caches |
    | `plugin-sdk/diagnostic-runtime` | Helfer für Diagnose-Flags, -Ereignisse und Trace-Kontext |
    | `plugin-sdk/error-runtime` | Fehlergraph, Formatierung, gemeinsame Fehlerklassifizierungshelfer, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | Umhülltes Fetch, Proxy, EnvHttpProxyAgent-Option und Helfer für gepinnten Lookup |
    | `plugin-sdk/runtime-fetch` | Dispatcher-bewusster Runtime-Fetch ohne Proxy-/Guarded-Fetch-Importe |
    | `plugin-sdk/inline-image-data-url-runtime` | Sanitizer für Inline-Bild-Data-URLs und Helfer für Signature-Sniffing ohne die breite Media-Runtime-Oberfläche |
    | `plugin-sdk/response-limit-runtime` | Begrenzter Response-Body-Reader ohne die breite Media-Runtime-Oberfläche |
    | `plugin-sdk/session-binding-runtime` | Aktueller Konversations-Binding-State ohne konfiguriertes Binding-Routing oder Pairing-Stores |
    | `plugin-sdk/session-store-runtime` | Sitzungsspeicher-Helfer ohne breite Importe für Konfigurationsschreibvorgänge/Wartung |
    | `plugin-sdk/sqlite-runtime` | Fokussierte SQLite-Agent-Schema-, Pfad- und Transaktionshelfer ohne Datenbank-Lifecycle-Steuerungen |
    | `plugin-sdk/context-visibility-runtime` | Auflösung der Kontextsichtbarkeit und zusätzliche Kontextfilterung ohne breite Konfigurations-/Sicherheitsimporte |
    | `plugin-sdk/string-coerce-runtime` | Enge Helfer für primitive Record-/String-Koerzierung und -Normalisierung ohne Markdown-/Logging-Importe |
    | `plugin-sdk/host-runtime` | Helfer für Hostname- und SCP-Host-Normalisierung |
    | `plugin-sdk/retry-runtime` | Helfer für Wiederholungskonfiguration und Retry-Runner |
    | `plugin-sdk/agent-runtime` | Helfer für Agent-Verzeichnis, -Identität und -Arbeitsbereich, einschließlich `resolveAgentDir`, `resolveDefaultAgentDir` und veraltetem Kompatibilitätsexport `resolveOpenClawAgentDir` |
    | `plugin-sdk/directory-runtime` | Konfigurationsgestützte Verzeichnisabfrage/-Deduplizierung |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Fähigkeits- und Test-Unterpfade">
    | Unterpfad | Wichtige Exporte |
    | --- | --- |
    | `plugin-sdk/media-runtime` | Gemeinsame Hilfsfunktionen zum Abrufen, Transformieren und Speichern von Medien, einschließlich `saveRemoteMedia`, `saveResponseMedia`, `readRemoteMediaBuffer` und dem veralteten `fetchRemoteMedia`; bevorzugen Sie Speicher-Hilfsfunktionen vor Buffer-Lesevorgängen, wenn eine URL zu OpenClaw-Medien werden soll |
    | `plugin-sdk/media-mime` | Schmale MIME-Normalisierung, Zuordnung von Dateierweiterungen, MIME-Erkennung und Hilfsfunktionen für Medienarten |
    | `plugin-sdk/media-store` | Schmale Hilfsfunktionen für den Medienspeicher wie `saveMediaBuffer` und `saveMediaStream` |
    | `plugin-sdk/media-generation-runtime` | Gemeinsame Failover-Hilfsfunktionen für Mediengenerierung, Kandidatenauswahl und Meldungen zu fehlenden Modellen |
    | `plugin-sdk/media-understanding` | Provider-Typen für Medienverständnis plus Provider-seitige Hilfsexporte für Bild, Audio und strukturierte Extraktion |
    | `plugin-sdk/text-chunking` | Hilfsfunktionen für Text- und Markdown-Aufteilung und -Rendering, Markdown-Tabellenkonvertierung, Entfernen von Direktiven-Tags und Safe-Text-Utilities |
    | `plugin-sdk/text-chunking` | Hilfsfunktion für ausgehende Textaufteilung |
    | `plugin-sdk/speech` | Speech-Provider-Typen plus Provider-seitige Direktiven-, Registry-, Validierungs-, OpenAI-kompatible TTS-Builder- und Speech-Hilfsexporte |
    | `plugin-sdk/speech-core` | Gemeinsame Speech-Provider-Typen, Registry-, Direktiven-, Normalisierungs- und Speech-Hilfsexporte |
    | `plugin-sdk/realtime-transcription` | Provider-Typen für Echtzeit-Transkription, Registry-Hilfsfunktionen und gemeinsame WebSocket-Sitzungshilfe |
    | `plugin-sdk/realtime-bootstrap-context` | Echtzeit-Profil-Bootstrap-Hilfe für begrenzte Kontexteinspeisung von `IDENTITY.md`, `USER.md` und `SOUL.md` |
    | `plugin-sdk/realtime-voice` | Echtzeit-Voice-Provider-Typen, Registry-Hilfsfunktionen und gemeinsame Hilfsfunktionen für Echtzeit-Voice-Verhalten, einschließlich Tracking der Ausgabeaktivität |
    | `plugin-sdk/image-generation` | Bildgenerierungs-Provider-Typen plus Hilfsfunktionen für Bild-Assets/Daten-URLs und der OpenAI-kompatible Bild-Provider-Builder |
    | `plugin-sdk/image-generation-core` | Gemeinsame Bildgenerierungs-Typen, Failover-, Auth- und Registry-Hilfsfunktionen |
    | `plugin-sdk/music-generation` | Provider-/Request-/Result-Typen für Musikgenerierung |
    | `plugin-sdk/music-generation-core` | Gemeinsame Musikgenerierungs-Typen, Failover-Hilfsfunktionen, Provider-Lookup und Model-Ref-Parsing |
    | `plugin-sdk/video-generation` | Provider-/Request-/Result-Typen für Videogenerierung |
    | `plugin-sdk/video-generation-core` | Gemeinsame Videogenerierungs-Typen, Failover-Hilfsfunktionen, Provider-Lookup und Model-Ref-Parsing |
    | `plugin-sdk/transcripts` | Gemeinsame Typen für Transkript-Quell-Provider, Registry-Hilfsfunktionen, Sitzungsdeskriptoren und Äußerungsmetadaten |
    | `plugin-sdk/webhook-targets` | Webhook-Ziel-Registry und Hilfsfunktionen zur Routeninstallation |
    | `plugin-sdk/webhook-path` | Veralteter Kompatibilitätsalias; verwenden Sie `plugin-sdk/webhook-ingress` |
    | `plugin-sdk/web-media` | Gemeinsame Hilfsfunktionen zum Laden entfernter/lokaler Medien |
    | `plugin-sdk/zod` | Veralteter Kompatibilitäts-Re-Export; importieren Sie `zod` direkt aus `zod` |
    | `plugin-sdk/testing` | Repo-lokaler, veralteter Kompatibilitäts-Barrel für alte OpenClaw-Tests. Neue Repo-Tests sollten stattdessen fokussierte lokale Test-Unterpfade wie `plugin-sdk/agent-runtime-test-contracts`, `plugin-sdk/plugin-test-runtime`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/test-env` oder `plugin-sdk/test-fixtures` importieren |
    | `plugin-sdk/plugin-test-api` | Repo-lokale minimale `createTestPluginApi`-Hilfsfunktion für Unit-Tests direkter Plugin-Registrierung ohne Import von Repo-Test-Helper-Bridges |
    | `plugin-sdk/agent-runtime-test-contracts` | Repo-lokale native Contract-Fixtures für Agent-Runtime-Adapter für Auth-, Delivery-, Fallback-, Tool-Hook-, Prompt-Overlay-, Schema- und Transkriptionsprojektions-Tests |
    | `plugin-sdk/channel-test-helpers` | Repo-lokale kanalorientierte Test-Hilfsfunktionen für generische Aktionen/Setup/Status-Contracts, Verzeichnis-Assertions, Lebenszyklus des Account-Starts, Send-Config-Threading, Runtime-Mocks, Statusprobleme, ausgehende Zustellung und Hook-Registrierung |
    | `plugin-sdk/channel-target-testing` | Repo-lokale gemeinsame Suite für Fehlerfälle der Zielauflösung in Kanaltests |
    | `plugin-sdk/plugin-test-contracts` | Repo-lokale Contract-Hilfsfunktionen für Plugin-Paket, Registrierung, öffentliche Artefakte, direkten Import, Runtime-API und Import-Side-Effects |
    | `plugin-sdk/provider-test-contracts` | Repo-lokale Contract-Hilfsfunktionen für Provider-Runtime, Auth, Discovery, Onboard, Katalog, Wizard, Medienfähigkeit, Replay-Policy, Echtzeit-STT-Live-Audio, Websuche/-Abruf und Stream |
    | `plugin-sdk/provider-http-test-mocks` | Repo-lokale optionale Vitest-HTTP/Auth-Mocks für Provider-Tests, die `plugin-sdk/provider-http` ausführen |
    | `plugin-sdk/test-fixtures` | Repo-lokale generische Fixtures für CLI-Runtime-Erfassung, Sandbox-Kontext, Skill-Writer, Agent-Message, System-Event, Modul-Reload, gebündelten Plugin-Pfad, Terminal-Text, Chunking, Auth-Token und typisierte Fälle |
    | `plugin-sdk/test-node-mocks` | Repo-lokale fokussierte Mock-Hilfsfunktionen für integrierte Node-Module zur Verwendung in Vitest-`vi.mock("node:*")`-Factories |
  </Accordion>

  <Accordion title="Memory-Unterpfade">
    | Unterpfad | Wichtige Exporte |
    | --- | --- |
    | `plugin-sdk/memory-core` | Gebündelte memory-core-Hilfsoberfläche für Manager-/Config-/Datei-/CLI-Hilfsfunktionen |
    | `plugin-sdk/memory-core-engine-runtime` | Runtime-Fassade für Speicherindex/-suche |
    | `plugin-sdk/memory-core-host-embedding-registry` | Leichtgewichtige Registry-Hilfsfunktionen für Memory-Embedding-Provider |
    | `plugin-sdk/memory-core-host-engine-foundation` | Exporte der Memory-Host-Foundation-Engine |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Memory-Host-Embedding-Contracts, Registry-Zugriff, lokaler Provider und generische Batch-/Remote-Hilfsfunktionen. `registerMemoryEmbeddingProvider` auf dieser Oberfläche ist veraltet; verwenden Sie für neue Provider die generische Embedding-Provider-API. |
    | `plugin-sdk/memory-core-host-engine-qmd` | Exporte der Memory-Host-QMD-Engine |
    | `plugin-sdk/memory-core-host-engine-storage` | Exporte der Memory-Host-Storage-Engine |
    | `plugin-sdk/memory-core-host-multimodal` | Multimodale Memory-Host-Hilfsfunktionen |
    | `plugin-sdk/memory-core-host-query` | Memory-Host-Query-Hilfsfunktionen |
    | `plugin-sdk/memory-core-host-secret` | Memory-Host-Secret-Hilfsfunktionen |
    | `plugin-sdk/memory-core-host-events` | Veralteter Kompatibilitätsalias; verwenden Sie `plugin-sdk/memory-host-events` |
    | `plugin-sdk/memory-core-host-status` | Memory-Host-Status-Hilfsfunktionen |
    | `plugin-sdk/memory-core-host-runtime-cli` | Memory-Host-CLI-Runtime-Hilfsfunktionen |
    | `plugin-sdk/memory-core-host-runtime-core` | Memory-Host-Core-Runtime-Hilfsfunktionen |
    | `plugin-sdk/memory-core-host-runtime-files` | Memory-Host-Datei-/Runtime-Hilfsfunktionen |
    | `plugin-sdk/memory-host-core` | Anbieterneutraler Alias für Memory-Host-Core-Runtime-Hilfsfunktionen |
    | `plugin-sdk/memory-host-events` | Anbieterneutraler Alias für Memory-Host-Event-Journal-Hilfsfunktionen |
    | `plugin-sdk/memory-host-files` | Veralteter Kompatibilitätsalias; verwenden Sie `plugin-sdk/memory-core-host-runtime-files` |
    | `plugin-sdk/memory-host-markdown` | Gemeinsame Managed-Markdown-Hilfsfunktionen für Memory-nahe Plugins |
    | `plugin-sdk/memory-host-search` | Active Memory-Runtime-Fassade für Zugriff auf den Such-Manager |
    | `plugin-sdk/memory-host-status` | Veralteter Kompatibilitätsalias; verwenden Sie `plugin-sdk/memory-core-host-status` |
  </Accordion>

  <Accordion title="Reservierte gebündelte Hilfs-Unterpfade">
    Reservierte gebündelte Hilfs-SDK-Unterpfade sind schmale owner-spezifische Oberflächen für
    gebündelten Plugin-Code. Sie werden im SDK-Inventar nachverfolgt, damit Paket-
    Builds und Aliasing deterministisch bleiben, sie sind jedoch keine allgemeinen APIs
    für die Plugin-Erstellung. Neue wiederverwendbare Host-Contracts sollten generische SDK-Unterpfade
    wie `plugin-sdk/gateway-runtime`, `plugin-sdk/security-runtime` und
    `plugin-sdk/plugin-config-runtime` verwenden.

    | Unterpfad | Owner und Zweck |
    | --- | --- |
    | `plugin-sdk/codex-mcp-projection` | Gebündelte Codex-Plugin-Hilfsfunktion zum Projizieren der Benutzer-MCP-Serverkonfiguration in die Codex-App-Server-Thread-Konfiguration |
    | `plugin-sdk/codex-native-task-runtime` | Gebündelte Codex-Plugin-Hilfsfunktion zum Spiegeln nativer Codex-App-Server-Subagents in den OpenClaw-Aufgabenstatus |

  </Accordion>
</AccordionGroup>

## Verwandt

- [Plugin-SDK-Übersicht](/de/plugins/sdk-overview)
- [Plugin-SDK-Einrichtung](/de/plugins/sdk-setup)
- [Plugins erstellen](/de/plugins/building-plugins)
