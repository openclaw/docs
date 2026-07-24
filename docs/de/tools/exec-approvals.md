---
read_when:
    - Ausführungsfreigaben oder Positivlisten konfigurieren
    - Implementierung der UX für Ausführungsgenehmigungen in der macOS-App
    - Überprüfung von Prompts zur Umgehung der Sandbox und ihrer Auswirkungen
sidebarTitle: Exec approvals
summary: 'Freigaben für die Host-Ausführung: Richtlinieneinstellungen, Positivlisten und der YOLO-/strikte Workflow'
title: Ausführungsgenehmigungen
x-i18n:
    generated_at: "2026-07-24T04:09:19Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: a224a737bcbf63ec543391c9cd0b2978ac3e348040f8edc398d02aafcf6d115a
    source_path: tools/exec-approvals.md
    workflow: 16
---

Ausführungsfreigaben sind die **Schutzvorkehrung der Begleit-App/des Node-Hosts**, mit der ein
in einer Sandbox ausgeführter Agent Befehle auf einem realen Host (`gateway` oder `node`) ausführen kann. Befehle
werden nur ausgeführt, wenn Richtlinie, Zulassungsliste und (optionale) Benutzerfreigabe übereinstimmen.
Freigaben gelten **zusätzlich zu** Werkzeugrichtlinie und Elevated-Gating (Elevated
`full` umgeht sie).

Eine modusorientierte Übersicht über `deny`, `allowlist`, `ask`, `auto`, `full`,
die Codex-Guardian-Zuordnung und ACPX-Harness-Berechtigungen finden Sie unter
[Berechtigungsmodi](/de/tools/permission-modes).

<Note>
Die wirksame Richtlinie ist die **strengere** aus `tools.exec.*` und den
Freigabestandardwerten: Freigaben können die aus der Konfiguration abgeleiteten Sicherheits-/Abfragevorgaben nur
verschärfen, niemals lockern. Wenn ein Freigabefeld ausgelassen wird, wird der Wert
`tools.exec` verwendet. Die Host-Ausführung verwendet außerdem den lokalen Freigabestatus auf diesem Rechner – ein
hostlokales `ask: "always"` in der Freigabedatei des Ausführungshosts fordert weiterhin
zur Bestätigung auf, selbst wenn Sitzungs- oder Konfigurationsstandardwerte `ask: "on-miss"` anfordern.
</Note>

## Geltungsbereich

Ausführungsfreigaben werden lokal auf dem Ausführungshost durchgesetzt:

- **Gateway-Host** -> `openclaw`-Prozess auf dem Gateway-Rechner.
- **Node-Host** -> Node-Runner (macOS-Begleit-App oder monitorloser Node-Host).

### Vertrauensmodell

- Vom Gateway authentifizierte Aufrufer sind vertrauenswürdige Operatoren für dieses Gateway.
- Gekoppelte Nodes erweitern diese vertrauenswürdige Operatorfunktion auf den Node-Host.
- Freigaben verringern das Risiko einer versehentlichen Ausführung, sind aber **keine** benutzerspezifische Authentifizierungsgrenze oder schreibgeschützte Dateisystemrichtlinie.
- Nach der Freigabe kann ein Befehl Dateien gemäß den ausgewählten Dateisystemberechtigungen des Hosts oder der Sandbox verändern.
- Freigegebene Ausführungen auf dem Node-Host binden den kanonischen Ausführungskontext: Arbeitsverzeichnis, exakte Argumentliste, sofern vorhanden die Umgebungsbindung und gegebenenfalls den festgelegten Pfad der ausführbaren Datei.
- Bei Shell-Skripten und direkten Datei-Aufrufen von Interpretern/Laufzeitumgebungen versucht OpenClaw außerdem, einen konkreten lokalen Dateioperanden zu binden. Wenn sich diese Datei nach der Freigabe, aber vor der Ausführung ändert, wird die Ausführung abgelehnt, statt den veränderten Inhalt auszuführen.
- Die Dateibindung erfolgt nach bestem Bemühen und bildet nicht jeden Ladepfad von Interpretern/Laufzeitumgebungen vollständig ab. Wenn nicht genau eine konkrete lokale Datei identifiziert werden kann, verweigert OpenClaw die Erstellung einer freigabegestützten Ausführung, statt eine vollständige Abdeckung vorzutäuschen.

