---
read_when:
    - Exec-Genehmigungen oder Allowlists konfigurieren
    - Implementierung der UX für Exec-Genehmigungen in der macOS-App
    - Überprüfung von Sandbox-Escape-Prompts und ihrer Auswirkungen
sidebarTitle: Exec approvals
summary: 'Host-Ausführungsgenehmigungen: Richtlinien-Schalter, Allowlists und der YOLO-/Strict-Workflow'
title: Ausführungsgenehmigungen
x-i18n:
    generated_at: "2026-06-27T18:17:48Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 44a4a5c9c56da458fdb25d5fe698df305af17188695d8befc1d4cfd8e8333e96
    source_path: tools/exec-approvals.md
    workflow: 16
---

Exec-Genehmigungen sind der **Schutzmechanismus der Companion-App / des Node-Hosts**, damit
ein sandboxed Agent Befehle auf einem echten Host (`gateway` oder `node`) ausführen kann. Eine
Sicherheitsverriegelung: Befehle sind nur erlaubt, wenn Policy + Allowlist +
(optionale) Benutzergenehmigung übereinstimmen. Exec-Genehmigungen liegen **zusätzlich zu**
Tool-Policy und Elevated-Gating (außer Elevated ist auf `full` gesetzt, wodurch
Genehmigungen übersprungen werden).

Eine modusorientierte Übersicht zu `deny`, `allowlist`, `ask`, `auto`, `full`,
Codex-Guardian-Zuordnung und ACPX-Harness-Berechtigungen finden Sie unter
[Berechtigungsmodi](/de/tools/permission-modes).

<Note>
Die wirksame Policy ist die **strengere** aus `tools.exec.*` und den
Genehmigungs-Defaults; wenn ein Genehmigungsfeld ausgelassen wird, wird der
`tools.exec`-Wert verwendet. Host-Exec verwendet außerdem den lokalen
Genehmigungsstatus auf dieser Maschine - ein hostlokales `ask: "always"` in der
Genehmigungsdatei des Ausführungshosts fragt weiter nach, selbst wenn Sitzung
oder Konfigurations-Defaults `ask: "on-miss"` anfordern.
</Note>

## Wirksame Policy prüfen

| Befehl                                                          | Was er zeigt                                                                          |
| ---------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `openclaw approvals get` / `--gateway` / `--node <id\|name\|ip>` | Angeforderte Policy, Host-Policy-Quellen und das wirksame Ergebnis.                       |
| `openclaw exec-policy show`                                      | Zusammengeführte Ansicht der lokalen Maschine.                                                             |
| `openclaw exec-policy set` / `preset`                            | Synchronisiert die lokal angeforderte Policy in einem Schritt mit der lokalen Host-Genehmigungsdatei. |

Wenn ein lokaler Scope `host=node` anfordert, meldet `exec-policy show` diesen
Scope zur Laufzeit als nodeverwaltet, statt vorzutäuschen, dass die lokale
Genehmigungsdatei die Quelle der Wahrheit ist.

Wenn die UI der Companion-App **nicht verfügbar** ist, wird jede Anfrage, die
normalerweise eine Nachfrage auslösen würde, über den **Ask-Fallback** aufgelöst
(Standard: `deny`).

<Tip>
Native Chat-Genehmigungsclients können kanalspezifische Bedienmöglichkeiten in
der ausstehenden Genehmigungsnachricht vorbereiten. Matrix legt zum Beispiel
Reaktionskürzel an (`✅` einmal erlauben, `❌` ablehnen, `♾️` immer erlauben),
während `/approve ...`-Befehle in der Nachricht als Fallback erhalten bleiben.
</Tip>

## Geltungsbereich

Exec-Genehmigungen werden lokal auf dem Ausführungshost erzwungen:

- **Gateway-Host** → `openclaw`-Prozess auf der Gateway-Maschine.
- **Node-Host** → Node-Runner (macOS-Companion-App oder headless Node-Host).

### Vertrauensmodell

