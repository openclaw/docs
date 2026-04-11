---
read_when:
    - Sie müssen wissen, aus welchem SDK-Subpfad importiert werden soll.
    - Sie möchten eine Referenz für alle Registrierungsmethoden in `OpenClawPluginApi`.
    - Sie suchen einen bestimmten SDK-Export.
sidebarTitle: SDK Overview
summary: Import-Map, Referenz der Registrierungs-API und SDK-Architektur
title: Plugin-SDK-Überblick
x-i18n:
    generated_at: "2026-04-11T02:46:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4bfeb5896f68e3e4ee8cf434d43a019e0d1fe5af57f5bf7a5172847c476def0c
    source_path: plugins/sdk-overview.md
    workflow: 15
---

# Plugin-SDK-Überblick

Das Plugin SDK ist der typisierte Vertrag zwischen Plugins und dem Core. Diese Seite ist die
Referenz für **was importiert werden soll** und **was Sie registrieren können**.

<Tip>
  **Sie suchen eine How-to-Anleitung?**
  - Erstes Plugin? Beginnen Sie mit [Erste Schritte](/de/plugins/building-plugins)
  - Channel-Plugin? Siehe [Channel Plugins](/de/plugins/sdk-channel-plugins)
  - Provider-Plugin? Siehe [Provider Plugins](/de/plugins/sdk-provider-plugins)
</Tip>

## Importkonvention

Importieren Sie immer aus einem spezifischen Subpfad:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

Jeder Subpfad ist ein kleines, in sich geschlossenes Modul. Das hält den Start schnell und
verhindert Probleme mit zirkulären Abhängigkeiten. Für entry-/build-spezifische Hilfen für Channels
bevorzugen Sie `openclaw/plugin-sdk/channel-core`; verwenden Sie `openclaw/plugin-sdk/core` für
die breitere Umbrella-Oberfläche und gemeinsame Hilfen wie
`buildChannelConfigSchema`.

Fügen Sie keine providerbenannten Convenience-Seams hinzu und hängen Sie nicht von ihnen ab, wie
`openclaw/plugin-sdk/slack`, `openclaw/plugin-sdk/discord`,
`openclaw/plugin-sdk/signal`, `openclaw/plugin-sdk/whatsapp` oder
channel-gebrandeten Helper-Seams. Gebündelte Plugins sollten generische
SDK-Subpfade innerhalb ihrer eigenen `api.ts`- oder `runtime-api.ts`-Barrels zusammensetzen, und der Core
sollte entweder diese pluginlokalen Barrels verwenden oder einen schmalen generischen SDK-
Vertrag hinzufügen, wenn der Bedarf wirklich kanalübergreifend ist.

Die generierte Export-Map enthält weiterhin eine kleine Menge an gebündelten Plugin-Helper-
Seams wie `plugin-sdk/feishu`, `plugin-sdk/feishu-setup`,
`plugin-sdk/zalo`, `plugin-sdk/zalo-setup` und `plugin-sdk/matrix*`. Diese
Subpfade existieren nur für die Wartung gebündelter Plugins und für Kompatibilität; sie werden
bewusst aus der allgemeinen Tabelle unten ausgelassen und sind nicht der empfohlene
Importpfad für neue Drittanbieter-Plugins.

## Subpfad-Referenz

Die am häufigsten verwendeten Subpfade, gruppiert nach Zweck. Die generierte vollständige Liste von
mehr als 200 Subpfaden befindet sich in `scripts/lib/plugin-sdk-entrypoints.json`.

Reservierte Helper-Subpfade für gebündelte Plugins erscheinen weiterhin in dieser generierten Liste.
Behandeln Sie diese als Implementierungsdetail-/Kompatibilitätsoberflächen, sofern eine Doku-Seite
nicht ausdrücklich einen davon als öffentlich hervorhebt.

### Plugin-Entry

| Subpfad                     | Wichtige Exporte                                                                                                                         |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/plugin-entry`   | `definePluginEntry`                                                                                                                      |
| `plugin-sdk/core`           | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema` |
| `plugin-sdk/config-schema`  | `OpenClawSchema`                                                                                                                         |
| `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry`                                                                                                        |

