---
read_when:
    - Muziek of audio genereren via de agent
    - Muziekgeneratieproviders en -modellen configureren
    - Inzicht in de parameters van het hulpprogramma music_generate
sidebarTitle: Music generation
summary: Genereer muziek via music_generate in Google Lyria-, MiniMax- en ComfyUI-werkstromen
title: Muziekgeneratie
x-i18n:
    generated_at: "2026-05-05T01:51:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0e14a5a10dd485c2d3dbbd23a0fc2c12de500d9f7bfb7db471c27ed2a99ad650
    source_path: tools/music-generation.md
    workflow: 16
---

Met de tool `music_generate` kan de agent muziek of audio maken via de gedeelde mogelijkheid voor muziekgeneratie met geconfigureerde providers: momenteel Google, MiniMax en via workflow geconfigureerde ComfyUI.

Voor sessie-ondersteunde agent-runs start OpenClaw muziekgeneratie als achtergrondtaak, houdt deze bij in het takenlogboek en maakt de agent daarna weer wakker wanneer de track klaar is, zodat de agent de gebruiker kan informeren en de voltooide audio kan bijvoegen. In groeps-/kanaalchats die alleen zichtbare levering via berichtentools gebruiken, geeft de agent het resultaat door via de berichtentool.

<Note>
De ingebouwde gedeelde tool verschijnt alleen wanneer ten minste één provider voor muziekgeneratie beschikbaar is. Als je `music_generate` niet ziet in de tools van je agent, configureer dan `agents.defaults.musicGenerationModel` of stel een API-sleutel voor een provider in.
</Note>

## Snel aan de slag

<Tabs>
  <Tab title="Ondersteund door gedeelde provider">
    <Steps>
      <Step title="Authenticatie configureren">
        Stel een API-sleutel in voor ten minste één provider, bijvoorbeeld
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

        De agent roept `music_generate` automatisch aan. Geen allow-listing
        voor tools nodig.
      </Step>
    </Steps>

    Voor directe synchrone contexten zonder sessie-ondersteunde agent-run
    valt de ingebouwde tool nog steeds terug op inline generatie en retourneert
    het uiteindelijke mediapad in het toolresultaat.

  </Tab>
  <Tab title="ComfyUI-workflow">
    <Steps>
      <Step title="De workflow configureren">
        Configureer `plugins.entries.comfy.config.music` met een workflow-
        JSON en prompt-/uitvoerknooppunten.
      </Step>
      <Step title="Cloud-authenticatie (optioneel)">
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

## Ondersteunde providers

| Provider | Standaardmodel        | Referentie-invoer | Ondersteunde besturingselementen                         | Auth                                   |
| -------- | --------------------- | ----------------- | -------------------------------------------------------- | -------------------------------------- |
| ComfyUI  | `workflow`            | Maximaal 1 image  | Door workflow gedefinieerde muziek of audio              | `COMFY_API_KEY`, `COMFY_CLOUD_API_KEY` |
| Google   | `lyria-3-clip-preview` | Maximaal 10 images | `lyrics`, `instrumental`, `format`                       | `GEMINI_API_KEY`, `GOOGLE_API_KEY`     |
| MiniMax  | `music-2.6`           | Geen              | `lyrics`, `instrumental`, `durationSeconds`, `format=mp3` | `MINIMAX_API_KEY` of MiniMax OAuth     |

### Mogelijkhedenmatrix

Het expliciete moduscontract dat wordt gebruikt door `music_generate`, contracttests en de gedeelde live sweep:

| Provider | `generate` | `edit` | Bewerklimiet | Gedeelde live-lanes                                                       |
| -------- | :--------: | :----: | ------------ | ------------------------------------------------------------------------- |
| ComfyUI  |     ✓      |   ✓    | 1 image      | Niet in de gedeelde sweep; gedekt door `extensions/comfy/comfy.live.test.ts` |
| Google   |     ✓      |   ✓    | 10 images    | `generate`, `edit`                                                        |
| MiniMax  |     ✓      |   —    | Geen         | `generate`                                                                |

Gebruik `action: "list"` om beschikbare gedeelde providers en modellen tijdens runtime te bekijken:

```text
/tool music_generate action=list
```

