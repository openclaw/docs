---
read_when:
    - Erweitern von qa-lab oder qa-channel
    - Hinzufügen von repo-gestützten QA-Szenarien
    - Erstellen realitätsnäherer QA-Automatisierung rund um das Gateway-Dashboard
summary: Private QA-Automatisierungsstruktur für qa-lab, qa-channel, vorab definierte Szenarien und Protokollberichte
title: QA-E2E-Automatisierung
x-i18n:
    generated_at: "2026-04-16T21:51:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7deefda1c90a0d2e21e2155ffd8b585fb999e7416bdbaf0ff57eb33ccc063afc
    source_path: concepts/qa-e2e-automation.md
    workflow: 15
---

# QA-E2E-Automatisierung

Der private QA-Stack ist dazu gedacht, OpenClaw auf eine realistischere,
kanalartige Weise zu testen, als es ein einzelner Unit-Test kann.

Aktuelle Bestandteile:

- `extensions/qa-channel`: synthetischer Nachrichtenkanal mit Oberflächen für DM, Kanal, Thread,
  Reaktion, Bearbeiten und Löschen.
- `extensions/qa-lab`: Debugger-UI und QA-Bus zum Beobachten des Transkripts,
  Einspielen eingehender Nachrichten und Exportieren eines Markdown-Berichts.
- `qa/`: repo-gestützte Seed-Assets für die Startaufgabe und grundlegende QA-
  Szenarien.

Der aktuelle QA-Operator-Ablauf ist eine QA-Site mit zwei Bereichen:

- Links: Gateway-Dashboard (Control UI) mit dem Agenten.
- Rechts: QA Lab, das das Slack-ähnliche Transkript und den Szenarioplan anzeigt.

Starte es mit:

```bash
pnpm qa:lab:up
```

Dadurch wird die QA-Site gebaut, die Docker-gestützte Gateway-Umgebung gestartet und die
QA-Lab-Seite bereitgestellt, auf der ein Operator oder eine Automatisierungsschleife dem Agenten eine QA-
Mission geben, echtes Kanalverhalten beobachten und festhalten kann, was funktioniert hat, fehlgeschlagen ist oder
blockiert blieb.

