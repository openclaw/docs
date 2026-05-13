---
read_when:
    - Werken aan telemetrie / privacy-instellingen
    - Vragen over welke gegevens worden verzameld
summary: Installatietelemetrie verzameld via `clawhub sync` + afmeldmogelijkheid.
x-i18n:
    generated_at: "2026-05-13T05:33:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1f492fa0176af1cb37fbf694f6c21ed63a769cf9eb8ee4b29f435d5ff0b0e683
    source_path: clawhub/telemetry.md
    workflow: 16
---

# Telemetrie

ClawHub gebruikt **minimale telemetrie** om **installatietellingen** te berekenen (wat daadwerkelijk in gebruik is) en betere sortering/filtering mogelijk te maken.
Dit is gebaseerd op de CLI-opdracht `clawhub sync`.

## Wanneer telemetrie wordt verzameld

Telemetrie wordt alleen verzonden wanneer:

- Je **bent ingelogd** in de CLI (we vereisen al authenticatie voor sync-/publicatiestromen).
- Je `clawhub sync` uitvoert.
- Telemetrie **niet is uitgeschakeld** (zie hieronder “Uitschakelen”).

Als je niet bent ingelogd, wordt er niets gerapporteerd.

## Wat we verzamelen

Bij elke `clawhub sync` rapporteert de CLI een **volledige momentopname** van wat deze heeft gevonden, gegroepeerd per scanroot (“map/root”).

Voor elke root slaan we op:

- `rootId`: een **SHA-256-hash** van het canonieke rootpad (de server ziet nooit het ruwe pad).
- `label`: een voor mensen leesbaar label dat is afgeleid van de laatste twee padsegmenten (homepaden worden weergegeven met `~`).
- `firstSeenAt`, `lastSeenAt`, optioneel `expiredAt`.

Voor elke Skill die onder een root wordt gevonden, slaan we op:

- `skillId` (opgelost via slug; alleen Skills die in het register bestaan, worden bijgehouden).
- `firstSeenAt`, `lastSeenAt`.
- `lastVersion` (naar beste vermogen; momenteel de versie die overeenkomt met het register, indien bekend).
- optioneel `removedAt` wanneer een eerder gerapporteerde installatie uit een root verdwijnt.

### Wat we _niet_ verzamelen

- Geen ruwe absolute mappaden (alleen gehashte `rootId` + een kort weergavelabel).
- Geen bestandsinhoud.
- Geen logs per uitvoering, prompts of andere CLI-uitvoer.
- Geen tracking voor Skills die niet naar het register zijn geüpload (onbekende slugs worden genegeerd).

## Installatietellingen

We houden twee tellers per Skill bij:

- `installsCurrent`: unieke gebruikers die de Skill momenteel in minstens één actieve root hebben geïnstalleerd.
- `installsAllTime`: unieke gebruikers die ooit hebben gerapporteerd dat de Skill was geïnstalleerd.

### Meerdere roots

Als je vanuit meerdere mappen synchroniseert, behandelen we elke scanroot afzonderlijk. Een Skill is “momenteel geïnstalleerd” als deze in **een willekeurige** actieve root bestaat.

### Detectie van verwijderen

Omdat `sync` de volledige set per root rapporteert:

- Als een Skill bij de volgende sync uit een root verdwijnt, markeren we deze als verwijderd voor die root.
- Als de Skill uit al je roots is verwijderd, telt deze niet meer mee voor `installsCurrent`.
- `installsAllTime` neemt nooit af, tenzij je telemetrie verwijdert (zie hieronder).

### Veroudering (120 dagen)

Roots die **120 dagen** geen telemetrie rapporteren, worden als verouderd gemarkeerd en hun installaties tellen niet meer mee voor `installsCurrent`.
Dit wordt lui geëvalueerd (bij het volgende telemetrierapport) om achtergrondtaken te vermijden.

## Transparantie + gebruikersinstellingen

ClawHub biedt een privé-tabblad “Geïnstalleerd” op je eigen profiel:

- Toont de exacte roots + geïnstalleerde Skills die we opslaan.
- Bevat een weergave voor **JSON-export**.
- Bevat een actie **Telemetrie verwijderen** om alle opgeslagen telemetrie voor je account te verwijderen.

Alle anderen zien alleen **geaggregeerde installatietellers**; niemand anders kan je roots/mappen zien.

Het verwijderen van je account verwijdert ook je telemetriegegevens.

## Telemetrie uitschakelen

Stel de omgevingsvariabele in:

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

Als dit is ingesteld, verzendt de CLI geen telemetrie tijdens `clawhub sync`.
