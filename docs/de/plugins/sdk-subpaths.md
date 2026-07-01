---
read_when:
    - Den richtigen plugin-sdk-Unterpfad für einen Plugin-Import auswählen
    - Gebündelte Plugin-Unterpfade und Hilfsoberflächen auditieren
summary: 'Plugin-SDK-Unterpfadkatalog: welche Importe wo liegen, nach Bereich gruppiert'
title: Plugin-SDK-Unterpfade
x-i18n:
    generated_at: "2026-07-01T20:16:03Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d67ec0c9d837fa23a80abe46e5bab981e82e6c7a29cfbf84ff47a9eca5cc582f
    source_path: plugins/sdk-subpaths.md
    workflow: 16
---

Das Plugin SDK wird als Satz enger öffentlicher Unterpfade unter
`openclaw/plugin-sdk/` bereitgestellt. Diese Seite katalogisiert die häufig verwendeten Unterpfade, gruppiert nach
Zweck. Das generierte Inventar der Compiler-Einstiegspunkte befindet sich in
`scripts/lib/plugin-sdk-entrypoints.json`; Paketexporte sind die öffentliche Teilmenge
nach Abzug der repo-lokalen Test-/internen Unterpfade, die in
`scripts/lib/plugin-sdk-private-local-only-subpaths.json` aufgeführt sind. Maintainer können
die Anzahl der öffentlichen Exporte mit `pnpm plugin-sdk:surface` und aktive reservierte
Hilfsunterpfade mit `pnpm plugins:boundary-report:summary` prüfen; ungenutzte reservierte
Hilfsexporte lassen den CI-Bericht fehlschlagen, statt als ruhende Kompatibilitätsschulden
im öffentlichen SDK zu verbleiben.

Den Leitfaden zum Erstellen von Plugins finden Sie unter [Plugin SDK-Übersicht](/de/plugins/sdk-overview).

## Plugin-Einstieg

| Unterpfad                      | Wichtige Exporte                                                                                                                                                       |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/plugin-entry`      | `definePluginEntry`                                                                                                                                                    |
| `plugin-sdk/core`              | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema`, `buildJsonChannelConfigSchema` |
| `plugin-sdk/config-schema`     | `OpenClawSchema`                                                                                                                                                       |
| `plugin-sdk/provider-entry`    | `defineSingleProviderPluginEntry`                                                                                                                                      |
| `plugin-sdk/migration`         | Hilfsfunktionen für Migration-Provider-Elemente wie `createMigrationItem`, Reason-Konstanten, Elementstatusmarker, Redaktionshilfen und `summarizeMigrationItems`       |
| `plugin-sdk/migration-runtime` | Runtime-Migrationshilfen wie `copyMigrationFileItem`, `withCachedMigrationConfigRuntime` und `writeMigrationReport`                                                    |
| `plugin-sdk/health`            | Registrierung, Erkennung, Reparatur, Auswahl, Schweregrad und Befundtypen für Doctor-Health-Checks für gebündelte Health-Consumer                                     |

### Veraltete Kompatibilitäts- und Testhilfen

Veraltete Unterpfade bleiben für ältere Plugins exportiert, aber neuer Code sollte die
fokussierten SDK-Unterpfade unten verwenden. Die gepflegte Liste ist
`scripts/lib/plugin-sdk-deprecated-public-subpaths.json`; CI lehnt gebündelte
Produktionsimporte daraus ab. Breite Barrel-Exporte wie `compat`, `config-types`,
`infra-runtime`, `text-runtime` und `zod` dienen nur der Kompatibilität. Importieren Sie `zod`
direkt aus `zod`.

Die Vitest-gestützten Testhilfsunterpfade von OpenClaw sind nur repo-lokal und sind
keine Paketexporte mehr: `agent-runtime-test-contracts`,
`channel-contract-testing`, `channel-target-testing`, `channel-test-helpers`,
`plugin-test-api`, `plugin-test-contracts`, `plugin-test-runtime`,
`provider-http-test-mocks`, `provider-test-contracts`, `test-env`,
`test-fixtures`, `test-node-mocks` und `testing`.

### Reservierte Hilfsunterpfade für gebündelte Plugins

Diese Unterpfade sind plugin-eigene Kompatibilitätsoberflächen für ihr jeweils besitzendes gebündeltes
Plugin, keine allgemeinen SDK-APIs: `plugin-sdk/codex-mcp-projection` und
`plugin-sdk/codex-native-task-runtime`. Erweiterungsimporte über Owner-Grenzen hinweg werden
durch Paketvertrags-Leitplanken blockiert.

