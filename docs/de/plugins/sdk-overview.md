---
read_when:
    - Sie müssen wissen, aus welchem SDK-Subpath importiert werden soll
    - Sie möchten eine Referenz für alle Registrierungsmethoden auf `OpenClawPluginApi`
    - Sie suchen einen bestimmten SDK-Export nach
sidebarTitle: SDK Overview
summary: Import-Map, Referenz der Registrierungs-API und SDK-Architektur
title: Plugin-SDK-Überblick
x-i18n:
    generated_at: "2026-04-22T04:25:23Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8045c11976bbda6afe3303a0aab08caf0d0a86ebcf1aaaf927943b90cc517673
    source_path: plugins/sdk-overview.md
    workflow: 15
---

# Plugin-SDK-Überblick

Das Plugin-SDK ist der typisierte Vertrag zwischen Plugins und dem Core. Diese Seite ist die
Referenz für **was importiert werden soll** und **was Sie registrieren können**.

<Tip>
  **Suchen Sie eine How-to-Anleitung?**
  - Erstes Plugin? Beginnen Sie mit [Getting Started](/de/plugins/building-plugins)
  - Kanal-Plugin? Siehe [Channel Plugins](/de/plugins/sdk-channel-plugins)
  - Provider-Plugin? Siehe [Provider Plugins](/de/plugins/sdk-provider-plugins)
</Tip>

## Importkonvention

Importieren Sie immer aus einem spezifischen Subpath:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

Jeder Subpath ist ein kleines, eigenständiges Modul. Das hält den Start schnell und
verhindert Probleme mit zirkulären Abhängigkeiten. Für kanalspezifische Einstiegs-/Build-Helfer
bevorzugen Sie `openclaw/plugin-sdk/channel-core`; behalten Sie `openclaw/plugin-sdk/core` für
die breitere Umbrella-Oberfläche und gemeinsame Helfer wie
`buildChannelConfigSchema`.

Fügen Sie keine providerbenannten Convenience-Seams hinzu und hängen Sie nicht von ihnen ab, wie
`openclaw/plugin-sdk/slack`, `openclaw/plugin-sdk/discord`,
`openclaw/plugin-sdk/signal`, `openclaw/plugin-sdk/whatsapp` oder
kanalgebrandeten Helfer-Seams. Gebündelte Plugins sollten generische
SDK-Subpaths in ihren eigenen `api.ts`- oder `runtime-api.ts`-Barrels zusammensetzen, und der Core
sollte entweder diese pluginlokalen Barrels verwenden oder einen schmalen generischen SDK-
Vertrag hinzufügen, wenn der Bedarf wirklich kanalübergreifend ist.

Die generierte Export-Map enthält weiterhin eine kleine Menge gebündelter Plugin-Helfer-
Seams wie `plugin-sdk/feishu`, `plugin-sdk/feishu-setup`,
`plugin-sdk/zalo`, `plugin-sdk/zalo-setup` und `plugin-sdk/matrix*`. Diese
Subpaths existieren nur für die Wartung gebündelter Plugins und für Kompatibilität; sie werden
bewusst aus der allgemeinen Tabelle unten ausgelassen und sind nicht der empfohlene
Importpfad für neue Drittanbieter-Plugins.

## Referenz der Subpaths

Die am häufigsten verwendeten Subpaths, nach Zweck gruppiert. Die generierte vollständige Liste von
über 200 Subpaths befindet sich in `scripts/lib/plugin-sdk-entrypoints.json`.

Reservierte Helfer-Subpaths für gebündelte Plugins erscheinen weiterhin in dieser generierten Liste.
Behandeln Sie diese als Implementierungsdetail-/Kompatibilitätsoberflächen, es sei denn, eine Dokumentationsseite
weist ausdrücklich einen davon als öffentlich aus.

### Plugin-Einstiegspunkt

| Subpath                     | Wichtige Exporte                                                                                                                      |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/plugin-entry`   | `definePluginEntry`                                                                                                                   |
| `plugin-sdk/core`           | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema` |
| `plugin-sdk/config-schema`  | `OpenClawSchema`                                                                                                                      |
| `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry`                                                                                                     |

