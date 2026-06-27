---
read_when:
    - Muziek of audio genereren via de agent
    - Muziekgeneratieproviders en -modellen configureren
    - Inzicht in de parameters van de tool music_generate
sidebarTitle: Music generation
summary: Genereer muziek via music_generate in workflows voor ComfyUI, fal, Google Lyria, MiniMax en OpenRouter
title: Muziekgeneratie
x-i18n:
    generated_at: "2026-06-27T18:27:48Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4fe6ad09b6e2cfae03bc5d5ef4368e80845a9e4a8c25c6303e181a6436a17c7e
    source_path: tools/music-generation.md
    workflow: 16
---

De tool `music_generate` laat de agent muziek of audio maken via de
gedeelde mogelijkheid voor muziekgeneratie met geconfigureerde aanbieders:
ComfyUI, fal, Google, MiniMax en OpenRouter op dit moment.

Voor agentruns met sessieondersteuning start OpenClaw muziekgeneratie als een
achtergrondtaak, volgt deze in het taaklogboek en wekt de agent daarna opnieuw
wanneer de track klaar is, zodat de agent het de gebruiker kan vertellen en de
voltooide audio kan bijvoegen. De voltooiingsagent volgt de normale zichtbare-antwoordmodus
van de sessie: automatische aflevering van het eindantwoord wanneer dit is geconfigureerd,
of `message(action="send")` wanneer de sessie de berichtentool vereist. Als de
aanvragersessie inactief is of de actieve wake ervan mislukt, en er nog gegenereerde
audio ontbreekt in het voltooiingsantwoord, verzendt OpenClaw een idempotente directe
fallback met alleen de ontbrekende audio.

<Note>
De ingebouwde gedeelde tool verschijnt alleen wanneer er minstens één aanbieder
voor muziekgeneratie beschikbaar is. Als je `music_generate` niet ziet in de
tools van je agent, configureer dan `agents.defaults.musicGenerationModel` of stel
een API-sleutel voor een aanbieder in.
</Note>

## Snelstart

<Tabs>
  <Tab title="Gedeeld, met aanbiederondersteuning">
    <Steps>
      <Step title="Authenticatie configureren">
        Stel een API-sleutel in voor minstens één aanbieder, bijvoorbeeld
        `GEMINI_API_KEY` of `MINIMAX_API_KEY`.
      </Step>
      <Step title="Een standaardmodel kiezen (optioneel)">
        ```json5
        {
          agents: {
            defaults: {
              musicGenerationModel: {
                primary: "google/lyria-3-clip-preview",
              },
            },
          },
        }
        ```
      </Step>
      <Step title="De agent vragen">
        _"Generate an upbeat synthpop track about a night drive through a
        neon city."_

        De agent roept `music_generate` automatisch aan. Geen allowlisting
        van tools nodig.
      </Step>
    </Steps>

    Voor directe synchrone contexten zonder agentrun met sessieondersteuning
    valt de ingebouwde tool nog steeds terug op inline generatie en retourneert
    het uiteindelijke mediapad in het toolresultaat.

  </Tab>
  <Tab title="ComfyUI-workflow">
    <Steps>
      <Step title="De workflow configureren">
        Configureer `plugins.entries.comfy.config.music` met een workflow-JSON
        en prompt-/uitvoerknooppunten.
      </Step>
      <Step title="Cloudauthenticatie (optioneel)">
        Stel voor Comfy Cloud `COMFY_API_KEY` of `COMFY_CLOUD_API_KEY` in.
      </Step>
      <Step title="De tool aanroepen">
        ```text
        /tool music_generate prompt="Warm ambient synth loop with soft tape texture"
        ```
      </Step>
    </Steps>
  </Tab>
</Tabs>

Voorbeeldprompts:

```text
Generate a cinematic piano track with soft strings and no vocals.
```

```text
Generate an energetic chiptune loop about launching a rocket at sunrise.
```

## Ondersteunde aanbieders

