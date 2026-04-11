---
read_when:
    - Suchen nach öffentlichen Definitionen der Release-Kanäle
    - Suchen nach Versionsbenennung und Veröffentlichungsrhythmus
summary: Öffentliche Release-Kanäle, Versionsbenennung und Veröffentlichungsrhythmus
title: Release-Richtlinie
x-i18n:
    generated_at: "2026-04-11T02:47:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: ca613d094c93670c012f0b79720fad0d5d85be802f54b0acb7a8f22aca5bde12
    source_path: reference/RELEASING.md
    workflow: 15
---

# Release-Richtlinie

OpenClaw hat drei öffentliche Release-Kanäle:

- stable: getaggte Releases, die standardmäßig auf npm `beta` veröffentlichen oder bei ausdrücklicher Anforderung auf npm `latest`
- beta: Prerelease-Tags, die auf npm `beta` veröffentlichen
- dev: der fortlaufende Head von `main`

## Versionsbenennung

- Version eines Stable-Releases: `YYYY.M.D`
  - Git-Tag: `vYYYY.M.D`
- Version eines Stable-Korrekturreleases: `YYYY.M.D-N`
  - Git-Tag: `vYYYY.M.D-N`
- Version eines Beta-Prereleases: `YYYY.M.D-beta.N`
  - Git-Tag: `vYYYY.M.D-beta.N`
- Monat und Tag nicht mit führenden Nullen auffüllen
- `latest` bedeutet das aktuell freigegebene stabile npm-Release
- `beta` bedeutet das aktuelle Beta-Installationsziel
- Stable- und Stable-Korrekturreleases veröffentlichen standardmäßig auf npm `beta`; Release-Operatoren können explizit `latest` als Ziel festlegen oder später einen validierten Beta-Build hochstufen
- Jedes OpenClaw-Release liefert das npm-Paket und die macOS-App zusammen aus

## Veröffentlichungsrhythmus

- Releases gehen zuerst über beta
- Stable folgt erst, nachdem die neueste Beta validiert wurde
- Detailliertes Release-Verfahren, Freigaben, Anmeldedaten und Hinweise zur Wiederherstellung sind nur für Maintainer bestimmt

## Release-Preflight

- Führen Sie `pnpm build && pnpm ui:build` vor `pnpm release:check` aus, damit die erwarteten
  `dist/*`-Release-Artefakte und das Control-UI-Bundle für den Pack-
  Validierungsschritt vorhanden sind
- Führen Sie `pnpm release:check` vor jedem getaggten Release aus
- Der npm-Preflight für den Main-Branch führt außerdem
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  vor dem Packen des Tarballs aus und verwendet dabei sowohl die Workflow-Secrets
  `OPENAI_API_KEY` als auch `ANTHROPIC_API_KEY`
