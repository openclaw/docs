---
read_when:
    - Sie führen `openclaw` ohne Befehl aus und möchten Crestodian verstehen
    - Sie benötigen eine konfigurationslos sichere Möglichkeit, OpenClaw zu prüfen oder zu reparieren
    - Sie entwerfen oder aktivieren den Rettungsmodus für Nachrichtenkanäle
summary: CLI-Referenz und Sicherheitsmodell für Crestodian, den konfigurationslos sicheren Einrichtungs- und Reparaturhelfer
title: Crestodian
x-i18n:
    generated_at: "2026-04-25T13:43:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: ebcd6a72f78134fa572a85acc6c2f0381747a27fd6be84269c273390300bb533
    source_path: cli/crestodian.md
    workflow: 15
---

# `openclaw crestodian`

Crestodian ist der lokale Helfer von OpenClaw für Einrichtung, Reparatur und Konfiguration. Er ist
darauf ausgelegt, erreichbar zu bleiben, wenn der normale Agentenpfad defekt ist.

Wenn Sie `openclaw` ohne Befehl ausführen, startet Crestodian in einem interaktiven Terminal.
Wenn Sie `openclaw crestodian` ausführen, startet derselbe Helfer explizit.

## Was Crestodian anzeigt

Beim Start öffnet interaktives Crestodian dieselbe TUI-Shell wie
`openclaw tui`, jedoch mit einem Crestodian-Chat-Backend. Das Chatprotokoll beginnt mit einer kurzen
Begrüßung:

- wann Crestodian gestartet werden sollte
- welches Modell oder welcher deterministische Planerpfad von Crestodian tatsächlich verwendet wird
- Konfigurationsgültigkeit und der Standard-Agent
- Gateway-Erreichbarkeit aus der ersten Startprobe
- die nächste Debug-Aktion, die Crestodian ausführen kann

Es gibt keine Geheimnisse aus und lädt nicht erst Plugin-CLI-Befehle, nur um zu starten. Die TUI
bietet weiterhin den normalen Header, das Chatprotokoll, die Statuszeile, die Fußzeile, die Autovervollständigung
und die Editor-Steuerung.

Verwenden Sie `status` für das detaillierte Inventar mit Konfigurationspfad, Docs-/Source-Pfaden,
lokalen CLI-Sonden, Vorhandensein von API-Schlüsseln, Agenten, Modell und Gateway-Details.

