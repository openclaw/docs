---
read_when:
    - Muziek of audio genereren via de agent
    - Muziekgeneratieproviders en -modellen configureren
    - De parameters van de tool music_generate begrijpen
sidebarTitle: Music generation
summary: Genereer muziek via music_generate in Google Lyria-, MiniMax- en ComfyUI-werkstromen
title: Muziekgeneratie
x-i18n:
    generated_at: "2026-04-29T23:25:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4eda549dbb93cbfe15e04462e08b7c86ff0718160244e3e5de3b041c62ee81ea
    source_path: tools/music-generation.md
    workflow: 16
---

Het hulpprogramma `music_generate` laat de agent muziek of audio maken via de
gedeelde muziekgeneratiemogelijkheid met geconfigureerde providers — Google,
MiniMax en workflow-geconfigureerde ComfyUI op dit moment.

Voor sessie-ondersteunde agentuitvoeringen start OpenClaw muziekgeneratie als een
achtergrondtaak, volgt die in het taaklogboek en wekt de agent daarna opnieuw
wanneer het nummer klaar is, zodat de agent de voltooide audio terug kan posten
in het oorspronkelijke kanaal.

<Note>
Het ingebouwde gedeelde hulpprogramma verschijnt alleen wanneer ten minste één
muziekgeneratieprovider beschikbaar is. Als je `music_generate` niet ziet in de
hulpprogramma's van je agent, configureer dan `agents.defaults.musicGenerationModel`
of stel een provider-API-sleutel in.
</Note>

## Snel starten

<Tabs>
  <Tab title="Gedeeld en provider-ondersteund">
    <Steps>
      <Step title="Authenticatie configureren">
        Stel een API-sleutel in voor ten minste één provider — bijvoorbeeld
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
      <Step title="Vraag het de agent">
        _"Genereer een opgewekt synthpopnummer over een nachtelijke rit door een
        neonstad."_

        De agent roept `music_generate` automatisch aan. Geen
        allow-listing voor hulpprogramma's nodig.
      </Step>
    </Steps>

    Voor directe synchrone contexten zonder sessie-ondersteunde agentuitvoering
    valt het ingebouwde hulpprogramma nog steeds terug op inline generatie en
    retourneert het het uiteindelijke mediapad in het hulpprogrammaresultaat.

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
      <Step title="Het hulpprogramma aanroepen">
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

| Provider | Standaardmodel         | Referentie-invoer | Ondersteunde bedieningselementen                         | Auth                                   |
| -------- | ---------------------- | ----------------- | --------------------------------------------------------- | -------------------------------------- |
| ComfyUI  | `workflow`             | Tot 1 afbeelding  | Door workflow gedefinieerde muziek of audio               | `COMFY_API_KEY`, `COMFY_CLOUD_API_KEY` |
| Google   | `lyria-3-clip-preview` | Tot 10 afbeeldingen | `lyrics`, `instrumental`, `format`                      | `GEMINI_API_KEY`, `GOOGLE_API_KEY`     |
| MiniMax  | `music-2.6`            | Geen              | `lyrics`, `instrumental`, `durationSeconds`, `format=mp3` | `MINIMAX_API_KEY` of MiniMax OAuth     |

### Mogelijkhedenmatrix

Het expliciete moduscontract dat wordt gebruikt door `music_generate`,
contracttests en de gedeelde live sweep:

| Provider | `generate` | `edit` | Bewerkingslimiet | Gedeelde live-lanes                                                       |
| -------- | :--------: | :----: | ---------------- | ------------------------------------------------------------------------- |
| ComfyUI  |     ✓      |   ✓    | 1 afbeelding     | Niet in de gedeelde sweep; gedekt door `extensions/comfy/comfy.live.test.ts` |
| Google   |     ✓      |   ✓    | 10 afbeeldingen  | `generate`, `edit`                                                        |
| MiniMax  |     ✓      |   —    | Geen             | `generate`                                                                |

Gebruik `action: "list"` om beschikbare gedeelde providers en modellen tijdens
runtime te inspecteren:

```text
/tool music_generate action=list
```

Gebruik `action: "status"` om de actieve sessie-ondersteunde muziektaak te
inspecteren:

```text
/tool music_generate action=status
```

Voorbeeld van directe generatie:

