---
read_when:
    - Je wilt wisselen tussen stable/beta/dev
    - Je wilt een specifieke versie, tag of SHA vastzetten
    - Je tagt of publiceert prereleases
sidebarTitle: Release Channels
summary: 'Stabiele, bèta- en dev-kanalen: semantiek, overschakelen, vastzetten en taggen'
title: Releasekanalen
x-i18n:
    generated_at: "2026-06-27T17:42:16Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7b5b0b8b43dd15b3fdd83d28c5d0292d260594325ad6e6e95533720ba3e59277
    source_path: install/development-channels.md
    workflow: 16
---

OpenClaw levert drie updatekanalen:

- **stable**: npm dist-tag `latest`. Aanbevolen voor de meeste gebruikers.
- **beta**: npm dist-tag `beta` wanneer die actueel is; als beta ontbreekt of ouder is dan
  de nieuwste stabiele release, valt de updateflow terug op `latest`.
- **dev**: bewegende head van `main` (git). npm dist-tag: `dev` (wanneer gepubliceerd).
  De `main`-branch is bedoeld voor experimenten en actieve ontwikkeling. Deze kan
  onvolledige functies of breaking changes bevatten. Gebruik deze niet voor productie-gateways.

We leveren stabiele builds meestal eerst naar **beta**, testen ze daar en voeren daarna een
expliciete promotiestap uit die de gecontroleerde build naar `latest` verplaatst zonder
het versienummer te wijzigen. Maintainers kunnen indien nodig ook een stabiele release
rechtstreeks naar `latest` publiceren. Dist-tags zijn de bron van waarheid voor npm-
installaties.

## Van kanaal wisselen

```bash
openclaw update --channel stable
openclaw update --channel beta
openclaw update --channel dev
```

`--channel` bewaart je keuze in de configuratie (`update.channel`) en stemt de
installatiemethode daarop af:

- **`stable`** (pakketinstallaties): updates via npm dist-tag `latest`.
- **`beta`** (pakketinstallaties): geeft de voorkeur aan npm dist-tag `beta`, maar valt terug op
  `latest` wanneer `beta` ontbreekt of ouder is dan de huidige stabiele tag.
- **`stable`** (git-installaties): checkt de nieuwste stabiele git-tag uit, met uitsluiting van
  semver-prerelease-tags zoals `-alpha.N`, `-beta.N`, `-rc.N`, `-dev.N`,
  `-next.N`, `-preview.N`, `-canary.N`, `-nightly.N` en andere prerelease-
  suffixen.
- **`beta`** (git-installaties): geeft de voorkeur aan de nieuwste beta-git-tag, maar valt terug op
  de nieuwste stabiele git-tag wanneer beta ontbreekt of ouder is.
- **`dev`**: zorgt voor een git-checkout (standaard `~/openclaw`, of
  `$OPENCLAW_HOME/openclaw` wanneer `OPENCLAW_HOME` is ingesteld; overschrijf met
  `OPENCLAW_GIT_DIR`), schakelt over naar `main`, rebaset op upstream, bouwt en
  installeert de globale CLI vanuit die checkout.

<Tip>
Als je stable en dev parallel wilt gebruiken, houd dan twee clones aan en wijs je gateway naar de stabiele.
</Tip>

## Eenmalig een versie of tag targeten

Gebruik `--tag` om een specifieke dist-tag, versie of pakketspecificatie te targeten voor één
update **zonder** je opgeslagen kanaal te wijzigen:

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

Opmerkingen:

- `--tag` is alleen van toepassing op **pakketinstallaties (npm)**. Git-installaties negeren dit.
- De tag wordt niet opgeslagen. Je volgende `openclaw update` gebruikt zoals gebruikelijk
  je geconfigureerde kanaal.
- Voor pakketinstallaties verpakt OpenClaw GitHub/git-bronspecificaties vooraf in een
  tijdelijke tarball vóór de gefaseerde npm-installatie. Gebruik `--channel dev` of
  `--install-method git --version main` wanneer je de bewegende `main`-
  checkout als je permanente installatie wilt.
- Downgradebescherming: als de doelversie ouder is dan je huidige versie,
  vraagt OpenClaw om bevestiging (sla over met `--yes`).
- `--channel beta` verschilt van `--tag beta`: de kanaalflow kan terugvallen op
  stable/latest wanneer beta ontbreekt of ouder is, terwijl `--tag beta` de
  ruwe `beta`-dist-tag target voor die ene run.

## Dry run

Bekijk vooraf wat `openclaw update` zou doen zonder wijzigingen aan te brengen:

```bash
openclaw update --dry-run
openclaw update --channel beta --dry-run
openclaw update --tag 2026.4.1-beta.1 --dry-run
openclaw update --dry-run --json
```

De dry run toont het effectieve kanaal, de doelversie, geplande acties en
of bevestiging voor een downgrade vereist zou zijn.

## Plugins en kanalen

Wanneer je met `openclaw update` van kanaal wisselt, synchroniseert OpenClaw ook Plugin-
bronnen:

- `dev` geeft de voorkeur aan gebundelde Plugins uit de git-checkout.
- `stable` en `beta` herstellen via npm geïnstalleerde Plugin-pakketten.
- Via npm geïnstalleerde Plugins worden bijgewerkt nadat de core-update is voltooid.

## Huidige status controleren

```bash
openclaw update status
```

Toont het actieve kanaal, installatietype (git of pakket), huidige versie en
bron (configuratie, git-tag, git-branch of standaard).

## Best practices voor taggen

- Tag releases waarop je git-checkouts wilt laten landen (`vYYYY.M.PATCH` voor stable,
  `vYYYY.M.PATCH-beta.N` voor beta; benoemde semver-prerelease-suffixen zoals
  `-alpha.N`, `-rc.N` en `-next.N` zijn geen stabiele doelen).
- Legacy numerieke stabiele tags zoals `vYYYY.M.PATCH-1` en `v1.0.1-1` worden nog steeds
  herkend als stabiele git-tags voor compatibiliteit.
- `vYYYY.M.PATCH.beta.N` wordt ook herkend voor compatibiliteit, maar geef de voorkeur aan `-beta.N`.
- Houd tags onveranderlijk: verplaats of hergebruik nooit een tag.
- npm dist-tags blijven de bron van waarheid voor npm-installaties:
  - `latest` -> stable
  - `beta` -> kandidaat-build of beta-eerst stabiele build
  - `dev` -> main-snapshot (optioneel)

## Beschikbaarheid van de macOS-app

Beta- en dev-builds bevatten mogelijk **geen** macOS-apprelease. Dat is OK:

- De git-tag en npm dist-tag kunnen nog steeds worden gepubliceerd.
- Vermeld "geen macOS-build voor deze beta" in release notes of changelog.

## Gerelateerd

- [Bijwerken](/nl/install/updating)
- [Installer-internals](/nl/install/installer)
