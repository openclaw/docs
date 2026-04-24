---
read_when:
    - Suche nach öffentlichen Definitionen der Release-Channels
    - Suche nach Versionsbenennung und Taktung
summary: Öffentliche Release-Channels, Versionsbenennung und Taktung
title: Release-Richtlinie
x-i18n:
    generated_at: "2026-04-24T09:00:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2cba6cd02c6fb2380abd8d46e10567af2f96c7c6e45236689d69289348b829ce
    source_path: reference/RELEASING.md
    workflow: 15
---

OpenClaw hat drei öffentliche Release-Lanes:

- stable: getaggte Releases, die standardmäßig auf npm `beta` veröffentlichen oder bei expliziter Anforderung auf npm `latest`
- beta: Prerelease-Tags, die auf npm `beta` veröffentlichen
- dev: der fortlaufende Head von `main`

## Versionsbenennung

- Stable-Release-Version: `YYYY.M.D`
  - Git-Tag: `vYYYY.M.D`
- Stable-Korrektur-Release-Version: `YYYY.M.D-N`
  - Git-Tag: `vYYYY.M.D-N`
- Beta-Prerelease-Version: `YYYY.M.D-beta.N`
  - Git-Tag: `vYYYY.M.D-beta.N`
- Monat oder Tag nicht mit führenden Nullen auffüllen
- `latest` bedeutet das aktuell promotete stabile npm-Release
- `beta` bedeutet das aktuelle Beta-Installationsziel
- Stable- und Stable-Korrektur-Releases veröffentlichen standardmäßig auf npm `beta`; Release-Operatoren können explizit `latest` als Ziel setzen oder später einen geprüften Beta-Build promoten
- Jedes stabile OpenClaw-Release liefert das npm-Paket und die macOS-App gemeinsam aus;
  Beta-Releases validieren und veröffentlichen normalerweise zuerst den npm-/Paketpfad, während
  Build/Signieren/Notarisieren der Mac-App Stable vorbehalten ist, sofern nicht ausdrücklich anders angefordert

## Release-Taktung

- Releases laufen beta-first
- Stable folgt erst, nachdem die neueste Beta validiert wurde
- Maintainer schneiden Releases normalerweise aus einem Branch `release/YYYY.M.D`, der
  von `main` erstellt wird, damit Release-Validierung und Fixes neue
  Entwicklung auf `main` nicht blockieren
- Wenn ein Beta-Tag gepusht oder veröffentlicht wurde und einen Fix benötigt, schneiden Maintainer
  das nächste Tag `-beta.N`, statt das alte Beta-Tag zu löschen oder neu zu erstellen
- Detaillierte Release-Prozedur, Genehmigungen, Anmeldedaten und Recovery-Hinweise sind
  nur für Maintainer bestimmt

## Release-Preflight

- Führen Sie vor dem Release-Preflight `pnpm check:test-types` aus, damit Test-TypeScript
  auch außerhalb des schnelleren lokalen Gates `pnpm check` abgedeckt bleibt
- Führen Sie vor dem Release-Preflight `pnpm check:architecture` aus, damit die umfassenderen Import-
  Zyklus- und Architekturgrenzen-Prüfungen auch außerhalb des schnelleren lokalen Gates grün sind
- Führen Sie vor `pnpm release:check` `pnpm build && pnpm ui:build` aus, damit die erwarteten
  `dist/*`-Release-Artefakte und das Bundle der Control UI für den Pack-
  Validierungsschritt vorhanden sind
