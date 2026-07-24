---
read_when:
    - Sie benötigen einen isolierten Branch und Checkout für eine Agentenaufgabe
    - Sie konfigurieren Workboard-Karten mit Worktree-Arbeitsbereichen
    - Sie müssen einen von OpenClaw verwalteten Worktree wiederherstellen oder bereinigen
summary: Führen Sie Agentenaufgaben in isolierten Git-Checkouts mit automatischen Snapshots und automatischer Bereinigung aus
title: Verwaltete Worktrees
x-i18n:
    generated_at: "2026-07-24T04:30:28Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 98ed2579b7243544dbdb550c4b8a292ccd4ab494fd4a45b2404256691c831401
    source_path: concepts/managed-worktrees.md
    workflow: 16
---

Verwaltete Worktrees geben einer Agentenaufgabe einen eigenen Git-Branch und Checkout, ohne temporäre Verzeichnisse im Quell-Repository anzulegen. OpenClaw erstellt sie in seinem Zustandsverzeichnis, erfasst sie in der gemeinsamen Zustandsdatenbank und erstellt vor dem Entfernen einen Snapshot ihrer versionierten sowie nicht ignorierten, unversionierten Inhalte.

## Layout und Namen

Jeder Worktree befindet sich unter:

```text
<openclaw-state-dir>/worktrees/<repo-fingerprint>/<name>
```

Der Repository-Fingerabdruck besteht aus den ersten 16 hexadezimalen Zeichen eines SHA-256-Hashes über das kanonische gemeinsame Git-Verzeichnis und die Origin-URL. Ein angegebener Name muss `[a-z0-9][a-z0-9-]{0,63}` entsprechen. Ohne Namen generiert OpenClaw `wt-`, gefolgt von acht zufälligen hexadezimalen Zeichen.

OpenClaw erstellt den Branch `openclaw/<name>` am angeforderten Basis-Ref. Ohne Basis-Ref ruft es `origin` ab, verwendet den standardmäßigen Remote-Branch, sofern verfügbar, und greift auf das lokale `HEAD` zurück, wenn das Repository offline ist oder kein verwendbares Remote besitzt.

## Ignorierte Dateien bereitstellen

Fügen Sie `.worktreeinclude` im Stammverzeichnis des Quell-Repositorys hinzu, um ausgewählte ignorierte, unversionierte Dateien in einen neuen Worktree zu kopieren. Die Datei verwendet die Gitignore-Mustersyntax mit einem Muster pro Zeile und `#`-Kommentaren:

```gitignore
.env.local
fixtures/generated/**
```

Nur Dateien, die Git sowohl als ignoriert als auch als unversioniert meldet, kommen infrage. Versionierte Dateien sind bereits über Git vorhanden und werden in diesem Schritt niemals kopiert. OpenClaw überschreibt oder ändert keine bereits vorhandenen Zieldateien, folgt keinen Verzeichnissymlinks und bewahrt die Dateimodi kopierter Dateien. Es erfasst nur tatsächlich erstellte Pfade, sodass spätere Änderungen am Manifest nicht dazu führen können, dass diese Dateien ihren Schutz vor der Bereinigung verlieren.

## Repository-Einrichtung ausführen

Wenn `.openclaw/worktree-setup.sh` im Quell-Repository vorhanden und ausführbar ist, führt OpenClaw die Datei mit dem neuen Worktree als aktuellem Verzeichnis aus. Das Skript erhält:

```text
OPENCLAW_SOURCE_TREE_PATH=<source checkout>
OPENCLAW_WORKTREE_PATH=<managed worktree>
```

Ein Exit-Code ungleich null bricht die Erstellung ab und entfernt den neuen Worktree und Branch. Dies ist ein Repository-lokaler Vertrag; dafür gibt es keinen OpenClaw-Konfigurationsschlüssel.

## Sitzungs-Worktrees

