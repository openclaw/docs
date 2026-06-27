---
read_when:
    - Den richtigen plugin-sdk-Unterpfad für einen Plugin-Import auswählen
    - Gebündelte Plugin-Unterpfade und Hilfsoberflächen auditieren
summary: 'Plugin-SDK-Unterpfadkatalog: welche Importe wo liegen, nach Bereich gruppiert'
title: Plugin-SDK-Unterpfade
x-i18n:
    generated_at: "2026-06-27T17:59:33Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c120877dfcc2ddc17237f1ea1a6eb6daf38dcf714ae6446f59ee06e0ef0dfdcc
    source_path: plugins/sdk-subpaths.md
    workflow: 16
---

Das Plugin SDK wird als Satz schmaler öffentlicher Unterpfade unter
`openclaw/plugin-sdk/` bereitgestellt. Diese Seite katalogisiert die häufig verwendeten Unterpfade, gruppiert nach
Zweck. Das generierte Inventar der Compiler-Einstiegspunkte befindet sich in
`scripts/lib/plugin-sdk-entrypoints.json`; Package-Exports sind die öffentliche Teilmenge
nach Abzug der repo-lokalen Test-/internen Unterpfade, die in
`scripts/lib/plugin-sdk-private-local-only-subpaths.json` aufgeführt sind. Maintainer können
die Anzahl der öffentlichen Exports mit `pnpm plugin-sdk:surface` und aktive reservierte
Hilfs-Unterpfade mit `pnpm plugins:boundary-report:summary` prüfen; ungenutzte reservierte
Hilfs-Exports lassen den CI-Bericht fehlschlagen, statt als
ruhende Kompatibilitätsschuld im öffentlichen SDK zu verbleiben.

Für die Anleitung zum Erstellen von Plugins siehe [Plugin SDK-Übersicht](/de/plugins/sdk-overview).

## Plugin-Einstieg

| Unterpfad                      | Wichtige Exports                                                                                                                                                       |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/plugin-entry`      | `definePluginEntry`                                                                                                                                                    |
| `plugin-sdk/core`              | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema`, `buildJsonChannelConfigSchema` |
| `plugin-sdk/config-schema`     | `OpenClawSchema`                                                                                                                                                       |
| `plugin-sdk/provider-entry`    | `defineSingleProviderPluginEntry`                                                                                                                                      |
| `plugin-sdk/migration`         | Hilfsfunktionen für Migration-Provider-Elemente wie `createMigrationItem`, Grundkonstanten, Elementstatus-Markierungen, Schwärzungshilfen und `summarizeMigrationItems` |
| `plugin-sdk/migration-runtime` | Runtime-Migrationshilfen wie `copyMigrationFileItem`, `withCachedMigrationConfigRuntime` und `writeMigrationReport`                                                    |
| `plugin-sdk/health`            | Doctor-Health-Check-Registrierung, Erkennung, Reparatur, Auswahl, Schweregrad und Finding-Typen für gebündelte Health-Consumer                                         |

### Veraltete Kompatibilitäts- und Testhilfen

Veraltete Unterpfade bleiben für ältere Plugins exportiert, neuer Code sollte jedoch die
fokussierten SDK-Unterpfade unten verwenden. Die gepflegte Liste ist
`scripts/lib/plugin-sdk-deprecated-public-subpaths.json`; CI weist gebündelte
Produktionsimporte daraus zurück. Breite Barrels wie `compat`, `config-types`,
`infra-runtime`, `text-runtime` und `zod` dienen nur der Kompatibilität. Importieren Sie `zod`
direkt aus `zod`.

Die Vitest-gestützten Testhilfen-Unterpfade von OpenClaw sind nur repo-lokal und werden nicht
mehr als Package-Exports bereitgestellt: `agent-runtime-test-contracts`,
`channel-contract-testing`, `channel-target-testing`, `channel-test-helpers`,
`plugin-test-api`, `plugin-test-contracts`, `plugin-test-runtime`,
`provider-http-test-mocks`, `provider-test-contracts`, `test-env`,
`test-fixtures`, `test-node-mocks` und `testing`.

### Reservierte Hilfs-Unterpfade für gebündelte Plugins

Diese Unterpfade sind Plugin-eigene Kompatibilitätsoberflächen für das jeweils besitzende gebündelte
Plugin, keine allgemeinen SDK-APIs: `plugin-sdk/codex-mcp-projection` und
`plugin-sdk/codex-native-task-runtime`. Erweiterungsimporte über Owner-Grenzen hinweg werden
durch Package-Vertragsleitplanken blockiert.

