---
read_when:
    - Sie führen openclaw nach der Einrichtung ohne Befehl aus und möchten Crestodian verstehen
    - Sie benötigen eine sichere Möglichkeit ohne Konfiguration, um OpenClaw zu prüfen oder zu reparieren
    - Sie entwerfen oder aktivieren den Rettungsmodus für Nachrichtenkanäle
summary: CLI-Referenz und Sicherheitsmodell für Crestodian, den konfigurationslos sicheren Einrichtungs- und Reparaturhelfer
title: Crestodian
x-i18n:
    generated_at: "2026-06-27T17:18:01Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0933a05ee02ff54e99c2909aa3e0e67fd6ed3b38b541d5b96af07defdf23b80d
    source_path: cli/crestodian.md
    workflow: 16
---

# `openclaw crestodian`

Crestodian ist OpenClaws lokaler Helfer für Einrichtung, Reparatur und Konfiguration. Er ist
darauf ausgelegt, erreichbar zu bleiben, wenn der normale Agent-Pfad defekt ist.

Wenn `openclaw` ohne Befehl ausgeführt wird, startet zuerst das klassische Onboarding, wenn die
aktive Konfigurationsdatei fehlt oder keine verfassten Einstellungen enthält (leer oder
nur Metadaten). Nachdem eine Konfigurationsdatei verfasste Einstellungen enthält, startet
`openclaw` ohne Befehl Crestodian in einem interaktiven Terminal. Mit
`openclaw crestodian` starten Sie denselben Helfer explizit.

## Was Crestodian anzeigt

Beim Start öffnet der interaktive Crestodian dieselbe TUI-Shell, die auch von
`openclaw tui` verwendet wird, mit einem Crestodian-Chat-Backend. Das Chatprotokoll beginnt mit
einer kurzen Begrüßung:

- wann Crestodian gestartet werden sollte
- das Modell oder den deterministischen Planner-Pfad, den Crestodian tatsächlich verwendet
- Konfigurationsgültigkeit und den Standard-Agent
- Gateway-Erreichbarkeit aus der ersten Startprüfung
- die nächste Debug-Aktion, die Crestodian ausführen kann

Er gibt keine Secrets aus und lädt keine Plugin-CLI-Befehle nur zum Starten. Die TUI
stellt weiterhin die normale Kopfzeile, das Chatprotokoll, die Statuszeile, die Fußzeile, Autovervollständigung
und Editor-Steuerungen bereit.

Verwenden Sie `status` für die detaillierte Bestandsaufnahme mit Konfigurationspfad, Doku-/Quellpfaden,
lokalen CLI-Prüfungen, API-Schlüssel-Verfügbarkeit, Agents, Modell und Gateway-Details.

