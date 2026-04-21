---
read_when:
    - Exec-Genehmigungen oder Allowlists konfigurieren
    - Exec-Genehmigungs-UX in der macOS-App implementieren
    - Aufforderungen zum Verlassen der Sandbox und deren Auswirkungen prüfen
summary: Exec-Genehmigungen, Allowlists und Aufforderungen zum Verlassen der Sandbox
title: Exec-Genehmigungen
x-i18n:
    generated_at: "2026-04-21T13:37:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0738108dd21e24eb6317d437b7ac693312743eddc3ec295ba62c4e60356cb33e
    source_path: tools/exec-approvals.md
    workflow: 15
---

# Exec-Genehmigungen

Exec-Genehmigungen sind die **Schutzmaßnahme der Companion-App / des Node-Hosts**, damit ein in einer Sandbox ausgeführter Agent
Befehle auf einem echten Host (`gateway` oder `node`) ausführen darf. Verstehen Sie das wie eine Sicherheitsverriegelung:
Befehle sind nur erlaubt, wenn Richtlinie + Allowlist + (optionale) Benutzerfreigabe alle übereinstimmen.
Exec-Genehmigungen gelten **zusätzlich** zur Tool-Richtlinie und zum Elevated-Gating (außer wenn elevated auf `full` gesetzt ist; dann werden Genehmigungen übersprungen).
Die wirksame Richtlinie ist die **strengere** von `tools.exec.*` und den Standardwerten der Genehmigungen; wenn ein Genehmigungsfeld fehlt, wird der Wert aus `tools.exec` verwendet.
Host-Exec verwendet auch den lokalen Genehmigungsstatus auf diesem Rechner. Ein hostlokales
`ask: "always"` in `~/.openclaw/exec-approvals.json` sorgt weiterhin für Rückfragen, selbst wenn
Sitzungs- oder Konfigurationsstandards `ask: "on-miss"` anfordern.
Verwenden Sie `openclaw approvals get`, `openclaw approvals get --gateway` oder
`openclaw approvals get --node <id|name|ip>`, um die angeforderte Richtlinie,
die Quellen der Host-Richtlinie und das wirksame Ergebnis zu prüfen.
Für den lokalen Rechner zeigt `openclaw exec-policy show` dieselbe zusammengeführte Ansicht an, und
`openclaw exec-policy set|preset` kann die lokal angeforderte Richtlinie in einem Schritt mit der
lokalen Host-Genehmigungsdatei synchronisieren. Wenn ein lokaler Geltungsbereich `host=node` anfordert,
meldet `openclaw exec-policy show` diesen Geltungsbereich zur Laufzeit als Node-verwaltet, statt
vorzutäuschen, dass die lokale Genehmigungsdatei die tatsächlich maßgebliche Quelle ist.

Wenn die UI der Companion-App **nicht verfügbar** ist, wird jede Anfrage, die eine Rückfrage erfordert,
durch den **Ask-Fallback** aufgelöst (Standard: deny).

Native Chat-Genehmigungsclients können auf der ausstehenden Genehmigungsnachricht auch kanalspezifische Bedienmöglichkeiten anbieten. Matrix kann zum Beispiel Reaktionskürzel auf der
Genehmigungsabfrage vorbereiten (`✅` einmal erlauben, `❌` ablehnen und `♾️` immer erlauben, wenn verfügbar)
und trotzdem die `/approve ...`-Befehle als Fallback in der Nachricht belassen.

## Wo dies gilt

Exec-Genehmigungen werden lokal auf dem Ausführungshost erzwungen:

- **Gateway-Host** → `openclaw`-Prozess auf dem Gateway-Rechner
- **Node-Host** → Node-Runner (macOS-Companion-App oder Headless-Node-Host)

Hinweis zum Vertrauensmodell:

- Für das Gateway authentifizierte Aufrufer sind vertrauenswürdige Operatoren für dieses Gateway.
- Gekoppelte Nodes erweitern diese Fähigkeit als vertrauenswürdiger Operator auf den Node-Host.
- Exec-Genehmigungen verringern das Risiko versehentlicher Ausführung, sind aber keine Authentifizierungsgrenze pro Benutzer.
- Genehmigte Ausführungen auf dem Node-Host binden den kanonischen Ausführungskontext: kanonisches cwd, exaktes argv, env-Bindung
  falls vorhanden und angehefteten ausführbaren Pfad, sofern zutreffend.
- Für Shell-Skripte und direkte Interpreter-/Runtime-Dateiaufrufe versucht OpenClaw außerdem,
  genau einen konkreten lokalen Dateiopeanden zu binden. Wenn sich diese gebundene Datei nach der Genehmigung, aber vor der Ausführung ändert,
  wird die Ausführung verweigert, statt abgewichenen Inhalt auszuführen.
