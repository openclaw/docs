---
doc-schema-version: 1
read_when:
    - Verstehen, wie der QA-Stack zusammenwirkt
    - qa-lab, qa-channel oder einen Transportadapter erweitern
    - Hinzufügen repository-gestützter QA-Szenarien
    - Aufbau einer realitätsnäheren QA-Automatisierung rund um das Gateway-Dashboard
summary: 'Überblick über den QA-Stack: qa-lab, qa-channel, Repository-gestützte Szenarien, Live-Transport-Lanes, Transportadapter und Berichterstellung.'
title: QA-Übersicht
x-i18n:
    generated_at: "2026-07-16T12:41:47Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 8dcb506cedb57289f29938eb55b5f11ceedfaabba88364dce8249116010ce859
    source_path: concepts/qa-e2e-automation.md
    workflow: 16
---

Der private QA-Stack testet OpenClaw auf realistische, an Kanälen ausgerichtete Weise, wie es
ein Unit-Test nicht kann.

Bestandteile:

- `extensions/qa-channel`: synthetischer Nachrichtenkanal mit Oberflächen für Direktnachrichten, Kanäle, Threads,
  Reaktionen, Bearbeitungen und Löschungen.
- `extensions/qa-lab`: Debugger-UI, QA-Bus, Szenarioprofile und Live-
  Transportadapter zum Beobachten des Transkripts, Einspeisen eingehender Nachrichten
  und Exportieren eines Markdown-Berichts.
- `qa/`: Repository-gestützte Ausgangsressourcen für die Startaufgabe und grundlegende QA-
  Szenarien.
- [Mantis](/de/concepts/mantis): Live-Verifizierung vor und nach Änderungen für Fehler, die
  reale Transporte, Browser-Screenshots, VM-Zustand und PR-Nachweise erfordern.

## Befehlsoberfläche

Jeder QA-Ablauf läuft unter `pnpm openclaw qa <subcommand>`. Viele verfügen über `pnpm qa:*`-
Skriptaliase; beide Formen funktionieren.

