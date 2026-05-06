---
read_when:
    - Exec-Genehmigungen oder Allowlists konfigurieren
    - Implementierung der exec-Genehmigungs-UX in der macOS-App
    - Überprüfung von Sandbox-Escape-Prompts und ihren Auswirkungen
sidebarTitle: Exec approvals
summary: 'Host-Exec-Genehmigungen: Richtlinienoptionen, Positivlisten und der YOLO-/strikt-Workflow'
title: Ausführungsgenehmigungen
x-i18n:
    generated_at: "2026-05-06T07:05:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: c404fbc80624e31603cfc3f9ca6318534d53e0277af107600c726f97e11b223b
    source_path: tools/exec-approvals.md
    workflow: 16
---

Exec-Genehmigungen sind die **Schutzschiene der Companion App / des Node-Hosts**, damit
ein sandboxed Agent Befehle auf einem echten Host (`gateway` oder `node`) ausführen kann. Eine
Sicherheitsverriegelung: Befehle sind nur erlaubt, wenn Richtlinie + Allowlist +
(optionale) Benutzergenehmigung übereinstimmen. Exec-Genehmigungen liegen **zusätzlich zu**
Tool-Richtlinie und Elevated-Gating vor (außer Elevated ist auf `full` gesetzt, wodurch
Genehmigungen übersprungen werden).

<Note>
Die wirksame Richtlinie ist die **strengere** aus `tools.exec.*` und den
Genehmigungs-Standardwerten; wenn ein Genehmigungsfeld ausgelassen wird, wird der
`tools.exec`-Wert verwendet. Host-Exec verwendet außerdem den lokalen Genehmigungsstatus
auf dieser Maschine - ein hostlokales `ask: "always"` in
`~/.openclaw/exec-approvals.json` fragt weiterhin nach, selbst wenn Sitzungs- oder
Konfigurations-Standardwerte `ask: "on-miss"` anfordern.
</Note>

## Wirksame Richtlinie prüfen

| Befehl                                                           | Was er anzeigt                                                                         |
| ---------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `openclaw approvals get` / `--gateway` / `--node <id\|name\|ip>` | Angeforderte Richtlinie, Host-Richtlinienquellen und das wirksame Ergebnis.            |
| `openclaw exec-policy show`                                      | Zusammengeführte Ansicht der lokalen Maschine.                                         |
| `openclaw exec-policy set` / `preset`                            | Synchronisiert die lokal angeforderte Richtlinie in einem Schritt mit der lokalen Host-Genehmigungsdatei. |

Wenn ein lokaler Scope `host=node` anfordert, meldet `exec-policy show` diesen
Scope zur Laufzeit als nodeverwaltet, statt so zu tun, als wäre die lokale
Genehmigungsdatei die Source of Truth.

Wenn die UI der Companion App **nicht verfügbar** ist, wird jede Anfrage, die
normalerweise eine Nachfrage auslösen würde, durch den **Ask-Fallback** aufgelöst
(Standard: `deny`).

<Tip>
Native Chat-Genehmigungsclients können kanalspezifische Interaktionen in der
ausstehenden Genehmigungsnachricht vorbereiten. Matrix setzt beispielsweise
Reaktions-Shortcuts (`✅` einmal erlauben, `❌` ablehnen, `♾️` immer erlauben),
während `/approve ...`-Befehle weiterhin als Fallback in der Nachricht bleiben.
</Tip>

## Wo es gilt

Exec-Genehmigungen werden lokal auf dem Ausführungs-Host erzwungen:

- **Gateway-Host** → `openclaw`-Prozess auf der Gateway-Maschine.
- **Node-Host** → Node-Runner (macOS-Companion-App oder headless Node-Host).

### Vertrauensmodell

- Gateway-authentifizierte Aufrufer sind vertrauenswürdige Operatoren für dieses Gateway.
- Gekoppelte Nodes erweitern diese vertrauenswürdige Operator-Fähigkeit auf den Node-Host.
- Exec-Genehmigungen reduzieren das Risiko versehentlicher Ausführung, sind aber **keine** Auth-Grenze pro Benutzer.
- Genehmigte Node-Host-Ausführungen binden den kanonischen Ausführungskontext: kanonisches cwd, exaktes argv, env-Bindung, sofern vorhanden, und gepinnter ausführbarer Pfad, sofern zutreffend.
- Für Shell-Skripte und direkte Datei-Aufrufe von Interpretern/Runtimes versucht OpenClaw außerdem, einen konkreten lokalen Dateioperanden zu binden. Wenn sich diese gebundene Datei nach der Genehmigung, aber vor der Ausführung ändert, wird die Ausführung verweigert, statt veränderten Inhalt auszuführen.
- Dateibindung ist bewusst Best Effort und **kein** vollständiges semantisches Modell jedes Interpreter-/Runtime-Loader-Pfads. Wenn der Genehmigungsmodus nicht genau eine konkrete lokale Datei zum Binden identifizieren kann, verweigert er die Ausstellung einer genehmigungsgestützten Ausführung, statt vollständige Abdeckung vorzutäuschen.

