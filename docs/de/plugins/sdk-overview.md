---
read_when:
    - Sie müssen wissen, aus welchem SDK-Subpfad importiert werden soll
    - Sie möchten eine Referenz für alle Registrierungsmethoden auf OpenClawPluginApi
    - Sie suchen einen bestimmten SDK-Export nach
sidebarTitle: SDK Overview
summary: Import-Map, Referenz der Registrierungs-API und SDK-Architektur
title: Plugin-SDK-Überblick
x-i18n:
    generated_at: "2026-04-23T06:32:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5f9608fa3194b1b1609d16d7e2077ea58de097e9e8d4cedef4cb975adfb92938
    source_path: plugins/sdk-overview.md
    workflow: 15
---

# Plugin-SDK-Überblick

Das Plugin-SDK ist der typisierte Vertrag zwischen Plugins und Core. Diese Seite ist die
Referenz für **was importiert werden soll** und **was registriert werden kann**.

<Tip>
  **Sie suchen einen How-to-Leitfaden?**
  - Erstes Plugin? Beginnen Sie mit [Erste Schritte](/de/plugins/building-plugins)
  - Kanal-Plugin? Siehe [Kanal-Plugins](/de/plugins/sdk-channel-plugins)
  - Provider-Plugin? Siehe [Provider-Plugins](/de/plugins/sdk-provider-plugins)
</Tip>

## Importkonvention

Importieren Sie immer aus einem bestimmten Subpfad:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

Jeder Subpfad ist ein kleines, in sich geschlossenes Modul. Das hält den Start schnell und
verhindert Probleme mit zyklischen Abhängigkeiten. Für kanalspezifische Entry-/Build-Helfer
bevorzugen Sie `openclaw/plugin-sdk/channel-core`; behalten Sie `openclaw/plugin-sdk/core` für
die breitere übergreifende Oberfläche und gemeinsame Helfer wie
`buildChannelConfigSchema`.

Fügen Sie keine providerbenannten Convenience-Seams hinzu und hängen Sie nicht von ihnen ab, etwa
`openclaw/plugin-sdk/slack`, `openclaw/plugin-sdk/discord`,
`openclaw/plugin-sdk/signal`, `openclaw/plugin-sdk/whatsapp` oder
kanalmarkierten Helper-Seams. Gebündelte Plugins sollten generische
SDK-Subpfade innerhalb ihrer eigenen `api.ts`- oder `runtime-api.ts`-Barrels zusammensetzen, und der Core
sollte entweder diese pluginlokalen Barrels verwenden oder einen schmalen generischen SDK-
Vertrag hinzufügen, wenn der Bedarf wirklich kanalübergreifend ist.

Die generierte Export-Map enthält weiterhin einen kleinen Satz gebündelter Plugin-Helper-
Seams wie `plugin-sdk/feishu`, `plugin-sdk/feishu-setup`,
`plugin-sdk/zalo`, `plugin-sdk/zalo-setup` und `plugin-sdk/matrix*`. Diese
Subpfade existieren nur für Wartung und Kompatibilität gebündelter Plugins; sie werden
absichtlich aus der allgemeinen Tabelle unten ausgelassen und sind nicht der empfohlene
Importpfad für neue Drittanbieter-Plugins.

## Subpfad-Referenz

Die am häufigsten verwendeten Subpfade, nach Zweck gruppiert. Die generierte vollständige Liste von
mehr als 200 Subpfaden liegt in `scripts/lib/plugin-sdk-entrypoints.json`.

Reservierte gebündelte Plugin-Helper-Subpfade erscheinen weiterhin in dieser generierten Liste.
Behandeln Sie diese als Implementierungsdetail-/Kompatibilitätsoberflächen, sofern eine Dokumentationsseite
nicht ausdrücklich einen davon als öffentlich hervorhebt.

### Plugin-Entry

| Subpfad                    | Zentrale Exporte                                                                                                                       |
| -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/plugin-entry`  | `definePluginEntry`                                                                                                                    |
| `plugin-sdk/core`          | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema` |
| `plugin-sdk/config-schema` | `OpenClawSchema`                                                                                                                       |
| `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry`                                                                                                     |

