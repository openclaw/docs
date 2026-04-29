---
read_when:
    - Je wilt privacygerichte inferentie in OpenClaw
    - Je wilt hulp bij het instellen van Venice AI
summary: Gebruik privacygerichte modellen van Venice AI in OpenClaw
title: Venice AI
x-i18n:
    generated_at: "2026-04-29T23:13:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: d87db1595ba6d34459143e7d173cca9549ad21928eaaf00605b7487ce6d33fce
    source_path: providers/venice.md
    workflow: 16
---

Venice AI biedt **privacygerichte AI-inference** met ondersteuning voor ongecensureerde modellen en toegang tot grote propriëtaire modellen via hun geanonimiseerde proxy. Alle inference is standaard privé — geen training op je gegevens, geen logging.

## Waarom Venice in OpenClaw

- **Privé-inference** voor open-sourcemodellen (geen logging).
- **Ongecensureerde modellen** wanneer je die nodig hebt.
- **Geanonimiseerde toegang** tot propriëtaire modellen (Opus/GPT/Gemini) wanneer kwaliteit belangrijk is.
- OpenAI-compatibele `/v1`-endpoints.

## Privacymodi

Venice biedt twee privacyniveaus — dit begrijpen is essentieel om je model te kiezen:

| Modus              | Beschrijving                                                                                                                           | Modellen                                                      |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| **Privé**          | Volledig privé. Prompts/antwoorden worden **nooit opgeslagen of gelogd**. Tijdelijk.                                                   | Llama, Qwen, DeepSeek, Kimi, MiniMax, Venice Uncensored, enz. |
| **Geanonimiseerd** | Geproxied via Venice met verwijderde metadata. De onderliggende provider (OpenAI, Anthropic, Google, xAI) ziet geanonimiseerde verzoeken. | Claude, GPT, Gemini, Grok                                     |

<Warning>
Geanonimiseerde modellen zijn **niet** volledig privé. Venice verwijdert metadata voordat er wordt doorgestuurd, maar de onderliggende provider (OpenAI, Anthropic, Google, xAI) verwerkt het verzoek nog steeds. Kies **privé**-modellen wanneer volledige privacy vereist is.
</Warning>

## Functies

- **Privacygericht**: Kies tussen "privé" (volledig privé) en "geanonimiseerd" (geproxied)
- **Ongecensureerde modellen**: Toegang tot modellen zonder contentbeperkingen
- **Toegang tot grote modellen**: Gebruik Claude, GPT, Gemini en Grok via de geanonimiseerde proxy van Venice
- **OpenAI-compatibele API**: Standaard `/v1`-endpoints voor eenvoudige integratie
- **Streaming**: Ondersteund op alle modellen
- **Function calling**: Ondersteund op geselecteerde modellen (controleer modelmogelijkheden)
- **Vision**: Ondersteund op modellen met vision-mogelijkheid
- **Geen harde rate limits**: Fair-use-throttling kan gelden bij extreem gebruik

## Aan de slag

