---
read_when:
    - Exec-Genehmigungen oder Allowlists konfigurieren
    - UX für Exec-Genehmigungen in der macOS-App implementieren
    - Prompts für Sandbox-Escapes und ihre Auswirkungen prüfen
sidebarTitle: Exec approvals
summary: 'Host-Exec-Genehmigungen: Richtlinienoptionen, Allowlists und der YOLO-/Strict-Workflow'
title: Exec-Genehmigungen
x-i18n:
    generated_at: "2026-04-26T11:40:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: 868cee97882f7298a092bdcb9ec8fd058a5d7cb8745fad2edd712fabfb512e52
    source_path: tools/exec-approvals.md
    workflow: 15
---

Exec-Genehmigungen sind das **Schutzgeländer der Companion-App / des Node-Hosts**, damit ein in einer Sandbox laufender Agent Befehle auf einem echten Host (`gateway` oder `node`) ausführen kann. Eine Sicherheitsverriegelung: Befehle sind nur erlaubt, wenn Richtlinie + Allowlist + (optionale) Benutzerfreigabe alle zustimmen. Exec-Genehmigungen werden **zusätzlich** zu Tool-Richtlinie und Elevated-Gating angewendet (außer Elevated ist auf `full` gesetzt; dann werden Genehmigungen übersprungen).

<Note>
Die effektive Richtlinie ist die **strengere** aus `tools.exec.*` und den Standardwerten für Genehmigungen; wenn ein Genehmigungsfeld weggelassen wird, wird der Wert aus `tools.exec` verwendet. Host-Exec verwendet außerdem den lokalen Genehmigungsstatus auf diesem Rechner — ein hostlokales `ask: "always"` in `~/.openclaw/exec-approvals.json` fragt weiterhin nach, auch wenn Sitzungs- oder Konfigurationsstandards `ask: "on-miss"` anfordern.
</Note>

## Die effektive Richtlinie prüfen

| Befehl                                                           | Was angezeigt wird                                                                       |
| ---------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `openclaw approvals get` / `--gateway` / `--node <id\|name\|ip>` | Angeforderte Richtlinie, Quellen der Host-Richtlinie und das effektive Ergebnis.         |
| `openclaw exec-policy show`                                      | Zusammengeführte Ansicht des lokalen Rechners.                                           |
| `openclaw exec-policy set` / `preset`                            | Synchronisiert die lokal angeforderte Richtlinie in einem Schritt mit der lokalen Host-Genehmigungsdatei. |

Wenn ein lokaler Bereich `host=node` anfordert, meldet `exec-policy show`
diesen Bereich zur Laufzeit als node-verwaltet, statt so zu tun, als wäre die lokale
Genehmigungsdatei die maßgebliche Quelle.

Wenn die UI der Companion-App **nicht verfügbar** ist, wird jede Anfrage, die normalerweise
eine Eingabeaufforderung anzeigen würde, über den **Ask-Fallback** aufgelöst
(Standard: `deny`).

<Tip>
Native Chat-Genehmigungs-Clients können kanalspezifische Bedienelemente auf der
ausstehenden Genehmigungsnachricht bereitstellen. Zum Beispiel hinterlegt Matrix Reaktionskürzel
(`✅` einmal erlauben, `❌` ablehnen, `♾️` immer erlauben) und lässt dennoch
`/approve ...`-Befehle in der Nachricht als Fallback stehen.
</Tip>

## Wo es angewendet wird

Exec-Genehmigungen werden lokal auf dem Ausführungshost erzwungen:

- **Gateway-Host** → Prozess `openclaw` auf dem Gateway-Rechner.
- **Node-Host** → Node-Runner (macOS-Companion-App oder headless Node-Host).

### Vertrauensmodell

