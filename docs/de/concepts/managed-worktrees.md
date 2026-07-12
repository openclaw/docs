---
read_when:
    - Sie möchten einen isolierten Branch und Checkout für eine Agentenaufgabe.
    - Sie konfigurieren Workboard-Karten mit Worktree-Arbeitsbereichen
    - Sie müssen einen von OpenClaw verwalteten Worktree wiederherstellen oder bereinigen
summary: Führen Sie Agentenaufgaben in isolierten Git-Checkouts mit automatischen Snapshots und automatischer Bereinigung aus
title: Verwaltete Arbeitsbäume
x-i18n:
    generated_at: "2026-07-12T15:14:18Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 12a33dc2d9f1ff30060ddead200196b09cfe9498462f58a7aa8a73fa2273f31f
    source_path: concepts/managed-worktrees.md
    workflow: 16
---

Verwaltete Worktrees stellen einer Agentenaufgabe einen eigenen Git-Branch und Checkout bereit, ohne temporäre Verzeichnisse im Quell-Repository anzulegen. OpenClaw erstellt sie in seinem Zustandsverzeichnis, erfasst sie in der gemeinsamen Zustandsdatenbank und erstellt vor dem Entfernen einen Snapshot ihrer versionierten sowie ihrer nicht ignorierten, nicht versionierten Inhalte.

## Struktur und Namen

Jeder Worktree befindet sich unter:

```text
<openclaw-state-dir>/worktrees/<repo-fingerprint>/<name>
```

Der Repository-Fingerabdruck besteht aus den ersten 16 hexadezimalen Zeichen eines SHA-256-Hashes über das kanonische gemeinsame Git-Verzeichnis und die Origin-URL. Ein angegebener Name muss dem Muster `[a-z0-9][a-z0-9-]{0,63}` entsprechen. Ohne Namensangabe generiert OpenClaw `wt-`, gefolgt von acht zufälligen hexadezimalen Zeichen.

OpenClaw erstellt den Branch `openclaw/<name>` an der angeforderten Basisreferenz. Ohne Basisreferenz ruft es `origin` ab, verwendet den standardmäßigen Remote-Branch, sofern verfügbar, und greift auf das lokale `HEAD` zurück, wenn das Repository offline ist oder kein verwendbares Remote-Repository besitzt.

## Ignorierte Dateien bereitstellen

Fügen Sie `.worktreeinclude` im Stammverzeichnis des Quell-Repositorys hinzu, um ausgewählte ignorierte, nicht versionierte Dateien in einen neuen Worktree zu kopieren. Die Datei verwendet die Syntax von Gitignore-Mustern mit einem Muster pro Zeile und `#`-Kommentaren:

```gitignore
.env.local
fixtures/generated/**
```

Nur Dateien, die Git sowohl als ignoriert als auch als nicht versioniert meldet, kommen infrage. Versionierte Dateien sind bereits über Git vorhanden und werden in diesem Schritt niemals kopiert. OpenClaw überschreibt keine Zieldateien und folgt keinen Verzeichnissen, die symbolische Links sind; außerdem behält es die Dateimodi kopierter Dateien bei.

## Repository-Einrichtung ausführen

Wenn `.openclaw/worktree-setup.sh` im Quell-Repository vorhanden und ausführbar ist, führt OpenClaw das Skript mit dem neuen Worktree als aktuellem Verzeichnis aus. Das Skript erhält:

```text
OPENCLAW_SOURCE_TREE_PATH=<source checkout>
OPENCLAW_WORKTREE_PATH=<managed worktree>
```

Ein Exit-Code ungleich null bricht die Erstellung ab und entfernt den neuen Worktree und Branch. Dies ist ein Repository-lokaler Vertrag; dafür gibt es keinen OpenClaw-Konfigurationsschlüssel.

## Sitzungs-Worktrees

Starten Sie einen isolierten Chat aus dem Git-Arbeitsbereich des aktiven Agenten mit einer Worktree-gestützten Sitzung: Aktivieren Sie **Worktree** auf der Seite „Neue Sitzung“ der Control UI (die außerdem eine Auswahl des Basis-Branches und einen optionalen Worktree-Namen anbietet), oder verwenden Sie das Menü mit den Chat-Aktionen unter iOS beziehungsweise die Überlaufaktion neben „Neuer Chat“ unter Android. Die Option ist nur für einen Git-gestützten Agenten verfügbar, wenn der Client diese Funktion unterstützt; Clients, die keine Vorabprüfung durchführen können, zeigen stattdessen den Gateway-Fehler an.

