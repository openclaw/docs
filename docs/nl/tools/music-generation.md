---
read_when:
    - Muziek of audio genereren via de agent
    - Muziekgeneratieproviders en -modellen configureren
    - De parameters van de tool music_generate begrijpen
sidebarTitle: Music generation
summary: Genereer muziek via music_generate in Google Lyria-, MiniMax- en ComfyUI-workflows
title: Muziekgeneratie
x-i18n:
    generated_at: "2026-05-05T06:19:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: f5e74aa7d43ffe00adb6d6c170d36dbc107f2baf0069243733c5dd6e4582175a
    source_path: tools/music-generation.md
    workflow: 16
---

Het `music_generate`-hulpmiddel laat de agent muziek of audio maken via de
gedeelde capaciteit voor muziekgeneratie met geconfigureerde providers — Google,
MiniMax en vandaag workflow-geconfigureerde ComfyUI.

Voor sessieondersteunde agentuitvoeringen start OpenClaw muziekgeneratie als een
achtergrondtaak, houdt die bij in het taaklogboek en wekt de agent vervolgens weer
wanneer de track klaar is, zodat de agent de gebruiker kan informeren en de
afgewerkte audio kan bijvoegen. In groeps-/kanaalchats die zichtbare levering
alleen via het berichtenhulpmiddel gebruiken, geeft de agent het resultaat door
via het berichtenhulpmiddel. Als de voltooiingsagent alleen een privé-eindantwoord
schrijft, valt OpenClaw terug op rechtstreeks verzenden via het kanaal met de
gegenereerde media. De voltooiingswake waarschuwt de agent expliciet dat normale
eindantwoorden in die routes privé zijn.

<Note>
Het ingebouwde gedeelde hulpmiddel verschijnt alleen wanneer er ten minste één
provider voor muziekgeneratie beschikbaar is. Als je `music_generate` niet ziet
in de hulpmiddelen van je agent, configureer dan
`agents.defaults.musicGenerationModel` of stel een API-sleutel voor een provider
in.
</Note>

## Snel aan de slag

<Tabs>
  <Tab title="Gedeeld, met providerondersteuning">
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
      <Step title="De agent vragen">
        _"Genereer een opgewekte synthpoptrack over een nachtelijke rit door een
        neonstad."_

        De agent roept `music_generate` automatisch aan. Geen expliciete
        toestemmingslijst voor hulpmiddelen nodig.
      </Step>
    </Steps>

    Voor directe synchrone contexten zonder sessieondersteunde agentuitvoering
    valt het ingebouwde hulpmiddel nog steeds terug op inline generatie en geeft
    het het uiteindelijke mediapad terug in het hulpmiddelresultaat.

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

## Ondersteunde providers

| Provider | Standaardmodel        | Referentie-invoer | Ondersteunde bedieningselementen                         | Authenticatie                         |
| -------- | ---------------------- | ----------------- | --------------------------------------------------------- | -------------------------------------- |
| ComfyUI  | `workflow`             | Tot 1 afbeelding  | Door workflow gedefinieerde muziek of audio               | `COMFY_API_KEY`, `COMFY_CLOUD_API_KEY` |
| Google   | `lyria-3-clip-preview` | Tot 10 afbeeldingen | `lyrics`, `instrumental`, `format`                      | `GEMINI_API_KEY`, `GOOGLE_API_KEY`     |
| MiniMax  | `music-2.6`            | Geen              | `lyrics`, `instrumental`, `durationSeconds`, `format=mp3` | `MINIMAX_API_KEY` of MiniMax OAuth     |

### Capaciteitsmatrix

Het expliciete moduscontract dat wordt gebruikt door `music_generate`,
contracttests en de gedeelde live-sweep:

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

Gebruik `action: "status"` om de actieve sessieondersteunde muziektaak te
inspecteren:

```text
/tool music_generate action=status
```

Voorbeeld van directe generatie:

```text
/tool music_generate prompt="Dreamy lo-fi hip hop with vinyl texture and gentle rain" instrumental=true
```

## Hulpmiddelparameters

