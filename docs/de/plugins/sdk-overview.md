---
read_when:
    - Sie müssen wissen, aus welchem SDK-Subpath Sie importieren sollen
    - Sie möchten eine Referenz für alle Registrierungsmethoden auf OpenClawPluginApi
    - Sie suchen einen bestimmten SDK-Export
sidebarTitle: SDK Overview
summary: Import-Map, Referenz der Registrierungs-API und SDK-Architektur
title: Überblick über das Plugin SDK
x-i18n:
    generated_at: "2026-04-06T03:10:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: d801641f26f39dc21490d2a69a337ff1affb147141360916b8b58a267e9f822a
    source_path: plugins/sdk-overview.md
    workflow: 15
---

# Überblick über das Plugin SDK

Das Plugin SDK ist der typisierte Vertrag zwischen Plugins und dem Core. Diese Seite ist die
Referenz dafür, **was Sie importieren** und **was Sie registrieren können**.

<Tip>
  **Suchen Sie eine Schritt-für-Schritt-Anleitung?**
  - Erstes Plugin? Beginnen Sie mit [Getting Started](/de/plugins/building-plugins)
  - Kanal-Plugin? Siehe [Channel Plugins](/de/plugins/sdk-channel-plugins)
  - Provider-Plugin? Siehe [Provider Plugins](/de/plugins/sdk-provider-plugins)
</Tip>

## Import-Konvention

Importieren Sie immer aus einem bestimmten Subpath:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

Jeder Subpath ist ein kleines, in sich abgeschlossenes Modul. Das hält den Start schnell und
verhindert Probleme mit zirkulären Abhängigkeiten. Für kanalbezogene Entry-/Build-Helfer
bevorzugen Sie `openclaw/plugin-sdk/channel-core`; verwenden Sie `openclaw/plugin-sdk/core` für
die breitere Sammeloberfläche und gemeinsame Hilfsfunktionen wie
`buildChannelConfigSchema`.

Fügen Sie keine providerbenannten Convenience-Schnittstellen hinzu und verlassen Sie sich nicht auf
solche wie `openclaw/plugin-sdk/slack`, `openclaw/plugin-sdk/discord`,
`openclaw/plugin-sdk/signal`, `openclaw/plugin-sdk/whatsapp` oder
kanalgebrandete Hilfs-Schnittstellen. Gebündelte Plugins sollten generische
SDK-Subpaths innerhalb ihrer eigenen `api.ts`- oder `runtime-api.ts`-Barrels zusammensetzen, und der Core
sollte entweder diese pluginlokalen Barrels verwenden oder einen schmalen generischen SDK-
Vertrag hinzufügen, wenn der Bedarf wirklich kanalübergreifend ist.

Die generierte Export-Map enthält weiterhin eine kleine Menge an Hilfs-Schnittstellen für gebündelte Plugins,
wie `plugin-sdk/feishu`, `plugin-sdk/feishu-setup`,
`plugin-sdk/zalo`, `plugin-sdk/zalo-setup` und `plugin-sdk/matrix*`. Diese
Subpaths existieren nur für die Wartung und Kompatibilität gebündelter Plugins; sie werden absichtlich aus der allgemeinen Tabelle unten ausgelassen und sind nicht der empfohlene
Importpfad für neue Drittanbieter-Plugins.

## Subpath-Referenz

Die am häufigsten verwendeten Subpaths, nach Zweck gruppiert. Die generierte vollständige Liste von
mehr als 200 Subpaths befindet sich in `scripts/lib/plugin-sdk-entrypoints.json`.

Reservierte Hilfs-Subpaths für gebündelte Plugins erscheinen weiterhin in dieser generierten Liste.
Behandeln Sie diese als Implementierungsdetail-/Kompatibilitätsoberflächen, sofern eine Dokumentationsseite
nicht ausdrücklich eine davon als öffentlich hervorhebt.

### Plugin-Entry

| Subpath                     | Wichtige Exporte                                                                                                                      |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/plugin-entry`   | `definePluginEntry`                                                                                                                    |
| `plugin-sdk/core`           | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema` |
| `plugin-sdk/config-schema`  | `OpenClawSchema`                                                                                                                       |
| `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry`                                                                                                      |

