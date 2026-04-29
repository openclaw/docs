---
read_when:
    - Je wilt Qwen gebruiken met OpenClaw
    - Je hebt eerder Qwen OAuth gebruikt
summary: Gebruik Qwen Cloud via de gebundelde qwen-provider van OpenClaw
title: Qwen
x-i18n:
    generated_at: "2026-04-29T23:12:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: 898a7ef1f071c838f3bd877632dd06cf0e6112adfa2833895280f99642df56e6
    source_path: providers/qwen.md
    workflow: 16
---

<Warning>

**Qwen OAuth is verwijderd.** De gratis OAuth-integratie
(`qwen-portal`) die `portal.qwen.ai`-endpoints gebruikte, is niet langer beschikbaar.
Zie [Issue #49557](https://github.com/openclaw/openclaw/issues/49557) voor
achtergrondinformatie.

</Warning>

OpenClaw behandelt Qwen nu als een volwaardige gebundelde provider met canonieke id
`qwen`. De gebundelde provider richt zich op de Qwen Cloud / Alibaba DashScope- en
Coding Plan-endpoints en laat verouderde `modelstudio`-ids werken als
compatibiliteitsalias.

- Provider: `qwen`
- Voorkeurs-env-var: `QWEN_API_KEY`
- Ook geaccepteerd voor compatibiliteit: `MODELSTUDIO_API_KEY`, `DASHSCOPE_API_KEY`
- API-stijl: OpenAI-compatibel

<Tip>
Als je `qwen3.6-plus` wilt, geef dan de voorkeur aan het **Standard (pay-as-you-go)**-endpoint.
Ondersteuning voor Coding Plan kan achterlopen op de openbare catalogus.
</Tip>

## Aan de slag

Kies je abonnementstype en volg de installatiestappen.

<Tabs>
  <Tab title="Coding Plan (abonnement)">
    **Beste voor:** toegang op abonnementsbasis via het Qwen Coding Plan.

    <Steps>
      <Step title="Haal je API-sleutel op">
        Maak of kopieer een API-sleutel via [home.qwencloud.com/api-keys](https://home.qwencloud.com/api-keys).
      </Step>
      <Step title="Voer onboarding uit">
        Voor het **Global**-endpoint:

        ```bash
        openclaw onboard --auth-choice qwen-api-key
        ```

        Voor het **China**-endpoint:

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
    Verouderde `modelstudio-*` auth-choice-ids en `modelstudio/...`-modelrefs werken nog steeds
    als compatibiliteitsaliases, maar nieuwe installatiestromen moeten de voorkeur geven aan de canonieke
    `qwen-*` auth-choice-ids en `qwen/...`-modelrefs. Als je een exacte
    aangepaste `models.providers.modelstudio`-vermelding met een andere `api`-waarde definieert, is die
    aangepaste provider eigenaar van `modelstudio/...`-refs in plaats van de Qwen-compatibiliteitsalias.
    </Note>

  </Tab>

  <Tab title="Standard (pay-as-you-go)">
    **Beste voor:** pay-as-you-go-toegang via het Standard Model Studio-endpoint, inclusief modellen zoals `qwen3.6-plus` die mogelijk niet beschikbaar zijn op het Coding Plan.

    <Steps>
      <Step title="Haal je API-sleutel op">
        Maak of kopieer een API-sleutel via [home.qwencloud.com/api-keys](https://home.qwencloud.com/api-keys).
      </Step>
      <Step title="Voer onboarding uit">
        Voor het **Global**-endpoint:

        ```bash
        openclaw onboard --auth-choice qwen-standard-api-key
        ```

        Voor het **China**-endpoint:

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
    Verouderde `modelstudio-*` auth-choice-ids en `modelstudio/...`-modelrefs werken nog steeds
    als compatibiliteitsaliases, maar nieuwe installatiestromen moeten de voorkeur geven aan de canonieke
    `qwen-*` auth-choice-ids en `qwen/...`-modelrefs. Als je een exacte
    aangepaste `models.providers.modelstudio`-vermelding met een andere `api`-waarde definieert, is die
    aangepaste provider eigenaar van `modelstudio/...`-refs in plaats van de Qwen-compatibiliteitsalias.
    </Note>

  </Tab>
</Tabs>

## Abonnementstypen en endpoints

| Abonnement                 | Regio  | Auth-keuze                 | Endpoint                                         |
| -------------------------- | ------ | -------------------------- | ------------------------------------------------ |
| Standard (pay-as-you-go)   | China  | `qwen-standard-api-key-cn` | `dashscope.aliyuncs.com/compatible-mode/v1`      |
| Standard (pay-as-you-go)   | Global | `qwen-standard-api-key`    | `dashscope-intl.aliyuncs.com/compatible-mode/v1` |
| Coding Plan (abonnement)   | China  | `qwen-api-key-cn`          | `coding.dashscope.aliyuncs.com/v1`               |
| Coding Plan (abonnement)   | Global | `qwen-api-key`             | `coding-intl.dashscope.aliyuncs.com/v1`          |

De provider selecteert het endpoint automatisch op basis van je auth-keuze. Canonieke
keuzes gebruiken de `qwen-*`-familie; `modelstudio-*` blijft alleen voor compatibiliteit.
Je kunt dit overschrijven met een aangepaste `baseUrl` in de configuratie.

<Tip>
**Sleutels beheren:** [home.qwencloud.com/api-keys](https://home.qwencloud.com/api-keys) |
**Documentatie:** [docs.qwencloud.com](https://docs.qwencloud.com/developer-guides/getting-started/introduction)
</Tip>

## Ingebouwde catalogus

OpenClaw levert momenteel deze gebundelde Qwen-catalogus mee. De geconfigureerde catalogus is
endpoint-bewust: Coding Plan-configuraties laten modellen weg waarvan alleen bekend is dat ze werken op
het Standard-endpoint.

| Modelref                    | Invoer      | Context   | Opmerkingen                                        |
| --------------------------- | ----------- | --------- | -------------------------------------------------- |
| `qwen/qwen3.5-plus`         | tekst, afbeelding | 1,000,000 | Standaardmodel                                     |
| `qwen/qwen3.6-plus`         | tekst, afbeelding | 1,000,000 | Geef de voorkeur aan Standard-endpoints wanneer je dit model nodig hebt |
| `qwen/qwen3-max-2026-01-23` | tekst       | 262,144   | Qwen Max-lijn                                      |
| `qwen/qwen3-coder-next`     | tekst       | 262,144   | Programmeren                                       |
| `qwen/qwen3-coder-plus`     | tekst       | 1,000,000 | Programmeren                                       |
| `qwen/MiniMax-M2.5`         | tekst       | 1,000,000 | Redeneren ingeschakeld                             |
| `qwen/glm-5`                | tekst       | 202,752   | GLM                                                |
| `qwen/glm-4.7`              | tekst       | 202,752   | GLM                                                |
| `qwen/kimi-k2.5`            | tekst, afbeelding | 262,144   | Moonshot AI via Alibaba                            |

<Note>
Beschikbaarheid kan nog steeds verschillen per endpoint en factureringsplan, zelfs wanneer een model
aanwezig is in de gebundelde catalogus.
</Note>

## Denkbesturing

Voor Qwen Cloud-modellen met redeneermogelijkheden koppelt de gebundelde provider de
denkniveaus van OpenClaw aan DashScope's top-level `enable_thinking`-aanvraagvlag. Uitgeschakeld
denken verzendt `enable_thinking: false`; andere denkniveaus verzenden
`enable_thinking: true`.

## Multimodale add-ons

De `qwen`-plugin biedt ook multimodale mogelijkheden op de **Standard**
DashScope-endpoints (niet op de Coding Plan-endpoints):

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
  <Accordion title="Afbeeldings- en videobegrip">
    De gebundelde Qwen-plugin registreert mediabegrip voor afbeeldingen en video
    op de **Standard** DashScope-endpoints (niet op de Coding Plan-endpoints).

    | Eigenschap      | Waarde                |
    | ------------- | --------------------- |
    | Model         | `qwen-vl-max-latest`  |
    | Ondersteunde invoer | Afbeeldingen, video       |

    Mediabegrip wordt automatisch opgelost vanuit de geconfigureerde Qwen-auth — er is geen
    aanvullende configuratie nodig. Zorg dat je een Standard (pay-as-you-go)
    endpoint gebruikt voor ondersteuning van mediabegrip.

  </Accordion>

  <Accordion title="Beschikbaarheid van Qwen 3.6 Plus">
    `qwen3.6-plus` is beschikbaar op de Standard (pay-as-you-go) Model Studio-
    endpoints:

    - China: `dashscope.aliyuncs.com/compatible-mode/v1`
    - Global: `dashscope-intl.aliyuncs.com/compatible-mode/v1`

    Als de Coding Plan-endpoints een fout "unsupported model" retourneren voor
    `qwen3.6-plus`, schakel dan over naar Standard (pay-as-you-go) in plaats van het Coding Plan-
    endpoint/sleutelpaar.

    De gebundelde Qwen-catalogus van OpenClaw adverteert `qwen3.6-plus` niet op Coding
    Plan-endpoints, maar expliciet geconfigureerde `qwen/qwen3.6-plus`-vermeldingen onder
    `models.providers.qwen.models` worden gerespecteerd op Coding Plan-baseUrls, zodat je
    dat model kunt inschakelen als Aliyun het voor je abonnement activeert. De
    upstream-API bepaalt nog steeds of de aanroep slaagt.

  </Accordion>

  <Accordion title="Capability-plan">
    De `qwen`-plugin wordt gepositioneerd als de vendor-thuisbasis voor het volledige Qwen
    Cloud-oppervlak, niet alleen coding-/tekstmodellen.

    - **Tekst-/chatmodellen:** nu gebundeld
    - **Toolaanroepen, gestructureerde uitvoer, denken:** overgenomen van het OpenAI-compatibele transport
    - **Afbeeldingsgeneratie:** gepland op de provider-pluginlaag
    - **Afbeeldings-/videobegrip:** nu gebundeld op het Standard-endpoint
    - **Spraak/audio:** gepland op de provider-pluginlaag
    - **Geheugen-embeddings/reranking:** gepland via het embedding-adapteroppervlak
    - **Videogeneratie:** nu gebundeld via de gedeelde videogeneratiemogelijkheid

  </Accordion>

  <Accordion title="Details over videogeneratie">
    Voor videogeneratie koppelt OpenClaw de geconfigureerde Qwen-regio aan de overeenkomende
    DashScope AIGC-host voordat de taak wordt ingediend:

    - Global/Intl: `https://dashscope-intl.aliyuncs.com`
    - China: `https://dashscope.aliyuncs.com`

    Dat betekent dat een normale `models.providers.qwen.baseUrl` die naar de
    Coding Plan- of Standard Qwen-hosts wijst, videogeneratie nog steeds op het juiste
    regionale DashScope-video-endpoint houdt.

    Huidige gebundelde limieten voor Qwen-videogeneratie:

    - Maximaal **1** uitvoervideo per aanvraag
    - Maximaal **1** invoerafbeelding
    - Maximaal **4** invoervideo's
    - Maximaal **10 seconden** duur
    - Ondersteunt `size`, `aspectRatio`, `resolution`, `audio` en `watermark`
    - Referentieafbeeldings-/videomodus vereist momenteel **externe http(s)-URL's**. Lokale
      bestandspaden worden vooraf geweigerd omdat het DashScope-video-endpoint geen
      geüploade lokale buffers voor die referenties accepteert.

  </Accordion>

  <Accordion title="Compatibiliteit met streaminggebruik">
    Native Model Studio-endpoints adverteren compatibiliteit met streaminggebruik op het
    gedeelde `openai-completions`-transport. OpenClaw baseert dat nu op endpoint-
    mogelijkheden, zodat DashScope-compatibele aangepaste provider-ids die zich richten op dezelfde
    native hosts hetzelfde streaminggebruiksgedrag erven in plaats van
    specifiek de ingebouwde `qwen`-provider-id te vereisen.

    Compatibiliteit met native-streaminggebruik geldt voor zowel de Coding Plan-hosts als
    de Standard DashScope-compatibele hosts:

    - `https://coding.dashscope.aliyuncs.com/v1`
    - `https://coding-intl.dashscope.aliyuncs.com/v1`
    - `https://dashscope.aliyuncs.com/compatible-mode/v1`
    - `https://dashscope-intl.aliyuncs.com/compatible-mode/v1`

  </Accordion>

  <Accordion title="Regio's voor multimodale endpoints">
    Multimodale oppervlakken (videobegrip en Wan-videogeneratie) gebruiken de
    **Standard** DashScope-endpoints, niet de Coding Plan-endpoints:

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
    Providers, modelverwijzingen en failover-gedrag kiezen.
  </Card>
  <Card title="Videogeneratie" href="/nl/tools/video-generation" icon="video">
    Gedeelde videotoolparameters en providerselectie.
  </Card>
  <Card title="Alibaba (ModelStudio)" href="/nl/providers/alibaba" icon="cloud">
    Verouderde ModelStudio-provider en migratie-opmerkingen.
  </Card>
  <Card title="Probleemoplossing" href="/nl/help/troubleshooting" icon="wrench">
    Algemene probleemoplossing en veelgestelde vragen.
  </Card>
</CardGroup>
