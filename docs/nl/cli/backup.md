---
read_when:
    - Je wilt een volwaardig back-uparchief voor de lokale OpenClaw-status
    - Je wilt vooraf bekijken welke paden zouden worden meegenomen voordat je reset of de-installeert
summary: CLI-referentie voor `openclaw backup` (lokale back-uparchieven maken)
title: Back-up
x-i18n:
    generated_at: "2026-04-29T22:30:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5c16f953bb32a1613181448f0e4c6ba8777383bce95bddc856dc7e1c3afe8550
    source_path: cli/backup.md
    workflow: 16
---

# `openclaw backup`

Maak een lokaal back-uparchief aan voor OpenClaw-status, configuratie, auth-profielen, kanaal-/providerreferenties, sessies en optioneel werkruimten.

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
- De standaarduitvoer is een `.tar.gz`-archief met tijdstempel in de huidige werkmap.
- Als de huidige werkmap zich in een bronstructuur bevindt waarvan een back-up wordt gemaakt, valt OpenClaw terug op je thuismap als standaardlocatie voor het archief.
- Bestaande archiefbestanden worden nooit overschreven.
- Uitvoerpaden binnen de bronstatus-/werkruimtestructuren worden geweigerd om zelfopname te voorkomen.
- `openclaw backup verify <archive>` valideert dat het archief precies één hoofdmanifest bevat, weigert archiefpaden met traversalsyntaxis en controleert dat elke in het manifest gedeclareerde payload in de tarball bestaat.
- `openclaw backup create --verify` voert die validatie direct uit nadat het archief is geschreven.
- `openclaw backup create --only-config` maakt alleen een back-up van het actieve JSON-configuratiebestand.

## Waarvan een back-up wordt gemaakt

`openclaw backup create` plant back-upbronnen vanuit je lokale OpenClaw-installatie:

- De statusmap die wordt geretourneerd door de lokale statusresolver van OpenClaw, meestal `~/.openclaw`
- Het actieve configuratiebestandspad
- De opgeloste map `credentials/` wanneer die buiten de statusmap bestaat
- Werkruimtemappen die uit de huidige configuratie worden ontdekt, tenzij je `--no-include-workspace` doorgeeft

Modelauth-profielen maken al deel uit van de statusmap onder
`agents/<agentId>/agent/auth-profiles.json`, dus ze vallen normaal onder de
statusback-upvermelding.

Als je `--only-config` gebruikt, slaat OpenClaw status-, referentiemap- en werkruimtedetectie over en archiveert het alleen het actieve configuratiebestandspad.

OpenClaw canonicaliseert paden voordat het archief wordt gebouwd. Als de configuratie,
de referentiemap of een werkruimte al binnen de statusmap staat,
worden ze niet gedupliceerd als afzonderlijke back-upbronnen op topniveau. Ontbrekende paden worden
overgeslagen.

De archiefpayload slaat bestandsinhoud uit die bronstrukturen op, en de ingesloten `manifest.json` registreert de opgeloste absolute bronpaden plus de archiefindeling die voor elk asset wordt gebruikt.

Geïnstalleerde Plugin-bron- en manifestbestanden onder de
`extensions/`-structuur van de statusmap worden opgenomen, maar hun geneste
`node_modules/`-afhankelijkheidsstructuren worden overgeslagen. Die afhankelijkheden zijn opnieuw opbouwbare installatieartefacten; gebruik na het
herstellen van een archief `openclaw plugins update <id>` of installeer de Plugin opnieuw
met `openclaw plugins install <spec> --force` wanneer een herstelde Plugin
ontbrekende afhankelijkheden meldt.

## Gedrag bij ongeldige configuratie

`openclaw backup` omzeilt bewust de normale configuratie-preflight zodat het nog steeds kan helpen tijdens herstel. Omdat werkruimtedetectie afhankelijk is van een geldige configuratie, faalt `openclaw backup create` nu snel wanneer het configuratiebestand bestaat maar ongeldig is en werkruimteback-up nog steeds is ingeschakeld.

Als je in die situatie toch een gedeeltelijke back-up wilt, voer dan opnieuw uit:

```bash
openclaw backup create --no-include-workspace
```

Daardoor blijven status, configuratie en de externe referentiemap binnen scope, terwijl
werkruimtedetectie volledig wordt overgeslagen.

Als je alleen een kopie van het configuratiebestand zelf nodig hebt, werkt `--only-config` ook wanneer de configuratie misvormd is, omdat het niet vertrouwt op het parsen van de configuratie voor werkruimtedetectie.

## Grootte en prestaties

OpenClaw dwingt geen ingebouwde maximale back-upgrootte of limiet per bestand af.

Praktische limieten komen van de lokale machine en het doelbestandssysteem:

- Beschikbare ruimte voor het schrijven van het tijdelijke archief plus het uiteindelijke archief
- Tijd om grote werkruimtestructuren te doorlopen en te comprimeren tot een `.tar.gz`
- Tijd om het archief opnieuw te scannen als je `openclaw backup create --verify` gebruikt of `openclaw backup verify` uitvoert
- Bestandssysteemgedrag op het doelpad. OpenClaw geeft de voorkeur aan een publicatiestap met harde koppeling zonder overschrijven en valt terug op exclusief kopiëren wanneer harde koppelingen niet worden ondersteund

Grote werkruimten zijn meestal de belangrijkste oorzaak van archiefgrootte. Als je een kleinere of snellere back-up wilt, gebruik dan `--no-include-workspace`.

Gebruik `--only-config` voor het kleinste archief.

## Gerelateerd

- [CLI-referentie](/nl/cli)
