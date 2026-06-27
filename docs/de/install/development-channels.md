---
read_when:
    - Sie möchten zwischen stable/beta/dev wechseln
    - Sie möchten eine bestimmte Version, ein bestimmtes Tag oder einen bestimmten SHA anheften
    - Sie taggen oder veröffentlichen Vorabversionen
sidebarTitle: Release Channels
summary: 'Stable-, Beta- und Dev-Kanäle: Semantik, Wechsel, Pinning und Tagging'
title: Release-Kanäle
x-i18n:
    generated_at: "2026-06-27T17:38:03Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7b5b0b8b43dd15b3fdd83d28c5d0292d260594325ad6e6e95533720ba3e59277
    source_path: install/development-channels.md
    workflow: 16
---

OpenClaw liefert drei Update-Kanäle aus:

- **stable**: npm-dist-tag `latest`. Für die meisten Benutzer empfohlen.
- **beta**: npm-dist-tag `beta`, wenn er aktuell ist; wenn beta fehlt oder älter ist als
  die neueste stabile Version, fällt der Update-Ablauf auf `latest` zurück.
- **dev**: beweglicher Stand von `main` (git). npm-dist-tag: `dev` (wenn veröffentlicht).
  Der Branch `main` ist für Experimente und aktive Entwicklung gedacht. Er kann
  unvollständige Features oder Breaking Changes enthalten. Verwenden Sie ihn nicht für Produktions-Gateways.

Wir liefern stabile Builds normalerweise zuerst nach **beta** aus, testen sie dort und führen dann einen
expliziten Promotion-Schritt aus, der den geprüften Build nach `latest` verschiebt, ohne
die Versionsnummer zu ändern. Maintainer können bei Bedarf auch eine stabile Version
direkt nach `latest` veröffentlichen. Dist-tags sind die Quelle der Wahrheit für npm-Installationen.

## Kanäle wechseln

```bash
openclaw update --channel stable
openclaw update --channel beta
openclaw update --channel dev
```

`--channel` speichert Ihre Auswahl dauerhaft in der Konfiguration (`update.channel`) und richtet die
Installationsmethode aus:

- **`stable`** (Paketinstallationen): aktualisiert über den npm-dist-tag `latest`.
- **`beta`** (Paketinstallationen): bevorzugt den npm-dist-tag `beta`, fällt aber auf
  `latest` zurück, wenn `beta` fehlt oder älter ist als der aktuelle stabile Tag.
- **`stable`** (git-Installationen): checkt den neuesten stabilen git-Tag aus, ausgenommen
  semver-Prerelease-Tags wie `-alpha.N`, `-beta.N`, `-rc.N`, `-dev.N`,
  `-next.N`, `-preview.N`, `-canary.N`, `-nightly.N` und andere Prerelease-
  Suffixe.
- **`beta`** (git-Installationen): bevorzugt den neuesten beta-git-Tag, fällt aber auf
  den neuesten stabilen git-Tag zurück, wenn beta fehlt oder älter ist.
- **`dev`**: stellt einen git-Checkout sicher (standardmäßig `~/openclaw` oder
  `$OPENCLAW_HOME/openclaw`, wenn `OPENCLAW_HOME` gesetzt ist; mit
  `OPENCLAW_GIT_DIR` überschreiben), wechselt zu `main`, rebast auf upstream, baut und
  installiert die globale CLI aus diesem Checkout.

<Tip>
Wenn Sie stable und dev parallel verwenden möchten, behalten Sie zwei Klone und richten Sie Ihr Gateway auf den stabilen aus.
</Tip>

## Einmalige Version oder Tag ansteuern

Verwenden Sie `--tag`, um einen bestimmten dist-tag, eine Version oder eine Paketspezifikation für ein einzelnes
Update anzusteuern, **ohne** Ihren gespeicherten Kanal zu ändern:

```bash
# Install a specific version
openclaw update --tag 2026.4.1-beta.1

# Install from the beta dist-tag (one-off, does not persist)
openclaw update --tag beta

# Switch to the moving GitHub main checkout
openclaw update --channel dev

# Install a specific npm package spec
openclaw update --tag openclaw@2026.4.1-beta.1

# Install from GitHub main once without persisting the channel
openclaw update --tag main
```

Hinweise:

- `--tag` gilt **nur für Paketinstallationen (npm)**. Git-Installationen ignorieren es.
- Der Tag wird nicht dauerhaft gespeichert. Ihr nächstes `openclaw update` verwendet wie gewohnt
  Ihren konfigurierten Kanal.
- Bei Paketinstallationen packt OpenClaw GitHub-/git-Quellspezifikationen vor der gestuften npm-Installation in einen
  temporären Tarball vor. Verwenden Sie `--channel dev` oder
  `--install-method git --version main`, wenn Sie den beweglichen `main`-
  Checkout als dauerhafte Installation möchten.
- Downgrade-Schutz: Wenn die Zielversion älter als Ihre aktuelle Version ist,
  fragt OpenClaw nach einer Bestätigung (mit `--yes` überspringen).
- `--channel beta` unterscheidet sich von `--tag beta`: Der Kanalablauf kann auf
  stable/latest zurückfallen, wenn beta fehlt oder älter ist, während `--tag beta` für
  diesen einen Lauf den rohen dist-tag `beta` ansteuert.

## Probelauf

Zeigen Sie in der Vorschau an, was `openclaw update` tun würde, ohne Änderungen vorzunehmen:

```bash
openclaw update --dry-run
openclaw update --channel beta --dry-run
openclaw update --tag 2026.4.1-beta.1 --dry-run
openclaw update --dry-run --json
```

Der Probelauf zeigt den effektiven Kanal, die Zielversion, die geplanten Aktionen und
ob eine Downgrade-Bestätigung erforderlich wäre.

## Plugins und Kanäle

Wenn Sie mit `openclaw update` den Kanal wechseln, synchronisiert OpenClaw auch Plugin-
Quellen:

- `dev` bevorzugt gebündelte Plugins aus dem git-Checkout.
- `stable` und `beta` stellen per npm installierte Plugin-Pakete wieder her.
- Per npm installierte Plugins werden aktualisiert, nachdem das Core-Update abgeschlossen ist.

## Aktuellen Status prüfen

```bash
openclaw update status
```

Zeigt den aktiven Kanal, die Installationsart (git oder Paket), die aktuelle Version und
die Quelle (Konfiguration, git-Tag, git-Branch oder Standard).

## Best Practices für Tagging

- Taggen Sie Releases, auf denen git-Checkouts landen sollen (`vYYYY.M.PATCH` für stable,
  `vYYYY.M.PATCH-beta.N` für beta; benannte semver-Prerelease-Suffixe wie
  `-alpha.N`, `-rc.N` und `-next.N` sind keine stabilen Ziele).
- Ältere numerische stabile Tags wie `vYYYY.M.PATCH-1` und `v1.0.1-1` werden aus
  Kompatibilitätsgründen weiterhin als stabile git-Tags erkannt.
- `vYYYY.M.PATCH.beta.N` wird aus Kompatibilitätsgründen ebenfalls erkannt, bevorzugen Sie aber `-beta.N`.
- Halten Sie Tags unveränderlich: Verschieben oder wiederverwenden Sie niemals einen Tag.
- npm-dist-tags bleiben die Quelle der Wahrheit für npm-Installationen:
  - `latest` -> stable
  - `beta` -> Kandidaten-Build oder beta-first-stabiler Build
  - `dev` -> main-Snapshot (optional)

## Verfügbarkeit der macOS-App

Beta- und dev-Builds enthalten möglicherweise **keine** macOS-App-Version. Das ist in Ordnung:

- Der git-Tag und der npm-dist-tag können trotzdem veröffentlicht werden.
- Weisen Sie in den Release Notes oder im Changelog auf „kein macOS-Build für diese Beta“ hin.

## Verwandt

- [Aktualisieren](/de/install/updating)
- [Installer-Interna](/de/install/installer)
