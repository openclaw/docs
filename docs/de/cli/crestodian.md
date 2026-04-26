---
read_when:
    - Sie führen `openclaw` ohne Befehl aus und möchten Crestodian verstehen
    - Sie benötigen eine configless-safe Möglichkeit, OpenClaw zu prüfen oder zu reparieren
    - Sie entwerfen oder aktivieren den Rettungsmodus für Nachrichtenkanäle
summary: CLI-Referenz und Sicherheitsmodell für Crestodian, den configless-safe Einrichtungs- und Reparaturhelfer
title: Crestodian
x-i18n:
    generated_at: "2026-04-26T11:25:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: aafa46de3c2df2ec4b0b16a0955bb9afc76df92d5ebb928077bb5007118e037c
    source_path: cli/crestodian.md
    workflow: 15
---

# `openclaw crestodian`

Crestodian ist der lokale Einrichtungs-, Reparatur- und Konfigurationshelfer von OpenClaw. Er ist so konzipiert, dass er erreichbar bleibt, wenn der normale Agentenpfad defekt ist.

Wenn Sie `openclaw` ohne Befehl ausführen, startet Crestodian in einem interaktiven Terminal.
Wenn Sie `openclaw crestodian` ausführen, startet derselbe Helfer explizit.

## Was Crestodian anzeigt

Beim Start öffnet der interaktive Crestodian dieselbe TUI-Shell wie
`openclaw tui`, jedoch mit einem Crestodian-Chat-Backend. Das Chatprotokoll beginnt mit einer kurzen Begrüßung:

- wann Crestodian gestartet werden sollte
- welchen Modell- oder deterministischen Planerpfad Crestodian tatsächlich verwendet
- Konfigurationsgültigkeit und den Standard-Agenten
- Gateway-Erreichbarkeit aus dem ersten Startprobe
- die nächste Debug-Aktion, die Crestodian ausführen kann

Er gibt keine Geheimnisse aus und lädt nicht nur zum Starten Plugin-CLI-Befehle. Die TUI stellt weiterhin die normale Kopfzeile, das Chatprotokoll, die Statuszeile, die Fußzeile, Autovervollständigung und Editor-Steuerelemente bereit.

Verwenden Sie `status` für das detaillierte Inventar mit Konfigurationspfad, Docs-/Quellpfaden,
lokalen CLI-Probes, Vorhandensein von API-Schlüsseln, Agenten, Modell und Gateway-Details.