<AccordionGroup>
  <Accordion title="Kanal-Subpfade">
    | Subpfad | Zentrale Exporte |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | Root-`openclaw.json`-Zod-Schema-Export (`OpenClawSchema`) |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard` sowie `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | Gemeinsame Helfer für Setup-Assistenten, Allowlist-Prompts, Builder für Setup-Status |
    | `plugin-sdk/setup-runtime` | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | `createEnvPatchedAccountSetupAdapter` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | Helfer für Multi-Account-Konfiguration/Aktions-Gates, Helfer für Standardkonto-Fallback |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, Helfer zur Normalisierung von Account-IDs |
    | `plugin-sdk/account-resolution` | Helfer für Kontosuche + Standard-Fallback |
    | `plugin-sdk/account-helpers` | Schmale Helfer für Account-Liste/Account-Aktionen |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | `createChannelReplyPipeline` |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter` |
    | `plugin-sdk/channel-config-schema` | Typen für Kanal-Konfigurationsschemas |
    | `plugin-sdk/telegram-command-config` | Helfer für Normalisierung/Validierung benutzerdefinierter Telegram-Befehle mit Fallback auf gebündelte Verträge |
    | `plugin-sdk/command-gating` | Schmale Helfer für Gates zur Befehlsautorisierung |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-lifecycle` | `createAccountStatusSink`, Helfer für Lifecycle/Finalisierung von Draft-Streams |
    | `plugin-sdk/inbound-envelope` | Gemeinsame Helfer für eingehende Routen und Envelope-Builder |
    | `plugin-sdk/inbound-reply-dispatch` | Gemeinsame Helfer für eingehendes Aufzeichnen und Dispatch |
    | `plugin-sdk/messaging-targets` | Helfer für Parsen/Matching von Zielen |
    | `plugin-sdk/outbound-media` | Gemeinsame Helfer zum Laden ausgehender Medien |
    | `plugin-sdk/outbound-runtime` | Helfer für ausgehende Identität, Send-Delegate und Nutzlastplanung |
    | `plugin-sdk/poll-runtime` | Schmale Helfer zur Poll-Normalisierung |
    | `plugin-sdk/thread-bindings-runtime` | Helfer für Lifecycle und Adapter von Thread-Bindings |
    | `plugin-sdk/agent-media-payload` | Legacy-Builder für Agent-Mediennutzlast |
    | `plugin-sdk/conversation-runtime` | Helfer für Gesprächs-/Thread-Bindung, Pairing und konfigurierte Bindungen |
    | `plugin-sdk/runtime-config-snapshot` | Helfer für Laufzeit-Konfigurations-Snapshots |
    | `plugin-sdk/runtime-group-policy` | Helfer zur Auflösung von Gruppenrichtlinien zur Laufzeit |
    | `plugin-sdk/channel-status` | Gemeinsame Helfer für Snapshots/Zusammenfassungen des Kanalstatus |
    | `plugin-sdk/channel-config-primitives` | Schmale Primitive für Kanal-Konfigurationsschemas |
    | `plugin-sdk/channel-config-writes` | Helfer zur Autorisierung von Schreibvorgängen an der Kanal-Konfiguration |
    | `plugin-sdk/channel-plugin-common` | Gemeinsame Prelude-Exporte für Kanal-Plugins |
    | `plugin-sdk/allowlist-config-edit` | Helfer zum Bearbeiten/Lesen von Allowlist-Konfigurationen |
    | `plugin-sdk/group-access` | Gemeinsame Helfer für Entscheidungen zum Gruppenzugriff |
    | `plugin-sdk/direct-dm` | Gemeinsame Helfer für Auth/Guards von direkten DMs |
    | `plugin-sdk/interactive-runtime` | Hilfen für semantische Nachrichtendarstellung, Zustellung und Legacy-Antworten auf interaktive Nachrichten. Siehe [Message Presentation](/de/plugins/message-presentation) |
    | `plugin-sdk/channel-inbound` | Kompatibilitäts-Barrel für Inbound-Debounce, Mention-Matching, Mention-Policy-Helfer und Envelope-Helfer |
    | `plugin-sdk/channel-mention-gating` | Schmale Mention-Policy-Helfer ohne die breitere eingehende Laufzeitoberfläche |
    | `plugin-sdk/channel-location` | Helfer für Kontext und Formatierung von Kanalstandorten |
    | `plugin-sdk/channel-logging` | Kanal-Logging-Helfer für verworfene Eingänge und Typing-/Ack-Fehler |
    | `plugin-sdk/channel-send-result` | Antwortergebnis-Typen |
    | `plugin-sdk/channel-actions` | Helfer für Kanal-Nachrichtenaktionen sowie veraltete native Schema-Helfer, die für Plugin-Kompatibilität beibehalten werden |
    | `plugin-sdk/channel-targets` | Helfer für Parsen/Matching von Zielen |
    | `plugin-sdk/channel-contract` | Kanalvertrag-Typen |
    | `plugin-sdk/channel-feedback` | Verdrahtung für Feedback/Reaktionen |
    | `plugin-sdk/channel-secret-runtime` | Schmale Secret-Vertrag-Helfer wie `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment` und Secret-Zieltypen |
  </Accordion>

  <Accordion title="Provider-Subpfade">
    | Subpfad | Zentrale Exporte |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/provider-setup` | Kuratierte Setup-Helfer für lokale/self-hosted Provider |
    | `plugin-sdk/self-hosted-provider-setup` | Fokussierte Setup-Helfer für OpenAI-kompatible self-hosted Provider |
    | `plugin-sdk/cli-backend` | CLI-Backend-Standardwerte + Watchdog-Konstanten |
    | `plugin-sdk/provider-auth-runtime` | Laufzeit-Helfer zur Auflösung von API-Schlüsseln für Provider-Plugins |
    | `plugin-sdk/provider-auth-api-key` | Onboarding-/Profil-Schreib-Helfer für API-Schlüssel wie `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | Standard-Builder für OAuth-Authentifizierungsergebnisse |
    | `plugin-sdk/provider-auth-login` | Gemeinsame Helfer für interaktiven Login bei Provider-Plugins |
    | `plugin-sdk/provider-env-vars` | Helfer für die Suche von Umgebungsvariablen für Provider-Authentifizierung |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, gemeinsame Replay-Policy-Builder, Provider-Endpunkt-Helfer und Helfer zur Normalisierung von Modell-IDs wie `normalizeNativeXaiModelId` |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | Generische HTTP-/Endpunkt-Capability-Helfer für Provider, einschließlich Multipart-Form-Helfern für Audiotranskription |
    | `plugin-sdk/provider-web-fetch-contract` | Schmale Vertrag-Helfer für Web-Fetch-Konfiguration/-Auswahl wie `enablePluginInConfig` und `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | Helfer für Registrierung/Cache von Web-Fetch-Providern |
    | `plugin-sdk/provider-web-search-config-contract` | Schmale Helfer für Web-Suche-Konfiguration/Anmeldedaten für Provider, die keine Plugin-Enable-Verdrahtung benötigen |
    | `plugin-sdk/provider-web-search-contract` | Schmale Vertrag-Helfer für Web-Suche-Konfiguration/Anmeldedaten wie `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` und bereichsspezifische Setter/Getter für Anmeldedaten |
    | `plugin-sdk/provider-web-search` | Helfer für Registrierung/Cache/Laufzeit von Web-Such-Providern |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, Gemini-Schema-Bereinigung + Diagnostik sowie xAI-Kompatibilitätshelfer wie `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
    | `plugin-sdk/provider-usage` | `fetchClaudeUsage` und Ähnliches |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, Stream-Wrapper-Typen und gemeinsame Wrapper-Helfer für Anthropic/Bedrock/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
    | `plugin-sdk/provider-transport-runtime` | Native Transport-Helfer für Provider wie guarded fetch, Transformationen von Transportnachrichten und beschreibbare Event-Streams für Transport |
    | `plugin-sdk/provider-onboard` | Helfer für Konfigurations-Patches beim Onboarding |
    | `plugin-sdk/global-singleton` | Prozesslokale Helfer für Singletons/Maps/Caches |
  </Accordion>

  <Accordion title="Subpfade für Authentifizierung und Sicherheit">
    | Subpfad | Zentrale Exporte |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, Helfer für Befehlsregistrierung, Helfer für Sender-Autorisierung |
    | `plugin-sdk/command-status` | Builder für Befehls-/Hilfenachrichten wie `buildCommandsMessagePaginated` und `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | Helfer zur Auflösung von Genehmigern und für Aktionsauthentifizierung im selben Chat |
    | `plugin-sdk/approval-client-runtime` | Helfer für native Exec-Genehmigungsprofile/-Filter |
    | `plugin-sdk/approval-delivery-runtime` | Adapter für native Genehmigungs-Capability/Zustellung |
    | `plugin-sdk/approval-gateway-runtime` | Gemeinsamer Helfer zur Auflösung des Genehmigungs-Gateway |
    | `plugin-sdk/approval-handler-adapter-runtime` | Leichtgewichtige Helfer zum Laden nativer Genehmigungsadapter für Hot-Kanal-Entrypoints |
    | `plugin-sdk/approval-handler-runtime` | Umfassendere Laufzeithelfer für Genehmigungshandler; bevorzugen Sie die schmaleren Adapter-/Gateway-Seams, wenn diese ausreichen |
    | `plugin-sdk/approval-native-runtime` | Helfer für natives Genehmigungsziel und Account-Binding |
    | `plugin-sdk/approval-reply-runtime` | Helfer für Antwort-Nutzlasten bei Exec-/Plugin-Genehmigungen |
    | `plugin-sdk/command-auth-native` | Native Befehlsauthentifizierung und Helfer für native Sitzungsziele |
    | `plugin-sdk/command-detection` | Gemeinsame Helfer zur Befehlserkennung |
    | `plugin-sdk/command-surface` | Helfer für Normalisierung des Befehls-Body und Befehlsoberfläche |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | Schmale Helfer zur Sammlung von Secret-Verträgen für Secret-Oberflächen von Kanal/Plugin |
    | `plugin-sdk/secret-ref-runtime` | Schmale Hilfen zu `coerceSecretRef` und SecretRef-Typisierung für Secret-Vertrag-/Konfigurations-Parsing |
    | `plugin-sdk/security-runtime` | Gemeinsame Helfer für Vertrauen, DM-Gating, externe Inhalte und Secret-Sammlung |
    | `plugin-sdk/ssrf-policy` | Helfer für Host-Allowlist und private Netzwerk-SSRF-Richtlinien |
    | `plugin-sdk/ssrf-dispatcher` | Schmale Helfer für angeheftete Dispatcher ohne die breite Infra-Laufzeitoberfläche |
    | `plugin-sdk/ssrf-runtime` | Helfer für angeheftete Dispatcher, SSRF-geschütztes Fetch und SSRF-Richtlinien |
    | `plugin-sdk/secret-input` | Helfer zum Parsen von Secret-Eingaben |
    | `plugin-sdk/webhook-ingress` | Helfer für Webhook-Anfragen/-Ziele |
    | `plugin-sdk/webhook-request-guards` | Helfer für Body-Größe/Timeout von Anfragen |
  </Accordion>

  <Accordion title="Subpfade für Laufzeit und Speicherung">
    | Subpfad | Zentrale Exporte |
    | --- | --- |
    | `plugin-sdk/runtime` | Breite Helfer für Laufzeit/Logging/Backups/Plugin-Installation |
    | `plugin-sdk/runtime-env` | Schmale Helfer für Laufzeit-Umgebung, Logger, Timeout, Retry und Backoff |
    | `plugin-sdk/channel-runtime-context` | Generische Helfer für Registrierung und Lookup von Kanal-Laufzeitkontext |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Gemeinsame Helfer für Plugin-Befehle/-Hooks/-HTTP/-Interaktivität |
    | `plugin-sdk/hook-runtime` | Gemeinsame Helfer für Webhook-/interne Hook-Pipelines |
    | `plugin-sdk/lazy-runtime` | Helfer für Lazy-Import/Lazy-Binding der Laufzeit wie `createLazyRuntimeModule`, `createLazyRuntimeMethod` und `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | Helfer zum Ausführen von Prozessen |
    | `plugin-sdk/cli-runtime` | Helfer für CLI-Formatierung, Warten und Versionsinformationen |
    | `plugin-sdk/gateway-runtime` | Helfer für Gateway-Client und Channel-Status-Patches |
    | `plugin-sdk/config-runtime` | Helfer zum Laden/Schreiben von Konfiguration und zum Lookup von Plugin-Konfiguration |
    | `plugin-sdk/telegram-command-config` | Helfer für Normalisierung von Telegram-Befehlsnamen/-Beschreibungen sowie Prüfungen auf Duplikate/Konflikte, auch wenn die gebündelte Telegram-Vertragsoberfläche nicht verfügbar ist |
    | `plugin-sdk/text-autolink-runtime` | Erkennung von Dateireferenz-Autolinks ohne das breite `text-runtime`-Barrel |
    | `plugin-sdk/approval-runtime` | Helfer für Exec-/Plugin-Genehmigungen, Builder für Genehmigungs-Capabilities, Auth-/Profil-Helfer, native Routing-/Laufzeithelfer |
    | `plugin-sdk/reply-runtime` | Gemeinsame Helfer für eingehende/Antwort-Laufzeit, Chunking, Dispatch, Heartbeat, Antwortplaner |
    | `plugin-sdk/reply-dispatch-runtime` | Schmale Helfer für Dispatch/Finalisierung von Antworten |
    | `plugin-sdk/reply-history` | Gemeinsame Helfer für Antwortverlauf in kurzen Fenstern wie `buildHistoryContext`, `recordPendingHistoryEntry` und `clearHistoryEntriesIfEnabled` |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | Schmale Helfer für Text-/Markdown-Chunking |
    | `plugin-sdk/session-store-runtime` | Helfer für Pfade und `updated-at` des Sitzungsspeichers |
    | `plugin-sdk/state-paths` | Helfer für Pfade von State-/OAuth-Verzeichnissen |
    | `plugin-sdk/routing` | Helfer für Route/Sitzungsschlüssel/Account-Bindung wie `resolveAgentRoute`, `buildAgentSessionKey` und `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | Gemeinsame Helfer für Kanal-/Account-Statuszusammenfassungen, Standardwerte für Laufzeitstatus und Problemmetadaten |
    | `plugin-sdk/target-resolver-runtime` | Gemeinsame Helfer zum Auflösen von Zielen |
    | `plugin-sdk/string-normalization-runtime` | Helfer zur Normalisierung von Slugs/Strings |
    | `plugin-sdk/request-url` | String-URLs aus fetch-/request-ähnlichen Eingaben extrahieren |
    | `plugin-sdk/run-command` | Zeitgesteuerter Befehlsrunner mit normalisierten Ergebnissen für stdout/stderr |
    | `plugin-sdk/param-readers` | Gemeinsame Leser für Tool-/CLI-Parameter |
    | `plugin-sdk/tool-payload` | Normalisierte Nutzlasten aus Tool-Ergebnisobjekten extrahieren |
    | `plugin-sdk/tool-send` | Kanonische Send-Zielfelder aus Tool-Argumenten extrahieren |
    | `plugin-sdk/temp-path` | Gemeinsame Helfer für Pfade zu temporären Downloads |
    | `plugin-sdk/logging-core` | Helfer für Subsystem-Logger und Schwärzung |
    | `plugin-sdk/markdown-table-runtime` | Helfer für Markdown-Tabellenmodus |
    | `plugin-sdk/json-store` | Kleine Helfer zum Lesen/Schreiben von JSON-Status |
    | `plugin-sdk/file-lock` | Reentrante Helfer für Dateisperren |
    | `plugin-sdk/persistent-dedupe` | Helfer für festplattenbasierten Dedupe-Cache |
    | `plugin-sdk/acp-runtime` | ACP-Laufzeit-/Sitzungs- und Antwort-Dispatch-Helfer |
    | `plugin-sdk/acp-binding-resolve-runtime` | Schreibgeschützte Auflösung von ACP-Bindings ohne Lifecycle-Start-Importe |
    | `plugin-sdk/agent-config-primitives` | Schmale Primitive für Agent-Laufzeit-Konfigurationsschemas |
    | `plugin-sdk/boolean-param` | Leser für lockere boolesche Parameter |
    | `plugin-sdk/dangerous-name-runtime` | Helfer zur Auflösung von gefährlichen Namensübereinstimmungen |
    | `plugin-sdk/device-bootstrap` | Helfer für Geräte-Bootstrap und Pairing-Tokens |
    | `plugin-sdk/extension-shared` | Gemeinsame Primitive für passive Kanäle, Status und Ambient-Proxy-Helfer |
    | `plugin-sdk/models-provider-runtime` | Helfer für `/models`-Befehl und Provider-Antworten |
    | `plugin-sdk/skill-commands-runtime` | Helfer zum Auflisten von Skill-Befehlen |
    | `plugin-sdk/native-command-registry` | Helfer zum Erstellen/Serialisieren der nativen Befehlsregistrierung |
    | `plugin-sdk/agent-harness` | Experimentelle Oberfläche für vertrauenswürdige Plugins für Low-Level-Agent-Harnesses: Harness-Typen, Helfer zum Steuern/Abbrechen aktiver Läufe, OpenClaw-Tool-Bridge-Helfer und Hilfsfunktionen für Versuchsergebnisse |
    | `plugin-sdk/provider-zai-endpoint` | Helfer zur Erkennung von Z.AI-Endpunkten |
    | `plugin-sdk/infra-runtime` | Helfer für Systemereignisse/Heartbeat |
    | `plugin-sdk/collection-runtime` | Kleine Helfer für begrenzte Caches |
    | `plugin-sdk/diagnostic-runtime` | Helfer für Diagnose-Flags und -Ereignisse |
    | `plugin-sdk/error-runtime` | Helfer für Fehlergraph, Formatierung, gemeinsame Fehlerklassifizierung, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | Helfer für gewrapptes Fetch, Proxy und angeheftetes Lookup |
    | `plugin-sdk/runtime-fetch` | Dispatcher-bewusstes Runtime-Fetch ohne Proxy-/Guarded-Fetch-Importe |
    | `plugin-sdk/response-limit-runtime` | Begrenzter Reader für Antwort-Bodies ohne die breite Medien-Laufzeitoberfläche |
    | `plugin-sdk/session-binding-runtime` | Aktueller Zustand der Gesprächsbindung ohne Routing für konfigurierte Bindungen oder Pairing-Stores |
    | `plugin-sdk/session-store-runtime` | Helfer zum Lesen des Sitzungsspeichers ohne breite Konfigurationsschreib-/Wartungsimporte |
    | `plugin-sdk/context-visibility-runtime` | Auflösung von Kontextsichtigkeit und Filterung ergänzender Kontexte ohne breite Konfigurations-/Sicherheitsimporte |
    | `plugin-sdk/string-coerce-runtime` | Schmale Helfer für Primitive-Record-/String-Coercion und Normalisierung ohne Markdown-/Logging-Importe |
    | `plugin-sdk/host-runtime` | Helfer zur Normalisierung von Hostnamen und SCP-Hosts |
    | `plugin-sdk/retry-runtime` | Helfer für Retry-Konfiguration und Retry-Runner |
    | `plugin-sdk/agent-runtime` | Helfer für Agent-Verzeichnis/Identität/Workspace |
    | `plugin-sdk/directory-runtime` | Konfigurationsgestützte Verzeichnisabfrage/-Dedupe |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Subpfade für Capabilities und Tests">
    | Subpfad | Zentrale Exporte |
    | --- | --- |
    | `plugin-sdk/media-runtime` | Gemeinsame Helfer für Abruf/Transformation/Speicherung von Medien plus Builder für Medien-Nutzlasten |
    | `plugin-sdk/media-generation-runtime` | Gemeinsame Helfer für Mediengenerierungs-Failover, Kandidatenauswahl und Meldungen bei fehlenden Modellen |
    | `plugin-sdk/media-understanding` | Provider-Typen für Medienverständnis plus providerseitige Exporte von Bild-/Audio-Helfern |
    | `plugin-sdk/text-runtime` | Gemeinsame Text-/Markdown-/Logging-Helfer wie Entfernen von für den Assistant sichtbarem Text, Helfer für Rendering/Chunking/Tabellen in Markdown, Helfer für Schwärzung, Helfer für Direktiven-Tags und Hilfsfunktionen für sicheren Text |
    | `plugin-sdk/text-chunking` | Helfer für Chunking ausgehender Texte |
    | `plugin-sdk/speech` | Speech-Provider-Typen plus providerseitige Helfer für Direktiven, Registry und Validierung |
    | `plugin-sdk/speech-core` | Gemeinsame Speech-Provider-Typen sowie Helfer für Registry, Direktiven und Normalisierung |
    | `plugin-sdk/realtime-transcription` | Provider-Typen für Echtzeittranskription, Registry-Helfer und gemeinsamer WebSocket-Sitzungshelfer |
    | `plugin-sdk/realtime-voice` | Provider-Typen und Registry-Helfer für Echtzeitstimme |
    | `plugin-sdk/image-generation` | Provider-Typen für Bildgenerierung |
    | `plugin-sdk/image-generation-core` | Gemeinsame Typen, Failover-, Auth- und Registry-Helfer für Bildgenerierung |
    | `plugin-sdk/music-generation` | Provider-/Anfrage-/Ergebnistypen für Musikgenerierung |
    | `plugin-sdk/music-generation-core` | Gemeinsame Typen, Failover-Helfer, Provider-Lookup und Parsing von Modell-Refs für Musikgenerierung |
    | `plugin-sdk/video-generation` | Provider-/Anfrage-/Ergebnistypen für Videogenerierung |
    | `plugin-sdk/video-generation-core` | Gemeinsame Typen, Failover-Helfer, Provider-Lookup und Parsing von Modell-Refs für Videogenerierung |
    | `plugin-sdk/webhook-targets` | Helfer für Registry von Webhook-Zielen und Installation von Routen |
    | `plugin-sdk/webhook-path` | Helfer zur Normalisierung von Webhook-Pfaden |
    | `plugin-sdk/web-media` | Gemeinsame Helfer zum Laden entfernter/lokaler Medien |
    | `plugin-sdk/zod` | Reexportiertes `zod` für Plugin-SDK-Konsumenten |
    | `plugin-sdk/testing` | `installCommonResolveTargetErrorCases`, `shouldAckReaction` |
  </Accordion>

  <Accordion title="Speicher-Subpfade">
    | Subpfad | Zentrale Exporte |
    | --- | --- |
    | `plugin-sdk/memory-core` | Gebündelte `memory-core`-Helferoberfläche für Manager-/Konfigurations-/Datei-/CLI-Helfer |
    | `plugin-sdk/memory-core-engine-runtime` | Laufzeit-Fassade für Speicherindex/-suche |
    | `plugin-sdk/memory-core-host-engine-foundation` | Exporte der Foundation-Engine des Speicher-Hosts |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Embedding-Verträge des Speicher-Hosts, Registry-Zugriff, lokaler Provider und generische Batch-/Remote-Helfer |
    | `plugin-sdk/memory-core-host-engine-qmd` | Exporte der QMD-Engine des Speicher-Hosts |
    | `plugin-sdk/memory-core-host-engine-storage` | Exporte der Speicher-Engine des Speicher-Hosts |
    | `plugin-sdk/memory-core-host-multimodal` | Multimodale Helfer des Speicher-Hosts |
    | `plugin-sdk/memory-core-host-query` | Query-Helfer des Speicher-Hosts |
    | `plugin-sdk/memory-core-host-secret` | Secret-Helfer des Speicher-Hosts |
    | `plugin-sdk/memory-core-host-events` | Helfer für Event-Journal des Speicher-Hosts |
    | `plugin-sdk/memory-core-host-status` | Status-Helfer des Speicher-Hosts |
    | `plugin-sdk/memory-core-host-runtime-cli` | CLI-Laufzeithelfer des Speicher-Hosts |
    | `plugin-sdk/memory-core-host-runtime-core` | Kern-Laufzeithelfer des Speicher-Hosts |
    | `plugin-sdk/memory-core-host-runtime-files` | Datei-/Laufzeithelfer des Speicher-Hosts |
    | `plugin-sdk/memory-host-core` | Anbieterneutraler Alias für Kern-Laufzeithelfer des Speicher-Hosts |
    | `plugin-sdk/memory-host-events` | Anbieterneutraler Alias für Helfer des Event-Journals des Speicher-Hosts |
    | `plugin-sdk/memory-host-files` | Anbieterneutraler Alias für Datei-/Laufzeithelfer des Speicher-Hosts |
    | `plugin-sdk/memory-host-markdown` | Gemeinsame Helfer für verwaltetes Markdown für speichernahe Plugins |
    | `plugin-sdk/memory-host-search` | Active Memory-Laufzeit-Fassade für Zugriff auf den Suchmanager |
    | `plugin-sdk/memory-host-status` | Anbieterneutraler Alias für Status-Helfer des Speicher-Hosts |
    | `plugin-sdk/memory-lancedb` | Gebündelte `memory-lancedb`-Helferoberfläche |
  </Accordion>

  <Accordion title="Reservierte Subpfade für gebündelte Hilfen">
    | Familie | Aktuelle Subpfade | Vorgesehene Verwendung |
    | --- | --- | --- |
    | Browser | `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support` | Support-Helfer für gebündelte Browser-Plugins (`browser-support` bleibt das Kompatibilitäts-Barrel) |
    | Matrix | `plugin-sdk/matrix`, `plugin-sdk/matrix-helper`, `plugin-sdk/matrix-runtime-heavy`, `plugin-sdk/matrix-runtime-shared`, `plugin-sdk/matrix-runtime-surface`, `plugin-sdk/matrix-surface`, `plugin-sdk/matrix-thread-bindings` | Gebündelte Matrix-Helfer-/Laufzeitoberfläche |
    | Line | `plugin-sdk/line`, `plugin-sdk/line-core`, `plugin-sdk/line-runtime`, `plugin-sdk/line-surface` | Gebündelte LINE-Helfer-/Laufzeitoberfläche |
    | IRC | `plugin-sdk/irc`, `plugin-sdk/irc-surface` | Gebündelte IRC-Helferoberfläche |
    | Kanalspezifische Helfer | `plugin-sdk/googlechat`, `plugin-sdk/zalouser`, `plugin-sdk/bluebubbles`, `plugin-sdk/bluebubbles-policy`, `plugin-sdk/mattermost`, `plugin-sdk/mattermost-policy`, `plugin-sdk/feishu-conversation`, `plugin-sdk/msteams`, `plugin-sdk/nextcloud-talk`, `plugin-sdk/nostr`, `plugin-sdk/tlon`, `plugin-sdk/twitch` | Gebündelte Kompatibilitäts-/Helfer-Seams für Kanäle |
    | Auth-/pluginspezifische Helfer | `plugin-sdk/github-copilot-login`, `plugin-sdk/github-copilot-token`, `plugin-sdk/diagnostics-otel`, `plugin-sdk/diffs`, `plugin-sdk/llm-task`, `plugin-sdk/thread-ownership`, `plugin-sdk/voice-call` | Gebündelte Feature-/Plugin-Helfer-Seams; `plugin-sdk/github-copilot-token` exportiert derzeit `DEFAULT_COPILOT_API_BASE_URL`, `deriveCopilotApiBaseUrlFromToken` und `resolveCopilotApiToken` |
  </Accordion>
</AccordionGroup>

## Registrierungs-API

Der Callback `register(api)` erhält ein `OpenClawPluginApi`-Objekt mit diesen
Methoden:

### Capability-Registrierung

| Methode                                          | Was sie registriert                    |
| ------------------------------------------------ | -------------------------------------- |
| `api.registerProvider(...)`                      | Text-Inference (LLM)                   |
| `api.registerAgentHarness(...)`                  | Experimenteller Low-Level-Agent-Ausführer |
| `api.registerCliBackend(...)`                    | Lokales CLI-Inference-Backend          |
| `api.registerChannel(...)`                       | Messaging-Kanal                        |
| `api.registerSpeechProvider(...)`                | Text-to-Speech / STT-Synthese          |
| `api.registerRealtimeTranscriptionProvider(...)` | Streaming-Echtzeittranskription        |
| `api.registerRealtimeVoiceProvider(...)`         | Duplex-Echtzeit-Sprachsitzungen        |
| `api.registerMediaUnderstandingProvider(...)`    | Bild-/Audio-/Videoanalyse              |
| `api.registerImageGenerationProvider(...)`       | Bildgenerierung                        |
| `api.registerMusicGenerationProvider(...)`       | Musikgenerierung                       |
| `api.registerVideoGenerationProvider(...)`       | Videogenerierung                       |
| `api.registerWebFetchProvider(...)`              | Web-Fetch-/Scrape-Provider             |
| `api.registerWebSearchProvider(...)`             | Websuche                               |

### Tools und Befehle

| Methode                         | Was sie registriert                             |
| ------------------------------- | ----------------------------------------------- |
| `api.registerTool(tool, opts?)` | Agent-Tool (erforderlich oder `{ optional: true }`) |
| `api.registerCommand(def)`      | Benutzerdefinierter Befehl (umgeht das LLM)     |

### Infrastruktur

| Methode                                         | Was sie registriert                    |
| ----------------------------------------------- | -------------------------------------- |
| `api.registerHook(events, handler, opts?)`      | Event-Hook                             |
| `api.registerHttpRoute(params)`                 | Gateway-HTTP-Endpunkt                  |
| `api.registerGatewayMethod(name, handler)`      | Gateway-RPC-Methode                    |
| `api.registerCli(registrar, opts?)`             | CLI-Unterbefehl                        |
| `api.registerService(service)`                  | Hintergrunddienst                      |
| `api.registerInteractiveHandler(registration)`  | Interaktiver Handler                   |
| `api.registerEmbeddedExtensionFactory(factory)` | Factory für Pi-Erweiterungen im eingebetteten Runner |
| `api.registerMemoryPromptSupplement(builder)`   | Additiver speichernaher Prompt-Abschnitt |
| `api.registerMemoryCorpusSupplement(adapter)`   | Additiver Such-/Lese-Korpus für Speicher |

Reservierte Core-Admin-Namespaces (`config.*`, `exec.approvals.*`, `wizard.*`,
`update.*`) bleiben immer `operator.admin`, auch wenn ein Plugin versucht, einen
engeren Scope für eine Gateway-Methode zuzuweisen. Bevorzugen Sie pluginspezifische Präfixe für
plugin-eigene Methoden.

Verwenden Sie `api.registerEmbeddedExtensionFactory(...)`, wenn ein Plugin Pi-native
Event-Timings während eingebetteter OpenClaw-Läufe benötigt, zum Beispiel asynchrone `tool_result`-
Umschreibungen, die vor der Ausgabe der finalen Tool-Ergebnis-Nachricht stattfinden müssen.
Dies ist derzeit ein Seam für gebündelte Plugins: Nur gebündelte Plugins dürfen eine solche Factory registrieren, und
sie müssen `contracts.embeddedExtensionFactories: ["pi"]` in
`openclaw.plugin.json` deklarieren. Verwenden Sie normale OpenClaw-Plugin-Hooks für alles,
was diesen Low-Level-Seam nicht benötigt.

### Metadaten für CLI-Registrierung

`api.registerCli(registrar, opts?)` akzeptiert zwei Arten von Metadaten auf oberster Ebene:

- `commands`: explizite Befehlswurzeln, die dem Registrar gehören
- `descriptors`: Befehlsdeskriptoren zur Parse-Zeit, die für Root-CLI-Hilfe,
  Routing und Lazy-Registrierung von Plugin-CLI verwendet werden

Wenn ein Plugin-Befehl im normalen Root-CLI-Pfad lazy geladen bleiben soll,
geben Sie `descriptors` an, die jede Befehlswurzel der obersten Ebene abdecken, die von diesem
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

Verwenden Sie `commands` allein nur dann, wenn Sie keine Lazy-Root-CLI-Registrierung benötigen.
Dieser eager Kompatibilitätspfad bleibt unterstützt, installiert aber keine
deskriptorbasierten Platzhalter für Lazy-Laden zur Parse-Zeit.

### Registrierung von CLI-Backends

`api.registerCliBackend(...)` erlaubt es einem Plugin, die Standardkonfiguration für ein lokales
KI-CLI-Backend wie `codex-cli` zu besitzen.

- Die Backend-`id` wird zum Provider-Präfix in Modell-Refs wie `codex-cli/gpt-5`.
- Das Backend-`config` verwendet dieselbe Form wie `agents.defaults.cliBackends.<id>`.
- Benutzerkonfiguration hat weiterhin Vorrang. OpenClaw merged `agents.defaults.cliBackends.<id>` über den
  Plugin-Standardwert, bevor die CLI ausgeführt wird.
- Verwenden Sie `normalizeConfig`, wenn ein Backend nach dem Merge Kompatibilitäts-Umschreibungen benötigt
  (zum Beispiel zum Normalisieren alter Flag-Formen).

### Exklusive Slots

| Methode                                    | Was sie registriert                                                                                                                                         |
| ------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerContextEngine(id, factory)`   | Kontext-Engine (jeweils nur eine aktiv). Der Callback `assemble()` erhält `availableTools` und `citationsMode`, damit die Engine Prompt-Ergänzungen passend gestalten kann. |
| `api.registerMemoryCapability(capability)` | Einheitliche Speicher-Capability                                                                                                                            |
| `api.registerMemoryPromptSection(builder)` | Builder für Speicher-Prompt-Abschnitte                                                                                                                      |
| `api.registerMemoryFlushPlan(resolver)`    | Resolver für Speicher-Flush-Pläne                                                                                                                           |
| `api.registerMemoryRuntime(runtime)`       | Speicher-Laufzeitadapter                                                                                                                                     |

