---
read_when:
    - Den richtigen plugin-sdk-Unterpfad für einen Plugin-Import auswählen
    - Prüfung gebündelter Plugin-Unterpfade und Hilfsschnittstellen
summary: 'Plugin-SDK-Unterpfadkatalog: welche Importe sich wo befinden, nach Bereich gruppiert'
title: Plugin-SDK-Unterpfade
x-i18n:
    generated_at: "2026-05-10T19:47:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: ddcb1223ce9f749e57e866cc0ed3329a1aeeb5d90d00568b5942f7f779086f1f
    source_path: plugins/sdk-subpaths.md
    workflow: 16
---

Das Plugin-SDK wird als Satz schmaler öffentlicher Unterpfade unter
`openclaw/plugin-sdk/` bereitgestellt. Diese Seite katalogisiert die häufig verwendeten Unterpfade, gruppiert nach
Zweck. Das generierte Compiler-Entrypoint-Inventar befindet sich in
`scripts/lib/plugin-sdk-entrypoints.json`; Package-Exports sind die öffentliche Teilmenge
nach Abzug der repo-lokalen Test-/internen Unterpfade, die in
`scripts/lib/plugin-sdk-private-local-only-subpaths.json` aufgeführt sind. Maintainer können
die Anzahl der öffentlichen Exports mit `pnpm plugin-sdk:surface` und aktive reservierte
Hilfsunterpfade mit `pnpm plugins:boundary-report:summary` prüfen; ungenutzte reservierte
Hilfs-Exports lassen den CI-Bericht fehlschlagen, anstatt als ruhende
Kompatibilitätsschuld im öffentlichen SDK zu verbleiben.

Den Leitfaden zum Erstellen von Plugins finden Sie unter [Plugin-SDK-Übersicht](/de/plugins/sdk-overview).

## Plugin-Eintrag

| Unterpfad                      | Wichtige Exports                                                                                                                                                       |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/plugin-entry`      | `definePluginEntry`                                                                                                                                                    |
| `plugin-sdk/core`              | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema`, `buildJsonChannelConfigSchema` |
| `plugin-sdk/config-schema`     | `OpenClawSchema`                                                                                                                                                       |
| `plugin-sdk/provider-entry`    | `defineSingleProviderPluginEntry`                                                                                                                                      |
| `plugin-sdk/migration`         | Hilfsfunktionen für Migration-Provider-Elemente wie `createMigrationItem`, Begründungskonstanten, Elementstatus-Markierungen, Schwärzungshilfen und `summarizeMigrationItems` |
| `plugin-sdk/migration-runtime` | Runtime-Migrationshilfen wie `copyMigrationFileItem`, `withCachedMigrationConfigRuntime` und `writeMigrationReport`                                                    |

### Veraltete Kompatibilitäts- und Testhilfen

Diese Unterpfade bleiben Package-Exports für ältere Plugins und OpenClaw-Testsuites,
aber neuer Code sollte keine Importe aus ihnen hinzufügen: `agent-runtime-test-contracts`,
`channel-contract-testing`, `channel-target-testing`, `channel-test-helpers`,
`plugin-test-api`, `plugin-test-contracts`, `provider-http-test-mocks`,
`provider-test-contracts`, `test-env`, `test-fixtures`, `test-node-mocks`,
`testing`, `channel-runtime`, `compat`, `config-types`, `infra-runtime`,
`text-runtime` und `zod`. Importieren Sie `zod` in neuem Plugin-Code direkt aus `zod`.
`plugin-test-runtime` ist weiterhin ein aktiver, fokussierter Testhilfs-Unterpfad.

### Veraltete ungenutzte öffentliche Unterpfade

Diese öffentlichen Unterpfade existierten mindestens einen Monat lang und haben derzeit keine
Produktionsimporte gebündelter Plugins. Sie bleiben aus Kompatibilitätsgründen importierbar,
aber neuer Plugin-Code sollte stattdessen fokussierte, aktiv genutzte SDK-Unterpfade verwenden:
`agent-config-primitives`, `channel-config-schema-legacy`,
`channel-reply-pipeline`, `channel-runtime`, `channel-secret-runtime`,
`command-auth`, `compat`, `config-runtime`, `config-schema`, `discord`,
`group-access`, `infra-runtime`, `matrix`, `mattermost`,
`media-generation-runtime-shared`, `memory-core-engine-runtime`,
`memory-core-host-multimodal`, `memory-core-host-query`,
`music-generation-core`, `self-hosted-provider-setup`, `telegram-account`,
`telegram-command-config` und `zalouser`.

### Veraltete seltene öffentliche Unterpfade

Öffentliche Unterpfade, die derzeit nur von einem oder zwei gebündelten Plugin-Ownern genutzt werden, sind ebenfalls
für neuen Plugin-Code veraltet. Sie bleiben aus Kompatibilitätsgründen Package-Exports,
aber neuer Code sollte aktiv gemeinsam genutzte SDK-Schnittstellen oder packageeigene
Plugin-APIs bevorzugen. Maintainer verfolgen den genauen Satz in
`scripts/lib/plugin-sdk-deprecated-public-subpaths.json` und das aktuelle Budget
mit `pnpm plugin-sdk:surface`.

### Veraltete breite Barrels

