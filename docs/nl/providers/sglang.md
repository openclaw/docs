---
read_when:
    - Je wilt OpenClaw gebruiken met een lokale SGLang-server
    - Je wilt OpenAI-compatibele /v1-eindpunten met je eigen modellen
summary: OpenClaw uitvoeren met SGLang (OpenAI-compatibele zelfgehoste server)
title: SGLang
x-i18n:
    generated_at: "2026-04-29T23:13:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8ed6767f85bcf099fb25dfe72a48b8a09e04ba13212125651616d2d93607beba
    source_path: providers/sglang.md
    workflow: 16
---

SGLang kan open-sourcemodellen aanbieden via een **OpenAI-compatibele** HTTP-API.
OpenClaw kan verbinding maken met SGLang met de `openai-completions`-API.

OpenClaw kan beschikbare modellen ook **automatisch ontdekken** vanuit SGLang wanneer je je aanmeldt
met `SGLANG_API_KEY` (elke waarde werkt als je server geen verificatie afdwingt)
en je geen expliciete `models.providers.sglang`-vermelding definieert.

OpenClaw behandelt `sglang` als een lokale OpenAI-compatibele provider die
gestreamde gebruiksregistratie ondersteunt, zodat status-/context-tokentellingen kunnen worden bijgewerkt vanuit
`stream_options.include_usage`-responsen.

## Aan de slag

<Steps>
  <Step title="SGLang starten">
    Start SGLang met een OpenAI-compatibele server. Je basis-URL moet
    `/v1`-eindpunten aanbieden (bijvoorbeeld `/v1/models`, `/v1/chat/completions`). SGLang
    draait vaak op:

    - `http://127.0.0.1:30000/v1`

  </Step>
  <Step title="Een API-sleutel instellen">
    Elke waarde werkt als er geen verificatie op je server is geconfigureerd:

    ```bash
    export SGLANG_API_KEY="sglang-local"
    ```

  </Step>
  <Step title="Onboarding uitvoeren of rechtstreeks een model instellen">
    ```bash
    openclaw onboard
    ```

    Of configureer het model handmatig:

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "sglang/your-model-id" },
        },
      },
    }
    ```

  </Step>
</Steps>

## Modeldetectie (impliciete provider)

Wanneer `SGLANG_API_KEY` is ingesteld (of er een verificatieprofiel bestaat) en je **geen**
`models.providers.sglang` definieert, voert OpenClaw een query uit naar:

- `GET http://127.0.0.1:30000/v1/models`

en zet de geretourneerde ID's om naar modelvermeldingen.

<Note>
Als je `models.providers.sglang` expliciet instelt, wordt automatische detectie overgeslagen en
moet je modellen handmatig definiëren.
</Note>

## Expliciete configuratie (handmatige modellen)

Gebruik expliciete configuratie wanneer:

- SGLang op een andere host/poort draait.
- Je `contextWindow`-/`maxTokens`-waarden wilt vastzetten.
- Je server een echte API-sleutel vereist (of je headers wilt beheren).

```json5
{
  models: {
    providers: {
      sglang: {
        baseUrl: "http://127.0.0.1:30000/v1",
        apiKey: "${SGLANG_API_KEY}",
        api: "openai-completions",
        models: [
          {
            id: "your-model-id",
            name: "Local SGLang Model",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 128000,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

## Geavanceerde configuratie

<AccordionGroup>
  <Accordion title="Proxy-achtig gedrag">
    SGLang wordt behandeld als een proxy-achtige OpenAI-compatibele `/v1`-backend, niet als een
    native OpenAI-eindpunt.

    | Gedrag | SGLang |
    |----------|--------|
    | Verzoekvorming alleen voor OpenAI | Niet toegepast |
    | `service_tier`, Responses `store`, prompt-cachehints | Niet verzonden |
    | Payloadvorming voor redeneringscompatibiliteit | Niet toegepast |
    | Verborgen attributieheaders (`originator`, `version`, `User-Agent`) | Niet geïnjecteerd op aangepaste SGLang-basis-URL's |

  </Accordion>

  <Accordion title="Problemen oplossen">
    **Server niet bereikbaar**

    Controleer of de server draait en reageert:

    ```bash
    curl http://127.0.0.1:30000/v1/models
    ```

    **Verificatiefouten**

    Als verzoeken mislukken met verificatiefouten, stel dan een echte `SGLANG_API_KEY` in die overeenkomt
    met je serverconfiguratie, of configureer de provider expliciet onder
    `models.providers.sglang`.

    <Tip>
    Als je SGLang zonder verificatie uitvoert, is elke niet-lege waarde voor
    `SGLANG_API_KEY` voldoende om je aan te melden voor modeldetectie.
    </Tip>

  </Accordion>
</AccordionGroup>

## Gerelateerd

<CardGroup cols={2}>
  <Card title="Modelselectie" href="/nl/concepts/model-providers" icon="layers">
    Providers, modelverwijzingen en failovergedrag kiezen.
  </Card>
  <Card title="Configuratiereferentie" href="/nl/gateway/configuration-reference" icon="gear">
    Volledig configuratieschema inclusief providervermeldingen.
  </Card>
</CardGroup>
