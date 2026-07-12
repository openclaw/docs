---
read_when:
    - Je wilt Qwen met OpenClaw gebruiken
    - U hebt een Alibaba Cloud Token Plan-abonnement
    - U gebruikte eerder Qwen OAuth
summary: Gebruik Qwen Cloud via de OpenClaw-plugin
title: Qwen
x-i18n:
    generated_at: "2026-07-12T09:15:00Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 18030a70c024cd5c0713262874f5353bac50576e850f68a61bef4fa73ccf9b9c
    source_path: providers/qwen.md
    workflow: 16
---

Qwen Cloud is een officiële externe OpenClaw-providerplugin met de canonieke id `qwen`. Deze is bedoeld voor de Standard- en Coding Plan-eindpunten van Qwen Cloud / Alibaba DashScope, biedt Token Plan aan als `qwen-token-plan`, behoudt `modelstudio` als compatibiliteitsalias, beheert onafhankelijk Alibaba's gedocumenteerde aangepaste provider-id `bailian-token-plan` en biedt de tokenstroom van Qwen Portal aan als [`qwen-oauth`](/nl/providers/qwen-oauth).

| Eigenschap                     | Waarde                                     |
| ------------------------------ | ------------------------------------------ |
| Provider                       | `qwen`                                     |
| Token Plan-provider            | `qwen-token-plan`                          |
| Portal-provider                | [`qwen-oauth`](/nl/providers/qwen-oauth)      |
| Voorkeursomgevingsvariabele    | `QWEN_API_KEY`                             |
| Token Plan-omgevingsvariabele  | `QWEN_TOKEN_PLAN_API_KEY`                  |
| Ook geaccepteerd (compatibel)  | `MODELSTUDIO_API_KEY`, `DASHSCOPE_API_KEY` |
| API-stijl                      | OpenAI-compatibel                          |

<Tip>
`qwen3.7-plus` en `qwen3.6-plus` werken met Coding Plan- en Standard-eindpunten.
Gebruik voor `qwen3.7-max` of `qwen3.6-flash` een **Standard-eindpunt (betalen naar gebruik)**.
</Tip>

## Plugin installeren

`qwen` wordt geleverd als een officiële externe plugin en is niet gebundeld met de kern. Installeer de plugin en start Gateway opnieuw:

```bash
openclaw plugins install @openclaw/qwen-provider
openclaw gateway restart
```

## Aan de slag

Kies uw plantype en volg de configuratiestappen.

