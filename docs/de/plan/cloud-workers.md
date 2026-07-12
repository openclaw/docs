---
read_when:
    - Entwurf oder Implementierung der Bereitstellung von Cloud-Workern, des Worker-Modus oder der Sitzungsübergabe
    - Ändern von Umgebungen.*, des Worker-Protokolls, der Transkriptaufnahme oder der RPCs des Inferenz-Proxys
    - Überprüfung der Sicherheitslage bei der Ausführung entfernter Agenten
summary: Führen Sie Agent-Sitzungen auf kurzlebigen, per SSH erreichbaren Maschinen mit über den Gateway weitergeleiteter Inferenz und Live-Streaming in der Seitenleiste aus.
title: Plan für Cloud-Worker
x-i18n:
    generated_at: "2026-07-12T01:48:59Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 134c3f6e486837607225d95d12a3153525b14237b362b9f9957313d9bc379dc4
    source_path: plan/cloud-workers.md
    workflow: 16
---

## Status

Vorschlag, Revision 3. Nicht implementiert. Grundrichtung im Juli 2026 vereinbart; Revision 2 berücksichtigte die Ergebnisse einer adversarialen Prüfung (dediziertes Worker-Protokoll, Zustandsautomaten für Platzierung und Umgebung, Git-bewusste eingehende Synchronisierung, unidirektionale Übergabe in v1, Sicherheitsformulierung zu kontrolliertem ausgehendem Datenverkehr). Revision 3 legt das Zuständigkeitsmodell für die Synchronisierung fest (der Worker erstellt Commits, der Gateway übernimmt und veröffentlicht sie), ergänzt einen einfachen Synchronisierungsmodus ohne Git, korrigiert die Worker-Ausführung auf vollständige Ausführung innerhalb der Box, verlagert die Internetrichtlinie in die Bereitstellungsphase und verschiebt die Agent-Weiterleitung wieder auf Meilenstein 3.

## Problem

OpenClaw-Agent-Sitzungen führen ihre Schleife, Tools und Inferenz innerhalb des Gateway-Prozesses auf einem einzelnen Rechner aus. Die Rechenleistung ist durch diesen Rechner begrenzt, lang laufende Aufgaben belegen ihn, und parallele Arbeiten konkurrieren um seine Ressourcen. Gehostete Produkte (Cursor-Cloud-Agenten, Claude Code im Web, Codex Cloud) lösen dies mit kurzlebigen Cloud-Sandboxes pro Aufgabe, erfordern jedoch Infrastruktur und Vertrauen in den jeweiligen Anbieter.

Betreiber, die bereits über ungenutzte Rechner verfügen (oder diese kostengünstig mieten können), haben keine Möglichkeit festzulegen: Führen Sie diese Sitzung dort aus, zeigen Sie sie wie jede andere Sitzung in meiner Seitenleiste an und verwerfen Sie den Rechner anschließend.

## Ziele

- Eine vollständige Agent-Sitzung (Schleife + Tools) auf einem kurzlebigen entfernten Rechner („Cloud-Worker“) ausführen, während die Sitzung in der Control UI genauso wie eine lokale Sitzung angezeigt und gestreamt wird.
- Keine dauerhaft hinterlegten Zugangsdaten auf dem Worker (keine Provider-Authentifizierung, keine Forge-Token) und kein direkter ausgehender Netzwerkverkehr; die Box benötigt lediglich einen erreichbaren `sshd`.
- Bereitstellen, synchronisieren, ausführen, Ergebnisse erfassen, zerstören — vollständig automatisiert und mit austauschbaren Providern (erster Provider: Lease-CLIs nach Art von Crabbox).
- Laufende Arbeit an einer Turn-Grenze vom Gateway an einen Worker weiterleiten, ohne Transkript, Sitzungsidentität oder — sofern die Anfrage-Bytes äquivalent bleiben — die Bindung an den Provider-Cache zu verlieren; Ergebnisse sicher zurückholen.
- Sowohl Menschen (UI) als auch Agenten (Tool) können Arbeit an einen Cloud-Worker weiterleiten.
- Mehrtägige Sitzungen unterstützen; die Lebensdauer wird durch Richtlinien bestimmt und nicht durch eine fest codierte Obergrenze.

## Nichtziele (v1)

