---
read_when:
    - Je wilt een eersteklas back-uparchief voor lokale OpenClaw-status
    - Je wilt vooraf bekijken welke paden zouden worden meegenomen vóór resetten of verwijderen
summary: CLI-referentie voor `openclaw backup` (maak lokale back-uparchieven)
title: Back-up
x-i18n:
    generated_at: "2026-06-27T17:18:09Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1ac7d8e4babd24f1c46ac48dca6c413e12361173df83cfe485dd3945ccd30c3e
    source_path: cli/backup.md
    workflow: 16
---

# `openclaw backup`

Maak een lokaal back-uparchief voor OpenClaw-status, configuratie, auth-profielen, kanaal-/providerreferenties, sessies en optioneel werkruimten.

```bash
openclaw backup create
openclaw backup create --output ~/Backups
openclaw backup create --dry-run --json
openclaw backup create --verify
openclaw backup create --no-include-workspace
openclaw backup create --only-config
openclaw backup verify ./2026-03-09T08-00-00.000+08-00-openclaw-backup.tar.gz
```

## Opmerkingen

- Het archief bevat een `manifest.json`-bestand met de opgeloste bronpaden en archiefindeling.
- Standaarduitvoer is een `.tar.gz`-archief met tijdstempel in de huidige werkmap.
- Back-upbestandsnamen met tijdstempel gebruiken de lokale tijdzone van je machine en bevatten de UTC-offset.
- Als de huidige werkmap zich binnen een bronstructuur bevindt waarvan een back-up wordt gemaakt, valt OpenClaw terug op je thuismap als standaardarchieflocatie.
- Bestaande archiefbestanden worden nooit overschreven.
- Uitvoerpaden binnen de bronstatus-/werkruimtestructuren worden geweigerd om zelfopname te voorkomen.
- `openclaw backup verify <archive>` valideert dat het archief precies één rootmanifest bevat, weigert archiefpaden in traversal-stijl en controleert of elke in het manifest gedeclareerde payload in de tarball bestaat.
- `openclaw backup create --verify` voert die validatie direct uit na het schrijven van het archief.
- `openclaw backup create --only-config` maakt alleen een back-up van het actieve JSON-configuratiebestand.

## Waarvan een back-up wordt gemaakt

`openclaw backup create` plant back-upbronnen vanuit je lokale OpenClaw-installatie:

- De statusmap die wordt geretourneerd door de lokale statusresolver van OpenClaw, meestal `~/.openclaw`
- Het actieve configuratiebestandspad
- De opgeloste map `credentials/` wanneer die buiten de statusmap bestaat
- Werkruimtemappen die uit de huidige configuratie zijn ontdekt, tenzij je `--no-include-workspace` doorgeeft

Model-auth-profielen maken al deel uit van de statusmap onder
`agents/<agentId>/agent/auth-profiles.json`, dus ze vallen normaal onder de
statusback-upvermelding.

Als je `--only-config` gebruikt, slaat OpenClaw status-, referentiemap- en werkruimtedetectie over en archiveert het alleen het actieve configuratiebestandspad.

OpenClaw canonicaliseert paden voordat het archief wordt gebouwd. Als configuratie, de
referentiemap of een werkruimte al binnen de statusmap staan,
worden ze niet gedupliceerd als afzonderlijke back-upbronnen op het hoogste niveau. Ontbrekende paden worden
overgeslagen.

De archiefpayload slaat bestandsinhoud uit die bronstructuren op, en het ingesloten `manifest.json` registreert de opgeloste absolute bronpaden plus de archiefindeling die voor elk asset wordt gebruikt.

Tijdens het maken van het archief slaat OpenClaw bekende live-mutatiebestanden over die geen herstelwaarde hebben, waaronder actieve transcripts van agentsessies, Cron-uitvoeringslogs, rolling logs, afleveringswachtrijen, socket-/pid-/tijdelijke bestanden onder de statusmap en gerelateerde tijdelijke bestanden van duurzame wachtrijen. Het JSON-resultaat bevat `skippedVolatileCount`, zodat automatisering kan zien hoeveel bestanden bewust zijn weggelaten.

Geïnstalleerde Plugin-bron- en manifestbestanden onder de
`extensions/`-structuur van de statusmap worden opgenomen, maar hun geneste `node_modules/`-afhankelijkheidsstructuren
worden overgeslagen. Die afhankelijkheden zijn opnieuw op te bouwen installatie-artefacten; gebruik na
het herstellen van een archief `openclaw plugins update <id>` of installeer de Plugin opnieuw
met `openclaw plugins install <spec> --force` wanneer een herstelde Plugin
ontbrekende afhankelijkheden meldt.

## Gedrag bij ongeldige configuratie

`openclaw backup` omzeilt bewust de normale configuratiepreflight, zodat het nog steeds kan helpen tijdens herstel. Omdat werkruimtedetectie afhangt van een geldige configuratie, faalt `openclaw backup create` nu snel wanneer het configuratiebestand bestaat maar ongeldig is en werkruimteback-up nog is ingeschakeld.

Als je in die situatie toch een gedeeltelijke back-up wilt, voer dan opnieuw uit:

```bash
openclaw backup create --no-include-workspace
```

Dat houdt status, configuratie en de externe referentiemap binnen bereik terwijl
werkruimtedetectie volledig wordt overgeslagen.

Als je alleen een kopie van het configuratiebestand zelf nodig hebt, werkt `--only-config` ook wanneer de configuratie misvormd is, omdat het niet afhankelijk is van het parsen van de configuratie voor werkruimtedetectie.

## Grootte en prestaties

OpenClaw handhaaft geen ingebouwde maximale back-upgrootte of limiet per bestand.

Praktische limieten komen van de lokale machine en het bestemmingsbestandssysteem:

- Beschikbare ruimte voor het tijdelijk schrijven van het archief plus het uiteindelijke archief
- Tijd om grote werkruimtestructuren te doorlopen en ze te comprimeren tot een `.tar.gz`
- Tijd om het archief opnieuw te scannen als je `openclaw backup create --verify` gebruikt of `openclaw backup verify` uitvoert
- Gedrag van het bestandssysteem op het bestemmingspad. OpenClaw geeft de voorkeur aan een publicatiestap met hardlinks zonder overschrijven en valt terug op exclusief kopiëren wanneer hardlinks niet worden ondersteund

Grote werkruimten zijn meestal de belangrijkste drijver van archiefgrootte. Als je een kleinere of snellere back-up wilt, gebruik dan `--no-include-workspace`.

Gebruik `--only-config` voor het kleinste archief.

## Gerelateerd

- [CLI-referentie](/nl/cli)
