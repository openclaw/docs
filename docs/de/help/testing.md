---
read_when:
    - Tests lokal oder in der CI ausführen
    - Regressionstests für Modell-/Provider-Fehler hinzufügen
    - Fehlerbehebung für Gateway- und Agent-Verhalten
summary: 'Testkit: Unit-/e2e-/Live-Suites, Docker-Runner und was jeder Test abdeckt'
title: Testen
x-i18n:
    generated_at: "2026-04-30T06:59:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: c7b506350f11431195cb55c84cb10e99efb5f43b934079528b982627024d1ffc
    source_path: help/testing.md
    workflow: 16
---

OpenClaw hat drei Vitest-Suites (Unit/Integration, E2E, Live) und eine kleine Gruppe
von Docker-Runnern. Dieses Dokument ist ein Leitfaden dazu, wie wir testen:

- Was jede Suite abdeckt (und was sie absichtlich _nicht_ abdeckt).
- Welche Befehle für gängige Workflows auszuführen sind (lokal, vor dem Push, Debugging).
- Wie Live-Tests Zugangsdaten finden und Modelle/Provider auswählen.
- Wie Regressionen für reale Modell-/Provider-Probleme hinzugefügt werden.

<Note>
**QA-Stack (`qa-lab`, `qa-channel`, Live-Transport-Lanes)** ist separat dokumentiert:

- [QA-Übersicht](/de/concepts/qa-e2e-automation) — Architektur, Befehlsoberfläche, Szenario-Erstellung.
- [Matrix-QA](/de/concepts/qa-matrix) — Referenz für `pnpm openclaw qa matrix`.
- [QA-Kanal](/de/channels/qa-channel) — das synthetische Transport-Plugin, das von repo-gestützten Szenarien verwendet wird.

