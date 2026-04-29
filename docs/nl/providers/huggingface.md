---
read_when:
    - Je wilt Hugging Face Inference gebruiken met OpenClaw
    - Je hebt de omgevingsvariabele voor het HF-token of de CLI-authenticatiekeuze nodig
summary: Hugging Face Inference configureren (authenticatie + modelselectie)
title: Hugging Face (inferentie)
x-i18n:
    generated_at: "2026-04-29T23:10:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: 93b3049e8d42787acba12ec3ddf70603159251dae1d870047f8ffc9242f202a5
    source_path: providers/huggingface.md
    workflow: 16
---

[Hugging Face Inference Providers](https://huggingface.co/docs/inference-providers) bieden OpenAI-compatibele chatvoltooiingen via een enkele router-API. Je krijgt toegang tot veel modellen (DeepSeek, Llama en meer) met een token. OpenClaw gebruikt het **OpenAI-compatibele eindpunt** (alleen chatvoltooiingen); gebruik voor tekst-naar-afbeelding, embeddings of spraak de [HF-inferenceclients](https://huggingface.co/docs/api-inference/quicktour) rechtstreeks.

- Provider: `huggingface`
- Auth: `HUGGINGFACE_HUB_TOKEN` of `HF_TOKEN` (fijnmazig token met **Make calls to Inference Providers**)
- API: OpenAI-compatibel (`https://router.huggingface.co/v1`)
- Facturering: enkel HF-token; [prijzen](https://huggingface.co/docs/inference-providers/pricing) volgen providertarieven met een gratis laag.

## Aan de slag

<Steps>
  <Step title="Maak een fijnmazig token">
    Ga naar [Hugging Face Settings Tokens](https://huggingface.co/settings/tokens/new?ownUserPermissions=inference.serverless.write&tokenType=fineGrained) en maak een nieuw fijnmazig token.

    <Warning>
    Het token moet de machtiging **Make calls to Inference Providers** ingeschakeld hebben, anders worden API-verzoeken geweigerd.
    </Warning>

  </Step>
  <Step title="Voer onboarding uit">
    Kies **Hugging Face** in de providerkeuzelijst en voer daarna je API-sleutel in wanneer daarom wordt gevraagd:

    ```bash
    openclaw onboard --auth-choice huggingface-api-key
    ```

  </Step>
  <Step title="Selecteer een standaardmodel">
    Kies in de keuzelijst **Standaard Hugging Face-model** het gewenste model. De lijst wordt geladen vanuit de Inference API wanneer je een geldig token hebt; anders wordt een ingebouwde lijst getoond. Je keuze wordt opgeslagen als het standaardmodel.

    Je kunt het standaardmodel later ook instellen of wijzigen in de configuratie:

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "huggingface/deepseek-ai/DeepSeek-R1" },
        },
      },
    }
    ```

  </Step>
  <Step title="Controleer of het model beschikbaar is">
    ```bash
    openclaw models list --provider huggingface
    ```
  </Step>
</Steps>

### Niet-interactieve instelling

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice huggingface-api-key \
  --huggingface-api-key "$HF_TOKEN"
```

Dit stelt `huggingface/deepseek-ai/DeepSeek-R1` in als het standaardmodel.

## Model-ID's

