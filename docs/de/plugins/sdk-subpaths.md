---
read_when:
    - Den richtigen plugin-sdk-Unterpfad für einen Plugin-Import auswählen
    - Prüfung der Unterpfade gebündelter Plugins und der Hilfsoberflächen
summary: 'Plugin-SDK-Unterpfadkatalog: Welche Importe wo liegen, nach Bereich gruppiert'
title: Unterpfade des Plugin-SDKs
x-i18n:
    generated_at: "2026-07-24T05:08:52Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 1154247b3d3f630996c3159ddc3e89b800fc5cc479ad477cfa6dfdbc9c140572
    source_path: plugins/sdk-subpaths.md
    workflow: 16
---

Das Plugin-SDK enthält schmale öffentliche Unterpfade und ausschließlich für das Repository bestimmte gebündelte
Hilfsfunktionen unter `openclaw/plugin-sdk/`. Diese Seite katalogisiert beide und kennzeichnet
private-lokale Einträge ausdrücklich. Drei Dateien definieren die Grenze:

- `scripts/lib/plugin-sdk-entrypoints.json`: das gepflegte Inventar der Einstiegspunkte,
  das beim Build kompiliert wird.
- `scripts/lib/plugin-sdk-private-local-only-subpaths.json`: interne Unterpfade,
  die vom typisierten, dokumentierten SDK ausgeschlossen sind. Produktionseinträge bleiben
  als reine JavaScript-Exporte der Host-Laufzeit für separat veröffentlichte offizielle
  Plugins verfügbar; reine Testeinträge werden weiterhin nicht exportiert.
- `src/plugin-sdk/entrypoints.ts`: Klassifizierungsmetadaten für veraltete
  Unterpfade, reservierte gebündelte Hilfsfunktionen, unterstützte gebündelte Fassaden und
  Plugin-eigene öffentliche Oberflächen.

Maintainer prüfen die Anzahl öffentlicher Exporte mit `pnpm plugin-sdk:surface` und
aktive reservierte Hilfsunterpfade mit `pnpm plugins:boundary-report:summary`;
ungenutzte reservierte Hilfsexporte lassen den CI-Bericht fehlschlagen, statt als
inaktive Kompatibilitätsschuld im öffentlichen SDK zu verbleiben.

Den Leitfaden zur Plugin-Erstellung finden Sie unter [Übersicht zum Plugin-SDK](/de/plugins/sdk-overview).

## Plugin-Einstieg

| Unterpfad                      | Wichtige Exporte                                                                                                                                                                                         |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/plugin-entry`      | `definePluginEntry`                                                                                                                                                                                     |
| `plugin-sdk/core`              | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema`, `buildJsonChannelConfigSchema`, `resolveTailscalePublishedHost` |
| `plugin-sdk/provider-entry`    | Seit Juli 2026 private-lokal; `defineSingleProviderPluginEntry`                                                                                                                                        |
| `plugin-sdk/migration`         | Seit Juli 2026 private-lokal; Hilfsfunktionen für Migration-Provider-Elemente wie `createMigrationItem`, Ursachenkonstanten, Elementstatusmarkierungen, Schwärzungshilfen und `summarizeMigrationItems`                   |
| `plugin-sdk/migration-runtime` | Seit Juli 2026 private-lokal; Laufzeit-Migrationshilfen wie `copyMigrationFileItem`, `resolvePlannedMigrationTargets`, `withCachedMigrationConfigRuntime` und `writeMigrationReport`              |
| `plugin-sdk/health`            | Registrierung, Erkennung, Reparatur, Auswahl, Schweregrad und Befundtypen für Doctor-Integritätsprüfungen gebündelter Integritätsverbraucher                                                              |

### Kompatibilität und private-lokale Hilfsfunktionen

Nur die in späteren Zeitfenstern veralteten Unterpfade werden weiterhin exportiert. Aliasse und
ungenutzte Unterpfade vom Juli 2026 wurden gelöscht, während ausschließlich gebündelte Hilfsfunktionen aus dem
öffentlichen Paket entfernt wurden und nachfolgend als private-lokal gekennzeichnet sind. Die gepflegte Liste ist
`scripts/lib/plugin-sdk-deprecated-public-subpaths.json`; CI weist gebündelte zurück.
`plugin-sdk/text-runtime` dienen nur der Kompatibilität, und `plugin-sdk/zod` ist ein
Kompatibilitäts-Reexport: Importieren Sie `zod` direkt aus `zod`. Die allgemeinen Domänen-
Barrels `plugin-sdk/agent-runtime`, `plugin-sdk/channel-lifecycle`,
`plugin-sdk/conversation-runtime`, `plugin-sdk/hook-runtime`,
`plugin-sdk/media-runtime`, `plugin-sdk/plugin-runtime` und
`plugin-sdk/security-runtime` sind zugunsten fokussierter
Unterpfade ebenfalls veraltet.

Die Vitest-basierten Testhilfsunterpfade von OpenClaw sind ausschließlich repository-lokal und werden nicht
mehr aus dem Paket exportiert: `agent-runtime-test-contracts`,
`channel-contract-testing`, `channel-target-testing`, `channel-test-helpers`,
`plugin-state-test-runtime`, `plugin-test-api`, `plugin-test-contracts`,
`plugin-test-runtime`, `provider-http-test-mocks`, `provider-test-contracts`,
`reply-payload-testing`, `sqlite-runtime-testing`, `test-env`, `test-fixtures`,
`test-live`, `test-live-auth`, `test-media-generation`,
`test-media-understanding`, `test-node-mocks` und `testing`. Die privaten gebündelten Hilfsoberflächen
`ssrf-runtime-internal` und `codex-native-task-runtime` sind ebenfalls ausschließlich
repository-lokal.

### Hilfsunterpfade gebündelter Plugins

Ausschließlich gebündelte Hilfsmodule sind seit der Bereinigung im Juli 2026 private-lokal. Eigentümerübergreifende Importe werden durch Schutzmechanismen des Paketvertrags blockiert. `src/plugin-sdk/entrypoints.ts` verfolgt separat die unterstützten gebündelten Fassaden, die öffentlich bleiben, also SDK-
Einstiegspunkte, die von ihrem gebündelten Plugin bereitgestellt werden, bis generische Verträge
`plugin-sdk/qa-runner-runtime`, `plugin-sdk/telegram-account` ersetzen,
für neuen Code veraltet; siehe die Hinweise pro Zeile unten.

