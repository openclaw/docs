---
read_when:
    - U wilt beveiligingsbevindingen of dreigingsscenario's bijdragen
    - Het dreigingsmodel beoordelen of bijwerken
summary: Bijdragen aan het OpenClaw-dreigingsmodel
title: Bijdragen aan het dreigingsmodel
x-i18n:
    generated_at: "2026-07-12T09:25:47Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4e2e5cd95e8a2bf5ee4bd167afedfadf9aa876e4260e2d0bfb5f414cd4255410
    source_path: security/CONTRIBUTING-THREAT-MODEL.md
    workflow: 16
---

Het [dreigingsmodel](/nl/security/THREAT-MODEL-ATLAS) is een levend document. Bijdragen van iedereen zijn welkom; u hebt geen achtergrond in beveiliging of MITRE ATLAS nodig.

<Note>
Dit is bedoeld voor toevoegingen aan het dreigingsmodel, niet voor het melden van actuele kwetsbaarheden. Als u een misbruikbare kwetsbaarheid hebt gevonden, volgt u in plaats daarvan de instructies voor verantwoorde openbaarmaking op de [vertrouwenspagina](https://trust.openclaw.ai).
</Note>

## Manieren om bij te dragen

**Voeg een dreiging toe.** Open een issue op [openclaw/trust](https://github.com/openclaw/trust/issues) waarin u het aanvalsscenario in uw eigen woorden beschrijft. Nuttig, maar niet verplicht:

- Het aanvalsscenario en hoe dit kan worden misbruikt.
- Welke componenten worden getroffen (CLI, Gateway, kanalen, ClawHub, MCP-servers enzovoort).
- Uw inschatting van de ernst (laag / gemiddeld / hoog / kritiek).
- Koppelingen naar gerelateerd onderzoek, CVE's of praktijkvoorbeelden.

Onderhouders wijzen tijdens de beoordeling de ATLAS-toewijzing, de dreigings-ID en het risiconiveau toe.

**Stel een risicobeperkende maatregel voor.** Open een issue of PR met een verwijzing naar de dreiging. Wees specifiek en actiegericht: "snelheidsbeperking per afzender van 10 berichten/minuut bij de Gateway" is nuttiger dan "implementeer snelheidsbeperking".

**Stel een aanvalsketen voor.** Aanvalsketens laten zien hoe meerdere dreigingen samen een realistisch scenario vormen. Beschrijf de stappen en hoe een aanvaller deze zou aaneenschakelen; een kort verhaal werkt beter dan een formele sjabloon.

**Corrigeer of verbeter bestaande inhoud.** Typefouten, verduidelijkingen, verouderde informatie, betere voorbeelden: PR's zijn welkom, een issue is niet nodig.

## Referentie voor het raamwerk

Dreigingen worden gekoppeld aan [MITRE ATLAS](https://atlas.mitre.org/) (Adversarial Threat Landscape for AI Systems), een raamwerk voor AI/ML-specifieke dreigingen zoals promptinjectie, misbruik van hulpmiddelen en uitbuiting van agents. U hoeft ATLAS niet te kennen om bij te dragen; onderhouders koppelen inzendingen tijdens de beoordeling.

**Dreigings-ID's.** Elke dreiging krijgt een ID zoals `T-EXEC-003`, die tijdens de beoordeling door onderhouders wordt toegewezen.

| Code    | Categorie                                           |
| ------- | --------------------------------------------------- |
| RECON   | Verkenning - informatie verzamelen                  |
| ACCESS  | Initiële toegang - toegang verkrijgen               |
| EXEC    | Uitvoering - schadelijke acties uitvoeren           |
| PERSIST | Persistentie - toegang behouden                     |
| EVADE   | Omzeiling van beveiliging - detectie voorkomen      |
| DISC    | Ontdekking - meer over de omgeving te weten komen   |
| EXFIL   | Exfiltratie - gegevens stelen                       |
| IMPACT  | Impact - schade of verstoring                       |

**Risiconiveaus.** Als u niet zeker bent van het niveau, beschrijft u gewoon de impact; de onderhouders beoordelen het niveau.

| Niveau       | Betekenis                                                          |
| ------------ | ------------------------------------------------------------------ |
| **Kritiek**  | Volledige systeemcompromittering, of hoge kans + kritieke impact   |
| **Hoog**     | Aanzienlijke schade waarschijnlijk, of gemiddelde kans + kritieke impact |
| **Gemiddeld** | Gematigd risico, of lage kans + hoge impact                       |
| **Laag**     | Onwaarschijnlijk en beperkte impact                                |

## Beoordelingsproces

1. **Triage** - nieuwe inzendingen worden binnen 48 uur beoordeeld.
2. **Beoordeling** - onderhouders verifiëren de haalbaarheid, wijzen de ATLAS-toewijzing en dreigings-ID toe en valideren het risiconiveau.
3. **Documentatie** - controle op opmaak en volledigheid.
4. **Samenvoegen** - toegevoegd aan het dreigingsmodel en de visualisatie.

## Bronnen

- [ATLAS-website](https://atlas.mitre.org/)
- [ATLAS-technieken](https://atlas.mitre.org/techniques/)
- [ATLAS-casestudy's](https://atlas.mitre.org/studies/)

## Contact

- **Beveiligingskwetsbaarheden:** [Vertrouwenspagina](https://trust.openclaw.ai) voor meldingsinstructies, of `security@openclaw.ai`.
- **Vragen over het dreigingsmodel:** open een issue op [openclaw/trust](https://github.com/openclaw/trust/issues).
- **Algemene chat:** Discord-kanaal `#security`.

## Erkenning

Bijdragers aan het dreigingsmodel worden vermeld in de dankbetuigingen van het dreigingsmodel, de releaseopmerkingen en, bij belangrijke bijdragen, de OpenClaw-eregalerij voor beveiliging.

## Gerelateerd

- [Dreigingsmodel](/nl/security/THREAT-MODEL-ATLAS)
- [Incidentrespons](/nl/security/incident-response)
- [Formele verificatie](/nl/security/formal-verification)
