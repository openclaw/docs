---
read_when:
    - Refactoring des ACP-Sitzungslebenszyklus oder ACPX-Prozessbereinigung
    - Fehlersuche zu verwaisten ACPX-Prozessen, PID-Wiederverwendung oder Sicherheit bei der Bereinigung mehrerer Gateways
    - Ändern der Sichtbarkeit von sessions_list für gestartete ACP- oder Subagent-Sitzungen
    - Entwerfen von Zuständigkeitsmetadaten für Hintergrundaufgaben, ACP-Sitzungen oder Prozess-Leases
sidebarTitle: ACP lifecycle refactor
summary: Migrationsplan zur expliziten Festlegung der Zuständigkeit für ACP-Sitzungen und ACPX-Prozesse
title: Refaktorierung des ACP-Lebenszyklus
x-i18n:
    generated_at: "2026-05-07T13:25:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: b7f4ee447e0b436601c68251c26c1b897a642f6a8b1886d18647b62817996792
    source_path: refactor/acp.md
    workflow: 16
    postprocess_version: locale-links-v1
---

Der ACP-Lebenszyklus funktioniert derzeit, aber zu viel davon wird nachträglich abgeleitet.
Die Prozessbereinigung rekonstruiert Eigentümerschaft aus PIDs, Befehlszeichenfolgen, Wrapper-
Pfaden und der Live-Prozesstabelle. Die Sitzungssichtbarkeit rekonstruiert Eigentümerschaft
aus Sitzungsschlüssel-Zeichenfolgen plus sekundären `sessions.list({ spawnedBy })`-Lookups.
Das macht gezielte Korrekturen möglich, aber es macht auch Randfälle leicht zu übersehen:
PID-Wiederverwendung, zitierte Befehle, Adapter-Enkelprozesse, Zustandswurzeln mehrerer Gateways,
`cancel` gegenüber `close` und `tree` gegenüber `all`-Sichtbarkeit werden alle zu separaten
Stellen, an denen dieselben Eigentümerschaftsregeln erneut entdeckt werden müssen.

Dieses Refactoring macht Eigentümerschaft zu einem erstklassigen Konzept. Das Ziel ist keine neue ACP-Produktschnittstelle,
sondern ein sichererer interner Vertrag für das bestehende ACP- und ACPX-Verhalten.

## Ziele

- Die Bereinigung signalisiert niemals einen Prozess, sofern aktuelle Live-Nachweise nicht zu einer
  OpenClaw-eigenen Lease passen.
- `cancel`, `close` und das Abräumen beim Start haben unterschiedliche Lebenszyklusabsichten.
- `sessions_list`, `sessions_history`, `sessions_send` und Statusprüfungen verwenden
  dasselbe Sitzungsmodell mit anfragereigener Eigentümerschaft.
- Installationen mit mehreren Gateways können nicht gegenseitig ihre ACPX-Wrapper abräumen.
- Alte ACPX-Sitzungsdatensätze funktionieren während der Migration weiter.
- Die Runtime bleibt Plugin-eigen; der Kern lernt keine ACPX-Paketdetails.

## Nicht-Ziele

- ACPX zu ersetzen oder die öffentliche `/acp`-Befehlsoberfläche zu ändern.
- Anbieterspezifisches ACP-Adapterverhalten in den Kern zu verschieben.
- Von Benutzern zu verlangen, den Zustand vor dem Upgrade manuell zu bereinigen.
- `cancel` wiederverwendbare ACP-Sitzungen schließen zu lassen.

## Zielmodell

### Gateway-Instanzidentität

Jeder Gateway-Prozess sollte eine stabile Runtime-Instanz-ID haben:

```ts
type GatewayInstanceId = string;
```

Sie kann beim Start des Gateways erzeugt und im Zustand für die Lebensdauer
dieser Installation persistiert werden. Sie ist kein Sicherheitsgeheimnis; sie ist ein Eigentümerschafts-Diskriminator, der
verhindert, dass ACP-Prozesse eines Gateways mit den Prozessen eines anderen Gateways verwechselt werden.

### ACP-Sitzungseigentümerschaft

Jede gestartete ACP-Sitzung sollte normalisierte Eigentümerschaftsmetadaten haben:

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

Das Gateway sollte diese Felder in Sitzungszeilen zurückgeben, wo sie bekannt sind.
Die Sichtbarkeitsfilterung sollte eine reine Prüfung über Zeilenmetadaten sein:

```ts
canSeeSessionRow({
  row,
  requesterSessionKey,
  visibility,
  a2aPolicy,
});
```

