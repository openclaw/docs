---
read_when:
    - Erweiterung von qa-lab oder qa-channel
    - Hinzufügen repositorygestützter QA-Szenarien
    - Aufbau realistischerer QA-Automatisierung rund um das Gateway-Dashboard
summary: Form der privaten QA-Automatisierung für qa-lab, qa-channel, Seeded-Szenarien und Protokollberichte
title: QA-E2E-Automatisierung
x-i18n:
    generated_at: "2026-04-25T13:45:07Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9a49e0954845355667617c85340281b6dc1b043857a76d7b303cc0a8b2845a75
    source_path: concepts/qa-e2e-automation.md
    workflow: 15
---

Der private QA-Stack soll OpenClaw auf eine realistischere,
kanalförmige Weise testen, als es ein einzelner Unit-Test kann.

Aktuelle Bestandteile:

- `extensions/qa-channel`: synthetischer Nachrichtenkanal mit DM-, Kanal-, Thread-,
  Reaktions-, Bearbeitungs- und Löschoberflächen.
- `extensions/qa-lab`: Debugger-UI und QA-Bus zum Beobachten des Protokolls,
  Einspeisen eingehender Nachrichten und Exportieren eines Markdown-Berichts.
- `qa/`: repositorygestützte Seed-Assets für die Startaufgabe und grundlegende QA-
  Szenarien.

Der aktuelle QA-Operatorablauf ist eine QA-Site mit zwei Bereichen:

- Links: Gateway-Dashboard (Control UI) mit dem Agenten.
- Rechts: QA Lab, das das Slack-ähnliche Protokoll und den Szenarioplan anzeigt.

Starten Sie es mit:

```bash
pnpm qa:lab:up
```

Das baut die QA-Site, startet die Docker-gestützte Gateway-Lane und stellt die
QA-Lab-Seite bereit, auf der ein Operator oder eine Automatisierungsschleife dem Agenten
eine QA-Mission geben, echtes Kanalverhalten beobachten und festhalten kann, was
funktioniert hat, fehlgeschlagen ist oder blockiert geblieben ist.

