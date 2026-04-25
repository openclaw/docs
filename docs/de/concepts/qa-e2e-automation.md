---
read_when:
    - Erweitern von qa-lab oder qa-channel
    - Hinzufügen von repo-gestützten QA-Szenarien
    - Aufbau realistischerer QA-Automatisierung rund um das Gateway-Dashboard
summary: Form der privaten QA-Automatisierung für qa-lab, qa-channel, Seeded-Szenarien und Protokollberichte
title: QA-E2E-Automatisierung
x-i18n:
    generated_at: "2026-04-25T18:18:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: be2cfc97a33519e0c4263dc7da356136b10ddcbeef436ab821e645688b6b2cfc
    source_path: concepts/qa-e2e-automation.md
    workflow: 15
---

Der private QA-Stack soll OpenClaw auf eine realistischere,
Channel-artige Weise prüfen, als es ein einzelner Unit-Test kann.

Aktuelle Bestandteile:

- `extensions/qa-channel`: synthetischer Nachrichten-Channel mit Oberflächen für DM, Channel, Thread,
  Reaktion, Bearbeitung und Löschung.
- `extensions/qa-lab`: Debugger-UI und QA-Bus zum Beobachten des Transkripts,
  Einspeisen eingehender Nachrichten und Exportieren eines Markdown-Berichts.
- `qa/`: repo-gestützte Seed-Assets für die Startaufgabe und grundlegende QA-
  Szenarien.

Der aktuelle QA-Operator-Ablauf ist eine QA-Site mit zwei Bereichen:

- Links: Gateway-Dashboard (Control UI) mit dem Agenten.
- Rechts: QA Lab mit dem Slack-ähnlichen Transkript und dem Szenarioplan.

Führen Sie es aus mit:

```bash
pnpm qa:lab:up
```

Dadurch wird die QA-Site gebaut, die Docker-gestützte Gateway-Lane gestartet und die
QA-Lab-Seite bereitgestellt, auf der ein Operator oder eine Automatisierungsschleife dem Agenten eine QA-
Mission geben, echtes Channel-Verhalten beobachten und aufzeichnen kann, was funktioniert hat, fehlgeschlagen ist oder blockiert blieb.

Für schnellere Iteration an der QA-Lab-UI, ohne das Docker-Image jedes Mal neu zu bauen,
starten Sie den Stack mit einem per Bind-Mount eingebundenen QA-Lab-Bundle:

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` hält die Docker-Dienste auf einem vorab gebauten Image und bind-mountet
`extensions/qa-lab/web/dist` in den `qa-lab`-Container. `qa:lab:watch`
baut dieses Bundle bei Änderungen neu, und der Browser lädt automatisch neu, wenn sich der QA-Lab-
Asset-Hash ändert.

Für eine transportechte Matrix-Smoke-Lane führen Sie aus:

```bash
pnpm openclaw qa matrix
```

Diese Lane stellt in Docker einen wegwerfbaren Tuwunel-Homeserver bereit, registriert
temporäre Driver-, SUT- und Observer-Benutzer, erstellt einen privaten Raum und führt dann
das echte Matrix-Plugin innerhalb eines untergeordneten QA-Gateway-Prozesses aus. Die Live-Transport-Lane hält
die Child-Konfiguration auf den jeweils getesteten Transport begrenzt, sodass Matrix ohne
`qa-channel` in der Child-Konfiguration läuft. Sie schreibt die strukturierten Berichtsartefakte und
ein kombiniertes stdout/stderr-Log in das ausgewählte Matrix-QA-Ausgabeverzeichnis. Um
zusätzlich die äußere Build-/Launcher-Ausgabe von `scripts/run-node.mjs` zu erfassen, setzen Sie
`OPENCLAW_RUN_NODE_OUTPUT_LOG=<path>` auf eine repo-lokale Logdatei.
Der Matrix-Fortschritt wird standardmäßig ausgegeben. `OPENCLAW_QA_MATRIX_TIMEOUT_MS` begrenzt den gesamten Lauf,
und `OPENCLAW_QA_MATRIX_CLEANUP_TIMEOUT_MS` begrenzt das Cleanup, sodass ein festhängender Docker-Abbau den genauen
Wiederherstellungsbefehl meldet, statt hängen zu bleiben.

Für eine transportechte Telegram-Smoke-Lane führen Sie aus:

```bash
pnpm openclaw qa telegram
```

Diese Lane verwendet eine echte private Telegram-Gruppe, statt einen wegwerfbaren Server bereitzustellen. Sie
erfordert `OPENCLAW_QA_TELEGRAM_GROUP_ID`,
`OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` und
`OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN` sowie zwei unterschiedliche Bots in derselben
privaten Gruppe. Der SUT-Bot muss einen Telegram-Benutzernamen haben, und die Beobachtung zwischen Bots
funktioniert am besten, wenn bei beiden Bots der Modus „Bot-to-Bot Communication Mode“
in `@BotFather` aktiviert ist.
Der Befehl endet mit einem Wert ungleich null, wenn ein Szenario fehlschlägt. Verwenden Sie `--allow-failures`, wenn
Sie Artefakte ohne fehlschlagenden Exit-Code möchten.
Der Telegram-Bericht und die Zusammenfassung enthalten die RTT pro Antwort von der
Sendeanforderung der Driver-Nachricht bis zur beobachteten SUT-Antwort, beginnend mit dem Canary.

Bevor Sie gepoolte Live-Zugangsdaten verwenden, führen Sie aus:

```bash
pnpm openclaw qa credentials doctor
```

Der Doctor prüft die Convex-Broker-Umgebungsvariablen, validiert Endpunkteinstellungen und verifiziert
Administrator-/Listen-Erreichbarkeit, wenn das Maintainer-Geheimnis vorhanden ist. Er meldet für Geheimnisse
nur den Status gesetzt/fehlend.

Für eine transportechte Discord-Smoke-Lane führen Sie aus:

```bash
pnpm openclaw qa discord
```

Diese Lane verwendet einen echten privaten Discord-Guild-Channel mit zwei Bots: einem
Driver-Bot, der vom Harness gesteuert wird, und einem SUT-Bot, der vom untergeordneten
OpenClaw-Gateway über das gebündelte Discord-Plugin gestartet wird. Sie erfordert
`OPENCLAW_QA_DISCORD_GUILD_ID`, `OPENCLAW_QA_DISCORD_CHANNEL_ID`,
`OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`, `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
und `OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID`, wenn Umgebungs-Zugangsdaten verwendet werden.
Die Lane verifiziert die Verarbeitung von Channel-Erwähnungen und prüft, dass der SUT-Bot den nativen
`/help`-Befehl bei Discord registriert hat.
Der Befehl endet mit einem Wert ungleich null, wenn ein Szenario fehlschlägt. Verwenden Sie `--allow-failures`, wenn
Sie Artefakte ohne fehlschlagenden Exit-Code möchten.

