---
read_when:
    - Suche nach Definitionen öffentlicher Release-Kanäle
    - Suche nach Versionsbenennung und Veröffentlichungsrhythmus
summary: Öffentliche Release-Kanäle, Versionsbenennung und Veröffentlichungsrhythmus
title: Release-Richtlinie
x-i18n:
    generated_at: "2026-04-23T06:34:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: 979fd30ec717e107858ff812ef4b46060b9a00a0b5a3c23085d95b8fb81723b8
    source_path: reference/RELEASING.md
    workflow: 15
---

# Release-Richtlinie

OpenClaw hat drei öffentliche Release-Kanäle:

- stable: getaggte Releases, die standardmäßig auf npm `beta` veröffentlichen oder bei ausdrücklicher Anforderung auf npm `latest`
- beta: Prerelease-Tags, die auf npm `beta` veröffentlichen
- dev: der bewegliche Stand von `main`

## Versionsbenennung

- Version für Stable-Releases: `YYYY.M.D`
  - Git-Tag: `vYYYY.M.D`
- Version für Stable-Korrektur-Releases: `YYYY.M.D-N`
  - Git-Tag: `vYYYY.M.D-N`
- Version für Beta-Prereleases: `YYYY.M.D-beta.N`
  - Git-Tag: `vYYYY.M.D-beta.N`
- Monat oder Tag nicht mit führenden Nullen auffüllen
- `latest` bedeutet die aktuell freigegebene stabile npm-Release
- `beta` bedeutet das aktuelle Beta-Installationsziel
- Stable- und Stable-Korrektur-Releases veröffentlichen standardmäßig auf npm `beta`; Release-Operatoren können explizit `latest` als Ziel wählen oder später einen geprüften Beta-Build hochstufen
- Jede stabile OpenClaw-Release liefert das npm-Paket und die macOS-App gemeinsam aus;
  Beta-Releases validieren und veröffentlichen normalerweise zuerst den npm-/Paketpfad, wobei
  das Bauen/Sig­nieren/Notarisieren der Mac-App für Stable reserviert ist, sofern nicht ausdrücklich angefordert

## Veröffentlichungsrhythmus

- Releases gehen zuerst über beta
- Stable folgt erst, nachdem die neueste Beta validiert wurde
- Maintainer schneiden Releases normalerweise aus einem Branch `release/YYYY.M.D`, der
  vom aktuellen `main` erstellt wird, damit Release-Validierung und Fixes neue
  Entwicklung auf `main` nicht blockieren
- Wenn ein Beta-Tag gepusht oder veröffentlicht wurde und einen Fix braucht, schneiden Maintainer
  das nächste Tag `-beta.N`, statt das alte Beta-Tag zu löschen oder neu zu erstellen
- Detailliertes Release-Verfahren, Genehmigungen, Anmeldedaten und Wiederherstellungshinweise sind
  nur für Maintainer

## Release-Preflight

- Führen Sie `pnpm check:test-types` vor dem Release-Preflight aus, damit Test-TypeScript
  außerhalb des schnelleren lokalen Gates `pnpm check` weiterhin abgedeckt bleibt
- Führen Sie `pnpm check:architecture` vor dem Release-Preflight aus, damit die breiteren Prüfungen zu Import-
  Zyklen und Architekturgrenzen außerhalb des schnelleren lokalen Gates grün sind
- Führen Sie `pnpm build && pnpm ui:build` vor `pnpm release:check` aus, damit die erwarteten
  Release-Artefakte `dist/*` und das Bundle der Control UI für den Pack-
  Validierungsschritt vorhanden sind