### Speicher-Embedding-Adapter

| Methode                                        | Was sie registriert                          |
| ---------------------------------------------- | -------------------------------------------- |
| `api.registerMemoryEmbeddingProvider(adapter)` | Speicher-Embedding-Adapter für das aktive Plugin |

- `registerMemoryCapability` ist die bevorzugte exklusive API für Speicher-Plugins.
- `registerMemoryCapability` kann auch `publicArtifacts.listArtifacts(...)`
  bereitstellen, damit Companion-Plugins exportierte Speicherartefakte über
  `openclaw/plugin-sdk/memory-host-core` konsumieren können, statt in das private Layout eines
  bestimmten Speicher-Plugins zu greifen.
- `registerMemoryPromptSection`, `registerMemoryFlushPlan` und
  `registerMemoryRuntime` sind legacy-kompatible exklusive APIs für Speicher-Plugins.
- `registerMemoryEmbeddingProvider` erlaubt dem aktiven Speicher-Plugin, einen
  oder mehrere Embedding-Adapter-IDs zu registrieren (zum Beispiel `openai`, `gemini` oder eine
  benutzerdefinierte, vom Plugin definierte ID).
- Benutzerkonfiguration wie `agents.defaults.memorySearch.provider` und
  `agents.defaults.memorySearch.fallback` wird gegen diese registrierten
  Adapter-IDs aufgelöst.

