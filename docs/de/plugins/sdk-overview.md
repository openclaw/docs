---
read_when:
    - Sie müssen wissen, aus welchem SDK-Subpfad importiert werden soll.
    - Sie möchten eine Referenz für alle Registrierungsmethoden in `OpenClawPluginApi`.
    - Sie suchen nach einem bestimmten SDK-Export.
sidebarTitle: SDK Overview
summary: Import-Map, API-Referenz zur Registrierung und SDK-Architektur
title: Plugin SDK-Überblick
x-i18n:
    generated_at: "2026-04-18T06:12:46Z"
    model: gpt-5.4
    provider: openai
    source_hash: 05d3d0022cca32d29c76f6cea01cdf4f88ac69ef0ef3d7fb8a60fbf9a6b9b331
    source_path: plugins/sdk-overview.md
    workflow: 15
---

# Plugin SDK-Überblick

Das Plugin SDK ist der typisierte Vertrag zwischen Plugins und dem Core. Diese Seite ist die
Referenz dafür, **was importiert werden soll** und **was Sie registrieren können**.

<Tip>
  **Suchen Sie nach einer Schritt-für-Schritt-Anleitung?**
  - Erstes Plugin? Beginnen Sie mit [Erste Schritte](/de/plugins/building-plugins)
  - Channel-Plugin? Siehe [Channel Plugins](/de/plugins/sdk-channel-plugins)
  - Provider-Plugin? Siehe [Provider Plugins](/de/plugins/sdk-provider-plugins)
</Tip>

## Importkonvention

Importieren Sie immer aus einem bestimmten Subpfad:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

Jeder Subpfad ist ein kleines, in sich geschlossenes Modul. Dadurch bleibt der Start schnell und
Probleme mit zirkulären Abhängigkeiten werden vermieden. Für Channel-spezifische Entry-/Build-Helper
sollten Sie `openclaw/plugin-sdk/channel-core` bevorzugen; verwenden Sie `openclaw/plugin-sdk/core` für
die breitere übergeordnete Oberfläche und gemeinsame Helper wie
`buildChannelConfigSchema`.

Fügen Sie keine providerbenannten Convenience-Seams wie
`openclaw/plugin-sdk/slack`, `openclaw/plugin-sdk/discord`,
`openclaw/plugin-sdk/signal`, `openclaw/plugin-sdk/whatsapp` oder
helper-Seams mit Channel-Branding hinzu und hängen Sie auch nicht davon ab. Gebündelte Plugins sollten generische
SDK-Subpfade innerhalb ihrer eigenen `api.ts`- oder `runtime-api.ts`-Barrels zusammensetzen, und der Core
sollte entweder diese pluginlokalen Barrels verwenden oder einen schmalen generischen SDK-
Vertrag hinzufügen, wenn der Bedarf wirklich kanalübergreifend ist.

Die generierte Export-Map enthält weiterhin eine kleine Menge an Helper-Seams für gebündelte Plugins
wie `plugin-sdk/feishu`, `plugin-sdk/feishu-setup`,
`plugin-sdk/zalo`, `plugin-sdk/zalo-setup` und `plugin-sdk/matrix*`. Diese
Subpfade existieren nur für die Wartung gebündelter Plugins und zur Kompatibilität; sie werden
absichtlich aus der untenstehenden allgemeinen Tabelle ausgelassen und sind nicht der empfohlene
Importpfad für neue Drittanbieter-Plugins.

## Subpfad-Referenz

Die am häufigsten verwendeten Subpfade, nach Zweck gruppiert. Die generierte vollständige Liste mit
mehr als 200 Subpfaden befindet sich in `scripts/lib/plugin-sdk-entrypoints.json`.

Reservierte Helper-Subpfade für gebündelte Plugins erscheinen weiterhin in dieser generierten Liste.
Behandeln Sie diese als Implementierungsdetail-/Kompatibilitätsoberflächen, es sei denn, eine Dokumentationsseite
kennzeichnet ausdrücklich einen davon als öffentlich.

### Plugin-Entry

| Subpfad                    | Wichtige Exporte                                                                                                                      |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/plugin-entry`   | `definePluginEntry`                                                                                                                   |
| `plugin-sdk/core`           | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema` |
| `plugin-sdk/config-schema`  | `OpenClawSchema`                                                                                                                      |
| `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry`                                                                                                     |