<AccordionGroup>
  <Accordion title="Channel subpaths">
    | Unterpfad | Wichtige Exporte |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | Root-`openclaw.json`-Zod-Schemaexport (`OpenClawSchema`) |
    | `plugin-sdk/json-schema-runtime` | Zwischengespeicherter JSON-Schema-Validierungshelfer für Plugin-eigene Schemas |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard` sowie `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | Gemeinsame Helfer für Einrichtungsassistenten, Einrichtungsübersetzer, Allowlist-Eingabeaufforderungen, Builder für Einrichtungsstatus |
    | `plugin-sdk/setup-runtime` | `createSetupTranslator`, `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | Veralteter Kompatibilitätsalias; verwenden Sie `plugin-sdk/setup-runtime` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | Helfer für Multi-Account-Konfiguration und Action-Gates, Helfer für Default-Account-Fallbacks |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, Helfer zur Normalisierung von Account-IDs |
    | `plugin-sdk/account-resolution` | Account-Suche und Helfer für Default-Fallbacks |
    | `plugin-sdk/account-helpers` | Enge Helfer für Account-Listen und Account-Aktionen |
    | `plugin-sdk/access-groups` | Helfer zum Parsen von Access-Group-Allowlists und für redigierte Gruppendiagnosen |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | Veraltete Kompatibilitätsfassade. Verwenden Sie `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
    | `plugin-sdk/channel-config-schema` | Gemeinsame Primitive für Channel-Konfigurationsschemas sowie Zod- und direkte JSON/TypeBox-Builder |
    | `plugin-sdk/bundled-channel-config-schema` | Gebündelte OpenClaw-Channel-Konfigurationsschemas nur für gepflegte gebündelte Plugins |
    | `plugin-sdk/chat-channel-ids` | `BUNDLED_CHAT_CHANNEL_IDS`, `BUNDLED_CHAT_CHANNEL_ENVELOPE_PREFIXES`, `ChatChannelId`. Kanonische gebündelte/offizielle Chat-Channel-IDs plus Formatierungslabels/-aliase für Plugins, die Envelope-präfixierten Text erkennen müssen, ohne eine eigene Tabelle fest zu kodieren. |
    | `plugin-sdk/channel-config-schema-legacy` | Veralteter Kompatibilitätsalias für gebündelte Channel-Konfigurationsschemas |
    | `plugin-sdk/telegram-command-config` | Telegram-Helfer zur Normalisierung/Validierung benutzerdefinierter Befehle mit Fallback auf den gebündelten Vertrag |
    | `plugin-sdk/command-gating` | Enge Helfer für Befehlsautorisierungs-Gates |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-ingress` | Veraltete Low-Level-Kompatibilitätsfassade für Channel-Ingress. Neue Empfangspfade sollten `plugin-sdk/channel-ingress-runtime` verwenden. |
    | `plugin-sdk/channel-ingress-runtime` | Experimenteller High-Level-Laufzeitresolver für Channel-Ingress und Builder für Routenfakten für migrierte Channel-Empfangspfade. Bevorzugen Sie dies gegenüber dem Zusammenstellen effektiver Allowlists, Befehls-Allowlists und Legacy-Projektionen in jedem Plugin. Siehe [Channel-Ingress-API](/de/plugins/sdk-channel-ingress). |
    | `plugin-sdk/channel-lifecycle` | Veraltete Kompatibilitätsfassade. Verwenden Sie `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-outbound` | Nachrichtenlebenszyklus-Verträge sowie Optionen für Antwortpipelines, Empfangsbestätigungen, Live-Vorschau/Streaming, Lebenszyklushelfer, ausgehende Identität, Payload-Planung, dauerhafte Sendungen und Helfer für Nachrichtensende-Kontext. Siehe [Channel-Outbound-API](/de/plugins/sdk-channel-outbound). |
    | `plugin-sdk/channel-message` | Veralteter Kompatibilitätsalias für `plugin-sdk/channel-outbound` plus Legacy-Fassaden für Antwort-Dispatch. |
    | `plugin-sdk/channel-message-runtime` | Veralteter Kompatibilitätsalias für `plugin-sdk/channel-outbound` plus Legacy-Fassaden für Antwort-Dispatch. |
    | `plugin-sdk/inbound-envelope` | Gemeinsame Helfer für eingehende Routen und Envelope-Builder |
    | `plugin-sdk/inbound-reply-dispatch` | Veraltete Kompatibilitätsfassade. Verwenden Sie `plugin-sdk/channel-inbound` für eingehende Runner und Dispatch-Prädikate sowie `plugin-sdk/channel-outbound` für Helfer zur Nachrichtenzustellung. |
    | `plugin-sdk/messaging-targets` | Veralteter Alias für Zielparsing; verwenden Sie `plugin-sdk/channel-targets` |
    | `plugin-sdk/outbound-media` | Gemeinsame Helfer zum Laden ausgehender Medien und für Hosted-Media-Status |
    | `plugin-sdk/outbound-send-deps` | Veraltete Kompatibilitätsfassade. Verwenden Sie `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/outbound-runtime` | Veraltete Kompatibilitätsfassade. Verwenden Sie `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/poll-runtime` | Enge Helfer zur Umfragenormalisierung |
    | `plugin-sdk/thread-bindings-runtime` | Helfer für Thread-Binding-Lebenszyklus und Adapter |
    | `plugin-sdk/agent-media-payload` | Legacy-Builder für Agent-Medien-Payloads |
    | `plugin-sdk/conversation-runtime` | Helfer für Conversation-/Thread-Binding, Pairing und konfigurierte Bindings |
    | `plugin-sdk/runtime-config-snapshot` | Helfer für Runtime-Konfigurations-Snapshots |
    | `plugin-sdk/runtime-group-policy` | Helfer zur Auflösung von Runtime-Gruppenrichtlinien |
    | `plugin-sdk/channel-status` | Gemeinsame Helfer für Channel-Status-Snapshots/-Zusammenfassungen |
    | `plugin-sdk/channel-config-primitives` | Enge Primitive für Channel-Konfigurationsschemas |
    | `plugin-sdk/channel-config-writes` | Helfer zur Autorisierung von Channel-Konfigurationsschreibvorgängen |
    | `plugin-sdk/channel-plugin-common` | Gemeinsame Prelude-Exporte für Channel-Plugins |
    | `plugin-sdk/allowlist-config-edit` | Helfer zum Bearbeiten/Lesen von Allowlist-Konfigurationen |
    | `plugin-sdk/group-access` | Gemeinsame Helfer für Gruppen-Zugriffsentscheidungen |
    | `plugin-sdk/direct-dm`, `plugin-sdk/direct-dm-access` | Veraltete Kompatibilitätsfassaden. Verwenden Sie `plugin-sdk/channel-inbound`. |
    | `plugin-sdk/direct-dm-guard-policy` | Enge Helfer für Direct-DM-Guard-Richtlinien vor der Kryptografie |
    | `plugin-sdk/discord` | Veraltete Discord-Kompatibilitätsfassade für veröffentlichtes `@openclaw/discord@2026.3.13` und nachverfolgte Owner-Kompatibilität; neue Plugins sollten generische Channel-SDK-Unterpfade verwenden |
    | `plugin-sdk/telegram-account` | Veraltete Telegram-Kompatibilitätsfassade für Account-Auflösung zur nachverfolgten Owner-Kompatibilität; neue Plugins sollten injizierte Runtime-Helfer oder generische Channel-SDK-Unterpfade verwenden |
    | `plugin-sdk/zalouser` | Veraltete Zalo-Personal-Kompatibilitätsfassade für veröffentlichte Lark/Zalo-Pakete, die noch Sender-Befehlsautorisierung importieren; neue Plugins sollten `plugin-sdk/command-auth` verwenden |
    | `plugin-sdk/interactive-runtime` | Semantische Nachrichtenpräsentation, Zustellung und Legacy-Helfer für interaktive Antworten. Siehe [Nachrichtenpräsentation](/de/plugins/message-presentation) |
    | `plugin-sdk/channel-inbound` | Gemeinsame eingehende Helfer für Ereignisklassifizierung, Kontextaufbau, Formatierung, Roots, Debounce, Mention-Abgleich, Mention-Richtlinien und Inbound-Logging |
    | `plugin-sdk/channel-inbound-debounce` | Enge Helfer für eingehenden Debounce |
    | `plugin-sdk/channel-mention-gating` | Enge Helfer für Mention-Richtlinien, Mention-Markierungen und Mention-Text ohne die breitere Inbound-Runtime-Oberfläche |
    | `plugin-sdk/channel-envelope`, `plugin-sdk/channel-inbound-roots`, `plugin-sdk/channel-location`, `plugin-sdk/channel-logging` | Veraltete Kompatibilitätsfassaden. Verwenden Sie `plugin-sdk/channel-inbound` oder `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-pairing-paths` | Veraltete Kompatibilitätsfassade. Verwenden Sie `plugin-sdk/channel-pairing`. |
    | `plugin-sdk/channel-reply-options-runtime` | Veraltete Kompatibilitätsfassade. Verwenden Sie `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-streaming` | Veraltete Kompatibilitätsfassade. Verwenden Sie `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-send-result` | Antwort-Ergebnistypen |
    | `plugin-sdk/channel-actions` | Helfer für Channel-Nachrichtenaktionen plus veraltete native Schemahelfer, die für Plugin-Kompatibilität beibehalten werden |
    | `plugin-sdk/channel-route` | Gemeinsame Helfer für Routennormalisierung, parsergesteuerte Zielauflösung, Thread-ID-Stringifizierung, Deduplizierung/kompakte Routenschlüssel, Typen geparster Ziele und Routen-/Zielvergleiche |
    | `plugin-sdk/channel-targets` | Helfer für Zielparsing; Aufrufer für Routenvergleiche sollten `plugin-sdk/channel-route` verwenden |
    | `plugin-sdk/channel-contract` | Channel-Vertragstypen |
    | `plugin-sdk/channel-feedback` | Feedback-/Reaktionsverdrahtung |
    | `plugin-sdk/channel-secret-runtime` | Enge Helfer für Secret-Verträge wie `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment` und Secret-Zieltypen |
  </Accordion>

Veraltete Channel-Helferfamilien bleiben nur für die Kompatibilität mit
veröffentlichten Plugins verfügbar. Der Entfernungsplan lautet: sie während des
Migrationsfensters für externe Plugins beibehalten, Repo-/gebündelte Plugins auf
`channel-inbound` und `channel-outbound` halten und die Kompatibilitätsunterpfade
dann bei der nächsten größeren SDK-Bereinigung entfernen. Dies gilt für die
alten Channel-Message-/Runtime-, Channel-Streaming-, Direct-DM-Access-,
Inbound-Helfer-Splinter-, Reply-Options- und Pairing-Paths-Familien.

  <Accordion title="Provider-Unterpfade">
    | Unterpfad | Wichtige Exporte |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/lmstudio` | Unterstützte LM Studio-Provider-Fassade für Einrichtung, Katalogerkennung und Runtime-Modellvorbereitung |
    | `plugin-sdk/lmstudio-runtime` | Unterstützte LM Studio-Runtime-Fassade für lokale Server-Standards, Modellerkennung, Anfrage-Header und Hilfsfunktionen für geladene Modelle |
    | `plugin-sdk/provider-setup` | Kuratierte Hilfsfunktionen zur Einrichtung lokaler/selbst gehosteter Provider |
    | `plugin-sdk/self-hosted-provider-setup` | Fokussierte Hilfsfunktionen zur Einrichtung OpenAI-kompatibler selbst gehosteter Provider |
    | `plugin-sdk/cli-backend` | CLI-Backend-Standards + Watchdog-Konstanten |
    | `plugin-sdk/provider-auth-runtime` | Runtime-Hilfsfunktionen zur API-Schlüsselauflösung für Provider-Plugins |
    | `plugin-sdk/provider-oauth-runtime` | Generische Provider-OAuth-Callback-Typen, Callback-Seiten-Rendering, PKCE-/State-Hilfsfunktionen, Parsen von Autorisierungseingaben, Hilfsfunktionen für Token-Ablaufzeiten und Abbruch-Hilfsfunktionen |
    | `plugin-sdk/provider-auth-api-key` | Hilfsfunktionen für API-Schlüssel-Onboarding und Profilschreibung, etwa `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | Standard-Builder für OAuth-Authentifizierungsergebnisse |
    | `plugin-sdk/provider-env-vars` | Hilfsfunktionen zur Suche nach Provider-Authentifizierungs-Umgebungsvariablen |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials`, OpenAI Codex-Hilfsfunktionen für Authentifizierungsimport, veralteter Kompatibilitätsexport `resolveOpenClawAgentDir` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, gemeinsame Builder für Replay-Richtlinien, Provider-Endpunkt-Hilfsfunktionen und gemeinsame Hilfsfunktionen zur Normalisierung von Modell-IDs |
    | `plugin-sdk/provider-catalog-live-runtime` | Hilfsfunktionen für Live-Provider-Modellkataloge für abgesicherte Erkennung im Stil von `/models`: `buildLiveModelProviderConfig`, `fetchLiveProviderModelRows`, `getCachedLiveProviderModelRows`, `fetchLiveProviderModelIds`, `LiveModelCatalogHttpError`, `clearLiveCatalogCacheForTests`, Modell-ID-Filterung, TTL-Cache und statischer Fallback |
    | `plugin-sdk/provider-catalog-runtime` | Runtime-Hook zur Provider-Katalogerweiterung und Plugin-Provider-Registry-Schnittstellen für Vertragstests |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | Generische Provider-Hilfsfunktionen für HTTP-/Endpunktfähigkeiten, Provider-HTTP-Fehler und Multipart-Formular-Hilfsfunktionen für Audiotranskription |
    | `plugin-sdk/provider-web-fetch-contract` | Enge Hilfsfunktionen für Web-Fetch-Konfiguration/-Auswahlverträge wie `enablePluginInConfig` und `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | Hilfsfunktionen für Web-Fetch-Provider-Registrierung/-Cache |
    | `plugin-sdk/provider-web-search-config-contract` | Enge Hilfsfunktionen für Websuche-Konfiguration/-Anmeldedaten für Provider, die keine Plugin-Aktivierungsverdrahtung benötigen |
    | `plugin-sdk/provider-web-search-contract` | Enge Hilfsfunktionen für Websuche-Konfiguration/-Anmeldedaten-Verträge wie `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` und bereichsgebundene Setter/Getter für Anmeldedaten |
    | `plugin-sdk/provider-web-search` | Hilfsfunktionen für Websuche-Provider-Registrierung/-Cache/-Runtime |
    | `plugin-sdk/embedding-providers` | Allgemeine Typen und Lese-Hilfsfunktionen für Embedding-Provider, einschließlich `EmbeddingProviderAdapter`, `getEmbeddingProvider(...)` und `listEmbeddingProviders(...)`; Plugins registrieren Provider über `api.registerEmbeddingProvider(...)`, damit Manifest-Eigentümerschaft erzwungen wird |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks` und DeepSeek/Gemini/OpenAI-Schemabereinigung + Diagnosen |
    | `plugin-sdk/provider-usage` | Snapshot-Typen für Provider-Nutzung, gemeinsame Hilfsfunktionen zum Abrufen von Nutzung und Provider-Fetcher wie `fetchClaudeUsage` |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, Stream-Wrapper-Typen, Kompatibilität für Klartext-Tool-Aufrufe und gemeinsame Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot-Wrapper-Hilfsfunktionen |
    | `plugin-sdk/provider-stream-shared` | Öffentliche gemeinsame Hilfsfunktionen für Provider-Stream-Wrapper, einschließlich `composeProviderStreamWrappers`, `createOpenAICompatibleCompletionsThinkingOffWrapper`, `createPlainTextToolCallCompatWrapper`, `createPayloadPatchStreamWrapper`, `createToolStreamWrapper`, `normalizeOpenAICompatibleReasoningPayload`, `setQwenChatTemplateThinking` und Anthropic/DeepSeek/OpenAI-kompatible Stream-Dienstprogramme |
    | `plugin-sdk/provider-transport-runtime` | Hilfsfunktionen für nativen Provider-Transport wie abgesichertes Fetch, Transport-Nachrichtentransformationen und beschreibbare Transport-Ereignisstreams |
    | `plugin-sdk/provider-onboard` | Hilfsfunktionen für Onboarding-Konfigurations-Patches |
    | `plugin-sdk/global-singleton` | Prozesslokale Singleton-/Map-/Cache-Hilfsfunktionen |
    | `plugin-sdk/group-activation` | Enge Hilfsfunktionen für Gruppenaktivierungsmodus und Befehlsparsing |
  </Accordion>

