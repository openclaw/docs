---
read_when:
    - Verstehen, wie der QA-Stack zusammenhängt
    - qa-lab, qa-channel oder einen Transportadapter erweitern
    - Repo-gestützte QA-Szenarien hinzufügen
    - Aufbau realistischerer QA-Automatisierung rund um das Gateway-Dashboard
summary: 'Überblick über den QA-Stack: qa-lab, qa-channel, repositorygestützte Szenarien, Live-Transport-Lanes, Transportadapter und Berichterstellung.'
title: QA-Übersicht
x-i18n:
    generated_at: "2026-05-04T06:42:07Z"
    model: gpt-5.5
    provider: openai
    source_hash: 067f5aa0831724659ae36d548ef2e7bd28b40aad9cef45f325a01a2748003b29
    source_path: concepts/qa-e2e-automation.md
    workflow: 16
---

Der private QA-Stack soll OpenClaw auf realistischere,
channel-ähnliche Weise testen, als es ein einzelner Unit-Test kann.

Aktuelle Komponenten:

- `extensions/qa-channel`: synthetischer Nachrichtenkanal mit DM-, Kanal-, Thread-,
  Reaktions-, Bearbeitungs- und Löschflächen.
- `extensions/qa-lab`: Debugger-UI und QA-Bus zum Beobachten des Transkripts,
  Einspeisen eingehender Nachrichten und Exportieren eines Markdown-Berichts.
- `extensions/qa-matrix`, künftige Runner-Plugins: Live-Transport-Adapter, die
  einen echten Kanal innerhalb eines untergeordneten QA-Gateway steuern.
- `qa/`: repository-gestützte Seed-Assets für die Kickoff-Aufgabe und Baseline-QA-
  Szenarien.
- [Mantis](/de/concepts/mantis): Vorher- und Nachher-Live-Verifizierung für Bugs, die
  echte Transporte, Browser-Screenshots, VM-Status und PR-Nachweise benötigen.

## Befehlsoberfläche

Jeder QA-Flow läuft unter `pnpm openclaw qa <subcommand>`. Viele haben `pnpm qa:*`-
Skript-Aliase; beide Formen werden unterstützt.

