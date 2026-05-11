---
read_when:
    - Ausführungsgenehmigungen oder Zulassungslisten konfigurieren
    - Implementierung der UX für exec-Genehmigungen in der macOS-App
    - Überprüfung von Sandbox-Escape-Prompts und ihren Auswirkungen
sidebarTitle: Exec approvals
summary: 'Host-Exec-Genehmigungen: Richtlinienoptionen, Allowlists und der YOLO-/Strict-Workflow'
title: Ausführungsgenehmigungen
x-i18n:
    generated_at: "2026-05-11T20:37:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2966a6f4633046941a9ef3267bad10f3a153956361b9f088fb3e29fcd3fcb99d
    source_path: tools/exec-approvals.md
    workflow: 16
---

Exec-Genehmigungen sind der **Schutzmechanismus der Companion-App / des Node-Hosts**, der es
einem Agent in einer Sandbox erlaubt, Befehle auf einem echten Host (`gateway` oder `node`) auszuführen. Eine
Sicherheitsverriegelung: Befehle sind nur erlaubt, wenn Policy + Allowlist +
(optional) Benutzergenehmigung alle zustimmen. Exec-Genehmigungen liegen **zusätzlich zu**
Tool-Policy und Elevated-Gating (außer `elevated` ist auf `full` gesetzt, wodurch
Genehmigungen übersprungen werden).

<Note>
Die effektive Policy ist die **strengere** aus `tools.exec.*` und den
Standardwerten der Genehmigungen; wenn ein Genehmigungsfeld ausgelassen wird, wird
der Wert aus `tools.exec` verwendet. Host-Exec verwendet außerdem den lokalen Genehmigungszustand auf dieser Maschine - ein
hostlokales `ask: "always"` in `~/.openclaw/exec-approvals.json` fordert
weiterhin Bestätigungen an, selbst wenn Sitzungs- oder Konfigurationsstandardwerte `ask: "on-miss"` anfordern.
</Note>

## Effektive Policy prüfen

| Befehl                                                           | Was er anzeigt                                                                         |
| ---------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `openclaw approvals get` / `--gateway` / `--node <id\|name\|ip>` | Angeforderte Policy, Host-Policy-Quellen und das effektive Ergebnis.                   |
| `openclaw exec-policy show`                                      | Zusammengeführte Ansicht der lokalen Maschine.                                         |
| `openclaw exec-policy set` / `preset`                            | Synchronisiert die lokal angeforderte Policy in einem Schritt mit der lokalen Host-Genehmigungsdatei. |

Wenn ein lokaler Scope `host=node` anfordert, meldet `exec-policy show` diesen
Scope zur Laufzeit als Node-verwaltet, statt so zu tun, als sei die lokale
Genehmigungsdatei die maßgebliche Quelle.

Wenn die Benutzeroberfläche der Companion-App **nicht verfügbar** ist, wird jede Anfrage, die
normalerweise eine Bestätigung anfordern würde, über den **ask-Fallback** aufgelöst (Standard: `deny`).

<Tip>
Native Chat-Genehmigungsclients können kanalspezifische Bedienhilfen in der
ausstehenden Genehmigungsnachricht vorbereiten. Matrix legt zum Beispiel Reaktionskürzel an
(`✅` einmal erlauben, `❌` ablehnen, `♾️` immer erlauben), während
`/approve ...`-Befehle weiterhin als Fallback in der Nachricht bleiben.
</Tip>

## Wo es gilt

Exec-Genehmigungen werden lokal auf dem Ausführungshost durchgesetzt:

- **Gateway-Host** → `openclaw`-Prozess auf der Gateway-Maschine.
- **Node-Host** → Node-Runner (macOS-Companion-App oder Headless-Node-Host).

### Vertrauensmodell