<AccordionGroup>
  <Accordion title="Kanal-Subpaths">
    | Subpath | Wichtige Exporte |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | Export des Zod-Schemas für Root-`openclaw.json` (`OpenClawSchema`) |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, plus `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | Gemeinsame Helfer für Setup-Assistenten, Allowlist-Abfragen, Setup-Status-Builder |
    | `plugin-sdk/setup-runtime` | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | `createEnvPatchedAccountSetupAdapter` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | Helfer für Multi-Account-Konfiguration/Aktions-Gates, Helfer für Default-Account-Fallback |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, Helfer zur Normalisierung von Account-IDs |
    | `plugin-sdk/account-resolution` | Account-Lookup- + Default-Fallback-Helfer |
    | `plugin-sdk/account-helpers` | Schmale Helfer für Account-Listen/Account-Aktionen |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | `createChannelReplyPipeline` |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter` |
    | `plugin-sdk/channel-config-schema` | Typen für Kanalkonfigurationsschema |
    | `plugin-sdk/telegram-command-config` | Helfer zur Normalisierung/Validierung benutzerdefinierter Telegram-Befehle mit gebündeltem Vertrags-Fallback |
    | `plugin-sdk/command-gating` | Schmale Helfer für Gates der Befehlsautorisierung |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-lifecycle` | `createAccountStatusSink`, Helfer für Entwurfs-Stream-Lebenszyklus/Finalisierung |
    | `plugin-sdk/inbound-envelope` | Gemeinsame Helfer für eingehendes Routing + Envelope-Builder |
    | `plugin-sdk/inbound-reply-dispatch` | Gemeinsame Helfer für eingehendes Erfassen-und-Dispatch |
    | `plugin-sdk/messaging-targets` | Helfer zum Parsen/Abgleichen von Zielen |
    | `plugin-sdk/outbound-media` | Gemeinsame Helfer zum Laden ausgehender Medien |
    | `plugin-sdk/outbound-runtime` | Helfer für ausgehende Identität, Sendedelegat und Payload-Planung |
    | `plugin-sdk/poll-runtime` | Schmale Helfer zur Poll-Normalisierung |
    | `plugin-sdk/thread-bindings-runtime` | Helfer für den Lebenszyklus von Thread-Bindungen und Adapter |
    | `plugin-sdk/agent-media-payload` | Legacy-Builder für Agenten-Media-Payload |
    | `plugin-sdk/conversation-runtime` | Helfer für Konversations-/Thread-Bindung, Kopplung und konfigurierte Bindungen |
    | `plugin-sdk/runtime-config-snapshot` | Helfer für Laufzeit-Konfigurations-Snapshot |
    | `plugin-sdk/runtime-group-policy` | Helfer zur Auflösung von Gruppenrichtlinien zur Laufzeit |
    | `plugin-sdk/channel-status` | Gemeinsame Helfer für Status-Snapshot/Zusammenfassung von Kanälen |
    | `plugin-sdk/channel-config-primitives` | Schmale Primitive für Kanalkonfigurationsschema |
    | `plugin-sdk/channel-config-writes` | Helfer für Autorisierung von Kanalkonfigurations-Schreibvorgängen |
    | `plugin-sdk/channel-plugin-common` | Gemeinsame Prelude-Exporte für Kanal-Plugins |
    | `plugin-sdk/allowlist-config-edit` | Helfer zum Bearbeiten/Lesen von Allowlist-Konfiguration |
    | `plugin-sdk/group-access` | Gemeinsame Helfer für Entscheidungen zum Gruppenzugriff |
    | `plugin-sdk/direct-dm` | Gemeinsame Helfer für direkte DM-Auth/Guards |
    | `plugin-sdk/interactive-runtime` | Semantische Nachrichtenpräsentation, Zustellung und Legacy-Helfer für interaktive Antworten. Siehe [Message Presentation](/de/plugins/message-presentation) |
    | `plugin-sdk/channel-inbound` | Kompatibilitäts-Barrel für Inbound-Debounce, Erwähnungsabgleich, Helfer für Erwähnungsrichtlinien und Envelope-Helfer |
    | `plugin-sdk/channel-mention-gating` | Schmale Helfer für Erwähnungsrichtlinien ohne die breitere Oberfläche für die eingehende Laufzeit |
    | `plugin-sdk/channel-location` | Helfer für Kontext und Formatierung von Kanalstandorten |
    | `plugin-sdk/channel-logging` | Helfer für Kanal-Logging bei eingehenden Drops und Fehlversagen bei Typing/Ack |
    | `plugin-sdk/channel-send-result` | Typen für Antwortergebnisse |
    | `plugin-sdk/channel-actions` | Helfer für Kanal-Nachrichtenaktionen sowie veraltete native Schema-Helfer, die aus Plugin-Kompatibilitätsgründen beibehalten werden |
    | `plugin-sdk/channel-targets` | Helfer zum Parsen/Abgleichen von Zielen |
    | `plugin-sdk/channel-contract` | Typen für Kanalverträge |
    | `plugin-sdk/channel-feedback` | Verdrahtung von Feedback/Reaktionen |
    | `plugin-sdk/channel-secret-runtime` | Schmale Helfer für Secret-Verträge wie `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment` und Secret-Zieltypen |
  </Accordion>

  <Accordion title="Provider-Subpaths">
    | Subpath | Wichtige Exporte |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/provider-setup` | Kuratierte Setup-Helfer für lokale/selbstgehostete Provider |
    | `plugin-sdk/self-hosted-provider-setup` | Fokussierte Setup-Helfer für OpenAI-kompatible selbstgehostete Provider |
    | `plugin-sdk/cli-backend` | CLI-Backend-Standards + Watchdog-Konstanten |
    | `plugin-sdk/provider-auth-runtime` | Helfer zur Laufzeitauflösung von API-Schlüsseln für Provider-Plugins |
    | `plugin-sdk/provider-auth-api-key` | Helfer für API-Key-Onboarding/Profilschreibvorgänge wie `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | Standard-Builder für OAuth-Auth-Ergebnisse |
    | `plugin-sdk/provider-auth-login` | Gemeinsame interaktive Login-Helfer für Provider-Plugins |
    | `plugin-sdk/provider-env-vars` | Helfer zum Nachschlagen von Provider-Auth-Umgebungsvariablen |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, gemeinsame Builder für Replay-Richtlinien, Provider-Endpunkt-Helfer und Helfer zur Normalisierung von Modell-IDs wie `normalizeNativeXaiModelId` |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | Generische Helfer für HTTP-/Endpunkt-Fähigkeiten von Providern |
    | `plugin-sdk/provider-web-fetch-contract` | Schmale Helfer für Verträge zur Web-Fetch-Konfiguration/-Auswahl wie `enablePluginInConfig` und `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | Helfer für Registrierung/Cache/Laufzeit von Web-Fetch-Providern |
    | `plugin-sdk/provider-web-search-config-contract` | Schmale Helfer für Web-Suche-Konfiguration/Anmeldedaten für Provider, die keine Plugin-Aktivierungsverdrahtung benötigen |
    | `plugin-sdk/provider-web-search-contract` | Schmale Helfer für Verträge zu Web-Suche-Konfiguration/Anmeldedaten wie `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` und Scoped Setter/Getter für Anmeldedaten |
    | `plugin-sdk/provider-web-search` | Helfer für Registrierung/Cache/Laufzeit von Web-Suche-Providern |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, Bereinigung von Gemini-Schemata + Diagnose und xAI-Kompatibilitätshelfer wie `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
    | `plugin-sdk/provider-usage` | `fetchClaudeUsage` und ähnliche |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, Stream-Wrapper-Typen und gemeinsame Wrapper-Helfer für Anthropic/Bedrock/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
    | `plugin-sdk/provider-transport-runtime` | Native Helfer für Provider-Transporte wie geschütztes Fetch, Transformationen von Transportnachrichten und beschreibbare Event-Streams für Transporte |
    | `plugin-sdk/provider-onboard` | Helfer für Konfigurations-Patches beim Onboarding |
    | `plugin-sdk/global-singleton` | Prozesslokale Helfer für Singleton/Map/Cache |
  </Accordion>

  <Accordion title="Subpaths für Authentifizierung und Sicherheit">
    | Subpath | Wichtige Exporte |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, Helfer für Befehlsregistrierung, Helfer für Absenderautorisierung |
    | `plugin-sdk/command-status` | Builder für Befehls-/Hilfenachrichten wie `buildCommandsMessagePaginated` und `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | Helfer für Genehmigendenauflösung und Aktionsauth im selben Chat |
    | `plugin-sdk/approval-client-runtime` | Helfer für native Exec-Genehmigungsprofile/-Filter |
    | `plugin-sdk/approval-delivery-runtime` | Adapter für native Genehmigungsfunktionen/-zustellung |
    | `plugin-sdk/approval-gateway-runtime` | Gemeinsamer Helfer für die Auflösung des Genehmigungs-Gateways |
    | `plugin-sdk/approval-handler-adapter-runtime` | Leichtgewichtige Helfer zum Laden nativer Genehmigungsadapter für Hot-Kanal-Einstiegspunkte |
    | `plugin-sdk/approval-handler-runtime` | Breitere Laufzeithelfer für Genehmigungshandler; bevorzugen Sie die schmaleren Adapter-/Gateway-Seams, wenn diese ausreichen |
    | `plugin-sdk/approval-native-runtime` | Helfer für natives Genehmigungsziel + Konto-Bindung |
    | `plugin-sdk/approval-reply-runtime` | Helfer für Antwort-Nutzlasten bei Exec-/Plugin-Genehmigungen |
    | `plugin-sdk/command-auth-native` | Native Befehlsauth + native Helfer für Sitzungsziele |
    | `plugin-sdk/command-detection` | Gemeinsame Helfer zur Befehlserkennung |
    | `plugin-sdk/command-surface` | Helfer für Normalisierung von Befehlsinhalten und Befehlsoberflächen |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | Schmale Helfer zur Sammlung von Secret-Verträgen für Secret-Oberflächen von Kanal/Plugin |
    | `plugin-sdk/secret-ref-runtime` | Schmale Helfer für `coerceSecretRef` und SecretRef-Typisierung für Secret-Vertrags-/Konfigurations-Parsing |
    | `plugin-sdk/security-runtime` | Gemeinsame Helfer für Vertrauen, DM-Gating, externe Inhalte und Secret-Sammlung |
    | `plugin-sdk/ssrf-policy` | Helfer für Host-Allowlist und SSRF-Richtlinien für private Netzwerke |
    | `plugin-sdk/ssrf-dispatcher` | Schmale Helfer für gepinnte Dispatcher ohne die breite Infra-Laufzeitoberfläche |
    | `plugin-sdk/ssrf-runtime` | Helfer für gepinnte Dispatcher, SSRF-geschütztes Fetch und SSRF-Richtlinien |
    | `plugin-sdk/secret-input` | Helfer für das Parsen von Secret-Eingaben |
    | `plugin-sdk/webhook-ingress` | Helfer für Webhook-Requests/-Ziele |
    | `plugin-sdk/webhook-request-guards` | Helfer für Größe/Timeout von Request-Bodys |
  </Accordion>

  <Accordion title="Subpaths für Laufzeit und Speicher">
    | Subpath | Wichtige Exporte |
    | --- | --- |
    | `plugin-sdk/runtime` | Breite Helfer für Laufzeit/Logging/Backups/Plugin-Installation |
    | `plugin-sdk/runtime-env` | Schmale Helfer für Laufzeit-Env, Logger, Timeout, Retry und Backoff |
    | `plugin-sdk/channel-runtime-context` | Generische Helfer für Registrierung und Lookup von Kanal-Laufzeitkontexten |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Gemeinsame Helfer für Plugin-Befehle/Hooks/HTTP/Interaktivität |
    | `plugin-sdk/hook-runtime` | Gemeinsame Helfer für Webhook-/interne Hook-Pipelines |
    | `plugin-sdk/lazy-runtime` | Helfer für Lazy-Laufzeitimporte/-Bindungen wie `createLazyRuntimeModule`, `createLazyRuntimeMethod` und `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | Helfer für Prozess-Exec |
    | `plugin-sdk/cli-runtime` | Helfer für CLI-Formatierung, Warten und Versionen |
    | `plugin-sdk/gateway-runtime` | Helfer für Gateway-Client und Patches des Kanalstatus |
    | `plugin-sdk/config-runtime` | Helfer für Laden/Schreiben von Konfiguration |
    | `plugin-sdk/telegram-command-config` | Helfer für Normalisierung von Telegram-Befehlsnamen/-Beschreibungen und Prüfungen auf Duplikate/Konflikte, auch wenn die gebündelte Telegram-Vertragsoberfläche nicht verfügbar ist |
    | `plugin-sdk/text-autolink-runtime` | Erkennung von Autolinks für Dateireferenzen ohne das breite `text-runtime`-Barrel |
    | `plugin-sdk/approval-runtime` | Helfer für Exec-/Plugin-Genehmigungen, Builder für Genehmigungsfunktionen, Helfer für Auth/Profile, native Routing-/Laufzeithelfer |
    | `plugin-sdk/reply-runtime` | Gemeinsame Inbound-/Antwort-Laufzeithelfer, Chunking, Dispatch, Heartbeat, Antwortplaner |
    | `plugin-sdk/reply-dispatch-runtime` | Schmale Helfer für Dispatch/Finalisierung von Antworten |
    | `plugin-sdk/reply-history` | Gemeinsame Helfer für Antwortverläufe in kurzen Fenstern wie `buildHistoryContext`, `recordPendingHistoryEntry` und `clearHistoryEntriesIfEnabled` |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | Schmale Helfer für Text-/Markdown-Chunking |
    | `plugin-sdk/session-store-runtime` | Helfer für Pfade von Sitzungsspeichern + `updated-at` |
    | `plugin-sdk/state-paths` | Helfer für Pfade zu State-/OAuth-Verzeichnissen |
    | `plugin-sdk/routing` | Helfer für Routing-/Sitzungsschlüssel-/Konto-Bindungen wie `resolveAgentRoute`, `buildAgentSessionKey` und `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | Gemeinsame Helfer für Zusammenfassungen des Kanal-/Kontostatus, Laufzeitstatus-Standards und Metadaten zu Problemen |
    | `plugin-sdk/target-resolver-runtime` | Gemeinsame Helfer zur Zielauflösung |
    | `plugin-sdk/string-normalization-runtime` | Helfer zur Slug-/String-Normalisierung |
    | `plugin-sdk/request-url` | String-URLs aus Fetch-/Request-ähnlichen Eingaben extrahieren |
    | `plugin-sdk/run-command` | Zeitgesteuerter Befehlsausführer mit normalisierten stdout-/stderr-Ergebnissen |
    | `plugin-sdk/param-readers` | Gemeinsame Parameterleser für Tools/CLI |
    | `plugin-sdk/tool-payload` | Normalisierte Nutzlasten aus Tool-Ergebnisobjekten extrahieren |
    | `plugin-sdk/tool-send` | Kanonische Felder für Sendeziele aus Tool-Argumenten extrahieren |
    | `plugin-sdk/temp-path` | Gemeinsame Helfer für temporäre Download-Pfade |
    | `plugin-sdk/logging-core` | Helfer für Subsystem-Logger und Redaktion |
    | `plugin-sdk/markdown-table-runtime` | Helfer für Modi von Markdown-Tabellen |
    | `plugin-sdk/json-store` | Kleine Helfer zum Lesen/Schreiben von JSON-State |
    | `plugin-sdk/file-lock` | Reentrant-Helfer für Dateisperren |
    | `plugin-sdk/persistent-dedupe` | Helfer für festplattenbasierte Dedupe-Caches |
    | `plugin-sdk/acp-runtime` | Laufzeit-/Sitzungs- und Reply-Dispatch-Helfer für ACP |
    | `plugin-sdk/acp-binding-resolve-runtime` | Schmale schreibgeschützte Auflösung von ACP-Bindungen ohne Lifecycle-Startup-Importe |
    | `plugin-sdk/agent-config-primitives` | Schmale Primitive des Agenten-Laufzeitkonfigurationsschemas |
    | `plugin-sdk/boolean-param` | Loser Reader für boolesche Parameter |
    | `plugin-sdk/dangerous-name-runtime` | Helfer zur Auflösung gefährlicher Namensabgleiche |
    | `plugin-sdk/device-bootstrap` | Helfer für Geräte-Bootstrap und Kopplungstoken |
    | `plugin-sdk/extension-shared` | Gemeinsame Primitive für passive Kanäle, Status und Ambient-Proxy-Helfer |
    | `plugin-sdk/models-provider-runtime` | Helfer für Provider-Antworten des Befehls `/models` |
    | `plugin-sdk/skill-commands-runtime` | Helfer zum Auflisten von Skill-Befehlen |
    | `plugin-sdk/native-command-registry` | Helfer für Registrierung/Build/Serialisierung nativer Befehle |
    | `plugin-sdk/agent-harness` | Experimentelle Trusted-Plugin-Oberfläche für Low-Level-Agent-Harnesses: Harness-Typen, Helfer zum Steuern/Abbrechen aktiver Läufe, OpenClaw-Tool-Bridge-Helfer und Utilities für Versuchsergebnisse |
    | `plugin-sdk/provider-zai-endpoint` | Helfer zur Erkennung von Z.AI-Endpunkten |
    | `plugin-sdk/infra-runtime` | Helfer für Systemereignisse/Heartbeat |
    | `plugin-sdk/collection-runtime` | Kleine Helfer für begrenzte Caches |
    | `plugin-sdk/diagnostic-runtime` | Helfer für Diagnose-Flags und -Ereignisse |
    | `plugin-sdk/error-runtime` | Fehlergraph, Formatierung, gemeinsame Helfer zur Fehlerklassifizierung, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | Wrapped Fetch, Proxy und gepinnte Lookup-Helfer |
    | `plugin-sdk/runtime-fetch` | Dispatcher-bewusstes Runtime-Fetch ohne Proxy-/Guarded-Fetch-Importe |
    | `plugin-sdk/response-limit-runtime` | Begrenzter Reader für Response-Bodys ohne die breite Medien-Laufzeitoberfläche |
    | `plugin-sdk/session-binding-runtime` | Aktueller Zustand von Konversationsbindungen ohne Routing für konfigurierte Bindungen oder Kopplungsspeicher |
    | `plugin-sdk/session-store-runtime` | Helfer zum Lesen von Sitzungsspeichern ohne breite Importe für Konfigurationsschreibvorgänge/Wartung |
    | `plugin-sdk/context-visibility-runtime` | Auflösung der Kontextsichtigkeit und Filterung ergänzender Kontexte ohne breite Konfigurations-/Sicherheitsimporte |
    | `plugin-sdk/string-coerce-runtime` | Schmale Helfer für Primitive-Record-/String-Koerzierung und Normalisierung ohne Markdown-/Logging-Importe |
    | `plugin-sdk/host-runtime` | Helfer zur Normalisierung von Hostnamen und SCP-Hosts |
    | `plugin-sdk/retry-runtime` | Helfer für Retry-Konfiguration und Retry-Runner |
    | `plugin-sdk/agent-runtime` | Helfer für Agent-Verzeichnis/Identität/Workspace |
    | `plugin-sdk/directory-runtime` | Konfigurationsgestützte Verzeichnisabfrage/Dedupe |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Subpaths für Fähigkeiten und Tests">
    | Subpath | Wichtige Exporte |
    | --- | --- |
    | `plugin-sdk/media-runtime` | Gemeinsame Helfer für Medienabruf/-transformation/-speicherung sowie Builder für Medien-Nutzlasten |
    | `plugin-sdk/media-generation-runtime` | Gemeinsame Helfer für Failover bei Mediengenerierung, Kandidatenauswahl und Meldungen für fehlende Modelle |
    | `plugin-sdk/media-understanding` | Typen für Media-Understanding-Provider sowie providerseitige Bild-/Audio-Helferexporte |
    | `plugin-sdk/text-runtime` | Gemeinsame Helfer für Text/Markdown/Logging wie Entfernen von für Assistenten sichtbarem Text, Helfer für Markdown-Rendering/Chunking/Tabellen, Redaktionshelfer, Direktiven-Tag-Helfer und Safe-Text-Utilities |
    | `plugin-sdk/text-chunking` | Helfer für ausgehendes Text-Chunking |
    | `plugin-sdk/speech` | Typen für Speech-Provider sowie providerseitige Helfer für Direktiven, Registrierung und Validierung |
    | `plugin-sdk/speech-core` | Gemeinsame Typen, Registrierungs-, Direktiven- und Normalisierungshelfer für Speech-Provider |
    | `plugin-sdk/realtime-transcription` | Typen und Registrierungshelfer für Realtime-Transcription-Provider |
    | `plugin-sdk/realtime-voice` | Typen und Registrierungshelfer für Realtime-Voice-Provider |
    | `plugin-sdk/image-generation` | Typen für Image-Generation-Provider |
    | `plugin-sdk/image-generation-core` | Gemeinsame Typen, Failover-, Auth- und Registrierungshelfer für Bildgenerierung |
    | `plugin-sdk/music-generation` | Typen für Music-Generation-Provider/Requests/Ergebnisse |
    | `plugin-sdk/music-generation-core` | Gemeinsame Typen, Failover-Helfer, Provider-Lookup und Parsing von Modellreferenzen für Musikgenerierung |
    | `plugin-sdk/video-generation` | Typen für Video-Generation-Provider/Requests/Ergebnisse |
    | `plugin-sdk/video-generation-core` | Gemeinsame Typen, Failover-Helfer, Provider-Lookup und Parsing von Modellreferenzen für Videogenerierung |
    | `plugin-sdk/webhook-targets` | Registrierung von Webhook-Zielen und Helfer für die Installation von Routen |
    | `plugin-sdk/webhook-path` | Helfer zur Normalisierung von Webhook-Pfaden |
    | `plugin-sdk/web-media` | Gemeinsame Helfer zum Laden entfernter/lokaler Medien |
    | `plugin-sdk/zod` | Re-exportiertes `zod` für Nutzer des Plugin-SDK |
    | `plugin-sdk/testing` | `installCommonResolveTargetErrorCases`, `shouldAckReaction` |
  </Accordion>

  <Accordion title="Memory-Subpaths">
    | Subpath | Wichtige Exporte |
    | --- | --- |
    | `plugin-sdk/memory-core` | Gebündelte Helper-Oberfläche für memory-core für Manager-/Konfigurations-/Datei-/CLI-Helfer |
    | `plugin-sdk/memory-core-engine-runtime` | Laufzeit-Fassade für Memory-Index/-Suche |
    | `plugin-sdk/memory-core-host-engine-foundation` | Exporte der Foundation-Engine des Memory-Hosts |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Verträge für Host-Embeddings des Memory-Hosts, Registry-Zugriff, lokaler Provider und generische Batch-/Remote-Helfer |
    | `plugin-sdk/memory-core-host-engine-qmd` | Exporte der QMD-Engine des Memory-Hosts |
    | `plugin-sdk/memory-core-host-engine-storage` | Exporte der Storage-Engine des Memory-Hosts |
    | `plugin-sdk/memory-core-host-multimodal` | Multimodale Helfer des Memory-Hosts |
    | `plugin-sdk/memory-core-host-query` | Query-Helfer des Memory-Hosts |
    | `plugin-sdk/memory-core-host-secret` | Secret-Helfer des Memory-Hosts |
    | `plugin-sdk/memory-core-host-events` | Helfer für Event-Journals des Memory-Hosts |
    | `plugin-sdk/memory-core-host-status` | Status-Helfer des Memory-Hosts |
    | `plugin-sdk/memory-core-host-runtime-cli` | Laufzeithelfer für die CLI des Memory-Hosts |
    | `plugin-sdk/memory-core-host-runtime-core` | Core-Laufzeithelfer des Memory-Hosts |
    | `plugin-sdk/memory-core-host-runtime-files` | Datei-/Laufzeithelfer des Memory-Hosts |
    | `plugin-sdk/memory-host-core` | Anbieterneutraler Alias für Core-Laufzeithelfer des Memory-Hosts |
    | `plugin-sdk/memory-host-events` | Anbieterneutraler Alias für Helfer für Event-Journals des Memory-Hosts |
    | `plugin-sdk/memory-host-files` | Anbieterneutraler Alias für Datei-/Laufzeithelfer des Memory-Hosts |
    | `plugin-sdk/memory-host-markdown` | Gemeinsame Managed-Markdown-Helfer für memory-nahe Plugins |
    | `plugin-sdk/memory-host-search` | Active Memory Laufzeit-Fassade für den Zugriff auf den Search-Manager |
    | `plugin-sdk/memory-host-status` | Anbieterneutraler Alias für Status-Helfer des Memory-Hosts |
    | `plugin-sdk/memory-lancedb` | Gebündelte Helper-Oberfläche für memory-lancedb |
  </Accordion>

  <Accordion title="Reservierte Subpaths für gebündelte Helfer">
    | Familie | Aktuelle Subpaths | Beabsichtigte Verwendung |
    | --- | --- | --- |
    | Browser | `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support` | Support-Helfer für gebündelte Browser-Plugins (`browser-support` bleibt das Kompatibilitäts-Barrel) |
    | Matrix | `plugin-sdk/matrix`, `plugin-sdk/matrix-helper`, `plugin-sdk/matrix-runtime-heavy`, `plugin-sdk/matrix-runtime-shared`, `plugin-sdk/matrix-runtime-surface`, `plugin-sdk/matrix-surface`, `plugin-sdk/matrix-thread-bindings` | Gebündelte Helper-/Laufzeitoberfläche für Matrix |
    | Line | `plugin-sdk/line`, `plugin-sdk/line-core`, `plugin-sdk/line-runtime`, `plugin-sdk/line-surface` | Gebündelte Helper-/Laufzeitoberfläche für LINE |
    | IRC | `plugin-sdk/irc`, `plugin-sdk/irc-surface` | Gebündelte Helper-Oberfläche für IRC |
    | Kanalspezifische Helfer | `plugin-sdk/googlechat`, `plugin-sdk/zalouser`, `plugin-sdk/bluebubbles`, `plugin-sdk/bluebubbles-policy`, `plugin-sdk/mattermost`, `plugin-sdk/mattermost-policy`, `plugin-sdk/feishu-conversation`, `plugin-sdk/msteams`, `plugin-sdk/nextcloud-talk`, `plugin-sdk/nostr`, `plugin-sdk/tlon`, `plugin-sdk/twitch` | Kompatibilitäts-/Helper-Seams für gebündelte Kanäle |
    | Auth-/pluginspezifische Helfer | `plugin-sdk/github-copilot-login`, `plugin-sdk/github-copilot-token`, `plugin-sdk/diagnostics-otel`, `plugin-sdk/diffs`, `plugin-sdk/llm-task`, `plugin-sdk/thread-ownership`, `plugin-sdk/voice-call` | Helper-Seams für gebündelte Funktionen/Plugins; `plugin-sdk/github-copilot-token` exportiert derzeit `DEFAULT_COPILOT_API_BASE_URL`, `deriveCopilotApiBaseUrlFromToken` und `resolveCopilotApiToken` |
  </Accordion>
