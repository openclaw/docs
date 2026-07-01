---
read_when:
    - Den richtigen plugin-sdk-Unterpfad für einen Plugin-Import auswählen
    - Gebündelte Plugin-Unterpfade und Hilfsoberflächen auditieren
summary: 'Plugin-SDK-Unterpfadkatalog: welche Importe sich wo befinden, nach Bereich gruppiert'
title: Plugin-SDK-Unterpfade
x-i18n:
    generated_at: "2026-07-01T12:59:15Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 589b5581626e50ddb5056ff2aaa60a0af48b92e09c0ca5aa22e2dbf2aed736db
    source_path: plugins/sdk-subpaths.md
    workflow: 16
---

Das Plugin-SDK wird als Satz schmaler öffentlicher Unterpfade unter
`openclaw/plugin-sdk/` bereitgestellt. Diese Seite katalogisiert die häufig verwendeten Unterpfade nach
Zweck gruppiert. Das generierte Inventar der Compiler-Einstiegspunkte befindet sich in
`scripts/lib/plugin-sdk-entrypoints.json`; Paket-Exporte sind die öffentliche Teilmenge
nach Abzug der repo-lokalen Test-/internen Unterpfade, die in
`scripts/lib/plugin-sdk-private-local-only-subpaths.json` aufgeführt sind. Maintainer können
die Anzahl der öffentlichen Exporte mit `pnpm plugin-sdk:surface` und aktive reservierte
Hilfs-Unterpfade mit `pnpm plugins:boundary-report:summary` prüfen; ungenutzte reservierte
Hilfs-Exporte lassen den CI-Bericht fehlschlagen, statt als ruhende Kompatibilitätsschuld
im öffentlichen SDK zu bleiben.

Den Leitfaden für Plugin-Autoren finden Sie unter [Plugin-SDK-Übersicht](/de/plugins/sdk-overview).

## Plugin-Einstieg

| Unterpfad                      | Wichtige Exporte                                                                                                                                                       |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/plugin-entry`      | `definePluginEntry`                                                                                                                                                    |
| `plugin-sdk/core`              | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema`, `buildJsonChannelConfigSchema` |
| `plugin-sdk/config-schema`     | `OpenClawSchema`                                                                                                                                                       |
| `plugin-sdk/provider-entry`    | `defineSingleProviderPluginEntry`                                                                                                                                      |
| `plugin-sdk/migration`         | Hilfsfunktionen für Migration-Provider-Elemente wie `createMigrationItem`, Begründungskonstanten, Elementstatusmarker, Redaktionshilfen und `summarizeMigrationItems`   |
| `plugin-sdk/migration-runtime` | Runtime-Migrationshilfen wie `copyMigrationFileItem`, `withCachedMigrationConfigRuntime` und `writeMigrationReport`                                                    |
| `plugin-sdk/health`            | Registrierung, Erkennung, Reparatur, Auswahl, Schweregrad und Finding-Typen für Doctor-Health-Checks für mitgelieferte Health-Verbraucher                              |

### Veraltete Kompatibilitäts- und Testhilfen

Veraltete Unterpfade bleiben für ältere Plugins exportiert, neuer Code sollte jedoch die
fokussierten SDK-Unterpfade unten verwenden. Die gepflegte Liste ist
`scripts/lib/plugin-sdk-deprecated-public-subpaths.json`; CI lehnt mitgelieferte
Produktionsimporte daraus ab. Breite Barrels wie `compat`, `config-types`,
`infra-runtime`, `text-runtime` und `zod` dienen nur der Kompatibilität. Importieren Sie `zod`
direkt aus `zod`.

Die Vitest-gestützten Testhilfe-Unterpfade von OpenClaw sind nur repo-lokal und sind
keine Paket-Exporte mehr: `agent-runtime-test-contracts`,
`channel-contract-testing`, `channel-target-testing`, `channel-test-helpers`,
`plugin-test-api`, `plugin-test-contracts`, `plugin-test-runtime`,
`provider-http-test-mocks`, `provider-test-contracts`, `test-env`,
`test-fixtures`, `test-node-mocks` und `testing`.

### Reservierte Hilfs-Unterpfade mitgelieferter Plugins

Diese Unterpfade sind Plugin-eigene Kompatibilitätsoberflächen für ihr jeweils besitzendes mitgeliefertes
Plugin, keine allgemeinen SDK-APIs: `plugin-sdk/codex-mcp-projection` und
`plugin-sdk/codex-native-task-runtime`. Erweiterungsimporte über Besitzergrenzen hinweg werden
durch Paketvertrags-Leitplanken blockiert.