- Keine externen Programmier-Harnesses (Claude Code, Codex CLI) auf Workern. Worker-Sitzungen führen ausschließlich den eingebetteten Runner von OpenClaw aus. Harness-Unterstützung ist eine optionale v2-Funktion, da Harnesses ihre eigene Inferenz mit eigenen Zugangsdaten durchführen.
- Keine Auffächerung in Best-of-N-/Parallelversuche.
- Keine Abhängigkeit von VPN oder Tailnet. Als Transport dient ausschließlich SSH.
- Keine neue Sandbox-Laufzeit. Der Worker-Rechner bildet die Isolationsgrenze; eine betriebssystemseitige Sandbox innerhalb der Box kann später ergänzt werden.
- Keine symmetrische Live-Migration in v1: Die Weiterleitung erfolgt von lokal → Worker; Worker → lokal erfordert eine angehaltene Sitzung sowie eine abgeschlossene Abstimmung des Arbeitsbereichs. Eine spätere bidirektionale Live-Übergabe baut auf demselben Barrierenmechanismus auf.
- Kein JSON-Nebenstatus auf dem Gateway; Umgebungs-, Platzierungs-, Cursor- und Berechtigungsstatus werden in SQLite gespeichert.

## Bestehende Ansätze (was wir übernehmen, was wir umkehren)

- Cursor-Cloud-Agenten: Die Agent-Schleife läuft in deren Cloud; die VM ist ein Ziel für die Tool-Ausführung; ein nur erweiterbarer Konversationsspeicher wird an alle Clients gestreamt; ein Snapshot nach der Installation ermöglicht einen schnellen Warmstart; selbst gehostete Worker sind ausschließlich ausgehend verbundene Worker-Prozesse. Wir übernehmen das Modell, bei dem die maßgebliche Konversationsquelle beim Orchestrator verbleibt, sowie das Streaming-Modell; die Platzierung der Schleife kehren wir um (siehe Entscheidung unten).
- Codex Cloud: zweiphasige Laufzeit — eine vernetzte Einrichtungsphase, anschließend eine Offline-Agent-Phase, aus der Secrets entfernt wurden; Cache des Container-Zustands für schnelle Folgeaufgaben. Wir übernehmen die Phasentrennung als Grundlage für unsere Richtlinie zum ausgehenden Datenverkehr und die Cache-Idee für vorgewärmte v2-Images.
- Claude Code im Web: VM pro Sitzung; Git-Proxy zur Isolierung von Zugangsdaten (echte Token gelangen nie in die Sandbox, Pushes sind auf den Sitzungs-Branch beschränkt); Dateisystem-Snapshot nach der Einrichtung; Teleport-Übergabe = gepushter Branch + wiedergegebener Verlauf. Wir übernehmen die Isolierung von Zugangsdaten und das Übergabemodell, die ausgehende Synchronisierung erfolgt jedoch per `rsync` vom Gateway, sodass auch Arbeitsverzeichnisse mit nicht übernommenen Änderungen funktionieren und sich kein Forge-Token in der Nähe der Box befindet.
- Copilot Coding Agent: standardmäßig verweigerter ausgehender Datenverkehr mit einer Positivliste für Paketregistries. Unser Standard im Dauerbetrieb ist strenger (überhaupt kein direkter ausgehender Datenverkehr), da Inferenz und Websuche über den SSH-Tunnel erfolgen — unter Sicherheit wird jedoch erläutert, weshalb es sich dabei um „kontrollierten ausgehenden Datenverkehr“ und nicht um „keinen ausgehenden Datenverkehr“ handelt.

## Architekturentscheidung: Schleife auf dem Worker, Inferenz über den Gateway

Drei Platzierungen wurden erwogen:

1. Die Schleife verbleibt auf dem Gateway, der Worker führt Tools aus (Cursor-Modell). Dies bietet den sichersten Fehlerbereich (Transkript, Inferenz, Genehmigungen und Wiederherstellung nach Neustarts bleiben vollständig lokal) und wurde von Prüfern als erster Meilenstein bevorzugt. Als Produktarchitektur verworfen: Die Nicht-Exec-Tools von OpenClaw sind prozessinterne Dateisystemoperationen, sodass jedes Lesen, Bearbeiten und Durchsuchen von Dateien einen Netzwerk-Roundtrip oder eine umfangreiche Umgestaltung der Tool-Oberfläche in grobgranulare Arbeitsbereichs-RPCs erfordern würde; das Laufzeitverhalten ist kommunikationsintensiv und stark latenzabhängig. Wir greifen den Ansatz dort auf, wo er bereits umgesetzt ist (Auslagerung der Ausführung auf Nodes), entwickeln jedoch keine Ebene für entfernte Tool-Ausführung.
2. Schleife und Inferenz laufen beide auf dem Worker. Dies ergibt den einfachsten Fehlerbereich, jedoch müssten Modell-Zugangsdaten (einschließlich OAuth-Profilen) auf kurzlebige Rechner übertragen werden, der Gateway würde die Kontrolle über Richtlinien, Routing und Auditierung verlieren, und die Migration würde die Identität wechseln, die den Provider aufruft, wodurch Provider-Caches ungültig würden.
3. Schleife + Tools auf dem Worker, Modellaufrufe über einen Proxy auf dem Gateway. Ausgewählt. Ein Roundtrip pro Modell-Turn statt pro Tool-Aufruf; Tools laufen direkt neben dem Code; der Gateway bleibt alleiniger Eigentümer der Authentifizierungsprofile, des Provider-Routings und der Richtlinien; der Worker enthält keine Secrets.

