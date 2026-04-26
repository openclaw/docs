---
read_when:
    - Erweitern von qa-lab oder qa-channel
    - Repo-gestützte QA-Szenarien hinzufügen
    - Aufbau einer realistischeren QA-Automatisierung rund um das Gateway-Dashboard
summary: Private Form der QA-Automatisierung für qa-lab, qa-channel, vorbereitete Szenarien und Protokollberichte
title: QA-E2E-Automatisierung
x-i18n:
    generated_at: "2026-04-26T11:27:38Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3803f2bc5cdf2368c3af59b412de8ef732708995a54f7771d3f6f16e8be0592b
    source_path: concepts/qa-e2e-automation.md
    workflow: 15
---

Der private QA-Stack soll OpenClaw auf eine realistischere,
kanalförmige Weise prüfen, als es ein einzelner Unit-Test kann.

Aktuelle Bestandteile:

- `extensions/qa-channel`: synthetischer Nachrichtenkanal mit Oberflächen für DM, Kanal, Thread,
  Reaktion, Bearbeitung und Löschen.
- `extensions/qa-lab`: Debugger-UI und QA-Bus zum Beobachten des Transkripts,
  Einspeisen eingehender Nachrichten und Exportieren eines Markdown-Berichts.
- `qa/`: Repo-gestützte Seed-Assets für die Kickoff-Aufgabe und grundlegende QA-
  Szenarien.

Der aktuelle QA-Operatorablauf ist eine QA-Site mit zwei Bereichen:

- Links: Gateway-Dashboard (Control UI) mit dem Agenten.
- Rechts: QA Lab, das das Slack-ähnliche Transkript und den Szenarioplan anzeigt.

Starten Sie es mit:

```bash
pnpm qa:lab:up
```

Dadurch wird die QA-Site gebaut, der Docker-gestützte Gateway-Lane gestartet und die
QA-Lab-Seite bereitgestellt, auf der ein Operator oder eine Automatisierungsschleife dem Agenten eine QA-
Mission geben, reales Kanalverhalten beobachten und aufzeichnen kann, was funktioniert hat, fehlgeschlagen ist oder
blockiert geblieben ist.