</AccordionGroup>

## Registrierungs-API

Der Callback `register(api)` erhält ein Objekt `OpenClawPluginApi` mit diesen
Methoden:

### Registrierung von Fähigkeiten

| Methode                                          | Was registriert wird                 |
| ------------------------------------------------ | ------------------------------------ |
| `api.registerProvider(...)`                      | Text-Inferenz (LLM)                  |
| `api.registerAgentHarness(...)`                  | Experimenteller Low-Level-Agent-Executor |
| `api.registerCliBackend(...)`                    | Lokales CLI-Inferenz-Backend         |
| `api.registerChannel(...)`                       | Messaging-Kanal                      |
| `api.registerSpeechProvider(...)`                | Text-to-Speech / STT-Synthese        |
| `api.registerRealtimeTranscriptionProvider(...)` | Streaming-Echtzeittranskription      |
| `api.registerRealtimeVoiceProvider(...)`         | Duplex-Echtzeit-Voice-Sitzungen      |
| `api.registerMediaUnderstandingProvider(...)`    | Bild-/Audio-/Videoanalyse            |
| `api.registerImageGenerationProvider(...)`       | Bildgenerierung                      |
| `api.registerMusicGenerationProvider(...)`       | Musikgenerierung                     |
| `api.registerVideoGenerationProvider(...)`       | Videogenerierung                     |
| `api.registerWebFetchProvider(...)`              | Web-Fetch-/Scrape-Provider           |
| `api.registerWebSearchProvider(...)`             | Websuche                             |