```text
/tool music_generate prompt="Dreamy lo-fi hip hop with vinyl texture and gentle rain" instrumental=true
```

## Hulpprogrammaparameters

<ParamField path="prompt" type="string" required>
  Muziekgeneratieprompt. Vereist voor `action: "generate"`.
</ParamField>
<ParamField path="action" type='"generate" | "status" | "list"' default="generate">
  `"status"` retourneert de huidige sessietaak; `"list"` inspecteert providers.
</ParamField>
<ParamField path="model" type="string">
  Provider-/modeloverride (bijv. `google/lyria-3-pro-preview`,
  `comfy/workflow`).
</ParamField>
<ParamField path="lyrics" type="string">
  Optionele songtekst wanneer de provider expliciete songtekstinvoer ondersteunt.
</ParamField>
<ParamField path="instrumental" type="boolean">
  Vraag om alleen-instrumentale uitvoer wanneer de provider dit ondersteunt.
</ParamField>
<ParamField path="image" type="string">
  Pad of URL van één referentieafbeelding.
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
<ParamField path="timeoutMs" type="number">Optionele time-out voor providerverzoeken in milliseconden.</ParamField>

<Note>
Niet alle providers ondersteunen alle parameters. OpenClaw valideert nog steeds
harde limieten, zoals aantallen invoeritems, vóór indiening. Wanneer een provider
duur ondersteunt maar een korter maximum gebruikt dan de gevraagde waarde, klemt
OpenClaw dit af naar de dichtstbij ondersteunde duur. Echt niet-ondersteunde
optionele hints worden genegeerd met een waarschuwing wanneer de geselecteerde
provider of het geselecteerde model ze niet kan honoreren. Hulpprogrammaresultaten
rapporteren toegepaste instellingen; `details.normalization` legt elke mapping
van gevraagd naar toegepast vast.
</Note>

## Asynchroon gedrag

Sessie-ondersteunde muziekgeneratie wordt uitgevoerd als achtergrondtaak:

- **Achtergrondtaak:** `music_generate` maakt een achtergrondtaak, retourneert
  onmiddellijk een gestart-/taakrespons en post het voltooide nummer later in
  een opvolgend agentbericht.
- **Dubbele aanroepen voorkomen:** terwijl een taak `queued` of `running` is,
  retourneren latere `music_generate`-aanroepen in dezelfde sessie de taakstatus
  in plaats van een nieuwe generatie te starten. Gebruik `action: "status"` om
  dit expliciet te controleren.
- **Status opzoeken:** `openclaw tasks list` of `openclaw tasks show <taskId>`
  inspecteert wachtrij-, lopende en terminale status.
- **Voltooiingswake:** OpenClaw injecteert een interne voltooiingsgebeurtenis
  terug in dezelfde sessie, zodat het model zelf de gebruikersgerichte follow-up
  kan schrijven.
- **Prompthint:** latere gebruikers-/handmatige beurten in dezelfde sessie
  krijgen een kleine runtimehint wanneer er al een muziektaak loopt, zodat het
  model niet blind opnieuw `music_generate` aanroept.
- **Fallback zonder sessie:** directe/lokale contexten zonder echte
  agentsessie worden inline uitgevoerd en retourneren het uiteindelijke
  audioresultaat in dezelfde beurt.

### Taaklevenscyclus