<AccordionGroup>
  <Accordion title="Channel-Subpfade">
    | Subpfad | Wichtige Exporte |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | Root-`openclaw.json`-Zod-Schema-Export (`OpenClawSchema`) |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, plus `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | Gemeinsame Hilfen für den Setup-Assistenten, Allowlist-Prompts, Setup-Status-Builder |
    | `plugin-sdk/setup-runtime` | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | `createEnvPatchedAccountSetupAdapter` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | Hilfen für Multi-Account-Konfiguration/Aktions-Gates, Hilfen für den Default-Account-Fallback |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, Hilfen zur Account-ID-Normalisierung |
    | `plugin-sdk/account-resolution` | Hilfen für Account-Lookup + Default-Fallback |
    | `plugin-sdk/account-helpers` | Schmale Hilfen für Account-Listen/Account-Aktionen |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | `createChannelReplyPipeline` |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter` |
    | `plugin-sdk/channel-config-schema` | Typen für Channel-Konfigurationsschema |
    | `plugin-sdk/telegram-command-config` | Hilfen zur Normalisierung/Validierung benutzerdefinierter Telegram-Befehle mit Fallback auf gebündelten Vertrag |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-lifecycle` | `createAccountStatusSink` |
    | `plugin-sdk/inbound-envelope` | Gemeinsame Hilfen für eingehendes Routing + Envelope-Builder |
    | `plugin-sdk/inbound-reply-dispatch` | Gemeinsame Hilfen zum Erfassen und Dispatchen eingehender Daten |
    | `plugin-sdk/messaging-targets` | Hilfen zum Parsen/Abgleichen von Zielen |
    | `plugin-sdk/outbound-media` | Gemeinsame Hilfen zum Laden ausgehender Medien |
    | `plugin-sdk/outbound-runtime` | Hilfen für ausgehende Identität/Sendedelegation |
    | `plugin-sdk/thread-bindings-runtime` | Hilfen für Lifecycle und Adapter von Thread-Bindings |
    | `plugin-sdk/agent-media-payload` | Legacy-Builder für Agent-Medien-Payload |
    | `plugin-sdk/conversation-runtime` | Hilfen für Conversation-/Thread-Binding, Pairing und konfigurierte Bindings |
    | `plugin-sdk/runtime-config-snapshot` | Hilfsfunktion für Runtime-Konfigurations-Snapshot |
    | `plugin-sdk/runtime-group-policy` | Hilfen zur Auflösung von Runtime-Gruppenrichtlinien |
    | `plugin-sdk/channel-status` | Gemeinsame Hilfen für Channel-Status-Snapshot/-Zusammenfassung |
    | `plugin-sdk/channel-config-primitives` | Schmale Primitive für Channel-Konfigurationsschema |
    | `plugin-sdk/channel-config-writes` | Hilfen zur Autorisierung von Schreibvorgängen in der Channel-Konfiguration |
    | `plugin-sdk/channel-plugin-common` | Gemeinsame Prelude-Exporte für Channel-Plugins |
    | `plugin-sdk/allowlist-config-edit` | Hilfen zum Bearbeiten/Lesen der Allowlist-Konfiguration |
    | `plugin-sdk/group-access` | Gemeinsame Hilfen für Entscheidungen zum Gruppenzugriff |
    | `plugin-sdk/direct-dm` | Gemeinsame Hilfen für Auth/Guards bei direkten DMs |
    | `plugin-sdk/interactive-runtime` | Hilfen zur Normalisierung/Reduktion interaktiver Antwort-Payloads |
    | `plugin-sdk/channel-inbound` | Hilfen für eingehendes Debounce, Mention-Matching, Mention-Policy und Envelopes |
    | `plugin-sdk/channel-send-result` | Typen für Antwortergebnisse |
    | `plugin-sdk/channel-actions` | `createMessageToolButtonsSchema`, `createMessageToolCardSchema` |
    | `plugin-sdk/channel-targets` | Hilfen zum Parsen/Abgleichen von Zielen |
    | `plugin-sdk/channel-contract` | Typen für den Channel-Vertrag |
    | `plugin-sdk/channel-feedback` | Wiring für Feedback/Reaktionen |
    | `plugin-sdk/channel-secret-runtime` | Schmale Secret-Contract-Hilfen wie `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment` und Secret-Zieltypen |
  </Accordion>

  <Accordion title="Provider-Subpfade">
    | Subpfad | Wichtige Exporte |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/provider-setup` | Kuratierte Hilfen zum Einrichten lokaler/selbstgehosteter Provider |
    | `plugin-sdk/self-hosted-provider-setup` | Fokussierte Hilfen zum Einrichten selbstgehosteter OpenAI-kompatibler Provider |
    | `plugin-sdk/cli-backend` | CLI-Backend-Standards + Watchdog-Konstanten |
    | `plugin-sdk/provider-auth-runtime` | Hilfen zur Auflösung von API-Schlüsseln zur Laufzeit für Provider-Plugins |
    | `plugin-sdk/provider-auth-api-key` | Hilfen für API-Key-Onboarding/Profile-Schreibvorgänge wie `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | Standard-Builder für OAuth-Auth-Ergebnisse |
    | `plugin-sdk/provider-auth-login` | Gemeinsame interaktive Login-Hilfen für Provider-Plugins |
    | `plugin-sdk/provider-env-vars` | Hilfen zur Suche von Provider-Auth-Env-Variablen |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, gemeinsame Replay-Policy-Builder, Provider-Endpunkt-Hilfen und Hilfen zur Modell-ID-Normalisierung wie `normalizeNativeXaiModelId` |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | Generische Hilfen für HTTP-/Endpunkt-Capabilities von Providern |
    | `plugin-sdk/provider-web-fetch-contract` | Schmale Vertragshilfen für Web-Fetch-Konfiguration/-Auswahl wie `enablePluginInConfig` und `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | Hilfen für Registrierung/Cache von Web-Fetch-Providern |
    | `plugin-sdk/provider-web-search-config-contract` | Schmale Hilfen für Web-Search-Konfiguration/Anmeldedaten für Provider, die kein Plugin-Enable-Wiring benötigen |
    | `plugin-sdk/provider-web-search-contract` | Schmale Vertragshilfen für Web-Search-Konfiguration/Anmeldedaten wie `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` und bereichsbezogene Setter/Getter für Anmeldedaten |
    | `plugin-sdk/provider-web-search` | Hilfen für Registrierung/Cache/Laufzeit von Web-Search-Providern |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, Gemini-Schema-Bereinigung + Diagnose sowie xAI-Kompatibilitätshelfer wie `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
    | `plugin-sdk/provider-usage` | `fetchClaudeUsage` und Ähnliches |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, Stream-Wrapper-Typen und gemeinsame Wrapper-Hilfen für Anthropic/Bedrock/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
    | `plugin-sdk/provider-onboard` | Hilfen für Onboarding-Konfigurations-Patches |
    | `plugin-sdk/global-singleton` | Hilfen für prozesslokale Singleton-/Map-/Cache-Funktionen |
  </Accordion>

  <Accordion title="Auth- und Sicherheits-Subpfade">
    | Subpfad | Wichtige Exporte |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, Hilfen für das Befehlsregister, Hilfen zur Absenderautorisierung |
    | `plugin-sdk/command-status` | Builder für Befehls-/Hilfenachrichten wie `buildCommandsMessagePaginated` und `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | Hilfen für die Auflösung von Genehmigenden und Aktions-Auth im selben Chat |
    | `plugin-sdk/approval-client-runtime` | Hilfen für native Exec-Genehmigungsprofile/-Filter |
    | `plugin-sdk/approval-delivery-runtime` | Native Adapter für Genehmigungs-Capability/-Zustellung |
    | `plugin-sdk/approval-gateway-runtime` | Gemeinsame Hilfsfunktion zur Auflösung von Genehmigungs-Gateways |
    | `plugin-sdk/approval-handler-adapter-runtime` | Leichtgewichtige Hilfen zum Laden nativer Genehmigungsadapter für Hot-Channel-Entrypoints |
    | `plugin-sdk/approval-handler-runtime` | Breitere Runtime-Hilfen für Genehmigungshandler; bevorzugen Sie die schmaleren Adapter-/Gateway-Seams, wenn diese ausreichen |
    | `plugin-sdk/approval-native-runtime` | Hilfen für native Genehmigungsziele + Account-Bindings |
    | `plugin-sdk/approval-reply-runtime` | Hilfen für Antwort-Payloads bei Exec-/Plugin-Genehmigungen |
    | `plugin-sdk/command-auth-native` | Native Command-Auth + Hilfen für native Sitzungsziele |
    | `plugin-sdk/command-detection` | Gemeinsame Hilfen zur Befehlserkennung |
    | `plugin-sdk/command-surface` | Hilfen zur Normalisierung von Befehlsinhalt und Befehlsoberfläche |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | Schmale Hilfen zum Sammeln von Secret-Contracts für Channel-/Plugin-Secret-Oberflächen |
    | `plugin-sdk/secret-ref-runtime` | Schmale Hilfen für `coerceSecretRef` und SecretRef-Typisierung für Secret-Contract-/Konfigurations-Parsing |
    | `plugin-sdk/security-runtime` | Gemeinsame Hilfen für Trust, DM-Gating, externe Inhalte und Secret-Sammlung |
    | `plugin-sdk/ssrf-policy` | Hilfen für Host-Allowlist und SSRF-Richtlinien für private Netzwerke |
    | `plugin-sdk/ssrf-runtime` | Hilfen für Pinned-Dispatcher, SSRF-geschützte Fetches und SSRF-Richtlinien |
    | `plugin-sdk/secret-input` | Hilfen zum Parsen geheimer Eingaben |
    | `plugin-sdk/webhook-ingress` | Hilfen für Webhook-Anfragen/-Ziele |
    | `plugin-sdk/webhook-request-guards` | Hilfen für Größe/Timeout von Request-Bodies |
  </Accordion>

  <Accordion title="Runtime- und Storage-Subpfade">
    | Subpfad | Wichtige Exporte |
    | --- | --- |
    | `plugin-sdk/runtime` | Breite Hilfen für Runtime/Logging/Backups/Plugin-Installation |
    | `plugin-sdk/runtime-env` | Schmale Hilfen für Runtime-Env, Logger, Timeout, Retry und Backoff |
    | `plugin-sdk/channel-runtime-context` | Generische Hilfen für Registrierung und Lookup von Channel-Runtime-Kontext |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Gemeinsame Hilfen für Plugin-Befehle/Hooks/HTTP/Interaktivität |
    | `plugin-sdk/hook-runtime` | Gemeinsame Hilfen für Webhook-/interne Hook-Pipelines |
    | `plugin-sdk/lazy-runtime` | Hilfen für Lazy-Runtime-Import/Binding wie `createLazyRuntimeModule`, `createLazyRuntimeMethod` und `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | Hilfen für Process-Exec |
    | `plugin-sdk/cli-runtime` | Hilfen für CLI-Formatierung, Warten und Version |
    | `plugin-sdk/gateway-runtime` | Hilfen für Gateway-Client und Channel-Status-Patches |
    | `plugin-sdk/config-runtime` | Hilfen zum Laden/Schreiben von Konfiguration |
    | `plugin-sdk/telegram-command-config` | Hilfen zur Normalisierung von Telegram-Befehlsnamen/-beschreibungen und zu Duplikat-/Konfliktprüfungen, auch wenn die gebündelte Telegram-Vertragsoberfläche nicht verfügbar ist |
    | `plugin-sdk/approval-runtime` | Hilfen für Exec-/Plugin-Genehmigungen, Builder für Genehmigungs-Capabilities, Auth-/Profilhilfen, native Routing-/Runtime-Hilfen |
    | `plugin-sdk/reply-runtime` | Gemeinsame Hilfen für eingehende/Antwort-Runtime, Chunking, Dispatch, Heartbeat, Antwortplaner |
    | `plugin-sdk/reply-dispatch-runtime` | Schmale Hilfen für Antwort-Dispatch/-Finalisierung |
    | `plugin-sdk/reply-history` | Gemeinsame Hilfen für Antwortverlauf in kurzen Fenstern wie `buildHistoryContext`, `recordPendingHistoryEntry` und `clearHistoryEntriesIfEnabled` |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | Schmale Hilfen für Text-/Markdown-Chunking |
    | `plugin-sdk/session-store-runtime` | Hilfen für Pfade und updated-at im Sitzungs-Store |
    | `plugin-sdk/state-paths` | Hilfen für State-/OAuth-Verzeichnispfade |
    | `plugin-sdk/routing` | Hilfen für Route-/Sitzungsschlüssel-/Account-Binding wie `resolveAgentRoute`, `buildAgentSessionKey` und `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | Gemeinsame Hilfen für Statuszusammenfassungen von Channel/Account, Runtime-Status-Standardwerte und Issue-Metadaten |
    | `plugin-sdk/target-resolver-runtime` | Gemeinsame Hilfen für Target-Resolver |
    | `plugin-sdk/string-normalization-runtime` | Hilfen zur Slug-/String-Normalisierung |
    | `plugin-sdk/request-url` | String-URLs aus fetch-/request-ähnlichen Eingaben extrahieren |
    | `plugin-sdk/run-command` | Zeitgesteuerter Befehlsrunner mit normalisierten stdout-/stderr-Ergebnissen |
    | `plugin-sdk/param-readers` | Gemeinsame Parameterleser für Tool/CLI |
    | `plugin-sdk/tool-payload` | Normalisierte Payloads aus Tool-Ergebnisobjekten extrahieren |
    | `plugin-sdk/tool-send` | Kanonische Send-Zielfelder aus Tool-Argumenten extrahieren |
    | `plugin-sdk/temp-path` | Gemeinsame Hilfen für temporäre Downloadpfade |
    | `plugin-sdk/logging-core` | Hilfen für Subsystem-Logger und Redaction |
    | `plugin-sdk/markdown-table-runtime` | Hilfen für Markdown-Tabellenmodus |
    | `plugin-sdk/json-store` | Kleine Hilfen zum Lesen/Schreiben von JSON-Zustand |
    | `plugin-sdk/file-lock` | Reentrante Hilfen für Dateisperren |
    | `plugin-sdk/persistent-dedupe` | Hilfen für festplattenbasierten Dedupe-Cache |
    | `plugin-sdk/acp-runtime` | Hilfen für ACP-Runtime/Sitzung und Reply-Dispatch |
    | `plugin-sdk/agent-config-primitives` | Schmale Primitive für Runtime-Konfigurationsschema von Agents |
    | `plugin-sdk/boolean-param` | Leser für lockere Boolean-Parameter |
    | `plugin-sdk/dangerous-name-runtime` | Hilfen zur Auflösung von Dangerous-Name-Matching |
    | `plugin-sdk/device-bootstrap` | Hilfen für Device-Bootstrap und Pairing-Token |
    | `plugin-sdk/extension-shared` | Gemeinsame Primitive für passive Channels, Status und Ambient-Proxy-Hilfen |
    | `plugin-sdk/models-provider-runtime` | Hilfen für `/models`-Befehle/Provider-Antworten |
    | `plugin-sdk/skill-commands-runtime` | Hilfen zum Auflisten von Skill-Befehlen |
    | `plugin-sdk/native-command-registry` | Hilfen für Aufbau/Build/Serialisierung des nativen Befehlsregisters |
    | `plugin-sdk/agent-harness` | Experimentelle Trusted-Plugin-Oberfläche für Low-Level-Agent-Harnesses: Harness-Typen, Hilfen zum Steuern/Abbrechen aktiver Ausführungen, OpenClaw-Tool-Bridge-Hilfen und Attempt-Ergebnis-Utilities |
    | `plugin-sdk/provider-zai-endpoint` | Hilfen zur Z.AI-Endpunkterkennung |
    | `plugin-sdk/infra-runtime` | Hilfen für Systemereignisse/Heartbeat |
    | `plugin-sdk/collection-runtime` | Kleine Hilfen für begrenzte Caches |
    | `plugin-sdk/diagnostic-runtime` | Hilfen für Diagnose-Flags und -Ereignisse |
    | `plugin-sdk/error-runtime` | Fehlergraph, Formatierung, gemeinsame Hilfen zur Fehlerklassifizierung, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | Hilfen für Wrapped Fetch, Proxy und Pinned Lookup |
    | `plugin-sdk/host-runtime` | Hilfen zur Normalisierung von Hostnamen und SCP-Hosts |
    | `plugin-sdk/retry-runtime` | Hilfen für Retry-Konfiguration und Retry-Runner |
    | `plugin-sdk/agent-runtime` | Hilfen für Agent-Verzeichnis/Identität/Workspace |
    | `plugin-sdk/directory-runtime` | Konfigurationsgestützte Verzeichnisabfrage/Deduplizierung |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Capability- und Test-Subpfade">
    | Subpfad | Wichtige Exporte |
    | --- | --- |
    | `plugin-sdk/media-runtime` | Gemeinsame Hilfen für Media-Fetch/Transformation/Speicherung sowie Builder für Medien-Payloads |
    | `plugin-sdk/media-generation-runtime` | Gemeinsame Hilfen für Media-Generation-Failover, Kandidatenauswahl und Meldungen bei fehlenden Modellen |
    | `plugin-sdk/media-understanding` | Typen für Media-Understanding-Provider sowie providerseitige Exporte für Bild-/Audio-Hilfen |
    | `plugin-sdk/text-runtime` | Gemeinsame Hilfen für Text/Markdown/Logging wie das Entfernen von für Assistenten sichtbarem Text, Markdown-Render-/Chunking-/Tabellen-Hilfen, Redaction-Hilfen, Directive-Tag-Hilfen und Safe-Text-Utilities |
    | `plugin-sdk/text-chunking` | Hilfsfunktion für ausgehendes Text-Chunking |
    | `plugin-sdk/speech` | Typen für Speech-Provider sowie providerseitige Hilfen für Direktiven, Registry und Validierung |
    | `plugin-sdk/speech-core` | Gemeinsame Typen für Speech-Provider sowie Hilfen für Registry, Direktiven und Normalisierung |
    | `plugin-sdk/realtime-transcription` | Typen für Realtime-Transcription-Provider und Registry-Hilfen |
    | `plugin-sdk/realtime-voice` | Typen für Realtime-Voice-Provider und Registry-Hilfen |
    | `plugin-sdk/image-generation` | Typen für Image-Generation-Provider |
    | `plugin-sdk/image-generation-core` | Gemeinsame Typen für Image-Generation sowie Hilfen für Failover, Auth und Registry |
    | `plugin-sdk/music-generation` | Typen für Music-Generation-Provider/-Requests/-Ergebnisse |
    | `plugin-sdk/music-generation-core` | Gemeinsame Typen für Music-Generation sowie Hilfen für Failover, Provider-Lookup und Model-Ref-Parsing |
    | `plugin-sdk/video-generation` | Typen für Video-Generation-Provider/-Requests/-Ergebnisse |
    | `plugin-sdk/video-generation-core` | Gemeinsame Typen für Video-Generation sowie Hilfen für Failover, Provider-Lookup und Model-Ref-Parsing |
    | `plugin-sdk/webhook-targets` | Hilfen für Webhook-Ziel-Registry und Route-Installation |
    | `plugin-sdk/webhook-path` | Hilfen zur Normalisierung von Webhook-Pfaden |
    | `plugin-sdk/web-media` | Gemeinsame Hilfen zum Laden entfernter/lokaler Medien |
    | `plugin-sdk/zod` | Re-exportiertes `zod` für Plugin-SDK-Consumer |
    | `plugin-sdk/testing` | `installCommonResolveTargetErrorCases`, `shouldAckReaction` |
  </Accordion>

  <Accordion title="Memory-Subpfade">
    | Subpfad | Wichtige Exporte |
    | --- | --- |
    | `plugin-sdk/memory-core` | Gebündelte `memory-core`-Helper-Oberfläche für Manager-/Konfigurations-/Datei-/CLI-Hilfen |
    | `plugin-sdk/memory-core-engine-runtime` | Runtime-Fassade für Memory-Index/-Suche |
    | `plugin-sdk/memory-core-host-engine-foundation` | Exporte der Foundation-Engine des Memory-Hosts |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Exporte der Embedding-Engine des Memory-Hosts |
    | `plugin-sdk/memory-core-host-engine-qmd` | Exporte der QMD-Engine des Memory-Hosts |
    | `plugin-sdk/memory-core-host-engine-storage` | Exporte der Storage-Engine des Memory-Hosts |
    | `plugin-sdk/memory-core-host-multimodal` | Multimodale Hilfen des Memory-Hosts |
    | `plugin-sdk/memory-core-host-query` | Query-Hilfen des Memory-Hosts |
    | `plugin-sdk/memory-core-host-secret` | Secret-Hilfen des Memory-Hosts |
    | `plugin-sdk/memory-core-host-events` | Hilfen für Event-Journale des Memory-Hosts |
    | `plugin-sdk/memory-core-host-status` | Status-Hilfen des Memory-Hosts |
    | `plugin-sdk/memory-core-host-runtime-cli` | CLI-Runtime-Hilfen des Memory-Hosts |
    | `plugin-sdk/memory-core-host-runtime-core` | Core-Runtime-Hilfen des Memory-Hosts |
    | `plugin-sdk/memory-core-host-runtime-files` | Datei-/Runtime-Hilfen des Memory-Hosts |
    | `plugin-sdk/memory-host-core` | Anbieterneutraler Alias für Core-Runtime-Hilfen des Memory-Hosts |
    | `plugin-sdk/memory-host-events` | Anbieterneutraler Alias für Hilfen zu Event-Journalen des Memory-Hosts |
    | `plugin-sdk/memory-host-files` | Anbieterneutraler Alias für Datei-/Runtime-Hilfen des Memory-Hosts |
    | `plugin-sdk/memory-host-markdown` | Gemeinsame Hilfen für verwaltetes Markdown für memory-nahe Plugins |
    | `plugin-sdk/memory-host-search` | Aktive Memory-Runtime-Fassade für den Zugriff auf Search-Manager |
    | `plugin-sdk/memory-host-status` | Anbieterneutraler Alias für Status-Hilfen des Memory-Hosts |
    | `plugin-sdk/memory-lancedb` | Gebündelte `memory-lancedb`-Helper-Oberfläche |
  </Accordion>

  <Accordion title="Reservierte gebündelte Helper-Subpfade">
    | Familie | Aktuelle Subpfade | Beabsichtigte Verwendung |
    | --- | --- | --- |
    | Browser | `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support` | Hilfen zur Unterstützung des gebündelten Browser-Plugins (`browser-support` bleibt der Kompatibilitäts-Barrel) |
    | Matrix | `plugin-sdk/matrix`, `plugin-sdk/matrix-helper`, `plugin-sdk/matrix-runtime-heavy`, `plugin-sdk/matrix-runtime-shared`, `plugin-sdk/matrix-runtime-surface`, `plugin-sdk/matrix-surface`, `plugin-sdk/matrix-thread-bindings` | Hilfs-/Runtime-Oberfläche für das gebündelte Matrix-Plugin |
    | Line | `plugin-sdk/line`, `plugin-sdk/line-core`, `plugin-sdk/line-runtime`, `plugin-sdk/line-surface` | Hilfs-/Runtime-Oberfläche für das gebündelte LINE-Plugin |
    | IRC | `plugin-sdk/irc`, `plugin-sdk/irc-surface` | Helper-Oberfläche für das gebündelte IRC-Plugin |
    | Channel-spezifische Helper | `plugin-sdk/googlechat`, `plugin-sdk/zalouser`, `plugin-sdk/bluebubbles`, `plugin-sdk/bluebubbles-policy`, `plugin-sdk/mattermost`, `plugin-sdk/mattermost-policy`, `plugin-sdk/feishu-conversation`, `plugin-sdk/msteams`, `plugin-sdk/nextcloud-talk`, `plugin-sdk/nostr`, `plugin-sdk/tlon`, `plugin-sdk/twitch` | Kompatibilitäts-/Helper-Seams für gebündelte Channels |
    | Auth-/plugin-spezifische Helper | `plugin-sdk/github-copilot-login`, `plugin-sdk/github-copilot-token`, `plugin-sdk/diagnostics-otel`, `plugin-sdk/diffs`, `plugin-sdk/llm-task`, `plugin-sdk/thread-ownership`, `plugin-sdk/voice-call` | Feature-/Plugin-Helper-Seams für gebündelte Plugins; `plugin-sdk/github-copilot-token` exportiert derzeit `DEFAULT_COPILOT_API_BASE_URL`, `deriveCopilotApiBaseUrlFromToken` und `resolveCopilotApiToken` |
  </Accordion>
