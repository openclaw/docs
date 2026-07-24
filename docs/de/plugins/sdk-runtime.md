---
read_when:
    - Sie müssen Core-Hilfsfunktionen aus einem Plugin aufrufen (TTS, STT, Bildgenerierung, Websuche, Gateway, Subagent, Nodes)
    - Sie möchten verstehen, was `api.runtime` bereitstellt
    - Sie greifen aus Plugin-Code auf Konfigurations-, Agenten- oder Medienhilfsfunktionen zu
sidebarTitle: Runtime helpers
summary: api.runtime -- die injizierten Runtime-Hilfsfunktionen, die Plugins zur Verfügung stehen
title: Hilfsfunktionen für die Plugin-Laufzeit
x-i18n:
    generated_at: "2026-07-24T04:34:37Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 165f8354a480dba8ff1127ed2f79f8bb8f41011ce585987854a9017671ca36cd
    source_path: plugins/sdk-runtime.md
    workflow: 16
---

Referenz für das Objekt `api.runtime`, das bei der Registrierung in jedes Plugin injiziert wird. Verwenden Sie diese Hilfsfunktionen, anstatt Host-Interna direkt zu importieren.

<CardGroup cols={2}>
  <Card title="Channel-Plugins" href="/de/plugins/sdk-channel-plugins">
    Schritt-für-Schritt-Anleitung, die diese Hilfsfunktionen im Kontext von Channel-Plugins verwendet.
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

`api.runtime.version` ist die aktuelle OpenClaw-Produktversion und stammt aus der gemeinsamen Versionsauflösung, sodass Plugins denselben Wert erhalten, den die CLI ausgibt.

## Laden und Schreiben der Konfiguration

Bevorzugen Sie die Konfiguration, die bereits an den aktiven Aufrufpfad übergeben wurde, beispielsweise `api.config` während der Registrierung oder ein `cfg`-Argument bei Channel-/Provider-Callbacks. Dadurch wird ein einzelner Prozess-Snapshot durch den Arbeitsablauf weitergereicht, anstatt die Konfiguration auf häufig ausgeführten Pfaden erneut zu parsen.

Verwenden Sie `api.runtime.config.current()` nur, wenn ein langlebiger Handler den aktuellen Prozess-Snapshot benötigt und dieser Funktion keine Konfiguration übergeben wurde. Der zurückgegebene Wert ist schreibgeschützt; klonen Sie ihn oder verwenden Sie vor der Bearbeitung eine Mutationshilfsfunktion.

Tool-Factories erhalten `ctx.runtimeConfig` sowie `ctx.getRuntimeConfig()`. Verwenden Sie den Getter innerhalb des `execute`-Callbacks eines langlebigen Tools, wenn sich die Konfiguration nach dem Erstellen der Tool-Definition ändern kann.

Persistieren Sie Änderungen mit `api.runtime.config.mutateConfigFile(...)` oder `api.runtime.config.replaceConfigFile(...)`. Bei jedem Schreibvorgang muss eine explizite `afterWrite`-Richtlinie gewählt werden:

- `afterWrite: { mode: "auto" }` überlässt die Entscheidung dem Reload-Planer des Gateways.
- `afterWrite: { mode: "restart", reason: "..." }` erzwingt einen sauberen Neustart, wenn der schreibende Code weiß, dass ein Hot Reload unsicher ist.
- `afterWrite: { mode: "none", reason: "..." }` unterdrückt automatisches Neuladen/Neustarten nur, wenn der Aufrufer die nachfolgenden Schritte verantwortet.

Die Mutationshilfsfunktionen geben `afterWrite` sowie eine typisierte `followUp`-Zusammenfassung zurück, sodass Aufrufer protokollieren oder testen können, ob sie einen Neustart angefordert haben. Das Gateway bestimmt weiterhin, wann dieser Neustart tatsächlich erfolgt.

Verwenden Sie `current()`, ein übergebenes `cfg`, `mutateConfigFile(...)` oder
`replaceConfigFile(...)` für den Zugriff auf und das Schreiben der Laufzeitkonfiguration.

Bevorzugen Sie für direkte SDK-Importe die fokussierten Konfigurations-Unterpfade gegenüber dem allgemeinen `openclaw/plugin-sdk/config-runtime`-Kompatibilitäts-Barrel: `config-contracts` für Typen, `runtime-config-snapshot` für aktuelle Prozess-Snapshots und `config-mutation` für Schreibvorgänge. Lesen Sie eintragsspezifische Werte aus `api.pluginConfig`; verwenden Sie einen bereitgestellten Tool-Kontext nur für dessen laufzeitweiten Konfigurations-Snapshot und führen Sie Plugin-spezifische Zusammenführungen ausschließlich an dieser Grenze durch. Tests gebündelter Plugins sollten diese fokussierten Unterpfade direkt mocken, anstatt das allgemeine Kompatibilitäts-Barrel zu mocken.

Der interne OpenClaw-Laufzeitcode folgt demselben Prinzip: Die Konfiguration wird einmal an der CLI-, Gateway- oder Prozessgrenze geladen und anschließend weitergereicht. Erfolgreiche Mutationsschreibvorgänge aktualisieren den Prozess-Laufzeit-Snapshot und erhöhen dessen interne Revision; langlebige Caches sollten den laufzeiteigenen Cache-Schlüssel verwenden, anstatt die Konfiguration lokal zu serialisieren. Für langlebige Laufzeitmodule gibt es einen Scanner ohne Toleranz für umgebungsabhängige `loadConfig()`-Aufrufe; verwenden Sie ein übergebenes `cfg`, ein Anfrage-`context.getRuntimeConfig()` oder `getRuntimeConfig()` an einer expliziten Prozessgrenze.

Ausführungspfade von Providern und Channels müssen den aktiven Laufzeitkonfigurations-Snapshot verwenden, nicht einen Datei-Snapshot, der zum Zurücklesen oder Bearbeiten der Konfiguration zurückgegeben wurde. Datei-Snapshots bewahren Quellwerte wie SecretRef-Markierungen für die Benutzeroberfläche und Schreibvorgänge; Provider-Callbacks benötigen die aufgelöste Laufzeitansicht. Wenn eine Hilfsfunktion entweder mit dem aktiven Quell-Snapshot oder dem aktiven Laufzeit-Snapshot aufgerufen werden kann, leiten Sie den Zugriff vor dem Lesen von Anmeldedaten durch `selectApplicableRuntimeConfig()`.

## Wiederverwendbare Laufzeit-Dienstprogramme