- Diese Dateibindung ist absichtlich Best-Effort und kein vollständiges semantisches Modell jedes
  Interpreter-/Runtime-Ladepfads. Wenn der Genehmigungsmodus nicht genau eine konkrete lokale
  Datei zur Bindung identifizieren kann, verweigert er die Erstellung einer genehmigungsgestützten Ausführung, statt vollständige Abdeckung vorzutäuschen.

macOS-Aufteilung:

- **Node-Host-Service** leitet `system.run` über lokales IPC an die **macOS-App** weiter.
- **macOS-App** erzwingt Genehmigungen und führt den Befehl im UI-Kontext aus.

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

## „YOLO“-Modus ohne Genehmigungen

Wenn Host-Exec ohne Genehmigungsabfragen ausgeführt werden soll, müssen Sie **beide** Richtlinienebenen öffnen:

- angeforderte Exec-Richtlinie in der OpenClaw-Konfiguration (`tools.exec.*`)
- hostlokale Genehmigungsrichtlinie in `~/.openclaw/exec-approvals.json`

Dies ist jetzt das Standardverhalten für Hosts, sofern Sie es nicht explizit verschärfen:

- `tools.exec.security`: `full` auf `gateway`/`node`
- `tools.exec.ask`: `off`
- host `askFallback`: `full`

Wichtige Unterscheidung:

- `tools.exec.host=auto` wählt aus, wo Exec ausgeführt wird: in der Sandbox, wenn verfügbar, andernfalls auf dem Gateway.
- YOLO wählt aus, wie Host-Exec genehmigt wird: `security=full` plus `ask=off`.
- Im YOLO-Modus fügt OpenClaw keine zusätzliche heuristische Genehmigungsschranke für Befehlsverschleierung und keine Skript-Preflight-Ablehnungsebene zusätzlich zur konfigurierten Host-Exec-Richtlinie hinzu.
- `auto` macht Gateway-Routing nicht zu einer freien Umgehung aus einer Sandbox-Sitzung heraus. Eine Anfrage pro Aufruf mit `host=node` ist von `auto` aus erlaubt, und `host=gateway` ist von `auto` aus nur erlaubt, wenn keine Sandbox-Runtime aktiv ist. Wenn Sie einen stabilen Nicht-`auto`-Standard wollen, setzen Sie `tools.exec.host` oder verwenden Sie `/exec host=...` explizit.

Wenn Sie ein konservativeres Setup möchten, verschärfen Sie eine der beiden Ebenen wieder auf `allowlist` / `on-miss`
oder `deny`.

Dauerhafte Einrichtung „nie nachfragen“ für Gateway-Hosts:

```bash
openclaw config set tools.exec.host gateway
openclaw config set tools.exec.security full
openclaw config set tools.exec.ask off
openclaw gateway restart
```

Setzen Sie dann die Host-Genehmigungsdatei entsprechend:

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

Lokale Kurzform für dieselbe Gateway-Host-Richtlinie auf dem aktuellen Rechner:

```bash
openclaw exec-policy preset yolo
```

Diese lokale Kurzform aktualisiert beides:

- lokale `tools.exec.host/security/ask`
- lokale Standardwerte in `~/.openclaw/exec-approvals.json`

Sie ist absichtlich nur lokal. Wenn Sie Genehmigungen für Gateway-Hosts oder Node-Hosts
remote ändern müssen, verwenden Sie weiterhin `openclaw approvals set --gateway` oder
`openclaw approvals set --node <id|name|ip>`.

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

Wichtige Einschränkung nur für lokal:

- `openclaw exec-policy` synchronisiert keine Node-Genehmigungen
- `openclaw exec-policy set --host node` wird abgelehnt
- Node-Exec-Genehmigungen werden zur Laufzeit vom Node abgerufen, daher müssen zielgerichtete Aktualisierungen für Nodes `openclaw approvals --node ...` verwenden

Kurzform nur für die Sitzung:

- `/exec security=full ask=off` ändert nur die aktuelle Sitzung.
- `/elevated full` ist eine Notfall-Kurzform, die für diese Sitzung auch Exec-Genehmigungen überspringt.

Wenn die Host-Genehmigungsdatei strenger bleibt als die Konfiguration, gewinnt weiterhin die strengere Host-Richtlinie.

## Richtlinienschalter

### Sicherheit (`exec.security`)

- **deny**: alle Host-Exec-Anfragen blockieren.
- **allowlist**: nur Befehle aus der Allowlist erlauben.
- **full**: alles erlauben (entspricht elevated).

### Ask (`exec.ask`)

- **off**: nie nachfragen.
- **on-miss**: nur nachfragen, wenn die Allowlist nicht passt.
- **always**: bei jedem Befehl nachfragen.
- Dauerhaftes Vertrauen per `allow-always` unterdrückt Rückfragen nicht, wenn der wirksame Ask-Modus `always` ist

### Ask-Fallback (`askFallback`)

Wenn eine Rückfrage erforderlich ist, aber keine UI erreichbar ist, entscheidet der Fallback:

