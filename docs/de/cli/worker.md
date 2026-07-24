---
read_when:
    - Cloud-Worker betreiben oder debuggen, die vom Gateway gestartet wurden
    - Überprüfung der Worker-Zulassung, Sitzungszuweisung oder lokalen Tool-Isolierung
summary: Interne Betreiberreferenz für die eingeschränkte Cloud-Worker-Laufzeit
title: Worker
x-i18n:
    generated_at: "2026-07-24T03:44:52Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 6591eb66c201a56e60638ce832c569b030d2d4a01b984d577e0ea44c10a0fa5e
    source_path: cli/worker.md
    workflow: 16
---

# `openclaw worker`

`openclaw worker` ist der eingeschränkte Laufzeiteinstiegspunkt, den ein Cloud-Worker-
Orchestrator innerhalb einer vorbereiteten Worker-Umgebung startet. Er ist kein
allgemeiner Befehl zur manuellen Worker-Registrierung.

Das Gateway installiert das passende OpenClaw-Bundle und öffnet den mit einem Hostschlüssel abgesicherten
Reverse-SSH-Tunnel. Der Worker-Launcher startet diesen Befehl mit einer vorbereiteten
Zuweisung. Der Befehl stellt die Verbindung über den durch den Tunnel weitergeleiteten lokalen Socket her und
wird mit der dedizierten Rolle `worker` zugelassen.

## Startvertrag

Der Befehl liest genau einen größenbeschränkten JSON-Startumschlag aus der Standardeingabe.
Der Umschlag enthält den Speicherort des lokalen Sockets, die ausgestellte Worker-Zugangsberechtigung, die Bundle-
und Protokollidentität, die Eigentümerepoche sowie die einzelne zugewiesene Sitzung und den einzelnen Turn.
Die Zugangsberechtigung wird niemals über Befehlszeilenargumente akzeptiert, und diese Seite
enthält absichtlich weder ein Beispiel für eine Zugangsberechtigung noch für einen manuell erstellten Umschlag.

Die Zulassung schlägt nach dem Fail-Closed-Prinzip fehl, wenn der Umschlag ungültig ist, die Zugangsberechtigung abgelehnt wird,
die Bundle- oder Protokollfunktionen nicht übereinstimmen oder die Sitzung und die Eigentümerepoche
nicht mehr aktuell sind. Betreiber sollten Worker über den Cloud-Worker-
Orchestrator starten, statt diesen Einstiegspunkt direkt aufzurufen.

## Laufzeitgrenze

Der Prozess führt die normale eingebettete Agentenschleife mit einem eingeschränkten Backend aus:

- Die Coding-Tools `read`, `write`, `edit`, `apply_patch`, `exec` und `process`
  werden lokal im Worker-Arbeitsbereich ausgeführt.
- Modellaufrufe verwenden den Inferenz-Proxy des Gateways. Es wird kein lokales Modellauthentifizierungsprofil
  geladen.
- Transkriptschreibvorgänge verwenden den Transcript-Commit-RPC des Gateways.
- Streaming- und Tool-Lebenszyklusaktualisierungen verwenden den Live-Event-RPC des Gateways.
- Nur die zugewiesene Sitzung und der zugewiesene Turn werden akzeptiert.

Der Worker-Modus startet weder Kanäle noch Gateway-HTTP-Oberflächen oder den automatischen Plugin-Start
über das Toolset der zugewiesenen Sitzung hinaus. Er verwendet ein temporäres Zustandsverzeichnis und verfügt
über keine dauerhaft hinterlegten Provider- oder Forge-Zugangsdaten.

Das Weiterleiten von Sitzungen zwischen Workern ist in diesem Modus nicht verfügbar. Platzierung und
Weiterleitung bleiben Eigentum des Gateways: Ein Betreiber kann eine vorhandene lokale,
über einen verwalteten Worktree laufende Sitzung über das Gateway weiterleiten, während ein Worker-Prozess weder
sich selbst noch einen anderen Worker weiterleiten kann.

Die vorbereitete Zuweisung enthält den Transkriptkontext, das akzeptierte Basis-Leaf,
die Commit-Sequenz und den Live-Event-Cursor. Bei einer erneuten Tunnelverbindung wird der Prozess
mit derselben Zugangsberechtigung und Eigentümerepoche erneut zugelassen, behält die akzeptierte
Transkriptbasis bei, spielt das noch nicht bestätigte Ende seiner Live-Events erneut ab und verbindet sich erneut mit einem
laufenden Inferenz-Turn unter derselben Identität. Die abschließende Inferenznachricht
ist maßgeblich, falls gestreamte Deltas verpasst wurden. Eine ersetzende Eigentümerepoche
grenzt den Prozess aus und bewirkt ein ordnungsgemäßes Beenden.

Eine Transkriptablehnung vom Typ `stale-base-leaf` stoppt den aktuellen Lauf endgültig. Der Worker-
Modus versucht die abgelehnte Sequenz nicht erneut gegen ein anderes Leaf, sodass kein
doppelter Commit erzeugt wird; ein noch nicht committetes Ende im Arbeitsspeicher aus diesem
Lauf geht verloren. Der Neustart fällt in die Zuständigkeit des Platzierungseigentümers von Meilenstein 3, der
eine neue Zuweisung anhand des maßgeblichen Transkripts und
Commit-Ledgers des Gateways erstellen muss. Ebenso beendet ein Neustart des Gateway-Prozesses einen ausstehenden
Inferenz-Turn mit einem Provider-Fehler; nur die erneute Verbindung eines Tunnels oder Worker-WebSockets
kann sich wieder mit einem aktiven Inferenzstream desselben Prozesses verbinden.

Informationen zur geschlossenen Worker-RPC-Oberfläche finden Sie unter [Gateway-Protokoll](/de/gateway/protocol#worker-role-and-closed-protocol) und zum
Architektur- und Sicherheitsmodell unter [Cloud-Worker-Plan](/de/plan/cloud-workers).