Modelreferenties gebruiken de vorm `huggingface/<org>/<model>` (Hub-stijl-ID's). De onderstaande lijst komt van **GET** `https://router.huggingface.co/v1/models`; je catalogus kan meer bevatten.

| Model                  | Ref (prefix met `huggingface/`)     |
| ---------------------- | ----------------------------------- |
| DeepSeek R1            | `deepseek-ai/DeepSeek-R1`           |
| DeepSeek V3.2          | `deepseek-ai/DeepSeek-V3.2`         |
| Qwen3 8B               | `Qwen/Qwen3-8B`                     |
| Qwen2.5 7B Instruct    | `Qwen/Qwen2.5-7B-Instruct`          |
| Qwen3 32B              | `Qwen/Qwen3-32B`                    |
| Llama 3.3 70B Instruct | `meta-llama/Llama-3.3-70B-Instruct` |
| Llama 3.1 8B Instruct  | `meta-llama/Llama-3.1-8B-Instruct`  |
| GPT-OSS 120B           | `openai/gpt-oss-120b`               |
| GLM 4.7                | `zai-org/GLM-4.7`                   |
| Kimi K2.5              | `moonshotai/Kimi-K2.5`              |

<Tip>
Je kunt `:fastest` of `:cheapest` toevoegen aan elk model-ID. Stel je standaardvolgorde in bij [Inference Provider-instellingen](https://hf.co/settings/inference-providers); zie [Inference Providers](https://huggingface.co/docs/inference-providers) en **GET** `https://router.huggingface.co/v1/models` voor de volledige lijst.
</Tip>

## Geavanceerde configuratie

<AccordionGroup>
  <Accordion title="Modeldetectie en onboarding-keuzelijst">
    OpenClaw ontdekt modellen door het **Inference-eindpunt rechtstreeks** aan te roepen:

    ```bash
    GET https://router.huggingface.co/v1/models
    ```

    (Optioneel: stuur `Authorization: Bearer $HUGGINGFACE_HUB_TOKEN` of `$HF_TOKEN` voor de volledige lijst; sommige eindpunten retourneren zonder auth een subset.) Het antwoord heeft OpenAI-stijl: `{ "object": "list", "data": [ { "id": "Qwen/Qwen3-8B", "owned_by": "Qwen", ... }, ... ] }`.

    Wanneer je een Hugging Face API-sleutel configureert (via onboarding, `HUGGINGFACE_HUB_TOKEN` of `HF_TOKEN`), gebruikt OpenClaw deze GET om beschikbare chatvoltooiingsmodellen te ontdekken. Tijdens **interactieve instelling**, nadat je je token hebt ingevoerd, zie je een keuzelijst **Standaard Hugging Face-model** die is gevuld vanuit die lijst (of de ingebouwde catalogus als het verzoek mislukt). Tijdens runtime (bijvoorbeeld bij het opstarten van de Gateway) roept OpenClaw, wanneer er een sleutel aanwezig is, opnieuw **GET** `https://router.huggingface.co/v1/models` aan om de catalogus te vernieuwen. De lijst wordt samengevoegd met een ingebouwde catalogus (voor metadata zoals contextvenster en kosten). Als het verzoek mislukt of er geen sleutel is ingesteld, wordt alleen de ingebouwde catalogus gebruikt.

  </Accordion>

  <Accordion title="Modelnamen, aliassen en beleidssuffixen">
    - **Naam uit API:** De weergavenaam van het model wordt **aangevuld vanuit GET /v1/models** wanneer de API `name`, `title` of `display_name` retourneert; anders wordt deze afgeleid van het model-ID (bijvoorbeeld `deepseek-ai/DeepSeek-R1` wordt "DeepSeek R1").
    - **Weergavenaam overschrijven:** Je kunt per model een aangepast label instellen in de configuratie, zodat het in de CLI en UI wordt weergegeven zoals jij wilt:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "huggingface/deepseek-ai/DeepSeek-R1": { alias: "DeepSeek R1 (fast)" },
            "huggingface/deepseek-ai/DeepSeek-R1:cheapest": { alias: "DeepSeek R1 (cheap)" },
          },
        },
      },
    }
    ```

    - **Beleidssuffixen:** De meegeleverde Hugging Face-documentatie en helpers van OpenClaw behandelen deze twee suffixen momenteel als de ingebouwde beleidsvarianten:
      - **`:fastest`** — hoogste doorvoer.
      - **`:cheapest`** — laagste kosten per uitvoertoken.

      Je kunt deze als afzonderlijke vermeldingen toevoegen in `models.providers.huggingface.models` of `model.primary` instellen met het suffix. Je kunt ook je standaardprovidervolgorde instellen in [Inference Provider-instellingen](https://hf.co/settings/inference-providers) (geen suffix = gebruik die volgorde).

    - **Configuratiesamenvoeging:** Bestaande vermeldingen in `models.providers.huggingface.models` (bijvoorbeeld in `models.json`) blijven behouden wanneer de configuratie wordt samengevoegd. Dus alle aangepaste `name`, `alias` of modelopties die je daar instelt, blijven behouden.

  </Accordion>

  <Accordion title="Omgeving en daemoninstelling">
    Als de Gateway als daemon draait (launchd/systemd), zorg er dan voor dat `HUGGINGFACE_HUB_TOKEN` of `HF_TOKEN` beschikbaar is voor dat proces (bijvoorbeeld in `~/.openclaw/.env` of via `env.shellEnv`).

    <Note>
    OpenClaw accepteert zowel `HUGGINGFACE_HUB_TOKEN` als `HF_TOKEN` als aliassen voor omgevingsvariabelen. Beide werken; als beide zijn ingesteld, heeft `HUGGINGFACE_HUB_TOKEN` voorrang.
    </Note>

  </Accordion>

  <Accordion title="Config: DeepSeek R1 met Qwen-fallback">
    ```json5
    {
      agents: {
        defaults: {
          model: {
            primary: "huggingface/deepseek-ai/DeepSeek-R1",
            fallbacks: ["huggingface/Qwen/Qwen3-8B"],
          },
          models: {
            "huggingface/deepseek-ai/DeepSeek-R1": { alias: "DeepSeek R1" },
            "huggingface/Qwen/Qwen3-8B": { alias: "Qwen3 8B" },
          },
        },
      },
    }
    ```
  </Accordion>

  <Accordion title="Config: Qwen met goedkoopste en snelste varianten">
    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "huggingface/Qwen/Qwen3-8B" },
          models: {
            "huggingface/Qwen/Qwen3-8B": { alias: "Qwen3 8B" },
            "huggingface/Qwen/Qwen3-8B:cheapest": { alias: "Qwen3 8B (cheapest)" },
            "huggingface/Qwen/Qwen3-8B:fastest": { alias: "Qwen3 8B (fastest)" },
          },
        },
      },
    }
    ```
  </Accordion>

  <Accordion title="Config: DeepSeek + Llama + GPT-OSS met aliassen">
    ```json5
    {
      agents: {
        defaults: {
          model: {
            primary: "huggingface/deepseek-ai/DeepSeek-V3.2",
            fallbacks: [
              "huggingface/meta-llama/Llama-3.3-70B-Instruct",
              "huggingface/openai/gpt-oss-120b",
            ],
          },
          models: {
            "huggingface/deepseek-ai/DeepSeek-V3.2": { alias: "DeepSeek V3.2" },
            "huggingface/meta-llama/Llama-3.3-70B-Instruct": { alias: "Llama 3.3 70B" },
            "huggingface/openai/gpt-oss-120b": { alias: "GPT-OSS 120B" },
          },
        },
      },
    }
    ```
  </Accordion>

  <Accordion title="Config: Meerdere Qwen- en DeepSeek-modellen met beleidssuffixen">
    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "huggingface/Qwen/Qwen2.5-7B-Instruct:cheapest" },
          models: {
            "huggingface/Qwen/Qwen2.5-7B-Instruct": { alias: "Qwen2.5 7B" },
            "huggingface/Qwen/Qwen2.5-7B-Instruct:cheapest": { alias: "Qwen2.5 7B (cheap)" },
            "huggingface/deepseek-ai/DeepSeek-R1:fastest": { alias: "DeepSeek R1 (fast)" },
            "huggingface/meta-llama/Llama-3.1-8B-Instruct": { alias: "Llama 3.1 8B" },
          },
        },
      },
    }
    ```
  </Accordion>
</AccordionGroup>

## Gerelateerd

<CardGroup cols={2}>
  <Card title="Modelselectie" href="/nl/concepts/model-providers" icon="layers">
    Overzicht van alle providers, modelreferenties en failovergedrag.
  </Card>
  <Card title="Modelselectie" href="/nl/concepts/models" icon="brain">
    Hoe je modellen kiest en configureert.
  </Card>
  <Card title="Documentatie voor Inference Providers" href="https://huggingface.co/docs/inference-providers" icon="book">
    Officiële documentatie van Hugging Face Inference Providers.
  </Card>
  <Card title="Configuratie" href="/nl/gateway/configuration" icon="gear">
    Volledige configuratiereferentie.
  </Card>
</CardGroup>
