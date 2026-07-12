---
read_when:
    - Muziek of audio genereren via de agent
    - Muziekgeneratieproviders en -modellen configureren
    - Inzicht in de parameters van de tool music_generate
sidebarTitle: Music generation
summary: Genereer muziek via music_generate met workflows voor ComfyUI, fal, Google Lyria, MiniMax en OpenRouter
title: Muziek genereren
x-i18n:
    generated_at: "2026-07-12T09:23:49Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5a540f537141f0d97b264420aae9e986c1f0c3927b8988ebbaf3798b8afd5dd2
    source_path: tools/music-generation.md
    workflow: 16
---

De tool `music_generate` maakt muziek of audio via de gedeelde
mogelijkheid voor muziekgeneratie, ondersteund door ComfyUI, fal, Google, MiniMax en
OpenRouter.

<Note>
`music_generate` verschijnt alleen wanneer ten minste één provider voor muziekgeneratie
beschikbaar is: een expliciete configuratie voor `agents.defaults.musicGenerationModel`, of een
provider waarvoor authenticatie is geconfigureerd (bijvoorbeeld met een ingestelde API-sleutel).
</Note>

Voor agentuitvoeringen met sessieondersteuning start `music_generate` als achtergrondtaak,
houdt de voortgang bij in het takenregister en wekt vervolgens de agent wanneer de track
gereed is, zodat deze de gebruiker kan informeren en de voltooide audio kan bijvoegen. De voltooiingsagent
volgt het contract voor zichtbare antwoorden van de sessie: automatisch definitief antwoord
wanneer dit is geconfigureerd, of `message(action="send")` wanneer de sessie het
berichtenhulpmiddel vereist. Als de sessie van de aanvrager inactief is of het wekken mislukt en
de gegenereerde audio nog steeds in het antwoord ontbreekt, stuurt OpenClaw een
idempotente directe terugval met uitsluitend de ontbrekende audio.

## Snel aan de slag

<Tabs>
  <Tab title="Gedeeld, door providers ondersteund">
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
      <Step title="De agent een opdracht geven">
        _"Genereer een opgewekte synthpoptrack over een nachtelijke autorit door een
        neonstad."_

        De agent roept `music_generate` automatisch aan. Het toevoegen aan een
        toestemmingslijst voor hulpmiddelen is niet nodig.
      </Step>
    </Steps>

    Zonder een agentuitvoering met sessieondersteuning (directe/lokale contexten) wordt het hulpmiddel
    inline uitgevoerd en retourneert het het uiteindelijke mediapad in hetzelfde hulpmiddelresultaat.

  </Tab>
  <Tab title="ComfyUI-workflow">
    <Steps>
      <Step title="De workflow configureren">
        Configureer `plugins.entries.comfy.config.music` met een workflow-
        JSON en knooppunten voor prompts en uitvoer.
      </Step>
      <Step title="Cloudauthenticatie (optioneel)">
        Stel voor Comfy Cloud `COMFY_API_KEY` of `COMFY_CLOUD_API_KEY` in.
      </Step>
      <Step title="Het hulpmiddel aanroepen">
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

Gebruik `action: "list"` om beschikbare providers/modellen te bekijken en
`action: "status"` om de actieve muziektaak met sessieondersteuning te bekijken:

```text
/tool music_generate action=list
/tool music_generate action=status
```

Voorbeeld van directe generatie:

```text
/tool music_generate prompt="Dreamy lo-fi hip hop with vinyl texture and gentle rain" instrumental=true
```

## Ondersteunde providers

| Provider   | Standaardmodel               | Referentie-invoer | Ondersteunde instellingen                               | Authenticatie                          |
| ---------- | ---------------------------- | ----------------- | ------------------------------------------------------- | -------------------------------------- |
| ComfyUI    | `workflow`                   | Maximaal 1 afbeelding | Door de workflow gedefinieerde muziek of audio       | `COMFY_API_KEY`, `COMFY_CLOUD_API_KEY` |
| fal        | `fal-ai/minimax-music/v2.6`  | Geen              | `lyrics`, `instrumental`, `durationSeconds`, `format`   | `FAL_KEY` of `FAL_API_KEY`             |
| Google     | `lyria-3-clip-preview`       | Maximaal 10 afbeeldingen | `lyrics`, `instrumental`, `format`                 | `GEMINI_API_KEY`, `GOOGLE_API_KEY`     |
| MiniMax    | `music-2.6`                  | Geen              | `lyrics`, `instrumental`, `format` (alleen mp3)         | `MINIMAX_API_KEY` of MiniMax OAuth     |
| OpenRouter | `google/lyria-3-pro-preview` | Maximaal 1 afbeelding | `lyrics`, `instrumental`, `durationSeconds`, `format` | `OPENROUTER_API_KEY`                 |

