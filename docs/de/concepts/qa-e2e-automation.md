---
read_when:
    - Verstehen, wie der QA-Stack zusammenwirkt
    - qa-lab, qa-channel oder einen Transportadapter erweitern
    - Repository-gestützte QA-Szenarien hinzufügen
    - Aufbau realitätsnäherer QA-Automatisierung für das Gateway-Dashboard
summary: 'Überblick über den QA-Stack: qa-lab, qa-channel, Repository-gestützte Szenarien, Live-Transportpfade, Transportadapter und Berichterstellung.'
title: QA-Überblick
x-i18n:
    generated_at: "2026-05-03T21:31:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6a1446fddb00855634d34662a0a47be1e5054a9e7bfed5bc9ae21185d87094d8
    source_path: concepts/qa-e2e-automation.md
    workflow: 16
---

Der private QA-Stack soll OpenClaw auf realistischere,
channel-orientierte Weise testen, als es ein einzelner Unit-Test kann.

Aktuelle Komponenten:

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

Jeder QA-Flow läuft unter `pnpm openclaw qa <subcommand>`. Viele haben `pnpm qa:*`-
Skript-Aliasse; beide Formen werden unterstützt.

| Befehl                                             | Zweck                                                                                                                                                                |
| --------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `qa run`                                            | Gebündelter QA-Selbsttest; schreibt einen Markdown-Bericht.                                                                                                                       |
| `qa suite`                                          | Führt repo-gestützte Szenarien gegen die QA-Gateway-Lane aus. Aliasse: `pnpm openclaw qa suite --runner multipass` für eine kurzlebige Linux-VM.                                 |
| `qa coverage`                                       | Gibt das Markdown-Inventar der Szenarioabdeckung aus (`--json` für maschinenlesbare Ausgabe).                                                                                          |
| `qa parity-report`                                  | Vergleicht zwei `qa-suite-summary.json`-Dateien und schreibt den agentischen Paritätsbericht.                                                                                         |
| `qa character-eval`                                 | Führt das Character-QA-Szenario über mehrere Live-Modelle mit bewertetem Bericht aus. Siehe [Berichterstattung](#reporting).                                                           |
| `qa manual`                                         | Führt einen einmaligen Prompt gegen die ausgewählte Provider-/Modell-Lane aus.                                                                                                         |
| `qa ui`                                             | Startet die QA-Debugger-UI und den lokalen QA-Bus (Alias: `pnpm qa:lab:ui`).                                                                                                   |
| `qa docker-build-image`                             | Baut das vorgefertigte QA-Docker-Image.                                                                                                                                    |
| `qa docker-scaffold`                                | Schreibt ein docker-compose-Gerüst für das QA-Dashboard und die Gateway-Lane.                                                                                                   |
| `qa up`                                             | Baut die QA-Site, startet den Docker-gestützten Stack und gibt die URL aus (Alias: `pnpm qa:lab:up`; die Variante `:fast` fügt `--use-prebuilt-image --bind-ui-dist --skip-ui-build` hinzu). |
| `qa aimock`                                         | Startet nur den AIMock-Provider-Server.                                                                                                                                 |
| `qa mock-openai`                                    | Startet nur den szenariobewussten `mock-openai`-Provider-Server.                                                                                                           |
| `qa credentials doctor` / `add` / `list` / `remove` | Verwaltet den gemeinsam genutzten Convex-Credential-Pool.                                                                                                                              |
| `qa matrix`                                         | Live-Transport-Lane gegen einen kurzlebigen Tuwunel-Homeserver. Siehe [Matrix-QA](/de/concepts/qa-matrix).                                                                     |
| `qa telegram`                                       | Live-Transport-Lane gegen eine echte private Telegram-Gruppe.                                                                                                             |
| `qa discord`                                        | Live-Transport-Lane gegen einen echten privaten Discord-Guild-Kanal.                                                                                                      |
| `qa mantis`                                         | Vorher- und Nachher-Verifizierungs-Runner für Live-Transport-Bugs, mit dem ersten Discord-Statusreaktionen-Szenario. Siehe [Mantis](/de/concepts/mantis).                        |

## Operator-Flow

Der aktuelle QA-Operator-Flow ist eine zweigeteilte QA-Site:

- Links: Gateway-Dashboard (Control UI) mit dem Agenten.
- Rechts: QA Lab mit dem Slack-artigen Transkript und dem Szenarioplan.

Führen Sie ihn aus mit:

```bash
pnpm qa:lab:up
```

Das baut die QA-Site, startet die Docker-gestützte Gateway-Lane und stellt die
QA-Lab-Seite bereit, auf der ein Operator oder eine Automatisierungsschleife dem Agenten eine QA-
Mission geben, echtes Kanalverhalten beobachten und aufzeichnen kann, was funktioniert,
fehlgeschlagen oder blockiert geblieben ist.

Für schnellere Iteration an der QA-Lab-UI ohne jedes Mal das Docker-Image neu zu bauen,
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

Dieses Skript startet einen lokalen OTLP/HTTP-Trace-Empfänger, führt das
QA-Szenario `otel-trace-smoke` mit aktiviertem `diagnostics-otel`-Plugin aus, dekodiert dann
die exportierten Protobuf-Spans und prüft die releasekritische Struktur:
`openclaw.run`, `openclaw.harness.run`, `openclaw.model.call`,
`openclaw.context.assembled` und `openclaw.message.delivery` müssen vorhanden sein;
Modellaufrufe dürfen bei erfolgreichen Turns kein `StreamAbandoned` exportieren; rohe Diagnose-IDs und
`openclaw.content.*`-Attribute müssen aus dem Trace herausgehalten werden. Es schreibt
`otel-smoke-summary.json` neben die QA-Suite-Artefakte.

Observability-QA bleibt auf Source-Checkouts beschränkt. Das npm-Tarball lässt
QA Lab absichtlich aus, daher führen Docker-Release-Lanes für Pakete keine `qa`-Befehle aus. Verwenden Sie
`pnpm qa:otel:smoke` aus einem gebauten Source-Checkout, wenn Sie Diagnose-
Instrumentation ändern.

Für eine transportechte Matrix-Smoke-Lane führen Sie aus:

```bash
pnpm openclaw qa matrix --profile fast --fail-fast
```

Die vollständige CLI-Referenz, der Profil-/Szenariokatalog, Env Vars und das Artefaktlayout für diese Lane stehen in [Matrix-QA](/de/concepts/qa-matrix). Kurz gesagt: Sie provisioniert einen kurzlebigen Tuwunel-Homeserver in Docker, registriert temporäre Driver-/SUT-/Observer-Benutzer, führt das echte Matrix-Plugin innerhalb eines untergeordneten QA-Gateway aus, das auf diesen Transport begrenzt ist (kein `qa-channel`), und schreibt dann einen Markdown-Bericht, eine JSON-Zusammenfassung, ein Artefakt mit beobachteten Ereignissen und ein kombiniertes Ausgabelog unter `.artifacts/qa-e2e/matrix-<timestamp>/`.

Für transportechte Telegram- und Discord-Smoke-Lanes:

```bash
pnpm openclaw qa telegram
pnpm openclaw qa discord
```

Beide zielen auf einen bereits vorhandenen echten Kanal mit zwei Bots (Driver + SUT). Erforderliche Env Vars, Szenariolisten, Ausgabeartefakte und der Convex-Credential-Pool sind unten in der [Telegram- und Discord-QA-Referenz](#telegram-and-discord-qa-reference) dokumentiert.

Bevor Sie gepoolte Live-Credentials verwenden, führen Sie aus:

```bash
pnpm openclaw qa credentials doctor
```

Der Doctor prüft die Convex-Broker-Umgebung, validiert Endpoint-Einstellungen und verifiziert die Erreichbarkeit von Admin/List, wenn das Maintainer-Secret vorhanden ist. Für Secrets meldet er nur den Status gesetzt/fehlend.

## Live-Transport-Abdeckung

Live-Transport-Lanes teilen sich einen Vertrag, statt dass jede ihre eigene Szenariolistenform erfindet. `qa-channel` ist die breite synthetische Suite für Produktverhalten und nicht Teil der Live-Transport-Abdeckungsmatrix.

| Lane     | Canary | Mention-Gating | Bot-zu-Bot | Allowlist-Block | Antwort auf oberster Ebene | Neustart-Fortsetzung | Thread-Follow-up | Thread-Isolation | Reaktionsbeobachtung | Hilfe-Befehl | Native Befehlsregistrierung |
| -------- | ------ | -------------- | ---------- | --------------- | --------------- | -------------- | ---------------- | ---------------- | -------------------- | ------------ | --------------------------- |
| Matrix   | x      | x              | x          | x               | x               | x              | x                | x                | x                    |              |                             |
| Telegram | x      | x              | x          |                 |                 |                |                  |                  |                      | x            |                             |
| Discord  | x      | x              | x          |                 |                 |                |                  |                  |                      |              | x                           |

Damit bleibt `qa-channel` die breite Suite für Produktverhalten, während Matrix,
Telegram und zukünftige Live-Transporte eine explizite gemeinsame Transport-Vertrags-
Checkliste teilen.

Für eine kurzlebige Linux-VM-Lane, ohne Docker in den QA-Pfad einzubeziehen, führen Sie aus:

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

Dies bootet einen frischen Multipass-Gast, installiert Abhängigkeiten, baut OpenClaw
im Gast, führt `qa suite` aus und kopiert dann den normalen QA-Bericht und die
Zusammenfassung zurück nach `.artifacts/qa-e2e/...` auf dem Host.
Es verwendet dasselbe Szenarioauswahlverhalten wie `qa suite` auf dem Host.
Host- und Multipass-Suite-Läufe führen standardmäßig mehrere ausgewählte Szenarien parallel
mit isolierten Gateway-Workern aus. `qa-channel` verwendet standardmäßig eine Parallelität
von 4, begrenzt durch die Anzahl der ausgewählten Szenarien. Verwenden Sie `--concurrency <count>`, um
die Worker-Anzahl anzupassen, oder `--concurrency 1` für serielle Ausführung.
Der Befehl beendet sich mit einem Nicht-Null-Code, wenn ein Szenario fehlschlägt. Verwenden Sie `--allow-failures`, wenn
Sie Artefakte ohne fehlschlagenden Exit-Code möchten.
Live-Läufe leiten die unterstützten QA-Auth-Eingaben weiter, die für den
Gast praktikabel sind: env-basierte Provider-Keys, den Pfad zur QA-Live-Provider-Konfiguration und
`CODEX_HOME`, wenn vorhanden. Belassen Sie `--output-dir` unterhalb des Repo-Root, damit der Gast
über den gemounteten Workspace zurückschreiben kann.

## Telegram- und Discord-QA-Referenz

Matrix hat wegen der Szenarioanzahl und der Docker-gestützten Homeserver-Provisionierung eine [eigene Seite](/de/concepts/qa-matrix). Telegram und Discord sind kleiner — jeweils eine Handvoll Szenarien, kein Profilsystem, gegen bereits vorhandene echte Kanäle — daher steht ihre Referenz hier.

### Gemeinsame CLI-Flags

Beide Lanes werden über `extensions/qa-lab/src/live-transports/shared/live-transport-cli.ts` registriert und akzeptieren dieselben Flags:

| Flag                                  | Standardwert                                             | Beschreibung                                                                                                                |
| ------------------------------------- | -------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `--scenario <id>`                     | —                                                        | Führt nur dieses Szenario aus. Wiederholbar.                                                                                |
| `--output-dir <path>`                 | `<repo>/.artifacts/qa-e2e/{telegram,discord}-<timestamp>` | Zielort, an dem Berichte/Zusammenfassung/beobachtete Nachrichten und das Ausgabelog geschrieben werden. Relative Pfade werden gegen `--repo-root` aufgelöst. |
| `--repo-root <path>`                  | `process.cwd()`                                          | Repository-Root beim Aufruf aus einem neutralen cwd.                                                                        |
| `--sut-account <id>`                  | `sut`                                                    | Temporäre Konto-ID innerhalb der QA-Gateway-Konfiguration.                                                                  |
| `--provider-mode <mode>`              | `live-frontier`                                          | `mock-openai` oder `live-frontier` (das ältere `live-openai` funktioniert weiterhin).                                       |
| `--model <ref>` / `--alt-model <ref>` | Provider-Standardwert                                    | Primäre/alternative Modell-Refs.                                                                                            |
| `--fast`                              | aus                                                      | Provider-Schnellmodus, sofern unterstützt.                                                                                  |
| `--credential-source <env\|convex>`   | `env`                                                    | Siehe [Convex-Anmeldeinformationspool](#convex-credential-pool).                                                           |
| `--credential-role <maintainer\|ci>`  | `ci` in CI, sonst `maintainer`                           | Rolle, die verwendet wird, wenn `--credential-source convex` gesetzt ist.                                                   |

Beide beenden sich bei jedem fehlgeschlagenen Szenario mit einem Exit-Code ungleich null. `--allow-failures` schreibt Artefakte, ohne einen fehlschlagenden Exit-Code zu setzen.

### Telegram-QA

```bash
pnpm openclaw qa telegram
```

Zielt auf eine echte private Telegram-Gruppe mit zwei unterschiedlichen Bots (Treiber + SUT). Der SUT-Bot muss einen Telegram-Benutzernamen haben; Bot-zu-Bot-Beobachtung funktioniert am besten, wenn bei beiden Bots der **Bot-zu-Bot-Kommunikationsmodus** in `@BotFather` aktiviert ist.

Erforderliche Env-Werte bei `--credential-source env`:

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
- `telegram-qa-summary.json` — enthält RTT pro Antwort (Treiber sendet → beobachtete SUT-Antwort), beginnend mit dem Canary.
- `telegram-qa-observed-messages.json` — Texte geschwärzt, außer `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1` ist gesetzt.

### Discord-QA

```bash
pnpm openclaw qa discord
```

Zielt auf einen echten privaten Discord-Guild-Channel mit zwei Bots: einen vom Harness gesteuerten Treiber-Bot und einen SUT-Bot, der vom untergeordneten OpenClaw-Gateway über das gebündelte Discord-Plugin gestartet wird. Überprüft die Verarbeitung von Channel-Erwähnungen, dass der SUT-Bot den nativen `/help`-Befehl bei Discord registriert hat, sowie Opt-in-Mantis-Evidenzszenarien.

Erforderliche Env-Werte bei `--credential-source env`:

- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID` — muss der von Discord zurückgegebenen Benutzer-ID des SUT-Bots entsprechen (andernfalls schlägt die Lane schnell fehl).

Optional:

- `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1` behält Nachrichtentexte in Artefakten mit beobachteten Nachrichten bei.

Szenarien (`extensions/qa-lab/src/live-transports/discord/discord-live.runtime.ts:36`):

- `discord-canary`
- `discord-mention-gating`
- `discord-native-help-command-registration`
- `discord-status-reactions-tool-only` — Opt-in-Mantis-Szenario. Läuft allein, weil es den SUT auf durchgehend aktivierte, ausschließlich toolbasierte Guild-Antworten mit `messages.statusReactions.enabled=true` umstellt und dann eine REST-Reaktions-Zeitleiste sowie ein visuelles HTML/PNG-Artefakt erfasst.

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
- `discord-qa-observed-messages.json` — Texte geschwärzt, außer `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1` ist gesetzt.
- `discord-qa-reaction-timelines.json` und `discord-status-reactions-tool-only-timeline.png`, wenn das Statusreaktionsszenario ausgeführt wird.

### Convex-Anmeldeinformationspool

Sowohl Telegram- als auch Discord-Lanes können Anmeldeinformationen aus einem gemeinsamen Convex-Pool leasen, statt die oben genannten Env-Variablen zu lesen. Übergeben Sie `--credential-source convex` (oder setzen Sie `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`); QA Lab ruft eine exklusive Lease ab, sendet während der Dauer des Laufs Heartbeats dafür und gibt sie beim Herunterfahren frei. Pool-Arten sind `"telegram"` und `"discord"`.

Payload-Formen, die der Broker bei `admin/add` validiert:

- Telegram (`kind: "telegram"`): `{ groupId: string, driverToken: string, sutToken: string }` — `groupId` muss ein numerischer Chat-ID-String sein.
- Discord (`kind: "discord"`): `{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string }`.

Operative Env-Variablen und der Convex-Broker-Endpoint-Vertrag befinden sich in [Testen → Gemeinsame Telegram-Anmeldeinformationen über Convex](/de/help/testing#shared-telegram-credentials-via-convex-v1) (der Abschnittsname stammt aus der Zeit vor der Discord-Unterstützung; die Broker-Semantik ist für beide Arten identisch).

## Repository-gestützte Seeds

Seed-Assets befinden sich in `qa/`:

- `qa/scenarios/index.md`
- `qa/scenarios/<theme>/*.md`

Diese liegen absichtlich in Git, damit der QA-Plan sowohl für Menschen als auch für den
Agent sichtbar ist.

`qa-lab` sollte ein generischer Markdown-Runner bleiben. Jede Szenario-Markdown-Datei ist
die Quelle der Wahrheit für einen Testlauf und sollte Folgendes definieren:

- Szenario-Metadaten
- optionale Metadaten zu Kategorie, Fähigkeit, Lane und Risiko
- Dokumentations- und Code-Refs
- optionale Plugin-Anforderungen
- optionaler Gateway-Konfigurationspatch
- den ausführbaren `qa-flow`

Die wiederverwendbare Runtime-Oberfläche, die `qa-flow` unterstützt, darf generisch
und querschnittlich bleiben. Beispielsweise können Markdown-Szenarien transportseitige
Hilfsfunktionen mit browserseitigen Hilfsfunktionen kombinieren, die die eingebettete Control UI über die
Gateway-Naht `browser.request` steuern, ohne einen Spezialfall-Runner hinzuzufügen.

Szenariodateien sollten nach Produktfähigkeit statt nach Source-Tree-Ordner
gruppiert werden. Halten Sie Szenario-IDs stabil, wenn Dateien verschoben werden; verwenden Sie `docsRefs` und `codeRefs`
für Implementierungsnachverfolgbarkeit.

Die Baseline-Liste sollte breit genug bleiben, um Folgendes abzudecken:

- DM- und Channel-Chat
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
  deterministische Mock-Lane für repository-gestützte QA und Paritäts-Gates.
- `aimock` startet einen AIMock-gestützten Provider-Server für experimentelle Protokoll-,
  Fixture-, Record/Replay- und Chaos-Abdeckung. Er ist additiv und ersetzt
  den `mock-openai`-Szenario-Dispatcher nicht.

Die Provider-Lane-Implementierung befindet sich unter `extensions/qa-lab/src/providers/`.
Jeder Provider besitzt seine Standardwerte, den lokalen Serverstart, die Gateway-Modellkonfiguration,
Auth-Profile-Staging-Anforderungen und Live-/Mock-Fähigkeitsflags. Gemeinsamer Suite- und
Gateway-Code sollte über die Provider-Registry routen, statt anhand von
Provider-Namen zu verzweigen.

## Transportadapter

`qa-lab` besitzt eine generische Transport-Naht für Markdown-QA-Szenarien. `qa-channel` ist der erste Adapter an dieser Naht, aber das Designziel ist breiter: Zukünftige echte oder synthetische Channels sollten sich in denselben Suite-Runner einklinken, statt einen transportspezifischen QA-Runner hinzuzufügen.

Auf Architekturebene ist die Aufteilung:

- `qa-lab` besitzt generische Szenarioausführung, Worker-Concurrency, Artefaktschreiben und Reporting.
- Der Transportadapter besitzt Gateway-Konfiguration, Bereitschaft, eingehende und ausgehende Beobachtung, Transportaktionen und normalisierten Transportzustand.
- Markdown-Szenariodateien unter `qa/scenarios/` definieren den Testlauf; `qa-lab` stellt die wiederverwendbare Runtime-Oberfläche bereit, die sie ausführt.

### Einen Channel hinzufügen

Das Hinzufügen eines Channels zum Markdown-QA-System erfordert genau zwei Dinge:

1. Einen Transportadapter für den Channel.
2. Ein Szenariopaket, das den Channel-Vertrag ausübt.

Fügen Sie keinen neuen obersten QA-Befehls-Root hinzu, wenn der gemeinsame `qa-lab`-Host den Flow besitzen kann.

`qa-lab` besitzt die gemeinsamen Host-Mechaniken:

- den Befehls-Root `openclaw qa`
- Start und Teardown der Suite
- Worker-Concurrency
- Artefaktschreiben
- Berichtsgenerierung
- Szenarioausführung
- Kompatibilitätsaliase für ältere `qa-channel`-Szenarien

Runner-Plugins besitzen den Transportvertrag:

- wie `openclaw qa <runner>` unterhalb des gemeinsamen `qa`-Roots eingehängt wird
- wie das Gateway für diesen Transport konfiguriert wird
- wie Bereitschaft geprüft wird
- wie eingehende Events injiziert werden
- wie ausgehende Nachrichten beobachtet werden
- wie Transkripte und normalisierter Transportzustand offengelegt werden
- wie transportgestützte Aktionen ausgeführt werden
- wie transportspezifisches Zurücksetzen oder Aufräumen behandelt wird

Die Mindestanforderungen für die Einführung eines neuen Channels:

1. Lassen Sie `qa-lab` als Besitzer des gemeinsamen `qa`-Roots.
2. Implementieren Sie den Transport-Runner auf der gemeinsamen `qa-lab`-Host-Naht.
3. Halten Sie transportspezifische Mechaniken im Runner-Plugin oder Channel-Harness.
4. Hängen Sie den Runner als `openclaw qa <runner>` ein, statt einen konkurrierenden Root-Befehl zu registrieren. Runner-Plugins sollten `qaRunners` in `openclaw.plugin.json` deklarieren und ein passendes Array `qaRunnerCliRegistrations` aus `runtime-api.ts` exportieren. Halten Sie `runtime-api.ts` leichtgewichtig; Lazy-CLI und Runner-Ausführung sollten hinter separaten Einstiegspunkten bleiben.
5. Erstellen oder adaptieren Sie Markdown-Szenarien unter den thematischen `qa/scenarios/`-Verzeichnissen.
6. Verwenden Sie die generischen Szenario-Hilfsfunktionen für neue Szenarien.
7. Halten Sie bestehende Kompatibilitätsaliase funktionsfähig, außer das Repository führt eine beabsichtigte Migration durch.

Die Entscheidungsregel ist strikt:

- Wenn Verhalten einmal in `qa-lab` ausgedrückt werden kann, legen Sie es in `qa-lab` ab.
- Wenn Verhalten von einem Channel-Transport abhängt, halten Sie es in diesem Runner-Plugin oder Plugin-Harness.
- Wenn ein Szenario eine neue Fähigkeit benötigt, die mehr als ein Channel verwenden kann, fügen Sie eine generische Hilfsfunktion hinzu statt einer channelspezifischen Verzweigung in `suite.ts`.
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

Kompatibilitätsaliase bleiben für bestehende Szenarien verfügbar — `waitForQaChannelReady`, `waitForOutboundMessage`, `waitForNoOutbound`, `formatConversationTranscript`, `resetBus` — aber beim Erstellen neuer Szenarien sollten die generischen Namen verwendet werden. Die Aliase existieren, um eine Stichtagsmigration zu vermeiden, nicht als künftiges Modell.

## Berichte

`qa-lab` exportiert einen Markdown-Protokollbericht aus der beobachteten Bus-Zeitleiste.
Der Bericht sollte beantworten:

- Was funktioniert hat
- Was fehlgeschlagen ist
- Was blockiert geblieben ist
- Welche Folgeszenarien sinnvoll ergänzt werden sollten

Für das Inventar verfügbarer Szenarien — nützlich beim Abschätzen von Folgearbeiten oder beim Verdrahten eines neuen Transports — führen Sie `pnpm openclaw qa coverage` aus (fügen Sie `--json` für maschinenlesbare Ausgabe hinzu).

Für Zeichen- und Stilprüfungen führen Sie dasselbe Szenario über mehrere Live-Modell-Refs hinweg aus
und schreiben einen bewerteten Markdown-Bericht:

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

Der Befehl führt lokale untergeordnete QA-Gateway-Prozesse aus, nicht Docker. Charakter-Eval-Szenarien
sollten die Persona über `SOUL.md` festlegen und dann normale Benutzer-Turns
wie Chat, Workspace-Hilfe und kleine Dateiaufgaben ausführen. Dem Kandidatenmodell sollte
nicht mitgeteilt werden, dass es evaluiert wird. Der Befehl bewahrt jedes vollständige
Transkript auf, zeichnet grundlegende Laufstatistiken auf und bittet dann die Judge-Modelle im Fast-Modus mit
`xhigh`-Reasoning, wo unterstützt, die Läufe nach Natürlichkeit, Vibe und Humor zu bewerten.
Verwenden Sie `--blind-judge-models`, wenn Sie Provider vergleichen: Der Judge-Prompt erhält weiterhin
jedes Transkript und jeden Laufstatus, aber Kandidaten-Refs werden durch neutrale
Labels wie `candidate-01` ersetzt; der Bericht ordnet die Rankings nach dem
Parsen wieder den echten Refs zu.
Kandidatenläufe verwenden standardmäßig `high` Thinking, mit `medium` für GPT-5.5 und `xhigh`
für ältere OpenAI-Eval-Refs, die es unterstützen. Überschreiben Sie einen bestimmten Kandidaten inline mit
`--model provider/model,thinking=<level>`. `--thinking <level>` legt weiterhin einen
globalen Fallback fest, und die ältere Form `--model-thinking <provider/model=level>` wird
aus Kompatibilitätsgründen beibehalten.
OpenAI-Kandidaten-Refs verwenden standardmäßig den Fast-Modus, sodass Priority Processing dort genutzt wird,
wo der Provider es unterstützt. Fügen Sie inline `,fast`, `,no-fast` oder `,fast=false` hinzu, wenn ein
einzelner Kandidat oder Judge eine Überschreibung benötigt. Übergeben Sie `--fast` nur, wenn Sie den
Fast-Modus für jedes Kandidatenmodell erzwingen möchten. Kandidaten- und Judge-Dauern werden
für Benchmark-Analysen im Bericht aufgezeichnet, aber Judge-Prompts sagen ausdrücklich,
dass nicht nach Geschwindigkeit bewertet werden soll.
Kandidaten- und Judge-Modellläufe verwenden beide standardmäßig Concurrency 16. Senken Sie
`--concurrency` oder `--judge-concurrency`, wenn Provider-Limits oder lokaler Gateway-Druck
einen Lauf zu verrauscht machen.
Wenn kein Kandidaten-`--model` übergeben wird, verwendet das Charakter-Eval standardmäßig
`openai/gpt-5.5`, `openai/gpt-5.2`, `openai/gpt-5`, `anthropic/claude-opus-4-6`,
`anthropic/claude-sonnet-4-6`, `zai/glm-5.1`,
`moonshot/kimi-k2.5` und
`google/gemini-3.1-pro-preview`, wenn kein `--model` übergeben wird.
Wenn kein `--judge-model` übergeben wird, verwenden die Judges standardmäßig
`openai/gpt-5.5,thinking=xhigh,fast` und
`anthropic/claude-opus-4-6,thinking=high`.

## Verwandte Dokumentation

- [Matrix-QA](/de/concepts/qa-matrix)
- [QA Channel](/de/channels/qa-channel)
- [Tests](/de/help/testing)
- [Dashboard](/de/web/dashboard)