<AccordionGroup>
  <Accordion title="Kanal-Subpaths">
    | Subpath | Wichtige Exporte |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | Root-`openclaw.json`-Zod-Schema-Export (`OpenClawSchema`) |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, plus `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | Gemeinsame Hilfsfunktionen für Einrichtungsassistenten, Allowlist-Eingabeaufforderungen, Builder für Einrichtungsstatus |
    | `plugin-sdk/setup-runtime` | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | `createEnvPatchedAccountSetupAdapter` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | Hilfsfunktionen für Multi-Account-Konfiguration/Aktions-Gates, Hilfsfunktionen für Fallbacks auf Standardkonten |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, Hilfsfunktionen zur Normalisierung von Konto-IDs |
    | `plugin-sdk/account-resolution` | Hilfsfunktionen für Konto-Lookup und Standard-Fallback |
    | `plugin-sdk/account-helpers` | Schmale Hilfsfunktionen für Kontolisten/Kontoaktionen |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | `createChannelReplyPipeline` |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter` |
    | `plugin-sdk/channel-config-schema` | Typen für Kanalkonfigurations-Schemas |
    | `plugin-sdk/telegram-command-config` | Hilfsfunktionen zur Normalisierung/Validierung benutzerdefinierter Telegram-Befehle mit Fallback auf gebündelten Vertrag |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-lifecycle` | `createAccountStatusSink` |
    | `plugin-sdk/inbound-envelope` | Gemeinsame Hilfsfunktionen für eingehende Routen und Envelope-Builder |
    | `plugin-sdk/inbound-reply-dispatch` | Gemeinsame Hilfsfunktionen zum Aufzeichnen und Verteilen eingehender Nachrichten |
    | `plugin-sdk/messaging-targets` | Hilfsfunktionen zum Parsen/Abgleichen von Zielen |
    | `plugin-sdk/outbound-media` | Gemeinsame Hilfsfunktionen zum Laden ausgehender Medien |
    | `plugin-sdk/outbound-runtime` | Hilfsfunktionen für ausgehende Identität/Sende-Delegation |
    | `plugin-sdk/thread-bindings-runtime` | Hilfsfunktionen für Lifecycle und Adapter von Thread-Bindings |
    | `plugin-sdk/agent-media-payload` | Legacy-Builder für Agent-Medien-Payloads |
    | `plugin-sdk/conversation-runtime` | Hilfsfunktionen für Konversations-/Thread-Binding, Pairing und konfigurierte Bindings |
    | `plugin-sdk/runtime-config-snapshot` | Hilfsfunktion für Laufzeit-Konfigurations-Snapshots |
    | `plugin-sdk/runtime-group-policy` | Hilfsfunktionen zur Auflösung von Gruppenrichtlinien zur Laufzeit |
    | `plugin-sdk/channel-status` | Gemeinsame Hilfsfunktionen für Snapshots/Zusammenfassungen des Kanalstatus |
    | `plugin-sdk/channel-config-primitives` | Schmale Primitive für Kanalkonfigurations-Schemas |
    | `plugin-sdk/channel-config-writes` | Hilfsfunktionen für die Autorisierung von Schreibvorgängen in Kanalkonfigurationen |
    | `plugin-sdk/channel-plugin-common` | Gemeinsame Prelude-Exporte für Kanal-Plugins |
    | `plugin-sdk/allowlist-config-edit` | Hilfsfunktionen zum Bearbeiten/Lesen von Allowlist-Konfigurationen |
    | `plugin-sdk/group-access` | Gemeinsame Hilfsfunktionen für Entscheidungen zum Gruppenzugriff |
    | `plugin-sdk/direct-dm` | Gemeinsame Hilfsfunktionen für Authentifizierung/Guards bei direkten DMs |
    | `plugin-sdk/interactive-runtime` | Hilfsfunktionen zur Normalisierung/Reduktion interaktiver Antwort-Payloads |
    | `plugin-sdk/channel-inbound` | Debounce-, Mention-Matching- und Envelope-Hilfsfunktionen |
    | `plugin-sdk/channel-send-result` | Typen für Antwortergebnisse |
    | `plugin-sdk/channel-actions` | `createMessageToolButtonsSchema`, `createMessageToolCardSchema` |
    | `plugin-sdk/channel-targets` | Hilfsfunktionen zum Parsen/Abgleichen von Zielen |
    | `plugin-sdk/channel-contract` | Typen für Kanalverträge |
    | `plugin-sdk/channel-feedback` | Verdrahtung für Feedback/Reaktionen |
  </Accordion>

  <Accordion title="Provider-Subpaths">
    | Subpath | Wichtige Exporte |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/provider-setup` | Kuratierte Hilfsfunktionen für die Einrichtung lokaler/selbst gehosteter Provider |
    | `plugin-sdk/self-hosted-provider-setup` | Fokussierte Hilfsfunktionen für die Einrichtung selbst gehosteter OpenAI-kompatibler Provider |
    | `plugin-sdk/provider-auth-runtime` | Hilfsfunktionen zur Auflösung von API-Schlüsseln zur Laufzeit für Provider-Plugins |
    | `plugin-sdk/provider-auth-api-key` | Hilfsfunktionen für API-Schlüssel-Onboarding/Profilschreibvorgänge |
    | `plugin-sdk/provider-auth-result` | Standard-Builder für OAuth-Authentifizierungsergebnisse |
    | `plugin-sdk/provider-auth-login` | Gemeinsame Hilfsfunktionen für interaktive Anmeldung bei Provider-Plugins |
    | `plugin-sdk/provider-env-vars` | Hilfsfunktionen für die Suche nach Provider-Auth-Umgebungsvariablen |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, gemeinsame Builder für Replay-Richtlinien, Hilfsfunktionen für Provider-Endpoints und Model-ID-Normalisierung wie `normalizeNativeXaiModelId` |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | Generische Hilfsfunktionen für HTTP-/Endpoint-Funktionen von Providern |
    | `plugin-sdk/provider-web-fetch` | Hilfsfunktionen zur Registrierung/Zwischenspeicherung von Web-Fetch-Providern |
    | `plugin-sdk/provider-web-search` | Hilfsfunktionen zur Registrierung/Zwischenspeicherung/Konfiguration von Websuch-Providern |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, Gemini-Schema-Bereinigung und -Diagnose sowie xAI-Kompatibilitätshelfer wie `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
    | `plugin-sdk/provider-usage` | `fetchClaudeUsage` und Ähnliches |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, Typen für Stream-Wrapper sowie gemeinsame Wrapper-Hilfsfunktionen für Anthropic/Bedrock/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
    | `plugin-sdk/provider-onboard` | Hilfsfunktionen zum Patchen der Onboarding-Konfiguration |
    | `plugin-sdk/global-singleton` | Prozesslokale Hilfsfunktionen für Singletons/Maps/Caches |
  </Accordion>

  <Accordion title="Auth- und Sicherheits-Subpaths">
    | Subpath | Wichtige Exporte |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, Hilfsfunktionen für Befehlsregister, Hilfsfunktionen für Sender-Autorisierung |
    | `plugin-sdk/approval-auth-runtime` | Hilfsfunktionen zur Auflösung von Genehmigern und für Same-Chat-Aktionsauthentifizierung |
    | `plugin-sdk/approval-client-runtime` | Hilfsfunktionen für native Exec-Genehmigungsprofile/-filter |
    | `plugin-sdk/approval-delivery-runtime` | Adapter für native Genehmigungsfunktionen/Zustellung |
    | `plugin-sdk/approval-native-runtime` | Hilfsfunktionen für native Genehmigungsziele und Konto-Bindings |
    | `plugin-sdk/approval-reply-runtime` | Hilfsfunktionen für Antwort-Payloads bei Exec-/Plugin-Genehmigungen |
    | `plugin-sdk/command-auth-native` | Native Befehlsauthentifizierung und Hilfsfunktionen für native Sitzungsziele |
    | `plugin-sdk/command-detection` | Gemeinsame Hilfsfunktionen zur Befehlserkennung |
    | `plugin-sdk/command-surface` | Hilfsfunktionen zur Normalisierung von Befehlsinhalten und Befehlsoberflächen |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/security-runtime` | Gemeinsame Hilfsfunktionen für Vertrauen, DM-Gating, externe Inhalte und Secret-Erfassung |
    | `plugin-sdk/ssrf-policy` | Hilfsfunktionen für Host-Allowlists und SSRF-Richtlinien für private Netzwerke |
    | `plugin-sdk/ssrf-runtime` | Hilfsfunktionen für Pinned-Dispatcher, SSRF-geschützten Fetch und SSRF-Richtlinien |
    | `plugin-sdk/secret-input` | Hilfsfunktionen zum Parsen von Secret-Eingaben |
    | `plugin-sdk/webhook-ingress` | Hilfsfunktionen für Webhook-Anfragen/Ziele |
    | `plugin-sdk/webhook-request-guards` | Hilfsfunktionen für Größe/Timeout von Request-Bodies |
  </Accordion>

  <Accordion title="Laufzeit- und Storage-Subpaths">
    | Subpath | Wichtige Exporte |
    | --- | --- |
    | `plugin-sdk/runtime` | Breite Hilfsfunktionen für Laufzeit, Logging, Backup, Plugin-Installation |
    | `plugin-sdk/runtime-env` | Schmale Hilfsfunktionen für Laufzeitumgebung, Logger, Timeout, Retry und Backoff |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Gemeinsame Hilfsfunktionen für Plugin-Befehle/Hooks/HTTP/Interaktivität |
    | `plugin-sdk/hook-runtime` | Gemeinsame Hilfsfunktionen für Webhooks und interne Hook-Pipelines |
    | `plugin-sdk/lazy-runtime` | Hilfsfunktionen für verzögerte Laufzeitimporte/-Bindings wie `createLazyRuntimeModule`, `createLazyRuntimeMethod` und `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | Hilfsfunktionen für Prozessausführung |
    | `plugin-sdk/cli-runtime` | Hilfsfunktionen für CLI-Formatierung, Warten und Versionen |
    | `plugin-sdk/gateway-runtime` | Hilfsfunktionen für Gateway-Client und Patches des Kanalstatus |
    | `plugin-sdk/config-runtime` | Hilfsfunktionen für Laden/Schreiben von Konfigurationen |
    | `plugin-sdk/telegram-command-config` | Normalisierung von Telegram-Befehlsnamen/-beschreibungen und Prüfungen auf Duplikate/Konflikte, auch wenn die gebündelte Telegram-Vertragsoberfläche nicht verfügbar ist |
    | `plugin-sdk/approval-runtime` | Hilfsfunktionen für Exec-/Plugin-Genehmigungen, Builder für Genehmigungsfunktionen, Auth-/Profil-Hilfsfunktionen, natives Routing/Laufzeit-Hilfsfunktionen |
    | `plugin-sdk/reply-runtime` | Gemeinsame Hilfsfunktionen für eingehende Nachrichten/Antwort-Laufzeit, Chunking, Dispatch, Heartbeat, Antwort-Planer |
    | `plugin-sdk/reply-dispatch-runtime` | Schmale Hilfsfunktionen für Antwort-Dispatch/Finalisierung |
    | `plugin-sdk/reply-history` | Gemeinsame Hilfsfunktionen für den Kurzfenster-Antwortverlauf wie `buildHistoryContext`, `recordPendingHistoryEntry` und `clearHistoryEntriesIfEnabled` |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | Schmale Hilfsfunktionen für Text-/Markdown-Chunking |
    | `plugin-sdk/session-store-runtime` | Hilfsfunktionen für Sitzungsspeicherpfade und `updated-at` |
    | `plugin-sdk/state-paths` | Hilfsfunktionen für Pfade von State-/OAuth-Verzeichnissen |
    | `plugin-sdk/routing` | Hilfsfunktionen für Route-/Sitzungsschlüssel-/Konto-Bindings wie `resolveAgentRoute`, `buildAgentSessionKey` und `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | Gemeinsame Hilfsfunktionen für Statuszusammenfassungen von Kanal/Konto, Standardwerte für Laufzeitstatus und Metadaten von Problemen |
    | `plugin-sdk/target-resolver-runtime` | Gemeinsame Hilfsfunktionen zur Zielauflösung |
    | `plugin-sdk/string-normalization-runtime` | Hilfsfunktionen zur Slug-/String-Normalisierung |
    | `plugin-sdk/request-url` | String-URLs aus fetch-/request-ähnlichen Eingaben extrahieren |
    | `plugin-sdk/run-command` | Zeitgesteuerter Command-Runner mit normalisierten stdout-/stderr-Ergebnissen |
    | `plugin-sdk/param-readers` | Allgemeine Reader für Tool-/CLI-Parameter |
    | `plugin-sdk/tool-send` | Kanonische Sendefelder für Ziele aus Tool-Argumenten extrahieren |
    | `plugin-sdk/temp-path` | Gemeinsame Hilfsfunktionen für temporäre Download-Pfade |
    | `plugin-sdk/logging-core` | Hilfsfunktionen für Subsystem-Logger und Schwärzung |
    | `plugin-sdk/markdown-table-runtime` | Hilfsfunktionen für Markdown-Tabellenmodi |
    | `plugin-sdk/json-store` | Kleine Hilfsfunktionen zum Lesen/Schreiben von JSON-Status |
    | `plugin-sdk/file-lock` | Wiederbetretbare Hilfsfunktionen für Dateisperren |
    | `plugin-sdk/persistent-dedupe` | Hilfsfunktionen für festplattenbasierte Dedupe-Caches |
    | `plugin-sdk/acp-runtime` | Hilfsfunktionen für ACP-Laufzeit/Sitzungen und Antwort-Dispatch |
    | `plugin-sdk/agent-config-primitives` | Schmale Primitive für Schemas der Agent-Laufzeitkonfiguration |
    | `plugin-sdk/boolean-param` | Loser Boolean-Parameter-Reader |
    | `plugin-sdk/dangerous-name-runtime` | Hilfsfunktionen zur Auflösung von Übereinstimmungen mit gefährlichen Namen |
    | `plugin-sdk/device-bootstrap` | Hilfsfunktionen für Device-Bootstrap und Pairing-Tokens |
    | `plugin-sdk/extension-shared` | Gemeinsame Primitive für passive Kanäle und Statushilfsfunktionen |
    | `plugin-sdk/models-provider-runtime` | Hilfsfunktionen für den `/models`-Befehl und Provider-Antworten |
    | `plugin-sdk/skill-commands-runtime` | Hilfsfunktionen zum Auflisten von Skill-Befehlen |
    | `plugin-sdk/native-command-registry` | Hilfsfunktionen zum Registrieren/Erstellen/Serialisieren nativer Befehle |
    | `plugin-sdk/provider-zai-endpoint` | Hilfsfunktionen zur Erkennung von Z.AI-Endpoints |
    | `plugin-sdk/infra-runtime` | Hilfsfunktionen für Systemereignisse/Heartbeat |
    | `plugin-sdk/collection-runtime` | Kleine Hilfsfunktionen für begrenzte Caches |
    | `plugin-sdk/diagnostic-runtime` | Hilfsfunktionen für Diagnose-Flags und -Ereignisse |
    | `plugin-sdk/error-runtime` | Fehlergraph, Formatierung, gemeinsame Hilfsfunktionen zur Fehlerklassifikation, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | Gewrappter Fetch sowie Hilfsfunktionen für Proxys und gepinnte Lookups |
    | `plugin-sdk/host-runtime` | Hilfsfunktionen zur Normalisierung von Hostnamen und SCP-Hosts |
    | `plugin-sdk/retry-runtime` | Hilfsfunktionen für Retry-Konfiguration und Retry-Runner |
    | `plugin-sdk/agent-runtime` | Hilfsfunktionen für Agent-Verzeichnisse, Identität und Workspaces |
    | `plugin-sdk/directory-runtime` | Konfigurationsgestützte Verzeichnisabfrage/-deduplizierung |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Funktions- und Test-Subpaths">
    | Subpath | Wichtige Exporte |
    | --- | --- |
    | `plugin-sdk/media-runtime` | Gemeinsame Hilfsfunktionen zum Abrufen/Transformieren/Speichern von Medien sowie Builder für Medien-Payloads |
    | `plugin-sdk/media-understanding` | Typen für Media-Understanding-Provider sowie providerseitige Exporte für Bild-/Audio-Hilfsfunktionen |
    | `plugin-sdk/text-runtime` | Gemeinsame Hilfsfunktionen für Text/Markdown/Logging wie das Entfernen von für Assistants sichtbarem Text, Hilfsfunktionen für Markdown-Rendering/Chunking/Tabellen, Schwärzung, Directive-Tags und sichere Text-Utilities |
    | `plugin-sdk/text-chunking` | Hilfsfunktion für das Chunking ausgehender Texte |
    | `plugin-sdk/speech` | Typen für Sprach-Provider sowie providerseitige Hilfsfunktionen für Directives, Register und Validierung |
    | `plugin-sdk/speech-core` | Gemeinsame Typen für Sprach-Provider sowie Hilfsfunktionen für Register, Directives und Normalisierung |
    | `plugin-sdk/realtime-transcription` | Typen für Realtime-Transcription-Provider und Hilfsfunktionen für Register |
    | `plugin-sdk/realtime-voice` | Typen für Realtime-Voice-Provider und Hilfsfunktionen für Register |
    | `plugin-sdk/image-generation` | Typen für Image-Generation-Provider |
    | `plugin-sdk/image-generation-core` | Gemeinsame Typen für Bildgenerierung, Failover, Authentifizierung und Hilfsfunktionen für Register |
    | `plugin-sdk/music-generation` | Typen für Music-Generation-Provider/Requests/Results |
    | `plugin-sdk/music-generation-core` | Gemeinsame Typen für Musikgenerierung, Failover-Hilfsfunktionen, Provider-Lookup und Parsing von Modellreferenzen |
    | `plugin-sdk/video-generation` | Typen für Video-Generation-Provider/Requests/Results |
    | `plugin-sdk/video-generation-core` | Gemeinsame Typen für Videoerzeugung, Failover-Hilfsfunktionen, Provider-Lookup und Parsing von Modellreferenzen |
    | `plugin-sdk/webhook-targets` | Hilfsfunktionen für Webhook-Zielregister und Routeninstallation |
    | `plugin-sdk/webhook-path` | Hilfsfunktionen zur Normalisierung von Webhook-Pfaden |
    | `plugin-sdk/web-media` | Gemeinsame Hilfsfunktionen zum Laden lokaler/entfernter Medien |
    | `plugin-sdk/zod` | Re-exportiertes `zod` für Nutzer des Plugin SDK |
    | `plugin-sdk/testing` | `installCommonResolveTargetErrorCases`, `shouldAckReaction` |
  </Accordion>

  <Accordion title="Speicher-Subpaths">
    | Subpath | Wichtige Exporte |
    | --- | --- |
    | `plugin-sdk/memory-core` | Gebündelte `memory-core`-Hilfsoberfläche für Manager-/Konfigurations-/Datei-/CLI-Hilfsfunktionen |
    | `plugin-sdk/memory-core-engine-runtime` | Laufzeit-Fassade für Memory-Index/Suche |
    | `plugin-sdk/memory-core-host-engine-foundation` | Exporte für die Foundation-Engine des Memory-Hosts |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Exporte für die Embedding-Engine des Memory-Hosts |
    | `plugin-sdk/memory-core-host-engine-qmd` | Exporte für die QMD-Engine des Memory-Hosts |
    | `plugin-sdk/memory-core-host-engine-storage` | Exporte für die Storage-Engine des Memory-Hosts |
    | `plugin-sdk/memory-core-host-multimodal` | Hilfsfunktionen für multimodale Memory-Hosts |
    | `plugin-sdk/memory-core-host-query` | Hilfsfunktionen für Memory-Host-Abfragen |
    | `plugin-sdk/memory-core-host-secret` | Hilfsfunktionen für Secrets des Memory-Hosts |
    | `plugin-sdk/memory-core-host-status` | Hilfsfunktionen für den Status des Memory-Hosts |
    | `plugin-sdk/memory-core-host-runtime-cli` | CLI-Laufzeit-Hilfsfunktionen für den Memory-Host |
    | `plugin-sdk/memory-core-host-runtime-core` | Core-Laufzeit-Hilfsfunktionen für den Memory-Host |
    | `plugin-sdk/memory-core-host-runtime-files` | Hilfsfunktionen für Dateien/Laufzeit des Memory-Hosts |
    | `plugin-sdk/memory-lancedb` | Gebündelte `memory-lancedb`-Hilfsoberfläche |
  </Accordion>

  <Accordion title="Reservierte gebündelte Hilfs-Subpaths">
    | Familie | Aktuelle Subpaths | Beabsichtigte Verwendung |
    | --- | --- | --- |
    | Browser | `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support` | Hilfsfunktionen für gebündelte Browser-Plugins (`browser-support` bleibt das Kompatibilitäts-Barrel) |
    | Matrix | `plugin-sdk/matrix`, `plugin-sdk/matrix-helper`, `plugin-sdk/matrix-runtime-heavy`, `plugin-sdk/matrix-runtime-shared`, `plugin-sdk/matrix-runtime-surface`, `plugin-sdk/matrix-surface`, `plugin-sdk/matrix-thread-bindings` | Hilfs-/Laufzeitoberfläche für das gebündelte Matrix-Plugin |
    | Line | `plugin-sdk/line`, `plugin-sdk/line-core`, `plugin-sdk/line-runtime`, `plugin-sdk/line-surface` | Hilfs-/Laufzeitoberfläche für das gebündelte LINE-Plugin |
    | IRC | `plugin-sdk/irc`, `plugin-sdk/irc-surface` | Hilfsoberfläche für das gebündelte IRC-Plugin |
    | Kanalspezifische Hilfsfunktionen | `plugin-sdk/googlechat`, `plugin-sdk/zalouser`, `plugin-sdk/bluebubbles`, `plugin-sdk/bluebubbles-policy`, `plugin-sdk/mattermost`, `plugin-sdk/mattermost-policy`, `plugin-sdk/feishu-conversation`, `plugin-sdk/msteams`, `plugin-sdk/nextcloud-talk`, `plugin-sdk/nostr`, `plugin-sdk/tlon`, `plugin-sdk/twitch` | Gebündelte Kompatibilitäts-/Hilfs-Schnittstellen für Kanäle |
    | Auth-/pluginspezifische Hilfsfunktionen | `plugin-sdk/github-copilot-login`, `plugin-sdk/github-copilot-token`, `plugin-sdk/diagnostics-otel`, `plugin-sdk/diffs`, `plugin-sdk/llm-task`, `plugin-sdk/thread-ownership`, `plugin-sdk/voice-call` | Gebündelte Hilfs-Schnittstellen für Funktionen/Plugins; `plugin-sdk/github-copilot-token` exportiert derzeit `DEFAULT_COPILOT_API_BASE_URL`, `deriveCopilotApiBaseUrlFromToken` und `resolveCopilotApiToken` |
  </Accordion>