- Gateway-authentifizierte Aufrufer sind vertrauenswürdige Operatoren für dieses Gateway.
- Gekoppelte Nodes erweitern diese vertrauenswürdige Operator-Fähigkeit auf den Node-Host.
- Exec-Genehmigungen reduzieren das Risiko versehentlicher Ausführung, sind aber **keine** Authentifizierungsgrenze pro Benutzer oder reine Lesepolicy für das Dateisystem.
- Nach der Genehmigung kann ein Befehl Dateien gemäß den ausgewählten Host- oder Sandbox-Dateisystemberechtigungen verändern.
- Genehmigte Node-Host-Ausführungen binden den kanonischen Ausführungskontext: kanonisches cwd, exaktes argv, Env-Bindung, wenn vorhanden, und angehefteten ausführbaren Pfad, falls zutreffend.
- Für Shell-Skripte und direkte Datei-Aufrufe von Interpretern/Runtimes versucht OpenClaw außerdem, einen konkreten lokalen Dateioperanden zu binden. Wenn sich diese gebundene Datei nach der Genehmigung, aber vor der Ausführung ändert, wird die Ausführung abgelehnt, statt veränderten Inhalt auszuführen.
- Dateibindung ist absichtlich Best-Effort, **kein** vollständiges semantisches Modell jedes Interpreter-/Runtime-Loader-Pfads. Wenn der Genehmigungsmodus nicht genau eine konkrete lokale Datei zur Bindung identifizieren kann, verweigert er das Ausstellen einer genehmigungsgestützten Ausführung, statt vollständige Abdeckung vorzutäuschen.

### macOS-Aufteilung

- Der **Node-Host-Dienst** leitet `system.run` über lokales IPC an die **macOS-App** weiter.
- Die **macOS-App** erzwingt Genehmigungen und führt den Befehl im UI-Kontext aus.

## Einstellungen und Speicherung

Genehmigungen liegen in einer lokalen JSON-Datei auf dem Ausführungshost. Wenn
`OPENCLAW_STATE_DIR` gesetzt ist, folgt die Datei diesem Statusverzeichnis;
andernfalls verwendet sie das Standard-Statusverzeichnis von OpenClaw:

```text
$OPENCLAW_STATE_DIR/exec-approvals.json
# otherwise
~/.openclaw/exec-approvals.json
```

