---
read_when:
    - Suche nach Definitionen der öffentlichen Release-Kanäle
    - Suche nach Versionsbenennung und Taktung
summary: Öffentliche Release-Kanäle, Versionsbenennung und Taktung
title: Release-Richtlinie
x-i18n:
    generated_at: "2026-04-25T13:55:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: bc20f30345cbc6c0897e63c9f6a554f9c25be0b52df3efc7d2bbd8827891984a
    source_path: reference/RELEASING.md
    workflow: 15
---

OpenClaw hat drei öffentliche Release-Kanäle:

- stable: getaggte Releases, die standardmäßig nach npm `beta` veröffentlicht werden oder bei expliziter Anforderung nach npm `latest`
- beta: Prerelease-Tags, die nach npm `beta` veröffentlicht werden
- dev: der sich bewegende Head von `main`

## Versionsbenennung

- Stable-Release-Version: `YYYY.M.D`
  - Git-Tag: `vYYYY.M.D`
- Stable-Korrektur-Release-Version: `YYYY.M.D-N`
  - Git-Tag: `vYYYY.M.D-N`
- Beta-Prerelease-Version: `YYYY.M.D-beta.N`
  - Git-Tag: `vYYYY.M.D-beta.N`
- Monat oder Tag nicht mit führenden Nullen auffüllen
- `latest` bedeutet das aktuelle hochgestufte stabile npm-Release
- `beta` bedeutet das aktuelle Beta-Installationsziel
- Stable- und Stable-Korrektur-Releases werden standardmäßig nach npm `beta` veröffentlicht; Release-Operatoren können explizit `latest` als Ziel wählen oder später einen geprüften Beta-Build hochstufen
- Jedes stabile OpenClaw-Release liefert das npm-Paket und die macOS-App gemeinsam aus;
  Beta-Releases validieren und veröffentlichen normalerweise zuerst den npm-/Paketpfad, wobei
  Build/Signieren/Notarisieren der Mac-App für stable reserviert ist, sofern nicht explizit angefordert

## Release-Taktung

- Releases gehen beta-first
- Stable folgt erst, nachdem die neueste Beta validiert wurde
- Maintainer schneiden Releases normalerweise aus einem Branch `release/YYYY.M.D`, der
  aus dem aktuellen `main` erstellt wurde, sodass Release-Validierung und Fixes neue
  Entwicklung auf `main` nicht blockieren
- Wenn ein Beta-Tag gepusht oder veröffentlicht wurde und einen Fix benötigt, schneiden Maintainer
  den nächsten Tag `-beta.N`, statt den alten Beta-Tag zu löschen oder neu zu erstellen
- Detaillierte Release-Prozedur, Genehmigungen, Anmeldedaten und Hinweise zur Wiederherstellung sind
  nur für Maintainer

## Release-Preflight

- Führen Sie `pnpm check:test-types` vor dem Release-Preflight aus, damit TypeScript in Tests
  außerhalb des schnelleren lokalen Gates `pnpm check` weiterhin abgedeckt bleibt
- Führen Sie `pnpm check:architecture` vor dem Release-Preflight aus, damit die umfassenderen Prüfungen
  für Importzyklen und Architekturgrenzen außerhalb des schnelleren lokalen Gates grün sind
- Führen Sie `pnpm build && pnpm ui:build` vor `pnpm release:check` aus, damit die erwarteten
  Release-Artefakte `dist/*` und das Bundle der Control UI für den Validierungsschritt des Packs vorhanden sind