Der Nachteil von Option 3 ist die synchrone Abhängigkeit vom Gateway während jedes Modell-Turns. Die Regeln zur Ausfallsicherheit sind daher Teil der Entscheidung und kein nachträglicher Zusatz:

- Ein Ausfall des Gateways während eines Turns lässt den aktiven Provider-Aufruf fehlschlagen. Der Turn wird als fehlgeschlagen markiert und nach der erneuten Verbindung als neuer Turn wiederholt; ein laufender Provider-Stream wird nicht transparent erneut abgespielt, da sonst das Risiko doppelter Abrechnung oder doppelter Tool-Aufrufe besteht.
- Jede Worker↔Gateway-Operation enthält eine dauerhafte Identität (siehe Worker-Protokoll), sodass nach einer erneuten Verbindung fortgesetzt oder ein zwischengespeichertes Endergebnis abgerufen wird, statt Operationen in einem undefinierten Zustand zurückzulassen.
- Der Gateway ist eine kapazitätsverwaltete Komponente: Grenzwerte für gleichzeitige Worker, Flusssteuerung und Lastabwurf gehören zum Umfang von v1 (siehe Kapazität).

Da der Gateway sowohl das Transkript speichert als auch den gesamten Provider-Datenverkehr initiiert, ist die Sitzung ortsunabhängig: Das Verschieben der Schleife zwischen Gateway und Worker ändert weder auf der Provider-Seite noch im Datenpfad der UI etwas. Dadurch sind Weiterleitung und Rückholung kostengünstig.

## Komponenten

### 1. Umgebungszustandsautomat + Provider-Vertrag

`environments.*` im Gateway-Protokoll ist derzeit lediglich eine Statusprojektion. Der dauerhafte Kern besteht aus einem SQLite-verwalteten Umgebungsdatensatz und einem Zustandsautomaten, die vor den RPC-Strukturen entworfen werden:

`requested → provisioning → bootstrapping → ready → (attached|idle) → draining → destroying → destroyed | failed | orphaned`

- Die Bereitstellung ist absturzsicher: Der Absichtsdatensatz wird vor dem Provider-Aufruf mit einer deterministischen Operations-ID gespeichert, sodass ein Neustart des Gateways eine laufende Lease übernehmen kann, statt eine zweite Bereitstellung auszulösen oder einen kostenpflichtigen Rechner zu verwaisen.
- Die Abstimmung nach einem Neustart und eine Bereinigung verwaister Ressourcen (`inspect` des Providers gegenüber lokalen Datensätzen) sind Anforderungen von v1 und keine nachträglichen Härtungsmaßnahmen.

Provider-Vertrag (durch Plugins implementiert; keine Provider-Namen oder Richtlinien im Kern):

```ts
type WorkerProvider = {
  id: string;
  provision(profile: WorkerProfile, opId: string): Promise<WorkerLease>; // → ssh host/port/user/key material
  inspect(lease: { leaseId: string; profile: WorkerProfile }): Promise<LeaseStatus>; // adopt/health/orphan sweep
  renew?(leaseId: string): Promise<void>; // long-lived sessions vs provider TTLs
  destroy(lease: { leaseId: string; profile: WorkerProfile }): Promise<void>; // idempotent, returns only on proof of teardown
};
```

RPCs: `environments.create`, `environments.destroy`, erweiterte `environments.list/status` (Provider, Lease-ID, Zustand, Alter, Leerlaufzeit, zugeordnete Sitzungen). Erste Provider: ein Wrapper für Lease-CLIs nach dem Crabbox-Schema (Produktpfad) und ein ausschließlich für die Entwicklung gekennzeichneter Provider für statische SSH-Hosts — ein Worker auf einem gemeinsam genutzten Host kann fremde Hostdaten lesen; statische Hosts dienen daher der Funktionsentwicklung und entsprechen nicht der standardmäßigen Sicherheitsausrichtung.

### 2. Worker-Bootstrap: OpenClaw auf der Box installieren

Kein maßgeschneidertes Worker-Artefakt und keine Abhängigkeit von der Verfügbarkeit von npm:

- Kanonische Installation für alle Modi: ein vom Gateway erzeugtes Worker-Bundle mit Inhalts-Hash (die eigene Build-Ausgabe des Gateways, als Tarball gepackt), das über SSH übertragen und auf der Box installiert wird. Dadurch werden Entwicklungs-Builds und noch nicht veröffentlichte Commits automatisch abgedeckt.
- `npm i -g openclaw@<exact gateway version>` ist eine Optimierung, wenn auf dem Gateway eine veröffentlichte Version ausgeführt wird; niemals `latest`.
- Der Bootstrap ist idempotent; eine vorgewärmte Lease mit übereinstimmendem Bundle-Hash überspringt die Installation. Unvorbereitete Rechner benötigen möglicherweise eine vernetzte Toolchain-Phase (Node-Laufzeit) — diese ist Teil der Einrichtungsphase und wird anschließend beendet.
- Der Handshake überprüft den Worker-Build-Hash, die Menge unterstützter Protokollfunktionen und die Laufzeitkompatibilität. Die vorhandenen Versions- und Protokollprüfungen des Gateways reichen dafür nicht aus (über SSH getunnelte Nodes sind von der Ablehnung abweichender exakter Versionen ausgenommen); deshalb führt die Worker-Zulassung eine eigene Prüfung auf exakt übereinstimmende Builds durch.

Der Worker-Modus (`openclaw worker`) ist ein Einstiegspunkt und keine Abspaltung: Verbindungsverwaltung sowie der eingebettete Agent-Runner, wobei Sitzungspersistenz und Modellaufrufe durch Gateway-RPCs bereitgestellt werden. Er darf keine Gateway-Oberflächen starten: keine Kanäle, kein automatischer Plugin-Start über das Toolset der Sitzung hinaus, ein kurzlebiges Statusverzeichnis und keine lokalen Authentifizierungsprofile.

### 3. Transport: alles über SSH

Der Gateway verwaltet die Konnektivität; der Worker benötigt lediglich `sshd`:

- Der Gateway öffnet eine SSH-Verbindung zum Worker (Zugangsdaten aus der Provider-Lease, Hostschlüssel aus der Bereitstellungsausgabe angeheftet — kein `StrictHostKeyChecking=no`) und richtet einen Reverse-Tunnel ein, der einen Worker-lokalen Socket an den WS-Endpunkt des Gateways weiterleitet.
- Steuerungs-/Modellverkehr und Arbeitsbereichsübertragung verwenden separate SSH-Verbindungen mit demselben angehefteten Vertrauensmaterial, damit `rsync` Token-Streams nicht durch Head-of-Line-Blocking verzögert.
- Der Lebenszyklus des Tunnels (Keepalive, erneute Verbindung mit Backoff) wird von der Umgebungslaufzeit auf dem Gateway verwaltet. Eine kurze Tunnelunterbrechung ist auf Sitzungsebene nicht sichtbar: Der dauerhafte Protokollstatus (unten) ermöglicht dem Worker, sich erneut zu verbinden und fortzufahren.

### 4. Worker-Protokoll (dediziert; nicht das Node-Protokoll)

Eine adversariale Prüfung der aktuellen Node-Schnittstellen schloss eine einfache Wiederverwendung aus: Ausstehende Node-Aufrufe sind prozesslokale Promises, die mit der Verbindung verloren gehen; Node-Idempotenzschlüssel werden zwar geparst, aber nicht dedupliziert; und — entscheidend — ein verbundener Node kann gewöhnliche Node-Ereignisse senden (einschließlich Anforderungen für Agent-Ausführungen), sodass „Node-Art + Fähigkeitsobergrenze“ keine Sicherheitsgrenze für eingehenden Datenverkehr darstellt. Worker erhalten daher eine authentifizierte `worker`-Rolle mit einer geschlossenen, versionierten Positivliste für RPCs und Ereignisse; Worker-Verbindungen können keinen veralteten Node-Ereignishandler erreichen.

Identität und Zugangsdaten: Bei der Bereitstellung werden kurzlebige Worker-Zugangsdaten erzeugt, die an die Umgebungs-ID, den Worker-Schlüssel, den Bundle-Hash, die einzige zulässige Sitzung, die zulässige RPC-Menge und ein Ablaufdatum gebunden sind. Die per SSH verifizierte Kopplung gilt weiterhin (wir haben die Box bereitgestellt und verfügen über den Schlüssel), die Autorisierung erfolgt jedoch anhand der erzeugten Zugangsdaten und nicht anhand der deklarierten Node-Oberfläche.

Dauerhafte Operationssemantik (Struktur übernommen aus der vorhandenen ACP-Laufzeit und ihrem Ereignis-Ledger — stabile Handles, Serialisierung pro Sitzung, dauerhafte Wiedergabe von `(session, seq)`):

- Jede Operation ist durch `(sessionId, lifecycleRevision, runId, ownerEpoch, streamKind, seq)` abgegrenzt.
- Eigentümer-Epochen grenzen veraltete Worker aus: Ein Ersatz-Worker erhöht die Epoche; verspätete Ergebnisse aus der alten Epoche werden deterministisch abgelehnt.
- Mindestens-einmal-Zustellung mit dauerhaft in SQLite gespeicherten ACK-Cursorn und zwischengespeicherten Endergebnissen; die Deduplizierung ist deterministisch. Es gibt keine Zusage einer Genau-einmal-Zustellung.
- Explizite Frames für Abbruch, Schließen, Fortsetzung und Endergebnisse; kredit-/fensterbasierte Flusssteuerung für Streams.
- Die Aushandlung von Protokollfunktionen erfolgt unabhängig von der allgemeinen Version des Node-Protokolls.