Verwenden Sie eingehende `botLoopProtection`-Fakten für eingehende, von Bots verfasste Nachrichten. Der Core wendet die gemeinsame speicherinterne Sliding-Window-Schutzvorrichtung vor der Sitzungsaufzeichnung und Weiterleitung an, ohne die Richtlinie an einen einzelnen Channel zu binden. Die Schutzvorrichtung verfolgt `(scopeId, conversationId, participant pair)`-Schlüssel, zählt beide Richtungen eines Paars zusammen, aktiviert eine Abklingzeit, sobald das Fensterbudget überschritten wird, und entfernt inaktive Einträge bei Gelegenheit.

Channel-Plugins, die dieses Verhalten für Betreiber verfügbar machen, sollten die gemeinsame `channels.defaults.botLoopProtection`-Struktur für Basisbudgets bevorzugen und anschließend Channel-/Provider-spezifische Überschreibungen darüberlegen. Die gemeinsame Konfiguration verwendet Sekunden, da sie benutzerseitig sichtbar ist:

```typescript
type ChannelBotLoopProtectionConfig = {
  enabled?: boolean;
  maxEventsPerWindow?: number;
  windowSeconds?: number;
  cooldownSeconds?: number;
};
```

Übergeben Sie normalisierte Bot-Paar-Fakten zusammen mit dem aufgelösten Durchlauf. Der Core löst Standardwerte, Einheitenumrechnung und die `enabled`-Semantik auf:

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

