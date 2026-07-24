---
read_when:
    - Refaktorierung des ACP-Sitzungslebenszyklus oder der ACPX-Prozessbereinigung
    - Fehlerbehebung bei verwaisten ACPX-Prozessen, PID-Wiederverwendung oder sicherer Bereinigung mehrerer Gateways
    - Ändern der `sessions_list`-Sichtbarkeit für gestartete ACP- oder Subagent-Sitzungen
    - Entwurf von Eigentümermetadaten für Hintergrundaufgaben, ACP-Sitzungen oder Prozess-Leases
sidebarTitle: ACP lifecycle refactor
summary: Migrationsplan zur expliziten Festlegung der Eigentümerschaft von ACP-Sitzungen und ACPX-Prozessen
title: ACP-Lebenszyklus-Refaktorierung
x-i18n:
    generated_at: "2026-07-24T05:19:59Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: bda66f0acc93216c3d9386ca3ebf7f544efd306cd7f53386391f0c48e5dc8f06
    source_path: refactor/acp.md
    workflow: 16
---

Der ACP-Lebenszyklus funktioniert derzeit, aber zu viele seiner Aspekte werden erst im Nachhinein abgeleitet.
Die Prozessbereinigung rekonstruiert die Eigentümerschaft anhand von PIDs, Befehlszeichenfolgen, Wrapper-
Pfaden und der aktuellen Prozesstabelle. Die Sitzungssichtbarkeit rekonstruiert die Eigentümerschaft
anhand von Sitzungsschlüssel-Zeichenfolgen und zusätzlichen `sessions.list({ spawnedBy })`-Abfragen.
Dadurch sind gezielte Korrekturen möglich, aber Randfälle werden auch leicht übersehen:
PID-Wiederverwendung, Befehle mit Anführungszeichen, untergeordnete Adapterprozesse, Zustandsstammverzeichnisse mehrerer Gateways,
`cancel` gegenüber `close` sowie die Sichtbarkeit von `tree` gegenüber `all` werden jeweils zu separaten
Stellen, an denen dieselben Eigentümerschaftsregeln erneut ermittelt werden müssen.

Dieses Refactoring macht die Eigentümerschaft zu einem grundlegenden Konzept. Ziel ist keine neue ACP-Produktoberfläche,
sondern ein sichererer interner Vertrag für das bestehende Verhalten von ACP und ACPX.

## Ziele

- Die Bereinigung sendet niemals ein Signal an einen Prozess, sofern die aktuellen Live-Nachweise nicht mit einem
  OpenClaw-eigenen Lease übereinstimmen.
- `cancel`, `close` und das Bereinigen beim Start haben unterschiedliche Lebenszyklusabsichten.
- `sessions_list`, `sessions_history`, `sessions_send` und Statusprüfungen verwenden
  dasselbe Modell für Sitzungen im Eigentum des Anfragenden.
- Installationen mit mehreren Gateways können nicht gegenseitig ihre ACPX-Wrapper bereinigen.
- Alte ACPX-Sitzungsdatensätze funktionieren während der Migration weiterhin.
- Die Laufzeit bleibt Eigentum des Plugins; der Kern erhält keine Kenntnis von ACPX-Paketdetails.

## Nichtziele

- ACPX zu ersetzen oder die öffentliche Befehlsoberfläche `/acp` zu ändern.
- Anbieterspezifisches Verhalten von ACP-Adaptern in den Kern zu verschieben.
- Von Benutzern zu verlangen, den Zustand vor einem Upgrade manuell zu bereinigen.
- Durch `cancel` wiederverwendbare ACP-Sitzungen schließen zu lassen.

## Zielmodell

### Gateway-Instanzidentität

Jeder Gateway-Prozess sollte eine stabile Laufzeit-Instanz-ID besitzen:

```ts
type GatewayInstanceId = string;
```

Sie kann beim Start des Gateways generiert und für die Lebensdauer
dieser Installation im Zustand gespeichert werden. Sie ist kein Sicherheitsgeheimnis, sondern ein Unterscheidungsmerkmal für die Eigentümerschaft,
das verhindert, dass die ACP-Prozesse eines Gateways mit den Prozessen eines anderen Gateways verwechselt werden.