- Über den Gateway authentifizierte Aufrufer sind vertrauenswürdige Operatoren für diesen Gateway.
- Gekoppelte Nodes erweitern diese vertrauenswürdige Operatorfähigkeit auf den Node-Host.
- Exec-Genehmigungen verringern das Risiko versehentlicher Ausführung, sind aber **keine** benutzerspezifische Authentifizierungsgrenze oder Dateisystem-Read-only-Policy.
- Nach der Genehmigung kann ein Befehl Dateien gemäß den ausgewählten Host- oder Sandbox-Dateisystemberechtigungen ändern.
- Genehmigte Node-Host-Ausführungen binden den kanonischen Ausführungskontext: kanonisches cwd, exaktes argv, Env-Bindung, wenn vorhanden, und angehefteten ausführbaren Pfad, wenn anwendbar.
- Für Shell-Skripte und direkte Interpreter-/Runtime-Dateiaufrufe versucht OpenClaw außerdem, einen konkreten lokalen Dateioperanden zu binden. Wenn sich diese gebundene Datei nach der Genehmigung, aber vor der Ausführung ändert, wird die Ausführung abgelehnt, statt abweichenden Inhalt auszuführen.
- Die Dateibindung ist bewusst Best-Effort, **kein** vollständiges semantisches Modell jedes Interpreter-/Runtime-Loader-Pfads. Wenn der Genehmigungsmodus nicht genau eine konkrete lokale Datei zum Binden identifizieren kann, verweigert er das Ausstellen einer genehmigungsgestützten Ausführung, statt vollständige Abdeckung vorzutäuschen.

### macOS-Aufteilung

- Der **Node-Host-Dienst** leitet `system.run` über lokales IPC an die **macOS-App** weiter.
- Die **macOS-App** erzwingt Genehmigungen und führt den Befehl im UI-Kontext aus.

## Einstellungen und Speicherung

Genehmigungen liegen in einer lokalen JSON-Datei auf dem Ausführungshost:

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

## Policy-Schalter

### `exec.security`

<ParamField path="security" type='"deny" | "allowlist" | "full"'>
  - `deny` - alle Host-Exec-Anfragen blockieren.
  - `allowlist` - nur Befehle erlauben, die in der Allowlist stehen.
  - `full` - alles erlauben (entspricht Elevated).

</ParamField>

### `exec.ask`

<ParamField path="ask" type='"off" | "on-miss" | "always"'>
  - `off` - nie nachfragen.
  - `on-miss` - nur nachfragen, wenn die Allowlist nicht übereinstimmt.
  - `always` - bei jedem Befehl nachfragen. Dauerhaftes Vertrauen durch `allow-always` unterdrückt Bestätigungsanfragen **nicht**, wenn der effektive ask-Modus `always` ist.

</ParamField>

### `askFallback`

<ParamField path="askFallback" type='"deny" | "allowlist" | "full"'>
  Auflösung, wenn eine Bestätigung erforderlich ist, aber keine UI erreichbar ist.

- `deny` - blockieren.
- `allowlist` - nur erlauben, wenn die Allowlist übereinstimmt.
- `full` - erlauben.

</ParamField>

### `tools.exec.strictInlineEval`

<ParamField path="strictInlineEval" type="boolean">
  Wenn `true`, behandelt OpenClaw Inline-Code-Eval-Formen als nur per Genehmigung ausführbar,
  selbst wenn das Interpreter-Binary selbst in der Allowlist steht. Defense-in-depth
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

Im strikten Modus benötigen diese Befehle weiterhin eine ausdrückliche Genehmigung, und
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

Wenn Host-Exec ohne Genehmigungsabfragen laufen soll, müssen Sie
**beide** Policy-Ebenen öffnen - die angeforderte Exec-Policy in der OpenClaw-Konfiguration
(`tools.exec.*`) **und** die hostlokale Genehmigungs-Policy in
`~/.openclaw/exec-approvals.json`.

YOLO ist das Standardverhalten des Hosts, sofern Sie es nicht ausdrücklich verschärfen:

| Ebene                 | YOLO-Einstellung          |
| --------------------- | ------------------------- |
| `tools.exec.security` | `full` auf `gateway`/`node` |
| `tools.exec.ask`      | `off`                     |
| Host `askFallback`    | `full`                    |

<Warning>
**Wichtige Unterschiede:**

- `tools.exec.host=auto` wählt, **wo** Exec läuft: Sandbox, wenn verfügbar, andernfalls Gateway.
- YOLO wählt, **wie** Host-Exec genehmigt wird: `security=full` plus `ask=off`.
- Im YOLO-Modus fügt OpenClaw **kein** separates heuristisches Genehmigungs-Gate für Befehlsverschleierung oder eine Skript-Preflight-Ablehnungsebene zusätzlich zur konfigurierten Host-Exec-Policy hinzu.
- `auto` macht Gateway-Routing nicht zu einem freien Override aus einer Sandbox-Sitzung. Eine Anfrage pro Aufruf mit `host=node` ist aus `auto` erlaubt; `host=gateway` ist aus `auto` nur erlaubt, wenn keine Sandbox-Runtime aktiv ist. Für einen stabilen Nicht-`auto`-Standard setzen Sie `tools.exec.host` oder verwenden Sie explizit `/exec host=...`.

