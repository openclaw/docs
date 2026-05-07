---
read_when:
    - Verstehen, wie der QA-Stack zusammenpasst
    - qa-lab, qa-channel oder einen Transportadapter erweitern
    - Repository-gestützte QA-Szenarien hinzufügen
    - Aufbau einer realitätsnäheren QA-Automatisierung rund um das Gateway-Dashboard
summary: 'Überblick über den QA-Stack: qa-lab, qa-channel, repo-gestützte Szenarien, Live-Transport-Lanes, Transportadapter und Reporting.'
title: QA-Überblick
x-i18n:
    generated_at: "2026-05-07T13:15:52Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9b767fff432112ff20cae738e40da45cdbf00a2431cb17c025e098b97eafa3e8
    source_path: concepts/qa-e2e-automation.md
    workflow: 16
---

Der private QA-Stack soll OpenClaw auf eine realistischere,
kanalähnliche Weise prüfen, als es ein einzelner Unit-Test kann.

Aktuelle Bestandteile:

- `extensions/qa-channel`: synthetischer Nachrichtenkanal mit DM-, Kanal-, Thread-,
  Reaktions-, Bearbeitungs- und Lösch-Oberflächen.
- `extensions/qa-lab`: Debugger-UI und QA-Bus zum Beobachten des Transkripts,
  Einspeisen eingehender Nachrichten und Exportieren eines Markdown-Berichts.
- `extensions/qa-matrix`, zukünftige Runner-Plugins: Live-Transport-Adapter, die
  einen echten Kanal innerhalb eines untergeordneten QA-Gateways steuern.
- `qa/`: repo-gestützte Seed-Assets für die Kickoff-Aufgabe und Baseline-QA-
  Szenarien.
- [Mantis](/de/concepts/mantis): Vorher- und Nachher-Live-Verifizierung für Bugs, die
  echte Transporte, Browser-Screenshots, VM-Zustand und PR-Nachweise benötigen.

## Befehlsoberfläche

Jeder QA-Flow läuft unter `pnpm openclaw qa <subcommand>`. Viele haben `pnpm qa:*`-
Skript-Aliase; beide Formen werden unterstützt.