### 5. RPCs für das Sitzungs-Backend

Zwei unterschiedliche Verträge — die aktuelle Codebasis trennt dauerhafte Transkriptmutationen (im Besitz des Sitzungsmanagers, JSONL-Baum mit Eltern-/Blattzustand) von prozesslokalen Live-Ereignissen (Streaming-Deltas, Tool-Lebenszyklus, Genehmigungen), und das Worker-Protokoll muss diese Trennung beibehalten:

- Dauerhafte Transkript-Commits: Der Worker übermittelt semantische Anhänge-Batches mit `runEpoch` und Compare-and-Swap auf Basis des Ausgangsblatts; der Gateway-Sitzungsmanager erzeugt Eintrags- und Eltern-IDs. Der Worker darf niemals vertrauenswürdige Transkriptzeilen, Eintrags-IDs, Eltern-IDs oder fremde Sitzungs-IDs bereitstellen.
- Wiederholbare Live-Ereignisse: eine typisierte Ereignis-Union mit Worker-Sequenznummern, Gateway-ACKs, begrenzter Aufbewahrung und Abschirmung verspäteter Ereignisse, die den bestehenden Agentenereignis-Fan-out speist, sodass Chatansicht, Tool-Zeilen und Ungelesen-/Statuslogik sich identisch zu lokalen Sitzungen verhalten.

Inferenz-Proxy: Das Ereignisvokabular des bestehenden Stream-Clients für den Laufzeit-Proxy (`src/agents/runtime/proxy.ts`) wiederverwenden, aber die Vertrauensgrenze verschieben. Der Worker sendet nur Sitzungs-/Laufidentität, eine genehmigte Modellreferenz, Kontext und eingeschränkte Generierungsoptionen; der Gateway löst Provider, Endpunkt, Authentifizierung, Header, Routing und Kostenrichtlinie aus seinem eigenen Katalog auf. Ein vom Worker bereitgestelltes Modellobjekt (z. B. ein angreifergesteuertes `baseUrl`) wird abgelehnt. Größenbeschränkungen für Anfragen, Abbruch, Auditierung und Wiederholung des Endergebnisses gelten. Auf dem Gateway befindliche Tools (Websuche) werden auf dem Gateway ausgeführt und geben Ergebnisse über denselben Kanal zurück.

### 6. Arbeitsbereichssynchronisierung

Der Synchronisierungsanker ist ein Gateway-lokaler Arbeitsbereich mit exklusivem Platzierungseigentum: bei Git-Arbeitsbereichen ein dedizierter verwalteter Worktree (bestehende Metadaten des verwalteten Worktrees — Branch, Basis, Snapshot-Eigentum — bilden die Grundlage); bei Arbeitsbereichen ohne Git ein dem Gateway gehörendes Zielverzeichnis. Niemals der aktive Checkout des Benutzers. Das exklusive Eigentum, während die Sitzung remote platziert ist, sorgt konstruktionsbedingt dafür, dass die eingehende Synchronisierung konfliktfrei ist.

Aufteilung des Eigentums — Commit gegenüber Veröffentlichung:

- Der Worker-seitige Agent erstellt Commits wie gewohnt in seiner Kopie (`git commit` ist eine lokale Operation ohne Anmeldedaten; die Autorenidentität wird aus der Gateway-Konfiguration projiziert). Diese Commits sind wirkungslose Objekte, bis der Gateway sie übernimmt.
- Der Gateway erledigt alles, was Vertrauen erfordert: Er prüft, ob eingehende Commits auf der aufgezeichneten Basis aufbauen, führt einen Fast-Forward des lokalen Worktrees durch, pusht, erstellt PRs und signiert beziehungsweise signiert optional erneut — alles mit Gateway-lokalen Anmeldedaten. Der Worker besitzt niemals Git- oder Forge-Anmeldedaten und greift niemals auf ein Remote-Repository zu.

Zwei Synchronisierungsmodi, abhängig davon, ob der Arbeitsbereich ein Git-Repository ist:

- Git-Modus. Ausgehend: Den Worktree per rsync über die SSH-Identität des Tunnels synchronisieren (einschließlich nicht committeter und zulässiger nicht verfolgter Dateien; Ein-/Ausschlüsse nach Crabbox-Art, `.worktreeinclude` wird berücksichtigt), aufgezeichnet als unveränderliches Basismanifest (Inhaltshashes und Basis-Commit). Eingehend: Neue Commits werden als Git-Bundle oder temporäre Referenz gegen die aufgezeichnete Basis zurückgegeben; nicht verfolgte Artefakte werden über ein explizites Manifest mit Prüfungen von Größe, Typ und Symlink-Einschluss zurückgegeben. Die Übernahme prüft die Basisabstammung und stoppt bei Divergenz — nichts überschreibt stillschweigend eine der beiden Seiten. Löschungen, Umbenennungen, Submodule und Symlink-Ausbrüche werden durch die Manifestregeln behandelt, nicht durch rsync-Heuristiken.
- Einfacher Modus (kein Git — z. B. beim Erstellen eines Projekts von Grund auf auf der Box). Ausgehend erfolgt dieselbe Synchronisierung per rsync samt Basismanifest. Eingehend erfolgt eine anhand des Manifestunterschieds ermittelte Spiegelung zurück in das dem Gateway gehörende Zielverzeichnis, einschließlich Weitergabe von Löschungen. Sicher aus demselben Grund wie der Git-Modus: Durch exklusives Eigentum gibt es keine gleichzeitigen lokalen Bearbeitungen, die Konflikte verursachen könnten; das Basismanifest erkennt weiterhin unerwartete lokale Abweichungen und stoppt, statt sie zu überschreiben.

Checkpointing schützt tagelange Sitzungen vor Lease-Verlust: regelmäßige eingehende Checkpoints (Sitzungs-Branch-Commits im Git-Modus, Manifest-Snapshots im einfachen Modus); die Frequenz ist eine Profilrichtlinie (standardmäßig rundenbasiert).

### 7. Platzierungszustandsautomat, Sitzungen und Benutzeroberfläche

Die Laufzeitplatzierung ist ein SQLite-eigener, an die Sitzung gebundener Zustandsautomat und kein Paar loser Zeilenfelder:

`local → requested → provisioning → syncing → starting → active(worker) → draining → reconciling → local | reclaimed | failed`

Er speichert Umgebungs-ID, Übergangsgeneration, Epoche des aktiven Eigentümers, Basismanifest des Arbeitsbereichs, Hash des Worker-Bundles und letzte ACK-Cursor. Die Rundenzulassung beansprucht die Platzierung atomar, bevor eine der beiden Schleifen eine Runde startet, sodass eine gegen einen veralteten Snapshot zugelassene lokale Nachricht niemals mit einer Worker-Runde konkurrieren kann — zu jedem Zeitpunkt besitzt genau eine Schleife die Sitzung.

Benutzeroberfläche:

- Eine Worker-Sitzung ist eine gewöhnliche Sitzungszeile mit Platzierungsmetadaten. Sie befindet sich im normalen Speicher, wird über `sessions.list` aufgelistet und über bestehende Abonnements gestreamt — Seitenleiste und Chat benötigen keinen neuen Datenpfad, sondern nur eine Darstellungserweiterung: ein Worker-Abzeichen und Platzierungs-/Umgebungsstatus (`provisioning / syncing / running / idle / reconciling / reclaimed`).
- Erstellungsablauf: Die Sitzungszielleiste (Neugestaltung der Sitzungsseitenleiste) erhält neben Gateway und Node ein Cloud-Worker-Ziel. Erfordert ein konfiguriertes Provider-Profil; die Funktion ist bis zur Konfiguration unsichtbar.
- Agenten-Dispatch: Mit einem Sitzungstool kann ein Agent Arbeit an einen Cloud-Worker übergeben, wie es ein Mensch tut (Worker-gestützte Untersitzung nach Art eines Subagenten). Wird im selben Meilenstein wie der menschliche Dispatch ausgeliefert und durch dieselbe optionale Provider-Konfiguration aktiviert. Rekursion ist strukturell begrenzt (Worker-Sitzungen können in v1 nicht selbst Worker beauftragen); Ausgabenkontrolle erfolgt über umgebungsbezogene Abrechnung/Auditierung, nicht über Kontingentmechanismen.

## Dispatch und Übergabe

v1 ist bewusst asymmetrisch:

- Lokal → Worker (Dispatch): Die unten beschriebene Migrationsbarriere durchlaufen, einen Worker bereitstellen oder wiederverwenden, synchronisieren, die Platzierung umschalten; die nächste Runde wird remote ausgeführt.
- Worker → lokal (Rückholung): Die Sitzung stoppen (den Worker über dieselbe Barriere entleeren), die eingehende Abstimmung abschließen und die Platzierung auf lokal umschalten. Keine Live-Migration.
- Symmetrische Live-Übergabe (Verschieben einer aktiv arbeitenden Sitzung in beide Richtungen ohne Stopp) verwendet dieselbe Barriere und Abstimmungsmechanik und wird ausgeliefert, nachdem Fehlerinjektionstests die Barriere bestätigt haben.

Migrationsbarriere (eine „Rundengrenze“ allein reicht nicht aus — Genehmigungen, Hintergrundprozesse und Transkriptzusammenführungen nach Freigabe einer Sperre können sie überspannen):

