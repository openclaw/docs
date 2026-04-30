---
read_when:
    - Den richtigen plugin-sdk-Unterpfad für einen Plugin-Import auswählen
    - Überprüfung von Unterpfaden gebündelter Plugins und Hilfsoberflächen
summary: 'Plugin-SDK-Unterpfadkatalog: welche Importe wo liegen, nach Bereich gruppiert'
title: Plugin-SDK-Unterpfade
x-i18n:
    generated_at: "2026-04-30T07:08:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6a8c431c1835fff6720a00984171e3f55886363654074d81859f50ca28a35104
    source_path: plugins/sdk-subpaths.md
    workflow: 16
---

  Das Plugin SDK wird als Satz enger Unterpfade unter `openclaw/plugin-sdk/` bereitgestellt.
  Diese Seite katalogisiert die häufig verwendeten Unterpfade, gruppiert nach Zweck. Die generierte
  vollständige Liste mit über 200 Unterpfaden befindet sich in `scripts/lib/plugin-sdk-entrypoints.json`;
  reservierte Hilfs-Unterpfade für gebündelte Plugins erscheinen dort, sind aber Implementierungsdetails,
  sofern sie nicht ausdrücklich auf einer Dokumentationsseite freigegeben werden. Maintainer können aktive
  reservierte Hilfs-Unterpfade mit `pnpm plugins:boundary-report:summary` prüfen; ungenutzte
  reservierte Hilfsexporte lassen den CI-Bericht fehlschlagen, statt als ruhende Kompatibilitätsschuld
  im öffentlichen SDK zu verbleiben.

  Den Leitfaden zum Erstellen von Plugins finden Sie unter [Plugin SDK overview](/de/plugins/sdk-overview).

  ## Plugin-Einstieg

  | Unterpfad                                 | Wichtige Exporte                                                                                                                                                             |
  | ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
  | `plugin-sdk/plugin-entry`                 | `definePluginEntry`                                                                                                                                                          |
  | `plugin-sdk/core`                         | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema`                                       |
  | `plugin-sdk/config-schema`                | `OpenClawSchema`                                                                                                                                                             |
  | `plugin-sdk/provider-entry`               | `defineSingleProviderPluginEntry`                                                                                                                                            |
  | `plugin-sdk/testing`                      | Breites Kompatibilitäts-Barrel für ältere Plugin-Tests; bevorzugen Sie fokussierte Test-Unterpfade für neue Extension-Tests                                                  |
  | `plugin-sdk/plugin-test-api`              | Minimaler `OpenClawPluginApi`-Mock-Builder für direkte Unit-Tests der Plugin-Registrierung                                                                                    |
  | `plugin-sdk/agent-runtime-test-contracts` | Native Contract-Fixtures für Agent-Runtime-Adapter für Authentifizierungsprofile, Unterdrückung der Zustellung, Fallback-Klassifizierung, Tool-Hooks, Prompt-Overlays, Schemas und Transcript-Reparatur |
  | `plugin-sdk/channel-test-helpers`         | Testhelfer für Channel-Kontolebenszyklus, Verzeichnis, Sendekonfiguration, Runtime-Mock, Hook, gebündelten Channel-Einstieg, Envelope-Zeitstempel, Pairing-Antwort und generische Channel-Contracts |
  | `plugin-sdk/channel-target-testing`       | Gemeinsame Testsuite für Fehlerfälle bei der Channel-Zielauflösung                                                                                                           |
  | `plugin-sdk/plugin-test-contracts`        | Contract-Helfer für Plugin-Registrierung, Paketmanifest, öffentliches Artefakt, Runtime-API, Import-Nebeneffekte und direkte Importe                                        |
  | `plugin-sdk/plugin-test-runtime`          | Fixtures für Tests zu Plugin-Runtime, Registry, Provider-Registrierung, Setup-Assistent und Runtime-TaskFlow                                                                 |
  | `plugin-sdk/provider-test-contracts`      | Contract-Helfer für Provider-Runtime, Authentifizierung, Discovery, Onboarding, Katalog, Medienfähigkeit, Replay-Richtlinie, Realtime-STT-Live-Audio, Websuche/-Abruf und Assistent |
  | `plugin-sdk/provider-http-test-mocks`     | Optionale Vitest-HTTP-/Auth-Mocks für Provider-Tests, die `plugin-sdk/provider-http` ausführen                                                                               |
  | `plugin-sdk/test-env`                     | Fixtures für Testumgebung, Fetch/Netzwerk, verwaltbaren HTTP-Server, eingehende Anfrage, Live-Test, temporäres Dateisystem und Zeitsteuerung                                |
  | `plugin-sdk/test-fixtures`                | Generische Test-Fixtures für CLI, Sandbox, Skill, Agent-Nachricht, Systemereignis, Modul-Neuladen, gebündelten Plugin-Pfad, Terminal, Chunking, Auth-Token und typisierte Fälle |
  | `plugin-sdk/test-node-mocks`              | Fokussierte Mock-Helfer für eingebaute Node-Module zur Verwendung in Vitest-`vi.mock("node:*")`-Factories                                                                    |
  | `plugin-sdk/migration`                    | Hilfen für Migrations-Provider-Elemente wie `createMigrationItem`, Reason-Konstanten, Elementstatus-Marker, Redaktionshilfen und `summarizeMigrationItems`                   |
  | `plugin-sdk/migration-runtime`            | Runtime-Migrationshelfer wie `copyMigrationFileItem`, `withCachedMigrationConfigRuntime` und `writeMigrationReport`                                                          |

  <AccordionGroup>
  <Accordion title="Channel-Unterpfade">
    | Unterpfad | Wichtige Exporte |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | Root-`openclaw.json`-Zod-Schemaexport (`OpenClawSchema`) |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, plus `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | Gemeinsame Setup-Assistent-Helfer, Allowlist-Prompts, Setup-Status-Builder |
    | `plugin-sdk/setup-runtime` | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | `createEnvPatchedAccountSetupAdapter` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | Hilfen für Multi-Account-Konfiguration/Aktions-Gates, Default-Account-Fallback-Hilfen |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, Hilfen zur Normalisierung von Account-IDs |
    | `plugin-sdk/account-resolution` | Hilfen für Account-Suche und Default-Fallback |
    | `plugin-sdk/account-helpers` | Enge Hilfen für Account-Listen und Account-Aktionen |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | `createChannelReplyPipeline`, `resolveChannelSourceReplyDeliveryMode` |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
    | `plugin-sdk/channel-config-schema` | Gemeinsame Channel-Konfigurationsschema-Primitiven und generischer Builder |
    | `plugin-sdk/bundled-channel-config-schema` | Gebündelte OpenClaw-Channel-Konfigurationsschemas nur für gepflegte gebündelte Plugins |
    | `plugin-sdk/channel-config-schema-legacy` | Veralteter Kompatibilitätsalias für gebündelte Channel-Konfigurationsschemas |
    | `plugin-sdk/telegram-command-config` | Hilfen zur Normalisierung/Validierung benutzerdefinierter Telegram-Befehle mit Fallback auf gebündelten Contract |
    | `plugin-sdk/command-gating` | Enge Hilfen für Befehlsautorisierungs-Gates |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-lifecycle` | `createAccountStatusSink`, `createChannelRunQueue`, Hilfen für Lebenszyklus und Finalisierung von Draft-Streams |
    | `plugin-sdk/inbound-envelope` | Gemeinsame Hilfen für eingehende Routen und Envelope-Builder |
    | `plugin-sdk/inbound-reply-dispatch` | Gemeinsame Hilfen zum Aufzeichnen und Dispatchen eingehender Daten |
    | `plugin-sdk/messaging-targets` | Hilfen zum Parsen und Abgleichen von Zielen |
    | `plugin-sdk/outbound-media` | Gemeinsame Hilfen zum Laden ausgehender Medien |
    | `plugin-sdk/outbound-send-deps` | Leichtgewichtige Abhängigkeitsauflösung für ausgehendes Senden in Channel-Adaptern |
    | `plugin-sdk/outbound-runtime` | Hilfen für ausgehende Zustellung, Identität, Sendedelegat, Sitzung, Formatierung und Payload-Planung |
    | `plugin-sdk/poll-runtime` | Enge Hilfen zur Poll-Normalisierung |
    | `plugin-sdk/thread-bindings-runtime` | Thread-Binding-Lebenszyklus und Adapter-Hilfen |
    | `plugin-sdk/agent-media-payload` | Älterer Builder für Agent-Medien-Payloads |
    | `plugin-sdk/conversation-runtime` | Hilfen für Konversations-/Thread-Binding, Pairing und konfigurierte Bindings |
    | `plugin-sdk/runtime-config-snapshot` | Hilfsfunktion für Runtime-Konfigurations-Snapshots |
    | `plugin-sdk/runtime-group-policy` | Hilfen zur Runtime-Auflösung von Gruppenrichtlinien |
    | `plugin-sdk/channel-status` | Gemeinsame Hilfen für Channel-Status-Snapshots/-Zusammenfassungen |
    | `plugin-sdk/channel-config-primitives` | Enge Channel-Konfigurationsschema-Primitiven |
    | `plugin-sdk/channel-config-writes` | Hilfen zur Autorisierung von Channel-Konfigurationsschreibvorgängen |
    | `plugin-sdk/channel-plugin-common` | Gemeinsame Prelude-Exporte für Channel-Plugins |
    | `plugin-sdk/allowlist-config-edit` | Hilfen zum Bearbeiten/Lesen der Allowlist-Konfiguration |
    | `plugin-sdk/group-access` | Gemeinsame Hilfen für Gruppen-Zugriffsentscheidungen |
    | `plugin-sdk/direct-dm` | Gemeinsame Hilfen für Direct-DM-Authentifizierung/-Guards |
    | `plugin-sdk/discord` | Veraltete Discord-Kompatibilitätsfassade für das veröffentlichte `@openclaw/discord@2026.3.13` und nachverfolgte Owner-Kompatibilität; neue Plugins sollten generische Channel-SDK-Unterpfade verwenden |
    | `plugin-sdk/telegram-account` | Veraltete Telegram-Kompatibilitätsfassade für Account-Auflösung zur nachverfolgten Owner-Kompatibilität; neue Plugins sollten injizierte Runtime-Helfer oder generische Channel-SDK-Unterpfade verwenden |
    | `plugin-sdk/zalouser` | Veraltete Zalo-Personal-Kompatibilitätsfassade für veröffentlichte Lark-/Zalo-Pakete, die weiterhin Autorisierung für Sender-Befehle importieren; neue Plugins sollten `plugin-sdk/command-auth` verwenden |
    | `plugin-sdk/interactive-runtime` | Hilfen für semantische Nachrichtenpräsentation, Zustellung und ältere interaktive Antworten. Siehe [Message Presentation](/de/plugins/message-presentation) |
    | `plugin-sdk/channel-inbound` | Kompatibilitäts-Barrel für eingehende Entprellung, Erwähnungsabgleich, Erwähnungsrichtlinien-Hilfen und Envelope-Hilfen |
    | `plugin-sdk/channel-inbound-debounce` | Enge Hilfen für eingehende Entprellung |
    | `plugin-sdk/channel-mention-gating` | Enge Hilfen für Erwähnungsrichtlinien, Erwähnungsmarker und Erwähnungstext ohne die breitere eingehende Runtime-Oberfläche |
    | `plugin-sdk/channel-envelope` | Enge Hilfen zur Formatierung eingehender Envelopes |
    | `plugin-sdk/channel-location` | Hilfen für Channel-Ortskontext und Formatierung |
    | `plugin-sdk/channel-logging` | Channel-Logging-Hilfen für eingehend verworfene Nachrichten sowie Tipp-/Ack-Fehler |
    | `plugin-sdk/channel-send-result` | Antwort-Ergebnistypen |
    | `plugin-sdk/channel-actions` | Hilfen für Channel-Nachrichtenaktionen sowie veraltete native Schema-Hilfen, die für Plugin-Kompatibilität beibehalten werden |
    | `plugin-sdk/channel-route` | Gemeinsame Hilfen für Routennormalisierung, parsergestützte Zielauflösung, Thread-ID-Stringifizierung, Deduplizieren/Komprimieren von Routenschlüsseln, geparste Zieltypen sowie Routen-/Zielvergleich |
    | `plugin-sdk/channel-targets` | Hilfen zum Parsen von Zielen; Aufrufer für Routenvergleiche sollten `plugin-sdk/channel-route` verwenden |
    | `plugin-sdk/channel-contract` | Channel-Contract-Typen |
    | `plugin-sdk/channel-feedback` | Feedback-/Reaktionsverdrahtung |
    | `plugin-sdk/channel-secret-runtime` | Enge Secret-Contract-Hilfen wie `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment` und Secret-Zieltypen |
  </Accordion>

  <Accordion title="Provider-Unterpfade">
    | Unterpfad | Wichtige Exporte |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/lmstudio` | Unterstützte LM Studio-Provider-Fassade für Einrichtung, Katalogerkennung und Vorbereitung von Runtime-Modellen |
    | `plugin-sdk/lmstudio-runtime` | Unterstützte LM Studio-Runtime-Fassade für lokale Server-Standardwerte, Modellerkennung, Request-Header und Hilfsfunktionen für geladene Modelle |
    | `plugin-sdk/provider-setup` | Kuratierte Hilfsfunktionen für die Einrichtung lokaler/selbst gehosteter Provider |
    | `plugin-sdk/self-hosted-provider-setup` | Fokussierte Hilfsfunktionen für die Einrichtung OpenAI-kompatibler selbst gehosteter Provider |
    | `plugin-sdk/cli-backend` | CLI-Backend-Standardwerte + Watchdog-Konstanten |
    | `plugin-sdk/provider-auth-runtime` | Runtime-Hilfsfunktionen zur API-Key-Auflösung für Provider-Plugins |
    | `plugin-sdk/provider-auth-api-key` | Hilfsfunktionen für API-Key-Onboarding und Profilschreiben wie `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | Standardmäßiger Builder für OAuth-Authentifizierungsergebnisse |
    | `plugin-sdk/provider-auth-login` | Gemeinsame interaktive Login-Hilfsfunktionen für Provider-Plugins |
    | `plugin-sdk/provider-env-vars` | Hilfsfunktionen zum Nachschlagen von Provider-Authentifizierungs-Umgebungsvariablen |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, gemeinsame Replay-Policy-Builder, Hilfsfunktionen für Provider-Endpunkte und Hilfsfunktionen zur Modell-ID-Normalisierung wie `normalizeNativeXaiModelId` |
    | `plugin-sdk/provider-catalog-runtime` | Runtime-Hook zur Provider-Katalogerweiterung und Registry-Schnittstellen für Plugin-Provider für Vertragstests |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | Generische Hilfsfunktionen für Provider-HTTP-/Endpunkt-Capabilities, Provider-HTTP-Fehler und Multipart-Formular-Hilfsfunktionen für Audiotranskription |
    | `plugin-sdk/provider-web-fetch-contract` | Schmale Hilfsfunktionen für Web-Fetch-Konfiguration/-Auswahlverträge wie `enablePluginInConfig` und `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | Hilfsfunktionen für Web-Fetch-Provider-Registrierung/-Cache |
    | `plugin-sdk/provider-web-search-config-contract` | Schmale Hilfsfunktionen für Web-Search-Konfiguration/-Credentials für Provider, die keine Plugin-Aktivierungsverdrahtung benötigen |
    | `plugin-sdk/provider-web-search-contract` | Schmale Hilfsfunktionen für Web-Search-Konfigurations-/Credential-Verträge wie `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` und bereichsgebundene Credential-Setter/-Getter |
    | `plugin-sdk/provider-web-search` | Hilfsfunktionen für Web-Search-Provider-Registrierung/-Cache/-Runtime |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, Gemini-Schema-Bereinigung + Diagnose und xAI-Kompatibilitäts-Hilfsfunktionen wie `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
    | `plugin-sdk/provider-usage` | `fetchClaudeUsage` und Ähnliches |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, Stream-Wrapper-Typen und gemeinsame Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot-Wrapper-Hilfsfunktionen |
    | `plugin-sdk/provider-transport-runtime` | Native Provider-Transport-Hilfsfunktionen wie geschütztes Fetch, Transport-Nachrichtentransformationen und beschreibbare Transport-Event-Streams |
    | `plugin-sdk/provider-onboard` | Hilfsfunktionen für Onboarding-Konfigurations-Patches |
    | `plugin-sdk/global-singleton` | Prozesslokale Singleton-/Map-/Cache-Hilfsfunktionen |
    | `plugin-sdk/group-activation` | Schmale Hilfsfunktionen für Gruppenaktivierungsmodus und Befehlsparsing |
  </Accordion>

  <Accordion title="Auth- und Sicherheits-Unterpfade">
    | Unterpfad | Wichtige Exporte |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, Befehlsregistrierungs-Hilfsfunktionen einschließlich dynamischer Argumentmenü-Formatierung, Hilfsfunktionen zur Senderautorisierung |
    | `plugin-sdk/command-status` | Builder für Befehls-/Hilfenachrichten wie `buildCommandsMessagePaginated` und `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | Hilfsfunktionen für Genehmigerauflösung und Aktionsauthentifizierung im selben Chat |
    | `plugin-sdk/approval-client-runtime` | Hilfsfunktionen für native Exec-Genehmigungsprofile/-Filter |
    | `plugin-sdk/approval-delivery-runtime` | Native Adapter für Genehmigungs-Capabilities/-Zustellung |
    | `plugin-sdk/approval-gateway-runtime` | Gemeinsame Hilfsfunktion zur Genehmigungs-Gateway-Auflösung |
    | `plugin-sdk/approval-handler-adapter-runtime` | Leichtgewichtige Hilfsfunktionen zum Laden nativer Genehmigungsadapter für Hot-Channel-Einstiegspunkte |
    | `plugin-sdk/approval-handler-runtime` | Breitere Runtime-Hilfsfunktionen für Genehmigungs-Handler; bevorzugen Sie die schmaleren Adapter-/Gateway-Schnittstellen, wenn sie ausreichen |
    | `plugin-sdk/approval-native-runtime` | Native Hilfsfunktionen für Genehmigungsziel + Kontobindung |
    | `plugin-sdk/approval-reply-runtime` | Hilfsfunktionen für Exec-/Plugin-Genehmigungsantwort-Payloads |
    | `plugin-sdk/approval-runtime` | Hilfsfunktionen für Exec-/Plugin-Genehmigungs-Payloads, native Genehmigungsrouting-/Runtime-Hilfsfunktionen und strukturierte Hilfsfunktionen zur Genehmigungsanzeige wie `formatApprovalDisplayPath` |
    | `plugin-sdk/reply-dedupe` | Schmale Hilfsfunktionen zum Zurücksetzen der Deduplizierung eingehender Antworten |
    | `plugin-sdk/channel-contract-testing` | Schmale Hilfsfunktionen für Channel-Vertragstests ohne das breite Testing-Barrel |
    | `plugin-sdk/command-auth-native` | Native Befehlsauthentifizierung, dynamische Argumentmenü-Formatierung und native Hilfsfunktionen für Sitzungsziele |
    | `plugin-sdk/command-detection` | Gemeinsame Hilfsfunktionen zur Befehlserkennung |
    | `plugin-sdk/command-primitives-runtime` | Leichtgewichtige Prädikate für Befehlstext für Hot-Channel-Pfade |
    | `plugin-sdk/command-surface` | Hilfsfunktionen für Befehls-Body-Normalisierung und Befehlsoberflächen |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | Schmale Hilfsfunktionen zur Secret-Contract-Sammlung für Channel-/Plugin-Secret-Oberflächen |
    | `plugin-sdk/secret-ref-runtime` | Schmale `coerceSecretRef`- und SecretRef-Typing-Hilfsfunktionen für Secret-Contract-/Konfigurationsparsing |
    | `plugin-sdk/security-runtime` | Gemeinsame Hilfsfunktionen für Vertrauen, DM-Gating, externe Inhalte, Redaktion sensibler Texte, Secret-Vergleich in konstanter Zeit und Secret-Sammlung |
    | `plugin-sdk/ssrf-policy` | Hilfsfunktionen für Host-Allowlist und SSRF-Richtlinien für private Netzwerke |
    | `plugin-sdk/ssrf-dispatcher` | Schmale Hilfsfunktionen für gepinnte Dispatcher ohne die breite Infra-Runtime-Oberfläche |
    | `plugin-sdk/ssrf-runtime` | Gepinnte Dispatcher, SSRF-geschütztes Fetch, SSRF-Fehler und SSRF-Richtlinien-Hilfsfunktionen |
    | `plugin-sdk/secret-input` | Hilfsfunktionen zum Parsen von Secret-Eingaben |
    | `plugin-sdk/webhook-ingress` | Hilfsfunktionen für Webhook-Requests/-Ziele und Roh-Websocket-/Body-Koerzierung |
    | `plugin-sdk/webhook-request-guards` | Hilfsfunktionen für Request-Body-Größe/-Timeout |
  </Accordion>

  <Accordion title="Runtime- und Speicher-Unterpfade">
    | Unterpfad | Wichtige Exporte |
    | --- | --- |
    | `plugin-sdk/runtime` | Breite Runtime-/Logging-/Backup-/Plugin-Installationshelfer |
    | `plugin-sdk/runtime-env` | Schmale Helfer für Runtime-Umgebung, Logger, Timeout, Wiederholung und Backoff |
    | `plugin-sdk/browser-config` | Unterstützte Browser-Konfigurationsfassade für normalisierte Profile/Standardeinstellungen, CDP-URL-Parsing und Auth-Helfer für Browser-Steuerung |
    | `plugin-sdk/channel-runtime-context` | Generische Helfer für Registrierung und Suche des Channel-Runtime-Kontexts |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Gemeinsame Helfer für Plugin-Befehle, Hooks, HTTP und interaktive Abläufe |
    | `plugin-sdk/hook-runtime` | Gemeinsame Helfer für Webhook-/interne Hook-Pipelines |
    | `plugin-sdk/lazy-runtime` | Helfer für Lazy-Runtime-Importe/-Bindings wie `createLazyRuntimeModule`, `createLazyRuntimeMethod` und `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | Helfer für Prozessausführung |
    | `plugin-sdk/cli-runtime` | Helfer für CLI-Formatierung, Warten, Version, Argumentaufruf und Lazy-Befehlsgruppen |
    | `plugin-sdk/gateway-runtime` | Gateway-Client, Starthelfer für event-loop-bereiten Client, Gateway-CLI-RPC, Gateway-Protokollfehler und Helfer für Channel-Status-Patches |
    | `plugin-sdk/config-types` | Reine Typ-Konfigurationsoberfläche für Plugin-Konfigurationsformen wie `OpenClawConfig` und Channel-/Provider-Konfigurationstypen |
    | `plugin-sdk/plugin-config-runtime` | Runtime-Helfer zum Nachschlagen von Plugin-Konfigurationen wie `requireRuntimeConfig`, `resolvePluginConfigObject` und `resolveLivePluginConfigObject` |
    | `plugin-sdk/config-mutation` | Transaktionale Helfer für Konfigurationsänderungen wie `mutateConfigFile`, `replaceConfigFile` und `logConfigUpdated` |
    | `plugin-sdk/runtime-config-snapshot` | Helfer für Snapshots der aktuellen Prozesskonfiguration wie `getRuntimeConfig`, `getRuntimeConfigSnapshot` und Test-Snapshot-Setter |
    | `plugin-sdk/telegram-command-config` | Normalisierung von Telegram-Befehlsnamen/-beschreibungen und Prüfungen auf Duplikate/Konflikte, auch wenn die gebündelte Telegram-Vertragsoberfläche nicht verfügbar ist |
    | `plugin-sdk/text-autolink-runtime` | Erkennung von Datei-Referenz-Autolinks ohne das breite text-runtime-Barrel |
    | `plugin-sdk/approval-runtime` | Helfer für Exec-/Plugin-Genehmigungen, Approval-Capability-Builder, Auth-/Profilhelfer, native Routing-/Runtime-Helfer und Formatierung strukturierter Genehmigungs-Anzeigepfade |
    | `plugin-sdk/reply-runtime` | Gemeinsame Runtime-Helfer für Eingang/Antwort, Chunking, Dispatch, Heartbeat, Antwortplaner |
    | `plugin-sdk/reply-dispatch-runtime` | Schmale Helfer für Antwort-Dispatch/-Finalisierung und Konversationslabels |
    | `plugin-sdk/reply-history` | Gemeinsame Helfer und Marker für Antwortverlauf in kurzen Fenstern wie `buildHistoryContext`, `HISTORY_CONTEXT_MARKER`, `recordPendingHistoryEntry` und `clearHistoryEntriesIfEnabled` |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | Schmale Helfer für Text-/Markdown-Chunking |
    | `plugin-sdk/session-store-runtime` | Helfer für Sitzungsspeicherpfad, Sitzungsschlüssel, Aktualisiert-am und Speicheränderungen |
    | `plugin-sdk/cron-store-runtime` | Helfer für Cron-Speicherpfad/Laden/Speichern |
    | `plugin-sdk/state-paths` | Helfer für State-/OAuth-Verzeichnispfade |
    | `plugin-sdk/routing` | Helfer für Routen-/Sitzungsschlüssel-/Account-Bindings wie `resolveAgentRoute`, `buildAgentSessionKey` und `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | Gemeinsame Helfer für Channel-/Account-Statuszusammenfassungen, Runtime-State-Standardeinstellungen und Issue-Metadaten |
    | `plugin-sdk/target-resolver-runtime` | Gemeinsame Helfer für Zielauflösung |
    | `plugin-sdk/string-normalization-runtime` | Helfer für Slug-/String-Normalisierung |
    | `plugin-sdk/request-url` | String-URLs aus fetch-/request-ähnlichen Eingaben extrahieren |
    | `plugin-sdk/run-command` | Zeitbegrenzter Befehlsrunner mit normalisierten stdout-/stderr-Ergebnissen |
    | `plugin-sdk/param-readers` | Gemeinsame Tool-/CLI-Parameterleser |
    | `plugin-sdk/tool-payload` | Normalisierte Payloads aus Tool-Ergebnisobjekten extrahieren |
    | `plugin-sdk/tool-send` | Kanonische Ziel-Felder für das Senden aus Tool-Argumenten extrahieren |
    | `plugin-sdk/temp-path` | Gemeinsame Helfer für temporäre Downloadpfade |
    | `plugin-sdk/logging-core` | Helfer für Subsystem-Logger und Redaction |
    | `plugin-sdk/markdown-table-runtime` | Helfer für Markdown-Tabellenmodus und Konvertierung |
    | `plugin-sdk/model-session-runtime` | Helfer für Modell-/Sitzungsüberschreibungen wie `applyModelOverrideToSessionEntry` und `resolveAgentMaxConcurrent` |
    | `plugin-sdk/talk-config-runtime` | Helfer zur Auflösung der Talk-Provider-Konfiguration |
    | `plugin-sdk/json-store` | Kleine Helfer zum Lesen/Schreiben von JSON-State |
    | `plugin-sdk/file-lock` | Wiedereintrittsfähige File-Lock-Helfer |
    | `plugin-sdk/persistent-dedupe` | Festplattengestützte Dedupe-Cache-Helfer |
    | `plugin-sdk/acp-runtime` | ACP-Runtime-/Sitzungs- und Antwort-Dispatch-Helfer |
    | `plugin-sdk/acp-runtime-backend` | Leichtgewichtige ACP-Backend-Registrierungs- und Antwort-Dispatch-Helfer für beim Start geladene Plugins |
    | `plugin-sdk/acp-binding-resolve-runtime` | Schreibgeschützte ACP-Binding-Auflösung ohne Lifecycle-Startup-Importe |
    | `plugin-sdk/agent-config-primitives` | Schmale Primitive für Agent-Runtime-Konfigurationsschemas |
    | `plugin-sdk/boolean-param` | Lockerer boolescher Parameterleser |
    | `plugin-sdk/dangerous-name-runtime` | Helfer zur Auflösung gefährlicher Namensübereinstimmungen |
    | `plugin-sdk/device-bootstrap` | Helfer für Geräte-Bootstrap und Pairing-Token |
    | `plugin-sdk/extension-shared` | Gemeinsame Primitive für passive Channels, Status und Umgebungsproxy-Helfer |
    | `plugin-sdk/models-provider-runtime` | Helfer für `/models`-Befehl/Provider-Antwort |
    | `plugin-sdk/skill-commands-runtime` | Helfer zum Auflisten von Skill-Befehlen |
    | `plugin-sdk/native-command-registry` | Helfer für native Befehlsregistrierung/-Build/-Serialisierung |
    | `plugin-sdk/agent-harness` | Experimentelle Oberfläche für vertrauenswürdige Plugins und Low-Level-Agent-Harnesses: Harness-Typen, Helfer für Active-Run-Steuerung/-Abbruch, OpenClaw-Tool-Bridge-Helfer, Helfer für Runtime-Plan-Tool-Richtlinien, Klassifizierung von Terminalergebnissen, Helfer für Tool-Fortschrittsformatierung/-details und Hilfsfunktionen für Versuchsergebnisse |
    | `plugin-sdk/provider-zai-endpoint` | Helfer zur Erkennung von Z.AI-Endpunkten |
    | `plugin-sdk/async-lock-runtime` | Prozesslokaler Async-Lock-Helfer für kleine Runtime-State-Dateien |
    | `plugin-sdk/channel-activity-runtime` | Helfer für Channel-Aktivitätstelemetrie |
    | `plugin-sdk/concurrency-runtime` | Helfer für begrenzte Parallelität asynchroner Aufgaben |
    | `plugin-sdk/dedupe-runtime` | In-Memory-Dedupe-Cache-Helfer |
    | `plugin-sdk/delivery-queue-runtime` | Helfer zum Leeren ausstehender ausgehender Zustellungen |
    | `plugin-sdk/file-access-runtime` | Helfer für sichere lokale Dateien und Mediensource-Pfade |
    | `plugin-sdk/heartbeat-runtime` | Helfer für Heartbeat-Ereignisse und Sichtbarkeit |
    | `plugin-sdk/number-runtime` | Helfer für numerische Koercion |
    | `plugin-sdk/secure-random-runtime` | Helfer für sichere Token/UUIDs |
    | `plugin-sdk/system-event-runtime` | Helfer für Systemereignis-Warteschlangen |
    | `plugin-sdk/transport-ready-runtime` | Helfer zum Warten auf Transportbereitschaft |
    | `plugin-sdk/infra-runtime` | Veralteter Kompatibilitäts-Shim; verwenden Sie die fokussierten Runtime-Unterpfade oben |
    | `plugin-sdk/collection-runtime` | Kleine Helfer für begrenzte Caches |
    | `plugin-sdk/diagnostic-runtime` | Helfer für Diagnose-Flags, Ereignisse und Trace-Kontext |
    | `plugin-sdk/error-runtime` | Fehlergraph, Formatierung, gemeinsame Helfer zur Fehlerklassifizierung, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | Umhülltes fetch, Proxy, EnvHttpProxyAgent-Option und Helfer für gepinnte Lookups |
    | `plugin-sdk/runtime-fetch` | Dispatcher-bewusstes Runtime-fetch ohne Proxy-/guarded-fetch-Importe |
    | `plugin-sdk/response-limit-runtime` | Begrenzter Response-Body-Reader ohne die breite Media-Runtime-Oberfläche |
    | `plugin-sdk/session-binding-runtime` | Aktueller Konversations-Binding-State ohne konfigurierte Binding-Routing- oder Pairing-Speicher |
    | `plugin-sdk/session-store-runtime` | Sitzungsspeicher-Helfer ohne breite Konfigurationsschreib-/Wartungsimporte |
    | `plugin-sdk/context-visibility-runtime` | Auflösung der Kontextsichtbarkeit und Filterung ergänzender Kontexte ohne breite Konfigurations-/Sicherheitsimporte |
    | `plugin-sdk/string-coerce-runtime` | Schmale Helfer für primitive Record-/String-Koercion und Normalisierung ohne Markdown-/Logging-Importe |
    | `plugin-sdk/host-runtime` | Helfer für Hostnamen- und SCP-Host-Normalisierung |
    | `plugin-sdk/retry-runtime` | Helfer für Wiederholungskonfiguration und Wiederholungsrunner |
    | `plugin-sdk/agent-runtime` | Helfer für Agent-Verzeichnis/Identität/Workspace |
    | `plugin-sdk/directory-runtime` | Konfigurationsgestützte Verzeichnisabfrage/-Deduplizierung |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Funktions- und Test-Unterpfade">
    | Unterpfad | Wichtige Exporte |
    | --- | --- |
    | `plugin-sdk/media-runtime` | Gemeinsame Hilfsfunktionen zum Abrufen, Transformieren und Speichern von Medien, ffprobe-gestützte Ermittlung von Videodimensionen und Builder für Medien-Payloads |
    | `plugin-sdk/media-store` | Schlanke Hilfsfunktionen für den Medienspeicher wie `saveMediaBuffer` |
    | `plugin-sdk/media-generation-runtime` | Gemeinsame Hilfsfunktionen für Failover bei der Mediengenerierung, Kandidatenauswahl und Meldungen zu fehlenden Modellen |
    | `plugin-sdk/media-understanding` | Provider-Typen für Medienverständnis sowie bild-/audio-bezogene Hilfsexporte für Provider |
    | `plugin-sdk/text-runtime` | Gemeinsame Hilfsfunktionen für Text/Markdown/Logging wie das Entfernen von für Assistenten sichtbarem Text, Markdown-Rendering/-Chunking-/Tabellen-Hilfen, Redaktionshilfen, Directive-Tag-Hilfen und Safe-Text-Utilities |
    | `plugin-sdk/text-chunking` | Hilfsfunktion für ausgehendes Text-Chunking |
    | `plugin-sdk/speech` | Speech-Provider-Typen sowie Provider-seitige Exporte für Direktiven, Registry, Validierung, OpenAI-kompatiblen TTS-Builder und Speech-Hilfsfunktionen |
    | `plugin-sdk/speech-core` | Gemeinsame Speech-Provider-Typen, Registry, Direktiven, Normalisierung und Exporte für Speech-Hilfsfunktionen |
    | `plugin-sdk/realtime-transcription` | Provider-Typen für Echtzeittranskription, Registry-Hilfsfunktionen und gemeinsame WebSocket-Sitzungshilfe |
    | `plugin-sdk/realtime-voice` | Provider-Typen für Echtzeitstimme und Registry-Hilfsfunktionen |
    | `plugin-sdk/image-generation` | Provider-Typen für Bildgenerierung sowie Hilfsfunktionen für Bild-Assets/Daten-URLs und der OpenAI-kompatible Bild-Provider-Builder |
    | `plugin-sdk/image-generation-core` | Gemeinsame Bildgenerierungs-Typen, Failover-, Auth- und Registry-Hilfsfunktionen |
    | `plugin-sdk/music-generation` | Provider-/Anfrage-/Ergebnistypen für Musikgenerierung |
    | `plugin-sdk/music-generation-core` | Gemeinsame Musikgenerierungs-Typen, Failover-Hilfsfunktionen, Provider-Suche und Model-Ref-Parsing |
    | `plugin-sdk/video-generation` | Provider-/Anfrage-/Ergebnistypen für Videogenerierung |
    | `plugin-sdk/video-generation-core` | Gemeinsame Videogenerierungs-Typen, Failover-Hilfsfunktionen, Provider-Suche und Model-Ref-Parsing |
    | `plugin-sdk/webhook-targets` | Webhook-Ziel-Registry und Hilfsfunktionen zur Routeninstallation |
    | `plugin-sdk/webhook-path` | Hilfsfunktionen zur Webhook-Pfadnormalisierung |
    | `plugin-sdk/web-media` | Gemeinsame Hilfsfunktionen zum Laden von Remote-/lokalen Medien |
    | `plugin-sdk/zod` | Re-exportiertes `zod` für Konsumenten des Plugin SDK |
    | `plugin-sdk/testing` | Breites Kompatibilitäts-Barrel für Legacy-Plugin-Tests. Neue Erweiterungstests sollten stattdessen fokussierte SDK-Unterpfade wie `plugin-sdk/agent-runtime-test-contracts`, `plugin-sdk/plugin-test-runtime`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/test-env` oder `plugin-sdk/test-fixtures` importieren |
    | `plugin-sdk/plugin-test-api` | Minimale `createTestPluginApi`-Hilfsfunktion für direkte Unit-Tests zur Plugin-Registrierung ohne Import von Repo-Test-Helper-Bridges |
    | `plugin-sdk/agent-runtime-test-contracts` | Native Contract-Fixtures für Agent-Runtime-Adapter für Tests zu Auth, Zustellung, Fallback, Tool-Hook, Prompt-Overlay, Schema und Transcript-Projektion |
    | `plugin-sdk/channel-test-helpers` | Channel-orientierte Testhilfen für generische Aktions-/Setup-/Status-Contracts, Verzeichnis-Assertions, Account-Startlebenszyklus, Send-Config-Threading, Runtime-Mocks, Statusprobleme, ausgehende Zustellung und Hook-Registrierung |
    | `plugin-sdk/channel-target-testing` | Gemeinsame Suite für Fehlerfälle bei der Zielauflösung in Channel-Tests |
    | `plugin-sdk/plugin-test-contracts` | Contract-Hilfen für Plugin-Paket, Registrierung, öffentliche Artefakte, Direktimport, Runtime-API und Import-Nebeneffekte |
    | `plugin-sdk/provider-test-contracts` | Contract-Hilfen für Provider-Runtime, Auth, Discovery, Onboarding, Katalog, Assistent, Medienfunktionen, Replay-Richtlinie, Echtzeit-STT-Live-Audio, Websuche/-Abruf und Stream |
    | `plugin-sdk/provider-http-test-mocks` | Opt-in-Vitest-HTTP-/Auth-Mocks für Provider-Tests, die `plugin-sdk/provider-http` ausführen |
    | `plugin-sdk/test-fixtures` | Generische Fixtures für CLI-Runtime-Erfassung, Sandbox-Kontext, Skill-Writer, Agent-Nachricht, Systemereignis, Modul-Neuladen, gebündelten Plugin-Pfad, Terminaltext, Chunking, Auth-Token und typisierte Fälle |
    | `plugin-sdk/test-node-mocks` | Fokussierte Mock-Hilfsfunktionen für integrierte Node-Module zur Verwendung in Vitest-`vi.mock("node:*")`-Factories |
  </Accordion>

  <Accordion title="Speicher-Unterpfade">
    | Unterpfad | Wichtige Exporte |
    | --- | --- |
    | `plugin-sdk/memory-core` | Gebündelte Memory-Core-Hilfsoberfläche für Manager-/Config-/Datei-/CLI-Hilfen |
    | `plugin-sdk/memory-core-engine-runtime` | Runtime-Fassade für Speicherindex/-suche |
    | `plugin-sdk/memory-core-host-engine-foundation` | Engine-Exporte für Speicher-Host-Foundation |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Speicher-Host-Embedding-Contracts, Registry-Zugriff, lokaler Provider und generische Batch-/Remote-Hilfsfunktionen |
    | `plugin-sdk/memory-core-host-engine-qmd` | QMD-Engine-Exporte für Speicher-Host |
    | `plugin-sdk/memory-core-host-engine-storage` | Storage-Engine-Exporte für Speicher-Host |
    | `plugin-sdk/memory-core-host-multimodal` | Multimodale Hilfsfunktionen für Speicher-Host |
    | `plugin-sdk/memory-core-host-query` | Abfrage-Hilfsfunktionen für Speicher-Host |
    | `plugin-sdk/memory-core-host-secret` | Secret-Hilfsfunktionen für Speicher-Host |
    | `plugin-sdk/memory-core-host-events` | Event-Journal-Hilfsfunktionen für Speicher-Host |
    | `plugin-sdk/memory-core-host-status` | Status-Hilfsfunktionen für Speicher-Host |
    | `plugin-sdk/memory-core-host-runtime-cli` | CLI-Runtime-Hilfsfunktionen für Speicher-Host |
    | `plugin-sdk/memory-core-host-runtime-core` | Core-Runtime-Hilfsfunktionen für Speicher-Host |
    | `plugin-sdk/memory-core-host-runtime-files` | Datei-/Runtime-Hilfsfunktionen für Speicher-Host |
    | `plugin-sdk/memory-host-core` | Anbieterneutraler Alias für Core-Runtime-Hilfsfunktionen des Speicher-Hosts |
    | `plugin-sdk/memory-host-events` | Anbieterneutraler Alias für Event-Journal-Hilfsfunktionen des Speicher-Hosts |
    | `plugin-sdk/memory-host-files` | Anbieterneutraler Alias für Datei-/Runtime-Hilfsfunktionen des Speicher-Hosts |
    | `plugin-sdk/memory-host-markdown` | Gemeinsame Managed-Markdown-Hilfsfunktionen für speichernahe Plugins |
    | `plugin-sdk/memory-host-search` | Active Memory-Runtime-Fassade für Zugriff auf den Suchmanager |
    | `plugin-sdk/memory-host-status` | Anbieterneutraler Alias für Status-Hilfsfunktionen des Speicher-Hosts |
  </Accordion>

  <Accordion title="Reservierte gebündelte Hilfs-Unterpfade">
    Derzeit gibt es keine reservierten gebündelten Hilfs-SDK-Unterpfade. Owner-spezifische
    Hilfsfunktionen befinden sich im jeweiligen Plugin-Paket, während wiederverwendbare Host-Contracts
    generische SDK-Unterpfade wie `plugin-sdk/gateway-runtime`,
    `plugin-sdk/security-runtime` und `plugin-sdk/plugin-config-runtime` verwenden.
  </Accordion>
</AccordionGroup>

## Verwandt

- [Plugin SDK overview](/de/plugins/sdk-overview)
- [Plugin SDK setup](/de/plugins/sdk-setup)
- [Building plugins](/de/plugins/building-plugins)
