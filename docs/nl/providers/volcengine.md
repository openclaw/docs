---
read_when:
    - Je wilt modellen van Volcano Engine of Doubao gebruiken met OpenClaw
    - Je moet de Volcengine-API-sleutel configureren
    - Je wilt tekst-naar-spraak van Volcengine Speech gebruiken
summary: Volcano Engine-configuratie (Doubao-modellen, coding-eindpunten en Seed Speech TTS)
title: Volcengine (Doubao)
x-i18n:
    generated_at: "2026-07-12T09:20:47Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e853a1c8847704caedf0ec83c38332569f72105c5e34ad973daf614a2e80550b
    source_path: providers/volcengine.md
    workflow: 16
---

De Volcengine-provider biedt toegang tot Doubao-modellen en modellen van derden die op Volcano Engine worden gehost, met afzonderlijke endpoints voor algemene en programmeerwerklasten. Dezelfde gebundelde plugin registreert ook Volcengine Speech als TTS-provider.

| Detail             | Waarde                                                     |
| ------------------ | ---------------------------------------------------------- |
| Providers          | `volcengine` (algemeen + TTS), `volcengine-plan` (programmeren) |
| Modelauthenticatie | `VOLCANO_ENGINE_API_KEY`                                   |
| TTS-authenticatie  | `VOLCENGINE_TTS_API_KEY` of `BYTEPLUS_SEED_SPEECH_API_KEY` |
| API                | OpenAI-compatibele modellen, BytePlus Seed Speech TTS      |

## Aan de slag

<Steps>
  <Step title="Stel de API-sleutel in">
    Voer de interactieve onboarding uit:

    ```bash
    openclaw onboard --auth-choice volcengine-api-key
    ```

    Hiermee worden zowel de algemene provider (`volcengine`) als de programmeerprovider (`volcengine-plan`) met één API-sleutel geregistreerd.

  </Step>
  <Step title="Stel een standaardmodel in">
    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "volcengine-plan/ark-code-latest" },
        },
      },
    }
    ```
  </Step>
  <Step title="Controleer of het model beschikbaar is">
    ```bash
    openclaw models list --provider volcengine
    openclaw models list --provider volcengine-plan
    ```
  </Step>
</Steps>

<Tip>
Geef voor een niet-interactieve configuratie (CI, scripts) de sleutel rechtstreeks door:

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice volcengine-api-key \
  --volcengine-api-key "$VOLCANO_ENGINE_API_KEY"
```

</Tip>

## Providers en endpoints

| Provider          | Endpoint                                  | Toepassing          |
| ----------------- | ----------------------------------------- | ------------------- |
| `volcengine`      | `ark.cn-beijing.volces.com/api/v3`        | Algemene modellen   |
| `volcengine-plan` | `ark.cn-beijing.volces.com/api/coding/v3` | Programmeermodellen |

<Note>
Beide providers worden met één API-sleutel geconfigureerd. De configuratie registreert beide automatisch en de modelkiezer van de programmeerprovider hergebruikt ook de authenticatie van de algemene provider (`volcengine-plan` is een authenticatie-alias van `volcengine`).
</Note>

## Ingebouwde catalogus

<Tabs>
  <Tab title="Algemeen (volcengine)">
    | Modelverwijzing                              | Naam                            | Invoer         | Context |
    | -------------------------------------------- | ------------------------------- | -------------- | ------- |
    | `volcengine/deepseek-v3-2-251201`            | DeepSeek V3.2                   | tekst, afbeelding | 128,000 |
    | `volcengine/doubao-seed-1-8-251228`          | Doubao Seed 1.8                 | tekst, afbeelding | 256,000 |
    | `volcengine/doubao-seed-code-preview-251028` | doubao-seed-code-preview-251028 | tekst, afbeelding | 256,000 |
    | `volcengine/glm-4-7-251222`                  | GLM 4.7                         | tekst, afbeelding | 200,000 |
    | `volcengine/kimi-k2-5-260127`                | Kimi K2.5                       | tekst, afbeelding | 256,000 |
  </Tab>
  <Tab title="Programmeren (volcengine-plan)">
    | Modelverwijzing                                   | Naam                     | Invoer | Context |
    | ------------------------------------------------- | ------------------------ | ------ | ------- |
    | `volcengine-plan/ark-code-latest`                 | Ark Coding Plan          | tekst  | 256,000 |
    | `volcengine-plan/doubao-seed-code`                | Doubao Seed Code         | tekst  | 256,000 |
    | `volcengine-plan/doubao-seed-code-preview-251028` | Doubao Seed Code Preview | tekst  | 256,000 |
    | `volcengine-plan/glm-4.7`                         | GLM 4.7-programmeren     | tekst  | 200,000 |
    | `volcengine-plan/kimi-k2-thinking`                | Kimi K2-denken           | tekst  | 256,000 |
    | `volcengine-plan/kimi-k2.5`                       | Kimi K2.5-programmeren   | tekst  | 256,000 |
  </Tab>
</Tabs>

Beide catalogi zijn statisch (geen `/models`-detectieaanroep) en ondersteunen OpenAI-compatibele, gestreamde gebruiksregistratie. Toolschema's voor beide providers verwijderen automatisch de sleutelwoorden `minLength`, `maxLength`, `minItems`, `maxItems`, `minContains` en `maxContains`, omdat de toolaanroep-API van Volcengine deze weigert.