<AccordionGroup>
  <Accordion title="Channel-Unterpfade">
    | Unterpfad | Wichtige Exporte |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | Zod-Schema-Export für das Root-`openclaw.json` (`OpenClawSchema`) |
    | `plugin-sdk/json-schema-runtime` | Zwischengespeicherte JSON-Schema-Validierungshilfe für Plugin-eigene Schemas |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard` sowie `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | Gemeinsame Setup-Assistent-Hilfen, Setup-Übersetzer, Allowlist-Eingabeaufforderungen, Setup-Status-Builder |
    | `plugin-sdk/setup-runtime` | `createSetupTranslator`, `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | Veralteter Kompatibilitätsalias; verwenden Sie `plugin-sdk/setup-runtime` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | Hilfen für Mehrkonten-Konfiguration/Aktions-Gates, Hilfen für Default-Account-Fallback |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, Hilfen zur Normalisierung von Account-IDs |
    | `plugin-sdk/account-resolution` | Account-Suche und Hilfen für Default-Fallback |
    | `plugin-sdk/account-helpers` | Enge Hilfen für Account-Listen/Account-Aktionen |
    | `plugin-sdk/access-groups` | Hilfen zum Parsen von Access-Group-Allowlists und für geschwärzte Gruppendiagnosen |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | Veraltete Kompatibilitätsfassade. Verwenden Sie `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
    | `plugin-sdk/channel-config-schema` | Gemeinsame Primitive für Channel-Konfigurationsschemas sowie Zod- und direkte JSON/TypeBox-Builder |
    | `plugin-sdk/bundled-channel-config-schema` | Gebündelte OpenClaw-Channel-Konfigurationsschemas nur für gepflegte gebündelte Plugins |
    | `plugin-sdk/chat-channel-ids` | `BUNDLED_CHAT_CHANNEL_IDS`, `BUNDLED_CHAT_CHANNEL_ENVELOPE_PREFIXES`, `ChatChannelId`. Kanonische gebündelte/offizielle Chat-Channel-IDs sowie Formatierer-Labels/Aliasse für Plugins, die Envelope-präfixierten Text erkennen müssen, ohne eine eigene Tabelle fest zu codieren. |
    | `plugin-sdk/channel-config-schema-legacy` | Veralteter Kompatibilitätsalias für gebündelte Channel-Konfigurationsschemas |
    | `plugin-sdk/telegram-command-config` | Hilfen zur Normalisierung/Validierung benutzerdefinierter Telegram-Befehle mit Fallback für gebündelte Verträge |
    | `plugin-sdk/command-gating` | Enge Hilfen für Befehlsautorisierungs-Gates |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-ingress` | Veraltete Low-Level-Kompatibilitätsfassade für Channel-Eingang. Neue Empfangspfade sollten `plugin-sdk/channel-ingress-runtime` verwenden. |
    | `plugin-sdk/channel-ingress-runtime` | Experimenteller High-Level-Laufzeit-Resolver für Channel-Eingang und Builder für Routenfakten für migrierte Channel-Empfangspfade. Bevorzugen Sie dies gegenüber dem Zusammenbauen effektiver Allowlists, Befehls-Allowlists und Legacy-Projektionen in jedem Plugin. Siehe [Channel-Eingangs-API](/de/plugins/sdk-channel-ingress). |
    | `plugin-sdk/channel-lifecycle` | Veraltete Kompatibilitätsfassade. Verwenden Sie `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-outbound` | Nachrichtenlebenszyklus-Verträge sowie Optionen für Antwort-Pipeline, Empfangsbestätigungen, Live-Vorschau/Streaming, Lebenszyklus-Hilfen, ausgehende Identität, Payload-Planung, dauerhafte Sendevorgänge und Hilfen für den Kontext beim Senden von Nachrichten. Siehe [Channel-Ausgangs-API](/de/plugins/sdk-channel-outbound). |
    | `plugin-sdk/channel-message` | Veralteter Kompatibilitätsalias für `plugin-sdk/channel-outbound` sowie Legacy-Fassaden für Antwort-Dispatch. |
    | `plugin-sdk/channel-message-runtime` | Veralteter Kompatibilitätsalias für `plugin-sdk/channel-outbound` sowie Legacy-Fassaden für Antwort-Dispatch. |
    | `plugin-sdk/inbound-envelope` | Gemeinsame Hilfen für eingehende Routen und Envelope-Builder |
    | `plugin-sdk/inbound-reply-dispatch` | Veraltete Kompatibilitätsfassade. Verwenden Sie `plugin-sdk/channel-inbound` für eingehende Runner und Dispatch-Prädikate sowie `plugin-sdk/channel-outbound` für Hilfen zur Nachrichtenzustellung. |
    | `plugin-sdk/messaging-targets` | Veralteter Alias für Zielparsing; verwenden Sie `plugin-sdk/channel-targets` |
    | `plugin-sdk/outbound-media` | Gemeinsame Hilfen zum Laden ausgehender Medien und für den Zustand gehosteter Medien |
    | `plugin-sdk/outbound-send-deps` | Veraltete Kompatibilitätsfassade. Verwenden Sie `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/outbound-runtime` | Veraltete Kompatibilitätsfassade. Verwenden Sie `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/poll-runtime` | Enge Hilfen zur Poll-Normalisierung |
    | `plugin-sdk/thread-bindings-runtime` | Lebenszyklus- und Adapterhilfen für Thread-Bindings |
    | `plugin-sdk/agent-media-payload` | Legacy-Builder für Agent-Medien-Payloads |
    | `plugin-sdk/conversation-runtime` | Hilfen für Konversations-/Thread-Bindings, Pairing und konfigurierte Bindings |
    | `plugin-sdk/runtime-config-snapshot` | Hilfe für Laufzeit-Konfigurations-Snapshots |
    | `plugin-sdk/runtime-group-policy` | Hilfen zur Auflösung von Laufzeit-Gruppenrichtlinien |
    | `plugin-sdk/channel-status` | Gemeinsame Hilfen für Channel-Status-Snapshots/-Zusammenfassungen |
    | `plugin-sdk/channel-config-primitives` | Enge Primitive für Channel-Konfigurationsschemas |
    | `plugin-sdk/channel-config-writes` | Hilfen zur Autorisierung von Schreibvorgängen an Channel-Konfigurationen |
    | `plugin-sdk/channel-plugin-common` | Gemeinsame Prelude-Exporte für Channel-Plugins |
    | `plugin-sdk/allowlist-config-edit` | Hilfen zum Bearbeiten/Lesen von Allowlist-Konfigurationen |
    | `plugin-sdk/group-access` | Gemeinsame Hilfen für Entscheidungen zum Gruppenzugriff |
    | `plugin-sdk/direct-dm`, `plugin-sdk/direct-dm-access` | Veraltete Kompatibilitätsfassaden. Verwenden Sie `plugin-sdk/channel-inbound`. |
    | `plugin-sdk/direct-dm-guard-policy` | Enge Hilfen für Direct-DM-Guard-Richtlinien vor Krypto |
    | `plugin-sdk/discord` | Veraltete Discord-Kompatibilitätsfassade für veröffentlichtes `@openclaw/discord@2026.3.13` und nachverfolgte Owner-Kompatibilität; neue Plugins sollten generische Channel-SDK-Unterpfade verwenden |
    | `plugin-sdk/telegram-account` | Veraltete Telegram-Kompatibilitätsfassade für Account-Auflösung zur nachverfolgten Owner-Kompatibilität; neue Plugins sollten injizierte Laufzeithilfen oder generische Channel-SDK-Unterpfade verwenden |
    | `plugin-sdk/zalouser` | Veraltete Zalo-Personal-Kompatibilitätsfassade für veröffentlichte Lark/Zalo-Pakete, die noch Befehlsautorisierung für Absender importieren; neue Plugins sollten `plugin-sdk/command-auth` verwenden |
    | `plugin-sdk/interactive-runtime` | Semantische Nachrichtenpräsentation, Zustellung und Legacy-Hilfen für interaktive Antworten. Siehe [Nachrichtenpräsentation](/de/plugins/message-presentation) |
    | `plugin-sdk/channel-inbound` | Gemeinsame Hilfen für Ereignisklassifizierung, Kontextaufbau, Formatierung, Roots, Debounce, Mention-Abgleich, Mention-Richtlinien und eingehende Protokollierung |
    | `plugin-sdk/channel-inbound-debounce` | Enge Hilfen für eingehendes Debounce |
    | `plugin-sdk/channel-mention-gating` | Enge Hilfen für Mention-Richtlinien, Mention-Markierungen und Mention-Text ohne die breitere eingehende Laufzeitoberfläche |
    | `plugin-sdk/channel-envelope`, `plugin-sdk/channel-inbound-roots`, `plugin-sdk/channel-location`, `plugin-sdk/channel-logging` | Veraltete Kompatibilitätsfassaden. Verwenden Sie `plugin-sdk/channel-inbound` oder `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-pairing-paths` | Veraltete Kompatibilitätsfassade. Verwenden Sie `plugin-sdk/channel-pairing`. |
    | `plugin-sdk/channel-reply-options-runtime` | Veraltete Kompatibilitätsfassade. Verwenden Sie `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-streaming` | Veraltete Kompatibilitätsfassade. Verwenden Sie `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-send-result` | Typen für Antwortergebnisse |
    | `plugin-sdk/channel-actions` | Hilfen für Channel-Nachrichtenaktionen sowie veraltete native Schemahilfen, die für Plugin-Kompatibilität beibehalten werden |
    | `plugin-sdk/channel-route` | Gemeinsame Hilfen für Routennormalisierung, parsergestützte Zielauflösung, Thread-ID-Stringifizierung, Deduplizierungs-/Kompakt-Routenschlüssel, geparste Zieltypen und Routen-/Zielvergleich |
    | `plugin-sdk/channel-targets` | Hilfen zum Parsen von Zielen; Aufrufer für Routenvergleiche sollten `plugin-sdk/channel-route` verwenden |
    | `plugin-sdk/channel-contract` | Typen für Channel-Verträge |
    | `plugin-sdk/channel-feedback` | Feedback-/Reaktionsverdrahtung |
    | `plugin-sdk/channel-secret-runtime` | Enge Hilfen für Secret-Verträge wie `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment` und Secret-Zieltypen |
  </Accordion>

Veraltete Channel-Hilfsfamilien bleiben nur für die Kompatibilität mit
veröffentlichten Plugins verfügbar. Der Entfernungsplan lautet: während des
Migrationsfensters für externe Plugins beibehalten, Repo-/gebündelte Plugins
auf `channel-inbound` und `channel-outbound` halten und anschließend die
Kompatibilitäts-Unterpfade bei der nächsten größeren SDK-Bereinigung entfernen.
Dies gilt für die alten Familien für Channel-Nachrichten/-Laufzeit,
Channel-Streaming, Direct-DM-Zugriff, Abspaltungen eingehender Hilfen,
Antwortoptionen und Pairing-Pfade.

  <Accordion title="Provider-Unterpfade">
    | Unterpfad | Wichtige Exporte |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/lmstudio` | Unterstützte LM Studio-Provider-Fassade für Einrichtung, Katalogermittlung und Laufzeitvorbereitung von Modellen |
    | `plugin-sdk/lmstudio-runtime` | Unterstützte LM Studio-Laufzeitfassade für lokale Serverstandardwerte, Modellerkennung, Request-Header und Hilfsfunktionen für geladene Modelle |
    | `plugin-sdk/provider-setup` | Kuratierte Hilfsfunktionen für die Einrichtung lokaler/selbst gehosteter Provider |
    | `plugin-sdk/self-hosted-provider-setup` | Fokussierte Hilfsfunktionen für die Einrichtung OpenAI-kompatibler selbst gehosteter Provider |
    | `plugin-sdk/cli-backend` | CLI-Backend-Standardwerte + Watchdog-Konstanten |
    | `plugin-sdk/provider-auth-runtime` | Laufzeit-Hilfsfunktionen zur API-Schlüssel-Auflösung für Provider-Plugins |
    | `plugin-sdk/provider-oauth-runtime` | Generische Provider-OAuth-Callback-Typen, Callback-Seiten-Rendering, PKCE/State-Hilfsfunktionen, Parsing von Autorisierungseingaben, Hilfsfunktionen für Token-Ablauf und Abbruch-Hilfsfunktionen |
    | `plugin-sdk/provider-auth-api-key` | Hilfsfunktionen für API-Schlüssel-Onboarding und Profilschreibvorgänge, z. B. `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | Standardmäßiger OAuth-Auth-Result-Builder |
    | `plugin-sdk/provider-env-vars` | Hilfsfunktionen zum Nachschlagen von Provider-Auth-Umgebungsvariablen |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials`, Hilfsfunktionen für den OpenAI Codex-Auth-Import, veralteter Kompatibilitätsexport `resolveOpenClawAgentDir` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, gemeinsame Replay-Policy-Builder, Hilfsfunktionen für Provider-Endpunkte und gemeinsame Hilfsfunktionen zur Normalisierung von Modell-IDs |
    | `plugin-sdk/provider-catalog-live-runtime` | Hilfsfunktionen für Live-Provider-Modellkataloge zur abgesicherten `/models`-artigen Ermittlung: `buildLiveModelProviderConfig`, `fetchLiveProviderModelRows`, `getCachedLiveProviderModelRows`, `fetchLiveProviderModelIds`, `LiveModelCatalogHttpError`, `clearLiveCatalogCacheForTests`, Modell-ID-Filterung, TTL-Cache und statischer Fallback |
    | `plugin-sdk/provider-catalog-runtime` | Laufzeit-Hook zur Provider-Katalogerweiterung und Plugin-Provider-Registry-Seams für Vertragstests |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | Generische Hilfsfunktionen für Provider-HTTP/Endpunkt-Fähigkeiten, Provider-HTTP-Fehler und Multipart-Form-Hilfsfunktionen für Audiotranskription |
    | `plugin-sdk/provider-web-fetch-contract` | Schmale Hilfsfunktionen für Web-Fetch-Konfiguration/-Auswahlverträge, z. B. `enablePluginInConfig` und `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | Hilfsfunktionen für Web-Fetch-Provider-Registrierung/-Cache |
    | `plugin-sdk/provider-web-search-config-contract` | Schmale Hilfsfunktionen für Web-Search-Konfiguration/-Anmeldedaten für Provider, die keine Plugin-Aktivierungsverdrahtung benötigen |
    | `plugin-sdk/provider-web-search-contract` | Schmale Hilfsfunktionen für Web-Search-Konfiguration/-Anmeldedatenverträge, z. B. `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` sowie bereichsgebundene Setter/Getter für Anmeldedaten |
    | `plugin-sdk/provider-web-search` | Hilfsfunktionen für Web-Search-Provider-Registrierung/-Cache/-Laufzeit |
    | `plugin-sdk/embedding-providers` | Allgemeine Embedding-Provider-Typen und Lese-Hilfsfunktionen, einschließlich `EmbeddingProviderAdapter`, `getEmbeddingProvider(...)` und `listEmbeddingProviders(...)`; Plugins registrieren Provider über `api.registerEmbeddingProvider(...)`, sodass Manifest-Ownership erzwungen wird |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks` und DeepSeek/Gemini/OpenAI-Schema-Bereinigung + Diagnose |
    | `plugin-sdk/provider-usage` | Provider-Nutzungssnapshot-Typen, gemeinsame Hilfsfunktionen zum Abrufen von Nutzung und Provider-Fetcher wie `fetchClaudeUsage` |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, Stream-Wrapper-Typen, Plain-Text-Tool-Call-Kompatibilität und gemeinsame Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot-Wrapper-Hilfsfunktionen |
    | `plugin-sdk/provider-stream-shared` | Öffentliche gemeinsame Provider-Stream-Wrapper-Hilfsfunktionen, einschließlich `composeProviderStreamWrappers`, `createOpenAICompatibleCompletionsThinkingOffWrapper`, `createPlainTextToolCallCompatWrapper`, `createPayloadPatchStreamWrapper`, `createToolStreamWrapper`, `normalizeOpenAICompatibleReasoningPayload`, `setQwenChatTemplateThinking` und Anthropic/DeepSeek/OpenAI-kompatible Stream-Dienstprogramme |
    | `plugin-sdk/provider-transport-runtime` | Hilfsfunktionen für nativen Provider-Transport, z. B. abgesichertes Fetching, Textextraktion aus Tool-Ergebnissen, Transportnachrichten-Transformationen und beschreibbare Transportereignis-Streams |
    | `plugin-sdk/provider-onboard` | Hilfsfunktionen für Onboarding-Konfigurationspatches |
    | `plugin-sdk/global-singleton` | Prozesslokale Singleton-/Map-/Cache-Hilfsfunktionen |
    | `plugin-sdk/group-activation` | Schmale Hilfsfunktionen für Gruppenaktivierungsmodus und Befehlsparsing |
  </Accordion>