Für schnellere UI-Iteration im QA Lab, ohne das Docker-Image jedes Mal neu zu bauen,
starte den Stack mit einem bind-gemounteten QA-Lab-Bundle:

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` hält die Docker-Dienste auf einem vorgebauten Image und bind-mountet
`extensions/qa-lab/web/dist` in den `qa-lab`-Container. `qa:lab:watch`
baut dieses Bundle bei Änderungen neu, und der Browser lädt automatisch neu, wenn sich der Hash
der QA-Lab-Assets ändert.

Für eine transportechte Matrix-Smoke-Umgebung führe aus:

```bash
pnpm openclaw qa matrix
```

Diese Umgebung stellt in Docker einen temporären Tuwunel-Homeserver bereit, registriert
temporäre Driver-, SUT- und Observer-Benutzer, erstellt einen privaten Raum und führt dann
das echte Matrix-Plugin innerhalb eines QA-Gateway-Child-Prozesses aus. Die Live-Transport-Umgebung hält
die Child-Konfiguration auf den getesteten Transport beschränkt, sodass Matrix ohne
`qa-channel` in der Child-Konfiguration läuft. Sie schreibt die strukturierten Berichtsartefakte sowie
ein kombiniertes stdout/stderr-Log in das ausgewählte Matrix-QA-Ausgabeverzeichnis. Um
auch die äußere `scripts/run-node.mjs`-Build-/Launcher-Ausgabe zu erfassen, setze
`OPENCLAW_RUN_NODE_OUTPUT_LOG=<path>` auf eine repo-lokale Logdatei.

Für eine transportechte Telegram-Smoke-Umgebung führe aus:

```bash
pnpm openclaw qa telegram
```

Diese Umgebung nutzt eine echte private Telegram-Gruppe statt einen temporären Server
bereitzustellen. Sie erfordert `OPENCLAW_QA_TELEGRAM_GROUP_ID`,
`OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` und
`OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN` sowie zwei unterschiedliche Bots in derselben
privaten Gruppe. Der SUT-Bot muss einen Telegram-Benutzernamen haben, und Bot-zu-Bot-
Beobachtung funktioniert am besten, wenn bei beiden Bots der Bot-to-Bot Communication Mode
in `@BotFather` aktiviert ist.

Live-Transport-Umgebungen teilen jetzt einen kleineren gemeinsamen Vertrag, statt jeweils
ihre eigene Szenariolistenform zu erfinden:

`qa-channel` bleibt die breite synthetische Suite für Produktverhalten und ist nicht Teil
der Live-Transport-Abdeckungsmatrix.

| Lane     | Canary | Mention-Gating | Allowlist-Blockierung | Antwort auf oberster Ebene | Fortsetzen nach Neustart | Thread-Nachverfolgung | Thread-Isolation | Reaktionsbeobachtung | Hilfsbefehl |
| -------- | ------ | -------------- | --------------------- | -------------------------- | ------------------------ | --------------------- | ---------------- | -------------------- | ----------- |
| Matrix   | x      | x              | x                     | x                          | x                        | x                     | x                | x                    |             |
| Telegram | x      |                |                       |                            |                          |                       |                  |                      | x           |

Dadurch bleibt `qa-channel` die breite Suite für Produktverhalten, während Matrix,
Telegram und künftige Live-Transporte eine explizite Checkliste für Transportverträge gemeinsam nutzen.

Für eine temporäre Linux-VM-Umgebung, ohne Docker in den QA-Pfad einzubinden, führe aus:

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

Dadurch wird ein frischer Multipass-Gast gestartet, Abhängigkeiten installiert, OpenClaw
innerhalb des Gasts gebaut, `qa suite` ausgeführt und dann der normale QA-Bericht samt
Zusammenfassung zurück nach `.artifacts/qa-e2e/...` auf dem Host kopiert.
Dabei wird dasselbe Verhalten zur Szenarioauswahl wie bei `qa suite` auf dem Host verwendet.
Suite-Ausführungen auf Host und in Multipass führen standardmäßig mehrere ausgewählte Szenarien parallel
mit isolierten Gateway-Workern aus, bis zu 64 Worker oder bis zur Anzahl der ausgewählten
Szenarien. Verwende `--concurrency <count>`, um die Anzahl der Worker anzupassen, oder
`--concurrency 1` für serielle Ausführung.
Live-Ausführungen leiten die unterstützten QA-Authentifizierungseingaben weiter, die für den
Gast praktikabel sind: provider-basierte Schlüssel aus Umgebungsvariablen, den QA-Live-Provider-Konfigurationspfad und
`CODEX_HOME`, falls vorhanden. Halte `--output-dir` unterhalb des Repo-Stammverzeichnisses, damit der Gast
über den gemounteten Workspace zurückschreiben kann.

## Repo-gestützte Seeds

Seed-Assets liegen in `qa/`:

- `qa/scenarios/index.md`
- `qa/scenarios/*.md`

Diese sind bewusst in git enthalten, damit der QA-Plan sowohl für Menschen als auch für den
Agenten sichtbar ist.

`qa-lab` sollte ein generischer Markdown-Runner bleiben. Jede Markdown-Datei für ein Szenario ist
die Quelle der Wahrheit für einen einzelnen Testlauf und sollte Folgendes definieren:

- Szenariometadaten
- Dokumentations- und Code-Referenzen
- optionale Plugin-Anforderungen
- optionalen Gateway-Konfigurations-Patch
- den ausführbaren `qa-flow`

Die wiederverwendbare Runtime-Oberfläche hinter `qa-flow` darf generisch
und bereichsübergreifend bleiben. Zum Beispiel können Markdown-Szenarien transportseitige Hilfsfunktionen
mit browserseitigen Hilfsfunktionen kombinieren, die die eingebettete Control UI über die
Gateway-Nahtstelle `browser.request` steuern, ohne einen Spezialfall-Runner hinzuzufügen.

Die grundlegende Liste sollte breit genug bleiben, um Folgendes abzudecken:

- DM- und Kanal-Chat
- Thread-Verhalten
- Lebenszyklus von Nachrichtenaktionen
- Cron-Rückrufe
- Memory-Abruf
- Modellwechsel
- Subagent-Übergabe
- Lesen von Repos und Dokumentation
- eine kleine Build-Aufgabe wie Lobster Invaders

## Transportadapter

`qa-lab` besitzt eine generische Transport-Nahtstelle für Markdown-QA-Szenarien.
`qa-channel` ist der erste Adapter auf dieser Nahtstelle, aber das Architekturziel ist breiter:
künftige echte oder synthetische Kanäle sollten sich in denselben Suite-Runner einklinken,
anstatt einen transportspezifischen QA-Runner hinzuzufügen.

Auf Architekturebene ist die Aufteilung:

- `qa-lab` besitzt die generische Szenarioausführung, Worker-Parallelität, Artefaktschreibung und Berichterstellung.
- der Transportadapter besitzt Gateway-Konfiguration, Bereitschaft, Beobachtung eingehender und ausgehender Daten, Transportaktionen und normalisierten Transportzustand.
- Markdown-Szenariodateien unter `qa/scenarios/` definieren den Testlauf; `qa-lab` stellt die wiederverwendbare Runtime-Oberfläche bereit, die ihn ausführt.

Maintainer-orientierte Einführungsanleitungen für neue Kanaladapter finden sich in
[Testing](/de/help/testing#adding-a-channel-to-qa).

## Berichterstellung

`qa-lab` exportiert einen Markdown-Protokollbericht aus der beobachteten Bus-Zeitleiste.
Der Bericht sollte beantworten:

- Was funktioniert hat
- Was fehlgeschlagen ist
- Was blockiert geblieben ist
- Welche Folge-Szenarien sich hinzuzufügen lohnen

Für Zeichen- und Stilprüfungen führe dasselbe Szenario mit mehreren Live-Modell-
Referenzen aus und schreibe einen bewerteten Markdown-Bericht:

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

Der Befehl führt lokale QA-Gateway-Child-Prozesse aus, nicht Docker. Character-Eval-
Szenarien sollten die Persona über `SOUL.md` setzen und dann normale Benutzerinteraktionen
wie Chat, Workspace-Hilfe und kleine Datei-Aufgaben ausführen. Dem Kandidatenmodell
sollte nicht mitgeteilt werden, dass es evaluiert wird. Der Befehl bewahrt jedes vollständige
Transkript, zeichnet grundlegende Laufstatistiken auf und bittet dann die Bewertungsmodelle im schnellen Modus mit
`xhigh`-Reasoning, die Läufe nach Natürlichkeit, Vibe und Humor zu bewerten.
Verwende `--blind-judge-models`, wenn du Provider vergleichst: Der Bewertungs-Prompt erhält weiterhin
jedes Transkript und jeden Laufstatus, aber Kandidatenreferenzen werden durch neutrale
Bezeichnungen wie `candidate-01` ersetzt; der Bericht ordnet die Ranglisten nach dem
Parsen wieder den echten Referenzen zu.
Kandidatenläufe verwenden standardmäßig `high` Thinking, mit `xhigh` für OpenAI-Modelle, die
dies unterstützen. Überschreibe einen bestimmten Kandidaten inline mit
`--model provider/model,thinking=<level>`. `--thinking <level>` setzt weiterhin einen
globalen Fallback, und die ältere Form `--model-thinking <provider/model=level>` bleibt aus
Kompatibilitätsgründen erhalten.
OpenAI-Kandidatenreferenzen verwenden standardmäßig den schnellen Modus, damit Prioritätsverarbeitung genutzt wird, wo
der Provider dies unterstützt. Füge inline `,fast`, `,no-fast` oder `,fast=false` hinzu, wenn ein
einzelner Kandidat oder Judge eine Überschreibung benötigt. Übergib `--fast` nur, wenn du den
schnellen Modus für jedes Kandidatenmodell erzwingen möchtest. Die Dauer von Kandidaten- und Judge-Läufen
wird im Bericht für Benchmark-Analysen erfasst, aber in den Judge-Prompts wird ausdrücklich darauf hingewiesen,
nicht nach Geschwindigkeit zu bewerten.
Kandidaten- und Judge-Modelläufe verwenden beide standardmäßig eine Parallelität von 16. Verringere
`--concurrency` oder `--judge-concurrency`, wenn Provider-Limits oder lokaler Gateway-
Druck einen Lauf zu unruhig machen.
Wenn kein Kandidat mit `--model` übergeben wird, verwendet die Character-Eval standardmäßig
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
