---
read_when:
    - Je wilt schakelen tussen stable/extended-stable/beta/dev
    - Je wilt een specifieke versie, tag of SHA vastzetten
    - U tagt of publiceert prereleases
sidebarTitle: Release Channels
summary: 'Stable-, extended-stable-, bèta- en dev-kanalen: semantiek, wisselen, vastzetten en taggen'
title: Releasekanalen
x-i18n:
    generated_at: "2026-07-12T09:02:42Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a99e31f5121c0ab8696e638cb10a7ce16e8f32c81e4b2bef1f703eef71191494
    source_path: install/development-channels.md
    workflow: 16
---

OpenClaw wordt via vier updatekanalen uitgebracht:

- **stable**: npm-dist-tag `latest`. Aanbevolen voor de meeste gebruikers.
- **extended-stable**: npm-dist-tag `extended-stable`. Een volledig nieuw pakketkanaal voor een eerdere, nog ondersteunde maand. Het is uitsluitend beschikbaar als pakket en installatie vindt alleen op de voorgrond plaats. Een opgeslagen selectie ontvangt alleen-lezen updatehints wanneer `update.checkOnStart` is ingeschakeld, maar past updates nooit automatisch toe.
- **beta**: npm-dist-tag `beta`. Valt terug op `latest` wanneer `beta` ontbreekt of ouder is dan de huidige stabiele release.
- **dev**: de verplaatsende kop van `main` (git). npm-dist-tag `dev` wanneer gepubliceerd. `main` is bedoeld voor experimenten en actieve ontwikkeling; deze kan onvolledige functies of ingrijpende wijzigingen bevatten. Gebruik deze niet voor Gateways in productie.

Stabiele builds worden doorgaans eerst via **beta** uitgebracht, daar gevalideerd en vervolgens zonder versieverhoging naar **latest** gepromoveerd. Onderhouders kunnen ook rechtstreeks naar `latest` publiceren. Dist-tags zijn de gezaghebbende bron voor npm-installaties.

## Van kanaal wisselen

```bash
openclaw update --channel stable
openclaw update --channel extended-stable
openclaw update --channel beta
openclaw update --channel dev
```

`--channel` slaat de keuze permanent op in `update.channel` in de configuratie en stuurt beide installatiepaden aan:

| Kanaal            | npm-/pakketinstallaties                                                                                                                                                                                                     | git-installaties                                                                                                                                                                                  |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `stable`          | dist-tag `latest`                                                                                                                                                                                                            | nieuwste stabiele git-tag (sluit `-alpha.N`, `-beta.N`, `-rc.N`, `-dev.N`, `-next.N`, `-preview.N`, `-canary.N`, `-nightly.N` en andere benoemde prerelease-achtervoegsels uit)                    |
| `extended-stable` | verwerkt de openbare npm-selector `extended-stable`, verifieert het exact geselecteerde pakket en installeert die exacte versie. Stopt bij fouten zonder terugval op `latest`, `beta` of `dev`.                              | niet ondersteund: OpenClaw laat de checkout ongewijzigd en vraagt u een pakketinstallatie te gebruiken                                                                                             |
| `beta`            | dist-tag `beta`, met terugval op `latest` wanneer `beta` ontbreekt of ouder is                                                                                                                                               | nieuwste bèta-git-tag, met terugval op de nieuwste stabiele git-tag wanneer de bèta ontbreekt of ouder is                                                                                          |
| `dev`             | dist-tag `dev` (zeldzaam; de meeste dev-gebruikers gebruiken git-installaties)                                                                                                                                               | haalt wijzigingen op, rebaset de checkout op de upstream-branch `main`, bouwt en installeert de globale CLI opnieuw                                                                               |

Voor `dev`-git-installaties is de standaardcheckout `~/openclaw` (of `$OPENCLAW_HOME/openclaw` wanneer `OPENCLAW_HOME` is ingesteld); overschrijf dit met `OPENCLAW_GIT_DIR`.

<Tip>
Gebruik twee afzonderlijke checkouts om stable en dev parallel te behouden en wijs elke Gateway naar zijn eigen checkout.
</Tip>

## Eenmalig een versie of tag kiezen

Gebruik `--tag` om voor één update een specifieke dist-tag, versie of pakketspecificatie te kiezen, **zonder** het opgeslagen kanaal te wijzigen:

```bash
# Een specifieke versie installeren
openclaw update --tag 2026.4.1-beta.1

# Installeren vanaf de beta-dist-tag (eenmalig, wordt niet opgeslagen)
openclaw update --tag beta

# Overschakelen naar de verplaatsende GitHub-main-checkout (permanent)
openclaw update --channel dev

# Een specifieke npm-pakketspecificatie installeren
openclaw update --tag openclaw@2026.4.1-beta.1

# Eenmalig installeren vanaf GitHub main zonder het kanaal op te slaan
openclaw update --tag main
```