Provider-Nutzungssnapshots melden normalerweise ein oder mehrere Kontingent-`windows`, jeweils mit
einem Label, genutztem Prozentanteil und optionaler Zurücksetzungszeit. Provider, die statt
zurücksetzbarer Kontingentfenster Saldo- oder Kontostatus-Text bereitstellen, sollten
`summary` mit einem leeren `windows`-Array zurückgeben, statt Prozentwerte zu erfinden.
OpenClaw zeigt diesen Zusammenfassungstext in der Statusausgabe an; verwenden Sie `error` nur, wenn der
Nutzungsendpunkt fehlgeschlagen ist oder keine nutzbaren Nutzungsdaten zurückgegeben hat.

  <Accordion title="Auth- und Sicherheitsunterpfade">
    | Unterpfad | Wichtige Exporte |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, Befehlsregistrierungs-Hilfsfunktionen einschließlich dynamischer Argumentmenüformatierung, Hilfsfunktionen für Senderautorisierung |
    | `plugin-sdk/command-status` | Builder für Befehls-/Hilfenachrichten, z. B. `buildCommandsMessagePaginated` und `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | Hilfsfunktionen für Genehmigerauflösung und Aktions-Auth im selben Chat |
    | `plugin-sdk/approval-client-runtime` | Hilfsfunktionen für native Exec-Genehmigungsprofile/-Filter |
    | `plugin-sdk/approval-delivery-runtime` | Adapter für native Genehmigungsfähigkeit/-Zustellung |
    | `plugin-sdk/approval-gateway-runtime` | Gemeinsame Hilfsfunktion zur Approval-Gateway-Auflösung |
    | `plugin-sdk/approval-handler-adapter-runtime` | Leichtgewichtige Hilfsfunktionen zum Laden nativer Genehmigungsadapter für heiße Kanal-Einstiegspunkte |
    | `plugin-sdk/approval-handler-runtime` | Breitere Laufzeit-Hilfsfunktionen für Genehmigungshandler; bevorzugen Sie die schmaleren Adapter-/Gateway-Seams, wenn sie ausreichen |
    | `plugin-sdk/approval-native-runtime` | Hilfsfunktionen für natives Genehmigungsziel, Konto-Bindung, Routen-Gate, Weiterleitungs-Fallback und Unterdrückung lokaler nativer Exec-Prompts |
    | `plugin-sdk/approval-reaction-runtime` | Fest codierte Genehmigungsreaktions-Bindings, Reaktionsprompt-Payloads, Reaktionsziel-Stores und Kompatibilitätsexport für die Unterdrückung lokaler nativer Exec-Prompts |
    | `plugin-sdk/approval-reply-runtime` | Hilfsfunktionen für Exec-/Plugin-Genehmigungsantwort-Payloads |
    | `plugin-sdk/approval-runtime` | Hilfsfunktionen für Exec-/Plugin-Genehmigungs-Payloads, native Genehmigungsrouting-/-Laufzeit-Hilfsfunktionen und strukturierte Genehmigungsanzeige-Hilfsfunktionen wie `formatApprovalDisplayPath` |
    | `plugin-sdk/reply-dedupe` | Schmale Hilfsfunktionen zum Zurücksetzen der Deduplizierung eingehender Antworten |
    | `plugin-sdk/channel-contract-testing` | Schmale Hilfsfunktionen für Kanalvertragstests ohne das breite Testing-Barrel |
    | `plugin-sdk/command-auth-native` | Native Befehls-Auth, dynamische Argumentmenüformatierung und native Hilfsfunktionen für Sitzungsziele |
    | `plugin-sdk/command-detection` | Gemeinsame Hilfsfunktionen zur Befehlserkennung |
    | `plugin-sdk/command-primitives-runtime` | Leichtgewichtige Befehlstext-Prädikate für heiße Kanalpfade |
    | `plugin-sdk/command-surface` | Hilfsfunktionen für Befehlsrumpf-Normalisierung und Befehlsoberfläche |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/provider-auth-login-flow-runtime` | Lazy Hilfsfunktionen für Provider-Auth-Anmeldeflüsse für private Kanäle und Web-UI-Gerätecode-Kopplung |
    | `plugin-sdk/channel-secret-runtime` | Schmale Hilfsfunktionen zur Secret-Contract-Erfassung für Kanal-/Plugin-Secret-Oberflächen |
    | `plugin-sdk/secret-ref-runtime` | Schmale `coerceSecretRef`- und SecretRef-Typing-Hilfsfunktionen für Secret-Contract-/Konfigurationsparsing |
    | `plugin-sdk/secret-provider-integration` | Type-only SecretRef-Provider-Integrationsmanifest und Preset-Verträge für Plugins, die externe Secret-Provider-Presets veröffentlichen |
    | `plugin-sdk/security-runtime` | Gemeinsame Hilfsfunktionen für Vertrauen, DM-Gating, root-begrenzte Dateien/Pfade, einschließlich create-only-Schreibvorgänge, synchroner/asynchroner atomarer Dateiersetzung, temporärer Schreibvorgänge in Geschwisterpfade, Fallback für geräteübergreifendes Verschieben, privater Datei-Store-Hilfsfunktionen, Symlink-Parent-Guards, externer Inhalte, Schwärzung sensibler Texte, Secret-Vergleich in konstanter Zeit und Secret-Sammlung |
    | `plugin-sdk/ssrf-policy` | Hilfsfunktionen für Host-Allowlist und Private-Network-SSRF-Richtlinien |
    | `plugin-sdk/ssrf-dispatcher` | Schmale Hilfsfunktionen für pinned Dispatcher ohne die breite Infra-Laufzeitoberfläche |
    | `plugin-sdk/ssrf-runtime` | Hilfsfunktionen für pinned Dispatcher, SSRF-geschütztes Fetching, SSRF-Fehler und SSRF-Richtlinien |
    | `plugin-sdk/secret-input` | Hilfsfunktionen zum Parsen von Secret-Eingaben |
    | `plugin-sdk/webhook-ingress` | Hilfsfunktionen für Webhook-Request/-Ziel und Raw-WebSocket-/Body-Koerzierung |
    | `plugin-sdk/webhook-request-guards` | Hilfsfunktionen für Request-Body-Größe/-Timeout |
  </Accordion>

  <Accordion title="Runtime- und Speicher-Unterpfade">
    | Unterpfad | Wichtige Exporte |
    | --- | --- |
    | `plugin-sdk/runtime` | Breite Hilfsfunktionen für Runtime, Protokollierung, Backup und Plugin-Installation |
    | `plugin-sdk/runtime-env` | Schlanke Hilfsfunktionen für Runtime-Umgebung, Logger, Timeout, Retry und Backoff |
    | `plugin-sdk/browser-config` | Unterstützte Browser-Konfigurationsfassade für normalisierte Profile/Defaults, CDP-URL-Parsing und Hilfsfunktionen für Browser-Control-Auth |
    | `plugin-sdk/agent-harness-task-runtime` | Generische Hilfsfunktionen für Task-Lebenszyklus und Abschlusszustellung für harness-gestützte Agents mit einem vom Host ausgegebenen Task-Scope |
    | `plugin-sdk/codex-mcp-projection` | Reservierte gebündelte Codex-Hilfsfunktion zum Projizieren der MCP-Serverkonfiguration des Benutzers in die Codex-Thread-Konfiguration; nicht für Drittanbieter-Plugins |
    | `plugin-sdk/codex-native-task-runtime` | Private gebündelte Codex-Hilfsfunktion für natives Task-Mirror-/Runtime-Wiring; nicht für Drittanbieter-Plugins |
    | `plugin-sdk/channel-runtime-context` | Generische Hilfsfunktionen für Registrierung und Lookup des Channel-Runtime-Context |
    | `plugin-sdk/matrix` | Veraltete Matrix-Kompatibilitätsfassade für ältere Drittanbieter-Channel-Pakete; neue Plugins sollten `plugin-sdk/run-command` direkt importieren |
    | `plugin-sdk/mattermost` | Veraltete Mattermost-Kompatibilitätsfassade für ältere Drittanbieter-Channel-Pakete; neue Plugins sollten generische SDK-Unterpfade direkt importieren |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Gemeinsame Hilfsfunktionen für Plugin-Commands, Hooks, HTTP und Interaktivität |
    | `plugin-sdk/hook-runtime` | Gemeinsame Hilfsfunktionen für Webhook-/interne Hook-Pipelines |
    | `plugin-sdk/lazy-runtime` | Hilfsfunktionen für Lazy-Runtime-Importe/-Bindings wie `createLazyRuntimeModule`, `createLazyRuntimeMethod` und `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | Hilfsfunktionen für Prozessausführung |
    | `plugin-sdk/cli-runtime` | Hilfsfunktionen für CLI-Formatierung, Warten, Version, Argument-Aufruf und Lazy-Command-Gruppen |
    | `plugin-sdk/qa-live-transport-scenarios` | Gemeinsame Live-Transport-QA-Szenario-IDs, Hilfsfunktionen für Baseline-Abdeckung und Szenarioauswahl |
    | `plugin-sdk/gateway-method-runtime` | Reservierte Hilfsfunktion für Gateway-Methoden-Dispatch für Plugin-HTTP-Routen, die `contracts.gatewayMethodDispatch: ["authenticated-request"]` deklarieren |
    | `plugin-sdk/gateway-runtime` | Gateway-Client, Hilfsfunktion zum Starten eines event-loop-bereiten Clients, Gateway-CLI-RPC, Gateway-Protokollfehler, Auflösung beworbener LAN-Hosts und Hilfsfunktionen für Channel-Status-Patches |
    | `plugin-sdk/config-contracts` | Fokussierte reine Typ-Konfigurationsoberfläche für Plugin-Konfigurationsformen wie `OpenClawConfig` und Channel-/Provider-Konfigurationstypen |
    | `plugin-sdk/plugin-config-runtime` | Runtime-Hilfsfunktionen für Plugin-Konfigurations-Lookups wie `requireRuntimeConfig`, `resolvePluginConfigObject` und `resolveLivePluginConfigObject` |
    | `plugin-sdk/config-mutation` | Transaktionale Hilfsfunktionen für Konfigurationsmutationen wie `mutateConfigFile`, `replaceConfigFile` und `logConfigUpdated` |
    | `plugin-sdk/message-tool-delivery-hints` | Gemeinsame Hinweiszeichenfolgen für Metadaten zur Message-Tool-Zustellung |
    | `plugin-sdk/runtime-config-snapshot` | Hilfsfunktionen für den aktuellen Prozess-Konfigurationssnapshot wie `getRuntimeConfig`, `getRuntimeConfigSnapshot` und Test-Snapshot-Setter |
    | `plugin-sdk/telegram-command-config` | Normalisierung von Telegram-Command-Namen/-Beschreibungen und Duplikat-/Konfliktprüfungen, selbst wenn die gebündelte Telegram-Vertragsoberfläche nicht verfügbar ist |
    | `plugin-sdk/text-autolink-runtime` | Erkennung von Datei-Referenz-Autolinks ohne das breite Text-Barrel |
    | `plugin-sdk/approval-reaction-runtime` | Fest codierte Approval-Reaction-Bindings, Reaction-Prompt-Payloads, Reaction-Target-Stores und Kompatibilitätsexport für lokale native Exec-Prompt-Unterdrückung |
    | `plugin-sdk/approval-runtime` | Hilfsfunktionen für Exec-/Plugin-Genehmigungen, Approval-Capability-Builder, Auth-/Profil-Hilfsfunktionen, native Routing-/Runtime-Hilfsfunktionen und strukturierte Formatierung von Approval-Anzeigepfaden |
    | `plugin-sdk/reply-runtime` | Gemeinsame Runtime-Hilfsfunktionen für Inbound/Reply, Chunking, Dispatch, Heartbeat, Reply-Planner |
    | `plugin-sdk/reply-dispatch-runtime` | Schlanke Hilfsfunktionen für Reply-Dispatch/-Finalize und Conversation-Labels |
    | `plugin-sdk/reply-history` | Gemeinsame Hilfsfunktionen für kurze Reply-History-Fenster. Neuer Message-Turn-Code sollte `createChannelHistoryWindow` verwenden; Low-Level-Map-Hilfsfunktionen bleiben nur veraltete Kompatibilitätsexporte |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | Schlanke Hilfsfunktionen für Text-/Markdown-Chunking |
    | `plugin-sdk/session-store-runtime` | Hilfsfunktionen für Session-Workflows (`getSessionEntry`, `listSessionEntries`, `patchSessionEntry`, `upsertSessionEntry`), begrenzte Lesevorgänge für aktuelle Benutzer-/Assistant-Transkripttexte nach Session-Identität, Hilfsfunktionen für Legacy-Session-Store-Pfade/-Session-Keys, Updated-at-Lesevorgänge und nur für Übergänge gedachte Kompatibilitäts-Hilfsfunktionen für Whole-Store/Dateipfade |
    | `plugin-sdk/session-transcript-runtime` | Transkriptidentität, bereichsbezogene Hilfsfunktionen für Ziel/Lesen/Schreiben, Update-Veröffentlichung, Schreibsperren und Transkript-Memory-Hit-Keys |
    | `plugin-sdk/sqlite-runtime` | Fokussierte Hilfsfunktionen für SQLite-Agent-Schema, Pfade und Transaktionen für First-Party-Runtime |
    | `plugin-sdk/cron-store-runtime` | Hilfsfunktionen für Cron-Store-Pfade/Laden/Speichern |
    | `plugin-sdk/state-paths` | Hilfsfunktionen für State-/OAuth-Verzeichnispfade |
    | `plugin-sdk/plugin-state-runtime` | SQLite-Keyed-State-Typen für Plugin-Sidecars plus zentralisierte Einrichtung von Connection-Pragmas und WAL-Wartung für Plugin-eigene Datenbanken |
    | `plugin-sdk/routing` | Hilfsfunktionen für Routen-/Session-Key-/Account-Bindings wie `resolveAgentRoute`, `buildAgentSessionKey` und `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | Gemeinsame Hilfsfunktionen für Channel-/Account-Statuszusammenfassungen, Runtime-State-Defaults und Issue-Metadaten |
    | `plugin-sdk/target-resolver-runtime` | Gemeinsame Hilfsfunktionen für Target-Resolver |
    | `plugin-sdk/string-normalization-runtime` | Hilfsfunktionen für Slug-/String-Normalisierung |
    | `plugin-sdk/request-url` | String-URLs aus fetch-/request-ähnlichen Eingaben extrahieren |
    | `plugin-sdk/run-command` | Zeitgesteuerter Command-Runner mit normalisierten stdout-/stderr-Ergebnissen |
    | `plugin-sdk/param-readers` | Gemeinsame Param-Reader für Tool/CLI |
    | `plugin-sdk/tool-plugin` | Ein einfaches typisiertes Agent-Tool-Plugin definieren und statische Metadaten für die Manifestgenerierung bereitstellen |
    | `plugin-sdk/tool-payload` | Normalisierte Payloads aus Tool-Ergebnisobjekten extrahieren |
    | `plugin-sdk/tool-send` | Kanonische Send-Zielfelder aus Tool-Argumenten extrahieren |
    | `plugin-sdk/sandbox` | Sandbox-Backend-Typen und SSH-/OpenShell-Command-Hilfsfunktionen, einschließlich Fail-Fast-Preflight für Exec-Commands |
    | `plugin-sdk/temp-path` | Gemeinsame Hilfsfunktionen für temporäre Download-Pfade und private sichere temporäre Arbeitsbereiche |
    | `plugin-sdk/logging-core` | Subsystem-Logger und Redaction-Hilfsfunktionen |
    | `plugin-sdk/markdown-table-runtime` | Hilfsfunktionen für Markdown-Tabellenmodus und -Konvertierung |
    | `plugin-sdk/model-session-runtime` | Hilfsfunktionen für Modell-/Session-Overrides wie `applyModelOverrideToSessionEntry` und `resolveAgentMaxConcurrent` |
    | `plugin-sdk/talk-config-runtime` | Hilfsfunktionen für Talk-Provider-Konfigurationsauflösung |
    | `plugin-sdk/json-store` | Kleine Hilfsfunktionen zum Lesen/Schreiben von JSON-State |
    | `plugin-sdk/json-unsafe-integers` | JSON-Parsing-Hilfsfunktionen, die unsichere Integer-Literale als Strings erhalten |
    | `plugin-sdk/file-lock` | Reentrante File-Lock-Hilfsfunktionen |
    | `plugin-sdk/persistent-dedupe` | Hilfsfunktionen für datenträgergestützten Dedupe-Cache |
    | `plugin-sdk/acp-runtime` | Hilfsfunktionen für ACP-Runtime/-Session und Reply-Dispatch |
    | `plugin-sdk/acp-runtime-backend` | Leichtgewichtige Hilfsfunktionen für ACP-Backend-Registrierung und Reply-Dispatch für beim Start geladene Plugins |
    | `plugin-sdk/acp-binding-resolve-runtime` | Schreibgeschützte ACP-Binding-Auflösung ohne Lifecycle-Startup-Importe |
    | `plugin-sdk/agent-config-primitives` | Schlanke Primitive für Agent-Runtime-Konfigurationsschema |
    | `plugin-sdk/boolean-param` | Lockerer Boolean-Param-Reader |
    | `plugin-sdk/dangerous-name-runtime` | Hilfsfunktionen für Dangerous-Name-Matching-Auflösung |
    | `plugin-sdk/device-bootstrap` | Hilfsfunktionen für Geräte-Bootstrap und Pairing-Token |
    | `plugin-sdk/extension-shared` | Gemeinsame Primitive für Passive-Channel, Status und Ambient-Proxy-Hilfsfunktionen |
    | `plugin-sdk/models-provider-runtime` | Hilfsfunktionen für `/models`-Command-/Provider-Replies |
    | `plugin-sdk/skill-commands-runtime` | Hilfsfunktionen zum Auflisten von Skill-Commands |
    | `plugin-sdk/native-command-registry` | Hilfsfunktionen zum Registrieren, Erstellen und Serialisieren nativer Commands |
    | `plugin-sdk/agent-harness` | Experimentelle Trusted-Plugin-Oberfläche für Low-Level-Agent-Harnesses: Harness-Typen, Hilfsfunktionen für Active-Run-Steer/Abort, OpenClaw-Tool-Bridge-Hilfsfunktionen, Runtime-Plan-Tool-Policy-Hilfsfunktionen, Klassifizierung terminaler Ergebnisse, Hilfsfunktionen für Tool-Progress-Formatierung/-Details und Attempt-Result-Utilities |
    | `plugin-sdk/provider-zai-endpoint` | Veraltete Provider-eigene Z.AI-Endpunkt-Erkennungsfassade; verwenden Sie die öffentliche API des Z.AI-Plugins |
    | `plugin-sdk/async-lock-runtime` | Prozesslokale Async-Lock-Hilfsfunktion für kleine Runtime-State-Dateien |
    | `plugin-sdk/channel-activity-runtime` | Hilfsfunktion für Channel-Activity-Telemetrie |
    | `plugin-sdk/concurrency-runtime` | Hilfsfunktion für begrenzte Parallelität asynchroner Tasks |
    | `plugin-sdk/dedupe-runtime` | Hilfsfunktionen für In-Memory-Dedupe-Cache |
    | `plugin-sdk/delivery-queue-runtime` | Hilfsfunktion zum Leeren ausstehender ausgehender Zustellungen |
    | `plugin-sdk/file-access-runtime` | Hilfsfunktionen für sichere lokale Datei- und Medienquellenpfade |
    | `plugin-sdk/heartbeat-runtime` | Hilfsfunktionen für Heartbeat-Wake, -Event und -Sichtbarkeit |
    | `plugin-sdk/number-runtime` | Hilfsfunktion für numerische Koerzierung |
    | `plugin-sdk/secure-random-runtime` | Hilfsfunktionen für sichere Token/UUIDs |
    | `plugin-sdk/system-event-runtime` | Hilfsfunktionen für System-Event-Queues |
    | `plugin-sdk/transport-ready-runtime` | Hilfsfunktion zum Warten auf Transportbereitschaft |
    | `plugin-sdk/exec-approvals-runtime` | Hilfsfunktionen für Exec-Approval-Policy-Dateien ohne das breite Infra-Runtime-Barrel |
    | `plugin-sdk/infra-runtime` | Veralteter Kompatibilitäts-Shim; verwenden Sie die fokussierten Runtime-Unterpfade oben |
    | `plugin-sdk/collection-runtime` | Kleine Hilfsfunktionen für begrenzte Caches |
    | `plugin-sdk/diagnostic-runtime` | Hilfsfunktionen für Diagnose-Flags, Events und Trace-Context |
    | `plugin-sdk/error-runtime` | Hilfsfunktionen für Fehlergraph, Formatierung, gemeinsame Fehlerklassifizierung, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | Gekapseltes Fetch, Proxy, EnvHttpProxyAgent-Option und Hilfsfunktionen für gepinnte Lookups |
    | `plugin-sdk/runtime-fetch` | Dispatcher-bewusstes Runtime-Fetch ohne Proxy-/Guarded-Fetch-Importe |
    | `plugin-sdk/inline-image-data-url-runtime` | Sanitizer für Inline-Bild-Daten-URLs und Hilfsfunktionen für Signatur-Sniffing ohne die breite Media-Runtime-Oberfläche |
    | `plugin-sdk/response-limit-runtime` | Begrenzter Response-Body-Reader ohne die breite Media-Runtime-Oberfläche |
    | `plugin-sdk/session-binding-runtime` | Aktueller Conversation-Binding-State ohne konfigurierte Binding-Routing- oder Pairing-Stores |
    | `plugin-sdk/session-store-runtime` | Hilfsfunktionen für Session-Store ohne breite Konfigurationsschreib-/Wartungsimporte |
    | `plugin-sdk/sqlite-runtime` | Fokussierte Hilfsfunktionen für SQLite-Agent-Schema, Pfade und Transaktionen ohne Datenbank-Lifecycle-Steuerungen |
    | `plugin-sdk/context-visibility-runtime` | Auflösung der Context-Sichtbarkeit und ergänzende Context-Filterung ohne breite Konfigurations-/Security-Importe |
    | `plugin-sdk/string-coerce-runtime` | Schlanke Hilfsfunktionen für primitive Record-/String-Koerzierung und -Normalisierung ohne Markdown-/Logging-Importe |
    | `plugin-sdk/host-runtime` | Hilfsfunktionen für Hostnamen- und SCP-Host-Normalisierung |
    | `plugin-sdk/retry-runtime` | Hilfsfunktionen für Retry-Konfiguration und Retry-Runner |
    | `plugin-sdk/agent-runtime` | Hilfsfunktionen für Agent-Verzeichnis, -Identität und -Arbeitsbereich, einschließlich `resolveAgentDir`, `resolveDefaultAgentDir` und veraltetem Kompatibilitätsexport `resolveOpenClawAgentDir` |
    | `plugin-sdk/directory-runtime` | Konfigurationsgestützte Verzeichnisabfrage/-Deduplizierung |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Capability- und Test-Unterpfade">
    | Unterpfad | Wichtige Exporte |
    | --- | --- |
    | `plugin-sdk/media-runtime` | Gemeinsame Hilfsfunktionen zum Abrufen/Transformieren/Speichern von Medien, einschließlich `saveRemoteMedia`, `saveResponseMedia`, `readRemoteMediaBuffer` und veraltetem `fetchRemoteMedia`; bevorzugen Sie Speicher-Hilfsfunktionen vor Buffer-Lesezugriffen, wenn eine URL zu OpenClaw-Medien werden soll |
    | `plugin-sdk/media-mime` | Schmale MIME-Normalisierung, Dateierweiterungszuordnung, MIME-Erkennung und Hilfsfunktionen für Medienarten |
    | `plugin-sdk/media-store` | Schmale Media-Store-Hilfsfunktionen wie `saveMediaBuffer` und `saveMediaStream` |
    | `plugin-sdk/media-generation-runtime` | Gemeinsame Hilfsfunktionen für Mediengenerierungs-Failover, Kandidatenauswahl und Meldungen bei fehlendem Modell |
    | `plugin-sdk/media-understanding` | Provider-Typen für Medienverständnis sowie Provider-seitige Hilfsexporte für Bild/Audio/strukturierte Extraktion |
    | `plugin-sdk/text-chunking` | Hilfsfunktionen für Text- und Markdown-Aufteilung/Rendering, Markdown-Tabellenkonvertierung, Entfernen von Direktiven-Tags und Safe-Text-Dienstprogramme |
    | `plugin-sdk/text-chunking` | Hilfsfunktion für ausgehende Textaufteilung |
    | `plugin-sdk/speech` | Speech-Provider-Typen sowie Provider-seitige Exporte für Direktiven, Registry, Validierung, OpenAI-kompatiblen TTS-Builder und Speech-Hilfsfunktionen |
    | `plugin-sdk/speech-core` | Gemeinsame Speech-Provider-Typen, Registry-, Direktiven-, Normalisierungs- und Speech-Hilfsexporte |
    | `plugin-sdk/realtime-transcription` | Provider-Typen für Echtzeit-Transkription, Registry-Hilfsfunktionen und gemeinsame WebSocket-Sitzungshilfe |
    | `plugin-sdk/realtime-bootstrap-context` | Echtzeit-Profil-Bootstrap-Hilfsfunktion für begrenzte Kontexteinfügung von `IDENTITY.md`, `USER.md` und `SOUL.md` |
    | `plugin-sdk/realtime-voice` | Realtime-Voice-Provider-Typen, Registry-Hilfsfunktionen und gemeinsame Hilfsfunktionen für Realtime-Voice-Verhalten, einschließlich Nachverfolgung der Ausgabeaktivität |
    | `plugin-sdk/image-generation` | Bildgenerierungs-Provider-Typen sowie Hilfsfunktionen für Bild-Assets/Data-URLs und der OpenAI-kompatible Bild-Provider-Builder |
    | `plugin-sdk/image-generation-core` | Gemeinsame Bildgenerierungs-Typen, Failover-, Auth- und Registry-Hilfsfunktionen |
    | `plugin-sdk/music-generation` | Provider-/Request-/Result-Typen für Musikgenerierung |
    | `plugin-sdk/music-generation-core` | Gemeinsame Musikgenerierungs-Typen, Failover-Hilfsfunktionen, Provider-Suche und Modellreferenz-Parsing |
    | `plugin-sdk/video-generation` | Provider-/Request-/Result-Typen für Videogenerierung |
    | `plugin-sdk/video-generation-core` | Gemeinsame Videogenerierungs-Typen, Failover-Hilfsfunktionen, Provider-Suche und Modellreferenz-Parsing |
    | `plugin-sdk/transcripts` | Gemeinsame Provider-Typen für Transkriptquellen, Registry-Hilfsfunktionen, Sitzungsdeskriptoren und Äußerungsmetadaten |
    | `plugin-sdk/webhook-targets` | Webhook-Ziel-Registry und Hilfsfunktionen zur Routeninstallation |
    | `plugin-sdk/webhook-path` | Veralteter Kompatibilitätsalias; verwenden Sie `plugin-sdk/webhook-ingress` |
    | `plugin-sdk/web-media` | Gemeinsame Hilfsfunktionen zum Laden von Remote-/lokalen Medien |
    | `plugin-sdk/zod` | Veralteter Kompatibilitäts-Reexport; importieren Sie `zod` direkt aus `zod` |
    | `plugin-sdk/testing` | Repo-lokales veraltetes Kompatibilitäts-Barrel für Legacy-OpenClaw-Tests. Neue Repo-Tests sollten stattdessen fokussierte lokale Test-Unterpfade wie `plugin-sdk/agent-runtime-test-contracts`, `plugin-sdk/plugin-test-runtime`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/test-env` oder `plugin-sdk/test-fixtures` importieren |
    | `plugin-sdk/plugin-test-api` | Repo-lokale minimale `createTestPluginApi`-Hilfsfunktion für direkte Unit-Tests zur Plugin-Registrierung ohne Import von Repo-Test-Helper-Bridges |
    | `plugin-sdk/agent-runtime-test-contracts` | Repo-lokale native Contract-Fixtures für Agent-Runtime-Adapter für Auth-, Delivery-, Fallback-, Tool-Hook-, Prompt-Overlay-, Schema- und Transkriptionsprojektions-Tests |
    | `plugin-sdk/channel-test-helpers` | Repo-lokale kanalorientierte Test-Hilfsfunktionen für generische Action-/Setup-/Status-Contracts, Verzeichnis-Assertions, Konto-Startlebenszyklus, Send-Config-Threading, Runtime-Mocks, Statusprobleme, ausgehende Zustellung und Hook-Registrierung |
    | `plugin-sdk/channel-target-testing` | Repo-lokale gemeinsame Fehlerfall-Suite für Zielauflösung in Channel-Tests |
    | `plugin-sdk/plugin-test-contracts` | Repo-lokale Hilfsfunktionen für Plugin-Paket-, Registrierungs-, Public-Artifact-, Direct-Import-, Runtime-API- und Import-Side-Effect-Contracts |
    | `plugin-sdk/provider-test-contracts` | Repo-lokale Hilfsfunktionen für Provider-Runtime-, Auth-, Discovery-, Onboard-, Catalog-, Wizard-, Medien-Capability-, Replay-Policy-, Realtime-STT-Live-Audio-, Web-Search/Fetch- und Stream-Contracts |
    | `plugin-sdk/provider-http-test-mocks` | Repo-lokale optionale Vitest-HTTP-/Auth-Mocks für Provider-Tests, die `plugin-sdk/provider-http` ausüben |
    | `plugin-sdk/test-fixtures` | Repo-lokale generische Fixtures für CLI-Runtime-Erfassung, Sandbox-Kontext, Skill-Writer, Agent-Message, System-Event, Modul-Reload, gebündelten Plugin-Pfad, Terminal-Text, Chunking, Auth-Token und typisierte Cases |
    | `plugin-sdk/test-node-mocks` | Repo-lokale fokussierte Mock-Hilfsfunktionen für eingebaute Node-Module zur Verwendung in Vitest-`vi.mock("node:*")`-Factories |
  </Accordion>

  <Accordion title="Memory-Unterpfade">
    | Unterpfad | Wichtige Exporte |
    | --- | --- |
    | `plugin-sdk/memory-core` | Gebündelte memory-core-Hilfsoberfläche für Manager-/Config-/Datei-/CLI-Hilfsfunktionen |
    | `plugin-sdk/memory-core-engine-runtime` | Memory-Index-/Search-Runtime-Fassade |
    | `plugin-sdk/memory-core-host-embedding-registry` | Schlanke Registry-Hilfsfunktionen für Memory-Embedding-Provider |
    | `plugin-sdk/memory-core-host-engine-foundation` | Exporte der Memory-Host-Foundation-Engine |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Memory-Host-Embedding-Contracts, Registry-Zugriff, lokaler Provider und generische Batch-/Remote-Hilfsfunktionen. `registerMemoryEmbeddingProvider` auf dieser Oberfläche ist veraltet; verwenden Sie für neue Provider die generische Embedding-Provider-API. |
    | `plugin-sdk/memory-core-host-engine-qmd` | Exporte der Memory-Host-QMD-Engine |
    | `plugin-sdk/memory-core-host-engine-storage` | Exporte der Memory-Host-Storage-Engine |
    | `plugin-sdk/memory-core-host-multimodal` | Memory-Host-Multimodal-Hilfsfunktionen |
    | `plugin-sdk/memory-core-host-query` | Memory-Host-Query-Hilfsfunktionen |
    | `plugin-sdk/memory-core-host-secret` | Memory-Host-Secret-Hilfsfunktionen |
    | `plugin-sdk/memory-core-host-events` | Veralteter Kompatibilitätsalias; verwenden Sie `plugin-sdk/memory-host-events` |
    | `plugin-sdk/memory-core-host-status` | Memory-Host-Status-Hilfsfunktionen |
    | `plugin-sdk/memory-core-host-runtime-cli` | Memory-Host-CLI-Runtime-Hilfsfunktionen |
    | `plugin-sdk/memory-core-host-runtime-core` | Memory-Host-Core-Runtime-Hilfsfunktionen |
    | `plugin-sdk/memory-core-host-runtime-files` | Memory-Host-Datei-/Runtime-Hilfsfunktionen |
    | `plugin-sdk/memory-host-core` | Vendor-neutraler Alias für Memory-Host-Core-Runtime-Hilfsfunktionen |
    | `plugin-sdk/memory-host-events` | Vendor-neutraler Alias für Memory-Host-Event-Journal-Hilfsfunktionen |
    | `plugin-sdk/memory-host-files` | Veralteter Kompatibilitätsalias; verwenden Sie `plugin-sdk/memory-core-host-runtime-files` |
    | `plugin-sdk/memory-host-markdown` | Gemeinsame Managed-Markdown-Hilfsfunktionen für Memory-nahe Plugins |
    | `plugin-sdk/memory-host-search` | Active-Memory-Runtime-Fassade für Search-Manager-Zugriff |
    | `plugin-sdk/memory-host-status` | Veralteter Kompatibilitätsalias; verwenden Sie `plugin-sdk/memory-core-host-status` |
  </Accordion>

  <Accordion title="Reservierte gebündelte Hilfs-Unterpfade">
    Reservierte gebündelte Hilfs-SDK-Unterpfade sind schmale, owner-spezifische Oberflächen für
    gebündelten Plugin-Code. Sie werden im SDK-Inventar nachverfolgt, damit Paket-
    Builds und Aliasing deterministisch bleiben, sind aber keine allgemeinen APIs
    für das Erstellen von Plugins. Neue wiederverwendbare Host-Contracts sollten generische SDK-Unterpfade
    wie `plugin-sdk/gateway-runtime`, `plugin-sdk/security-runtime` und
    `plugin-sdk/plugin-config-runtime` verwenden.

    | Unterpfad | Owner und Zweck |
    | --- | --- |
    | `plugin-sdk/codex-mcp-projection` | Gebündelte Codex-Plugin-Hilfsfunktion zum Projizieren der Benutzer-MCP-Serverkonfiguration in die Codex-App-Server-Thread-Konfiguration |
    | `plugin-sdk/codex-native-task-runtime` | Gebündelte Codex-Plugin-Hilfsfunktion zum Spiegeln nativer Codex-App-Server-Subagents in den OpenClaw-Task-State |

  </Accordion>
</AccordionGroup>

## Zugehörige Themen

- [Plugin-SDK-Übersicht](/de/plugins/sdk-overview)
- [Plugin-SDK-Einrichtung](/de/plugins/sdk-setup)
- [Plugins erstellen](/de/plugins/building-plugins)