### Tools und Befehle

| Methode                        | Was registriert wird                            |
| ----------------------------- | ----------------------------------------------- |
| `api.registerTool(tool, opts?)` | Agent-Tool (erforderlich oder `{ optional: true }`) |
| `api.registerCommand(def)`      | Benutzerdefinierter Befehl (umgeht das LLM)     |

### Infrastruktur

| Methode                                        | Was registriert wird                    |
| --------------------------------------------- | --------------------------------------- |
| `api.registerHook(events, handler, opts?)`     | Event-Hook                              |
| `api.registerHttpRoute(params)`                | Gateway-HTTP-Endpunkt                   |
| `api.registerGatewayMethod(name, handler)`     | Gateway-RPC-Methode                     |
| `api.registerCli(registrar, opts?)`            | CLI-Subcommand                          |
| `api.registerService(service)`                 | Hintergrunddienst                       |
| `api.registerInteractiveHandler(registration)` | Interaktiver Handler                    |
| `api.registerMemoryPromptSupplement(builder)`  | Additiver memory-naher Prompt-Abschnitt |
| `api.registerMemoryCorpusSupplement(adapter)`  | Additiver Such-/Lesekorpus für Memory   |

Reservierte Core-Admin-Namespaces (`config.*`, `exec.approvals.*`, `wizard.*`,
`update.*`) bleiben immer `operator.admin`, auch wenn ein Plugin versucht, einen
engeren Scope für Gateway-Methoden zuzuweisen. Bevorzugen Sie pluginspezifische Präfixe für
pluginbesessene Methoden.

