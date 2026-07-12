---
read_when:
    - Konfigurieren von Ausführungsgenehmigungen oder Zulassungslisten
    - Implementierung der Benutzeroberfläche für Ausführungsgenehmigungen in der macOS-App
    - Überprüfung von Prompts zur Umgehung der Sandbox und ihrer Auswirkungen
sidebarTitle: Exec approvals
summary: 'Host-Ausführungsgenehmigungen: Richtlinienoptionen, Positivlisten und der YOLO-/strikte Workflow'
title: Ausführungsgenehmigungen
x-i18n:
    generated_at: "2026-07-12T15:57:12Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: b44efdfe5a6c9f3cc978baef91d80d1f75d39627d3a16f5971800809a642a72c
    source_path: tools/exec-approvals.md
    workflow: 16
---

Exec-Genehmigungen sind die **Schutzvorkehrung der Begleit-App/des Node-Hosts**, mit der ein
isolierter Agent Befehle auf einem realen Host (`gateway` oder `node`) ausführen
darf. Befehle werden nur ausgeführt, wenn Richtlinie, Zulassungsliste und
(optional) die Benutzergenehmigung übereinstimmen. Genehmigungen gelten
**zusätzlich zu** Tool-Richtlinien und Elevated-Zugriffskontrollen (Elevated
`full` überspringt sie).

Eine modusorientierte Übersicht über `deny`, `allowlist`, `ask`, `auto`, `full`,
die Zuordnung zu Codex Guardian und ACPX-Harness-Berechtigungen finden Sie unter
[Berechtigungsmodi](/de/tools/permission-modes).

<Note>
Die effektive Richtlinie ist die **strengere** aus `tools.exec.*` und den
Genehmigungsstandardwerten: Genehmigungen können die aus der Konfiguration
abgeleiteten Sicherheits- und Abfrageeinstellungen nur verschärfen, niemals
lockern. Wenn ein Genehmigungsfeld fehlt, wird der Wert aus `tools.exec`
verwendet. Die Host-Ausführung verwendet außerdem den lokalen
Genehmigungsstatus auf diesem Computer – ein hostlokales `ask: "always"` in
der Genehmigungsdatei des Ausführungshosts fragt weiterhin nach, auch wenn
Sitzungs- oder Konfigurationsstandardwerte `ask: "on-miss"` anfordern.
</Note>

## Geltungsbereich

Exec-Genehmigungen werden lokal auf dem Ausführungshost erzwungen:

- **Gateway-Host** -> `openclaw`-Prozess auf dem Gateway-Computer.
- **Node-Host** -> Node-Runner (macOS-Begleit-App oder monitorloser Node-Host).

### Vertrauensmodell

- Über den Gateway authentifizierte Aufrufer sind vertrauenswürdige Operatoren für diesen Gateway.
- Gekoppelte Nodes erweitern diese Fähigkeit vertrauenswürdiger Operatoren auf den Node-Host.
- Genehmigungen verringern das Risiko einer unbeabsichtigten Ausführung, sind aber **keine** benutzerspezifische Authentifizierungsgrenze oder schreibgeschützte Dateisystemrichtlinie.
- Nach der Genehmigung kann ein Befehl Dateien entsprechend den ausgewählten Host- oder Sandbox-Dateisystemberechtigungen verändern.
- Genehmigte Ausführungen auf Node-Hosts binden den kanonischen Ausführungskontext: Arbeitsverzeichnis, exakte Argumentliste, Umgebungsbindung, sofern vorhanden, und gegebenenfalls den festgelegten Pfad der ausführbaren Datei.
- Bei Shell-Skripten und direkten Datei-Aufrufen über Interpreter oder Laufzeiten versucht OpenClaw außerdem, einen konkreten lokalen Dateioperanden zu binden. Wenn sich diese Datei nach der Genehmigung, aber vor der Ausführung ändert, wird die Ausführung verweigert, statt den abweichenden Inhalt auszuführen.
- Die Dateibindung erfolgt nach bestem Bemühen und bildet nicht jeden Ladepfad eines Interpreters oder einer Laufzeit vollständig ab. Wenn nicht genau eine konkrete lokale Datei identifiziert werden kann, verweigert OpenClaw die Erstellung einer genehmigungsgestützten Ausführung, statt eine vollständige Abdeckung vorzutäuschen.

