---
read_when:
    - Sie möchten einen isolierten Branch und Checkout für eine Agentenaufgabe.
    - Sie konfigurieren Workboard-Karten mit Worktree-Arbeitsbereichen
    - Sie müssen einen von OpenClaw verwalteten Worktree wiederherstellen oder bereinigen.
summary: Führen Sie Agentenaufgaben in isolierten Git-Arbeitskopien mit automatischen Snapshots und automatischer Bereinigung aus
title: Verwaltete Arbeitsbäume
x-i18n:
    generated_at: "2026-07-12T01:36:10Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 12a33dc2d9f1ff30060ddead200196b09cfe9498462f58a7aa8a73fa2273f31f
    source_path: concepts/managed-worktrees.md
    workflow: 16
---

Verwaltete Worktrees geben einer Agentenaufgabe einen eigenen Git-Branch und Checkout, ohne temporäre Verzeichnisse innerhalb des Quell-Repositorys anzulegen. OpenClaw erstellt sie in seinem Zustandsverzeichnis, erfasst sie in der gemeinsamen Zustandsdatenbank und legt vor dem Entfernen einen Snapshot ihrer verfolgten sowie ihrer nicht ignorierten, nicht verfolgten Inhalte an.

## Struktur und Namen

Jeder Worktree befindet sich unter:

```text
<openclaw-state-dir>/worktrees/<repo-fingerprint>/<name>
```

Der Repository-Fingerabdruck besteht aus den ersten 16 Hexadezimalzeichen eines SHA-256-Hashes über das kanonische gemeinsame Git-Verzeichnis und die Ursprungs-URL. Ein angegebener Name muss `[a-z0-9][a-z0-9-]{0,63}` entsprechen. Ohne Namen erzeugt OpenClaw `wt-`, gefolgt von acht zufälligen Hexadezimalzeichen.

OpenClaw erstellt den Branch `openclaw/<name>` an der angeforderten Basisreferenz. Ohne Basisreferenz ruft es `origin` ab, verwendet den standardmäßigen Remote-Branch, sofern verfügbar, und greift auf das lokale `HEAD` zurück, wenn das Repository offline ist oder kein nutzbares Remote-Repository besitzt.

## Ignorierte Dateien bereitstellen

Fügen Sie im Stammverzeichnis des Quell-Repositorys `.worktreeinclude` hinzu, um ausgewählte ignorierte, nicht verfolgte Dateien in einen neuen Worktree zu kopieren. Die Datei verwendet die Syntax von Gitignore-Mustern, ein Muster pro Zeile, mit `#`-Kommentaren:

```gitignore
.env.local
fixtures/generated/**
```

Nur Dateien, die Git sowohl als ignoriert als auch als nicht verfolgt meldet, kommen infrage. Verfolgte Dateien sind bereits über Git vorhanden und werden in diesem Schritt niemals kopiert. OpenClaw überschreibt keine Zieldateien, folgt keinen Verzeichnissen, die symbolische Links sind, und behält die Dateimodi kopierter Dateien bei.

## Repository-Einrichtung ausführen

Wenn `.openclaw/worktree-setup.sh` im Quell-Repository vorhanden und ausführbar ist, führt OpenClaw das Skript mit dem neuen Worktree als aktuellem Verzeichnis aus. Das Skript erhält:

```text
OPENCLAW_SOURCE_TREE_PATH=<source checkout>
OPENCLAW_WORKTREE_PATH=<managed worktree>
```

Ein Exitcode ungleich null bricht die Erstellung ab und entfernt den neuen Worktree und Branch. Dies ist ein Repository-lokaler Vertrag; dafür gibt es keinen OpenClaw-Konfigurationsschlüssel.

## Sitzungs-Worktrees

Starten Sie einen isolierten Chat aus dem Git-Arbeitsbereich des aktiven Agenten mit einer Worktree-gestützten Sitzung: Aktivieren Sie **Worktree** auf der Seite „Neue Sitzung“ der Control UI, die auch eine Auswahl für den Basis-Branch und einen optionalen Worktree-Namen bietet, oder verwenden Sie das Menü „Chat-Aktionen“ unter iOS beziehungsweise die Überlaufaktion neben „Neuer Chat“ unter Android. Die Option ist nur für einen Git-gestützten Agenten verfügbar, wenn der Client diese Funktion unterstützt; Clients, die keine Vorabprüfung durchführen können, zeigen stattdessen den Gateway-Fehler an.