</AccordionGroup>

## Registrierungs-API

Der Callback `register(api)` erhält ein `OpenClawPluginApi`-Objekt mit diesen
Methoden:

### Registrierung von Funktionen

| Methode                                          | Was registriert wird            |
| ------------------------------------------------ | ------------------------------- |
| `api.registerProvider(...)`                      | Text-Inferenz (LLM)             |
| `api.registerChannel(...)`                       | Messaging-Kanal                 |
| `api.registerSpeechProvider(...)`                | Text-to-Speech- / STT-Synthese  |
| `api.registerRealtimeTranscriptionProvider(...)` | Streaming-Echtzeit-Transkription |
| `api.registerRealtimeVoiceProvider(...)`         | Duplex-Echtzeit-Sprachsitzungen |
| `api.registerMediaUnderstandingProvider(...)`    | Bild-/Audio-/Videoanalyse       |
| `api.registerImageGenerationProvider(...)`       | Bildgenerierung                 |
| `api.registerMusicGenerationProvider(...)`       | Musikgenerierung                |
| `api.registerVideoGenerationProvider(...)`       | Videoerzeugung                  |
| `api.registerWebFetchProvider(...)`              | Web-Fetch- / Scrape-Provider    |
| `api.registerWebSearchProvider(...)`             | Websuche                        |