### Ereignisse und Lifecycle

| Methode                                      | Was sie tut                  |
| -------------------------------------------- | ---------------------------- |
| `api.on(hookName, handler, opts?)`           | Typisierter Lifecycle-Hook   |
| `api.onConversationBindingResolved(handler)` | Callback für Conversation-Binding |

### Semantik von Hook-Entscheidungen

- `before_tool_call`: Das Zurückgeben von `{ block: true }` ist terminal. Sobald ein Handler dies setzt, werden Handler mit niedrigerer Priorität übersprungen.
- `before_tool_call`: Das Zurückgeben von `{ block: false }` wird als keine Entscheidung behandelt (wie das Weglassen von `block`), nicht als Überschreibung.
- `before_install`: Das Zurückgeben von `{ block: true }` ist terminal. Sobald ein Handler dies setzt, werden Handler mit niedrigerer Priorität übersprungen.
- `before_install`: Das Zurückgeben von `{ block: false }` wird als keine Entscheidung behandelt (wie das Weglassen von `block`), nicht als Überschreibung.
- `reply_dispatch`: Das Zurückgeben von `{ handled: true, ... }` ist terminal. Sobald ein Handler den Dispatch beansprucht, werden Handler mit niedrigerer Priorität und der Standardpfad für Modelldispatch übersprungen.
- `message_sending`: Das Zurückgeben von `{ cancel: true }` ist terminal. Sobald ein Handler dies setzt, werden Handler mit niedrigerer Priorität übersprungen.
- `message_sending`: Das Zurückgeben von `{ cancel: false }` wird als keine Entscheidung behandelt (wie das Weglassen von `cancel`), nicht als Überschreibung.
- `message_received`: Verwenden Sie das typisierte Feld `threadId`, wenn Sie eingehendes Thread-/Thema-Routing benötigen. Behalten Sie `metadata` für kanalspezifische Extras bei.
- `message_sending`: Verwenden Sie die typisierten Routing-Felder `replyToId` / `threadId`, bevor Sie auf kanalspezifische `metadata` zurückfallen.
- `gateway_start`: Verwenden Sie `ctx.config`, `ctx.workspaceDir` und `ctx.getCron?.()` für Gateway-eigenen Startzustand, statt sich auf interne Hooks wie `gateway:startup` zu verlassen.

