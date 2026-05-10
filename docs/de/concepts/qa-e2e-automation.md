---
read_when:
    - Verstehen, wie der QA-Stack ineinandergreift
    - Erweitern von qa-lab, qa-channel oder einem Transportadapter
    - Repository-gestützte QA-Szenarien hinzufügen
    - Aufbau realitätsnäherer QA-Automatisierung für das Gateway-Dashboard
summary: 'QA-Stack-Übersicht: qa-lab, qa-channel, Repository-gestützte Szenarien, Live-Transport-Lanes, Transportadapter und Berichterstattung.'
title: QA-Übersicht
x-i18n:
    generated_at: "2026-05-10T19:33:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: f1f931d3daf9c3794bff7c5452df70c818cce19942eb1de156d27a9928bb3e0a
    source_path: concepts/qa-e2e-automation.md
    workflow: 16
---

Der private QA-Stack soll OpenClaw auf eine realistischere,
kanalorientierte Weise testen, als es ein einzelner Unit-Test kann.

Aktuelle Bestandteile:

- `extensions/qa-channel`: synthetischer Nachrichtenkanal mit DM-, Kanal-, Thread-,
  Reaktions-, Bearbeitungs- und Löschoberflächen.
- `extensions/qa-lab`: Debugger-UI und QA-Bus zum Beobachten des Transkripts,
  Einspeisen eingehender Nachrichten und Exportieren eines Markdown-Berichts.
- `extensions/qa-matrix`, zukünftige Runner-Plugins: Live-Transport-Adapter, die
  einen echten Kanal innerhalb eines untergeordneten QA-Gateway steuern.
- `qa/`: repo-gestützte Seed-Assets für die Startaufgabe und grundlegende QA-
  Szenarien.
- [Mantis](/de/concepts/mantis): Vorher- und Nachher-Live-Verifizierung für Bugs, die
  echte Transporte, Browser-Screenshots, VM-Zustand und PR-Nachweise benötigen.

## Befehlsoberfläche

Jeder QA-Ablauf läuft unter `pnpm openclaw qa <subcommand>`. Viele haben `pnpm qa:*`-
Skriptaliasse; beide Formen werden unterstützt.

