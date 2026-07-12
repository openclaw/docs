---
read_when:
    - Den richtigen plugin-sdk-Unterpfad für einen Plugin-Import auswählen
    - Unterpfade gebündelter Plugins und Hilfsoberflächen prüfen
summary: 'Plugin-SDK-Unterpfadkatalog: welche Importe wo liegen, nach Bereich gruppiert'
title: Unterpfade des Plugin-SDKs
x-i18n:
    generated_at: "2026-07-12T15:48:43Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: d4ad11615c889a6a692c243f321612050388a647975b2075376e7c787df933ff
    source_path: plugins/sdk-subpaths.md
    workflow: 16
---

Das Plugin-SDK wird als Gruppe eng gefasster öffentlicher Unterpfade unter
`openclaw/plugin-sdk/` bereitgestellt. Diese Seite katalogisiert die häufig verwendeten Unterpfade, gruppiert nach
Zweck. Drei Dateien definieren die Oberfläche:

- `scripts/lib/plugin-sdk-entrypoints.json`: das gepflegte Inventar der Einstiegspunkte,
  die der Build kompiliert.
- `scripts/lib/plugin-sdk-private-local-only-subpaths.json`: repo-lokale
  Test-/interne Unterpfade. Die Paketexporte entsprechen dem Inventar abzüglich dieser Liste.
- `src/plugin-sdk/entrypoints.ts`: Klassifizierungsmetadaten für veraltete
  Unterpfade, reservierte gebündelte Hilfsfunktionen, unterstützte gebündelte Fassaden und
  öffentliche Oberflächen im Besitz von Plugins.

Maintainer prüfen die Anzahl der öffentlichen Exporte mit `pnpm plugin-sdk:surface` und
aktive reservierte Hilfsunterpfade mit `pnpm plugins:boundary-report:summary`;
ungenutzte reservierte Hilfsfunktionsexporte führen zu einem Fehler im CI-Bericht, statt als
ruhende Kompatibilitätsschuld im öffentlichen SDK zu verbleiben.

Den Leitfaden zur Plugin-Erstellung finden Sie unter [Plugin-SDK-Übersicht](/de/plugins/sdk-overview).

## Plugin-Einstieg

| Unterpfad                      | Wichtige Exporte                                                                                                                                                                                         |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/plugin-entry`      | `definePluginEntry`                                                                                                                                                                                     |
| `plugin-sdk/core`              | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema`, `buildJsonChannelConfigSchema`, `resolveTailscalePublishedHost` |
| `plugin-sdk/provider-entry`    | `defineSingleProviderPluginEntry`                                                                                                                                                                       |
| `plugin-sdk/migration`         | Hilfsfunktionen für Provider-Elemente der Migration wie `createMigrationItem`, Ursachenkonstanten, Elementstatusmarkierungen, Hilfsfunktionen zur Schwärzung und `summarizeMigrationItems`                 |
| `plugin-sdk/migration-runtime` | Laufzeit-Hilfsfunktionen für Migrationen wie `copyMigrationFileItem`, `resolvePlannedMigrationTargets`, `withCachedMigrationConfigRuntime` und `writeMigrationReport`                                    |
| `plugin-sdk/health`            | Registrierung, Erkennung, Reparatur, Auswahl, Schweregrad und Befundtypen für Doctor-Integritätsprüfungen gebündelter Integritätsverbraucher                                                            |
| `plugin-sdk/config-schema`     | Veraltet. Zod-Schema für die Stammdatei `openclaw.json` (`OpenClawSchema`); definieren Sie stattdessen Plugin-lokale Schemas und validieren Sie diese mit `plugin-sdk/json-schema-runtime`                |

### Veraltete Kompatibilitäts- und Testhilfsfunktionen

Veraltete Unterpfade bleiben für ältere Plugins exportiert, neuer Code sollte jedoch die
unten aufgeführten fokussierten SDK-Unterpfade verwenden. Die gepflegte Liste befindet sich unter
`scripts/lib/plugin-sdk-deprecated-public-subpaths.json`; CI lehnt gebündelte
Produktionsimporte daraus ab. Breite Barrel-Exporte wie `plugin-sdk/compat`,
`plugin-sdk/config-types`, `plugin-sdk/infra-runtime` und
`plugin-sdk/text-runtime` dienen nur der Kompatibilität, und `plugin-sdk/zod` ist ein
Kompatibilitäts-Reexport: Importieren Sie `zod` direkt aus `zod`. Die breiten domänenspezifischen
Barrel-Exporte `plugin-sdk/agent-runtime`, `plugin-sdk/channel-lifecycle`,
`plugin-sdk/channel-runtime`, `plugin-sdk/cli-runtime`,
`plugin-sdk/conversation-runtime`, `plugin-sdk/hook-runtime`,
`plugin-sdk/media-runtime`, `plugin-sdk/plugin-runtime` und
`plugin-sdk/security-runtime` sind zugunsten fokussierter
Unterpfade ebenfalls veraltet.

Die Vitest-basierten Testhilfs-Unterpfade von OpenClaw sind ausschließlich repo-lokal und werden
nicht mehr als Paketexporte bereitgestellt: `agent-runtime-test-contracts`,
`channel-contract-testing`, `channel-target-testing`, `channel-test-helpers`,
`plugin-state-test-runtime`, `plugin-test-api`, `plugin-test-contracts`,
`plugin-test-runtime`, `provider-http-test-mocks`, `provider-test-contracts`,
`reply-payload-testing`, `sqlite-runtime-testing`, `test-env`, `test-fixtures`,
`test-node-mocks` und `testing`. Die privaten gebündelten Hilfsoberflächen
`ssrf-runtime-internal` und `codex-native-task-runtime` sind ebenfalls ausschließlich repo-lokal.

### Reservierte Hilfsunterpfade für gebündelte Plugins

`plugin-sdk/codex-mcp-projection` ist der einzige reservierte Unterpfad: eine Plugin-eigene
Kompatibilitätsoberfläche für das gebündelte Codex-Plugin, keine allgemeine SDK-API.
Plugin-Importe über Besitzergrenzen hinweg werden durch Schutzmechanismen des Paketvertrags blockiert, und
CI schlägt fehl, wenn ein reservierter Unterpfad nicht mehr importiert wird.
`plugin-sdk/codex-native-task-runtime` ist ausschließlich repo-lokal und kein Paketexport.

`src/plugin-sdk/entrypoints.ts` erfasst außerdem unterstützte gebündelte Fassaden, also SDK-
Einstiegspunkte, die von ihrem gebündelten Plugin bereitgestellt werden, bis generische Verträge sie
ersetzen: `plugin-sdk/discord`, `plugin-sdk/lmstudio`, `plugin-sdk/lmstudio-runtime`,
`plugin-sdk/matrix`, `plugin-sdk/mattermost`,
`plugin-sdk/memory-core-engine-runtime`, `plugin-sdk/provider-zai-endpoint`,
`plugin-sdk/qa-runner-runtime`, `plugin-sdk/telegram-account`,
`plugin-sdk/tts-runtime` und `plugin-sdk/zalouser`. Mehrere davon sind auch
für neuen Code veraltet; beachten Sie die Hinweise in den jeweiligen Zeilen unten.