Der Standard-Genehmigungssocket folgt demselben Root:
`$OPENCLAW_STATE_DIR/exec-approvals.sock` oder
`~/.openclaw/exec-approvals.sock`, wenn die Variable nicht gesetzt ist.

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
          "commandText": "rg -n TODO",
          "lastUsedAt": 1737150000000,
          "lastUsedCommand": "rg -n TODO",
          "lastResolvedPath": "/Users/user/Projects/.../bin/rg"
        }
      ]
    }
  }
}
```

## Policy-Stellschrauben

### `tools.exec.mode`

`tools.exec.mode` ist die bevorzugte normalisierte Policy-Oberfläche für Host-Exec.
Werte sind:

- `deny` - Host-Exec blockieren.
- `allowlist` - nur Allowlist-Befehle ohne Nachfrage ausführen.
- `ask` - Allowlist-Policy verwenden und bei Treffern ohne Übereinstimmung nachfragen.
- `auto` - Allowlist-Policy verwenden, deterministische Treffer direkt ausführen und Genehmigungsfehlschläge durch den nativen Auto-Reviewer von OpenClaw senden, bevor auf eine menschliche Genehmigungsroute zurückgefallen wird.
- `full` - Host-Exec ohne Genehmigungsabfragen ausführen.

Legacy `tools.exec.security` / `tools.exec.ask` bleiben unterstützt und haben weiterhin Vorrang,
wenn sie im engeren Sitzungs- oder Agent-Scope gesetzt sind.

### `exec.security`

<ParamField path="security" type='"deny" | "allowlist" | "full"'>
  - `deny` - alle Host-Exec-Anfragen blockieren.
  - `allowlist` - nur Allowlist-Befehle erlauben.
  - `full` - alles erlauben (entspricht Elevated).

</ParamField>

### `exec.ask`

<ParamField path="ask" type='"off" | "on-miss" | "always"'>
  Konfigurierte Ask-Policy für Host-Exec. Steuert das grundlegende Verhalten
  von Genehmigungsabfragen aus `tools.exec.ask` und Host-Genehmigungs-Defaults. Der
  pro Aufruf gesetzte Tool-Parameter `ask` (siehe [Exec-Tool](/de/tools/exec#parameters))
  kann diese Grundlage nur verschärfen, und modellseitige Aufrufe aus Kanälen ignorieren ihn,
  wenn das wirksame Host-Ask `off` ist.

- `off` - nie nachfragen.
- `on-miss` - nur nachfragen, wenn die Allowlist nicht passt.
- `always` - bei jedem Befehl nachfragen. Dauerhaftes Vertrauen durch `allow-always` unterdrückt Abfragen **nicht**, wenn der wirksame Ask-Modus `always` ist.

</ParamField>

### `askFallback`

<ParamField path="askFallback" type='"deny" | "allowlist" | "full"'>
  Auflösung, wenn eine Abfrage erforderlich ist, aber keine UI erreichbar ist. Wenn dieses
  Feld ausgelassen wird, verwendet OpenClaw standardmäßig `deny`.

- `deny` - blockieren.
- `allowlist` - nur erlauben, wenn die Allowlist passt.
- `full` - erlauben.

</ParamField>

### `tools.exec.strictInlineEval`

<ParamField path="strictInlineEval" type="boolean">
  Wenn `true`, behandelt OpenClaw Inline-Code-Eval-Formen als nur per Genehmigung erlaubt,
  selbst wenn das Interpreter-Binary selbst auf der Allowlist steht. Defense-in-Depth
  für Interpreter-Loader, die sich nicht sauber auf einen stabilen Dateioperanden
  abbilden lassen.
</ParamField>

Beispiele, die der strikte Modus abfängt:

- `python -c`
- `node -e`, `node --eval`, `node -p`
- `ruby -e`
- `perl -e`, `perl -E`
- `php -r`
- `lua -e`
- `osascript -e`

Im strikten Modus benötigen diese Befehle weiterhin ausdrückliche Genehmigung, und
`allow-always` speichert für sie nicht automatisch neue Allowlist-Einträge.

### `tools.exec.commandHighlighting`

<ParamField path="commandHighlighting" type="boolean" default="false">
  Steuert nur die Darstellung in Exec-Genehmigungsabfragen. Wenn aktiviert,
  kann OpenClaw parserabgeleitete Befehlsspannen anhängen, damit Web-Genehmigungsabfragen
  Befehlstoken hervorheben können. Setzen Sie es auf `true`, um
  Befehlstext-Hervorhebung zu aktivieren.
</ParamField>

Diese Einstellung ändert **nicht** `security`, `ask`, Allowlist-Abgleich,
striktes Inline-Eval-Verhalten, Genehmigungsweiterleitung oder Befehlsausführung.
Sie kann global unter `tools.exec.commandHighlighting` oder pro
Agent unter `agents.list[].tools.exec.commandHighlighting` gesetzt werden.

## YOLO-Modus (ohne Genehmigung)

Wenn Host-Exec ohne Genehmigungsabfragen ausgeführt werden soll, müssen Sie
**beide** Policy-Ebenen öffnen - angeforderte Exec-Policy in der OpenClaw-Konfiguration
(`tools.exec.*`) **und** hostlokale Genehmigungs-Policy in
der Genehmigungsdatei des Ausführungshosts.

OpenClaw setzt ausgelassenes `askFallback` standardmäßig auf `deny`. Setzen Sie hostseitig
`askFallback` ausdrücklich auf `full`, wenn eine No-UI-Genehmigungsabfrage
auf Erlauben zurückfallen soll.

| Ebene                 | YOLO-Einstellung               |
| --------------------- | -------------------------- |
| `tools.exec.security` | `full` auf `gateway`/`node` |
| `tools.exec.ask`      | `off`                      |
| Host `askFallback`    | `full`                     |

<Warning>
**Wichtige Unterscheidungen:**

- `tools.exec.host=auto` wählt, **wo** Exec läuft: Sandbox, wenn verfügbar, andernfalls Gateway.
- YOLO wählt, **wie** Host-Exec genehmigt wird: `security=full` plus `ask=off`.
- Im YOLO-Modus fügt OpenClaw **kein** separates heuristisches Genehmigungsgate für Befehlsverschleierung oder eine Skript-Preflight-Ablehnungsebene zusätzlich zur konfigurierten Host-Exec-Policy hinzu.
- `auto` macht Gateway-Routing nicht zu einer freien Override-Möglichkeit aus einer sandboxed Sitzung. Eine pro Aufruf gesetzte `host=node`-Anfrage ist aus `auto` erlaubt; `host=gateway` ist aus `auto` nur erlaubt, wenn keine Sandbox-Runtime aktiv ist. Für einen stabilen nichtautomatischen Default setzen Sie `tools.exec.host` oder verwenden Sie ausdrücklich `/exec host=...`.

</Warning>

CLI-gestützte Provider, die einen eigenen nichtinteraktiven Berechtigungsmodus
bereitstellen, können dieser Policy folgen. Claude CLI fügt
`--permission-mode bypassPermissions` hinzu, wenn die wirksame Exec-Policy von OpenClaw
YOLO ist. Für von OpenClaw verwaltete Claude-Live-Sitzungen ist die
wirksame Exec-Policy von OpenClaw maßgeblich gegenüber dem nativen Berechtigungsmodus von Claude:
YOLO normalisiert Live-Starts auf `--permission-mode bypassPermissions`, und
eine restriktive wirksame Exec-Policy normalisiert Live-Starts auf
`--permission-mode default`, selbst wenn rohe Claude-Backend-Argumente einen anderen
Modus angeben.

Wenn Sie eine konservativere Einrichtung möchten, verschärfen Sie die OpenClaw-Exec-Policy wieder auf
`allowlist` / `on-miss` oder `deny`.

### Persistente Gateway-Host-Einrichtung "nie nachfragen"

<Steps>
  <Step title="Angeforderte Konfigurations-Policy setzen">
    ```bash
    openclaw config set tools.exec.host gateway
    openclaw config set tools.exec.security full
    openclaw config set tools.exec.ask off
    openclaw gateway restart
    ```
  </Step>
  <Step title="Host-Genehmigungsdatei abgleichen">
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

### Lokale Abkürzung

```bash
openclaw exec-policy preset yolo
```

Diese lokale Abkürzung aktualisiert beides:

- Lokales `tools.exec.host/security/ask`.
- Lokale Defaults der Genehmigungsdatei, einschließlich `askFallback: "full"`.

Sie ist absichtlich nur lokal. Um Gateway-Host- oder Node-Host-Genehmigungen
remote zu ändern, verwenden Sie `openclaw approvals set --gateway` oder
`openclaw approvals set --node <id|name|ip>`.

### Node-Host

Für einen Node-Host wenden Sie stattdessen dieselbe Genehmigungsdatei auf diesem Node an:

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
**Nur-lokal-Einschränkungen:**

- `openclaw exec-policy` synchronisiert keine Node-Genehmigungen.
- `openclaw exec-policy set --host node` wird abgelehnt.
- Node-Exec-Genehmigungen werden zur Laufzeit vom Node abgerufen, daher müssen Node-gezielte Updates `openclaw approvals --node ...` verwenden.

</Note>

### Nur-Sitzung-Abkürzung

- `/exec security=full ask=off` ändert nur die aktuelle Sitzung.
- `/elevated full` ist eine Break-Glass-Abkürzung, die Exec-Genehmigungen nur überspringt, wenn
  sowohl die angeforderte Policy als auch die Host-Genehmigungsdatei zu
  `security: "full"` und `ask: "off"` aufgelöst werden. Eine strengere Host-Datei, etwa
  `ask: "always"`, fragt weiterhin nach.

Wenn die Host-Genehmigungsdatei strenger bleibt als die Konfiguration, gewinnt
weiterhin die strengere Host-Policy.

## Zulassungsliste (pro Agent)

Zulassungslisten gelten **pro Agent**. Wenn mehrere Agents vorhanden sind, wechseln Sie
in der macOS-App den Agent, den Sie bearbeiten. Muster sind Glob-Übereinstimmungen.

Muster können aufgelöste Binärpfad-Globs oder reine Befehlsnamen-Globs sein.
Reine Namen stimmen nur mit Befehlen überein, die über `PATH` aufgerufen werden. Daher kann `rg`
mit `/opt/homebrew/bin/rg` übereinstimmen, wenn der Befehl `rg` lautet, aber **nicht** mit `./rg` oder
`/tmp/rg`. Verwenden Sie einen Pfad-Glob, wenn Sie einem bestimmten Speicherort einer Binärdatei
vertrauen möchten.

Legacy-Einträge unter `agents.default` werden beim Laden zu `agents.main` migriert.
Shell-Ketten wie `echo ok && pwd` benötigen weiterhin, dass jedes Segment der obersten Ebene
die Regeln der Zulassungsliste erfüllt.

Beispiele:

- `rg`
- `~/Projects/**/bin/peekaboo`
- `~/.local/bin/*`
- `/opt/homebrew/bin/rg`

### Argumente mit argPattern einschränken

Fügen Sie `argPattern` hinzu, wenn ein Eintrag in der Zulassungsliste zu einer Binärdatei und einer
bestimmten Argumentform passen soll. OpenClaw wertet den regulären Ausdruck
gegen die geparsten Befehlsargumente aus, ohne das ausführbare Token
(`argv[0]`). Bei manuell erstellten Einträgen werden Argumente mit einem
einzelnen Leerzeichen verbunden. Verankern Sie das Muster daher, wenn Sie eine exakte Übereinstimmung benötigen.

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

Dieser Eintrag erlaubt `python3 safe.py`; `python3 other.py` ist ein Fehlschlag der Zulassungsliste.
Wenn auch ein reiner Pfad-Eintrag für dieselbe Binärdatei vorhanden ist, können nicht übereinstimmende
Argumente weiterhin auf diesen reinen Pfad-Eintrag zurückfallen. Lassen Sie den reinen Pfad-Eintrag weg,
wenn das Ziel darin besteht, die Binärdatei auf die deklarierten Argumente zu beschränken.

Einträge, die durch Genehmigungsabläufe gespeichert wurden, können ein internes Trennzeichenformat für
exakte argv-Übereinstimmung verwenden. Verwenden Sie vorzugsweise die UI oder den Genehmigungsablauf, um diese
Einträge neu zu erzeugen, statt den codierten Wert manuell zu bearbeiten. Wenn OpenClaw
argv für ein Befehlssegment nicht parsen kann, stimmen Einträge mit `argPattern` nicht überein.

Jeder Eintrag in der Zulassungsliste unterstützt:

| Feld               | Bedeutung                                                     |
| ------------------ | ------------------------------------------------------------- |
| `pattern`          | Aufgelöster Binärpfad-Glob oder reiner Befehlsnamen-Glob      |
| `argPattern`       | Optionale argv-Regex; ausgelassene Einträge sind rein pfadbasiert |
| `id`               | Stabile UUID für UI-Identität                                 |
| `source`           | Eintragsquelle, etwa `allow-always`                           |
| `commandText`      | Befehlstext, der erfasst wurde, als ein Genehmigungsablauf den Eintrag erstellt hat |
| `lastUsedAt`       | Zeitstempel der letzten Verwendung                            |
| `lastUsedCommand`  | Letzter Befehl, der übereinstimmte                            |
| `lastResolvedPath` | Zuletzt aufgelöster Binärpfad                                 |

## Skill-CLIs automatisch zulassen

Wenn **Skill-CLIs automatisch zulassen** aktiviert ist, werden ausführbare Dateien, auf die
bekannte Skills verweisen, auf Knoten (macOS-Knoten oder Headless-Node-Host)
als zugelassen behandelt. Dies verwendet `skills.bins` über die Gateway-RPC, um die
Skill-Binärliste abzurufen. Deaktivieren Sie dies, wenn Sie streng manuelle Zulassungslisten wünschen.

<Warning>
- Dies ist eine **implizite Komfort-Zulassungsliste**, getrennt von manuellen Pfad-Einträgen der Zulassungsliste.
- Sie ist für vertrauenswürdige Operator-Umgebungen gedacht, in denen Gateway und Knoten innerhalb derselben Vertrauensgrenze liegen.
- Wenn Sie streng explizites Vertrauen benötigen, behalten Sie `autoAllowSkills: false` bei und verwenden Sie nur manuelle Pfad-Einträge der Zulassungsliste.

</Warning>

## Sichere Binärdateien und Genehmigungsweiterleitung

Für sichere Binärdateien (den Nur-stdin-Schnellpfad), Details zur Interpreter-Bindung und
Informationen dazu, wie Genehmigungsaufforderungen an Slack/Discord/Telegram weitergeleitet werden (oder wie sie als
native Genehmigungsclients ausgeführt werden), siehe
[Exec-Genehmigungen - erweitert](/de/tools/exec-approvals-advanced).

## Bearbeitung in der Control UI

Verwenden Sie die Karte **Control UI → Knoten → Exec-Genehmigungen**, um Standards,
Überschreibungen pro Agent und Zulassungslisten zu bearbeiten. Wählen Sie einen Geltungsbereich (Standards oder einen Agent),
passen Sie die Policy an, fügen Sie Muster zur Zulassungsliste hinzu oder entfernen Sie sie, und klicken Sie dann auf **Speichern**. Die UI
zeigt Metadaten zur letzten Verwendung pro Muster, damit Sie die Liste übersichtlich halten können.

Der Zielauswahlschalter wählt **Gateway** (lokale Genehmigungen) oder einen **Knoten**.
Knoten müssen `system.execApprovals.get/set` ankündigen (macOS-App oder
Headless-Node-Host). Wenn ein Knoten Exec-Genehmigungen noch nicht ankündigt,
bearbeiten Sie seine lokale Genehmigungsdatei direkt.

CLI: `openclaw approvals` unterstützt die Bearbeitung von Gateway oder Knoten - siehe
[Genehmigungs-CLI](/de/cli/approvals).

## Genehmigungsablauf

Wenn eine Aufforderung erforderlich ist, sendet das Gateway
`exec.approval.requested` an Operator-Clients. Die Control UI und die macOS-App
lösen sie über `exec.approval.resolve` auf, danach leitet das Gateway die
genehmigte Anfrage an den Node-Host weiter.

Für `host=node` enthalten Genehmigungsanfragen eine kanonische `systemRunPlan`-Payload.
Das Gateway verwendet diesen Plan als maßgeblichen
Befehl-/cwd-/Sitzungskontext, wenn genehmigte `system.run`-
Anfragen weitergeleitet werden.

Das ist für asynchrone Genehmigungslatenz wichtig:

- Der Node-Exec-Pfad bereitet im Voraus einen kanonischen Plan vor.
- Der Genehmigungsdatensatz speichert diesen Plan und seine Bindungsmetadaten.
- Nach der Genehmigung verwendet der abschließend weitergeleitete `system.run`-Aufruf den gespeicherten Plan wieder, statt späteren Bearbeitungen des Aufrufers zu vertrauen.
- Wenn der Aufrufer `command`, `rawCommand`, `cwd`, `agentId` oder `sessionKey` ändert, nachdem die Genehmigungsanfrage erstellt wurde, lehnt das Gateway den weitergeleiteten Lauf als Genehmigungsabweichung ab.

## Systemereignisse

Der Exec-Lebenszyklus wird als Systemmeldungen sichtbar gemacht:

- `Exec running` (nur wenn der Befehl den Schwellenwert für den Laufhinweis überschreitet).
- `Exec finished`.

Diese werden in der Sitzung des Agents gepostet, nachdem der Knoten das Ereignis gemeldet hat.
Abgelehnte Exec-Genehmigungen sind für den Host-Befehl selbst terminal: Der Befehl
wird nicht ausgeführt. Bei asynchronen Genehmigungen des Haupt-Agents mit einer Ursprungssitzung
postet OpenClaw die Ablehnung als internes Follow-up zurück in diese Sitzung, damit der
Agent nicht länger auf den asynchronen Befehl wartet und eine Reparatur wegen fehlendem Ergebnis vermeidet.
Wenn keine Sitzung vorhanden ist oder die Sitzung nicht fortgesetzt werden kann, kann OpenClaw weiterhin
eine knappe Ablehnung an den Operator oder die direkte Chat-Route melden. Ablehnungen für
Subagent-Sitzungen werden nicht zurück in den Subagent gepostet.
Gateway-Host-Exec-Genehmigungen geben dieselben Lebenszyklusereignisse aus, wenn der
Befehl beendet ist (und optional, wenn er länger als der Schwellenwert läuft).
Genehmigungspflichtige Execs verwenden die Genehmigungs-ID in diesen
Meldungen als `runId` wieder, damit sie leicht korreliert werden können.

## Verhalten bei abgelehnter Genehmigung

Wenn eine asynchrone Exec-Genehmigung abgelehnt wird, behandelt OpenClaw den Host-Befehl als
terminal und fail-closed. Für Haupt-Agent-Sitzungen wird die Ablehnung als
internes Sitzungs-Follow-up zugestellt, das dem Agent mitteilt, dass der asynchrone Befehl nicht ausgeführt wurde.
Das erhält die Kontinuität des Transkripts, ohne veraltete Befehlsausgabe offenzulegen. Wenn
die Sitzungszustellung nicht verfügbar ist, fällt OpenClaw auf eine knappe Operator- oder
Direktchat-Ablehnung zurück, sofern eine sichere Route vorhanden ist.

## Auswirkungen

- **`full`** ist mächtig; bevorzugen Sie nach Möglichkeit Zulassungslisten.
- **`ask`** hält Sie eingebunden und ermöglicht dennoch schnelle Genehmigungen.
- Zulassungslisten pro Agent verhindern, dass Genehmigungen eines Agents auf andere übergreifen.
- Genehmigungen gelten nur für Host-Exec-Anfragen von **autorisierten Absendern**. Nicht autorisierte Absender können `/exec` nicht ausgeben.
- `/exec security=full` ist eine Komfortfunktion auf Sitzungsebene für autorisierte Operatoren und überspringt Genehmigungen absichtlich. Um Host-Exec hart zu blockieren, setzen Sie die Genehmigungssicherheit auf `deny` oder verweigern Sie das Tool `exec` über die Tool-Policy.

## Verwandte Themen

<CardGroup cols={2}>
  <Card title="Exec approvals - advanced" href="/de/tools/exec-approvals-advanced" icon="gear">
    Sichere Binärdateien, Interpreter-Bindung und Genehmigungsweiterleitung an Chat.
  </Card>
  <Card title="Exec tool" href="/de/tools/exec" icon="terminal">
    Tool zur Ausführung von Shell-Befehlen.
  </Card>
  <Card title="Elevated mode" href="/de/tools/elevated" icon="shield-exclamation">
    Break-Glass-Pfad, der ebenfalls Genehmigungen überspringt.
  </Card>
  <Card title="Sandboxing" href="/de/gateway/sandboxing" icon="box">
    Sandbox-Modi und Workspace-Zugriff.
  </Card>
  <Card title="Security" href="/de/gateway/security" icon="lock">
    Sicherheitsmodell und Härtung.
  </Card>
  <Card title="Sandbox vs tool policy vs elevated" href="/de/gateway/sandbox-vs-tool-policy-vs-elevated" icon="sliders">
    Wann Sie welches Steuerungsmittel verwenden sollten.
  </Card>
  <Card title="Skills" href="/de/tools/skills" icon="sparkles">
    Skill-gestütztes Verhalten für automatisches Zulassen.
  </Card>
</CardGroup>