Programmieragenten können außerdem `spawn_task` aufrufen, wenn sie bestätigte Folgearbeiten außerhalb der aktuellen Aufgabe erkennen. Die Control UI zeigt einen Vorschlags-Chip an, ohne etwas zu starten, während eine Gateway-gestützte TUI eine interaktive Eingabeaufforderung mit denselben Aktionen anzeigt. Durch Auswahl von **In Worktree starten** wird ein neuer sitzungseigener Worktree aus dem vorgeschlagenen Projekt erstellt und die eigenständige Eingabeaufforderung als erster Durchlauf gesendet; beim Verwerfen des Vorschlags bleibt das Repository unverändert. Vorschläge und ihre IDs sind flüchtig und bleiben nach einem Gateway-Neustart nicht erhalten.

OpenClaw stellt diese Werkzeuge nur Operatorsitzungen mit einer aktionsfähigen Gateway-Benutzeroberfläche bereit. Kanalsitzungen sowie lokale oder eingebettete TUI-Sitzungen erhalten sie erst, wenn diese Oberflächen über einen portablen typisierten Vertrag für Aufgabenaktionen verfügen.

Der resultierende verwaltete Worktree gehört der Sitzung, und jeder Agentenlauf in dieser Sitzung verwendet dessen Checkout. Wenn der Arbeitsbereich ein Unterverzeichnis eines Repositorys ist, wird der Worktree im Stammverzeichnis des Repositorys verankert und die Sitzung im entsprechenden Unterverzeichnis darin ausgeführt. Die Erstellung eines Sitzungs-Worktrees verwendet den Bereich `operator.write` der Methode, der Schritt `.openclaw/worktree-setup.sh` wird jedoch nur für Aufrufer mit `operator.admin` ausgeführt, da er Repository-Code ausführt; die Bereitstellung über `.worktreeinclude` gilt weiterhin für jeden Aufrufer. Beim Löschen der Sitzung wird der Worktree nur entfernt, wenn dies verlustfrei möglich ist. Veränderte Worktrees oder Branches mit nicht übertragenen Commits bleiben verfügbar; die stündliche Bereinigung erstellt nach 7 inaktiven Tagen Snapshots von Sitzungs-Worktrees, wobei eine kürzlich erfolgte Sitzungsaktivität als Worktree-Aktivität gilt. Entfernte Worktrees können wie unten beschrieben aus ihren Snapshots wiederhergestellt werden.

`sessions.create` kann zusammen mit `worktree: true` ein absolutes `cwd` enthalten, wenn eine Aufgabe auf ein anderes Projekt als den konfigurierten Agenten-Arbeitsbereich abzielt. Dieser explizite Hostpfad erfordert `operator.admin`; die gewöhnliche Erstellung eines Worktree-Chats bleibt bei `operator.write` und im konfigurierten Arbeitsbereich verankert.

`sessions.create` akzeptiert zusammen mit `worktree: true` außerdem `worktreeBaseRef` und `worktreeName`, um die Basisreferenz und den Worktree-Namen auszuwählen; der Branch wird zu `openclaw/<name>`. Beide verbleiben bei `operator.write`. Der erstellte Worktree wird im Erstellungsergebnis zurückgegeben und in der Sitzungszeile als `worktree: { id, branch, repoRoot }` gespeichert, sodass Sitzungslisten den Checkout und Branch anzeigen können. Beim Löschen einer Sitzung wird ein beibehaltener veränderter Checkout als `worktreePreserved` gemeldet, statt ihn unbemerkt zurückzulassen.

## Snapshots, Bereinigung und Wiederherstellung

Beim Entfernen wird zunächst ein synthetischer Commit erstellt, der verfolgte sowie nicht ignorierte, nicht verfolgte Dateien enthält, und unter `refs/openclaw/snapshots/<id>` fixiert. Von Git ignorierte Dateien werden aus der Objektdatenbank des Repositorys ausgeschlossen; durch `.worktreeinclude` ausgewählte Dateien werden während der Wiederherstellung erneut kopiert. Wenn die Snapshot-Erstellung fehlschlägt, wird das Entfernen abgebrochen. Eine explizite erzwungene Löschung kann ohne Snapshot fortgesetzt werden.

OpenClaw wendet folgende Bereinigungsregeln an:

- Am Ende eines Laufs entfernt es einen Worktree nur, wenn `git status --porcelain` leer ist und `git log HEAD --not --remotes --oneline` keine nicht übertragenen Commits findet. Andernfalls gibt es lediglich die Aktivitätssperre frei.
- Die stündliche Bereinigung erstellt Snapshots von entsperrten Worktrees im Besitz von Workboard oder einer Sitzung, die länger als 7 Tage inaktiv sind, und entfernt sie, selbst wenn sie verändert sind. Manuelle Worktrees werden niemals automatisch entfernt.
- Snapshot-Datensätze bleiben 30 Tage lang wiederherstellbar. Anschließend löscht die Bereinigung die Snapshot-Referenz und den Registrierungseintrag.
- Eine Sperre eines laufenden OpenClaw-Prozesses sowie jede fremde oder nicht erkannte Git-Worktree-Sperre schützt einen Worktree vor der Garbage Collection.