Dadurch werden verborgene sekundäre `sessions.list({ spawnedBy })`-Aufrufe aus
Sichtbarkeitsprüfungen entfernt. Ein gestartetes agentenübergreifendes ACP-Kind ist anfragereigen, weil
die Zeile es so angibt, nicht weil eine zweite Abfrage es zufällig findet.

### ACPX-Prozess-Leases

Jeder generierte Wrapper-Start sollte einen Lease-Datensatz erzeugen:

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

Der Wrapper-Prozess sollte die Lease-ID und die Gateway-Instanz-ID in seiner
Umgebung erhalten:

```sh
OPENCLAW_ACPX_LEASE_ID=...
OPENCLAW_GATEWAY_INSTANCE_ID=...
```

Wenn die Plattform es erlaubt, sollte die Verifikation Live-Prozessmetadaten bevorzugen,
die nicht durch Befehlsquoting verwechselt werden können:

- Root-PID existiert noch
- Live-Wrapper-Pfad liegt unter `wrapperRoot`
- Prozessgruppe entspricht der Lease, wenn verfügbar
- Umgebung enthält die erwartete Lease-ID, wenn lesbar
- Befehls-Hash oder ausführbarer Pfad entspricht der Lease

Wenn der Live-Prozess nicht verifiziert werden kann, schlägt die Bereinigung geschlossen fehl.

## Lebenszyklus-Controller

Führen Sie einen ACPX-Lebenszyklus-Controller ein, dem Prozess-Leases und Bereinigungsrichtlinien
gehören:

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

`cancelTurn` fordert nur den Abbruch des Turns an. Es darf keine wiederverwendbaren Wrapper-
oder Adapterprozesse abräumen.

`closeSession` darf abräumen, aber erst nach dem Laden des Sitzungsdatensatzes,
dem Laden der Lease und der Verifikation, dass der Live-Prozessbaum noch zu dieser
Lease gehört.

`reapStartupOrphans` beginnt mit offenen Leases im Zustand. Es darf die Prozesstabelle
verwenden, um Nachkommen zu finden, sollte aber nicht zuerst beliebige ACP-artig aussehende
Befehle scannen und dann entscheiden, dass sie wahrscheinlich zu uns gehören.

## Wrapper-Vertrag

Generierte Wrapper sollten klein bleiben. Sie sollten:

- den Adapter in einer Prozessgruppe starten, wo dies unterstützt wird
- normale Beendigungssignale an die Prozessgruppe weiterleiten
- den Tod des Elternprozesses erkennen
- beim Tod des Elternprozesses SIGTERM senden und den Wrapper dann am Leben halten, bis der SIGKILL-
  Fallback ausgeführt wird
- Root-PID und Prozessgruppen-ID an den Lebenszyklus-Controller zurückmelden, wenn
  das verfügbar ist

Wrapper sollten nicht über Sitzungsrichtlinien entscheiden. Sie erzwingen nur die lokale Prozessbaum-
Bereinigung für ihre eigene Adaptergruppe.

## Vertrag für Sitzungssichtbarkeit

Sichtbarkeit sollte normalisierte Zeileneigentümerschaft verwenden:

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

- `self`: nur die anfragende Sitzung.
- `tree`: anfragende Sitzung plus Zeilen, die dem Anfrager gehören oder von ihm gestartet wurden.
- `all`: alle Zeilen desselben Agents, a2a-erlaubte agentenübergreifende Zeilen und anfragereigene
  gestartete agentenübergreifende Zeilen, selbst wenn allgemeines a2a deaktiviert ist.
- `agent`: nur derselbe Agent, außer eine explizite Eigentümerbeziehung besagt, dass die Zeile
  zum Anfrager gehört.

Dadurch werden `tree` und `all` monoton: `all` darf kein eigenes Kind verbergen, das
`tree` anzeigen würde.

## Migrationsplan

### Phase 1: Identität und Leases hinzufügen

- `gatewayInstanceId` zum Gateway-Zustand hinzufügen.
- Einen ACPX-Lease-Speicher unter dem ACPX-Zustandsverzeichnis hinzufügen.
- Vor dem Starten eines generierten Wrappers eine Lease schreiben.
- `leaseId` in neuen ACPX-Sitzungsdatensätzen speichern.
- Bestehende PID- und Befehlsfelder für alte Datensätze beibehalten.

### Phase 2: Lease-zuerst-Bereinigung

- Schließbereinigung so ändern, dass zuerst `leaseId` geladen wird.
- Live-Prozesseigentümerschaft vor dem Signalisieren gegen die Lease verifizieren.
- Aktuellen Root-PID- und Wrapper-Root-Fallback nur für Legacy-Datensätze beibehalten.
- Leases nach verifizierter Bereinigung als `closed` markieren.
- Leases als `lost` markieren, wenn der Prozess vor der Bereinigung verschwunden ist.