### CLI-Registrierungsmetadaten

`api.registerCli(registrar, opts?)` akzeptiert zwei Arten von Top-Level-Metadaten:

- `commands`: explizite Befehls-Roots, die dem Registrar gehören
- `descriptors`: Parse-Time-Befehlsdeskriptoren, die für Root-CLI-Hilfe,
  Routing und lazy Plugin-CLI-Registrierung verwendet werden

Wenn ein Plugin-Befehl im normalen Root-CLI-Pfad lazy geladen bleiben soll,
geben Sie `descriptors` an, die jeden Top-Level-Befehls-Root abdecken, der durch diesen
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
        description: "Manage Matrix accounts, verification, devices, and profile state",
        hasSubcommands: true,
      },
    ],
  },
);
```

Verwenden Sie `commands` allein nur dann, wenn Sie keine lazy Registrierung der Root-CLI benötigen.
Dieser eager Kompatibilitätspfad bleibt unterstützt, installiert jedoch keine
descriptorbasierten Platzhalter für Parse-Time-Lazy-Loading.

### Registrierung von CLI-Backends

`api.registerCliBackend(...)` erlaubt es einem Plugin, die Standardkonfiguration für ein lokales
KI-CLI-Backend wie `codex-cli` zu besitzen.

- Die Backend-`id` wird zum Provider-Präfix in Modellreferenzen wie `codex-cli/gpt-5`.
- Die Backend-`config` verwendet dieselbe Form wie `agents.defaults.cliBackends.<id>`.
- Benutzerkonfiguration gewinnt weiterhin. OpenClaw führt `agents.defaults.cliBackends.<id>` über die
  Plugin-Standardeinstellung zusammen, bevor die CLI ausgeführt wird.
- Verwenden Sie `normalizeConfig`, wenn ein Backend nach dem Zusammenführen Kompatibilitäts-Umschreibungen braucht
  (zum Beispiel zur Normalisierung alter Flag-Formen).

### Exklusive Slots

| Methode                                    | Was registriert wird                                                                                                                                    |
| ------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerContextEngine(id, factory)`   | Context-Engine (immer nur eine aktiv). Der Callback `assemble()` erhält `availableTools` und `citationsMode`, damit die Engine Prompt-Ergänzungen anpassen kann. |
| `api.registerMemoryCapability(capability)` | Einheitliche Memory-Fähigkeit                                                                                                                            |
| `api.registerMemoryPromptSection(builder)` | Builder für einen Memory-Prompt-Abschnitt                                                                                                                |
| `api.registerMemoryFlushPlan(resolver)`    | Resolver für Memory-Flush-Pläne                                                                                                                          |
| `api.registerMemoryRuntime(runtime)`       | Adapter für die Memory-Laufzeit                                                                                                                          |

