---
read_when:
    - Verstehen, wie der QA-Stack zusammenpasst
    - qa-lab, qa-channel oder einen Transportadapter erweitern
    - Repo-gestützte QA-Szenarien hinzufügen
    - QA-Automatisierung mit höherem Realitätsgrad rund um das Gateway-Dashboard
summary: 'Überblick über den QA-Stack: qa-lab, qa-channel, Repository-gestützte Szenarien, Live-Transport-Lanes, Transportadapter und Reporting.'
title: QA-Überblick
x-i18n:
    generated_at: "2026-06-30T13:54:07Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5bffd191f985255f5c830d4e3d1c4ffa250097848195bc58d74104474448e3e1
    source_path: concepts/qa-e2e-automation.md
    workflow: 16
---

Der private QA-Stack soll OpenClaw auf realistischere,
channel-geprägte Weise testen, als es ein einzelner Unit-Test kann.

Aktuelle Bestandteile:

- `extensions/qa-channel`: synthetischer Nachrichten-Channel mit DM-, Channel-, Thread-,
  Reaction-, Edit- und Delete-Oberflächen.
- `extensions/qa-lab`: Debugger-UI und QA-Bus zum Beobachten des Transkripts,
  Einspeisen eingehender Nachrichten und Exportieren eines Markdown-Berichts.
- `extensions/qa-matrix`, zukünftige Runner-Plugins: Live-Transport-Adapter, die
  einen echten Channel innerhalb eines untergeordneten QA-Gateways steuern.
- `qa/`: repo-gestützte Seed-Assets für die Kickoff-Aufgabe und Baseline-QA-
  Szenarien.
- [Mantis](/de/concepts/mantis): Vorher-/Nachher-Live-Verifikation für Fehler, die
  echte Transports, Browser-Screenshots, VM-Zustand und PR-Nachweise benötigen.

## Befehlsoberfläche

Jeder QA-Flow läuft unter `pnpm openclaw qa <subcommand>`. Viele haben `pnpm qa:*`-
Skript-Aliase; beide Formen werden unterstützt.

