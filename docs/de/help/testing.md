---
read_when:
    - Tests lokal oder in CI ausführen
    - Regressionstests für Modell-/Provider-Fehler hinzufügen
    - Debugging von Gateway- und Agent-Verhalten
summary: 'Test-Kit: Unit-/e2e-/Live-Suites, Docker-Runner und was jeder Test abdeckt'
title: Testen
x-i18n:
    generated_at: "2026-04-30T18:38:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: 470a96c6b47c2708950d05adc4a4efba5fe290f0675a131e2888d2d0032d5953
    source_path: help/testing.md
    workflow: 16
---

OpenClaw verfügt über drei Vitest-Suites (Unit/Integration, E2E, Live) und einen kleinen Satz
von Docker-Runnern. Dieses Dokument ist ein Leitfaden dazu, „wie wir testen“:

- Was jede Suite abdeckt (und was sie bewusst _nicht_ abdeckt).
- Welche Befehle Sie für gängige Workflows ausführen sollten (lokal, vor dem Push, Debugging).
- Wie Live-Tests Zugangsdaten erkennen und Modelle/Provider auswählen.
- Wie Sie Regressionen für reale Modell-/Provider-Probleme hinzufügen.

<Note>
**QA-Stack (qa-lab, qa-channel, Live-Transport-Lanes)** ist separat dokumentiert:

- [QA-Übersicht](/de/concepts/qa-e2e-automation) — Architektur, Befehlsoberfläche, Szenario-Erstellung.
- [Matrix-QA](/de/concepts/qa-matrix) — Referenz für `pnpm openclaw qa matrix`.
- [QA-Kanal](/de/channels/qa-channel) — das synthetische Transport-Plugin, das von repo-gestützten Szenarien verwendet wird.

