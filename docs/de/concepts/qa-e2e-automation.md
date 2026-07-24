---
doc-schema-version: 1
read_when:
    - Verstehen, wie der QA-Stack zusammenspielt
    - qa-lab, qa-channel oder einen Transportadapter erweitern
    - Repository-gestützte QA-Szenarien hinzufügen
    - Aufbau einer realitätsnäheren QA-Automatisierung rund um das Gateway-Dashboard
summary: 'Überblick über den QA-Stack: qa-lab, qa-channel, Repository-gestützte Szenarien, Live-Transport-Lanes, Transportadapter und Berichterstellung.'
title: QA-Übersicht
x-i18n:
    generated_at: "2026-07-24T04:31:41Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 91c34a50e6197195d57228d92b19caff1785ceaa5d82d7c88a1ec0ed76abd635
    source_path: concepts/qa-e2e-automation.md
    workflow: 16
---

Der private QA-Stack testet OpenClaw auf realistische, kanaltypische Weise, wie es
ein Unit-Test nicht kann.

Komponenten:

- `extensions/qa-channel`: synthetischer Nachrichtenkanal mit Oberflächen für Direktnachrichten, Kanäle, Threads,
  Reaktionen, Bearbeitungen und Löschungen.
- `extensions/qa-lab`: Debugger-UI, QA-Bus, Szenarioprofile und Live-
  Transportadapter zum Beobachten des Transkripts, Einspeisen eingehender Nachrichten
  und Exportieren eines Markdown-Berichts.
- `qa/`: Repository-gestützte Seed-Assets für die Auftaktaufgabe und grundlegende QA-
  Szenarien.
- [Mantis](/de/concepts/mantis): Vorher-/Nachher-Live-Verifizierung für Fehler, die
  echte Transportwege, Browser-Screenshots, VM-Zustand und PR-Nachweise erfordern.

## Befehlsoberfläche

Jeder QA-Ablauf wird unter `pnpm openclaw qa <subcommand>` ausgeführt. Viele verfügen über `pnpm qa:*`-
Skriptaliase; beide Formen funktionieren.