<AccordionGroup>
  <Accordion title="Channel-Subpfade">
    | Subpfad | Wichtige Exporte |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | Root-`openclaw.json`-Zod-Schema-Export (`OpenClawSchema`) |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, plus `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | Gemeinsame Helper für Setup-Assistenten, Allowlist-Aufforderungen, Builder für den Setup-Status |
    | `plugin-sdk/setup-runtime` | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | `createEnvPatchedAccountSetupAdapter` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | Helper für Multi-Account-Konfiguration/Aktions-Gates, Default-Account-Fallback-Helper |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, Helper zur Normalisierung von Account-IDs |
    | `plugin-sdk/account-resolution` | Helper für Account-Lookup + Default-Fallback |
    | `plugin-sdk/account-helpers` | Schmale Helper für Account-Listen/Account-Aktionen |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | `createChannelReplyPipeline` |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter` |
    | `plugin-sdk/channel-config-schema` | Typen für Channel-Konfigurationsschemata |
    | `plugin-sdk/telegram-command-config` | Helper zur Normalisierung/Validierung benutzerdefinierter Telegram-Befehle mit Fallback auf gebündelte Verträge |
    | `plugin-sdk/command-gating` | Schmale Helper für Gates zur Befehlsautorisierung |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-lifecycle` | `createAccountStatusSink` |
    | `plugin-sdk/inbound-envelope` | Gemeinsame Helper für eingehende Routen und Envelope-Builder |
    | `plugin-sdk/inbound-reply-dispatch` | Gemeinsame Helper zum Erfassen und Verteilen eingehender Daten |
    | `plugin-sdk/messaging-targets` | Helper zum Parsen/Abgleichen von Zielen |
    | `plugin-sdk/outbound-media` | Gemeinsame Helper zum Laden ausgehender Medien |
    | `plugin-sdk/outbound-runtime` | Helper für ausgehende Identität/Sende-Delegates |
    | `plugin-sdk/poll-runtime` | Schmale Helper zur Normalisierung von Polls |
    | `plugin-sdk/thread-bindings-runtime` | Helper für den Lebenszyklus von Thread-Bindings und Adapter |
    | `plugin-sdk/agent-media-payload` | Veralteter Payload-Builder für Agent-Medien |
    | `plugin-sdk/conversation-runtime` | Helper für Conversation-/Thread-Binding, Pairing und konfigurierte Bindings |
    | `plugin-sdk/runtime-config-snapshot` | Helper für Runtime-Konfigurations-Snapshots |
    | `plugin-sdk/runtime-group-policy` | Helper zur Auflösung von Runtime-Gruppenrichtlinien |
    | `plugin-sdk/channel-status` | Gemeinsame Helper für Snapshots/Zusammenfassungen des Channel-Status |
    | `plugin-sdk/channel-config-primitives` | Schmale Primitive für Channel-Konfigurationsschemata |
    | `plugin-sdk/channel-config-writes` | Helper zur Autorisierung von Channel-Konfigurationsschreibvorgängen |
    | `plugin-sdk/channel-plugin-common` | Gemeinsame Prelude-Exporte für Channel-Plugins |
    | `plugin-sdk/allowlist-config-edit` | Helper zum Bearbeiten/Lesen von Allowlist-Konfigurationen |
    | `plugin-sdk/group-access` | Gemeinsame Helper für Entscheidungen zum Gruppenzugriff |
    | `plugin-sdk/direct-dm` | Gemeinsame Helper für Auth/Guards bei Direct-DM |
    | `plugin-sdk/interactive-runtime` | Helper zur Normalisierung/Reduktion interaktiver Antwort-Payloads |
    | `plugin-sdk/channel-inbound` | Kompatibilitäts-Barrel für Inbound-Debounce, Mention-Matching, Mention-Policy-Helper und Envelope-Helper |
    | `plugin-sdk/channel-mention-gating` | Schmale Mention-Policy-Helper ohne die breitere Inbound-Runtime-Oberfläche |
    | `plugin-sdk/channel-location` | Helper für Channel-Standortkontext und -Formatierung |
    | `plugin-sdk/channel-logging` | Channel-Logging-Helper für eingehende Drops und Fehler bei Typing/Ack |
    | `plugin-sdk/channel-send-result` | Antwortergebnis-Typen |
    | `plugin-sdk/channel-actions` | `createMessageToolButtonsSchema`, `createMessageToolCardSchema` |
    | `plugin-sdk/channel-targets` | Helper zum Parsen/Abgleichen von Zielen |
    | `plugin-sdk/channel-contract` | Typen für Channel-Verträge |
    | `plugin-sdk/channel-feedback` | Wiring für Feedback/Reaktionen |
    | `plugin-sdk/channel-secret-runtime` | Schmale Helper für Secret-Verträge wie `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment` und Secret-Zieltypen |
  </Accordion>

  <Accordion title="Provider-Subpfade">
    | Subpfad | Wichtige Exporte |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/provider-setup` | Kuratierte Setup-Helper für lokale/selbstgehostete Provider |
    | `plugin-sdk/self-hosted-provider-setup` | Fokussierte Setup-Helper für selbstgehostete OpenAI-kompatible Provider |
    | `plugin-sdk/cli-backend` | CLI-Backend-Standards + Watchdog-Konstanten |
    | `plugin-sdk/provider-auth-runtime` | Helper zur API-Key-Auflösung zur Laufzeit für Provider-Plugins |
    | `plugin-sdk/provider-auth-api-key` | Helper für API-Key-Onboarding/Profilschreibvorgänge wie `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | Standard-Builder für OAuth-Authentifizierungsergebnisse |
    | `plugin-sdk/provider-auth-login` | Gemeinsame Helper für interaktive Logins bei Provider-Plugins |
    | `plugin-sdk/provider-env-vars` | Helper für den Lookup von Umgebungsvariablen für Provider-Authentifizierung |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, gemeinsame Builder für Replay-Richtlinien, Provider-Endpunkt-Helper und Helper zur Normalisierung von Modell-IDs wie `normalizeNativeXaiModelId` |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | Generische Helper für HTTP-/Endpunktfunktionen von Providern |
    | `plugin-sdk/provider-web-fetch-contract` | Schmale Helper für Verträge zur Web-Fetch-Konfiguration/-Auswahl wie `enablePluginInConfig` und `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | Helper für Registrierung/Cache von Web-Fetch-Providern |
    | `plugin-sdk/provider-web-search-config-contract` | Schmale Helper für Konfiguration/Zugangsdaten der Websuche für Provider, die keine Plugin-Aktivierungsverdrahtung benötigen |
    | `plugin-sdk/provider-web-search-contract` | Schmale Helper für Verträge zu Websuch-Konfiguration/Zugangsdaten wie `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` und bereichsbezogene Setter/Getter für Zugangsdaten |
    | `plugin-sdk/provider-web-search` | Helper für Registrierung/Cache/Runtimes von Websuch-Providern |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, Bereinigung + Diagnostik von Gemini-Schemata und xAI-Kompatibilitäts-Helper wie `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
    | `plugin-sdk/provider-usage` | `fetchClaudeUsage` und ähnliche |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, Stream-Wrapper-Typen und gemeinsame Wrapper-Helper für Anthropic/Bedrock/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
    | `plugin-sdk/provider-onboard` | Helper für Onboarding-Konfigurations-Patches |
    | `plugin-sdk/global-singleton` | Prozesslokale Singleton-/Map-/Cache-Helper |
  </Accordion>

  <Accordion title="Authentifizierungs- und Sicherheits-Subpfade">
    | Subpfad | Wichtige Exporte |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, Helper für die Befehlsregistrierung, Helper für die Sender-Autorisierung |
    | `plugin-sdk/command-status` | Builder für Befehls-/Hilfenachrichten wie `buildCommandsMessagePaginated` und `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | Helper für die Auflösung von Genehmigenden und die Authentifizierung chatgleicher Aktionen |
    | `plugin-sdk/approval-client-runtime` | Helper für native Ausführungsfreigabeprofile/-filter |
    | `plugin-sdk/approval-delivery-runtime` | Native Adapter für Genehmigungsfunktionen/-zustellung |
    | `plugin-sdk/approval-gateway-runtime` | Gemeinsamer Helper zur Auflösung des Genehmigungs-Gateway |
    | `plugin-sdk/approval-handler-adapter-runtime` | Leichtgewichtige Helper zum Laden nativer Genehmigungsadapter für schnelle Channel-Entrypoints |
    | `plugin-sdk/approval-handler-runtime` | Breitere Runtime-Helper für Genehmigungshandler; bevorzugen Sie die schmaleren Adapter-/Gateway-Seams, wenn diese ausreichen |
    | `plugin-sdk/approval-native-runtime` | Native Helper für Genehmigungsziele und Account-Bindings |
    | `plugin-sdk/approval-reply-runtime` | Helper für Antwort-Payloads von Ausführungs-/Plugin-Genehmigungen |
    | `plugin-sdk/command-auth-native` | Native Befehlsauthentifizierung + native Session-Ziel-Helper |
    | `plugin-sdk/command-detection` | Gemeinsame Helper zur Befehlserkennung |
    | `plugin-sdk/command-surface` | Helper zur Normalisierung von Befehls-Textkörpern und Befehlsoberflächen |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | Schmale Helper zur Sammlung von Secret-Verträgen für Channel-/Plugin-Secret-Oberflächen |
    | `plugin-sdk/secret-ref-runtime` | Schmale `coerceSecretRef`- und SecretRef-Typing-Helper für Secret-Vertrags-/Konfigurations-Parsing |
    | `plugin-sdk/security-runtime` | Gemeinsame Helper für Vertrauen, DM-Gating, externe Inhalte und Secret-Sammlung |
    | `plugin-sdk/ssrf-policy` | Helper für Host-Allowlists und SSRF-Richtlinien für private Netzwerke |
    | `plugin-sdk/ssrf-dispatcher` | Schmale Helper für angeheftete Dispatcher ohne die breite Infra-Runtime-Oberfläche |
    | `plugin-sdk/ssrf-runtime` | Helper für angeheftete Dispatcher, SSRF-geschütztes Fetch und SSRF-Richtlinien |
    | `plugin-sdk/secret-input` | Helper zum Parsen von Secret-Eingaben |
    | `plugin-sdk/webhook-ingress` | Helper für Webhook-Anfragen/-Ziele |
    | `plugin-sdk/webhook-request-guards` | Helper für Größe/Timeout von Anfragetextkörpern |
  </Accordion>

  <Accordion title="Runtime- und Speicher-Subpfade">
    | Subpfad | Wichtige Exporte |
    | --- | --- |
    | `plugin-sdk/runtime` | Breite Runtime-/Logging-/Backup-/Plugin-Installations-Helper |
    | `plugin-sdk/runtime-env` | Schmale Helper für Runtime-Umgebung, Logger, Timeout, Retry und Backoff |
    | `plugin-sdk/channel-runtime-context` | Generische Helper für Registrierung und Lookup von Channel-Runtime-Kontexten |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Gemeinsame Helper für Plugin-Befehle/-Hooks/-HTTP/-Interaktivität |
    | `plugin-sdk/hook-runtime` | Gemeinsame Helper für Webhook-/interne Hook-Pipelines |
    | `plugin-sdk/lazy-runtime` | Helper für lazy Runtime-Importe/-Bindings wie `createLazyRuntimeModule`, `createLazyRuntimeMethod` und `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | Helper für Prozessausführung |
    | `plugin-sdk/cli-runtime` | Helper für CLI-Formatierung, Warten und Versionen |
    | `plugin-sdk/gateway-runtime` | Gateway-Client- und Channel-Status-Patch-Helper |
    | `plugin-sdk/config-runtime` | Helper zum Laden/Schreiben von Konfigurationen |
    | `plugin-sdk/telegram-command-config` | Normalisierung von Telegram-Befehlsnamen/-beschreibungen und Prüfungen auf Duplikate/Konflikte, auch wenn die gebündelte Telegram-Vertragsoberfläche nicht verfügbar ist |
    | `plugin-sdk/text-autolink-runtime` | Erkennung von Autolinks für Dateireferenzen ohne das breite `text-runtime`-Barrel |
    | `plugin-sdk/approval-runtime` | Helper für Ausführungs-/Plugin-Genehmigungen, Builder für Genehmigungsfunktionen, Auth-/Profil-Helper, native Routing-/Runtime-Helper |
    | `plugin-sdk/reply-runtime` | Gemeinsame Helper für Inbound-/Antwort-Runtime, Chunking, Dispatch, Heartbeat, Antwortplanung |
    | `plugin-sdk/reply-dispatch-runtime` | Schmale Helper für Antwort-Dispatch/-Finalisierung |
    | `plugin-sdk/reply-history` | Gemeinsame Helper für Antwortverläufe in kurzen Zeitfenstern wie `buildHistoryContext`, `recordPendingHistoryEntry` und `clearHistoryEntriesIfEnabled` |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | Schmale Helper für Text-/Markdown-Chunking |
    | `plugin-sdk/session-store-runtime` | Helper für Pfad und `updated-at` des Session Store |
    | `plugin-sdk/state-paths` | Helper für Pfade zu Zustand/OAuth-Verzeichnissen |
    | `plugin-sdk/routing` | Helper für Route-/Session-Key-/Account-Bindings wie `resolveAgentRoute`, `buildAgentSessionKey` und `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | Gemeinsame Helper für Zusammenfassungen des Channel-/Account-Status, Standards für Runtime-Zustände und Helper für Problemmetadaten |
    | `plugin-sdk/target-resolver-runtime` | Gemeinsame Helper zur Zielauflösung |
    | `plugin-sdk/string-normalization-runtime` | Helper zur Slug-/String-Normalisierung |
    | `plugin-sdk/request-url` | String-URLs aus Fetch-/Request-ähnlichen Eingaben extrahieren |
    | `plugin-sdk/run-command` | Zeitgesteuerter Befehlsrunner mit normalisierten stdout-/stderr-Ergebnissen |
    | `plugin-sdk/param-readers` | Gängige Leser für Tool-/CLI-Parameter |
    | `plugin-sdk/tool-payload` | Normalisierte Payloads aus Tool-Ergebnisobjekten extrahieren |
    | `plugin-sdk/tool-send` | Kanonische Sendeziel-Felder aus Tool-Argumenten extrahieren |
    | `plugin-sdk/temp-path` | Gemeinsame Helper für temporäre Download-Pfade |
    | `plugin-sdk/logging-core` | Helper für Subsystem-Logger und Schwärzung |
    | `plugin-sdk/markdown-table-runtime` | Helper für Markdown-Tabellenmodi |
    | `plugin-sdk/json-store` | Kleine Helper zum Lesen/Schreiben von JSON-Zuständen |
    | `plugin-sdk/file-lock` | Reentrante Dateisperr-Helper |
    | `plugin-sdk/persistent-dedupe` | Helper für festplattenbasierte Dedupe-Caches |
    | `plugin-sdk/acp-runtime` | ACP-Runtime-/Session- und Antwort-Dispatch-Helper |
    | `plugin-sdk/acp-binding-resolve-runtime` | Schreibgeschützte ACP-Binding-Auflösung ohne Lifecycle-Startup-Importe |
    | `plugin-sdk/agent-config-primitives` | Schmale Primitive für Runtime-Konfigurationsschemata von Agents |
    | `plugin-sdk/boolean-param` | Nachsichtiger Leser für boolesche Parameter |
    | `plugin-sdk/dangerous-name-runtime` | Helper zur Auflösung von Abgleichen gefährlicher Namen |
    | `plugin-sdk/device-bootstrap` | Helper für Device-Bootstrap und Pairing-Token |
    | `plugin-sdk/extension-shared` | Gemeinsame Primitive für Passive-Channel-, Status- und Ambient-Proxy-Helper |
    | `plugin-sdk/models-provider-runtime` | Helper für `/models`-Befehle und Provider-Antworten |
    | `plugin-sdk/skill-commands-runtime` | Helper für die Auflistung von Skills-Befehlen |
    | `plugin-sdk/native-command-registry` | Helper zum Registrieren/Erstellen/Serialisieren nativer Befehle |
    | `plugin-sdk/agent-harness` | Experimentelle Oberfläche für vertrauenswürdige Plugins für Low-Level-Agent-Harnesses: Harness-Typen, Helper zum Steuern/Abbrechen aktiver Ausführungen, OpenClaw-Tool-Bridge-Helper und Hilfsfunktionen für Versuchsergebnisse |
    | `plugin-sdk/provider-zai-endpoint` | Helper zur Erkennung von Z.A.I-Endpunkten |
    | `plugin-sdk/infra-runtime` | Helper für Systemereignisse/Heartbeat |
    | `plugin-sdk/collection-runtime` | Kleine Helper für begrenzte Caches |
    | `plugin-sdk/diagnostic-runtime` | Helper für Diagnose-Flags und -Ereignisse |
    | `plugin-sdk/error-runtime` | Helper für Fehlergraphen, Formatierung, gemeinsame Fehlerklassifizierung, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | Helper für umhülltes Fetch, Proxy und angehefteten Lookup |
    | `plugin-sdk/runtime-fetch` | Dispatcher-bewusstes Runtime-Fetch ohne Importe für Proxy/geschütztes Fetch |
    | `plugin-sdk/response-limit-runtime` | Begrenzter Leser für Antworttextkörper ohne die breite Medien-Runtime-Oberfläche |
    | `plugin-sdk/session-binding-runtime` | Aktueller Zustand von Conversation-Bindings ohne Routing für konfigurierte Bindings oder Pairing-Stores |
    | `plugin-sdk/session-store-runtime` | Helper zum Lesen des Session Store ohne breite Importe für Konfigurationsschreibvorgänge/Wartung |
    | `plugin-sdk/context-visibility-runtime` | Auflösung der Kontextsichtigkeit und Filterung ergänzender Kontexte ohne breite Importe für Konfiguration/Sicherheit |
    | `plugin-sdk/string-coerce-runtime` | Schmale Helper zum Umwandeln und Normalisieren primitiver Records/Strings ohne Markdown-/Logging-Importe |
    | `plugin-sdk/host-runtime` | Helper zur Normalisierung von Hostnamen und SCP-Hosts |
    | `plugin-sdk/retry-runtime` | Helper für Retry-Konfiguration und Retry-Runner |
    | `plugin-sdk/agent-runtime` | Helper für Agent-Verzeichnis/Identität/Workspace |
    | `plugin-sdk/directory-runtime` | Konfigurationsgestützte Verzeichnisabfrage/-Deduplizierung |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Funktions- und Test-Subpfade">
    | Subpfad | Wichtige Exporte |
    | --- | --- |
    | `plugin-sdk/media-runtime` | Gemeinsame Helper für Medien-Fetch/Transformation/Speicherung sowie Builder für Medien-Payloads |
    | `plugin-sdk/media-generation-runtime` | Gemeinsame Helper für Failover bei Mediengenerierung, Kandidatenauswahl und Meldungen für fehlende Modelle |
    | `plugin-sdk/media-understanding` | Typen für Provider zum Medienverständnis sowie bild-/audioseitige Helper-Exporte für Provider |
    | `plugin-sdk/text-runtime` | Gemeinsame Helper für Text/Markdown/Logging wie das Entfernen von für den Assistenten sichtbarem Text, Helper für Markdown-Rendering/Chunking/Tabellen, Helper für Schwärzung, Helper für Direktiven-Tags und Hilfsfunktionen für sicheren Text |
    | `plugin-sdk/text-chunking` | Helper für Chunking ausgehender Texte |
    | `plugin-sdk/speech` | Typen für Sprach-Provider sowie richtlinien-, registrierungs- und validierungsseitige Helper für Provider |
    | `plugin-sdk/speech-core` | Gemeinsame Typen für Sprach-Provider sowie gemeinsame Helper für Registrierung, Direktiven und Normalisierung |
    | `plugin-sdk/realtime-transcription` | Typen für Provider für Echtzeit-Transkription und Registrierungs-Helper |
    | `plugin-sdk/realtime-voice` | Typen für Provider für Echtzeit-Sprache und Registrierungs-Helper |
    | `plugin-sdk/image-generation` | Typen für Bildgenerierungs-Provider |
    | `plugin-sdk/image-generation-core` | Gemeinsame Typen für Bildgenerierung sowie Helper für Failover, Auth und Registrierung |
    | `plugin-sdk/music-generation` | Typen für Musikgenerierungs-Provider/-Anfrage/-Ergebnis |
    | `plugin-sdk/music-generation-core` | Gemeinsame Typen für Musikgenerierung sowie Helper für Failover, Provider-Lookup und Parsing von Modell-Referenzen |
    | `plugin-sdk/video-generation` | Typen für Videogenerierungs-Provider/-Anfrage/-Ergebnis |
    | `plugin-sdk/video-generation-core` | Gemeinsame Typen für Videogenerierung sowie Helper für Failover, Provider-Lookup und Parsing von Modell-Referenzen |
    | `plugin-sdk/webhook-targets` | Registrierungs- und Routeninstallations-Helper für Webhook-Ziele |
    | `plugin-sdk/webhook-path` | Helper zur Normalisierung von Webhook-Pfaden |
    | `plugin-sdk/web-media` | Gemeinsame Helper zum Laden entfernter/lokaler Medien |
    | `plugin-sdk/zod` | Re-exportiertes `zod` für Verbraucher des Plugin SDK |
    | `plugin-sdk/testing` | `installCommonResolveTargetErrorCases`, `shouldAckReaction` |
  </Accordion>

  <Accordion title="Memory-Subpfade">
    | Subpfad | Wichtige Exporte |
    | --- | --- |
    | `plugin-sdk/memory-core` | Gebündelte `memory-core`-Helper-Oberfläche für Manager-/Konfigurations-/Datei-/CLI-Helper |
    | `plugin-sdk/memory-core-engine-runtime` | Runtime-Fassade für Memory-Index/Suche |
    | `plugin-sdk/memory-core-host-engine-foundation` | Exporte der Foundation-Engine für den Memory-Host |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Embedding-Verträge für den Memory-Host, Registry-Zugriff, lokaler Provider und generische Batch-/Remote-Helper |
    | `plugin-sdk/memory-core-host-engine-qmd` | Exporte der QMD-Engine für den Memory-Host |
    | `plugin-sdk/memory-core-host-engine-storage` | Exporte der Storage-Engine für den Memory-Host |
    | `plugin-sdk/memory-core-host-multimodal` | Multimodale Helper für den Memory-Host |
    | `plugin-sdk/memory-core-host-query` | Query-Helper für den Memory-Host |
    | `plugin-sdk/memory-core-host-secret` | Secret-Helper für den Memory-Host |
    | `plugin-sdk/memory-core-host-events` | Event-Journal-Helper für den Memory-Host |
    | `plugin-sdk/memory-core-host-status` | Status-Helper für den Memory-Host |
    | `plugin-sdk/memory-core-host-runtime-cli` | CLI-Runtime-Helper für den Memory-Host |
    | `plugin-sdk/memory-core-host-runtime-core` | Core-Runtime-Helper für den Memory-Host |
    | `plugin-sdk/memory-core-host-runtime-files` | Datei-/Runtime-Helper für den Memory-Host |
    | `plugin-sdk/memory-host-core` | Herstellerneutraler Alias für Core-Runtime-Helper des Memory-Host |
    | `plugin-sdk/memory-host-events` | Herstellerneutraler Alias für Event-Journal-Helper des Memory-Host |
    | `plugin-sdk/memory-host-files` | Herstellerneutraler Alias für Datei-/Runtime-Helper des Memory-Host |
    | `plugin-sdk/memory-host-markdown` | Gemeinsame Managed-Markdown-Helper für speichernahe Plugins |
    | `plugin-sdk/memory-host-search` | Active Memory-Runtime-Fassade für den Zugriff auf den Suchmanager |
    | `plugin-sdk/memory-host-status` | Herstellerneutraler Alias für Status-Helper des Memory-Host |
    | `plugin-sdk/memory-lancedb` | Gebündelte `memory-lancedb`-Helper-Oberfläche |
  </Accordion>

  <Accordion title="Reservierte Helper-Subpfade für gebündelte Plugins">
    | Familie | Aktuelle Subpfade | Verwendungszweck |
    | --- | --- | --- |
    | Browser | `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support` | Support-Helper für das gebündelte Browser-Plugin (`browser-support` bleibt das Kompatibilitäts-Barrel) |
    | Matrix | `plugin-sdk/matrix`, `plugin-sdk/matrix-helper`, `plugin-sdk/matrix-runtime-heavy`, `plugin-sdk/matrix-runtime-shared`, `plugin-sdk/matrix-runtime-surface`, `plugin-sdk/matrix-surface`, `plugin-sdk/matrix-thread-bindings` | Gebündelte Matrix-Helper-/Runtime-Oberfläche |
    | Line | `plugin-sdk/line`, `plugin-sdk/line-core`, `plugin-sdk/line-runtime`, `plugin-sdk/line-surface` | Gebündelte LINE-Helper-/Runtime-Oberfläche |
    | IRC | `plugin-sdk/irc`, `plugin-sdk/irc-surface` | Gebündelte IRC-Helper-Oberfläche |
    | Channel-spezifische Helper | `plugin-sdk/googlechat`, `plugin-sdk/zalouser`, `plugin-sdk/bluebubbles`, `plugin-sdk/bluebubbles-policy`, `plugin-sdk/mattermost`, `plugin-sdk/mattermost-policy`, `plugin-sdk/feishu-conversation`, `plugin-sdk/msteams`, `plugin-sdk/nextcloud-talk`, `plugin-sdk/nostr`, `plugin-sdk/tlon`, `plugin-sdk/twitch` | Gebündelte Channel-Kompatibilitäts-/Helper-Seams |
    | Auth-/Plugin-spezifische Helper | `plugin-sdk/github-copilot-login`, `plugin-sdk/github-copilot-token`, `plugin-sdk/diagnostics-otel`, `plugin-sdk/diffs`, `plugin-sdk/llm-task`, `plugin-sdk/thread-ownership`, `plugin-sdk/voice-call` | Gebündelte Feature-/Plugin-Helper-Seams; `plugin-sdk/github-copilot-token` exportiert derzeit `DEFAULT_COPILOT_API_BASE_URL`, `deriveCopilotApiBaseUrlFromToken` und `resolveCopilotApiToken` |
  </Accordion>