Für schnellere QA-Lab-UI-Iteration, ohne das Docker-Image jedes Mal neu zu bauen,
starten Sie den Stack mit einem bind-gemounteten QA-Lab-Bundle:

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` lässt die Docker-Dienste auf einem vorgebauten Image laufen und bind-mountet
`extensions/qa-lab/web/dist` in den Container `qa-lab`. `qa:lab:watch`
baut dieses Bundle bei Änderungen neu, und der Browser lädt automatisch neu, wenn sich der QA-Lab-
Asset-Hash ändert.

Für eine transportechte Matrix-Smoke-Lane führen Sie aus:

```bash
pnpm openclaw qa matrix
```

Diese Lane stellt in Docker einen temporären Tuwunel-Homeserver bereit, registriert
temporäre Driver-, SUT- und Observer-Benutzer, erstellt einen privaten Raum und führt dann
das echte Matrix-Plugin innerhalb eines untergeordneten QA-Gateway-Prozesses aus. Die Live-Transport-Lane hält
die Konfiguration des Child-Prozesses auf den getesteten Transport beschränkt, sodass Matrix ohne
`qa-channel` in der Child-Konfiguration läuft. Sie schreibt die strukturierten Berichtsartefakte und
ein kombiniertes stdout/stderr-Log in das ausgewählte Matrix-QA-Ausgabeverzeichnis. Um
auch die äußere Build-/Launcher-Ausgabe von `scripts/run-node.mjs` zu erfassen, setzen Sie
`OPENCLAW_RUN_NODE_OUTPUT_LOG=<path>` auf eine repo-lokale Logdatei.
Der Matrix-Fortschritt wird standardmäßig ausgegeben. `OPENCLAW_QA_MATRIX_TIMEOUT_MS` begrenzt den
gesamten Lauf, und `OPENCLAW_QA_MATRIX_CLEANUP_TIMEOUT_MS` begrenzt das Cleanup, sodass bei einem
hängenden Docker-Teardown der genaue Recovery-Befehl gemeldet wird, statt zu hängen.

Für eine transportechte Telegram-Smoke-Lane führen Sie aus:

```bash
pnpm openclaw qa telegram
```

Diese Lane zielt auf eine echte private Telegram-Gruppe statt einen temporären Server
bereitzustellen. Sie erfordert `OPENCLAW_QA_TELEGRAM_GROUP_ID`,
`OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` und
`OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN` sowie zwei unterschiedliche Bots in derselben
privaten Gruppe. Der SUT-Bot muss einen Telegram-Benutzernamen haben, und die Bot-zu-Bot-
Beobachtung funktioniert am besten, wenn bei beiden Bots der Bot-to-Bot Communication Mode
in `@BotFather` aktiviert ist.
Der Befehl endet mit einem Fehlercode ungleich null, wenn ein Szenario fehlschlägt. Verwenden Sie `--allow-failures`, wenn
Sie Artefakte ohne fehlerhaften Exit-Code möchten.
Der Telegram-Bericht und die Zusammenfassung enthalten pro Antwort die RTT von der
Sendeanforderung der Driver-Nachricht bis zur beobachteten SUT-Antwort, beginnend mit dem Canary.

Bevor Sie gepoolte Live-Zugangsdaten verwenden, führen Sie aus:

```bash
pnpm openclaw qa credentials doctor
```

Der Doctor prüft die Convex-Broker-Umgebung, validiert Endpoint-Einstellungen und verifiziert
Admin-/List-Erreichbarkeit, wenn das Maintainer-Geheimnis vorhanden ist. Er meldet für Geheimnisse nur
den Status gesetzt/fehlend.

Für eine transportechte Discord-Smoke-Lane führen Sie aus:

```bash
pnpm openclaw qa discord
```

Diese Lane zielt auf einen echten privaten Discord-Serverkanal mit zwei Bots: einem
Driver-Bot, der vom Harness gesteuert wird, und einem SUT-Bot, der vom untergeordneten
OpenClaw-Gateway über das gebündelte Discord-Plugin gestartet wird. Sie erfordert
`OPENCLAW_QA_DISCORD_GUILD_ID`, `OPENCLAW_QA_DISCORD_CHANNEL_ID`,
`OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`, `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
und `OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID`, wenn Env-Zugangsdaten verwendet werden.
Die Lane prüft die Erwähnungsverarbeitung im Kanal und kontrolliert, dass der SUT-Bot
den nativen Befehl `/help` bei Discord registriert hat.
Der Befehl endet mit einem Fehlercode ungleich null, wenn ein Szenario fehlschlägt. Verwenden Sie `--allow-failures`, wenn
Sie Artefakte ohne fehlerhaften Exit-Code möchten.

Live-Transport-Lanes teilen sich jetzt einen kleineren gemeinsamen Vertrag, statt dass jede
ihre eigene Form der Szenarioliste erfindet:

`qa-channel` bleibt die breite synthetische Suite für Produktverhalten und ist nicht Teil
der Live-Transport-Abdeckungsmatrix.

| Lane     | Canary | Mention gating | Allowlist block | Top-level reply | Restart resume | Thread follow-up | Thread isolation | Reaction observation | Help command | Native command registration |
| -------- | ------ | -------------- | --------------- | --------------- | -------------- | ---------------- | ---------------- | -------------------- | ------------ | --------------------------- |
| Matrix   | x      | x              | x               | x               | x              | x                | x                | x                    |              |                             |
| Telegram | x      | x              |                 |                 |                |                  |                  |                      | x            |                             |
| Discord  | x      | x              |                 |                 |                |                  |                  |                      |              | x                           |

Damit bleibt `qa-channel` die breite Suite für Produktverhalten, während Matrix,
Telegram und zukünftige Live-Transporte sich eine explizite Transport-Vertrags-Checkliste teilen.

Für eine temporäre Linux-VM-Lane ohne Docker im QA-Pfad zu verwenden, führen Sie aus:

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