Für schnellere UI-Iteration im QA Lab, ohne das Docker-Image jedes Mal neu zu bauen,
starten Sie den Stack mit einem per Bind-Mount eingebundenen QA-Lab-Bundle:

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` hält die Docker-Services auf einem vorgebauten Image und bindet
`extensions/qa-lab/web/dist` in den Container `qa-lab` ein. `qa:lab:watch`
baut dieses Bundle bei Änderungen neu, und der Browser lädt automatisch neu, wenn sich der Asset-Hash von QA Lab ändert.

Für einen lokalen OpenTelemetry-Trace-Smoke-Test führen Sie aus:

```bash
pnpm qa:otel:smoke
```

Dieses Skript startet einen lokalen OTLP/HTTP-Trace-Receiver, führt das
QA-Szenario `otel-trace-smoke` mit aktiviertem Plugin `diagnostics-otel` aus und
dekodiert dann die exportierten protobuf-Spans und prüft die releasekritische Form:
`openclaw.run`, `openclaw.harness.run`, `openclaw.model.call`,
`openclaw.context.assembled` und `openclaw.message.delivery` müssen vorhanden sein;
Modellaufrufe dürfen bei erfolgreichen Turns kein `StreamAbandoned` exportieren; rohe Diagnose-IDs und
Attribute `openclaw.content.*` dürfen nicht im Trace erscheinen. Es schreibt
`otel-smoke-summary.json` neben die Artefakte der QA-Suite.

Für einen transportechten Matrix-Smoke-Lane führen Sie aus:

```bash
pnpm openclaw qa matrix
```

Dieser Lane stellt einen temporären Tuwunel-Homeserver in Docker bereit, registriert
temporäre Benutzer für Driver, SUT und Beobachter, erstellt einen privaten Raum und führt dann
das echte Matrix-Plugin in einem untergeordneten QA-Gateway aus. Der Live-Transport-Lane hält die
Child-Konfiguration auf den getesteten Transport begrenzt, sodass Matrix ohne
`qa-channel` in der Child-Konfiguration läuft. Er schreibt die strukturierten Berichtsartefakte und
ein kombiniertes stdout/stderr-Log in das ausgewählte Matrix-QA-Ausgabeverzeichnis. Um auch
die äußere Build-/Launcher-Ausgabe von `scripts/run-node.mjs` zu erfassen, setzen Sie
`OPENCLAW_RUN_NODE_OUTPUT_LOG=<path>` auf eine Repo-lokale Logdatei.
Der Matrix-Fortschritt wird standardmäßig ausgegeben. `OPENCLAW_QA_MATRIX_TIMEOUT_MS` begrenzt
den gesamten Lauf, und `OPENCLAW_QA_MATRIX_CLEANUP_TIMEOUT_MS` begrenzt die Bereinigung, damit ein
hängender Docker-Teardown den genauen Wiederherstellungsbefehl meldet, statt zu hängen.

Für einen transportechten Telegram-Smoke-Lane führen Sie aus:

```bash
pnpm openclaw qa telegram
```

Dieser Lane zielt auf eine echte private Telegram-Gruppe statt einen temporären
Server bereitzustellen. Er erfordert `OPENCLAW_QA_TELEGRAM_GROUP_ID`,
`OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` und
`OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN` sowie zwei unterschiedliche Bots in derselben
privaten Gruppe. Der SUT-Bot muss einen Telegram-Benutzernamen haben, und Beobachtung von Bot zu Bot
funktioniert am besten, wenn für beide Bots im `@BotFather` der Bot-to-Bot Communication Mode
aktiviert ist.
Der Befehl endet mit einem Nicht-Null-Status, wenn ein Szenario fehlschlägt. Verwenden Sie `--allow-failures`, wenn
Sie Artefakte ohne fehlschlagenden Exit-Code möchten.
Der Telegram-Bericht und die Zusammenfassung enthalten die RTT pro Antwort von der Sendeanfrage
der Driver-Nachricht bis zur beobachteten Antwort des SUT, beginnend mit dem Canary.

Bevor Sie gepoolte Live-Anmeldedaten verwenden, führen Sie aus:

```bash
pnpm openclaw qa credentials doctor
```

Der Doctor prüft die Convex-Broker-Umgebung, validiert Endpunkteinstellungen und verifiziert die
Erreichbarkeit von Admin-/Listen-Endpunkten, wenn das Maintainer-Secret vorhanden ist. Für Secrets
meldet er nur den Status gesetzt/fehlend.

Für einen transportechten Discord-Smoke-Lane führen Sie aus:

```bash
pnpm openclaw qa discord
```

Dieser Lane zielt auf einen echten privaten Discord-Guild-Kanal mit zwei Bots: einem
Driver-Bot, der vom Harness gesteuert wird, und einem SUT-Bot, der vom untergeordneten
OpenClaw-Gateway über das gebündelte Discord-Plugin gestartet wird. Er erfordert
`OPENCLAW_QA_DISCORD_GUILD_ID`, `OPENCLAW_QA_DISCORD_CHANNEL_ID`,
`OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`, `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
und `OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID`, wenn Umgebungs-Anmeldedaten verwendet werden.
Der Lane prüft die Behandlung von Kanalerwähnungen und kontrolliert, dass der SUT-Bot
den nativen Befehl `/help` bei Discord registriert hat.
Der Befehl endet mit einem Nicht-Null-Status, wenn ein Szenario fehlschlägt. Verwenden Sie `--allow-failures`, wenn
Sie Artefakte ohne fehlschlagenden Exit-Code möchten.

Live-Transport-Lanes teilen jetzt einen kleineren gemeinsamen Vertrag, statt jeweils
ihre eigene Form für die Szenarioliste zu erfinden:

`qa-channel` bleibt die breite synthetische Suite für Produktverhalten und ist nicht Teil
der Live-Transport-Abdeckungsmatrix.

| Lane     | Canary | Erwähnungssteuerung | Allowlist-Block | Antwort auf oberster Ebene | Wiederaufnahme nach Neustart | Thread-Follow-up | Thread-Isolierung | Reaktionsbeobachtung | Help-Befehl | Registrierung nativer Befehle |
| -------- | ------ | ------------------- | --------------- | -------------------------- | ---------------------------- | ---------------- | ----------------- | -------------------- | ----------- | ----------------------------- |
| Matrix   | x      | x                   | x               | x                          | x                            | x                | x                 | x                    |             |                               |
| Telegram | x      | x                   |                 |                            |                              |                  |                   |                      | x           |                               |
| Discord  | x      | x                   |                 |                            |                              |                  |                   |                      |             | x                             |

Dadurch bleibt `qa-channel` die breite Suite für Produktverhalten, während Matrix,
Telegram und zukünftige Live-Transporte eine explizite gemeinsame Checkliste für den Transportvertrag nutzen.

Für einen temporären Linux-VM-Lane, ohne Docker in den QA-Pfad einzubeziehen, führen Sie aus:

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