### Phase 3: Lease-zuerst-Abräumen beim Start

- Das Abräumen beim Start scannt offene Leases.
- Für jede Lease den Root-Prozess verifizieren und Nachkommen sammeln.
- Verifizierte Bäume kinderzuerst abräumen.
- Alte `closed`- und `lost`-Leases mit einem begrenzten Aufbewahrungsfenster verfallen lassen.
- Befehlsmarker-Scans nur als temporären Legacy-Fallback beibehalten, geschützt durch
  Wrapper-Root und Gateway-Instanz, wo möglich.

### Phase 4: Zeilen für Sitzungseigentümerschaft

- Eigentümerschaftsmetadaten zu Gateway-Sitzungszeilen hinzufügen.
- ACPX-, Subagent-, Hintergrundaufgaben- und Sitzungsspeicher-Schreiber so anpassen, dass sie
  `ownerSessionKey` oder `spawnedBy` befüllen.
- Sitzungssichtbarkeitsprüfungen auf Zeilenmetadaten umstellen.
- Sekundäre `sessions.list({ spawnedBy })`-Lookups zur Sichtbarkeitszeit entfernen.

### Phase 5: Legacy-Heuristiken entfernen

Nach einem Release-Fenster:

- nicht mehr auf gespeicherte Root-Befehlszeichenfolgen für Nicht-Legacy-ACPX-Bereinigung vertrauen
- Befehlsmarker-Startscans entfernen
- Sichtbarkeits-Fallback-Listen-Lookups entfernen
- defensives geschlossenes Fehlschlagen für fehlende oder nicht verifizierbare Leases beibehalten

## Tests

Fügen Sie zwei tabellengesteuerte Suiten hinzu.

Prozesslebenszyklus-Simulator:

- PID wird von nicht zugehörigem Prozess wiederverwendet
- PID wird vom Wrapper-Root eines anderen Gateways wiederverwendet
- gespeicherter Wrapper-Befehl ist von der Shell gequotet, Live-`ps`-Befehl ist es nicht
- Adapter-Kind endet, Enkel bleibt in der Prozessgruppe
- SIGTERM-Fallback beim Tod des Elternprozesses erreicht SIGKILL
- Prozessauflistung nicht verfügbar
- veraltete Lease mit fehlendem Prozess
- Start-Waise mit Wrapper, Adapter-Kind und Enkel

Sitzungssichtbarkeitsmatrix:

- `self`, `tree`, `agent`, `all`
- a2a aktiviert und deaktiviert
- Zeile desselben Agents
- agentenübergreifende Zeile
- anfragereigene gestartete agentenübergreifende ACP-Zeile
- Sandbox-Anfrager auf `tree` begrenzt
- Listen-, Historien-, Sende- und Statusaktionen

Die wichtige Invariante: Ein anfragereigenes gestartetes Kind ist überall sichtbar,
wo die konfigurierte Sichtbarkeit den Sitzungsbaum des Anfragers einschließt, und `all` ist nicht
weniger leistungsfähig als `tree`.

## Kompatibilitätshinweise

Alte Sitzungsdatensätze haben möglicherweise keine `leaseId`. Sie sollten den Legacy-
Bereinigungspfad mit geschlossenem Fehlschlagen verwenden:

- einen lebenden Root-Prozess verlangen
- Wrapper-Root-Eigentümerschaft verlangen, wenn ein generierter Wrapper erwartet wird
- Befehlsübereinstimmung für Nicht-Wrapper-Roots verlangen
- niemals nur auf Basis veralteter gespeicherter PID-Metadaten signalisieren

Wenn ein Legacy-Datensatz nicht verifiziert werden kann, lassen Sie ihn unverändert. Start-Lease-Bereinigung und
das nächste Release-Fenster sollten den Fallback schließlich außer Betrieb nehmen.

## Erfolgskriterien

- Das Schließen einer alten oder veralteten ACPX-Sitzung kann den Prozess eines anderen Gateways nicht beenden.
- Der Tod des Elternprozesses lässt keine hartnäckigen Adapter-Enkelprozesse weiterlaufen.
- `cancel` bricht den aktiven Turn ab, ohne wiederverwendbare Sitzungen zu schließen.
- `sessions_list` kann anfragereigene agentenübergreifende ACP-Kinder sowohl unter
  `tree` als auch unter `all` anzeigen.
- Die Startbereinigung wird von Leases gesteuert, nicht von breiten Befehlszeichenfolgen-Scans.
- Die fokussierten Prozess- und Sichtbarkeitsmatrix-Tests decken jeden Randfall ab, der
  zuvor einmalige Review-Korrekturen erforderte.
