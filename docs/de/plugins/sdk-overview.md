---
read_when:
    - Sie müssen wissen, aus welchem SDK-Unterpfad Sie importieren müssen
    - Sie möchten eine Referenz für alle Registrierungsmethoden von `OpenClawPluginApi`
    - Sie suchen nach einem bestimmten SDK-Export
sidebarTitle: Plugin SDK overview
summary: Import-Map, Referenz zur Registrierungs-API und SDK-Architektur
title: Überblick über das Plugin-SDK
x-i18n:
    generated_at: "2026-07-12T15:44:42Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 046c6f6996d078f3847dc76b5cc917db614ce85fe66cc5e511793ae9026e1073
    source_path: plugins/sdk-overview.md
    workflow: 16
---

Das Plugin-SDK ist der typisierte Vertrag zwischen Plugins und Core. Diese Seite dient als
Referenz dafür, **was Sie importieren** und **was Sie registrieren können**.

<Note>
  Diese Seite richtet sich an Plugin-Autoren, die `openclaw/plugin-sdk/*` innerhalb von
  OpenClaw verwenden. Externe Apps, Skripte, Dashboards, CI-Jobs und IDE-Erweiterungen,
  die Agents über das Gateway ausführen möchten, sollten stattdessen
  [Gateway-Integrationen für externe Apps](/de/gateway/external-apps) verwenden.
</Note>

<Tip>
Suchen Sie stattdessen nach einer praktischen Anleitung? Beginnen Sie mit [Plugins erstellen](/de/plugins/building-plugins). Verwenden Sie [Channel-Plugins](/de/plugins/sdk-channel-plugins) für Channels, [Provider-Plugins](/de/plugins/sdk-provider-plugins) für Modell-Provider, [CLI-Backend-Plugins](/de/plugins/cli-backend-plugins) für lokale KI-CLI-Backends, [Agent-Harness-Plugins](/de/plugins/sdk-agent-harness) für native Agent-Ausführungsumgebungen und [Plugin-Hooks](/de/plugins/hooks) für Tool- oder Lebenszyklus-Hooks.
</Tip>

## Importkonvention

Importieren Sie immer aus einem bestimmten Unterpfad:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

Jeder Unterpfad ist ein kleines, eigenständiges Modul. Dadurch bleibt der Start schnell und
Probleme mit zirkulären Abhängigkeiten werden vermieden. Bevorzugen Sie für Channel-spezifische Einstiegspunkt-/Build-Helfer
`openclaw/plugin-sdk/channel-core`; verwenden Sie `openclaw/plugin-sdk/core` weiterhin für
die breitere übergreifende Oberfläche und gemeinsame Helfer wie
`buildChannelConfigSchema`.

Veröffentlichen Sie für die Channel-Konfiguration das zum Channel gehörende JSON-Schema über
`openclaw.plugin.json#channelConfigs`. Der Unterpfad `plugin-sdk/channel-config-schema`
ist für gemeinsame Schema-Primitive und den generischen Builder vorgesehen. Die mit OpenClaw
gebündelten Plugins verwenden `plugin-sdk/bundled-channel-config-schema` für beibehaltene
Schemas gebündelter Channels. Veraltete Kompatibilitätsexporte verbleiben unter
`plugin-sdk/channel-config-schema-legacy`; keiner der Unterpfade für gebündelte Schemas ist ein
Muster für neue Plugins.

<Warning>
  Importieren Sie keine Provider- oder Channel-spezifischen Komfortschnittstellen (zum Beispiel
  `openclaw/plugin-sdk/slack`, `.../discord`, `.../signal`, `.../whatsapp`).
  Gebündelte Plugins kombinieren generische SDK-Unterpfade innerhalb ihrer eigenen `api.ts`-/
  `runtime-api.ts`-Barrels; Core-Verbraucher sollten entweder diese Plugin-lokalen
  Barrels verwenden oder einen eng gefassten generischen SDK-Vertrag hinzufügen, wenn ein Bedarf tatsächlich
  Channel-übergreifend ist.

Eine kleine Gruppe von Hilfsschnittstellen für gebündelte Plugins erscheint weiterhin in der generierten Export-
Map, wenn ihre Verwendung durch den zuständigen Eigentümer nachverfolgt wird. Sie dienen ausschließlich der Wartung
gebündelter Plugins und werden nicht als Importpfade für neue Drittanbieter-
Plugins empfohlen.

`openclaw/plugin-sdk/discord` und `openclaw/plugin-sdk/telegram-account` werden
außerdem als veraltete Kompatibilitätsfassaden für die nachverfolgte Verwendung durch zuständige Eigentümer beibehalten. Übernehmen Sie
diese Importpfade nicht in neue Plugins; verwenden Sie stattdessen injizierte Laufzeit-Helfer und
generische Channel-SDK-Unterpfade.
</Warning>

## Unterpfadreferenz

Das Plugin-SDK wird als Gruppe eng gefasster, nach Bereichen gegliederter Unterpfade bereitgestellt (Plugin-
Einstiegspunkt, Channel, Provider, Authentifizierung, Laufzeit, Funktion, Speicher und reservierte
Helfer für gebündelte Plugins). Den vollständigen, gruppierten und verlinkten Katalog finden Sie unter
[Unterpfade des Plugin-SDK](/de/plugins/sdk-subpaths).

Das Inventar der Compiler-Einstiegspunkte befindet sich in
`scripts/lib/plugin-sdk-entrypoints.json`; Paketexporte werden aus
der öffentlichen Teilmenge generiert, nachdem die in
`scripts/lib/plugin-sdk-private-local-only-subpaths.json` aufgeführten, ausschließlich für Repository-lokale Tests bzw. interne Zwecke vorgesehenen Unterpfade abgezogen wurden. Führen Sie
`pnpm plugin-sdk:surface` aus, um die Anzahl der öffentlichen Exporte zu prüfen. Veraltete öffentliche
Unterpfade, die alt genug sind und nicht vom Produktionscode gebündelter Erweiterungen verwendet werden,
werden in `scripts/lib/plugin-sdk-deprecated-public-subpaths.json` erfasst; umfassende
veraltete Re-Export-Barrels werden in
`scripts/lib/plugin-sdk-deprecated-barrel-subpaths.json` erfasst.

## Registrierungs-API

