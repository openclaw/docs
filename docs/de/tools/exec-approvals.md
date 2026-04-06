---
read_when:
    - Konfigurieren von Exec-Genehmigungen oder Allowlists
    - Implementieren der UX für Exec-Genehmigungen in der macOS-App
    - Überprüfen von Prompts zum Verlassen der Sandbox und deren Auswirkungen
summary: Exec-Genehmigungen, Allowlists und Prompts zum Verlassen der Sandbox
title: Exec-Genehmigungen
x-i18n:
    generated_at: "2026-04-06T03:13:38Z"
    model: gpt-5.4
    provider: openai
    source_hash: 39e91cd5c7615bdb9a6b201a85bde7514327910f6f12da5a4b0532bceb229c22
    source_path: tools/exec-approvals.md
    workflow: 15
---

# Exec-Genehmigungen

Exec-Genehmigungen sind die **Sicherheitsleitplanke der Companion-App / des Node-Hosts**, damit ein sandboxed Agent
Befehle auf einem echten Host (`gateway` oder `node`) ausführen kann. Stellen Sie sich das wie eine Sicherheitsverriegelung vor:
Befehle sind nur erlaubt, wenn Richtlinie + Allowlist + (optionale) Benutzerfreigabe alle zustimmen.
Exec-Genehmigungen gelten **zusätzlich** zu Tool-Richtlinie und Elevated-Gating (außer Elevated ist auf `full` gesetzt, was Genehmigungen überspringt).
Die effektive Richtlinie ist die **strengere** von `tools.exec.*` und den Standardwerten für Genehmigungen; wenn ein Feld für Genehmigungen weggelassen wird, wird der Wert aus `tools.exec` verwendet.
Host-Exec verwendet außerdem den lokalen Genehmigungsstatus auf diesem Rechner. Ein hostlokales
`ask: "always"` in `~/.openclaw/exec-approvals.json` sorgt weiterhin für Nachfragen, selbst wenn
Sitzungs- oder Konfigurationsstandards `ask: "on-miss"` anfordern.
Verwenden Sie `openclaw approvals get`, `openclaw approvals get --gateway` oder
`openclaw approvals get --node <id|name|ip>`, um die angeforderte Richtlinie,
die Quellen der Host-Richtlinie und das effektive Ergebnis zu prüfen.

Wenn die UI der Companion-App **nicht verfügbar** ist, wird jede Anfrage, die eine Aufforderung erfordert,
durch den **Ask-Fallback** aufgelöst (Standard: deny).

Native Chat-Genehmigungs-Clients können in der ausstehenden Genehmigungsnachricht auch kanalspezifische Bedienmöglichkeiten bereitstellen. Matrix kann zum Beispiel Reaktions-Shortcuts im Genehmigungsprompt setzen (`✅` einmal erlauben, `❌` verweigern und `♾️` immer erlauben, wenn verfügbar) und trotzdem die Befehle `/approve ...` in der Nachricht als Fallback belassen.

## Wo dies gilt

Exec-Genehmigungen werden lokal auf dem Ausführungshost erzwungen:

- **Gateway-Host** → `openclaw`-Prozess auf dem Gateway-Rechner
- **Node-Host** → Node-Runner (macOS-Companion-App oder headless Node-Host)

Hinweis zum Vertrauensmodell:

- Durch Gateway authentifizierte Aufrufer sind vertrauenswürdige Operatoren für dieses Gateway.
- Gekoppelte Nodes erweitern diese Fähigkeit als vertrauenswürdiger Operator auf den Node-Host.
- Exec-Genehmigungen verringern das Risiko versehentlicher Ausführung, sind aber keine Authentifizierungsgrenze pro Benutzer.
- Genehmigte Node-Host-Läufe binden den kanonischen Ausführungskontext: kanonisches cwd, exaktes argv, env-Bindung
  wenn vorhanden und festgelegter Pfad zur ausführbaren Datei, wenn zutreffend.
- Für Shell-Skripte und direkte Datei-Aufrufe über Interpreter/Laufzeit versucht OpenClaw außerdem,
  genau einen konkreten lokalen Datei-Operand zu binden. Wenn sich diese gebundene Datei nach der Genehmigung, aber vor der Ausführung ändert,
  wird der Lauf verweigert, statt Inhalte mit Abweichungen auszuführen.
- Diese Dateibindung ist absichtlich nur best effort und kein vollständiges semantisches Modell jedes
  Interpreter-/Runtime-Loader-Pfads. Wenn der Genehmigungsmodus nicht genau eine konkrete lokale
  Datei zum Binden identifizieren kann, verweigert er einen genehmigungsgestützten Lauf, statt vollständige Abdeckung vorzutäuschen.

macOS-Aufteilung:

- **Node-Host-Service** leitet `system.run` über lokales IPC an die **macOS-App** weiter.
- **macOS-App** erzwingt Genehmigungen + führt den Befehl im UI-Kontext aus.

## Einstellungen und Speicherung

Genehmigungen liegen in einer lokalen JSON-Datei auf dem Ausführungshost:

`~/.openclaw/exec-approvals.json`

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

## Modus ohne Genehmigungen "YOLO"

Wenn Sie möchten, dass Host-Exec ohne Genehmigungsprompts ausgeführt wird, müssen Sie **beide** Richtlinienebenen öffnen:

- angeforderte Exec-Richtlinie in der OpenClaw-Konfiguration (`tools.exec.*`)
- hostlokale Genehmigungsrichtlinie in `~/.openclaw/exec-approvals.json`

Dies ist jetzt das Standardverhalten auf dem Host, sofern Sie es nicht explizit strenger machen:

- `tools.exec.security`: `full` auf `gateway`/`node`
- `tools.exec.ask`: `off`
- Host-`askFallback`: `full`

Wichtige Unterscheidung:

- `tools.exec.host=auto` entscheidet, wo Exec ausgeführt wird: in der Sandbox, wenn verfügbar, sonst auf dem Gateway.
- YOLO entscheidet, wie Host-Exec genehmigt wird: `security=full` plus `ask=off`.
- Im YOLO-Modus fügt OpenClaw keine zusätzliche heuristische Genehmigungsprüfung für Befehlsverschleierung über die konfigurierte Host-Exec-Richtlinie hinaus hinzu.
- `auto` macht Gateway-Routing nicht zu einem kostenlosen Override aus einer sandboxed Sitzung heraus. Eine Anfrage pro Aufruf mit `host=node` ist von `auto` aus erlaubt, und `host=gateway` ist von `auto` aus nur erlaubt, wenn keine Sandbox-Runtime aktiv ist. Wenn Sie einen stabilen Nicht-`auto`-Standard möchten, setzen Sie `tools.exec.host` oder verwenden Sie explizit `/exec host=...`.

Wenn Sie ein konservativeres Setup möchten, verschärfen Sie eine der beiden Ebenen wieder auf `allowlist` / `on-miss`
oder `deny`.

Persistentes Setup für "niemals nachfragen" auf dem Gateway-Host:

```bash
openclaw config set tools.exec.host gateway
openclaw config set tools.exec.security full
openclaw config set tools.exec.ask off
openclaw gateway restart
```

Setzen Sie dann die Genehmigungsdatei des Hosts passend dazu:

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

Shortcut nur für die Sitzung:

- `/exec security=full ask=off` ändert nur die aktuelle Sitzung.
- `/elevated full` ist ein Break-Glass-Shortcut, der für diese Sitzung auch Exec-Genehmigungen überspringt.

Wenn die Genehmigungsdatei des Hosts strenger bleibt als die Konfiguration, gewinnt weiterhin die strengere Host-Richtlinie.

## Richtlinienoptionen

### Sicherheit (`exec.security`)

- **deny**: alle Host-Exec-Anfragen blockieren.
- **allowlist**: nur Befehle auf der Allowlist erlauben.
- **full**: alles erlauben (entspricht elevated).

### Ask (`exec.ask`)

- **off**: niemals nachfragen.
- **on-miss**: nur nachfragen, wenn keine Allowlist-Regel passt.
- **always**: bei jedem Befehl nachfragen.
- Dauerhaftes Vertrauen mit `allow-always` unterdrückt Aufforderungen nicht, wenn der effektive Ask-Modus `always` ist

### Ask-Fallback (`askFallback`)

Wenn eine Aufforderung erforderlich ist, aber keine UI erreichbar ist, entscheidet der Fallback:

- **deny**: blockieren.
- **allowlist**: nur erlauben, wenn eine Allowlist-Regel passt.
- **full**: erlauben.

### Härtung für Inline-Interpreter-Eval (`tools.exec.strictInlineEval`)

Wenn `tools.exec.strictInlineEval=true`, behandelt OpenClaw Inline-Code-Eval-Formen als nur per Genehmigung erlaubt, selbst wenn das Interpreter-Binary selbst auf der Allowlist steht.

Beispiele:

- `python -c`
- `node -e`, `node --eval`, `node -p`
- `ruby -e`
- `perl -e`, `perl -E`
- `php -r`
- `lua -e`
- `osascript -e`

Dies dient als Defense in Depth für Interpreter-Loader, die sich nicht sauber auf genau einen stabilen Datei-Operand abbilden lassen. Im strikten Modus:

- benötigen diese Befehle weiterhin eine explizite Genehmigung;
- persistiert `allow-always` dafür nicht automatisch neue Allowlist-Einträge.

## Allowlist (pro Agent)