</AccordionGroup>

## Registrierungs-API

Der Callback `register(api)` erhält ein `OpenClawPluginApi`-Objekt mit diesen
Methoden:

### Capability-Registrierung

| Methode                                          | Was registriert wird                    |
| ------------------------------------------------ | --------------------------------------- |
| `api.registerProvider(...)`                      | Textinferenz (LLM)                      |
| `api.registerAgentHarness(...)`                  | Experimenteller Low-Level-Agent-Executor |
| `api.registerCliBackend(...)`                    | Lokales CLI-Inferenz-Backend            |
| `api.registerChannel(...)`                       | Messaging-Channel                       |
| `api.registerSpeechProvider(...)`                | Text-to-Speech / STT-Synthese           |
| `api.registerRealtimeTranscriptionProvider(...)` | Streaming-Realtime-Transkription        |
| `api.registerRealtimeVoiceProvider(...)`         | Duplex-Realtime-Voice-Sitzungen         |
| `api.registerMediaUnderstandingProvider(...)`    | Bild-/Audio-/Videoanalyse               |
| `api.registerImageGenerationProvider(...)`       | Bildgenerierung                         |
| `api.registerMusicGenerationProvider(...)`       | Musikgenerierung                        |
| `api.registerVideoGenerationProvider(...)`       | Videogenerierung                        |
| `api.registerWebFetchProvider(...)`              | Web-Fetch-/Scrape-Provider              |
| `api.registerWebSearchProvider(...)`             | Websuche                                |