Coding-Agenten können außerdem `spawn_task` aufrufen, wenn sie bestätigte Folgearbeiten außerhalb der aktuellen Aufgabe feststellen. Die Control UI zeigt einen Vorschlags-Chip an, ohne etwas zu starten, während eine Gateway-gestützte TUI eine interaktive Eingabeaufforderung mit denselben Aktionen anzeigt. Durch Auswahl von **In Worktree starten** wird aus dem vorgeschlagenen Projekt ein neuer sitzungseigener Worktree erstellt und die eigenständige Eingabeaufforderung als erste Interaktion gesendet; beim Verwerfen des Vorschlags bleibt das Repository unverändert. Vorschläge und ihre IDs sind flüchtig und bleiben nach einem Neustart des Gateways nicht erhalten.

OpenClaw stellt diese Tools nur Operatorsitzungen mit einer aktionsfähigen Gateway-Benutzeroberfläche bereit. Kanalsitzungen und lokale/eingebettete TUI-Sitzungen erhalten sie erst, wenn diese Oberflächen über einen portablen, typisierten Vertrag für Aufgabenaktionen verfügen.

Der resultierende verwaltete Worktree gehört der Sitzung, und jeder Agent-Lauf in dieser Sitzung verwendet dessen Checkout. Wenn der Arbeitsbereich ein Unterverzeichnis eines Repositorys ist, wird der Worktree im Repository-Stammverzeichnis verankert, und die Sitzung wird aus dem entsprechenden Unterverzeichnis darin ausgeführt. Die Erstellung des Sitzungs-Worktrees verwendet den Bereich `operator.write` der Methode, aber der Schritt `.openclaw/worktree-setup.sh` wird nur für Aufrufer mit `operator.admin` ausgeführt, da er Repository-Code ausführt; die Bereitstellung über `.worktreeinclude` gilt weiterhin für jeden Aufrufer. Beim Löschen der Sitzung wird der Worktree nur entfernt, wenn dies verlustfrei möglich ist. Worktrees mit nicht committeten Änderungen oder Branches mit noch nicht gepushten Commits bleiben verfügbar; die stündliche Bereinigung erstellt nach 7 inaktiven Tagen Snapshots von Sitzungs-Worktrees, wobei kürzliche Sitzungsaktivität als Worktree-Aktivität gilt. Entfernte Worktrees können wie unten beschrieben weiterhin aus ihren Snapshots wiederhergestellt werden.

`sessions.create` kann zusammen mit `worktree: true` ein absolutes `cwd` enthalten, wenn eine Aufgabe auf ein anderes Projekt als den konfigurierten Agent-Arbeitsbereich abzielt. Dieser explizite Host-Pfad erfordert `operator.admin`; die gewöhnliche Erstellung eines Worktree-Chats bleibt auf `operator.write` beschränkt und weiterhin im konfigurierten Arbeitsbereich verankert.

`sessions.create` akzeptiert zusammen mit `worktree: true` außerdem `worktreeBaseRef` und `worktreeName`, um den Basis-Ref und den Worktree-Namen auszuwählen (der Branch wird zu `openclaw/<name>`); beide bleiben auf `operator.write`. Der erstellte Worktree wird im Erstellungsergebnis zurückgegeben und in der Sitzungszeile als `worktree: { id, branch, repoRoot }` gespeichert, sodass Sitzungslisten den Checkout und den Branch anzeigen können. Beim Löschen einer Sitzung wird ein beibehaltener Checkout mit nicht committeten Änderungen als `worktreePreserved` gemeldet, statt ihn stillschweigend zurückzulassen.

## Snapshots, Bereinigung und Wiederherstellung

Beim Entfernen wird zunächst ein synthetischer Commit erstellt, der nachverfolgte und nicht ignorierte, nicht nachverfolgte Dateien enthält, und unter `refs/openclaw/snapshots/<id>` fixiert. Von Git ignorierte Dateien werden aus der Objektdatenbank des Repositorys ausgeschlossen; durch `.worktreeinclude` ausgewählte Dateien werden bei der Wiederherstellung erneut kopiert. Wenn die Snapshot-Erstellung fehlschlägt, wird das Entfernen abgebrochen. Eine explizit erzwungene Löschung kann ohne Snapshot fortgesetzt werden.

OpenClaw wendet folgende Bereinigungsregeln an:

- Am Ende eines Laufs entfernt OpenClaw einen Worktree nur, wenn `git status --porcelain` leer ist und `git log HEAD --not --remotes --oneline` keine noch nicht gepushten Commits findet. Andernfalls gibt OpenClaw lediglich die Aktivitätssperre frei.
- Die stündliche Bereinigung erstellt Snapshots von entsperrten, Workboard- und sitzungseigenen Worktrees, die länger als 7 Tage inaktiv sind, und entfernt sie, selbst wenn sie nicht committete Änderungen enthalten. Manuelle Worktrees werden niemals automatisch entfernt.
- Snapshot-Datensätze können 30 Tage lang wiederhergestellt werden. Anschließend löscht die Bereinigung den Snapshot-Ref und die Registrierungszeile.
- Eine Sperre eines laufenden OpenClaw-Prozesses sowie jede fremde oder nicht erkannte Git-Worktree-Sperre schützt einen Worktree vor der Garbage Collection.