| Befehl                                             | Zweck                                                                                                                                                                                                                                                             |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `qa run`                                            | Gebündelte QA-Selbstprüfung ohne `--qa-profile`; taxonomiebasierter Runner für Reifegradprofile mit `--qa-profile smoke-ci`, `--qa-profile release` oder `--qa-profile all`.                                                                                                  |
| `qa suite`                                          | Repository-gestützte Szenarien in der QA-Gateway-Lane ausführen. `--runner multipass` verwendet anstelle des Hosts eine temporäre Linux-VM.                                                                                                                                         |
| `qa coverage`                                       | Das YAML-Inventar der Szenarioabdeckung ausgeben (`--json` für maschinenlesbare Ausgabe; `--match <query>`, um Szenarien für ein betroffenes Verhalten zu finden; `--tools` für die Abdeckung von Runtime-Tool-Fixtures).                                                                                  |
| `qa parity-report`                                  | Zwei `qa-suite-summary.json`-Dateien für ein Paritäts-Gate entlang der Modellachse vergleichen oder mit `--runtime-axis --token-efficiency` Berichte zur Runtime-Parität und Token-Effizienz zwischen Codex und OpenClaw schreiben.                                                                          |
| `qa confidence-report`                              | QA-Nachweisartefakte anhand eines Manifests in einen Konfidenzbericht ohne unbekannte Einträge klassifizieren.                                                                                                                                                                               |
| `qa confidence-self-test`                           | Negative Kontroll-Canarys mit Ausgangsdaten schreiben, die belegen, dass das Konfidenz-Gate Abweichungen erkennt.                                                                                                                                                                                   |
| `qa jsonl-replay`                                   | Kuratierte JSONL-Transkripte über das Wiedergabe-Harness für Runtime-Parität wiedergeben.                                                                                                                                                                                         |
| `qa character-eval`                                 | Das Charakter-QA-Szenario mit mehreren Live-Modellen und einem bewerteten Bericht ausführen. Siehe [Berichterstellung](#reporting).                                                                                                                                                        |
| `qa manual`                                         | Einen einmaligen Prompt in der ausgewählten Provider-/Modell-Lane ausführen.                                                                                                                                                                                                      |
| `qa ui`                                             | Die QA-Debugger-UI und den lokalen QA-Bus starten (Alias: `pnpm qa:lab:ui`).                                                                                                                                                                                                |
| `qa docker-build-image`                             | Das vorgefertigte QA-Docker-Image erstellen.                                                                                                                                                                                                                                 |
| `qa docker-scaffold`                                | Ein docker-compose-Grundgerüst für das QA-Dashboard und die Gateway-Lane schreiben.                                                                                                                                                                                                |
| `qa up`                                             | Die QA-Site erstellen, den Docker-gestützten Stack starten und die URL ausgeben (Alias: `pnpm qa:lab:up`; die Variante `:fast` fügt `--use-prebuilt-image --bind-ui-dist --skip-ui-build` hinzu).                                                                                              |
| `qa aimock`                                         | Nur den AIMock-Provider-Server starten.                                                                                                                                                                                                                              |
| `qa mock-openai`                                    | Nur den szenariobewussten `mock-openai`-Provider-Server starten.                                                                                                                                                                                                        |
| `qa credentials doctor` / `add` / `list` / `remove` | Den gemeinsam genutzten Convex-Anmeldedatenpool verwalten.                                                                                                                                                                                                                           |
| `qa discord`                                        | Live-Transport-Lane für einen echten privaten Discord-Gildenkanal.                                                                                                                                                                                                   |
| `qa matrix`                                         | QA-Lab-Matrix-Profile für einen temporären Tuwunel-Homeserver. Siehe [Matrix-Smoke-Lanes](#matrix-smoke-lanes).                                                                                                                                                      |
| `qa slack`                                          | Live-Transport-Lane für einen echten privaten Slack-Kanal.                                                                                                                                                                                                           |
| `qa telegram`                                       | Live-Transport-Lane für eine echte private Telegram-Gruppe.                                                                                                                                                                                                          |
| `qa whatsapp`                                       | Live-Transport-Lane für echte WhatsApp-Web-Konten.                                                                                                                                                                                                             |
| `qa mantis`                                         | Runner für die Verifizierung vor und nach Änderungen bei Live-Transportfehlern, mit Nachweisen durch Discord-Statusreaktionen, Crabbox-Desktop-/Browser-Smoke und Slack-in-VNC-Smoke. Siehe [Mantis](/de/concepts/mantis) und [Mantis Slack Desktop-Runbook](/de/concepts/mantis-slack-desktop-runbook). |

### Profilgestütztes `qa run`

Profilgestütztes `qa run` liest die Zugehörigkeit aus `taxonomy.yaml` und leitet
anschließend die aufgelösten Szenarien über `qa suite` weiter. `--surface` und `--category` filtern
das ausgewählte Profil, anstatt separate Lanes zu definieren. Das resultierende
`qa-evidence.json` enthält eine Scorecard-Zusammenfassung des Profils mit der Anzahl ausgewählter Kategorien
und fehlenden Abdeckungs-IDs; die einzelnen Nachweiseinträge bleiben die
maßgebliche Quelle für Tests, Abdeckungsrollen und Ergebnisse. Abdeckungs-IDs für Taxonomiefunktionen
sind exakte Nachweisziele und keine Aliase: Die primäre Szenarioabdeckung
erfüllt übereinstimmende IDs, während die sekundäre Abdeckung nur Hinweischarakter hat. Abdeckungs-IDs verwenden
die punktgetrennte `namespace.behavior`-Form mit kleingeschriebenen alphanumerischen oder durch Bindestriche getrennten Segmenten;
Profil-, Oberflächen- und Kategorie-IDs können weiterhin die vorhandenen mit Bindestrichen oder Punkten versehenen
Taxonomie-IDs verwenden.

Reduzierte Nachweise lassen `execution` pro Eintrag aus und setzen `evidenceMode: "slim"`;
`smoke-ci` verwendet standardmäßig die reduzierte Form und `--evidence-mode full` stellt vollständige Einträge wieder her:

```bash
pnpm openclaw qa run \
  --qa-profile smoke-ci \
  --category channel-framework.conversation-routing-and-delivery \
  --provider-mode mock-openai \
  --output-dir .artifacts/qa-e2e/smoke-ci-profile-dispatch
```

Verwenden Sie `smoke-ci` für deterministische Profilnachweise mit simulierten Modell-Providern und
lokalen Crabline-Provider-Servern. Verwenden Sie `release` für Stable-/LTS-Nachweise mit
Live-Kanälen. Verwenden Sie `all` nur für explizite Nachweisläufe der vollständigen Taxonomie; es
wählt jede aktive Reifegradkategorie aus und kann über den `QA
Profile Evidence`-GitHub-Actions-Workflow mit `qa_profile=all` ausgeführt werden. Wenn ein
Befehl zusätzlich ein OpenClaw-Stammprofil benötigt, platzieren Sie das Stammprofil vor dem
QA-Befehl:

```bash
pnpm openclaw --profile work qa run --qa-profile smoke-ci
```

## Betriebsablauf

Der aktuelle QA-Betriebsablauf ist eine zweigeteilte QA-Site:

- Links: Gateway-Dashboard (Control UI) mit dem Agenten.
- Rechts: QA Lab mit dem Slack-ähnlichen Transkript und Szenarioplan.

Führen Sie ihn aus mit:

```bash
pnpm qa:lab:up
```

Dadurch wird die QA-Site erstellt, die Docker-gestützte Gateway-Lane gestartet und
die QA-Lab-Seite bereitgestellt, auf der Bedienpersonal oder eine Automatisierungsschleife dem Agenten einen QA-
Auftrag erteilen, reales Kanalverhalten beobachten und aufzeichnen kann, was funktioniert hat, fehlgeschlagen ist oder
weiterhin blockiert blieb.

Für schnellere Iterationen an der QA-Lab-UI, ohne das Docker-Image jedes Mal neu zu erstellen,
starten Sie den Stack mit einem per Bind-Mount eingebundenen QA-Lab-Bundle:

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` belässt die Docker-Dienste auf einem vorgefertigten Image und
bindet `extensions/qa-lab/web/dist` per Bind-Mount in den `qa-lab`-Container ein.
`qa:lab:watch` erstellt dieses Bundle bei Änderungen neu und der Browser lädt automatisch neu,
wenn sich der Asset-Hash von QA Lab ändert.

### Beobachtbarkeits-Smoke-Tests

<Note>
Die Beobachtbarkeits-QA bleibt ausschließlich für Source-Checkouts verfügbar. Der npm-Tarball lässt
QA Lab (und `qa-channel`) absichtlich aus, sodass Docker-Release-Lanes für Pakete
keine `qa`-Befehle ausführen. Führen Sie diese aus einem erstellten Source-Checkout aus, wenn
Sie die Diagnoseinstrumentierung ändern.
</Note>

| Alias                                   | Ausführung                                                                                                                              |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm qa:otel:smoke`                    | Lokaler OpenTelemetry-Empfänger plus das Szenario `otel-trace-smoke` mit aktiviertem `diagnostics-otel`.                                |
| `pnpm qa:otel:collector-smoke`          | Derselbe Ablauf hinter einem echten OpenTelemetry-Collector-Docker-Container. Verwenden Sie ihn bei Änderungen an der Endpunktverdrahtung oder der Collector-/OTLP-Kompatibilität. |
| `pnpm qa:prometheus:smoke`              | Das Szenario `docker-prometheus-smoke` mit aktiviertem `diagnostics-prometheus`.                                                       |
| `pnpm qa:observability:smoke`           | `qa:otel:smoke`, gefolgt von `qa:prometheus:smoke`.                                                                                     |
| `pnpm qa:observability:collector-smoke` | `qa:otel:collector-smoke`, gefolgt von `qa:prometheus:smoke`.                                                                           |

`qa:otel:smoke` startet einen lokalen OTLP/HTTP-Empfänger, führt einen
minimalen Agent-Durchlauf für den QA-Kanal aus und prüft anschließend, ob
Traces, Metriken und Protokolle exportiert werden. Es decodiert die exportierten
Protobuf-Trace-Spans und prüft die releasekritische Struktur:
`openclaw.run`, `openclaw.harness.run`, ein Modellaufruf-Span gemäß der
neuesten semantischen GenAI-Konvention, `openclaw.context.assembled` und
`openclaw.message.delivery` müssen alle vorhanden sein. Der Smoke-Test erzwingt
`OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`, daher muss der Modellaufruf-Span
den Namen `{gen_ai.operation.name} {gen_ai.request.model}` verwenden; bei erfolgreichen Durchläufen dürfen
Modellaufrufe `StreamAbandoned` nicht exportieren; rohe Diagnose-IDs und
`openclaw.content.*`-Attribute dürfen nicht im Trace erscheinen. Der
Szenario-Prompt fordert das Modell auf, mit einer festen Markierung zu
antworten und eine feste geheime Zeichenfolge zurückzuhalten; die rohen
OTLP-Nutzdaten dürfen weder diese Werte noch den aus der Szenario-ID
abgeleiteten QA-Sitzungsschlüssel enthalten. Es schreibt
`otel-smoke-summary.json` neben die Artefakte der QA-Suite.

`qa:prometheus:smoke` prüft, ob nicht authentifizierte Scrapes abgewiesen werden,
und kontrolliert anschließend, ob der authentifizierte Scrape die
releasekritischen Metrikfamilien enthält, ohne Prompt-Inhalte, Antwortinhalte,
rohe Diagnosekennungen, Authentifizierungstoken oder lokale Pfade offenzulegen.

### Matrix-Smoke-Abläufe

Führen Sie für einen transportechten Matrix-Smoke-Ablauf, der keine
Anmeldedaten für einen Modell-Provider benötigt, das Release-Profil mit dem
deterministischen OpenAI-Mock-Provider aus:

```bash
pnpm openclaw qa matrix --provider-mode mock-openai --profile release
```

Geben Sie für den Live-Frontier-Provider-Ablauf explizit
OpenAI-kompatible Anmeldedaten an:

```bash
OPENCLAW_LIVE_OPENAI_KEY="${OPENAI_API_KEY}" \
  pnpm openclaw qa matrix --provider-mode live-frontier --profile release
```

Ein einfaches `pnpm openclaw qa matrix` führt das vollständige Profil
`all` aus und fährt nach Szenariofehlern fort. Verwenden Sie
`--fail-fast` für eine kürzere Feedbackschleife oder wiederholen Sie
`--scenario <id>`, um einzelne Szenarien auszuwählen; explizite Szenario-IDs
haben Vorrang vor `--profile`.

| Profil       | Szenarien | Zweck                                                                                                                                    |
| ------------ | --------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `all`        | 93        | Vollständiger Katalog (Standard).                                                                                                        |
| `release`    | 2         | Releasekritische Kanal-Baseline und Live-Neuladen der Positivliste.                                                                      |
| `fast`       | 12        | Gezielte Abdeckung für Threads, Reaktionen, Genehmigungen, Richtlinien, Bot-Gating und verschlüsselte Antworten.                          |
| `transport`  | 50        | Threads, DM-/Raum-Routing, automatischer Beitritt, Genehmigungen, Reaktionen, Neustarts, Erwähnungs-/Positivlistenrichtlinien, Bearbeitungen und Reihenfolge mehrerer Akteure. |
| `media`      | 7         | Abdeckung für Bilder, generierte Bilder, Sprache, Anhänge, nicht unterstützte Medien und verschlüsselte Medien.                           |
| `e2ee-smoke` | 8         | Mindestabdeckung für verschlüsselte Antworten, Threads, Bootstrap, Wiederherstellung, Neustarts, Schwärzung und Fehler.                   |
| `e2ee-deep`  | 18        | Zustandsverlust, Sicherung, Schlüsselwiederherstellung, Gerätehygiene und SAS-/QR-/DM-Verifizierung.                                      |
| `e2ee-cli`   | 9         | `openclaw matrix encryption setup`, Wiederherstellungsschlüssel, mehrere Konten, Gateway-Rundlauf und Selbstverifizierungsbefehle über das Testsystem. |

Profilzugehörigkeit und Kanalanforderungen befinden sich bei den deklarativen
Matrix-Szenarien unter `qa/scenarios/channels/`. Der Durchlauf wählt den Kanaltreiber.
Deren Live-Implementierungen befinden sich unter
`extensions/qa-lab/src/live-transports/matrix/scenarios/`.

Der Adapter stellt in Docker einen temporären Tuwunel-Homeserver bereit
(Standard-Image `ghcr.io/matrix-construct/tuwunel:v1.5.1`, Servername `matrix-qa.test`,
Port `28008`), registriert temporäre Benutzer für Treiber, SUT und
Beobachter, legt die erforderlichen Räume an und zeichnet die geschwärzte
Anfrage-/Antwortgrenze auf. Anschließend führt er das echte Matrix-Plugin in
einem untergeordneten QA-Gateway aus, das auf diesen Transport beschränkt ist
(kein `qa-channel`), und baut die Umgebung danach ab.

Häufig verwendete Optionen:

| Flag                     | Standard          | Zweck                                                                                 |
| ------------------------ | ----------------- | ------------------------------------------------------------------------------------- |
| `--profile <profile>`    | `all`             | Wählt eines der oben genannten Profile aus.                                           |
| `--scenario <id>`        | -                 | Wählt ein Szenario aus; wiederholbar.                                                 |
| `--fail-fast`            | aus               | Beendet den Durchlauf nach der ersten fehlgeschlagenen Prüfung oder dem ersten fehlgeschlagenen Szenario. |
| `--allow-failures`       | aus               | Schreibt Artefakte, ohne bei Szenariofehlern einen fehlerhaften Exit-Code zurückzugeben. |
| `--provider-mode <mode>` | `live-frontier`   | Verwendet `mock-openai` für deterministische Weiterleitung oder `live-frontier` für einen Live-Provider. |
| `--model <ref>`          | Provider-Standard | Legt die primäre `provider/model`-Referenz fest.                                    |
| `--alt-model <ref>`      | Provider-Standard | Legt das alternative Modell für Szenarien fest, die zwischen Modellen wechseln.       |
| `--fast`                 | aus               | Aktiviert, sofern unterstützt, den schnellen Provider-Modus.                          |
| `--output-dir <path>`    | generiert         | Wählt das Berichtsverzeichnis; relative Pfade werden gegen `--repo-root` aufgelöst. |
| `--repo-root <path>`     | aktuelles Verzeichnis | Führt den Durchlauf aus einem neutralen Arbeitsverzeichnis aus.                    |
| `--sut-account <id>`     | `sut`             | Wählt die Matrix-Konto-ID in der Konfiguration des untergeordneten Gateways aus.       |

Matrix QA leiht keine gemeinsam genutzten Matrix-Anmeldedaten aus: Der Adapter
erstellt lokal temporäre Benutzer und akzeptiert daher weder
`--credential-source` noch `--credential-role`. Überschreiben Sie das
Homeserver-Image mit `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE`; passen Sie negative Prüfungen auf
ausbleibende Antworten mit `OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS` an (Standard:
`8000`, begrenzt auf das Zeitlimit des aktiven Szenarios). Der
Einmalbefehl erzwingt normalerweise nach dem Schreiben der Artefakte ein
sauberes Beenden, da native Handles der Matrix-Kryptografie die Bereinigung
überdauern können; setzen Sie `OPENCLAW_QA_MATRIX_DISABLE_FORCE_EXIT=1` nur für ein direktes
Testsystem, bei dem der Befehl stattdessen zurückkehren muss.

Jeder Durchlauf schreibt die üblichen QA-Lab-Artefakte in das ausgewählte
Ausgabeverzeichnis: `qa-suite-report.md`, `qa-suite-summary.json`,
`qa-evidence.json` und ein geschwärztes `matrix-harness-*/matrix-qa-harness.json`-Manifest.
Falls die Bereinigung fehlschlägt, führen Sie den ausgegebenen
`docker compose ... down --remove-orphans`-Wiederherstellungsbefehl aus. Vergrößern Sie auf langsamen
Runnern das Zeitfenster für ausbleibende Antworten; in schneller CI kann ein
kleineres Zeitfenster negative Prüfungen verkürzen.

Die Szenarien decken Transportverhalten ab, das Unit-Tests nicht vollständig
Ende-zu-Ende nachweisen können: Erwähnungs-Gating, Richtlinien zum Zulassen von
Bots, Positivlisten, Antworten auf oberster Ebene und in Threads, DM-Routing,
Reaktionsverarbeitung, Unterdrückung eingehender Bearbeitungen,
Replay-Deduplizierung nach Neustarts, Wiederherstellung nach
Homeserver-Unterbrechungen, Übermittlung von Genehmigungsmetadaten,
Medienverarbeitung sowie Matrix-E2EE-Flüsse für Bootstrap, Wiederherstellung
und Verifizierung. Das E2EE-CLI-Profil führt außerdem
`openclaw matrix encryption setup` und Verifizierungsbefehle über denselben temporären
Homeserver aus, bevor es die Gateway-Antworten prüft.

`matrix-room-block-streaming` und `subagent-thread-spawn` bleiben über eine explizite Auswahl
mit `--scenario` verfügbar, gehören jedoch weiterhin nicht zum
standardmäßigen Profil `all`.

CI verwendet dieselbe Befehlsoberfläche in
`.github/workflows/qa-live-transports-convex.yml`. Geplante und Release-Durchläufe führen die
Release-Szenarien aus. Manuelle `matrix_profile=all`-Ausführungen fächern die
Profile `transport`, `media`, `e2ee-smoke`,
`e2ee-deep` und `e2ee-cli` auf; gezielte Ausführungen wählen
`fast`, `release` oder `transport` in einem
einzelnen Job aus.

### Discord-Mantis-Szenarien

Discord bietet außerdem optionale, ausschließlich für Mantis vorgesehene
Szenarien zur Fehlerreproduktion. Verwenden Sie `--scenario discord-status-reactions-tool-only` für die
explizite Zeitleiste der Statusreaktionen oder `--scenario discord-thread-reply-filepath-attachment`, um einen
echten Discord-Thread zu erstellen und zu prüfen, ob `message.thread-reply` einen
`filePath`-Anhang beibehält. Diese Szenarien gehören nicht zum
standardmäßigen Live-Discord-Ablauf, da sie Vorher-/Nachher-Reproduktionsprüfungen
und keine breite Smoke-Test-Abdeckung darstellen. Der
Mantis-Workflow für Thread-Anhänge kann außerdem ein Zeugen-Video aus Discord
Web mit angemeldetem Benutzer hinzufügen, wenn `MANTIS_DISCORD_VIEWER_CHROME_PROFILE_DIR` oder
`MANTIS_DISCORD_VIEWER_CHROME_PROFILE_TGZ_B64` in der QA-Umgebung konfiguriert ist. Dieses Betrachterprofil
dient ausschließlich der visuellen Aufzeichnung; die Entscheidung über Erfolg
oder Fehlschlag stammt weiterhin vom Discord-REST-Orakel.

Für die anderen transportechten Smoke-Abläufe:

```bash
pnpm openclaw qa discord
pnpm openclaw qa slack
pnpm openclaw qa telegram
pnpm openclaw qa whatsapp
```

Sie verwenden einen bereits vorhandenen echten Kanal mit zwei Bots oder
Konten (Treiber + SUT). Erforderliche Umgebungsvariablen, Szenariolisten,
Ausgabeartefakte und der Convex-Anmeldedatenpool für diese vier Transporte
sind nachfolgend in der
[QA-Referenz für Discord, Slack, Telegram und WhatsApp](#discord-slack-telegram-and-whatsapp-qa-reference)
dokumentiert.

### Mantis-Runner für Slack Desktop und visuelle Aufgaben

Führen Sie für einen vollständigen Durchlauf in einer Slack-Desktop-VM mit
VNC-Notfallzugriff Folgendes aus:

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
Fallbacks nur bei älteren Reservierungen installieren sollte. Mantis meldet Gesamt- und
Phasenzeiten in `mantis-slack-desktop-smoke-report.md`, sodass bei langsamen Durchläufen erkennbar ist,
ob die Zeit für das Aufwärmen der Reservierung, die Beschaffung der Zugangsdaten, die Remote-Einrichtung oder
das Kopieren der Artefakte aufgewendet wurde. Verwenden Sie `--lease-id <cbx_...>` erneut, nachdem Sie sich
manuell über VNC bei Slack Web angemeldet haben; wiederverwendete Reservierungen halten außerdem
den pnpm-Store-Cache von Crabbox warm. Der Standardwert `--hydrate-mode source` verifiziert aus einem Quellcode-Checkout und
führt Installation und Build innerhalb der VM aus. Verwenden Sie `--hydrate-mode prehydrated` nur, wenn
der wiederverwendete Remote-Arbeitsbereich bereits über `node_modules` und ein gebautes `dist/` verfügt;
dieser Modus überspringt den aufwendigen Installations-/Build-Schritt und schlägt sicher fehl, wenn der
Arbeitsbereich nicht bereit ist. Mit `--gateway-setup` lässt Mantis ein persistentes
OpenClaw-Slack-Gateway innerhalb der VM auf Port `38973` laufen; ohne diese Option
führt der Befehl den normalen Bot-zu-Bot-Slack-QA-Durchlauf aus und beendet sich nach der
Artefakterfassung.

Um die native Slack-Genehmigungsoberfläche mit Desktop-Belegen nachzuweisen, führen Sie den
Mantis-Genehmigungsprüfpunktmodus aus:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --approval-checkpoints \
  --credential-source convex \
  --credential-role maintainer
```

Dieser Modus schließt sich mit `--gateway-setup` gegenseitig aus. Er führt die Slack-
Genehmigungsszenarien aus, lehnt Szenario-IDs ab, die nicht zu Genehmigungen gehören, wartet bei jedem ausstehenden
und abgeschlossenen Genehmigungsstatus, rendert die beobachtete Slack-API-Nachricht in
`approval-checkpoints/<scenario>-pending.png` und
`approval-checkpoints/<scenario>-resolved.png` und schlägt anschließend fehl, wenn ein Prüfpunkt,
Nachrichtenbeleg, eine Bestätigung oder ein gerenderter Screenshot fehlt oder
leer ist. Kalte CI-Reservierungen zeigen in
`slack-desktop-smoke.png` möglicherweise weiterhin die Slack-Anmeldung; die Bilder der Genehmigungsprüfpunkte sind der visuelle
Nachweis für diesen Durchlauf.

Der standardmäßige Prüfpunktdurchlauf behält die beiden regulären Slack-Genehmigungsszenarien bei.
Um eine der optionalen Codex-Genehmigungsrouten aufzuzeichnen, wählen Sie sie explizit mit
`--scenario slack-codex-approval-exec-native` oder
`--scenario slack-codex-approval-plugin-native` aus; Mantis akzeptiert beide und erzeugt
dasselbe Screenshot-Paar für den ausstehenden und abgeschlossenen Zustand. Der Runner verlängert seine Prüfpunkt-
und Remote-Befehlsfristen für jede ausgewählte Codex-Route, damit die vollständige
Genehmigung, der Abschluss des Agenten und die Aktualisierung des abgeschlossenen Zustands abgeschlossen werden können.

Die Betreiber-Checkliste, der Dispatch-Befehl für den GitHub-Workflow, der Vertrag für Belegkommentare,
die Entscheidungstabelle für den Hydrate-Modus, die Interpretation der Zeitmessungen und die Schritte zur
Fehlerbehandlung befinden sich im
[Mantis-Runbook für Slack Desktop](/de/concepts/mantis-slack-desktop-runbook).

Führen Sie für eine Desktop-Aufgabe im Agenten-/Computer-Vision-Stil Folgendes aus:

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
an und ist nur erfolgreich, wenn das Modell `visible: true` mit Belegen meldet, die
den erwarteten Text anführen; eine `visible: false`-Antwort, die lediglich den
Zieltext zitiert, lässt die Assertion weiterhin fehlschlagen. Verwenden Sie `--vision-mode metadata` für einen
Smoke-Test ohne Modell, der die Desktop-, Browser-, Screenshot- und Video-
Verarbeitung nachweist, ohne einen Provider für Bildverständnis aufzurufen. Die Aufzeichnung ist ein
erforderliches Artefakt für `visual-task`; wenn Crabbox kein nicht leeres
`visual-task.mp4` aufzeichnet, schlägt die Aufgabe auch dann fehl, wenn der visuelle Treiber erfolgreich war. Bei
einem Fehler behält Mantis die Reservierung für VNC bei, es sei denn, die Aufgabe war bereits erfolgreich
und `--keep-lease` war nicht gesetzt.

### Zustandsprüfung des Zugangsdaten-Pools

Führen Sie vor der Verwendung gepoolter Live-Zugangsdaten Folgendes aus:

```bash
pnpm openclaw qa credentials doctor
```

Doctor prüft die Umgebungsvariablen des Convex-Brokers (`OPENCLAW_QA_CONVEX_SITE_URL`,
`OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX`), validiert die Endpunkteinstellungen, meldet
für `OPENCLAW_QA_CONVEX_SECRET_CI` und
`OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` nur den Status „gesetzt/fehlend“ und verifiziert die
Erreichbarkeit der Verwaltungs-/Listenfunktionen, wenn das Maintainer-Secret vorhanden ist.

## Kanonische Szenarioabdeckung

Die Stammdatei `taxonomy.yaml` definiert semantische Abdeckungs-IDs. Szenario-YAML-Dateien
unter `qa/scenarios/` ordnen jedes Szenario diesen IDs zu und verwalten die Ausführungs-
metadaten: `channel` ist die einzige Channel-Anforderung, und `profiles` deklarieren
die benannte Zugehörigkeit zu Durchläufen. Der Channel-Treiber ist eine austauschbare Implementierungswahl auf Durchlaufebene.
TypeScript-
Runner fragen diesen Katalog ab; sie verwalten keine parallelen Szenario- oder Abdeckungs-
inventare.

Die statische Ausgabe von `qa coverage` meldet die Zuordnung von Taxonomie zu Szenarien. Der tatsächliche
Nachweis stammt aus `qa-evidence.json`, das das ausgeführte Szenario,
die Abdeckungs-IDs, den Channel, den tatsächlich verwendeten Treiber und das Ergebnis erfasst. Channel und Treiber sind
Berichtsdimensionen und keine zusätzlichen Vokabulare für Abdeckungs-IDs oder Achsen für die
Szenarioeignung.

Führen Sie für einen Durchlauf in einer kurzlebigen Linux-VM, ohne Docker in den QA-Pfad einzubinden, Folgendes aus:

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

Dadurch wird ein neuer Multipass-Gast gestartet, Abhängigkeiten werden installiert, OpenClaw wird
innerhalb des Gasts gebaut, `qa suite` wird ausgeführt und anschließend werden der normale QA-Bericht und
die Zusammenfassung zurück nach `.artifacts/qa-e2e/...` auf dem Host kopiert. Dabei wird dasselbe
Szenarioauswahlverhalten wie bei `qa suite` auf dem Host wiederverwendet.

Host- und Multipass-Suite-Durchläufe führen standardmäßig mehrere ausgewählte Szenarien
parallel mit isolierten Gateway-Workern aus. `qa-channel` verwendet standardmäßig
Parallelität 4, begrenzt durch die Anzahl der ausgewählten Szenarien. Verwenden Sie `--concurrency
<count>`, um die Worker-Anzahl anzupassen, oder `--concurrency 1` für eine serielle Ausführung.
Verwenden Sie `--pack personal-agent`, um das Benchmark-Paket für persönliche Assistenten (10
Szenarien) auszuführen. Der Paketselektor wird additiv mit wiederholten `--scenario`-Flags verwendet:
Explizite Szenarien werden zuerst ausgeführt, danach die Paketszenarien in Paketreihenfolge,
wobei Duplikate entfernt werden. Verwenden Sie `--pack observability`, um die Szenarien
`otel-trace-smoke` und `docker-prometheus-smoke` gemeinsam auszuwählen, wenn ein
benutzerdefinierter QA-Runner bereits die Einrichtung des OpenTelemetry-Collectors bereitstellt.

Der Befehl wird mit einem Exit-Code ungleich null beendet, wenn ein Szenario fehlschlägt. Verwenden Sie `--allow-failures`,
wenn Sie Artefakte ohne einen fehlschlagenden Exit-Code erhalten möchten.

Live-Durchläufe leiten die unterstützten QA-Authentifizierungseingaben weiter, die für den
Gast praktikabel sind: umgebungsbasierte Provider-Schlüssel, den Konfigurationspfad des QA-Live-Providers und
`CODEX_HOME`, falls vorhanden. Bewahren Sie `--output-dir` unterhalb des Repository-Stammverzeichnisses auf, damit der
Gast über den eingebundenen Arbeitsbereich zurückschreiben kann.

## QA-Referenz für Discord, Slack, Telegram und WhatsApp

Der Matrix-Adapter verwendet den oben dokumentierten kurzlebigen Docker-gestützten Durchlauf.
Discord, Slack, Telegram und WhatsApp verwenden bereits vorhandene reale
Transporte, daher befindet sich ihre Referenz hier.

### Gemeinsame CLI-Flags

Diese Durchläufe werden über
`extensions/qa-lab/src/live-transports/shared/live-transport-cli.ts` registriert und
akzeptieren dieselben Flags:

| Flag                                  | Standardwert                                      | Beschreibung                                                                                                                                   |
| ------------------------------------- | ------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `--scenario <id>`                     | -                                                 | Nur dieses Szenario ausführen. Wiederholbar.                                                                                                   |
| `--output-dir <path>`                 | `<repo>/.artifacts/qa-e2e/<transport>-<timestamp>` | Ziel für Berichte, Zusammenfassungen, Belege, transportspezifische Artefakte und das Ausgabeprotokoll. Relative Pfade werden gegen `--repo-root` aufgelöst. |
| `--repo-root <path>`                  | `process.cwd()`                                    | Repository-Stammverzeichnis beim Aufruf aus einem neutralen aktuellen Arbeitsverzeichnis.                                                      |
| `--sut-account <id>`                  | `sut`                                              | Temporäre Konto-ID innerhalb der QA-Gateway-Konfiguration.                                                                                     |
| `--provider-mode <mode>`              | `live-frontier`                                    | `mock-openai`, `aimock` oder `live-frontier`.                                                                                                   |
| `--model <ref>` / `--alt-model <ref>` | Provider-Standardwert                              | Primäre/alternative Modellreferenzen.                                                                                                          |
| `--fast`                              | aus                                               | Schneller Provider-Modus, sofern unterstützt.                                                                                                  |
| `--credential-source <env\|convex>`   | `env`                                              | Siehe [Convex-Zugangsdaten-Pool](#convex-credential-pool).                                                                                     |
| `--credential-role <maintainer\|ci>`  | `ci` in CI, andernfalls `maintainer`                 | Verwendete Rolle, wenn `--credential-source convex`.                                                                                           |
| `--allow-failures`                    | aus                                               | Artefakte schreiben, ohne einen fehlschlagenden Exit-Code zurückzugeben, wenn Szenarien fehlschlagen.                                         |

Jeder Durchlauf wird bei einem fehlgeschlagenen Szenario mit einem Exit-Code ungleich null beendet. `--allow-failures` schreibt
Artefakte, ohne einen fehlschlagenden Exit-Code zu setzen. Telegram akzeptiert außerdem
`--list-scenarios`, um verfügbare Szenario-IDs auszugeben und sich zu beenden; die anderen Durchläufe
stellen dieses Flag nicht bereit.

### Telegram-QA

```bash
pnpm openclaw qa telegram
```

Zielt auf eine reale private Telegram-Gruppe mit zwei verschiedenen Bots (Treiber +
SUT). Der SUT-Bot muss einen Telegram-Benutzernamen haben; die Bot-zu-Bot-Beobachtung funktioniert
am besten, wenn bei beiden Bots **Bot-to-Bot Communication Mode** in
`@BotFather` aktiviert ist.

Erforderliche Umgebungsvariablen, wenn `--credential-source env`:

- `OPENCLAW_QA_TELEGRAM_GROUP_ID` – numerische Chat-ID (Zeichenfolge).
- `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`

Das Profil `release` wählt die gepflegten Telegram-YAML-Szenarien aus; `all`
fügt optionale Stressprüfungen für Sitzungen, Nutzung, Antwortketten und Streaming hinzu. Explizite
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

Das Profil `release` deckt stets Canary, Mention-Gating, Antworten auf native Befehle, Befehlsadressierung und Bot-zu-Bot-Antworten in Gruppen ab. `mock-openai`
umfasst außerdem die deterministische Vorschauprüfung für lange Abschlussantworten.
`telegram-current-session-status-tool` und
`telegram-tool-only-usage-footer` bleiben optional: Ersteres ist nur stabil,
wenn es direkt nach Canary ausgeführt wird, und Letzteres ist ein Nachweis mit echtem Telegram
für den Footer `/usage` bei reinen Tool-Antworten. Verwenden Sie `pnpm openclaw qa telegram
--list-scenarios --provider-mode mock-openai`, um die aktuelle
Aufteilung in Standard- und optionale Prüfungen mit Regressionsreferenzen auszugeben. Verwenden Sie `--profile all` für jedes
Szenario mit dem Telegram-Live-Adapter.

Ausgabeartefakte:

- `qa-suite-report.md`
- `qa-suite-summary.json`
- `qa-evidence.json` – Nachweiseinträge für die Prüfungen des Live-Transports,
  einschließlich Feldern für Profil, Abdeckung, Provider, Kanal, Artefakte, Ergebnis und RTT.

Telegram-Paketläufe verwenden denselben Vertrag für Telegram-Anmeldedaten. Wiederholte RTT-
Messungen sind Teil der normalen Telegram-Live-Lane des Pakets; die RTT-
Verteilung wird für die ausgewählte RTT-Prüfung unter `result.timing` in `qa-evidence.json`
aufgenommen.

```bash
OPENCLAW_QA_CREDENTIAL_SOURCE=convex \
pnpm test:docker:npm-telegram-live
```

Wenn `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` gesetzt ist, leiht der Live-Wrapper des Pakets
Anmeldedaten vom Typ `kind: "telegram"` aus, exportiert die ausgeliehenen Umgebungsvariablen für Gruppe, Treiber und SUT-
Bot in den Lauf des installierten Pakets, sendet Heartbeats für die Ausleihe und gibt sie
beim Herunterfahren frei. Der Paket-Wrapper verwendet standardmäßig 20 RTT-Prüfungen mit
`channel-canary`, ein RTT-Zeitlimit von 30s und außerhalb von CI die Convex-Rolle
`maintainer`, wenn Convex ausgewählt ist. Überschreiben Sie
`OPENCLAW_NPM_TELEGRAM_RTT_SAMPLES`, `OPENCLAW_NPM_TELEGRAM_RTT_TIMEOUT_MS`
oder `OPENCLAW_NPM_TELEGRAM_RTT_MAX_FAILURES`, um die RTT-Messung anzupassen, ohne
einen separaten RTT-Befehl oder ein Telegram-spezifisches Zusammenfassungsformat zu erstellen.

### Discord-QA

```bash
pnpm openclaw qa discord
```

Zielt auf einen echten privaten Discord-Guild-Kanal mit zwei Bots: einen vom
Test-Harness gesteuerten Treiber-Bot und einen SUT-Bot, der vom untergeordneten OpenClaw-Gateway
über das gebündelte Discord-Plugin gestartet wird. Überprüft die Verarbeitung von Erwähnungen im Kanal, dass
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
- `discord-voice-autojoin` – optionales Sprachszenario. Wird eigenständig ausgeführt, aktiviert
  `channels.discord.voice.autoJoin` und überprüft, ob der aktuelle
  Discord-Sprachstatus des SUT-Bots dem Ziel-Sprach-/Stage-Kanal entspricht. Convex-Anmeldedaten für Discord
  können optional `voiceChannelId` enthalten; andernfalls ermittelt der Runner-
  Adapter den ersten sichtbaren Sprach-/Stage-Kanal in der Guild.
- `discord-status-reactions-tool-only` – optionales Mantis-Szenario. Wird
  eigenständig ausgeführt, da es den SUT mit `messages.statusReactions.enabled=true` auf ständig aktive, reine Tool-Antworten in der Guild
  umstellt und anschließend eine REST-
  Reaktionszeitleiste sowie visuelle HTML-/PNG-Artefakte erfasst. Mantis-Berichte für den Zustand davor und danach
  bewahren außerdem vom Szenario bereitgestellte MP4-Artefakte als `baseline.mp4`
  und `candidate.mp4` auf.
- `discord-thread-reply-filepath-attachment` – optionales Mantis-Szenario; siehe
  [Discord-Mantis-Szenarien](#discord-mantis-scenarios).

Führen Sie das Discord-Szenario für den automatischen Beitritt zu einem Sprachkanal explizit aus:

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
- `qa-evidence.json` – Nachweiseinträge für die Prüfungen des Live-Transports.
- `discord-qa-reaction-timelines.json` und
  `discord-status-reactions-tool-only-timeline.png`, wenn das Statusreaktionsszenario
  ausgeführt wird.

### Slack-QA

```bash
pnpm openclaw qa slack
```

Zielt auf einen echten privaten Slack-Kanal mit zwei unterschiedlichen Bots: einen vom
Test-Harness gesteuerten Treiber-Bot und einen SUT-Bot, der vom untergeordneten OpenClaw-Gateway
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
- `OPENCLAW_QA_SLACK_APPROVAL_CHECKPOINT_TIMEOUT_MS` überschreibt das Zeitlimit für die
  Bestätigung des Checkpoints. Der Standardwert ist `120000`.

Kanonische YAML-Szenarien, die über den Slack-Live-Adapter verfügbar sind:

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
  Standardwert bei ausgelassenem Schlüssel sowie das Verhalten mit einmaliger Zustellung, wenn dauerhafter ausführlicher Fortschritt aktiviert ist.
- `slack-reaction-glyph-native` – optionales Live-Szenario für Reaktionen des Nachrichten-Tools.
  Weist den Agenten an, exakt das Symbol `✅` zu übergeben, und bestätigt, dass Slack
  `white_check_mark` für den SUT-Bot in der Zielnachricht gespeichert hat.
- `slack-chart-presentation-native` – optionales portables Diagrammszenario, das
  den nativen Block `data_visualization` und den exakten barrierefreien Text überprüft.
- `slack-table-presentation-native` – optionales portables Tabellenszenario, das
  den nativen Block `data_table`, die exakten Zeilen und den barrierefreien Text überprüft.
- `slack-table-invalid-blocks-fallback` – optionales Direkttransportszenario,
  das eine strukturell lesbare, das Limit überschreitende Rohdatentabelle mit 101 Datenzeilen
  zuzüglich ihrer Kopfzeile über den
  produktiven Slack-Sendepfad sendet, nachweist, dass Slack selbst `invalid_blocks` zurückgibt,
  und überprüft, dass der gespeicherte Fallback mit deaktivierter Formatierung vollständig ist und keinen
  nativen Datenblock enthält. Die Szenariodetails enthalten ausschließlich sichere Nachweise zu Fehlercode, Anzahl und
  booleschen Werten.
- `slack-approval-exec-native` – optionales natives Slack-Szenario für Exec-Freigaben.
  Fordert über das Gateway eine Exec-Freigabe an, überprüft, ob die Slack-Nachricht
  native Freigabeschaltflächen enthält, löst sie auf und überprüft die aufgelöste Slack-
  Aktualisierung.
- `slack-approval-plugin-native` – optionales natives Slack-Szenario für Plugin-Freigaben.
  Aktiviert die Weiterleitung von Exec- und Plugin-Freigaben gemeinsam, damit Plugin-
  Ereignisse nicht durch das Routing von Exec-Freigaben unterdrückt werden, und überprüft anschließend denselben
  nativen Slack-UI-Pfad für ausstehende und aufgelöste Freigaben.
- `slack-codex-approval-exec-native` – optionales Codex-Guardian-Szenario für Befehlsfreigaben.
  Aktiviert das Codex-Plugin im Guardian-Modus, leitet einen
  von Slack stammenden Gateway-Agentenlauf durch das Codex-App-Server-Test-Harness,
  wartet auf die native Slack-Eingabeaufforderung zur Plugin-Freigabe für
  `openclaw-codex-app-server`, löst sie auf und überprüft, ob der Codex-Lauf
  mit den erwarteten Markierungen für Befehlsausgabe und Assistent abgeschlossen wird.
- `slack-codex-approval-plugin-native` – optionales Codex-Guardian-Szenario für Dateifreigaben.
  Verwendet eine Anweisung `apply_patch` außerhalb des Arbeitsbereichs, damit Codex
  die App-Server-Route zur Freigabe von Dateiänderungen ausgibt, und überprüft anschließend denselben nativen
  Slack-Pfad für ausstehende und aufgelöste Freigaben, die abschließende Assistentenmarkierung und den exakten Dateiinhalt,
  bevor die Bereinigung erfolgt.

Die Codex-Freigabeszenarien erfordern ein `openai/*` oder `codex/*` `--model`, die
üblichen Anmeldedaten für das Live-Modell sowie eine vom Codex-Plugin akzeptierte Codex-Authentifizierung oder API-Schlüssel-Authentifizierung.
Die Szenariodetails enthalten neben den redigierten Slack-Freigabemetadaten
die Codex-App-Server-Methode, den ausgewählten Codex-Modellschlüssel,
den abschließenden Codex-Laufstatus und die Überprüfung der Vorgangsmarkierung.

Ausgabeartefakte:

- `qa-suite-report.md`
- `qa-suite-summary.json`
- `qa-evidence.json` – Nachweiseinträge für die Prüfungen des Live-Transports.
- `approval-checkpoints/` – nur wenn Mantis
  `OPENCLAW_QA_SLACK_APPROVAL_CHECKPOINT_DIR` setzt; enthält Checkpoint-JSON,
  Bestätigungs-JSON sowie Screenshots des ausstehenden und aufgelösten Zustands.

#### Slack-Workspace einrichten

Die Lane benötigt zwei unterschiedliche Slack-Apps in einem Workspace sowie einen Kanal, in dem beide
Bots Mitglieder sind:

- `channelId` – die `Cxxxxxxxxxx`-ID eines Kanals, in den beide Bots
  eingeladen wurden. Verwenden Sie einen dedizierten Kanal; die Lane veröffentlicht bei jedem Lauf Beiträge.
- `driverBotToken` – Bot-Token (`xoxb-...`) der **Treiber**-App.
- `sutBotToken` – Bot-Token (`xoxb-...`) der **SUT**-App, die eine
  von der Treiber-App getrennte Slack-App sein muss, damit ihre Bot-Benutzer-ID eindeutig ist.
- `sutAppToken` – Token auf App-Ebene (`xapp-...`) der SUT-App mit
  `connections:write`, das von Socket Mode verwendet wird, damit die SUT-App Ereignisse empfangen kann.

Ein für QA vorgesehener Slack-Workspace ist der Wiederverwendung eines produktiven
Workspace vorzuziehen.

Das folgende SUT-Manifest beschränkt die produktive Installation
(`extensions/slack/src/setup-shared.ts:12`) des gebündelten Slack-Plugins absichtlich auf die
Berechtigungen und Ereignisse, die von der Slack-Live-QA-Suite abgedeckt werden. Informationen zur
Einrichtung des produktiven Kanals aus Benutzersicht finden Sie unter
[Schnelleinrichtung des Slack-Kanals](/de/channels/slack#quick-setup); das QA-Paar aus Treiber und SUT
ist absichtlich getrennt, da die Lane zwei unterschiedliche Bot-Benutzer-
IDs in einem Workspace benötigt.

**1. Treiber-App erstellen**

Rufen Sie [api.slack.com/apps](https://api.slack.com/apps) auf → _Create New App_ →
_From a manifest_ → wählen Sie den QA-Workspace aus, fügen Sie das folgende Manifest ein
und wählen Sie anschließend _Install to Workspace_:

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

Kopieren Sie das _Bot User OAuth Token_ (`xoxb-...`) – daraus wird
`driverBotToken`. Der Treiber muss lediglich Nachrichten veröffentlichen und sich
identifizieren; keine Ereignisse, kein Socket Mode.

**2. SUT-App erstellen**

Wiederholen Sie _Create New App → From a manifest_ im selben Workspace. Diese QA-App
verwendet absichtlich eine eingeschränktere Version des produktiven Manifests
(`extensions/slack/src/setup-shared.ts:12`) des gebündelten Slack-Plugins: Berechtigungen und Ereignisse
für Reaktionen sind nicht enthalten, da die Slack-Live-QA-Suite die
Verarbeitung von Reaktionen noch nicht abdeckt.

```json
{
  "display_information": {
    "name": "OpenClaw QA SUT",
    "description": "OpenClaw-QA-SUT-Connector für OpenClaw"
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

Überprüfen Sie, dass die beiden Bots unterschiedliche Benutzer-IDs haben, indem Sie `auth.test` für jedes
Token aufrufen. Die Runtime unterscheidet Driver und SUT anhand der Benutzer-ID; wenn dieselbe App
für beide verwendet wird, schlägt das Mention-Gating sofort fehl.

**3. Channel erstellen**

Erstellen Sie im QA-Workspace einen Channel (z. B. `#openclaw-qa`) und laden Sie beide
Bots innerhalb des Channels ein:

```text
/invite @OpenClaw QA Driver
/invite @OpenClaw QA SUT
```

Kopieren Sie die ID `Cxxxxxxxxxx` aus _channel info → About → Channel ID_ – daraus
wird `channelId`. Ein öffentlicher Channel funktioniert; wenn Sie einen privaten Channel verwenden,
verfügen beide Apps bereits über `groups:history`, sodass die Verlaufsabfragen des Harness
weiterhin erfolgreich sind.

**4. Zugangsdaten registrieren**

Es gibt zwei Möglichkeiten. Verwenden Sie Umgebungsvariablen für das Debugging auf einem einzelnen Rechner (setzen Sie die vier
`OPENCLAW_QA_SLACK_*`-Variablen und übergeben Sie `--credential-source env`) oder befüllen Sie
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
in Ihrer Shell exportiert sind, registrieren und überprüfen Sie die Zugangsdaten:

```bash
pnpm openclaw qa credentials add \
  --kind slack \
  --payload-file slack-creds.json \
  --note "Seed für den QA-Slack-Pool"

pnpm openclaw qa credentials list --kind slack --status all --json
```

Erwartet werden `count: 1`, `status: "active"` und kein Feld `lease`.

**5. End-to-End überprüfen**

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
Lane etwa 90 Sekunden hängt und mit `Convex credential pool exhausted
for kind "slack"` beendet wird, ist entweder der Pool leer oder jede Zeile ist geleast – `qa
credentials list --kind slack --status all --json` zeigt Ihnen, welcher Fall vorliegt.

### WhatsApp-QA

```bash
pnpm openclaw qa whatsapp
```

Zielt auf zwei dedizierte WhatsApp-Web-Konten: ein vom Harness gesteuertes
Driver-Konto und ein SUT-Konto, das vom untergeordneten OpenClaw-Gateway über
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
- Nachrichtenaktionen im Benutzerpfad: `whatsapp-agent-message-action-react` beginnt
  mit einer echten Direktnachricht des Drivers, lässt das Modell das Tool `message` aufrufen und
  beobachtet die native WhatsApp-Reaktion. `whatsapp-agent-message-action-upload-file`
  verwendet denselben Ansatz für `message(action=upload-file)` und beobachtet
  native WhatsApp-Medien. `whatsapp-group-agent-message-action-react` und
  `whatsapp-group-agent-message-action-upload-file` weisen dieselben
  benutzersichtbaren Aktionen in einer echten WhatsApp-Gruppe nach.
- Gruppen-Fan-out: `whatsapp-broadcast-group-fanout` beginnt mit einer erwähnenden
  WhatsApp-Gruppennachricht und überprüft unterschiedliche sichtbare Antworten von `main`
  und `qa-second`.
- Gruppenaktivierung: `whatsapp-group-activation-always` ändert eine echte
  Gruppensitzung in `/activation always`, weist nach, dass eine Gruppennachricht ohne Erwähnung
  den Agenten aktiviert, und stellt anschließend `/activation mention` wieder her.
  `whatsapp-group-reply-to-bot-triggers` legt eine Bot-Antwort an, sendet ohne ausdrückliche
  Erwähnung eine native zitierte Antwort darauf und überprüft, dass der Agent
  durch diesen Antwortkontext aktiviert wird.
- Eingehende Medien und strukturierte Nachrichten: `whatsapp-inbound-image-caption`,
  `whatsapp-audio-preflight`, `whatsapp-inbound-structured-messages`,
  `whatsapp-group-audio-gating`, `whatsapp-inbound-reaction-no-trigger`.
  Diese senden echte WhatsApp-Ereignisse für Bilder, Audio, Dokumente, Standorte, Kontakte,
  Sticker und Reaktionen über den Driver.
- Direkte Gateway-Vertragsprüfungen: `whatsapp-outbound-media-matrix`,
  `whatsapp-outbound-document-preserves-filename`, `whatsapp-outbound-poll`,
  `whatsapp-outbound-send-serialization`,
  `whatsapp-group-outbound-media`, `whatsapp-group-outbound-poll`,
  `whatsapp-message-actions`, `whatsapp-reply-context-isolation`,
  `whatsapp-reply-delivery-shape`. Diese umgehen absichtlich das Prompting des Modells
  und weisen deterministische Gateway-/Channel-Verträge für `send`, `poll` und
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

Der Katalog enthält derzeit 52 Szenarien. Die standardmäßige Lane `live-frontier`
wird für eine schnelle Smoke-Test-Abdeckung mit 8 Szenarien klein gehalten. Die standardmäßige Lane `mock-openai`
führt 39 Szenarien deterministisch über den echten WhatsApp-
Transport aus und simuliert dabei nur die Modellausgabe; Genehmigungsszenarien und einige
aufwendigere oder blockierende Prüfungen müssen weiterhin ausdrücklich über ihre Szenario-ID ausgewählt werden.

Der WhatsApp-QA-Driver beobachtet strukturierte Live-Ereignisse (`text`, `media`,
`location`, `reaction` und `poll`) und kann aktiv Medien, Umfragen,
Kontakte, Standorte und Sticker senden. QA Lab importiert diesen Driver über die
Paketschnittstelle `@openclaw/whatsapp/api.js`, statt auf private
WhatsApp-Runtime-Dateien zuzugreifen. Bei Gruppenbeobachtungen ist `fromJid` die Gruppen-JID,
während `participantJid` und `fromPhoneE164` den sendenden Teilnehmer identifizieren.
Nachrichteninhalte werden standardmäßig geschwärzt. Direkte Gateway-Prüfungen für Umfragen, Datei-Uploads,
Medien, Gruppenumfragen, Gruppenmedien und Antwortformen sind Transport-/API-
Vertragsprüfungen; sie gelten nicht als Nachweis dafür, dass eine Benutzereingabe den
Agenten zur Auswahl derselben Aktion veranlasst hat. Der Nachweis für Aktionen im Benutzerpfad stammt aus Szenarien
wie `whatsapp-agent-message-action-react` und
`whatsapp-group-agent-message-action-react`, in denen der Driver eine normale
WhatsApp-Nachricht sendet und QA Lab das daraus resultierende native WhatsApp-Artefakt beobachtet.
Die Details der WhatsApp-Szenarien enthalten die Ausführungsart jedes Szenarios (`user-path`,
`direct-gateway` oder `native-approval`), damit die Evidenz nicht mit einem
stärkeren Vertrag verwechselt werden kann, als sie tatsächlich nachweist.

Ausgabeartefakte:

- `qa-suite-report.md`
- `qa-suite-summary.json`
- `qa-evidence.json` – Evidenzeinträge für die Live-Transportprüfungen.

### Convex-Zugangsdatenpool

Discord-, Slack-, Telegram- und WhatsApp-Lanes können Zugangsdaten aus einem
gemeinsamen Convex-Pool leasen, statt die oben genannten Umgebungsvariablen zu lesen. Übergeben Sie
`--credential-source convex` (oder setzen Sie `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`);
QA Lab erwirbt einen exklusiven Lease, sendet für die Dauer des
Laufs Heartbeats und gibt ihn beim Herunterfahren frei. Die Pool-Arten sind `"discord"`, `"slack"`,
`"telegram"` und `"whatsapp"`.

Payload-Formate, die der Broker bei `admin/add` validiert:

- Discord (`kind: "discord"`): `{ guildId: string, channelId: string,
driverBotToken: string, sutBotToken: string, sutApplicationId: string }`.
- Telegram (`kind: "telegram"`): `{ groupId: string, driverToken: string,
sutToken: string }` – `groupId` muss eine numerische Chat-ID-Zeichenfolge sein.
- Echter Telegram-Benutzer (`kind: "telegram-user"`): `{ groupId: string, sutToken:
string, testerUserId: string, testerUsername: string, telegramApiId:
string, telegramApiHash: string, tdlibDatabaseEncryptionKey: string,
tdlibArchiveBase64: string, tdlibArchiveSha256: string,
desktopTdataArchiveBase64: string, desktopTdataArchiveSha256: string }` –
  ausschließlich für den Nachweis mit Mantis Telegram Desktop. Allgemeine QA-Lab-Lanes dürfen
  diese Art nicht erwerben.
- WhatsApp (`kind: "whatsapp"`): `{ driverPhoneE164: string, sutPhoneE164:
string, driverAuthArchiveBase64: string, sutAuthArchiveBase64: string,
groupJid?: string }` – Telefonnummern müssen unterschiedliche E.164-Zeichenfolgen sein.

Der Nachweis-Workflow mit Mantis Telegram Desktop hält einen exklusiven Convex-
Lease des Typs `telegram-user` sowohl für den TDLib-CLI-Driver als auch für den Telegram-Desktop-
Witness und gibt ihn nach der Veröffentlichung des Nachweises frei.

Wenn ein PR einen deterministischen visuellen Diff benötigt, kann Mantis dieselbe simulierte
Modellantwort für `main` und für den PR-Head verwenden, während sich der Telegram-Formatierer oder
die Zustellungsschicht ändert. Die Aufnahmestandards sind für PR-Kommentare optimiert: standardmäßige
Crabbox-Klasse, Desktop-Aufnahme mit 24fps, Bewegungs-GIF mit 24fps und eine Vorschau-
breite von 1920px. Vorher-/Nachher-Kommentare sollten ein sauberes Paket veröffentlichen, das
nur die vorgesehenen GIFs enthält.

Slack-Lanes können den Pool ebenfalls verwenden. Die Prüfungen des Slack-Payload-Formats befinden sich derzeit
im Slack-QA-Runner statt im Broker; verwenden Sie `{ channelId: string,
driverBotToken: string, sutBotToken: string, sutAppToken: string }` mit einer
Slack-Channel-ID wie `Cxxxxxxxxxx`. Informationen zur Bereitstellung von Apps
und Scopes finden Sie unter [Slack-Workspace einrichten](#setting-up-the-slack-workspace).

Betriebliche Umgebungsvariablen und der Endpunktvertrag des Convex-Brokers sind unter
[Tests → Gemeinsame Telegram-Zugangsdaten über Convex](/de/help/testing#shared-telegram-credentials-via-convex-v1)
beschrieben (der Abschnittsname stammt aus der Zeit vor dem Multi-Channel-Pool; die Lease-Semantik wird
von allen Arten gemeinsam verwendet).

## Im Repository verwaltete Seeds

Seed-Assets befinden sich in `qa/`:

- `qa/scenarios/index.yaml`
- `qa/scenarios/<theme>/*.yaml`

Sie befinden sich absichtlich in Git, damit der QA-Plan sowohl für Menschen als auch
für den Agenten sichtbar ist.

`qa-lab` bleibt ein generischer YAML-Szenario-Runner. Jede Szenario-YAML-Datei ist die
maßgebliche Quelle für einen Testlauf und sollte Folgendes definieren:

- `title` auf oberster Ebene
- `scenario`-Metadaten
- optionale Kategorie-, Funktions-, Lane- und Risikometadaten in `scenario`
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
Quellbaums gruppiert werden. Szenario-IDs müssen bei Dateiverschiebungen stabil bleiben; verwenden Sie `docsRefs` und
`codeRefs` für die Rückverfolgbarkeit der Implementierung.

Die Basisliste sollte breit genug bleiben, um Folgendes abzudecken:

- Direktnachrichten und Kanal-Chat
- Thread-Verhalten
- Lebenszyklus von Nachrichtenaktionen
- Cron-Callbacks
- Speicherabruf
- Modellwechsel
- Übergabe an Subagenten
- Lesen von Repository und Dokumentation
- eine kleine Build-Aufgabe wie Lobster Invaders

## Provider-Mock-Lanes

`qa suite` verfügt über zwei lokale Provider-Mock-Lanes:

- `mock-openai` ist der szenariobewusste OpenClaw-Mock. Er bleibt die standardmäßige
  deterministische Mock-Lane für Repository-gestützte QA- und Paritätsprüfungen.
- `aimock` startet einen AIMock-gestützten Provider-Server für experimentelle
  Protokoll-, Fixture-, Aufzeichnungs-/Wiedergabe- und Chaos-Abdeckung. Er ist eine Ergänzung und
  ersetzt den `mock-openai`-Szenario-Dispatcher nicht.

Die Implementierung der Provider-Lanes befindet sich unter `extensions/qa-lab/src/providers/`.
Jeder Provider verwaltet seine Standardwerte, den Start des lokalen Servers, die Gateway-Modellkonfiguration,
Anforderungen für die Bereitstellung von Authentifizierungsprofilen sowie Live-/Mock-Funktionsflags. Gemeinsamer Suite- und
Gateway-Code wird über die Provider-Registry geleitet, statt anhand von
Provider-Namen zu verzweigen.

## Transportadapter

`qa-lab` stellt eine generische Transportschnittstelle für YAML-QA-Szenarien bereit. `qa-channel` ist
der synthetische Standard. `crabline` startet lokale, Provider-ähnliche Server und
führt die normalen Kanal-Plugins von OpenClaw gegen sie aus. `live` ist für
echte Provider-Anmeldedaten und externe Kanäle reserviert.

Auf Architekturebene ist die Aufteilung wie folgt:

- `qa-lab` verwaltet die generische Szenarioausführung, Worker-Parallelität, das Schreiben
  von Artefakten und die Berichterstellung.
- Der Transportadapter verwaltet Gateway-Konfiguration, Bereitschaft, Beobachtung ein- und ausgehender
  Vorgänge, Transportaktionen und normalisierten Transportzustand.
- YAML-Szenariodateien unter `qa/scenarios/` definieren den Testlauf; `qa-lab`
  stellt die wiederverwendbare Runtime-Oberfläche bereit, die sie ausführt.

### Kanal hinzufügen

Das Hinzufügen eines Kanals zum YAML-QA-System erfordert die Kanalimplementierung
sowie ein Szenariopaket, das den Kanalvertrag ausübt. Fügen Sie für die Smoke-CI-
Abdeckung den passenden lokalen Crabline-Provider-Server hinzu und stellen Sie ihn
über den `crabline`-Treiber bereit.

Fügen Sie keinen neuen QA-Befehlsstamm auf oberster Ebene hinzu, wenn der gemeinsame `qa-lab`-Host
den Ablauf verwalten kann.

`qa-lab` verwaltet die gemeinsamen Host-Mechanismen:

- den `openclaw qa`-Befehlsstamm
- Start und Beendigung der Suite
- Worker-Parallelität
- Schreiben von Artefakten
- Berichterstellung
- Szenarioausführung
- Kompatibilitätsaliase für ältere `qa-channel`-Szenarien

Runner-Plugins verwalten den Transportvertrag:

- wie `openclaw qa <runner>` unter dem gemeinsamen `qa`-Stamm eingebunden wird
- wie das Gateway für diesen Transport konfiguriert wird
- wie die Bereitschaft geprüft wird
- wie eingehende Ereignisse eingespeist werden
- wie ausgehende Nachrichten beobachtet werden
- wie Transkripte und normalisierter Transportzustand bereitgestellt werden
- wie transportgestützte Aktionen ausgeführt werden
- wie transportspezifisches Zurücksetzen oder Bereinigen durchgeführt wird

Die Mindestanforderungen für die Einführung eines neuen Kanals:

1. Belassen Sie `qa-lab` als zuständige Komponente für den gemeinsamen `qa`-Stamm.
2. Implementieren Sie den Transport-Runner über die gemeinsame `qa-lab`-Host-Schnittstelle.
3. Belassen Sie transportspezifische Mechanismen innerhalb des Runner-Plugins oder Kanal-
   Harnesses.
4. Binden Sie den Runner als `openclaw qa <runner>` ein, statt einen konkurrierenden
   Stammbefehl zu registrieren. Runner-Plugins sollten `qaRunners` in
   `openclaw.plugin.json` deklarieren und ein passendes `qaRunnerCliRegistrations`-
   Array aus `runtime-api.ts` exportieren. Halten Sie `runtime-api.ts` schlank; verzögerte CLI- und
   Runner-Ausführung sollten hinter getrennten Einstiegspunkten verbleiben. Ein optionales
   `adapterFactory` stellt den Transport gemeinsamen Szenarien bereit, ohne
   den vorhandenen Szenariokatalog des Befehls zu ändern.
5. Erstellen oder adaptieren Sie YAML-Szenarien unter den thematisch gegliederten `qa/scenarios/`-
   Verzeichnissen.
6. Verwenden Sie für neue Szenarien die generischen Szenario-Hilfsfunktionen.
7. Erhalten Sie vorhandene Kompatibilitätsaliase, sofern das Repository keine
   beabsichtigte Migration durchführt.

Die Entscheidungsregel ist strikt:

- Wenn ein Verhalten einmalig in `qa-lab` ausgedrückt werden kann, platzieren Sie es in `qa-lab`.
- Wenn ein Verhalten von einem einzelnen Kanaltransport abhängt, belassen Sie es in diesem Runner-
  Plugin oder Plugin-Harness.
- Wenn ein Szenario eine neue Funktion benötigt, die mehr als ein Kanal verwenden kann,
  fügen Sie eine generische Hilfsfunktion statt einer kanalspezifischen Verzweigung in `suite.ts` hinzu.
- Wenn ein Verhalten nur für einen Transport sinnvoll ist, belassen Sie das Szenario
  transportspezifisch und machen Sie dies im Szenariovertrag ausdrücklich kenntlich.

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

Kompatibilitätsaliase bleiben für vorhandene Szenarien verfügbar:
`waitForQaChannelReady`, `waitForOutboundMessage`, `waitForNoOutbound`,
`formatConversationTranscript`, `resetBus`. Neue Szenarien
sollten jedoch die generischen Namen verwenden. Die Aliase dienen dazu, eine
Migration zu einem einzigen Stichtag zu vermeiden, und sind nicht das Modell für die Zukunft.

## Berichterstellung

`qa-lab` exportiert einen Markdown-Protokollbericht aus der beobachteten Bus-Zeitleiste.
Der Bericht sollte folgende Fragen beantworten:

- Was hat funktioniert?
- Was ist fehlgeschlagen?
- Was blieb blockiert?
- Welche Folgeszenarien sind sinnvoll?

Führen Sie für das Inventar verfügbarer Szenarien – nützlich zur Einschätzung von Folgearbeiten
oder zur Anbindung eines neuen Transports – `pnpm openclaw qa coverage` aus (fügen Sie `--json`
für maschinenlesbare Ausgabe hinzu). Führen Sie bei der Auswahl eines fokussierten Nachweises für ein geändertes
Verhalten oder einen geänderten Dateipfad `pnpm openclaw qa coverage --match <query>` aus. Der
Übereinstimmungsbericht durchsucht Szenariometadaten, Dokumentationsreferenzen, Codereferenzen, Abdeckungs-IDs,
Plugins und Provider-Anforderungen und gibt anschließend passende `qa suite
--scenario ...`-Ziele aus.

Jeder `qa suite`-Lauf schreibt die Artefakte `qa-evidence.json`,
`qa-suite-summary.json` und `qa-suite-report.md` auf oberster Ebene für die ausgewählte
Szenariomenge. Szenarien, die `execution.kind: vitest` oder
`execution.kind: playwright` deklarieren, führen den passenden Testpfad aus und schreiben außerdem
szenariospezifische Protokolle. Szenarien, die `execution.kind: script` deklarieren, führen den
Nachweisproduzenten unter `execution.path` über `node --import tsx` aus (wobei
`${outputDir}` und `${scenarioId}` in `execution.args` expandiert werden); der
Produzent schreibt eine eigene `qa-evidence.json`, deren Einträge in
die Suite-Ausgabe importiert und deren Artefaktpfade relativ zu dieser
Produzenten-`qa-evidence.json` aufgelöst werden. Wenn `qa suite` über `qa run
--qa-profile` erreicht wird, enthält dieselbe `qa-evidence.json` außerdem die
Scorecard-Zusammenfassung des Profils für die ausgewählten Taxonomiekategorien.

Behandeln Sie die Abdeckungsausgabe als Hilfsmittel zur Ermittlung und nicht als Ersatz für eine Prüfung; das
ausgewählte Szenario benötigt weiterhin den richtigen Provider-Modus, Live-Transport,
Multipass, Testbox oder die Release-Lane für das geprüfte Verhalten. Kontext zur
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
Charakterbewertung sollten die Persona über `SOUL.md` festlegen und anschließend normale
Benutzerinteraktionen wie Chat, Workspace-Hilfe und kleine Dateiaufgaben ausführen. Dem Kandidatenmodell
sollte nicht mitgeteilt werden, dass es bewertet wird. Der Befehl bewahrt
jedes vollständige Transkript auf, zeichnet grundlegende Laufstatistiken auf und fordert anschließend die Bewertungsmodelle im
schnellen Modus mit `xhigh`-Reasoning, sofern unterstützt, dazu auf, die Läufe nach
Natürlichkeit, Atmosphäre und Humor zu ordnen. Verwenden Sie beim Vergleich von
Providern `--blind-judge-models`: Der Bewertungsprompt erhält weiterhin jedes Transkript und jeden Laufstatus, aber
Kandidatenreferenzen werden durch neutrale Bezeichnungen wie `candidate-01` ersetzt; der
Bericht ordnet die Platzierungen nach dem Parsen wieder den tatsächlichen Referenzen zu.

Kandidatenläufe verwenden standardmäßig `high`-Thinking, mit `medium` für GPT-5.6 Luna und
`xhigh` für ältere OpenAI-Bewertungsreferenzen, die dies unterstützen. Überschreiben Sie einen bestimmten
Kandidaten inline mit `--model provider/model,thinking=<level>`; Inline-
Optionen unterstützen außerdem `fast`, `no-fast` und `fast=<bool>`. `--thinking
<level>` legt weiterhin einen globalen Fallback fest, und die ältere `--model-thinking
<provider/model=level>`-Form wird aus Kompatibilitätsgründen beibehalten. OpenAI-Kandidatenreferenzen
verwenden standardmäßig den schnellen Modus, sodass priorisierte Verarbeitung eingesetzt wird, sofern der Provider
sie unterstützt. Übergeben Sie `--fast` nur, wenn Sie den schnellen Modus für
jedes Kandidatenmodell erzwingen möchten. Die Laufzeiten von Kandidaten und Bewertern werden im
Bericht für Benchmark-Analysen aufgezeichnet, die Bewertungsprompts weisen jedoch ausdrücklich an, nicht
nach Geschwindigkeit zu ordnen. Kandidaten- und Bewertungsmodellläufe verwenden beide standardmäßig eine Parallelität von 16.
Reduzieren Sie `--concurrency` oder `--judge-concurrency`, wenn Provider-Limits oder lokale
Gateway-Auslastung einen Lauf zu störanfällig machen.

Wenn kein Kandidaten-`--model` übergeben wird, verwendet die Charakterbewertung standardmäßig
`openai/gpt-5.6-luna`, `openai/gpt-5.2`, `openai/gpt-5`,
`anthropic/claude-opus-4-8`, `anthropic/claude-sonnet-4-6`, `zai/glm-5.1`,
`moonshot/kimi-k2.5` und `google/gemini-3.1-pro-preview`. Wenn kein
`--judge-model` übergeben wird, verwenden die Bewerter standardmäßig
`openai/gpt-5.6-sol,thinking=xhigh,fast` und
`anthropic/claude-opus-4-8,thinking=high`.

## Verwandte Dokumentation

- [Reifegrad-Scorecard](/de/maturity/scorecard)
- [Benchmark-Paket für persönliche Agenten](/de/concepts/personal-agent-benchmark-pack)
- [QA-Kanal](/de/channels/qa-channel)
- [Testen](/de/help/testing)
- [Dashboard](/de/web/dashboard)