Gebruik `action: "status"` om de actieve sessie-ondersteunde muziektaak te bekijken:

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
  `"status"` retourneert de huidige sessietaak; `"list"` bekijkt providers.
</ParamField>
<ParamField path="model" type="string">
  Provider-/modeloverride (bijv. `google/lyria-3-pro-preview`,
  `comfy/workflow`).
</ParamField>
<ParamField path="lyrics" type="string">
  Optionele songtekst wanneer de provider expliciete songtekstinvoer ondersteunt.
</ParamField>
<ParamField path="instrumental" type="boolean">
  Vraag uitvoer met alleen instrumentale audio aan wanneer de provider dit ondersteunt.
</ParamField>
<ParamField path="image" type="string">
  Pad of URL naar één referentie-image.
</ParamField>
<ParamField path="images" type="string[]">
  Meerdere referentie-images (maximaal 10 bij providers die dit ondersteunen).
</ParamField>
<ParamField path="durationSeconds" type="number">
  Doelduur in seconden wanneer de provider duurhints ondersteunt.
</ParamField>
<ParamField path="format" type='"mp3" | "wav"'>
  Hint voor uitvoerindeling wanneer de provider dit ondersteunt.
</ParamField>
<ParamField path="filename" type="string">Hint voor uitvoerbestandsnaam.</ParamField>
<ParamField path="timeoutMs" type="number">Optionele time-out voor providerverzoeken in milliseconden. Waarden onder 10000ms worden verhoogd naar 10000ms en gemeld in het toolresultaat.</ParamField>

<Note>
Niet alle providers ondersteunen alle parameters. OpenClaw valideert nog steeds harde limieten, zoals invoeraantallen, vóór verzending. Wanneer een provider duur ondersteunt maar een korter maximum gebruikt dan de gevraagde waarde, begrenst OpenClaw dit tot de dichtstbijzijnde ondersteunde duur. Echt niet-ondersteunde optionele hints worden genegeerd met een waarschuwing wanneer de geselecteerde provider of het geselecteerde model ze niet kan honoreren. Toolresultaten rapporteren toegepaste instellingen; `details.normalization` legt elke mapping van aangevraagd naar toegepast vast.
</Note>

## Asynchroon gedrag

Sessie-ondersteunde muziekgeneratie draait als achtergrondtaak:

- **Achtergrondtaak:** `music_generate` maakt een achtergrondtaak aan, retourneert direct een gestart-/taakrespons en plaatst de voltooide track later in een vervolgbericht van de agent.
- **Dubbele aanroepen voorkomen:** terwijl een taak `queued` of `running` is, retourneren latere `music_generate`-aanroepen in dezelfde sessie de taakstatus in plaats van een nieuwe generatie te starten. Gebruik `action: "status"` om dit expliciet te controleren.
- **Status opzoeken:** `openclaw tasks list` of `openclaw tasks show <taskId>` bekijkt wachtrij-, actieve en terminale status.
- **Voltooiingswake:** OpenClaw injecteert een interne voltooiingsgebeurtenis terug in dezelfde sessie, zodat het model zelf de gebruikersgerichte follow-up kan schrijven.
- **Prompthint:** latere gebruikers-/handmatige beurten in dezelfde sessie krijgen een kleine runtimehint wanneer er al een muziektaak loopt, zodat het model niet blind opnieuw `music_generate` aanroept.
- **Fallback zonder sessie:** directe/lokale contexten zonder echte agentsessie draaien inline en retourneren het uiteindelijke audioresultaat in dezelfde beurt.

### Taaklevenscyclus

| Status      | Betekenis                                                                                     |
| ----------- | --------------------------------------------------------------------------------------------- |
| `queued`    | Taak aangemaakt, wacht tot de provider deze accepteert.                                       |
| `running`   | Provider verwerkt de taak (meestal 30 seconden tot 3 minuten, afhankelijk van provider en duur). |
| `succeeded` | Track klaar; de agent wordt wakker en plaatst deze in het gesprek.                           |
| `failed`    | Providerfout of time-out; de agent wordt wakker met foutdetails.                              |

Controleer status via de CLI:

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

### Volgorde voor providerselectie

OpenClaw probeert providers in deze volgorde:

1. `model`-parameter uit de toolaanroep (als de agent er een opgeeft).
2. `musicGenerationModel.primary` uit configuratie.
3. `musicGenerationModel.fallbacks` op volgorde.
4. Automatische detectie met alleen door auth ondersteunde providerstandaarden:
   - huidige standaardprovider eerst;
   - resterende geregistreerde providers voor muziekgeneratie in volgorde van provider-id.

Als een provider faalt, wordt de volgende kandidaat automatisch geprobeerd. Als alle pogingen mislukken, bevat de fout details van elke poging.

Stel `agents.defaults.mediaGenerationAutoProviderFallback: false` in om alleen expliciete `model`-, `primary`- en `fallbacks`-vermeldingen te gebruiken.

## Providernotities

<AccordionGroup>
  <Accordion title="ComfyUI">
    Workflowgestuurd en afhankelijk van de geconfigureerde graaf plus knooppuntmapping
    voor prompt-/uitvoervelden. De gebundelde `comfy`-plugin koppelt aan de
    gedeelde `music_generate`-tool via het providerregister voor muziekgeneratie.
  </Accordion>
  <Accordion title="Google (Lyria 3)">
    Gebruikt Lyria 3-batchgeneratie. De huidige gebundelde flow ondersteunt
    prompt, optionele songtekst en optionele referentie-images.
  </Accordion>
  <Accordion title="MiniMax">
    Gebruikt het batchendpoint `music_generation`. Ondersteunt prompt, optionele
    songtekst, instrumentale modus, duursturing en mp3-uitvoer via
    `minimax` API-sleutel-authenticatie of `minimax-portal` OAuth.
  </Accordion>
</AccordionGroup>

## Het juiste pad kiezen

- **Ondersteund door gedeelde provider** wanneer je modelselectie, providerfailover en de ingebouwde asynchrone taak-/statusflow wilt.
- **Plugin-pad (ComfyUI)** wanneer je een aangepaste workflowgraaf nodig hebt of een provider die geen deel uitmaakt van de gedeelde gebundelde muziekmogelijkheid.

Als je ComfyUI-specifiek gedrag debugt, zie
[ComfyUI](/nl/providers/comfy). Als je gedeeld providergedrag debugt, begin dan met [Google (Gemini)](/nl/providers/google) of
[MiniMax](/nl/providers/minimax).

## Providermodi voor mogelijkheden

Het gedeelde contract voor muziekgeneratie ondersteunt expliciete modusdeclaraties:

- `generate` voor generatie op basis van alleen een prompt.
- `edit` wanneer de aanvraag één of meer referentie-images bevat.

Nieuwe providerimplementaties moeten bij voorkeur expliciete modusblokken gebruiken:

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
`supportsFormat` zijn **niet** genoeg om bewerkingsondersteuning te adverteren. Providers moeten `generate` en `edit` expliciet declareren, zodat live tests, contracttests en de gedeelde `music_generate`-tool modusondersteuning deterministisch kunnen valideren.

## Live tests

Opt-in live dekking voor de gedeelde gebundelde providers:

```bash
OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts
```

Repo-wrapper:

```bash
pnpm test:live:media music
```

Dit livebestand laadt ontbrekende provider-env-vars uit `~/.profile`, geeft standaard de voorkeur aan live/env API-sleutels boven opgeslagen auth-profielen en voert zowel `generate` als gedeclareerde `edit`-dekking uit wanneer de provider de bewerkingsmodus inschakelt. Dekking vandaag:

- `google`: `generate` plus `edit`
- `minimax`: alleen `generate`
- `comfy`: aparte Comfy-live dekking, niet de gedeelde provider-sweep

Opt-in live dekking voor het gebundelde ComfyUI-muziekpad:

```bash
OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts
```

Het Comfy-livebestand behandelt ook Comfy-afbeeldings- en videoworkflows wanneer die
secties zijn geconfigureerd.

## Gerelateerd

- [Achtergrondtaken](/nl/automation/tasks) — taaktracking voor losgekoppelde `music_generate`-uitvoeringen
- [ComfyUI](/nl/providers/comfy)
- [Configuratiereferentie](/nl/gateway/config-agents#agent-defaults) — `musicGenerationModel`-configuratie
- [Google (Gemini)](/nl/providers/google)
- [MiniMax](/nl/providers/minimax)
- [Modellen](/nl/concepts/models) — modelconfiguratie en uitvalovername
- [Tooloverzicht](/nl/tools)