<ParamField path="prompt" type="string" required>
  Prompt voor muziekgeneratie. Vereist voor `action: "generate"`.
</ParamField>
<ParamField path="action" type='"generate" | "status" | "list"' default="generate">
  `"status"` geeft de huidige sessietaak terug; `"list"` inspecteert providers.
</ParamField>
<ParamField path="model" type="string">
  Overschrijving van provider/model (bijv. `google/lyria-3-pro-preview`,
  `comfy/workflow`).
</ParamField>
<ParamField path="lyrics" type="string">
  Optionele songtekst wanneer de provider expliciete songtekstinvoer ondersteunt.
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
  Hint voor uitvoerindeling wanneer de provider dit ondersteunt.
</ParamField>
<ParamField path="filename" type="string">Hint voor uitvoerbestandsnaam.</ParamField>
<ParamField path="timeoutMs" type="number">Optionele time-out voor providerverzoeken in milliseconden. Waarden onder 10000 ms worden verhoogd naar 10000 ms en gerapporteerd in het hulpmiddelresultaat.</ParamField>

<Note>
Niet alle providers ondersteunen alle parameters. OpenClaw valideert nog steeds
harde limieten, zoals aantallen invoeritems, vóór indiening. Wanneer een provider
duur ondersteunt maar een korter maximum gebruikt dan de aangevraagde waarde,
beperkt OpenClaw dit tot de dichtstbijzijnde ondersteunde duur. Echt niet-ondersteunde
optionele hints worden genegeerd met een waarschuwing wanneer de geselecteerde
provider of het geselecteerde model ze niet kan honoreren. Hulpmiddelresultaten
rapporteren toegepaste instellingen; `details.normalization` legt elke mapping
van aangevraagd naar toegepast vast.
</Note>

## Asynchroon gedrag

Sessieondersteunde muziekgeneratie draait als achtergrondtaak:

- **Achtergrondtaak:** `music_generate` maakt een achtergrondtaak aan, geeft
  onmiddellijk een gestart-/taakantwoord terug en plaatst de afgewerkte track
  later in een vervolgbericht van de agent.
- **Voorkomen van duplicaten:** zolang een taak `queued` of `running` is, geven
  latere `music_generate`-aanroepen in dezelfde sessie de taakstatus terug in
  plaats van een nieuwe generatie te starten. Gebruik `action: "status"` om dit
  expliciet te controleren.
- **Status opzoeken:** `openclaw tasks list` of `openclaw tasks show <taskId>`
  inspecteert statussen in de wachtrij, actief en terminaal.
- **Voltooiingswake:** OpenClaw injecteert een interne voltooiingsgebeurtenis
  terug in dezelfde sessie, zodat het model zelf het gebruikersgerichte
  vervolgbericht kan schrijven.
- **Prompthint:** latere gebruikers-/handmatige beurten in dezelfde sessie
  krijgen een kleine runtime-hint wanneer er al een muziektaak actief is, zodat
  het model `music_generate` niet blind opnieuw aanroept.
- **Fallback zonder sessie:** directe/lokale contexten zonder echte agentsessie
  draaien inline en geven het uiteindelijke audioresultaat in dezelfde beurt terug.

### Taaklevenscyclus

