---
read_when:
    - Verstehen, wie der QA-Stack zusammenspielt
    - qa-lab, qa-channel oder einen Transportadapter erweitern
    - Hinzufügen repository-gestützter QA-Szenarien
    - Aufbau einer realitätsnäheren QA-Automatisierung rund um das Gateway-Dashboard
summary: 'Überblick über den QA-Stack: qa-lab, qa-channel, Repository-gestützte Szenarien, Live-Transport-Lanes, Transportadapter und Berichterstellung.'
title: QA-Übersicht
x-i18n:
    generated_at: "2026-07-12T21:35:21Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: f82422737f5151bb971e93f830e3e7139c6f60887a33206d5d44259e4f5e51e7
    source_path: concepts/qa-e2e-automation.md
    workflow: 16
---

Der private QA-Stack testet OpenClaw auf realistische, an Channels orientierte Weise, wie es
ein Unit-Test nicht kann.

Bestandteile:

- `extensions/qa-channel`: synthetischer Nachrichten-Channel mit Oberflächen für DMs, Channels, Threads,
  Reaktionen, Bearbeiten und Löschen.
- `extensions/qa-lab`: Debugger-Benutzeroberfläche und QA-Bus zum Beobachten des Transkripts,
  Einspeisen eingehender Nachrichten und Exportieren eines Markdown-Berichts.
- `extensions/qa-matrix`: Live-Transport-Adapter, der das echte Matrix-
  Plugin innerhalb eines untergeordneten QA-Gateways steuert.
- `qa/`: Repository-basierte Ausgangsressourcen für die Startaufgabe und grundlegende QA-
  Szenarien.
- [Mantis](/de/concepts/mantis): Live-Verifizierung vor und nach Änderungen für Fehler, die
  echte Transporte, Browser-Screenshots, VM-Zustand und PR-Nachweise erfordern.

## Befehlsoberfläche

Jeder QA-Ablauf wird unter `pnpm openclaw qa <subcommand>` ausgeführt. Viele verfügen über `pnpm qa:*`-
Skript-Aliasse; beide Formen funktionieren.