### Eigentümerschaft von ACP-Sitzungen

Jede gestartete ACP-Sitzung sollte normalisierte Eigentümerschaftsmetadaten besitzen:

```ts
type AcpSessionOwner = {
  sessionKey: string;
  spawnedBy?: string;
  parentSessionKey?: string;
  ownerSessionKey: string;
  agentId: string;
  backend: "acpx";
  gatewayInstanceId: GatewayInstanceId;
  createdAt: number;
};
```

Das Gateway sollte diese Felder in Sitzungszeilen zurückgeben, sofern sie bekannt sind.
Die Sichtbarkeitsfilterung sollte eine reine Prüfung der Zeilenmetadaten sein:

```ts
canSeeSessionRow({
  row,
  requesterSessionKey,
  visibility,
  a2aPolicy,
});
```

Dadurch werden verborgene zusätzliche `sessions.list({ spawnedBy })`-Aufrufe aus
Sichtbarkeitsprüfungen entfernt. Eine gestartete agentenübergreifende untergeordnete ACP-Sitzung gehört dem Anfragenden, weil
dies in der Zeile angegeben ist, und nicht, weil sie zufällig durch eine zweite Abfrage gefunden wird.

### ACPX-Prozess-Leases

Jeder Start eines generierten Wrappers sollte einen Lease-Datensatz erstellen:

```ts
type AcpxProcessLease = {
  leaseId: string;
  gatewayInstanceId: GatewayInstanceId;
  sessionKey: string;
  wrapperRoot: string;
  wrapperPath: string;
  rootPid: number;
  processGroupId?: number;
  commandHash: string;
  startedAt: number;
  state: "open" | "closing" | "closed" | "lost";
};
```

Der Wrapper-Prozess erhält die Lease-ID und die Gateway-Instanz-ID als portable
Argumente:

```sh
--openclaw-acpx-lease-id ... --openclaw-gateway-instance-id ...
```

Wenn die Plattform dies zulässt, sollte die Verifizierung Live-Prozessmetadaten bevorzugen,
die nicht durch Anführungszeichen in Befehlen verwechselt werden können:

- Die Stamm-PID existiert weiterhin
- Der Live-Wrapper-Pfad befindet sich unter `wrapperRoot`
- Die Prozessgruppe stimmt, sofern verfügbar, mit dem Lease überein
- Die Argumente enthalten die erwartete Lease-ID
- Der Befehlshash oder der Pfad der ausführbaren Datei stimmt mit dem Lease überein

Wenn der Live-Prozess nicht verifiziert werden kann, schlägt die Bereinigung nach dem Fail-Closed-Prinzip fehl.

## Lebenszyklus-Controller

Führen Sie einen einzigen ACPX-Lebenszyklus-Controller ein, der Prozess-Leases und die Bereinigungsrichtlinie
verwaltet:

```ts
interface AcpxLifecycleController {
  ensureSession(input: AcpRuntimeEnsureInput): Promise<AcpRuntimeHandle>;
  cancelTurn(handle: AcpRuntimeHandle): Promise<void>;
  closeSession(input: {
    handle: AcpRuntimeHandle;
    discardPersistentState?: boolean;
    reason?: string;
  }): Promise<void>;
  reapStartupOrphans(): Promise<void>;
  verifyOwnedTree(lease: AcpxProcessLease): Promise<OwnedProcessTree | null>;
}
```

`cancelTurn` fordert ausschließlich den Abbruch des Durchlaufs an. Es darf keine wiederverwendbaren Wrapper-
oder Adapterprozesse bereinigen.

`closeSession` darf bereinigen, jedoch erst nach dem Laden des Sitzungsdatensatzes,
dem Laden des Leases und der Verifizierung, dass der Live-Prozessbaum weiterhin zu diesem
Lease gehört.

`reapStartupOrphans` beginnt mit offenen Leases im Zustand. Dabei darf die Prozesstabelle
zum Ermitteln untergeordneter Prozesse verwendet werden, jedoch sollten nicht zuerst beliebige ACP-ähnliche
Befehle durchsucht und anschließend als wahrscheinlich eigene Prozesse eingestuft werden.

## Wrapper-Vertrag

Generierte Wrapper sollten klein bleiben. Sie sollten:

- den Adapter, sofern unterstützt, in einer Prozessgruppe starten
- normale Beendigungssignale an die Prozessgruppe weiterleiten
- den Tod des übergeordneten Prozesses erkennen
- beim Tod des übergeordneten Prozesses SIGTERM senden und den Wrapper anschließend aktiv halten, bis der SIGKILL-
  Fallback ausgeführt wird
- die Stamm-PID und die Prozessgruppen-ID, sofern verfügbar, an den Lebenszyklus-Controller
  zurückmelden

Wrapper sollten nicht über Sitzungsrichtlinien entscheiden. Sie erzwingen lediglich die lokale Bereinigung des Prozessbaums
für ihre eigene Adaptergruppe.

## Vertrag zur Sitzungssichtbarkeit

Die Sichtbarkeit sollte die normalisierte Eigentümerschaft der Zeilen verwenden:

```ts
type SessionVisibilityInput = {
  requesterSessionKey: string;
  row: {
    key: string;
    agentId: string;
    ownerSessionKey?: string;
    spawnedBy?: string;
    parentSessionKey?: string;
  };
  visibility: "self" | "tree" | "agent" | "all";
  a2aPolicy: AgentToAgentPolicy;
};
```

Regeln:

- `self`: nur die Sitzung des Anfragenden.
- `tree`: die Sitzung des Anfragenden sowie Zeilen, die dem Anfragenden gehören oder von ihm gestartet wurden.
- `all`: alle Zeilen desselben Agenten, durch a2a erlaubte agentenübergreifende Zeilen sowie agentenübergreifende gestartete Zeilen
  im Eigentum des Anfragenden, selbst wenn allgemeines a2a deaktiviert ist.
- `agent`: nur derselbe Agent, sofern nicht eine explizite Eigentümerbeziehung angibt, dass die Zeile
  dem Anfragenden gehört.

Dadurch werden `tree` und `all` monoton: `all` darf kein untergeordnetes Element im Eigentum des Anfragenden ausblenden, das
`tree` anzeigen würde.

## Migrationsplan

### Phase 1: Identität und Leases hinzufügen

- `gatewayInstanceId` zum Gateway-Zustand hinzufügen.
- Einen ACPX-Lease-Speicher unter dem ACPX-Zustandsverzeichnis hinzufügen.
- Vor dem Start eines generierten Wrappers einen Lease schreiben.
- `leaseId` in neuen ACPX-Sitzungsdatensätzen speichern.
- Vorhandene PID- und Befehlsfelder für alte Datensätze beibehalten.

### Phase 2: Lease-zuerst-Bereinigung

- Die Bereinigung beim Schließen so ändern, dass zuerst `leaseId` geladen wird.
- Vor dem Senden von Signalen die Live-Prozesseigentümerschaft anhand des Leases verifizieren.
- Den aktuellen Fallback über Stamm-PID und Wrapper-Stammverzeichnis ausschließlich für Legacy-Datensätze beibehalten.
- Leases nach verifizierter Bereinigung als `closed` markieren.
- Leases als `lost` markieren, wenn der Prozess vor der Bereinigung beendet wurde.

### Phase 3: Lease-zuerst-Bereinigung beim Start

- Die Bereinigung beim Start durchsucht offene Leases.
- Für jeden Lease den Stammprozess verifizieren und untergeordnete Prozesse erfassen.
- Verifizierte Bäume von den untergeordneten Prozessen aufwärts bereinigen.
- Alte Leases mit `closed` und `lost` innerhalb eines begrenzten Aufbewahrungszeitraums verfallen lassen.
- Das Durchsuchen nach Befehlsmarkierungen nur als vorübergehenden Legacy-Fallback beibehalten, nach Möglichkeit abgesichert durch
  das Wrapper-Stammverzeichnis und die Gateway-Instanz.

### Phase 4: Zeilen zur Sitzungseigentümerschaft

- Eigentümerschaftsmetadaten zu Gateway-Sitzungszeilen hinzufügen.
- ACPX-, Subagent-, Hintergrundaufgaben- und Sitzungsspeicher-Schreibvorgänge so anpassen, dass sie
  `ownerSessionKey` oder `spawnedBy` ausfüllen.