<AccordionGroup>
  <Accordion title="Kanal-Unterpfade">
    | Unterpfad | Wichtige Exporte |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | Root-`openclaw.json`-Zod-Schemaexport (`OpenClawSchema`) |
    | `plugin-sdk/json-schema-runtime` | Zwischengespeicherte JSON-Schema-Validierungshilfe für Plugin-eigene Schemas |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, plus `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | Gemeinsame Hilfsfunktionen für Einrichtungsassistenten, Einrichtungsübersetzer, Allowlist-Eingabeaufforderungen, Builder für Einrichtungsstatus |
    | `plugin-sdk/setup-runtime` | `createSetupTranslator`, `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | Veralteter Kompatibilitätsalias; verwenden Sie `plugin-sdk/setup-runtime` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | Hilfsfunktionen für Multi-Account-Konfiguration/Aktions-Gates, Hilfsfunktionen für Default-Account-Fallbacks |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, Hilfsfunktionen zur Account-ID-Normalisierung |
    | `plugin-sdk/account-resolution` | Hilfsfunktionen für Account-Suche und Default-Fallbacks |
    | `plugin-sdk/account-helpers` | Eng gefasste Hilfsfunktionen für Account-Listen/Account-Aktionen |
    | `plugin-sdk/access-groups` | Hilfsfunktionen zum Parsen von Access-Group-Allowlists und für redigierte Gruppendiagnosen |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | Veraltete Kompatibilitätsfassade. Verwenden Sie `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
    | `plugin-sdk/channel-config-schema` | Gemeinsame Primitive für Kanalkonfigurationsschemas plus Zod- und direkte JSON/TypeBox-Builder |
    | `plugin-sdk/bundled-channel-config-schema` | Gebündelte OpenClaw-Kanalkonfigurationsschemas nur für gepflegte gebündelte Plugins |
    | `plugin-sdk/chat-channel-ids` | `BUNDLED_CHAT_CHANNEL_IDS`, `BUNDLED_CHAT_CHANNEL_ENVELOPE_PREFIXES`, `ChatChannelId`. Kanonische gebündelte/offizielle Chat-Kanal-IDs plus Formatter-Labels/Aliasse für Plugins, die Umschlag-präfixierten Text erkennen müssen, ohne ihre eigene Tabelle hart zu codieren. |
    | `plugin-sdk/channel-config-schema-legacy` | Veralteter Kompatibilitätsalias für Bundled-Channel-Konfigurationsschemas |
    | `plugin-sdk/telegram-command-config` | Hilfsfunktionen zur Normalisierung/Validierung benutzerdefinierter Telegram-Befehle mit Bundled-Contract-Fallback |
    | `plugin-sdk/command-gating` | Eng gefasste Hilfsfunktionen für Befehlsautorisierungs-Gates |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-ingress` | Veraltete Low-Level-Kompatibilitätsfassade für Kanal-Eingang. Neue Empfangspfade sollten `plugin-sdk/channel-ingress-runtime` verwenden. |
    | `plugin-sdk/channel-ingress-runtime` | Experimenteller High-Level-Runtime-Resolver für Kanal-Eingang und Builder für Routenfakten für migrierte Kanal-Empfangspfade. Bevorzugen Sie dies gegenüber dem Zusammenstellen effektiver Allowlists, Befehls-Allowlists und Legacy-Projektionen in jedem Plugin. Siehe [Kanal-Eingangs-API](/de/plugins/sdk-channel-ingress). |
    | `plugin-sdk/channel-lifecycle` | Veraltete Kompatibilitätsfassade. Verwenden Sie `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-outbound` | Nachrichten-Lebenszyklusverträge plus Optionen für Antwort-Pipeline, Belege, Live-Vorschau/Streaming, Lebenszyklus-Hilfsfunktionen, ausgehende Identität, Payload-Planung, dauerhafte Sendungen und Hilfsfunktionen für Nachrichten-Sendekontexte. Siehe [Kanal-Ausgangs-API](/de/plugins/sdk-channel-outbound). |
    | `plugin-sdk/channel-message` | Veralteter Kompatibilitätsalias für `plugin-sdk/channel-outbound` plus Legacy-Fassaden für Antwort-Dispatch. |
    | `plugin-sdk/channel-message-runtime` | Veralteter Kompatibilitätsalias für `plugin-sdk/channel-outbound` plus Legacy-Fassaden für Antwort-Dispatch. |
    | `plugin-sdk/inbound-envelope` | Gemeinsame Hilfsfunktionen für eingehende Routen und Umschlag-Builder |
    | `plugin-sdk/inbound-reply-dispatch` | Veraltete Kompatibilitätsfassade. Verwenden Sie `plugin-sdk/channel-inbound` für eingehende Runner und Dispatch-Prädikate sowie `plugin-sdk/channel-outbound` für Hilfsfunktionen zur Nachrichtenzustellung. |
    | `plugin-sdk/messaging-targets` | Veralteter Alias für Ziel-Parsing; verwenden Sie `plugin-sdk/channel-targets` |
    | `plugin-sdk/outbound-media` | Gemeinsame Hilfsfunktionen zum Laden ausgehender Medien und für Hosted-Media-Status |
    | `plugin-sdk/outbound-send-deps` | Veraltete Kompatibilitätsfassade. Verwenden Sie `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/outbound-runtime` | Veraltete Kompatibilitätsfassade. Verwenden Sie `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/poll-runtime` | Eng gefasste Hilfsfunktionen zur Poll-Normalisierung |
    | `plugin-sdk/thread-bindings-runtime` | Hilfsfunktionen für Thread-Binding-Lebenszyklus und Adapter |
    | `plugin-sdk/agent-media-payload` | Legacy-Builder für Agent-Medien-Payloads |
    | `plugin-sdk/conversation-runtime` | Hilfsfunktionen für Conversation/Thread-Binding, Pairing und konfigurierte Bindings |
    | `plugin-sdk/runtime-config-snapshot` | Hilfsfunktion für Runtime-Konfigurations-Snapshots |
    | `plugin-sdk/runtime-group-policy` | Hilfsfunktionen zur Runtime-Auflösung von Gruppenrichtlinien |
    | `plugin-sdk/channel-status` | Gemeinsame Hilfsfunktionen für Kanalstatus-Snapshots/Zusammenfassungen |
    | `plugin-sdk/channel-config-primitives` | Eng gefasste Kanalkonfigurationsschema-Primitive |
    | `plugin-sdk/channel-config-writes` | Hilfsfunktionen für Autorisierung von Kanalkonfigurationsschreibvorgängen |
    | `plugin-sdk/channel-plugin-common` | Gemeinsame Prelude-Exporte für Kanal-Plugins |
    | `plugin-sdk/allowlist-config-edit` | Hilfsfunktionen zum Bearbeiten/Lesen von Allowlist-Konfigurationen |
    | `plugin-sdk/group-access` | Gemeinsame Hilfsfunktionen für Gruppen-Zugriffsentscheidungen |
    | `plugin-sdk/direct-dm`, `plugin-sdk/direct-dm-access` | Veraltete Kompatibilitätsfassaden. Verwenden Sie `plugin-sdk/channel-inbound`. |
    | `plugin-sdk/direct-dm-guard-policy` | Eng gefasste Hilfsfunktionen für Direct-DM-Guard-Richtlinien vor der Kryptografie |
    | `plugin-sdk/discord` | Veraltete Discord-Kompatibilitätsfassade für veröffentlichtes `@openclaw/discord@2026.3.13` und nachverfolgte Owner-Kompatibilität; neue Plugins sollten generische Kanal-SDK-Unterpfade verwenden |
    | `plugin-sdk/telegram-account` | Veraltete Telegram-Kompatibilitätsfassade für Account-Auflösung zur nachverfolgten Owner-Kompatibilität; neue Plugins sollten injizierte Runtime-Hilfsfunktionen oder generische Kanal-SDK-Unterpfade verwenden |
    | `plugin-sdk/zalouser` | Veraltete Kompatibilitätsfassade für Zalo Personal für veröffentlichte Lark/Zalo-Pakete, die weiterhin Sender-Befehlsautorisierung importieren; neue Plugins sollten `plugin-sdk/command-auth` verwenden |
    | `plugin-sdk/interactive-runtime` | Semantische Nachrichtendarstellung, Zustellung und Legacy-Hilfsfunktionen für interaktive Antworten. Siehe [Nachrichtendarstellung](/de/plugins/message-presentation) |
    | `plugin-sdk/channel-inbound` | Gemeinsame Hilfsfunktionen für eingehende Ereignisklassifizierung, Kontextaufbau, Formatierung, Roots, Debounce, Mention-Abgleich, Mention-Richtlinien und eingehendes Logging |
    | `plugin-sdk/channel-inbound-debounce` | Eng gefasste Hilfsfunktionen für eingehenden Debounce |
    | `plugin-sdk/channel-mention-gating` | Eng gefasste Hilfsfunktionen für Mention-Richtlinien, Mention-Marker und Mention-Text ohne die breitere eingehende Runtime-Oberfläche |
    | `plugin-sdk/channel-envelope`, `plugin-sdk/channel-inbound-roots`, `plugin-sdk/channel-location`, `plugin-sdk/channel-logging` | Veraltete Kompatibilitätsfassaden. Verwenden Sie `plugin-sdk/channel-inbound` oder `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-pairing-paths` | Veraltete Kompatibilitätsfassade. Verwenden Sie `plugin-sdk/channel-pairing`. |
    | `plugin-sdk/channel-reply-options-runtime` | Veraltete Kompatibilitätsfassade. Verwenden Sie `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-streaming` | Veraltete Kompatibilitätsfassade. Verwenden Sie `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-send-result` | Antwort-Ergebnistypen |
    | `plugin-sdk/channel-actions` | Hilfsfunktionen für Kanal-Nachrichtenaktionen plus veraltete native Schema-Hilfsfunktionen, die für Plugin-Kompatibilität beibehalten werden |
    | `plugin-sdk/channel-route` | Gemeinsame Hilfsfunktionen für Routennormalisierung, parsergesteuerte Zielauflösung, Thread-ID-Stringifizierung, Deduplizierungs-/kompakte Routenschlüssel, geparste Zieltypen und Routen-/Zielvergleiche |
    | `plugin-sdk/channel-targets` | Hilfsfunktionen für Ziel-Parsing; Aufrufer für Routenvergleiche sollten `plugin-sdk/channel-route` verwenden |
    | `plugin-sdk/channel-contract` | Kanalvertragstypen |
    | `plugin-sdk/channel-feedback` | Feedback-/Reaktionsverdrahtung |
    | `plugin-sdk/channel-secret-runtime` | Eng gefasste Secret-Contract-Hilfsfunktionen wie `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment` und Secret-Zieltypen |
  </Accordion>

