---
read_when:
    - Exec-Genehmigungen oder Allowlists konfigurieren
    - Implementierung der UX für exec-Freigaben in der macOS-App
    - Überprüfung von Sandbox-Escape-Prompts und ihrer Auswirkungen
sidebarTitle: Exec approvals
summary: 'Host-Exec-Genehmigungen: Richtlinienoptionen, Zulassungslisten und der YOLO-/Strict-Workflow'
title: Ausführungsgenehmigungen
x-i18n:
    generated_at: "2026-05-10T19:54:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8b1a9649161440bca445e318654b9a48a54ae1dbbca42349ac94b13ecc9fbfbd
    source_path: tools/exec-approvals.md
    workflow: 16
---

Exec-Genehmigungen sind die **Leitplanke der Companion-App / des Node-Hosts**, um
einem Agent in einer Sandbox zu erlauben, Befehle auf einem echten Host (`gateway` oder `node`) auszuführen. Eine
Sicherheitsverriegelung: Befehle sind nur erlaubt, wenn Policy + Allowlist +
(optionale) Benutzergenehmigung alle übereinstimmen. Exec-Genehmigungen liegen **zusätzlich zu**
Tool-Policy und Elevated-Gating (außer Elevated ist auf `full` gesetzt, wodurch
Genehmigungen übersprungen werden).

<Note>
Die wirksame Policy ist die **strengere** aus `tools.exec.*` und den
Genehmigungs-Defaults; wenn ein Genehmigungsfeld ausgelassen wird, wird der
`tools.exec`-Wert verwendet. Host-Exec verwendet außerdem den lokalen Genehmigungsstatus auf dieser Maschine - ein
hostlokales `ask: "always"` in `~/.openclaw/exec-approvals.json` fragt
weiterhin nach, selbst wenn Session- oder Config-Defaults `ask: "on-miss"` anfordern.
</Note>

## Wirksame Policy prüfen

| Befehl                                                          | Was er anzeigt                                                                          |
| ---------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `openclaw approvals get` / `--gateway` / `--node <id\|name\|ip>` | Angeforderte Policy, Host-Policy-Quellen und das wirksame Ergebnis.                       |
| `openclaw exec-policy show`                                      | Zusammengeführte Ansicht der lokalen Maschine.                                                             |
| `openclaw exec-policy set` / `preset`                            | Synchronisiert die lokal angeforderte Policy in einem Schritt mit der lokalen Host-Genehmigungsdatei. |

Wenn ein lokaler Scope `host=node` anfordert, meldet `exec-policy show` diesen
Scope zur Laufzeit als Node-verwaltet, statt vorzugeben, dass die lokale
Genehmigungsdatei die maßgebliche Quelle ist.

Wenn die Companion-App-UI **nicht verfügbar** ist, wird jede Anfrage, die
normalerweise eine Eingabeaufforderung auslösen würde, über den **Ask-Fallback** aufgelöst (Standard: `deny`).

<Tip>
Native Chat-Genehmigungsclients können kanalspezifische Bedienmöglichkeiten auf der
ausstehenden Genehmigungsnachricht vorbereiten. Matrix setzt zum Beispiel Reaktionskürzel
(`✅` einmal erlauben, `❌` ablehnen, `♾️` immer erlauben), während
`/approve ...`-Befehle weiterhin als Fallback in der Nachricht bleiben.
</Tip>

## Wo es gilt

Exec-Genehmigungen werden lokal auf dem Ausführungshost erzwungen:

- **Gateway-Host** → `openclaw`-Prozess auf der Gateway-Maschine.
- **Node-Host** → Node-Runner (macOS-Companion-App oder Headless-Node-Host).

### Vertrauensmodell

