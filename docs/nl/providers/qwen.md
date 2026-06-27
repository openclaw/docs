---
read_when:
    - Je wilt Qwen gebruiken met OpenClaw
    - Je hebt eerder Qwen OAuth gebruikt
summary: Gebruik Qwen Cloud via de OpenClaw-Plugin
title: Qwen
x-i18n:
    generated_at: "2026-06-27T18:14:52Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4e42a38f3e7f2db54092886f2ef8c3ab27163c3c3d0f9b4d95affd58555f58d3
    source_path: providers/qwen.md
    workflow: 16
---

OpenClaw behandelt Qwen nu als een volwaardige provider-Plugin met canonieke id
`qwen`. De provider-Plugin richt zich op de Qwen Cloud / Alibaba DashScope- en
Coding Plan-eindpunten, houdt verouderde `modelstudio`-id's werkend als
compatibiliteitsalias, en stelt ook de Qwen Portal-tokenflow beschikbaar als provider `qwen-oauth`.

- Provider: `qwen`
- Portal-provider: [`qwen-oauth`](/nl/providers/qwen-oauth)
- Voorkeursomgevingsvariabele: `QWEN_API_KEY`
- Ook geaccepteerd voor compatibiliteit: `MODELSTUDIO_API_KEY`, `DASHSCOPE_API_KEY`
- API-stijl: OpenAI-compatibel

<Tip>
Als je `qwen3.6-plus` wilt, geef dan de voorkeur aan het **Standard (pay-as-you-go)**-eindpunt.
Ondersteuning voor Coding Plan kan achterlopen op de openbare catalogus.
</Tip>

## Plugin installeren

Installeer de officiële Plugin en herstart daarna Gateway:

```bash
openclaw plugins install @openclaw/qwen-provider
openclaw gateway restart
```

## Aan de slag

Kies je plantype en volg de installatiestappen.