1. Zulassung neuer Runden stoppen (Platzierungsanspruch).
2. Aktive Läufe abbrechen oder entleeren.
3. Ausstehende Ausführungsgenehmigungen und Ausführungsberechtigungen widerrufen.
4. Seitliche Transkriptschreibvorgänge und ACKs für Live-Ereignisse abarbeiten.
5. Untergeordnete Worker-Prozesse beenden.
6. Den alten Eigentümer durch Fortschreiben der Eigentümerepoche abschirmen.
7. Arbeitsbereich abstimmen (eingehend, konfliktbewusst).
8. Den neuen Eigentümer aktivieren.

Cache-Affinität: Da Provider-Anfragen bei beiden Platzierungen vom Gateway ausgehen, bleibt die Cache-Affinität erhalten, wenn die serialisierte Provider-Anfrage gleichwertig bleibt — gleiche Tool-Reihenfolge, Systemanweisungen, Provider-Wrapper und Cache-Metadaten (die Gateway-seitig verbleiben). Dies ist eine testbare Eigenschaft, keine Annahme: Byte-Gleichheitstests zwischen lokaler und Worker-Platzierung für jeden unterstützten Provider-Transport sind Teil des Meilensteins, der die Worker-Schleife einführt.

## Sicherheitsmodell

Präzise formuliert: Der Worker hat keinen direkten ausgehenden Netzwerkzugriff und keine dauerhaft vorhandenen Provider-/Forge-Anmeldedaten. Es handelt sich nicht um „keinen ausgehenden Datenverkehr“ — Inferenz und auf dem Gateway ausgeführte Tools sind kontrollierte ausgehende Kanäle (ein durch Prompt-Injection manipulierter Worker kann weiterhin Arbeitsbereichsbytes in den Modellkontext oder in Websuchanfragen einfügen). Dementsprechend:

- Abrechnung kontrollierten ausgehenden Datenverkehrs: umgebungsbezogene Auditierung und für Betreiber sichtbare Abrechnung am Inferenz-Proxy und an Gateway-Tools. Raten-/Byte-Limits dienen als Protokollflusssteuerung für die Kapazität, nicht als Mechanismus für Ausgabenkontingente.
- Der Worker-Zugriff auf den Gateway ist auf die geschlossene Positivliste des Worker-Protokolls beschränkt; Transkriptschreibvorgänge sind strukturell eingeschränkt (vom Gateway erzeugte IDs, eine einzige gebundene Sitzung).
- Worker-Ausführungen besitzen innerhalb der Box vollständige Berechtigungen. Die Box ist entsorgbar und enthält keine Anmeldedaten, daher erzeugt eine Genehmigung pro Befehl Reibung, ohne etwas zu schützen; die geschützte Grenze bilden die eingehende Abstimmung und die Auditierung. Ausführungen durchlaufen niemals den Gateway-Pfad für Node-Genehmigungen.
- Die Internetrichtlinie ist eine Provider-Entscheidung zum Bereitstellungszeitpunkt: Das Umgebungsprofil entscheidet bei der Erstellung der Box (Firewall/Sicherheitsgruppe/Netzwerk ohne ausgehenden Zugriff), optional mit einer vernetzten Einrichtungsphase, die der Provider vor der Agentenphase schließt. Der Kern implementiert keinen Netzwerk-Umschalter zur Laufzeit.
- Box-Hygiene zum Bereitstellungszeitpunkt: Cloud-Metadatenendpunkt blockiert oder nachweislich nicht vorhanden, kein Instanzprofil, kein übernommener SSH-Agent, kein Docker-Socket, saubere Umgebung und sauberes Home-Verzeichnis. SSH-Hostschlüssel werden anhand der Bereitstellungsausgabe fest hinterlegt.
- Genehmigungen und Richtlinien für alle Gateway-seitigen Vorgänge (Push, PR, Provider-Aufrufe) werden weiterhin auf dem Gateway ausgeführt.

Auswirkungsradius einer kompromittierten Worker-Sitzung: die synchronisierte Kopie des Arbeitsbereichs sowie das, was die auditierten Proxy-Kanäle erlauben — keine Anmeldedaten, kein direkter Netzwerkzugriff, keine Gateway-Oberfläche außerhalb der Positivliste.

## Kapazität

Der Gateway leitet für N Worker jeden Prompt und Token-Stream weiter, daher definiert v1 ein Kapazitätsmodell, statt es erst im Produktivbetrieb zu entdecken: Begrenzungen gleichzeitiger Worker pro Gateway, Credit-Fenster pro Stream (die aktuelle Ereignisstream-Warteschlange ist unbegrenzt und die Obergrenze des Node-Socket-Puffers schließt langsame Verbraucher zwangsweise — beides ist unverändert ungeeignet), begrenztes Disk-Spooling für Lastspitzen und Lastabwurf mit sichtbaren Rückstauzuständen in der Benutzeroberfläche. Die Übertragung des Arbeitsbereichs verbleibt auf einem eigenen SSH-Kanal.

