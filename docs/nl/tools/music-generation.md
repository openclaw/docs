---
read_when:
    - Muziek of audio genereren via de agent
    - Muziekgeneratieproviders en -modellen configureren
    - De parameters van de tool music_generate begrijpen
sidebarTitle: Music generation
summary: Genereer muziek via music_generate in Google Lyria-, MiniMax- en ComfyUI-workflows
title: Muziekgeneratie
x-i18n:
    generated_at: "2026-05-02T11:30:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9199afe17b2641efb1a7523c651724af9c312c1415c7e60ca736341699f6bc26
    source_path: tools/music-generation.md
    workflow: 16
---

De `music_generate`-tool laat de agent muziek of audio maken via de
gedeelde mogelijkheid voor muziekgeneratie met geconfigureerde providers —
Google, MiniMax en workflow-geconfigureerde ComfyUI op dit moment.

Voor agent-runs met sessieondersteuning start OpenClaw muziekgeneratie als
achtergrondtaak, houdt deze bij in het taakregister, en wekt de agent daarna
opnieuw wanneer de track klaar is, zodat de agent de voltooide audio terug kan
plaatsen in het oorspronkelijke kanaal.

<Note>
De ingebouwde gedeelde tool verschijnt alleen wanneer minstens één
muziekgeneratieprovider beschikbaar is. Als je `music_generate` niet ziet in de
tools van je agent, configureer dan `agents.defaults.musicGenerationModel` of stel
een API-sleutel voor een provider in.
</Note>

## Snel aan de slag

<Tabs>
  <Tab title="Gedeeld met providerondersteuning">
    <Steps>
      <Step title="Auth configureren">
        Stel een API-sleutel in voor minstens één provider — bijvoorbeeld
        `GEMINI_API_KEY` of `MINIMAX_API_KEY`.
      </Step>
      <Step title="Kies een standaardmodel (optioneel)">
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
      <Step title="Vraag het de agent">
        _"Genereer een opgewekte synthpoptrack over een nachtelijke rit door een
        neonstad."_

        De agent roept `music_generate` automatisch aan. Geen tool-
        allow-listing nodig.
      </Step>
    </Steps>

    Voor directe synchrone contexten zonder agent-run met sessieondersteuning
    valt de ingebouwde tool nog steeds terug op inline generatie en retourneert
    het uiteindelijke mediapad in het toolresultaat.

  </Tab>
  <Tab title="ComfyUI-workflow">
    <Steps>
      <Step title="Configureer de workflow">
        Configureer `plugins.entries.comfy.config.music` met een workflow-
        JSON en prompt-/uitvoernodes.
      </Step>
      <Step title="Cloud-auth (optioneel)">
        Stel voor Comfy Cloud `COMFY_API_KEY` of `COMFY_CLOUD_API_KEY` in.
      </Step>
      <Step title="Roep de tool aan">
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

## Ondersteunde providers

| Provider | Standaardmodel        | Referentie-invoer | Ondersteunde bedieningselementen                          | Auth                                   |
| -------- | ---------------------- | ----------------- | --------------------------------------------------------- | -------------------------------------- |
| ComfyUI  | `workflow`             | Tot 1 afbeelding  | Workflow-gedefinieerde muziek of audio                    | `COMFY_API_KEY`, `COMFY_CLOUD_API_KEY` |
| Google   | `lyria-3-clip-preview` | Tot 10 afbeeldingen | `lyrics`, `instrumental`, `format`                      | `GEMINI_API_KEY`, `GOOGLE_API_KEY`     |
| MiniMax  | `music-2.6`            | Geen              | `lyrics`, `instrumental`, `durationSeconds`, `format=mp3` | `MINIMAX_API_KEY` of MiniMax OAuth     |

### Mogelijkhedenmatrix

Het expliciete moduscontract dat wordt gebruikt door `music_generate`, contracttests
en de gedeelde live-sweep:

| Provider | `generate` | `edit` | Bewerkingslimiet | Gedeelde live-lanes                                                     |
| -------- | :--------: | :----: | ---------------- | ---------------------------------------------------------------------- |
| ComfyUI  |     ✓      |   ✓    | 1 afbeelding     | Niet in de gedeelde sweep; gedekt door `extensions/comfy/comfy.live.test.ts` |
| Google   |     ✓      |   ✓    | 10 afbeeldingen  | `generate`, `edit`                                                     |
| MiniMax  |     ✓      |   —    | Geen             | `generate`                                                             |

Gebruik `action: "list"` om beschikbare gedeelde providers en modellen tijdens
runtime te bekijken:

```text
/tool music_generate action=list
```

Gebruik `action: "status"` om de actieve muziektak met sessieondersteuning te
bekijken:

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
  `"status"` retourneert de huidige sessietaak; `"list"` inspecteert providers.
</ParamField>
<ParamField path="model" type="string">
  Overschrijving voor provider/model (bijv. `google/lyria-3-pro-preview`,
  `comfy/workflow`).
</ParamField>
<ParamField path="lyrics" type="string">
  Optionele songteksten wanneer de provider expliciete invoer voor songteksten ondersteunt.
</ParamField>
<ParamField path="instrumental" type="boolean">
  Vraag uitvoer met alleen instrumenten aan wanneer de provider dit ondersteunt.
</ParamField>
<ParamField path="image" type="string">
  Pad of URL naar één referentieafbeelding.
</ParamField>
<ParamField path="images" type="string[]">
  Meerdere referentieafbeeldingen (tot 10 bij ondersteunende providers).
</ParamField>
<ParamField path="durationSeconds" type="number">
  Doelduur in seconden wanneer de provider duurhints ondersteunt.
</ParamField>
<ParamField path="format" type='"mp3" | "wav"'>
  Hint voor uitvoerformaat wanneer de provider dit ondersteunt.
</ParamField>
<ParamField path="filename" type="string">Hint voor uitvoerbestandsnaam.</ParamField>
<ParamField path="timeoutMs" type="number">Optionele time-out voor providerverzoeken in milliseconden. Waarden onder 10000 ms worden verhoogd naar 10000 ms en gerapporteerd in het toolresultaat.</ParamField>

<Note>
Niet alle providers ondersteunen alle parameters. OpenClaw valideert nog steeds
harde limieten, zoals invoeraantallen, vóór indiening. Wanneer een provider
duur ondersteunt maar een korter maximum gebruikt dan de aangevraagde waarde,
klemt OpenClaw af naar de dichtstbijzijnde ondersteunde duur. Werkelijk niet-
ondersteunde optionele hints worden genegeerd met een waarschuwing wanneer de
geselecteerde provider of het geselecteerde model ze niet kan honoreren.
Toolresultaten rapporteren toegepaste instellingen; `details.normalization`
legt elke mapping van aangevraagd naar toegepast vast.
</Note>

## Asynchroon gedrag

Muziekgeneratie met sessieondersteuning draait als achtergrondtaak:

- **Achtergrondtaak:** `music_generate` maakt een achtergrondtaak aan, retourneert
  onmiddellijk een gestart-/taakrespons en plaatst de voltooide track later in
  een vervolgbericht van de agent.
- **Dubbele uitvoering voorkomen:** zolang een taak `queued` of `running` is,
  retourneren latere `music_generate`-aanroepen in dezelfde sessie de taakstatus
  in plaats van een nieuwe generatie te starten. Gebruik `action: "status"` om dit
  expliciet te controleren.
- **Status opzoeken:** `openclaw tasks list` of `openclaw tasks show <taskId>`
  inspecteert wachtrij-, actieve en terminale status.
- **Wekken bij voltooiing:** OpenClaw injecteert een interne voltooiingsgebeurtenis
  terug in dezelfde sessie, zodat het model zelf het gebruikersgerichte
  vervolgbericht kan schrijven.
- **Prompthint:** latere gebruikers-/handmatige beurten in dezelfde sessie krijgen
  een kleine runtime-hint wanneer er al een muziektak loopt, zodat het model niet
  blind opnieuw `music_generate` aanroept.
- **Fallback zonder sessie:** directe/lokale contexten zonder echte agentsessie
  draaien inline en retourneren het uiteindelijke audioresultaat in dezelfde beurt.

### Taaklevenscyclus

