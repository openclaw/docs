---
read_when:
    - Je wilt Together AI gebruiken met OpenClaw
    - Je hebt de omgevingsvariabele voor de API-sleutel of de CLI-authenticatiekeuze nodig
summary: Together AI-installatie (authenticatie + modelselectie)
title: Together AI
x-i18n:
    generated_at: "2026-06-27T18:15:29Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a1f803ae88828a775d93dcf8b0b62e70b1dbd0cf963639121e2995fabfcd280b
    source_path: providers/together.md
    workflow: 16
---

[Together AI](https://together.ai) biedt toegang tot toonaangevende open-source
modellen, waaronder Llama, DeepSeek, Kimi en meer, via een uniforme API.

| Eigenschap | Waarde                        |
| ---------- | ----------------------------- |
| Provider   | `together`                    |
| Auth       | `TOGETHER_API_KEY`            |
| API        | OpenAI-compatibel             |
| Basis-URL  | `https://api.together.xyz/v1` |

## Aan de slag

<Steps>
  <Step title="Get an API key">
    Maak een API-sleutel aan op
    [api.together.ai/settings/api-keys](https://api.together.ai/settings/api-keys).
  </Step>
  <Step title="Run onboarding">
    ```bash
    openclaw onboard --auth-choice together-api-key
    ```
  </Step>
  <Step title="Set a default model">
    ```json5
    {
      agents: {
        defaults: {
          model: {
            primary: "together/meta-llama/Llama-3.3-70B-Instruct-Turbo",
          },
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
De onboarding-preset stelt
`together/meta-llama/Llama-3.3-70B-Instruct-Turbo` in als het standaardmodel.
</Note>

## Ingebouwde catalogus

OpenClaw levert deze gebundelde Together-catalogus:

| Modelreferentie                                    | Naam                         | Invoer             | Context | Opmerkingen          |
| -------------------------------------------------- | ---------------------------- | ------------------ | ------- | -------------------- |
| `together/meta-llama/Llama-3.3-70B-Instruct-Turbo` | Llama 3.3 70B Instruct Turbo | tekst              | 131,072 | Standaardmodel       |
| `together/moonshotai/Kimi-K2.6`                    | Kimi K2.6 FP4                | tekst, afbeelding  | 262,144 | Kimi-redeneermodel   |
| `together/deepseek-ai/DeepSeek-V4-Pro`             | DeepSeek V4 Pro              | tekst              | 512,000 | Redenerend tekstmodel |
| `together/Qwen/Qwen2.5-7B-Instruct-Turbo`          | Qwen2.5 7B Instruct Turbo    | tekst              | 32,768  | Snel tekstmodel      |
| `together/zai-org/GLM-5.1`                         | GLM 5.1 FP4                  | tekst              | 202,752 | Redenerend tekstmodel |

## Videogeneratie

De gebundelde `together` Plugin registreert ook videogeneratie via de
gedeelde `video_generate`-tool.

| Eigenschap              | Waarde                                                                      |
| ----------------------- | --------------------------------------------------------------------------- |
| Standaard videomodel    | `together/Wan-AI/Wan2.2-T2V-A14B`                                           |
| Modi                    | tekst-naar-video; alleen referentie met één afbeelding met `Wan-AI/Wan2.2-I2V-A14B` |
| Ondersteunde parameters | `aspectRatio`, `resolution`                                                 |

Om Together als standaard videoprovider te gebruiken:

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
Zie [Videogeneratie](/nl/tools/video-generation) voor de gedeelde toolparameters,
providerselectie en failovergedrag.
</Tip>

<AccordionGroup>
  <Accordion title="Environment note">
    Als de Gateway als daemon draait (launchd/systemd), zorg er dan voor dat
    `TOGETHER_API_KEY` beschikbaar is voor dat proces (bijvoorbeeld in
    `~/.openclaw/.env` of via `env.shellEnv`).

    <Warning>
    Sleutels die alleen in je interactieve shell zijn ingesteld, zijn niet zichtbaar voor door daemons beheerde
    gatewayprocessen. Gebruik `~/.openclaw/.env` of `env.shellEnv`-configuratie voor
    blijvende beschikbaarheid.
    </Warning>

  </Accordion>

  <Accordion title="Troubleshooting">
    - Controleer of je sleutel werkt: `openclaw models list --provider together`
    - Als modellen niet verschijnen, controleer dan of de API-sleutel in de juiste
      omgeving voor je Gateway-proces is ingesteld.
    - Modelreferenties gebruiken de vorm `together/<model-id>`.

  </Accordion>
</AccordionGroup>

## Gerelateerd

<CardGroup cols={2}>
  <Card title="Model selection" href="/nl/concepts/model-providers" icon="layers">
    Providerregels, modelreferenties en failovergedrag.
  </Card>
  <Card title="Video generation" href="/nl/tools/video-generation" icon="video">
    Gedeelde toolparameters voor videogeneratie en providerselectie.
  </Card>
  <Card title="Configuration reference" href="/nl/gateway/configuration-reference" icon="gear">
    Volledig configuratieschema, inclusief providerinstellingen.
  </Card>
  <Card title="Together AI" href="https://together.ai" icon="arrow-up-right-from-square">
    Together AI-dashboard, API-documentatie en prijzen.
  </Card>
</CardGroup>
