---
read_when:
    - Je wilt Volcano Engine- of Doubao-modellen gebruiken met OpenClaw
    - Je moet de Volcengine-API-sleutel instellen
    - U wilt Volcengine Speech tekst-naar-spraak gebruiken
summary: Volcano Engine instellen (Doubao-modellen, codeer-eindpunten en Seed Speech TTS)
title: Volcengine (Doubao)
x-i18n:
    generated_at: "2026-04-29T23:14:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: b7948a26cc898e125d445e9ae091704f5cf442266d29e712c0dcedbe0dc0cce7
    source_path: providers/volcengine.md
    workflow: 16
---

De Volcengine-provider geeft toegang tot Doubao-modellen en modellen van derden
die op Volcano Engine worden gehost, met aparte eindpunten voor algemene en
coderingsworkloads. Dezelfde gebundelde Plugin kan ook Volcengine Speech als
TTS-provider registreren.

| Detail     | Waarde                                                     |
| ---------- | ---------------------------------------------------------- |
| Providers  | `volcengine` (algemeen + TTS) + `volcengine-plan` (codering) |
| Model-auth | `VOLCANO_ENGINE_API_KEY`                                   |
| TTS-auth   | `VOLCENGINE_TTS_API_KEY` of `BYTEPLUS_SEED_SPEECH_API_KEY` |
| API        | OpenAI-compatibele modellen, BytePlus Seed Speech TTS      |

## Aan de slag

<Steps>
  <Step title="Stel de API-sleutel in">
    Voer interactieve onboarding uit:

    ```bash
    openclaw onboard --auth-choice volcengine-api-key
    ```

    Dit registreert zowel de algemene (`volcengine`) als de coderingsproviders (`volcengine-plan`) vanuit één API-sleutel.

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
Voor niet-interactieve configuratie (CI, scripting) geef je de sleutel rechtstreeks door:

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice volcengine-api-key \
  --volcengine-api-key "$VOLCANO_ENGINE_API_KEY"
