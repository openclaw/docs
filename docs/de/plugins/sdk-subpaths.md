---
read_when:
    - Den richtigen plugin-sdk-Unterpfad für einen Plugin-Import auswählen
    - Prüfung gebündelter Plugin-Unterpfade und Hilfsschnittstellen
summary: 'Plugin-SDK-Subpath-Katalog: Welche Importe wo liegen, nach Bereich gruppiert'
title: Plugin-SDK-Unterpfade
x-i18n:
    generated_at: "2026-05-11T20:35:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: c2ef3c37e00ca59a567e55b3b47962803e43514d6791d8fda75c7bfeffb1e142
    source_path: plugins/sdk-subpaths.md
    workflow: 16
---

Das Plugin-SDK wird als Satz enger öffentlicher Unterpfade unter
`openclaw/plugin-sdk/` bereitgestellt. Diese Seite katalogisiert die häufig
verwendeten Unterpfade, gruppiert nach Zweck. Das generierte Inventar der
Compiler-Einstiegspunkte befindet sich in
`scripts/lib/plugin-sdk-entrypoints.json`; Paket-Exports sind die öffentliche
Teilmenge nach Abzug der repository-lokalen Test-/internen Unterpfade, die in
`scripts/lib/plugin-sdk-private-local-only-subpaths.json` aufgeführt sind. Maintainer können
die Anzahl der öffentlichen Exports mit `pnpm plugin-sdk:surface` und aktive
reservierte Helfer-Unterpfade mit `pnpm plugins:boundary-report:summary`
prüfen; ungenutzte reservierte Helfer-Exports lassen den CI-Bericht fehlschlagen,
statt als ruhende Kompatibilitätsschuld im öffentlichen SDK zu verbleiben.

Den Leitfaden zum Erstellen von Plugins finden Sie unter [Plugin-SDK-Übersicht](/de/plugins/sdk-overview).

## Plugin-Einstieg

| Unterpfad                      | Wichtige Exports                                                                                                                                                       |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/plugin-entry`      | `definePluginEntry`                                                                                                                                                    |
| `plugin-sdk/core`              | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema`, `buildJsonChannelConfigSchema` |
| `plugin-sdk/config-schema`     | `OpenClawSchema`                                                                                                                                                       |
| `plugin-sdk/provider-entry`    | `defineSingleProviderPluginEntry`                                                                                                                                      |
| `plugin-sdk/migration`         | Helfer für Migrations-Provider-Elemente wie `createMigrationItem`, Reason-Konstanten, Elementstatus-Markierungen, Redaktionshelfer und `summarizeMigrationItems`        |
| `plugin-sdk/migration-runtime` | Runtime-Migrationshelfer wie `copyMigrationFileItem`, `withCachedMigrationConfigRuntime` und `writeMigrationReport`                                                   |

### Veraltete Kompatibilitäts- und Testhelfer

Diese Unterpfade bleiben Paket-Exports für ältere Plugins und OpenClaw-Testsuiten,
aber neuer Code sollte keine Importe aus ihnen hinzufügen: `agent-runtime-test-contracts`,
`channel-contract-testing`, `channel-target-testing`, `channel-test-helpers`,
`plugin-test-api`, `plugin-test-contracts`, `provider-http-test-mocks`,
`provider-test-contracts`, `test-env`, `test-fixtures`, `test-node-mocks`,
`testing`, `channel-runtime`, `compat`, `config-types`, `infra-runtime`,
`text-runtime` und `zod`. Importieren Sie `zod` in neuem Plugin-Code direkt aus
`zod`. `plugin-test-runtime` ist weiterhin ein aktiver, fokussierter
Testhelfer-Unterpfad.

### Veraltete ungenutzte öffentliche Unterpfade

Diese öffentlichen Unterpfade existierten mindestens einen Monat lang und haben
derzeit keine gebündelten Plugin-Produktionsimporte. Sie bleiben aus
Kompatibilitätsgründen importierbar, aber neuer Plugin-Code sollte stattdessen
fokussierte, aktiv genutzte SDK-Unterpfade verwenden:
`agent-config-primitives`, `channel-config-schema-legacy`,
`channel-reply-pipeline`, `channel-runtime`, `channel-secret-runtime`,
`command-auth`, `compat`, `config-runtime`, `config-schema`, `discord`,
`group-access`, `infra-runtime`, `matrix`, `mattermost`,
`media-generation-runtime-shared`, `memory-core-engine-runtime`,
`memory-core-host-multimodal`, `memory-core-host-query`,
`music-generation-core`, `self-hosted-provider-setup`, `telegram-account`,
`telegram-command-config` und `zalouser`.

### Veraltete seltene öffentliche Unterpfade

Öffentliche Unterpfade, die derzeit nur von einem oder zwei gebündelten
Plugin-Ownern verwendet werden, sind für neuen Plugin-Code ebenfalls veraltet.
Sie bleiben aus Kompatibilitätsgründen Paket-Exports, aber neuer Code sollte
aktiv gemeinsam genutzte SDK-Seams oder Plugin-eigene Paket-APIs bevorzugen.
Maintainer verfolgen die genaue Menge in
`scripts/lib/plugin-sdk-deprecated-public-subpaths.json` und das aktuelle Budget
mit `pnpm plugin-sdk:surface`.

### Veraltete breite Barrels

