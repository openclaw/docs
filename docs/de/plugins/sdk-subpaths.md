---
read_when:
    - Den richtigen plugin-sdk-Unterpfad für einen Plugin-Import auswählen
    - Auditierung von Unterpfaden gebündelter Plugins und Hilfsschnittstellen
summary: 'Plugin-SDK-Unterpfadkatalog: welche Importe wo zu finden sind, nach Bereich gruppiert'
title: Unterpfade des Plugin-SDKs
x-i18n:
    generated_at: "2026-07-16T13:14:07Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 937b616d7a95c250f7ff328ea3faa12143272722ffa638f50214fdd72ef5f225
    source_path: plugins/sdk-subpaths.md
    workflow: 16
---

Das Plugin-SDK wird als eine Reihe eng gefasster öffentlicher Unterpfade unter
`openclaw/plugin-sdk/` bereitgestellt. Diese Seite katalogisiert die häufig verwendeten Unterpfade nach
Zweck gruppiert. Drei Dateien definieren die Oberfläche:

- `scripts/lib/plugin-sdk-entrypoints.json`: das gepflegte Inventar der Einstiegspunkte,
  die vom Build kompiliert werden.
- `scripts/lib/plugin-sdk-private-local-only-subpaths.json`: Repo-lokale
  Test-/interne Unterpfade. Die Paketexporte entsprechen dem Inventar abzüglich dieser Liste.
- `src/plugin-sdk/entrypoints.ts`: Klassifizierungsmetadaten für veraltete
  Unterpfade, reservierte gebündelte Hilfsfunktionen, unterstützte gebündelte Fassaden und
  öffentliche Oberflächen im Besitz von Plugins.

Maintainer prüfen die Anzahl öffentlicher Exporte mit `pnpm plugin-sdk:surface` und
aktive reservierte Hilfsunterpfade mit `pnpm plugins:boundary-report:summary`;
ungenutzte reservierte Hilfsexporte führen dazu, dass der CI-Bericht fehlschlägt, anstatt als
inaktive Kompatibilitätsschuld im öffentlichen SDK zu verbleiben.

Den Leitfaden zur Plugin-Entwicklung finden Sie unter [Plugin-SDK-Übersicht](/de/plugins/sdk-overview).

## Plugin-Einstieg

| Unterpfad                      | Wichtige Exporte                                                                                                                                                                                         |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/plugin-entry`      | `definePluginEntry`                                                                                                                                                                                     |
| `plugin-sdk/core`              | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema`, `buildJsonChannelConfigSchema`, `resolveTailscalePublishedHost` |
| `plugin-sdk/provider-entry`    | `defineSingleProviderPluginEntry`                                                                                                                                                                       |
| `plugin-sdk/migration`         | Hilfsfunktionen für Migrations-Provider-Elemente wie `createMigrationItem`, Ursachenkonstanten, Elementstatusmarkierungen, Hilfsfunktionen zur Schwärzung und `summarizeMigrationItems`                                                  |
| `plugin-sdk/migration-runtime` | Hilfsfunktionen für Laufzeitmigrationen wie `copyMigrationFileItem`, `resolvePlannedMigrationTargets`, `withCachedMigrationConfigRuntime` und `writeMigrationReport`                                             |
| `plugin-sdk/health`            | Registrierung, Erkennung, Reparatur, Auswahl, Schweregrade und Befundtypen für Doctor-Systemprüfungen gebündelter Zustandsprüfer                                                                                |
| `plugin-sdk/config-schema`     | Veraltet. Zod-Schema `openclaw.json` auf Stammebene (`OpenClawSchema`); definieren Sie stattdessen Plugin-lokale Schemas und validieren Sie diese mit `plugin-sdk/json-schema-runtime`                                                  |

### Veraltete Kompatibilitäts- und Testhilfsfunktionen

Veraltete Unterpfade bleiben für ältere Plugins exportiert, neuer Code sollte jedoch die
nachfolgend aufgeführten, fokussierten SDK-Unterpfade verwenden. Die gepflegte Liste ist
`scripts/lib/plugin-sdk-deprecated-public-subpaths.json`; CI lehnt gebündelte
Produktionsimporte daraus ab. Breite Barrels wie `plugin-sdk/compat`,
`plugin-sdk/config-types`, `plugin-sdk/infra-runtime` und
`plugin-sdk/text-runtime` dienen ausschließlich der Kompatibilität, und `plugin-sdk/zod` ist ein
Kompatibilitäts-Reexport: Importieren Sie `zod` direkt aus `zod`. Die breiten Domänen-
Barrels `plugin-sdk/agent-runtime`, `plugin-sdk/channel-lifecycle`,
`plugin-sdk/channel-runtime`, `plugin-sdk/cli-runtime`,
`plugin-sdk/conversation-runtime`, `plugin-sdk/hook-runtime`,
`plugin-sdk/media-runtime`, `plugin-sdk/plugin-runtime` und
`plugin-sdk/security-runtime` sind ebenfalls zugunsten fokussierter
Unterpfade veraltet.

Die auf Vitest basierenden Testhilfs-Unterpfade von OpenClaw sind ausschließlich Repo-lokal und
werden nicht mehr als Paketexporte bereitgestellt: `agent-runtime-test-contracts`,
`channel-contract-testing`, `channel-target-testing`, `channel-test-helpers`,
`plugin-state-test-runtime`, `plugin-test-api`, `plugin-test-contracts`,
`plugin-test-runtime`, `provider-http-test-mocks`, `provider-test-contracts`,
`reply-payload-testing`, `sqlite-runtime-testing`, `test-env`, `test-fixtures`,
`test-node-mocks` und `testing`. Die privaten gebündelten Hilfsoberflächen
`ssrf-runtime-internal` und `codex-native-task-runtime` sind ebenfalls ausschließlich
Repo-lokal.

### Reservierte Unterpfade für Hilfsfunktionen gebündelter Plugins

`plugin-sdk/codex-mcp-projection` ist der einzige reservierte Unterpfad: eine Plugin-eigene
Kompatibilitätsoberfläche für das gebündelte Codex-Plugin und keine allgemeine SDK-API.
Plugin-Importe über Besitzergrenzen hinweg werden durch Schutzmechanismen des Paketvertrags blockiert, und
CI schlägt fehl, wenn ein reservierter Unterpfad nicht mehr importiert wird.
`plugin-sdk/codex-native-task-runtime` ist ausschließlich Repo-lokal und kein
Paketexport.

