---
read_when:
    - Verstehen, wie der QA-Stack zusammenpasst
    - Erweitern von qa-lab, qa-channel oder einem Transportadapter
    - Repo-gestützte QA-Szenarien hinzufügen
    - Aufbau realitätsnäherer QA-Automatisierung rund um das Gateway-Dashboard
summary: 'QA-Stack-Übersicht: qa-lab, qa-channel, Repository-gestützte Szenarien, Live-Transport-Lanes, Transportadapter und Berichterstattung.'
title: QA-Übersicht
x-i18n:
    generated_at: "2026-05-05T01:45:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: 83adbe934d73265a1b47ee463c98fdd3eddfb1cd063d3a46a83dfc7568df0a96
    source_path: concepts/qa-e2e-automation.md
    workflow: 16
---

Der private QA-Stack soll OpenClaw auf realistischere,
kanalnahe Weise ausüben, als es ein einzelner Unit-Test kann.

Aktuelle Bestandteile:

- `extensions/qa-channel`: synthetischer Nachrichtenkanal mit Oberflächen für DM, Kanal, Thread,
  Reaktion, Bearbeiten und Löschen.
- `extensions/qa-lab`: Debugger-UI und QA-Bus zum Beobachten des Transkripts,
  Einspeisen eingehender Nachrichten und Exportieren eines Markdown-Berichts.
- `extensions/qa-matrix`, künftige Runner-Plugins: Live-Transport-Adapter, die
  einen echten Kanal innerhalb eines untergeordneten QA-Gateway steuern.
- `qa/`: repo-gestützte Seed-Assets für die Kickoff-Aufgabe und Baseline-QA-
  Szenarien.
- [Mantis](/de/concepts/mantis): Vorher- und Nachher-Live-Verifizierung für Bugs, die
  echte Transporte, Browser-Screenshots, VM-Zustand und PR-Nachweise benötigen.

## Befehlsoberfläche

Jeder QA-Flow läuft unter `pnpm openclaw qa <subcommand>`. Viele haben `pnpm qa:*`-
Skript-Aliasse; beide Formen werden unterstützt.

