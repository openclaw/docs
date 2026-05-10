---
read_when:
    - Je wilt een volwaardig back-uparchief voor de lokale OpenClaw-status
    - U wilt vooraf bekijken welke paden zouden worden opgenomen voordat u een reset of de-installatie uitvoert.
summary: CLI-referentie voor `openclaw backup` (lokale back-uparchieven aanmaken)
title: Back-up
x-i18n:
    generated_at: "2026-05-10T19:27:41Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2c95cf475a563ad4f0a2dbaeda504b265580545c9d3f6f71d2f4d2a183e76a5c
    source_path: cli/backup.md
    workflow: 16
---

# `openclaw backup`

Maak een lokaal back-uparchief voor OpenClaw-status, configuratie, authenticatieprofielen, inloggegevens voor kanalen/providers, sessies en optioneel werkruimten.

```bash
openclaw backup create
openclaw backup create --output ~/Backups
openclaw backup create --dry-run --json
openclaw backup create --verify
openclaw backup create --no-include-workspace
openclaw backup create --only-config
openclaw backup verify ./2026-03-09T00-00-00.000Z-openclaw-backup.tar.gz
```

## Opmerkingen

- Het archief bevat een `manifest.json`-bestand met de opgeloste bronpaden en archiefindeling.
- Standaard wordt een `.tar.gz`-archief met tijdstempel in de huidige werkdirectory gemaakt.
- Als de huidige werkdirectory zich binnen een geback-upte bronstructuur bevindt, valt OpenClaw terug op je thuismap als standaardlocatie voor het archief.
- Bestaande archiefbestanden worden nooit overschreven.
- Uitvoerpaden binnen de bronstructuren voor status/werkruimte worden geweigerd om zelfinsluiting te voorkomen.
- `openclaw backup verify <archive>` valideert dat het archief precies één rootmanifest bevat, weigert archiefpaden met traversal-stijl en controleert dat elke payload die in het manifest is gedeclareerd in de tarball bestaat.
- `openclaw backup create --verify` voert die validatie direct uit nadat het archief is geschreven.
- `openclaw backup create --only-config` maakt alleen een back-up van het actieve JSON-configuratiebestand.

## Waarvan een back-up wordt gemaakt

`openclaw backup create` plant back-upbronnen vanuit je lokale OpenClaw-installatie:

- De statusdirectory die door OpenClaw's lokale statusresolver wordt teruggegeven, meestal `~/.openclaw`
- Het actieve configuratiebestandspad
- De opgeloste `credentials/`-directory wanneer die buiten de statusdirectory bestaat
- Werkruimtedirectory's die uit de huidige configuratie worden ontdekt, tenzij je `--no-include-workspace` doorgeeft

Authenticatieprofielen voor modellen maken al deel uit van de statusdirectory onder
`agents/<agentId>/agent/auth-profiles.json`, dus ze vallen normaal gesproken onder de
statusback-upvermelding.

Als je `--only-config` gebruikt, slaat OpenClaw de ontdekking van status, credentials-directory en werkruimten over en archiveert het alleen het actieve configuratiebestandspad.

OpenClaw canonicaliseert paden voordat het archief wordt opgebouwd. Als de configuratie, de
credentials-directory of een werkruimte al binnen de statusdirectory staat,
worden ze niet gedupliceerd als afzonderlijke back-upbronnen op topniveau. Ontbrekende paden worden
overgeslagen.

De archiefpayload bewaart bestandsinhoud uit die bronstructuren, en het ingebedde `manifest.json` registreert de opgeloste absolute bronpaden plus de archiefindeling die voor elk asset wordt gebruikt.

Tijdens het maken van het archief slaat OpenClaw bekende bestanden met live-mutaties over die geen herstelwaarde hebben, waaronder actieve transcripts van agentsessies, Cron-runlogs, roulerende logs, bezorgwachtrijen, socket-/pid-/tempbestanden onder de statusdirectory en gerelateerde tempbestanden voor duurzame wachtrijen. Het JSON-resultaat bevat `skippedVolatileCount`, zodat automatisering kan zien hoeveel bestanden opzettelijk zijn weggelaten.

Geïnstalleerde Plugin-bron- en manifestbestanden onder de
`extensions/`-structuur van de statusdirectory worden opgenomen, maar hun geneste `node_modules/`-dependencystructuren
worden overgeslagen. Die dependencies zijn herbouwbare installatieartefacten; gebruik na
het herstellen van een archief `openclaw plugins update <id>` of installeer de Plugin opnieuw
met `openclaw plugins install <spec> --force` wanneer een herstelde Plugin
ontbrekende dependencies meldt.

## Gedrag bij ongeldige configuratie

`openclaw backup` omzeilt bewust de normale configuratiepreflight, zodat het nog steeds kan helpen tijdens herstel. Omdat ontdekking van werkruimten afhankelijk is van een geldige configuratie, faalt `openclaw backup create` nu snel wanneer het configuratiebestand bestaat maar ongeldig is en back-up van werkruimten nog steeds is ingeschakeld.

Als je in die situatie toch een gedeeltelijke back-up wilt, voer dan opnieuw uit:

```bash
openclaw backup create --no-include-workspace
```

Dat houdt status, configuratie en de externe credentials-directory binnen bereik terwijl
ontdekking van werkruimten volledig wordt overgeslagen.

Als je alleen een kopie van het configuratiebestand zelf nodig hebt, werkt `--only-config` ook wanneer de configuratie misvormd is, omdat het niet afhankelijk is van het parsen van de configuratie voor ontdekking van werkruimten.

## Grootte en prestaties

OpenClaw dwingt geen ingebouwde maximale back-upgrootte of limiet per bestand af.

Praktische limieten komen van de lokale machine en het doelbestandssysteem:

- Beschikbare ruimte voor het tijdelijk schrijven van het archief plus het uiteindelijke archief
- Tijd om grote werkruimtestructuren te doorlopen en ze te comprimeren tot een `.tar.gz`
- Tijd om het archief opnieuw te scannen als je `openclaw backup create --verify` gebruikt of `openclaw backup verify` uitvoert
- Bestandssysteemgedrag op het doelpad. OpenClaw geeft de voorkeur aan een publicatiestap met hard links zonder overschrijven en valt terug op exclusief kopiëren wanneer hard links niet worden ondersteund

Grote werkruimten zijn meestal de belangrijkste oorzaak van archiefgrootte. Als je een kleinere of snellere back-up wilt, gebruik dan `--no-include-workspace`.

Gebruik `--only-config` voor het kleinste archief.

## Gerelateerd

- [CLI-referentie](/nl/cli)
