---
read_when:
    - Je wilt schakelen tussen stable/beta/dev
    - Je wilt een specifieke versie, tag of SHA vastzetten
    - Je tagt of publiceert prereleases
sidebarTitle: Release Channels
summary: 'Stabiele, beta- en dev-kanalen: semantiek, wisselen, vastzetten en taggen'
title: Releasekanalen
x-i18n:
    generated_at: "2026-05-07T01:52:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6579110cc5c0e62ef238d7e4200db5fea188f35dc9366a17b3cf92a58c8935cc
    source_path: install/development-channels.md
    workflow: 16
---

OpenClaw levert drie updatekanalen:

- **stable**: npm dist-tag `latest`. Aanbevolen voor de meeste gebruikers.
- **beta**: npm dist-tag `beta` wanneer deze actueel is; als beta ontbreekt of ouder is dan
  de nieuwste stabiele release, valt de updateflow terug op `latest`.
- **dev**: bewegende kop van `main` (git). npm dist-tag: `dev` (wanneer gepubliceerd).
  De `main`-branch is bedoeld voor experimenten en actieve ontwikkeling. Deze kan
  onvolledige functies of breaking changes bevatten. Gebruik deze niet voor productiegateways.

Meestal leveren we stabiele builds eerst naar **beta**, testen we ze daar en voeren we daarna een
expliciete promotiestap uit die de gecontroleerde build naar `latest` verplaatst zonder
het versienummer te wijzigen. Maintainers kunnen indien nodig ook een stabiele release
rechtstreeks naar `latest` publiceren. Dist-tags zijn de bron van waarheid voor npm-
installaties.

## Geplande maandelijkse supportlijnen

OpenClaw levert nog geen LTS- of maandelijks supportkanaal. We werken
toe naar SemVer-compatibele maandelijkse supportlijnen, zodat gebruikers op een rustigere
lijn kunnen blijven terwijl `latest` snel blijft bewegen.

De geplande versievorm is `YYYY.M.PATCH`:

- `YYYY` is het jaar.
- `M` is de maandelijkse releaselijn, zonder voorloopnul.
- `PATCH` wordt binnen die maandelijkse lijn verhoogd en kan indien nodig boven 100 uitkomen.

Voorbeelden van toekomstige tags:

- `v2026.6.0`, `v2026.6.1`, `v2026.6.2` voor de junilijn.
- `v2026.6.3-beta.1` voor een prerelease op de snelle/latest-trein.
- Een toekomstige dist-tag voor een supportlijn, zoals `stable-2026-6` of `lts-2026-6`, kan
  naar een maandelijkse lijn verwijzen, maar zo'n kanaal is vandaag niet beschikbaar.

Totdat die migratie is geland, blijven de publieke updatekanalen `stable`, `beta`
en `dev`.

## Kanalen wisselen

```bash
openclaw update --channel stable
openclaw update --channel beta
openclaw update --channel dev
```

`--channel` bewaart je keuze in de configuratie (`update.channel`) en stemt de
installatiemethode af:

- **`stable`** (pakketinstallaties): werkt bij via npm dist-tag `latest`.
- **`beta`** (pakketinstallaties): geeft de voorkeur aan npm dist-tag `beta`, maar valt terug op
  `latest` wanneer `beta` ontbreekt of ouder is dan de huidige stabiele tag.
- **`stable`** (git-installaties): checkt de nieuwste stabiele git-tag uit.
- **`beta`** (git-installaties): geeft de voorkeur aan de nieuwste beta-git-tag, maar valt terug op
  de nieuwste stabiele git-tag wanneer beta ontbreekt of ouder is.
- **`dev`**: zorgt voor een git-checkout (standaard `~/openclaw`, te overschrijven met
  `OPENCLAW_GIT_DIR`), schakelt over naar `main`, rebaset op upstream, bouwt en
  installeert de globale CLI vanuit die checkout.

<Tip>
Als je stable en dev parallel wilt gebruiken, houd dan twee clones bij en laat je Gateway naar de stabiele clone wijzen.
</Tip>

## Eenmalig een versie of tag targeten

Gebruik `--tag` om een specifieke dist-tag, versie of pakketspecificatie voor één
update te targeten **zonder** je bewaarde kanaal te wijzigen:

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

- `--tag` geldt alleen voor **pakketinstallaties (npm)**. Git-installaties negeren deze optie.
- De tag wordt niet bewaard. Je volgende `openclaw update` gebruikt zoals gebruikelijk
  je geconfigureerde kanaal.
- Downgradebescherming: als de doelversie ouder is dan je huidige versie,
  vraagt OpenClaw om bevestiging (overslaan met `--yes`).
- `--channel beta` verschilt van `--tag beta`: de kanaalflow kan terugvallen
  op stable/latest wanneer beta ontbreekt of ouder is, terwijl `--tag beta` de
  ruwe dist-tag `beta` target voor die ene run.

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

Wanneer je met `openclaw update` van kanaal wisselt, synchroniseert OpenClaw ook Plugin-
bronnen:

- `dev` geeft de voorkeur aan gebundelde Plugins uit de git-checkout.
- `stable` en `beta` herstellen via npm geïnstalleerde Plugin-pakketten.
- Via npm geïnstalleerde Plugins worden bijgewerkt nadat de core-update is voltooid.

## Huidige status controleren

```bash
openclaw update status
```

Toont het actieve kanaal, het installatietype (git of pakket), de huidige versie en
de bron (configuratie, git-tag, git-branch of standaardwaarde).

## Best practices voor tagging

- Tag releases waarop je git-checkouts wilt laten landen (`vYYYY.M.D` voor huidige
  stabiele releases, `vYYYY.M.D-beta.N` voor huidige beta-releases).
- `vYYYY.M.D.beta.N` wordt ook herkend voor compatibiliteit, maar geef de voorkeur aan `-beta.N`.
- Legacy `vYYYY.M.D-<patch>`-tags worden nog steeds herkend als stabiel (niet-beta),
  maar het geplande maandelijkse supportmodel gebruikt normale patchnummers
  (`vYYYY.M.PATCH`) in plaats van een correctiesuffix met een koppelteken.
- Houd tags onveranderlijk: verplaats of hergebruik een tag nooit.
- npm dist-tags blijven de bron van waarheid voor npm-installaties:
  - `latest` -> stable
  - `beta` -> kandidaatbuild of stable-build die eerst via beta gaat
  - `dev` -> main-snapshot (optioneel)

## Beschikbaarheid van de macOS-app

Beta- en dev-builds bevatten mogelijk **geen** macOS-apprelease. Dat is OK:

- De git-tag en npm dist-tag kunnen nog steeds worden gepubliceerd.
- Vermeld "geen macOS-build voor deze beta" in releasenotes of changelog.

## Gerelateerd

- [Bijwerken](/nl/install/updating)
- [Interne werking van het installatieprogramma](/nl/install/installer)