Snapshots zur Provider-Nutzung melden normalerweise ein oder mehrere Kontingent-`windows`, jeweils mit
einem Label, genutztem Prozentsatz und optionaler Zurücksetzzeit. Provider, die statt zurücksetzbarer
Kontingentfenster Guthaben- oder Kontostatus-Text bereitstellen, sollten
`summary` mit einem leeren `windows`-Array zurückgeben, statt Prozentsätze zu erfinden.
OpenClaw zeigt diesen Zusammenfassungstext in der Statusausgabe an; verwenden Sie `error` nur, wenn der
Nutzungsendpunkt fehlgeschlagen ist oder keine nutzbaren Nutzungsdaten zurückgegeben hat.

  <Accordion title="Auth- und Sicherheits-Unterpfade">
    | Unterpfad | Wichtige Exporte |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, Befehls-Registry-Hilfsfunktionen einschließlich dynamischer Argumentmenü-Formatierung, Hilfsfunktionen für Senderautorisierung |
    | `plugin-sdk/command-status` | Builder für Befehls-/Hilfenachrichten wie `buildCommandsMessagePaginated` und `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | Hilfsfunktionen zur Genehmigerauflösung und Aktionsauthentifizierung im selben Chat |
    | `plugin-sdk/approval-client-runtime` | Hilfsfunktionen für native Exec-Genehmigungsprofile/-Filter |
    | `plugin-sdk/approval-delivery-runtime` | Native Genehmigungsfähigkeits-/Zustellungsadapter |
    | `plugin-sdk/approval-gateway-runtime` | Gemeinsame Hilfsfunktion zur Genehmigungs-Gateway-Auflösung |
    | `plugin-sdk/approval-handler-adapter-runtime` | Leichtgewichtige Hilfsfunktionen zum Laden nativer Genehmigungsadapter für Hot-Channel-Einstiegspunkte |
    | `plugin-sdk/approval-handler-runtime` | Breitere Runtime-Hilfsfunktionen für Genehmigungs-Handler; bevorzugen Sie die engeren Adapter-/Gateway-Schnittstellen, wenn sie ausreichen |
    | `plugin-sdk/approval-native-runtime` | Hilfsfunktionen für native Genehmigungsziele, Kontobindung, Routen-Gates, Weiterleitungs-Fallback und Unterdrückung lokaler nativer Exec-Eingabeaufforderungen |
    | `plugin-sdk/approval-reaction-runtime` | Hartcodierte Genehmigungsreaktionsbindungen, Reaktionsaufforderungs-Payloads, Reaktionszielspeicher und Kompatibilitätsexport für die Unterdrückung lokaler nativer Exec-Eingabeaufforderungen |
    | `plugin-sdk/approval-reply-runtime` | Hilfsfunktionen für Exec-/Plugin-Genehmigungsantwort-Payloads |
    | `plugin-sdk/approval-runtime` | Hilfsfunktionen für Exec-/Plugin-Genehmigungs-Payloads, native Genehmigungsrouting-/Runtime-Hilfsfunktionen und strukturierte Hilfsfunktionen zur Genehmigungsanzeige wie `formatApprovalDisplayPath` |
    | `plugin-sdk/reply-dedupe` | Enge Hilfsfunktionen zum Zurücksetzen der Deduplizierung eingehender Antworten |
    | `plugin-sdk/channel-contract-testing` | Enge Hilfsfunktionen für Channel-Vertragstests ohne das breite Test-Barrel |
    | `plugin-sdk/command-auth-native` | Native Befehlsauthentifizierung, dynamische Argumentmenü-Formatierung und Hilfsfunktionen für native Sitzungsziele |
    | `plugin-sdk/command-detection` | Gemeinsame Hilfsfunktionen zur Befehlserkennung |
    | `plugin-sdk/command-primitives-runtime` | Leichtgewichtige Befehlstext-Prädikate für Hot-Channel-Pfade |
    | `plugin-sdk/command-surface` | Hilfsfunktionen zur Befehlsrumpf-Normalisierung und Befehlsoberfläche |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | Enge Hilfsfunktionen zur Secret-Vertragssammlung für Channel-/Plugin-Secret-Oberflächen |
    | `plugin-sdk/secret-ref-runtime` | Enge `coerceSecretRef`- und SecretRef-Typisierungs-Hilfsfunktionen für Secret-Vertrags-/Konfigurationsparsing |
    | `plugin-sdk/secret-provider-integration` | Type-only SecretRef-Provider-Integrationsmanifest und Preset-Verträge für Plugins, die externe Secret-Provider-Presets veröffentlichen |
    | `plugin-sdk/security-runtime` | Gemeinsame Hilfsfunktionen für Vertrauen, DM-Gating, root-begrenzte Datei-/Pfadoperationen einschließlich Create-only-Schreibvorgängen, synchronem/asynchronem atomarem Dateiersatz, Geschwister-Temp-Schreibvorgängen, Cross-Device-Move-Fallback, privatem Dateispeicher, Symlink-Parent-Guards, externen Inhalten, Schwärzung sensibler Texte, Secret-Vergleich in konstanter Zeit und Secret-Sammlung |
    | `plugin-sdk/ssrf-policy` | Hilfsfunktionen für Host-Allowlist und Private-Network-SSRF-Richtlinien |
    | `plugin-sdk/ssrf-dispatcher` | Enge Hilfsfunktionen für gepinnte Dispatcher ohne die breite Infrastruktur-Runtime-Oberfläche |
    | `plugin-sdk/ssrf-runtime` | Gepinnter Dispatcher, SSRF-abgesichertes Fetch, SSRF-Fehler und SSRF-Richtlinien-Hilfsfunktionen |
    | `plugin-sdk/secret-input` | Hilfsfunktionen zum Parsen von Secret-Eingaben |
    | `plugin-sdk/webhook-ingress` | Hilfsfunktionen für Webhook-Anfragen/-Ziele und Roh-Websocket-/Body-Koerzierung |
    | `plugin-sdk/webhook-request-guards` | Hilfsfunktionen für Anfrage-Body-Größe/-Timeout |
  </Accordion>

  <Accordion title="Runtime- und Speicher-Unterpfade">
    | Unterpfad | Wichtige Exporte |
    | --- | --- |
    | `plugin-sdk/runtime` | Breite Runtime-/Logging-/Backup-/Plugin-Installations-Hilfsfunktionen |
    | `plugin-sdk/runtime-env` | Schmale Hilfsfunktionen für Runtime-Env, Logger, Timeout, Wiederholung und Backoff |
    | `plugin-sdk/browser-config` | Unterstützte Browser-Konfigurationsfassade für normalisierte Profile/Defaults, CDP-URL-Parsing und Auth-Hilfsfunktionen zur Browser-Steuerung |
    | `plugin-sdk/agent-harness-task-runtime` | Generische Hilfsfunktionen für Aufgabenlebenszyklus und Abschlusszustellung für Harness-gestützte Agenten mit einem vom Host ausgestellten Aufgaben-Scope |
    | `plugin-sdk/codex-mcp-projection` | Reservierte gebündelte Codex-Hilfsfunktion zum Projizieren der MCP-Serverkonfiguration des Benutzers in die Codex-Thread-Konfiguration; nicht für Drittanbieter-Plugins |
    | `plugin-sdk/codex-native-task-runtime` | Private gebündelte Codex-Hilfsfunktion für native Task-Mirror-/Runtime-Verdrahtung; nicht für Drittanbieter-Plugins |
    | `plugin-sdk/channel-runtime-context` | Generische Hilfsfunktionen zur Registrierung und Suche des Kanal-Runtime-Kontexts |
    | `plugin-sdk/matrix` | Veraltete Matrix-Kompatibilitätsfassade für ältere Drittanbieter-Kanalpakete; neue Plugins sollten `plugin-sdk/run-command` direkt importieren |
    | `plugin-sdk/mattermost` | Veraltete Mattermost-Kompatibilitätsfassade für ältere Drittanbieter-Kanalpakete; neue Plugins sollten generische SDK-Unterpfade direkt importieren |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Gemeinsame Plugin-Befehls-/Hook-/HTTP-/Interaktiv-Hilfsfunktionen |
    | `plugin-sdk/hook-runtime` | Gemeinsame Hilfsfunktionen für Webhook-/interne Hook-Pipelines |
    | `plugin-sdk/lazy-runtime` | Hilfsfunktionen für Lazy-Runtime-Importe/-Bindings wie `createLazyRuntimeModule`, `createLazyRuntimeMethod` und `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | Hilfsfunktionen für Prozessausführung |
    | `plugin-sdk/cli-runtime` | Hilfsfunktionen für CLI-Formatierung, Warten, Version, Argumentaufruf und Lazy-Befehlsgruppen |
    | `plugin-sdk/qa-live-transport-scenarios` | Gemeinsame Live-Transport-QA-Szenario-IDs, Hilfsfunktionen für Baseline-Abdeckung und Hilfsfunktion zur Szenarioauswahl |
    | `plugin-sdk/gateway-method-runtime` | Reservierte Gateway-Methoden-Dispatch-Hilfsfunktion für Plugin-HTTP-Routen, die `contracts.gatewayMethodDispatch: ["authenticated-request"]` deklarieren |
    | `plugin-sdk/gateway-runtime` | Gateway-Client, Hilfsfunktion zum Starten eines event-loop-bereiten Clients, Gateway-CLI-RPC, Gateway-Protokollfehler und Hilfsfunktionen für Kanalstatus-Patches |
    | `plugin-sdk/config-contracts` | Fokussierte reine Typ-Konfigurationsoberfläche für Plugin-Konfigurationsformen wie `OpenClawConfig` und Kanal-/Provider-Konfigurationstypen |
    | `plugin-sdk/plugin-config-runtime` | Hilfsfunktionen für Runtime-Plugin-Konfigurationssuche wie `requireRuntimeConfig`, `resolvePluginConfigObject` und `resolveLivePluginConfigObject` |
    | `plugin-sdk/config-mutation` | Transaktionale Hilfsfunktionen für Konfigurationsänderungen wie `mutateConfigFile`, `replaceConfigFile` und `logConfigUpdated` |
    | `plugin-sdk/message-tool-delivery-hints` | Gemeinsame Hinweiszeichenfolgen für Metadaten zur Zustellung von Message-Tools |
    | `plugin-sdk/runtime-config-snapshot` | Hilfsfunktionen für den aktuellen Prozess-Konfigurations-Snapshot wie `getRuntimeConfig`, `getRuntimeConfigSnapshot` und Test-Snapshot-Setter |
    | `plugin-sdk/telegram-command-config` | Normalisierung von Telegram-Befehlsnamen/-beschreibungen und Duplikat-/Konfliktprüfungen, selbst wenn die gebündelte Telegram-Vertragsoberfläche nicht verfügbar ist |
    | `plugin-sdk/text-autolink-runtime` | Erkennung von Datei-Referenz-Autolinks ohne das breite Text-Barrel |
    | `plugin-sdk/approval-reaction-runtime` | Hartcodierte Approval-Reaktions-Bindings, Reaktions-Prompt-Payloads, Reaktionsziel-Stores und Kompatibilitätsexport für lokale native Unterdrückung von Exec-Prompts |
    | `plugin-sdk/approval-runtime` | Hilfsfunktionen für Exec-/Plugin-Approval, Builder für Approval-Capabilities, Auth-/Profil-Hilfsfunktionen, native Routing-/Runtime-Hilfsfunktionen und Formatierung strukturierter Approval-Anzeigepfade |
    | `plugin-sdk/reply-runtime` | Gemeinsame Hilfsfunktionen für Inbound-/Antwort-Runtime, Chunking, Dispatch, Heartbeat, Antwortplaner |
    | `plugin-sdk/reply-dispatch-runtime` | Schmale Hilfsfunktionen für Antwort-Dispatch/-Finalisierung und Konversationslabels |
    | `plugin-sdk/reply-history` | Gemeinsame Hilfsfunktionen für Antwortverlauf mit kurzem Fenster. Neuer Message-Turn-Code sollte `createChannelHistoryWindow` verwenden; Low-Level-Map-Hilfsfunktionen bleiben nur veraltete Kompatibilitätsexporte |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | Schmale Hilfsfunktionen für Text-/Markdown-Chunking |
    | `plugin-sdk/session-store-runtime` | Hilfsfunktionen für Sitzungs-Workflows (`getSessionEntry`, `listSessionEntries`, `patchSessionEntry`, `upsertSessionEntry`), begrenzte Lesezugriffe auf aktuelle Benutzer-/Assistent-Transkripttexte nach Sitzungsidentität, Hilfsfunktionen für Legacy-Sitzungs-Store-Pfade/-Sitzungsschlüssel, updated-at-Lesezugriffe und nur für Übergänge gedachte Kompatibilitäts-Hilfsfunktionen für Whole-Store/Dateipfade |
    | `plugin-sdk/session-transcript-runtime` | Transkriptidentität, Hilfsfunktionen für gescopte Ziele/Lese-/Schreibzugriffe, Veröffentlichung von Updates, Schreibsperren und Trefferschlüssel für Transkriptspeicher |
    | `plugin-sdk/sqlite-runtime` | Fokussierte SQLite-Hilfsfunktionen für Agent-Schema, Pfade und Transaktionen für First-Party-Runtime |
    | `plugin-sdk/cron-store-runtime` | Hilfsfunktionen für Cron-Store-Pfade/Laden/Speichern |
    | `plugin-sdk/state-paths` | Hilfsfunktionen für State-/OAuth-Verzeichnispfade |
    | `plugin-sdk/plugin-state-runtime` | Plugin-Sidecar-SQLite-Keyed-State-Typen plus zentralisierte Einrichtung von Connection-Pragma und WAL-Wartung für Plugin-eigene Datenbanken |
    | `plugin-sdk/routing` | Hilfsfunktionen für Routen-/Sitzungsschlüssel-/Konto-Bindings wie `resolveAgentRoute`, `buildAgentSessionKey` und `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | Gemeinsame Hilfsfunktionen für Kanal-/Kontostatuszusammenfassungen, Runtime-State-Defaults und Issue-Metadaten |
    | `plugin-sdk/target-resolver-runtime` | Gemeinsame Ziel-Resolver-Hilfsfunktionen |
    | `plugin-sdk/string-normalization-runtime` | Hilfsfunktionen zur Slug-/String-Normalisierung |
    | `plugin-sdk/request-url` | String-URLs aus fetch-/request-ähnlichen Eingaben extrahieren |
    | `plugin-sdk/run-command` | Zeitbegrenzter Befehlsrunner mit normalisierten stdout-/stderr-Ergebnissen |
    | `plugin-sdk/param-readers` | Gemeinsame Tool-/CLI-Parameterleser |
    | `plugin-sdk/tool-plugin` | Einfaches typisiertes Agent-Tool-Plugin definieren und statische Metadaten für die Manifestgenerierung bereitstellen |
    | `plugin-sdk/tool-payload` | Normalisierte Payloads aus Tool-Ergebnisobjekten extrahieren |
    | `plugin-sdk/tool-send` | Kanonische Send-Zielfelder aus Tool-Argumenten extrahieren |
    | `plugin-sdk/sandbox` | Sandbox-Backend-Typen und SSH-/OpenShell-Befehlshilfsfunktionen, einschließlich fail-fast Exec-Befehls-Preflight |
    | `plugin-sdk/temp-path` | Gemeinsame Hilfsfunktionen für temporäre Download-Pfade und private sichere temporäre Workspaces |
    | `plugin-sdk/logging-core` | Subsystem-Logger und Redaction-Hilfsfunktionen |
    | `plugin-sdk/markdown-table-runtime` | Hilfsfunktionen für Markdown-Tabellenmodus und Konvertierung |
    | `plugin-sdk/model-session-runtime` | Hilfsfunktionen für Modell-/Sitzungs-Overrides wie `applyModelOverrideToSessionEntry` und `resolveAgentMaxConcurrent` |
    | `plugin-sdk/talk-config-runtime` | Hilfsfunktionen zur Auflösung der Talk-Provider-Konfiguration |
    | `plugin-sdk/json-store` | Kleine Hilfsfunktionen zum Lesen/Schreiben von JSON-State |
    | `plugin-sdk/json-unsafe-integers` | JSON-Parsing-Hilfsfunktionen, die unsichere Ganzzahlliterale als Strings erhalten |
    | `plugin-sdk/file-lock` | Re-entrante File-Lock-Hilfsfunktionen |
    | `plugin-sdk/persistent-dedupe` | Datenträgergestützte Dedupe-Cache-Hilfsfunktionen |
    | `plugin-sdk/acp-runtime` | ACP-Runtime-/Sitzungs- und Antwort-Dispatch-Hilfsfunktionen |
    | `plugin-sdk/acp-runtime-backend` | Leichtgewichtige ACP-Backend-Registrierungs- und Antwort-Dispatch-Hilfsfunktionen für beim Start geladene Plugins |
    | `plugin-sdk/acp-binding-resolve-runtime` | Schreibgeschützte ACP-Binding-Auflösung ohne Lifecycle-Startup-Importe |
    | `plugin-sdk/agent-config-primitives` | Schmale Agent-Runtime-Konfigurationsschema-Primitiven |
    | `plugin-sdk/boolean-param` | Lockerer boolescher Parameterleser |
    | `plugin-sdk/dangerous-name-runtime` | Hilfsfunktionen zur Auflösung von Dangerous-Name-Matching |
    | `plugin-sdk/device-bootstrap` | Geräte-Bootstrap- und Pairing-Token-Hilfsfunktionen |
    | `plugin-sdk/extension-shared` | Gemeinsame Primitive für passive Kanäle, Status und Ambient-Proxy-Hilfsfunktionen |
    | `plugin-sdk/models-provider-runtime` | Hilfsfunktionen für `/models`-Befehls-/Provider-Antworten |
    | `plugin-sdk/skill-commands-runtime` | Hilfsfunktionen zum Auflisten von Skill-Befehlen |
    | `plugin-sdk/native-command-registry` | Hilfsfunktionen für Native-Command-Registry/Build/Serialisierung |
    | `plugin-sdk/agent-harness` | Experimentelle Trusted-Plugin-Oberfläche für Low-Level-Agent-Harnesses: Harness-Typen, Active-Run-Steer-/Abort-Hilfsfunktionen, OpenClaw-Tool-Bridge-Hilfsfunktionen, Hilfsfunktionen für Runtime-Plan-Tool-Policy, Klassifizierung von Terminalergebnissen, Hilfsfunktionen für Tool-Fortschrittsformatierung/-details und Attempt-Result-Utilities |
    | `plugin-sdk/provider-zai-endpoint` | Veraltete Provider-eigene Z.AI-Endpunkterkennungsfassade; verwenden Sie die öffentliche API des Z.AI-Plugins |
    | `plugin-sdk/async-lock-runtime` | Prozesslokale Async-Lock-Hilfsfunktion für kleine Runtime-State-Dateien |
    | `plugin-sdk/channel-activity-runtime` | Hilfsfunktion für Kanalaktivitäts-Telemetrie |
    | `plugin-sdk/concurrency-runtime` | Hilfsfunktion für begrenzte Nebenläufigkeit asynchroner Aufgaben |
    | `plugin-sdk/dedupe-runtime` | In-Memory-Dedupe-Cache-Hilfsfunktionen |
    | `plugin-sdk/delivery-queue-runtime` | Hilfsfunktion zum Leeren ausstehender ausgehender Zustellungen |
    | `plugin-sdk/file-access-runtime` | Hilfsfunktionen für sichere lokale Datei- und Medienquellenpfade |
    | `plugin-sdk/heartbeat-runtime` | Hilfsfunktionen für Heartbeat-Wecken, -Ereignisse und -Sichtbarkeit |
    | `plugin-sdk/number-runtime` | Hilfsfunktion für numerische Koersion |
    | `plugin-sdk/secure-random-runtime` | Hilfsfunktionen für sichere Token/UUIDs |
    | `plugin-sdk/system-event-runtime` | Hilfsfunktionen für Systemereignis-Warteschlangen |
    | `plugin-sdk/transport-ready-runtime` | Hilfsfunktion zum Warten auf Transportbereitschaft |
    | `plugin-sdk/exec-approvals-runtime` | Hilfsfunktionen für Exec-Approval-Policy-Dateien ohne das breite infra-runtime-Barrel |
    | `plugin-sdk/infra-runtime` | Veralteter Kompatibilitäts-Shim; verwenden Sie die oben genannten fokussierten Runtime-Unterpfade |
    | `plugin-sdk/collection-runtime` | Kleine Hilfsfunktionen für begrenzte Caches |
    | `plugin-sdk/diagnostic-runtime` | Hilfsfunktionen für Diagnose-Flags, Ereignisse und Trace-Kontext |
    | `plugin-sdk/error-runtime` | Fehlergraph, Formatierung, gemeinsame Hilfsfunktionen zur Fehlerklassifizierung, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | Umhülltes Fetch, Proxy, EnvHttpProxyAgent-Option und Hilfsfunktionen für gepinnte Lookups |
    | `plugin-sdk/runtime-fetch` | Dispatcher-aware Runtime-Fetch ohne Proxy-/Guarded-Fetch-Importe |
    | `plugin-sdk/inline-image-data-url-runtime` | Sanitizer für Inline-Bilddaten-URLs und Hilfsfunktionen zum Signatur-Sniffing ohne die breite Medien-Runtime-Oberfläche |
    | `plugin-sdk/response-limit-runtime` | Begrenzter Response-Body-Reader ohne die breite Medien-Runtime-Oberfläche |
    | `plugin-sdk/session-binding-runtime` | Aktueller Zustand des Konversations-Bindings ohne konfigurierte Binding-Routing- oder Pairing-Stores |
    | `plugin-sdk/session-store-runtime` | Session-Store-Hilfsfunktionen ohne breite Konfigurationsschreib-/Wartungsimporte |
    | `plugin-sdk/sqlite-runtime` | Fokussierte SQLite-Hilfsfunktionen für Agent-Schema, Pfade und Transaktionen ohne Datenbank-Lifecycle-Steuerungen |
    | `plugin-sdk/context-visibility-runtime` | Auflösung der Kontextsichbarkeit und ergänzende Kontextfilterung ohne breite Konfigurations-/Sicherheitsimporte |
    | `plugin-sdk/string-coerce-runtime` | Schmale Hilfsfunktionen für Primitive-Record-/String-Koersion und Normalisierung ohne Markdown-/Logging-Importe |
    | `plugin-sdk/host-runtime` | Hilfsfunktionen zur Normalisierung von Hostnamen und SCP-Hosts |
    | `plugin-sdk/retry-runtime` | Hilfsfunktionen für Wiederholungskonfiguration und Retry-Runner |
    | `plugin-sdk/agent-runtime` | Hilfsfunktionen für Agent-Verzeichnis/Identität/Workspace, einschließlich `resolveAgentDir`, `resolveDefaultAgentDir` und veraltetem Kompatibilitätsexport `resolveOpenClawAgentDir` |
    | `plugin-sdk/directory-runtime` | Konfigurationsgestützte Verzeichnisabfrage/-Deduplizierung |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Capability- und Test-Unterpfade">
    | Unterpfad | Wichtige Exporte |
    | --- | --- |
    | `plugin-sdk/media-runtime` | Gemeinsame Hilfsfunktionen zum Abrufen, Transformieren und Speichern von Medien, einschließlich `saveRemoteMedia`, `saveResponseMedia`, `readRemoteMediaBuffer` und des veralteten `fetchRemoteMedia`; bevorzugen Sie Speicher-Hilfsfunktionen vor Buffer-Lesezugriffen, wenn eine URL zu OpenClaw-Medien werden soll |
    | `plugin-sdk/media-mime` | Eng gefasste MIME-Normalisierung, Zuordnung von Dateierweiterungen, MIME-Erkennung und Hilfsfunktionen für Medienarten |
    | `plugin-sdk/media-store` | Eng gefasste Medienspeicher-Hilfsfunktionen wie `saveMediaBuffer` und `saveMediaStream` |
    | `plugin-sdk/media-generation-runtime` | Gemeinsame Hilfsfunktionen für Failover bei der Mediengenerierung, Kandidatenauswahl und Meldungen zu fehlenden Modellen |
    | `plugin-sdk/media-understanding` | Provider-Typen für Medienverständnis sowie provider-seitige Hilfsexporte für Bild, Audio und strukturierte Extraktion |
    | `plugin-sdk/text-chunking` | Hilfsfunktionen zum Chunking und Rendern von Text und Markdown, Markdown-Tabellenkonvertierung, Entfernen von Directive-Tags und Safe-Text-Dienstprogramme |
    | `plugin-sdk/text-chunking` | Hilfsfunktion für ausgehendes Text-Chunking |
    | `plugin-sdk/speech` | Speech-Provider-Typen sowie provider-seitige Exporte für Direktiven, Registry, Validierung, OpenAI-kompatiblen TTS-Builder und Speech-Hilfsfunktionen |
    | `plugin-sdk/speech-core` | Gemeinsame Speech-Provider-Typen, Registry-, Direktiven-, Normalisierungs- und Speech-Hilfsexporte |
    | `plugin-sdk/realtime-transcription` | Provider-Typen für Echtzeit-Transkription, Registry-Hilfsfunktionen und gemeinsame WebSocket-Sitzungshilfe |
    | `plugin-sdk/realtime-bootstrap-context` | Echtzeit-Profil-Bootstrap-Hilfsfunktion für begrenzte Kontextinjektion von `IDENTITY.md`, `USER.md` und `SOUL.md` |
    | `plugin-sdk/realtime-voice` | Provider-Typen für Echtzeit-Sprache, Registry-Hilfsfunktionen und gemeinsame Hilfsfunktionen für Echtzeit-Sprachverhalten, einschließlich Nachverfolgung der Ausgabeaktivität |
    | `plugin-sdk/image-generation` | Provider-Typen für Bildgenerierung sowie Hilfsfunktionen für Bild-Assets/Daten-URLs und der OpenAI-kompatible Bild-Provider-Builder |
    | `plugin-sdk/image-generation-core` | Gemeinsame Bildgenerierungstypen, Failover-, Auth- und Registry-Hilfsfunktionen |
    | `plugin-sdk/music-generation` | Provider-, Anfrage- und Ergebnistypen für Musikgenerierung |
    | `plugin-sdk/music-generation-core` | Gemeinsame Musikgenerierungstypen, Failover-Hilfsfunktionen, Provider-Suche und Model-Ref-Parsing |
    | `plugin-sdk/video-generation` | Provider-, Anfrage- und Ergebnistypen für Videogenerierung |
    | `plugin-sdk/video-generation-core` | Gemeinsame Videogenerierungstypen, Failover-Hilfsfunktionen, Provider-Suche und Model-Ref-Parsing |
    | `plugin-sdk/transcripts` | Gemeinsame Provider-Typen für Transkriptquellen, Registry-Hilfsfunktionen, Sitzungsdeskriptoren und Äußerungsmetadaten |
    | `plugin-sdk/webhook-targets` | Registry für Webhook-Ziele und Hilfsfunktionen zur Routeninstallation |
    | `plugin-sdk/webhook-path` | Veralteter Kompatibilitätsalias; verwenden Sie `plugin-sdk/webhook-ingress` |
    | `plugin-sdk/web-media` | Gemeinsame Hilfsfunktionen zum Laden entfernter/lokaler Medien |
    | `plugin-sdk/zod` | Veralteter Kompatibilitäts-Re-Export; importieren Sie `zod` direkt aus `zod` |
    | `plugin-sdk/testing` | Repo-lokales veraltetes Kompatibilitäts-Barrel für ältere OpenClaw-Tests. Neue Repo-Tests sollten stattdessen fokussierte lokale Test-Unterpfade wie `plugin-sdk/agent-runtime-test-contracts`, `plugin-sdk/plugin-test-runtime`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/test-env` oder `plugin-sdk/test-fixtures` importieren |
    | `plugin-sdk/plugin-test-api` | Repo-lokale minimale Hilfsfunktion `createTestPluginApi` für Unit-Tests mit direkter Plugin-Registrierung ohne Import von Repo-Test-Helper-Bridges |
    | `plugin-sdk/agent-runtime-test-contracts` | Repo-lokale native Contract-Fixtures für Agent-Runtime-Adapter für Auth-, Zustellungs-, Fallback-, Tool-Hook-, Prompt-Overlay-, Schema- und Transkript-Projektionstests |
    | `plugin-sdk/channel-test-helpers` | Repo-lokale channel-orientierte Test-Hilfsfunktionen für generische Aktionen/Setup/Status-Contracts, Verzeichnis-Assertions, Lebenszyklus beim Kontostart, Send-Config-Threading, Runtime-Mocks, Statusprobleme, ausgehende Zustellung und Hook-Registrierung |
    | `plugin-sdk/channel-target-testing` | Repo-lokale gemeinsame Suite für Fehlerfälle bei der Zielauflösung in Channel-Tests |
    | `plugin-sdk/plugin-test-contracts` | Repo-lokale Contract-Hilfsfunktionen für Plugin-Pakete, Registrierung, öffentliche Artefakte, direkte Importe, Runtime-API und Import-Nebeneffekte |
    | `plugin-sdk/provider-test-contracts` | Repo-lokale Contract-Hilfsfunktionen für Provider-Runtime, Auth, Discovery, Onboard, Katalog, Wizard, Medien-Capability, Replay-Richtlinie, Echtzeit-STT-Live-Audio, Websuche/-Abruf und Stream |
    | `plugin-sdk/provider-http-test-mocks` | Repo-lokale optionale Vitest-HTTP/Auth-Mocks für Provider-Tests, die `plugin-sdk/provider-http` ausüben |
    | `plugin-sdk/test-fixtures` | Repo-lokale generische Fixtures für CLI-Runtime-Erfassung, Sandbox-Kontext, Skill-Writer, Agent-Nachrichten, Systemereignisse, Modulneuladung, gebündelten Plugin-Pfad, Terminal-Text, Chunking, Auth-Token und typisierte Fälle |
    | `plugin-sdk/test-node-mocks` | Repo-lokale fokussierte Mock-Hilfsfunktionen für Node-Builtins zur Verwendung innerhalb von Vitest-`vi.mock("node:*")`-Factories |
  </Accordion>

  <Accordion title="Memory-Unterpfade">
    | Unterpfad | Wichtige Exporte |
    | --- | --- |
    | `plugin-sdk/memory-core` | Gebündelte memory-core-Hilfsoberfläche für Manager-/Config-/Datei-/CLI-Hilfsfunktionen |
    | `plugin-sdk/memory-core-engine-runtime` | Runtime-Fassade für Memory-Index/Suche |
    | `plugin-sdk/memory-core-host-embedding-registry` | Leichtgewichtige Registry-Hilfsfunktionen für Memory-Embedding-Provider |
    | `plugin-sdk/memory-core-host-engine-foundation` | Exporte der Memory-Host-Foundation-Engine |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Memory-Host-Embedding-Contracts, Registry-Zugriff, lokaler Provider und generische Batch-/Remote-Hilfsfunktionen. `registerMemoryEmbeddingProvider` auf dieser Oberfläche ist veraltet; verwenden Sie für neue Provider die generische Embedding-Provider-API. |
    | `plugin-sdk/memory-core-host-engine-qmd` | Exporte der Memory-Host-QMD-Engine |
    | `plugin-sdk/memory-core-host-engine-storage` | Exporte der Memory-Host-Storage-Engine |
    | `plugin-sdk/memory-core-host-multimodal` | Multimodale Memory-Host-Hilfsfunktionen |
    | `plugin-sdk/memory-core-host-query` | Memory-Host-Abfragehilfsfunktionen |
    | `plugin-sdk/memory-core-host-secret` | Memory-Host-Secret-Hilfsfunktionen |
    | `plugin-sdk/memory-core-host-events` | Veralteter Kompatibilitätsalias; verwenden Sie `plugin-sdk/memory-host-events` |
    | `plugin-sdk/memory-core-host-status` | Memory-Host-Statushilfsfunktionen |
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

  <Accordion title="Reservierte Unterpfade für gebündelte Hilfsfunktionen">
    Reservierte SDK-Unterpfade für gebündelte Hilfsfunktionen sind eng gefasste, owner-spezifische Oberflächen für
    gebündelten Plugin-Code. Sie werden im SDK-Inventar nachverfolgt, damit Paket-
    Builds und Aliasing deterministisch bleiben, sind aber keine allgemeinen APIs
    für die Plugin-Erstellung. Neue wiederverwendbare Host-Contracts sollten generische SDK-Unterpfade
    wie `plugin-sdk/gateway-runtime`, `plugin-sdk/security-runtime` und
    `plugin-sdk/plugin-config-runtime` verwenden.

    | Unterpfad | Owner und Zweck |
    | --- | --- |
    | `plugin-sdk/codex-mcp-projection` | Hilfsfunktion des gebündelten Codex-Plugins zur Projektion der Benutzer-MCP-Server-Config in die Thread-Config des Codex-App-Servers |
    | `plugin-sdk/codex-native-task-runtime` | Hilfsfunktion des gebündelten Codex-Plugins zur Spiegelung nativer Subagents des Codex-App-Servers in den OpenClaw-Task-Status |

  </Accordion>
</AccordionGroup>

## Verwandt

- [Plugin-SDK-Übersicht](/de/plugins/sdk-overview)
- [Plugin-SDK-Einrichtung](/de/plugins/sdk-setup)
- [Plugins erstellen](/de/plugins/building-plugins)
