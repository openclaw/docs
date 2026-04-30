---
read_when:
    - Konfigurieren von exec-Genehmigungen oder Allowlists
    - Implementierung der UX für exec-Genehmigungen in der macOS-App
    - Überprüfung von Sandbox-Escape-Prompts und ihrer Auswirkungen
sidebarTitle: Exec approvals
summary: 'Genehmigungen für Host-Ausführungen: Richtlinienoptionen, Zulassungslisten und der YOLO-/Strict-Workflow'
title: Ausführungsgenehmigungen
x-i18n:
    generated_at: "2026-04-30T07:17:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: 71c16d0e547c4dd42a351d37e37e97b681a062cd496d5e0cba923b54c8f5b0e9
    source_path: tools/exec-approvals.md
    workflow: 16
---

Exec-Freigaben sind die **Leitplanke der Companion-App / des Node-Hosts**, mit der
ein sandboxed Agent Befehle auf einem echten Host (`gateway` oder `node`) ausführen darf. Eine
Sicherheitsverriegelung: Befehle sind nur erlaubt, wenn Policy + Allowlist +
(optionale) Benutzerfreigabe alle zustimmen. Exec-Freigaben werden **zusätzlich zu**
Tool-Policy und erhöhter Absicherung angewendet (außer `elevated` ist auf `full` gesetzt, wodurch
Freigaben übersprungen werden).

<Note>
Die wirksame Policy ist die **strengere** aus `tools.exec.*` und den
Freigabe-Defaults; wenn ein Freigabefeld ausgelassen wird, wird der Wert aus
`tools.exec` verwendet. Host-Exec verwendet außerdem den lokalen Freigabestatus auf dieser Maschine — ein
host-lokales `ask: "always"` in `~/.openclaw/exec-approvals.json` fragt weiterhin nach,
auch wenn Sitzungs- oder Konfigurations-Defaults `ask: "on-miss"` anfordern.
</Note>

## Die wirksame Policy prüfen

| Befehl                                                           | Was er anzeigt                                                                         |
| ---------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `openclaw approvals get` / `--gateway` / `--node <id\|name\|ip>` | Angeforderte Policy, Host-Policy-Quellen und das wirksame Ergebnis.                    |
| `openclaw exec-policy show`                                      | Zusammengeführte Ansicht der lokalen Maschine.                                         |
| `openclaw exec-policy set` / `preset`                            | Synchronisiert die lokal angeforderte Policy in einem Schritt mit der lokalen Host-Freigabedatei. |

Wenn ein lokaler Scope `host=node` anfordert, meldet `exec-policy show` diesen
Scope zur Laufzeit als node-verwaltet, statt so zu tun, als wäre die lokale
Freigabedatei die maßgebliche Quelle.

Wenn die UI der Companion-App **nicht verfügbar** ist, wird jede Anfrage, die
normalerweise eine Rückfrage auslösen würde, über den **ask-Fallback** aufgelöst (Standard: `deny`).

<Tip>
Native Chat-Freigabeclients können kanalspezifische Interaktionen in der
ausstehenden Freigabenachricht vorbereiten. Zum Beispiel legt Matrix Reaktionskürzel an
(`✅` einmal erlauben, `❌` ablehnen, `♾️` immer erlauben), während
`/approve ...`-Befehle weiterhin als Fallback in der Nachricht bleiben.
</Tip>

## Wo es gilt

Exec-Freigaben werden lokal auf dem Ausführungs-Host erzwungen:

- **Gateway-Host** → `openclaw`-Prozess auf der Gateway-Maschine.
- **Node-Host** → Node-Runner (macOS-Companion-App oder headless Node-Host).

### Vertrauensmodell