| Befehl                                             | Zweck                                                                                                                                                                                                                                                                 |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `qa run`                                            | Gebündelter QA-Selbsttest; schreibt einen Markdown-Bericht.                                                                                                                                                                                                                        |
| `qa suite`                                          | Repo-gestützte Szenarien gegen die QA-Gateway-Lane ausführen. Aliasse: `pnpm openclaw qa suite --runner multipass` für eine wegwerfbare Linux-VM.                                                                                                                                  |
| `qa coverage`                                       | Das Markdown-Inventar zur Szenarioabdeckung ausgeben (`--json` für maschinenlesbare Ausgabe).                                                                                                                                                                                           |
| `qa parity-report`                                  | Zwei `qa-suite-summary.json`-Dateien vergleichen und den agentischen Paritätsbericht schreiben.                                                                                                                                                                                          |
| `qa character-eval`                                 | Das Character-QA-Szenario über mehrere Live-Modelle mit bewertetem Bericht ausführen. Siehe [Berichterstattung](#reporting).                                                                                                                                                            |
| `qa manual`                                         | Einen einmaligen Prompt gegen die ausgewählte Provider-/Modell-Lane ausführen.                                                                                                                                                                                                          |
| `qa ui`                                             | Die QA-Debugger-UI und den lokalen QA-Bus starten (Alias: `pnpm qa:lab:ui`).                                                                                                                                                                                                    |
| `qa docker-build-image`                             | Das vorgebackene QA-Docker-Image bauen.                                                                                                                                                                                                                                     |
| `qa docker-scaffold`                                | Ein docker-compose-Gerüst für das QA-Dashboard und die Gateway-Lane schreiben.                                                                                                                                                                                                    |
| `qa up`                                             | Die QA-Site bauen, den Docker-gestützten Stack starten und die URL ausgeben (Alias: `pnpm qa:lab:up`; die Variante `:fast` ergänzt `--use-prebuilt-image --bind-ui-dist --skip-ui-build`).                                                                                                  |
| `qa aimock`                                         | Nur den AIMock-Provider-Server starten.                                                                                                                                                                                                                                  |
| `qa mock-openai`                                    | Nur den szenariobewussten `mock-openai`-Provider-Server starten.                                                                                                                                                                                                            |
| `qa credentials doctor` / `add` / `list` / `remove` | Den gemeinsamen Convex-Anmeldedatenpool verwalten.                                                                                                                                                                                                                               |
| `qa matrix`                                         | Live-Transport-Lane gegen einen wegwerfbaren Tuwunel-Homeserver. Siehe [Matrix-QA](/de/concepts/qa-matrix).                                                                                                                                                                      |
| `qa telegram`                                       | Live-Transport-Lane gegen eine echte private Telegram-Gruppe.                                                                                                                                                                                                              |
| `qa discord`                                        | Live-Transport-Lane gegen einen echten privaten Discord-Guild-Kanal.                                                                                                                                                                                                       |
| `qa slack`                                          | Live-Transport-Lane gegen einen echten privaten Slack-Kanal.                                                                                                                                                                                                               |
| `qa mantis`                                         | Vorher- und Nachher-Verifizierungs-Runner für Live-Transport-Bugs, mit Discord-Statusreaktionsnachweisen, Crabbox-Desktop-/Browser-Smoke und Slack-in-VNC-Smoke. Siehe [Mantis](/de/concepts/mantis) und [Mantis Slack Desktop Runbook](/de/concepts/mantis-slack-desktop-runbook). |

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
kann, was funktioniert hat, fehlgeschlagen ist oder blockiert geblieben ist.

Für schnellere Iteration an der QA-Lab-UI, ohne jedes Mal das Docker-Image neu zu
bauen, starten Sie den Stack mit einem per Bind-Mount eingebundenen QA-Lab-Bundle:

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` hält die Docker-Services auf einem vorgebauten Image und bind-mountet
`extensions/qa-lab/web/dist` in den `qa-lab`-Container. `qa:lab:watch`
baut dieses Bundle bei Änderungen neu, und der Browser lädt automatisch neu, wenn sich
der QA-Lab-Asset-Hash ändert.

Für einen lokalen OpenTelemetry-Trace-Smoke führen Sie aus:

```bash
pnpm qa:otel:smoke
```

Dieses Skript startet einen lokalen OTLP/HTTP-Trace-Empfänger, führt das
QA-Szenario `otel-trace-smoke` mit aktiviertem `diagnostics-otel`-Plugin aus, decodiert dann
die exportierten Protobuf-Spans und prüft die releasekritische Form:
`openclaw.run`, `openclaw.harness.run`, `openclaw.model.call`,
`openclaw.context.assembled` und `openclaw.message.delivery` müssen vorhanden sein;
Modellaufrufe dürfen bei erfolgreichen Turns kein `StreamAbandoned` exportieren; rohe Diagnose-IDs und
`openclaw.content.*`-Attribute dürfen nicht im Trace enthalten sein. Es schreibt
`otel-smoke-summary.json` neben die QA-Suite-Artefakte.

Observability-QA bleibt ausschließlich für Source-Checkouts. Der npm-Tarball lässt
QA Lab absichtlich aus, daher führen Package-Docker-Release-Lanes keine `qa`-Befehle aus. Verwenden Sie
`pnpm qa:otel:smoke` aus einem gebauten Source-Checkout, wenn Sie die Diagnoseinstrumentierung
ändern.

Für eine transportechte Matrix-Smoke-Lane führen Sie aus:

```bash
pnpm openclaw qa matrix --profile fast --fail-fast
```

Die vollständige CLI-Referenz, der Profil-/Szenariokatalog, Umgebungsvariablen und das Artefaktlayout für diese Lane befinden sich in [Matrix-QA](/de/concepts/qa-matrix). Kurzüberblick: Sie stellt einen wegwerfbaren Tuwunel-Homeserver in Docker bereit, registriert temporäre Driver-/SUT-/Observer-Benutzer, führt das echte Matrix-Plugin innerhalb eines untergeordneten QA-Gateway aus, das auf diesen Transport beschränkt ist (kein `qa-channel`), und schreibt dann einen Markdown-Bericht, eine JSON-Zusammenfassung, ein Artefakt mit beobachteten Ereignissen und ein kombiniertes Ausgabelog unter `.artifacts/qa-e2e/matrix-<timestamp>/`.

Die Szenarien decken Transportverhalten ab, das Unit-Tests nicht Ende-zu-Ende nachweisen können: Mention-Gating, Allow-Bot-Richtlinien, Allowlisten, Top-Level- und Thread-Antworten, DM-Routing, Reaktionsverarbeitung, Unterdrückung eingehender Bearbeitungen, Restart-Replay-Deduplizierung, Wiederherstellung nach Homeserver-Unterbrechungen, Zustellung von Genehmigungsmetadaten, Medienverarbeitung sowie Matrix-E2EE-Bootstrap-/Wiederherstellungs-/Verifizierungsabläufe. Das E2EE-CLI-Profil steuert außerdem `openclaw matrix encryption setup` und Verifizierungsbefehle über denselben wegwerfbaren Homeserver, bevor Gateway-Antworten geprüft werden.

Discord hat außerdem Mantis-only-Opt-in-Szenarien für Bug-Reproduktionen. Verwenden Sie
`--scenario discord-status-reactions-tool-only` für die explizite Statusreaktions-
Zeitleiste oder `--scenario discord-thread-reply-filepath-attachment`, um einen
echten Discord-Thread zu erstellen und zu verifizieren, dass `message.thread-reply` einen
`filePath`-Anhang beibehält. Diese Szenarien bleiben außerhalb der standardmäßigen Live-Discord-Lane,
weil sie Vorher-/Nachher-Repro-Probes und keine breite Smoke-Abdeckung sind.
Der Thread-Anhang-Mantis-Workflow kann auch ein angemeldetes Discord-Web-
Zeugenvideo hinzufügen, wenn `MANTIS_DISCORD_VIEWER_CHROME_PROFILE_DIR` oder
`MANTIS_DISCORD_VIEWER_CHROME_PROFILE_TGZ_B64` in der QA-
Umgebung konfiguriert ist. Dieses Viewer-Profil dient nur der visuellen Aufzeichnung; die Pass/Fail-
Entscheidung kommt weiterhin vom Discord-REST-Orakel.

CI verwendet dieselbe Befehlsoberfläche in `.github/workflows/qa-live-transports-convex.yml`. Geplante und standardmäßige manuelle Läufe führen das schnelle Matrix-Profil mit Live-Frontier-Anmeldedaten, `--fast` und `OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS=3000` aus. Manuelles `matrix_profile=all` fächert in die fünf Profil-Shards auf, damit der vollständige Katalog parallel laufen kann und zugleich ein Artefaktverzeichnis pro Shard erhalten bleibt.

Für transportechte Telegram-, Discord- und Slack-Smoke-Lanes:

```bash
pnpm openclaw qa telegram
pnpm openclaw qa discord
pnpm openclaw qa slack
```

Sie zielen auf einen bereits vorhandenen echten Kanal mit zwei Bots (Driver + SUT). Erforderliche Umgebungsvariablen, Szenariolisten, Ausgabeartefakte und der Convex-Anmeldedatenpool sind unten in der [Telegram-, Discord- und Slack-QA-Referenz](#telegram-discord-and-slack-qa-reference) dokumentiert.

Für einen vollständigen Slack-Desktop-VM-Lauf mit VNC-Rettung führen Sie aus:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

Dieser Befehl least eine Crabbox-Desktop/Browser-Maschine, führt die Slack-Live-Lane
in der VM aus, öffnet Slack Web im VNC-Browser, erfasst den Desktop und
kopiert `slack-qa/`, `slack-desktop-smoke.png` und `slack-desktop-smoke.mp4`,
wenn Videoaufzeichnung verfügbar ist, zurück in das Mantis-Artefaktverzeichnis. Crabbox-
Desktop/Browser-Leases stellen die Capture-Tools und Browser/Native-Build-Hilfspakete
vorab bereit, sodass das Szenario nur auf älteren Leases Fallbacks installieren sollte.
Mantis meldet Gesamt- und phasenbezogene Zeitmessungen in
`mantis-slack-desktop-smoke-report.md`, sodass langsame Läufe zeigen, ob Zeit in
Lease-Aufwärmung, Abruf von Zugangsdaten, Remote-Einrichtung oder Artefaktkopie
geflossen ist. Verwenden Sie `--lease-id <cbx_...>` erneut, nachdem Sie sich manuell
über VNC bei Slack Web angemeldet haben; wiederverwendete Leases halten außerdem
den pnpm-Store-Cache von Crabbox warm. Der Standard
`--hydrate-mode source` verifiziert aus einem Source-Checkout und führt Installation/Build
in der VM aus. Verwenden Sie `--hydrate-mode prehydrated` nur, wenn der wiederverwendete
Remote-Arbeitsbereich bereits `node_modules` und ein gebautes `dist/` enthält; dieser Modus
überspringt den teuren Installations-/Build-Schritt und schlägt geschlossen fehl, wenn der
Arbeitsbereich nicht bereit ist. Mit `--gateway-setup` lässt Mantis einen persistenten
OpenClaw-Slack-Gateway in der VM auf Port `38973` laufen; ohne diese Option führt der
Befehl die normale Bot-zu-Bot-Slack-QA-Lane aus und beendet sich nach der Artefakterfassung.

Die Operator-Checkliste, der GitHub-Workflow-Dispatch-Befehl, der Vertrag für Evidence-Kommentare,
die Hydrate-Mode-Entscheidungstabelle, die Timing-Interpretation und die Schritte zur Fehlerbehandlung
befinden sich im [Mantis-Slack-Desktop-Runbook](/de/concepts/mantis-slack-desktop-runbook).

Für eine Desktop-Aufgabe im Agent-/CV-Stil führen Sie aus:

```bash
pnpm openclaw qa mantis visual-task \
  --browser-url https://example.net \
  --expect-text "Example Domain" \
  --vision-model openai/gpt-5.4
```

`visual-task` least oder verwendet eine Crabbox-Desktop/Browser-Maschine erneut, startet
`crabbox record --while`, steuert den sichtbaren Browser über einen verschachtelten
`visual-driver`, erfasst `visual-task.png`, führt `openclaw infer image describe`
gegen den Screenshot aus, wenn `--vision-mode image-describe` ausgewählt ist, und
schreibt `visual-task.mp4`, `mantis-visual-task-summary.json`,
`mantis-visual-task-driver-result.json` und `mantis-visual-task-report.md`.
Wenn `--expect-text` gesetzt ist, fordert der Vision-Prompt ein strukturiertes JSON-
Urteil an und besteht nur, wenn das Modell positive sichtbare Evidenz meldet; eine
negative Antwort, die lediglich den Zieltext zitiert, lässt die Assertion fehlschlagen.
Verwenden Sie `--vision-mode metadata` für einen No-Model-Smoke, der Desktop-,
Browser-, Screenshot- und Video-Plumbing nachweist, ohne einen Provider für Bildverständnis
aufzurufen. Die Aufzeichnung ist ein erforderliches Artefakt für `visual-task`; wenn Crabbox
kein nicht leeres `visual-task.mp4` aufzeichnet, schlägt die Aufgabe fehl, auch wenn der visuelle
Treiber bestanden hat. Bei einem Fehler behält Mantis den Lease für VNC, sofern die Aufgabe
nicht bereits bestanden hatte und `--keep-lease` nicht gesetzt war.

Bevor Sie gepoolte Live-Zugangsdaten verwenden, führen Sie aus:

```bash
pnpm openclaw qa credentials doctor
```

Der Doctor prüft die Convex-Broker-Umgebung, validiert Endpoint-Einstellungen und verifiziert die Erreichbarkeit von Admin/List, wenn das Maintainer-Secret vorhanden ist. Er meldet für Secrets nur den Status gesetzt/fehlend.

## Live-Transport-Abdeckung

Live-Transport-Lanes teilen sich einen Vertrag, statt jeweils eine eigene Szenariolistenform zu erfinden. `qa-channel` ist die breite synthetische Suite für Produktverhalten und ist nicht Teil der Live-Transport-Abdeckungsmatrix.

| Lane     | Canary | Mention-Gating | Bot-zu-Bot | Allowlist-Block | Antwort auf oberster Ebene | Neustart-Fortsetzung | Thread-Follow-up | Thread-Isolation | Reaktionsbeobachtung | Help-Befehl | Native Befehlsregistrierung |
| -------- | ------ | -------------- | ---------- | --------------- | -------------------------- | -------------------- | ---------------- | ---------------- | --------------------- | ----------- | --------------------------- |
| Matrix   | x      | x              | x          | x               | x                          | x                    | x                | x                | x                     |             |                             |
| Telegram | x      | x              | x          |                 |                            |                      |                  |                  |                       | x           |                             |
| Discord  | x      | x              | x          |                 |                            |                      |                  |                  |                       |             | x                           |
| Slack    | x      | x              | x          | x               | x                          | x                    | x                | x                |                       |             |                             |

Dies belässt `qa-channel` als breite Suite für Produktverhalten, während Matrix,
Telegram und zukünftige Live-Transporte eine gemeinsame explizite Checkliste
für den Transportvertrag verwenden.

Für eine wegwerfbare Linux-VM-Lane, ohne Docker in den QA-Pfad einzubringen, führen Sie aus:

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

Dies startet einen frischen Multipass-Gast, installiert Abhängigkeiten, baut OpenClaw
innerhalb des Gasts, führt `qa suite` aus und kopiert anschließend den normalen QA-Bericht
und die Zusammenfassung zurück nach `.artifacts/qa-e2e/...` auf dem Host.
Es verwendet dieselbe Szenarioauswahllogik wie `qa suite` auf dem Host.
Host- und Multipass-Suite-Läufe führen mehrere ausgewählte Szenarien standardmäßig parallel
mit isolierten Gateway-Workern aus. `qa-channel` verwendet standardmäßig eine Parallelität
von 4, begrenzt durch die Anzahl der ausgewählten Szenarien. Verwenden Sie `--concurrency <count>`,
um die Worker-Anzahl anzupassen, oder `--concurrency 1` für serielle Ausführung.
Der Befehl beendet sich mit einem Nicht-Null-Code, wenn ein Szenario fehlschlägt. Verwenden Sie
`--allow-failures`, wenn Sie Artefakte ohne fehlschlagenden Exit-Code wünschen.
Live-Läufe leiten die unterstützten QA-Auth-Eingaben weiter, die für den Gast praktikabel sind:
umgebungsbasierte Provider-Schlüssel, den QA-Live-Provider-Konfigurationspfad und
`CODEX_HOME`, wenn vorhanden. Belassen Sie `--output-dir` unterhalb des Repo-Roots, damit der Gast
über den gemounteten Arbeitsbereich zurückschreiben kann.

## Telegram-, Discord- und Slack-QA-Referenz

Matrix hat wegen der Anzahl seiner Szenarien und der Docker-gestützten Homeserver-Bereitstellung eine [eigene Seite](/de/concepts/qa-matrix). Telegram, Discord und Slack sind kleiner - jeweils eine Handvoll Szenarien, kein Profilsystem, gegen bestehende echte Channels -, daher befindet sich ihre Referenz hier.

### Gemeinsame CLI-Flags

Diese Lanes registrieren sich über `extensions/qa-lab/src/live-transports/shared/live-transport-cli.ts` und akzeptieren dieselben Flags:

| Flag                                  | Standard                                                        | Beschreibung                                                                                                                 |
| ------------------------------------- | --------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `--scenario <id>`                     | -                                                               | Führt nur dieses Szenario aus. Wiederholbar.                                                                                 |
| `--output-dir <path>`                 | `<repo>/.artifacts/qa-e2e/{telegram,discord,slack}-<timestamp>` | Speicherort für Berichte/Zusammenfassung/beobachtete Nachrichten und das Ausgabeprotokoll. Relative Pfade werden gegen `--repo-root` aufgelöst. |
| `--repo-root <path>`                  | `process.cwd()`                                                 | Repository-Root beim Aufruf aus einem neutralen cwd.                                                                         |
| `--sut-account <id>`                  | `sut`                                                           | Temporäre Konto-ID innerhalb der QA-Gateway-Konfiguration.                                                                   |
| `--provider-mode <mode>`              | `live-frontier`                                                 | `mock-openai` oder `live-frontier` (`live-openai` aus Legacy-Zeiten funktioniert weiterhin).                                 |
| `--model <ref>` / `--alt-model <ref>` | Provider-Standard                                               | Primäre/alternative Modell-Refs.                                                                                             |
| `--fast`                              | aus                                                             | Schneller Provider-Modus, wo unterstützt.                                                                                    |
| `--credential-source <env\|convex>`   | `env`                                                           | Siehe [Convex-Zugangsdatenpool](#convex-credential-pool).                                                                    |
| `--credential-role <maintainer\|ci>`  | `ci` in CI, sonst `maintainer`                                  | Rolle, die bei `--credential-source convex` verwendet wird.                                                                  |

Jede Lane beendet sich bei einem fehlgeschlagenen Szenario mit einem Nicht-Null-Code. `--allow-failures` schreibt Artefakte, ohne einen fehlschlagenden Exit-Code zu setzen.

### Telegram-QA

```bash
pnpm openclaw qa telegram
```

Zielt auf eine echte private Telegram-Gruppe mit zwei unterschiedlichen Bots (Treiber + SUT). Der SUT-Bot muss einen Telegram-Benutzernamen haben; Bot-zu-Bot-Beobachtung funktioniert am besten, wenn beide Bots in `@BotFather` den **Bot-to-Bot Communication Mode** aktiviert haben.

Erforderliche Env bei `--credential-source env`:

- `OPENCLAW_QA_TELEGRAM_GROUP_ID` - numerische Chat-ID (String).
- `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`

Optional:

- `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1` behält Nachrichtenkörper in Artefakten für beobachtete Nachrichten bei (standardmäßig redigiert).

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

Die implizite Standardmenge deckt immer Canary, Mention-Gating, Antworten auf native Befehle, Befehlsadressierung und Bot-zu-Bot-Gruppenantworten ab. `mock-openai`-Standards enthalten außerdem deterministische Prüfungen für Reply-Chain und Final-Message-Streaming. `telegram-current-session-status-tool` bleibt opt-in, weil es nur stabil ist, wenn es direkt nach Canary in einem Thread ausgeführt wird, nicht nach beliebigen nativen Befehlsantworten. Verwenden Sie `pnpm openclaw qa telegram --list-scenarios --provider-mode mock-openai`, um die aktuelle Standard-/Optional-Aufteilung mit Regressions-Refs auszugeben.

Ausgabeartefakte:

- `telegram-qa-report.md`
- `telegram-qa-summary.json` - enthält pro Antwort die RTT (Treibersenden → beobachtete SUT-Antwort), beginnend mit Canary.
- `telegram-qa-observed-messages.json` - Körper redigiert, sofern `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1` nicht gesetzt ist.

### Discord-QA

```bash
pnpm openclaw qa discord
```

Zielt auf einen echten privaten Discord-Guild-Channel mit zwei Bots: einen vom Harness gesteuerten Treiber-Bot und einen SUT-Bot, der vom untergeordneten OpenClaw-Gateway über das gebündelte Discord-Plugin gestartet wird. Verifiziert Channel-Mention-Handling, dass der SUT-Bot den nativen `/help`-Befehl bei Discord registriert hat, sowie opt-in Mantis-Evidenzszenarien.

Erforderliche Env bei `--credential-source env`:

- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID` - muss der vom Discord zurückgegebenen Bot-Benutzer-ID des SUT entsprechen (andernfalls schlägt die Lane sofort fehl).

Optional:

- `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1` behält Nachrichteninhalte in Artefakten beobachteter Nachrichten bei.
- `OPENCLAW_QA_DISCORD_VOICE_CHANNEL_ID` wählt den Sprach-/Stage-Kanal für `discord-voice-autojoin` aus; ohne diese Variable wählt das Szenario den ersten sichtbaren Sprach-/Stage-Kanal für den SUT-Bot aus.

Szenarien (`extensions/qa-lab/src/live-transports/discord/discord-live.runtime.ts:36`):

- `discord-canary`
- `discord-mention-gating`
- `discord-native-help-command-registration`
- `discord-voice-autojoin` - Opt-in-Sprachszenario. Läuft eigenständig, aktiviert `channels.discord.voice.autoJoin` und verifiziert, dass der aktuelle Discord-Sprachstatus des SUT-Bots der Ziel-Sprach-/Stage-Kanal ist. Convex-Discord-Anmeldedaten können optional `voiceChannelId` enthalten; andernfalls ermittelt der Runner den ersten sichtbaren Sprach-/Stage-Kanal in der Guild.
- `discord-status-reactions-tool-only` - Opt-in-Mantis-Szenario. Läuft eigenständig, weil es den SUT auf Always-on-Guild-Antworten nur per Tool mit `messages.statusReactions.enabled=true` umstellt und anschließend eine REST-Reaktions-Zeitleiste sowie visuelle HTML/PNG-Artefakte erfasst. Mantis-Vorher/Nachher-Berichte bewahren außerdem vom Szenario bereitgestellte MP4-Artefakte als `baseline.mp4` und `candidate.mp4` auf.

Führen Sie das Discord-Szenario für automatischen Sprachbeitritt explizit aus:

```bash
pnpm openclaw qa discord \
  --scenario discord-voice-autojoin \
  --provider-mode mock-openai
```

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
- `discord-qa-observed-messages.json` - Inhalte geschwärzt, außer `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1` ist gesetzt.
- `discord-qa-reaction-timelines.json` und `discord-status-reactions-tool-only-timeline.png`, wenn das Statusreaktionsszenario ausgeführt wird.

### Slack-QA

```bash
pnpm openclaw qa slack
```

Zielt auf einen echten privaten Slack-Kanal mit zwei unterschiedlichen Bots ab: einen vom Harness gesteuerten Driver-Bot und einen SUT-Bot, der vom untergeordneten OpenClaw-Gateway über das gebündelte Slack-Plugin gestartet wird.

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
- `slack-qa-observed-messages.json` - Inhalte geschwärzt, außer `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1` ist gesetzt.

#### Slack-Workspace einrichten

Die Lane benötigt zwei unterschiedliche Slack-Apps in einem Workspace sowie einen Kanal, in dem beide Bots Mitglieder sind:

- `channelId` - die `Cxxxxxxxxxx`-ID eines Kanals, in den beide Bots eingeladen wurden. Verwenden Sie einen dedizierten Kanal; die Lane postet bei jedem Lauf.
- `driverBotToken` - Bot-Token (`xoxb-...`) der **Driver**-App.
- `sutBotToken` - Bot-Token (`xoxb-...`) der **SUT**-App, die eine von der Driver-App getrennte Slack-App sein muss, damit ihre Bot-Benutzer-ID unterschiedlich ist.
- `sutAppToken` - App-Level-Token (`xapp-...`) der SUT-App mit `connections:write`, das von Socket Mode verwendet wird, damit die SUT-App Ereignisse empfangen kann.

Bevorzugen Sie einen für QA dedizierten Slack-Workspace, statt einen Produktions-Workspace wiederzuverwenden.

Das unten stehende SUT-Manifest beschränkt die Produktionsinstallation des gebündelten Slack-Plugins (`extensions/slack/src/setup-shared.ts:10`) absichtlich auf die Berechtigungen und Ereignisse, die von der Live-Slack-QA-Suite abgedeckt werden. Die Einrichtung des Produktionskanals aus Benutzersicht finden Sie unter [Slack-Kanal-Schnelleinrichtung](/de/channels/slack#quick-setup); das QA-Driver/SUT-Paar ist absichtlich getrennt, weil die Lane zwei unterschiedliche Bot-Benutzer-IDs in einem Workspace benötigt.

**1. Driver-App erstellen**

Gehen Sie zu [api.slack.com/apps](https://api.slack.com/apps) → _Create New App_ → _From a manifest_ → wählen Sie den QA-Workspace aus, fügen Sie das folgende Manifest ein und wählen Sie dann _Install to Workspace_:

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

Kopieren Sie den _Bot User OAuth Token_ (`xoxb-...`) - daraus wird `driverBotToken`. Der Driver muss nur Nachrichten posten und sich selbst identifizieren; keine Ereignisse, kein Socket Mode.

**2. SUT-App erstellen**

Wiederholen Sie _Create New App → From a manifest_ im selben Workspace. Diese QA-App verwendet absichtlich eine schmalere Version des Produktionsmanifests des gebündelten Slack-Plugins (`extensions/slack/src/setup-shared.ts:10`): Reaktions-Scopes und -Ereignisse werden ausgelassen, weil die Live-Slack-QA-Suite die Reaktionsverarbeitung noch nicht abdeckt.

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

- _Install to Workspace_ → kopieren Sie den _Bot User OAuth Token_ → daraus wird `sutBotToken`.
- _Basic Information → App-Level Tokens → Generate Token and Scopes_ → fügen Sie den Scope `connections:write` hinzu → speichern → kopieren Sie den Wert `xapp-...` → daraus wird `sutAppToken`.

Verifizieren Sie, dass die zwei Bots unterschiedliche Benutzer-IDs haben, indem Sie `auth.test` mit jedem Token aufrufen. Die Laufzeit unterscheidet Driver und SUT anhand der Benutzer-ID; die Wiederverwendung einer App für beide lässt Mention-Gating sofort fehlschlagen.

**3. Kanal erstellen**

Erstellen Sie im QA-Workspace einen Kanal (z. B. `#openclaw-qa`) und laden Sie beide Bots aus dem Kanal heraus ein:

```
/invite @OpenClaw QA Driver
/invite @OpenClaw QA SUT
```

Kopieren Sie die `Cxxxxxxxxxx`-ID aus _channel info → About → Channel ID_ - daraus wird `channelId`. Ein öffentlicher Kanal funktioniert; wenn Sie einen privaten Kanal verwenden, haben beide Apps bereits `groups:history`, sodass die History-Lesevorgänge des Harness weiterhin erfolgreich sind.

**4. Anmeldedaten registrieren**

Es gibt zwei Optionen. Verwenden Sie Umgebungsvariablen für das Debugging auf einer einzelnen Maschine (setzen Sie die vier Variablen `OPENCLAW_QA_SLACK_*` und übergeben Sie `--credential-source env`), oder befüllen Sie den gemeinsamen Convex-Pool, damit CI und andere Maintainer sie leasen können.

Schreiben Sie für den Convex-Pool die vier Felder in eine JSON-Datei:

```json
{
  "channelId": "Cxxxxxxxxxx",
  "driverBotToken": "xoxb-...",
  "sutBotToken": "xoxb-...",
  "sutAppToken": "xapp-..."
}
```

Exportieren Sie `OPENCLAW_QA_CONVEX_SITE_URL` und `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` in Ihrer Shell, registrieren und verifizieren Sie dann:

```bash
pnpm openclaw qa credentials add \
  --kind slack \
  --payload-file slack-creds.json \
  --note "QA Slack pool seed"

pnpm openclaw qa credentials list --kind slack --status all --json
```

Erwarten Sie `count: 1`, `status: "active"` und kein Feld `lease`.

**5. End-to-End verifizieren**

Führen Sie die Lane lokal aus, um zu bestätigen, dass beide Bots über den Broker miteinander kommunizieren können:

```bash
pnpm openclaw qa slack \
  --credential-source convex \
  --credential-role maintainer \
  --output-dir .artifacts/qa-e2e/slack-local
```

Ein erfolgreicher Lauf wird in deutlich unter 30 Sekunden abgeschlossen, und `slack-qa-report.md` zeigt sowohl `slack-canary` als auch `slack-mention-gating` mit Status `pass`. Wenn die Lane etwa 90 Sekunden hängt und mit `Convex credential pool exhausted for kind "slack"` beendet wird, ist entweder der Pool leer oder jede Zeile ist geleast - `qa credentials list --kind slack --status all --json` zeigt Ihnen, was zutrifft.

### Convex-Anmeldedatenpool

Telegram-, Discord-, Slack- und WhatsApp-Lanes können Anmeldedaten aus einem gemeinsamen Convex-Pool leasen, statt die oben genannten Umgebungsvariablen zu lesen. Übergeben Sie `--credential-source convex` (oder setzen Sie `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`); QA Lab erwirbt eine exklusive Lease, sendet dafür während des Laufs Heartbeats und gibt sie beim Herunterfahren frei. Pool-Arten sind `"telegram"`, `"discord"`, `"slack"` und `"whatsapp"`.

Payload-Formen, die der Broker bei `admin/add` validiert:

- Telegram (`kind: "telegram"`): `{ groupId: string, driverToken: string, sutToken: string }` - `groupId` muss eine numerische Chat-ID-Zeichenfolge sein.
- Echter Telegram-Benutzer (`kind: "telegram-user"`): `{ groupId: string, sutToken: string, testerUserId: string, testerUsername: string, telegramApiId: string, telegramApiHash: string, tdlibDatabaseEncryptionKey: string, tdlibArchiveBase64: string, tdlibArchiveSha256: string, desktopTdataArchiveBase64: string, desktopTdataArchiveSha256: string }` - eine exklusive Burner-Account-Lease, die sowohl vom TDLib-CLI-Driver als auch vom visuellen Telegram-Desktop-Zeugen verwendet wird.
- Discord (`kind: "discord"`): `{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string }`.
- WhatsApp (`kind: "whatsapp"`): `{ driverPhoneE164: string, sutPhoneE164: string, driverAuthArchiveBase64: string, sutAuthArchiveBase64: string, groupJid?: string }` - Telefonnummern müssen unterschiedliche E.164-Zeichenfolgen sein.

Für visuellen Telegram-Nachweis mit echtem Benutzer bevorzugen Sie eine gehaltene Crabbox-Sitzung:

```bash
pnpm qa:telegram-user:crabbox -- start --tdlib-url http://artifacts.openclaw.ai/tdlib-v1.8.0-linux-x64.tgz --output-dir .artifacts/qa-e2e/telegram-user-crabbox/pr-review
pnpm qa:telegram-user:crabbox -- send --session .artifacts/qa-e2e/telegram-user-crabbox/pr-review/session.json --text /status
pnpm qa:telegram-user:crabbox -- finish --session .artifacts/qa-e2e/telegram-user-crabbox/pr-review/session.json
```

`start` hält eine exklusive Convex-`telegram-user`-Lease sowohl für den TDLib-CLI-Driver
als auch für den Telegram-Desktop-Zeugen, startet die Desktop-Aufzeichnung und lässt die
Crabbox für beliebige agentengesteuerte Repro-Schritte aktiv. Agents können `send`,
`run`, `screenshot` und `status` verwenden, bis sie zufrieden sind, danach sammelt `finish`
den Screenshot, das Video, das bewegungsbeschnittene Video/GIF, TDLib-Probe-Ausgaben
und Logs, bevor die Anmeldedaten freigegeben werden. `publish --session <file> --pr
<number>` kommentiert standardmäßig nur das Bewegungs-GIF; `--full-artifacts` ist das
explizite Opt-in für Logs und JSON-Ausgabe. Der Standardbefehl `probe` bleibt eine
Ein-Befehl-Kurzform für schnelle `/status`-Smoke-Checks.

Verwenden Sie `--mock-response-file <path>`, wenn ein PR einen deterministischen visuellen Diff benötigt:
Dieselbe Mock-Modellantwort kann auf `main` und auf dem PR-Head ausgeführt werden, während sich der
Telegram-Formatter oder die Zustellschicht ändert. Die Capture-Standardwerte sind auf PR-
Kommentare abgestimmt: Standard-Crabbox-Klasse, Desktop-Aufzeichnung mit 24 fps, Bewegungs-GIF mit 24 fps und
1920 px Vorschau-Breite. Vorher-/Nachher-Kommentare sollten ein sauberes Bundle veröffentlichen, das
nur die vorgesehenen GIFs enthält.

Slack-Lanes können ebenfalls den Pool verwenden. Slack-Payload-Formprüfungen liegen derzeit im Slack-QA-Runner statt im Broker; verwenden Sie `{ channelId: string, driverBotToken: string, sutBotToken: string, sutAppToken: string }`, mit einer Slack-Kanal-ID wie `Cxxxxxxxxxx`. Siehe [Slack-Workspace einrichten](#setting-up-the-slack-workspace) für App- und Scope-Bereitstellung.

Operative Env Vars und der Convex-Broker-Endpunktvertrag befinden sich in [Testing → Gemeinsam genutzte Telegram-Zugangsdaten über Convex](/de/help/testing#shared-telegram-credentials-via-convex-v1) (der Abschnittsname stammt aus der Zeit vor dem Multi-Channel-Pool; die Lease-Semantik wird über alle Arten hinweg geteilt).

## Repo-gestützte Seeds

Seed-Assets befinden sich in `qa/`:

- `qa/scenarios/index.md`
- `qa/scenarios/<theme>/*.md`

Diese liegen absichtlich in Git, damit der QA-Plan sowohl für Menschen als auch für den
Agent sichtbar ist.

`qa-lab` sollte ein generischer Markdown-Runner bleiben. Jede Szenario-Markdown-Datei ist
die Source of Truth für einen Testlauf und sollte Folgendes definieren:

- Szenario-Metadaten
- optionale Kategorie-, Capability-, Lane- und Risiko-Metadaten
- Dokumentations- und Code-Referenzen
- optionale Plugin-Anforderungen
- optionaler Gateway-Konfigurations-Patch
- der ausführbare `qa-flow`

Die wiederverwendbare Laufzeitoberfläche, die `qa-flow` unterstützt, darf generisch
und querschnittlich bleiben. Markdown-Szenarien können zum Beispiel transportseitige
Helper mit browserseitigen Helpern kombinieren, die die eingebettete Control UI über den
Gateway-`browser.request`-Seam steuern, ohne einen Sonderfall-Runner hinzuzufügen.

Szenariodateien sollten nach Produkt-Capability statt nach Source-Tree-Ordner gruppiert werden.
Halten Sie Szenario-IDs stabil, wenn Dateien verschoben werden; verwenden Sie `docsRefs` und `codeRefs`
für Implementierungs-Nachverfolgbarkeit.

Die Baseline-Liste sollte breit genug bleiben, um Folgendes abzudecken:

- DM- und Kanal-Chat
- Thread-Verhalten
- Lebenszyklus von Nachrichtenaktionen
- Cron-Callbacks
- Memory-Recall
- Modellwechsel
- Subagent-Handoff
- Repo-Lesen und Dokumentations-Lesen
- eine kleine Build-Aufgabe wie Lobster Invaders

## Provider-Mock-Lanes

`qa suite` hat zwei lokale Provider-Mock-Lanes:

- `mock-openai` ist der szenariobewusste OpenClaw-Mock. Er bleibt die standardmäßige
  deterministische Mock-Lane für repo-gestützte QA und Paritäts-Gates.
- `aimock` startet einen AIMock-gestützten Provider-Server für experimentelle Protokoll-,
  Fixture-, Record/Replay- und Chaos-Abdeckung. Er ist additiv und ersetzt den
  `mock-openai`-Szenario-Dispatcher nicht.

Die Provider-Lane-Implementierung befindet sich unter `extensions/qa-lab/src/providers/`.
Jeder Provider besitzt seine Standardwerte, den Start des lokalen Servers, die Gateway-Modellkonfiguration,
Staging-Anforderungen für Auth-Profile und Live-/Mock-Capability-Flags. Gemeinsamer Suite- und
Gateway-Code sollte über die Provider-Registry routen, statt nach Provider-Namen zu verzweigen.

## Transportadapter

`qa-lab` besitzt einen generischen Transport-Seam für Markdown-QA-Szenarien. `qa-channel` ist der erste Adapter an diesem Seam, aber das Designziel ist breiter: Zukünftige reale oder synthetische Kanäle sollten sich in denselben Suite-Runner einklinken, statt einen transportspezifischen QA-Runner hinzuzufügen.

Auf Architekturebene sieht die Aufteilung so aus:

- `qa-lab` besitzt generische Szenarioausführung, Worker-Parallelität, Artefakt-Schreiben und Reporting.
- Der Transportadapter besitzt Gateway-Konfiguration, Bereitschaft, eingehende und ausgehende Beobachtung, Transportaktionen und normalisierten Transportzustand.
- Markdown-Szenariodateien unter `qa/scenarios/` definieren den Testlauf; `qa-lab` stellt die wiederverwendbare Laufzeitoberfläche bereit, die sie ausführt.

### Einen Kanal hinzufügen

Das Hinzufügen eines Kanals zum Markdown-QA-System erfordert genau zwei Dinge:

1. Einen Transportadapter für den Kanal.
2. Ein Szenariopaket, das den Kanalvertrag ausübt.

Fügen Sie keinen neuen Top-Level-QA-Command-Root hinzu, wenn der gemeinsame `qa-lab`-Host den Flow besitzen kann.

`qa-lab` besitzt die gemeinsamen Host-Mechaniken:

- den `openclaw qa`-Command-Root
- Suite-Start und -Teardown
- Worker-Parallelität
- Artefakt-Schreiben
- Berichtserzeugung
- Szenarioausführung
- Kompatibilitätsaliase für ältere `qa-channel`-Szenarien

Runner-Plugins besitzen den Transportvertrag:

- wie `openclaw qa <runner>` unterhalb des gemeinsamen `qa`-Root gemountet wird
- wie das Gateway für diesen Transport konfiguriert wird
- wie Bereitschaft geprüft wird
- wie eingehende Ereignisse injiziert werden
- wie ausgehende Nachrichten beobachtet werden
- wie Transkripte und normalisierter Transportzustand bereitgestellt werden
- wie transportgestützte Aktionen ausgeführt werden
- wie transportspezifisches Zurücksetzen oder Bereinigen behandelt wird

Die Mindestanforderungen für die Einführung eines neuen Kanals:

1. Behalten Sie `qa-lab` als Eigentümer des gemeinsamen `qa`-Root bei.
2. Implementieren Sie den Transport-Runner am gemeinsamen `qa-lab`-Host-Seam.
3. Halten Sie transportspezifische Mechaniken innerhalb des Runner-Plugins oder Kanal-Harness.
4. Mounten Sie den Runner als `openclaw qa <runner>`, statt einen konkurrierenden Root-Command zu registrieren. Runner-Plugins sollten `qaRunners` in `openclaw.plugin.json` deklarieren und ein passendes `qaRunnerCliRegistrations`-Array aus `runtime-api.ts` exportieren. Halten Sie `runtime-api.ts` schlank; lazy CLI- und Runner-Ausführung sollten hinter separaten Entry Points bleiben.
5. Erstellen oder adaptieren Sie Markdown-Szenarien unter den thematischen `qa/scenarios/`-Verzeichnissen.
6. Verwenden Sie die generischen Szenario-Helper für neue Szenarien.
7. Halten Sie bestehende Kompatibilitätsaliase funktionsfähig, sofern das Repo keine absichtliche Migration durchführt.

Die Entscheidungsregel ist strikt:

- Wenn Verhalten einmal in `qa-lab` ausgedrückt werden kann, legen Sie es in `qa-lab` ab.
- Wenn Verhalten von einem Kanaltransport abhängt, behalten Sie es in diesem Runner-Plugin oder Plugin-Harness.
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

Kompatibilitätsaliase bleiben für bestehende Szenarien verfügbar - `waitForQaChannelReady`, `waitForOutboundMessage`, `waitForNoOutbound`, `formatConversationTranscript`, `resetBus` -, aber neue Szenarioerstellung sollte die generischen Namen verwenden. Die Aliase existieren, um eine Flag-Day-Migration zu vermeiden, nicht als künftiges Modell.

## Reporting

`qa-lab` exportiert einen Markdown-Protokollbericht aus der beobachteten Bus-Timeline.
Der Bericht sollte beantworten:

- Was funktioniert hat
- Was fehlgeschlagen ist
- Was blockiert geblieben ist
- Welche Folgeszenarien sich lohnen

Für das Inventar verfügbarer Szenarien - nützlich beim Abschätzen von Folgearbeit oder beim Verdrahten eines neuen Transports - führen Sie `pnpm openclaw qa coverage` aus (fügen Sie `--json` für maschinenlesbare Ausgabe hinzu).

Für Zeichen- und Stilprüfungen führen Sie dasselbe Szenario über mehrere Live-Modell-
Refs aus und schreiben einen bewerteten Markdown-Bericht:

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

Der Befehl führt lokale QA-Gateway-Kindprozesse aus, nicht Docker. Character-Eval-
Szenarien sollten die Persona über `SOUL.md` festlegen und dann normale Benutzer-Turns
wie Chat, Workspace-Hilfe und kleine Datei-Aufgaben ausführen. Dem Kandidatenmodell sollte
nicht mitgeteilt werden, dass es evaluiert wird. Der Befehl bewahrt jedes vollständige
Transkript auf, zeichnet grundlegende Laufstatistiken auf und bittet dann die Judge-Modelle im Fast Mode mit
`xhigh`-Reasoning, wo unterstützt, die Läufe nach Natürlichkeit, Vibe und Humor zu ranken.
Verwenden Sie `--blind-judge-models`, wenn Sie Provider vergleichen: Der Judge-Prompt erhält weiterhin
jedes Transkript und jeden Laufstatus, aber Kandidaten-Refs werden durch neutrale
Labels wie `candidate-01` ersetzt; der Bericht ordnet Rankings nach dem Parsing wieder echten Refs zu.
Kandidatenläufe verwenden standardmäßig `high` Thinking, mit `medium` für GPT-5.5 und `xhigh`
für ältere OpenAI-Eval-Refs, die es unterstützen. Überschreiben Sie einen bestimmten Kandidaten inline mit
`--model provider/model,thinking=<level>`. `--thinking <level>` setzt weiterhin einen
globalen Fallback, und die ältere Form `--model-thinking <provider/model=level>` wird
aus Kompatibilitätsgründen beibehalten.
OpenAI-Kandidaten-Refs verwenden standardmäßig Fast Mode, damit Priority Processing dort genutzt wird,
wo der Provider es unterstützt. Fügen Sie inline `,fast`, `,no-fast` oder `,fast=false` hinzu, wenn ein
einzelner Kandidat oder Judge eine Überschreibung benötigt. Übergeben Sie `--fast` nur, wenn Sie
Fast Mode für jedes Kandidatenmodell erzwingen möchten. Kandidaten- und Judge-Dauern werden
für Benchmark-Analysen im Bericht aufgezeichnet, aber Judge-Prompts sagen ausdrücklich,
nicht nach Geschwindigkeit zu ranken.
Kandidaten- und Judge-Modellläufe verwenden beide standardmäßig Parallelität 16. Senken Sie
`--concurrency` oder `--judge-concurrency`, wenn Provider-Limits oder lokaler Gateway-
Druck einen Lauf zu verrauscht machen.
Wenn kein Kandidaten-`--model` übergeben wird, verwendet Character Eval standardmäßig
`openai/gpt-5.5`, `openai/gpt-5.2`, `openai/gpt-5`, `anthropic/claude-opus-4-6`,
`anthropic/claude-sonnet-4-6`, `zai/glm-5.1`,
`moonshot/kimi-k2.5` und
`google/gemini-3.1-pro-preview`, wenn kein `--model` übergeben wird.
Wenn kein `--judge-model` übergeben wird, verwenden die Judges standardmäßig
`openai/gpt-5.5,thinking=xhigh,fast` und
`anthropic/claude-opus-4-6,thinking=high`.

## Zugehörige Dokumentation

- [Matrix-QA](/de/concepts/qa-matrix)
- [QA Channel](/de/channels/qa-channel)
- [Testing](/de/help/testing)
- [Dashboard](/de/web/dashboard)