Der Callback `register(api)` erhält ein `OpenClawPluginApi`-Objekt mit den folgenden
Methoden:

### Registrierung von Funktionen

| Methode                                          | Registrierte Funktion                                                                 |
| ------------------------------------------------ | ------------------------------------------------------------------------------------- |
| `api.registerProvider(...)`                      | Textinferenz (LLM)                                                                    |
| `api.registerWorkerProvider(...)`                | Lebenszyklus-Leases für Cloud-Worker                                                   |
| `api.registerModelCatalogProvider(...)`          | Modellkatalogzeilen für Text- und Mediengenerierung                                    |
| `api.registerAgentHarness(...)`                  | [Experimentelle](/de/plugins/sdk-agent-harness) native Agent-Ausführungsumgebung (Codex, Copilot) |
| `api.registerCliBackend(...)`                    | Lokales CLI-Inferenz-Backend                                                          |
| `api.registerChannel(...)`                       | Messaging-Channel                                                                     |
| `api.registerEmbeddingProvider(...)`             | Wiederverwendbarer Provider für Vektoreinbettungen                                     |
| `api.registerSpeechProvider(...)`                | Text-zu-Sprache-/STT-Synthese                                                         |
| `api.registerRealtimeTranscriptionProvider(...)` | Echtzeit-Transkription als Stream                                                      |
| `api.registerRealtimeVoiceProvider(...)`         | Bidirektionale Echtzeit-Sprachsitzungen                                                |
| `api.registerMediaUnderstandingProvider(...)`    | Bild-/Audio-/Videoanalyse                                                              |
| `api.registerTranscriptSourceProvider(...)`      | Quelle für Live- oder importierte Besprechungstranskripte                              |
| `api.registerImageGenerationProvider(...)`       | Bildgenerierung                                                                        |
| `api.registerMusicGenerationProvider(...)`       | Musikgenerierung                                                                       |
| `api.registerVideoGenerationProvider(...)`       | Videogenerierung                                                                       |
| `api.registerWebFetchProvider(...)`              | Provider zum Abrufen/Auslesen von Webinhalten                                          |
| `api.registerWebSearchProvider(...)`             | Websuche                                                                               |
| `api.registerCompactionProvider(...)`            | Austauschbares Backend für die Compaction von Transkripten                             |

Worker-Provider müssen ihre ID außerdem in `contracts.workerProviders` deklarieren.
Core speichert die dauerhafte Absicht vor `provision(profile, operationId)`. Provider validieren die Einstellungen vor der externen Zuweisung und lösen bei einer dauerhaften Ablehnung des Profils einen `WorkerProviderError` aus. Bei Wiederholung der Vorgangs-ID muss `provision` dasselbe Lease übernehmen.
Core speichert die validierten Profileinstellungen zusammen mit dem Lease und übergibt diesen Snapshot an `destroy({ leaseId, profile })`, das idempotent sein muss, sowie an `inspect({ leaseId, profile })`, das `active`, `destroyed` oder `unknown` zurückgibt. Dadurch können Provider Lebenszyklusaufrufe nach einem Neustart des Gateways oder dem Entfernen eines benannten Profils weiterleiten. SSH-Endpunkte verwenden für `keyRef` eine `SecretRef`, niemals direkt eingebettetes Schlüsselmaterial, und enthalten einen `hostKey` aus einer vertrauenswürdigen Bereitstellungsausgabe im exakten Format `algorithm base64`, ohne Hostnamen oder Kommentar. Core fixiert `hostKey` und vertraut niemals einem Schlüssel aus der ersten Verbindung. Ein Provider, der eine dynamische `keyRef` erzeugt, kann `resolveSshIdentity({ leaseId, profile, keyRef })` implementieren; sofern vorhanden, ist dieser Resolver maßgeblich, während Provider ohne ihn den konfigurierten generischen Secret-Resolver verwenden.
Provider mit verlängerbaren Leases können außerdem `renew(leaseId)` implementieren.
`inspect` muss bei vorübergehenden oder unbestimmten Fehlern eine Ausnahme auslösen; geben Sie `unknown` nur bei verbindlich festgestelltem Fehlen zurück. Core markiert einen aktiven lokalen Datensatz als verwaist oder behandelt das Fehlen nach einer gespeicherten Zerstörungsanforderung als Abschluss des Abbaus.

Mit `api.registerEmbeddingProvider(...)` registrierte Embedding-Provider müssen
außerdem im Plugin-Manifest unter `contracts.embeddingProviders` aufgeführt sein. Dies
ist die generische Embedding-Schnittstelle für die wiederverwendbare Vektorerzeugung. Die Speichersuche
kann diese generische Provider-Schnittstelle verwenden. Die ältere Schnittstelle
`api.registerMemoryEmbeddingProvider(...)` und
`contracts.memoryEmbeddingProviders` dient als veraltete Kompatibilität, während
bestehende speicherspezifische Provider migriert werden.

Speicherspezifische Provider, die weiterhin zur Laufzeit `batchEmbed(...)` bereitstellen, bleiben beim
bestehenden dateibezogenen Batch-Vertrag, sofern ihre Laufzeit nicht ausdrücklich
`sourceWideBatchEmbed: true` festlegt. Durch diese Aktivierung kann der Speicher-Host Chunks aus
mehreren geänderten Speicherdateien und aktivierten Quellen in einem einzigen `batchEmbed(...)`-Aufruf bis
zu den Batch-Grenzwerten des Hosts übermitteln. Batch-Adapter, die JSONL-Anforderungsdateien hochladen, müssen
Provider-Jobs sowohl vor Erreichen ihrer Obergrenze für die Upload-Größe als auch vor Erreichen ihrer Obergrenze für
die Anzahl der Anforderungen aufteilen. Der Provider muss pro Eingabe-Chunk genau eine Einbettung in derselben Reihenfolge wie
`batch.chunks` zurückgeben; lassen Sie das Flag weg, wenn der Provider dateilokale Batches erwartet oder
die Eingabereihenfolge in einem größeren, quellenübergreifenden Job nicht beibehalten kann.

### Tools und Befehle

Verwenden Sie [`defineToolPlugin`](/de/plugins/tool-plugins) für einfache reine Tool-Plugins
mit festen Tool-Namen. Verwenden Sie `api.registerTool(...)` direkt für gemischte Plugins
oder eine vollständig dynamische Tool-Registrierung.