- Gateway-authentifizierte Aufrufer sind vertrauenswürdige Operatoren für dieses Gateway.
- Gekoppelte Nodes erweitern diese Fähigkeit als vertrauenswürdiger Operator auf den Node-Host.
- Exec-Freigaben reduzieren das Risiko versehentlicher Ausführung, sind aber **keine** Authentifizierungsgrenze pro Benutzer.
- Freigegebene Node-Host-Ausführungen binden den kanonischen Ausführungskontext: kanonisches cwd, exaktes argv, Env-Bindung, wenn vorhanden, und angehefteter Pfad zur ausführbaren Datei, wenn zutreffend.
- Für Shell-Skripte und direkte Datei-Aufrufe über Interpreter/Runtimes versucht OpenClaw außerdem, einen konkreten lokalen Dateioperanden zu binden. Wenn sich diese gebundene Datei nach der Freigabe, aber vor der Ausführung ändert, wird die Ausführung verweigert, statt abweichenden Inhalt auszuführen.
- Datei-Bindung ist bewusst best-effort und **kein** vollständiges semantisches Modell jedes Interpreter-/Runtime-Loader-Pfads. Wenn der Freigabemodus nicht genau eine konkrete lokale Datei für die Bindung identifizieren kann, verweigert er eine freigabegestützte Ausführung, statt vollständige Abdeckung vorzutäuschen.

### macOS-Aufteilung

- Der **Node-Host-Dienst** leitet `system.run` über lokales IPC an die **macOS-App** weiter.
- Die **macOS-App** erzwingt Freigaben und führt den Befehl im UI-Kontext aus.

## Einstellungen und Speicherung

Freigaben liegen in einer lokalen JSON-Datei auf dem Ausführungs-Host:

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
  - `deny` — alle Host-Exec-Anfragen blockieren.
  - `allowlist` — nur Befehle erlauben, die in der Allowlist enthalten sind.
  - `full` — alles erlauben (entspricht elevated).

</ParamField>

### `exec.ask`

<ParamField path="ask" type='"off" | "on-miss" | "always"'>
  - `off` — nie nachfragen.
  - `on-miss` — nur nachfragen, wenn die Allowlist nicht übereinstimmt.
  - `always` — bei jedem Befehl nachfragen. Dauerhaftes Vertrauen durch `allow-always` unterdrückt Nachfragen **nicht**, wenn der wirksame ask-Modus `always` ist.

</ParamField>

### `askFallback`

<ParamField path="askFallback" type='"deny" | "allowlist" | "full"'>
  Auflösung, wenn eine Rückfrage erforderlich ist, aber keine UI erreichbar ist.

- `deny` — blockieren.
- `allowlist` — nur erlauben, wenn die Allowlist übereinstimmt.
- `full` — erlauben.

</ParamField>

### `tools.exec.strictInlineEval`

<ParamField path="strictInlineEval" type="boolean">
  Wenn `true`, behandelt OpenClaw Inline-Code-Eval-Formen als nur per Freigabe erlaubt,
  selbst wenn die Interpreter-Binärdatei selbst in der Allowlist enthalten ist. Defense-in-depth
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

Im strikten Modus benötigen diese Befehle weiterhin eine explizite Freigabe, und
`allow-always` speichert für sie nicht automatisch neue Allowlist-Einträge.

## YOLO-Modus (ohne Freigabe)

Wenn Sie möchten, dass Host-Exec ohne Freigabeaufforderungen läuft, müssen Sie
**beide** Policy-Ebenen öffnen — die angeforderte Exec-Policy in der OpenClaw-Konfiguration
(`tools.exec.*`) **und** die host-lokale Freigabe-Policy in
`~/.openclaw/exec-approvals.json`.

YOLO ist das Standard-Host-Verhalten, sofern Sie es nicht explizit verschärfen:

| Ebene                 | YOLO-Einstellung          |
| --------------------- | -------------------------- |
| `tools.exec.security` | `full` auf `gateway`/`node` |
| `tools.exec.ask`      | `off`                      |
| Host `askFallback`    | `full`                     |

<Warning>
**Wichtige Unterscheidungen:**