| Aanbieder  | Standaardmodel              | Referentie-invoer | Ondersteunde instellingen                            | Authenticatie                          |
| ---------- | ---------------------------- | ---------------- | ----------------------------------------------------- | -------------------------------------- |
| ComfyUI    | `workflow`                   | Tot 1 afbeelding | Door workflow gedefinieerde muziek of audio           | `COMFY_API_KEY`, `COMFY_CLOUD_API_KEY` |
| fal        | `fal-ai/minimax-music/v2.6`  | Geen             | `lyrics`, `instrumental`, `durationSeconds`, `format` | `FAL_KEY` of `FAL_API_KEY`             |
| Google     | `lyria-3-clip-preview`       | Tot 10 afbeeldingen | `lyrics`, `instrumental`, `format`                 | `GEMINI_API_KEY`, `GOOGLE_API_KEY`     |
| MiniMax    | `music-2.6`                  | Geen             | `lyrics`, `instrumental`, `format=mp3`                | `MINIMAX_API_KEY` of MiniMax OAuth     |
| OpenRouter | `google/lyria-3-pro-preview` | Tot 1 afbeelding | `lyrics`, `instrumental`, `durationSeconds`, `format` | `OPENROUTER_API_KEY`                   |

### Mogelijkhedenmatrix

Het expliciete moduscontract dat wordt gebruikt door `music_generate`, contracttests
en de gedeelde live sweep:

| Aanbieder  | `generate` | `edit` | Bewerkingslimiet | Gedeelde live lanes                                                       |
| ---------- | :--------: | :----: | ---------------- | ------------------------------------------------------------------------- |
| ComfyUI    |     ✓      |   ✓    | 1 afbeelding     | Niet in de gedeelde sweep; gedekt door `extensions/comfy/comfy.live.test.ts` |
| fal        |     ✓      |   —    | Geen             | `generate`                                                                |
| Google     |     ✓      |   ✓    | 10 afbeeldingen  | `generate`, `edit`                                                        |
| MiniMax    |     ✓      |   —    | Geen             | `generate`                                                                |
| OpenRouter |     ✓      |   ✓    | 1 afbeelding     | `generate`, `edit`                                                        |

Gebruik `action: "list"` om beschikbare gedeelde aanbieders en modellen tijdens
runtime te inspecteren:

```text
/tool music_generate action=list
```

Gebruik `action: "status"` om de actieve muziektask met sessieondersteuning te inspecteren:

```text
/tool music_generate action=status
```

Voorbeeld van directe generatie:

```text
/tool music_generate prompt="Dreamy lo-fi hip hop with vinyl texture and gentle rain" instrumental=true
```

## Toolparameters

<ParamField path="prompt" type="string" required>
  Prompt voor muziekgeneratie. Vereist voor `action: "generate"`.
</ParamField>
<ParamField path="action" type='"generate" | "status" | "list"' default="generate">
  `"status"` retourneert de huidige sessietaak; `"list"` inspecteert aanbieders.
</ParamField>
<ParamField path="model" type="string">
  Overschrijving van aanbieder/model (bijv. `google/lyria-3-pro-preview`,
  `comfy/workflow`).
</ParamField>
<ParamField path="lyrics" type="string">
  Optionele songteksten wanneer de aanbieder expliciete invoer voor songteksten ondersteunt.
</ParamField>
<ParamField path="instrumental" type="boolean">
  Vraag om uitvoer met alleen instrumentale audio wanneer de aanbieder dit ondersteunt.
</ParamField>
<ParamField path="image" type="string">
  Pad of URL naar één referentieafbeelding.
</ParamField>
<ParamField path="images" type="string[]">
  Meerdere referentieafbeeldingen (tot 10 bij ondersteunende aanbieders).
</ParamField>
<ParamField path="durationSeconds" type="number">
  Doelduur in seconden wanneer de aanbieder duurhints ondersteunt.
</ParamField>
<ParamField path="format" type='"mp3" | "wav"'>
  Hint voor uitvoerformaat wanneer de aanbieder dit ondersteunt.
</ParamField>
<ParamField path="filename" type="string">Hint voor uitvoerbestandsnaam.</ParamField>

<Note>
Niet alle aanbieders ondersteunen alle parameters. OpenClaw valideert nog steeds harde
limieten, zoals invoeraantallen, vóór indiening. Wanneer een aanbieder duur ondersteunt
maar een korter maximum gebruikt dan de gevraagde waarde, beperkt OpenClaw dit tot de
dichtstbijzijnde ondersteunde duur. Echt niet-ondersteunde optionele hints worden
genegeerd met een waarschuwing wanneer de geselecteerde aanbieder of het geselecteerde
model ze niet kan honoreren. Toolresultaten rapporteren toegepaste instellingen;
`details.normalization` legt elke mapping van gevraagd naar toegepast vast.
</Note>

