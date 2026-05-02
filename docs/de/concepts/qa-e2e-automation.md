---
read_when:
    - Verstehen, wie der QA-Stack zusammenpasst
    - qa-lab, qa-channel oder einen Transportadapter erweitern
    - Repo-gestützte QA-Szenarien hinzufügen
    - Aufbau realistischerer QA-Automatisierung rund um das Gateway-Dashboard
summary: 'Überblick über den QA-Stack: qa-lab, qa-channel, Repository-gestützte Szenarien, Live-Transport-Lanes, Transportadapter und Reporting.'
title: QA-Übersicht
x-i18n:
    generated_at: "2026-05-02T20:46:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1f1cba04d6624bb1e0fc54105bd836f16ada0ba1cc1de9ab7065b90220e23bdf
    source_path: concepts/qa-e2e-automation.md
    workflow: 16
---

Der private QA-Stack soll OpenClaw auf realistischere,
kanalnahe Weise ausüben, als es ein einzelner Unit-Test kann.

Aktuelle Bestandteile:

- `extensions/qa-channel`: synthetischer Nachrichtenkanal mit Oberflächen für DM, Kanal, Thread,
  Reaktion, Bearbeitung und Löschung.
- `extensions/qa-lab`: Debugger-UI und QA-Bus zum Beobachten des Transkripts,
  Einspeisen eingehender Nachrichten und Exportieren eines Markdown-Berichts.
- `extensions/qa-matrix`, künftige Runner-Plugins: Live-Transportadapter, die
  einen echten Kanal innerhalb eines untergeordneten QA-Gateway steuern.
- `qa/`: repo-gestützte Seed-Assets für die Startaufgabe und grundlegende QA-
  Szenarien.

## Befehlsoberfläche

Jeder QA-Ablauf läuft unter `pnpm openclaw qa <subcommand>`. Viele haben `pnpm qa:*`-
Skriptaliase; beide Formen werden unterstützt.