| Befehl                                              | Zweck                                                                                                                                                                                                             |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `qa run`                                            | Gebündelter QA-Selbstcheck; schreibt einen Markdown-Bericht.                                                                                                                                                      |
| `qa suite`                                          | Führt repo-gestützte Szenarien gegen die QA-Gateway-Lane aus. Aliasse: `pnpm openclaw qa suite --runner multipass` für eine kurzlebige Linux-VM.                                                                  |
| `qa coverage`                                       | Gibt das Markdown-Inventar der Szenarioabdeckung aus (`--json` für maschinenlesbare Ausgabe).                                                                                                                     |
| `qa parity-report`                                  | Vergleicht zwei `qa-suite-summary.json`-Dateien und schreibt den agentischen Paritätsbericht.                                                                                                                      |
| `qa character-eval`                                 | Führt das Character-QA-Szenario über mehrere Live-Modelle hinweg mit einem beurteilten Bericht aus. Siehe [Berichterstattung](#reporting).                                                                        |
| `qa manual`                                         | Führt einen einmaligen Prompt gegen die ausgewählte Provider-/Modell-Lane aus.                                                                                                                                     |
| `qa ui`                                             | Startet die QA-Debugger-UI und den lokalen QA-Bus (Alias: `pnpm qa:lab:ui`).                                                                                                                                       |
| `qa docker-build-image`                             | Baut das vorgebackene QA-Docker-Image.                                                                                                                                                                            |
| `qa docker-scaffold`                                | Schreibt ein docker-compose-Gerüst für das QA-Dashboard und die Gateway-Lane.                                                                                                                                      |
| `qa up`                                             | Baut die QA-Site, startet den Docker-gestützten Stack und gibt die URL aus (Alias: `pnpm qa:lab:up`; die Variante `:fast` fügt `--use-prebuilt-image --bind-ui-dist --skip-ui-build` hinzu).                      |
| `qa aimock`                                         | Startet nur den AIMock-Provider-Server.                                                                                                                                                                           |
| `qa mock-openai`                                    | Startet nur den szenariobewussten `mock-openai`-Provider-Server.                                                                                                                                                  |
| `qa credentials doctor` / `add` / `list` / `remove` | Verwaltet den gemeinsam genutzten Convex-Anmeldeinformationspool.                                                                                                                                                 |
| `qa matrix`                                         | Live-Transport-Lane gegen einen kurzlebigen Tuwunel-Homeserver. Siehe [Matrix QA](/de/concepts/qa-matrix).                                                                                                           |
| `qa telegram`                                       | Live-Transport-Lane gegen eine echte private Telegram-Gruppe.                                                                                                                                                     |
| `qa discord`                                        | Live-Transport-Lane gegen einen echten privaten Discord-Guild-Kanal.                                                                                                                                              |
| `qa slack`                                          | Live-Transport-Lane gegen einen echten privaten Slack-Kanal.                                                                                                                                                      |
| `qa mantis`                                         | Vorher- und Nachher-Verifizierungsrunner für Live-Transport-Bugs, mit Discord-Statusreaktionsnachweisen, Crabbox-Desktop-/Browser-Smoke und Slack-in-VNC-Smoke. Siehe [Mantis](/de/concepts/mantis).                |

## Operator-Ablauf

Der aktuelle QA-Operator-Ablauf ist eine zweigeteilte QA-Site:

- Links: Gateway-Dashboard (Control UI) mit dem Agenten.
- Rechts: QA Lab, das das Slack-ähnliche Transkript und den Szenarioplan zeigt.

Führen Sie es aus mit:

```bash
pnpm qa:lab:up
```

Das baut die QA-Site, startet die Docker-gestützte Gateway-Lane und stellt die
QA-Lab-Seite bereit, auf der ein Operator oder eine Automatisierungsschleife dem
Agenten eine QA-Mission geben, echtes Kanalverhalten beobachten und aufzeichnen kann,
was funktioniert hat, fehlgeschlagen ist oder blockiert blieb.

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
baut dieses Bundle bei Änderungen neu, und der Browser lädt automatisch neu, wenn sich
der QA-Lab-Asset-Hash ändert.

Für einen lokalen OpenTelemetry-Trace-Smoke führen Sie aus:

```bash
pnpm qa:otel:smoke
```

Dieses Skript startet einen lokalen OTLP/HTTP-Trace-Empfänger, führt das
`otel-trace-smoke`-QA-Szenario mit aktiviertem `diagnostics-otel`-Plugin aus,
dekodiert anschließend die exportierten protobuf-Spans und prüft die release-kritische Form:
`openclaw.run`, `openclaw.harness.run`, `openclaw.model.call`,
`openclaw.context.assembled` und `openclaw.message.delivery` müssen vorhanden sein;
Modellaufrufe dürfen bei erfolgreichen Turns kein `StreamAbandoned` exportieren; rohe Diagnose-IDs und
`openclaw.content.*`-Attribute müssen aus dem Trace herausbleiben. Es schreibt
`otel-smoke-summary.json` neben die QA-Suite-Artefakte.

Observability-QA bleibt nur für Source-Checkouts. Der npm-Tarball lässt
QA Lab absichtlich aus, daher führen Package-Docker-Release-Lanes keine `qa`-Befehle aus. Verwenden Sie
`pnpm qa:otel:smoke` aus einem gebauten Source-Checkout, wenn Sie Diagnose-
Instrumentation ändern.

Für eine transportechte Matrix-Smoke-Lane führen Sie aus:

```bash
pnpm openclaw qa matrix --profile fast --fail-fast
```

Die vollständige CLI-Referenz, der Profil-/Szenariokatalog, Env-Vars und das Artefaktlayout für diese Lane stehen in [Matrix QA](/de/concepts/qa-matrix). Kurz gesagt: Sie stellt einen kurzlebigen Tuwunel-Homeserver in Docker bereit, registriert temporäre Driver-/SUT-/Observer-Benutzer, führt das echte Matrix-Plugin innerhalb eines untergeordneten QA-Gateway aus, das auf diesen Transport beschränkt ist (kein `qa-channel`), und schreibt dann einen Markdown-Bericht, eine JSON-Zusammenfassung, ein Observed-Events-Artefakt und ein kombiniertes Ausgabelog unter `.artifacts/qa-e2e/matrix-<timestamp>/`.

Für transportechte Telegram-, Discord- und Slack-Smoke-Lanes:

```bash
pnpm openclaw qa telegram
pnpm openclaw qa discord
pnpm openclaw qa slack
```

Sie zielen auf einen bereits vorhandenen echten Kanal mit zwei Bots (Driver + SUT). Erforderliche Env-Vars, Szenariolisten, Ausgabeartefakte und der Convex-Anmeldeinformationspool sind unten in der [Telegram-, Discord- und Slack-QA-Referenz](#telegram-discord-and-slack-qa-reference) dokumentiert.

Für einen vollständigen Slack-Desktop-VM-Lauf mit VNC-Rettung führen Sie aus:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

Dieser Befehl least eine Crabbox-Desktop-/Browser-Maschine, führt die Slack-Live-Lane
innerhalb der VM aus, öffnet Slack Web im VNC-Browser, erfasst den Desktop und
kopiert `slack-qa/` sowie `slack-desktop-smoke.png` zurück in das Mantis-Artefakt-
Verzeichnis. Verwenden Sie `--lease-id <cbx_...>` erneut, nachdem Sie sich manuell
über VNC bei Slack Web angemeldet haben. Mit `--gateway-setup` lässt Mantis ein dauerhaftes OpenClaw-Slack-
Gateway innerhalb der VM auf Port `38973` laufen; ohne diese Option führt der Befehl die
normale Bot-zu-Bot-Slack-QA-Lane aus und beendet sich nach der Artefakterfassung.

Bevor Sie gepoolte Live-Anmeldeinformationen verwenden, führen Sie aus:

```bash
pnpm openclaw qa credentials doctor
```

Der Doctor prüft die Convex-Broker-Env, validiert Endpoint-Einstellungen und verifiziert die Admin-/Listen-Erreichbarkeit, wenn das Maintainer-Secret vorhanden ist. Er meldet für Secrets nur den Status gesetzt/fehlend.

## Live-Transport-Abdeckung

Live-Transport-Lanes teilen sich einen Vertrag, statt jeweils ihre eigene Szenariolistenform zu erfinden. `qa-channel` ist die breite synthetische Suite für Produktverhalten und ist nicht Teil der Live-Transport-Abdeckungsmatrix.

| Lane     | Canary | Mention-Gating | Bot-zu-Bot | Allowlist-Block | Top-Level-Antwort | Restart-Resume | Thread-Follow-up | Thread-Isolation | Reaktionsbeobachtung | Help-Befehl | Native Befehlsregistrierung |
| -------- | ------ | -------------- | ---------- | --------------- | ----------------- | -------------- | ---------------- | ---------------- | --------------------- | ----------- | --------------------------- |
| Matrix   | x      | x              | x          | x               | x                 | x              | x                | x                | x                     |             |                             |
| Telegram | x      | x              | x          |                 |                   |                |                  |                  |                       | x           |                             |
| Discord  | x      | x              | x          |                 |                   |                |                  |                  |                       |             | x                           |
| Slack    | x      | x              | x          |                 |                   |                |                  |                  |                       |             |                             |

So bleibt `qa-channel` die breite Suite für Produktverhalten, während Matrix,
Telegram und künftige Live-Transporte eine gemeinsame explizite Transportvertrags-
Checkliste nutzen.

Für eine kurzlebige Linux-VM-Lane, ohne Docker in den QA-Pfad zu bringen, führen Sie aus:

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

Dies startet einen frischen Multipass-Gast, installiert Abhängigkeiten, baut OpenClaw
innerhalb des Gasts, führt `qa suite` aus und kopiert dann den normalen QA-Bericht und
die Zusammenfassung zurück nach `.artifacts/qa-e2e/...` auf dem Host.
Es verwendet dasselbe Verhalten zur Szenarioauswahl wie `qa suite` auf dem Host.
Suite-Ausführungen auf Host und Multipass führen standardmäßig mehrere ausgewählte Szenarien parallel
mit isolierten Gateway-Workern aus. `qa-channel` verwendet standardmäßig Parallelität
4, begrenzt durch die Anzahl der ausgewählten Szenarien. Verwenden Sie `--concurrency <count>`, um
die Worker-Anzahl anzupassen, oder `--concurrency 1` für serielle Ausführung.
Der Befehl wird mit einem Exit-Code ungleich null beendet, wenn ein Szenario fehlschlägt. Verwenden Sie `--allow-failures`, wenn
Sie Artefakte ohne fehlgeschlagenen Exit-Code möchten.
Live-Ausführungen leiten die unterstützten QA-Auth-Eingaben weiter, die für den
Gast praktikabel sind: env-basierte Provider-Schlüssel, den Pfad zur QA-Live-Provider-Konfiguration und
`CODEX_HOME`, wenn vorhanden. Belassen Sie `--output-dir` unterhalb des Repo-Root, damit der Gast
über den gemounteten Workspace zurückschreiben kann.

## QA-Referenz für Telegram, Discord und Slack

Matrix hat eine [eigene Seite](/de/concepts/qa-matrix), weil die Anzahl der Szenarien und die Docker-gestützte Bereitstellung des Homeservers größer sind. Telegram, Discord und Slack sind kleiner — jeweils eine Handvoll Szenarien, kein Profilsystem, gegen vorhandene echte Kanäle — deshalb befindet sich ihre Referenz hier.

### Gemeinsame CLI-Flags

Diese Lanes registrieren sich über `extensions/qa-lab/src/live-transports/shared/live-transport-cli.ts` und akzeptieren dieselben Flags:

| Flag                                  | Standard                                                        | Beschreibung                                                                                                          |
| ------------------------------------- | --------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `--scenario <id>`                     | —                                                               | Führt nur dieses Szenario aus. Wiederholbar.                                                                          |
| `--output-dir <path>`                 | `<repo>/.artifacts/qa-e2e/{telegram,discord,slack}-<timestamp>` | Speicherort für Berichte/Zusammenfassung/beobachtete Nachrichten und das Ausgabelog. Relative Pfade werden gegen `--repo-root` aufgelöst. |
| `--repo-root <path>`                  | `process.cwd()`                                                 | Repository-Root beim Aufruf aus einem neutralen cwd.                                                                  |
| `--sut-account <id>`                  | `sut`                                                           | Temporäre Konto-ID in der QA-Gateway-Konfiguration.                                                                   |
| `--provider-mode <mode>`              | `live-frontier`                                                 | `mock-openai` oder `live-frontier` (das ältere `live-openai` funktioniert weiterhin).                                 |
| `--model <ref>` / `--alt-model <ref>` | Provider-Standard                                               | Primäre/alternative Modell-Refs.                                                                                      |
| `--fast`                              | aus                                                             | Provider-Schnellmodus, sofern unterstützt.                                                                            |
| `--credential-source <env\|convex>`   | `env`                                                           | Siehe [Convex-Anmeldeinformationspool](#convex-credential-pool).                                                      |
| `--credential-role <maintainer\|ci>`  | `ci` in CI, sonst `maintainer`                                  | Rolle, die verwendet wird, wenn `--credential-source convex` gesetzt ist.                                              |

Jede Lane wird mit einem Exit-Code ungleich null beendet, wenn ein Szenario fehlschlägt. `--allow-failures` schreibt Artefakte, ohne einen fehlgeschlagenen Exit-Code zu setzen.

### Telegram-QA

```bash
pnpm openclaw qa telegram
```

Zielt auf eine echte private Telegram-Gruppe mit zwei unterschiedlichen Bots (Driver + SUT). Der SUT-Bot muss einen Telegram-Benutzernamen haben; Bot-zu-Bot-Beobachtung funktioniert am besten, wenn bei beiden Bots der **Bot-to-Bot Communication Mode** in `@BotFather` aktiviert ist.

Erforderliche env bei `--credential-source env`:

- `OPENCLAW_QA_TELEGRAM_GROUP_ID` — numerische Chat-ID (String).
- `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`

Optional:

- `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1` behält Nachrichtentexte in Artefakten mit beobachteten Nachrichten bei (standardmäßig geschwärzt).

Szenarien (`extensions/qa-lab/src/live-transports/telegram/telegram-live.runtime.ts:44`):

- `telegram-canary`
- `telegram-mention-gating`
- `telegram-mentioned-message-reply`
- `telegram-help-command`
- `telegram-commands-command`
- `telegram-tools-compact-command`
- `telegram-whoami-command`
- `telegram-context-command`

Ausgabeartefakte:

- `telegram-qa-report.md`
- `telegram-qa-summary.json` — enthält Antwort-RTT pro Antwort (Driver-Senden → beobachtete SUT-Antwort), beginnend mit dem Canary.
- `telegram-qa-observed-messages.json` — Texte geschwärzt, außer `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1`.

### Discord-QA

```bash
pnpm openclaw qa discord
```

Zielt auf einen echten privaten Discord-Guild-Kanal mit zwei Bots: einem Driver-Bot, der durch den Harness gesteuert wird, und einem SUT-Bot, der durch das untergeordnete OpenClaw-Gateway über das gebündelte Discord-Plugin gestartet wird. Überprüft die Verarbeitung von Kanal-Erwähnungen, dass der SUT-Bot den nativen Befehl `/help` bei Discord registriert hat, sowie optionale Mantis-Evidenzszenarien.

Erforderliche env bei `--credential-source env`:

- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID` — muss mit der von Discord zurückgegebenen SUT-Bot-Benutzer-ID übereinstimmen (sonst schlägt die Lane sofort fehl).

Optional:

- `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1` behält Nachrichtentexte in Artefakten mit beobachteten Nachrichten bei.

Szenarien (`extensions/qa-lab/src/live-transports/discord/discord-live.runtime.ts:36`):

- `discord-canary`
- `discord-mention-gating`
- `discord-native-help-command-registration`
- `discord-status-reactions-tool-only` — optionales Mantis-Szenario. Läuft für sich allein, weil es den SUT auf always-on, nur-Tool-Guild-Antworten mit `messages.statusReactions.enabled=true` umstellt und dann eine REST-Reaktionszeitleiste sowie ein visuelles HTML/PNG-Artefakt erfasst.

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
- `discord-qa-observed-messages.json` — Texte geschwärzt, außer `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1`.
- `discord-qa-reaction-timelines.json` und `discord-status-reactions-tool-only-timeline.png`, wenn das Statusreaktionsszenario läuft.

### Slack-QA

```bash
pnpm openclaw qa slack
```

Zielt auf einen echten privaten Slack-Kanal mit zwei unterschiedlichen Bots: einem Driver-Bot, der durch den Harness gesteuert wird, und einem SUT-Bot, der durch das untergeordnete OpenClaw-Gateway über das gebündelte Slack-Plugin gestartet wird.

Erforderliche env bei `--credential-source env`:

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`

Optional:

- `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1` behält Nachrichtentexte in Artefakten mit beobachteten Nachrichten bei.

Szenarien (`extensions/qa-lab/src/live-transports/slack/slack-live.runtime.ts:39`):

- `slack-canary`
- `slack-mention-gating`

Ausgabeartefakte:

- `slack-qa-report.md`
- `slack-qa-summary.json`
- `slack-qa-observed-messages.json` — Texte geschwärzt, außer `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1`.

#### Einrichten des Slack-Workspace

Die Lane benötigt zwei unterschiedliche Slack-Apps in einem Workspace sowie einen Kanal, in dem beide Bots Mitglieder sind:

- `channelId` — die `Cxxxxxxxxxx`-ID eines Kanals, in den beide Bots eingeladen wurden. Verwenden Sie einen dedizierten Kanal; die Lane postet bei jeder Ausführung.
- `driverBotToken` — Bot-Token (`xoxb-...`) der **Driver**-App.
- `sutBotToken` — Bot-Token (`xoxb-...`) der **SUT**-App, die eine separate Slack-App vom Driver sein muss, damit ihre Bot-Benutzer-ID unterschiedlich ist.
- `sutAppToken` — App-Level-Token (`xapp-...`) der SUT-App mit `connections:write`, das von Socket Mode verwendet wird, damit die SUT-App Ereignisse empfangen kann.

Bevorzugen Sie einen Slack-Workspace, der QA gewidmet ist, statt einen Produktions-Workspace wiederzuverwenden.

Das folgende SUT-Manifest entspricht der Produktionsinstallation des gebündelten Slack-Plugins (`extensions/slack/src/setup-shared.ts:10`). Für die Einrichtung des Produktionskanals, wie Benutzer sie sehen, siehe [Schnelleinrichtung für den Slack-Kanal](/de/channels/slack#quick-setup); das QA-Driver/SUT-Paar ist absichtlich getrennt, weil die Lane zwei unterschiedliche Bot-Benutzer-IDs in einem Workspace benötigt.

**1. Erstellen Sie die Driver-App**

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

Kopieren Sie den _Bot User OAuth Token_ (`xoxb-...`) — dieser wird zu `driverBotToken`. Der Driver muss nur Nachrichten posten und sich selbst identifizieren; keine Ereignisse, kein Socket Mode.

**2. Erstellen Sie die SUT-App**

Wiederholen Sie _Create New App → From a manifest_ im selben Workspace. Der Umfangssatz entspricht der Produktionsinstallation des gebündelten Slack-Plugins (`extensions/slack/src/setup-shared.ts:10`):

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

Nachdem Slack die App erstellt hat, erledigen Sie zwei Dinge auf ihrer Einstellungsseite:

- _Install to Workspace_ → kopieren Sie den _Bot User OAuth Token_ → dieser wird zu `sutBotToken`.
- _Basic Information → App-Level Tokens → Generate Token and Scopes_ → fügen Sie den Scope `connections:write` hinzu → speichern → kopieren Sie den Wert `xapp-...` → dieser wird zu `sutAppToken`.

Verifizieren Sie, dass die beiden Bots unterschiedliche Benutzer-IDs haben, indem Sie für jedes Token `auth.test` aufrufen. Die Runtime unterscheidet Driver und SUT anhand der Benutzer-ID; wenn dieselbe App für beide wiederverwendet wird, schlägt die Prüfung der Erwähnungen sofort fehl.

**3. Kanal erstellen**

Erstellen Sie im QA-Workspace einen Kanal (z. B. `#openclaw-qa`) und laden Sie beide Bots aus dem Kanal heraus ein:

```
/invite @OpenClaw QA Driver
/invite @OpenClaw QA SUT
```

Kopieren Sie die ID `Cxxxxxxxxxx` aus _channel info → About → Channel ID_ — sie wird zu `channelId`. Ein öffentlicher Kanal funktioniert; wenn Sie einen privaten Kanal verwenden, haben beide Apps bereits `groups:history`, sodass die History-Lesezugriffe des Harness weiterhin erfolgreich sind.

**4. Zugangsdaten registrieren**

Es gibt zwei Optionen. Verwenden Sie Env Vars für das Debugging auf einem einzelnen Rechner (setzen Sie die vier Variablen `OPENCLAW_QA_SLACK_*` und übergeben Sie `--credential-source env`), oder befüllen Sie den gemeinsamen Convex-Pool, damit CI und andere Maintainer sie ausleihen können.

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

Erwarten Sie `count: 1`, `status: "active"` und kein Feld `lease`.

**5. Ende-zu-Ende verifizieren**

Führen Sie die Lane lokal aus, um zu bestätigen, dass beide Bots über den Broker miteinander sprechen können:

```bash
pnpm openclaw qa slack \
  --credential-source convex \
  --credential-role maintainer \
  --output-dir .artifacts/qa-e2e/slack-local
```

Ein erfolgreicher Lauf ist in deutlich unter 30 Sekunden abgeschlossen, und `slack-qa-report.md` zeigt sowohl `slack-canary` als auch `slack-mention-gating` mit dem Status `pass`. Wenn die Lane ca. 90 Sekunden hängt und mit `Convex credential pool exhausted for kind "slack"` beendet wird, ist entweder der Pool leer oder jede Zeile ist ausgeliehen — `qa credentials list --kind slack --status all --json` zeigt Ihnen, was zutrifft.

### Convex-Zugangsdatenpool

Telegram-, Discord- und Slack-Lanes können Zugangsdaten aus einem gemeinsamen Convex-Pool ausleihen, anstatt die oben genannten Env Vars zu lesen. Übergeben Sie `--credential-source convex` (oder setzen Sie `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`); QA Lab erwirbt eine exklusive Leihe, sendet für die Dauer des Laufs Heartbeats dafür und gibt sie beim Herunterfahren frei. Pool-Arten sind `"telegram"`, `"discord"` und `"slack"`.

Payload-Formen, die der Broker bei `admin/add` validiert:

- Telegram (`kind: "telegram"`): `{ groupId: string, driverToken: string, sutToken: string }` — `groupId` muss eine numerische Chat-ID-Zeichenkette sein.
- Discord (`kind: "discord"`): `{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string }`.
- Slack (`kind: "slack"`): `{ channelId: string, driverBotToken: string, sutBotToken: string, sutAppToken: string }` — `channelId` muss `^[A-Z][A-Z0-9]+$` entsprechen (eine Slack-ID wie `Cxxxxxxxxxx`). Siehe [Slack-Workspace einrichten](#setting-up-the-slack-workspace) für App- und Scope-Bereitstellung.

Operative Env Vars und der Endpoint-Vertrag des Convex-Brokers stehen unter [Testen → Gemeinsame Telegram-Zugangsdaten über Convex](/de/help/testing#shared-telegram-credentials-via-convex-v1) (der Abschnittsname stammt aus der Zeit vor der Discord-Unterstützung; die Broker-Semantik ist für beide Arten identisch).

## Repo-gestützte Seeds

Seed-Assets liegen in `qa/`:

- `qa/scenarios/index.md`
- `qa/scenarios/<theme>/*.md`

Diese liegen absichtlich in git, damit der QA-Plan sowohl für Menschen als auch für den Agent sichtbar ist.

`qa-lab` sollte ein generischer Markdown-Runner bleiben. Jede Szenario-Markdown-Datei ist die Source of Truth für einen Testlauf und sollte Folgendes definieren:

- Szenario-Metadaten
- optionale Kategorie-, Capability-, Lane- und Risiko-Metadaten
- Dokumentations- und Code-Referenzen
- optionale Plugin-Anforderungen
- optionaler Gateway-Konfigurations-Patch
- der ausführbare `qa-flow`

Die wiederverwendbare Runtime-Oberfläche, die `qa-flow` unterstützt, darf generisch und querschnittlich bleiben. Markdown-Szenarien können beispielsweise transportseitige Helper mit browserseitigen Helpern kombinieren, die die eingebettete Control UI über die Gateway-Nahtstelle `browser.request` steuern, ohne einen Sonderfall-Runner hinzuzufügen.

Szenario-Dateien sollten nach Produkt-Capability statt nach Source-Tree-Ordner gruppiert werden. Halten Sie Szenario-IDs stabil, wenn Dateien verschoben werden; verwenden Sie `docsRefs` und `codeRefs` für die Nachverfolgbarkeit der Implementierung.

Die Baseline-Liste sollte breit genug bleiben, um Folgendes abzudecken:

- DM- und Kanal-Chat
- Thread-Verhalten
- Lebenszyklus von Nachrichtenaktionen
- Cron-Callbacks
- Memory-Abruf
- Modellwechsel
- Übergabe an Subagent
- Repo-Lesen und Docs-Lesen
- eine kleine Build-Aufgabe wie Lobster Invaders

## Provider-Mock-Lanes

`qa suite` hat zwei lokale Provider-Mock-Lanes:

- `mock-openai` ist der szenariobewusste OpenClaw-Mock. Er bleibt die standardmäßige deterministische Mock-Lane für repo-gestützte QA und Paritäts-Gates.
- `aimock` startet einen AIMock-gestützten Provider-Server für experimentelle Protokoll-, Fixture-, Record/Replay- und Chaos-Abdeckung. Er ist additiv und ersetzt den Szenario-Dispatcher `mock-openai` nicht.

Die Implementierung der Provider-Lanes liegt unter `extensions/qa-lab/src/providers/`. Jeder Provider besitzt seine Defaults, den Start des lokalen Servers, die Gateway-Modellkonfiguration, Anforderungen an das Auth-Profile-Staging sowie Live-/Mock-Capability-Flags. Gemeinsamer Suite- und Gateway-Code sollte über die Provider-Registry routen, anstatt nach Provider-Namen zu verzweigen.

## Transport-Adapter

`qa-lab` besitzt eine generische Transport-Nahtstelle für Markdown-QA-Szenarien. `qa-channel` ist der erste Adapter auf dieser Nahtstelle, aber das Entwurfsziel ist breiter: Künftige echte oder synthetische Kanäle sollten sich in denselben Suite-Runner einklinken, anstatt einen transportspezifischen QA-Runner hinzuzufügen.

Auf Architekturebene ist die Aufteilung:

- `qa-lab` besitzt generische Szenarioausführung, Worker-Parallelität, Artefaktschreiben und Reporting.
- Der Transport-Adapter besitzt Gateway-Konfiguration, Bereitschaft, eingehende und ausgehende Beobachtung, Transport-Aktionen und normalisierten Transportzustand.
- Markdown-Szenariodateien unter `qa/scenarios/` definieren den Testlauf; `qa-lab` stellt die wiederverwendbare Runtime-Oberfläche bereit, die sie ausführt.

### Kanal hinzufügen

Das Hinzufügen eines Kanals zum Markdown-QA-System erfordert genau zwei Dinge:

1. Einen Transport-Adapter für den Kanal.
2. Ein Szenariopaket, das den Kanalvertrag testet.

Fügen Sie keinen neuen QA-Befehl auf oberster Ebene hinzu, wenn der gemeinsame Host `qa-lab` den Flow besitzen kann.

`qa-lab` besitzt die gemeinsamen Host-Mechaniken:

- den Befehls-Root `openclaw qa`
- Start und Teardown der Suite
- Worker-Parallelität
- Artefaktschreiben
- Berichtserzeugung
- Szenarioausführung
- Kompatibilitätsaliase für ältere `qa-channel`-Szenarien

Runner-Plugins besitzen den Transportvertrag:

- wie `openclaw qa <runner>` unter dem gemeinsamen Root `qa` eingehängt wird
- wie das Gateway für diesen Transport konfiguriert wird
- wie Bereitschaft geprüft wird
- wie eingehende Events injiziert werden
- wie ausgehende Nachrichten beobachtet werden
- wie Transkripte und normalisierter Transportzustand bereitgestellt werden
- wie transportgestützte Aktionen ausgeführt werden
- wie transportspezifisches Zurücksetzen oder Bereinigen gehandhabt wird

Die Mindestanforderungen für die Einführung eines neuen Kanals:

1. Behalten Sie `qa-lab` als Owner des gemeinsamen Roots `qa`.
2. Implementieren Sie den Transport-Runner auf der gemeinsamen Host-Nahtstelle von `qa-lab`.
3. Halten Sie transportspezifische Mechaniken im Runner-Plugin oder Channel-Harness.
4. Hängen Sie den Runner als `openclaw qa <runner>` ein, anstatt einen konkurrierenden Root-Befehl zu registrieren. Runner-Plugins sollten `qaRunners` in `openclaw.plugin.json` deklarieren und ein passendes Array `qaRunnerCliRegistrations` aus `runtime-api.ts` exportieren. Halten Sie `runtime-api.ts` schlank; Lazy-CLI und Runner-Ausführung sollten hinter separaten Entrypoints bleiben.
5. Erstellen oder adaptieren Sie Markdown-Szenarien unter den thematischen Verzeichnissen `qa/scenarios/`.
6. Verwenden Sie die generischen Szenario-Helper für neue Szenarien.
7. Halten Sie bestehende Kompatibilitätsaliase funktionsfähig, es sei denn, das Repo führt eine beabsichtigte Migration durch.

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

Kompatibilitätsaliase bleiben für bestehende Szenarien verfügbar — `waitForQaChannelReady`, `waitForOutboundMessage`, `waitForNoOutbound`, `formatConversationTranscript`, `resetBus` — aber beim Erstellen neuer Szenarien sollten die generischen Namen verwendet werden. Die Aliase existieren, um eine erzwungene Stichtagsmigration zu vermeiden, nicht als künftiges Modell.

## Reporting

`qa-lab` exportiert einen Markdown-Protokollbericht aus der beobachteten Bus-Timeline.
Der Bericht sollte beantworten:

- Was funktioniert hat
- Was fehlgeschlagen ist
- Was blockiert geblieben ist
- Welche Folgeszenarien sinnvoll ergänzt werden sollten

Für das Inventar verfügbarer Szenarien — nützlich beim Abschätzen von Folgearbeiten oder beim Verdrahten eines neuen Transports — führen Sie `pnpm openclaw qa coverage` aus (fügen Sie `--json` für maschinenlesbare Ausgabe hinzu).

Für Zeichen- und Stilprüfungen führen Sie dasselbe Szenario mit mehreren Live-Modell-Refs aus und schreiben Sie einen bewerteten Markdown-Bericht:

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

Der Befehl führt lokale untergeordnete QA-Gateway-Prozesse aus, nicht Docker. Charakter-Evaluierungsszenarien sollten die Persona über `SOUL.md` festlegen und dann normale Benutzereingaben wie Chat, Workspace-Hilfe und kleine Dateiaufgaben ausführen. Dem Kandidatenmodell sollte nicht mitgeteilt werden, dass es evaluiert wird. Der Befehl bewahrt jedes vollständige Transkript auf, zeichnet grundlegende Laufstatistiken auf und bittet dann die Judge-Modelle im schnellen Modus mit `xhigh`-Reasoning, sofern unterstützt, die Läufe nach Natürlichkeit, Atmosphäre und Humor zu bewerten.
Verwenden Sie `--blind-judge-models` beim Vergleich von Providern: Der Judge-Prompt erhält weiterhin jedes Transkript und jeden Laufstatus, aber Kandidatenreferenzen werden durch neutrale Labels wie `candidate-01` ersetzt; der Bericht ordnet die Ranglisten nach dem Parsen wieder den echten Referenzen zu.
Kandidatenläufe verwenden standardmäßig `high` Thinking, mit `medium` für GPT-5.5 und `xhigh` für ältere OpenAI-Evaluierungsreferenzen, die dies unterstützen. Überschreiben Sie einen bestimmten Kandidaten inline mit `--model provider/model,thinking=<level>`. `--thinking <level>` legt weiterhin einen globalen Fallback fest, und die ältere Form `--model-thinking <provider/model=level>` bleibt aus Kompatibilitätsgründen erhalten.
OpenAI-Kandidatenreferenzen verwenden standardmäßig den schnellen Modus, sodass Prioritätsverarbeitung genutzt wird, wenn der Provider sie unterstützt. Fügen Sie inline `,fast`, `,no-fast` oder `,fast=false` hinzu, wenn ein einzelner Kandidat oder Judge eine Überschreibung benötigt. Übergeben Sie `--fast` nur, wenn Sie den schnellen Modus für jedes Kandidatenmodell erzwingen möchten. Die Dauer von Kandidaten- und Judge-Läufen wird für die Benchmark-Analyse im Bericht aufgezeichnet, aber die Judge-Prompts weisen ausdrücklich an, nicht nach Geschwindigkeit zu bewerten.
Kandidaten- und Judge-Modellläufe verwenden beide standardmäßig eine Parallelität von 16. Senken Sie `--concurrency` oder `--judge-concurrency`, wenn Provider-Limits oder lokaler Gateway-Druck einen Lauf zu verrauscht machen.
Wenn kein Kandidaten-`--model` übergeben wird, verwendet die Charakter-Evaluierung standardmäßig
`openai/gpt-5.5`, `openai/gpt-5.2`, `openai/gpt-5`, `anthropic/claude-opus-4-6`,
`anthropic/claude-sonnet-4-6`, `zai/glm-5.1`,
`moonshot/kimi-k2.5` und
`google/gemini-3.1-pro-preview`, wenn kein `--model` übergeben wird.
Wenn kein `--judge-model` übergeben wird, verwenden die Judges standardmäßig
`openai/gpt-5.5,thinking=xhigh,fast` und
`anthropic/claude-opus-4-6,thinking=high`.

## Verwandte Dokumentation

- [Matrix-QA](/de/concepts/qa-matrix)
- [QA-Kanal](/de/channels/qa-channel)
- [Tests](/de/help/testing)
- [Dashboard](/de/web/dashboard)
