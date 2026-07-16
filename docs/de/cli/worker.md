---
read_when:
    - Betrieb oder Fehlerbehebung von über das Gateway gestarteten Cloud-Workern
    - Überprüfung der Worker-Zulassung, Sitzungszuweisung oder lokalen Tool-Isolierung
summary: Interne Betriebsreferenz für die eingeschränkte Cloud-Worker-Laufzeit
title: Worker
x-i18n:
    generated_at: "2026-07-16T12:54:44Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 6591eb66c201a56e60638ce832c569b030d2d4a01b984d577e0ea44c10a0fa5e
    source_path: cli/worker.md
    workflow: 16
---

# `openclaw worker`

`openclaw worker` ist der eingeschränkte Laufzeiteinstiegspunkt, den ein Cloud-Worker-Orchestrator
innerhalb einer vorbereiteten Worker-Umgebung startet. Es handelt sich nicht um einen
Allzweckbefehl zur manuellen Registrierung von Workern.

Das Gateway installiert das passende OpenClaw-Bundle und öffnet den an den Hostschlüssel gebundenen
Reverse-SSH-Tunnel. Der Worker-Launcher startet diesen Befehl mit einer vorbereiteten
Zuweisung. Der Befehl stellt die Verbindung über den durch den Tunnel weitergeleiteten lokalen Socket her und
wird mit der dedizierten Rolle `worker` zugelassen.

## Startvertrag

Der Befehl liest genau einen größenbeschränkten JSON-Start-Umschlag aus der Standardeingabe.
Der Umschlag enthält den Speicherort des lokalen Sockets, die ausgestellte Worker-Anmeldeinformation, die Bundle-
und Protokollidentität, die Eigentümerepoche sowie die einzelne zugewiesene Sitzung und Ausführung.
Die Anmeldeinformation wird niemals über Befehlszeilenargumente akzeptiert, und diese Seite
enthält absichtlich kein Beispiel für eine Anmeldeinformation oder einen manuell erstellten Umschlag.

Die Zulassung wird nach dem Fail-Closed-Prinzip verweigert, wenn der Umschlag ungültig ist, die Anmeldeinformation abgelehnt wird,
die Bundle- oder Protokollfunktionen nicht übereinstimmen oder die Sitzung und Eigentümerepoche
nicht mehr aktuell sind. Operatoren sollten Worker über den Cloud-Worker-Orchestrator
starten, statt diesen Einstiegspunkt direkt aufzurufen.

## Laufzeitgrenze

Der Prozess führt die normale eingebettete Agentenschleife mit einem eingeschränkten Backend aus:

- Die Coding-Tools `read`, `write`, `edit`, `apply_patch`, `exec` und `process`
  werden lokal im Worker-Arbeitsbereich ausgeführt.
- Modellaufrufe verwenden den Inferenz-Proxy des Gateways. Es wird kein lokales Modellauthentifizierungsprofil
  geladen.
- Transkriptschreibvorgänge verwenden den RPC für Transkript-Commits des Gateways.
- Streaming- und Tool-Lebenszyklusaktualisierungen verwenden den Live-Event-RPC des Gateways.
- Nur die zugewiesene Sitzung und Ausführung werden akzeptiert.

Im Worker-Modus werden weder Kanäle noch Gateway-HTTP-Oberflächen oder automatisch gestartete Plugins
außerhalb des Toolsets der zugewiesenen Sitzung gestartet. Er verwendet ein temporäres Statusverzeichnis und verfügt
über keine dauerhaften Provider- oder Forge-Anmeldeinformationen.

Die Weiterleitung von Sitzungen zwischen Workern ist in diesem Modus nicht verfügbar. Platzierung und
Weiterleitung bleiben Eigentum des Gateways: Ein Operator kann eine vorhandene lokale,
über einen verwalteten Worktree ausgeführte Sitzung über das Gateway weiterleiten, während ein Worker-Prozess
weder sich selbst noch einen anderen Worker weiterleiten kann.

Die vorbereitete Zuweisung enthält den Transkriptkontext, den akzeptierten Basis-Leaf,
die Commit-Sequenz und den Live-Event-Cursor. Nach einer erneuten Tunnelverbindung wird der Prozess
mit derselben Anmeldeinformation und Eigentümerepoche erneut zugelassen, behält die akzeptierte
Transkriptbasis bei, spielt das Ende seiner nicht bestätigten Live-Events erneut ab und verbindet sich
mit einer laufenden Inferenz-Ausführung unter derselben Identität. Die abschließende Inferenznachricht
ist maßgeblich, falls gestreamte Deltas verpasst wurden. Eine ablösende Eigentümerepoche
grenzt den Prozess aus und bewirkt ein ordnungsgemäßes Beenden.

Eine Transkriptablehnung vom Typ `stale-base-leaf` stoppt die aktuelle Ausführung endgültig. Der Worker-
Modus versucht nicht, die abgelehnte Sequenz für einen anderen Leaf erneut zu übertragen, sodass kein
doppelter Commit erzeugt wird; ein noch nicht committetes, im Arbeitsspeicher befindliches Ende dieser
Ausführung geht verloren. Der Neustart liegt in der Verantwortung des Platzierungseigentümers von Meilenstein 3, der
eine neue Zuweisung aus dem maßgeblichen Transkript und dem
Commit-Ledger des Gateways erstellen muss. Ebenso beendet ein Neustart des Gateway-Prozesses eine ausstehende
Inferenz-Ausführung mit einem Provider-Fehler; nur eine erneute Verbindung des Tunnels oder des Worker-WebSockets
kann die Verbindung zu einem aktiven Inferenzstream desselben Prozesses wiederherstellen.

Weitere Informationen finden Sie unter [Gateway-Protokoll](/de/gateway/protocol#worker-role-and-closed-protocol) zur
geschlossenen Worker-RPC-Oberfläche und unter [Plan für Cloud-Worker](/de/plan/cloud-workers) zum
Architektur- und Sicherheitsmodell.
