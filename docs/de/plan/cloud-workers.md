---
read_when:
    - Entwurf oder Implementierung der Bereitstellung von Cloud-Workern, des Worker-Modus oder der Sitzungsübergabe
    - Änderungen an environments.*, dem Worker-Protokoll, der Transkriptaufnahme oder den RPCs des Inferenz-Proxys
    - Überprüfung der Sicherheitslage bei der Remote-Ausführung von Agenten
summary: Führen Sie Agentensitzungen auf kurzlebigen, per SSH erreichbaren Maschinen mit über den Gateway weitergeleiteter Inferenz und Live-Streaming in der Seitenleiste aus.
title: Cloud-Worker-Plan
x-i18n:
    generated_at: "2026-07-12T15:37:32Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 134c3f6e486837607225d95d12a3153525b14237b362b9f9957313d9bc379dc4
    source_path: plan/cloud-workers.md
    workflow: 16
---

## Status

Vorschlag, Revision 3. Nicht implementiert. Richtung 2026-07 abgestimmt; Revision 2 berücksichtigte die Ergebnisse der adversarialen Überprüfung (dediziertes Worker-Protokoll, Zustandsautomaten für Platzierung und Umgebung, Git-bewusste eingehende Synchronisierung, unidirektionale Übergabe in v1, Sicherheitsformulierung zu kontrolliertem ausgehendem Datenverkehr). Revision 3 legt das Zuständigkeitsmodell für die Synchronisierung fest (der Worker erstellt Commits, der Gateway übernimmt und veröffentlicht sie), fügt einen einfachen Synchronisierungsmodus ohne Git hinzu, korrigiert die Worker-Ausführung auf vollständige Ausführung innerhalb der Box, verlagert die Internetrichtlinie in die Bereitstellungsphase und nimmt die Agent-Übertragung wieder in Meilenstein 3 auf.

## Problem

OpenClaw-Agent-Sitzungen führen ihre Schleife, Tools und Inferenz innerhalb des Gateway-Prozesses auf einem einzelnen Rechner aus. Die Rechenleistung ist durch diesen Rechner begrenzt, lang andauernde Aufgaben belegen ihn und parallele Arbeiten konkurrieren um seine Ressourcen. Gehostete Produkte (Cursor Cloud Agents, Claude Code im Web, Codex Cloud) lösen dies mit kurzlebigen Cloud-Sandboxes pro Aufgabe, setzen jedoch die Infrastruktur und das Vertrauen in den jeweiligen Anbieter voraus.

Betreiber, die bereits über ungenutzte Rechner verfügen (oder diese günstig mieten können), haben keine Möglichkeit festzulegen: Führen Sie diese Sitzung dort aus, zeigen Sie sie wie jede andere Sitzung in meiner Seitenleiste an und verwerfen Sie den Rechner anschließend.

## Ziele

- Eine vollständige Agent-Sitzung (Schleife + Tools) auf einem kurzlebigen entfernten Rechner („Cloud-Worker“) ausführen, während die Sitzung in der Control UI genau wie eine lokale Sitzung angezeigt und gestreamt wird.
- Keine dauerhaft vorhandenen Anmeldedaten auf dem Worker (keine Provider-Authentifizierung, keine Forge-Token) und kein direkter ausgehender Netzwerkzugriff; die Box benötigt lediglich einen erreichbaren sshd.
- Bereitstellen, synchronisieren, ausführen, Ergebnisse erfassen, zerstören — vollständig automatisiert und mit austauschbaren Providern (erster Provider: Lease-CLIs nach dem Muster von Crabbox).
- Laufende Arbeit an einer Turn-Grenze vom Gateway an einen Worker übertragen, ohne Transkript, Sitzungsidentität oder — sofern die Anfragebytes gleichwertig bleiben — die Affinität zum Provider-Cache zu verlieren; Ergebnisse sicher zurückholen.
- Sowohl Menschen (UI) als auch Agents (Tool) können Arbeit an einen Cloud-Worker übertragen.
- Mehrtägige Sitzungen unterstützen; die Lebensdauer wird durch Richtlinien bestimmt und ist keine fest codierte Obergrenze.

## Nichtziele (v1)

