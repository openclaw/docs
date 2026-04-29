---
read_when:
    - Je wilt wisselen tussen stable/beta/dev
    - Je wilt een specifieke versie, tag of SHA vastzetten
    - Je tagt of publiceert voorreleases
sidebarTitle: Release Channels
summary: 'Stabiele, beta- en dev-kanalen: semantiek, overschakelen, vastzetten en taggen'
title: Releasekanalen
x-i18n:
    generated_at: "2026-04-29T22:52:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: 741d8ed2a1599264e1b41a99e81fac4b06d14cb026aa945a8757b15e5733f682
    source_path: install/development-channels.md
    workflow: 16
---

# Ontwikkelingskanalen

OpenClaw levert drie updatekanalen:

- **stable**: npm dist-tag `latest`. Aanbevolen voor de meeste gebruikers.
- **beta**: npm dist-tag `beta` wanneer die actueel is; als beta ontbreekt of ouder is dan
  de nieuwste stabiele release, valt de updateflow terug op `latest`.
- **dev**: bewegende kop van `main` (git). npm dist-tag: `dev` (wanneer gepubliceerd).
  De `main`-branch is bedoeld voor experimenten en actieve ontwikkeling. Deze kan
  onvolledige functies of breaking changes bevatten. Gebruik deze niet voor productie-Gateways.

Meestal leveren we stabiele builds eerst aan **beta**, testen ze daar en voeren dan een
expliciete promotiestap uit die de gecontroleerde build naar `latest` verplaatst zonder
het versienummer te wijzigen. Maintainers kunnen indien nodig ook een stabiele release
direct naar `latest` publiceren. Dist-tags zijn de bron van waarheid voor npm-installaties.

## Van kanaal wisselen

```bash
openclaw update --channel stable
openclaw update --channel beta
openclaw update --channel dev
```

`--channel` bewaart je keuze in de configuratie (`update.channel`) en lijnt de
installatiemethode uit:

- **`stable`** (pakketinstallaties): werkt bij via npm dist-tag `latest`.
- **`beta`** (pakketinstallaties): geeft de voorkeur aan npm dist-tag `beta`, maar valt terug op
  `latest` wanneer `beta` ontbreekt of ouder is dan de huidige stabiele tag.
- **`stable`** (git-installaties): checkt de nieuwste stabiele git-tag uit.
- **`beta`** (git-installaties): geeft de voorkeur aan de nieuwste beta-git-tag, maar valt terug op
  de nieuwste stabiele git-tag wanneer beta ontbreekt of ouder is.
- **`dev`**: zorgt voor een git-checkout (standaard `~/openclaw`, overschrijf met
  `OPENCLAW_GIT_DIR`), schakelt over naar `main`, rebaset op upstream, bouwt en
  installeert de globale CLI vanuit die checkout.

<Tip>
Als je stable en dev parallel wilt gebruiken, houd dan twee clones aan en wijs je Gateway naar de stable-clone.
</Tip>

## Eenmalig op een versie of tag richten

Gebruik `--tag` om een specifieke dist-tag, versie of pakketspecificatie voor één
update te gebruiken **zonder** je bewaarde kanaal te wijzigen:

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

- `--tag` is alleen van toepassing op **pakketinstallaties (npm)**. Git-installaties negeren dit.
- De tag wordt niet bewaard. Je volgende `openclaw update` gebruikt zoals gebruikelijk
  je geconfigureerde kanaal.
- Downgradebescherming: als de doelversie ouder is dan je huidige versie,
  vraagt OpenClaw om bevestiging (overslaan met `--yes`).
- `--channel beta` verschilt van `--tag beta`: de kanaalflow kan terugvallen
  op stable/latest wanneer beta ontbreekt of ouder is, terwijl `--tag beta` de
  ruwe `beta`-dist-tag gebruikt voor die ene uitvoering.

## Dry run

Bekijk vooraf wat `openclaw update` zou doen zonder wijzigingen aan te brengen:

```bash
openclaw update --dry-run
openclaw update --channel beta --dry-run
openclaw update --tag 2026.4.1-beta.1 --dry-run
openclaw update --dry-run --json
```

De dry run toont het effectieve kanaal, de doelversie, geplande acties en
of een downgradebevestiging vereist zou zijn.

## Plugins en kanalen

Wanneer je met `openclaw update` van kanaal wisselt, synchroniseert OpenClaw ook Plugin-bronnen:

- `dev` geeft de voorkeur aan gebundelde Plugins uit de git-checkout.
- `stable` en `beta` herstellen via npm geïnstalleerde Plugin-pakketten.
- Via npm geïnstalleerde Plugins worden bijgewerkt nadat de core-update is voltooid.

## Huidige status controleren

```bash
openclaw update status
```

Toont het actieve kanaal, installatietype (git of pakket), huidige versie en
bron (configuratie, git-tag, git-branch of standaardwaarde).

## Best practices voor tags

- Tag releases waarop je git-checkouts wilt laten landen (`vYYYY.M.D` voor stable,
  `vYYYY.M.D-beta.N` voor beta).
- `vYYYY.M.D.beta.N` wordt ook herkend voor compatibiliteit, maar geef de voorkeur aan `-beta.N`.
- Verouderde `vYYYY.M.D-<patch>`-tags worden nog steeds herkend als stable (niet-beta).
- Houd tags onveranderlijk: verplaats of hergebruik een tag nooit.
- npm dist-tags blijven de bron van waarheid voor npm-installaties:
  - `latest` -> stable
  - `beta` -> kandidaat-build of beta-first stable-build
  - `dev` -> main-snapshot (optioneel)

## Beschikbaarheid van de macOS-app

Beta- en dev-builds bevatten mogelijk **geen** macOS-apprelease. Dat is OK:

- De git-tag en npm dist-tag kunnen nog steeds worden gepubliceerd.
- Vermeld "geen macOS-build voor deze beta" in releaseopmerkingen of changelog.

## Gerelateerd

- [Bijwerken](/nl/install/updating)
- [Interne werking van installer](/nl/install/installer)
