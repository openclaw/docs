---
read_when:
    - Sie möchten zwischen stable/beta/dev wechseln
    - Sie möchten eine bestimmte Version, ein bestimmtes Tag oder einen bestimmten SHA fixieren
    - Sie erstellen Tags für Vorabversionen oder veröffentlichen sie
sidebarTitle: Release Channels
summary: 'Stable-, Beta- und Dev-Kanäle: Semantik, Wechsel, Pinning und Tagging'
title: Release-Kanäle
x-i18n:
    generated_at: "2026-05-07T13:20:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: d2516165635eb8fbaddf19e07fbb591b659479b5226c2bf467e29247552ababb
    source_path: install/development-channels.md
    workflow: 16
---

OpenClaw liefert drei Update-Kanäle aus:

- **stable**: npm-dist-tag `latest`. Für die meisten Benutzer empfohlen.
- **beta**: npm-dist-tag `beta`, wenn er aktuell ist; wenn beta fehlt oder älter als
  die neueste stabile Version ist, fällt der Update-Ablauf auf `latest` zurück.
- **dev**: beweglicher Stand von `main` (git). npm-dist-tag: `dev` (wenn veröffentlicht).
  Der Branch `main` dient Experimenten und aktiver Entwicklung. Er kann
  unvollständige Funktionen oder Breaking Changes enthalten. Verwenden Sie ihn nicht für Produktions-Gateways.

Wir liefern stabile Builds in der Regel zuerst nach **beta** aus, testen sie dort und führen dann einen
expliziten Promotion-Schritt aus, der den geprüften Build nach `latest` verschiebt, ohne
die Versionsnummer zu ändern. Maintainer können bei Bedarf auch eine stabile Version
direkt nach `latest` veröffentlichen. Dist-tags sind die verbindliche Quelle für npm-
Installationen.

## Kanäle wechseln

```bash
openclaw update --channel stable
openclaw update --channel beta
openclaw update --channel dev
```

`--channel` speichert Ihre Auswahl dauerhaft in der Konfiguration (`update.channel`) und richtet die
Installationsmethode daran aus:

- **`stable`** (Paketinstallationen): aktualisiert über den npm-dist-tag `latest`.
- **`beta`** (Paketinstallationen): bevorzugt den npm-dist-tag `beta`, fällt aber auf
  `latest` zurück, wenn `beta` fehlt oder älter als der aktuelle stabile Tag ist.
- **`stable`** (git-Installationen): checkt den neuesten stabilen git-Tag aus.
- **`beta`** (git-Installationen): bevorzugt den neuesten beta-git-Tag, fällt aber auf
  den neuesten stabilen git-Tag zurück, wenn beta fehlt oder älter ist.
- **`dev`**: stellt einen git-Checkout sicher (Standard `~/openclaw`, überschreibbar mit
  `OPENCLAW_GIT_DIR`), wechselt zu `main`, rebaset auf upstream, baut und
  installiert die globale CLI aus diesem Checkout.

<Tip>
Wenn Sie stable und dev parallel nutzen möchten, behalten Sie zwei Klone und richten Sie Ihr Gateway auf den stabilen aus.
</Tip>

## Einmaliges Ansteuern einer Version oder eines Tags

Verwenden Sie `--tag`, um einen bestimmten dist-tag, eine Version oder eine Paketspezifikation für ein einzelnes
Update anzusteuern, **ohne** Ihren dauerhaft gespeicherten Kanal zu ändern:

```bash
# Install a specific version
openclaw update --tag 2026.4.1-beta.1

# Install from the beta dist-tag (one-off, does not persist)
openclaw update --tag beta

# Install from GitHub main branch (npm tarball)
openclaw update --tag main

# Install a specific npm package spec
openclaw update --tag openclaw@2026.4.1-beta.1
```

Hinweise:

- `--tag` gilt **nur für Paketinstallationen (npm)**. git-Installationen ignorieren es.
- Der Tag wird nicht dauerhaft gespeichert. Ihr nächstes `openclaw update` verwendet wie gewohnt Ihren konfigurierten
  Kanal.
- Downgrade-Schutz: Wenn die Zielversion älter als Ihre aktuelle Version ist,
  fragt OpenClaw nach einer Bestätigung (überspringen mit `--yes`).
- `--channel beta` unterscheidet sich von `--tag beta`: Der Kanalablauf kann auf
  stable/latest zurückfallen, wenn beta fehlt oder älter ist, während `--tag beta` den
  rohen `beta`-dist-tag für diesen einen Lauf ansteuert.

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
- Per npm installierte Plugins werden aktualisiert, nachdem das Kern-Update abgeschlossen ist.

## Aktuellen Status prüfen

```bash
openclaw update status
```

Zeigt den aktiven Kanal, die Installationsart (git oder Paket), die aktuelle Version und
die Quelle (Konfiguration, git-Tag, git-Branch oder Standard) an.

## Best Practices für Tags

- Taggen Sie Versionen, auf denen git-Checkouts landen sollen (`vYYYY.M.D` für stable,
  `vYYYY.M.D-beta.N` für beta).
- `vYYYY.M.D.beta.N` wird aus Kompatibilitätsgründen ebenfalls erkannt, bevorzugen Sie jedoch `-beta.N`.
- Veraltete `vYYYY.M.D-<patch>`-Tags werden weiterhin als stable (nicht beta) erkannt.
- Halten Sie Tags unveränderlich: Verschieben oder verwenden Sie einen Tag niemals erneut.
- npm-dist-tags bleiben die verbindliche Quelle für npm-Installationen:
  - `latest` -> stable
  - `beta` -> Kandidaten-Build oder beta-first-stable-Build
  - `dev` -> main-Snapshot (optional)

## Verfügbarkeit der macOS-App

Beta- und dev-Builds enthalten möglicherweise **keine** macOS-App-Version. Das ist in Ordnung:

- Der git-Tag und der npm-dist-tag können trotzdem veröffentlicht werden.
- Erwähnen Sie „kein macOS-Build für diese beta“ in den Versionshinweisen oder im Changelog.

## Verwandt

- [Aktualisieren](/de/install/updating)
- [Installer-Interna](/de/install/installer)