- Gateway-authentifizierte Aufrufer sind vertrauenswürdige Operatoren für dieses Gateway.
- Gekoppelte Nodes erweitern diese vertrauenswürdige Operator-Fähigkeit auf den Node-Host.
- Exec-Genehmigungen reduzieren das Risiko versehentlicher Ausführung, sind aber **keine** benutzerspezifische Auth-Grenze oder schreibgeschützte Dateisystem-Policy.
- Nach der Genehmigung kann ein Befehl Dateien entsprechend den ausgewählten Host- oder Sandbox-Dateisystemberechtigungen verändern.
- Genehmigte Node-Host-Ausführungen binden den kanonischen Ausführungskontext: kanonisches cwd, exaktes argv, Env-Bindung, wenn vorhanden, und angehefteten ausführbaren Pfad, wenn anwendbar.
- Für Shell-Skripte und direkte Interpreter-/Runtime-Dateiaufrufe versucht OpenClaw außerdem, einen konkreten lokalen Dateioperanden zu binden. Wenn sich diese gebundene Datei nach der Genehmigung, aber vor der Ausführung ändert, wird die Ausführung verweigert, statt veränderte Inhalte auszuführen.
- Dateibindung ist bewusst bestmöglich, **kein** vollständiges semantisches Modell jedes Interpreter-/Runtime-Loader-Pfads. Wenn der Genehmigungsmodus nicht genau eine konkrete lokale Datei zum Binden identifizieren kann, verweigert er das Erstellen einer genehmigungsgestützten Ausführung, statt vollständige Abdeckung vorzutäuschen.

### macOS-Aufteilung

- Der **Node-Host-Service** leitet `system.run` über lokales IPC an die **macOS-App** weiter.
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

## Policy-Optionen

### `exec.security`

<ParamField path="security" type='"deny" | "allowlist" | "full"'>
  - `deny` - alle Host-Exec-Anfragen blockieren.
  - `allowlist` - nur Befehle erlauben, die auf der Allowlist stehen.
  - `full` - alles erlauben (entspricht Elevated).

</ParamField>

### `exec.ask`

<ParamField path="ask" type='"off" | "on-miss" | "always"'>
  - `off` - nie nachfragen.
  - `on-miss` - nur nachfragen, wenn die Allowlist nicht passt.
  - `always` - bei jedem Befehl nachfragen. Dauerhaftes Vertrauen durch `allow-always` unterdrückt Eingabeaufforderungen **nicht**, wenn der wirksame Ask-Modus `always` ist.

</ParamField>

### `askFallback`

<ParamField path="askFallback" type='"deny" | "allowlist" | "full"'>
  Auflösung, wenn eine Eingabeaufforderung erforderlich ist, aber keine UI erreichbar ist.

- `deny` - blockieren.
- `allowlist` - nur erlauben, wenn die Allowlist passt.
- `full` - erlauben.

</ParamField>

### `tools.exec.strictInlineEval`

<ParamField path="strictInlineEval" type="boolean">
  Wenn `true`, behandelt OpenClaw Inline-Code-Eval-Formen als nur per Genehmigung zulässig,
  selbst wenn die Interpreter-Binärdatei selbst auf der Allowlist steht. Defense-in-Depth
  für Interpreter-Loader, die sich nicht sauber auf einen stabilen Dateioperanden
  abbilden lassen.
</ParamField>

Beispiele, die der strikte Modus erfasst:

- `python -c`
- `node -e`, `node --eval`, `node -p`
- `ruby -e`
- `perl -e`, `perl -E`
- `php -r`
- `lua -e`
- `osascript -e`

Im strikten Modus benötigen diese Befehle weiterhin eine explizite Genehmigung, und
`allow-always` persistiert für sie nicht automatisch neue Allowlist-Einträge.

## YOLO-Modus (ohne Genehmigung)

Wenn Sie möchten, dass Host-Exec ohne Genehmigungsabfragen ausgeführt wird, müssen Sie
**beide** Policy-Ebenen öffnen - die angeforderte Exec-Policy in der OpenClaw-Config
(`tools.exec.*`) **und** die hostlokale Genehmigungs-Policy in
`~/.openclaw/exec-approvals.json`.

YOLO ist das standardmäßige Host-Verhalten, sofern Sie es nicht ausdrücklich einschränken:

| Ebene                 | YOLO-Einstellung               |
| --------------------- | -------------------------- |
| `tools.exec.security` | `full` auf `gateway`/`node` |
| `tools.exec.ask`      | `off`                      |
| Host `askFallback`    | `full`                     |

<Warning>
**Wichtige Unterschiede:**

