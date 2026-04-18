---
read_when:
    - Erweitern von qa-lab oder qa-channel
    - Hinzufügen von repo-gestützten QA-Szenarien
    - Erstellen von QA-Automatisierung mit höherem Realismus rund um das Gateway-Dashboard
summary: Private QA-Automatisierungsstruktur für qa-lab, qa-channel, vordefinierte Szenarien und Protokollberichte
title: QA-E2E-Automatisierung
x-i18n:
    generated_at: "2026-04-18T06:13:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: adf8c5f74e8fabdc8e9fd7ecd41afce8b60354c7dd24d92ac926d3c527927cd4
    source_path: concepts/qa-e2e-automation.md
    workflow: 15
---

# QA-E2E-Automatisierung

Der private QA-Stack soll OpenClaw auf eine realistischere,
kanalähnliche Weise ausüben, als es ein einzelner Unit-Test kann.

Aktuelle Bestandteile:

- `extensions/qa-channel`: synthetischer Nachrichtenkanal mit Oberflächen für DM, Kanal, Thread,
  Reaktion, Bearbeitung und Löschen.
- `extensions/qa-lab`: Debugger-UI und QA-Bus zum Beobachten des Transkripts,
  Einspeisen eingehender Nachrichten und Exportieren eines Markdown-Berichts.
- `qa/`: repo-gestützte Seed-Assets für die Kickoff-Aufgabe und grundlegende QA-
  Szenarien.

Der aktuelle QA-Operator-Ablauf ist eine zweigeteilte QA-Site:

- Links: Gateway-Dashboard (Control UI) mit dem Agenten.
- Rechts: QA Lab, das das Slack-ähnliche Transkript und den Szenarioplan anzeigt.

Ausführen mit:

```bash
pnpm qa:lab:up
```

Dadurch wird die QA-Site gebaut, die Docker-gestützte Gateway-Lane gestartet und die
QA-Lab-Seite bereitgestellt, auf der ein Operator oder eine Automatisierungsschleife dem Agenten eine QA-
Mission geben, reales Kanalverhalten beobachten und festhalten kann, was funktioniert hat, fehlgeschlagen ist oder blockiert blieb.

