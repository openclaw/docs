---
read_when:
    - Auswahl des richtigen plugin-sdk-Unterpfads für einen Plugin-Import
    - Gebündelte Plugin-Unterpfade und Hilfsschnittstellen auditieren
summary: 'Plugin-SDK-Unterpfadkatalog: welche Importe wo liegen, gruppiert nach Bereich'
title: Plugin-SDK-Unterpfade
x-i18n:
    generated_at: "2026-05-06T06:59:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: 98b16cd3fcd6babc64df20ad4e679c35553fc21894617f30907bbf0e579a4d89
    source_path: plugins/sdk-subpaths.md
    workflow: 16
---

Das Plugin SDK wird als Satz schmaler Unterpfade unter `openclaw/plugin-sdk/` bereitgestellt.
Diese Seite katalogisiert die häufig verwendeten Unterpfade nach Zweck gruppiert. Die generierte
vollständige Liste mit über 200 Unterpfaden befindet sich in `scripts/lib/plugin-sdk-entrypoints.json`;
reservierte Hilfs-Unterpfade für gebündelte Plugins erscheinen dort, sind aber ein
Implementierungsdetail, sofern sie nicht ausdrücklich auf einer Dokumentationsseite hervorgehoben werden. Maintainer können aktive
reservierte Hilfs-Unterpfade mit `pnpm plugins:boundary-report:summary` prüfen; ungenutzte
reservierte Hilfs-Exporte lassen stattdessen den CI-Bericht fehlschlagen, anstatt im öffentlichen SDK
als ruhende Kompatibilitätsschuld zu verbleiben.

Den Leitfaden zum Erstellen von Plugins finden Sie unter [Plugin SDK-Übersicht](/de/plugins/sdk-overview).

## Plugin-Einstieg