Allowlists sind **pro Agent**. Wenn mehrere Agenten existieren, wechseln Sie in der
macOS-App den zu bearbeitenden Agenten. Muster sind **case-insensitive Glob-Matches**.
Muster sollten zu **Pfade ausführbarer Dateien** aufgelöst werden (Einträge nur mit Basename werden ignoriert).
Legacy-Einträge unter `agents.default` werden beim Laden nach `agents.main` migriert.
Shell-Ketten wie `echo ok && pwd` erfordern weiterhin, dass jedes Segment auf oberster Ebene die Allowlist-Regeln erfüllt.

Beispiele:

- `~/Projects/**/bin/peekaboo`
- `~/.local/bin/*`
- `/opt/homebrew/bin/rg`

Jeder Allowlist-Eintrag verfolgt:

- **id** stabile UUID, die für die UI-Identität verwendet wird (optional)
- **zuletzt verwendet** Zeitstempel
- **zuletzt verwendeter Befehl**
- **zuletzt aufgelöster Pfad**

## Skill-CLIs automatisch erlauben

Wenn **Auto-allow skill CLIs** aktiviert ist, werden ausführbare Dateien, auf die bekannte Skills verweisen,
auf Nodes (macOS-Node oder headless Node-Host) als allowlisted behandelt. Dazu wird
`skills.bins` über Gateway RPC verwendet, um die Liste der Skill-Binaries abzurufen. Deaktivieren Sie dies, wenn Sie strikte manuelle Allowlists möchten.

Wichtige Vertrauenshinweise:

- Dies ist eine **implizite Komfort-Allowlist**, getrennt von manuellen Pfad-Allowlist-Einträgen.
- Sie ist für vertrauenswürdige Operatorumgebungen gedacht, in denen Gateway und Node dieselbe Vertrauensgrenze teilen.
- Wenn Sie striktes explizites Vertrauen benötigen, belassen Sie `autoAllowSkills: false` und verwenden Sie nur manuelle Pfad-Allowlist-Einträge.

## Safe bins (nur stdin)

`tools.exec.safeBins` definiert eine kleine Liste **nur für stdin** geeigneter Binaries (zum Beispiel `cut`),
die im Allowlist-Modus **ohne** explizite Allowlist-Einträge ausgeführt werden können. Safe bins lehnen
positionale Dateiargumente und pfadähnliche Tokens ab, sodass sie nur auf dem eingehenden Stream arbeiten können.
Behandeln Sie dies als einen engen Schnellpfad für Stream-Filter, nicht als allgemeine Vertrauensliste.
Fügen Sie **keine** Interpreter- oder Runtime-Binaries (zum Beispiel `python3`, `node`, `ruby`, `bash`, `sh`, `zsh`) zu `safeBins` hinzu.
Wenn ein Befehl Code auswerten, Unterbefehle ausführen oder Dateien per Design lesen kann, bevorzugen Sie explizite Allowlist-Einträge und lassen Sie Genehmigungsprompts aktiviert.
Benutzerdefinierte Safe bins müssen in `tools.exec.safeBinProfiles.<bin>` ein explizites Profil definieren.
Die Validierung erfolgt deterministisch nur anhand der argv-Form (keine Host-Dateisystem-Existenzprüfungen), wodurch
Oracle-Verhalten über Dateiexistenz durch Unterschiede bei Allow/Deny verhindert wird.
Dateiorientierte Optionen werden für Standard-Safe-bins verweigert (zum Beispiel `sort -o`, `sort --output`,
`sort --files0-from`, `sort --compress-program`, `sort --random-source`,
`sort --temporary-directory`/`-T`, `wc --files0-from`, `jq -f/--from-file`,
`grep -f/--file`).
Safe bins erzwingen außerdem eine explizite Flag-Richtlinie pro Binary für Optionen, die das Nur-stdin-
Verhalten brechen (zum Beispiel `sort -o/--output/--compress-program` und rekursive grep-Flags).
Lange Optionen werden im Safe-bin-Modus fail-closed validiert: unbekannte Flags und mehrdeutige
Abkürzungen werden abgelehnt.
Verweigerte Flags nach Safe-bin-Profil:

[//]: # "SAFE_BIN_DENIED_FLAGS:START"

- `grep`: `--dereference-recursive`, `--directories`, `--exclude-from`, `--file`, `--recursive`, `-R`, `-d`, `-f`, `-r`
- `jq`: `--argfile`, `--from-file`, `--library-path`, `--rawfile`, `--slurpfile`, `-L`, `-f`
- `sort`: `--compress-program`, `--files0-from`, `--output`, `--random-source`, `--temporary-directory`, `-T`, `-o`
- `wc`: `--files0-from`

[//]: # "SAFE_BIN_DENIED_FLAGS:END"

Safe bins erzwingen außerdem, dass argv-Tokens zur Ausführungszeit als **wörtlicher Text** behandelt werden (kein Globbing
und keine Expansion von `$VARS`) für Nur-stdin-Segmente, sodass Muster wie `*` oder `$HOME/...` nicht
zum Einschmuggeln von Dateizugriffen verwendet werden können.
Safe bins müssen außerdem aus vertrauenswürdigen Binary-Verzeichnissen aufgelöst werden (Systemstandards plus optionale
`tools.exec.safeBinTrustedDirs`). `PATH`-Einträge werden nie automatisch als vertrauenswürdig behandelt.
Die standardmäßig vertrauenswürdigen Safe-bin-Verzeichnisse sind absichtlich minimal: `/bin`, `/usr/bin`.
Wenn Ihre Safe-bin-Executable in Paketmanager-/Benutzerpfaden liegt (zum Beispiel
`/opt/homebrew/bin`, `/usr/local/bin`, `/opt/local/bin`, `/snap/bin`), fügen Sie diese explizit
zu `tools.exec.safeBinTrustedDirs` hinzu.
Shell-Ketten und Umleitungen werden im Allowlist-Modus nicht automatisch erlaubt.

Shell-Ketten (`&&`, `||`, `;`) sind erlaubt, wenn jedes Segment auf oberster Ebene die Allowlist erfüllt
(einschließlich Safe bins oder Skill-Auto-Allow). Umleitungen bleiben im Allowlist-Modus nicht unterstützt.
Command-Substitution (`$()` / Backticks) wird bei der Analyse der Allowlist abgelehnt, auch innerhalb
doppelter Anführungszeichen; verwenden Sie einfache Anführungszeichen, wenn Sie wörtlichen `$()`-Text benötigen.
Bei Genehmigungen in der macOS-Companion-App wird roher Shell-Text mit Shell-Steuer- oder Expansionssyntax
(`&&`, `||`, `;`, `|`, `` ` ``, `$`, `<`, `>`, `(`, `)`) als Allowlist-Miss behandelt, sofern
das Shell-Binary selbst nicht auf der Allowlist steht.
Für Shell-Wrapper (`bash|sh|zsh ... -c/-lc`) werden anfragebezogene env-Overrides auf eine
kleine explizite Allowlist reduziert (`TERM`, `LANG`, `LC_*`, `COLORTERM`, `NO_COLOR`, `FORCE_COLOR`).
Bei `allow-always`-Entscheidungen im Allowlist-Modus persistieren bekannte Dispatch-Wrapper
(`env`, `nice`, `nohup`, `stdbuf`, `timeout`) die Pfade der inneren ausführbaren Datei statt der Wrapper-Pfade.
Shell-Multiplexer (`busybox`, `toybox`) werden für Shell-Applets (`sh`, `ash`,
usw.) ebenfalls entpackt, sodass die inneren ausführbaren Dateien statt der Multiplexer-Binaries persistiert werden. Wenn ein Wrapper oder
Multiplexer nicht sicher entpackt werden kann, wird kein Allowlist-Eintrag automatisch persistiert.
Wenn Sie Interpreter wie `python3` oder `node` auf die Allowlist setzen, bevorzugen Sie `tools.exec.strictInlineEval=true`, damit Inline-Eval weiterhin eine explizite Genehmigung erfordert. Im strikten Modus kann `allow-always` weiterhin harmlose Interpreter-/Skriptaufrufe persistieren, aber Träger für Inline-Eval werden nicht automatisch persistiert.

Standard-Safe-bins:

[//]: # "SAFE_BIN_DEFAULTS:START"

`cut`, `uniq`, `head`, `tail`, `tr`, `wc`

[//]: # "SAFE_BIN_DEFAULTS:END"

`grep` und `sort` sind nicht in der Standardliste enthalten. Wenn Sie diese aktivieren, behalten Sie explizite Allowlist-Einträge für
deren Nicht-stdin-Workflows bei.
Für `grep` im Safe-bin-Modus geben Sie das Muster mit `-e`/`--regexp` an; die positionale Form für Muster wird
abgelehnt, damit Datei-Operanden nicht als mehrdeutige positionale Argumente eingeschmuggelt werden können.

### Safe bins versus Allowlist

| Thema            | `tools.exec.safeBins`                                  | Allowlist (`exec-approvals.json`)                            |
| ---------------- | ------------------------------------------------------ | ------------------------------------------------------------ |
| Ziel             | Enge stdin-Filter automatisch erlauben                 | Bestimmten ausführbaren Dateien explizit vertrauen           |
| Match-Typ        | Executable-Name + Safe-bin-argv-Richtlinie             | Glob-Muster des aufgelösten Executable-Pfads                 |
| Argumentbereich  | Durch Safe-bin-Profil und Literal-Token-Regeln eingeschränkt | Nur Pfad-Match; für Argumente sind Sie sonst selbst verantwortlich |
| Typische Beispiele | `head`, `tail`, `tr`, `wc`                           | `jq`, `python3`, `node`, `ffmpeg`, benutzerdefinierte CLIs   |
| Beste Verwendung | Texttransformationen mit geringem Risiko in Pipelines  | Jedes Tool mit breiterem Verhalten oder Seiteneffekten       |

Speicherort der Konfiguration:

- `safeBins` stammt aus der Konfiguration (`tools.exec.safeBins` oder pro Agent `agents.list[].tools.exec.safeBins`).
- `safeBinTrustedDirs` stammt aus der Konfiguration (`tools.exec.safeBinTrustedDirs` oder pro Agent `agents.list[].tools.exec.safeBinTrustedDirs`).
- `safeBinProfiles` stammt aus der Konfiguration (`tools.exec.safeBinProfiles` oder pro Agent `agents.list[].tools.exec.safeBinProfiles`). Profilschlüssel pro Agent überschreiben globale Schlüssel.
- Allowlist-Einträge liegen auf dem Host lokal in `~/.openclaw/exec-approvals.json` unter `agents.<id>.allowlist` (oder über Control UI / `openclaw approvals allowlist ...`).
- `openclaw security audit` warnt mit `tools.exec.safe_bins_interpreter_unprofiled`, wenn Interpreter-/Runtime-Binaries in `safeBins` auftauchen, ohne dass explizite Profile vorhanden sind.
- `openclaw doctor --fix` kann fehlende benutzerdefinierte `safeBinProfiles.<bin>`-Einträge als `{}` vorbereiten (danach prüfen und verschärfen). Interpreter-/Runtime-Binaries werden nicht automatisch vorbereitet.

Beispiel für ein benutzerdefiniertes Profil:
__OC_I18N_900004__
Wenn Sie `jq` explizit in `safeBins` aufnehmen, lehnt OpenClaw das eingebaute `env` im Safe-bin-
Modus trotzdem ab, sodass `jq -n env` nicht ohne expliziten Allowlist-Pfad
oder Genehmigungsprompt die Host-Prozessumgebung ausgeben kann.

## Bearbeiten in der Control UI

Verwenden Sie die Karte **Control UI → Nodes → Exec approvals**, um Standardwerte, Overrides pro Agent
und Allowlists zu bearbeiten. Wählen Sie einen Scope (Defaults oder einen Agenten), passen Sie die Richtlinie an,
fügen Sie Allowlist-Muster hinzu/entfernen Sie sie und klicken Sie dann auf **Save**. Die UI zeigt **zuletzt verwendet**-Metadaten
pro Muster an, damit Sie die Liste sauber halten können.

Der Zielselektor wählt **Gateway** (lokale Genehmigungen) oder einen **Node**. Nodes
müssen `system.execApprovals.get/set` ankündigen (macOS-App oder headless Node-Host).
Wenn ein Node Exec-Genehmigungen noch nicht ankündigt, bearbeiten Sie seine lokale
`~/.openclaw/exec-approvals.json` direkt.

CLI: `openclaw approvals` unterstützt das Bearbeiten von Gateway oder Node (siehe [Approvals CLI](/cli/approvals)).

## Genehmigungsablauf

Wenn eine Aufforderung erforderlich ist, sendet das Gateway `exec.approval.requested` an Operator-Clients.
Die Control UI und die macOS-App lösen dies über `exec.approval.resolve` auf, dann leitet das Gateway die
genehmigte Anfrage an den Node-Host weiter.

Für `host=node` enthalten Genehmigungsanfragen eine kanonische Payload `systemRunPlan`. Das Gateway verwendet
diesen Plan als maßgeblichen Befehls-/cwd-/Sitzungskontext beim Weiterleiten genehmigter `system.run`-
Anfragen.

Das ist bei asynchroner Latenz von Genehmigungen wichtig:

- der Node-Exec-Pfad bereitet im Voraus einen kanonischen Plan vor
- der Genehmigungsdatensatz speichert diesen Plan und seine Bindungsmetadaten
- nach der Genehmigung verwendet der endgültig weitergeleitete Aufruf `system.run` den gespeicherten Plan erneut,
  statt späteren Änderungen des Aufrufers zu vertrauen
- wenn der Aufrufer `command`, `rawCommand`, `cwd`, `agentId` oder
  `sessionKey` ändert, nachdem die Genehmigungsanfrage erzeugt wurde, verweigert das Gateway den
  weitergeleiteten Lauf als Genehmigungsmismatch

## Interpreter-/Runtime-Befehle

Genehmigungsgestützte Läufe mit Interpretern/Runtimes sind absichtlich konservativ:

- Exakter argv-/cwd-/env-Kontext wird immer gebunden.
- Direkte Shell-Skript- und direkte Runtime-Dateiformen werden best effort an genau einen konkreten lokalen
  Datei-Snapshot gebunden.
- Übliche Paketmanager-Wrapper-Formen, die sich dennoch zu genau einer direkten lokalen Datei auflösen (zum Beispiel
  `pnpm exec`, `pnpm node`, `npm exec`, `npx`), werden vor der Bindung entpackt.
- Wenn OpenClaw für einen Interpreter-/Runtime-Befehl nicht genau eine konkrete lokale Datei identifizieren kann
  (zum Beispiel bei Paketskripten, Eval-Formen, Runtime-spezifischen Loader-Ketten oder mehrdeutigen Mehrdatei-
  Formen), wird eine genehmigungsgestützte Ausführung verweigert, statt semantische Abdeckung zu behaupten, die nicht vorhanden ist.
- Für diese Workflows bevorzugen Sie Sandboxing, eine separate Host-Grenze oder einen expliziten
  vertrauenswürdigen Allowlist-/Full-Workflow, bei dem der Operator die breitere Runtime-Semantik akzeptiert.

Wenn Genehmigungen erforderlich sind, gibt das Exec-Tool sofort mit einer Genehmigungs-ID zurück. Verwenden Sie diese ID, um
spätere Systemereignisse zuzuordnen (`Exec finished` / `Exec denied`). Wenn vor dem Timeout keine Entscheidung eintrifft, wird die
Anfrage als Genehmigungs-Timeout behandelt und als Verweigerungsgrund angezeigt.

### Verhalten bei Folgezustellung

Nachdem ein genehmigter asynchroner Exec abgeschlossen ist, sendet OpenClaw einen Folge-`agent`-Turn an dieselbe Sitzung.

- Wenn ein gültiges externes Zustellziel existiert (zustellbarer Kanal plus Ziel `to`), verwendet die Folgezustellung diesen Kanal.
- In reinem Webchat oder internen Sitzungs-Flows ohne externes Ziel bleibt die Folgezustellung nur sitzungsintern (`deliver: false`).
- Wenn ein Aufrufer ausdrücklich eine strikte externe Zustellung anfordert und kein auflösbarer externer Kanal existiert, schlägt die Anfrage mit `INVALID_REQUEST` fehl.
- Wenn `bestEffortDeliver` aktiviert ist und kein externer Kanal aufgelöst werden kann, wird die Zustellung auf nur sitzungsintern heruntergestuft, statt fehlzuschlagen.

Der Bestätigungsdialog enthält:

- Befehl + Argumente
- cwd
- Agent-ID
- aufgelösten Pfad der ausführbaren Datei
- Host- + Richtlinienmetadaten

Aktionen:

- **Allow once** → jetzt ausführen
- **Always allow** → zur Allowlist hinzufügen + ausführen
- **Deny** → blockieren

## Weiterleitung von Genehmigungen an Chat-Kanäle

Sie können Prompts für Exec-Genehmigungen an jeden Chat-Kanal weiterleiten (einschließlich Plugin-Kanälen) und
sie mit `/approve` genehmigen. Dafür wird die normale Pipeline für ausgehende Zustellung verwendet.

Konfiguration:
__OC_I18N_900005__
Antwort in Chat:
__OC_I18N_900006__
Der Befehl `/approve` verarbeitet sowohl Exec-Genehmigungen als auch Plugin-Genehmigungen. Wenn die ID keiner ausstehenden Exec-Genehmigung entspricht, prüft er automatisch stattdessen Plugin-Genehmigungen.

### Weiterleitung von Plugin-Genehmigungen

Die Weiterleitung von Plugin-Genehmigungen nutzt dieselbe Zustellpipeline wie Exec-Genehmigungen, hat aber unter `approvals.plugin` eine eigene, unabhängige Konfiguration. Das Aktivieren oder Deaktivieren des einen beeinflusst das andere nicht.
__OC_I18N_900007__
Die Konfigurationsform entspricht exakt `approvals.exec`: `enabled`, `mode`, `agentFilter`,
`sessionFilter` und `targets` funktionieren gleich.

Kanäle, die gemeinsame interaktive Antworten unterstützen, rendern für Exec- und
Plugin-Genehmigungen dieselben Genehmigungsschaltflächen. Kanäle ohne gemeinsame interaktive UI fallen auf Klartext mit
Anweisungen für `/approve` zurück.

### Genehmigungen im selben Chat auf jedem Kanal

Wenn eine Anfrage für eine Exec- oder Plugin-Genehmigung von einer zustellbaren Chat-Oberfläche stammt, kann jetzt standardmäßig derselbe Chat
sie mit `/approve` genehmigen. Dies gilt für Kanäle wie Slack, Matrix und
Microsoft Teams zusätzlich zu den bestehenden Web-UI- und Terminal-UI-Flows.

Dieser gemeinsame Pfad über Textbefehle nutzt das normale Kanal-Auth-Modell für diese Unterhaltung. Wenn der
Ursprungschat bereits Befehle senden und Antworten empfangen kann, benötigen Genehmigungsanfragen keinen
separaten nativen Zustelladapter mehr, nur um ausstehend zu bleiben.

Discord und Telegram unterstützen ebenfalls `/approve` im selben Chat, aber diese Kanäle verwenden weiterhin ihre
aufgelöste Liste von Genehmigern für die Autorisierung, selbst wenn native Genehmigungszustellung deaktiviert ist.

Für Telegram und andere native Genehmigungs-Clients, die das Gateway direkt aufrufen,
ist dieser Fallback absichtlich auf Fehler vom Typ "approval not found" begrenzt. Eine echte
Verweigerung/ein echter Fehler bei einer Exec-Genehmigung versucht nicht stillschweigend Plugin-Genehmigungen erneut.

### Native Genehmigungszustellung

Einige Kanäle können auch als native Genehmigungs-Clients fungieren. Native Clients ergänzen DM-Zustellung an Genehmiger, Fanout in den Ursprungschat
und kanalspezifische interaktive UX für Genehmigungen zusätzlich zum gemeinsamen `/approve`-
Flow im selben Chat.

Wenn native Genehmigungskarten/-schaltflächen verfügbar sind, ist diese native UI der primäre
agentenseitige Pfad. Der Agent sollte nicht zusätzlich einen doppelten Klartext-
Befehl `/approve` ausgeben, es sei denn, das Tool-Ergebnis sagt, dass Chat-Genehmigungen nicht verfügbar sind oder
manuelle Genehmigung der einzige verbleibende Pfad ist.

Generisches Modell:

- die Host-Exec-Richtlinie entscheidet weiterhin, ob eine Exec-Genehmigung erforderlich ist
- `approvals.exec` steuert die Weiterleitung von Genehmigungsprompts an andere Chat-Ziele
- `channels.<channel>.execApprovals` steuert, ob dieser Kanal als nativer Genehmigungs-Client fungiert

Native Genehmigungs-Clients aktivieren DM-first-Zustellung automatisch, wenn alle folgenden Bedingungen erfüllt sind:

- der Kanal unterstützt native Genehmigungszustellung
- Genehmiger können aus expliziten `execApprovals.approvers` oder den
  dokumentierten Fallback-Quellen dieses Kanals aufgelöst werden
- `channels.<channel>.execApprovals.enabled` ist nicht gesetzt oder `"auto"`

Setzen Sie `enabled: false`, um einen nativen Genehmigungs-Client explizit zu deaktivieren. Setzen Sie `enabled: true`, um
ihn zu erzwingen, wenn Genehmiger aufgelöst werden. Die öffentliche Zustellung in den Ursprungschat bleibt explizit über
`channels.<channel>.execApprovals.target`.

FAQ: [Warum gibt es für Chat-Genehmigungen zwei Konfigurationen für Exec-Genehmigungen?](/help/faq#why-are-there-two-exec-approval-configs-for-chat-approvals)

- Discord: `channels.discord.execApprovals.*`
- Slack: `channels.slack.execApprovals.*`
- Telegram: `channels.telegram.execApprovals.*`

Diese nativen Genehmigungs-Clients ergänzen DM-Routing und optionales Kanal-Fanout zusätzlich zum gemeinsamen
`/approve`-Flow im selben Chat und gemeinsamen Genehmigungsschaltflächen.

Gemeinsames Verhalten:

- Slack, Matrix, Microsoft Teams und ähnliche zustellbare Chats verwenden das normale Kanal-Auth-Modell
  für `/approve` im selben Chat
- wenn ein nativer Genehmigungs-Client automatisch aktiviert wird, ist das standardmäßige native Zustellziel die DMs der Genehmiger
- bei Discord und Telegram können nur aufgelöste Genehmiger genehmigen oder verweigern
- Discord-Genehmiger können explizit sein (`execApprovals.approvers`) oder aus `commands.ownerAllowFrom` abgeleitet werden
- Telegram-Genehmiger können explizit sein (`execApprovals.approvers`) oder aus bestehender Eigentümerkonfiguration abgeleitet werden (`allowFrom`, plus `defaultTo` für Direktnachrichten, wo unterstützt)
- Slack-Genehmiger können explizit sein (`execApprovals.approvers`) oder aus `commands.ownerAllowFrom` abgeleitet werden
- Native Slack-Schaltflächen erhalten die Art der Genehmigungs-ID, sodass `plugin:`-IDs Plugin-Genehmigungen
  ohne eine zweite Slack-lokale Fallback-Schicht auflösen können
- Natives Matrix-DM-/Kanal-Routing ist nur für Exec; Matrix-Plugin-Genehmigungen bleiben im gemeinsamen
  `/approve`-Flow im selben Chat und optionalen Weiterleitungspfaden über `approvals.plugin`
- der Anfragende muss kein Genehmiger sein
- der Ursprungschat kann direkt mit `/approve` genehmigen, wenn dieser Chat bereits Befehle und Antworten unterstützt
- native Discord-Genehmigungsschaltflächen routen nach Art der Genehmigungs-ID: `plugin:`-IDs gehen
  direkt zu Plugin-Genehmigungen, alles andere zu Exec-Genehmigungen
- native Telegram-Genehmigungsschaltflächen folgen demselben begrenzten Exec-zu-Plugin-Fallback wie `/approve`
- wenn natives `target` die Zustellung in den Ursprungschat aktiviert, enthalten Genehmigungsprompts den Befehlstext
- ausstehende Exec-Genehmigungen laufen standardmäßig nach 30 Minuten ab
- wenn keine Operator-UI oder kein konfigurierter Genehmigungs-Client die Anfrage annehmen kann, fällt der Prompt auf `askFallback` zurück

Telegram verwendet standardmäßig Genehmiger-DMs (`target: "dm"`). Sie können auf `channel` oder `both` umschalten, wenn Sie
möchten, dass Genehmigungsprompts auch im ursprünglichen Telegram-Chat/Topic erscheinen. Bei Telegram-Foren-
Topics behält OpenClaw das Topic für den Genehmigungsprompt und die Nachverfolgung nach der Genehmigung bei.

Siehe:

- [Discord](/channels/discord)
- [Telegram](/channels/telegram)

### macOS-IPC-Flow
__OC_I18N_900008__
Sicherheitshinweise:

- Unix-Socket-Modus `0600`, Token gespeichert in `exec-approvals.json`.
- Same-UID-Peer-Prüfung.
- Challenge/Response (Nonce + HMAC-Token + Request-Hash) + kurze TTL.

## Systemereignisse

Der Exec-Lifecycle wird als Systemnachrichten sichtbar gemacht:

- `Exec running` (nur wenn der Befehl den Schwellenwert für die Running-Mitteilung überschreitet)
- `Exec finished`
- `Exec denied`

Diese werden in die Sitzung des Agenten gepostet, nachdem der Node das Ereignis gemeldet hat.
Exec-Genehmigungen auf dem Gateway-Host erzeugen dieselben Lifecycle-Ereignisse, wenn der Befehl abgeschlossen ist (und optional wenn er den Schwellenwert für eine längere Laufzeit überschreitet).
Genehmigungsgesteuerte Execs verwenden die Genehmigungs-ID erneut als `runId` in diesen Nachrichten, damit die Zuordnung einfach ist.

## Verhalten bei verweigerter Genehmigung

Wenn eine asynchrone Exec-Genehmigung verweigert wird, verhindert OpenClaw, dass der Agent
Ausgaben eines früheren Laufs desselben Befehls in der Sitzung wiederverwendet. Der Verweigerungsgrund
wird mit einer expliziten Anleitung weitergegeben, dass keine Befehlsausgabe verfügbar ist. Dadurch wird verhindert,
dass der Agent behauptet, es gebe neue Ausgabe, oder den verweigerten Befehl mit
veralteten Ergebnissen aus einem früheren erfolgreichen Lauf wiederholt.

## Auswirkungen

- **full** ist mächtig; bevorzugen Sie wenn möglich Allowlists.
- **ask** hält Sie im Loop und erlaubt dennoch schnelle Genehmigungen.
- Allowlists pro Agent verhindern, dass Genehmigungen eines Agenten auf andere übergreifen.
- Genehmigungen gelten nur für Host-Exec-Anfragen von **autorisierten Absendern**. Nicht autorisierte Absender können kein `/exec` ausgeben.
- `/exec security=full` ist eine Komfortfunktion auf Sitzungsebene für autorisierte Operatoren und überspringt Genehmigungen bewusst.
  Um Host-Exec hart zu blockieren, setzen Sie die Sicherheit für Genehmigungen auf `deny` oder verweigern Sie das Tool `exec` über die Tool-Richtlinie.

Verwandt:

- [Exec tool](/de/tools/exec)
- [Elevated mode](/de/tools/elevated)
- [Skills](/de/tools/skills)

## Verwandt

- [Exec](/de/tools/exec) — Tool zur Ausführung von Shell-Befehlen
- [Sandboxing](/de/gateway/sandboxing) — Sandbox-Modi und Workspace-Zugriff
- [Security](/de/gateway/security) — Sicherheitsmodell und Härtung
- [Sandbox vs Tool Policy vs Elevated](/de/gateway/sandbox-vs-tool-policy-vs-elevated) — wann was verwendet werden sollte
