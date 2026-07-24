---
read_when:
    - Sie müssen wissen, aus welchem SDK-Unterpfad Sie importieren müssen.
    - Sie suchen eine Referenz für alle Registrierungsmethoden von OpenClawPluginApi
    - Sie suchen nach einem bestimmten SDK-Export.
sidebarTitle: Plugin SDK overview
summary: Import-Map, Referenz der Registrierungs-API und SDK-Architektur
title: Überblick über das Plugin SDK
x-i18n:
    generated_at: "2026-07-24T04:01:07Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 5f8e2b33e642dde7870d7402fd241d850b9490c46741b3cbf9cb18dd7d6ccf1a
    source_path: plugins/sdk-overview.md
    workflow: 16
---

Das Plugin-SDK ist der typisierte Vertrag zwischen Plugins und dem Kern. Diese Seite dient als
Referenz dafür, **was importiert werden soll** und **was registriert werden kann**.

<Note>
  Diese Seite richtet sich an Plugin-Autoren, die `openclaw/plugin-sdk/*` innerhalb von
  OpenClaw verwenden. Externe Apps, Skripte, Dashboards, CI-Aufträge und IDE-Erweiterungen,
  die Agenten über das Gateway ausführen möchten, sollten stattdessen
  [Gateway-Integrationen für externe Apps](/de/gateway/external-apps) verwenden.
</Note>

<Tip>
Suchen Sie stattdessen eine praktische Anleitung? Beginnen Sie mit [Plugins erstellen](/de/plugins/building-plugins). Verwenden Sie [Kanal-Plugins](/de/plugins/sdk-channel-plugins) für Kanäle, [Provider-Plugins](/de/plugins/sdk-provider-plugins) für Modell-Provider, [CLI-Backend-Plugins](/de/plugins/cli-backend-plugins) für lokale KI-CLI-Backends, [Agent-Harness-Plugins](/de/plugins/sdk-agent-harness) für native Agent-Ausführungsumgebungen und [Plugin-Hooks](/de/plugins/hooks) für Tool- oder Lebenszyklus-Hooks.
</Tip>

## Importkonvention

Importieren Sie immer aus einem bestimmten Unterpfad:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

Jeder Unterpfad ist ein kleines, eigenständiges Modul. Dadurch bleibt der Start schnell und
Probleme mit zirkulären Abhängigkeiten werden vermieden. Bevorzugen Sie für kanalspezifische Einstiegspunkt-/Build-Hilfsfunktionen
`openclaw/plugin-sdk/channel-core`; verwenden Sie `openclaw/plugin-sdk/core` weiterhin für
die umfassendere übergeordnete Schnittstelle und gemeinsam genutzte Hilfsfunktionen wie
`buildChannelConfigSchema`.

Veröffentlichen Sie für die Kanalkonfiguration das kanaleigene JSON-Schema über
`openclaw.plugin.json#channelConfigs`. Der Unterpfad `plugin-sdk/channel-config-schema`
ist für gemeinsam genutzte Schemaprimitiven und den generischen Builder vorgesehen. Die
mit OpenClaw gebündelten Plugins verwenden `plugin-sdk/bundled-channel-config-schema` für beibehaltene
Schemas gebündelter Kanäle. Dieser Unterpfad für gebündelte Schemas ist kein Muster für neue
Plugins.

<Warning>
  Importieren Sie keine mit Provider- oder Kanalnamen versehenen Komfortschnittstellen (zum Beispiel
  `openclaw/plugin-sdk/slack`, `.../discord`, `.../signal`, `.../whatsapp`).
  Gebündelte Plugins setzen generische SDK-Unterpfade innerhalb ihrer eigenen `api.ts`-/
  `runtime-api.ts`-Barrels zusammen; Kernnutzer sollten entweder diese Plugin-lokalen
  Barrels verwenden oder einen eng gefassten generischen SDK-Vertrag hinzufügen, wenn ein Bedarf tatsächlich
  kanalübergreifend besteht.

Ein kleiner Satz von Hilfsschnittstellen für gebündelte Plugins erscheint weiterhin in der generierten Exportzuordnung,
wenn deren Verwendung durch zuständige Komponenten nachverfolgt wird. Sie dienen ausschließlich der Wartung
gebündelter Plugins und werden nicht als Importpfade für neue Drittanbieter-
Plugins empfohlen.

`openclaw/plugin-sdk/discord` und `openclaw/plugin-sdk/telegram-account` werden
außerdem als veraltete Kompatibilitätsfassaden für nachverfolgte Nutzung durch zuständige Komponenten beibehalten. Übernehmen Sie
diese Importpfade nicht in neue Plugins; verwenden Sie stattdessen injizierte Laufzeit-Hilfsfunktionen und
generische Kanal-SDK-Unterpfade.
</Warning>

## Unterpfadreferenz

Das Plugin-SDK wird als Gruppe eng gefasster, nach Bereichen gegliederter Unterpfade bereitgestellt (Plugin-
Einstiegspunkt, Kanal, Provider, Authentifizierung, Laufzeit, Funktionalität, Speicher und reservierte
Hilfsfunktionen für gebündelte Plugins). Den vollständigen, gruppierten und verlinkten Katalog finden Sie unter
[Unterpfade des Plugin-SDK](/de/plugins/sdk-subpaths).

Das Inventar der Compiler-Einstiegspunkte befindet sich in
`scripts/lib/plugin-sdk-entrypoints.json`; typisierte öffentliche Exporte schließen die in
`scripts/lib/plugin-sdk-private-local-only-subpaths.json` aufgeführten
internen Unterpfade aus. Produktionseinstiegspunkte
auf dieser Liste behalten reine JavaScript-Exporte der Host-Laufzeit für separat
veröffentlichte offizielle Plugins bei, während reine Testeinstiegspunkte nicht exportiert werden. Führen Sie
`pnpm plugin-sdk:surface` aus, um die Anzahl der öffentlichen Exporte zu prüfen. Veraltete öffentliche
Unterpfade, die alt genug sind und nicht vom Produktionscode gebündelter Erweiterungen verwendet werden,
werden in `scripts/lib/plugin-sdk-deprecated-public-subpaths.json` nachverfolgt; umfassende
veraltete Reexport-Barrels werden in
`scripts/lib/plugin-sdk-deprecated-barrel-subpaths.json` nachverfolgt.

## Registrierungs-API

Der Callback `register(api)` erhält ein `OpenClawPluginApi`-Objekt mit diesen
Methoden:

Plugins, die für eine Sitzung eine externe Teamchat-Oberfläche bereitstellen, können
den einzelnen, prozessweit gültigen Provider registrieren, der von
`openclaw/plugin-sdk/session-discussion` exportiert wird. Seine Methode `info({ sessionKey })`
meldet, ob eine Diskussion nicht verfügbar, zum Öffnen bereit oder bereits geöffnet ist;
`open({ sessionKey })` erstellt oder ermittelt die Diskussion und gibt ihre Einbettungs-
und externen URLs zurück. Durch die Registrierung eines anderen Providers wird der aktuelle Provider ersetzt.

### Registrierung von Funktionalitäten

