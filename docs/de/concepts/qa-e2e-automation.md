---
read_when:
    - Verstehen, wie der QA-Stack zusammenpasst
    - qa-lab, qa-channel oder einen Transportadapter erweitern
    - Repo-gestützte QA-Szenarien hinzufügen
    - QA-Automatisierung mit höherem Realismus rund um das Gateway-Dashboard
summary: 'Übersicht über den QA-Stack: qa-lab, qa-channel, repo-gestützte Szenarien, Live-Transport-Lanes, Transportadapter und Reporting.'
title: QA-Übersicht
x-i18n:
    generated_at: "2026-07-01T05:38:37Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 33dc2c7ac1751c8728dda332476cd41cf39c3e9d1582f8c652c2670c2549b34c
    source_path: concepts/qa-e2e-automation.md
    workflow: 16
---

Der private QA-Stack soll OpenClaw realistischer und stärker
kanalnah testen, als es ein einzelner Unit-Test kann.

Aktuelle Bestandteile:

- `extensions/qa-channel`: synthetischer Nachrichtenkanal mit DM-, Kanal-, Thread-,
  Reaktions-, Bearbeitungs- und Löschoberflächen.
- `extensions/qa-lab`: Debugger-UI und QA-Bus zum Beobachten des Transkripts,
  Einspeisen eingehender Nachrichten und Exportieren eines Markdown-Berichts.
- `extensions/qa-matrix`, zukünftige Runner-Plugins: Live-Transport-Adapter, die
  einen echten Kanal innerhalb eines untergeordneten QA-Gateway steuern.
- `qa/`: repo-gestützte Seed-Assets für die Kickoff-Aufgabe und grundlegende QA-
  Szenarien.
- [Mantis](/de/concepts/mantis): Vorher-/Nachher-Live-Verifikation für Fehler, die
  echte Transporte, Browser-Screenshots, VM-Zustand und PR-Nachweise benötigen.

## Befehlsoberfläche

Jeder QA-Flow läuft unter `pnpm openclaw qa <subcommand>`. Viele haben `pnpm qa:*`-
Skript-Aliasse; beide Formen werden unterstützt.

