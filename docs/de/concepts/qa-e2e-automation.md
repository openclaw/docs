---
read_when:
    - Verstehen, wie der QA-Stack zusammenhängt
    - Erweitern von qa-lab, qa-channel oder einem Transportadapter
    - Repo-gestützte QA-Szenarien hinzufügen
    - Aufbau realitätsnäherer QA-Automatisierung rund um das Gateway-Dashboard
summary: 'QA-Stack-Überblick: qa-lab, qa-channel, Repository-gestützte Szenarien, Live-Transport-Lanes, Transportadapter und Berichterstattung.'
title: QA-Übersicht
x-i18n:
    generated_at: "2026-05-05T06:17:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: d313abf9e0f13a159ce28c023e2a1c4c1518529da1354a130e9f495e65faac19
    source_path: concepts/qa-e2e-automation.md
    workflow: 16
---

Der private QA-Stack soll OpenClaw auf eine realistischere,
kanalähnliche Weise testen, als es ein einzelner Unit-Test kann.

Aktuelle Bestandteile:

- `extensions/qa-channel`: synthetischer Nachrichtenkanal mit DM-, Kanal-, Thread-,
  Reaktions-, Bearbeitungs- und Löschoberflächen.
- `extensions/qa-lab`: Debugger-UI und QA-Bus zum Beobachten des Transkripts,
  Einspeisen eingehender Nachrichten und Exportieren eines Markdown-Berichts.
- `extensions/qa-matrix`, künftige Runner-Plugins: Live-Transport-Adapter, die
  einen echten Kanal innerhalb eines untergeordneten QA-Gateways steuern.
- `qa/`: repo-gestützte Seed-Assets für die Kickoff-Aufgabe und grundlegende QA-
  Szenarien.
- [Mantis](/de/concepts/mantis): Vorher-/Nachher-Live-Verifizierung für Fehler, die
  echte Transporte, Browser-Screenshots, VM-Zustand und PR-Nachweise erfordern.

## Befehlsoberfläche

Jeder QA-Flow läuft unter `pnpm openclaw qa <subcommand>`. Viele haben `pnpm qa:*`-
Skript-Aliase; beide Formen werden unterstützt.