- Führen Sie vor jedem getaggten Release `pnpm release:check` aus
- Release-Prüfungen laufen jetzt in einem separaten manuellen Workflow:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` führt vor der Release-Freigabe auch das QA-Lab-Mock-Parity-Gate sowie die Live-
  QA-Lanes für Matrix und Telegram aus. Die Live-Lanes verwenden die Umgebung
  `qa-live-shared`; Telegram verwendet außerdem Convex-CI-Credential-Leases.
- Laufzeitvalidierung für Installation und Upgrade über mehrere Betriebssysteme hinweg wird aus dem
  privaten Caller-Workflow
  `openclaw/releases-private/.github/workflows/openclaw-cross-os-release-checks.yml`
  ausgelöst, der den wiederverwendbaren öffentlichen Workflow
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
  aufruft
- Diese Aufteilung ist beabsichtigt: Der echte npm-Release-Pfad soll kurz,
  deterministisch und artefaktfokussiert bleiben, während langsamere Live-Prüfungen in ihrer
  eigenen Lane bleiben, damit sie die Veröffentlichung nicht verzögern oder blockieren
- Release-Prüfungen müssen aus der Workflow-Ref von `main` oder aus einer
  Workflow-Ref `release/YYYY.M.D` ausgelöst werden, damit Workflow-Logik und Secrets kontrolliert bleiben
- Dieser Workflow akzeptiert entweder ein bestehendes Release-Tag oder den aktuellen vollständigen
  40-stelligen Workflow-Branch-Commit-SHA
- Im Commit-SHA-Modus akzeptiert er nur den aktuellen HEAD des Workflow-Branch; verwenden Sie ein
  Release-Tag für ältere Release-Commits
- Das nur zur Validierung dienende Preflight von `OpenClaw NPM Release` akzeptiert ebenfalls den aktuellen
  vollständigen 40-stelligen Workflow-Branch-Commit-SHA, ohne ein gepushtes Tag zu erfordern
- Dieser SHA-Pfad dient nur der Validierung und kann nicht zu einer echten Veröffentlichung promotet werden
- Im SHA-Modus erzeugt der Workflow `v<package.json version>` nur für die Prüfung der
  Paketmetadaten synthetisch; für die echte Veröffentlichung ist weiterhin ein echtes Release-Tag erforderlich
- Beide Workflows behalten den echten Veröffentlichungs- und Promotion-Pfad auf GitHub-gehosteten
  Runnern, während der nicht mutierende Validierungspfad die größeren
  Blacksmith-Linux-Runner verwenden kann
- Dieser Workflow führt
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  mit den Workflow-Secrets `OPENAI_API_KEY` und `ANTHROPIC_API_KEY` aus
- Das npm-Release-Preflight wartet nicht mehr auf die separate Lane für Release-Prüfungen
- Führen Sie vor der Freigabe
  `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  aus (oder das passende Beta-/Korrektur-Tag)
- Führen Sie nach der npm-Veröffentlichung
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  aus (oder die passende Beta-/Korrektur-Version), um den veröffentlichten Registry-
  Installationspfad in einem frischen temporären Prefix zu verifizieren
- Führen Sie nach einer Beta-Veröffentlichung `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`
  aus, um Onboarding des installierten Pakets, Telegram-Einrichtung und echtes Telegram-E2E
  gegen das veröffentlichte npm-Paket mit dem gemeinsam genutzten geleasten Telegram-Credential-
  Pool zu verifizieren. Lokale einmalige Maintainer-Ausführungen können die Convex-Variablen weglassen
  und die drei Credentials aus den Umgebungsvariablen `OPENCLAW_QA_TELEGRAM_*` direkt übergeben.
- Maintainer können dieselbe Prüfung nach der Veröffentlichung auch über GitHub Actions mit dem
  manuellen Workflow `NPM Telegram Beta E2E` ausführen. Er ist absichtlich nur manuell und läuft
  nicht bei jedem Merge.
- Die Release-Automatisierung für Maintainer verwendet jetzt Preflight-then-Promote:
  - eine echte npm-Veröffentlichung muss einen erfolgreichen npm-`preflight_run_id` bestehen
  - die echte npm-Veröffentlichung muss aus demselben Branch `main` oder
    `release/YYYY.M.D` ausgelöst werden wie der erfolgreiche Preflight-Run
  - stabile npm-Releases zielen standardmäßig auf `beta`
  - stabile npm-Veröffentlichungen können per Workflow-Eingabe explizit `latest` als Ziel setzen
  - tokenbasierte Mutation von npm-dist-tags liegt jetzt in
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    aus Sicherheitsgründen, weil `npm dist-tag add` weiterhin `NPM_TOKEN` benötigt, während das
    öffentliche Repo nur OIDC-basierte Veröffentlichung beibehält
  - öffentliches `macOS Release` dient nur der Validierung
  - eine echte private Mac-Veröffentlichung muss erfolgreiches privates Mac-
    `preflight_run_id` und `validate_run_id` bestehen
  - die echten Veröffentlichungspfade promoten vorbereitete Artefakte, statt sie erneut
    zu bauen