- Keine externen Coding-Harnesses (Claude Code, Codex CLI) auf Workern. Worker-Sitzungen führen ausschließlich den eingebetteten Runner von OpenClaw aus. Harness-Unterstützung ist eine optionale v2-Funktion, da Harnesses ihre eigene Inferenz mit eigenen Anmeldedaten ausführen.
- Keine Best-of-N-Auffächerung oder parallele Versuche.
- Keine Abhängigkeit von VPN oder Tailnet. Der Transport erfolgt ausschließlich über SSH.
- Keine neue Sandbox-Laufzeit. Der Worker-Rechner bildet die Isolationsgrenze; später kann zusätzlich eine betriebssystemseitige Sandbox innerhalb der Box eingesetzt werden.
- Keine symmetrische Live-Migration in v1: Die Übertragung erfolgt lokal → Worker; Worker → lokal erfordert eine angehaltene Sitzung und eine abgeschlossene Abstimmung des Arbeitsbereichs. Eine spätere bidirektionale Live-Übergabe baut auf denselben Barrierenmechanismen auf.
- Kein JSON-Nebenzustand auf dem Gateway; Umgebungs-, Platzierungs-, Cursor- und Berechtigungszustände werden in SQLite gespeichert.

## Vorbilder (was wir übernehmen, was wir umkehren)

- Cursor Cloud Agents: Die Agent-Schleife läuft in deren Cloud; die VM ist ein Ziel für die Tool-Ausführung; ein nur erweiterbarer Konversationsspeicher wird an alle Clients gestreamt; ein Snapshot nach der Installation ermöglicht einen schnellen Warmstart; selbst gehostete Worker sind ausschließlich ausgehend kommunizierende Worker-Prozesse. Wir übernehmen das Modell, bei dem „die maßgebliche Konversationsquelle beim Orchestrator verbleibt“, sowie das Streaming-Modell; die Platzierung der Schleife kehren wir um (siehe Entscheidung unten).
- Codex Cloud: zweiphasige Laufzeit — eine vernetzte Einrichtungsphase, anschließend eine Offline-Agent-Phase, in der Geheimnisse entfernt wurden; Cache des Containerzustands für schnelle Folgeaufgaben. Wir übernehmen die Phasentrennung als Ansatz für ausgehenden Datenverkehr und die Cache-Idee für vorgewärmte Images in v2.
- Claude Code im Web: VM pro Sitzung; Git-Proxy zur Isolierung von Anmeldedaten (echte Token gelangen niemals in die Sandbox, Push ist auf den Sitzungs-Branch beschränkt); Dateisystem-Snapshot nach der Einrichtung; Teleport-Übergabe = gepushter Branch + erneut abgespielter Verlauf. Wir übernehmen die Isolierung der Anmeldedaten und das Übergabemodell, die ausgehende Synchronisierung erfolgt jedoch per rsync vom Gateway, damit auch nicht bereinigte Arbeitsverzeichnisse funktionieren und sich kein Forge-Token in der Nähe der Box befindet.
- Copilot Coding Agent: standardmäßig verweigerter ausgehender Datenverkehr mit Positivliste für Paketregistries. Unser Standard im stabilen Betrieb ist strenger (überhaupt kein direkter ausgehender Datenverkehr), da Inferenz und Websuche durch den SSH-Tunnel übertragen werden — siehe jedoch Sicherheit, weshalb dies „kontrollierter ausgehender Datenverkehr“ und nicht „kein ausgehender Datenverkehr“ ist.

## Architekturentscheidung: Schleife auf dem Worker, Inferenz über den Gateway

Drei Platzierungen wurden berücksichtigt:

1. Die Schleife verbleibt auf dem Gateway, der Worker führt Tools aus (Cursor-Modell). Sicherste Fehlerdomäne (Transkript, Inferenz, Genehmigungen und Wiederherstellung nach Neustarts verbleiben alle lokal) und von einem Prüfer bevorzugter erster Meilenstein. Als Produktarchitektur verworfen: Die Nicht-Ausführungs-Tools von OpenClaw sind prozessinterne Dateisystemoperationen, sodass jedes Lesen, Bearbeiten oder Durchsuchen von Dateien zu einem Netzwerk-Roundtrip oder einer umfangreichen Umgestaltung der Tool-Oberfläche in grobe Arbeitsbereich-RPCs führt; das Laufzeitverhalten ist kommunikationsintensiv und latenzabhängig. Wir übernehmen den Grundgedanken dort, wo er bereits umgesetzt ist (Auslagerung der Ausführung an Nodes), entwickeln jedoch keine Tool-Remoting-Schicht.
2. Schleife und Inferenz laufen beide auf dem Worker. Einfachste Fehlerdomäne, aber Modell-Anmeldedaten (einschließlich OAuth-Profile) müssten an kurzlebige Rechner übertragen werden, der Gateway verliert die Kontrolle über Richtlinien, Routing und Auditierung, und die Migration ändert die Identität, die den Provider aufruft, wodurch Provider-Caches ungültig werden.
3. Schleife + Tools auf dem Worker, Modellaufrufe über den Gateway weitergeleitet. Ausgewählt. Ein Roundtrip pro Modell-Turn statt pro Tool-Aufruf; die Tools laufen direkt beim Code; der Gateway bleibt alleiniger Eigentümer der Authentifizierungsprofile, des Provider-Routings und der Richtlinien; der Worker enthält keine Geheimnisse.

