---
read_when:
    - Refaktorierung des ACP-Sitzungslebenszyklus oder der ACPX-Prozessbereinigung
    - Fehlerbehebung bei verwaisten ACPX-Prozessen, PID-Wiederverwendung oder sicherer Bereinigung bei mehreren Gateways
    - Ändern der Sichtbarkeit von sessions_list für gestartete ACP- oder Subagent-Sitzungen
    - Entwurf von Eigentümermetadaten für Hintergrundaufgaben, ACP-Sitzungen oder Prozess-Leases
sidebarTitle: ACP lifecycle refactor
summary: Migrationsplan zur expliziten Festlegung der Zuständigkeit für ACP-Sitzungen und ACPX-Prozesse
title: Refaktorierung des ACP-Lebenszyklus
x-i18n:
    generated_at: "2026-07-12T02:07:04Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b7f4ee447e0b436601c68251c26c1b897a642f6a8b1886d18647b62817996792
    source_path: refactor/acp.md
    workflow: 16
---

Der ACP-Lebenszyklus funktioniert derzeit, aber zu viele seiner Eigenschaften werden erst nachträglich abgeleitet.
Die Prozessbereinigung rekonstruiert die Zugehörigkeit anhand von PIDs, Befehlszeichenfolgen, Wrapper-
Pfaden und der aktuellen Prozesstabelle. Die Sitzungssichtbarkeit rekonstruiert die Zugehörigkeit
anhand von Sitzungsschlüssel-Zeichenfolgen sowie zusätzlichen `sessions.list({ spawnedBy })`-Abfragen.
Dadurch sind gezielte Korrekturen möglich, aber Randfälle werden leicht übersehen:
PID-Wiederverwendung, Befehle mit Anführungszeichen, Enkelprozesse von Adaptern, mehrere Gateway-Statusverzeichnisse,
`cancel` gegenüber `close` sowie die Sichtbarkeit `tree` gegenüber `all` werden zu getrennten
Stellen, an denen dieselben Zugehörigkeitsregeln erneut ermittelt werden müssen.

Dieses Refactoring macht die Zugehörigkeit zu einem eigenständigen Konzept. Das Ziel ist keine neue ACP-
Produktoberfläche, sondern ein sichererer interner Vertrag für das bestehende Verhalten von ACP und ACPX.

## Ziele

- Die Bereinigung sendet niemals ein Signal an einen Prozess, sofern aktuelle Laufzeitnachweise nicht mit einer
  OpenClaw-eigenen Lease übereinstimmen.
- `cancel`, `close` und die Bereinigung beim Start haben unterschiedliche Lebenszyklusabsichten.
- `sessions_list`, `sessions_history`, `sessions_send` und Statusprüfungen verwenden
  dasselbe Modell für Sitzungen im Besitz des Anfragenden.
- Installationen mit mehreren Gateways können nicht gegenseitig ihre ACPX-Wrapper bereinigen.
- Alte ACPX-Sitzungsdatensätze funktionieren während der Migration weiterhin.
- Die Laufzeit bleibt Eigentum des Plugins; der Kern erhält keine Kenntnisse über Details des ACPX-Pakets.

## Nichtziele

- ACPX zu ersetzen oder die öffentliche `/acp`-Befehlsoberfläche zu ändern.
- Anbieterspezifisches Verhalten von ACP-Adaptern in den Kern zu verschieben.
- Von Benutzern zu verlangen, den Status vor einem Upgrade manuell zu bereinigen.
- Durch `cancel` wiederverwendbare ACP-Sitzungen zu schließen.

## Zielmodell

### Identität der Gateway-Instanz

Jeder Gateway-Prozess sollte über eine stabile Laufzeitinstanz-ID verfügen:

```ts
type GatewayInstanceId = string;
```

Sie kann beim Start des Gateways erzeugt und für die Lebensdauer dieser
Installation im Status gespeichert werden. Sie ist kein Sicherheitsgeheimnis, sondern ein Unterscheidungsmerkmal für die Zugehörigkeit,
das verhindert, dass die ACP-Prozesse eines Gateways mit den Prozessen eines anderen Gateways verwechselt werden.

### Zugehörigkeit von ACP-Sitzungen

Jede gestartete ACP-Sitzung sollte über normalisierte Zugehörigkeitsmetadaten verfügen:

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

Der Gateway sollte diese Felder in Sitzungszeilen zurückgeben, sofern sie bekannt sind.
Die Sichtbarkeitsfilterung sollte eine reine Prüfung der Zeilenmetadaten sein:

```ts
canSeeSessionRow({
  row,
  requesterSessionKey,
  visibility,
  a2aPolicy,
});
```

Dadurch entfallen verborgene zusätzliche `sessions.list({ spawnedBy })`-Aufrufe aus
Sichtbarkeitsprüfungen. Ein gestartetes agentenübergreifendes ACP-Kind gehört dem Anfragenden, weil
dies aus der Zeile hervorgeht, und nicht, weil es zufällig von einer zweiten Abfrage gefunden wird.

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