| Status      | Betekenis                                                                                     |
| ----------- | --------------------------------------------------------------------------------------------- |
| `queued`    | Taak aangemaakt, wacht tot de provider deze accepteert.                                       |
| `running`   | Provider is aan het verwerken (meestal 30 seconden tot 3 minuten, afhankelijk van provider en duur). |
| `succeeded` | Track klaar; de agent wordt gewekt en plaatst deze in het gesprek.                           |
| `failed`    | Providerfout of time-out; de agent wordt gewekt met foutdetails.                             |

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
        fallbacks: ["minimax/music-2.6"],
      },
    },
  },
}
```

### Selectievolgorde voor providers

OpenClaw probeert providers in deze volgorde:

1. `model`-parameter uit de toolaanroep (als de agent er een opgeeft).
2. `musicGenerationModel.primary` uit de configuratie.
3. `musicGenerationModel.fallbacks` op volgorde.
4. Automatische detectie met alleen auth-ondersteunde providerstandaarden:
   - huidige standaardprovider eerst;
   - overige geregistreerde muziekgeneratieproviders in provider-id-volgorde.

Als een provider faalt, wordt de volgende kandidaat automatisch geprobeerd. Als
alles faalt, bevat de fout details van elke poging.

Stel `agents.defaults.mediaGenerationAutoProviderFallback: false` in om alleen
expliciete `model`-, `primary`- en `fallbacks`-items te gebruiken.

## Providernotities

<AccordionGroup>
  <Accordion title="ComfyUI">
    Workflowgestuurd en afhankelijk van de geconfigureerde graaf plus nodemapping
    voor prompt-/uitvoervelden. De meegeleverde `comfy`-Plugin sluit aan op de
    gedeelde `music_generate`-tool via het providerregister voor muziekgeneratie.
  </Accordion>
  <Accordion title="Google (Lyria 3)">
    Gebruikt batchgeneratie met Lyria 3. De huidige meegeleverde flow ondersteunt
    prompt, optionele songtekst en optionele referentieafbeeldingen.
  </Accordion>
  <Accordion title="MiniMax">
    Gebruikt het batch-`music_generation`-endpoint. Ondersteunt prompt, optionele
    songteksten, instrumentale modus, duursturing en mp3-uitvoer via
    `minimax`-auth met API-sleutel of `minimax-portal` OAuth.
  </Accordion>
</AccordionGroup>

## Het juiste pad kiezen

- **Gedeeld met providerondersteuning** wanneer je modelselectie, provider-
  failover en de ingebouwde asynchrone taak-/statusflow wilt.
- **Plugin-pad (ComfyUI)** wanneer je een aangepaste workflowgraaf nodig hebt of
  een provider die geen deel uitmaakt van de gedeelde meegeleverde muziekmogelijkheid.

Als je ComfyUI-specifiek gedrag debugt, zie
[ComfyUI](/nl/providers/comfy). Als je gedeeld providergedrag debugt, begin dan met
[Google (Gemini)](/nl/providers/google) of [MiniMax](/nl/providers/minimax).

## Provider-mogelijkheidsmodi

Het gedeelde contract voor muziekgeneratie ondersteunt expliciete modusdeclaraties:

- `generate` voor generatie met alleen een prompt.
- `edit` wanneer de aanvraag één of meer referentieafbeeldingen bevat.

Nieuwe providerimplementaties moeten de voorkeur geven aan expliciete modusblokken:

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

Verouderde vlakke velden zoals `maxInputImages`, `supportsLyrics` en
`supportsFormat` zijn **niet** genoeg om bewerkingsondersteuning te adverteren.
Providers moeten `generate` en `edit` expliciet declareren, zodat live tests,
contracttests en de gedeelde `music_generate`-tool modusondersteuning
deterministisch kunnen valideren.

## Live tests

Opt-in live dekking voor de gedeelde meegeleverde providers:

```bash
OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts
```

Repo-wrapper:

```bash
pnpm test:live:media music
```

Dit live bestand laadt ontbrekende provider-env-vars uit `~/.profile`, geeft
standaard de voorkeur aan live/env API-sleutels boven opgeslagen auth-profielen,
en draait zowel `generate` als gedeclareerde `edit`-dekking wanneer de provider
de bewerkingsmodus inschakelt. Dekking vandaag:

- `google`: `generate` plus `edit`
- `minimax`: alleen `generate`
- `comfy`: afzonderlijke Comfy live dekking, niet de gedeelde provider-sweep

Opt-in live dekking voor het meegeleverde ComfyUI-muziekpad:

```bash
OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts
```

Het Comfy-livebestand behandelt ook comfy-afbeeldings- en videoworkflows wanneer die
secties zijn geconfigureerd.

## Gerelateerd

- [Achtergrondtaken](/nl/automation/tasks) — taaktracking voor losgekoppelde `music_generate`-runs
- [ComfyUI](/nl/providers/comfy)
- [Configuratiereferentie](/nl/gateway/config-agents#agent-defaults) — `musicGenerationModel`-configuratie
- [Google (Gemini)](/nl/providers/google)
- [MiniMax](/nl/providers/minimax)
- [Modellen](/nl/concepts/models) — modelconfiguratie en failover
- [Tools-overzicht](/nl/tools)