### Tools und Befehle

| Methode                         | Was registriert wird                           |
| ------------------------------- | ---------------------------------------------- |
| `api.registerTool(tool, opts?)` | Agent-Tool (erforderlich oder `{ optional: true }`) |
| `api.registerCommand(def)`      | Benutzerdefinierter Befehl (umgeht das LLM)    |

### Infrastruktur

| Methode                                        | Was registriert wird                  |
| ---------------------------------------------- | ------------------------------------- |
| `api.registerHook(events, handler, opts?)`     | Event-Hook                            |
| `api.registerHttpRoute(params)`                | Gateway-HTTP-Endpunkt                 |
| `api.registerGatewayMethod(name, handler)`     | Gateway-RPC-Methode                   |
| `api.registerCli(registrar, opts?)`            | CLI-Unterbefehl                       |
| `api.registerService(service)`                 | Hintergrunddienst                     |
| `api.registerInteractiveHandler(registration)` | Interaktiver Handler                  |
| `api.registerMemoryPromptSupplement(builder)`  | Additiver promptnaher Memory-Abschnitt |
| `api.registerMemoryCorpusSupplement(adapter)`  | Additiver Corpus für Memory-Suche/-Lesen |

Reservierte Core-Admin-Namespaces (`config.*`, `exec.approvals.*`, `wizard.*`,
`update.*`) bleiben immer `operator.admin`, auch wenn ein Plugin versucht, einer
Gateway-Methode einen engeren Scope zuzuweisen. Bevorzugen Sie plugin-spezifische Präfixe für
plugin-eigene Methoden.