| Methode                                | Registrierte Funktion                                                                                                                                 |
| -------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerTool(tool, opts?)`        | Agent-Tool (erforderlich oder `{ optional: true }`)                                                                                                   |
| `api.registerCommand(def)`             | Benutzerdefinierter Befehl (umgeht das LLM)                                                                                                           |
| `api.registerNodeHostCommand(command)` | Von `openclaw node run` verarbeiteter Befehl; optionale `agentTool`-Metadaten können ihn als für den Agent sichtbares Tool bereitstellen, während der Node verbunden ist |

Plugin-Befehle können `agentPromptGuidance` festlegen, wenn der Agent einen kurzen,
dem Befehl zugehörigen Routing-Hinweis benötigt. Beschränken Sie diesen Text auf den Befehl selbst; fügen Sie den
Core-Prompt-Buildern keine Provider- oder Plugin-spezifischen Richtlinien hinzu.

Hinweiseinträge können Legacy-Zeichenfolgen sein, die für jede Prompt-Oberfläche gelten, oder
strukturierte Einträge:

```ts
agentPromptGuidance: [
  "Globaler Befehlshinweis.",
  { text: "Nur im OpenClaw-Haupt-Prompt anzeigen.", surfaces: ["openclaw_main"] },
];
```

Strukturierte `surfaces` können `openclaw_main`, `codex_app_server`,
`cli_backend`, `acp_backend` oder `subagent` enthalten. `pi_main` bleibt ein veralteter Alias
für `openclaw_main`. Lassen Sie `surfaces` für bewusst auf alle Oberflächen angewendete Hinweise weg. Übergeben Sie
kein leeres `surfaces`-Array; es wird abgelehnt, damit ein versehentlicher Verlust des Geltungsbereichs
nicht zu globalem Prompt-Text führt.

Native Entwickleranweisungen des Codex-App-Servers unterliegen strengeren Regeln als andere Prompt-
Oberflächen: Nur Hinweise, deren Geltungsbereich ausdrücklich auf `codex_app_server` beschränkt ist, werden in
diese Lane mit höherer Priorität hochgestuft. Legacy-Zeichenfolgenhinweise und unbeschränkte strukturierte
Hinweise bleiben aus Kompatibilitätsgründen für Prompt-Oberflächen außerhalb von Codex verfügbar.

Node-Host-Befehle werden auf dem verbundenen Node-Host ausgeführt, nicht innerhalb des Gateway-
Prozesses. Wenn `agentTool` vorhanden ist, veröffentlicht der Node nach einer
erfolgreichen Gateway-Verbindung einen Deskriptor; das Gateway stellt ihn Agent-Ausführungen nur bereit, solange dieser
Node verbunden ist und nur wenn der `command` des Deskriptors zur
genehmigten Befehlsoberfläche des Nodes gehört. Setzen Sie `agentTool.defaultPlatforms`, um einen
ungefährlichen Befehl in die standardmäßige Zulassungsliste für Node-Befehle aufzunehmen; andernfalls ist
eine explizite Konfiguration von `gateway.nodes.allowCommands` oder eine Node-Aufrufrichtlinie erforderlich. `agentTool.name`
muss Provider-kompatibel sein: Er muss mit einem Buchstaben beginnen, darf nur Buchstaben, Ziffern,
Unterstriche oder Bindestriche verwenden und höchstens 64 Zeichen lang sein. MCP-gestützte Node-Tools
können `agentTool.mcp`-Metadaten festlegen, damit Katalog- und Tool-Suchoberflächen
die Identität des entfernten MCP-Servers/Tools anzeigen können; die Ausführung erfolgt jedoch weiterhin über den
angekündigten Node-Befehl.

### Infrastruktur

| Methode                                         | Was sie registriert                                           |
| ----------------------------------------------- | ------------------------------------------------------------- |
| `api.registerHook(events, handler, opts?)`      | Ereignis-Hook                                                 |
| `api.registerHttpRoute(params)`                 | Gateway-HTTP-Endpunkt                                         |
| `api.registerGatewayMethod(name, handler)`      | Gateway-RPC-Methode                                           |
| `api.registerGatewayDiscoveryService(service)`  | Lokaler Gateway-Discovery-Advertiser                          |
| `api.registerCli(registrar, opts?)`             | CLI-Unterbefehl                                               |
| `api.registerNodeCliFeature(registrar, opts?)`  | Node-Funktions-CLI unter `openclaw nodes`                     |
| `api.registerService(service)`                  | Hintergrunddienst                                             |
| `api.registerInteractiveHandler(registration)`  | Interaktiver Handler                                          |
| `api.registerAgentToolResultMiddleware(...)`    | Runtime-Middleware für Tool-Ergebnisse                        |
| `api.registerMemoryPromptSupplement(builder)`   | Zusätzlicher speichernaher Prompt-Abschnitt                   |
| `api.registerMemoryCorpusSupplement(adapter)`   | Zusätzliches Korpus für Speichersuche/-lesen                  |
| `api.registerHostedMediaResolver(resolver)`     | Resolver für browserartige gehostete Medien-URLs              |
| `api.registerTextTransforms(transforms)`        | Plugin-eigene Kompatibilitätsumschreibungen für Prompt-/Nachrichtentext |
| `api.registerConfigMigration(migrate)`          | Leichtgewichtige Konfigurationsmigration vor dem Laden der Plugin-Runtime |
| `api.registerMigrationProvider(provider)`       | Importer für `openclaw migrate`                               |
| `api.registerAutoEnableProbe(probe)`            | Konfigurationsprüfung, die dieses Plugin automatisch aktivieren kann |
| `api.registerReload(registration)`              | Restart-/Hot-/Noop-Richtlinie für Konfigurationspräfixe zur Behandlung des Neuladens |
| `api.registerNodeHostCommand(command)`          | Befehlshandler, der gekoppelten Nodes bereitgestellt wird     |
| `api.registerNodeInvokePolicy(policy)`          | Zulassungslisten-/Genehmigungsrichtlinie für von Nodes aufgerufene Befehle |
| `api.registerSecurityAuditCollector(collector)` | Befundsammler für `openclaw security audit`                   |

Builder für Speicher-Prompt-Ergänzungen erhalten optionalen `agentId`-,
`agentSessionKey`- und `sandboxed`-Kontext. `search`- und `get`-Aufrufe für Speicher-Korpus-Ergänzungen
erhalten optionalen `agentId`- und `sandboxed`-Kontext. Plugins mit
Agent-eigenem Speicher sollten diesen Speicher bei jedem Aufruf auflösen, statt
bei der Registrierung einen einzigen globalen Pfad zu erfassen. Wenn eine Agent-ID erforderlich ist, aber
bei einer Multi-Agent-Operation fehlt, muss der Vorgang sicher fehlschlagen, anstatt einen
beliebigen Agent auszuwählen.

Interaktive Telegram-Handler können `{ submitText }` zurückgeben, um Text nach
erfolgreicher Ausführung des Handlers über den normalen eingehenden Agent-Pfad von Telegram weiterzuleiten. OpenClaw behält
die Callback-Schaltfläche bei, wenn die Richtlinie für eingehende Nachrichten den Text überspringt oder die Verarbeitung fehlschlägt, sodass
der Benutzer es erneut versuchen kann, nachdem sich die blockierende Bedingung geändert hat. Dieses Ergebnisfeld ist
Telegram-spezifisch; andere Kanäle behalten ihre eigenen Verträge für interaktive Ergebnisse.

### Host-Hooks für Workflow-Plugins

Host-Hooks sind die SDK-Schnittstellen für Plugins, die am Host-
Lebenszyklus teilnehmen müssen, statt lediglich einen Provider, Kanal oder ein Tool hinzuzufügen. Sie sind
generische Verträge; der Planungsmodus kann sie verwenden, ebenso jedoch Genehmigungs-Workflows,
Arbeitsbereichs-Richtlinienprüfungen, Hintergrundmonitore, Einrichtungsassistenten und UI-Begleit-
Plugins.

| Methode                                                                              | Vertrag, für den sie zuständig ist                                                                                                                          |
| ------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.session.state.registerSessionExtension(...)`                                    | Plugin-eigener, JSON-kompatibler Sitzungsstatus, der über Gateway-Sitzungen projiziert wird                                                                  |
| `api.session.workflow.enqueueNextTurnInjection(...)`                                 | Dauerhafter, genau einmal in die nächste Agent-Runde einer Sitzung injizierter Kontext                                                                       |
| `api.registerTrustedToolPolicy(...)`                                                 | Manifest-gesteuerte, vertrauenswürdige Tool-Richtlinie vor Plugin-Hooks, die Tool-Parameter blockieren oder umschreiben kann                                 |
| `api.registerToolMetadata(...)`                                                      | Anzeigemetadaten für den Tool-Katalog, ohne die Tool-Implementierung zu ändern                                                                               |
| `api.registerCommand(...)`                                                           | Bereichsgebundene Plugin-Befehle; Befehlsergebnisse können `continueAgent: true` oder `suppressReply: true` setzen; native Discord-Befehle unterstützen `descriptionLocalizations` |
| `api.session.controls.registerControlUiDescriptor(...)`                              | Control-UI-Beitragsdeskriptoren für Sitzungs-, Tool-, Ausführungs-, Einstellungs- oder Registerkartenoberflächen                                             |
| `api.lifecycle.registerRuntimeLifecycle(...)`                                        | Bereinigungs-Callbacks für Plugin-eigene Runtime-Ressourcen bei Zurücksetzungs-, Lösch- und Neuladepfaden                                                   |
| `api.agent.events.registerAgentEventSubscription(...)`                               | Bereinigte Ereignisabonnements für Workflow-Status und Monitore                                                                                              |
| `api.runContext.setRunContext(...)` / `getRunContext(...)` / `clearRunContext(...)`  | Plugin-Zwischenstatus pro Ausführung, der beim terminalen Ausführungslebenszyklus gelöscht wird                                                              |
| `api.session.workflow.registerSessionSchedulerJob(...)`                              | Bereinigungsmetadaten für Plugin-eigene Scheduler-Aufträge; plant keine Arbeit und erstellt keine Aufgaben-Datensätze                                        |
| `api.session.workflow.sendSessionAttachment(...)`                                    | Nur gebündelte, Host-vermittelte Zustellung von Dateianhängen an die aktive direkte ausgehende Sitzungsroute                                                  |
| `api.session.workflow.scheduleSessionTurn(...)` / `unscheduleSessionTurnsByTag(...)` | Nur gebündelte, Cron-gestützte geplante Sitzungsrunden sowie Tag-basierte Bereinigung                                                                         |
| `api.session.controls.registerSessionAction(...)`                                    | Typisierte Sitzungsaktionen, die Clients über das Gateway auslösen können                                                                                    |