### macOS-Aufteilung

- Der **Node-Host-Dienst** leitet `system.run` über lokale IPC an die **macOS-App** weiter.
- Die **macOS-App** setzt Freigaben durch und führt den Befehl im UI-Kontext aus.

## Wirksame Richtlinie prüfen

| Befehl                                                           | Anzeige                                                                                 |
| ---------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| `openclaw approvals get` / `--gateway` / `--node <id\|name\|ip>` | Angeforderte Richtlinie, Quellen der Host-Richtlinie und wirksames Ergebnis.             |
| `openclaw exec-policy show`                                      | Zusammengeführte Ansicht des lokalen Rechners.                                          |
| `openclaw exec-policy set` / `preset`                            | Synchronisiert die lokal angeforderte Richtlinie in einem Schritt mit der lokalen Host-Freigabedatei. |

<Note>
Sitzungsspezifische Überschreibungen von `/exec` sind nicht enthalten. Führen Sie `/exec` in der relevanten Sitzung aus, um deren aktuelle Standardwerte zu prüfen. Siehe [Sitzungsüberschreibungen](/de/tools/exec#session-overrides-exec).
</Note>

Vollständige CLI-Referenz (Flags, JSON-Ausgabe, Hinzufügen/Entfernen in der Zulassungsliste): [Freigaben-CLI](/de/cli/approvals).

Wenn ein lokaler Geltungsbereich `host=node` anfordert, meldet `exec-policy show` diesen
Geltungsbereich zur Laufzeit als Node-verwaltet, statt die lokale Freigabedatei
als maßgebliche Quelle zu behandeln.

Wenn die UI der Begleit-App **nicht verfügbar** ist, wird jede Anfrage, die
normalerweise eine Bestätigung auslösen würde, durch den **Abfrage-Rückfall** aufgelöst (Standard: `deny`).

<Tip>
Native Chat-Freigabeclients können kanalspezifische Optionen in der
ausstehenden Freigabenachricht bereitstellen. Matrix stellt Reaktionskürzel bereit (`✅` einmal zulassen,
`♾️` immer zulassen, `❌` ablehnen), während `/approve ...` weiterhin als
Rückfalloption in der Nachricht verbleibt.
</Tip>

## Einstellungen und Speicherung

Freigaben werden in einer lokalen JSON-Datei auf dem Ausführungshost gespeichert. Wenn
`OPENCLAW_STATE_DIR` festgelegt ist, folgt die Datei diesem Zustandsverzeichnis;
andernfalls verwendet sie das standardmäßige OpenClaw-Zustandsverzeichnis:

```text
$OPENCLAW_STATE_DIR/exec-approvals.json
# andernfalls
~/.openclaw/exec-approvals.json
```

Der standardmäßige Freigabe-Socket folgt demselben Stammverzeichnis:
`$OPENCLAW_STATE_DIR/exec-approvals.sock`, oder
`~/.openclaw/exec-approvals.sock`, wenn die Variable nicht gesetzt ist.

Zustandsverzeichnisse sind unabhängige Vertrauensbereiche. Wenn `OPENCLAW_STATE_DIR`
auf einen anderen Ort verweist, importiert oder archiviert OpenClaw niemals
`~/.openclaw/exec-approvals.json`; konfigurieren Sie Freigaben separat für das
benutzerdefinierte Zustandsverzeichnis. Doctor importiert außerdem die veraltete Datei
`plugin-binding-approvals.json` nur, wenn sie zum aktiven Zustandsverzeichnis
gehört.

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

## Richtlinienoptionen

### `tools.exec.mode`

`tools.exec.mode` ist die bevorzugte normalisierte Richtlinienoberfläche für die Host-Ausführung:

| Wert        | Verhalten                                                                                                                                                                            |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `deny`      | Host-Ausführung blockieren.                                                                                                                                                          |
| `allowlist` | Nur Befehle aus der Zulassungsliste ohne Rückfrage ausführen.                                                                                                                        |
| `ask`       | Zulassungslistenrichtlinie verwenden und bei fehlenden Übereinstimmungen nachfragen.                                                                                                 |
| `auto`      | Zulassungslistenrichtlinie verwenden, deterministische Übereinstimmungen direkt ausführen und fehlende Freigaben vor dem Rückfall auf einen menschlichen Freigabeweg an den nativen automatischen Reviewer von OpenClaw senden. |
| `full`      | Host-Ausführung ohne Freigabeaufforderungen ausführen.                                                                                                                               |

Doctor migriert das nicht mehr verwendete persistierte Paar `tools.exec.security` / `tools.exec.ask`
zu `tools.exec.mode`.

### `exec.security`

<ParamField path="security" type='"deny" | "allowlist" | "full"'>
  - `deny` – alle Anfragen zur Host-Ausführung blockieren.
  - `allowlist` – nur Befehle aus der Zulassungsliste zulassen.
  - `full` – alles zulassen (entspricht Elevated).

Der Standardwert ist `full` für Gateway-/Node-Hosts; ein `sandbox`-Host verwendet
stattdessen standardmäßig `deny`.
</ParamField>

### `exec.ask`

<ParamField path="ask" type='"off" | "on-miss" | "always"'>
  Konfigurierte Abfragerichtlinie für die Host-Ausführung. Steuert das grundlegende Verhalten der
  Freigabeaufforderungen aus `tools.exec.ask` und den Host-Freigabestandardwerten.
  Der Standardwert ist `off`. Der Werkzeugparameter `ask` pro Aufruf (siehe
  [Ausführungswerkzeug](/de/tools/exec#parameters)) kann diese Grundlage nur verschärfen, und
  vom Kanal stammende Modellaufrufe ignorieren ihn, wenn die wirksame Host-Abfrage `off` ist.

- `off` – niemals nachfragen.
- `on-miss` – nur nachfragen, wenn die Zulassungsliste nicht übereinstimmt.
- `always` – bei jedem Befehl nachfragen. Dauerhaftes Vertrauen durch `allow-always` unterdrückt Aufforderungen **nicht**, wenn der wirksame Abfragemodus `always` ist.

</ParamField>

### `askFallback`

<ParamField path="askFallback" type='"deny" | "allowlist" | "full"'>
  Auflösung, wenn eine Aufforderung erforderlich, aber keine UI erreichbar ist (oder die
  Aufforderung abläuft). Wenn nicht angegeben, ist der Standardwert `deny`.

- `deny` – blockieren.
- `allowlist` – nur zulassen, wenn die Zulassungsliste übereinstimmt.
- `full` – zulassen.

</ParamField>

### `tools.exec.strictInlineEval`

<ParamField path="strictInlineEval" type="boolean">
  Wenn `true`, werden Formen zur Inline-Codeauswertung selbst dann ausschließlich per Freigabe zugelassen, wenn die
  Interpreter-Binärdatei selbst in der Zulassungsliste enthalten ist. Mehrstufiger Schutz für
  Interpreter-Lader, die sich nicht eindeutig einem stabilen Dateioperanden zuordnen lassen.
</ParamField>

Beispiele, die der strenge Modus erfasst: `python -c`, `node -e`/`--eval`/`-p`,
`ruby -e`, `perl -e`/`-E`, `php -r`, `lua -e`, `osascript -e` (auch die Inline-Formen
`awk`, `sed`, `make`, `find -exec` und `xargs`).

Im strengen Modus benötigen diese Befehle eine Freigabe durch einen Reviewer oder eine ausdrückliche Freigabe. Mit
`tools.exec.mode: "auto"` kann der Reviewer eine einzelne risikoarme Ausführung genehmigen, wenn
der Befehl einen durchsetzbaren Plan besitzt; andernfalls fragt OpenClaw einen Menschen.
Befehlsfreigaben von `Codex app-server`, die den Reviewer-Rückfall erreichen, fragen einen
Menschen, da ihre Freigabeanfragen keine durchsetzbare aufgelöste
ausführbare Datei offenlegen.
`allow-always` speichert keine neuen Zulassungslisteneinträge für Inline-Auswertungsbefehle.

### `tools.exec.commandHighlighting`

<ParamField path="commandHighlighting" type="boolean" default="false">
  Nur Darstellung: Wenn aktiviert, kann OpenClaw vom Parser abgeleitete
  Befehlsspannen anhängen, damit Web-Freigabeaufforderungen Befehlstoken hervorheben können. Dies
  ändert **nicht** `security`, `ask`, den Abgleich mit der Zulassungsliste, das strenge Verhalten
  bei Inline-Auswertungen, die Weiterleitung von Freigaben oder die Befehlsausführung.
</ParamField>

Global unter `tools.exec.commandHighlighting` oder pro Agent unter
`agents.entries.*.tools.exec.commandHighlighting` festlegen.

## YOLO-Modus (ohne Freigabe)

Um Host-Ausführungen ohne Freigabeaufforderungen auszuführen, öffnen Sie **beide** Richtlinienebenen:
die angeforderte Ausführungsrichtlinie in der OpenClaw-Konfiguration (`tools.exec.*`) **und**
die hostlokale Freigaberichtlinie in der Freigabedatei des Ausführungshosts.

Ein ausgelassenes `askFallback` verwendet standardmäßig `deny`. Setzen Sie Host-`askFallback` ausdrücklich auf `full`,
wenn eine Freigabeaufforderung ohne UI ersatzweise zulassen soll.

| Ebene              | YOLO-Einstellung            |
| ------------------ | --------------------------- |
| `tools.exec.mode`  | `full` auf `gateway`/`node` |
| Host-`askFallback` | `full`                     |

<Warning>
**Wichtige Unterschiede:**

- `tools.exec.host=auto` legt fest, **wo** exec ausgeführt wird: wenn verfügbar in der Sandbox, andernfalls auf dem Gateway.
- YOLO legt fest, **wie** Host-exec genehmigt wird: `security=full` plus `ask=off`.
- YOLO fügt **kein** separates heuristisches Genehmigungstor für Befehlsverschleierung und keine Skript-Preflight-Ablehnungsebene zusätzlich zur konfigurierten Host-exec-Richtlinie hinzu.
- `auto` macht das Gateway-Routing nicht zu einer uneingeschränkt überschreibbaren Einstellung aus einer Sandbox-Sitzung heraus. Eine `host=node`-Anforderung pro Aufruf ist von `auto` aus zulässig; `host=gateway` ist von `auto` aus nur zulässig, wenn keine Sandbox-Laufzeit aktiv ist. Für einen stabilen, nicht automatischen Standardwert legen Sie `tools.exec.host` fest oder verwenden Sie ausdrücklich `/exec host=...`.

</Warning>

CLI-basierte Provider, die einen eigenen nicht interaktiven Berechtigungsmodus
bereitstellen, können dieser Richtlinie folgen. Die Claude CLI fügt
`--permission-mode bypassPermissions` hinzu, wenn die effektive exec-Richtlinie von OpenClaw
YOLO ist. Für von OpenClaw verwaltete Claude-Live-Sitzungen ist die
effektive exec-Richtlinie von OpenClaw gegenüber dem nativen Berechtigungsmodus von Claude maßgeblich:
YOLO normalisiert Live-Starts auf `--permission-mode bypassPermissions`, und
eine restriktive effektive exec-Richtlinie normalisiert Live-Starts auf
`--permission-mode default`, selbst wenn unverarbeitete Claude-Backend-Argumente einen anderen
Modus angeben.

Wenn Sie eine konservativere Einrichtung wünschen, verschärfen Sie die exec-Richtlinie von OpenClaw wieder auf
`allowlist` / `on-miss` oder `deny`.

### Dauerhafte „Nie nachfragen“-Einrichtung für den Gateway-Host

<Steps>
  <Step title="Angeforderte Konfigurationsrichtlinie festlegen">
    ```bash
    openclaw config set tools.exec.host gateway
    openclaw config set tools.exec.mode full
    openclaw gateway restart
    ```
  </Step>
  <Step title="Host-Genehmigungsdatei entsprechend anpassen">
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

Aktualisiert sowohl die lokale Einstellung `tools.exec.host/security/ask` als auch die Standardwerte der lokalen
Genehmigungsdatei (einschließlich `askFallback: "full"`). Dies gilt absichtlich
nur lokal. Verwenden Sie zum Ändern der Genehmigungen für Gateway-Hosts oder Node-Hosts aus der Ferne
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
**Einschränkungen bei rein lokaler Verwendung:**

- `openclaw exec-policy` synchronisiert keine Node-Genehmigungen.
- `openclaw exec-policy set --host node` wird abgelehnt.
- Node-exec-Genehmigungen werden zur Laufzeit vom Node abgerufen. Daher müssen Node-bezogene Aktualisierungen `openclaw approvals --node ...` verwenden.

</Note>

### Kurzform nur für die Sitzung

- `/exec security=full ask=off` ändert nur die aktuelle Sitzung.
- `/elevated full` ist eine Notfall-Kurzform, die exec-Genehmigungen nur dann überspringt,
  wenn sowohl die angeforderte Richtlinie als auch die Host-Genehmigungsdatei zu
  `security: "full"` und `ask: "off"` aufgelöst werden. Bei einer strengeren Host-Datei wie `ask:
"always"` wird weiterhin nachgefragt.

Wenn die Host-Genehmigungsdatei strenger als die Konfiguration bleibt, hat weiterhin die strengere
Host-Richtlinie Vorrang.

## Zulassungsliste (pro Agent)

Zulassungslisten gelten **pro Agent**. Wenn mehrere Agenten vorhanden sind, wechseln Sie in der
macOS-App zu dem Agenten, den Sie bearbeiten möchten. Die Muster werden als Globs abgeglichen.

Muster können Globs für aufgelöste Binärdateipfade oder Globs für reine Befehlsnamen sein.
Reine Namen stimmen nur mit Befehlen überein, die über `PATH` aufgerufen werden. Daher kann `rg`
mit `/opt/homebrew/bin/rg` übereinstimmen, wenn der Befehl `rg` lautet, jedoch **nicht** mit `./rg` oder
`/tmp/rg`. Verwenden Sie einen Pfad-Glob, um einem bestimmten Speicherort einer Binärdatei zu vertrauen.

Veraltete `agents.default`-Einträge werden beim Laden zu `agents.main` migriert.
Bei Shell-Ketten wie `echo ok && pwd` muss weiterhin jedes Segment der obersten Ebene
die Regeln der Zulassungsliste erfüllen.

Beispiele:

- `rg`
- `~/Projects/**/bin/peekaboo`
- `~/.local/bin/*`
- `/opt/homebrew/bin/rg`

### Argumente mit argPattern einschränken

Fügen Sie `argPattern` hinzu, wenn ein Eintrag der Zulassungsliste mit einer Binärdatei und einer
bestimmten Argumentstruktur übereinstimmen soll. OpenClaw verwendet auf jedem Host die Semantik regulärer
ECMAScript-Ausdrücke (JavaScript) und wertet den Ausdruck anhand
der analysierten Befehlsargumente ohne das ausführbare Token (`argv[0]`) aus.
Bei manuell erstellten Einträgen werden Argumente mit einem einzelnen Leerzeichen verbunden. Verankern Sie
daher das Muster, wenn eine exakte Übereinstimmung erforderlich ist.

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

Dieser Eintrag erlaubt `python3 safe.py`; `python3 other.py` stimmt nicht mit der Zulassungsliste
überein. Wenn außerdem ein reiner Pfadeintrag für dieselbe Binärdatei vorhanden ist, können nicht übereinstimmende
Argumente weiterhin auf diesen reinen Pfadeintrag zurückfallen. Lassen Sie den reinen Pfadeintrag
weg, wenn die Binärdatei auf die angegebenen Argumente beschränkt werden soll.

Durch Genehmigungsabläufe gespeicherte Einträge verwenden ein internes Trennzeichenformat für den exakten
argv-Abgleich. Erzeugen Sie diese Einträge vorzugsweise über die Benutzeroberfläche oder den Genehmigungsablauf neu,
statt den codierten Wert manuell zu bearbeiten. Wenn OpenClaw argv
für ein Befehlssegment nicht analysieren kann, stimmen Einträge mit `argPattern` nicht überein.

Jeder Eintrag der Zulassungsliste unterstützt:

| Feld               | Bedeutung                                            |
| ------------------ | ---------------------------------------------------- |
| `pattern`          | Glob für den aufgelösten Binärdateipfad oder reinen Befehlsnamen |
| `argPattern`       | Optionaler ECMAScript-regulärer Ausdruck für argv; ohne Angabe nur pfadbasiert |
| `id`               | Stabile undurchsichtige ID; wird bei Fehlen als UUID erzeugt |
| `source`           | Quelle des Eintrags, beispielsweise `allow-always`         |
| `commandText`      | Veraltete Klartexteingabe; wird beim Laden verworfen |
| `lastUsedAt`       | Zeitstempel der letzten Verwendung                  |
| `lastUsedCommand`  | Letzter übereinstimmender Befehl                     |
| `lastResolvedPath` | Zuletzt aufgelöster Binärdateipfad                   |

## Skill-CLIs automatisch zulassen

Wenn **Skill-CLIs automatisch zulassen** (`autoAllowSkills`) aktiviert ist, werden ausführbare Dateien,
auf die bekannte Skills verweisen, auf Nodes (macOS-Node
oder monitorloser Node-Host) als zugelassen behandelt. Hierfür wird `skills.bins` über den Gateway-RPC verwendet,
um die Liste der Skill-Binärdateien abzurufen. Deaktivieren Sie dies, wenn Sie ausschließlich manuelle
Zulassungslisten verwenden möchten.

<Warning>
- Dies ist eine **implizite komfortorientierte Zulassungsliste**, die von manuellen Pfadeinträgen der Zulassungsliste getrennt ist.
- Sie ist für vertrauenswürdige Betreiberumgebungen vorgesehen, in denen Gateway und Node derselben Vertrauensgrenze angehören.
- Wenn Sie strikt explizites Vertrauen benötigen, behalten Sie `autoAllowSkills: false` bei und verwenden Sie ausschließlich manuelle Pfadeinträge der Zulassungsliste.

</Warning>

## Sichere Binärdateien und Weiterleitung von Genehmigungen

Informationen zu sicheren Binärdateien (dem schnellen Pfad nur über stdin), Details zur Interpreterbindung und
zur Weiterleitung von Genehmigungsaufforderungen an Slack/Discord/Telegram (oder deren Ausführung als
native Genehmigungsclients) finden Sie unter
[Exec-Genehmigungen – erweitert](/de/tools/exec-approvals-advanced).

## Bearbeitung in der Control UI

Verwenden Sie die Karte **Control UI -> Nodes -> Exec-Genehmigungen**, um Standardwerte,
agentenspezifische Überschreibungen und Zulassungslisten zu bearbeiten. Wählen Sie einen Geltungsbereich (Standardwerte oder einen Agenten),
passen Sie die Richtlinie an, fügen Sie Muster der Zulassungsliste hinzu oder entfernen Sie sie und wählen Sie anschließend **Speichern**. Die Benutzeroberfläche
zeigt Metadaten zur letzten Verwendung für jedes Muster an, sodass Sie die Liste übersichtlich halten können.

Mit der Zielauswahl wählen Sie **Gateway** (lokale Genehmigungen) oder einen **Node**.
Nodes müssen `system.execApprovals.get/set` bekannt geben (macOS-App oder monitorloser
Node-Host). Wenn ein Node exec-Genehmigungen noch nicht bekannt gibt, bearbeiten Sie seine
lokale Genehmigungsdatei direkt.

Einige Node-Hosts, darunter die Windows-Begleitanwendung, verwenden ein anderes Format für
Genehmigungsrichtlinien. Die Control UI zeigt diese hostspezifischen Richtlinien schreibgeschützt an. Verwenden Sie die
Begleitanwendung oder `openclaw approvals set --node <id|name|ip>` mit dem nativen
Richtlinienformat, um sie zu bearbeiten; siehe [Genehmigungs-CLI](/de/cli/approvals).

CLI: `openclaw approvals` unterstützt die Bearbeitung von Gateways oder Nodes – siehe
[Genehmigungs-CLI](/de/cli/approvals).

## Genehmigungsablauf

Wenn eine Aufforderung erforderlich ist, sendet das Gateway
`exec.approval.requested` an die Betreiberclients. Die Control UI und die macOS-
App lösen sie über `exec.approval.resolve` auf. Anschließend leitet das Gateway die
genehmigte Anforderung an den Node-Host weiter.

Für `host=node` enthalten Genehmigungsanforderungen eine kanonische `systemRunPlan`-
Nutzlast. Das Gateway verwendet diesen Plan beim Weiterleiten genehmigter `system.run`-Anforderungen
als maßgeblichen Kontext für Befehl, cwd und Sitzung:

- Der Node-exec-Pfad erstellt im Voraus einen kanonischen Plan.
- Der Genehmigungsdatensatz speichert diesen Plan und seine Bindungsmetadaten.
- Nach der Genehmigung verwendet der abschließend weitergeleitete `system.run`-Aufruf den gespeicherten Plan erneut, statt späteren Änderungen durch den Aufrufer zu vertrauen.
- Wenn der Aufrufer `command`, `rawCommand`, `cwd`, `agentId` oder `sessionKey` ändert, nachdem die Genehmigungsanforderung erstellt wurde, lehnt das Gateway die weitergeleitete Ausführung wegen einer Genehmigungsabweichung ab.

## Systemereignisse und Ablehnungen

Der exec-Lebenszyklus veröffentlicht eine `Exec finished`-Systemnachricht in der
Sitzung des Agenten, nachdem der Node den Abschluss gemeldet hat. OpenClaw kann außerdem
eine Fortschrittsmeldung ausgeben, sobald eine Genehmigung erteilt wurde und
`tools.exec.approvalRunningNoticeMs` verstrichen ist (Standardwert `10000`; `0` deaktiviert
dies). Abgelehnte exec-Genehmigungen sind für den Host-Befehl endgültig: Der Befehl
wird nicht ausgeführt.

- Bei asynchronen Genehmigungen des Hauptagenten mit einer Ursprungssitzung veröffentlicht OpenClaw
  die Ablehnung als interne Folgemeldung in dieser Sitzung, damit der
  Agent nicht länger auf den asynchronen Befehl wartet und keine Reparatur
  wegen eines fehlenden Ergebnisses ausführt.
- Wenn keine Sitzung vorhanden ist oder die Sitzung nicht fortgesetzt werden kann, kann OpenClaw
  dem Betreiber oder dem direkten Chat-Ziel dennoch eine knappe Ablehnung melden.
- Ablehnungen für Subagenten- und Cron-Sitzungen werden nicht in dieser
  Sitzung veröffentlicht.

Exec-Genehmigungen des Gateway-Hosts geben dasselbe Abschlussereignis des Lebenszyklus aus.
Genehmigungspflichtige exec-Aufrufe verwenden die Genehmigungs-ID erneut, um die ausstehende
Anforderung mit ihrer Abschluss- oder Ablehnungsnachricht zu verknüpfen (`Exec finished (gateway
id=...)` / `Exec denied (gateway id=...)`).

## Auswirkungen

- **`full`** ist leistungsstark; verwenden Sie nach Möglichkeit Zulassungslisten.
- **`ask`** hält Sie auf dem Laufenden und ermöglicht dennoch schnelle Genehmigungen.
- Agentenspezifische Zulassungslisten verhindern, dass Genehmigungen eines Agenten auf andere übergreifen.
- Genehmigungen gelten nur für Host-exec-Anforderungen von **autorisierten Absendern**. Nicht autorisierte Absender können `/exec` nicht ausführen.
- `/exec security=full` ist eine Komfortfunktion auf Sitzungsebene für autorisierte Betreiber und überspringt Genehmigungen absichtlich. Um Host-exec vollständig zu blockieren, setzen Sie die Genehmigungssicherheit auf `deny` oder verweigern Sie das Tool `exec` über die Tool-Richtlinie.

## Verwandte Themen

<CardGroup cols={2}>
  <Card title="Exec-Genehmigungen – Erweitert" href="/de/tools/exec-approvals-advanced" icon="gear">
    Sichere Binärdateien, Interpreter-Bindung und Weiterleitung von Genehmigungen an den Chat.
  </Card>
  <Card title="Exec-Tool" href="/de/tools/exec" icon="terminal">
    Tool zur Ausführung von Shell-Befehlen.
  </Card>
  <Card title="Erweiterter Modus" href="/de/tools/elevated" icon="shield-exclamation">
    Notfallzugriff, der auch Genehmigungen überspringt.
  </Card>
  <Card title="Sandboxing" href="/de/gateway/sandboxing" icon="box">
    Sandbox-Modi und Arbeitsbereichszugriff.
  </Card>
  <Card title="Sicherheit" href="/de/gateway/security" icon="lock">
    Sicherheitsmodell und Härtung.
  </Card>
  <Card title="Sandbox vs. Tool-Richtlinie vs. erweiterter Modus" href="/de/gateway/sandbox-vs-tool-policy-vs-elevated" icon="sliders">
    Wann welches Steuerelement eingesetzt werden sollte.
  </Card>
  <Card title="Skills" href="/de/tools/skills" icon="sparkles">
    Durch Skills gestütztes Verhalten für automatische Genehmigungen.
  </Card>
</CardGroup>