Crestodian verwendet dieselbe OpenClaw-Referenzsuche wie reguläre Agenten. In einem Git-Checkout
zeigt es auf lokale `docs/` und den lokalen Source-Baum. In einer npm-Paketinstallation
verwendet es die gebündelte Paketdokumentation und verlinkt auf
[https://github.com/openclaw/openclaw](https://github.com/openclaw/openclaw), mit ausdrücklichem
Hinweis, den Source zu prüfen, wenn die Dokumentation nicht ausreicht.

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
setup workspace ~/Projects/work
setup workspace ~/Projects/work model openai/gpt-5.5
config set gateway.port 19001
config set-ref gateway.auth.token env OPENCLAW_GATEWAY_TOKEN
gateway status
restart gateway
agents
create agent work workspace ~/Projects/work
models
set default model openai/gpt-5.5
talk to work agent
talk to agent for ~/Projects/work
audit
quit
```

## Sicherer Start

Der Startpfad von Crestodian ist absichtlich klein gehalten. Es kann ausgeführt werden, wenn:

- `openclaw.json` fehlt
- `openclaw.json` ungültig ist
- das Gateway nicht läuft
- die Registrierung von Plugin-Befehlen nicht verfügbar ist
- noch kein Agent konfiguriert wurde

`openclaw --help` und `openclaw --version` verwenden weiterhin die normalen schnellen Pfade.
Nicht interaktives `openclaw` beendet sich mit einer kurzen Nachricht, statt die Root-Hilfe
auszugeben, denn das Produkt ohne Befehl ist Crestodian.

## Operationen und Genehmigung

Crestodian verwendet typisierte Operationen statt Konfiguration ad hoc zu bearbeiten.

Schreibgeschützte Operationen können sofort ausgeführt werden:

- Übersicht anzeigen
- Agenten auflisten
- Modell-/Backend-Status anzeigen
- Status- oder Gesundheitsprüfungen ausführen
- Gateway-Erreichbarkeit prüfen
- `doctor` ohne interaktive Korrekturen ausführen
- Konfiguration validieren
- Pfad des Audit-Logs anzeigen

Persistente Operationen erfordern im interaktiven Modus eine Genehmigung per Konversation, es sei denn,
Sie übergeben `--yes` für einen direkten Befehl:

- Konfiguration schreiben
- `config set` ausführen
- unterstützte SecretRef-Werte über `config set-ref` setzen
- Setup-/Onboarding-Bootstrap ausführen
- das Standardmodell ändern
- das Gateway starten, stoppen oder neu starten
- Agenten erstellen
- `doctor`-Reparaturen ausführen, die Konfiguration oder Status umschreiben

Angewendete Schreibvorgänge werden protokolliert in:

```text
~/.openclaw/audit/crestodian.jsonl
```

Discovery wird nicht auditiert. Nur angewendete Operationen und Schreibvorgänge werden protokolliert.

`openclaw onboard --modern` startet Crestodian als moderne Onboarding-Vorschau.
Einfaches `openclaw onboard` führt weiterhin das klassische Onboarding aus.

## Setup-Bootstrap

`setup` ist das chatbasierte Onboarding-Bootstrap. Es schreibt nur über typisierte
Konfigurationsoperationen und fragt vorher um Genehmigung.

```text
setup
setup workspace ~/Projects/work
setup workspace ~/Projects/work model openai/gpt-5.5
```

Wenn kein Modell konfiguriert ist, wählt das Setup das erste nutzbare Backend in dieser
Reihenfolge und teilt Ihnen mit, was es gewählt hat:

- vorhandenes explizites Modell, falls bereits konfiguriert
- `OPENAI_API_KEY` -> `openai/gpt-5.5`
- `ANTHROPIC_API_KEY` -> `anthropic/claude-opus-4-7`
- Claude Code CLI -> `claude-cli/claude-opus-4-7`
- Codex CLI -> `codex-cli/gpt-5.5`

Wenn keines verfügbar ist, schreibt das Setup dennoch den Standard-Workspace und lässt das
Modell ungesetzt. Installieren Sie Codex/Claude Code oder melden Sie sich dort an, oder machen Sie
`OPENAI_API_KEY`/`ANTHROPIC_API_KEY` verfügbar und führen Sie dann das Setup erneut aus.

## Modellgestützter Planer

Crestodian startet immer im deterministischen Modus. Für unscharfe Befehle, die der
deterministische Parser nicht versteht, kann lokales Crestodian einen begrenzten Planer-Turn
über die normalen Laufzeitpfade von OpenClaw ausführen. Es verwendet dabei zuerst das
konfigurierte OpenClaw-Modell. Wenn noch kein konfiguriertes Modell nutzbar ist, kann es
auf lokale Laufzeiten zurückfallen, die bereits auf dem Rechner vorhanden sind:

- Claude Code CLI: `claude-cli/claude-opus-4-7`
- Codex-App-Server-Harness: `openai/gpt-5.5` mit `embeddedHarness.runtime: "codex"`
- Codex CLI: `codex-cli/gpt-5.5`

Der modellgestützte Planer kann die Konfiguration nicht direkt verändern. Er muss die
Anfrage in einen der typisierten Befehle von Crestodian übersetzen, dann gelten die normalen
Genehmigungs- und Audit-Regeln. Crestodian gibt das verwendete Modell und den interpretierten
Befehl aus, bevor es irgendetwas ausführt. Konfigurationslose Fallback-Planer-Turns sind
temporär, soweit von der Laufzeit unterstützt ohne Tools und verwenden einen temporären
Workspace/eine temporäre Sitzung.

Der Rettungsmodus für Nachrichtenkanäle verwendet den modellgestützten Planer nicht. Remote-
Rettung bleibt deterministisch, damit ein defekter oder kompromittierter normaler Agentenpfad
nicht als Konfigurationseditor verwendet werden kann.

## Zu einem Agenten wechseln

Verwenden Sie einen Selektor in natürlicher Sprache, um Crestodian zu verlassen und die normale TUI zu öffnen:

```text
talk to agent
talk to work agent
switch to main agent
```

`openclaw tui`, `openclaw chat` und `openclaw terminal` öffnen weiterhin direkt die normale
Agenten-TUI. Sie starten Crestodian nicht.

Nachdem Sie in die normale TUI gewechselt haben, verwenden Sie `/crestodian`, um zu Crestodian zurückzukehren.
Sie können eine Folgeanfrage einschließen:

```text
/crestodian
/crestodian restart gateway
```

Agentenwechsel innerhalb der TUI hinterlassen einen Hinweis, dass `/crestodian` verfügbar ist.

## Nachrichten-Rettungsmodus

Der Nachrichten-Rettungsmodus ist der Einstiegspunkt für Crestodian über Nachrichtenkanäle. Er ist für
den Fall gedacht, dass Ihr normaler Agent ausgefallen ist, aber ein vertrauenswürdiger Kanal wie WhatsApp
weiterhin Befehle empfängt.

Unterstützter Textbefehl:

- `/crestodian <request>`

Ablauf für Operatoren:

```text
You, in a trusted owner DM: /crestodian status
OpenClaw: Crestodian rescue mode. Gateway reachable: no. Config valid: no.
You: /crestodian restart gateway
OpenClaw: Plan: restart the Gateway. Reply /crestodian yes to apply.
You: /crestodian yes
OpenClaw: Applied. Audit entry written.
```

Das Erstellen von Agenten kann auch von der lokalen Eingabeaufforderung oder dem Rettungsmodus aus in die Warteschlange gestellt werden:

```text
create agent work workspace ~/Projects/work model openai/gpt-5.5
/crestodian create agent work workspace ~/Projects/work
```

Der Remote-Rettungsmodus ist eine Admin-Oberfläche. Er muss wie eine Remote-
Konfigurationsreparatur behandelt werden, nicht wie normaler Chat.

Sicherheitsvertrag für Remote-Rettung:

- Deaktiviert, wenn Sandboxing aktiv ist. Wenn ein Agent/eine Sitzung sandboxed ist,
  muss Crestodian die Remote-Rettung verweigern und erklären, dass lokale CLI-Reparatur
  erforderlich ist.
- Der effektive Standardstatus ist `auto`: Remote-Rettung nur in vertrauenswürdigem YOLO-Betrieb zulassen,
  bei dem die Laufzeit bereits unsandboxte lokale Autorität hat.
- Eine explizite Eigentümeridentität verlangen. Rettung darf keine Wildcard-Absenderregeln,
  keine offene Gruppenrichtlinie, keine nicht authentifizierten Webhooks und keine anonymen Kanäle akzeptieren.
- Standardmäßig nur Eigentümer-DMs. Rettung über Gruppen/Kanäle erfordert explizites Opt-in und
  sollte Genehmigungsaufforderungen weiterhin an die Eigentümer-DM weiterleiten.
- Remote-Rettung kann weder die lokale TUI öffnen noch in eine interaktive Agentensitzung wechseln.
  Verwenden Sie lokales `openclaw` für die Übergabe an einen Agenten.
- Persistente Schreibvorgänge erfordern auch im Rettungsmodus weiterhin eine Genehmigung.
- Jede angewendete Rettungsoperation auditieren, einschließlich Kanal, Konto, Absender,
  Sitzungsschlüssel, Operation, Konfigurations-Hash vorher und Konfigurations-Hash nachher.
- Niemals Geheimnisse ausgeben. SecretRef-Inspektion sollte Verfügbarkeit melden, nicht Werte.
- Wenn das Gateway lebt, Gateway-typisierte Operationen bevorzugen. Wenn das Gateway tot ist,
  nur die minimale lokale Reparaturoberfläche verwenden, die nicht von der normalen Agentenschleife abhängt.

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

- `"auto"`: Standard. Nur zulassen, wenn die effektive Laufzeit YOLO ist und
  Sandboxing aus ist.
- `false`: Rettung über Nachrichtenkanäle niemals zulassen.
- `true`: Rettung explizit zulassen, wenn die Eigentümer-/Kanalprüfungen erfolgreich sind. Dies
  darf die Verweigerung durch Sandboxing dennoch nicht umgehen.

Die standardmäßige YOLO-Haltung von `"auto"` ist:

- der Sandbox-Modus wird zu `off` aufgelöst
- `tools.exec.security` wird zu `full` aufgelöst
- `tools.exec.ask` wird zu `off` aufgelöst

Remote-Rettung wird durch die Docker-Lane abgedeckt:

```bash
pnpm test:docker:crestodian-rescue
```

Der konfigurationslose lokale Planer-Fallback wird abgedeckt durch:

```bash
pnpm test:docker:crestodian-planner
```

Eine Live-Prüfung der Befehlsoberfläche im Kanal mit Opt-in prüft `/crestodian status` sowie einen
persistenten Genehmigungs-Roundtrip über den Rettungshandler:

```bash
pnpm test:live:crestodian-rescue-channel
```

Ein frisches konfigurationsloses Setup über Crestodian wird abgedeckt durch:

```bash
pnpm test:docker:crestodian-first-run
```

Diese Lane startet mit einem leeren Statusverzeichnis, leitet nacktes `openclaw` an Crestodian weiter,
setzt das Standardmodell, erstellt einen zusätzlichen Agenten, konfiguriert Discord über
eine Plugin-Aktivierung plus Token-SecretRef, validiert die Konfiguration und prüft das Audit-
Log. QA Lab hat außerdem ein repo-gestütztes Szenario für denselben Ring-0-Ablauf:

```bash
pnpm openclaw qa suite --scenario crestodian-ring-zero-setup
```

## Verwandt

- [CLI reference](/de/cli)
- [Doctor](/de/cli/doctor)
- [TUI](/de/cli/tui)
- [Sandbox](/de/cli/sandbox)
- [Security](/de/cli/security)