- Führen Sie `pnpm release:check` vor jedem getaggten Release aus
- Release-Prüfungen laufen jetzt in einem separaten manuellen Workflow:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` führt vor der Release-Genehmigung außerdem das QA-Lab-Mock-Parity-Gate sowie die Live-
  QA-Lanes für Matrix und Telegram aus. Die Live-Lanes verwenden die
  Umgebung `qa-live-shared`; Telegram verwendet zusätzlich Credential-Leases von Convex CI.
- Die Cross-OS-Validierung für Laufzeit bei Installation und Upgrade wird vom
  privaten Caller-Workflow
  `openclaw/releases-private/.github/workflows/openclaw-cross-os-release-checks.yml`
  gestartet, der den wiederverwendbaren öffentlichen Workflow
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
  aufruft
- Diese Aufteilung ist beabsichtigt: Halten Sie den echten npm-Release-Pfad kurz,
  deterministisch und artefaktfokussiert, während langsamere Live-Prüfungen in ihrer
  eigenen Lane bleiben, damit sie Veröffentlichung nicht verzögern oder blockieren
- Release-Prüfungen müssen vom Workflow-Ref `main` oder von einem
  Workflow-Ref `release/YYYY.M.D` gestartet werden, damit Workflow-Logik und Secrets kontrolliert bleiben
- Dieser Workflow akzeptiert entweder einen vorhandenen Release-Tag oder den aktuellen vollständigen
  40-stelligen Commit-SHA des Workflow-Branch
- Im Modus mit Commit-SHA akzeptiert er nur den aktuellen HEAD des Workflow-Branch; verwenden Sie
  einen Release-Tag für ältere Release-Commits
- Der Validierungs-Preflight `OpenClaw NPM Release` akzeptiert ebenfalls den aktuellen
  vollständigen 40-stelligen Commit-SHA des Workflow-Branch, ohne einen gepushten Tag zu verlangen
- Dieser SHA-Pfad dient nur der Validierung und kann nicht zu einer echten Veröffentlichung hochgestuft werden
- Im SHA-Modus synthetisiert der Workflow `v<package.json version>` nur für die Metadatenprüfung des
  Pakets; echte Veröffentlichung erfordert weiterhin einen echten Release-Tag
- Beide Workflows behalten den echten Pfad für Veröffentlichung und Promotion auf GitHub-gehosteten
  Runnern, während der nicht mutierende Validierungspfad die größeren
  Blacksmith-Linux-Runner verwenden kann
- Dieser Workflow führt
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  unter Verwendung sowohl der Workflow-Secrets `OPENAI_API_KEY` als auch `ANTHROPIC_API_KEY` aus
- npm-Release-Preflight wartet nicht mehr auf die separate Lane für Release-Prüfungen
- Führen Sie `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  (oder den passenden Beta-/Korrektur-Tag) vor der Genehmigung aus
- Führen Sie nach dem npm-Publish
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  (oder die passende Beta-/Korrektur-Version) aus, um den veröffentlichten Registry-
  Installationspfad in einem frischen temporären Prefix zu prüfen
- Führen Sie nach einer Beta-Veröffentlichung `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`
  aus, um Onboarding des installierten Pakets, Telegram-Setup und echtes Telegram-E2E
  gegen das veröffentlichte npm-Paket mit dem gemeinsam genutzten geleasten Telegram-Credential-
  Pool zu prüfen. Lokale Maintainer-Einmalaktionen können die Convex-Variablen weglassen und stattdessen die drei
  Env-Credentials `OPENCLAW_QA_TELEGRAM_*` direkt übergeben.
- Maintainer können dieselbe Prüfung nach der Veröffentlichung über GitHub Actions mit dem
  manuellen Workflow `NPM Telegram Beta E2E` ausführen. Er ist bewusst nur manuell und läuft
  nicht bei jedem Merge.
- Release-Automatisierung für Maintainer verwendet jetzt Preflight-then-Promote:
  - echte npm-Veröffentlichung muss einen erfolgreichen npm-`preflight_run_id` bestehen
  - die echte npm-Veröffentlichung muss von demselben Branch `main` oder
    `release/YYYY.M.D` gestartet werden wie der erfolgreiche Preflight-Lauf
  - stabile npm-Releases zielen standardmäßig auf `beta`
  - stabiles npm-Publish kann über Workflow-Eingabe explizit `latest` als Ziel verwenden
  - tokenbasierte Mutation von npm-dist-tags lebt jetzt in
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    aus Sicherheitsgründen, weil `npm dist-tag add` weiterhin `NPM_TOKEN` benötigt, während das
    öffentliche Repo OIDC-only-Publish beibehält
  - öffentliches `macOS Release` dient nur der Validierung
  - echte private Mac-Veröffentlichung muss erfolgreichen privaten Mac-
    `preflight_run_id` und `validate_run_id` bestehen
  - die echten Veröffentlichungspfade stufen vorbereitete Artefakte hoch, statt sie erneut
    zu bauen
