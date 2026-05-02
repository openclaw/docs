---
read_when:
    - Sie führen openclaw ohne Befehl aus und möchten Crestodian verstehen
    - Sie benötigen eine auch ohne Konfiguration sichere Möglichkeit, OpenClaw zu prüfen oder zu reparieren
    - Sie entwerfen oder aktivieren den Rettungsmodus für Nachrichtenkanäle
summary: CLI-Referenz und Sicherheitsmodell für Crestodian, den konfigurationslos sicheren Einrichtungs- und Reparaturhelfer
title: Crestodian
x-i18n:
    generated_at: "2026-05-02T06:29:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: 30e7cd9bea920cb1201d4f17f3db7b04eafdb4c87e8a62f99229e6aeb177f64c
    source_path: cli/crestodian.md
    workflow: 16
---

# `openclaw crestodian`

Crestodian ist OpenClaws lokaler Helfer für Einrichtung, Reparatur und Konfiguration. Er ist
darauf ausgelegt, erreichbar zu bleiben, wenn der normale Agentenpfad defekt ist.

Wenn Sie `openclaw` ohne Befehl ausführen, startet Crestodian in einem interaktiven Terminal.
Wenn Sie `openclaw crestodian` ausführen, startet derselbe Helfer explizit.

## Was Crestodian anzeigt

Beim Start öffnet der interaktive Crestodian dieselbe TUI-Shell wie
`openclaw tui`, mit einem Crestodian-Chat-Backend. Das Chatprotokoll beginnt mit einer kurzen
Begrüßung:

- wann Crestodian gestartet werden sollte
- welchen Modell- oder deterministischen Planerpfad Crestodian tatsächlich verwendet
- Konfigurationsgültigkeit und den Standardagenten
- Gateway-Erreichbarkeit aus der ersten Startprüfung
- die nächste Debug-Aktion, die Crestodian ausführen kann

Er gibt keine Secrets aus und lädt Plugin-CLI-Befehle nicht nur für den Start. Die TUI
stellt weiterhin den normalen Header, das Chatprotokoll, die Statuszeile, die Fußzeile, Autovervollständigung
und Editor-Steuerelemente bereit.

Verwenden Sie `status` für die detaillierte Bestandsaufnahme mit Konfigurationspfad, Doku-/Quellpfaden,
lokalen CLI-Prüfungen, API-Key-Verfügbarkeit, Agenten, Modell und Gateway-Details.

Crestodian verwendet dieselbe OpenClaw-Referenzsuche wie reguläre Agenten. In einem Git-Checkout
verweist er auf das lokale `docs/` und den lokalen Quellbaum. In einer npm-Paketinstallation
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
- das Gateway nicht läuft
- die Registrierung von Plugin-Befehlen nicht verfügbar ist
- noch kein Agent konfiguriert wurde

`openclaw --help` und `openclaw --version` verwenden weiterhin die normalen schnellen Pfade.
Nicht interaktives `openclaw` beendet sich mit einer kurzen Meldung, statt die Root-Hilfe
auszugeben, weil das Produkt ohne Befehl Crestodian ist.

## Vorgänge und Zustimmung

Crestodian verwendet typisierte Vorgänge, statt die Konfiguration ad hoc zu bearbeiten.

Schreibgeschützte Vorgänge können sofort ausgeführt werden:

- Übersicht anzeigen
- Agenten auflisten
- installierte Plugins auflisten
- ClawHub-Plugins suchen
- Modell-/Backend-Status anzeigen
- Status- oder Health-Prüfungen ausführen
- Gateway-Erreichbarkeit prüfen
- Doctor ohne interaktive Reparaturen ausführen
- Konfiguration validieren
- Audit-Log-Pfad anzeigen

Persistente Vorgänge erfordern im interaktiven Modus eine Zustimmung im Gespräch, außer
Sie übergeben `--yes` für einen direkten Befehl:

- Konfiguration schreiben
- `config set` ausführen
- unterstützte SecretRef-Werte über `config set-ref` setzen
- Einrichtungs-/Onboarding-Bootstrap ausführen
- das Standardmodell ändern
- das Gateway starten, stoppen oder neu starten
- Agenten erstellen
- Plugins aus ClawHub oder npm installieren
- Plugins deinstallieren
- Doctor-Reparaturen ausführen, die Konfiguration oder Zustand neu schreiben

Angewendete Schreibvorgänge werden aufgezeichnet in:

```text
~/.openclaw/audit/crestodian.jsonl
```