Option 3 verursacht bei jedem Modell-Turn eine synchrone Abhängigkeit vom Gateway. Daher sind ihre Dauerhaftigkeitsregeln Bestandteil der Entscheidung und kein nachträglicher Zusatz:

- Ein Ausfall des Gateways während eines Turns lässt den aktiven Provider-Aufruf fehlschlagen. Der Turn wird als fehlgeschlagen markiert und nach der erneuten Verbindung als neuer Turn wiederholt; ein laufender Provider-Stream wird nicht transparent erneut abgespielt (Risiko doppelter Abrechnung oder doppelter Tool-Aufrufe).
- Jede Worker↔Gateway-Operation enthält eine dauerhafte Identität (siehe Worker-Protokoll), sodass erneute Verbindungen fortgesetzt werden oder zwischengespeicherte Endergebnisse abrufen, anstatt hängen zu bleiben.
- Der Gateway ist eine kapazitätsverwaltete Komponente: Begrenzungen für gleichzeitig aktive Worker, Flusssteuerung und Lastabwurf gehören zum Umfang von v1 (siehe Kapazität).

Da der Gateway sowohl das Transkript speichert als auch den gesamten Provider-Datenverkehr initiiert, ist die Sitzung ortsunabhängig: Das Verschieben der Schleife zwischen Gateway und Worker ändert weder auf Provider-Seite noch im UI-Datenpfad etwas. Dadurch werden die Übertragung und das Zurückholen kostengünstig.

## Komponenten

### 1. Zustandsautomat für Umgebungen + Provider-Vertrag

`environments.*` im Gateway-Protokoll ist derzeit eine reine Statusprojektion. Der dauerhafte Kern besteht aus einem SQLite-verwalteten Umgebungsdatensatz und Zustandsautomaten, die vor den RPC-Strukturen entworfen werden:

`requested → provisioning → bootstrapping → ready → (attached|idle) → draining → destroying → destroyed | failed | orphaned`

- Die Bereitstellung ist absturzsicher: Der Absichtsdatensatz wird vor dem Provider-Aufruf mit einer deterministischen Vorgangs-ID persistiert, sodass ein Gateway-Neustart eine laufende Lease übernehmen kann, anstatt versehentlich zwei Rechner bereitzustellen oder einen kostenpflichtigen Rechner zu verwaisen.
- Die Abstimmung nach Neustarts und ein Bereiniger für verwaiste Ressourcen (`inspect` des Providers gegenüber lokalen Datensätzen) sind Anforderungen für v1 und keine nachträglichen Härtungsmaßnahmen.

Provider-Vertrag (durch Plugin implementiert; keine Providernamen oder Richtlinien im Kern):

```ts
type WorkerProvider = {
  id: string;
  provision(profile: WorkerProfile, opId: string): Promise<WorkerLease>; // → SSH-Host/Port/Benutzer/Schlüsselmaterial
  inspect(lease: { leaseId: string; profile: WorkerProfile }): Promise<LeaseStatus>; // Übernahme/Systemzustand/Bereinigung verwaister Ressourcen
  renew?(leaseId: string): Promise<void>; // langlebige Sitzungen gegenüber Provider-TTLs
  destroy(lease: { leaseId: string; profile: WorkerProfile }): Promise<void>; // idempotent, kehrt erst nach nachgewiesenem Abbau zurück
};
```

RPCs: `environments.create`, `environments.destroy`, erweiterte `environments.list/status` (Provider, Lease-ID, Zustand, Alter, Leerlaufzeit, zugeordnete Sitzungen). Erste Provider: ein Wrapper für eine Lease-CLI nach dem Muster von Crabbox (Produktpfad) und ein Provider für statische SSH-Hosts, der als ausschließlich für die Entwicklung vorgesehen gekennzeichnet ist — ein Worker auf einem gemeinsam genutzten Host kann fremde Hostdaten lesen, daher dienen statische Hosts der Funktionsentwicklung und entsprechen nicht der standardmäßigen Sicherheitsausrichtung.

### 2. Worker-Bootstrap: OpenClaw auf der Box installieren

Kein speziell angefertigtes Worker-Artefakt und keine Abhängigkeit von der Verfügbarkeit von npm:

- Kanonische Installation für alle Modi: ein vom Gateway erzeugtes Worker-Bundle mit Inhalts-Hash (die eigenen Build-Ausgaben des Gateways, als Tarball gepackt), das über SSH übertragen und auf der Box installiert wird. Damit werden Entwicklungs-Builds und unveröffentlichte Commits konstruktionsbedingt abgedeckt.
- `npm i -g openclaw@<exact gateway version>` ist eine Optimierung, wenn der Gateway eine veröffentlichte Version ausführt; niemals `latest`.
- Der Bootstrap ist idempotent; eine vorgewärmte Lease mit übereinstimmendem Bundle-Hash überspringt die Installation. Unvorbereitete Rechner benötigen möglicherweise eine vernetzte Toolchain-Phase (Node-Laufzeit) — diese ist Teil der Einrichtungsphase und wird anschließend geschlossen.
- Der Handshake überprüft den Worker-Build-Hash, die Menge der Protokollfunktionen und die Laufzeitkompatibilität. Die bestehenden Gateway-Versions- und Protokollprüfungen reichen hierfür nicht aus (über SSH getunnelte Nodes sind von der Ablehnung bei abweichender exakter Version ausgenommen), daher führt die Worker-Zulassung eine eigene Prüfung auf exakt übereinstimmende Builds durch.

Der Worker-Modus (`openclaw worker`) ist ein Einstiegspunkt und keine Abspaltung: Verbindungsverwaltung plus eingebetteter Agent-Runner, wobei Sitzungspersistenz und Modellaufrufe auf Gateway-RPCs basieren. Er darf keine Gateway-Oberflächen starten: keine Kanäle, kein automatischer Start von Plugins außerhalb des Sitzungs-Toolsets, ein temporäres Zustandsverzeichnis und keine lokalen Authentifizierungsprofile.

### 3. Transport: alles über SSH

Der Gateway ist für die Konnektivität zuständig; der Worker benötigt ausschließlich sshd:

- Der Gateway öffnet eine SSH-Verbindung zum Worker (Anmeldedaten aus der Provider-Lease, Hostschlüssel aus der Bereitstellungsausgabe fest hinterlegt — kein `StrictHostKeyChecking=no`) und richtet einen Reverse-Tunnel ein, der einen Worker-lokalen Socket an den WS-Endpunkt des Gateways weiterleitet.
- Steuerungs-/Modellverkehr und Arbeitsbereichsübertragung verwenden separate SSH-Verbindungen mit demselben fest hinterlegten Vertrauensmaterial, sodass rsync Token-Streams nicht durch Head-of-Line-Blocking verzögern kann.
- Der Lebenszyklus des Tunnels (Keepalive, erneute Verbindung mit Backoff) wird von der Umgebungslaufzeit auf dem Gateway verwaltet. Eine kurze Tunnelunterbrechung ist auf Sitzungsebene nicht sichtbar: Der dauerhafte Protokollzustand (unten) ermöglicht dem Worker, sich erneut zuzuordnen und fortzufahren.

### 4. Worker-Protokoll (dediziert; nicht das Node-Protokoll)

Eine adversariale Überprüfung der aktuellen Node-Schnittstellen schloss eine einfache Wiederverwendung aus: Ausstehende Node-Aufrufe sind prozesslokale Promises, die mit der Verbindung verloren gehen, Node-Idempotenzschlüssel werden zwar geparst, aber nicht dedupliziert, und — entscheidend — eine verbundene Node kann gewöhnliche Node-Ereignisse ausgeben (einschließlich Anforderungen für Agent-Ausführungen), sodass „Node-Typ + Funktionsobergrenze“ keine Sicherheitsgrenze für eingehende Daten darstellt. Worker erhalten daher eine authentifizierte Rolle `worker` mit einer geschlossenen, versionierten Positivliste für RPCs und Ereignisse; Worker-Verbindungen können keine Legacy-Node-Ereignisbehandlung erreichen.

Identität und Anmeldedaten: Bei der Bereitstellung werden kurzlebige Worker-Anmeldedaten erzeugt, die an die Umgebungs-ID, den Worker-Schlüssel, den Bundle-Hash, die einzige zulässige Sitzung, die erlaubte RPC-Menge und ein Ablaufdatum gebunden sind. Die per SSH verifizierte Kopplung gilt weiterhin (wir haben die Box bereitgestellt und besitzen den Schlüssel), die Autorisierung erfolgt jedoch anhand der erzeugten Anmeldedaten und nicht anhand der deklarierten Node-Oberfläche.

Semantik dauerhafter Vorgänge (Struktur aus der bestehenden ACP-Laufzeit und ihrem Ereignis-Ledger übernommen — stabile Handles, Serialisierung pro Sitzung, dauerhafte Wiedergabe von `(session, seq)`):

