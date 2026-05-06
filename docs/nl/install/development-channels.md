---
read_when:
    - Je wilt schakelen tussen stabiel/beta/dev
    - Je wilt een specifieke versie, tag of SHA vastpinnen
    - Je tagt of publiceert voorreleases
sidebarTitle: Release Channels
summary: 'Stabiele, beta- en dev-kanalen: semantiek, wisselen, vastzetten en taggen'
title: Releasekanalen
x-i18n:
    generated_at: "2026-05-06T09:19:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: d2516165635eb8fbaddf19e07fbb591b659479b5226c2bf467e29247552ababb
    source_path: install/development-channels.md
    workflow: 16
---

OpenClaw levert drie updatekanalen:

- **stable**: npm dist-tag `latest`. Aanbevolen voor de meeste gebruikers.
- **beta**: npm dist-tag `beta` wanneer deze actueel is; als beta ontbreekt of ouder is dan
  de nieuwste stabiele release, valt de updateflow terug op `latest`.
- **dev**: bewegende kop van `main` (git). npm dist-tag: `dev` (wanneer gepubliceerd).
  De `main`-branch is bedoeld voor experimenten en actieve ontwikkeling. Deze kan
  onvolledige functies of breaking changes bevatten. Gebruik deze niet voor productie-Gateways.

We leveren stabiele builds meestal eerst aan **beta**, testen ze daar, en voeren daarna een
expliciete promotiestap uit die de gecontroleerde build naar `latest` verplaatst zonder
het versienummer te wijzigen. Maintainers kunnen indien nodig ook rechtstreeks een stabiele release
naar `latest` publiceren. Dist-tags zijn de bron van waarheid voor npm-installaties.

## Wisselen van kanaal

```bash
openclaw update --channel stable
openclaw update --channel beta
openclaw update --channel dev
```

`--channel` bewaart je keuze in de configuratie (`update.channel`) en stemt de
installatiemethode daarop af:

- **`stable`** (pakketinstallaties): werkt bij via npm dist-tag `latest`.
- **`beta`** (pakketinstallaties): geeft de voorkeur aan npm dist-tag `beta`, maar valt terug op
  `latest` wanneer `beta` ontbreekt of ouder is dan de huidige stabiele tag.
- **`stable`** (git-installaties): checkt de nieuwste stabiele git-tag uit.
- **`beta`** (git-installaties): geeft de voorkeur aan de nieuwste beta-git-tag, maar valt terug op
  de nieuwste stabiele git-tag wanneer beta ontbreekt of ouder is.
- **`dev`**: zorgt voor een git-checkout (standaard `~/openclaw`, te overschrijven met
  `OPENCLAW_GIT_DIR`), schakelt naar `main`, rebaset op upstream, bouwt, en
  installeert de globale CLI vanuit die checkout.

<Tip>
Als je stable en dev parallel wilt gebruiken, houd dan twee clones aan en laat je Gateway naar de stabiele wijzen.
</Tip>

## Eenmalig richten op versie of tag

Gebruik `--tag` om voor een enkele update een specifieke dist-tag, versie of pakketspecificatie te kiezen
**zonder** je opgeslagen kanaal te wijzigen:

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

Opmerkingen:

- `--tag` geldt **alleen voor pakketinstallaties (npm)**. Git-installaties negeren dit.
- De tag wordt niet opgeslagen. Je volgende `openclaw update` gebruikt zoals gewoonlijk je geconfigureerde
  kanaal.
- Downgradebescherming: als de doelversie ouder is dan je huidige versie,
  vraagt OpenClaw om bevestiging (overslaan met `--yes`).
- `--channel beta` verschilt van `--tag beta`: de kanaalflow kan terugvallen
  naar stable/latest wanneer beta ontbreekt of ouder is, terwijl `--tag beta` zich voor die ene run richt op de
  ruwe `beta`-dist-tag.

## Dry run

Bekijk vooraf wat `openclaw update` zou doen zonder wijzigingen aan te brengen:

```bash
openclaw update --dry-run
openclaw update --channel beta --dry-run
openclaw update --tag 2026.4.1-beta.1 --dry-run
openclaw update --dry-run --json
```

De dry run toont het effectieve kanaal, de doelversie, geplande acties, en
of bevestiging voor een downgrade vereist zou zijn.

## Plugins en kanalen

Wanneer je met `openclaw update` van kanaal wisselt, synchroniseert OpenClaw ook Plugin-
bronnen:

- `dev` geeft de voorkeur aan gebundelde plugins uit de git-checkout.
- `stable` en `beta` herstellen via npm geïnstalleerde Plugin-pakketten.
- Via npm geïnstalleerde plugins worden bijgewerkt nadat de core-update is voltooid.

## Huidige status controleren

```bash
openclaw update status
```

Toont het actieve kanaal, installatietype (git of pakket), huidige versie, en
bron (configuratie, git-tag, git-branch, of standaard).

## Best practices voor tagging

- Tag releases waarop git-checkouts moeten uitkomen (`vYYYY.M.D` voor stable,
  `vYYYY.M.D-beta.N` voor beta).
- `vYYYY.M.D.beta.N` wordt ook herkend voor compatibiliteit, maar geef de voorkeur aan `-beta.N`.
- Verouderde `vYYYY.M.D-<patch>`-tags worden nog steeds herkend als stable (niet-beta).
- Houd tags onveranderlijk: verplaats of hergebruik een tag nooit.
- npm-dist-tags blijven de bron van waarheid voor npm-installaties:
  - `latest` -> stable
  - `beta` -> kandidaatbuild of beta-first stabiele build
  - `dev` -> main-snapshot (optioneel)

## Beschikbaarheid van macOS-app

Beta- en dev-builds bevatten mogelijk **geen** macOS-apprelease. Dat is in orde:

- De git-tag en npm-dist-tag kunnen nog steeds worden gepubliceerd.
- Vermeld "geen macOS-build voor deze beta" in releaseopmerkingen of changelog.

## Gerelateerd

- [Bijwerken](/nl/install/updating)
- [Interne werking van de installer](/nl/install/installer)
