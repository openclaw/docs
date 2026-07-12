---
permalink: /security/formal-verification/
read_when:
    - Formele garanties of beperkingen van het beveiligingsmodel beoordelen
    - TLA+/TLC-beveiligingsmodelcontroles reproduceren of bijwerken
summary: Machinaal gecontroleerde beveiligingsmodellen voor de risicovolste paden van OpenClaw.
title: Formele verificatie (beveiligingsmodellen)
x-i18n:
    generated_at: "2026-07-12T09:18:24Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 86342f6e2f54c08d5e0f8a08d0d488459650a6ace35e985ff886f847540202c9
    source_path: security/formal-verification.md
    workflow: 16
---

De formele beveiligingsmodellen van OpenClaw (momenteel TLA+/TLC) leveren een machinaal gecontroleerd argument dat specifieke paden met het hoogste risico — autorisatie, sessie-isolatie, toolafscherming en veiligheid bij onjuiste configuratie — hun beoogde beleid afdwingen onder expliciet vermelde aannames.

> Opmerking: sommige oudere links verwijzen mogelijk naar de vorige projectnaam.

## Wat dit is

Een uitvoerbare, door aanvallers aangestuurde regressietestsuite voor beveiliging:

- Elke bewering heeft een uitvoerbare modelcontrole over een eindige toestandsruimte.
- Veel beweringen hebben een bijbehorend negatief model dat een tegenvoorbeeldtrace oplevert voor een realistische foutcategorie.

Dit is **geen** bewijs dat OpenClaw in alle opzichten veilig is en het verifieert niet de volledige TypeScript-implementatie.

## Waar de modellen zich bevinden

