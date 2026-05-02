---
read_when:
    - Den richtigen plugin-sdk-Unterpfad für einen Plugin-Import auswählen
    - Prüfung gebündelter Plugin-Unterpfade und Hilfsschnittstellen
summary: 'Plugin-SDK-Subpfadkatalog: welche Importe wo liegen, nach Bereich gruppiert'
title: Plugin-SDK-Unterpfade
x-i18n:
    generated_at: "2026-05-02T21:01:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: bc0d2dcf030796d2c73d4d679b9f8d7f6a8aaf71c6b5232b60afbbb50f42b348
    source_path: plugins/sdk-subpaths.md
    workflow: 16
---

  The Plugin SDK wird als Satz schmaler Unterpfade unter `openclaw/plugin-sdk/` bereitgestellt.
  Diese Seite katalogisiert die häufig verwendeten Unterpfade nach Zweck gruppiert. Die generierte
  vollständige Liste mit über 200 Unterpfaden befindet sich in `scripts/lib/plugin-sdk-entrypoints.json`;
  reservierte Unterpfade für Hilfsfunktionen gebündelter Plugins erscheinen dort, sind aber
  Implementierungsdetail, sofern sie nicht ausdrücklich auf einer Dokumentationsseite hervorgehoben werden. Maintainer können aktive
  reservierte Unterpfade für Hilfsfunktionen mit `pnpm plugins:boundary-report:summary` prüfen; ungenutzte
  reservierte Hilfs-Exporte lassen den CI-Bericht fehlschlagen, statt als ruhende Kompatibilitätsschuld im öffentlichen SDK zu verbleiben.

  Den Leitfaden zur Plugin-Erstellung finden Sie in der [Plugin SDK-Übersicht](/de/plugins/sdk-overview).

  ## Plugin-Einstieg

  | Unterpfad                                 | Wichtige Exporte                                                                                                                                                             |
  | ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
  | `plugin-sdk/plugin-entry`                 | `definePluginEntry`                                                                                                                                                          |
  | `plugin-sdk/core`                         | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema`, `buildJsonChannelConfigSchema`       |
  | `plugin-sdk/config-schema`                | `OpenClawSchema`                                                                                                                                                             |
  | `plugin-sdk/provider-entry`               | `defineSingleProviderPluginEntry`                                                                                                                                            |
  | `plugin-sdk/testing`                      | Breites Kompatibilitäts-Barrel für ältere Plugin-Tests; bevorzugen Sie fokussierte Test-Unterpfade für neue Plugin-Tests                                                     |
  | `plugin-sdk/plugin-test-api`              | Minimaler Mock-Builder für `OpenClawPluginApi` für direkte Unit-Tests der Plugin-Registrierung                                                                                |
  | `plugin-sdk/agent-runtime-test-contracts` | Native Vertrags-Fixtures für Agent-Runtime-Adapter für Auth-Profile, Lieferunterdrückung, Fallback-Klassifizierung, Tool-Hooks, Prompt-Overlays, Schemas und Transcript-Reparatur |
  | `plugin-sdk/channel-test-helpers`         | Testhelfer für Channel-Konto-Lebenszyklus, Verzeichnis, Sendekonfiguration, Runtime-Mock, Hook, gebündelten Channel-Einstieg, Umschlag-Zeitstempel, Pairing-Antwort und generische Channel-Verträge |
  | `plugin-sdk/channel-target-testing`       | Gemeinsame Testsuite für Fehlerfälle der Channel-Zielauflösung                                                                                                                |
  | `plugin-sdk/plugin-test-contracts`        | Vertragshelfer für Plugin-Registrierung, Paketmanifest, öffentliches Artefakt, Runtime-API, Import-Nebeneffekt und direkten Import                                           |
  | `plugin-sdk/plugin-test-runtime`          | Fixtures für Plugin-Runtime, Registry, Provider-Registrierung, Setup-Assistent und Runtime-TaskFlow für Tests                                                                |
  | `plugin-sdk/provider-test-contracts`      | Vertragshelfer für Provider-Runtime, Auth, Discovery, Onboarding, Katalog, Medienfähigkeit, Replay-Richtlinie, Echtzeit-STT-Live-Audio, Websuche/Abruf und Assistent         |
  | `plugin-sdk/provider-http-test-mocks`     | Optionale Vitest-HTTP/Auth-Mocks für Provider-Tests, die `plugin-sdk/provider-http` ausüben                                                                                   |
  | `plugin-sdk/test-env`                     | Fixtures für Testumgebung, Fetch/Netzwerk, verwertbaren HTTP-Server, eingehende Anfrage, Live-Test, temporäres Dateisystem und Zeitsteuerung                                 |
  | `plugin-sdk/test-fixtures`                | Generische Test-Fixtures für CLI, Sandbox, Skill, Agent-Nachricht, Systemereignis, Modul-Neuladen, gebündelten Plugin-Pfad, Terminal, Chunking, Auth-Token und typisierte Fälle |
  | `plugin-sdk/test-node-mocks`              | Fokussierte Mock-Helfer für Node-Built-ins zur Verwendung in Vitest-`vi.mock("node:*")`-Factories                                                                             |
  | `plugin-sdk/migration`                    | Helfer für Migrations-Provider-Elemente wie `createMigrationItem`, Begründungskonstanten, Elementstatusmarker, Redaktionshelfer und `summarizeMigrationItems`                 |
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
    | `plugin-sdk/account-core` | Helfer für Multi-Account-Konfiguration/Aktions-Gates, Fallback-Helfer für Standardkonten |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, Helfer zur Konto-ID-Normalisierung |
    | `plugin-sdk/account-resolution` | Helfer für Kontosuche + Standard-Fallback |
    | `plugin-sdk/account-helpers` | Schmale Helfer für Kontolisten/Kontoaktionen |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | `createChannelReplyPipeline`, `resolveChannelSourceReplyDeliveryMode` |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
    | `plugin-sdk/channel-config-schema` | Gemeinsame Primitive für Channel-Konfigurationsschemas plus Zod- und direkte JSON/TypeBox-Builder |
    | `plugin-sdk/bundled-channel-config-schema` | Konfigurationsschemas für gebündelte OpenClaw-Channels nur für gepflegte gebündelte Plugins |
    | `plugin-sdk/channel-config-schema-legacy` | Veralteter Kompatibilitätsalias für Konfigurationsschemas gebündelter Channels |
    | `plugin-sdk/telegram-command-config` | Helfer zur Normalisierung/Validierung benutzerdefinierter Telegram-Befehle mit Fallback für gebündelte Verträge |
    | `plugin-sdk/command-gating` | Schmale Helfer für Befehlsautorisierungs-Gates |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-lifecycle` | `createAccountStatusSink`, `createChannelRunQueue`, Helfer für Lebenszyklus/Finalisierung von Entwurfsstreams |
    | `plugin-sdk/inbound-envelope` | Gemeinsame Helfer für eingehende Route + Umschlag-Builder |
    | `plugin-sdk/inbound-reply-dispatch` | Gemeinsame Helfer zum Aufzeichnen und Weiterleiten eingehender Daten |
    | `plugin-sdk/messaging-targets` | Helfer zum Parsen/Abgleichen von Zielen |
    | `plugin-sdk/outbound-media` | Gemeinsame Helfer zum Laden ausgehender Medien |
    | `plugin-sdk/outbound-send-deps` | Leichtgewichtige Suche ausgehender Sendeabhängigkeiten für Channel-Adapter |
    | `plugin-sdk/outbound-runtime` | Helfer für ausgehende Zustellung, Identität, Sende-Delegates, Sitzung, Formatierung und Payload-Planung |
    | `plugin-sdk/poll-runtime` | Schmale Helfer zur Umfrage-Normalisierung |
    | `plugin-sdk/thread-bindings-runtime` | Helfer für Thread-Binding-Lebenszyklus und Adapter |
    | `plugin-sdk/agent-media-payload` | Älterer Builder für Agent-Medien-Payloads |
    | `plugin-sdk/conversation-runtime` | Helfer für Unterhaltungs-/Thread-Binding, Pairing und konfigurierte Bindings |
    | `plugin-sdk/runtime-config-snapshot` | Helfer für Runtime-Konfigurations-Snapshot |
    | `plugin-sdk/runtime-group-policy` | Helfer zur Runtime-Auflösung von Gruppenrichtlinien |
    | `plugin-sdk/channel-status` | Gemeinsame Helfer für Channel-Status-Snapshot/-Zusammenfassung |
    | `plugin-sdk/channel-config-primitives` | Schmale Primitive für Channel-Konfigurationsschemas |
    | `plugin-sdk/channel-config-writes` | Autorisierungshelfer für Channel-Konfigurationsschreibvorgänge |
    | `plugin-sdk/channel-plugin-common` | Gemeinsame Prelude-Exporte für Channel-Plugins |
    | `plugin-sdk/allowlist-config-edit` | Helfer zum Bearbeiten/Lesen der Allowlist-Konfiguration |
    | `plugin-sdk/group-access` | Gemeinsame Entscheidungshelfer für Gruppenzugriff |
    | `plugin-sdk/direct-dm` | Gemeinsame Auth-/Guard-Helfer für direkte DMs |
    | `plugin-sdk/discord` | Veraltete Discord-Kompatibilitätsfassade für veröffentlichtes `@openclaw/discord@2026.3.13` und nachverfolgte Eigentümerkompatibilität; neue Plugins sollten generische Channel-SDK-Unterpfade verwenden |
    | `plugin-sdk/telegram-account` | Veraltete Telegram-Kompatibilitätsfassade für Kontoauflösung zur nachverfolgten Eigentümerkompatibilität; neue Plugins sollten injizierte Runtime-Helfer oder generische Channel-SDK-Unterpfade verwenden |
    | `plugin-sdk/zalouser` | Veraltete Zalo Personal-Kompatibilitätsfassade für veröffentlichte Lark/Zalo-Pakete, die weiterhin die Autorisierung von Senderbefehlen importieren; neue Plugins sollten `plugin-sdk/command-auth` verwenden |
    | `plugin-sdk/interactive-runtime` | Helfer für semantische Nachrichtenpräsentation, Zustellung und ältere interaktive Antworten. Siehe [Nachrichtenpräsentation](/de/plugins/message-presentation) |
    | `plugin-sdk/channel-inbound` | Kompatibilitäts-Barrel für eingehendes Debouncing, Erwähnungsabgleich, Erwähnungsrichtlinien-Helfer und Umschlag-Helfer |
    | `plugin-sdk/channel-inbound-debounce` | Schmale Helfer für eingehendes Debouncing |
    | `plugin-sdk/channel-mention-gating` | Schmale Helfer für Erwähnungsrichtlinien, Erwähnungsmarker und Erwähnungstext ohne die breitere eingehende Runtime-Oberfläche |
    | `plugin-sdk/channel-envelope` | Schmale Formatierungshelfer für eingehende Umschläge |
    | `plugin-sdk/channel-location` | Channel-Standortkontext und Formatierungshelfer |
    | `plugin-sdk/channel-logging` | Channel-Logging-Helfer für verworfene eingehende Nachrichten und Tipp-/Bestätigungsfehler |
    | `plugin-sdk/channel-send-result` | Ergebnistypen für Antworten |
    | `plugin-sdk/channel-actions` | Helfer für Channel-Nachrichtenaktionen plus veraltete native Schemahelfer, die für Plugin-Kompatibilität beibehalten werden |
    | `plugin-sdk/channel-route` | Gemeinsame Helfer für Routen-Normalisierung, parsergesteuerte Zielauflösung, Thread-ID-Stringifizierung, Deduplizierung/Kompaktierung von Routenschlüsseln, geparste Zieltypen sowie Routen-/Zielvergleich |
    | `plugin-sdk/channel-targets` | Helfer zum Parsen von Zielen; Aufrufer für Routenvergleiche sollten `plugin-sdk/channel-route` verwenden |
    | `plugin-sdk/channel-contract` | Channel-Vertragstypen |
    | `plugin-sdk/channel-feedback` | Verdrahtung von Feedback/Reaktionen |
    | `plugin-sdk/channel-secret-runtime` | Schmale Helfer für Secret-Verträge wie `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment` und Secret-Zieltypen |
  </Accordion>

  <Accordion title="Provider-Unterpfade">
    | Unterpfad | Wichtige Exporte |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/lmstudio` | Unterstützte LM Studio-Provider-Fassade für Einrichtung, Katalogerkennung und Laufzeitvorbereitung von Modellen |
    | `plugin-sdk/lmstudio-runtime` | Unterstützte LM Studio-Laufzeitfassade für lokale Serverstandards, Modellerkennung, Request-Header und Hilfsfunktionen für geladene Modelle |
    | `plugin-sdk/provider-setup` | Kuratierte Einrichtungshelfer für lokale/selbst gehostete Provider |
    | `plugin-sdk/self-hosted-provider-setup` | Fokussierte OpenAI-kompatible Einrichtungshelfer für selbst gehostete Provider |
    | `plugin-sdk/cli-backend` | CLI-Backend-Standards + Watchdog-Konstanten |
    | `plugin-sdk/provider-auth-runtime` | Laufzeit-Hilfsfunktionen zur API-Schlüsselauflösung für Provider-Plugins |
    | `plugin-sdk/provider-auth-api-key` | Hilfsfunktionen für API-Schlüssel-Onboarding und Profilschreiben, wie `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | Standard-Builder für OAuth-Authentifizierungsergebnisse |
    | `plugin-sdk/provider-auth-login` | Gemeinsame interaktive Login-Hilfsfunktionen für Provider-Plugins |
    | `plugin-sdk/provider-env-vars` | Hilfsfunktionen zum Nachschlagen von Provider-Authentifizierungs-Umgebungsvariablen |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, gemeinsame Builder für Replay-Richtlinien, Hilfsfunktionen für Provider-Endpunkte und Hilfsfunktionen zur Normalisierung von Modell-IDs wie `normalizeNativeXaiModelId` |
    | `plugin-sdk/provider-catalog-runtime` | Laufzeit-Hook zur Erweiterung des Provider-Katalogs und Registry-Nähte für Plugin-Provider für Vertragstests |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | Generische Hilfsfunktionen für Provider-HTTP-/Endpunkt-Fähigkeiten, Provider-HTTP-Fehler und Multipart-Formular-Hilfsfunktionen für Audiotranskription |
    | `plugin-sdk/provider-web-fetch-contract` | Schmale Hilfsfunktionen für Web-Fetch-Konfiguration/Auswahlverträge wie `enablePluginInConfig` und `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | Hilfsfunktionen für Registrierung/Cache von Web-Fetch-Providern |
    | `plugin-sdk/provider-web-search-config-contract` | Schmale Hilfsfunktionen für Web-Search-Konfiguration/Anmeldedaten für Provider, die keine Plugin-Aktivierungsverdrahtung benötigen |
    | `plugin-sdk/provider-web-search-contract` | Schmale Hilfsfunktionen für Web-Search-Konfiguration/Anmeldedaten-Verträge wie `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` und bereichsbezogene Setter/Getter für Anmeldedaten |
    | `plugin-sdk/provider-web-search` | Hilfsfunktionen für Registrierung/Cache/Laufzeit von Web-Search-Providern |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, Gemini-Schema-Bereinigung + Diagnose und xAI-Kompatibilitätshelfer wie `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
    | `plugin-sdk/provider-usage` | `fetchClaudeUsage` und Ähnliches |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, Stream-Wrapper-Typen und gemeinsame Wrapper-Hilfsfunktionen für Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
    | `plugin-sdk/provider-transport-runtime` | Native Provider-Transport-Hilfsfunktionen wie abgesicherter Fetch, Transport-Nachrichtentransformationen und beschreibbare Transport-Ereignisstreams |
    | `plugin-sdk/provider-onboard` | Hilfsfunktionen für Onboarding-Konfigurations-Patches |
    | `plugin-sdk/global-singleton` | Prozesslokale Singleton-/Map-/Cache-Hilfsfunktionen |
    | `plugin-sdk/group-activation` | Schmale Hilfsfunktionen für Gruppenaktivierungsmodus und Befehlsparsing |
  </Accordion>

  <Accordion title="Authentifizierungs- und Sicherheitsunterpfade">
    | Unterpfad | Wichtige Exporte |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, Hilfsfunktionen für die Befehlsregistry einschließlich dynamischer Argumentmenü-Formatierung, Hilfsfunktionen für Senderautorisierung |
    | `plugin-sdk/command-status` | Builder für Befehls-/Hilfenachrichten wie `buildCommandsMessagePaginated` und `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | Hilfsfunktionen für Genehmigerauflösung und Aktionsauthentifizierung im selben Chat |
    | `plugin-sdk/approval-client-runtime` | Hilfsfunktionen für native Exec-Genehmigungsprofile/-filter |
    | `plugin-sdk/approval-delivery-runtime` | Native Adapter für Genehmigungsfähigkeiten/-zustellung |
    | `plugin-sdk/approval-gateway-runtime` | Gemeinsame Hilfsfunktion zur Genehmigungs-Gateway-Auflösung |
    | `plugin-sdk/approval-handler-adapter-runtime` | Leichtgewichtige Hilfsfunktionen zum Laden nativer Genehmigungsadapter für heiße Channel-Einstiegspunkte |
    | `plugin-sdk/approval-handler-runtime` | Breitere Laufzeit-Hilfsfunktionen für Genehmigungshandler; bevorzugen Sie die schmaleren Adapter-/Gateway-Nähte, wenn sie ausreichen |
    | `plugin-sdk/approval-native-runtime` | Native Hilfsfunktionen für Genehmigungsziel + Kontobindung |
    | `plugin-sdk/approval-reply-runtime` | Hilfsfunktionen für Exec-/Plugin-Genehmigungsantwort-Payloads |
    | `plugin-sdk/approval-runtime` | Hilfsfunktionen für Exec-/Plugin-Genehmigungs-Payloads, native Genehmigungsrouting-/Laufzeit-Hilfsfunktionen und Hilfsfunktionen für strukturierte Genehmigungsanzeigen wie `formatApprovalDisplayPath` |
    | `plugin-sdk/reply-dedupe` | Schmale Hilfsfunktionen zum Zurücksetzen der Deduplizierung eingehender Antworten |
    | `plugin-sdk/channel-contract-testing` | Schmale Channel-Vertragstest-Hilfsfunktionen ohne das breite Testing-Barrel |
    | `plugin-sdk/command-auth-native` | Native Befehlsauthentifizierung, dynamische Argumentmenü-Formatierung und native Hilfsfunktionen für Sitzungsziele |
    | `plugin-sdk/command-detection` | Gemeinsame Hilfsfunktionen zur Befehlserkennung |
    | `plugin-sdk/command-primitives-runtime` | Leichtgewichtige Befehlstext-Prädikate für heiße Channel-Pfade |
    | `plugin-sdk/command-surface` | Hilfsfunktionen für Befehlsrumpf-Normalisierung und Befehlsoberflächen |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | Schmale Hilfsfunktionen zur Secret-Contract-Erfassung für Channel-/Plugin-Secret-Oberflächen |
    | `plugin-sdk/secret-ref-runtime` | Schmale `coerceSecretRef`- und SecretRef-Typisierungshelfer für Secret-Contract-/Konfigurationsparsing |
    | `plugin-sdk/security-runtime` | Gemeinsame Hilfsfunktionen für Vertrauen, DM-Gating, externe Inhalte, Schwärzung sensibler Texte, Secret-Vergleich mit konstanter Laufzeit und Secret-Erfassung |
    | `plugin-sdk/ssrf-policy` | Hilfsfunktionen für Host-Allowlist und SSRF-Richtlinien für private Netzwerke |
    | `plugin-sdk/ssrf-dispatcher` | Schmale Hilfsfunktionen für angeheftete Dispatcher ohne die breite Infra-Laufzeitoberfläche |
    | `plugin-sdk/ssrf-runtime` | Angehefteter Dispatcher, SSRF-geschützter Fetch, SSRF-Fehler und SSRF-Richtlinien-Hilfsfunktionen |
    | `plugin-sdk/secret-input` | Hilfsfunktionen zum Parsen von Secret-Eingaben |
    | `plugin-sdk/webhook-ingress` | Hilfsfunktionen für Webhook-Requests/-Ziele und Roh-Websocket-/Body-Koerzierung |
    | `plugin-sdk/webhook-request-guards` | Hilfsfunktionen für Größe/Timeout des Request-Bodys |
  </Accordion>

  <Accordion title="Laufzeit- und Speicherunterpfade">
    | Unterpfad | Wichtige Exporte |
    | --- | --- |
    | `plugin-sdk/runtime` | Breite Laufzeit-/Logging-/Backup-/Plugin-Installations-Helfer |
    | `plugin-sdk/runtime-env` | Eng gefasste Helfer für Laufzeitumgebung, Logger, Timeout, Wiederholung und Backoff |
    | `plugin-sdk/browser-config` | Unterstützte Browser-Konfigurationsfassade für normalisierte Profile/Standardwerte, CDP-URL-Parsing und Browser-Control-Authentifizierungshelfer |
    | `plugin-sdk/channel-runtime-context` | Generische Helfer zum Registrieren und Nachschlagen des Kanal-Laufzeitkontexts |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Gemeinsame Helfer für Plugin-Befehle, Hooks, HTTP und Interaktivität |
    | `plugin-sdk/hook-runtime` | Gemeinsame Helfer für Webhook-/interne Hook-Pipelines |
    | `plugin-sdk/lazy-runtime` | Lazy-Laufzeitimport-/Binding-Helfer wie `createLazyRuntimeModule`, `createLazyRuntimeMethod` und `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | Helfer zur Prozessausführung |
    | `plugin-sdk/cli-runtime` | Helfer für CLI-Formatierung, Warten, Version, Argumentaufruf und Lazy-Befehlsgruppen |
    | `plugin-sdk/gateway-runtime` | Gateway-Client, Helfer zum Starten eines event-loop-bereiten Clients, Gateway-CLI-RPC, Gateway-Protokollfehler und Helfer für Kanalstatus-Patches |
    | `plugin-sdk/config-types` | Rein typbasierte Konfigurationsoberfläche für Plugin-Konfigurationsformen wie `OpenClawConfig` und Kanal-/Provider-Konfigurationstypen |
    | `plugin-sdk/plugin-config-runtime` | Laufzeithelfer zum Nachschlagen der Plugin-Konfiguration wie `requireRuntimeConfig`, `resolvePluginConfigObject` und `resolveLivePluginConfigObject` |
    | `plugin-sdk/config-mutation` | Transaktionale Helfer zur Konfigurationsänderung wie `mutateConfigFile`, `replaceConfigFile` und `logConfigUpdated` |
    | `plugin-sdk/runtime-config-snapshot` | Helfer für Snapshots der aktuellen Prozesskonfiguration wie `getRuntimeConfig`, `getRuntimeConfigSnapshot` und Test-Snapshot-Setter |
    | `plugin-sdk/telegram-command-config` | Normalisierung von Telegram-Befehlsnamen/-beschreibungen und Prüfungen auf Duplikate/Konflikte, auch wenn die gebündelte Telegram-Vertragsoberfläche nicht verfügbar ist |
    | `plugin-sdk/text-autolink-runtime` | Erkennung von Dateireferenz-Autolinks ohne das breite Text-Runtime-Barrel |
    | `plugin-sdk/approval-runtime` | Helfer für Exec-/Plugin-Genehmigungen, Builder für Genehmigungs-Capabilities, Auth-/Profilhelfer, native Routing-/Runtime-Helfer und formatierte Pfade für strukturierte Genehmigungsanzeigen |
    | `plugin-sdk/reply-runtime` | Gemeinsame Laufzeithelfer für eingehende Nachrichten/Antworten, Chunking, Versand, Heartbeat, Antwortplaner |
    | `plugin-sdk/reply-dispatch-runtime` | Eng gefasste Helfer für Antwortversand/-Finalisierung und Konversationslabels |
    | `plugin-sdk/reply-history` | Gemeinsame Helfer und Marker für kurzfristige Antwortverläufe wie `buildHistoryContext`, `HISTORY_CONTEXT_MARKER`, `recordPendingHistoryEntry` und `clearHistoryEntriesIfEnabled` |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | Eng gefasste Helfer für Text-/Markdown-Chunking |
    | `plugin-sdk/session-store-runtime` | Helfer für Sitzungsspeicherpfad, Sitzungsschlüssel, Aktualisierungszeitpunkt und Speichermutationen |
    | `plugin-sdk/cron-store-runtime` | Helfer für Cron-Speicherpfad/Laden/Speichern |
    | `plugin-sdk/state-paths` | Pfadhelfer für Status-/OAuth-Verzeichnisse |
    | `plugin-sdk/routing` | Helfer für Routen-/Sitzungsschlüssel-/Kontobindung wie `resolveAgentRoute`, `buildAgentSessionKey` und `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | Gemeinsame Helfer für Kanal-/Kontostatus-Zusammenfassungen, Standardwerte für Laufzeitstatus und Helfer für Problemmetadaten |
    | `plugin-sdk/target-resolver-runtime` | Gemeinsame Helfer für Zielauflöser |
    | `plugin-sdk/string-normalization-runtime` | Helfer zur Slug-/String-Normalisierung |
    | `plugin-sdk/request-url` | String-URLs aus fetch-/request-ähnlichen Eingaben extrahieren |
    | `plugin-sdk/run-command` | Zeitgesteuerter Befehlsrunner mit normalisierten stdout-/stderr-Ergebnissen |
    | `plugin-sdk/param-readers` | Gemeinsame Parameterleser für Tools/CLI |
    | `plugin-sdk/tool-payload` | Normalisierte Payloads aus Tool-Ergebnisobjekten extrahieren |
    | `plugin-sdk/tool-send` | Kanonische Felder des Sendeziels aus Tool-Argumenten extrahieren |
    | `plugin-sdk/temp-path` | Gemeinsame Helfer für temporäre Downloadpfade |
    | `plugin-sdk/logging-core` | Subsystem-Logger und Schwärzungshelfer |
    | `plugin-sdk/markdown-table-runtime` | Helfer für Markdown-Tabellenmodus und -Konvertierung |
    | `plugin-sdk/model-session-runtime` | Helfer für Modell-/Sitzungsüberschreibungen wie `applyModelOverrideToSessionEntry` und `resolveAgentMaxConcurrent` |
    | `plugin-sdk/talk-config-runtime` | Helfer zur Auflösung der Talk-Provider-Konfiguration |
    | `plugin-sdk/json-store` | Kleine Helfer zum Lesen/Schreiben von JSON-Status |
    | `plugin-sdk/file-lock` | Reentrante File-Lock-Helfer |
    | `plugin-sdk/persistent-dedupe` | Festplattenbasierte Helfer für Dedupe-Caches |
    | `plugin-sdk/acp-runtime` | Helfer für ACP-Runtime/-Sitzung und Antwortversand |
    | `plugin-sdk/acp-runtime-backend` | Leichtgewichtige Helfer zur ACP-Backend-Registrierung und zum Antwortversand für beim Start geladene Plugins |
    | `plugin-sdk/acp-binding-resolve-runtime` | Schreibgeschützte ACP-Binding-Auflösung ohne Lifecycle-Startimporte |
    | `plugin-sdk/agent-config-primitives` | Eng gefasste Primitive für Agent-Laufzeit-Konfigurationsschemata |
    | `plugin-sdk/boolean-param` | Lockerer boolescher Parameterleser |
    | `plugin-sdk/dangerous-name-runtime` | Helfer zur Auflösung von Dangerous-Name-Abgleichen |
    | `plugin-sdk/device-bootstrap` | Helfer für Geräte-Bootstrap und Pairing-Token |
    | `plugin-sdk/extension-shared` | Gemeinsame Primitive für passive Kanäle, Status und Ambient-Proxy-Helfer |
    | `plugin-sdk/models-provider-runtime` | Helfer für `/models`-Befehls-/Provider-Antworten |
    | `plugin-sdk/skill-commands-runtime` | Helfer zum Auflisten von Skill-Befehlen |
    | `plugin-sdk/native-command-registry` | Helfer zum Registrieren/Erstellen/Serialisieren nativer Befehle |
    | `plugin-sdk/agent-harness` | Experimentelle Trusted-Plugin-Oberfläche für Low-Level-Agent-Harnesses: Harness-Typen, Helfer zum Steuern/Abbrechen aktiver Läufe, OpenClaw-Tool-Bridge-Helfer, Tool-Policy-Helfer für Laufzeitpläne, Klassifizierung von Terminalergebnissen, Formatierungs-/Detailhelfer für Tool-Fortschritt und Hilfsfunktionen für Versuchsergebnisse |
    | `plugin-sdk/provider-zai-endpoint` | Helfer zur Erkennung von Z.AI-Endpunkten |
    | `plugin-sdk/async-lock-runtime` | Prozesslokaler Async-Lock-Helfer für kleine Laufzeitstatusdateien |
    | `plugin-sdk/channel-activity-runtime` | Helfer für Kanalaktivitätstelemetrie |
    | `plugin-sdk/concurrency-runtime` | Helfer für begrenzte Nebenläufigkeit asynchroner Aufgaben |
    | `plugin-sdk/dedupe-runtime` | Helfer für In-Memory-Dedupe-Caches |
    | `plugin-sdk/delivery-queue-runtime` | Helfer zum Leeren ausstehender ausgehender Zustellungen |
    | `plugin-sdk/file-access-runtime` | Helfer für sichere lokale Datei- und Medienquellenpfade |
    | `plugin-sdk/heartbeat-runtime` | Helfer für Heartbeat-Ereignisse und Sichtbarkeit |
    | `plugin-sdk/number-runtime` | Helfer für numerische Koersion |
    | `plugin-sdk/secure-random-runtime` | Helfer für sichere Token/UUIDs |
    | `plugin-sdk/system-event-runtime` | Helfer für Systemereignis-Warteschlangen |
    | `plugin-sdk/transport-ready-runtime` | Helfer zum Warten auf Transportbereitschaft |
    | `plugin-sdk/infra-runtime` | Veralteter Kompatibilitäts-Shim; verwenden Sie die fokussierten Laufzeitunterpfade oben |
    | `plugin-sdk/collection-runtime` | Kleine Helfer für begrenzte Caches |
    | `plugin-sdk/diagnostic-runtime` | Helfer für Diagnose-Flags, Ereignisse und Trace-Kontext |
    | `plugin-sdk/error-runtime` | Fehlergraph, Formatierung, gemeinsame Helfer zur Fehlerklassifizierung, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | Umhülltes Fetch, Proxy, EnvHttpProxyAgent-Option und Helfer für gepinnte Lookups |
    | `plugin-sdk/runtime-fetch` | Dispatcher-bewusstes Laufzeit-Fetch ohne Proxy-/Guarded-Fetch-Importe |
    | `plugin-sdk/response-limit-runtime` | Begrenzter Response-Body-Reader ohne die breite Medien-Runtime-Oberfläche |
    | `plugin-sdk/session-binding-runtime` | Aktueller Konversations-Binding-Status ohne konfiguriertes Binding-Routing oder Pairing-Speicher |
    | `plugin-sdk/session-store-runtime` | Sitzungsspeicherhelfer ohne breite Konfigurationsschreib-/Wartungsimporte |
    | `plugin-sdk/context-visibility-runtime` | Auflösung der Kontextsichtbarkeit und Filterung ergänzender Kontexte ohne breite Konfigurations-/Sicherheitsimporte |
    | `plugin-sdk/string-coerce-runtime` | Eng gefasste Helfer für primitive Record-/String-Koersion und -Normalisierung ohne Markdown-/Logging-Importe |
    | `plugin-sdk/host-runtime` | Helfer zur Normalisierung von Hostnamen und SCP-Hosts |
    | `plugin-sdk/retry-runtime` | Helfer für Wiederholungskonfiguration und Wiederholungsrunner |
    | `plugin-sdk/agent-runtime` | Helfer für Agent-Verzeichnis, Identität und Arbeitsbereich |
    | `plugin-sdk/directory-runtime` | Konfigurationsgestützte Verzeichnisabfrage/-Deduplizierung |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Funktions- und Testunterpfade">
    | Unterpfad | Wichtige Exporte |
    | --- | --- |
    | `plugin-sdk/media-runtime` | Gemeinsame Hilfsfunktionen zum Abrufen/Transformieren/Speichern von Medien, ffprobe-gestützte Ermittlung von Videodimensionen und Builder für Medien-Payloads |
    | `plugin-sdk/media-store` | Eng gefasste Hilfsfunktionen für den Medienspeicher wie `saveMediaBuffer` |
    | `plugin-sdk/media-generation-runtime` | Gemeinsame Failover-Hilfsfunktionen für die Mediengenerierung, Kandidatenauswahl und Meldungen zu fehlenden Modellen |
    | `plugin-sdk/media-understanding` | Provider-Typen für Medienverständnis sowie Provider-seitige Exporte für Bild-/Audio-Hilfsfunktionen |
    | `plugin-sdk/text-runtime` | Gemeinsame Hilfsfunktionen für Text/Markdown/Logging, etwa Entfernen von für Assistenten sichtbarem Text, Markdown-Render-/Chunking-/Tabellen-Hilfsfunktionen, Redaktionshilfen, Directive-Tag-Hilfsfunktionen und Safe-Text-Dienstprogramme |
    | `plugin-sdk/text-chunking` | Hilfsfunktion für ausgehendes Text-Chunking |
    | `plugin-sdk/speech` | Typen für Speech-Provider sowie Provider-seitige Exporte für Directives, Registry, Validierung, OpenAI-kompatiblen TTS-Builder und Speech-Hilfsfunktionen |
    | `plugin-sdk/speech-core` | Gemeinsame Typen für Speech-Provider, Registry, Directive, Normalisierung und Exporte für Speech-Hilfsfunktionen |
    | `plugin-sdk/realtime-transcription` | Typen für Echtzeit-Transkriptions-Provider, Registry-Hilfsfunktionen und gemeinsame WebSocket-Sitzungshilfe |
    | `plugin-sdk/realtime-voice` | Typen für Echtzeit-Sprach-Provider und Registry-Hilfsfunktionen |
    | `plugin-sdk/image-generation` | Typen für Bildgenerierungs-Provider sowie Hilfsfunktionen für Bildassets/Daten-URLs und der OpenAI-kompatible Bild-Provider-Builder |
    | `plugin-sdk/image-generation-core` | Gemeinsame Bildgenerierungstypen, Failover-, Auth- und Registry-Hilfsfunktionen |
    | `plugin-sdk/music-generation` | Provider-/Request-/Result-Typen für Musikgenerierung |
    | `plugin-sdk/music-generation-core` | Gemeinsame Musikgenerierungstypen, Failover-Hilfsfunktionen, Provider-Suche und Model-Ref-Parsing |
    | `plugin-sdk/video-generation` | Provider-/Request-/Result-Typen für Videogenerierung |
    | `plugin-sdk/video-generation-core` | Gemeinsame Videogenerierungstypen, Failover-Hilfsfunktionen, Provider-Suche und Model-Ref-Parsing |
    | `plugin-sdk/webhook-targets` | Webhook-Ziel-Registry und Hilfsfunktionen zur Routeninstallation |
    | `plugin-sdk/webhook-path` | Hilfsfunktionen zur Webhook-Pfadnormalisierung |
    | `plugin-sdk/web-media` | Gemeinsame Hilfsfunktionen zum Laden von Remote-/lokalen Medien |
    | `plugin-sdk/zod` | Re-exportiertes `zod` für Plugin-SDK-Nutzer |
    | `plugin-sdk/testing` | Breites Kompatibilitäts-Barrel für Legacy-Plugin-Tests. Neue Erweiterungstests sollten stattdessen fokussierte SDK-Unterpfade wie `plugin-sdk/agent-runtime-test-contracts`, `plugin-sdk/plugin-test-runtime`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/test-env` oder `plugin-sdk/test-fixtures` importieren |
    | `plugin-sdk/plugin-test-api` | Minimale `createTestPluginApi`-Hilfsfunktion für direkte Plugin-Registrierungs-Unit-Tests ohne Import von Repo-Test-Hilfsbrücken |
    | `plugin-sdk/agent-runtime-test-contracts` | Native Contract-Fixtures für Agent-Runtime-Adapter für Auth-, Zustellungs-, Fallback-, Tool-Hook-, Prompt-Overlay-, Schema- und Transcript-Projection-Tests |
    | `plugin-sdk/channel-test-helpers` | Kanalorientierte Testhilfen für generische Actions-/Setup-/Status-Contracts, Verzeichnis-Assertions, Account-Startup-Lebenszyklus, Send-Config-Threading, Runtime-Mocks, Statusprobleme, ausgehende Zustellung und Hook-Registrierung |
    | `plugin-sdk/channel-target-testing` | Gemeinsame Suite für Fehlerfälle der Zielauflösung in Kanaltests |
    | `plugin-sdk/plugin-test-contracts` | Contract-Hilfsfunktionen für Plugin-Paket, Registrierung, öffentliche Artefakte, direkten Import, Runtime-API und Import-Nebeneffekte |
    | `plugin-sdk/provider-test-contracts` | Contract-Hilfsfunktionen für Provider-Runtime, Auth, Discovery, Onboard, Katalog, Assistent, Medien-Capability, Replay-Richtlinie, Echtzeit-STT-Live-Audio, Websuche/-Abruf und Stream |
    | `plugin-sdk/provider-http-test-mocks` | Opt-in-Vitest-HTTP-/Auth-Mocks für Provider-Tests, die `plugin-sdk/provider-http` ausführen |
    | `plugin-sdk/test-fixtures` | Generische Fixtures für CLI-Runtime-Erfassung, Sandbox-Kontext, Skill-Writer, Agent-Message, System-Event, Module-Reload, gebündelten Plugin-Pfad, Terminal-Text, Chunking, Auth-Token und typisierte Fälle |
    | `plugin-sdk/test-node-mocks` | Fokussierte Mock-Hilfsfunktionen für eingebaute Node-Module zur Verwendung in Vitest-`vi.mock("node:*")`-Factories |
  </Accordion>

  <Accordion title="Memory-Unterpfade">
    | Unterpfad | Wichtige Exporte |
    | --- | --- |
    | `plugin-sdk/memory-core` | Gebündelte memory-core-Hilfsoberfläche für Manager-/Config-/Datei-/CLI-Hilfsfunktionen |
    | `plugin-sdk/memory-core-engine-runtime` | Runtime-Fassade für Memory-Index/-Suche |
    | `plugin-sdk/memory-core-host-engine-foundation` | Exporte der Memory-Host-Foundation-Engine |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Memory-Host-Embedding-Contracts, Registry-Zugriff, lokaler Provider und generische Batch-/Remote-Hilfsfunktionen |
    | `plugin-sdk/memory-core-host-engine-qmd` | Exporte der Memory-Host-QMD-Engine |
    | `plugin-sdk/memory-core-host-engine-storage` | Exporte der Memory-Host-Storage-Engine |
    | `plugin-sdk/memory-core-host-multimodal` | Multimodale Hilfsfunktionen für Memory-Hosts |
    | `plugin-sdk/memory-core-host-query` | Query-Hilfsfunktionen für Memory-Hosts |
    | `plugin-sdk/memory-core-host-secret` | Secret-Hilfsfunktionen für Memory-Hosts |
    | `plugin-sdk/memory-core-host-events` | Hilfsfunktionen für Memory-Host-Event-Journals |
    | `plugin-sdk/memory-core-host-status` | Status-Hilfsfunktionen für Memory-Hosts |
    | `plugin-sdk/memory-core-host-runtime-cli` | CLI-Runtime-Hilfsfunktionen für Memory-Hosts |
    | `plugin-sdk/memory-core-host-runtime-core` | Core-Runtime-Hilfsfunktionen für Memory-Hosts |
    | `plugin-sdk/memory-core-host-runtime-files` | Datei-/Runtime-Hilfsfunktionen für Memory-Hosts |
    | `plugin-sdk/memory-host-core` | Vendor-neutraler Alias für Core-Runtime-Hilfsfunktionen für Memory-Hosts |
    | `plugin-sdk/memory-host-events` | Vendor-neutraler Alias für Hilfsfunktionen für Memory-Host-Event-Journals |
    | `plugin-sdk/memory-host-files` | Vendor-neutraler Alias für Datei-/Runtime-Hilfsfunktionen für Memory-Hosts |
    | `plugin-sdk/memory-host-markdown` | Gemeinsame Managed-Markdown-Hilfsfunktionen für Memory-nahe Plugins |
    | `plugin-sdk/memory-host-search` | Active-Memory-Runtime-Fassade für Search-Manager-Zugriff |
    | `plugin-sdk/memory-host-status` | Vendor-neutraler Alias für Status-Hilfsfunktionen für Memory-Hosts |
  </Accordion>

  <Accordion title="Reservierte Unterpfade für gebündelte Hilfsfunktionen">
    Derzeit gibt es keine reservierten SDK-Unterpfade für gebündelte Hilfsfunktionen. Owner-spezifische
    Hilfsfunktionen befinden sich im besitzenden Plugin-Paket, während wiederverwendbare Host-Contracts
    generische SDK-Unterpfade wie `plugin-sdk/gateway-runtime`,
    `plugin-sdk/security-runtime` und `plugin-sdk/plugin-config-runtime` verwenden.
  </Accordion>
</AccordionGroup>

## Verwandte Themen

- [Plugin-SDK-Übersicht](/de/plugins/sdk-overview)
- [Plugin-SDK-Einrichtung](/de/plugins/sdk-setup)
- [Plugins erstellen](/de/plugins/building-plugins)