### Adapter für Memory-Embeddings

| Methode                                        | Was registriert wird                           |
| --------------------------------------------- | ---------------------------------------------- |
| `api.registerMemoryEmbeddingProvider(adapter)` | Memory-Embedding-Adapter für das aktive Plugin |

- `registerMemoryCapability` ist die bevorzugte API für exklusive Memory-Plugins.
- `registerMemoryCapability` kann auch `publicArtifacts.listArtifacts(...)` bereitstellen,
  sodass Begleit-Plugins exportierte Memory-Artefakte über
  `openclaw/plugin-sdk/memory-host-core` konsumieren können, statt in das private Layout
  eines bestimmten Memory-Plugins zu greifen.
- `registerMemoryPromptSection`, `registerMemoryFlushPlan` und
  `registerMemoryRuntime` sind Legacy-kompatible APIs für exklusive Memory-Plugins.
- `registerMemoryEmbeddingProvider` erlaubt es dem aktiven Memory-Plugin, einen
  oder mehrere Embedding-Adapter-IDs zu registrieren (zum Beispiel `openai`, `gemini` oder eine benutzerdefinierte ID des Plugins).
- Benutzerkonfiguration wie `agents.defaults.memorySearch.provider` und
  `agents.defaults.memorySearch.fallback` wird gegen diese registrierten
  Adapter-IDs aufgelöst.