<Tabs>
  <Tab title="Coding Plan (abonnement)">
    **Het beste voor:** toegang op abonnementsbasis via het Qwen Coding Plan.

    <Steps>
      <Step title="Haal je API-sleutel op">
        Maak of kopieer een API-sleutel via [home.qwencloud.com/api-keys](https://home.qwencloud.com/api-keys).
      </Step>
      <Step title="Voer onboarding uit">
        Voor het **Global**-eindpunt:

        ```bash
        openclaw onboard --auth-choice qwen-api-key
        ```

        Voor het **China**-eindpunt:

        ```bash
        openclaw onboard --auth-choice qwen-api-key-cn
        ```
      </Step>
      <Step title="Stel een standaardmodel in">
        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "qwen/qwen3.5-plus" },
            },
          },
        }
        ```
      </Step>
      <Step title="Controleer of het model beschikbaar is">
        ```bash
        openclaw models list --provider qwen
        ```
      </Step>
    </Steps>

    <Note>
    Verouderde `modelstudio-*` auth-choice-id's en `modelstudio/...`-modelrefs werken nog
    als compatibiliteitsaliassen, maar nieuwe installatieflows moeten de voorkeur geven aan de canonieke
    `qwen-*` auth-choice-id's en `qwen/...`-modelrefs. Als je een exacte
    aangepaste `models.providers.modelstudio`-vermelding definieert met een andere `api`-waarde, is die
    aangepaste provider eigenaar van `modelstudio/...`-refs in plaats van de Qwen-compatibiliteitsalias.
    </Note>

  </Tab>

  <Tab title="Standard (pay-as-you-go)">
    **Het beste voor:** betalen-naar-gebruik-toegang via het Standard Model Studio-eindpunt, inclusief modellen zoals `qwen3.6-plus` die mogelijk niet beschikbaar zijn op het Coding Plan.

    <Steps>
      <Step title="Haal je API-sleutel op">
        Maak of kopieer een API-sleutel via [home.qwencloud.com/api-keys](https://home.qwencloud.com/api-keys).
      </Step>
      <Step title="Voer onboarding uit">
        Voor het **Global**-eindpunt:

        ```bash
        openclaw onboard --auth-choice qwen-standard-api-key
        ```

        Voor het **China**-eindpunt:

        ```bash
        openclaw onboard --auth-choice qwen-standard-api-key-cn
        ```
      </Step>
      <Step title="Stel een standaardmodel in">
        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "qwen/qwen3.5-plus" },
            },
          },
        }
        ```
      </Step>
      <Step title="Controleer of het model beschikbaar is">
        ```bash
        openclaw models list --provider qwen
        ```
      </Step>
    </Steps>

    <Note>
    Verouderde `modelstudio-*` auth-choice-id's en `modelstudio/...`-modelrefs werken nog
    als compatibiliteitsaliassen, maar nieuwe installatieflows moeten de voorkeur geven aan de canonieke
    `qwen-*` auth-choice-id's en `qwen/...`-modelrefs. Als je een exacte
    aangepaste `models.providers.modelstudio`-vermelding definieert met een andere `api`-waarde, is die
    aangepaste provider eigenaar van `modelstudio/...`-refs in plaats van de Qwen-compatibiliteitsalias.
    </Note>

  </Tab>

  <Tab title="Qwen OAuth / Portal">
    **Het beste voor:** een Qwen Portal-token voor `https://portal.qwen.ai/v1`.

    Zie [Qwen OAuth / Portal](/nl/providers/qwen-oauth) voor de specifieke providerpagina
    en migratie-opmerkingen.

    <Steps>
      <Step title="Geef je portaltoken op">
        ```bash
        openclaw onboard --auth-choice qwen-oauth
        ```
      </Step>
      <Step title="Stel een standaardmodel in">
        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "qwen-oauth/qwen3.5-plus" },
            },
          },
        }
        ```
      </Step>
      <Step title="Controleer of het model beschikbaar is">
        ```bash
        openclaw models list --provider qwen-oauth
        ```
      </Step>
    </Steps>

    <Note>
    `qwen-oauth` gebruikt dezelfde naam voor de omgevingsvariabele `QWEN_API_KEY` als de DashScope-
    provider, maar slaat authenticatie op onder de provider-id `qwen-oauth` wanneer deze
    via OpenClaw-onboarding wordt geconfigureerd.
    </Note>

  </Tab>
</Tabs>

## Plantypen en eindpunten

| Plan                       | Regio  | Auth-keuze                 | Eindpunt                                         |
| -------------------------- | ------ | -------------------------- | ------------------------------------------------ |
| Standard (pay-as-you-go)   | China  | `qwen-standard-api-key-cn` | `dashscope.aliyuncs.com/compatible-mode/v1`      |
| Standard (pay-as-you-go)   | Global | `qwen-standard-api-key`    | `dashscope-intl.aliyuncs.com/compatible-mode/v1` |
| Coding Plan (abonnement)   | China  | `qwen-api-key-cn`          | `coding.dashscope.aliyuncs.com/v1`               |
| Coding Plan (abonnement)   | Global | `qwen-api-key`             | `coding-intl.dashscope.aliyuncs.com/v1`          |
| Qwen Portal                | Global | `qwen-oauth`               | `portal.qwen.ai/v1`                              |

De provider selecteert het eindpunt automatisch op basis van je auth-keuze. Canonieke
keuzes gebruiken de `qwen-*`-familie; `modelstudio-*` blijft alleen voor compatibiliteit.
Je kunt dit overschrijven met een aangepaste `baseUrl` in de configuratie.

<Tip>
**Sleutels beheren:** [home.qwencloud.com/api-keys](https://home.qwencloud.com/api-keys) |
**Documentatie:** [docs.qwencloud.com](https://docs.qwencloud.com/developer-guides/getting-started/introduction)
</Tip>

## Ingebouwde catalogus

OpenClaw levert momenteel deze statische Qwen-catalogus mee. De geconfigureerde catalogus is
eindpuntbewust: Coding Plan-configuraties laten modellen weg waarvan alleen bekend is dat ze werken op
het Standard-eindpunt.

| Modelref                    | Invoer            | Context   | Opmerkingen                                             |
| --------------------------- | ----------------- | --------- | ------------------------------------------------------- |
| `qwen/qwen3.5-plus`         | tekst, afbeelding | 1,000,000 | Standaardmodel                                          |
| `qwen/qwen3.6-plus`         | tekst, afbeelding | 1,000,000 | Geef de voorkeur aan Standard-eindpunten wanneer je dit model nodig hebt |
| `qwen/qwen3-max-2026-01-23` | tekst             | 262,144   | Qwen Max-lijn                                           |
| `qwen/qwen3-coder-next`     | tekst             | 262,144   | Coderen                                                |
| `qwen/qwen3-coder-plus`     | tekst             | 1,000,000 | Coderen                                                |
| `qwen/MiniMax-M2.5`         | tekst             | 1,000,000 | Reasoning ingeschakeld                                 |
| `qwen/glm-5`                | tekst             | 202,752   | GLM                                                     |
| `qwen/glm-4.7`              | tekst             | 202,752   | GLM                                                     |
| `qwen/kimi-k2.5`            | tekst, afbeelding | 262,144   | Moonshot AI via Alibaba                                 |
| `qwen-oauth/qwen3.5-plus`   | tekst, afbeelding | 1,000,000 | Qwen Portal-standaard                                   |

<Note>
Beschikbaarheid kan nog steeds verschillen per eindpunt en factureringsplan, zelfs wanneer een model
in de statische catalogus aanwezig is.
</Note>

## Denkbesturing

Voor Qwen Cloud-modellen met reasoning schakelt de provider OpenClaw-
denkniveaus om naar DashScope's top-level aanvraagvlag `enable_thinking`. Uitgeschakeld
denken verstuurt `enable_thinking: false`; andere denkniveaus versturen
`enable_thinking: true`.

## Multimodale add-ons

De `qwen`-Plugin stelt ook multimodale mogelijkheden beschikbaar op de **Standard**
DashScope-eindpunten (niet de Coding Plan-eindpunten):

- **Videobegrip** via `qwen-vl-max-latest`
- **Wan-videogeneratie** via `wan2.6-t2v` (standaard), `wan2.6-i2v`, `wan2.6-r2v`, `wan2.6-r2v-flash`, `wan2.7-r2v`

Om Qwen als standaardvideoprovider te gebruiken:

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: { primary: "qwen/wan2.6-t2v" },
    },
  },
}
```