- Über das Gateway authentifizierte Aufrufer sind vertrauenswürdige Operatoren für dieses Gateway.
- Gekoppelte Nodes erweitern diese Fähigkeit vertrauenswürdiger Operatoren auf den Node-Host.
- Exec-Genehmigungen verringern das Risiko versehentlicher Ausführung, sind aber **keine** Authentifizierungsgrenze pro Benutzer.
- Genehmigte Ausführungen auf dem Node-Host binden den kanonischen Ausführungskontext: kanonisches cwd, exaktes argv, env-Bindung, wenn vorhanden, und angehefteten Pfad zur ausführbaren Datei, sofern zutreffend.
- Für Shell-Skripte und direkte Dateiaufrufe von Interpretern/Runtimes versucht OpenClaw außerdem, genau einen konkreten lokalen Dateiope randen zu binden. Wenn sich diese gebundene Datei nach der Genehmigung, aber vor der Ausführung ändert, wird die Ausführung verweigert, statt geänderten Inhalt auszuführen.
- Dateibindung ist absichtlich Best-Effort und **kein** vollständiges semantisches Modell aller Ladepfade von Interpretern/Runtimes. Wenn der Genehmigungsmodus nicht genau eine konkrete lokale Datei zur Bindung identifizieren kann, verweigert er eine genehmigungsgestützte Ausführung, statt vollständige Abdeckung vorzutäuschen.

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
  - `deny` — blockiert alle Host-Exec-Anfragen.
  - `allowlist` — erlaubt nur Befehle aus der Allowlist.
  - `full` — erlaubt alles (entspricht Elevated).
</ParamField>

### `exec.ask`

<ParamField path="ask" type='"off" | "on-miss" | "always"'>
  - `off` — fragt nie nach.
  - `on-miss` — fragt nur nach, wenn die Allowlist nicht passt.
  - `always` — fragt bei jedem Befehl nach. Dauerhaftes Vertrauen durch `allow-always` unterdrückt Eingabeaufforderungen **nicht**, wenn der effektive Ask-Modus `always` ist.
</ParamField>

### `askFallback`

<ParamField path="askFallback" type='"deny" | "allowlist" | "full"'>
  Auflösung, wenn eine Eingabeaufforderung erforderlich ist, aber keine UI erreichbar ist.

- `deny` — blockieren.
- `allowlist` — nur erlauben, wenn die Allowlist passt.
- `full` — erlauben.
  </ParamField>

### `tools.exec.strictInlineEval`

<ParamField path="strictInlineEval" type="boolean">
  Wenn `true`, behandelt OpenClaw Inline-Code-Eval-Formen als nur per Genehmigung erlaubt,
  selbst wenn das Interpreter-Binary selbst in der Allowlist steht. Defense-in-Depth
  für Interpreter-Loader, die sich nicht sauber auf einen stabilen Dateioperanden
  abbilden lassen.
</ParamField>

Beispiele, die der Strict-Modus erfasst:

- `python -c`
- `node -e`, `node --eval`, `node -p`
- `ruby -e`
- `perl -e`, `perl -E`
- `php -r`
- `lua -e`
- `osascript -e`

Im Strict-Modus benötigen diese Befehle weiterhin eine explizite Genehmigung, und
`allow-always` speichert für sie nicht automatisch neue Allowlist-Einträge.

## YOLO-Modus (ohne Genehmigung)

Wenn Sie möchten, dass Host-Exec ohne Genehmigungsabfragen ausgeführt wird, müssen Sie
**beide** Richtlinienebenen öffnen — die angeforderte Exec-Richtlinie in der OpenClaw-Konfiguration
(`tools.exec.*`) **und** die hostlokale Genehmigungsrichtlinie in
`~/.openclaw/exec-approvals.json`.

YOLO ist das Standardverhalten des Hosts, sofern Sie es nicht explizit verschärfen:

| Ebene                 | YOLO-Einstellung            |
| --------------------- | --------------------------- |
| `tools.exec.security` | `full` auf `gateway`/`node` |
| `tools.exec.ask`      | `off`                       |
| Host-`askFallback`    | `full`                      |

<Warning>
**Wichtige Unterschiede:**

