---
read_when:
    - Sie müssen Core-Hilfsfunktionen aus einem Plugin aufrufen (TTS, STT, Bildgenerierung, Websuche, Gateway, Subagent, Nodes)
    - Sie möchten verstehen, was `api.runtime` bereitstellt
    - Sie greifen aus Plugin-Code auf Konfigurations-, Agent- oder Medien-Hilfsfunktionen zu
sidebarTitle: Runtime helpers
summary: api.runtime -- die injizierten Laufzeit-Hilfsfunktionen, die Plugins zur Verfügung stehen
title: Hilfsfunktionen für die Plugin-Laufzeit
x-i18n:
    generated_at: "2026-07-12T15:38:34Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 9e43a2a56d15f970df68380a1b34776936777f667615bda51515b993e5bf3369
    source_path: plugins/sdk-runtime.md
    workflow: 16
---

Referenz für das Objekt `api.runtime`, das bei der Registrierung in jedes Plugin injiziert wird. Verwenden Sie diese Hilfsfunktionen, anstatt Host-Interna direkt zu importieren.

<CardGroup cols={2}>
  <Card title="Kanal-Plugins" href="/de/plugins/sdk-channel-plugins">
    Schritt-für-Schritt-Anleitung, die diese Hilfsfunktionen im Kontext von Kanal-Plugins verwendet.
  </Card>
  <Card title="Provider-Plugins" href="/de/plugins/sdk-provider-plugins">
    Schritt-für-Schritt-Anleitung, die diese Hilfsfunktionen im Kontext von Provider-Plugins verwendet.
  </Card>
</CardGroup>

```typescript
register(api) {
  const runtime = api.runtime;
}
```

`api.runtime.version` ist die aktuelle OpenClaw-Produktversion. Sie stammt aus der gemeinsamen Versionsauflösung, sodass Plugins denselben Wert sehen, den die CLI meldet.

## Laden und Schreiben der Konfiguration

Bevorzugen Sie Konfigurationen, die bereits an den aktiven Aufrufpfad übergeben wurden, beispielsweise `api.config` während der Registrierung oder ein `cfg`-Argument in Kanal-/Provider-Callbacks. Dadurch wird ein einziger Prozess-Snapshot durch den Arbeitsablauf weitergereicht, anstatt die Konfiguration in häufig ausgeführten Pfaden erneut zu parsen.

Verwenden Sie `api.runtime.config.current()` nur, wenn ein langlebiger Handler den aktuellen Prozess-Snapshot benötigt und keine Konfiguration an diese Funktion übergeben wurde. Der zurückgegebene Wert ist schreibgeschützt; klonen Sie ihn oder verwenden Sie vor der Bearbeitung eine Mutationshilfsfunktion.

Tool-Fabriken erhalten `ctx.runtimeConfig` sowie `ctx.getRuntimeConfig()`. Verwenden Sie den Getter innerhalb des `execute`-Callbacks eines langlebigen Tools, wenn sich die Konfiguration nach Erstellung der Tool-Definition ändern kann.

Speichern Sie Änderungen mit `api.runtime.config.mutateConfigFile(...)` oder `api.runtime.config.replaceConfigFile(...)`. Bei jedem Schreibvorgang muss ausdrücklich eine `afterWrite`-Richtlinie ausgewählt werden:

- `afterWrite: { mode: "auto" }` überlässt die Entscheidung dem Planer für Gateway-Neuladungen.
- `afterWrite: { mode: "restart", reason: "..." }` erzwingt einen sauberen Neustart, wenn der schreibende Code weiß, dass ein Neuladen im laufenden Betrieb unsicher ist.
- `afterWrite: { mode: "none", reason: "..." }` unterdrückt ein automatisches Neuladen bzw. einen automatischen Neustart nur dann, wenn der Aufrufer für die Folgemaßnahme verantwortlich ist.

Die Mutationshilfsfunktionen geben `afterWrite` sowie eine typisierte `followUp`-Zusammenfassung zurück, damit Aufrufer protokollieren oder testen können, ob sie einen Neustart angefordert haben. Die Entscheidung, wann dieser Neustart tatsächlich erfolgt, liegt weiterhin beim Gateway.

<Warning>
`api.runtime.config.loadConfig()` und `api.runtime.config.writeConfigFile(...)` sind veraltet. Sie geben zur Laufzeit einmal pro Plugin eine Warnung aus und bleiben während des Migrationszeitraums nur für alte externe Plugins verfügbar. Gebündelte Plugins dürfen sie nicht verwenden: Eine interne Schutzprüfung für Konfigurationsgrenzen lässt den Build fehlschlagen, wenn Plugin-Code sie aufruft oder diese Hilfsfunktionen aus Unterpfaden des Plugin-SDK importiert. Verwenden Sie stattdessen `current()`, ein übergebenes `cfg`, `mutateConfigFile(...)` oder `replaceConfigFile(...)`.
</Warning>

Bevorzugen Sie bei direkten SDK-Importen die gezielten Konfigurations-Unterpfade gegenüber dem breiten Kompatibilitäts-Barrel `openclaw/plugin-sdk/config-runtime`: `config-contracts` für Typen, `plugin-config-runtime` für Prüfungen bereits geladener Konfigurationen und die Suche nach Plugin-Einstiegspunkten, `runtime-config-snapshot` für aktuelle Prozess-Snapshots und `config-mutation` für Schreibvorgänge. Tests gebündelter Plugins sollten diese gezielten Unterpfade direkt mocken, anstatt das breite Kompatibilitäts-Barrel zu mocken.

Der interne OpenClaw-Laufzeitcode folgt derselben Richtung: Laden Sie die Konfiguration einmal an der CLI-, Gateway- oder Prozessgrenze und reichen Sie diesen Wert anschließend weiter. Erfolgreiche Mutationsschreibvorgänge aktualisieren den Prozess-Laufzeit-Snapshot und erhöhen dessen interne Revision; langlebige Caches sollten den von der Laufzeit verwalteten Cache-Schlüssel verwenden, anstatt die Konfiguration lokal zu serialisieren. Für langlebige Laufzeitmodule gibt es einen Scanner ohne Fehlertoleranz für kontextlose `loadConfig()`-Aufrufe; verwenden Sie ein übergebenes `cfg`, ein `context.getRuntimeConfig()` der Anfrage oder `getRuntimeConfig()` an einer ausdrücklichen Prozessgrenze.

Ausführungspfade von Providern und Kanälen müssen den aktiven Laufzeit-Konfigurations-Snapshot verwenden, nicht einen Datei-Snapshot, der zum Zurücklesen oder Bearbeiten der Konfiguration zurückgegeben wird. Datei-Snapshots bewahren Quellwerte wie SecretRef-Markierungen für die Benutzeroberfläche und Schreibvorgänge; Provider-Callbacks benötigen die aufgelöste Laufzeitansicht. Wenn eine Hilfsfunktion entweder mit dem aktiven Quell-Snapshot oder dem aktiven Laufzeit-Snapshot aufgerufen werden kann, führen Sie ihn vor dem Lesen von Zugangsdaten durch `selectApplicableRuntimeConfig()`.