- Jeder Vorgang ist auf `(sessionId, lifecycleRevision, runId, ownerEpoch, streamKind, seq)` begrenzt.
- Eigentümerepochen grenzen veraltete Worker aus: Ein Ersatz-Worker erhöht die Epoche; verspätete Ergebnisse der alten Epoche werden deterministisch abgelehnt.
- Mindestens-einmal-Zustellung mit persistierten ACK-Cursorn und zwischengespeicherten Endergebnissen in SQLite; die Deduplizierung ist deterministisch. Keine Zusicherung einer Genau-einmal-Zustellung.
- Explizite Frames für Abbruch, Schließen, Fortsetzen und Endergebnisse; kredit-/fensterbasierte Flusssteuerung für Streams.
- Die Aushandlung von Protokollfunktionen erfolgt unabhängig von der allgemeinen Version des Node-Protokolls.

### 5. RPCs für das Sitzungs-Backend

Zwei unterschiedliche Verträge — die aktuelle Codebasis trennt dauerhafte Transkriptmutationen (im Besitz des Session-Managers, JSONL-Baum mit übergeordnetem Blattzustand) von prozesslokalen Live-Ereignissen (Streaming-Deltas, Tool-Lebenszyklus, Genehmigungen), und das Worker-Protokoll muss diese Trennung beibehalten:

- Dauerhafte Transkript-Commits: Der Worker übermittelt semantische Anhänge-Batches mit `runEpoch` und Compare-and-Swap des Basisblatts; der Gateway-Session-Manager generiert Eintrags-IDs und übergeordnete IDs. Der Worker darf niemals vertrauenswürdige Transkriptzeilen, Eintrags-IDs, übergeordnete IDs oder fremde Session-IDs bereitstellen.
- Wiederholbare Live-Ereignisse: eine typisierte Ereignis-Union mit Worker-Sequenznummern, Gateway-ACKs, begrenzter Aufbewahrung und Abgrenzung verspäteter Ereignisse, die das bestehende Agent-Ereignis-Fan-out speist, sodass Chatansicht, Tool-Zeilen und Ungelesen-/Statuslogik sich identisch zu lokalen Sessions verhalten.

Inferenz-Proxy: Das Ereignisvokabular des bestehenden Runtime-Proxy-Stream-Clients (`src/agents/runtime/proxy.ts`) wiederverwenden, aber die Vertrauensgrenze verschieben. Der Worker sendet nur Session-/Ausführungsidentität, eine genehmigte Modellreferenz, Kontext und eingeschränkte Generierungsoptionen; der Gateway löst Provider, Endpunkt, Authentifizierung, Header, Routing und Kostenrichtlinie aus seinem eigenen Katalog auf. Ein vom Worker bereitgestelltes Modellobjekt (z. B. ein angreifergesteuertes `baseUrl`) wird abgelehnt. Größenbeschränkungen für Anfragen, Abbruch, Auditierung und Wiederholung des Endergebnisses gelten. Im Gateway angesiedelte Tools (Websuche) werden auf dem Gateway ausgeführt und geben Ergebnisse über denselben Kanal zurück.

### 6. Workspace-Synchronisierung

Der Synchronisierungsanker ist ein Gateway-lokaler Workspace mit exklusivem Platzierungseigentum: bei Git-Workspaces ein dedizierter verwalteter Worktree (bestehende Metadaten für verwaltete Worktrees — Branch, Basis, Snapshot-Eigentum — bilden die Grundlage); bei Nicht-Git-Workspaces ein Gateway-eigenes Zielverzeichnis. Niemals der aktive Checkout des Benutzers. Das exklusive Eigentum, während die Session entfernt platziert ist, macht die eingehende Synchronisierung konstruktionsbedingt konfliktfrei.

Eigentumsaufteilung — Commit gegenüber Veröffentlichung:

- Der Worker-seitige Agent erstellt Commits wie gewohnt in seiner Kopie (`git commit` ist ein lokaler Vorgang ohne Anmeldedaten; die Autorenidentität wird aus der Gateway-Konfiguration projiziert). Diese Commits sind inaktive Objekte, bis der Gateway sie übernimmt.
- Der Gateway erledigt alles, was Vertrauen erfordert: Überprüfung, dass eingehende Commits auf der aufgezeichneten Basis aufbauen, Fast-Forward des lokalen Worktrees, Push, PR-Erstellung und optionales Signieren/Neusignieren — alles mit Gateway-lokalen Anmeldedaten. Der Worker besitzt niemals Git- oder Forge-Anmeldedaten und greift niemals auf ein Remote zu.

Zwei Synchronisierungsmodi, ausgewählt danach, ob der Workspace ein Git-Repository ist:

- Git-Modus. Ausgehend: Den Worktree per rsync über die SSH-Identität des Tunnels synchronisieren (einschließlich nicht committeter und zulässiger nicht verfolgter Dateien; Ein-/Ausschlüsse nach Crabbox-Art, `.worktreeinclude` wird berücksichtigt), aufgezeichnet als unveränderliches Basismanifest (Inhaltshashes + Basis-Commit). Eingehend: Neue Commits werden als Git-Bundle oder temporäre Referenz relativ zur aufgezeichneten Basis zurückgegeben; nicht verfolgte Artefakte werden über ein explizites Manifest mit Prüfungen von Größe, Typ und Symlink-Einschließung zurückgegeben. Die Übernahme überprüft die Basisabstammung und stoppt bei Abweichungen — nichts überschreibt stillschweigend eine der beiden Seiten. Löschungen, Umbenennungen, Submodule und Symlink-Ausbrüche werden durch die Manifestregeln behandelt, nicht durch rsync-Heuristiken.
- Einfacher Modus (kein Git — z. B. wenn ein Projekt von Grund auf in der Box erstellt wird). Ausgehend wird dasselbe rsync-Verfahren mit Basismanifest verwendet. Eingehend wird eine per Manifestvergleich ermittelte Spiegelung mit Weitergabe von Löschungen in das Gateway-eigene Zielverzeichnis zurückgeführt. Aus demselben Grund sicher wie der Git-Modus: Exklusives Eigentum bedeutet, dass keine gleichzeitigen lokalen Änderungen vorliegen, mit denen Konflikte entstehen könnten; das Basismanifest erkennt dennoch unerwartete lokale Abweichungen und stoppt, statt sie zu überschreiben.

Checkpointing schützt mehrtägige Sessions vor dem Verlust einer Lease: regelmäßige eingehende Checkpoints (Session-Branch-Commits im Git-Modus, Manifest-Snapshots im einfachen Modus); der Rhythmus ist Profilrichtlinie (standardmäßig turnbasiert).

### 7. Platzierungszustandsautomat, Sessions und UI

Die Runtime-Platzierung ist ein SQLite-eigener, an die Session gebundener Zustandsautomat, nicht ein Paar lose Zeilenfelder:

`local → requested → provisioning → syncing → starting → active(worker) → draining → reconciling → local | reclaimed | failed`

Er persistiert Umgebungs-ID, Übergangsgeneration, aktive Eigentümer-Epoche, Workspace-Basismanifest, Worker-Bundle-Hash und letzte ACK-Cursor. Die Turn-Zulassung beansprucht die Platzierung atomar, bevor eine der Schleifen einen Turn startet, sodass eine lokale Nachricht, die anhand eines veralteten Snapshots zugelassen wurde, niemals mit einem Worker-Turn konkurrieren kann — zu jedem Zeitpunkt besitzt genau eine Schleife die Session.

UI:

- Eine Worker-Session ist eine gewöhnliche Session-Zeile mit Platzierungsmetadaten. Sie befindet sich im normalen Speicher, wird über `sessions.list` aufgelistet und über bestehende Abonnements gestreamt — Seitenleiste und Chat benötigen keinen neuen Datenpfad, sondern nur eine Darstellung: ein Worker-Badge und den Platzierungs-/Umgebungsstatus (`provisioning / syncing / running / idle / reconciling / reclaimed`).
- Erstellungs-UX: Die Session-Zielleiste (Neugestaltung der Session-Seitenleiste) erhält neben Gateway und Node ein Cloud-Worker-Ziel. Erfordert ein konfiguriertes Provider-Profil; die Funktion ist bis zur Konfiguration nicht sichtbar.
- Agent-Dispatch: Ein Session-Tool ermöglicht es einem Agenten, Arbeit an einen Cloud-Worker zu übergeben, wie es ein Mensch tut (Worker-gestützte Unter-Session nach Art eines Subagenten). Wird im selben Meilenstein wie der menschliche Dispatch ausgeliefert und durch dieselbe Opt-in-Provider-Konfiguration geschützt. Rekursion ist strukturell begrenzt (Worker-Sessions können in v1 nicht selbst Worker entsenden); die Ausgabenkontrolle erfolgt über umgebungsbezogene Abrechnung/Auditierung, nicht über Quotenmechanismen.

## Dispatch und Übergabe

v1 ist absichtlich asymmetrisch:

- Lokal → Worker (Dispatch): Die nachstehende Migrationsbarriere passieren, einen Worker bereitstellen oder wiederverwenden, synchronisieren, die Platzierung umschalten; der nächste Turn wird entfernt ausgeführt.
- Worker → lokal (Zurückholen): Die Session stoppen (den Worker gemäß derselben Barriere leeren), den eingehenden Abgleich abschließen, die Platzierung auf lokal umschalten. Keine Live-Migration.
- Symmetrische Live-Übergabe (eine aktiv arbeitende Session ohne Stopp in beide Richtungen verschieben) verwendet dieselbe Barriere und dieselben Abgleichsmechanismen und wird ausgeliefert, nachdem Fehlerinjektionstests die Barriere nachgewiesen haben.