| Methode                                          | Was sie registriert                                                                                                                        |
| ------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerProvider(...)`                      | Textinferenz (LLM)                                                                                                                         |
| `api.registerWorkerProvider(...)`                | Lebenszyklus-Leases für Cloud-Worker                                                                                                       |
| `api.registerModelCatalogProvider(...)`          | Modellkatalogzeilen für Text- und Mediengenerierung                                                                                        |
| `api.registerAgentHarness(...)`                  | [Experimenteller](/de/plugins/sdk-agent-harness) nativer Agent-Ausführer (Codex, Copilot)                                                     |
| `api.registerCliBackend(...)`                    | Lokales CLI-Inferenz-Backend                                                                                                               |
| `api.registerChannel(...)`                       | Nachrichtenkanal                                                                                                                           |
| `api.registerEmbeddingProvider(...)`             | Wiederverwendbarer Provider für Vektoreinbettungen                                                                                         |
| `api.registerSpeechProvider(...)`                | Text-to-Speech-/STT-Synthese                                                                                                               |
| `api.registerRealtimeTranscriptionProvider(...)` | Echtzeit-Streaming-Transkription                                                                                                           |
| `api.registerRealtimeVoiceProvider(...)`         | Bidirektionale Echtzeit-Sprachsitzungen                                                                                                    |
| `api.registerMediaUnderstandingProvider(...)`    | Bild-/Audio-/Videoanalyse                                                                                                                  |
| `api.registerTranscriptSourceProvider(...)`      | Quelle für Live- oder importierte Besprechungstranskripte; Besprechungs-Plugins können `createMeetingTranscriptSourceProvider` aus `plugin-sdk/transcripts` verwenden |
| `api.registerImageGenerationProvider(...)`       | Bildgenerierung                                                                                                                            |
| `api.registerMusicGenerationProvider(...)`       | Musikgenerierung                                                                                                                           |
| `api.registerVideoGenerationProvider(...)`       | Videogenerierung                                                                                                                           |
| `api.registerWebFetchProvider(...)`              | Provider zum Abrufen/Extrahieren von Webinhalten                                                                                           |
| `api.registerWebSearchProvider(...)`             | Websuche                                                                                                                                   |
| `api.registerCompactionProvider(...)`            | Austauschbares Backend für Transcript-Compaction                                                                                           |

Worker-Provider müssen ihre ID außerdem in `contracts.workerProviders` deklarieren.
Der Kern persistiert die dauerhafte Absicht vor `provision(profile, operationId)`. Provider validieren Einstellungen vor der externen Zuweisung und lösen bei einer dauerhaften Ablehnung des Profils `WorkerProviderError` aus. `provision` muss dasselbe Lease übernehmen, wenn sich die Vorgangs-ID wiederholt.
Der Kern persistiert die validierten Profileinstellungen zusammen mit dem Lease und stellt diesen Snapshot `destroy({ leaseId, profile })`, das idempotent sein muss, sowie `inspect({ leaseId, profile })` bereit, das `active`, `destroyed` oder `unknown` zurückgibt. Dadurch können Provider Lebenszyklusaufrufe nach einem Neustart des Gateways oder dem Entfernen eines benannten Profils weiterleiten. SSH-Endpunkte verwenden einen `SecretRef` für `keyRef`, niemals direkt eingebettetes Schlüsselmaterial, und enthalten einen `hostKey` aus vertrauenswürdiger Bereitstellungsausgabe exakt als `algorithm base64`, ohne Hostnamen oder Kommentar. Der Kern fixiert `hostKey` und vertraut niemals einem Schlüssel aus der ersten Verbindung. Ein Provider, der einen dynamischen `keyRef` erzeugt, kann `resolveSshIdentity({ leaseId, profile, keyRef })` implementieren; wenn dieser vorhanden ist, ist dieser Resolver maßgeblich, während Provider ohne ihn den konfigurierten generischen Secret-Resolver verwenden.
Provider mit erneuerbaren Leases können außerdem `renew(leaseId)` implementieren.
`inspect` muss bei vorübergehenden oder unbestimmten Fehlern eine Ausnahme auslösen; `unknown` darf nur bei verbindlich festgestelltem Fehlen zurückgegeben werden. Der Kern markiert einen aktiven lokalen Datensatz als verwaist oder behandelt das Fehlen nach einer persistierten Löschanforderung als Abschluss des Abbaus.

Mit `api.registerEmbeddingProvider(...)` registrierte Einbettungs-Provider müssen
außerdem im Plugin-Manifest unter `contracts.embeddingProviders` aufgeführt sein. Dies
ist die generische Einbettungsschnittstelle für wiederverwendbare Vektorgenerierung. Die Speichersuche
kann diese generische Provider-Schnittstelle verwenden. Die ältere Schnittstelle aus
`api.registerMemoryEmbeddingProvider(...)` und
`contracts.memoryEmbeddingProviders` dient als veraltete Kompatibilität, während
bestehende speicherspezifische Provider migriert werden.

Speicherspezifische Provider, die weiterhin ein Laufzeitobjekt `batchEmbed(...)` bereitstellen, verbleiben beim
bestehenden dateiweisen Batching-Vertrag, sofern ihre Laufzeit nicht ausdrücklich
`sourceWideBatchEmbed: true` setzt. Diese Aktivierung ermöglicht es dem Speicher-Host, Chunks aus
mehreren geänderten Speicherdateien und aktivierten Quellen in einem Aufruf von `batchEmbed(...)` bis
zu den Batch-Limits des Hosts zu übermitteln. Batch-Adapter, die JSONL-Anforderungsdateien hochladen, müssen
Provider-Aufträge sowohl vor Erreichen ihres Upload-Größenlimits als auch vor ihrem Limit für die Anzahl
der Anforderungen aufteilen. Der Provider muss für jeden Eingabe-Chunk genau eine Einbettung in derselben Reihenfolge wie
`batch.chunks` zurückgeben; lassen Sie das Flag weg, wenn der Provider dateilokale Batches erwartet oder
die Eingabereihenfolge über einen größeren quellübergreifenden Auftrag hinweg nicht beibehalten kann.

### Tools und Befehle

Verwenden Sie [`defineToolPlugin`](/de/plugins/tool-plugins) für einfache reine Tool-Plugins
mit festen Tool-Namen. Verwenden Sie `api.registerTool(...)` direkt für gemischte Plugins
oder vollständig dynamische Tool-Registrierung.

| Methode                                | Was sie registriert                                                                                                                       |
| -------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerTool(tool, opts?)`        | Agent-Tool (erforderlich oder `{ optional: true }`)                                                                                         |
| `api.registerCommand(def)`             | Benutzerdefinierter Befehl (umgeht das LLM)                                                                                               |
| `api.registerNodeHostCommand(command)` | Von `openclaw node run` verarbeiteter Befehl; optionale `agentTool`-Metadaten können ihn bei verbundenem Node als für den Agenten sichtbares Tool bereitstellen |

Plugin-Befehle können `agentPromptGuidance` setzen, wenn der Agent einen kurzen,
befehlseigenen Routing-Hinweis benötigt. Beschränken Sie diesen Text auf den Befehl selbst; fügen Sie
den Prompt-Buildern des Kerns keine Provider- oder Plugin-spezifischen Richtlinien hinzu.

Hinweiseinträge können veraltete Zeichenfolgen sein, die für jede Prompt-Oberfläche gelten, oder
strukturierte Einträge:

```ts
agentPromptGuidance: [
  "Globaler Befehlshinweis.",
  { text: "Dies nur im OpenClaw-Haupt-Prompt anzeigen.", surfaces: ["openclaw_main"] },
];
```

Strukturiertes `surfaces` kann `openclaw_main`, `codex_app_server`,
`cli_backend`, `acp_backend` oder `subagent` enthalten. `pi_main` bleibt ein veralteter Alias
für `openclaw_main`. Lassen Sie `surfaces` für bewusst oberflächenübergreifende Anweisungen weg. Übergeben
Sie kein leeres `surfaces`-Array; es wird abgelehnt, damit ein versehentlicher Verlust des Geltungsbereichs
nicht zu globalem Prompt-Text führt.

