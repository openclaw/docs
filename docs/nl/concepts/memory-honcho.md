---
read_when:
    - Je wilt persistent geheugen dat in verschillende sessies en kanalen werkt
    - Je wilt door AI ondersteund geheugen en gebruikersmodellering
summary: AI-native sessieoverstijgend geheugen via de Honcho-plugin
title: Honcho-geheugen
x-i18n:
    generated_at: "2026-07-12T08:46:56Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fadcf6d8e2505ab4fe6a81340695b7c8fee49c3cb4889665af13389941619117
    source_path: concepts/memory-honcho.md
    workflow: 16
---

[Honcho](https://honcho.dev) voegt via een externe plugin AI-native geheugen toe aan OpenClaw. Het slaat gesprekken op in een speciale service en bouwt na verloop van tijd gebruikers- en agentmodellen op, waardoor je agent context tussen sessies krijgt die verder gaat dan Markdown-bestanden in de werkruimte.

## Wat het biedt

- **Geheugen tussen sessies** - gesprekken blijven na elke beurt bewaard, zodat
  context behouden blijft na het opnieuw instellen van sessies, Compaction en het wisselen van kanaal.
- **Gebruikersmodellering** - Honcho onderhoudt een profiel voor elke gebruiker (voorkeuren,
  feiten, communicatiestijl) en voor de agent (persoonlijkheid, aangeleerd
  gedrag).
- **Semantisch zoeken** - zoek in waarnemingen uit eerdere gesprekken, niet
  alleen in de huidige sessie.
- **Bewustzijn van meerdere agents** - bovenliggende agents volgen automatisch aangemaakte
  subagents, waarbij bovenliggende agents als waarnemers aan onderliggende sessies worden toegevoegd.

## Beschikbare tools

Honcho registreert tools die de agent tijdens gesprekken kan gebruiken:

**Gegevens ophalen (snel, geen LLM-aanroep):**

| Tool                        | Functie                                                 |
| --------------------------- | ------------------------------------------------------- |
| `honcho_context`            | Volledige gebruikersrepresentatie over sessies heen     |
| `honcho_search_conclusions` | Semantisch zoeken in opgeslagen conclusies              |
| `honcho_search_messages`    | Berichten in sessies zoeken (filteren op afzender, datum) |
| `honcho_session`            | Geschiedenis en samenvatting van de huidige sessie      |

**Vragen en antwoorden (aangedreven door een LLM):**

| Tool         | Functie                                                                            |
| ------------ | ---------------------------------------------------------------------------------- |
| `honcho_ask` | Stel vragen over de gebruiker. `depth='quick'` voor feiten, `'thorough'` voor synthese |

## Aan de slag

Installeer de plugin en voer de configuratie uit:

```bash
openclaw plugins install @honcho-ai/openclaw-honcho
openclaw honcho setup
openclaw gateway --force
```

De configuratieopdracht vraagt om je API-referenties, schrijft de configuratie en
migreert optioneel bestaande geheugenbestanden uit de werkruimte.

<Info>
Honcho kan volledig lokaal (zelfgehost) of via de beheerde API op
`api.honcho.dev` worden uitgevoerd. Voor de zelfgehoste optie zijn geen externe
afhankelijkheden vereist.
</Info>

## Configuratie

Instellingen staan onder `plugins.entries["openclaw-honcho"].config`:

```json5
{
  plugins: {
    entries: {
      "openclaw-honcho": {
        config: {
          apiKey: "your-api-key", // weglaten bij zelfhosting
          workspaceId: "openclaw", // geheugenisolatie
          baseUrl: "https://api.honcho.dev",
        },
      },
    },
  },
}
```

Voor zelfgehoste instanties stel je `baseUrl` in op je lokale server (bijvoorbeeld
`http://localhost:8000`) en laat je de API-sleutel weg.

## Bestaand geheugen migreren

Als je bestaande geheugenbestanden in de werkruimte hebt (`USER.md`, `MEMORY.md`,
`IDENTITY.md`, `memory/`, `canvas/`), detecteert `openclaw honcho setup` deze en
biedt de opdracht aan ze te migreren.

<Info>
De migratie is niet-destructief: bestanden worden naar Honcho geüpload. Originelen worden
nooit verwijderd of verplaatst.
</Info>

## Hoe het werkt

Na elke AI-beurt wordt het gesprek in Honcho opgeslagen. Zowel gebruikers- als
agentberichten worden waargenomen, zodat Honcho zijn modellen na verloop van
tijd kan opbouwen en verfijnen.

Tijdens gesprekken bevragen Honcho-tools de service via de
`before_prompt_build`-pluginhook van OpenClaw, waarbij relevante context wordt ingevoegd voordat het model
de prompt ziet.

## Honcho versus ingebouwd geheugen

|                   | Ingebouwd / QMD                     | Honcho                                  |
| ----------------- | ----------------------------------- | --------------------------------------- |
| **Opslag**        | Markdown-bestanden in de werkruimte | Speciale service (lokaal of gehost)     |
| **Tussen sessies** | Via geheugenbestanden              | Automatisch, ingebouwd                  |
| **Gebruikersmodellering** | Handmatig (schrijven naar MEMORY.md) | Automatische profielen             |
| **Zoeken**        | Vector + trefwoord (hybride)        | Semantisch zoeken in waarnemingen       |
| **Meerdere agents** | Niet bijgehouden                  | Bewustzijn van bovenliggende/onderliggende agents |
| **Afhankelijkheden** | Geen (ingebouwd) of QMD-binair bestand | Installatie van plugin             |

Honcho en het ingebouwde geheugensysteem kunnen samenwerken. Wanneer QMD is
geconfigureerd, komen er extra tools beschikbaar om lokale Markdown-bestanden
te doorzoeken naast het geheugen van Honcho tussen sessies.

## CLI-opdrachten

```bash
openclaw honcho setup                        # API-sleutel configureren en bestanden migreren
openclaw honcho status                       # Verbindingsstatus controleren
openclaw honcho ask <question>               # Honcho over de gebruiker bevragen
openclaw honcho search <query> [-k N] [-d D] # Semantisch zoeken in het geheugen
```

## Verder lezen

- [Broncode van de plugin](https://github.com/plastic-labs/openclaw-honcho)
- [Honcho-documentatie](https://docs.honcho.dev)
- [Integratiehandleiding voor Honcho en OpenClaw](https://docs.honcho.dev/v3/guides/integrations/openclaw)

## Gerelateerd

- [Overzicht van geheugen](/nl/concepts/memory)
- [Ingebouwde geheugenengine](/nl/concepts/memory-builtin)
- [QMD-geheugenengine](/nl/concepts/memory-qmd)
- [Contextengines](/nl/concepts/context-engine)