`src/plugin-sdk/entrypoints.ts` erfasst außerdem unterstützte gebündelte Fassaden, also SDK-
Einstiegspunkte, die von ihrem gebündelten Plugin bereitgestellt werden, bis generische Verträge sie
ersetzen: `plugin-sdk/discord`, `plugin-sdk/lmstudio`, `plugin-sdk/lmstudio-runtime`,
`plugin-sdk/matrix`, `plugin-sdk/mattermost`,
`plugin-sdk/memory-core-engine-runtime`, `plugin-sdk/provider-zai-endpoint`,
`plugin-sdk/qa-runner-runtime`, `plugin-sdk/telegram-account`,
`plugin-sdk/tts-runtime` und `plugin-sdk/zalouser`. Mehrere davon sind auch für
neuen Code veraltet; beachten Sie die Hinweise in den jeweiligen Tabellenzeilen weiter unten.

  <AccordionGroup>
  <Accordion title="Channel-Unterpfade">
    | Unterpfad | Wichtige Exporte |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `createChannelConfigUiHints` |
    | `plugin-sdk/json-schema-runtime` | Zwischengespeicherte Hilfsfunktion zur JSON-Schema-Validierung für Plugin-eigene Schemas |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard` sowie `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | Gemeinsame Hilfsfunktionen für den Einrichtungsassistenten, Einrichtungsübersetzer, Eingabeaufforderungen für Zulassungslisten und Generatoren für den Einrichtungsstatus |
    | `plugin-sdk/setup-runtime` | `createSetupTranslator`, `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | Veralteter Kompatibilitätsalias; verwenden Sie `plugin-sdk/setup-runtime` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | Hilfsfunktionen für Mehrkontenkonfiguration und Aktionsprüfungen sowie für den Rückgriff auf das Standardkonto |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, Hilfsfunktionen zur Normalisierung von Konto-IDs |
    | `plugin-sdk/account-resolution` | Hilfsfunktionen für die Kontosuche und den Rückgriff auf den Standardwert |
    | `plugin-sdk/account-helpers` | Eng gefasste Hilfsfunktionen für Kontolisten und Kontoaktionen |
    | `plugin-sdk/access-groups` | Hilfsfunktionen zum Parsen von Zugriffsgruppen-Zulassungslisten und für redigierte Gruppendiagnosen |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | Veraltete Kompatibilitätsfassade. Verwenden Sie `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
    | `plugin-sdk/channel-config-schema` | Gemeinsame Grundelemente für Channel-Konfigurationsschemas sowie Zod- und direkte JSON-/TypeBox-Builder |
    | `plugin-sdk/bundled-channel-config-schema` | Gebündelte OpenClaw-Channel-Konfigurationsschemas ausschließlich für gepflegte gebündelte Plugins |
    | `plugin-sdk/chat-channel-ids` | `BUNDLED_CHAT_CHANNEL_IDS`, `BUNDLED_CHAT_CHANNEL_ENVELOPE_PREFIXES`, `ChatChannelId`. Kanonische IDs gebündelter/offizieller Chat-Channels sowie Formatierungsbezeichnungen/-aliasse für Plugins, die Text mit Envelope-Präfix erkennen müssen, ohne eine eigene Tabelle fest zu codieren. |
    | `plugin-sdk/channel-config-schema-legacy` | Veralteter Kompatibilitätsalias für Konfigurationsschemas gebündelter Channels |
    | `plugin-sdk/telegram-command-config` | Veraltete Normalisierung von Telegram-Befehlsnamen und -beschreibungen sowie Prüfungen auf Duplikate und Konflikte; verwenden Sie in neuem Plugin-Code die Plugin-lokale Verarbeitung der Befehlskonfiguration |
    | `plugin-sdk/command-gating` | Eng gefasste Hilfsfunktionen für die Befehlsautorisierungsprüfung |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-ingress-runtime` | Experimenteller, abstrakter Channel-Ingress-Laufzeitresolver und Builder für Routing-Fakten für migrierte Empfangspfade von Channels. Bevorzugen Sie dies gegenüber dem Zusammenstellen effektiver Zulassungslisten, Befehlszulassungslisten und Legacy-Projektionen in jedem Plugin. Siehe [Channel-Ingress-API](/de/plugins/sdk-channel-ingress). |
    | `plugin-sdk/channel-lifecycle` | Veraltete Kompatibilitätsfassade. Verwenden Sie `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-outbound` | Verträge für den Nachrichtenlebenszyklus sowie Optionen für die Antwortpipeline, Empfangsbestätigungen, Live-Vorschau/Streaming, Lebenszyklus-Hilfsfunktionen, ausgehende Identität, Nutzdatenplanung, dauerhafte Sendevorgänge und Hilfsfunktionen für den Nachrichtenversandkontext. Siehe [Channel-Outbound-API](/de/plugins/sdk-channel-outbound). |
    | `plugin-sdk/channel-message` | Veralteter Kompatibilitätsalias für `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-message-runtime` | Veralteter Kompatibilitätsalias für `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/inbound-envelope` | Gemeinsame Hilfsfunktionen zum Erstellen eingehender Routen und Envelopes |
    | `plugin-sdk/inbound-reply-dispatch` | Veraltete Kompatibilitätsfassade. Verwenden Sie `plugin-sdk/channel-inbound` für Inbound-Runner und Dispatch-Prädikate sowie `plugin-sdk/channel-outbound` für Hilfsfunktionen zur Nachrichtenzustellung. |
    | `plugin-sdk/messaging-targets` | Veralteter Alias für das Parsen von Zielen; verwenden Sie `plugin-sdk/channel-targets` |
    | `plugin-sdk/outbound-media` | Gemeinsame Hilfsfunktionen zum Laden ausgehender Medien und zum Verwalten des Status gehosteter Medien |
    | `plugin-sdk/outbound-send-deps` | Veraltete Kompatibilitätsfassade. Verwenden Sie `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/outbound-runtime` | Veraltete Kompatibilitätsfassade. Verwenden Sie `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/poll-runtime` | Eng gefasste Hilfsfunktionen zur Umfragenormalisierung |
    | `plugin-sdk/thread-bindings-runtime` | Hilfsfunktionen für Lebenszyklus und Adapter der Thread-Bindung |
    | `plugin-sdk/agent-media-payload` | Wurzeln und Ladefunktionen für Agent-Mediennutzdaten |
    | `plugin-sdk/conversation-runtime` | Veralteter breiter Barrel für Konversations-/Thread-Bindung, Kopplung und Hilfsfunktionen für konfigurierte Bindungen; bevorzugen Sie fokussierte Bindungsunterpfade wie `plugin-sdk/thread-bindings-runtime` und `plugin-sdk/session-binding-runtime` |
    | `plugin-sdk/runtime-group-policy` | Hilfsfunktionen zur Laufzeitauflösung von Gruppenrichtlinien |
    | `plugin-sdk/channel-status` | Gemeinsame Hilfsfunktionen für Snapshots und Zusammenfassungen des Channel-Status |
    | `plugin-sdk/channel-config-primitives` | Eng gefasste Grundelemente für Channel-Konfigurationsschemas |
    | `plugin-sdk/channel-config-writes` | Hilfsfunktionen zur Autorisierung von Schreibvorgängen an der Channel-Konfiguration |
    | `plugin-sdk/channel-plugin-common` | Gemeinsame Prelude-Exporte für Channel-Plugins |
    | `plugin-sdk/allowlist-config-edit` | Hilfsfunktionen zum Bearbeiten und Lesen der Zulassungslistenkonfiguration |
    | `plugin-sdk/group-access` | Veraltete Hilfsfunktionen für Entscheidungen zum Gruppenzugriff; verwenden Sie `resolveChannelMessageIngress` aus `plugin-sdk/channel-ingress-runtime` |
    | `plugin-sdk/direct-dm`, `plugin-sdk/direct-dm-access` | Veraltete Kompatibilitätsfassaden. Verwenden Sie `plugin-sdk/channel-inbound`. |
    | `plugin-sdk/direct-dm-guard-policy` | Eng gefasste Richtlinienhilfsfunktionen für die Prä-Krypto-Prüfung direkter DMs |
    | `plugin-sdk/discord` | Veraltete Discord-Kompatibilitätsfassade für das veröffentlichte `@openclaw/discord@2026.3.13` und nachverfolgte Eigentümerkompatibilität; neue Plugins sollten generische Channel-SDK-Unterpfade verwenden |
    | `plugin-sdk/telegram-account` | Veraltete Telegram-Kompatibilitätsfassade zur Kontoauflösung für nachverfolgte Eigentümerkompatibilität; neue Plugins sollten injizierte Laufzeithilfsfunktionen oder generische Channel-SDK-Unterpfade verwenden |
    | `plugin-sdk/zalouser` | Veraltete Zalo-Personal-Kompatibilitätsfassade für veröffentlichte Lark-/Zalo-Pakete, die weiterhin die Autorisierung von Absenderbefehlen importieren; neue Plugins sollten generische Channel-SDK-Unterpfade verwenden |
    | `plugin-sdk/interactive-runtime` | Semantische Nachrichtendarstellung, -zustellung und Legacy-Hilfsfunktionen für interaktive Antworten. Siehe [Nachrichtendarstellung](/de/plugins/message-presentation) |
    | `plugin-sdk/channel-inbound` | Gemeinsame Inbound-Hilfsfunktionen für Ereignisklassifizierung, Kontexterstellung, Formatierung, Wurzeln, Entprellung, Erwähnungsabgleich, Erwähnungsrichtlinien und Inbound-Protokollierung |
    | `plugin-sdk/channel-inbound-debounce` | Eng gefasste Hilfsfunktionen zur Inbound-Entprellung |
    | `plugin-sdk/channel-mention-gating` | Eng gefasste Hilfsfunktionen für Erwähnungsrichtlinien, Erwähnungsmarkierungen und Erwähnungstext ohne die breitere Inbound-Laufzeitoberfläche |
    | `plugin-sdk/channel-envelope`, `plugin-sdk/channel-inbound-roots`, `plugin-sdk/channel-location`, `plugin-sdk/channel-logging` | Veraltete Kompatibilitätsfassaden. Verwenden Sie `plugin-sdk/channel-inbound` oder `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-pairing-paths` | Veraltete Kompatibilitätsfassade. Verwenden Sie `plugin-sdk/channel-pairing`. |
    | `plugin-sdk/channel-reply-options-runtime` | Veraltete Kompatibilitätsfassade. Verwenden Sie `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-streaming` | Veraltete Kompatibilitätsfassade. Verwenden Sie `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-send-result` | Antwort-Ergebnistypen |
    | `plugin-sdk/channel-actions` | Hilfsfunktionen für Channel-Nachrichtenaktionen sowie veraltete native Schemahilfsfunktionen, die zur Plugin-Kompatibilität beibehalten werden |
    | `plugin-sdk/channel-route` | Gemeinsame Routennormalisierung, parsergestützte Zielauflösung, String-Konvertierung von Thread-IDs, deduplizierte/kompakte Routenschlüssel, Typen geparster Ziele sowie Hilfsfunktionen zum Vergleichen von Routen und Zielen |
    | `plugin-sdk/channel-targets` | Hilfsfunktionen zum Parsen von Zielen; Aufrufer für Routenvergleiche sollten `plugin-sdk/channel-route` verwenden |
    | `plugin-sdk/channel-contract` | Channel-Vertragstypen |
    | `plugin-sdk/channel-feedback` | Verdrahtung von Feedback/Reaktionen |
  </Accordion>

Veraltete Familien von Channel-Hilfsfunktionen bleiben nur aus Kompatibilitätsgründen für veröffentlichte Plugins verfügbar. Der Plan für ihre Entfernung lautet: Sie bleiben während des Migrationszeitraums für externe Plugins erhalten, die Plugins im Repository und die gebündelten Plugins verwenden weiterhin `channel-inbound` und `channel-outbound`; anschließend werden die Kompatibilitäts-Unterpfade bei der nächsten umfassenden SDK-Bereinigung entfernt. Dies gilt für die alten Familien für Channel-Nachrichten und -Laufzeit, Channel-Streaming, direkten DM-Zugriff, abgespaltene Hilfsfunktionen für eingehende Nachrichten, Antwortoptionen und Kopplungspfade.

  <Accordion title="Provider-Unterpfade">
    | Unterpfad | Wichtige Exporte |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/lmstudio` | Unterstützte LM-Studio-Provider-Fassade für Einrichtung, Katalogerkennung und Vorbereitung von Laufzeitmodellen |
    | `plugin-sdk/lmstudio-runtime` | Unterstützte LM-Studio-Laufzeitfassade für lokale Serverstandards, Modellerkennung, Anfrage-Header und Hilfsfunktionen für geladene Modelle |
    | `plugin-sdk/provider-setup` | Kuratierte Einrichtungshilfen für lokale und selbst gehostete Provider |
    | `plugin-sdk/self-hosted-provider-setup` | Veraltete OpenAI-kompatible Einrichtungshilfen für selbst gehostete Provider; verwenden Sie `plugin-sdk/provider-setup` oder Plugin-eigene Einrichtungshilfen |
    | `plugin-sdk/cli-backend` | CLI-Backend-Standards und Watchdog-Konstanten |
    | `plugin-sdk/provider-auth-runtime` | Laufzeithilfen für die Provider-Authentifizierung: OAuth-Loopback-Ablauf, Token-Austausch, Authentifizierungspersistenz und API-Schlüsselauflösung |
    | `plugin-sdk/provider-oauth-runtime` | Generische Typen für Provider-OAuth-Callbacks, Darstellung der Callback-Seite, PKCE-/Statushilfen, Analyse der Autorisierungseingabe, Hilfen für den Token-Ablauf und Abbruchhilfen |
    | `plugin-sdk/provider-auth-api-key` | Hilfen für das Onboarding und Schreiben von Profilen mit API-Schlüsseln, etwa `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | Standard-Builder für OAuth-Authentifizierungsergebnisse |
    | `plugin-sdk/provider-env-vars` | Hilfen zum Nachschlagen von Provider-Authentifizierungsumgebungsvariablen |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials`, Hilfen zum Import der OpenAI-Codex-Authentifizierung, veralteter Kompatibilitätsexport `resolveOpenClawAgentDir` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, gemeinsam genutzte Builder für Wiederholungsrichtlinien, Hilfen für Provider-Endpunkte und gemeinsam genutzte Hilfen zur Normalisierung von Modell-IDs |
    | `plugin-sdk/provider-catalog-live-runtime` | Hilfen für Live-Provider-Modellkataloge zur abgesicherten Erkennung im Stil von `/models`: `buildLiveModelProviderConfig`, `fetchLiveProviderModelRows`, `getCachedLiveProviderModelRows`, `fetchLiveProviderModelIds`, `LiveModelCatalogHttpError`, `clearLiveCatalogCacheForTests`, Modell-ID-Filterung, TTL-Cache und statischer Fallback |
    | `plugin-sdk/provider-catalog-runtime` | Laufzeit-Hook zur Erweiterung des Provider-Katalogs und Schnittstellen der Plugin-Provider-Registry für Vertragstests |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | Generische Hilfen für HTTP-/Endpunktfähigkeiten von Providern, Provider-HTTP-Fehler und Hilfen für mehrteilige Formulare zur Audiotranskription |
    | `plugin-sdk/provider-web-fetch-contract` | Eng umrissene Vertragshilfen für Webabrufkonfiguration und -auswahl, etwa `enablePluginInConfig` und `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | Hilfen für Registrierung und Cache von Webabruf-Providern |
    | `plugin-sdk/provider-web-search-config-contract` | Eng umrissene Hilfen für Websuchkonfiguration und Zugangsdaten bei Providern, die keine Plugin-Aktivierungsverdrahtung benötigen |
    | `plugin-sdk/provider-web-search-contract` | Eng umrissene Vertragshilfen für Websuchkonfiguration und Zugangsdaten, etwa `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` sowie bereichsgebundene Setter und Getter für Zugangsdaten |
    | `plugin-sdk/provider-web-search` | Hilfen für Registrierung, Cache und Laufzeit von Websuch-Providern |
    | `plugin-sdk/embedding-providers` | Allgemeine Typen und Lesehilfen für Embedding-Provider, einschließlich `EmbeddingProviderAdapter`, `getEmbeddingProvider(...)` und `listEmbeddingProviders(...)`; Plugins registrieren Provider über `api.registerEmbeddingProvider(...)`, damit die Manifest-Zuständigkeit durchgesetzt wird |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks` sowie Schemabereinigung und Diagnose für DeepSeek/Gemini/OpenAI |
    | `plugin-sdk/provider-usage` | Typen für Provider-Nutzungsmomentaufnahmen, gemeinsam genutzte Hilfen zum Abrufen der Nutzung und Provider-Abruffunktionen wie `fetchClaudeUsage` |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, Typen für Stream-Wrapper, Kompatibilität für Werkzeugaufrufe in Klartext und gemeinsam genutzte Wrapper-Hilfen für Anthropic/Google/Kilocode/MiniMax/Moonshot/OpenAI/OpenRouter/Z.AI |
    | `plugin-sdk/provider-stream-shared` | Öffentliche, gemeinsam genutzte Hilfen für Provider-Stream-Wrapper, einschließlich `composeProviderStreamWrappers`, `createOpenAICompatibleCompletionsThinkingOffWrapper`, `createPlainTextToolCallCompatWrapper`, `createPayloadPatchStreamWrapper`, `createToolStreamWrapper`, `normalizeOpenAICompatibleReasoningPayload`, `setQwenChatTemplateThinking` sowie Anthropic-/DeepSeek-/OpenAI-kompatible Stream-Hilfen |
    | `plugin-sdk/provider-transport-runtime` | Native Hilfen für den Provider-Transport, etwa abgesicherter Abruf, Textextraktion aus Werkzeugergebnissen, Transformationen von Transportnachrichten und beschreibbare Transportereignis-Streams |
    | `plugin-sdk/provider-onboard` | Hilfen zum Patchen der Onboarding-Konfiguration |
    | `plugin-sdk/global-singleton` | Prozesslokale Hilfen für Singletons, Maps und Caches |
    | `plugin-sdk/group-activation` | Eng umrissene Hilfen für Gruppenaktivierungsmodi und Befehlsanalyse |
  </Accordion>

