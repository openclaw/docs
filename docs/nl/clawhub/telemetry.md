---
read_when:
    - Werken aan telemetrie-/privacy-instellingen
    - Vragen over welke gegevens worden verzameld
summary: Installatietelemetrie die door de ClawHub CLI wordt verzameld en hoe u zich kunt afmelden.
x-i18n:
    generated_at: "2026-06-27T17:17:34Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 906be32778baaf89e77c5350cd33ff3b975df66d8152a33fdf20c24b5c8286ce
    source_path: clawhub/telemetry.md
    workflow: 16
---

# Telemetrie

ClawHub gebruikt minimale CLI-telemetrie om geaggregeerde installatietellingen te berekenen.

## Wanneer telemetrie wordt verzameld

Telemetrie wordt alleen verzonden wanneer:

- Je bent ingelogd in de CLI.
- Je voert `clawhub install <slug>` uit.
- Telemetrie is **niet uitgeschakeld** (zie “Uitschakelen” hieronder).

Als je niet bent ingelogd, wordt er niets gerapporteerd.

## Wat we verzamelen

Bij elke gerapporteerde `clawhub install` verzendt de CLI één install event naar beste kunnen.

De event bevat:

- `slug`: de geïnstalleerde skill-slug.
- `version`: de geïnstalleerde versie, indien bekend.

### Wat we _niet_ verzamelen

- Geen maplocaties of van mappen afgeleide identificatiegegevens.
- Geen bestandsinhoud.
- Geen logs per uitvoering, prompts of andere CLI-uitvoer.

## Installatietellingen

ClawHub houdt geaggregeerde tellers per skill bij:

- `installsAllTime`: unieke gebruikers die minstens één CLI-installatie voor de skill hebben gerapporteerd.
- `installsCurrent`: unieke gebruikers die een installatie hebben gerapporteerd en hun
  telemetrie niet hebben verwijderd.

## Transparantie + gebruikersinstellingen

Iedereen ziet alleen **geaggregeerde installatietellers**.

Als je je account verwijdert, worden ook je telemetriegegevens verwijderd.

## Telemetrie uitschakelen

Stel de omgevingsvariabele in:

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

Als dit is ingesteld, verzendt de CLI geen installatietelemetrie.