- `tools.exec.host=auto` wählt **wo** Exec ausgeführt wird: in der Sandbox, wenn verfügbar, andernfalls auf dem Gateway.
- YOLO wählt **wie** Host-Exec genehmigt wird: `security=full` plus `ask=off`.
- Im YOLO-Modus fügt OpenClaw **keine** separate heuristische Genehmigungssperre für Befehlsverschleierung oder zusätzliche Ebene zur Skript-Vorprüfung auf Ablehnung über die konfigurierte Host-Exec-Richtlinie hinaus hinzu.
- `auto` macht Gateway-Routing nicht zu einem kostenlosen Override aus einer Sandbox-Sitzung heraus. Eine Anfrage pro Aufruf mit `host=node` ist von `auto` aus erlaubt; `host=gateway` ist von `auto` aus nur erlaubt, wenn keine Sandbox-Laufzeit aktiv ist. Für einen stabilen Standardwert ohne `auto` setzen Sie `tools.exec.host` oder verwenden Sie `/exec host=...` explizit.
  </Warning>

CLI-gestützte Provider, die ihren eigenen nicht interaktiven Berechtigungsmodus
bereitstellen, können dieser Richtlinie folgen. Claude CLI fügt
`--permission-mode bypassPermissions` hinzu, wenn die von OpenClaw angeforderte Exec-
Richtlinie YOLO ist. Überschreiben Sie dieses Backend-Verhalten mit expliziten Claude-Argumenten
unter `agents.defaults.cliBackends.claude-cli.args` / `resumeArgs` —
zum Beispiel `--permission-mode default`, `acceptEdits` oder
`bypassPermissions`.

Wenn Sie eine konservativere Einrichtung möchten, verschärfen Sie eine der beiden Ebenen wieder auf
`allowlist` / `on-miss` oder `deny`.

### Persistente Einrichtung „nie nachfragen“ für Gateway-Hosts

<Steps>
  <Step title="Die angeforderte Konfigurationsrichtlinie setzen">
    ```bash
    openclaw config set tools.exec.host gateway
    openclaw config set tools.exec.security full
    openclaw config set tools.exec.ask off
    openclaw gateway restart
    ```
  </Step>
  <Step title="Mit der Host-Genehmigungsdatei abgleichen">
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

- Lokale `tools.exec.host/security/ask`.
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
**Nur-lokal-Beschränkungen:**

- `openclaw exec-policy` synchronisiert keine Node-Genehmigungen.
- `openclaw exec-policy set --host node` wird abgelehnt.
- Exec-Genehmigungen für Nodes werden zur Laufzeit vom Node abgerufen, daher müssen nodegerichtete Aktualisierungen `openclaw approvals --node ...` verwenden.
  </Note>

### Abkürzung nur für die Sitzung

- `/exec security=full ask=off` ändert nur die aktuelle Sitzung.
- `/elevated full` ist eine Break-Glass-Abkürzung, die Exec-Genehmigungen für diese Sitzung ebenfalls überspringt.

Wenn die Host-Genehmigungsdatei strenger bleibt als die Konfiguration, gewinnt weiterhin die strengere Host-Richtlinie.

## Allowlist (pro Agent)

Allowlists gelten **pro Agent**. Wenn mehrere Agenten existieren, wechseln Sie in der macOS-App,
welchen Agenten Sie bearbeiten. Muster werden als Glob-Matches abgeglichen.

Muster können Globs für aufgelöste Binary-Pfade oder Globs für bloße Befehlsnamen sein.
Bloße Namen passen nur auf Befehle, die über `PATH` aufgerufen werden, sodass `rg`
auf `/opt/homebrew/bin/rg` passen kann, wenn der Befehl `rg` ist, aber **nicht** auf `./rg` oder
`/tmp/rg`. Verwenden Sie ein Pfad-Glob, wenn Sie genau einem bestimmten Binary-Speicherort vertrauen möchten.

Veraltete Einträge `agents.default` werden beim Laden nach `agents.main` migriert.
Shell-Ketten wie `echo ok && pwd` erfordern weiterhin, dass jedes Segment auf oberster Ebene
die Regeln der Allowlist erfüllt.

Beispiele:

- `rg`
- `~/Projects/**/bin/peekaboo`
- `~/.local/bin/*`
- `/opt/homebrew/bin/rg`

Jeder Allowlist-Eintrag verfolgt:

| Feld               | Bedeutung                               |
| ------------------ | --------------------------------------- |
| `id`               | Stabile UUID für die UI-Identität       |
| `lastUsedAt`       | Zeitstempel der letzten Verwendung      |
| `lastUsedCommand`  | Letzter passender Befehl                |
| `lastResolvedPath` | Letzter aufgelöster Binary-Pfad         |

## Skill-CLIs automatisch erlauben

Wenn **Skill-CLIs automatisch erlauben** aktiviert ist, werden ausführbare Dateien, auf die sich
bekannte Skills beziehen, auf Nodes (macOS-Node oder headless Node-Host) so behandelt, als stünden sie in der Allowlist. Dies verwendet `skills.bins` über das Gateway-RPC, um die
Skill-Bin-Liste abzurufen. Deaktivieren Sie dies, wenn Sie strikte manuelle Allowlists möchten.

<Warning>
- Dies ist eine **implizite Komfort-Allowlist**, getrennt von manuellen Pfad-Allowlist-Einträgen.
- Sie ist für vertrauenswürdige Operatorumgebungen gedacht, in denen Gateway und Node dieselbe Vertrauensgrenze teilen.
- Wenn Sie striktes explizites Vertrauen benötigen, lassen Sie `autoAllowSkills: false` und verwenden Sie nur manuelle Pfad-Allowlist-Einträge.
</Warning>

## Sichere Bins und Weiterleitung von Genehmigungen

Informationen zu sicheren Bins (dem Fast-Path nur über stdin), Details zur Interpreter-Bindung und
dazu, wie Genehmigungsabfragen an Slack/Discord/Telegram weitergeleitet werden können (oder wie diese als
native Genehmigungs-Clients betrieben werden), finden Sie unter
[Exec-Genehmigungen — erweitert](/de/tools/exec-approvals-advanced).

## Bearbeitung in der Control UI

Verwenden Sie in der **Control UI → Nodes → Exec approvals**-Karte zum Bearbeiten von Standardwerten,
Überschreibungen pro Agent und Allowlists. Wählen Sie einen Bereich (Standards oder einen Agenten),
passen Sie die Richtlinie an, fügen Sie Allowlist-Muster hinzu oder entfernen Sie sie und klicken Sie dann auf **Save**. Die UI
zeigt Metadaten zur letzten Verwendung pro Muster an, damit Sie die Liste sauber halten können.

Die Zielauswahl wählt **Gateway** (lokale Genehmigungen) oder einen **Node**.
Nodes müssen `system.execApprovals.get/set` bekanntgeben (macOS-App oder
headless Node-Host). Wenn ein Node Exec-Genehmigungen noch nicht bekanntgibt,
bearbeiten Sie dessen lokale Datei `~/.openclaw/exec-approvals.json` direkt.

CLI: `openclaw approvals` unterstützt die Bearbeitung für Gateway oder Node — siehe
[Approvals CLI](/de/cli/approvals).

## Genehmigungsablauf

Wenn eine Eingabeaufforderung erforderlich ist, sendet das Gateway
`exec.approval.requested` an Operator-Clients. Die Control UI und die macOS-
App lösen dies über `exec.approval.resolve` auf, danach leitet das Gateway die
genehmigte Anfrage an den Node-Host weiter.

Für `host=node` enthalten Genehmigungsanfragen eine kanonische Payload
`systemRunPlan`. Das Gateway verwendet diesen Plan als maßgeblichen
Befehls-/cwd-/Sitzungskontext, wenn genehmigte Anfragen `system.run`
weitergeleitet werden.

Das ist für asynchrone Latenz bei Genehmigungen wichtig:

- Der Node-Exec-Pfad bereitet im Voraus einen kanonischen Plan vor.
- Der Genehmigungsdatensatz speichert diesen Plan und seine Bindungsmetadaten.
- Nach der Genehmigung verwendet der abschließend weitergeleitete Aufruf `system.run` den gespeicherten Plan wieder, statt späteren Änderungen des Aufrufers zu vertrauen.
- Wenn der Aufrufer `command`, `rawCommand`, `cwd`, `agentId` oder `sessionKey` ändert, nachdem die Genehmigungsanfrage erstellt wurde, lehnt das Gateway die weitergeleitete Ausführung als Genehmigungsabweichung ab.

## Systemereignisse

Der Exec-Lebenszyklus wird als Systemnachrichten bereitgestellt:

- `Exec running` (nur wenn der Befehl den Schwellenwert für eine Laufmeldung überschreitet).
- `Exec finished`.
- `Exec denied`.

Diese werden an die Sitzung des Agenten gesendet, nachdem der Node das Ereignis gemeldet hat.
Exec-Genehmigungen auf dem Gateway-Host geben dieselben Lebenszyklusereignisse aus, wenn der
Befehl abgeschlossen ist (und optional, wenn er länger als der Schwellenwert läuft).
Execs mit Genehmigungsgating verwenden die Genehmigungs-ID in diesen
Nachrichten erneut als `runId`, damit sie leicht korreliert werden können.

## Verhalten bei verweigerter Genehmigung

Wenn eine asynchrone Exec-Genehmigung verweigert wird, verhindert OpenClaw, dass der Agent
Ausgaben einer früheren Ausführung desselben Befehls in der Sitzung wiederverwendet.
Der Grund für die Verweigerung wird zusammen mit einer expliziten Anweisung übergeben, dass keine Befehlsausgabe verfügbar ist.
Dadurch wird verhindert, dass der Agent behauptet, es gebe neue Ausgaben, oder den abgelehnten Befehl mit veralteten Ergebnissen aus einer früheren erfolgreichen Ausführung wiederholt.

## Auswirkungen

- **`full`** ist mächtig; bevorzugen Sie wenn möglich Allowlists.
- **`ask`** hält Sie im Loop und erlaubt dennoch schnelle Genehmigungen.
- Allowlists pro Agent verhindern, dass Genehmigungen eines Agenten in andere durchsickern.
- Genehmigungen gelten nur für Host-Exec-Anfragen von **autorisierten Sendern**. Nicht autorisierte Sender können `/exec` nicht ausführen.
- `/exec security=full` ist eine Komfortfunktion auf Sitzungsebene für autorisierte Operatoren und überspringt Genehmigungen absichtlich. Um Host-Exec hart zu blockieren, setzen Sie die Sicherheit für Genehmigungen auf `deny` oder verweigern Sie das Tool `exec` per Tool-Richtlinie.

## Verwandt

<CardGroup cols={2}>
  <Card title="Exec-Genehmigungen — erweitert" href="/de/tools/exec-approvals-advanced" icon="gear">
    Sichere Bins, Interpreter-Bindung und Weiterleitung von Genehmigungen an Chat.
  </Card>
  <Card title="Exec-Tool" href="/de/tools/exec" icon="terminal">
    Tool zur Ausführung von Shell-Befehlen.
  </Card>
  <Card title="Elevated-Modus" href="/de/tools/elevated" icon="shield-exclamation">
    Break-Glass-Pfad, der Genehmigungen ebenfalls überspringt.
  </Card>
  <Card title="Sandboxing" href="/de/gateway/sandboxing" icon="box">
    Sandbox-Modi und Workspace-Zugriff.
  </Card>
  <Card title="Sicherheit" href="/de/gateway/security" icon="lock">
    Sicherheitsmodell und Härtung.
  </Card>
  <Card title="Sandbox vs. Tool-Richtlinie vs. Elevated" href="/de/gateway/sandbox-vs-tool-policy-vs-elevated" icon="sliders">
    Wann welche Steuerung verwendet werden sollte.
  </Card>
  <Card title="Skills" href="/de/tools/skills" icon="sparkles">
    Skill-gestütztes Verhalten für automatisches Erlauben.
  </Card>
</CardGroup>