Live-Transport-Lanes teilen sich jetzt einen kleineren gemeinsamen Vertrag, statt dass jede
eine eigene Form der Szenarioliste erfindet:

`qa-channel` bleibt die breite synthetische Suite für Produktverhalten und ist nicht Teil
der Live-Transport-Abdeckungsmatrix.

| Lane     | Canary | Erwähnungs-Gating | Allowlist-Blockierung | Antwort auf oberster Ebene | Wiederaufnahme nach Neustart | Thread-Folgeaktion | Thread-Isolation | Reaktionsbeobachtung | Hilfebefehl | Registrierung nativer Befehle |
| -------- | ------ | ----------------- | --------------------- | -------------------------- | ---------------------------- | ------------------ | ---------------- | -------------------- | ------------ | ----------------------------- |
| Matrix   | x      | x                 | x                     | x                          | x                            | x                  | x                | x                    |              |                               |
| Telegram | x      | x                 |                       |                            |                              |                    |                  |                      | x            |                               |
| Discord  | x      | x                 |                       |                            |                              |                    |                  |                      |              | x                             |

Dadurch bleibt `qa-channel` die breite Suite für Produktverhalten, während Matrix,
Telegram und künftige Live-Transporte eine explizite Checkliste für den Transportvertrag gemeinsam nutzen.

Für eine Lane auf einer wegwerfbaren Linux-VM, ohne Docker in den QA-Pfad einzubringen, führen Sie aus:

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

Dadurch wird ein frischer Multipass-Gast gestartet, Abhängigkeiten installiert, OpenClaw
innerhalb des Gasts gebaut, `qa suite` ausgeführt und anschließend der normale QA-Bericht und die
Zusammenfassung zurück in `.artifacts/qa-e2e/...` auf dem Host kopiert.
Es verwendet dasselbe Verhalten zur Szenarioauswahl wie `qa suite` auf dem Host.
Suite-Läufe auf Host und Multipass führen standardmäßig mehrere ausgewählte Szenarien parallel
mit isolierten Gateway-Workern aus. `qa-channel` verwendet standardmäßig Nebenläufigkeit 4,
begrenzt durch die Anzahl der ausgewählten Szenarien. Verwenden Sie `--concurrency <count>`, um die
Worker-Anzahl anzupassen, oder `--concurrency 1` für serielle Ausführung.
Der Befehl endet mit einem Wert ungleich null, wenn ein Szenario fehlschlägt. Verwenden Sie `--allow-failures`, wenn
Sie Artefakte ohne fehlschlagenden Exit-Code möchten.
Live-Läufe leiten die unterstützten QA-Authentifizierungseingaben weiter, die für den
Gast praktikabel sind: Provider-Schlüssel über die Umgebung, den QA-Live-Provider-Konfigurationspfad und
`CODEX_HOME`, falls vorhanden. Halten Sie `--output-dir` unter der Repo-Wurzel, damit der Gast
über den eingebundenen Workspace zurückschreiben kann.