- `tools.exec.host=auto` wählt, **wo** Exec läuft: Sandbox, wenn verfügbar, andernfalls Gateway.
- YOLO wählt, **wie** Host-Exec genehmigt wird: `security=full` plus `ask=off`.
- Im YOLO-Modus fügt OpenClaw **kein** separates heuristisches Genehmigungsgate für Befehlsverschleierung oder eine Skript-Preflight-Ablehnungsebene zusätzlich zur konfigurierten Host-Exec-Policy hinzu.
- `auto` macht Gateway-Routing nicht zu einer freien Umgehung aus einer Sandbox-Session. Eine Anfrage pro Aufruf mit `host=node` ist aus `auto` erlaubt; `host=gateway` ist aus `auto` nur erlaubt, wenn keine Sandbox-Runtime aktiv ist. Für einen stabilen Nicht-`auto`-Default setzen Sie `tools.exec.host` oder verwenden Sie explizit `/exec host=...`.

</Warning>

CLI-gestützte Provider, die ihren eigenen nichtinteraktiven Berechtigungsmodus bereitstellen,
können dieser Policy folgen. Claude CLI fügt
`--permission-mode bypassPermissions` hinzu, wenn die angeforderte Exec-Policy von OpenClaw
YOLO ist. Überschreiben Sie dieses Backend-Verhalten mit expliziten Claude-Argumenten
unter `agents.defaults.cliBackends.claude-cli.args` / `resumeArgs` -
zum Beispiel `--permission-mode default`, `acceptEdits` oder
`bypassPermissions`.

Wenn Sie eine konservativere Einrichtung wünschen, schränken Sie eine der Ebenen wieder auf
`allowlist` / `on-miss` oder `deny` ein.

### Persistente Gateway-Host-Einrichtung ohne Nachfragen

<Steps>
  <Step title="Angeforderte Config-Policy setzen">
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

### Lokale Kurzform

```bash
openclaw exec-policy preset yolo
```

Diese lokale Kurzform aktualisiert beides:

- Lokale `tools.exec.host/security/ask`.
- Lokale Defaults in `~/.openclaw/exec-approvals.json`.

Sie ist bewusst nur lokal. Um Genehmigungen für Gateway-Host oder Node-Host
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
- Node-Exec-Genehmigungen werden zur Laufzeit vom Node abgerufen, daher müssen Node-bezogene Aktualisierungen `openclaw approvals --node ...` verwenden.

</Note>

### Nur-Session-Kurzform

- `/exec security=full ask=off` ändert nur die aktuelle Session.
- `/elevated full` ist eine Break-Glass-Kurzform, die für diese Session auch Exec-Genehmigungen überspringt.

Wenn die Host-Genehmigungsdatei strenger bleibt als die Config, gewinnt weiterhin die strengere Host-Policy.

## Allowlist (pro Agent)

Allowlists sind **pro Agent**. Wenn mehrere Agenten vorhanden sind, wechseln Sie in der macOS-App den Agent, den Sie bearbeiten. Muster sind Glob-Abgleiche.

Muster können aufgelöste Binärpfad-Globs oder reine Befehlsnamen-Globs sein.
Reine Namen passen nur auf Befehle, die über `PATH` aufgerufen werden, sodass `rg`
auf `/opt/homebrew/bin/rg` passen kann, wenn der Befehl `rg` ist, aber **nicht** auf `./rg` oder
`/tmp/rg`. Verwenden Sie einen Pfad-Glob, wenn Sie einem bestimmten
Binärdateispeicherort vertrauen möchten.

Legacy-Einträge in `agents.default` werden beim Laden zu `agents.main` migriert.
Shell-Ketten wie `echo ok && pwd` müssen weiterhin für jedes Segment der obersten Ebene
die Allowlist-Regeln erfüllen.

Beispiele:

- `rg`
- `~/Projects/**/bin/peekaboo`
- `~/.local/bin/*`
- `/opt/homebrew/bin/rg`

### Argumente mit argPattern einschränken

Fügen Sie `argPattern` hinzu, wenn ein Allowlist-Eintrag auf eine Binärdatei und eine
bestimmte Argumentform passen soll. OpenClaw wertet den regulären Ausdruck
gegen die geparsten Befehlsargumente aus, ausgenommen das ausführbare Token
(`argv[0]`). Bei manuell erstellten Einträgen werden Argumente mit einem
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

