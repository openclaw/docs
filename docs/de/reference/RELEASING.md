---
read_when:
    - Suche nach Definitionen öffentlicher Release-Kanäle
    - Suche nach Versionsbenennung und Release-Rhythmus
summary: Öffentliche Release-Kanäle, Versionsbenennung und Rhythmus
title: Release-Richtlinie
x-i18n:
    generated_at: "2026-04-14T06:20:45Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3eaf9f1786b8c9fd4f5a9c657b623cb69d1a485958e1a9b8f108511839b63587
    source_path: reference/RELEASING.md
    workflow: 15
---

# Release-Richtlinie

OpenClaw hat drei öffentliche Release-Kanäle:

- stable: getaggte Releases, die standardmäßig auf npm `beta` veröffentlichen oder auf ausdrücklichen Wunsch auf npm `latest`
- beta: Prerelease-Tags, die auf npm `beta` veröffentlichen
- dev: der fortlaufende Head von `main`

## Versionsbenennung

- Version eines stable-Releases: `YYYY.M.D`
  - Git-Tag: `vYYYY.M.D`
- Version eines stable-Korrektur-Releases: `YYYY.M.D-N`
  - Git-Tag: `vYYYY.M.D-N`
- Version eines beta-Prereleases: `YYYY.M.D-beta.N`
  - Git-Tag: `vYYYY.M.D-beta.N`
- Monat und Tag nicht mit führenden Nullen auffüllen
- `latest` bedeutet das aktuell freigegebene stabile npm-Release
- `beta` bedeutet das aktuelle beta-Installationsziel
- stable- und stable-Korrektur-Releases werden standardmäßig auf npm `beta` veröffentlicht; Release-Verantwortliche können ausdrücklich `latest` als Ziel festlegen oder später einen geprüften beta-Build hochstufen
- Jedes OpenClaw-Release liefert das npm-Paket und die macOS-App gemeinsam aus

## Release-Rhythmus

- Releases werden zuerst als beta ausgeliefert
- stable folgt erst, nachdem die neueste beta validiert wurde
- Das detaillierte Release-Verfahren, Freigaben, Anmeldedaten und Wiederherstellungshinweise sind
  nur für Maintainer bestimmt

## Release-Vorabprüfung

- Führen Sie `pnpm build && pnpm ui:build` vor `pnpm release:check` aus, damit die erwarteten
  `dist/*`-Release-Artefakte und das Control-UI-Bundle für den
  Pack-Validierungsschritt vorhanden sind
- Führen Sie `pnpm release:check` vor jedem getaggten Release aus
- Release-Prüfungen laufen jetzt in einem separaten manuellen Workflow:
  `OpenClaw Release Checks`
- Diese Aufteilung ist beabsichtigt: Der echte npm-Release-Pfad bleibt kurz,
  deterministisch und auf Artefakte fokussiert, während langsamere Live-Prüfungen in ihrem
  eigenen Kanal bleiben, damit sie die Veröffentlichung nicht verzögern oder blockieren
- Release-Prüfungen müssen vom Workflow-Ref `main` aus ausgelöst werden, damit die
  Workflow-Logik und Secrets kanonisch bleiben
- Dieser Workflow akzeptiert entweder ein vorhandenes Release-Tag oder den aktuellen vollständigen
  40-stelligen `main`-Commit-SHA
- Im Commit-SHA-Modus wird nur der aktuelle `origin/main`-HEAD akzeptiert; verwenden Sie ein
  Release-Tag für ältere Release-Commits
- Die reine Vorabvalidierung von `OpenClaw NPM Release` akzeptiert ebenfalls den aktuellen
  vollständigen 40-stelligen `main`-Commit-SHA, ohne ein gepushtes Tag zu erfordern
- Dieser SHA-Pfad dient nur der Validierung und kann nicht zu einer echten Veröffentlichung hochgestuft werden
- Im SHA-Modus synthetisiert der Workflow `v<package.json version>` nur für die
  Prüfung der Paketmetadaten; eine echte Veröffentlichung erfordert weiterhin ein echtes Release-Tag
- Beide Workflows belassen den echten Veröffentlichungs- und Promotionspfad auf GitHub-gehosteten
  Runnern, während der nicht mutierende Validierungspfad die größeren
  Blacksmith-Linux-Runner verwenden kann
