---
read_when:
    - Verstehen, wie der QA-Stack zusammenpasst
    - Erweitern von qa-lab, qa-channel oder eines Transportadapters
    - Repo-gestützte QA-Szenarien hinzufügen
    - Aufbau realitätsnäherer QA-Automatisierung rund um das Gateway-Dashboard
summary: 'Überblick über den QA-Stack: qa-lab, qa-channel, Repository-gestützte Szenarien, Live-Transport-Lanes, Transportadapter und Reporting.'
title: QA-Überblick
x-i18n:
    generated_at: "2026-04-30T06:50:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: b62a5081fc2b67333f2ec6f3469e97043f048d5912858b9d8cc565c2e5fc8de2
    source_path: concepts/qa-e2e-automation.md
    workflow: 16
---

Der private QA-Stack soll OpenClaw auf realistischere,
kanalähnliche Weise ausüben, als es ein einzelner Unit-Test kann.

Aktuelle Bestandteile:

- `extensions/qa-channel`: synthetischer Nachrichtenkanal mit Oberflächen für DM, Kanal, Thread,
  Reaktion, Bearbeitung und Löschung.
- `extensions/qa-lab`: Debugger-UI und QA-Bus zum Beobachten des Transkripts,
  Einspeisen eingehender Nachrichten und Exportieren eines Markdown-Berichts.
- `extensions/qa-matrix`, zukünftige Runner-Plugins: Live-Transport-Adapter, die
  einen echten Kanal innerhalb eines untergeordneten QA-Gateways steuern.
- `qa/`: repo-gestützte Seed-Assets für die Startaufgabe und QA-Basisszenarien.

## Befehlsoberfläche

Jeder QA-Ablauf läuft unter `pnpm openclaw qa <subcommand>`. Viele haben `pnpm qa:*`-Skript-Aliasse; beide Formen werden unterstützt.