- `tools.exec.host=auto` wählt aus, **wo** Exec läuft: in der Sandbox, wenn verfügbar, andernfalls auf dem Gateway.
- YOLO wählt aus, **wie** Host-Exec freigegeben wird: `security=full` plus `ask=off`.
- Im YOLO-Modus fügt OpenClaw **keine** separate heuristische Freigabe-Gate für Befehlsverschleierung oder Skript-Preflight-Ablehnungsebene zusätzlich zur konfigurierten Host-Exec-Policy hinzu.
- `auto` macht Gateway-Routing nicht zu einer freien Außerkraftsetzung aus einer sandboxed Sitzung. Eine Anfrage pro Aufruf mit `host=node` ist aus `auto` erlaubt; `host=gateway` ist aus `auto` nur erlaubt, wenn keine Sandbox-Runtime aktiv ist. Für einen stabilen Nicht-Auto-Default setzen Sie `tools.exec.host` oder verwenden Sie `/exec host=...` explizit.

</Warning>

CLI-gestützte Provider, die ihren eigenen nicht interaktiven Berechtigungsmodus
bereitstellen, können dieser Policy folgen. Claude CLI fügt
`--permission-mode bypassPermissions` hinzu, wenn die von OpenClaw angeforderte Exec-Policy
YOLO ist. Überschreiben Sie dieses Backend-Verhalten mit expliziten Claude-Argumenten
unter `agents.defaults.cliBackends.claude-cli.args` / `resumeArgs` —
zum Beispiel `--permission-mode default`, `acceptEdits` oder
`bypassPermissions`.

Wenn Sie eine konservativere Einrichtung möchten, verschärfen Sie eine der Ebenen wieder auf
`allowlist` / `on-miss` oder `deny`.

### Persistente Gateway-Host-Einrichtung mit „nie nachfragen“

<Steps>
  <Step title="Angeforderte Konfigurations-Policy setzen">
    ```bash
    openclaw config set tools.exec.host gateway
    openclaw config set tools.exec.security full
    openclaw config set tools.exec.ask off
    openclaw gateway restart
    ```
  </Step>
  <Step title="Host-Freigabedatei abgleichen">
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

### Lokales Kürzel

```bash
openclaw exec-policy preset yolo
```

Dieses lokale Kürzel aktualisiert beides:

- Lokale `tools.exec.host/security/ask`.
- Lokale Defaults in `~/.openclaw/exec-approvals.json`.

Es ist absichtlich nur lokal. Um Gateway-Host- oder Node-Host-Freigaben
remote zu ändern, verwenden Sie `openclaw approvals set --gateway` oder
`openclaw approvals set --node <id|name|ip>`.

### Node-Host

Für einen Node-Host wenden Sie stattdessen dieselbe Freigabedatei auf diesem Node an:

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

- `openclaw exec-policy` synchronisiert keine Node-Freigaben.
- `openclaw exec-policy set --host node` wird abgelehnt.
- Node-Exec-Freigaben werden zur Laufzeit vom Node abgerufen, daher müssen auf Nodes zielende Aktualisierungen `openclaw approvals --node ...` verwenden.

</Note>

### Nur-Sitzung-Kürzel

- `/exec security=full ask=off` ändert nur die aktuelle Sitzung.
- `/elevated full` ist ein Break-Glass-Kürzel, das auch Exec-Freigaben für diese Sitzung überspringt.

Wenn die Host-Freigabedatei strenger bleibt als die Konfiguration, gewinnt weiterhin die strengere Host-Policy.

## Allowlist (pro Agent)

Allowlists gelten **pro Agent**. Wenn mehrere Agents vorhanden sind, wechseln Sie in der macOS-App den Agent, den Sie bearbeiten. Muster sind Glob-Übereinstimmungen.