| Befehl                                             | Zweck                                                                                                                                                                |
| --------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `qa run`                                            | Gebündelter QA-Selbstcheck; schreibt einen Markdown-Bericht.                                                                                                                       |
| `qa suite`                                          | Repo-gestützte Szenarien gegen die QA-Gateway-Lane ausführen. Aliase: `pnpm openclaw qa suite --runner multipass` für eine kurzlebige Linux-VM.                                 |
| `qa coverage`                                       | Das Markdown-Inventar zur Szenarioabdeckung ausgeben (`--json` für maschinenlesbare Ausgabe).                                                                                          |
| `qa parity-report`                                  | Zwei `qa-suite-summary.json`-Dateien vergleichen und den agentischen Paritätsbericht schreiben.                                                                                         |
| `qa character-eval`                                 | Das Charakter-QA-Szenario über mehrere Live-Modelle hinweg mit einem bewerteten Bericht ausführen. Siehe [Berichterstattung](#reporting).                                                           |
| `qa manual`                                         | Einen einmaligen Prompt gegen die ausgewählte Provider-/Modell-Lane ausführen.                                                                                                         |
| `qa ui`                                             | Die QA-Debugger-UI und den lokalen QA-Bus starten (Alias: `pnpm qa:lab:ui`).                                                                                                   |
| `qa docker-build-image`                             | Das vorgefertigte QA-Docker-Image bauen.                                                                                                                                    |
| `qa docker-scaffold`                                | Ein docker-compose-Gerüst für das QA-Dashboard und die Gateway-Lane schreiben.                                                                                                   |
| `qa up`                                             | Die QA-Site bauen, den Docker-gestützten Stack starten und die URL ausgeben (Alias: `pnpm qa:lab:up`; Variante `:fast` fügt `--use-prebuilt-image --bind-ui-dist --skip-ui-build` hinzu). |
| `qa aimock`                                         | Nur den AIMock-Provider-Server starten.                                                                                                                                 |
| `qa mock-openai`                                    | Nur den szenariobewussten `mock-openai`-Provider-Server starten.                                                                                                           |
| `qa credentials doctor` / `add` / `list` / `remove` | Den gemeinsamen Convex-Anmeldeinformationspool verwalten.                                                                                                                              |
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
QA-Lab-Seite bereit, auf der ein Operator oder eine Automatisierungsschleife dem
Agenten eine QA-Mission geben, echtes Kanalverhalten beobachten und aufzeichnen
kann, was funktioniert hat, fehlgeschlagen ist oder blockiert blieb.

Für schnellere QA-Lab-UI-Iteration ohne jedes Mal das Docker-Image neu zu bauen,
starten Sie den Stack mit einem bind-gemounteten QA-Lab-Bundle:

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` hält die Docker-Dienste auf einem vorgebauten Image und bind-mountet
`extensions/qa-lab/web/dist` in den Container `qa-lab`. `qa:lab:watch`
baut dieses Bundle bei Änderungen neu, und der Browser lädt automatisch neu,
wenn sich der QA-Lab-Asset-Hash ändert.

Für einen lokalen OpenTelemetry-Trace-Smoke führen Sie aus:

```bash
pnpm qa:otel:smoke
```

Dieses Skript startet einen lokalen OTLP/HTTP-Trace-Empfänger, führt das
QA-Szenario `otel-trace-smoke` mit aktiviertem Plugin `diagnostics-otel` aus, dekodiert dann
die exportierten Protobuf-Spans und prüft die release-kritische Form:
`openclaw.run`, `openclaw.harness.run`, `openclaw.model.call`,
`openclaw.context.assembled` und `openclaw.message.delivery` müssen vorhanden sein;
Modellaufrufe dürfen bei erfolgreichen Turns nicht `StreamAbandoned` exportieren; rohe Diagnose-IDs und
`openclaw.content.*`-Attribute müssen aus dem Trace herausbleiben. Es schreibt
`otel-smoke-summary.json` neben die QA-Suite-Artefakte.

Observability-QA bleibt auf Source-Checkouts beschränkt. Der npm-Tarball lässt
QA Lab absichtlich aus, daher führen Paket-Docker-Release-Lanes keine `qa`-Befehle aus. Verwenden Sie
`pnpm qa:otel:smoke` aus einem gebauten Source-Checkout, wenn Sie die Diagnose-
Instrumentation ändern.

Für eine transportechte Matrix-Smoke-Lane führen Sie aus:

```bash
pnpm openclaw qa matrix --profile fast --fail-fast
```

Die vollständige CLI-Referenz, der Profil-/Szenariokatalog, Umgebungsvariablen und das Artefaktlayout für diese Lane befinden sich in [Matrix-QA](/de/concepts/qa-matrix). Kurz gesagt: Sie provisioniert einen kurzlebigen Tuwunel-Homeserver in Docker, registriert temporäre Treiber-/SUT-/Beobachterbenutzer, führt das echte Matrix-Plugin innerhalb eines untergeordneten QA-Gateway aus, das auf diesen Transport beschränkt ist (kein `qa-channel`), und schreibt dann einen Markdown-Bericht, eine JSON-Zusammenfassung, ein Artefakt mit beobachteten Ereignissen und ein kombiniertes Ausgabelog unter `.artifacts/qa-e2e/matrix-<timestamp>/`.

Für transportechte Telegram- und Discord-Smoke-Lanes:

```bash
pnpm openclaw qa telegram
pnpm openclaw qa discord
```

Beide zielen auf einen bereits vorhandenen echten Kanal mit zwei Bots (Treiber + SUT). Erforderliche Umgebungsvariablen, Szenariolisten, Ausgabeartefakte und der Convex-Anmeldeinformationspool sind unten in der [Telegram- und Discord-QA-Referenz](#telegram-and-discord-qa-reference) dokumentiert.

Bevor Sie gepoolte Live-Anmeldeinformationen verwenden, führen Sie aus:

```bash
pnpm openclaw qa credentials doctor
```

Der Doctor prüft die Convex-Broker-Umgebung, validiert Endpunkteinstellungen und verifiziert die Erreichbarkeit von Admin/List, wenn das Maintainer-Secret vorhanden ist. Er meldet für Secrets nur den Status gesetzt/fehlend.

## Live-Transport-Abdeckung

Live-Transport-Lanes teilen sich einen Vertrag, statt jeweils eine eigene Szenariolistenform zu erfinden. `qa-channel` ist die breite synthetische Suite für Produktverhalten und ist nicht Teil der Live-Transport-Abdeckungsmatrix.

| Lane     | Canary | Mention-Gating | Bot-zu-Bot | Allowlist-Block | Top-Level-Antwort | Neustart-Fortsetzung | Thread-Follow-up | Thread-Isolation | Reaktionsbeobachtung | Hilfebefehl | Native Befehlsregistrierung |
| -------- | ------ | -------------- | ---------- | --------------- | --------------- | -------------- | ---------------- | ---------------- | -------------------- | ------------ | --------------------------- |
| Matrix   | x      | x              | x          | x               | x               | x              | x                | x                | x                    |              |                             |
| Telegram | x      | x              | x          |                 |                 |                |                  |                  |                      | x            |                             |
| Discord  | x      | x              | x          |                 |                 |                |                  |                  |                      |              | x                           |

Dadurch bleibt `qa-channel` die breite Suite für Produktverhalten, während Matrix,
Telegram und künftige Live-Transporte eine gemeinsame explizite Transportvertrags-
Checkliste teilen.

Für eine kurzlebige Linux-VM-Lane, ohne Docker in den QA-Pfad einzubeziehen, führen Sie aus:

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

Dies bootet einen frischen Multipass-Gast, installiert Abhängigkeiten, baut OpenClaw
innerhalb des Gasts, führt `qa suite` aus und kopiert dann den normalen QA-Bericht und die
Zusammenfassung zurück in `.artifacts/qa-e2e/...` auf dem Host.
Es verwendet dasselbe Szenarioauswahlverhalten wie `qa suite` auf dem Host.
Host- und Multipass-Suite-Läufe führen mehrere ausgewählte Szenarien standardmäßig
parallel mit isolierten Gateway-Workern aus. `qa-channel` verwendet standardmäßig Parallelität
4, begrenzt durch die Anzahl der ausgewählten Szenarien. Verwenden Sie `--concurrency <count>`, um
die Worker-Anzahl anzupassen, oder `--concurrency 1` für serielle Ausführung.
Der Befehl beendet sich mit einem Nicht-Null-Code, wenn ein Szenario fehlschlägt. Verwenden Sie `--allow-failures`, wenn
Sie Artefakte ohne fehlschlagenden Exit-Code möchten.
Live-Läufe leiten die unterstützten QA-Authentifizierungseingaben weiter, die für den
Gast praktikabel sind: umgebungsbasierte Provider-Schlüssel, den Pfad zur QA-Live-Provider-Konfiguration und
`CODEX_HOME`, wenn vorhanden. Halten Sie `--output-dir` unter dem Repo-Root, damit der Gast
über den gemounteten Workspace zurückschreiben kann.

## Telegram- und Discord-QA-Referenz

Matrix hat wegen seiner Szenarioanzahl und der Docker-gestützten Homeserver-Provisionierung eine [eigene Seite](/de/concepts/qa-matrix). Telegram und Discord sind kleiner — jeweils eine Handvoll Szenarien, kein Profilsystem, gegen bereits vorhandene echte Kanäle — daher steht ihre Referenz hier.

### Gemeinsame CLI-Flags

Beide Lanes registrieren sich über `extensions/qa-lab/src/live-transports/shared/live-transport-cli.ts` und akzeptieren dieselben Flags:

| Flag                                  | Standardwert                                             | Beschreibung                                                                                                                   |
| ------------------------------------- | -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `--scenario <id>`                     | —                                                        | Nur dieses Szenario ausführen. Wiederholbar.                                                                                   |
| `--output-dir <path>`                 | `<repo>/.artifacts/qa-e2e/{telegram,discord}-<timestamp>` | Ort, an den Berichte/Zusammenfassung/beobachtete Nachrichten und das Ausgabeprotokoll geschrieben werden. Relative Pfade werden relativ zu `--repo-root` aufgelöst. |
| `--repo-root <path>`                  | `process.cwd()`                                          | Repository-Root beim Aufruf aus einem neutralen cwd.                                                                           |
| `--sut-account <id>`                  | `sut`                                                    | Temporäre Konto-ID innerhalb der QA-Gateway-Konfiguration.                                                                     |
| `--provider-mode <mode>`              | `live-frontier`                                          | `mock-openai` oder `live-frontier` (das veraltete `live-openai` funktioniert weiterhin).                                      |
| `--model <ref>` / `--alt-model <ref>` | Provider-Standardwert                                    | Primäre/alternative Modell-Refs.                                                                                               |
| `--fast`                              | aus                                                      | Schneller Provider-Modus, sofern unterstützt.                                                                                  |
| `--credential-source <env\|convex>`   | `env`                                                    | Siehe [Convex-Anmeldeinformationspool](#convex-credential-pool).                                                              |
| `--credential-role <maintainer\|ci>`  | `ci` in CI, andernfalls `maintainer`                     | Rolle, die verwendet wird, wenn `--credential-source convex` gesetzt ist.                                                      |

Beide beenden sich bei jedem fehlgeschlagenen Szenario mit einem Nicht-Null-Exit-Code. `--allow-failures` schreibt Artefakte, ohne einen fehlerhaften Exit-Code zu setzen.

### Telegram-QA

```bash
pnpm openclaw qa telegram
```

Zielt auf eine echte private Telegram-Gruppe mit zwei unterschiedlichen Bots (Driver + SUT). Der SUT-Bot muss einen Telegram-Benutzernamen haben; Bot-zu-Bot-Beobachtung funktioniert am besten, wenn bei beiden Bots der **Bot-zu-Bot-Kommunikationsmodus** in `@BotFather` aktiviert ist.

Erforderliche Env-Variablen bei `--credential-source env`:

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
- `telegram-qa-summary.json` — enthält RTT pro Antwort (Driver sendet → beobachtete SUT-Antwort), beginnend mit dem Canary.
- `telegram-qa-observed-messages.json` — Nachrichtentexte sind redigiert, außer `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1` ist gesetzt.

### Discord-QA

```bash
pnpm openclaw qa discord
```

Zielt auf einen echten privaten Discord-Guild-Kanal mit zwei Bots: einen Driver-Bot, der vom Harness gesteuert wird, und einen SUT-Bot, der durch das untergeordnete OpenClaw-Gateway über das gebündelte Discord-Plugin gestartet wird. Prüft die Verarbeitung von Kanalerwähnungen und dass der SUT-Bot den nativen `/help`-Befehl bei Discord registriert hat.

Erforderliche Env-Variablen bei `--credential-source env`:

- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID` — muss der von Discord zurückgegebenen Benutzer-ID des SUT-Bots entsprechen (andernfalls schlägt die Lane früh fehl).

Optional:

- `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1` behält Nachrichtentexte in Artefakten beobachteter Nachrichten bei.

Szenarien (`extensions/qa-lab/src/live-transports/discord/discord-live.runtime.ts:36`):

- `discord-canary`
- `discord-mention-gating`
- `discord-native-help-command-registration`

Ausgabeartefakte:

- `discord-qa-report.md`
- `discord-qa-summary.json`
- `discord-qa-observed-messages.json` — Nachrichtentexte sind redigiert, außer `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1` ist gesetzt.

### Convex-Anmeldeinformationspool

Sowohl die Telegram- als auch die Discord-Lane können Anmeldeinformationen aus einem gemeinsamen Convex-Pool leasen, statt die obigen Env-Variablen zu lesen. Übergeben Sie `--credential-source convex` (oder setzen Sie `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`); QA Lab erwirbt einen exklusiven Lease, sendet für dessen Dauer Heartbeats und gibt ihn beim Herunterfahren frei. Pool-Arten sind `"telegram"` und `"discord"`.

Payload-Formen, die der Broker bei `admin/add` validiert:

- Telegram (`kind: "telegram"`): `{ groupId: string, driverToken: string, sutToken: string }` — `groupId` muss ein numerischer Chat-ID-String sein.
- Discord (`kind: "discord"`): `{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string }`.

Operative Env-Variablen und der Vertrag des Convex-Broker-Endpunkts stehen in [Testen → Gemeinsame Telegram-Anmeldeinformationen über Convex](/de/help/testing#shared-telegram-credentials-via-convex-v1) (der Abschnittsname stammt aus der Zeit vor der Discord-Unterstützung; die Broker-Semantik ist für beide Arten identisch).

## Repository-gestützte Seeds

Seed-Assets befinden sich in `qa/`:

- `qa/scenarios/index.md`
- `qa/scenarios/<theme>/*.md`

Diese liegen absichtlich in git, damit der QA-Plan sowohl für Menschen als auch für den
Agent sichtbar ist.

`qa-lab` sollte ein generischer Markdown-Runner bleiben. Jede Szenario-Markdown-Datei ist
die Quelle der Wahrheit für einen Testlauf und sollte Folgendes definieren:

- Szenariometadaten
- optionale Kategorie-, Capability-, Lane- und Risikometadaten
- Dokumentations- und Code-Refs
- optionale Plugin-Anforderungen
- optionaler Gateway-Konfigurationspatch
- den ausführbaren `qa-flow`

Die wiederverwendbare Runtime-Oberfläche, die `qa-flow` unterstützt, darf generisch
und übergreifend bleiben. Markdown-Szenarien können beispielsweise transportseitige
Helper mit browserseitigen Helpern kombinieren, die die eingebettete Control UI über die
Gateway-`browser.request`-Schnittstelle steuern, ohne einen Sonderfall-Runner hinzuzufügen.

Szenariodateien sollten nach Produkt-Capability und nicht nach Source-Tree-Ordner
gruppiert werden. Halten Sie Szenario-IDs stabil, wenn Dateien verschoben werden; verwenden Sie `docsRefs` und `codeRefs`
für die Nachverfolgbarkeit der Implementierung.

Die Baseline-Liste sollte breit genug bleiben, um Folgendes abzudecken:

- DM- und Kanal-Chat
- Thread-Verhalten
- Lebenszyklus von Nachrichtenaktionen
- Cron-Callbacks
- Memory-Abruf
- Modellwechsel
- Subagent-Übergabe
- Repository-Lesen und Dokumentations-Lesen
- eine kleine Build-Aufgabe wie Lobster Invaders

## Provider-Mock-Lanes

`qa suite` hat zwei lokale Provider-Mock-Lanes:

- `mock-openai` ist der szenariobewusste OpenClaw-Mock. Er bleibt die standardmäßige
  deterministische Mock-Lane für repository-gestützte QA und Paritäts-Gates.
- `aimock` startet einen AIMock-gestützten Provider-Server für experimentelle Protokoll-,
  Fixture-, Record/Replay- und Chaos-Abdeckung. Er ist additiv und ersetzt den
  `mock-openai`-Szenario-Dispatcher nicht.

Die Provider-Lane-Implementierung befindet sich unter `extensions/qa-lab/src/providers/`.
Jeder Provider besitzt seine Standards, den lokalen Serverstart, die Gateway-Modellkonfiguration,
Anforderungen an das Staging von Auth-Profilen und Live/Mock-Capability-Flags. Gemeinsamer Suite- und
Gateway-Code sollte über die Provider-Registry routen, statt nach Provider-Namen zu verzweigen.

## Transportadapter

`qa-lab` besitzt eine generische Transport-Schnittstelle für Markdown-QA-Szenarien. `qa-channel` ist der erste Adapter an dieser Schnittstelle, aber das Designziel ist breiter: Künftige echte oder synthetische Kanäle sollten sich in denselben Suite-Runner einklinken, statt einen transportspezifischen QA-Runner hinzuzufügen.

Auf Architekturebene lautet die Aufteilung:

- `qa-lab` besitzt generische Szenarioausführung, Worker-Parallelität, Artefaktschreiben und Reporting.
- Der Transportadapter besitzt Gateway-Konfiguration, Bereitschaft, eingehende und ausgehende Beobachtung, Transportaktionen und normalisierten Transportzustand.
- Markdown-Szenariodateien unter `qa/scenarios/` definieren den Testlauf; `qa-lab` stellt die wiederverwendbare Runtime-Oberfläche bereit, die sie ausführt.

### Einen Kanal hinzufügen

Das Hinzufügen eines Kanals zum Markdown-QA-System erfordert genau zwei Dinge:

1. Einen Transportadapter für den Kanal.
2. Ein Szenariopaket, das den Kanalvertrag ausübt.

Fügen Sie keine neue oberste QA-Befehlswurzel hinzu, wenn der gemeinsame `qa-lab`-Host den Ablauf besitzen kann.

`qa-lab` besitzt die gemeinsamen Host-Mechaniken:

- die Befehlswurzel `openclaw qa`
- Start und Teardown der Suite
- Worker-Parallelität
- Artefaktschreiben
- Berichtserzeugung
- Szenarioausführung
- Kompatibilitätsaliases für ältere `qa-channel`-Szenarien

Runner-Plugins besitzen den Transportvertrag:

- wie `openclaw qa <runner>` unter der gemeinsamen `qa`-Wurzel gemountet wird
- wie das Gateway für diesen Transport konfiguriert wird
- wie Bereitschaft geprüft wird
- wie eingehende Ereignisse injiziert werden
- wie ausgehende Nachrichten beobachtet werden
- wie Transkripte und normalisierter Transportzustand offengelegt werden
- wie transportgestützte Aktionen ausgeführt werden
- wie transportspezifisches Zurücksetzen oder Bereinigen gehandhabt wird

Die Mindesthürde für die Übernahme eines neuen Kanals:

1. Behalten Sie `qa-lab` als Besitzer der gemeinsamen `qa`-Wurzel bei.
2. Implementieren Sie den Transport-Runner auf der gemeinsamen `qa-lab`-Host-Schnittstelle.
3. Halten Sie transportspezifische Mechaniken im Runner-Plugin oder Channel-Harness.
4. Mounten Sie den Runner als `openclaw qa <runner>`, statt einen konkurrierenden Root-Befehl zu registrieren. Runner-Plugins sollten `qaRunners` in `openclaw.plugin.json` deklarieren und ein passendes `qaRunnerCliRegistrations`-Array aus `runtime-api.ts` exportieren. Halten Sie `runtime-api.ts` schlank; Lazy-CLI- und Runner-Ausführung sollten hinter separaten Einstiegspunkten bleiben.
5. Erstellen oder adaptieren Sie Markdown-Szenarien unter den thematischen `qa/scenarios/`-Verzeichnissen.
6. Verwenden Sie die generischen Szenario-Helper für neue Szenarien.
7. Halten Sie bestehende Kompatibilitätsaliases funktionsfähig, außer das Repository führt eine absichtliche Migration durch.

Die Entscheidungsregel ist strikt:

- Wenn Verhalten einmal in `qa-lab` ausgedrückt werden kann, legen Sie es in `qa-lab` ab.
- Wenn Verhalten von einem Kanaltransport abhängt, behalten Sie es in diesem Runner-Plugin oder Plugin-Harness.
- Wenn ein Szenario eine neue Capability benötigt, die mehr als ein Kanal verwenden kann, fügen Sie einen generischen Helper hinzu statt eines kanalspezifischen Branches in `suite.ts`.
- Wenn ein Verhalten nur für einen Transport sinnvoll ist, halten Sie das Szenario transportspezifisch und machen Sie das im Szenariovertrag explizit.

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

Kompatibilitätsaliases bleiben für bestehende Szenarien verfügbar — `waitForQaChannelReady`, `waitForOutboundMessage`, `waitForNoOutbound`, `formatConversationTranscript`, `resetBus` —, aber neue Szenarien sollten die generischen Namen verwenden. Die Aliases existieren, um eine Stichtagsmigration zu vermeiden, nicht als Modell für die Zukunft.

## Reporting

`qa-lab` exportiert einen Markdown-Protokollbericht aus der beobachteten Bus-Zeitleiste.
Der Bericht sollte beantworten:

- Was funktioniert hat
- Was fehlgeschlagen ist
- Was blockiert blieb
- Welche Folgeszenarien es wert sind, hinzugefügt zu werden

Für die Übersicht der verfügbaren Szenarien — nützlich, wenn Sie Folgearbeiten abschätzen oder einen neuen Transport verdrahten — führen Sie `pnpm openclaw qa coverage` aus (fügen Sie `--json` für maschinenlesbare Ausgabe hinzu).

Für Zeichen- und Stilprüfungen führen Sie dasselbe Szenario über mehrere Live-Modell-Refs aus
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

Der Befehl führt lokale QA-Gateway-Kindprozesse aus, nicht Docker. Character-Eval-
Szenarien sollten die Persona über `SOUL.md` setzen und dann gewöhnliche Nutzeraktionen
wie Chat, Hilfe im Arbeitsbereich und kleine Dateiaufgaben ausführen. Dem Kandidatenmodell sollte
nicht mitgeteilt werden, dass es evaluiert wird. Der Befehl bewahrt jedes vollständige
Transkript auf, zeichnet grundlegende Laufstatistiken auf und bittet dann die Bewertungsmodelle im Fast-Modus mit
`xhigh`-Reasoning, sofern unterstützt, die Läufe nach Natürlichkeit, Tonalität und Humor zu bewerten.
Verwenden Sie `--blind-judge-models`, wenn Sie Provider vergleichen: Der Bewertungs-Prompt erhält weiterhin
jedes Transkript und jeden Ausführungsstatus, aber Kandidaten-Refs werden durch neutrale
Labels wie `candidate-01` ersetzt; der Bericht ordnet die Ranglisten nach dem
Parsing wieder den echten Refs zu.
Kandidatenläufe verwenden standardmäßig `high` Thinking, mit `medium` für GPT-5.5 und `xhigh`
für ältere OpenAI-Eval-Refs, die es unterstützen. Überschreiben Sie einen bestimmten Kandidaten inline mit
`--model provider/model,thinking=<level>`. `--thinking <level>` setzt weiterhin einen
globalen Fallback, und die ältere Form `--model-thinking <provider/model=level>` wird
aus Kompatibilitätsgründen beibehalten.
OpenAI-Kandidaten-Refs verwenden standardmäßig den Fast-Modus, damit Priority Processing genutzt wird, sofern
der Provider es unterstützt. Fügen Sie inline `,fast`, `,no-fast` oder `,fast=false` hinzu, wenn ein
einzelner Kandidat oder Bewerter eine Überschreibung benötigt. Übergeben Sie `--fast` nur, wenn Sie
den Fast-Modus für jedes Kandidatenmodell erzwingen möchten. Kandidaten- und Bewerterlaufzeiten werden
für Benchmark-Analysen im Bericht aufgezeichnet, aber die Bewertungs-Prompts weisen ausdrücklich an,
nicht nach Geschwindigkeit zu ranken.
Kandidaten- und Bewertungsmodellläufe verwenden beide standardmäßig Parallelität 16. Senken Sie
`--concurrency` oder `--judge-concurrency`, wenn Provider-Limits oder lokaler Gateway-
Druck einen Lauf zu verrauscht machen.
Wenn kein Kandidaten-`--model` übergeben wird, verwendet Character-Eval standardmäßig
`openai/gpt-5.5`, `openai/gpt-5.2`, `openai/gpt-5`, `anthropic/claude-opus-4-6`,
`anthropic/claude-sonnet-4-6`, `zai/glm-5.1`,
`moonshot/kimi-k2.5` und
`google/gemini-3.1-pro-preview`, wenn kein `--model` übergeben wird.
Wenn kein `--judge-model` übergeben wird, verwenden die Bewerter standardmäßig
`openai/gpt-5.5,thinking=xhigh,fast` und
`anthropic/claude-opus-4-6,thinking=high`.

## Zugehörige Dokumentation

- [Matrix-QA](/de/concepts/qa-matrix)
- [QA Channel](/de/channels/qa-channel)
- [Testing](/de/help/testing)
- [Dashboard](/de/web/dashboard)