Diese breiten Re-Export-Barrels bleiben für OpenClaw-Quellcode und
Kompatibilitätsprüfungen baubar, aber neuer Code sollte fokussierte
SDK-Unterpfade bevorzugen:
`agent-runtime`, `channel-lifecycle`, `channel-runtime`, `cli-runtime`,
`compat`, `config-types`, `conversation-runtime`, `hook-runtime`,
`infra-runtime`, `media-runtime`, `plugin-runtime`, `security-runtime` und
`text-runtime`. `channel-runtime`, `compat`, `config-types`, `infra-runtime`
und `text-runtime` bleiben nur aus Gründen der Abwärtskompatibilität
Paket-Exports; verwenden Sie stattdessen fokussierte channel-/runtime-Unterpfade,
`config-contracts`, `string-coerce-runtime`, `text-chunking`,
`text-utility-runtime` und `logging-core`.

  <AccordionGroup>
  <Accordion title="Channel-Unterpfade">
    | Unterpfad | Wichtige Exporte |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | Root-`openclaw.json`-Zod-Schemaexport (`OpenClawSchema`) |
    | `plugin-sdk/json-schema-runtime` | Zwischengespeicherter JSON-Schema-Validierungshelfer für Plugin-eigene Schemas |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard` sowie `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | Gemeinsame Setup-Assistentenhelfer, Allowlist-Prompts, Setup-Status-Builder |
    | `plugin-sdk/setup-runtime` | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | Veralteter Kompatibilitätsalias; verwenden Sie `plugin-sdk/setup-runtime` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | Multi-Account-Konfigurations-/Action-Gate-Helfer, Default-Account-Fallback-Helfer |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, Helfer zur Normalisierung von Account-IDs |
    | `plugin-sdk/account-resolution` | Account-Suche und Default-Fallback-Helfer |
    | `plugin-sdk/account-helpers` | Schmale Helfer für Account-Listen und Account-Aktionen |
    | `plugin-sdk/access-groups` | Helfer zum Parsen von Access-Group-Allowlists und für redigierte Gruppendiagnosen |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | Legacy-Helfer für die Antwort-Pipeline. Neuer Code für Channel-Antwort-Pipelines sollte `createChannelMessageReplyPipeline` und `resolveChannelMessageSourceReplyDeliveryMode` aus `plugin-sdk/channel-message` verwenden. |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
    | `plugin-sdk/channel-config-schema` | Gemeinsame Channel-Konfigurationsschema-Primitiven sowie Zod- und direkte JSON-/TypeBox-Builder |
    | `plugin-sdk/bundled-channel-config-schema` | Gebündelte OpenClaw-Channel-Konfigurationsschemas nur für gepflegte gebündelte Plugins |
    | `plugin-sdk/channel-config-schema-legacy` | Veralteter Kompatibilitätsalias für gebündelte Channel-Konfigurationsschemas |
    | `plugin-sdk/telegram-command-config` | Telegram-Helfer zur Normalisierung/Validierung benutzerdefinierter Befehle mit gebündeltem Contract-Fallback |
    | `plugin-sdk/command-gating` | Schmale Helfer für Befehlsautorisierungs-Gates |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-ingress` | Veraltete Low-Level-Kompatibilitätsfassade für Channel-Ingress. Neue Empfangspfade sollten `plugin-sdk/channel-ingress-runtime` verwenden. |
    | `plugin-sdk/channel-ingress-runtime` | Experimenteller High-Level-Channel-Ingress-Runtime-Resolver und Route-Fact-Builder für migrierte Channel-Empfangspfade. Bevorzugen Sie dies gegenüber dem Zusammenstellen effektiver Allowlists, Befehls-Allowlists und Legacy-Projektionen in jedem Plugin. Siehe [Channel-Ingress-API](/de/plugins/sdk-channel-ingress). |
    | `plugin-sdk/channel-lifecycle` | `createAccountStatusSink`, `createChannelRunQueue` und Legacy-Helfer für den Draft-Stream-Lebenszyklus. Neuer Code zur Preview-Finalisierung sollte `plugin-sdk/channel-message` verwenden. |
    | `plugin-sdk/channel-message` | Günstige Helfer für den Nachrichtenlebenszyklus-Contract wie `defineChannelMessageAdapter`, `createChannelMessageAdapterFromOutbound`, `createChannelMessageReplyPipeline`, `createReplyPrefixContext`, `resolveChannelMessageSourceReplyDeliveryMode`, Ableitung der Durable-Final-Capability, Capability-Proof-Helfer für Send-/Receipt-/Side-Effect-Capabilities, `MessageReceiveContext`, Proofs für Empfangs-Ack-Richtlinien, `defineFinalizableLivePreviewAdapter`, `deliverWithFinalizableLivePreviewAdapter`, Proofs für Live-Preview- und Live-Finalizer-Capabilities, dauerhafter Wiederherstellungszustand, `RenderedMessageBatch`, Nachrichten-Empfangstypen und Receipt-ID-Helfer. Siehe [Channel-Message-API](/de/plugins/sdk-channel-message). Legacy-Fassaden für Reply-Dispatch sind nur als veraltete Kompatibilität gedacht. |
    | `plugin-sdk/channel-message-runtime` | Runtime-Auslieferungshelfer, die ausgehende Auslieferung laden können, einschließlich `deliverInboundReplyWithMessageSendContext`, `sendDurableMessageBatch` und `withDurableMessageSendContext`. Veraltete Reply-Dispatch-Bridges bleiben nur für Kompatibilitäts-Dispatcher importierbar. Verwenden Sie dies aus Monitor-/Send-Runtime-Modulen, nicht aus heißen Plugin-Bootstrap-Dateien. |
    | `plugin-sdk/inbound-envelope` | Gemeinsame Helfer für Inbound-Routes und Envelope-Builder |
    | `plugin-sdk/inbound-reply-dispatch` | Gemeinsame Legacy-Helfer zum Aufzeichnen und Dispatchen von Inbound-Datensätzen, sichtbare/finale Dispatch-Prädikate und veraltete `deliverDurableInboundReplyPayload`-Kompatibilität für vorbereitete Channel-Dispatcher. Neuer Channel-Empfangs-/Dispatch-Code sollte Runtime-Lebenszyklushelfer aus `plugin-sdk/channel-message-runtime` importieren. |
    | `plugin-sdk/messaging-targets` | Helfer zum Parsen/Abgleichen von Targets |
    | `plugin-sdk/outbound-media` | Gemeinsame Helfer zum Laden ausgehender Medien |
    | `plugin-sdk/outbound-send-deps` | Leichtgewichtige Dependency-Suche für ausgehendes Senden für Channel-Adapter |
    | `plugin-sdk/outbound-runtime` | Helfer für ausgehende Identität, Send-Delegate, Session, Formatierung und Payload-Planung. Direkte Auslieferungshelfer wie `deliverOutboundPayloads` sind veraltetes Kompatibilitätssubstrat; verwenden Sie `plugin-sdk/channel-message-runtime` für neue Sendepfade. |
    | `plugin-sdk/poll-runtime` | Schmale Poll-Normalisierungshelfer |
    | `plugin-sdk/thread-bindings-runtime` | Thread-Binding-Lebenszyklus- und Adapter-Helfer |
    | `plugin-sdk/agent-media-payload` | Legacy-Builder für Agent-Media-Payloads |
    | `plugin-sdk/conversation-runtime` | Helfer für Conversation-/Thread-Bindings, Pairing und konfigurierte Bindings |
    | `plugin-sdk/runtime-config-snapshot` | Helfer für Runtime-Konfigurations-Snapshots |
    | `plugin-sdk/runtime-group-policy` | Helfer zur Auflösung von Runtime-Gruppenrichtlinien |
    | `plugin-sdk/channel-status` | Gemeinsame Helfer für Channel-Status-Snapshots/-Zusammenfassungen |
    | `plugin-sdk/channel-config-primitives` | Schmale Channel-Konfigurationsschema-Primitiven |
    | `plugin-sdk/channel-config-writes` | Autorisierungshelfer für Channel-Konfigurationsschreibvorgänge |
    | `plugin-sdk/channel-plugin-common` | Gemeinsame Channel-Plugin-Prelude-Exporte |
    | `plugin-sdk/allowlist-config-edit` | Helfer zum Bearbeiten/Lesen der Allowlist-Konfiguration |
    | `plugin-sdk/group-access` | Gemeinsame Entscheidungshelfer für Gruppenzugriff |
    | `plugin-sdk/direct-dm` | Gemeinsame Auth-/Guard-Helfer für Direct-DM |
    | `plugin-sdk/discord` | Veraltete Discord-Kompatibilitätsfassade für veröffentlichtes `@openclaw/discord@2026.3.13` und nachverfolgte Owner-Kompatibilität; neue Plugins sollten generische Channel-SDK-Unterpfade verwenden |
    | `plugin-sdk/telegram-account` | Veraltete Telegram-Kompatibilitätsfassade für Account-Auflösung für nachverfolgte Owner-Kompatibilität; neue Plugins sollten injizierte Runtime-Helfer oder generische Channel-SDK-Unterpfade verwenden |
    | `plugin-sdk/zalouser` | Veraltete Zalo-Personal-Kompatibilitätsfassade für veröffentlichte Lark-/Zalo-Pakete, die weiterhin Sender-Befehlsautorisierung importieren; neue Plugins sollten `plugin-sdk/command-auth` verwenden |
    | `plugin-sdk/interactive-runtime` | Semantische Nachrichtendarstellung, Auslieferung und Legacy-Helfer für interaktive Antworten. Siehe [Nachrichtendarstellung](/de/plugins/message-presentation) |
    | `plugin-sdk/channel-inbound` | Kompatibilitäts-Barrel für Inbound-Debounce, Mention-Abgleich, Mention-Richtlinienhelfer und Envelope-Helfer |
    | `plugin-sdk/channel-inbound-debounce` | Schmale Inbound-Debounce-Helfer |
    | `plugin-sdk/channel-mention-gating` | Schmale Helfer für Mention-Richtlinien, Mention-Marker und Mention-Text ohne die breitere Inbound-Runtime-Oberfläche |
    | `plugin-sdk/channel-envelope` | Schmale Helfer zur Formatierung von Inbound-Envelopes |
    | `plugin-sdk/channel-location` | Helfer für Channel-Location-Kontext und Formatierung |
    | `plugin-sdk/channel-logging` | Channel-Logging-Helfer für Inbound-Drops und Typing-/Ack-Fehler |
    | `plugin-sdk/channel-send-result` | Typen für Antwortergebnisse |
    | `plugin-sdk/channel-actions` | Helfer für Channel-Nachrichtenaktionen sowie veraltete native Schemahelfer, die für Plugin-Kompatibilität beibehalten werden |
    | `plugin-sdk/channel-route` | Gemeinsame Routennormalisierung, parsergesteuerte Target-Auflösung, Thread-ID-Stringifizierung, Deduplizierungs-/Compact-Routenschlüssel, Typen für geparste Targets und Helfer für Routen-/Target-Vergleiche |
    | `plugin-sdk/channel-targets` | Helfer zum Parsen von Targets; Aufrufer von Routenvergleichen sollten `plugin-sdk/channel-route` verwenden |
    | `plugin-sdk/channel-contract` | Channel-Contract-Typen |
    | `plugin-sdk/channel-feedback` | Feedback-/Reaction-Verkabelung |
    | `plugin-sdk/channel-secret-runtime` | Schmale Secret-Contract-Helfer wie `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment` und Secret-Target-Typen |
  </Accordion>

  <Accordion title="Provider-Unterpfade">
    | Unterpfad | Wichtige Exporte |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/lmstudio` | Unterstützte LM Studio-Provider-Fassade für Einrichtung, Katalogerkennung und Laufzeit-Modellvorbereitung |
    | `plugin-sdk/lmstudio-runtime` | Unterstützte LM Studio-Laufzeit-Fassade für lokale Server-Standardwerte, Modellerkennung, Anfrage-Header und Hilfsfunktionen für geladene Modelle |
    | `plugin-sdk/provider-setup` | Kuratierte Hilfsfunktionen zur Einrichtung lokaler/selbst gehosteter Provider |
    | `plugin-sdk/self-hosted-provider-setup` | Fokussierte Hilfsfunktionen zur Einrichtung OpenAI-kompatibler selbst gehosteter Provider |
    | `plugin-sdk/cli-backend` | CLI-Backend-Standardwerte + Watchdog-Konstanten |
    | `plugin-sdk/provider-auth-runtime` | Laufzeit-Hilfsfunktionen zur API-Schlüssel-Auflösung für Provider-Plugins |
    | `plugin-sdk/provider-auth-api-key` | Hilfsfunktionen für API-Schlüssel-Onboarding/Profile-Schreibvorgänge wie `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | Standardmäßiger OAuth-Auth-Ergebnis-Builder |
    | `plugin-sdk/provider-env-vars` | Hilfsfunktionen zur Suche von Provider-Authentifizierungsumgebungsvariablen |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials`, veralteter Kompatibilitätsexport `resolveOpenClawAgentDir` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, gemeinsame Replay-Richtlinien-Builder, Provider-Endpunkt-Hilfsfunktionen und gemeinsame Hilfsfunktionen zur Modell-ID-Normalisierung |
    | `plugin-sdk/provider-catalog-runtime` | Laufzeit-Hook zur Provider-Katalogerweiterung und Plugin-Provider-Registry-Seams für Vertragstests |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | Generische Hilfsfunktionen für Provider-HTTP-/Endpunkt-Fähigkeiten, Provider-HTTP-Fehler und Multipart-Formular-Hilfsfunktionen für Audiotranskription |
    | `plugin-sdk/provider-web-fetch-contract` | Schmale Hilfsfunktionen für Web-Fetch-Konfigurations-/Auswahlverträge wie `enablePluginInConfig` und `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | Hilfsfunktionen für Web-Fetch-Provider-Registrierung/-Cache |
    | `plugin-sdk/provider-web-search-config-contract` | Schmale Hilfsfunktionen für Web-Search-Konfiguration/-Anmeldedaten für Provider, die keine Plugin-Aktivierungsverdrahtung benötigen |
    | `plugin-sdk/provider-web-search-contract` | Schmale Hilfsfunktionen für Web-Search-Konfigurations-/Anmeldedatenverträge wie `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` und bereichsgebundene Setter/Getter für Anmeldedaten |
    | `plugin-sdk/provider-web-search` | Hilfsfunktionen für Web-Search-Provider-Registrierung/-Cache/-Laufzeit |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks` und Gemini-Schemabereinigung + Diagnose |
    | `plugin-sdk/provider-usage` | `fetchClaudeUsage` und Ähnliches |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, Stream-Wrapper-Typen und gemeinsame Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot-Wrapper-Hilfsfunktionen |
    | `plugin-sdk/provider-transport-runtime` | Hilfsfunktionen für nativen Provider-Transport wie abgesichertes Fetching, Transport-Nachrichtentransformationen und beschreibbare Transport-Ereignisstreams |
    | `plugin-sdk/provider-onboard` | Hilfsfunktionen für Onboarding-Konfigurations-Patches |
    | `plugin-sdk/global-singleton` | Prozesslokale Singleton-/Map-/Cache-Hilfsfunktionen |
    | `plugin-sdk/group-activation` | Schmale Hilfsfunktionen für Gruppenaktivierungsmodus und Befehlsparsing |
  </Accordion>

  <Accordion title="Authentifizierungs- und Sicherheits-Unterpfade">
    | Unterpfad | Wichtige Exporte |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, Befehls-Registry-Hilfsfunktionen einschließlich dynamischer Formatierung von Argumentmenüs, Hilfsfunktionen zur Absenderautorisierung |
    | `plugin-sdk/command-status` | Builder für Befehls-/Hilfenachrichten wie `buildCommandsMessagePaginated` und `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | Hilfsfunktionen für Genehmigerauflösung und Aktionsauthentifizierung im selben Chat |
    | `plugin-sdk/approval-client-runtime` | Hilfsfunktionen für native Exec-Genehmigungsprofile/-Filter |
    | `plugin-sdk/approval-delivery-runtime` | Native Adapter für Genehmigungsfähigkeit/-Zustellung |
    | `plugin-sdk/approval-gateway-runtime` | Gemeinsame Hilfsfunktion zur Genehmigungs-Gateway-Auflösung |
    | `plugin-sdk/approval-handler-adapter-runtime` | Leichtgewichtige Hilfsfunktionen zum Laden nativer Genehmigungsadapter für schnelle Kanal-Einstiegspunkte |
    | `plugin-sdk/approval-handler-runtime` | Breitere Laufzeit-Hilfsfunktionen für Genehmigungs-Handler; bevorzugen Sie die schmaleren Adapter-/Gateway-Seams, wenn sie ausreichen |
    | `plugin-sdk/approval-native-runtime` | Hilfsfunktionen für native Genehmigungsziele + Kontobindung |
    | `plugin-sdk/approval-reply-runtime` | Hilfsfunktionen für Exec-/Plugin-Genehmigungsantwort-Payloads |
    | `plugin-sdk/approval-runtime` | Hilfsfunktionen für Exec-/Plugin-Genehmigungs-Payloads, native Genehmigungs-Routing-/Laufzeit-Hilfsfunktionen und Hilfsfunktionen zur strukturierten Genehmigungsanzeige wie `formatApprovalDisplayPath` |
    | `plugin-sdk/reply-dedupe` | Schmale Hilfsfunktionen zum Zurücksetzen der Deduplizierung eingehender Antworten |
    | `plugin-sdk/channel-contract-testing` | Schmale Hilfsfunktionen für Kanal-Vertragstests ohne das breite Testing-Barrel |
    | `plugin-sdk/command-auth-native` | Native Befehlsauthentifizierung, dynamische Formatierung von Argumentmenüs und Hilfsfunktionen für native Sitzungsziele |
    | `plugin-sdk/command-detection` | Gemeinsame Hilfsfunktionen zur Befehlserkennung |
    | `plugin-sdk/command-primitives-runtime` | Leichtgewichtige Befehlstext-Prädikate für schnelle Kanalpfade |
    | `plugin-sdk/command-surface` | Hilfsfunktionen für Befehlsrumpf-Normalisierung und Befehlsoberflächen |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | Schmale Hilfsfunktionen zur Sammlung von Secret-Verträgen für Kanal-/Plugin-Secret-Oberflächen |
    | `plugin-sdk/secret-ref-runtime` | Schmale `coerceSecretRef`- und SecretRef-Typisierungshilfsfunktionen für Secret-Vertrags-/Konfigurationsparsing |
    | `plugin-sdk/security-runtime` | Gemeinsame Hilfsfunktionen für Vertrauen, DM-Gating, auf das Stammverzeichnis begrenzte Datei-/Pfadoperationen einschließlich Create-only-Schreibvorgängen, synchrone/asynchrone atomare Dateiersetzung, Geschwister-Temporärschreibvorgänge, Fallback für geräteübergreifendes Verschieben, private Dateispeicher-Hilfsfunktionen, Symlink-Parent-Guards, externe Inhalte, Schwärzung sensibler Texte, Secret-Vergleich in konstanter Zeit und Secret-Sammlungen |
    | `plugin-sdk/ssrf-policy` | Hilfsfunktionen für Host-Allowlist und Private-Network-SSRF-Richtlinien |
    | `plugin-sdk/ssrf-dispatcher` | Schmale Hilfsfunktionen für angeheftete Dispatcher ohne die breite Infra-Laufzeitoberfläche |
    | `plugin-sdk/ssrf-runtime` | Hilfsfunktionen für angeheftete Dispatcher, SSRF-geschütztes Fetching, SSRF-Fehler und SSRF-Richtlinien |
    | `plugin-sdk/secret-input` | Hilfsfunktionen zum Parsen von Secret-Eingaben |
    | `plugin-sdk/webhook-ingress` | Hilfsfunktionen für Webhook-Anfragen/-Ziele und Roh-Websocket-/Body-Koerzierung |
    | `plugin-sdk/webhook-request-guards` | Hilfsfunktionen für Request-Body-Größe/-Timeouts |
  </Accordion>

  <Accordion title="Runtime and storage subpaths">
    | Unterpfad | Wichtige Exporte |
    | --- | --- |
    | `plugin-sdk/runtime` | Breite Runtime-/Logging-/Backup-/Plugin-Installationshelfer |
    | `plugin-sdk/runtime-env` | Schmale Helfer für Runtime-Umgebung, Logger, Timeout, Retry und Backoff |
    | `plugin-sdk/browser-config` | Unterstützte Browser-Konfigurationsfassade für normalisierte Profile/Defaults, CDP-URL-Parsing und Auth-Helfer für Browser-Steuerung |
    | `plugin-sdk/channel-runtime-context` | Generische Helfer zur Registrierung und Suche von Channel-Runtime-Kontexten |
    | `plugin-sdk/matrix` | Veraltete Matrix-Kompatibilitätsfassade für ältere Channel-Pakete von Drittanbietern; neue Plugins sollten `plugin-sdk/run-command` direkt importieren |
    | `plugin-sdk/mattermost` | Veraltete Mattermost-Kompatibilitätsfassade für ältere Channel-Pakete von Drittanbietern; neue Plugins sollten generische SDK-Unterpfade direkt importieren |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Gemeinsame Helfer für Plugin-Befehle, Hooks, HTTP und interaktive Abläufe |
    | `plugin-sdk/hook-runtime` | Gemeinsame Helfer für Webhook-/interne Hook-Pipelines |
    | `plugin-sdk/lazy-runtime` | Helfer für Lazy-Runtime-Importe/-Bindings wie `createLazyRuntimeModule`, `createLazyRuntimeMethod` und `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | Helfer für Prozessausführung |
    | `plugin-sdk/cli-runtime` | Helfer für CLI-Formatierung, Warten, Versionen, Argumentaufrufe und Lazy-Befehlsgruppen |
    | `plugin-sdk/gateway-runtime` | Gateway-Client, Helfer zum Starten eines Event-Loop-bereiten Clients, Gateway-CLI-RPC, Gateway-Protokollfehler und Helfer für Channel-Status-Patches |
    | `plugin-sdk/config-contracts` | Fokussierte reine Typ-Konfigurationsoberfläche für Plugin-Konfigurationsformen wie `OpenClawConfig` und Channel-/Provider-Konfigurationstypen |
    | `plugin-sdk/plugin-config-runtime` | Runtime-Helfer zur Plugin-Konfigurationssuche wie `requireRuntimeConfig`, `resolvePluginConfigObject` und `resolveLivePluginConfigObject` |
    | `plugin-sdk/config-mutation` | Transaktionale Helfer zur Konfigurationsmutation wie `mutateConfigFile`, `replaceConfigFile` und `logConfigUpdated` |
    | `plugin-sdk/runtime-config-snapshot` | Helfer für aktuelle Prozess-Konfigurationssnapshots wie `getRuntimeConfig`, `getRuntimeConfigSnapshot` und Test-Snapshot-Setter |
    | `plugin-sdk/telegram-command-config` | Normalisierung von Telegram-Befehlsnamen/-beschreibungen und Prüfungen auf Duplikate/Konflikte, auch wenn die gebündelte Telegram-Vertragsoberfläche nicht verfügbar ist |
    | `plugin-sdk/text-autolink-runtime` | Erkennung von Autolinks für Dateireferenzen ohne das breite Text-Barrel |
    | `plugin-sdk/approval-runtime` | Helfer für Exec-/Plugin-Genehmigungen, Approval-Capability-Builder, Auth-/Profilhelfer, native Routing-/Runtime-Helfer und strukturierte Formatierung von Anzeige-Pfaden für Genehmigungen |
    | `plugin-sdk/reply-runtime` | Gemeinsame Runtime-Helfer für eingehende Nachrichten/Antworten, Chunking, Dispatch, Heartbeat, Antwortplaner |
    | `plugin-sdk/reply-dispatch-runtime` | Schmale Helfer für Antwort-Dispatch/-Finalisierung und Konversationslabels |
    | `plugin-sdk/reply-history` | Gemeinsame Helfer und Marker für Antwortverläufe in kurzen Zeitfenstern wie `buildHistoryContext`, `HISTORY_CONTEXT_MARKER`, `recordPendingHistoryEntry` und `clearHistoryEntriesIfEnabled` |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | Schmale Helfer für Text-/Markdown-Chunking |
    | `plugin-sdk/session-store-runtime` | Helfer für Session-Store-Pfad, Session-Schlüssel, Aktualisierungszeitpunkt und Store-Mutationen |
    | `plugin-sdk/cron-store-runtime` | Helfer für Pfad/Laden/Speichern des Cron-Store |
    | `plugin-sdk/state-paths` | Pfadhelfer für State-/OAuth-Verzeichnisse |
    | `plugin-sdk/routing` | Helfer für Routen-/Session-Schlüssel-/Account-Bindings wie `resolveAgentRoute`, `buildAgentSessionKey` und `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | Gemeinsame Helfer für Channel-/Account-Statuszusammenfassungen, Runtime-State-Defaults und Issue-Metadaten |
    | `plugin-sdk/target-resolver-runtime` | Gemeinsame Helfer zur Zielauflösung |
    | `plugin-sdk/string-normalization-runtime` | Helfer zur Slug-/String-Normalisierung |
    | `plugin-sdk/request-url` | String-URLs aus fetch-/request-ähnlichen Eingaben extrahieren |
    | `plugin-sdk/run-command` | Befehls-Runner mit Zeitlimit und normalisierten stdout-/stderr-Ergebnissen |
    | `plugin-sdk/param-readers` | Gemeinsame Tool-/CLI-Parameterleser |
    | `plugin-sdk/tool-payload` | Normalisierte Payloads aus Tool-Ergebnisobjekten extrahieren |
    | `plugin-sdk/tool-send` | Kanonische Send-Zielfelder aus Tool-Argumenten extrahieren |
    | `plugin-sdk/temp-path` | Gemeinsame Helfer für temporäre Download-Pfade und private sichere temporäre Arbeitsbereiche |
    | `plugin-sdk/logging-core` | Subsystem-Logger und Redaktionshelfer |
    | `plugin-sdk/markdown-table-runtime` | Helfer für Markdown-Tabellenmodus und Konvertierung |
    | `plugin-sdk/model-session-runtime` | Helfer für Modell-/Session-Overrides wie `applyModelOverrideToSessionEntry` und `resolveAgentMaxConcurrent` |
    | `plugin-sdk/talk-config-runtime` | Helfer zur Auflösung der Talk-Provider-Konfiguration |
    | `plugin-sdk/json-store` | Kleine Helfer zum Lesen/Schreiben von JSON-State |
    | `plugin-sdk/file-lock` | Reentrante File-Lock-Helfer |
    | `plugin-sdk/persistent-dedupe` | Festplattenbasierte Helfer für Dedupe-Caches |
    | `plugin-sdk/acp-runtime` | ACP-Runtime-/Session- und Antwort-Dispatch-Helfer |
    | `plugin-sdk/acp-runtime-backend` | Leichtgewichtige ACP-Backend-Registrierungs- und Antwort-Dispatch-Helfer für beim Start geladene Plugins |
    | `plugin-sdk/acp-binding-resolve-runtime` | Schreibgeschützte ACP-Binding-Auflösung ohne Lifecycle-Startimporte |
    | `plugin-sdk/agent-config-primitives` | Schmale Primitive für Agent-Runtime-Konfigurationsschemas |
    | `plugin-sdk/boolean-param` | Lockerer boolescher Parameterleser |
    | `plugin-sdk/dangerous-name-runtime` | Helfer zur Auflösung von Dangerous-Name-Abgleichen |
    | `plugin-sdk/device-bootstrap` | Helfer für Geräte-Bootstrap und Pairing-Token |
    | `plugin-sdk/extension-shared` | Gemeinsame Primitive für passive Channels, Status und Ambient-Proxy-Helfer |
    | `plugin-sdk/models-provider-runtime` | Helfer für `/models`-Befehls-/Provider-Antworten |
    | `plugin-sdk/skill-commands-runtime` | Helfer zum Auflisten von Skill-Befehlen |
    | `plugin-sdk/native-command-registry` | Helfer für Registry/Aufbau/Serialisierung nativer Befehle |
    | `plugin-sdk/agent-harness` | Experimentelle Oberfläche für vertrauenswürdige Plugins für Low-Level-Agent-Harnesses: Harness-Typen, Helfer zum Steuern/Abbrechen aktiver Runs, OpenClaw-Tool-Bridge-Helfer, Helfer für Runtime-Plan-Tool-Policy, Klassifizierung von Terminal-Ergebnissen, Helfer für Tool-Fortschrittsformatierung/-details und Attempt-Result-Dienstprogramme |
    | `plugin-sdk/provider-zai-endpoint` | Veraltete Provider-eigene Fassade zur Z.AI-Endpunkterkennung; verwenden Sie die öffentliche API des Z.AI-Plugins |
    | `plugin-sdk/async-lock-runtime` | Prozesslokaler Async-Lock-Helfer für kleine Runtime-State-Dateien |
    | `plugin-sdk/channel-activity-runtime` | Helfer für Channel-Aktivitätstelemetrie |
    | `plugin-sdk/concurrency-runtime` | Helfer für begrenzte Nebenläufigkeit asynchroner Tasks |
    | `plugin-sdk/dedupe-runtime` | Helfer für In-Memory-Dedupe-Caches |
    | `plugin-sdk/delivery-queue-runtime` | Helfer zum Leeren ausstehender ausgehender Zustellungen |
    | `plugin-sdk/file-access-runtime` | Sichere Helfer für lokale Datei- und Medienquellenpfade |
    | `plugin-sdk/heartbeat-runtime` | Helfer für Heartbeat-Wakeup, Ereignisse und Sichtbarkeit |
    | `plugin-sdk/number-runtime` | Helfer für numerische Koersion |
    | `plugin-sdk/secure-random-runtime` | Helfer für sichere Token/UUIDs |
    | `plugin-sdk/system-event-runtime` | Helfer für Systemereignis-Warteschlangen |
    | `plugin-sdk/transport-ready-runtime` | Helfer zum Warten auf Transportbereitschaft |
    | `plugin-sdk/infra-runtime` | Veralteter Kompatibilitäts-Shim; verwenden Sie die fokussierten Runtime-Unterpfade oben |
    | `plugin-sdk/collection-runtime` | Kleine Helfer für begrenzte Caches |
    | `plugin-sdk/diagnostic-runtime` | Helfer für Diagnose-Flags, Ereignisse und Trace-Kontext |
    | `plugin-sdk/error-runtime` | Helfer für Fehlergraph, Formatierung, gemeinsame Fehlerklassifizierung, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | Umwickeltes Fetch, Proxy, EnvHttpProxyAgent-Option und Helfer für gepinntes Lookup |
    | `plugin-sdk/runtime-fetch` | Dispatcher-bewusstes Runtime-Fetch ohne Proxy-/Guarded-Fetch-Importe |
    | `plugin-sdk/response-limit-runtime` | Begrenzter Response-Body-Reader ohne die breite Media-Runtime-Oberfläche |
    | `plugin-sdk/session-binding-runtime` | Aktueller Konversations-Binding-State ohne konfiguriertes Binding-Routing oder Pairing-Stores |
    | `plugin-sdk/session-store-runtime` | Session-Store-Helfer ohne breite Konfigurationsschreib-/Wartungsimporte |
    | `plugin-sdk/context-visibility-runtime` | Auflösung der Kontextsichtbarkeit und Filterung ergänzender Kontexte ohne breite Konfigurations-/Sicherheitsimporte |
    | `plugin-sdk/string-coerce-runtime` | Schmale Helfer für primitive Record-/String-Koersion und Normalisierung ohne Markdown-/Logging-Importe |
    | `plugin-sdk/host-runtime` | Helfer zur Normalisierung von Hostnamen und SCP-Hosts |
    | `plugin-sdk/retry-runtime` | Helfer für Retry-Konfiguration und Retry-Runner |
    | `plugin-sdk/agent-runtime` | Helfer für Agent-Verzeichnis/Identität/Arbeitsbereich, einschließlich `resolveAgentDir`, `resolveDefaultAgentDir` und veraltetem Kompatibilitätsexport `resolveOpenClawAgentDir` |
    | `plugin-sdk/directory-runtime` | Konfigurationsgestützte Verzeichnisabfrage/-Deduplizierung |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Funktions- und Test-Unterpfade">
    | Unterpfad | Wichtige Exporte |
    | --- | --- |
    | `plugin-sdk/media-runtime` | Gemeinsame Hilfsfunktionen zum Abrufen/Transformieren/Speichern von Medien, ffprobe-gestützte Ermittlung von Videodimensionen und Builder für Medien-Payloads |
    | `plugin-sdk/media-mime` | Schmale MIME-Normalisierung, Zuordnung von Dateierweiterungen, MIME-Erkennung und Hilfsfunktionen für Medienarten |
    | `plugin-sdk/media-store` | Schmale Hilfsfunktionen für den Medienspeicher wie `saveMediaBuffer` |
    | `plugin-sdk/media-generation-runtime` | Gemeinsame Failover-Hilfsfunktionen für Mediengenerierung, Kandidatenauswahl und Meldungen zu fehlenden Modellen |
    | `plugin-sdk/media-understanding` | Provider-Typen für Medienverständnis sowie Provider-seitige Hilfsexporte für Bild/Audio/strukturierte Extraktion |
    | `plugin-sdk/text-chunking` | Hilfsfunktionen für Text- und Markdown-Chunking/Rendering, Markdown-Tabellenkonvertierung, Entfernen von Directive-Tags und Safe-Text-Dienstprogramme |
    | `plugin-sdk/text-chunking` | Hilfsfunktion für ausgehendes Text-Chunking |
    | `plugin-sdk/speech` | Speech-Provider-Typen sowie Provider-seitige Exporte für Directive, Registry, Validierung, OpenAI-kompatiblen TTS-Builder und Speech-Hilfsfunktionen |
    | `plugin-sdk/speech-core` | Gemeinsame Speech-Provider-Typen, Registry, Directive, Normalisierung und Speech-Hilfsexporte |
    | `plugin-sdk/realtime-transcription` | Provider-Typen für Echtzeit-Transkription, Registry-Hilfsfunktionen und gemeinsame Hilfsfunktion für WebSocket-Sitzungen |
    | `plugin-sdk/realtime-voice` | Provider-Typen für Echtzeit-Sprache und Registry-Hilfsfunktionen |
    | `plugin-sdk/image-generation` | Provider-Typen für Bildgenerierung sowie Hilfsfunktionen für Bild-Assets/Daten-URLs und der OpenAI-kompatible Bild-Provider-Builder |
    | `plugin-sdk/image-generation-core` | Gemeinsame Bildgenerierungstypen, Failover, Authentifizierung und Registry-Hilfsfunktionen |
    | `plugin-sdk/music-generation` | Provider-/Request-/Result-Typen für Musikgenerierung |
    | `plugin-sdk/music-generation-core` | Gemeinsame Musikgenerierungstypen, Failover-Hilfsfunktionen, Provider-Suche und Model-Ref-Parsing |
    | `plugin-sdk/video-generation` | Provider-/Request-/Result-Typen für Videogenerierung |
    | `plugin-sdk/video-generation-core` | Gemeinsame Videogenerierungstypen, Failover-Hilfsfunktionen, Provider-Suche und Model-Ref-Parsing |
    | `plugin-sdk/webhook-targets` | Registry für Webhook-Ziele und Hilfsfunktionen für Routeninstallation |
    | `plugin-sdk/webhook-path` | Veralteter Kompatibilitätsalias; verwenden Sie `plugin-sdk/webhook-ingress` |
    | `plugin-sdk/web-media` | Gemeinsame Hilfsfunktionen zum Laden entfernter/lokaler Medien |
    | `plugin-sdk/zod` | Veralteter Kompatibilitäts-Re-Export; importieren Sie `zod` direkt aus `zod` |
    | `plugin-sdk/testing` | Repository-lokales, veraltetes Kompatibilitäts-Barrel für ältere OpenClaw-Tests. Neue Repository-Tests sollten stattdessen fokussierte lokale Test-Unterpfade wie `plugin-sdk/agent-runtime-test-contracts`, `plugin-sdk/plugin-test-runtime`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/test-env` oder `plugin-sdk/test-fixtures` importieren |
    | `plugin-sdk/plugin-test-api` | Repository-lokale minimale Hilfsfunktion `createTestPluginApi` für direkte Unit-Tests der Plugin-Registrierung ohne Import von Repository-Test-Hilfsbridges |
    | `plugin-sdk/agent-runtime-test-contracts` | Repository-lokale native Contract-Fixtures für Agent-Runtime-Adapter für Authentifizierung, Zustellung, Fallback, Tool-Hook, Prompt-Overlay, Schema und Transcript-Projektionstests |
    | `plugin-sdk/channel-test-helpers` | Repository-lokale, kanalorientierte Test-Hilfsfunktionen für generische Action-/Setup-/Status-Contracts, Verzeichnis-Assertions, Konto-Startlebenszyklus, Send-Config-Threading, Runtime-Mocks, Statusprobleme, ausgehende Zustellung und Hook-Registrierung |
    | `plugin-sdk/channel-target-testing` | Repository-lokale gemeinsame Suite für Fehlerfälle der Zielauflösung in Kanaltests |
    | `plugin-sdk/plugin-test-contracts` | Repository-lokale Hilfsfunktionen für Plugin-Paket-, Registrierungs-, öffentliche Artefakt-, Direktimport-, Runtime-API- und Import-Side-Effect-Contracts |
    | `plugin-sdk/provider-test-contracts` | Repository-lokale Hilfsfunktionen für Provider-Runtime-, Authentifizierungs-, Discovery-, Onboard-, Katalog-, Wizard-, Medienfunktions-, Replay-Policy-, Echtzeit-STT-Live-Audio-, Web-Search-/Fetch- und Stream-Contracts |
    | `plugin-sdk/provider-http-test-mocks` | Repository-lokale optionale Vitest-HTTP-/Auth-Mocks für Provider-Tests, die `plugin-sdk/provider-http` ausführen |
    | `plugin-sdk/test-fixtures` | Repository-lokale generische Fixtures für CLI-Runtime-Erfassung, Sandbox-Kontext, Skill-Writer, Agent-Message, System-Event, Modul-Neuladen, gebündelten Plugin-Pfad, Terminal-Text, Chunking, Auth-Token und typisierte Fälle |
    | `plugin-sdk/test-node-mocks` | Repository-lokale fokussierte Mock-Hilfsfunktionen für Node-Builtins zur Verwendung innerhalb von Vitest-Factorys `vi.mock("node:*")` |
  </Accordion>

  <Accordion title="Memory-Unterpfade">
    | Unterpfad | Wichtige Exporte |
    | --- | --- |
    | `plugin-sdk/memory-core` | Gebündelte memory-core-Hilfsoberfläche für Manager-/Config-/Datei-/CLI-Hilfsfunktionen |
    | `plugin-sdk/memory-core-engine-runtime` | Runtime-Fassade für Memory-Index/Suche |
    | `plugin-sdk/memory-core-host-engine-foundation` | Exporte der Memory-Host-Foundation-Engine |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Memory-Host-Embedding-Contracts, Registry-Zugriff, lokaler Provider und generische Batch-/Remote-Hilfsfunktionen |
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
    | `plugin-sdk/memory-host-core` | Herstellerneutraler Alias für Memory-Host-Core-Runtime-Hilfsfunktionen |
    | `plugin-sdk/memory-host-events` | Herstellerneutraler Alias für Memory-Host-Event-Journal-Hilfsfunktionen |
    | `plugin-sdk/memory-host-files` | Veralteter Kompatibilitätsalias; verwenden Sie `plugin-sdk/memory-core-host-runtime-files` |
    | `plugin-sdk/memory-host-markdown` | Gemeinsame Managed-Markdown-Hilfsfunktionen für Memory-nahe Plugins |
    | `plugin-sdk/memory-host-search` | Active-Memory-Runtime-Fassade für Search-Manager-Zugriff |
    | `plugin-sdk/memory-host-status` | Veralteter Kompatibilitätsalias; verwenden Sie `plugin-sdk/memory-core-host-status` |
  </Accordion>

  <Accordion title="Reservierte Unterpfade für gebündelte Hilfsfunktionen">
    Derzeit gibt es keine reservierten SDK-Unterpfade für gebündelte Hilfsfunktionen. Owner-spezifische
    Hilfsfunktionen liegen im besitzenden Plugin-Paket, während wiederverwendbare Host-Contracts
    generische SDK-Unterpfade wie `plugin-sdk/gateway-runtime`,
    `plugin-sdk/security-runtime` und `plugin-sdk/plugin-config-runtime` verwenden.
  </Accordion>
</AccordionGroup>

## Verwandte Themen

- [Plugin-SDK-Übersicht](/de/plugins/sdk-overview)
- [Plugin-SDK-Einrichtung](/de/plugins/sdk-setup)
- [Plugins erstellen](/de/plugins/building-plugins)