Native Codex-App-Server-Entwickleranweisungen sind strenger als andere Prompt-
Oberflächen: Nur Anweisungen, deren Geltungsbereich ausdrücklich auf `codex_app_server` beschränkt ist, werden in
diesen höher priorisierten Bereich übernommen. Veraltete Zeichenfolgenanweisungen und strukturierte Anweisungen
ohne Geltungsbereich bleiben aus Kompatibilitätsgründen für Nicht-Codex-Prompt-Oberflächen verfügbar.

Node-Host-Befehle werden auf dem verbundenen Node-Host ausgeführt, nicht innerhalb des Gateway-
Prozesses. Wenn `agentTool` vorhanden ist, veröffentlicht der Node nach einer
erfolgreichen Gateway-Verbindung einen Deskriptor; das Gateway stellt ihn Agent-Ausführungen nur bereit, solange dieser
Node verbunden ist und nur, wenn `command` des Deskriptors zur
genehmigten Befehlsoberfläche des Nodes gehört. Setzen Sie `agentTool.defaultPlatforms`, um einen
ungefährlichen Befehl in die standardmäßige Node-Befehls-Zulassungsliste aufzunehmen; andernfalls ist
ein ausdrückliches `gateway.nodes.commands.allow` oder eine Node-Aufrufrichtlinie erforderlich. `agentTool.name`
muss Provider-sicher sein: Es muss mit einem Buchstaben beginnen, darf nur Buchstaben, Ziffern,
Unterstriche oder Bindestriche verwenden und höchstens 64 Zeichen lang sein. MCP-gestützte Node-Tools
können `agentTool.mcp`-Metadaten festlegen, damit Katalog- und Tool-Suchoberflächen
die Identität des entfernten MCP-Servers/-Tools anzeigen können; die Ausführung erfolgt jedoch weiterhin über den
angekündigten Node-Befehl.

### Infrastruktur

| Methode                                         | Was sie registriert                                                       |
| ----------------------------------------------- | ------------------------------------------------------------------------- |
| `api.registerHook(events, handler, opts?)`      | Ereignis-Hook                                                             |
| `api.registerHttpRoute(params)`                 | Gateway-HTTP-Endpunkt                                                     |
| `api.registerGatewayMethod(name, handler)`      | Gateway-RPC-Methode                                                       |
| `api.registerGatewayDiscoveryService(service)`  | Ankündigungsdienst für die lokale Gateway-Erkennung                       |
| `api.registerCli(registrar, opts?)`             | CLI-Unterbefehl                                                           |
| `api.registerNodeCliFeature(registrar, opts?)`  | CLI für Node-Funktionen unter `openclaw nodes`                           |
| `api.registerService(service)`                  | Hintergrunddienst                                                        |
| `api.registerInteractiveHandler(registration)`  | Interaktiver Handler                                                      |
| `api.registerAgentToolResultMiddleware(...)`    | Laufzeit-Middleware für Tool-Ergebnisse                                   |
| `api.registerMemoryPromptSupplement(builder)`   | Additiver, speicherbezogener Prompt-Abschnitt                             |
| `api.registerMemoryPromptPreparation(prepare)`  | Asynchrone Vorbereitung eines speicherbezogenen Prompt-Abschnitts         |
| `api.registerMemoryCorpusSupplement(adapter)`   | Additiver Korpus für Speichersuche/-lesen                                 |
| `api.registerHostedMediaResolver(resolver)`     | Resolver für browserartige URLs gehosteter Medien                         |
| `api.registerMcpServerConnectionResolver(...)`  | Anfordererspezifischer MCP-Transport (`url`/`headers`) für einen statischen Servernamen |
| `api.registerTextTransforms(transforms)`        | Plugin-eigene Kompatibilitätsumschreibungen für Prompt-/Nachrichtentext   |
| `api.registerConfigMigration(migrate)`          | Leichtgewichtige Konfigurationsmigration vor dem Laden der Plugin-Laufzeit |
| `api.registerMigrationProvider(provider)`       | Importprogramm für `openclaw migrate`                                     |
| `api.registerAutoEnableProbe(probe)`            | Konfigurationsprüfung, die dieses Plugin automatisch aktivieren kann      |
| `api.registerReload(registration)`              | Richtlinie für Konfigurationspräfixe zur Behandlung von Neustart/Hot-Reload/keiner Aktion |
| `api.registerNodeHostCommand(command)`          | Befehlshandler, der gekoppelten Nodes bereitgestellt wird                 |
| `api.registerNodeInvokePolicy(policy)`          | Zulassungslisten-/Genehmigungsrichtlinie für von Nodes aufgerufene Befehle |
| `api.registerSecurityAuditCollector(collector)` | Befundsammler für `openclaw security audit`                                      |

#### Webhook-Arbeit nach der Bestätigung

Webhook-Routen, die eine Anfrage bestätigen, bevor die Verarbeitung abgeschlossen ist, müssen
diese abgekoppelte Arbeit in einen eigenen nachverfolgten Zulassungsstamm verschieben:

```typescript
import { runDetachedWebhookWork } from "openclaw/plugin-sdk/webhook-request-guards";

void runDetachedWebhookWork(() => processWebhookEvent(event)).catch((error) => {
  runtime.error?.(`Webhook-Versand fehlgeschlagen: ${String(error)}`);
});
```

Rufen Sie `runDetachedWebhookWork(...)` synchron auf, während die HTTP-Anfrage noch
zugelassen ist. Der Helfer reserviert sofort einen unabhängigen Stamm und startet dann den
Callback im nächsten Microtask, damit der Anfrage-Handler zuerst seine
Bestätigung schreiben kann. Das zurückgegebene Promise übernimmt das Callback-Ergebnis; die Aufrufer
bleiben für die Behandlung von Ablehnungen verantwortlich. Dadurch wird Arbeit in der Warteschlange nach der Bestätigung weiterhin angenommen und
Neustart- oder Aussetzungsleerungen warten darauf. Handler, die vor der Rückkehr die gesamte Verarbeitung
abwarten, benötigen diesen Helfer nicht.

#### Anfordererspezifische MCP-Verbindungen

Halten Sie die **Identität** des MCP-Servers (Name, Tool-Filter) in `mcp.servers` oder einem
Bundle-Manifest statisch. Optional können Sie einen Verbindungs-Resolver registrieren, damit jeder vertrauenswürdige
Nachrichtenanforderer einen eigenen Transport erhält:

```ts
api.registerMcpServerConnectionResolver({
  serverName: "user-email",
  resolve: async (ctx) => {
    // ctx.requesterSenderId wird vom Host als vertrauenswürdig eingestuft; erfinden Sie hier niemals eine Absenderidentität.
    const token = await lookupUserToken(ctx.requesterSenderId);
    if (!token) {
      return null; // diesen Server für die aktuelle Ausführung weglassen
    }
    return {
      url: "https://mcp.example.com/email",
      headers: { Authorization: `Bearer ${token}` },
    };
  },
});
```

Vertragshinweise:

- Der Resolver-Kontext enthält ausschließlich eine vertrauenswürdige Host-Identität (`requesterSenderId`,
  optional `agentAccountId` / `messageChannel`). Zukünftige vertrauenswürdige Felder (zum
  Beispiel Cron-/Subagent-Benutzerkontext) können additiv hinzugefügt werden.