### macOS-Aufteilung

- Der **Node-Hostdienst** leitet `system.run` per lokalem IPC an die **macOS-App** weiter.
- Die **macOS-App** erzwingt Genehmigungen und führt den Befehl im UI-Kontext aus.

## Einstellungen und Speicherung

Genehmigungen liegen in einer lokalen JSON-Datei auf dem Ausführungs-Host:

```text
~/.openclaw/exec-approvals.json
```

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

## Richtlinienoptionen

### `exec.security`

<ParamField path="security" type='"deny" | "allowlist" | "full"'>
  - `deny` - alle Host-Exec-Anfragen blockieren.
  - `allowlist` - nur Befehle erlauben, die in der Allowlist stehen.
  - `full` - alles erlauben (entspricht Elevated).

</ParamField>

### `exec.ask`

<ParamField path="ask" type='"off" | "on-miss" | "always"'>
  - `off` - nie nachfragen.
  - `on-miss` - nur nachfragen, wenn die Allowlist nicht passt.
  - `always` - bei jedem Befehl nachfragen. Dauerhaftes Vertrauen durch `allow-always` unterdrückt Nachfragen **nicht**, wenn der wirksame Ask-Modus `always` ist.

</ParamField>

### `askFallback`

<ParamField path="askFallback" type='"deny" | "allowlist" | "full"'>
  Auflösung, wenn eine Nachfrage erforderlich ist, aber keine UI erreichbar ist.

- `deny` - blockieren.
- `allowlist` - nur erlauben, wenn die Allowlist passt.
- `full` - erlauben.

</ParamField>

### `tools.exec.strictInlineEval`

<ParamField path="strictInlineEval" type="boolean">
  Wenn `true`, behandelt OpenClaw Inline-Code-Eval-Formen als nur per Genehmigung ausführbar,
  selbst wenn die Interpreter-Binärdatei selbst in der Allowlist steht. Defense-in-depth
  für Interpreter-Loader, die sich nicht sauber auf einen stabilen Dateioperanden
  abbilden lassen.
</ParamField>

Beispiele, die der Strict-Modus abfängt:

- `python -c`
- `node -e`, `node --eval`, `node -p`
- `ruby -e`
- `perl -e`, `perl -E`
- `php -r`
- `lua -e`
- `osascript -e`

Im Strict-Modus benötigen diese Befehle weiterhin eine ausdrückliche Genehmigung, und
`allow-always` speichert für sie nicht automatisch neue Allowlist-Einträge dauerhaft.

## YOLO-Modus (keine Genehmigung)

Wenn Host-Exec ohne Genehmigungsnachfragen ausgeführt werden soll, müssen Sie
**beide** Richtlinienebenen öffnen - die angeforderte Exec-Richtlinie in der
OpenClaw-Konfiguration (`tools.exec.*`) **und** die hostlokale Genehmigungsrichtlinie in
`~/.openclaw/exec-approvals.json`.

YOLO ist das Standardverhalten des Hosts, sofern Sie es nicht ausdrücklich verschärfen:

| Ebene                 | YOLO-Einstellung          |
| --------------------- | ------------------------- |
| `tools.exec.security` | `full` auf `gateway`/`node` |
| `tools.exec.ask`      | `off`                     |
| Host `askFallback`    | `full`                    |

<Warning>
**Wichtige Unterscheidungen:**

- `tools.exec.host=auto` wählt aus, **wo** Exec läuft: in der Sandbox, sofern verfügbar, andernfalls auf dem Gateway.
- YOLO wählt aus, **wie** Host-Exec genehmigt wird: `security=full` plus `ask=off`.
- Im YOLO-Modus fügt OpenClaw **kein** separates heuristisches Genehmigungs-Gate für Befehlsverschleierung und keine Skript-Preflight-Ablehnungsschicht oberhalb der konfigurierten Host-Exec-Richtlinie hinzu.
- `auto` macht Gateway-Routing nicht zu einer freien Umgehung aus einer sandboxed Sitzung heraus. Eine pro Aufruf gesetzte Anfrage `host=node` ist von `auto` aus erlaubt; `host=gateway` ist von `auto` nur erlaubt, wenn keine Sandbox-Runtime aktiv ist. Für einen stabilen Nicht-`auto`-Standard setzen Sie `tools.exec.host` oder verwenden Sie explizit `/exec host=...`.