Time-outs voor aanbiedersverzoeken zijn alleen operatorconfiguratie. OpenClaw gebruikt
`agents.defaults.musicGenerationModel.timeoutMs` wanneer dit is geconfigureerd, verhoogt
waarden onder 120000 ms naar 120000 ms en gebruikt anders standaard 300000 ms voor
aanbiedersverzoeken.

## Asynchroon gedrag

Muziekgeneratie met sessieondersteuning draait als een achtergrondtaak:

- **Achtergrondtaak:** `music_generate` maakt een achtergrondtaak, retourneert
  meteen een gestart-/taakantwoord en plaatst de voltooide track later in
  een opvolgend agentbericht.
- **Dubbele aanvragen voorkomen:** zolang een taak `queued` of `running` is,
  retourneren latere `music_generate`-aanroepen in dezelfde sessie de taakstatus
  in plaats van een nieuwe generatie te starten. Gebruik `action: "status"` om
  dit expliciet te controleren.
- **Status opzoeken:** `openclaw tasks list` of `openclaw tasks show <taskId>`
  inspecteert de status queued, running en terminal.
- **Voltooiings-wake:** OpenClaw injecteert een interne voltooiingsgebeurtenis
  terug in dezelfde sessie, zodat het model zelf de gebruikersgerichte opvolging
  kan schrijven.
- **Prompthint:** latere gebruikers-/handmatige beurten in dezelfde sessie krijgen
  een kleine runtimehint wanneer er al een muziektask loopt, zodat het model niet
  blind opnieuw `music_generate` aanroept.
- **Fallback zonder sessie:** directe/lokale contexten zonder echte agentsessie
  draaien inline en retourneren het uiteindelijke audioresultaat in dezelfde beurt.

### Taaklevenscyclus

| Status      | Betekenis                                                                                      |
| ----------- | ---------------------------------------------------------------------------------------------- |
| `queued`    | Taak gemaakt, wacht tot de aanbieder deze accepteert.                                          |
| `running`   | Aanbieder verwerkt de taak (meestal 30 seconden tot 3 minuten, afhankelijk van aanbieder en duur). |
| `succeeded` | Track gereed; de agent wordt gewekt en plaatst deze in het gesprek.                            |
| `failed`    | Fout of time-out bij aanbieder; de agent wordt gewekt met foutdetails.                         |

Controleer de status vanuit de CLI:

```bash
openclaw tasks list
openclaw tasks show <taskId>
openclaw tasks cancel <taskId>
```

## Configuratie

### Modelselectie

```json5
{
  agents: {
    defaults: {
      musicGenerationModel: {
        primary: "google/lyria-3-clip-preview",
        fallbacks: ["fal/fal-ai/minimax-music/v2.6", "minimax/music-2.6"],
      },
    },
  },
}
```

### Selectievolgorde voor aanbieders

OpenClaw probeert aanbieders in deze volgorde:

1. `model`-parameter uit de toolaanroep (als de agent er een opgeeft).
2. `musicGenerationModel.primary` uit de configuratie.
3. `musicGenerationModel.fallbacks` op volgorde.
4. Automatische detectie met alleen standaardaanbieders op basis van authenticatie:
   - huidige standaardaanbieder eerst;
   - overige geregistreerde aanbieders voor muziekgeneratie op volgorde van aanbieder-id.

Als een aanbieder faalt, wordt de volgende kandidaat automatisch geprobeerd. Als alle
pogingen falen, bevat de fout details van elke poging.

Stel `agents.defaults.mediaGenerationAutoProviderFallback: false` in om alleen
expliciete vermeldingen in `model`, `primary` en `fallbacks` te gebruiken.

## Opmerkingen per aanbieder