Diese Seite behandelt das Ausführen der regulären Test-Suites und Docker-/Parallels-Runner. Der Abschnitt zu QA-spezifischen Runnern unten ([QA-spezifische Runner](#qa-specific-runners)) listet die konkreten `qa`-Aufrufe auf und verweist zurück auf die obigen Referenzen.
</Note>

## Schnellstart

An den meisten Tagen:

- Vollständiges Gate (vor dem Push erwartet): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- Schnellere lokale Ausführung der vollständigen Suite auf einer großzügig ausgestatteten Maschine: `pnpm test:max`
- Direkte Vitest-Watch-Schleife: `pnpm test:watch`
- Direkte Dateizielauswahl routet jetzt auch Erweiterungs-/Kanalpfade: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- Bevorzugen Sie zuerst gezielte Läufe, wenn Sie an einem einzelnen Fehler iterieren.
- Docker-gestützte QA-Site: `pnpm qa:lab:up`
- Linux-VM-gestützte QA-Lane: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

Wenn Sie Tests anfassen oder zusätzliche Sicherheit wünschen:

- Coverage-Gate: `pnpm test:coverage`
- E2E-Suite: `pnpm test:e2e`

Beim Debuggen echter Provider/Modelle (erfordert echte Zugangsdaten):

- Live-Suite (Modelle + Gateway-Tool-/Bildprüfungen): `pnpm test:live`
- Eine Live-Datei gezielt und leise ausführen: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Docker-Live-Modell-Sweep: `pnpm test:docker:live-models`
  - Jedes ausgewählte Modell führt jetzt einen Text-Turn plus eine kleine dateilesenartige Prüfung aus.
    Modelle, deren Metadaten `image`-Eingabe ausweisen, führen außerdem einen kleinen Bild-Turn aus.
    Deaktivieren Sie die zusätzlichen Prüfungen mit `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` oder
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0`, wenn Sie Provider-Fehler isolieren.
  - CI-Abdeckung: Die täglichen `OpenClaw Scheduled Live And E2E Checks` und manuellen
    `OpenClaw Release Checks` rufen beide den wiederverwendbaren Live-/E2E-Workflow mit
    `include_live_suites: true` auf; dieser umfasst separate Docker-Live-Modell-
    Matrix-Jobs, nach Provider aufgeteilt.
  - Für fokussierte CI-Wiederholungen starten Sie `OpenClaw Live And E2E Checks (Reusable)`
    mit `include_live_suites: true` und `live_models_only: true`.
  - Fügen Sie neue hochsignalige Provider-Secrets zu `scripts/ci-hydrate-live-auth.sh`
    sowie `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` und dessen
    geplanten/Release-Aufrufern hinzu.
- Nativer Codex-Smoke für gebundenen Chat: `pnpm test:docker:live-codex-bind`
  - Führt eine Docker-Live-Lane gegen den Codex-App-Server-Pfad aus, bindet eine synthetische
    Slack-DM mit `/codex bind`, übt `/codex fast` und
    `/codex permissions` aus und verifiziert anschließend, dass eine einfache Antwort und ein Bildanhang
    über die native Plugin-Bindung statt über ACP geroutet werden.
- Codex-App-Server-Harness-Smoke: `pnpm test:docker:live-codex-harness`
  - Führt Gateway-Agent-Turns über das Plugin-eigene Codex-App-Server-Harness aus,
    verifiziert `/codex status` und `/codex models` und übt standardmäßig Bild-,
    Cron-MCP-, Sub-Agent- und Guardian-Prüfungen aus. Deaktivieren Sie die Sub-Agent-Prüfung mit
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0`, wenn Sie andere Codex-
    App-Server-Fehler isolieren. Für eine fokussierte Sub-Agent-Prüfung deaktivieren Sie die anderen Prüfungen:
    `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`.
    Dies beendet sich nach der Sub-Agent-Prüfung, sofern nicht
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0` gesetzt ist.
- Crestodian-Smoke für den Rettungsbefehl: `pnpm test:live:crestodian-rescue-channel`
  - Optionale zusätzliche Prüfung für die Oberfläche des Rettungsbefehls im Nachrichtenkanal.
    Sie übt `/crestodian status` aus, stellt eine persistente Modelländerung in die Warteschlange,
    antwortet mit `/crestodian yes` und verifiziert den Audit-/Konfigurationsschreibpfad.
- Crestodian-Planer-Docker-Smoke: `pnpm test:docker:crestodian-planner`
  - Führt Crestodian in einem konfigurationslosen Container mit einer gefälschten Claude-CLI auf `PATH`
    aus und verifiziert, dass der unscharfe Planer-Fallback in einen auditierten typisierten
    Konfigurationsschreibvorgang übersetzt wird.
- Crestodian-Erstlauf-Docker-Smoke: `pnpm test:docker:crestodian-first-run`
  - Startet aus einem leeren OpenClaw-Zustandsverzeichnis, routet blankes `openclaw` zu
    Crestodian, wendet Setup-/Modell-/Agent-/Discord-Plugin- + SecretRef-Schreibvorgänge an,
    validiert die Konfiguration und verifiziert Audit-Einträge. Derselbe Ring-0-Setup-Pfad ist
    auch in QA Lab abgedeckt durch
    `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup`.
- Moonshot-/Kimi-Kosten-Smoke: Führen Sie mit gesetztem `MOONSHOT_API_KEY`
  `openclaw models list --provider moonshot --json` aus und anschließend einen isolierten
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  gegen `moonshot/kimi-k2.6`. Verifizieren Sie, dass das JSON Moonshot/K2.6 meldet und das
  Assistententranskript normalisierte `usage.cost` speichert.

<Tip>
Wenn Sie nur einen fehlgeschlagenen Fall benötigen, grenzen Sie Live-Tests bevorzugt über die unten beschriebenen Allowlist-Umgebungsvariablen ein.
</Tip>

## QA-spezifische Runner

Diese Befehle stehen neben den Haupt-Test-Suites, wenn Sie QA-Lab-Realismus benötigen:

CI führt QA Lab in dedizierten Workflows aus. `Parity gate` läuft auf passenden PRs und
per manuellem Dispatch mit Mock-Providern. `QA-Lab - All Lanes` läuft nachts auf
`main` und per manuellem Dispatch mit dem Mock-Paritäts-Gate, der Live-Matrix-Lane,
der von Convex verwalteten Live-Telegram-Lane und der von Convex verwalteten Live-Discord-Lane als
parallele Jobs. Geplante QA- und Release-Prüfungen übergeben Matrix `--profile fast`
explizit, während die Standardwerte der Matrix-CLI und der manuellen Workflow-Eingabe
`all` bleiben; manueller Dispatch kann `all` in `transport`, `media`, `e2ee-smoke`,
`e2ee-deep` und `e2ee-cli`-Jobs sharden. `OpenClaw Release Checks` führt vor der
Release-Freigabe Parität plus die schnellen Matrix- und Telegram-Lanes aus und verwendet
`mock-openai/gpt-5.5` für Release-Transportprüfungen, damit sie deterministisch bleiben
und den normalen Start von Provider-Plugins vermeiden. Diese Live-Transport-Gateways deaktivieren
die Speichersuche; Speicherverhalten bleibt durch die QA-Paritäts-Suites abgedeckt.

Vollständige Release-Live-Media-Shards verwenden
`ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, das bereits
`ffmpeg` und `ffprobe` enthält. Docker-Live-Modell-/Backend-Shards verwenden das gemeinsam genutzte
`ghcr.io/openclaw/openclaw-live-test:<sha>`-Image, das einmal pro ausgewähltem
Commit gebaut wird, und ziehen es dann mit `OPENCLAW_SKIP_DOCKER_BUILD=1`, statt es
in jedem Shard neu zu bauen.

- `pnpm openclaw qa suite`
  - Führt repo-gestützte QA-Szenarien direkt auf dem Host aus.
  - Führt mehrere ausgewählte Szenarien standardmäßig parallel mit isolierten
    Gateway-Workern aus. `qa-channel` verwendet standardmäßig Nebenläufigkeit 4 (begrenzt durch die
    ausgewählte Szenarioanzahl). Verwenden Sie `--concurrency <count>`, um die Worker-
    Anzahl anzupassen, oder `--concurrency 1` für die ältere serielle Lane.
  - Beendet sich mit einem Nicht-Null-Code, wenn irgendein Szenario fehlschlägt. Verwenden Sie `--allow-failures`, wenn Sie
    Artefakte ohne fehlschlagenden Exit-Code möchten.
  - Unterstützt Provider-Modi `live-frontier`, `mock-openai` und `aimock`.
    `aimock` startet einen lokalen AIMock-gestützten Provider-Server für experimentelle
    Fixture- und Protokoll-Mock-Abdeckung, ohne die szenariobewusste
    `mock-openai`-Lane zu ersetzen.
- `pnpm test:gateway:cpu-scenarios`
  - Führt den Gateway-Startup-Benchmark plus ein kleines Mock-QA-Lab-Szenariopaket
    (`channel-chat-baseline`, `memory-failure-fallback`,
    `gateway-restart-inflight-run`) aus und schreibt eine kombinierte CPU-Beobachtungs-
    Zusammenfassung unter `.artifacts/gateway-cpu-scenarios/`.
  - Markiert standardmäßig nur anhaltende Hot-CPU-Beobachtungen (`--cpu-core-warn`
    plus `--hot-wall-warn-ms`), sodass kurze Startup-Spitzen als Metriken aufgezeichnet werden,
    ohne wie die minutenlange Gateway-Peg-Regression auszusehen.
  - Verwendet gebaute `dist`-Artefakte; führen Sie zuerst einen Build aus, wenn der Checkout noch keine
    frische Runtime-Ausgabe hat.
- `pnpm openclaw qa suite --runner multipass`
  - Führt dieselbe QA-Suite in einer verwerfbaren Multipass-Linux-VM aus.
  - Behält dasselbe Verhalten zur Szenarioauswahl wie `qa suite` auf dem Host bei.
  - Verwendet dieselben Provider-/Modellauswahl-Flags wie `qa suite`.
  - Live-Läufe leiten die unterstützten QA-Auth-Eingaben weiter, die für den Gast praktikabel sind:
    umgebungsbasierte Provider-Schlüssel, den QA-Live-Provider-Konfigurationspfad und `CODEX_HOME`,
    wenn vorhanden.
  - Ausgabeverzeichnisse müssen unter dem Repo-Root bleiben, damit der Gast über
    den eingehängten Workspace zurückschreiben kann.
  - Schreibt den normalen QA-Bericht + die Zusammenfassung plus Multipass-Logs unter
    `.artifacts/qa-e2e/...`.
- `pnpm qa:lab:up`
  - Startet die Docker-gestützte QA-Site für operatorartige QA-Arbeit.
- `pnpm test:docker:npm-onboard-channel-agent`
  - Baut einen npm-Tarball aus dem aktuellen Checkout, installiert ihn global in
    Docker, führt nichtinteraktives OpenAI-API-Key-Onboarding aus, konfiguriert standardmäßig Telegram,
    verifiziert, dass das Aktivieren des Plugin Runtime-Abhängigkeiten bei Bedarf installiert,
    führt doctor aus und führt einen lokalen Agent-Turn gegen einen gemockten OpenAI-
    Endpunkt aus.
  - Verwenden Sie `OPENCLAW_NPM_ONBOARD_CHANNEL=discord`, um dieselbe Lane für die Paketinstallation
    mit Discord auszuführen.
- `pnpm test:docker:session-runtime-context`
  - Führt einen deterministischen Built-App-Docker-Smoke für eingebettete Runtime-Kontext-
    Transkripte aus. Er verifiziert, dass verborgener OpenClaw-Runtime-Kontext als
    nicht angezeigte benutzerdefinierte Nachricht persistiert wird, statt in den sichtbaren Benutzer-Turn zu gelangen,
    legt anschließend eine betroffene defekte Sitzungs-JSONL an und verifiziert,
    dass `openclaw doctor --fix` sie mit Backup auf den aktiven Branch umschreibt.
- `pnpm test:docker:npm-telegram-live`
  - Installiert einen OpenClaw-Paketkandidaten in Docker, führt Onboarding für das installierte Paket aus,
    konfiguriert Telegram über die installierte CLI und verwendet anschließend die
    Live-Telegram-QA-Lane mit diesem installierten Paket als SUT-Gateway erneut.
  - Standard ist `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta`; setzen Sie
    `OPENCLAW_NPM_TELEGRAM_PACKAGE_TGZ=/path/to/openclaw-current.tgz` oder
    `OPENCLAW_CURRENT_PACKAGE_TGZ`, um stattdessen einen aufgelösten lokalen Tarball zu testen,
    statt aus der Registry zu installieren.
  - Verwendet dieselben Telegram-Umgebungszugangsdaten oder dieselbe Convex-Zugangsdatenquelle wie
    `pnpm openclaw qa telegram`. Setzen Sie für CI-/Release-Automation
    `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex` plus
    `OPENCLAW_QA_CONVEX_SITE_URL` und das Rollen-Secret. Wenn
    `OPENCLAW_QA_CONVEX_SITE_URL` und ein Convex-Rollen-Secret in CI vorhanden sind,
    wählt der Docker-Wrapper Convex automatisch aus.
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` überschreibt die gemeinsam genutzte
    `OPENCLAW_QA_CREDENTIAL_ROLE` nur für diese Lane.
  - GitHub Actions stellt diese Lane als manuellen Maintainer-Workflow
    `NPM Telegram Beta E2E` bereit. Sie läuft nicht bei Merge. Der Workflow verwendet die
    Umgebung `qa-live-shared` und Convex-CI-Zugangsdaten-Leases.
- GitHub Actions stellt außerdem `Package Acceptance` für nebenläufigen Produktnachweis
  gegen ein Kandidatenpaket bereit. Es akzeptiert eine vertrauenswürdige Ref, eine veröffentlichte npm-Spezifikation,
  eine HTTPS-Tarball-URL plus SHA-256 oder ein Tarball-Artefakt aus einem anderen Lauf, lädt
  das normalisierte `openclaw-current.tgz` als `package-under-test` hoch und führt anschließend den
  bestehenden Docker-E2E-Scheduler mit Smoke-, Paket-, Produkt-, vollständigen oder benutzerdefinierten
  Lane-Profilen aus. Setzen Sie `telegram_mode=mock-openai` oder `live-frontier`, um den
  Telegram-QA-Workflow gegen dasselbe `package-under-test`-Artefakt auszuführen.
  - Neuester Beta-Produktnachweis:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f telegram_mode=mock-openai
```

- Nachweis mit exakter Tarball-URL erfordert einen Digest:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=url \
  -f package_url=https://registry.npmjs.org/openclaw/-/openclaw-VERSION.tgz \
  -f package_sha256=<sha256> \
  -f suite_profile=package
```

- Artefakt-Nachweis lädt ein Tarball-Artefakt aus einem anderen Actions-Lauf herunter:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=artifact \
  -f artifact_run_id=<run-id> \
  -f artifact_name=<artifact-name> \
  -f suite_profile=smoke
```

- `pnpm test:docker:bundled-channel-deps`
  - Paketiert und installiert den aktuellen OpenClaw-Build in Docker, startet den Gateway
    mit konfiguriertem OpenAI und aktiviert dann gebündelte Kanäle/Plugins über
    Konfigurationsänderungen.
  - Verifiziert, dass die Setup-Erkennung unkonfigurierte Plugin-Laufzeitabhängigkeiten
    nicht installiert, der erste konfigurierte Gateway- oder Doctor-Lauf die Laufzeitabhängigkeiten
    jedes gebündelten Plugins bei Bedarf installiert und ein zweiter Neustart bereits
    aktivierte Abhängigkeiten nicht erneut installiert.
  - Installiert außerdem eine bekannte ältere npm-Baseline, aktiviert Telegram vor dem Ausführen von
    `openclaw update --tag <candidate>` und verifiziert, dass der Post-Update-Doctor des Kandidaten
    die Laufzeitabhängigkeiten gebündelter Kanäle ohne harness-seitige Postinstall-Reparatur behebt.
- `pnpm test:parallels:npm-update`
  - Führt den nativen Smoke-Test für Updates paketierter Installationen über Parallels-Gäste hinweg aus. Jede
    ausgewählte Plattform installiert zuerst das angeforderte Baseline-Paket, führt dann
    im selben Gast den installierten Befehl `openclaw update` aus und verifiziert die
    installierte Version, den Update-Status, die Gateway-Bereitschaft und einen lokalen
    Agent-Turn.
  - Verwenden Sie `--platform macos`, `--platform windows` oder `--platform linux`, während
    Sie an einem Gast iterieren. Verwenden Sie `--json` für den Pfad zum Zusammenfassungsartefakt und
    den Status pro Lane.
  - Die OpenAI-Lane verwendet standardmäßig `openai/gpt-5.5` für den Nachweis eines Live-Agent-Turns.
    Übergeben Sie `--model <provider/model>` oder setzen Sie
    `OPENCLAW_PARALLELS_OPENAI_MODEL`, wenn Sie bewusst ein anderes
    OpenAI-Modell validieren.
  - Kapseln Sie lange lokale Läufe mit einem Host-Timeout, damit Parallels-Transport-Hänger nicht
    den Rest des Testfensters verbrauchen können:

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - Das Skript schreibt verschachtelte Lane-Logs unter `/tmp/openclaw-parallels-npm-update.*`.
    Prüfen Sie `windows-update.log`, `macos-update.log` oder `linux-update.log`,
    bevor Sie annehmen, dass der äußere Wrapper hängt.
  - Windows-Updates können auf einem kalten Gast 10 bis 15 Minuten in der Post-Update-Doctor-/Laufzeitabhängigkeitsreparatur
    verbringen; das ist weiterhin gesund, solange das verschachtelte
    npm-Debug-Log fortschreitet.
  - Führen Sie diesen aggregierten Wrapper nicht parallel zu einzelnen Parallels-Smoke-Lanes
    für macOS, Windows oder Linux aus. Sie teilen sich den VM-Zustand und können bei
    Snapshot-Wiederherstellung, Paketbereitstellung oder Gast-Gateway-Zustand kollidieren.
  - Der Post-Update-Nachweis führt die normale gebündelte Plugin-Oberfläche aus, weil
    Capability-Fassaden wie Sprache, Bilderzeugung und Medienverständnis
    über gebündelte Laufzeit-APIs geladen werden, auch wenn der Agent-Turn selbst
    nur eine einfache Textantwort prüft.

- `pnpm openclaw qa aimock`
  - Startet nur den lokalen AIMock-Provider-Server für direkte Protokoll-Smoke-Tests.
- `pnpm openclaw qa matrix`
  - Führt die Matrix-Live-QA-Lane gegen einen kurzlebigen Docker-gestützten Tuwunel-Homeserver aus. Nur Source-Checkout — paketierte Installationen liefern `qa-lab` nicht aus.
  - Vollständige CLI, Profil-/Szenariokatalog, Umgebungsvariablen und Artefaktlayout: [Matrix-QA](/de/concepts/qa-matrix).
- `pnpm openclaw qa telegram`
  - Führt die Telegram-Live-QA-Lane gegen eine echte private Gruppe aus und verwendet dabei die Driver- und SUT-Bot-Tokens aus der Umgebung.
  - Erfordert `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` und `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`. Die Gruppen-ID muss die numerische Telegram-Chat-ID sein.
  - Unterstützt `--credential-source convex` für gemeinsam genutzte gepoolte Anmeldedaten. Verwenden Sie standardmäßig den Env-Modus oder setzen Sie `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`, um gepoolte Leases zu nutzen.
  - Beendet sich mit einem von null verschiedenen Exit-Code, wenn ein Szenario fehlschlägt. Verwenden Sie `--allow-failures`, wenn Sie
    Artefakte ohne fehlgeschlagenen Exit-Code wünschen.
  - Erfordert zwei unterschiedliche Bots in derselben privaten Gruppe, wobei der SUT-Bot einen Telegram-Benutzernamen bereitstellt.
  - Aktivieren Sie für eine stabile Bot-zu-Bot-Beobachtung den Bot-zu-Bot-Kommunikationsmodus in `@BotFather` für beide Bots und stellen Sie sicher, dass der Driver-Bot Gruppen-Bot-Traffic beobachten kann.
  - Schreibt einen Telegram-QA-Bericht, eine Zusammenfassung und ein Artefakt mit beobachteten Nachrichten unter `.artifacts/qa-e2e/...`. Antwortszenarien enthalten RTT von der Sendeanforderung des Drivers bis zur beobachteten SUT-Antwort.

Live-Transport-Lanes teilen sich einen Standardvertrag, damit neue Transporte nicht auseinanderlaufen; die Coverage-Matrix pro Lane befindet sich in [QA-Übersicht → Live-Transport-Coverage](/de/concepts/qa-e2e-automation#live-transport-coverage). `qa-channel` ist die breite synthetische Suite und ist nicht Teil dieser Matrix.

### Gemeinsame Telegram-Anmeldedaten über Convex (v1)

Wenn `--credential-source convex` (oder `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`) für
`openclaw qa telegram` aktiviert ist, bezieht das QA-Lab eine exklusive Lease aus einem Convex-gestützten Pool, sendet Heartbeats
für diese Lease, während die Lane läuft, und gibt die Lease beim Herunterfahren frei.

Referenz-Scaffold für das Convex-Projekt:

- `qa/convex-credential-broker/`

Erforderliche Umgebungsvariablen:

- `OPENCLAW_QA_CONVEX_SITE_URL` (zum Beispiel `https://your-deployment.convex.site`)
- Ein Secret für die ausgewählte Rolle:
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` für `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` für `ci`
- Auswahl der Anmeldedatenrolle:
  - CLI: `--credential-role maintainer|ci`
  - Env-Standard: `OPENCLAW_QA_CREDENTIAL_ROLE` (standardmäßig `ci` in CI, andernfalls `maintainer`)

Optionale Umgebungsvariablen:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (Standard `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (Standard `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (Standard `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (Standard `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (Standard `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (optionale Trace-ID)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` erlaubt loopback-`http://`-Convex-URLs nur für lokale Entwicklung.

`OPENCLAW_QA_CONVEX_SITE_URL` sollte im normalen Betrieb `https://` verwenden.

Admin-Befehle für Maintainer (Pool hinzufügen/entfernen/auflisten) erfordern
speziell `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`.

CLI-Helfer für Maintainer:

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

Verwenden Sie `doctor` vor Live-Läufen, um die Convex-Site-URL, Broker-Secrets,
Endpoint-Präfix, HTTP-Timeout und Admin-/List-Erreichbarkeit zu prüfen, ohne
Secret-Werte auszugeben. Verwenden Sie `--json` für maschinenlesbare Ausgabe in Skripten und CI-Hilfsprogrammen.

Standard-Endpoint-Vertrag (`OPENCLAW_QA_CONVEX_SITE_URL` + `/qa-credentials/v1`):

- `POST /acquire`
  - Anfrage: `{ kind, ownerId, actorRole, leaseTtlMs, heartbeatIntervalMs }`
  - Erfolg: `{ status: "ok", credentialId, leaseToken, payload, leaseTtlMs?, heartbeatIntervalMs? }`
  - Erschöpft/wiederholbar: `{ status: "error", code: "POOL_EXHAUSTED" | "NO_CREDENTIAL_AVAILABLE", ... }`
- `POST /heartbeat`
  - Anfrage: `{ kind, ownerId, actorRole, credentialId, leaseToken, leaseTtlMs }`
  - Erfolg: `{ status: "ok" }` (oder leeres `2xx`)
- `POST /release`
  - Anfrage: `{ kind, ownerId, actorRole, credentialId, leaseToken }`
  - Erfolg: `{ status: "ok" }` (oder leeres `2xx`)
- `POST /admin/add` (nur Maintainer-Secret)
  - Anfrage: `{ kind, actorId, payload, note?, status? }`
  - Erfolg: `{ status: "ok", credential }`
- `POST /admin/remove` (nur Maintainer-Secret)
  - Anfrage: `{ credentialId, actorId }`
  - Erfolg: `{ status: "ok", changed, credential }`
  - Schutz bei aktiver Lease: `{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list` (nur Maintainer-Secret)
  - Anfrage: `{ kind?, status?, includePayload?, limit? }`
  - Erfolg: `{ status: "ok", credentials, count }`

Payload-Form für die Telegram-Art:

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` muss ein numerischer Telegram-Chat-ID-String sein.
- `admin/add` validiert diese Form für `kind: "telegram"` und weist fehlerhafte Payloads zurück.

### Einen Kanal zu QA hinzufügen

Die Architektur- und Szenario-Helfernamen für neue Kanaladapter befinden sich in [QA-Übersicht → Einen Kanal hinzufügen](/de/concepts/qa-e2e-automation#adding-a-channel). Die Mindestanforderung: den Transport-Runner auf der gemeinsamen `qa-lab`-Host-Naht implementieren, `qaRunners` im Plugin-Manifest deklarieren, als `openclaw qa <runner>` einhängen und Szenarien unter `qa/scenarios/` erstellen.

## Test-Suites (was wo läuft)

Betrachten Sie die Suites als „zunehmender Realismus“ (und zunehmende Flakiness/Kosten):

### Unit / Integration (Standard)

- Befehl: `pnpm test`
- Konfiguration: Nicht zielgerichtete Läufe verwenden das Shard-Set `vitest.full-*.config.ts` und können Multi-Projekt-Shards für parallele Planung in projektbezogene Konfigurationen erweitern
- Dateien: Core-/Unit-Inventare unter `src/**/*.test.ts`, `packages/**/*.test.ts` und `test/**/*.test.ts`; UI-Unit-Tests laufen im dedizierten `unit-ui`-Shard
- Umfang:
  - Reine Unit-Tests
  - In-Prozess-Integrationstests (Gateway-Auth, Routing, Tooling, Parsing, Konfiguration)
  - Deterministische Regressionen für bekannte Fehler
- Erwartungen:
  - Läuft in CI
  - Keine echten Schlüssel erforderlich
  - Sollte schnell und stabil sein
  - Resolver- und Public-Surface-Loader-Tests müssen breites `api.js`- und
    `runtime-api.js`-Fallback-Verhalten mit generierten kleinen Plugin-Fixtures nachweisen, nicht mit
    echten gebündelten Plugin-Quell-APIs. Echte Plugin-API-Ladevorgänge gehören in
    Plugin-eigene Contract-/Integration-Suites.

<AccordionGroup>
  <Accordion title="Projekte, Shards und bereichsgebundene Lanes">

    - Nicht zielgerichtete `pnpm test`-Läufe verwenden zwölf kleinere Shard-Konfigurationen (`core-unit-fast`, `core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) statt eines einzigen riesigen nativen Root-Projekt-Prozesses. Das senkt den Spitzen-RSS auf ausgelasteten Maschinen und verhindert, dass Auto-Reply-/Plugin-Arbeit unabhängige Suites ausbremst.
    - `pnpm test --watch` verwendet weiterhin den nativen Root-Projektgraphen aus `vitest.config.ts`, weil ein Multi-Shard-Watch-Loop nicht praktikabel ist.
    - `pnpm test`, `pnpm test:watch` und `pnpm test:perf:imports` leiten explizite Datei-/Verzeichnisziele zuerst über scoped Lanes, sodass `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` nicht die volle Startlast des Root-Projekts zahlt.
    - `pnpm test:changed` erweitert geänderte Git-Pfade standardmäßig zu günstigen scoped Lanes: direkte Teständerungen, benachbarte `*.test.ts`-Dateien, explizite Source-Mappings und lokale Importgraph-Abhängige. Config-/Setup-/Package-Änderungen führen keine breiten Testläufe aus, außer Sie verwenden explizit `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`.
    - `pnpm check:changed` ist das normale intelligente lokale Check-Gate für eng begrenzte Arbeit. Es klassifiziert das Diff in Core, Core-Tests, Plugins, Plugin-Tests, Apps, Docs, Release-Metadaten, Live-Docker-Tooling und Tooling und führt dann die passenden Typecheck-, Lint- und Guard-Befehle aus. Es führt keine Vitest-Tests aus; verwenden Sie `pnpm test:changed` oder explizit `pnpm test <target>` als Testnachweis. Version-Bumps, die nur Release-Metadaten betreffen, führen gezielte Versions-/Config-/Root-Abhängigkeitschecks aus, mit einem Guard, der Package-Änderungen außerhalb des obersten Versionsfelds ablehnt.
    - Änderungen am Live-Docker-ACP-Harness führen fokussierte Checks aus: Shell-Syntax für die Live-Docker-Auth-Skripte und einen Live-Docker-Scheduler-Dry-Run. `package.json`-Änderungen werden nur einbezogen, wenn das Diff auf `scripts["test:docker:live-*"]` beschränkt ist; Änderungen an Abhängigkeiten, Exporten, Versionen und anderen Package-Oberflächen verwenden weiterhin die breiteren Guards.
    - Import-leichte Unit-Tests aus Agenten, Befehlen, Plugins, Auto-Reply-Helfern, `plugin-sdk` und ähnlichen reinen Utility-Bereichen laufen über die Lane `unit-fast`, die `test/setup-openclaw-runtime.ts` überspringt; zustandsbehaftete/runtime-lastige Dateien bleiben auf den bestehenden Lanes.
    - Ausgewählte Helper-Quelldateien aus `plugin-sdk` und `commands` mappen Läufe im Changed-Modus ebenfalls auf explizite benachbarte Tests in diesen leichten Lanes, sodass Helper-Änderungen nicht erneut die vollständige schwere Suite für dieses Verzeichnis ausführen.
    - `auto-reply` hat dedizierte Buckets für Top-Level-Core-Helfer, Top-Level-Integrationstests `reply.*` und den Teilbaum `src/auto-reply/reply/**`. CI teilt den Reply-Teilbaum zusätzlich in Shards für Agent-Runner, Dispatch und Commands/State-Routing auf, damit ein importlastiger Bucket nicht den gesamten Node-Nachlauf besitzt.
    - Normale PR-/Main-CI überspringt absichtlich den Plugin-Batch-Sweep und den release-only Shard `agentic-plugins`. Full Release Validation startet den separaten Child-Workflow `Plugin Prerelease` für diese Plugin-lastigen Suites auf Release Candidates.

  </Accordion>

  <Accordion title="Abdeckung des eingebetteten Runners">

    - Wenn Sie Eingaben für die Message-Tool-Erkennung oder den Compaction-Runtime-Kontext ändern, behalten Sie beide Abdeckungsebenen bei.
    - Fügen Sie fokussierte Helper-Regressionen für reine Routing- und Normalisierungsgrenzen hinzu.
    - Halten Sie die Integrations-Suites des eingebetteten Runners funktionsfähig:
      `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
      `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts` und
      `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
    - Diese Suites verifizieren, dass scoped IDs und Compaction-Verhalten weiterhin durch die echten Pfade `run.ts` / `compact.ts` laufen; reine Helper-Tests sind kein ausreichender Ersatz für diese Integrationspfade.

  </Accordion>

  <Accordion title="Vitest-Pool- und Isolations-Defaults">

    - Die Basis-Vitest-Konfiguration verwendet standardmäßig `threads`.
    - Die gemeinsame Vitest-Konfiguration setzt `isolate: false` fest und verwendet den nicht isolierten Runner über die Root-Projekte, e2e- und Live-Konfigurationen hinweg.
    - Die Root-UI-Lane behält ihr `jsdom`-Setup und den Optimizer bei, läuft aber ebenfalls auf dem gemeinsamen nicht isolierten Runner.
    - Jeder `pnpm test`-Shard erbt dieselben Defaults `threads` + `isolate: false` aus der gemeinsamen Vitest-Konfiguration.
    - `scripts/run-vitest.mjs` fügt standardmäßig `--no-maglev` für Vitest-Child-Node-Prozesse hinzu, um V8-Compile-Churn bei großen lokalen Läufen zu reduzieren. Setzen Sie `OPENCLAW_VITEST_ENABLE_MAGLEV=1`, um mit dem Standardverhalten von V8 zu vergleichen.

  </Accordion>

  <Accordion title="Schnelle lokale Iteration">

    - `pnpm changed:lanes` zeigt, welche architektonischen Lanes ein Diff auslöst.
    - Der Pre-Commit-Hook führt nur Formatierung aus. Er staged formatierte Dateien erneut und führt weder Lint, Typecheck noch Tests aus.
    - Führen Sie `pnpm check:changed` explizit vor der Übergabe oder dem Push aus, wenn Sie das intelligente lokale Check-Gate benötigen.
    - `pnpm test:changed` routet standardmäßig über günstige scoped Lanes. Verwenden Sie `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` nur, wenn der Agent entscheidet, dass eine Harness-, Config-, Package- oder Contract-Änderung wirklich breitere Vitest-Abdeckung benötigt.
    - `pnpm test:max` und `pnpm test:changed:max` behalten dasselbe Routing-Verhalten bei, nur mit einer höheren Worker-Obergrenze.
    - Die lokale automatische Worker-Skalierung ist absichtlich konservativ und reduziert die Auslastung, wenn der Host-Load-Average bereits hoch ist, sodass mehrere gleichzeitige Vitest-Läufe standardmäßig weniger Schaden anrichten.
    - Die Basis-Vitest-Konfiguration markiert die Projekte/Konfigurationsdateien als `forceRerunTriggers`, damit Wiederholungen im Changed-Modus korrekt bleiben, wenn sich die Testverdrahtung ändert.
    - Die Konfiguration hält `OPENCLAW_VITEST_FS_MODULE_CACHE` auf unterstützten Hosts aktiviert; setzen Sie `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path`, wenn Sie einen expliziten Cache-Speicherort für direktes Profiling wünschen.

  </Accordion>

  <Accordion title="Perf-Debugging">

    - `pnpm test:perf:imports` aktiviert Vitest-Importdauer-Reporting plus Import-Breakdown-Ausgabe.
    - `pnpm test:perf:imports:changed` beschränkt dieselbe Profiling-Ansicht auf Dateien, die seit `origin/main` geändert wurden.
    - Shard-Timing-Daten werden nach `.artifacts/vitest-shard-timings.json` geschrieben. Läufe über die gesamte Konfiguration verwenden den Konfigurationspfad als Schlüssel; Include-Pattern-CI-Shards hängen den Shard-Namen an, damit gefilterte Shards separat verfolgt werden können.
    - Wenn ein heißer Test weiterhin den Großteil seiner Zeit in Startimporten verbringt, halten Sie schwere Abhängigkeiten hinter einer engen lokalen `*.runtime.ts`-Nahtstelle und mocken Sie diese Nahtstelle direkt, statt Runtime-Helfer nur tief zu importieren, um sie durch `vi.mock(...)` zu schleusen.
    - `pnpm test:perf:changed:bench -- --ref <git-ref>` vergleicht geroutetes `test:changed` mit dem nativen Root-Projektpfad für dieses committete Diff und gibt Wall-Time plus macOS-Max-RSS aus.
    - `pnpm test:perf:changed:bench -- --worktree` benchmarked den aktuellen Dirty Tree, indem die geänderte Dateiliste durch `scripts/test-projects.mjs` und die Root-Vitest-Konfiguration geroutet wird.
    - `pnpm test:perf:profile:main` schreibt ein Main-Thread-CPU-Profil für Vitest-/Vite-Startup- und Transform-Overhead.
    - `pnpm test:perf:profile:runner` schreibt Runner-CPU+Heap-Profile für die Unit-Suite mit deaktivierter Dateiparallelität.

  </Accordion>
</AccordionGroup>

### Stabilität (Gateway)

- Befehl: `pnpm test:stability:gateway`
- Konfiguration: `vitest.gateway.config.ts`, auf einen Worker erzwungen
- Umfang:
  - Startet standardmäßig einen echten Loopback-Gateway mit aktivierter Diagnose
  - Treibt synthetischen Gateway-Nachrichten-, Memory- und Large-Payload-Churn durch den Diagnose-Event-Pfad
  - Fragt `diagnostics.stability` über den Gateway-WS-RPC ab
  - Deckt Persistenz-Helper für Diagnose-Stabilitätsbundles ab
  - Stellt sicher, dass der Recorder begrenzt bleibt, synthetische RSS-Samples unter dem Pressure-Budget bleiben und Queue-Tiefen pro Sitzung wieder auf null ablaufen
- Erwartungen:
  - CI-sicher und ohne Schlüssel
  - Enge Lane für Nachverfolgung von Stabilitätsregressionen, kein Ersatz für die vollständige Gateway-Suite

### E2E (Gateway-Smoke)

- Befehl: `pnpm test:e2e`
- Konfiguration: `vitest.e2e.config.ts`
- Dateien: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts` und E2E-Tests gebündelter Plugins unter `extensions/`
- Runtime-Defaults:
  - Verwendet Vitest `threads` mit `isolate: false`, passend zum Rest des Repos.
  - Verwendet adaptive Worker (CI: bis zu 2, lokal: standardmäßig 1).
  - Läuft standardmäßig im Silent-Modus, um Console-I/O-Overhead zu reduzieren.
- Nützliche Overrides:
  - `OPENCLAW_E2E_WORKERS=<n>`, um die Worker-Anzahl zu erzwingen (auf 16 begrenzt).
  - `OPENCLAW_E2E_VERBOSE=1`, um ausführliche Konsolenausgabe wieder zu aktivieren.
- Umfang:
  - End-to-End-Verhalten von Multi-Instance-Gateways
  - WebSocket-/HTTP-Oberflächen, Node-Pairing und schwerere Netzwerkteile
- Erwartungen:
  - Läuft in CI (wenn in der Pipeline aktiviert)
  - Keine echten Schlüssel erforderlich
  - Mehr bewegliche Teile als Unit-Tests (kann langsamer sein)

### E2E: OpenShell-Backend-Smoke

- Befehl: `pnpm test:e2e:openshell`
- Datei: `extensions/openshell/src/backend.e2e.test.ts`
- Umfang:
  - Startet über Docker einen isolierten OpenShell-Gateway auf dem Host
  - Erstellt eine Sandbox aus einem temporären lokalen Dockerfile
  - Testet das OpenShell-Backend von OpenClaw über echtes `sandbox ssh-config` + SSH-Ausführung
  - Verifiziert remote-kanonisches Dateisystemverhalten über die Sandbox-fs-Bridge
- Erwartungen:
  - Nur opt-in; nicht Teil des standardmäßigen `pnpm test:e2e`-Laufs
  - Erfordert eine lokale `openshell`-CLI plus einen funktionierenden Docker-Daemon
  - Verwendet isoliertes `HOME` / `XDG_CONFIG_HOME` und zerstört anschließend den Test-Gateway und die Sandbox
- Nützliche Overrides:
  - `OPENCLAW_E2E_OPENSHELL=1`, um den Test zu aktivieren, wenn Sie die breitere e2e-Suite manuell ausführen
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell`, um auf ein nicht standardmäßiges CLI-Binary oder Wrapper-Skript zu verweisen

### Live (echte Provider + echte Modelle)

- Befehl: `pnpm test:live`
- Konfiguration: `vitest.live.config.ts`
- Dateien: `src/**/*.live.test.ts`, `test/**/*.live.test.ts` und Live-Tests gebündelter Plugins unter `extensions/`
- Standard: durch `pnpm test:live` **aktiviert** (setzt `OPENCLAW_LIVE_TEST=1`)
- Umfang:
  - „Funktioniert dieser Provider/dieses Modell _heute_ tatsächlich mit echten Zugangsdaten?“
  - Erkennt Provider-Formatänderungen, Tool-Calling-Eigenheiten, Auth-Probleme und Rate-Limit-Verhalten
- Erwartungen:
  - Absichtlich nicht CI-stabil (echte Netzwerke, echte Provider-Richtlinien, Quotas, Ausfälle)
  - Kostet Geld / verbraucht Rate-Limits
  - Bevorzugen Sie eingegrenzte Teilmengen statt „alles“
- Live-Läufe sourcen `~/.profile`, um fehlende API-Schlüssel aufzunehmen.
- Standardmäßig isolieren Live-Läufe weiterhin `HOME` und kopieren Config-/Auth-Material in ein temporäres Test-Home, damit Unit-Fixtures Ihr echtes `~/.openclaw` nicht verändern können.
- Setzen Sie `OPENCLAW_LIVE_USE_REAL_HOME=1` nur, wenn Live-Tests absichtlich Ihr echtes Home-Verzeichnis verwenden sollen.
- `pnpm test:live` nutzt jetzt standardmäßig einen ruhigeren Modus: `[live] ...`-Fortschrittsausgabe bleibt erhalten, aber die zusätzliche `~/.profile`-Meldung wird unterdrückt und Gateway-Bootstrap-Logs/Bonjour-Ausgaben werden stummgeschaltet. Setzen Sie `OPENCLAW_LIVE_TEST_QUIET=0`, wenn Sie die vollständigen Startlogs zurückhaben möchten.
- API-Schlüsselrotation (Provider-spezifisch): Setzen Sie `*_API_KEYS` im Komma-/Semikolonformat oder `*_API_KEY_1`, `*_API_KEY_2` (zum Beispiel `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) oder einen Live-spezifischen Override per `OPENCLAW_LIVE_*_KEY`; Tests versuchen es bei Rate-Limit-Antworten erneut.
- Fortschritts-/Heartbeat-Ausgabe:
  - Live-Suites geben jetzt Fortschrittszeilen nach stderr aus, sodass lange Provider-Aufrufe sichtbar aktiv sind, auch wenn Vitest-Console-Capture ruhig ist.
  - `vitest.live.config.ts` deaktiviert Vitest-Console-Interception, damit Provider-/Gateway-Fortschrittszeilen während Live-Läufen sofort gestreamt werden.
  - Stimmen Sie Direct-Model-Heartbeats mit `OPENCLAW_LIVE_HEARTBEAT_MS` ab.
  - Stimmen Sie Gateway-/Probe-Heartbeats mit `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS` ab.

## Welche Suite sollte ich ausführen?

Verwenden Sie diese Entscheidungstabelle:

- Bearbeiten von Logik/Tests: Führen Sie `pnpm test` aus (und `pnpm test:coverage`, wenn Sie viel geändert haben)
- Berühren von Gateway-Netzwerkkommunikation / WS-Protokoll / Pairing: Fügen Sie `pnpm test:e2e` hinzu
- Debugging von „mein Bot ist down“ / Provider-spezifischen Fehlern / Tool-Aufrufen: Führen Sie ein eingegrenztes `pnpm test:live` aus

## Live-Tests (mit Netzwerkzugriff)

Für die Live-Modellmatrix, CLI-Backend-Smokes, ACP-Smokes, den Codex-App-Server-
Harness und alle Live-Tests für Medien-Provider (Deepgram, BytePlus, ComfyUI, Bild,
Musik, Video, Medien-Harness) – plus den Umgang mit Anmeldedaten für Live-Läufe – siehe
[Testing – Live-Suiten](/de/help/testing-live).

## Docker-Runner (optionale „funktioniert unter Linux“-Prüfungen)

Diese Docker-Runner teilen sich in zwei Gruppen auf:

- Live-Modell-Runner: `test:docker:live-models` und `test:docker:live-gateway` führen nur die jeweils passende Live-Datei mit Profil-Key im Docker-Image des Repos aus (`src/agents/models.profiles.live.test.ts` und `src/gateway/gateway-models.profiles.live.test.ts`), wobei Ihr lokales Konfigurationsverzeichnis und Ihr Workspace gemountet werden (und `~/.profile` eingelesen wird, falls gemountet). Die passenden lokalen Einstiegspunkte sind `test:live:models-profiles` und `test:live:gateway-profiles`.
- Docker-Live-Runner verwenden standardmäßig eine kleinere Smoke-Obergrenze, damit ein vollständiger Docker-Durchlauf praktikabel bleibt:
  `test:docker:live-models` verwendet standardmäßig `OPENCLAW_LIVE_MAX_MODELS=12`, und
  `test:docker:live-gateway` verwendet standardmäßig `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000` und
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`. Überschreiben Sie diese Env-Vars, wenn Sie
  ausdrücklich den größeren vollständigen Scan wünschen.
- `test:docker:all` baut das Live-Docker-Image einmal über `test:docker:live-build`, packt OpenClaw einmal als npm-Tarball über `scripts/package-openclaw-for-docker.mjs` und baut bzw. verwendet dann zwei `scripts/e2e/Dockerfile`-Images erneut. Das Bare-Image ist nur der Node/Git-Runner für Installations-/Update-/Plugin-Abhängigkeits-Lanes; diese Lanes mounten den vorgebauten Tarball. Das funktionale Image installiert denselben Tarball nach `/app` für Lanes zur Funktionalität der gebauten App. Docker-Lane-Definitionen liegen in `scripts/lib/docker-e2e-scenarios.mjs`; die Planner-Logik liegt in `scripts/lib/docker-e2e-plan.mjs`; `scripts/test-docker-all.mjs` führt den ausgewählten Plan aus. Das Aggregat verwendet einen gewichteten lokalen Scheduler: `OPENCLAW_DOCKER_ALL_PARALLELISM` steuert Prozess-Slots, während Ressourcenobergrenzen verhindern, dass schwere Live-, npm-Installations- und Multi-Service-Lanes alle gleichzeitig starten. Wenn eine einzelne Lane schwerer ist als die aktiven Obergrenzen, kann der Scheduler sie trotzdem starten, wenn der Pool leer ist, und lässt sie dann allein laufen, bis wieder Kapazität verfügbar ist. Standardwerte sind 10 Slots, `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` und `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`; passen Sie `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` oder `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` nur an, wenn der Docker-Host mehr Spielraum hat. Der Runner führt standardmäßig einen Docker-Preflight aus, entfernt veraltete OpenClaw-E2E-Container, gibt alle 30 Sekunden den Status aus, speichert erfolgreiche Lane-Laufzeiten in `.artifacts/docker-tests/lane-timings.json` und verwendet diese Laufzeiten, um bei späteren Läufen längere Lanes zuerst zu starten. Verwenden Sie `OPENCLAW_DOCKER_ALL_DRY_RUN=1`, um das gewichtete Lane-Manifest ohne Bauen oder Ausführen von Docker auszugeben, oder `node scripts/test-docker-all.mjs --plan-json`, um den CI-Plan für ausgewählte Lanes, Paket-/Image-Anforderungen und Anmeldedaten auszugeben.
- `Package Acceptance` ist das GitHub-native Paket-Gate für „funktioniert dieser installierbare Tarball als Produkt?“ Es löst ein Kandidatenpaket aus `source=npm`, `source=ref`, `source=url` oder `source=artifact` auf, lädt es als `package-under-test` hoch und führt dann die wiederverwendbaren Docker-E2E-Lanes gegen genau diesen Tarball aus, statt den ausgewählten Ref neu zu packen. `workflow_ref` wählt die vertrauenswürdigen Workflow-/Harness-Skripte aus, während `package_ref` den Source-Commit/-Branch/-Tag auswählt, der gepackt wird, wenn `source=ref` ist; dadurch kann aktuelle Acceptance-Logik ältere vertrauenswürdige Commits validieren. Profile sind nach Breite geordnet: `smoke` ist schnelle Installation/Channel/Agent plus Gateway/Konfiguration, `package` ist der Paket-/Update-/Plugin-Vertrag plus die keyless Upgrade-Survivor-Fixture und der standardmäßige native Ersatz für den Großteil der Parallels-Paket-/Update-Abdeckung, `product` ergänzt MCP-Channels, Cron-/Subagent-Bereinigung, OpenAI-Websuche und OpenWebUI, und `full` führt die Docker-Blöcke des Release-Pfads mit OpenWebUI aus. Release-Validierung führt ein benutzerdefiniertes Paket-Delta (`bundled-channel-deps-compat plugins-offline`) plus Telegram-Paket-QA aus, weil die Docker-Blöcke des Release-Pfads die überlappenden Paket-/Update-/Plugin-Lanes bereits abdecken. Aus Artefakten generierte gezielte GitHub-Docker-Rerun-Befehle enthalten frühere Paketartefakt- und vorbereitete Image-Eingaben, wenn verfügbar, sodass fehlgeschlagene Lanes vermeiden können, Paket und Images neu zu bauen.
- Build- und Release-Prüfungen führen `scripts/check-cli-bootstrap-imports.mjs` nach tsdown aus. Der Guard durchläuft den statisch gebauten Graphen ab `dist/entry.js` und `dist/cli/run-main.js` und schlägt fehl, wenn Pre-Dispatch-Startup Paketabhängigkeiten wie Commander, Prompt-UI, undici oder Logging vor dem Command-Dispatch importiert; außerdem hält er den gebündelten Gateway-Run-Chunk unter dem Budget und weist statische Importe bekannter kalter Gateway-Pfade zurück. Der paketierte CLI-Smoke deckt außerdem Root-Hilfe, Onboard-Hilfe, Doctor-Hilfe, Status, Konfigurationsschema und einen Modelllisten-Befehl ab.
- Die Legacy-Kompatibilität von Package Acceptance ist auf `2026.4.25` begrenzt (`2026.4.25-beta.*` eingeschlossen). Bis zu diesem Stichtag toleriert der Harness nur ausgelieferte Paket-Metadatenlücken: ausgelassene private QA-Inventareinträge, fehlendes `gateway install --wrapper`, fehlende Patch-Dateien in der aus dem Tarball abgeleiteten Git-Fixture, fehlendes persistiertes `update.channel`, Legacy-Speicherorte für Plugin-Installationsdatensätze, fehlende Persistenz von Marketplace-Installationsdatensätzen und Migration von Konfigurationsmetadaten während `plugins update`. Für Pakete nach `2026.4.25` sind diese Pfade strikte Fehler.
- Container-Smoke-Runner: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:npm-onboard-channel-agent`, `test:docker:update-channel-switch`, `test:docker:upgrade-survivor`, `test:docker:session-runtime-context`, `test:docker:agents-delete-shared-workspace`, `test:docker:gateway-network`, `test:docker:browser-cdp-snapshot`, `test:docker:mcp-channels`, `test:docker:pi-bundle-mcp-tools`, `test:docker:cron-mcp-cleanup`, `test:docker:plugins`, `test:docker:plugin-update` und `test:docker:config-reload` starten einen oder mehrere echte Container und verifizieren Integrationspfade auf höherer Ebene.

Die Live-Modell-Docker-Runner binden außerdem nur die benötigten CLI-Auth-Homes ein (oder alle unterstützten, wenn der Lauf nicht eingegrenzt ist) und kopieren sie dann vor dem Lauf in das Home-Verzeichnis des Containers, sodass OAuth externer CLIs Tokens aktualisieren kann, ohne den Auth-Speicher des Hosts zu verändern:

- Direkte Modelle: `pnpm test:docker:live-models` (Skript: `scripts/test-live-models-docker.sh`)
- ACP-Bind-Smoke-Test: `pnpm test:docker:live-acp-bind` (Skript: `scripts/test-live-acp-bind-docker.sh`; deckt standardmäßig Claude, Codex und Gemini ab, mit strikter Droid/OpenCode-Abdeckung über `pnpm test:docker:live-acp-bind:droid` und `pnpm test:docker:live-acp-bind:opencode`)
- CLI-Backend-Smoke-Test: `pnpm test:docker:live-cli-backend` (Skript: `scripts/test-live-cli-backend-docker.sh`)
- Codex-App-Server-Harness-Smoke-Test: `pnpm test:docker:live-codex-harness` (Skript: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + Entwicklungs-Agent: `pnpm test:docker:live-gateway` (Skript: `scripts/test-live-gateway-models-docker.sh`)
- Observability-Smoke-Test: `pnpm qa:otel:smoke` ist eine private QA-Lane für Source-Checkouts. Sie ist absichtlich nicht Teil der Docker-Release-Lanes für Pakete, weil der npm-Tarball QA Lab auslässt.
- Open WebUI-Live-Smoke-Test: `pnpm test:docker:openwebui` (Skript: `scripts/e2e/openwebui-docker.sh`)
- Onboarding-Assistent (TTY, vollständiges Scaffolding): `pnpm test:docker:onboard` (Skript: `scripts/e2e/onboard-docker.sh`)
- npm-Tarball-Smoke-Test für Onboarding/Kanal/Agent: `pnpm test:docker:npm-onboard-channel-agent` installiert den gepackten OpenClaw-Tarball global in Docker, konfiguriert OpenAI per Env-Ref-Onboarding sowie standardmäßig Telegram, verifiziert, dass Doctor aktivierte Plugin-Runtime-Abhängigkeiten repariert, und führt eine gemockte OpenAI-Agent-Runde aus. Verwenden Sie einen vorgebauten Tarball mit `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, überspringen Sie den Host-Rebuild mit `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0`, oder wechseln Sie den Kanal mit `OPENCLAW_NPM_ONBOARD_CHANNEL=discord`.
- Update-Kanalwechsel-Smoke-Test: `pnpm test:docker:update-channel-switch` installiert den gepackten OpenClaw-Tarball global in Docker, wechselt vom Paket `stable` zu Git `dev`, verifiziert den gespeicherten Kanal und die Plugin-Funktion nach dem Update, wechselt dann zurück zum Paket `stable` und prüft den Update-Status.
- Upgrade-Survivor-Smoke-Test: `pnpm test:docker:upgrade-survivor` installiert den gepackten OpenClaw-Tarball über ein verschmutztes Fixture eines alten Benutzers mit Agenten, Kanalkonfiguration, Plugin-Allowlists, veraltetem Plugin-Runtime-Deps-Status und bestehenden Workspace-/Sitzungsdateien. Es führt ein Paket-Update sowie einen nicht interaktiven Doctor ohne Live-Provider- oder Kanalschlüssel aus, startet dann ein local loopback-Gateway und prüft die Konfigurations-/Statusbewahrung sowie Start-/Status-Budgets.
- Smoke-Test für Sitzungs-Runtime-Kontext: `pnpm test:docker:session-runtime-context` verifiziert die Persistenz des versteckten Runtime-Kontext-Transkripts sowie die Doctor-Reparatur betroffener duplizierter Prompt-Rewrite-Branches.
- Smoke-Test für globale Bun-Installation: `bash scripts/e2e/bun-global-install-smoke.sh` packt den aktuellen Baum, installiert ihn mit `bun install -g` in einem isolierten Home und verifiziert, dass `openclaw infer image providers --json` gebündelte Bild-Provider zurückgibt, statt zu hängen. Verwenden Sie einen vorgebauten Tarball mit `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, überspringen Sie den Host-Build mit `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0`, oder kopieren Sie `dist/` aus einem gebauten Docker-Image mit `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local`.
- Installer-Docker-Smoke-Test: `bash scripts/test-install-sh-docker.sh` teilt einen npm-Cache zwischen seinen Root-, Update- und Direct-npm-Containern. Der Update-Smoke-Test verwendet standardmäßig npm `latest` als stabile Baseline vor dem Upgrade auf den Kandidaten-Tarball. Überschreiben Sie dies lokal mit `OPENCLAW_INSTALL_SMOKE_UPDATE_BASELINE=2026.4.22` oder auf GitHub mit der Eingabe `update_baseline_version` des Install-Smoke-Workflows. Nicht-Root-Installer-Prüfungen verwenden einen isolierten npm-Cache, damit Root-eigene Cache-Einträge das benutzerlokale Installationsverhalten nicht verdecken. Setzen Sie `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache`, um den Root-/Update-/Direct-npm-Cache über lokale Wiederholungen hinweg wiederzuverwenden.
- Install Smoke CI überspringt das doppelte direkte globale npm-Update mit `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1`; führen Sie das Skript lokal ohne diese Umgebungsvariable aus, wenn Abdeckung für direktes `npm install -g` benötigt wird.
- CLI-Smoke-Test für das Löschen gemeinsam genutzter Workspaces durch Agenten: `pnpm test:docker:agents-delete-shared-workspace` (Skript: `scripts/e2e/agents-delete-shared-workspace-docker.sh`) baut standardmäßig das Root-Dockerfile-Image, legt zwei Agenten mit einem Workspace in einem isolierten Container-Home an, führt `agents delete --json` aus und verifiziert gültiges JSON sowie das Verhalten für beibehaltene Workspaces. Verwenden Sie das Install-Smoke-Image mit `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1`.
- Gateway-Netzwerk (zwei Container, WS-Authentifizierung + Health): `pnpm test:docker:gateway-network` (Skript: `scripts/e2e/gateway-network-docker.sh`)
- Browser-CDP-Snapshot-Smoke-Test: `pnpm test:docker:browser-cdp-snapshot` (Skript: `scripts/e2e/browser-cdp-snapshot-docker.sh`) baut das Source-E2E-Image plus eine Chromium-Schicht, startet Chromium mit rohem CDP, führt `browser doctor --deep` aus und verifiziert, dass CDP-Rollen-Snapshots Link-URLs, per Cursor hochgestufte klickbare Elemente, iframe-Referenzen und Frame-Metadaten abdecken.
- Regression für OpenAI Responses `web_search` mit minimalem Reasoning: `pnpm test:docker:openai-web-search-minimal` (Skript: `scripts/e2e/openai-web-search-minimal-docker.sh`) führt einen gemockten OpenAI-Server durch das Gateway aus, verifiziert, dass `web_search` `reasoning.effort` von `minimal` auf `low` anhebt, erzwingt dann die Ablehnung durch das Provider-Schema und prüft, dass das Rohdetail in den Gateway-Logs erscheint.
- MCP-Kanal-Bridge (vorbefülltes Gateway + stdio-Bridge + roher Claude-Notification-Frame-Smoke-Test): `pnpm test:docker:mcp-channels` (Skript: `scripts/e2e/mcp-channels-docker.sh`)
- Pi-Bundle-MCP-Tools (echter stdio-MCP-Server + Smoke-Test für Allow/Deny des eingebetteten Pi-Profils): `pnpm test:docker:pi-bundle-mcp-tools` (Skript: `scripts/e2e/pi-bundle-mcp-tools-docker.sh`)
- Cron/Subagent-MCP-Bereinigung (echtes Gateway + Abräumen von stdio-MCP-Child-Prozessen nach isolierten Cron- und einmaligen Subagent-Ausführungen): `pnpm test:docker:cron-mcp-cleanup` (Skript: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Plugins (Install-Smoke-Test, ClawHub-Kitchen-Sink-Installation/-Deinstallation, Marketplace-Updates und Claude-Bundle-Aktivierung/-Inspektion): `pnpm test:docker:plugins` (Skript: `scripts/e2e/plugins-docker.sh`)
  Setzen Sie `OPENCLAW_PLUGINS_E2E_CLAWHUB=0`, um den ClawHub-Block zu überspringen, oder überschreiben Sie das standardmäßige Kitchen-Sink-Paket-/Runtime-Paar mit `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` und `OPENCLAW_PLUGINS_E2E_CLAWHUB_ID`. Ohne `OPENCLAW_CLAWHUB_URL`/`CLAWHUB_URL` verwendet der Test einen hermetischen lokalen ClawHub-Fixture-Server.
- Smoke-Test für unveränderte Plugin-Updates: `pnpm test:docker:plugin-update` (Skript: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- Smoke-Test für Config-Reload-Metadaten: `pnpm test:docker:config-reload` (Skript: `scripts/e2e/config-reload-source-docker.sh`)
- Gebündelte Plugin-Runtime-Abhängigkeiten: `pnpm test:docker:bundled-channel-deps` baut standardmäßig ein kleines Docker-Runner-Image, baut und packt OpenClaw einmal auf dem Host und mountet diesen Tarball dann in jedes Linux-Installationsszenario. Verwenden Sie das Image erneut mit `OPENCLAW_SKIP_DOCKER_BUILD=1`, überspringen Sie den Host-Rebuild nach einem frischen lokalen Build mit `OPENCLAW_BUNDLED_CHANNEL_HOST_BUILD=0`, oder verweisen Sie mit `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz` auf einen bestehenden Tarball. Das vollständige Docker-Aggregat und die Bundled-Channel-Chunks des Release-Pfads vorpacken diesen Tarball einmal und teilen dann gebündelte Kanalprüfungen in unabhängige Lanes auf, einschließlich separater Update-Lanes für Telegram, Discord, Slack, Feishu, memory-lancedb und ACPX. Release-Chunks teilen Kanal-Smoke-Tests, Update-Ziele und Setup-/Runtime-Verträge in `bundled-channels-core`, `bundled-channels-update-a`, `bundled-channels-update-b` und `bundled-channels-contracts` auf; der aggregierte Chunk `bundled-channels` bleibt für manuelle Wiederholungen verfügbar. Der Release-Workflow teilt außerdem Provider-Installer-Chunks und gebündelte Plugin-Installations-/Deinstallations-Chunks auf; die Legacy-Chunks `package-update`, `plugins-runtime` und `plugins-integrations` bleiben als Aggregat-Aliasse für manuelle Wiederholungen erhalten. Verwenden Sie `OPENCLAW_BUNDLED_CHANNELS=telegram,slack`, um die Kanalmatrix beim direkten Ausführen der gebündelten Lane einzugrenzen, oder `OPENCLAW_BUNDLED_CHANNEL_UPDATE_TARGETS=telegram,acpx`, um das Update-Szenario einzugrenzen. Pro-Szenario-Docker-Ausführungen verwenden standardmäßig `OPENCLAW_BUNDLED_CHANNEL_DOCKER_RUN_TIMEOUT=900s`; das Multi-Target-Update-Szenario verwendet standardmäßig `OPENCLAW_BUNDLED_CHANNEL_UPDATE_DOCKER_RUN_TIMEOUT=2400s`. Die Lane verifiziert außerdem, dass `channels.<id>.enabled=false` und `plugins.entries.<id>.enabled=false` die Doctor-/Runtime-Abhängigkeitsreparatur unterdrücken.
- Grenzen Sie gebündelte Plugin-Runtime-Abhängigkeiten während der Iteration ein, indem Sie nicht zusammenhängende Szenarien deaktivieren, zum Beispiel:
  `OPENCLAW_BUNDLED_CHANNEL_SCENARIOS=0 OPENCLAW_BUNDLED_CHANNEL_UPDATE_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_ROOT_OWNED_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_SETUP_ENTRY_SCENARIO=0 pnpm test:docker:bundled-channel-deps`.

So bauen Sie das gemeinsam genutzte funktionale Image manuell vor und verwenden es wieder:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

Suite-spezifische Image-Overrides wie `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE` haben weiterhin Vorrang, wenn sie gesetzt sind. Wenn `OPENCLAW_SKIP_DOCKER_BUILD=1` auf ein entferntes gemeinsam genutztes Image zeigt, ziehen die Skripte es, falls es noch nicht lokal vorhanden ist. Die QR- und Installer-Docker-Tests behalten ihre eigenen Dockerfiles, weil sie Paket-/Installationsverhalten statt der gemeinsam genutzten gebauten App-Runtime validieren.

Die Docker-Runner für Live-Modelle binden außerdem den aktuellen Checkout schreibgeschützt ein und
stellen ihn in einem temporären Arbeitsverzeichnis innerhalb des Containers bereit. Dadurch bleibt das Runtime-
Image schlank, während Vitest trotzdem gegen Ihre exakte lokale Source-/Konfigurationsbasis läuft.
Der Staging-Schritt überspringt große, nur lokale Caches und App-Build-Ausgaben wie
`.pnpm-store`, `.worktrees`, `__openclaw_vitest__` sowie app-lokale `.build`- oder
Gradle-Ausgabeverzeichnisse, damit Docker-Live-Läufe nicht minutenlang
maschinenspezifische Artefakte kopieren.
Sie setzen außerdem `OPENCLAW_SKIP_CHANNELS=1`, damit Gateway-Live-Probes keine
echten Telegram/Discord/usw.-Channel-Worker im Container starten.
`test:docker:live-models` führt weiterhin `pnpm test:live` aus. Reichen Sie daher
auch `OPENCLAW_LIVE_GATEWAY_*` durch, wenn Sie die Gateway-
Live-Abdeckung aus dieser Docker-Lane eingrenzen oder ausschließen müssen.
`test:docker:openwebui` ist ein höherwertiger Kompatibilitäts-Smoke-Test: Er startet einen
OpenClaw-Gateway-Container mit aktivierten OpenAI-kompatiblen HTTP-Endpunkten,
startet einen gepinnten Open-WebUI-Container gegen dieses Gateway, meldet sich über
Open WebUI an, verifiziert, dass `/api/models` `openclaw/default` bereitstellt, und sendet dann eine
echte Chat-Anfrage über den `/api/chat/completions`-Proxy von Open WebUI.
Der erste Lauf kann merklich langsamer sein, weil Docker möglicherweise das
Open-WebUI-Image laden muss und Open WebUI seine eigene Kaltstart-Einrichtung abschließen muss.
Diese Lane erwartet einen nutzbaren Live-Modellschlüssel, und `OPENCLAW_PROFILE_FILE`
(standardmäßig `~/.profile`) ist der primäre Weg, ihn in Docker-basierten Läufen bereitzustellen.
Erfolgreiche Läufe geben eine kleine JSON-Nutzlast wie `{ "ok": true, "model":
"openclaw/default", ... }` aus.
`test:docker:mcp-channels` ist absichtlich deterministisch und benötigt kein
echtes Telegram-, Discord- oder iMessage-Konto. Es bootet einen vorbefüllten Gateway-
Container, startet einen zweiten Container, der `openclaw mcp serve` startet, und
verifiziert dann geroutete Konversationserkennung, Transkriptlesezugriffe, Anhangsmetadaten,
Live-Event-Queue-Verhalten, Routing ausgehender Sendungen sowie Channel- und
Berechtigungsbenachrichtigungen im Claude-Stil über die echte stdio-MCP-Bridge. Die Benachrichtigungsprüfung
inspiziert die rohen stdio-MCP-Frames direkt, sodass der Smoke-Test validiert, was die
Bridge tatsächlich ausgibt, nicht nur das, was ein bestimmtes Client-SDK zufällig bereitstellt.
`test:docker:pi-bundle-mcp-tools` ist deterministisch und benötigt keinen Live-
Modellschlüssel. Es baut das Repo-Docker-Image, startet einen echten stdio-MCP-Probe-Server
im Container, materialisiert diesen Server über die eingebettete Pi-Bundle-
MCP-Runtime, führt das Tool aus und verifiziert dann, dass `coding` und `messaging`
`bundle-mcp`-Tools behalten, während `minimal` und `tools.deny: ["bundle-mcp"]` sie filtern.
`test:docker:cron-mcp-cleanup` ist deterministisch und benötigt keinen Live-
Modellschlüssel. Es startet ein vorbefülltes Gateway mit einem echten stdio-MCP-Probe-Server, führt einen
isolierten Cron-Turn und einen `/subagents spawn`-Einmal-Child-Turn aus und verifiziert dann,
dass der MCP-Child-Prozess nach jedem Lauf beendet wird.

Manueller ACP-Smoke-Test für Klartext-Threads (nicht CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Behalten Sie dieses Skript für Regressions-/Debug-Workflows bei. Es kann erneut für die Validierung des ACP-Thread-Routings benötigt werden, löschen Sie es daher nicht.

Nützliche Umgebungsvariablen:

- `OPENCLAW_CONFIG_DIR=...` (Standard: `~/.openclaw`) wird nach `/home/node/.openclaw` gemountet
- `OPENCLAW_WORKSPACE_DIR=...` (Standard: `~/.openclaw/workspace`) wird nach `/home/node/.openclaw/workspace` gemountet
- `OPENCLAW_PROFILE_FILE=...` (Standard: `~/.profile`) wird nach `/home/node/.profile` gemountet und vor dem Ausführen von Tests eingelesen
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1`, um nur aus `OPENCLAW_PROFILE_FILE` eingelesene Umgebungsvariablen zu verifizieren, mit temporären Konfigurations-/Arbeitsverzeichnis-Verzeichnissen und ohne externe CLI-Auth-Mounts
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (Standard: `~/.cache/openclaw/docker-cli-tools`) wird nach `/home/node/.npm-global` für gecachte CLI-Installationen innerhalb von Docker gemountet
- Externe CLI-Auth-Verzeichnisse/-Dateien unter `$HOME` werden schreibgeschützt unter `/host-auth...` gemountet und dann vor Testbeginn nach `/home/node/...` kopiert
  - Standardverzeichnisse: `.minimax`
  - Standarddateien: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - Eingegrenzte Provider-Läufe mounten nur die benötigten Verzeichnisse/Dateien, die aus `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS` abgeleitet werden
  - Manuell überschreiben mit `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none` oder einer kommagetrennten Liste wie `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...`, um den Lauf einzugrenzen
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...`, um Provider im Container zu filtern
- `OPENCLAW_SKIP_DOCKER_BUILD=1`, um ein vorhandenes `openclaw:local-live`-Image für erneute Läufe wiederzuverwenden, die keinen Neubau benötigen
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, um sicherzustellen, dass Zugangsdaten aus dem Profilspeicher kommen (nicht aus der Umgebung)
- `OPENCLAW_OPENWEBUI_MODEL=...`, um das Modell auszuwählen, das vom Gateway für den Open-WebUI-Smoke-Test bereitgestellt wird
- `OPENCLAW_OPENWEBUI_PROMPT=...`, um den vom Open-WebUI-Smoke-Test verwendeten Nonce-Check-Prompt zu überschreiben
- `OPENWEBUI_IMAGE=...`, um das gepinnte Open-WebUI-Image-Tag zu überschreiben

## Docs-Sanity

Führen Sie nach Dokumentationsänderungen Docs-Prüfungen aus: `pnpm check:docs`.
Führen Sie die vollständige Mintlify-Ankervalidierung aus, wenn Sie auch Überschriftenprüfungen innerhalb von Seiten benötigen: `pnpm docs:check-links:anchors`.

## Offline-Regression (CI-sicher)

Dies sind Regressionen der „echten Pipeline“ ohne echte Provider:

- Gateway-Toolaufrufe (Mock-OpenAI, echtes Gateway + Agent-Loop): `src/gateway/gateway.test.ts` (Fall: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Gateway-Assistent (WS `wizard.start`/`wizard.next`, schreibt Konfiguration + Auth erzwungen): `src/gateway/gateway.test.ts` (Fall: "runs wizard over ws and writes auth token config")

## Agent-Zuverlässigkeits-Evals (Skills)

Wir haben bereits einige CI-sichere Tests, die sich wie „Agent-Zuverlässigkeits-Evals“ verhalten:

- Mock-Toolaufrufe über das echte Gateway + Agent-Loop (`src/gateway/gateway.test.ts`).
- End-to-End-Assistentenflüsse, die Session-Verkabelung und Konfigurationseffekte validieren (`src/gateway/gateway.test.ts`).

Was für Skills noch fehlt (siehe [Skills](/de/tools/skills)):

- **Entscheidungsfindung:** Wenn Skills im Prompt aufgeführt sind, wählt der Agent den richtigen Skill aus (oder vermeidet irrelevante)?
- **Compliance:** Liest der Agent `SKILL.md` vor der Verwendung und befolgt die erforderlichen Schritte/Argumente?
- **Workflow-Verträge:** Mehrstufige Szenarien, die Tool-Reihenfolge, Übernahme des Session-Verlaufs und Sandbox-Grenzen prüfen.

Künftige Evals sollten zuerst deterministisch bleiben:

- Ein Szenario-Runner mit Mock-Providern, um Toolaufrufe + Reihenfolge, Skill-Dateilesezugriffe und Session-Verkabelung zu prüfen.
- Eine kleine Suite Skill-fokussierter Szenarien (verwenden vs. vermeiden, Gating, Prompt-Injection).
- Optionale Live-Evals (Opt-in, per Umgebung gesteuert) erst, nachdem die CI-sichere Suite vorhanden ist.

## Vertragstests (Plugin- und Channel-Form)

Vertragstests verifizieren, dass jedes registrierte Plugin und jeder registrierte Channel seinem
Schnittstellenvertrag entspricht. Sie iterieren über alle erkannten Plugins und führen eine Suite aus
Form- und Verhaltensprüfungen aus. Die standardmäßige `pnpm test`-Unit-Lane überspringt diese gemeinsamen
Seam- und Smoke-Dateien absichtlich; führen Sie die Vertragsbefehle explizit aus,
wenn Sie gemeinsame Channel- oder Provider-Surfaces ändern.

### Befehle

- Alle Verträge: `pnpm test:contracts`
- Nur Channel-Verträge: `pnpm test:contracts:channels`
- Nur Provider-Verträge: `pnpm test:contracts:plugins`

### Channel-Verträge

Befinden sich in `src/channels/plugins/contracts/*.contract.test.ts`:

- **plugin** - Grundlegende Plugin-Form (ID, Name, Fähigkeiten)
- **setup** - Setup-Assistentenvertrag
- **session-binding** - Session-Binding-Verhalten
- **outbound-payload** - Struktur der Nachrichten-Nutzlast
- **inbound** - Verarbeitung eingehender Nachrichten
- **actions** - Channel-Action-Handler
- **threading** - Thread-ID-Verarbeitung
- **directory** - Verzeichnis-/Roster-API
- **group-policy** - Durchsetzung von Gruppenrichtlinien

### Provider-Statusverträge

Befinden sich in `src/plugins/contracts/*.contract.test.ts`.

- **status** - Channel-Status-Probes
- **registry** - Form der Plugin-Registry

### Provider-Verträge

Befinden sich in `src/plugins/contracts/*.contract.test.ts`:

- **auth** - Auth-Flow-Vertrag
- **auth-choice** - Auth-Auswahl/Selektion
- **catalog** - Modellkatalog-API
- **discovery** - Plugin-Erkennung
- **loader** - Plugin-Laden
- **runtime** - Provider-Runtime
- **shape** - Plugin-Form/Schnittstelle
- **wizard** - Setup-Assistent

### Wann ausführen

- Nach Änderungen an plugin-sdk-Exports oder Unterpfaden
- Nach dem Hinzufügen oder Ändern eines Channel- oder Provider-Plugins
- Nach Refactorings an Plugin-Registrierung oder -Erkennung

Vertragstests laufen in CI und benötigen keine echten API-Schlüssel.

## Regressionen hinzufügen (Leitlinien)

Wenn Sie ein Provider-/Modellproblem beheben, das live entdeckt wurde:

- Fügen Sie nach Möglichkeit eine CI-sichere Regression hinzu (Mock-/Stub-Provider oder erfassen Sie die exakte Request-Shape-Transformation)
- Wenn es grundsätzlich nur live prüfbar ist (Ratenlimits, Auth-Richtlinien), halten Sie den Live-Test eng begrenzt und per Umgebungsvariablen opt-in
- Zielen Sie bevorzugt auf die kleinste Schicht, die den Fehler erkennt:
  - Fehler bei Provider-Request-Konvertierung/-Replay → direkter Modelltest
  - Gateway-Session-/History-/Tool-Pipeline-Fehler → Gateway-Live-Smoke-Test oder CI-sicherer Gateway-Mock-Test
- SecretRef-Traversal-Leitplanke:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` leitet je SecretRef-Klasse ein Stichprobenziel aus Registry-Metadaten (`listSecretTargetRegistryEntries()`) ab und prüft dann, dass Exec-IDs mit Traversal-Segmenten abgelehnt werden.
  - Wenn Sie eine neue `includeInPlan`-SecretRef-Ziel-Familie in `src/secrets/target-registry-data.ts` hinzufügen, aktualisieren Sie `classifyTargetClass` in diesem Test. Der Test schlägt absichtlich bei nicht klassifizierten Ziel-IDs fehl, damit neue Klassen nicht stillschweigend übersprungen werden können.

## Verwandt

- [Live testen](/de/help/testing-live)
- [CI](/de/ci)