Starten Sie einen isolierten Chat aus einem Git-gestützten Ordner mit einer Worktree-Sitzung: Verwenden Sie auf der Seite „Neue Sitzung“ der Control UI die Auswahl **Ort**, um einen Gateway-Quellordner auszuwählen, und wählen Sie anschließend **Worktree** aus (optional mit Basis-Branch und Worktree-Namen). Die Auswahl erscheint erst, nachdem das Gateway bestätigt hat, dass der ausgewählte Ordner ein Git-Checkout ist; gewöhnliche Ordner werden direkt verwendet und zeigen keine Steuerung für die Git-Isolation. iOS bietet dieselbe Auswahl über die Chataktionen, Android neben „Neuer Chat“, sofern der aktive Agenten-Arbeitsbereich Git-gestützt ist.

Coding-Agenten können außerdem `spawn_task` aufrufen, wenn sie bestätigte Folgearbeiten außerhalb der aktuellen Aufgabe erkennen. Die Control UI zeigt einen Vorschlags-Chip an, ohne etwas zu starten, während eine Gateway-gestützte TUI eine interaktive Eingabeaufforderung mit denselben Aktionen anzeigt. Durch Auswahl von **In Worktree starten** wird ein neuer sitzungseigener Worktree aus dem vorgeschlagenen Projekt erstellt und die eigenständige Eingabeaufforderung als erster Turn gesendet; beim Verwerfen des Vorschlags bleibt das Repository unverändert. Vorschläge und ihre IDs sind flüchtig und bleiben nach einem Gateway-Neustart nicht erhalten.

OpenClaw stellt diese Tools nur Operatorsitzungen mit einer aktionsfähigen Gateway-Benutzeroberfläche zur Verfügung. Kanalsitzungen sowie lokale oder eingebettete TUI-Sitzungen erhalten sie erst, wenn diese Oberflächen über einen portablen, typisierten Vertrag für Aufgabenaktionen verfügen.

Der resultierende verwaltete Worktree gehört der Sitzung, und jeder Agentenlauf in dieser Sitzung verwendet dessen Checkout. Wenn der Arbeitsbereich ein Unterverzeichnis eines Repositorys ist, wird der Worktree im Repository-Stammverzeichnis verankert und die Sitzung im entsprechenden Unterverzeichnis darin ausgeführt. Die Erstellung eines Sitzungs-Worktrees verwendet den `operator.write`-Geltungsbereich der Methode, aber Repository-Checkout-Hooks und der Schritt `.openclaw/worktree-setup.sh` werden nur für `operator.admin`-Aufrufer ausgeführt, da sie Repository-Code ausführen; die Bereitstellung über `.worktreeinclude` gilt weiterhin für jeden Aufrufer. Beim Löschen der Sitzung wird der Worktree nur entfernt, wenn dies verlustfrei möglich ist. Veränderte Worktrees oder Branches mit nicht gepushten Commits bleiben verfügbar; die stündliche Bereinigung erstellt nach 7 inaktiven Tagen Snapshots von Sitzungs-Worktrees, wobei kürzliche Sitzungsaktivitäten als Worktree-Aktivitäten gelten. Entfernte Worktrees können wie nachfolgend beschrieben weiterhin aus ihren Snapshots wiederhergestellt werden.

`sessions.create` kann ein absolutes `cwd` enthalten, um die Ausführung direkt in einem anderen Gateway-Ordner durchzuführen, zusammen mit `worktree: true` den Quell-Checkout auszuwählen oder das Arbeitsverzeichnis eines gekoppelten Nodes festzulegen. Jeder explizite Hostpfad erfordert `operator.admin`; die gewöhnliche Erstellung eines Worktree-Chats bleibt `operator.write` und im konfigurierten Arbeitsbereich verankert.

