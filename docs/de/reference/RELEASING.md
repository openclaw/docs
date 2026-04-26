---
read_when:
    - Sie suchen nach Definitionen öffentlicher Release-Kanäle
    - Sie suchen nach Informationen zur Versionsbenennung und Taktung
summary: Öffentliche Release-Kanäle, Versionsbenennung und Taktung
title: Release-Richtlinie
x-i18n:
    generated_at: "2026-04-26T11:38:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: 48ac0ca7d9c6a6ce011e8adda54e1e49beab30456c0dc2bffaec6acec41094df
    source_path: reference/RELEASING.md
    workflow: 15
---

OpenClaw hat drei öffentliche Release-Kanäle:

- stable: getaggte Releases, die standardmäßig in npm unter `beta` veröffentlicht werden oder bei ausdrücklicher Anforderung unter npm `latest`
- beta: Prerelease-Tags, die in npm unter `beta` veröffentlicht werden
- dev: der fortlaufende aktuelle Stand von `main`

## Versionsbenennung

- Versionsnummer für Stable-Release: `YYYY.M.D`
  - Git-Tag: `vYYYY.M.D`
- Versionsnummer für Stable-Korrekturrelease: `YYYY.M.D-N`
  - Git-Tag: `vYYYY.M.D-N`
- Versionsnummer für Beta-Prerelease: `YYYY.M.D-beta.N`
  - Git-Tag: `vYYYY.M.D-beta.N`
- Monat oder Tag nicht mit führenden Nullen auffüllen
- `latest` bedeutet das aktuell hochgestufte stabile npm-Release
- `beta` bedeutet das aktuelle Beta-Installationsziel
- Stable- und Stable-Korrekturreleases werden standardmäßig in npm unter `beta` veröffentlicht; Release-Verantwortliche können explizit `latest` als Ziel angeben oder später einen geprüften Beta-Build hochstufen
- Jedes stabile OpenClaw-Release liefert das npm-Paket und die macOS-App gemeinsam aus;
  Beta-Releases validieren und veröffentlichen normalerweise zuerst den npm-/Paketpfad, während Build/Signierung/Notarisierung der Mac-App Stable vorbehalten sind, sofern nicht ausdrücklich anders angefordert

## Release-Taktung

- Releases laufen zuerst über Beta
- Stable folgt erst, nachdem die neueste Beta validiert wurde
- Maintainer schneiden Releases normalerweise aus einem Branch `release/YYYY.M.D`, der
  aus dem aktuellen `main` erstellt wird, damit Release-Validierung und Fixes
  die neue Entwicklung auf `main` nicht blockieren
- Wenn ein Beta-Tag gepusht oder veröffentlicht wurde und einen Fix benötigt,
  schneiden Maintainer das nächste `-beta.N`-Tag, anstatt das alte Beta-Tag zu
  löschen oder neu zu erstellen
- Detaillierte Release-Abläufe, Freigaben, Zugangsdaten und Wiederherstellungshinweise sind
  nur für Maintainer bestimmt

## Release-Vorprüfung

- Führen Sie `pnpm check:test-types` vor der Release-Vorprüfung aus, damit
  Test-TypeScript außerhalb des schnelleren lokalen Gates `pnpm check`
  weiterhin abgedeckt bleibt
- Führen Sie `pnpm check:architecture` vor der Release-Vorprüfung aus, damit
  die umfassenderen Prüfungen für Importzyklen und Architekturgrenzen
  außerhalb des schnelleren lokalen Gates grün sind
- Führen Sie `pnpm build && pnpm ui:build` vor `pnpm release:check` aus, damit
  die erwarteten `dist/*`-Release-Artefakte und das Control UI-Bundle für den
  Pack-Validierungsschritt vorhanden sind
- Führen Sie `pnpm qa:otel:smoke` aus, wenn Sie Release-Telemetrie validieren. Es prüft
  QA-lab über einen lokalen OTLP/HTTP-Empfänger und verifiziert die exportierten
  Trace-Span-Namen, begrenzte Attribute und die Schwärzung von Inhalten/Bezeichnern,
  ohne Opik, Langfuse oder einen anderen externen Collector zu benötigen.