Ein Deskriptor mit `surface: "tab"` fügt der Control UI eine Seitenleisten-Registerkarte hinzu. Die Registerkarten-
Deskriptoren aktiver Plugins werden Dashboard-Clients im Gateway-
Hello (`controlUiTabs`) angekündigt, sodass die Registerkarte nur erscheint, solange das Plugin aktiviert ist.
Gebündelte Plugins können eine erstklassige Dashboard-Ansicht für ihre Registerkarte bereitstellen; andere
Plugins können `path` auf eine Plugin-HTTP-Route setzen (siehe
`api.registerHttpRoute(...)`), die das Dashboard in einem Sandbox-Frame darstellt.
`icon` ist ein Hinweis auf einen Dashboard-Symbolnamen, `group` wählt den Seitenleistenabschnitt
(`control` oder `agent`), `order` sortiert die Plugin-Registerkarten und `requiredScopes`
blendet die Registerkarte für Verbindungen aus, denen diese Operator-Bereiche fehlen:

```typescript
api.session.controls.registerControlUiDescriptor({
  surface: "tab",
  id: "logbook",
  label: "Logbuch",
  description: "Ihr Tag als Zeitleiste, erstellt aus Bildschirm-Schnappschüssen.",
  icon: "sun",
  group: "control",
  requiredScopes: ["operator.write"],
});
```

Verwenden Sie die gruppierten Namensräume für neuen Plugin-Code:

- `api.session.state.registerSessionExtension(...)`
- `api.session.workflow.enqueueNextTurnInjection(...)`
- `api.session.workflow.registerSessionSchedulerJob(...)`
- `api.session.workflow.sendSessionAttachment(...)`
- `api.session.workflow.scheduleSessionTurn(...)`
- `api.session.workflow.unscheduleSessionTurnsByTag(...)`
- `api.session.controls.registerSessionAction(...)`
- `api.session.controls.registerControlUiDescriptor(...)`
- `api.agent.events.registerAgentEventSubscription(...)`
- `api.agent.events.emitAgentEvent(...)`
- `api.runContext.setRunContext(...)` / `getRunContext(...)` / `clearRunContext(...)`
- `api.lifecycle.registerRuntimeLifecycle(...)`

Die entsprechenden flachen Methoden bleiben als veraltete Kompatibilitäts-
Aliase für vorhandene Plugins verfügbar. Fügen Sie keinen neuen Plugin-Code hinzu, der
`api.registerSessionExtension`, `api.enqueueNextTurnInjection`,
`api.registerControlUiDescriptor`, `api.registerRuntimeLifecycle`,
`api.registerAgentEventSubscription`, `api.emitAgentEvent`,
`api.setRunContext`, `api.getRunContext`, `api.clearRunContext`,
`api.registerSessionSchedulerJob`, `api.registerSessionAction`,
`api.sendSessionAttachment`, `api.scheduleSessionTurn` oder
`api.unscheduleSessionTurnsByTag` direkt aufruft.

`scheduleSessionTurn(...)` ist eine sitzungsgebundene Komfortfunktion über dem Gateway-
Cron-Scheduler. Cron ist für die Zeitplanung zuständig und erstellt den Hintergrund-Aufgabendatensatz, wenn die
Runde ausgeführt wird; das Plugin SDK beschränkt lediglich die Zielsitzung, die Plugin-eigene
Benennung und die Bereinigung. Verwenden Sie innerhalb der geplanten
Runde `api.runtime.tasks.managedFlows`, wenn die Arbeit selbst einen dauerhaften mehrstufigen TaskFlow-Status benötigt.

Die Verträge teilen die Zuständigkeiten bewusst auf:

- Externe Plugins können Sitzungserweiterungen, UI-Deskriptoren, Befehle, Tool-
  Metadaten, Injektionen für die nächste Runde und normale Hooks verwalten.
- Vertrauenswürdige Tool-Richtlinien werden vor gewöhnlichen `before_tool_call`-Hooks ausgeführt und genießen
  das Vertrauen des Hosts. Gebündelte Richtlinien werden zuerst ausgeführt; Richtlinien installierter Plugins erfordern
  eine explizite Aktivierung sowie ihre lokalen IDs in
  `contracts.trustedToolPolicies` und werden anschließend in der Ladereihenfolge der Plugins ausgeführt. Richtlinien-IDs
  sind auf das registrierende Plugin beschränkt.
- Die Zuständigkeit für reservierte Befehle ist ausschließlich gebündelten Plugins vorbehalten. Externe Plugins sollten ihre
  eigenen Befehlsnamen oder Aliase verwenden.
- `allowPromptInjection=false` deaktiviert Prompt-verändernde Hooks einschließlich
  `agent_turn_prepare`, `before_prompt_build`, `heartbeat_prompt_contribution`,
  Prompt-Feldern aus dem veralteten `before_agent_start` und
  `enqueueNextTurnInjection`.

Beispiele für Verbraucher außerhalb des Planungsmodus:

| Plugin-Archetyp                     | Verwendete Hooks                                                                                                                             |
| ----------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Genehmigungsworkflow                | Sitzungserweiterung, Befehlsfortsetzung, Einspeisung in den nächsten Turn, UI-Deskriptor                                                        |
| Budget-/Arbeitsbereich-Richtlinien-Gate | Vertrauenswürdige Tool-Richtlinie, Tool-Metadaten, Sitzungsprojektion                                                                         |
| Hintergrund-Lebenszyklusmonitor     | Bereinigung des Runtime-Lebenszyklus, Abonnement von Agent-Ereignissen, Besitz/Bereinigung des Sitzungsschedulers, Beitrag zum Heartbeat-Prompt, UI-Deskriptor |
| Einrichtungs- oder Onboarding-Assistent | Sitzungserweiterung, bereichsgebundene Befehle, Control-UI-Deskriptor                                                                          |

<Note>
  Reservierte zentrale Admin-Namespaces (`config.*`, `exec.approvals.*`, `wizard.*`,
  `update.*`) bleiben stets `operator.admin`, selbst wenn ein Plugin versucht,
  einen engeren Gateway-Methodenbereich zuzuweisen. Bevorzugen Sie Plugin-spezifische
  Präfixe für Methoden im Besitz eines Plugins.
</Note>

<Accordion title="Wann Tool-Ergebnis-Middleware verwendet werden sollte">
  Mitgelieferte Plugins und ausdrücklich aktivierte installierte Plugins mit
  passenden Manifest-Verträgen können `api.registerAgentToolResultMiddleware(...)`
  verwenden, wenn sie ein Tool-Ergebnis nach der Ausführung und bevor die Runtime
  dieses Ergebnis an das Modell zurückgibt, umschreiben müssen. Dies ist die
  vertrauenswürdige, Runtime-neutrale Schnittstelle für asynchrone
  Ausgabereduzierer wie tokenjuice.

Plugins müssen `contracts.agentToolResultMiddleware` für jede Ziel-Runtime
deklarieren, beispielsweise `["openclaw", "codex"]`. Installierte Plugins ohne
diesen Vertrag oder ohne ausdrückliche Aktivierung können diese Middleware nicht
registrieren; verwenden Sie normale OpenClaw-Plugin-Hooks für Arbeiten, die
kein Tool-Ergebnis-Timing vor dem Modell erfordern. Der alte, ausschließlich
für den eingebetteten Runner vorgesehene Registrierungspfad für
Erweiterungs-Factorys wurde entfernt.
</Accordion>

### Registrierung der Gateway-Erkennung

Mit `api.registerGatewayDiscoveryService(...)` kann ein Plugin das aktive
Gateway über einen lokalen Erkennungstransport wie mDNS/Bonjour ankündigen.
OpenClaw ruft den Dienst während des Gateway-Starts auf, wenn die lokale
Erkennung aktiviert ist, übergibt die aktuellen Gateway-Ports sowie
nicht geheime TXT-Hinweisdaten und ruft den zurückgegebenen `stop`-Handler beim
Herunterfahren des Gateways auf.