Dadurch wird ein frischer Multipass-Gast gestartet, Abhängigkeiten installiert, OpenClaw
innerhalb des Gasts gebaut, `qa suite` ausgeführt und anschließend der normale QA-Bericht sowie die
Zusammenfassung zurück nach `.artifacts/qa-e2e/...` auf dem Host kopiert.
Dabei wird dasselbe Szenarioauswahlverhalten wie bei `qa suite` auf dem Host wiederverwendet.
Host- und Multipass-Suite-Läufe führen standardmäßig mehrere ausgewählte Szenarien parallel
mit isolierten Gateway-Workern aus. `qa-channel` verwendet standardmäßig eine Parallelität von
4, begrenzt durch die Anzahl der ausgewählten Szenarien. Verwenden Sie `--concurrency <count>`, um
die Anzahl der Worker anzupassen, oder `--concurrency 1` für serielle Ausführung.
Der Befehl endet mit einem Fehlercode ungleich null, wenn ein Szenario fehlschlägt. Verwenden Sie `--allow-failures`, wenn
Sie Artefakte ohne fehlerhaften Exit-Code möchten.
Live-Läufe leiten die unterstützten QA-Auth-Eingaben weiter, die für den
Gast praktikabel sind: Env-basierte Provider-Schlüssel, den Pfad zur QA-Live-Provider-Konfiguration und
`CODEX_HOME`, falls vorhanden. Halten Sie `--output-dir` unter dem Repo-Root, damit der Gast
über den gemounteten Workspace zurückschreiben kann.

## Repositorygestützte Seeds

Seed-Assets liegen in `qa/`:

- `qa/scenarios/index.md`
- `qa/scenarios/<theme>/*.md`

Diese sind absichtlich in Git, damit der QA-Plan sowohl für Menschen als auch für den
Agenten sichtbar ist.

`qa-lab` sollte ein generischer Markdown-Runner bleiben. Jede Markdown-Szenariodatei ist
die Quelle der Wahrheit für einen Testlauf und sollte Folgendes definieren:

- Szenariometadaten
- optionale Metadaten für Kategorie, Fähigkeit, Lane und Risiko
- Dokumentations- und Code-Referenzen
- optionale Plugin-Anforderungen
- optionalen Gateway-Konfigurations-Patch
- den ausführbaren `qa-flow`

Die wiederverwendbare Laufzeitoberfläche, die `qa-flow` unterstützt, darf generisch
und querschnittlich bleiben. Markdown-Szenarien können zum Beispiel transportseitige
Hilfsfunktionen mit browserseitigen Hilfsfunktionen kombinieren, die die eingebettete Control UI über die
Gateway-Seam `browser.request` steuern, ohne einen spezialfallbezogenen Runner hinzuzufügen.

Szenariodateien sollten nach Produktfähigkeit statt nach Quellbaumordner gruppiert werden.
Halten Sie Szenario-IDs stabil, wenn Dateien verschoben werden; verwenden Sie `docsRefs` und `codeRefs`
für die Rückverfolgbarkeit der Implementierung.

Die Baseline-Liste sollte breit genug bleiben, um Folgendes abzudecken:

- DM- und Kanalchat
- Thread-Verhalten
- Lebenszyklus von Nachrichtenaktionen
- Cron-Callbacks
- Memory-Abruf
- Modellwechsel
- Unteragenten-Handoff
- Repo-Lesen und Dokumentationslesen
- eine kleine Build-Aufgabe wie Lobster Invaders

## Provider-Mock-Lanes

`qa suite` hat zwei lokale Provider-Mock-Lanes:

- `mock-openai` ist der szenariobewusste OpenClaw-Mock. Er bleibt die standardmäßige
  deterministische Mock-Lane für repositorygestützte QA und Parity-Gates.
- `aimock` startet einen AIMock-gestützten Provider-Server für experimentelle Protokoll-,
  Fixture-, Record/Replay- und Chaos-Abdeckung. Er ist additiv und ersetzt
  den Szenario-Dispatcher `mock-openai` nicht.

Die Implementierung der Provider-Lane liegt unter `extensions/qa-lab/src/providers/`.
Jeder Provider verwaltet seine Standards, den Start des lokalen Servers, die Gateway-Modellkonfiguration,
Auth-Profile-Staging-Anforderungen und Live-/Mock-Fähigkeits-Flags selbst. Gemeinsamer Suite- und
Gateway-Code sollte über die Provider-Registry geroutet werden, statt nach Providernamen zu verzweigen.

## Transport-Adapter