<AccordionGroup>
  <Accordion title="Kanalunterpfade">
    | Unterpfad | Wichtige Exporte |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `createChannelConfigUiHints` |
    | `plugin-sdk/json-schema-runtime` | Seit Juli 2026 private-lokal; zwischengespeicherte JSON-Schema-Validierungshilfe für Plugin-eigene Schemas |
    | `plugin-sdk/channel-setup` | `defineChannelSetupContract`, kanaleigene Typen für Einrichtungsfelder/-eingaben, `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard` sowie `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | Gemeinsame Hilfsfunktionen für den Einrichtungsassistenten, Einrichtungsübersetzer, Aufforderungen für Zulassungslisten, Generatoren für Einrichtungsstatus |
    | `plugin-sdk/setup-runtime` | `defineChannelSetupContract`, `createSetupTranslator`, `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | Hilfsfunktionen für Mehrkontenkonfiguration/Aktionssperren, Hilfsfunktionen für den Rückgriff auf das Standardkonto |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, Hilfsfunktionen zur Normalisierung von Konto-IDs |
    | `plugin-sdk/account-resolution` | Hilfsfunktionen für Kontosuche und Standardrückgriff |
    | `plugin-sdk/account-helpers` | Schmale Hilfsfunktionen für Kontolisten/Kontoaktionen |
    | `plugin-sdk/access-groups` | Seit Juli 2026 private-lokal; Parsen von Zugriffsgruppen-Zulassungslisten und Hilfsfunktionen für geschwärzte Gruppendiagnosen |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | Veraltete Kompatibilitätsfassade. Verwenden Sie `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
    | `plugin-sdk/channel-config-schema` | Gemeinsame Grundelemente für Kanalkonfigurationsschemas sowie Zod- und direkte JSON-/TypeBox-Builder |
    | `plugin-sdk/bundled-channel-config-schema` | Seit Juli 2026 private-lokal; gebündelte OpenClaw-Kanalkonfigurationsschemas ausschließlich für gepflegte gebündelte Plugins |
    | `plugin-sdk/chat-channel-ids` | Seit Juli 2026 private-lokal; `BUNDLED_CHAT_CHANNEL_IDS`, `BUNDLED_CHAT_CHANNEL_ENVELOPE_PREFIXES`, `ChatChannelId`. Kanonische IDs gebündelter/offizieller Chatkanäle sowie Formatiererbezeichnungen/-aliasse für Plugins, die Text mit Envelope-Präfix erkennen müssen, ohne eine eigene Tabelle fest zu codieren. |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-ingress-runtime` | Experimenteller übergeordneter Laufzeit-Resolver für eingehende Kanalnachrichten, Resolver für Richtlinien zu impliziten Erwähnungen und Generatoren für Routing-Fakten für migrierte Empfangspfade von Kanälen. Verwenden Sie dies vorzugsweise, statt in jedem Plugin effektive Zulassungslisten, Befehlszulassungslisten und Legacy-Projektionen zusammenzustellen. Siehe [API für eingehende Kanalnachrichten](/de/plugins/sdk-channel-ingress). |
    | `plugin-sdk/channel-lifecycle` | Veraltete Kompatibilitätsfassade. Verwenden Sie `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-outbound` | Verträge für den Nachrichtenlebenszyklus sowie Optionen für die Antwort-Pipeline, Empfangsbestätigungen, Live-Vorschau/Streaming, Lebenszyklushilfen, ausgehende Identität, Nutzlastplanung, dauerhafte Sendevorgänge und Hilfsfunktionen für den Nachrichtenversandkontext. Siehe [API für ausgehende Kanalnachrichten](/de/plugins/sdk-channel-outbound). |
    | `plugin-sdk/channel-message` | Veralteter Kompatibilitätsalias für `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/inbound-envelope` | Gemeinsame Hilfsfunktionen für eingehendes Routing und Envelope-Erstellung |
    | `plugin-sdk/inbound-reply-dispatch` | Veraltete Kompatibilitätsfassade. Verwenden Sie `plugin-sdk/channel-inbound` für eingehende Runner und Dispatch-Prädikate und `plugin-sdk/channel-outbound` für Hilfsfunktionen zur Nachrichtenzustellung. |
    | `plugin-sdk/messaging-targets` | Veralteter Alias für das Parsen von Zielen; verwenden Sie `plugin-sdk/channel-targets` |
    | `plugin-sdk/outbound-media` | Seit Juli 2026 private-lokal; gemeinsame Hilfsfunktionen zum Laden ausgehender Medien und zum Status gehosteter Medien |
    | `plugin-sdk/poll-runtime` | Seit Juli 2026 private-lokal; schmale Hilfsfunktionen zur Umfragenormalisierung |
    | `plugin-sdk/thread-bindings-runtime` | Seit Juli 2026 private-lokal; Lebenszyklus- und Adapterhilfen für Thread-Bindungen |
    | `plugin-sdk/agent-media-payload` | Veraltete Kompatibilitätsfassade für Wurzelverzeichnisse und Loader von Agent-Mediennutzlasten. Neue Kanal-Plugins verwenden die typisierte Planung ausgehender Nutzlasten aus `plugin-sdk/channel-outbound`; das Laden von durch Operatoren bereitgestellten lokalen Medien verwendet weiterhin die beibehaltene Fassade, bis eine fokussierte öffentliche Schnittstelle für lokale Wurzelverzeichnisse vorhanden ist. |
    | `plugin-sdk/conversation-runtime` | Veraltetes allgemeines Barrel für Unterhaltungs-/Thread-Bindungen, Kopplung und Hilfsfunktionen für konfigurierte Bindungen; bevorzugen Sie fokussierte Bindungsunterpfade wie `plugin-sdk/thread-bindings-runtime` und `plugin-sdk/session-binding-runtime` |
    | `plugin-sdk/runtime-group-policy` | Laufzeithilfen zur Auflösung von Gruppenrichtlinien |
    | `plugin-sdk/channel-status` | Gemeinsame Hilfsfunktionen für Momentaufnahmen/Zusammenfassungen des Kanalstatus |
    | `plugin-sdk/channel-config-primitives` | Schmale Grundelemente für Kanalkonfigurationsschemas |
    | `plugin-sdk/channel-config-writes` | Seit Juli 2026 private-lokal; Autorisierungshilfen zum Schreiben der Kanalkonfiguration |
    | `plugin-sdk/channel-plugin-common` | Gemeinsame Prelude-Exporte für Kanal-Plugins |
    | `plugin-sdk/allowlist-config-edit` | Hilfsfunktionen zum Bearbeiten/Lesen der Zulassungslistenkonfiguration |
    | `plugin-sdk/group-access` | Veraltete Hilfsfunktionen für Gruppen-Zugriffsentscheidungen; verwenden Sie `resolveChannelMessageIngress` aus `plugin-sdk/channel-ingress-runtime` |
    | `plugin-sdk/direct-dm-guard-policy` | Seit Juli 2026 private-lokal; schmale Richtlinienhilfen für die direkte DM-Prüfung vor der Kryptografie |
    | `plugin-sdk/discord` | Veraltete Discord-Kompatibilitätsfassade für veröffentlichtes `@openclaw/discord@2026.3.13` und nachverfolgte Eigentümerkompatibilität; neue Plugins sollten generische Kanal-SDK-Unterpfade verwenden |
    | `plugin-sdk/telegram-account` | Veraltete Telegram-Kompatibilitätsfassade zur Kontoauflösung für nachverfolgte Eigentümerkompatibilität; neue Plugins sollten injizierte Laufzeithilfen oder generische Kanal-SDK-Unterpfade verwenden |
    | `plugin-sdk/interactive-runtime` | Semantische Nachrichtendarstellung, Zustellung und Legacy-Hilfsfunktionen für interaktive Antworten. Siehe [Nachrichtendarstellung](/de/plugins/message-presentation) |
    | `plugin-sdk/question-gateway-runtime` | Von der Laufzeit erstellte `ask_user`-Auswahlmöglichkeiten über das Gateway aus Interaktionshandlern des Kanals auflösen |
    | `plugin-sdk/channel-inbound` | Gemeinsame Hilfsfunktionen für eingehende Nachrichten zur Ereignisklassifizierung, Kontexterstellung, Formatierung, Wurzelverzeichnisse, Entprellung, Erwähnungsabgleich, Erwähnungsrichtlinien und Protokollierung eingehender Nachrichten |
    | `plugin-sdk/channel-inbound-debounce` | Schmale Entprellhilfen für eingehende Nachrichten |
    | `plugin-sdk/channel-mention-gating` | Seit Juli 2026 private-lokal; schmale Hilfsfunktionen für Erwähnungsrichtlinien, Erwähnungsmarkierungen und Erwähnungstext ohne die allgemeinere Laufzeitoberfläche für eingehende Nachrichten |
    | `plugin-sdk/channel-streaming` | Veraltete Kompatibilitätsfassade. Verwenden Sie `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-send-result` | Antwortergebnistypen |
    | `plugin-sdk/channel-actions` | Hilfsfunktionen für Kanalnachrichtenaktionen sowie veraltete native Schemahilfen, die für die Plugin-Kompatibilität beibehalten werden |
    | `plugin-sdk/channel-route` | Seit Juli 2026 private-lokal; gemeinsame Routing-Normalisierung, parsergestützte Zielauflösung, Umwandlung von Thread-IDs in Zeichenfolgen, deduplizierte/kompakte Routingschlüssel, Typen geparster Ziele und Hilfsfunktionen zum Vergleichen von Routen/Zielen |
    | `plugin-sdk/channel-targets` | Seit Juli 2026 private-lokal; Hilfsfunktionen zum Parsen von Zielen; Aufrufer für Routenvergleiche sollten `plugin-sdk/channel-route` verwenden |
    | `plugin-sdk/channel-contract` | Kanalvertragstypen |
    | `plugin-sdk/channel-feedback` | Verdrahtung für Feedback/Reaktionen |
  </Accordion>