De modellen worden onderhouden in een afzonderlijke repository: [vignesh07/openclaw-formal-models](https://github.com/vignesh07/openclaw-formal-models).

<Note>
Die repository is momenteel onbereikbaar (GitHub retourneert op het moment van schrijven "Repository not found"). Als deze voor u nog steeds niet werkt, vraag dan in de onderhoudskanalen van OpenClaw naar de huidige locatie voordat u aanneemt dat de modellen zijn verwijderd.
</Note>

## Kanttekeningen

- Dit zijn modellen, niet de volledige TypeScript-implementatie — afwijkingen tussen model en code zijn mogelijk.
- De resultaten worden begrensd door de toestandsruimte die TLC onderzoekt. Groen impliceert geen beveiliging buiten de gemodelleerde aannames en grenzen.
- Sommige beweringen zijn afhankelijk van expliciete omgevingsaannames (bijvoorbeeld een correcte implementatieomgeving en correcte configuratie-invoer).

## Resultaten reproduceren

Kloon de modellenrepository en voer TLC uit:

```bash
git clone https://github.com/vignesh07/openclaw-formal-models
cd openclaw-formal-models

# Java 11+ vereist (TLC draait op de JVM).
# De repository levert een vastgezette tla2tools.jar en bevat bin/tlc plus Make-doelen.

make <target>
```

Er is nog geen CI-integratie terug naar deze repository; een toekomstige versie zou door CI uitgevoerde modellen met openbare artefacten (tegenvoorbeeldtraces, uitvoeringslogboeken) of een gehoste workflow voor "dit model uitvoeren" voor kleine begrensde controles kunnen toevoegen.

## Beweringen en doelen

### Blootstelling van de Gateway en onjuiste configuratie van een open Gateway

**Bewering:** binden buiten loopback zonder authenticatie kan externe compromittering mogelijk maken en vergroot de blootstelling; volgens de aannames van het model blokkeert een token/wachtwoord niet-geverifieerde aanvallers.

| Resultaat        | Doelen                                                           |
| ---------------- | ---------------------------------------------------------------- |
| Groen            | `make gateway-exposure-v2`, `make gateway-exposure-v2-protected` |
| Rood (verwacht)  | `make gateway-exposure-v2-negative`                              |

Zie ook `docs/gateway-exposure-matrix.md` in de modellenrepository.

### Uitvoerpijplijn van Node (mogelijkheid met het hoogste risico)

**Bewering:** `exec host=node` vereist (a) een toestemmingslijst voor Node-opdrachten plus gedeclareerde opdrachten en (b) livegoedkeuring wanneer dit is geconfigureerd; in het model worden goedkeuringen van tokens voorzien om herhaling te voorkomen.

| Resultaat       | Doelen                                                          |
| --------------- | --------------------------------------------------------------- |
| Groen           | `make nodes-pipeline`, `make approvals-token`                   |
| Rood (verwacht) | `make nodes-pipeline-negative`, `make approvals-token-negative` |

### Koppelingsopslag (afscherming van directe berichten)

**Bewering:** koppelingsverzoeken respecteren de TTL en limieten voor openstaande verzoeken.

| Resultaat       | Doelen                                               |
| --------------- | ---------------------------------------------------- |
| Groen           | `make pairing`, `make pairing-cap`                   |
| Rood (verwacht) | `make pairing-negative`, `make pairing-cap-negative` |

### Afscherming van inkomend verkeer (vermeldingen en omzeiling door besturingsopdrachten)

**Bewering:** in groepscontexten waarin een vermelding vereist is, kan een onbevoegde besturingsopdracht de afscherming op basis van vermeldingen niet omzeilen.

| Resultaat       | Doelen                         |
| --------------- | ------------------------------ |
| Groen           | `make ingress-gating`          |
| Rood (verwacht) | `make ingress-gating-negative` |

### Routering en isolatie van sessiesleutels

**Bewering:** directe berichten van verschillende gesprekspartners worden niet samengevoegd in dezelfde sessie, tenzij ze expliciet zijn gekoppeld of geconfigureerd.

| Resultaat       | Doelen                            |
| --------------- | --------------------------------- |
| Groen           | `make routing-isolation`          |
| Rood (verwacht) | `make routing-isolation-negative` |

## v1++-modellen: gelijktijdigheid, nieuwe pogingen en correctheid van traces

Vervolgmodellen die de getrouwheid aanscherpen rond praktijkgerichte foutmodi: niet-atomaire updates, nieuwe pogingen en berichtuitwaaiering.

### Gelijktijdigheid en idempotentie van de koppelingsopslag

**Bewering:** de koppelingsopslag handhaaft `MaxPending` en idempotentie, zelfs bij vervlechtingen — controleren en vervolgens schrijven moet atomair/vergrendeld zijn en vernieuwen mag geen duplicaten creëren. Concreet: gelijktijdige verzoeken kunnen `MaxPending` voor een kanaal niet overschrijden en herhaalde verzoeken/vernieuwingen voor dezelfde `(channel, sender)` creëren geen dubbele actieve openstaande rijen.

| Resultaat       | Doelen                                                                                                                                                                      |
| --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Groen           | `make pairing-race` (atomaire/vergrendelde limietcontrole), `make pairing-idempotency`, `make pairing-refresh`, `make pairing-refresh-race`                                 |
| Rood (verwacht) | `make pairing-race-negative` (niet-atomaire limietrace tussen begin en vastlegging), `make pairing-idempotency-negative`, `make pairing-refresh-negative`, `make pairing-refresh-race-negative` |

### Tracecorrelatie en idempotentie van inkomend verkeer

**Bewering:** verwerking van inkomend verkeer behoudt tracecorrelatie bij uitwaaiering en is idempotent bij nieuwe pogingen van de provider. Wanneer één externe gebeurtenis meerdere interne berichten wordt, behoudt elk deel dezelfde trace-/gebeurtenisidentiteit; nieuwe pogingen worden niet dubbel verwerkt; als gebeurtenis-ID's van de provider ontbreken, valt deduplicatie terug op een veilige sleutel (bijvoorbeeld een trace-ID) om te voorkomen dat verschillende gebeurtenissen worden verwijderd.

| Resultaat       | Doelen                                                                                                                                      |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Groen           | `make ingress-trace`, `make ingress-trace2`, `make ingress-idempotency`, `make ingress-dedupe-fallback`                                     |
| Rood (verwacht) | `make ingress-trace-negative`, `make ingress-trace2-negative`, `make ingress-idempotency-negative`, `make ingress-dedupe-fallback-negative` |

### Voorrang van `dmScope` bij routering en `identityLinks`

**Bewering:** routering houdt sessies voor directe berichten standaard geïsoleerd en voegt sessies alleen samen wanneer dit expliciet is geconfigureerd, via kanaalvoorrang en identiteitskoppelingen. Kanaalspecifieke `dmScope`-overschrijvingen hebben voorrang op globale standaardwaarden; `identityLinks` voegen sessies alleen samen binnen expliciet gekoppelde groepen, niet tussen niet-gerelateerde gesprekspartners.

| Resultaat       | Doelen                                                                    |
| --------------- | ------------------------------------------------------------------------- |
| Groen           | `make routing-precedence`, `make routing-identitylinks`                   |
| Rood (verwacht) | `make routing-precedence-negative`, `make routing-identitylinks-negative` |

## Gerelateerd

- [Dreigingsmodel](/nl/security/THREAT-MODEL-ATLAS)
- [Bijdragen aan het dreigingsmodel](/nl/security/CONTRIBUTING-THREAT-MODEL)
- [Incidentrespons](/nl/security/incident-response)
