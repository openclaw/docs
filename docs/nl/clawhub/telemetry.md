---
read_when:
    - Werken aan telemetrie / privacycontroles
    - Vragen over welke gegevens worden verzameld
summary: Installatietelemetrie verzameld via `clawhub sync` + afmelding.
x-i18n:
    generated_at: "2026-05-12T15:43:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1f492fa0176af1cb37fbf694f6c21ed63a769cf9eb8ee4b29f435d5ff0b0e683
    source_path: clawhub/telemetry.md
    workflow: 16
---

# Telemetrie

ClawHub gebruikt **minimale telemetrie** om **installatieaantallen** te berekenen (wat daadwerkelijk in gebruik is) en betere sortering/filtering mogelijk te maken.
Dit is gebaseerd op het CLI-commando `clawhub sync`.

## Wanneer telemetrie wordt verzameld

Telemetrie wordt alleen verzonden wanneer:

- Je bent **ingelogd** in de CLI (we vereisen al authenticatie voor synchronisatie-/publicatieflows).
- Je voert `clawhub sync` uit.
- Telemetrie is **niet uitgeschakeld** (zie “Uitschakelen” hieronder).

Als je niet bent ingelogd, wordt er niets gerapporteerd.

## Wat we verzamelen

Bij elke `clawhub sync` rapporteert de CLI een **volledige momentopname** van wat deze heeft gevonden, gegroepeerd per scanhoofdmap (“folder/root”).

Voor elke hoofdmap slaan we op:

- `rootId`: een **SHA-256-hash** van het canonieke hoofdpad (de server ziet nooit het ruwe pad).
- `label`: een menselijk leesbaar label dat is afgeleid van de laatste twee padsegmenten (home-paden worden weergegeven met `~`).
- `firstSeenAt`, `lastSeenAt`, optioneel `expiredAt`.

Voor elke skill die onder een hoofdmap wordt gevonden, slaan we op:

- `skillId` (opgelost via slug; alleen skills die in het register bestaan, worden gevolgd).
- `firstSeenAt`, `lastSeenAt`.
- `lastVersion` (naar beste vermogen; momenteel de met het register overeenkomende versie indien bekend).
- optioneel `removedAt` wanneer een eerder gerapporteerde installatie uit een hoofdmap verdwijnt.

### Wat we _niet_ verzamelen

- Geen ruwe absolute mapppaden (alleen gehashte `rootId` + een kort weergavelabel).
- Geen bestandsinhoud.
- Geen logs per run, prompts of andere CLI-uitvoer.
- Geen tracking voor skills die niet naar het register zijn geüpload (onbekende slugs worden genegeerd).

## Installatieaantallen

We houden twee tellers per skill bij:

- `installsCurrent`: unieke gebruikers die de skill momenteel in ten minste één actieve hoofdmap hebben geïnstalleerd.
- `installsAllTime`: unieke gebruikers die ooit hebben gerapporteerd dat de skill is geïnstalleerd.

### Meerdere hoofdmappen

Als je vanuit meerdere mappen synchroniseert, behandelen we elke scanhoofdmap afzonderlijk. Een skill is “momenteel geïnstalleerd” als deze in **een** actieve hoofdmap bestaat.

### Detectie van verwijdering

Omdat `sync` de volledige set per hoofdmap rapporteert:

- Als een skill bij de volgende synchronisatie uit een hoofdmap verdwijnt, markeren we deze als verwijderd voor die hoofdmap.
- Als de skill uit al je hoofdmappen is verwijderd, telt deze niet meer mee voor `installsCurrent`.
- `installsAllTime` neemt nooit af, tenzij je telemetrie verwijdert (zie hieronder).

### Veroudering (120 dagen)

Hoofdmappen die **120 dagen** geen telemetrie rapporteren, worden als verouderd gemarkeerd en hun installaties tellen niet meer mee voor `installsCurrent`.
Dit wordt lui geëvalueerd (bij het volgende telemetrierapport) om achtergrondtaken te vermijden.

## Transparantie + gebruikersinstellingen

ClawHub biedt een privé-tabblad “Geïnstalleerd” op je eigen profiel:

- Toont de exacte hoofdmappen + geïnstalleerde skills die we opslaan.
- Bevat een weergave voor **JSON-export**.
- Bevat een actie **Telemetrie verwijderen** om alle opgeslagen telemetrie voor je account te verwijderen.

Alle anderen zien alleen **geaggregeerde installatietellers**; niemand anders kan je hoofdmappen/mappen zien.

Als je je account verwijdert, worden ook je telemetriegegevens verwijderd.

## Telemetrie uitschakelen

Stel de omgevingsvariabele in:

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

Als dit is ingesteld, verzendt de CLI geen telemetrie tijdens `clawhub sync`.