Für schnellere Iterationen an der QA-Lab-UI, ohne das Docker-Image jedes Mal neu zu bauen,
starten Sie den Stack mit einem per Bind-Mount eingebundenen QA-Lab-Bundle:

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` hält die Docker-Dienste auf einem vorgebauten Image und bind-mountet
`extensions/qa-lab/web/dist` in den `qa-lab`-Container. `qa:lab:watch`
baut dieses Bundle bei Änderungen neu, und der Browser lädt automatisch neu, wenn sich der QA-Lab-
Asset-Hash ändert.

Für eine Matrix-Smoke-Lane mit realem Transport führen Sie Folgendes aus:

```bash
pnpm openclaw qa matrix
```

Diese Lane stellt in Docker einen temporären Tuwunel-Homeserver bereit, registriert
temporäre Driver-, SUT- und Observer-Benutzer, erstellt einen privaten Raum und führt dann
das echte Matrix-Plugin in einem untergeordneten QA-Gateway aus. Die Lane mit Live-Transport hält
die Child-Config auf den getesteten Transport beschränkt, sodass Matrix ohne
`qa-channel` in der Child-Config läuft. Sie schreibt die strukturierten Bericht-Artefakte und
ein kombiniertes stdout/stderr-Log in das ausgewählte Matrix-QA-Ausgabeverzeichnis. Um
auch die äußere Ausgabe von `scripts/run-node.mjs` für Build/Launcher zu erfassen, setzen Sie
`OPENCLAW_RUN_NODE_OUTPUT_LOG=<path>` auf eine repo-lokale Logdatei.

Für eine Telegram-Smoke-Lane mit realem Transport führen Sie Folgendes aus:

```bash
pnpm openclaw qa telegram
```

Diese Lane zielt auf eine einzelne echte private Telegram-Gruppe, anstatt einen
temporären Server bereitzustellen. Sie erfordert `OPENCLAW_QA_TELEGRAM_GROUP_ID`,
`OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` und
`OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN` sowie zwei unterschiedliche Bots in derselben
privaten Gruppe. Der SUT-Bot muss einen Telegram-Benutzernamen haben, und die Beobachtung von Bot zu Bot
funktioniert am besten, wenn bei beiden Bots der Bot-to-Bot Communication Mode
in `@BotFather` aktiviert ist.

Live-Transport-Lanes teilen jetzt einen kleineren gemeinsamen Vertrag, anstatt jeweils
ihre eigene Form für Szenariolisten zu erfinden:

`qa-channel` bleibt die breite synthetische Suite für Produktverhalten und ist nicht Teil
der Live-Transport-Abdeckungsmatrix.

| Lane     | Canary | Mention-Gating | Allowlist-Block | Antwort auf oberster Ebene | Fortsetzen nach Neustart | Thread-Nachverfolgung | Thread-Isolation | Beobachtung von Reaktionen | Help-Befehl |
| -------- | ------ | -------------- | --------------- | -------------------------- | ------------------------ | --------------------- | ---------------- | -------------------------- | ------------ |
| Matrix   | x      | x              | x               | x                          | x                        | x                     | x                | x                          |              |
| Telegram | x      |                |                 |                            |                          |                       |                  |                            | x            |

Dadurch bleibt `qa-channel` die breite Suite für Produktverhalten, während Matrix,
Telegram und zukünftige Live-Transporte eine explizite Checkliste für Transportverträge gemeinsam nutzen.

Für eine temporäre Linux-VM-Lane, ohne Docker in den QA-Pfad einzubringen, führen Sie Folgendes aus:

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

Dadurch wird ein frischer Multipass-Gast gestartet, Abhängigkeiten werden installiert, OpenClaw
innerhalb des Gasts gebaut, `qa suite` ausgeführt und anschließend der normale QA-Bericht sowie die
Zusammenfassung zurück nach `.artifacts/qa-e2e/...` auf dem Host kopiert.
Dabei wird dasselbe Verhalten zur Szenarioauswahl verwendet wie bei `qa suite` auf dem Host.
Host- und Multipass-Suite-Ausführungen führen standardmäßig mehrere ausgewählte Szenarien parallel
mit isolierten Gateway-Workern aus, bis zu 64 Worker oder die Anzahl der ausgewählten
Szenarien. Verwenden Sie `--concurrency <count>`, um die Anzahl der Worker anzupassen, oder
`--concurrency 1` für serielle Ausführung.
Live-Ausführungen leiten die unterstützten QA-Authentifizierungseingaben weiter, die für den
Gast praktikabel sind: umgebungsvariablenbasierte Provider-Schlüssel, den QA-Live-Provider-Config-Pfad und
`CODEX_HOME`, falls vorhanden. Halten Sie `--output-dir` unter dem Repo-Root, damit der Gast
über den gemounteten Workspace zurückschreiben kann.

## Repo-gestützte Seeds

Seed-Assets liegen in `qa/`:

- `qa/scenarios/index.md`
- `qa/scenarios/<theme>/*.md`

Diese liegen absichtlich in Git, damit der QA-Plan sowohl für Menschen als auch für den
Agenten sichtbar ist.

`qa-lab` sollte ein generischer Markdown-Runner bleiben. Jede Markdown-Datei für ein Szenario ist
die Quelle der Wahrheit für einen Testlauf und sollte Folgendes definieren:

- Szenario-Metadaten
- optionale Metadaten für Kategorie, Fähigkeit, Lane und Risiko
- Dokumentations- und Code-Referenzen
- optionale Plugin-Anforderungen
- optionaler Gateway-Config-Patch
- den ausführbaren `qa-flow`

Die wiederverwendbare Runtime-Oberfläche, die `qa-flow` unterstützt, darf generisch
und querschnittlich bleiben. Markdown-Szenarien können beispielsweise
transportseitige Hilfsfunktionen mit browserseitigen Hilfsfunktionen kombinieren, die die eingebettete Control UI über den
Gateway-`browser.request`-Seam steuern, ohne einen Spezialfall-Runner hinzuzufügen.

Szenariodateien sollten nach Produktfähigkeit statt nach Source-Tree-Ordner gruppiert werden.
Halten Sie Szenario-IDs stabil, wenn Dateien verschoben werden; verwenden Sie `docsRefs` und `codeRefs`
für die Rückverfolgbarkeit der Implementierung.

Die Basisliste sollte breit genug bleiben, um Folgendes abzudecken:

- DM- und Kanal-Chat
- Thread-Verhalten
- Lebenszyklus von Nachrichtenaktionen
- Cron-Callbacks
- Memory-Abruf
- Modellwechsel
- Übergabe an Subagenten
- Lesen des Repos und der Dokumentation
- eine kleine Build-Aufgabe wie Lobster Invaders

## Provider-Mock-Lanes

`qa suite` hat zwei lokale Provider-Mock-Lanes:

- `mock-openai` ist der szenariobewusste OpenClaw-Mock. Er bleibt die standardmäßige
  deterministische Mock-Lane für repo-gestützte QA und Paritäts-Gates.
- `aimock` startet einen AIMock-gestützten Provider-Server für experimentelle Protokoll-,
  Fixture-, Record/Replay- und Chaos-Abdeckung. Er ist additiv und ersetzt nicht den
  `mock-openai`-Szenario-Dispatcher.

Die Implementierung der Provider-Lanes befindet sich unter `extensions/qa-lab/src/providers/`.
Jeder Provider besitzt seine Standardwerte, den Start des lokalen Servers, die Gateway-Modellkonfiguration,
Anforderungen für das Staging von Auth-Profilen sowie Live-/Mock-Fähigkeits-Flags. Gemeinsam genutzter Suite- und
Gateway-Code sollte über die Provider-Registry geroutet werden, anstatt auf Providernamen zu verzweigen.

## Transportadapter

`qa-lab` besitzt einen generischen Transport-Seam für Markdown-QA-Szenarien.
`qa-channel` ist der erste Adapter auf diesem Seam, aber das Designziel ist breiter:
zukünftige reale oder synthetische Kanäle sollten sich in denselben Suite-Runner einfügen,
anstatt einen transportspezifischen QA-Runner hinzuzufügen.

Auf Architekturebene ist die Aufteilung wie folgt:

- `qa-lab` besitzt generische Szenarioausführung, Worker-Parallelität, Schreiben von Artefakten und Berichterstellung.
- der Transportadapter besitzt Gateway-Config, Bereitschaft, Beobachtung eingehender und ausgehender Nachrichten, Transportaktionen und normalisierten Transportzustand.
- Markdown-Szenariodateien unter `qa/scenarios/` definieren den Testlauf; `qa-lab` stellt die wiederverwendbare Runtime-Oberfläche bereit, die ihn ausführt.

Maintainer-orientierte Einführungsrichtlinien für neue Kanaladapter finden Sie in
[Testing](/de/help/testing#adding-a-channel-to-qa).

## Berichterstellung

`qa-lab` exportiert einen Markdown-Protokollbericht aus der beobachteten Bus-Zeitleiste.
Der Bericht sollte Folgendes beantworten:

- Was funktioniert hat
- Was fehlgeschlagen ist
- Was blockiert blieb
- Welche Folge-Szenarien sich hinzuzufügen lohnen

Für Prüfungen von Charakter und Stil führen Sie dasselbe Szenario über mehrere Live-Modell-
Refs aus und schreiben einen bewerteten Markdown-Bericht:

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

Der Befehl führt lokale untergeordnete QA-Gateway-Prozesse aus, nicht Docker. Character-Eval-
Szenarien sollten die Persona über `SOUL.md` setzen und dann gewöhnliche Benutzerturns
wie Chat, Workspace-Hilfe und kleine Dateiaufgaben ausführen. Dem Kandidatenmodell
sollte nicht mitgeteilt werden, dass es evaluiert wird. Der Befehl bewahrt jedes vollständige
Transkript, zeichnet grundlegende Laufstatistiken auf und bittet dann die Bewertungsmodelle im schnellen Modus mit
`xhigh`-Reasoning, die Läufe nach Natürlichkeit, Vibe und Humor zu ordnen.
Verwenden Sie `--blind-judge-models`, wenn Sie Provider vergleichen: Der Bewertungs-Prompt erhält weiterhin
jedes Transkript und jeden Laufstatus, aber Kandidaten-Refs werden durch neutrale
Bezeichnungen wie `candidate-01` ersetzt; der Bericht ordnet die Rankings nach dem
Parsen wieder den echten Refs zu.
Kandidatenläufe verwenden standardmäßig `high` Thinking, mit `xhigh` für OpenAI-Modelle, die dies
unterstützen. Überschreiben Sie einen bestimmten Kandidaten inline mit
`--model provider/model,thinking=<level>`. `--thinking <level>` setzt weiterhin einen
globalen Fallback, und die ältere Form `--model-thinking <provider/model=level>` bleibt
aus Kompatibilitätsgründen erhalten.
OpenAI-Kandidaten-Refs verwenden standardmäßig den schnellen Modus, sodass Prioritätsverarbeitung dort genutzt wird,
wo der Provider dies unterstützt. Fügen Sie `,fast`, `,no-fast` oder `,fast=false` inline hinzu, wenn ein
einzelner Kandidat oder Judge eine Überschreibung benötigt. Übergeben Sie `--fast` nur, wenn Sie
den schnellen Modus für jedes Kandidatenmodell erzwingen möchten. Dauer von Kandidaten- und
Judge-Läufen wird zur Benchmark-Analyse im Bericht aufgezeichnet, aber die Judge-Prompts sagen ausdrücklich,
nicht nach Geschwindigkeit zu bewerten.
Kandidaten- und Judge-Modelläufe verwenden standardmäßig beide Parallelität 16. Verringern Sie
`--concurrency` oder `--judge-concurrency`, wenn Provider-Limits oder lokaler Gateway-
Druck einen Lauf zu störanfällig machen.
Wenn kein Kandidaten-`--model` übergeben wird, verwendet die Character-Eval standardmäßig
`openai/gpt-5.4`, `openai/gpt-5.2`, `openai/gpt-5`, `anthropic/claude-opus-4-6`,
`anthropic/claude-sonnet-4-6`, `zai/glm-5.1`,
`moonshot/kimi-k2.5` und
`google/gemini-3.1-pro-preview`, wenn kein `--model` übergeben wird.
Wenn kein `--judge-model` übergeben wird, verwenden die Judges standardmäßig
`openai/gpt-5.4,thinking=xhigh,fast` und
`anthropic/claude-opus-4-6,thinking=high`.

## Verwandte Dokumentation

- [Testing](/de/help/testing)
- [QA Channel](/de/channels/qa-channel)
- [Dashboard](/web/dashboard)
