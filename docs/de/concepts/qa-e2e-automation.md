---
read_when:
    - Erweitern von qa-lab oder qa-channel
    - Hinzufügen von repo-gestützten QA-Szenarien
    - Aufbau einer realistischeren QA-Automatisierung rund um das Gateway-Dashboard
summary: Private QA-Automatisierungsstruktur für qa-lab, qa-channel, vordefinierte Szenarien und Protokollberichte
title: QA-E2E-Automatisierung
x-i18n:
    generated_at: "2026-04-11T02:44:17Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5427b505e26bfd542e984e3920c3f7cb825473959195ba9737eff5da944c60d0
    source_path: concepts/qa-e2e-automation.md
    workflow: 15
---

# QA-E2E-Automatisierung

Der private QA-Stack soll OpenClaw auf eine realistischere, kanalnahe Weise testen, als es ein einzelner Unit-Test kann.

Aktuelle Bestandteile:

- `extensions/qa-channel`: synthetischer Nachrichtenkanal mit Oberflächen für DM, Kanal, Thread, Reaktion, Bearbeiten und Löschen.
- `extensions/qa-lab`: Debugger-UI und QA-Bus zum Beobachten des Transkripts, Einspielen eingehender Nachrichten und Exportieren eines Markdown-Berichts.
- `qa/`: repo-gestützte Seed-Assets für die Startaufgabe und grundlegende QA-Szenarien.

Der aktuelle QA-Operator-Ablauf ist eine QA-Website mit zwei Bereichen:

- Links: Gateway-Dashboard (Control UI) mit dem Agenten.
- Rechts: QA Lab mit dem Slack-ähnlichen Transkript und dem Szenarioplan.

Starten Sie es mit:

```bash
pnpm qa:lab:up
```

Dadurch wird die QA-Website gebaut, die Docker-gestützte Gateway-Umgebung gestartet und die QA-Lab-Seite bereitgestellt, auf der ein Operator oder eine Automatisierungsschleife dem Agenten eine QA-Mission geben, echtes Kanalverhalten beobachten und festhalten kann, was funktioniert hat, fehlgeschlagen ist oder blockiert blieb.

