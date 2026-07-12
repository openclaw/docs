---
read_when:
    - Werken aan instellingen voor telemetrie en privacy
    - Vragen over welke gegevens worden verzameld
summary: Installatietelemetrie die door de ClawHub-CLI wordt verzameld en hoe u zich hiervoor kunt afmelden.
x-i18n:
    generated_at: "2026-07-12T08:43:14Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 906be32778baaf89e77c5350cd33ff3b975df66d8152a33fdf20c24b5c8286ce
    source_path: clawhub/telemetry.md
    workflow: 16
---

# Telemetrie

ClawHub gebruikt minimale CLI-telemetrie om geaggregeerde installatieaantallen te berekenen.

## Wanneer telemetrie wordt verzameld

Telemetrie wordt alleen verzonden wanneer:

- U bent aangemeld in de CLI.
- U `clawhub install <slug>` uitvoert.
- Telemetrie **niet is uitgeschakeld** (zie ‘Uitschakelen’ hieronder).

Als u niet bent aangemeld, wordt er niets gerapporteerd.

## Wat we verzamelen

Bij elke gerapporteerde `clawhub install` verzendt de CLI naar beste vermogen één installatiegebeurtenis.

De gebeurtenis bevat:

- `slug`: de slug van de geïnstalleerde skill.
- `version`: de geïnstalleerde versie, indien bekend.

### Wat we _niet_ verzamelen

- Geen mappaden of van mappen afgeleide identificatiegegevens.
- Geen bestandsinhoud.
- Geen logboeken, prompts of andere CLI-uitvoer per uitvoering.

## Installatieaantallen

ClawHub houdt geaggregeerde tellers per skill bij:

- `installsAllTime`: unieke gebruikers die ten minste één CLI-installatie voor de skill hebben gerapporteerd.
- `installsCurrent`: unieke gebruikers die een installatie hebben gerapporteerd en hun
  telemetrie niet hebben verwijderd.

## Transparantie en gebruikersinstellingen

Iedereen ziet alleen **geaggregeerde installatietellers**.

Als u uw account verwijdert, worden ook uw telemetriegegevens verwijderd.

## Telemetrie uitschakelen

Stel de omgevingsvariabele in:

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

Wanneer deze is ingesteld, verzendt de CLI geen installatietelemetrie.