`sessions.create` akzeptiert neben `worktree: true` auch `worktreeBaseRef` und `worktreeName`, um den Basis-Ref und den Worktree-Namen auszuwählen (der Branch wird zu `openclaw/<name>`); beide verbleiben bei `operator.write`. Der erstellte Worktree wird im Erstellungsergebnis zurückgegeben und in der Sitzungszeile als `worktree: { id, branch, repoRoot }` gespeichert, sodass Sitzungslisten den Checkout und Branch anzeigen können. Beim Löschen einer Sitzung wird ein beibehaltenes verändertes Checkout als `worktreePreserved` gemeldet, statt es unbemerkt zurückzulassen.

## Snapshots, Bereinigung und Wiederherstellung

Beim Entfernen wird zunächst ein synthetischer Commit mit versionierten und nicht ignorierten, unversionierten Dateien erstellt und anschließend unter `refs/openclaw/snapshots/<id>` fixiert. Ignorierte Dateien gelangen niemals in die Objektdatenbank des Repositorys. OpenClaw speichert nur die ignorierten Dateien, die es tatsächlich bereitgestellt hat, in segmentierten Zeilen der gemeinsamen Zustandsdatenbank; die erfasste Pfadmenge bleibt maßgeblich, selbst wenn `.worktreeinclude` später geändert wird oder nicht mehr vorhanden ist. Bei der Wiederherstellung werden diese Bytes aus dem unveränderlichen Snapshot gelesen und ihre vollständigen Modi erneut angewendet. Die automatische Bereinigung bewahrt einen aktiven Worktree, wenn für einen erfassten Pfad kein sicherer Snapshot mehr erstellt werden kann. Wenn die Snapshot-Erstellung fehlschlägt, wird das Entfernen beendet. Eine explizite erzwungene Löschung kann ohne Snapshot fortgesetzt werden.

OpenClaw wendet diese Bereinigungsregeln an:

- Am Ende eines Laufs entfernt es einen Worktree nur, wenn `git status --porcelain` leer ist und `git log HEAD --not --remotes --oneline` keine nicht gepushten Commits findet. Andernfalls gibt es lediglich die Aktivitätssperre frei.
- Die stündliche Bereinigung erstellt Snapshots von entsperrten, Workboard- und sitzungseigenen Worktrees, die länger als 7 Tage inaktiv waren, und entfernt sie, selbst wenn sie verändert sind. Manuelle Worktrees werden niemals automatisch entfernt.
- Snapshot-Datensätze bleiben 30 Tage lang wiederherstellbar. Danach löscht die Bereinigung den Snapshot-Ref und die Registrierungszeile.
- Eine Sperre eines aktiven OpenClaw-Prozesses sowie jede fremde oder unbekannte Git-Worktree-Sperre schützt einen Worktree vor der Garbage Collection.

Bei der Wiederherstellung wird `openclaw/<name>` am ursprünglichen Commit vor dem Snapshot neu erstellt; anschließend werden die Snapshot-Unterschiede als nicht zum Commit vorgemerkte Änderungen und unversionierte Dateien rekonstruiert. Dadurch bleibt der synthetische Snapshot-Commit außerhalb des Branch-Verlaufs. Der Snapshot-Ref bleibt als Herkunftsnachweis erfasst.

## CLI

```bash
openclaw worktrees list [--json]
openclaw worktrees create <repo-root> [--name <name>] [--base-ref <ref>] [--json]
openclaw worktrees remove <id> [--force] [--json]
openclaw worktrees restore <id> [--json]
openclaw worktrees gc [--json]
```

Die Control-UI-Seite **Worktrees** unter „Einstellungen“ bietet dieselben Aktionen sowie die Erstellung mit einer Auswahl für den Basis-Branch, zeigt für jeden Worktree den Eigentümer an (manuell, Workboard oder die zugehörige Sitzung mit einem Link zu ihrem Chat) und bietet einen erzwungenen erneuten Versuch an, wenn beim Entfernen ein fehlgeschlagener Snapshot gemeldet wird.

## Gateway-Methoden