Opmerkingen:

- `--tag` is **alleen van toepassing op pakketinstallaties (npm)**; git-installaties negeren deze optie.
- De tag wordt niet opgeslagen; de volgende `openclaw update` gebruikt het geconfigureerde kanaal.
- `--tag main` wordt voor die ene uitvoering toegewezen aan de npm-compatibele specificatie `github:openclaw/openclaw#main`. Gebruik voor een permanente, verplaatsende `main`-installatie `openclaw update --channel dev` (pakketinstallaties schakelen over naar een git-checkout), of installeer opnieuw met de git-methode van het installatieprogramma:
  `curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git --version main`.
  Het npm-installatiepad weigert GitHub-/git-brondoelen volledig en verwijst u in plaats daarvan naar de git-methode.
- Bescherming tegen downgraden: als de doelversie ouder is dan de huidige versie, vraagt OpenClaw om bevestiging (sla dit over met `--yes`).
- Extended-stable gebruikt altijd zijn geverifieerde, exacte pakketdoel. Het is geen eenmalige alias voor `--tag extended-stable` en `--tag` kan niet worden gecombineerd met een effectief extended-stable-kanaal.
- `--channel beta` verschilt van `--tag beta`: de kanaalprocedure kan terugvallen op stable/latest wanneer beta ontbreekt of ouder is, terwijl `--tag beta` voor die ene uitvoering altijd rechtstreeks de dist-tag `beta` kiest.

## Proefuitvoering

Bekijk vooraf wat `openclaw update` zou doen zonder wijzigingen aan te brengen:

```bash
openclaw update --dry-run
openclaw update --channel beta --dry-run
openclaw update --tag 2026.4.1-beta.1 --dry-run
openclaw update --dry-run --json
```

De proefuitvoering meldt het effectieve kanaal, de doelversie, de geplande acties en of bevestiging voor een downgrade vereist zou zijn.

## Plugins en kanalen

Wanneer u met `openclaw update` van kanaal wisselt, worden ook de Plugin-bronnen gesynchroniseerd:

- `dev` schakelt geïnstalleerde Plugins met een gebundelde tegenhanger terug naar hun gebundelde bron (git-checkout).
- `stable` en `beta` herstellen via npm of ClawHub geïnstalleerde Plugin-pakketten.
- `extended-stable` koppelt in aanmerking komende officiële npm-Plugins met kale/standaard- of `latest`-intentie aan de exact geïnstalleerde kernversie. Tijdens runtime worden geen `@extended-stable`-tags van Plugins opgevraagd.
- Via npm geïnstalleerde Plugins worden bijgewerkt nadat de kernupdate is voltooid.

## Huidige status controleren

```bash
openclaw update status
```

Toont het actieve kanaal (met de bron die dit heeft bepaald: configuratie, git-tag, git-branch, geïnstalleerde versie of standaardwaarde), het installatietype (git of pakket), de huidige versie en de beschikbaarheid van updates.

## Aanbevolen werkwijzen voor tags

- Tag releases waarop git-checkouts moeten uitkomen: `vYYYY.M.PATCH` voor stable en `vYYYY.M.PATCH-beta.N` voor beta. Benoemde prerelease-achtervoegsels zoals `-alpha.N`, `-rc.N` en `-next.N` zijn geen doelen voor stable of beta.
- Verouderde numerieke stable-tags zoals `vYYYY.M.PATCH-1` en `v1.0.1-1` worden voor compatibiliteit nog steeds als stabiele git-tags herkend.
- `vYYYY.M.PATCH.beta.N` (gescheiden door punten) wordt eveneens voor compatibiliteit herkend; geef de voorkeur aan `-beta.N`.
- Houd tags onveranderlijk: verplaats of hergebruik een tag nooit.
- npm-dist-tags blijven de gezaghebbende bron voor npm-installaties:
  - `latest` -> stable
  - `extended-stable` -> pakketrelease van een eerdere, nog ondersteunde maand
  - `beta` -> kandidaatbuild of stabiele build die eerst via beta wordt uitgebracht
  - `dev` -> momentopname van main (optioneel)

## Beschikbaarheid van de macOS-app

Beta- en dev-builds bevatten mogelijk **geen** release van de macOS-app. Dat is geen probleem:

- De git-tag en npm-dist-tag kunnen nog steeds afzonderlijk worden gepubliceerd.
- Vermeld "geen macOS-build voor deze beta" in de releaseopmerkingen of changelog.

## Gerelateerd

- [Bijwerken](/nl/install/updating)
- [Interne werking van het installatieprogramma](/nl/install/installer)