</Warning>

CLI-gestützte Provider, die ihren eigenen nichtinteraktiven Berechtigungsmodus
bereitstellen, können dieser Richtlinie folgen. Claude CLI fügt
`--permission-mode bypassPermissions` hinzu, wenn die von OpenClaw angeforderte
Exec-Richtlinie YOLO ist. Überschreiben Sie dieses Backend-Verhalten mit expliziten
Claude-Argumenten unter `agents.defaults.cliBackends.claude-cli.args` / `resumeArgs` -
zum Beispiel `--permission-mode default`, `acceptEdits` oder
`bypassPermissions`.

Wenn Sie eine konservativere Einrichtung möchten, verschärfen Sie eine der beiden Ebenen wieder auf
`allowlist` / `on-miss` oder `deny`.

### Persistente Gateway-Host-Einrichtung „nie nachfragen“

<Steps>
  <Step title="Angeforderte Konfigurationsrichtlinie setzen">
    ```bash
    openclaw config set tools.exec.host gateway
    openclaw config set tools.exec.security full
    openclaw config set tools.exec.ask off
    openclaw gateway restart
    ```
  </Step>
  <Step title="Host-Genehmigungsdatei angleichen">
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

### Lokaler Shortcut

```bash
openclaw exec-policy preset yolo
```

Dieser lokale Shortcut aktualisiert beides:

- Lokales `tools.exec.host/security/ask`.
- Lokale Standardwerte in `~/.openclaw/exec-approvals.json`.

Er ist bewusst nur lokal. Um Genehmigungen für den Gateway-Host oder Node-Host
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
- Node-Exec-Genehmigungen werden zur Laufzeit vom Node abgerufen, daher müssen nodegezielte Aktualisierungen `openclaw approvals --node ...` verwenden.

</Note>

### Nur-Sitzung-Shortcut

- `/exec security=full ask=off` ändert nur die aktuelle Sitzung.
- `/elevated full` ist ein Break-Glass-Shortcut, der für diese Sitzung auch Exec-Genehmigungen überspringt.

Wenn die Host-Genehmigungsdatei strenger bleibt als die Konfiguration, gewinnt weiterhin die strengere
Host-Richtlinie.

## Allowlist (pro Agent)

Allowlists gelten **pro Agent**. Wenn mehrere Agents vorhanden sind, wechseln Sie in der macOS-App den Agent,
den Sie bearbeiten. Muster sind Glob-Abgleiche.

Muster können aufgelöste Binärpfad-Globs oder reine Befehlsnamen-Globs sein.
Reine Namen passen nur auf Befehle, die über `PATH` aufgerufen werden; daher kann `rg` auf
`/opt/homebrew/bin/rg` passen, wenn der Befehl `rg` ist, aber **nicht** auf `./rg` oder
`/tmp/rg`. Verwenden Sie einen Pfad-Glob, wenn Sie einem bestimmten Binärspeicherort vertrauen möchten.

Legacy-Einträge unter `agents.default` werden beim Laden nach `agents.main` migriert.
Shell-Ketten wie `echo ok && pwd` benötigen weiterhin für jedes Top-Level-Segment
die Erfüllung der Allowlist-Regeln.

Beispiele:

- `rg`
- `~/Projects/**/bin/peekaboo`
- `~/.local/bin/*`
- `/opt/homebrew/bin/rg`

### Argumente mit argPattern einschränken

Fügen Sie `argPattern` hinzu, wenn ein Allowlist-Eintrag auf eine Binärdatei und eine
bestimmte Argumentform passen soll. OpenClaw wertet den regulären Ausdruck
gegen die geparsten Befehlsargumente aus, ohne das ausführbare Token
(`argv[0]`). Bei handgeschriebenen Einträgen werden Argumente mit einem
einzelnen Leerzeichen verbunden; verankern Sie das Muster daher, wenn Sie eine exakte Übereinstimmung benötigen.

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

Dieser Eintrag erlaubt `python3 safe.py`; `python3 other.py` ist ein Allowlist-Miss.
Wenn auch ein reiner Pfadeintrag für dieselbe Binärdatei vorhanden ist, können nicht passende
Argumente weiterhin auf diesen reinen Pfadeintrag zurückfallen. Lassen Sie den reinen Pfadeintrag weg,
wenn das Ziel darin besteht, die Binärdatei auf die deklarierten Argumente zu beschränken.

