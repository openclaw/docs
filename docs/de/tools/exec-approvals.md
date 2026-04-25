---
read_when:
    - Konfigurieren von Ausführungsfreigaben oder Allowlists
    - Implementierung der UX für Ausführungsfreigaben in der macOS-App
    - Überprüfen von Sandbox-Escape-Aufforderungen und ihren Auswirkungen
summary: Ausführungsfreigaben, Allowlists und Sandbox-Escape-Aufforderungen
title: Ausführungsfreigaben
x-i18n:
    generated_at: "2026-04-25T13:57:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: 44bf7af57d322280f6d0089207041214b1233d0c9eca99656d51fc4aed88941b
    source_path: tools/exec-approvals.md
    workflow: 15
---

Ausführungsfreigaben sind die **Schutzmaßnahme der Companion-App bzw. des Node-Hosts**, um einen in einer Sandbox laufenden Agenten Befehle auf einem echten Host (`gateway` oder `node`) ausführen zu lassen. Eine Sicherheitsverriegelung: Befehle sind nur erlaubt, wenn Richtlinie + Allowlist + (optionale) Benutzerfreigabe alle zustimmen. Ausführungsfreigaben kommen **zusätzlich** zur Tool-Richtlinie und zum Elevated-Gating hinzu (außer wenn Elevated auf `full` gesetzt ist; dann werden Freigaben übersprungen).

<Note>
Die effektive Richtlinie ist die **strengere** von `tools.exec.*` und den Standardwerten für Freigaben; wenn ein Feld für Freigaben ausgelassen wird, wird der Wert aus `tools.exec` verwendet. Host-Ausführung verwendet außerdem den lokalen Freigabestatus auf diesem Rechner — ein hostlokales `ask: "always"` in `~/.openclaw/exec-approvals.json` fragt weiter nach, selbst wenn Sitzungs- oder Konfigurationsstandards `ask: "on-miss"` anfordern.
</Note>

## Die effektive Richtlinie prüfen

- `openclaw approvals get`, `... --gateway`, `... --node <id|name|ip>` — zeigen die angeforderte Richtlinie, die Quellen der Host-Richtlinie und das effektive Ergebnis an.
- `openclaw exec-policy show` — zusammengeführte Ansicht auf dem lokalen Rechner.
- `openclaw exec-policy set|preset` — synchronisiert die lokal angeforderte Richtlinie in einem Schritt mit der lokalen Host-Freigabedatei.

Wenn ein lokaler Bereich `host=node` anfordert, meldet `exec-policy show` diesen Bereich zur Laufzeit als node-verwaltet, statt so zu tun, als wäre die lokale Freigabedatei die maßgebliche Quelle.

Wenn die UI der Companion-App **nicht verfügbar** ist, wird jede Anforderung, die normalerweise eine Rückfrage auslösen würde, über den **Ask-Fallback** entschieden (Standard: deny).

<Tip>
Native Chat-Freigabeclients können kanalspezifische Bedienelemente in die ausstehende Freigabenachricht einfügen. Matrix legt zum Beispiel Reaktions-Shortcuts an (`✅` einmal erlauben, `❌` ablehnen, `♾️` immer erlauben) und lässt dennoch `/approve ...`-Befehle in der Nachricht als Fallback stehen.
</Tip>

## Wo dies gilt

Ausführungsfreigaben werden lokal auf dem Ausführungshost erzwungen:

- **Gateway-Host** → `openclaw`-Prozess auf dem Gateway-Rechner
- **Node-Host** → Node-Runner (macOS-Companion-App oder Headless-Node-Host)

Hinweis zum Vertrauensmodell:

- Über Gateway authentifizierte Aufrufer sind vertrauenswürdige Operatoren für dieses Gateway.
- Gekoppelte Nodes erweitern diese Fähigkeit als vertrauenswürdige Operatoren auf den Node-Host.
- Ausführungsfreigaben verringern das Risiko unbeabsichtigter Ausführung, sind aber keine Authentifizierungsgrenze pro Benutzer.
- Freigegebene Ausführungen auf dem Node-Host binden einen kanonischen Ausführungskontext: kanonisches `cwd`, exaktes `argv`, `env`-Bindung, wenn vorhanden, und angehefteten Pfad zur ausführbaren Datei, sofern zutreffend.
- Für Shell-Skripte und direkte Datei-Aufrufe von Interpretern/Runtimes versucht OpenClaw außerdem, genau einen konkreten lokalen Dateioperand zu binden. Wenn sich diese gebundene Datei nach der Freigabe, aber vor der Ausführung ändert, wird die Ausführung verweigert, statt veränderten Inhalt auszuführen.
- Diese Dateibindung ist absichtlich eine Best-Effort-Lösung und kein vollständiges semantisches Modell aller Ladepfade von Interpretern/Runtimes. Wenn der Freigabemodus nicht genau eine konkrete lokale Datei zum Binden identifizieren kann, verweigert er das Erstellen einer freigabegestützten Ausführung, statt vollständige Abdeckung vorzutäuschen.

macOS-Aufteilung:

- **Node-Host-Dienst** leitet `system.run` über lokales IPC an die **macOS-App** weiter.
- **macOS-App** erzwingt Freigaben und führt den Befehl im UI-Kontext aus.

## Einstellungen und Speicherung

Freigaben liegen in einer lokalen JSON-Datei auf dem Ausführungshost:

`~/.openclaw/exec-approvals.json`

Beispiel-Schema:

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

## „YOLO“-Modus ohne Freigaben

Wenn du die Host-Ausführung ohne Freigabeaufforderungen ausführen möchtest, musst du **beide** Richtlinienebenen öffnen:

- angeforderte Ausführungsrichtlinie in der OpenClaw-Konfiguration (`tools.exec.*`)
- hostlokale Freigaberichtlinie in `~/.openclaw/exec-approvals.json`

Dies ist jetzt das Standardverhalten für Hosts, sofern du es nicht explizit strenger konfigurierst:

- `tools.exec.security`: `full` auf `gateway`/`node`
- `tools.exec.ask`: `off`
- Host-`askFallback`: `full`

Wichtige Unterscheidung:

- `tools.exec.host=auto` wählt, wo die Ausführung läuft: in der Sandbox, wenn verfügbar, andernfalls auf dem Gateway.
- YOLO legt fest, wie Host-Ausführung freigegeben wird: `security=full` plus `ask=off`.
- CLI-basierte Anbieter, die ihren eigenen nicht interaktiven Berechtigungsmodus bereitstellen, können dieser Richtlinie folgen.
  Claude CLI fügt `--permission-mode bypassPermissions` hinzu, wenn die von OpenClaw angeforderte Ausführungsrichtlinie YOLO ist. Überschreibe dieses Backend-Verhalten mit expliziten Claude-Argumenten unter
  `agents.defaults.cliBackends.claude-cli.args` / `resumeArgs`, zum Beispiel
  `--permission-mode default`, `acceptEdits` oder `bypassPermissions`.
- Im YOLO-Modus fügt OpenClaw keine separate heuristische Freigabesperre für Befehlsverschleierung und keine Ebene zur Ablehnung von Skript-Preflight-Prüfungen zusätzlich zur konfigurierten Host-Ausführungsrichtlinie hinzu.
- `auto` macht das Routing über das Gateway nicht zu einer freien Überschreibung aus einer Sandbox-Sitzung heraus. Eine Anforderung `host=node` pro Aufruf ist aus `auto` heraus erlaubt, und `host=gateway` ist aus `auto` nur erlaubt, wenn keine Sandbox-Runtime aktiv ist. Wenn du einen stabilen Standard ohne `auto` möchtest, setze `tools.exec.host` oder verwende `/exec host=...` explizit.

Wenn du ein konservativeres Setup möchtest, verschärfe eine der beiden Ebenen wieder auf `allowlist` / `on-miss`
oder `deny`.

Persistentes Setup für „nie nachfragen“ auf dem Gateway-Host:

```bash
openclaw config set tools.exec.host gateway
openclaw config set tools.exec.security full
openclaw config set tools.exec.ask off
openclaw gateway restart
```

Setze dann die Host-Freigabedatei passend dazu:

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

Lokale Abkürzung für dieselbe Gateway-Host-Richtlinie auf dem aktuellen Rechner:

```bash
openclaw exec-policy preset yolo
```

Diese lokale Abkürzung aktualisiert beides:

- lokal `tools.exec.host/security/ask`
- lokal die Standardwerte in `~/.openclaw/exec-approvals.json`

Sie ist absichtlich nur lokal. Wenn du Freigaben auf Gateway-Hosts oder Node-Hosts aus der Ferne ändern musst, verwende weiterhin `openclaw approvals set --gateway` oder
`openclaw approvals set --node <id|name|ip>`.

Für einen Node-Host wende stattdessen dieselbe Freigabedatei auf diesem Node an:

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

Wichtige nur-lokal-Einschränkung:

- `openclaw exec-policy` synchronisiert keine Node-Freigaben
- `openclaw exec-policy set --host node` wird abgelehnt
- Freigaben für Node-Ausführung werden zur Laufzeit vom Node abgerufen, daher müssen Node-bezogene Aktualisierungen `openclaw approvals --node ...` verwenden

Abkürzung nur für die aktuelle Sitzung:

- `/exec security=full ask=off` ändert nur die aktuelle Sitzung.
- `/elevated full` ist eine Break-Glass-Abkürzung, die für diese Sitzung auch Ausführungsfreigaben überspringt.

Wenn die Host-Freigabedatei strenger bleibt als die Konfiguration, gilt weiterhin die strengere Host-Richtlinie.

## Richtlinienoptionen

### Sicherheit (`exec.security`)

- **deny**: alle Anforderungen für Host-Ausführung blockieren.
- **allowlist**: nur Befehle aus der Allowlist zulassen.
- **full**: alles zulassen (entspricht elevated).

### Nachfragen (`exec.ask`)

- **off**: nie nachfragen.
- **on-miss**: nur nachfragen, wenn die Allowlist nicht passt.
- **always**: bei jedem Befehl nachfragen.
- dauerhaftes Vertrauen mit `allow-always` unterdrückt keine Rückfragen, wenn der effektive Nachfragemodus `always` ist

### Ask-Fallback (`askFallback`)

Wenn eine Rückfrage erforderlich ist, aber keine UI erreichbar ist, entscheidet der Fallback:

- **deny**: blockieren.
- **allowlist**: nur zulassen, wenn die Allowlist passt.
- **full**: zulassen.

### Härtung für Inline-Interpreter-Eval (`tools.exec.strictInlineEval`)

Wenn `tools.exec.strictInlineEval=true`, behandelt OpenClaw Formen mit Inline-Code-Auswertung als nur per Freigabe erlaubt, selbst wenn die Interpreter-Binärdatei selbst auf der Allowlist steht.

Beispiele:

- `python -c`
- `node -e`, `node --eval`, `node -p`
- `ruby -e`
- `perl -e`, `perl -E`
- `php -r`
- `lua -e`
- `osascript -e`

Dies ist eine zusätzliche Schutzmaßnahme für Interpreter-Lader, die sich nicht sauber auf einen stabilen Dateioperand abbilden lassen. Im strikten Modus gilt:

- diese Befehle benötigen weiterhin eine explizite Freigabe;
- `allow-always` speichert für sie nicht automatisch neue Allowlist-Einträge.

## Allowlist (pro Agent)

Allowlists gelten **pro Agent**. Wenn mehrere Agenten existieren, wechsle in der macOS-App den Agenten, den du bearbeitest. Muster sind Glob-Treffer.
Muster können Globs für aufgelöste Binärpfade oder reine Befehlsnamens-Globs sein. Reine Namen
passen nur auf Befehle, die über PATH aufgerufen werden, sodass `rg` zu `/opt/homebrew/bin/rg`
passen kann, wenn der Befehl `rg` ist, aber nicht zu `./rg` oder `/tmp/rg`. Verwende ein Pfad-Glob, wenn du einem bestimmten Speicherort einer Binärdatei vertrauen möchtest.
Veraltete `agents.default`-Einträge werden beim Laden nach `agents.main` migriert.
Shell-Ketten wie `echo ok && pwd` erfordern weiterhin, dass jedes Segment der obersten Ebene die Allowlist-Regeln erfüllt.