### Felder des API-Objekts

| Feld                     | Typ                       | Beschreibung                                                                                |
| ------------------------ | ------------------------- | ------------------------------------------------------------------------------------------- |
| `api.id`                 | `string`                  | Plugin-ID                                                                                   |
| `api.name`               | `string`                  | Anzeigename                                                                                 |
| `api.version`            | `string?`                 | Plugin-Version (optional)                                                                   |
| `api.description`        | `string?`                 | Plugin-Beschreibung (optional)                                                              |
| `api.source`             | `string`                  | Quellpfad des Plugins                                                                       |
| `api.rootDir`            | `string?`                 | Root-Verzeichnis des Plugins (optional)                                                     |
| `api.config`             | `OpenClawConfig`          | Aktueller Konfigurations-Snapshot (aktive In-Memory-Laufzeitaufnahme, wenn verfügbar)      |
| `api.pluginConfig`       | `Record<string, unknown>` | Pluginspezifische Konfiguration aus `plugins.entries.<id>.config`                           |
| `api.runtime`            | `PluginRuntime`           | [Laufzeithelfer](/de/plugins/sdk-runtime)                                                      |
| `api.logger`             | `PluginLogger`            | Bereichsbezogener Logger (`debug`, `info`, `warn`, `error`)                                 |
| `api.registrationMode`   | `PluginRegistrationMode`  | Aktueller Lademodus; `"setup-runtime"` ist das leichtgewichtige Fenster für Start/Setup vor dem vollständigen Entry |
| `api.resolvePath(input)` | `(string) => string`      | Pfad relativ zum Plugin-Root auflösen                                                       |