Der Wrapper-Prozess sollte die Lease-ID und die Gateway-Instanz-ID über seine
Umgebung erhalten:

```sh
OPENCLAW_ACPX_LEASE_ID=...
OPENCLAW_GATEWAY_INSTANCE_ID=...
```

Wenn die Plattform dies zulässt, sollte die Überprüfung aktuelle Prozessmetadaten bevorzugen,
die nicht durch Befehlsquotierung verwechselt werden können:

- Die Root-PID existiert weiterhin
- Der aktuelle Wrapper-Pfad liegt unter `wrapperRoot`
- Die Prozessgruppe entspricht der Lease, sofern verfügbar
- Die Umgebung enthält die erwartete Lease-ID, sofern sie gelesen werden kann
- Der Befehlshash oder der Pfad zur ausführbaren Datei entspricht der Lease

Wenn der aktuelle Prozess nicht überprüft werden kann, schlägt die Bereinigung sicher geschlossen fehl.

## Lebenszyklus-Controller

Es wird ein einzelner ACPX-Lebenszyklus-Controller eingeführt, der Prozess-Leases und die Bereinigungs-
richtlinie verwaltet:

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

`cancelTurn` fordert ausschließlich den Abbruch des Durchlaufs an. Wiederverwendbare Wrapper-
oder Adapterprozesse dürfen dadurch nicht bereinigt werden.

`closeSession` darf Prozesse bereinigen, jedoch erst nach dem Laden des Sitzungsdatensatzes,
dem Laden der Lease und der Überprüfung, dass der aktuelle Prozessbaum weiterhin zu dieser
Lease gehört.

`reapStartupOrphans` beginnt mit offenen Leases im Status. Die Prozesstabelle darf verwendet werden,
um Nachfahren zu finden, aber es sollten nicht zuerst beliebige Befehle durchsucht werden, die wie ACP aussehen,
um anschließend zu entscheiden, dass sie wahrscheinlich zu dieser Installation gehören.

## Wrapper-Vertrag

Generierte Wrapper sollten klein bleiben. Sie sollten:

- den Adapter, sofern unterstützt, in einer Prozessgruppe starten
- normale Beendigungssignale an die Prozessgruppe weiterleiten
- den Tod des übergeordneten Prozesses erkennen
- beim Tod des übergeordneten Prozesses SIGTERM senden und den Wrapper anschließend aktiv halten, bis der SIGKILL-
  Rückfall ausgeführt wird
- Root-PID und Prozessgruppen-ID an den Lebenszyklus-Controller zurückmelden, sofern
  diese verfügbar sind

Wrapper sollten nicht über Sitzungsrichtlinien entscheiden. Sie erzwingen lediglich die lokale Bereinigung des Prozessbaums
für ihre eigene Adaptergruppe.

## Vertrag für die Sitzungssichtbarkeit

Die Sichtbarkeit sollte die normalisierte Zugehörigkeit der Zeile verwenden:

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
- `tree`: die Sitzung des Anfragenden sowie Zeilen, die ihm gehören oder von ihm gestartet wurden.
- `all`: alle Zeilen desselben Agenten, gemäß a2a zulässige agentenübergreifende Zeilen und dem Anfragenden gehörende
  gestartete agentenübergreifende Zeilen, selbst wenn allgemeines a2a deaktiviert ist.
- `agent`: nur derselbe Agent, sofern keine ausdrückliche Zugehörigkeitsbeziehung angibt, dass die Zeile
  dem Anfragenden gehört.

Dadurch werden `tree` und `all` monoton: `all` darf kein zugehöriges Kind ausblenden, das
`tree` anzeigen würde.

## Migrationsplan

### Phase 1: Identität und Leases hinzufügen

- `gatewayInstanceId` zum Gateway-Status hinzufügen.
- Einen ACPX-Lease-Speicher im ACPX-Statusverzeichnis hinzufügen.
- Vor dem Start eines generierten Wrappers eine Lease schreiben.
- `leaseId` in neuen ACPX-Sitzungsdatensätzen speichern.
- Vorhandene PID- und Befehlsfelder für alte Datensätze beibehalten.

### Phase 2: Lease-basierte Bereinigung

- Die Bereinigung beim Schließen so ändern, dass zuerst `leaseId` geladen wird.
- Vor dem Senden von Signalen die aktuelle Prozesszugehörigkeit anhand der Lease überprüfen.
- Den derzeitigen Rückfall auf Root-PID und Wrapper-Stammverzeichnis nur für Altdatensätze beibehalten.
- Leases nach einer überprüften Bereinigung als `closed` markieren.
- Leases als `lost` markieren, wenn der Prozess bereits vor der Bereinigung beendet wurde.

### Phase 3: Lease-basierte Bereinigung beim Start

