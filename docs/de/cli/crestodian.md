---
read_when:
    - Sie führen openclaw ohne Befehl aus und möchten Crestodian verstehen
    - Sie benötigen eine auch ohne Konfiguration sichere Möglichkeit, OpenClaw zu prüfen oder zu reparieren
    - Sie entwerfen oder aktivieren den Rettungsmodus für Nachrichtenkanäle
summary: CLI-Referenz und Sicherheitsmodell für Crestodian, den konfigurationsfrei sicheren Einrichtungs- und Reparaturhelfer
title: Crestodian
x-i18n:
    generated_at: "2026-05-10T19:27:34Z"
    model: gpt-5.5
    provider: openai
    source_hash: e9124629ed8d4df00b8d4bee683bae3d336b7fadfa5a4fc8d84fb5e51be540fb
    source_path: cli/crestodian.md
    workflow: 16
---

# `openclaw crestodian`

Crestodian ist OpenClaws lokaler Helfer für Einrichtung, Reparatur und Konfiguration. Er ist
darauf ausgelegt, erreichbar zu bleiben, wenn der normale Agent-Pfad defekt ist.

Wenn Sie `openclaw` ohne Befehl ausführen, startet Crestodian in einem interaktiven Terminal.
Wenn Sie `openclaw crestodian` ausführen, startet derselbe Helfer explizit.

## Was Crestodian anzeigt

Beim Start öffnet der interaktive Crestodian dieselbe TUI-Shell, die auch von
`openclaw tui` verwendet wird, mit einem Crestodian-Chat-Backend. Das Chatprotokoll beginnt mit einer kurzen
Begrüßung:

- wann Crestodian gestartet werden sollte
- welchen Modell- oder deterministischen Planner-Pfad Crestodian tatsächlich verwendet
- Konfigurationsgültigkeit und den Standard-Agent
- Gateway-Erreichbarkeit aus der ersten Startprüfung
- die nächste Debug-Aktion, die Crestodian ausführen kann

Er gibt keine Geheimnisse aus und lädt keine Plugin-CLI-Befehle nur zum Starten. Die TUI
stellt weiterhin den normalen Header, das Chatprotokoll, die Statuszeile, den Footer, Autovervollständigung
und Editor-Steuerungen bereit.

Verwenden Sie `status` für das detaillierte Inventar mit Konfigurationspfad, Docs-/Quellpfaden,
lokalen CLI-Prüfungen, API-Key-Vorhandensein, Agenten, Modell- und Gateway-Details.

Crestodian verwendet dieselbe OpenClaw-Referenzerkennung wie normale Agenten. In einem Git-Checkout
verweist er auf lokale `docs/` und den lokalen Quellbaum. Bei einer npm-Paketinstallation
verwendet er die gebündelten Paketdokumente und verlinkt auf
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
Nichtinteraktives `openclaw` wird mit einer kurzen Meldung beendet, statt die Root-Hilfe
auszugeben, weil das Produkt ohne Befehl Crestodian ist.

## Vorgänge und Genehmigung

Crestodian verwendet typisierte Vorgänge, statt die Konfiguration ad hoc zu bearbeiten.

Schreibgeschützte Vorgänge können sofort ausgeführt werden:

- Übersicht anzeigen
- Agenten auflisten
- installierte Plugins auflisten
- ClawHub-Plugins suchen
- Modell-/Backend-Status anzeigen
- Status- oder Zustandsprüfungen ausführen
- Gateway-Erreichbarkeit prüfen
- Doctor ohne interaktive Korrekturen ausführen
- Konfiguration validieren
- Audit-Protokollpfad anzeigen

Dauerhafte Vorgänge erfordern im interaktiven Modus eine Genehmigung im Gespräch, es sei denn,
Sie übergeben `--yes` für einen direkten Befehl:

- Konfiguration schreiben
- `config set` ausführen
- unterstützte SecretRef-Werte über `config set-ref` setzen
- Setup-/Onboarding-Bootstrap ausführen
- Standardmodell ändern
- Gateway starten, stoppen oder neu starten
- Agenten erstellen
- Plugins aus ClawHub oder npm installieren
- Plugins deinstallieren
- Doctor-Reparaturen ausführen, die Konfiguration oder Zustand neu schreiben

Angewendete Schreibvorgänge werden aufgezeichnet in:

```text
~/.openclaw/audit/crestodian.jsonl
```

Discovery wird nicht auditiert. Nur angewendete Vorgänge und Schreibvorgänge werden protokolliert.

`openclaw onboard --modern` startet Crestodian als moderne Onboarding-Vorschau.
Einfaches `openclaw onboard` führt weiterhin das klassische Onboarding aus.

## Setup-Bootstrap

`setup` ist der chatorientierte Onboarding-Bootstrap. Er schreibt ausschließlich über typisierte
Konfigurationsvorgänge und fragt zuerst nach Genehmigung.

```text
setup
setup workspace ~/Projects/work
setup workspace ~/Projects/work model openai/gpt-5.5
```

Wenn kein Modell konfiguriert ist, wählt setup das erste nutzbare Backend in dieser
Reihenfolge aus und teilt Ihnen mit, was ausgewählt wurde:

- vorhandenes explizites Modell, falls bereits konfiguriert
- `OPENAI_API_KEY` -> `openai/gpt-5.5`
- `ANTHROPIC_API_KEY` -> `anthropic/claude-opus-4-7`
- Claude Code CLI -> `claude-cli/claude-opus-4-7`
- Codex CLI -> `codex-cli/gpt-5.5`

Wenn keines verfügbar ist, schreibt setup trotzdem den Standard-Workspace und lässt das
Modell ungesetzt. Installieren Sie Codex/Claude Code oder melden Sie sich dort an, oder stellen Sie
`OPENAI_API_KEY`/`ANTHROPIC_API_KEY` bereit, und führen Sie setup dann erneut aus.

## Modellgestützter Planner

Crestodian startet immer im deterministischen Modus. Für unscharfe Befehle, die der
deterministische Parser nicht versteht, kann der lokale Crestodian einen begrenzten
Planner-Durchlauf über OpenClaws normale Laufzeitpfade ausführen. Er verwendet zuerst das
konfigurierte OpenClaw-Modell. Wenn noch kein konfiguriertes Modell verwendbar ist, kann er auf
lokale Laufzeiten zurückfallen, die bereits auf dem Rechner vorhanden sind:

- Claude Code CLI: `claude-cli/claude-opus-4-7`
- Codex app-server harness: `openai/gpt-5.5`
- Codex CLI: `codex-cli/gpt-5.5`

Der modellgestützte Planner kann die Konfiguration nicht direkt verändern. Er muss die
Anfrage in einen der typisierten Befehle von Crestodian übersetzen; anschließend gelten die normalen Genehmigungs- und
Audit-Regeln. Crestodian gibt das verwendete Modell und den interpretierten
Befehl aus, bevor irgendetwas ausgeführt wird. Planner-Durchläufe als konfigurationsloser Fallback sind
temporär, werkzeugdeaktiviert, sofern die Laufzeit dies unterstützt, und verwenden einen temporären
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

## Rettungsmodus über Nachrichten

Der Rettungsmodus über Nachrichten ist der Nachrichtenkanal-Einstiegspunkt für Crestodian. Er ist für
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

Die Agent-Erstellung kann ebenfalls über den lokalen Prompt oder den Rettungsmodus eingereiht werden:

```text
create agent work workspace ~/Projects/work model openai/gpt-5.5
/crestodian create agent work workspace ~/Projects/work
```

Der Remote-Rettungsmodus ist eine Admin-Oberfläche. Er muss wie eine Remote-
Konfigurationsreparatur behandelt werden, nicht wie normaler Chat.

Sicherheitsvertrag für Remote-Rettung:

- Deaktiviert, wenn Sandboxing aktiv ist. Wenn ein Agent/eine Sitzung in einer Sandbox läuft,
  muss Crestodian die Remote-Rettung verweigern und erklären, dass eine lokale CLI-Reparatur
  erforderlich ist.
- Der standardmäßige effektive Zustand ist `auto`: Remote-Rettung nur im vertrauenswürdigen YOLO-
  Betrieb erlauben, bei dem die Laufzeit bereits über unsandboxed lokale Autorität verfügt.
- Eine explizite Eigentümeridentität ist erforderlich. Rescue darf keine Wildcard-Absenderregeln,
  offene Gruppenrichtlinien, nicht authentifizierten Webhooks oder anonymen Kanäle akzeptieren.
- Standardmäßig nur Eigentümer-DMs. Gruppen-/Kanal-Rettung erfordert explizites Opt-in.
- Plugin-Suche und -Liste sind schreibgeschützt. Plugin-Installation ist standardmäßig nur lokal,
  weil dabei ausführbarer Code heruntergeladen wird. Plugin-Deinstallation kann als genehmigter
  Reparaturvorgang erlaubt werden, wenn die Rescue-Richtlinie dauerhafte Schreibvorgänge zulässt.
- Remote-Rettung kann die lokale TUI nicht öffnen oder in eine interaktive Agent-
  Sitzung wechseln. Verwenden Sie lokales `openclaw` für die Agent-Übergabe.
- Dauerhafte Schreibvorgänge erfordern weiterhin Genehmigung, auch im Rettungsmodus.
- Jeden angewendeten Rettungsvorgang auditieren. Rettung über Nachrichtenkanäle zeichnet Kanal,
  Konto, Absender und Metadaten zur Quelladresse auf. Konfigurationsändernde Vorgänge zeichnen außerdem
  Konfigurations-Hashes vor und nach der Änderung auf.
- Niemals Geheimnisse ausgeben. SecretRef-Inspektion sollte Verfügbarkeit melden, nicht
  Werte.
- Wenn der Gateway aktiv ist, bevorzugen Sie typisierte Gateway-Vorgänge. Wenn der Gateway
  ausgefallen ist, verwenden Sie nur die minimale lokale Reparaturoberfläche, die nicht vom
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

- `"auto"`: Standard. Nur erlauben, wenn die effektive Laufzeit YOLO ist und
  Sandboxing aus ist.
- `false`: Rettung über Nachrichtenkanäle niemals erlauben.
- `true`: Rettung explizit erlauben, wenn die Eigentümer-/Kanalprüfungen bestehen. Dies
  darf die Sandboxing-Verweigerung weiterhin nicht umgehen.

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

Ein Opt-in-Live-Smoke für die Befehlsschnittstelle des Kanals prüft `/crestodian status` sowie einen
dauerhaften Genehmigungs-Roundtrip durch den Rescue-Handler:

```bash
pnpm test:live:crestodian-rescue-channel
```

Frisches konfigurationsloses Setup über Crestodian wird abgedeckt durch:

```bash
pnpm test:docker:crestodian-first-run
```

Diese Lane beginnt mit einem leeren Zustandsverzeichnis, leitet reines `openclaw` an Crestodian weiter,
setzt das Standardmodell, erstellt einen zusätzlichen Agent, konfiguriert Discord über
eine Plugin-Aktivierung plus Token-SecretRef, validiert die Konfiguration und prüft das Audit-
Protokoll. QA Lab hat außerdem ein repo-gestütztes Szenario für denselben Ring-0-Ablauf:

```bash
pnpm openclaw qa suite --scenario crestodian-ring-zero-setup
```

## Verwandte Themen

- [CLI-Referenz](/de/cli)
- [Doctor](/de/cli/doctor)
- [TUI](/de/cli/tui)
- [Sandbox](/de/cli/sandbox)
- [Sicherheit](/de/cli/security)