<Note>
Zie [Videogeneratie](/nl/tools/video-generation) voor gedeelde toolparameters, providerselectie en failovergedrag.
</Note>

## Geavanceerde configuratie

<AccordionGroup>
  <Accordion title="Beeld- en videobegrip">
    De Qwen-Plugin registreert mediabegrip voor afbeeldingen en video
    op de **Standard** DashScope-eindpunten (niet de Coding Plan-eindpunten).

    | Eigenschap      | Waarde                |
    | ------------- | --------------------- |
    | Model         | `qwen-vl-max-latest`  |
    | Ondersteunde invoer | Afbeeldingen, video |

    Mediabegrip wordt automatisch opgelost vanuit de geconfigureerde Qwen-authenticatie: er is geen
    aanvullende configuratie nodig. Zorg ervoor dat je een Standard (pay-as-you-go)-
    eindpunt gebruikt voor ondersteuning voor mediabegrip.

  </Accordion>

  <Accordion title="Beschikbaarheid van Qwen 3.6 Plus">
    `qwen3.6-plus` is beschikbaar op de Standard (pay-as-you-go) Model Studio-
    eindpunten:

    - China: `dashscope.aliyuncs.com/compatible-mode/v1`
    - Global: `dashscope-intl.aliyuncs.com/compatible-mode/v1`

    Als de Coding Plan-eindpunten een fout "unsupported model" retourneren voor
    `qwen3.6-plus`, schakel dan over naar Standard (pay-as-you-go) in plaats van het Coding Plan-
    eindpunt/sleutelpaar.

    De statische Qwen-catalogus van OpenClaw adverteert `qwen3.6-plus` niet op Coding
    Plan-eindpunten, maar expliciet geconfigureerde `qwen/qwen3.6-plus`-vermeldingen onder
    `models.providers.qwen.models` worden gehonoreerd op Coding Plan-baseUrls, zodat je
    dat model kunt inschakelen als Aliyun het op je abonnement activeert. De
    upstream-API beslist nog steeds of de aanroep slaagt.

  </Accordion>

  <Accordion title="Capability-plan">
    De `qwen`-Plugin wordt gepositioneerd als de leveranciershome voor het volledige Qwen
    Cloud-oppervlak, niet alleen voor codeer-/tekstmodellen.

    - **Tekst-/chatmodellen:** beschikbaar via de Plugin
    - **Toolaanroepen, gestructureerde uitvoer, denken:** overgenomen van het OpenAI-compatibele transport
    - **Afbeeldingsgeneratie:** gepland op de provider-Plugin-laag
    - **Beeld-/videobegrip:** beschikbaar via de Plugin op het Standard-eindpunt
    - **Spraak/audio:** gepland op de provider-Plugin-laag
    - **Geheugen-embeddings/reranking:** gepland via het embedding-adapteroppervlak
    - **Videogeneratie:** beschikbaar via de Plugin via de gedeelde videogeneratie-capability

  </Accordion>

  <Accordion title="Details voor videogeneratie">
    Voor videogeneratie koppelt OpenClaw de geconfigureerde Qwen-regio aan de bijbehorende
    DashScope AIGC-host voordat de taak wordt ingediend:

    - Global/Intl: `https://dashscope-intl.aliyuncs.com`
    - China: `https://dashscope.aliyuncs.com`

    Dat betekent dat een normale `models.providers.qwen.baseUrl` die naar de
    Coding Plan- of Standard Qwen-hosts wijst, videogeneratie nog steeds op het juiste
    regionale DashScope-video-eindpunt houdt.

    Huidige limieten voor Qwen-videogeneratie:

    - Maximaal **1** uitvoervideo per aanvraag
    - Maximaal **1** invoerafbeelding
    - Maximaal **4** invoervideo's
    - Maximaal **10 seconden** duur
    - Ondersteunt `size`, `aspectRatio`, `resolution`, `audio` en `watermark`
    - Referentieafbeeldings-/videomodus vereist momenteel **externe http(s)-URL's**. Lokale
      bestandspaden worden vooraf geweigerd omdat het DashScope-video-eindpunt geen
      geüploade lokale buffers voor die referenties accepteert.

  </Accordion>

  <Accordion title="Compatibiliteit voor streaminggebruik">
    Native Model Studio-eindpunten adverteren compatibiliteit voor streaminggebruik op het
    gedeelde `openai-completions`-transport. OpenClaw baseert dat nu op
    eindpuntmogelijkheden, zodat DashScope-compatibele aangepaste provider-id's die op
    dezelfde native hosts zijn gericht, hetzelfde streaminggebruiksgedrag overnemen in
    plaats van specifiek de ingebouwde provider-id `qwen` te vereisen.

    Compatibiliteit voor native streaminggebruik geldt voor zowel de Coding Plan-hosts als
    de Standard DashScope-compatibele hosts:

    - `https://coding.dashscope.aliyuncs.com/v1`
    - `https://coding-intl.dashscope.aliyuncs.com/v1`
    - `https://dashscope.aliyuncs.com/compatible-mode/v1`
    - `https://dashscope-intl.aliyuncs.com/compatible-mode/v1`

  </Accordion>

  <Accordion title="Regio's voor multimodale eindpunten">
    Multimodale oppervlakken (videobegrip en Wan-videogeneratie) gebruiken de
    **Standard** DashScope-eindpunten, niet de Coding Plan-eindpunten:

    - Global/Intl Standard-basis-URL: `https://dashscope-intl.aliyuncs.com/compatible-mode/v1`
    - China Standard-basis-URL: `https://dashscope.aliyuncs.com/compatible-mode/v1`

  </Accordion>

  <Accordion title="Omgevings- en daemonconfiguratie">
    Als de Gateway als daemon draait (launchd/systemd), zorg er dan voor dat `QWEN_API_KEY`
    beschikbaar is voor dat proces (bijvoorbeeld in `~/.openclaw/.env` of via
    `env.shellEnv`).
  </Accordion>
</AccordionGroup>

## Gerelateerd

<CardGroup cols={2}>
  <Card title="Modelselectie" href="/nl/concepts/model-providers" icon="layers">
    Providers, modelreferenties en failovergedrag kiezen.
  </Card>
  <Card title="Videogeneratie" href="/nl/tools/video-generation" icon="video">
    Gedeelde videotoolparameters en providerselectie.
  </Card>
  <Card title="Alibaba (ModelStudio)" href="/nl/providers/alibaba" icon="cloud">
    Verouderde ModelStudio-provider en migratieopmerkingen.
  </Card>
  <Card title="Probleemoplossing" href="/nl/help/troubleshooting" icon="wrench">
    Algemene probleemoplossing en veelgestelde vragen.
  </Card>
</CardGroup>