## Repo-gestützte Seeds

Seed-Assets befinden sich in `qa/`:

- `qa/scenarios/index.md`
- `qa/scenarios/<theme>/*.md`

Diese liegen bewusst in Git, damit der QA-Plan sowohl für Menschen als auch für den
Agenten sichtbar ist.

`qa-lab` sollte ein generischer Markdown-Runner bleiben. Jede Markdown-Datei eines Szenarios ist
die Quelle der Wahrheit für einen einzelnen Testlauf und sollte Folgendes definieren:

- Szenariometadaten
- optionale Metadaten zu Kategorie, Fähigkeit, Lane und Risiko
- Dokumentations- und Code-Referenzen
- optionale Plugin-Anforderungen
- optionalen Gateway-Konfigurations-Patch
- den ausführbaren `qa-flow`

Die wiederverwendbare Laufzeitoberfläche, die `qa-flow` unterstützt, darf generisch
und bereichsübergreifend bleiben. So können Markdown-Szenarien beispielsweise
transportseitige Hilfen mit browserseitigen Hilfen kombinieren, die die eingebettete Control UI über die
Gateway-Seam `browser.request` steuern, ohne einen Sonderfall-Runner hinzuzufügen.

Szenariodateien sollten nach Produktfähigkeit statt nach Quellbaum-Ordner gruppiert werden. Halten Sie
Szenario-IDs stabil, wenn Dateien verschoben werden; verwenden Sie `docsRefs` und `codeRefs`
für die Rückverfolgbarkeit der Implementierung.

Die Baseline-Liste sollte breit genug bleiben, um Folgendes abzudecken:

- DM- und Channel-Chat
- Thread-Verhalten
- Lebenszyklus von Nachrichtenaktionen
- Cron-Callbacks
- Memory-Recall
- Modellwechsel
- Subagent-Handoff
- Lesen des Repos und Lesen der Dokumentation
- eine kleine Build-Aufgabe wie Lobster Invaders

## Provider-Mock-Lanes

`qa suite` hat zwei lokale Provider-Mock-Lanes:

- `mock-openai` ist der szenariobewusste OpenClaw-Mock. Er bleibt die
  standardmäßige deterministische Mock-Lane für repo-gestützte QA und Paritäts-Gates.
- `aimock` startet einen AIMock-gestützten Provider-Server für experimentelle Protokoll-,
  Fixture-, Record/Replay- und Chaos-Abdeckung. Er ist ergänzend und ersetzt nicht den
  Szenario-Dispatcher von `mock-openai`.

Die Implementierung der Provider-Lanes befindet sich unter `extensions/qa-lab/src/providers/`.
Jeder Provider besitzt seine Standardwerte, den Start des lokalen Servers, die Gateway-Modellkonfiguration,
Anforderungen an das Bereitstellen von Auth-Profilen sowie Live-/Mock-Fähigkeits-Flags. Gemeinsamer Suite- und
Gateway-Code sollte über die Provider-Registry geleitet werden, statt nach Providernamen zu verzweigen.

## Transportadapter

`qa-lab` besitzt eine generische Transport-Seam für Markdown-QA-Szenarien.
`qa-channel` ist der erste Adapter auf dieser Seam, aber das Designziel ist breiter:
Künftige echte oder synthetische Channels sollten in dieselbe Suite-Runner-Logik eingebunden werden, statt
einen transportspezifischen QA-Runner hinzuzufügen.

Auf Architekturebene ist die Aufteilung:

- `qa-lab` besitzt generische Szenarioausführung, Worker-Nebenläufigkeit, Schreiben von Artefakten und Berichterstellung.
- der Transportadapter besitzt Gateway-Konfiguration, Bereitschaft, Beobachtung von Ein- und Ausgabe, Transportaktionen und normalisierten Transportstatus.
- Markdown-Szenariodateien unter `qa/scenarios/` definieren den Testlauf; `qa-lab` stellt die wiederverwendbare Laufzeitoberfläche bereit, die ihn ausführt.

