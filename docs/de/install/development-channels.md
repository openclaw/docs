---
read_when:
    - Sie möchten zwischen stable/beta/dev wechseln
    - Sie möchten eine bestimmte Version, ein bestimmtes Tag oder einen bestimmten SHA festlegen
    - Sie taggen oder veröffentlichen Vorabversionen
sidebarTitle: Release Channels
summary: 'Stable-, Beta- und Entwicklungskanäle: Semantik, Wechsel, Fixierung und Tagging'
title: Release-Kanäle
x-i18n:
    generated_at: "2026-05-06T06:52:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: d2516165635eb8fbaddf19e07fbb591b659479b5226c2bf467e29247552ababb
    source_path: install/development-channels.md
    workflow: 16
---

OpenClaw liefert drei Update-Kanäle aus:

- **stable**: npm-Dist-Tag `latest`. Für die meisten Benutzer empfohlen.
- **beta**: npm-Dist-Tag `beta`, wenn dieser aktuell ist; wenn beta fehlt oder älter als
  das neueste stabile Release ist, fällt der Update-Ablauf auf `latest` zurück.
- **dev**: beweglicher Head von `main` (git). npm-Dist-Tag: `dev` (wenn veröffentlicht).
  Der Branch `main` ist für Experimente und aktive Entwicklung vorgesehen. Er kann
  unvollständige Funktionen oder Breaking Changes enthalten. Verwenden Sie ihn nicht für Produktions-Gateways.

Wir liefern stabile Builds normalerweise zuerst nach **beta** aus, testen sie dort und führen dann einen
expliziten Promotion-Schritt aus, der den geprüften Build ohne Änderung der Versionsnummer nach `latest` verschiebt.
Maintainer können bei Bedarf ein stabiles Release auch direkt nach `latest` veröffentlichen.
Dist-Tags sind die Source of Truth für npm-Installationen.

## Kanäle wechseln

```bash
openclaw update --channel stable
openclaw update --channel beta
openclaw update --channel dev
```

`--channel` speichert Ihre Auswahl dauerhaft in der Konfiguration (`update.channel`) und richtet die
Installationsmethode aus:

- **`stable`** (Paketinstallationen): aktualisiert über den npm-Dist-Tag `latest`.
- **`beta`** (Paketinstallationen): bevorzugt den npm-Dist-Tag `beta`, fällt aber auf
  `latest` zurück, wenn `beta` fehlt oder älter als der aktuelle stabile Tag ist.
- **`stable`** (git-Installationen): checkt den neuesten stabilen git-Tag aus.
- **`beta`** (git-Installationen): bevorzugt den neuesten beta-git-Tag, fällt aber auf
  den neuesten stabilen git-Tag zurück, wenn beta fehlt oder älter ist.
- **`dev`**: stellt ein git-Checkout sicher (Standard `~/openclaw`, überschreibbar mit
  `OPENCLAW_GIT_DIR`), wechselt zu `main`, rebasiert auf Upstream, baut und
  installiert die globale CLI aus diesem Checkout.

<Tip>
Wenn Sie stable und dev parallel verwenden möchten, behalten Sie zwei Klone und richten Ihr Gateway auf den stabilen Klon aus.
</Tip>

## Einmaliges Ziel für Version oder Tag

Verwenden Sie `--tag`, um für ein einzelnes Update ein bestimmtes Dist-Tag, eine Version oder eine Paketspezifikation anzusteuern,
**ohne** Ihren dauerhaft gespeicherten Kanal zu ändern:

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
- Der Tag wird nicht dauerhaft gespeichert. Ihr nächstes `openclaw update` verwendet wie gewohnt
  Ihren konfigurierten Kanal.
- Downgrade-Schutz: Wenn die Zielversion älter als Ihre aktuelle Version ist,
  fordert OpenClaw eine Bestätigung an (mit `--yes` überspringen).
- `--channel beta` unterscheidet sich von `--tag beta`: Der Kanalablauf kann auf
  stable/latest zurückfallen, wenn beta fehlt oder älter ist, während `--tag beta` für
  diesen einen Lauf direkt den rohen `beta`-Dist-Tag ansteuert.

## Dry Run

Zeigen Sie vorab an, was `openclaw update` tun würde, ohne Änderungen vorzunehmen:

```bash
openclaw update --dry-run
openclaw update --channel beta --dry-run
openclaw update --tag 2026.4.1-beta.1 --dry-run
openclaw update --dry-run --json
```

Der Dry Run zeigt den effektiven Kanal, die Zielversion, geplante Aktionen und
ob eine Downgrade-Bestätigung erforderlich wäre.

## Plugins und Kanäle

Wenn Sie mit `openclaw update` den Kanal wechseln, synchronisiert OpenClaw auch Plugin-Quellen:

- `dev` bevorzugt gebündelte Plugins aus dem git-Checkout.
- `stable` und `beta` stellen per npm installierte Plugin-Pakete wieder her.
- Per npm installierte Plugins werden aktualisiert, nachdem das Core-Update abgeschlossen ist.

## Aktuellen Status prüfen

```bash
openclaw update status
```

Zeigt den aktiven Kanal, die Installationsart (git oder Paket), die aktuelle Version und
die Quelle (Konfiguration, git-Tag, git-Branch oder Standard).

## Bewährte Verfahren für Tags

- Taggen Sie Releases, auf denen git-Checkouts landen sollen (`vYYYY.M.D` für stable,
  `vYYYY.M.D-beta.N` für beta).
- `vYYYY.M.D.beta.N` wird aus Kompatibilitätsgründen ebenfalls erkannt, bevorzugen Sie jedoch `-beta.N`.
- Legacy-Tags `vYYYY.M.D-<patch>` werden weiterhin als stable (nicht-beta) erkannt.
- Halten Sie Tags unveränderlich: Verschieben oder wiederverwenden Sie niemals einen Tag.
- npm-Dist-Tags bleiben die Source of Truth für npm-Installationen:
  - `latest` -> stable
  - `beta` -> Candidate-Build oder beta-first stabiler Build
  - `dev` -> main-Snapshot (optional)

## Verfügbarkeit der macOS-App

Beta- und dev-Builds enthalten möglicherweise **kein** macOS-App-Release. Das ist in Ordnung:

- Der git-Tag und der npm-Dist-Tag können trotzdem veröffentlicht werden.
- Weisen Sie in den Versionshinweisen oder im Changelog auf „kein macOS-Build für diese beta“ hin.

## Verwandt

- [Aktualisieren](/de/install/updating)
- [Installer-Interna](/de/install/installer)
