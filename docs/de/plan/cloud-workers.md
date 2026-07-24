---
read_when:
    - Entwurf oder Implementierung der Bereitstellung von Cloud-Workern, des Worker-Modus oder der Sitzungsübergabe
    - Ändern von Umgebungen.*, des Worker-Protokolls, der Transkriptaufnahme oder der RPCs des Inferenz-Proxys
    - Überprüfung der Sicherheitslage bei der Remote-Ausführung von Agenten
summary: Führen Sie Agentensitzungen auf kurzlebigen, per SSH erreichbaren Maschinen mit über den Gateway weitergeleiteter Inferenz und Live-Streaming in der Seitenleiste aus.
title: Cloud-Worker-Plan
x-i18n:
    generated_at: "2026-07-24T05:08:25Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 134c3f6e486837607225d95d12a3153525b14237b362b9f9957313d9bc379dc4
    source_path: plan/cloud-workers.md
    workflow: 16
---

## Status

Vorschlag, Revision 3. Nicht implementiert. Ausrichtung vereinbart 2026-07; Revision 2 berücksichtigte Erkenntnisse aus der adversarialen Überprüfung (dediziertes Worker-Protokoll, Zustandsautomaten für Platzierung/Umgebung, Git-bewusste eingehende Synchronisierung, einseitige Übergabe in v1, Sicherheitsformulierung zu kontrolliertem ausgehendem Datenverkehr). Revision 3 legt das Eigentumsmodell für die Synchronisierung fest (der Worker erstellt Commits, das Gateway übernimmt und veröffentlicht sie), fügt einen einfachen Synchronisierungsmodus ohne Git hinzu, korrigiert die Worker-Ausführung auf vollständig innerhalb der Box, verlagert die Internetrichtlinie in die Bereitstellungsphase und stellt die Agent-Übertragung für Meilenstein 3 wieder her.

## Problem

OpenClaw-Agent-Sitzungen führen ihre Schleife, Tools und Inferenz innerhalb des Gateway-Prozesses auf einem Rechner aus. Die Rechenleistung ist durch diesen Rechner begrenzt, lang laufende Aufgaben belegen ihn, und parallele Arbeiten konkurrieren um seine Ressourcen. Gehostete Produkte (Cursor Cloud Agents, Claude Code im Web, Codex Cloud) lösen dies mit kurzlebigen Cloud-Sandboxes pro Aufgabe, erfordern jedoch Infrastruktur und Vertrauen in den jeweiligen Anbieter.

Betreiber, die bereits über freie Rechner verfügen (oder diese günstig mieten können), haben keine Möglichkeit festzulegen: Diese Sitzung dort ausführen, sie wie jede andere Sitzung in meiner Seitenleiste anzeigen und den Rechner anschließend verwerfen.

## Ziele

- Eine vollständige Agent-Sitzung (Schleife + Tools) auf einem kurzlebigen entfernten Rechner („Cloud-Worker“) ausführen, während die Sitzung in der Control UI genau wie eine lokale Sitzung erscheint und streamt.
- Keine dauerhaft vorhandenen Zugangsdaten auf dem Worker (keine Provider-Authentifizierung, keine Forge-Token) und kein direkter ausgehender Netzwerkverkehr; die Box benötigt lediglich einen erreichbaren sshd.
- Bereitstellen, synchronisieren, ausführen, Ergebnisse erfassen, zerstören – vollständig automatisiert und Provider-austauschbar (erster Provider: Leasing-CLIs nach Art von Crabbox).
- Laufende Arbeit an einer Turn-Grenze vom Gateway an einen Worker übertragen, ohne Transkript, Sitzungsidentität oder (wenn die Anfragebytes äquivalent bleiben) die Provider-Cache-Affinität zu verlieren; Ergebnisse sicher zurückholen.
- Sowohl Menschen (UI) als auch Agents (Tool) können Arbeit an einen Cloud-Worker übertragen.
- Tage dauernde Sitzungen unterstützen; die Lebensdauer wird durch Richtlinien bestimmt und nicht durch eine fest codierte Obergrenze.

## Nicht-Ziele (v1)

- Keine externen Coding-Harnesses (Claude Code, Codex CLI) auf Workern. Worker-Sitzungen führen ausschließlich den eingebetteten Runner von OpenClaw aus. Harness-Unterstützung ist eine Opt-in-Funktion für v2, da Harnesses ihre eigene Inferenz mit eigenen Zugangsdaten durchführen.
- Kein Best-of-N-/Parallelversuchs-Fan-out.
- Keine VPN-/Tailnet-Abhängigkeit. Der Transport erfolgt ausschließlich über SSH.
- Keine neue Sandbox-Laufzeit. Der Worker-Rechner bildet die Isolationsgrenze; eine Betriebssystem-Sandbox innerhalb der Box kann später ergänzend hinzukommen.
- Keine symmetrische Live-Migration in v1: Die Übertragung erfolgt lokal → Worker; Worker → lokal erfordert eine angehaltene Sitzung sowie einen abgeschlossenen Workspace-Abgleich. Eine spätere bidirektionale Live-Übergabe baut auf demselben Barrierenmechanismus auf.
- Kein JSON-Nebenzustand auf dem Gateway; Umgebungs-, Platzierungs-, Cursor- und Berechtigungszustand werden in SQLite gespeichert.