Einträge, die durch Genehmigungsabläufe gespeichert wurden, können ein internes Trennzeichenformat für
exakte argv-Übereinstimmung verwenden. Verwenden Sie vorzugsweise die UI oder den Genehmigungsablauf,
um diese Einträge neu zu erzeugen, statt den codierten Wert von Hand zu bearbeiten. Wenn OpenClaw
argv für ein Befehlssegment nicht parsen kann, passen Einträge mit `argPattern` nicht.

Jeder Allowlist-Eintrag unterstützt:

| Feld              | Bedeutung                                                       |
| ------------------ | ------------------------------------------------------------- |
| `pattern`          | Aufgelöster Glob für Binärpfade oder Glob für reine Befehlsnamen           |
| `argPattern`       | Optionale argv-Regex; ausgelassene Einträge beziehen sich nur auf den Pfad            |
| `id`               | Stabile UUID, die für die UI-Identität verwendet wird                              |
| `source`           | Quelle des Eintrags, z. B. `allow-always`                          |
| `commandText`      | Befehlstext, der erfasst wurde, als ein Genehmigungsfluss den Eintrag erstellt hat |
| `lastUsedAt`       | Zeitstempel der letzten Verwendung                                           |
| `lastUsedCommand`  | Letzter Befehl, der übereinstimmte                                     |
| `lastResolvedPath` | Letzter aufgelöster Binärpfad                                     |

## Skill-CLIs automatisch zulassen

Wenn **Skill-CLIs automatisch zulassen** aktiviert ist, werden ausführbare Dateien, auf die
bekannte Skills verweisen, auf Nodes (macOS-Node oder headless
Node-Host) als allowlisted behandelt. Dies verwendet `skills.bins` über das Gateway-RPC, um die
Skill-Bin-Liste abzurufen. Deaktivieren Sie dies, wenn Sie strikt manuelle Allowlists verwenden möchten.

<Warning>
- Dies ist eine **implizite Komfort-Allowlist**, getrennt von manuellen Pfad-Allowlist-Einträgen.
- Sie ist für vertrauenswürdige Operator-Umgebungen gedacht, in denen Gateway und Node innerhalb derselben Vertrauensgrenze liegen.
- Wenn Sie strikt explizites Vertrauen benötigen, behalten Sie `autoAllowSkills: false` bei und verwenden Sie nur manuelle Pfad-Allowlist-Einträge.

</Warning>

## Sichere Bins und Genehmigungsweiterleitung

Informationen zu sicheren Bins (der schnellen Nur-stdin-Pfad), Details zur Interpreter-Bindung und dazu,
wie Genehmigungsaufforderungen an Slack/Discord/Telegram weitergeleitet werden (oder als
native Genehmigungsclients ausgeführt werden), finden Sie unter
[Exec-Genehmigungen - erweitert](/de/tools/exec-approvals-advanced).

## Bearbeitung in der Control UI

Verwenden Sie die Karte **Control UI → Nodes → Exec approvals**, um Standardwerte,
agentenspezifische Überschreibungen und Allowlists zu bearbeiten. Wählen Sie einen Geltungsbereich (Standardwerte oder einen Agent),
passen Sie die Richtlinie an, fügen Sie Allowlist-Muster hinzu oder entfernen Sie sie, und klicken Sie dann auf **Speichern**. Die UI
zeigt Metadaten zur letzten Verwendung pro Muster an, damit Sie die Liste übersichtlich halten können.

Der Zielselektor wählt **Gateway** (lokale Genehmigungen) oder eine **Node** aus.
Nodes müssen `system.execApprovals.get/set` anbieten (macOS-App oder
headless Node-Host). Wenn eine Node Exec-Genehmigungen noch nicht anbietet,
bearbeiten Sie direkt ihre lokale Datei `~/.openclaw/exec-approvals.json`.

CLI: `openclaw approvals` unterstützt die Bearbeitung von Gateway oder Node - siehe
[Approvals-CLI](/de/cli/approvals).

## Genehmigungsfluss

Wenn eine Aufforderung erforderlich ist, sendet das Gateway
`exec.approval.requested` an Operator-Clients. Die Control UI und die macOS-App
lösen sie über `exec.approval.resolve` auf, anschließend leitet das Gateway die
genehmigte Anfrage an den Node-Host weiter.