</AccordionGroup>

## Registrierungs-API

Der Callback `register(api)` erhält ein `OpenClawPluginApi`-Objekt mit diesen
Methoden:

### Funktionsregistrierung

| Methode                                          | Was sie registriert                     |
| ------------------------------------------------ | --------------------------------------- |
| `api.registerProvider(...)`                      | Textinferenz (LLM)                      |
| `api.registerAgentHarness(...)`                  | Experimenteller Low-Level-Agent-Executor |
| `api.registerCliBackend(...)`                    | Lokales CLI-Inferenz-Backend            |
| `api.registerChannel(...)`                       | Messaging-Channel                       |
| `api.registerSpeechProvider(...)`                | Text-to-Speech-/STT-Synthese            |
| `api.registerRealtimeTranscriptionProvider(...)` | Streaming-Echtzeittranskription         |
| `api.registerRealtimeVoiceProvider(...)`         | Duplex-Echtzeit-Sprachsitzungen         |
| `api.registerMediaUnderstandingProvider(...)`    | Bild-/Audio-/Videoanalyse               |
| `api.registerImageGenerationProvider(...)`       | Bildgenerierung                         |
| `api.registerMusicGenerationProvider(...)`       | Musikgenerierung                        |
| `api.registerVideoGenerationProvider(...)`       | Videogenerierung                        |
| `api.registerWebFetchProvider(...)`              | Web-Fetch-/Scrape-Provider              |
| `api.registerWebSearchProvider(...)`             | Websuche                                |