Kanal-Kompatibilitätsunterpfade aus späteren Zeitfenstern bleiben nur bis zu ihren
Registrierungsdaten öffentlich. Juli-Aliasse wie direkter DM-Zugriff, Antwortoptionen, Kopplungs-
pfade und Aufspaltungen der Kanallaufzeit wurden entfernt; ausschließlich gebündelte Hilfsfunktionen
sind private-lokal.

  <Accordion title="Provider-Unterpfade">
    | Unterpfad | Wichtige Exporte |
    | --- | --- |
    | `plugin-sdk/provider-entry` | Seit Juli 2026 nur noch privat-lokal; `defineSingleProviderPluginEntry` |
    | `plugin-sdk/provider-setup` | Seit Juli 2026 nur noch privat-lokal; kuratierte Hilfsfunktionen zur Einrichtung lokaler/selbst gehosteter Provider |
    | `plugin-sdk/cli-backend` | Seit Juli 2026 nur noch privat-lokal; Standardwerte für das CLI-Backend und Watchdog-Konstanten |
    | `plugin-sdk/provider-auth-runtime` | Seit Juli 2026 nur noch privat-lokal; Laufzeit-Hilfsfunktionen für die Provider-Authentifizierung: OAuth-Loopback-Ablauf, Token-Austausch, Authentifizierungspersistenz und API-Schlüsselauflösung |
    | `plugin-sdk/provider-oauth-runtime` | Seit Juli 2026 nur noch privat-lokal; generische Typen für Provider-OAuth-Callbacks, Rendering der Callback-Seite, PKCE-/Status-Hilfsfunktionen, Parsing von Autorisierungseingaben, Hilfsfunktionen für den Token-Ablauf und Abbruch-Hilfsfunktionen |
    | `plugin-sdk/provider-auth-api-key` | Seit Juli 2026 nur noch privat-lokal; Hilfsfunktionen für das Onboarding per API-Schlüssel und das Schreiben von Profilen wie `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | Seit Juli 2026 nur noch privat-lokal; Standard-Builder für OAuth-Authentifizierungsergebnisse |
    | `plugin-sdk/provider-env-vars` | Seit Juli 2026 nur noch privat-lokal; Hilfsfunktionen zum Nachschlagen von Umgebungsvariablen für die Provider-Authentifizierung |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials`, Hilfsfunktionen für den Import der OpenAI-Codex-Authentifizierung, veralteter Kompatibilitätsexport `resolveOpenClawAgentDir` |
    | `plugin-sdk/provider-model-shared` | Seit Juli 2026 nur noch privat-lokal; `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `selectPreferredLocalModelId`, `normalizeModelCompat`, gemeinsam genutzte Builder für Wiederholungsrichtlinien, Hilfsfunktionen für Provider-Endpunkte und gemeinsam genutzte Hilfsfunktionen zur Normalisierung von Modell-IDs |
    | `plugin-sdk/provider-catalog-live-runtime` | Seit Juli 2026 nur noch privat-lokal; Hilfsfunktionen für den Live-Modellkatalog von Providern zur abgesicherten Erkennung im Stil von `/models`: `buildLiveModelProviderConfig`, `fetchLiveProviderModelRows`, `getCachedLiveProviderModelRows`, `fetchLiveProviderModelIds`, `LiveModelCatalogHttpError`, `clearLiveCatalogCacheForTests`, Modell-ID-Filterung, TTL-Cache und statischer Fallback |
    | `plugin-sdk/provider-catalog-runtime` | Laufzeit-Hook zur Erweiterung des Provider-Katalogs und Schnittstellen zur Plugin-Provider-Registry für Vertragstests |
    | `plugin-sdk/provider-catalog-shared` | Seit Juli 2026 nur noch privat-lokal; `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | Seit Juli 2026 nur noch privat-lokal; generische Hilfsfunktionen für HTTP-/Endpunktfähigkeiten von Providern, Provider-HTTP-Fehler und Hilfsfunktionen für Multipart-Formulare zur Audiotranskription |
    | `plugin-sdk/provider-web-fetch-contract` | Seit Juli 2026 nur noch privat-lokal; eng gefasste Hilfsfunktionen für den Web-Abruf-Konfigurations-/Auswahlvertrag wie `enablePluginInConfig` und `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | Seit Juli 2026 nur noch privat-lokal; Hilfsfunktionen für Registrierung und Cache von Web-Abruf-Providern |
    | `plugin-sdk/provider-web-search-config-contract` | Seit Juli 2026 nur noch privat-lokal; eng gefasste Konfigurations-/Anmeldedaten-Hilfsfunktionen für Websuch-Provider, die keine Verkabelung zur Plugin-Aktivierung benötigen |
    | `plugin-sdk/provider-web-search-contract` | Seit Juli 2026 nur noch privat-lokal; eng gefasste Hilfsfunktionen für den Websuch-Konfigurations-/Anmeldedatenvertrag wie `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` sowie bereichsbezogene Setter/Getter für Anmeldedaten |
    | `plugin-sdk/provider-web-search` | Seit Juli 2026 nur noch privat-lokal; Hilfsfunktionen für Registrierung, Cache und Laufzeit von Websuch-Providern |
    | `plugin-sdk/embedding-providers` | Seit Juli 2026 nur noch privat-lokal; allgemeine Typen für Embedding-Provider und Lese-Hilfsfunktionen, einschließlich `EmbeddingProviderAdapter`, `getEmbeddingProvider(...)` und `listEmbeddingProviders(...)`; Plugins registrieren Provider über `api.registerEmbeddingProvider(...)`, sodass die Manifest-Zuständigkeit durchgesetzt wird |
    | `plugin-sdk/provider-tools` | Seit Juli 2026 nur noch privat-lokal; `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks` sowie Schemabereinigung und Diagnose für DeepSeek/Gemini/OpenAI |
    | `plugin-sdk/provider-usage` | Seit Juli 2026 nur noch privat-lokal; Typen für Provider-Nutzungsmomentaufnahmen, gemeinsam genutzte Hilfsfunktionen zum Abrufen der Nutzung und Provider-Abruffunktionen wie `fetchClaudeUsage` |
    | `plugin-sdk/provider-stream` | Seit Juli 2026 nur noch privat-lokal; `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, Typen für Stream-Wrapper, Kompatibilität für Werkzeugaufrufe als Klartext sowie gemeinsam genutzte Wrapper-Hilfsfunktionen für Anthropic/Google/Kilocode/MiniMax/Moonshot/OpenAI/OpenRouter/Z.AI |
    | `plugin-sdk/provider-stream-shared` | Seit Juli 2026 nur noch privat-lokal; öffentlich gemeinsam genutzte Hilfsfunktionen für Provider-Stream-Wrapper, einschließlich `composeProviderStreamWrappers`, `createOpenAICompatibleCompletionsThinkingOffWrapper`, `createPlainTextToolCallCompatWrapper`, `createPayloadPatchStreamWrapper`, `createToolStreamWrapper`, `normalizeOpenAICompatibleReasoningPayload`, `setQwenChatTemplateThinking` sowie Anthropic-/DeepSeek-/OpenAI-kompatible Stream-Hilfsfunktionen |
    | `plugin-sdk/provider-transport-runtime` | Seit Juli 2026 nur noch privat-lokal; Hilfsfunktionen für native Provider-Transporte wie abgesicherter Abruf, Textextraktion aus Werkzeugergebnissen, Transformationen von Transportnachrichten und beschreibbare Transportereignis-Streams |
    | `plugin-sdk/provider-onboard` | Seit Juli 2026 nur noch privat-lokal; Hilfsfunktionen für Onboarding-Konfigurationspatches |
    | `plugin-sdk/global-singleton` | Seit Juli 2026 nur noch privat-lokal; prozesslokale Hilfsfunktionen für Singletons, Maps und Caches |
    | `plugin-sdk/group-activation` | Seit Juli 2026 nur noch privat-lokal; eng gefasste Hilfsfunktionen für Gruppenaktivierungsmodi und Befehlsparsing |
  </Accordion>

