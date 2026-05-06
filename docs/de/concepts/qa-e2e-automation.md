---
read_when:
    - Verstehen, wie der QA-Stack zusammenwirkt
    - Erweitern von qa-lab, qa-channel oder einem Transportadapter
    - Repository-gestützte QA-Szenarien hinzufügen
    - Aufbau realitätsnäherer QA-Automatisierung rund um das Gateway-Dashboard
summary: 'Überblick über den QA-Stack: qa-lab, qa-channel, repositorygestützte Szenarien, Live-Transport-Lanes, Transportadapter und Reporting.'
title: QA-Übersicht
x-i18n:
    generated_at: "2026-05-06T06:45:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8ec1184395c8771c7bff755c97e5418e0c8b258f9953f1c945327d5c9753a69e
    source_path: concepts/qa-e2e-automation.md
    workflow: 16
---

Der private QA-Stack soll OpenClaw auf realistischere,
channel-nahe Weise testen, als es ein einzelner Unit-Test kann.

Aktuelle Bestandteile:

- `extensions/qa-channel`: synthetischer Nachrichtenkanal mit Oberflächen für DM, Kanal, Thread,
  Reaktion, Bearbeiten und Löschen.
- `extensions/qa-lab`: Debugger-UI und QA-Bus zum Beobachten des Transkripts,
  Einspeisen eingehender Nachrichten und Exportieren eines Markdown-Berichts.
- `extensions/qa-matrix`, zukünftige Runner-Plugins: Live-Transport-Adapter, die
  einen echten Kanal innerhalb eines untergeordneten QA-Gateways steuern.
- `qa/`: repo-gestützte Seed-Assets für die Startaufgabe und Baseline-QA-
  Szenarien.
- [Mantis](/de/concepts/mantis): Vorher-/Nachher-Live-Verifizierung für Bugs, die
  echte Transporte, Browser-Screenshots, VM-Zustand und PR-Nachweise benötigen.

## Befehlsoberfläche

Jeder QA-Flow läuft unter `pnpm openclaw qa <subcommand>`. Viele haben `pnpm qa:*`-
Skript-Aliasse; beide Formen werden unterstützt.