- Ein Plugin besitzt genau einen Servernamen: Ein doppeltes
  `registerMcpServerConnectionResolver` für dasselbe `serverName` aus einem anderen
  Plugin wird mit einer Fehlerdiagnose abgelehnt (die erste Registrierung hat Vorrang), sodass
  die Zuständigkeit für die Verbindung niemals von der Ladereihenfolge der Plugins abhängt.
- Tool-Namen werden aus der vollständigen Menge deklarierter Server abgeleitet, sodass eine partielle Auflösung
  sichere Servernamen niemals zwischen Anforderern oder Durchläufen verändert. Der Core überprüft nicht,
  ob unterschiedliche Anforderer-Endpunkte identische Tool-Schemas bereitstellen; ein
  Resolver muss jeden Anforderer auf denselben logischen Dienst verweisen, andernfalls
  unterscheiden sich Tool-Schemas (und die Stabilität des Prompt-Caches) je nach Anforderer.
- Ausführungen ohne vertrauenswürdiges `requesterSenderId` (Cron, Subagent, Heartbeat, öffentliches
  Gateway) materialisieren niemals anfordererspezifische Server. Es gibt keine gemeinsam genutzte
  Fallback-Verbindung.
- `resolve` ist auf 10 Sekunden pro Server begrenzt; bei einer Zeitüberschreitung oder Ausnahme wird dieser
  Server für die Ausführung weggelassen, ohne dass statisches MCP fehlschlägt.
- Aufgelöste Verbindungen werden höchstens alle 5 Minuten je Anforderer erneut validiert:
  Bei einer Rotation wird der Transport mit neuen Anmeldedaten neu aufgebaut, und ein `null`-Ergebnis
  widerruft ihn (die zwischengespeicherte Laufzeit wird selbst mitten in einer Sitzung verworfen). Widerrufene oder
  rotierte Anmeldedaten können daher bis zu 5 Minuten lang weiterverwendet werden.
- Aufgelöste `headers` werden niemals protokolliert oder dauerhaft gespeichert; der Core hält nur einen flüchtigen,
  schlüsselbasierten In-Memory-Digest (prozesslokaler HMAC) vor, um eine Rotation der Anmeldedaten zu erkennen, und
  registriert aufgelöste Anmeldedatenwerte aus Headern/URLs in der Schwärzungsregistrierung
  für Protokolle und Debug-Erfassungen.
- Anfordererspezifische Server erzeugen keine MCP-App-Ansichten: Eine Ansicht überdauert die
  vom Anforderer authentifizierte Ausführung, und die Grenze der Gateway-Ansicht verfügt über keine Anfordereridentität;
  daher bleiben App-Vorschauen für diese Server standardmäßig geschlossen. Tool-Ergebnisse
  sind davon nicht betroffen.
- Statische Server ohne Resolver behalten den bestehenden sitzungsbezogenen Lebenszyklus bei.
- **Bereitstellungsregel des Harness:** Anfordererspezifische Server werden niemals in die native
  MCP-Client-Konfiguration des Harness aufgenommen (Codex-Thread `mcp_servers`, CLI `-c mcp_servers=…` oder eine
  andere sitzungsübergreifend gemeinsam genutzte MCP-Projektion). Harnesses stellen sie stattdessen als ausführungsbezogene
  Tools bereit:
  - Eingebetteter Runner: Sitzungs-MCP-Laufzeit + Bundle-Tools (statisch + anfordererspezifisch).
  - Codex-App-Server: dynamische Tools über
    `materializeRequesterScopedMcpToolsForHarnessRun` (nur anfordererspezifisch; statische
    Server verbleiben im nativen MCP-Client von Codex).
- Anfordererspezifische Tool-**Spezifikationen** sind nach der ersten erfolgreichen Auflösung in
  dieser Sitzung sitzungsstabil, sodass Harnesses mit gemeinsam genutzten Threads (Codex) bei
  einem Absenderwechsel keine Threads rotieren. Bevor eine Auflösung für einen Anforderer erfolgt, werden keine anfordererspezifischen Spezifikationen angekündigt.
- Nicht authentifizierte Anforderer in einem Harness mit gemeinsam genutztem Thread sehen weiterhin die angekündigten
  anfordererspezifischen Tools; der Aufruf eines solchen Tools gibt für diesen Anforderer einen sauberen Tool-Fehler wegen fehlender Verbindung zurück.
  OpenClaw greift niemals auf die Anmeldedaten eines anderen Anforderers zurück.

Builder für Ergänzungen des Speicher-Prompts erhalten optional den Kontext `agentId`,
`agentSessionKey` und `sandboxed`. Aufrufe von `search`
und `get` für Ergänzungen des Speicherkorpus erhalten optional den Kontext `agentId` und `sandboxed`. Plugins mit
Agent-eigenem Speicher sollten diesen Speicher für jeden Aufruf auflösen, statt
bei der Registrierung einen einzigen globalen Pfad zu erfassen. Wenn eine Agent-ID erforderlich ist, aber
in einem Multi-Agent-Vorgang fehlt, muss der Vorgang standardmäßig geschlossen fehlschlagen, statt einen
beliebigen Agent auszuwählen.

Verwenden Sie `registerMemoryPromptPreparation(...)`, wenn Prompt-Text vom asynchronen
Plugin-Zustand abhängt. Der Callback wird einmal vor jedem vollständigen Agent-Prompt ausgeführt und erhält
denselben Tool-, Agent-, Sitzungs- und Sandbox-Kontext wie synchrone Builder für Speicher-Prompts.
Validieren Sie die aktuelle Instanz des Speicherverantwortlichen, bevor Sie den dauerhaft gespeicherten
Zustand laden, und geben Sie anschließend nur Zeilen für diese Ausführung zurück. OpenClaw fixiert diese Zeilen und
übergibt das unveränderliche Ergebnis an die synchrone Prompt-Zusammenstellung. Belassen Sie Persistenz,
atomaren Austausch und Löschung beim Entfernen des Verantwortlichen im zuständigen Plugin; führen Sie in einem Prompt-Builder keine
Abfragen oder Dateilesevorgänge durch.

Interaktive Telegram-Handler können `{ submitText }` zurückgeben, um Text nach
erfolgreicher Ausführung des Handlers über den normalen eingehenden Agent-Pfad von Telegram weiterzuleiten. OpenClaw behält
die Callback-Schaltfläche bei, wenn die Richtlinie für eingehende Nachrichten den Text überspringt oder die Verarbeitung fehlschlägt, sodass
Benutzer den Vorgang wiederholen können, nachdem sich die blockierende Bedingung geändert hat. Dieses Ergebnisfeld ist
Telegram-spezifisch; andere Kanäle behalten ihre eigenen Verträge für interaktive Ergebnisse bei.

### Host-Hooks für Workflow-Plugins

Host-Hooks sind die SDK-Schnittstellen für Plugins, die am Host-
Lebenszyklus teilnehmen müssen, statt nur einen Provider, Kanal oder ein Tool hinzuzufügen. Es handelt sich um
generische Verträge; der Planungsmodus kann sie verwenden, ebenso jedoch Genehmigungsworkflows,
Arbeitsbereichs-Richtlinienprüfungen, Hintergrundüberwachungen, Einrichtungsassistenten und begleitende UI-
Plugins.