Dieser Eintrag erlaubt `python3 safe.py`; `python3 other.py` ist ein Allowlist-
Fehltreffer. Wenn für dieselbe Binärdatei auch ein nur pfadbasierter Eintrag vorhanden ist, können
nicht übereinstimmende Argumente weiterhin auf diesen nur pfadbasierten Eintrag zurückfallen. Lassen Sie den nur pfadbasierten
Eintrag weg, wenn das Ziel ist, die Binärdatei auf die deklarierten Argumente zu beschränken.

Einträge, die durch Genehmigungsabläufe gespeichert werden, können ein internes Trennzeichenformat für
exaktes argv-Matching verwenden. Verwenden Sie vorzugsweise die UI oder den Genehmigungsablauf, um diese
Einträge neu zu erzeugen, statt den codierten Wert von Hand zu bearbeiten. Wenn OpenClaw
argv für ein Befehlssegment nicht parsen kann, passen Einträge mit `argPattern` nicht.

Jeder Allowlist-Eintrag unterstützt:

| Feld               | Bedeutung                                                                 |
| ------------------ | ------------------------------------------------------------------------- |
| `pattern`          | Aufgelöstes Glob-Muster für den Binärpfad oder reines Glob-Muster für den Befehlsnamen |
| `argPattern`       | Optionale argv-Regex; ausgelassene Einträge sind nur pfadbasiert          |
| `id`               | Stabile UUID, die für die UI-Identität verwendet wird                     |
| `source`           | Eintragsquelle, z. B. `allow-always`                                      |
| `commandText`      | Befehlstext, der erfasst wurde, als ein Genehmigungsablauf den Eintrag erstellt hat |
| `lastUsedAt`       | Zeitstempel der letzten Verwendung                                        |
| `lastUsedCommand`  | Letzter Befehl, der übereingestimmt hat                                   |
| `lastResolvedPath` | Letzter aufgelöster Binärpfad                                             |

## Skill-CLIs automatisch erlauben

Wenn **Skill-CLIs automatisch erlauben** aktiviert ist, werden ausführbare Dateien, auf die von
bekannten Skills verwiesen wird, auf Nodes (macOS Node oder Headless-
Node-Host) als erlaubt behandelt. Dies verwendet `skills.bins` über den Gateway RPC, um die
Skill-bin-Liste abzurufen. Deaktivieren Sie dies, wenn Sie strikt manuelle Allowlists verwenden möchten.

<Warning>
- Dies ist eine **implizite Komfort-Allowlist**, getrennt von manuellen Pfad-Allowlist-Einträgen.
- Sie ist für vertrauenswürdige Betreiberumgebungen gedacht, in denen Gateway und Node innerhalb derselben Vertrauensgrenze liegen.
- Wenn Sie strikt explizites Vertrauen benötigen, behalten Sie `autoAllowSkills: false` bei und verwenden Sie ausschließlich manuelle Pfad-Allowlist-Einträge.

</Warning>

## Sichere Bins und Genehmigungsweiterleitung

Für sichere Bins (den stdin-only Fast-Path), Details zur Interpreter-Bindung und
Informationen dazu, wie Genehmigungsaufforderungen an Slack/Discord/Telegram weitergeleitet werden (oder als
native Genehmigungsclients ausgeführt werden), siehe
[Exec-Genehmigungen – erweitert](/de/tools/exec-approvals-advanced).

## Bearbeitung in der Control UI

Verwenden Sie die Karte **Control UI → Nodes → Exec approvals**, um Standards,
agentenspezifische Überschreibungen und Allowlists zu bearbeiten. Wählen Sie einen Geltungsbereich (Standards oder einen Agenten),
passen Sie die Richtlinie an, fügen Sie Allowlist-Muster hinzu oder entfernen Sie sie und wählen Sie dann **Speichern**. Die UI
zeigt Metadaten zur letzten Verwendung pro Muster an, damit Sie die Liste ordentlich halten können.

Die Zielauswahl wählt **Gateway** (lokale Genehmigungen) oder eine **Node**.
Nodes müssen `system.execApprovals.get/set` ankündigen (macOS-App oder
Headless-Node-Host). Wenn eine Node Exec-Genehmigungen noch nicht ankündigt,
bearbeiten Sie ihre lokale Datei `~/.openclaw/exec-approvals.json` direkt.

CLI: `openclaw approvals` unterstützt die Bearbeitung von Gateway oder Node – siehe
[Approvals CLI](/de/cli/approvals).

## Genehmigungsablauf