Muster können aufgelöste Binärpfad-Globs oder reine Befehlsnamen-Globs sein.
Reine Namen entsprechen nur Befehlen, die über `PATH` aufgerufen werden, sodass `rg`
`/opt/homebrew/bin/rg` entsprechen kann, wenn der Befehl `rg` ist, aber **nicht**
`./rg` oder `/tmp/rg`. Verwenden Sie einen Pfad-Glob, wenn Sie einem bestimmten
Binärspeicherort vertrauen möchten.

Alte `agents.default`-Einträge werden beim Laden zu `agents.main` migriert.
Shell-Ketten wie `echo ok && pwd` müssen weiterhin für jedes Top-Level-Segment
die Allowlist-Regeln erfüllen.

Beispiele:

- `rg`
- `~/Projects/**/bin/peekaboo`
- `~/.local/bin/*`
- `/opt/homebrew/bin/rg`

Jeder Allowlist-Eintrag verfolgt:

| Feld               | Bedeutung                                  |
| ------------------ | ------------------------------------------ |
| `id`               | Stabile UUID, die für UI-Identität genutzt wird |
| `lastUsedAt`       | Zeitstempel der letzten Verwendung         |
| `lastUsedCommand`  | Letzter Befehl, der übereinstimmte         |
| `lastResolvedPath` | Letzter aufgelöster Binärpfad              |

## Skill-CLIs automatisch erlauben

Wenn **Skill-CLIs automatisch erlauben** aktiviert ist, werden ausführbare Dateien, auf die
bekannte Skills verweisen, auf Nodes (macOS-Node oder headless Node-Host) als in der Allowlist enthalten behandelt. Dies nutzt `skills.bins` über den Gateway-RPC, um die
Skill-Bin-Liste abzurufen. Deaktivieren Sie dies, wenn Sie strikt manuelle Allowlists möchten.

<Warning>
- Dies ist eine **implizite Komfort-Allowlist**, getrennt von manuellen Pfad-Allowlist-Einträgen.
- Sie ist für Umgebungen mit vertrauenswürdigen Operatoren gedacht, in denen Gateway und Node innerhalb derselben Vertrauensgrenze liegen.
- Wenn Sie strikt explizites Vertrauen benötigen, behalten Sie `autoAllowSkills: false` bei und verwenden Sie ausschließlich manuelle Pfad-Allowlist-Einträge.

</Warning>

## Sichere Bins und Freigabeweiterleitung

Für sichere Bins (den schnellen stdin-only-Pfad), Details zur Interpreter-Bindung und
wie Sie Freigabeaufforderungen an Slack/Discord/Telegram weiterleiten (oder sie als
native Freigabeclients ausführen), siehe
[Exec-Freigaben — Erweitert](/de/tools/exec-approvals-advanced).

## Bearbeitung in der Control UI

Verwenden Sie die Karte **Control UI → Nodes → Exec-Freigaben**, um Defaults,
Überschreibungen pro Agent und Allowlists zu bearbeiten. Wählen Sie einen Scope (Defaults oder einen Agent),
passen Sie die Policy an, fügen Sie Allowlist-Muster hinzu oder entfernen Sie sie, und klicken Sie dann auf **Speichern**. Die UI
zeigt Metadaten zur letzten Verwendung pro Muster an, damit Sie die Liste aufgeräumt halten können.

Der Zielselektor wählt **Gateway** (lokale Genehmigungen) oder eine **Node**.
Nodes müssen `system.execApprovals.get/set` ankündigen (macOS-App oder
Headless-Node-Host). Wenn eine Node noch keine Exec-Genehmigungen ankündigt,
bearbeiten Sie ihre lokale `~/.openclaw/exec-approvals.json` direkt.

CLI: `openclaw approvals` unterstützt die Bearbeitung von Gateway oder Node — siehe
[Genehmigungs-CLI](/de/cli/approvals).

## Genehmigungsablauf

Wenn eine Eingabeaufforderung erforderlich ist, sendet das Gateway
`exec.approval.requested` an Operator-Clients. Die Control UI und die macOS-
App lösen sie über `exec.approval.resolve` auf, anschließend leitet das Gateway die
genehmigte Anfrage an den Node-Host weiter.