- Sichtbarkeitsprüfungen für Sitzungen auf die Verwendung von Zeilenmetadaten umstellen.
- Zusätzliche `sessions.list({ spawnedBy })`-Abfragen während der Sichtbarkeitsprüfung entfernen.

### Phase 5: Legacy-Heuristiken entfernen

Nach einem Release-Zeitraum:

- bei der Bereinigung von Nicht-Legacy-ACPX-Sitzungen nicht mehr auf gespeicherte Stamm-Befehlszeichenfolgen zurückgreifen
- das Durchsuchen nach Befehlsmarkierungen beim Start entfernen
- Fallback-Listenabfragen für die Sichtbarkeit entfernen
- das defensive Fail-Closed-Verhalten für fehlende oder nicht verifizierbare Leases beibehalten

## Tests

Fügen Sie zwei tabellengesteuerte Testsuiten hinzu.

Prozesslebenszyklus-Simulator:

- PID wird von einem unabhängigen Prozess wiederverwendet
- PID wird vom Wrapper-Stammprozess eines anderen Gateways wiederverwendet
- der gespeicherte Wrapper-Befehl enthält Shell-Anführungszeichen, der Live-Befehl `ps` hingegen nicht
- der untergeordnete Adapterprozess wird beendet, ein weiterer Nachkomme verbleibt in der Prozessgruppe
- der SIGTERM-Fallback beim Tod des übergeordneten Prozesses erreicht SIGKILL
- die Prozessliste ist nicht verfügbar
- veralteter Lease mit fehlendem Prozess
- verwaister Prozess beim Start mit Wrapper, untergeordnetem Adapterprozess und weiterem Nachkommen

Matrix der Sitzungssichtbarkeit:

- `self`, `tree`, `agent`, `all`
- a2a aktiviert und deaktiviert
- Zeile desselben Agenten
- agentenübergreifende Zeile
- agentenübergreifende gestartete ACP-Zeile im Eigentum des Anfragenden
- Anfragender in einer Sandbox, beschränkt auf `tree`
- Aktionen zum Auflisten, Anzeigen des Verlaufs, Senden und Prüfen des Status

Die wichtige Invariante: Ein gestartetes untergeordnetes Element im Eigentum des Anfragenden ist überall dort sichtbar,
wo die konfigurierte Sichtbarkeit den Sitzungsbaum des Anfragenden einschließt, und `all` ist nicht
weniger leistungsfähig als `tree`.

## Kompatibilitätshinweise

Alte Sitzungsdatensätze enthalten möglicherweise kein `leaseId`. Sie sollten den Legacy-Bereinigungspfad
nach dem Fail-Closed-Prinzip verwenden:

- einen aktiven Stammprozess voraussetzen
- die Eigentümerschaft des Wrapper-Stammverzeichnisses voraussetzen, wenn ein generierter Wrapper erwartet wird
- bei Stammprozessen ohne Wrapper eine Übereinstimmung des Befehls voraussetzen
- niemals ausschließlich aufgrund veralteter gespeicherter PID-Metadaten ein Signal senden

Wenn ein Legacy-Datensatz nicht verifiziert werden kann, lassen Sie ihn unverändert. Die Lease-Bereinigung beim Start und
der nächste Release-Zeitraum sollten den Fallback schließlich außer Betrieb nehmen.

## Erfolgskriterien

- Das Schließen einer alten oder veralteten ACPX-Sitzung kann keinen Prozess eines anderen Gateways beenden.
- Der Tod des übergeordneten Prozesses hinterlässt keine hartnäckigen untergeordneten Adapterprozesse.
- `cancel` bricht den aktiven Durchlauf ab, ohne wiederverwendbare Sitzungen zu schließen.
- `sessions_list` kann agentenübergreifende untergeordnete ACP-Sitzungen im Eigentum des Anfragenden sowohl unter
  `tree` als auch unter `all` anzeigen.
- Die Bereinigung beim Start wird durch Leases gesteuert, nicht durch breit angelegte Suchen in Befehlszeichenfolgen.
- Die gezielten Tests der Prozess- und Sichtbarkeitsmatrix decken jeden Randfall ab, der
  zuvor einzelne Korrekturen bei Reviews erforderte.