## Vorbilder (was wir übernehmen, was wir umkehren)

- Cursor Cloud Agents: Die Agent-Schleife läuft in deren Cloud; die VM ist ein Ziel für die Tool-Ausführung; ein nur ergänzbarer Konversationsspeicher wird an alle Clients gestreamt; Warmstart per Snapshot nach der Installation; selbst gehostete Worker sind ausschließlich ausgehend verbundene Worker-Prozesse. Wir übernehmen das Modell „Die maßgebliche Konversationsquelle verbleibt beim Orchestrator“ sowie das Streaming-Modell; die Platzierung der Schleife kehren wir um (siehe Entscheidung unten).
- Codex Cloud: zweiphasige Laufzeit – vernetzte Einrichtungsphase, anschließend Offline-Agent-Phase mit entfernten Geheimnissen; Containerzustands-Cache für schnelle Folgeausführungen. Wir übernehmen die Phasentrennung als Konzept für ausgehenden Datenverkehr sowie die Cache-Idee für vorgewärmte Images in v2.
- Claude Code im Web: VM pro Sitzung; Git-Proxy zur Isolierung von Zugangsdaten (echte Token gelangen niemals in die Sandbox, Push ist auf den Sitzungs-Branch beschränkt); Dateisystem-Snapshot nach der Einrichtung; Teleport-Übergabe = gepushter Branch + wiedergegebener Verlauf. Wir übernehmen die Zugangsdatenisolierung und den Übergaberahmen, die ausgehende Synchronisierung erfolgt jedoch per rsync vom Gateway, sodass nicht bereinigte Arbeitsverzeichnisse funktionieren und sich kein Forge-Token in der Nähe der Box befindet.
- Copilot Coding Agent: standardmäßig verweigerter ausgehender Datenverkehr mit einer Positivliste für Paketregistrys. Unsere Standardeinstellung im Dauerbetrieb ist strenger (überhaupt kein direkter ausgehender Datenverkehr), da Inferenz und Websuche durch den SSH-Tunnel eintreffen – siehe jedoch Sicherheit zur Begründung, warum dies „kontrollierter ausgehender Datenverkehr“ und nicht „kein ausgehender Datenverkehr“ ist.

## Architekturentscheidung: Schleife auf dem Worker, Inferenz über das Gateway

Drei Platzierungen wurden erwogen:

1. Die Schleife verbleibt auf dem Gateway, der Worker führt Tools aus (Cursor-Modell). Sicherster Fehlerbereich (Transkript, Inferenz, Genehmigungen und Wiederherstellung nach Neustarts bleiben vollständig lokal) und von Prüfern bevorzugter erster Meilenstein. Als Produktarchitektur verworfen: Die Nicht-Exec-Tools von OpenClaw sind prozessinterne Dateisystemoperationen, sodass jedes Lesen, Bearbeiten oder Durchsuchen von Dateien zu einem Netzwerk-Roundtrip oder einer umfassenden Umgestaltung der Tool-Oberfläche in grobe Workspace-RPCs wird; das Laufzeitverhalten ist kommunikationsintensiv und latenzgebunden. Wir übernehmen den Grundgedanken dort, wo er bereits umgesetzt ist (Auslagerung der Ausführung auf Nodes), entwickeln jedoch keine Schicht für entfernte Tool-Ausführung.
2. Schleife und Inferenz befinden sich beide auf dem Worker. Einfachster Fehlerbereich, aber Modellzugangsdaten (einschließlich OAuth-Profilen) müssten auf Wegwerfrechner übertragen werden, das Gateway verlöre die Kontrolle über Richtlinien, Routing und Auditing, und die Migration würde die Identität wechseln, die den Provider aufruft, wodurch Provider-Caches ungültig würden.
3. Schleife + Tools auf dem Worker, Modellaufrufe per Proxy über das Gateway. Ausgewählt. Ein Roundtrip pro Modell-Turn statt pro Tool-Aufruf; Tools werden direkt beim Code ausgeführt; das Gateway bleibt alleiniger Eigentümer der Authentifizierungsprofile, des Provider-Routings und der Richtlinien; der Worker enthält keine Geheimnisse.