Provider-Nutzungsmomentaufnahmen melden normalerweise ein oder mehrere Kontingent-`windows`, jeweils mit
einer Bezeichnung, dem verbrauchten Prozentsatz und einem optionalen Rücksetzzeitpunkt. Provider, die anstelle
zurücksetzbarer Kontingentzeitfenster einen Kontostand oder Kontostatus-Text bereitstellen, sollten
`summary` mit einem leeren `windows`-Array zurückgeben, statt Prozentwerte zu erfinden.
OpenClaw zeigt diesen Zusammenfassungstext in der Statusausgabe an; verwenden Sie `error` nur, wenn der
Nutzungsendpunkt fehlgeschlagen ist oder keine nutzbaren Nutzungsdaten zurückgegeben hat.

  <Accordion title="Unterpfade für Authentifizierung und Sicherheit">
    | Unterpfad | Wichtige Exporte |
    | --- | --- |
    | `plugin-sdk/command-auth` | Veraltete, breit angelegte Oberfläche für die Befehlsautorisierung (`resolveControlCommandGate`, Hilfen für die Befehls-Registry einschließlich dynamischer Formatierung von Argumentmenüs, Hilfen zur Absenderautorisierung); verwenden Sie die Autorisierung beim Kanaleingang bzw. zur Laufzeit oder Hilfen für den Befehlsstatus |
    | `plugin-sdk/command-status` | Builder für Befehls- und Hilfenachrichten, etwa `buildCommandsMessagePaginated` und `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | Hilfen zur Auflösung von Genehmigenden und zur Aktionsautorisierung im selben Chat |
    | `plugin-sdk/approval-client-runtime` | Hilfen für native Ausführungsgenehmigungsprofile und -filter |
    | `plugin-sdk/approval-delivery-runtime` | Adapter für native Genehmigungsfunktionen und -zustellung |
    | `plugin-sdk/approval-gateway-runtime` | Gemeinsam genutzter Resolver für das Genehmigungs-Gateway |
    | `plugin-sdk/approval-reference-runtime` | Deterministische Hilfsfunktion für dauerhafte Lokatoren bei transportbedingt eingeschränkten Genehmigungs-Callbacks |
    | `plugin-sdk/approval-handler-adapter-runtime` | Leichtgewichtige Hilfen zum Laden nativer Genehmigungsadapter für häufig genutzte Kanaleinstiegspunkte |
    | `plugin-sdk/approval-handler-runtime` | Breiter angelegte Laufzeithilfen für Genehmigungs-Handler; bevorzugen Sie die engeren Adapter-/Gateway-Schnittstellen, wenn diese ausreichen |
    | `plugin-sdk/approval-native-runtime` | Hilfen für native Genehmigungsziele, Kontobindung, Routing-Gates, Weiterleitungs-Fallbacks und die Unterdrückung lokaler nativer Ausführungsaufforderungen |
    | `plugin-sdk/approval-reaction-runtime` | Fest codierte Bindungen für Genehmigungsreaktionen, Nutzlasten für Reaktionsaufforderungen, Speicher für Reaktionsziele, Hilfen für Reaktionshinweistexte und Kompatibilitätsexport zur Unterdrückung lokaler nativer Ausführungsaufforderungen |
    | `plugin-sdk/approval-reply-runtime` | Hilfen für Antwortnutzlasten bei Ausführungs-/Plugin-Genehmigungen |
    | `plugin-sdk/approval-runtime` | Hilfen für Nutzlasten bei Ausführungs-/Plugin-Genehmigungen, Builder für Genehmigungsfunktionen, Hilfen für Genehmigungsautorisierung und -profile, Hilfen für Routing und Laufzeit nativer Genehmigungen sowie Hilfen für strukturierte Genehmigungsanzeigen wie `formatApprovalDisplayPath` |
    | `plugin-sdk/reply-dedupe` | Veraltete, eng umrissene Hilfen zum Zurücksetzen der Deduplizierung eingehender Antworten |
    | `plugin-sdk/command-auth-native` | Native Befehlsautorisierung, dynamische Formatierung von Argumentmenüs und native Hilfen für Sitzungsziele |
    | `plugin-sdk/command-detection` | Gemeinsam genutzte Hilfen zur Befehlserkennung |
    | `plugin-sdk/command-primitives-runtime` | Leichtgewichtige Prädikate für Befehlstext in häufig genutzten Kanalpfaden |
    | `plugin-sdk/command-surface` | Hilfen zur Normalisierung von Befehlskörpern und für Befehlsoberflächen |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/provider-auth-login-flow-runtime` | Hilfen für verzögert geladene Provider-Authentifizierungsabläufe zur Gerätecode-Kopplung in privaten Kanälen und der Web-UI |
    | `plugin-sdk/channel-secret-runtime` | Veraltete, breit angelegte Oberfläche für Secret-Verträge (`collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment`, Typen für Secret-Ziele); bevorzugen Sie die fokussierten Unterpfade unten |
    | `plugin-sdk/channel-secret-basic-runtime` | Eng umrissene Exporte für Secret-Verträge und Builder für Ziel-Registries für Secret-Oberflächen von Kanälen/Plugins ohne TTS |
    | `plugin-sdk/channel-secret-tts-runtime` | Eng umrissene Hilfen zur Zuweisung verschachtelter Kanal-TTS-Secrets |
    | `plugin-sdk/secret-ref-runtime` | Eng umrissene Typisierung und Auflösung von SecretRef sowie Nachschlagen von Planzielpfaden für die Analyse von Secret-Verträgen und Konfigurationen |
    | `plugin-sdk/secret-provider-integration` | Ausschließlich Typen umfassende Verträge für Integrationsmanifeste und Voreinstellungen von SecretRef-Providern für Plugins, die externe Voreinstellungen für Secret-Provider veröffentlichen |
    | `plugin-sdk/security-runtime` | Veraltetes, breit angelegtes Barrel für Vertrauensprüfung, DM-Gating, auf das Stammverzeichnis beschränkte Datei-/Pfadhilfen einschließlich ausschließlich erstellender Schreibvorgänge, synchrone/asynchrone atomare Dateiersetzung, Schreiben temporärer Geschwisterdateien, Fallback beim Verschieben über Gerätegrenzen hinweg, Hilfen für private Dateispeicher, Schutzvorrichtungen für Symlink-Elternpfade, externe Inhalte, Schwärzung vertraulicher Texte, Secret-Vergleich mit konstanter Laufzeit und Hilfen zur Secret-Sammlung; bevorzugen Sie fokussierte Unterpfade für Sicherheit, SSRF und Secrets |
    | `plugin-sdk/ssrf-policy` | Hilfen für Host-Zulassungslisten und SSRF-Richtlinien für private Netzwerke |
    | `plugin-sdk/ssrf-dispatcher` | Eng umrissene Hilfen für gebundene Dispatcher ohne die breit angelegte Infrastruktur-Laufzeitoberfläche |
    | `plugin-sdk/ssrf-runtime` | Hilfen für gebundene Dispatcher, SSRF-abgesicherte Abrufe, SSRF-Fehler und SSRF-Richtlinien |
    | `plugin-sdk/secret-input` | Hilfen zur Analyse von Secret-Eingaben |
    | `plugin-sdk/webhook-ingress` | Hilfen für Webhook-Anfragen und -Ziele sowie Umwandlung roher WebSocket-/Body-Daten |
    | `plugin-sdk/webhook-request-guards` | Hilfen für Größe und Zeitüberschreitung von Anfragekörpern sowie `runDetachedWebhookWork` für nachverfolgte Verarbeitung nach der Bestätigung |
  </Accordion>

  <Accordion title="Unterpfade für Laufzeit und Speicher">
    | Unterpfad | Wichtige Exporte |
    | --- | --- |
    | `plugin-sdk/runtime` | Hilfsfunktionen für Laufzeit, Protokollierung und Sicherungen, Warnungen zu Plugin-Installationspfaden sowie Prozess-Hilfsfunktionen |
    | `plugin-sdk/runtime-env` | Eng gefasste Hilfsfunktionen für Laufzeitumgebung, Logger, Zeitüberschreitung, Wiederholungsversuche und Backoff |
    | `plugin-sdk/browser-config` | Unterstützte Browserkonfigurations-Fassade für normalisierte Profile und Standardwerte, CDP-URL-Parsing sowie Hilfsfunktionen für die Authentifizierung der Browsersteuerung |
    | `plugin-sdk/agent-harness-task-runtime` | Generische Hilfsfunktionen für Aufgabenlebenszyklus und Abschlusszustellung für Harness-gestützte Agenten mit einem vom Host ausgestellten Aufgabenbereich |
    | `plugin-sdk/codex-mcp-projection` | Reservierte gebündelte Codex-Hilfsfunktion zum Überführen der MCP-Serverkonfiguration des Benutzers in die Codex-Thread-Konfiguration; nicht für Drittanbieter-Plugins |
    | `plugin-sdk/codex-native-task-runtime` | Repository-lokale gebündelte Codex-Hilfsfunktion für die native Aufgaben-Spiegelung und Laufzeitverdrahtung; kein Paketexport |
    | `plugin-sdk/channel-runtime-context` | Generische Hilfsfunktionen zum Registrieren und Nachschlagen des Laufzeitkontexts von Kanälen |
    | `plugin-sdk/matrix` | Veraltete Matrix-Kompatibilitätsfassade für ältere Kanalpakete von Drittanbietern; neue Plugins sollten `plugin-sdk/run-command` direkt importieren |
    | `plugin-sdk/mattermost` | Veraltete Mattermost-Kompatibilitätsfassade für ältere Kanalpakete von Drittanbietern; neue Plugins sollten generische SDK-Unterpfade direkt importieren |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Veralteter breiter Sammel-Export für Hilfsfunktionen zu Plugin-Befehlen, Hooks, HTTP und Interaktionen; bevorzugen Sie gezielte Plugin-Laufzeit-Unterpfade |
    | `plugin-sdk/hook-runtime` | Veralteter breiter Sammel-Export für Hilfsfunktionen der Webhook- und internen Hook-Pipeline; bevorzugen Sie gezielte Unterpfade für Hooks und die Plugin-Laufzeit |
    | `plugin-sdk/lazy-runtime` | Hilfsfunktionen für verzögerten Laufzeitimport und -bindung wie `createLazyRuntimeModule`, `createLazyRuntimeMethod` und `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | Hilfsfunktionen zur Prozessausführung |
    | `plugin-sdk/node-host` | Hilfsfunktionen zur Auflösung ausführbarer Dateien auf dem Node-Host und zur Fortsetzung von PTYs |
    | `plugin-sdk/cli-runtime` | Veralteter breiter Sammel-Export für CLI-Formatierung, Warten, Versionen, Argumentaufrufe und verzögert geladene Befehlsgruppen; bevorzugen Sie gezielte CLI- und Laufzeit-Unterpfade |
    | `plugin-sdk/qa-runner-runtime` | Unterstützte Fassade, die Plugin-QA-Szenarien über die CLI-Befehlsoberfläche bereitstellt |
    | `plugin-sdk/tts-runtime` | Unterstützte Fassade für Konfigurationsschemas und Laufzeit-Hilfsfunktionen für Text-to-Speech |
    | `plugin-sdk/gateway-method-runtime` | Reservierte Hilfsfunktion zur Weiterleitung von Gateway-Methoden für Plugin-HTTP-Routen, die `contracts.gatewayMethodDispatch: ["authenticated-request"]` deklarieren |
    | `plugin-sdk/gateway-runtime` | Gateway-Client, Hilfsfunktion zum Starten eines für die Ereignisschleife bereiten Clients, Gateway-CLI-RPC, Gateway-Protokollfehler, Auflösung des angekündigten LAN-Hosts und Hilfsfunktionen zum Aktualisieren des Kanalstatus |
    | `plugin-sdk/config-contracts` | Eng gefasste, rein typbasierte Konfigurationsoberfläche für Plugin-Konfigurationsformen wie `OpenClawConfig` sowie Kanal- und Provider-Konfigurationstypen |
    | `plugin-sdk/plugin-config-runtime` | Hilfsfunktionen für die Plugin-Laufzeitkonfiguration wie `mergeDeep`, `requireRuntimeConfig`, `resolvePluginConfigObject` und `resolveLivePluginConfigObject` |
    | `plugin-sdk/config-mutation` | Hilfsfunktionen für transaktionale Konfigurationsänderungen wie `mutateConfigFile`, `replaceConfigFile` und `logConfigUpdated` |
    | `plugin-sdk/message-tool-delivery-hints` | Gemeinsam genutzte Hinweiszeichenfolgen für Zustellungsmetadaten von Nachrichtenwerkzeugen |
    | `plugin-sdk/runtime-config-snapshot` | Hilfsfunktionen für Momentaufnahmen der aktuellen Prozesskonfiguration wie `getRuntimeConfig`, `getRuntimeConfigSnapshot` sowie Setter für Test-Momentaufnahmen |
    | `plugin-sdk/text-autolink-runtime` | Erkennung automatisch zu verlinkender Dateiverweise ohne den breiten Text-Sammel-Export |
    | `plugin-sdk/reply-runtime` | Gemeinsam genutzte Laufzeit-Hilfsfunktionen für eingehende Nachrichten und Antworten, Segmentierung, Weiterleitung, Heartbeat und Antwortplanung |
    | `plugin-sdk/reply-dispatch-runtime` | Eng gefasste Hilfsfunktionen für Antwortweiterleitung, Abschluss und Konversationsbezeichnungen |
    | `plugin-sdk/reply-history` | Gemeinsam genutzte Hilfsfunktionen für den kurzfristigen Antwortverlauf. Neuer Code für Nachrichtendurchläufe sollte `createChannelHistoryWindow` verwenden; untergeordnete Map-Hilfsfunktionen bleiben ausschließlich veraltete Kompatibilitätsexporte |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | Eng gefasste Hilfsfunktionen zur Segmentierung von Text und Markdown |
    | `plugin-sdk/session-store-runtime` | Hilfsfunktionen für Sitzungsabläufe (`getSessionEntry`, `listSessionEntries`, `patchSessionEntry`, `upsertSessionEntry`), Reparatur- und Lebenszyklus-Hilfsfunktionen (`deleteSessionEntry`, `cleanupSessionLifecycleArtifacts`, `resolveSessionStoreBackupPaths`), Markierungs-Hilfsfunktionen für vorübergehende `sessionFile`-Werte, begrenztes Lesen des Texts aktueller Benutzer-/Assistenten-Transkripte anhand der Sitzungsidentität, Hilfsfunktionen für Sitzungsspeicherpfade und Sitzungsschlüssel sowie das Lesen des Aktualisierungszeitpunkts, ohne breite Importe für Konfigurationsschreibvorgänge und Wartung |
    | `plugin-sdk/session-transcript-runtime` | Transkriptidentität, bereichsbezogene Hilfsfunktionen für Ziel, Lesen und Schreiben, Projektion sichtbarer Nachrichteneinträge, Veröffentlichung von Aktualisierungen, Schreibsperren und Schlüssel für Treffer im Transkriptspeicher |
    | `plugin-sdk/sqlite-runtime` | Gezielt zugeschnittene Hilfsfunktionen für SQLite-Agentenschema, Pfade und Transaktionen für die Laufzeit des Erstanbieters, ohne Steuerung des Datenbanklebenszyklus |
    | `plugin-sdk/cron-store-runtime` | Hilfsfunktionen für Pfad, Laden und Speichern des Cron-Speichers |
    | `plugin-sdk/state-paths` | Hilfsfunktionen für Pfade der Status- und OAuth-Verzeichnisse |
    | `plugin-sdk/plugin-state-runtime` | Typen für schlüsselbasierten SQLite-Status in Plugin-Sidecars sowie zentralisierte Verbindungs-Pragmas, verifizierte WAL-Wartung und atomare Migrations-Hilfsfunktionen für STRICT-Schemas in Plugin-eigenen Datenbanken |
    | `plugin-sdk/routing` | Hilfsfunktionen für Routen-, Sitzungsschlüssel- und Kontobindungen wie `resolveAgentRoute`, `buildAgentSessionKey` und `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | Gemeinsam genutzte Hilfsfunktionen für Kanal- und Kontostatus-Zusammenfassungen, Standardwerte des Laufzeitstatus und Problemmetadaten |
    | `plugin-sdk/target-resolver-runtime` | Gemeinsam genutzte Hilfsfunktionen zur Zielauflösung |
    | `plugin-sdk/string-normalization-runtime` | Hilfsfunktionen zur Normalisierung von Slugs und Zeichenfolgen |
    | `plugin-sdk/request-url` | Zeichenfolgen-URLs aus Fetch-/Request-ähnlichen Eingaben extrahieren |
    | `plugin-sdk/run-command` | Zeitlich begrenzter Befehls-Runner mit normalisierten Ergebnissen für stdout/stderr |
    | `plugin-sdk/param-readers` | Allgemeine Parameterleser für Werkzeuge und CLI |
    | `plugin-sdk/tool-plugin` | Ein einfaches typisiertes Agentenwerkzeug-Plugin definieren und statische Metadaten für die Manifestgenerierung bereitstellen |
    | `plugin-sdk/tool-payload` | Normalisierte Nutzdaten aus Werkzeugergebnisobjekten extrahieren |
    | `plugin-sdk/tool-send` | Kanonische Felder des Sendeziels aus Werkzeugargumenten extrahieren |
    | `plugin-sdk/sandbox` | Typen für Sandbox-Backends und Hilfsfunktionen für SSH-/OpenShell-Befehle einschließlich Vorabprüfung für schnelles Fehlschlagen von Ausführungsbefehlen |
    | `plugin-sdk/temp-path` | Gemeinsam genutzte Hilfsfunktionen für temporäre Downloadpfade und private, sichere temporäre Arbeitsbereiche |
    | `plugin-sdk/logging-core` | Hilfsfunktionen für Subsystem-Logger und Schwärzung |
    | `plugin-sdk/markdown-table-runtime` | Hilfsfunktionen für Markdown-Tabellenmodus und -konvertierung |
    | `plugin-sdk/model-session-runtime` | Hilfsfunktionen zum Überschreiben von Modell und Sitzung wie `applyModelOverrideToSessionEntry` und `resolveAgentMaxConcurrent` |
    | `plugin-sdk/talk-config-runtime` | Hilfsfunktionen zur Auflösung der Konfiguration des Gesprächs-Providers |
    | `plugin-sdk/json-store` | Kleine Hilfsfunktionen zum Lesen und Schreiben von JSON-Status |
    | `plugin-sdk/json-unsafe-integers` | JSON-Parsing-Hilfsfunktionen, die unsichere Ganzzahlliterale als Zeichenfolgen beibehalten |
    | `plugin-sdk/file-lock` | Wiedereintrittsfähige Hilfsfunktionen für Dateisperren |
    | `plugin-sdk/persistent-dedupe` | Hilfsfunktionen für einen datenträgergestützten Deduplizierungs-Cache |
    | `plugin-sdk/acp-runtime` | ACP-Hilfsfunktionen für Laufzeit, Sitzung und Antwortweiterleitung |
    | `plugin-sdk/acp-runtime-backend` | Leichtgewichtige ACP-Hilfsfunktionen für Backend-Registrierung und Antwortweiterleitung für beim Start geladene Plugins |
    | `plugin-sdk/acp-binding-resolve-runtime` | Schreibgeschützte Auflösung von ACP-Bindungen ohne Importe zum Starten des Lebenszyklus |
    | `plugin-sdk/agent-config-primitives` | Veraltete Grundelemente für Konfigurationsschemas der Agentenlaufzeit; importieren Sie Schema-Grundelemente aus einer gepflegten Plugin-eigenen Oberfläche |
    | `plugin-sdk/boolean-param` | Toleranter Leser für boolesche Parameter |
    | `plugin-sdk/dangerous-name-runtime` | Hilfsfunktionen zur Auflösung des Abgleichs gefährlicher Namen |
    | `plugin-sdk/device-bootstrap` | Hilfsfunktionen für Geräte-Bootstrap und Kopplungstoken einschließlich `BOOTSTRAP_HANDOFF_OPERATOR_SCOPES` |
    | `plugin-sdk/extension-shared` | Gemeinsam genutzte Grundelemente für passive Kanäle, Status und Umgebungs-Proxys |
    | `plugin-sdk/models-provider-runtime` | Hilfsfunktionen für Befehls-/Provider-Antworten von `/models` |
    | `plugin-sdk/skill-commands-runtime` | Hilfsfunktionen zum Auflisten von Skill-Befehlen |
    | `plugin-sdk/native-command-registry` | Hilfsfunktionen zum Registrieren, Erstellen und Serialisieren nativer Befehle |
    | `plugin-sdk/agent-harness` | Experimentelle Oberfläche für vertrauenswürdige Plugins und Low-Level-Agenten-Harnesses: Harness-Typen, Hilfsfunktionen zum Steuern und Abbrechen aktiver Ausführungen, OpenClaw-Werkzeugbrücken-Hilfsfunktionen, Hilfsfunktionen für Richtlinien von Laufzeitplan-Werkzeugen, Klassifizierung von Terminalergebnissen, Hilfsfunktionen für Formatierung und Details des Werkzeugfortschritts sowie Dienstprogramme für Versuchsergebnisse |
    | `plugin-sdk/provider-zai-endpoint` | Veraltete Provider-eigene Fassade von Z.AI zur Endpunkterkennung; verwenden Sie die öffentliche API des Z.AI-Plugins |
    | `plugin-sdk/async-lock-runtime` | Prozesslokale asynchrone Sperr-Hilfsfunktion für kleine Laufzeit-Statusdateien |
    | `plugin-sdk/channel-activity-runtime` | Telemetrie-Hilfsfunktion für Kanalaktivität |
    | `plugin-sdk/concurrency-runtime` | Hilfsfunktion zur begrenzten Parallelität asynchroner Aufgaben |
    | `plugin-sdk/dedupe-runtime` | Hilfsfunktionen für speicherinterne und persistent gestützte Deduplizierungs-Caches |
    | `plugin-sdk/delivery-queue-runtime` | Hilfsfunktion zum Leeren ausstehender ausgehender Zustellungen |
    | `plugin-sdk/file-access-runtime` | Sichere Hilfsfunktionen für Pfade lokaler Dateien und Medienquellen |
    | `plugin-sdk/heartbeat-runtime` | Hilfsfunktionen für Heartbeat-Aktivierung, -Ereignisse und -Sichtbarkeit |
    | `plugin-sdk/expect-runtime` | Hilfsfunktion zur Zusicherung erforderlicher Werte für beweisbare Laufzeitinvarianten |
    | `plugin-sdk/number-runtime` | Hilfsfunktion zur numerischen Typumwandlung |
    | `plugin-sdk/secure-random-runtime` | Sichere Hilfsfunktionen für Token und UUIDs |
    | `plugin-sdk/system-event-runtime` | Hilfsfunktionen für die Systemereigniswarteschlange |
    | `plugin-sdk/transport-ready-runtime` | Hilfsfunktion zum Warten auf Transportbereitschaft |
    | `plugin-sdk/exec-approvals-runtime` | Hilfsfunktionen für Richtliniendateien zur Ausführungsgenehmigung ohne den breiten Infrastruktur-Laufzeit-Sammel-Export |
    | `plugin-sdk/infra-runtime` | Veralteter Kompatibilitäts-Shim; verwenden Sie die gezielten Laufzeit-Unterpfade oben |
    | `plugin-sdk/collection-runtime` | Kleine Hilfsfunktionen für begrenzte Caches |
    | `plugin-sdk/diagnostic-runtime` | Hilfsfunktionen für Diagnose-Flags, -Ereignisse und Trace-Kontexte |
    | `plugin-sdk/error-runtime` | Fehlergraph, Formatierung, gemeinsam genutzte Hilfsfunktionen zur Fehlerklassifizierung, `PlatformMessageNotDispatchedError`, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | Hilfsfunktionen für gekapseltes Fetch, Proxy, EnvHttpProxyAgent-Optionen und festgelegte Lookups |
    | `plugin-sdk/runtime-fetch` | Dispatcher-bewusstes Laufzeit-Fetch ohne Importe für Proxy oder abgesichertes Fetch |
    | `plugin-sdk/inline-image-data-url-runtime` | Hilfsfunktionen zur Bereinigung von Daten-URLs eingebetteter Bilder und zur Signaturerkennung ohne die breite Medienlaufzeit-Oberfläche |
    | `plugin-sdk/response-limit-runtime` | Nach Byteanzahl, Leerlauf und Frist begrenzte Leser für Antwortinhalte ohne die breite Medienlaufzeit-Oberfläche |
    | `plugin-sdk/session-binding-runtime` | Aktueller Bindungsstatus der Konversation ohne konfiguriertes Bindungsrouting oder Kopplungsspeicher |
    | `plugin-sdk/context-visibility-runtime` | Auflösung der Kontextsichtbarkeit und Filterung ergänzender Kontexte ohne breite Konfigurations-/Sicherheitsimporte |
    | `plugin-sdk/string-coerce-runtime` | Eng gefasste Grundelemente zur Typumwandlung und Normalisierung von Datensätzen und Zeichenfolgen ohne Markdown-/Protokollierungsimporte |
    | `plugin-sdk/html-entity-runtime` | Einmalige Dekodierung von durch Semikolons abgeschlossenen HTML5-Entitäten ohne breite Text-Dienstprogramme |
    | `plugin-sdk/text-utility-runtime` | Low-Level-Hilfsfunktionen für Text und Pfade einschließlich HTML-Escaping für fünf Entitäten |
    | `plugin-sdk/widget-html` | Erkennung vollständiger Dokumente, Größenvalidierung und Werkzeug-Eingabefehler für eigenständige HTML-Widgets |
    | `plugin-sdk/host-runtime` | Hilfsfunktionen zur Normalisierung von Hostnamen und SCP-Hosts |
    | `plugin-sdk/retry-runtime` | Hilfsfunktionen für Wiederholungsversuchskonfiguration und -ausführung |
    | `plugin-sdk/agent-runtime` | Veralteter breiter Sammel-Export für Hilfsfunktionen zu Agentenverzeichnis, -identität und -arbeitsbereich einschließlich `resolveAgentDir`, `resolveDefaultAgentDir` und des veralteten Kompatibilitätsexports `resolveOpenClawAgentDir`; bevorzugen Sie gezielte Agenten- und Laufzeit-Unterpfade |
    | `plugin-sdk/directory-runtime` | Konfigurationsgestützte Verzeichnisabfrage und Deduplizierung |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Unterpfade für Funktionen und Tests">
    | Unterpfad | Wichtige Exporte |
    | --- | --- |
    | `plugin-sdk/media-runtime` | Veraltetes umfassendes Medien-Barrel einschließlich `saveRemoteMedia`, `saveResponseMedia`, `readRemoteMediaBuffer` und des veralteten `fetchRemoteMedia`; bevorzugen Sie `plugin-sdk/media-store`, `plugin-sdk/media-mime`, `plugin-sdk/outbound-media` und Unterpfade der Funktions-Runtime sowie Store-Hilfsfunktionen vor Pufferlesevorgängen, wenn eine URL zu OpenClaw-Medien werden soll |
    | `plugin-sdk/media-mime` | Eng gefasste MIME-Normalisierung, Zuordnung von Dateierweiterungen, MIME-Erkennung und Hilfsfunktionen für Medienarten |
    | `plugin-sdk/media-store` | Eng gefasste Hilfsfunktionen für den Medienspeicher wie `saveMediaBuffer` und `saveMediaStream` |
    | `plugin-sdk/media-generation-runtime` | Gemeinsam genutzte Failover-Hilfsfunktionen für die Mediengenerierung, Kandidatenauswahl und Meldungen zu fehlenden Modellen |
    | `plugin-sdk/media-understanding` | Provider-Typen für das Medienverständnis sowie Provider-seitige Hilfsexporte für Bilder, Audio und strukturierte Extraktion |
    | `plugin-sdk/text-chunking` | Ausgehender Text und bereichsweises Chunking unter Beibehaltung der Offsets, Markdown-Chunking und Rendering-Hilfsfunktionen, anführungszeichenbewusste Tokenisierung von HTML-Tags, Konvertierung von Markdown-Tabellen, Entfernung von Direktiven-Tags und Hilfsfunktionen für sicheren Text |
    | `plugin-sdk/speech` | Typen für Sprach-Provider sowie Provider-seitige Exporte für Direktiven, Registry, Validierung, OpenAI-kompatible TTS-Builder und Sprachhilfsfunktionen |
    | `plugin-sdk/speech-core` | Gemeinsam genutzte Typen für Sprach-Provider sowie Registry-, Direktiven-, Normalisierungs- und Sprachhilfsexporte |
    | `plugin-sdk/realtime-transcription` | Typen für Echtzeit-Transkriptions-Provider, Registry-Hilfsfunktionen und gemeinsam genutzte WebSocket-Sitzungshilfsfunktion |
    | `plugin-sdk/realtime-bootstrap-context` | Hilfsfunktion zum Initialisieren von Echtzeitprofilen für die begrenzte Kontextinjektion von `IDENTITY.md`, `USER.md` und `SOUL.md` |
    | `plugin-sdk/realtime-voice` | Typen für Echtzeit-Sprach-Provider, Registry-Hilfsfunktionen und gemeinsam genutzte Hilfsfunktionen für das Echtzeit-Sprachverhalten, einschließlich der Verfolgung der Ausgabeaktivität |
    | `plugin-sdk/image-generation` | Typen für Bildgenerierungs-Provider sowie Hilfsfunktionen für Bildassets und Daten-URLs und der OpenAI-kompatible Builder für Bild-Provider |
    | `plugin-sdk/image-generation-core` | Gemeinsam genutzte Typen sowie Failover-, Authentifizierungs- und Registry-Hilfsfunktionen für die Bildgenerierung |
    | `plugin-sdk/music-generation` | Typen für Provider, Anfragen und Ergebnisse der Musikgenerierung |
    | `plugin-sdk/music-generation-core` | Veraltete gemeinsam genutzte Typen für die Musikgenerierung, Failover-Hilfsfunktionen, Provider-Suche und Analyse von Modellreferenzen; bevorzugen Sie Plugin-eigene Oberflächen für Musik-Provider |
    | `plugin-sdk/video-generation` | Typen für Provider, Anfragen und Ergebnisse der Videogenerierung |
    | `plugin-sdk/video-generation-core` | Gemeinsam genutzte Typen für die Videogenerierung, Failover-Hilfsfunktionen, Provider-Suche und Analyse von Modellreferenzen |
    | `plugin-sdk/transcripts` | Gemeinsam genutzte Typen für Provider von Transkriptquellen, Registry-Hilfsfunktionen, Sitzungsdeskriptoren und Äußerungsmetadaten |
    | `plugin-sdk/webhook-targets` | Registry für Webhook-Ziele und Hilfsfunktionen zur Routeninstallation |
    | `plugin-sdk/webhook-path` | Veralteter Kompatibilitätsalias; verwenden Sie `plugin-sdk/webhook-ingress` |
    | `plugin-sdk/web-media` | Gemeinsam genutzte Hilfsfunktionen zum Laden entfernter und lokaler Medien |
    | `plugin-sdk/zod` | Veralteter Kompatibilitäts-Reexport; importieren Sie `zod` direkt aus `zod` |
    | `plugin-sdk/plugin-test-api` | Minimale repo-lokale Hilfsfunktion `createTestPluginApi` für Unit-Tests der direkten Plugin-Registrierung, ohne Brücken zu den Testhilfsfunktionen des Repos zu importieren |
    | `plugin-sdk/agent-runtime-test-contracts` | Repo-lokale Fixtures für den Vertrag nativer Agent-Runtime-Adapter für Tests von Authentifizierung, Zustellung, Fallback, Tool-Hooks, Prompt-Overlays, Schemas und Transkriptprojektionen |
    | `plugin-sdk/channel-test-helpers` | Repo-lokale kanalorientierte Testhilfsfunktionen für generische Aktions-, Einrichtungs- und Statusverträge, Verzeichniszusicherungen, den Startlebenszyklus von Konten, die Weitergabe der Sendekonfiguration, Runtime-Mocks, Statusprobleme, ausgehende Zustellung und Hook-Registrierung |
    | `plugin-sdk/channel-target-testing` | Repo-lokale gemeinsam genutzte Suite für Fehlerfälle bei der Zielauflösung in Kanaltests |
    | `plugin-sdk/channel-contract-testing` | Repo-lokale eng gefasste Testhilfsfunktionen für Kanalverträge ohne das umfassende Test-Barrel |
    | `plugin-sdk/plugin-test-contracts` | Repo-lokale Hilfsfunktionen für Verträge zu Plugin-Paketen, Registrierung, öffentlichen Artefakten, direkten Importen, Runtime-API und Import-Nebeneffekten |
    | `plugin-sdk/plugin-state-test-runtime` | Repo-lokale Testhilfsfunktionen für Plugin-Zustandsspeicher, Ingress-Warteschlangen und Zustandsdatenbanken |
    | `plugin-sdk/provider-test-contracts` | Repo-lokale Hilfsfunktionen für Verträge zu Provider-Runtime, Authentifizierung, Erkennung, Onboarding, Katalog, Assistent, Medienfunktionen, Wiedergaberichtlinien, Echtzeit-STT-Live-Audio, Websuche/-abruf und Streams |
    | `plugin-sdk/provider-http-test-mocks` | Repo-lokale optionale Vitest-HTTP-/Authentifizierungs-Mocks für Provider-Tests, die `plugin-sdk/provider-http` verwenden |
    | `plugin-sdk/reply-payload-testing` | Repo-lokale Hilfsfunktionen zum Anhängen von Metadaten an Fixtures für Antwort-Payloads |
    | `plugin-sdk/sqlite-runtime-testing` | Repo-lokale SQLite-Lebenszyklus-Hilfsfunktionen für Erstanbieter-Tests |
    | `plugin-sdk/test-fixtures` | Repo-lokale Fixtures für generische CLI-Runtime-Erfassung, Sandbox-Kontext, Skill-Writer, Agent-Nachrichten, Systemereignisse, Modul-Neuladen, Pfade gebündelter Plugins, Terminaltext, Chunking, Authentifizierungs-Token und typisierte Fälle |
    | `plugin-sdk/test-node-mocks` | Repo-lokale fokussierte Mock-Hilfsfunktionen für integrierte Node-Module zur Verwendung innerhalb von Vitest-`vi.mock("node:*")`-Factories |
  </Accordion>

  <Accordion title="Speicher-Unterpfade">
    | Unterpfad | Wichtige Exporte |
    | --- | --- |
    | `plugin-sdk/memory-core` | Veralteter Kompatibilitätsalias; verwenden Sie `plugin-sdk/memory-host-core` |
    | `plugin-sdk/memory-core-engine-runtime` | Veraltete Runtime-Fassade für Speicherindizierung und -suche; bevorzugen Sie herstellerneutrale Unterpfade des Speicher-Hosts |
    | `plugin-sdk/memory-core-host-embedding-registry` | Leichtgewichtige Registry-Hilfsfunktionen für Provider von Speicher-Embeddings |
    | `plugin-sdk/memory-core-host-engine-foundation` | Exporte der Basis-Engine des Speicher-Hosts |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Embedding-Verträge des Speicher-Hosts, Registry-Zugriff, lokaler Provider und generische Hilfsfunktionen für Batch- und Remote-Vorgänge. `registerMemoryEmbeddingProvider` auf dieser Oberfläche ist veraltet; verwenden Sie für neue Provider die generische API für Embedding-Provider. |
    | `plugin-sdk/memory-core-host-engine-qmd` | Exporte der QMD-Engine des Speicher-Hosts |
    | `plugin-sdk/memory-core-host-engine-storage` | Exporte der Speicher-Engine des Speicher-Hosts |
    | `plugin-sdk/memory-core-host-multimodal` | Veraltete multimodale Hilfsfunktionen des Speicher-Hosts; bevorzugen Sie herstellerneutrale Unterpfade des Speicher-Hosts |
    | `plugin-sdk/memory-core-host-query` | Veraltete Abfragehilfsfunktionen des Speicher-Hosts; bevorzugen Sie herstellerneutrale Unterpfade des Speicher-Hosts |
    | `plugin-sdk/memory-core-host-secret` | Hilfsfunktionen für Geheimnisse des Speicher-Hosts |
    | `plugin-sdk/memory-core-host-events` | Veralteter Kompatibilitätsalias; verwenden Sie `plugin-sdk/memory-host-events` |
    | `plugin-sdk/memory-core-host-status` | Statushilfsfunktionen des Speicher-Hosts |
    | `plugin-sdk/memory-core-host-runtime-cli` | CLI-Runtime-Hilfsfunktionen des Speicher-Hosts |
    | `plugin-sdk/memory-core-host-runtime-core` | Kern-Runtime-Hilfsfunktionen des Speicher-Hosts |
    | `plugin-sdk/memory-core-host-runtime-files` | Datei-/Runtime-Hilfsfunktionen des Speicher-Hosts |
    | `plugin-sdk/memory-host-core` | Herstellerneutraler Alias für Kern-Runtime-Hilfsfunktionen des Speicher-Hosts |
    | `plugin-sdk/memory-host-events` | Herstellerneutraler Alias für Ereignisjournal-Hilfsfunktionen des Speicher-Hosts |
    | `plugin-sdk/memory-host-files` | Veralteter Kompatibilitätsalias; verwenden Sie `plugin-sdk/memory-core-host-runtime-files` |
    | `plugin-sdk/memory-host-markdown` | Gemeinsam genutzte Hilfsfunktionen für verwaltetes Markdown für speichernahe Plugins |
    | `plugin-sdk/memory-host-search` | Active-Memory-Runtime-Fassade für den Zugriff auf den Suchmanager |
    | `plugin-sdk/memory-host-status` | Veralteter Kompatibilitätsalias; verwenden Sie `plugin-sdk/memory-core-host-status` |
  </Accordion>

  <Accordion title="Reservierte Unterpfade für gebündelte Hilfsfunktionen">
    Reservierte SDK-Unterpfade für gebündelte Hilfsfunktionen sind eng gefasste, eigentümerspezifische Oberflächen für
    gebündelten Plugin-Code. Sie werden im SDK-Inventar erfasst, damit Paket-
    Builds und Aliasing deterministisch bleiben, sind jedoch keine allgemeinen APIs
    für die Plugin-Entwicklung. Neue wiederverwendbare Host-Verträge sollten generische SDK-Unterpfade
    wie `plugin-sdk/gateway-runtime`, `plugin-sdk/ssrf-runtime` und
    `plugin-sdk/plugin-config-runtime` verwenden.

    | Unterpfad | Eigentümer und Zweck |
    | --- | --- |
    | `plugin-sdk/codex-mcp-projection` | Hilfsfunktion des gebündelten Codex-Plugins zur Projektion der MCP-Serverkonfiguration des Benutzers in die Thread-Konfiguration des Codex-App-Servers (reservierter Paketexport) |
    | `plugin-sdk/codex-native-task-runtime` | Hilfsfunktion des gebündelten Codex-Plugins zum Spiegeln nativer Subagenten des Codex-App-Servers in den OpenClaw-Aufgabenstatus (nur repo-lokal, kein Paketexport) |

  </Accordion>
</AccordionGroup>

## Verwandte Themen

- [Übersicht über das Plugin SDK](/de/plugins/sdk-overview)
- [Einrichtung des Plugin SDK](/de/plugins/sdk-setup)
- [Plugins entwickeln](/de/plugins/building-plugins)
