---
read_when:
    - Verstehen, wie der QA-Stack zusammenpasst
    - qa-lab, qa-channel oder einen Transportadapter erweitern
    - Repository-gestützte QA-Szenarien hinzufügen
    - QA-Automatisierung mit höherem Realismus rund um das Gateway-Dashboard
summary: 'Überblick über den QA-Stack: qa-lab, qa-channel, repo-gestützte Szenarien, Live-Transport-Lanes, Transportadapter und Reporting.'
title: QA-Übersicht
x-i18n:
    generated_at: "2026-06-27T17:25:53Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8cc1e4c3f496e409b93d2ca2d3bf8107e5fe3bea37f89cc92d1936109f0f4e36
    source_path: concepts/qa-e2e-automation.md
    workflow: 16
---

Der private QA-Stack soll OpenClaw auf realistischere,
channel-artige Weise ausüben, als es ein einzelner Unit-Test kann.

Aktuelle Komponenten:

- `extensions/qa-channel`: synthetischer Nachrichtenkanal mit Oberflächen für DM, Kanal, Thread,
  Reaktion, Bearbeiten und Löschen.
- `extensions/qa-lab`: Debugger-UI und QA-Bus zum Beobachten des Transkripts,
  Einspeisen eingehender Nachrichten und Exportieren eines Markdown-Berichts.
- `extensions/qa-matrix`, künftige Runner-Plugins: Live-Transport-Adapter, die
  einen echten Kanal innerhalb eines untergeordneten QA-Gateways steuern.
- `qa/`: repo-gestützte Seed-Assets für die Startaufgabe und grundlegende QA-
  Szenarien.
- [Mantis](/de/concepts/mantis): Vorher- und Nachher-Live-Verifizierung für Bugs, die
  echte Transporte, Browser-Screenshots, VM-Zustand und PR-Nachweise benötigen.

## Befehlsoberfläche

Jeder QA-Ablauf läuft unter `pnpm openclaw qa <subcommand>`. Viele haben `pnpm qa:*`-
Skript-Aliase; beide Formen werden unterstützt.