- Führen Sie `pnpm release:check` vor jedem getaggten Release aus
- Release-Prüfungen laufen jetzt in einem separaten manuellen Workflow:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` führt vor der Release-Freigabe auch das QA Lab-Mock-Parity-Gate sowie die Live-QA-Lanes für
  Matrix und Telegram aus. Die Live-Lanes verwenden die
  Umgebung `qa-live-shared`; Telegram verwendet zusätzlich Convex-CI-Credential-Leases.
- Die Cross-OS-Laufzeitvalidierung für Installation und Upgrade wird vom
  privaten aufrufenden Workflow
  `openclaw/releases-private/.github/workflows/openclaw-cross-os-release-checks.yml`
  ausgelöst, der den wiederverwendbaren öffentlichen Workflow
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
  aufruft
- Diese Aufteilung ist beabsichtigt: Der echte npm-Release-Pfad bleibt kurz,
  deterministisch und artefaktfokussiert, während langsamere Live-Prüfungen in ihrer
  eigenen Lane bleiben, damit sie die Veröffentlichung nicht verzögern oder blockieren
- Release-Prüfungen müssen vom Workflow-Ref `main` oder von einem
  Workflow-Ref `release/YYYY.M.D` ausgelöst werden, damit Workflow-Logik und Secrets
  kontrolliert bleiben
- Dieser Workflow akzeptiert entweder ein vorhandenes Release-Tag oder den aktuellen vollständigen
  40-stelligen Commit-SHA des Workflow-Branches
- Im Commit-SHA-Modus akzeptiert er nur den aktuellen HEAD des Workflow-Branches;
  für ältere Release-Commits verwenden Sie ein Release-Tag
- Die Validierungs-only-Vorprüfung von `OpenClaw NPM Release` akzeptiert ebenfalls den aktuellen
  vollständigen 40-stelligen Commit-SHA des Workflow-Branches, ohne ein gepushtes Tag zu erfordern
- Dieser SHA-Pfad dient nur der Validierung und kann nicht zu einer echten Veröffentlichung hochgestuft werden
- Im SHA-Modus synthetisiert der Workflow `v<package.json version>` nur für die
  Prüfung der Paketmetadaten; eine echte Veröffentlichung erfordert weiterhin ein echtes Release-Tag
- Beide Workflows belassen den echten Veröffentlichungs- und Hochstufungspfad auf GitHub-gehosteten
  Runnern, während der nicht mutierende Validierungspfad die größeren
  Blacksmith-Linux-Runner verwenden kann
- Dieser Workflow führt
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  mit den Workflow-Secrets `OPENAI_API_KEY` und `ANTHROPIC_API_KEY` aus
- Die npm-Release-Vorprüfung wartet nicht mehr auf die separate Lane für Release-Prüfungen
- Führen Sie `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  (oder das passende Beta-/Korrektur-Tag) vor der Freigabe aus
- Führen Sie nach der npm-Veröffentlichung
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  (oder die passende Beta-/Korrekturversion) aus, um den
  veröffentlichten Registry-Installationspfad in einem frischen temporären Prefix zu verifizieren
- Führen Sie nach einer Beta-Veröffentlichung `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`
  aus, um das Onboarding des installierten Pakets, das Telegram-Setup und echtes Telegram-E2E
  gegen das veröffentlichte npm-Paket mit dem gemeinsam genutzten geleasten Telegram-Credential-
  Pool zu verifizieren. Lokale einmalige Maintainer-Läufe können die Convex-Variablen weglassen
  und die drei Credential-Umgebungsvariablen `OPENCLAW_QA_TELEGRAM_*` direkt übergeben.
- Maintainer können dieselbe Prüfung nach der Veröffentlichung auch über GitHub Actions mit dem
  manuellen Workflow `NPM Telegram Beta E2E` ausführen. Dieser ist bewusst nur manuell
  verfügbar und läuft nicht bei jedem Merge.