```typescript
api.registerGatewayDiscoveryService({
  id: "my-discovery",
  async advertise(ctx) {
    const handle = await startMyAdvertiser({
      gatewayPort: ctx.gatewayPort,
      tls: ctx.gatewayTlsEnabled,
      displayName: ctx.machineDisplayName,
    });
    return { stop: () => handle.stop() };
  },
});
```

Plugins zur Gateway-Erkennung dürfen angekündigte TXT-Werte nicht als
Geheimnisse oder Authentifizierung behandeln. Die Erkennung ist ein
Routing-Hinweis; die Vertrauensverwaltung verbleibt bei der Gateway-Authentifizierung
und dem TLS-Pinning.

### Metadaten zur CLI-Registrierung

`api.registerCli(registrar, opts?)` akzeptiert zwei Arten von Befehlsmetadaten:

- `commands`: explizite Befehlsnamen im Besitz des Registrars
- `descriptors`: Befehlsdeskriptoren zur Parse-Zeit für CLI-Hilfe,
  Routing und verzögerte CLI-Registrierung von Plugins
- `parentPath`: optionaler übergeordneter Befehlspfad für verschachtelte
  Befehlsgruppen, beispielsweise `["nodes"]`

Bevorzugen Sie für Funktionen gekoppelter Nodes
`api.registerNodeCliFeature(registrar, opts?)`. Dies ist ein kleiner Wrapper um
`api.registerCli(..., { parentPath: ["nodes"] })` und kennzeichnet Befehle wie
`openclaw nodes canvas` ausdrücklich als Node-Funktionen im Besitz eines Plugins.

Wenn ein Plugin-Befehl im normalen Stamm-CLI-Pfad verzögert geladen bleiben
soll, stellen Sie `descriptors` bereit, die jeden von diesem Registrar
bereitgestellten obersten Befehlsstamm abdecken.

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

Verschachtelte Befehle erhalten den aufgelösten übergeordneten Befehl als
`program`:

```typescript
api.registerCli(
  async ({ program }) => {
    const { registerNodesCanvasCommands } = await import("./src/cli.js");
    registerNodesCanvasCommands(program);
  },
  {
    parentPath: ["nodes"],
    descriptors: [
      {
        name: "canvas",
        description: "Canvas-Inhalte von einer gekoppelten Node erfassen oder rendern",
        hasSubcommands: true,
      },
    ],
  },
);
```

Verwenden Sie `commands` allein nur, wenn Sie keine verzögerte
Stamm-CLI-Registrierung benötigen. Dieser eager Kompatibilitätspfad wird
weiterhin unterstützt, installiert jedoch keine deskriptorbasierten Platzhalter
für verzögertes Laden zur Parse-Zeit.

### Registrierung des CLI-Backends

Mit `api.registerCliBackend(...)` kann ein Plugin die Standardkonfiguration für
ein lokales KI-CLI-Backend wie `claude-cli` oder `my-cli` besitzen.

- Die Backend-`id` wird zum Provider-Präfix in Modellreferenzen wie `my-cli/gpt-5`.
- Die Backend-`config` verwendet dieselbe Struktur wie `agents.defaults.cliBackends.<id>`.
- Die Benutzerkonfiguration hat weiterhin Vorrang. OpenClaw legt
  `agents.defaults.cliBackends.<id>` über den Plugin-Standard, bevor die CLI
  ausgeführt wird.
- Verwenden Sie `normalizeConfig`, wenn ein Backend nach dem Zusammenführen
  Kompatibilitätsumschreibungen benötigt (beispielsweise die Normalisierung
  alter Flag-Strukturen).
- Verwenden Sie `resolveExecutionArgs` für anfragebezogene Umschreibungen von
  argv, die zum CLI-Dialekt gehören, etwa die Abbildung von OpenClaw-Denkstufen
  auf ein natives Aufwands-Flag. Der Hook erhält `ctx.executionMode`; verwenden
  Sie `"side-question"`, um Backend-native Isolierungs-Flags für flüchtige
  `/btw`-Aufrufe hinzuzufügen. Wenn diese Flags native Tools für eine ansonsten
  stets aktive CLI zuverlässig deaktivieren, deklarieren Sie zusätzlich
  `sideQuestionToolMode: "disabled"`.
- Backends, die alle nativen Tools für einen bestimmten Lauf deaktivieren
  können, dürfen `nativeToolMode: "selectable"` deklarieren. Eingeschränkte
  Aufrufe übergeben ein leeres `ctx.toolAvailability.native`-Tupel sowie eine
  exakte, vom Host isolierte MCP-Zulassungsliste; `resolveExecutionArgs` muss
  beides in den endgültigen argv für einen neuen oder fortgesetzten Lauf
  durchsetzen. OpenClaw verweigert die Ausführung, wenn das Backend dies nicht
  leisten kann.

Eine End-to-End-Anleitung zur Erstellung finden Sie unter
[CLI-Backend-Plugins](/de/plugins/cli-backend-plugins).

### Exklusive Slots