</Warning>

CLI-gestützte Provider, die ihren eigenen nichtinteraktiven Berechtigungsmodus bereitstellen,
können dieser Policy folgen. Claude CLI fügt
`--permission-mode bypassPermissions` hinzu, wenn die von OpenClaw angeforderte Exec-Policy
YOLO ist. Überschreiben Sie dieses Backend-Verhalten mit ausdrücklichen Claude-Argumenten
unter `agents.defaults.cliBackends.claude-cli.args` / `resumeArgs` -
zum Beispiel `--permission-mode default`, `acceptEdits` oder
`bypassPermissions`.

Wenn Sie eine konservativere Einrichtung möchten, verschärfen Sie eine der beiden Ebenen wieder auf
`allowlist` / `on-miss` oder `deny`.

### Persistente Gateway-Host-Einrichtung mit „nie nachfragen“

<Steps>
  <Step title="Angeforderte Konfigurations-Policy festlegen">
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

### Lokale Abkürzung

```bash
openclaw exec-policy preset yolo
```

Diese lokale Abkürzung aktualisiert beides:

- Lokales `tools.exec.host/security/ask`.
- Lokale Standardwerte in `~/.openclaw/exec-approvals.json`.

Sie ist absichtlich nur lokal. Um Genehmigungen für Gateway-Hosts oder Node-Hosts
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
- Node-Exec-Genehmigungen werden zur Laufzeit vom Node abgerufen, daher müssen auf Node zielende Updates `openclaw approvals --node ...` verwenden.

</Note>

### Nur-Sitzung-Abkürzung

- `/exec security=full ask=off` ändert nur die aktuelle Sitzung.
- `/elevated full` ist eine Break-Glass-Abkürzung, die Exec-Genehmigungen für diese Sitzung ebenfalls überspringt.

Wenn die Host-Genehmigungsdatei strenger bleibt als die Konfiguration, setzt sich weiterhin die strengere Host-Policy durch.

## Allowlist (pro Agent)

Allowlists gelten **pro Agent**. Wenn mehrere Agents existieren, wechseln Sie in der macOS-App, welchen Agent
Sie bearbeiten. Patterns sind Glob-Abgleiche.

Patterns können aufgelöste Binary-Pfad-Globs oder bloße Befehlsnamen-Globs sein.
Bloße Namen stimmen nur mit Befehlen überein, die über `PATH` aufgerufen werden, sodass `rg`
zu `/opt/homebrew/bin/rg` passen kann, wenn der Befehl `rg` ist, aber **nicht** zu `./rg` oder
`/tmp/rg`. Verwenden Sie einen Pfad-Glob, wenn Sie einem bestimmten Binary-Speicherort
vertrauen möchten.

Alte `agents.default`-Einträge werden beim Laden nach `agents.main` migriert.
Shell-Ketten wie `echo ok && pwd` müssen weiterhin für jedes Top-Level-Segment
die Allowlist-Regeln erfüllen.

Beispiele:

- `rg`
- `~/Projects/**/bin/peekaboo`
- `~/.local/bin/*`
- `/opt/homebrew/bin/rg`

### Argumente mit argPattern einschränken

Fügen Sie `argPattern` hinzu, wenn ein Allowlist-Eintrag ein Binary und eine
bestimmte Argumentform abgleichen soll. OpenClaw wertet den regulären Ausdruck
gegen die geparsten Befehlsargumente aus, wobei das ausführbare Token
(`argv[0]`) ausgeschlossen wird. Bei handgeschriebenen Einträgen werden Argumente mit einem
einzelnen Leerzeichen verbunden; verankern Sie das Pattern daher, wenn Sie eine exakte Übereinstimmung benötigen.

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

Dieser Eintrag erlaubt `python3 safe.py`; `python3 other.py` ist ein Allowlist-
Miss. Wenn für dasselbe Binary auch ein nur pfadbasierter Eintrag vorhanden ist, können nicht übereinstimmende
Argumente weiterhin auf diesen nur pfadbasierten Eintrag zurückfallen. Lassen Sie den nur pfadbasierten
Eintrag weg, wenn das Ziel darin besteht, das Binary auf die deklarierten Argumente zu beschränken.

