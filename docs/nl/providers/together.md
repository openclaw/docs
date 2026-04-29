---
read_when:
    - Je wilt Together AI met OpenClaw gebruiken
    - Je hebt de API-sleutelomgevingsvariabele of de CLI-authenticatiekeuze nodig
summary: Together AI instellen (authenticatie + modelselectie)
title: Together AI
x-i18n:
    generated_at: "2026-04-29T23:13:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: a7713c0b1e64014bbdd87a120de0a950b583afd1481338f2c6cccfb2b7da76e7
    source_path: providers/together.md
    workflow: 16
---

[Together AI](https://together.ai) biedt toegang tot toonaangevende open-sourcemodellen, waaronder Llama, DeepSeek, Kimi en meer, via een uniforme API.

| Eigenschap | Waarde                        |
| ---------- | ----------------------------- |
| Provider   | `together`                    |
| Auth       | `TOGETHER_API_KEY`            |
| API        | OpenAI-compatibel             |
| Basis-URL  | `https://api.together.xyz/v1` |

## Aan de slag

<Steps>
  <Step title="Haal een API-sleutel op">
    Maak een API-sleutel aan op
    [api.together.ai/settings/api-keys](https://api.together.ai/settings/api-keys).
  </Step>
  <Step title="Voer onboarding uit">
    ```bash
    openclaw onboard --auth-choice together-api-key
    ```
  </Step>
  <Step title="Stel een standaardmodel in">
    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "together/moonshotai/Kimi-K2.5" },
        },
      },
    }
    ```
  </Step>
</Steps>

### Niet-interactief voorbeeld

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice together-api-key \
  --together-api-key "$TOGETHER_API_KEY"
```

<Note>
De onboarding-preset stelt `together/moonshotai/Kimi-K2.5` in als het standaardmodel.
</Note>

## Ingebouwde catalogus

OpenClaw levert deze gebundelde Together-catalogus mee:

| Modelref                                                     | Naam                                   | Invoer      | Context    | Opmerkingen                         |
| ------------------------------------------------------------ | -------------------------------------- | ----------- | ---------- | ----------------------------------- |
| `together/moonshotai/Kimi-K2.5`                              | Kimi K2.5                              | tekst, beeld | 262,144    | Standaardmodel; reasoning ingeschakeld |
| `together/zai-org/GLM-4.7`                                   | GLM 4.7 Fp8                            | tekst       | 202,752    | Tekstmodel voor algemeen gebruik    |
| `together/meta-llama/Llama-3.3-70B-Instruct-Turbo`           | Llama 3.3 70B Instruct Turbo           | tekst       | 131,072    | Snel instructiemodel                |
| `together/meta-llama/Llama-4-Scout-17B-16E-Instruct`         | Llama 4 Scout 17B 16E Instruct         | tekst, beeld | 10,000,000 | Multimodaal                         |
| `together/meta-llama/Llama-4-Maverick-17B-128E-Instruct-FP8` | Llama 4 Maverick 17B 128E Instruct FP8 | tekst, beeld | 20,000,000 | Multimodaal                         |
| `together/deepseek-ai/DeepSeek-V3.1`                         | DeepSeek V3.1                          | tekst       | 131,072    | Algemeen tekstmodel                 |
| `together/deepseek-ai/DeepSeek-R1`                           | DeepSeek R1                            | tekst       | 131,072    | Reasoning-model                     |
| `together/moonshotai/Kimi-K2-Instruct-0905`                  | Kimi K2-Instruct 0905                  | tekst       | 262,144    | Secundair Kimi-tekstmodel           |

## Video genereren

De gebundelde `together`-Plugin registreert ook video genereren via de gedeelde tool `video_generate`.

| Eigenschap            | Waarde                                |
| --------------------- | ------------------------------------- |
| Standaardvideomodel   | `together/Wan-AI/Wan2.2-T2V-A14B`     |
| Modi                  | tekst-naar-video, enkele afbeeldingsreferentie |
| Ondersteunde parameters | `aspectRatio`, `resolution`         |

Om Together als standaardvideoprovider te gebruiken:

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "together/Wan-AI/Wan2.2-T2V-A14B",
      },
    },
  },
}
```

<Tip>
Zie [Video genereren](/nl/tools/video-generation) voor de gedeelde toolparameters, providerselectie en failovergedrag.
</Tip>

<AccordionGroup>
  <Accordion title="Omgevingsnotitie">
    Als de Gateway als daemon draait (launchd/systemd), zorg er dan voor dat
    `TOGETHER_API_KEY` beschikbaar is voor dat proces (bijvoorbeeld in
    `~/.openclaw/.env` of via `env.shellEnv`).

    <Warning>
    Sleutels die alleen in je interactieve shell zijn ingesteld, zijn niet zichtbaar voor daemon-beheerde gatewayprocessen. Gebruik `~/.openclaw/.env` of `env.shellEnv`-configuratie voor blijvende beschikbaarheid.
    </Warning>

  </Accordion>

  <Accordion title="Probleemoplossing">
    - Controleer of je sleutel werkt: `openclaw models list --provider together`
    - Als modellen niet verschijnen, controleer dan of de API-sleutel in de juiste omgeving voor je Gateway-proces is ingesteld.
    - Modelrefs gebruiken de vorm `together/<model-id>`.

  </Accordion>
</AccordionGroup>

## Gerelateerd

<CardGroup cols={2}>
  <Card title="Modelselectie" href="/nl/concepts/model-providers" icon="layers">
    Providerregels, modelrefs en failovergedrag.
  </Card>
  <Card title="Video genereren" href="/nl/tools/video-generation" icon="video">
    Gedeelde parameters voor de tool voor video genereren en providerselectie.
  </Card>
  <Card title="Configuratiereferentie" href="/nl/gateway/configuration-reference" icon="gear">
    Volledig configuratieschema inclusief providerinstellingen.
  </Card>
  <Card title="Together AI" href="https://together.ai" icon="arrow-up-right-from-square">
    Together AI-dashboard, API-documentatie en prijzen.
  </Card>
</CardGroup>