Wenn eine Aufforderung erforderlich ist, sendet der Gateway
`exec.approval.requested` an Betreiberclients. Die Control UI und die macOS-
App lösen sie über `exec.approval.resolve` auf; anschließend leitet der Gateway die
genehmigte Anfrage an den Node-Host weiter.

Für `host=node` enthalten Genehmigungsanfragen eine kanonische `systemRunPlan`-
Nutzlast. Der Gateway verwendet diesen Plan als maßgeblichen
command/cwd/session-Kontext, wenn genehmigte `system.run`-
Anfragen weitergeleitet werden.

Das ist für asynchrone Genehmigungslatenz wichtig:

- Der Node-Exec-Pfad bereitet zu Beginn einen kanonischen Plan vor.
- Der Genehmigungsdatensatz speichert diesen Plan und seine Bindungsmetadaten.
- Nach der Genehmigung verwendet der endgültig weitergeleitete `system.run`-Aufruf den gespeicherten Plan erneut, anstatt späteren Änderungen des Aufrufers zu vertrauen.
- Wenn der Aufrufer `command`, `rawCommand`, `cwd`, `agentId` oder `sessionKey` ändert, nachdem die Genehmigungsanfrage erstellt wurde, lehnt der Gateway die weitergeleitete Ausführung als Genehmigungsabweichung ab.

## Systemereignisse

Der Exec-Lebenszyklus wird als Systemmeldungen sichtbar gemacht:

- `Exec running` (nur wenn der Befehl den Schwellenwert für die Laufzeitbenachrichtigung überschreitet).
- `Exec finished`.
- `Exec denied`.

Diese werden in die Sitzung des Agenten gepostet, nachdem die Node das Ereignis gemeldet hat.
Gateway-Host-Exec-Genehmigungen geben dieselben Lebenszyklusereignisse aus, wenn der
Befehl abgeschlossen ist (und optional, wenn er länger als der Schwellenwert läuft).
Genehmigungspflichtige Execs verwenden die Genehmigungs-ID in diesen
Meldungen erneut als `runId`, um die Korrelation zu erleichtern.

## Verhalten bei verweigerter Genehmigung

Wenn eine asynchrone Exec-Genehmigung verweigert wird, verhindert OpenClaw, dass der Agent
Ausgaben aus einer früheren Ausführung desselben Befehls in der Sitzung
wiederverwendet. Der Ablehnungsgrund wird mit ausdrücklicher Anleitung übergeben, dass keine Befehlsausgabe
verfügbar ist. Dadurch wird verhindert, dass der Agent behauptet, es gebe neue Ausgaben, oder
den verweigerten Befehl mit veralteten Ergebnissen einer früheren erfolgreichen
Ausführung wiederholt.

## Auswirkungen

- **`full`** ist mächtig; bevorzugen Sie Allowlists, wenn möglich.
- **`ask`** hält Sie eingebunden und ermöglicht zugleich schnelle Genehmigungen.
- Agentenspezifische Allowlists verhindern, dass Genehmigungen eines Agenten auf andere übergreifen.
- Genehmigungen gelten nur für Host-Exec-Anfragen von **autorisierten Absendern**. Nicht autorisierte Absender können `/exec` nicht ausführen.
- `/exec security=full` ist eine Komfortfunktion auf Sitzungsebene für autorisierte Betreiber und überspringt Genehmigungen absichtlich. Um Host-Exec strikt zu blockieren, setzen Sie die Genehmigungssicherheit auf `deny` oder verweigern Sie das `exec`-Tool über die Tool-Richtlinie.

## Verwandt

<CardGroup cols={2}>
  <Card title="Exec-Genehmigungen – erweitert" href="/de/tools/exec-approvals-advanced" icon="gear">
    Sichere Bins, Interpreter-Bindung und Genehmigungsweiterleitung an Chat.
  </Card>
  <Card title="Exec-Tool" href="/de/tools/exec" icon="terminal">
    Tool zur Ausführung von Shell-Befehlen.
  </Card>
  <Card title="Erhöhter Modus" href="/de/tools/elevated" icon="shield-exclamation">
    Break-Glass-Pfad, der ebenfalls Genehmigungen überspringt.
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
    Skill-gestütztes Auto-Allow-Verhalten.
  </Card>
</CardGroup>