Einträge, die von Genehmigungsabläufen gespeichert werden, können ein internes Trennzeichenformat für
exakte argv-Übereinstimmung verwenden. Bevorzugen Sie die UI oder den Genehmigungsablauf, um diese
Einträge neu zu generieren, statt den codierten Wert manuell zu bearbeiten. Wenn OpenClaw
argv für ein Befehlssegment nicht parsen kann, stimmen Einträge mit `argPattern` nicht überein.

Jeder Zulassungsliste-Eintrag unterstützt:

| Feld               | Bedeutung                                                     |
| ------------------ | ------------------------------------------------------------- |
| `pattern`          | Aufgelöstes Glob-Muster für den Binärpfad oder bloßes Glob-Muster für den Befehlsnamen |
| `argPattern`       | Optionales argv-Regex; ausgelassene Einträge gelten nur für Pfade |
| `id`               | Stabile UUID, die für die UI-Identität verwendet wird          |
| `source`           | Eintragsquelle, z. B. `allow-always`                          |
| `commandText`      | Befehlstext, der erfasst wurde, als ein Genehmigungsablauf den Eintrag erstellt hat |
| `lastUsedAt`       | Zeitstempel der letzten Verwendung                            |
| `lastUsedCommand`  | Letzter Befehl, der übereinstimmte                            |
| `lastResolvedPath` | Letzter aufgelöster Binärpfad                                 |

## Skill-CLIs automatisch zulassen

Wenn **Skill-CLIs automatisch zulassen** aktiviert ist, werden ausführbare Dateien, auf die
bekannte Skills verweisen, auf Nodes (macOS-Node oder headless Node-Host) als zugelassen
behandelt. Dies verwendet `skills.bins` über den Gateway-RPC, um die
Skill-Bin-Liste abzurufen. Deaktivieren Sie dies, wenn Sie strikt manuelle Zulassungslisten wünschen.

<Warning>
- Dies ist eine **implizite Komfort-Zulassungsliste**, getrennt von manuellen Pfad-Zulassungsliste-Einträgen.
- Sie ist für vertrauenswürdige Operator-Umgebungen gedacht, in denen Gateway und Node innerhalb derselben Vertrauensgrenze liegen.
- Wenn Sie strikt explizites Vertrauen benötigen, behalten Sie `autoAllowSkills: false` bei und verwenden Sie ausschließlich manuelle Pfad-Zulassungsliste-Einträge.

</Warning>

## Sichere Bins und Weiterleitung von Genehmigungen

Informationen zu sicheren Bins (dem stdin-only-Schnellpfad), Details zur Interpreter-Bindung und
dazu, wie Sie Genehmigungsaufforderungen an Slack/Discord/Telegram weiterleiten (oder sie als
native Genehmigungsclients ausführen), finden Sie unter
[Exec-Genehmigungen – erweitert](/de/tools/exec-approvals-advanced).

## Bearbeitung in der Control UI

Verwenden Sie die Karte **Control UI → Nodes → Exec-Genehmigungen**, um Standardwerte,
agentenspezifische Überschreibungen und Zulassungslisten zu bearbeiten. Wählen Sie einen Bereich (Standardwerte oder einen Agent),
passen Sie die Richtlinie an, fügen Sie Zulassungsliste-Muster hinzu oder entfernen Sie sie, und klicken Sie dann auf **Speichern**. Die UI
zeigt Metadaten zur letzten Verwendung pro Muster an, damit Sie die Liste übersichtlich halten können.

Die Zielauswahl wählt **Gateway** (lokale Genehmigungen) oder einen **Node**.
Nodes müssen `system.execApprovals.get/set` ankündigen (macOS-App oder
headless Node-Host). Wenn ein Node Exec-Genehmigungen noch nicht ankündigt,
bearbeiten Sie direkt seine lokale Datei `~/.openclaw/exec-approvals.json`.

CLI: `openclaw approvals` unterstützt das Bearbeiten von Gateway oder Node – siehe
[Genehmigungs-CLI](/de/cli/approvals).

## Genehmigungsablauf

Wenn eine Aufforderung erforderlich ist, sendet das Gateway
`exec.approval.requested` an Operator-Clients. Die Control UI und die macOS-App
lösen sie über `exec.approval.resolve` auf; anschließend leitet das Gateway die
genehmigte Anfrage an den Node-Host weiter.

Für `host=node` enthalten Genehmigungsanfragen eine kanonische `systemRunPlan`-Payload.
Das Gateway verwendet diesen Plan als maßgeblichen
Befehl/cwd/Sitzungskontext, wenn genehmigte `system.run`-Anfragen
weitergeleitet werden.