| Befehl                                             | Zweck                                                                                                                                                                                                                                                                 |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `qa run`                                            | Gebündelter QA-Selbsttest ohne `--qa-profile`; taxonomy-gestützter Maturity-Profil-Runner mit `--qa-profile smoke-ci`, `--qa-profile release` oder `--qa-profile all`.                                                                                                      |
| `qa suite`                                          | Führt repo-gestützte Szenarien gegen die QA-Gateway-Lane aus. Aliase: `pnpm openclaw qa suite --runner multipass` für eine wegwerfbare Linux-VM.                                                                                                                                  |
| `qa coverage`                                       | Gibt das YAML-Inventar zur Szenarioabdeckung aus (`--json` für maschinenlesbare Ausgabe).                                                                                                                                                                                               |
| `qa parity-report`                                  | Vergleicht zwei `qa-suite-summary.json`-Dateien und schreibt den agentischen Paritätsbericht, oder verwendet `--runtime-axis --token-efficiency`, um Codex-vs-OpenClaw-Runtime-Paritäts- und Token-Effizienzberichte aus einer Runtime-Paar-Zusammenfassung zu schreiben.                                         |
| `qa character-eval`                                 | Führt das Character-QA-Szenario über mehrere Live-Modelle hinweg mit einem bewerteten Bericht aus. Siehe [Berichterstattung](#reporting).                                                                                                                                                            |
| `qa manual`                                         | Führt einen einmaligen Prompt gegen die ausgewählte Provider-/Modell-Lane aus.                                                                                                                                                                                                          |
| `qa ui`                                             | Startet die QA-Debugger-UI und den lokalen QA-Bus (Alias: `pnpm qa:lab:ui`).                                                                                                                                                                                                    |
| `qa docker-build-image`                             | Baut das vorgefertigte QA-Docker-Image.                                                                                                                                                                                                                                     |
| `qa docker-scaffold`                                | Schreibt ein docker-compose-Grundgerüst für das QA-Dashboard und die Gateway-Lane.                                                                                                                                                                                                    |
| `qa up`                                             | Baut die QA-Site, startet den Docker-gestützten Stack und gibt die URL aus (Alias: `pnpm qa:lab:up`; die Variante `:fast` fügt `--use-prebuilt-image --bind-ui-dist --skip-ui-build` hinzu).                                                                                                  |
| `qa aimock`                                         | Startet nur den AIMock-Provider-Server.                                                                                                                                                                                                                                  |
| `qa mock-openai`                                    | Startet nur den szenariobewussten `mock-openai`-Provider-Server.                                                                                                                                                                                                            |
| `qa credentials doctor` / `add` / `list` / `remove` | Verwaltet den gemeinsam genutzten Convex-Credential-Pool.                                                                                                                                                                                                                               |
| `qa matrix`                                         | Live-Transport-Lane gegen einen wegwerfbaren Tuwunel-Homeserver. Siehe [Matrix-QA](/de/concepts/qa-matrix).                                                                                                                                                                      |
| `qa telegram`                                       | Live-Transport-Lane gegen eine echte private Telegram-Gruppe.                                                                                                                                                                                                              |
| `qa discord`                                        | Live-Transport-Lane gegen einen echten privaten Discord-Guild-Kanal.                                                                                                                                                                                                       |
| `qa slack`                                          | Live-Transport-Lane gegen einen echten privaten Slack-Kanal.                                                                                                                                                                                                               |
| `qa whatsapp`                                       | Live-Transport-Lane gegen echte WhatsApp-Web-Konten.                                                                                                                                                                                                                 |
| `qa mantis`                                         | Vorher- und Nachher-Verifizierungs-Runner für Live-Transport-Bugs, mit Discord-Statusreaktionsnachweisen, Crabbox-Desktop-/Browser-Smoke und Slack-in-VNC-Smoke. Siehe [Mantis](/de/concepts/mantis) und [Mantis Slack Desktop Runbook](/de/concepts/mantis-slack-desktop-runbook). |

Profilgestütztes `qa run` liest die Mitgliedschaft aus `taxonomy.yaml` und leitet
die aufgelösten Szenarien dann über `qa suite` weiter. `--surface` und
`--category` filtern das ausgewählte Profil, statt separate Lanes zu definieren.
Das resultierende `qa-evidence.json` enthält eine Profil-Scorecard-Zusammenfassung mit
Zählungen der ausgewählten Kategorien und fehlenden Coverage-IDs; die einzelnen Evidence-
Einträge bleiben die maßgebliche Quelle für Tests, Coverage-Rollen und Ergebnisse.
Taxonomy-Feature-Coverage-IDs sind exakte Nachweisziele, keine Aliase. Primäre
Szenarioabdeckung erfüllt passende IDs; sekundäre Abdeckung bleibt hinweisend.
Coverage-IDs verwenden die gepunktete Form `namespace.behavior` mit kleingeschriebenen
alphanumerischen Segmenten oder Segmenten mit Bindestrichen; Profil-, Surface- und Kategorie-IDs können weiterhin
die bestehenden gestrichelten oder gepunkteten Taxonomy-IDs verwenden.
Schlanke Evidence lässt pro Eintrag `execution` weg und setzt `evidenceMode: "slim"`;
`smoke-ci` verwendet standardmäßig schlanke Evidence, und `--evidence-mode full` stellt vollständige Einträge wieder her:

```bash
pnpm openclaw qa run \
  --qa-profile smoke-ci \
  --category channel-framework.conversation-routing-and-delivery \
  --provider-mode mock-openai \
  --output-dir .artifacts/qa-e2e/smoke-ci-profile-dispatch
```

Verwenden Sie `smoke-ci` für deterministischen Profilnachweis mit Mock-Modell-Providern und
Crabline-Fake-Provider-Servern. Verwenden Sie `release` für Stable/LTS-Nachweis gegen Live-
Kanäle. Verwenden Sie `all` nur für explizite Full-Taxonomy-Evidence-Läufe; es wählt
jede aktive Maturity-Kategorie aus und kann über den Workflow `QA Profile
Evidence` mit `qa_profile=all` dispatcht werden. Wenn ein Befehl außerdem ein OpenClaw-
Root-Profil benötigt, setzen Sie das Root-Profil vor den QA-Befehl:

```bash
pnpm openclaw --profile work qa run --qa-profile smoke-ci
```

## Operator-Ablauf

Der aktuelle QA-Operator-Ablauf ist eine zweigeteilte QA-Site:

- Links: Gateway-Dashboard (Control UI) mit dem Agenten.
- Rechts: QA Lab mit dem Slack-artigen Transkript und Szenarioplan.

Führen Sie ihn aus mit:

```bash
pnpm qa:lab:up
```

Das baut die QA-Site, startet die Docker-gestützte Gateway-Lane und stellt die
QA-Lab-Seite bereit, auf der ein Operator oder eine Automatisierungsschleife dem Agenten eine QA-
Mission geben, echtes Kanalverhalten beobachten und aufzeichnen kann, was funktioniert hat, fehlgeschlagen ist oder
blockiert blieb.

Für schnellere QA-Lab-UI-Iteration ohne jedes Mal das Docker-Image neu zu bauen,
starten Sie den Stack mit einem bind-gemounteten QA-Lab-Bundle:

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

Für einen lokalen OpenTelemetry-Signal-Smoke führen Sie aus:

```bash
pnpm qa:otel:smoke
```

Dieses Skript startet einen lokalen OTLP/HTTP-Receiver, führt das QA-
Szenario `otel-trace-smoke` mit aktiviertem Plugin `diagnostics-otel` aus und prüft dann, dass Traces,
Metriken und Logs exportiert werden. Es decodiert die exportierten Protobuf-Trace-Spans
und prüft die release-kritische Struktur:
`openclaw.run`, `openclaw.harness.run`, ein Modellaufruf-Span nach der neuesten GenAI Semantic Convention,
`openclaw.context.assembled` und `openclaw.message.delivery`
müssen vorhanden sein. Der Smoke erzwingt
`OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`, daher muss der Modellaufruf-
Span den Namen `{gen_ai.operation.name} {gen_ai.request.model}` verwenden;
Modellaufrufe dürfen bei erfolgreichen Turns nicht `StreamAbandoned` exportieren; rohe Diagnose-IDs und
`openclaw.content.*`-Attribute müssen aus dem Trace herausbleiben. Die rohen OTLP-
Payloads dürfen den Prompt-Sentinel, Response-Sentinel oder QA-Session-
Schlüssel nicht enthalten. Es schreibt `otel-smoke-summary.json` neben die QA-Suite-Artefakte.

Für einen Collector-gestützten OpenTelemetry-Smoke führen Sie aus:

```bash
pnpm qa:otel:collector-smoke
```

Diese Lane setzt einen echten OpenTelemetry-Collector-Docker-Container vor den
gleichen lokalen Receiver. Verwenden Sie sie, wenn Sie Endpoint-Verkabelung, Collector-
Kompatibilität oder OTLP-Exportverhalten ändern, das der In-Process-Receiver maskieren könnte.

Für den geschützten Prometheus-Scrape-Smoke führen Sie aus:

```bash
pnpm qa:prometheus:smoke
```

Dieser Alias führt das QA-Szenario `docker-prometheus-smoke` mit aktiviertem
`diagnostics-prometheus` aus, verifiziert, dass nicht authentifizierte Scrapes
abgelehnt werden, und prüft dann, dass der authentifizierte Scrape
releasekritische Metrikfamilien ohne Prompt-Inhalt, Antwortinhalt, rohe
Diagnosekennungen, Auth-Tokens oder lokale Pfade enthält.

Um beide Observability-Smoke-Tests direkt nacheinander auszuführen, verwenden Sie:

```bash
pnpm qa:observability:smoke
```

Für die collector-gestützte OpenTelemetry-Lane plus den geschützten
Prometheus-Scrape-Smoke-Test verwenden Sie:

```bash
pnpm qa:observability:collector-smoke
```

Observability-QA bleibt ausschließlich Source-Checkout. Der npm-Tarball lässt
QA Lab absichtlich aus, daher führen Package-Docker-Release-Lanes keine
`qa`-Befehle aus. Verwenden Sie `pnpm qa:otel:smoke`,
`pnpm qa:prometheus:smoke` oder `pnpm qa:observability:smoke` aus einem
gebauten Source-Checkout, wenn Sie Diagnoseinstrumentierung ändern.

Für eine transportechte Matrix-Smoke-Lane, die keine Zugangsdaten für
Modell-Provider erfordert, führen Sie das schnelle Profil mit dem
deterministischen Mock-OpenAI-Provider aus:

```bash
OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS=3000 \
  pnpm openclaw qa matrix --provider-mode mock-openai --profile fast --fail-fast
```

Für die Live-Frontier-Provider-Lane geben Sie OpenAI-kompatible Zugangsdaten
explizit an:

```bash
OPENCLAW_LIVE_OPENAI_KEY="${OPENAI_API_KEY}" \
OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS=3000 \
  pnpm openclaw qa matrix --provider-mode live-frontier --profile fast --fail-fast
```

Die vollständige CLI-Referenz, der Profil-/Szenariokatalog, Env-Vars und das Artefaktlayout für diese Lane finden Sie unter [Matrix-QA](/de/concepts/qa-matrix). Auf einen Blick: Sie stellt einen temporären Tuwunel-Homeserver in Docker bereit, registriert temporäre Treiber-/SUT-/Observer-Benutzer, führt das echte Matrix-Plugin innerhalb eines untergeordneten QA-Gateways aus, das auf diesen Transport beschränkt ist (kein `qa-channel`), und schreibt anschließend einen Markdown-Bericht, eine JSON-Zusammenfassung, ein Artefakt mit beobachteten Ereignissen und ein kombiniertes Ausgabelog unter `.artifacts/qa-e2e/matrix-<timestamp>/`.

Die Szenarien decken Transportverhalten ab, das Unit-Tests nicht durchgängig End-to-End beweisen können: Mention-Gating, Allow-Bot-Richtlinien, Allowlists, Top-Level- und Thread-Antworten, DM-Routing, Reaktionsverarbeitung, Unterdrückung eingehender Bearbeitungen, Restart-Replay-Deduplizierung, Wiederherstellung nach Homeserver-Unterbrechungen, Zustellung von Approval-Metadaten, Medienverarbeitung sowie Matrix-E2EE-Bootstrap-/Recovery-/Verifikationsflüsse. Das E2EE-CLI-Profil führt außerdem `openclaw matrix encryption setup` und Verifikationsbefehle über denselben temporären Homeserver aus, bevor Gateway-Antworten geprüft werden.

Discord hat außerdem Mantis-only Opt-in-Szenarien zur Fehlerreproduktion. Verwenden Sie
`--scenario discord-status-reactions-tool-only` für die explizite
Statusreaktions-Timeline oder `--scenario discord-thread-reply-filepath-attachment`,
um einen echten Discord-Thread zu erstellen und zu verifizieren, dass
`message.thread-reply` einen `filePath`-Anhang beibehält. Diese Szenarien
bleiben außerhalb der Standard-Live-Discord-Lane, weil sie Vorher-/Nachher-
Repro-Sonden und keine breite Smoke-Abdeckung sind. Der Mantis-Workflow für
Thread-Anhänge kann außerdem ein eingeloggtes Discord-Web-Zeugen-Video
hinzufügen, wenn `MANTIS_DISCORD_VIEWER_CHROME_PROFILE_DIR` oder
`MANTIS_DISCORD_VIEWER_CHROME_PROFILE_TGZ_B64` in der QA-Umgebung konfiguriert
ist. Dieses Viewer-Profil dient nur der visuellen Erfassung; die
Bestanden-/Fehlgeschlagen-Entscheidung stammt weiterhin vom Discord-REST-Orakel.

CI verwendet dieselbe Befehlsoberfläche in `.github/workflows/qa-live-transports-convex.yml`.
Geplante und standardmäßige manuelle Läufe führen das schnelle Matrix-Profil mit
von QA bereitgestellten Live-Frontier-Zugangsdaten, `--fast` und
`OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS=3000` aus. Manuelles
`matrix_profile=all` fächert in die fünf Profil-Shards auf.

Für transportechte Telegram-, Discord-, Slack- und WhatsApp-Smoke-Lanes:

```bash
pnpm openclaw qa telegram
pnpm openclaw qa discord
pnpm openclaw qa slack
pnpm openclaw qa whatsapp
```

Sie zielen auf einen bereits vorhandenen echten Kanal mit zwei Bots oder Konten (Treiber + SUT). Erforderliche Env-Vars, Szenariolisten, Ausgabeartefakte und der Convex-Zugangsdatenpool sind unten in der [QA-Referenz für Telegram, Discord, Slack und WhatsApp](#telegram-discord-slack-and-whatsapp-qa-reference) dokumentiert.

Für einen vollständigen Slack-Desktop-VM-Lauf mit VNC-Rettung führen Sie aus:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

Dieser Befehl least eine Crabbox-Desktop-/Browser-Maschine, führt die
Slack-Live-Lane innerhalb der VM aus, öffnet Slack Web im VNC-Browser, erfasst
den Desktop und kopiert `slack-qa/`, `slack-desktop-smoke.png` und
`slack-desktop-smoke.mp4`, sofern Videoerfassung verfügbar ist, zurück in das
Mantis-Artefaktverzeichnis. Crabbox-Desktop-/Browser-Leases stellen die
Erfassungstools und Browser-/Native-Build-Hilfspakete vorab bereit, daher
sollte das Szenario Fallbacks nur auf älteren Leases installieren. Mantis
meldet Gesamt- und Phasen-Timings in `mantis-slack-desktop-smoke-report.md`,
damit langsame Läufe zeigen, ob die Zeit in Lease-Aufwärmung,
Zugangsdatenbeschaffung, Remote-Setup oder Artefaktkopie geflossen ist.
Verwenden Sie `--lease-id <cbx_...>` wieder, nachdem Sie sich manuell über VNC
bei Slack Web angemeldet haben; wiederverwendete Leases halten außerdem den
pnpm-Store-Cache von Crabbox warm. Der Standard `--hydrate-mode source`
verifiziert aus einem Source-Checkout und führt Installation/Build innerhalb
der VM aus. Verwenden Sie `--hydrate-mode prehydrated` nur, wenn der
wiederverwendete Remote-Arbeitsbereich bereits `node_modules` und ein gebautes
`dist/` enthält; dieser Modus überspringt den teuren Installations-/Build-Schritt
und schlägt fail-closed fehl, wenn der Arbeitsbereich nicht bereit ist. Mit
`--gateway-setup` lässt Mantis ein persistentes OpenClaw-Slack-Gateway
innerhalb der VM auf Port `38973` laufen; ohne diese Option führt der Befehl die
normale Bot-zu-Bot-Slack-QA-Lane aus und beendet sich nach der Artefakterfassung.

Um die native Slack-Approval-UI mit Desktop-Nachweis zu belegen, führen Sie den
Mantis-Approval-Checkpoint-Modus aus:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --approval-checkpoints \
  --credential-source convex \
  --credential-role maintainer
```

Dieser Modus schließt `--gateway-setup` gegenseitig aus. Er führt die
Slack-Approval-Szenarien aus, lehnt Nicht-Approval-Szenario-IDs ab, wartet an
jedem ausstehenden und aufgelösten Approval-Zustand, rendert die beobachtete
Slack-API-Nachricht nach `approval-checkpoints/<scenario>-pending.png` und
`approval-checkpoints/<scenario>-resolved.png` und schlägt dann fehl, wenn ein
Checkpoint, ein Nachrichtennachweis, eine Bestätigung oder ein gerenderter
Screenshot fehlt oder leer ist. Kalte CI-Leases können in
`slack-desktop-smoke.png` weiterhin die Slack-Anmeldung zeigen; die
Approval-Checkpoint-Bilder sind der visuelle Nachweis für diese Lane.

Die Operator-Checkliste, der GitHub-Workflow-Dispatch-Befehl, der Evidence-Comment-Vertrag, die Hydrate-Mode-Entscheidungstabelle, die Timing-Interpretation und die Schritte zur Fehlerbehandlung finden Sie im [Mantis Slack Desktop Runbook](/de/concepts/mantis-slack-desktop-runbook).

Für eine Desktop-Aufgabe im Agent-/CV-Stil führen Sie aus:

```bash
pnpm openclaw qa mantis visual-task \
  --browser-url https://example.net \
  --expect-text "Example Domain" \
  --vision-model openai/gpt-5.5
```

`visual-task` least oder verwendet eine Crabbox-Desktop-/Browser-Maschine wieder,
startet `crabbox record --while`, steuert den sichtbaren Browser über einen
verschachtelten `visual-driver`, erfasst `visual-task.png`, führt
`openclaw infer image describe` gegen den Screenshot aus, wenn
`--vision-mode image-describe` ausgewählt ist, und schreibt `visual-task.mp4`,
`mantis-visual-task-summary.json`, `mantis-visual-task-driver-result.json` und
`mantis-visual-task-report.md`. Wenn `--expect-text` gesetzt ist, fragt der
Vision-Prompt nach einem strukturierten JSON-Urteil und besteht nur, wenn das
Modell positive sichtbare Belege meldet; eine negative Antwort, die lediglich
den Zieltext zitiert, lässt die Assertion fehlschlagen. Verwenden Sie
`--vision-mode metadata` für einen Smoke-Test ohne Modell, der Desktop, Browser,
Screenshot- und Video-Plumbing ohne Aufruf eines Bildverständnis-Providers
belegt. Recording ist ein erforderliches Artefakt für `visual-task`; wenn
Crabbox kein nicht leeres `visual-task.mp4` aufzeichnet, schlägt die Aufgabe
fehl, selbst wenn der visuelle Treiber bestanden hat. Bei einem Fehler behält
Mantis die Lease für VNC, außer die Aufgabe hatte bereits bestanden und
`--keep-lease` war nicht gesetzt.

Bevor Sie gepoolte Live-Zugangsdaten verwenden, führen Sie aus:

```bash
pnpm openclaw qa credentials doctor
```

Der Doctor prüft die Convex-Broker-Env, validiert Endpoint-Einstellungen und verifiziert die Admin-/Listen-Erreichbarkeit, wenn das Maintainer-Secret vorhanden ist. Er meldet für Secrets nur den Status gesetzt/fehlend.

## Live-Transport-Abdeckung

Live-Transport-Lanes teilen sich einen Vertrag, anstatt jeweils eine eigene Szenariolistenform zu erfinden. `qa-channel` ist die breite synthetische Suite für Produktverhalten und nicht Teil der Live-Transport-Abdeckungsmatrix.

Live-Transport-Runner sollten die gemeinsamen Szenario-IDs, Baseline-
Abdeckungshelfer und den Szenarioauswahlhelfer aus
`openclaw/plugin-sdk/qa-live-transport-scenarios` importieren.

| Lane     | Canary | Mention-Gating | Bot-zu-Bot | Allowlist-Block | Top-Level-Antwort | Zitatantwort | Restart-Resume | Thread-Follow-up | Thread-Isolation | Reaktionsbeobachtung | Hilfebefehl | Native Befehlsregistrierung |
| -------- | ------ | -------------- | ---------- | --------------- | ----------------- | ------------ | -------------- | ---------------- | ---------------- | --------------------- | ----------- | --------------------------- |
| Matrix   | x      | x              | x          | x               | x                 |              | x              | x                | x                | x                     |             |                             |
| Telegram | x      | x              | x          |                 |                   |              |                |                  |                  |                       | x           |                             |
| Discord  | x      | x              | x          |                 |                   |              |                |                  |                  |                       |             | x                           |
| Slack    | x      | x              | x          | x               | x                 |              | x              | x                | x                |                       |             |                             |
| WhatsApp | x      | x              |            | x               | x                 | x            | x              |                  |                  | x                     | x           |                             |

Dadurch bleibt `qa-channel` die breite Suite für Produktverhalten, während
Matrix, Telegram und andere Live-Transporte eine explizite gemeinsame
Transport-Vertragscheckliste verwenden.

Für eine temporäre Linux-VM-Lane ohne Docker in den QA-Pfad einzubinden, führen Sie aus:

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

Dies startet einen frischen Multipass-Gast, installiert Abhängigkeiten, baut
OpenClaw im Gast, führt `qa suite` aus und kopiert anschließend den normalen
QA-Bericht und die Zusammenfassung zurück in `.artifacts/qa-e2e/...` auf dem
Host. Es verwendet dasselbe Szenarioauswahlverhalten wie `qa suite` auf dem
Host. Host- und Multipass-Suite-Läufe führen mehrere ausgewählte Szenarien
standardmäßig parallel mit isolierten Gateway-Workern aus. `qa-channel` hat
standardmäßig Parallelität 4, begrenzt durch die Anzahl der ausgewählten
Szenarien. Verwenden Sie `--concurrency <count>`, um die Worker-Anzahl
anzupassen, oder `--concurrency 1` für serielle Ausführung. Verwenden Sie
`--pack personal-agent`, um das Benchmark-Pack für persönliche Assistenten
auszuführen. Der Pack-Selektor ist additiv mit wiederholten `--scenario`-Flags:
Explizite Szenarien laufen zuerst, anschließend laufen Pack-Szenarien in
Pack-Reihenfolge mit entfernten Duplikaten. Verwenden Sie `--pack observability`,
wenn ein benutzerdefinierter QA-Runner bereits das OpenTelemetry-Collector-Setup
bereitstellt und die OpenTelemetry- und Prometheus-Diagnose-Smoke-Szenarien
gemeinsam auswählen möchte. Der Befehl beendet sich mit einem Nicht-Null-Code,
wenn ein Szenario fehlschlägt. Verwenden Sie `--allow-failures`, wenn Sie
Artefakte ohne fehlgeschlagenen Exit-Code möchten. Live-Läufe leiten die
unterstützten QA-Auth-Eingaben weiter, die für den Gast praktikabel sind:
env-basierte Provider-Keys, den QA-Live-Provider-Konfigurationspfad und
`CODEX_HOME`, wenn vorhanden. Belassen Sie `--output-dir` unterhalb des Repo-
Roots, damit der Gast über den gemounteten Arbeitsbereich zurückschreiben kann.

## QA-Referenz für Telegram, Discord, Slack und WhatsApp

Matrix hat eine [eigene Seite](/de/concepts/qa-matrix), wegen der Anzahl seiner Szenarien und der Docker-gestützten Bereitstellung des Homeservers. Telegram, Discord, Slack und WhatsApp laufen gegen bereits vorhandene reale Transporte, daher befindet sich ihre Referenz hier.

### Gemeinsame CLI-Flags

Diese Lanes registrieren sich über `extensions/qa-lab/src/live-transports/shared/live-transport-cli.ts` und akzeptieren dieselben Flags:

| Flag                                  | Standard                                           | Beschreibung                                                                                                                                                  |
| ------------------------------------- | -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--scenario <id>`                     | -                                                  | Nur dieses Szenario ausführen. Wiederholbar.                                                                                                                   |
| `--output-dir <path>`                 | `<repo>/.artifacts/qa-e2e/<transport>-<timestamp>` | Ort, an dem Berichte, Zusammenfassungen, Nachweise, transportspezifische Artefakte und das Ausgabeprotokoll geschrieben werden. Relative Pfade werden gegen `--repo-root` aufgelöst. |
| `--repo-root <path>`                  | `process.cwd()`                                    | Repository-Root beim Aufruf aus einem neutralen Arbeitsverzeichnis.                                                                                            |
| `--sut-account <id>`                  | `sut`                                              | Temporäre Konto-ID in der QA-Gateway-Konfiguration.                                                                                                           |
| `--provider-mode <mode>`              | `live-frontier`                                    | `mock-openai` oder `live-frontier` (das ältere `live-openai` funktioniert weiterhin).                                                                          |
| `--model <ref>` / `--alt-model <ref>` | Provider-Standard                                  | Primäre/alternative Modell-Refs.                                                                                                                              |
| `--fast`                              | aus                                                | Schneller Provider-Modus, sofern unterstützt.                                                                                                                  |
| `--credential-source <env\|convex>`   | `env`                                              | Siehe [Convex-Zugangsdatenpool](#convex-credential-pool).                                                                                                     |
| `--credential-role <maintainer\|ci>`  | `ci` in CI, sonst `maintainer`                     | Rolle, die bei `--credential-source convex` verwendet wird.                                                                                                    |

Jede Lane beendet sich bei einem fehlgeschlagenen Szenario mit einem Nicht-Null-Code. `--allow-failures` schreibt Artefakte, ohne einen fehlschlagenden Exit-Code zu setzen.

### Telegram-QA

```bash
pnpm openclaw qa telegram
```

Zielt auf eine reale private Telegram-Gruppe mit zwei unterschiedlichen Bots (Driver + SUT). Der SUT-Bot muss einen Telegram-Benutzernamen haben; Bot-zu-Bot-Beobachtung funktioniert am besten, wenn beide Bots in `@BotFather` den **Bot-to-Bot Communication Mode** aktiviert haben.

Erforderliche Umgebungsvariablen bei `--credential-source env`:

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

Die implizite Standardauswahl deckt immer Canary, Mention-Gating, native Befehlsantworten, Befehlsadressierung und Bot-zu-Bot-Gruppenantworten ab. `mock-openai`-Standards enthalten außerdem deterministische Prüfungen für Antwortketten und Final-Message-Streaming. `telegram-current-session-status-tool` bleibt Opt-in, da es nur stabil ist, wenn es direkt nach Canary gethreadet wird, nicht nach beliebigen nativen Befehlsantworten. Verwenden Sie `pnpm openclaw qa telegram --list-scenarios --provider-mode mock-openai`, um die aktuelle Standard-/optionale Aufteilung mit Regressions-Refs auszugeben.

Ausgabeartefakte:

- `telegram-qa-report.md`
- `qa-evidence.json` - Nachweiseinträge für die Live-Transport-Prüfungen, einschließlich Profil-, Coverage-, Provider-, Kanal-, Artefakt-, Ergebnis- und RTT-Feldern.

Paket-Telegram-Läufe verwenden denselben Telegram-Zugangsdatenvertrag. Wiederholte RTT-Messung ist Teil der normalen Paket-Telegram-Live-Lane; die RTT-Verteilung wird für die ausgewählte RTT-Prüfung unter `result.timing` in `qa-evidence.json` eingearbeitet.

```bash
OPENCLAW_QA_CREDENTIAL_SOURCE=convex \
pnpm test:docker:npm-telegram-live
```

Wenn `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` gesetzt ist, least der Paket-Live-Wrapper Zugangsdaten mit `kind: "telegram"`, exportiert die geleaste Gruppen-/Driver-/SUT-Bot-Umgebung in den installierten Paketlauf, sendet Heartbeats für den Lease und gibt ihn beim Herunterfahren frei. Der Paket-Wrapper verwendet standardmäßig 20 RTT-Prüfungen von `telegram-mentioned-message-reply`, ein RTT-Timeout von 30 Sekunden und außerhalb von CI die Convex-Rolle `maintainer`, wenn Convex ausgewählt ist. Überschreiben Sie `OPENCLAW_NPM_TELEGRAM_RTT_SAMPLES`, `OPENCLAW_NPM_TELEGRAM_RTT_TIMEOUT_MS` oder `OPENCLAW_NPM_TELEGRAM_RTT_MAX_FAILURES`, um die RTT-Messung anzupassen, ohne einen separaten RTT-Befehl oder ein Telegram-spezifisches Zusammenfassungsformat zu erstellen.

### Discord-QA

```bash
pnpm openclaw qa discord
```

Zielt auf einen realen privaten Discord-Guild-Kanal mit zwei Bots: einen vom Harness gesteuerten Driver-Bot und einen SUT-Bot, der vom untergeordneten OpenClaw-Gateway über das gebündelte Discord-Plugin gestartet wird. Prüft die Behandlung von Kanal-Erwähnungen, dass der SUT-Bot den nativen `/help`-Befehl bei Discord registriert hat, sowie Opt-in-Mantis-Nachweisszenarien.

Erforderliche Umgebungsvariablen bei `--credential-source env`:

- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID` - muss mit der von Discord zurückgegebenen Benutzer-ID des SUT-Bots übereinstimmen (andernfalls schlägt die Lane schnell fehl).

Optional:

- `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1` behält Nachrichtentexte in Observed-Message-Artefakten bei.
- `OPENCLAW_QA_DISCORD_VOICE_CHANNEL_ID` wählt den Voice-/Stage-Kanal für `discord-voice-autojoin`; ohne diesen Wert wählt das Szenario den ersten sichtbaren Voice-/Stage-Kanal für den SUT-Bot aus.

Szenarien (`extensions/qa-lab/src/live-transports/discord/discord-live.runtime.ts:36`):

- `discord-canary`
- `discord-mention-gating`
- `discord-native-help-command-registration`
- `discord-voice-autojoin` - Opt-in-Voice-Szenario. Läuft eigenständig, aktiviert `channels.discord.voice.autoJoin` und prüft, ob der aktuelle Discord-Voice-State des SUT-Bots der Ziel-Voice-/Stage-Kanal ist. Convex-Discord-Zugangsdaten können optional `voiceChannelId` enthalten; andernfalls ermittelt der Runner den ersten sichtbaren Voice-/Stage-Kanal in der Guild.
- `discord-status-reactions-tool-only` - Opt-in-Mantis-Szenario. Läuft eigenständig, weil es den SUT auf durchgehend aktive, tool-only Guild-Antworten mit `messages.statusReactions.enabled=true` umschaltet, und erfasst dann eine REST-Reaktionszeitleiste sowie visuelle HTML-/PNG-Artefakte. Mantis-Vorher-/Nachher-Berichte behalten außerdem szenariobereitgestellte MP4-Artefakte als `baseline.mp4` und `candidate.mp4` bei.

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
- `discord-qa-observed-messages.json` - Nachrichtentexte werden redigiert, sofern nicht `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1` gesetzt ist.
- `discord-qa-reaction-timelines.json` und `discord-status-reactions-tool-only-timeline.png`, wenn das Status-Reaction-Szenario läuft.

### Slack-QA

```bash
pnpm openclaw qa slack
```

Zielt auf einen realen privaten Slack-Kanal mit zwei unterschiedlichen Bots: einen vom Harness gesteuerten Driver-Bot und einen SUT-Bot, der vom untergeordneten OpenClaw-Gateway über das gebündelte Slack-Plugin gestartet wird.

Erforderliche Umgebungsvariablen bei `--credential-source env`:

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`

Optional:

- `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1` behält Nachrichtentexte in Observed-Message-Artefakten bei.
- `OPENCLAW_QA_SLACK_APPROVAL_CHECKPOINT_DIR` aktiviert visuelle Genehmigungs-Checkpoints für Mantis. Der Runner schreibt `<scenario>.pending.json` und `<scenario>.resolved.json` und wartet dann auf passende `.ack.json`-Dateien.
- `OPENCLAW_QA_SLACK_APPROVAL_CHECKPOINT_TIMEOUT_MS` überschreibt das Timeout für die Checkpoint-Bestätigung. Der Standardwert ist `120000`.

Szenarien (`extensions/qa-lab/src/live-transports/slack/slack-live.runtime.ts`):

- `slack-canary`
- `slack-mention-gating`
- `slack-allowlist-block`
- `slack-top-level-reply-shape`
- `slack-restart-resume`
- `slack-thread-follow-up`
- `slack-thread-isolation`
- `slack-approval-exec-native` - Opt-in-Szenario für native Slack-Exec-Genehmigung. Fordert eine Exec-Genehmigung über das Gateway an, prüft, ob die Slack-Nachricht native Genehmigungsbuttons hat, löst sie auf und prüft das aufgelöste Slack-Update.
- `slack-approval-plugin-native` - Opt-in-Szenario für native Slack-Plugin-Genehmigung. Aktiviert Exec- und Plugin-Genehmigungsweiterleitung gemeinsam, damit Plugin-Ereignisse nicht durch das Exec-Genehmigungsrouting unterdrückt werden, und prüft dann denselben ausstehenden/aufgelösten nativen Slack-UI-Pfad.

Ausgabeartefakte:

- `slack-qa-report.md`
- `qa-evidence.json` - Nachweiseinträge für die Live-Transport-Prüfungen.
- `slack-qa-observed-messages.json` - Nachrichtentexte werden redigiert, sofern nicht `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1` gesetzt ist.
- `approval-checkpoints/` - nur wenn Mantis `OPENCLAW_QA_SLACK_APPROVAL_CHECKPOINT_DIR` setzt; enthält Checkpoint-JSON, Bestätigungs-JSON und Screenshots für ausstehend/aufgelöst.

#### Slack-Workspace einrichten

Die Lane benötigt zwei unterschiedliche Slack-Apps in einem Workspace sowie einen Kanal, in dem beide Bots Mitglied sind:

- `channelId` - die `Cxxxxxxxxxx`-ID eines Kanals, in den beide Bots eingeladen wurden. Verwenden Sie einen dedizierten Kanal; die Lane postet bei jedem Lauf.
- `driverBotToken` - Bot-Token (`xoxb-...`) der **Driver**-App.
- `sutBotToken` - Bot-Token (`xoxb-...`) der **SUT**-App, die eine separate Slack-App vom Driver sein muss, damit ihre Bot-Benutzer-ID unterschiedlich ist.
- `sutAppToken` - App-Level-Token (`xapp-...`) der SUT-App mit `connections:write`, das von Socket Mode verwendet wird, damit die SUT-App Ereignisse empfangen kann.

Bevorzugen Sie einen für QA dedizierten Slack-Workspace gegenüber der Wiederverwendung eines Produktions-Workspace.

Das unten stehende SUT-Manifest grenzt die Produktionsinstallation des gebündelten Slack-Plugins (`extensions/slack/src/setup-shared.ts:10`) absichtlich auf die Berechtigungen und Ereignisse ein, die von der Live-Slack-QA-Suite abgedeckt werden. Für die Einrichtung des Produktionskanals, wie Benutzer sie sehen, siehe [Slack-Kanal-Schnelleinrichtung](/de/channels/slack#quick-setup); das QA-Driver-/SUT-Paar ist absichtlich separat, weil die Lane zwei unterschiedliche Bot-Benutzer-IDs in einem Workspace benötigt.

**1. Erstellen Sie die Driver-App**

Gehen Sie zu [api.slack.com/apps](https://api.slack.com/apps) → _Neue App erstellen_ → _Aus einem Manifest_ → wählen Sie den QA-Workspace aus, fügen Sie das folgende Manifest ein und wählen Sie dann _Im Workspace installieren_:

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

Kopieren Sie den _Bot-Benutzer-OAuth-Token_ (`xoxb-...`) - daraus wird `driverBotToken`. Der Treiber muss nur Nachrichten posten und sich selbst identifizieren; keine Events, kein Socket Mode.

**2. Erstellen Sie die SUT-App**

Wiederholen Sie _Neue App erstellen → Aus einem Manifest_ im selben Workspace. Diese QA-App verwendet absichtlich eine schmalere Version des Produktionsmanifests des gebündelten Slack-Plugins (`extensions/slack/src/setup-shared.ts:10`): Reaktions-Scopes und Events werden ausgelassen, weil die Live-Slack-QA-Suite die Reaktionsverarbeitung noch nicht abdeckt.

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

- _Im Workspace installieren_ → kopieren Sie den _Bot-Benutzer-OAuth-Token_ → daraus wird `sutBotToken`.
- _Grundlegende Informationen → App-Level-Token → Token und Scopes generieren_ → fügen Sie den Scope `connections:write` hinzu → speichern → kopieren Sie den Wert `xapp-...` → daraus wird `sutAppToken`.

Prüfen Sie, dass die beiden Bots unterschiedliche Benutzer-IDs haben, indem Sie `auth.test` für jeden Token aufrufen. Die Runtime unterscheidet Treiber und SUT anhand der Benutzer-ID; dieselbe App für beide wiederzuverwenden lässt das Mention-Gating sofort fehlschlagen.

**3. Erstellen Sie den Kanal**

Erstellen Sie im QA-Workspace einen Kanal (z. B. `#openclaw-qa`) und laden Sie beide Bots innerhalb des Kanals ein:

```
/invite @OpenClaw QA Driver
/invite @OpenClaw QA SUT
```

Kopieren Sie die ID `Cxxxxxxxxxx` aus _Kanalinformationen → Info → Kanal-ID_ - daraus wird `channelId`. Ein öffentlicher Kanal funktioniert; wenn Sie einen privaten Kanal verwenden, haben beide Apps bereits `groups:history`, sodass die Verlaufslesevorgänge des Harness weiterhin erfolgreich sind.

**4. Registrieren Sie die Zugangsdaten**

Es gibt zwei Optionen. Verwenden Sie Env-Vars für das Debugging auf einem einzelnen Computer (setzen Sie die vier Variablen `OPENCLAW_QA_SLACK_*` und übergeben Sie `--credential-source env`), oder befüllen Sie den gemeinsamen Convex-Pool, damit CI und andere Maintainer sie leasen können.

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

Erwarten Sie `count: 1`, `status: "active"` und kein Feld `lease`.

**5. Prüfen Sie End-to-End**

Führen Sie die Lane lokal aus, um zu bestätigen, dass beide Bots über den Broker miteinander sprechen können:

```bash
pnpm openclaw qa slack \
  --credential-source convex \
  --credential-role maintainer \
  --output-dir .artifacts/qa-e2e/slack-local
```

Ein grüner Lauf ist deutlich unter 30 Sekunden abgeschlossen, und `slack-qa-report.md` zeigt sowohl `slack-canary` als auch `slack-mention-gating` mit Status `pass`. Wenn die Lane etwa 90 Sekunden hängt und mit `Convex credential pool exhausted for kind "slack"` beendet wird, ist entweder der Pool leer oder jede Zeile ist geleast - `qa credentials list --kind slack --status all --json` zeigt Ihnen, was zutrifft.

### WhatsApp-QA

```bash
pnpm openclaw qa whatsapp
```

Zielt auf zwei dedizierte WhatsApp-Web-Konten: ein vom Harness gesteuertes Treiberkonto und ein SUT-Konto, das vom untergeordneten OpenClaw-Gateway über das gebündelte WhatsApp-Plugin gestartet wird.

Erforderliche Env bei `--credential-source env`:

- `OPENCLAW_QA_WHATSAPP_DRIVER_PHONE_E164`
- `OPENCLAW_QA_WHATSAPP_SUT_PHONE_E164`
- `OPENCLAW_QA_WHATSAPP_DRIVER_AUTH_ARCHIVE_BASE64`
- `OPENCLAW_QA_WHATSAPP_SUT_AUTH_ARCHIVE_BASE64`

Optional:

- `OPENCLAW_QA_WHATSAPP_GROUP_JID` aktiviert Gruppenszenarien wie
  `whatsapp-mention-gating` und `whatsapp-group-allowlist-block`.
- `OPENCLAW_QA_WHATSAPP_CAPTURE_CONTENT=1` behält Nachrichtentexte in
  Artefakten beobachteter Nachrichten.

Szenariokatalog (`extensions/qa-lab/src/live-transports/whatsapp/whatsapp-live.runtime.ts`):

- Baseline und Gruppen-Gating: `whatsapp-canary`, `whatsapp-pairing-block`,
  `whatsapp-mention-gating`, `whatsapp-top-level-reply-shape`,
  `whatsapp-restart-resume`, `whatsapp-group-allowlist-block`.
- Native Befehle: `whatsapp-help-command`, `whatsapp-status-command`,
  `whatsapp-commands-command`, `whatsapp-tools-compact-command`,
  `whatsapp-whoami-command`, `whatsapp-context-command`,
  `whatsapp-native-new-command`.
- Antwort- und Endausgabe-Verhalten: `whatsapp-tool-only-usage-footer`,
  `whatsapp-reply-to-message`, `whatsapp-group-reply-to-message`,
  `whatsapp-reply-context-isolation`, `whatsapp-reply-delivery-shape`,
  `whatsapp-stream-final-message-accounting`.
- Eingehende Medien und strukturierte Nachrichten: `whatsapp-inbound-image-caption`,
  `whatsapp-audio-preflight`, `whatsapp-inbound-structured-messages`,
  `whatsapp-group-audio-gating`. Diese senden echte WhatsApp-Bild-, Audio-,
  Dokument-, Standort-, Kontakt- und Sticker-Events über den Treiber.
- Ausgehende Gateway- und Nachrichtenaktionsabdeckung:
  `whatsapp-outbound-media-matrix`,
  `whatsapp-outbound-document-preserves-filename`, `whatsapp-outbound-poll`,
  `whatsapp-message-actions`.
- Zugriffskontrollabdeckung: `whatsapp-access-control-dm-open`,
  `whatsapp-access-control-dm-disabled`, `whatsapp-access-control-group-open`,
  `whatsapp-access-control-group-disabled`, `whatsapp-group-allowlist-block`.
- Native Genehmigungen: `whatsapp-approval-exec-deny-native`,
  `whatsapp-approval-exec-native`, `whatsapp-approval-exec-reaction-native`,
  `whatsapp-approval-plugin-native`.
- Statusreaktionen: `whatsapp-status-reactions`.

Der Katalog enthält derzeit 36 Szenarien. Die Standard-Lane `live-frontier` wird mit 10 Szenarien für schnelle Smoke-Abdeckung klein gehalten. Die Standard-Lane `mock-openai` führt 31 deterministische Szenarien über den echten WhatsApp-Transport aus und mockt nur die Modellausgabe. Genehmigungsszenarien und einige schwerere/blockierende Prüfungen bleiben explizit nach Szenario-ID.

Der WhatsApp-QA-Treiber beobachtet strukturierte Live-Events (`text`, `media`,
`location`, `reaction` und `poll`) und kann aktiv Medien, Umfragen,
Kontakte, Standorte und Sticker senden. QA Lab importiert diesen Treiber über die
Paketoberfläche `@openclaw/whatsapp/api.js`, statt auf private
WhatsApp-Runtime-Dateien zuzugreifen. Nachrichteninhalte werden standardmäßig redigiert. Die Abdeckung für ausgehende
Umfragen und Datei-Uploads läuft über deterministische Gateway-`poll`- und
`message.action`-Aufrufe statt über rein modell-promptbasierte Tool-Aufrufe.

Ausgabeartefakte:

- `whatsapp-qa-report.md`
- `qa-evidence.json` - Evidenzeinträge für die Live-Transportprüfungen.
- `whatsapp-qa-observed-messages.json` - Texte redigiert, außer `OPENCLAW_QA_WHATSAPP_CAPTURE_CONTENT=1`.

### Convex-Zugangsdatenpool

Telegram-, Discord-, Slack- und WhatsApp-Lanes können Zugangsdaten aus einem gemeinsamen Convex-Pool leasen, statt die oben genannten Env-Vars zu lesen. Übergeben Sie `--credential-source convex` (oder setzen Sie `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`); QA Lab erwirbt einen exklusiven Lease, sendet für die Dauer des Laufs Heartbeats dafür und gibt ihn beim Herunterfahren frei. Pool-Arten sind `"telegram"`, `"discord"`, `"slack"` und `"whatsapp"`.

Payload-Formen, die der Broker bei `admin/add` validiert:

- Telegram (`kind: "telegram"`): `{ groupId: string, driverToken: string, sutToken: string }` - `groupId` muss ein numerischer Chat-ID-String sein.
- Echter Telegram-Benutzer (`kind: "telegram-user"`): `{ groupId: string, sutToken: string, testerUserId: string, testerUsername: string, telegramApiId: string, telegramApiHash: string, tdlibDatabaseEncryptionKey: string, tdlibArchiveBase64: string, tdlibArchiveSha256: string, desktopTdataArchiveBase64: string, desktopTdataArchiveSha256: string }` - nur Mantis-Telegram-Desktop-Proof. Generische QA-Lab-Lanes dürfen diese Art nicht erwerben.
- Discord (`kind: "discord"`): `{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string }`.
- WhatsApp (`kind: "whatsapp"`): `{ driverPhoneE164: string, sutPhoneE164: string, driverAuthArchiveBase64: string, sutAuthArchiveBase64: string, groupJid?: string }` - Telefonnummern müssen unterschiedliche E.164-Strings sein.

Der Mantis-Telegram-Desktop-Proof-Workflow hält einen exklusiven Convex-`telegram-user`-Lease sowohl für den TDLib-CLI-Treiber als auch für den Telegram-Desktop-Zeugen und gibt ihn nach der Veröffentlichung des Proofs wieder frei.

Wenn ein PR einen deterministischen visuellen Diff benötigt, kann Mantis dieselbe Mock-Modellantwort auf `main` und auf dem PR-Head verwenden, während sich der Telegram-Formatter oder die Zustellungsschicht ändert. Die Capture-Standards sind auf PR-Kommentare abgestimmt: Standard-Crabbox-Klasse, Desktop-Aufzeichnung mit 24 fps, Bewegungs-GIF mit 24 fps und Vorschau-Breite von 1920 px. Vorher/Nachher-Kommentare sollten ein sauberes Bundle veröffentlichen, das nur die beabsichtigten GIFs enthält.

Slack-Lanes können ebenfalls den Pool verwenden. Die Shape-Prüfungen für Slack-Payloads liegen derzeit im Slack-QA-Runner statt im Broker; verwenden Sie `{ channelId: string, driverBotToken: string, sutBotToken: string, sutAppToken: string }` mit einer Slack-Kanal-ID wie `Cxxxxxxxxxx`. Siehe [Slack-Workspace einrichten](#setting-up-the-slack-workspace) für die App- und Scope-Bereitstellung.

Operative Env-Vars und der Endpunktvertrag des Convex-Brokers stehen in [Testing → Gemeinsame Telegram-Zugangsdaten über Convex](/de/help/testing#shared-telegram-credentials-via-convex-v1) (der Abschnittsname stammt aus der Zeit vor dem Mehrkanalpool; die Lease-Semantik ist über alle Arten hinweg gemeinsam).

## Repo-gestützte Seeds

Seed-Assets liegen in `qa/`:

- `qa/scenarios/index.yaml`
- `qa/scenarios/<theme>/*.yaml`

Diese liegen absichtlich in Git, damit der QA-Plan sowohl für Menschen als auch für den Agent sichtbar ist.

`qa-lab` sollte ein generischer YAML-Szenario-Runner bleiben. Jede Szenario-YAML-Datei ist die maßgebliche Quelle für einen Testlauf und sollte definieren:

- `title` auf oberster Ebene
- `scenario`-Metadaten
- optionale Kategorie-, Capability-, Lane- und Risikometadaten in `scenario`
- Dokumentations- und Code-Refs in `scenario`
- optionale Plugin-Anforderungen in `scenario`
- optionaler Gateway-Konfigurationspatch in `scenario`
- ausführbarer `flow` auf oberster Ebene für Flow-Szenarien oder `scenario.execution.kind` /
  `scenario.execution.path` für Vitest- und Playwright-Szenarien

Die wiederverwendbare Runtime-Oberfläche, auf der `flow` basiert, darf generisch
und querschnittlich bleiben. YAML-Szenarien können zum Beispiel transportseitige
Helper mit browserseitigen Helpern kombinieren, die die eingebettete Control UI
über die Gateway-Nahtstelle `browser.request` steuern, ohne einen Sonderfall-Runner
hinzuzufügen.

Szenariodateien sollten nach Produktfunktion statt nach Quellbaumordner
gruppiert werden. Halten Sie Szenario-IDs stabil, wenn Dateien verschoben werden; verwenden Sie `docsRefs` und `codeRefs`
für die Nachverfolgbarkeit der Implementierung.

Die Baseline-Liste sollte breit genug bleiben, um Folgendes abzudecken:

- DM- und Kanal-Chat
- Thread-Verhalten
- Lebenszyklus von Nachrichtenaktionen
- Cron-Callbacks
- Speicherabruf
- Modellwechsel
- Subagent-Übergabe
- Repository-Lesen und Dokumentations-Lesen
- eine kleine Build-Aufgabe wie Lobster Invaders

## Provider-Mock-Lanes

`qa suite` hat zwei lokale Provider-Mock-Lanes:

- `mock-openai` ist der szenariobewusste OpenClaw-Mock. Er bleibt die standardmäßige
  deterministische Mock-Lane für repositorygestützte QA- und Paritäts-Gates.
- `aimock` startet einen AIMock-gestützten Provider-Server für experimentelle Protokoll-,
  Fixture-, Record/Replay- und Chaos-Abdeckung. Er ist additiv und ersetzt nicht
  den `mock-openai`-Szenario-Dispatcher.

Die Implementierung der Provider-Lanes liegt unter `extensions/qa-lab/src/providers/`.
Jeder Provider besitzt seine Defaults, den Start des lokalen Servers, die Gateway-Modellkonfiguration,
Anforderungen für das Staging von Auth-Profilen sowie Live-/Mock-Capability-Flags. Gemeinsamer Suite- und
Gateway-Code sollte über die Provider-Registry routen, statt auf
Provider-Namen zu verzweigen.

## Transportadapter

`qa-lab` besitzt eine generische Transport-Nahtstelle für YAML-QA-Szenarien. `qa-channel` ist
der synthetische Standard. `crabline` startet lokale providerförmige Server und führt
die normalen Kanal-Plugins von OpenClaw gegen sie aus. `live` ist für echte
Provider-Anmeldedaten und externe Kanäle reserviert.

Auf Architekturebene ist die Aufteilung:

- `qa-lab` besitzt generische Szenarioausführung, Worker-Parallelität, Artefaktschreiben und Reporting.
- Der Transportadapter besitzt Gateway-Konfiguration, Bereitschaft, eingehende und ausgehende Beobachtung, Transportaktionen und normalisierten Transportzustand.
- YAML-Szenariodateien unter `qa/scenarios/` definieren den Testlauf; `qa-lab` stellt die wiederverwendbare Runtime-Oberfläche bereit, die sie ausführt.

### Einen Kanal hinzufügen

Das Hinzufügen eines Kanals zum YAML-QA-System erfordert die Kanalimplementierung plus
ein Szenariopaket, das den Kanalvertrag ausübt. Für Smoke-CI-Abdeckung fügen Sie
den passenden gefälschten Crabline-Provider-Server hinzu und machen ihn über den `crabline`-
Treiber verfügbar.

Fügen Sie keinen neuen QA-Befehlsstamm auf oberster Ebene hinzu, wenn der gemeinsame `qa-lab`-Host den Flow besitzen kann.

`qa-lab` besitzt die gemeinsamen Host-Mechaniken:

- den Befehlsstamm `openclaw qa`
- Suite-Start und -Bereinigung
- Worker-Parallelität
- Artefaktschreiben
- Berichtsgenerierung
- Szenarioausführung
- Kompatibilitätsaliasse für ältere `qa-channel`-Szenarien

Runner-Plugins besitzen den Transportvertrag:

- wie `openclaw qa <runner>` unterhalb des gemeinsamen `qa`-Stamms eingehängt wird
- wie das Gateway für diesen Transport konfiguriert wird
- wie Bereitschaft geprüft wird
- wie eingehende Ereignisse injiziert werden
- wie ausgehende Nachrichten beobachtet werden
- wie Transkripte und normalisierter Transportzustand bereitgestellt werden
- wie transportgestützte Aktionen ausgeführt werden
- wie transportspezifisches Zurücksetzen oder Aufräumen behandelt wird

Die Mindestanforderung für die Einführung eines neuen Kanals:

1. Belassen Sie `qa-lab` als Besitzer des gemeinsamen `qa`-Stamms.
2. Implementieren Sie den Transport-Runner auf der gemeinsamen Host-Nahtstelle von `qa-lab`.
3. Halten Sie transportspezifische Mechaniken innerhalb des Runner-Plugins oder Kanal-Harness.
4. Hängen Sie den Runner als `openclaw qa <runner>` ein, statt einen konkurrierenden Stammbefehl zu registrieren. Runner-Plugins sollten `qaRunners` in `openclaw.plugin.json` deklarieren und ein passendes `qaRunnerCliRegistrations`-Array aus `runtime-api.ts` exportieren. Halten Sie `runtime-api.ts` leichtgewichtig; Lazy-CLI- und Runner-Ausführung sollten hinter separaten Einstiegspunkten bleiben.
5. Erstellen oder adaptieren Sie YAML-Szenarien unter den thematischen Verzeichnissen `qa/scenarios/`.
6. Verwenden Sie die generischen Szenario-Helper für neue Szenarien.
7. Halten Sie bestehende Kompatibilitätsaliasse funktionsfähig, sofern das Repository keine absichtliche Migration durchführt.

Die Entscheidungsregel ist strikt:

- Wenn Verhalten einmal in `qa-lab` ausgedrückt werden kann, gehört es in `qa-lab`.
- Wenn Verhalten von einem Kanaltransport abhängt, halten Sie es in diesem Runner-Plugin oder Plugin-Harness.
- Wenn ein Szenario eine neue Capability benötigt, die mehr als ein Kanal verwenden kann, fügen Sie einen generischen Helper hinzu statt einer kanalspezifischen Verzweigung in `suite.ts`.
- Wenn ein Verhalten nur für einen Transport sinnvoll ist, halten Sie das Szenario transportspezifisch und machen Sie dies im Szenariovertrag explizit.

### Namen von Szenario-Helpern

Bevorzugte generische Helper für neue Szenarien:

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

Kompatibilitätsaliasse bleiben für bestehende Szenarien verfügbar - `waitForQaChannelReady`, `waitForOutboundMessage`, `waitForNoOutbound`, `formatConversationTranscript`, `resetBus` -, aber neue Szenarioerstellung sollte die generischen Namen verwenden. Die Aliasse existieren, um eine Flag-Day-Migration zu vermeiden, nicht als zukünftiges Modell.

## Reporting

`qa-lab` exportiert einen Markdown-Protokollbericht aus der beobachteten Bus-Zeitleiste.
Der Bericht sollte beantworten:

- Was funktioniert hat
- Was fehlgeschlagen ist
- Was blockiert geblieben ist
- Welche Folgeszenarien hinzufügenswert sind

Für das Inventar verfügbarer Szenarien - nützlich beim Dimensionieren von Folgearbeiten oder beim Verdrahten eines neuen Transports - führen Sie `pnpm openclaw qa coverage` aus (fügen Sie `--json` für maschinenlesbare Ausgabe hinzu).
Wenn Sie fokussierten Nachweis für ein berührtes Verhalten oder einen Dateipfad auswählen, führen Sie `pnpm openclaw qa coverage --match <query>` aus.
Der Trefferbericht durchsucht Szenariometadaten, Doku-Refs, Code-Refs, Coverage-IDs, Plugins und Provider-Anforderungen und gibt dann passende `qa suite --scenario ...`-Ziele aus.
Jeder `qa suite`-Lauf schreibt Artefakte auf oberster Ebene:
`qa-evidence.json`,
`qa-suite-summary.json` und `qa-suite-report.md` für den ausgewählten
Szenariosatz. Szenarien, die `execution.kind: vitest` oder
`execution.kind: playwright` deklarieren, führen den passenden Testpfad aus und schreiben außerdem
szenariospezifische Logs. Szenarien, die `execution.kind: script` deklarieren, führen den
Evidenzproduzenten unter `execution.path` über `node --import tsx` aus (wobei
`${outputDir}` und `${scenarioId}` in `execution.args` expandiert werden); der Produzent
schreibt seine eigene `qa-evidence.json`, deren Einträge in die Suite-
Ausgabe importiert werden und deren Artefaktpfade relativ zu dieser Produzenten-
`qa-evidence.json` aufgelöst werden. Wenn `qa suite` über
`qa run --qa-profile` erreicht wird, enthält dieselbe `qa-evidence.json` auch die Profil-
Scorecard-Zusammenfassung für die ausgewählten Taxonomiekategorien.
Behandeln Sie dies als Ermittlungshilfe, nicht als Ersatz für Gates; das ausgewählte Szenario benötigt weiterhin den richtigen Provider-Modus, Live-Transport, Multipass, Testbox oder die Release-Lane für das zu testende Verhalten.
Scorecard-Kontext finden Sie unter [Reifegrad-Scorecard](/de/maturity/scorecard).

Für Zeichen- und Stilprüfungen führen Sie dasselbe Szenario über mehrere Live-Modell-
Refs aus und schreiben einen bewerteten Markdown-Bericht:

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

Der Befehl führt lokale QA-Gateway-Kindprozesse aus, nicht Docker. Character-Eval-
Szenarien sollten die Persona über `SOUL.md` setzen und dann gewöhnliche Benutzer-Turns
wie Chat, Workspace-Hilfe und kleine Dateiaufgaben ausführen. Dem Kandidatenmodell sollte
nicht mitgeteilt werden, dass es evaluiert wird. Der Befehl bewahrt jedes vollständige
Transkript auf, zeichnet grundlegende Laufstatistiken auf und bittet dann die Judge-Modelle im Fast-Modus mit
`xhigh`-Reasoning, wo unterstützt, die Läufe nach Natürlichkeit, Vibe und Humor zu bewerten.
Verwenden Sie `--blind-judge-models`, wenn Sie Provider vergleichen: Der Judge-Prompt erhält weiterhin
jedes Transkript und jeden Laufstatus, aber Kandidaten-Refs werden durch neutrale
Labels wie `candidate-01` ersetzt; der Bericht ordnet Rankings nach dem Parsen wieder realen Refs zu.
Kandidatenläufe verwenden standardmäßig `high` Thinking, mit `medium` für GPT-5.5 und `xhigh`
für ältere OpenAI-Eval-Refs, die dies unterstützen. Überschreiben Sie einen bestimmten Kandidaten inline mit
`--model provider/model,thinking=<level>`. `--thinking <level>` setzt weiterhin einen
globalen Fallback, und die ältere Form `--model-thinking <provider/model=level>` wird
aus Kompatibilitätsgründen beibehalten.
OpenAI-Kandidaten-Refs verwenden standardmäßig den Fast-Modus, damit Priority Processing dort genutzt wird,
wo der Provider es unterstützt. Fügen Sie `,fast`, `,no-fast` oder `,fast=false` inline hinzu, wenn ein
einzelner Kandidat oder Judge eine Überschreibung benötigt. Übergeben Sie `--fast` nur, wenn Sie
den Fast-Modus für jedes Kandidatenmodell erzwingen möchten. Kandidaten- und Judge-Dauern werden
für Benchmark-Analysen im Bericht aufgezeichnet, aber Judge-Prompts sagen ausdrücklich,
nicht nach Geschwindigkeit zu bewerten.
Kandidaten- und Judge-Modellläufe verwenden beide standardmäßig Parallelität 16. Senken Sie
`--concurrency` oder `--judge-concurrency`, wenn Provider-Limits oder lokaler Gateway-
Druck einen Lauf zu verrauscht machen.
Wenn kein Kandidaten-`--model` übergeben wird, verwendet die Character-Eval standardmäßig
`openai/gpt-5.5`, `openai/gpt-5.2`, `openai/gpt-5`, `anthropic/claude-opus-4-8`,
`anthropic/claude-sonnet-4-6`, `zai/glm-5.1`,
`moonshot/kimi-k2.5` und
`google/gemini-3.1-pro-preview`, wenn kein `--model` übergeben wird.
Wenn kein `--judge-model` übergeben wird, verwenden die Judges standardmäßig
`openai/gpt-5.5,thinking=xhigh,fast` und
`anthropic/claude-opus-4-8,thinking=high`.

## Verwandte Dokumentation

- [Matrix-QA](/de/concepts/qa-matrix)
- [Reifegrad-Scorecard](/de/maturity/scorecard)
- [Benchmark-Paket für persönliche Agenten](/de/concepts/personal-agent-benchmark-pack)
- [QA-Kanal](/de/channels/qa-channel)
- [Testen](/de/help/testing)
- [Dashboard](/de/web/dashboard)