<Tabs>
  <Tab title="Coding Plan (abonnement)">
    **Het meest geschikt voor:** toegang op abonnementsbasis via het Qwen Coding Plan.

    <Steps>
      <Step title="Uw API-sleutel verkrijgen">
        Maak of kopieer een API-sleutel via [home.qwencloud.com/api-keys](https://home.qwencloud.com/api-keys).
      </Step>
      <Step title="Onboarding uitvoeren">
        Voor het **wereldwijde** eindpunt:

        ```bash
        openclaw onboard --auth-choice qwen-api-key
        ```

        Voor het eindpunt in **China**:

        ```bash
        openclaw onboard --auth-choice qwen-api-key-cn
        ```
      </Step>
      <Step title="Een standaardmodel instellen">
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
      <Step title="Controleren of het model beschikbaar is">
        ```bash
        openclaw models list --provider qwen
        ```
      </Step>
    </Steps>

    <Note>
    Verouderde `modelstudio-*`-id's voor authenticatiekeuzes en `modelstudio/...`-modelverwijzingen
    werken nog steeds als compatibiliteitsaliassen, maar nieuwe configuratiestromen moeten bij voorkeur de canonieke
    `qwen-*`-id's voor authenticatiekeuzes en `qwen/...`-modelverwijzingen gebruiken. Als u een exacte
    aangepaste vermelding voor `models.providers.modelstudio` met een andere `api`-waarde definieert, beheert
    die aangepaste provider de `modelstudio/...`-verwijzingen in plaats van de Qwen-compatibiliteitsalias.
    </Note>

  </Tab>

  <Tab title="Standard (betalen naar gebruik)">
    **Het meest geschikt voor:** toegang op basis van betalen naar gebruik via het Standard-eindpunt van Model Studio, waaronder `qwen3.7-max` en `qwen3.6-flash`, die niet beschikbaar zijn via het Coding Plan.

    <Steps>
      <Step title="Uw API-sleutel verkrijgen">
        Maak of kopieer een API-sleutel via [home.qwencloud.com/api-keys](https://home.qwencloud.com/api-keys).
      </Step>
      <Step title="Onboarding uitvoeren">
        Voor het **wereldwijde** eindpunt:

        ```bash
        openclaw onboard --auth-choice qwen-standard-api-key
        ```

        Voor het eindpunt in **China**:

        ```bash
        openclaw onboard --auth-choice qwen-standard-api-key-cn
        ```
      </Step>
      <Step title="Een standaardmodel instellen">
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
      <Step title="Controleren of het model beschikbaar is">
        ```bash
        openclaw models list --provider qwen
        ```
      </Step>
    </Steps>

    <Note>
    Verouderde `modelstudio-*`-id's voor authenticatiekeuzes en `modelstudio/...`-modelverwijzingen
    werken nog steeds als compatibiliteitsaliassen, maar nieuwe configuratiestromen moeten bij voorkeur de canonieke
    `qwen-*`-id's voor authenticatiekeuzes en `qwen/...`-modelverwijzingen gebruiken. Als u een exacte
    aangepaste vermelding voor `models.providers.modelstudio` met een andere `api`-waarde definieert, beheert
    die aangepaste provider de `modelstudio/...`-verwijzingen in plaats van de Qwen-compatibiliteitsalias.
    </Note>

  </Tab>

  <Tab title="Token Plan (teameditie)">
    **Het meest geschikt voor:** toegang tot Qwen en ondersteunde modellen van derden via een teamabonnement op basis van tegoeden in Alibaba Cloud Model Studio.

    <Steps>
      <Step title="Uw specifieke sleutel verkrijgen">
        Wijs een Token Plan-licentie toe en maak de bijbehorende specifieke `sk-sp-...`-sleutel. Sleutels voor Token Plan, Coding Plan en betalen naar gebruik zijn niet onderling uitwisselbaar. Zie het [overzicht van het wereldwijde Token Plan](https://www.alibabacloud.com/help/en/model-studio/token-plan-overview) of het [overzicht van het Token Plan voor China](https://help.aliyun.com/zh/model-studio/token-plan-overview).
      </Step>
      <Step title="Onboarding uitvoeren">
        Voor het **wereldwijde/internationale** eindpunt in Singapore:

        ```bash
        openclaw onboard --auth-choice qwen-token-plan
        ```

        Voor het eindpunt in **China** in Beijing:

        ```bash
        openclaw onboard --auth-choice qwen-token-plan-cn
        ```
      </Step>
      <Step title="De provider controleren">
        ```bash
        openclaw models list --provider qwen-token-plan
        openclaw agent --model qwen-token-plan/qwen3.7-plus --message "Reply with: token plan ready"
        ```
      </Step>
    </Steps>

    <Note>
    De OpenClaw-handleiding van Alibaba gebruikt `bailian-token-plan` voor een handmatige aangepaste
    provider. De plugin registreert die id als compatibiliteitseigenaar, maar nieuwe
    configuraties moeten `qwen-token-plan` gebruiken. Een exacte aangepaste vermelding voor
    `models.providers.bailian-token-plan` behoudt het beheer over het geconfigureerde
    transport en de catalogus; deze wordt nooit samengevoegd met de canonieke OpenAI-catalogus.
    </Note>

    <Warning>
    Gebruik Token Plan uitsluitend voor interactieve OpenClaw-sessies. Selecteer het niet voor
    Cron-taken, onbeheerde scripts of toepassingsbackends. Alibaba geeft aan dat
    niet-interactief gebruik kan leiden tot opschorting van het abonnement of intrekking van de API-sleutel.
    </Warning>

  </Tab>

  <Tab title="Qwen OAuth / Portal">
    **Het meest geschikt voor:** een Qwen Portal-token voor `https://portal.qwen.ai/v1`.

    Zie [Qwen OAuth / Portal](/nl/providers/qwen-oauth) voor de speciale providerpagina
    en migratieopmerkingen.

    <Steps>
      <Step title="Uw portaltoken opgeven">
        ```bash
        openclaw onboard --auth-choice qwen-oauth
        ```
      </Step>
      <Step title="Een standaardmodel instellen">
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
      <Step title="Controleren of het model beschikbaar is">
        ```bash
        openclaw models list --provider qwen-oauth
        ```
      </Step>
    </Steps>

    <Note>
    `qwen-oauth` gebruikt dezelfde naam voor de omgevingsvariabele `QWEN_API_KEY` als de Qwen Cloud-provider,
    maar slaat de authenticatie op onder de provider-id `qwen-oauth` wanneer deze
    via de onboarding van OpenClaw wordt geconfigureerd.
    </Note>

  </Tab>
</Tabs>

## Plantypen en eindpunten

| Plan                       | Regio       | Authenticatiekeuze         | Eindpunt                                                          |
| -------------------------- | ----------- | -------------------------- | ----------------------------------------------------------------- |
| Coding Plan (abonnement)   | China       | `qwen-api-key-cn`          | `coding.dashscope.aliyuncs.com/v1`                                |
| Coding Plan (abonnement)   | Wereldwijd  | `qwen-api-key`             | `coding-intl.dashscope.aliyuncs.com/v1`                           |
| Qwen Portal                | Wereldwijd  | `qwen-oauth`               | `portal.qwen.ai/v1`                                               |
| Standard (betalen naar gebruik) | China  | `qwen-standard-api-key-cn` | `dashscope.aliyuncs.com/compatible-mode/v1`                       |
| Standard (betalen naar gebruik) | Wereldwijd | `qwen-standard-api-key` | `dashscope-intl.aliyuncs.com/compatible-mode/v1`                  |
| Token Plan (teameditie)    | China       | `qwen-token-plan-cn`       | `token-plan.cn-beijing.maas.aliyuncs.com/compatible-mode/v1`      |
| Token Plan (teameditie)    | Wereldwijd  | `qwen-token-plan`          | `token-plan.ap-southeast-1.maas.aliyuncs.com/compatible-mode/v1`  |

De provider selecteert het eindpunt automatisch op basis van uw authenticatiekeuze. Canonieke
keuzes gebruiken de `qwen-*`-familie; `modelstudio-*` blijft uitsluitend voor compatibiliteit.
Overschrijf dit met een aangepaste `baseUrl` in de configuratie.

<Tip>
**Sleutels beheren:** [home.qwencloud.com/api-keys](https://home.qwencloud.com/api-keys) |
**Documentatie:** [docs.qwencloud.com](https://docs.qwencloud.com/developer-guides/getting-started/introduction)
</Tip>

## Ingebouwde catalogus

OpenClaw wordt geleverd met deze statische Qwen-catalogus. De catalogus houdt rekening met het eindpunt: Coding
Plan-configuraties laten modellen weg die alleen met het Standard-eindpunt werken.

| Modelverwijzing             | Invoer          | Context   | Opmerkingen                    |
| --------------------------- | --------------- | --------- | ----------------------------- |
| `qwen/qwen3.5-plus`         | tekst, afbeelding | 1,000,000 | Standaardmodel               |
| `qwen/qwen3.6-flash`        | tekst, afbeelding | 1,000,000 | Alleen Standard-eindpunten   |
| `qwen/qwen3.6-plus`         | tekst, afbeelding | 1,000,000 | Coding Plan + Standard       |
| `qwen/qwen3.7-max`          | tekst           | 1,000,000 | Alleen Standard-eindpunten    |
| `qwen/qwen3.7-plus`         | tekst, afbeelding | 1,000,000 | Coding Plan + Standard       |
| `qwen/qwen3-max-2026-01-23` | tekst           | 262,144   | Qwen Max-reeks                |
| `qwen/qwen3-coder-next`     | tekst           | 262,144   | Programmeren                  |
| `qwen/qwen3-coder-plus`     | tekst           | 1,000,000 | Programmeren                  |
| `qwen/MiniMax-M2.5`         | tekst           | 1,000,000 | Redeneren ingeschakeld        |
| `qwen/glm-5`                | tekst           | 202,752   | GLM                           |
| `qwen/glm-4.7`              | tekst           | 202,752   | GLM                           |
| `qwen/kimi-k2.5`            | tekst, afbeelding | 262,144 | Moonshot AI via Alibaba       |
| `qwen-oauth/qwen3.5-plus`   | tekst, afbeelding | 1,000,000 | Standaard voor Qwen Portal   |

<Note>
De beschikbaarheid kan per eindpunt en factureringsplan verschillen, zelfs wanneer een model
in de statische catalogus staat.
</Note>

### Token Plan-catalogus

Token Plan gebruikt een afzonderlijke acceptatielijst met exacte tekenreeksen. Planmodellen die
uitsluitend afbeeldingen genereren, zijn hier niet opgenomen omdat ze andere API's gebruiken.

| Modelverwijzing                     | Invoer          | Context   |
| ----------------------------------- | --------------- | --------- |
| `qwen-token-plan/qwen3.7-max`       | tekst           | 1,000,000 |
| `qwen-token-plan/qwen3.7-plus`      | tekst, afbeelding | 1,000,000 |
| `qwen-token-plan/qwen3.6-plus`      | tekst, afbeelding | 1,000,000 |
| `qwen-token-plan/qwen3.6-flash`     | tekst, afbeelding | 1,000,000 |
| `qwen-token-plan/deepseek-v4-pro`   | tekst           | 1,000,000 |
| `qwen-token-plan/deepseek-v4-flash` | tekst           | 1,000,000 |
| `qwen-token-plan/deepseek-v3.2`     | tekst           | 131,072   |
| `qwen-token-plan/kimi-k2.7-code`    | tekst, afbeelding | 262,144 |
| `qwen-token-plan/kimi-k2.6`         | tekst, afbeelding | 262,144 |
| `qwen-token-plan/kimi-k2.5`         | tekst, afbeelding | 262,144 |
| `qwen-token-plan/glm-5.2`           | tekst           | 1,000,000 |
| `qwen-token-plan/glm-5.1`           | tekst           | 202,752   |
| `qwen-token-plan/glm-5`             | tekst           | 202,752   |
| `qwen-token-plan/MiniMax-M2.5`      | tekst           | 196,608   |

## Instellingen voor denkprocessen

`qwen3.7-max`, `qwen3.7-plus`, `qwen3.6-flash` en `qwen3.6-plus` ondersteunen
redeneren in de ingebouwde catalogus. Voor redeneermodellen uit de `qwen`-familie
koppelt de provider de denkniveaus van OpenClaw aan de `enable_thinking`-vlag op
het hoogste niveau van DashScope-aanvragen: bij uitgeschakeld denken wordt
`enable_thinking: false` verzonden, bij elk ander niveau `enable_thinking: true`.
Aangepaste modellen kunnen kiezen voor een alternatieve denkpayload voor
chatsjablonen door `compat.thinkingFormat: "qwen-chat-template"` in te stellen
bij de modelvermelding.

Token Plan-modellen worden eveneens gemarkeerd als modellen die kunnen redeneren.
`kimi-k2.7-code` en `MiniMax-M2.5` werken uitsluitend met denken, zodat OpenClaw
denken ingeschakeld houdt, zelfs wanneer de sessie `/think off` aanvraagt.
DeepSeek V4 koppelt `minimal` tot en met `high` aan de inspanning `high` van de
service en koppelt `xhigh` of `max` aan `max`. GLM 5.2 accepteert het volledige
bereik van `minimal` tot en met `max`; GLM 5.1 en GLM 5 accepteren niveaus tot en
met `xhigh`, en alle drie gebruiken standaard `high`. Andere hybride modellen
volgen de aangevraagde aan/uit-status.

## Multimodale uitbreidingen

De `qwen`-plugin biedt multimodale mogelijkheden alleen op de **Standard**-eindpunten
van DashScope, niet op de Coding Plan-eindpunten:

- **Begrip van afbeeldingen en video's** via `qwen-vl-max-latest`
- **Wan-videogeneratie** via `wan2.6-t2v` (standaard), `wan2.6-i2v`, `wan2.6-r2v`, `wan2.6-r2v-flash`, `wan2.7-r2v`

Mediabegrip wordt automatisch afgeleid uit de geconfigureerde Qwen-authenticatie;
er is geen extra configuratie nodig. Zorg dat u een Standard-eindpunt
(betalen naar gebruik) gebruikt om mediabegrip te laten werken.

Qwen instellen als standaardprovider voor video:

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: { primary: "qwen/wan2.6-t2v" },
    },
  },
}
```

Limieten voor videogeneratie: 1 uitvoervideo per aanvraag, maximaal 1
invoerafbeelding (afbeelding-naar-video), maximaal 4 invoervideo's
(video-naar-video) en een maximale duur van 10 seconden. Ondersteunt `size`,
`aspectRatio`, `resolution`, `audio` en `watermark`. Invoer met
referentieafbeeldingen of -video's vereist externe http(s)-URL's; lokale
bestandspaden worden direct geweigerd omdat het video-eindpunt van DashScope
geen geüploade lokale buffers voor deze referenties accepteert.

<Note>
Zie [Videogeneratie](/nl/tools/video-generation) voor gedeelde toolparameters, providerselectie en failovergedrag.
</Note>

## Geavanceerde configuratie

<AccordionGroup>
  <Accordion title="Beschikbaarheid van Qwen 3.6 en 3.7">
    `qwen3.7-plus` en `qwen3.6-plus` zijn beschikbaar op Coding Plan- en Standard-eindpunten. `qwen3.7-max` en `qwen3.6-flash` zijn alleen beschikbaar op Standard. De Standard-eindpunten (betalen naar gebruik) zijn:

    - China: `dashscope.aliyuncs.com/compatible-mode/v1`
    - Wereldwijd: `dashscope-intl.aliyuncs.com/compatible-mode/v1`

    OpenClaw laat `qwen3.7-max` en `qwen3.6-flash` weg uit Coding Plan-catalogi.
    Als een Coding Plan-eindpunt voor een van beide de fout "unsupported model"
    retourneert, schakelt u over naar het overeenkomstige Standard-eindpunt en
    de bijbehorende sleutel.

  </Accordion>

  <Accordion title="Regionale routering voor videogeneratie">
    OpenClaw koppelt de geconfigureerde Qwen-regio aan de overeenkomstige
    DashScope AIGC-host voordat een videotaak wordt ingediend:

    - Wereldwijd/Internationaal: `https://dashscope-intl.aliyuncs.com`
    - China: `https://dashscope.aliyuncs.com`

    Een normale `models.providers.qwen.baseUrl` die verwijst naar een Coding Plan-
    of Standard Qwen-host routeert videogeneratie nog steeds naar het
    overeenkomstige regionale video-eindpunt van DashScope.

  </Accordion>

  <Accordion title="Compatibiliteit van gebruiksgegevens bij streaming">
    Native Qwen-eindpunten geven compatibiliteit met gebruiksgegevens bij
    streaming aan voor het gedeelde `openai-completions`-transport. Daardoor
    nemen aangepaste, met DashScope compatibele provider-id's die op dezelfde
    native hosts zijn gericht hetzelfde gedrag over, zonder dat specifiek de
    ingebouwde provider-id `qwen` vereist is. Dit geldt voor Coding Plan-,
    Standard- en Token Plan-eindpunten:

    - `https://coding.dashscope.aliyuncs.com/v1`
    - `https://coding-intl.dashscope.aliyuncs.com/v1`
    - `https://dashscope.aliyuncs.com/compatible-mode/v1`
    - `https://dashscope-intl.aliyuncs.com/compatible-mode/v1`
    - `https://token-plan.ap-southeast-1.maas.aliyuncs.com/compatible-mode/v1`
    - `https://token-plan.cn-beijing.maas.aliyuncs.com/compatible-mode/v1`

  </Accordion>

  <Accordion title="Mogelijkhedenplan">
    De `qwen`-plugin wordt gepositioneerd als de centrale locatie van de
    leverancier voor het volledige Qwen Cloud-aanbod, niet alleen voor
    modellen voor programmeren en tekst.

    - **Tekst-/chatmodellen:** beschikbaar via de plugin
    - **Toolaanroepen, gestructureerde uitvoer, denken:** overgenomen van het OpenAI-compatibele transport
    - **Afbeeldingsgeneratie:** gepland op de provider-pluginlaag
    - **Begrip van afbeeldingen en video's:** beschikbaar via de plugin op het Standard-eindpunt
    - **Spraak/audio:** gepland op de provider-pluginlaag
    - **Geheugenembeddings/herrangschikking:** gepland via de interface van de embedding-adapter
    - **Videogeneratie:** beschikbaar via de plugin met de gedeelde mogelijkheid voor videogeneratie

  </Accordion>

  <Accordion title="Omgevings- en daemonconfiguratie">
    Als de Gateway als daemon wordt uitgevoerd (launchd/systemd), moet
    `QWEN_API_KEY` of `QWEN_TOKEN_PLAN_API_KEY` beschikbaar zijn voor dat proces
    (bijvoorbeeld in `~/.openclaw/.env` of via `env.shellEnv`).
  </Accordion>
</AccordionGroup>

## Gerelateerd

<CardGroup cols={2}>
  <Card title="Modelselectie" href="/nl/concepts/model-providers" icon="layers">
    Providers, modelreferenties en failovergedrag kiezen.
  </Card>
  <Card title="Videogeneratie" href="/nl/tools/video-generation" icon="video">
    Gedeelde parameters voor videotools en providerselectie.
  </Card>
  <Card title="Alibaba Model Studio" href="/nl/providers/alibaba" icon="cloud">
    Meegeleverde provider voor Wan-videogeneratie op hetzelfde DashScope-platform.
  </Card>
  <Card title="Problemen oplossen" href="/nl/help/troubleshooting" icon="wrench">
    Algemene probleemoplossing en veelgestelde vragen.
  </Card>
</CardGroup>