Für `host=node` enthalten Genehmigungsanfragen eine kanonische `systemRunPlan`-
Nutzlast. Das Gateway verwendet diesen Plan als maßgeblichen
Befehls-/cwd-/Sitzungskontext, wenn genehmigte `system.run`-
Anfragen weitergeleitet werden.

Das ist für asynchrone Genehmigungslatenz wichtig:

- Der Node-Exec-Pfad bereitet vorab einen kanonischen Plan vor.
- Der Genehmigungsdatensatz speichert diesen Plan und seine Bindungsmetadaten.
- Nach der Genehmigung verwendet der final weitergeleitete `system.run`-Aufruf den gespeicherten Plan wieder, anstatt späteren Änderungen des Aufrufers zu vertrauen.
- Wenn der Aufrufer `command`, `rawCommand`, `cwd`, `agentId` oder `sessionKey` ändert, nachdem die Genehmigungsanfrage erstellt wurde, lehnt das Gateway die weitergeleitete Ausführung als Genehmigungsabweichung ab.

## Systemereignisse

Der Exec-Lebenszyklus wird als Systemnachrichten angezeigt:

- `Exec running` (nur wenn der Befehl den Schwellenwert für die Laufhinweis-Meldung überschreitet).
- `Exec finished`.
- `Exec denied`.

Diese werden in die Sitzung des Agenten gepostet, nachdem die Node das Ereignis meldet.
Exec-Genehmigungen auf Gateway-Host-Ebene geben dieselben Lebenszyklusereignisse aus, wenn der
Befehl abgeschlossen ist (und optional, wenn er länger als der Schwellenwert läuft).
Genehmigungspflichtige Execs verwenden die Genehmigungs-ID als `runId` in diesen
Nachrichten wieder, um die Korrelation zu erleichtern.

## Verhalten bei abgelehnten Genehmigungen

Wenn eine asynchrone Exec-Genehmigung abgelehnt wird, verhindert OpenClaw, dass der Agent
Ausgaben aus einer früheren Ausführung desselben Befehls in der Sitzung
wiederverwendet. Der Ablehnungsgrund wird mit explizitem Hinweis übergeben, dass keine Befehlsausgabe
verfügbar ist. Dadurch wird verhindert, dass der Agent behauptet, es gebe neue Ausgaben, oder
den abgelehnten Befehl mit veralteten Ergebnissen aus einer früheren erfolgreichen
Ausführung wiederholt.

## Auswirkungen

- **`full`** ist mächtig; bevorzugen Sie nach Möglichkeit Allowlists.
- **`ask`** hält Sie eingebunden und ermöglicht trotzdem schnelle Genehmigungen.
- Agentenspezifische Allowlists verhindern, dass Genehmigungen eines Agenten in andere übergehen.
- Genehmigungen gelten nur für Host-Exec-Anfragen von **autorisierten Absendern**. Nicht autorisierte Absender können kein `/exec` ausführen.
- `/exec security=full` ist eine sitzungsweite Komfortfunktion für autorisierte Operatoren und überspringt Genehmigungen absichtlich. Um Host-Exec hart zu blockieren, setzen Sie die Genehmigungssicherheit auf `deny` oder verweigern Sie das Tool `exec` über die Tool-Richtlinie.

## Verwandt

<CardGroup cols={2}>
  <Card title="Exec-Genehmigungen — erweitert" href="/de/tools/exec-approvals-advanced" icon="gear">
    Sichere Bins, Interpreter-Bindung und Genehmigungsweiterleitung an den Chat.
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
    Wann welches Steuerelement verwendet werden sollte.
  </Card>
  <Card title="Skills" href="/de/tools/skills" icon="sparkles">
    Skill-gestütztes Verhalten für automatische Zulassung.
  </Card>
</CardGroup>