- Bei Stable-Korrektur-Releases wie `YYYY.M.D-N` prüft der Verifier nach der Veröffentlichung
  zusätzlich denselben Upgrade-Pfad mit temporärem Prefix von `YYYY.M.D` auf `YYYY.M.D-N`,
  damit Release-Korrekturen nicht unbemerkt ältere globale Installationen auf dem
  Stable-Basis-Payload belassen
- Das npm-Release-Preflight schlägt fail-closed fehl, wenn das Tarball nicht sowohl
  `dist/control-ui/index.html` als auch eine nicht leere Payload unter `dist/control-ui/assets/` enthält,
  damit wir nicht erneut ein leeres Browser-Dashboard ausliefern
- Die Verifikation nach der Veröffentlichung prüft außerdem, dass die veröffentlichte Registry-
  Installation nicht leere Runtime-Abhängigkeiten gebündelter Plugins unter dem Root-
  Layout `dist/*` enthält. Ein Release, das mit fehlenden oder leeren
  Payloads für Abhängigkeiten gebündelter Plugins ausgeliefert wird, lässt den Postpublish-Verifier fehlschlagen und kann nicht zu `latest` promotet werden.
- `pnpm test:install:smoke` erzwingt außerdem das `unpackedSize`-Budget des npm-Packs auf
  dem Kandidaten-Tarball für das Update, damit das Installer-E2E versehentliche Pack-Aufblähung
  vor dem Release-Veröffentlichungspfad erkennt
- Wenn die Release-Arbeit CI-Planung, Timing-Manifeste für Extensions oder
  Testmatrizen für Extensions berührt hat, regenerieren und prüfen Sie vor der Freigabe die planner-eigenen
  Workflow-Matrix-Ausgaben `checks-node-extensions` aus `.github/workflows/ci.yml`,
  damit Release-Notes kein veraltetes CI-Layout beschreiben
- Die Bereitschaft für ein stabiles macOS-Release umfasst auch die Updater-Oberflächen:
  - das GitHub-Release muss am Ende die paketierten `.zip`, `.dmg` und `.dSYM.zip` enthalten
  - `appcast.xml` auf `main` muss nach der Veröffentlichung auf die neue stabile ZIP zeigen
  - die paketierte App muss eine nicht zu Debug gehörende Bundle-ID, eine nicht leere Sparkle-Feed-
    URL und eine `CFBundleVersion` mindestens auf dem kanonischen Sparkle-Build-Floor
    für diese Release-Version beibehalten

## NPM-Workflow-Eingaben

`OpenClaw NPM Release` akzeptiert diese operatorgesteuerten Eingaben:

- `tag`: erforderliches Release-Tag wie `v2026.4.2`, `v2026.4.2-1` oder
  `v2026.4.2-beta.1`; wenn `preflight_only=true`, darf es auch der aktuelle
  vollständige 40-stellige Commit-SHA des Workflow-Branch für ein nur validierendes Preflight sein
- `preflight_only`: `true` nur für Validierung/Build/Paket, `false` für den
  echten Veröffentlichungspfad
- `preflight_run_id`: im echten Veröffentlichungspfad erforderlich, damit der Workflow
  das vorbereitete Tarball aus dem erfolgreichen Preflight-Run wiederverwendet
- `npm_dist_tag`: npm-Ziel-Tag für den Veröffentlichungspfad; Standard ist `beta`

`OpenClaw Release Checks` akzeptiert diese operatorgesteuerten Eingaben:

- `ref`: bestehendes Release-Tag oder der aktuelle vollständige 40-stellige `main`-Commit-
  SHA, der validiert werden soll, wenn er von `main` aus ausgelöst wird; von einem
  Release-Branch aus verwenden Sie ein bestehendes Release-Tag oder den aktuellen vollständigen
  40-stelligen Commit-SHA des Release-Branch

Regeln:

- Stable- und Korrektur-Tags dürfen entweder auf `beta` oder `latest` veröffentlichen
- Beta-Prerelease-Tags dürfen nur auf `beta` veröffentlichen
- Für `OpenClaw NPM Release` ist die Eingabe eines vollständigen Commit-SHA nur zulässig, wenn
  `preflight_only=true`
- `OpenClaw Release Checks` dient immer nur der Validierung und akzeptiert ebenfalls den
  aktuellen Commit-SHA des Workflow-Branch
- Im Commit-SHA-Modus erfordern Release-Prüfungen außerdem den aktuellen HEAD des Workflow-Branch
- Der echte Veröffentlichungspfad muss denselben `npm_dist_tag` verwenden, der auch während des Preflight verwendet wurde;
  der Workflow prüft diese Metadaten, bevor die Veröffentlichung fortgesetzt wird

## Ablauf eines stabilen npm-Releases

Beim Schneiden eines stabilen npm-Releases:

1. Führen Sie `OpenClaw NPM Release` mit `preflight_only=true` aus
   - Bevor ein Tag existiert, können Sie den aktuellen vollständigen Commit des Workflow-Branch
     SHA für einen nur validierenden Trockenlauf des Preflight-Workflows verwenden
2. Wählen Sie `npm_dist_tag=beta` für den normalen beta-first-Ablauf oder `latest` nur dann,
   wenn Sie absichtlich eine direkte stabile Veröffentlichung möchten
3. Führen Sie `OpenClaw Release Checks` separat mit demselben Tag oder dem
   vollständigen aktuellen Commit-SHA des Workflow-Branch aus, wenn Sie Live-Prompt-Cache,
   QA-Lab-Parity, Matrix- und Telegram-Abdeckung möchten
   - Dies ist absichtlich getrennt, damit Live-Abdeckung verfügbar bleibt, ohne
     lang laufende oder instabile Prüfungen erneut an den Veröffentlichungsworkflow zu koppeln
4. Speichern Sie die erfolgreiche `preflight_run_id`
5. Führen Sie `OpenClaw NPM Release` erneut mit `preflight_only=false`, demselben
   `tag`, demselben `npm_dist_tag` und der gespeicherten `preflight_run_id` aus
6. Wenn das Release auf `beta` gelandet ist, verwenden Sie den privaten
   Workflow `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`,
   um diese stabile Version von `beta` nach `latest` zu promoten
7. Wenn das Release absichtlich direkt auf `latest` veröffentlicht wurde und `beta`
   unmittelbar demselben Stable-Build folgen soll, verwenden Sie denselben privaten
   Workflow, um beide dist-tags auf die stabile Version zu zeigen, oder lassen Sie später die
   geplante Self-Healing-Synchronisierung `beta` verschieben

Die Mutation von dist-tags liegt aus Sicherheitsgründen im privaten Repo, weil sie weiterhin
`NPM_TOKEN` erfordert, während das öffentliche Repo nur OIDC-basierte Veröffentlichung beibehält.

Damit bleiben sowohl der direkte Veröffentlichungspfad als auch der beta-first-Promotionspfad
dokumentiert und für Operatoren sichtbar.

## Öffentliche Referenzen

- [`.github/workflows/openclaw-npm-release.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-npm-release.yml)
- [`.github/workflows/openclaw-release-checks.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-release-checks.yml)
- [`.github/workflows/openclaw-cross-os-release-checks-reusable.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-cross-os-release-checks-reusable.yml)
- [`scripts/openclaw-npm-release-check.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/openclaw-npm-release-check.ts)
- [`scripts/package-mac-dist.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-dist.sh)
- [`scripts/make_appcast.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/make_appcast.sh)

Maintainer verwenden die privaten Release-Dokumente in
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
als tatsächliches Runbook.

## Verwandt

- [Release channels](/de/install/development-channels)