### Tools und Befehle

| Methode                         | Was registriert wird                            |
| ------------------------------- | ----------------------------------------------- |
| `api.registerTool(tool, opts?)` | Agent-Tool (erforderlich oder `{ optional: true }`) |
| `api.registerCommand(def)`      | Benutzerdefinierter Befehl (umgeht das LLM)     |

### Infrastruktur

| Methode                                        | Was registriert wird     |
| --------------------------------------------- | ------------------------ |
| `api.registerHook(events, handler, opts?)`    | Event-Hook               |
| `api.registerHttpRoute(params)`               | Gateway-HTTP-Endpoint    |
| `api.registerGatewayMethod(name, handler)`    | Gateway-RPC-Methode      |
| `api.registerCli(registrar, opts?)`           | CLI-Unterbefehl          |
| `api.registerService(service)`                | Hintergrunddienst        |
| `api.registerInteractiveHandler(registration)` | Interaktiver Handler    |

Reservierte Core-Admin-Namespaces (`config.*`, `exec.approvals.*`, `wizard.*`,
`update.*`) bleiben immer `operator.admin`, selbst wenn ein Plugin versucht, einen
engeren Geltungsbereich für Gateway-Methoden zuzuweisen. Bevorzugen Sie pluginspezifische Präfixe für
plugin-eigene Methoden.