`qa-lab` besitzt eine generische Transport-Seam für Markdown-QA-Szenarien.
`qa-channel` ist der erste Adapter auf dieser Seam, aber das Designziel ist breiter:
zukünftige echte oder synthetische Kanäle sollten sich in denselben Suite-Runner einklinken,
statt einen transportspezifischen QA-Runner hinzuzufügen.

Auf Architekturebene ist die Aufteilung:

- `qa-lab` besitzt generische Szenarioausführung, Worker-Parallelität, Artefaktschreiben und Berichtswesen.
- Der Transport-Adapter besitzt Gateway-Konfiguration, Bereitschaft, Ein- und Ausgangsbeobachtung, Transportaktionen und normalisierten Transportzustand.
- Markdown-Szenariodateien unter `qa/scenarios/` definieren den Testlauf; `qa-lab` stellt die wiederverwendbare Laufzeitoberfläche bereit, die sie ausführt.

Maintainer-orientierte Einführungsrichtlinien für neue Kanal-Adapter stehen in
[Testing](/de/help/testing#adding-a-channel-to-qa).

## Berichtswesen

`qa-lab` exportiert einen Markdown-Protokollbericht aus der beobachteten Bus-Zeitleiste.
Der Bericht sollte beantworten:

- Was funktioniert hat
- Was fehlgeschlagen ist
- Was blockiert geblieben ist
- Welche Folge-Szenarien sich lohnen hinzuzufügen

Für Prüfungen von Charakter und Stil führen Sie dasselbe Szenario über mehrere Live-Modell-
Referenzen aus und schreiben einen beurteilten Markdown-Bericht:

```bash
pnpm openclaw qa character-eval \
  --model openai/gpt-5.4,thinking=medium,fast \
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
Szenarien sollten die Persona über `SOUL.md` setzen und dann gewöhnliche Benutzer-Turns
wie Chat, Workspace-Hilfe und kleine Dateiaufgaben ausführen. Dem Kandidatenmodell
soll nicht mitgeteilt werden, dass es evaluiert wird. Der Befehl bewahrt jedes vollständige
Protokoll, zeichnet grundlegende Laufstatistiken auf und bittet dann die Judge-Modelle im Fast-Modus mit
`xhigh`-Reasoning, sofern unterstützt, die Läufe nach Natürlichkeit, Vibe und Humor zu bewerten.
Verwenden Sie `--blind-judge-models`, wenn Sie Provider vergleichen: Der Judge-Prompt erhält weiterhin
jedes Protokoll und jeden Laufstatus, aber Kandidaten-Refs werden durch neutrale Bezeichnungen wie
`candidate-01` ersetzt; der Bericht ordnet die Rankings nach dem Parsen wieder den echten Refs zu.
Kandidatenläufe verwenden standardmäßig `high` Thinking, mit `medium` für GPT-5.4 und `xhigh`
für ältere OpenAI-Eval-Refs, die dies unterstützen. Überschreiben Sie einen bestimmten Kandidaten inline mit
`--model provider/model,thinking=<level>`. `--thinking <level>` setzt weiterhin einen
globalen Fallback, und die ältere Form `--model-thinking <provider/model=level>` bleibt
aus Kompatibilitätsgründen erhalten.
OpenAI-Kandidaten-Refs verwenden standardmäßig den Fast-Modus, sodass vorrangige Verarbeitung genutzt wird, wo
der Provider dies unterstützt. Fügen Sie inline `,fast`, `,no-fast` oder `,fast=false` hinzu, wenn ein
einzelner Kandidat oder Judge eine Überschreibung benötigt. Übergeben Sie `--fast` nur, wenn Sie den
Fast-Modus für jedes Kandidatenmodell erzwingen möchten. Laufzeiten von Kandidaten und Judges werden
zur Benchmark-Analyse im Bericht aufgezeichnet, aber in den Judge-Prompts wird ausdrücklich gesagt,
nicht nach Geschwindigkeit zu bewerten.
Sowohl Kandidaten- als auch Judge-Modelläufe verwenden standardmäßig eine Parallelität von 16. Senken Sie
`--concurrency` oder `--judge-concurrency`, wenn Provider-Limits oder Last auf dem lokalen Gateway
einen Lauf zu verrauscht machen.
Wenn kein Kandidaten-`--model` übergeben wird, verwendet Character Eval standardmäßig
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
- [Dashboard](/de/web/dashboard)
