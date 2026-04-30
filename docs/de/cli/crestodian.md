---
read_when:
    - Sie führen openclaw ohne Befehl aus und möchten Crestodian verstehen
    - Sie benötigen eine auch ohne Konfiguration sichere Möglichkeit, OpenClaw zu prüfen oder zu reparieren
    - Sie entwerfen oder aktivieren den Rettungsmodus für Nachrichtenkanäle
summary: CLI-Referenz und Sicherheitsmodell für Crestodian, den konfigurationslos sicheren Einrichtungs- und Reparaturhelfer
title: Crestodian
x-i18n:
    generated_at: "2026-04-30T06:44:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: e09331a5303120e9044ae147426ad17caeed35f092b316506ca8e4e3a1c55157
    source_path: cli/crestodian.md
    workflow: 16
---

# `openclaw crestodian`

Crestodian ist OpenClaws lokaler Helfer für Einrichtung, Reparatur und Konfiguration. Er ist
so konzipiert, dass er erreichbar bleibt, wenn der normale Agent-Pfad defekt ist.

Wenn `openclaw` ohne Befehl ausgeführt wird, startet Crestodian in einem interaktiven Terminal.
Wenn `openclaw crestodian` ausgeführt wird, startet derselbe Helfer explizit.

## Was Crestodian anzeigt

Beim Start öffnet der interaktive Crestodian dieselbe TUI-Shell, die auch von
`openclaw tui` verwendet wird, mit einem Crestodian-Chat-Backend. Das Chatprotokoll beginnt mit einer kurzen
Begrüßung:

- wann Crestodian gestartet werden sollte
- welchen Modell- oder deterministischen Planerpfad Crestodian tatsächlich verwendet
- Konfigurationsgültigkeit und Standard-Agent
- Gateway-Erreichbarkeit aus der ersten Startprüfung
- welche nächste Debug-Aktion Crestodian ausführen kann

Er gibt keine Geheimnisse aus und lädt keine Plugin-CLI-Befehle nur für den Start. Die TUI
stellt weiterhin den normalen Header, das Chatprotokoll, die Statuszeile, die Fußzeile, Autovervollständigung
und Editor-Steuerelemente bereit.

Verwenden Sie `status` für die detaillierte Bestandsaufnahme mit Konfigurationspfad, Dokumentations-/Quellpfaden,
lokalen CLI-Prüfungen, Vorhandensein von API-Schlüsseln, Agents, Modell und Gateway-Details.

Crestodian verwendet dieselbe OpenClaw-Referenzerkennung wie reguläre Agents. In einem Git-Checkout
verweist er auf die lokalen `docs/` und den lokalen Quellbaum. Bei einer npm-Paketinstallation
verwendet er die gebündelte Paketdokumentation und verlinkt auf
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

Crestodians Startpfad ist absichtlich klein. Er kann ausgeführt werden, wenn:

- `openclaw.json` fehlt
- `openclaw.json` ungültig ist
- das Gateway nicht läuft
- die Registrierung von Plugin-Befehlen nicht verfügbar ist
- noch kein Agent konfiguriert wurde

`openclaw --help` und `openclaw --version` verwenden weiterhin die normalen schnellen Pfade.
Nicht interaktives `openclaw` beendet sich mit einer kurzen Meldung, statt die Root-Hilfe
auszugeben, weil das Produkt ohne Befehl Crestodian ist.

## Vorgänge und Genehmigung

Crestodian verwendet typisierte Vorgänge, statt die Konfiguration ad hoc zu bearbeiten.

Schreibgeschützte Vorgänge können sofort ausgeführt werden:

- Übersicht anzeigen
- Agents auflisten
- Modell-/Backend-Status anzeigen
- Status- oder Integritätsprüfungen ausführen
- Gateway-Erreichbarkeit prüfen
- Doctor ohne interaktive Korrekturen ausführen
- Konfiguration validieren
- Pfad des Audit-Protokolls anzeigen

Persistente Vorgänge erfordern im interaktiven Modus eine Genehmigung im Gespräch, sofern
Sie nicht `--yes` für einen direkten Befehl übergeben:

- Konfiguration schreiben
- `config set` ausführen
- unterstützte SecretRef-Werte über `config set-ref` setzen
- Einrichtung-/Onboarding-Bootstrap ausführen
- Standardmodell ändern
- Gateway starten, stoppen oder neu starten
- Agents erstellen
- Doctor-Reparaturen ausführen, die Konfiguration oder Zustand umschreiben

Angewendete Schreibvorgänge werden hier aufgezeichnet:

```text
~/.openclaw/audit/crestodian.jsonl
```

Erkennung wird nicht auditiert. Nur angewendete Vorgänge und Schreibvorgänge werden protokolliert.

`openclaw onboard --modern` startet Crestodian als moderne Onboarding-Vorschau.
Ein einfaches `openclaw onboard` führt weiterhin das klassische Onboarding aus.

## Einrichtungs-Bootstrap

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

## Modellgestützter Planer

Crestodian startet immer im deterministischen Modus. Für unscharfe Befehle, die der
deterministische Parser nicht versteht, kann der lokale Crestodian einen begrenzten
Planerzug über OpenClaws normale Laufzeitpfade durchführen. Er verwendet zuerst das
konfigurierte OpenClaw-Modell. Wenn noch kein konfiguriertes Modell nutzbar ist, kann er auf
lokale Laufzeiten zurückfallen, die bereits auf der Maschine vorhanden sind:

- Claude Code CLI: `claude-cli/claude-opus-4-7`
- Codex-App-Server-Harness: `openai/gpt-5.5` mit `agentRuntime.id: "codex"`
- Codex CLI: `codex-cli/gpt-5.5`

Der modellgestützte Planer kann die Konfiguration nicht direkt verändern. Er muss die
Anfrage in einen der typisierten Befehle von Crestodian übersetzen; anschließend gelten die normalen Genehmigungs- und
Audit-Regeln. Crestodian gibt das verwendete Modell und den interpretierten
Befehl aus, bevor etwas ausgeführt wird. Konfigurationslose Fallback-Planerzüge sind
temporär, dort werkzeugdeaktiviert, wo die Laufzeit dies unterstützt, und verwenden einen temporären
Workspace/eine temporäre Sitzung.

Der Nachrichtenkanal-Rettungsmodus verwendet den modellgestützten Planer nicht. Remote-
Rettung bleibt deterministisch, damit ein defekter oder kompromittierter normaler Agent-Pfad nicht
als Konfigurationseditor verwendet werden kann.

## Zu einem Agent wechseln

Verwenden Sie einen Selektor in natürlicher Sprache, um Crestodian zu verlassen und die normale TUI zu öffnen:

```text
talk to agent
talk to work agent
switch to main agent
```

`openclaw tui`, `openclaw chat` und `openclaw terminal` öffnen weiterhin direkt die normale
Agent-TUI. Sie starten Crestodian nicht.

Nach dem Wechsel in die normale TUI verwenden Sie `/crestodian`, um zu Crestodian zurückzukehren.
Sie können eine Folgeanfrage anfügen:

```text
/crestodian
/crestodian restart gateway
```

Agent-Wechsel innerhalb der TUI hinterlassen einen Hinweis, dass `/crestodian` verfügbar ist.

## Nachrichten-Rettungsmodus

Der Nachrichten-Rettungsmodus ist der Nachrichtenkanal-Einstiegspunkt für Crestodian. Er ist für
den Fall gedacht, dass Ihr normaler Agent tot ist, ein vertrauenswürdiger Kanal wie WhatsApp
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

Agent-Erstellung kann ebenfalls über die lokale Eingabeaufforderung oder den Rettungsmodus in die Warteschlange gestellt werden:

```text
create agent work workspace ~/Projects/work model openai/gpt-5.5
/crestodian create agent work workspace ~/Projects/work
```

Der Remote-Rettungsmodus ist eine Admin-Oberfläche. Er muss wie Remote-Konfigurationsreparatur
behandelt werden, nicht wie normaler Chat.

Sicherheitsvertrag für Remote-Rettung:

- Deaktiviert, wenn Sandboxing aktiv ist. Wenn ein Agent/eine Sitzung in einer Sandbox läuft,
  muss Crestodian Remote-Rettung verweigern und erklären, dass lokale CLI-Reparatur
  erforderlich ist.
- Der standardmäßig wirksame Zustand ist `auto`: Remote-Rettung nur im vertrauenswürdigen YOLO-
  Betrieb erlauben, bei dem die Laufzeit bereits lokale Autorität ohne Sandbox besitzt.
- Eine explizite Owner-Identität verlangen. Rettung darf keine Platzhalter-Absenderregeln,
  offene Gruppenrichtlinien, nicht authentifizierten Webhooks oder anonymen Kanäle akzeptieren.
- Owner-DMs standardmäßig nur. Rettung in Gruppen/Kanälen erfordert explizites Opt-in.
- Remote-Rettung kann die lokale TUI nicht öffnen oder in eine interaktive Agent-
  Sitzung wechseln. Verwenden Sie lokales `openclaw` für die Agent-Übergabe.
- Persistente Schreibvorgänge erfordern weiterhin Genehmigung, auch im Rettungsmodus.
- Jeden angewendeten Rettungsvorgang auditieren. Nachrichtenkanal-Rettung zeichnet Kanal,
  Konto, Absender und Quelladress-Metadaten auf. Konfigurationsverändernde Vorgänge zeichnen außerdem
  Konfigurations-Hashes davor und danach auf.
- Niemals Geheimnisse ausgeben. SecretRef-Prüfung sollte Verfügbarkeit melden, nicht
  Werte.
- Wenn das Gateway aktiv ist, bevorzugen Sie typisierte Gateway-Vorgänge. Wenn das Gateway
  tot ist, verwenden Sie nur die minimale lokale Reparaturoberfläche, die nicht von der
  normalen Agent-Schleife abhängt.

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

- `"auto"`: Standard. Nur erlauben, wenn die wirksame Laufzeit YOLO ist und
  Sandboxing ausgeschaltet ist.
- `false`: Nachrichtenkanal-Rettung niemals erlauben.
- `true`: Rettung explizit erlauben, wenn die Owner-/Kanalprüfungen bestehen. Dies
  darf die Sandboxing-Verweigerung weiterhin nicht umgehen.

Die standardmäßige `"auto"`-YOLO-Haltung ist:

- Sandbox-Modus wird zu `off` aufgelöst
- `tools.exec.security` wird zu `full` aufgelöst
- `tools.exec.ask` wird zu `off` aufgelöst

Remote-Rettung wird durch die Docker-Bahn abgedeckt:

```bash
pnpm test:docker:crestodian-rescue
```

Der konfigurationslose lokale Planer-Fallback wird abgedeckt durch:

```bash
pnpm test:docker:crestodian-planner
```

Ein Opt-in-Live-Smoke für die Kanalbefehlsoberfläche prüft `/crestodian status` plus einen
persistenten Genehmigungs-Roundtrip durch den Rettungs-Handler:

```bash
pnpm test:live:crestodian-rescue-channel
```

Frische konfigurationslose Einrichtung über Crestodian wird abgedeckt durch:

```bash
pnpm test:docker:crestodian-first-run
```

Diese Bahn startet mit einem leeren Zustandsverzeichnis, leitet schlichtes `openclaw` an Crestodian weiter,
setzt das Standardmodell, erstellt einen zusätzlichen Agent, konfiguriert Discord über
eine Plugin-Aktivierung plus Token-SecretRef, validiert die Konfiguration und prüft das Audit-
Protokoll. QA Lab hat außerdem ein repo-gestütztes Szenario für denselben Ring-0-Ablauf:

```bash
pnpm openclaw qa suite --scenario crestodian-ring-zero-setup
```

## Verwandt

- [CLI-Referenz](/de/cli)
- [Doctor](/de/cli/doctor)
- [TUI](/de/cli/tui)
- [Sandbox](/de/cli/sandbox)
- [Sicherheit](/de/cli/security)