| Methode                                    | Was sie registriert                                                                                                                                                                               |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerContextEngine(id, factory)`   | Kontext-Engine (jeweils eine aktiv). Lebenszyklus-Callbacks erhalten `runtimeSettings`, wenn der Host Modell-/Provider-/Modusdiagnosen bereitstellen kann; ältere strikte Engines werden ohne diesen Schlüssel erneut versucht. |
| `api.registerMemoryCapability(capability)` | Einheitliche Speicherfunktion                                                                                                                                                                     |
| `api.registerMemoryPromptSection(builder)` | Builder für den Speicher-Prompt-Abschnitt                                                                                                                                                          |
| `api.registerMemoryFlushPlan(resolver)`    | Resolver für den Speicher-Flush-Plan                                                                                                                                                               |
| `api.registerMemoryRuntime(runtime)`       | Adapter für die Speicher-Runtime                                                                                                                                                                   |

### Veraltete Adapter für Speicher-Embeddings

| Methode                                        | Was sie registriert                                  |
| ---------------------------------------------- | ---------------------------------------------------- |
| `api.registerMemoryEmbeddingProvider(adapter)` | Speicher-Embedding-Adapter für das aktive Plugin     |

- `registerMemoryCapability` ist die bevorzugte exklusive API für Speicher-Plugins.
- `registerMemoryCapability` kann außerdem `publicArtifacts.listArtifacts(...)`
  bereitstellen, damit begleitende Plugins exportierte Speicherartefakte über
  `openclaw/plugin-sdk/memory-host-core` nutzen können, anstatt auf das private
  Layout eines bestimmten Speicher-Plugins zuzugreifen.
- `registerMemoryPromptSection`, `registerMemoryFlushPlan` und
  `registerMemoryRuntime` sind legacy-kompatible exklusive APIs für
  Speicher-Plugins.
- `MemoryFlushPlan.model` kann den Flush-Turn auf eine exakte
  `provider/model`-Referenz wie `ollama/qwen3:8b` festlegen, ohne die aktive
  Fallback-Kette zu übernehmen.
- `registerMemoryEmbeddingProvider` ist veraltet. Neue Embedding-Provider
  sollten `api.registerEmbeddingProvider(...)` und
  `contracts.embeddingProviders` verwenden.
- Bestehende speicherspezifische Provider funktionieren während des
  Migrationszeitraums weiterhin, die Plugin-Inspektion meldet dies bei nicht
  mitgelieferten Plugins jedoch als Kompatibilitätsschuld.

### Ereignisse und Lebenszyklus

| Methode                                      | Funktion                            |
| -------------------------------------------- | ----------------------------------- |
| `api.on(hookName, handler, opts?)`           | Typisierter Lebenszyklus-Hook       |
| `api.onConversationBindingResolved(handler)` | Callback für aufgelöste Gesprächsbindung |

Beispiele, gebräuchliche Hook-Namen und Guard-Semantik finden Sie unter
[Plugin-Hooks](/de/plugins/hooks).

### Entscheidungssemantik von Hooks

`before_install` ist ein Lebenszyklus-Hook der Plugin-Runtime und nicht die
Installationsrichtlinien-Oberfläche für Operatoren. Verwenden Sie
`security.installPolicy`, wenn eine Zulassungs-/Blockierungsentscheidung sowohl
CLI- als auch Gateway-gestützte Installations- oder Aktualisierungspfade
abdecken muss.

- `before_tool_call`: Die Rückgabe von `{ block: true }` ist endgültig. Sobald ein Handler diesen Wert festlegt, werden Handler mit niedrigerer Priorität übersprungen.
- `before_tool_call`: Die Rückgabe von `{ block: false }` wird als keine Entscheidung behandelt (genau wie das Weglassen von `block`), nicht als Überschreibung.
- `before_install`: Die Rückgabe von `{ block: true }` ist endgültig. Sobald ein Handler diesen Wert festlegt, werden Handler mit niedrigerer Priorität übersprungen.
- `before_install`: Die Rückgabe von `{ block: false }` wird als keine Entscheidung behandelt (genau wie das Weglassen von `block`), nicht als Überschreibung.
- `reply_dispatch`: Die Rückgabe von `{ handled: true, ... }` ist endgültig. Sobald ein Handler den Versand übernimmt, werden Handler mit niedrigerer Priorität und der standardmäßige Modellversandpfad übersprungen.
- `message_sending`: Die Rückgabe von `{ cancel: true }` ist endgültig. Sobald ein Handler diesen Wert festlegt, werden Handler mit niedrigerer Priorität übersprungen.
- `message_sending`: Die Rückgabe von `{ cancel: false }` wird als keine Entscheidung behandelt (genau wie das Weglassen von `cancel`), nicht als Überschreibung.
- `message_received`: Verwenden Sie das typisierte Feld `threadId`, wenn Sie eingehende Threads oder Themen weiterleiten müssen. Behalten Sie `metadata` für kanalspezifische Zusatzdaten bei.
- `message_sending`: Verwenden Sie zuerst die typisierten Routingfelder `replyToId` / `threadId`, bevor Sie auf kanalspezifische `metadata` zurückgreifen.
- `gateway_start`: Verwenden Sie `ctx.config`, `ctx.workspaceDir` und `ctx.getCron?.()` für den Gateway-eigenen Startzustand, statt sich auf interne `gateway:startup`-Hooks zu verlassen. Cron wird zu diesem Zeitpunkt möglicherweise noch geladen.
- `cron_reconciled`: Erstellen Sie nach dem Start oder einem Neuladen des Schedulers eine vollständige externe Cron-Projektion neu. Sie enthält `reason` und den wirksamen Zustand `enabled`, einschließlich `enabled: false`, während `ctx.getCron?.()` den exakt abgeglichenen Scheduler zurückgibt. Übergeben Sie `ctx.abortSignal` an dauerhafte Projektionsaufgaben; das Signal bricht ab, wenn dieser Scheduler-Snapshot ersetzt oder der Gateway geschlossen wird.
- `cron_changed`: Beobachten Sie Änderungen am Gateway-eigenen Cron-Lebenszyklus. Ereignisse vom Typ `scheduled` und `removed` sind Abgleichshinweise nach dem Commit, kein geordnetes Delta-Protokoll. Bei einem geplanten Ereignis fehlt `event.nextRunAtMs`, wenn der Auftrag keine nächste Aktivierung hat; ein entferntes Ereignis enthält weiterhin den Snapshot des gelöschten Auftrags.

Externe Aktivierungs-Scheduler sollten `cron_changed`-Ereignisse entprellen oder zusammenfassen
und anschließend die vollständige dauerhafte Ansicht aus dem zuletzt durch
`cron_reconciled` erfassten Scheduler erneut lesen. Übernehmen Sie den Scheduler nicht aus
einem `cron_changed`-Kontext: Ein abgekoppelter Hinweis eines älteren Schedulers kann sich
mit einem späteren Neuladen überschneiden.

Verwenden Sie `cron_reconciled` als Auslöser für vollständige Snapshots dauerhaften Zustands, der
beim Start des Gateways oder beim Ersetzen des Schedulers geladen wird. Bei einem ausschließlich
das Plugin betreffenden Hot-Reload wird es nicht erneut wiedergegeben. Beobachtungs-Handler werden
parallel ausgeführt, und Fire-and-forget-Versandvorgänge können sich überschneiden. Daher dürfen
Verbraucher nicht von der Abschlussreihenfolge der Ereignisse abhängen.
Behalten Sie OpenClaw als maßgebliche Quelle für Fälligkeitsprüfungen und Ausführung bei.

Einen Single-Flight-Adapter mit dauerhafter Ersetzung, Wiederholungsversuchen/Backoff und sauberem
Herunterfahren finden Sie unter [Sichere externe Cron-Projektion](/de/plugins/hooks#safe-external-cron-projection).

### Felder des API-Objekts

| Feld                     | Typ                       | Beschreibung                                                                                          |
| ------------------------ | ------------------------- | ----------------------------------------------------------------------------------------------------- |
| `api.id`                 | `string`                  | Plugin-ID                                                                                             |
| `api.name`               | `string`                  | Anzeigename                                                                                           |
| `api.version`            | `string?`                 | Plugin-Version (optional)                                                                             |
| `api.description`        | `string?`                 | Plugin-Beschreibung (optional)                                                                        |
| `api.source`             | `string`                  | Quellpfad des Plugins                                                                                 |
| `api.rootDir`            | `string?`                 | Stammverzeichnis des Plugins (optional)                                                               |
| `api.config`             | `OpenClawConfig`          | Aktueller Konfigurations-Snapshot (sofern verfügbar der aktive In-Memory-Laufzeit-Snapshot)           |
| `api.pluginConfig`       | `Record<string, unknown>` | Plugin-spezifische Konfiguration aus `plugins.entries.<id>.config`                                    |
| `api.runtime`            | `PluginRuntime`           | [Laufzeit-Hilfsfunktionen](/de/plugins/sdk-runtime)                                                      |
| `api.logger`             | `PluginLogger`            | Bereichsgebundener Logger (`debug`, `info`, `warn`, `error`)                                          |
| `api.registrationMode`   | `PluginRegistrationMode`  | Aktueller Lademodus; `"setup-runtime"` ist das schlanke Start-/Einrichtungsfenster vor dem Volleintrag |
| `api.resolvePath(input)` | `(string) => string`      | Pfad relativ zum Plugin-Stammverzeichnis auflösen                                                     |

## Konvention für interne Module

Verwenden Sie innerhalb Ihres Plugins lokale Barrel-Dateien für interne Importe:

```text
my-plugin/
  api.ts            # Öffentliche Exporte für externe Verbraucher
  runtime-api.ts    # Nur interne Laufzeitexporte
  index.ts          # Einstiegspunkt des Plugins
  setup-entry.ts    # Schlanker, nur für die Einrichtung vorgesehener Einstieg (optional)