- Die Bereinigung beim Start durchsucht offene Leases.
- Für jede Lease den Root-Prozess überprüfen und Nachfahren erfassen.
- Überprüfte Bäume von den Kindern zum Elternprozess bereinigen.
- Alte Leases mit dem Status `closed` und `lost` innerhalb eines begrenzten Aufbewahrungszeitraums verwerfen.
- Die Suche anhand von Befehlsmarkierungen nur als vorübergehenden Rückfall für Altdaten beibehalten und nach Möglichkeit durch
  Wrapper-Stammverzeichnis und Gateway-Instanz absichern.

### Phase 4: Zeilen zur Sitzungszugehörigkeit

- Zugehörigkeitsmetadaten zu Gateway-Sitzungszeilen hinzufügen.
- ACPX, Subagenten, Hintergrundaufgaben und Sitzungsspeicher so anpassen, dass sie
  `ownerSessionKey` oder `spawnedBy` befüllen.
- Prüfungen der Sitzungssichtbarkeit auf Zeilenmetadaten umstellen.
- Zusätzliche `sessions.list({ spawnedBy })`-Abfragen während der Sichtbarkeitsprüfung entfernen.

### Phase 5: Veraltete Heuristiken entfernen

Nach einem Release-Zeitraum:

- bei der Bereinigung nicht veralteter ACPX-Datensätze nicht mehr auf gespeicherte Root-Befehlszeichenfolgen zurückgreifen
- Suchen nach Befehlsmarkierungen beim Start entfernen
- Rückfallabfragen von Listen für die Sichtbarkeit entfernen
- defensives, sicher geschlossenes Verhalten für fehlende oder nicht überprüfbare Leases beibehalten

## Tests

Zwei tabellengesteuerte Testsammlungen hinzufügen.

Prozesslebenszyklus-Simulator:

- PID wird von einem nicht zugehörigen Prozess wiederverwendet
- PID wird vom Wrapper-Stammverzeichnis eines anderen Gateways wiederverwendet
- gespeicherter Wrapper-Befehl enthält Shell-Anführungszeichen, aktueller `ps`-Befehl dagegen nicht
- Adapter-Kindprozess wird beendet, Enkelprozess verbleibt in der Prozessgruppe
- SIGTERM-Rückfall beim Tod des übergeordneten Prozesses erreicht SIGKILL
- Prozessauflistung ist nicht verfügbar
- veraltete Lease mit fehlendem Prozess
- verwaister Prozess beim Start mit Wrapper, Adapter-Kindprozess und Enkelprozess

Matrix für die Sitzungssichtbarkeit:

- `self`, `tree`, `agent`, `all`
- a2a aktiviert und deaktiviert
- Zeile desselben Agenten
- agentenübergreifende Zeile
- dem Anfragenden gehörende, gestartete agentenübergreifende ACP-Zeile
- in einer Sandbox ausgeführter Anfragender, auf `tree` beschränkt
- Aktionen für Auflisten, Verlauf, Senden und Status

Die wichtige Invariante: Ein dem Anfragenden gehörendes, gestartetes Kind ist überall sichtbar,
wo die konfigurierte Sichtbarkeit den Sitzungsbaum des Anfragenden einschließt, und `all` ist nicht
weniger leistungsfähig als `tree`.

## Kompatibilitätshinweise

Alte Sitzungsdatensätze verfügen möglicherweise nicht über `leaseId`. Sie sollten den veralteten,
sicher geschlossenen Bereinigungspfad verwenden:

- einen aktuellen Root-Prozess voraussetzen
- die Zugehörigkeit zum Wrapper-Stammverzeichnis voraussetzen, wenn ein generierter Wrapper erwartet wird
- bei Roots ohne Wrapper eine Übereinstimmung der Befehle voraussetzen
- niemals allein anhand veralteter gespeicherter PID-Metadaten ein Signal senden

Wenn ein Altdatensatz nicht überprüft werden kann, bleibt er unangetastet. Die Lease-Bereinigung beim Start und
der nächste Release-Zeitraum sollten den Rückfall schließlich außer Betrieb nehmen.

## Erfolgskriterien

- Das Schließen einer alten oder veralteten ACPX-Sitzung kann keinen Prozess eines anderen Gateways beenden.
- Der Tod des übergeordneten Prozesses hinterlässt keine hartnäckigen Adapter-Enkelprozesse.
- `cancel` bricht den aktiven Durchlauf ab, ohne wiederverwendbare Sitzungen zu schließen.
- `sessions_list` kann dem Anfragenden gehörende agentenübergreifende ACP-Kinder sowohl unter
  `tree` als auch unter `all` anzeigen.
- Die Bereinigung beim Start wird durch Leases gesteuert, nicht durch breit angelegte Suchen in Befehlszeichenfolgen.
- Die gezielten Matrix-Tests für Prozesse und Sichtbarkeit decken jeden Randfall ab, für den
  zuvor einzelne Korrekturen bei der Überprüfung erforderlich waren.