<AccordionGroup>
  <Accordion title="Kanal-Unterpfade">
    | Unterpfad | Wichtigste Exporte |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/json-schema-runtime` | Zwischengespeicherte Hilfsfunktion zur JSON-Schema-Validierung für Plugin-eigene Schemas |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard` sowie `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | Gemeinsame Hilfsfunktionen für Einrichtungsassistenten, Einrichtungsübersetzer, Allowlist-Abfragen und Generatoren für den Einrichtungsstatus |
    | `plugin-sdk/setup-runtime` | `createSetupTranslator`, `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | Veralteter Kompatibilitätsalias; verwenden Sie `plugin-sdk/setup-runtime` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | Hilfsfunktionen für Mehrkontenkonfiguration und Aktions-Gates sowie Hilfsfunktionen für den Rückgriff auf das Standardkonto |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, Hilfsfunktionen zur Normalisierung von Konto-IDs |
    | `plugin-sdk/account-resolution` | Hilfsfunktionen zur Kontosuche und zum Rückgriff auf das Standardkonto |
    | `plugin-sdk/account-helpers` | Eng gefasste Hilfsfunktionen für Kontolisten und Kontoaktionen |
    | `plugin-sdk/access-groups` | Hilfsfunktionen zum Parsen von Zugriffsgruppen-Allowlists und für redigierte Gruppendiagnosen |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | Veraltete Kompatibilitätsfassade. Verwenden Sie `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
    | `plugin-sdk/channel-config-schema` | Gemeinsame Primitive für Kanalkonfigurationsschemas sowie Zod- und direkte JSON-/TypeBox-Generatoren |
    | `plugin-sdk/bundled-channel-config-schema` | Gebündelte OpenClaw-Kanalkonfigurationsschemas ausschließlich für gepflegte gebündelte Plugins |
    | `plugin-sdk/chat-channel-ids` | `BUNDLED_CHAT_CHANNEL_IDS`, `BUNDLED_CHAT_CHANNEL_ENVELOPE_PREFIXES`, `ChatChannelId`. Kanonische IDs gebündelter/offizieller Chatkanäle sowie Formatierungsbezeichnungen/-aliase für Plugins, die Text mit Envelope-Präfix erkennen müssen, ohne eine eigene Tabelle hart zu codieren. |
    | `plugin-sdk/channel-config-schema-legacy` | Veralteter Kompatibilitätsalias für gebündelte Kanalkonfigurationsschemas |
    | `plugin-sdk/telegram-command-config` | Veraltete Normalisierung von Telegram-Befehlsnamen/-beschreibungen sowie Prüfungen auf Duplikate und Konflikte; verwenden Sie in neuem Plugin-Code die Plugin-lokale Verarbeitung der Befehlskonfiguration |
    | `plugin-sdk/command-gating` | Eng gefasste Hilfsfunktionen für Gates zur Befehlsautorisierung |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-ingress` | Niedrig angesetzte Kompatibilitätsschnittstelle für den Kanaleingang. Neue Empfangspfade sollten `plugin-sdk/channel-ingress-runtime` verwenden. |
    | `plugin-sdk/channel-ingress-runtime` | Experimenteller, hoch angesetzter Laufzeit-Resolver für den Kanaleingang und Generatoren für Routing-Fakten für migrierte Empfangspfade von Kanälen. Bevorzugen Sie dies gegenüber dem Zusammenstellen wirksamer Allowlists, Befehls-Allowlists und Legacy-Projektionen in jedem Plugin. Siehe [API für den Kanaleingang](/de/plugins/sdk-channel-ingress). |
    | `plugin-sdk/channel-lifecycle` | Veraltete Kompatibilitätsfassade. Verwenden Sie `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-outbound` | Verträge für den Nachrichtenlebenszyklus sowie Optionen für die Antwort-Pipeline, Empfangsbestätigungen, Live-Vorschau/Streaming, Lebenszyklus-Hilfsfunktionen, ausgehende Identität, Nutzlastplanung, dauerhafte Sendevorgänge und Hilfsfunktionen für den Kontext des Nachrichtenversands. Siehe [API für den Kanalausgang](/de/plugins/sdk-channel-outbound). |
    | `plugin-sdk/channel-message` | Veralteter Kompatibilitätsalias für `plugin-sdk/channel-outbound` sowie Legacy-Fassaden für die Antwortweiterleitung. |
    | `plugin-sdk/channel-message-runtime` | Veralteter Kompatibilitätsalias für `plugin-sdk/channel-outbound` sowie Legacy-Fassaden für die Antwortweiterleitung. |
    | `plugin-sdk/inbound-envelope` | Gemeinsame Hilfsfunktionen zum Erstellen eingehender Routen und Envelopes |
    | `plugin-sdk/inbound-reply-dispatch` | Veraltete Kompatibilitätsfassade. Verwenden Sie `plugin-sdk/channel-inbound` für eingehende Runner und Weiterleitungsprädikate sowie `plugin-sdk/channel-outbound` für Hilfsfunktionen zur Nachrichtenzustellung. |
    | `plugin-sdk/messaging-targets` | Veralteter Alias zum Parsen von Zielen; verwenden Sie `plugin-sdk/channel-targets` |
    | `plugin-sdk/outbound-media` | Gemeinsame Hilfsfunktionen zum Laden ausgehender Medien und für den Zustand gehosteter Medien |
    | `plugin-sdk/outbound-send-deps` | Veraltete Kompatibilitätsfassade. Verwenden Sie `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/outbound-runtime` | Veraltete Kompatibilitätsfassade. Verwenden Sie `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/poll-runtime` | Eng gefasste Hilfsfunktionen zur Normalisierung von Umfragen |
    | `plugin-sdk/thread-bindings-runtime` | Hilfsfunktionen für den Lebenszyklus von Thread-Bindungen und für Adapter |
    | `plugin-sdk/agent-media-payload` | Stammverzeichnisse und Loader für Agenten-Mediennutzlasten |
    | `plugin-sdk/conversation-runtime` | Veralteter breiter Barrel-Export für Konversations-/Thread-Bindungen, Kopplung und Hilfsfunktionen für konfigurierte Bindungen; bevorzugen Sie fokussierte Bindungs-Unterpfade wie `plugin-sdk/thread-bindings-runtime` und `plugin-sdk/session-binding-runtime` |
    | `plugin-sdk/runtime-group-policy` | Laufzeit-Hilfsfunktionen zur Auflösung von Gruppenrichtlinien |
    | `plugin-sdk/channel-status` | Gemeinsame Hilfsfunktionen für Momentaufnahmen und Zusammenfassungen des Kanalstatus |
    | `plugin-sdk/channel-config-primitives` | Eng gefasste Primitive für Kanalkonfigurationsschemas |
    | `plugin-sdk/channel-config-writes` | Hilfsfunktionen zur Autorisierung von Schreibvorgängen an der Kanalkonfiguration |
    | `plugin-sdk/channel-plugin-common` | Gemeinsame Präambel-Exporte für Kanal-Plugins |
    | `plugin-sdk/allowlist-config-edit` | Hilfsfunktionen zum Bearbeiten und Lesen der Allowlist-Konfiguration |
    | `plugin-sdk/group-access` | Veraltete Hilfsfunktionen für Entscheidungen zum Gruppenzugriff; verwenden Sie `resolveChannelMessageIngress` aus `plugin-sdk/channel-ingress-runtime` |
    | `plugin-sdk/direct-dm`, `plugin-sdk/direct-dm-access` | Veraltete Kompatibilitätsfassaden. Verwenden Sie `plugin-sdk/channel-inbound`. |
    | `plugin-sdk/direct-dm-guard-policy` | Eng gefasste Richtlinien-Hilfsfunktionen für den Direct-DM-Guard vor der Kryptografie |
    | `plugin-sdk/discord` | Veraltete Discord-Kompatibilitätsfassade für das veröffentlichte `@openclaw/discord@2026.3.13` und die nachverfolgte Eigentümerkompatibilität; neue Plugins sollten generische Kanal-SDK-Unterpfade verwenden |
    | `plugin-sdk/telegram-account` | Veraltete Telegram-Kompatibilitätsfassade für die Kontoauflösung zur nachverfolgten Eigentümerkompatibilität; neue Plugins sollten injizierte Laufzeit-Hilfsfunktionen oder generische Kanal-SDK-Unterpfade verwenden |
    | `plugin-sdk/zalouser` | Veraltete Kompatibilitätsfassade für Zalo Personal für veröffentlichte Lark-/Zalo-Pakete, die weiterhin die Autorisierung von Absenderbefehlen importieren; neue Plugins sollten generische Kanal-SDK-Unterpfade verwenden |
    | `plugin-sdk/interactive-runtime` | Semantische Darstellung und Zustellung von Nachrichten sowie Legacy-Hilfsfunktionen für interaktive Antworten. Siehe [Nachrichtendarstellung](/de/plugins/message-presentation) |
    | `plugin-sdk/channel-inbound` | Gemeinsame Hilfsfunktionen für Ereignisklassifizierung, Kontexterstellung, Formatierung, Stammverzeichnisse, Entprellung, Erwähnungsabgleich, Erwähnungsrichtlinien und Protokollierung eingehender Nachrichten |
    | `plugin-sdk/channel-inbound-debounce` | Eng gefasste Hilfsfunktionen zur Entprellung eingehender Nachrichten |
    | `plugin-sdk/channel-mention-gating` | Eng gefasste Hilfsfunktionen für Erwähnungsrichtlinien, Erwähnungsmarkierungen und Erwähnungstext ohne die breitere Laufzeitschnittstelle für eingehende Nachrichten |
    | `plugin-sdk/channel-envelope`, `plugin-sdk/channel-inbound-roots`, `plugin-sdk/channel-location`, `plugin-sdk/channel-logging` | Veraltete Kompatibilitätsfassaden. Verwenden Sie `plugin-sdk/channel-inbound` oder `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-pairing-paths` | Veraltete Kompatibilitätsfassade. Verwenden Sie `plugin-sdk/channel-pairing`. |
    | `plugin-sdk/channel-reply-options-runtime` | Veraltete Kompatibilitätsfassade. Verwenden Sie `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-streaming` | Veraltete Kompatibilitätsfassade. Verwenden Sie `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-send-result` | Ergebnistypen für Antworten |
    | `plugin-sdk/channel-actions` | Hilfsfunktionen für Kanalnachrichtenaktionen sowie veraltete native Schema-Hilfsfunktionen, die für die Plugin-Kompatibilität beibehalten werden |
    | `plugin-sdk/channel-route` | Gemeinsame Hilfsfunktionen für Routennormalisierung, parsergestützte Zielauflösung, Umwandlung von Thread-IDs in Zeichenfolgen, Deduplizierung/Komprimierung von Routenschlüsseln, Typen geparster Ziele und den Vergleich von Routen/Zielen |
    | `plugin-sdk/channel-targets` | Hilfsfunktionen zum Parsen von Zielen; Aufrufer für Routenvergleiche sollten `plugin-sdk/channel-route` verwenden |
    | `plugin-sdk/channel-contract` | Typen für Kanalverträge |
    | `plugin-sdk/channel-feedback` | Verknüpfung von Feedback/Reaktionen |
  </Accordion>