Migrationsbarriere („Turn-Grenze“ allein reicht nicht aus — Genehmigungen, Hintergrundprozesse und Transkriptzusammenführungen mit freigegebener Sperre können sie übergreifen):

1. Zulassung neuer Turns stoppen (Platzierungsanspruch).
2. Aktive Ausführungen abbrechen oder leeren.
3. Ausstehende Ausführungsgenehmigungen und Ausführungsberechtigungen widerrufen.
4. Seitenschreibvorgänge des Transkripts und ACKs für Live-Ereignisse leeren.
5. Untergeordnete Worker-Prozesse beenden.
6. Den alten Eigentümer durch Fortschreiben der Eigentümer-Epoche abgrenzen.
7. Workspace abgleichen (eingehend, konfliktbewusst).
8. Den neuen Eigentümer aktivieren.

Cache-Affinität: Da Provider-Anfragen bei beiden Platzierungen vom Gateway ausgehen, bleibt die Cache-Affinität erhalten, wenn die serialisierte Provider-Anfrage äquivalent bleibt — gleiche Tool-Reihenfolge, Systemanweisungen, Provider-Wrapper und Cache-Metadaten (die auf der Gateway-Seite verbleiben). Dies ist eine testbare Eigenschaft, keine Annahme: Byte-Äquivalenztests für lokale/Worker-Platzierung je unterstütztem Provider-Transport sind Teil des Meilensteins, der die Worker-Schleife einführt.

## Sicherheitsmodell

Präzise formuliert: Der Worker hat keinen direkten Netzwerk-Egress und keine dauerhaft hinterlegten Provider-/Forge-Anmeldedaten. Es handelt sich nicht um „Null-Egress“ — Inferenz und vom Gateway ausgeführte Tools sind kontrollierte Egress-Kanäle (ein durch Prompt-Injection manipulierter Worker kann weiterhin Workspace-Bytes in den Modellkontext oder in Websuchanfragen einfügen). Dementsprechend:

- Abrechnung kontrollierten Egresses: umgebungsbezogene Auditierung und für Bediener sichtbare Abrechnung für den Inferenz-Proxy und Gateway-Tools. Raten-/Byte-Limits existieren als Flusssteuerung des Protokolls (Kapazität), nicht als Ausgabenquotenmechanismus.
- Der Worker-Ingress zum Gateway ist die geschlossene Positivliste des Worker-Protokolls; Transkriptschreibvorgänge sind strukturell eingeschränkt (vom Gateway generierte IDs, eine einzelne gebundene Session).
- Worker-Ausführung verfügt innerhalb der Box über vollständige Berechtigungen. Die Box ist entbehrlich und frei von Anmeldedaten, daher erhöht eine Genehmigung pro Befehl die Reibung, ohne etwas zu schützen; die abgesicherte Grenze bilden eingehender Abgleich und Auditierung. Die Ausführung durchläuft niemals den Gateway-Pfad für Node-Genehmigungen.
- Die Internetrichtlinie ist eine Provider-Entscheidung zum Bereitstellungszeitpunkt: Das Umgebungsprofil entscheidet bei der Erstellung der Box (Firewall/Sicherheitsgruppe/Netzwerk ohne Egress), optional mit einer vernetzten Einrichtungsphase, die der Provider vor der Agent-Phase schließt. Core implementiert keinen Runtime-Netzwerkumschalter.
- Box-Hygiene zum Bereitstellungszeitpunkt: Cloud-Metadatenendpunkt blockiert oder nachweislich nicht vorhanden, kein Instanzprofil, kein übernommener SSH-Agent, kein Docker-Socket, saubere Umgebung und sauberes Home-Verzeichnis. SSH-Hostschlüssel werden anhand der Bereitstellungsausgabe fest verankert.
- Genehmigungen und Richtlinien für alles auf der Gateway-Seite (Push, PR, Provider-Aufrufe) werden weiterhin auf dem Gateway ausgeführt.

Auswirkungsradius einer kompromittierten Worker-Session: die synchronisierte Workspace-Kopie sowie das, was die auditierten Proxy-Kanäle erlauben — keine Anmeldedaten, kein direktes Netzwerk, keine Gateway-Oberfläche außerhalb der Positivliste.

## Kapazität

Der Gateway leitet jeden Prompt und Token-Stream für N Worker weiter, daher legt v1 ein Kapazitätsmodell fest, statt es erst in der Produktion zu entdecken: Begrenzungen gleichzeitiger Worker pro Gateway, Kreditfenster pro Stream (die aktuelle Warteschlange des Ereignisstreams ist unbegrenzt, und die Obergrenze des Node-Socket-Puffers erzwingt die Trennung langsamer Verbraucher — beides ist unverändert ungeeignet), begrenztes Spooling auf die Festplatte für Lastspitzen und Lastabwurf mit sichtbaren Rückstaustatus in der UI. Die Workspace-Übertragung verbleibt auf einem eigenen SSH-Kanal.