<Steps>
  <Step title="Je API-sleutel ophalen">
    1. Meld je aan bij [venice.ai](https://venice.ai)
    2. Ga naar **Settings > API Keys > Create new key**
    3. Kopieer je API-sleutel (formaat: `vapi_xxxxxxxxxxxx`)
  </Step>
  <Step title="OpenClaw configureren">
    Kies je voorkeursmethode voor installatie:

    <Tabs>
      <Tab title="Interactief (aanbevolen)">
        ```bash
        openclaw onboard --auth-choice venice-api-key
        ```

        Dit zal:
        1. Vragen om je API-sleutel (of bestaande `VENICE_API_KEY` gebruiken)
        2. Alle beschikbare Venice-modellen tonen
        3. Je je standaardmodel laten kiezen
        4. De provider automatisch configureren
      </Tab>
      <Tab title="Omgevingsvariabele">
        ```bash
        export VENICE_API_KEY="vapi_xxxxxxxxxxxx"
        ```
      </Tab>
      <Tab title="Niet-interactief">
        ```bash
        openclaw onboard --non-interactive \
          --auth-choice venice-api-key \
          --venice-api-key "vapi_xxxxxxxxxxxx"
        ```
      </Tab>
    </Tabs>

  </Step>
  <Step title="Installatie verifiëren">
    ```bash
    openclaw agent --model venice/kimi-k2-5 --message "Hello, are you working?"
    ```
  </Step>
</Steps>

## Modelselectie

Na de installatie toont OpenClaw alle beschikbare Venice-modellen. Kies op basis van je behoeften:

- **Standaardmodel**: `venice/kimi-k2-5` voor sterk privé redeneren plus vision.
- **Optie met hoge capaciteit**: `venice/claude-opus-4-6` voor het sterkste geanonimiseerde Venice-pad.
- **Privacy**: Kies "privé"-modellen voor volledig privé-inference.
- **Mogelijkheden**: Kies "geanonimiseerde" modellen om toegang te krijgen tot Claude, GPT en Gemini via de proxy van Venice.

Wijzig je standaardmodel op elk moment:

```bash
openclaw models set venice/kimi-k2-5
openclaw models set venice/claude-opus-4-6
```

Alle beschikbare modellen weergeven:

```bash
openclaw models list | grep venice
```

Je kunt ook `openclaw configure` uitvoeren, **Model/auth** selecteren en **Venice AI** kiezen.

<Tip>
Gebruik de onderstaande tabel om het juiste model voor je use case te kiezen.

| Use case                    | Aanbevolen model                 | Waarom                                                |
| --------------------------- | -------------------------------- | ----------------------------------------------------- |
| **Algemene chat (standaard)** | `kimi-k2-5`                      | Sterk privé redeneren plus vision                     |
| **Beste algemene kwaliteit** | `claude-opus-4-6`                | Sterkste geanonimiseerde Venice-optie                 |
| **Privacy + coderen**       | `qwen3-coder-480b-a35b-instruct` | Privé codeermodel met grote context                   |
| **Privé vision**            | `kimi-k2-5`                      | Vision-ondersteuning zonder de privémodus te verlaten |
| **Snel + goedkoop**         | `qwen3-4b`                       | Lichtgewicht redeneermodel                            |
| **Complexe privétaken**     | `deepseek-v3.2`                  | Sterk redeneren, maar geen Venice-toolondersteuning   |
| **Ongecensureerd**          | `venice-uncensored`              | Geen contentbeperkingen                               |

</Tip>

## Replay-gedrag van DeepSeek V4

Als Venice DeepSeek V4-modellen beschikbaar maakt, zoals `venice/deepseek-v4-pro` of
`venice/deepseek-v4-flash`, vult OpenClaw de vereiste DeepSeek V4
`reasoning_content`-replayplaceholder in bij assistant-berichten wanneer de proxy
deze weglaat. Venice weigert DeepSeeks native top-level `thinking`-besturing, dus
OpenClaw houdt die providerspecifieke replayfix gescheiden van de thinking-besturingen
van de native DeepSeek-provider.

## Ingebouwde catalogus (41 totaal)

<AccordionGroup>
  <Accordion title="Privémodellen (26) — volledig privé, geen logging">
    | Model-ID                               | Naam                                | Context | Functies                    |
    | -------------------------------------- | ----------------------------------- | ------- | --------------------------- |
    | `kimi-k2-5`                            | Kimi K2.5                           | 256k    | Standaard, redeneren, vision |
    | `kimi-k2-thinking`                     | Kimi K2 Thinking                    | 256k    | Redeneren                   |
    | `llama-3.3-70b`                        | Llama 3.3 70B                       | 128k    | Algemeen                    |
    | `llama-3.2-3b`                         | Llama 3.2 3B                        | 128k    | Algemeen                    |
    | `hermes-3-llama-3.1-405b`              | Hermes 3 Llama 3.1 405B            | 128k    | Algemeen, tools uitgeschakeld |
    | `qwen3-235b-a22b-thinking-2507`        | Qwen3 235B Thinking                 | 128k    | Redeneren                   |
    | `qwen3-235b-a22b-instruct-2507`        | Qwen3 235B Instruct                 | 128k    | Algemeen                    |
    | `qwen3-coder-480b-a35b-instruct`       | Qwen3 Coder 480B                    | 256k    | Coderen                     |
    | `qwen3-coder-480b-a35b-instruct-turbo` | Qwen3 Coder 480B Turbo              | 256k    | Coderen                     |
    | `qwen3-5-35b-a3b`                      | Qwen3.5 35B A3B                     | 256k    | Redeneren, vision           |
    | `qwen3-next-80b`                       | Qwen3 Next 80B                      | 256k    | Algemeen                    |
    | `qwen3-vl-235b-a22b`                   | Qwen3 VL 235B (Vision)              | 256k    | Vision                      |
    | `qwen3-4b`                             | Venice Small (Qwen3 4B)             | 32k     | Snel, redeneren             |
    | `deepseek-v3.2`                        | DeepSeek V3.2                       | 160k    | Redeneren, tools uitgeschakeld |
    | `venice-uncensored`                    | Venice Uncensored (Dolphin-Mistral) | 32k     | Ongecensureerd, tools uitgeschakeld |
    | `mistral-31-24b`                       | Venice Medium (Mistral)             | 128k    | Vision                      |
    | `google-gemma-3-27b-it`                | Google Gemma 3 27B Instruct         | 198k    | Vision                      |
    | `openai-gpt-oss-120b`                  | OpenAI GPT OSS 120B                 | 128k    | Algemeen                    |
    | `nvidia-nemotron-3-nano-30b-a3b`       | NVIDIA Nemotron 3 Nano 30B          | 128k    | Algemeen                    |
    | `olafangensan-glm-4.7-flash-heretic`   | GLM 4.7 Flash Heretic               | 128k    | Redeneren                   |
    | `zai-org-glm-4.6`                      | GLM 4.6                             | 198k    | Algemeen                    |
    | `zai-org-glm-4.7`                      | GLM 4.7                             | 198k    | Redeneren                   |
    | `zai-org-glm-4.7-flash`                | GLM 4.7 Flash                       | 128k    | Redeneren                   |
    | `zai-org-glm-5`                        | GLM 5                               | 198k    | Redeneren                   |
    | `minimax-m21`                          | MiniMax M2.1                        | 198k    | Redeneren                   |
    | `minimax-m25`                          | MiniMax M2.5                        | 198k    | Redeneren                   |
  </Accordion>

  <Accordion title="Geanonimiseerde modellen (15) — via Venice-proxy">
    | Model-ID                        | Naam                           | Context | Functies                  |
    | ------------------------------- | ------------------------------ | ------- | ------------------------- |
    | `claude-opus-4-6`               | Claude Opus 4.6 (via Venice)   | 1M      | Redeneren, vision         |
    | `claude-opus-4-5`               | Claude Opus 4.5 (via Venice)   | 198k    | Redeneren, vision         |
    | `claude-sonnet-4-6`             | Claude Sonnet 4.6 (via Venice) | 1M      | Redeneren, vision         |
    | `claude-sonnet-4-5`             | Claude Sonnet 4.5 (via Venice) | 198k    | Redeneren, vision         |
    | `openai-gpt-54`                 | GPT-5.4 (via Venice)           | 1M      | Redeneren, vision         |
    | `openai-gpt-53-codex`           | GPT-5.3 Codex (via Venice)     | 400k    | Redeneren, vision, coderen |
    | `openai-gpt-52`                 | GPT-5.2 (via Venice)           | 256k    | Redeneren                 |
    | `openai-gpt-52-codex`           | GPT-5.2 Codex (via Venice)     | 256k    | Redeneren, vision, coderen |
    | `openai-gpt-4o-2024-11-20`      | GPT-4o (via Venice)            | 128k    | Vision                    |
    | `openai-gpt-4o-mini-2024-07-18` | GPT-4o Mini (via Venice)       | 128k    | Vision                    |
    | `gemini-3-1-pro-preview`        | Gemini 3.1 Pro (via Venice)    | 1M      | Redeneren, vision         |
    | `gemini-3-pro-preview`          | Gemini 3 Pro (via Venice)      | 198k    | Redeneren, vision         |
    | `gemini-3-flash-preview`        | Gemini 3 Flash (via Venice)    | 256k    | Redeneren, vision         |
    | `grok-41-fast`                  | Grok 4.1 Fast (via Venice)     | 1M      | Redeneren, vision         |
    | `grok-code-fast-1`              | Grok Code Fast 1 (via Venice)  | 256k    | Redeneren, coderen        |
  </Accordion>
</AccordionGroup>

## Modeldetectie

OpenClaw detecteert automatisch modellen via de Venice-API wanneer `VENICE_API_KEY` is ingesteld. Als de API onbereikbaar is, valt het terug op een statische catalogus.

Het `/models`-endpoint is openbaar (geen auth nodig om te lijsten), maar inference vereist een geldige API-sleutel.

## Streaming en toolondersteuning

| Functie             | Ondersteuning                                                 |
| ------------------- | ------------------------------------------------------------- |
| **Streaming**       | Alle modellen                                                 |
| **Functieaanroep**  | De meeste modellen (controleer `supportsFunctionCalling` in API) |
| **Vision/Images**   | Modellen gemarkeerd met de functie "Vision"                   |
| **JSON-modus**      | Ondersteund via `response_format`                             |

## Prijzen

Venice gebruikt een systeem op basis van credits. Bekijk [venice.ai/pricing](https://venice.ai/pricing) voor actuele tarieven:

- **Privémodellen**: Over het algemeen lagere kosten
- **Geanonimiseerde modellen**: Vergelijkbaar met directe API-prijzen + kleine Venice-toeslag

### Venice (geanonimiseerd) versus directe API

| Aspect         | Venice (geanonimiseerd)             | Directe API             |
| -------------- | ----------------------------------- | ----------------------- |
| **Privacy**    | Metadata verwijderd, geanonimiseerd | Je account is gekoppeld |
| **Latentie**   | +10-50 ms (proxy)                   | Direct                  |
| **Functies**   | De meeste functies ondersteund      | Volledige functies      |
| **Facturering** | Venice-credits                     | Providerfacturering     |

## Gebruiksvoorbeelden

```bash
# Use the default private model
openclaw agent --model venice/kimi-k2-5 --message "Quick health check"

# Use Claude Opus via Venice (anonymized)
openclaw agent --model venice/claude-opus-4-6 --message "Summarize this task"

# Use uncensored model
openclaw agent --model venice/venice-uncensored --message "Draft options"

# Use vision model with image
openclaw agent --model venice/qwen3-vl-235b-a22b --message "Review attached image"

# Use coding model
openclaw agent --model venice/qwen3-coder-480b-a35b-instruct --message "Refactor this function"
```

## Probleemoplossing

<AccordionGroup>
  <Accordion title="API key not recognized">
    ```bash
    echo $VENICE_API_KEY
    openclaw models list | grep venice
    ```

    Zorg ervoor dat de sleutel begint met `vapi_`.

  </Accordion>

  <Accordion title="Model not available">
    De Venice-modelcatalogus wordt dynamisch bijgewerkt. Voer `openclaw models list` uit om de momenteel beschikbare modellen te bekijken. Sommige modellen kunnen tijdelijk offline zijn.
  </Accordion>

  <Accordion title="Connection issues">
    De Venice API staat op `https://api.venice.ai/api/v1`. Zorg ervoor dat je netwerk HTTPS-verbindingen toestaat.
  </Accordion>
</AccordionGroup>

<Note>
Meer hulp: [Probleemoplossing](/nl/help/troubleshooting) en [FAQ](/nl/help/faq).
</Note>

## Geavanceerde configuratie

<AccordionGroup>
  <Accordion title="Config file example">
    ```json5
    {
      env: { VENICE_API_KEY: "vapi_..." },
      agents: { defaults: { model: { primary: "venice/kimi-k2-5" } } },
      models: {
        mode: "merge",
        providers: {
          venice: {
            baseUrl: "https://api.venice.ai/api/v1",
            apiKey: "${VENICE_API_KEY}",
            api: "openai-completions",
            models: [
              {
                id: "kimi-k2-5",
                name: "Kimi K2.5",
                reasoning: true,
                input: ["text", "image"],
                cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
                contextWindow: 256000,
                maxTokens: 65536,
              },
            ],
          },
        },
      },
    }
    ```
  </Accordion>
</AccordionGroup>

## Gerelateerd

<CardGroup cols={2}>
  <Card title="Model selection" href="/nl/concepts/model-providers" icon="layers">
    Providers, modelreferenties en failovergedrag kiezen.
  </Card>
  <Card title="Venice AI" href="https://venice.ai" icon="globe">
    Startpagina van Venice AI en accountregistratie.
  </Card>
  <Card title="API documentation" href="https://docs.venice.ai" icon="book">
    Venice API-referentie en ontwikkelaarsdocumentatie.
  </Card>
  <Card title="Pricing" href="https://venice.ai/pricing" icon="credit-card">
    Actuele Venice-credittarieven en abonnementen.
  </Card>
</CardGroup>