- Die Release-Automatisierung für Maintainer verwendet jetzt Vorprüfung-und-dann-Hochstufung:
  - eine echte npm-Veröffentlichung muss eine erfolgreiche npm-`preflight_run_id` bestehen
  - die echte npm-Veröffentlichung muss vom selben Branch `main` oder
    `release/YYYY.M.D` ausgelöst werden wie der erfolgreiche Vorprüfungslauf
  - stabile npm-Releases verwenden standardmäßig `beta`
  - stabile npm-Veröffentlichungen können explizit `latest` als Ziel angeben
  - die tokenbasierte Änderung von npm-dist-tags liegt jetzt in
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    aus Sicherheitsgründen, weil `npm dist-tag add` weiterhin `NPM_TOKEN` benötigt, während das
    öffentliche Repo bei der Veröffentlichung nur OIDC nutzt
  - das öffentliche `macOS Release` dient nur der Validierung
  - eine echte private Mac-Veröffentlichung muss erfolgreiche private Mac-
    `preflight_run_id` und `validate_run_id` bestehen
  - die echten Veröffentlichungspfade stufen vorbereitete Artefakte hoch, anstatt sie
    erneut zu bauen
- Bei Stable-Korrekturreleases wie `YYYY.M.D-N` prüft der Verifier nach der Veröffentlichung
  außerdem denselben Temp-Prefix-Upgrade-Pfad von `YYYY.M.D` auf `YYYY.M.D-N`,
  damit Release-Korrekturen ältere globale Installationen nicht unbemerkt auf der
  Basis-Stable-Nutzlast belassen
- Die npm-Release-Vorprüfung schlägt standardmäßig fehl, wenn das Tarball nicht sowohl
  `dist/control-ui/index.html` als auch einen nicht leeren Payload unter `dist/control-ui/assets/` enthält,
  damit wir nicht noch einmal ein leeres Browser-Dashboard ausliefern
- Die Verifikation nach der Veröffentlichung prüft außerdem, dass die veröffentlichte Registry-Installation
  nicht leere gebündelte Plugin-Laufzeitabhängigkeiten unter dem Root-Layout `dist/*`
  enthält. Ein Release mit fehlenden oder leeren Payloads für gebündelte Plugin-
  Abhängigkeiten schlägt bei der Postpublish-Prüfung fehl und kann nicht nach
  `latest` hochgestuft werden.
- `pnpm test:install:smoke` erzwingt außerdem das Budget für `unpackedSize` des npm-Packs
  auf dem Kandidaten-Tarball für das Update, damit das Installer-E2E versehentliche Pack-Aufblähungen
  vor dem Release-Veröffentlichungspfad erkennt
- Wenn die Release-Arbeit die CI-Planung, Zeitmanifest-Dateien für Extensions oder
  Extension-Testmatrizen berührt hat, regenerieren und prüfen Sie vor der Freigabe die
  planer-eigenen Workflow-Matrix-Ausgaben `checks-node-extensions` aus `.github/workflows/ci.yml`,
  damit die Release Notes kein veraltetes CI-Layout beschreiben
- Die Bereitschaft für ein stabiles macOS-Release umfasst auch die Updater-Oberflächen:
  - das GitHub-Release muss am Ende die gepackte `.zip`, `.dmg` und `.dSYM.zip` enthalten
  - `appcast.xml` auf `main` muss nach der Veröffentlichung auf die neue stabile ZIP verweisen
  - die gepackte App muss eine nicht-Debug-Bundle-ID, eine nicht leere Sparkle-Feed-URL
    und eine `CFBundleVersion` beibehalten, die mindestens auf dem kanonischen Sparkle-Build-Minimum
    für diese Release-Version liegt

## NPM-Workflow-Eingaben

`OpenClaw NPM Release` akzeptiert diese durch Operatoren gesteuerten Eingaben:

- `tag`: erforderliches Release-Tag wie `v2026.4.2`, `v2026.4.2-1` oder
  `v2026.4.2-beta.1`; wenn `preflight_only=true`, darf es auch der aktuelle
  vollständige 40-stellige Commit-SHA des Workflow-Branches für eine reine
  Validierungs-Vorprüfung sein
- `preflight_only`: `true` nur für Validierung/Build/Paketierung, `false` für den
  echten Veröffentlichungspfad
- `preflight_run_id`: im echten Veröffentlichungspfad erforderlich, damit der Workflow das
  vorbereitete Tarball aus dem erfolgreichen Vorprüfungslauf wiederverwendet
- `npm_dist_tag`: npm-Ziel-Tag für den Veröffentlichungspfad; Standard ist `beta`