| Befehl                                             | Zweck                                                                                                                                                                                                                                                                 |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `qa run`                                            | Gebündelter QA-Selbstcheck ohne `--qa-profile`; taxonomiegestützter Reifeprofil-Runner mit `--qa-profile smoke-ci`, `--qa-profile release` oder `--qa-profile all`.                                                                                                      |
| `qa suite`                                          | Führt repo-gestützte Szenarien gegen die QA-Gateway-Lane aus. Aliasse: `pnpm openclaw qa suite --runner multipass` für eine wegwerfbare Linux-VM.                                                                                                                                  |
| `qa coverage`                                       | Gibt das YAML-Inventar zur Szenarioabdeckung aus (`--json` für maschinenlesbare Ausgabe).                                                                                                                                                                                               |
| `qa parity-report`                                  | Vergleicht zwei `qa-suite-summary.json`-Dateien und schreibt den agentenbasierten Paritätsbericht, oder verwendet `--runtime-axis --token-efficiency`, um Codex-vs-OpenClaw-Laufzeitparität und Token-Effizienzberichte aus einer Runtime-Paar-Zusammenfassung zu schreiben.                                         |
| `qa character-eval`                                 | Führt das Charakter-QA-Szenario über mehrere Live-Modelle mit einem bewerteten Bericht aus. Siehe [Berichterstattung](#reporting).                                                                                                                                                            |
| `qa manual`                                         | Führt einen einmaligen Prompt gegen die ausgewählte Provider-/Modell-Lane aus.                                                                                                                                                                                                          |
| `qa ui`                                             | Startet die QA-Debugger-UI und den lokalen QA-Bus (Alias: `pnpm qa:lab:ui`).                                                                                                                                                                                                    |
| `qa docker-build-image`                             | Baut das vorgefertigte QA-Docker-Image.                                                                                                                                                                                                                                     |
| `qa docker-scaffold`                                | Schreibt ein docker-compose-Gerüst für das QA-Dashboard und die Gateway-Lane.                                                                                                                                                                                                    |
| `qa up`                                             | Baut die QA-Site, startet den Docker-gestützten Stack und gibt die URL aus (Alias: `pnpm qa:lab:up`; die Variante `:fast` ergänzt `--use-prebuilt-image --bind-ui-dist --skip-ui-build`).                                                                                                  |
| `qa aimock`                                         | Startet nur den AIMock-Provider-Server.                                                                                                                                                                                                                                  |
| `qa mock-openai`                                    | Startet nur den szenariobewussten `mock-openai`-Provider-Server.                                                                                                                                                                                                            |
| `qa credentials doctor` / `add` / `list` / `remove` | Verwaltet den gemeinsam genutzten Convex-Anmeldeinformationspool.                                                                                                                                                                                                                               |
| `qa matrix`                                         | Live-Transport-Lane gegen einen wegwerfbaren Tuwunel-Homeserver. Siehe [Matrix-QA](/de/concepts/qa-matrix).                                                                                                                                                                      |
| `qa telegram`                                       | Live-Transport-Lane gegen eine echte private Telegram-Gruppe.                                                                                                                                                                                                              |
| `qa discord`                                        | Live-Transport-Lane gegen einen echten privaten Discord-Guild-Kanal.                                                                                                                                                                                                       |
| `qa slack`                                          | Live-Transport-Lane gegen einen echten privaten Slack-Kanal.                                                                                                                                                                                                               |
| `qa whatsapp`                                       | Live-Transport-Lane gegen echte WhatsApp-Web-Konten.                                                                                                                                                                                                                 |
| `qa mantis`                                         | Vorher-/Nachher-Verifikations-Runner für Live-Transport-Fehler, mit Discord-Statusreaktionsnachweisen, Crabbox-Desktop-/Browser-Smoke und Slack-in-VNC-Smoke. Siehe [Mantis](/de/concepts/mantis) und [Mantis Slack Desktop Runbook](/de/concepts/mantis-slack-desktop-runbook). |

Profilgestütztes `qa run` liest die Mitgliedschaft aus `taxonomy.yaml` und leitet
die aufgelösten Szenarien dann über `qa suite` weiter. `--surface` und
`--category` filtern das ausgewählte Profil, statt separate Lanes zu definieren.
Die resultierende `qa-evidence.json` enthält eine Profil-Scorecard-Zusammenfassung
mit ausgewählten Kategorieanzahlen und fehlenden Abdeckungs-IDs; die einzelnen
Nachweiseinträge bleiben die maßgebliche Quelle für Tests, Abdeckungsrollen und Ergebnisse.
Taxonomie-Feature-Abdeckungs-IDs sind exakte Nachweisziele, keine Aliasse. Primäre
Szenarioabdeckung erfüllt übereinstimmende IDs; sekundäre Abdeckung bleibt beratend.
Abdeckungs-IDs verwenden die gepunktete Form `namespace.behavior` mit kleingeschriebenen
alphanumerischen/Bindestrich-Segmenten; Profil-, Oberflächen- und Kategorie-IDs können
weiterhin die bestehenden gestrichelten oder gepunkteten Taxonomie-IDs verwenden.
Schlanke Nachweise lassen pro Eintrag `execution` weg und setzen `evidenceMode: "slim"`;
`smoke-ci` verwendet standardmäßig schlanke Nachweise, und `--evidence-mode full` stellt
vollständige Einträge wieder her:

```bash
pnpm openclaw qa run \
  --qa-profile smoke-ci \
  --category channel-framework.conversation-routing-and-delivery \
  --provider-mode mock-openai \
  --output-dir .artifacts/qa-e2e/smoke-ci-profile-dispatch
```

Verwenden Sie `smoke-ci` für deterministische Profilnachweise mit Mock-Modell-Providern und
lokalen Crabline-Provider-Servern. Verwenden Sie `release` für Stable-/LTS-Nachweise gegen Live-
Kanäle. Verwenden Sie `all` nur für explizite vollständige Taxonomie-Nachweisläufe; es wählt
jede aktive Reifekategorie aus und kann über den Workflow `QA Profile
Evidence` mit `qa_profile=all` ausgelöst werden. Wenn ein Befehl auch ein OpenClaw-
Root-Profil benötigt, setzen Sie das Root-Profil vor den QA-Befehl:

```bash
pnpm openclaw --profile work qa run --qa-profile smoke-ci
```

## Operator-Flow

Der aktuelle QA-Operator-Flow ist eine zweigeteilte QA-Site:

- Links: Gateway-Dashboard (Control UI) mit dem Agenten.
- Rechts: QA Lab mit dem Slack-artigen Transkript und Szenarioplan.

Führen Sie ihn aus mit:

```bash
pnpm qa:lab:up
```

Das baut die QA-Site, startet die Docker-gestützte Gateway-Lane und stellt die
QA-Lab-Seite bereit, auf der ein Operator oder eine Automatisierungsschleife dem Agenten
eine QA-Mission geben, echtes Kanalverhalten beobachten und aufzeichnen kann, was
funktioniert hat, fehlgeschlagen ist oder blockiert blieb.

Für schnellere Iteration an der QA-Lab-UI ohne jedes Mal das Docker-Image neu zu bauen,
starten Sie den Stack mit einem bind-gemounteten QA-Lab-Bundle:

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` hält die Docker-Dienste auf einem vorgefertigten Image und bind-mountet
`extensions/qa-lab/web/dist` in den `qa-lab`-Container. `qa:lab:watch`
baut dieses Bundle bei Änderungen neu, und der Browser lädt automatisch neu, wenn sich der
Asset-Hash von QA Lab ändert.

Für einen lokalen OpenTelemetry-Signal-Smoke führen Sie aus:

```bash
pnpm qa:otel:smoke
```

Dieses Skript startet einen lokalen OTLP/HTTP-Empfänger, führt das QA-Szenario
`otel-trace-smoke` mit aktiviertem `diagnostics-otel`-Plugin aus und prüft dann, ob Traces,
Metriken und Logs exportiert werden. Es dekodiert die exportierten Protobuf-Trace-Spans
und prüft die releasekritische Form:
`openclaw.run`, `openclaw.harness.run`, ein Modellaufruf-Span nach der neuesten
GenAI-Semantik-Konvention, `openclaw.context.assembled` und `openclaw.message.delivery`
müssen vorhanden sein. Der Smoke erzwingt
`OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`, daher muss der Modellaufruf-
Span den Namen `{gen_ai.operation.name} {gen_ai.request.model}` verwenden;
Modellaufrufe dürfen bei erfolgreichen Turns nicht `StreamAbandoned` exportieren; rohe Diagnose-IDs und
`openclaw.content.*`-Attribute müssen aus dem Trace herausbleiben. Die rohen OTLP-
Payloads dürfen den Prompt-Sentinel, Response-Sentinel oder QA-Sitzungsschlüssel nicht
enthalten. Es schreibt `otel-smoke-summary.json` neben die QA-Suite-Artefakte.

Für einen Collector-gestützten OpenTelemetry-Smoke führen Sie aus:

```bash
pnpm qa:otel:collector-smoke
```

Diese Lane setzt einen echten OpenTelemetry Collector-Docker-Container vor denselben
lokalen Empfänger. Verwenden Sie sie, wenn Sie Endpoint-Verkabelung, Collector-
Kompatibilität oder OTLP-Exportverhalten ändern, das der In-Process-Empfänger verdecken könnte.

Für den geschützten Prometheus-Scrape-Smoke führen Sie aus:

```bash
pnpm qa:prometheus:smoke
```

Dieser Alias führt das QA-Szenario `docker-prometheus-smoke` mit aktiviertem
`diagnostics-prometheus` aus, verifiziert, dass nicht authentifizierte Scrapes
abgelehnt werden, und prüft dann, dass der authentifizierte Scrape releasekritische
Metrikfamilien ohne Prompt-Inhalt, Antwortinhalt, rohe Diagnosekennungen,
Auth-Token oder lokale Pfade enthält.

Um beide Observability-Smokes direkt nacheinander auszuführen, verwenden Sie:

```bash
pnpm qa:observability:smoke
```

Für die Collector-gestützte OpenTelemetry-Lane plus den geschützten
Prometheus-Scrape-Smoke verwenden Sie:

```bash
pnpm qa:observability:collector-smoke
```

Observability-QA bleibt ausschließlich Source-Checkout-basiert. Der npm-Tarball
lässt QA Lab absichtlich aus, daher führen Package-Docker-Release-Lanes keine
`qa`-Befehle aus. Verwenden Sie `pnpm qa:otel:smoke`,
`pnpm qa:prometheus:smoke` oder `pnpm qa:observability:smoke` aus einem
gebauten Source-Checkout, wenn Sie Diagnoseinstrumentierung ändern.

Für eine transportechte Matrix-Smoke-Lane, die keine Modell-Provider-Anmeldedaten
erfordert, führen Sie das schnelle Profil mit dem deterministischen Mock-OpenAI-Provider aus:

```bash
OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS=3000 \
  pnpm openclaw qa matrix --provider-mode mock-openai --profile fast --fail-fast
```

Für die Live-Frontier-Provider-Lane geben Sie OpenAI-kompatible Anmeldedaten
explizit an:

```bash
OPENCLAW_LIVE_OPENAI_KEY="${OPENAI_API_KEY}" \
OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS=3000 \
  pnpm openclaw qa matrix --provider-mode live-frontier --profile fast --fail-fast
```

Die vollständige CLI-Referenz, der Profil-/Szenariokatalog, die Umgebungsvariablen und das Artefaktlayout für diese Lane befinden sich in [Matrix-QA](/de/concepts/qa-matrix). Auf einen Blick: Sie stellt einen wegwerfbaren Tuwunel-Homeserver in Docker bereit, registriert temporäre Treiber-/SUT-/Beobachterbenutzer, führt das echte Matrix-Plugin in einem untergeordneten QA-Gateway aus, das auf diesen Transport beschränkt ist (kein `qa-channel`), und schreibt dann einen Markdown-Bericht, eine JSON-Zusammenfassung, ein Artefakt mit beobachteten Ereignissen und ein kombiniertes Ausgabelog unter `.artifacts/qa-e2e/matrix-<timestamp>/`.

Die Szenarien decken Transportverhalten ab, das Unit-Tests nicht Ende zu Ende belegen können: Mention-Gating, Allow-Bot-Richtlinien, Allowlists, Top-Level- und Thread-Antworten, DM-Routing, Reaktionsverarbeitung, Unterdrückung eingehender Bearbeitungen, Deduplizierung von Restart-Replays, Wiederherstellung nach Homeserver-Unterbrechungen, Zustellung von Approval-Metadaten, Medienverarbeitung sowie Bootstrap-/Wiederherstellungs-/Verifizierungsabläufe für Matrix E2EE. Das E2EE-CLI-Profil führt außerdem `openclaw matrix encryption setup` und Verifizierungsbefehle über denselben wegwerfbaren Homeserver aus, bevor Gateway-Antworten geprüft werden.

Discord hat außerdem Mantis-only-Opt-in-Szenarien für Bug-Reproduktionen.
Verwenden Sie `--scenario discord-status-reactions-tool-only` für die explizite
Statusreaktions-Zeitleiste oder `--scenario discord-thread-reply-filepath-attachment`,
um einen echten Discord-Thread zu erstellen und zu verifizieren, dass
`message.thread-reply` einen `filePath`-Anhang beibehält. Diese Szenarien bleiben
außerhalb der standardmäßigen Live-Discord-Lane, weil sie Vorher-/Nachher-Reprobes
und keine breite Smoke-Abdeckung sind. Der Mantis-Workflow für Thread-Anhänge kann
außerdem ein Zeugen-Video aus einem angemeldeten Discord Web hinzufügen, wenn
`MANTIS_DISCORD_VIEWER_CHROME_PROFILE_DIR` oder
`MANTIS_DISCORD_VIEWER_CHROME_PROFILE_TGZ_B64` in der QA-Umgebung konfiguriert ist.
Dieses Viewer-Profil dient nur der visuellen Erfassung; die Pass/Fail-Entscheidung
kommt weiterhin vom Discord-REST-Oracle.

CI verwendet dieselbe Befehlsoberfläche in `.github/workflows/qa-live-transports-convex.yml`.
Geplante und standardmäßige manuelle Läufe führen das schnelle Matrix-Profil mit
QA-bereitgestellten Live-Frontier-Anmeldedaten, `--fast` und
`OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS=3000` aus. Manuelles `matrix_profile=all`
fächert in die fünf Profil-Shards auf.

Für transportechte Smoke-Lanes für Telegram, Discord, Slack und WhatsApp:

```bash
pnpm openclaw qa telegram
pnpm openclaw qa discord
pnpm openclaw qa slack
pnpm openclaw qa whatsapp
```

Sie zielen auf einen bereits vorhandenen echten Kanal mit zwei Bots oder Konten (Treiber + SUT). Erforderliche Umgebungsvariablen, Szenariolisten, Ausgabe-Artefakte und der Convex-Anmeldedatenpool sind unten in der [QA-Referenz für Telegram, Discord, Slack und WhatsApp](#telegram-discord-slack-and-whatsapp-qa-reference) dokumentiert.

Für einen vollständigen Slack-Desktop-VM-Lauf mit VNC-Rettung führen Sie aus:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

Dieser Befehl least eine Crabbox-Desktop-/Browser-Maschine, führt die Slack-Live-Lane
innerhalb der VM aus, öffnet Slack Web im VNC-Browser, erfasst den Desktop und
kopiert `slack-qa/`, `slack-desktop-smoke.png` und `slack-desktop-smoke.mp4`,
wenn Videoerfassung verfügbar ist, zurück in das Mantis-Artefaktverzeichnis.
Crabbox-Desktop-/Browser-Leases stellen die Erfassungstools und Hilfspakete für
Browser-/Native-Builds vorab bereit, daher sollte das Szenario Fallbacks nur auf
älteren Leases installieren. Mantis meldet Gesamt- und Phasenzeiten in
`mantis-slack-desktop-smoke-report.md`, sodass langsame Läufe zeigen, ob Zeit in
Lease-Warmup, Anmeldedatenbeschaffung, Remote-Setup oder Artefaktkopie geflossen ist.
Verwenden Sie `--lease-id <cbx_...>` nach der manuellen Anmeldung bei Slack Web über VNC
erneut; wiederverwendete Leases halten außerdem Crabboxs pnpm-Store-Cache warm.
Der Standardwert `--hydrate-mode source` verifiziert aus einem Source-Checkout und
führt Installation/Build innerhalb der VM aus. Verwenden Sie `--hydrate-mode prehydrated`
nur, wenn der wiederverwendete Remote-Workspace bereits `node_modules` und ein gebautes
`dist/` enthält; dieser Modus überspringt den teuren Installations-/Build-Schritt und
schlägt geschlossen fehl, wenn der Workspace nicht bereit ist. Mit `--gateway-setup`
lässt Mantis ein persistentes OpenClaw-Slack-Gateway innerhalb der VM auf Port `38973`
laufen; ohne diese Option führt der Befehl die normale Bot-zu-Bot-Slack-QA-Lane aus und
beendet sich nach der Artefakterfassung.

Um die native Slack-Approval-UI mit Desktop-Evidence zu belegen, führen Sie den
Mantis-Approval-Checkpoint-Modus aus:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --approval-checkpoints \
  --credential-source convex \
  --credential-role maintainer
```

Dieser Modus schließt sich gegenseitig mit `--gateway-setup` aus. Er führt die
Slack-Approval-Szenarien aus, lehnt Nicht-Approval-Szenario-IDs ab, wartet bei jedem
ausstehenden und aufgelösten Approval-Status, rendert die beobachtete Slack-API-Nachricht
nach `approval-checkpoints/<scenario>-pending.png` und
`approval-checkpoints/<scenario>-resolved.png` und schlägt dann fehl, wenn ein Checkpoint,
eine Nachrichtenevidenz, eine Bestätigung oder ein gerenderter Screenshot fehlt oder leer ist.
Kalte CI-Leases können in `slack-desktop-smoke.png` weiterhin die Slack-Anmeldung zeigen;
die Approval-Checkpoint-Bilder sind der visuelle Nachweis für diese Lane.

Die Operator-Checkliste, der GitHub-Workflow-Dispatch-Befehl, der Evidence-Comment-Vertrag,
die Hydrate-Mode-Entscheidungstabelle, die Timing-Interpretation und die Schritte zur
Fehlerbehandlung befinden sich im [Mantis Slack Desktop Runbook](/de/concepts/mantis-slack-desktop-runbook).

Für eine Desktop-Aufgabe im Agent-/CV-Stil führen Sie aus:

```bash
pnpm openclaw qa mantis visual-task \
  --browser-url https://example.net \
  --expect-text "Example Domain" \
  --vision-model openai/gpt-5.5
```

`visual-task` least oder verwendet eine Crabbox-Desktop-/Browser-Maschine wieder, startet
`crabbox record --while`, steuert den sichtbaren Browser über einen verschachtelten
`visual-driver`, erfasst `visual-task.png`, führt `openclaw infer image describe` gegen
den Screenshot aus, wenn `--vision-mode image-describe` ausgewählt ist, und schreibt
`visual-task.mp4`, `mantis-visual-task-summary.json`,
`mantis-visual-task-driver-result.json` und `mantis-visual-task-report.md`.
Wenn `--expect-text` gesetzt ist, fordert der Vision-Prompt ein strukturiertes JSON-Urteil
an und besteht nur, wenn das Modell positive sichtbare Evidenz meldet; eine negative Antwort,
die lediglich den Zieltext zitiert, lässt die Assertion fehlschlagen. Verwenden Sie
`--vision-mode metadata` für einen No-Model-Smoke, der Desktop-, Browser-, Screenshot-
und Video-Plumbing belegt, ohne einen Bildverständnis-Provider aufzurufen. Aufzeichnung ist
ein erforderliches Artefakt für `visual-task`; wenn Crabbox kein nicht leeres
`visual-task.mp4` aufzeichnet, schlägt die Aufgabe fehl, selbst wenn der Visual Driver
bestanden hat. Bei Fehlern behält Mantis die Lease für VNC, außer die Aufgabe hatte bereits
bestanden und `--keep-lease` war nicht gesetzt.

Bevor Sie gepoolte Live-Anmeldedaten verwenden, führen Sie aus:

```bash
pnpm openclaw qa credentials doctor
```

Der Doctor prüft die Convex-Broker-Umgebung, validiert Endpoint-Einstellungen und verifiziert die Admin-/Listen-Erreichbarkeit, wenn das Maintainer-Secret vorhanden ist. Für Secrets meldet er nur den Status gesetzt/fehlend.

## Live-Transport-Abdeckung

Live-Transport-Lanes teilen sich einen Vertrag, statt jeweils eine eigene Szenariolistenform zu erfinden. `qa-channel` ist die breite synthetische Suite für Produktverhalten und nicht Teil der Live-Transport-Abdeckungsmatrix.

Live-Transport-Runner sollten die gemeinsamen Szenario-IDs, Baseline-Abdeckungshelfer
und den Szenarioauswahlhelfer aus
`openclaw/plugin-sdk/qa-live-transport-scenarios` importieren.

| Lane     | Canary | Mention-Gating | Bot-zu-Bot | Allowlist-Block | Top-Level-Antwort | Zitatantwort | Restart-Fortsetzung | Thread-Follow-up | Thread-Isolation | Reaktionsbeobachtung | Hilfe-Befehl | Native Befehlsregistrierung |
| -------- | ------ | -------------- | ---------- | --------------- | ----------------- | ------------ | ------------------- | ---------------- | ---------------- | --------------------- | ------------ | ---------------------------- |
| Matrix   | x      | x              | x          | x               | x                 |              | x                   | x                | x                | x                     |              |                              |
| Telegram | x      | x              | x          |                 |                   |              |                     |                  |                  |                       | x            |                              |
| Discord  | x      | x              | x          |                 |                   |              |                     |                  |                  |                       |              | x                            |
| Slack    | x      | x              | x          | x               | x                 |              | x                   | x                | x                |                       |              |                              |
| WhatsApp | x      | x              |            | x               | x                 | x            | x                   |                  |                  | x                     | x            |                              |

Damit bleibt `qa-channel` die breite Suite für Produktverhalten, während Matrix,
Telegram und andere Live-Transporte eine gemeinsame explizite Checkliste für den
Transportvertrag teilen.

Für eine wegwerfbare Linux-VM-Lane, ohne Docker in den QA-Pfad einzubringen, führen Sie aus:

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

Dies startet einen frischen Multipass-Gast, installiert Abhängigkeiten, baut OpenClaw
innerhalb des Gasts, führt `qa suite` aus und kopiert dann den normalen QA-Bericht und
die Zusammenfassung zurück nach `.artifacts/qa-e2e/...` auf dem Host.
Es verwendet dasselbe Szenarioauswahlverhalten wie `qa suite` auf dem Host wieder.
Host- und Multipass-Suite-Läufe führen mehrere ausgewählte Szenarien standardmäßig
parallel mit isolierten Gateway-Workern aus. `qa-channel` verwendet standardmäßig
Concurrency 4, begrenzt durch die Anzahl der ausgewählten Szenarien. Verwenden Sie
`--concurrency <count>`, um die Worker-Anzahl anzupassen, oder `--concurrency 1` für
serielle Ausführung. Verwenden Sie `--pack personal-agent`, um das Benchmark-Pack für
persönliche Assistenten auszuführen. Der Pack-Selector ist additiv mit wiederholten
`--scenario`-Flags: explizite Szenarien laufen zuerst, dann laufen Pack-Szenarien in
Pack-Reihenfolge mit entfernten Duplikaten. Verwenden Sie `--pack observability`, wenn
ein benutzerdefinierter QA-Runner bereits das OpenTelemetry-Collector-Setup bereitstellt
und die OpenTelemetry- und Prometheus-Diagnose-Smoke-Szenarien gemeinsam auswählen möchte.
Der Befehl beendet sich mit einem Nicht-Null-Code, wenn ein Szenario fehlschlägt.
Verwenden Sie `--allow-failures`, wenn Sie Artefakte ohne fehlschlagenden Exit-Code
erhalten möchten. Live-Läufe leiten die unterstützten QA-Auth-Eingaben weiter, die für
den Gast praktikabel sind: env-basierte Provider-Schlüssel, den QA-Live-Provider-Konfigurationspfad
und `CODEX_HOME`, wenn vorhanden. Halten Sie `--output-dir` unter dem Repo-Root, damit der
Gast über den gemounteten Workspace zurückschreiben kann.

## Telegram-, Discord-, Slack- und WhatsApp-QA-Referenz

Matrix hat wegen der Anzahl seiner Szenarien und der Docker-gestützten Homeserver-Bereitstellung eine [eigene Seite](/de/concepts/qa-matrix). Telegram, Discord, Slack und WhatsApp laufen gegen bereits vorhandene echte Transports, daher befindet sich ihre Referenz hier.

### Gemeinsame CLI-Flags

Diese Lanes registrieren sich über `extensions/qa-lab/src/live-transports/shared/live-transport-cli.ts` und akzeptieren dieselben Flags:

| Flag                                  | Standardwert                                      | Beschreibung                                                                                                                                                 |
| ------------------------------------- | ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `--scenario <id>`                     | -                                                 | Führt nur dieses Szenario aus. Wiederholbar.                                                                                                                 |
| `--output-dir <path>`                 | `<repo>/.artifacts/qa-e2e/<transport>-<timestamp>` | Ort, an dem Berichte, Zusammenfassungen, Nachweise, transportspezifische Artefakte und das Ausgabeprotokoll geschrieben werden. Relative Pfade werden gegen `--repo-root` aufgelöst. |
| `--repo-root <path>`                  | `process.cwd()`                                   | Repository-Stamm, wenn aus einem neutralen cwd aufgerufen wird.                                                                                              |
| `--sut-account <id>`                  | `sut`                                             | Temporäre Konto-ID in der QA-Gateway-Konfiguration.                                                                                                          |
| `--provider-mode <mode>`              | `live-frontier`                                   | `mock-openai` oder `live-frontier` (das Legacy-`live-openai` funktioniert weiterhin).                                                                         |
| `--model <ref>` / `--alt-model <ref>` | Provider-Standard                                 | Primäre/alternative Modellreferenzen.                                                                                                                        |
| `--fast`                              | aus                                               | Schneller Provider-Modus, sofern unterstützt.                                                                                                                |
| `--credential-source <env\|convex>`   | `env`                                             | Siehe [Convex-Anmeldeinformationspool](#convex-credential-pool).                                                                                             |
| `--credential-role <maintainer\|ci>`  | `ci` in CI, sonst `maintainer`                    | Rolle, die verwendet wird, wenn `--credential-source convex` gesetzt ist.                                                                                     |

Jede Lane beendet sich bei jedem fehlgeschlagenen Szenario mit einem von null verschiedenen Code. `--allow-failures` schreibt Artefakte, ohne einen fehlgeschlagenen Exit-Code zu setzen.

### Telegram-QA

```bash
pnpm openclaw qa telegram
```

Zielt auf eine echte private Telegram-Gruppe mit zwei unterschiedlichen Bots (Driver + SUT). Der SUT-Bot muss einen Telegram-Benutzernamen haben; Bot-zu-Bot-Beobachtung funktioniert am besten, wenn beide Bots in `@BotFather` den **Bot-to-Bot Communication Mode** aktiviert haben.

Erforderliche env bei `--credential-source env`:

- `OPENCLAW_QA_TELEGRAM_GROUP_ID` - numerische Chat-ID (String).
- `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`

Szenarien (`extensions/qa-lab/src/live-transports/telegram/telegram-live.runtime.ts`):

- `telegram-canary`
- `telegram-mention-gating`
- `telegram-mentioned-message-reply`
- `telegram-help-command`
- `telegram-commands-command`
- `telegram-tools-compact-command`
- `telegram-whoami-command`
- `telegram-status-command`
- `telegram-repeated-command-authorization`
- `telegram-other-bot-command-gating`
- `telegram-context-command`
- `telegram-current-session-status-tool`
- `telegram-reply-chain-exact-marker`
- `telegram-stream-final-single-message`
- `telegram-long-final-reuses-preview`
- `telegram-long-final-three-chunks`

Der implizite Standardsatz deckt immer Canary, Mention-Gating, native Befehlsantworten, Befehlsadressierung und Bot-zu-Bot-Gruppenantworten ab. `mock-openai`-Standards enthalten außerdem deterministische Prüfungen für Antwortketten und Final-Message-Streaming. `telegram-current-session-status-tool` bleibt optional, weil es nur stabil ist, wenn es direkt nach Canary in einem Thread ausgeführt wird, nicht nach beliebigen nativen Befehlsantworten. Verwenden Sie `pnpm openclaw qa telegram --list-scenarios --provider-mode mock-openai`, um die aktuelle Standard-/optionale Aufteilung mit Regressionsreferenzen auszugeben.

Ausgabeartefakte:

- `telegram-qa-report.md`
- `qa-evidence.json` - Nachweiseinträge für die Live-Transport-Prüfungen, einschließlich Profil-, Abdeckungs-, Provider-, Kanal-, Artefakt-, Ergebnis- und RTT-Feldern.

Paket-Telegram-Läufe verwenden denselben Telegram-Anmeldeinformationsvertrag. Wiederholte RTT-Messung ist Teil der normalen Paket-Telegram-Live-Lane; die RTT-Verteilung wird für die ausgewählte RTT-Prüfung in `qa-evidence.json` unter `result.timing` eingebettet.

```bash
OPENCLAW_QA_CREDENTIAL_SOURCE=convex \
pnpm test:docker:npm-telegram-live
```

Wenn `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` gesetzt ist, least der Paket-Live-Wrapper eine `kind: "telegram"`-Anmeldeinformation, exportiert die geleasten Gruppen-/Driver-/SUT-Bot-env in den installierten Paketlauf, sendet Heartbeats für das Lease und gibt es beim Herunterfahren frei. Der Paket-Wrapper verwendet standardmäßig 20 RTT-Prüfungen von `telegram-mentioned-message-reply`, ein RTT-Timeout von 30 s und außerhalb von CI die Convex-Rolle `maintainer`, wenn Convex ausgewählt ist. Überschreiben Sie `OPENCLAW_NPM_TELEGRAM_RTT_SAMPLES`, `OPENCLAW_NPM_TELEGRAM_RTT_TIMEOUT_MS` oder `OPENCLAW_NPM_TELEGRAM_RTT_MAX_FAILURES`, um die RTT-Messung anzupassen, ohne einen separaten RTT-Befehl oder ein Telegram-spezifisches Zusammenfassungsformat zu erstellen.

### Discord-QA

```bash
pnpm openclaw qa discord
```

Zielt auf einen echten privaten Discord-Guild-Kanal mit zwei Bots: einen vom Harness gesteuerten Driver-Bot und einen SUT-Bot, der durch das untergeordnete OpenClaw-Gateway über das gebündelte Discord-Plugin gestartet wird. Prüft die Behandlung von Kanal-Mentions, dass der SUT-Bot den nativen `/help`-Befehl bei Discord registriert hat, sowie optionale Mantis-Nachweisszenarien.

Erforderliche env bei `--credential-source env`:

- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID` - muss der von Discord zurückgegebenen Benutzer-ID des SUT-Bots entsprechen (andernfalls schlägt die Lane schnell fehl).

Optional:

- `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1` behält Nachrichtentexte in Artefakten beobachteter Nachrichten bei.
- `OPENCLAW_QA_DISCORD_VOICE_CHANNEL_ID` wählt den Voice-/Stage-Kanal für `discord-voice-autojoin` aus; ohne diesen Wert wählt das Szenario den ersten für den SUT-Bot sichtbaren Voice-/Stage-Kanal aus.

Szenarien (`extensions/qa-lab/src/live-transports/discord/discord-live.runtime.ts:36`):

- `discord-canary`
- `discord-mention-gating`
- `discord-native-help-command-registration`
- `discord-voice-autojoin` - optionales Voice-Szenario. Läuft eigenständig, aktiviert `channels.discord.voice.autoJoin` und prüft, dass der aktuelle Discord-Voice-State des SUT-Bots der Ziel-Voice-/Stage-Kanal ist. Convex-Discord-Anmeldeinformationen können optional `voiceChannelId` enthalten; andernfalls ermittelt der Runner den ersten sichtbaren Voice-/Stage-Kanal in der Guild.
- `discord-status-reactions-tool-only` - optionales Mantis-Szenario. Läuft eigenständig, weil es die SUT mit `messages.statusReactions.enabled=true` auf Always-on-Guild-Antworten nur mit Tools umstellt, und erfasst anschließend eine REST-Reaktions-Timeline sowie visuelle HTML/PNG-Artefakte. Mantis-Vorher/Nachher-Berichte bewahren außerdem szenariobereitgestellte MP4-Artefakte als `baseline.mp4` und `candidate.mp4` auf.

Führen Sie das Discord-Voice-Auto-Join-Szenario explizit aus:

```bash
pnpm openclaw qa discord \
  --scenario discord-voice-autojoin \
  --provider-mode mock-openai
```

Führen Sie das Mantis-Status-Reaction-Szenario explizit aus:

```bash
pnpm openclaw qa discord \
  --scenario discord-status-reactions-tool-only \
  --provider-mode live-frontier \
  --model openai/gpt-5.5 \
  --alt-model openai/gpt-5.5 \
  --fast
```

Ausgabeartefakte:

- `discord-qa-report.md`
- `qa-evidence.json` - Nachweiseinträge für die Live-Transport-Prüfungen.
- `discord-qa-observed-messages.json` - Texte werden redigiert, außer `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1` ist gesetzt.
- `discord-qa-reaction-timelines.json` und `discord-status-reactions-tool-only-timeline.png`, wenn das Status-Reaction-Szenario läuft.

### Slack-QA

```bash
pnpm openclaw qa slack
```

Zielt auf einen echten privaten Slack-Kanal mit zwei unterschiedlichen Bots: einen vom Harness gesteuerten Driver-Bot und einen SUT-Bot, der durch das untergeordnete OpenClaw-Gateway über das gebündelte Slack-Plugin gestartet wird.

Erforderliche env bei `--credential-source env`:

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`

Optional:

- `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1` behält Nachrichtentexte in Artefakten beobachteter Nachrichten bei.
- `OPENCLAW_QA_SLACK_APPROVAL_CHECKPOINT_DIR` aktiviert visuelle Approval-Checkpoints für Mantis. Der Runner schreibt `<scenario>.pending.json` und `<scenario>.resolved.json` und wartet dann auf passende `.ack.json`-Dateien.
- `OPENCLAW_QA_SLACK_APPROVAL_CHECKPOINT_TIMEOUT_MS` überschreibt das Timeout für die Checkpoint-Bestätigung. Der Standardwert ist `120000`.

Szenarien (`extensions/qa-lab/src/live-transports/slack/slack-live.runtime.ts`):

- `slack-canary`
- `slack-mention-gating`
- `slack-allowlist-block`
- `slack-top-level-reply-shape`
- `slack-restart-resume`
- `slack-thread-follow-up`
- `slack-thread-isolation`
- `slack-approval-exec-native` - optionales natives Slack-Exec-Approval-Szenario. Fordert über das Gateway ein Exec-Approval an, prüft, dass die Slack-Nachricht native Approval-Buttons hat, löst sie auf und prüft das aufgelöste Slack-Update.
- `slack-approval-plugin-native` - optionales natives Slack-Plugin-Approval-Szenario. Aktiviert Exec- und Plugin-Approval-Weiterleitung gemeinsam, damit Plugin-Ereignisse nicht durch Exec-Approval-Routing unterdrückt werden, und prüft dann denselben ausstehenden/aufgelösten nativen Slack-UI-Pfad.

Ausgabeartefakte:

- `slack-qa-report.md`
- `qa-evidence.json` - Nachweiseinträge für die Live-Transport-Prüfungen.
- `slack-qa-observed-messages.json` - Texte werden redigiert, außer `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1` ist gesetzt.
- `approval-checkpoints/` - nur wenn Mantis `OPENCLAW_QA_SLACK_APPROVAL_CHECKPOINT_DIR` setzt; enthält Checkpoint-JSON, Bestätigungs-JSON und Screenshots für ausstehend/aufgelöst.

#### Slack-Workspace einrichten

Die Lane benötigt zwei unterschiedliche Slack-Apps in einem Workspace sowie einen Kanal, in dem beide Bots Mitglieder sind:

- `channelId` - die `Cxxxxxxxxxx`-ID eines Kanals, in den beide Bots eingeladen wurden. Verwenden Sie einen dedizierten Kanal; die Lane postet bei jedem Lauf.
- `driverBotToken` - Bot-Token (`xoxb-...`) der **Driver**-App.
- `sutBotToken` - Bot-Token (`xoxb-...`) der **SUT**-App, die eine separate Slack-App vom Driver sein muss, damit ihre Bot-Benutzer-ID unterschiedlich ist.
- `sutAppToken` - App-Level-Token (`xapp-...`) der SUT-App mit `connections:write`, der von Socket Mode verwendet wird, damit die SUT-App Ereignisse empfangen kann.

Bevorzugen Sie einen Slack-Workspace, der QA gewidmet ist, gegenüber der Wiederverwendung eines Produktions-Workspace.

Das folgende SUT-Manifest beschränkt die Produktionsinstallation des gebündelten Slack-Plugins (`extensions/slack/src/setup-shared.ts:10`) bewusst auf die Berechtigungen und Ereignisse, die von der Live-Slack-QA-Suite abgedeckt werden. Informationen zur Einrichtung des Produktionskanals, wie Benutzer sie sehen, finden Sie unter [Slack-Kanal-Schnelleinrichtung](/de/channels/slack#quick-setup); das QA-Driver/SUT-Paar ist bewusst getrennt, weil die Lane zwei unterschiedliche Bot-Benutzer-IDs in einem Workspace benötigt.

**1. Erstellen Sie die Driver-App**

Gehen Sie zu [api.slack.com/apps](https://api.slack.com/apps) → _Create New App_ → _From a manifest_ → wählen Sie den QA-Workspace aus, fügen Sie das folgende Manifest ein und dann _Install to Workspace_:

```json
{
  "display_information": {
    "name": "OpenClaw QA Driver",
    "description": "Test driver bot for OpenClaw QA Slack live lane"
  },
  "features": {
    "bot_user": {
      "display_name": "OpenClaw QA Driver",
      "always_online": true
    }
  },
  "oauth_config": {
    "scopes": {
      "bot": ["chat:write", "channels:history", "groups:history", "users:read"]
    }
  },
  "settings": {
    "socket_mode_enabled": false
  }
}
```

Kopieren Sie das _Bot User OAuth Token_ (`xoxb-...`) - daraus wird `driverBotToken`. Der Treiber muss nur Nachrichten posten und sich selbst identifizieren; keine Events, kein Socket Mode.

**2. Erstellen Sie die SUT-App**

Wiederholen Sie _Create New App → From a manifest_ im selben Workspace. Diese QA-App verwendet absichtlich eine schmalere Version des Produktionsmanifests des gebündelten Slack-Plugins (`extensions/slack/src/setup-shared.ts:10`): Reaktions-Scopes und Events werden weggelassen, weil die Live-Slack-QA-Suite die Reaktionsverarbeitung noch nicht abdeckt.

```json
{
  "display_information": {
    "name": "OpenClaw QA SUT",
    "description": "OpenClaw QA SUT connector for OpenClaw"
  },
  "features": {
    "bot_user": {
      "display_name": "OpenClaw QA SUT",
      "always_online": true
    },
    "app_home": {
      "home_tab_enabled": true,
      "messages_tab_enabled": true,
      "messages_tab_read_only_enabled": false
    }
  },
  "oauth_config": {
    "scopes": {
      "bot": [
        "app_mentions:read",
        "assistant:write",
        "channels:history",
        "channels:read",
        "chat:write",
        "commands",
        "emoji:read",
        "files:read",
        "files:write",
        "groups:history",
        "groups:read",
        "im:history",
        "im:read",
        "im:write",
        "mpim:history",
        "mpim:read",
        "mpim:write",
        "pins:read",
        "pins:write",
        "usergroups:read",
        "users:read"
      ]
    }
  },
  "settings": {
    "socket_mode_enabled": true,
    "event_subscriptions": {
      "bot_events": [
        "app_home_opened",
        "app_mention",
        "channel_rename",
        "member_joined_channel",
        "member_left_channel",
        "message.channels",
        "message.groups",
        "message.im",
        "message.mpim",
        "pin_added",
        "pin_removed"
      ]
    }
  }
}
```

Nachdem Slack die App erstellt hat, führen Sie auf ihrer Einstellungsseite zwei Schritte aus:

- _Install to Workspace_ → kopieren Sie das _Bot User OAuth Token_ → daraus wird `sutBotToken`.
- _Basic Information → App-Level Tokens → Generate Token and Scopes_ → fügen Sie den Scope `connections:write` hinzu → speichern → kopieren Sie den Wert `xapp-...` → daraus wird `sutAppToken`.

Prüfen Sie, ob die beiden Bots unterschiedliche Benutzer-IDs haben, indem Sie `auth.test` für jedes Token aufrufen. Die Runtime unterscheidet Treiber und SUT anhand der Benutzer-ID; die Wiederverwendung einer App für beide führt sofort dazu, dass das Mention-Gating fehlschlägt.

**3. Erstellen Sie den Kanal**

Erstellen Sie im QA-Workspace einen Kanal (z. B. `#openclaw-qa`) und laden Sie beide Bots aus dem Kanal heraus ein:

```
/invite @OpenClaw QA Driver
/invite @OpenClaw QA SUT
```

Kopieren Sie die ID `Cxxxxxxxxxx` aus _channel info → About → Channel ID_ - daraus wird `channelId`. Ein öffentlicher Kanal funktioniert; wenn Sie einen privaten Kanal verwenden, haben beide Apps bereits `groups:history`, sodass die History-Lesevorgänge des Harness weiterhin erfolgreich sind.

**4. Registrieren Sie die Zugangsdaten**

Es gibt zwei Optionen. Verwenden Sie Umgebungsvariablen für das Debugging auf einem einzelnen Rechner (setzen Sie die vier Variablen `OPENCLAW_QA_SLACK_*` und übergeben Sie `--credential-source env`), oder befüllen Sie den gemeinsamen Convex-Pool, damit CI und andere Maintainer sie leasen können.

Schreiben Sie für den Convex-Pool die vier Felder in eine JSON-Datei:

```json
{
  "channelId": "Cxxxxxxxxxx",
  "driverBotToken": "xoxb-...",
  "sutBotToken": "xoxb-...",
  "sutAppToken": "xapp-..."
}
```

Wenn `OPENCLAW_QA_CONVEX_SITE_URL` und `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` in Ihrer Shell exportiert sind, registrieren und prüfen Sie:

```bash
pnpm openclaw qa credentials add \
  --kind slack \
  --payload-file slack-creds.json \
  --note "QA Slack pool seed"

pnpm openclaw qa credentials list --kind slack --status all --json
```

Erwarten Sie `count: 1`, `status: "active"`, kein Feld `lease`.

**5. Verifizieren Sie Ende-zu-Ende**

Führen Sie die Lane lokal aus, um zu bestätigen, dass beide Bots über den Broker miteinander kommunizieren können:

```bash
pnpm openclaw qa slack \
  --credential-source convex \
  --credential-role maintainer \
  --output-dir .artifacts/qa-e2e/slack-local
```

Ein erfolgreicher Lauf ist in deutlich unter 30 Sekunden abgeschlossen, und `slack-qa-report.md` zeigt sowohl `slack-canary` als auch `slack-mention-gating` mit Status `pass`. Wenn die Lane etwa 90 Sekunden hängt und mit `Convex credential pool exhausted for kind "slack"` beendet wird, ist entweder der Pool leer oder jede Zeile ist geleast - `qa credentials list --kind slack --status all --json` zeigt Ihnen, welcher Fall vorliegt.

### WhatsApp-QA

```bash
pnpm openclaw qa whatsapp
```

Zielt auf zwei dedizierte WhatsApp-Web-Konten: ein vom Harness gesteuertes Treiberkonto und ein SUT-Konto, das vom untergeordneten OpenClaw-Gateway über das gebündelte WhatsApp-Plugin gestartet wird.

Erforderliche Umgebungsvariablen bei `--credential-source env`:

- `OPENCLAW_QA_WHATSAPP_DRIVER_PHONE_E164`
- `OPENCLAW_QA_WHATSAPP_SUT_PHONE_E164`
- `OPENCLAW_QA_WHATSAPP_DRIVER_AUTH_ARCHIVE_BASE64`
- `OPENCLAW_QA_WHATSAPP_SUT_AUTH_ARCHIVE_BASE64`

Optional:

- `OPENCLAW_QA_WHATSAPP_GROUP_JID` aktiviert Gruppenszenarien wie
  `whatsapp-mention-gating`, `whatsapp-group-pending-history-context`,
  `whatsapp-broadcast-group-fanout`, `whatsapp-group-activation-always`,
  `whatsapp-group-reply-to-bot-triggers`, Gruppenaktions-/Medien-/Umfrage-Szenarien und
  `whatsapp-group-allowlist-block`.
- `OPENCLAW_QA_WHATSAPP_CAPTURE_CONTENT=1` behält Nachrichtentexte in
  beobachteten Nachrichtenartefakten bei.

Szenariokatalog (`extensions/qa-lab/src/live-transports/whatsapp/whatsapp-live.runtime.ts`):

- Baseline und Gruppen-Gating: `whatsapp-canary`, `whatsapp-pairing-block`,
  `whatsapp-mention-gating`, `whatsapp-group-pending-history-context`,
  `whatsapp-group-activation-always`,
  `whatsapp-group-reply-to-bot-triggers`,
  `whatsapp-top-level-reply-shape`, `whatsapp-restart-resume`,
  `whatsapp-group-allowlist-block`.
- Native Befehle: `whatsapp-help-command`, `whatsapp-status-command`,
  `whatsapp-commands-command`, `whatsapp-tools-compact-command`,
  `whatsapp-whoami-command`, `whatsapp-context-command`,
  `whatsapp-native-new-command`.
- Antwort- und Endausgabe-Verhalten: `whatsapp-tool-only-usage-footer`,
  `whatsapp-reply-to-message`, `whatsapp-group-reply-to-message`,
  `whatsapp-reply-to-mode-batched`, `whatsapp-reply-context-isolation`,
  `whatsapp-reply-delivery-shape`, `whatsapp-stream-final-message-accounting`.
- Nachrichtenaktionen im Benutzerpfad: `whatsapp-agent-message-action-react` beginnt mit
  einer echten Treiber-DM, lässt das Modell das Tool `message` aufrufen und beobachtet die
  native WhatsApp-Reaktion. `whatsapp-agent-message-action-upload-file` verwendet
  dieselbe Haltung für `message(action=upload-file)` und beobachtet native
  WhatsApp-Medien. `whatsapp-group-agent-message-action-react` und
  `whatsapp-group-agent-message-action-upload-file` belegen dieselben benutzersichtbaren
  Aktionen in einer echten WhatsApp-Gruppe.
- Gruppen-Fanout: `whatsapp-broadcast-group-fanout` beginnt mit einer erwähnten
  WhatsApp-Gruppennachricht und verifiziert unterschiedliche sichtbare Antworten von `main` und
  `qa-second`.
- Gruppenaktivierung: `whatsapp-group-activation-always` ändert eine echte Gruppensitzung
  in `/activation always`, belegt, dass eine nicht erwähnte Gruppennachricht
  den Agenten weckt, und stellt dann `/activation mention` wieder her. `whatsapp-group-reply-to-bot-triggers`
  setzt eine Bot-Antwort, sendet eine native zitierte Antwort darauf ohne explizite
  Erwähnung und verifiziert, dass der Agent aus diesem Antwortkontext geweckt wird.
- Eingehende Medien und strukturierte Nachrichten: `whatsapp-inbound-image-caption`,
  `whatsapp-audio-preflight`, `whatsapp-inbound-structured-messages`,
  `whatsapp-group-audio-gating`, `whatsapp-inbound-reaction-no-trigger`.
  Diese senden echte WhatsApp-Bild-, Audio-, Dokument-, Standort-, Kontakt-, Sticker-
  und Reaktions-Events über den Treiber.
- Direkte Gateway-Vertragssonden:
  `whatsapp-outbound-media-matrix`,
  `whatsapp-outbound-document-preserves-filename`, `whatsapp-outbound-poll`,
  `whatsapp-group-outbound-media`, `whatsapp-group-outbound-poll`,
  `whatsapp-message-actions`, `whatsapp-reply-context-isolation`,
  `whatsapp-reply-delivery-shape`. Diese umgehen Modell-Prompting absichtlich und
  belegen deterministische Gateway-/Kanal-Verträge für `send`, `poll` und `message.action`.
- Abdeckung der Zugriffskontrolle: `whatsapp-access-control-dm-open`,
  `whatsapp-access-control-dm-disabled`, `whatsapp-access-control-group-open`,
  `whatsapp-access-control-group-disabled`, `whatsapp-group-allowlist-block`.
- Native Genehmigungen: `whatsapp-approval-exec-deny-native`,
  `whatsapp-approval-exec-native`, `whatsapp-approval-exec-reaction-native`,
  `whatsapp-approval-exec-group-reaction-native`,
  `whatsapp-approval-plugin-native`.
- Statusreaktionen: `whatsapp-status-reactions`,
  `whatsapp-status-reaction-lifecycle`.

Der Katalog enthält derzeit 50 Szenarien. Die Standard-Lane `live-frontier` ist
für schnelle Smoke-Abdeckung klein gehalten und umfasst 10 Szenarien. Die Standard-Lane
`mock-openai` führt 44 deterministische Szenarien über den echten WhatsApp-Transport aus und
mockt nur die Modellausgabe. Genehmigungsszenarien und einige schwerere/blockierende Prüfungen
bleiben explizit über die Szenario-ID auswählbar.

Der WhatsApp-QA-Treiber beobachtet strukturierte Live-Events (`text`, `media`,
`location`, `reaction` und `poll`) und kann aktiv Medien, Umfragen,
Kontakte, Standorte und Sticker senden. QA Lab importiert diesen Treiber über die
Paketoberfläche `@openclaw/whatsapp/api.js`, statt in private
WhatsApp-Runtime-Dateien zu greifen. Für Gruppenbeobachtungen ist `fromJid` die Gruppen-JID, während
`participantJid` und `fromPhoneE164` den teilnehmenden Absender identifizieren. Nachrichteninhalte
werden standardmäßig redigiert. Direkte Gateway-
Umfrage-, Upload-file-, Medien-, Gruppenumfrage-, Gruppenmedien- und Antwortform-Sonden sind Transport-/API-Vertragsprüfungen; sie werden nicht als Beleg dafür behandelt, dass eine Benutzeranfrage den Agenten dazu gebracht hat,
dieselbe Aktion auszuwählen. Belege für Aktionen im Benutzerpfad stammen aus Szenarien wie
`whatsapp-agent-message-action-react` und
`whatsapp-group-agent-message-action-react`, bei denen der Treiber eine normale
WhatsApp-Nachricht sendet und QA Lab das resultierende native WhatsApp-Artefakt beobachtet.
WhatsApp-Berichte enthalten die Haltung jedes Szenarios (`user-path`, `direct-gateway`
oder `native-approval`), damit Evidenz nicht mit einem stärkeren Vertrag verwechselt werden kann,
als sie tatsächlich belegt.

Ausgabeartefakte:

- `whatsapp-qa-report.md`
- `qa-evidence.json` - Evidenzeinträge für die Live-Transport-Prüfungen.
- `whatsapp-qa-observed-messages.json` - Texte redigiert, außer `OPENCLAW_QA_WHATSAPP_CAPTURE_CONTENT=1`.

### Convex-Zugangsdatenpool

Telegram-, Discord-, Slack- und WhatsApp-Lanes können Zugangsdaten aus einem gemeinsamen Convex-Pool leasen, statt die oben genannten Umgebungsvariablen zu lesen. Übergeben Sie `--credential-source convex` (oder setzen Sie `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`); QA Lab erwirbt ein exklusives Lease, sendet dafür Heartbeats für die Dauer des Laufs und gibt es beim Herunterfahren frei. Pool-Arten sind `"telegram"`, `"discord"`, `"slack"` und `"whatsapp"`.

Payload-Formen, die der Broker bei `admin/add` validiert:

- Telegram (`kind: "telegram"`): `{ groupId: string, driverToken: string, sutToken: string }` - `groupId` muss ein numerischer Chat-ID-String sein.
- Echter Telegram-Benutzer (`kind: "telegram-user"`): `{ groupId: string, sutToken: string, testerUserId: string, testerUsername: string, telegramApiId: string, telegramApiHash: string, tdlibDatabaseEncryptionKey: string, tdlibArchiveBase64: string, tdlibArchiveSha256: string, desktopTdataArchiveBase64: string, desktopTdataArchiveSha256: string }` - nur Mantis Telegram Desktop-Nachweis. Generische QA Lab-Lanes dürfen diese Art nicht anfordern.
- Discord (`kind: "discord"`): `{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string }`.
- WhatsApp (`kind: "whatsapp"`): `{ driverPhoneE164: string, sutPhoneE164: string, driverAuthArchiveBase64: string, sutAuthArchiveBase64: string, groupJid?: string }` - Telefonnummern müssen unterschiedliche E.164-Strings sein.

Der Mantis Telegram Desktop-Nachweis-Workflow hält eine exklusive Convex-`telegram-user`-Lease sowohl für den TDLib-CLI-Treiber als auch für den Telegram Desktop-Zeugen und gibt sie anschließend nach dem Veröffentlichen des Nachweises frei.

Wenn ein PR einen deterministischen visuellen Diff benötigt, kann Mantis dieselbe Mock-Modellantwort auf `main` und auf dem PR-Head verwenden, während sich der Telegram-Formatter oder die Zustellschicht ändert. Die Capture-Standards sind auf PR-Kommentare abgestimmt: Standard-Crabbox-Klasse, 24-fps-Desktop-Aufzeichnung, 24-fps-Bewegungs-GIF und 1920-px-Vorschaubreite. Vorher-/Nachher-Kommentare sollten ein sauberes Bundle veröffentlichen, das nur die vorgesehenen GIFs enthält.

Slack-Lanes können ebenfalls den Pool verwenden. Slack-Payload-Shape-Prüfungen liegen derzeit im Slack-QA-Runner statt im Broker; verwenden Sie `{ channelId: string, driverBotToken: string, sutBotToken: string, sutAppToken: string }` mit einer Slack-Kanal-ID wie `Cxxxxxxxxxx`. Siehe [Slack-Workspace einrichten](#setting-up-the-slack-workspace) für App- und Scope-Bereitstellung.

Operative Umgebungsvariablen und der Convex-Broker-Endpunktvertrag befinden sich in [Testing → Gemeinsame Telegram-Anmeldedaten über Convex](/de/help/testing#shared-telegram-credentials-via-convex-v1) (der Abschnittsname stammt aus der Zeit vor dem Mehrkanal-Pool; die Lease-Semantik wird über alle Arten hinweg geteilt).

## Repo-gestützte Seeds

Seed-Assets befinden sich in `qa/`:

- `qa/scenarios/index.yaml`
- `qa/scenarios/<theme>/*.yaml`

Diese liegen absichtlich in Git, damit der QA-Plan sowohl für Menschen als auch für den Agent sichtbar ist.

`qa-lab` sollte ein generischer YAML-Szenario-Runner bleiben. Jede Szenario-YAML-Datei ist die maßgebliche Quelle für einen Testlauf und sollte definieren:

- `title` auf oberster Ebene
- `scenario`-Metadaten
- optionale Kategorie-, Capability-, Lane- und Risikometadaten in `scenario`
- Dokumentations- und Code-Referenzen in `scenario`
- optionale Plugin-Anforderungen in `scenario`
- optionaler Gateway-Konfigurations-Patch in `scenario`
- ausführbares `flow` auf oberster Ebene für Flow-Szenarien oder `scenario.execution.kind` /
  `scenario.execution.path` für Vitest- und Playwright-Szenarien

Die wiederverwendbare Runtime-Oberfläche, die `flow` unterstützt, darf generisch und übergreifend bleiben. YAML-Szenarien können beispielsweise transportseitige Hilfen mit browserseitigen Hilfen kombinieren, die die eingebettete Control UI über den Gateway-`browser.request`-Seam steuern, ohne einen Sonderfall-Runner hinzuzufügen.

Szenariodateien sollten nach Produkt-Capability statt nach Source-Tree-Ordner gruppiert werden. Halten Sie Szenario-IDs stabil, wenn Dateien verschoben werden; verwenden Sie `docsRefs` und `codeRefs` für die Implementierungsnachverfolgbarkeit.

Die Baseline-Liste sollte breit genug bleiben, um Folgendes abzudecken:

- DM- und Kanal-Chat
- Thread-Verhalten
- Lebenszyklus von Nachrichtenaktionen
- Cron-Callbacks
- Speicherabruf
- Modellwechsel
- Subagent-Übergabe
- Repo-Lesen und Dokumentationslesen
- eine kleine Build-Aufgabe wie Lobster Invaders

## Provider-Mock-Lanes

`qa suite` hat zwei lokale Provider-Mock-Lanes:

- `mock-openai` ist der szenariobewusste OpenClaw-Mock. Er bleibt die standardmäßige deterministische Mock-Lane für repo-gestützte QA und Paritäts-Gates.
- `aimock` startet einen AIMock-gestützten Provider-Server für experimentelle Protokoll-, Fixture-, Record/Replay- und Chaos-Abdeckung. Er ist additiv und ersetzt den `mock-openai`-Szenario-Dispatcher nicht.

Die Provider-Lane-Implementierung liegt unter `extensions/qa-lab/src/providers/`. Jeder Provider besitzt seine Standards, den Start des lokalen Servers, die Gateway-Modellkonfiguration, Anforderungen an das Staging von Auth-Profilen sowie Live-/Mock-Capability-Flags. Gemeinsamer Suite- und Gateway-Code sollte über die Provider-Registry routen, statt nach Provider-Namen zu verzweigen.

## Transportadapter

`qa-lab` besitzt einen generischen Transport-Seam für YAML-QA-Szenarien. `qa-channel` ist der synthetische Standard. `crabline` startet lokale Provider-förmige Server und führt die normalen Kanal-Plugins von OpenClaw dagegen aus. `live` ist für echte Provider-Anmeldedaten und externe Kanäle reserviert.

Auf Architekturebene lautet die Aufteilung:

- `qa-lab` besitzt generische Szenarioausführung, Worker-Parallelität, Artefaktschreibung und Reporting.
- Der Transportadapter besitzt Gateway-Konfiguration, Bereitschaft, eingehende und ausgehende Beobachtung, Transportaktionen und normalisierten Transportzustand.
- YAML-Szenariodateien unter `qa/scenarios/` definieren den Testlauf; `qa-lab` stellt die wiederverwendbare Runtime-Oberfläche bereit, die sie ausführt.

### Kanal hinzufügen

Das Hinzufügen eines Kanals zum YAML-QA-System erfordert die Kanalimplementierung sowie ein Szenariopaket, das den Kanalvertrag ausübt. Für Smoke-CI-Abdeckung fügen Sie den passenden lokalen Crabline-Provider-Server hinzu und stellen ihn über den `crabline`-Treiber bereit.

Fügen Sie keinen neuen QA-Befehlsstamm auf oberster Ebene hinzu, wenn der gemeinsame `qa-lab`-Host den Flow besitzen kann.

`qa-lab` besitzt die gemeinsame Host-Mechanik:

- den Befehlsstamm `openclaw qa`
- Start und Teardown der Suite
- Worker-Parallelität
- Artefaktschreibung
- Berichtserzeugung
- Szenarioausführung
- Kompatibilitätsaliasse für ältere `qa-channel`-Szenarien

Runner-Plugins besitzen den Transportvertrag:

- wie `openclaw qa <runner>` unterhalb des gemeinsamen `qa`-Stamms eingebunden wird
- wie das Gateway für diesen Transport konfiguriert wird
- wie die Bereitschaft geprüft wird
- wie eingehende Events injiziert werden
- wie ausgehende Nachrichten beobachtet werden
- wie Transkripte und normalisierter Transportzustand offengelegt werden
- wie transportgestützte Aktionen ausgeführt werden
- wie transportspezifisches Zurücksetzen oder Bereinigen gehandhabt wird

Die Mindestanforderung für die Einführung eines neuen Kanals:

1. Behalten Sie `qa-lab` als Besitzer des gemeinsamen `qa`-Stamms bei.
2. Implementieren Sie den Transport-Runner auf dem gemeinsamen `qa-lab`-Host-Seam.
3. Halten Sie transportspezifische Mechanik im Runner-Plugin oder Channel-Harness.
4. Binden Sie den Runner als `openclaw qa <runner>` ein, statt einen konkurrierenden Root-Befehl zu registrieren. Runner-Plugins sollten `qaRunners` in `openclaw.plugin.json` deklarieren und ein passendes `qaRunnerCliRegistrations`-Array aus `runtime-api.ts` exportieren. Halten Sie `runtime-api.ts` schlank; Lazy-CLI und Runner-Ausführung sollten hinter separaten Einstiegspunkten bleiben.
5. Erstellen oder adaptieren Sie YAML-Szenarien unter den thematischen `qa/scenarios/`-Verzeichnissen.
6. Verwenden Sie die generischen Szenariohilfen für neue Szenarien.
7. Halten Sie bestehende Kompatibilitätsaliasse funktionsfähig, sofern das Repo keine absichtliche Migration durchführt.

Die Entscheidungsregel ist streng:

- Wenn Verhalten einmal in `qa-lab` ausgedrückt werden kann, legen Sie es in `qa-lab` ab.
- Wenn Verhalten von einem Kanaltransport abhängt, behalten Sie es in diesem Runner-Plugin oder Plugin-Harness.
- Wenn ein Szenario eine neue Capability benötigt, die mehr als ein Kanal verwenden kann, fügen Sie eine generische Hilfe hinzu statt eines kanalspezifischen Branches in `suite.ts`.
- Wenn ein Verhalten nur für einen Transport sinnvoll ist, halten Sie das Szenario transportspezifisch und machen Sie dies im Szenariovertrag explizit.

### Namen von Szenariohilfen

Bevorzugte generische Hilfen für neue Szenarien:

- `waitForTransportReady`
- `waitForChannelReady`
- `injectInboundMessage`
- `injectOutboundMessage`
- `waitForTransportOutboundMessage`
- `waitForChannelOutboundMessage`
- `waitForNoTransportOutbound`
- `getTransportSnapshot`
- `readTransportMessage`
- `readTransportTranscript`
- `formatTransportTranscript`
- `resetTransport`

Kompatibilitätsaliasse bleiben für bestehende Szenarien verfügbar - `waitForQaChannelReady`, `waitForOutboundMessage`, `waitForNoOutbound`, `formatConversationTranscript`, `resetBus` -, aber neue Szenarioerstellung sollte die generischen Namen verwenden. Die Aliasse existieren, um eine Flag-Day-Migration zu vermeiden, nicht als Modell für die Zukunft.

## Reporting

`qa-lab` exportiert einen Markdown-Protokollbericht aus der beobachteten Bus-Timeline. Der Bericht sollte beantworten:

- Was funktioniert hat
- Was fehlgeschlagen ist
- Was blockiert blieb
- Welche Folgeszenarien sinnvoll hinzuzufügen sind

Für das Inventar verfügbarer Szenarien - nützlich beim Abschätzen von Folgearbeit oder beim Verdrahten eines neuen Transports - führen Sie `pnpm openclaw qa coverage` aus (fügen Sie `--json` für maschinenlesbare Ausgabe hinzu).
Wenn Sie fokussierten Nachweis für ein berührtes Verhalten oder einen Dateipfad auswählen, führen Sie `pnpm openclaw qa coverage --match <query>` aus.
Der Match-Bericht durchsucht Szenariometadaten, Dokumentationsreferenzen, Codereferenzen, Coverage-IDs, Plugins und Provider-Anforderungen und gibt dann passende `qa suite --scenario ...`-Ziele aus.
Jeder `qa suite`-Lauf schreibt Artefakte `qa-evidence.json`,
`qa-suite-summary.json` und `qa-suite-report.md` auf oberster Ebene für den ausgewählten
Szenariosatz. Szenarien, die `execution.kind: vitest` oder
`execution.kind: playwright` deklarieren, führen den passenden Testpfad aus und schreiben außerdem
szenariobezogene Logs. Szenarien, die `execution.kind: script` deklarieren, führen den
Evidence-Producer unter `execution.path` über `node --import tsx` aus (mit
`${outputDir}` und `${scenarioId}`, die in `execution.args` expandiert werden); der Producer
schreibt seine eigene `qa-evidence.json`, deren Einträge in die Suite-Ausgabe
importiert werden und deren Artefaktpfade relativ zu dieser Producer-`qa-evidence.json`
aufgelöst werden. Wenn `qa suite` über
`qa run --qa-profile` erreicht wird, enthält dieselbe `qa-evidence.json` außerdem die Profile-
Scorecard-Zusammenfassung für die ausgewählten Taxonomiekategorien.
Behandeln Sie es als Entdeckungshilfe, nicht als Gate-Ersatz; das ausgewählte Szenario benötigt weiterhin den richtigen Provider-Modus, Live-Transport, Multipass, Testbox oder die passende Release-Lane für das getestete Verhalten.
Scorecard-Kontext finden Sie unter [Reifegrad-Scorecard](/de/maturity/scorecard).

Für Zeichen- und Stilprüfungen führen Sie dasselbe Szenario über mehrere Live-Modell-Refs hinweg aus und schreiben einen bewerteten Markdown-Bericht:

```bash
pnpm openclaw qa character-eval \
  --model openai/gpt-5.5,thinking=medium,fast \
  --model openai/gpt-5.2,thinking=xhigh \
  --model openai/gpt-5,thinking=xhigh \
  --model anthropic/claude-opus-4-8,thinking=high \
  --model anthropic/claude-sonnet-4-6,thinking=high \
  --model zai/glm-5.1,thinking=high \
  --model moonshot/kimi-k2.5,thinking=high \
  --model google/gemini-3.1-pro-preview,thinking=high \
  --judge-model openai/gpt-5.5,thinking=xhigh,fast \
  --judge-model anthropic/claude-opus-4-8,thinking=high \
  --blind-judge-models \
  --concurrency 16 \
  --judge-concurrency 16
```

Der Befehl führt lokale untergeordnete QA-Gateway-Prozesse aus, nicht Docker. Character-Eval-
Szenarien sollten die Persona über `SOUL.md` festlegen und dann gewöhnliche Benutzer-Turns
wie Chat, Arbeitsbereichshilfe und kleine Dateiaufgaben ausführen. Dem Kandidatenmodell sollte
nicht mitgeteilt werden, dass es evaluiert wird. Der Befehl bewahrt jedes vollständige
Transkript auf, zeichnet grundlegende Laufstatistiken auf und bittet dann die Bewertermodelle im Fast Mode mit
`xhigh`-Reasoning, sofern unterstützt, die Läufe nach Natürlichkeit, Ausstrahlung und Humor zu bewerten.
Verwenden Sie `--blind-judge-models`, wenn Sie Provider vergleichen: Der Bewerter-Prompt erhält weiterhin
jedes Transkript und jeden Laufstatus, aber Kandidaten-Refs werden durch neutrale
Bezeichnungen wie `candidate-01` ersetzt; der Bericht ordnet die Rankings nach dem
Parsing wieder den echten Refs zu.
Kandidatenläufe verwenden standardmäßig `high`-Thinking, mit `medium` für GPT-5.5 und `xhigh`
für ältere OpenAI-Eval-Refs, die dies unterstützen. Überschreiben Sie einen bestimmten Kandidaten inline mit
`--model provider/model,thinking=<level>`. `--thinking <level>` setzt weiterhin einen
globalen Fallback, und die ältere Form `--model-thinking <provider/model=level>` wird
aus Kompatibilitätsgründen beibehalten.
OpenAI-Kandidaten-Refs verwenden standardmäßig den Fast Mode, sodass Priority Processing dort genutzt wird, wo
der Provider es unterstützt. Fügen Sie inline `,fast`, `,no-fast` oder `,fast=false` hinzu, wenn ein
einzelner Kandidat oder Bewerter eine Überschreibung benötigt. Übergeben Sie `--fast` nur, wenn Sie
den Fast Mode für jedes Kandidatenmodell erzwingen möchten. Die Dauern von Kandidaten- und Bewerterläufen werden
für die Benchmark-Analyse im Bericht aufgezeichnet, aber die Bewerter-Prompts sagen ausdrücklich,
nicht nach Geschwindigkeit zu ranken.
Kandidaten- und Bewertermodellläufe verwenden beide standardmäßig Concurrency 16. Verringern Sie
`--concurrency` oder `--judge-concurrency`, wenn Provider-Limits oder lokaler Gateway-
Druck einen Lauf zu verrauscht machen.
Wenn kein Kandidaten-`--model` übergeben wird, verwendet die Character-Eval standardmäßig
`openai/gpt-5.5`, `openai/gpt-5.2`, `openai/gpt-5`, `anthropic/claude-opus-4-8`,
`anthropic/claude-sonnet-4-6`, `zai/glm-5.1`,
`moonshot/kimi-k2.5` und
`google/gemini-3.1-pro-preview`, wenn kein `--model` übergeben wird.
Wenn kein `--judge-model` übergeben wird, verwenden die Bewerter standardmäßig
`openai/gpt-5.5,thinking=xhigh,fast` und
`anthropic/claude-opus-4-8,thinking=high`.

## Verwandte Dokumentation

- [Matrix-QA](/de/concepts/qa-matrix)
- [Reifegrad-Scorecard](/de/maturity/scorecard)
- [Benchmark-Paket für persönliche Agenten](/de/concepts/personal-agent-benchmark-pack)
- [QA-Kanal](/de/channels/qa-channel)
- [Testen](/de/help/testing)
- [Dashboard](/de/web/dashboard)