| Befehl                                              | Zweck                                                                                                                                                                                                                                                                   |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `qa run`                                            | Gebündelter QA-Selbsttest; schreibt einen Markdown-Bericht.                                                                                                                                                                                                             |
| `qa suite`                                          | Führt repo-gestützte Szenarien gegen die QA-Gateway-Lane aus. Aliasse: `pnpm openclaw qa suite --runner multipass` für eine disposable Linux-VM.                                                                                                                        |
| `qa coverage`                                       | Gibt das Markdown-Inventar zur Szenarioabdeckung aus (`--json` für maschinenlesbare Ausgabe).                                                                                                                                                                           |
| `qa parity-report`                                  | Vergleicht zwei `qa-suite-summary.json`-Dateien und schreibt den agentischen Paritätsbericht.                                                                                                                                                                           |
| `qa character-eval`                                 | Führt das Character-QA-Szenario über mehrere Live-Modelle hinweg mit bewertetem Bericht aus. Siehe [Berichterstattung](#reporting).                                                                                                                                     |
| `qa manual`                                         | Führt einen einmaligen Prompt gegen die ausgewählte Provider-/Modell-Lane aus.                                                                                                                                                                                          |
| `qa ui`                                             | Startet die QA-Debugger-UI und den lokalen QA-Bus (Alias: `pnpm qa:lab:ui`).                                                                                                                                                                                            |
| `qa docker-build-image`                             | Baut das vorgefertigte QA-Docker-Image.                                                                                                                                                                                                                                 |
| `qa docker-scaffold`                                | Schreibt ein docker-compose-Gerüst für das QA-Dashboard und die Gateway-Lane.                                                                                                                                                                                           |
| `qa up`                                             | Baut die QA-Site, startet den Docker-gestützten Stack und gibt die URL aus (Alias: `pnpm qa:lab:up`; die Variante `:fast` ergänzt `--use-prebuilt-image --bind-ui-dist --skip-ui-build`).                                                                               |
| `qa aimock`                                         | Startet nur den AIMock-Provider-Server.                                                                                                                                                                                                                                 |
| `qa mock-openai`                                    | Startet nur den szenariobewussten `mock-openai`-Provider-Server.                                                                                                                                                                                                        |
| `qa credentials doctor` / `add` / `list` / `remove` | Verwaltet den gemeinsam genutzten Convex-Anmeldeinformationspool.                                                                                                                                                                                                       |
| `qa matrix`                                         | Live-Transport-Lane gegen einen disposable Tuwunel-Homeserver. Siehe [Matrix-QA](/de/concepts/qa-matrix).                                                                                                                                                                  |
| `qa telegram`                                       | Live-Transport-Lane gegen eine echte private Telegram-Gruppe.                                                                                                                                                                                                           |
| `qa discord`                                        | Live-Transport-Lane gegen einen echten privaten Discord-Guild-Kanal.                                                                                                                                                                                                    |
| `qa slack`                                          | Live-Transport-Lane gegen einen echten privaten Slack-Kanal.                                                                                                                                                                                                            |
| `qa mantis`                                         | Vorher-/Nachher-Verifizierungs-Runner für Live-Transport-Bugs, mit Nachweisen aus Discord-Statusreaktionen, Crabbox-Desktop-/Browser-Smoke und Slack-in-VNC-Smoke. Siehe [Mantis](/de/concepts/mantis) und [Mantis Slack Desktop Runbook](/de/concepts/mantis-slack-desktop-runbook). |

## Operator-Ablauf

Der aktuelle QA-Operator-Ablauf ist eine zweigeteilte QA-Site:

- Links: Gateway-Dashboard (Control UI) mit dem Agenten.
- Rechts: QA Lab, das das Slack-ähnliche Transkript und den Szenarioplan zeigt.

Führen Sie ihn aus mit:

```bash
pnpm qa:lab:up
```

Das baut die QA-Site, startet die Docker-gestützte Gateway-Lane und stellt die
QA-Lab-Seite bereit, auf der ein Operator oder eine Automatisierungsschleife dem
Agenten eine QA-Mission geben, echtes Kanalverhalten beobachten und aufzeichnen
kann, was funktioniert hat, fehlgeschlagen ist oder blockiert blieb.

Für schnellere QA-Lab-UI-Iteration ohne jedes Mal das Docker-Image neu zu bauen,
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

Für einen lokalen OpenTelemetry-Trace-Smoke führen Sie aus:

```bash
pnpm qa:otel:smoke
```

Dieses Skript startet einen lokalen OTLP/HTTP-Trace-Receiver, führt das
QA-Szenario `otel-trace-smoke` mit aktiviertem Plugin `diagnostics-otel` aus, decodiert dann
die exportierten Protobuf-Spans und prüft die release-kritische Form:
`openclaw.run`, `openclaw.harness.run`, `openclaw.model.call`,
`openclaw.context.assembled` und `openclaw.message.delivery` müssen vorhanden sein;
Modellaufrufe dürfen bei erfolgreichen Turns kein `StreamAbandoned` exportieren; rohe Diagnose-IDs und
`openclaw.content.*`-Attribute müssen aus dem Trace herausbleiben. Es schreibt
`otel-smoke-summary.json` neben die QA-Suite-Artefakte.

Observability-QA bleibt ausschließlich dem Source-Checkout vorbehalten. Der npm-Tarball lässt
QA Lab absichtlich aus, daher führen Package-Docker-Release-Lanes keine `qa`-Befehle aus. Verwenden Sie
`pnpm qa:otel:smoke` aus einem gebauten Source-Checkout, wenn Sie Diagnose-
Instrumentierung ändern.

Für eine transportechte Matrix-Smoke-Lane führen Sie aus:

```bash
pnpm openclaw qa matrix --profile fast --fail-fast
```

Die vollständige CLI-Referenz, der Profil-/Szenariokatalog, Env-Vars und das Artefaktlayout für diese Lane stehen in [Matrix-QA](/de/concepts/qa-matrix). Auf einen Blick: Sie stellt einen disposable Tuwunel-Homeserver in Docker bereit, registriert temporäre Driver-/SUT-/Observer-Benutzer, führt das echte Matrix-Plugin innerhalb eines untergeordneten QA-Gateways aus, das auf diesen Transport beschränkt ist (kein `qa-channel`), und schreibt dann einen Markdown-Bericht, eine JSON-Zusammenfassung, ein Artefakt mit beobachteten Events und ein kombiniertes Ausgabelog unter `.artifacts/qa-e2e/matrix-<timestamp>/`.

Die Szenarien decken Transportverhalten ab, das Unit-Tests nicht Ende zu Ende nachweisen können: Mention-Gating, Allow-Bot-Policies, Allowlists, Top-Level- und Thread-Antworten, DM-Routing, Reaktionsbehandlung, Unterdrückung eingehender Bearbeitungen, Replay-Deduplizierung nach Neustart, Wiederherstellung nach Homeserver-Unterbrechung, Zustellung von Approval-Metadaten, Medienbehandlung sowie Matrix-E2EE-Bootstrap-/Recovery-/Verification-Flows. Das E2EE-CLI-Profil steuert außerdem `openclaw matrix encryption setup` und Verifizierungsbefehle über denselben disposable Homeserver, bevor Gateway-Antworten geprüft werden.

Discord hat außerdem Mantis-only-Opt-in-Szenarien für Bug-Reproduktion. Verwenden Sie
`--scenario discord-status-reactions-tool-only` für die explizite Statusreaktions-
Timeline oder `--scenario discord-thread-reply-filepath-attachment`, um einen
echten Discord-Thread zu erstellen und zu verifizieren, dass `message.thread-reply` einen
`filePath`-Anhang erhält. Diese Szenarien bleiben außerhalb der standardmäßigen Live-Discord-Lane,
weil sie Vorher-/Nachher-Reproduktionsproben statt breiter Smoke-Abdeckung sind.
Der Thread-Anhang-Mantis-Workflow kann außerdem ein eingeloggtes Discord-Web-
Zeugenvideo hinzufügen, wenn `MANTIS_DISCORD_VIEWER_CHROME_PROFILE_DIR` oder
`MANTIS_DISCORD_VIEWER_CHROME_PROFILE_TGZ_B64` in der QA-
Umgebung konfiguriert ist. Dieses Viewer-Profil dient nur der visuellen Erfassung; die Pass/Fail-
Entscheidung kommt weiterhin vom Discord-REST-Orakel.

CI verwendet dieselbe Befehlsoberfläche in `.github/workflows/qa-live-transports-convex.yml`. Geplante und standardmäßige manuelle Läufe führen das schnelle Matrix-Profil mit Live-Frontier-Anmeldeinformationen, `--fast` und `OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS=3000` aus. Manuelles `matrix_profile=all` fächert in die fünf Profil-Shards auf, sodass der vollständige Katalog parallel laufen kann und zugleich ein Artefaktverzeichnis pro Shard erhalten bleibt.

Für transportechte Telegram-, Discord- und Slack-Smoke-Lanes:

```bash
pnpm openclaw qa telegram
pnpm openclaw qa discord
pnpm openclaw qa slack
```

Sie zielen auf einen vorab bestehenden echten Kanal mit zwei Bots (Driver + SUT). Erforderliche Env-Vars, Szenariolisten, Ausgabeartefakte und der Convex-Anmeldeinformationspool sind unten in der [Telegram-, Discord- und Slack-QA-Referenz](#telegram-discord-and-slack-qa-reference) dokumentiert.

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
wenn Videoaufzeichnung verfügbar ist, zurück in das Mantis-Artefaktverzeichnis. Crabbox-
Desktop-/Browser-Leases stellen die Aufzeichnungswerkzeuge und Browser-/Native-Build-Hilfs-
pakete vorab bereit, sodass das Szenario Fallbacks nur auf älteren
Leases installieren sollte. Mantis meldet Gesamt- und Phasenzeiten in
`mantis-slack-desktop-smoke-report.md`, sodass langsame Läufe zeigen, ob die Zeit in
Lease-Aufwärmung, Abruf von Zugangsdaten, Remote-Einrichtung oder Artefaktkopie floss. Verwenden Sie
`--lease-id <cbx_...>` erneut, nachdem Sie sich manuell über VNC bei Slack Web angemeldet haben;
wiederverwendete Leases halten auch Crabboxs pnpm-Store-Cache warm. Der Standard
`--hydrate-mode source` verifiziert aus einem Source-Checkout und führt Installation/Build
innerhalb der VM aus. Verwenden Sie `--hydrate-mode prehydrated` nur, wenn der wiederverwendete Remote-
Workspace bereits `node_modules` und ein gebautes `dist/` enthält; dieser Modus überspringt den
teuren Installations-/Build-Schritt und schlägt geschlossen fehl, wenn der Workspace nicht bereit ist.
Mit `--gateway-setup` lässt Mantis einen persistenten OpenClaw Slack Gateway
innerhalb der VM auf Port `38973` laufen; ohne diese Option führt der Befehl die normale
Bot-zu-Bot-Slack-QA-Lane aus und beendet sich nach der Artefakterfassung.

Die Operator-Checkliste, der GitHub-Workflow-Dispatch-Befehl, der Evidence-Comment-
Vertrag, die Hydrate-Mode-Entscheidungstabelle, Timing-Interpretation und Schritte zur
Fehlerbehandlung stehen im [Mantis Slack Desktop Runbook](/de/concepts/mantis-slack-desktop-runbook).

Für eine Desktop-Aufgabe im Agent-/CV-Stil führen Sie aus:

```bash
pnpm openclaw qa mantis visual-task \
  --browser-url https://example.net \
  --expect-text "Example Domain" \
  --vision-model openai/gpt-5.4
```

`visual-task` least oder verwendet eine Crabbox-Desktop-/Browser-Maschine erneut, startet
`crabbox record --while`, steuert den sichtbaren Browser über einen verschachtelten
`visual-driver`, erfasst `visual-task.png`, führt `openclaw infer image describe`
gegen den Screenshot aus, wenn `--vision-mode image-describe` ausgewählt ist, und
schreibt `visual-task.mp4`, `mantis-visual-task-summary.json`,
`mantis-visual-task-driver-result.json` und `mantis-visual-task-report.md`.
Wenn `--expect-text` gesetzt ist, fordert der Vision-Prompt ein strukturiertes JSON-
Urteil an und besteht nur, wenn das Modell positive sichtbare Nachweise meldet; eine
negative Antwort, die lediglich den Zieltext zitiert, lässt die Assertion fehlschlagen.
Verwenden Sie `--vision-mode metadata` für einen Smoke-Test ohne Modell, der Desktop,
Browser, Screenshot- und Video-Plumbing nachweist, ohne einen Provider für Bildverständnis
aufzurufen. Die Aufzeichnung ist ein erforderliches Artefakt für `visual-task`; wenn Crabbox
keine nicht leere `visual-task.mp4` aufzeichnet, schlägt die Aufgabe fehl, selbst wenn der visuelle Treiber
bestanden hat. Bei Fehlern behält Mantis den Lease für VNC, es sei denn, die Aufgabe hatte bereits
bestanden und `--keep-lease` war nicht gesetzt.

Bevor Sie gepoolte Live-Zugangsdaten verwenden, führen Sie aus:

```bash
pnpm openclaw qa credentials doctor
```

Der Doctor prüft die Convex-Broker-Umgebung, validiert Endpoint-Einstellungen und verifiziert die Erreichbarkeit von Admin/List, wenn das Maintainer-Secret vorhanden ist. Für Secrets meldet er nur den Status gesetzt/fehlend.

## Abdeckung von Live-Transporten

Live-Transport-Lanes teilen sich einen Vertrag, statt jeweils eine eigene Szenariolistenform zu erfinden. `qa-channel` ist die breite synthetische Suite für Produktverhalten und ist nicht Teil der Matrix für Live-Transportabdeckung.

| Lane     | Canary | Mention-Gating | Bot-zu-Bot | Allowlist-Block | Antwort auf oberster Ebene | Neustart-Fortsetzung | Thread-Follow-up | Thread-Isolation | Reaktionsbeobachtung | Help-Befehl | Native Befehlsregistrierung |
| -------- | ------ | -------------- | ---------- | --------------- | -------------------------- | -------------------- | ---------------- | ---------------- | -------------------- | ------------ | --------------------------- |
| Matrix   | x      | x              | x          | x               | x                          | x                    | x                | x                | x                    |              |                             |
| Telegram | x      | x              | x          |                 |                            |                      |                  |                  |                      | x            |                             |
| Discord  | x      | x              | x          |                 |                            |                      |                  |                  |                      |              | x                           |
| Slack    | x      | x              | x          | x               | x                          | x                    | x                | x                |                      |              |                             |

Dadurch bleibt `qa-channel` die breite Suite für Produktverhalten, während Matrix,
Telegram und zukünftige Live-Transporte eine explizite Transportvertrags-
Checkliste teilen.

Für eine wegwerfbare Linux-VM-Lane, ohne Docker in den QA-Pfad einzubeziehen, führen Sie aus:

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

Dies startet einen frischen Multipass-Gast, installiert Abhängigkeiten, baut OpenClaw
innerhalb des Gasts, führt `qa suite` aus und kopiert anschließend den normalen QA-Bericht und die
Zusammenfassung zurück nach `.artifacts/qa-e2e/...` auf dem Host.
Es verwendet dasselbe Szenarioauswahlverhalten wie `qa suite` auf dem Host.
Host- und Multipass-Suite-Läufe führen mehrere ausgewählte Szenarien standardmäßig parallel
mit isolierten Gateway-Workern aus. `qa-channel` verwendet standardmäßig Parallelität
4, begrenzt durch die Anzahl der ausgewählten Szenarien. Verwenden Sie `--concurrency <count>`, um
die Worker-Anzahl anzupassen, oder `--concurrency 1` für serielle Ausführung.
Der Befehl beendet sich mit einem Nicht-Null-Code, wenn ein Szenario fehlschlägt. Verwenden Sie `--allow-failures`, wenn
Sie Artefakte ohne fehlschlagenden Exit-Code wünschen.
Live-Läufe leiten die unterstützten QA-Auth-Eingaben weiter, die für den
Gast praktikabel sind: umgebungsbasierte Provider-Schlüssel, den QA-Live-Provider-Konfigurationspfad und
`CODEX_HOME`, wenn vorhanden. Halten Sie `--output-dir` unterhalb des Repo-Roots, damit der Gast
über den gemounteten Workspace zurückschreiben kann.

## Telegram-, Discord- und Slack-QA-Referenz

Matrix hat eine [eigene Seite](/de/concepts/qa-matrix), weil die Szenarioanzahl hoch ist und ein Docker-gestütztes Homeserver-Provisioning verwendet wird. Telegram, Discord und Slack sind kleiner - jeweils eine Handvoll Szenarien, kein Profilsystem, gegen bereits vorhandene echte Kanäle - daher steht ihre Referenz hier.

### Gemeinsame CLI-Flags

Diese Lanes registrieren sich über `extensions/qa-lab/src/live-transports/shared/live-transport-cli.ts` und akzeptieren dieselben Flags:

| Flag                                  | Standard                                                        | Beschreibung                                                                                                          |
| ------------------------------------- | --------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `--scenario <id>`                     | -                                                               | Führt nur dieses Szenario aus. Wiederholbar.                                                                          |
| `--output-dir <path>`                 | `<repo>/.artifacts/qa-e2e/{telegram,discord,slack}-<timestamp>` | Wohin Berichte/Zusammenfassung/beobachtete Nachrichten und das Ausgabelog geschrieben werden. Relative Pfade werden gegen `--repo-root` aufgelöst. |
| `--repo-root <path>`                  | `process.cwd()`                                                 | Repository-Root beim Aufruf aus einem neutralen cwd.                                                                  |
| `--sut-account <id>`                  | `sut`                                                           | Temporäre Account-ID innerhalb der QA-Gateway-Konfiguration.                                                          |
| `--provider-mode <mode>`              | `live-frontier`                                                 | `mock-openai` oder `live-frontier` (veraltetes `live-openai` funktioniert weiterhin).                                 |
| `--model <ref>` / `--alt-model <ref>` | Provider-Standard                                               | Primäre/alternative Modell-Refs.                                                                                      |
| `--fast`                              | aus                                                             | Provider-Schnellmodus, sofern unterstützt.                                                                            |
| `--credential-source <env\|convex>`   | `env`                                                           | Siehe [Convex-Zugangsdatenpool](#convex-credential-pool).                                                             |
| `--credential-role <maintainer\|ci>`  | `ci` in CI, sonst `maintainer`                                  | Rolle, die bei `--credential-source convex` verwendet wird.                                                           |

Jede Lane beendet sich mit einem Nicht-Null-Code, wenn ein Szenario fehlschlägt. `--allow-failures` schreibt Artefakte, ohne einen fehlschlagenden Exit-Code zu setzen.

### Telegram-QA

```bash
pnpm openclaw qa telegram
```

Zielt auf eine echte private Telegram-Gruppe mit zwei unterschiedlichen Bots (Treiber + SUT). Der SUT-Bot muss einen Telegram-Benutzernamen haben; Bot-zu-Bot-Beobachtung funktioniert am besten, wenn beide Bots den **Bot-to-Bot Communication Mode** in `@BotFather` aktiviert haben.

Erforderliche Umgebung bei `--credential-source env`:

- `OPENCLAW_QA_TELEGRAM_GROUP_ID` - numerische Chat-ID (String).
- `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`

Optional:

- `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1` behält Nachrichtentexte in Artefakten beobachteter Nachrichten (standardmäßig redigiert).

Szenarien (`extensions/qa-lab/src/live-transports/telegram/telegram-live.runtime.ts:44`):

- `telegram-canary`
- `telegram-mention-gating`
- `telegram-mentioned-message-reply`
- `telegram-help-command`
- `telegram-commands-command`
- `telegram-tools-compact-command`
- `telegram-whoami-command`
- `telegram-context-command`
- `telegram-long-final-reuses-preview`
- `telegram-long-final-three-chunks`

Ausgabeartefakte:

- `telegram-qa-report.md`
- `telegram-qa-summary.json` - enthält RTT pro Antwort (Treibersendung → beobachtete SUT-Antwort), beginnend mit dem Canary.
- `telegram-qa-observed-messages.json` - Texte redigiert, sofern nicht `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1`.

### Discord-QA

```bash
pnpm openclaw qa discord
```

Zielt auf einen echten privaten Discord-Guild-Kanal mit zwei Bots: einen vom Harness gesteuerten Treiber-Bot und einen SUT-Bot, der vom untergeordneten OpenClaw Gateway über das gebündelte Discord Plugin gestartet wird. Verifiziert die Verarbeitung von Kanal-Erwähnungen, dass der SUT-Bot den nativen `/help`-Befehl bei Discord registriert hat, und Opt-in-Mantis-Evidence-Szenarien.

Erforderliche Umgebung bei `--credential-source env`:

- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID` - muss mit der von Discord zurückgegebenen SUT-Bot-Benutzer-ID übereinstimmen (andernfalls schlägt die Lane schnell fehl).

Optional:

- `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1` behält Nachrichtentexte in Artefakten beobachteter Nachrichten.

Szenarien (`extensions/qa-lab/src/live-transports/discord/discord-live.runtime.ts:36`):

- `discord-canary`
- `discord-mention-gating`
- `discord-native-help-command-registration`
- `discord-status-reactions-tool-only` - Opt-in-Mantis-Szenario. Läuft allein, weil es den SUT auf immer aktive, reine Tool-Guild-Antworten mit `messages.statusReactions.enabled=true` umschaltet und anschließend eine REST-Reaktions-Timeline sowie HTML-/PNG-Visual-Artefakte erfasst. Mantis-Vorher-/Nachher-Berichte bewahren auch vom Szenario bereitgestellte MP4-Artefakte als `baseline.mp4` und `candidate.mp4` auf.

Führen Sie das Mantis-Statusreaktionsszenario explizit aus:

```bash
pnpm openclaw qa discord \
  --scenario discord-status-reactions-tool-only \
  --provider-mode live-frontier \
  --model openai/gpt-5.4 \
  --alt-model openai/gpt-5.4 \
  --fast
```

Ausgabeartefakte:

- `discord-qa-report.md`
- `discord-qa-summary.json`
- `discord-qa-observed-messages.json` - Inhalte geschwärzt, außer `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1`.
- `discord-qa-reaction-timelines.json` und `discord-status-reactions-tool-only-timeline.png`, wenn das Status-Reaction-Szenario ausgeführt wird.

### Slack-QA

```bash
pnpm openclaw qa slack
```

Zielt auf einen echten privaten Slack-Kanal mit zwei unterschiedlichen Bots: einen Driver-Bot, der vom Harness gesteuert wird, und einen SUT-Bot, der vom untergeordneten OpenClaw-Gateway über das gebündelte Slack-Plugin gestartet wird.

Erforderliche Umgebung bei `--credential-source env`:

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`

Optional:

- `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1` behält Nachrichteninhalte in Observed-Message-Artefakten bei.

Szenarien (`extensions/qa-lab/src/live-transports/slack/slack-live.runtime.ts:39`):

- `slack-canary`
- `slack-mention-gating`
- `slack-allowlist-block`
- `slack-top-level-reply-shape`
- `slack-restart-resume`
- `slack-thread-follow-up`
- `slack-thread-isolation`

Ausgabeartefakte:

- `slack-qa-report.md`
- `slack-qa-summary.json`
- `slack-qa-observed-messages.json` - Inhalte geschwärzt, außer `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1`.

#### Einrichten des Slack-Workspace

Die Lane benötigt zwei unterschiedliche Slack-Apps in einem Workspace sowie einen Kanal, in dem beide Bots Mitglieder sind:

- `channelId` - die `Cxxxxxxxxxx`-ID eines Kanals, in den beide Bots eingeladen wurden. Verwenden Sie einen dedizierten Kanal; die Lane postet bei jedem Lauf.
- `driverBotToken` - Bot-Token (`xoxb-...`) der **Driver**-App.
- `sutBotToken` - Bot-Token (`xoxb-...`) der **SUT**-App, die eine separate Slack-App vom Driver sein muss, damit ihre Bot-Benutzer-ID eindeutig ist.
- `sutAppToken` - App-Level-Token (`xapp-...`) der SUT-App mit `connections:write`, das von Socket Mode verwendet wird, damit die SUT-App Ereignisse empfangen kann.

Bevorzugen Sie einen für QA dedizierten Slack-Workspace gegenüber der Wiederverwendung eines Produktions-Workspace.

Das folgende SUT-Manifest grenzt die Produktionsinstallation des gebündelten Slack-Plugin (`extensions/slack/src/setup-shared.ts:10`) absichtlich auf die Berechtigungen und Ereignisse ein, die von der Live-Slack-QA-Suite abgedeckt werden. Für die Einrichtung des Produktionskanals, wie Benutzer sie sehen, siehe [Slack-Kanal-Schnelleinrichtung](/de/channels/slack#quick-setup); das QA-Driver/SUT-Paar ist absichtlich separat, weil die Lane zwei unterschiedliche Bot-Benutzer-IDs in einem Workspace benötigt.

**1. Driver-App erstellen**

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

Kopieren Sie das _Bot User OAuth Token_ (`xoxb-...`) - daraus wird `driverBotToken`. Der Driver muss nur Nachrichten posten und sich selbst identifizieren; keine Ereignisse, kein Socket Mode.

**2. SUT-App erstellen**

Wiederholen Sie _Create New App → From a manifest_ im selben Workspace. Diese QA-App verwendet absichtlich eine schmalere Version des Produktionsmanifests des gebündelten Slack-Plugin (`extensions/slack/src/setup-shared.ts:10`): Reaction-Scopes und -Ereignisse werden ausgelassen, weil die Live-Slack-QA-Suite die Reaction-Verarbeitung noch nicht abdeckt.

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

Nachdem Slack die App erstellt hat, führen Sie zwei Schritte auf ihrer Einstellungsseite aus:

- _Install to Workspace_ → kopieren Sie das _Bot User OAuth Token_ → daraus wird `sutBotToken`.
- _Basic Information → App-Level Tokens → Generate Token and Scopes_ → fügen Sie den Scope `connections:write` hinzu → speichern → kopieren Sie den `xapp-...`-Wert → daraus wird `sutAppToken`.

Verifizieren Sie, dass die beiden Bots unterschiedliche Benutzer-IDs haben, indem Sie `auth.test` für jedes Token aufrufen. Die Runtime unterscheidet Driver und SUT anhand der Benutzer-ID; die Wiederverwendung einer App für beide schlägt beim Mention-Gating sofort fehl.

**3. Kanal erstellen**

Erstellen Sie im QA-Workspace einen Kanal (z. B. `#openclaw-qa`) und laden Sie beide Bots aus dem Kanal heraus ein:

```
/invite @OpenClaw QA Driver
/invite @OpenClaw QA SUT
```

Kopieren Sie die `Cxxxxxxxxxx`-ID aus _channel info → About → Channel ID_ - daraus wird `channelId`. Ein öffentlicher Kanal funktioniert; wenn Sie einen privaten Kanal verwenden, haben beide Apps bereits `groups:history`, sodass die History-Lesevorgänge des Harness weiterhin erfolgreich sind.

**4. Zugangsdaten registrieren**

Zwei Optionen. Verwenden Sie Umgebungsvariablen für das Debugging auf einer einzelnen Maschine (setzen Sie die vier `OPENCLAW_QA_SLACK_*`-Variablen und übergeben Sie `--credential-source env`), oder befüllen Sie den gemeinsam genutzten Convex-Pool, damit CI und andere Maintainer sie leasen können.

Für den Convex-Pool schreiben Sie die vier Felder in eine JSON-Datei:

```json
{
  "channelId": "Cxxxxxxxxxx",
  "driverBotToken": "xoxb-...",
  "sutBotToken": "xoxb-...",
  "sutAppToken": "xapp-..."
}
```

Wenn `OPENCLAW_QA_CONVEX_SITE_URL` und `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` in Ihrer Shell exportiert sind, registrieren und verifizieren Sie:

```bash
pnpm openclaw qa credentials add \
  --kind slack \
  --payload-file slack-creds.json \
  --note "QA Slack pool seed"

pnpm openclaw qa credentials list --kind slack --status all --json
```

Erwarten Sie `count: 1`, `status: "active"`, kein `lease`-Feld.

**5. Ende-zu-Ende verifizieren**

Führen Sie die Lane lokal aus, um zu bestätigen, dass beide Bots über den Broker miteinander kommunizieren können:

```bash
pnpm openclaw qa slack \
  --credential-source convex \
  --credential-role maintainer \
  --output-dir .artifacts/qa-e2e/slack-local
```

Ein grüner Lauf ist deutlich unter 30 Sekunden abgeschlossen, und `slack-qa-report.md` zeigt sowohl `slack-canary` als auch `slack-mention-gating` mit dem Status `pass`. Wenn die Lane ca. 90 Sekunden hängt und mit `Convex credential pool exhausted for kind "slack"` beendet wird, ist entweder der Pool leer oder jede Zeile ist geleast - `qa credentials list --kind slack --status all --json` zeigt Ihnen, was zutrifft.

### Convex-Zugangsdaten-Pool

Telegram-, Discord- und Slack-Lanes können Zugangsdaten aus einem gemeinsam genutzten Convex-Pool leasen, statt die oben genannten Umgebungsvariablen zu lesen. Übergeben Sie `--credential-source convex` (oder setzen Sie `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`); QA Lab erwirbt eine exklusive Lease, sendet während der Laufzeit Heartbeats dafür und gibt sie beim Herunterfahren frei. Pool-Arten sind `"telegram"`, `"discord"` und `"slack"`.

Payload-Formen, die der Broker bei `admin/add` validiert:

- Telegram (`kind: "telegram"`): `{ groupId: string, driverToken: string, sutToken: string }` - `groupId` muss eine numerische Chat-ID-Zeichenkette sein.
- Discord (`kind: "discord"`): `{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string }`.
- Slack (`kind: "slack"`): `{ channelId: string, driverBotToken: string, sutBotToken: string, sutAppToken: string }` - `channelId` muss `^[A-Z][A-Z0-9]+$` entsprechen (eine Slack-ID wie `Cxxxxxxxxxx`). Siehe [Einrichten des Slack-Workspace](#setting-up-the-slack-workspace) für die Bereitstellung von App und Scopes.

Operative Umgebungsvariablen und der Endpoint-Vertrag des Convex-Brokers stehen in [Testing → gemeinsam genutzte Telegram-Zugangsdaten über Convex](/de/help/testing#shared-telegram-credentials-via-convex-v1) (der Abschnittsname stammt aus der Zeit vor der Discord-Unterstützung; die Broker-Semantik ist für beide Arten identisch).

## Repo-gestützte Seeds

Seed-Assets liegen in `qa/`:

- `qa/scenarios/index.md`
- `qa/scenarios/<theme>/*.md`

Diese befinden sich absichtlich in Git, damit der QA-Plan sowohl für Menschen als auch für den Agent sichtbar ist.

`qa-lab` sollte ein generischer Markdown-Runner bleiben. Jede Szenario-Markdown-Datei ist die maßgebliche Quelle für einen Testlauf und sollte Folgendes definieren:

- Szenario-Metadaten
- optionale Kategorie-, Capability-, Lane- und Risiko-Metadaten
- Dokumentations- und Code-Referenzen
- optionale Plugin-Anforderungen
- optionaler Gateway-Konfigurations-Patch
- der ausführbare `qa-flow`

Die wiederverwendbare Runtime-Oberfläche, die `qa-flow` unterstützt, darf generisch und querschnittlich bleiben. Beispielsweise können Markdown-Szenarien transportseitige Helfer mit browserseitigen Helfern kombinieren, die die eingebettete Control UI über den Gateway-Seam `browser.request` steuern, ohne einen Sonderfall-Runner hinzuzufügen.

Szenariodateien sollten nach Produkt-Capability statt nach Source-Tree-Ordner gruppiert werden. Halten Sie Szenario-IDs stabil, wenn Dateien verschoben werden; verwenden Sie `docsRefs` und `codeRefs` für die Implementierungsnachvollziehbarkeit.

Die Baseline-Liste sollte breit genug bleiben, um Folgendes abzudecken:

- DM- und Kanal-Chat
- Thread-Verhalten
- Message-Action-Lebenszyklus
- Cron-Callbacks
- Memory Recall
- Modellwechsel
- Subagent-Handoff
- Repo-Lesen und Dokumentations-Lesen
- eine kleine Build-Aufgabe wie Lobster Invaders

## Provider-Mock-Lanes

`qa suite` hat zwei lokale Provider-Mock-Lanes:

- `mock-openai` ist der szenariobewusste OpenClaw-Mock. Er bleibt die standardmäßige deterministische Mock-Lane für repo-gestützte QA und Parity-Gates.
- `aimock` startet einen AIMock-gestützten Provider-Server für experimentelle Protokoll-, Fixture-, Record/Replay- und Chaos-Abdeckung. Er ist additiv und ersetzt den Szenario-Dispatcher `mock-openai` nicht.

Die Provider-Lane-Implementierung liegt unter `extensions/qa-lab/src/providers/`. Jeder Provider besitzt seine Defaults, den Start des lokalen Servers, die Gateway-Modellkonfiguration, Anforderungen für Auth-Profile-Staging sowie Live-/Mock-Capability-Flags. Gemeinsamer Suite- und Gateway-Code sollte über die Provider-Registry routen, statt nach Provider-Namen zu verzweigen.

## Transport-Adapter

`qa-lab` besitzt einen generischen Transport-Seam für Markdown-QA-Szenarien. `qa-channel` ist der erste Adapter an diesem Seam, aber das Designziel ist breiter: Zukünftige echte oder synthetische Kanäle sollten in denselben Suite-Runner eingesteckt werden, statt einen transportspezifischen QA-Runner hinzuzufügen.

Auf Architekturebene ist die Aufteilung:

- `qa-lab` besitzt generische Szenarioausführung, Worker-Concurrency, Artefaktschreiben und Reporting.
- Der Transport-Adapter besitzt Gateway-Konfiguration, Readiness, Inbound- und Outbound-Beobachtung, Transport-Aktionen und normalisierten Transport-Zustand.
- Markdown-Szenariodateien unter `qa/scenarios/` definieren den Testlauf; `qa-lab` stellt die wiederverwendbare Runtime-Oberfläche bereit, die sie ausführt.

### Kanal hinzufügen

Das Hinzufügen eines Kanals zum Markdown-QA-System erfordert genau zwei Dinge:

1. Einen Transport-Adapter für den Kanal.
2. Ein Szenario-Pack, das den Kanalvertrag ausübt.

Fügen Sie keinen neuen Top-Level-QA-Command-Root hinzu, wenn der gemeinsame `qa-lab`-Host den Flow besitzen kann.

`qa-lab` besitzt die gemeinsamen Host-Mechaniken:

- der Befehlsstamm `openclaw qa`
- Start und Teardown der Suite
- Worker-Parallelität
- Schreiben von Artefakten
- Berichtserstellung
- Szenarioausführung
- Kompatibilitätsaliase für ältere `qa-channel`-Szenarien

Runner-Plugins besitzen den Transportvertrag:

- wie `openclaw qa <runner>` unterhalb des gemeinsamen `qa`-Stamms eingehängt wird
- wie das Gateway für diesen Transport konfiguriert wird
- wie Bereitschaft geprüft wird
- wie eingehende Ereignisse injiziert werden
- wie ausgehende Nachrichten beobachtet werden
- wie Transkripte und normalisierter Transportzustand offengelegt werden
- wie transportgestützte Aktionen ausgeführt werden
- wie transportspezifisches Zurücksetzen oder Aufräumen behandelt wird

Die Mindestanforderung für die Einführung eines neuen Kanals:

1. Behalten Sie `qa-lab` als Besitzer des gemeinsamen `qa`-Stamms bei.
2. Implementieren Sie den Transport-Runner auf der gemeinsamen Host-Nahtstelle von `qa-lab`.
3. Halten Sie transportspezifische Mechanik im Runner-Plugin oder Channel-Harness.
4. Hängen Sie den Runner als `openclaw qa <runner>` ein, statt einen konkurrierenden Stammbefehl zu registrieren. Runner-Plugins sollten `qaRunners` in `openclaw.plugin.json` deklarieren und ein passendes Array `qaRunnerCliRegistrations` aus `runtime-api.ts` exportieren. Halten Sie `runtime-api.ts` schlank; verzögerte CLI- und Runner-Ausführung sollten hinter separaten Einstiegspunkten bleiben.
5. Schreiben oder adaptieren Sie Markdown-Szenarien unter den thematisch gruppierten Verzeichnissen `qa/scenarios/`.
6. Verwenden Sie die generischen Szenario-Helfer für neue Szenarien.
7. Halten Sie bestehende Kompatibilitätsaliase funktionsfähig, sofern das Repo keine absichtliche Migration durchführt.

Die Entscheidungsregel ist strikt:

- Wenn Verhalten einmalig in `qa-lab` ausgedrückt werden kann, legen Sie es in `qa-lab` ab.
- Wenn Verhalten von einem Kanaltransport abhängt, behalten Sie es in diesem Runner-Plugin oder Plugin-Harness.
- Wenn ein Szenario eine neue Fähigkeit benötigt, die mehr als ein Kanal verwenden kann, fügen Sie einen generischen Helfer hinzu statt eines kanalspezifischen Zweigs in `suite.ts`.
- Wenn ein Verhalten nur für einen Transport sinnvoll ist, halten Sie das Szenario transportspezifisch und machen Sie das im Szenariovertrag explizit.

### Namen von Szenario-Helfern

Bevorzugte generische Helfer für neue Szenarien:

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

Kompatibilitätsaliase bleiben für bestehende Szenarien verfügbar - `waitForQaChannelReady`, `waitForOutboundMessage`, `waitForNoOutbound`, `formatConversationTranscript`, `resetBus` - aber neue Szenarien sollten die generischen Namen verwenden. Die Aliase existieren, um eine Stichtagsmigration zu vermeiden, nicht als zukünftiges Modell.

## Reporting

`qa-lab` exportiert einen Markdown-Protokollbericht aus der beobachteten Bus-Zeitachse.
Der Bericht sollte beantworten:

- Was funktioniert hat
- Was fehlgeschlagen ist
- Was blockiert geblieben ist
- Welche Folgeszenarien es wert sind, hinzugefügt zu werden

Für das Inventar verfügbarer Szenarien - nützlich beim Einschätzen von Folgearbeit oder beim Verdrahten eines neuen Transports - führen Sie `pnpm openclaw qa coverage` aus (fügen Sie `--json` für maschinenlesbare Ausgabe hinzu).

Für Zeichen- und Stilprüfungen führen Sie dasselbe Szenario über mehrere Live-Modell-Refs aus und schreiben einen bewerteten Markdown-Bericht:

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

Der Befehl führt lokale QA-Gateway-Kindprozesse aus, nicht Docker. Character-Eval-Szenarien sollten die Persona über `SOUL.md` festlegen und dann gewöhnliche Benutzer-Turns ausführen, etwa Chat, Workspace-Hilfe und kleine Datei-Aufgaben. Dem Kandidatenmodell sollte nicht mitgeteilt werden, dass es evaluiert wird. Der Befehl bewahrt jedes vollständige Transkript auf, zeichnet grundlegende Laufstatistiken auf und bittet dann die Judge-Modelle im Fast-Modus mit `xhigh`-Reasoning, wo unterstützt, die Läufe nach Natürlichkeit, Vibe und Humor zu ranken.
Verwenden Sie `--blind-judge-models`, wenn Sie Provider vergleichen: Der Judge-Prompt erhält weiterhin jedes Transkript und jeden Laufstatus, aber Kandidaten-Refs werden durch neutrale Labels wie `candidate-01` ersetzt; der Bericht ordnet Rankings nach dem Parsen wieder realen Refs zu.
Kandidatenläufe verwenden standardmäßig `high`-Thinking, mit `medium` für GPT-5.5 und `xhigh` für ältere OpenAI-Eval-Refs, die es unterstützen. Überschreiben Sie einen bestimmten Kandidaten inline mit `--model provider/model,thinking=<level>`. `--thinking <level>` setzt weiterhin einen globalen Fallback, und die ältere Form `--model-thinking <provider/model=level>` bleibt aus Kompatibilitätsgründen erhalten.
OpenAI-Kandidaten-Refs verwenden standardmäßig den Fast-Modus, damit Priority Processing genutzt wird, wo der Provider es unterstützt. Fügen Sie inline `,fast`, `,no-fast` oder `,fast=false` hinzu, wenn ein einzelner Kandidat oder Judge eine Überschreibung benötigt. Übergeben Sie `--fast` nur, wenn Sie den Fast-Modus für jedes Kandidatenmodell erzwingen möchten. Kandidaten- und Judge-Dauern werden im Bericht für Benchmark-Analysen aufgezeichnet, aber Judge-Prompts sagen ausdrücklich, nicht nach Geschwindigkeit zu ranken.
Kandidaten- und Judge-Modellläufe verwenden beide standardmäßig Parallelität 16. Senken Sie `--concurrency` oder `--judge-concurrency`, wenn Provider-Limits oder lokaler Gateway-Druck einen Lauf zu verrauscht machen.
Wenn kein Kandidaten-`--model` übergeben wird, verwendet Character Eval standardmäßig `openai/gpt-5.5`, `openai/gpt-5.2`, `openai/gpt-5`, `anthropic/claude-opus-4-6`, `anthropic/claude-sonnet-4-6`, `zai/glm-5.1`, `moonshot/kimi-k2.5` und `google/gemini-3.1-pro-preview`, wenn kein `--model` übergeben wird.
Wenn kein `--judge-model` übergeben wird, sind die Standard-Judges `openai/gpt-5.5,thinking=xhigh,fast` und `anthropic/claude-opus-4-6,thinking=high`.

## Verwandte Dokumentation

- [Matrix-QA](/de/concepts/qa-matrix)
- [QA Channel](/de/channels/qa-channel)
- [Testing](/de/help/testing)
- [Dashboard](/de/web/dashboard)