| Methode               | Zweck                                                                 |
| -------------------- | ----------------------------------------------------------------------- |
| `worktrees.list`     | Aktive und wiederherstellbare Worktree-Datensätze auflisten.                            |
| `worktrees.branches` | Lokale und Remote-Branches eines Repositorys für Basis-Ref-Auswahlfelder auflisten.    |
| `worktrees.create`   | Einen benannten verwalteten Worktree erstellen oder wiederverwenden.                               |
| `worktrees.remove`   | Einen Snapshot eines Worktrees erstellen und ihn entfernen. Erzwungene Entfernungen melden `snapshotError`. |
| `worktrees.restore`  | Einen entfernten Worktree aus seinem Snapshot wiederherstellen.                           |
| `worktrees.gc`       | Bereinigung inaktiver und verwaister Einträge sowie Aufbewahrungsbereinigung jetzt ausführen.                            |

`worktrees.list` erfordert `operator.read`, und die verändernden Methoden erfordern `operator.admin`. `worktrees.branches` benötigt `operator.write` für konfigurierte Agenten-Arbeitsbereiche, während jeder andere Hostpfad `operator.admin` erfordert (entsprechend der `sessions.create`-cwd-Schwelle). Die Methode liest nur vorhandene Refs und ruft niemals Daten ab; ausschließlich remote vorhandene Branches werden mit Remote-Qualifizierung zurückgegeben (`origin/feature-a`), sodass jeder zurückgegebene Name als Basis-Ref aufgelöst werden kann. „Neue Sitzung“ kann über diese Methode außerdem einen typisierten Repository-Status anfordern; für ein einfaches Verzeichnis oder einen nicht verfügbaren Checkout werden keine Branches zurückgegeben, statt die Benutzeroberfläche zu zwingen, die Git-Fähigkeit aus einer Fehlermeldung abzuleiten.

## Workboard-Arbeitsbereiche

Das mitgelieferte [Workboard-Plugin](/de/plugins/workboard) kann einen Kartenarbeitsbereich als verwalteten Worktree materialisieren:

```json
{
  "kind": "worktree",
  "path": "/absolute/path/to/source-checkout",
  "branch": "main"
}
```

`path` identifiziert den Git-Quell-Checkout. `branch` ist optional und wird zum Basis-Ref. Für einen Full-Host-Aufrufer erstellt oder verwendet Workboard `wb-<card-id>`, führt den Subagenten mit dem verwalteten Checkout als Arbeitsverzeichnis aus und schreibt den aufgelösten Pfad und Branch zurück auf die Karte. Gateway-Clients benötigen `operator.admin` für die Full-Host-Materialisierung. Am Ende eines Laufs entfernt Workboard den Checkout nur, wenn dies nachweislich verlustfrei ist; veränderte Arbeit oder nicht gepushte Commits bleiben verfügbar.

Für einen an einen Arbeitsbereich gebundenen Aufrufer müssen `path` und das Repository-Stammverzeichnis exakt mit dem Zielarbeitsbereich des Agenten übereinstimmen. Workboard wird dann direkt in diesem Verzeichnis ausgeführt und erfasst einen Verzeichnisarbeitsbereich, statt einen verwalteten Worktree auf dem Host zu materialisieren. Das Ziel muss für denselben Arbeitsbereich eine beschreibbare, nicht gemeinsam genutzte Docker-Sandbox verwenden, der Hash seines aktiven Containers muss mit den angeforderten Einbindungen und Richtlinien übereinstimmen, und es darf keine Ausführung mit erhöhten Rechten, Hoststeuerung, hostweiten Sitzungen, persistierte Host-/Node-Ausführung oder nicht klassifizierte Plugin- und MCP-Tools bereitstellen. Wenn die Zielrichtlinie oder der aktive Container umfassender ist, lässt die Übergabe die Karte unangetastet und meldet den inkompatiblen Zustand.