- Dieser Workflow führt
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  mit den Workflow-Secrets `OPENAI_API_KEY` und `ANTHROPIC_API_KEY` aus
- Die npm-Release-Vorabprüfung wartet nicht mehr auf den separaten Release-Checks-Kanal
- Führen Sie vor der Freigabe
  `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  aus (oder das entsprechende beta-/Korrektur-Tag)
- Führen Sie nach der npm-Veröffentlichung
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  aus (oder die entsprechende beta-/Korrekturversion), um den veröffentlichten Registry-
  Installationspfad in einem frischen temporären Präfix zu verifizieren
- Die Maintainer-Release-Automatisierung verwendet jetzt Vorabprüfung-und-Promotion:
  - eine echte npm-Veröffentlichung muss eine erfolgreiche npm-`preflight_run_id` bestehen
  - stable-npm-Releases verwenden standardmäßig `beta`
  - eine stable-npm-Veröffentlichung kann `latest` ausdrücklich per Workflow-Eingabe als Ziel festlegen
  - die Promotion eines stable-npm-Releases von `beta` nach `latest` ist weiterhin als expliziter manueller Modus im vertrauenswürdigen Workflow `OpenClaw NPM Release` verfügbar
  - direkte stable-Veröffentlichungen können außerdem einen expliziten Dist-Tag-Synchronisierungsmodus ausführen, der sowohl `latest` als auch `beta` auf die bereits veröffentlichte stable-Version setzt
  - diese Dist-Tag-Modi benötigen weiterhin ein gültiges `NPM_TOKEN` in der Umgebung `npm-release`, weil die Verwaltung von npm-`dist-tag` von Trusted Publishing getrennt ist
  - die öffentliche `macOS Release` ist nur für die Validierung
  - eine echte private Mac-Veröffentlichung muss erfolgreiche private Mac-
    `preflight_run_id` und `validate_run_id` bestehen
  - die echten Veröffentlichungspfade promoten vorbereitete Artefakte, statt sie erneut zu bauen
- Bei stable-Korrektur-Releases wie `YYYY.M.D-N` prüft der Verifier nach der Veröffentlichung
  zusätzlich denselben Upgrade-Pfad mit temporärem Präfix von `YYYY.M.D` auf `YYYY.M.D-N`,
  sodass Release-Korrekturen ältere globale Installationen nicht unbemerkt auf der
  Basis-stable-Nutzlast belassen können
- Die npm-Release-Vorabprüfung schlägt standardmäßig fehl, wenn das Tarball nicht sowohl
  `dist/control-ui/index.html` als auch eine nicht leere Nutzlast unter `dist/control-ui/assets/` enthält,
  damit wir nicht noch einmal ein leeres Browser-Dashboard ausliefern
- `pnpm test:install:smoke` erzwingt außerdem das `unpackedSize`-Budget des npm-Pack auf
  dem Kandidaten-Tarball für das Update, sodass das Installer-E2E versehentliche Pack-Aufblähungen
  vor dem Release-Veröffentlichungspfad erkennt
- Wenn die Release-Arbeit die CI-Planung, Timing-Manifeste für Erweiterungen oder
  Erweiterungs-Testmatrizen berührt hat, generieren und prüfen Sie vor der Freigabe die vom Planer verwalteten
  Workflow-Matrix-Ausgaben `checks-node-extensions` aus `.github/workflows/ci.yml`,
  damit die Release Notes keine veraltete CI-Struktur beschreiben
- Zur stable-macOS-Release-Bereitschaft gehören auch die Updater-Oberflächen:
  - das GitHub-Release muss am Ende die paketierten `.zip`-, `.dmg`- und `.dSYM.zip`-Dateien enthalten
  - `appcast.xml` auf `main` muss nach der Veröffentlichung auf die neue stable-ZIP zeigen
  - die paketierte App muss eine nicht für Debug bestimmte Bundle-ID, eine nicht leere Sparkle-Feed-
    URL und eine `CFBundleVersion` auf oder über der kanonischen Sparkle-Build-Untergrenze
    für diese Release-Version behalten

## NPM-Workflow-Eingaben

`OpenClaw NPM Release` akzeptiert diese vom Operator gesteuerten Eingaben:

- `tag`: erforderliches Release-Tag wie `v2026.4.2`, `v2026.4.2-1` oder
  `v2026.4.2-beta.1`; wenn `preflight_only=true`, kann dies auch der aktuelle
  vollständige 40-stellige `main`-Commit-SHA für eine reine Validierungs-Vorabprüfung sein
- `preflight_only`: `true` nur für Validierung/Build/Paket, `false` für den
  echten Veröffentlichungspfad
- `preflight_run_id`: auf dem echten Veröffentlichungspfad erforderlich, damit der Workflow das
  vorbereitete Tarball aus dem erfolgreichen Vorabprüfungs-Lauf wiederverwendet
- `npm_dist_tag`: npm-Ziel-Tag für den Veröffentlichungspfad; standardmäßig `beta`
- `promote_beta_to_latest`: `true`, um die Veröffentlichung zu überspringen und einen bereits veröffentlichten
  stable-`beta`-Build nach `latest` zu verschieben
- `sync_stable_dist_tags`: `true`, um die Veröffentlichung zu überspringen und sowohl `latest` als auch
  `beta` auf eine bereits veröffentlichte stable-Version zu setzen

`OpenClaw Release Checks` akzeptiert diese vom Operator gesteuerten Eingaben:

- `ref`: vorhandenes Release-Tag oder der aktuelle vollständige 40-stellige `main`-Commit-
  SHA zur Validierung

Regeln:

- stable- und Korrektur-Tags dürfen entweder auf `beta` oder auf `latest` veröffentlichen
- beta-Prerelease-Tags dürfen nur auf `beta` veröffentlichen
- Die Eingabe eines vollständigen Commit-SHA ist nur erlaubt, wenn `preflight_only=true`
- Der Commit-SHA-Modus der Release-Prüfungen erfordert außerdem den aktuellen `origin/main`-HEAD
- Der echte Veröffentlichungspfad muss denselben `npm_dist_tag` verwenden, der auch bei der Vorabprüfung verwendet wurde;
  der Workflow prüft diese Metadaten, bevor die Veröffentlichung fortgesetzt wird
- Der Promotionsmodus muss ein stable- oder Korrektur-Tag, `preflight_only=false`,
  eine leere `preflight_run_id` und `npm_dist_tag=beta` verwenden
- Der Dist-Tag-Synchronisierungsmodus muss ein stable- oder Korrektur-Tag,
  `preflight_only=false`, eine leere `preflight_run_id`, `npm_dist_tag=latest`
  und `promote_beta_to_latest=false` verwenden
- Promotions- und Dist-Tag-Synchronisierungsmodi erfordern außerdem ein gültiges `NPM_TOKEN`, weil
  `npm dist-tag add` weiterhin reguläre npm-Authentifizierung benötigt; Trusted Publishing deckt
  nur den Pfad der Paketveröffentlichung ab

## Stable-npm-Release-Sequenz

Beim Erstellen eines stable-npm-Releases:

1. Führen Sie `OpenClaw NPM Release` mit `preflight_only=true` aus
   - Bevor ein Tag existiert, können Sie den aktuellen vollständigen `main`-Commit-SHA für einen
     reinen Validierungs-Trockenlauf des Vorabprüfungs-Workflows verwenden
2. Wählen Sie `npm_dist_tag=beta` für den normalen beta-first-Ablauf oder `latest` nur dann,
   wenn Sie bewusst eine direkte stable-Veröffentlichung möchten
3. Führen Sie `OpenClaw Release Checks` separat mit demselben Tag oder dem
   vollständigen aktuellen `main`-Commit-SHA aus, wenn Sie Live-Abdeckung für den Prompt-Cache wünschen
   - Dies ist absichtlich getrennt, damit Live-Abdeckung verfügbar bleibt, ohne
     lang laufende oder instabile Prüfungen wieder an den Veröffentlichungs-Workflow zu koppeln
4. Speichern Sie die erfolgreiche `preflight_run_id`
5. Führen Sie `OpenClaw NPM Release` erneut mit `preflight_only=false`, demselben
   `tag`, demselben `npm_dist_tag` und der gespeicherten `preflight_run_id` aus
6. Wenn das Release auf `beta` gelandet ist, führen Sie `OpenClaw NPM Release` später mit demselben
   stable-`tag`, `promote_beta_to_latest=true`, `preflight_only=false`,
   leerer `preflight_run_id` und `npm_dist_tag=beta` aus, wenn Sie diesen
   veröffentlichten Build nach `latest` verschieben möchten
7. Wenn das Release bewusst direkt auf `latest` veröffentlicht wurde und `beta`
   demselben stable-Build folgen soll, führen Sie `OpenClaw NPM Release` mit demselben
   stable-`tag`, `sync_stable_dist_tags=true`, `promote_beta_to_latest=false`,
   `preflight_only=false`, leerer `preflight_run_id` und `npm_dist_tag=latest` aus

Die Promotions- und Dist-Tag-Synchronisierungsmodi erfordern weiterhin die Freigabe der
Umgebung `npm-release` und ein gültiges `NPM_TOKEN`, auf das dieser Workflow-Lauf zugreifen kann.

Damit bleiben sowohl der direkte Veröffentlichungspfad als auch der beta-first-Promotionspfad
dokumentiert und für Operatoren sichtbar.

## Öffentliche Referenzen

- [`.github/workflows/openclaw-npm-release.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-npm-release.yml)
- [`.github/workflows/openclaw-release-checks.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-release-checks.yml)
- [`scripts/openclaw-npm-release-check.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/openclaw-npm-release-check.ts)
- [`scripts/package-mac-dist.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-dist.sh)
- [`scripts/make_appcast.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/make_appcast.sh)

Maintainer verwenden die privaten Release-Dokumente in
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
für das eigentliche Runbook.