Veraltete Kanal-Hilfsfamilien bleiben nur für die Kompatibilität mit
veröffentlichten Plugins verfügbar. Der Entfernungsplan lautet: sie während
des Migrationsfensters für externe Plugins beibehalten, Repo-/gebündelte
Plugins auf `channel-inbound` und `channel-outbound` halten und dann die
Kompatibilitäts-Unterpfade in der nächsten großen SDK-Bereinigung entfernen.
Dies gilt für die alten Familien für Kanalnachrichten/-Runtime, Kanal-
Streaming, Direct-DM-Zugriff, abgespaltene eingehende Hilfsfunktionen,
Antwortoptionen und Pairing-Pfade.

  <Accordion title="Provider subpaths">
    | Unterpfad | Wichtige Exporte |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/lmstudio` | Unterstützte LM Studio-Provider-Fassade für Einrichtung, Katalogermittlung und Laufzeit-Modellvorbereitung |
    | `plugin-sdk/lmstudio-runtime` | Unterstützte LM Studio-Laufzeit-Fassade für lokale Server-Standards, Modellerkennung, Request-Header und Hilfsfunktionen für geladene Modelle |
    | `plugin-sdk/provider-setup` | Kuratierte Hilfsfunktionen zur Einrichtung lokaler/selbst gehosteter Provider |
    | `plugin-sdk/self-hosted-provider-setup` | Fokussierte OpenAI-kompatible Hilfsfunktionen zur Einrichtung selbst gehosteter Provider |
    | `plugin-sdk/cli-backend` | CLI-Backend-Standards + Watchdog-Konstanten |
    | `plugin-sdk/provider-auth-runtime` | Laufzeit-Hilfsfunktionen zur API-Schlüsselauflösung für Provider-Plugins |
    | `plugin-sdk/provider-oauth-runtime` | Generische OAuth-Callback-Typen für Provider, Callback-Seiten-Rendering, PKCE/State-Hilfsfunktionen, Parsing von Autorisierungseingaben, Hilfsfunktionen zum Token-Ablauf und Abbruch-Hilfsfunktionen |
    | `plugin-sdk/provider-auth-api-key` | Hilfsfunktionen für API-Schlüssel-Onboarding und Profil-Schreibvorgänge wie `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | Standardmäßiger OAuth-Auth-Result-Builder |
    | `plugin-sdk/provider-env-vars` | Hilfsfunktionen zur Suche nach Provider-Auth-Umgebungsvariablen |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials`, OpenAI Codex Auth-Import-Hilfsfunktionen, veralteter `resolveOpenClawAgentDir`-Kompatibilitätsexport |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, gemeinsame Replay-Policy-Builder, Provider-Endpunkt-Hilfsfunktionen und gemeinsame Hilfsfunktionen zur Normalisierung von Modell-IDs |
    | `plugin-sdk/provider-catalog-live-runtime` | Live-Hilfsfunktionen für Provider-Modellkataloge zur abgesicherten Ermittlung im Stil von `/models`: `buildLiveModelProviderConfig`, `fetchLiveProviderModelRows`, `getCachedLiveProviderModelRows`, `fetchLiveProviderModelIds`, `LiveModelCatalogHttpError`, `clearLiveCatalogCacheForTests`, Modell-ID-Filterung, TTL-Cache und statischer Fallback |
    | `plugin-sdk/provider-catalog-runtime` | Laufzeit-Hook zur Provider-Katalogerweiterung und Plugin-Provider-Registry-Seams für Contract-Tests |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | Generische Hilfsfunktionen für Provider-HTTP/Endpunkt-Fähigkeiten, Provider-HTTP-Fehler und Multipart-Form-Hilfsfunktionen für Audiotranskription |
    | `plugin-sdk/provider-web-fetch-contract` | Schmale Contract-Hilfsfunktionen für Web-Fetch-Konfiguration/-Auswahl wie `enablePluginInConfig` und `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | Hilfsfunktionen für Web-Fetch-Provider-Registrierung/-Cache |
    | `plugin-sdk/provider-web-search-config-contract` | Schmale Hilfsfunktionen für Web-Search-Konfiguration/-Anmeldedaten für Provider, die keine Plugin-Aktivierungsverdrahtung benötigen |
    | `plugin-sdk/provider-web-search-contract` | Schmale Contract-Hilfsfunktionen für Web-Search-Konfiguration/-Anmeldedaten wie `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` und bereichsbezogene Setter/Getter für Anmeldedaten |
    | `plugin-sdk/provider-web-search` | Hilfsfunktionen für Web-Search-Provider-Registrierung/-Cache/-Laufzeit |
    | `plugin-sdk/embedding-providers` | Allgemeine Typen und Lese-Hilfsfunktionen für Embedding-Provider, einschließlich `EmbeddingProviderAdapter`, `getEmbeddingProvider(...)` und `listEmbeddingProviders(...)`; Plugins registrieren Provider über `api.registerEmbeddingProvider(...)`, sodass Manifest-Ownership erzwungen wird |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks` und DeepSeek/Gemini/OpenAI-Schemabereinigung + Diagnosen |
    | `plugin-sdk/provider-usage` | Snapshot-Typen für Provider-Nutzung, gemeinsame Hilfsfunktionen zum Abrufen von Nutzung und Provider-Fetcher wie `fetchClaudeUsage` |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, Stream-Wrapper-Typen, Plain-Text-Tool-Call-Kompatibilität und gemeinsame Wrapper-Hilfsfunktionen für Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
    | `plugin-sdk/provider-stream-shared` | Öffentliche gemeinsame Hilfsfunktionen für Provider-Stream-Wrapper, einschließlich `composeProviderStreamWrappers`, `createOpenAICompatibleCompletionsThinkingOffWrapper`, `createPlainTextToolCallCompatWrapper`, `createPayloadPatchStreamWrapper`, `createToolStreamWrapper`, `normalizeOpenAICompatibleReasoningPayload`, `setQwenChatTemplateThinking` und Anthropic/DeepSeek/OpenAI-kompatible Stream-Dienstprogramme |
    | `plugin-sdk/provider-transport-runtime` | Native Provider-Transport-Hilfsfunktionen wie abgesichertes Fetching, Textextraktion aus Tool-Ergebnissen, Transport-Nachrichtentransformationen und beschreibbare Transport-Event-Streams |
    | `plugin-sdk/provider-onboard` | Hilfsfunktionen für Onboarding-Konfigurations-Patches |
    | `plugin-sdk/global-singleton` | Prozesslokale Singleton-/Map-/Cache-Hilfsfunktionen |
    | `plugin-sdk/group-activation` | Schmale Hilfsfunktionen für Gruppenaktivierungsmodus und Befehlsparsing |
  </Accordion>

Snapshots zur Provider-Nutzung melden normalerweise ein oder mehrere Kontingent-`windows`, jeweils mit
einem Label, dem verwendeten Prozentanteil und einer optionalen Zurücksetzzeit. Provider, die statt zurücksetzbarer
Kontingentfenster Kontostand- oder Kontostatus-Text bereitstellen, sollten
`summary` mit einem leeren `windows`-Array zurückgeben, anstatt Prozentwerte zu fingieren.
OpenClaw zeigt diesen Zusammenfassungstext in der Statusausgabe an; verwenden Sie `error` nur, wenn der
Nutzungsendpunkt fehlgeschlagen ist oder keine verwendbaren Nutzungsdaten zurückgegeben hat.

  <Accordion title="Auth and security subpaths">
    | Unterpfad | Wichtige Exporte |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, Hilfsfunktionen für Befehls-Registry einschließlich dynamischer Argumentmenü-Formatierung, Hilfsfunktionen für Absenderautorisierung |
    | `plugin-sdk/command-status` | Builder für Befehls-/Hilfenachrichten wie `buildCommandsMessagePaginated` und `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | Hilfsfunktionen zur Genehmigerauflösung und Action-Auth im selben Chat |
    | `plugin-sdk/approval-client-runtime` | Hilfsfunktionen für native Exec-Genehmigungsprofile/-Filter |
    | `plugin-sdk/approval-delivery-runtime` | Native Adapter für Genehmigungsfähigkeiten/-Zustellung |
    | `plugin-sdk/approval-gateway-runtime` | Gemeinsame Hilfsfunktion zur Gateway-Auflösung für Genehmigungen |
    | `plugin-sdk/approval-handler-adapter-runtime` | Leichtgewichtige Hilfsfunktionen zum Laden nativer Genehmigungsadapter für Hot-Channel-Einstiegspunkte |
    | `plugin-sdk/approval-handler-runtime` | Breitere Laufzeit-Hilfsfunktionen für Genehmigungs-Handler; bevorzugen Sie die schmaleren Adapter-/Gateway-Seams, wenn sie ausreichen |
    | `plugin-sdk/approval-native-runtime` | Hilfsfunktionen für natives Genehmigungsziel, Konto-Binding, Route-Gate, Weiterleitungs-Fallback und Unterdrückung lokaler nativer Exec-Prompts |
    | `plugin-sdk/approval-reaction-runtime` | Fest codierte Bindings für Genehmigungsreaktionen, Payloads für Reaktions-Prompts, Stores für Reaktionsziele und Kompatibilitätsexport für die Unterdrückung lokaler nativer Exec-Prompts |
    | `plugin-sdk/approval-reply-runtime` | Hilfsfunktionen für Payloads von Exec-/Plugin-Genehmigungsantworten |
    | `plugin-sdk/approval-runtime` | Hilfsfunktionen für Exec-/Plugin-Genehmigungs-Payloads, native Genehmigungs-Routing-/Laufzeit-Hilfsfunktionen und strukturierte Hilfsfunktionen zur Genehmigungsanzeige wie `formatApprovalDisplayPath` |
    | `plugin-sdk/reply-dedupe` | Schmale Hilfsfunktionen zum Zurücksetzen der Deduplizierung eingehender Antworten |
    | `plugin-sdk/channel-contract-testing` | Schmale Hilfsfunktionen für Channel-Contract-Tests ohne das breite Testing-Barrel |
    | `plugin-sdk/command-auth-native` | Native Befehlsauthentifizierung, dynamische Argumentmenü-Formatierung und Hilfsfunktionen für native Sitzungsziele |
    | `plugin-sdk/command-detection` | Gemeinsame Hilfsfunktionen zur Befehlserkennung |
    | `plugin-sdk/command-primitives-runtime` | Leichtgewichtige Prädikate für Befehlstext in Hot-Channel-Pfaden |
    | `plugin-sdk/command-surface` | Hilfsfunktionen für Befehls-Body-Normalisierung und Befehlsoberflächen |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | Schmale Hilfsfunktionen zur Secret-Contract-Sammlung für Channel-/Plugin-Secret-Oberflächen |
    | `plugin-sdk/secret-ref-runtime` | Schmale `coerceSecretRef`- und SecretRef-Typing-Hilfsfunktionen für Secret-Contract-/Konfigurationsparsing |
    | `plugin-sdk/secret-provider-integration` | Reine Typ-Contracts für SecretRef-Provider-Integrationsmanifest und Presets für Plugins, die externe Secret-Provider-Presets veröffentlichen |
    | `plugin-sdk/security-runtime` | Gemeinsame Hilfsfunktionen für Vertrauen, DM-Gating, root-begrenzte Datei-/Pfadoperationen einschließlich reiner Erstellungs-Schreibvorgänge, synchroner/asynchroner atomarer Dateiersetzung, temporärer Schreibvorgänge in Geschwisterpfaden, Fallback für geräteübergreifendes Verschieben, private Dateispeicher, Symlink-Parent-Guards, externe Inhalte, Schwärzung sensibler Texte, Secret-Vergleich in konstanter Zeit und Secret-Sammlung |
    | `plugin-sdk/ssrf-policy` | Hilfsfunktionen für Host-Allowlist und SSRF-Policy für private Netzwerke |
    | `plugin-sdk/ssrf-dispatcher` | Schmale Hilfsfunktionen für angepinnte Dispatcher ohne die breite Infra-Laufzeitoberfläche |
    | `plugin-sdk/ssrf-runtime` | Angepinnter Dispatcher, SSRF-geschütztes Fetching, SSRF-Fehler und SSRF-Policy-Hilfsfunktionen |
    | `plugin-sdk/secret-input` | Hilfsfunktionen zum Parsen von Secret-Eingaben |
    | `plugin-sdk/webhook-ingress` | Webhook-Request-/Ziel-Hilfsfunktionen und Coercion von rohem WebSocket/Body |
    | `plugin-sdk/webhook-request-guards` | Hilfsfunktionen für Request-Body-Größe/-Timeout |
  </Accordion>

  <Accordion title="Laufzeit- und Speicher-Unterpfade">
    | Unterpfad | Wichtige Exporte |
    | --- | --- |
    | `plugin-sdk/runtime` | Breite Hilfsfunktionen für Laufzeit/Protokollierung/Sicherung/Plugin-Installation |
    | `plugin-sdk/runtime-env` | Schmale Hilfsfunktionen für Laufzeitumgebung, Logger, Timeout, Wiederholung und Backoff |
    | `plugin-sdk/browser-config` | Unterstützte Browser-Konfigurationsfassade für normalisierte Profile/Standardwerte, CDP-URL-Parsing und Auth-Hilfsfunktionen für Browsersteuerung |
    | `plugin-sdk/agent-harness-task-runtime` | Generische Hilfsfunktionen für Aufgabenlebenszyklus und Abschlusszustellung für Harness-gestützte Agenten mit vom Host ausgegebenem Aufgabenbereich |
    | `plugin-sdk/codex-mcp-projection` | Reservierte gebündelte Codex-Hilfsfunktion zur Projektion der Benutzer-MCP-Serverkonfiguration in die Codex-Threadkonfiguration; nicht für Drittanbieter-Plugins |
    | `plugin-sdk/codex-native-task-runtime` | Private gebündelte Codex-Hilfsfunktion für native Aufgaben-Spiegelung/Laufzeitverdrahtung; nicht für Drittanbieter-Plugins |
    | `plugin-sdk/channel-runtime-context` | Generische Hilfsfunktionen zur Registrierung und Suche des Kanal-Laufzeitkontexts |
    | `plugin-sdk/matrix` | Veraltete Matrix-Kompatibilitätsfassade für ältere Drittanbieter-Kanalpakete; neue Plugins sollten `plugin-sdk/run-command` direkt importieren |
    | `plugin-sdk/mattermost` | Veraltete Mattermost-Kompatibilitätsfassade für ältere Drittanbieter-Kanalpakete; neue Plugins sollten generische SDK-Unterpfade direkt importieren |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Gemeinsame Hilfsfunktionen für Plugin-Befehle/Hooks/HTTP/Interaktivität |
    | `plugin-sdk/hook-runtime` | Gemeinsame Hilfsfunktionen für Webhook-/interne Hook-Pipelines |
    | `plugin-sdk/lazy-runtime` | Hilfsfunktionen für verzögerte Laufzeitimporte/-Bindungen wie `createLazyRuntimeModule`, `createLazyRuntimeMethod` und `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | Hilfsfunktionen für Prozessausführung |
    | `plugin-sdk/cli-runtime` | Hilfsfunktionen für CLI-Formatierung, Warten, Version, Argumentaufruf und verzögerte Befehlsgruppen |
    | `plugin-sdk/qa-live-transport-scenarios` | Gemeinsame IDs für Live-Transport-QA-Szenarien, Hilfsfunktionen für Baseline-Abdeckung und Hilfsfunktion zur Szenarioauswahl |
    | `plugin-sdk/gateway-method-runtime` | Reservierte Gateway-Methoden-Dispatch-Hilfsfunktion für Plugin-HTTP-Routen, die `contracts.gatewayMethodDispatch: ["authenticated-request"]` deklarieren |
    | `plugin-sdk/gateway-runtime` | Gateway-Client, Hilfsfunktion zum Start eines event-loop-bereiten Clients, Gateway-CLI-RPC, Gateway-Protokollfehler, Auflösung beworbener LAN-Hosts und Hilfsfunktionen für Kanalstatus-Patches |
    | `plugin-sdk/config-contracts` | Fokussierte reine Typ-Konfigurationsoberfläche für Plugin-Konfigurationsformen wie `OpenClawConfig` und Kanal-/Provider-Konfigurationstypen |
    | `plugin-sdk/plugin-config-runtime` | Hilfsfunktionen zur Laufzeit-Plugin-Konfigurationssuche wie `requireRuntimeConfig`, `resolvePluginConfigObject` und `resolveLivePluginConfigObject` |
    | `plugin-sdk/config-mutation` | Transaktionale Hilfsfunktionen für Konfigurationsmutationen wie `mutateConfigFile`, `replaceConfigFile` und `logConfigUpdated` |
    | `plugin-sdk/message-tool-delivery-hints` | Gemeinsame Hinweiszeichenfolgen für Message-Tool-Zustellungsmetadaten |
    | `plugin-sdk/runtime-config-snapshot` | Hilfsfunktionen für aktuelle Prozesskonfigurations-Snapshots wie `getRuntimeConfig`, `getRuntimeConfigSnapshot` und Test-Snapshot-Setter |
    | `plugin-sdk/telegram-command-config` | Normalisierung von Telegram-Befehlsnamen/-beschreibungen und Prüfungen auf Duplikate/Konflikte, selbst wenn die gebündelte Telegram-Vertragsoberfläche nicht verfügbar ist |
    | `plugin-sdk/text-autolink-runtime` | Autolink-Erkennung für Dateireferenzen ohne das breite Text-Barrel |
    | `plugin-sdk/approval-reaction-runtime` | Fest codierte Approval-Reaktionsbindungen, Reaktionsprompt-Payloads, Reaktionsziel-Speicher und Kompatibilitätsexport für lokale native Exec-Prompt-Unterdrückung |
    | `plugin-sdk/approval-runtime` | Hilfsfunktionen für Exec-/Plugin-Approvals, Builder für Approval-Fähigkeiten, Auth-/Profil-Hilfsfunktionen, native Routing-/Laufzeit-Hilfsfunktionen und strukturierte Pfadformatierung für Approval-Anzeigen |
    | `plugin-sdk/reply-runtime` | Gemeinsame Hilfsfunktionen für eingehende Antworten/Antwortlaufzeit, Chunking, Dispatch, Heartbeat, Antwortplaner |
    | `plugin-sdk/reply-dispatch-runtime` | Schmale Hilfsfunktionen für Antwort-Dispatch/-Finalisierung und Konversationslabels |
    | `plugin-sdk/reply-history` | Gemeinsame Hilfsfunktionen für Antwortverlauf mit kurzem Zeitfenster. Neuer Message-Turn-Code sollte `createChannelHistoryWindow` verwenden; Low-Level-Map-Hilfsfunktionen bleiben nur veraltete Kompatibilitätsexporte |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | Schmale Hilfsfunktionen für Text-/Markdown-Chunking |
    | `plugin-sdk/session-store-runtime` | Hilfsfunktionen für Sitzungs-Workflows (`getSessionEntry`, `listSessionEntries`, `patchSessionEntry`, `upsertSessionEntry`), begrenzte aktuelle Lesezugriffe auf Benutzer-/Assistenten-Transkripttext nach Sitzungsidentität, Legacy-Hilfsfunktionen für Sitzungsspeicherpfad/Sitzungsschlüssel, Updated-at-Lesezugriffe und nur übergangsbezogene Kompatibilitäts-Hilfsfunktionen für gesamten Speicher/Dateipfad |
    | `plugin-sdk/session-transcript-runtime` | Transkriptidentität, bereichsgebundene Hilfsfunktionen für Ziel/Lesen/Schreiben, Veröffentlichungen von Aktualisierungen, Schreibsperren und Schlüssel für Transkript-Speichertreffer |
    | `plugin-sdk/sqlite-runtime` | Fokussierte Hilfsfunktionen für SQLite-Agentenschema, Pfad und Transaktionen für First-Party-Laufzeit |
    | `plugin-sdk/cron-store-runtime` | Hilfsfunktionen für Cron-Speicherpfad/Laden/Speichern |
    | `plugin-sdk/state-paths` | Hilfsfunktionen für State-/OAuth-Verzeichnispfade |
    | `plugin-sdk/plugin-state-runtime` | Typen für SQLite-Keyed-State im Plugin-Sidecar plus zentralisierte Einrichtung für Connection-Pragmas und WAL-Wartung für Plugin-eigene Datenbanken |
    | `plugin-sdk/routing` | Hilfsfunktionen für Routen-/Sitzungsschlüssel-/Kontobindungen wie `resolveAgentRoute`, `buildAgentSessionKey` und `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | Gemeinsame Hilfsfunktionen für Kanal-/Kontostatus-Zusammenfassungen, Laufzeitstatus-Standardwerte und Issue-Metadaten |
    | `plugin-sdk/target-resolver-runtime` | Gemeinsame Hilfsfunktionen für Zielauflöser |
    | `plugin-sdk/string-normalization-runtime` | Hilfsfunktionen für Slug-/Zeichenfolgen-Normalisierung |
    | `plugin-sdk/request-url` | String-URLs aus fetch-/request-ähnlichen Eingaben extrahieren |
    | `plugin-sdk/run-command` | Zeitgesteuerter Befehls-Runner mit normalisierten stdout-/stderr-Ergebnissen |
    | `plugin-sdk/param-readers` | Gemeinsame Tool-/CLI-Parameterleser |
    | `plugin-sdk/tool-plugin` | Ein einfaches typisiertes Agent-Tool-Plugin definieren und statische Metadaten für Manifestgenerierung bereitstellen |
    | `plugin-sdk/tool-payload` | Normalisierte Payloads aus Tool-Ergebnisobjekten extrahieren |
    | `plugin-sdk/tool-send` | Kanonische Sendeziel-Felder aus Tool-Argumenten extrahieren |
    | `plugin-sdk/sandbox` | Sandbox-Backendtypen und SSH-/OpenShell-Befehlshilfsfunktionen, einschließlich Fail-Fast-Exec-Befehls-Preflight |
    | `plugin-sdk/temp-path` | Gemeinsame Hilfsfunktionen für temporäre Downloadpfade und private sichere temporäre Arbeitsbereiche |
    | `plugin-sdk/logging-core` | Subsystem-Logger und Hilfsfunktionen zur Redaktion |
    | `plugin-sdk/markdown-table-runtime` | Hilfsfunktionen für Markdown-Tabellenmodus und Konvertierung |
    | `plugin-sdk/model-session-runtime` | Hilfsfunktionen für Modell-/Sitzungs-Overrides wie `applyModelOverrideToSessionEntry` und `resolveAgentMaxConcurrent` |
    | `plugin-sdk/talk-config-runtime` | Hilfsfunktionen zur Auflösung der Talk-Provider-Konfiguration |
    | `plugin-sdk/json-store` | Kleine Hilfsfunktionen zum Lesen/Schreiben von JSON-Status |
    | `plugin-sdk/json-unsafe-integers` | JSON-Parsing-Hilfsfunktionen, die unsichere Integer-Literale als Strings erhalten |
    | `plugin-sdk/file-lock` | Wiedereintrittsfähige Hilfsfunktionen für Dateisperren |
    | `plugin-sdk/persistent-dedupe` | Datenträgergestützte Hilfsfunktionen für Dedupe-Cache |
    | `plugin-sdk/acp-runtime` | Hilfsfunktionen für ACP-Laufzeit/Sitzung und Antwort-Dispatch |
    | `plugin-sdk/acp-runtime-backend` | Leichtgewichtige Hilfsfunktionen für ACP-Backend-Registrierung und Antwort-Dispatch für beim Start geladene Plugins |
    | `plugin-sdk/acp-binding-resolve-runtime` | Schreibgeschützte ACP-Bindungsauflösung ohne Lebenszyklus-Startimporte |
    | `plugin-sdk/agent-config-primitives` | Schmale Primitive für Agent-Laufzeit-Konfigurationsschemata |
    | `plugin-sdk/boolean-param` | Lockerer Boolean-Parameterleser |
    | `plugin-sdk/dangerous-name-runtime` | Hilfsfunktionen zur Auflösung gefährlicher Namensübereinstimmungen |
    | `plugin-sdk/device-bootstrap` | Hilfsfunktionen für Geräte-Bootstrap und Pairing-Token |
    | `plugin-sdk/extension-shared` | Gemeinsame Primitive für passive Kanäle, Status und Ambient-Proxy-Hilfsfunktionen |
    | `plugin-sdk/models-provider-runtime` | Hilfsfunktionen für `/models`-Befehls-/Provider-Antworten |
    | `plugin-sdk/skill-commands-runtime` | Hilfsfunktionen zum Auflisten von Skill-Befehlen |
    | `plugin-sdk/native-command-registry` | Hilfsfunktionen für native Befehlsregistrierung/-Erstellung/-Serialisierung |
    | `plugin-sdk/agent-harness` | Experimentelle Oberfläche für vertrauenswürdige Plugins für Low-Level-Agent-Harnesses: Harness-Typen, Hilfsfunktionen zum Steuern/Abbrechen aktiver Läufe, OpenClaw-Tool-Bridge-Hilfsfunktionen, Tool-Policy-Hilfsfunktionen für Laufzeitpläne, Klassifizierung terminaler Ergebnisse, Hilfsfunktionen für Tool-Fortschrittsformatierung/-Details und Ergebnis-Utilities für Versuche |
    | `plugin-sdk/provider-zai-endpoint` | Veraltete Provider-eigene Z.AI-Fassade zur Endpunkterkennung; verwenden Sie die öffentliche API des Z.AI-Plugins |
    | `plugin-sdk/async-lock-runtime` | Prozesslokale Async-Lock-Hilfsfunktion für kleine Laufzeitstatusdateien |
    | `plugin-sdk/channel-activity-runtime` | Hilfsfunktion für Kanalaktivitäts-Telemetrie |
    | `plugin-sdk/concurrency-runtime` | Hilfsfunktion für begrenzte Parallelität asynchroner Aufgaben |
    | `plugin-sdk/dedupe-runtime` | Hilfsfunktionen für In-Memory-Dedupe-Cache |
    | `plugin-sdk/delivery-queue-runtime` | Hilfsfunktion zum Leeren ausstehender ausgehender Zustellungen |
    | `plugin-sdk/file-access-runtime` | Hilfsfunktionen für sichere lokale Datei- und Medienquellenpfade |
    | `plugin-sdk/heartbeat-runtime` | Hilfsfunktionen für Heartbeat-Wecken, -Ereignisse und -Sichtbarkeit |
    | `plugin-sdk/number-runtime` | Hilfsfunktion für numerische Koerzierung |
    | `plugin-sdk/secure-random-runtime` | Hilfsfunktionen für sichere Token/UUIDs |
    | `plugin-sdk/system-event-runtime` | Hilfsfunktionen für Systemereignis-Warteschlangen |
    | `plugin-sdk/transport-ready-runtime` | Hilfsfunktion zum Warten auf Transportbereitschaft |
    | `plugin-sdk/exec-approvals-runtime` | Hilfsfunktionen für Exec-Approval-Policy-Dateien ohne das breite Infra-Runtime-Barrel |
    | `plugin-sdk/infra-runtime` | Veralteter Kompatibilitäts-Shim; verwenden Sie die fokussierten Laufzeit-Unterpfade oben |
    | `plugin-sdk/collection-runtime` | Kleine Hilfsfunktionen für begrenzte Caches |
    | `plugin-sdk/diagnostic-runtime` | Hilfsfunktionen für Diagnose-Flags, -Ereignisse und Trace-Kontext |
    | `plugin-sdk/error-runtime` | Fehlergraph, Formatierung, gemeinsame Hilfsfunktionen zur Fehlerklassifizierung, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | Gewrapptes Fetch, Proxy, EnvHttpProxyAgent-Option und Hilfsfunktionen für gepinntes Lookup |
    | `plugin-sdk/runtime-fetch` | Dispatcher-bewusstes Laufzeit-Fetch ohne Proxy-/Guarded-Fetch-Importe |
    | `plugin-sdk/inline-image-data-url-runtime` | Sanitizer für Inline-Bild-Daten-URLs und Hilfsfunktionen zum Erkennen von Signaturen ohne die breite Medien-Laufzeitoberfläche |
    | `plugin-sdk/response-limit-runtime` | Begrenzter Response-Body-Reader ohne die breite Medien-Laufzeitoberfläche |
    | `plugin-sdk/session-binding-runtime` | Aktueller Konversationsbindungsstatus ohne konfigurierte Bindungsweiterleitung oder Pairing-Speicher |
    | `plugin-sdk/session-store-runtime` | Hilfsfunktionen für Sitzungsspeicher ohne breite Konfigurationsschreib-/Wartungsimporte |
    | `plugin-sdk/sqlite-runtime` | Fokussierte Hilfsfunktionen für SQLite-Agentenschema, Pfad und Transaktionen ohne Datenbank-Lebenszykluskontrollen |
    | `plugin-sdk/context-visibility-runtime` | Auflösung der Kontextsichtbarkeit und Filterung ergänzender Kontexte ohne breite Konfigurations-/Sicherheitsimporte |
    | `plugin-sdk/string-coerce-runtime` | Schmale Hilfsfunktionen für primitive Record-/String-Koerzierung und -Normalisierung ohne Markdown-/Protokollierungsimporte |
    | `plugin-sdk/host-runtime` | Hilfsfunktionen zur Normalisierung von Hostnamen und SCP-Hosts |
    | `plugin-sdk/retry-runtime` | Hilfsfunktionen für Wiederholungskonfiguration und Wiederholungs-Runner |
    | `plugin-sdk/agent-runtime` | Hilfsfunktionen für Agent-Verzeichnis/Identität/Arbeitsbereich, einschließlich `resolveAgentDir`, `resolveDefaultAgentDir` und veraltetem Kompatibilitätsexport `resolveOpenClawAgentDir` |
    | `plugin-sdk/directory-runtime` | Konfigurationsgestützte Verzeichnisabfrage/Deduplizierung |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Capability- und Test-Unterpfade">
    | Unterpfad | Wichtige Exporte |
    | --- | --- |
    | `plugin-sdk/media-runtime` | Gemeinsame Hilfsfunktionen zum Abrufen/Transformieren/Speichern von Medien, einschließlich `saveRemoteMedia`, `saveResponseMedia`, `readRemoteMediaBuffer` und veraltetem `fetchRemoteMedia`; bevorzugen Sie Store-Hilfsfunktionen vor Buffer-Lesevorgängen, wenn aus einer URL OpenClaw-Medien werden sollen |
    | `plugin-sdk/media-mime` | Enge MIME-Normalisierung, Dateierweiterungs-Mapping, MIME-Erkennung und Hilfsfunktionen für Medienarten |
    | `plugin-sdk/media-store` | Enge Hilfsfunktionen für den Medienspeicher wie `saveMediaBuffer` und `saveMediaStream` |
    | `plugin-sdk/media-generation-runtime` | Gemeinsame Failover-Hilfsfunktionen für Mediengenerierung, Kandidatenauswahl und Meldungen bei fehlenden Modellen |
    | `plugin-sdk/media-understanding` | Provider-Typen für Medienverständnis plus Provider-seitige Hilfs-Exporte für Bild/Audio/strukturierte Extraktion |
    | `plugin-sdk/text-chunking` | Hilfsfunktionen für Text- und Markdown-Chunking/-Rendering, Markdown-Tabellenkonvertierung, Entfernen von Direktiven-Tags und Safe-Text-Dienstprogramme |
    | `plugin-sdk/text-chunking` | Hilfsfunktion für ausgehendes Text-Chunking |
    | `plugin-sdk/speech` | Speech-Provider-Typen plus Provider-seitige Exporte für Direktiven, Registry, Validierung, OpenAI-kompatiblen TTS-Builder und Speech-Hilfsfunktionen |
    | `plugin-sdk/speech-core` | Gemeinsame Speech-Provider-Typen, Registry-, Direktiven-, Normalisierungs- und Speech-Hilfs-Exporte |
    | `plugin-sdk/realtime-transcription` | Provider-Typen für Echtzeit-Transkription, Registry-Hilfsfunktionen und gemeinsame WebSocket-Sitzungshilfe |
    | `plugin-sdk/realtime-bootstrap-context` | Bootstrap-Hilfsfunktion für Echtzeitprofile zur begrenzten `IDENTITY.md`-, `USER.md`- und `SOUL.md`-Kontexteinspeisung |
    | `plugin-sdk/realtime-voice` | Provider-Typen für Echtzeit-Sprache, Registry-Hilfsfunktionen und gemeinsame Hilfsfunktionen für Echtzeit-Sprachverhalten, einschließlich Nachverfolgung der Ausgabeaktivität |
    | `plugin-sdk/image-generation` | Provider-Typen für Bildgenerierung plus Hilfsfunktionen für Bild-Assets/Daten-URLs und der OpenAI-kompatible Image-Provider-Builder |
    | `plugin-sdk/image-generation-core` | Gemeinsame Typen, Failover-, Auth- und Registry-Hilfsfunktionen für Bildgenerierung |
    | `plugin-sdk/music-generation` | Provider-/Request-/Result-Typen für Musikgenerierung |
    | `plugin-sdk/music-generation-core` | Gemeinsame Typen für Musikgenerierung, Failover-Hilfsfunktionen, Provider-Lookup und Model-Ref-Parsing |
    | `plugin-sdk/video-generation` | Provider-/Request-/Result-Typen für Videogenerierung |
    | `plugin-sdk/video-generation-core` | Gemeinsame Typen für Videogenerierung, Failover-Hilfsfunktionen, Provider-Lookup und Model-Ref-Parsing |
    | `plugin-sdk/transcripts` | Gemeinsame Provider-Typen für Transkriptquellen, Registry-Hilfsfunktionen, Sitzungsdeskriptoren und Äußerungsmetadaten |
    | `plugin-sdk/webhook-targets` | Webhook-Ziel-Registry und Hilfsfunktionen zur Routeninstallation |
    | `plugin-sdk/webhook-path` | Veralteter Kompatibilitätsalias; verwenden Sie `plugin-sdk/webhook-ingress` |
    | `plugin-sdk/web-media` | Gemeinsame Hilfsfunktionen zum Laden entfernter/lokaler Medien |
    | `plugin-sdk/zod` | Veralteter Kompatibilitäts-Re-Export; importieren Sie `zod` direkt aus `zod` |
    | `plugin-sdk/testing` | Repo-lokales veraltetes Kompatibilitäts-Barrel für ältere OpenClaw-Tests. Neue Repo-Tests sollten stattdessen fokussierte lokale Test-Unterpfade wie `plugin-sdk/agent-runtime-test-contracts`, `plugin-sdk/plugin-test-runtime`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/test-env` oder `plugin-sdk/test-fixtures` importieren |
    | `plugin-sdk/plugin-test-api` | Repo-lokale minimale `createTestPluginApi`-Hilfsfunktion für direkte Unit-Tests der Plugin-Registrierung ohne Import von Repo-Test-Helper-Bridges |
    | `plugin-sdk/agent-runtime-test-contracts` | Repo-lokale native Contract-Fixtures für Agent-Runtime-Adapter für Auth-, Delivery-, Fallback-, Tool-Hook-, Prompt-Overlay-, Schema- und Transkriptionsprojektionstests |
    | `plugin-sdk/channel-test-helpers` | Repo-lokale kanalorientierte Test-Hilfsfunktionen für generische Action-/Setup-/Status-Contracts, Verzeichnis-Assertions, Account-Startlebenszyklus, Send-Config-Threading, Runtime-Mocks, Statusprobleme, ausgehende Zustellung und Hook-Registrierung |
    | `plugin-sdk/channel-target-testing` | Repo-lokale gemeinsame Suite für Fehlerfälle der Zielauflösung in Kanaltests |
    | `plugin-sdk/plugin-test-contracts` | Repo-lokale Contract-Hilfsfunktionen für Plugin-Paket, Registrierung, öffentliches Artefakt, direkten Import, Runtime-API und Import-Nebeneffekte |
    | `plugin-sdk/provider-test-contracts` | Repo-lokale Contract-Hilfsfunktionen für Provider-Runtime, Auth, Discovery, Onboard, Katalog, Assistent, Medien-Capability, Replay-Policy, Echtzeit-STT-Live-Audio, Websuche/-Abruf und Stream |
    | `plugin-sdk/provider-http-test-mocks` | Repo-lokale optionale Vitest-HTTP-/Auth-Mocks für Provider-Tests, die `plugin-sdk/provider-http` ausüben |
    | `plugin-sdk/test-fixtures` | Repo-lokale generische Fixtures für CLI-Runtime-Erfassung, Sandbox-Kontext, Skill-Writer, Agent-Message, System-Event, Modul-Reload, gebündelten Plugin-Pfad, Terminal-Text, Chunking, Auth-Token und typisierte Fälle |
    | `plugin-sdk/test-node-mocks` | Repo-lokale fokussierte Mock-Hilfsfunktionen für integrierte Node-Module zur Verwendung innerhalb von Vitest-`vi.mock("node:*")`-Factories |
  </Accordion>

  <Accordion title="Memory-Unterpfade">
    | Unterpfad | Wichtige Exporte |
    | --- | --- |
    | `plugin-sdk/memory-core` | Gebündelte memory-core-Hilfsoberfläche für Manager-/Config-/Datei-/CLI-Hilfsfunktionen |
    | `plugin-sdk/memory-core-engine-runtime` | Memory-Index-/Such-Runtime-Fassade |
    | `plugin-sdk/memory-core-host-embedding-registry` | Leichtgewichtige Hilfsfunktionen für die Registry von Memory-Embedding-Providern |
    | `plugin-sdk/memory-core-host-engine-foundation` | Exporte der Memory-Host-Foundation-Engine |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Memory-Host-Embedding-Contracts, Registry-Zugriff, lokaler Provider und generische Batch-/Remote-Hilfsfunktionen. `registerMemoryEmbeddingProvider` auf dieser Oberfläche ist veraltet; verwenden Sie für neue Provider die generische Embedding-Provider-API. |
    | `plugin-sdk/memory-core-host-engine-qmd` | Exporte der Memory-Host-QMD-Engine |
    | `plugin-sdk/memory-core-host-engine-storage` | Exporte der Memory-Host-Storage-Engine |
    | `plugin-sdk/memory-core-host-multimodal` | Multimodale Memory-Host-Hilfsfunktionen |
    | `plugin-sdk/memory-core-host-query` | Memory-Host-Query-Hilfsfunktionen |
    | `plugin-sdk/memory-core-host-secret` | Memory-Host-Secret-Hilfsfunktionen |
    | `plugin-sdk/memory-core-host-events` | Veralteter Kompatibilitätsalias; verwenden Sie `plugin-sdk/memory-host-events` |
    | `plugin-sdk/memory-core-host-status` | Memory-Host-Status-Hilfsfunktionen |
    | `plugin-sdk/memory-core-host-runtime-cli` | CLI-Runtime-Hilfsfunktionen für den Memory-Host |
    | `plugin-sdk/memory-core-host-runtime-core` | Core-Runtime-Hilfsfunktionen für den Memory-Host |
    | `plugin-sdk/memory-core-host-runtime-files` | Datei-/Runtime-Hilfsfunktionen für den Memory-Host |
    | `plugin-sdk/memory-host-core` | Anbieterneutraler Alias für Core-Runtime-Hilfsfunktionen des Memory-Hosts |
    | `plugin-sdk/memory-host-events` | Anbieterneutraler Alias für Event-Journal-Hilfsfunktionen des Memory-Hosts |
    | `plugin-sdk/memory-host-files` | Veralteter Kompatibilitätsalias; verwenden Sie `plugin-sdk/memory-core-host-runtime-files` |
    | `plugin-sdk/memory-host-markdown` | Gemeinsame Managed-Markdown-Hilfsfunktionen für Memory-nahe Plugins |
    | `plugin-sdk/memory-host-search` | Active Memory-Runtime-Fassade für Suchmanager-Zugriff |
    | `plugin-sdk/memory-host-status` | Veralteter Kompatibilitätsalias; verwenden Sie `plugin-sdk/memory-core-host-status` |
  </Accordion>

  <Accordion title="Reservierte Unterpfade für gebündelte Hilfsfunktionen">
    Reservierte SDK-Unterpfade für gebündelte Hilfsfunktionen sind enge eigentümerspezifische Oberflächen für
    gebündelten Plugin-Code. Sie werden im SDK-Inventar nachverfolgt, damit Paket-
    Builds und Aliasing deterministisch bleiben, sind aber keine allgemeinen APIs
    für Plugin-Authoring. Neue wiederverwendbare Host-Contracts sollten generische SDK-Unterpfade
    wie `plugin-sdk/gateway-runtime`, `plugin-sdk/security-runtime` und
    `plugin-sdk/plugin-config-runtime` verwenden.

    | Unterpfad | Eigentümer und Zweck |
    | --- | --- |
    | `plugin-sdk/codex-mcp-projection` | Gebündelte Codex-Plugin-Hilfsfunktion zum Projizieren der Benutzer-MCP-Serverkonfiguration in die Codex-app-server-Thread-Konfiguration |
    | `plugin-sdk/codex-native-task-runtime` | Gebündelte Codex-Plugin-Hilfsfunktion zum Spiegeln nativer Codex-app-server-Subagents in den OpenClaw-Task-Zustand |

  </Accordion>
</AccordionGroup>

## Verwandt

- [Plugin-SDK-Übersicht](/de/plugins/sdk-overview)
- [Plugin-SDK-Einrichtung](/de/plugins/sdk-setup)
- [Plugins erstellen](/de/plugins/building-plugins)