## Lebenszyklus

- Automatischer Stopp bei Inaktivität und TTL sind Richtlinien des Provider-Profils, keine festen Konstanten. Die Standardwerte sind großzügig und bieten explizites Keep-Alive; tagelange Arbeit wird vollwertig unterstützt (für Lease-basierte Backends existiert beim Provider `renew`); eine Sitzung mit einer laufenden Runde oder kürzlich erfolgter Aktivität wird niemals zurückgefordert.
- Bei Tod oder Rückforderung des Workers: Die Platzierung wechselt zu `reclaimed`, die Sitzungszeile bleibt bestehen, und die nächste Nachricht stellt einen neuen Worker bereit und synchronisiert erneut ab dem letzten Checkpoint. Die Unterhaltung geht niemals verloren (Gateway-seitiger Speicher); Änderungen am Arbeitsbereich seit dem letzten Checkpoint gehen verloren, und die Benutzeroberfläche weist darauf hin.
- Wiederverwendung warmer Leases ab dem ersten Tag (bei Providern, die dies unterstützen); ein Image-Snapshot nach dem Bootstrap ist der Schnellstartpfad von v2.

## Konfigurationsoberfläche

Minimal und optional: ein Provider-Profilblock (Provider-ID, Anmeldedaten-/CLI-Referenz, Synchronisierungsregeln, Lebensdauerrichtlinie, Budgets, optionale Einrichtungsphase) sowie eine Platzierungsauswahl pro Sitzung. Keine neuen Umgebungsvariablen. Nicht konfigurierte Installationen zeigen nichts davon an.

## Meilensteine

Die Implementierung wird in kleinen, unabhängig zusammenführbaren PRs umgesetzt; jeder der folgenden Meilensteine ist eine PR-Serie und keine einzelne Änderung.

1. Grundlagen: Umgebungszustandsautomat und Provider-Vertrag sowie Provider in Crabbox-Form (statisches SSH als Entwicklungsharness), Bootstrap des Worker-Bundles und Zulassungs-Handshake, SSH-Tunnel und feste Hinterlegung des Hostschlüssels, Snapshot des verwalteten Worktrees und ausgehende Synchronisierung (Git- und einfache Modi). Bereinigung verwaister Ressourcen und Übernahme nach Neustart.
2. Worker-Protokoll und Worker-Schleife: authentifizierte Worker-Rolle, dauerhafte Operationen/Epochen/ACK-Cursor, Verträge für Transkript-Commits und Live-Ereignisse, Inferenz-Proxy mit vom Gateway aufgelösten Modellen, Flusssteuerung. Ein Provider, menschlicher Dispatch nur neuer Sitzungen, keine Übergabe. Fehlerinjektionstests (Tunnelunterbrechung, Gateway-Neustart, Worker-Ausfall) sind Voraussetzung für den Abschluss.
3. Dispatch, Rückholung und Agenten-Dispatch: Migrationsbarriere, mit der Zielleiste der Benutzeroberfläche verdrahteter Platzierungszustandsautomat, eingehende Abstimmung und Checkpoints, umgebungsbezogene Auditierung, Kapazitätsbegrenzungen, Tool für Agenten-Dispatch (Worker-Sitzungen können nicht rekursiv weitere Worker beauftragen). Byte-Gleichheitstests für den Prompt-Cache.
4. Symmetrische Live-Übergabe nach dem Fehlerinjektionsnachweis aus Meilenstein 3.

Später: ACP-Harnesses auf Workern als optionale, umgebungsbezogene Bereitstellung von Anmeldedaten; Schnellstart per Snapshot/warmem Image; Fan-out (N Leases, gleicher Prompt); Betriebssystem-Sandboxing innerhalb der Box; umfassendere Erfassung von Artefakten über das Artefaktschema.

## Offene Fragen

- Plugin-/Skills-Verfügbarkeit auf Workern: Im Repository enthaltene Skills werden automatisch mit dem Workspace synchronisiert; für über den Gateway konfigurierte Agenten-Skills/-Plugins muss ausdrücklich entschieden werden, ob sie synchronisiert oder ausgeschlossen werden (das Tool-/Plugin-Manifest ist in beiden Fällen Teil des Zulassungs-Handshakes).
- Standardintervall für Checkpoints: zugbasierte gegenüber zeitbasierter Ausführung bei sehr kommunikationsintensiven Sitzungen.
- Zusammenspiel von Umgebungsprofilen und Multi-Agent-Routing (agentenspezifische Standardprofile gegenüber ausschließlich sitzungsbezogener Auswahl).