### Tools und Befehle

| Methode                         | Was sie registriert                             |
| ------------------------------- | ----------------------------------------------- |
| `api.registerTool(tool, opts?)` | Agent-Tool (erforderlich oder `{ optional: true }`) |
| `api.registerCommand(def)`      | Benutzerdefinierter Befehl (umgeht das LLM)     |

### Infrastruktur

| Methode                                        | Was sie registriert                    |
| ---------------------------------------------- | -------------------------------------- |
| `api.registerHook(events, handler, opts?)`     | Event-Hook                             |
| `api.registerHttpRoute(params)`                | Gateway-HTTP-Endpunkt                  |
| `api.registerGatewayMethod(name, handler)`     | Gateway-RPC-Methode                    |
| `api.registerCli(registrar, opts?)`            | CLI-Unterbefehl                        |
| `api.registerService(service)`                 | Hintergrunddienst                      |
| `api.registerInteractiveHandler(registration)` | Interaktiver Handler                   |
| `api.registerMemoryPromptSupplement(builder)`  | Additiver promptnaher Memory-Abschnitt |
| `api.registerMemoryCorpusSupplement(adapter)`  | Additiver Memory-Such-/Lese-Korpus     |

Reservierte Core-Admin-Namespaces (`config.*`, `exec.approvals.*`, `wizard.*`,
`update.*`) bleiben immer `operator.admin`, auch wenn ein Plugin versucht, einen
engeren Geltungsbereich für Gateway-Methoden zuzuweisen. Bevorzugen Sie pluginspezifische Präfixe für
plugin-eigene Methoden.