| Status      | Betekenis                                                                                     |
| ----------- | --------------------------------------------------------------------------------------------- |
| `queued`    | Taak aangemaakt, wachtend tot de provider deze accepteert.                                    |
| `running`   | Provider is aan het verwerken (meestal 30 seconden tot 3 minuten, afhankelijk van provider en duur). |
| `succeeded` | Nummer klaar; de agent wordt gewekt en post het in het gesprek.                              |
| `failed`    | Providerfout of time-out; de agent wordt gewekt met foutdetails.                             |

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
        fallbacks: ["minimax/music-2.6"],
      },
    },
  },
}
```

### Volgorde voor providerselectie

OpenClaw probeert providers in deze volgorde:

1. `model`-parameter uit de hulpprogramma-aanroep (als de agent er een opgeeft).
2. `musicGenerationModel.primary` uit de configuratie.
3. `musicGenerationModel.fallbacks` op volgorde.
4. Automatische detectie met alleen auth-ondersteunde providerstandaarden:
   - huidige standaardprovider eerst;
   - resterende geregistreerde muziekgeneratieproviders in volgorde van provider-id.

Als een provider faalt, wordt automatisch de volgende kandidaat geprobeerd. Als
ze allemaal falen, bevat de fout details van elke poging.

Stel `agents.defaults.mediaGenerationAutoProviderFallback: false` in om alleen
expliciete vermeldingen in `model`, `primary` en `fallbacks` te gebruiken.

## Providernotities

<AccordionGroup>
  <Accordion title="ComfyUI">
    Workflowgestuurd en afhankelijk van de geconfigureerde graph plus
    knooppuntmapping voor prompt-/uitvoervelden. De meegeleverde `comfy`-plugin
    koppelt aan het gedeelde `music_generate`-hulpprogramma via het
    providerregister voor muziekgeneratie.
  </Accordion>
  <Accordion title="Google (Lyria 3)">
    Gebruikt Lyria 3-batchgeneratie. De huidige meegeleverde flow ondersteunt
    prompt, optionele songtekst en optionele referentieafbeeldingen.
  </Accordion>
  <Accordion title="MiniMax">
    Gebruikt het batchendpoint `music_generation`. Ondersteunt prompt, optionele
    songtekst, instrumentale modus, duursturing en mp3-uitvoer via
    `minimax` API-sleutelauthenticatie of `minimax-portal` OAuth.
  </Accordion>
</AccordionGroup>

## Het juiste pad kiezen

- **Gedeeld en provider-ondersteund** wanneer je modelselectie, providerfailover
  en de ingebouwde asynchrone taak-/statusflow wilt.
- **Plugin-pad (ComfyUI)** wanneer je een aangepaste workflowgraph nodig hebt
  of een provider die geen onderdeel is van de gedeelde meegeleverde
  muziekmogelijkheid.

Als je ComfyUI-specifiek gedrag debugt, zie
[ComfyUI](/nl/providers/comfy). Als je gedeeld providergedrag debugt, begin dan met
[Google (Gemini)](/nl/providers/google) of
[MiniMax](/nl/providers/minimax).

## Providermodi voor mogelijkheden

Het gedeelde muziekgeneratiecontract ondersteunt expliciete modusdeclaraties:

- `generate` voor prompt-only generatie.
- `edit` wanneer de aanvraag één of meer referentieafbeeldingen bevat.

Nieuwe providerimplementaties moeten bij voorkeur expliciete modusblokken
gebruiken:

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

Legacy platte velden zoals `maxInputImages`, `supportsLyrics` en
`supportsFormat` zijn **niet** genoeg om bewerkingsondersteuning te adverteren.
Providers moeten `generate` en `edit` expliciet declareren, zodat live tests,
contracttests en het gedeelde `music_generate`-hulpprogramma modusondersteuning
deterministisch kunnen valideren.

## Live tests

Opt-in livedekking voor de gedeelde meegeleverde providers:

```bash
OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts
```

Repo-wrapper:

```bash
pnpm test:live:media music
```

Dit livebestand laadt ontbrekende provider-env-vars uit `~/.profile`, geeft
standaard de voorkeur aan live/env-API-sleutels boven opgeslagen authprofielen,
en voert zowel `generate` als gedeclareerde `edit`-dekking uit wanneer de
provider bewerkingsmodus inschakelt. Dekking op dit moment:

- `google`: `generate` plus `edit`
- `minimax`: alleen `generate`
- `comfy`: afzonderlijke Comfy-livedekking, niet de gedeelde providersweep

Opt-in livedekking voor het meegeleverde ComfyUI-muziekpad:

```bash
OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts
```

Het Comfy-livebestand dekt ook comfy-afbeeldings- en videoworkflows wanneer
die secties zijn geconfigureerd.

## Gerelateerd

- [Achtergrondtaken](/nl/automation/tasks) — taaktracking voor losgekoppelde `music_generate`-runs
- [ComfyUI](/nl/providers/comfy)
- [Configuratiereferentie](/nl/gateway/config-agents#agent-defaults) — `musicGenerationModel`-configuratie
- [Google (Gemini)](/nl/providers/google)
- [MiniMax](/nl/providers/minimax)
- [Modellen](/nl/concepts/models) — modelconfiguratie en failover
- [Overzicht van tools](/nl/tools)