MiniMax registreert twee provider-id's die dezelfde modellen delen: `minimax` voor
authenticatie met een API-sleutel en `minimax-portal` voor OAuth. Modelreferenties volgen het authenticatiepad
(`minimax/music-2.6` tegenover `minimax-portal/music-2.6`); zie
[MiniMax](/nl/providers/minimax#music-generation).

fal biedt naast zijn standaardmodel dat door MiniMax wordt ondersteund ook
`fal-ai/ace-step/prompt-to-audio` (wav, geen songteksten, geen
schakeloptie voor instrumentale uitvoer) en `fal-ai/stable-audio-25/text-to-audio` (wav,
alleen prompt) aan. Het standaardmodel `lyria-3-clip-preview` van Google levert
alleen mp3; `lyria-3-pro-preview` ondersteunt ook wav. MiniMax biedt daarnaast
`music-2.6-free`, `music-cover` en `music-cover-free` aan. OpenRouter biedt ook
`google/lyria-3-clip-preview` aan.

### Mogelijkhedenmatrix

Het expliciete moduscontract dat wordt gebruikt door `music_generate`, contracttests en de
gedeelde livecontrole:

| Provider   | `generate` | `edit` | Bewerkingslimiet | Gedeelde livetesttrajecten                                                |
| ---------- | :--------: | :----: | ---------------- | ------------------------------------------------------------------------- |
| ComfyUI    |     ✓      |   ✓    | 1 afbeelding     | Niet in de gedeelde controle; gedekt door `extensions/comfy/comfy.live.test.ts` |
| fal        |     ✓      |   —    | Geen             | `generate`                                                                |
| Google     |     ✓      |   ✓    | 10 afbeeldingen  | `generate`, `edit`                                                        |
| MiniMax    |     ✓      |   —    | Geen             | `generate`                                                                |
| OpenRouter |     ✓      |   ✓    | 1 afbeelding     | `generate`, `edit`                                                        |

## Hulpmiddelparameters

<ParamField path="prompt" type="string" required>
  Prompt voor muziekgeneratie. Vereist voor `action: "generate"`.
</ParamField>
<ParamField path="action" type='"generate" | "status" | "list"' default="generate">
  `"status"` retourneert de huidige sessietaak; `"list"` toont de providers.
</ParamField>
<ParamField path="model" type="string">
  Overschrijving van provider/model (bijvoorbeeld `google/lyria-3-pro-preview`,
  `comfy/workflow`).
</ParamField>
<ParamField path="lyrics" type="string">
  Optionele songtekst wanneer de provider expliciete invoer van songteksten ondersteunt.
</ParamField>
<ParamField path="instrumental" type="boolean">
  Vraag om uitsluitend instrumentale uitvoer wanneer de provider dit ondersteunt.
</ParamField>
<ParamField path="image" type="string">
  Pad of URL van één referentieafbeelding.
</ParamField>
<ParamField path="images" type="string[]">
  Meerdere referentieafbeeldingen (maximaal 10 bij providers die dit ondersteunen).
</ParamField>
<ParamField path="durationSeconds" type="number">
  Gewenste duur in seconden wanneer de provider duuraanwijzingen ondersteunt.
</ParamField>
<ParamField path="format" type='"mp3" | "wav"'>
  Aanwijzing voor de uitvoerindeling wanneer de provider dit ondersteunt.
</ParamField>
<ParamField path="filename" type="string">Aanwijzing voor de uitvoerbestandsnaam.</ParamField>

<Note>
Niet alle providers ondersteunen alle parameters. OpenClaw valideert nog steeds harde
limieten, zoals aantallen invoeritems, vóór verzending. Wanneer een provider
duur ondersteunt maar een lager maximum hanteert dan de aangevraagde waarde, begrenst OpenClaw
deze tot de dichtstbijzijnde ondersteunde duur. Werkelijk niet-ondersteunde optionele aanwijzingen
worden met een waarschuwing genegeerd wanneer de geselecteerde provider of het geselecteerde model
ze niet kan toepassen. Hulpmiddelresultaten vermelden de toegepaste instellingen; `details.normalization`
legt elke omzetting van aangevraagd naar toegepast vast.
</Note>

Time-outs voor providerverzoeken zijn uitsluitend operatorconfiguratie. OpenClaw gebruikt
`agents.defaults.musicGenerationModel.timeoutMs` wanneer dit is geconfigureerd, verhoogt
waarden onder 120000ms naar 120000ms en gebruikt anders standaard 300000ms
voor providerverzoeken.

## Asynchroon gedrag

Muziekgeneratie met sessieondersteuning wordt uitgevoerd als achtergrondtaak:

- **Achtergrondtaak:** `music_generate` maakt een achtergrondtaak, retourneert
  onmiddellijk een gestart/taakantwoord en plaatst de voltooide track later in
  een vervolbericht van de agent.
- **Voorkoming van duplicaten:** zolang een taak `queued` of `running` is, retourneren latere
  aanroepen van `music_generate` in dezelfde sessie de taakstatus in plaats van
  een nieuwe generatie te starten. Gebruik `action: "status"` voor een expliciete controle.
  Een onlangs voltooide identieke aanvraag wordt gedurende 2 minuten eveneens gededupliceerd.
- **Status opzoeken:** `openclaw tasks list` of `openclaw tasks show <taskId>`
  toont de wachtrijstatus, actieve status en eindstatus.
- **Wekken bij voltooiing:** OpenClaw voegt een interne voltooiingsgebeurtenis terug
  in dezelfde sessie in, zodat het model zelf het gebruikersgerichte vervolbericht
  kan schrijven.
- **Promptaanwijzing:** latere gebruikers-/handmatige beurten in dezelfde sessie krijgen een kleine
  runtime-aanwijzing wanneer er al een muziektaak wordt uitgevoerd, zodat het model
  `music_generate` niet blindelings opnieuw aanroept.
- **Terugval zonder sessie:** directe/lokale contexten zonder een echte agent-
  sessie worden inline uitgevoerd en retourneren het uiteindelijke audioresultaat in dezelfde beurt.

### Levenscyclus van taken

De muziektaak toont dezelfde statussen als het algemene takenregister (zie
[Achtergrondtaken](/nl/automation/tasks#task-lifecycle) voor de volledige toestandsmachine,
inclusief `timed_out`, `cancelled` en `lost`). De meeste muziekuitvoeringen
doorlopen:

| Status      | Betekenis                                                                                      |
| ----------- | ---------------------------------------------------------------------------------------------- |
| `queued`    | Taak aangemaakt en wacht tot de provider deze accepteert.                                      |
| `running`   | De provider verwerkt de taak (doorgaans 30 seconden tot 3 minuten, afhankelijk van provider en duur). |
| `succeeded` | Track gereed; de agent wordt gewekt en plaatst deze in het gesprek.                            |
| `failed`    | Providerfout of time-out; de agent wordt gewekt met foutdetails.                               |

Controleer de status via de CLI:

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

### Selectievolgorde van providers

OpenClaw probeert providers in deze volgorde:

1. De parameter `model` uit de hulpmiddelaanroep (als de agent er een opgeeft).
2. `musicGenerationModel.primary` uit de configuratie.
3. `musicGenerationModel.fallbacks` in de opgegeven volgorde.
4. Automatische detectie, uitsluitend met standaardproviders waarvoor authenticatie is geconfigureerd:
   - eerst de provider van het huidige standaardtekstmodel, als deze ook muziek-
     generatie aanbiedt;
   - daarna de overige geregistreerde providers voor muziekgeneratie, alfabetisch op
     provider-id.

Als een provider mislukt, wordt automatisch de volgende kandidaat geprobeerd. Als alle
pogingen mislukken, bevat de fout details van elke poging.

Stel `agents.defaults.mediaGenerationAutoProviderFallback: false` in om uitsluitend
expliciete vermeldingen voor `model`, `primary` en `fallbacks` te gebruiken.

## Opmerkingen over providers

<AccordionGroup>
  <Accordion title="ComfyUI">
    Workflowgestuurd en afhankelijk van de geconfigureerde graaf plus de Node-toewijzing
    voor prompt-/uitvoervelden. De meegeleverde `comfy`-Plugin sluit aan op de
    gedeelde tool `music_generate` via het providerregister voor
    muziekgeneratie.
  </Accordion>
  <Accordion title="fal">
    Gebruikt fal-modeleindpunten via het gedeelde authenticatiepad van de provider. De
    meegeleverde provider gebruikt standaard `fal-ai/minimax-music/v2.6` en biedt ook
    `fal-ai/ace-step/prompt-to-audio` en
    `fal-ai/stable-audio-25/text-to-audio` voor prompt-naar-audioverzoeken.
    Songteksten en instrumentale modus zijn alleen beschikbaar voor MiniMax-modellen; de andere twee
    modellen ondersteunen alleen prompts.
  </Accordion>
  <Accordion title="Google (Lyria 3)">
    Gebruikt batchgeneratie met Lyria 3. De huidige meegeleverde werkwijze ondersteunt
    een prompt, optionele songtekst en optionele referentieafbeeldingen. Het
    standaardmodel `lyria-3-clip-preview` voert alleen mp3 uit; het
    model `lyria-3-pro-preview` ondersteunt ook wav.
  </Accordion>
  <Accordion title="MiniMax">
    Gebruikt het batcheindpunt `music_generation`. Ondersteunt een prompt, optionele
    songteksten, instrumentale modus en mp3-uitvoer via authenticatie met een
    `minimax`-API-sleutel of `minimax-portal` OAuth. Biedt ook de modellen
    `music-2.6-free`, `music-cover` en `music-cover-free`.
  </Accordion>
  <Accordion title="OpenRouter">
    Gebruikt audio-uitvoer van OpenRouter-chatvoltooiingen met streaming ingeschakeld. De
    meegeleverde provider gebruikt standaard `google/lyria-3-pro-preview` en biedt ook
    `openrouter/google/lyria-3-clip-preview`.
  </Accordion>
</AccordionGroup>

## Het juiste pad kiezen

- **Gedeeld en providerondersteund** wanneer u modelselectie, provider-
  failover en de ingebouwde asynchrone taak-/statusstroom wilt.
- **Plugin-pad (ComfyUI)** wanneer u een aangepaste workflowgraaf nodig hebt of een
  provider die geen deel uitmaakt van de gedeelde, meegeleverde muziekfunctionaliteit.

Als u ComfyUI-specifiek gedrag onderzoekt, raadpleeg dan
[ComfyUI](/nl/providers/comfy). Als u gedeeld providergedrag onderzoekt,
begin dan met [fal](/nl/providers/fal), [Google (Gemini)](/nl/providers/google),
[MiniMax](/nl/providers/minimax) of [OpenRouter](/nl/providers/openrouter).

## Modi voor providermogelijkheden

Het gedeelde contract voor muziekgeneratie ondersteunt expliciete modusdeclaraties:

- `generate` voor generatie op basis van alleen een prompt.
- `edit` wanneer het verzoek een of meer referentieafbeeldingen bevat.

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
`supportsFormat` zijn **niet** voldoende om ondersteuning voor bewerken aan te geven. Providers
moeten `generate` en `edit` expliciet declareren, zodat livetests, contracttests
en de gedeelde tool `music_generate` de modusondersteuning
deterministisch kunnen valideren.

## Livetests

Optionele livedekking voor de gedeelde, meegeleverde providers (fal, Google, MiniMax,
OpenRouter):

```bash
OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts
```

Gelijkwaardige repository-wrapper die hetzelfde testbestand uitvoert:

```bash
pnpm test:live:media:music
```

Dit livebestand gebruikt standaard reeds geëxporteerde provideromgevingsvariabelen vóór opgeslagen
authenticatieprofielen en voert zowel `generate` als de gedeclareerde `edit`-dekking uit wanneer
de provider de bewerkingsmodus inschakelt. Huidige dekking:

- `google`: `generate` plus `edit`
- `fal`: alleen `generate`
- `minimax`: alleen `generate`
- `openrouter`: `generate` plus `edit`
- `comfy`: afzonderlijke Comfy-livedekking, niet de gedeelde providersweep

Optionele livedekking voor het meegeleverde ComfyUI-muziekpad:

```bash
OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts
```

Het Comfy-livebestand dekt ook Comfy-workflows voor afbeeldingen en video wanneer die
secties zijn geconfigureerd.

## Gerelateerd

- [Achtergrondtaken](/nl/automation/tasks) — taakregistratie voor losgekoppelde `music_generate`-uitvoeringen
- [ComfyUI](/nl/providers/comfy)
- [Configuratiereferentie](/nl/gateway/config-agents#agent-defaults) — configuratie van `musicGenerationModel`
- [Google (Gemini)](/nl/providers/google)
- [MiniMax](/nl/providers/minimax)
- [Modellen](/nl/concepts/models) — modelconfiguratie en failover
- [Overzicht van tools](/nl/tools)