| Befehl                                              | Zweck                                                                                                                                                                                        |
| --------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `qa run`                                            | Gebündelter QA-Selbsttest; schreibt einen Markdown-Bericht.                                                                                                                                  |
| `qa suite`                                          | Führt repo-gestützte Szenarien gegen die QA-Gateway-Lane aus. Aliase: `pnpm openclaw qa suite --runner multipass` für eine wegwerfbare Linux-VM.                                             |
| `qa coverage`                                       | Gibt das Markdown-Inventar zur Szenarioabdeckung aus (`--json` für maschinenlesbare Ausgabe).                                                                                                |
| `qa parity-report`                                  | Vergleicht zwei `qa-suite-summary.json`-Dateien und schreibt den agentischen Paritätsbericht.                                                                                                 |
| `qa character-eval`                                 | Führt das Charakter-QA-Szenario über mehrere Live-Modelle hinweg mit einem bewerteten Bericht aus. Siehe [Berichterstattung](#reporting).                                                    |
| `qa manual`                                         | Führt einen einmaligen Prompt gegen die ausgewählte Provider-/Modell-Lane aus.                                                                                                                |
| `qa ui`                                             | Startet die QA-Debugger-UI und den lokalen QA-Bus (Alias: `pnpm qa:lab:ui`).                                                                                                                  |
| `qa docker-build-image`                             | Erstellt das vorgebackene QA-Docker-Image.                                                                                                                                                   |
| `qa docker-scaffold`                                | Schreibt ein docker-compose-Gerüst für das QA-Dashboard und die Gateway-Lane.                                                                                                                 |
| `qa up`                                             | Baut die QA-Site, startet den Docker-gestützten Stack und gibt die URL aus (Alias: `pnpm qa:lab:up`; die Variante `:fast` ergänzt `--use-prebuilt-image --bind-ui-dist --skip-ui-build`).     |
| `qa aimock`                                         | Startet nur den AIMock-Provider-Server.                                                                                                                                                      |
| `qa mock-openai`                                    | Startet nur den szenariobewussten `mock-openai`-Provider-Server.                                                                                                                             |
| `qa credentials doctor` / `add` / `list` / `remove` | Verwaltet den gemeinsam genutzten Convex-Anmeldeinformationspool.                                                                                                                            |
| `qa matrix`                                         | Live-Transport-Lane gegen einen wegwerfbaren Tuwunel-Homeserver. Siehe [Matrix-QA](/de/concepts/qa-matrix).                                                                                     |
| `qa telegram`                                       | Live-Transport-Lane gegen eine echte private Telegram-Gruppe.                                                                                                                                |
| `qa discord`                                        | Live-Transport-Lane gegen einen echten privaten Discord-Guild-Kanal.                                                                                                                         |
| `qa slack`                                          | Live-Transport-Lane gegen einen echten privaten Slack-Kanal.                                                                                                                                 |
| `qa mantis`                                         | Vorher-/Nachher-Verifizierungs-Runner für Live-Transport-Fehler, mit Discord-Statusreaktionsnachweisen, Crabbox-Desktop-/Browser-Smoke und Slack-in-VNC-Smoke. Siehe [Mantis](/de/concepts/mantis). |

## Operator-Flow

Der aktuelle QA-Operator-Flow ist eine QA-Site mit zwei Bereichen:

- Links: Gateway-Dashboard (Control UI) mit dem Agenten.
- Rechts: QA Lab mit Slack-ähnlichem Transkript und Szenarioplan.

Führen Sie ihn aus mit:

```bash
pnpm qa:lab:up
```

Das baut die QA-Site, startet die Docker-gestützte Gateway-Lane und stellt die
QA-Lab-Seite bereit, auf der ein Operator oder eine Automatisierungsschleife dem
Agenten eine QA-Mission geben, echtes Kanalverhalten beobachten und aufzeichnen
kann, was funktioniert hat, fehlgeschlagen ist oder blockiert blieb.

Für schnellere Iteration an der QA-Lab-UI, ohne das Docker-Image jedes Mal neu
zu bauen, starten Sie den Stack mit einem bind-gemounteten QA-Lab-Bundle:

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` hält die Docker-Dienste auf einem vorgebauten Image und bind-mountet
`extensions/qa-lab/web/dist` in den `qa-lab`-Container. `qa:lab:watch`
baut dieses Bundle bei Änderungen neu, und der Browser lädt automatisch neu,
wenn sich der QA-Lab-Asset-Hash ändert.

Für einen lokalen OpenTelemetry-Trace-Smoke führen Sie aus:

```bash
pnpm qa:otel:smoke
```

Dieses Skript startet einen lokalen OTLP/HTTP-Trace-Receiver, führt das
QA-Szenario `otel-trace-smoke` mit aktiviertem `diagnostics-otel`-Plugin aus,
dekodiert anschließend die exportierten Protobuf-Spans und prüft die
release-kritische Struktur: `openclaw.run`, `openclaw.harness.run`,
`openclaw.model.call`, `openclaw.context.assembled` und
`openclaw.message.delivery` müssen vorhanden sein; Modellaufrufe dürfen bei
erfolgreichen Durchläufen kein `StreamAbandoned` exportieren; rohe Diagnose-IDs und
`openclaw.content.*`-Attribute müssen aus dem Trace herausbleiben. Es schreibt
`otel-smoke-summary.json` neben die QA-Suite-Artefakte.

Observability-QA bleibt auf Source-Checkouts beschränkt. Der npm-Tarball lässt
QA Lab absichtlich aus, daher führen Package-Docker-Release-Lanes keine `qa`-
Befehle aus. Verwenden Sie `pnpm qa:otel:smoke` aus einem gebauten Source-Checkout,
wenn Sie Diagnose-Instrumentierung ändern.

Für eine transportechte Matrix-Smoke-Lane führen Sie aus:

```bash
pnpm openclaw qa matrix --profile fast --fail-fast
```

Die vollständige CLI-Referenz, der Profil-/Szenariokatalog, die Umgebungsvariablen und das Artefaktlayout für diese Lane stehen in [Matrix-QA](/de/concepts/qa-matrix). Kurz gesagt: Sie stellt einen wegwerfbaren Tuwunel-Homeserver in Docker bereit, registriert temporäre Driver-/SUT-/Observer-Benutzer, führt das echte Matrix-Plugin innerhalb eines untergeordneten QA-Gateways aus, das auf diesen Transport beschränkt ist (kein `qa-channel`), und schreibt dann einen Markdown-Bericht, eine JSON-Zusammenfassung, ein Artefakt mit beobachteten Ereignissen und ein kombiniertes Ausgabelog unter `.artifacts/qa-e2e/matrix-<timestamp>/`.

Für transportechte Telegram-, Discord- und Slack-Smoke-Lanes:

```bash
pnpm openclaw qa telegram
pnpm openclaw qa discord
pnpm openclaw qa slack
```

Sie zielen auf einen bereits bestehenden echten Kanal mit zwei Bots (Driver + SUT). Erforderliche Umgebungsvariablen, Szenariolisten, Ausgabe-Artefakte und der Convex-Anmeldeinformationspool sind unten in der [Telegram-, Discord- und Slack-QA-Referenz](#telegram-discord-and-slack-qa-reference) dokumentiert.

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
wenn Videoaufzeichnung verfügbar ist, zurück in das Mantis-Artefaktverzeichnis. Verwenden Sie `--lease-id <cbx_...>` erneut, nachdem Sie sich manuell
über VNC bei Slack Web angemeldet haben. Mit `--gateway-setup` lässt Mantis ein
persistentes OpenClaw-Slack-Gateway innerhalb der VM auf Port `38973` laufen;
ohne diese Option führt der Befehl die normale Bot-zu-Bot-Slack-QA-Lane aus und
beendet sich nach der Artefakterfassung.

Für eine agenten-/CV-artige Desktop-Aufgabe führen Sie aus:

```bash
pnpm openclaw qa mantis visual-task \
  --browser-url https://example.net \
  --expect-text "Example Domain" \
  --vision-model openai/gpt-5.4
```

`visual-task` least oder verwendet eine Crabbox-Desktop-/Browser-Maschine erneut,
startet `crabbox record --while`, steuert den sichtbaren Browser über einen
verschachtelten `visual-driver`, erfasst `visual-task.png`, führt `openclaw infer image describe`
gegen den Screenshot aus, wenn `--vision-mode image-describe` ausgewählt ist, und
schreibt `visual-task.mp4`, `mantis-visual-task-summary.json`,
`mantis-visual-task-driver-result.json` und `mantis-visual-task-report.md`.
Wenn `--expect-text` gesetzt ist, fordert der Vision-Prompt ein strukturiertes
JSON-Urteil an und besteht nur, wenn das Modell positive sichtbare Nachweise
meldet; eine negative Antwort, die lediglich den Zieltext zitiert, lässt die
Assertion fehlschlagen. Verwenden Sie `--vision-mode metadata` für einen
No-Model-Smoke, der Desktop, Browser, Screenshot- und Video-Plumbing nachweist,
ohne einen Bildverstehens-Provider aufzurufen. Die Aufzeichnung ist ein
erforderliches Artefakt für `visual-task`; wenn Crabbox kein nicht leeres
`visual-task.mp4` aufzeichnet, schlägt die Aufgabe fehl, selbst wenn der visuelle
Driver bestanden hat. Bei einem Fehler behält Mantis den Lease für VNC, sofern
die Aufgabe nicht bereits bestanden hatte und `--keep-lease` nicht gesetzt war.

Bevor Sie gepoolte Live-Anmeldeinformationen verwenden, führen Sie aus:

```bash
pnpm openclaw qa credentials doctor
```

Der Doctor prüft die Convex-Broker-Umgebung, validiert Endpoint-Einstellungen und verifiziert die Admin-/Listen-Erreichbarkeit, wenn das Maintainer-Secret vorhanden ist. Er meldet für Secrets nur den Status gesetzt/fehlt.

## Live-Transport-Abdeckung

Live-Transport-Lanes teilen sich einen Vertrag, statt jeweils ihre eigene Form für Szenariolisten zu erfinden. `qa-channel` ist die breite synthetische Suite für Produktverhalten und nicht Teil der Live-Transport-Abdeckungsmatrix.

| Test-Lane | Canary | Mention-Gating | Bot-zu-Bot | Allowlist-Block | Antwort auf oberster Ebene | Wiederaufnahme nach Neustart | Thread-Folgeantwort | Thread-Isolierung | Reaktionsbeobachtung | Hilfebefehl | Native Befehlsregistrierung |
| -------- | ------ | -------------- | ---------- | --------------- | --------------- | -------------- | ---------------- | ---------------- | -------------------- | ------------ | --------------------------- |
| Matrix   | x      | x              | x          | x               | x               | x              | x                | x                | x                    |              |                             |
| Telegram | x      | x              | x          |                 |                 |                |                  |                  |                      | x            |                             |
| Discord  | x      | x              | x          |                 |                 |                |                  |                  |                      |              | x                           |
| Slack    | x      | x              | x          |                 |                 |                |                  |                  |                      |              |                             |

Dadurch bleibt `qa-channel` die breite Suite für Produktverhalten, während Matrix,
Telegram und künftige Live-Transporte eine explizite, gemeinsame Checkliste für
Transportverträge verwenden.

Für eine kurzlebige Linux-VM-Test-Lane, ohne Docker in den QA-Pfad einzubinden, führen Sie aus:

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

Dies startet einen frischen Multipass-Gast, installiert Abhängigkeiten, baut OpenClaw
innerhalb des Gasts, führt `qa suite` aus und kopiert anschließend den normalen QA-Bericht und die
Zusammenfassung zurück in `.artifacts/qa-e2e/...` auf dem Host.
Es verwendet dasselbe Verhalten zur Szenarioauswahl wie `qa suite` auf dem Host.
Host- und Multipass-Suite-Läufe führen standardmäßig mehrere ausgewählte Szenarien parallel
mit isolierten Gateway-Workern aus. `qa-channel` verwendet standardmäßig eine Nebenläufigkeit von
4, begrenzt durch die Anzahl der ausgewählten Szenarien. Verwenden Sie `--concurrency <count>`, um
die Worker-Anzahl anzupassen, oder `--concurrency 1` für serielle Ausführung.
Der Befehl beendet sich mit einem Nicht-Null-Code, wenn ein Szenario fehlschlägt. Verwenden Sie `--allow-failures`, wenn
Sie Artefakte ohne fehlschlagenden Exit-Code möchten.
Live-Läufe leiten die unterstützten QA-Authentifizierungseingaben weiter, die für den
Gast praktikabel sind: env-basierte Provider-Schlüssel, den QA-Live-Provider-Konfigurationspfad und
`CODEX_HOME`, wenn vorhanden. Legen Sie `--output-dir` unterhalb des Repo-Stammverzeichnisses ab, damit der Gast
über den gemounteten Workspace zurückschreiben kann.

## Telegram-, Discord- und Slack-QA-Referenz

Matrix hat wegen der Anzahl der Szenarien und der Docker-gestützten Homeserver-Bereitstellung eine [eigene Seite](/de/concepts/qa-matrix). Telegram, Discord und Slack sind kleiner — jeweils eine Handvoll Szenarien, kein Profilsystem, gegen bereits vorhandene echte Kanäle — daher befindet sich ihre Referenz hier.

### Gemeinsame CLI-Flags

Diese Test-Lanes werden über `extensions/qa-lab/src/live-transports/shared/live-transport-cli.ts` registriert und akzeptieren dieselben Flags:

| Flag                                  | Standardwert                                                    | Beschreibung                                                                                                           |
| ------------------------------------- | --------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `--scenario <id>`                     | —                                                               | Nur dieses Szenario ausführen. Wiederholbar.                                                                            |
| `--output-dir <path>`                 | `<repo>/.artifacts/qa-e2e/{telegram,discord,slack}-<timestamp>` | Ort, an dem Berichte/Zusammenfassung/beobachtete Nachrichten und das Ausgabeprotokoll geschrieben werden. Relative Pfade werden gegen `--repo-root` aufgelöst. |
| `--repo-root <path>`                  | `process.cwd()`                                                 | Repo-Stammverzeichnis beim Aufruf aus einem neutralen Arbeitsverzeichnis.                                               |
| `--sut-account <id>`                  | `sut`                                                           | Temporäre Konto-ID innerhalb der QA-Gateway-Konfiguration.                                                              |
| `--provider-mode <mode>`              | `live-frontier`                                                 | `mock-openai` oder `live-frontier` (das ältere `live-openai` funktioniert weiterhin).                                  |
| `--model <ref>` / `--alt-model <ref>` | Provider-Standard                                               | Primäre/alternative Modellrefs.                                                                                         |
| `--fast`                              | aus                                                             | Provider-Schnellmodus, sofern unterstützt.                                                                              |
| `--credential-source <env\|convex>`   | `env`                                                           | Siehe [Convex-Credential-Pool](#convex-credential-pool).                                                                |
| `--credential-role <maintainer\|ci>`  | `ci` in CI, andernfalls `maintainer`                            | Rolle, die verwendet wird, wenn `--credential-source convex` gesetzt ist.                                                |

Jede Test-Lane beendet sich bei jedem fehlgeschlagenen Szenario mit einem Nicht-Null-Code. `--allow-failures` schreibt Artefakte, ohne einen fehlschlagenden Exit-Code zu setzen.

### Telegram-QA

```bash
pnpm openclaw qa telegram
```

Zielt auf eine echte private Telegram-Gruppe mit zwei unterschiedlichen Bots (Treiber + SUT). Der SUT-Bot muss einen Telegram-Benutzernamen haben; Bot-zu-Bot-Beobachtung funktioniert am besten, wenn beide Bots in `@BotFather` **Bot-to-Bot Communication Mode** aktiviert haben.

Erforderliche env bei `--credential-source env`:

- `OPENCLAW_QA_TELEGRAM_GROUP_ID` — numerische Chat-ID (String).
- `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`

Optional:

- `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1` behält Nachrichtentexte in Artefakten beobachteter Nachrichten bei (standardmäßig redigiert).

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
- `telegram-qa-summary.json` — enthält Antwort-RTT pro Antwort (Treiber sendet → beobachtete SUT-Antwort), beginnend mit dem Canary.
- `telegram-qa-observed-messages.json` — Texte redigiert, sofern nicht `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1` gesetzt ist.

### Discord-QA

```bash
pnpm openclaw qa discord
```

Zielt auf einen echten privaten Discord-Guild-Kanal mit zwei Bots: einen vom Harness gesteuerten Treiber-Bot und einen SUT-Bot, der durch das untergeordnete OpenClaw-Gateway über das gebündelte Discord-Plugin gestartet wird. Prüft Kanal-Mention-Verarbeitung, dass der SUT-Bot den nativen `/help`-Befehl bei Discord registriert hat, und Opt-in-Mantis-Evidenzszenarien.

Erforderliche env bei `--credential-source env`:

- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID` — muss mit der von Discord zurückgegebenen SUT-Bot-Benutzer-ID übereinstimmen (andernfalls schlägt die Test-Lane schnell fehl).

Optional:

- `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1` behält Nachrichtentexte in Artefakten beobachteter Nachrichten bei.

Szenarien (`extensions/qa-lab/src/live-transports/discord/discord-live.runtime.ts:36`):

- `discord-canary`
- `discord-mention-gating`
- `discord-native-help-command-registration`
- `discord-status-reactions-tool-only` — Opt-in-Mantis-Szenario. Läuft eigenständig, weil es die SUT auf durchgehend aktive, reine Tool-Guild-Antworten mit `messages.statusReactions.enabled=true` umschaltet und anschließend eine REST-Reaktionszeitleiste sowie HTML/PNG-Bildartefakte erfasst. Mantis-Vorher/Nachher-Berichte behalten außerdem vom Szenario bereitgestellte MP4-Artefakte als `baseline.mp4` und `candidate.mp4` bei.

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
- `discord-qa-observed-messages.json` — Texte redigiert, sofern nicht `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1` gesetzt ist.
- `discord-qa-reaction-timelines.json` und `discord-status-reactions-tool-only-timeline.png`, wenn das Statusreaktionsszenario ausgeführt wird.

### Slack-QA

```bash
pnpm openclaw qa slack
```

Zielt auf einen echten privaten Slack-Kanal mit zwei unterschiedlichen Bots: einen vom Harness gesteuerten Treiber-Bot und einen SUT-Bot, der durch das untergeordnete OpenClaw-Gateway über das gebündelte Slack-Plugin gestartet wird.

Erforderliche env bei `--credential-source env`:

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`

Optional:

- `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1` behält Nachrichtentexte in Artefakten beobachteter Nachrichten bei.

Szenarien (`extensions/qa-lab/src/live-transports/slack/slack-live.runtime.ts:39`):

- `slack-canary`
- `slack-mention-gating`

Ausgabeartefakte:

- `slack-qa-report.md`
- `slack-qa-summary.json`
- `slack-qa-observed-messages.json` — Texte redigiert, sofern nicht `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1` gesetzt ist.

#### Slack-Workspace einrichten

Die Test-Lane benötigt zwei unterschiedliche Slack-Apps in einem Workspace sowie einen Kanal, in dem beide Bots Mitglied sind:

- `channelId` — die `Cxxxxxxxxxx`-ID eines Kanals, in den beide Bots eingeladen wurden. Verwenden Sie einen dedizierten Kanal; die Test-Lane postet bei jedem Lauf.
- `driverBotToken` — Bot-Token (`xoxb-...`) der **Driver**-App.
- `sutBotToken` — Bot-Token (`xoxb-...`) der **SUT**-App, die eine separate Slack-App vom Treiber sein muss, damit ihre Bot-Benutzer-ID eindeutig ist.
- `sutAppToken` — App-Level-Token (`xapp-...`) der SUT-App mit `connections:write`, das von Socket Mode verwendet wird, damit die SUT-App Ereignisse empfangen kann.

Bevorzugen Sie einen Slack-Workspace, der QA gewidmet ist, gegenüber der Wiederverwendung eines Produktions-Workspace.

Das folgende SUT-Manifest entspricht der Produktionsinstallation des gebündelten Slack-Plugins (`extensions/slack/src/setup-shared.ts:10`). Für die Einrichtung des Produktionskanals aus Benutzersicht siehe [Slack-Kanal-Schnelleinrichtung](/de/channels/slack#quick-setup); das QA-Driver/SUT-Paar ist absichtlich separat, weil die Test-Lane zwei unterschiedliche Bot-Benutzer-IDs in einem Workspace benötigt.

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

Kopieren Sie den _Bot User OAuth Token_ (`xoxb-...`) — er wird zu `driverBotToken`. Der Treiber muss nur Nachrichten posten und sich identifizieren; keine Ereignisse, kein Socket Mode.

**2. SUT-App erstellen**

Wiederholen Sie _Create New App → From a manifest_ im selben Workspace. Der Scope-Satz entspricht der Produktionsinstallation des gebündelten Slack-Plugins (`extensions/slack/src/setup-shared.ts:10`):

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
        "reactions:read",
        "reactions:write",
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
        "pin_removed",
        "reaction_added",
        "reaction_removed"
      ]
    }
  }
}
```

Nachdem Slack die App erstellt hat, führen Sie auf der Einstellungsseite zwei Schritte aus:

- _In Workspace installieren_ → kopieren Sie das _Bot-Benutzer-OAuth-Token_ → daraus wird `sutBotToken`.
- _Grundlegende Informationen → Token auf App-Ebene → Token und Scopes generieren_ → fügen Sie den Scope `connections:write` hinzu → speichern → kopieren Sie den Wert `xapp-...` → daraus wird `sutAppToken`.

Verifizieren Sie die unterschiedlichen Benutzer-IDs der beiden Bots, indem Sie `auth.test` für jedes Token aufrufen. Die Laufzeit unterscheidet Treiber und SUT anhand der Benutzer-ID; die Wiederverwendung einer App für beides lässt das Erwähnungs-Gating sofort fehlschlagen.

**3. Kanal erstellen**

Erstellen Sie im QA-Workspace einen Kanal (z. B. `#openclaw-qa`) und laden Sie beide Bots aus dem Kanal heraus ein:

```
/invite @OpenClaw QA Driver
/invite @OpenClaw QA SUT
```

Kopieren Sie die ID `Cxxxxxxxxxx` aus _Kanalinformationen → Über → Kanal-ID_ — daraus wird `channelId`. Ein öffentlicher Kanal funktioniert; wenn Sie einen privaten Kanal verwenden, haben beide Apps bereits `groups:history`, sodass die Verlaufslesevorgänge des Harness weiterhin erfolgreich sind.

**4. Zugangsdaten registrieren**

Es gibt zwei Optionen. Verwenden Sie Umgebungsvariablen für das Debugging auf einem einzelnen Rechner (setzen Sie die vier Variablen `OPENCLAW_QA_SLACK_*` und übergeben Sie `--credential-source env`), oder befüllen Sie den gemeinsamen Convex-Pool, damit CI und andere Maintainer sie ausleihen können.

Schreiben Sie für den Convex-Pool die vier Felder in eine JSON-Datei:

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

Erwarten Sie `count: 1`, `status: "active"` und kein Feld `lease`.

**5. Ende-zu-Ende verifizieren**

Führen Sie die Lane lokal aus, um zu bestätigen, dass beide Bots über den Broker miteinander kommunizieren können:

```bash
pnpm openclaw qa slack \
  --credential-source convex \
  --credential-role maintainer \
  --output-dir .artifacts/qa-e2e/slack-local
```

Ein erfolgreicher Lauf ist in deutlich unter 30 Sekunden abgeschlossen, und `slack-qa-report.md` zeigt sowohl `slack-canary` als auch `slack-mention-gating` mit Status `pass`. Wenn die Lane etwa 90 Sekunden hängen bleibt und mit `Convex credential pool exhausted for kind "slack"` beendet wird, ist entweder der Pool leer oder jede Zeile ist ausgeliehen — `qa credentials list --kind slack --status all --json` zeigt Ihnen, was zutrifft.

### Convex-Zugangsdatenpool

Telegram-, Discord- und Slack-Lanes können Zugangsdaten aus einem gemeinsamen Convex-Pool ausleihen, statt die obigen Umgebungsvariablen zu lesen. Übergeben Sie `--credential-source convex` (oder setzen Sie `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`); QA Lab erwirbt eine exklusive Lease, sendet während der Laufzeit Heartbeats dafür und gibt sie beim Herunterfahren frei. Pool-Arten sind `"telegram"`, `"discord"` und `"slack"`.

Payload-Formate, die der Broker bei `admin/add` validiert:

- Telegram (`kind: "telegram"`): `{ groupId: string, driverToken: string, sutToken: string }` — `groupId` muss eine numerische Chat-ID-Zeichenfolge sein.
- Discord (`kind: "discord"`): `{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string }`.
- Slack (`kind: "slack"`): `{ channelId: string, driverBotToken: string, sutBotToken: string, sutAppToken: string }` — `channelId` muss `^[A-Z][A-Z0-9]+$` entsprechen (eine Slack-ID wie `Cxxxxxxxxxx`). Siehe [Slack-Workspace einrichten](#setting-up-the-slack-workspace) für App- und Scope-Bereitstellung.

Operative Umgebungsvariablen und der Endpoint-Vertrag des Convex-Brokers stehen in [Testen → Gemeinsame Telegram-Zugangsdaten über Convex](/de/help/testing#shared-telegram-credentials-via-convex-v1) (der Abschnittsname stammt aus der Zeit vor der Discord-Unterstützung; die Broker-Semantik ist für beide Arten identisch).

## Repo-gestützte Seeds

Seed-Assets befinden sich in `qa/`:

- `qa/scenarios/index.md`
- `qa/scenarios/<theme>/*.md`

Diese liegen absichtlich in Git, damit der QA-Plan sowohl für Menschen als auch für den Agent sichtbar ist.

`qa-lab` sollte ein generischer Markdown-Runner bleiben. Jede Szenario-Markdown-Datei ist die maßgebliche Quelle für einen Testlauf und sollte Folgendes definieren:

- Szenario-Metadaten
- optionale Kategorie-, Capability-, Lane- und Risikometadaten
- Dokumentations- und Code-Referenzen
- optionale Plugin-Anforderungen
- optionaler Gateway-Konfigurationspatch
- der ausführbare `qa-flow`

Die wiederverwendbare Laufzeitoberfläche, auf der `qa-flow` basiert, darf generisch und querschnittlich bleiben. Beispielsweise können Markdown-Szenarien transportseitige Helfer mit browserseitigen Helfern kombinieren, die die eingebettete Control UI über den Gateway-`browser.request`-Seam steuern, ohne einen Spezial-Runner hinzuzufügen.

Szenariodateien sollten nach Produkt-Capability und nicht nach Quellbaumordner gruppiert werden. Halten Sie Szenario-IDs stabil, wenn Dateien verschoben werden; verwenden Sie `docsRefs` und `codeRefs` für Implementierungsnachverfolgbarkeit.

Die Baseline-Liste sollte breit genug bleiben, um Folgendes abzudecken:

- DM- und Kanal-Chat
- Thread-Verhalten
- Lebenszyklus von Nachrichtenaktionen
- Cron-Callbacks
- Speicherabruf
- Modellwechsel
- Subagent-Übergabe
- Repo-Lesen und Docs-Lesen
- eine kleine Build-Aufgabe wie Lobster Invaders

## Provider-Mock-Lanes

`qa suite` hat zwei lokale Provider-Mock-Lanes:

- `mock-openai` ist der szenariobewusste OpenClaw-Mock. Er bleibt die standardmäßige deterministische Mock-Lane für repo-gestützte QA und Paritäts-Gates.
- `aimock` startet einen AIMock-gestützten Provider-Server für experimentelle Protokoll-, Fixture-, Record/Replay- und Chaos-Abdeckung. Er ist additiv und ersetzt den `mock-openai`-Szenario-Dispatcher nicht.

Die Implementierung der Provider-Lanes befindet sich unter `extensions/qa-lab/src/providers/`. Jeder Provider besitzt seine Defaults, den lokalen Serverstart, die Gateway-Modellkonfiguration, Anforderungen an Auth-Profile-Staging sowie Live-/Mock-Capability-Flags. Gemeinsamer Suite- und Gateway-Code sollte über die Provider-Registry routen, statt anhand von Provider-Namen zu verzweigen.

## Transportadapter

`qa-lab` besitzt einen generischen Transport-Seam für Markdown-QA-Szenarien. `qa-channel` ist der erste Adapter an diesem Seam, aber das Designziel ist breiter: Künftige reale oder synthetische Kanäle sollten sich in denselben Suite-Runner einklinken, statt einen transportspezifischen QA-Runner hinzuzufügen.

Auf Architekturebene lautet die Aufteilung:

- `qa-lab` besitzt generische Szenarioausführung, Worker-Nebenläufigkeit, Artefakterstellung und Reporting.
- Der Transportadapter besitzt Gateway-Konfiguration, Bereitschaft, eingehende und ausgehende Beobachtung, Transportaktionen und normalisierten Transportzustand.
- Markdown-Szenariodateien unter `qa/scenarios/` definieren den Testlauf; `qa-lab` stellt die wiederverwendbare Laufzeitoberfläche bereit, die sie ausführt.

### Kanal hinzufügen

Das Hinzufügen eines Kanals zum Markdown-QA-System erfordert genau zwei Dinge:

1. Einen Transportadapter für den Kanal.
2. Ein Szenariopaket, das den Kanalvertrag ausübt.

Fügen Sie keinen neuen obersten QA-Befehls-Root hinzu, wenn der gemeinsame `qa-lab`-Host den Ablauf besitzen kann.

`qa-lab` besitzt die gemeinsamen Host-Mechaniken:

- den Befehls-Root `openclaw qa`
- Start und Teardown der Suite
- Worker-Nebenläufigkeit
- Artefakterstellung
- Berichtserstellung
- Szenarioausführung
- Kompatibilitätsaliase für ältere `qa-channel`-Szenarien

Runner-Plugins besitzen den Transportvertrag:

- wie `openclaw qa <runner>` unter dem gemeinsamen `qa`-Root eingehängt wird
- wie das Gateway für diesen Transport konfiguriert wird
- wie die Bereitschaft geprüft wird
- wie eingehende Events injiziert werden
- wie ausgehende Nachrichten beobachtet werden
- wie Transkripte und normalisierter Transportzustand offengelegt werden
- wie transportgestützte Aktionen ausgeführt werden
- wie transportspezifisches Zurücksetzen oder Aufräumen gehandhabt wird

Die Mindestanforderungen für die Einführung eines neuen Kanals:

1. Behalten Sie `qa-lab` als Owner des gemeinsamen `qa`-Roots.
2. Implementieren Sie den Transport-Runner auf dem gemeinsamen `qa-lab`-Host-Seam.
3. Halten Sie transportspezifische Mechaniken im Runner-Plugin oder Kanal-Harness.
4. Hängen Sie den Runner als `openclaw qa <runner>` ein, statt einen konkurrierenden Root-Befehl zu registrieren. Runner-Plugins sollten `qaRunners` in `openclaw.plugin.json` deklarieren und ein passendes Array `qaRunnerCliRegistrations` aus `runtime-api.ts` exportieren. Halten Sie `runtime-api.ts` schlank; lazy CLI- und Runner-Ausführung sollten hinter separaten Einstiegspunkten bleiben.
5. Erstellen oder adaptieren Sie Markdown-Szenarien unter den thematischen Verzeichnissen `qa/scenarios/`.
6. Verwenden Sie die generischen Szenariohelfer für neue Szenarien.
7. Halten Sie bestehende Kompatibilitätsaliase funktionsfähig, sofern das Repo keine absichtliche Migration durchführt.

Die Entscheidungsregel ist strikt:

- Wenn Verhalten einmal in `qa-lab` ausgedrückt werden kann, legen Sie es in `qa-lab` ab.
- Wenn Verhalten von einem Kanaltransport abhängt, behalten Sie es in diesem Runner-Plugin oder Plugin-Harness.
- Wenn ein Szenario eine neue Capability benötigt, die mehr als ein Kanal verwenden kann, fügen Sie einen generischen Helfer hinzu statt einer kanalspezifischen Verzweigung in `suite.ts`.
- Wenn ein Verhalten nur für einen Transport sinnvoll ist, halten Sie das Szenario transportspezifisch und machen Sie dies im Szenariovertrag explizit.

### Namen von Szenariohelfern

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

Kompatibilitätsaliase bleiben für bestehende Szenarien verfügbar — `waitForQaChannelReady`, `waitForOutboundMessage`, `waitForNoOutbound`, `formatConversationTranscript`, `resetBus` — aber neue Szenarioerstellung sollte die generischen Namen verwenden. Die Aliase existieren, um eine Migration an einem Stichtag zu vermeiden, nicht als künftiges Modell.

## Reporting

`qa-lab` exportiert einen Markdown-Protokollbericht aus der beobachteten Bus-Zeitleiste.
Der Bericht sollte Folgendes beantworten:

- Was funktioniert hat
- Was fehlgeschlagen ist
- Was blockiert geblieben ist
- Welche Folgeszenarien sich lohnen

Für das Inventar verfügbarer Szenarien — nützlich beim Abschätzen von Folgearbeiten oder beim Verdrahten eines neuen Transports — führen Sie `pnpm openclaw qa coverage` aus (fügen Sie `--json` für maschinenlesbare Ausgabe hinzu).

Für Zeichen- und Stilprüfungen führen Sie dasselbe Szenario über mehrere Live-Modellreferenzen hinweg aus und schreiben Sie einen beurteilten Markdown-Bericht:

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

Der Befehl führt lokale untergeordnete QA-Gateway-Prozesse aus, nicht Docker. Character-Eval-Szenarien
sollten die Persona über `SOUL.md` festlegen und dann gewöhnliche Benutzer-Turns
wie Chat, Workspace-Hilfe und kleine Datei-Aufgaben ausführen. Dem Kandidatenmodell sollte
nicht mitgeteilt werden, dass es evaluiert wird. Der Befehl bewahrt jedes vollständige
Transkript auf, zeichnet grundlegende Laufstatistiken auf und fordert dann die Judge-Modelle im Fast-Modus mit
`xhigh`-Reasoning, sofern unterstützt, auf, die Läufe nach Natürlichkeit, Vibe und Humor zu bewerten.
Verwenden Sie `--blind-judge-models`, wenn Sie Provider vergleichen: Der Judge-Prompt erhält weiterhin
jedes Transkript und jeden Laufstatus, aber Kandidatenreferenzen werden durch neutrale
Labels wie `candidate-01` ersetzt; der Bericht ordnet die Rankings nach dem
Parsen wieder den realen Referenzen zu.
Kandidatenläufe verwenden standardmäßig den Denkmodus `high`, mit `medium` für GPT-5.5 und `xhigh`
für ältere OpenAI-Eval-Referenzen, die dies unterstützen. Überschreiben Sie einen bestimmten Kandidaten inline mit
`--model provider/model,thinking=<level>`. `--thinking <level>` legt weiterhin einen
globalen Fallback fest, und die ältere Form `--model-thinking <provider/model=level>` wird
aus Kompatibilitätsgründen beibehalten.
OpenAI-Kandidatenreferenzen verwenden standardmäßig den Fast-Modus, damit Priority Processing dort genutzt wird, wo
der Provider dies unterstützt. Fügen Sie inline `,fast`, `,no-fast` oder `,fast=false` hinzu, wenn ein
einzelner Kandidat oder Judge eine Überschreibung benötigt. Übergeben Sie `--fast` nur, wenn Sie
den Fast-Modus für jedes Kandidatenmodell erzwingen möchten. Kandidaten- und Judge-Dauern werden
im Bericht für Benchmark-Analysen aufgezeichnet, aber Judge-Prompts sagen ausdrücklich,
nicht nach Geschwindigkeit zu ranken.
Kandidaten- und Judge-Modellläufe verwenden beide standardmäßig eine Concurrency von 16. Senken Sie
`--concurrency` oder `--judge-concurrency`, wenn Provider-Limits oder lokaler Gateway-Druck
einen Lauf zu verrauscht machen.
Wenn kein Kandidaten-`--model` übergeben wird, verwendet die Character-Eval standardmäßig
`openai/gpt-5.5`, `openai/gpt-5.2`, `openai/gpt-5`, `anthropic/claude-opus-4-6`,
`anthropic/claude-sonnet-4-6`, `zai/glm-5.1`,
`moonshot/kimi-k2.5` und
`google/gemini-3.1-pro-preview`, wenn kein `--model` übergeben wird.
Wenn kein `--judge-model` übergeben wird, verwenden die Judges standardmäßig
`openai/gpt-5.5,thinking=xhigh,fast` und
`anthropic/claude-opus-4-6,thinking=high`.

## Verwandte Dokumentation

- [Matrix-QA](/de/concepts/qa-matrix)
- [QA-Channel](/de/channels/qa-channel)
- [Tests](/de/help/testing)
- [Dashboard](/de/web/dashboard)