| Befehl                                              | Zweck                                                                                                                                                                                                                                                                |
| --------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `qa run`                                            | Gebündelte QA-Selbstprüfung ohne `--qa-profile`; taxonomiebasierter Runner für Reifegradprofile mit `--qa-profile smoke-ci`, `--qa-profile release` oder `--qa-profile all`.                                                                                           |
| `qa suite`                                          | Führt Repository-basierte Szenarien für die QA-Gateway-Lane aus. `--runner multipass` verwendet statt des Hosts eine temporäre Linux-VM.                                                                                                                             |
| `qa coverage`                                       | Gibt das YAML-Inventar der Szenarioabdeckung aus (`--json` für maschinenlesbare Ausgabe; `--match <query>`, um Szenarien für ein betroffenes Verhalten zu finden; `--tools` für die Abdeckung von Runtime-Tool-Fixtures).                                                |
| `qa parity-report`                                  | Vergleicht zwei `qa-suite-summary.json`-Dateien für ein Modellachsen-Paritäts-Gate oder schreibt mit `--runtime-axis --token-efficiency` Berichte zur Runtime-Parität und Token-Effizienz von Codex und OpenClaw.                                                      |
| `qa confidence-report`                              | Klassifiziert QA-Nachweisartefakte anhand eines Manifests in einem Konfidenzbericht ohne unbekannte Ergebnisse.                                                                                                                                                       |
| `qa confidence-self-test`                           | Schreibt vorbereitete Negativkontroll-Canaries, die belegen, dass das Konfidenz-Gate Abweichungen erkennt.                                                                                                                                                            |
| `qa jsonl-replay`                                   | Spielt kuratierte JSONL-Transkripte über das Replay-Testsystem für Runtime-Parität ab.                                                                                                                                                                                |
| `qa character-eval`                                 | Führt das Charakter-QA-Szenario mit mehreren Live-Modellen aus und erstellt einen bewerteten Bericht. Siehe [Berichterstellung](#reporting).                                                                                                                         |
| `qa manual`                                         | Führt einen einmaligen Prompt für die ausgewählte Provider-/Modell-Lane aus.                                                                                                                                                                                          |
| `qa ui`                                             | Startet die QA-Debugger-Benutzeroberfläche und den lokalen QA-Bus (Alias: `pnpm qa:lab:ui`).                                                                                                                                                                         |
| `qa docker-build-image`                             | Erstellt das vorgefertigte QA-Docker-Image.                                                                                                                                                                                                                           |
| `qa docker-scaffold`                                | Schreibt ein Docker-Compose-Grundgerüst für das QA-Dashboard und die Gateway-Lane.                                                                                                                                                                                    |
| `qa up`                                             | Erstellt die QA-Site, startet den Docker-basierten Stack und gibt die URL aus (Alias: `pnpm qa:lab:up`; die Variante `:fast` fügt `--use-prebuilt-image --bind-ui-dist --skip-ui-build` hinzu).                                                                        |
| `qa aimock`                                         | Startet nur den AIMock-Provider-Server.                                                                                                                                                                                                                               |
| `qa mock-openai`                                    | Startet nur den szenariobewussten `mock-openai`-Provider-Server.                                                                                                                                                                                                      |
| `qa credentials doctor` / `add` / `list` / `remove` | Verwaltet den gemeinsam genutzten Convex-Anmeldedaten-Pool.                                                                                                                                                                                                           |
| `qa discord`                                        | Live-Transport-Lane für einen echten privaten Discord-Guild-Channel.                                                                                                                                                                                                  |
| `qa matrix`                                         | Live-Transport-Lane für einen temporären Tuwunel-Homeserver. Siehe [Matrix-QA](/de/concepts/qa-matrix).                                                                                                                                                                  |
| `qa slack`                                          | Live-Transport-Lane für einen echten privaten Slack-Channel.                                                                                                                                                                                                          |
| `qa telegram`                                       | Live-Transport-Lane für eine echte private Telegram-Gruppe.                                                                                                                                                                                                           |
| `qa whatsapp`                                       | Live-Transport-Lane für echte WhatsApp-Web-Konten.                                                                                                                                                                                                                    |
| `qa mantis`                                         | Verifizierungs-Runner für Live-Transport-Fehler vor und nach Änderungen, mit Nachweisen durch Discord-Statusreaktionen, Crabbox-Desktop-/Browser-Smoke-Tests und Slack-in-VNC-Smoke-Tests. Siehe [Mantis](/de/concepts/mantis) und [Mantis-Slack-Desktop-Runbook](/de/concepts/mantis-slack-desktop-runbook). |

`qa matrix` ist als Runner-Plugin (`extensions/qa-matrix`) registriert; jede
andere oben aufgeführte Lane ist direkt in `qa-lab` integriert.

### Profilgestütztes `qa run`

Das profilgestützte `qa run` liest die Zugehörigkeit aus `taxonomy.yaml` und leitet anschließend
die aufgelösten Szenarien über `qa suite` weiter. `--surface` und `--category` filtern
das ausgewählte Profil, anstatt separate Lanes zu definieren. Die resultierende
`qa-evidence.json` enthält eine Scorecard-Zusammenfassung des Profils mit der Anzahl ausgewählter Kategorien
und IDs für fehlende Abdeckung; die einzelnen Nachweiseinträge bleiben die
maßgebliche Quelle für Tests, Abdeckungsrollen und Ergebnisse. Abdeckungs-IDs für Taxonomiemerkmale
sind exakte Nachweisziele, keine Aliasse: Die primäre Szenarioabdeckung
erfüllt übereinstimmende IDs, die sekundäre Abdeckung bleibt lediglich ein Hinweis. Abdeckungs-IDs verwenden
die gepunktete Form `namespace.behavior` mit Segmenten aus Kleinbuchstaben, Ziffern und Bindestrichen;
Profil-, Oberflächen- und Kategorie-IDs können weiterhin die vorhandenen durch Bindestriche oder Punkte getrennten
Taxonomie-IDs verwenden.

Kompakte Nachweise lassen `execution` pro Eintrag aus und setzen `evidenceMode: "slim"`;
`smoke-ci` verwendet standardmäßig den kompakten Modus, und `--evidence-mode full` stellt vollständige Einträge wieder her:

```bash
pnpm openclaw qa run \
  --qa-profile smoke-ci \
  --category channel-framework.conversation-routing-and-delivery \
  --provider-mode mock-openai \
  --output-dir .artifacts/qa-e2e/smoke-ci-profile-dispatch
```

Verwenden Sie `smoke-ci` für deterministische Profilnachweise mit Mock-Modell-Providern und
lokalen Crabline-Provider-Servern. Verwenden Sie `release` für Stable-/LTS-Nachweise für
Live-Channels. Verwenden Sie `all` nur für explizite Nachweisläufe der vollständigen Taxonomie; es
wählt jede aktive Reifegradkategorie aus und kann über den GitHub-Actions-Workflow `QA
Profile Evidence` mit `qa_profile=all` ausgeführt werden. Wenn ein
Befehl außerdem ein OpenClaw-Root-Profil benötigt, setzen Sie das Root-Profil vor den
QA-Befehl:

```bash
pnpm openclaw --profile work qa run --qa-profile smoke-ci
```

## Operatorablauf

Der aktuelle QA-Operatorablauf ist eine zweigeteilte QA-Site:

- Links: Gateway-Dashboard (Control UI) mit dem Agenten.
- Rechts: QA Lab mit dem Slack-ähnlichen Transkript und dem Szenarioplan.

Führen Sie sie wie folgt aus:

```bash
pnpm qa:lab:up
```

Dadurch wird die QA-Site erstellt, die Docker-basierte Gateway-Lane gestartet und
die QA-Lab-Seite bereitgestellt, auf der ein Operator oder eine Automatisierungsschleife dem Agenten eine QA-
Aufgabe geben, echtes Channel-Verhalten beobachten und aufzeichnen kann, was funktioniert hat, fehlgeschlagen ist oder
weiterhin blockiert blieb.

Für schnellere Iterationen an der QA-Lab-Benutzeroberfläche, ohne das Docker-Image jedes Mal neu zu erstellen,
starten Sie den Stack mit einem per Bind-Mount eingebundenen QA-Lab-Bundle:

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` belässt die Docker-Dienste auf einem vorgefertigten Image und
bindet `extensions/qa-lab/web/dist` per Bind-Mount in den Container `qa-lab` ein.
`qa:lab:watch` erstellt dieses Bundle bei Änderungen neu, und der Browser lädt automatisch neu,
wenn sich der Hash der QA-Lab-Ressourcen ändert.

### Observability-Smoke-Tests

<Note>
Observability-QA bleibt auf den Quellcode-Checkout beschränkt. Das npm-Tarball lässt QA Lab
(und `qa-channel`/`qa-matrix`) absichtlich aus, daher führen Docker-Release-Lanes für Pakete
keine `qa`-Befehle aus. Führen Sie diese aus einem erstellten Quellcode-Checkout aus, wenn Sie
die Diagnoseinstrumentierung ändern.
</Note>

| Alias                                   | Ausgeführter Vorgang                                                                                                                     |
| --------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm qa:otel:smoke`                    | Lokaler OpenTelemetry-Empfänger sowie das Szenario `otel-trace-smoke` mit aktiviertem `diagnostics-otel`.                                |
| `pnpm qa:otel:collector-smoke`          | Dieselbe Lane hinter einem echten OpenTelemetry-Collector-Docker-Container. Verwenden Sie sie bei Änderungen an der Endpunktverdrahtung oder der Collector-/OTLP-Kompatibilität. |
| `pnpm qa:prometheus:smoke`              | Das Szenario `docker-prometheus-smoke` mit aktiviertem `diagnostics-prometheus`.                                                         |
| `pnpm qa:observability:smoke`           | `qa:otel:smoke`, gefolgt von `qa:prometheus:smoke`.                                                                                      |
| `pnpm qa:observability:collector-smoke` | `qa:otel:collector-smoke`, gefolgt von `qa:prometheus:smoke`.                                                                            |

`qa:otel:smoke` startet einen lokalen OTLP/HTTP-Empfänger, führt einen
minimalen Agent-Durchlauf im QA-Kanal aus und prüft anschließend, ob Traces,
Metriken und Protokolle exportiert werden. Der Test dekodiert die exportierten
Protobuf-Trace-Spans und prüft die releasekritische Struktur:
`openclaw.run`, `openclaw.harness.run`, ein Modellaufruf-Span nach der neuesten
semantischen GenAI-Konvention, `openclaw.context.assembled` und
`openclaw.message.delivery` müssen alle vorhanden sein. Der Smoke-Test erzwingt
`OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`, daher muss der
Modellaufruf-Span den Namen `{gen_ai.operation.name} {gen_ai.request.model}`
verwenden; Modellaufrufe dürfen bei erfolgreichen Durchläufen nicht
`StreamAbandoned` exportieren; unverarbeitete Diagnose-IDs und Attribute vom
Typ `openclaw.content.*` dürfen nicht im Trace enthalten sein. Der
Szenario-Prompt fordert das Modell auf, mit einer festen Markierung zu antworten
und eine feste geheime Zeichenfolge zurückzuhalten; die unverarbeiteten
OTLP-Nutzdaten dürfen weder diese beiden Werte noch den aus der Szenario-ID
abgeleiteten QA-Sitzungsschlüssel enthalten. Der Test schreibt
`otel-smoke-summary.json` neben die Artefakte der QA-Suite.

`qa:prometheus:smoke` prüft, ob nicht authentifizierte Scrapes abgelehnt
werden, und kontrolliert anschließend, ob der authentifizierte Scrape
releasekritische Metrikfamilien enthält, jedoch keine Prompt-Inhalte,
Antwortinhalte, unverarbeiteten Diagnosekennungen, Authentifizierungstoken oder
lokalen Pfade.

### Matrix-Smoke-Lanes

Führen Sie für eine transportechte Matrix-Smoke-Lane, die keine
Anmeldedaten für einen Modell-Provider benötigt, das schnelle Profil mit dem
deterministischen Mock-OpenAI-Provider aus:

```bash
OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS=3000 \
  pnpm openclaw qa matrix --provider-mode mock-openai --profile fast --fail-fast
```

Geben Sie für die Live-Frontier-Provider-Lane explizit OpenAI-kompatible
Anmeldedaten an:

```bash
OPENCLAW_LIVE_OPENAI_KEY="${OPENAI_API_KEY}" \
OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS=3000 \
  pnpm openclaw qa matrix --provider-mode live-frontier --profile fast --fail-fast
```

Die vollständige CLI-Referenz, der Profil-/Szenariokatalog, die
Umgebungsvariablen und die Artefaktstruktur für diese Lane finden Sie unter
[Matrix-QA](/de/concepts/qa-matrix). Kurz zusammengefasst: Sie stellt einen
temporären Tuwunel-Homeserver in Docker bereit, registriert temporäre
Treiber-/SUT-/Beobachterbenutzer, führt das echte Matrix-Plugin innerhalb
eines untergeordneten QA-Gateways aus, das auf diesen Transport beschränkt ist
(kein `qa-channel`), und schreibt anschließend einen Markdown-Bericht, eine
JSON-Zusammenfassung, ein Artefakt mit beobachteten Ereignissen und ein
kombiniertes Ausgabeprotokoll unter
`.artifacts/qa-e2e/matrix-<timestamp>/`.

Die Szenarien decken Transportverhalten ab, das Unit-Tests nicht
durchgängig nachweisen können: Erwähnungs-Gating, Richtlinien zur Zulassung
von Bots, Zulassungslisten, Antworten auf oberster Ebene und in Threads,
DM-Routing, Reaktionsverarbeitung, Unterdrückung eingehender Bearbeitungen,
Deduplizierung bei der Wiedergabe nach Neustarts, Wiederherstellung nach
Unterbrechungen des Homeservers, Zustellung von Genehmigungsmetadaten,
Medienverarbeitung sowie Abläufe für Bootstrap, Wiederherstellung und
Verifizierung von Matrix E2EE. Das E2EE-CLI-Profil führt außerdem
`openclaw matrix encryption setup` und Verifizierungsbefehle über denselben
temporären Homeserver aus, bevor Gateway-Antworten geprüft werden.

CI verwendet dieselbe Befehlsoberfläche in
`.github/workflows/qa-live-transports-convex.yml`. Geplante und standardmäßige
manuelle Ausführungen führen das schnelle Matrix-Profil mit von QA
bereitgestellten Live-Frontier-Anmeldedaten, `--fast` und
`OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS=3000` aus. Manuelles
`matrix_profile=all` verteilt die Ausführung auf fünf Profil-Shards:
`transport`, `media`, `e2ee-smoke`, `e2ee-deep` und `e2ee-cli`.

### Discord-Mantis-Szenarien

Discord verfügt außerdem über optionale, ausschließlich für Mantis vorgesehene
Szenarien zur Fehlerreproduktion. Verwenden Sie
`--scenario discord-status-reactions-tool-only` für den expliziten zeitlichen
Ablauf der Statusreaktionen oder
`--scenario discord-thread-reply-filepath-attachment`, um einen echten
Discord-Thread zu erstellen und zu überprüfen, ob `message.thread-reply` einen
`filePath`-Anhang beibehält. Diese Szenarien sind nicht Bestandteil der
standardmäßigen Live-Discord-Lane, da sie Vorher-/Nachher-Reproduktionsproben
und keine breite Smoke-Abdeckung darstellen. Der Mantis-Workflow für
Thread-Anhänge kann außerdem ein Video eines angemeldeten Discord-Web-Zeugen
hinzufügen, wenn `MANTIS_DISCORD_VIEWER_CHROME_PROFILE_DIR` oder
`MANTIS_DISCORD_VIEWER_CHROME_PROFILE_TGZ_B64` in der QA-Umgebung konfiguriert
ist. Dieses Betrachterprofil dient ausschließlich der visuellen Erfassung; die
Bestanden-/Fehlgeschlagen-Entscheidung stammt weiterhin vom Discord-REST-Orakel.

Für transportechte Smoke-Lanes für Discord, Slack, Telegram und WhatsApp:

```bash
pnpm openclaw qa discord
pnpm openclaw qa slack
pnpm openclaw qa telegram
pnpm openclaw qa whatsapp
```

Sie verwenden einen bereits vorhandenen echten Kanal mit zwei Bots oder Konten
(Treiber + SUT). Die erforderlichen Umgebungsvariablen, Szenariolisten,
Ausgabeartefakte und der Convex-Anmeldedatenpool sind in der nachstehenden
[QA-Referenz für Discord, Slack, Telegram und WhatsApp](#discord-slack-telegram-and-whatsapp-qa-reference)
dokumentiert.

### Mantis-Runner für Slack Desktop und visuelle Aufgaben

Für einen vollständigen Durchlauf der Slack-Desktop-VM mit VNC-Wiederherstellung führen Sie Folgendes aus:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

Dieser Befehl reserviert einen Crabbox-Desktop-/Browser-Rechner, führt den Slack-Live-
Durchlauf innerhalb der VM aus, öffnet Slack Web im VNC-Browser, zeichnet den Desktop auf
und kopiert `slack-qa/`, `slack-desktop-smoke.png` sowie
`slack-desktop-smoke.mp4` (wenn Videoaufzeichnung verfügbar ist) zurück in das
Mantis-Artefaktverzeichnis. Crabbox-Desktop-/Browser-Leases stellen die Aufzeichnungs-
werkzeuge und Hilfspakete für Browser und native Builds vorab bereit, sodass das Szenario
Fallbacks nur auf älteren Leases installieren sollte. Mantis meldet die Gesamt-
und phasenbezogenen Laufzeiten in `mantis-slack-desktop-smoke-report.md`, sodass bei langsamen Durchläufen
ersichtlich ist, ob Zeit für das Aufwärmen der Lease, den Abruf von Zugangsdaten, die Remote-Einrichtung oder
das Kopieren von Artefakten aufgewendet wurde. Verwenden Sie `--lease-id <cbx_...>` nach der manuellen Anmeldung bei Slack Web
über VNC erneut; wiederverwendete Leases halten außerdem den pnpm-Store-Cache von Crabbox
aufgewärmt. Der Standardwert `--hydrate-mode source` verifiziert aus einem Quellcode-Checkout und
führt Installation und Build innerhalb der VM aus. Verwenden Sie `--hydrate-mode prehydrated` nur, wenn
der wiederverwendete Remote-Arbeitsbereich bereits über `node_modules` und ein erstelltes `dist/`
verfügt; dieser Modus überspringt den aufwendigen Installations-/Build-Schritt und schlägt sicher fehl, wenn der
Arbeitsbereich nicht bereit ist. Mit `--gateway-setup` lässt Mantis ein persistentes
OpenClaw-Slack-Gateway innerhalb der VM auf Port `38973` laufen; ohne diese Option führt der
Befehl den normalen Bot-zu-Bot-Slack-QA-Durchlauf aus und wird nach der
Artefakterfassung beendet.

Um die native Slack-Genehmigungsoberfläche mit Desktop-Nachweisen zu belegen, führen Sie den
Genehmigungsprüfpunktmodus von Mantis aus:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --approval-checkpoints \
  --credential-source convex \
  --credential-role maintainer
```

Dieser Modus schließt sich mit `--gateway-setup` gegenseitig aus. Er führt die Slack-
Genehmigungsszenarien aus, lehnt Szenario-IDs ab, die keine Genehmigungsszenarien sind, wartet bei jedem ausstehenden
und abgeschlossenen Genehmigungsstatus, rendert die beobachtete Slack-API-Nachricht in
`approval-checkpoints/<scenario>-pending.png` und
`approval-checkpoints/<scenario>-resolved.png` und schlägt anschließend fehl, wenn ein Prüfpunkt,
Nachrichtennachweis, eine Bestätigung oder ein gerenderter Screenshot fehlt oder
leer ist. Bei kalten CI-Leases kann in `slack-desktop-smoke.png` weiterhin die Slack-Anmeldung
angezeigt werden; die Bilder der Genehmigungsprüfpunkte bilden den visuellen
Nachweis für diesen Durchlauf.

Der standardmäßige Prüfpunktdurchlauf behält die beiden standardmäßigen Slack-Genehmigungsszenarien bei.
Um eine der optionalen Codex-Genehmigungsrouten zu erfassen, wählen Sie sie ausdrücklich mit
`--scenario slack-codex-approval-exec-native` oder
`--scenario slack-codex-approval-plugin-native` aus; Mantis akzeptiert beide und erzeugt
dasselbe Paar aus Screenshots für den ausstehenden und abgeschlossenen Status. Der Runner verlängert seine Prüfpunkt-
und Remote-Befehlsfristen für jede ausgewählte Codex-Route, damit die vollständige
Genehmigungs-, Agentenabschluss- und Aktualisierungssequenz des abgeschlossenen Status beendet werden kann.

Die Checkliste für Operatoren, der Dispatch-Befehl für den GitHub-Workflow, der Vertrag für Nachweiskommentare,
die Entscheidungstabelle für den Hydratisierungsmodus, die Interpretation der Laufzeiten und die Schritte zur
Fehlerbehandlung finden Sie im
[Runbook für Mantis Slack Desktop](/de/concepts/mantis-slack-desktop-runbook).

Für eine Desktop-Aufgabe im Agenten-/Computer-Vision-Stil führen Sie Folgendes aus:

```bash
pnpm openclaw qa mantis visual-task \
  --browser-url https://example.net \
  --expect-text "Example Domain" \
  --vision-model openai/gpt-5.6-luna
```

`visual-task` reserviert oder verwendet eine Crabbox-Desktop-/Browser-Maschine erneut, startet
`crabbox record --while`, steuert den sichtbaren Browser über einen verschachtelten
`visual-driver`, erfasst `visual-task.png`, führt `openclaw infer image
describe` für den Screenshot aus, wenn `--vision-mode image-describe`
ausgewählt ist, und schreibt `visual-task.mp4`, `mantis-visual-task-summary.json`,
`mantis-visual-task-driver-result.json` und
`mantis-visual-task-report.md`. Wenn `--expect-text` festgelegt ist, fordert der Vision-Prompt
ein strukturiertes JSON-Urteil (`visible`, `evidence`, `reason`) an
und ist nur erfolgreich, wenn das Modell `visible: true` mit Belegen meldet, die
den erwarteten Text zitieren; eine Antwort mit `visible: false`, die lediglich den
Zieltext zitiert, lässt die Prüfung weiterhin fehlschlagen. Verwenden Sie `--vision-mode metadata` für einen
modellfreien Smoke-Test, der die Funktionsfähigkeit von Desktop, Browser, Screenshot und Video
nachweist, ohne einen Provider für Bildverständnis aufzurufen. Die Aufzeichnung ist ein
erforderliches Artefakt für `visual-task`; wenn Crabbox keine nicht leere
`visual-task.mp4` aufzeichnet, schlägt die Aufgabe fehl, selbst wenn der visuelle Treiber erfolgreich war. Bei
einem Fehlschlag behält Mantis die Reservierung für VNC bei, es sei denn, die Aufgabe war bereits erfolgreich
und `--keep-lease` wurde nicht festgelegt.

### Integritätsprüfung des Zugangsdatenpools

Führen Sie vor der Verwendung gepoolter Live-Zugangsdaten Folgendes aus:

```bash
pnpm openclaw qa credentials doctor
```

Der Doctor prüft die Umgebungsvariablen des Convex-Brokers (`OPENCLAW_QA_CONVEX_SITE_URL`,
`OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX`), validiert die Endpunkteinstellungen, meldet
für `OPENCLAW_QA_CONVEX_SECRET_CI` und
`OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` ausschließlich den Status „gesetzt“ oder „fehlend“ und
überprüft die Erreichbarkeit von Administration und Auflistung, wenn das Maintainer-Secret vorhanden ist.

## Live-Transportabdeckung

Live-Transport-Lanes verwenden einen gemeinsamen Vertrag, anstatt jeweils eine eigene
Form der Szenarioliste zu erfinden. `qa-channel` ist die umfassende synthetische Suite für das Produktverhalten
und gehört nicht zur Abdeckungsmatrix für Live-Transporte.

Live-Transport-Runner importieren die gemeinsamen Szenario-IDs, Hilfsfunktionen für die
Baseline-Abdeckung und die Hilfsfunktion zur Szenarioauswahl aus
`openclaw/plugin-sdk/qa-live-transport-scenarios`.

| Lane     | Canary | Erwähnungs-Gating | Bot-zu-Bot | Allowlist-Blockierung | Antwort auf oberster Ebene | Zitierte Antwort | Fortsetzung nach Neustart | Thread-Fortsetzung | Thread-Isolierung | Reaktionsbeobachtung | Hilfebefehl | Native Befehlsregistrierung |
| -------- | ------ | ----------------- | ---------- | --------------------- | --------------------------- | ---------------- | -------------------------- | ------------------- | ------------------- | ---------------------- | ------------ | ---------------------------- |
| Discord  | x      | x                 | x          |                       |                             |                  |                            |                     |                     |                        |              | x                            |
| Matrix   | x      | x                 | x          | x                     | x                           |                  | x                          | x                   | x                   | x                      |              |                              |
| Slack    | x      | x                 | x          | x                     | x                           |                  | x                          | x                   | x                   |                        |              |                              |
| Telegram | x      | x                 | x          |                       |                             |                  |                            |                     |                     |                        | x            |                              |
| WhatsApp | x      | x                 |            | x                     | x                           | x                | x                          |                     |                     | x                      | x            |                              |

Dadurch bleibt `qa-channel` die umfassende Suite für das Produktverhalten, während Matrix,
Telegram und die anderen Live-Transporte eine gemeinsame, explizite
Checkliste für den Transportvertrag verwenden.

Führen Sie für eine temporäre Linux-VM-Lane, ohne Docker in den QA-Pfad einzubinden, Folgendes aus:

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

Dadurch wird ein neuer Multipass-Gast gestartet, Abhängigkeiten werden installiert und OpenClaw
wird im Gast gebaut. Anschließend wird `qa suite` ausgeführt und danach werden der normale QA-Bericht und
die Zusammenfassung zurück in `.artifacts/qa-e2e/...` auf dem Host kopiert. Dabei wird dasselbe
Verhalten zur Szenarioauswahl wie bei `qa suite` auf dem Host verwendet.

Suite-Ausführungen auf dem Host und in Multipass führen standardmäßig mehrere ausgewählte Szenarien
parallel mit isolierten Gateway-Workern aus. `qa-channel` verwendet standardmäßig
eine Parallelität von 4, begrenzt durch die Anzahl der ausgewählten Szenarien. Verwenden Sie `--concurrency
<count>`, um die Worker-Anzahl anzupassen, oder `--concurrency 1` für die serielle Ausführung.
Verwenden Sie `--pack personal-agent`, um das Benchmark-Paket für persönliche Assistenten (10
Szenarien) auszuführen. Der Paketauswähler ist mit wiederholten `--scenario`-Flags additiv:
Explizite Szenarien werden zuerst ausgeführt, anschließend die Paketszenarien in Paketreihenfolge,
wobei Duplikate entfernt werden. Verwenden Sie `--pack observability`, um die Szenarien
`otel-trace-smoke` und `docker-prometheus-smoke` gemeinsam auszuwählen, wenn ein
benutzerdefinierter QA-Runner bereits die Einrichtung des OpenTelemetry-Collectors bereitstellt.

Der Befehl wird mit einem Exit-Code ungleich null beendet, wenn ein Szenario fehlschlägt. Verwenden Sie `--allow-failures`,
wenn Sie Artefakte ohne einen fehleranzeigenden Exit-Code erhalten möchten.

Live-Ausführungen leiten die unterstützten QA-Authentifizierungseingaben weiter, die für den
Gast praktikabel sind: umgebungsbasierte Provider-Schlüssel, den Pfad zur QA-Live-Provider-Konfiguration und,
falls vorhanden, `CODEX_HOME`. Lassen Sie `--output-dir` unterhalb des Repository-Stammverzeichnisses, damit der
Gast über den eingebundenen Workspace zurückschreiben kann.

## QA-Referenz für Discord, Slack, Telegram und WhatsApp

Matrix verfügt aufgrund der Anzahl seiner Szenarien und der Docker-gestützten
Homeserver-Bereitstellung über eine [eigene Seite](/de/concepts/qa-matrix). Discord, Slack, Telegram
und WhatsApp werden mit bereits vorhandenen realen Transporten ausgeführt, daher befindet sich ihre Referenz
hier.

### Gemeinsame CLI-Flags

Diese Lanes werden über
`extensions/qa-lab/src/live-transports/shared/live-transport-cli.ts` registriert und
akzeptieren dieselben Flags:

| Flag                                  | Standardwert                                       | Beschreibung                                                                                                                                                                           |
| ------------------------------------- | -------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--scenario <id>`                     | -                                                  | Führt nur dieses Szenario aus. Wiederholbar.                                                                                                                                           |
| `--output-dir <path>`                 | `<repo>/.artifacts/qa-e2e/<transport>-<timestamp>` | Gibt an, wohin Berichte, Zusammenfassungen, Nachweise, transportspezifische Artefakte und das Ausgabeprotokoll geschrieben werden. Relative Pfade werden relativ zu `--repo-root` aufgelöst. |
| `--repo-root <path>`                  | `process.cwd()`                                    | Repository-Stammverzeichnis beim Aufruf aus einem neutralen aktuellen Arbeitsverzeichnis.                                                                                              |
| `--sut-account <id>`                  | `sut`                                              | Temporäre Konto-ID innerhalb der QA-Gateway-Konfiguration.                                                                                                                             |
| `--provider-mode <mode>`              | `live-frontier`                                    | `mock-openai` oder `live-frontier` (das veraltete `live-openai` funktioniert weiterhin).                                                                                               |
| `--model <ref>` / `--alt-model <ref>` | Provider-Standardwert                              | Primäre/alternative Modellreferenzen.                                                                                                                                                  |
| `--fast`                              | aus                                                | Schneller Provider-Modus, sofern unterstützt.                                                                                                                                          |
| `--credential-source <env\|convex>`   | `env`                                              | Siehe [Convex-Anmeldedatenpool](#convex-credential-pool).                                                                                                                              |
| `--credential-role <maintainer\|ci>`  | `ci` in CI, andernfalls `maintainer`               | Verwendete Rolle, wenn `--credential-source convex` gesetzt ist.                                                                                                                       |

Jede Lane wird bei einem fehlgeschlagenen Szenario mit einem Exit-Code ungleich null beendet. `--allow-failures` schreibt
Artefakte, ohne einen fehleranzeigenden Exit-Code zu setzen. Telegram akzeptiert außerdem
`--list-scenarios`, um verfügbare Szenario-IDs auszugeben und das Programm zu beenden; die anderen Lanes
stellen dieses Flag nicht bereit.

### Telegram-QA

```bash
pnpm openclaw qa telegram
```

Verwendet eine reale private Telegram-Gruppe mit zwei unterschiedlichen Bots (Treiber +
SUT). Der SUT-Bot muss einen Telegram-Benutzernamen besitzen; die Bot-zu-Bot-Beobachtung funktioniert
am besten, wenn bei beiden Bots **Bot-to-Bot Communication Mode** in
`@BotFather` aktiviert ist.

Erforderliche Umgebungsvariablen bei `--credential-source env`:

- `OPENCLAW_QA_TELEGRAM_GROUP_ID` - numerische Chat-ID (Zeichenfolge).
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
- `telegram-tool-only-usage-footer`
- `telegram-reply-chain-exact-marker`
- `telegram-stream-final-single-message`
- `telegram-long-final-reuses-preview`
- `telegram-long-final-three-chunks`

Die implizite Standardauswahl deckt immer Canary, Erwähnungs-Gating, Antworten auf native Befehle,
Befehlsadressierung und Bot-zu-Bot-Gruppenantworten ab. Die Standardwerte für `mock-openai`
umfassen außerdem deterministische Prüfungen für Antwortketten und das Streaming der finalen Nachricht.
`telegram-current-session-status-tool` und
`telegram-tool-only-usage-footer` bleiben optional: Ersteres ist nur stabil,
wenn es unmittelbar nach Canary ausgeführt wird, und Letzteres ist ein Nachweis mit realem Telegram
für die `/usage`-Fußzeile bei reinen Tool-Antworten. Verwenden Sie `pnpm openclaw qa telegram
--list-scenarios --provider-mode mock-openai`, um die aktuelle
Aufteilung in standardmäßige und optionale Szenarien mit Regressionsreferenzen auszugeben.

Ausgabeartefakte:

- `telegram-qa-report.md`
- `qa-evidence.json` - Nachweiseinträge für die Live-Transportprüfungen,
  einschließlich Feldern für Profil, Abdeckung, Provider, Kanal, Artefakte, Ergebnis und RTT.

Telegram-Paketausführungen verwenden denselben Vertrag für Telegram-Anmeldedaten. Wiederholte RTT-
Messungen sind Teil der normalen Telegram-Live-Lane des Pakets; die RTT-
Verteilung wird für die ausgewählte RTT-Prüfung unter `result.timing` in
`qa-evidence.json` aufgenommen.

```bash
OPENCLAW_QA_CREDENTIAL_SOURCE=convex \
pnpm test:docker:npm-telegram-live
```

Wenn `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` gesetzt ist, reserviert der Live-Wrapper des Pakets
Anmeldedaten des Typs `kind: "telegram"`, exportiert die reservierten Umgebungsvariablen für Gruppe, Treiber und SUT-
Bot in die Ausführung des installierten Pakets, sendet Heartbeats für die Reservierung und gibt sie
beim Herunterfahren frei. Der Paket-Wrapper verwendet standardmäßig 20 RTT-Prüfungen von
`telegram-mentioned-message-reply`, ein RTT-Zeitlimit von 30s und außerhalb von CI die Convex-Rolle
`maintainer`, wenn Convex ausgewählt ist. Überschreiben Sie
`OPENCLAW_NPM_TELEGRAM_RTT_SAMPLES`, `OPENCLAW_NPM_TELEGRAM_RTT_TIMEOUT_MS`
oder `OPENCLAW_NPM_TELEGRAM_RTT_MAX_FAILURES`, um die RTT-Messung anzupassen, ohne
einen separaten RTT-Befehl oder ein Telegram-spezifisches Zusammenfassungsformat zu erstellen.

### Discord-QA

```bash
pnpm openclaw qa discord
```

Verwendet einen realen privaten Discord-Guild-Kanal mit zwei Bots: einen vom
Harness gesteuerten Treiber-Bot und einen SUT-Bot, der vom untergeordneten OpenClaw-Gateway
über das gebündelte Discord-Plugin gestartet wird. Überprüft die Verarbeitung von Kanalerwähnungen, ob
der SUT-Bot den nativen Befehl `/help` bei Discord registriert hat, sowie
optionale Mantis-Nachweisszenarien.

Erforderliche Umgebungsvariablen bei `--credential-source env`:

- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID` - muss mit der von Discord zurückgegebenen
  Benutzer-ID des SUT-Bots übereinstimmen (andernfalls bricht die Lane sofort mit einem Fehler ab).

Optional:

- `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1` behält Nachrichtentexte in
  Artefakten beobachteter Nachrichten bei.
- `OPENCLAW_QA_DISCORD_VOICE_CHANNEL_ID` wählt den Sprach-/Bühnenkanal für
  `discord-voice-autojoin` aus; ohne diese Variable wählt das Szenario den ersten für
  den SUT-Bot sichtbaren Sprach-/Bühnenkanal aus.

Szenarien (`extensions/qa-lab/src/live-transports/discord/discord-live.runtime.ts:36`):

- `discord-canary`
- `discord-mention-gating`
- `discord-native-help-command-registration`
- `discord-voice-autojoin` - optionales Sprachszenario. Wird eigenständig ausgeführt, aktiviert
  `channels.discord.voice.autoJoin` und überprüft, ob der aktuelle
  Discord-Sprachstatus des SUT-Bots dem Ziel-Sprach-/Bühnenkanal entspricht. Convex-Discord-
  Anmeldedaten können optional `voiceChannelId` enthalten; andernfalls ermittelt der Runner
  den ersten sichtbaren Sprach-/Bühnenkanal in der Guild.
- `discord-status-reactions-tool-only` - optionales Mantis-Szenario. Wird
  eigenständig ausgeführt, da es das SUT auf stets aktive, reine Tool-Guild-Antworten
  mit `messages.statusReactions.enabled=true` umstellt und anschließend eine REST-
  Reaktionszeitleiste sowie visuelle HTML-/PNG-Artefakte erfasst. Vorher-/Nachher-
  Berichte von Mantis bewahren außerdem vom Szenario bereitgestellte MP4-Artefakte als `baseline.mp4`
  und `candidate.mp4` auf.
- `discord-thread-reply-filepath-attachment` - optionales Mantis-Szenario; siehe
  [Discord-Mantis-Szenarien](#discord-mantis-scenarios).

Führen Sie das Szenario für den automatischen Beitritt zu einem Discord-Sprachkanal explizit aus:

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
  --model openai/gpt-5.6-luna \
  --alt-model openai/gpt-5.6-luna \
  --fast
```

Ausgabeartefakte:

- `discord-qa-report.md`
- `qa-evidence.json` – Evidenzeinträge für die Live-Transportprüfungen.
- `discord-qa-observed-messages.json` – Inhalte geschwärzt, sofern nicht
  `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1` gesetzt ist.
- `discord-qa-reaction-timelines.json` und
  `discord-status-reactions-tool-only-timeline.png`, wenn das
  Statusreaktionsszenario ausgeführt wird.

### Slack-QA

```bash
pnpm openclaw qa slack
```

Zielt auf einen echten privaten Slack-Kanal mit zwei unterschiedlichen Bots:
einen vom Harness gesteuerten Driver-Bot und einen SUT-Bot, der vom
untergeordneten OpenClaw-Gateway über das gebündelte Slack-Plugin gestartet
wird.

Erforderliche Umgebungsvariablen bei `--credential-source env`:

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`

Optional:

- `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1` behält Nachrichteninhalte in
  Artefakten mit beobachteten Nachrichten bei.
- `OPENCLAW_QA_SLACK_APPROVAL_CHECKPOINT_DIR` aktiviert visuelle
  Genehmigungsprüfpunkte für Mantis. Der Runner schreibt
  `<scenario>.pending.json` und `<scenario>.resolved.json` und wartet
  anschließend auf die passenden `.ack.json`-Dateien.
- `OPENCLAW_QA_SLACK_APPROVAL_CHECKPOINT_TIMEOUT_MS` überschreibt das Zeitlimit
  für die Bestätigung des Prüfpunkts. Der Standardwert ist `120000`.

Kanonische YAML-Szenarien, die über den Slack-Live-Adapter bereitgestellt werden:

- `thread-follow-up`
- `thread-isolation`

Imperative Slack-Szenarien (`extensions/qa-lab/src/live-transports/slack/slack-live.runtime.ts`):

- `slack-canary`
- `slack-mention-gating`
- `slack-allowlist-block`
- `slack-top-level-reply-shape`
- `slack-restart-resume`
- `slack-progress-commentary-true`, `slack-progress-commentary-false`,
  `slack-progress-commentary-omitted` und
  `slack-progress-commentary-verbose-dedupe` – optionale Prüfungen im echten
  Slack für unabhängige Steuerelemente zu Kommentaren und Werkzeugfortschritt,
  den Legacy-Standardwert bei ausgelassenem Schlüssel sowie die einmalige
  Zustellung, wenn dauerhafter ausführlicher Fortschritt aktiviert ist.
- `slack-reaction-glyph-native` – optionales Live-Szenario für Reaktionen über
  das Nachrichtenwerkzeug. Weist den Agenten an, exakt das Symbol `✅` zu
  übergeben, und bestätigt, dass Slack für den SUT-Bot bei der Zielnachricht
  `white_check_mark` gespeichert hat.
- `slack-chart-presentation-native` – optionales portables Diagrammszenario,
  das den nativen Block `data_visualization` und den exakten barrierefreien
  Text überprüft.
- `slack-table-presentation-native` – optionales portables Tabellenszenario,
  das den nativen Block `data_table`, die exakten Zeilen und den barrierefreien
  Text überprüft.
- `slack-table-invalid-blocks-fallback` – optionales direktes
  Transportszenario, das eine strukturell lesbare, den Grenzwert
  überschreitende Rohtabelle mit 101 Datenzeilen plus Kopfzeile über den
  produktiven Slack-Sendepfad sendet, nachweist, dass Slack selbst
  `invalid_blocks` zurückgibt, und überprüft, dass der gespeicherte Fallback
  mit deaktivierter Formatierung vollständig ist und keinen nativen
  Datenblock enthält. Der Bericht enthält nur sichere Evidenz zu Fehlercode,
  Anzahl und booleschen Werten; der rohe synthetische Tabellentext richtet
  sich nach `OPENCLAW_QA_SLACK_CAPTURE_CONTENT`.
- `slack-approval-exec-native` – optionales natives Slack-Szenario für die
  Ausführungsgenehmigung. Fordert über das Gateway eine
  Ausführungsgenehmigung an, überprüft, dass die Slack-Nachricht native
  Genehmigungsschaltflächen enthält, löst sie auf und überprüft die
  aktualisierte Slack-Nachricht nach der Auflösung.
- `slack-approval-plugin-native` – optionales natives Slack-Szenario für die
  Plugin-Genehmigung. Aktiviert die Weiterleitung von Ausführungs- und
  Plugin-Genehmigungen gemeinsam, damit Plugin-Ereignisse nicht durch das
  Routing von Ausführungsgenehmigungen unterdrückt werden, und überprüft
  anschließend denselben nativen Slack-UI-Pfad für ausstehende und aufgelöste
  Genehmigungen.
- `slack-codex-approval-exec-native` – optionales Codex-Guardian-Szenario für
  die Befehlsgenehmigung. Aktiviert das Codex-Plugin im Guardian-Modus, leitet
  einen von Slack stammenden Gateway-Agentendurchlauf durch das
  Codex-App-Server-Harness, wartet auf die native Genehmigungsaufforderung des
  Slack-Plugins für `openclaw-codex-app-server`, löst sie auf und überprüft,
  dass der Codex-Durchlauf mit den erwarteten Markierungen für Befehlsausgabe
  und Assistent abgeschlossen wird.
- `slack-codex-approval-plugin-native` – optionales Codex-Guardian-Szenario für
  die Dateigenehmigung. Verwendet eine `apply_patch`-Anweisung außerhalb des
  Arbeitsbereichs, damit Codex den App-Server-Pfad zur Genehmigung von
  Dateiänderungen ausgibt, und überprüft anschließend denselben nativen
  Slack-Pfad für ausstehende und aufgelöste Genehmigungen, die abschließende
  Assistentenmarkierung sowie den exakten Dateiinhalt vor der Bereinigung.

Die Codex-Genehmigungsszenarien erfordern ein `openai/*`- oder `codex/*`-Modell
für `--model`, die normalen Anmeldedaten für das Live-Modell sowie eine vom
Codex-Plugin akzeptierte Codex-Authentifizierung oder API-Schlüssel-Authentifizierung.
Der Slack-Bericht enthält neben den geschwärzten Slack-Genehmigungsmetadaten
die Codex-App-Server-Methode, den ausgewählten Codex-Modellschlüssel, den
abschließenden Status des Codex-Durchlaufs und die Überprüfung der
Operationsmarkierungen.

Ausgabeartefakte:

- `slack-qa-report.md`
- `qa-evidence.json` – Evidenzeinträge für die Live-Transportprüfungen.
- `slack-qa-observed-messages.json` – Inhalte geschwärzt, sofern nicht
  `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1` gesetzt ist.
- `approval-checkpoints/` – nur wenn Mantis
  `OPENCLAW_QA_SLACK_APPROVAL_CHECKPOINT_DIR` setzt; enthält Prüfpunkt-JSON,
  Bestätigungs-JSON sowie Screenshots des ausstehenden und aufgelösten
  Zustands.

#### Slack-Arbeitsbereich einrichten

Die Lane benötigt zwei unterschiedliche Slack-Apps in einem Arbeitsbereich
sowie einen Kanal, in dem beide Bots Mitglied sind:

- `channelId` – die `Cxxxxxxxxxx`-ID eines Kanals, in den beide Bots eingeladen
  wurden. Verwenden Sie einen dedizierten Kanal; die Lane veröffentlicht bei
  jedem Durchlauf Nachrichten.
- `driverBotToken` – Bot-Token (`xoxb-...`) der **Driver**-App.
- `sutBotToken` – Bot-Token (`xoxb-...`) der **SUT**-App, die eine von der
  Driver-App getrennte Slack-App sein muss, damit ihre Bot-Benutzer-ID
  eindeutig ist.
- `sutAppToken` – Token auf App-Ebene (`xapp-...`) der SUT-App mit
  `connections:write`, das von Socket Mode verwendet wird, damit die SUT-App
  Ereignisse empfangen kann.

Bevorzugen Sie einen für die QA vorgesehenen Slack-Arbeitsbereich, statt einen
Produktionsarbeitsbereich wiederzuverwenden.

Das nachstehende SUT-Manifest beschränkt die produktive Installation des
gebündelten Slack-Plugins (`extensions/slack/src/setup-shared.ts:12`) bewusst
auf die Berechtigungen und Ereignisse, die von der Live-Slack-QA-Suite
abgedeckt werden. Informationen zur Einrichtung des Produktionskanals aus
Benutzersicht finden Sie unter
[Slack-Kanal – Schnelleinrichtung](/de/channels/slack#quick-setup); das
QA-Driver/SUT-Paar ist bewusst getrennt, da die Lane zwei unterschiedliche
Bot-Benutzer-IDs in einem Arbeitsbereich benötigt.

**1. Driver-App erstellen**

Öffnen Sie [api.slack.com/apps](https://api.slack.com/apps) → _Create New App_
→ _From a manifest_ → wählen Sie den QA-Arbeitsbereich aus, fügen Sie das
folgende Manifest ein und wählen Sie anschließend _Install to Workspace_:

```json
{
  "display_information": {
    "name": "OpenClaw QA Driver",
    "description": "Testtreiber-Bot für die OpenClaw-QA-Live-Lane für Slack"
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

Kopieren Sie das _Bot User OAuth Token_ (`xoxb-...`) – dieses wird zu
`driverBotToken`. Der Driver muss lediglich Nachrichten veröffentlichen und
sich identifizieren; keine Ereignisse, kein Socket Mode.

**2. SUT-App erstellen**

Wiederholen Sie _Create New App → From a manifest_ im selben Workspace. Diese QA-App
verwendet absichtlich eine eingeschränktere Version des Produktionsmanifests
des gebündelten Slack-Plugins (`extensions/slack/src/setup-shared.ts:12`):
Reaktions-Scopes und -Ereignisse werden weggelassen, da die Live-Slack-QA-Suite
die Reaktionsverarbeitung noch nicht abdeckt.

```json
{
  "display_information": {
    "name": "OpenClaw QA SUT",
    "description": "OpenClaw-QA-SUT-Konnektor für OpenClaw"
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

- _Install to Workspace_ → kopieren Sie das _Bot User OAuth Token_ → dieses wird zu
  `sutBotToken`.
- _Basic Information → App-Level Tokens → Generate Token and Scopes_ → fügen Sie
  den Scope `connections:write` hinzu → speichern Sie → kopieren Sie den Wert `xapp-...` → dieser
  wird zu `sutAppToken`.

Überprüfen Sie, dass die beiden Bots unterschiedliche Benutzer-IDs haben, indem Sie
für jedes Token `auth.test` aufrufen. Die Runtime unterscheidet Driver und SUT anhand
der Benutzer-ID; wenn Sie dieselbe App für beide verwenden, schlägt die Mention-Zugriffskontrolle
sofort fehl.

**3. Channel erstellen**

Erstellen Sie im QA-Workspace einen Channel (z. B. `#openclaw-qa`) und laden Sie
beide Bots direkt im Channel ein:

```text
/invite @OpenClaw QA Driver
/invite @OpenClaw QA SUT
```

Kopieren Sie die ID `Cxxxxxxxxxx` aus _channel info → About → Channel ID_ – diese
wird zu `channelId`. Ein öffentlicher Channel funktioniert; wenn Sie einen privaten
Channel verwenden, verfügen beide Apps bereits über `groups:history`, sodass die
Verlaufsabfragen des Harness weiterhin erfolgreich sind.

**4. Anmeldedaten registrieren**

Es gibt zwei Optionen. Verwenden Sie Umgebungsvariablen zum Debuggen auf einem
einzelnen Rechner (legen Sie die vier Variablen `OPENCLAW_QA_SLACK_*` fest und
übergeben Sie `--credential-source env`) oder befüllen Sie den gemeinsam genutzten
Convex-Pool, damit CI und andere Maintainer sie leasen können.

Schreiben Sie für den Convex-Pool die vier Felder in eine JSON-Datei:

```json
{
  "channelId": "Cxxxxxxxxxx",
  "driverBotToken": "xoxb-...",
  "sutBotToken": "xoxb-...",
  "sutAppToken": "xapp-..."
}
```

Wenn `OPENCLAW_QA_CONVEX_SITE_URL` und `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`
in Ihrer Shell exportiert sind, registrieren und überprüfen Sie die Zugangsdaten:

```bash
pnpm openclaw qa credentials add \
  --kind slack \
  --payload-file slack-creds.json \
  --note "Seed für den QA-Slack-Pool"

pnpm openclaw qa credentials list --kind slack --status all --json
```

Erwartet werden `count: 1`, `status: "active"` und kein Feld `lease`.

**5. Ende-zu-Ende-Funktion überprüfen**

Führen Sie die Lane lokal aus, um zu bestätigen, dass beide Bots über den
Broker miteinander kommunizieren können:

```bash
pnpm openclaw qa slack \
  --credential-source convex \
  --credential-role maintainer \
  --output-dir .artifacts/qa-e2e/slack-local
```

Ein erfolgreicher Durchlauf ist in deutlich weniger als 30 Sekunden abgeschlossen, und `slack-qa-report.md`
zeigt sowohl für `slack-canary` als auch für `slack-mention-gating` den Status `pass`. Wenn die
Lane etwa 90 Sekunden lang hängt und mit `Convex credential pool exhausted
for kind "slack"` beendet wird, ist entweder der Pool leer oder jede Zeile ist ausgeliehen – `qa
credentials list --kind slack --status all --json` zeigt Ihnen, welcher Fall vorliegt.

### WhatsApp-QA

```bash
pnpm openclaw qa whatsapp
```

Verwendet zwei dedizierte WhatsApp-Web-Konten: ein vom
Harness gesteuertes Treiberkonto und ein SUT-Konto, das vom untergeordneten OpenClaw-Gateway über
das gebündelte WhatsApp-Plugin gestartet wird.

Erforderliche Umgebungsvariablen bei `--credential-source env`:

- `OPENCLAW_QA_WHATSAPP_DRIVER_PHONE_E164`
- `OPENCLAW_QA_WHATSAPP_SUT_PHONE_E164`
- `OPENCLAW_QA_WHATSAPP_DRIVER_AUTH_ARCHIVE_BASE64`
- `OPENCLAW_QA_WHATSAPP_SUT_AUTH_ARCHIVE_BASE64`

Optional:

- `OPENCLAW_QA_WHATSAPP_GROUP_JID` aktiviert Gruppenszenarien wie
  `whatsapp-mention-gating`, `whatsapp-group-pending-history-context`,
  `whatsapp-broadcast-group-fanout`, `whatsapp-group-activation-always`,
  `whatsapp-group-reply-to-bot-triggers`, Gruppenaktions-/Medien-/Umfrageszenarien
  und `whatsapp-group-allowlist-block`.
- `OPENCLAW_QA_WHATSAPP_CAPTURE_CONTENT=1` behält Nachrichtentexte in
  Artefakten beobachteter Nachrichten bei.

Szenariokatalog (`extensions/qa-lab/src/live-transports/whatsapp/whatsapp-live.runtime.ts`):

- Basis- und Gruppenzugriffskontrolle: `whatsapp-canary`, `whatsapp-pairing-block`,
  `whatsapp-mention-gating`, `whatsapp-group-pending-history-context`,
  `whatsapp-group-activation-always`, `whatsapp-group-reply-to-bot-triggers`,
  `whatsapp-top-level-reply-shape`, `whatsapp-restart-resume`,
  `whatsapp-group-allowlist-block`.
- Native Befehle: `whatsapp-help-command`, `whatsapp-status-command`,
  `whatsapp-commands-command`, `whatsapp-tools-compact-command`,
  `whatsapp-whoami-command`, `whatsapp-context-command`,
  `whatsapp-native-new-command`.
- Antwort- und Endausgabeverhalten: `whatsapp-tool-only-usage-footer`,
  `whatsapp-reply-to-message`, `whatsapp-group-reply-to-message`,
  `whatsapp-reply-to-mode-batched`, `whatsapp-reply-context-isolation`,
  `whatsapp-reply-delivery-shape`, `whatsapp-stream-final-message-accounting`.
- Nachrichtenaktionen im Benutzerpfad: `whatsapp-agent-message-action-react` beginnt
  mit einer echten Direktnachricht des Treibers, lässt das Modell das Werkzeug `message`
  aufrufen und beobachtet die native WhatsApp-Reaktion. `whatsapp-agent-message-action-upload-file`
  verwendet denselben Ansatz für `message(action=upload-file)` und beobachtet
  native WhatsApp-Medien. `whatsapp-group-agent-message-action-react` und
  `whatsapp-group-agent-message-action-upload-file` weisen dieselben
  benutzersichtbaren Aktionen in einer echten WhatsApp-Gruppe nach.
- Gruppen-Fanout: `whatsapp-broadcast-group-fanout` beginnt mit einer erwähnenden
  WhatsApp-Gruppennachricht und verifiziert unterschiedliche sichtbare Antworten von `main`
  und `qa-second`.
- Gruppenaktivierung: `whatsapp-group-activation-always` ändert eine echte
  Gruppensitzung zu `/activation always`, weist nach, dass eine Gruppennachricht ohne
  Erwähnung den Agenten aktiviert, und stellt anschließend `/activation mention` wieder her.
  `whatsapp-group-reply-to-bot-triggers` legt eine Bot-Antwort an, sendet darauf eine
  native zitierte Antwort ohne explizite Erwähnung und verifiziert, dass der Agent
  durch diesen Antwortkontext aktiviert wird.
- Eingehende Medien und strukturierte Nachrichten: `whatsapp-inbound-image-caption`,
  `whatsapp-audio-preflight`, `whatsapp-inbound-structured-messages`,
  `whatsapp-group-audio-gating`, `whatsapp-inbound-reaction-no-trigger`.
  Diese senden echte WhatsApp-Bild-, Audio-, Dokument-, Standort-, Kontakt-,
  Sticker- und Reaktionsereignisse über den Treiber.
- Direkte Gateway-Vertragsprüfungen: `whatsapp-outbound-media-matrix`,
  `whatsapp-outbound-document-preserves-filename`, `whatsapp-outbound-poll`,
  `whatsapp-outbound-send-serialization`,
  `whatsapp-group-outbound-media`, `whatsapp-group-outbound-poll`,
  `whatsapp-message-actions`, `whatsapp-reply-context-isolation`,
  `whatsapp-reply-delivery-shape`. Diese umgehen bewusst Modell-Prompting
  und weisen deterministische Verträge für Gateway/Kanal-`send`, `poll` und
  `message.action` nach.
- Abdeckung der Zugriffskontrolle: `whatsapp-access-control-dm-open`,
  `whatsapp-access-control-dm-disabled`, `whatsapp-access-control-group-open`,
  `whatsapp-access-control-group-disabled`, `whatsapp-group-allowlist-block`.
- Native Genehmigungen: `whatsapp-approval-exec-deny-native`,
  `whatsapp-approval-exec-native`, `whatsapp-approval-exec-reaction-native`,
  `whatsapp-approval-exec-group-reaction-native`,
  `whatsapp-approval-plugin-native`.
- Statusreaktionen: `whatsapp-status-reactions`,
  `whatsapp-status-reaction-lifecycle`.

Der Katalog enthält derzeit 52 Szenarien. Die Standard-Lane `live-frontier`
bleibt für schnelle Smoke-Abdeckung mit 10 Szenarien klein. Die Standard-Lane
`mock-openai` führt 45 Szenarien deterministisch über den echten WhatsApp-
Transport aus und simuliert dabei nur die Modellausgabe; Genehmigungsszenarien
und einige aufwendigere/blockierende Prüfungen bleiben explizit über die Szenario-ID auswählbar.

Der WhatsApp-QA-Treiber beobachtet strukturierte Live-Ereignisse (`text`, `media`,
`location`, `reaction` und `poll`) und kann aktiv Medien, Umfragen,
Kontakte, Standorte und Sticker senden. QA Lab importiert diesen Treiber über die
Paketoberfläche `@openclaw/whatsapp/api.js`, statt auf private
WhatsApp-Laufzeitdateien zuzugreifen. Bei Gruppenbeobachtungen ist `fromJid` die Gruppen-JID,
während `participantJid` und `fromPhoneE164` den sendenden Teilnehmer identifizieren.
Nachrichteninhalte werden standardmäßig geschwärzt. Direkte Gateway-Prüfungen für Umfragen,
Datei-Uploads, Medien, Gruppenumfragen, Gruppenmedien und Antwortformate sind
Transport-/API-Vertragsprüfungen; sie gelten nicht als Nachweis dafür, dass eine
Benutzereingabe den Agenten dieselbe Aktion auswählen ließ. Der Nachweis von Aktionen
im Benutzerpfad stammt aus Szenarien wie `whatsapp-agent-message-action-react` und
`whatsapp-group-agent-message-action-react`, bei denen der Treiber eine normale
WhatsApp-Nachricht sendet und QA Lab das daraus resultierende native WhatsApp-Artefakt beobachtet.
WhatsApp-Berichte enthalten die Ausrichtung jedes Szenarios (`user-path`,
`direct-gateway` oder `native-approval`), damit Nachweise nicht fälschlich als
stärkerer Vertrag verstanden werden, als sie tatsächlich belegen.

Ausgabeartefakte:

- `whatsapp-qa-report.md`
- `qa-evidence.json` – Nachweiseinträge für die Prüfungen des Live-Transports.
- `whatsapp-qa-observed-messages.json` – Texte geschwärzt, sofern nicht
  `OPENCLAW_QA_WHATSAPP_CAPTURE_CONTENT=1` gesetzt ist.

### Convex-Zugangsdatenpool

Discord-, Slack-, Telegram- und WhatsApp-Lanes können Zugangsdaten aus einem
gemeinsamen Convex-Pool leasen, statt die oben genannten Umgebungsvariablen zu lesen. Übergeben Sie
`--credential-source convex` (oder setzen Sie `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`);
QA Lab erwirbt eine exklusive Lease, sendet während der gesamten Laufzeit
Heartbeats dafür und gibt sie beim Herunterfahren frei. Die Pool-Arten sind `"discord"`, `"slack"`,
`"telegram"` und `"whatsapp"`.

Payload-Strukturen, die der Broker bei `admin/add` validiert:

- Discord (`kind: "discord"`): `{ guildId: string, channelId: string,
driverBotToken: string, sutBotToken: string, sutApplicationId: string }`.
- Telegram (`kind: "telegram"`): `{ groupId: string, driverToken: string,
sutToken: string }` – `groupId` muss eine numerische Chat-ID-Zeichenfolge sein.
- Echter Telegram-Benutzer (`kind: "telegram-user"`): `{ groupId: string, sutToken:
string, testerUserId: string, testerUsername: string, telegramApiId:
string, telegramApiHash: string, tdlibDatabaseEncryptionKey: string,
tdlibArchiveBase64: string, tdlibArchiveSha256: string,
desktopTdataArchiveBase64: string, desktopTdataArchiveSha256: string }` –
  nur für den Mantis-Telegram-Desktop-Nachweis. Allgemeine QA-Lab-Lanes dürfen
  diese Art nicht erwerben.
- WhatsApp (`kind: "whatsapp"`): `{ driverPhoneE164: string, sutPhoneE164:
string, driverAuthArchiveBase64: string, sutAuthArchiveBase64: string,
groupJid?: string }` – Telefonnummern müssen unterschiedliche E.164-Zeichenfolgen sein.

Der Mantis-Telegram-Desktop-Nachweisworkflow hält eine exklusive Convex-
`telegram-user`-Lease sowohl für den TDLib-CLI-Treiber als auch für den Telegram-Desktop-
Beobachter und gibt sie nach der Veröffentlichung des Nachweises frei.

Wenn ein PR einen deterministischen visuellen Diff benötigt, kann Mantis dieselbe simulierte
Modellantwort auf `main` und auf dem PR-Head verwenden, während sich der Telegram-Formatierer
oder die Zustellungsschicht ändert. Die Aufnahmestandards sind für PR-Kommentare optimiert:
Standard-Crabbox-Klasse, Desktop-Aufzeichnung mit 24fps, Bewegungs-GIF mit 24fps und
1920px Vorschau-Breite. Vorher-/Nachher-Kommentare sollten ein sauberes Paket veröffentlichen,
das nur die vorgesehenen GIFs enthält.

Slack-Lanes können den Pool ebenfalls verwenden. Die Prüfung der Slack-Payload-Struktur
befindet sich derzeit im Slack-QA-Runner statt im Broker; verwenden Sie `{ channelId: string,
driverBotToken: string, sutBotToken: string, sutAppToken: string }` mit einer
Slack-Kanal-ID wie `Cxxxxxxxxxx`. Informationen zur Bereitstellung von App und
Berechtigungsumfängen finden Sie unter
[Einrichten des Slack-Arbeitsbereichs](#setting-up-the-slack-workspace).

Betriebliche Umgebungsvariablen und der Endpunktvertrag des Convex-Brokers sind unter
[Testen → Gemeinsame Telegram-Zugangsdaten über Convex](/de/help/testing#shared-telegram-credentials-via-convex-v1)
beschrieben (der Abschnittsname stammt aus der Zeit vor dem Mehrkanal-Pool; die Lease-Semantik
wird von allen Arten gemeinsam verwendet).

## Repository-gestützte Seeds

Seed-Assets befinden sich in `qa/`:

- `qa/scenarios/index.yaml`
- `qa/scenarios/<theme>/*.yaml`

Diese befinden sich absichtlich in Git, damit der QA-Plan sowohl für Menschen als auch
für den Agenten sichtbar ist.

`qa-lab` bleibt ein generischer YAML-Szenario-Runner. Jede Szenario-YAML-Datei ist die
maßgebliche Quelle für einen Testlauf und sollte Folgendes definieren:

- `title` auf oberster Ebene
- `scenario`-Metadaten
- optionale Kategorie-, Capability-, Lane- und Risikometadaten in `scenario`
- Dokumentations- und Codereferenzen in `scenario`
- optionale Plugin-Anforderungen in `scenario`
- optionaler Gateway-Konfigurations-Patch in `scenario`
- ausführbarer `flow` auf oberster Ebene für Flow-Szenarien oder
  `scenario.execution.kind` / `scenario.execution.path` für Vitest- und
  Playwright-Szenarien

Die wiederverwendbare Runtime-Oberfläche, auf der `flow` basiert, bleibt generisch und
querschnittlich. YAML-Szenarien können beispielsweise transportseitige
Hilfsfunktionen mit browserseitigen Hilfsfunktionen kombinieren, die die eingebettete Control UI über
die Gateway-Schnittstelle `browser.request` steuern, ohne einen Sonderfall-Runner hinzuzufügen.

Szenariodateien sollten nach Produkt-Capability statt nach Ordnern des
Quellbaums gruppiert werden. Halten Sie Szenario-IDs stabil, wenn Dateien verschoben werden; verwenden Sie `docsRefs` und
`codeRefs` für die Nachverfolgbarkeit der Implementierung.

Die Baseline-Liste sollte breit genug bleiben, um Folgendes abzudecken:

- Direktnachrichten- und Kanal-Chat
- Thread-Verhalten
- Lebenszyklus von Nachrichtenaktionen
- Cron-Callbacks
- Erinnerungsabruf
- Modellwechsel
- Übergabe an Subagenten
- Lesen von Repository und Dokumentation
- eine kleine Build-Aufgabe wie Lobster Invaders

## Provider-Mock-Lanes

`qa suite` verfügt über zwei lokale Provider-Mock-Lanes:

- `mock-openai` ist der szenariobewusste OpenClaw-Mock. Er bleibt die standardmäßige
  deterministische Mock-Lane für Repository-gestützte QA und Paritäts-Gates.
- `aimock` startet einen AIMock-basierten Provider-Server für experimentelle
  Protokoll-, Fixture-, Aufzeichnungs-/Wiedergabe- und Chaos-Abdeckung. Er ist additiv und
  ersetzt nicht den Szenario-Dispatcher `mock-openai`.

Die Implementierung der Provider-Lanes befindet sich unter `extensions/qa-lab/src/providers/`.
Jeder Provider ist für seine Standardwerte, den Start des lokalen Servers, die Gateway-Modellkonfiguration,
die Anforderungen an die Bereitstellung von Authentifizierungsprofilen sowie Live-/Mock-Capability-Flags verantwortlich. Gemeinsam genutzter Suite- und
Gateway-Code wird über die Provider-Registry geleitet, statt anhand von
Provider-Namen zu verzweigen.

## Transportadapter

`qa-lab` stellt eine generische Transportschnittstelle für YAML-QA-Szenarien bereit. `qa-channel` ist
der synthetische Standard. `crabline` startet lokale, Provider-artige Server und
führt die normalen Kanal-Plugins von OpenClaw gegen sie aus. `live` ist für
echte Provider-Anmeldedaten und externe Kanäle vorgesehen.

Auf Architekturebene ist die Aufteilung wie folgt:

- `qa-lab` ist für die generische Szenarioausführung, Worker-Parallelität, das Schreiben von
  Artefakten und die Berichterstellung verantwortlich.
- Der Transportadapter ist für Gateway-Konfiguration, Bereitschaft, eingehende und ausgehende
  Beobachtung, Transportaktionen und normalisierten Transportstatus verantwortlich.
- YAML-Szenariodateien unter `qa/scenarios/` definieren den Testlauf; `qa-lab`
  stellt die wiederverwendbare Runtime-Oberfläche bereit, die sie ausführt.

### Kanal hinzufügen

Das Hinzufügen eines Kanals zum YAML-QA-System erfordert die Kanalimplementierung
sowie ein Szenariopaket, das den Kanalvertrag prüft. Fügen Sie für die Smoke-CI-
Abdeckung den passenden lokalen Crabline-Provider-Server hinzu und stellen Sie ihn
über den Treiber `crabline` bereit.

Fügen Sie keinen neuen QA-Befehlsstamm auf oberster Ebene hinzu, wenn der gemeinsam genutzte `qa-lab`-Host
den Ablauf übernehmen kann.

`qa-lab` ist für die gemeinsam genutzten Host-Mechanismen verantwortlich:

- den Befehlsstamm `openclaw qa`
- Start und Herunterfahren der Suite
- Worker-Parallelität
- Schreiben von Artefakten
- Berichterstellung
- Szenarioausführung
- Kompatibilitätsaliase für ältere `qa-channel`-Szenarien

Runner-Plugins sind für den Transportvertrag verantwortlich:

- wie `openclaw qa <runner>` unterhalb der gemeinsamen `qa`-Wurzel eingebunden wird
- wie das Gateway für diesen Transport konfiguriert wird
- wie die Bereitschaft geprüft wird
- wie eingehende Ereignisse eingespeist werden
- wie ausgehende Nachrichten beobachtet werden
- wie Transkripte und der normalisierte Transportstatus bereitgestellt werden
- wie transportgestützte Aktionen ausgeführt werden
- wie transportspezifisches Zurücksetzen oder Bereinigen gehandhabt wird

Die Mindestanforderungen für die Aufnahme eines neuen Kanals:

1. Behalten Sie `qa-lab` als Eigentümer der gemeinsamen `qa`-Wurzel bei.
2. Implementieren Sie den Transport-Runner an der gemeinsamen Host-Schnittstelle von `qa-lab`.
3. Belassen Sie transportspezifische Mechanismen im Runner-Plugin oder Kanal-
   Harness.
4. Binden Sie den Runner als `openclaw qa <runner>` ein, anstatt einen
   konkurrierenden Wurzelbefehl zu registrieren. Runner-Plugins sollten `qaRunners` in
   `openclaw.plugin.json` deklarieren und ein entsprechendes Array
   `qaRunnerCliRegistrations` aus `runtime-api.ts` exportieren. Halten Sie `runtime-api.ts`
   schlank; verzögerte CLI- und Runner-Ausführung sollten hinter separaten
   Einstiegspunkten verbleiben. Eine optionale `adapterFactory` stellt den Transport
   gemeinsamen Szenarien bereit, ohne den bestehenden Szenariokatalog des
   Befehls zu ändern.
5. Erstellen oder adaptieren Sie YAML-Szenarien in den thematisch gegliederten
   Verzeichnissen unter `qa/scenarios/`.
6. Verwenden Sie für neue Szenarien die generischen Szenario-Hilfsfunktionen.
7. Halten Sie bestehende Kompatibilitätsaliase funktionsfähig, sofern das Repository
   keine beabsichtigte Migration durchführt.

Die Entscheidungsregel ist strikt:

- Wenn ein Verhalten einmalig in `qa-lab` ausgedrückt werden kann, gehört es in `qa-lab`.
- Wenn ein Verhalten von einem einzelnen Kanaltransport abhängt, belassen Sie es in diesem Runner-
  Plugin oder Plugin-Harness.
- Wenn ein Szenario eine neue Fähigkeit benötigt, die von mehreren Kanälen verwendet werden kann,
  fügen Sie eine generische Hilfsfunktion hinzu, anstatt einen kanalspezifischen Zweig in `suite.ts` einzufügen.
- Wenn ein Verhalten nur für einen Transport sinnvoll ist, halten Sie das Szenario
  transportspezifisch und machen Sie dies im Szenariovertrag explizit.

### Namen der Szenario-Hilfsfunktionen

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

Kompatibilitätsaliase bleiben für bestehende Szenarien verfügbar:
`waitForQaChannelReady`, `waitForOutboundMessage`, `waitForNoOutbound`,
`formatConversationTranscript`, `resetBus`; beim Erstellen neuer Szenarien
sollten jedoch die generischen Namen verwendet werden. Die Aliase dienen dazu, eine
Migration zu einem festen Stichtag zu vermeiden, und sind nicht das Modell für die Zukunft.

## Berichterstellung

`qa-lab` exportiert einen Markdown-Protokollbericht aus der beobachteten Bus-Zeitleiste.
Der Bericht sollte folgende Fragen beantworten:

- Was funktioniert hat
- Was fehlgeschlagen ist
- Was weiterhin blockiert blieb
- Welche Folgeszenarien sich hinzuzufügen lohnen

Um eine Bestandsaufnahme der verfügbaren Szenarien zu erhalten – hilfreich für die Abschätzung von Folgearbeiten
oder die Anbindung eines neuen Transports –, führen Sie `pnpm openclaw qa coverage` aus (fügen Sie `--json`
für eine maschinenlesbare Ausgabe hinzu). Wenn Sie einen gezielten Nachweis für ein betroffenes
Verhalten oder einen Dateipfad auswählen, führen Sie `pnpm openclaw qa coverage --match <query>` aus. Der
Trefferbericht durchsucht Szenariometadaten, Dokumentationsreferenzen, Codereferenzen, Abdeckungs-IDs,
Plugins und Provider-Anforderungen und gibt anschließend passende Ziele für `qa suite
--scenario ...` aus.

Jeder Lauf von `qa suite` schreibt die übergeordneten Artefakte `qa-evidence.json`,
`qa-suite-summary.json` und `qa-suite-report.md` für die ausgewählte
Szenariomenge. Szenarien, die `execution.kind: vitest` oder
`execution.kind: playwright` deklarieren, führen den entsprechenden Testpfad aus und schreiben außerdem
szenariospezifische Protokolle. Szenarien, die `execution.kind: script` deklarieren, führen den
Nachweisgenerator unter `execution.path` über `node --import tsx` aus (wobei
`${outputDir}` und `${scenarioId}` in `execution.args` expandiert werden); der
Generator schreibt seine eigene `qa-evidence.json`, deren Einträge in die
Suite-Ausgabe importiert und deren Artefaktpfade relativ zu dieser
`qa-evidence.json` des Generators aufgelöst werden. Wenn `qa suite` über `qa run
--qa-profile` erreicht wird, enthält dieselbe `qa-evidence.json` außerdem die
Scorecard-Zusammenfassung des Profils für die ausgewählten Taxonomiekategorien.

Behandeln Sie die Abdeckungsausgabe als Hilfsmittel zur Ermittlung, nicht als Ersatz für Gates; das
ausgewählte Szenario benötigt weiterhin den richtigen Provider-Modus, einen Live-Transport,
Multipass, Testbox oder eine Release-Lane für das zu testende Verhalten. Den
Scorecard-Kontext finden Sie unter [Reifegrad-Scorecard](/de/maturity/scorecard).

Führen Sie für Charakter- und Stilprüfungen dasselbe Szenario mit mehreren Live-
Modellreferenzen aus und erstellen Sie einen bewerteten Markdown-Bericht:

```bash
pnpm openclaw qa character-eval \
  --model openai/gpt-5.6-luna,thinking=medium,fast \
  --model openai/gpt-5.2,thinking=xhigh \
  --model openai/gpt-5,thinking=xhigh \
  --model anthropic/claude-opus-4-8,thinking=high \
  --model anthropic/claude-sonnet-4-6,thinking=high \
  --model zai/glm-5.1,thinking=high \
  --model moonshot/kimi-k2.5,thinking=high \
  --model google/gemini-3.1-pro-preview,thinking=high \
  --judge-model openai/gpt-5.6-sol,thinking=xhigh,fast \
  --judge-model anthropic/claude-opus-4-8,thinking=high \
  --blind-judge-models \
  --concurrency 16 \
  --judge-concurrency 16
```

Der Befehl führt untergeordnete Prozesse des lokalen QA-Gateways aus, nicht Docker. Szenarien zur
Charakterbewertung sollten die Persona über `SOUL.md` festlegen und anschließend gewöhnliche
Benutzerinteraktionen wie Chat, Hilfe zum Arbeitsbereich und kleine Dateiaufgaben ausführen. Dem Kandidatenmodell
sollte nicht mitgeteilt werden, dass es bewertet wird. Der Befehl bewahrt
jedes vollständige Transkript auf, zeichnet grundlegende Laufstatistiken auf und fordert anschließend die Bewertungsmodelle im
Schnellmodus mit `xhigh`-Reasoning, sofern unterstützt, dazu auf, die Läufe nach
Natürlichkeit, Ausstrahlung und Humor zu ordnen. Verwenden Sie `--blind-judge-models` beim Vergleich von
Providern: Der Bewertungsprompt erhält weiterhin jedes Transkript und jeden Laufstatus, aber
Kandidatenreferenzen werden durch neutrale Bezeichnungen wie `candidate-01` ersetzt; der
Bericht ordnet die Ranglisten nach der Auswertung wieder den tatsächlichen Referenzen zu.

Kandidatenläufe verwenden standardmäßig `high`-Thinking, bei GPT-5.6 Luna `medium` und
bei älteren OpenAI-Bewertungsreferenzen, die dies unterstützen, `xhigh`. Überschreiben Sie die Einstellung für einen bestimmten
Kandidaten inline mit `--model provider/model,thinking=<level>`; Inline-
Optionen unterstützen außerdem `fast`, `no-fast` und `fast=<bool>`. `--thinking
<level>` legt weiterhin einen globalen Fallback fest, und die ältere Form `--model-thinking
<provider/model=level>` bleibt aus Kompatibilitätsgründen erhalten. OpenAI-Kandidatenreferenzen
verwenden standardmäßig den Schnellmodus, damit die priorisierte Verarbeitung genutzt wird, sofern der Provider
sie unterstützt. Übergeben Sie `--fast` nur, wenn Sie den Schnellmodus für
jedes Kandidatenmodell erzwingen möchten. Die Laufzeiten von Kandidaten und Bewertern werden für die
Benchmark-Analyse im Bericht aufgezeichnet, die Bewertungsprompts weisen jedoch ausdrücklich an, nicht
nach Geschwindigkeit zu ordnen. Modellläufe von Kandidaten und Bewertern verwenden beide standardmäßig eine Parallelität von 16.
Verringern Sie `--concurrency` oder `--judge-concurrency`, wenn Provider-Limits oder die lokale
Gateway-Auslastung einen Lauf zu stark verfälschen.

Wenn kein Kandidat über `--model` übergeben wird, verwendet die Charakterbewertung standardmäßig
`openai/gpt-5.6-luna`, `openai/gpt-5.2`, `openai/gpt-5`,
`anthropic/claude-opus-4-8`, `anthropic/claude-sonnet-4-6`, `zai/glm-5.1`,
`moonshot/kimi-k2.5` und `google/gemini-3.1-pro-preview`. Wenn kein
`--judge-model` übergeben wird, sind die Standardbewerter
`openai/gpt-5.6-sol,thinking=xhigh,fast` und
`anthropic/claude-opus-4-8,thinking=high`.

## Verwandte Dokumentation

- [Matrix-QA](/de/concepts/qa-matrix)
- [Reifegrad-Scorecard](/de/maturity/scorecard)
- [Benchmark-Paket für persönliche Agenten](/de/concepts/personal-agent-benchmark-pack)
- [QA-Kanal](/de/channels/qa-channel)
- [Tests](/de/help/testing)
- [Dashboard](/de/web/dashboard)