### CLI-Registrierungsmetadaten

`api.registerCli(registrar, opts?)` akzeptiert zwei Arten von Metadaten auf oberster Ebene:

- `commands`: explizite Befehlswurzeln, die dem Registrar gehören
- `descriptors`: Parse-Zeit-Befehlsdeskriptoren, die für Root-CLI-Hilfe,
  Routing und Lazy-Registrierung von Plugin-CLI verwendet werden

Wenn Sie möchten, dass ein Plugin-Befehl im normalen Root-CLI-Pfad lazy geladen bleibt,
geben Sie `descriptors` an, die jede oberste Befehlswurzel abdecken, die von diesem
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
        description: "Matrix-Accounts, Verifizierung, Geräte und Profilstatus verwalten",
        hasSubcommands: true,
      },
    ],
  },
);
```

Verwenden Sie `commands` allein nur dann, wenn Sie keine lazy Root-CLI-Registrierung benötigen.
Dieser eager Kompatibilitätspfad wird weiterhin unterstützt, installiert jedoch keine
deskriptorbasierten Platzhalter für Lazy Loading zur Parse-Zeit.

### CLI-Backend-Registrierung

`api.registerCliBackend(...)` ermöglicht einem Plugin, die Standardkonfiguration für ein lokales
KI-CLI-Backend wie `codex-cli` zu verwalten.

- Die Backend-`id` wird zum Provider-Präfix in Modellreferenzen wie `codex-cli/gpt-5`.
- Die Backend-`config` verwendet dieselbe Struktur wie `agents.defaults.cliBackends.<id>`.
- Die Benutzerkonfiguration hat weiterhin Vorrang. OpenClaw führt `agents.defaults.cliBackends.<id>` über der
  Plugin-Standardkonfiguration zusammen, bevor die CLI ausgeführt wird.
- Verwenden Sie `normalizeConfig`, wenn ein Backend nach dem Zusammenführen Kompatibilitätsumschreibungen benötigt
  (zum Beispiel zur Normalisierung alter Flag-Formen).

### Exklusive Slots

| Methode                                    | Was registriert wird                                                                                                                                         |
| ------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerContextEngine(id, factory)`   | Context-Engine (immer nur eine aktiv). Der Callback `assemble()` erhält `availableTools` und `citationsMode`, damit die Engine Prompt-Ergänzungen anpassen kann. |
| `api.registerMemoryCapability(capability)` | Einheitliche Memory-Capability                                                                                                                              |
| `api.registerMemoryPromptSection(builder)` | Builder für Memory-Prompt-Abschnitte                                                                                                                        |
| `api.registerMemoryFlushPlan(resolver)`    | Resolver für den Memory-Flush-Plan                                                                                                                          |
| `api.registerMemoryRuntime(runtime)`       | Memory-Runtime-Adapter                                                                                                                                      |