| Methode                                                                               | Zugehöriger Vertrag                                                                                                                                        |
| ------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.session.state.registerSessionExtension(...)`                                    | Plugin-eigener, JSON-kompatibler Sitzungsstatus, der über Gateway-Sitzungen projiziert wird                                                                 |
| `api.session.workflow.enqueueNextTurnInjection(...)`                                 | Dauerhafter Exactly-once-Kontext, der für eine Sitzung in den nächsten Agent-Durchlauf eingefügt wird                                                       |
| `api.registerTrustedToolPolicy(...)`                                                 | Durch das Manifest gesteuerte, vertrauenswürdige Tool-Richtlinie vor der Plugin-Ausführung, die Tool-Parameter blockieren oder umschreiben kann             |
| `api.registerToolMetadata(...)`                                                      | Anzeigemetadaten des Tool-Katalogs, ohne die Tool-Implementierung zu ändern                                                                                 |
| `api.registerCommand(...)`                                                           | Bereichsgebundene Plugin-Befehle; Befehlsergebnisse können `continueAgent: true` oder `suppressReply: true` setzen; native Discord-Befehle unterstützen `descriptionLocalizations` |
| `api.session.controls.registerControlUiDescriptor(...)`                              | Beitragsdeskriptoren für die Control UI auf Sitzungs-, Tool-, Ausführungs-, Einstellungs- oder Registerkartenoberflächen                                    |
| `api.lifecycle.registerRuntimeLifecycle(...)`                                        | Bereinigungs-Callbacks für Plugin-eigene Laufzeitressourcen in Pfaden zum Zurücksetzen, Löschen oder Neuladen                                               |
| `api.agent.events.registerAgentEventSubscription(...)`                               | Bereinigte Ereignisabonnements für Workflow-Status und Überwachungen                                                                                        |
| `api.runContext.setRunContext(...)` / `getRunContext(...)` / `clearRunContext(...)`  | Temporärer Plugin-Status pro Ausführung, der beim terminalen Ausführungslebenszyklus gelöscht wird                                                         |
| `api.session.workflow.registerSessionSchedulerJob(...)`                              | Bereinigungsmetadaten für Plugin-eigene Scheduler-Aufträge; plant keine Arbeit und erstellt keine Aufgabendatensätze                                       |
| `api.session.workflow.sendSessionAttachment(...)`                                    | Nur für gebündelte Plugins verfügbare, vom Host vermittelte Zustellung von Dateianhängen an die aktive direkte ausgehende Sitzungsroute                     |
| `api.session.workflow.scheduleSessionTurn(...)` / `unscheduleSessionTurnsByTag(...)` | Nur für gebündelte Plugins verfügbare, Cron-gestützte geplante Sitzungsdurchläufe sowie Tag-basierte Bereinigung                                            |
| `api.session.controls.registerSessionAction(...)`                                    | Typisierte Sitzungsaktionen, die Clients über das Gateway auslösen können                                                                                  |

Ein `surface: "tab"`-Deskriptor fügt der Control UI eine Seitenleisten-Registerkarte hinzu. Die Registerkarten-Deskriptoren aktiver
Plugins werden Dashboard-Clients in der Gateway-Begrüßung
(`controlUiTabs`) angekündigt, sodass die Registerkarte nur angezeigt wird, solange das Plugin aktiviert ist.
Gebündelte Plugins können eine erstklassige Dashboard-Ansicht für ihre Registerkarte bereitstellen; andere
Plugins können `path` auf eine Plugin-HTTP-Route setzen (siehe
`api.registerHttpRoute(...)`), die das Dashboard in einem Sandbox-Frame darstellt.
`icon` ist ein Hinweis auf den Namen eines Dashboard-Symbols, `group` wählt den Seitenleistenabschnitt
(`control` oder `agent`), `order` legt die Reihenfolge unter den Plugin-Registerkarten fest und `requiredScopes`
blendet die Registerkarte für Verbindungen aus, denen diese Operator-Berechtigungsbereiche fehlen:

Registrieren Sie für eine Gateway-geschützte externe Registerkarte den Deskriptor `path` unter einer
HTTP-Route `auth: "gateway"` desselben Plugins. Nach dem authentifizierten Bootstrap erhält der Browser eine
kurzlebige, auf dieses Plugin und den Routenstamm beschränkte HttpOnly-Berechtigung, damit der
Sandbox-Frame geladen werden kann, ohne das Gateway-Bearer-Token in seine URL
oder sein JavaScript zu kopieren. Das authentifizierte übergeordnete Element erneuert die Berechtigung, während die externe Registerkarte
aktiv ist und bevor sie nach einer Navigation oder der Fortsetzung des Browsers eingebunden wird. Außerdem
prüft es die Berechtigung aus derselben undurchsichtigen Sandbox, bevor sie eingebunden wird, sodass Browser-
Datenschutzmodi, die das Cookie blockieren, sicher geschlossen mit einem nicht verfügbaren Panel fehlschlagen.
Die Frame-Berechtigung akzeptiert nur `GET` und `HEAD` und enthält immer
`operator.read`; `requiredScopes` steuert die Sichtbarkeit der Registerkarte, erweitert jedoch niemals die
Cookie-Berechtigung. Mutationen verbleiben auf explizit per Gateway authentifizierten übergeordneten oder
Bearer-Oberflächen. Externe Registerkarten erfordern HTTPS/Tailscale Serve oder einen
vom Browser als vertrauenswürdig eingestuften Loopback-Ursprung; unverschlüsseltes HTTP auf einem LAN-Host zeigt den
Fehler für den sicheren Kontext an, statt ein Panel einzubinden, das sich nicht authentifizieren kann.
Auch eine vollständige Blockierung von Drittanbieter-Cookies macht Gateway-geschützte Registerkarten nicht verfügbar.
Wie bei allen nativen Plugin-Oberflächen verbleibt der Frame innerhalb der Vertrauensgrenze des installierten
Plugins; OpenClaw behandelt installierte Plugins nicht als gegenseitig
isolierte Browser-Sicherheitsprinzipale.
Cookie-Berechtigungen verwenden die Hostnamengrenze des Browsers, nicht dessen Portgrenze. Betreiben
Sie keine gegenseitig nicht vertrauenswürdigen Dienste gemeinsam unter dem Gateway-Hostnamen, auch nicht auf anderen
Ports.
Registerkarten mit Plugin-verwalteter Authentifizierung behalten ihr direktes iframe-Verhalten bei und
fordern oder benötigen diese Gateway-Berechtigung nicht.

```typescript
api.session.controls.registerControlUiDescriptor({
  surface: "tab",
  id: "logbook",
  label: "Tagebuch",
  description: "Ihr Tag als Zeitleiste, erstellt aus Bildschirm-Schnappschüssen.",
  icon: "sun",
  group: "control",
  requiredScopes: ["operator.write"],
});
```

Verwenden Sie für neuen Plugin-Code die gruppierten Namespaces:

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
Aliase für bestehende Plugins verfügbar. Fügen Sie keinen neuen Plugin-Code hinzu, der
`api.registerSessionExtension`, `api.enqueueNextTurnInjection`,
`api.registerControlUiDescriptor`, `api.registerRuntimeLifecycle`,
`api.registerAgentEventSubscription`, `api.emitAgentEvent`,
`api.setRunContext`, `api.getRunContext`, `api.clearRunContext`,
`api.registerSessionSchedulerJob`, `api.registerSessionAction`,
`api.sendSessionAttachment`, `api.scheduleSessionTurn` oder
`api.unscheduleSessionTurnsByTag` direkt aufruft.

`scheduleSessionTurn(...)` ist eine sitzungsbezogene Komfortfunktion über dem Gateway-
Cron-Scheduler. Cron ist für die zeitliche Steuerung zuständig und erstellt den Hintergrundaufgabendatensatz, wenn der
Durchlauf ausgeführt wird; das Plugin SDK beschränkt lediglich die Zielsitzung, die Plugin-eigene
Benennung und die Bereinigung. Verwenden Sie `api.runtime.tasks.managedFlows` innerhalb des geplanten
Durchlaufs, wenn die Arbeit selbst einen dauerhaften mehrstufigen Task-Flow-Status benötigt.

Die Verträge trennen die Zuständigkeiten bewusst:

- Externe Plugins können Sitzungserweiterungen, UI-Deskriptoren, Befehle, Tool-
  Metadaten, Einfügungen für den nächsten Durchlauf und normale Hooks verwalten.
- Vertrauenswürdige Tool-Richtlinien werden vor gewöhnlichen `before_tool_call`-Hooks ausgeführt und genießen
  das Vertrauen des Hosts. Gebündelte Richtlinien werden zuerst ausgeführt; Richtlinien installierter Plugins erfordern
  eine explizite Aktivierung sowie ihre lokalen IDs in
  `contracts.trustedToolPolicies` und werden anschließend in der Plugin-Ladereihenfolge ausgeführt. Richtlinien-IDs
  sind auf das registrierende Plugin beschränkt.
- Der Besitz reservierter Befehle ist ausschließlich gebündelten Plugins vorbehalten. Externe Plugins sollten ihre
  eigenen Befehlsnamen oder Aliase verwenden.
- `allowPromptInjection=false` deaktiviert Prompt-verändernde Hooks einschließlich
  `agent_turn_prepare`, `before_prompt_build`, `heartbeat_prompt_contribution`
  und `enqueueNextTurnInjection`.

Beispiele für Nicht-Plan-Nutzer:

| Plugin-Archetyp               | Verwendete Hooks                                                                                                                        |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Genehmigungs-Workflow        | Sitzungserweiterung, Befehlsfortsetzung, Einfügung für den nächsten Durchlauf, UI-Deskriptor                                            |
| Richtlinienprüfung für Budget/Arbeitsbereich | Vertrauenswürdige Tool-Richtlinie, Tool-Metadaten, Sitzungsprojektion                                                     |
| Hintergrund-Lebenszyklusüberwachung | Bereinigung des Laufzeitlebenszyklus, Abonnement von Agent-Ereignissen, Besitz/Bereinigung des Sitzungsschedulers, Heartbeat-Prompt-Beitrag, UI-Deskriptor |
| Einrichtungs- oder Onboarding-Assistent | Sitzungserweiterung, bereichsgebundene Befehle, Control-UI-Deskriptor                                                         |

<Note>
  Reservierte zentrale Administrator-Namespaces (`config.*`, `exec.approvals.*`, `wizard.*`,
  `update.*`) bleiben immer `operator.admin`, selbst wenn ein Plugin versucht, einen
  engeren Gateway-Methodenberechtigungsbereich zuzuweisen. Bevorzugen Sie Plugin-spezifische Präfixe für
  Plugin-eigene Methoden.
</Note>

<Accordion title="Wann Tool-Ergebnis-Middleware verwendet werden sollte">
  Gebündelte Plugins und explizit aktivierte installierte Plugins mit passenden
  Manifest-Verträgen können `api.registerAgentToolResultMiddleware(...)` verwenden, wenn
  sie ein Tool-Ergebnis nach der Ausführung und bevor die Laufzeit
  dieses Ergebnis an das Modell zurückgibt, umschreiben müssen. Dies ist die vertrauenswürdige, laufzeitneutrale
  Schnittstelle für asynchrone Ausgabereduzierer wie tokenjuice.

Plugins müssen `contracts.agentToolResultMiddleware` für jede betreffende
Laufzeit deklarieren, beispielsweise `["openclaw", "codex"]`. Installierte Plugins ohne diesen
Vertrag oder ohne explizite Aktivierung können diese Middleware nicht registrieren; verwenden Sie
normale OpenClaw-Plugin-Hooks für Arbeit, die keine Tool-Ergebnis-Verarbeitung
vor dem Modell benötigt. Der alte,
nur für eingebettete Runner bestimmte Registrierungspfad für Erweiterungs-Factorys wurde entfernt.
</Accordion>

### Registrierung der Gateway-Erkennung

`api.registerGatewayDiscoveryService(...)` ermöglicht einem Plugin, das aktive
Gateway über einen lokalen Erkennungstransport wie mDNS/Bonjour anzukündigen. OpenClaw ruft den
Dienst während des Gateway-Starts auf, wenn die lokale Erkennung aktiviert ist, übergibt die
aktuellen Gateway-Ports sowie nicht geheime TXT-Hinweisdaten und ruft den zurückgegebenen
`stop`-Handler beim Herunterfahren des Gateways auf.

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

Plugins zur Gateway-Erkennung dürfen angekündigte TXT-Werte nicht als Geheimnisse oder
Authentifizierung behandeln. Die Erkennung ist ein Routing-Hinweis; die Gateway-Authentifizierung und TLS-Pinning bleiben
für das Vertrauen zuständig.

### CLI-Registrierungsmetadaten

`api.registerCli(registrar, opts?)` akzeptiert zwei Arten von Befehlsmetadaten:

- `commands`: explizite Befehlsnamen im Besitz des Registrierenden
- `descriptors`: Befehlsdeskriptoren für die Analysephase, die für CLI-Hilfe,
  Routing und verzögerte Plugin-CLI-Registrierung verwendet werden
- `parentPath`: optionaler übergeordneter Befehlspfad für verschachtelte Befehlsgruppen, beispielsweise
  `["nodes"]`

Bevorzugen Sie für Funktionen gekoppelter Nodes
`api.registerNodeCliFeature(registrar, opts?)`. Dies ist ein kleiner Wrapper um
`api.registerCli(..., { parentPath: ["nodes"] })` und kennzeichnet Befehle wie
`openclaw nodes canvas` explizit als Plugin-eigene Node-Funktionen.

Wenn ein Plugin-Befehl im normalen Stamm-CLI-Pfad verzögert geladen bleiben soll,
geben Sie `descriptors` an, die jeden von diesem
Registrierenden bereitgestellten Stamm eines Befehls auf oberster Ebene abdecken.

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

Verschachtelte Befehle erhalten den aufgelösten übergeordneten Befehl als `program`:

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
        description: "Capture or render canvas content from a paired node",
        hasSubcommands: true,
      },
    ],
  },
);
```