```

<Warning>
  Importieren Sie Ihr eigenes Plugin in Produktionscode niemals über
  `openclaw/plugin-sdk/<your-plugin>`. Leiten Sie interne Importe über `./api.ts`
  oder `./runtime-api.ts`. Der SDK-Pfad ist ausschließlich der externe Vertrag.
</Warning>

Öffentliche Oberflächen von über Fassaden geladenen gebündelten Plugins (`api.ts`, `runtime-api.ts`,
`index.ts`, `setup-entry.ts` und ähnliche öffentliche Einstiegsdateien) bevorzugen den
aktiven Laufzeit-Konfigurations-Snapshot, wenn OpenClaw bereits ausgeführt wird. Falls noch kein
Laufzeit-Snapshot vorhanden ist, greifen sie auf die aufgelöste Konfigurationsdatei auf dem
Datenträger zurück. Fassaden paketierter gebündelter Plugins sollten über die Plugin-
Fassadenlader von OpenClaw geladen werden; direkte Importe aus `dist/extensions/...` umgehen
die Manifest- und Laufzeit-Sidecar-Prüfungen, die paketierte Installationen für Plugin-eigenen
Code verwenden.

Provider-Plugins können ein eng begrenztes, Plugin-lokales Vertrags-Barrel bereitstellen, wenn eine
Hilfsfunktion absichtlich Provider-spezifisch ist und noch nicht in einen generischen SDK-Unterpfad
gehört. Gebündelte Beispiele:

- **Anthropic**: öffentliche `api.ts`- / `contract-api.ts`-Schnittstelle für Claude-
  Beta-Header und `service_tier`-Stream-Hilfsfunktionen.
- **`@openclaw/openai-provider`**: `api.ts` exportiert Provider-Builder,
  Hilfsfunktionen für Standardmodelle und Echtzeit-Provider-Builder.
- **`@openclaw/openrouter-provider`**: `api.ts` exportiert den Provider-Builder
  sowie Hilfsfunktionen für Onboarding und Konfiguration.

<Warning>
  Produktionscode von Erweiterungen sollte außerdem Importe aus
  `openclaw/plugin-sdk/<other-plugin>` vermeiden. Wenn eine Hilfsfunktion tatsächlich gemeinsam
  genutzt wird, verschieben Sie sie in einen neutralen SDK-Unterpfad wie
  `openclaw/plugin-sdk/speech`, `.../provider-model-shared` oder eine andere
  funktionsorientierte Oberfläche, statt zwei Plugins miteinander zu koppeln.
</Warning>

## Verwandte Themen

<CardGroup cols={2}>
  <Card title="Einstiegspunkte" icon="door-open" href="/de/plugins/sdk-entrypoints">
    Optionen für `definePluginEntry` und `defineChannelPluginEntry`.
  </Card>
  <Card title="Laufzeit-Hilfsfunktionen" icon="gears" href="/de/plugins/sdk-runtime">
    Vollständige Referenz des `api.runtime`-Namensraums.
  </Card>
  <Card title="Einrichtung und Konfiguration" icon="sliders" href="/de/plugins/sdk-setup">
    Paketierung, Manifeste und Konfigurationsschemas.
  </Card>
  <Card title="Tests" icon="vial" href="/de/plugins/sdk-testing">
    Test-Hilfsprogramme und Lint-Regeln.
  </Card>
  <Card title="SDK-Migration" icon="arrows-turn-right" href="/de/plugins/sdk-migration">
    Migration von veralteten Oberflächen.
  </Card>
  <Card title="Plugin-Interna" icon="diagram-project" href="/de/plugins/architecture">
    Detaillierte Architektur und Funktionsmodell.
  </Card>
</CardGroup>