Der Nachteil von Option 3 ist eine synchrone Abhängigkeit vom Gateway während jedes Modell-Turns. Daher sind die Regeln zur Dauerhaftigkeit Bestandteil der Entscheidung und kein nachträglicher Zusatz:

- Ein Gateway-Ausfall während eines Turns lässt den aktiven Provider-Aufruf fehlschlagen. Der Turn wird als fehlgeschlagen markiert und nach der Wiederverbindung als neuer Turn erneut versucht; ein laufender Provider-Stream wird nicht transparent wiedergegeben (Risiko doppelter Abrechnung bzw. doppelter Tool-Aufrufe).
- Jede Worker↔Gateway-Operation enthält eine dauerhafte Identität (siehe Worker-Protokoll), sodass Wiederverbindungen fortgesetzt werden oder zwischengespeicherte Endergebnisse abrufen, statt unerledigte Operationen zurückzulassen.
- Das Gateway ist eine kapazitätsverwaltete Komponente: Grenzwerte für gleichzeitige Worker, Flusssteuerung und Lastabwurf gehören zum Umfang von v1 (siehe Kapazität).

Da das Gateway sowohl das Transkript speichert als auch den gesamten Provider-Verkehr initiiert, ist die Sitzung standortunabhängig: Das Verschieben der Schleife zwischen Gateway und Worker ändert weder etwas auf Provider-Seite noch im UI-Datenpfad. Dadurch werden Übertragung und Rückholung kostengünstig.

## Komponenten

### 1. Umgebungszustandsautomat + Provider-Vertrag

`environments.*` im Gateway-Protokoll ist derzeit eine reine Statusprojektion. Der dauerhafte Kern besteht aus einem SQLite-verwalteten Umgebungsdatensatz und Zustandsautomaten, die vor den RPC-Strukturen entworfen werden:

`requested → provisioning → bootstrapping → ready → (attached|idle) → draining → destroying → destroyed | failed | orphaned`

- Die Bereitstellung ist absturzsicher: Der Absichtsdatensatz wird vor dem Provider-Aufruf mit einer deterministischen Operations-ID persistiert, sodass das Gateway nach einem Neustart ein laufendes Leasing übernehmen kann, statt eine kostenpflichtige Maschine doppelt bereitzustellen oder zu verwaisen.
- Der Abgleich nach Neustarts und ein Sweeper für verwaiste Ressourcen (Provider `inspect` gegenüber lokalen Datensätzen) sind Anforderungen für v1 und keine bloßen Härtungsmaßnahmen.

Provider-Vertrag (durch Plugins implementiert; keine Providernamen oder Richtlinien im Kern):

```ts
type WorkerProvider = {
  id: string;
  provision(profile: WorkerProfile, opId: string): Promise<WorkerLease>; // → SSH-Host/Port/Benutzer/Schlüsselmaterial
  inspect(lease: { leaseId: string; profile: WorkerProfile }): Promise<LeaseStatus>; // Übernahme/Zustand/Verwaisten-Sweep
  renew?(leaseId: string): Promise<void>; // langlebige Sitzungen gegenüber Provider-TTLs
  destroy(lease: { leaseId: string; profile: WorkerProfile }): Promise<void>; // idempotent, Rückgabe erst nach Nachweis des Abbaus
};
```

RPCs: `environments.create`, `environments.destroy`, erweitertes `environments.list/status` (Provider, Leasing-ID, Zustand, Alter, Leerlaufzeit, zugeordnete Sitzungen). Erste Provider: ein Wrapper für eine Leasing-CLI nach Crabbox-Muster (Produktpfad) und ein ausschließlich für Entwicklung gekennzeichneter Provider für statische SSH-Hosts – ein Worker auf einem gemeinsam genutzten Host kann nicht zugehörige Hostdaten lesen. Daher dienen statische Hosts der Funktionsentwicklung und sind nicht die Standard-Sicherheitskonfiguration.

### 2. Worker-Bootstrap: OpenClaw auf der Box installieren

Kein spezielles Worker-Artefakt und keine Abhängigkeit von der Verfügbarkeit von npm:

- Kanonische Installation für alle Modi: ein vom Gateway erzeugtes, inhaltsgehashtes Worker-Bundle (die eigene Build-Ausgabe des Gateways als Tarball gepackt), das per SSH übertragen und auf der Box installiert wird. Dies deckt konstruktionsbedingt Entwicklungs-Builds und unveröffentlichte Commits ab.
- `npm i -g openclaw@<exact gateway version>` ist eine Optimierung, wenn das Gateway eine veröffentlichte Version ausführt; niemals `latest`.
- Der Bootstrap ist idempotent; bei einem vorgewärmten Leasing mit übereinstimmendem Bundle-Hash wird die Installation übersprungen. Unvorbereitete Maschinen benötigen möglicherweise eine vernetzte Toolchain-Phase (Node-Laufzeit) – sie ist Teil der Einrichtungsphase und wird anschließend geschlossen.
- Der Handshake überprüft den Worker-Build-Hash, den Satz unterstützter Protokollfunktionen und die Laufzeitkompatibilität. Die vorhandenen Versions-/Protokollprüfungen des Gateways reichen hierfür nicht aus (über SSH getunnelte Nodes sind von der Ablehnung bei nicht exakt übereinstimmender Version ausgenommen), daher führt die Worker-Zulassung eine eigene Prüfung auf exakte Build-Übereinstimmung durch.

Der Worker-Modus (`openclaw worker`) ist ein Einstiegspunkt und kein Fork: Verbindungsverarbeitung plus eingebetteter Agent-Runner, wobei Sitzungspersistenz und Modellaufrufe durch Gateway-RPCs gestützt werden. Er darf keine Gateway-Oberflächen starten: keine Kanäle, kein automatischer Plugin-Start über das Toolset der Sitzung hinaus, ein kurzlebiges Zustandsverzeichnis und keine lokalen Authentifizierungsprofile.

### 3. Transport: alles über SSH

Das Gateway verwaltet die Konnektivität; der Worker benötigt ausschließlich sshd:

- Das Gateway öffnet eine SSH-Verbindung zum Worker (Zugangsdaten aus dem Provider-Leasing, Hostschlüssel anhand der Bereitstellungsausgabe fest angeheftet – kein `StrictHostKeyChecking=no`) und richtet einen Reverse-Tunnel ein, der einen Worker-lokalen Socket an den WS-Endpunkt des Gateways weiterleitet.
- Steuerungs-/Modellverkehr und Workspace-Übertragung verwenden getrennte SSH-Verbindungen mit demselben angehefteten Vertrauensmaterial, damit rsync Token-Streams nicht durch Head-of-Line-Blocking verzögern kann.
- Der Tunnel-Lebenszyklus (Keepalive, Wiederverbindung mit Backoff) wird von der Umgebungslaufzeit auf dem Gateway verwaltet. Eine kurze Tunnelunterbrechung ist auf Sitzungsebene unsichtbar: Der dauerhafte Protokollzustand (unten) ermöglicht es dem Worker, sich erneut zu verbinden und fortzufahren.

### 4. Worker-Protokoll (dediziert; nicht das Node-Protokoll)

Eine adversariale Überprüfung der aktuellen Node-Schnittstellen schloss eine einfache Wiederverwendung aus: Ausstehende Node-Aufrufe sind prozesslokale Promises, die mit der Verbindung verloren gehen, Node-Idempotenzschlüssel werden zwar geparst, aber nicht dedupliziert, und – entscheidend – eine verbundene Node kann gewöhnliche Node-Ereignisse ausgeben (einschließlich Anfragen zur Agent-Ausführung). Daher bildet „Node-Typ + Fähigkeitsobergrenze“ keine Sicherheitsgrenze für eingehenden Verkehr. Worker erhalten deshalb eine authentifizierte `worker`-Rolle mit einer geschlossenen, versionierten Positivliste für RPCs und Ereignisse; Worker-Verbindungen können keinen alten Node-Ereignishandler erreichen.

Identität und Zugangsdaten: Bei der Bereitstellung wird ein kurzlebiger Worker-Berechtigungsnachweis erzeugt, der an die Umgebungs-ID, den Worker-Schlüssel, den Bundle-Hash, die einzige zulässige Sitzung, den zulässigen RPC-Satz und ein Ablaufdatum gebunden ist. Die per SSH verifizierte Kopplung gilt weiterhin (wir haben die Box bereitgestellt und besitzen den Schlüssel), die Autorisierung erfolgt jedoch über den ausgestellten Berechtigungsnachweis und nicht über die deklarierte Node-Oberfläche.

Dauerhafte Operationssemantik (Struktur von der vorhandenen ACP-Laufzeit und ihrem Ereignis-Ledger übernommen – stabile Handles, Serialisierung pro Sitzung, dauerhafte Wiedergabe von `(session, seq)`):

- Jeder Vorgang ist `(sessionId, lifecycleRevision, runId, ownerEpoch, streamKind, seq)` zugeordnet.
- Besitzepochen grenzen veraltete Worker ab: Ein Ersatz-Worker erhöht die Epoche; verspätete Ergebnisse aus der alten Epoche werden deterministisch abgelehnt.
- Mindestens-einmal-Zustellung mit persistierten ACK-Cursorn und zwischengespeicherten Endergebnissen in SQLite; die Deduplizierung ist deterministisch. Keine Zusagen für Genau-einmal-Zustellung.
- Explizite Frames für Abbruch, Schließen, Fortsetzen und Endergebnisse; Credit-/Fenster-basierte Flusssteuerung für Streams.
- Die Aushandlung von Protokollfunktionen ist unabhängig von der allgemeinen Node-Protokollversion.