Verwenden Sie `commands` nur dann allein, wenn Sie keine verzögerte Registrierung der Root-CLI benötigen.
Dieser vorgezogene Kompatibilitätspfad wird weiterhin unterstützt, installiert jedoch keine
deskriptorbasierten Platzhalter für verzögertes Laden während des Parsens.

### Registrierung des CLI-Backends

Mit `api.registerCliBackend(...)` kann ein Plugin die Standardkonfiguration für ein lokales
KI-CLI-Backend wie `claude-cli` oder `my-cli` bereitstellen.

- Die Backend-`id` wird zum Provider-Präfix in Modellreferenzen wie `my-cli/gpt-5`.
- Die Backend-`config` ist der maßgebliche Befehlsadapter: Verhalten für argv, Umgebung,
  Parser, Sitzung, Bilder und Zuverlässigkeit befindet sich im Plugin-Code.
- Benutzer wählen das Backend über Modellreferenzen oder modellbezogenes `agentRuntime.id` aus;
  `openclaw.json` schreibt den Adapter nicht um.
- Verwenden Sie `normalizeConfig`, wenn registrierte statische Felder einen laufzeitabhängigen
  Normalisierungsdurchlauf benötigen.
- Verwenden Sie `resolveExecutionArgs` für anfragebezogene argv-Umschreibungen, die zum
  CLI-Dialekt gehören, beispielsweise die Zuordnung von OpenClaw-Denkstufen zu einem nativen Aufwands-
  Flag. Der Hook erhält `ctx.executionMode`; verwenden Sie `"side-question"`, um
  Backend-native Isolations-Flags für kurzlebige `/btw`-Aufrufe hinzuzufügen. Wenn diese Flags
  native Tools für eine ansonsten dauerhaft aktive CLI zuverlässig deaktivieren,
  deklarieren Sie außerdem `sideQuestionToolMode: "disabled"`.
