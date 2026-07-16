---
read_when:
    - Werken aan telemetrie-/privacyinstellingen
    - Vragen over welke gegevens worden verzameld
summary: Installatietelemetrie die door de ClawHub-CLI wordt verzameld en hoe je je hiervoor afmeldt.
x-i18n:
    generated_at: "2026-07-16T15:32:54Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 906be32778baaf89e77c5350cd33ff3b975df66d8152a33fdf20c24b5c8286ce
    source_path: clawhub/telemetry.md
    workflow: 16
---

# Telemetrie

ClawHub gebruikt minimale CLI-telemetrie om geaggregeerde installatieaantallen te berekenen.

## Wanneer telemetrie wordt verzameld

Telemetrie wordt alleen verzonden wanneer:

- Je bent aangemeld bij de CLI.
- Je voert `clawhub install <slug>` uit.
- Telemetrie is **niet uitgeschakeld** (zie ‘Uitschakelen’ hieronder).

Als je niet bent aangemeld, wordt er niets gerapporteerd.

## Wat we verzamelen

Voor elke gerapporteerde `clawhub install` verzendt de CLI naar beste vermogen één installatiegebeurtenis.

De gebeurtenis bevat:

- `slug`: de slug van de geïnstalleerde skill.
- `version`: de geïnstalleerde versie, indien bekend.

### Wat we _niet_ verzamelen

- Geen mappaden of van mappen afgeleide identificatoren.
- Geen bestandsinhoud.
- Geen logboeken, prompts of andere CLI-uitvoer per uitvoering.

## Installatieaantallen

ClawHub houdt geaggregeerde tellers per skill bij:

- `installsAllTime`: unieke gebruikers die ten minste één CLI-installatie voor de skill hebben gerapporteerd.
- `installsCurrent`: unieke gebruikers die een installatie hebben gerapporteerd en hun
  telemetrie niet hebben verwijderd.

## Transparantie en gebruikersbeheer

Iedereen ziet alleen **geaggregeerde installatietellers**.

Als je jouw account verwijdert, worden ook je telemetriegegevens verwijderd.

## Telemetrie uitschakelen

Stel de omgevingsvariabele in:

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

Als deze is ingesteld, verzendt de CLI geen installatietelemetrie.