Veraltete Familien von Kanal-Hilfsfunktionen bleiben nur zur Kompatibilität mit
veröffentlichten Plugins verfügbar. Der Plan für ihre Entfernung lautet: Sie
bleiben während des Migrationszeitraums für externe Plugins erhalten,
Repository- und gebündelte Plugins bleiben auf `channel-inbound` und
`channel-outbound`, anschließend werden die Kompatibilitäts-Unterpfade bei der
nächsten größeren SDK-Bereinigung entfernt. Dies gilt für die alten Familien
für Kanalnachrichten/-laufzeit, Kanal-Streaming, Direct-DM-Zugriff,
abgespaltene Hilfsfunktionen für eingehende Nachrichten, Antwortoptionen und
Kopplungspfade.

  <Accordion title="Provider-Unterpfade">
    | Unterpfad | Wichtigste Exporte |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/lmstudio` | Unterstützte LM-Studio-Provider-Fassade für Einrichtung, Katalogerkennung und Vorbereitung von Laufzeitmodellen |
    | `plugin-sdk/lmstudio-runtime` | Unterstützte LM-Studio-Laufzeitfassade für lokale Serverstandards, Modellerkennung, Anfrage-Header und Hilfsfunktionen für geladene Modelle |
    | `plugin-sdk/provider-setup` | Kuratierte Einrichtungshilfen für lokale bzw. selbst gehostete Provider |
    | `plugin-sdk/self-hosted-provider-setup` | Veraltete OpenAI-kompatible Einrichtungshilfen für selbst gehostete Systeme; verwenden Sie `plugin-sdk/provider-setup` oder Plugin-eigene Einrichtungshilfen |
    | `plugin-sdk/cli-backend` | CLI-Backend-Standards und Watchdog-Konstanten |
    | `plugin-sdk/provider-auth-runtime` | Laufzeithilfen für die Provider-Authentifizierung: OAuth-Loopback-Ablauf, Token-Austausch, Authentifizierungspersistenz und API-Schlüsselauflösung |
    | `plugin-sdk/provider-oauth-runtime` | Generische OAuth-Callback-Typen für Provider, Rendering der Callback-Seite, PKCE-/Statushilfen, Analyse der Autorisierungseingabe, Hilfen für den Token-Ablauf und Abbruchhilfen |
    | `plugin-sdk/provider-auth-api-key` | Hilfen für das Onboarding und Schreiben von Profilen mit API-Schlüsseln, beispielsweise `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | Standardmäßiger Builder für OAuth-Authentifizierungsergebnisse |
    | `plugin-sdk/provider-env-vars` | Hilfen zum Nachschlagen von Umgebungsvariablen für die Provider-Authentifizierung |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials`, Hilfen zum Importieren der OpenAI-Codex-Authentifizierung, veralteter Kompatibilitätsexport `resolveOpenClawAgentDir` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, gemeinsam genutzte Builder für Wiederholungsrichtlinien, Hilfen für Provider-Endpunkte und gemeinsam genutzte Hilfen zur Normalisierung von Modell-IDs |
    | `plugin-sdk/provider-catalog-live-runtime` | Hilfen für Live-Provider-Modellkataloge zur abgesicherten Erkennung im Stil von `/models`: `buildLiveModelProviderConfig`, `fetchLiveProviderModelRows`, `getCachedLiveProviderModelRows`, `fetchLiveProviderModelIds`, `LiveModelCatalogHttpError`, `clearLiveCatalogCacheForTests`, Modell-ID-Filterung, TTL-Cache und statischer Fallback |
    | `plugin-sdk/provider-catalog-runtime` | Laufzeit-Hook zur Erweiterung des Provider-Katalogs und Schnittstellen der Plugin-Provider-Registry für Vertragstests |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | Generische Hilfen für HTTP-/Endpunktfähigkeiten von Providern, Provider-HTTP-Fehler und Hilfen für Multipart-Formulare zur Audiotranskription |
    | `plugin-sdk/provider-web-fetch-contract` | Eng gefasste Hilfen für Konfigurations- und Auswahlverträge beim Webabruf, beispielsweise `enablePluginInConfig` und `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | Hilfen für Registrierung und Caching von Webabruf-Providern |
    | `plugin-sdk/provider-web-search-config-contract` | Eng gefasste Konfigurations- und Anmeldedatenhilfen für Websuche-Provider, die keine Verdrahtung zur Plugin-Aktivierung benötigen |
    | `plugin-sdk/provider-web-search-contract` | Eng gefasste Hilfen für Konfigurations- und Anmeldedatenverträge der Websuche, beispielsweise `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` sowie bereichsgebundene Setter und Getter für Anmeldedaten |
    | `plugin-sdk/provider-web-search` | Hilfen für Registrierung, Caching und Laufzeit von Websuche-Providern |
    | `plugin-sdk/embedding-providers` | Allgemeine Typen und Lesehilfen für Embedding-Provider, einschließlich `EmbeddingProviderAdapter`, `getEmbeddingProvider(...)` und `listEmbeddingProviders(...)`; Plugins registrieren Provider über `api.registerEmbeddingProvider(...)`, damit die Eigentümerschaft des Manifests durchgesetzt wird |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks` sowie Schemabereinigung und Diagnostik für DeepSeek/Gemini/OpenAI |
    | `plugin-sdk/provider-usage` | Typen für Provider-Nutzungsmomentaufnahmen, gemeinsam genutzte Hilfen zum Abrufen der Nutzung sowie Provider-Abruffunktionen wie `fetchClaudeUsage` |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, Typen für Stream-Wrapper, Kompatibilität für Werkzeugaufrufe in Klartext und gemeinsam genutzte Wrapper-Hilfen für Anthropic/Google/Kilocode/MiniMax/Moonshot/OpenAI/OpenRouter/Z.AI |
    | `plugin-sdk/provider-stream-shared` | Öffentliche, gemeinsam genutzte Wrapper-Hilfen für Provider-Streams, einschließlich `composeProviderStreamWrappers`, `createOpenAICompatibleCompletionsThinkingOffWrapper`, `createPlainTextToolCallCompatWrapper`, `createPayloadPatchStreamWrapper`, `createToolStreamWrapper`, `normalizeOpenAICompatibleReasoningPayload`, `setQwenChatTemplateThinking` sowie Stream-Dienstprogramme für Anthropic/DeepSeek/OpenAI-kompatible Systeme |
    | `plugin-sdk/provider-transport-runtime` | Native Transporthilfen für Provider, beispielsweise abgesicherter Abruf, Textextraktion aus Werkzeugergebnissen, Transformationen von Transportnachrichten und beschreibbare Transportereignis-Streams |
    | `plugin-sdk/provider-onboard` | Hilfen zum Patchen der Onboarding-Konfiguration |
    | `plugin-sdk/global-singleton` | Prozesslokale Hilfen für Singletons, Maps und Caches |
    | `plugin-sdk/group-activation` | Eng gefasste Hilfen für den Gruppenaktivierungsmodus und die Befehlsanalyse |
  </Accordion>

Momentaufnahmen der Provider-Nutzung melden normalerweise ein oder mehrere Kontingent-`windows`, jeweils mit
einer Bezeichnung, dem verwendeten Prozentsatz und einer optionalen Rücksetzzeit. Provider, die anstelle
zurücksetzbarer Kontingentfenster einen Kontostand oder Text zum Kontostatus bereitstellen, sollten
`summary` mit einem leeren `windows`-Array zurückgeben, statt Prozentwerte zu erfinden.
OpenClaw zeigt diesen Zusammenfassungstext in der Statusausgabe an; verwenden Sie `error` nur, wenn der
Nutzungsendpunkt fehlgeschlagen ist oder keine verwendbaren Nutzungsdaten zurückgegeben hat.

  <Accordion title="Unterpfade für Authentifizierung und Sicherheit">
    | Unterpfad | Wichtigste Exporte |
    | --- | --- |
    | `plugin-sdk/command-auth` | Veraltete, breit gefasste Oberfläche zur Befehlsautorisierung (`resolveControlCommandGate`, Hilfen für die Befehls-Registry einschließlich der Formatierung dynamischer Argumentmenüs, Hilfen zur Absenderautorisierung); verwenden Sie die Autorisierung beim Kanaleingang bzw. zur Laufzeit oder Hilfen zum Befehlsstatus |
    | `plugin-sdk/command-status` | Builder für Befehls- und Hilfenachrichten wie `buildCommandsMessagePaginated` und `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | Hilfen zur Auflösung von Genehmigenden und zur Aktionsauthentifizierung innerhalb desselben Chats |
    | `plugin-sdk/approval-client-runtime` | Hilfen für native Ausführungsgenehmigungsprofile und -filter |
    | `plugin-sdk/approval-delivery-runtime` | Adapter für native Genehmigungsfähigkeiten und -zustellung |
    | `plugin-sdk/approval-gateway-runtime` | Gemeinsam genutzte Auflösung des Genehmigungs-Gateways |
    | `plugin-sdk/approval-reference-runtime` | Deterministische Hilfsfunktion für dauerhafte Lokatoren bei transportbeschränkten Genehmigungs-Callbacks |
    | `plugin-sdk/approval-handler-adapter-runtime` | Leichtgewichtige Hilfen zum Laden nativer Genehmigungsadapter für häufig aufgerufene Kanaleinstiegspunkte |
    | `plugin-sdk/approval-handler-runtime` | Breiter gefasste Laufzeithilfen für Genehmigungs-Handler; bevorzugen Sie die engeren Adapter-/Gateway-Schnittstellen, wenn diese ausreichen |
    | `plugin-sdk/approval-native-runtime` | Hilfen für native Genehmigungsziele, Kontobindung, Routen-Gates, Weiterleitungs-Fallbacks und die Unterdrückung lokaler nativer Ausführungsaufforderungen |
    | `plugin-sdk/approval-reaction-runtime` | Fest codierte Bindungen für Genehmigungsreaktionen, Nutzlasten für Reaktionsaufforderungen, Speicher für Reaktionsziele, Hilfen für Reaktionshinweistexte und Kompatibilitätsexport zur Unterdrückung lokaler nativer Ausführungsaufforderungen |
    | `plugin-sdk/approval-reply-runtime` | Hilfen für Antwortnutzlasten zu Ausführungs-/Plugin-Genehmigungen |
    | `plugin-sdk/approval-runtime` | Hilfen für Nutzlasten zu Ausführungs-/Plugin-Genehmigungen, Builder für Genehmigungsfähigkeiten, Hilfen für Genehmigungsauthentifizierung und -profile, Hilfen für native Genehmigungsweiterleitung und -laufzeit sowie Hilfen für strukturierte Genehmigungsanzeigen wie `formatApprovalDisplayPath` |
    | `plugin-sdk/reply-dedupe` | Veraltete, eng gefasste Hilfen zum Zurücksetzen der Deduplizierung eingehender Antworten |
    | `plugin-sdk/command-auth-native` | Native Befehlsauthentifizierung, Formatierung dynamischer Argumentmenüs und native Hilfen für Sitzungsziele |
    | `plugin-sdk/command-detection` | Gemeinsam genutzte Hilfen zur Befehlserkennung |
    | `plugin-sdk/command-primitives-runtime` | Leichtgewichtige Prädikate für Befehlstext in häufig aufgerufenen Kanalpfaden |
    | `plugin-sdk/command-surface` | Hilfen zur Normalisierung von Befehlstexten und für Befehlsoberflächen |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/provider-auth-login-flow-runtime` | Verzögert geladene Hilfen für Provider-Authentifizierungsanmeldeabläufe zur Gerätekopplung in privaten Kanälen und der Web-UI |
    | `plugin-sdk/channel-secret-runtime` | Veraltete, breit gefasste Oberfläche für Geheimnisverträge (`collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment`, Typen für Geheimnisziele); bevorzugen Sie die fokussierten Unterpfade weiter unten |
    | `plugin-sdk/channel-secret-basic-runtime` | Eng gefasste Exporte für Geheimnisverträge von Kanal-/Plugin-Geheimnisoberflächen ohne TTS |
    | `plugin-sdk/channel-secret-tts-runtime` | Eng gefasste Hilfen zur Zuweisung verschachtelter TTS-Geheimnisse für Kanäle |
    | `plugin-sdk/secret-ref-runtime` | Eng gefasste Typisierung und Auflösung von SecretRef sowie Suche nach Plan-Zielpfaden für die Analyse von Geheimnisverträgen und Konfigurationen |
    | `plugin-sdk/secret-provider-integration` | Reine Typverträge für Integrationsmanifeste und Voreinstellungen von SecretRef-Providern für Plugins, die Voreinstellungen externer Geheimnis-Provider veröffentlichen |
    | `plugin-sdk/security-runtime` | Veraltetes, breit gefasstes Barrel für Vertrauen, DM-Zugriffskontrolle, auf das Stammverzeichnis begrenzte Datei-/Pfadhilfen einschließlich ausschließlich erstellender Schreibvorgänge, synchrone/asynchrone atomare Dateiersetzung, Schreiben temporärer Geschwisterdateien, Fallback für Verschiebungen zwischen Geräten, Hilfen für private Dateispeicher, Schutz vor Symlink-Elternverzeichnissen, externe Inhalte, Schwärzung sensibler Texte, Geheimnisvergleiche mit konstanter Laufzeit und Hilfen zur Geheimniserfassung; bevorzugen Sie fokussierte Unterpfade für Sicherheit, SSRF und Geheimnisse |
    | `plugin-sdk/ssrf-policy` | Hilfen für Host-Zulassungslisten und SSRF-Richtlinien für private Netzwerke |
    | `plugin-sdk/ssrf-dispatcher` | Eng gefasste Hilfen für gebundene Dispatcher ohne die breit gefasste Infrastruktur-Laufzeitoberfläche |
    | `plugin-sdk/ssrf-runtime` | Hilfen für gebundene Dispatcher, SSRF-abgesicherten Abruf, SSRF-Fehler und SSRF-Richtlinien |
    | `plugin-sdk/secret-input` | Hilfen zur Analyse von Geheimniseingaben |
    | `plugin-sdk/webhook-ingress` | Hilfen für Webhook-Anfragen und -Ziele sowie Umwandlung von Roh-WebSocket-Daten und Anfragekörpern |
    | `plugin-sdk/webhook-request-guards` | Hilfen für Größe und Zeitüberschreitung von Anfragekörpern |
  </Accordion>

  <Accordion title="Runtime and storage subpaths">
    | Unterpfad | Wichtige Exporte |
    | --- | --- |
    | `plugin-sdk/runtime` | Hilfsfunktionen für Laufzeit, Protokollierung, Sicherungen und Prozesse sowie Warnungen zu Plugin-Installationspfaden |
    | `plugin-sdk/runtime-env` | Eng gefasste Hilfsfunktionen für Laufzeitumgebung, Logger, Zeitüberschreitungen, Wiederholungsversuche und Backoff |
    | `plugin-sdk/browser-config` | Unterstützte Browserkonfigurationsfassade für normalisierte Profile/Standardwerte, das Parsen von CDP-URLs und Hilfsfunktionen zur Authentifizierung der Browsersteuerung |
    | `plugin-sdk/agent-harness-task-runtime` | Generische Hilfsfunktionen für Aufgabenlebenszyklus und Abschlusszustellung für Harness-gestützte Agenten mit einem vom Host ausgegebenen Aufgabenbereich |
    | `plugin-sdk/codex-mcp-projection` | Reservierte gebündelte Codex-Hilfsfunktion zur Übertragung der benutzerseitigen MCP-Serverkonfiguration in die Codex-Threadkonfiguration; nicht für Plugins von Drittanbietern |
    | `plugin-sdk/codex-native-task-runtime` | Repository-lokale gebündelte Codex-Hilfsfunktion für die native Verkabelung von Aufgabenspiegelung und Laufzeit; kein Paketexport |
    | `plugin-sdk/channel-runtime-context` | Generische Hilfsfunktionen zur Registrierung und Suche des Laufzeitkontexts von Kanälen |
    | `plugin-sdk/matrix` | Veraltete Matrix-Kompatibilitätsfassade für ältere Kanalpakete von Drittanbietern; neue Plugins sollten `plugin-sdk/run-command` direkt importieren |
    | `plugin-sdk/mattermost` | Veraltete Mattermost-Kompatibilitätsfassade für ältere Kanalpakete von Drittanbietern; neue Plugins sollten generische SDK-Unterpfade direkt importieren |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Veralteter breiter Sammel-Export für Hilfsfunktionen zu Plugin-Befehlen, Hooks, HTTP und Interaktionen; bevorzugen Sie gezielte Unterpfade der Plugin-Laufzeit |
    | `plugin-sdk/hook-runtime` | Veralteter breiter Sammel-Export für Hilfsfunktionen der Webhook-/internen Hook-Pipeline; bevorzugen Sie gezielte Unterpfade der Hook-/Plugin-Laufzeit |
    | `plugin-sdk/lazy-runtime` | Hilfsfunktionen für verzögerten Laufzeitimport und -bindung wie `createLazyRuntimeModule`, `createLazyRuntimeMethod` und `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | Hilfsfunktionen zur Prozessausführung |
    | `plugin-sdk/cli-runtime` | Veralteter breiter Sammel-Export für CLI-Formatierung, Warten, Versionen, Argumentaufrufe und verzögert geladene Befehlsgruppen; bevorzugen Sie gezielte CLI-/Laufzeitunterpfade |
    | `plugin-sdk/qa-live-transport-scenarios` | Gemeinsam genutzte IDs für QA-Szenarien von Live-Transporten, Hilfsfunktionen für die grundlegende Abdeckung und eine Hilfsfunktion zur Szenarioauswahl |
    | `plugin-sdk/qa-runner-runtime` | Unterstützte Fassade, die Plugin-QA-Szenarien über die CLI-Befehlsoberfläche bereitstellt |
    | `plugin-sdk/tts-runtime` | Unterstützte Fassade für Konfigurationsschemas und Laufzeithilfsfunktionen der Sprachsynthese |
    | `plugin-sdk/gateway-method-runtime` | Reservierte Hilfsfunktion zur Weiterleitung von Gateway-Methoden für Plugin-HTTP-Routen, die `contracts.gatewayMethodDispatch: ["authenticated-request"]` deklarieren |
    | `plugin-sdk/gateway-runtime` | Gateway-Client, Hilfsfunktion zum ereignisschleifenbereiten Start des Clients, Gateway-CLI-RPC, Gateway-Protokollfehler, Auflösung angekündigter LAN-Hosts und Hilfsfunktionen zum Aktualisieren des Kanalstatus |
    | `plugin-sdk/config-contracts` | Fokussierte reine Typoberfläche für Plugin-Konfigurationsstrukturen wie `OpenClawConfig` sowie Konfigurationstypen für Kanäle und Provider |
    | `plugin-sdk/plugin-config-runtime` | Hilfsfunktionen zur Laufzeitsuche von Plugin-Konfigurationen wie `requireRuntimeConfig`, `resolvePluginConfigObject` und `resolveLivePluginConfigObject` |
    | `plugin-sdk/config-mutation` | Hilfsfunktionen für transaktionale Konfigurationsänderungen wie `mutateConfigFile`, `replaceConfigFile` und `logConfigUpdated` |
    | `plugin-sdk/message-tool-delivery-hints` | Gemeinsam genutzte Hinweiszeichenfolgen für Zustellungsmetadaten von Nachrichtenwerkzeugen |
    | `plugin-sdk/runtime-config-snapshot` | Hilfsfunktionen für Momentaufnahmen der aktuellen Prozesskonfiguration wie `getRuntimeConfig`, `getRuntimeConfigSnapshot` sowie Setter für Testmomentaufnahmen |
    | `plugin-sdk/text-autolink-runtime` | Erkennung automatischer Verlinkungen von Dateiverweisen ohne den breiten Text-Sammel-Export |
    | `plugin-sdk/reply-runtime` | Gemeinsam genutzte Laufzeithilfsfunktionen für eingehende Nachrichten und Antworten, Aufteilung, Weiterleitung, Heartbeat und Antwortplanung |
    | `plugin-sdk/reply-dispatch-runtime` | Eng gefasste Hilfsfunktionen für Antwortweiterleitung/-abschluss und Konversationsbezeichnungen |
    | `plugin-sdk/reply-history` | Gemeinsam genutzte Hilfsfunktionen für kurzfristige Antwortverläufe. Neuer Code für Nachrichteninteraktionen sollte `createChannelHistoryWindow` verwenden; untergeordnete Map-Hilfsfunktionen bleiben ausschließlich als veraltete Kompatibilitätsexporte erhalten |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | Eng gefasste Hilfsfunktionen zur Aufteilung von Text/Markdown |
    | `plugin-sdk/session-store-runtime` | Hilfsfunktionen für Sitzungsabläufe (`getSessionEntry`, `listSessionEntries`, `patchSessionEntry`, `upsertSessionEntry`), Reparatur-/Lebenszyklushilfsfunktionen (`deleteSessionEntry`, `cleanupSessionLifecycleArtifacts`, `resolveSessionStoreBackupPaths`), Markierungshilfsfunktionen für übergangsweise `sessionFile`-Werte, begrenztes Lesen kürzlich aufgezeichneter Benutzer-/Assistententexte anhand der Sitzungsidentität, Hilfsfunktionen für Sitzungsspeicherpfad und Sitzungsschlüssel sowie Lesen des Aktualisierungszeitpunkts, ohne breite Importe für Konfigurationsschreibvorgänge/-wartung |
    | `plugin-sdk/session-transcript-runtime` | Transkriptidentität, bereichsgebundene Hilfsfunktionen für Ziel, Lesen und Schreiben, Projektion sichtbarer Nachrichteneinträge, Veröffentlichung von Aktualisierungen, Schreibsperren und Trefferschlüssel für den Transkriptspeicher |
    | `plugin-sdk/sqlite-runtime` | Fokussierte Hilfsfunktionen für SQLite-Agentenschema, Pfade und Transaktionen der Erstanbieterlaufzeit, ohne Steuerung des Datenbanklebenszyklus |
    | `plugin-sdk/cron-store-runtime` | Hilfsfunktionen für Pfad, Laden und Speichern des Cron-Speichers |
    | `plugin-sdk/state-paths` | Hilfsfunktionen für Pfade der Status-/OAuth-Verzeichnisse |
    | `plugin-sdk/plugin-state-runtime` | Typen für schlüsselbasierten Zustand in Plugin-Sidecar-SQLite-Datenbanken sowie zentralisierte Einrichtung von Verbindungs-Pragmas und WAL-Wartung für Plugin-eigene Datenbanken |
    | `plugin-sdk/routing` | Hilfsfunktionen für Routen-/Sitzungsschlüssel-/Kontobindung wie `resolveAgentRoute`, `buildAgentSessionKey` und `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | Gemeinsam genutzte Hilfsfunktionen für Kanal-/Kontostatuszusammenfassungen, Standardwerte des Laufzeitstatus und Problemmetadaten |
    | `plugin-sdk/target-resolver-runtime` | Gemeinsam genutzte Hilfsfunktionen zur Zielauflösung |
    | `plugin-sdk/string-normalization-runtime` | Hilfsfunktionen zur Normalisierung von Slugs/Zeichenfolgen |
    | `plugin-sdk/request-url` | Zeichenfolgen-URLs aus Fetch-/Request-ähnlichen Eingaben extrahieren |
    | `plugin-sdk/run-command` | Zeitgesteuerter Befehlsausführer mit normalisierten stdout-/stderr-Ergebnissen |
    | `plugin-sdk/param-readers` | Allgemeine Parameterleser für Werkzeuge/CLI |
    | `plugin-sdk/tool-plugin` | Ein einfaches typisiertes Agentenwerkzeug-Plugin definieren und statische Metadaten für die Manifestgenerierung bereitstellen |
    | `plugin-sdk/tool-payload` | Normalisierte Nutzdaten aus Werkzeugergebnisobjekten extrahieren |
    | `plugin-sdk/tool-send` | Kanonische Sendeziel-Felder aus Werkzeugargumenten extrahieren |
    | `plugin-sdk/sandbox` | Typen für Sandbox-Backends und SSH-/OpenShell-Befehlshilfsfunktionen einschließlich Vorabprüfung für sofort fehlschlagende Ausführungsbefehle |
    | `plugin-sdk/temp-path` | Gemeinsam genutzte Hilfsfunktionen für temporäre Downloadpfade und private sichere temporäre Arbeitsbereiche |
    | `plugin-sdk/logging-core` | Hilfsfunktionen für Subsystem-Logger und Schwärzung |
    | `plugin-sdk/markdown-table-runtime` | Hilfsfunktionen für Markdown-Tabellenmodus und -konvertierung |
    | `plugin-sdk/model-session-runtime` | Hilfsfunktionen für Modell-/Sitzungsüberschreibungen wie `applyModelOverrideToSessionEntry` und `resolveAgentMaxConcurrent` |
    | `plugin-sdk/talk-config-runtime` | Hilfsfunktionen zur Auflösung der Konfiguration von Sprach-Providern |
    | `plugin-sdk/json-store` | Kleine Hilfsfunktionen zum Lesen/Schreiben von JSON-Zuständen |
    | `plugin-sdk/json-unsafe-integers` | JSON-Parsing-Hilfsfunktionen, die unsichere ganzzahlige Literale als Zeichenfolgen beibehalten |
    | `plugin-sdk/file-lock` | Wiedereintrittsfähige Dateisperrhilfsfunktionen |
    | `plugin-sdk/persistent-dedupe` | Hilfsfunktionen für einen datenträgergestützten Deduplizierungscache |
    | `plugin-sdk/acp-runtime` | Hilfsfunktionen für ACP-Laufzeit/-Sitzung und Antwortweiterleitung |
    | `plugin-sdk/acp-runtime-backend` | Leichtgewichtige Hilfsfunktionen zur Registrierung von ACP-Backends und Antwortweiterleitung für beim Start geladene Plugins |
    | `plugin-sdk/acp-binding-resolve-runtime` | Schreibgeschützte Auflösung von ACP-Bindungen ohne Importe für den Lebenszyklusstart |
    | `plugin-sdk/agent-config-primitives` | Veraltete Grundelemente für Konfigurationsschemas der Agentenlaufzeit; importieren Sie Schema-Grundelemente aus einer gepflegten Plugin-eigenen Oberfläche |
    | `plugin-sdk/boolean-param` | Lockerer Leser für boolesche Parameter |
    | `plugin-sdk/dangerous-name-runtime` | Hilfsfunktionen zur Auflösung von Übereinstimmungen mit gefährlichen Namen |
    | `plugin-sdk/device-bootstrap` | Hilfsfunktionen für Geräte-Bootstrap und Kopplungstoken einschließlich `BOOTSTRAP_HANDOFF_OPERATOR_SCOPES` |
    | `plugin-sdk/extension-shared` | Gemeinsam genutzte Grundelemente für passive Kanäle, Status und Umgebungsproxy-Hilfsfunktionen |
    | `plugin-sdk/models-provider-runtime` | Hilfsfunktionen für `/models`-Befehls-/Provider-Antworten |
    | `plugin-sdk/skill-commands-runtime` | Hilfsfunktionen zum Auflisten von Skill-Befehlen |
    | `plugin-sdk/native-command-registry` | Hilfsfunktionen für Registrierung, Erstellung und Serialisierung nativer Befehle |
    | `plugin-sdk/agent-harness` | Experimentelle Oberfläche für vertrauenswürdige Plugins und untergeordnete Agenten-Harnesses: Harness-Typen, Hilfsfunktionen zum Steuern/Abbrechen aktiver Ausführungen, Hilfsfunktionen für die OpenClaw-Werkzeugbrücke, Hilfsfunktionen für Werkzeugrichtlinien von Laufzeitplänen, Klassifizierung von Terminalergebnissen, Hilfsfunktionen für Formatierung/Details des Werkzeugfortschritts und Dienstprogramme für Versuchsergebnisse |
    | `plugin-sdk/provider-zai-endpoint` | Veraltete Provider-eigene Fassade von Z.AI zur Endpunkterkennung; verwenden Sie die öffentliche API des Z.AI-Plugins |
    | `plugin-sdk/async-lock-runtime` | Prozesslokale asynchrone Sperrhilfsfunktion für kleine Laufzeitstatusdateien |
    | `plugin-sdk/channel-activity-runtime` | Telemetrie-Hilfsfunktion für Kanalaktivität |
    | `plugin-sdk/concurrency-runtime` | Hilfsfunktion für begrenzte Nebenläufigkeit asynchroner Aufgaben |
    | `plugin-sdk/dedupe-runtime` | Hilfsfunktionen für speicherinterne und persistent gestützte Deduplizierungscaches |
    | `plugin-sdk/delivery-queue-runtime` | Hilfsfunktion zum Abarbeiten ausstehender ausgehender Zustellungen |
    | `plugin-sdk/file-access-runtime` | Sichere Hilfsfunktionen für lokale Datei- und Medienquellenpfade |
    | `plugin-sdk/heartbeat-runtime` | Hilfsfunktionen für Heartbeat-Aktivierung, -Ereignisse und -Sichtbarkeit |
    | `plugin-sdk/expect-runtime` | Hilfsfunktion zur Prüfung erforderlicher Werte für beweisbare Laufzeitinvarianten |
    | `plugin-sdk/number-runtime` | Hilfsfunktion zur numerischen Typumwandlung |
    | `plugin-sdk/secure-random-runtime` | Hilfsfunktionen für sichere Token/UUIDs |
    | `plugin-sdk/system-event-runtime` | Hilfsfunktionen für die Systemereigniswarteschlange |
    | `plugin-sdk/transport-ready-runtime` | Hilfsfunktion zum Warten auf Transportbereitschaft |
    | `plugin-sdk/exec-approvals-runtime` | Hilfsfunktionen für Richtliniendateien zur Ausführungsgenehmigung ohne den breiten Infrastruktur-Laufzeit-Sammel-Export |
    | `plugin-sdk/infra-runtime` | Veralteter Kompatibilitäts-Shim; verwenden Sie die oben genannten fokussierten Laufzeitunterpfade |
    | `plugin-sdk/collection-runtime` | Kleine Hilfsfunktionen für begrenzte Caches |
    | `plugin-sdk/diagnostic-runtime` | Hilfsfunktionen für Diagnoseflags, -ereignisse und Trace-Kontexte |
    | `plugin-sdk/error-runtime` | Hilfsfunktionen für Fehlergraphen, Formatierung und gemeinsam genutzte Fehlerklassifizierung, `PlatformMessageNotDispatchedError`, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | Hilfsfunktionen für umschlossenes Fetch, Proxy, EnvHttpProxyAgent-Optionen und festgelegte Suche |
    | `plugin-sdk/runtime-fetch` | Dispatcher-bewusstes Laufzeit-Fetch ohne Proxy-/geschützte-Fetch-Importe |
    | `plugin-sdk/inline-image-data-url-runtime` | Hilfsfunktionen zur Bereinigung von Inline-Bilddaten-URLs und Signaturerkennung ohne die breite Medienlaufzeitoberfläche |
    | `plugin-sdk/response-limit-runtime` | Begrenzter Leser für Antwortinhalte ohne die breite Medienlaufzeitoberfläche |
    | `plugin-sdk/session-binding-runtime` | Aktueller Zustand der Konversationsbindung ohne konfigurierte Bindungsweiterleitung oder Kopplungsspeicher |
    | `plugin-sdk/context-visibility-runtime` | Auflösung der Kontextsichtbarkeit und Filterung ergänzender Kontexte ohne breite Konfigurations-/Sicherheitsimporte |
    | `plugin-sdk/string-coerce-runtime` | Eng gefasste Hilfsfunktionen für die Typumwandlung und Normalisierung primitiver Datensätze/Zeichenfolgen ohne Markdown-/Protokollierungsimporte |
    | `plugin-sdk/host-runtime` | Hilfsfunktionen zur Normalisierung von Hostnamen und SCP-Hosts |
    | `plugin-sdk/retry-runtime` | Hilfsfunktionen für Wiederholungskonfiguration und Wiederholungsausführung |
    | `plugin-sdk/agent-runtime` | Veralteter breiter Sammel-Export für Hilfsfunktionen zu Agentenverzeichnis, -identität und -arbeitsbereich einschließlich `resolveAgentDir`, `resolveDefaultAgentDir` und des veralteten Kompatibilitätsexports `resolveOpenClawAgentDir`; bevorzugen Sie fokussierte Agenten-/Laufzeitunterpfade |
    | `plugin-sdk/directory-runtime` | Konfigurationsgestützte Verzeichnisabfrage/Deduplizierung |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Unterpfade für Funktionen und Tests">
    | Unterpfad | Wichtige Exporte |
    | --- | --- |
    | `plugin-sdk/media-runtime` | Veraltetes, umfassendes Medien-Barrel mit `saveRemoteMedia`, `saveResponseMedia`, `readRemoteMediaBuffer` und dem veralteten `fetchRemoteMedia`; bevorzugen Sie `plugin-sdk/media-store`, `plugin-sdk/media-mime`, `plugin-sdk/outbound-media` und Unterpfade der Funktions-Runtime sowie Store-Hilfsfunktionen vor Pufferlesevorgängen, wenn eine URL zu einem OpenClaw-Medium werden soll |
    | `plugin-sdk/media-mime` | Eng gefasste MIME-Normalisierung, Zuordnung von Dateierweiterungen, MIME-Erkennung und Hilfsfunktionen für Medienarten |
    | `plugin-sdk/media-store` | Eng gefasste Hilfsfunktionen für den Medienspeicher wie `saveMediaBuffer` und `saveMediaStream` |
    | `plugin-sdk/media-generation-runtime` | Gemeinsame Failover-Hilfsfunktionen für die Mediengenerierung, Kandidatenauswahl und Meldungen bei fehlenden Modellen |
    | `plugin-sdk/media-understanding` | Provider-Typen für das Medienverständnis sowie Provider-seitige Hilfsexporte für Bild-, Audio- und strukturierte Extraktion |
    | `plugin-sdk/text-chunking` | Hilfsfunktionen zum Aufteilen und Rendern ausgehender Texte und Markdown-Inhalte, Konvertierung von Markdown-Tabellen, Entfernung von Direktiven-Tags und Hilfsfunktionen für sicheren Text |
    | `plugin-sdk/speech` | Sprach-Provider-Typen sowie Provider-seitige Exporte für Direktiven, Registry, Validierung, den OpenAI-kompatiblen TTS-Builder und Sprachhilfsfunktionen |
    | `plugin-sdk/speech-core` | Gemeinsame Sprach-Provider-Typen sowie Exporte für Registry, Direktiven, Normalisierung und Sprachhilfsfunktionen |
    | `plugin-sdk/realtime-transcription` | Provider-Typen für Echtzeittranskription, Registry-Hilfsfunktionen und gemeinsame Hilfsfunktion für WebSocket-Sitzungen |
    | `plugin-sdk/realtime-bootstrap-context` | Hilfsfunktion zum Initialisieren von Echtzeitprofilen für die begrenzte Kontextinjektion aus `IDENTITY.md`, `USER.md` und `SOUL.md` |
    | `plugin-sdk/realtime-voice` | Provider-Typen für Echtzeitsprache, Registry-Hilfsfunktionen und gemeinsame Hilfsfunktionen für das Echtzeitsprachverhalten, einschließlich der Nachverfolgung der Ausgabeaktivität |
    | `plugin-sdk/image-generation` | Provider-Typen für die Bildgenerierung sowie Hilfsfunktionen für Bildressourcen und Daten-URLs und der OpenAI-kompatible Bild-Provider-Builder |
    | `plugin-sdk/image-generation-core` | Gemeinsame Typen für die Bildgenerierung sowie Failover-, Authentifizierungs- und Registry-Hilfsfunktionen |
    | `plugin-sdk/music-generation` | Provider-, Anfrage- und Ergebnistypen für die Musikgenerierung |
    | `plugin-sdk/music-generation-core` | Veraltete gemeinsame Typen für die Musikgenerierung, Failover-Hilfsfunktionen, Provider-Suche und Analyse von Modellreferenzen; bevorzugen Sie Plugin-eigene Oberflächen für Musik-Provider |
    | `plugin-sdk/video-generation` | Provider-, Anfrage- und Ergebnistypen für die Videogenerierung |
    | `plugin-sdk/video-generation-core` | Gemeinsame Typen für die Videogenerierung, Failover-Hilfsfunktionen, Provider-Suche und Analyse von Modellreferenzen |
    | `plugin-sdk/transcripts` | Gemeinsame Provider-Typen für Transkriptquellen, Registry-Hilfsfunktionen, Sitzungsdeskriptoren und Metadaten zu Äußerungen |
    | `plugin-sdk/webhook-targets` | Registry für Webhook-Ziele und Hilfsfunktionen zur Routeninstallation |
    | `plugin-sdk/webhook-path` | Veralteter Kompatibilitätsalias; verwenden Sie `plugin-sdk/webhook-ingress` |
    | `plugin-sdk/web-media` | Gemeinsame Hilfsfunktionen zum Laden entfernter und lokaler Medien |
    | `plugin-sdk/zod` | Veralteter Kompatibilitäts-Reexport; importieren Sie `zod` direkt aus `zod` |
    | `plugin-sdk/testing` | Repo-lokales, veraltetes Kompatibilitäts-Barrel für ältere OpenClaw-Tests. Neue Repo-Tests sollten stattdessen gezielte lokale Test-Unterpfade wie `plugin-sdk/agent-runtime-test-contracts`, `plugin-sdk/plugin-test-runtime`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/test-env` oder `plugin-sdk/test-fixtures` importieren |
    | `plugin-sdk/plugin-test-api` | Repo-lokale minimale Hilfsfunktion `createTestPluginApi` für direkte Unit-Tests der Plugin-Registrierung ohne Import von Brücken zu Repo-Testhilfsfunktionen |
    | `plugin-sdk/agent-runtime-test-contracts` | Repo-lokale Fixtures für native Agent-Runtime-Adapterverträge für Tests zu Authentifizierung, Zustellung, Fallback, Tool-Hooks, Prompt-Overlays, Schemas und Transkriptprojektionen |
    | `plugin-sdk/channel-test-helpers` | Repo-lokale, kanalorientierte Testhilfsfunktionen für generische Aktions-, Einrichtungs- und Statusverträge, Verzeichnisprüfungen, den Lebenszyklus beim Kontostart, die Weitergabe der Sendekonfiguration, Runtime-Mocks, Statusprobleme, ausgehende Zustellung und Hook-Registrierung |
    | `plugin-sdk/channel-target-testing` | Repo-lokale gemeinsame Suite für Fehlerfälle bei der Zielauflösung in Kanaltests |
    | `plugin-sdk/channel-contract-testing` | Repo-lokale, eng gefasste Hilfsfunktionen für Kanalvertragstests ohne das umfassende Testing-Barrel |
    | `plugin-sdk/plugin-test-contracts` | Repo-lokale Hilfsfunktionen für Verträge zu Plugin-Paketen, Registrierung, öffentlichen Artefakten, direkten Importen, Runtime-API und Import-Nebeneffekten |
    | `plugin-sdk/plugin-state-test-runtime` | Repo-lokale Testhilfsfunktionen für Plugin-Zustandsspeicher, Ingress-Warteschlangen und Zustandsdatenbanken |
    | `plugin-sdk/provider-test-contracts` | Repo-lokale Hilfsfunktionen für Provider-Verträge zu Runtime, Authentifizierung, Erkennung, Onboarding, Katalog, Assistenten, Medienfunktionen, Wiedergaberichtlinien, Echtzeit-STT mit Live-Audio, Websuche/-abruf und Streams |
    | `plugin-sdk/provider-http-test-mocks` | Repo-lokale, optional aktivierbare Vitest-Mocks für HTTP und Authentifizierung in Provider-Tests, die `plugin-sdk/provider-http` verwenden |
    | `plugin-sdk/reply-payload-testing` | Repo-lokale Hilfsfunktionen zum Anhängen von Metadaten an Fixtures für Antwort-Nutzdaten |
    | `plugin-sdk/sqlite-runtime-testing` | Repo-lokale SQLite-Lebenszyklus-Hilfsfunktionen für Erstanbieter-Tests |
    | `plugin-sdk/test-fixtures` | Repo-lokale generische Fixtures für CLI-Runtime-Erfassung, Sandbox-Kontext, Skill-Erstellung, Agent-Nachrichten, Systemereignisse, Neuladen von Modulen, Pfade gebündelter Plugins, Terminaltext, Aufteilung, Authentifizierungstoken und typisierte Fälle |
    | `plugin-sdk/test-node-mocks` | Repo-lokale, gezielte Mock-Hilfsfunktionen für integrierte Node-Module zur Verwendung in Vitest-`vi.mock("node:*")`-Factories |
  </Accordion>

  <Accordion title="Unterpfade für Speicher">
    | Unterpfad | Wichtige Exporte |
    | --- | --- |
    | `plugin-sdk/memory-core` | Veralteter Kompatibilitätsalias; verwenden Sie `plugin-sdk/memory-host-core` |
    | `plugin-sdk/memory-core-engine-runtime` | Veraltete Runtime-Fassade für Speicherindizierung und -suche; bevorzugen Sie herstellerneutrale Unterpfade für den Speicher-Host |
    | `plugin-sdk/memory-core-host-embedding-registry` | Leichtgewichtige Registry-Hilfsfunktionen für Provider von Speicher-Embeddings |
    | `plugin-sdk/memory-core-host-engine-foundation` | Exporte der Foundation-Engine des Speicher-Hosts |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Verträge für Speicher-Host-Embeddings, Registry-Zugriff, lokaler Provider sowie generische Batch- und Remote-Hilfsfunktionen. `registerMemoryEmbeddingProvider` ist auf dieser Oberfläche veraltet; verwenden Sie für neue Provider die generische Embedding-Provider-API. |
    | `plugin-sdk/memory-core-host-engine-qmd` | Exporte der QMD-Engine des Speicher-Hosts |
    | `plugin-sdk/memory-core-host-engine-storage` | Exporte der Speicher-Engine des Speicher-Hosts |
    | `plugin-sdk/memory-core-host-multimodal` | Veraltete multimodale Hilfsfunktionen des Speicher-Hosts; bevorzugen Sie herstellerneutrale Unterpfade für den Speicher-Host |
    | `plugin-sdk/memory-core-host-query` | Veraltete Abfragehilfsfunktionen des Speicher-Hosts; bevorzugen Sie herstellerneutrale Unterpfade für den Speicher-Host |
    | `plugin-sdk/memory-core-host-secret` | Hilfsfunktionen für Geheimnisse des Speicher-Hosts |
    | `plugin-sdk/memory-core-host-events` | Veralteter Kompatibilitätsalias; verwenden Sie `plugin-sdk/memory-host-events` |
    | `plugin-sdk/memory-core-host-status` | Statushilfsfunktionen des Speicher-Hosts |
    | `plugin-sdk/memory-core-host-runtime-cli` | CLI-Runtime-Hilfsfunktionen des Speicher-Hosts |
    | `plugin-sdk/memory-core-host-runtime-core` | Hilfsfunktionen der Kern-Runtime des Speicher-Hosts |
    | `plugin-sdk/memory-core-host-runtime-files` | Datei-/Runtime-Hilfsfunktionen des Speicher-Hosts |
    | `plugin-sdk/memory-host-core` | Herstellerneutraler Alias für Hilfsfunktionen der Kern-Runtime des Speicher-Hosts |
    | `plugin-sdk/memory-host-events` | Herstellerneutraler Alias für Hilfsfunktionen des Ereignisjournals des Speicher-Hosts |
    | `plugin-sdk/memory-host-files` | Veralteter Kompatibilitätsalias; verwenden Sie `plugin-sdk/memory-core-host-runtime-files` |
    | `plugin-sdk/memory-host-markdown` | Gemeinsame Hilfsfunktionen für verwaltetes Markdown für speichernahe Plugins |
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
    | `plugin-sdk/codex-mcp-projection` | Hilfsfunktion des gebündelten Codex-Plugins zur Projektion der benutzerdefinierten MCP-Serverkonfiguration in die Thread-Konfiguration des Codex-App-Servers (reservierter Paketexport) |
    | `plugin-sdk/codex-native-task-runtime` | Hilfsfunktion des gebündelten Codex-Plugins zur Spiegelung nativer Subagenten des Codex-App-Servers in den OpenClaw-Aufgabenstatus (nur repo-lokal, kein Paketexport) |

  </Accordion>
</AccordionGroup>

## Verwandte Themen

- [Übersicht über das Plugin SDK](/de/plugins/sdk-overview)
- [Einrichtung des Plugin SDK](/de/plugins/sdk-setup)
- [Plugins erstellen](/de/plugins/building-plugins)