Crestodian verwendet dieselbe OpenClaw-Referenzerkennung wie reguläre Agenten. In einem Git-Checkout verweist er auf das lokale `docs/` und den lokalen Quellbaum. In einer npm-Paketinstallation verwendet er die gebündelten Paketdokumente und verweist auf
[https://github.com/openclaw/openclaw](https://github.com/openclaw/openclaw), mit ausdrücklichem
Hinweis, den Quellcode zu prüfen, wenn die Dokumentation nicht ausreicht.

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
talk to work agent
talk to agent for ~/Projects/work
audit
quit
```

## Sicherer Start

Der Startpfad von Crestodian ist absichtlich klein gehalten. Er kann ausgeführt werden, wenn:

- `openclaw.json` fehlt
- `openclaw.json` ungültig ist
- das Gateway nicht verfügbar ist
- die Registrierung von Plugin-Befehlen nicht verfügbar ist
- noch kein Agent konfiguriert wurde

`openclaw --help` und `openclaw --version` verwenden weiterhin die normalen schnellen Pfade.
Nicht interaktives `openclaw` wird mit einer kurzen Meldung beendet, statt die Root-Hilfe auszugeben, weil das Produkt ohne Befehl Crestodian ist.

## Operationen und Genehmigung

Crestodian verwendet typisierte Operationen, statt die Konfiguration ad hoc zu bearbeiten.

Schreibgeschützte Operationen können sofort ausgeführt werden:

- Übersicht anzeigen
- Agenten auflisten
- Modell-/Backend-Status anzeigen
- Status- oder Gesundheitsprüfungen ausführen
- Gateway-Erreichbarkeit prüfen
- `doctor` ohne interaktive Korrekturen ausführen
- Konfiguration validieren
- den Pfad des Audit-Logs anzeigen

Persistente Operationen erfordern im interaktiven Modus eine Genehmigung per Unterhaltung, sofern Sie für einen direkten Befehl nicht `--yes` übergeben:

- Konfiguration schreiben
- `config set` ausführen
- unterstützte SecretRef-Werte über `config set-ref` setzen
- Setup-/Onboarding-Bootstrap ausführen
- das Standardmodell ändern
- das Gateway starten, stoppen oder neu starten
- Agenten erstellen
- `doctor`-Reparaturen ausführen, die Konfiguration oder Status neu schreiben

Angewendete Schreibvorgänge werden erfasst in:

```text
~/.openclaw/audit/crestodian.jsonl
```

Discovery wird nicht auditiert. Nur angewendete Operationen und Schreibvorgänge werden protokolliert.

`openclaw onboard --modern` startet Crestodian als moderne Onboarding-Vorschau.
Normales `openclaw onboard` führt weiterhin das klassische Onboarding aus.

## Setup Bootstrap

`setup` ist das chatbasierte Onboarding-Bootstrap. Es schreibt ausschließlich über typisierte
Konfigurationsoperationen und verlangt zuerst eine Genehmigung.

```text
setup
setup workspace ~/Projects/work
setup workspace ~/Projects/work model openai/gpt-5.5
```

Wenn kein Modell konfiguriert ist, wählt setup in dieser Reihenfolge das erste nutzbare Backend aus und teilt Ihnen mit, was ausgewählt wurde:

- vorhandenes explizites Modell, falls bereits konfiguriert
- `OPENAI_API_KEY` -> `openai/gpt-5.5`
- `ANTHROPIC_API_KEY` -> `anthropic/claude-opus-4-7`
- Claude Code CLI -> `claude-cli/claude-opus-4-7`
- Codex CLI -> `codex-cli/gpt-5.5`

Wenn keines verfügbar ist, schreibt setup trotzdem den Standard-Workspace und lässt das
Modell ungesetzt. Installieren Sie Codex oder Claude Code bzw. melden Sie sich dort an, oder stellen Sie
`OPENAI_API_KEY`/`ANTHROPIC_API_KEY` bereit, und führen Sie setup dann erneut aus.

## Modellgestützter Planer

Crestodian startet immer im deterministischen Modus. Bei unscharfen Befehlen, die der
deterministische Parser nicht versteht, kann lokaler Crestodian einen begrenzten Planer-Zug
über die normalen Laufzeitpfade von OpenClaw ausführen. Er verwendet zuerst das konfigurierte
OpenClaw-Modell. Wenn noch kein konfiguriertes Modell nutzbar ist, kann er auf lokale Laufzeiten
zurückgreifen, die bereits auf dem Rechner vorhanden sind:

- Claude Code CLI: `claude-cli/claude-opus-4-7`
- Codex-App-Server-Harness: `openai/gpt-5.5` mit `agentRuntime.id: "codex"`
- Codex CLI: `codex-cli/gpt-5.5`

Der modellgestützte Planer kann die Konfiguration nicht direkt verändern. Er muss die Anfrage
in einen der typisierten Befehle von Crestodian übersetzen; dann gelten die normalen Regeln für
Genehmigung und Audit. Crestodian gibt das verwendete Modell und den interpretierten
Befehl aus, bevor etwas ausgeführt wird. Konfigurationslose Fallback-Planer-Züge sind
temporär, ohne Tools, soweit die Laufzeit das unterstützt, und verwenden einen temporären
Workspace/eine temporäre Sitzung.

Der Rettungsmodus für Nachrichtenkanäle verwendet den modellgestützten Planer nicht. Die Remote-Rettung bleibt deterministisch, damit ein defekter oder kompromittierter normaler Agentenpfad nicht als Konfigurationseditor verwendet werden kann.

## Wechsel zu einem Agenten

Verwenden Sie einen natürlichsprachlichen Selektor, um Crestodian zu verlassen und die normale TUI zu öffnen:

```text
talk to agent
talk to work agent
switch to main agent
```

`openclaw tui`, `openclaw chat` und `openclaw terminal` öffnen weiterhin direkt die normale
Agenten-TUI. Sie starten nicht Crestodian.

Nach dem Wechsel in die normale TUI verwenden Sie `/crestodian`, um zu Crestodian zurückzukehren.
Sie können eine Folgeanfrage einschließen:

```text
/crestodian
/crestodian restart gateway
```

Agentenwechsel innerhalb der TUI hinterlassen einen Hinweis, dass `/crestodian` verfügbar ist.

## Nachrichten-Rettungsmodus

Der Nachrichten-Rettungsmodus ist der Einstiegspunkt von Crestodian für Nachrichtenkanäle. Er ist für den Fall gedacht, dass Ihr normaler Agent ausgefallen ist, aber ein vertrauenswürdiger Kanal wie WhatsApp weiterhin Befehle empfängt.

Unterstützter Textbefehl:

- `/crestodian <request>`

Ablauf für Operatoren:

```text
Sie, in einer vertrauenswürdigen Owner-DM: /crestodian status
OpenClaw: Crestodian-Rettungsmodus. Gateway erreichbar: nein. Konfiguration gültig: nein.
Sie: /crestodian restart gateway
OpenClaw: Plan: Gateway neu starten. Antworten Sie mit /crestodian yes, um anzuwenden.
Sie: /crestodian yes
OpenClaw: Angewendet. Audit-Eintrag geschrieben.
```

Das Erstellen von Agenten kann auch von der lokalen Eingabeaufforderung oder aus dem Rettungsmodus in die Warteschlange gestellt werden:

```text
create agent work workspace ~/Projects/work model openai/gpt-5.5
/crestodian create agent work workspace ~/Projects/work
```

Der Remote-Rettungsmodus ist eine Admin-Oberfläche. Er muss wie eine Remote-Konfigurationsreparatur behandelt werden, nicht wie normaler Chat.

Sicherheitsvertrag für die Remote-Rettung:

- Deaktiviert, wenn Sandboxing aktiv ist. Wenn ein Agent/eine Sitzung sandboxed ist,
  muss Crestodian die Remote-Rettung verweigern und erklären, dass lokale CLI-Reparatur
  erforderlich ist.
- Der effektive Standardzustand ist `auto`: Remote-Rettung nur in vertrauenswürdigem YOLO-Betrieb erlauben, bei dem die Laufzeit bereits unsandboxte lokale Autorität hat.
- Eine explizite Owner-Identität verlangen. Die Rettung darf keine Platzhalter-Senderregeln, offene Gruppenrichtlinien, nicht authentifizierte Webhooks oder anonyme Kanäle akzeptieren.
- Standardmäßig nur Owner-DMs. Gruppen-/Kanal-Rettung erfordert explizites Opt-in.
- Die Remote-Rettung kann weder die lokale TUI öffnen noch in eine interaktive Agentensitzung wechseln. Verwenden Sie lokales `openclaw` für die Übergabe an einen Agenten.
- Persistente Schreibvorgänge erfordern auch im Rettungsmodus weiterhin eine Genehmigung.
- Jede angewendete Rettungsoperation auditieren. Die Rettung über Nachrichtenkanäle erfasst Kanal-, Konto-, Sender- und Quelladress-Metadaten. Konfigurationsändernde Operationen erfassen außerdem Konfigurations-Hashes vor und nach der Änderung.
- Niemals Geheimnisse ausgeben. SecretRef-Inspektion sollte Verfügbarkeit melden, nicht Werte.
- Wenn das Gateway aktiv ist, bevorzugt Gateway typisierte Operationen verwenden. Wenn das Gateway ausgefallen ist, nur die minimale lokale Reparaturoberfläche verwenden, die nicht von der normalen Agentenschleife abhängt.

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
  Sandboxing deaktiviert ist.
- `false`: Rettung über Nachrichtenkanäle niemals erlauben.
- `true`: Rettung explizit erlauben, wenn die Owner-/Kanal-Prüfungen erfolgreich sind. Dies darf die Verweigerung durch Sandboxing weiterhin nicht umgehen.

Die standardmäßige YOLO-Haltung von `"auto"` ist:

- Sandbox-Modus wird zu `off` aufgelöst
- `tools.exec.security` wird zu `full` aufgelöst
- `tools.exec.ask` wird zu `off` aufgelöst

Die Remote-Rettung wird durch die Docker-Lane abgedeckt:

```bash
pnpm test:docker:crestodian-rescue
```

Der konfigurationslose lokale Planer-Fallback wird abgedeckt durch:

```bash
pnpm test:docker:crestodian-planner
```

Eine Live-Prüfung der Befehlsoberfläche im Kanal als Opt-in prüft `/crestodian status` sowie einen persistenten Genehmigungs-Roundtrip über den Rettungshandler:

```bash
pnpm test:live:crestodian-rescue-channel
```

Ein frisches konfigurationsloses Setup über Crestodian wird abgedeckt durch:

```bash
pnpm test:docker:crestodian-first-run
```

Diese Lane startet mit einem leeren Statusverzeichnis, leitet nacktes `openclaw` an Crestodian weiter,
setzt das Standardmodell, erstellt einen zusätzlichen Agenten, konfiguriert Discord über eine
Plugin-Aktivierung plus Token-SecretRef, validiert die Konfiguration und prüft das Audit-Log.
QA Lab hat außerdem ein repo-gestütztes Szenario für denselben Ring-0-Ablauf:

```bash
pnpm openclaw qa suite --scenario crestodian-ring-zero-setup
```

## Verwandt

- [CLI-Referenz](/de/cli)
- [Doctor](/de/cli/doctor)
- [TUI](/de/cli/tui)
- [Sandbox](/de/cli/sandbox)
- [Sicherheit](/de/cli/security)