### Ereignisse und Lebenszyklus

| Methode                                      | Was sie tut                   |
| ------------------------------------------- | ----------------------------- |
| `api.on(hookName, handler, opts?)`           | Typisierter Lifecycle-Hook    |
| `api.onConversationBindingResolved(handler)` | Callback für Konversationsbindung |

### Entscheidungssemantik von Hooks

- `before_tool_call`: Die Rückgabe von `{ block: true }` ist terminal. Sobald ein Handler dies setzt, werden Handler mit niedrigerer Priorität übersprungen.
- `before_tool_call`: Die Rückgabe von `{ block: false }` wird als keine Entscheidung behandelt (wie das Weglassen von `block`), nicht als Override.
- `before_install`: Die Rückgabe von `{ block: true }` ist terminal. Sobald ein Handler dies setzt, werden Handler mit niedrigerer Priorität übersprungen.
- `before_install`: Die Rückgabe von `{ block: false }` wird als keine Entscheidung behandelt (wie das Weglassen von `block`), nicht als Override.
- `reply_dispatch`: Die Rückgabe von `{ handled: true, ... }` ist terminal. Sobald ein Handler den Dispatch beansprucht, werden Handler mit niedrigerer Priorität und der standardmäßige Modell-Dispatch-Pfad übersprungen.
- `message_sending`: Die Rückgabe von `{ cancel: true }` ist terminal. Sobald ein Handler dies setzt, werden Handler mit niedrigerer Priorität übersprungen.
- `message_sending`: Die Rückgabe von `{ cancel: false }` wird als keine Entscheidung behandelt (wie das Weglassen von `cancel`), nicht als Override.