<AccordionGroup>
  <Accordion title="ComfyUI">
    Workflowgestuurd en afhankelijk van de geconfigureerde graph plus knooppuntmapping
    voor prompt-/uitvoervelden. De gebundelde `comfy`-Plugin sluit aan op de
    gedeelde tool `music_generate` via het aanbiedersregister voor muziekgeneratie.
  </Accordion>
  <Accordion title="fal">
    Gebruikt fal-modeleindpunten via het gedeelde authenticatiepad voor aanbieders. De
    gebundelde aanbieder gebruikt standaard `fal-ai/minimax-music/v2.6` en stelt ook
    `fal-ai/ace-step/prompt-to-audio` en
    `fal-ai/stable-audio-25/text-to-audio` beschikbaar voor prompt-naar-audioverzoeken.
  </Accordion>
  <Accordion title="Google (Lyria 3)">
    Gebruikt Lyria 3-batchgeneratie. De huidige gebundelde flow ondersteunt
    prompt, optionele tekst voor songteksten en optionele referentieafbeeldingen.
  </Accordion>
  <Accordion title="MiniMax">
    Gebruikt het batch-eindpunt `music_generation`. Ondersteunt prompt, optionele
    songteksten, instrumentale modus en mp3-uitvoer via `minimax`-authenticatie
    met API-sleutel of `minimax-portal` OAuth.
  </Accordion>
  <Accordion title="OpenRouter">
    Gebruikt audio-uitvoer van OpenRouter-chatvoltooiingen met streaming ingeschakeld. De
    gebundelde aanbieder gebruikt standaard `google/lyria-3-pro-preview` en stelt ook
    `openrouter/google/lyria-3-clip-preview` beschikbaar.
  </Accordion>
</AccordionGroup>

## Het juiste pad kiezen

- **Gedeeld, met aanbiederondersteuning** wanneer je modelselectie, failover
  tussen aanbieders en de ingebouwde asynchrone taak-/statusflow wilt.
- **Pluginpad (ComfyUI)** wanneer je een aangepaste workflowgraph nodig hebt of een
  aanbieder die geen deel uitmaakt van de gedeelde gebundelde muziekmogelijkheid.

Als je ComfyUI-specifiek gedrag debugt, zie
[ComfyUI](/nl/providers/comfy). Als je gedeeld aanbiedergedrag debugt,
begin dan met [fal](/nl/providers/fal), [Google (Gemini)](/nl/providers/google),
[MiniMax](/nl/providers/minimax) of [OpenRouter](/nl/providers/openrouter).

## Mogelijkheidsmodi voor aanbieders

Het gedeelde contract voor muziekgeneratie ondersteunt expliciete modusdeclaraties:

- `generate` voor generatie met alleen een prompt.
- `edit` wanneer de aanvraag een of meer referentieafbeeldingen bevat.

Nieuwe aanbiederimplementaties moeten de voorkeur geven aan expliciete modusblokken:

```typescript
capabilities: {
  generate: {
    maxTracks: 1,
    supportsLyrics: true,
    supportsFormat: true,
  },
  edit: {
    enabled: true,
    maxTracks: 1,
    maxInputImages: 1,
    supportsFormat: true,
  },
}
```

Verouderde platte velden zoals `maxInputImages`, `supportsLyrics` en
`supportsFormat` zijn **niet** genoeg om bewerkingsondersteuning aan te geven. Aanbieders
moeten `generate` en `edit` expliciet declareren, zodat livetests, contracttests
en de gedeelde tool `music_generate` modusondersteuning deterministisch kunnen
valideren.

## Livetests

Opt-in livedekking voor de gedeelde gebundelde aanbieders:

```bash
OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts
```

Repo-wrapper:

```bash
pnpm test:live:media music
```

Dit livebestand gebruikt standaard reeds geëxporteerde omgevingsvariabelen van aanbieders vóór opgeslagen authenticatieprofielen
en voert zowel `generate` als gedeclareerde `edit`-dekking uit wanneer
de aanbieder de bewerkingsmodus inschakelt. Dekking op dit moment:

- `google`: `generate` plus `edit`
- `fal`: alleen `generate`
- `minimax`: alleen `generate`
- `openrouter`: `generate` plus `edit`
- `comfy`: afzonderlijke Comfy-livedekking, niet de gedeelde aanbiedersweep

Opt-in livedekking voor het gebundelde ComfyUI-muziekpad:

```bash
OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts
```

Het Comfy-livebestand dekt ook comfy-workflows voor afbeeldingen en video wanneer die
secties zijn geconfigureerd.

## Gerelateerd

- [Achtergrondtaken](/nl/automation/tasks) — taaktracking voor losgekoppelde `music_generate`-runs
- [ComfyUI](/nl/providers/comfy)
- [Configuratiereferentie](/nl/gateway/config-agents#agent-defaults) — `musicGenerationModel`-configuratie
- [Google (Gemini)](/nl/providers/google)
- [MiniMax](/nl/providers/minimax)
- [Modellen](/nl/concepts/models) — modelconfiguratie en failover
- [Tooloverzicht](/nl/tools)