| Unterpfad                                 | Wichtige Exporte                                                                                                                                                                                                                  |
| ----------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/plugin-entry`                 | `definePluginEntry`                                                                                                                                                                                                               |
| `plugin-sdk/core`                         | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema`, `buildJsonChannelConfigSchema`                                                            |
| `plugin-sdk/config-schema`                | `OpenClawSchema`                                                                                                                                                                                                                  |
| `plugin-sdk/provider-entry`               | `defineSingleProviderPluginEntry`                                                                                                                                                                                                 |
| `plugin-sdk/testing`                      | Breites Kompatibilitäts-Sammelmodul für ältere Plugin-Tests; bevorzugen Sie fokussierte Test-Unterpfade für neue Erweiterungstests                                                                                                |
| `plugin-sdk/plugin-test-api`              | Minimaler Mock-Builder für `OpenClawPluginApi` für direkte Unit-Tests der Plugin-Registrierung                                                                                                                                     |
| `plugin-sdk/agent-runtime-test-contracts` | Contract-Fixtures für native Agent-Runtime-Adapter für Auth-Profile, Unterdrückung der Zustellung, Fallback-Klassifizierung, Tool-Hooks, Prompt-Overlays, Schemas und Transkript-Reparatur                                      |
| `plugin-sdk/channel-test-helpers`         | Test-Helfer für Kanal-Konto-Lebenszyklus, Verzeichnis, Sendekonfiguration, Runtime-Mock, Hook, gebündelten Kanaleinstieg, Envelope-Zeitstempel, Pairing-Antwort und generische Kanal-Contracts                                  |
| `plugin-sdk/channel-target-testing`       | Gemeinsame Testsuite für Fehlerfälle bei der Zielauflösung von Kanälen                                                                                                                                                            |
| `plugin-sdk/plugin-test-contracts`        | Contract-Helfer für Plugin-Registrierung, Paketmanifest, öffentliche Artefakte, Runtime-API, Import-Nebeneffekte und direkten Import                                                                                              |
| `plugin-sdk/plugin-test-runtime`          | Fixtures für Plugin-Runtime, Registry, Provider-Registrierung, Einrichtungsassistent und Runtime-TaskFlow für Tests                                                                                                               |
| `plugin-sdk/provider-test-contracts`      | Contract-Helfer für Provider-Runtime, Authentifizierung, Erkennung, Onboarding, Katalog, Medienfähigkeit, Replay-Richtlinie, Echtzeit-STT-Live-Audio, Websuche/-Abruf und Assistent                                              |
| `plugin-sdk/provider-http-test-mocks`     | Optionale Vitest-HTTP/Auth-Mocks für Provider-Tests, die `plugin-sdk/provider-http` ausführen                                                                                                                                     |
| `plugin-sdk/test-env`                     | Fixtures für Testumgebung, Fetch/Netzwerk, disposable HTTP-Server, eingehende Anfrage, Live-Test, temporäres Dateisystem und Zeitsteuerung                                                                                       |
| `plugin-sdk/test-fixtures`                | Generische Test-Fixtures für CLI, Sandbox, Skill, Agent-Nachricht, Systemereignis, Modul-Neuladen, Pfad zu gebündeltem Plugin, Terminal, Chunking, Auth-Token und typisierte Fälle                                               |
| `plugin-sdk/test-node-mocks`              | Fokussierte Mock-Helfer für integrierte Node-Module zur Verwendung in Vitest-`vi.mock("node:*")`-Factories                                                                                                                        |
| `plugin-sdk/migration`                    | Helfer für Migration-Provider-Elemente wie `createMigrationItem`, Reason-Konstanten, Statusmarker für Elemente, Schwärzungshelfer und `summarizeMigrationItems`                                                                   |
| `plugin-sdk/migration-runtime`            | Runtime-Migrationshelfer wie `copyMigrationFileItem`, `withCachedMigrationConfigRuntime` und `writeMigrationReport`                                                                                                               |

  <AccordionGroup>
  <Accordion title="Channel-Unterpfade">
    | Unterpfad | Zentrale Exporte |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | Root-`openclaw.json`-Zod-Schemaexport (`OpenClawSchema`) |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, plus `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | Gemeinsam genutzte Setup-Wizard-Helfer, Allowlist-Prompts, Setup-Status-Builder |
    | `plugin-sdk/setup-runtime` | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | `createEnvPatchedAccountSetupAdapter` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | Helfer für Multi-Account-Konfiguration und Action-Gates, Fallback-Helfer für Standard-Accounts |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, Helfer zur Normalisierung von Account-IDs |
    | `plugin-sdk/account-resolution` | Account-Suche und Helfer für Standard-Fallbacks |
    | `plugin-sdk/account-helpers` | Eng gefasste Helfer für Account-Listen und Account-Actions |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | Legacy-Helfer für Reply-Pipelines. Neuer Code für Channel-Reply-Pipelines sollte `createChannelMessageReplyPipeline` und `resolveChannelMessageSourceReplyDeliveryMode` aus `plugin-sdk/channel-message` verwenden. |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
    | `plugin-sdk/channel-config-schema` | Gemeinsam genutzte Primitive für Channel-Konfigurationsschemas sowie Zod- und direkte JSON/TypeBox-Builder |
    | `plugin-sdk/bundled-channel-config-schema` | Gebündelte OpenClaw-Channel-Konfigurationsschemas nur für gepflegte gebündelte Plugins |
    | `plugin-sdk/channel-config-schema-legacy` | Veralteter Kompatibilitätsalias für gebündelte Channel-Konfigurationsschemas |
    | `plugin-sdk/telegram-command-config` | Helfer zur Normalisierung und Validierung benutzerdefinierter Telegram-Befehle mit Fallback auf den gebündelten Vertrag |
    | `plugin-sdk/command-gating` | Eng gefasste Helfer für Autorisierungs-Gates von Befehlen |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-lifecycle` | `createAccountStatusSink`, `createChannelRunQueue` und Legacy-Helfer für den Lebenszyklus von Draft-Streams. Neuer Code zur Preview-Finalisierung sollte `plugin-sdk/channel-message` verwenden. |
    | `plugin-sdk/channel-message` | Günstige Helfer für Message-Lebenszyklusverträge wie `defineChannelMessageAdapter`, `createChannelMessageAdapterFromOutbound`, `createReplyPrefixContext`, `resolveChannelMessageSourceReplyDeliveryMode`, Kompatibilitätsfassaden, Ableitung von Durable-Final-Fähigkeiten, Capability-Proof-Helfer für Sende-/Empfangs-/Side-Effect-Fähigkeiten, `MessageReceiveContext`, Proofs für Receive-Ack-Richtlinien, `defineFinalizableLivePreviewAdapter`, `deliverWithFinalizableLivePreviewAdapter`, Proofs für Live-Preview- und Live-Finalizer-Fähigkeiten, dauerhaften Wiederherstellungszustand, `RenderedMessageBatch`, Message-Receipt-Typen und Helfer für Receipt-IDs. Siehe [Channel-Message-API](/de/plugins/sdk-channel-message). Legacy-`createChannelTurnReplyPipeline` bleibt nur für Kompatibilitäts-Dispatcher erhalten. |
    | `plugin-sdk/channel-message-runtime` | Runtime-Delivery-Helfer, die ausgehende Zustellung laden können, darunter `deliverInboundReplyWithMessageSendContext`, `sendDurableMessageBatch`, `withDurableMessageSendContext`, `dispatchChannelMessageReplyWithBase` und `recordChannelMessageReplyDispatch`. Aus Monitor-/Send-Runtime-Modulen verwenden, nicht aus heißen Plugin-Bootstrap-Dateien. |
    | `plugin-sdk/inbound-envelope` | Gemeinsam genutzte Helfer für eingehende Routen und Envelope-Builder |
    | `plugin-sdk/inbound-reply-dispatch` | Legacy-Helfer für gemeinsam genutztes eingehendes Record-and-Dispatch, sichtbare/finale Dispatch-Prädikate und veraltete `deliverDurableInboundReplyPayload`-Kompatibilität für vorbereitete Channel-Dispatcher. Neuer Code für Channel-Empfang/-Dispatch sollte Runtime-Lebenszyklushelfer aus `plugin-sdk/channel-message-runtime` importieren. |
    | `plugin-sdk/messaging-targets` | Helfer zum Parsen und Abgleichen von Zielen |
    | `plugin-sdk/outbound-media` | Gemeinsam genutzte Helfer zum Laden ausgehender Medien |
    | `plugin-sdk/outbound-send-deps` | Leichtgewichtige Abhängigkeitsauflösung für ausgehendes Senden in Channel-Adaptern |
    | `plugin-sdk/outbound-runtime` | Helfer für ausgehende Zustellung, Identität, Sende-Delegate, Session, Formatierung und Payload-Planung |
    | `plugin-sdk/poll-runtime` | Eng gefasste Helfer zur Poll-Normalisierung |
    | `plugin-sdk/thread-bindings-runtime` | Lebenszyklus- und Adapter-Helfer für Thread-Bindings |
    | `plugin-sdk/agent-media-payload` | Legacy-Builder für Agent-Medien-Payloads |
    | `plugin-sdk/conversation-runtime` | Helfer für Conversation-/Thread-Binding, Pairing und konfigurierte Bindings |
    | `plugin-sdk/runtime-config-snapshot` | Helfer für Runtime-Konfigurations-Snapshots |
    | `plugin-sdk/runtime-group-policy` | Helfer zur Auflösung von Runtime-Gruppenrichtlinien |
    | `plugin-sdk/channel-status` | Gemeinsam genutzte Helfer für Channel-Status-Snapshots/-Zusammenfassungen |
    | `plugin-sdk/channel-config-primitives` | Eng gefasste Primitive für Channel-Konfigurationsschemas |
    | `plugin-sdk/channel-config-writes` | Autorisierungshelfer für Channel-Konfigurationsschreibvorgänge |
    | `plugin-sdk/channel-plugin-common` | Gemeinsam genutzte Prelude-Exporte für Channel-Plugins |
    | `plugin-sdk/allowlist-config-edit` | Helfer zum Bearbeiten/Lesen der Allowlist-Konfiguration |
    | `plugin-sdk/group-access` | Gemeinsam genutzte Helfer für Gruppen-Zugriffsentscheidungen |
    | `plugin-sdk/direct-dm` | Gemeinsam genutzte Auth-/Guard-Helfer für direkte DMs |
    | `plugin-sdk/discord` | Veraltete Discord-Kompatibilitätsfassade für veröffentlichtes `@openclaw/discord@2026.3.13` und nachverfolgte Owner-Kompatibilität; neue Plugins sollten generische Channel-SDK-Unterpfade verwenden |
    | `plugin-sdk/telegram-account` | Veraltete Telegram-Kompatibilitätsfassade für Account-Auflösung zur nachverfolgten Owner-Kompatibilität; neue Plugins sollten injizierte Runtime-Helfer oder generische Channel-SDK-Unterpfade verwenden |
    | `plugin-sdk/zalouser` | Veraltete Kompatibilitätsfassade für Zalo Personal für veröffentlichte Lark/Zalo-Pakete, die weiterhin Autorisierung für Sender-Befehle importieren; neue Plugins sollten `plugin-sdk/command-auth` verwenden |
    | `plugin-sdk/interactive-runtime` | Semantische Message-Präsentation, Zustellung und Legacy-Helfer für interaktive Replies. Siehe [Message Presentation](/de/plugins/message-presentation) |
    | `plugin-sdk/channel-inbound` | Kompatibilitäts-Barrel für Inbound-Debounce, Mention-Abgleich, Mention-Policy-Helfer und Envelope-Helfer |
    | `plugin-sdk/channel-inbound-debounce` | Eng gefasste Inbound-Debounce-Helfer |
    | `plugin-sdk/channel-mention-gating` | Eng gefasste Helfer für Mention-Policy, Mention-Marker und Mention-Text ohne die breitere Inbound-Runtime-Oberfläche |
    | `plugin-sdk/channel-envelope` | Eng gefasste Helfer zur Formatierung eingehender Envelopes |
    | `plugin-sdk/channel-location` | Channel-Location-Kontext und Formatierungshelfer |
    | `plugin-sdk/channel-logging` | Channel-Logging-Helfer für verworfene eingehende Nachrichten und Typing-/Ack-Fehler |
    | `plugin-sdk/channel-send-result` | Reply-Ergebnistypen |
    | `plugin-sdk/channel-actions` | Helfer für Channel-Message-Actions sowie veraltete native Schemahelfer, die für Plugin-Kompatibilität beibehalten werden |
    | `plugin-sdk/channel-route` | Gemeinsam genutzte Helfer für Routennormalisierung, parsergesteuerte Zielauflösung, Thread-ID-Stringifizierung, Deduplizierung/Kompaktierung von Routenschlüsseln, Typen geparster Ziele und Routen-/Zielvergleich |
    | `plugin-sdk/channel-targets` | Helfer zum Parsen von Zielen; Aufrufer für Routenvergleiche sollten `plugin-sdk/channel-route` verwenden |
    | `plugin-sdk/channel-contract` | Channel-Vertragstypen |
    | `plugin-sdk/channel-feedback` | Feedback-/Reaction-Verdrahtung |
    | `plugin-sdk/channel-secret-runtime` | Eng gefasste Secret-Contract-Helfer wie `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment` und Secret-Zieltypen |
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
    | `plugin-sdk/provider-auth-api-key` | Hilfsfunktionen für API-Schlüssel-Onboarding/Profilschreiben wie `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | Standardmäßiger OAuth-Builder für Authentifizierungsergebnisse |
    | `plugin-sdk/provider-auth-login` | Gemeinsame interaktive Anmeldehilfen für Provider-Plugins |
    | `plugin-sdk/provider-env-vars` | Hilfsfunktionen zur Suche nach Provider-Authentifizierungs-Umgebungsvariablen |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials`, veralteter `resolveOpenClawAgentDir`-Kompatibilitätsexport |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, gemeinsame Builder für Replay-Richtlinien, Provider-Endpunkt-Hilfsfunktionen und Hilfsfunktionen zur Modell-ID-Normalisierung wie `normalizeNativeXaiModelId` |
    | `plugin-sdk/provider-catalog-runtime` | Laufzeit-Hook zur Provider-Katalog-Erweiterung und Plugin-Provider-Registry-Nähte für Vertragstests |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | Generische Hilfsfunktionen für Provider-HTTP/Endpunkt-Fähigkeiten, Provider-HTTP-Fehler und Multipart-Formular-Hilfsfunktionen für Audiotranskription |
    | `plugin-sdk/provider-web-fetch-contract` | Schmale Hilfsfunktionen für Web-Fetch-Konfiguration/-Auswahlverträge wie `enablePluginInConfig` und `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | Hilfsfunktionen für Web-Fetch-Provider-Registrierung/-Cache |
    | `plugin-sdk/provider-web-search-config-contract` | Schmale Hilfsfunktionen für Web-Search-Konfiguration/-Anmeldedaten für Provider, die keine Plugin-Aktivierungsverdrahtung benötigen |
    | `plugin-sdk/provider-web-search-contract` | Schmale Hilfsfunktionen für Web-Search-Konfiguration/-Anmeldedatenverträge wie `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` und bereichsgebundene Setter/Getter für Anmeldedaten |
    | `plugin-sdk/provider-web-search` | Hilfsfunktionen für Web-Search-Provider-Registrierung/-Cache/-Laufzeit |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, Gemini-Schema-Bereinigung + Diagnosen und xAI-Kompatibilitätshilfen wie `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
    | `plugin-sdk/provider-usage` | `fetchClaudeUsage` und Ähnliches |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, Stream-Wrapper-Typen und gemeinsame Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot-Wrapper-Hilfsfunktionen |
    | `plugin-sdk/provider-transport-runtime` | Hilfsfunktionen für nativen Provider-Transport wie geschützter Fetch, Transportnachrichten-Transformationen und beschreibbare Transportereignis-Streams |
    | `plugin-sdk/provider-onboard` | Hilfsfunktionen für Onboarding-Konfigurations-Patches |
    | `plugin-sdk/global-singleton` | Prozesslokale Singleton-/Map-/Cache-Hilfsfunktionen |
    | `plugin-sdk/group-activation` | Schmale Hilfsfunktionen für Gruppenaktivierungsmodus und Befehlsparsing |
  </Accordion>

  <Accordion title="Authentifizierungs- und Sicherheits-Unterpfade">
    | Unterpfad | Wichtige Exporte |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, Befehls-Registry-Hilfsfunktionen einschließlich dynamischer Argumentmenü-Formatierung, Hilfsfunktionen für Absenderautorisierung |
    | `plugin-sdk/command-status` | Builder für Befehls-/Hilfenachrichten wie `buildCommandsMessagePaginated` und `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | Hilfsfunktionen zur Genehmigerauflösung und Aktionsauthentifizierung im selben Chat |
    | `plugin-sdk/approval-client-runtime` | Hilfsfunktionen für native Exec-Genehmigungsprofile/-Filter |
    | `plugin-sdk/approval-delivery-runtime` | Native Adapter für Genehmigungsfähigkeiten/-Zustellung |
    | `plugin-sdk/approval-gateway-runtime` | Gemeinsame Hilfsfunktion zur Gateway-Auflösung für Genehmigungen |
    | `plugin-sdk/approval-handler-adapter-runtime` | Leichtgewichtige Hilfsfunktionen zum Laden nativer Genehmigungsadapter für Hot-Channel-Einstiegspunkte |
    | `plugin-sdk/approval-handler-runtime` | Breitere Laufzeit-Hilfsfunktionen für Genehmigungs-Handler; bevorzugen Sie die schmaleren Adapter-/Gateway-Nähte, wenn sie ausreichen |
    | `plugin-sdk/approval-native-runtime` | Hilfsfunktionen für natives Genehmigungsziel + Kontobindung |
    | `plugin-sdk/approval-reply-runtime` | Hilfsfunktionen für Exec-/Plugin-Genehmigungsantwort-Payloads |
    | `plugin-sdk/approval-runtime` | Hilfsfunktionen für Exec-/Plugin-Genehmigungs-Payloads, native Genehmigungs-Routing-/Laufzeit-Hilfsfunktionen und Hilfsfunktionen für strukturierte Genehmigungsanzeigen wie `formatApprovalDisplayPath` |
    | `plugin-sdk/reply-dedupe` | Schmale Hilfsfunktionen zum Zurücksetzen der Deduplizierung eingehender Antworten |
    | `plugin-sdk/channel-contract-testing` | Schmale Hilfsfunktionen für Channel-Vertragstests ohne das breite Testing-Barrel |
    | `plugin-sdk/command-auth-native` | Native Befehlsauthentifizierung, dynamische Argumentmenü-Formatierung und native Hilfsfunktionen für Sitzungsziele |
    | `plugin-sdk/command-detection` | Gemeinsame Hilfsfunktionen zur Befehlserkennung |
    | `plugin-sdk/command-primitives-runtime` | Leichtgewichtige Befehlstext-Prädikate für Hot-Channel-Pfade |
    | `plugin-sdk/command-surface` | Befehlsrumpf-Normalisierung und Hilfsfunktionen für Befehlsoberflächen |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | Schmale Hilfsfunktionen zur Sammlung von Secret-Verträgen für Channel-/Plugin-Secret-Oberflächen |
    | `plugin-sdk/secret-ref-runtime` | Schmale `coerceSecretRef`- und SecretRef-Typisierungshilfen für Secret-Vertrags-/Konfigurationsparsing |
    | `plugin-sdk/security-runtime` | Gemeinsame Hilfsfunktionen für Vertrauen, DM-Gating, root-begrenzte Datei-/Pfadhilfen einschließlich Create-only-Schreibvorgängen, synchronem/asynchronem atomarem Dateiersatz, temporären Schreibvorgängen in Geschwisterpfaden, Fallback für geräteübergreifendes Verschieben, privaten Dateispeicher-Hilfsfunktionen, Symlink-Elternschutz, externe Inhalte, Schwärzung sensibler Texte, Secret-Vergleich in konstanter Zeit und Secret-Sammlungen |
    | `plugin-sdk/ssrf-policy` | Hilfsfunktionen für Host-Allowlist und SSRF-Richtlinien für private Netzwerke |
    | `plugin-sdk/ssrf-dispatcher` | Schmale Hilfsfunktionen für angeheftete Dispatcher ohne die breite Infra-Laufzeitoberfläche |
    | `plugin-sdk/ssrf-runtime` | Angehefteter Dispatcher, SSRF-geschützter Fetch, SSRF-Fehler und SSRF-Richtlinien-Hilfsfunktionen |
    | `plugin-sdk/secret-input` | Hilfsfunktionen zum Parsen von Secret-Eingaben |
    | `plugin-sdk/webhook-ingress` | Webhook-Anfrage-/Ziel-Hilfsfunktionen und Koerzierung von rohem Websocket/Body |
    | `plugin-sdk/webhook-request-guards` | Hilfsfunktionen für Anfrage-Body-Größe/-Timeouts |
  </Accordion>

  <Accordion title="Runtime- und Speicher-Unterpfade">
    | Unterpfad | Wichtige Exporte |
    | --- | --- |
    | `plugin-sdk/runtime` | Breite Runtime-/Logging-/Backup-/Plugin-Installationshelfer |
    | `plugin-sdk/runtime-env` | Schmale Helfer fuer Runtime-Umgebung, Logger, Timeout, Wiederholung und Backoff |
    | `plugin-sdk/browser-config` | Unterstuetzte Browser-Konfigurationsfassade fuer normalisierte Profile/Standardeinstellungen, CDP-URL-Parsing und Browser-Control-Auth-Helfer |
    | `plugin-sdk/channel-runtime-context` | Generische Helfer zur Registrierung und Suche von Kanal-Runtime-Kontexten |
    | `plugin-sdk/matrix` | Veraltete Matrix-Kompatibilitaetsfassade fuer aeltere Drittanbieter-Kanalpakete; neue Plugins sollten `plugin-sdk/run-command` direkt importieren |
    | `plugin-sdk/mattermost` | Veraltete Mattermost-Kompatibilitaetsfassade fuer aeltere Drittanbieter-Kanalpakete; neue Plugins sollten generische SDK-Unterpfade direkt importieren |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Gemeinsame Helfer fuer Plugin-Befehle, Hooks, HTTP und Interaktion |
    | `plugin-sdk/hook-runtime` | Gemeinsame Helfer fuer Webhook-/interne Hook-Pipelines |
    | `plugin-sdk/lazy-runtime` | Helfer fuer verzögerte Runtime-Importe und -Bindings wie `createLazyRuntimeModule`, `createLazyRuntimeMethod` und `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | Prozessausfuehrungshelfer |
    | `plugin-sdk/cli-runtime` | Helfer fuer CLI-Formatierung, Warten, Versionen, Argumentaufrufe und verzögerte Befehlsgruppen |
    | `plugin-sdk/gateway-runtime` | Gateway-Client, Starthelfer fuer event-loop-bereite Clients, Gateway-CLI-RPC, Gateway-Protokollfehler und Helfer fuer Kanalstatus-Patches |
    | `plugin-sdk/config-types` | Reine Typ-Konfigurationsoberflaeche fuer Plugin-Konfigurationsformen wie `OpenClawConfig` und Kanal-/Provider-Konfigurationstypen |
    | `plugin-sdk/plugin-config-runtime` | Runtime-Helfer zur Plugin-Konfigurationssuche wie `requireRuntimeConfig`, `resolvePluginConfigObject` und `resolveLivePluginConfigObject` |
    | `plugin-sdk/config-mutation` | Transaktionale Helfer fuer Konfigurationsaenderungen wie `mutateConfigFile`, `replaceConfigFile` und `logConfigUpdated` |
    | `plugin-sdk/runtime-config-snapshot` | Helfer fuer Momentaufnahmen der aktuellen Prozesskonfiguration wie `getRuntimeConfig`, `getRuntimeConfigSnapshot` und Test-Snapshot-Setter |
    | `plugin-sdk/telegram-command-config` | Normalisierung von Telegram-Befehlsnamen/-beschreibungen und Prüfungen auf Duplikate/Konflikte, auch wenn die gebuendelte Telegram-Vertragsoberflaeche nicht verfuegbar ist |
    | `plugin-sdk/text-autolink-runtime` | Erkennung von Datei-Referenz-Autolinks ohne das breite Text-Runtime-Barrel |
    | `plugin-sdk/approval-runtime` | Helfer fuer Exec-/Plugin-Genehmigungen, Genehmigungsfaehigkeits-Builder, Auth-/Profilhelfer, native Routing-/Runtime-Helfer und formatierte strukturierte Genehmigungsanzeigepfade |
    | `plugin-sdk/reply-runtime` | Gemeinsame Inbound-/Antwort-Runtime-Helfer, Chunking, Dispatch, Heartbeat, Antwortplaner |
    | `plugin-sdk/reply-dispatch-runtime` | Schmale Helfer fuer Antwort-Dispatch/-Finalisierung und Konversationslabels |
    | `plugin-sdk/reply-history` | Gemeinsame Helfer und Marker fuer Antwortverlauf in kurzem Fenster wie `buildHistoryContext`, `HISTORY_CONTEXT_MARKER`, `recordPendingHistoryEntry` und `clearHistoryEntriesIfEnabled` |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | Schmale Helfer fuer Text-/Markdown-Chunking |
    | `plugin-sdk/session-store-runtime` | Helfer fuer Session-Speicherpfad, Session-Schluessel, Aktualisierungszeitpunkt und Speichermutation |
    | `plugin-sdk/cron-store-runtime` | Helfer fuer Cron-Speicherpfad, Laden und Speichern |
    | `plugin-sdk/state-paths` | Helfer fuer State-/OAuth-Verzeichnispfade |
    | `plugin-sdk/routing` | Helfer fuer Routen-/Session-Schluessel-/Account-Bindung wie `resolveAgentRoute`, `buildAgentSessionKey` und `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | Gemeinsame Helfer fuer Kanal-/Account-Statuszusammenfassungen, Runtime-State-Standardeinstellungen und Issue-Metadaten |
    | `plugin-sdk/target-resolver-runtime` | Gemeinsame Zielauflösungshelfer |
    | `plugin-sdk/string-normalization-runtime` | Helfer fuer Slug-/String-Normalisierung |
    | `plugin-sdk/request-url` | String-URLs aus fetch-/request-aehnlichen Eingaben extrahieren |
    | `plugin-sdk/run-command` | Zeitgesteuerter Befehlsrunner mit normalisierten stdout-/stderr-Ergebnissen |
    | `plugin-sdk/param-readers` | Gemeinsame Parameterleser fuer Tools/CLI |
    | `plugin-sdk/tool-payload` | Normalisierte Payloads aus Tool-Ergebnisobjekten extrahieren |
    | `plugin-sdk/tool-send` | Kanonische Sendeziel-Felder aus Tool-Argumenten extrahieren |
    | `plugin-sdk/temp-path` | Gemeinsame Helfer fuer temporaere Downloadpfade und private sichere temporaere Arbeitsbereiche |
    | `plugin-sdk/logging-core` | Subsystem-Logger und Redaktionshelfer |
    | `plugin-sdk/markdown-table-runtime` | Helfer fuer Markdown-Tabellenmodus und -Konvertierung |
    | `plugin-sdk/model-session-runtime` | Helfer fuer Modell-/Session-Overrides wie `applyModelOverrideToSessionEntry` und `resolveAgentMaxConcurrent` |
    | `plugin-sdk/talk-config-runtime` | Helfer zur Aufloesung der Talk-Provider-Konfiguration |
    | `plugin-sdk/json-store` | Kleine Helfer zum Lesen/Schreiben von JSON-State |
    | `plugin-sdk/file-lock` | Re-entrante File-Lock-Helfer |
    | `plugin-sdk/persistent-dedupe` | Plattengestuetzte Dedupe-Cache-Helfer |
    | `plugin-sdk/acp-runtime` | ACP-Runtime-/Session- und Antwort-Dispatch-Helfer |
    | `plugin-sdk/acp-runtime-backend` | Leichtgewichtige ACP-Backend-Registrierungs- und Antwort-Dispatch-Helfer fuer beim Start geladene Plugins |
    | `plugin-sdk/acp-binding-resolve-runtime` | Schreibgeschuetzte ACP-Bindungsauflösung ohne Lifecycle-Startup-Importe |
    | `plugin-sdk/agent-config-primitives` | Schmale Primitive fuer Agent-Runtime-Konfigurationsschema |
    | `plugin-sdk/boolean-param` | Lockerer boolescher Parameterleser |
    | `plugin-sdk/dangerous-name-runtime` | Helfer zur Aufloesung von Dangerous-Name-Abgleichen |
    | `plugin-sdk/device-bootstrap` | Helfer fuer Device-Bootstrap und Pairing-Token |
    | `plugin-sdk/extension-shared` | Gemeinsame Primitive fuer passive Kanaele, Status und Ambient-Proxy-Helfer |
    | `plugin-sdk/models-provider-runtime` | Helfer fuer `/models`-Befehls-/Provider-Antworten |
    | `plugin-sdk/skill-commands-runtime` | Helfer zum Auflisten von Skill-Befehlen |
    | `plugin-sdk/native-command-registry` | Helfer fuer native Befehlsregistrierung, Build und Serialisierung |
    | `plugin-sdk/agent-harness` | Experimentelle Trusted-Plugin-Oberflaeche fuer Low-Level-Agent-Harnesses: Harness-Typen, Helfer zum Steuern/Abbrechen aktiver Runs, OpenClaw-Tool-Bridge-Helfer, Helfer fuer Runtime-Plan-Toolrichtlinien, Klassifizierung von Terminal-Ergebnissen, Helfer fuer Tool-Fortschrittsformatierung/-details und Hilfsfunktionen fuer Versuchsergebnisse |
    | `plugin-sdk/provider-zai-endpoint` | Helfer zur Erkennung von Z.AI-Endpunkten |
    | `plugin-sdk/async-lock-runtime` | Prozesslokaler Async-Lock-Helfer fuer kleine Runtime-State-Dateien |
    | `plugin-sdk/channel-activity-runtime` | Helfer fuer Kanalaktivitaets-Telemetrie |
    | `plugin-sdk/concurrency-runtime` | Helfer fuer begrenzte Nebenlaeufigkeit asynchroner Aufgaben |
    | `plugin-sdk/dedupe-runtime` | In-Memory-Dedupe-Cache-Helfer |
    | `plugin-sdk/delivery-queue-runtime` | Helfer zum Leeren ausstehender ausgehender Zustellungen |
    | `plugin-sdk/file-access-runtime` | Helfer fuer sichere lokale Datei- und Medienquellenpfade |
    | `plugin-sdk/heartbeat-runtime` | Helfer fuer Heartbeat-Ereignisse und Sichtbarkeit |
    | `plugin-sdk/number-runtime` | Helfer fuer numerische Koerzierung |
    | `plugin-sdk/secure-random-runtime` | Helfer fuer sichere Token/UUIDs |
    | `plugin-sdk/system-event-runtime` | Helfer fuer Systemereignis-Warteschlangen |
    | `plugin-sdk/transport-ready-runtime` | Helfer zum Warten auf Transportbereitschaft |
    | `plugin-sdk/infra-runtime` | Veralteter Kompatibilitaets-Shim; verwenden Sie die fokussierten Runtime-Unterpfade oben |
    | `plugin-sdk/collection-runtime` | Kleine Helfer fuer begrenzte Caches |
    | `plugin-sdk/diagnostic-runtime` | Helfer fuer Diagnose-Flags, -Ereignisse und Trace-Kontext |
    | `plugin-sdk/error-runtime` | Fehlergraph, Formatierung, gemeinsame Helfer zur Fehlerklassifizierung, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | Gewrappter Fetch, Proxy, EnvHttpProxyAgent-Option und Helfer fuer gepinnte Lookups |
    | `plugin-sdk/runtime-fetch` | Dispatcher-bewusster Runtime-Fetch ohne Proxy-/Guarded-Fetch-Importe |
    | `plugin-sdk/response-limit-runtime` | Begrenzter Response-Body-Reader ohne die breite Media-Runtime-Oberflaeche |
    | `plugin-sdk/session-binding-runtime` | Aktueller Konversations-Binding-State ohne konfiguriertes Binding-Routing oder Pairing-Speicher |
    | `plugin-sdk/session-store-runtime` | Session-Store-Helfer ohne breite Konfigurationsschreib-/Wartungsimporte |
    | `plugin-sdk/context-visibility-runtime` | Aufloesung der Kontextsichtbarkeit und Filterung ergaenzender Kontexte ohne breite Konfigurations-/Sicherheitsimporte |
    | `plugin-sdk/string-coerce-runtime` | Schmale Primitive-Record-/String-Koerzierung und Normalisierungshelfer ohne Markdown-/Logging-Importe |
    | `plugin-sdk/host-runtime` | Helfer fuer Hostname- und SCP-Host-Normalisierung |
    | `plugin-sdk/retry-runtime` | Helfer fuer Wiederholungskonfiguration und Wiederholungsrunner |
    | `plugin-sdk/agent-runtime` | Helfer fuer Agent-Verzeichnis, -Identitaet und -Arbeitsbereich, einschliesslich `resolveAgentDir`, `resolveDefaultAgentDir` und veraltetem Kompatibilitaetsexport `resolveOpenClawAgentDir` |
    | `plugin-sdk/directory-runtime` | Konfigurationsgestuetzte Verzeichnisabfrage/Deduplizierung |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Capability- und Test-Unterpfade">
    | Unterpfad | Zentrale Exporte |
    | --- | --- |
    | `plugin-sdk/media-runtime` | Gemeinsame Hilfsfunktionen zum Abrufen, Transformieren und Speichern von Medien, ffprobe-gestützte Ermittlung von Videodimensionen und Builder für Medien-Payloads |
    | `plugin-sdk/media-store` | Schmale Media-Store-Hilfsfunktionen wie `saveMediaBuffer` |
    | `plugin-sdk/media-generation-runtime` | Gemeinsame Hilfsfunktionen für Failover bei der Mediengenerierung, Kandidatenauswahl und Meldungen zu fehlenden Modellen |
    | `plugin-sdk/media-understanding` | Provider-Typen für Media Understanding sowie Provider-seitige Exporte für Bild-/Audio-Hilfsfunktionen |
    | `plugin-sdk/text-runtime` | Gemeinsame Hilfsfunktionen für Text/Markdown/Logging, etwa Entfernen von für Assistenten sichtbarem Text, Markdown-Render-/Chunking-/Tabellen-Hilfsfunktionen, Redaktionshilfen, Hilfsfunktionen für Direktive-Tags und Safe-Text-Dienstprogramme |
    | `plugin-sdk/text-chunking` | Hilfsfunktion für ausgehendes Text-Chunking |
    | `plugin-sdk/speech` | Speech-Provider-Typen sowie Provider-seitige Exporte für Direktiven, Registry, Validierung, OpenAI-kompatiblen TTS-Builder und Speech-Hilfsfunktionen |
    | `plugin-sdk/speech-core` | Gemeinsame Speech-Provider-Typen, Registry-, Direktiven-, Normalisierungs- und Speech-Hilfsfunktionen |
    | `plugin-sdk/realtime-transcription` | Provider-Typen für Echtzeittranskription, Registry-Hilfsfunktionen und gemeinsame WebSocket-Sitzungshilfsfunktion |
    | `plugin-sdk/realtime-voice` | Provider-Typen für Echtzeit-Voice und Registry-Hilfsfunktionen |
    | `plugin-sdk/image-generation` | Provider-Typen für Bildgenerierung sowie Hilfsfunktionen für Bild-Assets/Data-URLs und der OpenAI-kompatible Bild-Provider-Builder |
    | `plugin-sdk/image-generation-core` | Gemeinsame Typen, Failover-, Auth- und Registry-Hilfsfunktionen für Bildgenerierung |
    | `plugin-sdk/music-generation` | Provider-, Anfrage- und Ergebnistypen für Musikgenerierung |
    | `plugin-sdk/music-generation-core` | Gemeinsame Typen, Failover-Hilfsfunktionen, Provider-Suche und Model-Ref-Parsing für Musikgenerierung |
    | `plugin-sdk/video-generation` | Provider-, Anfrage- und Ergebnistypen für Videogenerierung |
    | `plugin-sdk/video-generation-core` | Gemeinsame Typen, Failover-Hilfsfunktionen, Provider-Suche und Model-Ref-Parsing für Videogenerierung |
    | `plugin-sdk/webhook-targets` | Registry für Webhook-Ziele und Hilfsfunktionen zur Routeninstallation |
    | `plugin-sdk/webhook-path` | Hilfsfunktionen zur Webhook-Pfadnormalisierung |
    | `plugin-sdk/web-media` | Gemeinsame Hilfsfunktionen zum Laden von Remote-/lokalen Medien |
    | `plugin-sdk/zod` | Re-exportiertes `zod` für Konsumenten des Plugin-SDK |
    | `plugin-sdk/testing` | Breites Kompatibilitäts-Barrel für Legacy-Plugin-Tests. Neue Erweiterungstests sollten stattdessen fokussierte SDK-Unterpfade wie `plugin-sdk/agent-runtime-test-contracts`, `plugin-sdk/plugin-test-runtime`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/test-env` oder `plugin-sdk/test-fixtures` importieren |
    | `plugin-sdk/plugin-test-api` | Minimale Hilfsfunktion `createTestPluginApi` für direkte Unit-Tests der Plugin-Registrierung, ohne Repo-Test-Helper-Bridges zu importieren |
    | `plugin-sdk/agent-runtime-test-contracts` | Native Contract-Fixtures für Agent-Runtime-Adapter für Auth-, Zustellungs-, Fallback-, Tool-Hook-, Prompt-Overlay-, Schema- und Transcript-Projektionstests |
    | `plugin-sdk/channel-test-helpers` | Kanalorientierte Test-Hilfsfunktionen für generische Action-/Setup-/Status-Contracts, Verzeichnis-Assertions, Konto-Startup-Lebenszyklus, Send-Config-Threading, Runtime-Mocks, Statusprobleme, ausgehende Zustellung und Hook-Registrierung |
    | `plugin-sdk/channel-target-testing` | Gemeinsame Suite für Fehlerfälle der Zielauflösung in Kanaltests |
    | `plugin-sdk/plugin-test-contracts` | Hilfsfunktionen für Contracts zu Plugin-Paket, Registrierung, öffentlichen Artefakten, direktem Import, Runtime-API und Import-Nebeneffekten |
    | `plugin-sdk/provider-test-contracts` | Hilfsfunktionen für Contracts zu Provider-Runtime, Auth, Discovery, Onboarding, Katalog, Wizard, Medien-Capability, Replay-Richtlinie, Echtzeit-STT-Live-Audio, Web-Suche/-Abruf und Stream |
    | `plugin-sdk/provider-http-test-mocks` | Opt-in-Vitest-HTTP-/Auth-Mocks für Provider-Tests, die `plugin-sdk/provider-http` ausüben |
    | `plugin-sdk/test-fixtures` | Generische Fixtures für CLI-Runtime-Erfassung, Sandbox-Kontext, Skill-Writer, Agent-Message, System-Event, Modul-Reload, gebündelten Plugin-Pfad, Terminal-Text, Chunking, Auth-Token und typisierte Fälle |
    | `plugin-sdk/test-node-mocks` | Fokussierte Mock-Hilfsfunktionen für eingebaute Node-Module zur Verwendung in Vitest-Factorys `vi.mock("node:*")` |
  </Accordion>

  <Accordion title="Memory-Unterpfade">
    | Unterpfad | Zentrale Exporte |
    | --- | --- |
    | `plugin-sdk/memory-core` | Gebündelte memory-core-Hilfsoberfläche für Manager-/Config-/Datei-/CLI-Hilfsfunktionen |
    | `plugin-sdk/memory-core-engine-runtime` | Runtime-Fassade für Memory-Index/-Suche |
    | `plugin-sdk/memory-core-host-engine-foundation` | Exporte der Memory-Host-Foundation-Engine |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Memory-Host-Embedding-Contracts, Registry-Zugriff, lokaler Provider und generische Batch-/Remote-Hilfsfunktionen |
    | `plugin-sdk/memory-core-host-engine-qmd` | Exporte der Memory-Host-QMD-Engine |
    | `plugin-sdk/memory-core-host-engine-storage` | Exporte der Memory-Host-Storage-Engine |
    | `plugin-sdk/memory-core-host-multimodal` | Multimodale Memory-Host-Hilfsfunktionen |
    | `plugin-sdk/memory-core-host-query` | Memory-Host-Query-Hilfsfunktionen |
    | `plugin-sdk/memory-core-host-secret` | Memory-Host-Secret-Hilfsfunktionen |
    | `plugin-sdk/memory-core-host-events` | Hilfsfunktionen für das Memory-Host-Ereignisjournal |
    | `plugin-sdk/memory-core-host-status` | Memory-Host-Status-Hilfsfunktionen |
    | `plugin-sdk/memory-core-host-runtime-cli` | Memory-Host-CLI-Runtime-Hilfsfunktionen |
    | `plugin-sdk/memory-core-host-runtime-core` | Memory-Host-Core-Runtime-Hilfsfunktionen |
    | `plugin-sdk/memory-core-host-runtime-files` | Memory-Host-Datei-/Runtime-Hilfsfunktionen |
    | `plugin-sdk/memory-host-core` | Anbieterneutraler Alias für Memory-Host-Core-Runtime-Hilfsfunktionen |
    | `plugin-sdk/memory-host-events` | Anbieterneutraler Alias für Hilfsfunktionen des Memory-Host-Ereignisjournals |
    | `plugin-sdk/memory-host-files` | Anbieterneutraler Alias für Memory-Host-Datei-/Runtime-Hilfsfunktionen |
    | `plugin-sdk/memory-host-markdown` | Gemeinsame Managed-Markdown-Hilfsfunktionen für speichernahe Plugins |
    | `plugin-sdk/memory-host-search` | Active-Memory-Runtime-Fassade für Search-Manager-Zugriff |
    | `plugin-sdk/memory-host-status` | Anbieterneutraler Alias für Memory-Host-Status-Hilfsfunktionen |
  </Accordion>

  <Accordion title="Reservierte Unterpfade für gebündelte Hilfsfunktionen">
    Derzeit gibt es keine reservierten SDK-Unterpfade für gebündelte Hilfsfunktionen. Owner-spezifische
    Hilfsfunktionen liegen im jeweiligen Plugin-Paket, während wiederverwendbare Host-Contracts
    generische SDK-Unterpfade wie `plugin-sdk/gateway-runtime`,
    `plugin-sdk/security-runtime` und `plugin-sdk/plugin-config-runtime` verwenden.
  </Accordion>
</AccordionGroup>

## Verwandte Themen

- [Plugin-SDK-Übersicht](/de/plugins/sdk-overview)
- [Plugin-SDK-Einrichtung](/de/plugins/sdk-setup)
- [Plugins erstellen](/de/plugins/building-plugins)