### CLI-Registrierungsmetadaten

`api.registerCli(registrar, opts?)` akzeptiert zwei Arten von Metadaten auf oberster Ebene:

- `commands`: explizite Befehlswurzeln, die dem Registrar gehören
- `descriptors`: Parse-Zeit-Befehlsdeskriptoren, die für Root-CLI-Hilfe,
  Routing und lazy Plugin-CLI-Registrierung verwendet werden

Wenn Sie möchten, dass ein Plugin-Befehl im normalen Root-CLI-Pfad lazy geladen bleibt,
geben Sie `descriptors` an, die jede Befehlswurzel auf oberster Ebene abdecken, die von diesem
Registrar bereitgestellt wird.

```typescript
api.registerCli(
  async ({ program }) => {
    const { registerMatrixCli } = await import("./src/cli.js");
    registerMatrixCli({ program });
  },
  {
    descriptors: [
      {
        name: "matrix",
        description: "Matrix-Konten, Verifizierung, Geräte und Profilstatus verwalten",
        hasSubcommands: true,
      },
    ],
  },
);
```

Verwenden Sie `commands` allein nur dann, wenn Sie keine lazy Root-CLI-Registrierung benötigen.
Dieser eager Kompatibilitätspfad bleibt unterstützt, installiert aber keine
deskriptorbasierten Platzhalter für lazy Laden zur Parse-Zeit.