Diese Seite behandelt das Ausführen der regulären Test-Suites und Docker-/Parallels-Runner. Der folgende Abschnitt zu QA-spezifischen Runnern ([QA-spezifische Runner](#qa-specific-runners)) listet die konkreten `qa`-Aufrufe auf und verweist zurück auf die oben genannten Referenzen.
</Note>

## Schnellstart

An den meisten Tagen:

- Vollständiger Gate (vor dem Push erwartet): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- Schnellerer lokaler Lauf der vollständigen Suite auf einer großzügig ausgestatteten Maschine: `pnpm test:max`
- Direkte Vitest-Watch-Schleife: `pnpm test:watch`
- Direktes Datei-Targeting routet jetzt auch Erweiterungs-/Kanalpfade: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- Bevorzugen Sie zuerst gezielte Läufe, wenn Sie an einem einzelnen Fehler iterieren.
- Docker-gestützte QA-Website: `pnpm qa:lab:up`
- Linux-VM-gestützte QA-Lane: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

Wenn Sie Tests anfassen oder zusätzliche Sicherheit möchten:

- Coverage-Gate: `pnpm test:coverage`
- E2E-Suite: `pnpm test:e2e`

Beim Debuggen realer Provider/Modelle (erfordert echte Zugangsdaten):

- Live-Suite (Modelle + Gateway-Tool-/Bildprüfungen): `pnpm test:live`
- Eine Live-Datei leise gezielt ausführen: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Docker-Live-Modell-Sweep: `pnpm test:docker:live-models`
  - Jedes ausgewählte Modell führt jetzt einen Text-Turn plus eine kleine dateilesenartige Prüfung aus.
    Modelle, deren Metadaten `image`-Eingabe ausweisen, führen außerdem einen kleinen Bild-Turn aus.
    Deaktivieren Sie die zusätzlichen Prüfungen mit `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` oder
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0`, wenn Sie Provider-Fehler isolieren.
  - CI-Abdeckung: Das tägliche `OpenClaw Scheduled Live And E2E Checks` und das manuelle
    `OpenClaw Release Checks` rufen beide den wiederverwendbaren Live-/E2E-Workflow mit
    `include_live_suites: true` auf, was separate Docker-Live-Modell-
    Matrix-Jobs einschließt, die nach Provider geshardet sind.
  - Für fokussierte CI-Neuläufe starten Sie `OpenClaw Live And E2E Checks (Reusable)`
    mit `include_live_suites: true` und `live_models_only: true`.
  - Fügen Sie neue aussagekräftige Provider-Secrets zu `scripts/ci-hydrate-live-auth.sh`
    sowie `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` und den
    geplanten/Release-Aufrufern hinzu.
- Nativer Codex-Bound-Chat-Smoke: `pnpm test:docker:live-codex-bind`
  - Führt eine Docker-Live-Lane gegen den Codex-App-Server-Pfad aus, bindet eine synthetische
    Slack-DM mit `/codex bind`, übt `/codex fast` und
    `/codex permissions` aus und verifiziert dann, dass eine einfache Antwort und ein Bildanhang
    über die native Plugin-Bindung statt über ACP geroutet werden.
- Codex-App-Server-Harness-Smoke: `pnpm test:docker:live-codex-harness`
  - Führt Gateway-Agent-Turns durch das Plugin-eigene Codex-App-Server-Harness aus,
    verifiziert `/codex status` und `/codex models` und übt standardmäßig Bild-,
    Cron-MCP-, Sub-Agent- und Guardian-Prüfungen aus. Deaktivieren Sie die Sub-Agent-Prüfung mit
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0`, wenn Sie andere Codex-
    App-Server-Fehler isolieren. Für eine fokussierte Sub-Agent-Prüfung deaktivieren Sie die anderen Prüfungen:
    `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`.
    Dies beendet nach der Sub-Agent-Prüfung, sofern nicht
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0` gesetzt ist.
- Crestodian-Rescue-Command-Smoke: `pnpm test:live:crestodian-rescue-channel`
  - Opt-in-Prüfung mit doppelter Absicherung für die Message-Channel-Rescue-Command-
    Oberfläche. Sie übt `/crestodian status` aus, stellt eine persistente Modell-
    Änderung in die Warteschlange, antwortet `/crestodian yes` und verifiziert den Audit-/Config-Schreibpfad.
- Crestodian-Planner-Docker-Smoke: `pnpm test:docker:crestodian-planner`
  - Führt Crestodian in einem configlosen Container mit einer gefälschten Claude CLI auf `PATH`
    aus und verifiziert, dass der Fuzzy-Planner-Fallback in einen auditierten typisierten
    Config-Schreibvorgang übersetzt wird.
- Crestodian-First-Run-Docker-Smoke: `pnpm test:docker:crestodian-first-run`
  - Startet aus einem leeren OpenClaw-State-Verzeichnis, routet reines `openclaw` zu
    Crestodian, wendet Setup-/Modell-/Agent-/Discord-Plugin- und SecretRef-Schreibvorgänge an,
    validiert die Config und verifiziert Audit-Einträge. Derselbe Ring-0-Setup-Pfad wird
    auch in QA Lab durch
    `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup` abgedeckt.
- Moonshot-/Kimi-Kosten-Smoke: Führen Sie mit gesetztem `MOONSHOT_API_KEY`
  `openclaw models list --provider moonshot --json` aus, danach einen isolierten
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  gegen `moonshot/kimi-k2.6`. Verifizieren Sie, dass das JSON Moonshot/K2.6 meldet und das
  Assistant-Transkript normalisierte `usage.cost` speichert.

<Tip>
Wenn Sie nur einen fehlschlagenden Fall benötigen, grenzen Sie Live-Tests bevorzugt über die unten beschriebenen Allowlist-Env-Vars ein.
</Tip>

## QA-spezifische Runner

Diese Befehle stehen neben den Haupt-Test-Suites, wenn Sie QA-Lab-Realismus benötigen:

CI führt QA Lab in dedizierten Workflows aus. `Parity gate` läuft auf passenden PRs und
per manueller Auslösung mit Mock-Providern. `QA-Lab - All Lanes` läuft nächtlich auf
`main` und per manueller Auslösung mit dem Mock-Parity-Gate, der Live-Matrix-Lane,
der Convex-verwalteten Live-Telegram-Lane und der Convex-verwalteten Live-Discord-Lane als
parallele Jobs. Geplante QA- und Release-Prüfungen übergeben Matrix `--profile fast`
explizit, während die Standardwerte der Matrix CLI und der manuellen Workflow-Eingabe
`all` bleiben; manuelle Auslösung kann `all` in `transport`, `media`, `e2ee-smoke`,
`e2ee-deep` und `e2ee-cli` Jobs sharden. `OpenClaw Release Checks` führt Parity plus
die schnellen Matrix- und Telegram-Lanes vor der Release-Freigabe aus und verwendet
`mock-openai/gpt-5.5` für Release-Transportprüfungen, damit sie deterministisch bleiben
und den normalen Provider-Plugin-Start vermeiden. Diese Live-Transport-Gateways deaktivieren
Memory-Suche; Memory-Verhalten bleibt durch die QA-Parity-Suites abgedeckt.

Vollständige Release-Live-Media-Shards verwenden
`ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, das bereits
`ffmpeg` und `ffprobe` enthält. Docker-Live-Modell-/Backend-Shards verwenden das gemeinsame
`ghcr.io/openclaw/openclaw-live-test:<sha>`-Image, das einmal pro ausgewähltem
Commit gebaut wird, und ziehen es dann mit `OPENCLAW_SKIP_DOCKER_BUILD=1`, statt es
in jedem Shard neu zu bauen.

- `pnpm openclaw qa suite`
  - Führt repo-gestützte QA-Szenarien direkt auf dem Host aus.
  - Führt mehrere ausgewählte Szenarien standardmäßig parallel mit isolierten
    Gateway-Workern aus. `qa-channel` verwendet standardmäßig Parallelität 4 (begrenzt durch die
    Anzahl der ausgewählten Szenarien). Verwenden Sie `--concurrency <count>`, um die Worker-
    Anzahl anzupassen, oder `--concurrency 1` für die ältere serielle Lane.
  - Beendet mit einem Nicht-Null-Code, wenn ein Szenario fehlschlägt. Verwenden Sie `--allow-failures`, wenn Sie
    Artefakte ohne fehlschlagenden Exit-Code möchten.
  - Unterstützt die Provider-Modi `live-frontier`, `mock-openai` und `aimock`.
    `aimock` startet einen lokalen AIMock-gestützten Provider-Server für experimentelle
    Fixture- und Protocol-Mock-Abdeckung, ohne die szenariobewusste
    `mock-openai`-Lane zu ersetzen.
- `pnpm test:gateway:cpu-scenarios`
  - Führt den Gateway-Startup-Bench plus ein kleines Mock-QA-Lab-Szenariopaket
    (`channel-chat-baseline`, `memory-failure-fallback`,
    `gateway-restart-inflight-run`) aus und schreibt eine kombinierte CPU-Beobachtungs-
    Zusammenfassung unter `.artifacts/gateway-cpu-scenarios/`.
  - Markiert standardmäßig nur anhaltend heiße CPU-Beobachtungen (`--cpu-core-warn`
    plus `--hot-wall-warn-ms`), sodass kurze Startup-Spitzen als Metriken erfasst werden,
    ohne wie die minutenlange Gateway-Peg-Regression auszusehen.
  - Verwendet gebaute `dist`-Artefakte; führen Sie zuerst einen Build aus, wenn der Checkout noch keine
    frische Runtime-Ausgabe hat.
- `pnpm openclaw qa suite --runner multipass`
  - Führt dieselbe QA-Suite in einer kurzlebigen Multipass-Linux-VM aus.
  - Behält dasselbe Szenarioauswahlverhalten wie `qa suite` auf dem Host bei.
  - Verwendet dieselben Provider-/Modellauswahl-Flags wie `qa suite`.
  - Live-Läufe leiten die unterstützten QA-Auth-Eingaben weiter, die für den Gast praktikabel sind:
    env-basierte Provider-Schlüssel, den QA-Live-Provider-Config-Pfad und `CODEX_HOME`,
    falls vorhanden.
  - Ausgabeverzeichnisse müssen unter dem Repo-Root bleiben, damit der Gast über
    den gemounteten Workspace zurückschreiben kann.
  - Schreibt den normalen QA-Bericht plus Zusammenfassung sowie Multipass-Logs unter
    `.artifacts/qa-e2e/...`.
- `pnpm qa:lab:up`
  - Startet die Docker-gestützte QA-Website für operatorartige QA-Arbeit.
- `pnpm test:docker:npm-onboard-channel-agent`
  - Baut ein npm-Tarball aus dem aktuellen Checkout, installiert es global in
    Docker, führt nicht-interaktives OpenAI-API-Key-Onboarding aus, konfiguriert standardmäßig Telegram,
    verifiziert, dass das Aktivieren des Plugin Runtime-Abhängigkeiten bei Bedarf installiert,
    führt Doctor aus und führt einen lokalen Agent-Turn gegen einen gemockten OpenAI-
    Endpunkt aus.
  - Verwenden Sie `OPENCLAW_NPM_ONBOARD_CHANNEL=discord`, um dieselbe Packaged-Install-
    Lane mit Discord auszuführen.
- `pnpm test:docker:session-runtime-context`
  - Führt einen deterministischen Built-App-Docker-Smoke für eingebettete Runtime-Kontext-
    Transkripte aus. Er verifiziert, dass verborgener OpenClaw-Runtime-Kontext als
    nicht angezeigte Custom Message persistiert wird, statt in den sichtbaren User-Turn zu leaken,
    seeded dann ein betroffenes defektes Session-JSONL und verifiziert, dass
    `openclaw doctor --fix` es mit einem Backup auf den aktiven Branch umschreibt.
- `pnpm test:docker:npm-telegram-live`
  - Installiert einen OpenClaw-Paketkandidaten in Docker, führt Installed-Package-
    Onboarding aus, konfiguriert Telegram über die installierte CLI und verwendet dann erneut die
    Live-Telegram-QA-Lane mit diesem installierten Paket als SUT-Gateway.
  - Standard ist `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta`; setzen Sie
    `OPENCLAW_NPM_TELEGRAM_PACKAGE_TGZ=/path/to/openclaw-current.tgz` oder
    `OPENCLAW_CURRENT_PACKAGE_TGZ`, um stattdessen ein aufgelöstes lokales Tarball zu testen,
    anstatt aus der Registry zu installieren.
  - Verwendet dieselben Telegram-Env-Zugangsdaten oder dieselbe Convex-Zugangsdatenquelle wie
    `pnpm openclaw qa telegram`. Für CI-/Release-Automatisierung setzen Sie
    `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex` plus
    `OPENCLAW_QA_CONVEX_SITE_URL` und das Role-Secret. Wenn
    `OPENCLAW_QA_CONVEX_SITE_URL` und ein Convex-Role-Secret in CI vorhanden sind,
    wählt der Docker-Wrapper Convex automatisch.
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` überschreibt die gemeinsame
    `OPENCLAW_QA_CREDENTIAL_ROLE` nur für diese Lane.
  - GitHub Actions stellt diese Lane als manuellen Maintainer-Workflow
    `NPM Telegram Beta E2E` bereit. Er läuft nicht beim Merge. Der Workflow verwendet die
    `qa-live-shared`-Umgebung und Convex-CI-Zugangsdaten-Leases.
- GitHub Actions stellt außerdem `Package Acceptance` für nebenläufige Produktnachweise
  gegen ein Kandidatenpaket bereit. Es akzeptiert eine vertrauenswürdige Ref, eine veröffentlichte npm-Spezifikation,
  eine HTTPS-Tarball-URL plus SHA-256 oder ein Tarball-Artefakt aus einem anderen Lauf, lädt
  das normalisierte `openclaw-current.tgz` als `package-under-test` hoch und führt dann den
  bestehenden Docker-E2E-Scheduler mit Smoke-, Package-, Product-, Full- oder Custom-
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

- Nachweis für genaue Tarball-URL erfordert einen Digest:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=url \
  -f package_url=https://registry.npmjs.org/openclaw/-/openclaw-VERSION.tgz \
  -f package_sha256=<sha256> \
  -f suite_profile=package
```

- Der Artefaktnachweis lädt ein Tarball-Artefakt aus einem anderen Actions-Lauf herunter:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=artifact \
  -f artifact_run_id=<run-id> \
  -f artifact_name=<artifact-name> \
  -f suite_profile=smoke
```

- `pnpm test:docker:bundled-channel-deps`
  - Packt und installiert den aktuellen OpenClaw-Build in Docker, startet das Gateway
    mit konfiguriertem OpenAI und aktiviert dann gebündelte Kanäle/Plugins über
    Konfigurationsänderungen.
  - Überprüft, dass die Einrichtungserkennung unkonfigurierte Runtime-Abhängigkeiten
    von Plugins auslässt, der erste konfigurierte Gateway- oder Doctor-Lauf die
    Runtime-Abhängigkeiten jedes gebündelten Plugins bei Bedarf installiert und
    ein zweiter Neustart bereits aktivierte Abhängigkeiten nicht erneut installiert.
  - Installiert außerdem eine bekannte ältere npm-Basisversion, aktiviert Telegram vor dem Ausführen von
    `openclaw update --tag <candidate>` und überprüft, dass der Doctor nach dem Update des Kandidaten
    gebündelte Kanal-Runtime-Abhängigkeiten ohne harness-seitige Postinstall-Reparatur repariert.
- `pnpm test:parallels:npm-update`
  - Führt den nativen Smoke-Test für Updates paketierter Installationen über Parallels-Gäste hinweg aus. Jede
    ausgewählte Plattform installiert zuerst das angeforderte Basispaket, führt dann
    den installierten Befehl `openclaw update` im selben Gast aus und überprüft die
    installierte Version, den Update-Status, die Gateway-Bereitschaft und einen lokalen Agent-Turn.
  - Verwenden Sie `--platform macos`, `--platform windows` oder `--platform linux`, während
    Sie an einem Gast iterieren. Verwenden Sie `--json` für den Pfad des Zusammenfassungsartefakts und
    den Status pro Lane.
  - Die OpenAI-Lane verwendet standardmäßig `openai/gpt-5.5` für den Live-Nachweis des Agent-Turns.
    Übergeben Sie `--model <provider/model>` oder setzen Sie
    `OPENCLAW_PARALLELS_OPENAI_MODEL`, wenn Sie bewusst ein anderes
    OpenAI-Modell validieren.
  - Kapseln Sie lange lokale Läufe in ein Host-Timeout, damit Parallels-Transportblockaden
    nicht den Rest des Testfensters verbrauchen können:

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - Das Skript schreibt verschachtelte Lane-Logs unter `/tmp/openclaw-parallels-npm-update.*`.
    Prüfen Sie `windows-update.log`, `macos-update.log` oder `linux-update.log`,
    bevor Sie annehmen, dass der äußere Wrapper hängt.
  - Das Windows-Update kann auf einem kalten Gast 10 bis 15 Minuten mit Doctor-/Runtime-
    Abhängigkeitsreparatur nach dem Update verbringen; das ist weiterhin fehlerfrei, wenn das verschachtelte
    npm-Debug-Log voranschreitet.
  - Führen Sie diesen aggregierten Wrapper nicht parallel zu einzelnen Parallels-
    Smoke-Lanes für macOS, Windows oder Linux aus. Sie teilen sich VM-Zustand und können bei
    Snapshot-Wiederherstellung, Paketbereitstellung oder Gast-Gateway-Zustand kollidieren.
  - Der Nachweis nach dem Update führt die normale Oberfläche gebündelter Plugins aus, weil
    Capability-Fassaden wie Sprache, Bildgenerierung und Medienverständnis
    über gebündelte Runtime-APIs geladen werden, auch wenn der Agent-Turn selbst
    nur eine einfache Textantwort prüft.

- `pnpm openclaw qa aimock`
  - Startet nur den lokalen AIMock-Provider-Server für direkte Protocol-Smoke-
    Tests.
- `pnpm openclaw qa matrix`
  - Führt die Matrix-Live-QA-Lane gegen einen wegwerfbaren, Docker-gestützten Tuwunel-Homeserver aus. Nur Source-Checkout — paketierte Installationen liefern `qa-lab` nicht mit.
  - Vollständige CLI, Profil-/Szenariokatalog, Env-Vars und Artefaktlayout: [Matrix-QA](/de/concepts/qa-matrix).
- `pnpm openclaw qa telegram`
  - Führt die Telegram-Live-QA-Lane gegen eine echte private Gruppe mit den Driver- und SUT-Bot-Tokens aus der Umgebung aus.
  - Erfordert `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` und `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`. Die Gruppen-ID muss die numerische Telegram-Chat-ID sein.
  - Unterstützt `--credential-source convex` für gemeinsam genutzte gepoolte Zugangsdaten. Verwenden Sie standardmäßig den Env-Modus oder setzen Sie `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`, um gepoolte Leases zu nutzen.
  - Beendet sich mit einem Wert ungleich null, wenn ein Szenario fehlschlägt. Verwenden Sie `--allow-failures`, wenn Sie
    Artefakte ohne fehlschlagenden Exit-Code möchten.
  - Erfordert zwei unterschiedliche Bots in derselben privaten Gruppe, wobei der SUT-Bot einen Telegram-Benutzernamen bereitstellt.
  - Für stabile Bot-zu-Bot-Beobachtung aktivieren Sie den Bot-to-Bot Communication Mode in `@BotFather` für beide Bots und stellen Sie sicher, dass der Driver-Bot Gruppen-Bot-Traffic beobachten kann.
  - Schreibt einen Telegram-QA-Bericht, eine Zusammenfassung und ein Artefakt mit beobachteten Nachrichten unter `.artifacts/qa-e2e/...`. Antwortszenarien enthalten die RTT von der Sendeanforderung des Drivers bis zur beobachteten SUT-Antwort.

Live-Transport-Lanes teilen sich einen Standardvertrag, damit neue Transporte nicht auseinanderlaufen; die Abdeckungsmatrix pro Lane befindet sich in [QA-Übersicht → Live-Transportabdeckung](/de/concepts/qa-e2e-automation#live-transport-coverage). `qa-channel` ist die breite synthetische Suite und nicht Teil dieser Matrix.

### Gemeinsame Telegram-Zugangsdaten über Convex (v1)

Wenn `--credential-source convex` (oder `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`) für
`openclaw qa telegram` aktiviert ist, erwirbt das QA-Lab eine exklusive Lease aus einem Convex-gestützten Pool, sendet Heartbeats
für diese Lease, während die Lane läuft, und gibt die Lease beim Herunterfahren frei.

Referenz-Scaffold für das Convex-Projekt:

- `qa/convex-credential-broker/`

Erforderliche Env-Vars:

- `OPENCLAW_QA_CONVEX_SITE_URL` (zum Beispiel `https://your-deployment.convex.site`)
- Ein Secret für die ausgewählte Rolle:
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` für `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` für `ci`
- Auswahl der Zugangsdatenrolle:
  - CLI: `--credential-role maintainer|ci`
  - Env-Standard: `OPENCLAW_QA_CREDENTIAL_ROLE` (standardmäßig `ci` in CI, sonst `maintainer`)

Optionale Env-Vars:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (Standard `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (Standard `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (Standard `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (Standard `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (Standard `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (optionale Trace-ID)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` erlaubt Loopback-`http://`-Convex-URLs für rein lokale Entwicklung.

`OPENCLAW_QA_CONVEX_SITE_URL` sollte im Normalbetrieb `https://` verwenden.

Maintainer-Admin-Befehle (Pool hinzufügen/entfernen/auflisten) erfordern
speziell `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`.

CLI-Helfer für Maintainer:

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

Verwenden Sie `doctor` vor Live-Läufen, um die Convex-Site-URL, Broker-Secrets,
den Endpoint-Präfix, das HTTP-Timeout und die Admin-/Listen-Erreichbarkeit zu prüfen, ohne
Secret-Werte auszugeben. Verwenden Sie `--json` für maschinenlesbare Ausgabe in Skripten und CI-
Hilfsprogrammen.

Standard-Endpoint-Vertrag (`OPENCLAW_QA_CONVEX_SITE_URL` + `/qa-credentials/v1`):

- `POST /acquire`
  - Anfrage: `{ kind, ownerId, actorRole, leaseTtlMs, heartbeatIntervalMs }`
  - Erfolg: `{ status: "ok", credentialId, leaseToken, payload, leaseTtlMs?, heartbeatIntervalMs? }`
  - Erschöpft/wiederholbar: `{ status: "error", code: "POOL_EXHAUSTED" | "NO_CREDENTIAL_AVAILABLE", ... }`
- `POST /heartbeat`
  - Anfrage: `{ kind, ownerId, actorRole, credentialId, leaseToken, leaseTtlMs }`
  - Erfolg: `{ status: "ok" }` (oder leerer `2xx`)
- `POST /release`
  - Anfrage: `{ kind, ownerId, actorRole, credentialId, leaseToken }`
  - Erfolg: `{ status: "ok" }` (oder leerer `2xx`)
- `POST /admin/add` (nur Maintainer-Secret)
  - Anfrage: `{ kind, actorId, payload, note?, status? }`
  - Erfolg: `{ status: "ok", credential }`
- `POST /admin/remove` (nur Maintainer-Secret)
  - Anfrage: `{ credentialId, actorId }`
  - Erfolg: `{ status: "ok", changed, credential }`
  - Schutz vor aktiver Lease: `{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list` (nur Maintainer-Secret)
  - Anfrage: `{ kind?, status?, includePayload?, limit? }`
  - Erfolg: `{ status: "ok", credentials, count }`

Payload-Form für Telegram-Kind:

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` muss ein numerischer Telegram-Chat-ID-String sein.
- `admin/add` validiert diese Form für `kind: "telegram"` und lehnt fehlerhafte Payloads ab.

### Einen Kanal zu QA hinzufügen

Die Architektur- und Szenario-Helfernamen für neue Kanaladapter befinden sich in [QA-Übersicht → Einen Kanal hinzufügen](/de/concepts/qa-e2e-automation#adding-a-channel). Die Mindestanforderung: den Transport-Runner auf dem gemeinsamen `qa-lab`-Host-Seam implementieren, `qaRunners` im Plugin-Manifest deklarieren, als `openclaw qa <runner>` einbinden und Szenarien unter `qa/scenarios/` erstellen.

## Testsuiten (was wo läuft)

Betrachten Sie die Suiten als „zunehmenden Realismus“ (und zunehmende Flakiness/Kosten):

### Unit / Integration (Standard)

- Befehl: `pnpm test`
- Konfiguration: Nicht zielgerichtete Läufe verwenden das Shard-Set `vitest.full-*.config.ts` und können Multi-Projekt-Shards für paralleles Scheduling in projektbezogene Konfigurationen erweitern
- Dateien: Core-/Unit-Inventare unter `src/**/*.test.ts`, `packages/**/*.test.ts` und `test/**/*.test.ts`; UI-Unit-Tests laufen im dedizierten Shard `unit-ui`
- Umfang:
  - Reine Unit-Tests
  - In-Process-Integrationstests (Gateway-Auth, Routing, Tooling, Parsing, Konfiguration)
  - Deterministische Regressionen für bekannte Bugs
- Erwartungen:
  - Läuft in CI
  - Keine echten Schlüssel erforderlich
  - Sollte schnell und stabil sein
  - Resolver- und Public-Surface-Loader-Tests müssen das broad-Fallback-Verhalten von `api.js` und
    `runtime-api.js` mit generierten kleinen Plugin-Fixtures nachweisen, nicht mit
    echten Quell-APIs gebündelter Plugins. Echte Plugin-API-Loads gehören in
    Plugin-eigene Contract-/Integrationssuiten.

<AccordionGroup>
  <Accordion title="Projekte, Shards und bereichsbezogene Lanes">

    - Nicht zielgerichtete `pnpm test`-Ausführungen verwenden zwölf kleinere Shard-Konfigurationen (`core-unit-fast`, `core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) statt eines riesigen nativen Root-Projektprozesses. Das senkt den Spitzen-RSS auf ausgelasteten Rechnern und verhindert, dass auto-reply-/extension-Arbeit unabhängige Suites verdrängt.
    - `pnpm test --watch` verwendet weiterhin den nativen Root-`vitest.config.ts`-Projektgraphen, weil eine Watch-Schleife mit mehreren Shards nicht praktikabel ist.
    - `pnpm test`, `pnpm test:watch` und `pnpm test:perf:imports` leiten explizite Datei-/Verzeichnisziele zuerst durch bereichsbezogene Lanes, sodass `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` die vollständigen Startkosten des Root-Projekts vermeidet.
    - `pnpm test:changed` erweitert geänderte Git-Pfade standardmäßig zu günstigen bereichsbezogenen Lanes: direkte Teständerungen, benachbarte `*.test.ts`-Dateien, explizite Source-Zuordnungen und lokale Importgraph-Abhängige. Config-/Setup-/Package-Änderungen führen keine breiten Testläufe aus, außer Sie verwenden ausdrücklich `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`.
    - `pnpm check:changed` ist das normale intelligente lokale Check-Gate für eng begrenzte Arbeit. Es klassifiziert den Diff in Core, Core-Tests, extensions, extension-Tests, Apps, Docs, Release-Metadaten, Live-Docker-Tooling und Tooling und führt dann die passenden Typecheck-, Lint- und Guard-Befehle aus. Es führt keine Vitest-Tests aus; rufen Sie `pnpm test:changed` oder explizit `pnpm test <target>` für Testnachweise auf. Reine Release-Metadaten-Versionsanhebungen führen zielgerichtete Versions-/Config-/Root-Dependency-Checks aus, mit einem Guard, der Package-Änderungen außerhalb des obersten Versionsfelds ablehnt.
    - Änderungen am Live-Docker-ACP-Harness führen fokussierte Checks aus: Shell-Syntax für die Live-Docker-Auth-Skripte und einen Live-Docker-Scheduler-Dry-Run. `package.json`-Änderungen werden nur einbezogen, wenn der Diff auf `scripts["test:docker:live-*"]` beschränkt ist; Dependency-, Export-, Versions- und andere Package-Oberflächenänderungen verwenden weiterhin die breiteren Guards.
    - Import-leichte Unit-Tests aus Agents, Commands, Plugins, auto-reply-Helfern, `plugin-sdk` und ähnlichen reinen Utility-Bereichen laufen über die `unit-fast`-Lane, die `test/setup-openclaw-runtime.ts` überspringt; zustandsbehaftete/runtime-lastige Dateien bleiben auf den bestehenden Lanes.
    - Ausgewählte `plugin-sdk`- und `commands`-Helfer-Quelldateien ordnen Changed-Mode-Ausführungen außerdem expliziten benachbarten Tests in diesen leichten Lanes zu, sodass Helferänderungen vermeiden, die vollständige schwere Suite für dieses Verzeichnis erneut auszuführen.
    - `auto-reply` hat dedizierte Buckets für Core-Helfer der obersten Ebene, Top-Level-`reply.*`-Integrationstests und den `src/auto-reply/reply/**`-Unterbaum. CI teilt den reply-Unterbaum zusätzlich in agent-runner-, dispatch- und commands/state-routing-Shards auf, damit kein importlastiger Bucket den gesamten Node-Nachlauf besitzt.
    - Normale PR-/main-CI überspringt absichtlich den Extension-Batch-Sweep und den nur für Releases vorgesehenen `agentic-plugins`-Shard. Full Release Validation startet den separaten `Plugin Prerelease`-Child-Workflow für diese Plugin-/Extension-lastigen Suites auf Release Candidates.

  </Accordion>

  <Accordion title="Abdeckung des eingebetteten Runners">

    - Wenn Sie Discovery-Eingaben für Message-Tools oder Compaction-Runtime-
      Kontext ändern, behalten Sie beide Abdeckungsebenen bei.
    - Fügen Sie fokussierte Helfer-Regressionen für reine Routing- und Normalisierungs-
      Grenzen hinzu.
    - Halten Sie die Integration-Suites des eingebetteten Runners gesund:
      `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
      `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts` und
      `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
    - Diese Suites verifizieren, dass bereichsbezogene IDs und Compaction-Verhalten weiterhin
      durch die realen `run.ts`- / `compact.ts`-Pfade fließen; reine Helfertests sind
      kein ausreichender Ersatz für diese Integrationspfade.

  </Accordion>

  <Accordion title="Vitest-Pool- und Isolationsstandards">

    - Die Basis-Vitest-Konfiguration verwendet standardmäßig `threads`.
    - Die gemeinsame Vitest-Konfiguration setzt `isolate: false` fest und verwendet den
      nicht isolierten Runner über die Root-Projekte, e2e- und Live-Konfigurationen hinweg.
    - Die Root-UI-Lane behält ihr `jsdom`-Setup und ihren Optimizer bei, läuft aber ebenfalls auf dem
      gemeinsamen nicht isolierten Runner.
    - Jeder `pnpm test`-Shard erbt dieselben `threads`- + `isolate: false`-
      Standardwerte aus der gemeinsamen Vitest-Konfiguration.
    - `scripts/run-vitest.mjs` fügt standardmäßig `--no-maglev` für Vitest-Child-Node-
      Prozesse hinzu, um V8-Kompilieraufwand während großer lokaler Ausführungen zu reduzieren.
      Setzen Sie `OPENCLAW_VITEST_ENABLE_MAGLEV=1`, um mit dem Standard-V8-
      Verhalten zu vergleichen.

  </Accordion>

  <Accordion title="Schnelle lokale Iteration">

    - `pnpm changed:lanes` zeigt, welche Architektur-Lanes ein Diff auslöst.
    - Der Pre-Commit-Hook dient nur der Formatierung. Er staget formatierte Dateien erneut und
      führt weder Lint, Typecheck noch Tests aus.
    - Führen Sie `pnpm check:changed` ausdrücklich vor Übergabe oder Push aus, wenn Sie
      das intelligente lokale Check-Gate benötigen.
    - `pnpm test:changed` läuft standardmäßig über günstige bereichsbezogene Lanes. Verwenden Sie
      `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` nur, wenn der Agent
      entscheidet, dass eine Harness-, Config-, Package- oder Contract-Änderung wirklich breitere
      Vitest-Abdeckung benötigt.
    - `pnpm test:max` und `pnpm test:changed:max` behalten dasselbe Routing-
      Verhalten bei, nur mit einer höheren Worker-Obergrenze.
    - Die lokale Worker-Autoskalierung ist absichtlich konservativ und regelt herunter,
      wenn der Load Average des Hosts bereits hoch ist, sodass mehrere gleichzeitige
      Vitest-Ausführungen standardmäßig weniger Schaden anrichten.
    - Die Basis-Vitest-Konfiguration markiert die Projekte/Config-Dateien als
      `forceRerunTriggers`, damit Changed-Mode-Neuausführungen korrekt bleiben, wenn sich die Test-
      Verkabelung ändert.
    - Die Config hält `OPENCLAW_VITEST_FS_MODULE_CACHE` auf unterstützten
      Hosts aktiviert; setzen Sie `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path`, wenn Sie
      einen expliziten Cache-Ort für direktes Profiling wünschen.

  </Accordion>

  <Accordion title="Performance-Debugging">

    - `pnpm test:perf:imports` aktiviert Vitest-Importdauer-Reporting plus
      Import-Breakdown-Ausgabe.
    - `pnpm test:perf:imports:changed` begrenzt dieselbe Profiling-Ansicht auf
      seit `origin/main` geänderte Dateien.
    - Shard-Timing-Daten werden nach `.artifacts/vitest-shard-timings.json` geschrieben.
      Whole-Config-Ausführungen verwenden den Config-Pfad als Schlüssel; Include-Pattern-CI-
      Shards hängen den Shard-Namen an, damit gefilterte Shards separat verfolgt werden können.
    - Wenn ein heißer Test weiterhin die meiste Zeit in Startup-Imports verbringt,
      halten Sie schwere Dependencies hinter einer schmalen lokalen `*.runtime.ts`-Grenze und
      mocken Sie diese Grenze direkt, statt Runtime-Helfer tief zu importieren, nur
      um sie durch `vi.mock(...)` zu reichen.
    - `pnpm test:perf:changed:bench -- --ref <git-ref>` vergleicht geroutetes
      `test:changed` mit dem nativen Root-Projektpfad für diesen committeten
      Diff und gibt Wall Time plus macOS Max RSS aus.
    - `pnpm test:perf:changed:bench -- --worktree` benchmarket den aktuellen
      Dirty Tree, indem die Liste geänderter Dateien durch
      `scripts/test-projects.mjs` und die Root-Vitest-Konfiguration geroutet wird.
    - `pnpm test:perf:profile:main` schreibt ein Main-Thread-CPU-Profil für
      Vitest-/Vite-Startup- und Transform-Overhead.
    - `pnpm test:perf:profile:runner` schreibt Runner-CPU-+Heap-Profile für die
      Unit-Suite mit deaktivierter Dateiparallelität.

  </Accordion>
</AccordionGroup>

### Stabilität (Gateway)

- Befehl: `pnpm test:stability:gateway`
- Config: `vitest.gateway.config.ts`, auf einen Worker erzwungen
- Umfang:
  - Startet standardmäßig ein echtes local loopback Gateway mit aktivierter Diagnose
  - Treibt synthetischen Gateway-Message-, Memory- und Large-Payload-Churn durch den Diagnose-Event-Pfad
  - Fragt `diagnostics.stability` über das Gateway-WS-RPC ab
  - Deckt Hilfen zur Persistierung des Diagnose-Stabilitätsbundles ab
  - Stellt sicher, dass der Recorder begrenzt bleibt, synthetische RSS-Samples unter dem Druckbudget bleiben und Queue-Tiefen pro Session wieder auf null ablaufen
- Erwartungen:
  - CI-sicher und ohne Schlüssel
  - Schmale Lane für die Nachverfolgung von Stabilitätsregressionen, kein Ersatz für die vollständige Gateway-Suite

### E2E (Gateway-Smoke)

- Befehl: `pnpm test:e2e`
- Config: `vitest.e2e.config.ts`
- Dateien: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts` und gebündelte Plugin-E2E-Tests unter `extensions/`
- Runtime-Standards:
  - Verwendet Vitest `threads` mit `isolate: false`, passend zum Rest des Repos.
  - Verwendet adaptive Worker (CI: bis zu 2, lokal: standardmäßig 1).
  - Läuft standardmäßig im Silent-Modus, um Console-I/O-Overhead zu reduzieren.
- Nützliche Overrides:
  - `OPENCLAW_E2E_WORKERS=<n>` zum Erzwingen der Worker-Anzahl (auf 16 begrenzt).
  - `OPENCLAW_E2E_VERBOSE=1` zum erneuten Aktivieren ausführlicher Console-Ausgabe.
- Umfang:
  - End-to-End-Verhalten des Gateways mit mehreren Instanzen
  - WebSocket-/HTTP-Oberflächen, Node-Pairing und schwergewichtigere Netzwerkfunktionen
- Erwartungen:
  - Läuft in CI (wenn in der Pipeline aktiviert)
  - Keine echten Schlüssel erforderlich
  - Mehr bewegliche Teile als Unit-Tests (kann langsamer sein)

### E2E: OpenShell-Backend-Smoke

- Befehl: `pnpm test:e2e:openshell`
- Datei: `extensions/openshell/src/backend.e2e.test.ts`
- Umfang:
  - Startet ein isoliertes OpenShell-Gateway auf dem Host über Docker
  - Erstellt eine Sandbox aus einer temporären lokalen Dockerfile
  - Übt OpenClaws OpenShell-Backend über echtes `sandbox ssh-config` + SSH exec aus
  - Verifiziert remote-kanonisches Dateisystemverhalten über die Sandbox-fs-Bridge
- Erwartungen:
  - Nur Opt-in; nicht Teil der standardmäßigen `pnpm test:e2e`-Ausführung
  - Erfordert eine lokale `openshell`-CLI plus einen funktionierenden Docker-Daemon
  - Verwendet isolierte `HOME` / `XDG_CONFIG_HOME` und zerstört anschließend Test-Gateway und Sandbox
- Nützliche Overrides:
  - `OPENCLAW_E2E_OPENSHELL=1`, um den Test beim manuellen Ausführen der breiteren e2e-Suite zu aktivieren
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell`, um auf ein nicht standardmäßiges CLI-Binary oder Wrapper-Skript zu zeigen

### Live (echte Provider + echte Modelle)

- Befehl: `pnpm test:live`
- Config: `vitest.live.config.ts`
- Dateien: `src/**/*.live.test.ts`, `test/**/*.live.test.ts` und gebündelte Plugin-Live-Tests unter `extensions/`
- Standard: durch `pnpm test:live` **aktiviert** (setzt `OPENCLAW_LIVE_TEST=1`)
- Umfang:
  - „Funktioniert dieser Provider/dieses Modell _heute_ tatsächlich mit echten Anmeldedaten?“
  - Erkennt Provider-Formatänderungen, Eigenheiten beim Tool-Calling, Auth-Probleme und Rate-Limit-Verhalten
- Erwartungen:
  - Von Natur aus nicht CI-stabil (echte Netzwerke, echte Provider-Richtlinien, Quoten, Ausfälle)
  - Kostet Geld / verwendet Rate Limits
  - Bevorzugen Sie eng begrenzte Teilmengen statt „alles“
- Live-Ausführungen sourcen `~/.profile`, um fehlende API-Schlüssel aufzunehmen.
- Standardmäßig isolieren Live-Ausführungen weiterhin `HOME` und kopieren Config-/Auth-Material in ein temporäres Test-Home, damit Unit-Fixtures Ihr echtes `~/.openclaw` nicht verändern können.
- Setzen Sie `OPENCLAW_LIVE_USE_REAL_HOME=1` nur, wenn Live-Tests bewusst Ihr echtes Home-Verzeichnis verwenden müssen.
- `pnpm test:live` verwendet jetzt standardmäßig einen ruhigeren Modus: Er behält `[live] ...`-Fortschrittsausgabe bei, unterdrückt aber den zusätzlichen `~/.profile`-Hinweis und schaltet Gateway-Bootstrap-Logs/Bonjour-Gerede stumm. Setzen Sie `OPENCLAW_LIVE_TEST_QUIET=0`, wenn Sie die vollständigen Startup-Logs zurückhaben möchten.
- API-Schlüsselrotation (Provider-spezifisch): Setzen Sie `*_API_KEYS` mit Komma-/Semikolonformat oder `*_API_KEY_1`, `*_API_KEY_2` (zum Beispiel `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) oder einen pro-Live-Override über `OPENCLAW_LIVE_*_KEY`; Tests versuchen es bei Rate-Limit-Antworten erneut.
- Fortschritts-/Heartbeat-Ausgabe:
  - Live-Suites geben jetzt Fortschrittszeilen nach stderr aus, sodass lange Provider-Aufrufe sichtbar aktiv sind, selbst wenn die Vitest-Console-Erfassung ruhig ist.
  - `vitest.live.config.ts` deaktiviert Vitest-Console-Interception, sodass Provider-/Gateway-Fortschrittszeilen während Live-Ausführungen sofort gestreamt werden.
  - Stimmen Sie Direct-Model-Heartbeats mit `OPENCLAW_LIVE_HEARTBEAT_MS` ab.
  - Stimmen Sie Gateway-/Probe-Heartbeats mit `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS` ab.

## Welche Suite sollte ich ausführen?

Verwenden Sie diese Entscheidungstabelle:

- Bearbeitungslogik/-tests: Führen Sie `pnpm test` aus (und `pnpm test:coverage`, wenn Sie viel geändert haben)
- Gateway-Netzwerk / WS-Protokoll / Pairing berühren: Fügen Sie `pnpm test:e2e` hinzu
- Debugging von „mein Bot ist offline“ / Provider-spezifischen Fehlern / Tool-Aufrufen: Führen Sie ein eingegrenztes `pnpm test:live` aus

## Live-Tests (mit Netzwerkzugriff)

Für die Live-Modellmatrix, CLI-Backend-Smokes, ACP-Smokes, das Codex-App-Server-
Harness und alle Live-Tests für Media-Provider (Deepgram, BytePlus, ComfyUI, Bild,
Musik, Video, Medien-Harness) — plus Umgang mit Anmeldedaten für Live-Läufe — siehe
[Tests — Live-Suites](/de/help/testing-live).

## Docker-Runner (optionale Prüfungen für „funktioniert unter Linux“)

Diese Docker-Runner sind in zwei Gruppen aufgeteilt:

- Live-Modell-Runner: `test:docker:live-models` und `test:docker:live-gateway` führen nur ihre passende Live-Datei für den Profil-Key innerhalb des Repo-Docker-Images aus (`src/agents/models.profiles.live.test.ts` und `src/gateway/gateway-models.profiles.live.test.ts`), wobei Ihr lokales Konfigurationsverzeichnis und Ihr Workspace gemountet werden (und `~/.profile` eingelesen wird, falls gemountet). Die passenden lokalen Einstiegspunkte sind `test:live:models-profiles` und `test:live:gateway-profiles`.
- Docker-Live-Runner verwenden standardmäßig eine kleinere Smoke-Obergrenze, damit ein vollständiger Docker-Durchlauf praktikabel bleibt:
  `test:docker:live-models` verwendet standardmäßig `OPENCLAW_LIVE_MAX_MODELS=12`, und
  `test:docker:live-gateway` verwendet standardmäßig `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000` und
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`. Überschreiben Sie diese Umgebungsvariablen, wenn Sie
  ausdrücklich den größeren vollständigen Scan wünschen.
- `test:docker:all` baut das Live-Docker-Image einmal über `test:docker:live-build`, packt OpenClaw einmal als npm-Tarball über `scripts/package-openclaw-for-docker.mjs` und baut/verwendet dann zwei `scripts/e2e/Dockerfile`-Images. Das Bare-Image ist nur der Node/Git-Runner für Installations-, Update- und Plugin-Abhängigkeits-Lanes; diese Lanes mounten den vorab gebauten Tarball. Das funktionale Image installiert denselben Tarball nach `/app` für Built-App-Funktions-Lanes. Docker-Lane-Definitionen befinden sich in `scripts/lib/docker-e2e-scenarios.mjs`; die Planner-Logik befindet sich in `scripts/lib/docker-e2e-plan.mjs`; `scripts/test-docker-all.mjs` führt den ausgewählten Plan aus. Das Aggregat verwendet einen gewichteten lokalen Scheduler: `OPENCLAW_DOCKER_ALL_PARALLELISM` steuert Prozess-Slots, während Ressourcenobergrenzen verhindern, dass schwere Live-, npm-Installations- und Multi-Service-Lanes alle gleichzeitig starten. Wenn eine einzelne Lane schwerer ist als die aktiven Obergrenzen, kann der Scheduler sie trotzdem starten, wenn der Pool leer ist, und lässt sie dann allein laufen, bis wieder Kapazität verfügbar ist. Standardwerte sind 10 Slots, `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` und `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`; passen Sie `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` oder `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` nur an, wenn der Docker-Host mehr Spielraum hat. Der Runner führt standardmäßig einen Docker-Preflight aus, entfernt veraltete OpenClaw-E2E-Container, gibt alle 30 Sekunden den Status aus, speichert erfolgreiche Lane-Zeiten in `.artifacts/docker-tests/lane-timings.json` und nutzt diese Zeiten, um bei späteren Läufen längere Lanes zuerst zu starten. Verwenden Sie `OPENCLAW_DOCKER_ALL_DRY_RUN=1`, um das gewichtete Lane-Manifest ohne Build oder Docker-Ausführung auszugeben, oder `node scripts/test-docker-all.mjs --plan-json`, um den CI-Plan für ausgewählte Lanes, Paket-/Image-Anforderungen und Anmeldedaten auszugeben.
- `Package Acceptance` ist das GitHub-native Paket-Gate für „funktioniert dieser installierbare Tarball als Produkt?“ Es löst ein Kandidatenpaket aus `source=npm`, `source=ref`, `source=url` oder `source=artifact` auf, lädt es als `package-under-test` hoch und führt dann die wiederverwendbaren Docker-E2E-Lanes gegen genau diesen Tarball aus, statt den ausgewählten Ref neu zu packen. `workflow_ref` wählt die vertrauenswürdigen Workflow-/Harness-Skripte aus, während `package_ref` den Source-Commit/-Branch/-Tag auswählt, der gepackt wird, wenn `source=ref`; so kann die aktuelle Acceptance-Logik ältere vertrauenswürdige Commits validieren. Profile sind nach Breite geordnet: `smoke` ist schnelle Installation/Kanal/Agent plus Gateway/Konfiguration, `package` ist der Paket-/Update-/Plugin-Vertrag und der standardmäßige native Ersatz für die meiste Parallels-Paket-/Update-Abdeckung, `product` fügt MCP-Kanäle, Cron-/Subagent-Bereinigung, OpenAI-Websuche und OpenWebUI hinzu, und `full` führt die Docker-Abschnitte für den Release-Pfad mit OpenWebUI aus. Release-Validierung führt ein benutzerdefiniertes Paket-Delta aus (`bundled-channel-deps-compat plugins-offline`) plus Telegram-Paket-QA, weil die Docker-Abschnitte für den Release-Pfad die überlappenden Paket-/Update-/Plugin-Lanes bereits abdecken. Aus Artefakten generierte gezielte GitHub-Docker-Wiederholungskommandos enthalten vorherige Paketartefakt- und vorbereitete Image-Eingaben, sofern verfügbar, damit fehlgeschlagene Lanes vermeiden können, das Paket und die Images erneut zu bauen.
- Build- und Release-Prüfungen führen `scripts/check-cli-bootstrap-imports.mjs` nach tsdown aus. Der Guard durchläuft den statisch gebauten Graphen ab `dist/entry.js` und `dist/cli/run-main.js` und schlägt fehl, wenn der Start vor dem Dispatch Paketabhängigkeiten wie Commander, Prompt-UI, undici oder Logging vor dem Command-Dispatch importiert; außerdem hält er den gebündelten Gateway-Run-Chunk unter dem Budget und weist statische Importe bekannter kalter Gateway-Pfade zurück. Packaged-CLI-Smoke deckt außerdem Root-Hilfe, Onboard-Hilfe, Doctor-Hilfe, Status, Konfigurationsschema und einen Model-List-Befehl ab.
- Legacy-Kompatibilität von Package Acceptance ist auf `2026.4.25` begrenzt (`2026.4.25-beta.*` eingeschlossen). Bis zu diesem Stichtag toleriert das Harness nur ausgelieferte Paket-Metadatenlücken: ausgelassene private QA-Inventareinträge, fehlendes `gateway install --wrapper`, fehlende Patch-Dateien im aus dem Tarball abgeleiteten Git-Fixture, fehlendes persistiertes `update.channel`, alte Speicherorte für Plugin-Installationsdatensätze, fehlende Persistenz von Marketplace-Installationsdatensätzen und Konfigurationsmetadaten-Migration während `plugins update`. Für Pakete nach `2026.4.25` sind diese Pfade strikte Fehler.
- Container-Smoke-Runner: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:npm-onboard-channel-agent`, `test:docker:update-channel-switch`, `test:docker:session-runtime-context`, `test:docker:agents-delete-shared-workspace`, `test:docker:gateway-network`, `test:docker:browser-cdp-snapshot`, `test:docker:mcp-channels`, `test:docker:pi-bundle-mcp-tools`, `test:docker:cron-mcp-cleanup`, `test:docker:plugins`, `test:docker:plugin-update` und `test:docker:config-reload` starten einen oder mehrere echte Container und prüfen Integrationspfade auf höherer Ebene.

Die Live-Modell-Docker-Runner binden außerdem nur die benötigten CLI-Auth-Homes ein (oder alle unterstützten, wenn der Lauf nicht eingegrenzt ist) und kopieren sie dann vor dem Lauf in das Container-Home, damit OAuth externer CLIs Tokens aktualisieren kann, ohne den Auth-Store des Hosts zu verändern:

- Direkte Modelle: `pnpm test:docker:live-models` (Skript: `scripts/test-live-models-docker.sh`)
- ACP-Bind-Smoke-Test: `pnpm test:docker:live-acp-bind` (Skript: `scripts/test-live-acp-bind-docker.sh`; deckt standardmäßig Claude, Codex und Gemini ab, mit strikter Droid-/OpenCode-Abdeckung über `pnpm test:docker:live-acp-bind:droid` und `pnpm test:docker:live-acp-bind:opencode`)
- CLI-Backend-Smoke-Test: `pnpm test:docker:live-cli-backend` (Skript: `scripts/test-live-cli-backend-docker.sh`)
- Codex-App-Server-Harness-Smoke-Test: `pnpm test:docker:live-codex-harness` (Skript: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + Entwicklungsagent: `pnpm test:docker:live-gateway` (Skript: `scripts/test-live-gateway-models-docker.sh`)
- Observability-Smoke-Test: `pnpm qa:otel:smoke` ist eine private QA-Lane für Source-Checkouts. Sie ist absichtlich nicht Teil der Package-Docker-Release-Lanes, weil der npm-Tarball QA Lab auslässt.
- Open WebUI-Live-Smoke-Test: `pnpm test:docker:openwebui` (Skript: `scripts/e2e/openwebui-docker.sh`)
- Onboarding-Assistent (TTY, vollständiges Scaffolding): `pnpm test:docker:onboard` (Skript: `scripts/e2e/onboard-docker.sh`)
- Npm-Tarball-Onboarding-/Kanal-/Agent-Smoke-Test: `pnpm test:docker:npm-onboard-channel-agent` installiert den gepackten OpenClaw-Tarball global in Docker, konfiguriert OpenAI per Env-Ref-Onboarding plus standardmäßig Telegram, verifiziert, dass Doctor aktivierte Plugin-Runtime-Abhängigkeiten repariert, und führt einen gemockten OpenAI-Agent-Turn aus. Verwenden Sie einen vorgebauten Tarball mit `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz` erneut, überspringen Sie den Host-Rebuild mit `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0`, oder wechseln Sie den Kanal mit `OPENCLAW_NPM_ONBOARD_CHANNEL=discord`.
- Update-Kanalwechsel-Smoke-Test: `pnpm test:docker:update-channel-switch` installiert den gepackten OpenClaw-Tarball global in Docker, wechselt von Package-`stable` zu Git-`dev`, verifiziert den persistierten Kanal und die Plugin-Funktion nach dem Update, wechselt dann zurück zu Package-`stable` und prüft den Update-Status.
- Session-Runtime-Kontext-Smoke-Test: `pnpm test:docker:session-runtime-context` verifiziert die Persistenz verborgener Runtime-Kontext-Transkripte sowie die Doctor-Reparatur betroffener duplizierter Prompt-Rewrite-Branches.
- Bun-Smoke-Test für globale Installation: `bash scripts/e2e/bun-global-install-smoke.sh` packt den aktuellen Tree, installiert ihn mit `bun install -g` in einem isolierten Home-Verzeichnis und verifiziert, dass `openclaw infer image providers --json` gebündelte Bild-Provider zurückgibt, statt hängen zu bleiben. Verwenden Sie einen vorgebauten Tarball mit `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz` erneut, überspringen Sie den Host-Build mit `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0`, oder kopieren Sie `dist/` aus einem gebauten Docker-Image mit `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local`.
- Installer-Docker-Smoke-Test: `bash scripts/test-install-sh-docker.sh` teilt einen npm-Cache zwischen Root-, Update- und direkten npm-Containern. Der Update-Smoke-Test verwendet standardmäßig npm `latest` als stabile Baseline, bevor auf den Kandidaten-Tarball aktualisiert wird. Überschreiben Sie dies lokal mit `OPENCLAW_INSTALL_SMOKE_UPDATE_BASELINE=2026.4.22` oder auf GitHub mit der `update_baseline_version`-Eingabe des Install Smoke-Workflows. Nicht-Root-Installer-Prüfungen behalten einen isolierten npm-Cache, damit root-eigene Cache-Einträge das Installationsverhalten im Benutzerkontext nicht verdecken. Setzen Sie `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache`, um den Root-/Update-/Direct-npm-Cache bei lokalen erneuten Läufen wiederzuverwenden.
- Install Smoke CI überspringt das doppelte direkte globale npm-Update mit `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1`; führen Sie das Skript lokal ohne diese Env aus, wenn Abdeckung für direktes `npm install -g` benötigt wird.
- CLI-Smoke-Test zum Löschen gemeinsam genutzter Arbeitsbereiche durch Agents: `pnpm test:docker:agents-delete-shared-workspace` (Skript: `scripts/e2e/agents-delete-shared-workspace-docker.sh`) baut standardmäßig das Root-Dockerfile-Image, legt zwei Agents mit einem Arbeitsbereich in einem isolierten Container-Home an, führt `agents delete --json` aus und verifiziert gültiges JSON sowie das Verhalten beibehaltener Arbeitsbereiche. Verwenden Sie das install-smoke-Image mit `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1` erneut.
- Gateway-Netzwerk (zwei Container, WS-Authentifizierung + Health): `pnpm test:docker:gateway-network` (Skript: `scripts/e2e/gateway-network-docker.sh`)
- Browser-CDP-Snapshot-Smoke-Test: `pnpm test:docker:browser-cdp-snapshot` (Skript: `scripts/e2e/browser-cdp-snapshot-docker.sh`) baut das Source-E2E-Image plus eine Chromium-Schicht, startet Chromium mit rohem CDP, führt `browser doctor --deep` aus und verifiziert, dass CDP-Rollen-Snapshots Link-URLs, zu Cursor-Klickzielen hochgestufte Elemente, iframe-Refs und Frame-Metadaten abdecken.
- OpenAI Responses web_search-Regression mit minimalem Reasoning: `pnpm test:docker:openai-web-search-minimal` (Skript: `scripts/e2e/openai-web-search-minimal-docker.sh`) führt einen gemockten OpenAI-Server über Gateway aus, verifiziert, dass `web_search` `reasoning.effort` von `minimal` auf `low` erhöht, erzwingt dann die Ablehnung durch das Provider-Schema und prüft, dass das rohe Detail in den Gateway-Logs erscheint.
- MCP-Kanal-Bridge (vorbereiteter Gateway + stdio-Bridge + roher Claude-Benachrichtigungs-Frame-Smoke-Test): `pnpm test:docker:mcp-channels` (Skript: `scripts/e2e/mcp-channels-docker.sh`)
- Pi-Bundle-MCP-Tools (echter stdio-MCP-Server + eingebetteter Pi-Profil-Allow-/Deny-Smoke-Test): `pnpm test:docker:pi-bundle-mcp-tools` (Skript: `scripts/e2e/pi-bundle-mcp-tools-docker.sh`)
- Cron-/Subagent-MCP-Cleanup (echter Gateway + stdio-MCP-Kindprozess-Abbau nach isolierten Cron- und One-Shot-Subagent-Läufen): `pnpm test:docker:cron-mcp-cleanup` (Skript: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Plugins (Install-Smoke-Test, ClawHub-Kitchen-Sink-Installation/-Deinstallation, Marketplace-Updates und Claude-Bundle-Aktivierung/-Inspektion): `pnpm test:docker:plugins` (Skript: `scripts/e2e/plugins-docker.sh`)
  Setzen Sie `OPENCLAW_PLUGINS_E2E_CLAWHUB=0`, um den ClawHub-Block zu überspringen, oder überschreiben Sie das standardmäßige Kitchen-Sink-Package-/Runtime-Paar mit `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` und `OPENCLAW_PLUGINS_E2E_CLAWHUB_ID`. Ohne `OPENCLAW_CLAWHUB_URL`/`CLAWHUB_URL` verwendet der Test einen hermetischen lokalen ClawHub-Fixture-Server.
- Plugin-Update-Unchanged-Smoke-Test: `pnpm test:docker:plugin-update` (Skript: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- Config-Reload-Metadaten-Smoke-Test: `pnpm test:docker:config-reload` (Skript: `scripts/e2e/config-reload-source-docker.sh`)
- Gebündelte Plugin-Runtime-Abhängigkeiten: `pnpm test:docker:bundled-channel-deps` baut standardmäßig ein kleines Docker-Runner-Image, baut und packt OpenClaw einmal auf dem Host und mountet diesen Tarball dann in jedes Linux-Installationsszenario. Verwenden Sie das Image mit `OPENCLAW_SKIP_DOCKER_BUILD=1` erneut, überspringen Sie den Host-Rebuild nach einem frischen lokalen Build mit `OPENCLAW_BUNDLED_CHANNEL_HOST_BUILD=0`, oder verweisen Sie mit `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz` auf einen vorhandenen Tarball. Das vollständige Docker-Aggregat und die gebündelten Release-Path-Channel-Chunks pre-packen diesen Tarball einmal und sharden dann gebündelte Kanalprüfungen in unabhängige Lanes, einschließlich separater Update-Lanes für Telegram, Discord, Slack, Feishu, memory-lancedb und ACPX. Release-Chunks teilen Kanal-Smoke-Tests, Update-Ziele und Setup-/Runtime-Verträge in `bundled-channels-core`, `bundled-channels-update-a`, `bundled-channels-update-b` und `bundled-channels-contracts` auf; der aggregierte `bundled-channels`-Chunk bleibt für manuelle erneute Läufe verfügbar. Der Release-Workflow teilt außerdem Provider-Installer-Chunks und gebündelte Plugin-Install-/Uninstall-Chunks auf; die Legacy-Chunks `package-update`, `plugins-runtime` und `plugins-integrations` bleiben aggregierte Aliasse für manuelle erneute Läufe. Verwenden Sie `OPENCLAW_BUNDLED_CHANNELS=telegram,slack`, um die Kanalmatrix beim direkten Ausführen der gebündelten Lane einzugrenzen, oder `OPENCLAW_BUNDLED_CHANNEL_UPDATE_TARGETS=telegram,acpx`, um das Update-Szenario einzugrenzen. Docker-Läufe pro Szenario verwenden standardmäßig `OPENCLAW_BUNDLED_CHANNEL_DOCKER_RUN_TIMEOUT=900s`; das Multi-Target-Update-Szenario verwendet standardmäßig `OPENCLAW_BUNDLED_CHANNEL_UPDATE_DOCKER_RUN_TIMEOUT=2400s`. Die Lane verifiziert außerdem, dass `channels.<id>.enabled=false` und `plugins.entries.<id>.enabled=false` die Doctor-/Runtime-Abhängigkeitsreparatur unterdrücken.
- Grenzen Sie gebündelte Plugin-Runtime-Abhängigkeiten während der Iteration ein, indem Sie nicht zusammenhängende Szenarien deaktivieren, zum Beispiel:
  `OPENCLAW_BUNDLED_CHANNEL_SCENARIOS=0 OPENCLAW_BUNDLED_CHANNEL_UPDATE_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_ROOT_OWNED_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_SETUP_ENTRY_SCENARIO=0 pnpm test:docker:bundled-channel-deps`.

So bauen Sie das gemeinsam genutzte funktionale Image manuell vor und verwenden es erneut:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

Suite-spezifische Image-Overrides wie `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE` haben weiterhin Vorrang, wenn sie gesetzt sind. Wenn `OPENCLAW_SKIP_DOCKER_BUILD=1` auf ein entferntes gemeinsam genutztes Image zeigt, ziehen die Skripte es, falls es nicht bereits lokal vorhanden ist. Die QR- und Installer-Docker-Tests behalten ihre eigenen Dockerfiles, weil sie Package-/Installationsverhalten statt der gemeinsam genutzten gebauten App-Runtime validieren.

Die Live-Model-Docker-Runner binden außerdem den aktuellen Checkout schreibgeschützt ein und
stagen ihn in ein temporäres Arbeitsverzeichnis innerhalb des Containers. Dadurch bleibt das Runtime-
Image schlank, während Vitest dennoch gegen Ihre exakte lokale Source/Config ausgeführt wird.
Der Staging-Schritt überspringt große nur lokal relevante Caches und App-Build-Ausgaben wie
`.pnpm-store`, `.worktrees`, `__openclaw_vitest__` sowie app-lokale `.build`- oder
Gradle-Ausgabeverzeichnisse, damit Docker-Live-Läufe nicht minutenlang mit dem Kopieren
maschinenspezifischer Artefakte verbringen.
Sie setzen außerdem `OPENCLAW_SKIP_CHANNELS=1`, damit Gateway-Live-Probes keine
echten Telegram-/Discord-/usw.-Kanal-Worker im Container starten.
`test:docker:live-models` führt weiterhin `pnpm test:live` aus, leiten Sie daher auch
`OPENCLAW_LIVE_GATEWAY_*` durch, wenn Sie Gateway-
Live-Abdeckung aus dieser Docker-Lane eingrenzen oder ausschließen müssen.
`test:docker:openwebui` ist ein höherwertiger Kompatibilitäts-Smoke-Test: Er startet einen
OpenClaw-Gateway-Container mit aktivierten OpenAI-kompatiblen HTTP-Endpunkten,
startet einen gepinnten Open WebUI-Container gegen dieses Gateway, meldet sich über
Open WebUI an, verifiziert, dass `/api/models` `openclaw/default` exponiert, und sendet dann eine
echte Chat-Anfrage über den `/api/chat/completions`-Proxy von Open WebUI.
Der erste Lauf kann deutlich langsamer sein, weil Docker möglicherweise das
Open WebUI-Image ziehen muss und Open WebUI seine eigene Kaltstart-Einrichtung abschließen muss.
Diese Lane erwartet einen nutzbaren Live-Modellschlüssel, und `OPENCLAW_PROFILE_FILE`
(standardmäßig `~/.profile`) ist der primäre Weg, ihn in dockerisierten Läufen bereitzustellen.
Erfolgreiche Läufe geben eine kleine JSON-Nutzlast wie `{ "ok": true, "model":
"openclaw/default", ... }` aus.
`test:docker:mcp-channels` ist absichtlich deterministisch und benötigt kein
echtes Telegram-, Discord- oder iMessage-Konto. Es startet einen vorbereiteten Gateway-
Container, startet einen zweiten Container, der `openclaw mcp serve` erzeugt, und
verifiziert dann geroutete Konversationserkennung, Transkript-Lesevorgänge, Anhangsmetadaten,
Verhalten der Live-Event-Queue, ausgehendes Send-Routing sowie Claude-artige Kanal- und
Berechtigungsbenachrichtigungen über die echte stdio-MCP-Bridge. Die Benachrichtigungsprüfung
inspiziert die rohen stdio-MCP-Frames direkt, sodass der Smoke-Test validiert, was die
Bridge tatsächlich ausgibt, nicht nur das, was ein bestimmtes Client-SDK zufällig verfügbar macht.
`test:docker:pi-bundle-mcp-tools` ist deterministisch und benötigt keinen Live-
Modellschlüssel. Es baut das Repo-Docker-Image, startet einen echten stdio-MCP-Probe-Server
innerhalb des Containers, materialisiert diesen Server über die eingebettete Pi-Bundle-
MCP-Runtime, führt das Tool aus und verifiziert dann, dass `coding` und `messaging`
`bundle-mcp`-Tools beibehalten, während `minimal` und `tools.deny: ["bundle-mcp"]` sie filtern.
`test:docker:cron-mcp-cleanup` ist deterministisch und benötigt keinen Live-Modell-
schlüssel. Es startet einen vorbereiteten Gateway mit einem echten stdio-MCP-Probe-Server, führt einen
isolierten Cron-Turn und einen `/subagents spawn`-One-Shot-Kind-Turn aus und verifiziert dann,
dass der MCP-Kindprozess nach jedem Lauf beendet wird.

Manueller ACP-Smoke-Test für Threads in natürlicher Sprache (nicht CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Behalten Sie dieses Skript für Regressions-/Debug-Workflows. Es kann erneut für die Validierung des ACP-Thread-Routings benötigt werden, löschen Sie es daher nicht.

Nützliche Umgebungsvariablen:

- `OPENCLAW_CONFIG_DIR=...` (Standard: `~/.openclaw`) wird nach `/home/node/.openclaw` gemountet
- `OPENCLAW_WORKSPACE_DIR=...` (Standard: `~/.openclaw/workspace`) wird nach `/home/node/.openclaw/workspace` gemountet
- `OPENCLAW_PROFILE_FILE=...` (Standard: `~/.profile`) wird nach `/home/node/.profile` gemountet und vor dem Ausführen der Tests eingelesen
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1`, um nur Umgebungsvariablen zu prüfen, die aus `OPENCLAW_PROFILE_FILE` eingelesen wurden, mit temporären Konfigurations-/Workspace-Verzeichnissen und ohne externe CLI-Auth-Mounts
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (Standard: `~/.cache/openclaw/docker-cli-tools`) wird nach `/home/node/.npm-global` für zwischengespeicherte CLI-Installationen in Docker gemountet
- Externe CLI-Auth-Verzeichnisse/-Dateien unter `$HOME` werden schreibgeschützt unter `/host-auth...` gemountet und dann vor Testbeginn nach `/home/node/...` kopiert
  - Standardverzeichnisse: `.minimax`
  - Standarddateien: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - Eingeschränkte Provider-Läufe mounten nur die benötigten Verzeichnisse/Dateien, die aus `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS` abgeleitet werden
  - Manuell überschreiben mit `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none` oder einer durch Kommas getrennten Liste wie `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...`, um den Lauf einzugrenzen
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...`, um Provider im Container zu filtern
- `OPENCLAW_SKIP_DOCKER_BUILD=1`, um ein vorhandenes Image `openclaw:local-live` für erneute Läufe wiederzuverwenden, die keinen Neubau benötigen
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, um sicherzustellen, dass Anmeldedaten aus dem Profilspeicher stammen (nicht aus der Umgebung)
- `OPENCLAW_OPENWEBUI_MODEL=...`, um das vom Gateway für den Open-WebUI-Smoke bereitgestellte Modell auszuwählen
- `OPENCLAW_OPENWEBUI_PROMPT=...`, um den vom Open-WebUI-Smoke verwendeten Nonce-Prüf-Prompt zu überschreiben
- `OPENWEBUI_IMAGE=...`, um den angepinnten Open-WebUI-Image-Tag zu überschreiben

## Docs-Plausibilitätsprüfung

Führen Sie nach Dokumentationsänderungen Dokumentationsprüfungen aus: `pnpm check:docs`.
Führen Sie die vollständige Mintlify-Anker-Validierung aus, wenn Sie auch Prüfungen von Überschriften innerhalb der Seite benötigen: `pnpm docs:check-links:anchors`.

## Offline-Regression (CI-sicher)

Dies sind Regressionen der „echten Pipeline“ ohne echte Provider:

- Gateway-Tool-Aufruf (Mock-OpenAI, echter Gateway + Agentenschleife): `src/gateway/gateway.test.ts` (Fall: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Gateway-Assistent (WS `wizard.start`/`wizard.next`, schreibt Konfiguration + Auth erzwungen): `src/gateway/gateway.test.ts` (Fall: "runs wizard over ws and writes auth token config")

## Agent-Zuverlässigkeits-Evals (Skills)

Wir haben bereits einige CI-sichere Tests, die sich wie „Agent-Zuverlässigkeits-Evals“ verhalten:

- Mock-Tool-Aufruf über den echten Gateway + Agentenschleife (`src/gateway/gateway.test.ts`).
- End-to-End-Assistentenflüsse, die Sitzungsverdrahtung und Konfigurationseffekte validieren (`src/gateway/gateway.test.ts`).

Was für Skills noch fehlt (siehe [Skills](/de/tools/skills)):

- **Entscheidungsfindung:** Wenn Skills im Prompt aufgeführt sind, wählt der Agent die richtige Skill (oder vermeidet irrelevante)?
- **Compliance:** Liest der Agent `SKILL.md` vor der Nutzung und befolgt die erforderlichen Schritte/Argumente?
- **Workflow-Verträge:** Mehrstufige Szenarien, die Tool-Reihenfolge, Übernahme des Sitzungsverlaufs und Sandbox-Grenzen prüfen.

Künftige Evals sollten zuerst deterministisch bleiben:

- Ein Szenario-Runner mit Mock-Providern, um Tool-Aufrufe + Reihenfolge, Skill-Datei-Lesevorgänge und Sitzungsverdrahtung zu prüfen.
- Eine kleine Suite von Skill-fokussierten Szenarien (verwenden vs. vermeiden, Gating, Prompt-Injection).
- Optionale Live-Evals (Opt-in, über Umgebungsvariablen gesteuert) erst, nachdem die CI-sichere Suite vorhanden ist.

## Vertragstests (Plugin- und Kanalform)

Vertragstests prüfen, ob jedes registrierte Plugin und jeder Kanal seinem
Schnittstellenvertrag entspricht. Sie iterieren über alle entdeckten Plugins und führen eine Suite von
Form- und Verhaltensassertionen aus. Die standardmäßige `pnpm test`-Unit-Lane überspringt diese gemeinsamen Seam- und Smoke-Dateien absichtlich; führen Sie die Vertragsbefehle ausdrücklich aus,
wenn Sie gemeinsame Kanal- oder Provider-Oberflächen berühren.

### Befehle

- Alle Verträge: `pnpm test:contracts`
- Nur Kanalverträge: `pnpm test:contracts:channels`
- Nur Provider-Verträge: `pnpm test:contracts:plugins`

### Kanalverträge

Befinden sich in `src/channels/plugins/contracts/*.contract.test.ts`:

- **plugin** - Grundlegende Plugin-Form (ID, Name, Fähigkeiten)
- **setup** - Vertrag für den Einrichtungsassistenten
- **session-binding** - Verhalten der Sitzungsbindung
- **outbound-payload** - Struktur der Nachrichten-Payload
- **inbound** - Verarbeitung eingehender Nachrichten
- **actions** - Kanal-Aktionshandler
- **threading** - Thread-ID-Verarbeitung
- **directory** - Verzeichnis-/Roster-API
- **group-policy** - Durchsetzung von Gruppenrichtlinien

### Provider-Statusverträge

Befinden sich in `src/plugins/contracts/*.contract.test.ts`.

- **status** - Kanalstatus-Prüfungen
- **registry** - Form der Plugin-Registry

### Provider-Verträge

Befinden sich in `src/plugins/contracts/*.contract.test.ts`:

- **auth** - Authentifizierungsfluss-Vertrag
- **auth-choice** - Authentifizierungsauswahl
- **catalog** - Modellkatalog-API
- **discovery** - Plugin-Erkennung
- **loader** - Plugin-Laden
- **runtime** - Provider-Laufzeit
- **shape** - Plugin-Form/-Schnittstelle
- **wizard** - Einrichtungsassistent

### Wann ausführen

- Nach dem Ändern von plugin-sdk-Exporten oder Subpfaden
- Nach dem Hinzufügen oder Ändern eines Kanal- oder Provider-Plugins
- Nach dem Refactoring der Plugin-Registrierung oder -Erkennung

Vertragstests laufen in CI und erfordern keine echten API-Schlüssel.

## Regressionen hinzufügen (Anleitung)

Wenn Sie ein Provider-/Modellproblem beheben, das live entdeckt wurde:

- Fügen Sie nach Möglichkeit eine CI-sichere Regression hinzu (Mock-/Stub-Provider oder erfassen Sie die exakte Transformation der Anfrageform)
- Wenn es inhärent nur live testbar ist (Rate Limits, Auth-Richtlinien), halten Sie den Live-Test eng begrenzt und per Umgebungsvariablen als Opt-in
- Zielen Sie bevorzugt auf die kleinste Schicht, die den Fehler abfängt:
  - Fehler bei Provider-Anfragekonvertierung/-Replay → direkter Modelltest
  - Fehler in Gateway-Sitzung/-Verlauf/-Tool-Pipeline → Gateway-Live-Smoke oder CI-sicherer Gateway-Mock-Test
- SecretRef-Traversal-Leitplanke:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` leitet ein gesampeltes Ziel pro SecretRef-Klasse aus Registry-Metadaten (`listSecretTargetRegistryEntries()`) ab und assertiert dann, dass Exec-IDs mit Traversal-Segmenten abgelehnt werden.
  - Wenn Sie eine neue `includeInPlan`-SecretRef-Zielfamilie in `src/secrets/target-registry-data.ts` hinzufügen, aktualisieren Sie `classifyTargetClass` in diesem Test. Der Test schlägt absichtlich bei nicht klassifizierten Ziel-IDs fehl, damit neue Klassen nicht stillschweigend übersprungen werden können.

## Verwandt

- [Live testen](/de/help/testing-live)
- [CI](/de/ci)