### Registrierungsmetadaten für CLI

`api.registerCli(registrar, opts?)` akzeptiert zwei Arten von Top-Level-Metadaten:

- `commands`: explizite Befehlswurzeln, die dem Registrar gehören
- `descriptors`: Parse-Zeit-Befehlsdeskriptoren, die für Root-CLI-Hilfe,
  Routing und verzögerte Registrierung von Plugin-CLI verwendet werden

Wenn ein Plugin-Befehl im normalen Root-CLI-Pfad verzögert geladen bleiben soll,
geben Sie `descriptors` an, die jede Top-Level-Befehlswurzel abdecken, die von diesem
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

Verwenden Sie `commands` allein nur dann, wenn Sie keine verzögerte Root-CLI-Registrierung benötigen.
Dieser eager Kompatibilitätspfad wird weiterhin unterstützt, installiert jedoch keine
deskriptorbasierten Platzhalter für verzögertes Laden zur Parse-Zeit.

### Exklusive Slots

| Methode                                    | Was registriert wird                  |
| ------------------------------------------ | ------------------------------------- |
| `api.registerContextEngine(id, factory)`   | Context Engine (jeweils nur eine aktiv) |
| `api.registerMemoryPromptSection(builder)` | Builder für Memory-Prompt-Abschnitte  |
| `api.registerMemoryFlushPlan(resolver)`    | Resolver für Memory-Flush-Pläne       |
| `api.registerMemoryRuntime(runtime)`       | Adapter für Memory-Laufzeit           |