Bei der Wiederherstellung wird `openclaw/<name>` am ursprünglichen Commit vor dem Snapshot neu erstellt. Anschließend werden die Snapshot-Unterschiede als nicht zum Commit vorgemerkte Änderungen und nicht verfolgte Dateien rekonstruiert. Dadurch bleibt der synthetische Snapshot-Commit außerhalb des Branch-Verlaufs. Die Snapshot-Referenz bleibt als Herkunftsnachweis erfasst.

## CLI

```bash
openclaw worktrees list [--json]
openclaw worktrees create <repo-root> [--name <name>] [--base-ref <ref>] [--json]
openclaw worktrees remove <id> [--force] [--json]
openclaw worktrees restore <id> [--json]
openclaw worktrees gc [--json]
```

Die Seite **Worktrees** unter „Einstellungen“ in der Control UI bietet dieselben Aktionen sowie die Erstellung mit einer Auswahl für den Basis-Branch, zeigt den Eigentümer jedes Worktrees an – manuell, Workboard oder die besitzende Sitzung mit einem Link zu ihrem Chat – und bietet einen erzwungenen erneuten Versuch an, wenn beim Entfernen ein fehlgeschlagener Snapshot gemeldet wird.

## Gateway-Methoden

| Methode              | Zweck                                                                                       |
| -------------------- | ------------------------------------------------------------------------------------------- |
| `worktrees.list`     | Aktive und wiederherstellbare Worktree-Datensätze auflisten.                                |
| `worktrees.branches` | Lokale und Remote-Branches eines Repositorys für Auswahllisten der Basisreferenz auflisten. |
| `worktrees.create`   | Einen benannten verwalteten Worktree erstellen oder wiederverwenden.                        |
| `worktrees.remove`   | Einen Snapshot erstellen und einen Worktree entfernen. Erzwungene Entfernungen melden `snapshotError`. |
| `worktrees.restore`  | Einen entfernten Worktree aus seinem Snapshot wiederherstellen.                             |
| `worktrees.gc`       | Die Bereinigung inaktiver und verwaister Einträge sowie die Aufbewahrungsbereinigung jetzt ausführen. |

`worktrees.list` erfordert `operator.read`, und die verändernden Methoden erfordern `operator.admin`. `worktrees.branches` benötigt für konfigurierte Agenten-Arbeitsbereiche `operator.write`, während jeder andere Hostpfad `operator.admin` erfordert, entsprechend der `cwd`-Schwelle von `sessions.create`. Die Methode liest nur vorhandene Referenzen und ruft niemals Daten ab. Branches, die nur im Remote-Repository vorhanden sind, werden mit Remote-Qualifizierer zurückgegeben (`origin/feature-a`), sodass jeder zurückgegebene Name als Basisreferenz aufgelöst werden kann.

## Workboard-Arbeitsbereiche

Das mitgelieferte [Workboard-Plugin](/de/plugins/workboard) kann einen Karten-Arbeitsbereich als verwalteten Worktree materialisieren:

```json
{
  "kind": "worktree",
  "path": "/absolute/path/to/source-checkout",
  "branch": "main"
}
```

`path` bezeichnet den Git-Quell-Checkout. `branch` ist optional und wird zur Basisreferenz. Wenn die Verteilung den Worker der Karte startet, erstellt oder verwendet Workboard `wb-<card-id>`, führt den Unteragenten mit dem verwalteten Checkout als Arbeitsverzeichnis aus und schreibt den aufgelösten Pfad und Branch zurück in die Karte. Eine über das Gateway ausgelöste Materialisierung erfordert `operator.admin`. Am Ende eines Laufs entfernt Workboard den Checkout nur, wenn dies nachweislich verlustfrei ist; veränderte Arbeiten oder nicht übertragene Commits bleiben verfügbar.

In einer Sandbox ausgeführte eingebettete Agenten lehnen derzeit ein Aufgaben-Arbeitsverzeichnis außerhalb ihres konfigurierten Agenten-Arbeitsbereichs ab. Verwenden Sie für Workboard-Karten mit verwaltetem Worktree einen Zielagenten ohne Sandbox, bis die Sandbox-Laufzeit eine zusätzliche Checkout-Einbindung unterstützt.