## Konvention für interne Module

Verwenden Sie innerhalb Ihres Plugins lokale Barrel-Dateien für interne Importe:

```
my-plugin/
  api.ts            # Öffentliche Exporte für externe Konsumenten
  runtime-api.ts    # Nur intern verwendete Laufzeit-Exporte
  index.ts          # Plugin-Entry-Point
  setup-entry.ts    # Leichtgewichtiger Entry nur für Setup (optional)
```

<Warning>
  Importieren Sie Ihr eigenes Plugin im Produktionscode niemals über `openclaw/plugin-sdk/<your-plugin>`.
  Leiten Sie interne Importe über `./api.ts` oder
  `./runtime-api.ts`. Der SDK-Pfad ist nur der externe Vertrag.
</Warning>

Über Fassade geladene öffentliche Oberflächen gebündelter Plugins (`api.ts`, `runtime-api.ts`,
`index.ts`, `setup-entry.ts` und ähnliche öffentliche Entry-Dateien) bevorzugen jetzt den
aktiven Laufzeit-Konfigurations-Snapshot, wenn OpenClaw bereits läuft. Wenn noch kein Laufzeit-
Snapshot existiert, greifen sie auf die auf Festplatte aufgelöste Konfigurationsdatei zurück.

Provider-Plugins können außerdem ein schmales pluginlokales Vertrags-Barrel bereitstellen, wenn ein
Helfer absichtlich providerspezifisch ist und noch nicht in einen generischen SDK-
Subpfad gehört. Aktuelles gebündeltes Beispiel: Der Anthropic-Provider behält seine Claude-
Stream-Helfer in seinem eigenen öffentlichen `api.ts`- / `contract-api.ts`-Seam, statt
Anthropic-Beta-Header und `service_tier`-Logik in einen generischen
`plugin-sdk/*`-Vertrag zu verschieben.