### Memory-Embedding-Adapter

| Methode                                        | Was registriert wird                                  |
| --------------------------------------------- | ----------------------------------------------------- |
| `api.registerMemoryEmbeddingProvider(adapter)` | Memory-Embedding-Adapter für das aktive Plugin       |

- `registerMemoryPromptSection`, `registerMemoryFlushPlan` und
  `registerMemoryRuntime` sind exklusiv für Memory-Plugins.
- `registerMemoryEmbeddingProvider` erlaubt dem aktiven Memory-Plugin, einen
  oder mehrere Embedding-Adapter-IDs zu registrieren (zum Beispiel `openai`, `gemini` oder eine benutzerdefinierte
  plugindefinierte ID).
- Benutzerkonfiguration wie `agents.defaults.memorySearch.provider` und
  `agents.defaults.memorySearch.fallback` wird gegen diese registrierten
  Adapter-IDs aufgelöst.

### Ereignisse und Lifecycle

| Methode                                      | Was sie tut                  |
| ------------------------------------------- | ---------------------------- |
| `api.on(hookName, handler, opts?)`          | Typisierter Lifecycle-Hook   |
| `api.onConversationBindingResolved(handler)` | Callback für Konversations-Binding |

### Hook-Entscheidungssemantik

- `before_tool_call`: die Rückgabe von `{ block: true }` ist final. Sobald ein Handler dies setzt, werden Handler mit niedrigerer Priorität übersprungen.
- `before_tool_call`: die Rückgabe von `{ block: false }` wird als keine Entscheidung behandelt (wie das Weglassen von `block`), nicht als Überschreibung.
- `before_install`: die Rückgabe von `{ block: true }` ist final. Sobald ein Handler dies setzt, werden Handler mit niedrigerer Priorität übersprungen.
- `before_install`: die Rückgabe von `{ block: false }` wird als keine Entscheidung behandelt (wie das Weglassen von `block`), nicht als Überschreibung.
- `reply_dispatch`: die Rückgabe von `{ handled: true, ... }` ist final. Sobald ein Handler die Zustellung beansprucht, werden Handler mit niedrigerer Priorität und der Standardpfad für Model-Dispatch übersprungen.
- `message_sending`: die Rückgabe von `{ cancel: true }` ist final. Sobald ein Handler dies setzt, werden Handler mit niedrigerer Priorität übersprungen.
- `message_sending`: die Rückgabe von `{ cancel: false }` wird als keine Entscheidung behandelt (wie das Weglassen von `cancel`), nicht als Überschreibung.

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
| `api.runtime`            | `PluginRuntime`           | [Runtime Helpers](/de/plugins/sdk-runtime)                                                     |
| `api.logger`             | `PluginLogger`            | Scoped Logger (`debug`, `info`, `warn`, `error`)                                            |
| `api.registrationMode`   | `PluginRegistrationMode`  | Aktueller Lademodus; `"setup-runtime"` ist das schlanke Fenster vor vollständigem Entry bei Start/Einrichtung |
| `api.resolvePath(input)` | `(string) => string`      | Pfad relativ zum Plugin-Root auflösen                                                       |