### CLI-Backend-Registrierung

Mit `api.registerCliBackend(...)` kann ein Plugin die Standardkonfiguration für ein lokales
KI-CLI-Backend wie `codex-cli` übernehmen.

- Die Backend-`id` wird zum Provider-Präfix in Modellreferenzen wie `codex-cli/gpt-5`.
- Die Backend-`config` verwendet dieselbe Form wie `agents.defaults.cliBackends.<id>`.
- Die Benutzerkonfiguration hat weiterhin Vorrang. OpenClaw merged `agents.defaults.cliBackends.<id>` über den
  Plugin-Standard, bevor die CLI ausgeführt wird.
- Verwenden Sie `normalizeConfig`, wenn ein Backend nach dem Merge Kompatibilitäts-Umschreibungen benötigt
  (zum Beispiel zur Normalisierung alter Flag-Formen).

### Exklusive Slots

| Methode                                    | Was sie registriert                                                                                                                                           |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerContextEngine(id, factory)`   | Kontext-Engine (immer nur eine aktiv). Der Callback `assemble()` erhält `availableTools` und `citationsMode`, damit die Engine Prompt-Ergänzungen anpassen kann. |
| `api.registerMemoryCapability(capability)` | Einheitliche Memory-Funktion                                                                                                                                  |
| `api.registerMemoryPromptSection(builder)` | Builder für Memory-Prompt-Abschnitte                                                                                                                          |
| `api.registerMemoryFlushPlan(resolver)`    | Resolver für Memory-Flush-Pläne                                                                                                                               |
| `api.registerMemoryRuntime(runtime)`       | Memory-Runtime-Adapter                                                                                                                                         |

### Memory-Embedding-Adapter

| Methode                                        | Was sie registriert                              |
| ---------------------------------------------- | ----------------------------------------------- |
| `api.registerMemoryEmbeddingProvider(adapter)` | Memory-Embedding-Adapter für das aktive Plugin |

- `registerMemoryCapability` ist die bevorzugte exklusive Memory-Plugin-API.
- `registerMemoryCapability` kann auch `publicArtifacts.listArtifacts(...)` bereitstellen,
  sodass Begleit-Plugins exportierte Memory-Artefakte über
  `openclaw/plugin-sdk/memory-host-core` nutzen können, statt in das private
  Layout eines bestimmten Memory-Plugins einzugreifen.
- `registerMemoryPromptSection`, `registerMemoryFlushPlan` und
  `registerMemoryRuntime` sind alte, kompatibilitätsorientierte exklusive Memory-Plugin-APIs.
- Mit `registerMemoryEmbeddingProvider` kann das aktive Memory-Plugin eine
  oder mehrere Embedding-Adapter-IDs registrieren (zum Beispiel `openai`, `gemini` oder eine benutzerdefinierte
  ID, die von einem Plugin definiert wurde).
- Benutzerkonfiguration wie `agents.defaults.memorySearch.provider` und
  `agents.defaults.memorySearch.fallback` wird gegen diese registrierten
  Adapter-IDs aufgelöst.

### Ereignisse und Lebenszyklus

| Methode                                      | Was sie tut                 |
| -------------------------------------------- | --------------------------- |
| `api.on(hookName, handler, opts?)`           | Typisierter Lebenszyklus-Hook |
| `api.onConversationBindingResolved(handler)` | Callback für Conversation-Binding |

### Hook-Entscheidungssemantik

- `before_tool_call`: Die Rückgabe von `{ block: true }` ist endgültig. Sobald ein Handler dies setzt, werden Handler mit niedrigerer Priorität übersprungen.
- `before_tool_call`: Die Rückgabe von `{ block: false }` wird als keine Entscheidung behandelt (wie beim Weglassen von `block`), nicht als Überschreibung.
- `before_install`: Die Rückgabe von `{ block: true }` ist endgültig. Sobald ein Handler dies setzt, werden Handler mit niedrigerer Priorität übersprungen.
- `before_install`: Die Rückgabe von `{ block: false }` wird als keine Entscheidung behandelt (wie beim Weglassen von `block`), nicht als Überschreibung.
- `reply_dispatch`: Die Rückgabe von `{ handled: true, ... }` ist endgültig. Sobald ein Handler den Dispatch beansprucht, werden Handler mit niedrigerer Priorität und der Standard-Dispatch-Pfad des Modells übersprungen.
- `message_sending`: Die Rückgabe von `{ cancel: true }` ist endgültig. Sobald ein Handler dies setzt, werden Handler mit niedrigerer Priorität übersprungen.
- `message_sending`: Die Rückgabe von `{ cancel: false }` wird als keine Entscheidung behandelt (wie beim Weglassen von `cancel`), nicht als Überschreibung.

### API-Objektfelder

| Feld                     | Typ                       | Beschreibung                                                                                |
| ------------------------ | ------------------------- | ------------------------------------------------------------------------------------------- |
| `api.id`                 | `string`                  | Plugin-ID                                                                                   |
| `api.name`               | `string`                  | Anzeigename                                                                                 |
| `api.version`            | `string?`                 | Plugin-Version (optional)                                                                   |
| `api.description`        | `string?`                 | Plugin-Beschreibung (optional)                                                              |
| `api.source`             | `string`                  | Plugin-Quellpfad                                                                            |
| `api.rootDir`            | `string?`                 | Plugin-Root-Verzeichnis (optional)                                                          |
| `api.config`             | `OpenClawConfig`          | Aktueller Konfigurations-Snapshot (aktiver In-Memory-Runtime-Snapshot, falls verfügbar)    |
| `api.pluginConfig`       | `Record<string, unknown>` | Plugin-spezifische Konfiguration aus `plugins.entries.<id>.config`                          |
| `api.runtime`            | `PluginRuntime`           | [Runtime-Helper](/de/plugins/sdk-runtime)                                                      |
| `api.logger`             | `PluginLogger`            | Bereichsbezogener Logger (`debug`, `info`, `warn`, `error`)                                 |
| `api.registrationMode`   | `PluginRegistrationMode`  | Aktueller Lademodus; `"setup-runtime"` ist das leichtgewichtige Vorstart-/Setup-Zeitfenster vor dem vollständigen Entry |
| `api.resolvePath(input)` | `(string) => string`      | Pfad relativ zum Plugin-Root auflösen                                                       |

## Interne Modulkonvention

Verwenden Sie innerhalb Ihres Plugins lokale Barrel-Dateien für interne Importe:

```
my-plugin/
  api.ts            # Öffentliche Exporte für externe Verbraucher
  runtime-api.ts    # Nur interne Runtime-Exporte
  index.ts          # Plugin-Entry-Point
  setup-entry.ts    # Leichtgewichtiger Entry nur für Setup (optional)
