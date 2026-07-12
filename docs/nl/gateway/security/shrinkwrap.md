---
read_when:
    - Je wilt weten wat npm shrinkwrap betekent in een OpenClaw-release
    - Je beoordeelt lockbestanden van pakketten, wijzigingen in afhankelijkheden of risico's voor de softwaretoeleveringsketen
    - Je valideert npm-pakketten van de hoofdmap of Plugins voordat je ze publiceert
summary: Heldere en technische uitleg over npm-shrinkwrap in OpenClaw-releases
title: npm-shrinkwrap
x-i18n:
    generated_at: "2026-07-12T08:57:59Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d1e6c0d4541da9220d50cde0b9db064e5a91b81d6562cb16ac697de7d4017098
    source_path: gateway/security/shrinkwrap.md
    workflow: 16
---

OpenClaw-broncodecheck-outs gebruiken `pnpm-lock.yaml`. Gepubliceerde OpenClaw-npm-pakketten gebruiken `npm-shrinkwrap.json`, het publiceerbare vergrendelingsbestand voor afhankelijkheden van npm, zodat pakketinstallaties de tijdens de release beoordeelde afhankelijkheidsgraaf gebruiken.

## Waarom dit belangrijk is

Shrinkwrap is een bewijsstuk voor de afhankelijkheidsstructuur die met een npm-pakket wordt geleverd: het vertelt npm welke exacte transitieve versies moeten worden geïnstalleerd.

| Bestand               | Waar het van belang is      | Wat het betekent                         |
| --------------------- | --------------------------- | ---------------------------------------- |
| `pnpm-lock.yaml`      | OpenClaw-broncodecheck-out  | Afhankelijkheidsgraaf voor beheerders    |
| `npm-shrinkwrap.json` | Gepubliceerd npm-pakket     | npm-installatiegraaf voor gebruikers     |
| `package-lock.json`   | Lokale npm-apps             | Niet het publicatiecontract van OpenClaw |

Voor OpenClaw-releases betekent dit:

- het gepubliceerde pakket vraagt npm niet om tijdens de installatie een nieuwe afhankelijkheidsgraaf te bedenken;
- wijzigingen in afhankelijkheden kunnen worden beoordeeld omdat ze in een diff van een vergrendelingsbestand terechtkomen;
- de releasevalidatie test dezelfde graaf die gebruikers zullen installeren;
- verrassingen met de pakketgrootte of native afhankelijkheden komen vóór publicatie aan het licht.

Shrinkwrap is geen sandbox. Het maakt een afhankelijkheid op zichzelf niet veilig en vervangt geen hostisolatie, `openclaw security audit`, herkomstgegevens van pakketten of installatierooktests.

OpenClaw is een Gateway, Plugin-host, modelrouter en agentruntime, dus een standaardinstallatie beïnvloedt de opstarttijd, het schijfgebruik, downloads van native pakketten en de blootstelling aan risico's in de toeleveringsketen. Shrinkwrap biedt releasebeoordelingen een stabiele grens: beoordelaars zien wijzigingen in transitieve afhankelijkheden, validators wijzen onverwachte afwijkingen in vergrendelingsbestanden af en Plugin-pakketten bevatten hun eigen vergrendelde afhankelijkheidsgraaf in plaats van op het hoofdpakket te vertrouwen.

## Genereren en controleren

Het npm-hoofdpakket `openclaw`, npm-Plugin-pakketten die eigendom zijn van OpenClaw (bijvoorbeeld `@openclaw/discord`) en publiceerbare werkruimtepakketten zoals [`@openclaw/ai`](/reference/openclaw-ai) bevatten bij publicatie `npm-shrinkwrap.json`. Werkruimteafhankelijkheden worden weggelaten uit de shrinkwrap van het hoofdpakket, omdat ze naast het hoofdpakket worden gepubliceerd; elk publiceerbaar werkruimtepakket legt in plaats daarvan zijn eigen transitieve structuur vast. Geschikte Plugin-pakketten kunnen ook worden gepubliceerd met expliciete `bundledDependencies`, waarbij hun runtime-afhankelijkheidsbestanden in het Plugin-tar-archief worden opgenomen in plaats van uitsluitend op omzetting tijdens de installatie te vertrouwen.

```bash
# Alle door shrinkwrap beheerde pakketten (hoofdmap + publiceerbare Plugins)
pnpm deps:shrinkwrap:generate
pnpm deps:shrinkwrap:check

# Alleen het hoofdpakket
pnpm deps:shrinkwrap:root:generate
pnpm deps:shrinkwrap:root:check

# Alleen pakketten waarop de huidige wijzigingenset van invloed is
pnpm deps:shrinkwrap:changed:generate
pnpm deps:shrinkwrap:changed:check
```

De generator zet npm's publiceerbare vergrendelingsindeling om, maar wijst gegenereerde pakketversies af die nog niet in `pnpm-lock.yaml` voorkomen. Daardoor blijven de grenzen voor de leeftijd van pnpm-afhankelijkheden en de beoordeling van overschrijvingen en patches intact.

Behandel deze als beveiligingsgevoelig:

- `pnpm-lock.yaml`
- `npm-shrinkwrap.json`
- meegeleverde afhankelijkheidspayloads van Plugins
- elke diff van `package-lock.json`

OpenClaw-pakketvalidators vereisen shrinkwrap in nieuwe tar-archieven van het hoofdpakket en wijzen `package-lock.json` af voor gepubliceerde pakketten. Het npm-publicatiepad voor Plugins controleert de lokale shrinkwrap van de Plugin, installeert de lokale meegeleverde afhankelijkheden van het pakket en maakt of publiceert het pakket vervolgens.

## Een gepubliceerd pakket inspecteren

Hoofdpakket:

```bash
npm pack openclaw@<version> --json --pack-destination /tmp/openclaw-pack
tar -tf /tmp/openclaw-pack/openclaw-<version>.tgz | grep '^package/npm-shrinkwrap.json$'
```

Plugin-pakket:

```bash
npm pack @openclaw/discord@<version> --json --pack-destination /tmp/openclaw-plugin-pack
tar -tf /tmp/openclaw-plugin-pack/openclaw-discord-<version>.tgz | grep '^package/npm-shrinkwrap.json$'
tar -tf /tmp/openclaw-plugin-pack/openclaw-discord-<version>.tgz | grep '^package/node_modules/'
```

Achtergrondinformatie: [npm-shrinkwrap.json](https://docs.npmjs.com/cli/v11/configuring-npm/npm-shrinkwrap-json).