Suche wird nicht auditiert. Nur angewendete Vorgänge und Schreibvorgänge werden protokolliert.

`openclaw onboard --modern` startet Crestodian als moderne Onboarding-Vorschau.
Ein einfaches `openclaw onboard` führt weiterhin das klassische Onboarding aus.

## Einrichtungs-Bootstrap

`setup` ist der chatbasierte Onboarding-Bootstrap. Er schreibt nur über typisierte
Konfigurationsvorgänge und fragt zuerst nach Zustimmung.

```text
setup
setup workspace ~/Projects/work
setup workspace ~/Projects/work model openai/gpt-5.5
```

Wenn kein Modell konfiguriert ist, wählt setup das erste nutzbare Backend in dieser
Reihenfolge aus und teilt Ihnen mit, was gewählt wurde:

- vorhandenes explizites Modell, falls bereits konfiguriert
- `OPENAI_API_KEY` -> `openai/gpt-5.5`
- `ANTHROPIC_API_KEY` -> `anthropic/claude-opus-4-7`
- Claude Code CLI -> `claude-cli/claude-opus-4-7`
- Codex CLI -> `codex-cli/gpt-5.5`

Wenn keines verfügbar ist, schreibt setup trotzdem den Standardarbeitsbereich und lässt das
Modell ungesetzt. Installieren Sie Codex/Claude Code oder melden Sie sich dort an, oder stellen Sie
`OPENAI_API_KEY`/`ANTHROPIC_API_KEY` bereit, und führen Sie setup dann erneut aus.

## Modellgestützter Planer

Crestodian startet immer im deterministischen Modus. Für unscharfe Befehle, die der
deterministische Parser nicht versteht, kann der lokale Crestodian einen begrenzten
Planer-Durchlauf über OpenClaws normale Laufzeitpfade ausführen. Er verwendet zuerst das
konfigurierte OpenClaw-Modell. Wenn noch kein konfiguriertes Modell nutzbar ist, kann er auf
lokale Laufzeiten zurückfallen, die bereits auf der Maschine vorhanden sind:

- Claude Code CLI: `claude-cli/claude-opus-4-7`
- Codex-App-Server-Harness: `openai/gpt-5.5` mit `agentRuntime.id: "codex"`
- Codex CLI: `codex-cli/gpt-5.5`

Der modellgestützte Planer kann die Konfiguration nicht direkt verändern. Er muss die
Anfrage in einen der typisierten Crestodian-Befehle übersetzen; danach gelten die normalen Zustimmungs-
und Audit-Regeln. Crestodian gibt das verwendete Modell und den interpretierten
Befehl aus, bevor etwas ausgeführt wird. Planer-Durchläufe als konfigurationsloser Fallback sind
temporär, werkzeugdeaktiviert, sofern die Laufzeit dies unterstützt, und verwenden einen temporären
Arbeitsbereich bzw. eine temporäre Sitzung.

Der Rettungsmodus für Nachrichtenkanäle verwendet den modellgestützten Planer nicht. Die entfernte
Rettung bleibt deterministisch, damit ein defekter oder kompromittierter normaler Agentenpfad nicht
als Konfigurationseditor verwendet werden kann.

## Zu einem Agenten wechseln

Verwenden Sie einen natürlichsprachlichen Selektor, um Crestodian zu verlassen und die normale TUI zu öffnen:

```text
talk to agent
talk to work agent
switch to main agent
```

`openclaw tui`, `openclaw chat` und `openclaw terminal` öffnen weiterhin direkt die normale
Agenten-TUI. Sie starten Crestodian nicht.

Nachdem Sie in die normale TUI gewechselt sind, verwenden Sie `/crestodian`, um zu Crestodian zurückzukehren.
Sie können eine Folgeanfrage einschließen:

```text
/crestodian
/crestodian restart gateway
```

Agentenwechsel innerhalb der TUI hinterlassen einen Hinweis, dass `/crestodian` verfügbar ist.

## Nachrichten-Rettungsmodus

Der Nachrichten-Rettungsmodus ist der Nachrichtenkanal-Einstiegspunkt für Crestodian. Er ist für den
Fall gedacht, dass Ihr normaler Agent nicht funktioniert, aber ein vertrauenswürdiger Kanal wie WhatsApp
weiterhin Befehle empfängt.

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

Die Agentenerstellung kann auch aus der lokalen Eingabeaufforderung oder dem Rettungsmodus eingereiht werden:

```text
create agent work workspace ~/Projects/work model openai/gpt-5.5
/crestodian create agent work workspace ~/Projects/work
```

