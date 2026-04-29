---
read_when:
    - Je wilt beveiligingsbevindingen of dreigingsscenario's aanleveren
    - Het dreigingsmodel beoordelen of bijwerken
summary: Bijdragen aan het bedreigingsmodel van OpenClaw
title: Bijdragen aan het dreigingsmodel
x-i18n:
    generated_at: "2026-04-29T23:18:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: 75cf2b408a78fce5134d24a3f115490da2dacc4ba8a1a24415425c3e4420ca55
    source_path: security/CONTRIBUTING-THREAT-MODEL.md
    workflow: 16
---

# Bijdragen aan het OpenClaw-dreigingsmodel

Bedankt dat je helpt OpenClaw veiliger te maken. Dit dreigingsmodel is een levend document en we verwelkomen bijdragen van iedereen - je hoeft geen beveiligingsexpert te zijn.

## Manieren om bij te dragen

### Een dreiging toevoegen

Een aanvalsvector of risico gezien dat we nog niet hebben behandeld? Open een issue op [openclaw/trust](https://github.com/openclaw/trust/issues) en beschrijf het in je eigen woorden. Je hoeft geen frameworks te kennen of elk veld in te vullen - beschrijf alleen het scenario.

**Nuttig om op te nemen (maar niet verplicht):**

- Het aanvalsscenario en hoe het kan worden misbruikt
- Welke delen van OpenClaw worden geraakt (CLI, Gateway, kanalen, ClawHub, MCP-servers, enz.)
- Hoe ernstig je denkt dat het is (laag / gemiddeld / hoog / kritiek)
- Links naar gerelateerd onderzoek, CVE's of praktijkvoorbeelden

Wij handelen de ATLAS-mapping, dreigings-ID's en risicobeoordeling af tijdens de review. Als je die details wilt opnemen, prima - maar het wordt niet verwacht.

> **Dit is bedoeld om iets toe te voegen aan het dreigingsmodel, niet om actieve kwetsbaarheden te melden.** Als je een misbruikbare kwetsbaarheid hebt gevonden, bekijk dan onze [Trust-pagina](https://trust.openclaw.ai) voor instructies voor verantwoorde melding.

### Een beperking voorstellen

Heb je een idee om een bestaande dreiging aan te pakken? Open een issue of PR met een verwijzing naar de dreiging. Nuttige beperkingen zijn specifiek en uitvoerbaar - bijvoorbeeld "limiet van 10 berichten/minuut per afzender bij de Gateway" is beter dan "implementeer rate limiting."

### Een aanvalsketen voorstellen

Aanvalsketens laten zien hoe meerdere dreigingen samenkomen in een realistisch aanvalsscenario. Als je een gevaarlijke combinatie ziet, beschrijf dan de stappen en hoe een aanvaller ze aan elkaar zou koppelen. Een korte beschrijving van hoe de aanval zich in de praktijk ontvouwt, is waardevoller dan een formeel sjabloon.

### Bestaande inhoud repareren of verbeteren

Typfouten, verduidelijkingen, verouderde informatie, betere voorbeelden - PR's zijn welkom, geen issue nodig.

## Wat we gebruiken

### MITRE ATLAS

Dit dreigingsmodel is gebouwd op [MITRE ATLAS](https://atlas.mitre.org/) (Adversarial Threat Landscape for AI Systems), een framework dat specifiek is ontworpen voor AI/ML-dreigingen zoals promptinjectie, misbruik van tools en misbruik van agents. Je hoeft ATLAS niet te kennen om bij te dragen - we koppelen inzendingen tijdens de review aan het framework.

### Dreigings-ID's

Elke dreiging krijgt een ID zoals `T-EXEC-003`. De categorieën zijn:

| Code    | Categorie                                  |
| ------- | ------------------------------------------ |
| RECON   | Verkenning - informatie verzamelen         |
| ACCESS  | Initiële toegang - toegang verkrijgen      |
| EXEC    | Uitvoering - schadelijke acties uitvoeren  |
| PERSIST | Persistentie - toegang behouden            |
| EVADE   | Verdedigingsontwijking - detectie vermijden |
| DISC    | Ontdekking - de omgeving leren kennen      |
| EXFIL   | Exfiltratie - data stelen                  |
| IMPACT  | Impact - schade of verstoring              |

ID's worden tijdens de review door maintainers toegewezen. Je hoeft er geen te kiezen.

### Risiconiveaus

| Niveau       | Betekenis                                                         |
| ------------ | ----------------------------------------------------------------- |
| **Kritiek**  | Volledige systeemcompromittering, of hoge waarschijnlijkheid + kritieke impact |
| **Hoog**     | Aanzienlijke schade waarschijnlijk, of gemiddelde waarschijnlijkheid + kritieke impact |
| **Gemiddeld** | Gematigd risico, of lage waarschijnlijkheid + hoge impact        |
| **Laag**     | Onwaarschijnlijk en beperkte impact                               |

Als je niet zeker weet wat het risiconiveau is, beschrijf dan alleen de impact en wij beoordelen het.

## Reviewproces

1. **Triage** - We beoordelen nieuwe inzendingen binnen 48 uur
2. **Beoordeling** - We verifiëren de haalbaarheid, wijzen ATLAS-mapping en dreigings-ID toe, en valideren het risiconiveau
3. **Documentatie** - We zorgen dat alles is opgemaakt en compleet is
4. **Merge** - Toegevoegd aan het dreigingsmodel en de visualisatie

## Bronnen

- [ATLAS-website](https://atlas.mitre.org/)
- [ATLAS-technieken](https://atlas.mitre.org/techniques/)
- [ATLAS-casestudy's](https://atlas.mitre.org/studies/)
- [OpenClaw-dreigingsmodel](/nl/security/THREAT-MODEL-ATLAS)

## Contact

- **Beveiligingskwetsbaarheden:** Bekijk onze [Trust-pagina](https://trust.openclaw.ai) voor meldinstructies
- **Vragen over het dreigingsmodel:** Open een issue op [openclaw/trust](https://github.com/openclaw/trust/issues)
- **Algemene chat:** Discord-kanaal #security

## Erkenning

Bijdragers aan het dreigingsmodel worden vermeld in de dankbetuigingen van het dreigingsmodel, release notes en de OpenClaw security hall of fame voor belangrijke bijdragen.

## Gerelateerd

- [Dreigingsmodel](/nl/security/THREAT-MODEL-ATLAS)
- [Formele verificatie](/nl/security/formal-verification)