| Befehl                                             | Zweck                                                                                                                                                                                                                                                                 |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `qa run`                                            | Gebündelter QA-Selbsttest ohne `--qa-profile`; taxonomiegestützter Maturity-Profil-Runner mit `--qa-profile smoke-ci`, `--qa-profile release` oder `--qa-profile all`.                                                                                                      |
| `qa suite`                                          | Führt repo-gestützte Szenarien gegen die QA-Gateway-Lane aus. Aliase: `pnpm openclaw qa suite --runner multipass` für eine wegwerfbare Linux-VM.                                                                                                                                  |
| `qa coverage`                                       | Gibt das YAML-Szenario-Coverage-Inventar aus (`--json` für maschinenlesbare Ausgabe).                                                                                                                                                                                               |
| `qa parity-report`                                  | Vergleicht zwei `qa-suite-summary.json`-Dateien und schreibt den agentischen Paritätsbericht, oder verwendet `--runtime-axis --token-efficiency`, um Codex-vs-OpenClaw-Runtime-Paritäts- und Token-Effizienz-Berichte aus einer Runtime-Pair-Zusammenfassung zu schreiben.                                         |
| `qa character-eval`                                 | Führt das Character-QA-Szenario über mehrere Live-Modelle hinweg mit einem bewerteten Bericht aus. Siehe [Berichterstattung](#reporting).                                                                                                                                                            |
| `qa manual`                                         | Führt einen einmaligen Prompt gegen die ausgewählte Provider-/Modell-Lane aus.                                                                                                                                                                                                          |
| `qa ui`                                             | Startet die QA-Debugger-UI und den lokalen QA-Bus (Alias: `pnpm qa:lab:ui`).                                                                                                                                                                                                    |
| `qa docker-build-image`                             | Baut das vorgefertigte QA-Docker-Image.                                                                                                                                                                                                                                     |
| `qa docker-scaffold`                                | Schreibt ein docker-compose-Gerüst für das QA-Dashboard und die Gateway-Lane.                                                                                                                                                                                                    |
| `qa up`                                             | Baut die QA-Site, startet den Docker-gestützten Stack und gibt die URL aus (Alias: `pnpm qa:lab:up`; die Variante `:fast` ergänzt `--use-prebuilt-image --bind-ui-dist --skip-ui-build`).                                                                                                  |
| `qa aimock`                                         | Startet nur den AIMock-Provider-Server.                                                                                                                                                                                                                                  |
| `qa mock-openai`                                    | Startet nur den szenariobewussten `mock-openai`-Provider-Server.                                                                                                                                                                                                            |
| `qa credentials doctor` / `add` / `list` / `remove` | Verwaltet den gemeinsamen Convex-Anmeldeinformations-Pool.                                                                                                                                                                                                                               |
| `qa matrix`                                         | Live-Transport-Lane gegen einen wegwerfbaren Tuwunel-Homeserver. Siehe [Matrix QA](/de/concepts/qa-matrix).                                                                                                                                                                      |
| `qa telegram`                                       | Live-Transport-Lane gegen eine echte private Telegram-Gruppe.                                                                                                                                                                                                              |
| `qa discord`                                        | Live-Transport-Lane gegen einen echten privaten Discord-Guild-Channel.                                                                                                                                                                                                       |
| `qa slack`                                          | Live-Transport-Lane gegen einen echten privaten Slack-Channel.                                                                                                                                                                                                               |
| `qa whatsapp`                                       | Live-Transport-Lane gegen echte WhatsApp Web-Konten.                                                                                                                                                                                                                 |
| `qa mantis`                                         | Vorher-/Nachher-Verifikations-Runner für Live-Transport-Fehler, mit Discord-Status-Reactions-Nachweis, Crabbox-Desktop-/Browser-Smoke und Slack-in-VNC-Smoke. Siehe [Mantis](/de/concepts/mantis) und [Mantis Slack Desktop Runbook](/de/concepts/mantis-slack-desktop-runbook). |

Profilgestütztes `qa run` liest die Mitgliedschaft aus `taxonomy.yaml` und
dispatcht dann die aufgelösten Szenarien über `qa suite`. `--surface` und
`--category` filtern das ausgewählte Profil, statt separate Lanes zu definieren.
Die resultierende `qa-evidence.json` enthält eine Profil-Scorecard-Zusammenfassung mit
Zählungen ausgewählter Kategorien und fehlenden Coverage-IDs; die einzelnen Evidence-
Einträge bleiben die maßgebliche Quelle für Tests, Coverage-Rollen und Ergebnisse.
Taxonomie-Feature-Coverage-IDs sind exakte Nachweisziele, keine Aliase. Primäre
Szenario-Coverage erfüllt passende IDs; sekundäre Coverage bleibt beratend.
Coverage-IDs verwenden die punktierte Form `namespace.behavior` mit kleingeschriebenen
alphanumerischen Segmenten bzw. Bindestrich-Segmenten; Profil-, Surface- und Kategorie-IDs können weiterhin
die bestehenden gestrichelten oder punktierten Taxonomie-IDs verwenden.
Schlanke Evidence lässt `execution` pro Eintrag aus und setzt `evidenceMode: "slim"`;
`smoke-ci` verwendet standardmäßig schlanke Evidence, und `--evidence-mode full` stellt vollständige Einträge wieder her:

```bash
pnpm openclaw qa run \
  --qa-profile smoke-ci \
  --category channel-framework.conversation-routing-and-delivery \
  --provider-mode mock-openai \
  --output-dir .artifacts/qa-e2e/smoke-ci-profile-dispatch
```

Verwenden Sie `smoke-ci` für deterministische Profilnachweise mit Mock-Modell-Providern und
lokalen Crabline-Provider-Servern. Verwenden Sie `release` für Stable-/LTS-Nachweise gegen Live-
Channels. Verwenden Sie `all` nur für explizite Full-Taxonomy-Evidence-Läufe; es wählt
jede aktive Maturity-Kategorie aus und kann über den Workflow `QA Profile
Evidence` mit `qa_profile=all` dispatcht werden. Wenn ein Befehl auch ein OpenClaw-
Root-Profil benötigt, setzen Sie das Root-Profil vor den QA-Befehl:

```bash
pnpm openclaw --profile work qa run --qa-profile smoke-ci
```

## Operator-Flow

Der aktuelle QA-Operator-Flow ist eine zweigeteilte QA-Site:

- Links: Gateway-Dashboard (Control UI) mit dem Agenten.
- Rechts: QA Lab, das das Slack-ähnliche Transkript und den Szenarioplan zeigt.

Führen Sie ihn aus mit:

```bash
pnpm qa:lab:up
```

Das baut die QA-Site, startet die Docker-gestützte Gateway-Lane und stellt die
QA-Lab-Seite bereit, auf der ein Operator oder eine Automatisierungsschleife dem Agenten eine QA-
Mission geben, echtes Channel-Verhalten beobachten und erfassen kann, was funktioniert hat, fehlgeschlagen ist oder
blockiert blieb.

Für schnellere QA-Lab-UI-Iteration ohne jedes Mal das Docker-Image neu zu bauen,
starten Sie den Stack mit einem bind-gemounteten QA-Lab-Bundle:

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` hält die Docker-Services auf einem vorgefertigten Image und bind-mountet
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
und prüft die releasekritische Form:
`openclaw.run`, `openclaw.harness.run`, ein neuester GenAI-Semantic-Convention-
Modellaufruf-Span, `openclaw.context.assembled` und `openclaw.message.delivery`
müssen vorhanden sein. Der Smoke erzwingt
`OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`, daher muss der Modellaufruf-
Span den Namen `{gen_ai.operation.name} {gen_ai.request.model}` verwenden;
Modellaufrufe dürfen bei erfolgreichen Turns kein `StreamAbandoned` exportieren; rohe Diagnose-IDs und
`openclaw.content.*`-Attribute müssen aus dem Trace herausbleiben. Die rohen OTLP-
Payloads dürfen weder den Prompt-Sentinel, den Response-Sentinel noch den QA-Session-
Key enthalten. Er schreibt `otel-smoke-summary.json` neben die QA-Suite-Artefakte.

Für einen Collector-gestützten OpenTelemetry-Smoke führen Sie aus:

```bash
pnpm qa:otel:collector-smoke
```

Diese Lane setzt einen echten OpenTelemetry-Collector-Docker-Container vor denselben
lokalen Receiver. Verwenden Sie sie, wenn Sie Endpoint-Verdrahtung, Collector-
Kompatibilität oder OTLP-Exportverhalten ändern, das der In-Process-Receiver maskieren könnte.

Für den geschützten Prometheus-Scrape-Smoke führen Sie aus:

```bash
pnpm qa:prometheus:smoke
```

Dieser Alias führt das QA-Szenario `docker-prometheus-smoke` mit aktiviertem
`diagnostics-prometheus` aus, verifiziert, dass nicht authentifizierte Scrapes
abgelehnt werden, und prüft anschließend, dass der authentifizierte Scrape
releasekritische Metrikfamilien ohne Prompt-Inhalte, Antwortinhalte, rohe
Diagnosekennungen, Auth-Token oder lokale Pfade enthält.

Um beide Observability-Smokes direkt nacheinander auszuführen, verwenden Sie:

```bash
pnpm qa:observability:smoke
```

Für die collector-gestützte OpenTelemetry-Lane plus den geschützten
Prometheus-Scrape-Smoke verwenden Sie:

```bash
pnpm qa:observability:collector-smoke
```

Observability-QA bleibt ausschließlich Source-Checkout-basiert. Der npm-Tarball
lässt QA Lab absichtlich aus, daher führen Docker-Package-Release-Lanes keine
`qa`-Befehle aus. Verwenden Sie `pnpm qa:otel:smoke`,
`pnpm qa:prometheus:smoke` oder `pnpm qa:observability:smoke` aus einem
gebauten Source-Checkout, wenn Sie die Diagnoseinstrumentierung ändern.

Für eine transportechte Matrix-Smoke-Lane, die keine Zugangsdaten für
Modell-Provider benötigt, führen Sie das schnelle Profil mit dem deterministischen
Mock-OpenAI-Provider aus:

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

Die vollständige CLI-Referenz, der Profil-/Szenariokatalog, Env-Vars und das Artefaktlayout für diese Lane finden Sie unter [Matrix-QA](/de/concepts/qa-matrix). Kurz zusammengefasst: Sie stellt einen wegwerfbaren Tuwunel-Homeserver in Docker bereit, registriert temporäre Driver-/SUT-/Observer-Benutzer, führt das echte Matrix-Plugin innerhalb eines untergeordneten QA-Gateway aus, das auf diesen Transport beschränkt ist (kein `qa-channel`), und schreibt anschließend einen Markdown-Bericht, eine JSON-Zusammenfassung, ein Observed-Events-Artefakt und ein kombiniertes Ausgabelog unter `.artifacts/qa-e2e/matrix-<timestamp>/`.

Die Szenarien decken Transportverhalten ab, das Unit-Tests nicht Ende zu Ende beweisen können: Mention-Gating, Allow-Bot-Richtlinien, Allowlists, Top-Level- und Thread-Antworten, DM-Routing, Reaktionsbehandlung, Unterdrückung eingehender Bearbeitungen, Restart-Replay-Deduplizierung, Wiederherstellung nach Homeserver-Unterbrechungen, Zustellung von Genehmigungsmetadaten, Medienbehandlung sowie Matrix-E2EE-Bootstrap-/Wiederherstellungs-/Verifizierungsabläufe. Das E2EE-CLI-Profil führt außerdem `openclaw matrix encryption setup` und Verifizierungsbefehle über denselben wegwerfbaren Homeserver aus, bevor Gateway-Antworten geprüft werden.

Discord hat außerdem nur für Mantis aktivierbare Opt-in-Szenarien zur Bug-Reproduktion. Verwenden Sie
`--scenario discord-status-reactions-tool-only` für die explizite Statusreaktions-
Timeline oder `--scenario discord-thread-reply-filepath-attachment`, um einen
echten Discord-Thread zu erstellen und zu verifizieren, dass `message.thread-reply`
einen `filePath`-Anhang beibehält. Diese Szenarien bleiben außerhalb der
standardmäßigen Live-Discord-Lane, weil sie Vorher-/Nachher-Repro-Sonden und
keine breite Smoke-Abdeckung sind.
Der Thread-Anhang-Mantis-Workflow kann außerdem ein angemeldetes Discord-Web-
Zeugenvideo hinzufügen, wenn `MANTIS_DISCORD_VIEWER_CHROME_PROFILE_DIR` oder
`MANTIS_DISCORD_VIEWER_CHROME_PROFILE_TGZ_B64` in der QA-Umgebung konfiguriert ist.
Dieses Viewer-Profil dient nur der visuellen Erfassung; die Pass/Fail-
Entscheidung kommt weiterhin vom Discord-REST-Oracle.

CI verwendet dieselbe Befehlsoberfläche in `.github/workflows/qa-live-transports-convex.yml`.
Geplante und standardmäßige manuelle Läufe führen das schnelle Matrix-Profil mit
von QA bereitgestellten Live-Frontier-Zugangsdaten, `--fast` und
`OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS=3000` aus. Manuelles `matrix_profile=all`
fächert in die fünf Profil-Shards auf.

Für transportechte Telegram-, Discord-, Slack- und WhatsApp-Smoke-Lanes:

```bash
pnpm openclaw qa telegram
pnpm openclaw qa discord
pnpm openclaw qa slack
pnpm openclaw qa whatsapp
```

Sie zielen auf einen bereits vorhandenen echten Kanal mit zwei Bots oder Konten (Driver + SUT). Erforderliche Env-Vars, Szenariolisten, Ausgabeartefakte und der Convex-Zugangsdaten-Pool sind unten in der [QA-Referenz für Telegram, Discord, Slack und WhatsApp](#telegram-discord-slack-and-whatsapp-qa-reference) dokumentiert.

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
Crabbox-Desktop-/Browser-Leases stellen die Erfassungswerkzeuge und
Browser-/Native-Build-Hilfspakete vorab bereit, daher sollte das Szenario
Fallbacks nur auf älteren Leases installieren. Mantis meldet Gesamt- und
Phasenzeiten in `mantis-slack-desktop-smoke-report.md`, sodass langsame Läufe
zeigen, ob die Zeit in Lease-Warmup, Zugangsdatenbeschaffung, Remote-Setup oder
Artefaktkopie geflossen ist. Verwenden Sie `--lease-id <cbx_...>` erneut, nachdem
Sie sich manuell über VNC bei Slack Web angemeldet haben; wiederverwendete Leases
halten außerdem den pnpm-Store-Cache von Crabbox warm. Der Standard
`--hydrate-mode source` verifiziert aus einem Source-Checkout und führt
Installation/Build innerhalb der VM aus. Verwenden Sie `--hydrate-mode prehydrated`
nur, wenn der wiederverwendete Remote-Workspace bereits `node_modules` und ein
gebautes `dist/` enthält; dieser Modus überspringt den teuren Installations-/Build-
Schritt und schlägt geschlossen fehl, wenn der Workspace nicht bereit ist.
Mit `--gateway-setup` lässt Mantis ein persistentes OpenClaw-Slack-Gateway
innerhalb der VM auf Port `38973` laufen; ohne diese Option führt der Befehl die
normale Bot-zu-Bot-Slack-QA-Lane aus und beendet sich nach der Artefakterfassung.

Um die native Slack-Genehmigungs-UI mit Desktop-Nachweis zu belegen, führen Sie
den Mantis-Genehmigungs-Checkpoint-Modus aus:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --approval-checkpoints \
  --credential-source convex \
  --credential-role maintainer
```

Dieser Modus schließt sich gegenseitig mit `--gateway-setup` aus. Er führt die
Slack-Genehmigungsszenarien aus, lehnt Nicht-Genehmigungs-Szenario-IDs ab, wartet
bei jedem ausstehenden und aufgelösten Genehmigungszustand, rendert die beobachtete
Slack-API-Nachricht in `approval-checkpoints/<scenario>-pending.png` und
`approval-checkpoints/<scenario>-resolved.png` und schlägt dann fehl, wenn ein
Checkpoint, ein Nachrichtennachweis, eine Bestätigung oder ein gerenderter
Screenshot fehlt oder leer ist. Kalte CI-Leases können in `slack-desktop-smoke.png`
weiterhin die Slack-Anmeldung zeigen; die Genehmigungs-Checkpoint-Bilder sind der
visuelle Nachweis für diese Lane.

Die Operator-Checkliste, der GitHub-Workflow-Dispatch-Befehl, der Evidence-Comment-
Vertrag, die Hydrate-Mode-Entscheidungstabelle, die Zeitinterpretation und die
Schritte zur Fehlerbehandlung finden Sie im [Mantis Slack Desktop Runbook](/de/concepts/mantis-slack-desktop-runbook).

Für eine Desktop-Aufgabe im Agent-/CV-Stil führen Sie aus:

```bash
pnpm openclaw qa mantis visual-task \
  --browser-url https://example.net \
  --expect-text "Example Domain" \
  --vision-model openai/gpt-5.5
```

`visual-task` least oder wiederverwendet eine Crabbox-Desktop-/Browser-Maschine,
startet `crabbox record --while`, steuert den sichtbaren Browser über einen
verschachtelten `visual-driver`, erfasst `visual-task.png`, führt `openclaw infer image describe`
gegen den Screenshot aus, wenn `--vision-mode image-describe` ausgewählt ist, und
schreibt `visual-task.mp4`, `mantis-visual-task-summary.json`,
`mantis-visual-task-driver-result.json` und `mantis-visual-task-report.md`.
Wenn `--expect-text` gesetzt ist, fragt der Vision-Prompt nach einem strukturierten
JSON-Urteil und besteht nur, wenn das Modell positive sichtbare Belege meldet; eine
negative Antwort, die lediglich den Zieltext zitiert, schlägt die Assertion fehl.
Verwenden Sie `--vision-mode metadata` für einen No-Model-Smoke, der Desktop-,
Browser-, Screenshot- und Video-Plumbing ohne Aufruf eines Image-Understanding-
Providers belegt. Die Aufzeichnung ist ein erforderliches Artefakt für
`visual-task`; wenn Crabbox kein nicht leeres `visual-task.mp4` aufzeichnet,
schlägt die Aufgabe auch dann fehl, wenn der Visual-Driver bestanden hat. Bei
Fehlern behält Mantis die Lease für VNC, es sei denn, die Aufgabe hatte bereits
bestanden und `--keep-lease` war nicht gesetzt.

Bevor Sie gepoolte Live-Zugangsdaten verwenden, führen Sie aus:

```bash
pnpm openclaw qa credentials doctor
```

Der Doctor prüft die Convex-Broker-Env, validiert Endpunkteinstellungen und verifiziert Admin-/List-Erreichbarkeit, wenn das Maintainer-Secret vorhanden ist. Für Secrets meldet er nur den Status gesetzt/fehlend.

## Live-Transportabdeckung

Live-Transport-Lanes teilen sich einen Vertrag, statt jeweils eine eigene Form für Szenariolisten zu erfinden. `qa-channel` ist die breite synthetische Suite für Produktverhalten und ist nicht Teil der Live-Transport-Abdeckungsmatrix.

Live-Transport-Runner sollten die gemeinsamen Szenario-IDs, Baseline-
Abdeckungshelfer und den Szenarioauswahlhelfer aus
`openclaw/plugin-sdk/qa-live-transport-scenarios` importieren.

| Lane     | Canary | Mention-Gating | Bot-zu-Bot | Allowlist-Blockierung | Top-Level-Antwort | Zitatantwort | Restart-Fortsetzung | Thread-Fortsetzung | Thread-Isolation | Reaktionsbeobachtung | Hilfebefehl | Native Befehlsregistrierung |
| -------- | ------ | -------------- | ---------- | --------------------- | ----------------- | ------------ | ------------------- | ------------------ | ---------------- | --------------------- | ----------- | --------------------------- |
| Matrix   | x      | x              | x          | x                     | x                 |              | x                   | x                  | x                | x                     |             |                             |
| Telegram | x      | x              | x          |                       |                   |              |                     |                    |                  |                       | x           |                             |
| Discord  | x      | x              | x          |                       |                   |              |                     |                    |                  |                       |             | x                           |
| Slack    | x      | x              | x          | x                     | x                 |              | x                   | x                  | x                |                       |             |                             |
| WhatsApp | x      | x              |            | x                     | x                 | x            | x                   |                    |                  | x                     | x           |                             |

So bleibt `qa-channel` die breite Suite für Produktverhalten, während Matrix,
Telegram und andere Live-Transporte eine gemeinsame explizite Transportvertrags-
Checkliste teilen.

Für eine wegwerfbare Linux-VM-Lane, ohne Docker in den QA-Pfad einzubeziehen, führen Sie aus:

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

Dies startet einen frischen Multipass-Gast, installiert Abhängigkeiten, baut
OpenClaw innerhalb des Gasts, führt `qa suite` aus und kopiert anschließend den
normalen QA-Bericht und die Zusammenfassung zurück nach `.artifacts/qa-e2e/...`
auf dem Host.
Es verwendet dasselbe Szenarioauswahlverhalten wie `qa suite` auf dem Host.
Host- und Multipass-Suite-Läufe führen mehrere ausgewählte Szenarien standardmäßig
parallel mit isolierten Gateway-Workern aus. `qa-channel` verwendet standardmäßig
Concurrency 4, begrenzt durch die Anzahl der ausgewählten Szenarien. Verwenden Sie
`--concurrency <count>`, um die Worker-Anzahl anzupassen, oder `--concurrency 1`
für serielle Ausführung.
Verwenden Sie `--pack personal-agent`, um das Benchmark-Pack für persönliche
Assistenten auszuführen. Der Pack-Selector ist additiv mit wiederholten
`--scenario`-Flags: explizite Szenarien laufen zuerst, danach Pack-Szenarien in
Pack-Reihenfolge mit entfernten Duplikaten.
Verwenden Sie `--pack observability`, wenn ein benutzerdefinierter QA-Runner
bereits das OpenTelemetry-Collector-Setup bereitstellt und die OpenTelemetry- und
Prometheus-Diagnose-Smoke-Szenarien gemeinsam auswählen soll.
Der Befehl beendet sich mit einem Nicht-Null-Code, wenn ein Szenario fehlschlägt.
Verwenden Sie `--allow-failures`, wenn Sie Artefakte ohne fehlschlagenden Exit-Code
erhalten möchten.
Live-Läufe leiten die unterstützten QA-Auth-Eingaben weiter, die für den Gast
praktikabel sind: env-basierte Provider-Schlüssel, den QA-Live-Provider-
Konfigurationspfad und `CODEX_HOME`, wenn vorhanden. Halten Sie `--output-dir`
unter dem Repo-Root, damit der Gast über den gemounteten Workspace zurückschreiben
kann.

## QA-Referenz für Telegram, Discord, Slack und WhatsApp

Matrix hat eine [eigene Seite](/de/concepts/qa-matrix), wegen der Anzahl der Szenarien und der Docker-gestützten Homeserver-Bereitstellung. Telegram, Discord, Slack und WhatsApp laufen gegen bereits vorhandene reale Transporte, daher befindet sich ihre Referenz hier.

### Gemeinsame CLI-Flags

Diese Lanes registrieren sich über `extensions/qa-lab/src/live-transports/shared/live-transport-cli.ts` und akzeptieren dieselben Flags:

| Flag                                  | Standard                                           | Beschreibung                                                                                                                                                        |
| ------------------------------------- | -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--scenario <id>`                     | -                                                  | Führt nur dieses Szenario aus. Wiederholbar.                                                                                                                        |
| `--output-dir <path>`                 | `<repo>/.artifacts/qa-e2e/<transport>-<timestamp>` | Speicherort für Berichte, Zusammenfassungen, Nachweise, transportspezifische Artefakte und das Ausgabeprotokoll. Relative Pfade werden relativ zu `--repo-root` aufgelöst. |
| `--repo-root <path>`                  | `process.cwd()`                                    | Repository-Wurzel, wenn der Aufruf aus einem neutralen Arbeitsverzeichnis erfolgt.                                                                                  |
| `--sut-account <id>`                  | `sut`                                              | Temporäre Konto-ID innerhalb der QA-Gateway-Konfiguration.                                                                                                          |
| `--provider-mode <mode>`              | `live-frontier`                                    | `mock-openai` oder `live-frontier` (das Legacy-`live-openai` funktioniert weiterhin).                                                                                |
| `--model <ref>` / `--alt-model <ref>` | Provider-Standard                                  | Primäre/alternative Modell-Refs.                                                                                                                                    |
| `--fast`                              | aus                                                | Schneller Provider-Modus, sofern unterstützt.                                                                                                                       |
| `--credential-source <env\|convex>`   | `env`                                              | Siehe [Convex-Anmeldeinformationspool](#convex-credential-pool).                                                                                                    |
| `--credential-role <maintainer\|ci>`  | `ci` in CI, sonst `maintainer`                     | Rolle, die bei `--credential-source convex` verwendet wird.                                                                                                         |

Jede Lane beendet sich bei einem fehlgeschlagenen Szenario mit einem Exit-Code ungleich null. `--allow-failures` schreibt Artefakte, ohne einen fehlschlagenden Exit-Code zu setzen.

### Telegram-QA

```bash
pnpm openclaw qa telegram
```

Zielt auf eine reale private Telegram-Gruppe mit zwei unterschiedlichen Bots (Treiber + SUT). Der SUT-Bot muss einen Telegram-Benutzernamen haben; Bot-zu-Bot-Beobachtung funktioniert am besten, wenn für beide Bots der **Bot-to-Bot Communication Mode** in `@BotFather` aktiviert ist.

Erforderliche Umgebungsvariablen bei `--credential-source env`:

- `OPENCLAW_QA_TELEGRAM_GROUP_ID` - numerische Chat-ID (Zeichenkette).
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

Die implizite Standardmenge deckt immer Canary, Mention-Gating, native Befehlsantworten, Befehlsadressierung und Bot-zu-Bot-Gruppenantworten ab. `mock-openai`-Standards enthalten außerdem deterministische Prüfungen für Antwortketten und Final-Message-Streaming. `telegram-current-session-status-tool` bleibt Opt-in, weil es nur stabil ist, wenn es direkt nach Canary gethreadet wird, nicht nach beliebigen nativen Befehlsantworten. Verwenden Sie `pnpm openclaw qa telegram --list-scenarios --provider-mode mock-openai`, um die aktuelle Aufteilung zwischen Standard und optionalen Szenarien mit Regressions-Refs auszugeben.

Ausgabeartefakte:

- `telegram-qa-report.md`
- `qa-evidence.json` - Nachweiseinträge für die Live-Transport-Prüfungen, einschließlich Profil-, Abdeckungs-, Provider-, Kanal-, Artefakt-, Ergebnis- und RTT-Feldern.

Paket-Telegram-Läufe verwenden denselben Telegram-Anmeldeinformationsvertrag. Wiederholte RTT-Messung ist Teil der normalen Paket-Telegram-Live-Lane; die RTT-Verteilung wird unter `result.timing` für die ausgewählte RTT-Prüfung in `qa-evidence.json` aufgenommen.

```bash
OPENCLAW_QA_CREDENTIAL_SOURCE=convex \
pnpm test:docker:npm-telegram-live
```

Wenn `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` gesetzt ist, least der Paket-Live-Wrapper eine Anmeldeinformation mit `kind: "telegram"`, exportiert die geleasten Gruppen-/Treiber-/SUT-Bot-Umgebungsvariablen in den installierten Paketlauf, sendet Heartbeats für den Lease und gibt ihn beim Herunterfahren frei. Der Paket-Wrapper verwendet standardmäßig 20 RTT-Prüfungen von `telegram-mentioned-message-reply`, ein RTT-Timeout von 30 s und die Convex-Rolle `maintainer` außerhalb von CI, wenn Convex ausgewählt ist. Überschreiben Sie `OPENCLAW_NPM_TELEGRAM_RTT_SAMPLES`, `OPENCLAW_NPM_TELEGRAM_RTT_TIMEOUT_MS` oder `OPENCLAW_NPM_TELEGRAM_RTT_MAX_FAILURES`, um die RTT-Messung anzupassen, ohne einen separaten RTT-Befehl oder ein Telegram-spezifisches Zusammenfassungsformat zu erstellen.

### Discord-QA

```bash
pnpm openclaw qa discord
```

Zielt auf einen realen privaten Discord-Guild-Kanal mit zwei Bots: einen vom Harness gesteuerten Treiber-Bot und einen SUT-Bot, der vom untergeordneten OpenClaw-Gateway über das gebündelte Discord-Plugin gestartet wird. Überprüft die Verarbeitung von Kanalerwähnungen, dass der SUT-Bot den nativen `/help`-Befehl bei Discord registriert hat, sowie Opt-in-Mantis-Nachweisszenarien.

Erforderliche Umgebungsvariablen bei `--credential-source env`:

- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID` - muss der von Discord zurückgegebenen Benutzer-ID des SUT-Bots entsprechen (andernfalls schlägt die Lane früh fehl).

Optional:

- `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1` behält Nachrichtentexte in Artefakten mit beobachteten Nachrichten bei.
- `OPENCLAW_QA_DISCORD_VOICE_CHANNEL_ID` wählt den Voice-/Stage-Kanal für `discord-voice-autojoin` aus; ohne diese Variable wählt das Szenario den ersten sichtbaren Voice-/Stage-Kanal für den SUT-Bot.

Szenarien (`extensions/qa-lab/src/live-transports/discord/discord-live.runtime.ts:36`):

- `discord-canary`
- `discord-mention-gating`
- `discord-native-help-command-registration`
- `discord-voice-autojoin` - Opt-in-Voice-Szenario. Läuft allein, aktiviert `channels.discord.voice.autoJoin` und überprüft, dass der aktuelle Discord-Voice-Status des SUT-Bots der Ziel-Voice-/Stage-Kanal ist. Convex-Discord-Anmeldeinformationen können optional `voiceChannelId` enthalten; andernfalls ermittelt der Runner den ersten sichtbaren Voice-/Stage-Kanal in der Guild.
- `discord-status-reactions-tool-only` - Opt-in-Mantis-Szenario. Läuft allein, weil es den SUT auf Always-on-Guild-Antworten nur mit Tools und `messages.statusReactions.enabled=true` umstellt, und erfasst dann eine REST-Reaktionszeitleiste sowie visuelle HTML-/PNG-Artefakte. Mantis-Vorher-/Nachher-Berichte bewahren außerdem szenariobereitgestellte MP4-Artefakte als `baseline.mp4` und `candidate.mp4` auf.

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
- `discord-qa-observed-messages.json` - Texte redigiert, außer `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1`.
- `discord-qa-reaction-timelines.json` und `discord-status-reactions-tool-only-timeline.png`, wenn das Status-Reaction-Szenario ausgeführt wird.

### Slack-QA

```bash
pnpm openclaw qa slack
```

Zielt auf einen realen privaten Slack-Kanal mit zwei unterschiedlichen Bots: einen vom Harness gesteuerten Treiber-Bot und einen SUT-Bot, der vom untergeordneten OpenClaw-Gateway über das gebündelte Slack-Plugin gestartet wird.

Erforderliche Umgebungsvariablen bei `--credential-source env`:

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`

Optional:

- `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1` behält Nachrichtentexte in Artefakten mit beobachteten Nachrichten bei.
- `OPENCLAW_QA_SLACK_APPROVAL_CHECKPOINT_DIR` aktiviert visuelle Genehmigungs-Checkpoints für Mantis. Der Runner schreibt `<scenario>.pending.json` und `<scenario>.resolved.json` und wartet dann auf passende `.ack.json`-Dateien.
- `OPENCLAW_QA_SLACK_APPROVAL_CHECKPOINT_TIMEOUT_MS` überschreibt das Timeout für die Checkpoint-Bestätigung. Der Standard ist `120000`.

Szenarien (`extensions/qa-lab/src/live-transports/slack/slack-live.runtime.ts`):

- `slack-canary`
- `slack-mention-gating`
- `slack-allowlist-block`
- `slack-top-level-reply-shape`
- `slack-restart-resume`
- `slack-thread-follow-up`
- `slack-thread-isolation`
- `slack-approval-exec-native` - Opt-in-Szenario für native Slack-Exec-Genehmigungen. Fordert eine Exec-Genehmigung über das Gateway an, überprüft, dass die Slack-Nachricht native Genehmigungsbuttons hat, löst sie auf und überprüft das aufgelöste Slack-Update.
- `slack-approval-plugin-native` - Opt-in-Szenario für native Slack-Plugin-Genehmigungen. Aktiviert Exec- und Plugin-Genehmigungsweiterleitung zusammen, damit Plugin-Ereignisse nicht durch Exec-Genehmigungsrouting unterdrückt werden, und überprüft dann denselben ausstehenden/aufgelösten nativen Slack-UI-Pfad.

Ausgabeartefakte:

- `slack-qa-report.md`
- `qa-evidence.json` - Nachweiseinträge für die Live-Transport-Prüfungen.
- `slack-qa-observed-messages.json` - Texte redigiert, außer `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1`.
- `approval-checkpoints/` - nur wenn Mantis `OPENCLAW_QA_SLACK_APPROVAL_CHECKPOINT_DIR` setzt; enthält Checkpoint-JSON, Bestätigungs-JSON und Screenshots für ausstehende/aufgelöste Zustände.

#### Slack-Workspace einrichten

Die Lane benötigt zwei unterschiedliche Slack-Apps in einem Workspace sowie einen Kanal, in dem beide Bots Mitglieder sind:

- `channelId` - die `Cxxxxxxxxxx`-ID eines Kanals, in den beide Bots eingeladen wurden. Verwenden Sie einen dedizierten Kanal; die Lane postet bei jedem Lauf.
- `driverBotToken` - Bot-Token (`xoxb-...`) der **Driver**-App.
- `sutBotToken` - Bot-Token (`xoxb-...`) der **SUT**-App, die eine separate Slack-App vom Treiber sein muss, damit ihre Bot-Benutzer-ID eindeutig ist.
- `sutAppToken` - App-Level-Token (`xapp-...`) der SUT-App mit `connections:write`, verwendet von Socket Mode, damit die SUT-App Ereignisse empfangen kann.

Bevorzugen Sie einen für QA dedizierten Slack-Workspace gegenüber der Wiederverwendung eines Produktions-Workspace.

Das folgende SUT-Manifest begrenzt die Produktionsinstallation des gebündelten Slack-Plugins (`extensions/slack/src/setup-shared.ts:10`) absichtlich auf die Berechtigungen und Ereignisse, die von der Live-Slack-QA-Suite abgedeckt werden. Für die Einrichtung des Produktionskanals, wie Benutzer sie sehen, siehe [Slack-Kanal-Schnelleinrichtung](/de/channels/slack#quick-setup); das QA-Driver/SUT-Paar ist absichtlich separat, weil die Lane zwei unterschiedliche Bot-Benutzer-IDs in einem Workspace benötigt.

**1. Erstellen Sie die Driver-App**

Gehen Sie zu [api.slack.com/apps](https://api.slack.com/apps) → _Neue App erstellen_ → _Aus einem Manifest_ → wählen Sie den QA-Workspace aus, fügen Sie das folgende Manifest ein und dann _Im Workspace installieren_:

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

Kopieren Sie das _Bot User OAuth Token_ (`xoxb-...`) - daraus wird `driverBotToken`. Der Driver muss nur Nachrichten posten und sich identifizieren; keine Events, kein Socket Mode.

**2. Erstellen Sie die SUT-App**

Wiederholen Sie _Neue App erstellen → Aus einem Manifest_ im selben Workspace. Diese QA-App verwendet absichtlich eine schmalere Version des Produktionsmanifests des gebündelten Slack-Plugins (`extensions/slack/src/setup-shared.ts:10`): Reaction-Scopes und Events werden weggelassen, weil die Live-Slack-QA-Suite die Reaction-Verarbeitung noch nicht abdeckt.

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

- _Im Workspace installieren_ → kopieren Sie das _Bot User OAuth Token_ → daraus wird `sutBotToken`.
- _Basic Information → App-Level Tokens → Generate Token and Scopes_ → fügen Sie den Scope `connections:write` hinzu → speichern → kopieren Sie den Wert `xapp-...` → daraus wird `sutAppToken`.

Prüfen Sie, ob die beiden Bots unterschiedliche Benutzer-IDs haben, indem Sie `auth.test` mit jedem Token aufrufen. Die Runtime unterscheidet Driver und SUT anhand der Benutzer-ID; dieselbe App für beide wiederzuverwenden lässt das Mention-Gating sofort fehlschlagen.

**3. Erstellen Sie den Channel**

Erstellen Sie im QA-Workspace einen Channel (z. B. `#openclaw-qa`) und laden Sie beide Bots aus dem Channel heraus ein:

```
/invite @OpenClaw QA Driver
/invite @OpenClaw QA SUT
```

Kopieren Sie die ID `Cxxxxxxxxxx` aus _Channel-Info → Info → Channel ID_ - daraus wird `channelId`. Ein öffentlicher Channel funktioniert; wenn Sie einen privaten Channel verwenden, haben beide Apps bereits `groups:history`, sodass die History-Lesevorgänge des Harness weiterhin erfolgreich sind.

**4. Registrieren Sie die Zugangsdaten**

Zwei Optionen. Verwenden Sie Env-Vars für das Debugging auf einer einzelnen Maschine (setzen Sie die vier Variablen `OPENCLAW_QA_SLACK_*` und übergeben Sie `--credential-source env`), oder befüllen Sie den gemeinsamen Convex-Pool, damit CI und andere Maintainer sie leasen können.

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

**5. Prüfen Sie Ende zu Ende**

Führen Sie die Lane lokal aus, um zu bestätigen, dass beide Bots über den Broker miteinander sprechen können:

```bash
pnpm openclaw qa slack \
  --credential-source convex \
  --credential-role maintainer \
  --output-dir .artifacts/qa-e2e/slack-local
```

Ein grüner Lauf wird in deutlich unter 30 Sekunden abgeschlossen, und `slack-qa-report.md` zeigt sowohl `slack-canary` als auch `slack-mention-gating` mit Status `pass`. Wenn die Lane etwa 90 Sekunden hängt und mit `Convex credential pool exhausted for kind "slack"` beendet wird, ist entweder der Pool leer oder jede Zeile ist geleast - `qa credentials list --kind slack --status all --json` zeigt Ihnen, welche Ursache zutrifft.

### WhatsApp-QA

```bash
pnpm openclaw qa whatsapp
```

Zielt auf zwei dedizierte WhatsApp-Web-Konten: ein vom Harness gesteuertes Driver-Konto und ein SUT-Konto, das vom untergeordneten OpenClaw-Gateway über das gebündelte WhatsApp-Plugin gestartet wird.

Erforderliche Env bei `--credential-source env`:

- `OPENCLAW_QA_WHATSAPP_DRIVER_PHONE_E164`
- `OPENCLAW_QA_WHATSAPP_SUT_PHONE_E164`
- `OPENCLAW_QA_WHATSAPP_DRIVER_AUTH_ARCHIVE_BASE64`
- `OPENCLAW_QA_WHATSAPP_SUT_AUTH_ARCHIVE_BASE64`

Optional:

- `OPENCLAW_QA_WHATSAPP_GROUP_JID` aktiviert Gruppenszenarien wie
  `whatsapp-mention-gating` und `whatsapp-group-allowlist-block`.
- `OPENCLAW_QA_WHATSAPP_CAPTURE_CONTENT=1` behält Nachrichtentexte in
  Observed-Message-Artefakten.

Szenariokatalog (`extensions/qa-lab/src/live-transports/whatsapp/whatsapp-live.runtime.ts`):

- Baseline und Gruppen-Gating: `whatsapp-canary`, `whatsapp-pairing-block`,
  `whatsapp-mention-gating`, `whatsapp-top-level-reply-shape`,
  `whatsapp-restart-resume`, `whatsapp-group-allowlist-block`.
- Native Befehle: `whatsapp-help-command`, `whatsapp-status-command`,
  `whatsapp-commands-command`, `whatsapp-tools-compact-command`,
  `whatsapp-whoami-command`, `whatsapp-context-command`,
  `whatsapp-native-new-command`.
- Antwort- und Final-Output-Verhalten: `whatsapp-tool-only-usage-footer`,
  `whatsapp-reply-to-message`, `whatsapp-group-reply-to-message`,
  `whatsapp-reply-context-isolation`, `whatsapp-reply-delivery-shape`,
  `whatsapp-stream-final-message-accounting`.
- Eingehende Medien und strukturierte Nachrichten: `whatsapp-inbound-image-caption`,
  `whatsapp-audio-preflight`, `whatsapp-inbound-structured-messages`,
  `whatsapp-group-audio-gating`. Diese senden echte WhatsApp-Bild-, Audio-,
  Dokument-, Standort-, Kontakt- und Sticker-Events über den Driver.
- Abdeckung für ausgehendes Gateway und Nachrichtenaktionen:
  `whatsapp-outbound-media-matrix`,
  `whatsapp-outbound-document-preserves-filename`, `whatsapp-outbound-poll`,
  `whatsapp-message-actions`.
- Abdeckung für Zugriffskontrolle: `whatsapp-access-control-dm-open`,
  `whatsapp-access-control-dm-disabled`, `whatsapp-access-control-group-open`,
  `whatsapp-access-control-group-disabled`, `whatsapp-group-allowlist-block`.
- Native Genehmigungen: `whatsapp-approval-exec-deny-native`,
  `whatsapp-approval-exec-native`, `whatsapp-approval-exec-reaction-native`,
  `whatsapp-approval-plugin-native`.
- Status-Reactions: `whatsapp-status-reactions`.

Der Katalog enthält derzeit 36 Szenarien. Die Standard-Lane `live-frontier` wird
mit 10 Szenarien für schnelle Smoke-Abdeckung klein gehalten. Die Standard-Lane
`mock-openai` führt 31 deterministische Szenarien über den echten WhatsApp-Transport aus, während
nur die Modellausgabe gemockt wird. Genehmigungsszenarien und einige schwerere/blockierende Prüfungen
bleiben explizit per Szenario-ID.

Der WhatsApp-QA-Driver beobachtet strukturierte Live-Events (`text`, `media`,
`location`, `reaction` und `poll`) und kann aktiv Medien, Polls,
Kontakte, Standorte und Sticker senden. QA Lab importiert diesen Driver über die
Paketoberfläche `@openclaw/whatsapp/api.js`, anstatt auf private
WhatsApp-Runtime-Dateien zuzugreifen. Nachrichteninhalte werden standardmäßig redigiert. Die Abdeckung für ausgehende
Polls und Datei-Uploads läuft über deterministische Gateway-Aufrufe `poll` und
`message.action` statt über reine Modell-Prompt-Tool-Aufrufe.

Ausgabeartefakte:

- `whatsapp-qa-report.md`
- `qa-evidence.json` - Evidenzeinträge für die Live-Transport-Prüfungen.
- `whatsapp-qa-observed-messages.json` - Texte redigiert, außer `OPENCLAW_QA_WHATSAPP_CAPTURE_CONTENT=1`.

### Convex-Zugangsdatenpool

Telegram-, Discord-, Slack- und WhatsApp-Lanes können Zugangsdaten aus einem gemeinsamen Convex-Pool leasen, statt die oben genannten Env-Vars zu lesen. Übergeben Sie `--credential-source convex` (oder setzen Sie `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`); QA Lab erwirbt einen exklusiven Lease, sendet für die Dauer des Laufs Heartbeats und gibt ihn beim Herunterfahren frei. Pool-Arten sind `"telegram"`, `"discord"`, `"slack"` und `"whatsapp"`.

Payload-Formen, die der Broker bei `admin/add` validiert:

- Telegram (`kind: "telegram"`): `{ groupId: string, driverToken: string, sutToken: string }` - `groupId` muss ein numerischer Chat-ID-String sein.
- Echter Telegram-Benutzer (`kind: "telegram-user"`): `{ groupId: string, sutToken: string, testerUserId: string, testerUsername: string, telegramApiId: string, telegramApiHash: string, tdlibDatabaseEncryptionKey: string, tdlibArchiveBase64: string, tdlibArchiveSha256: string, desktopTdataArchiveBase64: string, desktopTdataArchiveSha256: string }` - nur Mantis-Telegram-Desktop-Proof. Generische QA-Lab-Lanes dürfen diese Art nicht erwerben.
- Discord (`kind: "discord"`): `{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string }`.
- WhatsApp (`kind: "whatsapp"`): `{ driverPhoneE164: string, sutPhoneE164: string, driverAuthArchiveBase64: string, sutAuthArchiveBase64: string, groupJid?: string }` - Telefonnummern müssen unterschiedliche E.164-Strings sein.

Der Mantis-Telegram-Desktop-Proof-Workflow hält einen exklusiven Convex-Lease
`telegram-user` sowohl für den TDLib-CLI-Driver als auch für den Telegram-Desktop-
Zeugen und gibt ihn nach der Veröffentlichung des Proofs wieder frei.

Wenn ein PR einen deterministischen visuellen Diff benötigt, kann Mantis dieselbe Mock-Modell-
Antwort auf `main` und auf dem PR-Head verwenden, während sich der Telegram-Formatter oder die Delivery-
Schicht ändert. Capture-Standards sind für PR-Kommentare abgestimmt: Standard-Crabbox-
Klasse, Desktop-Aufzeichnung mit 24 fps, Motion-GIF mit 24 fps und 1920 px Vorschau-Breite.
Vorher-/Nachher-Kommentare sollten ein sauberes Bundle veröffentlichen, das nur die
beabsichtigten GIFs enthält.

Slack-Lanes können ebenfalls den Pool verwenden. Slack-Payload-Shape-Prüfungen befinden sich derzeit im Slack-QA-Runner statt im Broker; verwenden Sie `{ channelId: string, driverBotToken: string, sutBotToken: string, sutAppToken: string }`, mit einer Slack-Channel-ID wie `Cxxxxxxxxxx`. Siehe [Einrichten des Slack-Workspace](#setting-up-the-slack-workspace) für die App- und Scope-Bereitstellung.

Operative Env-Vars und der Endpoint-Vertrag des Convex-Brokers befinden sich in [Testing → Shared Telegram credentials via Convex](/de/help/testing#shared-telegram-credentials-via-convex-v1) (der Abschnittsname stammt aus der Zeit vor dem Multi-Channel-Pool; die Lease-Semantik ist über alle Arten hinweg gemeinsam).

## Repo-gestützte Seeds

Seed-Assets befinden sich in `qa/`:

- `qa/scenarios/index.yaml`
- `qa/scenarios/<theme>/*.yaml`

Diese liegen absichtlich in git, damit der QA-Plan sowohl für Menschen als auch für den
Agent sichtbar ist.

`qa-lab` sollte ein generischer YAML-Szenario-Runner bleiben. Jede Szenario-YAML-Datei ist
die Quelle der Wahrheit für einen Testlauf und sollte Folgendes definieren:

- oberstes `title`
- `scenario`-Metadaten
- optionale Kategorie-, Capability-, Lane- und Risiko-Metadaten in `scenario`
- Docs- und Code-Refs in `scenario`
- optionale Plugin-Anforderungen in `scenario`
- optionaler Gateway-Konfigurationspatch in `scenario`
- ausführbares oberstes `flow` für Flow-Szenarien oder `scenario.execution.kind` /
  `scenario.execution.path` für Vitest- und Playwright-Szenarien

Die wiederverwendbare Runtime-Oberfläche, auf der `flow` basiert, darf generisch
und querschnittlich bleiben. YAML-Szenarien können beispielsweise transportseitige
Helper mit browserseitigen Helpern kombinieren, die die eingebettete Control UI über die
Gateway-Nahtstelle `browser.request` steuern, ohne einen Sonderfall-Runner hinzuzufügen.

Szenariodateien sollten nach Produktfähigkeit und nicht nach Source-Tree-Ordner
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
  deterministische Mock-Lane für repositorygestützte QA und Paritäts-Gates.
- `aimock` startet einen AIMock-gestützten Provider-Server für experimentelle Protokoll-,
  Fixture-, Record/Replay- und Chaos-Abdeckung. Er ist additiv und ersetzt nicht
  den `mock-openai`-Szenario-Dispatcher.

Die Implementierung der Provider-Lanes befindet sich unter `extensions/qa-lab/src/providers/`.
Jeder Provider besitzt seine Defaults, den Start des lokalen Servers, die Gateway-Modellkonfiguration,
Anforderungen an das Staging von Auth-Profilen und Live-/Mock-Capability-Flags. Gemeinsamer Suite- und
Gateway-Code sollte über die Provider-Registry routen, statt auf
Provider-Namen zu verzweigen.

## Transportadapter

`qa-lab` besitzt eine generische Transport-Nahtstelle für YAML-QA-Szenarien. `qa-channel` ist
der synthetische Default. `crabline` startet lokale Provider-förmige Server und führt
die normalen Kanal-Plugins von OpenClaw dagegen aus. `live` ist für echte
Provider-Anmeldedaten und externe Kanäle reserviert.

Auf Architekturebene ist die Aufteilung:

- `qa-lab` besitzt generische Szenarioausführung, Worker-Parallelität, Artefaktschreiben und Reporting.
- Der Transportadapter besitzt Gateway-Konfiguration, Bereitschaft, Eingangs- und Ausgangsbeobachtung, Transportaktionen und normalisierten Transportzustand.
- YAML-Szenariodateien unter `qa/scenarios/` definieren den Testlauf; `qa-lab` stellt die wiederverwendbare Runtime-Oberfläche bereit, die sie ausführt.

### Einen Kanal hinzufügen

Das Hinzufügen eines Kanals zum YAML-QA-System erfordert die Kanalimplementierung plus
ein Szenariopaket, das den Kanalvertrag ausübt. Für Smoke-CI-Abdeckung fügen Sie
den passenden lokalen Crabline-Provider-Server hinzu und stellen ihn über den `crabline`-
Treiber bereit.

Fügen Sie keinen neuen Top-Level-QA-Befehlsstamm hinzu, wenn der gemeinsame `qa-lab`-Host den Flow besitzen kann.

`qa-lab` besitzt die gemeinsamen Host-Mechaniken:

- den Befehlsstamm `openclaw qa`
- Start und Teardown der Suite
- Worker-Parallelität
- Artefaktschreiben
- Berichtsgenerierung
- Szenarioausführung
- Kompatibilitätsaliasse für ältere `qa-channel`-Szenarien

Runner-Plugins besitzen den Transportvertrag:

- wie `openclaw qa <runner>` unter dem gemeinsamen `qa`-Stamm eingehängt wird
- wie das Gateway für diesen Transport konfiguriert wird
- wie Bereitschaft geprüft wird
- wie eingehende Ereignisse injiziert werden
- wie ausgehende Nachrichten beobachtet werden
- wie Transkripte und normalisierter Transportzustand offengelegt werden
- wie transportgestützte Aktionen ausgeführt werden
- wie transportspezifisches Zurücksetzen oder Aufräumen gehandhabt wird

Die Mindestanforderungen für die Einführung eines neuen Kanals:

1. Behalten Sie `qa-lab` als Besitzer des gemeinsamen `qa`-Stamms bei.
2. Implementieren Sie den Transport-Runner auf der gemeinsamen Host-Nahtstelle von `qa-lab`.
3. Halten Sie transportspezifische Mechaniken innerhalb des Runner-Plugins oder des Kanal-Harnesses.
4. Hängen Sie den Runner als `openclaw qa <runner>` ein, statt einen konkurrierenden Root-Befehl zu registrieren. Runner-Plugins sollten `qaRunners` in `openclaw.plugin.json` deklarieren und ein passendes Array `qaRunnerCliRegistrations` aus `runtime-api.ts` exportieren. Halten Sie `runtime-api.ts` schlank; Lazy-CLI und Runner-Ausführung sollten hinter separaten Einstiegspunkten bleiben.
5. Erstellen oder adaptieren Sie YAML-Szenarien unter den thematischen Verzeichnissen `qa/scenarios/`.
6. Verwenden Sie die generischen Szenario-Helper für neue Szenarien.
7. Halten Sie vorhandene Kompatibilitätsaliasse funktionsfähig, sofern das Repository keine absichtliche Migration durchführt.

Die Entscheidungsregel ist strikt:

- Wenn Verhalten einmalig in `qa-lab` ausgedrückt werden kann, platzieren Sie es in `qa-lab`.
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

Kompatibilitätsaliasse bleiben für vorhandene Szenarien verfügbar - `waitForQaChannelReady`, `waitForOutboundMessage`, `waitForNoOutbound`, `formatConversationTranscript`, `resetBus` -, aber neue Szenarioerstellung sollte die generischen Namen verwenden. Die Aliasse existieren, um eine Stichtagsmigration zu vermeiden, nicht als Modell für die Zukunft.

## Reporting

`qa-lab` exportiert einen Markdown-Protokollbericht aus der beobachteten Bus-Zeitleiste.
Der Bericht sollte beantworten:

- Was funktioniert hat
- Was fehlgeschlagen ist
- Was blockiert blieb
- Welche Folgeszenarien sich lohnen

Für das Inventar verfügbarer Szenarien - nützlich beim Dimensionieren von Folgearbeiten oder beim Verdrahten eines neuen Transports - führen Sie `pnpm openclaw qa coverage` aus (fügen Sie `--json` für maschinenlesbare Ausgabe hinzu).
Wenn Sie fokussierten Nachweis für ein berührtes Verhalten oder einen Dateipfad auswählen, führen Sie `pnpm openclaw qa coverage --match <query>` aus.
Der Match-Bericht durchsucht Szenariometadaten, Docs-Refs, Code-Refs, Coverage-IDs, Plugins und Provider-Anforderungen und gibt anschließend passende Ziele für `qa suite --scenario ...` aus.
Jeder `qa suite`-Lauf schreibt Top-Level-Artefakte `qa-evidence.json`,
`qa-suite-summary.json` und `qa-suite-report.md` für die ausgewählte
Szenariomenge. Szenarien, die `execution.kind: vitest` oder
`execution.kind: playwright` deklarieren, führen den passenden Testpfad aus und schreiben außerdem
szenariospezifische Logs. Szenarien, die `execution.kind: script` deklarieren, führen den
Nachweis-Produzenten unter `execution.path` über `node --import tsx` aus (wobei
`${outputDir}` und `${scenarioId}` in `execution.args` expandiert werden); der Produzent
schreibt seine eigene `qa-evidence.json`, deren Einträge in die Suite-Ausgabe
importiert werden und deren Artefaktpfade relativ zu dieser Produzenten-`qa-evidence.json`
aufgelöst werden. Wenn `qa suite` über
`qa run --qa-profile` erreicht wird, enthält dieselbe `qa-evidence.json` auch die Profil-
Scorecard-Zusammenfassung für die ausgewählten Taxonomiekategorien.
Behandeln Sie dies als Entdeckungshilfe, nicht als Ersatz für ein Gate; das ausgewählte Szenario benötigt weiterhin den richtigen Provider-Modus, Live-Transport, Multipass, Testbox oder Release-Lane für das getestete Verhalten.
Scorecard-Kontext finden Sie unter [Maturity scorecard](/de/maturity/scorecard).

Für Zeichen- und Stilprüfungen führen Sie dasselbe Szenario über mehrere Live-Modell-
Refs hinweg aus und schreiben einen bewerteten Markdown-Bericht:

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
Szenarien sollten die Persona über `SOUL.md` setzen und dann gewöhnliche Benutzerrunden
wie Chat, Workspace-Hilfe und kleine Datei-Aufgaben ausführen. Dem Kandidatenmodell sollte
nicht mitgeteilt werden, dass es evaluiert wird. Der Befehl bewahrt jedes vollständige
Transkript, zeichnet grundlegende Laufstatistiken auf und bittet dann die Judge-Modelle im Fast-Modus mit
`xhigh`-Reasoning, sofern unterstützt, die Läufe nach Natürlichkeit, Stimmung und Humor zu ranken.
Verwenden Sie `--blind-judge-models`, wenn Sie Provider vergleichen: Der Judge-Prompt erhält weiterhin
jedes Transkript und jeden Laufstatus, aber Kandidaten-Refs werden durch neutrale
Labels wie `candidate-01` ersetzt; der Bericht ordnet Rankings nach dem Parsen wieder echten Refs zu.
Kandidatenläufe verwenden standardmäßig `high` Thinking, mit `medium` für GPT-5.5 und `xhigh`
für ältere OpenAI-Eval-Refs, die dies unterstützen. Überschreiben Sie einen bestimmten Kandidaten inline mit
`--model provider/model,thinking=<level>`. `--thinking <level>` setzt weiterhin einen
globalen Fallback, und die ältere Form `--model-thinking <provider/model=level>` wird
aus Kompatibilitätsgründen beibehalten.
OpenAI-Kandidaten-Refs verwenden standardmäßig den Fast-Modus, sodass Priority Processing dort genutzt wird,
wo der Provider es unterstützt. Fügen Sie inline `,fast`, `,no-fast` oder `,fast=false` hinzu, wenn ein
einzelner Kandidat oder Judge eine Überschreibung benötigt. Übergeben Sie `--fast` nur, wenn Sie
den Fast-Modus für jedes Kandidatenmodell erzwingen möchten. Kandidaten- und Judge-Dauern werden
für Benchmark-Analysen im Bericht aufgezeichnet, aber Judge-Prompts sagen ausdrücklich,
nicht nach Geschwindigkeit zu ranken.
Kandidaten- und Judge-Modellläufe verwenden beide standardmäßig Parallelität 16. Senken Sie
`--concurrency` oder `--judge-concurrency`, wenn Provider-Limits oder lokaler Gateway-
Druck einen Lauf zu verrauscht machen.
Wenn kein Kandidaten-`--model` übergeben wird, verwendet Character-Eval standardmäßig
`openai/gpt-5.5`, `openai/gpt-5.2`, `openai/gpt-5`, `anthropic/claude-opus-4-8`,
`anthropic/claude-sonnet-4-6`, `zai/glm-5.1`,
`moonshot/kimi-k2.5` und
`google/gemini-3.1-pro-preview`, wenn kein `--model` übergeben wird.
Wenn kein `--judge-model` übergeben wird, verwenden die Judges standardmäßig
`openai/gpt-5.5,thinking=xhigh,fast` und
`anthropic/claude-opus-4-8,thinking=high`.

## Zugehörige Dokumentation

- [Matrix-QA](/de/concepts/qa-matrix)
- [Maturity scorecard](/de/maturity/scorecard)
- [Personal Agent Benchmark Pack](/de/concepts/personal-agent-benchmark-pack)
- [QA Channel](/de/channels/qa-channel)
- [Testing](/de/help/testing)
- [Dashboard](/de/web/dashboard)