### 5. RPCs des Session-Backends

Zwei getrennte Verträge — die aktuelle Codebasis trennt dauerhafte Transkriptmutationen (im Besitz des Session-Managers, JSONL-Baum mit Eltern-/Blattzustand) von prozesslokalen Live-Ereignissen (Streaming-Deltas, Tool-Lebenszyklus, Genehmigungen), und das Worker-Protokoll muss diese Trennung beibehalten:

- Dauerhafte Transkript-Commits: Der Worker übermittelt semantische Append-Batches mit `runEpoch` sowie Compare-and-Swap des Basisblatts; der Gateway-Session-Manager erzeugt Eintrags-IDs und Eltern-IDs. Der Worker darf niemals vertrauenswürdige Transkriptzeilen, Eintrags-IDs, Eltern-IDs oder fremde Session-IDs bereitstellen.
- Wiederholbare Live-Ereignisse: eine typisierte Ereignis-Union mit Worker-Sequenznummern, Gateway-ACKs, begrenzter Aufbewahrung und Abgrenzung verspäteter Ereignisse, die den bestehenden Agent-Ereignis-Fan-out speist, sodass Chatansicht, Tool-Zeilen sowie Ungelesen-/Statuslogik sich identisch zu lokalen Sessions verhalten.

Inferenz-Proxy: Das Ereignisvokabular des bestehenden Runtime-Proxy-Stream-Clients (`src/agents/runtime/proxy.ts`) wird wiederverwendet, aber die Vertrauensgrenze wird verschoben. Der Worker sendet nur Session-/Ausführungsidentität, eine genehmigte Modellreferenz, Kontext und eingeschränkte Generierungsoptionen; der Gateway löst Provider, Endpunkt, Authentifizierung, Header, Routing und Kostenrichtlinie aus seinem eigenen Katalog auf. Ein vom Worker bereitgestelltes Modellobjekt (z. B. ein angreifergesteuertes `baseUrl`) wird abgelehnt. Größenlimits für Anfragen, Abbruch, Audit und die Wiederholung von Endergebnissen gelten ebenfalls. Im Gateway angesiedelte Tools (Websuche) werden auf dem Gateway ausgeführt und geben Ergebnisse über denselben Kanal zurück.

### 6. Workspace-Synchronisierung

Der Synchronisierungsanker ist ein Gateway-lokaler Workspace mit exklusivem Platzierungsbesitz: bei Git-Workspaces ein dedizierter verwalteter Worktree (bestehende Metadaten des verwalteten Worktrees — Branch, Basis, Snapshot-Besitz — bilden die Grundlage); bei Nicht-Git-Workspaces ein Gateway-eigenes Zielverzeichnis. Niemals der Live-Checkout des Benutzers. Der exklusive Besitz während der Remote-Platzierung der Session sorgt konstruktionsbedingt dafür, dass die eingehende Synchronisierung konfliktfrei ist.

Aufteilung des Besitzes — Commit gegenüber Veröffentlichung:

- Der Agent auf Worker-Seite erstellt Commits wie gewohnt in seiner Kopie (`git commit` ist ein lokaler Vorgang ohne Zugangsdaten; die Autorenidentität wird aus der Gateway-Konfiguration projiziert). Diese Commits sind inaktive Objekte, bis der Gateway sie übernimmt.
- Der Gateway übernimmt alles, was Vertrauen erfordert: Er prüft, ob eingehende Commits auf der aufgezeichneten Basis aufbauen, führt einen Fast-Forward des lokalen Worktrees durch, pusht, erstellt PRs und übernimmt optional das Signieren/erneute Signieren — alles mit Gateway-lokalen Zugangsdaten. Der Worker verfügt niemals über Git- oder Forge-Zugangsdaten und greift niemals auf ein Remote zu.

Zwei Synchronisierungsmodi, je nachdem, ob der Workspace ein Git-Repository ist:

- Git-Modus. Ausgehend: Der Worktree wird per rsync über die SSH-Identität des Tunnels synchronisiert (einschließlich nicht committeter und zulässiger nicht verfolgter Dateien; Include/Exclude nach Crabbox-Art, `.worktreeinclude` wird berücksichtigt) und als unveränderliches Basismanifest (Inhaltshashes + Basis-Commit) aufgezeichnet. Eingehend: Neue Commits werden als Git-Bundle oder temporäre Referenz auf Basis der aufgezeichneten Grundlage zurückgegeben; nicht verfolgte Artefakte werden über ein explizites Manifest mit Prüfungen von Größe, Typ und Symlink-Begrenzung zurückgegeben. Bei der Übernahme wird die Abstammung von der Basis geprüft und bei Divergenz abgebrochen — nichts überschreibt unbemerkt eine der beiden Seiten. Löschungen, Umbenennungen, Submodule und Symlink-Ausbrüche werden durch die Manifestregeln und nicht durch rsync-Heuristiken behandelt.
- Einfacher Modus (kein Git — z. B. wenn ein Projekt auf der Box von Grund auf erstellt wird). Ausgehend wird dieselbe Kombination aus rsync und Basismanifest verwendet. Eingehend wird ein anhand des Manifests abgeglichener Spiegel mit Weitergabe von Löschungen in das Gateway-eigene Zielverzeichnis zurückgeschrieben. Dies ist aus demselben Grund sicher wie der Git-Modus: Exklusiver Besitz bedeutet, dass keine gleichzeitigen lokalen Änderungen vorhanden sind, mit denen Konflikte entstehen könnten; das Basismanifest erkennt weiterhin unerwartete lokale Abweichungen und bricht ab, anstatt sie zu überschreiben.

Checkpointing schützt tagelange Sessions vor dem Verlust einer Lease: regelmäßige eingehende Checkpoints (Commits auf dem Session-Branch im Git-Modus, Manifest-Snapshots im einfachen Modus); der Rhythmus ist eine Profilrichtlinie (standardmäßig rundenbasiert).

### 7. Platzierungszustandsautomat, Sessions und UI

Die Laufzeitplatzierung ist ein SQLite-eigener, an die Session gebundener Zustandsautomat und kein Paar lose verknüpfter Zeilenfelder:

`local → requested → provisioning → syncing → starting → active(worker) → draining → reconciling → local | reclaimed | failed`

Er persistiert Umgebungs-ID, Übergangsgeneration, aktive Besitzerepoche, Workspace-Basismanifest, Worker-Bundle-Hash und letzte ACK-Cursor. Die Rundenzulassung beansprucht die Platzierung atomar, bevor eine der beiden Schleifen eine Runde startet. Dadurch kann eine lokale Nachricht, die anhand eines veralteten Snapshots zugelassen wurde, niemals mit einer Worker-Runde konkurrieren — zu jedem Zeitpunkt besitzt genau eine Schleife die Session.

UI:

- Eine Worker-Session ist eine gewöhnliche Session-Zeile mit zusätzlichen Platzierungsmetadaten. Sie befindet sich im regulären Speicher, wird über `sessions.list` aufgelistet und über bestehende Subscriptions gestreamt — Seitenleiste und Chat benötigen keinen neuen Datenpfad, sondern nur eine Darstellung: ein Worker-Badge und den Platzierungs-/Umgebungsstatus (`provisioning / syncing / running / idle / reconciling / reclaimed`).
- Erstellungs-UX: Die Session-Zielleiste (Neugestaltung der Sessions-Seitenleiste) erhält neben Gateway und Node ein Cloud-Worker-Ziel. Dafür ist ein konfiguriertes Provider-Profil erforderlich; die Funktion ist bis zur Konfiguration unsichtbar.
- Agent-Dispatch: Mit einem Session-Tool kann ein Agent Arbeit auf dieselbe Weise wie ein Mensch an einen Cloud-Worker übergeben (Worker-gestützte Sub-Session im Stil eines Subagenten). Wird im selben Meilenstein wie der menschliche Dispatch ausgeliefert und durch dieselbe optionale Provider-Konfiguration geschützt. Die Rekursion ist strukturell begrenzt (Worker-Sessions können in v1 nicht selbst Worker beauftragen); die Ausgabenkontrolle erfolgt durch umgebungsbezogene Abrechnung/Audits, nicht durch Quotenmechanismen.

## Dispatch und Übergabe

v1 ist bewusst asymmetrisch:

- Lokal → Worker (Dispatch): Die nachfolgende Migrationsbarriere passieren, einen Worker bereitstellen oder wiederverwenden, synchronisieren, die Platzierung umschalten; die nächste Runde wird remote ausgeführt.
- Worker → lokal (Zurückholen): Die Session anhalten (den Worker gemäß derselben Barriere leeren), den eingehenden Abgleich abschließen und die Platzierung auf lokal umschalten. Keine Live-Migration.
- Die symmetrische Live-Übergabe (Verschieben einer aktiv arbeitenden Session in beide Richtungen ohne Anhalten) verwendet dieselbe Barriere- und Abgleichsmechanik und wird ausgeliefert, nachdem Fehlerinjektionstests die Barriere bestätigt haben.