```

</Tip>

## Providers en eindpunten

| Provider          | Eindpunt                                  | Gebruiksscenario |
| ----------------- | ----------------------------------------- | ---------------- |
| `volcengine`      | `ark.cn-beijing.volces.com/api/v3`        | Algemene modellen |
| `volcengine-plan` | `ark.cn-beijing.volces.com/api/coding/v3` | Codeermodellen   |

<Note>
Beide providers worden geconfigureerd vanuit één API-sleutel. De setup registreert beide automatisch.
</Note>

## Ingebouwde catalogus

<Tabs>
  <Tab title="Algemeen (volcengine)">
    | Modelverwijzing                            | Naam                            | Invoer      | Context |
    | -------------------------------------------- | ------------------------------- | ----------- | ------- |
    | `volcengine/doubao-seed-1-8-251228`          | Doubao Seed 1.8                 | tekst, afbeelding | 256,000 |
    | `volcengine/doubao-seed-code-preview-251028` | doubao-seed-code-preview-251028 | tekst, afbeelding | 256,000 |
    | `volcengine/kimi-k2-5-260127`                | Kimi K2.5                       | tekst, afbeelding | 256,000 |
    | `volcengine/glm-4-7-251222`                  | GLM 4.7                         | tekst, afbeelding | 200,000 |
    | `volcengine/deepseek-v3-2-251201`            | DeepSeek V3.2                   | tekst, afbeelding | 128,000 |
  </Tab>
  <Tab title="Codering (volcengine-plan)">
    | Modelverwijzing                                 | Naam                     | Invoer | Context |
    | ------------------------------------------------- | ------------------------ | ----- | ------- |
    | `volcengine-plan/ark-code-latest`                 | Ark Coding Plan          | tekst | 256,000 |
    | `volcengine-plan/doubao-seed-code`                | Doubao Seed Code         | tekst | 256,000 |
    | `volcengine-plan/glm-4.7`                         | GLM 4.7 Coding           | tekst | 200,000 |
    | `volcengine-plan/kimi-k2-thinking`                | Kimi K2 Thinking         | tekst | 256,000 |
    | `volcengine-plan/kimi-k2.5`                       | Kimi K2.5 Coding         | tekst | 256,000 |
    | `volcengine-plan/doubao-seed-code-preview-251028` | Doubao Seed Code Preview | tekst | 256,000 |
  </Tab>
</Tabs>

## Tekst-naar-spraak

Volcengine TTS gebruikt de HTTP-API van BytePlus Seed Speech en wordt apart
geconfigureerd van de API-sleutel voor de OpenAI-compatibele Doubao-model-API.
Open in de BytePlus-console Seed Speech > Settings > API Keys en kopieer de API-sleutel, stel daarna in:

```bash
export VOLCENGINE_TTS_API_KEY="byteplus_seed_speech_api_key"
export VOLCENGINE_TTS_RESOURCE_ID="seed-tts-1.0"
```

Schakel het daarna in `openclaw.json` in:

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

Voor doelen met spraaknotities vraagt OpenClaw Volcengine om provider-native
`ogg_opus`. Voor normale audiobijlagen vraagt het om `mp3`. Provider-aliassen
`bytedance` en `doubao` verwijzen ook naar dezelfde spraakprovider.

De standaard resource-id is `seed-tts-1.0`, omdat BytePlus dat toekent aan nieuw
gemaakte Seed Speech-API-sleutels in het standaardproject. Als je project recht
heeft op TTS 2.0, stel dan `VOLCENGINE_TTS_RESOURCE_ID=seed-tts-2.0` in.

<Warning>
`VOLCANO_ENGINE_API_KEY` is voor de ModelArk/Doubao-modeleindpunten en is geen
Seed Speech-API-sleutel. TTS heeft een Seed Speech-API-sleutel nodig uit de
BytePlus Speech Console, of een verouderd AppID/token-paar uit de Speech Console.
</Warning>

Verouderde AppID/token-auth blijft ondersteund voor oudere Speech Console-applicaties:

```bash
export VOLCENGINE_TTS_APPID="speech_app_id"
export VOLCENGINE_TTS_TOKEN="speech_access_token"
export VOLCENGINE_TTS_CLUSTER="volcano_tts"
```

## Geavanceerde configuratie

<AccordionGroup>
  <Accordion title="Standaardmodel na onboarding">
    `openclaw onboard --auth-choice volcengine-api-key` stelt momenteel
    `volcengine-plan/ark-code-latest` in als het standaardmodel en registreert
    tegelijkertijd de algemene `volcengine`-catalogus.
  </Accordion>

  <Accordion title="Fallback-gedrag van de modelkiezer">
    Tijdens onboarding/modelselectie configureren geeft de Volcengine-authkeuze de voorkeur aan
    zowel `volcengine/*`- als `volcengine-plan/*`-rijen. Als die modellen nog niet
    zijn geladen, valt OpenClaw terug op de ongefilterde catalogus in plaats van
    een lege provider-gescopeerde kiezer te tonen.
  </Accordion>

  <Accordion title="Omgevingsvariabelen voor daemonprocessen">
    Als de Gateway als daemon draait (launchd/systemd), zorg er dan voor dat model- en TTS-
    env-vars zoals `VOLCANO_ENGINE_API_KEY`, `VOLCENGINE_TTS_API_KEY`,
    `BYTEPLUS_SEED_SPEECH_API_KEY`, `VOLCENGINE_TTS_APPID` en
    `VOLCENGINE_TTS_TOKEN` beschikbaar zijn voor dat proces (bijvoorbeeld in
    `~/.openclaw/.env` of via `env.shellEnv`).
  </Accordion>
</AccordionGroup>

<Warning>
Wanneer OpenClaw als achtergrondservice draait, worden omgevingsvariabelen die in je
interactieve shell zijn ingesteld niet automatisch overgenomen. Zie de daemon-opmerking hierboven.
</Warning>

## Gerelateerd

<CardGroup cols={2}>
  <Card title="Modelselectie" href="/nl/concepts/model-providers" icon="layers">
    Providers, modelverwijzingen en failover-gedrag kiezen.
  </Card>
  <Card title="Configuratie" href="/nl/gateway/configuration" icon="gear">
    Volledige configuratiereferentie voor agents, modellen en providers.
  </Card>
  <Card title="Probleemoplossing" href="/nl/help/troubleshooting" icon="wrench">
    Veelvoorkomende problemen en stappen voor debugging.
  </Card>
  <Card title="FAQ" href="/nl/help/faq" icon="circle-question">
    Veelgestelde vragen over de setup van OpenClaw.
  </Card>
</CardGroup>