- Führen Sie vor der Freigabe
  `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  aus (oder das passende Beta-/Korrektur-Tag)
- Führen Sie nach dem npm-Publish
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  aus (oder die passende Beta-/Korrekturversion), um den veröffentlichten Registry-
  Installationspfad in einem frischen temporären Prefix zu verifizieren
- Die Release-Automatisierung für Maintainer verwendet jetzt Preflight-dann-Promote:
  - echtes npm-Publish muss einen erfolgreichen npm-`preflight_run_id` bestehen
  - stabile npm-Releases verwenden standardmäßig `beta`
  - stabiles npm-Publish kann `latest` explizit über Workflow-Eingabe als Ziel verwenden
  - die Hochstufung eines stabilen npm-Releases von `beta` auf `latest` ist weiterhin als expliziter manueller Modus im vertrauenswürdigen Workflow `OpenClaw NPM Release` verfügbar
  - dieser Hochstufungsmodus benötigt weiterhin ein gültiges `NPM_TOKEN` in der Umgebung `npm-release`, da die Verwaltung von npm-`dist-tag` vom Trusted Publishing getrennt ist
  - das öffentliche `macOS Release` dient nur der Validierung
  - echtes privates Mac-Publishing muss erfolgreiche private Mac-
    `preflight_run_id` und `validate_run_id` bestehen
  - die echten Publish-Pfade stufen vorbereitete Artefakte hoch, statt sie erneut zu bauen
- Für Stable-Korrekturreleases wie `YYYY.M.D-N` prüft der Verifier nach dem Publish
  außerdem denselben Upgrade-Pfad im temporären Prefix von `YYYY.M.D` auf `YYYY.M.D-N`,
  damit Release-Korrekturen nicht stillschweigend ältere globale Installationen auf der
  Basis-Stable-Payload belassen können
- Der npm-Release-Preflight schlägt fail-closed fehl, sofern der Tarball nicht sowohl
  `dist/control-ui/index.html` als auch eine nicht leere Payload unter `dist/control-ui/assets/` enthält,
  damit nicht erneut ein leeres Browser-Dashboard ausgeliefert wird
- Wenn die Release-Arbeit die CI-Planung, Timing-Manifeste für Erweiterungen oder
  Testmatrizen für Erweiterungen berührt hat, regenerieren und prüfen Sie vor der Freigabe die vom Planner verwalteten
  Workflow-Matrix-Ausgaben `checks-node-extensions` aus `.github/workflows/ci.yml`,
  damit die Release-Notes kein veraltetes CI-Layout beschreiben
- Die Bereitschaft für ein stabiles macOS-Release umfasst auch die Updater-Oberflächen:
  - Das GitHub-Release muss am Ende die gepackten Dateien `.zip`, `.dmg` und `.dSYM.zip` enthalten
  - `appcast.xml` auf `main` muss nach dem Publish auf die neue stabile ZIP verweisen
  - Die gepackte App muss eine nicht-Debug-Bundle-ID, eine nicht leere Sparkle-Feed-
    URL und eine `CFBundleVersion` beibehalten, die auf oder über der kanonischen Sparkle-Build-Untergrenze
    für diese Release-Version liegt

## Eingaben des npm-Workflows

`OpenClaw NPM Release` akzeptiert diese operatorgesteuerten Eingaben:

- `tag`: erforderliches Release-Tag wie `v2026.4.2`, `v2026.4.2-1` oder
  `v2026.4.2-beta.1`
- `preflight_only`: `true` nur für Validierung/Build/Package, `false` für den
  echten Publish-Pfad
- `preflight_run_id`: erforderlich im echten Publish-Pfad, damit der Workflow den
  vorbereiteten Tarball aus dem erfolgreichen Preflight-Lauf wiederverwendet
- `npm_dist_tag`: npm-Ziel-Tag für den Publish-Pfad; Standard ist `beta`
- `promote_beta_to_latest`: `true`, um das Publish zu überspringen und einen bereits veröffentlichten
  stabilen `beta`-Build auf `latest` zu verschieben

Regeln:

- Stable- und Korrektur-Tags können entweder auf `beta` oder `latest` veröffentlichen
- Beta-Prerelease-Tags dürfen nur auf `beta` veröffentlichen
- Der echte Publish-Pfad muss dasselbe `npm_dist_tag` verwenden, das auch beim Preflight verwendet wurde;
  der Workflow prüft diese Metadaten, bevor das Publish fortgesetzt wird
- Der Hochstufungsmodus muss ein Stable- oder Korrektur-Tag, `preflight_only=false`,
  eine leere `preflight_run_id` und `npm_dist_tag=beta` verwenden
- Der Hochstufungsmodus erfordert außerdem ein gültiges `NPM_TOKEN` in der Umgebung
  `npm-release`, da `npm dist-tag add` weiterhin reguläre npm-Authentifizierung benötigt

## Sequenz für ein stabiles npm-Release

Beim Erstellen eines stabilen npm-Releases:

1. Führen Sie `OpenClaw NPM Release` mit `preflight_only=true` aus
2. Wählen Sie `npm_dist_tag=beta` für den normalen Beta-first-Ablauf oder `latest` nur dann,
   wenn Sie bewusst ein direktes stabiles Publish möchten
3. Speichern Sie die erfolgreiche `preflight_run_id`
4. Führen Sie `OpenClaw NPM Release` erneut mit `preflight_only=false`, demselben
   `tag`, demselben `npm_dist_tag` und der gespeicherten `preflight_run_id` aus
5. Wenn das Release auf `beta` gelandet ist, führen Sie `OpenClaw NPM Release` später mit demselben
   stabilen `tag`, `promote_beta_to_latest=true`, `preflight_only=false`,
   leerer `preflight_run_id` und `npm_dist_tag=beta` aus, wenn Sie diesen
   veröffentlichten Build auf `latest` verschieben möchten

Der Hochstufungsmodus erfordert weiterhin die Freigabe der Umgebung `npm-release` und ein
gültiges `NPM_TOKEN` in dieser Umgebung.

Dadurch bleiben sowohl der direkte Publish-Pfad als auch der Beta-first-Hochstufungspfad
dokumentiert und für Operatoren sichtbar.

## Öffentliche Referenzen

- [`.github/workflows/openclaw-npm-release.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-npm-release.yml)
- [`scripts/openclaw-npm-release-check.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/openclaw-npm-release-check.ts)
- [`scripts/package-mac-dist.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-dist.sh)
- [`scripts/make_appcast.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/make_appcast.sh)

Maintainer verwenden die privaten Release-Dokumente in
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
als tatsächliches Runbook.