Beispiele:

- `rg`
- `~/Projects/**/bin/peekaboo`
- `~/.local/bin/*`
- `/opt/homebrew/bin/rg`

Jeder Allowlist-Eintrag erfasst:

- **id** stabile UUID für die UI-Identität (optional)
- **last used** Zeitstempel
- **last used command**
- **last resolved path**

## Skill-CLIs automatisch erlauben

Wenn **Auto-allow skill CLIs** aktiviert ist, werden von bekannten Skills referenzierte ausführbare Dateien auf Nodes (macOS-Node oder Headless-Node-Host) als auf der Allowlist behandelt. Dies verwendet
`skills.bins` über Gateway-RPC, um die Liste der Skill-Binärdateien abzurufen. Deaktiviere dies, wenn du strikte manuelle Allowlists möchtest.

Wichtige Hinweise zum Vertrauen:

- Dies ist eine **implizite Komfort-Allowlist**, getrennt von manuellen Pfad-Allowlist-Einträgen.
- Sie ist für vertrauenswürdige Operator-Umgebungen gedacht, in denen Gateway und Node innerhalb derselben Vertrauensgrenze liegen.
- Wenn du strikt explizites Vertrauen benötigst, belasse `autoAllowSkills: false` und verwende nur manuelle Pfad-Allowlist-Einträge.

## Sichere Bins und Weiterleitung von Freigaben

Für sichere Bins (den stdin-only-Schnellpfad), Details zur Interpreter-Bindung und dazu, wie Freigabeaufforderungen an Slack/Discord/Telegram weitergeleitet werden können (oder wie sie als native Freigabeclients ausgeführt werden), siehe [Ausführungsfreigaben — erweitert](/de/tools/exec-approvals-advanced).

<!-- moved to /tools/exec-approvals-advanced -->

## Bearbeitung in der Control UI

Verwende die Karte **Control UI → Nodes → Exec approvals**, um Standardwerte, agentenspezifische Überschreibungen und Allowlists zu bearbeiten. Wähle einen Geltungsbereich (Standards oder einen Agenten), passe die Richtlinie an, füge Allowlist-Muster hinzu oder entferne sie, und klicke dann auf **Save**. Die UI zeigt Metadaten zu **last used** pro Muster an, damit du die Liste übersichtlich halten kannst.

Der Zielselektor wählt **Gateway** (lokale Freigaben) oder einen **Node**. Nodes
müssen `system.execApprovals.get/set` ankündigen (macOS-App oder Headless-Node-Host).
Wenn ein Node noch keine Ausführungsfreigaben ankündigt, bearbeite seine lokale
`~/.openclaw/exec-approvals.json` direkt.

CLI: `openclaw approvals` unterstützt die Bearbeitung für Gateway oder Node (siehe [Approvals CLI](/de/cli/approvals)).

## Freigabeablauf

Wenn eine Rückfrage erforderlich ist, sendet das Gateway `exec.approval.requested` an Operator-Clients.
Die Control UI und die macOS-App lösen dies über `exec.approval.resolve`, dann leitet das Gateway die
freigegebene Anforderung an den Node-Host weiter.

Für `host=node` enthalten Freigabeanforderungen eine kanonische `systemRunPlan`-Payload. Das Gateway verwendet
diesen Plan als maßgeblichen Befehl, `cwd` und Sitzungskontext, wenn freigegebene `system.run`-Anforderungen weitergeleitet werden.

Das ist für asynchrone Verzögerungen bei Freigaben wichtig:

- der Node-Ausführungspfad erstellt im Voraus einen kanonischen Plan
- der Freigabedatensatz speichert diesen Plan und seine Bindungsmetadaten
- nach der Freigabe verwendet der endgültig weitergeleitete `system.run`-Aufruf den gespeicherten Plan erneut,
  statt späteren Änderungen des Aufrufers zu vertrauen
- wenn der Aufrufer `command`, `rawCommand`, `cwd`, `agentId` oder
  `sessionKey` ändert, nachdem die Freigabeanforderung erstellt wurde, lehnt das Gateway die
  weitergeleitete Ausführung als Freigabeabweichung ab

## Systemereignisse

Der Ausführungslebenszyklus wird als Systemnachrichten angezeigt:

- `Exec running` (nur wenn der Befehl den Schwellenwert für die Laufend-Benachrichtigung überschreitet)
- `Exec finished`
- `Exec denied`

Diese werden in der Sitzung des Agenten gepostet, nachdem der Node das Ereignis gemeldet hat.
Ausführungsfreigaben auf dem Gateway-Host senden dieselben Lifecycle-Ereignisse, wenn der Befehl abgeschlossen ist (und optional, wenn er länger als der Schwellenwert läuft).
Durch Freigaben gesteuerte Ausführungen verwenden in diesen Nachrichten zur einfachen Zuordnung die Freigabe-ID erneut als `runId`.

## Verhalten bei verweigerter Freigabe

Wenn eine asynchrone Ausführungsfreigabe verweigert wird, verhindert OpenClaw, dass der Agent
Ausgaben aus einem früheren Lauf desselben Befehls in der Sitzung wiederverwendet. Der Grund für die Verweigerung
wird mit dem expliziten Hinweis weitergegeben, dass keine Befehlsausgabe verfügbar ist. Dadurch wird verhindert, dass
der Agent behauptet, es gebe neue Ausgabe, oder den verweigerten Befehl mit
veralteten Ergebnissen aus einem früheren erfolgreichen Lauf wiederholt.

## Auswirkungen

- **full** ist mächtig; verwende nach Möglichkeit Allowlists.
- **ask** hält dich im Ablauf, ermöglicht aber dennoch schnelle Freigaben.
- Allowlists pro Agent verhindern, dass Freigaben eines Agenten in andere durchsickern.
- Freigaben gelten nur für Anforderungen zur Host-Ausführung von **autorisierten Absendern**. Nicht autorisierte Absender können kein `/exec` ausführen.
- `/exec security=full` ist eine sitzungsbezogene Komfortfunktion für autorisierte Operatoren und überspringt Freigaben absichtlich. Um Host-Ausführung hart zu blockieren, setze die Freigabesicherheit auf `deny` oder verweigere das Tool `exec` über die Tool-Richtlinie.

## Zugehörig

<CardGroup cols={2}>
  <Card title="Ausführungsfreigaben — erweitert" href="/de/tools/exec-approvals-advanced" icon="gear">
    Sichere Bins, Interpreter-Bindung und Weiterleitung von Freigaben an Chats.
  </Card>
  <Card title="Exec-Tool" href="/de/tools/exec" icon="terminal">
    Tool zur Ausführung von Shell-Befehlen.
  </Card>
  <Card title="Elevated-Modus" href="/de/tools/elevated" icon="shield-exclamation">
    Break-Glass-Pfad, der ebenfalls Freigaben überspringt.
  </Card>
  <Card title="Sandboxing" href="/de/gateway/sandboxing" icon="box">
    Sandbox-Modi und Workspace-Zugriff.
  </Card>
  <Card title="Sicherheit" href="/de/gateway/security" icon="lock">
    Sicherheitsmodell und Härtung.
  </Card>
  <Card title="Sandbox vs Tool-Richtlinie vs Elevated" href="/de/gateway/sandbox-vs-tool-policy-vs-elevated" icon="sliders">
    Wann welche Steuerung verwendet werden sollte.
  </Card>
  <Card title="Skills" href="/de/tools/skills" icon="sparkles">
    Durch Skills gestütztes Verhalten für automatische Zulassung.
  </Card>
</CardGroup>