Migrationsbarriere („Rundengrenze“ allein reicht nicht aus — Genehmigungen, Hintergrundprozesse und Transkriptzusammenführungen nach Freigabe einer Sperre können sie überspannen):

1. Zulassung neuer Runden anhalten (Platzierungsanspruch).
2. Aktive Ausführungen abbrechen oder leeren.
3. Ausstehende Ausführungsgenehmigungen und Ausführungsberechtigungen widerrufen.
4. Transkriptseitenschreibvorgänge und ACKs von Live-Ereignissen vollständig abarbeiten.
5. Untergeordnete Worker-Prozesse beenden.
6. Den alten Besitzer durch Erhöhen der Besitzerepoche abgrenzen.
7. Workspace abgleichen (eingehend, konfliktbewusst).
8. Den neuen Besitzer aktivieren.

Cache-Affinität: Da Provider-Anfragen bei beiden Platzierungen vom Gateway ausgehen, bleibt die Cache-Affinität erhalten, wenn die serialisierte Provider-Anfrage äquivalent bleibt — gleiche Tool-Reihenfolge, Systemanweisungen, Provider-Wrapper und Cache-Metadaten (die auf Gateway-Seite verbleiben). Dies ist eine testbare Eigenschaft und keine Annahme: Byte-Äquivalenztests zwischen lokaler und Worker-Platzierung für jeden unterstützten Provider-Transport sind Teil des Meilensteins, der die Worker-Schleife einführt.

## Sicherheitsmodell

Präzise formuliert: Der Worker hat keinen direkten Netzwerk-Egress und keine dauerhaft hinterlegten Provider-/Forge-Zugangsdaten. Es handelt sich nicht um „Null-Egress“ — Inferenz und vom Gateway ausgeführte Tools sind kontrollierte Egress-Kanäle (ein durch Prompt-Injection manipulierter Worker kann weiterhin Workspace-Bytes in den Modellkontext oder in Websuchanfragen einfügen). Dementsprechend:

- Abrechnung des kontrollierten Egress: umgebungsbezogene Audits und für Betreiber sichtbare Abrechnung für den Inferenz-Proxy und die Gateway-Tools. Raten-/Byte-Limits existieren als Protokollflusssteuerung (Kapazität), nicht als Mechanismus für Ausgabenquoten.
- Der Worker-Ingress zum Gateway ist auf die geschlossene Positivliste des Worker-Protokolls beschränkt; Transkriptschreibvorgänge sind strukturell eingeschränkt (vom Gateway erzeugte IDs, eine einzige gebundene Session).
- Die Worker-Ausführung hat innerhalb der Box vollständige Berechtigungen. Die Box ist temporär und enthält keine Zugangsdaten, sodass eine Genehmigung pro Befehl Reibung erzeugt, ohne etwas zu schützen; die abgesicherte Grenze bilden der eingehende Abgleich und das Audit. Die Ausführung durchläuft niemals den Node-Genehmigungspfad des Gateways.
- Die Internetrichtlinie ist eine Provider-Entscheidung zum Bereitstellungszeitpunkt: Das Umgebungsprofil legt bei der Erstellung der Box fest, ob Firewall, Sicherheitsgruppe oder ein Netzwerk ohne Egress verwendet wird, optional mit einer vernetzten Einrichtungsphase, die der Provider vor der Agent-Phase schließt. Core implementiert keinen Laufzeit-Netzwerkschalter.
- Box-Hygiene zum Bereitstellungszeitpunkt: Cloud-Metadatenendpunkt blockiert oder nachweislich nicht vorhanden, kein Instanzprofil, kein übernommener SSH-Agent, kein Docker-Socket, saubere Umgebung und sauberes Home-Verzeichnis. SSH-Hostschlüssel werden anhand der Bereitstellungsausgabe fest verankert.
- Genehmigungen und Richtlinien für alle Gateway-seitigen Vorgänge (Push, PR, Provider-Aufrufe) werden weiterhin auf dem Gateway ausgeführt.

Auswirkungsbereich einer kompromittierten Worker-Session: die synchronisierte Workspace-Kopie sowie das, was die auditierten Proxy-Kanäle zulassen — keine Zugangsdaten, kein direktes Netzwerk und keine Gateway-Oberfläche außerhalb der Positivliste.

## Kapazität

Der Gateway leitet jeden Prompt und Token-Stream für N Worker weiter. Daher definiert v1 ein Kapazitätsmodell, anstatt es erst in der Produktion zu entdecken: Limits für gleichzeitige Worker pro Gateway, Credit-Fenster pro Stream (die aktuelle Ereignisstream-Warteschlange ist unbegrenzt, und die Obergrenze des Node-Socket-Puffers erzwingt das Schließen bei langsamen Verbrauchern — beides ist unverändert ungeeignet), begrenztes Spooling auf Datenträger für Lastspitzen sowie Lastabweisung mit sichtbaren Rückstauzuständen in der UI. Die Workspace-Übertragung verbleibt auf ihrem eigenen SSH-Kanal.