Diese breiten Re-Export-Barrels bleiben für OpenClaw-Quellcode und
Kompatibilitätsprüfungen baubar, aber neuer Code sollte fokussierte SDK-Unterpfade bevorzugen:
`agent-runtime`, `channel-lifecycle`, `channel-runtime`, `cli-runtime`,
`compat`, `config-types`, `conversation-runtime`, `hook-runtime`,
`infra-runtime`, `media-runtime`, `plugin-runtime`, `security-runtime` und
`text-runtime`. `channel-runtime`, `compat`, `config-types`, `infra-runtime`
und `text-runtime` bleiben nur aus Gründen der Abwärtskompatibilität Package-Exports; verwenden Sie
stattdessen fokussierte Channel-/Runtime-Unterpfade, `config-contracts`, `string-coerce-runtime`,
`text-chunking`, `text-utility-runtime` und `logging-core`.

  <AccordionGroup>
  <Accordion title="Channel-Unterpfade">
    | Unterpfad | Wichtige Exporte |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | Export des Zod-Schemas für die Root-`openclaw.json` (`OpenClawSchema`) |
    | `plugin-sdk/json-schema-runtime` | Zwischengespeicherter JSON-Schema-Validierungshelfer für Plugin-eigene Schemas |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, plus `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | Gemeinsame Hilfsfunktionen für Einrichtungsassistenten, Allowlist-Prompts und Builder für den Einrichtungsstatus |
    | `plugin-sdk/setup-runtime` | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | Veralteter Kompatibilitätsalias; verwenden Sie `plugin-sdk/setup-runtime` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | Hilfsfunktionen für Multi-Account-Konfiguration und Action-Gates sowie Fallback-Hilfsfunktionen für Standardkonten |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, Hilfsfunktionen zur Normalisierung von Konto-IDs |
    | `plugin-sdk/account-resolution` | Hilfsfunktionen für Kontosuche und Standard-Fallbacks |
    | `plugin-sdk/account-helpers` | Schmale Hilfsfunktionen für Kontolisten und Kontoaktionen |
    | `plugin-sdk/access-groups` | Hilfsfunktionen für das Parsen von Zugriffsgruppen-Allowlists und redigierte Gruppendiagnosen |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | Hilfsfunktionen der Legacy-Antwortpipeline. Neuer Code für Channel-Antwortpipelines sollte `createChannelMessageReplyPipeline` und `resolveChannelMessageSourceReplyDeliveryMode` aus `plugin-sdk/channel-message` verwenden. |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
    | `plugin-sdk/channel-config-schema` | Gemeinsame Primitive für Channel-Konfigurationsschemas sowie Zod- und direkte JSON-/TypeBox-Builder |
    | `plugin-sdk/bundled-channel-config-schema` | Gebündelte OpenClaw-Channel-Konfigurationsschemas nur für gepflegte gebündelte Plugins |
    | `plugin-sdk/channel-config-schema-legacy` | Veralteter Kompatibilitätsalias für gebündelte Channel-Konfigurationsschemas |
    | `plugin-sdk/telegram-command-config` | Hilfsfunktionen zur Normalisierung/Validierung benutzerdefinierter Telegram-Befehle mit Fallback auf den gebündelten Vertrag |
    | `plugin-sdk/command-gating` | Schmale Hilfsfunktionen für Befehlsautorisierungs-Gates |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-ingress` | Veraltete Low-Level-Kompatibilitätsfassade für Channel-Eingang. Neue Empfangspfade sollten `plugin-sdk/channel-ingress-runtime` verwenden. |
    | `plugin-sdk/channel-ingress-runtime` | Experimenteller High-Level-Laufzeit-Resolver für Channel-Eingang und Builder für Routenfakten für migrierte Channel-Empfangspfade. Ziehen Sie dies dem Zusammenstellen effektiver Allowlists, Befehls-Allowlists und Legacy-Projektionen in jedem Plugin vor. Siehe [Channel-ingress-API](/de/plugins/sdk-channel-ingress). |
    | `plugin-sdk/channel-lifecycle` | `createAccountStatusSink`, `createChannelRunQueue` und Legacy-Hilfsfunktionen für den Lebenszyklus von Draft-Streams. Neuer Code für Preview-Finalisierung sollte `plugin-sdk/channel-message` verwenden. |
    | `plugin-sdk/channel-message` | Günstige Hilfsfunktionen für Nachrichtenlebenszyklus-Verträge wie `defineChannelMessageAdapter`, `createChannelMessageAdapterFromOutbound`, `createChannelMessageReplyPipeline`, `createReplyPrefixContext`, `resolveChannelMessageSourceReplyDeliveryMode`, Ableitung langlebiger finaler Capabilities, Capability-Proof-Hilfsfunktionen für Sende-/Empfangs-/Seiteneffekt-Capabilities, `MessageReceiveContext`, Proofs für Empfangsbestätigungsrichtlinien, `defineFinalizableLivePreviewAdapter`, `deliverWithFinalizableLivePreviewAdapter`, Proofs für Live-Preview- und Live-Finalizer-Capabilities, langlebiger Wiederherstellungsstatus, `RenderedMessageBatch`, Nachrichtenempfangstypen und Hilfsfunktionen für Empfangs-IDs. Siehe [Channel-message-API](/de/plugins/sdk-channel-message). Legacy-Fassaden für Antwort-Dispatch sind nur noch veraltete Kompatibilität. |
    | `plugin-sdk/channel-message-runtime` | Laufzeit-Hilfsfunktionen für Zustellung, die ausgehende Zustellung laden können, einschließlich `deliverInboundReplyWithMessageSendContext`, `sendDurableMessageBatch` und `withDurableMessageSendContext`. Veraltete Bridges für Antwort-Dispatch bleiben nur für Kompatibilitäts-Dispatcher importierbar. Verwenden Sie dies in Monitor-/Sende-Laufzeitmodulen, nicht in häufig genutzten Plugin-Bootstrap-Dateien. |
    | `plugin-sdk/inbound-envelope` | Gemeinsame Hilfsfunktionen für eingehende Routen und Envelope-Builder |
    | `plugin-sdk/inbound-reply-dispatch` | Legacy-Hilfsfunktionen für gemeinsame eingehende Aufzeichnung und Dispatch, sichtbare/finale Dispatch-Prädikate sowie veraltete `deliverDurableInboundReplyPayload`-Kompatibilität für vorbereitete Channel-Dispatcher. Neuer Code für Channel-Empfang/Dispatch sollte Laufzeit-Lebenszyklus-Hilfsfunktionen aus `plugin-sdk/channel-message-runtime` importieren. |
    | `plugin-sdk/messaging-targets` | Hilfsfunktionen für Ziel-Parsing und -Abgleich |
    | `plugin-sdk/outbound-media` | Gemeinsame Hilfsfunktionen zum Laden ausgehender Medien |
    | `plugin-sdk/outbound-send-deps` | Leichtgewichtige Abhängigkeitssuche für ausgehenden Versand bei Channel-Adaptern |
    | `plugin-sdk/outbound-runtime` | Hilfsfunktionen für ausgehende Identität, Sende-Delegates, Sitzungen, Formatierung und Payload-Planung. Direkte Zustellhilfen wie `deliverOutboundPayloads` sind veraltete Kompatibilitätsgrundlage; verwenden Sie `plugin-sdk/channel-message-runtime` für neue Sendepfade. |
    | `plugin-sdk/poll-runtime` | Schmale Hilfsfunktionen für Poll-Normalisierung |
    | `plugin-sdk/thread-bindings-runtime` | Hilfsfunktionen für Lebenszyklus und Adapter von Thread-Bindings |
    | `plugin-sdk/agent-media-payload` | Legacy-Builder für Agent-Medien-Payloads |
    | `plugin-sdk/conversation-runtime` | Hilfsfunktionen für Conversation-/Thread-Binding, Pairing und konfigurierte Bindings |
    | `plugin-sdk/runtime-config-snapshot` | Hilfsfunktion für Laufzeit-Konfigurations-Snapshots |
    | `plugin-sdk/runtime-group-policy` | Hilfsfunktionen zur Laufzeitauflösung von Gruppenrichtlinien |
    | `plugin-sdk/channel-status` | Gemeinsame Hilfsfunktionen für Channel-Status-Snapshots und -Zusammenfassungen |
    | `plugin-sdk/channel-config-primitives` | Schmale Primitive für Channel-Konfigurationsschemas |
    | `plugin-sdk/channel-config-writes` | Hilfsfunktionen für die Autorisierung von Channel-Konfigurationsschreibvorgängen |
    | `plugin-sdk/channel-plugin-common` | Gemeinsame Prelude-Exporte für Channel-Plugins |
    | `plugin-sdk/allowlist-config-edit` | Hilfsfunktionen zum Bearbeiten/Lesen von Allowlist-Konfigurationen |
    | `plugin-sdk/group-access` | Gemeinsame Hilfsfunktionen für Gruppen-Zugriffsentscheidungen |
    | `plugin-sdk/direct-dm` | Gemeinsame Hilfsfunktionen für Authentifizierung/Guards bei direkten DMs |
    | `plugin-sdk/discord` | Veraltete Discord-Kompatibilitätsfassade für veröffentlichtes `@openclaw/discord@2026.3.13` und nachverfolgte Owner-Kompatibilität; neue Plugins sollten generische Channel-SDK-Unterpfade verwenden |
    | `plugin-sdk/telegram-account` | Veraltete Telegram-Kompatibilitätsfassade für Kontoauflösung bei nachverfolgter Owner-Kompatibilität; neue Plugins sollten injizierte Laufzeit-Hilfsfunktionen oder generische Channel-SDK-Unterpfade verwenden |
    | `plugin-sdk/zalouser` | Veraltete Kompatibilitätsfassade für Zalo Personal für veröffentlichte Lark-/Zalo-Pakete, die weiterhin Autorisierung für Senderbefehle importieren; neue Plugins sollten `plugin-sdk/command-auth` verwenden |
    | `plugin-sdk/interactive-runtime` | Semantische Nachrichtenpräsentation, Zustellung und Legacy-Hilfsfunktionen für interaktive Antworten. Siehe [Nachrichtenpräsentation](/de/plugins/message-presentation) |
    | `plugin-sdk/channel-inbound` | Kompatibilitäts-Barrel für eingehendes Debounce, Mention-Abgleich, Mention-Policy-Hilfsfunktionen und Envelope-Hilfsfunktionen |
    | `plugin-sdk/channel-inbound-debounce` | Schmale Hilfsfunktionen für eingehendes Debounce |
    | `plugin-sdk/channel-mention-gating` | Schmale Hilfsfunktionen für Mention-Policy, Mention-Marker und Mention-Text ohne die breitere eingehende Laufzeitoberfläche |
    | `plugin-sdk/channel-envelope` | Schmale Hilfsfunktionen zur Formatierung eingehender Envelopes |
    | `plugin-sdk/channel-location` | Kontext und Formatierungshilfen für Channel-Standorte |
    | `plugin-sdk/channel-logging` | Channel-Logging-Hilfsfunktionen für eingehende Drops und Tipp-/Ack-Fehler |
    | `plugin-sdk/channel-send-result` | Antwort-Ergebnistypen |
    | `plugin-sdk/channel-actions` | Hilfsfunktionen für Channel-Nachrichtenaktionen sowie veraltete native Schema-Hilfsfunktionen, die für Plugin-Kompatibilität beibehalten werden |
    | `plugin-sdk/channel-route` | Gemeinsame Hilfsfunktionen für Routennormalisierung, parsergestützte Zielauflösung, Stringifizierung von Thread-IDs, Deduplizierung/Compaction von Routenschlüsseln, geparste Zieltypen und Routen-/Zielvergleiche |
    | `plugin-sdk/channel-targets` | Hilfsfunktionen für Ziel-Parsing; Aufrufer von Routenvergleichen sollten `plugin-sdk/channel-route` verwenden |
    | `plugin-sdk/channel-contract` | Channel-Vertragstypen |
    | `plugin-sdk/channel-feedback` | Verkabelung für Feedback/Reaktionen |
    | `plugin-sdk/channel-secret-runtime` | Schmale Hilfsfunktionen für Geheimnisverträge wie `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment` und Geheimnis-Zieltypen |
  </Accordion>

  <Accordion title="Provider-Unterpfade">
    | Unterpfad | Wichtige Exporte |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/lmstudio` | Unterstützte LM Studio-Provider-Fassade für Einrichtung, Katalogerkennung und Runtime-Modellvorbereitung |
    | `plugin-sdk/lmstudio-runtime` | Unterstützte LM Studio-Runtime-Fassade für Standardwerte lokaler Server, Modellerkennung, Request-Header und Helfer für geladene Modelle |
    | `plugin-sdk/provider-setup` | Kuratierte Helfer für die lokale/selbst gehostete Provider-Einrichtung |
    | `plugin-sdk/self-hosted-provider-setup` | Fokussierte Helfer für die OpenAI-kompatible, selbst gehostete Provider-Einrichtung |
    | `plugin-sdk/cli-backend` | CLI-Backend-Standardwerte + Watchdog-Konstanten |
    | `plugin-sdk/provider-auth-runtime` | Runtime-Helfer zur API-Schlüsselauflösung für Provider-Plugins |
    | `plugin-sdk/provider-auth-api-key` | Helfer für API-Schlüssel-Onboarding und Profilschreiben, z. B. `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | Standardmäßiger OAuth-Builder für Auth-Ergebnisse |
    | `plugin-sdk/provider-env-vars` | Helfer zur Suche nach Provider-Auth-Umgebungsvariablen |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials`, veralteter Kompatibilitätsexport `resolveOpenClawAgentDir` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, gemeinsame Replay-Policy-Builder, Provider-Endpoint-Helfer und gemeinsame Helfer zur Modell-ID-Normalisierung |
    | `plugin-sdk/provider-catalog-runtime` | Runtime-Hook zur Provider-Katalogerweiterung und Plugin-Provider-Registry-Seams für Vertragstests |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | Generische Provider-HTTP-/Endpoint-Capability-Helfer, Provider-HTTP-Fehler und Multipart-Formular-Helfer für Audiotranskription |
    | `plugin-sdk/provider-web-fetch-contract` | Enge Web-Fetch-Konfigurations-/Auswahlvertragshelfer wie `enablePluginInConfig` und `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | Registrierungs-/Cache-Helfer für Web-Fetch-Provider |
    | `plugin-sdk/provider-web-search-config-contract` | Enge Web-Search-Konfigurations-/Credential-Helfer für Provider, die keine Plugin-Aktivierungsverdrahtung benötigen |
    | `plugin-sdk/provider-web-search-contract` | Enge Web-Search-Konfigurations-/Credential-Vertragshelfer wie `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` und bereichsbezogene Credential-Setter/-Getter |
    | `plugin-sdk/provider-web-search` | Registrierungs-/Cache-/Runtime-Helfer für Web-Search-Provider |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks` sowie Gemini-Schemabereinigung + Diagnose |
    | `plugin-sdk/provider-usage` | `fetchClaudeUsage` und Ähnliches |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, Stream-Wrapper-Typen und gemeinsame Wrapper-Helfer für Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
    | `plugin-sdk/provider-transport-runtime` | Native Provider-Transport-Helfer wie geschützter Fetch, Transport-Nachrichtentransformationen und beschreibbare Transport-Ereignisstreams |
    | `plugin-sdk/provider-onboard` | Helfer für Onboarding-Konfigurationspatches |
    | `plugin-sdk/global-singleton` | Prozesslokale Singleton-/Map-/Cache-Helfer |
    | `plugin-sdk/group-activation` | Enge Helfer für Gruppenaktivierungsmodus und Befehlsparsing |
  </Accordion>

  <Accordion title="Authentifizierungs- und Sicherheitsunterpfade">
    | Unterpfad | Wichtige Exporte |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, Command-Registry-Helfer einschließlich Formatierung dynamischer Argumentmenüs, Helfer zur Absenderautorisierung |
    | `plugin-sdk/command-status` | Builder für Befehls-/Hilfenachrichten wie `buildCommandsMessagePaginated` und `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | Helfer zur Genehmigerauflösung und Aktionsauthentifizierung im selben Chat |
    | `plugin-sdk/approval-client-runtime` | Helfer für native Exec-Genehmigungsprofile/-filter |
    | `plugin-sdk/approval-delivery-runtime` | Native Genehmigungs-Capability-/Delivery-Adapter |
    | `plugin-sdk/approval-gateway-runtime` | Gemeinsamer Helfer zur Gateway-Auflösung für Genehmigungen |
    | `plugin-sdk/approval-handler-adapter-runtime` | Schlanke Helfer zum Laden nativer Genehmigungsadapter für heiße Channel-Einstiegspunkte |
    | `plugin-sdk/approval-handler-runtime` | Breitere Runtime-Helfer für Genehmigungshandler; bevorzugen Sie die engeren Adapter-/Gateway-Seams, wenn sie ausreichen |
    | `plugin-sdk/approval-native-runtime` | Helfer für native Genehmigungsziele + Account-Bindung |
    | `plugin-sdk/approval-reply-runtime` | Payload-Helfer für Exec-/Plugin-Genehmigungsantworten |
    | `plugin-sdk/approval-runtime` | Payload-Helfer für Exec-/Plugin-Genehmigungen, native Genehmigungs-Routing-/Runtime-Helfer und Helfer für strukturierte Genehmigungsanzeige wie `formatApprovalDisplayPath` |
    | `plugin-sdk/reply-dedupe` | Enge Reset-Helfer zur Deduplizierung eingehender Antworten |
    | `plugin-sdk/channel-contract-testing` | Enge Helfer für Channel-Vertragstests ohne das breite Testing-Barrel |
    | `plugin-sdk/command-auth-native` | Native Befehlsauthentifizierung, Formatierung dynamischer Argumentmenüs und native Helfer für Sitzungsziele |
    | `plugin-sdk/command-detection` | Gemeinsame Helfer zur Befehlserkennung |
    | `plugin-sdk/command-primitives-runtime` | Schlanke Prädikate für Befehlstext für heiße Channel-Pfade |
    | `plugin-sdk/command-surface` | Normalisierung von Befehlsinhalten und Helfer für Befehlsoberflächen |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | Enge Helfer zur Secret-Vertragssammlung für Channel-/Plugin-Secret-Oberflächen |
    | `plugin-sdk/secret-ref-runtime` | Enge `coerceSecretRef`- und SecretRef-Typing-Helfer für Secret-Vertrags-/Konfigurationsparsing |
    | `plugin-sdk/security-runtime` | Gemeinsame Helfer für Vertrauen, DM-Gating, root-begrenzte Datei-/Pfadoperationen einschließlich Create-only-Schreibvorgängen, synchronem/asynchronem atomarem Dateiersatz, Schreiben in temporäre Geschwisterdateien, Fallback für geräteübergreifende Verschiebungen, private Dateispeicher, Symlink-Parent-Guards, externe Inhalte, Schwärzung sensibler Texte, Secret-Vergleich in konstanter Zeit und Secret-Sammlungen |
    | `plugin-sdk/ssrf-policy` | Helfer für Host-Allowlist und Private-Network-SSRF-Policy |
    | `plugin-sdk/ssrf-dispatcher` | Enge Helfer für gepinnte Dispatcher ohne die breite Infrastruktur-Runtime-Oberfläche |
    | `plugin-sdk/ssrf-runtime` | Gepinnter Dispatcher, SSRF-geschützter Fetch, SSRF-Fehler und SSRF-Policy-Helfer |
    | `plugin-sdk/secret-input` | Helfer zum Parsen von Secret-Eingaben |
    | `plugin-sdk/webhook-ingress` | Webhook-Request-/Zielhelfer und rohe WebSocket-/Body-Koerzierung |
    | `plugin-sdk/webhook-request-guards` | Helfer für Request-Body-Größe/-Timeout |
  </Accordion>

  <Accordion title="Runtime- und Speicher-Unterpfade">
    | Unterpfad | Wichtige Exporte |
    | --- | --- |
    | `plugin-sdk/runtime` | Breite Runtime-/Logging-/Backup-/Plugin-Installationshelfer |
    | `plugin-sdk/runtime-env` | Schmale Runtime-Env-, Logger-, Timeout-, Retry- und Backoff-Helfer |
    | `plugin-sdk/browser-config` | Unterstützte Browser-Konfigurationsfassade für normalisierte Profile/Defaults, CDP-URL-Parsing und Browser-Control-Auth-Helfer |
    | `plugin-sdk/channel-runtime-context` | Generische Helfer zur Registrierung und Suche von Channel-Runtime-Kontexten |
    | `plugin-sdk/matrix` | Veraltete Matrix-Kompatibilitätsfassade für ältere Drittanbieter-Channel-Pakete; neue Plugins sollten `plugin-sdk/run-command` direkt importieren |
    | `plugin-sdk/mattermost` | Veraltete Mattermost-Kompatibilitätsfassade für ältere Drittanbieter-Channel-Pakete; neue Plugins sollten generische SDK-Unterpfade direkt importieren |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Gemeinsame Plugin-Befehls-/Hook-/HTTP-/Interaktionshelfer |
    | `plugin-sdk/hook-runtime` | Gemeinsame Webhook-/interne Hook-Pipeline-Helfer |
    | `plugin-sdk/lazy-runtime` | Helfer für Lazy-Runtime-Importe/-Bindings wie `createLazyRuntimeModule`, `createLazyRuntimeMethod` und `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | Prozessausführungshelfer |
    | `plugin-sdk/cli-runtime` | CLI-Formatierung, Warten, Version, Argumentaufruf und Helfer für Lazy-Befehlsgruppen |
    | `plugin-sdk/gateway-runtime` | Gateway-Client, Starthelfer für event-loop-bereite Clients, Gateway-CLI-RPC, Gateway-Protokollfehler und Helfer für Channel-Status-Patches |
    | `plugin-sdk/config-contracts` | Fokussierte reine Typ-Konfigurationsoberfläche für Plugin-Konfigurationsformen wie `OpenClawConfig` und Channel-/Provider-Konfigurationstypen |
    | `plugin-sdk/plugin-config-runtime` | Runtime-Helfer zur Plugin-Konfigurationssuche wie `requireRuntimeConfig`, `resolvePluginConfigObject` und `resolveLivePluginConfigObject` |
    | `plugin-sdk/config-mutation` | Transaktionale Konfigurationsmutationshelfer wie `mutateConfigFile`, `replaceConfigFile` und `logConfigUpdated` |
    | `plugin-sdk/runtime-config-snapshot` | Helfer für Snapshots der aktuellen Prozesskonfiguration wie `getRuntimeConfig`, `getRuntimeConfigSnapshot` und Test-Snapshot-Setter |
    | `plugin-sdk/telegram-command-config` | Normalisierung von Telegram-Befehlsnamen/-beschreibungen und Prüfungen auf Duplikate/Konflikte, selbst wenn die gebündelte Telegram-Vertragsoberfläche nicht verfügbar ist |
    | `plugin-sdk/text-autolink-runtime` | Autolink-Erkennung für Dateiverweise ohne das breite Text-Barrel |
    | `plugin-sdk/approval-runtime` | Exec-/Plugin-Genehmigungshelfer, Builder für Genehmigungsfähigkeiten, Auth-/Profilhelfer, native Routing-/Runtime-Helfer und Formatierung für strukturierte Genehmigungsanzeigepfade |
    | `plugin-sdk/reply-runtime` | Gemeinsame Runtime-Helfer für eingehende Nachrichten/Antworten, Chunking, Dispatch, Heartbeat, Antwortplaner |
    | `plugin-sdk/reply-dispatch-runtime` | Schmale Helfer zum Dispatch/Finalisieren von Antworten und für Konversationslabels |
    | `plugin-sdk/reply-history` | Gemeinsame Helfer und Marker für Antwortverläufe in kurzen Zeitfenstern wie `buildHistoryContext`, `HISTORY_CONTEXT_MARKER`, `recordPendingHistoryEntry` und `clearHistoryEntriesIfEnabled` |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | Schmale Text-/Markdown-Chunking-Helfer |
    | `plugin-sdk/session-store-runtime` | Helfer für Sitzungsspeicherpfad, Sitzungsschlüssel, aktualisiert-am und Speichermutationen |
    | `plugin-sdk/cron-store-runtime` | Helfer für Cron-Speicherpfad/Laden/Speichern |
    | `plugin-sdk/state-paths` | Helfer für State-/OAuth-Verzeichnispfade |
    | `plugin-sdk/routing` | Helfer für Route-/Sitzungsschlüssel-/Kontobindungen wie `resolveAgentRoute`, `buildAgentSessionKey` und `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | Gemeinsame Helfer für Channel-/Kontostatus-Zusammenfassungen, Runtime-State-Defaults und Issue-Metadaten |
    | `plugin-sdk/target-resolver-runtime` | Gemeinsame Zielauflösungshelfer |
    | `plugin-sdk/string-normalization-runtime` | Slug-/String-Normalisierungshelfer |
    | `plugin-sdk/request-url` | String-URLs aus Fetch-/Request-ähnlichen Eingaben extrahieren |
    | `plugin-sdk/run-command` | Zeitgesteuerter Befehlsrunner mit normalisierten stdout-/stderr-Ergebnissen |
    | `plugin-sdk/param-readers` | Gemeinsame Tool-/CLI-Parameterleser |
    | `plugin-sdk/tool-payload` | Normalisierte Payloads aus Tool-Ergebnisobjekten extrahieren |
    | `plugin-sdk/tool-send` | Kanonische Send-Zielfelder aus Tool-Argumenten extrahieren |
    | `plugin-sdk/temp-path` | Gemeinsame Temp-Download-Pfadhelfer und private sichere Temp-Arbeitsbereiche |
    | `plugin-sdk/logging-core` | Subsystem-Logger und Redaktionshelfer |
    | `plugin-sdk/markdown-table-runtime` | Markdown-Tabellenmodus- und Konvertierungshelfer |
    | `plugin-sdk/model-session-runtime` | Helfer für Modell-/Sitzungsüberschreibungen wie `applyModelOverrideToSessionEntry` und `resolveAgentMaxConcurrent` |
    | `plugin-sdk/talk-config-runtime` | Helfer zur Auflösung von Talk-Provider-Konfigurationen |
    | `plugin-sdk/json-store` | Kleine JSON-State-Lese-/Schreibhelfer |
    | `plugin-sdk/file-lock` | Re-entrant File-Lock-Helfer |
    | `plugin-sdk/persistent-dedupe` | Festplattengestützte Dedupe-Cache-Helfer |
    | `plugin-sdk/acp-runtime` | ACP-Runtime-/Sitzungs- und Antwort-Dispatch-Helfer |
    | `plugin-sdk/acp-runtime-backend` | Leichtgewichtige ACP-Backend-Registrierungs- und Antwort-Dispatch-Helfer für beim Start geladene Plugins |
    | `plugin-sdk/acp-binding-resolve-runtime` | Schreibgeschützte ACP-Bindungsauflösung ohne Lifecycle-Startimporte |
    | `plugin-sdk/agent-config-primitives` | Schmale Agent-Runtime-Konfigurationsschema-Primitiven |
    | `plugin-sdk/boolean-param` | Lockerer boolescher Parameterleser |
    | `plugin-sdk/dangerous-name-runtime` | Helfer zur Auflösung von Dangerous-Name-Matching |
    | `plugin-sdk/device-bootstrap` | Helfer für Geräte-Bootstrap und Pairing-Token |
    | `plugin-sdk/extension-shared` | Gemeinsame Primitive für passive Channels, Status und Ambient-Proxy-Helfer |
    | `plugin-sdk/models-provider-runtime` | Antworthelfer für `/models`-Befehl/Provider |
    | `plugin-sdk/skill-commands-runtime` | Helfer zum Auflisten von Skill-Befehlen |
    | `plugin-sdk/native-command-registry` | Helfer für native Befehlsregistry/Build/Serialisierung |
    | `plugin-sdk/agent-harness` | Experimentelle Trusted-Plugin-Oberfläche für Low-Level-Agent-Harnesses: Harness-Typen, Helfer zum Steuern/Abbrechen aktiver Runs, OpenClaw-Tool-Bridge-Helfer, Tool-Policy-Helfer für Runtime-Pläne, Klassifizierung von Terminal-Ergebnissen, Formatierungs-/Detailhelfer für Tool-Fortschritt und Ergebnisdienstprogramme für Versuche |
    | `plugin-sdk/provider-zai-endpoint` | Veraltete Provider-eigene Z.AI-Endpunkterkennungsfassade; verwenden Sie die öffentliche API des Z.AI-Plugins |
    | `plugin-sdk/async-lock-runtime` | Prozesslokaler Async-Lock-Helfer für kleine Runtime-State-Dateien |
    | `plugin-sdk/channel-activity-runtime` | Helfer für Channel-Aktivitätstelemetrie |
    | `plugin-sdk/concurrency-runtime` | Helfer für begrenzte asynchrone Task-Nebenläufigkeit |
    | `plugin-sdk/dedupe-runtime` | In-Memory-Dedupe-Cache-Helfer |
    | `plugin-sdk/delivery-queue-runtime` | Drain-Helfer für ausstehende ausgehende Zustellungen |
    | `plugin-sdk/file-access-runtime` | Sichere Helfer für lokale Datei- und Medienquellenpfade |
    | `plugin-sdk/heartbeat-runtime` | Helfer für Heartbeat-Wake, -Ereignis und -Sichtbarkeit |
    | `plugin-sdk/number-runtime` | Helfer für numerische Koersion |
    | `plugin-sdk/secure-random-runtime` | Helfer für sichere Token/UUIDs |
    | `plugin-sdk/system-event-runtime` | Helfer für Systemereignis-Warteschlangen |
    | `plugin-sdk/transport-ready-runtime` | Wartehelfer für Transportbereitschaft |
    | `plugin-sdk/infra-runtime` | Veralteter Kompatibilitäts-Shim; verwenden Sie die fokussierten Runtime-Unterpfade oben |
    | `plugin-sdk/collection-runtime` | Kleine Helfer für begrenzte Caches |
    | `plugin-sdk/diagnostic-runtime` | Helfer für Diagnoseflags, Ereignisse und Trace-Kontext |
    | `plugin-sdk/error-runtime` | Fehlergraph, Formatierung, gemeinsame Fehlerklassifizierungshelfer, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | Umhülltes Fetch, Proxy, EnvHttpProxyAgent-Option und Helfer für gepinnte Lookups |
    | `plugin-sdk/runtime-fetch` | Dispatcher-bewusstes Runtime-Fetch ohne Proxy-/Guarded-Fetch-Importe |
    | `plugin-sdk/response-limit-runtime` | Begrenzter Response-Body-Reader ohne die breite Media-Runtime-Oberfläche |
    | `plugin-sdk/session-binding-runtime` | Aktueller Konversationsbindungszustand ohne konfigurierte Bindungsrouten oder Pairing-Speicher |
    | `plugin-sdk/session-store-runtime` | Sitzungsspeicherhelfer ohne breite Konfigurationsschreib-/Wartungsimporte |
    | `plugin-sdk/context-visibility-runtime` | Auflösung der Kontextsichtbarkeit und Filterung ergänzender Kontexte ohne breite Konfigurations-/Sicherheitsimporte |
    | `plugin-sdk/string-coerce-runtime` | Schmale Primitive-Record-/String-Koersions- und Normalisierungshelfer ohne Markdown-/Logging-Importe |
    | `plugin-sdk/host-runtime` | Helfer zur Hostnamen- und SCP-Host-Normalisierung |
    | `plugin-sdk/retry-runtime` | Helfer für Retry-Konfiguration und Retry-Runner |
    | `plugin-sdk/agent-runtime` | Helfer für Agent-Verzeichnis/Identität/Arbeitsbereich, einschließlich `resolveAgentDir`, `resolveDefaultAgentDir` und veraltetem Kompatibilitätsexport `resolveOpenClawAgentDir` |
    | `plugin-sdk/directory-runtime` | Konfigurationsgestützte Verzeichnisabfrage/Deduplizierung |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Capability- und Test-Unterpfade">
    | Unterpfad | Wichtige Exporte |
    | --- | --- |
    | `plugin-sdk/media-runtime` | Gemeinsame Hilfsfunktionen zum Abrufen, Transformieren und Speichern von Medien, ffprobe-gestützte Ermittlung von Videodimensionen und Builder für Medien-Payloads |
    | `plugin-sdk/media-mime` | Eng gefasste MIME-Normalisierung, Zuordnung von Dateierweiterungen, MIME-Erkennung und Hilfsfunktionen für Medientypen |
    | `plugin-sdk/media-store` | Eng gefasste Hilfsfunktionen für den Medienspeicher, etwa `saveMediaBuffer` |
    | `plugin-sdk/media-generation-runtime` | Gemeinsame Failover-Hilfsfunktionen für Mediengenerierung, Kandidatenauswahl und Meldungen zu fehlenden Modellen |
    | `plugin-sdk/media-understanding` | Provider-Typen für Medienverständnis sowie Provider-seitige Exporte für Bild-/Audio-Hilfsfunktionen |
    | `plugin-sdk/text-chunking` | Hilfsfunktionen für Text- und Markdown-Chunking/-Rendering, Markdown-Tabellenkonvertierung, Entfernen von Direktiven-Tags und Dienstprogramme für sicheren Text |
    | `plugin-sdk/text-chunking` | Hilfsfunktion für ausgehendes Text-Chunking |
    | `plugin-sdk/speech` | Speech-Provider-Typen sowie Provider-seitige Exporte für Direktiven, Registry, Validierung, OpenAI-kompatiblen TTS-Builder und Speech-Hilfsfunktionen |
    | `plugin-sdk/speech-core` | Gemeinsame Speech-Provider-Typen sowie Exporte für Registry, Direktiven, Normalisierung und Speech-Hilfsfunktionen |
    | `plugin-sdk/realtime-transcription` | Provider-Typen für Echtzeittranskription, Registry-Hilfsfunktionen und gemeinsame Hilfsfunktion für WebSocket-Sitzungen |
    | `plugin-sdk/realtime-voice` | Provider-Typen für Echtzeitstimme und Registry-Hilfsfunktionen |
    | `plugin-sdk/image-generation` | Provider-Typen für Bildgenerierung sowie Hilfsfunktionen für Bild-Assets/Daten-URLs und der OpenAI-kompatible Bild-Provider-Builder |
    | `plugin-sdk/image-generation-core` | Gemeinsame Typen für Bildgenerierung, Failover-, Auth- und Registry-Hilfsfunktionen |
    | `plugin-sdk/music-generation` | Provider-/Request-/Result-Typen für Musikgenerierung |
    | `plugin-sdk/music-generation-core` | Gemeinsame Typen für Musikgenerierung, Failover-Hilfsfunktionen, Provider-Lookup und Model-Ref-Parsing |
    | `plugin-sdk/video-generation` | Provider-/Request-/Result-Typen für Videogenerierung |
    | `plugin-sdk/video-generation-core` | Gemeinsame Typen für Videogenerierung, Failover-Hilfsfunktionen, Provider-Lookup und Model-Ref-Parsing |
    | `plugin-sdk/webhook-targets` | Registry für Webhook-Ziele und Hilfsfunktionen zur Routeninstallation |
    | `plugin-sdk/webhook-path` | Veralteter Kompatibilitätsalias; verwenden Sie `plugin-sdk/webhook-ingress` |
    | `plugin-sdk/web-media` | Gemeinsame Hilfsfunktionen zum Laden entfernter/lokaler Medien |
    | `plugin-sdk/zod` | Veralteter Kompatibilitäts-Re-Export; importieren Sie `zod` direkt aus `zod` |
    | `plugin-sdk/testing` | Repo-lokales, veraltetes Kompatibilitäts-Barrel für ältere OpenClaw-Tests. Neue Repo-Tests sollten stattdessen gezielte lokale Test-Unterpfade wie `plugin-sdk/agent-runtime-test-contracts`, `plugin-sdk/plugin-test-runtime`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/test-env` oder `plugin-sdk/test-fixtures` importieren |
    | `plugin-sdk/plugin-test-api` | Repo-lokale minimale `createTestPluginApi`-Hilfsfunktion für direkte Unit-Tests zur Plugin-Registrierung ohne Import von Repo-Testhilfs-Bridges |
    | `plugin-sdk/agent-runtime-test-contracts` | Repo-lokale native Contract-Fixtures für Agent-Runtime-Adapter für Auth-, Delivery-, Fallback-, Tool-Hook-, Prompt-Overlay-, Schema- und Transcript-Projection-Tests |
    | `plugin-sdk/channel-test-helpers` | Repo-lokale kanalorientierte Testhilfsfunktionen für generische Action-/Setup-/Status-Contracts, Verzeichnis-Assertions, Account-Start-Lifecycle, Send-Config-Threading, Runtime-Mocks, Statusprobleme, ausgehende Zustellung und Hook-Registrierung |
    | `plugin-sdk/channel-target-testing` | Repo-lokale gemeinsame Suite für Fehlerfälle der Zielauflösung in Kanaltests |
    | `plugin-sdk/plugin-test-contracts` | Repo-lokale Contract-Hilfsfunktionen für Plugin-Paket, Registrierung, öffentliche Artefakte, direkte Importe, Runtime-API und Import-Nebeneffekte |
    | `plugin-sdk/provider-test-contracts` | Repo-lokale Contract-Hilfsfunktionen für Provider-Runtime, Auth, Discovery, Onboard, Katalog, Assistent, Medien-Capability, Replay-Policy, Echtzeit-STT-Live-Audio, Websuche/-Fetch und Stream |
    | `plugin-sdk/provider-http-test-mocks` | Repo-lokale optionale Vitest-HTTP-/Auth-Mocks für Provider-Tests, die `plugin-sdk/provider-http` ausüben |
    | `plugin-sdk/test-fixtures` | Repo-lokale generische Fixtures für CLI-Runtime-Erfassung, Sandbox-Kontext, Skill-Writer, Agent-Message, System-Event, Modul-Reload, gebündelten Plugin-Pfad, Terminaltext, Chunking, Auth-Token und typisierte Fälle |
    | `plugin-sdk/test-node-mocks` | Repo-lokale gezielte Hilfsfunktionen für Node-Builtin-Mocks zur Verwendung in Vitest-`vi.mock("node:*")`-Factories |
  </Accordion>

  <Accordion title="Memory-Unterpfade">
    | Unterpfad | Wichtige Exporte |
    | --- | --- |
    | `plugin-sdk/memory-core` | Gebündelte memory-core-Hilfsoberfläche für Manager-/Config-/Datei-/CLI-Hilfsfunktionen |
    | `plugin-sdk/memory-core-engine-runtime` | Runtime-Fassade für Memory-Index/-Suche |
    | `plugin-sdk/memory-core-host-engine-foundation` | Exporte der Memory-Host-Foundation-Engine |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Embedding-Contracts für Memory-Hosts, Registry-Zugriff, lokaler Provider und generische Batch-/Remote-Hilfsfunktionen |
    | `plugin-sdk/memory-core-host-engine-qmd` | Exporte der Memory-Host-QMD-Engine |
    | `plugin-sdk/memory-core-host-engine-storage` | Exporte der Memory-Host-Storage-Engine |
    | `plugin-sdk/memory-core-host-multimodal` | Multimodale Hilfsfunktionen für Memory-Hosts |
    | `plugin-sdk/memory-core-host-query` | Query-Hilfsfunktionen für Memory-Hosts |
    | `plugin-sdk/memory-core-host-secret` | Secret-Hilfsfunktionen für Memory-Hosts |
    | `plugin-sdk/memory-core-host-events` | Veralteter Kompatibilitätsalias; verwenden Sie `plugin-sdk/memory-host-events` |
    | `plugin-sdk/memory-core-host-status` | Status-Hilfsfunktionen für Memory-Hosts |
    | `plugin-sdk/memory-core-host-runtime-cli` | CLI-Runtime-Hilfsfunktionen für Memory-Hosts |
    | `plugin-sdk/memory-core-host-runtime-core` | Core-Runtime-Hilfsfunktionen für Memory-Hosts |
    | `plugin-sdk/memory-core-host-runtime-files` | Datei-/Runtime-Hilfsfunktionen für Memory-Hosts |
    | `plugin-sdk/memory-host-core` | Herstellerneutraler Alias für Core-Runtime-Hilfsfunktionen für Memory-Hosts |
    | `plugin-sdk/memory-host-events` | Herstellerneutraler Alias für Event-Journal-Hilfsfunktionen für Memory-Hosts |
    | `plugin-sdk/memory-host-files` | Veralteter Kompatibilitätsalias; verwenden Sie `plugin-sdk/memory-core-host-runtime-files` |
    | `plugin-sdk/memory-host-markdown` | Gemeinsame Managed-Markdown-Hilfsfunktionen für Memory-nahe Plugins |
    | `plugin-sdk/memory-host-search` | Active Memory-Runtime-Fassade für Search-Manager-Zugriff |
    | `plugin-sdk/memory-host-status` | Veralteter Kompatibilitätsalias; verwenden Sie `plugin-sdk/memory-core-host-status` |
  </Accordion>

  <Accordion title="Reservierte Unterpfade für gebündelte Hilfsfunktionen">
    Derzeit gibt es keine reservierten SDK-Unterpfade für gebündelte Hilfsfunktionen. Owner-spezifische
    Hilfsfunktionen befinden sich im zuständigen Plugin-Paket, während wiederverwendbare Host-Contracts
    generische SDK-Unterpfade wie `plugin-sdk/gateway-runtime`,
    `plugin-sdk/security-runtime` und `plugin-sdk/plugin-config-runtime` verwenden.
  </Accordion>
</AccordionGroup>

## Verwandt

- [Plugin-SDK-Überblick](/de/plugins/sdk-overview)
- [Plugin-SDK-Einrichtung](/de/plugins/sdk-setup)
- [Plugins erstellen](/de/plugins/building-plugins)
