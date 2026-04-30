---
read_when:
    - Sie möchten zwischen stable/beta/dev wechseln
    - Sie möchten eine bestimmte Version, ein bestimmtes Tag oder einen bestimmten SHA festlegen
    - Sie taggen oder veröffentlichen Vorabversionen
sidebarTitle: Release Channels
summary: 'Stabile, Beta- und Entwicklungskanäle: Semantik, Wechsel, Pinning und Tagging'
title: Release-Kanäle
x-i18n:
    generated_at: "2026-04-30T06:59:54Z"
    model: gpt-5.5
    provider: openai
    source_hash: 741d8ed2a1599264e1b41a99e81fac4b06d14cb026aa945a8757b15e5733f682
    source_path: install/development-channels.md
    workflow: 16
---

# Entwicklungskanäle

OpenClaw veröffentlicht drei Update-Kanäle:

- **stable**: npm dist-tag `latest`. Für die meisten Benutzer empfohlen.
- **beta**: npm dist-tag `beta`, wenn er aktuell ist; fehlt beta oder ist älter als
  die neueste stabile Version, fällt der Update-Ablauf auf `latest` zurück.
- **dev**: beweglicher Stand von `main` (git). npm dist-tag: `dev` (wenn veröffentlicht).
  Der Branch `main` ist für Experimente und aktive Entwicklung vorgesehen. Er kann
  unvollständige Funktionen oder Breaking Changes enthalten. Verwenden Sie ihn nicht für Produktions-Gateways.

Wir veröffentlichen stabile Builds normalerweise zuerst nach **beta**, testen sie dort und führen dann einen
expliziten Promotion-Schritt aus, der den geprüften Build ohne Änderung der Versionsnummer nach `latest`
verschiebt. Maintainer können bei Bedarf auch eine stabile Version direkt
nach `latest` veröffentlichen. Dist-tags sind die maßgebliche Quelle für npm-Installationen.

## Kanäle wechseln

```bash
openclaw update --channel stable
openclaw update --channel beta
openclaw update --channel dev
```

`--channel` speichert Ihre Auswahl in der Konfiguration (`update.channel`) und gleicht die
Installationsmethode ab:

- **`stable`** (Paketinstallationen): Updates über npm dist-tag `latest`.
- **`beta`** (Paketinstallationen): bevorzugt npm dist-tag `beta`, fällt aber auf
  `latest` zurück, wenn `beta` fehlt oder älter als der aktuelle stabile Tag ist.
- **`stable`** (git-Installationen): checkt den neuesten stabilen git-Tag aus.
- **`beta`** (git-Installationen): bevorzugt den neuesten beta-git-Tag, fällt aber auf
  den neuesten stabilen git-Tag zurück, wenn beta fehlt oder älter ist.
- **`dev`**: stellt einen git-Checkout sicher (standardmäßig `~/openclaw`, überschreibbar mit
  `OPENCLAW_GIT_DIR`), wechselt zu `main`, führt ein Rebase auf upstream aus, baut und
  installiert die globale CLI aus diesem Checkout.

<Tip>
Wenn Sie stable und dev parallel verwenden möchten, behalten Sie zwei Klone und richten Sie Ihr Gateway auf den stabilen aus.
</Tip>

## Einmaliges Ziel für Version oder Tag

Verwenden Sie `--tag`, um für ein einzelnes Update einen bestimmten dist-tag, eine Version oder eine Paketspezifikation anzusteuern,
**ohne** Ihren gespeicherten Kanal zu ändern:

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

- `--tag` gilt **nur für Paketinstallationen (npm)**. Git-Installationen ignorieren es.
- Der Tag wird nicht gespeichert. Ihr nächstes `openclaw update` verwendet wie gewohnt Ihren konfigurierten
  Kanal.
- Downgrade-Schutz: Wenn die Zielversion älter als Ihre aktuelle Version ist,
  fragt OpenClaw nach Bestätigung (überspringen mit `--yes`).
- `--channel beta` unterscheidet sich von `--tag beta`: Der Kanalablauf kann auf
  stable/latest zurückfallen, wenn beta fehlt oder älter ist, während `--tag beta` für diesen einen Lauf den
  rohen dist-tag `beta` ansteuert.

## Testlauf

Zeigen Sie eine Vorschau dessen an, was `openclaw update` ohne Änderungen tun würde:

```bash
openclaw update --dry-run
openclaw update --channel beta --dry-run
openclaw update --tag 2026.4.1-beta.1 --dry-run
openclaw update --dry-run --json
```

Der Testlauf zeigt den effektiven Kanal, die Zielversion, die geplanten Aktionen und
ob eine Downgrade-Bestätigung erforderlich wäre.

## Plugins und Kanäle

Wenn Sie Kanäle mit `openclaw update` wechseln, synchronisiert OpenClaw auch Plugin-
Quellen:

- `dev` bevorzugt gebündelte Plugins aus dem git-Checkout.
- `stable` und `beta` stellen über npm installierte Plugin-Pakete wieder her.
- Über npm installierte Plugins werden aktualisiert, nachdem das Core-Update abgeschlossen ist.

## Aktuellen Status prüfen

```bash
openclaw update status
```

Zeigt den aktiven Kanal, die Installationsart (git oder Paket), die aktuelle Version und
die Quelle (Konfiguration, git-Tag, git-Branch oder Standard).

## Best Practices für Tagging

- Taggen Sie Releases, auf denen git-Checkouts landen sollen (`vYYYY.M.D` für stable,
  `vYYYY.M.D-beta.N` für beta).
- `vYYYY.M.D.beta.N` wird aus Kompatibilitätsgründen ebenfalls erkannt, aber bevorzugen Sie `-beta.N`.
- Legacy-Tags `vYYYY.M.D-<patch>` werden weiterhin als stable (nicht beta) erkannt.
- Halten Sie Tags unveränderlich: Verschieben oder wiederverwenden Sie niemals einen Tag.
- npm dist-tags bleiben die maßgebliche Quelle für npm-Installationen:
  - `latest` -> stable
  - `beta` -> Kandidaten-Build oder beta-first stable-Build
  - `dev` -> main-Snapshot (optional)

## Verfügbarkeit der macOS-App

Beta- und dev-Builds enthalten möglicherweise **keine** macOS-App-Version. Das ist in Ordnung:

- Der git-Tag und der npm dist-tag können dennoch veröffentlicht werden.
- Weisen Sie in Release Notes oder Changelog darauf hin: „kein macOS-Build für diese beta“.

## Verwandte Themen

- [Aktualisieren](/de/install/updating)
- [Installer-Interna](/de/install/installer)