Das ist für asynchrone Genehmigungslatenz wichtig:

- Der Node-Exec-Pfad bereitet im Voraus einen kanonischen Plan vor.
- Der Genehmigungsdatensatz speichert diesen Plan und seine Bindungsmetadaten.
- Nach der Genehmigung verwendet der endgültig weitergeleitete `system.run`-Aufruf den gespeicherten Plan wieder, statt späteren Änderungen des Aufrufers zu vertrauen.
- Wenn der Aufrufer `command`, `rawCommand`, `cwd`, `agentId` oder `sessionKey` ändert, nachdem die Genehmigungsanfrage erstellt wurde, weist das Gateway den weitergeleiteten Lauf als Genehmigungsabweichung zurück.

## Systemereignisse

Der Exec-Lebenszyklus wird als Systemmeldungen angezeigt:

- `Exec running` (nur wenn der Befehl den Schwellenwert für die Laufzeitbenachrichtigung überschreitet).
- `Exec finished`.
- `Exec denied`.

Diese werden in der Sitzung des Agenten veröffentlicht, nachdem der Node das Ereignis meldet.
Gateway-Host-Exec-Genehmigungen geben dieselben Lebenszyklusereignisse aus, wenn der
Befehl abgeschlossen ist (und optional, wenn er länger als der Schwellenwert läuft).
Genehmigungsgesteuerte Execs verwenden die Genehmigungs-ID in diesen
Meldungen als `runId` wieder, um die Zuordnung zu erleichtern.

## Verhalten bei abgelehnter Genehmigung

Wenn eine asynchrone Exec-Genehmigung abgelehnt wird, verhindert OpenClaw, dass der Agent
Ausgaben aus einem früheren Lauf desselben Befehls in der Sitzung wiederverwendet.
Der Ablehnungsgrund wird mit ausdrücklicher Anleitung übergeben, dass keine Befehlsausgabe
verfügbar ist. Dadurch wird verhindert, dass der Agent behauptet, es gebe neue Ausgaben, oder
den abgelehnten Befehl mit veralteten Ergebnissen aus einem zuvor erfolgreichen
Lauf wiederholt.

## Auswirkungen

- **`full`** ist leistungsstark; bevorzugen Sie nach Möglichkeit Zulassungslisten.
- **`ask`** hält Sie eingebunden und ermöglicht dennoch schnelle Genehmigungen.
- Agentenspezifische Zulassungslisten verhindern, dass Genehmigungen eines Agenten auf andere übergreifen.
- Genehmigungen gelten nur für Host-Exec-Anfragen von **autorisierten Absendern**. Nicht autorisierte Absender können kein `/exec` ausführen.
- `/exec security=full` ist eine sitzungsbezogene Komfortfunktion für autorisierte Operatoren und überspringt Genehmigungen absichtlich. Um Host-Exec hart zu blockieren, setzen Sie die Genehmigungssicherheit auf `deny` oder verweigern Sie das Tool `exec` über die Tool-Richtlinie.

## Verwandte Themen

<CardGroup cols={2}>
  <Card title="Exec-Genehmigungen – erweitert" href="/de/tools/exec-approvals-advanced" icon="gear">
    Sichere Bins, Interpreter-Bindung und Weiterleitung von Genehmigungen an Chat.
  </Card>
  <Card title="Exec-Tool" href="/de/tools/exec" icon="terminal">
    Tool zur Ausführung von Shell-Befehlen.
  </Card>
  <Card title="Erhöhter Modus" href="/de/tools/elevated" icon="shield-exclamation">
    Notfallpfad, der Genehmigungen ebenfalls überspringt.
  </Card>
  <Card title="Sandboxing" href="/de/gateway/sandboxing" icon="box">
    Sandbox-Modi und Workspace-Zugriff.
  </Card>
  <Card title="Sicherheit" href="/de/gateway/security" icon="lock">
    Sicherheitsmodell und Härtung.
  </Card>
  <Card title="Sandbox vs. Tool-Richtlinie vs. erhöht" href="/de/gateway/sandbox-vs-tool-policy-vs-elevated" icon="sliders">
    Wann Sie welche Steuerung verwenden sollten.
  </Card>
  <Card title="Skills" href="/de/tools/skills" icon="sparkles">
    Skill-gestütztes Verhalten zur automatischen Zulassung.
  </Card>
</CardGroup>