### Felder des API-Objekts

| Feld                     | Typ                       | Beschreibung                                                                                |
| ------------------------ | ------------------------- | ------------------------------------------------------------------------------------------ |
| `api.id`                 | `string`                  | Plugin-ID                                                                                  |
| `api.name`               | `string`                  | Anzeigename                                                                                |
| `api.version`            | `string?`                 | Plugin-Version (optional)                                                                  |
| `api.description`        | `string?`                 | Plugin-Beschreibung (optional)                                                             |
| `api.source`             | `string`                  | Plugin-Quellpfad                                                                           |
| `api.rootDir`            | `string?`                 | Root-Verzeichnis des Plugins (optional)                                                    |
| `api.config`             | `OpenClawConfig`          | Aktueller Konfigurations-Snapshot (aktive In-Memory-Laufzeitaufnahme, wenn verfügbar)     |
| `api.pluginConfig`       | `Record<string, unknown>` | Pluginspezifische Konfiguration aus `plugins.entries.<id>.config`                          |
| `api.runtime`            | `PluginRuntime`           | [Laufzeithelfer](/de/plugins/sdk-runtime)                                                     |
| `api.logger`             | `PluginLogger`            | Scoped Logger (`debug`, `info`, `warn`, `error`)                                           |
| `api.registrationMode`   | `PluginRegistrationMode`  | Aktueller Lademodus; `"setup-runtime"` ist das leichtgewichtige Vor-dem-vollständigen-Einstiegspunkt-Start-/Setup-Fenster |
| `api.resolvePath(input)` | `(string) => string`      | Pfad relativ zum Plugin-Root auflösen                                                      |

## Interne Modulkonvention

Verwenden Sie innerhalb Ihres Plugins lokale Barrel-Dateien für interne Importe:

```
my-plugin/
  api.ts            # Öffentliche Exporte für externe Verbraucher
  runtime-api.ts    # Nur interne Laufzeit-Exporte
  index.ts          # Plugin-Einstiegspunkt
  setup-entry.ts    # Leichtgewichtiger nur-Setup-Einstiegspunkt (optional)
```

<Warning>
  Importieren Sie Ihr eigenes Plugin im Produktionscode niemals über `openclaw/plugin-sdk/<your-plugin>`.
  Leiten Sie interne Importe über `./api.ts` oder
  `./runtime-api.ts`. Der SDK-Pfad ist nur der externe Vertrag.
</Warning>

Öffentliche Oberflächen facade-geladener gebündelter Plugins (`api.ts`, `runtime-api.ts`,
`index.ts`, `setup-entry.ts` und ähnliche öffentliche Einstiegsdateien) bevorzugen jetzt den
aktiven Laufzeit-Konfigurations-Snapshot, wenn OpenClaw bereits läuft. Wenn noch kein Laufzeit-Snapshot existiert, greifen sie auf die auf der Festplatte aufgelöste Konfigurationsdatei zurück.

Provider-Plugins können außerdem ein schmales pluginlokales Vertrags-Barrel bereitstellen, wenn ein Helfer bewusst providerspezifisch ist und noch nicht in einen generischen SDK-Subpath gehört. Aktuelles gebündeltes Beispiel: Der Anthropic-Provider behält seine Claude-
Stream-Helfer in seiner eigenen öffentlichen `api.ts`- / `contract-api.ts`-Seam, anstatt die Anthropic-Beta-Header- und `service_tier`-Logik in einen generischen
`plugin-sdk/*`-Vertrag zu überführen.

Weitere aktuelle gebündelte Beispiele:

- `@openclaw/openai-provider`: `api.ts` exportiert Provider-Builder,
  Standardmodell-Helfer und Builder für Realtime-Provider
- `@openclaw/openrouter-provider`: `api.ts` exportiert den Provider-Builder sowie
  Helfer für Onboarding/Konfiguration

<Warning>
  Produktionscode von Erweiterungen sollte außerdem Importe von `openclaw/plugin-sdk/<other-plugin>`
  vermeiden. Wenn ein Helfer wirklich gemeinsam genutzt wird, verschieben Sie ihn in einen neutralen SDK-Subpath
  wie `openclaw/plugin-sdk/speech`, `.../provider-model-shared` oder eine andere
  fähigkeitsorientierte Oberfläche, statt zwei Plugins miteinander zu koppeln.
</Warning>

## Verwandt

- [Entry Points](/de/plugins/sdk-entrypoints) — Optionen für `definePluginEntry` und `defineChannelPluginEntry`
- [Runtime Helpers](/de/plugins/sdk-runtime) — vollständige Referenz des Namespace `api.runtime`
- [Setup and Config](/de/plugins/sdk-setup) — Packaging, Manifeste, Konfigurationsschemata
- [Testing](/de/plugins/sdk-testing) — Test-Utilities und Lint-Regeln
- [SDK Migration](/de/plugins/sdk-migration) — Migration von veralteten Oberflächen
- [Plugin Internals](/de/plugins/architecture) — tiefgehende Architektur und Fähigkeitsmodell