| Befehl                                             | Zweck                                                                                                                                                                                                                                                             |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `qa run`                                            | Gebündelte QA-Selbstprüfung ohne `--qa-profile`; taxonomiegestützter Runner für Reifegradprofile mit `--qa-profile smoke-ci`, `--qa-profile release` oder `--qa-profile all`.                                                                                                  |
| `qa suite`                                          | Repository-gestützte Szenarien gegen die QA-Gateway-Lane ausführen. `--runner multipass` verwendet anstelle des Hosts eine temporäre Linux-VM.                                                                                                                                         |
| `qa coverage`                                       | Das YAML-Inventar der Szenarioabdeckung ausgeben (`--json` für maschinenlesbare Ausgabe; `--match <query>`, um Szenarien für ein betroffenes Verhalten zu finden; `--tools` für die Abdeckung von Runtime-Tool-Fixtures).                                                                                  |
| `qa parity-report`                                  | Zwei `qa-suite-summary.json`-Dateien für ein Paritäts-Gate entlang der Modellachse vergleichen oder mit `--runtime-axis --token-efficiency` Berichte zur Runtime-Parität und Token-Effizienz von Codex gegenüber OpenClaw schreiben.                                                                          |
| `qa confidence-report`                              | QA-Nachweisartefakte anhand eines Manifests in einen Konfidenzbericht ohne unbekannte Elemente klassifizieren.                                                                                                                                                                               |
| `qa confidence-self-test`                           | Seed-basierte Negativkontroll-Canarys schreiben, die belegen, dass das Konfidenz-Gate Abweichungen erkennt.                                                                                                                                                                                   |
| `qa jsonl-replay`                                   | Kuratierte JSONL-Transkripte über das Wiedergabe-Harness für Runtime-Parität wiedergeben.                                                                                                                                                                                         |
| `qa character-eval`                                 | Das Charakter-QA-Szenario mit mehreren Live-Modellen und einem bewerteten Bericht ausführen. Siehe [Berichterstellung](#reporting).                                                                                                                                                        |
| `qa manual`                                         | Einen einmaligen Prompt gegen die ausgewählte Provider-/Modell-Lane ausführen.                                                                                                                                                                                                      |
| `qa ui`                                             | Die QA-Debugger-UI und den lokalen QA-Bus starten (Alias: `pnpm qa:lab:ui`).                                                                                                                                                                                                |
| `qa docker-build-image`                             | Das vorgefertigte QA-Docker-Image erstellen.                                                                                                                                                                                                                                 |
| `qa docker-scaffold`                                | Ein Docker-Compose-Grundgerüst für die QA-Dashboard- und Gateway-Lane schreiben.                                                                                                                                                                                                |
| `qa up`                                             | Die QA-Site erstellen, den Docker-gestützten Stack starten und die URL ausgeben (Alias: `pnpm qa:lab:up`; die Variante `:fast` fügt `--use-prebuilt-image --bind-ui-dist --skip-ui-build` hinzu).                                                                                              |
| `qa aimock`                                         | Nur den AIMock-Provider-Server starten.                                                                                                                                                                                                                              |
| `qa mock-openai`                                    | Nur den szenariobewussten `mock-openai`-Provider-Server starten.                                                                                                                                                                                                        |
| `qa credentials doctor` / `add` / `list` / `remove` | Den gemeinsam genutzten Convex-Anmeldedaten-Pool verwalten.                                                                                                                                                                                                                           |
| `qa discord`                                        | Live-Transport-Lane gegen einen echten privaten Discord-Guild-Kanal.                                                                                                                                                                                                   |
| `qa matrix`                                         | QA-Lab-Matrix-Profile gegen einen temporären Tuwunel-Homeserver. Siehe [Matrix-Smoke-Lanes](#matrix-smoke-lanes).                                                                                                                                                      |
| `qa slack`                                          | Live-Transport-Lane gegen einen echten privaten Slack-Kanal.                                                                                                                                                                                                           |
| `qa telegram`                                       | Live-Transport-Lane gegen eine echte private Telegram-Gruppe.                                                                                                                                                                                                          |
| `qa whatsapp`                                       | Live-Transport-Lane gegen echte WhatsApp-Web-Konten.                                                                                                                                                                                                             |
| `qa mantis`                                         | Runner zur Vorher-/Nachher-Verifizierung von Live-Transportfehlern, mit Nachweisen durch Discord-Statusreaktionen, Crabbox-Desktop-/Browser-Smoke und Slack-in-VNC-Smoke. Siehe [Mantis](/de/concepts/mantis) und [Mantis Slack Desktop-Runbook](/de/concepts/mantis-slack-desktop-runbook). |

### Profilgestütztes `qa run`

Profilgestütztes `qa run` liest die Zugehörigkeit aus `taxonomy.yaml` und leitet
anschließend die aufgelösten Szenarien über `qa suite` weiter. `--surface` und `--category` filtern
das ausgewählte Profil, statt separate Lanes zu definieren. Das resultierende
`qa-evidence.json` enthält eine Scorecard-Zusammenfassung des Profils mit der Anzahl ausgewählter Kategorien
und IDs fehlender Abdeckung; die einzelnen Nachweiseinträge bleiben die
maßgebliche Quelle für Tests, Abdeckungsrollen und Ergebnisse. Taxonomie-Feature-
Abdeckungs-IDs sind exakte Nachweisziele und keine Aliase: Die primäre Szenarioabdeckung
erfüllt übereinstimmende IDs, während die sekundäre Abdeckung nur empfehlenden Charakter hat. Jede Abdeckungs-
ID entspricht exakt `taxonomy-surface.feature`, wobei die kurze Oberflächen-ID aus
`taxonomy.yaml` verwendet wird. Das separate Feld `surface` eines Szenarios ist eine Ausführungs-/Berichterstellungs-
bezeichnung (beispielsweise `channel` oder `runtime-tool`); es definiert keine taxonomische
Zuständigkeit.

Kompakte Nachweise lassen `execution` pro Eintrag weg und setzen `evidenceMode: "slim"`;
`smoke-ci` verwendet standardmäßig die kompakte Variante, und `--evidence-mode full` stellt vollständige Einträge wieder her:

```bash
pnpm openclaw qa run \
  --qa-profile smoke-ci \
  --category channels.conversation-routing-and-delivery \
  --provider-mode mock-openai \
  --output-dir .artifacts/qa-e2e/smoke-ci-profile-dispatch
```

Verwenden Sie `smoke-ci` für deterministische Profilnachweise mit Mock-Modell-Providern und
lokalen Crabline-Provider-Servern. Verwenden Sie `release` für Stable-/LTS-Nachweise gegen
Live-Kanäle. Verwenden Sie `all` nur für explizite Nachweisläufe der vollständigen Taxonomie; dies
wählt jede aktive Reifegradkategorie aus und kann über den `QA
Profile Evidence`-GitHub-Actions-Workflow mit `qa_profile=all` ausgeführt werden. Wenn ein
Befehl zusätzlich ein OpenClaw-Root-Profil benötigt, setzen Sie das Root-Profil vor den
QA-Befehl:

```bash
pnpm openclaw --profile work qa run --qa-profile smoke-ci
```

## Betriebsablauf

Der aktuelle QA-Betriebsablauf ist eine zweigeteilte QA-Site:

- Links: Gateway-Dashboard (Control UI) mit dem Agenten.
- Rechts: QA Lab mit dem Slack-ähnlichen Transkript und Szenarioplan.

Führen Sie sie aus mit:

```bash
pnpm qa:lab:up
```

Dadurch wird die QA-Site erstellt, die Docker-gestützte Gateway-Lane gestartet und
die QA-Lab-Seite bereitgestellt, auf der ein Bediener oder eine Automatisierungsschleife dem Agenten einen QA-
Auftrag erteilen, echtes Kanalverhalten beobachten und aufzeichnen kann, was funktioniert hat, fehlgeschlagen ist oder
weiterhin blockiert blieb.

Für schnellere Iterationen an der QA-Lab-UI, ohne das Docker-Image jedes Mal neu zu erstellen,
starten Sie den Stack mit einem per Bind-Mount eingebundenen QA-Lab-Bundle:

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` hält die Docker-Dienste auf einem vorgefertigten Image und
bindet `extensions/qa-lab/web/dist` per Bind-Mount in den `qa-lab`-Container ein.
`qa:lab:watch` erstellt dieses Bundle bei Änderungen neu, und der Browser lädt automatisch neu,
wenn sich der Asset-Hash von QA Lab ändert.

### Observability-Smoke-Tests

<Note>
Die Observability-QA bleibt ausschließlich für Source-Checkouts verfügbar. Das npm-Tarball lässt
QA Lab (und `qa-channel`) absichtlich weg, daher führen die Docker-Release-Lanes des Pakets
keine `qa`-Befehle aus. Führen Sie diese aus einem erstellten Source-Checkout aus, wenn
Sie die Diagnoseinstrumentierung ändern.
</Note>

| Alias                                   | Was ausgeführt wird                                                                                                                      |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm qa:otel:smoke`                    | Lokaler OpenTelemetry-Empfänger sowie das Szenario `otel-trace-smoke` mit aktiviertem `diagnostics-otel`.                               |
| `pnpm qa:otel:collector-smoke`          | Dieselbe Lane hinter einem echten OpenTelemetry-Collector-Docker-Container. Verwenden Sie sie, wenn Sie die Endpunktverdrahtung oder die Collector-/OTLP-Kompatibilität ändern. |
| `pnpm qa:prometheus:smoke`              | Das Szenario `docker-prometheus-smoke` mit aktiviertem `diagnostics-prometheus`.                                                        |
| `pnpm qa:observability:smoke`           | `qa:otel:smoke`, gefolgt von `qa:prometheus:smoke`.                                                                                     |
| `pnpm qa:observability:collector-smoke` | `qa:otel:collector-smoke`, gefolgt von `qa:prometheus:smoke`.                                                                           |

`qa:otel:smoke` startet einen lokalen OTLP/HTTP-Empfänger, führt einen
minimalen Agent-Turn im QA-Kanal aus und prüft anschließend, ob Traces,
Metriken und Protokolle exportiert werden. Dabei werden die exportierten
Protobuf-Trace-Spans dekodiert und die releasekritische Struktur geprüft:
`openclaw.run`, `openclaw.harness.run`, ein Modellaufruf-Span nach der
neuesten semantischen GenAI-Konvention, `openclaw.context.assembled` und
`openclaw.message.delivery` müssen alle vorhanden sein. Der Smoke-Test erzwingt
`OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`, daher muss der Modellaufruf-Span den Namen
`{gen_ai.operation.name} {gen_ai.request.model}` verwenden; Modellaufrufe dürfen bei erfolgreichen Turns
`StreamAbandoned` nicht exportieren; rohe Diagnose-IDs und
`openclaw.content.*`-Attribute dürfen nicht im Trace erscheinen. Der
Szenario-Prompt fordert das Modell auf, mit einer festen Markierung zu
antworten und eine feste geheime Zeichenfolge zurückzuhalten; die rohen
OTLP-Nutzdaten dürfen weder diese beiden Werte noch den aus der Szenario-ID
abgeleiteten QA-Sitzungsschlüssel enthalten. Es schreibt
`otel-smoke-summary.json` neben die Artefakte der QA-Suite.

`qa:prometheus:smoke` prüft, ob nicht authentifizierte Scrapes abgelehnt werden,
und prüft anschließend, ob der authentifizierte Scrape releasekritische
Metrikfamilien ohne Prompt-Inhalt, Antwortinhalt, rohe Diagnosekennungen,
Authentifizierungstoken oder lokale Pfade enthält.

### Matrix-Smoke-Lanes

Führen Sie für eine transportreale Matrix-Smoke-Lane, die keine
Anmeldedaten für einen Modell-Provider benötigt, das Release-Profil mit dem
deterministischen Mock-OpenAI-Provider aus:

```bash
pnpm openclaw qa matrix --provider-mode mock-openai --profile release
```

Geben Sie für die Live-Frontier-Provider-Lane explizit OpenAI-kompatible
Anmeldedaten an:

```bash
OPENCLAW_LIVE_OPENAI_KEY="${OPENAI_API_KEY}" \
  pnpm openclaw qa matrix --provider-mode live-frontier --profile release
```

Ein einfaches `pnpm openclaw qa matrix` führt das vollständige Profil
`all` aus und wird nach Szenariofehlern fortgesetzt. Verwenden
Sie `--fail-fast` für eine kürzere Feedbackschleife oder wiederholen Sie
`--scenario <id>`, um einzelne Szenarien auszuwählen; explizite Szenario-IDs
haben Vorrang vor `--profile`.

| Profil       | Szenarien | Zweck                                                                                                                                    |
| ------------ | --------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `all`        | 93        | Vollständiger Katalog (Standard).                                                                                                        |
| `release`    | 2         | Releasekritische Kanal-Baseline und Live-Neuladen der Positivliste.                                                                      |
| `fast`       | 12        | Gezielte Abdeckung von Threads, Reaktionen, Genehmigungen, Richtlinien, Bot-Gating und verschlüsselten Antworten.                         |
| `transport`  | 50        | Threads, DM-/Raum-Routing, automatischer Beitritt, Genehmigungen, Reaktionen, Neustarts, Erwähnungs-/Positivlistenrichtlinien, Bearbeitungen und Reihenfolge mehrerer Akteure. |
| `media`      | 7         | Abdeckung von Bildern, generierten Bildern, Sprache, Anhängen, nicht unterstützten Medien und verschlüsselten Medien.                     |
| `e2ee-smoke` | 8         | Mindestabdeckung für verschlüsselte Antworten, Threads, Bootstrap, Wiederherstellung, Neustart, Schwärzung und Fehler.                    |
| `e2ee-deep`  | 18        | Zustandsverlust, Sicherung, Schlüsselwiederherstellung, Gerätehygiene und SAS-/QR-/DM-Verifizierung.                                      |
| `e2ee-cli`   | 9         | `openclaw matrix encryption setup`, Wiederherstellungsschlüssel, mehrere Konten, Gateway-Roundtrip und Selbstverifizierungsbefehle über das Testsystem. |

Die Profilzugehörigkeit und Kanalanforderungen befinden sich zusammen mit
den deklarativen Matrix-Szenarien unter `qa/scenarios/channels/`. Der Lauf wählt
den Kanaltreiber aus. Deren Live-Implementierungen befinden sich unter
`extensions/qa-lab/src/live-transports/matrix/scenarios/`.

Der Adapter stellt in Docker einen temporären Tuwunel-Homeserver bereit
(Standard-Image `ghcr.io/matrix-construct/tuwunel:v1.5.1`, Servername `matrix-qa.test`,
Port `28008`), registriert temporäre Treiber-, SUT- und
Beobachterbenutzer, legt die erforderlichen Räume an und zeichnet die
geschwärzte Anfrage-/Antwortgrenze auf. Anschließend führt er das echte
Matrix-Plugin in einem untergeordneten QA-Gateway aus, dessen Geltungsbereich
auf diesen Transport beschränkt ist (kein `qa-channel`), und baut die
Umgebung danach ab.

Häufig verwendete Optionen:

| Flag                     | Standard          | Zweck                                                                                 |
| ------------------------ | ----------------- | ------------------------------------------------------------------------------------- |
| `--profile <profile>`    | `all`             | Wählt eines der obigen Profile aus.                                                   |
| `--scenario <id>`        | -                 | Wählt ein Szenario aus; wiederholbar.                                                 |
| `--fail-fast`            | aus               | Beendet den Lauf nach der ersten fehlgeschlagenen Prüfung oder dem ersten fehlgeschlagenen Szenario. |
| `--allow-failures`       | aus               | Schreibt Artefakte, ohne bei Szenariofehlern einen fehlerhaften Exit-Code zurückzugeben. |
| `--provider-mode <mode>` | `live-frontier`   | Verwendet `mock-openai` für deterministischen Versand oder `live-frontier` für einen Live-Provider. |
| `--model <ref>`          | Provider-Standard | Legt die primäre `provider/model`-Referenz fest.                                   |
| `--alt-model <ref>`      | Provider-Standard | Legt das alternative Modell fest, das von Szenarien mit Modellwechsel verwendet wird. |
| `--fast`                 | aus               | Aktiviert den schnellen Provider-Modus, sofern unterstützt.                           |
| `--output-dir <path>`    | generiert         | Wählt das Berichtsverzeichnis aus; relative Pfade werden relativ zu `--repo-root` aufgelöst. |
| `--repo-root <path>`     | aktuelles Verzeichnis | Führt den Lauf aus einem neutralen Arbeitsverzeichnis aus.                            |
| `--sut-account <id>`     | `sut`             | Wählt die Matrix-Konto-ID in der Konfiguration des untergeordneten Gateways aus.      |

Matrix-QA leiht keine gemeinsam verwendeten Matrix-Anmeldedaten aus: Der
Adapter erstellt lokal temporäre Benutzer und akzeptiert daher weder
`--credential-source` noch `--credential-role`. Überschreiben Sie das
Homeserver-Image mit `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE`; passen Sie negative Prüfungen auf
ausbleibende Antworten mit `OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS` an (Standard
`8000`, begrenzt auf das Timeout des aktiven Szenarios). Der
Einzelaufruf erzwingt normalerweise nach dem Schreiben der Artefakte ein
sauberes Beenden, da native Handles der Matrix-Kryptografie die Bereinigung
überdauern können; setzen Sie `OPENCLAW_QA_MATRIX_DISABLE_FORCE_EXIT=1` nur für ein direktes
Testsystem, bei dem der Befehl stattdessen zurückkehren muss.

Jeder Lauf schreibt die normalen QA-Lab-Artefakte unter das ausgewählte
Ausgabeverzeichnis: `qa-suite-report.md`, `qa-suite-summary.json` und
`qa-evidence.json`. Falls die Bereinigung fehlschlägt, führen Sie den
ausgegebenen Wiederherstellungsbefehl `docker compose ... down --remove-orphans` aus. Erhöhen Sie
auf langsamen Runnern das Zeitfenster für ausbleibende Antworten; in einer
schnellen CI kann ein kleineres Zeitfenster negative Prüfungen verkürzen.

Die Szenarien decken Transportverhalten ab, das Unit-Tests nicht durchgängig
belegen können: Erwähnungs-Gating, Richtlinien zum Zulassen von Bots,
Positivlisten, Antworten auf oberster Ebene und in Threads, DM-Routing,
Reaktionsverarbeitung, Unterdrückung eingehender Bearbeitungen,
Deduplizierung wiederholter Nachrichten nach einem Neustart,
Wiederherstellung nach Unterbrechungen des Homeservers, Übermittlung von
Genehmigungsmetadaten, Medienverarbeitung sowie Bootstrap-, Wiederherstellungs-
und Verifizierungsabläufe für Matrix-E2EE. Das E2EE-CLI-Profil führt außerdem
`openclaw matrix encryption setup` und Verifizierungsbefehle über denselben temporären
Homeserver aus, bevor die Gateway-Antworten geprüft werden.

`matrix-room-block-streaming` und `subagent-thread-spawn` bleiben über eine explizite Auswahl
mit `--scenario` verfügbar, gehören jedoch nicht zum standardmäßigen
Profil `all`.

Die CI verwendet dieselbe Befehlsoberfläche in
`.github/workflows/qa-live-transports-convex.yml`. Geplante und Release-Läufe führen die
Release-Szenarien aus. Manuelle `matrix_profile=all`-Dispatches verteilen die
Profile `transport`, `media`, `e2ee-smoke`,
`e2ee-deep` und `e2ee-cli`; gezielte Dispatches wählen
`fast`, `release` oder `transport` in einem
einzigen Job aus.

### Discord-Mantis-Szenarien

Discord verfügt außerdem über optionale, ausschließlich für Mantis
vorgesehene Szenarien zur Fehlerreproduktion. Verwenden Sie
`--scenario discord-status-reactions-tool-only` für die explizite Zeitleiste der Statusreaktionen oder
`--scenario discord-thread-reply-filepath-attachment`, um einen echten Discord-Thread zu erstellen und zu
prüfen, ob `message.thread-reply` einen `filePath`-Anhang beibehält.
Diese Szenarien bleiben außerhalb der standardmäßigen Live-Discord-Lane, da
es sich um Reproduktionsprüfungen für den Vorher-/Nachher-Vergleich und nicht
um eine breite Smoke-Abdeckung handelt. Der Mantis-Workflow für
Thread-Anhänge kann außerdem ein Zeugenvideo aus Discord Web mit angemeldetem
Benutzer hinzufügen, wenn `MANTIS_DISCORD_VIEWER_CHROME_PROFILE_DIR` oder `MANTIS_DISCORD_VIEWER_CHROME_PROFILE_TGZ_B64` in der
QA-Umgebung konfiguriert ist. Dieses Betrachterprofil dient ausschließlich
der visuellen Erfassung; die Entscheidung über Erfolg oder Fehlschlag stammt
weiterhin vom Discord-REST-Orakel.

Für die anderen transportrealen Smoke-Lanes:

```bash
pnpm openclaw qa discord
pnpm openclaw qa slack
pnpm openclaw qa telegram
pnpm openclaw qa whatsapp
```

Sie zielen auf einen bereits vorhandenen echten Kanal mit zwei Bots oder
Konten (Treiber + SUT). Erforderliche Umgebungsvariablen, Szenariolisten,
Ausgabeartefakte und der Convex-Anmeldedatenpool für diese vier Transporte
sind unten in der
[QA-Referenz für Discord, Slack, Telegram und WhatsApp](#discord-slack-telegram-and-whatsapp-qa-reference)
dokumentiert.

### Mantis-Runner für den Slack-Desktop und visuelle Aufgaben

Führen Sie für einen vollständigen Lauf der Slack-Desktop-VM mit
VNC-Wiederherstellung Folgendes aus:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

Dieser Befehl reserviert eine Crabbox-Desktop-/Browser-Maschine, führt den Slack-Live-
Durchlauf innerhalb der VM aus, öffnet Slack Web im VNC-Browser, zeichnet den Desktop auf
und kopiert `slack-qa/`, `slack-desktop-smoke.png` und
`slack-desktop-smoke.mp4` (wenn Videoaufzeichnung verfügbar ist) zurück in das
Mantis-Artefaktverzeichnis. Crabbox-Desktop-/Browser-Reservierungen stellen die Aufzeichnungs-
Tools und Hilfspakete für Browser/native Builds vorab bereit, sodass das Szenario
nur bei älteren Reservierungen Fallbacks installieren sollte. Mantis meldet Gesamt- und
Phasenzeiten in `mantis-slack-desktop-smoke-report.md`, damit bei langsamen Durchläufen erkennbar ist,
ob die Zeit für das Aufwärmen der Reservierung, das Abrufen von Anmeldedaten, die Remote-Einrichtung oder
das Kopieren von Artefakten aufgewendet wurde. Verwenden Sie `--lease-id <cbx_...>` erneut, nachdem Sie sich
manuell über VNC bei Slack Web angemeldet haben; wiederverwendete Reservierungen halten außerdem den pnpm-Store-Cache
von Crabbox warm. Der Standardwert `--hydrate-mode source` verifiziert aus einem Quell-Checkout und
führt Installation/Build innerhalb der VM aus. Verwenden Sie `--hydrate-mode prehydrated` nur, wenn
der wiederverwendete Remote-Arbeitsbereich bereits über `node_modules` und ein gebautes `dist/`
verfügt; dieser Modus überspringt den aufwendigen Installations-/Build-Schritt und schlägt sicher fehl, wenn der
Arbeitsbereich nicht bereit ist. Mit `--gateway-setup` lässt Mantis ein dauerhaftes
OpenClaw-Slack-Gateway innerhalb der VM auf Port `38973` laufen; ohne diese Option
führt der Befehl den normalen Bot-zu-Bot-Slack-QA-Durchlauf aus und wird nach der
Artefakterfassung beendet.

Um die native Slack-Genehmigungsoberfläche mit Desktop-Nachweisen zu belegen, führen Sie den
Mantis-Genehmigungsprüfpunktmodus aus:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --approval-checkpoints \
  --credential-source convex \
  --credential-role maintainer
```

Dieser Modus schließt sich gegenseitig mit `--gateway-setup` aus. Er führt die Slack-
Genehmigungsszenarien aus, lehnt Szenario-IDs ab, die keine Genehmigung betreffen, wartet bei jedem ausstehenden
und abgeschlossenen Genehmigungsstatus, rendert die beobachtete Slack-API-Nachricht in
`approval-checkpoints/<scenario>-pending.png` und
`approval-checkpoints/<scenario>-resolved.png` und schlägt anschließend fehl, wenn ein Prüfpunkt,
Nachrichtennachweis, eine Bestätigung oder ein gerenderter Screenshot fehlt oder
leer ist. Kalte CI-Reservierungen können in
`slack-desktop-smoke.png` weiterhin die Slack-Anmeldung zeigen; die Bilder der Genehmigungsprüfpunkte sind der visuelle
Nachweis für diesen Durchlauf.

Der standardmäßige Prüfpunktdurchlauf behält die beiden üblichen Slack-Genehmigungsszenarien bei.
Um eine der optionalen Codex-Genehmigungsrouten zu erfassen, wählen Sie sie ausdrücklich mit
`--scenario slack-codex-approval-exec-native` oder
`--scenario slack-codex-approval-plugin-native` aus; Mantis akzeptiert beide und erzeugt
dasselbe Screenshot-Paar für den ausstehenden/abgeschlossenen Status. Der Runner erweitert seine Prüfpunkt-
und Remote-Befehlsfristen für jede ausgewählte Codex-Route, damit die vollständige
Genehmigung, der Agent-Abschluss und die Aktualisierungssequenz für den abgeschlossenen Status beendet werden können.

Die Checkliste für Operatoren, der GitHub-Workflow-Dispatch-Befehl, der Vertrag für Nachweiskommentare,
die Entscheidungstabelle für den Hydrate-Modus, die Interpretation der Zeitmessungen und die Schritte zur
Fehlerbehandlung befinden sich im
[Mantis-Runbook für Slack Desktop](/de/concepts/mantis-slack-desktop-runbook).

Führen Sie für eine Desktop-Aufgabe im Agent-/CV-Stil Folgendes aus:

```bash
pnpm openclaw qa mantis visual-task \
  --browser-url https://example.net \
  --expect-text "Example Domain" \
  --vision-model openai/gpt-5.6-luna
```

`visual-task` reserviert eine Crabbox-Desktop-/Browser-Maschine oder verwendet sie erneut, startet
`crabbox record --while`, steuert den sichtbaren Browser über ein verschachteltes
`visual-driver`, erfasst `visual-task.png`, führt `openclaw infer image
describe` für den Screenshot aus, wenn `--vision-mode image-describe`
ausgewählt ist, und schreibt `visual-task.mp4`, `mantis-visual-task-summary.json`,
`mantis-visual-task-driver-result.json` und
`mantis-visual-task-report.md`. Wenn `--expect-text` gesetzt ist, fordert der Vision-
Prompt ein strukturiertes JSON-Urteil (`visible`, `evidence`, `reason`)
an und ist nur erfolgreich, wenn das Modell `visible: true` mit Nachweisen meldet, die
den erwarteten Text zitieren; eine `visible: false`-Antwort, die lediglich den
Zieltext zitiert, lässt die Assertion weiterhin fehlschlagen. Verwenden Sie `--vision-mode metadata` für einen
Smoke-Test ohne Modell, der die Desktop-, Browser-, Screenshot- und Video-
Verarbeitung belegt, ohne einen Provider für Bildverständnis aufzurufen. Die Aufzeichnung ist ein
erforderliches Artefakt für `visual-task`; wenn Crabbox kein nicht leeres
`visual-task.mp4` aufzeichnet, schlägt die Aufgabe selbst dann fehl, wenn der visuelle Treiber erfolgreich war. Bei
einem Fehler behält Mantis die Reservierung für VNC bei, es sei denn, die Aufgabe war bereits erfolgreich
und `--keep-lease` war nicht gesetzt.

### Zustandsprüfung des Anmeldedaten-Pools

Führen Sie vor der Verwendung gepoolter Live-Anmeldedaten Folgendes aus:

```bash
pnpm openclaw qa credentials doctor
```

Der Doctor prüft die Convex-Broker-Umgebung (`OPENCLAW_QA_CONVEX_SITE_URL`,
`OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX`), validiert die Endpunkteinstellungen, meldet
für `OPENCLAW_QA_CONVEX_SECRET_CI` und
`OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` ausschließlich den Status „gesetzt/fehlend“ und überprüft die Erreichbarkeit
von Admin-/Listenfunktionen, wenn das Maintainer-Secret vorhanden ist.

## Kanonische Szenarioabdeckung

Die Stammdatei `taxonomy.yaml` definiert semantische Abdeckungs-IDs. Szenario-YAML-Dateien
unter `qa/scenarios/` ordnen jedes Szenario diesen IDs zu und verwalten die Ausführungs-
metadaten: `channel` ist die einzige Kanalanforderung und `profiles` deklarieren
die benannte Zugehörigkeit zu Durchläufen. Der Kanaltreiber ist eine austauschbare Implementierungswahl
auf Durchlaufebene. TypeScript-
Runner fragen diesen Katalog ab; sie verwalten keine parallelen Szenario- oder Abdeckungs-
inventare.

Die statische Ausgabe von `qa coverage` meldet die Zuordnung von Taxonomie zu Szenario. Der tatsächliche
Nachweis stammt aus `qa-evidence.json`, das das ausgeführte Szenario,
die Abdeckungs-IDs, den Kanal, den tatsächlich verwendeten Treiber und das Ergebnis aufzeichnet. Kanal und Treiber sind
Berichtsdimensionen, keine zusätzlichen Vokabulare für Abdeckungs-IDs oder Achsen für die
Szenarioeignung.

Führen Sie für einen Wegwerf-Linux-VM-Durchlauf ohne Docker im QA-Pfad Folgendes aus:

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

Dies startet einen neuen Multipass-Gast, installiert Abhängigkeiten, baut OpenClaw
innerhalb des Gasts, führt `qa suite` aus und kopiert anschließend den normalen QA-Bericht und
die Zusammenfassung zurück in `.artifacts/qa-e2e/...` auf dem Host. Dabei wird dasselbe
Verhalten zur Szenarioauswahl wie bei `qa suite` auf dem Host verwendet.

Host- und Multipass-Suite-Durchläufe führen standardmäßig mehrere ausgewählte Szenarien
parallel mit isolierten Gateway-Workern aus. `qa-channel` verwendet standardmäßig
Parallelität 4, begrenzt durch die Anzahl der ausgewählten Szenarien. Verwenden Sie `--concurrency
<count>`, um die Worker-Anzahl anzupassen, oder `--concurrency 1` für eine serielle Ausführung.
Verwenden Sie `--pack personal-agent`, um das Benchmark-Paket für persönliche Assistenten (10
Szenarien) auszuführen. Der Paketselektor ist additiv zu wiederholten `--scenario`-Flags:
Explizite Szenarien werden zuerst ausgeführt, anschließend Paketszenarien in Paketreihenfolge,
wobei Duplikate entfernt werden. Verwenden Sie `--pack observability`, um die Szenarien
`otel-trace-smoke` und `docker-prometheus-smoke` gemeinsam auszuwählen, wenn ein
benutzerdefinierter QA-Runner die Einrichtung des OpenTelemetry-Collectors bereits bereitstellt.

Der Befehl wird mit einem Exit-Code ungleich null beendet, wenn ein Szenario fehlschlägt. Verwenden Sie `--allow-failures`,
wenn Sie Artefakte ohne einen fehlerhaften Exit-Code wünschen.

Live-Durchläufe leiten die unterstützten QA-Authentifizierungseingaben weiter, die für den
Gast praktikabel sind: umgebungsbasierte Provider-Schlüssel, den Konfigurationspfad des QA-Live-Providers und
`CODEX_HOME`, sofern vorhanden. Bewahren Sie `--output-dir` unter dem Repo-Stammverzeichnis auf, damit der
Gast über den eingebundenen Arbeitsbereich zurückschreiben kann.

## QA-Referenz für Discord, Slack, Telegram und WhatsApp

Der Matrix-Adapter verwendet den oben dokumentierten Docker-gestützten Wegwerf-Durchlauf.
Discord, Slack, Telegram und WhatsApp verwenden bereits vorhandene echte
Transporte, daher befindet sich ihre Referenz hier.

### Gemeinsame CLI-Flags

Diese Durchläufe werden über
`extensions/qa-lab/src/live-transports/shared/live-transport-cli.ts` registriert und
akzeptieren dieselben Flags:

| Flag                                  | Standardwert                                      | Beschreibung                                                                                                                                     |
| ------------------------------------- | -------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `--scenario <id>`                     | -                                                  | Nur dieses Szenario ausführen. Wiederholbar.                                                                                                             |
| `--output-dir <path>`                 | `<repo>/.artifacts/qa-e2e/<transport>-<timestamp>` | Ziel für Berichte, Zusammenfassungen, Nachweise, transportspezifische Artefakte und das Ausgabeprotokoll. Relative Pfade werden relativ zu `--repo-root` aufgelöst. |
| `--repo-root <path>`                  | `process.cwd()`                                    | Repo-Stammverzeichnis beim Aufruf aus einem neutralen Arbeitsverzeichnis.                                                                                               |
| `--sut-account <id>`                  | `sut`                                              | Temporäre Konto-ID innerhalb der QA-Gateway-Konfiguration.                                                                                              |
| `--provider-mode <mode>`              | `live-frontier`                                    | `mock-openai`, `aimock` oder `live-frontier`.                                                                                                    |
| `--model <ref>` / `--alt-model <ref>` | Provider-Standardwert                                   | Primäre/alternative Modellreferenzen.                                                                                                                   |
| `--fast`                              | aus                                                | Schneller Provider-Modus, sofern unterstützt.                                                                                                             |
| `--credential-source <env\|convex>`   | `env`                                              | Siehe [Convex-Anmeldedaten-Pool](#convex-credential-pool).                                                                                          |
| `--credential-role <maintainer\|ci>`  | `ci` in CI, andernfalls `maintainer`                 | Verwendete Rolle, wenn `--credential-source convex`.                                                                                                    |
| `--allow-failures`                    | aus                                                | Artefakte schreiben, ohne einen fehlerhaften Exit-Code zurückzugeben, wenn Szenarien fehlschlagen.                                                                      |

Jeder Durchlauf wird mit einem Exit-Code ungleich null beendet, wenn ein Szenario fehlschlägt. `--allow-failures` schreibt
Artefakte, ohne einen fehlerhaften Exit-Code zu setzen. Telegram akzeptiert außerdem
`--list-scenarios`, um verfügbare Szenario-IDs auszugeben und den Vorgang zu beenden; die anderen Durchläufe
stellen dieses Flag nicht bereit.

### Telegram-QA

```bash
pnpm openclaw qa telegram
```

Zielt auf eine echte private Telegram-Gruppe mit zwei verschiedenen Bots (Treiber +
SUT). Der SUT-Bot muss einen Telegram-Benutzernamen haben; die Bot-zu-Bot-Beobachtung funktioniert
am besten, wenn für beide Bots **Bot-to-Bot Communication Mode** in
`@BotFather` aktiviert ist.

Erforderliche Umgebung, wenn `--credential-source env`:

- `OPENCLAW_QA_TELEGRAM_GROUP_ID` – numerische Chat-ID (Zeichenfolge).
- `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`

Das Profil `release` wählt die gepflegten Telegram-YAML-Szenarien aus; `all`
fügt optionale Belastungsprüfungen für Sitzungen, Nutzung, Antwortketten und Streaming hinzu. Explizite
`--scenario`-Werte überschreiben das Profil.

- `channel-canary`
- `channel-mention-gating`
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

Das Profil `release` deckt immer Canary, Mention-Gating, Antworten auf native Befehle, Befehlsadressierung und Bot-zu-Bot-Gruppenantworten ab. `mock-openai`
umfasst außerdem die deterministische Prüfung der langen finalen Vorschau.
`telegram-current-session-status-tool` und
`telegram-tool-only-usage-footer` bleiben optional: Ersteres ist nur stabil,
wenn es direkt nach Canary ausgeführt wird, und Letzteres ist ein Nachweis mit echtem Telegram
für den `/usage`-Footer bei reinen Tool-Antworten. Verwenden Sie `pnpm openclaw qa telegram
--list-scenarios --provider-mode mock-openai`, um die aktuelle
Aufteilung in standardmäßige und optionale Prüfungen mit Regressionsreferenzen auszugeben. Verwenden Sie `--profile all` für jedes
Live-Adapter-Szenario von Telegram.

Ausgabeartefakte:

- `qa-suite-report.md`
- `qa-suite-summary.json`
- `qa-evidence.json` – Nachweiseinträge für die Live-Transportprüfungen,
  einschließlich Feldern für Profil, Abdeckung, Provider, Kanal, Artefakte, Ergebnis und RTT.

Paketbasierte Telegram-Ausführungen verwenden denselben Vertrag für Telegram-Zugangsdaten. Wiederholte RTT-
Messungen sind Teil der normalen paketbasierten Telegram-Live-Lane; die RTT-
Verteilung wird für die ausgewählte RTT-Prüfung unter `result.timing` in `qa-evidence.json`
aufgenommen.

```bash
OPENCLAW_QA_CREDENTIAL_SOURCE=convex \
pnpm test:docker:npm-telegram-live
```

Wenn `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` gesetzt ist, least der Live-Wrapper des Pakets
`kind: "telegram"`-Zugangsdaten, exportiert die geleasten Gruppen-/Treiber-/SUT-
Bot-Umgebungsvariablen in die Ausführung des installierten Pakets, sendet Heartbeats für das Leasing und gibt es
beim Herunterfahren frei. Der Paket-Wrapper verwendet standardmäßig 20 RTT-Prüfungen von
`channel-canary`, ein RTT-Timeout von 30s und außerhalb der CI die Convex-Rolle
`maintainer`, wenn Convex ausgewählt ist. Überschreiben Sie
`OPENCLAW_NPM_TELEGRAM_RTT_SAMPLES`, `OPENCLAW_NPM_TELEGRAM_RTT_TIMEOUT_MS`
oder `OPENCLAW_NPM_TELEGRAM_RTT_MAX_FAILURES`, um die RTT-Messung anzupassen, ohne
einen separaten RTT-Befehl oder ein Telegram-spezifisches Zusammenfassungsformat zu erstellen.

### Discord-QA

```bash
pnpm openclaw qa discord
```

Zielt auf einen echten privaten Discord-Guild-Kanal mit zwei Bots: einen vom Harness
gesteuerten Treiber-Bot und einen SUT-Bot, der vom untergeordneten OpenClaw-Gateway
über das gebündelte Discord-Plugin gestartet wird. Überprüft die Verarbeitung von Kanal-Mentions, ob
der SUT-Bot den nativen Befehl `/help` bei Discord registriert hat, sowie
optionale Mantis-Nachweisszenarien.

Erforderliche Umgebungsvariablen bei `--credential-source env`:

- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID` – muss mit der von Discord zurückgegebenen Benutzer-ID des SUT-Bots
  übereinstimmen (andernfalls schlägt die Lane sofort fehl).

Optional:

- `OPENCLAW_QA_DISCORD_VOICE_CHANNEL_ID` wählt den Sprach-/Stage-Kanal für
  `discord-voice-autojoin` aus; ohne diese Angabe wählt das Szenario den ersten für
  den SUT-Bot sichtbaren Sprach-/Stage-Kanal aus.

Discord-YAML-Modulszenarien (`qa/scenarios/channels/discord-*.yaml`):

- `discord-canary`
- `discord-mention-gating`
- `discord-native-help-command-registration`
- `discord-voice-autojoin` – optionales Sprachszenario. Wird allein ausgeführt, aktiviert
  `channels.discord.voice.autoJoin` und überprüft, ob der aktuelle
  Discord-Sprachstatus des SUT-Bots dem Ziel-Sprach-/Stage-Kanal entspricht. Convex-Discord-
  Zugangsdaten können optional `voiceChannelId` enthalten; andernfalls ermittelt der Runner-
  Adapter den ersten sichtbaren Sprach-/Stage-Kanal in der Guild.
- `discord-status-reactions-tool-only` – optionales Mantis-Szenario. Wird
  allein ausgeführt, da es die SUT mit `messages.statusReactions.enabled=true` auf
  permanente reine Tool-Antworten in der Guild umstellt und anschließend eine REST-
  Reaktionszeitleiste sowie visuelle HTML-/PNG-Artefakte erfasst. Mantis-Vorher-/Nachher-
  Berichte bewahren außerdem vom Szenario bereitgestellte MP4-Artefakte als `baseline.mp4`
  und `candidate.mp4` auf.
- `discord-thread-reply-filepath-attachment` – optionales Mantis-Szenario; siehe
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

- `qa-suite-report.md`
- `qa-suite-summary.json`
- `qa-evidence.json` – Nachweiseinträge für die Live-Transportprüfungen.
- `discord-qa-reaction-timelines.json` und
  `discord-status-reactions-tool-only-timeline.png`, wenn das Statusreaktionsszenario
  ausgeführt wird.

### Slack-QA

```bash
pnpm openclaw qa slack
```

Zielt auf einen echten privaten Slack-Kanal mit zwei unterschiedlichen Bots: einen vom Harness
gesteuerten Treiber-Bot und einen SUT-Bot, der vom untergeordneten OpenClaw-Gateway
über das gebündelte Slack-Plugin gestartet wird.

Erforderliche Umgebungsvariablen bei `--credential-source env`:

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`

Optional:

- `OPENCLAW_QA_SLACK_APPROVAL_CHECKPOINT_DIR` aktiviert visuelle Freigabe-
  Checkpoints für Mantis. Der Adapter schreibt `<scenario>.pending.json` und
  `<scenario>.resolved.json` und wartet anschließend auf passende `.ack.json`-Dateien.
- `OPENCLAW_QA_SLACK_APPROVAL_CHECKPOINT_TIMEOUT_MS` überschreibt das Timeout für die
  Checkpoint-Bestätigung. Der Standardwert ist `120000`.

Kanonische YAML-Szenarien, die über den Slack-Live-Adapter bereitgestellt werden:

- `thread-follow-up`
- `thread-isolation`

Slack-YAML-Modulszenarien (`qa/scenarios/channels/slack-*.yaml`):

- `slack-canary`
- `slack-mention-gating`
- `slack-allowlist-block`
- `slack-channel-disabled-warning` – optionale Prüfung mit echtem Slack, die bestätigt, dass ein
  konfigurierter deaktivierter Kanal eine strukturierte Warnung ausgibt, ohne zu antworten.
- `slack-top-level-reply-shape`
- `slack-restart-resume`
- `slack-progress-commentary-true`, `slack-progress-commentary-false`,
  `slack-progress-commentary-omitted` und
  `slack-progress-commentary-verbose-dedupe` – optionale Prüfungen mit echtem Slack für
  unabhängige Steuerelemente für Kommentare und Tool-Fortschritt, den Legacy-
  Standardwert bei weggelassenem Schlüssel sowie das Verhalten mit einmaliger Zustellung, wenn dauerhafter ausführlicher Fortschritt aktiviert ist.
- `slack-reaction-glyph-native` – optionales Live-Reaktionsszenario für das Nachrichten-Tool.
  Weist den Agenten an, exakt das Symbol `✅` zu übergeben, und bestätigt, dass Slack
  `white_check_mark` für den SUT-Bot in der Zielnachricht gespeichert hat.
- `slack-chart-presentation-native` – optionales portables Diagrammszenario, das
  den nativen Block `data_visualization` und den exakten barrierefreien Text überprüft.
- `slack-table-presentation-native` – optionales portables Tabellenszenario, das
  den nativen Block `data_table`, die exakten Zeilen und den barrierefreien Text überprüft.
- `slack-table-invalid-blocks-fallback` – optionales Direkttransportszenario,
  das eine strukturell lesbare rohe Tabelle über dem Grenzwert mit 101 Datenzeilen
  sowie ihrer Kopfzeile über den
  produktiven Slack-Sendepfad sendet, nachweist, dass Slack selbst `invalid_blocks` zurückgibt,
  und überprüft, dass der gespeicherte Fallback mit deaktivierter Formatierung vollständig ist und keinen
  nativen Datenblock enthält. Die Szenariodetails enthalten nur sichere Nachweise zu Fehlercode, Anzahl und
  booleschen Werten.
- `slack-approval-exec-native` – optionales natives Slack-Szenario für Exec-Freigaben.
  Fordert über das Gateway eine Exec-Freigabe an, überprüft, ob die Slack-Nachricht
  native Freigabeschaltflächen enthält, entscheidet die Freigabe und überprüft das aktualisierte Slack-
  Ergebnis.
- `slack-approval-plugin-native` – optionales natives Slack-Szenario für Plugin-Freigaben.
  Aktiviert die Weiterleitung von Exec- und Plugin-Freigaben gemeinsam, damit Plugin-
  Ereignisse nicht durch das Routing von Exec-Freigaben unterdrückt werden, und überprüft anschließend denselben
  ausstehenden/entschiedenen nativen Slack-UI-Pfad.
- `slack-codex-approval-exec-native` – optionales Codex-Guardian-Szenario für Befehlsfreigaben.
  Aktiviert das Codex-Plugin im Guardian-Modus, leitet einen
  von Slack ausgehenden Gateway-Agentendurchlauf durch das Codex-App-Server-Harness,
  wartet auf die native Slack-Eingabeaufforderung zur Plugin-Freigabe für
  `openclaw-codex-app-server`, entscheidet sie und überprüft, ob der Codex-Durchlauf
  mit den erwarteten Markierungen für Befehlsausgabe und Assistent abgeschlossen wird.
- `slack-codex-approval-plugin-native` – optionales Codex-Guardian-Szenario für Dateifreigaben.
  Verwendet eine `apply_patch`-Anweisung außerhalb des Arbeitsbereichs, damit Codex
  die App-Server-Route zur Freigabe von Dateiänderungen ausgibt, und überprüft anschließend denselben nativen
  Slack-Pfad für ausstehende/entschiedene Freigaben, die finale Assistentenmarkierung und den exakten Dateiinhalt
  vor der Bereinigung.

Die Codex-Freigabeszenarien erfordern ein `openai/*` oder `codex/*` `--model`, die
üblichen Zugangsdaten für Live-Modelle sowie eine vom Codex-Plugin akzeptierte Codex-Authentifizierung oder API-Schlüssel-Authentifizierung.
Die Szenariodetails enthalten die Codex-App-Server-Methode, den ausgewählten Codex-Modell-
schlüssel, den finalen Codex-Durchlaufstatus und die Überprüfung der Vorgangsmarkierung zusammen mit den
redigierten Slack-Freigabemetadaten.

Ausgabeartefakte:

- `qa-suite-report.md`
- `qa-suite-summary.json`
- `qa-evidence.json` – Nachweiseinträge für die Live-Transportprüfungen.
- `approval-checkpoints/` – nur wenn Mantis
  `OPENCLAW_QA_SLACK_APPROVAL_CHECKPOINT_DIR` setzt; enthält Checkpoint-JSON,
  Bestätigungs-JSON sowie Screenshots der ausstehenden und entschiedenen Zustände.

#### Slack-Workspace einrichten

Die Lane benötigt zwei unterschiedliche Slack-Apps in einem Workspace sowie einen Kanal, in dem beide
Bots Mitglieder sind:

- `channelId` – die `Cxxxxxxxxxx`-ID eines Kanals, in den beide Bots
  eingeladen wurden. Verwenden Sie einen dedizierten Kanal; die Lane veröffentlicht bei jeder Ausführung Beiträge.
- `driverBotToken` – Bot-Token (`xoxb-...`) der **Treiber**-App.
- `sutBotToken` – Bot-Token (`xoxb-...`) der **SUT**-App, die eine
  von der Treiber-App getrennte Slack-App sein muss, damit sich ihre Bot-Benutzer-ID unterscheidet.
- `sutAppToken` – Token auf App-Ebene (`xapp-...`) der SUT-App mit
  `connections:write`, das vom Socket Mode verwendet wird, damit die SUT-App Ereignisse empfangen kann.

Ein für QA dedizierter Slack-Workspace ist der Wiederverwendung eines produktiven
Workspace vorzuziehen.

Das nachstehende SUT-Manifest beschränkt die produktive Installation des gebündelten Slack-Plugins
(`extensions/slack/src/setup-shared.ts:12`) absichtlich auf die
Berechtigungen und Ereignisse, die von der Live-Slack-QA-Suite abgedeckt werden. Informationen zur
Einrichtung des Produktionskanals aus Benutzersicht finden Sie unter
[Schnelleinrichtung des Slack-Kanals](/de/channels/slack#quick-setup); das QA-Treiber-/SUT-
Paar ist absichtlich getrennt, da die Lane zwei unterschiedliche Bot-Benutzer-
IDs in einem Workspace benötigt.

**1. Treiber-App erstellen**

Gehen Sie zu [api.slack.com/apps](https://api.slack.com/apps) → _Create New App_ →
_From a manifest_ → wählen Sie den QA-Workspace aus, fügen Sie das folgende Manifest ein
und wählen Sie anschließend _Install to Workspace_:

```json
{
  "display_information": {
    "name": "OpenClaw QA Driver",
    "description": "Testtreiber-Bot für die Live-Lane der OpenClaw-QA für Slack"
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

Kopieren Sie das _Bot User OAuth Token_ (`xoxb-...`) – daraus wird
`driverBotToken`. Der Treiber muss lediglich Nachrichten veröffentlichen und sich
identifizieren; keine Ereignisse, kein Socket Mode.

**2. SUT-App erstellen**

Wiederholen Sie _Create New App → From a manifest_ im selben Workspace. Diese QA-App
verwendet absichtlich eine eingeschränktere Version des produktiven Manifests des gebündelten Slack-Plugins
(`extensions/slack/src/setup-shared.ts:12`): Berechtigungsumfänge und Ereignisse für Reaktionen
sind weggelassen, da die Live-Slack-QA-Suite die Verarbeitung von
Reaktionen noch nicht abdeckt.

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

- _Install to Workspace_ → kopieren Sie das _Bot User OAuth Token_ → daraus wird
  `sutBotToken`.
- _Basic Information → App-Level Tokens → Generate Token and Scopes_ → fügen Sie den
  Scope `connections:write` hinzu → speichern Sie → kopieren Sie den Wert `xapp-...` → daraus
  wird `sutAppToken`.

Überprüfen Sie, dass die beiden Bots unterschiedliche Benutzer-IDs haben, indem Sie `auth.test` mit jedem
Token aufrufen. Die Laufzeit unterscheidet Treiber und SUT anhand der Benutzer-ID; wenn dieselbe App
für beide verwendet wird, schlägt das Mention-Gating sofort fehl.

**3. Kanal erstellen**

Erstellen Sie im QA-Workspace einen Kanal (z. B. `#openclaw-qa`) und laden Sie beide
Bots innerhalb des Kanals ein:

```text
/invite @OpenClaw QA Driver
/invite @OpenClaw QA SUT
```

Kopieren Sie die ID `Cxxxxxxxxxx` aus _channel info → About → Channel ID_ – daraus
wird `channelId`. Ein öffentlicher Kanal funktioniert; wenn Sie einen privaten Kanal verwenden,
verfügen beide Apps bereits über `groups:history`, sodass die Verlaufsabfragen des Test-Harness
weiterhin erfolgreich sind.

**4. Anmeldedaten registrieren**

Es gibt zwei Möglichkeiten. Verwenden Sie Umgebungsvariablen für das Debugging auf einem einzelnen Rechner (legen Sie die vier
Variablen `OPENCLAW_QA_SLACK_*` fest und übergeben Sie `--credential-source env`) oder befüllen Sie
den gemeinsamen Convex-Pool, damit CI und andere Maintainer sie leasen können.

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
in Ihrer Shell exportiert sind, registrieren und überprüfen Sie die Daten:

```bash
pnpm openclaw qa credentials add \
  --kind slack \
  --payload-file slack-creds.json \
  --note "QA Slack pool seed"

pnpm openclaw qa credentials list --kind slack --status all --json
```

Erwartet werden `count: 1`, `status: "active"` und kein Feld `lease`.

**5. Ende-zu-Ende überprüfen**

Führen Sie die Lane lokal aus, um zu bestätigen, dass beide Bots über den
Broker miteinander kommunizieren können:

```bash
pnpm openclaw qa slack \
  --credential-source convex \
  --credential-role maintainer \
  --output-dir .artifacts/qa-e2e/slack-local
```

Ein erfolgreicher Lauf wird in deutlich weniger als 30 Sekunden abgeschlossen, und `qa-suite-report.md`
zeigt sowohl `slack-canary` als auch `slack-mention-gating` mit dem Status `pass`. Wenn die
Lane etwa 90 Sekunden lang hängt und mit `Convex credential pool exhausted
for kind "slack"` beendet wird, ist entweder der Pool leer oder jede Zeile ist geleast – `qa
credentials list --kind slack --status all --json` zeigt Ihnen, welcher Fall vorliegt.

### WhatsApp-QA

```bash
pnpm openclaw qa whatsapp
```

Zielt auf zwei dedizierte WhatsApp-Web-Konten: ein vom Test-Harness gesteuertes
Treiberkonto und ein SUT-Konto, das vom untergeordneten OpenClaw-Gateway über
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
  `whatsapp-group-reply-to-bot-triggers`, Szenarien für Gruppenaktionen, Medien und Umfragen
  sowie `whatsapp-group-allowlist-block`.

WhatsApp-YAML-Szenarien (`qa/scenarios/channels/whatsapp-*.yaml`):

- Baseline und Gruppen-Gating: `whatsapp-canary`, `whatsapp-pairing-block`,
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
- Nachrichtenaktionen über den Benutzerpfad: `whatsapp-agent-message-action-react` beginnt
  mit einer echten Direktnachricht des Treibers, lässt das Modell das Tool `message` aufrufen und
  beobachtet die native WhatsApp-Reaktion. `whatsapp-agent-message-action-upload-file`
  verwendet denselben Ansatz für `message(action=upload-file)` und beobachtet
  native WhatsApp-Medien. `whatsapp-group-agent-message-action-react` und
  `whatsapp-group-agent-message-action-upload-file` belegen dieselben
  benutzersichtbaren Aktionen in einer echten WhatsApp-Gruppe.
- Gruppen-Fan-out: `whatsapp-broadcast-group-fanout` beginnt mit einer erwähnenden
  WhatsApp-Gruppennachricht und überprüft unterschiedliche sichtbare Antworten von `main`
  und `qa-second`.
- Gruppenaktivierung: `whatsapp-group-activation-always` ändert eine echte
  Gruppensitzung in `/activation always`, belegt, dass eine Gruppennachricht ohne Erwähnung
  den Agenten aktiviert, und stellt anschließend `/activation mention` wieder her.
  `whatsapp-group-reply-to-bot-triggers` legt eine Bot-Antwort an, sendet eine native
  zitierte Antwort darauf ohne explizite Erwähnung und überprüft, dass der Agent
  durch diesen Antwortkontext aktiviert wird.
- Eingehende Medien und strukturierte Nachrichten: `whatsapp-inbound-image-caption`,
  `whatsapp-audio-preflight`, `whatsapp-inbound-structured-messages`,
  `whatsapp-group-audio-gating`, `whatsapp-inbound-reaction-no-trigger`.
  Diese senden echte WhatsApp-Ereignisse für Bilder, Audio, Dokumente, Standorte, Kontakte,
  Sticker und Reaktionen über den Treiber.
- Direkte Gateway-Vertragsprüfungen: `whatsapp-outbound-media-matrix`,
  `whatsapp-outbound-document-preserves-filename`, `whatsapp-outbound-poll`,
  `whatsapp-outbound-send-serialization`,
  `whatsapp-group-outbound-media`, `whatsapp-group-outbound-poll`,
  `whatsapp-message-actions`, `whatsapp-reply-context-isolation`,
  `whatsapp-reply-delivery-shape`. Diese umgehen absichtlich das Modell-Prompting
  und belegen deterministische Verträge für Gateway/Kanal `send`, `poll` und
  `message.action`.
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
wird für eine schnelle Smoke-Abdeckung mit 8 Szenarien klein gehalten. Die Standard-Lane `mock-openai`
führt 39 Szenarien deterministisch über den echten WhatsApp-
Transport aus und simuliert dabei nur die Modellausgabe; Genehmigungsszenarien und einige
aufwendigere/blockierende Prüfungen bleiben explizit über die Szenario-ID auswählbar.

Der WhatsApp-QA-Treiber beobachtet strukturierte Live-Ereignisse (`text`, `media`,
`location`, `reaction` und `poll`) und kann aktiv Medien, Umfragen,
Kontakte, Standorte und Sticker senden. QA Lab importiert diesen Treiber über die
Paketoberfläche `@openclaw/whatsapp/api.js`, statt auf private
WhatsApp-Laufzeitdateien zuzugreifen. Bei Gruppenbeobachtungen ist `fromJid` die Gruppen-JID,
während `participantJid` und `fromPhoneE164` den sendenden Teilnehmer identifizieren.
Nachrichteninhalte werden standardmäßig unkenntlich gemacht. Direkte Gateway-Prüfungen für Umfragen, Datei-Uploads,
Medien, Gruppenumfragen, Gruppenmedien und Antwortformen sind Transport-/API-
Vertragsprüfungen; sie gelten nicht als Nachweis dafür, dass eine Benutzereingabe den
Agenten zur Auswahl derselben Aktion veranlasst hat. Nachweise für Aktionen über den Benutzerpfad stammen aus Szenarien
wie `whatsapp-agent-message-action-react` und
`whatsapp-group-agent-message-action-react`, bei denen der Treiber eine normale
WhatsApp-Nachricht sendet und QA Lab das daraus resultierende native WhatsApp-Artefakt beobachtet.
Die Details der WhatsApp-Szenarien enthalten die Ausrichtung jedes Szenarios (`user-path`,
`direct-gateway` oder `native-approval`), damit die Evidenz nicht fälschlich für einen
stärkeren Vertrag gehalten wird, als sie tatsächlich belegt.

Ausgabeartefakte:

- `qa-suite-report.md`
- `qa-suite-summary.json`
- `qa-evidence.json` – Evidenzeinträge für die Live-Transportprüfungen.

### Convex-Anmeldedatenpool

Discord-, Slack-, Telegram- und WhatsApp-Lanes können Anmeldedaten aus einem
gemeinsamen Convex-Pool leasen, statt die oben genannten Umgebungsvariablen zu lesen. Übergeben Sie
`--credential-source convex` (oder setzen Sie `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`);
QA Lab erwirbt einen exklusiven Lease, sendet für die Dauer des
Laufs Heartbeats und gibt ihn beim Herunterfahren frei. Die Pool-Arten sind `"discord"`, `"slack"`,
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
  nur für den Mantis-Telegram-Desktop-Nachweis. Generische QA-Lab-Lanes dürfen
  diese Art nicht erwerben.
- WhatsApp (`kind: "whatsapp"`): `{ driverPhoneE164: string, sutPhoneE164:
string, driverAuthArchiveBase64: string, sutAuthArchiveBase64: string,
groupJid?: string }` – Telefonnummern müssen unterschiedliche E.164-Zeichenfolgen sein.

Der Mantis-Telegram-Desktop-Nachweisworkflow hält einen exklusiven Convex-
Lease `telegram-user` sowohl für den TDLib-CLI-Treiber als auch für den Telegram-Desktop-
Beobachter und gibt ihn nach der Veröffentlichung des Nachweises frei.

Wenn ein PR einen deterministischen visuellen Diff benötigt, kann Mantis dieselbe simulierte
Modellantwort auf `main` und auf dem PR-Head verwenden, während sich der Telegram-Formatierer oder
die Zustellungsschicht ändert. Die Aufnahmevorgaben sind für PR-Kommentare optimiert: Standard-
Crabbox-Klasse, Desktop-Aufzeichnung mit 24 fps, Bewegungs-GIF mit 24 fps und Vorschau
mit 1920 px Breite. Vorher-/Nachher-Kommentare sollten ein sauberes Paket veröffentlichen, das
nur die vorgesehenen GIFs enthält.

Slack-Lanes können ebenfalls den Pool verwenden. Die Prüfungen der Slack-Payload-Struktur befinden sich derzeit
im Slack-QA-Runner statt im Broker; verwenden Sie `{ channelId: string,
driverBotToken: string, sutBotToken: string, sutAppToken: string }` mit einer
Slack-Kanal-ID wie `Cxxxxxxxxxx`. Informationen zur Bereitstellung von App
und Scopes finden Sie unter [Slack-Workspace einrichten](#setting-up-the-slack-workspace).

Betriebliche Umgebungsvariablen und der Endpunktvertrag des Convex-Brokers sind unter
[Tests → Gemeinsame Telegram-Anmeldedaten über Convex](/de/help/testing#shared-telegram-credentials-via-convex-v1)
beschrieben (der Abschnittsname stammt aus der Zeit vor dem Mehrkanal-Pool; die Lease-Semantik gilt
für alle Arten gleichermaßen).

## Repository-gestützte Seeds

Seed-Assets befinden sich in `qa/`:

- `qa/scenarios/index.yaml`
- `qa/scenarios/<theme>/*.yaml`

Sie befinden sich absichtlich in Git, damit der QA-Plan sowohl für Menschen als auch für
den Agenten sichtbar ist.

`qa-lab` bleibt ein generischer YAML-Szenario-Runner. Jede Szenario-YAML-Datei ist die
maßgebliche Quelle für einen Testlauf und sollte Folgendes definieren:

- `title` auf oberster Ebene
- Metadaten in `scenario`
- optionale Kategorie-, Fähigkeits-, Lane- und Risikometadaten in `scenario`
- Dokumentations- und Codereferenzen in `scenario`
- optionale Plugin-Anforderungen in `scenario`
- optionaler Gateway-Konfigurationspatch in `scenario`
- ausführbares `flow` auf oberster Ebene für Ablaufszenarien oder
  `scenario.execution.kind` / `scenario.execution.path` für Vitest- und
  Playwright-Szenarien

Die wiederverwendbare Runtime-Oberfläche, auf der `flow` basiert, bleibt generisch und
querschnittlich. Beispielsweise können YAML-Szenarien transportseitige
Hilfsfunktionen mit browserseitigen Hilfsfunktionen kombinieren, die die eingebettete Control UI über
die Gateway-`browser.request`-Schnittstelle steuern, ohne einen Sonderfall-Runner hinzuzufügen.

Szenariodateien sollten nach Produktfunktion statt nach Ordnern des
Quellbaums gruppiert werden. Behalten Sie Szenario-IDs bei Dateiverschiebungen stabil; verwenden Sie `docsRefs` und
`codeRefs` für die Rückverfolgbarkeit der Implementierung.

Die Basisliste sollte breit genug bleiben, um Folgendes abzudecken:

- Direktnachrichten und Kanalchats
- Thread-Verhalten
- Lebenszyklus von Nachrichtenaktionen
- Cron-Callbacks
- Abruf aus dem Speicher
- Modellwechsel
- Übergabe an Subagenten
- Lesen von Repositorys und Dokumentation
- eine kleine Build-Aufgabe wie Lobster Invaders

## Provider-Mock-Lanes

`qa suite` verfügt über zwei lokale Provider-Mock-Lanes:

- `mock-openai` ist der szenariobewusste OpenClaw-Mock. Er bleibt die standardmäßige
  deterministische Mock-Lane für Repository-basierte QA- und Paritäts-Gates.
- `aimock` startet einen AIMock-basierten Provider-Server für experimentelle
  Protokoll-, Fixture-, Aufzeichnungs-/Wiedergabe- und Chaos-Abdeckung. Er ist additiv und
  ersetzt den Szenario-Dispatcher `mock-openai` nicht.

Die Implementierung der Provider-Lanes befindet sich unter `extensions/qa-lab/src/providers/`.
Jeder Provider besitzt seine Standardwerte, den Start des lokalen Servers, die Gateway-Modellkonfiguration,
die Anforderungen für die Bereitstellung von Authentifizierungsprofilen sowie Live-/Mock-Funktionskennzeichnungen. Gemeinsamer Suite- und
Gateway-Code verwendet die Provider-Registry, statt nach
Providernamen zu verzweigen.

## Transportadapter

`qa-lab` stellt eine generische Transportschnittstelle für YAML-QA-Szenarien bereit. `qa-channel` ist
der synthetische Standard. `crabline` startet lokale, Provider-förmige Server und
führt die normalen Kanal-Plugins von OpenClaw gegen sie aus. `live` ist für
echte Provider-Anmeldedaten und externe Kanäle reserviert.

Auf Architekturebene ist die Aufteilung wie folgt:

- `qa-lab` ist für die generische Szenarioausführung, Worker-Parallelität, das Schreiben von Artefakten
  und die Berichterstellung zuständig.
- Der Transportadapter ist für Gateway-Konfiguration, Bereitschaft, Beobachtung eingehender und ausgehender
  Vorgänge, Transportaktionen und normalisierten Transportstatus zuständig.
- YAML-Szenariodateien unter `qa/scenarios/` definieren den Testlauf; `qa-lab`
  stellt die wiederverwendbare Runtime-Oberfläche für ihre Ausführung bereit.

### Einen Kanal hinzufügen

Das Hinzufügen eines Kanals zum YAML-QA-System erfordert die Kanalimplementierung
sowie ein Szenariopaket, das den Kanalvertrag prüft. Fügen Sie für die Smoke-CI-
Abdeckung den passenden lokalen Crabline-Provider-Server hinzu und stellen Sie ihn
über den Treiber `crabline` bereit.

Fügen Sie keinen neuen QA-Befehl der obersten Ebene hinzu, wenn der gemeinsame Host `qa-lab`
den Ablauf übernehmen kann.

`qa-lab` ist für die gemeinsamen Host-Mechanismen zuständig:

- der Befehlsstamm `openclaw qa`
- Start und Beenden der Suite
- Worker-Parallelität
- Schreiben von Artefakten
- Berichterstellung
- Szenarioausführung
- Kompatibilitätsaliase für ältere `qa-channel`-Szenarien

Runner-Plugins sind für den Transportvertrag zuständig:

- wie `openclaw qa <runner>` unter dem gemeinsamen Stamm `qa` eingebunden wird
- wie das Gateway für diesen Transport konfiguriert wird
- wie die Bereitschaft geprüft wird
- wie eingehende Ereignisse eingespeist werden
- wie ausgehende Nachrichten beobachtet werden
- wie Transkripte und normalisierter Transportstatus bereitgestellt werden
- wie transportgestützte Aktionen ausgeführt werden
- wie transportspezifisches Zurücksetzen oder Bereinigen gehandhabt wird

Die Mindestanforderungen für die Einführung eines neuen Kanals:

1. Behalten Sie `qa-lab` als zuständige Komponente für den gemeinsamen Stamm `qa` bei.
2. Implementieren Sie den Transport-Runner über die gemeinsame Host-Schnittstelle `qa-lab`.
3. Belassen Sie transportspezifische Mechanismen im Runner-Plugin oder Kanal-
   Testgerüst.
4. Binden Sie den Runner als `openclaw qa <runner>` ein, statt einen
   konkurrierenden Stammbefehl zu registrieren. Runner-Plugins sollten `qaRunners` in
   `openclaw.plugin.json` deklarieren und ein entsprechendes `qaRunnerCliRegistrations`-
   Array aus `runtime-api.ts` exportieren. Halten Sie `runtime-api.ts` schlank; verzögerte CLI- und
   Runner-Ausführung sollten hinter getrennten Einstiegspunkten verbleiben. Ein optionales
   `adapterFactory` stellt den Transport gemeinsamen Szenarien bereit, ohne
   den vorhandenen Szenariokatalog des Befehls zu ändern. Partitionen desselben Kanals werden seriell ausgeführt,
   sofern die Factory nicht deklariert, dass jede Instanz über isolierte Anmeldedaten oder
   kurzlebige Server, Gateway-Status und Artefaktpfade verfügt.
5. Erstellen oder passen Sie YAML-Szenarien unter den thematisch gegliederten `qa/scenarios/`-
   Verzeichnissen an.
6. Verwenden Sie für neue Szenarien die generischen Szenario-Hilfsfunktionen.
7. Halten Sie vorhandene Kompatibilitätsaliase funktionsfähig, sofern das Repository keine
   beabsichtigte Migration durchführt.

Die Entscheidungsregel ist strikt:

- Wenn sich Verhalten einmalig in `qa-lab` ausdrücken lässt, legen Sie es in `qa-lab` ab.
- Wenn Verhalten von einem einzelnen Kanaltransport abhängt, belassen Sie es im entsprechenden Runner-
  Plugin oder Plugin-Testgerüst.
- Wenn ein Szenario eine neue Funktion benötigt, die mehrere Kanäle verwenden können,
  fügen Sie eine generische Hilfsfunktion hinzu, statt einer kanalspezifischen Verzweigung in `suite.ts`.
- Wenn ein Verhalten nur für einen Transport sinnvoll ist, halten Sie das Szenario
  transportspezifisch und machen Sie dies im Szenariovertrag ausdrücklich deutlich.

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

Kompatibilitätsaliase bleiben für vorhandene Szenarien verfügbar –
`waitForQaChannelReady`, `waitForOutboundMessage`, `waitForNoOutbound`,
`formatConversationTranscript`, `resetBus` –, neue Szenarien
sollten jedoch die generischen Namen verwenden. Die Aliase dienen dazu, eine gleichzeitige
Migration aller Szenarien zu vermeiden, und sind nicht das Modell für die Zukunft.

## Berichterstellung

`qa-lab` exportiert aus der beobachteten Bus-Zeitleiste einen Markdown-Protokollbericht.
Der Bericht sollte folgende Fragen beantworten:

- Was hat funktioniert?
- Was ist fehlgeschlagen?
- Was blieb blockiert?
- Welche Folgeszenarien sollten hinzugefügt werden?

Führen Sie für die Liste der verfügbaren Szenarien – hilfreich bei der Aufwandsschätzung für Folgearbeiten
oder beim Einbinden eines neuen Transports – `pnpm openclaw qa coverage` aus (fügen Sie `--json`
für maschinenlesbare Ausgabe hinzu). Führen Sie bei der Auswahl eines gezielten Nachweises für ein betroffenes
Verhalten oder einen Dateipfad `pnpm openclaw qa coverage --match <query>` aus. Der
Übereinstimmungsbericht durchsucht Szenariometadaten, Dokumentationsreferenzen, Codereferenzen, Abdeckungs-IDs,
Plugins und Provider-Anforderungen und gibt anschließend passende `qa suite
--scenario ...`-Ziele aus.

Jeder `qa suite`-Lauf schreibt die Artefakte `qa-evidence.json`,
`qa-suite-summary.json` und `qa-suite-report.md` auf oberster Ebene für die ausgewählte
Szenariomenge. Szenarien, die `execution.kind: vitest` oder
`execution.kind: playwright` deklarieren, führen den entsprechenden Testpfad aus und schreiben außerdem
szenariospezifische Protokolle. Szenarien, die `execution.kind: script` deklarieren, führen den
Nachweisproduzenten unter `execution.path` über `node --import tsx` aus (wobei
`${outputDir}` und `${scenarioId}` in `execution.args` expandiert werden); der
Produzent schreibt sein eigenes `qa-evidence.json`, dessen Einträge in
die Suite-Ausgabe importiert werden und dessen Artefaktpfade relativ zu diesem
Produzenten-`qa-evidence.json` aufgelöst werden. Wenn `qa suite` über `qa run
--qa-profile` erreicht wird, enthält dasselbe `qa-evidence.json` außerdem die Zusammenfassung der
Profil-Scorecard für die ausgewählten Taxonomiekategorien.

Behandeln Sie die Abdeckungsausgabe als Hilfsmittel zur Ermittlung und nicht als Ersatz für ein Gate; das
ausgewählte Szenario benötigt weiterhin den richtigen Provider-Modus, Live-Transport,
Multipass, Testbox oder die passende Release-Lane für das zu prüfende Verhalten. Kontext zur
Scorecard finden Sie unter [Reifegrad-Scorecard](/de/maturity/scorecard).

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

Der Befehl führt lokale untergeordnete QA-Gateway-Prozesse aus, nicht Docker. Szenarien zur
Charakterbewertung sollten die Persona über `SOUL.md` festlegen und anschließend gewöhnliche
Benutzerinteraktionen wie Chat, Hilfe zum Arbeitsbereich und kleine Dateiaufgaben ausführen. Dem Kandidatenmodell
sollte nicht mitgeteilt werden, dass es bewertet wird. Der Befehl bewahrt
jedes vollständige Transkript auf, zeichnet grundlegende Laufstatistiken auf und fordert anschließend die Bewertungsmodelle im
schnellen Modus mit `xhigh`-Reasoning, sofern unterstützt, dazu auf, die Läufe nach
Natürlichkeit, Ausstrahlung und Humor zu ordnen. Verwenden Sie `--blind-judge-models` beim Vergleich von
Providern: Der Bewertungsprompt erhält weiterhin jedes Transkript und jeden Laufstatus, aber
Kandidatenreferenzen werden durch neutrale Bezeichnungen wie `candidate-01` ersetzt; der
Bericht ordnet die Ranglisten nach der Auswertung wieder den tatsächlichen Referenzen zu.

Kandidatenläufe verwenden standardmäßig `high`-Thinking, mit `medium` für GPT-5.6 Luna und
`xhigh` für ältere OpenAI-Bewertungsreferenzen, die dies unterstützen. Überschreiben Sie einen bestimmten
Kandidaten inline mit `--model provider/model,thinking=<level>`; Inline-
Optionen unterstützen außerdem `fast`, `no-fast` und `fast=<bool>`. `--thinking
<level>` legt weiterhin einen globalen Rückfallwert fest, und die ältere Form `--model-thinking
<provider/model=level>` bleibt aus Kompatibilitätsgründen erhalten. OpenAI-Kandidatenreferenzen
verwenden standardmäßig den schnellen Modus, sodass priorisierte Verarbeitung genutzt wird, sofern der Provider
sie unterstützt. Übergeben Sie `--fast` nur, wenn Sie den schnellen Modus für
jedes Kandidatenmodell erzwingen möchten. Die Laufzeiten von Kandidaten und Bewertungsmodellen werden im
Bericht für Benchmark-Analysen aufgezeichnet, aber die Bewertungsprompts weisen ausdrücklich an, nicht nach
Geschwindigkeit zu ordnen. Läufe von Kandidaten- und Bewertungsmodellen verwenden beide standardmäßig eine Parallelität von 16.
Verringern Sie `--concurrency` oder `--judge-concurrency`, wenn Provider-Limits oder lokale
Gateway-Auslastung einen Lauf zu störanfällig machen.

Wenn keine Kandidatenangabe `--model` übergeben wird, verwendet die Charakterbewertung standardmäßig
`openai/gpt-5.6-luna`, `openai/gpt-5.2`, `openai/gpt-5`,
`anthropic/claude-opus-4-8`, `anthropic/claude-sonnet-4-6`, `zai/glm-5.1`,
`moonshot/kimi-k2.5` und `google/gemini-3.1-pro-preview`. Wenn kein
`--judge-model` übergeben wird, werden standardmäßig
`openai/gpt-5.6-sol,thinking=xhigh,fast` und
`anthropic/claude-opus-4-8,thinking=high` als Bewertungsmodelle verwendet.

## Verwandte Dokumentation

- [Reifegrad-Scorecard](/de/maturity/scorecard)
- [Benchmark-Paket für persönliche Agenten](/de/concepts/personal-agent-benchmark-pack)
- [QA-Kanal](/de/channels/qa-channel)
- [Tests](/de/help/testing)
- [Dashboard](/de/web/dashboard)