Crestodian verwendet dieselbe OpenClaw-Referenzerkennung wie reguläre Agents. In einem Git-Checkout
verweist er auf lokale `docs/` und den lokalen Quellbaum. In einer npm-Paketinstallation
verwendet er die gebündelte Paketdokumentation und verweist auf
[https://github.com/openclaw/openclaw](https://github.com/openclaw/openclaw), mit ausdrücklicher
Empfehlung, den Quellcode zu prüfen, wenn die Dokumentation nicht ausreicht.

## Beispiele

```bash
openclaw
openclaw crestodian
openclaw crestodian --json
openclaw crestodian --message "models"
openclaw crestodian --message "validate config"
openclaw crestodian --message "setup workspace ~/Projects/work model openai/gpt-5.5" --yes
openclaw crestodian --message "set default model openai/gpt-5.5" --yes
openclaw onboard --modern
```

Innerhalb der Crestodian-TUI:

```text
status
health
doctor
doctor fix
validate config
setup
setup workspace ~/Projects/work model openai/gpt-5.5
config set gateway.port 19001
config set-ref gateway.auth.token env OPENCLAW_GATEWAY_TOKEN
gateway status
restart gateway
agents
create agent work workspace ~/Projects/work
models
set default model openai/gpt-5.5
plugins list
plugins search slack
plugin install clawhub:openclaw-codex-app-server
plugin uninstall openclaw-codex-app-server
talk to work agent
talk to agent for ~/Projects/work
audit
quit
```

## Sicherer Start

Crestodians Startpfad ist bewusst klein gehalten. Er kann ausgeführt werden, wenn:

- `openclaw.json` fehlt
- `openclaw.json` ungültig ist
- der Gateway nicht läuft
- die Registrierung von Plugin-Befehlen nicht verfügbar ist
- noch kein Agent konfiguriert wurde

`openclaw --help` und `openclaw --version` verwenden weiterhin die normalen schnellen Pfade.
Nicht interaktives bloßes `openclaw` beendet sich mit einer kurzen Meldung, statt die
Root-Hilfe auszugeben. Bei einer frischen Installation verweist die Meldung auf nicht interaktives Onboarding;
nach der Einrichtung verweist sie auf einmalige Crestodian-Befehle.

## Operationen und Zustimmung

Crestodian verwendet typisierte Operationen, statt die Konfiguration ad hoc zu bearbeiten.

Schreibgeschützte Operationen können sofort ausgeführt werden:

- Übersicht anzeigen
- Agents auflisten
- installierte Plugins auflisten
- ClawHub-Plugins suchen
- Modell-/Backend-Status anzeigen
- Status- oder Health-Prüfungen ausführen
- Gateway-Erreichbarkeit prüfen
- Doctor ohne interaktive Reparaturen ausführen
- Konfiguration validieren
- Audit-Log-Pfad anzeigen

Persistente Operationen erfordern im interaktiven Modus eine Zustimmung im Gespräch, sofern
Sie für einen direkten Befehl nicht `--yes` übergeben:

- Konfiguration schreiben
- `config set` ausführen
- unterstützte SecretRef-Werte über `config set-ref` setzen
- Setup-/Onboarding-Bootstrap ausführen
- das Standardmodell ändern
- den Gateway starten, stoppen oder neu starten
- Agents erstellen
- Plugins aus ClawHub oder npm installieren
- Plugins deinstallieren
- Doctor-Reparaturen ausführen, die Konfiguration oder Zustand neu schreiben

Angewendete Schreibvorgänge werden aufgezeichnet in:

```text
~/.openclaw/audit/crestodian.jsonl
```

Discovery wird nicht auditiert. Nur angewendete Operationen und Schreibvorgänge werden protokolliert.

`openclaw onboard --modern` startet Crestodian als moderne Onboarding-Vorschau.
Ein einfaches `openclaw onboard` führt weiterhin das klassische Onboarding aus.

## Setup-Bootstrap

`setup` ist der chatbasierte Onboarding-Bootstrap. Er schreibt nur über typisierte
Konfigurationsoperationen und fragt zuerst nach Zustimmung.

```text
setup
setup workspace ~/Projects/work
setup workspace ~/Projects/work model openai/gpt-5.5
```

Wenn kein Modell konfiguriert ist, wählt Setup in dieser Reihenfolge das erste nutzbare Backend aus
und teilt Ihnen mit, was ausgewählt wurde:

- vorhandenes explizites Modell, falls bereits konfiguriert
- `OPENAI_API_KEY` -> `openai/gpt-5.5`
- `ANTHROPIC_API_KEY` -> `anthropic/claude-opus-4-8`
- Claude Code CLI -> `claude-cli/claude-opus-4-8`
- Codex -> `openai/gpt-5.5` über das Codex-App-Server-Harness

Wenn keines verfügbar ist, schreibt Setup dennoch den Standard-Workspace und lässt das
Modell ungesetzt. Installieren Sie Codex/Claude Code oder melden Sie sich dort an, oder stellen Sie
`OPENAI_API_KEY`/`ANTHROPIC_API_KEY` bereit, und führen Sie Setup dann erneut aus.

## Modellgestützter Planner

Crestodian startet immer im deterministischen Modus. Für unscharfe Befehle, die der
deterministische Parser nicht versteht, kann der lokale Crestodian einen begrenzten
Planner-Durchlauf über OpenClaws normale Runtime-Pfade durchführen. Zuerst verwendet er das
konfigurierte OpenClaw-Modell. Wenn noch kein konfiguriertes Modell nutzbar ist, kann er auf
lokale Runtimes zurückfallen, die bereits auf dem Rechner vorhanden sind:

- Claude Code CLI: `claude-cli/claude-opus-4-8`
- Codex-App-Server-Harness: `openai/gpt-5.5`

Der modellgestützte Planner kann die Konfiguration nicht direkt ändern. Er muss die
Anfrage in einen der typisierten Crestodian-Befehle übersetzen; danach gelten die normalen Zustimmungs- und
Audit-Regeln. Crestodian gibt das verwendete Modell und den interpretierten
Befehl aus, bevor etwas ausgeführt wird. Konfigurationslose Fallback-Planner-Durchläufe sind
temporär, werkzeugdeaktiviert, sofern die Runtime dies unterstützt, und verwenden einen temporären
Workspace/eine temporäre Sitzung.

Der Rettungsmodus für Nachrichtenkanäle verwendet den modellgestützten Planner nicht. Remote-
Rettung bleibt deterministisch, damit ein defekter oder kompromittierter normaler Agent-Pfad nicht
als Konfigurationseditor verwendet werden kann.

## Zu einem Agent wechseln

Verwenden Sie einen natürlichsprachlichen Selektor, um Crestodian zu verlassen und die normale TUI zu öffnen:

```text
talk to agent
talk to work agent
switch to main agent
```

`openclaw tui`, `openclaw chat` und `openclaw terminal` öffnen weiterhin direkt die normale
Agent-TUI. Sie starten Crestodian nicht.

Nachdem Sie in die normale TUI gewechselt sind, verwenden Sie `/crestodian`, um zu Crestodian zurückzukehren.
Sie können eine Folgeanfrage einschließen:

```text
/crestodian
/crestodian restart gateway
```

Agent-Wechsel innerhalb der TUI hinterlassen einen Hinweis, dass `/crestodian` verfügbar ist.

## Nachrichten-Rettungsmodus

Der Nachrichten-Rettungsmodus ist der Nachrichtenkanal-Einstiegspunkt für Crestodian. Er ist für
den Fall gedacht, dass Ihr normaler Agent ausgefallen ist, ein vertrauenswürdiger Kanal wie WhatsApp
aber weiterhin Befehle empfängt.

Unterstützter Textbefehl:

- `/crestodian <request>`

Operator-Ablauf:

```text
You, in a trusted owner DM: /crestodian status
OpenClaw: Crestodian rescue mode. Gateway reachable: no. Config valid: no.
You: /crestodian restart gateway
OpenClaw: Plan: restart the Gateway. Reply /crestodian yes to apply.
You: /crestodian yes
OpenClaw: Applied. Audit entry written.
```

Agent-Erstellung kann auch über die lokale Eingabeaufforderung oder den Rettungsmodus in die Warteschlange gestellt werden:

```text
create agent work workspace ~/Projects/work model openai/gpt-5.5
/crestodian create agent work workspace ~/Projects/work
```

Remote-Rettungsmodus ist eine Admin-Oberfläche. Er muss wie Remote-Konfigurationsreparatur
behandelt werden, nicht wie normaler Chat.

Sicherheitsvertrag für Remote-Rettung:

- Deaktiviert, wenn Sandboxing aktiv ist. Wenn ein Agent/eine Sitzung sandboxed ist,
  muss Crestodian Remote-Rettung verweigern und erklären, dass lokale CLI-Reparatur
  erforderlich ist.
- Der standardmäßig effektive Zustand ist `auto`: Remote-Rettung nur in vertrauenswürdigem YOLO-
  Betrieb erlauben, bei dem die Runtime bereits unsandboxed lokale Berechtigungen hat.
- Eine explizite Owner-Identität ist erforderlich. Rettung darf keine Wildcard-Sender-
  Regeln, offene Gruppenrichtlinien, unauthentifizierten Webhooks oder anonymen Kanäle akzeptieren.
- Standardmäßig nur Owner-DMs. Gruppen-/Kanal-Rettung erfordert explizites Opt-in.
- Plugin-Suche und -Liste sind schreibgeschützt. Plugin-Installation ist standardmäßig nur lokal,
  weil dabei ausführbarer Code heruntergeladen wird. Plugin-Deinstallation kann als
  genehmigte Reparaturoperation erlaubt werden, wenn die Rettungsrichtlinie persistente Schreibvorgänge zulässt.
- Remote-Rettung kann die lokale TUI nicht öffnen oder in eine interaktive Agent-
  Sitzung wechseln. Verwenden Sie lokales `openclaw` für die Agent-Übergabe.
- Persistente Schreibvorgänge erfordern weiterhin Zustimmung, auch im Rettungsmodus.
- Jede angewendete Rettungsoperation auditieren. Nachrichtenkanal-Rettung zeichnet Kanal,
  Konto, Sender und Quelladressen-Metadaten auf. Konfigurationsändernde Operationen zeichnen außerdem
  Konfigurations-Hashes vor und nach der Änderung auf.
- Secrets niemals ausgeben. SecretRef-Inspektion sollte Verfügbarkeit melden, nicht
  Werte.
- Wenn der Gateway erreichbar ist, bevorzugen Sie typisierte Gateway-Operationen. Wenn der Gateway
  nicht erreichbar ist, verwenden Sie nur die minimale lokale Reparaturoberfläche, die nicht vom
  normalen Agent-Loop abhängt.

Konfigurationsform:

```jsonc
{
  "crestodian": {
    "rescue": {
      "enabled": "auto",
      "ownerDmOnly": true,
    },
  },
}
```

`enabled` sollte akzeptieren:

- `"auto"`: Standard. Nur erlauben, wenn die effektive Runtime YOLO ist und
  Sandboxing aus ist.
- `false`: Nachrichtenkanal-Rettung niemals erlauben.
- `true`: Rettung explizit erlauben, wenn die Owner-/Kanalprüfungen bestehen. Dies
  darf die Sandboxing-Verweigerung dennoch nicht umgehen.

Die standardmäßige `"auto"`-YOLO-Haltung ist:

- Sandbox-Modus wird zu `off` aufgelöst
- `tools.exec.security` wird zu `full` aufgelöst
- `tools.exec.ask` wird zu `off` aufgelöst

Remote-Rettung wird durch die Docker-Lane abgedeckt:

```bash
pnpm test:docker:crestodian-rescue
```

Der konfigurationslose lokale Planner-Fallback wird abgedeckt durch:

```bash
pnpm test:docker:crestodian-planner
```

Ein opt-in Live-Channel-Befehlssurface-Smoke prüft `/crestodian status` plus einen
persistenten Zustimmungs-Roundtrip durch den Rescue-Handler:

```bash
pnpm test:live:crestodian-rescue-channel
```

Konfigurationsloses Setup über explizite Crestodian-Befehle wird abgedeckt durch:

```bash
pnpm test:docker:crestodian-first-run
```

Diese Lane startet mit einem leeren State-Verzeichnis, prüft den modernen Onboard-Crestodian-
Einstiegspunkt, setzt das Standardmodell, erstellt einen zusätzlichen Agent, konfiguriert
Discord über eine Plugin-Aktivierung plus Token-SecretRef, validiert die Konfiguration und
prüft das Audit-Log. QA Lab hat außerdem ein repo-gestütztes Szenario für denselben Ring-0-
Ablauf:

```bash
pnpm openclaw qa suite --scenario crestodian-ring-zero-setup
```

## Verwandte Themen

- [CLI-Referenz](/de/cli)
- [Doctor](/de/cli/doctor)
- [TUI](/de/cli/tui)
- [Sandbox](/de/cli/sandbox)
- [Sicherheit](/de/cli/security)