Weitere aktuelle gebündelte Beispiele:

- `@openclaw/openai-provider`: `api.ts` exportiert Provider-Builder,
  Helfer für Standardmodelle und Builder für Echtzeit-Provider
- `@openclaw/openrouter-provider`: `api.ts` exportiert den Provider-Builder sowie
  Helfer für Onboarding/Konfiguration

<Warning>
  Produktionscode von Erweiterungen sollte außerdem Importe von `openclaw/plugin-sdk/<other-plugin>`
  vermeiden. Wenn ein Helfer wirklich gemeinsam genutzt wird, verschieben Sie ihn in einen neutralen SDK-Subpfad
  wie `openclaw/plugin-sdk/speech`, `.../provider-model-shared` oder eine andere
  capability-orientierte Oberfläche, statt zwei Plugins aneinander zu koppeln.
</Warning>

## Verwandt

- [Entry Points](/de/plugins/sdk-entrypoints) — Optionen für `definePluginEntry` und `defineChannelPluginEntry`
- [Laufzeithelfer](/de/plugins/sdk-runtime) — vollständige Referenz des Namespace `api.runtime`
- [Setup und Konfiguration](/de/plugins/sdk-setup) — Packaging, Manifeste, Konfigurationsschemas
- [Tests](/de/plugins/sdk-testing) — Test-Hilfsfunktionen und Lint-Regeln
- [SDK-Migration](/de/plugins/sdk-migration) — Migration von veralteten Oberflächen
- [Plugin-Interna](/de/plugins/architecture) — tiefe Architektur und Capability-Modell