## Lebenszyklus

- Automatischer Stopp bei Inaktivität und TTL sind Richtlinien des Provider-Profils, keine festen Konstanten. Die Standardwerte sind großzügig und bieten explizites Keep-Alive; mehrtägige Arbeit ist erstklassig (Provider `renew` existiert für Lease-basierte Backends); eine Session mit einem laufenden Turn oder kürzlich erfolgter Aktivität wird niemals zurückgefordert.
- Bei Tod oder Rückforderung des Workers: Die Platzierung wechselt zu `reclaimed`, die Session-Zeile bleibt bestehen, und die nächste Nachricht stellt einen neuen Worker bereit und synchronisiert erneut ab dem letzten Checkpoint. Die Konversation geht niemals verloren (Gateway-seitiger Speicher); Workspace-Änderungen seit dem letzten Checkpoint gehen verloren, und die UI weist darauf hin.
- Wiederverwendung warmer Leases von Anfang an (bei Providern, die dies unterstützen); ein Image-Snapshot nach dem Bootstrap ist der Schnellstartpfad für v2.

## Konfigurationsoberfläche

Minimal und Opt-in: ein Provider-Profilblock (Provider-ID, Anmeldedaten-/CLI-Referenz, Synchronisierungsregeln, Lebensdauerrichtlinie, Budgets, optionale Einrichtungsphase) plus Platzierungsauswahl pro Session. Keine neuen Umgebungsvariablen. Nicht konfigurierte Installationen zeigen nichts an.

## Meilensteine

Die Implementierung wird als kleine, unabhängig zusammenführbare PRs eingebracht; jeder nachstehende Meilenstein ist eine PR-Serie, keine einzelne Änderung.

1. Grundlagen: Umgebungszustandsautomat + Provider-Vertrag + Provider in Crabbox-Form (statisches SSH als Entwicklungsharness), Bootstrap des Worker-Bundles + Zulassungs-Handshake, SSH-Tunnel + Festlegung der Hostschlüssel, Snapshot des verwalteten Worktrees + ausgehende Synchronisierung (Git- und einfache Modi). Bereinigung verwaister Ressourcen + Übernahme nach Neustart.
2. Worker-Protokoll + Worker-Schleife: authentifizierte Worker-Rolle, dauerhafte Operationen/Epochen/ACK-Cursor, Verträge für Transkript-Commits und Live-Ereignisse, Inferenz-Proxy mit vom Gateway aufgelösten Modellen, Flusssteuerung. Ein Provider, menschlicher Dispatch nur für neue Sessions, keine Übergabe. Fehlerinjektionstests (Tunnel-Partition, Gateway-Neustart, Worker-Tod) bilden das Abschlusskriterium.
3. Dispatch + Zurückholen + Agent-Dispatch: Migrationsbarriere, mit der UI-Zielleiste verdrahteter Platzierungszustandsautomat, eingehender Abgleich + Checkpoints, umgebungsbezogene Auditierung, Kapazitätsgrenzen, Agent-Dispatch-Tool (Worker-Sessions können nicht rekursiv dispatchen). Byte-Äquivalenztests für den Prompt-Cache.
4. Symmetrische Live-Übergabe nach dem Fehlerinjektionsnachweis aus Meilenstein 3.

Später: ACP-Harnesses auf Workern als Opt-in für die umgebungsbezogene Bereitstellung von Anmeldedaten; Schnellstart per Snapshot/warmem Image; Fan-out (N Leases, derselbe Prompt); Betriebssystem-Sandboxing innerhalb der Box; umfangreichere Artefakterfassung über das Artefaktschema.

## Offene Fragen

- Plugin-/Skill-Verfügbarkeit auf Workern: Im Repository enthaltene Skills werden automatisch mit dem Workspace synchronisiert; für über das Gateway konfigurierte Agenten-Skills/-Plugins ist eine ausdrückliche Entscheidung zur Synchronisierung oder zum Ausschluss erforderlich (das Tool-/Plugin-Manifest ist in beiden Fällen Teil des Aufnahme-Handshakes).
- Standardmäßiger Checkpoint-Rhythmus: rundenbasiert gegenüber zeitbasiert für sehr kommunikationsintensive Sitzungen.
- Zusammenspiel von Umgebungsprofilen und Multi-Agent-Routing (agentenspezifische Standardprofile gegenüber ausschließlich sitzungsbezogener Auswahl).