| Status      | Betekenis                                                                                      |
| ----------- | ---------------------------------------------------------------------------------------------- |
| `queued`    | Taak aangemaakt, wacht tot de provider deze accepteert.                                        |
| `running`   | Provider verwerkt de taak (meestal 30 seconden tot 3 minuten, afhankelijk van provider en duur). |
| `succeeded` | Track klaar; de agent wordt gewekt en plaatst deze in het gesprek.                             |
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
        fallbacks: ["minimax/music-2.6"],
      },
    },
  },
}
```

### Volgorde voor providerselectie

OpenClaw probeert providers in deze volgorde:

1. `model`-parameter uit de hulpmiddelaanroep (als de agent er een opgeeft).
2. `musicGenerationModel.primary` uit de configuratie.
3. `musicGenerationModel.fallbacks` op volgorde.
4. Automatische detectie met alleen authenticatieondersteunde providerstandaarden:
   - huidige standaardprovider eerst;
   - resterende geregistreerde providers voor muziekgeneratie op provider-id-volgorde.

Als een provider faalt, wordt de volgende kandidaat automatisch geprobeerd. Als
ze allemaal falen, bevat de fout details van elke poging.

Stel `agents.defaults.mediaGenerationAutoProviderFallback: false` in om alleen
expliciete `model`-, `primary`- en `fallbacks`-items te gebruiken.

## Providernotities

<AccordionGroup>
  <Accordion title="ComfyUI">
    Workflowgestuurd en afhankelijk van de geconfigureerde graaf plus
    knooppuntmapping voor prompt-/uitvoervelden. De gebundelde `comfy` Plugin
    sluit aan op het gedeelde `music_generate`-hulpmiddel via het providerregister
    voor muziekgeneratie.
  </Accordion>
  <Accordion title="Google (Lyria 3)">
    Gebruikt Lyria 3-batchgeneratie. De huidige gebundelde flow ondersteunt
    prompt, optionele songtekst en optionele referentieafbeeldingen.
  </Accordion>
  <Accordion title="MiniMax">
    Gebruikt het batch-eindpunt `music_generation`. Ondersteunt prompt,
    optionele songtekst, instrumentale modus, duursturing en mp3-uitvoer via
    `minimax` API-sleutelauthenticatie of `minimax-portal` OAuth.
  </Accordion>
</AccordionGroup>

## Het juiste pad kiezen

- **Gedeeld, met providerondersteuning** wanneer je modelselectie, providerfailover
  en de ingebouwde asynchrone taak-/statusflow wilt.
- **Plugin-pad (ComfyUI)** wanneer je een aangepaste workflowgraaf nodig hebt of
  een provider die geen deel uitmaakt van de gedeelde gebundelde muziekcapaciteit.

Als je ComfyUI-specifiek gedrag debugt, zie
[ComfyUI](/nl/providers/comfy). Als je gedeeld providergedrag debugt, begin dan met
[Google (Gemini)](/nl/providers/google) of
[MiniMax](/nl/providers/minimax).

## Provider-capaciteitsmodi

Het gedeelde contract voor muziekgeneratie ondersteunt expliciete modusdeclaraties:

- `generate` voor generatie met alleen een prompt.
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
`supportsFormat` zijn **niet** genoeg om bewerkingsondersteuning aan te geven.
Providers moeten `generate` en `edit` expliciet declareren, zodat live tests,
contracttests en het gedeelde `music_generate`-hulpmiddel modusondersteuning
deterministisch kunnen valideren.

## Live tests

Opt-in live-dekking voor de gedeelde gebundelde providers:

```bash
OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts
```

Repo-wrapper:

```bash
pnpm test:live:media music
```

Dit live-bestand laadt ontbrekende provideromgevingsvariabelen uit `~/.profile`,
geeft standaard de voorkeur aan live-/env-API-sleutels boven opgeslagen
authenticatieprofielen en voert zowel `generate`-dekking als gedeclareerde
`edit`-dekking uit wanneer de provider de bewerkingsmodus inschakelt. Dekking
vandaag:

- `google`: `generate` plus `edit`
- `minimax`: alleen `generate`
- `comfy`: afzonderlijke Comfy-live-dekking, niet de gedeelde providercontrole

Optionele live-dekking voor het gebundelde ComfyUI-muziekpad:

```bash
OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts
```

Het Comfy-livebestand behandelt ook Comfy-workflows voor afbeeldingen en video's wanneer die
secties zijn geconfigureerd.

## Gerelateerd

- [Achtergrondtaken](/nl/automation/tasks) — taaktracering voor losgekoppelde `music_generate`-runs
- [ComfyUI](/nl/providers/comfy)
- [Configuratiereferentie](/nl/gateway/config-agents#agent-defaults) — `musicGenerationModel`-configuratie
- [Google (Gemini)](/nl/providers/google)
- [MiniMax](/nl/providers/minimax)
- [Modellen](/nl/concepts/models) — modelconfiguratie en failover
- [Toolsoverzicht](/nl/tools)