Für `host=node` enthalten Genehmigungsanfragen eine kanonische `systemRunPlan`-Payload.
Das Gateway verwendet diesen Plan als maßgeblichen
command/cwd/session-Kontext, wenn genehmigte `system.run`-Anfragen
weitergeleitet werden.

Das ist für asynchrone Genehmigungslatenz wichtig:

- Der Node-Exec-Pfad bereitet vorab einen kanonischen Plan vor.
- Der Genehmigungsdatensatz speichert diesen Plan und seine Bindungsmetadaten.
- Nach der Genehmigung verwendet der endgültig weitergeleitete `system.run`-Aufruf den gespeicherten Plan wieder, statt späteren Änderungen des Aufrufers zu vertrauen.
- Wenn der Aufrufer `command`, `rawCommand`, `cwd`, `agentId` oder `sessionKey` ändert, nachdem die Genehmigungsanfrage erstellt wurde, lehnt das Gateway den weitergeleiteten Lauf als Genehmigungsabweichung ab.

## Systemereignisse

Der Exec-Lebenszyklus wird als Systemmeldungen angezeigt:

- `Exec running` (nur wenn der Befehl den Schwellenwert für die Laufzeitbenachrichtigung überschreitet).
- `Exec finished`.
- `Exec denied`.

Diese werden in der Sitzung des Agent gepostet, nachdem die Node das Ereignis gemeldet hat.
Exec-Genehmigungen auf dem Gateway-Host geben dieselben Lebenszyklusereignisse aus, wenn der
Befehl abgeschlossen ist (und optional, wenn er länger als der Schwellenwert läuft).
Genehmigungspflichtige Execs verwenden die Genehmigungs-ID in diesen
Meldungen als `runId` wieder, damit sie leicht zuzuordnen sind.

## Verhalten bei verweigerter Genehmigung

Wenn eine asynchrone Exec-Genehmigung verweigert wird, verhindert OpenClaw, dass der Agent
Ausgaben aus einem früheren Lauf desselben Befehls in der Sitzung wiederverwendet.
Der Ablehnungsgrund wird mit explizitem Hinweis übergeben, dass keine Befehlsausgabe
verfügbar ist. Dadurch wird verhindert, dass der Agent behauptet, es gebe neue Ausgaben, oder
den verweigerten Befehl mit veralteten Ergebnissen aus einem früheren erfolgreichen
Lauf wiederholt.

## Auswirkungen

- **`full`** ist mächtig; bevorzugen Sie nach Möglichkeit Allowlists.
- **`ask`** hält Sie eingebunden und ermöglicht gleichzeitig schnelle Genehmigungen.
- Agentenspezifische Allowlists verhindern, dass Genehmigungen eines Agent auf andere übergreifen.
- Genehmigungen gelten nur für Host-Exec-Anfragen von **autorisierten Absendern**. Nicht autorisierte Absender können kein `/exec` ausführen.
- `/exec security=full` ist eine sitzungsweite Komfortfunktion für autorisierte Operatoren und überspringt Genehmigungen bewusst. Um Host-Exec hart zu blockieren, setzen Sie die Genehmigungssicherheit auf `deny` oder verweigern Sie das Tool `exec` über die Tool-Richtlinie.

## Verwandt

<CardGroup cols={2}>
  <Card title="Exec approvals - advanced" href="/de/tools/exec-approvals-advanced" icon="gear">
    Sichere Bins, Interpreter-Bindung und Genehmigungsweiterleitung an den Chat.
  </Card>
  <Card title="Exec tool" href="/de/tools/exec" icon="terminal">
    Tool zur Ausführung von Shell-Befehlen.
  </Card>
  <Card title="Elevated mode" href="/de/tools/elevated" icon="shield-exclamation">
    Break-glass-Pfad, der Genehmigungen ebenfalls überspringt.
  </Card>
  <Card title="Sandboxing" href="/de/gateway/sandboxing" icon="box">
    Sandbox-Modi und Workspace-Zugriff.
  </Card>
  <Card title="Security" href="/de/gateway/security" icon="lock">
    Sicherheitsmodell und Härtung.
  </Card>
  <Card title="Sandbox vs tool policy vs elevated" href="/de/gateway/sandbox-vs-tool-policy-vs-elevated" icon="sliders">
    Wann welche Steuerung eingesetzt werden sollte.
  </Card>
  <Card title="Skills" href="/de/tools/skills" icon="sparkles">
    Skill-gestütztes Auto-Allow-Verhalten.
  </Card>
</CardGroup>