## Tekst-naar-spraak

Volcengine TTS gebruikt de HTTP-API van BytePlus Seed Speech (`voice.ap-southeast-1.bytepluses.com`) en wordt afzonderlijk van de API-sleutel voor de OpenAI-compatibele Doubao-model-API geconfigureerd. Open in de BytePlus-console Seed Speech > Settings > API Keys, kopieer de API-sleutel en stel vervolgens het volgende in:

```bash
export VOLCENGINE_TTS_API_KEY="byteplus_seed_speech_api_key"
export VOLCENGINE_TTS_RESOURCE_ID="seed-tts-1.0"
```

Schakel deze vervolgens in `openclaw.json` in:

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "volcengine",
      providers: {
        volcengine: {
          apiKey: "byteplus_seed_speech_api_key",
          voice: "en_female_anna_mars_bigtts",
          speedRatio: 1.0,
        },
      },
    },
  },
}
```

Beschikbare velden onder `messages.tts.providers.volcengine`: `apiKey`, `voice`, `speedRatio` (0.2-3.0), `emotion`, `cluster`, `resourceId`, `appKey` en `baseUrl`. `!emotion=<value>` werkt ook als een inline steminstructie wanneer overschrijvingen van steminstellingen zijn toegestaan.

Voor doelen voor spraakberichten vraagt OpenClaw om de provider-eigen indeling `ogg_opus`. Voor normale audiobijlagen vraagt het om `mp3`. De provideraliassen `bytedance` en `doubao` verwijzen ook naar deze spraakprovider.

De standaardresource-id is `seed-tts-1.0`, de machtiging die BytePlus standaard aan nieuw aangemaakte Seed Speech-API-sleutels verleent. Als uw project een TTS 2.0-machtiging heeft, stelt u `VOLCENGINE_TTS_RESOURCE_ID=seed-tts-2.0` in.

<Warning>
`VOLCANO_ENGINE_API_KEY` is bedoeld voor de ModelArk/Doubao-modeleindpunten en is geen Seed Speech-API-sleutel. TTS vereist een Seed Speech-API-sleutel uit de BytePlus Speech Console, of een verouderd AppID/token-paar uit de Speech Console.
</Warning>

Verouderde AppID/token-authenticatie blijft ondersteund voor oudere Speech Console-toepassingen:

```bash
export VOLCENGINE_TTS_APPID="speech_app_id"
export VOLCENGINE_TTS_TOKEN="speech_access_token"
export VOLCENGINE_TTS_CLUSTER="volcano_tts"
```

Andere optionele TTS-omgevingsvariabelen: `VOLCENGINE_TTS_VOICE`, `VOLCENGINE_TTS_APP_KEY` en `VOLCENGINE_TTS_BASE_URL` overschrijven, wanneer ze zijn ingesteld, de overeenkomstige configuratievelden van `messages.tts.providers.volcengine`.

## Geavanceerde configuratie

<AccordionGroup>
  <Accordion title="Standaardmodel na onboarding">
    `openclaw onboard --auth-choice volcengine-api-key` stelt `volcengine-plan/ark-code-latest` in als standaardmodel en registreert tegelijkertijd de algemene `volcengine`-catalogus.
  </Accordion>

  <Accordion title="Terugvalgedrag van de modelkiezer">
    Tijdens de modelselectie bij onboarding/configuratie geeft de Volcengine-authenticatiekeuze de voorkeur aan zowel `volcengine/*`- als `volcengine-plan/*`-rijen. Als die modellen nog niet zijn geladen, valt OpenClaw terug op de ongefilterde catalogus in plaats van een lege, tot de provider beperkte kiezer weer te geven.
  </Accordion>

  <Accordion title="Omgevingsvariabelen voor daemonprocessen">
    Als de Gateway als daemon (launchd/systemd) wordt uitgevoerd, zorgt u ervoor dat omgevingsvariabelen voor modellen en TTS, zoals `VOLCANO_ENGINE_API_KEY`, `VOLCENGINE_TTS_API_KEY`, `BYTEPLUS_SEED_SPEECH_API_KEY`, `VOLCENGINE_TTS_APPID` en `VOLCENGINE_TTS_TOKEN`, beschikbaar zijn voor dat proces (bijvoorbeeld in `~/.openclaw/.env` of via `env.shellEnv`).
  </Accordion>
</AccordionGroup>

<Warning>
Wanneer OpenClaw als achtergrondservice wordt uitgevoerd, worden omgevingsvariabelen die in uw interactieve shell zijn ingesteld niet automatisch overgenomen. Zie de opmerking over daemons hierboven.
</Warning>

## Gerelateerd

<CardGroup cols={2}>
  <Card title="Modelselectie" href="/nl/concepts/model-providers" icon="layers">
    Providers, modelverwijzingen en failovergedrag kiezen.
  </Card>
  <Card title="Configuratie" href="/nl/gateway/configuration" icon="gear">
    Volledige configuratiereferentie voor agents, modellen en providers.
  </Card>
  <Card title="Problemen oplossen" href="/nl/help/troubleshooting" icon="wrench">
    Veelvoorkomende problemen en stappen voor foutopsporing.
  </Card>
  <Card title="Veelgestelde vragen" href="/nl/help/faq" icon="circle-question">
    Veelgestelde vragen over het configureren van OpenClaw.
  </Card>
</CardGroup>