- Führen Sie `pnpm release:check` vor jeder getaggten Release aus
- Release-Checks laufen jetzt in einem separaten manuellen Workflow:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` führt vor der Release-Genehmigung außerdem das QA-Lab-Mock-Parity-Gate sowie die Live-
  QA-Lanes für Matrix und Telegram aus. Die Live-Lanes verwenden die
  Umgebung `qa-live-shared`; Telegram nutzt außerdem Credential-Leases von Convex CI.
- Laufzeitvalidierung für Installation und Upgrade über mehrere Betriebssysteme wird aus dem
  privaten Caller-Workflow
  `openclaw/releases-private/.github/workflows/openclaw-cross-os-release-checks.yml`
  ausgelöst, der den wiederverwendbaren öffentlichen Workflow
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
  aufruft
- Diese Aufteilung ist absichtlich so gewählt: Der echte npm-Release-Pfad soll kurz,
  deterministisch und artefaktfokussiert bleiben, während langsamere Live-Checks in ihrer
  eigenen Lane bleiben, damit sie die Veröffentlichung nicht verzögern oder blockieren
- Release-Checks müssen aus der Workflow-Referenz von `main` oder aus einer
  Workflow-Referenz `release/YYYY.M.D` ausgelöst werden, damit Workflow-Logik und Secrets
  kontrolliert bleiben
- Dieser Workflow akzeptiert entweder ein vorhandenes Release-Tag oder den aktuellen vollständigen
  40-stelligen Commit-SHA des Workflow-Branches
- Im Commit-SHA-Modus akzeptiert er nur den aktuellen HEAD des Workflow-Branches; verwenden Sie
  für ältere Release-Commits ein Release-Tag
- Das Validierungs-Only-Preflight von `OpenClaw NPM Release` akzeptiert ebenfalls den aktuellen
  vollständigen 40-stelligen Commit-SHA des Workflow-Branches, ohne ein gepushtes Tag zu verlangen
- Dieser SHA-Pfad dient nur der Validierung und kann nicht in eine echte Veröffentlichung hochgestuft werden
- Im SHA-Modus synthetisiert der Workflow `v<package.json version>` nur für die Prüfung der Paketmetadaten; für echte Veröffentlichung ist weiterhin ein echtes Release-Tag erforderlich
- Beide Workflows halten den echten Veröffentlichungs- und Hochstufungspfad auf GitHub-gehosteten
  Runnern, während der nicht mutierende Validierungspfad die größeren
  Linux-Runner von Blacksmith verwenden kann
- Dieser Workflow führt
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  unter Verwendung der Workflow-Secrets `OPENAI_API_KEY` und `ANTHROPIC_API_KEY` aus
- Das npm-Release-Preflight wartet nicht mehr auf die separate Lane für Release-Checks
- Führen Sie `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  (oder das passende Beta-/Korrektur-Tag) vor der Genehmigung aus
- Führen Sie nach der npm-Veröffentlichung
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  (oder die passende Beta-/Korrekturversion) aus, um den veröffentlichten Registry-
  Installationspfad in einem frischen temporären Prefix zu verifizieren
- Die Release-Automatisierung für Maintainer verwendet jetzt Preflight-dann-Hochstufung:
  - echte npm-Veröffentlichung muss einen erfolgreichen npm-`preflight_run_id` bestehen
  - die echte npm-Veröffentlichung muss aus demselben Branch `main` oder
    `release/YYYY.M.D` ausgelöst werden wie der erfolgreiche Preflight-Lauf
  - stabile npm-Releases verwenden standardmäßig `beta`
  - stabile npm-Veröffentlichung kann explizit `latest` als Ziel wählen per Workflow-Input
  - tokenbasierte Mutation von npm-Dist-Tags liegt jetzt in
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    aus Sicherheitsgründen, weil `npm dist-tag add` weiterhin `NPM_TOKEN` benötigt, während das
    öffentliche Repo OIDC-only Publish beibehält
  - öffentliches `macOS Release` dient nur der Validierung
  - echte private Mac-Veröffentlichung muss erfolgreiches privates Mac-
    `preflight_run_id` und `validate_run_id` bestehen
  - die echten Veröffentlichungspfade stufen vorbereitete Artefakte hoch, statt sie erneut zu bauen
- Für Stable-Korrektur-Releases wie `YYYY.M.D-N` prüft der Verifier nach der Veröffentlichung
  außerdem denselben Upgrade-Pfad mit temporärem Prefix von `YYYY.M.D` auf `YYYY.M.D-N`,
  damit Release-Korrekturen nicht stillschweigend ältere globale Installationen auf der
  Basis-Stable-Payload belassen
- Das npm-Release-Preflight schlägt fail-closed fehl, wenn das Tarball nicht sowohl
  `dist/control-ui/index.html` als auch eine nicht leere Payload `dist/control-ui/assets/` enthält,
  damit wir nicht erneut ein leeres Browser-Dashboard ausliefern
- `pnpm test:install:smoke` erzwingt außerdem das Budget für `unpackedSize` des npm-Pack auf dem
  Kandidaten-Tarball für Updates, sodass Installer-E2E versehentliches Pack-Bloat
  vor dem Veröffentlichungspfad erkennt
- Wenn die Release-Arbeit die CI-Planung, Extension-Timing-Manifeste oder
  Extension-Testmatrizen berührt hat, regenerieren und prüfen Sie vor der Genehmigung die planer-eigenen
  Workflow-Matrix-Ausgaben `checks-node-extensions` aus `.github/workflows/ci.yml`,
  damit Release Notes kein veraltetes CI-Layout beschreiben