Bei der Wiederherstellung wird `openclaw/<name>` am ursprünglichen Commit vor dem Snapshot neu erstellt. Anschließend werden die Snapshot-Unterschiede als nicht zum Commit vorgemerkte Änderungen und nicht nachverfolgte Dateien rekonstruiert. Dadurch bleibt der synthetische Snapshot-Commit außerhalb des Branch-Verlaufs. Der Snapshot-Ref bleibt als Herkunftsnachweis gespeichert.

## CLI

```bash
openclaw worktrees list [--json]
openclaw worktrees create <repo-root> [--name <name>] [--base-ref <ref>] [--json]
openclaw worktrees remove <id> [--force] [--json]
openclaw worktrees restore <id> [--json]
openclaw worktrees gc [--json]
```

Die Seite **Worktrees** der Control UI unter „Einstellungen“ bietet dieselben Aktionen sowie die Erstellung mit einer Auswahl für den Basis-Branch, zeigt den Eigentümer jedes Worktrees an (manuell, Workboard oder die besitzende Sitzung mit einem Link zu ihrem Chat) und ermöglicht einen erzwungenen Wiederholungsversuch, wenn beim Entfernen ein fehlgeschlagener Snapshot gemeldet wird.

## Gateway-Methoden

| Methode              | Zweck                                                                                 |
| -------------------- | ------------------------------------------------------------------------------------- |
| `worktrees.list`     | Aktive und wiederherstellbare Worktree-Datensätze auflisten.                          |
| `worktrees.branches` | Lokale und Remote-Branches eines Repositorys für die Auswahl der Basisreferenz auflisten. |
| `worktrees.create`   | Einen benannten verwalteten Worktree erstellen oder wiederverwenden.                  |
| `worktrees.remove`   | Einen Snapshot eines Worktrees erstellen und ihn entfernen. Erzwungene Entfernungen melden `snapshotError`. |
| `worktrees.restore`  | Einen entfernten Worktree aus seinem Snapshot wiederherstellen.                       |
| `worktrees.gc`       | Die Bereinigung inaktiver und verwaister Worktrees sowie die Aufbewahrungsbereinigung jetzt ausführen. |

`worktrees.list` erfordert `operator.read`, und die verändernden Methoden erfordern `operator.admin`. `worktrees.branches` benötigt `operator.write` für konfigurierte Agent-Arbeitsbereiche, während jeder andere Host-Pfad `operator.admin` erfordert (entsprechend der cwd-Anforderung von `sessions.create`). Die Methode liest nur vorhandene Referenzen und ruft niemals Daten ab. Branches, die nur im Remote-Repository vorhanden sind, werden mit Remote-Qualifizierung zurückgegeben (`origin/feature-a`), sodass jeder zurückgegebene Name als Basisreferenz aufgelöst werden kann.

## Workboard-Arbeitsbereiche

Das mitgelieferte [Workboard-Plugin](/de/plugins/workboard) kann einen Kartenarbeitsbereich als verwalteten Worktree bereitstellen:

```json
{
  "kind": "worktree",
  "path": "/absolute/path/to/source-checkout",
  "branch": "main"
}
```

`path` bezeichnet den Git-Quell-Checkout. `branch` ist optional und wird zur Basisreferenz. Wenn die Ausführung den Worker der Karte startet, erstellt oder verwendet Workboard `wb-<card-id>` erneut, führt den Subagenten mit dem verwalteten Checkout als Arbeitsverzeichnis aus und schreibt den aufgelösten Pfad und Branch zurück auf die Karte. Eine durch den Gateway ausgelöste Bereitstellung erfordert `operator.admin`. Am Ende der Ausführung entfernt Workboard den Checkout nur, wenn dies nachweislich verlustfrei möglich ist; nicht übertragene Änderungen oder nicht gepushte Commits bleiben verfügbar.

In einer Sandbox ausgeführte eingebettete Agenten lehnen derzeit ein Aufgabenarbeitsverzeichnis außerhalb ihres konfigurierten Agent-Arbeitsbereichs ab. Verwenden Sie für Workboard-Karten mit verwalteten Worktrees einen Ziel-Agenten ohne Sandbox, bis die Sandbox-Laufzeit einen zusätzlichen Checkout-Mount unterstützt.