| Befehl                                             | Zweck                                                                                                                                                                                      |
| --------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `qa run`                                            | Gebündelter QA-Selbsttest; schreibt einen Markdown-Bericht.                                                                                                                                 |
| `qa suite`                                          | Führt repository-gestützte Szenarien gegen die QA-Gateway-Lane aus. Aliase: `pnpm openclaw qa suite --runner multipass` für eine kurzlebige Linux-VM.                                      |
| `qa coverage`                                       | Gibt das Markdown-Inventar der Szenarioabdeckung aus (`--json` für maschinenlesbare Ausgabe).                                                                                              |
| `qa parity-report`                                  | Vergleicht zwei `qa-suite-summary.json`-Dateien und schreibt den agentischen Paritätsbericht.                                                                                               |
| `qa character-eval`                                 | Führt das Charakter-QA-Szenario über mehrere Live-Modelle hinweg mit bewertetem Bericht aus. Siehe [Berichterstattung](#reporting).                                                        |
| `qa manual`                                         | Führt einen einmaligen Prompt gegen die ausgewählte Provider-/Modell-Lane aus.                                                                                                              |
| `qa ui`                                             | Startet die QA-Debugger-UI und den lokalen QA-Bus (Alias: `pnpm qa:lab:ui`).                                                                                                                |
| `qa docker-build-image`                             | Baut das vorgefertigte QA-Docker-Image.                                                                                                                                                     |
| `qa docker-scaffold`                                | Schreibt ein docker-compose-Gerüst für das QA-Dashboard und die Gateway-Lane.                                                                                                               |
| `qa up`                                             | Baut die QA-Site, startet den Docker-gestützten Stack und gibt die URL aus (Alias: `pnpm qa:lab:up`; die Variante `:fast` ergänzt `--use-prebuilt-image --bind-ui-dist --skip-ui-build`).   |
| `qa aimock`                                         | Startet nur den AIMock-Provider-Server.                                                                                                                                                     |
| `qa mock-openai`                                    | Startet nur den szenariobewussten `mock-openai`-Provider-Server.                                                                                                                           |
| `qa credentials doctor` / `add` / `list` / `remove` | Verwaltet den gemeinsam genutzten Convex-Anmeldedatenpool.                                                                                                                                  |
| `qa matrix`                                         | Live-Transport-Lane gegen einen kurzlebigen Tuwunel-Homeserver. Siehe [Matrix-QA](/de/concepts/qa-matrix).                                                                                    |
| `qa telegram`                                       | Live-Transport-Lane gegen eine echte private Telegram-Gruppe.                                                                                                                               |
| `qa discord`                                        | Live-Transport-Lane gegen einen echten privaten Discord-Guild-Kanal.                                                                                                                        |
| `qa slack`                                          | Live-Transport-Lane gegen einen echten privaten Slack-Kanal.                                                                                                                                |
| `qa mantis`                                         | Vorher- und Nachher-Verifizierungs-Runner für Live-Transport-Bugs, mit Discord-Statusreaktionsnachweisen, Crabbox-Desktop-/Browser-Smoke und Slack-in-VNC-Smoke. Siehe [Mantis](/de/concepts/mantis). |

## Operator-Flow

Der aktuelle QA-Operator-Flow ist eine zweigeteilte QA-Site:

- Links: Gateway-Dashboard (Control UI) mit dem Agenten.
- Rechts: QA Lab, mit dem Slack-artigen Transkript und dem Szenarioplan.

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

`qa:lab:up:fast` hält die Docker-Dienste auf einem vorgefertigten Image und bind-mountet
`extensions/qa-lab/web/dist` in den `qa-lab`-Container. `qa:lab:watch`
baut dieses Bundle bei Änderungen neu, und der Browser lädt automatisch neu, wenn sich der
Asset-Hash von QA Lab ändert.

Für einen lokalen OpenTelemetry-Trace-Smoke führen Sie Folgendes aus:

```bash
pnpm qa:otel:smoke
```

Dieses Skript startet einen lokalen OTLP/HTTP-Trace-Empfänger, führt das
QA-Szenario `otel-trace-smoke` mit aktiviertem Plugin `diagnostics-otel` aus,
dekodiert anschließend die exportierten Protobuf-Spans und prüft die release-kritische Form:
`openclaw.run`, `openclaw.harness.run`, `openclaw.model.call`,
`openclaw.context.assembled` und `openclaw.message.delivery` müssen vorhanden sein;
Modellaufrufe dürfen bei erfolgreichen Turns kein `StreamAbandoned` exportieren; rohe Diagnose-IDs und
`openclaw.content.*`-Attribute müssen aus dem Trace herausbleiben. Es schreibt
`otel-smoke-summary.json` neben die QA-Suite-Artefakte.

Observability-QA bleibt nur für Source-Checkouts verfügbar. Der npm-Tarball lässt
QA Lab absichtlich aus, daher führen Docker-Package-Release-Lanes keine `qa`-Befehle aus. Verwenden Sie
`pnpm qa:otel:smoke` aus einem gebauten Source-Checkout heraus, wenn Sie die Diagnose-
Instrumentierung ändern.

Für eine transport-echte Matrix-Smoke-Lane führen Sie Folgendes aus:

```bash
pnpm openclaw qa matrix --profile fast --fail-fast
```

Die vollständige CLI-Referenz, der Profil-/Szenariokatalog, die Env-Vars und das Artefaktlayout für diese Lane befinden sich in [Matrix-QA](/de/concepts/qa-matrix). Kurzüberblick: Sie stellt einen kurzlebigen Tuwunel-Homeserver in Docker bereit, registriert temporäre Driver-/SUT-/Observer-Benutzer, führt das echte Matrix-Plugin innerhalb eines untergeordneten QA-Gateway aus, das auf diesen Transport beschränkt ist (kein `qa-channel`), und schreibt anschließend einen Markdown-Bericht, eine JSON-Zusammenfassung, ein Artefakt mit beobachteten Ereignissen und ein kombiniertes Ausgabelog unter `.artifacts/qa-e2e/matrix-<timestamp>/`.

Für transport-echte Telegram-, Discord- und Slack-Smoke-Lanes:

```bash
pnpm openclaw qa telegram
pnpm openclaw qa discord
pnpm openclaw qa slack
```

Sie zielen auf einen bereits vorhandenen echten Kanal mit zwei Bots (Driver + SUT). Erforderliche Env-Vars, Szenariolisten, Ausgabeartefakte und der Convex-Anmeldedatenpool sind unten in der [QA-Referenz für Telegram, Discord und Slack](#telegram-discord-and-slack-qa-reference) dokumentiert.

Für einen vollständigen Slack-Desktop-VM-Lauf mit VNC-Rettung führen Sie Folgendes aus:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

Dieser Befehl least eine Crabbox-Desktop-/Browser-Maschine, führt die Slack-Live-Lane
innerhalb der VM aus, öffnet Slack Web im VNC-Browser, erfasst den Desktop und
kopiert `slack-qa/` sowie `slack-desktop-smoke.png` zurück in das Mantis-Artefakt-
verzeichnis. Verwenden Sie `--lease-id <cbx_...>` erneut, nachdem Sie sich manuell
über VNC bei Slack Web angemeldet haben. Mit `--gateway-setup` lässt Mantis ein
persistentes OpenClaw-Slack-Gateway innerhalb der VM auf Port `38973` laufen; ohne diese Option führt der Befehl die
normale Bot-zu-Bot-Slack-QA-Lane aus und beendet sich nach der Artefakterfassung.

Bevor Sie gepoolte Live-Anmeldedaten verwenden, führen Sie Folgendes aus:

```bash
pnpm openclaw qa credentials doctor
```

Der Doctor prüft die Convex-Broker-Umgebung, validiert Endpoint-Einstellungen und verifiziert die Erreichbarkeit von Admin/List, wenn das Maintainer-Secret vorhanden ist. Für Secrets meldet er nur den Status gesetzt/fehlend.

## Live-Transport-Abdeckung

Live-Transport-Lanes teilen sich einen Vertrag, statt dass jede ihre eigene Form für Szenariolisten erfindet. `qa-channel` ist die breite synthetische Suite für Produktverhalten und gehört nicht zur Live-Transport-Abdeckungsmatrix.

| Lane     | Canary | Mention-Gating | Bot-zu-Bot | Allowlist-Block | Top-Level-Antwort | Neustart-Fortsetzung | Thread-Follow-up | Thread-Isolation | Reaktionsbeobachtung | Hilfebefehl | Native Befehlsregistrierung |
| -------- | ------ | -------------- | ---------- | --------------- | --------------- | -------------- | ---------------- | ---------------- | -------------------- | ------------ | --------------------------- |
| Matrix   | x      | x              | x          | x               | x               | x              | x                | x                | x                    |              |                             |
| Telegram | x      | x              | x          |                 |                 |                |                  |                  |                      | x            |                             |
| Discord  | x      | x              | x          |                 |                 |                |                  |                  |                      |              | x                           |
| Slack    | x      | x              | x          |                 |                 |                |                  |                  |                      |              |                             |

So bleibt `qa-channel` die breite Suite für Produktverhalten, während Matrix,
Telegram und künftige Live-Transporte eine gemeinsame explizite Checkliste für den Transportvertrag
teilen.

Für eine kurzlebige Linux-VM-Lane ohne Docker in den QA-Pfad einzubeziehen, führen Sie Folgendes aus:

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

Dies startet einen frischen Multipass-Gast, installiert Abhängigkeiten, baut OpenClaw
im Gast, führt `qa suite` aus und kopiert dann den normalen QA-Bericht und die
Zusammenfassung zurück nach `.artifacts/qa-e2e/...` auf dem Host.
Es verwendet dasselbe Verhalten für die Szenarioauswahl wie `qa suite` auf dem Host.
Host- und Multipass-Suite-Läufe führen standardmäßig mehrere ausgewählte Szenarien parallel
mit isolierten Gateway-Workern aus. `qa-channel` verwendet standardmäßig eine Nebenläufigkeit
von 4, begrenzt durch die Anzahl der ausgewählten Szenarien. Verwenden Sie `--concurrency <count>`,
um die Anzahl der Worker anzupassen, oder `--concurrency 1` für serielle Ausführung.
Der Befehl beendet sich mit einem Nicht-Null-Code, wenn ein Szenario fehlschlägt. Verwenden Sie
`--allow-failures`, wenn Sie Artefakte ohne fehlschlagenden Exit-Code erhalten möchten.
Live-Läufe leiten die unterstützten QA-Authentifizierungseingaben weiter, die für den
Gast praktikabel sind: env-basierte Provider-Schlüssel, den Pfad zur QA-Live-Provider-Konfiguration und
`CODEX_HOME`, wenn vorhanden. Belassen Sie `--output-dir` unterhalb des Repo-Roots, damit der Gast
über den eingehängten Arbeitsbereich zurückschreiben kann.

## Referenz für Telegram-, Discord- und Slack-QA

Matrix hat wegen seiner Szenarioanzahl und der Docker-gestützten Homeserver-Bereitstellung eine [eigene Seite](/de/concepts/qa-matrix). Telegram, Discord und Slack sind kleiner: jeweils eine Handvoll Szenarien, kein Profilsystem, gegen bereits vorhandene echte Kanäle. Daher befindet sich ihre Referenz hier.

### Gemeinsame CLI-Flags

Diese Lanes registrieren sich über `extensions/qa-lab/src/live-transports/shared/live-transport-cli.ts` und akzeptieren dieselben Flags:

| Flag                                  | Standard                                                        | Beschreibung                                                                                                               |
| ------------------------------------- | --------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `--scenario <id>`                     | —                                                               | Nur dieses Szenario ausführen. Wiederholbar.                                                                               |
| `--output-dir <path>`                 | `<repo>/.artifacts/qa-e2e/{telegram,discord,slack}-<timestamp>` | Ort, an den Berichte/Zusammenfassung/beobachtete Nachrichten und das Ausgabelog geschrieben werden. Relative Pfade werden relativ zu `--repo-root` aufgelöst. |
| `--repo-root <path>`                  | `process.cwd()`                                                 | Repository-Root beim Aufruf aus einem neutralen Arbeitsverzeichnis.                                                        |
| `--sut-account <id>`                  | `sut`                                                           | Temporäre Konto-ID innerhalb der QA-Gateway-Konfiguration.                                                                 |
| `--provider-mode <mode>`              | `live-frontier`                                                 | `mock-openai` oder `live-frontier` (das ältere `live-openai` funktioniert weiterhin).                                      |
| `--model <ref>` / `--alt-model <ref>` | Provider-Standard                                               | Primäre/alternative Modell-Refs.                                                                                           |
| `--fast`                              | aus                                                             | Schneller Provider-Modus, sofern unterstützt.                                                                              |
| `--credential-source <env\|convex>`   | `env`                                                           | Siehe [Convex-Anmeldeinformationspool](#convex-credential-pool).                                                           |
| `--credential-role <maintainer\|ci>`  | `ci` in CI, andernfalls `maintainer`                            | Rolle, die bei `--credential-source convex` verwendet wird.                                                                |

Jede Lane beendet sich bei einem fehlgeschlagenen Szenario mit einem Nicht-Null-Code. `--allow-failures` schreibt Artefakte, ohne einen fehlschlagenden Exit-Code zu setzen.

### Telegram-QA

```bash
pnpm openclaw qa telegram
```

Zielt auf eine echte private Telegram-Gruppe mit zwei unterschiedlichen Bots (Treiber + SUT). Der SUT-Bot muss einen Telegram-Benutzernamen haben; Bot-zu-Bot-Beobachtung funktioniert am besten, wenn beide Bots in `@BotFather` den **Bot-to-Bot Communication Mode** aktiviert haben.

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
- `telegram-qa-summary.json` — enthält RTT pro Antwort (Treibersendung → beobachtete SUT-Antwort), beginnend mit dem Canary.
- `telegram-qa-observed-messages.json` — Texte geschwärzt, außer `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1`.

### Discord-QA

```bash
pnpm openclaw qa discord
```

Zielt auf einen echten privaten Discord-Guild-Kanal mit zwei Bots: einen vom Harness gesteuerten Treiber-Bot und einen SUT-Bot, der vom untergeordneten OpenClaw-Gateway über das gebündelte Discord-Plugin gestartet wird. Prüft die Verarbeitung von Kanal-Erwähnungen, dass der SUT-Bot den nativen `/help`-Befehl bei Discord registriert hat, sowie optionale Mantis-Beweisszenarien.

Erforderliche env bei `--credential-source env`:

- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID` — muss mit der von Discord zurückgegebenen Benutzer-ID des SUT-Bots übereinstimmen (andernfalls schlägt die Lane früh fehl).

Optional:

- `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1` behält Nachrichtentexte in Artefakten mit beobachteten Nachrichten bei.

Szenarien (`extensions/qa-lab/src/live-transports/discord/discord-live.runtime.ts:36`):

- `discord-canary`
- `discord-mention-gating`
- `discord-native-help-command-registration`
- `discord-status-reactions-tool-only` — optionales Mantis-Szenario. Läuft für sich allein, weil es den SUT auf immer aktive, reine Tool-Guild-Antworten mit `messages.statusReactions.enabled=true` umschaltet und dann eine REST-Reaktions-Timeline plus ein visuelles HTML/PNG-Artefakt erfasst.

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

Zielt auf einen echten privaten Slack-Kanal mit zwei unterschiedlichen Bots: einen vom Harness gesteuerten Treiber-Bot und einen SUT-Bot, der vom untergeordneten OpenClaw-Gateway über das gebündelte Slack-Plugin gestartet wird.

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

### Convex-Anmeldeinformationspool

Telegram-, Discord- und Slack-Lanes können Anmeldeinformationen aus einem gemeinsamen Convex-Pool leasen, statt die obigen env vars zu lesen. Übergeben Sie `--credential-source convex` (oder setzen Sie `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`); QA Lab erwirbt einen exklusiven Lease, sendet während des Laufs Heartbeats dafür und gibt ihn beim Herunterfahren frei. Pool-Arten sind `"telegram"`, `"discord"` und `"slack"`.

Payload-Formen, die der Broker bei `admin/add` validiert:

- Telegram (`kind: "telegram"`): `{ groupId: string, driverToken: string, sutToken: string }` — `groupId` muss ein numerischer Chat-ID-String sein.
- Discord (`kind: "discord"`): `{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string }`.

Betriebliche env vars und der Vertrag des Convex-Broker-Endpunkts befinden sich unter [Testing → Gemeinsame Telegram-Anmeldeinformationen über Convex](/de/help/testing#shared-telegram-credentials-via-convex-v1) (der Abschnittsname stammt aus der Zeit vor der Discord-Unterstützung; die Broker-Semantik ist für beide Arten identisch).

## Repo-gestützte Seeds

Seed-Assets befinden sich in `qa/`:

- `qa/scenarios/index.md`
- `qa/scenarios/<theme>/*.md`

Diese liegen absichtlich in Git, damit der QA-Plan sowohl für Menschen als auch für den
Agent sichtbar ist.

`qa-lab` sollte ein generischer Markdown-Runner bleiben. Jede Szenario-Markdown-Datei ist
die Quelle der Wahrheit für einen Testlauf und sollte Folgendes definieren:

- Szenario-Metadaten
- optionale Kategorie-, Capability-, Lane- und Risikometadaten
- Docs- und Code-Refs
- optionale Plugin-Anforderungen
- optionaler Gateway-Konfigurationspatch
- den ausführbaren `qa-flow`

Die wiederverwendbare Laufzeitoberfläche, die `qa-flow` unterstützt, darf generisch
und querschnittlich bleiben. Beispielsweise können Markdown-Szenarien transportseitige
Hilfsfunktionen mit browserseitigen Hilfsfunktionen kombinieren, die die eingebettete Control UI über den
Gateway-`browser.request`-Seam steuern, ohne einen Sonderfall-Runner hinzuzufügen.

Szenariodateien sollten nach Produkt-Capability gruppiert werden, nicht nach Source-Tree-Ordner. Halten Sie Szenario-IDs stabil, wenn Dateien verschoben werden; verwenden Sie `docsRefs` und `codeRefs` für Implementierungsnachverfolgbarkeit.

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

- `mock-openai` ist der szenariobewusste OpenClaw-Mock. Er bleibt die standardmäßige
  deterministische Mock-Lane für repo-gestützte QA und Parity-Gates.
- `aimock` startet einen AIMock-gestützten Provider-Server für experimentelle Protokoll-,
  Fixture-, Record/Replay- und Chaos-Abdeckung. Er ist additiv und ersetzt nicht
  den `mock-openai`-Szenario-Dispatcher.

Die Implementierung der Provider-Lanes befindet sich unter `extensions/qa-lab/src/providers/`.
Jeder Provider besitzt seine Defaults, den Start des lokalen Servers, die Gateway-Modellkonfiguration,
Staging-Anforderungen für Authentifizierungsprofile und Live-/Mock-Capability-Flags. Gemeinsamer Suite- und
Gateway-Code sollte über die Provider-Registry routen, statt nach
Provider-Namen zu verzweigen.

## Transportadapter

`qa-lab` besitzt einen generischen Transport-Seam für Markdown-QA-Szenarien. `qa-channel` ist der erste Adapter an diesem Seam, aber das Entwurfsziel ist breiter: Künftige echte oder synthetische Kanäle sollten sich in denselben Suite-Runner einklinken, statt einen transportspezifischen QA-Runner hinzuzufügen.

Auf Architekturebene ist die Aufteilung:

- `qa-lab` besitzt generische Szenarioausführung, Worker-Nebenläufigkeit, Artefaktschreiben und Reporting.
- Der Transportadapter besitzt Gateway-Konfiguration, Bereitschaft, eingehende und ausgehende Beobachtung, Transportaktionen und normalisierten Transportzustand.
- Markdown-Szenariodateien unter `qa/scenarios/` definieren den Testlauf; `qa-lab` stellt die wiederverwendbare Laufzeitoberfläche bereit, die sie ausführt.

### Einen Kanal hinzufügen

Das Hinzufügen eines Kanals zum Markdown-QA-System erfordert genau zwei Dinge:

1. Einen Transportadapter für den Kanal.
2. Ein Szenariopaket, das den Kanalvertrag ausübt.

Fügen Sie keinen neuen Top-Level-QA-Befehls-Root hinzu, wenn der gemeinsame `qa-lab`-Host den Flow besitzen kann.

`qa-lab` ist für die gemeinsamen Host-Mechaniken zuständig:

- die Befehlswurzel `openclaw qa`
- Start und Teardown der Suite
- Worker-Parallelität
- Schreiben von Artefakten
- Berichtserstellung
- Szenarioausführung
- Kompatibilitätsaliasse für ältere `qa-channel`-Szenarien

Runner-Plugins sind für den Transportvertrag zuständig:

- wie `openclaw qa <runner>` unterhalb der gemeinsamen `qa`-Wurzel eingebunden wird
- wie der Gateway für diesen Transport konfiguriert wird
- wie Bereitschaft geprüft wird
- wie eingehende Events injiziert werden
- wie ausgehende Nachrichten beobachtet werden
- wie Transkripte und normalisierter Transportzustand offengelegt werden
- wie transportgestützte Aktionen ausgeführt werden
- wie transportspezifisches Zurücksetzen oder Bereinigen behandelt wird

Die Mindestanforderungen für die Einführung eines neuen Kanals:

1. Behalten Sie `qa-lab` als Owner der gemeinsamen `qa`-Wurzel bei.
2. Implementieren Sie den Transport-Runner auf der gemeinsamen Host-Naht von `qa-lab`.
3. Behalten Sie transportspezifische Mechaniken im Runner-Plugin oder Channel-Harness.
4. Binden Sie den Runner als `openclaw qa <runner>` ein, statt einen konkurrierenden Root-Befehl zu registrieren. Runner-Plugins sollten `qaRunners` in `openclaw.plugin.json` deklarieren und ein passendes `qaRunnerCliRegistrations`-Array aus `runtime-api.ts` exportieren. Halten Sie `runtime-api.ts` schlank; Lazy-CLI und Runner-Ausführung sollten hinter separaten Einstiegspunkten bleiben.
5. Erstellen oder adaptieren Sie Markdown-Szenarien unter den thematisch gegliederten `qa/scenarios/`-Verzeichnissen.
6. Verwenden Sie die generischen Szenario-Helfer für neue Szenarien.
7. Halten Sie vorhandene Kompatibilitätsaliasse funktionsfähig, sofern das Repo keine absichtliche Migration durchführt.

Die Entscheidungsregel ist strikt:

- Wenn Verhalten einmalig in `qa-lab` ausgedrückt werden kann, platzieren Sie es in `qa-lab`.
- Wenn Verhalten von einem Channel-Transport abhängt, behalten Sie es in diesem Runner-Plugin oder Plugin-Harness.
- Wenn ein Szenario eine neue Fähigkeit benötigt, die mehr als ein Channel verwenden kann, fügen Sie einen generischen Helfer hinzu statt eines channelspezifischen Zweigs in `suite.ts`.
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

Kompatibilitätsaliasse bleiben für vorhandene Szenarien verfügbar — `waitForQaChannelReady`, `waitForOutboundMessage`, `waitForNoOutbound`, `formatConversationTranscript`, `resetBus` — aber neue Szenarien sollten die generischen Namen verwenden. Die Aliasse existieren, um eine Flag-Day-Migration zu vermeiden, nicht als Modell für die Zukunft.

## Berichterstattung

`qa-lab` exportiert einen Markdown-Protokollbericht aus der beobachteten Bus-Zeitleiste.
Der Bericht sollte beantworten:

- Was funktioniert hat
- Was fehlgeschlagen ist
- Was blockiert geblieben ist
- Welche Folgeszenarien ergänzt werden sollten

Für das Inventar der verfügbaren Szenarien — nützlich beim Dimensionieren von Folgearbeiten oder beim Verdrahten eines neuen Transports — führen Sie `pnpm openclaw qa coverage` aus (fügen Sie `--json` für maschinenlesbare Ausgabe hinzu).

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

Der Befehl führt lokale QA-Gateway-Child-Prozesse aus, nicht Docker. Character-Eval-Szenarien sollten die Persona über `SOUL.md` setzen und dann normale Benutzer-Turns ausführen, etwa Chat, Workspace-Hilfe und kleine Dateiaufgaben. Dem Kandidatenmodell sollte nicht mitgeteilt werden, dass es evaluiert wird. Der Befehl bewahrt jedes vollständige Transkript auf, zeichnet grundlegende Laufstatistiken auf und bittet dann die Judge-Modelle im schnellen Modus mit `xhigh`-Reasoning, soweit unterstützt, die Läufe nach Natürlichkeit, Vibe und Humor zu bewerten.
Verwenden Sie `--blind-judge-models`, wenn Sie Provider vergleichen: Der Judge-Prompt erhält weiterhin jedes Transkript und jeden Laufstatus, aber Kandidaten-Refs werden durch neutrale Labels wie `candidate-01` ersetzt; der Bericht ordnet die Rankings nach dem Parsen wieder den echten Refs zu.
Kandidatenläufe verwenden standardmäßig `high`-Thinking, mit `medium` für GPT-5.5 und `xhigh` für ältere OpenAI-Eval-Refs, die es unterstützen. Überschreiben Sie einen bestimmten Kandidaten inline mit `--model provider/model,thinking=<level>`. `--thinking <level>` setzt weiterhin einen globalen Fallback, und die ältere Form `--model-thinking <provider/model=level>` bleibt aus Kompatibilitätsgründen erhalten.
OpenAI-Kandidaten-Refs verwenden standardmäßig den schnellen Modus, damit Priority Processing genutzt wird, sofern der Provider es unterstützt. Fügen Sie inline `,fast`, `,no-fast` oder `,fast=false` hinzu, wenn ein einzelner Kandidat oder Judge eine Überschreibung benötigt. Übergeben Sie `--fast` nur, wenn Sie den schnellen Modus für jedes Kandidatenmodell erzwingen möchten. Kandidaten- und Judge-Dauern werden im Bericht für Benchmark-Analysen aufgezeichnet, aber Judge-Prompts sagen ausdrücklich, nicht nach Geschwindigkeit zu ranken.
Kandidaten- und Judge-Modellläufe verwenden beide standardmäßig Parallelität 16. Senken Sie `--concurrency` oder `--judge-concurrency`, wenn Provider-Limits oder lokaler Gateway-Druck einen Lauf zu verrauscht machen.
Wenn kein Kandidat `--model` übergeben wird, verwendet die Character-Eval standardmäßig `openai/gpt-5.5`, `openai/gpt-5.2`, `openai/gpt-5`, `anthropic/claude-opus-4-6`, `anthropic/claude-sonnet-4-6`, `zai/glm-5.1`, `moonshot/kimi-k2.5` und `google/gemini-3.1-pro-preview`, wenn kein `--model` übergeben wird.
Wenn kein `--judge-model` übergeben wird, verwenden die Judges standardmäßig `openai/gpt-5.5,thinking=xhigh,fast` und `anthropic/claude-opus-4-6,thinking=high`.

## Zugehörige Dokumentation

- [Matrix-QA](/de/concepts/qa-matrix)
- [QA Channel](/de/channels/qa-channel)
- [Testen](/de/help/testing)
- [Dashboard](/de/web/dashboard)