- Verwenden Sie `prepareExecution` für eine Backend-eigene Startumgebung oder temporäre
  Authentifizierungs-/Konfigurationsbrücken. Das zugehörige `ctx.contextTokenBudget` ist das effektive Token-
  Limit, das für den Lauf ausgewählt wurde, sodass Backends mit nativer Compaction ihren
  eigenen Schwellenwert ohne providerspezifische Verzweigungen im Core abstimmen können.
- Backends, die alle nativen Tools für einen bestimmten Lauf deaktivieren können, dürfen
  `nativeToolMode: "selectable"` deklarieren. Eingeschränkte Aufrufe übergeben eine exakte
  `ctx.toolAvailability.native`-Liste sowie eine exakte, vom Host isolierte MCP-Zulassungsliste;
  `resolveExecutionArgs` muss beides in den endgültigen argv für einen neuen oder fortgesetzten Lauf durchsetzen.
  Um Laufzeitbeschränkungen wie Cron-`toolsAllow` zu akzeptieren, muss das Backend außerdem
  `resolveRuntimeToolAvailability` implementieren; OpenClaw deaktiviert alle nativen
  Tools und bricht sicher ab, wenn das Backend die MCP-Beschränkung nicht übersetzen oder durchsetzen
  kann.

Eine vollständige Anleitung zur Erstellung finden Sie unter
[CLI-Backend-Plugins](/de/plugins/cli-backend-plugins).

### Exklusive Slots

| Methode                                    | Registrierter Inhalt                                                                                                                                                                                                  |
| ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerContextEngine(id, factory)`   | Kontext-Engine (jeweils eine aktiv). Lebenszyklus-Callbacks erhalten `runtimeSettings`, wenn der Host Modell-/Provider-/Modusdiagnosen bereitstellen kann; ältere strikt typisierte Engines werden ohne diesen Schlüssel erneut aufgerufen. |
| `api.registerMemoryCapability(capability)` | Einheitliche Speicherfunktion                                                                                                                                                                                         |

### Veraltete Adapter für Speicher-Embeddings

| Methode                                        | Registrierter Inhalt                         |
| ---------------------------------------------- | -------------------------------------------- |
| `api.registerMemoryEmbeddingProvider(adapter)` | Speicher-Embedding-Adapter für das aktive Plugin |

- `registerMemoryCapability` ist die exklusive Speicher-Plugin-API.
- `registerMemoryCapability` kann außerdem `publicArtifacts.listArtifacts(...)`
  für vom Host verwaltete Exporte bereitstellen. Begleitende Plugins, die diese deklarierten
  Artefakte auflisten, verwenden weiterhin `listActiveMemoryPublicArtifacts(...)` aus der beibehaltenen
  `openclaw/plugin-sdk/memory-host-core`-Fassade, bis eine gezielte öffentliche Verbraucher-
  API vorhanden ist; sie dürfen nicht auf die private Struktur eines anderen Plugins zugreifen.
- `MemoryFlushPlan.model` kann den Flush-Durchlauf an eine exakte `provider/model`-
  Referenz wie `ollama/qwen3:8b` binden, ohne die aktive Fallback-
  Kette zu übernehmen.
- `registerMemoryEmbeddingProvider` ist veraltet. Neue Embedding-Provider
  sollten `api.registerEmbeddingProvider(...)` und
  `contracts.embeddingProviders` verwenden.
- Vorhandene speicherspezifische Provider funktionieren während des Migrations-
  zeitraums weiterhin, die Plugin-Inspektion meldet dies bei nicht gebündelten
  Plugins jedoch als Kompatibilitätsschuld.

### Ereignisse und Lebenszyklus

| Methode                                      | Funktion                         |
| -------------------------------------------- | -------------------------------- |
| `api.on(hookName, handler, opts?)`           | Typisierter Lebenszyklus-Hook    |
| `api.onConversationBindingResolved(handler)` | Callback für Konversationsbindung |

Beispiele, gebräuchliche Hook-Namen und Schutz-
semantik finden Sie unter [Plugin-Hooks](/de/plugins/hooks).

### Entscheidungssemantik von Hooks

`before_install` ist ein Lebenszyklus-Hook der Plugin-Laufzeit und nicht die
Installationsrichtlinienoberfläche für Betreiber. Verwenden Sie `security.installPolicy`, wenn eine Zulassungs-/Blockierungsentscheidung
sowohl CLI- als auch Gateway-gestützte Installations- oder Aktualisierungspfade
abdecken muss.

- `before_tool_call`: Die Rückgabe von `{ block: true }` ist endgültig. Sobald ein Handler den Wert setzt, werden Handler mit niedrigerer Priorität übersprungen.
- `before_tool_call`: Die Rückgabe von `{ block: false }` wird als keine Entscheidung behandelt (entspricht dem Weglassen von `block`) und nicht als Überschreibung.
- `before_install`: Die Rückgabe von `{ block: true }` ist endgültig. Sobald ein Handler den Wert setzt, werden Handler mit niedrigerer Priorität übersprungen.
- `before_install`: Die Rückgabe von `{ block: false }` wird als keine Entscheidung behandelt (entspricht dem Weglassen von `block`) und nicht als Überschreibung.
- `reply_dispatch`: Die Rückgabe von `{ handled: true, ... }` ist endgültig. Sobald ein Handler den Versand übernimmt, werden Handler mit niedrigerer Priorität und der standardmäßige Modellversandpfad übersprungen.
- `message_sending`: Die Rückgabe von `{ cancel: true }` ist endgültig. Sobald ein Handler den Wert setzt, werden Handler mit niedrigerer Priorität übersprungen.
- `message_sending`: Die Rückgabe von `{ cancel: false }` wird als keine Entscheidung behandelt (entspricht dem Weglassen von `cancel`) und nicht als Überschreibung.
- `message_received`: Verwenden Sie das typisierte Feld `threadId`, wenn Sie eingehendes Thread-/Themen-Routing benötigen. Behalten Sie `metadata` für kanalspezifische Zusatzdaten bei.
- `message_sending`: Verwenden Sie zuerst die typisierten Routing-Felder `replyToId` / `threadId`, bevor Sie auf das kanalspezifische `metadata` zurückgreifen.
- `gateway_start`: Verwenden Sie `ctx.config`, `ctx.workspaceDir` und `ctx.getCron?.()` für den Gateway-eigenen Startzustand, statt sich auf interne `gateway:startup`-Hooks zu verlassen. Cron wird zu diesem Zeitpunkt möglicherweise noch geladen.
- `cron_reconciled`: Erstellen Sie nach dem Start oder dem Neuladen des Schedulers eine vollständige externe Cron-Projektion neu. Sie enthält `reason` und den effektiven `enabled`-Zustand einschließlich `enabled: false`, während `ctx.getCron?.()` den exakt abgeglichenen Scheduler zurückgibt. Übergeben Sie `ctx.abortSignal` an dauerhafte Projektionsarbeiten; es bricht ab, wenn dieser Scheduler-Snapshot ersetzt oder das Gateway geschlossen wird.
- `cron_changed`: Beobachten Sie Änderungen am Gateway-eigenen Cron-Lebenszyklus. `scheduled`- und `removed`-Ereignisse sind nach dem Commit ausgegebene Abgleichhinweise und kein geordnetes Delta-Protokoll. Das `event.nextRunAtMs` eines geplanten Ereignisses fehlt, wenn der Auftrag keinen nächsten Aktivierungszeitpunkt hat; ein Entfernungsereignis enthält weiterhin den Snapshot des gelöschten Auftrags.

Externe Aktivierungs-Scheduler sollten `cron_changed`-Ereignisse entprellen oder zusammenfassen
und anschließend die vollständige dauerhafte Ansicht aus dem zuletzt von
`cron_reconciled` erfassten Scheduler erneut lesen. Übernehmen Sie den Scheduler nicht aus einem `cron_changed`-Kontext:
Ein losgelöster Hinweis eines älteren Schedulers kann sich mit einem späteren Neuladen überschneiden.

Verwenden Sie `cron_reconciled` als Auslöser für vollständige Snapshots bei dauerhaftem Zustand, der beim
Start des Gateways oder beim Ersetzen des Schedulers geladen wird. Bei einem ausschließlich das Plugin betreffenden
Hot-Reload wird er nicht erneut ausgegeben. Beobachtungs-Handler werden parallel ausgeführt, und Fire-and-forget-
Versandvorgänge können sich überschneiden. Verbraucher dürfen daher nicht von der Abschlussreihenfolge der Ereignisse abhängen.
OpenClaw muss die maßgebliche Quelle für Fälligkeitsprüfungen und Ausführung bleiben.

Einen Single-Flight-Adapter mit dauerhafter Ersetzung, Wiederholungsversuchen/Backoff und sauberem
Herunterfahren finden Sie unter [Sichere externe Cron-Projektion](/de/plugins/hooks#safe-external-cron-projection).

### Felder des API-Objekts

| Feld                     | Typ                       | Beschreibung                                                                                     |
| ------------------------ | ------------------------- | ------------------------------------------------------------------------------------------------ |
| `api.id`                 | `string`                  | Plugin-ID                                                                                        |
| `api.name`               | `string`                  | Anzeigename                                                                                      |
| `api.version`            | `string?`                 | Plugin-Version (optional)                                                                        |
| `api.description`        | `string?`                 | Plugin-Beschreibung (optional)                                                                   |
| `api.source`             | `string`                  | Plugin-Quellpfad                                                                                 |
| `api.rootDir`            | `string?`                 | Plugin-Stammverzeichnis (optional)                                                               |
| `api.config`             | `OpenClawConfig`          | Aktueller Konfigurations-Snapshot (sofern verfügbar, aktiver In-Memory-Laufzeit-Snapshot)        |
| `api.pluginConfig`       | `Record<string, unknown>` | Pluginspezifische Konfiguration aus `plugins.entries.<id>.config`                               |
| `api.runtime`            | `PluginRuntime`           | [Laufzeit-Hilfsfunktionen](/de/plugins/sdk-runtime)                                                 |
| `api.logger`             | `PluginLogger`            | Bereichsbezogener Logger (`debug`, `info`, `warn`, `error`)                                                |
| `api.registrationMode`   | `PluginRegistrationMode`  | Aktueller Lademodus; `"setup-runtime"` ist das schlanke Start-/Einrichtungsfenster vor dem vollständigen Einstieg |
| `api.resolvePath(input)` | `(string) => string`      | Pfad relativ zum Plugin-Stammverzeichnis auflösen                                                |

## Konvention für interne Module

Verwenden Sie innerhalb Ihres Plugins lokale Barrel-Dateien für interne Importe:

```text
my-plugin/
  api.ts            # Public exports for external consumers
  runtime-api.ts    # Internal-only runtime exports
  index.ts          # Plugin entry point
  setup-entry.ts    # Lightweight setup-only entry (optional)