Verwenden Sie `openclaw/plugin-sdk/pair-loop-guard-runtime` direkt nur für benutzerdefinierte
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

    // Standard-Denkniveau abrufen
    const thinking = api.runtime.agent.resolveThinkingDefault({
      cfg,
      provider,
      model,
    });

    // Ein vom Benutzer angegebenes Denkniveau anhand des aktiven Provider-Profils validieren
    const policy = api.runtime.agent.resolveThinkingPolicy({ provider, model });
    const level = api.runtime.agent.normalizeThinkingLevel("extra high");
    if (level && policy.levels.some((entry) => entry.id === level)) {
      // Niveau an einen eingebetteten Lauf übergeben
    }

    // Agenten-Timeout abrufen
    const timeoutMs = api.runtime.agent.resolveAgentTimeoutMs(cfg);

    // Sicherstellen, dass der Workspace vorhanden ist
    await api.runtime.agent.ensureAgentWorkspace(cfg);

    // Einen eingebetteten Agentendurchlauf ausführen
    const result = await api.runtime.agent.runEmbeddedAgent({
      sessionId: "my-plugin:task-1",
      runId: crypto.randomUUID(),
      workspaceDir: api.runtime.agent.resolveAgentWorkspaceDir(cfg, agentId),
      prompt: "Neueste Änderungen zusammenfassen",
      timeoutMs: api.runtime.agent.resolveAgentTimeoutMs(cfg),
    });
    ```

    `runEmbeddedAgent(...)` ist die neutrale Hilfsfunktion zum Starten eines normalen OpenClaw-Agentendurchlaufs aus Plugin-Code. Sie verwendet dieselbe Provider-/Modellauflösung und Agent-Harness-Auswahl wie durch Channels ausgelöste Antworten.

    `runEmbeddedPiAgent(...)` bleibt als veralteter Kompatibilitätsalias für bestehende Plugins erhalten. Neuer Code sollte `runEmbeddedAgent(...)` verwenden.

    `resolveCliBackendDispatchEligibility({ provider, model, agentId, authProfileId, config, agentDir, workspaceDir })` stellt Aufrufern, die eingebettete Läufe für `cliBackendDispatch: "subscription-auth"` aktivieren, die Entscheidung des eingebetteten Runners zur Weiterleitung an das CLI-Backend bereit (Route, die vom Backend deklarierte `subscriptionAuthDispatch`-Fähigkeit und gespeicherter Anmeldedatenmodus – unter Berücksichtigung eines ausdrücklich festgelegten `authProfileId`). Es gibt `{ provider }` zurück, wenn der Lauf über das CLI-Backend ausgeführt würde, und `undefined`, wenn er bei der direkten Durchleitung verbleibt, sodass Aufrufer Timeouts für den Lauf einplanen können, der tatsächlich ausgeführt wird.

    `resolveThinkingPolicy(...)` gibt die unterstützten Denkniveaus des Providers/Modells sowie optional den Standardwert zurück. Provider-Plugins verwalten das modellspezifische Profil über ihre Denk-Hooks. Daher sollten Tool-Plugins diese Laufzeit-Hilfsfunktion aufrufen, anstatt Provider-Listen zu importieren oder zu duplizieren.

    `normalizeThinkingLevel(...)` konvertiert Benutzereingaben wie `on`, `x-high` oder `extra high` in das kanonisch gespeicherte Niveau, bevor es anhand der aufgelösten Richtlinie geprüft wird.

    **Hilfsfunktionen für den Sitzungsspeicher** befinden sich unter `api.runtime.agent.session`:

    ```typescript
    const entry = api.runtime.agent.session.getSessionEntry({ agentId, sessionKey });
    for (const { sessionKey, entry } of api.runtime.agent.session.listSessionEntries({ agentId })) {
      // Sitzungszeilen durchlaufen, ohne von der veralteten sessions.json-Struktur abzuhängen.
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

    Bevorzugen Sie `getSessionEntry(...)`, `listSessionEntries(...)`, `patchSessionEntry(...)` oder `upsertSessionEntry(...)` für Sitzungsabläufe. Diese Hilfsfunktionen adressieren Sitzungen anhand der Agenten-/Sitzungsidentität, sodass Plugins nicht von der veralteten `sessions.json`-Speicherstruktur abhängen. Verwenden Sie `preserveActivity: true` für reine Metadaten-Patches, die die Sitzungsaktivität nicht aktualisieren sollen, und `replaceEntry: true` nur, wenn der Callback einen vollständigen Eintrag zurückgibt und gelöschte Felder gelöscht bleiben müssen. Doctor- und Migrationspfade können `fallbackEntry`, `skipMaintenance` und `requireWriteSuccess` für eine einzelne atomare Reparatur des kanonischen Speichers kombinieren.

    `createSessionEntry(...)` erstellt eine neue kanonische Sitzungszeile und ein Transkript. Die vertrauenswürdige `initialEntry`-Oberfläche ist bewusst eingeschränkt: ein nicht leeres `agentHarnessId`, optional `modelSelectionLocked: true` und optional `pluginExtensions`. Die injizierte Laufzeit akzeptiert über `registerAgentHarness(...)` nur Harness-IDs, die dem aufrufenden Plugin gehören; dies ist eine Eigentumsinvariante und keine Sandbox zwischen prozessinternen Plugins. Eine bereits vorhandene Zeile wird abgelehnt; `label` und `spawnedCwd` sind separate Erstellungsfelder und keine vertrauenswürdigen Eintrags-Patches.

    Die Erstellung hält den Mutationsschutz für den Sitzungslebenszyklus über `afterCreate`, sodass neue Arbeit wartet, bis die Plugin-eigene Initialisierung abgeschlossen ist, und bereits zuvor zugelassene Arbeit die Erstellung fehlschlagen lässt. Der Callback erhält einen Klon des erstellten Zustands. Wenn er einen Patch zurückgibt, darf dieser ausschließlich `pluginExtensions` enthalten, und dessen Wert ist das vollständige endgültige Feld `pluginExtensions`. Ein Fehler im Callback oder bei der endgültigen Persistierung setzt die unveränderte neue Zeile und das Transkript zurück; ein geschütztes Rollback bewahrt eine Zeile, die gleichzeitig geändert oder beansprucht wurde. `recoverMatchingInitialEntry: true` dient ausschließlich dazu, eine unterbrochene Initialisierung erneut zu versuchen, wenn die persistierten vertrauenswürdigen Felder exakt übereinstimmen, und die Wiederherstellung erfordert, dass `afterCreate` einen endgültigen Patch zurückgibt.

    Verwenden Sie `runWithWorkAdmission(...)`, wenn ein Plugin Arbeit an einer persistierten Sitzung startet. Der Callback lehnt archivierte oder gleichzeitig ersetzte Sitzungen ab, koordiniert Archivierungs-, Zurücksetzungs- und Löschmutationen bis zum Abschluss und erhält ein `AbortSignal`, das an den Agentenlauf weitergegeben werden muss. Ein Harness kann über sein experimentelles Registrierungsfeld `delegatedExecutionPluginIds` ausdrücklich vertrauenswürdige Ausführungsdelegierte benennen. Delegierte können ausschließlich eine exakt vorhandene, modellgesperrte Sitzung zulassen und ausführen; sämtliche Sitzungsmutationen bleiben auf den Harness-Eigentümer beschränkt. Siehe [Agent-Harness-Plugins](/de/plugins/sdk-agent-harness#delegated-execution).

    Wartungs- und Reparatur-Plugins können `deleteSessionEntry(...)` für einen einzelnen sitzungsbezogenen Eintrag, `cleanupSessionLifecycleArtifacts(...)` für vom Lebenszyklus verwaltete temporäre Sitzungen und `resolveSessionStoreBackupPaths(...)` vor dem Ändern eines Speichers verwenden. Übergeben Sie `expectedSessionId` und `expectedUpdatedAt`, wenn das Löschen nicht mit einer gleichzeitigen Sitzungsaktualisierung in Konflikt geraten darf; verwenden Sie `expectedSessionId: null`, wenn der frühere Snapshot keine Sitzungs-ID enthielt. Diese Hilfsfunktionen sind eng begrenzte Reparatur-/Lebenszyklus-Schnittstellen und keine allgemeine API zum Löschen von Speichern.

    `resolveStorePath(...)` und `updateSessionStoreEntry(...)` vervollständigen die Sitzungshilfsfunktionen: `resolveStorePath` löst den Pfad des Sitzungsspeichers für einen bestimmten Geltungsbereich auf, und `updateSessionStoreEntry({ storePath, sessionKey, update })` aktualisiert einen Eintrag direkt anhand des Speicherpfads, wenn der Aufrufer diesen bereits kennt.

    `loadTranscriptEventsSync(...)` steht für synchrone Doctor- und Reparaturpfade zur Verfügung, die die asynchrone Transkript-Laufzeit nicht verwenden können. Die Funktion gibt rohe `SessionStoreTranscriptEvent`-Datensätze zurück. Normaler Plugin-Laufzeitcode sollte `openclaw/plugin-sdk/session-transcript-runtime` bevorzugen.

    `formatSqliteSessionFileMarker(...)`, `parseSqliteSessionFileMarker(...)` und `sqliteSessionFileMarkerMatchesSession(...)` sind Übergangshilfen für Code, der noch ein Legacy-Feld namens `sessionFile` empfängt. Eine geparste SQLite-Markierung identifiziert ein aktives SQLite-Transkriptziel; sie ist kein Dateisystempfad. Neue APIs sollten eine typisierte Sitzungsidentität statt Markierungszeichenfolgen übertragen.

    Importieren Sie für Lese- und Schreibvorgänge an Transkripten `openclaw/plugin-sdk/session-transcript-runtime` und verwenden Sie `resolveSessionTranscriptIdentity(...)`, `resolveSessionTranscriptTarget(...)`, `readSessionTranscriptEvents(...)`, `readSessionTranscriptRawDelta(...)`, `readSessionTranscriptVisibleMessageDelta(...)`, `readVisibleSessionTranscriptMessageEntries(...)`, `appendSessionTranscriptMessageByIdentity(...)`, `publishSessionTranscriptUpdateByIdentity(...)` oder `withSessionTranscriptWriteLock(...)` mit `{ agentId, sessionKey, sessionId }`. Mit diesen APIs können Plugins ein Transkript identifizieren, rohe Ereignisse oder sichtbare, zweigsichere Nachrichteneinträge lesen, Nachrichten anhängen, Aktualisierungen veröffentlichen und zugehörige Vorgänge unter derselben Transkript-Schreibsperre ausführen, ohne von aktiven Transkriptdateipfaden abhängig zu sein. `readVisibleSessionTranscriptMessageEntries(...)` gibt geordnete Lesemetadaten zurück; das Feld `seq` ist kein fortsetzbarer Cursor.

    `readSessionTranscriptRawDelta(...)` gibt ein begrenztes Ergebnis vom Typ `page`, `reset` oder `missing` zurück. Übergeben Sie den opaken `page.cursor` beim nächsten Aufruf. Reine Anhängevorgänge erhalten den Cursor, während das Ersetzen des Transkripts `reset` mit einem neuen Bootstrap-Cursor zurückgibt. Seiten umfassen standardmäßig 1,000 Ereignisse und 1,000,000 serialisierte Bytes; Aufrufer können bis zu 10,000 Ereignisse und 64 MiB anfordern. Wenn bereits das nächste Ereignis `maxBytes` überschreitet, ist die Seite leer und meldet `requiredBytes`; wiederholen Sie den Vorgang mindestens mit diesem Byte-Limit, sofern es nicht größer als 64 MiB ist. Größere Einzelereignisse erfordern die API zum vollständigen Lesen. Ein Cursor identifiziert nur eine Position und gewährt niemals Zugriff auf eine andere Sitzung.

    `readSessionTranscriptVisibleMessageDelta(...)` bietet dieselbe begrenzte Bootstrap-und-Fortsetzungsstruktur für die vom Host verwaltete aktive Nachrichtenprojektion. Die Funktion gibt Nachrichten von der ältesten bis zur neuesten zurück, sodass Kontext-Engines den anfänglichen Verlauf vollständig verarbeiten und den opaken Cursor als ihre Fortschrittsmarke speichern können. Speichern Sie den Cursor unverändert und geben Sie ihn unverändert zurück; er ist ein Fortsetzungshinweis und kein Autorisierungsnachweis. Lineare Anhängevorgänge werden nach der zuletzt zurückgegebenen Nachricht fortgesetzt. Das Ersetzen des Transkripts, ein Cursor, dessen Anker den aktiven Zweig verlassen oder sich innerhalb dieses Zweigs verschoben hat, fehlerhafte Cursor und sitzungsübergreifende Cursor geben `reset` mit einem neuen Bootstrap-Cursor zurück. Die Standardwerte und Obergrenzen für Anzahl und Bytes entsprechen der Rohdaten-Delta-API. Während die aktive Projektion nach einer Zweigänderung neu aufgebaut wird, lautet das Ergebnis `unavailable` mit dem Grund `projection_rebuilding`; versuchen Sie es später erneut, statt auf eine aktive Transkriptdatei zurückzufallen.

    Die bisherigen Hilfsfunktionen für den gesamten Speicher und aktive Transkriptdateien werden nicht mehr aus dem Plugin-SDK exportiert. Verwenden Sie die auf einen Geltungsbereich beschränkten Eintragshilfen für Sitzungsmetadaten und die Transkriptidentitäts-Hilfen für Vorgänge am aktiven Transkript. Archivierungs-/Support-Workflows, die Dateiartefakte benötigen, sollten ihre dedizierten Archivschnittstellen statt der Laufzeit-APIs für aktive Sitzungen verwenden.

  </Accordion>
  <Accordion title="api.runtime.agent.defaults">
    Konstanten für das Standardmodell und den Standard-Provider:

    ```typescript
    const model = api.runtime.agent.defaults.model; // z. B. "gpt-5.6-sol"
    const provider = api.runtime.agent.defaults.provider; // z. B. "openai"
    ```

  </Accordion>

  <Accordion title="api.runtime.llm">
    Führen Sie eine vom Host verwaltete Textvervollständigung aus, ohne Provider-Interna zu importieren oder
    die Modell-/Authentifizierungs-/Basis-URL-Vorbereitung von OpenClaw zu duplizieren.

    ```typescript
    const result = await api.runtime.llm.complete({
      messages: [{ role: "user", content: "Fassen Sie dieses Transkript zusammen." }],
      purpose: "my-plugin.summary",
      maxTokens: 512,
      temperature: 0.2,
      reasoning: "high",
    });
    ```

    Die Provider-Orchestrierung kann außerdem den konfigurierten Lebenszyklus des lokalen Dienstes
    beziehen, bevor eine HTTP-Anfrage gesendet wird:

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
      // Senden und verarbeiten Sie die Provider-Anfrage vollständig.
    } finally {
      await lease?.release();
    }
    ```

    `acquireLocalService(...)` ist ein stabiler, generischer SDK-Vertrag für Provider-Dienste.
    Der Host löst die Prozesskonfiguration aus
    `models.providers.<providerId>.localService` auf; Aufrufer können weder
    einen Befehl noch Argumente, eine Umgebung oder Lebenszyklusrichtlinien angeben. Prozesserzeugung,
    Bereitschaft, Diagnose und Leerlauf-Stopp-Richtlinien bleiben intern im Host.

    Übergeben Sie die exakte konfigurierte Provider-ID und die aufgelöste Basis-URL der Anfrage. Ersetzen Sie
    Aliasse nicht durch eine Adapter-ID: Unterschiedliche Aliasse können auf unterschiedliche
    lokale GPU-Hosts verweisen. Der Host lehnt Endpunkte ab, die nicht mit der konfigurierten
    Provider-Basis-URL übereinstimmen, abgesehen von der von Ollama- und LM-Studio-Adaptern verwendeten
    `/v1`-Normalisierung. Der Host verwaltet die Serialisierung des Starts, Bereitschaftstests,
    Anfrage-Leases, Abbruchbehandlung und das Herunterfahren bei Inaktivität.

    Die Hilfsfunktion verwendet denselben Vorbereitungspfad für einfache Vervollständigungen wie die
    integrierte OpenClaw-Laufzeit und den vom Host verwalteten Snapshot der Laufzeitkonfiguration. Kontext-Engines
    erhalten eine sitzungsgebundene `llm.complete`-Fähigkeit, sodass Modellaufrufe den
    Agenten der aktiven Sitzung verwenden und nicht stillschweigend auf den Standardagenten zurückfallen. Das
    Ergebnis enthält die Zuordnung zu Provider, Modell und Agent sowie normalisierte Angaben zur Token- und
    Cache-Nutzung und, sofern verfügbar, zur geschätzten Kostennutzung.

    Setzen Sie `reasoning`, um einen Reasoning-Aufwand für das ausgewählte Modell anzufordern. Der
    Host normalisiert die kanonischen Denkstufen (`off`, `minimal`, `low`,
    `medium`, `high`, `xhigh`, `adaptive`, `max` und `ultra`) für den ausgewählten
    Provider und das ausgewählte Modell, bevor die Vervollständigung weitergeleitet wird. `adaptive` wird zu
    `medium`; `max` und `ultra` werden, sofern unterstützt, zu `max`, andernfalls zu `xhigh`.

    <Warning>
    Modellüberschreibungen erfordern die Zustimmung des Betreibers über `plugins.entries.<id>.llm.allowModelOverride: true` in der Konfiguration. Verwenden Sie `plugins.entries.<id>.llm.allowedModels`, um vertrauenswürdige Plugins auf bestimmte kanonische `provider/model`-Ziele zu beschränken. Agentenübergreifende Vervollständigungen erfordern `plugins.entries.<id>.llm.allowAgentIdOverride: true`.
    </Warning>

  </Accordion>
  <Accordion title="api.runtime.gateway">
    Rufen Sie eine andere Gateway-Methode prozessintern auf und bewahren Sie dabei die vertrauenswürdige Laufzeitidentität
    des aktuellen Plugins. Dies ist für mitgelieferte oder vertrauenswürdige offizielle Plugins vorgesehen, die Plugin-eigene
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
    `details`-Daten, Metadaten zu Wiederholungsversuchen und der Gateway-Fehlercode für Wiederherstellungsabläufe erhalten bleiben. Verwenden Sie `isAvailable()`,
    bevor Sie diesen Pfad aus Tools auswählen, die auch in eigenständigen Agentenprozessen ausgeführt werden können.

  </Accordion>
  <Accordion title="api.runtime.subagent">
    Starten und verwalten Sie Subagent-Hintergrundläufe.

    ```typescript
    // Einen Subagent-Lauf starten
    const { runId } = await api.runtime.subagent.run({
      sessionKey: "agent:main:subagent:search-helper",
      message: "Erweitern Sie diese Abfrage zu gezielten nachfolgenden Suchanfragen.",
      toolsAlsoAllow: ["my_plugin_progress"],
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
    Modellüberschreibungen (`provider`/`model`) erfordern die Zustimmung des Betreibers über `plugins.entries.<id>.subagent.allowModelOverride: true` in der Konfiguration. Nicht vertrauenswürdige Plugins können weiterhin Subagenten ausführen, Überschreibungsanfragen werden jedoch abgelehnt.
    </Warning>

    `toolsAlsoAllow` fügt der normalen Tool-Oberfläche des Workers exakt benannte, ausschließlich dem aufrufenden Plugin zugeordnete Tools hinzu. Die Laufzeit lehnt Core-Tools und Namen ab, die mit einem anderen Plugin geteilt werden. Profile und Tool-Richtlinien des Betreibers gelten weiterhin, einschließlich expliziter Positiv- und Sperrlisten.

    `deleteSession(...)` kann Sitzungen löschen, die dasselbe Plugin über `api.runtime.subagent.run(...)` erstellt hat. Das Löschen beliebiger Benutzer- oder Betreibersitzungen erfordert weiterhin eine Gateway-Anfrage mit Administrator-Geltungsbereich.

  </Accordion>
  <Accordion title="api.runtime.sandbox">
    Prüfen Sie die effektive Sandbox-Arbeitsbereichsberechtigung für eine Agentensitzung.

    ```typescript
    const authority = api.runtime.sandbox.resolveWorkspaceAuthority({
      config: cfg,
      agentId,
      sessionKey,
    });

    const liveAuthority = await api.runtime.sandbox.prepareWorkspaceAuthority({
      config: cfg,
      agentId,
      sessionKey,
      workspaceDir,
      confinedToolNames: ["my_plugin_safe_tool"],
    });
    ```

    Das Ergebnis gibt an, ob diese Sitzung in einer Sandbox ausgeführt wird, ob ihr Arbeitsbereich
    nicht verfügbar, schreibgeschützt oder beschreibbar ist, sowie optional `confinementError`,
    wenn die effektive Docker-, Tool-, Sitzungs-, Browser- oder erweiterte Richtlinie
    diesen Arbeitsbereich verlassen kann. Verwenden Sie dies für vom Host verwaltete Delegierungsentscheidungen, die
    einem Worker nicht mehr Berechtigungen gewähren dürfen als seinem Aufrufer. Es handelt sich um eine Nachweis-
    hilfsfunktion und nicht um einen Ersatz für die Überprüfung der eigenen Autorisierung des Aufrufers.

    `prepareWorkspaceAuthority(...)` führt dieselbe Richtlinienprüfung durch und
    bereitet außerdem die Docker-Sandbox für `workspaceDir` vor. Die Funktion lehnt einen laufenden Container ab,
    dessen Hash der aktiven Konfiguration nicht mit den angeforderten Einbindungen oder Richtlinien übereinstimmt. Übergeben Sie
    ausschließlich exakte Tool-Namen, deren registrierte Implementierungen durch das aufrufende Plugin
    begrenzt werden; Platzhalterpräfixe belegen keine Tool-Zuständigkeit.

  </Accordion>
  <Accordion title="api.runtime.nodes">
    Listen Sie verbundene Nodes auf und rufen Sie einen vom Node-Host bereitgestellten Befehl aus vom Gateway geladenem Plugin-Code oder aus Plugin-CLI-Befehlen auf. Verwenden Sie dies, wenn ein Plugin lokale Arbeiten auf einem gekoppelten Gerät verwaltet, beispielsweise eine Browser- oder Audio-Bridge auf einem anderen Mac.

    ```typescript
    const { nodes } = await api.runtime.nodes.list({ connected: true });

    const result = await api.runtime.nodes.invoke({
      nodeId: "mac-studio",
      command: "my-plugin.command",
      params: { action: "start" },
      timeoutMs: 30000,
    });
    ```

    `nodes.list(...)` enthält die angekündigten
    `nodePluginTools`-Deskriptoren jedes verbundenen Nodes, wenn dieser Node Plugin- oder MCP-gestützte
    Tools für den Agenten bereitstellt. Diese Deskriptoren sind Teil des aktiven Verbindungszustands: Das Gateway
    entfernt sie, wenn der Node die Verbindung trennt, und ein Node kann sie nach Änderungen am lokalen Plugin-/MCP-Inventar
    durch `node.pluginTools.update` ersetzen.

    Im Gateway läuft diese Runtime prozessintern. In Plugin-CLI-Befehlen ruft sie den konfigurierten Gateway über RPC auf, sodass Befehle wie `openclaw googlemeet recover-tab` gekoppelte Nodes vom Terminal aus untersuchen können. Node-Befehle durchlaufen weiterhin die reguläre Gateway-Node-Kopplung, Befehls-Positivlisten, Node-Aufrufrichtlinien der Plugins und die lokale Befehlsverarbeitung des Nodes.

    Plugins, die auf Nodes gehostete Agent-Tools bereitstellen, können `agentTool.defaultPlatforms` für ungefährliche Befehle festlegen, die standardmäßig in die Positivliste aufgenommen werden sollen. Lassen Sie es weg, wenn Betreiber die Befehle explizit mit `gateway.nodes.commands.allow` freigeben müssen. Gefährliche, auf Nodes gehostete Befehle sollten mit `api.registerNodeInvokePolicy(...)` eine Node-Aufrufrichtlinie registrieren; die Richtlinie wird im Gateway nach den Prüfungen der Befehls-Positivliste und vor der Weiterleitung des Befehls an den Node ausgeführt, sodass direkte `node.invoke`-Aufrufe, auf Nodes gehostete Plugin-Tools und übergeordnete Plugin-Tools denselben Durchsetzungspfad verwenden.

    <Warning>
    Das optionale Feld `scopes` fordert für den Aufruf Gateway-Betreiberberechtigungsbereiche an. OpenClaw berücksichtigt es nur für gebündelte Plugins und vertrauenswürdige Installationen offizieller Plugins; Anforderungen anderer Plugins erhöhen die Berechtigungen des Aufrufs nicht. Verwenden Sie es nur, wenn ein vertrauenswürdiges Plugin einen Node-Befehl mit einem strengeren Gateway-Berechtigungsbereich wie `operator.admin` aufrufen muss.
    </Warning>

  </Accordion>
  <Accordion title="api.runtime.tasks">
    Verknüpft den Zustand von Task Flow und Task Run mit einem vorhandenen OpenClaw-Sitzungsschlüssel oder einem vertrauenswürdigen Tool-Kontext.

    - `api.runtime.tasks.managedFlows` kann Änderungen vornehmen: Task Flows erstellen, fortsetzen und abbrechen.
    - `api.runtime.tasks.flows` und `api.runtime.tasks.runs` sind schreibgeschützte DTO-Ansichten für Auflistungen und Statusabfragen; beide stellen `bindSession(...)` / `fromToolContext(...)` sowie `get`, `list`, `findLatest` und `resolve` bereit.

    Task Flow verfolgt den dauerhaften Zustand mehrstufiger Arbeitsabläufe. Es ist kein Scheduler:
    Verwenden Sie Cron oder `api.session.workflow.scheduleSessionTurn(...)` für zukünftige
    Aktivierungen und anschließend `managedFlows` im geplanten Durchlauf, wenn diese Arbeit
    Ablaufzustand, untergeordnete Aufgaben, Wartezustände oder Abbruchmöglichkeiten benötigt.

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

    Verwenden Sie `bindSession({ sessionKey, requesterOrigin })`, wenn Sie bereits über einen vertrauenswürdigen OpenClaw-Sitzungsschlüssel aus Ihrer eigenen Bindungsschicht verfügen. Erstellen Sie keine Bindung aus unbearbeiteten Benutzereingaben.

  </Accordion>
  <Accordion title="api.runtime.tts">
    Sprachsynthese aus Text.

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

    Verwendet die zentrale `tts`-Konfiguration und Provider-Auswahl. Gibt einen PCM-Audiopuffer und die Abtastrate zurück. `textToSpeechStream` ist ebenfalls für die Streaming-Synthese verfügbar.

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
      mime: "audio/ogg", // optional, wenn MIME nicht abgeleitet werden kann
    });

    // Ein Video beschreiben
    const video = await api.runtime.mediaUnderstanding.describeVideoFile({
      filePath: "/tmp/inbound-video.mp4",
      cfg: api.config,
    });

    // Generische Dateianalyse
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
        { type: "text", text: "Die gedruckte Gesamtsumme gegenüber handschriftlichen Notizen bevorzugen." },
      ],
      instructions: "Verkäufer, Gesamtsumme und durchsuchbare Tags extrahieren.",
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

    Gibt `{ text: undefined }` zurück, wenn keine Ausgabe erzeugt wird (z. B. bei übersprungener Eingabe).

    `describeImageFileWithModel(...)` beschreibt ein bereits bekanntes Bild über einen bestimmten Provider/ein bestimmtes Modell und umgeht dabei die standardmäßige Auflösung des aktiven Modells, die `describeImageFile(...)` verwendet.

  </Accordion>
  <Accordion title="api.runtime.imageGeneration">
    Bilderzeugung.

    ```typescript
    const result = await api.runtime.imageGeneration.generate({
      prompt: "Ein Roboter, der einen Sonnenuntergang malt",
      cfg: api.config,
    });

    const providers = api.runtime.imageGeneration.listProviders({ cfg: api.config });
    ```

  </Accordion>
  <Accordion title="api.runtime.videoGeneration">
    Videoerzeugung nach demselben Schema wie die Bilderzeugung.

    ```typescript
    const result = await api.runtime.videoGeneration.generate({
      prompt: "Eine Drohnenaufnahme, die bei Sonnenaufgang über eine Küste fliegt",
      cfg: api.config,
    });

    const providers = api.runtime.videoGeneration.listProviders({ cfg: api.config });
    ```

  </Accordion>
  <Accordion title="api.runtime.musicGeneration">
    Musikerzeugung nach demselben Schema wie die Bilderzeugung.

    ```typescript
    const result = await api.runtime.musicGeneration.generate({
      prompt: "Ein beschwingter Lo-Fi-Titel für eine Programmiersitzung",
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
    Aktueller Snapshot der Runtime-Konfiguration und transaktionale Konfigurationsschreibvorgänge. Bevorzugen Sie
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
    der die Absicht des Schreibers aufzeichnet, ohne dem
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

    `runHeartbeatOnce(...)` führt sofort einen einzelnen Heartbeat-Zyklus aus und umgeht dabei den normalen Zusammenführungstimer. Übergeben Sie `{ heartbeat: { target: "last" } }`, um die Zustellung an den zuletzt aktiven Kanal zu erzwingen, anstatt die standardmäßige `target: "none"`-Unterdrückung anzuwenden.

    `runCommandWithTimeout(...)` gibt erfasste Werte für `stdout` und `stderr`, optionale
    Kürzungsanzahlen, `code`, `signal`, `killed`, `termination` und
    `noOutputTimedOut` zurück. Ergebnisse bei Zeitüberschreitung und Ausbleiben einer Ausgabe melden `code: 124`,
    wenn der untergeordnete Prozess keinen von null verschiedenen Exit-Code bereitstellt. Durch Signale verursachte Beendigungen
    ohne Zeitüberschreitung können dennoch `code: null` zurückgeben; verwenden Sie daher `termination` und
    `noOutputTimedOut`, um die Gründe für Zeitüberschreitungen zu unterscheiden.

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

    // Aufrufbereite Authentifizierung einschließlich Provider-Runtime-Austauschvorgängen (z. B. OAuth-Aktualisierung)
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
    await store.deleteIf?.("key-1", (current) => current.value === "hello");
    await store.consume("key-1");
    await store.clear();

    const blobs = api.runtime.state.openBlobStore<MyBlobMetadata>({
      namespace: "rendered-artifacts",
      maxEntries: 100,
      maxBytesPerEntry: 4 * 1024 * 1024,
      maxBytesPerNamespace: 64 * 1024 * 1024,
      defaultTtlMs: 15 * 60_000,
    });
    await blobs.register(
      "artifact-1",
      new TextEncoder().encode("binary or text payload"),
      { contentType: "text/plain" },
    );
    const blob = await blobs.lookup("artifact-1");

    await api.runtime.state.withLease(
      {
        namespace: "my-feature",
        key: "writer",
        database: { scope: "agent", agentId },
        leaseMs: 5 * 60_000,
        waitMs: 30_000,
      },
      async ({ signal, assertOwned }) => {
        await runExternalWriter({ signal });
        assertOwned();
      },
    );
    ```

    Schlüsselbasierte Speicher überstehen Neustarts und werden anhand der an die Laufzeit gebundenen Plugin-ID isoliert. Verwenden Sie `registerIfAbsent(...)` für atomare Deduplizierungsansprüche: Die Methode gibt `true` zurück, wenn der Schlüssel fehlte oder abgelaufen war und registriert wurde, beziehungsweise `false`, wenn bereits ein gültiger Wert vorhanden ist, ohne dessen Wert, Erstellungszeitpunkt oder TTL zu überschreiben. Verwenden Sie `deleteIf(...)`, wenn bei der Bereinigung ausschließlich der zuvor beobachtete Wert entfernt werden darf; das synchrone Prädikat und die Löschung werden in einer einzigen SQLite-Transaktion ausgeführt. Grenzwerte: `maxEntries` pro Namespace, 50,000 gültige Zeilen pro Plugin, JSON-Werte unter 64KB und optionaler TTL-Ablauf. Standardmäßig entfernt ein Schreibvorgang bei Erreichen eines der beiden Zeilengrenzwerte die ältesten gültigen Zeilen aus dem Namespace, in den geschrieben wird; benachbarte Namespaces werden für diesen Schreibvorgang nicht bereinigt, und der Schreibvorgang schlägt weiterhin fehl, wenn im Namespace nicht genügend Zeilen freigegeben werden können. Legen Sie `overflowPolicy: "reject-new"` für dauerhafte Eigentumsdatensätze fest, die niemals entfernt werden dürfen: Neue Schlüssel schlagen bei Erreichen eines der beiden Grenzwerte fehl, während vorhandene Schlüssel weiterhin aktualisiert werden können.

    `openSyncKeyedStore<T>(...)` gibt dieselbe Speicherstruktur mit synchronen Methoden zurück (`register`, `registerIfAbsent`, `deleteIf`, `lookup`, `consume`, `clear` geben Werte direkt statt Promises zurück), wenn Aufrufer nicht auf Ergebnisse warten können.

    `openBlobStore<TMetadata>(...)` speichert begrenzte binäre Nutzdaten in der gemeinsamen SQLite-Datenbank, ohne Base64 oder Datei-Sidecars zu verwenden. Die Methode erfordert Byte- und Zeilengrenzwerte pro Eintrag und pro Namespace, kopiert Byte-Arrays an der API-Grenze und listet Metadaten auf, ohne jedes BLOB zu laden. `register(...)` ist ein explizites Upsert, auch für abgelaufene Schlüssel. `registerIfAbsent(...)` ermöglicht eine kollisionssichere Erstellung: Ein abgelaufener Schlüssel bleibt belegt, bis sein Eigentümer ihn mit `deleteExpiredKey(key)` oder `deleteExpired()` beansprucht. Dadurch bleiben die Metadaten erhalten, die benötigt werden, um zugehörige benannte Artefakte nach dem SQLite-Commit zu entfernen. Jede Zeile mit einer TTL ist temporär und wird bereits vor ihrem Ablauf von Sicherung und Wiederherstellung ausgeschlossen; lassen Sie die TTL für dauerhaften, wiederherstellbaren Zustand weg. Host-Sicherungen begrenzen jedes BLOB auf 100 MiB, jedes Plugin auf 512 MiB physisch gespeicherter BLOBs und jedes Plugin auf 50,000 physisch gespeicherte Zeilen, einschließlich abgelaufener Zeilen, die auf die Bereinigung durch den Eigentümer warten. Verwenden Sie `registerIfAbsent(...)` zusammen mit `overflowPolicy: "reject-new"`, wenn externe Materialisierungen durch Ersetzung oder Entfernung nicht unbemerkt verwaisen dürfen.

    `openChannelIngressQueue<TPayload>(...)` öffnet eine persistierte Eingangs-Warteschlange mit Gültigkeitsbereich für das aufrufende Plugin, um eingehende Ereignisse zwischenzuspeichern, die über Neustarts hinweg mindestens einmal verarbeitet werden müssen. Wenn die Wiederherstellung veralteter Ansprüche `shouldRecover` verwendet, geben Sie zusätzlich `shouldRecoverCorrupt` an, falls beschädigte beanspruchte Nutzdaten unter Quarantäne gestellt werden sollen: Die von den Nutzdaten unabhängige Anspruchsidentität ermöglicht es dem Plugin, die Richtlinien des aktiven Eigentümers und der Lane zu bewahren, bevor die Warteschlange die Zeile mit einem Tombstone versieht.

    `withLease(...)` serialisiert kooperative Plugin-Arbeit über OpenClaw-Prozesse hinweg. Wählen Sie `database: { scope: "shared" }` für einen einzigen globalen Eigentümer oder `{ scope: "agent", agentId }` für unabhängige Eigentümerschaft pro Agent. Leiten Sie `AbortSignal` des Callbacks an jede fehleranfällige Operation weiter. `assertOwned()` ist ein zeitpunktbezogener Prüfpunkt, bevor ein weiterer wichtiger Schritt gestartet wird; der Host überprüft die Eigentümerschaft auch nach dem Callback. Der Verlust der Lease oder ein Abbruch durch den Aufrufer bricht das Signal ab. Das Warten auf den Erwerb und Heartbeats erfolgen außerhalb kurzer synchroner SQLite-Transaktionen; Plugins erhalten niemals Datenbankpfade oder Handles. Dies ist ein kooperativer Abbruch, kein Fencing-Token und keine Autorisierung für externe Schreibvorgänge ohne Fencing.

    `openChannelIngressDrain(...)` öffnet den kanalunabhängigen Core-Worker über dieser Warteschlange (oder erstellt eine Warteschlange, wenn keine bereitgestellt wurde). Der Drain ist für die Wiederherstellung veralteter Ansprüche, die Serialisierung von Ansprüchen pro Lane, den Abschluss bei Übernahme oder nach Rückkehr des Dispatch-Aufrufs, die Wiederholungs-/Dead-Letter-Behandlung, die optionale Ablösung vor der Übernahme und das Zeitlimit für einen Stillstand zwischen Anspruch und Übernahme verantwortlich. Binden Sie die Eigentümerschaft des Anspruchs mit `turnAdoptionLifecycle` in die Antwortgenerierung ein (über `bindIngressLifecycleToReplyOptions` aus `plugin-sdk/channel-outbound`). Kanal-Plugins behalten die akzeptanzseitige Einreihung, die Lane-Ableitung, die Klassifizierung nicht wiederholbarer Fehler und sämtliche Autorisierungsrichtlinien für Ablösungen bei.

    <Warning>
    `openBlobStore`, `openKeyedStore`, `openSyncKeyedStore`, `withLease`, `openChannelIngressQueue` und `openChannelIngressDrain` stehen in dieser Version nur gebündelten Plugins und vertrauenswürdigen offiziellen Plugin-Installationen zur Verfügung.
    </Warning>

  </Accordion>
  <Accordion title="api.runtime.channel">
    Kanalspezifische Laufzeithilfen (verfügbar, wenn ein Kanal-Plugin geladen ist). Nach Aufgabenbereich gruppiert:

    | Gruppe | Zweck |
    | --- | --- |
    | `text` | Aufteilung (`chunkText`, `chunkMarkdownText`, `resolveChunkMode`), Erkennung von Steuerbefehlen, Konvertierung von Markdown-Tabellen. |
    | `reply` | Versand gepufferter Blockantworten, Umschlagformatierung, Auflösung der effektiven Nachrichten-/Verzögerungskonfiguration für menschliches Antwortverhalten. |
    | `routing` | `buildAgentSessionKey`, `resolveAgentRoute`. |
    | `pairing` | `buildPairingReply`, Lesen/Entfernen von Zulassungslisten, Upserts von Kopplungsanfragen und aus Anfragen abgeleitete Genehmigungseinträge. |
    | `media` | Herunterladen/Speichern entfernter Medien (siehe unten). |
    | `activity` | Letzte Kanalaktivität aufzeichnen/lesen. |
    | `session` | Sitzungsmetadaten aus eingehenden Ereignissen, Aktualisierungen der letzten Route. |
    | `mentions` | Hilfen für Erwähnungsrichtlinien (siehe unten). |
    | `reactions` | Handles für Bestätigungsreaktionen als Indikatoren für laufende Verarbeitung. |
    | `groups` | Auflösung von Gruppenrichtlinien und erforderlichen Erwähnungen. |
    | `debounce` | Entprellung eingehender Nachrichten. |
    | `commands` | Befehlsautorisierung und Steuerung von Textbefehlen. |
    | `outbound` | Ausgangsadapter eines Kanals laden. |
    | `inbound` | Kontext für eingehende Ereignisse erstellen und den gemeinsamen Kernel für eingehende Ereignisse und Antworten ausführen. |
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

    Verwenden Sie `saveRemoteMedia(...)`, wenn eine entfernte URL zu einem OpenClaw-Medium werden soll. Verwenden Sie `saveResponseMedia(...)`, wenn das Plugin bereits einen `Response` mit Plugin-eigener Authentifizierung, Weiterleitungs- oder Zulassungslistenbehandlung abgerufen hat. Verwenden Sie `readRemoteMediaBuffer(...)` nur, wenn das Plugin Rohbytes zur Prüfung, Transformation, Entschlüsselung oder zum erneuten Hochladen benötigt. `fetchRemoteMedia(...)` bleibt ein veralteter Kompatibilitätsalias für `readRemoteMediaBuffer(...)`.

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

    Verfügbare Erwähnungshilfen:

    - `buildMentionRegexes`
    - `matchesMentionPatterns`
    - `matchesMentionWithExplicit`
    - `implicitMentionKindWhen`
    - `resolveInboundMentionDecision`

    Verwenden Sie für Entscheidungen zu Erwähnungen den normalisierten `{ facts, policy }`-Pfad.

    Mehrere Felder unter `reply`, `session` und `inbound` enthalten feldbezogene `@deprecated`-Hinweise, die auf den aktuellen Kernel für den Kanalzug oder die Ausgangsadapter des Kanals verweisen; prüfen Sie das Inline-JSDoc der jeweiligen Hilfsfunktion, bevor Sie neuen Code darauf aufbauen.

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
  <Step title="In den Einstiegspunkt einbinden">
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
      return store.getRuntime(); // throws if not initialized
    }

    export function tryGetRuntime() {
      return store.tryGetRuntime(); // returns null if not initialized
    }
    ```

  </Step>
</Steps>

<Note>
Bevorzugen Sie `pluginId` für die Identität des Laufzeitspeichers. Die untergeordnete Form `key` ist für seltene Fälle vorgesehen, in denen ein Plugin absichtlich mehr als einen Laufzeit-Slot benötigt.
</Note>

## Weitere übergeordnete `api`-Felder

Neben `api.runtime` stellt das API-Objekt außerdem Folgendes bereit:

<ParamField path="api.id" type="string">
  Plugin-ID.
</ParamField>
<ParamField path="api.name" type="string">
  Anzeigename des Plugins.
</ParamField>
<ParamField path="api.config" type="OpenClawConfig">
  Aktueller Konfigurations-Snapshot (sofern verfügbar, der aktive In-Memory-Laufzeit-Snapshot).
</ParamField>
<ParamField path="api.pluginConfig" type="Record<string, unknown>">
  Plugin-spezifische Konfiguration aus `plugins.entries.<id>.config`.
</ParamField>
<ParamField path="api.logger" type="PluginLogger">
  Bereichsgebundener Logger (`debug`, `info`, `warn`, `error`).
</ParamField>
<ParamField path="api.registrationMode" type="PluginRegistrationMode">
  Aktueller Lademodus: `"full"` (Live-Aktivierung), `"discovery"` / `"tool-discovery"` (schreibgeschützte Fähigkeitserkennung), `"setup-only"` (leichtgewichtiger Einrichtungseinstieg), `"setup-runtime"` (Einrichtungsablauf, der auch den Laufzeiteintrag des Kanals benötigt) oder `"cli-metadata"` (Erfassung von CLI-Befehlsmetadaten).
</ParamField>
<ParamField path="api.resolvePath(input)" type="(string) => string">
  Einen Pfad relativ zum Plugin-Stammverzeichnis auflösen.
</ParamField>

## Verwandte Themen

- [Plugin-Interna](/de/plugins/architecture) — Fähigkeitsmodell und Registry
- [SDK-Einstiegspunkte](/de/plugins/sdk-entrypoints) — `definePluginEntry`-Optionen
- [SDK-Übersicht](/de/plugins/sdk-overview) — Subpfad-Referenz