Maintainern zugewandte Hinweise zur Einführung neuer Channel-Adapter finden sich in
[Testing](/de/help/testing#adding-a-channel-to-qa).

## Berichterstellung

`qa-lab` exportiert einen Markdown-Protokollbericht aus der beobachteten QA-Bus-Zeitleiste.
Der Bericht sollte beantworten:

- Was funktioniert hat
- Was fehlgeschlagen ist
- Was blockiert blieb
- Welche Folge-Szenarien sich zusätzlich lohnen

Für Prüfungen von Charakter und Stil führen Sie dasselbe Szenario mit mehreren Live-Modell-
Referenzen aus und schreiben einen bewerteten Markdown-Bericht:

```bash
pnpm openclaw qa character-eval \
  --model openai/gpt-5.5,thinking=medium,fast \
  --model openai/gpt-5.2,thinking=xhigh \
  --model openai/gpt-5,thinking=xhigh \
  --model anthropic/claude-opus-4-6,thinking=high \
  --model anthropic/claude-sonnet-4-6,thinking=high \
  --model zai/glm-5.1,thinking=high \
  --model moonshot/kimi-k2.5,thinking=high \
  --model google/gemini-3.1-pro-preview,thinking=high \
  --judge-model openai/gpt-5.5,thinking=xhigh,fast \
  --judge-model anthropic/claude-opus-4-6,thinking=high \
  --blind-judge-models \
  --concurrency 16 \
  --judge-concurrency 16
```

Der Befehl führt lokale untergeordnete QA-Gateway-Prozesse aus, nicht Docker. Character-Eval-
Szenarien sollten die Persona über `SOUL.md` setzen und dann gewöhnliche Benutzer-Turns
wie Chat, Workspace-Hilfe und kleine Dateiaufgaben ausführen. Dem Kandidatenmodell
soll nicht mitgeteilt werden, dass es evaluiert wird. Der Befehl bewahrt jedes vollständige
Transkript, erfasst grundlegende Laufstatistiken und bittet dann die Judge-Modelle im Fast-Modus mit
`xhigh`-Reasoning, wo unterstützt, die Läufe nach Natürlichkeit, Vibe und Humor zu bewerten.
Verwenden Sie `--blind-judge-models`, wenn Sie Provider vergleichen: Der Judge-Prompt erhält weiterhin
jedes Transkript und jeden Laufstatus, aber Kandidaten-Refs werden durch neutrale Bezeichnungen wie
`candidate-01` ersetzt; der Bericht ordnet die Rangfolgen nach dem Parsen wieder den echten Refs zu.

Kandidatenläufe verwenden standardmäßig `high` Thinking, mit `medium` für GPT-5.5 und `xhigh`
für ältere OpenAI-Eval-Refs, die dies unterstützen. Überschreiben Sie einen bestimmten Kandidaten inline mit
`--model provider/model,thinking=<level>`. `--thinking <level>` setzt weiterhin einen
globalen Fallback, und die ältere Form `--model-thinking <provider/model=level>` bleibt aus
Kompatibilitätsgründen erhalten.
OpenAI-Kandidaten-Refs verwenden standardmäßig den Fast-Modus, sodass priorisierte Verarbeitung genutzt wird, wo
der Provider dies unterstützt. Fügen Sie inline `,fast`, `,no-fast` oder `,fast=false` hinzu, wenn ein
einzelner Kandidat oder Judge eine Überschreibung benötigt. Übergeben Sie `--fast` nur, wenn Sie den
Fast-Modus für jedes Kandidatenmodell erzwingen möchten. Die Dauern von Kandidaten- und Judge-Läufen werden
im Bericht zur Benchmark-Analyse aufgezeichnet, aber Judge-Prompts sagen ausdrücklich,
nicht nach Geschwindigkeit zu bewerten.
Kandidaten- und Judge-Modelläufe verwenden standardmäßig beide eine Nebenläufigkeit von 16. Verringern Sie
`--concurrency` oder `--judge-concurrency`, wenn Provider-Limits oder lokaler Gateway-
Druck einen Lauf zu unruhig machen.
Wenn kein Kandidat-`--model` übergeben wird, verwendet Character Eval standardmäßig
`openai/gpt-5.5`, `openai/gpt-5.2`, `openai/gpt-5`, `anthropic/claude-opus-4-6`,
`anthropic/claude-sonnet-4-6`, `zai/glm-5.1`,
`moonshot/kimi-k2.5` und
`google/gemini-3.1-pro-preview`, wenn kein `--model` übergeben wird.
Wenn kein `--judge-model` übergeben wird, verwenden die Judges standardmäßig
`openai/gpt-5.5,thinking=xhigh,fast` und
`anthropic/claude-opus-4-6,thinking=high`.

## Verwandte Dokumente

- [Testing](/de/help/testing)
- [QA Channel](/de/channels/qa-channel)
- [Dashboard](/de/web/dashboard)