| Befehl                                             | Zweck                                                                                                                                                                |
| --------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `qa run`                                            | Gebündelter QA-Selbsttest; schreibt einen Markdown-Bericht.                                                                                                                       |
| `qa suite`                                          | Führt repo-gestützte Szenarien gegen die QA-Gateway-Lane aus. Aliasse: `pnpm openclaw qa suite --runner multipass` für eine kurzlebige Linux-VM.                                 |
| `qa coverage`                                       | Gibt das Markdown-Inventar der Szenarioabdeckung aus (`--json` für maschinenlesbare Ausgabe).                                                                                          |
| `qa parity-report`                                  | Vergleicht zwei `qa-suite-summary.json`-Dateien und schreibt den agentischen Parity-Gate-Bericht.                                                                                    |
| `qa character-eval`                                 | Führt das Character-QA-Szenario über mehrere Live-Modelle hinweg mit bewertetem Bericht aus. Siehe [Berichterstattung](#reporting).                                                           |
| `qa manual`                                         | Führt einen einmaligen Prompt gegen die ausgewählte Provider-/Modell-Lane aus.                                                                                                         |
| `qa ui`                                             | Startet die QA-Debugger-UI und den lokalen QA-Bus (Alias: `pnpm qa:lab:ui`).                                                                                                   |
| `qa docker-build-image`                             | Baut das vorgefertigte QA-Docker-Image.                                                                                                                                    |
| `qa docker-scaffold`                                | Schreibt ein docker-compose-Gerüst für das QA-Dashboard und die Gateway-Lane.                                                                                                   |
| `qa up`                                             | Baut die QA-Site, startet den Docker-gestützten Stack und gibt die URL aus (Alias: `pnpm qa:lab:up`; Variante `:fast` ergänzt `--use-prebuilt-image --bind-ui-dist --skip-ui-build`). |
| `qa aimock`                                         | Startet nur den AIMock-Provider-Server.                                                                                                                                 |
| `qa mock-openai`                                    | Startet nur den szenariobewussten `mock-openai`-Provider-Server.                                                                                                           |
| `qa credentials doctor` / `add` / `list` / `remove` | Verwaltet den gemeinsamen Convex-Anmeldedatenpool.                                                                                                                              |
| `qa matrix`                                         | Live-Transport-Lane gegen einen kurzlebigen Tuwunel-Homeserver. Siehe [Matrix-QA](/de/concepts/qa-matrix).                                                                     |
| `qa telegram`                                       | Live-Transport-Lane gegen eine echte private Telegram-Gruppe.                                                                                                             |
| `qa discord`                                        | Live-Transport-Lane gegen einen echten privaten Discord-Guild-Kanal.                                                                                                      |

## Operator-Ablauf

Der aktuelle QA-Operator-Ablauf ist eine zweigeteilte QA-Site:

- Links: Gateway-Dashboard (Control UI) mit dem Agenten.
- Rechts: QA Lab mit dem Slack-ähnlichen Transkript und Szenarioplan.

Führen Sie ihn aus mit:

```bash
pnpm qa:lab:up
```

Das baut die QA-Site, startet die Docker-gestützte Gateway-Lane und stellt die
QA Lab-Seite bereit, auf der ein Operator oder eine Automatisierungsschleife dem Agenten eine QA-
Mission geben, echtes Kanalverhalten beobachten und aufzeichnen kann, was funktioniert hat, fehlgeschlagen ist oder
blockiert blieb.

Für schnellere QA Lab-UI-Iterationen, ohne das Docker-Image jedes Mal neu zu bauen,
starten Sie den Stack mit einem bind-eingehängten QA Lab-Bundle:

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` hält die Docker-Dienste auf einem vorgefertigten Image und bind-mountet
`extensions/qa-lab/web/dist` in den `qa-lab`-Container. `qa:lab:watch`
baut dieses Bundle bei Änderungen neu, und der Browser lädt automatisch neu, wenn sich der QA Lab-
Asset-Hash ändert.

Für einen lokalen OpenTelemetry-Trace-Smoke-Test führen Sie aus:

```bash
pnpm qa:otel:smoke
```

Dieses Skript startet einen lokalen OTLP/HTTP-Trace-Receiver, führt das
`otel-trace-smoke`-QA-Szenario mit aktiviertem `diagnostics-otel`-Plugin aus, dekodiert anschließend
die exportierten Protobuf-Spans und prüft die releasekritische Struktur:
`openclaw.run`, `openclaw.harness.run`, `openclaw.model.call`,
`openclaw.context.assembled` und `openclaw.message.delivery` müssen vorhanden sein;
Modellaufrufe dürfen bei erfolgreichen Turns kein `StreamAbandoned` exportieren; rohe Diagnose-IDs und
`openclaw.content.*`-Attribute müssen aus dem Trace herausbleiben. Es schreibt
`otel-smoke-summary.json` neben die QA-Suite-Artefakte.

Observability-QA bleibt auf Source-Checkouts beschränkt. Der npm-Tarball lässt
QA Lab absichtlich aus, daher führen Package-Docker-Release-Lanes keine `qa`-Befehle aus. Verwenden Sie
`pnpm qa:otel:smoke` aus einem gebauten Source-Checkout, wenn Sie Diagnose-
Instrumentierung ändern.

Für eine transportreale Matrix-Smoke-Lane führen Sie aus:

```bash
pnpm openclaw qa matrix --profile fast --fail-fast
```

Die vollständige CLI-Referenz, der Profil-/Szenariokatalog, die Umgebungsvariablen und das Artefaktlayout für diese Lane befinden sich in [Matrix-QA](/de/concepts/qa-matrix). Kurz gesagt: Sie stellt einen kurzlebigen Tuwunel-Homeserver in Docker bereit, registriert temporäre Driver-/SUT-/Observer-Benutzer, führt das echte Matrix-Plugin innerhalb eines untergeordneten QA-Gateways aus, das auf diesen Transport beschränkt ist (kein `qa-channel`), und schreibt dann einen Markdown-Bericht, eine JSON-Zusammenfassung, ein observed-events-Artefakt und ein kombiniertes Ausgabelog unter `.artifacts/qa-e2e/matrix-<timestamp>/`.

Für transportreale Telegram- und Discord-Smoke-Lanes:

```bash
pnpm openclaw qa telegram
pnpm openclaw qa discord
```

Beide zielen auf einen bereits vorhandenen echten Kanal mit zwei Bots (Driver + SUT). Erforderliche Umgebungsvariablen, Szenariolisten, Ausgabeartefakte und der Convex-Anmeldedatenpool sind unten in der [Telegram- und Discord-QA-Referenz](#telegram-and-discord-qa-reference) dokumentiert.

Bevor Sie gepoolte Live-Anmeldedaten verwenden, führen Sie aus:

```bash
pnpm openclaw qa credentials doctor
```

Der Doctor prüft die Convex-Broker-Umgebung, validiert Endpoint-Einstellungen und verifiziert die Admin-/Listen-Erreichbarkeit, wenn das Maintainer-Secret vorhanden ist. Er meldet für Secrets nur den Status gesetzt/fehlend.

## Live-Transport-Abdeckung

Live-Transport-Lanes teilen sich einen Vertrag, statt jeweils eine eigene Form für Szenariolisten zu erfinden. `qa-channel` ist die breite synthetische Suite für Produktverhalten und ist nicht Teil der Live-Transport-Abdeckungsmatrix.

| Lane     | Canary | Mention-Gating | Bot-zu-Bot | Allowlist-Block | Top-Level-Antwort | Neustart-Fortsetzung | Thread-Follow-up | Thread-Isolation | Reaktionsbeobachtung | Help-Befehl | Native Befehlsregistrierung |
| -------- | ------ | -------------- | ---------- | --------------- | --------------- | -------------- | ---------------- | ---------------- | -------------------- | ------------ | --------------------------- |
| Matrix   | x      | x              | x          | x               | x               | x              | x                | x                | x                    |              |                             |
| Telegram | x      | x              | x          |                 |                 |                |                  |                  |                      | x            |                             |
| Discord  | x      | x              | x          |                 |                 |                |                  |                  |                      |              | x                           |

Dies behält `qa-channel` als breite Suite für Produktverhalten bei, während Matrix,
Telegram und zukünftige Live-Transporte eine explizite gemeinsame Transportvertrag-
Checkliste nutzen.

Für eine kurzlebige Linux-VM-Lane, ohne Docker in den QA-Pfad einzubeziehen, führen Sie aus:

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

Dies bootet einen frischen Multipass-Gast, installiert Abhängigkeiten, baut OpenClaw
innerhalb des Gasts, führt `qa suite` aus und kopiert dann den normalen QA-Bericht und die
Zusammenfassung zurück nach `.artifacts/qa-e2e/...` auf dem Host.
Es verwendet dasselbe Szenarioauswahlverhalten wie `qa suite` auf dem Host.
Host- und Multipass-Suite-Läufe führen standardmäßig mehrere ausgewählte Szenarien parallel
mit isolierten Gateway-Workern aus. `qa-channel` verwendet standardmäßig Parallelität
4, begrenzt durch die ausgewählte Szenarioanzahl. Verwenden Sie `--concurrency <count>`, um
die Worker-Anzahl anzupassen, oder `--concurrency 1` für serielle Ausführung.
Der Befehl beendet sich mit einem Nicht-Null-Code, wenn ein Szenario fehlschlägt. Verwenden Sie `--allow-failures`, wenn
Sie Artefakte ohne fehlschlagenden Exit-Code möchten.
Live-Läufe leiten die unterstützten QA-Auth-Eingaben weiter, die für den
Gast praktikabel sind: umgebungsbasierte Provider-Schlüssel, den QA-Live-Provider-Konfigurationspfad und
`CODEX_HOME`, wenn vorhanden. Halten Sie `--output-dir` unterhalb des Repo-Roots, damit der Gast
über den eingehängten Workspace zurückschreiben kann.

## Telegram- und Discord-QA-Referenz

Matrix hat wegen seiner Szenarioanzahl und der Docker-gestützten Homeserver-Bereitstellung eine [eigene Seite](/de/concepts/qa-matrix). Telegram und Discord sind kleiner — jeweils eine Handvoll Szenarien, kein Profilsystem, gegen bereits vorhandene echte Kanäle — daher befindet sich ihre Referenz hier.

### Gemeinsame CLI-Flags

Beide Lanes registrieren sich über `extensions/qa-lab/src/live-transports/shared/live-transport-cli.ts` und akzeptieren dieselben Flags:

| Flag                                  | Standardwert                                             | Beschreibung                                                                                                                 |
| ------------------------------------- | --------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `--scenario <id>`                     | —                                                         | Nur dieses Szenario ausführen. Wiederholbar.                                                                                 |
| `--output-dir <path>`                 | `<repo>/.artifacts/qa-e2e/{telegram,discord}-<timestamp>` | Wohin Berichte/Zusammenfassung/beobachtete Nachrichten und das Ausgabeprotokoll geschrieben werden. Relative Pfade werden relativ zu `--repo-root` aufgelöst. |
| `--repo-root <path>`                  | `process.cwd()`                                           | Repository-Wurzel beim Aufruf aus einem neutralen Arbeitsverzeichnis.                                                        |
| `--sut-account <id>`                  | `sut`                                                     | Temporäre Konto-ID innerhalb der QA-Gateway-Konfiguration.                                                                   |
| `--provider-mode <mode>`              | `live-frontier`                                           | `mock-openai` oder `live-frontier` (das veraltete `live-openai` funktioniert weiterhin).                                     |
| `--model <ref>` / `--alt-model <ref>` | Provider-Standardwert                                     | Primäre/alternative Modellreferenzen.                                                                                        |
| `--fast`                              | aus                                                       | Schneller Provider-Modus, sofern unterstützt.                                                                                |
| `--credential-source <env\|convex>`   | `env`                                                     | Siehe [Convex-Anmeldeinformationspool](#convex-credential-pool).                                                            |
| `--credential-role <maintainer\|ci>`  | `ci` in CI, andernfalls `maintainer`                      | Rolle, die verwendet wird, wenn `--credential-source convex` gesetzt ist.                                                     |

Beide beenden sich bei jedem fehlgeschlagenen Szenario mit einem Nicht-Null-Code. `--allow-failures` schreibt Artefakte, ohne einen fehlgeschlagenen Exit-Code zu setzen.

### Telegram-QA

```bash
pnpm openclaw qa telegram
```

Zielt auf eine echte private Telegram-Gruppe mit zwei unterschiedlichen Bots (Driver + SUT). Der SUT-Bot muss einen Telegram-Benutzernamen haben; Bot-zu-Bot-Beobachtung funktioniert am besten, wenn beide Bots in `@BotFather` den **Bot-to-Bot Communication Mode** aktiviert haben.

Erforderliche Umgebungsvariablen bei `--credential-source env`:

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

Ausgabeartefakte:

- `telegram-qa-report.md`
- `telegram-qa-summary.json` — enthält RTT pro Antwort (Driver-Senden → beobachtete SUT-Antwort), beginnend mit dem Canary.
- `telegram-qa-observed-messages.json` — Inhalte werden redigiert, außer `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1` ist gesetzt.

### Discord-QA

```bash
pnpm openclaw qa discord
```

Zielt auf einen echten privaten Discord-Guild-Kanal mit zwei Bots: einen vom Harness gesteuerten Driver-Bot und einen SUT-Bot, der durch das untergeordnete OpenClaw-Gateway über das gebündelte Discord-Plugin gestartet wird. Prüft die Verarbeitung von Kanal-Erwähnungen und dass der SUT-Bot den nativen Befehl `/help` bei Discord registriert hat.

Erforderliche Umgebungsvariablen bei `--credential-source env`:

- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID` — muss der von Discord zurückgegebenen Benutzer-ID des SUT-Bots entsprechen (die Lane schlägt andernfalls schnell fehl).

Optional:

- `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1` behält Nachrichtentexte in Artefakten beobachteter Nachrichten bei.

Szenarien (`extensions/qa-lab/src/live-transports/discord/discord-live.runtime.ts:36`):

- `discord-canary`
- `discord-mention-gating`
- `discord-native-help-command-registration`

Ausgabeartefakte:

- `discord-qa-report.md`
- `discord-qa-summary.json`
- `discord-qa-observed-messages.json` — Inhalte werden redigiert, außer `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1` ist gesetzt.

### Convex-Anmeldeinformationspool

Sowohl Telegram- als auch Discord-Lanes können Anmeldeinformationen aus einem gemeinsamen Convex-Pool leasen, statt die oben genannten Umgebungsvariablen zu lesen. Übergeben Sie `--credential-source convex` (oder setzen Sie `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`); QA Lab erwirbt ein exklusives Lease, sendet für die Dauer des Laufs Heartbeats dafür und gibt es beim Herunterfahren frei. Pool-Arten sind `"telegram"` und `"discord"`.

Payload-Formen, die der Broker bei `admin/add` validiert:

- Telegram (`kind: "telegram"`): `{ groupId: string, driverToken: string, sutToken: string }` — `groupId` muss ein numerischer Chat-ID-String sein.
- Discord (`kind: "discord"`): `{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string }`.

Operative Umgebungsvariablen und der Convex-Broker-Endpunktvertrag befinden sich in [Testing → Shared Telegram credentials via Convex](/de/help/testing#shared-telegram-credentials-via-convex-v1) (der Abschnittsname stammt aus der Zeit vor der Discord-Unterstützung; die Broker-Semantik ist für beide Arten identisch).

## Repository-gestützte Seeds

Seed-Assets befinden sich in `qa/`:

- `qa/scenarios/index.md`
- `qa/scenarios/<theme>/*.md`

Diese liegen absichtlich in git, damit der QA-Plan sowohl für Menschen als auch für den Agent sichtbar ist.

`qa-lab` sollte ein generischer Markdown-Runner bleiben. Jede Szenario-Markdown-Datei ist die maßgebliche Quelle für einen Testlauf und sollte Folgendes definieren:

- Szenario-Metadaten
- optionale Kategorie-, Capability-, Lane- und Risikometadaten
- Dokumentations- und Code-Referenzen
- optionale Plugin-Anforderungen
- optionaler Gateway-Konfigurations-Patch
- der ausführbare `qa-flow`

Die wiederverwendbare Runtime-Oberfläche, die `qa-flow` unterstützt, darf generisch und querschnittlich bleiben. Markdown-Szenarien können beispielsweise transportseitige Hilfsfunktionen mit browserseitigen Hilfsfunktionen kombinieren, die die eingebettete Control UI über den Gateway-`browser.request`-Seam steuern, ohne einen Sonderfall-Runner hinzuzufügen.

Szenariodateien sollten nach Produkt-Capability statt nach Source-Tree-Ordner gruppiert werden. Halten Sie Szenario-IDs stabil, wenn Dateien verschoben werden; verwenden Sie `docsRefs` und `codeRefs` für die Implementierungsnachverfolgbarkeit.

Die Basisliste sollte breit genug bleiben, um Folgendes abzudecken:

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

- `mock-openai` ist der szenariobewusste OpenClaw-Mock. Er bleibt die standardmäßige deterministische Mock-Lane für Repository-gestützte QA und Paritäts-Gates.
- `aimock` startet einen AIMock-gestützten Provider-Server für experimentelle Protokoll-, Fixture-, Record/Replay- und Chaos-Abdeckung. Er ist additiv und ersetzt den `mock-openai`-Szenario-Dispatcher nicht.

Die Provider-Lane-Implementierung befindet sich unter `extensions/qa-lab/src/providers/`. Jeder Provider besitzt seine Standardwerte, den Start des lokalen Servers, die Gateway-Modellkonfiguration, Auth-Profil-Staging-Anforderungen und Live-/Mock-Capability-Flags. Gemeinsamer Suite- und Gateway-Code sollte über die Provider-Registry routen, statt auf Provider-Namen zu verzweigen.

## Transportadapter

`qa-lab` besitzt einen generischen Transport-Seam für Markdown-QA-Szenarien. `qa-channel` ist der erste Adapter auf diesem Seam, aber das Designziel ist breiter: Zukünftige echte oder synthetische Kanäle sollten sich in denselben Suite-Runner einklinken, statt einen transportspezifischen QA-Runner hinzuzufügen.

Auf Architekturebene ist die Aufteilung:

- `qa-lab` besitzt generische Szenarioausführung, Worker-Parallelität, Artefaktschreibung und Reporting.
- Der Transportadapter besitzt Gateway-Konfiguration, Bereitschaft, Eingangs- und Ausgangsbeobachtung, Transportaktionen und normalisierten Transportzustand.
- Markdown-Szenariodateien unter `qa/scenarios/` definieren den Testlauf; `qa-lab` stellt die wiederverwendbare Runtime-Oberfläche bereit, die sie ausführt.

### Einen Kanal hinzufügen

Das Hinzufügen eines Kanals zum Markdown-QA-System erfordert genau zwei Dinge:

1. Einen Transportadapter für den Kanal.
2. Ein Szenariopaket, das den Kanalvertrag ausübt.

Fügen Sie keinen neuen Top-Level-QA-Befehlsstamm hinzu, wenn der gemeinsame `qa-lab`-Host den Ablauf besitzen kann.

`qa-lab` besitzt die gemeinsamen Host-Mechaniken:

- den Befehlsstamm `openclaw qa`
- Start und Teardown der Suite
- Worker-Parallelität
- Artefaktschreibung
- Berichtserzeugung
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
2. Implementieren Sie den Transport-Runner auf dem gemeinsamen `qa-lab`-Host-Seam.
3. Halten Sie transportspezifische Mechaniken innerhalb des Runner-Plugins oder Kanal-Harness.
4. Hängen Sie den Runner als `openclaw qa <runner>` ein, statt einen konkurrierenden Root-Befehl zu registrieren. Runner-Plugins sollten `qaRunners` in `openclaw.plugin.json` deklarieren und ein passendes `qaRunnerCliRegistrations`-Array aus `runtime-api.ts` exportieren. Halten Sie `runtime-api.ts` schlank; Lazy-CLI und Runner-Ausführung sollten hinter separaten Einstiegspunkten bleiben.
5. Erstellen oder adaptieren Sie Markdown-Szenarien unter den thematischen Verzeichnissen `qa/scenarios/`.
6. Verwenden Sie die generischen Szenario-Hilfsfunktionen für neue Szenarien.
7. Halten Sie bestehende Kompatibilitätsaliase funktionsfähig, außer das Repository führt eine absichtliche Migration durch.

Die Entscheidungsregel ist strikt:

- Wenn Verhalten einmal in `qa-lab` ausgedrückt werden kann, legen Sie es in `qa-lab` ab.
- Wenn Verhalten von einem Kanaltransport abhängt, halten Sie es in diesem Runner-Plugin oder Plugin-Harness.
- Wenn ein Szenario eine neue Capability benötigt, die mehr als ein Kanal verwenden kann, fügen Sie eine generische Hilfsfunktion hinzu statt einer kanalspezifischen Verzweigung in `suite.ts`.
- Wenn ein Verhalten nur für einen Transport sinnvoll ist, halten Sie das Szenario transportspezifisch und machen Sie dies im Szenariovertrag explizit.

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

Kompatibilitätsaliase bleiben für bestehende Szenarien verfügbar — `waitForQaChannelReady`, `waitForOutboundMessage`, `waitForNoOutbound`, `formatConversationTranscript`, `resetBus` —, aber neue Szenarioautorschaft sollte die generischen Namen verwenden. Die Aliase existieren, um eine Flag-Day-Migration zu vermeiden, nicht als zukünftiges Modell.

## Reporting

`qa-lab` exportiert einen Markdown-Protokollbericht aus der beobachteten Bus-Zeitleiste.
Der Bericht sollte beantworten:

- Was funktioniert hat
- Was fehlgeschlagen ist
- Was blockiert geblieben ist
- Welche Folgeszenarien es wert sind, hinzugefügt zu werden

Führen Sie für das Inventar der verfügbaren Szenarien, nützlich zum Einschätzen von Folgearbeiten oder zum Verdrahten eines neuen Transports, `pnpm openclaw qa coverage` aus (fügen Sie `--json` für maschinenlesbare Ausgabe hinzu).

Führen Sie für Zeichen- und Stilprüfungen dasselbe Szenario über mehrere Live-Modellreferenzen hinweg aus
und schreiben Sie einen bewerteten Markdown-Bericht:

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

Der Befehl führt lokale untergeordnete QA-Gateway-Prozesse aus, nicht Docker. Szenarien für die Zeichenbewertung
sollten die Persona über `SOUL.md` festlegen und dann gewöhnliche Benutzer-Turns
wie Chat, Workspace-Hilfe und kleine Datei-Aufgaben ausführen. Dem Kandidatenmodell sollte
nicht mitgeteilt werden, dass es bewertet wird. Der Befehl bewahrt jedes vollständige
Transkript auf, zeichnet grundlegende Laufstatistiken auf und bittet dann die Bewertungsmodelle im Fast-Modus mit
`xhigh`-Reasoning, sofern unterstützt, die Läufe nach Natürlichkeit, Vibe und Humor zu bewerten.
Verwenden Sie `--blind-judge-models`, wenn Sie Provider vergleichen: Der Bewertungs-Prompt erhält weiterhin
jedes Transkript und jeden Laufstatus, aber Kandidatenreferenzen werden durch neutrale
Labels wie `candidate-01` ersetzt; der Bericht ordnet Rankings nach dem
Parsen wieder echten Referenzen zu.
Kandidatenläufe verwenden standardmäßig `high` thinking, mit `medium` für GPT-5.5 und `xhigh`
für ältere OpenAI-Eval-Referenzen, die es unterstützen. Überschreiben Sie einen bestimmten Kandidaten inline mit
`--model provider/model,thinking=<level>`. `--thinking <level>` setzt weiterhin einen
globalen Fallback, und die ältere Form `--model-thinking <provider/model=level>` bleibt
aus Kompatibilitätsgründen erhalten.
OpenAI-Kandidatenreferenzen verwenden standardmäßig den Fast-Modus, damit priorisierte Verarbeitung dort genutzt wird,
wo der Provider sie unterstützt. Fügen Sie inline `,fast`, `,no-fast` oder `,fast=false` hinzu, wenn ein
einzelner Kandidat oder Bewerter eine Überschreibung benötigt. Übergeben Sie `--fast` nur, wenn Sie
den Fast-Modus für jedes Kandidatenmodell erzwingen möchten. Kandidaten- und Bewertungsdauern werden
für Benchmark-Analysen im Bericht aufgezeichnet, aber Bewertungs-Prompts sagen ausdrücklich,
nicht nach Geschwindigkeit zu ranken.
Kandidaten- und Bewertungsmodellläufe verwenden beide standardmäßig Parallelität 16. Senken Sie
`--concurrency` oder `--judge-concurrency`, wenn Provider-Limits oder lokaler Gateway-Druck
einen Lauf zu verrauscht machen.
Wenn kein Kandidaten-`--model` übergeben wird, verwendet die Zeichenbewertung standardmäßig
`openai/gpt-5.5`, `openai/gpt-5.2`, `openai/gpt-5`, `anthropic/claude-opus-4-6`,
`anthropic/claude-sonnet-4-6`, `zai/glm-5.1`,
`moonshot/kimi-k2.5` und
`google/gemini-3.1-pro-preview`, wenn kein `--model` übergeben wird.
Wenn kein `--judge-model` übergeben wird, verwenden die Bewerter standardmäßig
`openai/gpt-5.5,thinking=xhigh,fast` und
`anthropic/claude-opus-4-6,thinking=high`.

## Zugehörige Dokumentation

- [Matrix-QA](/de/concepts/qa-matrix)
- [QA-Kanal](/de/channels/qa-channel)
- [Testen](/de/help/testing)
- [Dashboard](/de/web/dashboard)