### macOS-Aufteilung

- Der **Node-Host-Dienst** leitet `system.run` über lokale IPC an die **macOS-App** weiter.
- Die **macOS-App** erzwingt Genehmigungen und führt den Befehl im UI-Kontext aus.

## Effektive Richtlinie prüfen

| Befehl                                                           | Angezeigte Informationen                                                                 |
| ---------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `openclaw approvals get` / `--gateway` / `--node <id\|name\|ip>` | Angeforderte Richtlinie, Quellen der Host-Richtlinie und das effektive Ergebnis.          |
| `openclaw exec-policy show`                                      | Zusammengeführte Ansicht des lokalen Computers.                                          |
| `openclaw exec-policy set` / `preset`                            | Synchronisiert die lokal angeforderte Richtlinie in einem Schritt mit der lokalen Host-Genehmigungsdatei. |

<Note>
Sitzungsspezifische `/exec`-Überschreibungen sind nicht enthalten. Führen Sie `/exec` in der betreffenden Sitzung aus, um deren aktuelle Standardwerte zu prüfen. Siehe [Sitzungsüberschreibungen](/de/tools/exec#session-overrides-exec).
</Note>

Die vollständige CLI-Referenz (Flags, JSON-Ausgabe, Hinzufügen/Entfernen von Einträgen der Zulassungsliste) finden Sie unter [Genehmigungs-CLI](/de/cli/approvals).

Wenn ein lokaler Geltungsbereich `host=node` anfordert, meldet
`exec-policy show` diesen Geltungsbereich zur Laufzeit als Node-verwaltet,
statt die lokale Genehmigungsdatei als maßgebliche Quelle zu behandeln.

Wenn die Benutzeroberfläche der Begleit-App **nicht verfügbar** ist, wird
jede Anfrage, die normalerweise eine Abfrage auslösen würde, anhand des
**Abfrage-Fallbacks** entschieden (Standard: `deny`).

<Tip>
Native Chat-Genehmigungsclients können die ausstehende Genehmigungsnachricht
mit kanalspezifischen Interaktionsmöglichkeiten versehen. Matrix fügt
Reaktionskürzel hinzu (`✅` einmal zulassen, `♾️` immer zulassen, `❌` ablehnen),
während `/approve ...` als Fallback weiterhin in der Nachricht verbleibt.
</Tip>

## Einstellungen und Speicherung

Genehmigungen werden in einer lokalen JSON-Datei auf dem Ausführungshost
gespeichert. Wenn `OPENCLAW_STATE_DIR` gesetzt ist, befindet sich die Datei in
diesem Zustandsverzeichnis; andernfalls wird das standardmäßige
OpenClaw-Zustandsverzeichnis verwendet:

```text
$OPENCLAW_STATE_DIR/exec-approvals.json
# andernfalls
~/.openclaw/exec-approvals.json
```

Der standardmäßige Genehmigungs-Socket verwendet dasselbe Stammverzeichnis:
`$OPENCLAW_STATE_DIR/exec-approvals.sock` oder
`~/.openclaw/exec-approvals.sock`, wenn die Variable nicht gesetzt ist.

Versionen vor 2026.6.6 speicherten die Datei immer unter `~/.openclaw`. Wenn
`OPENCLAW_STATE_DIR` auf ein anderes Verzeichnis verweist und im
Standardverzeichnis noch eine Genehmigungsdatei vorhanden ist, führen Sie
einmal direkt `openclaw doctor --fix` aus, um sie in das Zustandsverzeichnis
zu importieren (das Original wird mit dem Suffix `.migrated` archiviert).
Der interaktive Doctor kann den Import ebenfalls in einer Vorschau anzeigen
und bestätigen. Automatisierte Reparaturausführungen bei Updates und der
Gateway-Überwachung importieren niemals über Zustandsverzeichnisgrenzen
hinweg: Ein temporäres Zustands- oder Staging-Verzeichnis darf die
Genehmigungen der Standardinstallation nicht übernehmen. Dieselbe Grenze gilt
für Importe der veralteten Datei `plugin-binding-approvals.json` in den
gemeinsam genutzten SQLite-Zustand.

Beispielschema:

```json
{
  "version": 1,
  "socket": {
    "path": "~/.openclaw/exec-approvals.sock",
    "token": "base64url-token"
  },
  "defaults": {
    "security": "deny",
    "ask": "on-miss",
    "askFallback": "deny",
    "autoAllowSkills": false
  },
  "agents": {
    "main": {
      "security": "allowlist",
      "ask": "on-miss",
      "askFallback": "deny",
      "autoAllowSkills": true,
      "allowlist": [
        {
          "id": "B0C8C0B3-2C2D-4F8A-9A3C-5A4B3C2D1E0F",
          "pattern": "~/Projects/**/bin/rg",
          "source": "allow-always",
          "lastUsedAt": 1737150000000,
          "lastUsedCommand": "rg -n TODO",
          "lastResolvedPath": "/Users/user/Projects/.../bin/rg"
        }
      ]
    }
  }
}
```

## Richtlinieneinstellungen

### `tools.exec.mode`

`tools.exec.mode` ist die bevorzugte normalisierte Richtlinienoberfläche für die Host-Ausführung:

| Wert        | Verhalten                                                                                                                                                                                                                  |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `deny`      | Host-Ausführung blockieren.                                                                                                                                                                                                |
| `allowlist` | Nur Befehle aus der Positivliste ohne Rückfrage ausführen.                                                                                                                                                                 |
| `ask`       | Positivlistenrichtlinie verwenden und bei fehlenden Treffern nachfragen.                                                                                                                                                   |
| `auto`      | Positivlistenrichtlinie verwenden, deterministische Treffer direkt ausführen und fehlende Genehmigungen durch den nativen automatischen Prüfer von OpenClaw leiten, bevor auf einen menschlichen Genehmigungsweg zurückgegriffen wird. |
| `full`      | Host-Ausführung ohne Genehmigungsaufforderungen ausführen.                                                                                                                                                                 |

Die veralteten Optionen `tools.exec.security` / `tools.exec.ask` werden weiterhin unterstützt und
gelten weiterhin überall dort, wo `mode` in diesem Geltungsbereich nicht festgelegt ist.

### `exec.security`

<ParamField path="security" type='"deny" | "allowlist" | "full"'>
  - `deny` – alle Anfragen zur Host-Ausführung blockieren.
  - `allowlist` – nur Befehle aus der Positivliste zulassen.
  - `full` – alles zulassen (entspricht erhöhten Berechtigungen).

Der Standardwert für Gateway-/Node-Hosts ist `full`; für einen `sandbox`-Host gilt stattdessen
standardmäßig `deny`.
</ParamField>

### `exec.ask`

<ParamField path="ask" type='"off" | "on-miss" | "always"'>
  Konfigurierte Abfragerichtlinie für die Host-Ausführung. Steuert das grundlegende Verhalten
  der Genehmigungsaufforderungen aus `tools.exec.ask` und den Standardwerten für Host-Genehmigungen.
  Der Standardwert ist `off`. Der Tool-Parameter `ask` pro Aufruf (siehe
  [Exec-Tool](/de/tools/exec#parameters)) kann diese Grundlage nur verschärfen, und
  vom Kanal stammende Modellaufrufe ignorieren ihn, wenn die effektive Host-Abfrage auf `off` gesetzt ist.

- `off` – nie nachfragen.
- `on-miss` – nur nachfragen, wenn die Positivliste nicht übereinstimmt.
- `always` – bei jedem Befehl nachfragen. Dauerhaftes Vertrauen durch `allow-always` unterdrückt Aufforderungen **nicht**, wenn der effektive Abfragemodus `always` ist.

</ParamField>

### `askFallback`

<ParamField path="askFallback" type='"deny" | "allowlist" | "full"'>
  Entscheidung, wenn eine Aufforderung erforderlich, aber keine Benutzeroberfläche erreichbar ist (oder die
  Aufforderung das Zeitlimit überschreitet). Wenn nicht angegeben, ist der Standardwert `deny`.

- `deny` – blockieren.
- `allowlist` – nur zulassen, wenn die Positivliste übereinstimmt.
- `full` – zulassen.

</ParamField>

### `tools.exec.strictInlineEval`

<ParamField path="strictInlineEval" type="boolean">
  Wenn `true`, werden Inline-Codeauswertungsformen auch dann als ausschließlich
  genehmigungspflichtig behandelt, wenn die Interpreter-Binärdatei selbst auf
  der Positivliste steht. Zusätzlicher Schutz für Interpreter-Loader, die sich
  nicht eindeutig einem einzelnen stabilen Dateioperanden zuordnen lassen.
</ParamField>

Beispiele, die der strikte Modus erfasst: `python -c`, `node -e`/`--eval`/`-p`,
`ruby -e`, `perl -e`/`-E`, `php -r`, `lua -e`, `osascript -e` (ebenso Inline-Formen von
`awk`, `sed`, `make`, `find -exec` und `xargs`).

Im strikten Modus benötigen diese Befehle die Genehmigung durch den Prüfer oder
eine ausdrückliche Genehmigung. Bei `tools.exec.mode: "auto"` kann der Prüfer
eine einmalige Ausführung mit geringem Risiko genehmigen, wenn für den Befehl
ein durchsetzbarer Plan vorliegt; andernfalls fragt OpenClaw einen Menschen.
Genehmigungen für `Codex app-server`-Befehle, die auf den Prüfer-Fallback
zurückfallen, erfordern die Bestätigung durch einen Menschen, da ihre
Genehmigungsanfragen keine durchsetzbare, aufgelöste ausführbare Datei angeben.
`allow-always` speichert keine neuen Positivlisteneinträge für
Inline-Auswertungsbefehle.

### `tools.exec.commandHighlighting`

<ParamField path="commandHighlighting" type="boolean" default="false">
  Nur zur Darstellung: Wenn aktiviert, kann OpenClaw vom Parser abgeleitete
  Befehlsspannen anhängen, damit Web-Genehmigungsaufforderungen Befehlstoken
  hervorheben können. Dies ändert **nicht** `security`, `ask`, den Abgleich mit
  der Positivliste, das strikte Inline-Auswertungsverhalten, die Weiterleitung
  von Genehmigungen oder die Befehlsausführung.
</ParamField>

Legen Sie dies global unter `tools.exec.commandHighlighting` oder pro Agent unter
`agents.list[].tools.exec.commandHighlighting` fest.

## YOLO-Modus (ohne Genehmigung)

Um die Ausführung auf dem Host ohne Genehmigungsaufforderungen zu ermöglichen, müssen Sie **beide** Richtlinienebenen öffnen:
die angeforderte Ausführungsrichtlinie in der OpenClaw-Konfiguration (`tools.exec.*`) **und**
die hostlokale Genehmigungsrichtlinie in der Genehmigungsdatei des Ausführungshosts.

Wenn `askFallback` nicht angegeben ist, wird standardmäßig `deny` verwendet. Setzen Sie `askFallback` auf dem Host
explizit auf `full`, wenn eine Genehmigungsaufforderung ohne Benutzeroberfläche ersatzweise die Ausführung zulassen soll.

| Ebene                  | YOLO-Einstellung           |
| ---------------------- | -------------------------- |
| `tools.exec.security`  | `full` bei `gateway`/`node` |
| `tools.exec.ask`       | `off`                      |
| Host-`askFallback`     | `full`                     |

<Warning>
**Wichtige Unterschiede:**

- `tools.exec.host=auto` bestimmt, **wo** die Ausführung erfolgt: in der Sandbox, sofern verfügbar, andernfalls auf dem Gateway.
- YOLO bestimmt, **wie** die Ausführung auf dem Host genehmigt wird: `security=full` zusammen mit `ask=off`.
- YOLO fügt **keine** separate heuristische Genehmigungsprüfung für Befehlsverschleierung oder Ablehnungsebene für Skript-Vorprüfungen zusätzlich zur konfigurierten Host-Ausführungsrichtlinie hinzu.
- `auto` macht das Gateway-Routing nicht zu einer frei verfügbaren Außerkraftsetzung aus einer Sandbox-Sitzung. Eine anfragespezifische `host=node`-Anforderung ist bei `auto` zulässig; `host=gateway` ist bei `auto` nur zulässig, wenn keine Sandbox-Laufzeit aktiv ist. Für eine stabile, nicht automatische Standardeinstellung setzen Sie `tools.exec.host` oder verwenden Sie explizit `/exec host=...`.

</Warning>

CLI-gestützte Provider, die einen eigenen nicht interaktiven Berechtigungsmodus bereitstellen,
können dieser Richtlinie folgen. Die Claude CLI fügt
`--permission-mode bypassPermissions` hinzu, wenn die effektive Ausführungsrichtlinie
von OpenClaw YOLO ist. Bei von OpenClaw verwalteten Claude-Live-Sitzungen ist die
effektive Ausführungsrichtlinie von OpenClaw gegenüber dem nativen Berechtigungsmodus von Claude maßgeblich:
YOLO normalisiert Live-Starts auf `--permission-mode bypassPermissions`, und
eine restriktive effektive Ausführungsrichtlinie normalisiert Live-Starts auf
`--permission-mode default`, selbst wenn die unverarbeiteten Claude-Backend-Argumente einen anderen
Modus angeben.

Wenn Sie eine konservativere Einrichtung wünschen, verschärfen Sie die OpenClaw-Ausführungsrichtlinie wieder auf
`allowlist` / `on-miss` oder `deny`.

### Dauerhafte „Nie nachfragen“-Einrichtung auf dem Gateway-Host

<Steps>
  <Step title="Angeforderte Konfigurationsrichtlinie festlegen">
    ```bash
    openclaw config set tools.exec.host gateway
    openclaw config set tools.exec.security full
    openclaw config set tools.exec.ask off
    openclaw gateway restart
    ```
  </Step>
  <Step title="Genehmigungsdatei des Hosts abgleichen">
    ```bash
    openclaw approvals set --stdin <<'EOF'
    {
      version: 1,
      defaults: {
        security: "full",
        ask: "off",
        askFallback: "full"
      }
    }
    EOF
    ```
  </Step>
</Steps>

### Lokale Kurzform

```bash
openclaw exec-policy preset yolo
```

Aktualisiert sowohl die lokalen Werte für `tools.exec.host/security/ask` als auch die Standardwerte
der lokalen Genehmigungsdatei (einschließlich `askFallback: "full"`). Dies gilt absichtlich
nur lokal. Um Genehmigungen für den Gateway-Host oder Node-Host remote zu ändern, verwenden Sie
`openclaw approvals set --gateway` oder `openclaw approvals set --node
<id|name|ip>`.

Weitere integrierte Voreinstellungen: `cautious` (`host=gateway`, `security=allowlist`,
`ask=on-miss`, `askFallback=deny`) und `deny-all` (`host=gateway`,
`security=deny`, `ask=off`, `askFallback=deny`). Wenden Sie sie auf dieselbe Weise an:
`openclaw exec-policy preset cautious`.

Um einzelne Felder statt einer vollständigen Voreinstellung festzulegen, verwenden Sie
`openclaw exec-policy set --host <auto|sandbox|gateway|node> --security
<deny|allowlist|full> --ask <off|on-miss|always> --ask-fallback
<deny|allowlist|full>` mit einer beliebigen Teilmenge dieser Flags.

### Node-Host

Wenden Sie stattdessen dieselbe Genehmigungsdatei auf dem Node an:

```bash
openclaw approvals set --node <id|name|ip> --stdin <<'EOF'
{
  version: 1,
  defaults: {
    security: "full",
    ask: "off",
    askFallback: "full"
  }
}
EOF
```

<Note>
**Einschränkungen bei ausschließlich lokaler Verwendung:**

- `openclaw exec-policy` synchronisiert keine Node-Genehmigungen.
- `openclaw exec-policy set --host node` wird abgelehnt.
- Node-Ausführungsgenehmigungen werden zur Laufzeit vom Node abgerufen, daher müssen Node-spezifische Aktualisierungen `openclaw approvals --node ...` verwenden.

</Note>

### Kurzform nur für die Sitzung

- `/exec security=full ask=off` ändert nur die aktuelle Sitzung.
- `/elevated full` ist eine Notfall-Kurzform, die Ausführungsgenehmigungen nur dann überspringt,
  wenn sowohl die angeforderte Richtlinie als auch die Genehmigungsdatei des Hosts zu
  `security: "full"` und `ask: "off"` aufgelöst werden. Bei einer strengeren Host-Datei, etwa `ask:
"always"`, wird weiterhin nachgefragt.

Wenn die Genehmigungsdatei des Hosts strenger als die Konfiguration bleibt, hat weiterhin die strengere
Host-Richtlinie Vorrang.

## Positivliste (pro Agent)

Positivlisten gelten **pro Agent**. Wenn mehrere Agenten vorhanden sind, wechseln Sie in der
macOS-App zu dem Agenten, den Sie bearbeiten möchten. Muster werden als Globs abgeglichen.

Muster können Globs für aufgelöste Binärpfade oder reine Globs für Befehlsnamen sein.
Reine Namen stimmen nur mit Befehlen überein, die über `PATH` aufgerufen werden. Daher kann `rg`
mit `/opt/homebrew/bin/rg` übereinstimmen, wenn der Befehl `rg` lautet, aber **nicht** mit `./rg` oder
`/tmp/rg`. Verwenden Sie einen Pfad-Glob, um genau einem bestimmten Binärpfad zu vertrauen.

Veraltete `agents.default`-Einträge werden beim Laden zu `agents.main` migriert.
Shell-Ketten wie `echo ok && pwd` erfordern weiterhin, dass jedes Segment der obersten Ebene
die Regeln der Positivliste erfüllt.

Beispiele:

- `rg`
- `~/Projects/**/bin/peekaboo`
- `~/.local/bin/*`
- `/opt/homebrew/bin/rg`

### Argumente mit argPattern einschränken

Fügen Sie `argPattern` hinzu, wenn ein Positivlisteneintrag mit einer Binärdatei und einer
bestimmten Argumentstruktur übereinstimmen soll. OpenClaw verwendet auf jedem Host die Semantik
regulärer ECMAScript-Ausdrücke (JavaScript) und wertet den Ausdruck anhand der geparsten
Befehlsargumente aus, wobei das ausführbare Token (`argv[0]`) ausgeschlossen wird.
Bei manuell erstellten Einträgen werden Argumente mit einem einzelnen Leerzeichen verbunden.
Verankern Sie daher das Muster, wenn Sie eine exakte Übereinstimmung benötigen.

```json
{
  "version": 1,
  "agents": {
    "main": {
      "allowlist": [
        {
          "pattern": "python3",
          "argPattern": "^safe\\.py$"
        }
      ]
    }
  }
}
```

Dieser Eintrag erlaubt `python3 safe.py`; `python3 other.py` verfehlt die Positivliste.
Wenn außerdem ein reiner Pfadeintrag für dieselbe Binärdatei vorhanden ist, können nicht
übereinstimmende Argumente weiterhin auf diesen reinen Pfadeintrag zurückfallen. Lassen Sie den
reinen Pfadeintrag weg, wenn die Binärdatei auf die angegebenen Argumente beschränkt werden soll.

Von Genehmigungsabläufen gespeicherte Einträge verwenden ein internes Trennzeichenformat für den
exakten argv-Abgleich. Verwenden Sie vorzugsweise die Benutzeroberfläche oder den Genehmigungsablauf,
um diese Einträge neu zu erzeugen, statt den codierten Wert manuell zu bearbeiten. Wenn OpenClaw
argv für ein Befehlssegment nicht parsen kann, stimmen Einträge mit `argPattern` nicht überein.

Jeder Positivlisteneintrag unterstützt:

| Feld               | Bedeutung                                                    |
| ------------------ | ------------------------------------------------------------ |
| `pattern`          | Glob für den aufgelösten Binärpfad oder reiner Befehlsnamen-Glob |
| `argPattern`       | Optionaler ECMAScript-argv-Regex; ohne Angabe nur pfadbasiert |
| `id`               | Stabile undurchsichtige ID; wird bei Fehlen als UUID erzeugt |
| `source`           | Quelle des Eintrags, etwa `allow-always`                     |
| `commandText`      | Veraltete Klartexteingabe; wird beim Laden verworfen         |
| `lastUsedAt`       | Zeitstempel der letzten Verwendung                           |
| `lastUsedCommand`  | Letzter übereinstimmender Befehl                              |
| `lastResolvedPath` | Zuletzt aufgelöster Binärpfad                                |

## Skills-CLIs automatisch zulassen

Wenn **Skills-CLIs automatisch zulassen** (`autoAllowSkills`) aktiviert ist, werden ausführbare
Dateien, auf die bekannte Skills verweisen, auf Nodes (macOS-Node oder Headless-Node-Host)
als in der Positivliste enthalten behandelt. Dabei wird `skills.bins` über den Gateway-RPC
verwendet, um die Liste der Skill-Binärdateien abzurufen. Deaktivieren Sie dies, wenn Sie
strikte manuelle Positivlisten wünschen.

<Warning>
- Dies ist eine **implizite komfortorientierte Positivliste**, getrennt von manuellen Pfad-Positivlisteneinträgen.
- Sie ist für vertrauenswürdige Betreiberumgebungen vorgesehen, in denen Gateway und Node innerhalb derselben Vertrauensgrenze liegen.
- Wenn Sie strikt explizites Vertrauen benötigen, behalten Sie `autoAllowSkills: false` bei und verwenden Sie ausschließlich manuelle Pfad-Positivlisteneinträge.

</Warning>

## Sichere Binärdateien und Weiterleitung von Genehmigungen

Informationen zu sicheren Binärdateien (dem schnellen, ausschließlich stdin-basierten Pfad),
Details zur Interpreter-Bindung und zur Weiterleitung von Genehmigungsaufforderungen an
Slack/Discord/Telegram (oder deren Ausführung als native Genehmigungsclients) finden Sie unter
[Ausführungsgenehmigungen – erweitert](/de/tools/exec-approvals-advanced).

## Bearbeitung in der Control UI

Verwenden Sie die Karte **Control UI -> Nodes -> Exec approvals**, um Standardwerte,
agentenspezifische Überschreibungen und Positivlisten zu bearbeiten. Wählen Sie einen Bereich
(Defaults oder einen Agenten), passen Sie die Richtlinie an, fügen Sie Positivlistenmuster hinzu
oder entfernen Sie sie und wählen Sie anschließend **Save**. Die Benutzeroberfläche zeigt für
jedes Muster Metadaten zur letzten Verwendung an, damit Sie die Liste übersichtlich halten können.

Die Zielauswahl bestimmt **Gateway** (lokale Genehmigungen) oder einen **Node**.
Nodes müssen `system.execApprovals.get/set` bereitstellen (macOS-App oder Headless-
Node-Host). Wenn ein Node Ausführungsgenehmigungen noch nicht bereitstellt, bearbeiten Sie
dessen lokale Genehmigungsdatei direkt.

Einige Node-Hosts, darunter die Windows-Begleitanwendung, verwenden ein anderes Format für
Genehmigungsrichtlinien. Die Control UI zeigt diese hosteigenen Richtlinien schreibgeschützt an.
Verwenden Sie die Begleitanwendung oder `openclaw approvals set --node <id|name|ip>` mit dem
nativen Richtlinienformat, um sie zu bearbeiten; siehe [Genehmigungs-CLI](/de/cli/approvals).

CLI: `openclaw approvals` unterstützt die Bearbeitung von Gateway oder Node – siehe
[Genehmigungs-CLI](/de/cli/approvals).

## Genehmigungsablauf

Wenn eine Aufforderung erforderlich ist, sendet das Gateway
`exec.approval.requested` an Betreiberclients. Die Control UI und die macOS-
App lösen sie über `exec.approval.resolve` auf; anschließend leitet das Gateway die
genehmigte Anfrage an den Node-Host weiter.

Für `host=node` enthalten Genehmigungsanfragen eine kanonische `systemRunPlan`-
Nutzlast. Das Gateway verwendet diesen Plan als maßgeblichen Kontext für Befehl, cwd und Sitzung,
wenn genehmigte `system.run`-Anfragen weitergeleitet werden:

- Der Node-Ausführungspfad bereitet zu Beginn einen kanonischen Plan vor.
- Der Genehmigungsdatensatz speichert diesen Plan und seine Bindungsmetadaten.
- Nach der Genehmigung verwendet der endgültige weitergeleitete `system.run`-Aufruf den gespeicherten Plan erneut, statt späteren Änderungen des Aufrufers zu vertrauen.
- Wenn der Aufrufer `command`, `rawCommand`, `cwd`, `agentId` oder `sessionKey` nach der Erstellung der Genehmigungsanfrage ändert, lehnt das Gateway die weitergeleitete Ausführung wegen einer Abweichung von der Genehmigung ab.

## Systemereignisse und Ablehnungen

Der Ausführungslebenszyklus sendet eine `Exec finished`-Systemnachricht an die Sitzung des Agenten,
nachdem der Node den Abschluss meldet. OpenClaw kann außerdem eine Meldung über die laufende
Ausführung ausgeben, sobald eine Genehmigung erteilt wurde und
`tools.exec.approvalRunningNoticeMs` verstrichen ist (Standardwert `10000`; `0` deaktiviert
dies). Abgelehnte Ausführungsgenehmigungen sind für den Host-Befehl endgültig: Der Befehl
wird nicht ausgeführt.

- Bei asynchronen Genehmigungen des Hauptagenten mit einer Ursprungssitzung sendet OpenClaw
  die Ablehnung als interne Folgenachricht zurück in diese Sitzung, damit der Agent nicht weiter
  auf den asynchronen Befehl wartet und keine Reparatur wegen eines fehlenden Ergebnisses auslöst.
- Wenn keine Sitzung vorhanden ist oder die Sitzung nicht fortgesetzt werden kann, kann OpenClaw
  dem Betreiber oder dem direkten Chat-Pfad dennoch eine knappe Ablehnung melden.
- Ablehnungen für Subagenten- und Cron-Sitzungen werden nicht zurück in diese Sitzung gesendet.

Ausführungsgenehmigungen des Gateway-Hosts geben dasselbe Abschlussereignis des Lebenszyklus aus.
Genehmigungspflichtige Ausführungen verwenden die Genehmigungs-ID erneut, um die ausstehende
Anfrage mit ihrer Abschluss- oder Ablehnungsnachricht zu korrelieren (`Exec finished (gateway
id=...)` / `Exec denied (gateway id=...)`).

## Auswirkungen

- **`full`** ist leistungsstark; bevorzugen Sie nach Möglichkeit Positivlisten.
- **`ask`** bindet Sie weiterhin ein und ermöglicht zugleich schnelle Genehmigungen.
- Agentenspezifische Positivlisten verhindern, dass Genehmigungen eines Agenten auf andere übergreifen.
- Genehmigungen gelten nur für Host-Ausführungsanfragen von **autorisierten Absendern**. Nicht autorisierte Absender können `/exec` nicht ausführen.
- `/exec security=full` ist eine sitzungsbezogene Komfortfunktion für autorisierte Betreiber und überspringt Genehmigungen absichtlich. Um Host-Ausführungen vollständig zu blockieren, setzen Sie die Genehmigungssicherheit auf `deny` oder verweigern Sie das Werkzeug `exec` über die Werkzeugrichtlinie.

## Verwandte Themen

<CardGroup cols={2}>
  <Card title="Ausführungsgenehmigungen – erweitert" href="/de/tools/exec-approvals-advanced" icon="gear">
    Sichere Binärdateien, Interpreter-Bindung und Weiterleitung von Genehmigungen an den Chat.
  </Card>
  <Card title="Ausführungswerkzeug" href="/de/tools/exec" icon="terminal">
    Werkzeug zur Ausführung von Shell-Befehlen.
  </Card>
  <Card title="Erweiterter Modus" href="/de/tools/elevated" icon="shield-exclamation">
    Notfallpfad, der Genehmigungen ebenfalls überspringt.
  </Card>
  <Card title="Sandboxing" href="/de/gateway/sandboxing" icon="box">
    Sandbox-Modi und Arbeitsbereichszugriff.
  </Card>
  <Card title="Sicherheit" href="/de/gateway/security" icon="lock">
    Sicherheitsmodell und Härtung.
  </Card>
  <Card title="Sandbox vs. Werkzeugrichtlinie vs. erweitert" href="/de/gateway/sandbox-vs-tool-policy-vs-elevated" icon="sliders">
    Wann welches Steuerelement verwendet werden sollte.
  </Card>
  <Card title="Skills" href="/de/tools/skills" icon="sparkles">
    Skill-gestütztes Verhalten zur automatischen Zulassung.
  </Card>
</CardGroup>