### Memory-Embedding-Adapter

| Methode                                        | Was registriert wird                              |
| ---------------------------------------------- | ------------------------------------------------ |
| `api.registerMemoryEmbeddingProvider(adapter)` | Memory-Embedding-Adapter für das aktive Plugin   |

- `registerMemoryCapability` ist die bevorzugte exklusive Memory-Plugin-API.
- `registerMemoryCapability` kann auch `publicArtifacts.listArtifacts(...)` bereitstellen,
  damit Companion-Plugins exportierte Memory-Artefakte über
  `openclaw/plugin-sdk/memory-host-core` nutzen können, anstatt in das private Layout
  eines bestimmten Memory-Plugins zu greifen.
- `registerMemoryPromptSection`, `registerMemoryFlushPlan` und
  `registerMemoryRuntime` sind legacy-kompatible exklusive Memory-Plugin-APIs.
- `registerMemoryEmbeddingProvider` ermöglicht dem aktiven Memory-Plugin, einen
  oder mehrere Embedding-Adapter-IDs zu registrieren (zum Beispiel `openai`, `gemini` oder eine benutzerdefinierte
  plugindefinierte ID).
- Benutzerkonfiguration wie `agents.defaults.memorySearch.provider` und
  `agents.defaults.memorySearch.fallback` wird gegen diese registrierten
  Adapter-IDs aufgelöst.