- Für stabile Korrektur-Releases wie `YYYY.M.D-N` prüft der Verifier nach der Veröffentlichung
  außerdem denselben Upgrade-Pfad mit temporärem Prefix von `YYYY.M.D` zu `YYYY.M.D-N`,
  sodass Release-Korrekturen nicht stillschweigend ältere globale Installationen auf der
  Basis-Stable-Payload belassen können
- npm-Release-Preflight schlägt fail-closed fehl, sofern das Tarball nicht sowohl
  `dist/control-ui/index.html` als auch eine nicht leere Payload `dist/control-ui/assets/` enthält,
  damit wir nicht erneut ein leeres Browser-Dashboard ausliefern
- Verifikation nach der Veröffentlichung prüft außerdem, dass die veröffentlichte Registry-Installation
  nicht leere Runtime-Abhängigkeiten gebündelter Plugins unter dem Root-Layout `dist/*`
  enthält. Ein Release mit fehlenden oder leeren Payloads für Abhängigkeiten gebündelter Plugins
  schlägt beim Postpublish-Verifier fehl und kann nicht auf
  `latest` hochgestuft werden.
- `pnpm test:install:smoke` erzwingt außerdem das Budget `unpackedSize` des npm-Packs für
  das Kandidaten-Update-Tarball, sodass Installer-E2E versehentliche Aufblähung des Packs
  vor dem Release-Publish-Pfad erkennt
- Wenn die Release-Arbeit CI-Planung, Timing-Manifeste für Extensions oder
  Testmatrizen für Extensions berührt hat, regenerieren und prüfen Sie die planer-eigenen
  Workflow-Matrix-Ausgaben `checks-node-extensions` aus `.github/workflows/ci.yml`
  vor der Genehmigung, damit die Release-Notes keine veraltete CI-Struktur beschreiben
- Die Bereitschaft für stabile macOS-Releases umfasst auch die Updater-Oberflächen:
  - das GitHub-Release muss am Ende die paketierten `.zip`, `.dmg` und `.dSYM.zip` enthalten
  - `appcast.xml` auf `main` muss nach dem Publish auf die neue stabile Zip-Datei zeigen
  - die paketierte App muss eine nicht-Debug-Bundle-ID, eine nicht leere Sparkle-Feed-
    URL und eine `CFBundleVersion` mindestens auf der kanonischen Sparkle-Build-Untergrenze
    für diese Release-Version behalten

## Eingaben des NPM-Workflows

`OpenClaw NPM Release` akzeptiert diese vom Operator gesteuerten Eingaben:

- `tag`: erforderlicher Release-Tag wie `v2026.4.2`, `v2026.4.2-1` oder
  `v2026.4.2-beta.1`; wenn `preflight_only=true`, kann dies für validierungsreinen Preflight auch der aktuelle
  vollständige 40-stellige Commit-SHA des Workflow-Branch sein
- `preflight_only`: `true` nur für Validierung/Build/Paketierung, `false` für den
  echten Veröffentlichungspfad
- `preflight_run_id`: im echten Veröffentlichungspfad erforderlich, damit der Workflow das
  vorbereitete Tarball aus dem erfolgreichen Preflight-Lauf wiederverwendet
- `npm_dist_tag`: Ziel-Dist-Tag bei npm für den Veröffentlichungspfad; Standard ist `beta`

`OpenClaw Release Checks` akzeptiert diese vom Operator gesteuerten Eingaben:

- `ref`: vorhandener Release-Tag oder der aktuelle vollständige 40-stellige Commit-
  SHA von `main`, der validiert werden soll, wenn von `main` gestartet; von einem
  Release-Branch aus verwenden Sie einen vorhandenen Release-Tag oder den aktuellen vollständigen 40-stelligen Commit-
  SHA des Release-Branch

Regeln:

- Stable- und Korrektur-Tags dürfen entweder nach `beta` oder `latest` veröffentlicht werden
- Beta-Prerelease-Tags dürfen nur nach `beta` veröffentlicht werden
- Für `OpenClaw NPM Release` ist die Eingabe eines vollständigen Commit-SHA nur zulässig, wenn
  `preflight_only=true`
- `OpenClaw Release Checks` dient immer nur der Validierung und akzeptiert ebenfalls den
  aktuellen Commit-SHA des Workflow-Branch
- Im Commit-SHA-Modus der Release-Prüfungen ist außerdem der aktuelle HEAD des Workflow-Branch erforderlich
- Der echte Veröffentlichungspfad muss denselben `npm_dist_tag` verwenden wie beim Preflight;
  der Workflow prüft diese Metadaten, bevor das Publish fortgesetzt wird

## Reihenfolge für stabile npm-Releases

Beim Schneiden eines stabilen npm-Releases:

1. Führen Sie `OpenClaw NPM Release` mit `preflight_only=true` aus
   - Bevor ein Tag existiert, können Sie den aktuellen vollständigen Commit-SHA des Workflow-Branch
     für einen validierungsreinen Dry Run des Preflight-Workflows verwenden
2. Wählen Sie `npm_dist_tag=beta` für den normalen Beta-First-Flow oder `latest` nur dann,
   wenn Sie absichtlich direkt ein stabiles Publish möchten
3. Führen Sie `OpenClaw Release Checks` separat mit demselben Tag oder dem
   vollständigen aktuellen Commit-SHA des Workflow-Branch aus, wenn Sie Live-Prompt-Cache,
   QA-Lab-Parität, Matrix- und Telegram-Abdeckung möchten
   - Dies ist bewusst getrennt, sodass Live-Abdeckung verfügbar bleibt, ohne lang laufende
     oder fehleranfällige Prüfungen wieder an den Publish-Workflow zu koppeln
4. Speichern Sie die erfolgreiche `preflight_run_id`
5. Führen Sie `OpenClaw NPM Release` erneut mit `preflight_only=false`, demselben
   `tag`, demselben `npm_dist_tag` und der gespeicherten `preflight_run_id` aus
6. Wenn das Release auf `beta` gelandet ist, verwenden Sie den privaten
   Workflow `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`,
   um diese stabile Version von `beta` auf `latest` hochzustufen
7. Wenn das Release absichtlich direkt nach `latest` veröffentlicht wurde und `beta`
   sofort denselben stabilen Build erhalten soll, verwenden Sie denselben privaten
   Workflow, um beide dist-tags auf die stabile Version zu setzen, oder lassen Sie später dessen geplante
   Selbstheilungssynchronisierung `beta` verschieben

Die Mutation von dist-tags lebt aus Sicherheitsgründen im privaten Repo, weil dafür weiterhin
`NPM_TOKEN` benötigt wird, während das öffentliche Repo OIDC-only-Publish beibehält.

Dadurch bleiben sowohl der direkte Veröffentlichungspfad als auch der Beta-First-Pfad mit Promotion dokumentiert und für Operatoren sichtbar.

Wenn ein Maintainer auf lokale npm-Authentifizierung zurückfallen muss, führen Sie alle 1Password-
CLI-Befehle (`op`) nur innerhalb einer dedizierten tmux-Sitzung aus. Rufen Sie `op`
nicht direkt aus der Haupt-Agent-Shell auf; innerhalb von tmux bleiben Prompts,
Benachrichtigungen und OTP-Verarbeitung sichtbar und wiederholte Host-Benachrichtigungen werden vermieden.

## Öffentliche Referenzen

- [`.github/workflows/openclaw-npm-release.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-npm-release.yml)
- [`.github/workflows/openclaw-release-checks.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-release-checks.yml)
- [`.github/workflows/openclaw-cross-os-release-checks-reusable.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-cross-os-release-checks-reusable.yml)
- [`scripts/openclaw-npm-release-check.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/openclaw-npm-release-check.ts)
- [`scripts/package-mac-dist.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-dist.sh)
- [`scripts/make_appcast.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/make_appcast.sh)

Maintainer verwenden für das tatsächliche Runbook die privaten Release-Dokumente in
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md).

## Verwandt

- [Release channels](/de/install/development-channels)