## Interne Modulkonvention

Verwenden Sie innerhalb Ihres Plugins lokale Barrel-Dateien für interne Importe:

```
my-plugin/
  api.ts            # Öffentliche Exporte für externe Nutzer
  runtime-api.ts    # Nur interne Laufzeit-Exporte
  index.ts          # Plugin-Entry-Point
  setup-entry.ts    # Schlanker nur-Setup-Entry (optional)
```

<Warning>
  Importieren Sie Ihr eigenes Plugin in Produktionscode niemals über `openclaw/plugin-sdk/<your-plugin>`.
  Leiten Sie interne Importe über `./api.ts` oder
  `./runtime-api.ts`. Der SDK-Pfad ist nur der externe Vertrag.
</Warning>

Fassadengeladene öffentliche Oberflächen gebündelter Plugins (`api.ts`, `runtime-api.ts`,
`index.ts`, `setup-entry.ts` und ähnliche öffentliche Entry-Dateien) bevorzugen jetzt den
aktiven Laufzeit-Konfigurations-Snapshot, wenn OpenClaw bereits läuft. Wenn noch kein Laufzeit-
Snapshot existiert, greifen sie auf die auf der Festplatte aufgelöste Konfigurationsdatei zurück.

Provider-Plugins können außerdem ein schmales pluginlokales Vertrags-Barrel bereitstellen, wenn eine
Hilfsfunktion absichtlich providerspezifisch ist und noch nicht in einen generischen SDK-
Subpath gehört. Aktuelles gebündeltes Beispiel: Der Anthropic-Provider hält seine Claude-
Stream-Hilfsfunktionen in seiner eigenen öffentlichen `api.ts`- / `contract-api.ts`-Schnittstelle, statt
Anthropic-Beta-Header- und `service_tier`-Logik in einen generischen
`plugin-sdk/*`-Vertrag hochzustufen.