- Die Bereitschaft für stabile macOS-Releases umfasst auch die Updater-Oberflächen:
  - Die GitHub-Release muss am Ende die paketierten Dateien `.zip`, `.dmg` und `.dSYM.zip` enthalten
  - `appcast.xml` auf `main` muss nach der Veröffentlichung auf das neue stabile ZIP zeigen
  - Die paketierte App muss eine Bundle-ID ohne Debug, eine nicht leere Sparkle-Feed-
    URL und eine `CFBundleVersion` auf oder über dem kanonischen Sparkle-Build-Floor
    für diese Release-Version beibehalten

## Eingaben des NPM-Workflows

`OpenClaw NPM Release` akzeptiert diese operatorgesteuerten Eingaben:

- `tag`: erforderliches Release-Tag wie `v2026.4.2`, `v2026.4.2-1` oder
  `v2026.4.2-beta.1`; wenn `preflight_only=true`, darf dies für ein reines Validierungs-Preflight auch der aktuelle
  vollständige 40-stellige Commit-SHA des Workflow-Branches sein
- `preflight_only`: `true` für nur Validierung/Build/Paket, `false` für den
  echten Veröffentlichungspfad
- `preflight_run_id`: im echten Veröffentlichungspfad erforderlich, damit der Workflow
  das vorbereitete Tarball aus dem erfolgreichen Preflight-Lauf wiederverwendet
- `npm_dist_tag`: npm-Ziel-Tag für den Veröffentlichungspfad; Standard ist `beta`

`OpenClaw Release Checks` akzeptiert diese operatorgesteuerten Eingaben:

- `ref`: vorhandenes Release-Tag oder der aktuelle vollständige 40-stellige Commit-
  SHA von `main`, der validiert werden soll, wenn aus `main` ausgelöst; von einem
  Release-Branch aus verwenden Sie ein vorhandenes Release-Tag oder den aktuellen vollständigen 40-stelligen Commit-
  SHA des Release-Branches

Regeln:

- Stable- und Korrektur-Tags können entweder auf `beta` oder `latest` veröffentlichen
- Beta-Prerelease-Tags dürfen nur auf `beta` veröffentlichen
- Für `OpenClaw NPM Release` ist vollständiger Commit-SHA als Eingabe nur erlaubt, wenn
  `preflight_only=true`
- `OpenClaw Release Checks` dient immer nur der Validierung und akzeptiert ebenfalls den
  aktuellen Commit-SHA des Workflow-Branches
- Der Commit-SHA-Modus der Release-Checks erfordert außerdem den aktuellen HEAD des Workflow-Branches
- Der echte Veröffentlichungspfad muss dasselbe `npm_dist_tag` verwenden, das auch beim Preflight verwendet wurde;
  der Workflow verifiziert diese Metadaten, bevor die Veröffentlichung fortgesetzt wird

## Sequenz für stabile npm-Releases

Beim Schneiden einer stabilen npm-Release:

1. Führen Sie `OpenClaw NPM Release` mit `preflight_only=true` aus
   - Bevor ein Tag existiert, können Sie den aktuellen vollständigen Commit
     des Workflow-Branches für einen Dry Run des Preflight-Workflows verwenden, der nur validiert
2. Wählen Sie `npm_dist_tag=beta` für den normalen beta-first-Flow oder `latest` nur dann,
   wenn Sie absichtlich direkt stabil veröffentlichen möchten
3. Führen Sie `OpenClaw Release Checks` separat mit demselben Tag oder dem
   vollständigen aktuellen Commit-SHA des Workflow-Branches aus, wenn Sie Live-Abdeckung für Prompt-Cache,
   QA-Lab-Parität, Matrix und Telegram möchten
   - Dies ist absichtlich getrennt, damit Live-Abdeckung verfügbar bleibt, ohne
     lang laufende oder flaky Checks wieder an den Veröffentlichungsworkflow zu koppeln
4. Speichern Sie die erfolgreiche `preflight_run_id`
5. Führen Sie `OpenClaw NPM Release` erneut mit `preflight_only=false`, demselben
   `tag`, demselben `npm_dist_tag` und der gespeicherten `preflight_run_id` aus
6. Wenn die Release auf `beta` gelandet ist, verwenden Sie den privaten Workflow
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`,
   um diese stabile Version von `beta` auf `latest` hochzustufen
7. Wenn die Release absichtlich direkt auf `latest` veröffentlicht wurde und `beta`
   sofort demselben stabilen Build folgen soll, verwenden Sie denselben privaten
   Workflow, um beide Dist-Tags auf die stabile Version zu setzen, oder lassen Sie die geplante
   Self-Healing-Synchronisierung `beta` später verschieben

Die Mutation von Dist-Tags liegt aus Sicherheitsgründen im privaten Repo, weil sie weiterhin
`NPM_TOKEN` benötigt, während das öffentliche Repo OIDC-only Publish beibehält.

Dadurch bleiben sowohl der direkte Veröffentlichungspfad als auch der beta-first-Hochstufungspfad
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