## Wiederverwendbare Laufzeit-Hilfsfunktionen

Verwenden Sie eingehende `botLoopProtection`-Fakten für eingehende Nachrichten, die von Bots verfasst wurden. Core wendet die gemeinsame speicherinterne Schutzfunktion mit gleitendem Zeitfenster vor Sitzungsaufzeichnung und Weiterleitung an, ohne die Richtlinie an einen einzelnen Kanal zu binden. Die Schutzfunktion verfolgt Schlüssel aus `(scopeId, conversationId, participant pair)`, zählt beide Richtungen eines Paares gemeinsam, wendet nach Überschreiten des Fensterbudgets eine Abklingzeit an und entfernt inaktive Einträge bei Gelegenheit.

Kanal-Plugins, die dieses Verhalten für Betreiber verfügbar machen, sollten für Basisbudgets die gemeinsame Struktur `channels.defaults.botLoopProtection` bevorzugen und anschließend kanal-/providerspezifische Überschreibungen darüberlegen. Die gemeinsame Konfiguration verwendet Sekunden, da sie benutzerseitig sichtbar ist:

```typescript
type ChannelBotLoopProtectionConfig = {
  enabled?: boolean;
  maxEventsPerWindow?: number;
  windowSeconds?: number;
  cooldownSeconds?: number;
};
```

Übergeben Sie normalisierte Bot-Paar-Fakten zusammen mit dem aufgelösten Turn. Core löst Standardwerte, Einheitenumrechnung und die Semantik von `enabled` auf:

```typescript
return {
  channel: "example",
  routeSessionKey,
  storePath,
  ctxPayload,
  recordInboundSession,
  runDispatch,
  botLoopProtection: {
    scopeId: "account-1",
    conversationId: "channel-1",
    senderId: "bot-a",
    receiverId: "bot-b",
    config: channelConfig.botLoopProtection,
    defaultsConfig: runtimeConfig.channels?.defaults?.botLoopProtection,
    defaultEnabled: allowBotsMode !== "off",
  },
};
```

Verwenden Sie `openclaw/plugin-sdk/pair-loop-guard-runtime` nur für benutzerdefinierte
Ereignisschleifen zwischen zwei Parteien, die nicht über den gemeinsamen Runner für eingehende Antworten laufen.

## Laufzeit-Namespaces