Provider-Nutzungsmomentaufnahmen melden normalerweise ein oder mehrere Kontingent-`windows`, jeweils mit
einer Bezeichnung, dem verwendeten Prozentsatz und einem optionalen Rücksetzzeitpunkt. Provider, die anstelle
zurücksetzbarer Kontingentzeiträume einen Kontostand oder Text zum Kontostatus bereitstellen, sollten
`summary` mit einem leeren `windows`-Array zurückgeben, statt Prozentsätze zu erfinden.
OpenClaw zeigt diesen Zusammenfassungstext in der Statusausgabe an; verwenden Sie `error` nur, wenn der
Nutzungsendpunkt fehlgeschlagen ist oder keine verwendbaren Nutzungsdaten zurückgegeben hat.

  <Accordion title="Unterpfade für Authentifizierung und Sicherheit">
    | Unterpfad | Wichtige Exporte |
    | --- | --- |
    | `plugin-sdk/command-auth` | Veraltete breite Oberfläche für Befehlsautorisierung (`resolveControlCommandGate`, Hilfsfunktionen für die Befehls-Registry einschließlich der Formatierung dynamischer Argumentmenüs, Hilfsfunktionen für die Absenderautorisierung); verwenden Sie die Autorisierung am Kanaleingang/in der Laufzeit oder Hilfsfunktionen für den Befehlsstatus |
    | `plugin-sdk/command-status` | Builder für Befehls-/Hilfenachrichten wie `buildCommandsMessagePaginated` und `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | Hilfsfunktionen für die Auflösung von Genehmigenden und die Aktionsautorisierung im selben Chat |
    | `plugin-sdk/approval-client-runtime` | Hilfsfunktionen für native Ausführungsgenehmigungsprofile und -filter |
    | `plugin-sdk/approval-delivery-runtime` | Adapter für native Genehmigungsfähigkeiten und -zustellung |
    | `plugin-sdk/approval-gateway-runtime` | Gemeinsam genutzter Resolver für das Genehmigungs-Gateway |
    | `plugin-sdk/approval-reference-runtime` | Seit Juli 2026 nur noch privat-lokal; deterministische Hilfsfunktion für dauerhafte Locator-Werte bei transportbedingt eingeschränkten Genehmigungs-Callbacks |
    | `plugin-sdk/approval-handler-adapter-runtime` | Leichtgewichtige Hilfsfunktionen zum Laden nativer Genehmigungsadapter für häufig genutzte Kanal-Einstiegspunkte |
    | `plugin-sdk/approval-handler-runtime` | Umfassendere Laufzeit-Hilfsfunktionen für Genehmigungs-Handler; bevorzugen Sie die engeren Adapter-/Gateway-Schnittstellen, wenn diese ausreichen |
    | `plugin-sdk/approval-native-runtime` | Hilfsfunktionen für native Genehmigungsziele, Kontobindung, Routing-Gates, Weiterleitungs-Fallbacks und die Unterdrückung lokaler nativer Ausführungsaufforderungen |
    | `plugin-sdk/approval-reaction-runtime` | Seit Juli 2026 nur noch privat-lokal; fest codierte Bindungen für Genehmigungsreaktionen, Nutzlasten für Reaktionsaufforderungen, Speicher für Reaktionsziele, Hilfsfunktionen für Reaktionshinweistexte und Kompatibilitätsexport zur Unterdrückung lokaler nativer Ausführungsaufforderungen |
    | `plugin-sdk/approval-reply-runtime` | Hilfsfunktionen für Antwortnutzlasten bei Ausführungs-/Plugin-Genehmigungen |
    | `plugin-sdk/approval-runtime` | Hilfsfunktionen für Nutzlasten bei Ausführungs-/Plugin-Genehmigungen, Builder für Genehmigungsfähigkeiten, Hilfsfunktionen für Genehmigungsautorisierung/-profile, Hilfsfunktionen für natives Genehmigungsrouting und die zugehörige Laufzeit sowie Hilfsfunktionen für strukturierte Genehmigungsanzeigen wie `formatApprovalDisplayPath` |
    | `plugin-sdk/command-auth-native` | Native Befehlsautorisierung, Formatierung dynamischer Argumentmenüs und Hilfsfunktionen für native Sitzungsziele |
    | `plugin-sdk/command-detection` | Gemeinsam genutzte Hilfsfunktionen zur Befehlserkennung |
    | `plugin-sdk/command-primitives-runtime` | Leichtgewichtige Prädikate für Befehlstext in häufig genutzten Kanalpfaden |
    | `plugin-sdk/command-surface` | Seit Juli 2026 nur noch privat-lokal; Normalisierung von Befehlstexten und Hilfsfunktionen für Befehlsoberflächen |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/provider-auth-login-flow-runtime` | Seit Juli 2026 nur noch privat-lokal; Hilfsfunktionen für verzögert geladene Anmeldeabläufe zur Provider-Authentifizierung bei der Gerätecode-Kopplung für private Kanäle und die Web-UI |
    | `plugin-sdk/channel-secret-runtime` | Veraltete breite Oberfläche für Geheimnisverträge (`collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment`, Geheimniszieltypen); bevorzugen Sie die fokussierten Unterpfade unten |
    | `plugin-sdk/channel-secret-basic-runtime` | Eng gefasste Exporte für Geheimnisverträge und Builder für Ziel-Registrys für Kanal-/Plugin-Geheimnisoberflächen außerhalb von TTS |
    | `plugin-sdk/channel-secret-tts-runtime` | Seit Juli 2026 nur noch privat-lokal; eng gefasste Hilfsfunktionen für verschachtelte Zuweisungen von TTS-Geheimnissen in Kanälen |
    | `plugin-sdk/secret-ref-runtime` | Eng gefasste Typisierung und Auflösung von SecretRef sowie Nachschlagen von Planzielpfaden für das Parsing von Geheimnisverträgen/Konfigurationen |
    | `plugin-sdk/security-runtime` | Veraltetes breites Barrel für Vertrauen, DM-Zugriffskontrolle, auf das Stammverzeichnis beschränkte Datei-/Pfad-Hilfsfunktionen einschließlich ausschließlich erstellender Schreibvorgänge, synchronen/asynchronen atomaren Dateiaustausch, temporäre Schreibvorgänge in Geschwisterdateien, Fallback bei geräteübergreifendem Verschieben, Hilfsfunktionen für private Dateispeicher, Schutzmechanismen für symbolische Links in übergeordneten Verzeichnissen, externe Inhalte, Schwärzung vertraulicher Texte, Geheimnisvergleiche mit konstanter Laufzeit und Hilfsfunktionen zur Sammlung von Geheimnissen; bevorzugen Sie fokussierte Unterpfade für Sicherheit/SSRF/Geheimnisse |
    | `plugin-sdk/ssrf-policy` | Hilfsfunktionen für Host-Zulassungslisten und SSRF-Richtlinien für private Netzwerke |
    | `plugin-sdk/ssrf-dispatcher` | Seit Juli 2026 nur noch privat-lokal; eng gefasste Hilfsfunktionen für angeheftete Dispatcher ohne die breite Infrastruktur-Laufzeitoberfläche |
    | `plugin-sdk/ssrf-runtime` | Hilfsfunktionen für angeheftete Dispatcher, SSRF-abgesicherte Abrufe, SSRF-Fehler und SSRF-Richtlinien |
    | `plugin-sdk/secret-input` | Hilfsfunktionen zum Parsen von Geheimniseingaben |
    | `plugin-sdk/webhook-ingress` | Hilfsfunktionen für Webhook-Anfragen/-Ziele und Umwandlung unverarbeiteter Websocket-/Body-Daten |
    | `plugin-sdk/webhook-request-guards` | Hilfsfunktionen für Größe und Zeitüberschreitung von Anfragekörpern sowie `runDetachedWebhookWork` für nachverfolgte Verarbeitung nach der Bestätigung |
  </Accordion>

  <Accordion title="Runtime and storage subpaths">
    | Unterpfad | Wichtige Exporte |
    | --- | --- |
    | `plugin-sdk/runtime` | Hilfsfunktionen für Laufzeit/Protokollierung/Sicherung, Warnungen zu Plugin-Installationspfaden und Prozesshilfsfunktionen |
    | `plugin-sdk/runtime-env` | Schlanke Hilfsfunktionen für Laufzeitumgebung, Logger, Zeitüberschreitung, Wiederholungsversuche und Backoff |
    | `plugin-sdk/browser-config` | Nach Juli 2026 nur noch privat-lokal; unterstützte Browserkonfigurationsfassade für normalisierte Profile/Standardwerte, CDP-URL-Parsing und Hilfsfunktionen zur Browsersteuerungsauthentifizierung |
    | `plugin-sdk/agent-harness-task-runtime` | Nach Juli 2026 nur noch privat-lokal; generische Hilfsfunktionen für Aufgabenlebenszyklus und Abschlusszustellung für Harness-gestützte Agenten mit einem vom Host ausgegebenen Aufgabenbereich |
    | `plugin-sdk/codex-mcp-projection` | Nach Juli 2026 nur noch privat-lokal; reservierte gebündelte Codex-Hilfsfunktion zur Abbildung der benutzerseitigen MCP-Serverkonfiguration auf die Codex-Threadkonfiguration; nicht für Drittanbieter-Plugins |
    | `plugin-sdk/codex-native-task-runtime` | Repository-lokale gebündelte Codex-Hilfsfunktion für die native Aufgaben-Spiegelung/Laufzeitverdrahtung; kein Paketexport |
    | `plugin-sdk/channel-runtime-context` | Generische Hilfsfunktionen zur Registrierung und Suche des Kanal-Laufzeitkontexts |
    | `plugin-sdk/matrix` | Veraltete Matrix-Kompatibilitätsfassade für ältere Drittanbieter-Kanalpakete; neue Plugins sollten `plugin-sdk/run-command` direkt importieren |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Veralteter breiter Barrel-Export für Hilfsfunktionen zu Plugin-Befehlen, Hooks, HTTP und Interaktivität; bevorzugen Sie gezielte Plugin-Laufzeitunterpfade |
    | `plugin-sdk/hook-runtime` | Veralteter breiter Barrel-Export für Hilfsfunktionen der Webhook-/internen Hook-Pipeline; bevorzugen Sie gezielte Hook-/Plugin-Laufzeitunterpfade |
    | `plugin-sdk/lazy-runtime` | Hilfsfunktionen für verzögerten Laufzeitimport und -bindung wie `createLazyRuntimeModule`, `createLazyRuntimeMethod` und `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | Nach Juli 2026 nur noch privat-lokal; Hilfsfunktionen zur Prozessausführung |
    | `plugin-sdk/node-host` | Nach Juli 2026 nur noch privat-lokal; Hilfsfunktionen zur Auflösung ausführbarer Dateien auf dem Node-Host und zur PTY-Fortsetzung |
    | `plugin-sdk/cli-runtime` | Nach Juli 2026 nur noch privat-lokal; veralteter breiter Barrel-Export für CLI-Formatierung, Warten, Version, Argumentaufruf und verzögert geladene Befehlsgruppen; bevorzugen Sie gezielte CLI-/Laufzeitunterpfade |
    | `plugin-sdk/qa-runner-runtime` | Nach Juli 2026 nur noch privat-lokal; unterstützte Fassade, die Plugin-QA-Szenarien über die CLI-Befehlsoberfläche bereitstellt |
    | `plugin-sdk/tts-runtime` | Nach Juli 2026 nur noch privat-lokal; unterstützte Fassade für Text-zu-Sprache-Konfigurationsschemas und Laufzeithilfsfunktionen |
    | `plugin-sdk/gateway-method-runtime` | Reservierte Hilfsfunktion zur Weiterleitung von Gateway-Methoden für Plugin-HTTP-Routen, die `contracts.gatewayMethodDispatch: ["authenticated-request"]` deklarieren |
    | `plugin-sdk/gateway-runtime` | Gateway-Client, Hilfsfunktion zum ereignisschleifenbereiten Clientstart, Gateway-CLI-RPC, Gateway-Protokollfehler, Auflösung angekündigter LAN-Hosts und Hilfsfunktionen für Kanalstatus-Patches |
    | `plugin-sdk/config-contracts` | Gezielte reine Typ-Konfigurationsoberfläche für Plugin-Konfigurationsformen wie `OpenClawConfig` und Kanal-/Provider-Konfigurationstypen |
    | `plugin-sdk/plugin-config-runtime` | Veraltete Kompatibilitätsfassade für Laufzeithilfsfunktionen der Plugin-Konfiguration; neue Plugins verwenden `api.pluginConfig` sowie gezielte Konfigurationsverträge, Snapshots und Mutationshilfsfunktionen |
    | `plugin-sdk/config-mutation` | Transaktionale Hilfsfunktionen für Konfigurationsänderungen wie `mutateConfigFile`, `replaceConfigFile` und `logConfigUpdated` |
    | `plugin-sdk/message-tool-delivery-hints` | Nach Juli 2026 nur noch privat-lokal; gemeinsame Hinweiszeichenfolgen für Zustellungsmetadaten von Nachrichtenwerkzeugen |
    | `plugin-sdk/runtime-config-snapshot` | Hilfsfunktionen für Snapshots der aktuellen Prozesskonfiguration wie `getRuntimeConfig`, `getRuntimeConfigSnapshot` und Test-Snapshot-Setter |
    | `plugin-sdk/text-autolink-runtime` | Nach Juli 2026 nur noch privat-lokal; Erkennung automatisch zu verlinkender Dateiverweise ohne den breiten Text-Barrel-Export |
    | `plugin-sdk/reply-runtime` | Gemeinsame Laufzeithilfsfunktionen für Eingang/Antwort, Aufteilung, Weiterleitung, Heartbeat und Antwortplanung |
    | `plugin-sdk/reply-dispatch-runtime` | Schlanke Hilfsfunktionen zur Antwortweiterleitung/-finalisierung und für Konversationsbezeichnungen |
    | `plugin-sdk/reply-history` | Gemeinsame Hilfsfunktionen für den kurzzeitigen Antwortverlauf. Neuer Code für Nachrichtendurchläufe sollte `createChannelHistoryWindow` verwenden; Hilfsfunktionen für untergeordnete Maps bleiben ausschließlich veraltete Kompatibilitätsexporte |
    | `plugin-sdk/reply-reference` | Nach Juli 2026 nur noch privat-lokal; `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | Schlanke Hilfsfunktionen zur Text-/Markdown-Aufteilung |
    | `plugin-sdk/session-store-runtime` | Hilfsfunktionen für Sitzungsabläufe (`getSessionEntry`, `listSessionEntries`, `patchSessionEntry`, `upsertSessionEntry`), Reparatur-/Lebenszyklushilfsfunktionen (`deleteSessionEntry`, `cleanupSessionLifecycleArtifacts`, `resolveSessionStoreBackupPaths`), Markierungshilfsfunktionen für vorübergehende `sessionFile`-Werte, begrenztes Lesen aktueller Benutzer-/Assistenten-Transkripttexte anhand der Sitzungsidentität, Hilfsfunktionen für Sitzungsspeicherpfad/Sitzungsschlüssel und Lesen des Aktualisierungszeitpunkts, ohne breite Importe für Konfigurationsschreibvorgänge/-wartung |
    | `plugin-sdk/session-transcript-runtime` | Nach Juli 2026 nur noch privat-lokal; Transkriptidentität, begrenzte rohe und sichtbare Cursor, bereichsbezogene Ziel-/Lese-/Schreibhilfsfunktionen, Projektion sichtbarer Nachrichteneinträge, Veröffentlichung von Aktualisierungen, Schreibsperren und Trefferschlüssel für den Transkriptspeicher |
    | `plugin-sdk/sqlite-runtime` | Nach Juli 2026 nur noch privat-lokal; gezielte Hilfsfunktionen für SQLite-Agentenschema, Pfade und Transaktionen der Erstanbieter-Laufzeit, ohne Steuerung des Datenbanklebenszyklus |
    | `plugin-sdk/cron-store-runtime` | Nach Juli 2026 nur noch privat-lokal; Hilfsfunktionen für Pfad, Laden und Speichern des Cron-Speichers |
    | `plugin-sdk/state-paths` | Hilfsfunktionen für Verzeichnispfade von Zustand/OAuth |
    | `plugin-sdk/plugin-state-runtime` | Nach Juli 2026 nur noch privat-lokal; Plugin-bezogene Verträge für schlüsselbasierten Zustand, BLOBs und kooperative SQLite-Leases sowie Verbindungs-Pragmas, verifizierte WAL-Wartung und atomare STRICT-Schemamigrationshilfsfunktionen. Lease-Callbacks erhalten ein Abbruchsignal, und typisierte Fehler unterscheiden zwischen Zeitüberschreitung, Abbruch, verlorenem Besitz, ungültiger Eingabe und Speicherfehlern |
    | `plugin-sdk/routing` | Hilfsfunktionen für Routen-/Sitzungsschlüssel-/Kontobindung wie `resolveAgentRoute`, `buildAgentSessionKey` und `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | Gemeinsame Hilfsfunktionen für Kanal-/Kontostatuszusammenfassungen, Standardwerte des Laufzeitzustands und Problemmetadaten |
    | `plugin-sdk/target-resolver-runtime` | Nach Juli 2026 nur noch privat-lokal; gemeinsame Hilfsfunktionen zur Zielauflösung |
    | `plugin-sdk/string-normalization-runtime` | Nach Juli 2026 nur noch privat-lokal; Hilfsfunktionen zur Normalisierung von Slugs/Zeichenfolgen |
    | `plugin-sdk/request-url` | Nach Juli 2026 nur noch privat-lokal; Extrahieren von URL-Zeichenfolgen aus Fetch-/Request-ähnlichen Eingaben |
    | `plugin-sdk/run-command` | Zeitgesteuerter Befehls-Runner mit normalisierten stdout-/stderr-Ergebnissen |
    | `plugin-sdk/param-readers` | Gemeinsame Parameterleser für Werkzeuge/CLI |
    | `plugin-sdk/tool-plugin` | Definiert ein einfaches typisiertes Agentenwerkzeug-Plugin und stellt statische Metadaten für die Manifestgenerierung bereit |
    | `plugin-sdk/tool-payload` | Nach Juli 2026 nur noch privat-lokal; Extrahieren normalisierter Nutzdaten aus Werkzeugergebnisobjekten |
    | `plugin-sdk/tool-send` | Extrahieren kanonischer Sendeziel-Felder aus Werkzeugargumenten |
    | `plugin-sdk/sandbox` | Nach Juli 2026 nur noch privat-lokal; Sandbox-Backend-Typen und SSH-/OpenShell-Befehlshilfsfunktionen einschließlich Vorabprüfung von Ausführungsbefehlen mit sofortigem Abbruch bei Fehlern |
    | `plugin-sdk/temp-path` | Gemeinsame Hilfsfunktionen für temporäre Downloadpfade und private sichere temporäre Arbeitsbereiche |
    | `plugin-sdk/logging-core` | Hilfsfunktionen für Subsystem-Logger und Schwärzung |
    | `plugin-sdk/markdown-table-runtime` | Nach Juli 2026 nur noch privat-lokal; Hilfsfunktionen für Markdown-Tabellenmodus und -konvertierung |
    | `plugin-sdk/model-session-runtime` | Hilfsfunktionen für Modell-/Sitzungsüberschreibungen wie `applyModelOverrideToSessionEntry` und `resolveAgentMaxConcurrent` |
    | `plugin-sdk/talk-config-runtime` | Nach Juli 2026 nur noch privat-lokal; Hilfsfunktionen zur Auflösung der Talk-Provider-Konfiguration |
    | `plugin-sdk/json-store` | Kleine Hilfsfunktionen zum Lesen/Schreiben von JSON-Zuständen |
    | `plugin-sdk/json-unsafe-integers` | Nach Juli 2026 nur noch privat-lokal; JSON-Parsing-Hilfsfunktionen, die unsichere Ganzzahlliterale als Zeichenfolgen beibehalten |
    | `plugin-sdk/file-lock` | Nach Juli 2026 nur noch privat-lokal; wiedereintrittsfähige Dateisperrhilfsfunktionen sowie Doctor-sichere Rückgewinnung eindeutig veralteter, unveränderter, außer Betrieb genommener Sperr-Sidecars |
    | `plugin-sdk/persistent-dedupe` | Hilfsfunktionen für einen datenträgergestützten Deduplizierungs-Cache |
    | `plugin-sdk/ingress-effect-once` | Dauerhafte Claim-/Commit-Schutzvorrichtung für nicht idempotente Nebeneffekte eingehender Vorgänge |
    | `plugin-sdk/acp-runtime` | Nach Juli 2026 nur noch privat-lokal; ACP-Laufzeit-/Sitzungs- und Antwortweiterleitungshilfsfunktionen |
    | `plugin-sdk/acp-runtime-backend` | Nach Juli 2026 nur noch privat-lokal; leichtgewichtige ACP-Backend-Registrierungs- und Antwortweiterleitungshilfsfunktionen für beim Start geladene Plugins |
    | `plugin-sdk/acp-binding-resolve-runtime` | Nach Juli 2026 nur noch privat-lokal; schreibgeschützte ACP-Bindungsauflösung ohne Importe für den Lebenszyklusstart |
    | `plugin-sdk/agent-config-primitives` | Veraltete Agentenlaufzeit-Konfigurationsschema-Primitive; importieren Sie Schema-Primitive aus einer gepflegten, Plugin-eigenen Oberfläche |
    | `plugin-sdk/boolean-param` | Toleranter Leser für boolesche Parameter |
    | `plugin-sdk/dangerous-name-runtime` | Nach Juli 2026 nur noch privat-lokal; Hilfsfunktionen zur Auflösung des Abgleichs gefährlicher Namen |
    | `plugin-sdk/device-bootstrap` | Hilfsfunktionen für Geräte-Bootstrap und Kopplungstoken einschließlich `BOOTSTRAP_HANDOFF_OPERATOR_SCOPES` |
    | `plugin-sdk/extension-shared` | Gemeinsame Primitive für passive Kanäle, Status und Umgebungsproxys |
    | `plugin-sdk/models-provider-runtime` | `/models`-Hilfsfunktionen für Befehls-/Provider-Antworten |
    | `plugin-sdk/skill-commands-runtime` | Hilfsfunktionen zum Auflisten von Skill-Befehlen |
    | `plugin-sdk/native-command-registry` | Hilfsfunktionen für Registrierung, Erstellung und Serialisierung nativer Befehle |
    | `plugin-sdk/agent-harness` | Experimentelle Oberfläche für vertrauenswürdige Plugins und untergeordnete Agenten-Harnesses: Harness-Typen, Hilfsfunktionen zum Steuern/Abbrechen aktiver Läufe, OpenClaw-Werkzeugbrücken, Richtlinienhilfsfunktionen für Laufzeitplanwerkzeuge, Klassifizierung von Terminalergebnissen, Formatierungs-/Detailhilfsfunktionen für Werkzeugfortschritte und Dienstprogramme für Versuchsergebnisse |
    | `plugin-sdk/async-lock-runtime` | Nach Juli 2026 nur noch privat-lokal; prozesslokale asynchrone Sperrhilfsfunktion für kleine Laufzeitzustandsdateien |
    | `plugin-sdk/channel-activity-runtime` | Nach Juli 2026 nur noch privat-lokal; Telemetriehilfsfunktion für Kanalaktivität |
    | `plugin-sdk/concurrency-runtime` | Nach Juli 2026 nur noch privat-lokal; Hilfsfunktion zur Begrenzung der Nebenläufigkeit asynchroner Aufgaben |
    | `plugin-sdk/dedupe-runtime` | Hilfsfunktionen für speicherinterne und persistent gestützte Deduplizierungs-Caches |
    | `plugin-sdk/delivery-queue-runtime` | Nach Juli 2026 nur noch privat-lokal; Hilfsfunktion zum Leeren ausstehender ausgehender Zustellungen |
    | `plugin-sdk/file-access-runtime` | Nach Juli 2026 nur noch privat-lokal; sichere Hilfsfunktionen für lokale Datei- und Medienquellenpfade |
    | `plugin-sdk/heartbeat-runtime` | Nach Juli 2026 nur noch privat-lokal; Hilfsfunktionen für Heartbeat-Aufwecken, -Ereignisse und -Sichtbarkeit |
    | `plugin-sdk/expect-runtime` | Nach Juli 2026 nur noch privat-lokal; Hilfsfunktion zur Zusicherung erforderlicher Werte für beweisbare Laufzeitinvarianten |
    | `plugin-sdk/number-runtime` | Nach Juli 2026 nur noch privat-lokal; Hilfsfunktion zur numerischen Typumwandlung |
    | `plugin-sdk/secure-random-runtime` | Nach Juli 2026 nur noch privat-lokal; Hilfsfunktionen für sichere Token/UUIDs |
    | `plugin-sdk/system-event-runtime` | Nach Juli 2026 nur noch privat-lokal; Hilfsfunktionen für die Systemereigniswarteschlange |
    | `plugin-sdk/transport-ready-runtime` | Nach Juli 2026 nur noch privat-lokal; Hilfsfunktion zum Warten auf Transportbereitschaft |
    | `plugin-sdk/exec-approvals-runtime` | Nach Juli 2026 nur noch privat-lokal; Hilfsfunktionen für Richtliniendateien zur Ausführungsgenehmigung ohne den breiten Infrastruktur-Laufzeit-Barrel-Export |
    | `plugin-sdk/infra-runtime` | Veralteter Kompatibilitäts-Shim; verwenden Sie die gezielten Laufzeitunterpfade oben |
    | `plugin-sdk/collection-runtime` | Kleine Hilfsfunktionen für begrenzte Caches |
    | `plugin-sdk/diagnostic-runtime` | Hilfsfunktionen für Diagnose-Flags, -Ereignisse und Trace-Kontexte |
    | `plugin-sdk/error-runtime` | Hilfsfunktionen für Fehlergraphen, Formatierung und gemeinsame Fehlerklassifizierung, `PlatformMessageNotDispatchedError`, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | Nach Juli 2026 nur noch privat-lokal; Hilfsfunktionen für umschlossenes Fetch, Proxy, EnvHttpProxyAgent-Optionen und angeheftete Lookups |
    | `plugin-sdk/runtime-fetch` | Nach Juli 2026 nur noch privat-lokal; Dispatcher-fähiges Laufzeit-Fetch ohne Proxy-/geschützte-Fetch-Importe |
    | `plugin-sdk/inline-image-data-url-runtime` | Nach Juli 2026 nur noch privat-lokal; Hilfsfunktionen zur Bereinigung von Inline-Bilddaten-URLs und Signaturerkennung ohne die breite Medienlaufzeitoberfläche |
    | `plugin-sdk/response-limit-runtime` | Nach Juli 2026 nur noch privat-lokal; durch Bytezahl, Leerlauf und Frist begrenzte Leser für Antwortinhalte ohne die breite Medienlaufzeitoberfläche |
    | `plugin-sdk/session-binding-runtime` | Nach Juli 2026 nur noch privat-lokal; aktueller Konversationsbindungszustand ohne konfigurierte Bindungsweiterleitung oder Kopplungsspeicher |
    | `plugin-sdk/context-visibility-runtime` | Nach Juli 2026 nur noch privat-lokal; Auflösung der Kontextsichtbarkeit und Filterung ergänzender Kontexte ohne breite Konfigurations-/Sicherheitsimporte |
    | `plugin-sdk/string-coerce-runtime` | Schlanke Hilfsfunktionen für primitive Datensatz-/Zeichenfolgen-Typumwandlung und -normalisierung ohne Markdown-/Protokollierungsimporte |
    | `plugin-sdk/html-entity-runtime` | Nach Juli 2026 nur noch privat-lokal; Dekodierung mit Semikolon abgeschlossener HTML5-Entitäten in einem Durchlauf ohne breite Textdienstprogramme |
    | `plugin-sdk/text-utility-runtime` | Ab Juli 2026 nur noch privat-lokal; grundlegende Text- und Pfadhelfer, einschließlich HTML-Escaping für fünf Entitäten |
    | `plugin-sdk/widget-html` | Erkennung vollständiger Dokumente, Größenvalidierung und Fehler bei Tool-Eingaben für eigenständige HTML-Widgets |
    | `plugin-sdk/host-runtime` | Ab Juli 2026 nur noch privat-lokal; Helfer zur Normalisierung von Hostnamen und SCP-Hosts |
    | `plugin-sdk/retry-runtime` | Ab Juli 2026 nur noch privat-lokal; Helfer für Wiederholungskonfiguration und Wiederholungsausführung |
    | `plugin-sdk/agent-runtime` | Veralteter allgemeiner Barrel-Export für Helfer zu Agentenverzeichnis, -identität und -arbeitsbereich, einschließlich `resolveAgentDir`, `resolveDefaultAgentDir` und des veralteten Kompatibilitätsexports `resolveOpenClawAgentDir`; bevorzugen Sie gezielte Agenten-/Runtime-Unterpfade |
    | `plugin-sdk/directory-runtime` | Konfigurationsgestützte Verzeichnisabfrage und Deduplizierung |
    | `plugin-sdk/keyed-async-queue` | Ab Juli 2026 nur noch privat-lokal; `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Unterpfade für Funktionen und Tests">
    | Unterpfad | Wichtige Exporte |
    | --- | --- |
    | `plugin-sdk/media-runtime` | Veraltetes umfassendes Medien-Barrel einschließlich `saveRemoteMedia`, `saveResponseMedia`, `readRemoteMediaBuffer` und des veralteten `fetchRemoteMedia`; bevorzugen Sie `plugin-sdk/media-store`, `plugin-sdk/media-mime`, `plugin-sdk/outbound-media` und Unterpfade der Funktions-Runtime sowie Store-Hilfsfunktionen vor Pufferlesevorgängen, wenn eine URL zu OpenClaw-Medien werden soll |
    | `plugin-sdk/media-mime` | Eng gefasste MIME-Normalisierung, Zuordnung von Dateierweiterungen, MIME-Erkennung und Hilfsfunktionen für Medienarten |
    | `plugin-sdk/media-store` | Eng gefasste Medienspeicher-Hilfsfunktionen wie `saveMediaBuffer` und `saveMediaStream` |
    | `plugin-sdk/media-generation-runtime` | Nach Juli 2026 privat und lokal; gemeinsame Failover-Hilfsfunktionen für die Mediengenerierung, Kandidatenauswahl und Meldungen bei fehlenden Modellen |
    | `plugin-sdk/media-understanding` | Veraltete Kompatibilitätsfassade für Provider-Typen und Hilfsfunktionen zum Medienverständnis; neue Provider registrieren sich über die injizierte Plugin-API und belassen Anfrage-Hilfsfunktionen im Eigentum des Plugins |
    | `plugin-sdk/text-chunking` | Ausgehender Text und bereichsbasierte Segmentierung unter Beibehaltung von Offsets, Markdown-Segmentierung und Rendering-Hilfsfunktionen, anführungszeichenbewusste Tokenisierung von HTML-Tags, Konvertierung von Markdown-Tabellen, Entfernung von Direktiven-Tags und Hilfsfunktionen für sicheren Text |
    | `plugin-sdk/speech` | Nach Juli 2026 privat und lokal; Typen für Sprach-Provider sowie providerseitige Exporte für Direktiven, Registry, Validierung, einen OpenAI-kompatiblen TTS-Builder und Sprach-Hilfsfunktionen |
    | `plugin-sdk/speech-core` | Nach Juli 2026 privat und lokal; gemeinsame Exporte für Typen von Sprach-Providern, Registry, Direktiven, Normalisierung und Sprach-Hilfsfunktionen |
    | `plugin-sdk/speech-settings` | Leichtgewichtige Primitive zur Auflösung und Normalisierung der TTS-Konfiguration ohne Provider-Registries oder Synthese-Runtime |
    | `plugin-sdk/realtime-transcription` | Nach Juli 2026 privat und lokal; Typen für Echtzeit-Transkriptions-Provider, Registry-Hilfsfunktionen und gemeinsame WebSocket-Sitzungs-Hilfsfunktion |
    | `plugin-sdk/realtime-bootstrap-context` | Nach Juli 2026 privat und lokal; Hilfsfunktion zum Initialisieren von Echtzeitprofilen für die begrenzte Kontextinjektion von `IDENTITY.md`, `USER.md` und `SOUL.md` |
    | `plugin-sdk/realtime-voice` | Nach Juli 2026 privat und lokal; Typen für Echtzeit-Sprach-Provider, Registry-Hilfsfunktionen, gemeinsame Schwellenlogik für Audioenergie und Sprachbeginn sowie Hilfsfunktionen für das Echtzeit-Sprachverhalten, einschließlich des transportunabhängigen Sitzungsharnesses und der Verfolgung der Ausgabeaktivität |
    | `plugin-sdk/meeting-runtime` | Sitzungs-Runtime für Browser-Meetings, Echtzeit-Audio-Engines und -Transporte, `MeetingPlatformAdapter`, Browser-/Node-Steuerung, Agent-Konsultation, Delegierung von Sprachanrufen, Einrichtungsprüfungen und Hilfsfunktionen für SoX-Befehle |
    | `plugin-sdk/image-generation` | Nach Juli 2026 privat und lokal; Typen für Bildgenerierungs-Provider sowie Hilfsfunktionen für Bild-Assets und Daten-URLs und der OpenAI-kompatible Bild-Provider-Builder |
    | `plugin-sdk/image-generation-core` | Nach Juli 2026 privat und lokal; gemeinsame Typen für die Bildgenerierung sowie Failover-, Authentifizierungs- und Registry-Hilfsfunktionen |
    | `plugin-sdk/music-generation` | Nach Juli 2026 privat und lokal; Provider-, Anfrage- und Ergebnistypen für die Musikgenerierung |
    | `plugin-sdk/video-generation` | Nach Juli 2026 privat und lokal; Provider-, Anfrage- und Ergebnistypen für die Videogenerierung |
    | `plugin-sdk/video-generation-core` | Nach Juli 2026 privat und lokal; gemeinsame Typen für die Videogenerierung, Failover-Hilfsfunktionen, Provider-Suche und Parsen von Modellreferenzen |
    | `plugin-sdk/transcripts` | Nach Juli 2026 privat und lokal; gemeinsame Provider-Typen für Transkriptquellen, Registry-Hilfsfunktionen, Factory für die Meeting-Provider-Bridge, Sitzungsdeskriptoren und Äußerungsmetadaten |
    | `plugin-sdk/webhook-targets` | Nach Juli 2026 privat und lokal; Webhook-Ziel-Registry und Hilfsfunktionen zur Routeninstallation |
    | `plugin-sdk/web-media` | Gemeinsame Hilfsfunktionen zum Laden entfernter/lokaler Medien |
    | `plugin-sdk/zod` | Veralteter Kompatibilitäts-Reexport; importieren Sie `zod` direkt aus `zod` |
    | `plugin-sdk/plugin-test-api` | Minimale repo-lokale Hilfsfunktion `createTestPluginApi` für Unit-Tests der direkten Plugin-Registrierung ohne Import repo-lokaler Brücken zu Test-Hilfsfunktionen |
    | `plugin-sdk/agent-runtime-test-contracts` | Repo-lokale Vertrags-Fixtures für native Agent-Runtime-Adapter in Tests zu Authentifizierung, Zustellung, Fallback, Tool-Hooks, Prompt-Overlays, Schemas und Transkriptprojektionen |
    | `plugin-sdk/channel-test-helpers` | Repo-lokale, kanalorientierte Test-Hilfsfunktionen für generische Aktions-, Einrichtungs- und Statusverträge, Verzeichnisprüfungen, den Startlebenszyklus von Konten, die Weitergabe der Sendekonfiguration, Runtime-Mocks, Statusprobleme, ausgehende Zustellung und Hook-Registrierung |
    | `plugin-sdk/channel-target-testing` | Repo-lokale gemeinsame Testsuite für Fehlerfälle bei der Zielauflösung in Kanaltests |
    | `plugin-sdk/channel-contract-testing` | Repo-lokale, eng gefasste Test-Hilfsfunktionen für Kanalverträge ohne das umfassende Test-Barrel |
    | `plugin-sdk/plugin-test-contracts` | Repo-lokale Hilfsfunktionen für Verträge zu Plugin-Paketen, Registrierung, öffentlichen Artefakten, direkten Importen, Runtime-APIs und Import-Nebeneffekten |
    | `plugin-sdk/plugin-state-test-runtime` | Repo-lokale Test-Hilfsfunktionen für Plugin-Zustandsspeicher, Eingangs-Queue und Zustandsdatenbank |
    | `plugin-sdk/provider-test-contracts` | Repo-lokale Hilfsfunktionen für Verträge zu Provider-Runtime, Authentifizierung, Erkennung, Onboarding, Katalog, Assistent, Medienfunktionen, Wiederholungsrichtlinien, Echtzeit-STT-Live-Audio, Websuche/-abruf und Streams |
    | `plugin-sdk/provider-http-test-mocks` | Nach Juli 2026 privat und lokal; repo-lokale, optional aktivierbare Vitest-HTTP-/Authentifizierungs-Mocks für Provider-Tests, die `plugin-sdk/provider-http` ausführen |
    | `plugin-sdk/reply-payload-testing` | Repo-lokale Hilfsfunktionen zum Anhängen von Metadaten an Fixtures für Antwort-Payloads |
    | `plugin-sdk/sqlite-runtime-testing` | Repo-lokale SQLite-Lebenszyklus-Hilfsfunktionen für Erstanbieter-Tests |
    | `plugin-sdk/test-fixtures` | Repo-lokale Fixtures für generische CLI-Runtime-Erfassung, Sandbox-Kontext, Skill-Writer, Agent-Nachrichten, Systemereignisse, erneutes Laden von Modulen, Pfade gebündelter Plugins, Terminaltext, Segmentierung, Authentifizierungs-Token und typisierte Fälle |
    | `plugin-sdk/test-node-mocks` | Repo-lokale, fokussierte Mock-Hilfsfunktionen für integrierte Node-Module zur Verwendung in Vitest-`vi.mock("node:*")`-Factories |
  </Accordion>

  <Accordion title="Speicher-Unterpfade">
    | Unterpfad | Wichtige Exporte |
    | --- | --- |
    | `plugin-sdk/memory-core-host-embedding-registry` | Nach Juli 2026 privat und lokal; leichtgewichtige Registry-Hilfsfunktionen für Speicher-Embedding-Provider |
    | `plugin-sdk/memory-core-host-engine-foundation` | Exporte der grundlegenden Speicher-Host-Engine |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Nach Juli 2026 privat und lokal; Embedding-Verträge des Speicher-Hosts, Registry-Zugriff, lokaler Provider sowie generische Batch-/Remote-Hilfsfunktionen. `registerMemoryEmbeddingProvider` auf dieser Oberfläche ist veraltet; verwenden Sie für neue Provider die generische Embedding-Provider-API. |
    | `plugin-sdk/memory-core-host-engine-qmd` | Nach Juli 2026 privat und lokal; Exporte der QMD-Engine des Speicher-Hosts |
    | `plugin-sdk/memory-core-host-engine-storage` | Nach Juli 2026 privat und lokal; Exporte der Speicher-Engine des Speicher-Hosts |
    | `plugin-sdk/memory-core-host-secret` | Nach Juli 2026 privat und lokal; Geheimnis-Hilfsfunktionen des Speicher-Hosts |
    | `plugin-sdk/memory-core-host-status` | Nach Juli 2026 privat und lokal; Status-Hilfsfunktionen des Speicher-Hosts |
    | `plugin-sdk/memory-core-host-runtime-cli` | Nach Juli 2026 privat und lokal; CLI-Runtime-Hilfsfunktionen des Speicher-Hosts |
    | `plugin-sdk/memory-core-host-runtime-core` | Nach Juli 2026 privat und lokal; Kern-Runtime-Hilfsfunktionen des Speicher-Hosts |
    | `plugin-sdk/memory-core-host-runtime-files` | Nach Juli 2026 privat und lokal; Datei-/Runtime-Hilfsfunktionen des Speicher-Hosts |
    | `plugin-sdk/memory-host-core` | Veraltete Kompatibilitätsfassade für herstellerneutrale Hilfsfunktionen des Speicher-Hosts. Neue Speicher-Plugins verwenden injizierte Speicherfunktionen und vom Host vorbereitete Prompts; begleitende Plugins verwenden weiterhin die beibehaltene Fassade zur Erkennung öffentlicher Artefakte, bis eine fokussierte Leseschnittstelle verfügbar ist. |
    | `plugin-sdk/memory-host-events` | Nach Juli 2026 privat und lokal; herstellerneutraler Alias für Ereignisjournal-Hilfsfunktionen des Speicher-Hosts |
    | `plugin-sdk/memory-host-markdown` | Nach Juli 2026 privat und lokal; gemeinsame Hilfsfunktionen für verwaltetes Markdown in speichernahen Plugins |
    | `plugin-sdk/memory-host-search` | Nach Juli 2026 privat und lokal; Active-Memory-Runtime-Fassade für den Zugriff auf den Suchmanager |
  </Accordion>

  <Accordion title="Reservierte Unterpfade für gebündelte Hilfsfunktionen">
    Reservierte SDK-Unterpfade für gebündelte Hilfsfunktionen sind eng gefasste, eigentümerspezifische Oberflächen für
    gebündelten Plugin-Code. Sie werden im SDK-Inventar erfasst, damit Paket-
    Builds und Aliasing deterministisch bleiben, sind jedoch keine allgemeinen APIs
    zur Plugin-Entwicklung. Neue wiederverwendbare Host-Verträge sollten generische SDK-Unterpfade
    wie `plugin-sdk/gateway-runtime` und `plugin-sdk/ssrf-runtime` verwenden.

    | Unterpfad | Eigentümer und Zweck |
    | --- | --- |
    | `plugin-sdk/codex-mcp-projection` | Nach Juli 2026 privat und lokal; Hilfsfunktion des gebündelten Codex-Plugins zur Projektion der benutzerdefinierten MCP-Serverkonfiguration in die Thread-Konfiguration des Codex-App-Servers (reservierter Paketexport) |
    | `plugin-sdk/codex-native-task-runtime` | Hilfsfunktion des gebündelten Codex-Plugins zur Spiegelung nativer Subagenten des Codex-App-Servers in den OpenClaw-Aufgabenstatus (nur repo-lokal, kein Paketexport) |

  </Accordion>
</AccordionGroup>

## Verwandte Themen

- [Übersicht über das Plugin SDK](/de/plugins/sdk-overview)
- [Einrichtung des Plugin SDK](/de/plugins/sdk-setup)
- [Plugins erstellen](/de/plugins/building-plugins)