`OpenClaw Release Checks` akzeptiert diese durch Operatoren gesteuerten Eingaben:

- `ref`: vorhandenes Release-Tag oder der aktuelle vollständige 40-stellige `main`-Commit-
  SHA zur Validierung bei Auslösung von `main`; von einem Release-Branch aus verwenden Sie ein
  vorhandenes Release-Tag oder den aktuellen vollständigen 40-stelligen Commit-SHA des Release-Branches

Regeln:

- Stable- und Korrektur-Tags können entweder nach `beta` oder `latest` veröffentlichen
- Beta-Prerelease-Tags dürfen nur nach `beta` veröffentlichen
- Für `OpenClaw NPM Release` ist die Eingabe eines vollständigen Commit-SHA nur erlaubt, wenn
  `preflight_only=true`
- `OpenClaw Release Checks` dient immer nur der Validierung und akzeptiert ebenfalls den
  aktuellen Commit-SHA des Workflow-Branches
- Der Commit-SHA-Modus für Release-Prüfungen erfordert außerdem den aktuellen HEAD des Workflow-Branches
- Der echte Veröffentlichungspfad muss denselben `npm_dist_tag` verwenden wie in der Vorprüfung;
  der Workflow verifiziert diese Metadaten, bevor die Veröffentlichung fortgesetzt wird

## Sequenz für stabiles npm-Release

Beim Schneiden eines stabilen npm-Releases:

1. Führen Sie `OpenClaw NPM Release` mit `preflight_only=true` aus
   - Bevor ein Tag existiert, können Sie den aktuellen vollständigen Commit-SHA des Workflow-Branches
     für einen reinen Validierungs-Trockenlauf des Vorprüfungs-Workflows verwenden
2. Wählen Sie `npm_dist_tag=beta` für den normalen Beta-first-Ablauf oder `latest` nur dann,
   wenn Sie absichtlich eine direkte stabile Veröffentlichung wünschen
3. Führen Sie `OpenClaw Release Checks` separat mit demselben Tag oder dem
   vollständigen aktuellen Commit-SHA des Workflow-Branches aus, wenn Sie Live-Abdeckung für Prompt-Cache,
   QA Lab Parity, Matrix und Telegram wünschen
   - Dies ist absichtlich getrennt, damit Live-Abdeckung verfügbar bleibt, ohne
     langlaufende oder instabile Prüfungen wieder an den Veröffentlichungs-Workflow zu koppeln
4. Speichern Sie die erfolgreiche `preflight_run_id`
5. Führen Sie `OpenClaw NPM Release` erneut mit `preflight_only=false`, demselben
   `tag`, demselben `npm_dist_tag` und der gespeicherten `preflight_run_id` aus
6. Wenn das Release unter `beta` gelandet ist, verwenden Sie den privaten
   Workflow `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`,
   um diese stabile Version von `beta` nach `latest` hochzustufen
7. Wenn das Release absichtlich direkt unter `latest` veröffentlicht wurde und `beta`
   unmittelbar demselben stabilen Build folgen soll, verwenden Sie denselben privaten
   Workflow, um beide dist-tags auf die stabile Version zu setzen, oder lassen Sie die
   geplante Selbstheilungs-Synchronisierung `beta` später verschieben

Die Änderung des dist-tags liegt aus Sicherheitsgründen im privaten Repo, weil sie weiterhin
`NPM_TOKEN` erfordert, während das öffentliche Repo für Veröffentlichungen nur OIDC nutzt.

Damit bleiben sowohl der direkte Veröffentlichungspfad als auch der Beta-first-Hochstufungspfad
dokumentiert und für Operatoren sichtbar.

Wenn ein Maintainer auf lokale npm-Authentifizierung zurückfallen muss, führen Sie beliebige 1Password-
CLI-Befehle (`op`) nur innerhalb einer dedizierten tmux-Sitzung aus. Rufen Sie `op`
nicht direkt aus der Haupt-Shell des Agenten auf; die Ausführung innerhalb von tmux macht Eingabeaufforderungen,
Warnungen und OTP-Verarbeitung sichtbar und verhindert wiederholte Host-Warnungen.

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

- [Release-Kanäle](/de/install/development-channels)