Dadurch wird ein frischer Multipass-Gast gestartet, Abhängigkeiten werden installiert, OpenClaw
im Gast gebaut, `qa suite` ausgeführt und anschließend der normale QA-Bericht und die
Zusammenfassung zurück nach `.artifacts/qa-e2e/...` auf dem Host kopiert.
Es verwendet dasselbe Verhalten zur Szenarioauswahl wie `qa suite` auf dem Host.
Host- und Multipass-Suite-Läufe führen standardmäßig mehrere ausgewählte Szenarien parallel
mit isolierten Gateway-Workern aus. `qa-channel` verwendet standardmäßig eine Nebenläufigkeit von
4, begrenzt durch die Anzahl der ausgewählten Szenarien. Verwenden Sie `--concurrency <count>`, um die
Anzahl der Worker anzupassen, oder `--concurrency 1` für serielle Ausführung.
Der Befehl endet mit einem Nicht-Null-Status, wenn ein Szenario fehlschlägt. Verwenden Sie `--allow-failures`, wenn
Sie Artefakte ohne fehlschlagenden Exit-Code möchten.
Live-Läufe leiten die unterstützten QA-Authentifizierungseingaben weiter, die für den
Gast praktikabel sind: providerbasierte Schlüssel aus der Umgebung, den QA-Live-Provider-Konfigurationspfad und
`CODEX_HOME`, falls vorhanden. Halten Sie `--output-dir` unter dem Repo-Root, damit der Gast
über den eingebundenen Workspace zurückschreiben kann.

## Repo-gestützte Seeds

Seed-Assets liegen unter `qa/`:

- `qa/scenarios/index.md`
- `qa/scenarios/<theme>/*.md`

Diese befinden sich absichtlich in Git, damit der QA-Plan sowohl für Menschen als auch für den
Agenten sichtbar ist.

`qa-lab` sollte ein generischer Markdown-Runner bleiben. Jede Markdown-Datei eines Szenarios ist
die Quelle der Wahrheit für einen Testlauf und sollte Folgendes definieren:

- Szenariometadaten
- optionale Metadaten für Kategorie, Fähigkeit, Lane und Risiko
- Dokumentations- und Code-Referenzen
- optionale Plugin-Anforderungen
- optionalen Gateway-Konfigurations-Patch
- den ausführbaren `qa-flow`

Die wiederverwendbare Laufzeitoberfläche, die `qa-flow` stützt, darf generisch
und schnittstellenübergreifend bleiben. Beispielsweise können Markdown-Szenarien
transportseitige Hilfen mit browserseitigen Hilfen kombinieren, die die eingebettete
Control UI über die Gateway-Seam `browser.request` steuern, ohne einen Spezial-Runner hinzuzufügen.

Szenariodateien sollten nach Produktfähigkeit und nicht nach Quellbaumordner gruppiert werden.
Halten Sie Szenario-IDs stabil, wenn Dateien verschoben werden; verwenden Sie `docsRefs` und `codeRefs`
für die Rückverfolgbarkeit der Implementierung.

Die Basisliste sollte breit genug bleiben, um Folgendes abzudecken:

- DM- und Kanalchat
- Thread-Verhalten
- Lebenszyklus von Nachrichtenaktionen
- Cron-Callbacks
- Speicherabruf
- Modellwechsel
- Übergabe an Unteragenten
- Lesen von Repositories und Dokumentation
- eine kleine Build-Aufgabe wie Lobster Invaders

## Mock-Lanes für Provider

`qa suite` hat zwei lokale Mock-Lanes für Provider:

- `mock-openai` ist der szenariobewusste OpenClaw-Mock. Er bleibt der standardmäßige
  deterministische Mock-Lane für repo-gestützte QA und Paritäts-Gates.
- `aimock` startet einen AIMock-gestützten Provider-Server für experimentelle Protokoll-,
  Fixture-, Record/Replay- und Chaos-Abdeckung. Er ist additiv und ersetzt den
  Szenario-Dispatcher `mock-openai` nicht.

Die Implementierung der Provider-Lanes liegt unter `extensions/qa-lab/src/providers/`.
Jeder Provider besitzt seine Standardwerte, den Start seines lokalen Servers, die Gateway-Modellkonfiguration,
Anforderungen für das Staging von Auth-Profilen und Flags für Live-/Mock-Fähigkeiten. Gemeinsamer Suite- und
Gateway-Code sollte über die Provider-Registry routen, statt nach Providernamen zu verzweigen.

## Transportadapter

`qa-lab` besitzt eine generische Transport-Seam für Markdown-QA-Szenarien.
`qa-channel` ist der erste Adapter auf dieser Seam, aber das Designziel ist breiter:
zukünftige echte oder synthetische Kanäle sollten in denselben Suite-Runner eingesteckt werden,
statt einen transportspezifischen QA-Runner hinzuzufügen.

Auf Architekturebene ist die Aufteilung:

- `qa-lab` besitzt generische Szenarioausführung, Worker-Nebenläufigkeit, Schreiben von Artefakten und Berichtswesen.
- der Transportadapter besitzt Gateway-Konfiguration, Bereitschaft, Beobachtung von Ein- und Ausgängen, Transportaktionen und normalisierten Transportzustand.
- Markdown-Szenariodateien unter `qa/scenarios/` definieren den Testlauf; `qa-lab` stellt die wiederverwendbare Laufzeitoberfläche bereit, die sie ausführt.

Maintainer-orientierte Hinweise zur Einführung neuer Kanaladapter finden sich in
[Testing](/de/help/testing#adding-a-channel-to-qa).

## Berichtswesen

`qa-lab` exportiert einen Markdown-Protokollbericht aus der beobachteten QA-Bus-Zeitleiste.
Der Bericht sollte beantworten:

- Was funktioniert hat
- Was fehlgeschlagen ist
- Was blockiert geblieben ist
- Welche Follow-up-Szenarien sich hinzuzufügen lohnen

Für Prüfungen von Charakter und Stil führen Sie dasselbe Szenario über mehrere Live-Modell-
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

Der Befehl führt lokale untergeordnete QA-Gateway-Prozesse aus, nicht Docker. Szenarien zur Charakterbewertung
sollten die Persona über `SOUL.md` setzen und dann normale Benutzer-Turns ausführen,
wie Chat, Hilfe zum Workspace und kleine Dateiaufgaben. Dem Kandidatenmodell
sollte nicht mitgeteilt werden, dass es bewertet wird. Der Befehl bewahrt jedes vollständige
Transkript auf, zeichnet grundlegende Laufstatistiken auf und bittet dann die Bewertungsmodelle im Fast-Modus mit
`xhigh`-Reasoning, wo unterstützt, die Läufe nach Natürlichkeit, Vibe und Humor zu bewerten.
Verwenden Sie `--blind-judge-models`, wenn Sie Provider vergleichen: Der Bewertungs-Prompt erhält weiterhin
jedes Transkript und jeden Laufstatus, aber Kandidaten-Refs werden durch neutrale
Bezeichnungen wie `candidate-01` ersetzt; der Bericht ordnet die Rankings nach dem Parsen wieder den echten Refs zu.
Kandidatenläufe verwenden standardmäßig `high` Thinking, mit `medium` für GPT-5.5 und `xhigh`
für ältere OpenAI-Eval-Refs, die dies unterstützen. Überschreiben Sie einen bestimmten Kandidaten inline mit
`--model provider/model,thinking=<level>`. `--thinking <level>` setzt weiterhin einen
globalen Fallback, und die ältere Form `--model-thinking <provider/model=level>` bleibt aus
Kompatibilitätsgründen erhalten.
OpenAI-Kandidaten-Refs verwenden standardmäßig den Fast-Modus, damit Prioritätsverarbeitung genutzt wird, wo
der Provider dies unterstützt. Fügen Sie inline `,fast`, `,no-fast` oder `,fast=false` hinzu, wenn ein
einzelner Kandidat oder Bewerter eine Überschreibung benötigt. Übergeben Sie `--fast` nur dann, wenn Sie
den Fast-Modus für jedes Kandidatenmodell erzwingen möchten. Laufzeiten von Kandidaten und Bewertern
werden zur Benchmark-Analyse im Bericht aufgezeichnet, aber in den Bewerter-Prompts wird ausdrücklich gesagt,
nicht nach Geschwindigkeit zu bewerten.
Kandidaten- und Bewerter-Modellläufe verwenden beide standardmäßig eine Nebenläufigkeit von 16. Senken Sie
`--concurrency` oder `--judge-concurrency`, wenn Provider-Limits oder Druck auf das lokale Gateway
einen Lauf zu verrauscht machen.
Wenn kein Kandidat mit `--model` übergeben wird, verwendet die Charakterbewertung standardmäßig
`openai/gpt-5.5`, `openai/gpt-5.2`, `openai/gpt-5`, `anthropic/claude-opus-4-6`,
`anthropic/claude-sonnet-4-6`, `zai/glm-5.1`,
`moonshot/kimi-k2.5` und
`google/gemini-3.1-pro-preview`, wenn kein `--model` übergeben wird.
Wenn kein `--judge-model` übergeben wird, verwenden die Bewerter standardmäßig
`openai/gpt-5.5,thinking=xhigh,fast` und
`anthropic/claude-opus-4-6,thinking=high`.

## Verwandte Dokumentation

- [Testing](/de/help/testing)
- [QA Channel](/de/channels/qa-channel)
- [Dashboard](/de/web/dashboard)