- **deny**: blockieren.
- **allowlist**: nur erlauben, wenn die Allowlist passt.
- **full**: erlauben.

### Härtung für Inline-Interpreter-Eval (`tools.exec.strictInlineEval`)

Wenn `tools.exec.strictInlineEval=true`, behandelt OpenClaw Inline-Code-Eval-Formen als nur nach Genehmigung erlaubt, selbst wenn die Interpreter-Binärdatei selbst in der Allowlist steht.

Beispiele:

- `python -c`
- `node -e`, `node --eval`, `node -p`
- `ruby -e`
- `perl -e`, `perl -E`
- `php -r`
- `lua -e`
- `osascript -e`

Dies ist Defense-in-Depth für Interpreter-Loader, die sich nicht sauber auf einen stabilen Dateiopeanden abbilden lassen. Im strikten Modus:

- benötigen diese Befehle weiterhin eine explizite Genehmigung;
- persistiert `allow-always` dafür nicht automatisch neue Allowlist-Einträge.

## Allowlist (pro Agent)

Allowlists gelten **pro Agent**. Wenn mehrere Agenten vorhanden sind, wechseln Sie in der macOS-App den Agenten,
den Sie bearbeiten. Muster sind **globale Übereinstimmungen ohne Beachtung der Groß-/Kleinschreibung**.
Muster sollten zu **Binärpfaden** aufgelöst werden (Einträge nur mit Basename werden ignoriert).
Alte `agents.default`-Einträge werden beim Laden nach `agents.main` migriert.
Shell-Ketten wie `echo ok && pwd` erfordern weiterhin, dass jedes Top-Level-Segment die Allowlist-Regeln erfüllt.

Beispiele:

- `~/Projects/**/bin/peekaboo`
- `~/.local/bin/*`
- `/opt/homebrew/bin/rg`

Jeder Allowlist-Eintrag verfolgt:

- **id** stabile UUID für die UI-Identität (optional)
- **last used** Zeitstempel
- **last used command**
- **last resolved path**

## Skill-CLIs automatisch erlauben

Wenn **Auto-allow skill CLIs** aktiviert ist, werden von bekannten Skills referenzierte ausführbare Dateien
auf Nodes (macOS-Node oder Headless-Node-Host) als auf der Allowlist behandelt. Dabei wird
`skills.bins` über die Gateway-RPC verwendet, um die Liste der Skill-Binaries abzurufen. Deaktivieren Sie dies, wenn Sie strikte manuelle Allowlists möchten.

Wichtige Vertrauenshinweise:

- Dies ist eine **implizite Convenience-Allowlist**, getrennt von manuellen Pfad-Allowlist-Einträgen.
- Sie ist für vertrauenswürdige Operatorumgebungen gedacht, in denen Gateway und Node dieselbe Vertrauensgrenze teilen.
- Wenn Sie striktes explizites Vertrauen benötigen, belassen Sie `autoAllowSkills: false` und verwenden Sie nur manuelle Pfad-Allowlist-Einträge.

## Sichere Binaries (nur stdin)

`tools.exec.safeBins` definiert eine kleine Liste von **nur-stdin**-Binärdateien (zum Beispiel `cut`),
die im Allowlist-Modus **ohne** explizite Allowlist-Einträge ausgeführt werden können. Sichere Binaries lehnen
positionale Dateiar gumente und pfadähnliche Tokens ab, sodass sie nur auf dem eingehenden Stream arbeiten können.
Behandeln Sie dies als engen Schnellpfad für Stream-Filter, nicht als allgemeine Vertrauensliste.
Fügen Sie **keine** Interpreter- oder Runtime-Binaries (zum Beispiel `python3`, `node`, `ruby`, `bash`, `sh`, `zsh`) zu `safeBins` hinzu.
Wenn ein Befehl Code auswerten, Unterbefehle ausführen oder per Design Dateien lesen kann, bevorzugen Sie explizite Allowlist-Einträge und lassen Sie Genehmigungsabfragen aktiviert.
Benutzerdefinierte sichere Binaries müssen ein explizites Profil in `tools.exec.safeBinProfiles.<bin>` definieren.
Die Validierung erfolgt deterministisch allein aus der argv-Form (keine Host-Dateisystem-Existenzprüfungen),
wodurch Oracle-Verhalten zur Dateiexistenz durch Allow/Deny-Unterschiede verhindert wird.
Dateiorientierte Optionen werden für standardmäßige sichere Binaries abgelehnt (zum Beispiel `sort -o`, `sort --output`,
`sort --files0-from`, `sort --compress-program`, `sort --random-source`,
`sort --temporary-directory`/`-T`, `wc --files0-from`, `jq -f/--from-file`,
`grep -f/--file`).
Sichere Binaries erzwingen außerdem eine explizite Richtlinie pro Binärdatei für Flags, die das Nur-stdin-Verhalten aufheben (zum Beispiel `sort -o/--output/--compress-program` und rekursive grep-Flags).
Lange Optionen werden im Modus für sichere Binaries fail-closed validiert: unbekannte Flags und mehrdeutige
Abkürzungen werden abgelehnt.
Abgelehnte Flags nach Safe-Bin-Profil:

[//]: # "SAFE_BIN_DENIED_FLAGS:START"

- `grep`: `--dereference-recursive`, `--directories`, `--exclude-from`, `--file`, `--recursive`, `-R`, `-d`, `-f`, `-r`
- `jq`: `--argfile`, `--from-file`, `--library-path`, `--rawfile`, `--slurpfile`, `-L`, `-f`
- `sort`: `--compress-program`, `--files0-from`, `--output`, `--random-source`, `--temporary-directory`, `-T`, `-o`
- `wc`: `--files0-from`

[//]: # "SAFE_BIN_DENIED_FLAGS:END"

Sichere Binaries erzwingen außerdem, dass argv-Tokens zur Ausführungszeit als **wörtlicher Text** behandelt werden (kein Globbing
und keine `$VARS`-Expansion) für nur-stdin-Segmente, sodass Muster wie `*` oder `$HOME/...` nicht
verwendet werden können, um Dateilesevorgänge einzuschmuggeln.
Sichere Binaries müssen außerdem aus vertrauenswürdigen Binary-Verzeichnissen aufgelöst werden (Systemstandardwerte plus optionale
`tools.exec.safeBinTrustedDirs`). `PATH`-Einträge werden niemals automatisch als vertrauenswürdig eingestuft.
Die standardmäßigen vertrauenswürdigen Verzeichnisse für sichere Binaries sind absichtlich minimal: `/bin`, `/usr/bin`.
Wenn sich Ihre ausführbare sichere Binary in Paketmanager-/Benutzerpfaden befindet (zum Beispiel
`/opt/homebrew/bin`, `/usr/local/bin`, `/opt/local/bin`, `/snap/bin`), fügen Sie sie explizit
zu `tools.exec.safeBinTrustedDirs` hinzu.
Shell-Verkettung und Umleitungen werden im Allowlist-Modus nicht automatisch erlaubt.

Shell-Verkettung (`&&`, `||`, `;`) ist erlaubt, wenn jedes Top-Level-Segment die Allowlist erfüllt
(einschließlich sicherer Binaries oder automatischer Skill-Allowlist). Umleitungen bleiben im Allowlist-Modus nicht unterstützt.
Befehlssubstitution (`$()` / Backticks) wird beim Allowlist-Parsen abgelehnt, auch innerhalb
doppelter Anführungszeichen; verwenden Sie einfache Anführungszeichen, wenn Sie wörtlichen `$()`-Text benötigen.
Bei Genehmigungen in der macOS-Companion-App wird roher Shell-Text, der Shell-Steuer- oder Expansionssyntax enthält
(`&&`, `||`, `;`, `|`, `` ` ``, `$`, `<`, `>`, `(`, `)`), als Allowlist-Fehlschlag behandelt, sofern
nicht die Shell-Binary selbst auf der Allowlist steht.
Für Shell-Wrapper (`bash|sh|zsh ... -c/-lc`) werden anfragebezogene env-Überschreibungen auf eine
kleine explizite Allowlist reduziert (`TERM`, `LANG`, `LC_*`, `COLORTERM`, `NO_COLOR`, `FORCE_COLOR`).
Bei Entscheidungen `allow-always` im Allowlist-Modus persistieren bekannte Dispatch-Wrapper
(`env`, `nice`, `nohup`, `stdbuf`, `timeout`) innere ausführbare Pfade statt Wrapper-Pfade.
Shell-Multiplexer (`busybox`, `toybox`) werden auch für Shell-Applets (`sh`, `ash`,
usw.) entpackt, sodass innere ausführbare Dateien statt Multiplexer-Binaries persistiert werden. Wenn ein Wrapper oder
Multiplexer nicht sicher entpackt werden kann, wird kein Allowlist-Eintrag automatisch persistiert.
Wenn Sie Interpreter wie `python3` oder `node` auf die Allowlist setzen, bevorzugen Sie `tools.exec.strictInlineEval=true`, damit Inline-Eval weiterhin eine explizite Genehmigung erfordert. Im strikten Modus kann `allow-always` weiterhin harmlose Interpreter-/Skriptaufrufe persistieren, aber Inline-Eval-Träger werden nicht automatisch persistiert.

Standardmäßige sichere Binaries:

[//]: # "SAFE_BIN_DEFAULTS:START"

`cut`, `uniq`, `head`, `tail`, `tr`, `wc`

[//]: # "SAFE_BIN_DEFAULTS:END"

`grep` und `sort` sind nicht in der Standardliste. Wenn Sie sie aktivieren, behalten Sie explizite Allowlist-Einträge für
ihre Nicht-stdin-Workflows bei.
Für `grep` im Safe-Bin-Modus geben Sie das Muster mit `-e`/`--regexp` an; die
positionale Musterform wird abgelehnt, damit Dateiopeanden nicht als mehrdeutige positionale Argumente eingeschmuggelt werden können.

### Sichere Binaries im Vergleich zur Allowlist

| Thema            | `tools.exec.safeBins`                                  | Allowlist (`exec-approvals.json`)                            |
| ---------------- | ------------------------------------------------------ | ------------------------------------------------------------ |
| Ziel             | Enge stdin-Filter automatisch erlauben                 | Bestimmten ausführbaren Dateien explizit vertrauen           |
| Übereinstimmungstyp | Name der ausführbaren Datei + Safe-Bin-argv-Richtlinie | Glob-Muster für aufgelösten Pfad der ausführbaren Datei      |
| Argumentbereich  | Durch Safe-Bin-Profil und Regeln für Literal-Tokens eingeschränkt | Nur Pfadabgleich; Argumente liegen ansonsten in Ihrer Verantwortung |
| Typische Beispiele | `head`, `tail`, `tr`, `wc`                             | `jq`, `python3`, `node`, `ffmpeg`, benutzerdefinierte CLIs   |
| Beste Verwendung | Texttransformationen mit geringem Risiko in Pipelines  | Jedes Tool mit breiterem Verhalten oder Nebeneffekten        |

Konfigurationsort:

- `safeBins` kommt aus der Konfiguration (`tools.exec.safeBins` oder pro Agent `agents.list[].tools.exec.safeBins`).
- `safeBinTrustedDirs` kommt aus der Konfiguration (`tools.exec.safeBinTrustedDirs` oder pro Agent `agents.list[].tools.exec.safeBinTrustedDirs`).
- `safeBinProfiles` kommt aus der Konfiguration (`tools.exec.safeBinProfiles` oder pro Agent `agents.list[].tools.exec.safeBinProfiles`). Profilschlüssel pro Agent überschreiben globale Schlüssel.
- Allowlist-Einträge liegen in der hostlokalen `~/.openclaw/exec-approvals.json` unter `agents.<id>.allowlist` (oder über die Control UI / `openclaw approvals allowlist ...`).
- `openclaw security audit` warnt mit `tools.exec.safe_bins_interpreter_unprofiled`, wenn Interpreter-/Runtime-Binaries in `safeBins` ohne explizite Profile erscheinen.
- `openclaw doctor --fix` kann fehlende benutzerdefinierte `safeBinProfiles.<bin>`-Einträge als `{}` vorbereiten (anschließend prüfen und verschärfen). Interpreter-/Runtime-Binaries werden nicht automatisch vorbereitet.

Beispiel für ein benutzerdefiniertes Profil:
__OC_I18N_900005__
Wenn Sie `jq` explizit in `safeBins` aufnehmen, lehnt OpenClaw das Built-in `env` im Safe-Bin-
Modus weiterhin ab, sodass `jq -n env` die Host-Prozessumgebung nicht ohne expliziten Allowlist-Pfad
oder Genehmigungsabfrage ausgeben kann.

## Bearbeiten in der Control UI

Verwenden Sie die Karte **Control UI → Nodes → Exec approvals**, um Standardwerte, agentbezogene
Überschreibungen und Allowlists zu bearbeiten. Wählen Sie einen Geltungsbereich (Standards oder einen Agenten), passen Sie die Richtlinie an,
fügen Sie Allowlist-Muster hinzu/entfernen Sie sie und klicken Sie dann auf **Save**. Die UI zeigt
pro Muster Metadaten zu **last used** an, damit Sie die Liste übersichtlich halten können.

Die Zielauswahl wählt **Gateway** (lokale Genehmigungen) oder einen **Node**. Nodes
müssen `system.execApprovals.get/set` ankündigen (macOS-App oder Headless-Node-Host).
Wenn ein Node noch keine Exec-Genehmigungen ankündigt, bearbeiten Sie seine lokale
`~/.openclaw/exec-approvals.json` direkt.

CLI: `openclaw approvals` unterstützt das Bearbeiten von Gateway oder Node (siehe [Approvals CLI](/cli/approvals)).

## Genehmigungsablauf

Wenn eine Rückfrage erforderlich ist, sendet das Gateway `exec.approval.requested` an Operator-Clients.
Die Control UI und die macOS-App lösen dies über `exec.approval.resolve` auf, danach leitet das Gateway die
genehmigte Anfrage an den Node-Host weiter.

Für `host=node` enthalten Genehmigungsanfragen eine kanonische Payload `systemRunPlan`. Das Gateway verwendet
diesen Plan als maßgeblichen Befehls-/cwd-/Sitzungskontext, wenn genehmigte `system.run`-
Anfragen weitergeleitet werden.

Das ist wichtig für die Latenz asynchroner Genehmigungen:

- der Node-Exec-Pfad bereitet einen kanonischen Plan im Voraus vor
- der Genehmigungsdatensatz speichert diesen Plan und seine Bindungsmetadaten
- nach der Genehmigung verwendet der endgültig weitergeleitete `system.run`-Aufruf den gespeicherten Plan erneut,
  statt späteren Änderungen des Aufrufers zu vertrauen
- wenn der Aufrufer `command`, `rawCommand`, `cwd`, `agentId` oder
  `sessionKey` ändert, nachdem die Genehmigungsanfrage erstellt wurde, lehnt das Gateway die
  weitergeleitete Ausführung als Genehmigungsabweichung ab

## Interpreter-/Runtime-Befehle

Genehmigungsgestützte Interpreter-/Runtime-Ausführungen sind absichtlich konservativ:

- Exakter argv-/cwd-/env-Kontext wird immer gebunden.
- Direkte Shell-Skript- und direkte Runtime-Dateiformen werden bestmöglich an genau einen konkreten lokalen
  Dateisnapshot gebunden.
- Häufige Paketmanager-Wrapper-Formen, die sich trotzdem zu genau einer direkten lokalen Datei auflösen (zum Beispiel
  `pnpm exec`, `pnpm node`, `npm exec`, `npx`), werden vor der Bindung entpackt.
- Wenn OpenClaw für einen Interpreter-/Runtime-Befehl nicht genau eine konkrete lokale Datei identifizieren kann
  (zum Beispiel Paketskripte, Eval-Formen, Runtime-spezifische Loader-Ketten oder mehrdeutige Mehrdatei-
  Formen), wird die genehmigungsgestützte Ausführung abgelehnt, statt semantische Abdeckung zu behaupten, die sie nicht
  hat.
- Für solche Workflows bevorzugen Sie Sandboxing, eine separate Host-Grenze oder einen explizit vertrauenswürdigen
  Allowlist-/Full-Workflow, bei dem der Operator die weitergehende Runtime-Semantik akzeptiert.

Wenn Genehmigungen erforderlich sind, gibt das Exec-Tool sofort mit einer Genehmigungs-ID zurück. Verwenden Sie diese ID, um
spätere Systemereignisse (`Exec finished` / `Exec denied`) zuzuordnen. Wenn vor dem
Timeout keine Entscheidung eingeht, wird die Anfrage als Genehmigungs-Timeout behandelt und als Ablehnungsgrund ausgegeben.

### Verhalten bei Follow-up-Zustellung

Nachdem ein genehmigter asynchroner Exec abgeschlossen ist, sendet OpenClaw einen Follow-up-Turn des Typs `agent` an dieselbe Sitzung.

- Wenn ein gültiges externes Zustellungsziel existiert (zustellbarer Channel plus Ziel `to`), verwendet die Follow-up-Zustellung diesen Channel.
- In reinen Webchat- oder internen Sitzungsabläufen ohne externes Ziel bleibt die Follow-up-Zustellung sitzungsintern (`deliver: false`).
- Wenn ein Aufrufer explizit strikte externe Zustellung anfordert, aber kein externer Channel aufgelöst werden kann, schlägt die Anfrage mit `INVALID_REQUEST` fehl.
- Wenn `bestEffortDeliver` aktiviert ist und kein externer Channel aufgelöst werden kann, wird die Zustellung auf sitzungsintern herabgestuft, statt fehlzuschlagen.

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

## Genehmigungsweiterleitung an Chat-Channels

Sie können Exec-Genehmigungsabfragen an jeden Chat-Channel (einschließlich Plugin-Channels) weiterleiten und
sie mit `/approve` genehmigen. Dies verwendet die normale Pipeline für ausgehende Zustellung.

Konfiguration:
__OC_I18N_900006__
Antwort im Chat:
__OC_I18N_900007__
Der Befehl `/approve` verarbeitet sowohl Exec-Genehmigungen als auch Plugin-Genehmigungen. Wenn die ID nicht zu einer ausstehenden Exec-Genehmigung passt, prüft er automatisch stattdessen Plugin-Genehmigungen.

### Weiterleitung von Plugin-Genehmigungen

Die Weiterleitung von Plugin-Genehmigungen verwendet dieselbe Zustellungspipeline wie Exec-Genehmigungen, hat aber eine eigene
unabhängige Konfiguration unter `approvals.plugin`. Das Aktivieren oder Deaktivieren der einen wirkt sich nicht auf die andere aus.
__OC_I18N_900008__
Die Form der Konfiguration ist identisch mit `approvals.exec`: `enabled`, `mode`, `agentFilter`,
`sessionFilter` und `targets` funktionieren auf dieselbe Weise.

Channels, die gemeinsame interaktive Antworten unterstützen, rendern dieselben Genehmigungsbuttons sowohl für Exec- als auch für
Plugin-Genehmigungen. Channels ohne gemeinsame interaktive UI fallen auf Klartext mit `/approve`-
Anweisungen zurück.

### Genehmigungen im selben Chat auf jedem Channel

Wenn eine Exec- oder Plugin-Genehmigungsanfrage von einer zustellbaren Chat-Oberfläche ausgeht, kann derselbe Chat
sie jetzt standardmäßig mit `/approve` genehmigen. Dies gilt für Channels wie Slack, Matrix und
Microsoft Teams zusätzlich zu den bestehenden Abläufen über Web-UI und Terminal-UI.

Dieser gemeinsame Textbefehlsweg verwendet das normale Channel-Auth-Modell für diese Konversation. Wenn der
ursprüngliche Chat bereits Befehle senden und Antworten empfangen kann, benötigen Genehmigungsanfragen nicht länger einen
separaten nativen Zustellungsadapter, nur um ausstehend zu bleiben.

Discord und Telegram unterstützen ebenfalls `/approve` im selben Chat, aber diese Channels verwenden weiterhin ihre
aufgelöste Liste der Genehmigenden für die Autorisierung, selbst wenn native Genehmigungszustellung deaktiviert ist.

Für Telegram und andere native Genehmigungsclients, die das Gateway direkt aufrufen,
ist dieser Fallback absichtlich auf Fehler „Genehmigung nicht gefunden“ begrenzt. Ein echter
Exec-Genehmigungsfehler bzw. eine echte Ablehnung wird nicht stillschweigend erneut als Plugin-Genehmigung versucht.

### Native Genehmigungszustellung

Einige Channels können auch als native Genehmigungsclients fungieren. Native Clients fügen DMs für Genehmigende, Fanout in den Ursprungs-Chat
und kanalspezifische interaktive Genehmigungs-UX zusätzlich zum gemeinsamen `/approve`-Ablauf im selben Chat hinzu.

Wenn native Genehmigungskarten/-Buttons verfügbar sind, ist diese native UI der primäre
agentenseitige Pfad. Der Agent sollte dann nicht zusätzlich einen doppelten Klartext-
Befehl `/approve` im Chat ausgeben, außer wenn das Tool-Ergebnis sagt, dass Chat-Genehmigungen nicht verfügbar sind oder
manuelle Genehmigung der einzig verbleibende Weg ist.

Allgemeines Modell:

- die Host-Exec-Richtlinie entscheidet weiterhin, ob eine Exec-Genehmigung erforderlich ist
- `approvals.exec` steuert die Weiterleitung von Genehmigungsabfragen an andere Chat-Ziele
- `channels.<channel>.execApprovals` steuert, ob dieser Channel als nativer Genehmigungsclient fungiert

Native Genehmigungsclients aktivieren standardmäßig automatisch eine Zustellung mit DMs an Genehmigende zuerst, wenn all dies zutrifft:

- der Channel unterstützt native Genehmigungszustellung
- Genehmigende können aus expliziten `execApprovals.approvers` oder den
  dokumentierten Fallback-Quellen dieses Channels aufgelöst werden
- `channels.<channel>.execApprovals.enabled` ist nicht gesetzt oder `"auto"`

Setzen Sie `enabled: false`, um einen nativen Genehmigungsclient explizit zu deaktivieren. Setzen Sie `enabled: true`, um
ihn zu erzwingen, wenn Genehmigende aufgelöst werden. Öffentliche Zustellung an den Ursprungs-Chat bleibt explizit über
`channels.<channel>.execApprovals.target`.

FAQ: [Warum gibt es zwei Exec-Genehmigungskonfigurationen für Chat-Genehmigungen?](/help/faq#why-are-there-two-exec-approval-configs-for-chat-approvals)

- Discord: `channels.discord.execApprovals.*`
- Slack: `channels.slack.execApprovals.*`
- Telegram: `channels.telegram.execApprovals.*`

Diese nativen Genehmigungsclients fügen DM-Routing und optionales Channel-Fanout zusätzlich zum gemeinsamen
`/approve`-Ablauf im selben Chat und den gemeinsamen Genehmigungsbuttons hinzu.

Gemeinsames Verhalten:

- Slack, Matrix, Microsoft Teams und ähnliche zustellbare Chats verwenden das normale Channel-Auth-Modell
  für `/approve` im selben Chat
- wenn ein nativer Genehmigungsclient automatisch aktiviert wird, ist das standardmäßige native Zustellungsziel DMs für Genehmigende
- bei Discord und Telegram können nur aufgelöste Genehmigende genehmigen oder ablehnen
- Discord-Genehmigende können explizit sein (`execApprovals.approvers`) oder aus `commands.ownerAllowFrom` abgeleitet werden
- Telegram-Genehmigende können explizit sein (`execApprovals.approvers`) oder aus vorhandener Owner-Konfiguration abgeleitet werden (`allowFrom`, plus `defaultTo` für Direktnachrichten, wo unterstützt)
- Slack-Genehmigende können explizit sein (`execApprovals.approvers`) oder aus `commands.ownerAllowFrom` abgeleitet werden
- native Slack-Buttons bewahren die Art der Genehmigungs-ID, sodass `plugin:`-IDs Plugin-Genehmigungen
  ohne eine zweite Slack-lokale Fallback-Ebene auflösen können
- natives Matrix-DM-/Channel-Routing und Reaktionskürzel verarbeiten sowohl Exec- als auch Plugin-Genehmigungen;
  die Plugin-Autorisierung kommt weiterhin aus `channels.matrix.dm.allowFrom`
- der Anfragende muss kein Genehmigender sein
- der Ursprungs-Chat kann direkt mit `/approve` genehmigen, wenn dieser Chat bereits Befehle und Antworten unterstützt
- native Discord-Genehmigungsbuttons routen nach Art der Genehmigungs-ID: `plugin:`-IDs gehen
  direkt zu Plugin-Genehmigungen, alles andere geht zu Exec-Genehmigungen
- native Telegram-Genehmigungsbuttons folgen demselben begrenzten Exec-zu-Plugin-Fallback wie `/approve`
- wenn natives `target` die Zustellung an den Ursprungs-Chat aktiviert, enthalten Genehmigungsabfragen den Befehlstext
- ausstehende Exec-Genehmigungen laufen standardmäßig nach 30 Minuten ab
- wenn keine Operator-UI oder kein konfigurierter Genehmigungsclient die Anfrage annehmen kann, fällt die Abfrage auf `askFallback` zurück

Telegram verwendet standardmäßig DMs an Genehmigende (`target: "dm"`). Sie können zu `channel` oder `both` wechseln, wenn Sie möchten,
dass Genehmigungsabfragen auch im ursprünglichen Telegram-Chat/Topic erscheinen. Bei Telegram-Forenthemen
bewahrt OpenClaw das Thema sowohl für die Genehmigungsabfrage als auch für das Follow-up nach der Genehmigung.

Siehe:

- [Discord](/channels/discord)
- [Telegram](/channels/telegram)

### macOS-IPC-Ablauf
__OC_I18N_900009__
Sicherheitshinweise:

- Unix-Socket-Modus `0600`, Token gespeichert in `exec-approvals.json`.
- Same-UID-Peer-Prüfung.
- Challenge/Response (Nonce + HMAC-Token + Request-Hash) + kurze TTL.

## Systemereignisse

Der Exec-Lebenszyklus wird als Systemnachrichten angezeigt:

- `Exec running` (nur wenn der Befehl den Schwellenwert für die Laufmeldung überschreitet)
- `Exec finished`
- `Exec denied`

Diese werden an die Sitzung des Agenten gesendet, nachdem der Node das Ereignis gemeldet hat.
Genehmigungen für Gateway-Host-Exec erzeugen dieselben Lebenszyklusereignisse, wenn der Befehl abgeschlossen ist (und optional, wenn er länger als der Schwellenwert läuft).
Durch Genehmigungen abgesicherte Execs verwenden in diesen Nachrichten die Genehmigungs-ID erneut als `runId`, damit sie leicht zugeordnet werden können.

## Verhalten bei abgelehnter Genehmigung

Wenn eine asynchrone Exec-Genehmigung abgelehnt wird, verhindert OpenClaw, dass der Agent
Ausgaben eines früheren Laufs desselben Befehls in der Sitzung wiederverwendet. Der Ablehnungsgrund
wird zusammen mit einer expliziten Anweisung übergeben, dass keine Befehlsausgabe verfügbar ist, was
verhindert, dass der Agent behauptet, es gebe neue Ausgabe, oder den abgelehnten Befehl mit
veralteten Ergebnissen eines früheren erfolgreichen Laufs wiederholt.

## Auswirkungen

- **full** ist mächtig; bevorzugen Sie wenn möglich Allowlists.
- **ask** hält Sie im Ablauf, ermöglicht aber weiterhin schnelle Genehmigungen.
- Allowlists pro Agent verhindern, dass die Genehmigungen eines Agenten in andere übergreifen.
- Genehmigungen gelten nur für Host-Exec-Anfragen von **autorisierten Sendern**. Nicht autorisierte Sender können `/exec` nicht ausführen.
- `/exec security=full` ist eine Sitzungs-Kurzform für autorisierte Operatoren und überspringt Genehmigungen absichtlich.
  Um Host-Exec vollständig zu blockieren, setzen Sie die Genehmigungssicherheit auf `deny` oder verweigern Sie das Tool `exec` über die Tool-Richtlinie.

Verwandt:

- [Exec-Tool](/de/tools/exec)
- [Elevated-Modus](/de/tools/elevated)
- [Skills](/de/tools/skills)

## Verwandt

- [Exec](/de/tools/exec) — Tool zur Ausführung von Shell-Befehlen
- [Sandboxing](/de/gateway/sandboxing) — Sandbox-Modi und Workspace-Zugriff
- [Sicherheit](/de/gateway/security) — Sicherheitsmodell und Härtung
- [Sandbox vs Tool-Richtlinie vs Elevated](/de/gateway/sandbox-vs-tool-policy-vs-elevated) — wann was verwendet werden sollte
