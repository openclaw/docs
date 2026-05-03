---
read_when:
    - Den richtigen plugin-sdk-Unterpfad für einen Plugin-Import auswählen
    - Auditieren von Subpfaden gebündelter Plugins und Hilfsschnittstellen
summary: 'Plugin-SDK-Unterpfadkatalog: welche Importe wo liegen, nach Bereich gruppiert'
title: Plugin-SDK-Unterpfade
x-i18n:
    generated_at: "2026-05-03T21:36:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: b3c6d139523f060795a60bce79d124def6461c0bf6a03a7a06244604101f7eff
    source_path: plugins/sdk-subpaths.md
    workflow: 16
---

  Das Plugin-SDK wird als Satz schmaler Unterpfade unter `openclaw/plugin-sdk/` bereitgestellt.
  Diese Seite katalogisiert die häufig verwendeten Unterpfade, nach Zweck gruppiert. Die generierte
  vollständige Liste mit über 200 Unterpfaden befindet sich in `scripts/lib/plugin-sdk-entrypoints.json`;
  reservierte Hilfs-Unterpfade für gebündelte Plugins erscheinen dort, sind aber ein
  Implementierungsdetail, sofern sie nicht auf einer Dokumentationsseite ausdrücklich empfohlen werden. Maintainer können aktive
  reservierte Hilfs-Unterpfade mit `pnpm plugins:boundary-report:summary` prüfen; ungenutzte
  reservierte Hilfs-Exporte lassen den CI-Bericht fehlschlagen, statt als ruhende Kompatibilitätsschuld
  im öffentlichen SDK zu verbleiben.

  Den Leitfaden zum Erstellen von Plugins finden Sie unter [Plugin-SDK-Übersicht](/de/plugins/sdk-overview).

  ## Plugin-Einstieg

  | Unterpfad                                  | Wichtige Exporte                                                                                                                                                             |
  | ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
  | `plugin-sdk/plugin-entry`                 | `definePluginEntry`                                                                                                                                                          |
  | `plugin-sdk/core`                         | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema`, `buildJsonChannelConfigSchema`       |
  | `plugin-sdk/config-schema`                | `OpenClawSchema`                                                                                                                                                             |
  | `plugin-sdk/provider-entry`               | `defineSingleProviderPluginEntry`                                                                                                                                            |
  | `plugin-sdk/testing`                      | Breites Kompatibilitäts-Barrel für ältere Plugin-Tests; verwenden Sie für neue Plugin-Tests bevorzugt fokussierte Test-Unterpfade                                             |
  | `plugin-sdk/plugin-test-api`              | Minimaler Mock-Builder für `OpenClawPluginApi` für direkte Unit-Tests der Plugin-Registrierung                                                                                |
  | `plugin-sdk/agent-runtime-test-contracts` | Native Fixtures für Adapterverträge der Agent-Runtime für Auth-Profile, Unterdrückung der Zustellung, Fallback-Klassifizierung, Tool-Hooks, Prompt-Overlays, Schemas und Transcript-Reparatur |
  | `plugin-sdk/channel-test-helpers`         | Testhelfer für Konto-Lifecycle von Channels, Verzeichnis, Sendekonfiguration, Runtime-Mock, Hook, gebündelten Channel-Einstieg, Envelope-Zeitstempel, Pairing-Antwort und generischen Channel-Vertrag |
  | `plugin-sdk/channel-target-testing`       | Gemeinsame Testsuite für Fehlerfälle der Channel-Zielauflösung                                                                                                               |
  | `plugin-sdk/plugin-test-contracts`        | Hilfen für Plugin-Registrierung, Paketmanifest, öffentliche Artefakte, Runtime-API, Import-Nebeneffekt und direkte Importverträge                                            |
  | `plugin-sdk/plugin-test-runtime`          | Fixtures für Tests zu Plugin-Runtime, Registry, Provider-Registrierung, Einrichtungsassistent und Runtime-TaskFlow                                                           |
  | `plugin-sdk/provider-test-contracts`      | Vertragshilfen für Provider-Runtime, Auth, Discovery, Onboarding, Katalog, Medienfähigkeit, Replay-Richtlinie, Echtzeit-STT-Live-Audio, Websuche/Abruf und Assistent         |
  | `plugin-sdk/provider-http-test-mocks`     | Opt-in-Vitest-HTTP/Auth-Mocks für Provider-Tests, die `plugin-sdk/provider-http` ausführen                                                                                   |
  | `plugin-sdk/test-env`                     | Fixtures für Testumgebung, Fetch/Netzwerk, entsorgbaren HTTP-Server, eingehende Anfrage, Live-Test, temporäres Dateisystem und Zeitsteuerung                                |
  | `plugin-sdk/test-fixtures`                | Generische Test-Fixtures für CLI, Sandbox, Skill, Agent-Nachricht, Systemereignis, Modul-Neuladen, gebündelten Plugin-Pfad, Terminal, Chunking, Auth-Token und typisierten Fall |
  | `plugin-sdk/test-node-mocks`              | Fokussierte Mock-Hilfen für integrierte Node-Module zur Verwendung in Vitest-`vi.mock("node:*")`-Factories                                                                   |
  | `plugin-sdk/migration`                    | Hilfen für Migration-Provider-Elemente wie `createMigrationItem`, Grundkonstanten, Elementstatusmarkierungen, Redaktionshilfen und `summarizeMigrationItems`                 |
  | `plugin-sdk/migration-runtime`            | Runtime-Migrationshilfen wie `copyMigrationFileItem`, `withCachedMigrationConfigRuntime` und `writeMigrationReport`                                                          |

  <AccordionGroup>
  <Accordion title="Channel-Unterpfade">
    | Unterpfad | Wichtige Exporte |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | Zod-Schema-Export für die Root-`openclaw.json` (`OpenClawSchema`) |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, plus `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | Gemeinsame Hilfen für Einrichtungsassistenten, Allowlist-Prompts, Builder für Einrichtungsstatus |
    | `plugin-sdk/setup-runtime` | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | `createEnvPatchedAccountSetupAdapter` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | Hilfen für Multi-Account-Konfiguration/Aktions-Gates, Hilfen für Standardkonto-Fallback |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, Hilfen zur Normalisierung von Konto-IDs |
    | `plugin-sdk/account-resolution` | Hilfen für Kontosuche und Standard-Fallback |
    | `plugin-sdk/account-helpers` | Schmale Hilfen für Kontolisten/Kontoaktionen |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | `createChannelReplyPipeline`, `resolveChannelSourceReplyDeliveryMode` |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
    | `plugin-sdk/channel-config-schema` | Gemeinsame Primitive für Channel-Konfigurationsschemas plus Zod- und direkte JSON/TypeBox-Builder |
    | `plugin-sdk/bundled-channel-config-schema` | Gebündelte OpenClaw-Channel-Konfigurationsschemas nur für gepflegte gebündelte Plugins |
    | `plugin-sdk/channel-config-schema-legacy` | Veralteter Kompatibilitätsalias für gebündelte Channel-Konfigurationsschemas |
    | `plugin-sdk/telegram-command-config` | Hilfen zur Normalisierung/Validierung benutzerdefinierter Telegram-Befehle mit Fallback auf gebündelten Vertrag |
    | `plugin-sdk/command-gating` | Schmale Hilfen für Befehlsautorisierungs-Gates |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-lifecycle` | `createAccountStatusSink`, `createChannelRunQueue`, Lifecycle-/Finalisierungshilfen für Entwurfsstreams |
    | `plugin-sdk/inbound-envelope` | Gemeinsame Hilfen für eingehende Routen und Envelope-Builder |
    | `plugin-sdk/inbound-reply-dispatch` | Gemeinsame Hilfen zum Aufzeichnen und Dispatchen eingehender Einträge |
    | `plugin-sdk/messaging-targets` | Hilfen zum Parsen/Abgleichen von Zielen |
    | `plugin-sdk/outbound-media` | Gemeinsame Hilfen zum Laden ausgehender Medien |
    | `plugin-sdk/outbound-send-deps` | Leichtgewichtige Abhängigkeitssuche für ausgehendes Senden in Channel-Adaptern |
    | `plugin-sdk/outbound-runtime` | Hilfen für ausgehende Zustellung, Identität, Sende-Delegate, Sitzung, Formatierung und Payload-Planung |
    | `plugin-sdk/poll-runtime` | Schmale Hilfen zur Poll-Normalisierung |
    | `plugin-sdk/thread-bindings-runtime` | Hilfen für Thread-Binding-Lifecycle und Adapter |
    | `plugin-sdk/agent-media-payload` | Älterer Builder für Agent-Medien-Payloads |
    | `plugin-sdk/conversation-runtime` | Hilfen für Conversation-/Thread-Binding, Pairing und konfigurierte Bindings |
    | `plugin-sdk/runtime-config-snapshot` | Hilfsfunktion für Runtime-Konfigurations-Snapshots |
    | `plugin-sdk/runtime-group-policy` | Hilfen zur Auflösung von Runtime-Gruppenrichtlinien |
    | `plugin-sdk/channel-status` | Gemeinsame Hilfen für Channel-Status-Snapshot/Zusammenfassung |
    | `plugin-sdk/channel-config-primitives` | Schmale Primitive für Channel-Konfigurationsschemas |
    | `plugin-sdk/channel-config-writes` | Hilfen zur Autorisierung von Channel-Konfigurationsschreibvorgängen |
    | `plugin-sdk/channel-plugin-common` | Gemeinsame Prelude-Exporte für Channel-Plugins |
    | `plugin-sdk/allowlist-config-edit` | Hilfen zum Bearbeiten/Lesen der Allowlist-Konfiguration |
    | `plugin-sdk/group-access` | Gemeinsame Hilfen für Gruppen-Zugriffsentscheidungen |
    | `plugin-sdk/direct-dm` | Gemeinsame Auth-/Guard-Hilfen für direkte DMs |
    | `plugin-sdk/discord` | Veraltete Discord-Kompatibilitätsfassade für veröffentlichtes `@openclaw/discord@2026.3.13` und nachverfolgte Besitzerkompatibilität; neue Plugins sollten generische Channel-SDK-Unterpfade verwenden |
    | `plugin-sdk/telegram-account` | Veraltete Telegram-Kompatibilitätsfassade für Kontoauflösung für nachverfolgte Besitzerkompatibilität; neue Plugins sollten injizierte Runtime-Hilfen oder generische Channel-SDK-Unterpfade verwenden |
    | `plugin-sdk/zalouser` | Veraltete Zalo-Personal-Kompatibilitätsfassade für veröffentlichte Lark/Zalo-Pakete, die weiterhin die Autorisierung von Absenderbefehlen importieren; neue Plugins sollten `plugin-sdk/command-auth` verwenden |
    | `plugin-sdk/interactive-runtime` | Hilfen für semantische Nachrichtendarstellung, Zustellung und ältere interaktive Antworten. Siehe [Nachrichtendarstellung](/de/plugins/message-presentation) |
    | `plugin-sdk/channel-inbound` | Kompatibilitäts-Barrel für eingehende Entprellung, Erwähnungsabgleich, Mention-Policy-Hilfen und Envelope-Hilfen |
    | `plugin-sdk/channel-inbound-debounce` | Schmale Hilfen zur eingehenden Entprellung |
    | `plugin-sdk/channel-mention-gating` | Schmale Mention-Policy-, Mention-Marker- und Mention-Text-Hilfen ohne die breitere eingehende Runtime-Oberfläche |
    | `plugin-sdk/channel-envelope` | Schmale Hilfen zur Formatierung eingehender Envelopes |
    | `plugin-sdk/channel-location` | Channel-Standortkontext und Formatierungshilfen |
    | `plugin-sdk/channel-logging` | Channel-Logging-Hilfen für eingehende Verwerfungen und Typing-/Ack-Fehler |
    | `plugin-sdk/channel-send-result` | Antwort-Ergebnistypen |
    | `plugin-sdk/channel-actions` | Hilfen für Channel-Nachrichtenaktionen sowie veraltete native Schema-Hilfen, die für Plugin-Kompatibilität beibehalten werden |
    | `plugin-sdk/channel-route` | Gemeinsame Hilfen für Routennormalisierung, parsergesteuerte Zielauflösung, Stringifizierung von Thread-IDs, Deduplizierung/kompakte Routenschlüssel, geparste Zieltypen und Routen-/Zielvergleich |
    | `plugin-sdk/channel-targets` | Hilfen zum Parsen von Zielen; Aufrufer für Routenvergleiche sollten `plugin-sdk/channel-route` verwenden |
    | `plugin-sdk/channel-contract` | Channel-Vertragstypen |
    | `plugin-sdk/channel-feedback` | Verdrahtung für Feedback/Reaktionen |
    | `plugin-sdk/channel-secret-runtime` | Schmale Hilfen für Secret-Verträge wie `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment` und Secret-Zieltypen |
  </Accordion>

  <Accordion title="Provider-Unterpfade">
    | Unterpfad | Wichtige Exporte |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/lmstudio` | Unterstützte LM Studio-Provider-Fassade für Einrichtung, Katalogerkennung und Laufzeit-Modellvorbereitung |
    | `plugin-sdk/lmstudio-runtime` | Unterstützte LM Studio-Laufzeit-Fassade für lokale Server-Standards, Modellerkennung, Request-Header und Helfer für geladene Modelle |
    | `plugin-sdk/provider-setup` | Kuratierte Setup-Helfer für lokale/selbstgehostete Provider |
    | `plugin-sdk/self-hosted-provider-setup` | Fokussierte Setup-Helfer für OpenAI-kompatible selbstgehostete Provider |
    | `plugin-sdk/cli-backend` | CLI-Backend-Standards + Watchdog-Konstanten |
    | `plugin-sdk/provider-auth-runtime` | Laufzeit-Helfer zur API-Schlüssel-Auflösung für Provider-Plugins |
    | `plugin-sdk/provider-auth-api-key` | API-Schlüssel-Onboarding-/Profil-Schreibhelfer wie `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | Standardmäßiger OAuth-Auth-Result-Builder |
    | `plugin-sdk/provider-auth-login` | Gemeinsame interaktive Login-Helfer für Provider-Plugins |
    | `plugin-sdk/provider-env-vars` | Helfer zur Provider-Auth-Env-Var-Suche |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, gemeinsame Replay-Policy-Builder, Provider-Endpoint-Helfer und Helfer zur Normalisierung von Modell-IDs wie `normalizeNativeXaiModelId` |
    | `plugin-sdk/provider-catalog-runtime` | Laufzeit-Hook zur Provider-Katalogerweiterung und Plugin-Provider-Registry-Seams für Vertragstests |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | Generische Provider-HTTP-/Endpoint-Capability-Helfer, Provider-HTTP-Fehler und Multipart-Form-Helfer für Audiotranskription |
    | `plugin-sdk/provider-web-fetch-contract` | Enge Web-Fetch-Konfigurations-/Auswahlvertrag-Helfer wie `enablePluginInConfig` und `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | Web-Fetch-Provider-Registrierungs-/Cache-Helfer |
    | `plugin-sdk/provider-web-search-config-contract` | Enge Web-Search-Konfigurations-/Credential-Helfer für Provider, die keine Plugin-Aktivierungsverdrahtung benötigen |
    | `plugin-sdk/provider-web-search-contract` | Enge Web-Search-Konfigurations-/Credential-Vertrag-Helfer wie `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` und bereichsgebundene Credential-Setter/-Getter |
    | `plugin-sdk/provider-web-search` | Web-Search-Provider-Registrierungs-/Cache-/Laufzeit-Helfer |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, Gemini-Schema-Bereinigung + Diagnose und xAI-Kompatibilitätshelfer wie `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
    | `plugin-sdk/provider-usage` | `fetchClaudeUsage` und Ähnliches |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, Stream-Wrapper-Typen und gemeinsame Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot-Wrapper-Helfer |
    | `plugin-sdk/provider-transport-runtime` | Native Provider-Transport-Helfer wie geschütztes Fetch, Transportnachrichten-Transformationen und beschreibbare Transportereignis-Streams |
    | `plugin-sdk/provider-onboard` | Helfer für Onboarding-Konfigurations-Patches |
    | `plugin-sdk/global-singleton` | Prozesslokale Singleton-/Map-/Cache-Helfer |
    | `plugin-sdk/group-activation` | Enge Helfer für Gruppenaktivierungsmodus und Befehlsparsing |
  </Accordion>

  <Accordion title="Auth- und Sicherheits-Unterpfade">
    | Unterpfad | Wichtige Exporte |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, Befehlsregistrierungs-Helfer einschließlich dynamischer Argumentmenü-Formatierung, Helfer zur Absenderautorisierung |
    | `plugin-sdk/command-status` | Befehls-/Hilfenachrichten-Builder wie `buildCommandsMessagePaginated` und `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | Genehmigerauflösung und Same-Chat-Action-Auth-Helfer |
    | `plugin-sdk/approval-client-runtime` | Native Exec-Genehmigungsprofil-/Filter-Helfer |
    | `plugin-sdk/approval-delivery-runtime` | Native Genehmigungs-Capability-/Delivery-Adapter |
    | `plugin-sdk/approval-gateway-runtime` | Gemeinsamer Helfer zur Genehmigungs-Gateway-Auflösung |
    | `plugin-sdk/approval-handler-adapter-runtime` | Leichtgewichtige native Genehmigungsadapter-Ladehelfer für Hot-Channel-Einstiegspunkte |
    | `plugin-sdk/approval-handler-runtime` | Breitere Laufzeit-Helfer für Genehmigungshandler; bevorzugen Sie die engeren Adapter-/Gateway-Seams, wenn sie ausreichen |
    | `plugin-sdk/approval-native-runtime` | Native Genehmigungsziel- + Kontobindungshelfer |
    | `plugin-sdk/approval-reply-runtime` | Exec-/Plugin-Genehmigungsantwort-Payload-Helfer |
    | `plugin-sdk/approval-runtime` | Exec-/Plugin-Genehmigungs-Payload-Helfer, native Genehmigungsrouting-/Laufzeit-Helfer und strukturierte Genehmigungsanzeige-Helfer wie `formatApprovalDisplayPath` |
    | `plugin-sdk/reply-dedupe` | Enge Helfer zum Zurücksetzen der Deduplizierung eingehender Antworten |
    | `plugin-sdk/channel-contract-testing` | Enge Channel-Vertragstest-Helfer ohne das breite Testing-Barrel |
    | `plugin-sdk/command-auth-native` | Native Befehls-Auth, dynamische Argumentmenü-Formatierung und native Session-Target-Helfer |
    | `plugin-sdk/command-detection` | Gemeinsame Befehlserkennungs-Helfer |
    | `plugin-sdk/command-primitives-runtime` | Leichtgewichtige Befehlstext-Prädikate für Hot-Channel-Pfade |
    | `plugin-sdk/command-surface` | Befehlsrumpf-Normalisierung und Command-Surface-Helfer |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | Enge Secret-Contract-Sammlungshelfer für Channel-/Plugin-Secret-Oberflächen |
    | `plugin-sdk/secret-ref-runtime` | Enge `coerceSecretRef`- und SecretRef-Typisierungshelfer für Secret-Contract-/Konfigurationsparsing |
    | `plugin-sdk/security-runtime` | Gemeinsame Helfer für Vertrauen, DM-Gating, externe Inhalte, Schwärzung sensibler Texte, Secret-Vergleich in konstanter Zeit und Secret-Sammlung |
    | `plugin-sdk/ssrf-policy` | Host-Allowlist- und Private-Network-SSRF-Policy-Helfer |
    | `plugin-sdk/ssrf-dispatcher` | Enge Pinned-Dispatcher-Helfer ohne die breite Infra-Laufzeitoberfläche |
    | `plugin-sdk/ssrf-runtime` | Pinned-Dispatcher, SSRF-geschütztes Fetch, SSRF-Fehler und SSRF-Policy-Helfer |
    | `plugin-sdk/secret-input` | Helfer zum Parsen von Secret-Eingaben |
    | `plugin-sdk/webhook-ingress` | Webhook-Request-/Target-Helfer und Raw-Websocket-/Body-Koersion |
    | `plugin-sdk/webhook-request-guards` | Helfer für Request-Body-Größe/Timeout |
  </Accordion>

  <Accordion title="Runtime- und Speicherunterpfade">
    | Unterpfad | Wichtige Exporte |
    | --- | --- |
    | `plugin-sdk/runtime` | Breite Hilfsfunktionen für Laufzeit, Protokollierung, Backup und Plugin-Installation |
    | `plugin-sdk/runtime-env` | Schlanke Hilfsfunktionen für Laufzeitumgebung, Logger, Zeitüberschreitung, Wiederholung und Backoff |
    | `plugin-sdk/browser-config` | Unterstützte Browser-Konfigurationsfassade für normalisierte Profile/Standardwerte, CDP-URL-Parsing und Hilfsfunktionen für Browser-Steuerungsauthentifizierung |
    | `plugin-sdk/channel-runtime-context` | Allgemeine Hilfsfunktionen für Registrierung und Suche von Kanal-Laufzeitkontexten |
    | `plugin-sdk/matrix` | Veraltete Matrix-Kompatibilitätsfassade für ältere Drittanbieter-Kanalpakete; neue Plugins sollten `plugin-sdk/run-command` direkt importieren |
    | `plugin-sdk/mattermost` | Veraltete Mattermost-Kompatibilitätsfassade für ältere Drittanbieter-Kanalpakete; neue Plugins sollten generische SDK-Unterpfade direkt importieren |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Gemeinsame Hilfsfunktionen für Plugin-Befehle, Hooks, HTTP und Interaktivität |
    | `plugin-sdk/hook-runtime` | Gemeinsame Hilfsfunktionen für Webhook/interne Hook-Pipelines |
    | `plugin-sdk/lazy-runtime` | Hilfsfunktionen für verzögerte Laufzeitimporte/-bindungen wie `createLazyRuntimeModule`, `createLazyRuntimeMethod` und `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | Hilfsfunktionen für Prozessausführung |
    | `plugin-sdk/cli-runtime` | Hilfsfunktionen für CLI-Formatierung, Warten, Version, Argumentaufruf und verzögerte Befehlsgruppen |
    | `plugin-sdk/gateway-runtime` | Gateway-Client, Hilfsfunktion zum Start eines event-loop-bereiten Clients, Gateway-CLI-RPC, Gateway-Protokollfehler und Hilfsfunktionen für Kanalstatus-Patches |
    | `plugin-sdk/config-types` | Reine Typ-Konfigurationsoberfläche für Plugin-Konfigurationsformen wie `OpenClawConfig` und Kanal-/Provider-Konfigurationstypen |
    | `plugin-sdk/plugin-config-runtime` | Hilfsfunktionen für Laufzeit-Plugin-Konfigurationssuche wie `requireRuntimeConfig`, `resolvePluginConfigObject` und `resolveLivePluginConfigObject` |
    | `plugin-sdk/config-mutation` | Transaktionale Hilfsfunktionen für Konfigurationsänderungen wie `mutateConfigFile`, `replaceConfigFile` und `logConfigUpdated` |
    | `plugin-sdk/runtime-config-snapshot` | Hilfsfunktionen für Snapshots der aktuellen Prozesskonfiguration wie `getRuntimeConfig`, `getRuntimeConfigSnapshot` und Test-Snapshot-Setter |
    | `plugin-sdk/telegram-command-config` | Normalisierung von Telegram-Befehlsnamen/-beschreibungen sowie Duplikat-/Konfliktprüfungen, auch wenn die gebündelte Telegram-Vertragsoberfläche nicht verfügbar ist |
    | `plugin-sdk/text-autolink-runtime` | Erkennung von Dateireferenz-Autolinks ohne das breite Text-Laufzeit-Barrel |
    | `plugin-sdk/approval-runtime` | Hilfsfunktionen für Exec-/Plugin-Genehmigungen, Ersteller für Genehmigungsfähigkeiten, Auth-/Profil-Hilfsfunktionen, native Routing-/Laufzeit-Hilfsfunktionen und Formatierung strukturierter Genehmigungsanzeigepfade |
    | `plugin-sdk/reply-runtime` | Gemeinsame Hilfsfunktionen für Laufzeit von Eingang/Antwort, Chunking, Dispatch, Heartbeat, Antwortplaner |
    | `plugin-sdk/reply-dispatch-runtime` | Schlanke Hilfsfunktionen für Antwort-Dispatch/-Abschluss und Gesprächslabels |
    | `plugin-sdk/reply-history` | Gemeinsame Hilfsfunktionen und Marker für Antwortverlauf in kurzem Zeitfenster wie `buildHistoryContext`, `HISTORY_CONTEXT_MARKER`, `recordPendingHistoryEntry` und `clearHistoryEntriesIfEnabled` |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | Schlanke Hilfsfunktionen für Text-/Markdown-Chunking |
    | `plugin-sdk/session-store-runtime` | Hilfsfunktionen für Sitzungsspeicherpfad, Sitzungsschlüssel, Aktualisierungszeitpunkt und Speicheränderungen |
    | `plugin-sdk/cron-store-runtime` | Hilfsfunktionen für Cron-Speicherpfad/Laden/Speichern |
    | `plugin-sdk/state-paths` | Hilfsfunktionen für Status-/OAuth-Verzeichnispfade |
    | `plugin-sdk/routing` | Hilfsfunktionen für Routing/Sitzungsschlüssel/Kontobindung wie `resolveAgentRoute`, `buildAgentSessionKey` und `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | Gemeinsame Hilfsfunktionen für Kanal-/Kontostatuszusammenfassung, Standardwerte für Laufzeitstatus und Problemmetadaten |
    | `plugin-sdk/target-resolver-runtime` | Gemeinsame Hilfsfunktionen für Zielauflösung |
    | `plugin-sdk/string-normalization-runtime` | Hilfsfunktionen für Slug-/Zeichenfolgennormalisierung |
    | `plugin-sdk/request-url` | Zeichenfolgen-URLs aus fetch-/request-ähnlichen Eingaben extrahieren |
    | `plugin-sdk/run-command` | Zeitgesteuerter Befehls-Runner mit normalisierten stdout-/stderr-Ergebnissen |
    | `plugin-sdk/param-readers` | Gemeinsame Tool-/CLI-Parameterleser |
    | `plugin-sdk/tool-payload` | Normalisierte Payloads aus Tool-Ergebnisobjekten extrahieren |
    | `plugin-sdk/tool-send` | Kanonische Sendeziel-Felder aus Tool-Argumenten extrahieren |
    | `plugin-sdk/temp-path` | Gemeinsame Hilfsfunktionen für temporäre Downloadpfade |
    | `plugin-sdk/logging-core` | Hilfsfunktionen für Subsystem-Logger und Schwärzung |
    | `plugin-sdk/markdown-table-runtime` | Hilfsfunktionen für Markdown-Tabellenmodus und Konvertierung |
    | `plugin-sdk/model-session-runtime` | Hilfsfunktionen für Modell-/Sitzungsüberschreibungen wie `applyModelOverrideToSessionEntry` und `resolveAgentMaxConcurrent` |
    | `plugin-sdk/talk-config-runtime` | Hilfsfunktionen zur Auflösung der Talk-Provider-Konfiguration |
    | `plugin-sdk/json-store` | Kleine Hilfsfunktionen zum Lesen/Schreiben von JSON-Status |
    | `plugin-sdk/file-lock` | Wiedereintrittsfähige Hilfsfunktionen für Dateisperren |
    | `plugin-sdk/persistent-dedupe` | Hilfsfunktionen für festplattenbasierten Dedupe-Cache |
    | `plugin-sdk/acp-runtime` | Hilfsfunktionen für ACP-Laufzeit/Sitzung und Antwort-Dispatch |
    | `plugin-sdk/acp-runtime-backend` | Leichtgewichtige Hilfsfunktionen für ACP-Backend-Registrierung und Antwort-Dispatch für beim Start geladene Plugins |
    | `plugin-sdk/acp-binding-resolve-runtime` | Schreibgeschützte ACP-Bindungsauflösung ohne Lifecycle-Startimporte |
    | `plugin-sdk/agent-config-primitives` | Schlanke Primitive für Agent-Laufzeit-Konfigurationsschema |
    | `plugin-sdk/boolean-param` | Lockerer boolescher Parameterleser |
    | `plugin-sdk/dangerous-name-runtime` | Hilfsfunktionen zur Auflösung gefährlicher Namensübereinstimmungen |
    | `plugin-sdk/device-bootstrap` | Hilfsfunktionen für Geräte-Bootstrap und Pairing-Token |
    | `plugin-sdk/extension-shared` | Gemeinsame Primitive für passive Kanäle, Status und Umgebungs-Proxy-Hilfsfunktionen |
    | `plugin-sdk/models-provider-runtime` | Hilfsfunktionen für `/models`-Befehl/Provider-Antwort |
    | `plugin-sdk/skill-commands-runtime` | Hilfsfunktionen zum Auflisten von Skill-Befehlen |
    | `plugin-sdk/native-command-registry` | Hilfsfunktionen für native Befehlsregistrierung/Erstellung/Serialisierung |
    | `plugin-sdk/agent-harness` | Experimentelle Oberfläche für vertrauenswürdige Plugins für Low-Level-Agent-Harnesse: Harness-Typen, Hilfsfunktionen zum Steuern/Abbrechen aktiver Ausführungen, Hilfsfunktionen für OpenClaw-Tool-Bridge, Tool-Richtlinien-Hilfsfunktionen für Laufzeitpläne, Klassifizierung von Terminalergebnissen, Formatierungs-/Detailhilfsfunktionen für Tool-Fortschritt und Hilfsprogramme für Versuchsergebnisse |
    | `plugin-sdk/provider-zai-endpoint` | Hilfsfunktionen zur Erkennung von Z.AI-Endpunkten |
    | `plugin-sdk/async-lock-runtime` | Prozesslokale Async-Lock-Hilfsfunktion für kleine Laufzeitstatusdateien |
    | `plugin-sdk/channel-activity-runtime` | Telemetrie-Hilfsfunktion für Kanalaktivität |
    | `plugin-sdk/concurrency-runtime` | Hilfsfunktion für begrenzte asynchrone Task-Parallelität |
    | `plugin-sdk/dedupe-runtime` | Hilfsfunktionen für In-Memory-Dedupe-Cache |
    | `plugin-sdk/delivery-queue-runtime` | Hilfsfunktion zum Leeren ausstehender ausgehender Zustellungen |
    | `plugin-sdk/file-access-runtime` | Hilfsfunktionen für sichere lokale Datei- und Medienquellenpfade |
    | `plugin-sdk/heartbeat-runtime` | Hilfsfunktionen für Heartbeat-Ereignisse und Sichtbarkeit |
    | `plugin-sdk/number-runtime` | Hilfsfunktion für numerische Umwandlung |
    | `plugin-sdk/secure-random-runtime` | Hilfsfunktionen für sichere Token/UUIDs |
    | `plugin-sdk/system-event-runtime` | Hilfsfunktionen für Systemereigniswarteschlangen |
    | `plugin-sdk/transport-ready-runtime` | Hilfsfunktion zum Warten auf Transportbereitschaft |
    | `plugin-sdk/infra-runtime` | Veralteter Kompatibilitäts-Shim; verwenden Sie die fokussierten Laufzeitunterpfade oben |
    | `plugin-sdk/collection-runtime` | Kleine Hilfsfunktionen für begrenzte Caches |
    | `plugin-sdk/diagnostic-runtime` | Hilfsfunktionen für Diagnoseflags, Ereignisse und Trace-Kontext |
    | `plugin-sdk/error-runtime` | Fehlergraph, Formatierung, gemeinsame Hilfsfunktionen zur Fehlerklassifizierung, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | Umhülltes Fetch, Proxy, `EnvHttpProxyAgent`-Option und Hilfsfunktionen für gepinnte Lookups |
    | `plugin-sdk/runtime-fetch` | Dispatcher-bewusstes Laufzeit-Fetch ohne Proxy-/Guarded-Fetch-Importe |
    | `plugin-sdk/response-limit-runtime` | Begrenzter Response-Body-Reader ohne die breite Medien-Laufzeitoberfläche |
    | `plugin-sdk/session-binding-runtime` | Aktueller Bindungsstatus des Gesprächs ohne konfiguriertes Bindungsrouting oder Pairing-Speicher |
    | `plugin-sdk/session-store-runtime` | Hilfsfunktionen für Sitzungsspeicher ohne breite Konfigurationsschreib-/Wartungsimporte |
    | `plugin-sdk/context-visibility-runtime` | Auflösung der Kontextsichtbarkeit und ergänzende Kontextfilterung ohne breite Konfigurations-/Sicherheitsimporte |
    | `plugin-sdk/string-coerce-runtime` | Schlanke Hilfsfunktionen für primitive Datensatz-/Zeichenfolgenumwandlung und -normalisierung ohne Markdown-/Logging-Importe |
    | `plugin-sdk/host-runtime` | Hilfsfunktionen für Hostnamen- und SCP-Hostnormalisierung |
    | `plugin-sdk/retry-runtime` | Hilfsfunktionen für Wiederholungskonfiguration und Wiederholungs-Runner |
    | `plugin-sdk/agent-runtime` | Hilfsfunktionen für Agent-Verzeichnis/Identität/Arbeitsbereich |
    | `plugin-sdk/directory-runtime` | Konfigurationsgestützte Verzeichnisabfrage/-Deduplizierung |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Capability- und Test-Unterpfade">
    | Unterpfad | Wichtige Exporte |
    | --- | --- |
    | `plugin-sdk/media-runtime` | Gemeinsame Hilfsfunktionen zum Abrufen/Transformieren/Speichern von Medien, ffprobe-gestützte Ermittlung von Videodimensionen und Builder für Medien-Payloads |
    | `plugin-sdk/media-store` | Schmale Hilfsfunktionen für den Medienspeicher wie `saveMediaBuffer` |
    | `plugin-sdk/media-generation-runtime` | Gemeinsame Failover-Hilfsfunktionen für die Mediengenerierung, Kandidatenauswahl und Meldungen zu fehlenden Modellen |
    | `plugin-sdk/media-understanding` | Provider-Typen für Medienverständnis sowie bild-/audioorientierte Hilfsexporte für Provider |
    | `plugin-sdk/text-runtime` | Gemeinsame Hilfsfunktionen für Text/Markdown/Logging, etwa Entfernen von für Assistenten sichtbarem Text, Markdown-Render-/Chunking-/Tabellenhilfen, Redaktionshilfen, Directive-Tag-Hilfen und Safe-Text-Utilities |
    | `plugin-sdk/text-chunking` | Hilfsfunktion für ausgehendes Text-Chunking |
    | `plugin-sdk/speech` | Sprach-Provider-Typen sowie providerorientierte Exporte für Directives, Registry, Validierung, OpenAI-kompatiblen TTS-Builder und Sprachhilfen |
    | `plugin-sdk/speech-core` | Gemeinsame Sprach-Provider-Typen, Registry-, Directive-, Normalisierungs- und Sprachhilfen |
    | `plugin-sdk/realtime-transcription` | Provider-Typen für Echtzeit-Transkription, Registry-Hilfsfunktionen und gemeinsame Hilfsfunktion für WebSocket-Sitzungen |
    | `plugin-sdk/realtime-voice` | Provider-Typen für Echtzeit-Sprache und Registry-Hilfsfunktionen |
    | `plugin-sdk/image-generation` | Provider-Typen für Bildgenerierung sowie Hilfen für Bild-Assets/Daten-URLs und der OpenAI-kompatible Bild-Provider-Builder |
    | `plugin-sdk/image-generation-core` | Gemeinsame Typen für Bildgenerierung, Failover-, Auth- und Registry-Hilfen |
    | `plugin-sdk/music-generation` | Provider-/Request-/Result-Typen für Musikgenerierung |
    | `plugin-sdk/music-generation-core` | Gemeinsame Typen für Musikgenerierung, Failover-Hilfen, Provider-Lookup und Model-Ref-Parsing |
    | `plugin-sdk/video-generation` | Provider-/Request-/Result-Typen für Videogenerierung |
    | `plugin-sdk/video-generation-core` | Gemeinsame Typen für Videogenerierung, Failover-Hilfen, Provider-Lookup und Model-Ref-Parsing |
    | `plugin-sdk/webhook-targets` | Webhook-Ziel-Registry und Hilfen zur Routeninstallation |
    | `plugin-sdk/webhook-path` | Hilfsfunktionen zur Normalisierung von Webhook-Pfaden |
    | `plugin-sdk/web-media` | Gemeinsame Hilfsfunktionen zum Laden entfernter/lokaler Medien |
    | `plugin-sdk/zod` | Re-exportiertes `zod` für Plugin-SDK-Nutzer |
    | `plugin-sdk/testing` | Breites Kompatibilitäts-Barrel für ältere Plugin-Tests. Neue Erweiterungstests sollten stattdessen fokussierte SDK-Unterpfade wie `plugin-sdk/agent-runtime-test-contracts`, `plugin-sdk/plugin-test-runtime`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/test-env` oder `plugin-sdk/test-fixtures` importieren |
    | `plugin-sdk/plugin-test-api` | Minimaler `createTestPluginApi`-Helper für direkte Plugin-Registrierungs-Unit-Tests ohne Import von Repo-Test-Helper-Bridges |
    | `plugin-sdk/agent-runtime-test-contracts` | Native Contract-Fixtures für Agent-Runtime-Adapter für Auth-, Delivery-, Fallback-, Tool-Hook-, Prompt-Overlay-, Schema- und Transcript-Projection-Tests |
    | `plugin-sdk/channel-test-helpers` | Kanalorientierte Testhilfen für generische Action-/Setup-/Status-Contracts, Directory-Assertions, Account-Startup-Lifecycle, Send-Config-Threading, Runtime-Mocks, Statusprobleme, ausgehende Zustellung und Hook-Registrierung |
    | `plugin-sdk/channel-target-testing` | Gemeinsame Suite für Fehlerfälle der Zielauflösung in Kanaltests |
    | `plugin-sdk/plugin-test-contracts` | Contract-Hilfen für Plugin-Paket, Registrierung, öffentliche Artefakte, direkte Importe, Runtime-API und Import-Nebeneffekte |
    | `plugin-sdk/provider-test-contracts` | Contract-Hilfen für Provider-Runtime, Auth, Discovery, Onboarding, Catalog, Wizard, Medien-Capability, Replay-Policy, Echtzeit-STT-Live-Audio, Web-Search/Fetch und Streams |
    | `plugin-sdk/provider-http-test-mocks` | Opt-in-Vitest-HTTP-/Auth-Mocks für Provider-Tests, die `plugin-sdk/provider-http` ausüben |
    | `plugin-sdk/test-fixtures` | Generische Fixtures für CLI-Runtime-Capture, Sandbox-Kontext, Skill-Writer, Agent-Message, System-Event, Module-Reload, gebündelten Plugin-Pfad, Terminal-Text, Chunking, Auth-Token und typisierte Cases |
    | `plugin-sdk/test-node-mocks` | Fokussierte Mock-Hilfsfunktionen für integrierte Node-Module zur Verwendung in Vitest-`vi.mock("node:*")`-Factories |
  </Accordion>

  <Accordion title="Memory-Unterpfade">
    | Unterpfad | Wichtige Exporte |
    | --- | --- |
    | `plugin-sdk/memory-core` | Gebündelte memory-core-Hilfsoberfläche für Manager-/Config-/Datei-/CLI-Hilfen |
    | `plugin-sdk/memory-core-engine-runtime` | Runtime-Fassade für Memory-Index/-Suche |
    | `plugin-sdk/memory-core-host-engine-foundation` | Exporte der Memory-Host-Foundation-Engine |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Memory-Host-Embedding-Contracts, Registry-Zugriff, lokaler Provider und generische Batch-/Remote-Hilfen |
    | `plugin-sdk/memory-core-host-engine-qmd` | Exporte der Memory-Host-QMD-Engine |
    | `plugin-sdk/memory-core-host-engine-storage` | Exporte der Memory-Host-Storage-Engine |
    | `plugin-sdk/memory-core-host-multimodal` | Multimodale Memory-Host-Hilfen |
    | `plugin-sdk/memory-core-host-query` | Memory-Host-Query-Hilfen |
    | `plugin-sdk/memory-core-host-secret` | Memory-Host-Secret-Hilfen |
    | `plugin-sdk/memory-core-host-events` | Hilfen für das Memory-Host-Event-Journal |
    | `plugin-sdk/memory-core-host-status` | Memory-Host-Statushilfen |
    | `plugin-sdk/memory-core-host-runtime-cli` | CLI-Runtime-Hilfen für Memory-Host |
    | `plugin-sdk/memory-core-host-runtime-core` | Core-Runtime-Hilfen für Memory-Host |
    | `plugin-sdk/memory-core-host-runtime-files` | Datei-/Runtime-Hilfen für Memory-Host |
    | `plugin-sdk/memory-host-core` | Vendor-neutraler Alias für Core-Runtime-Hilfen des Memory-Host |
    | `plugin-sdk/memory-host-events` | Vendor-neutraler Alias für Hilfen zum Event-Journal des Memory-Host |
    | `plugin-sdk/memory-host-files` | Vendor-neutraler Alias für Datei-/Runtime-Hilfen des Memory-Host |
    | `plugin-sdk/memory-host-markdown` | Gemeinsame Managed-Markdown-Hilfen für Plugins im Umfeld von Memory |
    | `plugin-sdk/memory-host-search` | Active Memory-Runtime-Fassade für Search-Manager-Zugriff |
    | `plugin-sdk/memory-host-status` | Vendor-neutraler Alias für Statushilfen des Memory-Host |
  </Accordion>

  <Accordion title="Reservierte Unterpfade für gebündelte Hilfsfunktionen">
    Derzeit gibt es keine reservierten SDK-Unterpfade für gebündelte Hilfsfunktionen. Eigentümerspezifische
    Hilfsfunktionen befinden sich im jeweiligen Plugin-Paket, während wiederverwendbare Host-Contracts
    generische SDK-Unterpfade wie `plugin-sdk/gateway-runtime`,
    `plugin-sdk/security-runtime` und `plugin-sdk/plugin-config-runtime` verwenden.
  </Accordion>
</AccordionGroup>

## Verwandt

- [Plugin-SDK-Überblick](/de/plugins/sdk-overview)
- [Plugin-SDK-Einrichtung](/de/plugins/sdk-setup)
- [Plugins erstellen](/de/plugins/building-plugins)
