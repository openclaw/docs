---
read_when:
    - Je wilt permanent geheugen dat over sessies en kanalen heen werkt
    - Je wilt AI-aangedreven herinneringsvermogen en gebruikersmodellering
summary: AI-native sessieoverstijgend geheugen via de Honcho-plugin
title: Honcho-geheugen
x-i18n:
    generated_at: "2026-04-29T22:38:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: d77af5c7281a4abafc184e426b1c37205a6d06a196b50353c1abbf67cc93bb97
    source_path: concepts/memory-honcho.md
    workflow: 16
---

[Honcho](https://honcho.dev) voegt AI-native geheugen toe aan OpenClaw. Het bewaart
gesprekken in een toegewezen service en bouwt in de loop van de tijd gebruikers- en agentmodellen op,
waardoor je agent context over sessies heen krijgt die verder gaat dan Markdown-bestanden
in de werkruimte.

## Wat het biedt

- **Geheugen over sessies heen** -- gesprekken worden na elke beurt bewaard, zodat
  context behouden blijft bij sessieresets, Compaction en kanaalwissels.
- **Gebruikersmodellering** -- Honcho onderhoudt een profiel voor elke gebruiker (voorkeuren,
  feiten, communicatiestijl) en voor de agent (persoonlijkheid, aangeleerd
  gedrag).
- **Semantisch zoeken** -- zoek in observaties uit eerdere gesprekken, niet
  alleen in de huidige sessie.
- **Multi-agent-bewustzijn** -- bovenliggende agents volgen automatisch aangemaakte
  subagents, waarbij bovenliggende agents als waarnemers aan onderliggende sessies worden toegevoegd.

## Beschikbare tools

Honcho registreert tools die de agent tijdens een gesprek kan gebruiken:

**Gegevens ophalen (snel, geen LLM-aanroep):**

| Tool                        | Wat het doet                                           |
| --------------------------- | ------------------------------------------------------ |
| `honcho_context`            | Volledige gebruikersrepresentatie over sessies heen    |
| `honcho_search_conclusions` | Semantisch zoeken in opgeslagen conclusies             |
| `honcho_search_messages`    | Berichten zoeken over sessies heen (filter op afzender, datum) |
| `honcho_session`            | Huidige sessiegeschiedenis en samenvatting             |

**Vraag en antwoord (LLM-aangedreven):**

| Tool         | Wat het doet                                                              |
| ------------ | ------------------------------------------------------------------------- |
| `honcho_ask` | Vragen stellen over de gebruiker. `depth='quick'` voor feiten, `'thorough'` voor synthese |

## Aan de slag

Installeer de Plugin en voer de configuratie uit:

```bash
openclaw plugins install @honcho-ai/openclaw-honcho
openclaw honcho setup
openclaw gateway --force
```

De configuratieopdracht vraagt om je API-referenties, schrijft de configuratie en
migreert optioneel bestaande geheugenbestanden in de werkruimte.

<Info>
Honcho kan volledig lokaal draaien (self-hosted) of via de beheerde API op
`api.honcho.dev`. Voor de self-hosted optie zijn geen externe afhankelijkheden
vereist.
</Info>

## Configuratie

Instellingen staan onder `plugins.entries["openclaw-honcho"].config`:

```json5
{
  plugins: {
    entries: {
      "openclaw-honcho": {
        config: {
          apiKey: "your-api-key", // omit for self-hosted
          workspaceId: "openclaw", // memory isolation
          baseUrl: "https://api.honcho.dev",
        },
      },
    },
  },
}
```

Voor self-hosted instanties wijs je `baseUrl` naar je lokale server (bijvoorbeeld
`http://localhost:8000`) en laat je de API-sleutel weg.

## Bestaand geheugen migreren

Als je bestaande geheugenbestanden in de werkruimte hebt (`USER.md`, `MEMORY.md`,
`IDENTITY.md`, `memory/`, `canvas/`), detecteert `openclaw honcho setup` deze en
biedt het aan om ze te migreren.

<Info>
Migratie is niet-destructief -- bestanden worden geüpload naar Honcho. Originelen worden
nooit verwijderd of verplaatst.
</Info>

## Hoe het werkt

Na elke AI-beurt wordt het gesprek bewaard in Honcho. Zowel gebruikers- als
agentberichten worden geobserveerd, waardoor Honcho zijn modellen in de loop van
de tijd kan opbouwen en verfijnen.

Tijdens een gesprek bevragen Honcho-tools de service in de fase `before_prompt_build`,
waarbij relevante context wordt ingevoegd voordat het model de prompt ziet. Dit zorgt voor
nauwkeurige beurtgrenzen en relevante herinnering.

## Honcho versus ingebouwd geheugen

|                   | Ingebouwd / QMD              | Honcho                              |
| ----------------- | ---------------------------- | ----------------------------------- |
| **Opslag**        | Markdown-bestanden in de werkruimte | Toegewezen service (lokaal of gehost) |
| **Over sessies heen** | Via geheugenbestanden     | Automatisch, ingebouwd              |
| **Gebruikersmodellering** | Handmatig (schrijven naar MEMORY.md) | Automatische profielen              |
| **Zoeken**        | Vector + trefwoord (hybride) | Semantisch over observaties         |
| **Multi-agent**   | Niet gevolgd                 | Bewustzijn van bovenliggend/onderliggend |
| **Afhankelijkheden** | Geen (ingebouwd) of QMD-binary | Plugin-installatie                  |

Honcho en het ingebouwde geheugensysteem kunnen samenwerken. Wanneer QMD is geconfigureerd,
komen extra tools beschikbaar om lokale Markdown-bestanden te doorzoeken naast
Honcho's geheugen over sessies heen.

## CLI-opdrachten

```bash
openclaw honcho setup                        # Configure API key and migrate files
openclaw honcho status                       # Check connection status
openclaw honcho ask <question>               # Query Honcho about the user
openclaw honcho search <query> [-k N] [-d D] # Semantic search over memory
```

## Verder lezen

- [Plugin-broncode](https://github.com/plastic-labs/openclaw-honcho)
- [Honcho-documentatie](https://docs.honcho.dev)
- [Honcho OpenClaw-integratiegids](https://docs.honcho.dev/v3/guides/integrations/openclaw)
- [Geheugen](/nl/concepts/memory) -- overzicht van OpenClaw-geheugen
- [Context-engines](/nl/concepts/context-engine) -- hoe Plugin-context-engines werken

## Gerelateerd

- [Geheugenoverzicht](/nl/concepts/memory)
- [Ingebouwde geheugenengine](/nl/concepts/memory-builtin)
- [QMD-geheugenengine](/nl/concepts/memory-qmd)