Weitere aktuelle gebündelte Beispiele:

- `@openclaw/openai-provider`: `api.ts` exportiert Provider-Builder,
  Hilfsfunktionen für Standardmodelle und Builder für Realtime-Provider
- `@openclaw/openrouter-provider`: `api.ts` exportiert den Provider-Builder sowie
  Hilfsfunktionen für Onboarding/Konfiguration

<Warning>
  Produktionscode von Erweiterungen sollte auch Importe aus `openclaw/plugin-sdk/<other-plugin>`
  vermeiden. Wenn eine Hilfsfunktion wirklich gemeinsam genutzt wird, stufen Sie sie zu einem neutralen SDK-Subpath
  wie `openclaw/plugin-sdk/speech`, `.../provider-model-shared` oder einer anderen
  funktionsorientierten Oberfläche hoch, statt zwei Plugins miteinander zu koppeln.
</Warning>

## Verwandt

- [Entry Points](/de/plugins/sdk-entrypoints) — Optionen für `definePluginEntry` und `defineChannelPluginEntry`
- [Runtime Helpers](/de/plugins/sdk-runtime) — vollständige Referenz für den Namespace `api.runtime`
- [Setup and Config](/de/plugins/sdk-setup) — Paketierung, Manifeste, Konfigurationsschemas
- [Testing](/de/plugins/sdk-testing) — Testhilfsprogramme und Lint-Regeln
- [SDK Migration](/de/plugins/sdk-migration) — Migration von veralteten Oberflächen
- [Plugin Internals](/de/plugins/architecture) — ausführliche Architektur und Funktionsmodell