Für schnellere Iteration an der QA-Lab-UI, ohne das Docker-Image jedes Mal neu zu bauen, starten Sie den Stack mit einem per Bind-Mount eingebundenen QA-Lab-Bundle:

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` hält die Docker-Services auf einem vorab gebauten Image und bind-mountet `extensions/qa-lab/web/dist` in den `qa-lab`-Container. `qa:lab:watch` baut dieses Bundle bei Änderungen neu, und der Browser lädt automatisch neu, wenn sich der QA-Lab-Asset-Hash ändert.

Für eine transportreale Matrix-Smoke-Umgebung führen Sie aus:

```bash
pnpm openclaw qa matrix
```

Diese Umgebung stellt in Docker einen flüchtigen Tuwunel-Homeserver bereit, registriert temporäre Benutzer für Driver, SUT und Observer, erstellt einen privaten Raum und führt dann das echte Matrix-Plugin in einem untergeordneten QA-Gateway-Prozess aus. Die Live-Transport-Umgebung hält die Child-Konfiguration auf den getesteten Transport beschränkt, sodass Matrix in der Child-Konfiguration ohne `qa-channel` ausgeführt wird.

Für eine transportreale Telegram-Smoke-Umgebung führen Sie aus:

```bash
pnpm openclaw qa telegram
```

Diese Umgebung zielt auf eine reale private Telegram-Gruppe, statt einen flüchtigen Server bereitzustellen. Sie erfordert `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` und `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN` sowie zwei unterschiedliche Bots in derselben privaten Gruppe. Der SUT-Bot muss einen Telegram-Benutzernamen haben, und die Bot-zu-Bot-Beobachtung funktioniert am besten, wenn für beide Bots der Modus für Bot-zu-Bot-Kommunikation in `@BotFather` aktiviert ist.

Live-Transport-Umgebungen verwenden jetzt einen kleineren gemeinsamen Vertrag, statt jeweils ihre eigene Form für Szenariolisten zu definieren:

`qa-channel` bleibt die umfassende synthetische Suite für Produktverhalten und ist nicht Teil der Live-Transport-Abdeckungsmatrix.

| Umgebung | Canary | Mention-Gating | Allowlist-Blockierung | Antwort auf oberster Ebene | Fortsetzen nach Neustart | Thread-Nachverfolgung | Thread-Isolation | Reaktionsbeobachtung | Help-Befehl |
| --------- | ------ | -------------- | --------------------- | -------------------------- | ------------------------ | --------------------- | ---------------- | -------------------- | ----------- |
| Matrix    | x      | x              | x                     | x                          | x                        | x                     | x                | x                    |             |
| Telegram  | x      |                |                       |                            |                          |                       |                  |                      | x           |

Dadurch bleibt `qa-channel` die umfassende Suite für Produktverhalten, während Matrix, Telegram und zukünftige Live-Transporte eine gemeinsame explizite Checkliste für Transportverträge nutzen.

Für eine flüchtige Linux-VM-Umgebung, ohne Docker in den QA-Pfad einzubinden, führen Sie aus:

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

Dadurch wird ein frischer Multipass-Gast gestartet, Abhängigkeiten installiert, OpenClaw im Gast gebaut, `qa suite` ausgeführt und anschließend der normale QA-Bericht samt Zusammenfassung zurück nach `.artifacts/qa-e2e/...` auf dem Host kopiert.
Dabei wird dasselbe Verhalten zur Szenarioauswahl wie bei `qa suite` auf dem Host verwendet.
Suite-Läufe auf Host und in Multipass führen standardmäßig mehrere ausgewählte Szenarien parallel mit isolierten Gateway-Workern aus, bis zu 64 Worker oder bis zur Anzahl der ausgewählten Szenarien. Verwenden Sie `--concurrency <count>`, um die Anzahl der Worker anzupassen, oder `--concurrency 1` für serielle Ausführung.
Live-Läufe leiten die unterstützten QA-Authentifizierungseingaben weiter, die für den Gast praktikabel sind: providerbasierte Schlüssel aus Umgebungsvariablen, den QA-Live-Provider-Konfigurationspfad und `CODEX_HOME`, falls vorhanden. Halten Sie `--output-dir` unter dem Repo-Root, damit der Gast über den eingebundenen Workspace zurückschreiben kann.

## Repo-gestützte Seeds

Seed-Assets liegen in `qa/`:

- `qa/scenarios/index.md`
- `qa/scenarios/*.md`

Diese liegen bewusst in Git, damit der QA-Plan sowohl für Menschen als auch für den Agenten sichtbar ist. Die grundlegende Liste sollte breit genug bleiben, um Folgendes abzudecken:

- DM- und Kanal-Chat
- Thread-Verhalten
- Lebenszyklus von Nachrichtenaktionen
- Cron-Callbacks
- Memory Recall
- Modellwechsel
- Übergabe an Subagenten
- Lesen des Repos und der Dokumentation
- eine kleine Build-Aufgabe wie Lobster Invaders

## Berichterstellung

`qa-lab` exportiert einen Markdown-Protokollbericht aus der beobachteten Bus-Zeitleiste.
Der Bericht sollte beantworten:

- Was funktioniert hat
- Was fehlgeschlagen ist
- Was blockiert blieb
- Welche Folge-Szenarien sich hinzuzufügen lohnen

Für Charakter- und Stilprüfungen führen Sie dasselbe Szenario über mehrere Live-Modell-Refs aus und schreiben einen bewerteten Markdown-Bericht:

```bash
pnpm openclaw qa character-eval \
  --model openai/gpt-5.4,thinking=xhigh \
  --model openai/gpt-5.2,thinking=xhigh \
  --model openai/gpt-5,thinking=xhigh \
  --model anthropic/claude-opus-4-6,thinking=high \
  --model anthropic/claude-sonnet-4-6,thinking=high \
  --model zai/glm-5.1,thinking=high \
  --model moonshot/kimi-k2.5,thinking=high \
  --model google/gemini-3.1-pro-preview,thinking=high \
  --judge-model openai/gpt-5.4,thinking=xhigh,fast \
  --judge-model anthropic/claude-opus-4-6,thinking=high \
  --blind-judge-models \
  --concurrency 16 \
  --judge-concurrency 16
```

Der Befehl führt lokale untergeordnete QA-Gateway-Prozesse aus, nicht Docker. Charakter-Eval-Szenarien sollten die Persona über `SOUL.md` setzen und dann normale Benutzerinteraktionen wie Chat, Workspace-Hilfe und kleine Datei-Aufgaben ausführen. Dem Kandidatenmodell sollte nicht mitgeteilt werden, dass es bewertet wird. Der Befehl bewahrt jedes vollständige Transkript, erfasst grundlegende Laufstatistiken und bittet dann die Bewertungsmodelle im Fast-Modus mit `xhigh`-Reasoning, die Läufe nach Natürlichkeit, Vibe und Humor zu bewerten.
Verwenden Sie `--blind-judge-models`, wenn Sie Provider vergleichen: Der Bewertungs-Prompt erhält weiterhin jedes Transkript und jeden Laufstatus, aber Kandidaten-Refs werden durch neutrale Bezeichnungen wie `candidate-01` ersetzt; der Bericht ordnet die Ranglisten nach dem Parsen wieder den echten Refs zu.
Kandidatenläufe verwenden standardmäßig `high` Thinking, mit `xhigh` für OpenAI-Modelle, die dies unterstützen. Überschreiben Sie einen bestimmten Kandidaten inline mit `--model provider/model,thinking=<level>`. `--thinking <level>` setzt weiterhin einen globalen Fallback, und die ältere Form `--model-thinking <provider/model=level>` bleibt aus Kompatibilitätsgründen erhalten.
OpenAI-Kandidaten-Refs verwenden standardmäßig den Fast-Modus, damit Prioritätsverarbeitung genutzt wird, wo der Provider dies unterstützt. Fügen Sie inline `,fast`, `,no-fast` oder `,fast=false` hinzu, wenn ein einzelner Kandidat oder Bewerter eine Überschreibung benötigt. Übergeben Sie `--fast` nur, wenn Sie den Fast-Modus für jedes Kandidatenmodell erzwingen möchten. Kandidaten- und Bewerterlaufzeiten werden im Bericht für Benchmark-Analysen erfasst, aber die Bewertungs-Prompts sagen ausdrücklich, dass nicht nach Geschwindigkeit gerankt werden soll.
Sowohl Kandidaten- als auch Bewertermodellläufe verwenden standardmäßig Parallelität 16. Reduzieren Sie `--concurrency` oder `--judge-concurrency`, wenn Provider-Limits oder Belastung des lokalen Gateways einen Lauf zu störanfällig machen.
Wenn kein Kandidat mit `--model` übergeben wird, verwendet die Character-Eval standardmäßig `openai/gpt-5.4`, `openai/gpt-5.2`, `openai/gpt-5`, `anthropic/claude-opus-4-6`, `anthropic/claude-sonnet-4-6`, `zai/glm-5.1`, `moonshot/kimi-k2.5` und `google/gemini-3.1-pro-preview`, wenn kein `--model` übergeben wird.
Wenn kein `--judge-model` übergeben wird, verwenden die Bewerter standardmäßig `openai/gpt-5.4,thinking=xhigh,fast` und `anthropic/claude-opus-4-6,thinking=high`.

## Verwandte Dokumentation

- [Testing](/de/help/testing)
- [QA Channel](/de/channels/qa-channel)
- [Dashboard](/web/dashboard)