## Lebenszyklus

- Automatisches Anhalten bei Inaktivität und TTL sind Richtlinien des Provider-Profils und keine festen Konstanten. Die Standardwerte sind großzügig und umfassen explizites Keep-Alive; tagelange Arbeit wird vollständig unterstützt (Provider `renew` ist für Lease-basierte Backends vorhanden); eine Session mit einer laufenden Runde oder kürzlicher Aktivität wird niemals zurückgefordert.
- Beim Ausfall oder Zurückfordern eines Workers wechselt die Platzierung zu `reclaimed`, die Session-Zeile bleibt bestehen, und die nächste Nachricht stellt einen neuen Worker bereit und synchronisiert erneut ab dem letzten Checkpoint. Die Unterhaltung geht niemals verloren (Gateway-seitiger Speicher); Workspace-Änderungen seit dem letzten Checkpoint gehen verloren, und die UI weist darauf hin.
- Wiederverwendung warmer Leases ab dem ersten Tag (bei Providern, die dies unterstützen); ein Image-Snapshot nach dem Bootstrap ist der Schnellstartpfad für v2.

## Konfigurationsoberfläche

Minimal und optional: ein Provider-Profilblock (Provider-ID, Zugangsdaten-/CLI-Referenz, Synchronisierungsregeln, Lebensdauerrichtlinie, Budgets, optionale Einrichtungsphase) sowie eine Platzierungsauswahl pro Session. Keine neuen Umgebungsvariablen. Nicht konfigurierte Installationen zeigen nichts an.

## Meilensteine

Die Implementierung erfolgt in kleinen, unabhängig zusammenführbaren PRs; jeder nachfolgende Meilenstein ist eine PR-Serie und keine einzelne Änderung.

1. Grundlagen: Umgebungs-Zustandsautomat + Provider-Vertrag + Provider nach dem crabbox-Muster (statisches SSH als Entwicklungs-Testumgebung), Bootstrap des Worker-Bundles + Zulassungs-Handshake, SSH-Tunnel + Hostschlüssel-Pinning, Snapshot des verwalteten Worktrees + ausgehende Synchronisierung (Git- + Klartextmodi). Bereinigung verwaister Instanzen + Übernahme nach Neustart.
2. Worker-Protokoll + Worker-Schleife: authentifizierte Worker-Rolle, persistente Operationen/Epochen/ACK-Cursor, Transkript-Commit + Verträge für Live-Ereignisse, Inferenz-Proxy mit vom Gateway aufgelösten Modellen, Flusssteuerung. Ein Provider, manuelle Verteilung nur neuer Sitzungen, keine Übergabe. Fehlerinjektionstests (Tunnelunterbrechung, Gateway-Neustart, Worker-Ausfall) sind Voraussetzung für den Abschluss.
3. Verteilung + Rückholung + Agentenverteilung: Migrationsbarriere, mit der Zielleiste der UI verbundener Platzierungs-Zustandsautomat, eingehende Abstimmung + Prüfpunkte, Audit pro Umgebung, Kapazitätsgrenzen, Agentenverteilungs-Tool (Worker-Sitzungen können nicht rekursiv aufgerufen werden). Tests auf Byte-Äquivalenz des Prompt-Caches.
4. Symmetrische Live-Übergabe nach dem Fehlerinjektionsnachweis für Meilenstein 3.

Später: ACP-Testumgebungen auf Workern als optionale Anmeldedaten-Hydratisierung pro Umgebung; schneller Start per Snapshot/vorgewärmtem Image; Fan-out (N Leases, derselbe Prompt); Betriebssystem-Sandboxing innerhalb der Box; umfassendere Artefakterfassung über das Artefaktschema.

## Offene Fragen

- Verfügbarkeit von Plugins/Skills auf Workern: Im Repository enthaltene Skills werden ohne Zusatzaufwand mit dem Arbeitsbereich synchronisiert; für vom Gateway konfigurierte Agenten-Skills/-Plugins ist eine ausdrückliche Entscheidung über Synchronisierung oder Ausschluss erforderlich (das Tool-/Plugin-Manifest ist in beiden Fällen Teil des Zulassungs-Handshakes).
- Standardintervall für Prüfpunkte: rundenbasiert oder zeitbasiert für sehr kommunikationsintensive Sitzungen.
- Wie Umgebungsprofile mit dem Multi-Agenten-Routing interagieren (Standardprofile pro Agent oder ausschließlich Auswahl pro Sitzung).