```

<Warning>
  Importieren Sie Ihr eigenes Plugin niemals über `openclaw/plugin-sdk/<your-plugin>`
  aus Produktionscode. Leiten Sie interne Importe über `./api.ts` oder
  `./runtime-api.ts`. Der SDK-Pfad ist nur der externe Vertrag.
</Warning>

Per Fassade geladene öffentliche Oberflächen gebündelter Plugins (`api.ts`, `runtime-api.ts`,
`index.ts`, `setup-entry.ts` und ähnliche öffentliche Entry-Dateien) bevorzugen jetzt den
aktiven Runtime-Konfigurations-Snapshot, wenn OpenClaw bereits läuft. Falls noch kein Runtime-
Snapshot existiert, greifen sie auf die aufgelöste Konfigurationsdatei auf dem Datenträger zurück.

Provider-Plugins können auch ein schmales pluginlokales Vertrags-Barrel bereitstellen, wenn ein
Helper absichtlich provider-spezifisch ist und noch nicht in einen generischen SDK-Subpfad
gehört. Aktuelles gebündeltes Beispiel: Der Anthropic-Provider hält seine Claude-
Stream-Helper in seiner eigenen öffentlichen `api.ts`-/`contract-api.ts`-Naht, statt
Anthropic-Beta-Header- und `service_tier`-Logik in einen generischen
`plugin-sdk/*`-Vertrag zu verschieben.

Weitere aktuelle gebündelte Beispiele:

- `@openclaw/openai-provider`: `api.ts` exportiert Provider-Builder,
  Standardmodell-Helper und Realtime-Provider-Builder
- `@openclaw/openrouter-provider`: `api.ts` exportiert den Provider-Builder sowie
  Onboarding-/Konfigurations-Helper

<Warning>
  Produktionscode von Erweiterungen sollte auch Importe von `openclaw/plugin-sdk/<other-plugin>`
  vermeiden. Wenn ein Helper wirklich gemeinsam genutzt wird, verschieben Sie ihn in einen neutralen SDK-Subpfad
  wie `openclaw/plugin-sdk/speech`, `.../provider-model-shared` oder eine andere
  funktionsorientierte Oberfläche, statt zwei Plugins miteinander zu koppeln.
</Warning>

## Verwandt

- [Entry Points](/de/plugins/sdk-entrypoints) — Optionen für `definePluginEntry` und `defineChannelPluginEntry`
- [Runtime Helpers](/de/plugins/sdk-runtime) — vollständige Referenz für den `api.runtime`-Namespace
- [Setup and Config](/de/plugins/sdk-setup) — Paketierung, Manifeste, Konfigurationsschemata
- [Testing](/de/plugins/sdk-testing) — Test-Hilfsprogramme und Lint-Regeln
- [SDK Migration](/de/plugins/sdk-migration) — Migration von veralteten Oberflächen
- [Plugin Internals](/de/plugins/architecture) — tiefergehende Architektur und Funktionsmodell