Der entfernte Rettungsmodus ist eine Admin-Oberfläche. Er muss wie entfernte Konfigurationsreparatur
behandelt werden, nicht wie normaler Chat.

Sicherheitsvertrag für entfernte Rettung:

- Deaktiviert, wenn Sandboxing aktiv ist. Wenn ein Agent/eine Sitzung sandboxed ist,
  muss Crestodian die entfernte Rettung ablehnen und erklären, dass lokale CLI-Reparatur
  erforderlich ist.
- Der standardmäßige effektive Zustand ist `auto`: entfernte Rettung nur im vertrauenswürdigen YOLO-
  Betrieb zulassen, bei dem die Laufzeit bereits über unsandboxed lokale Berechtigung verfügt.
- Eine explizite Owner-Identität ist erforderlich. Rettung darf keine Wildcard-Absenderregeln,
  offene Gruppenrichtlinien, nicht authentifizierte Webhooks oder anonymen Kanäle akzeptieren.
- Owner-DMs standardmäßig nur. Gruppen-/Kanalrettung erfordert explizites Opt-in.
- Plugin-Suche und -Liste sind schreibgeschützt. Plugin-Installation ist standardmäßig nur lokal,
  weil sie ausführbaren Code herunterlädt. Plugin-Deinstallation kann als genehmigter
  Reparaturvorgang zugelassen werden, wenn die Rettungsrichtlinie persistente Schreibvorgänge erlaubt.
- Entfernte Rettung kann die lokale TUI nicht öffnen oder in eine interaktive Agentensitzung wechseln.
  Verwenden Sie lokales `openclaw` für die Agentenübergabe.
- Persistente Schreibvorgänge erfordern weiterhin Zustimmung, auch im Rettungsmodus.
- Jeder angewendete Rettungsvorgang wird auditiert. Nachrichtenkanal-Rettung zeichnet Kanal-,
  Konto-, Absender- und Quelladressmetadaten auf. Konfigurationsverändernde Vorgänge zeichnen außerdem
  Konfigurations-Hashes vor und nach der Änderung auf.
- Secrets niemals ausgeben. SecretRef-Prüfung sollte Verfügbarkeit melden, nicht
  Werte.
- Wenn das Gateway läuft, bevorzugen Sie typisierte Gateway-Vorgänge. Wenn das Gateway nicht läuft,
  verwenden Sie nur die minimale lokale Reparaturoberfläche, die nicht von der
  normalen Agentenschleife abhängt.

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
  Sandboxing ausgeschaltet ist.
- `false`: Nachrichtenkanal-Rettung niemals zulassen.
- `true`: Rettung explizit zulassen, wenn die Owner-/Kanalprüfungen bestehen. Dies
  darf die Sandboxing-Ablehnung weiterhin nicht umgehen.

Die standardmäßige `"auto"`-YOLO-Haltung ist:

- Sandbox-Modus wird zu `off` aufgelöst
- `tools.exec.security` wird zu `full` aufgelöst
- `tools.exec.ask` wird zu `off` aufgelöst

Entfernte Rettung wird von der Docker-Lane abgedeckt:

```bash
pnpm test:docker:crestodian-rescue
```

Konfigurationsloser lokaler Planer-Fallback wird abgedeckt durch:

```bash
pnpm test:docker:crestodian-planner
```

Ein optionaler Live-Smoke für die Befehlsoberfläche des Kanals prüft `/crestodian status` plus einen
persistenten Zustimmungs-Roundtrip über den Rettungs-Handler:

```bash
pnpm test:live:crestodian-rescue-channel
```

Frische konfigurationslose Einrichtung über Crestodian wird abgedeckt durch:

```bash
pnpm test:docker:crestodian-first-run
```

Diese Lane beginnt mit einem leeren Zustandsverzeichnis, leitet ein bloßes `openclaw` an Crestodian weiter,
setzt das Standardmodell, erstellt einen zusätzlichen Agenten, konfiguriert Discord über
eine Plugin-Aktivierung plus Token-SecretRef, validiert die Konfiguration und prüft das Audit-
Log. QA Lab hat außerdem ein repo-gestütztes Szenario für denselben Ring-0-Ablauf:

```bash
pnpm openclaw qa suite --scenario crestodian-ring-zero-setup
```

## Verwandte Themen

- [CLI-Referenz](/de/cli)
- [Doctor](/de/cli/doctor)
- [TUI](/de/cli/tui)
- [Sandbox](/de/cli/sandbox)
- [Sicherheit](/de/cli/security)