| Befehl                                             | Zweck                                                                                                                                                                                                                                                                 |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `qa run`                                            | Gebündelter QA-Selbsttest; schreibt einen Markdown-Bericht.                                                                                                                                                                                                                        |
| `qa suite`                                          | Repo-gestützte Szenarien gegen die QA-Gateway-Lane ausführen. Aliase: `pnpm openclaw qa suite --runner multipass` für eine verwerfbare Linux-VM.                                                                                                                                  |
| `qa coverage`                                       | Das Markdown-Inventar zur Szenarioabdeckung ausgeben (`--json` für maschinenlesbare Ausgabe).                                                                                                                                                                                           |
| `qa parity-report`                                  | Zwei `qa-suite-summary.json`-Dateien vergleichen und den agentischen Paritätsbericht schreiben.                                                                                                                                                                                          |
| `qa character-eval`                                 | Das Charakter-QA-Szenario über mehrere Live-Modelle hinweg mit einem bewerteten Bericht ausführen. Siehe [Berichterstattung](#reporting).                                                                                                                                                            |
| `qa manual`                                         | Einen einmaligen Prompt gegen die ausgewählte Provider-/Modell-Lane ausführen.                                                                                                                                                                                                          |
| `qa ui`                                             | Die QA-Debugger-UI und den lokalen QA-Bus starten (Alias: `pnpm qa:lab:ui`).                                                                                                                                                                                                    |
| `qa docker-build-image`                             | Das vorgebackene QA-Docker-Image bauen.                                                                                                                                                                                                                                     |
| `qa docker-scaffold`                                | Ein docker-compose-Gerüst für das QA-Dashboard und die Gateway-Lane schreiben.                                                                                                                                                                                                    |
| `qa up`                                             | Die QA-Site bauen, den Docker-gestützten Stack starten und die URL ausgeben (Alias: `pnpm qa:lab:up`; die Variante `:fast` fügt `--use-prebuilt-image --bind-ui-dist --skip-ui-build` hinzu).                                                                                                  |
| `qa aimock`                                         | Nur den AIMock-Provider-Server starten.                                                                                                                                                                                                                                  |
| `qa mock-openai`                                    | Nur den szenariobewussten `mock-openai`-Provider-Server starten.                                                                                                                                                                                                            |
| `qa credentials doctor` / `add` / `list` / `remove` | Den gemeinsamen Convex-Anmeldeinformationspool verwalten.                                                                                                                                                                                                                               |
| `qa matrix`                                         | Live-Transport-Lane gegen einen verwerfbaren Tuwunel-Homeserver. Siehe [Matrix-QA](/de/concepts/qa-matrix).                                                                                                                                                                      |
| `qa telegram`                                       | Live-Transport-Lane gegen eine echte private Telegram-Gruppe.                                                                                                                                                                                                              |
| `qa discord`                                        | Live-Transport-Lane gegen einen echten privaten Discord-Guild-Kanal.                                                                                                                                                                                                       |
| `qa slack`                                          | Live-Transport-Lane gegen einen echten privaten Slack-Kanal.                                                                                                                                                                                                               |
| `qa mantis`                                         | Vorher- und Nachher-Verifizierungs-Runner für Live-Transport-Bugs, mit Discord-Statusreaktions-Nachweisen, Crabbox-Desktop-/Browser-Smoke-Test und Slack-in-VNC-Smoke-Test. Siehe [Mantis](/de/concepts/mantis) und [Mantis Slack Desktop Runbook](/de/concepts/mantis-slack-desktop-runbook). |

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
Agenten eine QA-Mission geben, echtes Kanalverhalten beobachten und aufzeichnen kann,
was funktioniert hat, fehlgeschlagen ist oder blockiert blieb.

Für schnellere Iterationen an der QA-Lab-UI, ohne jedes Mal das Docker-Image neu zu bauen,
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

Für einen lokalen OpenTelemetry-Trace-Smoke-Test führen Sie aus:

```bash
pnpm qa:otel:smoke
```

Dieses Skript startet einen lokalen OTLP/HTTP-Trace-Receiver, führt das
`otel-trace-smoke`-QA-Szenario mit aktiviertem `diagnostics-otel`-Plugin aus,
dekodiert anschließend die exportierten Protobuf-Spans und prüft die release-kritische Form:
`openclaw.run`, `openclaw.harness.run`, `openclaw.model.call`,
`openclaw.context.assembled` und `openclaw.message.delivery` müssen vorhanden sein;
Modellaufrufe dürfen bei erfolgreichen Turns kein `StreamAbandoned` exportieren; rohe Diagnose-IDs und
`openclaw.content.*`-Attribute müssen außerhalb des Trace bleiben. Es schreibt
`otel-smoke-summary.json` neben die QA-Suite-Artefakte.

Observability-QA bleibt nur für Source-Checkouts verfügbar. Der npm-Tarball lässt
QA Lab absichtlich aus, daher führen Paket-Docker-Release-Lanes keine `qa`-Befehle aus. Verwenden Sie
`pnpm qa:otel:smoke` aus einem gebauten Source-Checkout, wenn Sie Diagnose-
Instrumentierung ändern.

Für eine transportechte Matrix-Smoke-Lane führen Sie aus:

```bash
pnpm openclaw qa matrix --profile fast --fail-fast
```

Die vollständige CLI-Referenz, der Profil-/Szenariokatalog, Umgebungsvariablen und das Artefaktlayout für diese Lane befinden sich in [Matrix-QA](/de/concepts/qa-matrix). Auf einen Blick: Sie stellt einen verwerfbaren Tuwunel-Homeserver in Docker bereit, registriert temporäre Driver-/SUT-/Observer-Benutzer, führt das echte Matrix-Plugin innerhalb eines untergeordneten QA-Gateways aus, das auf diesen Transport beschränkt ist (kein `qa-channel`), und schreibt anschließend einen Markdown-Bericht, eine JSON-Zusammenfassung, ein Artefakt mit beobachteten Ereignissen und ein kombiniertes Ausgabelog unter `.artifacts/qa-e2e/matrix-<timestamp>/`.

Die Szenarien decken Transportverhalten ab, das Unit-Tests nicht Ende-zu-Ende nachweisen können: Mention-Gating, Allow-Bot-Richtlinien, Allowlists, Antworten auf oberster Ebene und in Threads, DM-Routing, Reaktionsverarbeitung, Unterdrückung eingehender Bearbeitungen, Neustart-Replay-Deduplizierung, Wiederherstellung nach Homeserver-Unterbrechungen, Zustellung von Approval-Metadaten, Medienverarbeitung sowie Matrix-E2EE-Bootstrap-/Wiederherstellungs-/Verifizierungs-Flows. Das E2EE-CLI-Profil steuert außerdem `openclaw matrix encryption setup` und Verifizierungsbefehle über denselben verwerfbaren Homeserver, bevor Gateway-Antworten geprüft werden.

Discord hat außerdem Mantis-only-Opt-in-Szenarien zur Bug-Reproduktion. Verwenden Sie
`--scenario discord-status-reactions-tool-only` für die explizite Statusreaktions-
Zeitleiste oder `--scenario discord-thread-reply-filepath-attachment`, um einen
echten Discord-Thread zu erstellen und zu verifizieren, dass `message.thread-reply` einen
`filePath`-Anhang beibehält. Diese Szenarien bleiben außerhalb der standardmäßigen Live-Discord-Lane,
weil sie Vorher-/Nachher-Repro-Prüfungen statt breiter Smoke-Abdeckung sind.
Der Mantis-Workflow für Thread-Anhänge kann außerdem ein angemeldetes Discord-Web-
Zeugenvideo hinzufügen, wenn `MANTIS_DISCORD_VIEWER_CHROME_PROFILE_DIR` oder
`MANTIS_DISCORD_VIEWER_CHROME_PROFILE_TGZ_B64` in der QA-
Umgebung konfiguriert ist. Dieses Viewer-Profil dient nur der visuellen Erfassung; die Pass/Fail-
Entscheidung kommt weiterhin vom Discord-REST-Orakel.

CI verwendet dieselbe Befehlsoberfläche in `.github/workflows/qa-live-transports-convex.yml`. Geplante und standardmäßige manuelle Läufe führen das schnelle Matrix-Profil mit Live-Frontier-Anmeldeinformationen, `--fast` und `OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS=3000` aus. Manuelles `matrix_profile=all` fächert in die fünf Profil-Shards auf, sodass der vollständige Katalog parallel laufen kann, während ein Artefaktverzeichnis pro Shard beibehalten wird.

Für transportechte Telegram-, Discord- und Slack-Smoke-Lanes:

```bash
pnpm openclaw qa telegram
pnpm openclaw qa discord
pnpm openclaw qa slack
```

Sie zielen auf einen bereits vorhandenen echten Kanal mit zwei Bots (Driver + SUT). Erforderliche Umgebungsvariablen, Szenariolisten, Ausgabeartefakte und der Convex-Anmeldeinformationspool sind unten in der [Telegram-, Discord- und Slack-QA-Referenz](#telegram-discord-and-slack-qa-reference) dokumentiert.

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
Crabbox-Desktop-/Browser-Leases stellen die Erfassungstools und Browser-/Native-Build-Hilfspakete
vorab bereit, sodass das Szenario Fallbacks nur auf älteren
Leases installieren sollte. Mantis meldet Gesamt- und Pro-Phase-Zeitangaben in
`mantis-slack-desktop-smoke-report.md`, damit langsame Läufe zeigen, ob Zeit in
Lease-Warmup, Anmeldedatenabruf, Remote-Einrichtung oder Artefaktkopie geflossen ist. Verwenden Sie
`--lease-id <cbx_...>` erneut, nachdem Sie sich manuell über VNC bei Slack Web angemeldet haben;
wiederverwendete Leases halten außerdem den pnpm-Store-Cache von Crabbox warm. Der Standard
`--hydrate-mode source` verifiziert aus einem Source-Checkout und führt Installation/Build
innerhalb der VM aus. Verwenden Sie `--hydrate-mode prehydrated` nur, wenn der wiederverwendete Remote-
Workspace bereits `node_modules` und ein gebautes `dist/` enthält; dieser Modus überspringt den
teuren Installations-/Build-Schritt und schlägt geschlossen fehl, wenn der Workspace nicht bereit ist.
Mit `--gateway-setup` lässt Mantis ein persistentes OpenClaw-Slack-Gateway
innerhalb der VM auf Port `38973` laufen; ohne diese Option führt der Befehl die normale
Bot-zu-Bot-Slack-QA-Lane aus und beendet sich nach der Artefakterfassung.

Die Operator-Checkliste, der GitHub-Workflow-Dispatch-Befehl, der Evidence-Comment-
Vertrag, die Hydrate-Mode-Entscheidungstabelle, die Zeitinterpretation und die Schritte zur
Fehlerbehandlung befinden sich im [Mantis Slack Desktop Runbook](/de/concepts/mantis-slack-desktop-runbook).

Für eine Desktop-Aufgabe im Agent/CV-Stil führen Sie aus:

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
Wenn `--expect-text` gesetzt ist, fragt der Vision-Prompt nach einem strukturierten JSON-
Urteil und besteht nur, wenn das Modell positive sichtbare Evidenz meldet; eine
negative Antwort, die lediglich den Zieltext zitiert, lässt die Assertion fehlschlagen.
Verwenden Sie `--vision-mode metadata` für einen Smoke ohne Modell, der Desktop,
Browser, Screenshot und Video-Verkabelung nachweist, ohne einen Image-Understanding-
Provider aufzurufen. Die Aufzeichnung ist ein erforderliches Artefakt für `visual-task`; wenn Crabbox
kein nicht leeres `visual-task.mp4` aufzeichnet, schlägt die Aufgabe fehl, selbst wenn der Visual Driver
bestanden hat. Bei einem Fehler behält Mantis den Lease für VNC, sofern die Aufgabe nicht bereits
bestanden hatte und `--keep-lease` nicht gesetzt war.

Bevor Sie gepoolte Live-Anmeldedaten verwenden, führen Sie aus:

```bash
pnpm openclaw qa credentials doctor
```

Der Doctor prüft die Convex-Broker-Umgebung, validiert Endpoint-Einstellungen und verifiziert die Admin-/Listen-Erreichbarkeit, wenn das Maintainer-Secret vorhanden ist. Er meldet für Secrets nur den Status gesetzt/fehlend.

## Live-Transport-Abdeckung

Live-Transport-Lanes teilen sich einen Vertrag, statt jeweils eine eigene Form für Szenariolisten zu erfinden. `qa-channel` ist die breite synthetische Suite für Produktverhalten und ist nicht Teil der Live-Transport-Abdeckungsmatrix.

| Lane     | Canary | Mention-Gating | Bot-zu-Bot | Allowlist-Sperre | Top-Level-Antwort | Neustart-Fortsetzung | Thread-Follow-up | Thread-Isolation | Reaktionsbeobachtung | Help-Befehl | Native Befehlsregistrierung |
| -------- | ------ | -------------- | ---------- | ---------------- | ----------------- | -------------------- | ---------------- | ---------------- | --------------------- | ----------- | --------------------------- |
| Matrix   | x      | x              | x          | x                | x                 | x                    | x                | x                | x                     |             |                             |
| Telegram | x      | x              | x          |                  |                   |                      |                  |                  |                       | x           |                             |
| Discord  | x      | x              | x          |                  |                   |                      |                  |                  |                       |             | x                           |
| Slack    | x      | x              | x          | x                | x                 | x                    | x                | x                |                       |             |                             |

Dadurch bleibt `qa-channel` die breite Suite für Produktverhalten, während Matrix,
Telegram und künftige Live-Transporte eine explizite gemeinsame Transportvertrags-
Checkliste verwenden.

Für eine Wegwerf-Linux-VM-Lane, ohne Docker in den QA-Pfad einzubringen, führen Sie aus:

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

Dies startet einen frischen Multipass-Gast, installiert Abhängigkeiten, baut OpenClaw
im Gast, führt `qa suite` aus und kopiert anschließend den normalen QA-Bericht und die
Zusammenfassung zurück in `.artifacts/qa-e2e/...` auf dem Host.
Es verwendet dasselbe Verhalten für die Szenarioauswahl wie `qa suite` auf dem Host.
Host- und Multipass-Suite-Läufe führen standardmäßig mehrere ausgewählte Szenarien parallel
mit isolierten Gateway-Workern aus. `qa-channel` verwendet standardmäßig Parallelität
4, begrenzt durch die Anzahl der ausgewählten Szenarien. Verwenden Sie `--concurrency <count>`, um
die Worker-Anzahl anzupassen, oder `--concurrency 1` für serielle Ausführung.
Der Befehl beendet sich mit einem Exit-Code ungleich null, wenn ein Szenario fehlschlägt. Verwenden Sie `--allow-failures`, wenn
Sie Artefakte ohne fehlgeschlagenen Exit-Code möchten.
Live-Läufe leiten die unterstützten QA-Auth-Eingaben weiter, die für den
Gast praktikabel sind: env-basierte Provider-Schlüssel, den QA-Live-Provider-Konfigurationspfad und
`CODEX_HOME`, sofern vorhanden. Behalten Sie `--output-dir` unterhalb des Repo-Roots, damit der Gast
über den gemounteten Workspace zurückschreiben kann.

## Telegram-, Discord- und Slack-QA-Referenz

Matrix hat eine [eigene Seite](/de/concepts/qa-matrix), wegen seiner Szenarioanzahl und der Docker-gestützten Homeserver-Bereitstellung. Telegram, Discord und Slack sind kleiner - jeweils eine Handvoll Szenarien, kein Profilsystem, gegen bereits vorhandene reale Kanäle -, daher befindet sich ihre Referenz hier.

### Gemeinsame CLI-Flags

Diese Lanes registrieren sich über `extensions/qa-lab/src/live-transports/shared/live-transport-cli.ts` und akzeptieren dieselben Flags:

| Flag                                  | Standard                                                        | Beschreibung                                                                                                                |
| ------------------------------------- | --------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `--scenario <id>`                     | -                                                               | Nur dieses Szenario ausführen. Wiederholbar.                                                                                |
| `--output-dir <path>`                 | `<repo>/.artifacts/qa-e2e/{telegram,discord,slack}-<timestamp>` | Ort, an den Berichte/Zusammenfassung/beobachtete Nachrichten und das Ausgabelog geschrieben werden. Relative Pfade werden gegen `--repo-root` aufgelöst. |
| `--repo-root <path>`                  | `process.cwd()`                                                 | Repository-Root beim Aufruf aus einem neutralen cwd.                                                                        |
| `--sut-account <id>`                  | `sut`                                                           | Temporäre Account-ID innerhalb der QA-Gateway-Konfiguration.                                                                |
| `--provider-mode <mode>`              | `live-frontier`                                                 | `mock-openai` oder `live-frontier` (Legacy-`live-openai` funktioniert weiterhin).                                           |
| `--model <ref>` / `--alt-model <ref>` | Provider-Standard                                               | Primäre/alternative Modellrefs.                                                                                            |
| `--fast`                              | aus                                                             | Provider-Fast-Modus, wo unterstützt.                                                                                       |
| `--credential-source <env\|convex>`   | `env`                                                           | Siehe [Convex-Anmeldedatenpool](#convex-credential-pool).                                                                  |
| `--credential-role <maintainer\|ci>`  | `ci` in CI, sonst `maintainer`                                  | Rolle, die bei `--credential-source convex` verwendet wird.                                                                |

Jede Lane beendet sich bei jedem fehlgeschlagenen Szenario mit einem Exit-Code ungleich null. `--allow-failures` schreibt Artefakte, ohne einen fehlgeschlagenen Exit-Code zu setzen.

### Telegram-QA

```bash
pnpm openclaw qa telegram
```

Zielt auf eine reale private Telegram-Gruppe mit zwei verschiedenen Bots (Driver + SUT). Der SUT-Bot muss einen Telegram-Benutzernamen haben; Bot-zu-Bot-Beobachtung funktioniert am besten, wenn beide Bots den **Bot-zu-Bot-Kommunikationsmodus** in `@BotFather` aktiviert haben.

Erforderliche env bei `--credential-source env`:

- `OPENCLAW_QA_TELEGRAM_GROUP_ID` - numerische Chat-ID (String).
- `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`

Optional:

- `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1` behält Nachrichtentexte in Artefakten beobachteter Nachrichten (Standard schwärzt).

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
- `telegram-qa-summary.json` - enthält Pro-Antwort-RTT (Driver-Senden → beobachtete SUT-Antwort), beginnend mit dem Canary.
- `telegram-qa-observed-messages.json` - Texte geschwärzt, sofern nicht `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1`.

### Discord-QA

```bash
pnpm openclaw qa discord
```

Zielt auf einen realen privaten Discord-Guild-Kanal mit zwei Bots: einen Driver-Bot, der vom Harness gesteuert wird, und einen SUT-Bot, der vom untergeordneten OpenClaw-Gateway über das gebündelte Discord-Plugin gestartet wird. Verifiziert die Behandlung von Kanal-Mentions, dass der SUT-Bot den nativen `/help`-Befehl bei Discord registriert hat, sowie Opt-in-Mantis-Evidenzszenarien.

Erforderliche env bei `--credential-source env`:

- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID` - muss der von Discord zurückgegebenen SUT-Bot-Benutzer-ID entsprechen (die Lane schlägt sonst schnell fehl).

Optional:

- `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1` behält Nachrichtentexte in Artefakten beobachteter Nachrichten.
- `OPENCLAW_QA_DISCORD_VOICE_CHANNEL_ID` wählt den Voice-/Stage-Kanal für `discord-voice-autojoin`; ohne diese Option wählt das Szenario den ersten sichtbaren Voice-/Stage-Kanal für den SUT-Bot.

Szenarien (`extensions/qa-lab/src/live-transports/discord/discord-live.runtime.ts:36`):

- `discord-canary`
- `discord-mention-gating`
- `discord-native-help-command-registration`
- `discord-voice-autojoin` - Opt-in-Sprachszenario. Läuft eigenständig, aktiviert `channels.discord.voice.autoJoin` und prüft, ob der aktuelle Discord-Sprachstatus des SUT-Bots der Ziel-Sprach-/Stage-Kanal ist. Convex-Discord-Zugangsdaten können optional `voiceChannelId` enthalten; andernfalls ermittelt der Runner den ersten sichtbaren Sprach-/Stage-Kanal in der Guild.
- `discord-status-reactions-tool-only` - Opt-in-Mantis-Szenario. Läuft eigenständig, weil es den SUT auf Always-on-Guild-Antworten nur mit Tools und `messages.statusReactions.enabled=true` umstellt und anschließend eine REST-Reaktionszeitleiste sowie visuelle HTML-/PNG-Artefakte erfasst. Mantis-Vorher-/Nachher-Berichte bewahren außerdem vom Szenario bereitgestellte MP4-Artefakte als `baseline.mp4` und `candidate.mp4` auf.

Führen Sie das Discord-Szenario für automatischen Sprachbeitritt explizit aus:

```bash
pnpm openclaw qa discord \
  --scenario discord-voice-autojoin \
  --provider-mode mock-openai
```

Führen Sie das Mantis-Szenario für Statusreaktionen explizit aus:

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
- `discord-qa-observed-messages.json` - Inhalte werden geschwärzt, sofern nicht `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1` gesetzt ist.
- `discord-qa-reaction-timelines.json` und `discord-status-reactions-tool-only-timeline.png`, wenn das Statusreaktionsszenario ausgeführt wird.

### Slack-QA

```bash
pnpm openclaw qa slack
```

Zielt auf einen echten privaten Slack-Kanal mit zwei unterschiedlichen Bots: einen vom Harness gesteuerten Driver-Bot und einen SUT-Bot, der vom untergeordneten OpenClaw-Gateway über das gebündelte Slack-Plugin gestartet wird.

Erforderliche Umgebungsvariablen bei `--credential-source env`:

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`

Optional:

- `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1` behält Nachrichteninhalte in Artefakten beobachteter Nachrichten bei.

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
- `slack-qa-observed-messages.json` - Inhalte werden geschwärzt, sofern nicht `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1` gesetzt ist.

#### Slack-Workspace einrichten

Die Lane benötigt zwei unterschiedliche Slack-Apps in einem Workspace sowie einen Kanal, in dem beide Bots Mitglieder sind:

- `channelId` - die `Cxxxxxxxxxx`-ID eines Kanals, in den beide Bots eingeladen wurden. Verwenden Sie einen dedizierten Kanal; die Lane postet bei jedem Lauf.
- `driverBotToken` - Bot-Token (`xoxb-...`) der **Driver**-App.
- `sutBotToken` - Bot-Token (`xoxb-...`) der **SUT**-App, die eine separate Slack-App vom Driver sein muss, damit ihre Bot-Benutzer-ID unterschiedlich ist.
- `sutAppToken` - App-Level-Token (`xapp-...`) der SUT-App mit `connections:write`, das von Socket Mode verwendet wird, damit die SUT-App Ereignisse empfangen kann.

Bevorzugen Sie einen für QA dedizierten Slack-Workspace gegenüber der Wiederverwendung eines Produktions-Workspaces.

Das folgende SUT-Manifest schränkt die Produktionsinstallation des gebündelten Slack-Plugins (`extensions/slack/src/setup-shared.ts:10`) bewusst auf die Berechtigungen und Ereignisse ein, die von der Live-Slack-QA-Suite abgedeckt werden. Die Einrichtung des Produktionskanals aus Benutzersicht finden Sie unter [Schnelleinrichtung des Slack-Kanals](/de/channels/slack#quick-setup); das QA-Driver/SUT-Paar ist absichtlich separat, weil die Lane zwei unterschiedliche Bot-Benutzer-IDs in einem Workspace benötigt.

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

Kopieren Sie das _Bot User OAuth Token_ (`xoxb-...`) - das wird zu `driverBotToken`. Der Driver muss nur Nachrichten posten und sich selbst identifizieren; keine Ereignisse, kein Socket Mode.

**2. SUT-App erstellen**

Wiederholen Sie _Create New App → From a manifest_ im selben Workspace. Diese QA-App verwendet bewusst eine schmalere Version des Produktionsmanifests des gebündelten Slack-Plugins (`extensions/slack/src/setup-shared.ts:10`): Reaktions-Scopes und -Ereignisse sind ausgelassen, weil die Live-Slack-QA-Suite Reaktionsverarbeitung noch nicht abdeckt.

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

Nachdem Slack die App erstellt hat, führen Sie auf der Einstellungsseite zwei Schritte aus:

- _Install to Workspace_ → kopieren Sie das _Bot User OAuth Token_ → das wird zu `sutBotToken`.
- _Basic Information → App-Level Tokens → Generate Token and Scopes_ → fügen Sie den Scope `connections:write` hinzu → speichern → kopieren Sie den Wert `xapp-...` → das wird zu `sutAppToken`.

Prüfen Sie, dass die beiden Bots unterschiedliche Benutzer-IDs haben, indem Sie `auth.test` für jedes Token aufrufen. Die Runtime unterscheidet Driver und SUT anhand der Benutzer-ID; die Wiederverwendung einer App für beide schlägt beim Mention-Gating sofort fehl.

**3. Kanal erstellen**

Erstellen Sie im QA-Workspace einen Kanal (z. B. `#openclaw-qa`) und laden Sie beide Bots aus dem Kanal heraus ein:

```
/invite @OpenClaw QA Driver
/invite @OpenClaw QA SUT
```

Kopieren Sie die `Cxxxxxxxxxx`-ID aus _channel info → About → Channel ID_ - das wird zu `channelId`. Ein öffentlicher Kanal funktioniert; wenn Sie einen privaten Kanal verwenden, haben beide Apps bereits `groups:history`, sodass die History-Lesezugriffe des Harness weiterhin erfolgreich sind.

**4. Zugangsdaten registrieren**

Es gibt zwei Optionen. Verwenden Sie Umgebungsvariablen für das Debugging auf einem einzelnen Rechner (setzen Sie die vier `OPENCLAW_QA_SLACK_*`-Variablen und übergeben Sie `--credential-source env`), oder befüllen Sie den gemeinsamen Convex-Pool, damit CI und andere Maintainer sie leasen können.

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

Erwarten Sie `count: 1`, `status: "active"`, kein `lease`-Feld.

**5. Ende-zu-Ende prüfen**

Führen Sie die Lane lokal aus, um zu bestätigen, dass beide Bots über den Broker miteinander sprechen können:

```bash
pnpm openclaw qa slack \
  --credential-source convex \
  --credential-role maintainer \
  --output-dir .artifacts/qa-e2e/slack-local
```

Ein grüner Lauf wird deutlich unter 30 Sekunden abgeschlossen, und `slack-qa-report.md` zeigt sowohl `slack-canary` als auch `slack-mention-gating` mit Status `pass`. Wenn die Lane etwa 90 Sekunden hängt und mit `Convex credential pool exhausted for kind "slack"` beendet wird, ist entweder der Pool leer oder jede Zeile ist geleast - `qa credentials list --kind slack --status all --json` zeigt Ihnen, was zutrifft.

### Convex-Zugangsdatenpool

Telegram-, Discord- und Slack-Lanes können Zugangsdaten aus einem gemeinsamen Convex-Pool leasen, statt die oben genannten Umgebungsvariablen zu lesen. Übergeben Sie `--credential-source convex` (oder setzen Sie `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`); QA Lab erwirbt eine exklusive Lease, sendet während der Laufzeit Heartbeats dafür und gibt sie beim Herunterfahren frei. Pool-Arten sind `"telegram"`, `"discord"` und `"slack"`.

Payload-Formen, die der Broker bei `admin/add` validiert:

- Telegram (`kind: "telegram"`): `{ groupId: string, driverToken: string, sutToken: string }` - `groupId` muss eine numerische Chat-ID-Zeichenfolge sein.
- Discord (`kind: "discord"`): `{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string }`.
- Slack (`kind: "slack"`): `{ channelId: string, driverBotToken: string, sutBotToken: string, sutAppToken: string }` - `channelId` muss `^[A-Z][A-Z0-9]+$` entsprechen (eine Slack-ID wie `Cxxxxxxxxxx`). Informationen zur App- und Scope-Bereitstellung finden Sie unter [Slack-Workspace einrichten](#setting-up-the-slack-workspace).

Betriebliche Umgebungsvariablen und der Endpoint-Vertrag des Convex-Brokers stehen in [Testing → Gemeinsame Telegram-Zugangsdaten über Convex](/de/help/testing#shared-telegram-credentials-via-convex-v1) (der Abschnittsname stammt aus der Zeit vor Discord-Unterstützung; die Broker-Semantik ist für beide Arten identisch).

## Repo-gestützte Seeds

Seed-Assets liegen in `qa/`:

- `qa/scenarios/index.md`
- `qa/scenarios/<theme>/*.md`

Diese liegen bewusst in Git, damit der QA-Plan sowohl für Menschen als auch für den Agent sichtbar ist.

`qa-lab` sollte ein generischer Markdown-Runner bleiben. Jede Szenario-Markdown-Datei ist die Quelle der Wahrheit für einen Testlauf und sollte Folgendes definieren:

- Szenariometadaten
- optionale Metadaten zu Kategorie, Capability, Lane und Risiko
- Dokumentations- und Code-Referenzen
- optionale Plugin-Anforderungen
- optionaler Gateway-Konfigurationspatch
- den ausführbaren `qa-flow`

Die wiederverwendbare Runtime-Oberfläche, die `qa-flow` unterstützt, darf generisch und querschnittlich bleiben. Beispielsweise können Markdown-Szenarien transportseitige Helper mit browserseitigen Helpern kombinieren, die die eingebettete Control UI über die Gateway-Nahtstelle `browser.request` steuern, ohne einen Sonderfall-Runner hinzuzufügen.

Szenariodateien sollten nach Produkt-Capability statt nach Source-Tree-Ordner gruppiert werden. Halten Sie Szenario-IDs stabil, wenn Dateien verschoben werden; verwenden Sie `docsRefs` und `codeRefs` für die Nachverfolgbarkeit der Implementierung.

Die Baseline-Liste sollte breit genug bleiben, um Folgendes abzudecken:

- DM- und Kanal-Chat
- Thread-Verhalten
- Lebenszyklus von Nachrichtenaktionen
- Cron-Callbacks
- Memory-Abruf
- Modellwechsel
- Subagent-Übergabe
- Repo-Lesen und Dokumentationslesen
- eine kleine Build-Aufgabe wie Lobster Invaders

## Provider-Mock-Lanes

`qa suite` hat zwei lokale Provider-Mock-Lanes:

- `mock-openai` ist der szenariobewusste OpenClaw-Mock. Er bleibt die standardmäßige deterministische Mock-Lane für repo-gestützte QA und Parity-Gates.
- `aimock` startet einen AIMock-gestützten Provider-Server für experimentelle Protokoll-, Fixture-, Record-/Replay- und Chaos-Abdeckung. Er ist additiv und ersetzt nicht den Szenario-Dispatcher `mock-openai`.

Die Implementierung der Provider-Lanes liegt unter `extensions/qa-lab/src/providers/`. Jeder Provider besitzt seine Defaults, den lokalen Serverstart, die Gateway-Modellkonfiguration, Anforderungen für das Staging von Auth-Profilen sowie Live-/Mock-Capability-Flags. Gemeinsamer Suite- und Gateway-Code sollte über die Provider-Registry routen, statt nach Provider-Namen zu verzweigen.

## Transportadapter

`qa-lab` besitzt eine generische Transport-Schnittstelle für Markdown-QA-Szenarien. `qa-channel` ist der erste Adapter an dieser Schnittstelle, aber das Entwurfsziel ist breiter: Zukünftige reale oder synthetische Kanäle sollten sich in denselben Suite-Runner einklinken, statt einen transportspezifischen QA-Runner hinzuzufügen.

Auf Architekturebene ist die Aufteilung:

- `qa-lab` besitzt generische Szenarioausführung, Worker-Parallelität, Artefaktschreibung und Reporting.
- Der Transportadapter besitzt Gateway-Konfiguration, Bereitschaft, eingehende und ausgehende Beobachtung, Transportaktionen und normalisierten Transportzustand.
- Markdown-Szenariodateien unter `qa/scenarios/` definieren den Testlauf; `qa-lab` stellt die wiederverwendbare Runtime-Oberfläche bereit, die sie ausführt.

### Einen Kanal hinzufügen

Einen Kanal zum Markdown-QA-System hinzuzufügen erfordert genau zwei Dinge:

1. Einen Transportadapter für den Kanal.
2. Ein Szenariopaket, das den Kanalvertrag ausübt.

Fügen Sie keine neue oberste QA-Befehlswurzel hinzu, wenn der gemeinsame `qa-lab`-Host den Ablauf besitzen kann.

`qa-lab` besitzt die gemeinsame Host-Mechanik:

- die `openclaw qa`-Befehlswurzel
- Start und Teardown der Suite
- Worker-Parallelität
- Artefaktschreibung
- Berichtserstellung
- Szenarioausführung
- Kompatibilitätsaliase für ältere `qa-channel`-Szenarien

Runner-Plugins besitzen den Transportvertrag:

- wie `openclaw qa <runner>` unterhalb der gemeinsamen `qa`-Wurzel eingehängt wird
- wie das Gateway für diesen Transport konfiguriert wird
- wie Bereitschaft geprüft wird
- wie eingehende Ereignisse injiziert werden
- wie ausgehende Nachrichten beobachtet werden
- wie Transkripte und normalisierter Transportzustand offengelegt werden
- wie transportgestützte Aktionen ausgeführt werden
- wie transportspezifisches Zurücksetzen oder Bereinigen behandelt wird

Die minimale Einstiegshürde für einen neuen Kanal:

1. Behalten Sie `qa-lab` als Besitzer der gemeinsamen `qa`-Wurzel bei.
2. Implementieren Sie den Transport-Runner auf der gemeinsamen `qa-lab`-Host-Schnittstelle.
3. Halten Sie transportspezifische Mechanik im Runner-Plugin oder Kanal-Harness.
4. Hängen Sie den Runner als `openclaw qa <runner>` ein, statt einen konkurrierenden Root-Befehl zu registrieren. Runner-Plugins sollten `qaRunners` in `openclaw.plugin.json` deklarieren und ein passendes `qaRunnerCliRegistrations`-Array aus `runtime-api.ts` exportieren. Halten Sie `runtime-api.ts` leichtgewichtig; Lazy-CLI und Runner-Ausführung sollten hinter separaten Einstiegspunkten bleiben.
5. Erstellen oder adaptieren Sie Markdown-Szenarien unter den thematischen `qa/scenarios/`-Verzeichnissen.
6. Verwenden Sie die generischen Szenario-Hilfsfunktionen für neue Szenarien.
7. Halten Sie bestehende Kompatibilitätsaliase funktionsfähig, es sei denn, das Repo führt eine beabsichtigte Migration durch.

Die Entscheidungsregel ist strikt:

- Wenn Verhalten einmal in `qa-lab` ausgedrückt werden kann, platzieren Sie es in `qa-lab`.
- Wenn Verhalten von einem Kanaltransport abhängt, halten Sie es in diesem Runner-Plugin oder Plugin-Harness.
- Wenn ein Szenario eine neue Fähigkeit benötigt, die mehr als ein Kanal verwenden kann, fügen Sie eine generische Hilfsfunktion hinzu, statt eines kanalspezifischen Zweigs in `suite.ts`.
- Wenn ein Verhalten nur für einen Transport sinnvoll ist, halten Sie das Szenario transportspezifisch und machen Sie das im Szenariovertrag explizit.

### Namen von Szenario-Hilfsfunktionen

Bevorzugte generische Hilfsfunktionen für neue Szenarien:

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

Kompatibilitätsaliase bleiben für bestehende Szenarien verfügbar - `waitForQaChannelReady`, `waitForOutboundMessage`, `waitForNoOutbound`, `formatConversationTranscript`, `resetBus` -, aber neue Szenarien sollten die generischen Namen verwenden. Die Aliase existieren, um eine Umstellung an einem Stichtag zu vermeiden, nicht als zukünftiges Modell.

## Reporting

`qa-lab` exportiert einen Markdown-Protokollbericht aus der beobachteten Bus-Zeitleiste.
Der Bericht sollte beantworten:

- Was funktioniert hat
- Was fehlgeschlagen ist
- Was blockiert geblieben ist
- Welche Folgeszenarien sich lohnen hinzuzufügen

Für das Inventar verfügbarer Szenarien - nützlich, wenn Sie Folgearbeit dimensionieren oder einen neuen Transport verdrahten - führen Sie `pnpm openclaw qa coverage` aus (fügen Sie `--json` für maschinenlesbare Ausgabe hinzu).

Für Zeichen- und Stilprüfungen führen Sie dasselbe Szenario über mehrere Live-Modell-Refs hinweg aus und schreiben einen beurteilten Markdown-Bericht:

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

Der Befehl führt lokale untergeordnete QA-Gateway-Prozesse aus, nicht Docker. Character-Eval-Szenarien sollten die Persona über `SOUL.md` setzen und dann gewöhnliche Benutzer-Turns wie Chat, Workspace-Hilfe und kleine Datei-Aufgaben ausführen. Dem Kandidatenmodell sollte nicht mitgeteilt werden, dass es evaluiert wird. Der Befehl bewahrt jedes vollständige Transkript auf, zeichnet grundlegende Laufstatistiken auf und bittet dann die Judge-Modelle im Fast Mode mit `xhigh`-Reasoning, wo unterstützt, die Läufe nach Natürlichkeit, Vibe und Humor zu ranken.
Verwenden Sie `--blind-judge-models`, wenn Sie Provider vergleichen: Der Judge-Prompt erhält weiterhin jedes Transkript und jeden Laufstatus, aber Kandidaten-Refs werden durch neutrale Labels wie `candidate-01` ersetzt; der Bericht ordnet Rankings nach dem Parsen wieder realen Refs zu.
Kandidatenläufe verwenden standardmäßig `high` Thinking, mit `medium` für GPT-5.5 und `xhigh` für ältere OpenAI-Eval-Refs, die es unterstützen. Überschreiben Sie einen bestimmten Kandidaten inline mit `--model provider/model,thinking=<level>`. `--thinking <level>` setzt weiterhin einen globalen Fallback, und die ältere Form `--model-thinking <provider/model=level>` bleibt aus Kompatibilitätsgründen erhalten.
OpenAI-Kandidaten-Refs verwenden standardmäßig Fast Mode, sodass Priority Processing dort genutzt wird, wo der Provider es unterstützt. Fügen Sie inline `,fast`, `,no-fast` oder `,fast=false` hinzu, wenn ein einzelner Kandidat oder Judge eine Überschreibung benötigt. Übergeben Sie `--fast` nur, wenn Sie Fast Mode für jedes Kandidatenmodell erzwingen möchten. Kandidaten- und Judge-Dauern werden im Bericht für Benchmark-Analysen aufgezeichnet, aber Judge-Prompts sagen ausdrücklich, nicht nach Geschwindigkeit zu ranken.
Kandidaten- und Judge-Modellläufe verwenden beide standardmäßig Parallelität 16. Senken Sie `--concurrency` oder `--judge-concurrency`, wenn Provider-Limits oder lokaler Gateway-Druck einen Lauf zu verrauscht machen.
Wenn kein Kandidaten-`--model` übergeben wird, verwendet Character Eval standardmäßig `openai/gpt-5.5`, `openai/gpt-5.2`, `openai/gpt-5`, `anthropic/claude-opus-4-6`, `anthropic/claude-sonnet-4-6`, `zai/glm-5.1`, `moonshot/kimi-k2.5` und `google/gemini-3.1-pro-preview`, wenn kein `--model` übergeben wird.
Wenn kein `--judge-model` übergeben wird, verwenden die Judges standardmäßig `openai/gpt-5.5,thinking=xhigh,fast` und `anthropic/claude-opus-4-6,thinking=high`.

## Verwandte Dokumentation

- [Matrix-QA](/de/concepts/qa-matrix)
- [QA-Kanal](/de/channels/qa-channel)
- [Tests](/de/help/testing)
- [Dashboard](/de/web/dashboard)