### Ereignisse und Lifecycle

| Methode                                      | Was sie tut                  |
| -------------------------------------------- | ---------------------------- |
| `api.on(hookName, handler, opts?)`           | Typisierter Lifecycle-Hook   |
| `api.onConversationBindingResolved(handler)` | Callback für Conversation-Binding |

### Hook-Entscheidungssemantik

- `before_tool_call`: Die Rückgabe von `{ block: true }` ist endgültig. Sobald irgendein Handler dies setzt, werden Handler mit niedrigerer Priorität übersprungen.
- `before_tool_call`: Die Rückgabe von `{ block: false }` wird als keine Entscheidung behandelt (wie das Weglassen von `block`), nicht als Override.
- `before_install`: Die Rückgabe von `{ block: true }` ist endgültig. Sobald irgendein Handler dies setzt, werden Handler mit niedrigerer Priorität übersprungen.
- `before_install`: Die Rückgabe von `{ block: false }` wird als keine Entscheidung behandelt (wie das Weglassen von `block`), nicht als Override.
- `reply_dispatch`: Die Rückgabe von `{ handled: true, ... }` ist endgültig. Sobald irgendein Handler den Dispatch beansprucht, werden Handler mit niedrigerer Priorität und der Standardpfad für Model-Dispatch übersprungen.
- `message_sending`: Die Rückgabe von `{ cancel: true }` ist endgültig. Sobald irgendein Handler dies setzt, werden Handler mit niedrigerer Priorität übersprungen.
- `message_sending`: Die Rückgabe von `{ cancel: false }` wird als keine Entscheidung behandelt (wie das Weglassen von `cancel`), nicht als Override.