<AccordionGroup>
  <Accordion title="api.runtime.agent">
    Agentenidentität, Verzeichnisse und Sitzungsverwaltung.

    ```typescript
    // Arbeitsverzeichnis des Agenten auflösen (agentId ist erforderlich)
    const agentDir = api.runtime.agent.resolveAgentDir(cfg, agentId);

    // Agenten-Workspace auflösen
    const workspaceDir = api.runtime.agent.resolveAgentWorkspaceDir(cfg, agentId);

    // Agentenidentität abrufen
    const identity = api.runtime.agent.resolveAgentIdentity(cfg);

    // Standard-Denkstufe abrufen
    const thinking = api.runtime.agent.resolveThinkingDefault({
      cfg,
      provider,
      model,
    });

    // Eine vom Benutzer angegebene Denkstufe anhand des aktiven Provider-Profils validieren
    const policy = api.runtime.agent.resolveThinkingPolicy({ provider, model });
    const level = api.runtime.agent.normalizeThinkingLevel("extra high");
    if (level && policy.levels.some((entry) => entry.id === level)) {
      // Stufe an einen eingebetteten Lauf übergeben
    }

    // Agenten-Zeitlimit abrufen
    const timeoutMs = api.runtime.agent.resolveAgentTimeoutMs(cfg);

    // Sicherstellen, dass der Workspace vorhanden ist
    await api.runtime.agent.ensureAgentWorkspace(cfg);

    // Einen eingebetteten Agenten-Turn ausführen
    const result = await api.runtime.agent.runEmbeddedAgent({
      sessionId: "my-plugin:task-1",
      runId: crypto.randomUUID(),
      workspaceDir: api.runtime.agent.resolveAgentWorkspaceDir(cfg, agentId),
      prompt: "Neueste Änderungen zusammenfassen",
      timeoutMs: api.runtime.agent.resolveAgentTimeoutMs(cfg),
    });
    ```

    `runEmbeddedAgent(...)` ist die neutrale Hilfsfunktion zum Starten eines normalen OpenClaw-Agenten-Turns aus Plugin-Code. Sie verwendet dieselbe Provider-/Modellauflösung und Auswahl des Agenten-Harnesses wie durch Kanäle ausgelöste Antworten.

    `runEmbeddedPiAgent(...)` bleibt als veralteter Kompatibilitätsalias für bestehende Plugins erhalten. Neuer Code sollte `runEmbeddedAgent(...)` verwenden.

    `resolveThinkingPolicy(...)` gibt die vom Provider/Modell unterstützten Denkstufen und optional einen Standardwert zurück. Provider-Plugins verwalten das modellspezifische Profil über ihre Denk-Hooks. Tool-Plugins sollten daher diese Laufzeit-Hilfsfunktion aufrufen, anstatt Provider-Listen zu importieren oder zu duplizieren.

    `normalizeThinkingLevel(...)` wandelt Benutzereingaben wie `on`, `x-high` oder `extra high` in die kanonisch gespeicherte Stufe um, bevor sie anhand der aufgelösten Richtlinie geprüft werden.

    **Hilfsfunktionen für den Sitzungsspeicher** befinden sich unter `api.runtime.agent.session`:

    ```typescript
    const entry = api.runtime.agent.session.getSessionEntry({ agentId, sessionKey });
    for (const { sessionKey, entry } of api.runtime.agent.session.listSessionEntries({ agentId })) {
      // Sitzungszeilen durchlaufen, ohne von der veralteten sessions.json-Struktur abhängig zu sein.
    }
    await api.runtime.agent.session.patchSessionEntry({
      agentId,
      sessionKey,
      update: (entry) => ({ thinkingLevel: "high" }),
    });

    const created = await api.runtime.agent.session.createSessionEntry({
      cfg,
      key: "agent:main:my-plugin:task-1",
      initialEntry: {
        agentHarnessId: "my-harness",
        modelSelectionLocked: true,
        pluginExtensions: { "my-plugin": { phase: "initializing" } },
      },
      afterCreate: async () => ({
        pluginExtensions: { "my-plugin": { phase: "ready" } },
      }),
    });

    const storePath = api.runtime.agent.session.resolveStorePath(cfg.session?.store, { agentId });
    await api.runtime.agent.session.runWithWorkAdmission(
      { storePath, sessionKey },
      async (signal) => {
        // Sitzung erstellen oder aktualisieren und anschließend signal an den zugelassenen Agentenlauf übergeben.
      },
    );
    ```

    Bevorzugen Sie `getSessionEntry(...)`, `listSessionEntries(...)`, `patchSessionEntry(...)` oder `upsertSessionEntry(...)` für Sitzungsabläufe. Diese Hilfsfunktionen adressieren Sitzungen anhand der Agenten-/Sitzungsidentität, sodass Plugins nicht von der veralteten Speicherstruktur `sessions.json` abhängen. Verwenden Sie `preserveActivity: true` für reine Metadaten-Patches, die die Sitzungsaktivität nicht aktualisieren sollen, und `replaceEntry: true` nur dann, wenn der Callback einen vollständigen Eintrag zurückgibt und gelöschte Felder gelöscht bleiben müssen. Doctor- und Migrationspfade können `fallbackEntry`, `skipMaintenance` und `requireWriteSuccess` für eine einzelne atomare Reparatur des kanonischen Speichers kombinieren.

    `createSessionEntry(...)` erstellt eine neue kanonische Sitzungszeile und ein Transkript. Die vertrauenswürdige Oberfläche `initialEntry` ist absichtlich eng gefasst: eine nicht leere `agentHarnessId`, optional `modelSelectionLocked: true` und optional `pluginExtensions`. Die injizierte Laufzeit akzeptiert nur Harness-IDs, die dem aufrufenden Plugin über `registerAgentHarness(...)` gehören; dies ist eine Eigentumsinvariante und keine Sandbox zwischen prozessinternen Plugins. Eine bereits vorhandene Zeile wird abgelehnt; `label` und `spawnedCwd` sind separate Erstellungsfelder und keine vertrauenswürdigen Eintrags-Patches.

    Während `afterCreate` hält der Erstellungsprozess die Mutationssperre für den Sitzungslebenszyklus. Dadurch wartet neue Arbeit, bis die Plugin-eigene Initialisierung abgeschlossen ist, während bereits zuvor zugelassene Arbeit die Erstellung fehlschlagen lässt. Der Callback erhält einen Klon des erstellten Zustands. Wenn er einen Patch zurückgibt, darf dieser Patch ausschließlich `pluginExtensions` enthalten, und dessen Wert ist das vollständige endgültige Feld `pluginExtensions`. Ein Fehler im Callback oder bei der abschließenden Speicherung setzt die unveränderte neue Zeile und das Transkript zurück; der abgesicherte Rollback bewahrt eine Zeile, die nebenläufig geändert oder beansprucht wurde. `recoverMatchingInitialEntry: true` ist ausschließlich für die Wiederholung einer unterbrochenen Initialisierung vorgesehen, wenn die gespeicherten vertrauenswürdigen Felder exakt übereinstimmen. Für die Wiederherstellung muss `afterCreate` einen abschließenden Patch zurückgeben.

    Verwenden Sie `runWithWorkAdmission(...)`, wenn ein Plugin Arbeit an einer persistenten Sitzung startet. Der Callback lehnt archivierte oder nebenläufig ersetzte Sitzungen ab, koordiniert Archivierungs-, Zurücksetzungs- und Löschmutationen bis zum Abschluss und erhält ein `AbortSignal`, das an den Agentenlauf weitergeleitet werden muss. Ein Harness kann über sein experimentelles Registrierungsfeld `delegatedExecutionPluginIds` ausdrücklich vertrauenswürdige Ausführungsdelegierte benennen. Delegierte können nur eine exakt vorhandene, modellgesperrte Sitzung zulassen und ausführen; sämtliche Sitzungsmutationen bleiben auf den Eigentümer des Harnesses beschränkt. Siehe [Agenten-Harness-Plugins](/de/plugins/sdk-agent-harness#delegated-execution).

    Wartungs- und Reparatur-Plugins können `deleteSessionEntry(...)` für einen einzelnen eingegrenzten Sitzungseintrag, `cleanupSessionLifecycleArtifacts(...)` für Lebenszyklus-eigene temporäre Sitzungen und `resolveSessionStoreBackupPaths(...)` vor der Änderung eines Speichers verwenden. Diese Hilfsfunktionen sind eng begrenzte Reparatur-/Lebenszyklus-Schnittstellen und keine allgemeine API zum Löschen von Speichern.

    `resolveStorePath(...)` und `updateSessionStoreEntry(...)` vervollständigen die Sitzungshilfen: `resolveStorePath` ermittelt den Pfad des Sitzungsspeichers für einen bestimmten Geltungsbereich, und `updateSessionStoreEntry({ storePath, sessionKey, update })` aktualisiert einen Eintrag direkt anhand des Speicherpfads, wenn der Aufrufer ihn bereits kennt.

    `loadTranscriptEventsSync(...)` ist für synchrone Doctor- und Reparaturpfade verfügbar, die die asynchrone Transkript-Laufzeit nicht verwenden können. Die Funktion gibt unverarbeitete `SessionStoreTranscriptEvent`-Datensätze zurück. Normaler Plugin-Laufzeitcode sollte `openclaw/plugin-sdk/session-transcript-runtime` bevorzugen.

    `formatSqliteSessionFileMarker(...)`, `parseSqliteSessionFileMarker(...)` und `sqliteSessionFileMarkerMatchesSession(...)` sind Übergangshilfen für Code, der noch ein Legacy-Feld namens `sessionFile` erhält. Eine analysierte SQLite-Markierung identifiziert ein aktives SQLite-Transkriptziel; sie ist kein Dateisystempfad. Neue APIs sollten eine typisierte Sitzungsidentität anstelle von Markierungszeichenfolgen übertragen.

    Importieren Sie für das Lesen und Schreiben von Transkripten `openclaw/plugin-sdk/session-transcript-runtime` und verwenden Sie `resolveSessionTranscriptIdentity(...)`, `resolveSessionTranscriptTarget(...)`, `readSessionTranscriptEvents(...)`, `readVisibleSessionTranscriptMessageEntries(...)`, `appendSessionTranscriptMessageByIdentity(...)`, `publishSessionTranscriptUpdateByIdentity(...)` oder `withSessionTranscriptWriteLock(...)` mit `{ agentId, sessionKey, sessionId }`. Mit diesen APIs können Plugins ein Transkript identifizieren, unverarbeitete Ereignisse oder sichtbare, verzweigungssichere Nachrichteneinträge lesen, Nachrichten anhängen, Aktualisierungen veröffentlichen und zusammengehörige Vorgänge unter derselben Transkript-Schreibsperre ausführen, ohne von aktiven Transkriptdateipfaden abhängig zu sein. `readVisibleSessionTranscriptMessageEntries(...)` gibt geordnete Lesemetadaten zurück; das Feld `seq` ist kein fortsetzbarer Cursor.

    Die Legacy-Hilfen für den gesamten Speicher und aktive Transkriptdateien werden nicht mehr aus dem Plugin-SDK exportiert. Verwenden Sie die eingegrenzten Eintragshilfen für Sitzungsmetadaten und die Hilfen zur Transkriptidentität für Vorgänge am aktiven Transkript. Archivierungs-/Support-Workflows, die Dateiartefakte benötigen, sollten ihre dedizierten Archivschnittstellen anstelle der APIs der aktiven Sitzungslaufzeit verwenden.

  </Accordion>
  <Accordion title="api.runtime.agent.defaults">
    Standardkonstanten für Modell und Provider:

    ```typescript
    const model = api.runtime.agent.defaults.model; // z. B. "gpt-5.6-sol"
    const provider = api.runtime.agent.defaults.provider; // z. B. "openai"
    ```

  </Accordion>

  <Accordion title="api.runtime.llm">
    Führen Sie eine vom Host verwaltete Textvervollständigung aus, ohne interne Provider-Komponenten zu importieren oder
    die Modell-/Authentifizierungs-/Basis-URL-Vorbereitung von OpenClaw zu duplizieren.

    ```typescript
    const result = await api.runtime.llm.complete({
      messages: [{ role: "user", content: "Fassen Sie dieses Transkript zusammen." }],
      purpose: "my-plugin.summary",
      maxTokens: 512,
      temperature: 0.2,
    });
    ```

    Die Provider-Orchestrierung kann außerdem den konfigurierten Lebenszyklus des lokalen Dienstes
    übernehmen, bevor eine HTTP-Anfrage gesendet wird:

    ```typescript
    const lease = await api.runtime.llm.acquireLocalService(
      {
        providerId,
        baseUrl,
        headers,
      },
      signal,
    );
    try {
      // Senden Sie die Provider-Anfrage und verarbeiten Sie sie vollständig.
    } finally {
      await lease?.release();
    }
    ```

    `acquireLocalService(...)` ist ein stabiler, generischer SDK-Vertrag für Provider-Dienste.
    Der Host ermittelt die Prozesskonfiguration aus
    `models.providers.<providerId>.localService`; Aufrufer können weder einen
    Befehl noch Argumente, eine Umgebung oder eine Lebenszyklusrichtlinie angeben. Prozesserzeugung,
    Bereitschaft, Diagnose und Richtlinie zum Beenden bei Inaktivität bleiben intern im Host.

    Übergeben Sie die exakte konfigurierte Provider-ID und die aufgelöste Basis-URL der Anfrage. Ersetzen Sie
    Aliasse nicht durch eine Adapter-ID: Verschiedene Aliasse können auf verschiedene
    lokale GPU-Hosts verweisen. Der Host lehnt Endpunkte ab, die nicht mit der konfigurierten
    Provider-Basis-URL übereinstimmen, abgesehen von der von Ollama- und LM-Studio-Adaptern verwendeten
    `/v1`-Normalisierung. Der Host verwaltet die Serialisierung des Starts, Bereitschaftsprüfungen,
    Anfrage-Leases, Abbruchbehandlung und das Herunterfahren bei Inaktivität.

    Die Hilfsfunktion verwendet denselben Vorbereitungspfad für einfache Vervollständigungen wie die
    integrierte Laufzeit von OpenClaw sowie den vom Host verwalteten Snapshot der Laufzeitkonfiguration. Kontext-Engines
    erhalten eine sitzungsgebundene `llm.complete`-Fähigkeit, sodass Modellaufrufe den
    Agenten der aktiven Sitzung verwenden und nicht stillschweigend auf den Standardagenten zurückfallen. Das
    Ergebnis enthält die Zuordnung zu Provider, Modell und Agent sowie normalisierte Angaben zur Token-,
    Cache- und geschätzten Kostennutzung, sofern verfügbar.

    <Warning>
    Modellüberschreibungen erfordern die Zustimmung des Operators über `plugins.entries.<id>.llm.allowModelOverride: true` in der Konfiguration. Verwenden Sie `plugins.entries.<id>.llm.allowedModels`, um vertrauenswürdige Plugins auf bestimmte kanonische `provider/model`-Ziele zu beschränken. Agentenübergreifende Vervollständigungen erfordern `plugins.entries.<id>.llm.allowAgentIdOverride: true`.
    </Warning>

  </Accordion>
  <Accordion title="api.runtime.gateway">
    Rufen Sie eine andere Gateway-Methode innerhalb des Prozesses auf und bewahren Sie dabei die vertrauenswürdige Laufzeitidentität
    des aktuellen Plugins. Dies ist für gebündelte oder vertrauenswürdige offizielle Plugins vorgesehen, die Plugin-eigene
    Gateway-Fähigkeiten kombinieren, ohne eine Loopback-WebSocket-Verbindung zu öffnen.

    ```typescript
    if (await api.runtime.gateway.isAvailable()) {
      const result = await api.runtime.gateway.request<{ callId: string }>(
        "voicecall.start",
        { to: "+15550001234", mode: "conversation" },
        { timeoutMs: 60_000 },
      );
    }
    ```

    Anfragen verwenden den Geltungsbereich `operator.write` und gewähren keinen Administrator-Geltungsbereich. Aufrufe von beliebigen externen
    Plugins werden abgelehnt. Fehlgeschlagene Methoden lösen einen `GatewayClientRequestError` aus, wobei strukturierte
    `details`, Metadaten zu Wiederholungsversuchen und der Gateway-Fehlercode für Wiederherstellungsabläufe erhalten bleiben. Verwenden Sie `isAvailable()`,
    bevor Sie diesen Pfad in Tools auswählen, die auch in eigenständigen Agentenprozessen ausgeführt werden können.

  </Accordion>
  <Accordion title="api.runtime.subagent">
    Starten und verwalten Sie Subagent-Läufe im Hintergrund.

    ```typescript
    // Einen Subagent-Lauf starten
    const { runId } = await api.runtime.subagent.run({
      sessionKey: "agent:main:subagent:search-helper",
      message: "Erweitern Sie diese Abfrage zu gezielten weiterführenden Suchen.",
      provider: "openai", // optionale Überschreibung
      model: "gpt-5.6-sol", // optionale Überschreibung
      deliver: false,
    });

    // Auf den Abschluss warten
    const result = await api.runtime.subagent.waitForRun({ runId, timeoutMs: 30000 });

    // Sitzungsnachrichten lesen
    const { messages } = await api.runtime.subagent.getSessionMessages({
      sessionKey: "agent:main:subagent:search-helper",
      limit: 10,
    });

    // Eine Sitzung löschen
    await api.runtime.subagent.deleteSession({
      sessionKey: "agent:main:subagent:search-helper",
    });
    ```

    <Warning>
    Modellüberschreibungen (`provider`/`model`) erfordern die Zustimmung des Operators über `plugins.entries.<id>.subagent.allowModelOverride: true` in der Konfiguration. Nicht vertrauenswürdige Plugins können weiterhin Subagenten ausführen, Überschreibungsanfragen werden jedoch abgelehnt.
    </Warning>

    `deleteSession(...)` kann Sitzungen löschen, die vom selben Plugin über `api.runtime.subagent.run(...)` erstellt wurden. Das Löschen beliebiger Benutzer- oder Operatorsitzungen erfordert weiterhin eine Gateway-Anfrage mit Administrator-Geltungsbereich.

  </Accordion>
  <Accordion title="api.runtime.nodes">
    Listen Sie verbundene Nodes auf und rufen Sie einen Node-Host-Befehl aus vom Gateway geladenem Plugin-Code oder aus Plugin-CLI-Befehlen auf. Verwenden Sie dies, wenn ein Plugin lokale Arbeit auf einem gekoppelten Gerät verwaltet, beispielsweise eine Browser- oder Audio-Bridge auf einem anderen Mac.

    ```typescript
    const { nodes } = await api.runtime.nodes.list({ connected: true });

    const result = await api.runtime.nodes.invoke({
      nodeId: "mac-studio",
      command: "my-plugin.command",
      params: { action: "start" },
      timeoutMs: 30000,
    });
    ```

    `nodes.list(...)` enthält die von jedem verbundenen Node angekündigten
    `nodePluginTools`-Deskriptoren, wenn dieser Node dem Agenten Plugin- oder MCP-gestützte
    Tools bereitstellt. Diese Deskriptoren stellen den aktuellen Verbindungsstatus dar: Das Gateway
    verwirft sie, wenn der Node die Verbindung trennt, und ein Node kann sie nach Änderungen am lokalen
    Plugin-/MCP-Bestand mit `node.pluginTools.update` ersetzen.

    Innerhalb des Gateways wird diese Laufzeit prozessintern ausgeführt. In Plugin-CLI-Befehlen ruft sie das konfigurierte Gateway über RPC auf, sodass Befehle wie `openclaw googlemeet recover-tab` gekoppelte Nodes vom Terminal aus prüfen können. Node-Befehle durchlaufen weiterhin die normale Gateway-Node-Kopplung, Befehlsfreigabelisten, Richtlinien für Plugin-Node-Aufrufe und die Node-lokale Befehlsverarbeitung.

    Plugins, die auf Nodes gehostete Agenten-Tools bereitstellen, können `agentTool.defaultPlatforms` für ungefährliche Befehle festlegen, die standardmäßig in die Freigabeliste aufgenommen werden sollen. Lassen Sie das Feld weg, wenn Operatoren die Befehle ausdrücklich mit `gateway.nodes.allowCommands` zulassen müssen. Gefährliche Node-Host-Befehle sollten mit `api.registerNodeInvokePolicy(...)` eine Richtlinie für Node-Aufrufe registrieren; die Richtlinie wird im Gateway nach den Prüfungen der Befehlsfreigabeliste und vor der Weiterleitung des Befehls an den Node ausgeführt, sodass direkte `node.invoke`-Aufrufe, auf Nodes gehostete Plugin-Tools und übergeordnete Plugin-Tools denselben Durchsetzungspfad verwenden.

    <Warning>
    Das optionale Feld `scopes` fordert für den Aufruf Gateway-Operator-Geltungsbereiche an. OpenClaw berücksichtigt es nur für gebündelte Plugins und vertrauenswürdige Installationen offizieller Plugins; Anfragen von anderen Plugins erweitern die Berechtigungen des Aufrufs nicht. Verwenden Sie es nur, wenn ein vertrauenswürdiges Plugin einen Node-Befehl mit einem strengeren Gateway-Geltungsbereich wie `operator.admin` aufrufen muss.
    </Warning>

  </Accordion>
  <Accordion title="api.runtime.tasks">
    Binden Sie den Zustand von Task Flow und Task Run an einen vorhandenen OpenClaw-Sitzungsschlüssel oder einen vertrauenswürdigen Tool-Kontext.

    - `api.runtime.tasks.managedFlows` unterstützt Änderungen: Task Flows erstellen, fortsetzen und abbrechen.
    - `api.runtime.tasks.flows` und `api.runtime.tasks.runs` sind schreibgeschützte DTO-Ansichten für Auflistungen und Statusabfragen; beide stellen `bindSession(...)` / `fromToolContext(...)` sowie `get`, `list`, `findLatest` und `resolve` bereit.
    - `api.runtime.tasks.flow` ist ein veralteter Alias für `managedFlows`.

    Task Flow verfolgt den dauerhaften Zustand mehrstufiger Workflows. Es ist kein Scheduler:
    Verwenden Sie Cron oder `api.session.workflow.scheduleSessionTurn(...)` für zukünftige
    Aktivierungen und anschließend `managedFlows` aus dem geplanten Turn, wenn diese Arbeit
    Flow-Zustand, untergeordnete Aufgaben, Wartezustände oder einen Abbruch benötigt.

    ```typescript
    const taskFlow = api.runtime.tasks.managedFlows.fromToolContext(ctx);

    const created = taskFlow.createManaged({
      controllerId: "my-plugin/review-batch",
      goal: "Neue Pull Requests prüfen",
    });

    const child = taskFlow.runTask({
      flowId: created.flowId,
      runtime: "acp",
      childSessionKey: "agent:main:subagent:reviewer",
      task: "PR #123 prüfen",
      status: "running",
      startedAt: Date.now(),
    });

    const waiting = taskFlow.setWaiting({
      flowId: created.flowId,
      expectedRevision: created.revision,
      currentStep: "await-human-reply",
      waitJson: { kind: "reply", channel: "telegram" },
    });
    ```

    Verwenden Sie `bindSession({ sessionKey, requesterOrigin })`, wenn Sie bereits einen vertrauenswürdigen OpenClaw-Sitzungsschlüssel aus Ihrer eigenen Bindungsschicht besitzen. Binden Sie nicht anhand unverarbeiteter Benutzereingaben.

  </Accordion>
  <Accordion title="api.runtime.tts">
    Sprachsynthese.

    ```typescript
    // Standard-TTS
    const clip = await api.runtime.tts.textToSpeech({
      text: "Hallo von OpenClaw",
      cfg: api.config,
    });

    // Für Telefonie optimiertes TTS
    const telephonyClip = await api.runtime.tts.textToSpeechTelephony({
      text: "Hallo von OpenClaw",
      cfg: api.config,
    });

    // Verfügbare Stimmen auflisten
    const voices = await api.runtime.tts.listVoices({
      provider: "elevenlabs",
      cfg: api.config,
    });
    ```

    Verwendet die zentrale `messages.tts`-Konfiguration und Provider-Auswahl. Gibt einen PCM-Audiopuffer und die Abtastrate zurück. `textToSpeechStream` ist ebenfalls für die Streaming-Synthese verfügbar.

  </Accordion>
  <Accordion title="api.runtime.mediaUnderstanding">
    Bild-, Audio- und Videoanalyse.

    ```typescript
    // Ein Bild beschreiben
    const image = await api.runtime.mediaUnderstanding.describeImageFile({
      filePath: "/tmp/inbound-photo.jpg",
      cfg: api.config,
      agentDir: "/tmp/agent",
    });

    // Audio transkribieren
    const { text } = await api.runtime.mediaUnderstanding.transcribeAudioFile({
      filePath: "/tmp/inbound-audio.ogg",
      cfg: api.config,
      mime: "audio/ogg", // optional, falls MIME nicht abgeleitet werden kann
    });

    // Ein Video beschreiben
    const video = await api.runtime.mediaUnderstanding.describeVideoFile({
      filePath: "/tmp/inbound-video.mp4",
      cfg: api.config,
    });

    // Allgemeine Dateianalyse
    const result = await api.runtime.mediaUnderstanding.runFile({
      filePath: "/tmp/inbound-file.pdf",
      cfg: api.config,
    });

    // Strukturierte Bildextraktion über einen bestimmten Provider/ein bestimmtes Modell.
    // Mindestens ein Bild einschließen; Texteingaben dienen als ergänzender Kontext.
    const evidence = await api.runtime.mediaUnderstanding.extractStructuredWithModel({
      provider: "codex",
      model: "gpt-5.6-sol",
      input: [
        {
          type: "image",
          buffer: receiptImageBuffer,
          fileName: "receipt.png",
          mime: "image/png",
        },
        { type: "text", text: "Bevorzuge die gedruckte Gesamtsumme gegenüber handschriftlichen Notizen." },
      ],
      instructions: "Anbieter, Gesamtsumme und durchsuchbare Tags extrahieren.",
      schemaName: "receipt.evidence",
      jsonSchema: {
        type: "object",
        properties: {
          vendor: { type: "string" },
          total: { type: "number" },
          tags: { type: "array", items: { type: "string" } },
        },
        required: ["vendor", "total"],
      },
      cfg: api.config,
    });
    ```

    Gibt `{ text: undefined }` zurück, wenn keine Ausgabe erzeugt wird (z. B. bei einer übersprungenen Eingabe).

    `describeImageFileWithModel(...)` beschreibt ein bereits bekanntes Bild über einen bestimmten Provider/ein bestimmtes Modell und umgeht dabei die standardmäßige Auflösung des aktiven Modells, die `describeImageFile(...)` verwendet.

    <Info>
    `api.runtime.stt.transcribeAudioFile(...)` bleibt als Kompatibilitätsalias für `api.runtime.mediaUnderstanding.transcribeAudioFile(...)` erhalten.
    </Info>

  </Accordion>
  <Accordion title="api.runtime.imageGeneration">
    Bilderzeugung.

    ```typescript
    const result = await api.runtime.imageGeneration.generate({
      prompt: "Ein Roboter malt einen Sonnenuntergang",
      cfg: api.config,
    });

    const providers = api.runtime.imageGeneration.listProviders({ cfg: api.config });
    ```

  </Accordion>
  <Accordion title="api.runtime.videoGeneration">
    Videoerzeugung mit derselben Struktur wie die Bilderzeugung.

    ```typescript
    const result = await api.runtime.videoGeneration.generate({
      prompt: "Eine Drohnenaufnahme, die bei Sonnenaufgang über eine Küste fliegt",
      cfg: api.config,
    });

    const providers = api.runtime.videoGeneration.listProviders({ cfg: api.config });
    ```

  </Accordion>
  <Accordion title="api.runtime.musicGeneration">
    Musikerzeugung mit derselben Struktur wie die Bilderzeugung.

    ```typescript
    const result = await api.runtime.musicGeneration.generate({
      prompt: "Ein beschwingter Lo-Fi-Track für eine Programmiersitzung",
      cfg: api.config,
    });

    const providers = api.runtime.musicGeneration.listProviders({ cfg: api.config });
    ```

  </Accordion>
  <Accordion title="api.runtime.webSearch">
    Websuche.

    ```typescript
    const providers = api.runtime.webSearch.listProviders({ config: api.config });

    const result = await api.runtime.webSearch.search({
      config: api.config,
      args: { query: "OpenClaw Plugin-SDK", count: 5 },
    });
    ```

  </Accordion>
  <Accordion title="api.runtime.media">
    Medien-Dienstprogramme auf niedriger Ebene.

    ```typescript
    const webMedia = await api.runtime.media.loadWebMedia(url);
    const mime = await api.runtime.media.detectMime(buffer);
    const kind = api.runtime.media.mediaKindFromMime("image/jpeg"); // "image"
    const isVoice = api.runtime.media.isVoiceCompatibleAudio(filePath);
    const metadata = await api.runtime.media.getImageMetadata(filePath);
    const resized = await api.runtime.media.resizeToJpeg(buffer, { maxWidth: 800 });
    const terminalQr = await api.runtime.media.renderQrTerminal("https://openclaw.ai");
    const pngQr = await api.runtime.media.renderQrPngBase64("https://openclaw.ai", {
      scale: 6, // 1-12
      marginModules: 4, // 0-16
    });
    const pngQrDataUrl = await api.runtime.media.renderQrPngDataUrl("https://openclaw.ai");
    const tmpRoot = resolvePreferredOpenClawTmpDir();
    const pngQrFile = await api.runtime.media.writeQrPngTempFile("https://openclaw.ai", {
      tmpRoot,
      dirPrefix: "my-plugin-qr-",
      fileName: "qr.png",
    });
    ```

  </Accordion>
  <Accordion title="api.runtime.config">
    Aktueller Snapshot der Laufzeitkonfiguration und transaktionale Konfigurationsschreibvorgänge. Bevorzugen Sie
    die Konfiguration, die bereits an den aktiven Aufrufpfad übergeben wurde; verwenden Sie
    `current()` nur, wenn der Handler den Prozess-Snapshot direkt benötigt.

    ```typescript
    const cfg = api.runtime.config.current();
    await api.runtime.config.mutateConfigFile({
      afterWrite: { mode: "auto" },
      mutate(draft) {
        draft.plugins ??= {};
      },
    });
    ```

    `mutateConfigFile(...)` und `replaceConfigFile(...)` geben einen `followUp`-Wert
    zurück, beispielsweise `{ mode: "restart", requiresRestart: true, reason }`,
    der die Absicht des Schreibers festhält, ohne dem
    Gateway die Kontrolle über den Neustart zu entziehen.

  </Accordion>
  <Accordion title="api.runtime.system">
    Dienstprogramme auf Systemebene.

    ```typescript
    await api.runtime.system.enqueueSystemEvent(event);
    api.runtime.system.requestHeartbeat({
      source: "other",
      intent: "event",
      reason: "plugin-event",
    });
    api.runtime.system.requestHeartbeatNow({ reason: "plugin-event" }); // Veralteter Kompatibilitätsalias.
    const heartbeatResult = await api.runtime.system.runHeartbeatOnce({
      reason: "plugin-triggered-check",
    });
    const output = await api.runtime.system.runCommandWithTimeout(cmd, args, opts);
    const hint = api.runtime.system.formatNativeDependencyHint(pkg);
    ```

    `runHeartbeatOnce(...)` führt sofort einen einzelnen Heartbeat-Zyklus aus und umgeht dabei den normalen Zusammenführungstimer. Übergeben Sie `{ heartbeat: { target: "last" } }`, um die Zustellung an den zuletzt aktiven Kanal zu erzwingen, anstatt die standardmäßige Unterdrückung mit `target: "none"` zu verwenden.

    `runCommandWithTimeout(...)` gibt erfasste Werte für `stdout` und `stderr`, optionale
    Kürzungszähler, `code`, `signal`, `killed`, `termination` und
    `noOutputTimedOut` zurück. Ergebnisse bei Zeitüberschreitung und bei Zeitüberschreitung ohne Ausgabe melden `code: 124`,
    wenn der Kindprozess keinen von null verschiedenen Exit-Code bereitstellt. Signalbedingte
    Beendigungen ohne Zeitüberschreitung können weiterhin `code: null` zurückgeben. Verwenden Sie daher `termination` und
    `noOutputTimedOut`, um die Gründe für die Zeitüberschreitung zu unterscheiden.

  </Accordion>
  <Accordion title="api.runtime.events">
    Ereignisabonnements.

    ```typescript
    api.runtime.events.onAgentEvent((event) => {
      /* ... */
    });
    api.runtime.events.onSessionTranscriptUpdate((update) => {
      /* ... */
    });
    ```

  </Accordion>
  <Accordion title="api.runtime.logging">
    Protokollierung.

    ```typescript
    const verbose = api.runtime.logging.shouldLogVerbose();
    const childLogger = api.runtime.logging.getChildLogger({ plugin: "my-plugin" }, { level: "debug" });
    ```

  </Accordion>
  <Accordion title="api.runtime.modelAuth">
    Auflösung der Modell- und Provider-Authentifizierung.

    ```typescript
    const auth = await api.runtime.modelAuth.getApiKeyForModel({ model, cfg });

    // Für Anfragen einsatzbereite Authentifizierung, einschließlich Laufzeitaustausch mit Providern (z. B. OAuth-Aktualisierung)
    const runtimeAuth = await api.runtime.modelAuth.getRuntimeAuthForModel({ model, cfg });

    const providerAuth = await api.runtime.modelAuth.resolveApiKeyForProvider({
      provider: "openai",
      cfg,
    });
    ```

  </Accordion>
  <Accordion title="api.runtime.state">
    Auflösung des Zustandsverzeichnisses und SQLite-gestützter schlüsselbasierter Speicher.

    ```typescript
    const stateDir = api.runtime.state.resolveStateDir(process.env);
    const store = api.runtime.state.openKeyedStore<MyRecord>({
      namespace: "my-feature",
      maxEntries: 200,
      defaultTtlMs: 15 * 60_000,
    });

    await store.register("key-1", { value: "hello" });
    const claimed = await store.registerIfAbsent("dedupe-key", { value: "first" });
    const value = await store.lookup("key-1");
    await store.consume("key-1");
    await store.clear();
    ```

    Schlüsselbasierte Speicher überstehen Neustarts und werden anhand der an die Laufzeit gebundenen Plugin-ID isoliert. Verwenden Sie `registerIfAbsent(...)` für atomare Deduplizierungsansprüche: Die Methode gibt `true` zurück, wenn der Schlüssel fehlte oder abgelaufen war und registriert wurde, oder `false`, wenn bereits ein aktiver Wert vorhanden ist, ohne dessen Wert, Erstellungszeit oder TTL zu überschreiben. Grenzwerte: `maxEntries` pro Namensraum, 50,000 aktive Zeilen pro Plugin, JSON-Werte unter 64KB und optionaler TTL-Ablauf. Standardmäßig entfernt ein Schreibvorgang bei Erreichen eines der Zeilenlimits die ältesten aktiven Zeilen aus dem Namensraum, in den geschrieben wird; benachbarte Namensräume werden für diesen Schreibvorgang nicht bereinigt, und der Schreibvorgang schlägt weiterhin fehl, wenn der Namensraum nicht genügend Zeilen freigeben kann. Legen Sie `overflowPolicy: "reject-new"` für dauerhafte Eigentumsdatensätze fest, die niemals entfernt werden dürfen: Neue Schlüssel schlagen bei Erreichen eines der Limits fehl, während vorhandene Schlüssel weiterhin aktualisiert werden können.

    `openSyncKeyedStore<T>(...)` gibt dieselbe Speicherstruktur mit synchronen Methoden zurück (`register`, `registerIfAbsent`, `lookup`, `consume`, `clear` geben alle Werte direkt statt Promises zurück), für Aufrufer, die nicht warten können.

    `openChannelIngressQueue<TPayload>(...)` öffnet eine persistierte Eingangswarteschlange, deren Gültigkeitsbereich auf das aufrufende Plugin beschränkt ist, um eingehende Ereignisse zu puffern, die über Neustarts hinweg mindestens einmal verarbeitet werden müssen. Wenn die Wiederherstellung veralteter Ansprüche `shouldRecover` verwendet, geben Sie zusätzlich `shouldRecoverCorrupt` an, falls beschädigte beanspruchte Nutzdaten unter Quarantäne gestellt werden sollen: Die von den Nutzdaten unabhängige Anspruchsidentität ermöglicht dem Plugin, die Richtlinie für aktive Eigentümer und Verarbeitungsspuren beizubehalten, bevor die Warteschlange die Zeile mit einem Löschmarker versieht.

    <Warning>
    `openKeyedStore`, `openSyncKeyedStore` und `openChannelIngressQueue` sind in dieser Version nur für gebündelte Plugins und vertrauenswürdige offizielle Plugin-Installationen verfügbar.
    </Warning>

  </Accordion>
  <Accordion title="api.runtime.channel">
    Kanalspezifische Laufzeit-Hilfsfunktionen (verfügbar, wenn ein Kanal-Plugin geladen ist). Nach Aufgabenbereich gruppiert:

    | Gruppe | Zweck |
    | --- | --- |
    | `text` | Aufteilung (`chunkText`, `chunkMarkdownText`, `resolveChunkMode`), Erkennung von Steuerbefehlen, Konvertierung von Markdown-Tabellen. |
    | `reply` | Versand gepufferter Blockantworten, Umschlagformatierung, Auflösung der effektiven Konfiguration für Nachrichten/menschliche Verzögerung. |
    | `routing` | `buildAgentSessionKey`, `resolveAgentRoute`. |
    | `pairing` | `buildPairingReply`, Lesen der Zulassungsliste, Upserts von Kopplungsanfragen. |
    | `media` | Herunterladen/Speichern entfernter Medien (siehe unten). |
    | `activity` | Letzte Kanalaktivität aufzeichnen/lesen. |
    | `session` | Sitzungsmetadaten aus eingehenden Ereignissen, Aktualisierungen der letzten Route. |
    | `mentions` | Hilfsfunktionen für Erwähnungsrichtlinien (siehe unten). |
    | `reactions` | Handles für Bestätigungsreaktionen als Verarbeitungsindikatoren für laufende Vorgänge. |
    | `groups` | Gruppenrichtlinie und Auflösung der Erwähnungspflicht. |
    | `debounce` | Entprellung eingehender Nachrichten. |
    | `commands` | Befehlsautorisierung und Zugriffssteuerung für Textbefehle. |
    | `outbound` | Ausgehenden Adapter eines Kanals laden. |
    | `inbound` | Kontext für eingehende Ereignisse erstellen und den gemeinsamen Kernel für eingehende Ereignisse/Antworten ausführen. |
    | `threadBindings` | Leerlaufzeitlimit/maximales Alter für gebundene Sitzungsthreads anpassen. |
    | `runtimeContexts` | Prozesslokalen Kontext pro Kanal/Konto/Fähigkeit registrieren, lesen und überwachen. |

    `api.runtime.channel.media` ist die bevorzugte Oberfläche zum Herunterladen und Speichern von Kanalmedien:

    ```typescript
    const saved = await api.runtime.channel.media.saveRemoteMedia({
      url,
      subdir: "inbound",
      maxBytes,
      filePathHint: fileName,
    });
    ```

    Verwenden Sie `saveRemoteMedia(...)`, wenn eine entfernte URL zu einem OpenClaw-Medium werden soll. Verwenden Sie `saveResponseMedia(...)`, wenn das Plugin bereits eine `Response` mit Plugin-eigener Authentifizierung, Weiterleitungs- oder Zulassungslistenbehandlung abgerufen hat. Verwenden Sie `readRemoteMediaBuffer(...)` nur, wenn das Plugin Rohbytes zur Prüfung, Transformation, Entschlüsselung oder zum erneuten Hochladen benötigt. `fetchRemoteMedia(...)` bleibt ein veralteter Kompatibilitätsalias für `readRemoteMediaBuffer(...)`.

    `api.runtime.channel.mentions` ist die gemeinsame Oberfläche für Richtlinien zu eingehenden Erwähnungen für gebündelte Kanal-Plugins, die Laufzeitinjektion verwenden:

    ```typescript
    const mentionMatch = api.runtime.channel.mentions.matchesMentionWithExplicit(text, {
      mentionRegexes,
      mentionPatterns,
    });

    const decision = api.runtime.channel.mentions.resolveInboundMentionDecision({
      facts: {
        canDetectMention: true,
        wasMentioned: mentionMatch.matched,
        implicitMentionKinds: api.runtime.channel.mentions.implicitMentionKindWhen(
          "reply_to_bot",
          isReplyToBot,
        ),
      },
      policy: {
        isGroup,
        requireMention,
        allowTextCommands,
        hasControlCommand,
        commandAuthorized,
      },
    });
    ```

    Verfügbare Hilfsfunktionen für Erwähnungen:

    - `buildMentionRegexes`
    - `matchesMentionPatterns`
    - `matchesMentionWithExplicit`
    - `implicitMentionKindWhen`
    - `resolveInboundMentionDecision`

    `api.runtime.channel.mentions` stellt die älteren Kompatibilitätshilfen `resolveMentionGating*` absichtlich nicht bereit. Bevorzugen Sie den normalisierten Pfad `{ facts, policy }`.

    Mehrere Felder unter `reply`, `session` und `inbound` enthalten feldspezifische `@deprecated`-Hinweise, die auf den aktuellen Kernel für Kanaldurchläufe oder die Adapter für ausgehende Kanalnachrichten verweisen; prüfen Sie das Inline-JSDoc der jeweiligen Hilfsfunktion, bevor Sie neuen Code darauf aufbauen.

  </Accordion>
</AccordionGroup>

## Laufzeitreferenzen speichern

Verwenden Sie `createPluginRuntimeStore`, um die Laufzeitreferenz für die Verwendung außerhalb des `register`-Callbacks zu speichern:

<Steps>
  <Step title="Speicher erstellen">
    ```typescript
    import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
    import type { PluginRuntime } from "openclaw/plugin-sdk/runtime-store";

    const store = createPluginRuntimeStore<PluginRuntime>({
      pluginId: "my-plugin",
      errorMessage: "my-plugin runtime not initialized",
    });
    ```

  </Step>
  <Step title="Mit dem Einstiegspunkt verbinden">
    ```typescript
    export default defineChannelPluginEntry({
      id: "my-plugin",
      name: "My Plugin",
      description: "Example",
      plugin: myPlugin,
      setRuntime: store.setRuntime,
    });
    ```
  </Step>
  <Step title="Aus anderen Dateien darauf zugreifen">
    ```typescript
    export function getRuntime() {
      return store.getRuntime(); // löst einen Fehler aus, wenn nicht initialisiert
    }

    export function tryGetRuntime() {
      return store.tryGetRuntime(); // gibt null zurück, wenn nicht initialisiert
    }
    ```

  </Step>
</Steps>

<Note>
Bevorzugen Sie `pluginId` als Identität des Laufzeitspeichers. Die untergeordnete Form `key` ist für seltene Fälle vorgesehen, in denen ein Plugin absichtlich mehr als einen Laufzeit-Slot benötigt.
</Note>

## Weitere Felder der obersten Ebene von `api`

Zusätzlich zu `api.runtime` stellt das API-Objekt Folgendes bereit:

<ParamField path="api.id" type="string">
  Plugin-ID.
</ParamField>
<ParamField path="api.name" type="string">
  Anzeigename des Plugins.
</ParamField>
<ParamField path="api.config" type="OpenClawConfig">
  Aktueller Konfigurations-Snapshot (sofern verfügbar, der aktive speicherinterne Laufzeit-Snapshot).
</ParamField>
<ParamField path="api.pluginConfig" type="Record<string, unknown>">
  Plugin-spezifische Konfiguration aus `plugins.entries.<id>.config`.
</ParamField>
<ParamField path="api.logger" type="PluginLogger">
  Bereichsgebundener Logger (`debug`, `info`, `warn`, `error`).
</ParamField>
<ParamField path="api.registrationMode" type="PluginRegistrationMode">
  Aktueller Lademodus: `"full"` (Live-Aktivierung), `"discovery"` / `"tool-discovery"` (schreibgeschützte Fähigkeitsermittlung), `"setup-only"` (leichtgewichtiger Einrichtungseinstieg), `"setup-runtime"` (Einrichtungsablauf, der auch den Laufzeiteinstieg des Kanals benötigt) oder `"cli-metadata"` (Erfassung von CLI-Befehlsmetadaten).
</ParamField>
<ParamField path="api.resolvePath(input)" type="(string) => string">
  Einen Pfad relativ zum Plugin-Stammverzeichnis auflösen.
</ParamField>

## Verwandte Themen

- [Plugin-Interna](/de/plugins/architecture) — Fähigkeitsmodell und Registry
- [SDK-Einstiegspunkte](/de/plugins/sdk-entrypoints) — Optionen für `definePluginEntry`
- [SDK-Übersicht](/de/plugins/sdk-overview) — Unterpfadreferenz