```

<Warning>
  Importieren Sie Ihr eigenes Plugin im Produktionscode niemals über `openclaw/plugin-sdk/<your-plugin>`.
  Leiten Sie interne Importe über `./api.ts` oder
  `./runtime-api.ts`. Der SDK-Pfad ist ausschließlich der externe Vertrag.
</Warning>

Über Fassaden geladene öffentliche Oberflächen gebündelter Plugins (`api.ts`, `runtime-api.ts`,
`index.ts`, `setup-entry.ts` und ähnliche öffentliche Einstiegsdateien) verwenden bevorzugt den
Snapshot der aktiven Laufzeitkonfiguration, wenn OpenClaw bereits ausgeführt wird. Wenn noch kein
Laufzeit-Snapshot vorhanden ist, greifen sie auf die aufgelöste Konfigurationsdatei auf dem Datenträger zurück.
Fassaden paketierter gebündelter Plugins sollten über die Plugin-
Fassadenlader von OpenClaw geladen werden; direkte Importe aus `dist/extensions/...` umgehen die Manifest-
und Laufzeit-Sidecar-Prüfungen, die paketierte Installationen für Plugin-eigenen Code verwenden.

Provider-Plugins können ein schlankes, Plugin-lokales Barrel für Verträge bereitstellen, wenn ein
Hilfsprogramm bewusst Provider-spezifisch ist und noch nicht in einen generischen SDK-
Unterpfad gehört. Gebündelte Beispiele:

- **Anthropic**: öffentliche `api.ts`- / `contract-api.ts`-Schnittstelle für Claude-
  Beta-Header und `service_tier`-Stream-Hilfsprogramme.
- **`@openclaw/openai-provider`**: `api.ts` exportiert Provider-Builder,
  Hilfsprogramme für Standardmodelle und Echtzeit-Provider-Builder.
- **`@openclaw/openrouter-provider`**: `api.ts` exportiert den Provider-Builder
  sowie Hilfsprogramme für Onboarding und Konfiguration.

<Warning>
  Produktivcode von Erweiterungen sollte auch Importe aus `openclaw/plugin-sdk/<other-plugin>`
  vermeiden. Wenn ein Hilfsprogramm tatsächlich gemeinsam genutzt wird, verschieben Sie es in einen neutralen SDK-Unterpfad
  wie `openclaw/plugin-sdk/speech`, `.../provider-model-shared` oder eine andere
  funktionsorientierte Oberfläche, anstatt zwei Plugins miteinander zu koppeln.
</Warning>

## Verwandte Themen

<CardGroup cols={2}>
  <Card title="Einstiegspunkte" icon="door-open" href="/de/plugins/sdk-entrypoints">
    Optionen für `definePluginEntry` und `defineChannelPluginEntry`.
  </Card>
  <Card title="Laufzeit-Hilfsprogramme" icon="gears" href="/de/plugins/sdk-runtime">
    Vollständige Referenz des `api.runtime`-Namensraums.
  </Card>
  <Card title="Einrichtung und Konfiguration" icon="sliders" href="/de/plugins/sdk-setup">
    Paketierung, Manifeste und Konfigurationsschemas.
  </Card>
  <Card title="Tests" icon="vial" href="/de/plugins/sdk-testing">
    Testhilfsprogramme und Lint-Regeln.
  </Card>
  <Card title="SDK-Migration" icon="arrows-turn-right" href="/de/plugins/sdk-migration">
    Migration von veralteten Oberflächen.
  </Card>
  <Card title="Plugin-Interna" icon="diagram-project" href="/de/plugins/architecture">
    Detaillierte Architektur und Funktionsmodell.
  </Card>
</CardGroup>