### Felder des API-Objekts

| Feld                     | Typ                       | Beschreibung                                                                                |
| ------------------------ | ------------------------- | ------------------------------------------------------------------------------------------- |
| `api.id`                 | `string`                  | Plugin-ID                                                                                   |
| `api.name`               | `string`                  | Anzeigename                                                                                 |
| `api.version`            | `string?`                 | Plugin-Version (optional)                                                                   |
| `api.description`        | `string?`                 | Plugin-Beschreibung (optional)                                                              |
| `api.source`             | `string`                  | Quellpfad des Plugins                                                                       |
| `api.rootDir`            | `string?`                 | Root-Verzeichnis des Plugins (optional)                                                     |
| `api.config`             | `OpenClawConfig`          | Aktueller Konfigurations-Snapshot (aktive In-Memory-Runtime-Snapshot, wenn verfügbar)      |
| `api.pluginConfig`       | `Record<string, unknown>` | Plugin-spezifische Konfiguration aus `plugins.entries.<id>.config`                          |
| `api.runtime`            | `PluginRuntime`           | [Runtime-Hilfen](/de/plugins/sdk-runtime)                                                      |
| `api.logger`             | `PluginLogger`            | Bereichsbezogener Logger (`debug`, `info`, `warn`, `error`)                                 |
| `api.registrationMode`   | `PluginRegistrationMode`  | Aktueller Lademodus; `"setup-runtime"` ist das leichtgewichtige Startup-/Setup-Fenster vor dem vollständigen Entry |
| `api.resolvePath(input)` | `(string) => string`      | Pfad relativ zum Plugin-Root auflösen                                                       |

## Interne Modulkonvention

Verwenden Sie innerhalb Ihres Plugins lokale Barrel-Dateien für interne Importe:

```
my-plugin/
  api.ts            # Öffentliche Exporte für externe Consumer
  runtime-api.ts    # Nur interne Runtime-Exporte
  index.ts          # Plugin-Entrypoint
  setup-entry.ts    # Leichtgewichtiger Entry nur für Setup (optional)
```

<Warning>
  Importieren Sie Ihr eigenes Plugin in Produktionscode niemals über `openclaw/plugin-sdk/<ihr-plugin>`.
  Leiten Sie interne Importe über `./api.ts` oder
  `./runtime-api.ts`. Der SDK-Pfad ist nur der externe Vertrag.
</Warning>

Fassadengeladene öffentliche Oberflächen gebündelter Plugins (`api.ts`, `runtime-api.ts`,
`index.ts`, `setup-entry.ts` und ähnliche öffentliche Entry-Dateien) bevorzugen jetzt den
aktiven Runtime-Konfigurations-Snapshot, wenn OpenClaw bereits läuft. Wenn noch kein Runtime-
Snapshot existiert, greifen sie auf die auf der Festplatte aufgelöste Konfigurationsdatei zurück.

Provider-Plugins können außerdem einen schmalen pluginlokalen Vertrags-Barrel bereitstellen, wenn ein
Helper absichtlich providerspezifisch ist und noch nicht in einen generischen SDK-
Subpfad gehört. Aktuelles gebündeltes Beispiel: Der Anthropic-Provider hält seine Claude-
Stream-Hilfen in seiner eigenen öffentlichen `api.ts`-/`contract-api.ts`-Seam, anstatt
Logik für Anthropic-Beta-Header und `service_tier` in einen generischen
`plugin-sdk/*`-Vertrag zu verschieben.

Weitere aktuelle gebündelte Beispiele:

- `@openclaw/openai-provider`: `api.ts` exportiert Provider-Builder,
  Default-Model-Hilfen und Realtime-Provider-Builder
- `@openclaw/openrouter-provider`: `api.ts` exportiert den Provider-Builder sowie
  Hilfen für Onboarding/Konfiguration

<Warning>
  Produktionscode von Erweiterungen sollte auch Importe von `openclaw/plugin-sdk/<other-plugin>`
  vermeiden. Wenn ein Helper wirklich geteilt wird, verschieben Sie ihn in einen neutralen SDK-Subpfad
  wie `openclaw/plugin-sdk/speech`, `.../provider-model-shared` oder eine andere
  capability-orientierte Oberfläche, anstatt zwei Plugins miteinander zu koppeln.
</Warning>

## Verwandt

- [Entry Points](/de/plugins/sdk-entrypoints) — Optionen für `definePluginEntry` und `defineChannelPluginEntry`
- [Runtime Helpers](/de/plugins/sdk-runtime) — vollständige Referenz des Namespace `api.runtime`
- [Setup and Config](/de/plugins/sdk-setup) — Packaging, Manifeste, Konfigurationsschemata
- [Testing](/de/plugins/sdk-testing) — Test-Utilities und Lint-Regeln
- [SDK Migration](/de/plugins/sdk-migration) — Migration von veralteten Oberflächen
- [Plugin Internals](/de/plugins/architecture) — ausführliche Architektur und Capability-Modell
