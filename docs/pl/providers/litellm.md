---
read_when:
    - Chcesz kierować ruch OpenClaw przez proxy LiteLLM
    - Potrzebujesz śledzenia kosztów, rejestrowania zdarzeń lub routingu modeli za pośrednictwem LiteLLM
summary: Uruchamiaj OpenClaw za pośrednictwem LiteLLM Proxy, aby uzyskać ujednolicony dostęp do modeli i śledzić koszty
title: LiteLLM
x-i18n:
    generated_at: "2026-07-12T15:30:10Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 797b7d02a80a4cd37b92553665e260532af49e011398202d3504a28c511cee2f
    source_path: providers/litellm.md
    workflow: 16
---

[LiteLLM](https://litellm.ai) to brama LLM o otwartym kodzie źródłowym, oferująca ujednolicone API dla ponad 100
dostawców modeli. Kieruj ruch OpenClaw przez LiteLLM, aby centralnie śledzić koszty, rejestrować zdarzenia, używać kluczy wirtualnych z
limitami wydatków oraz przełączać się awaryjnie między backendami bez zmiany konfiguracji OpenClaw.

## Szybki start

<Tabs>
  <Tab title="Wdrażanie (zalecane)">
    ```bash
    openclaw onboard --auth-choice litellm-api-key
    ```

    Aby przeprowadzić konfigurację nieinteraktywną z użyciem zdalnego serwera proxy, jawnie podaj jego adres URL:

    ```bash
    openclaw onboard --non-interactive --accept-risk --auth-choice litellm-api-key \
      --litellm-api-key "$LITELLM_API_KEY" --custom-base-url "https://litellm.example/v1"
    ```

  </Tab>

  <Tab title="Konfiguracja ręczna">
    <Steps>
      <Step title="Uruchom LiteLLM Proxy">
        ```bash
        pip install 'litellm[proxy]'
        litellm --model claude-opus-4-6
        ```
      </Step>
      <Step title="Skieruj OpenClaw do LiteLLM">
        ```bash
        export LITELLM_API_KEY="your-litellm-key"
        openclaw
        ```
      </Step>
    </Steps>
  </Tab>
</Tabs>

## Konfiguracja

```json5
{
  models: {
    providers: {
      litellm: {
        baseUrl: "http://localhost:4000",
        apiKey: "${LITELLM_API_KEY}",
        api: "openai-completions",
        models: [
          {
            id: "claude-opus-4-6",
            name: "Claude Opus 4.6",
            reasoning: true,
            input: ["text", "image"],
            contextWindow: 200000,
            maxTokens: 64000,
          },
          {
            id: "gpt-4o",
            name: "GPT-4o",
            reasoning: false,
            input: ["text", "image"],
            contextWindow: 128000,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
  agents: {
    defaults: {
      model: { primary: "litellm/claude-opus-4-6" },
    },
  },
}
```

Proces wdrażania zapisuje domyślny model `litellm/claude-opus-4-6`.

## Generowanie obrazów

LiteLLM może obsługiwać narzędzie `image_generate` za pośrednictwem tras `/images/generations` i
`/images/edits` zgodnych z OpenAI. Domyślnym modelem obrazów jest `gpt-image-2`; inny model można skonfigurować w
`agents.defaults.imageGenerationModel`:

```json5
{
  models: {
    providers: {
      litellm: {
        baseUrl: "http://localhost:4000",
        apiKey: "${LITELLM_API_KEY}",
      },
    },
  },
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "litellm/gpt-image-2",
        timeoutMs: 180_000,
      },
    },
  },
}
```

Adresy URL LiteLLM korzystające z local loopback (`http://localhost:4000`, `127.0.0.1`, `::1`, `host.docker.internal`) działają
bez globalnego zezwolenia na dostęp do sieci prywatnej. W przypadku serwera proxy działającego w sieci LAN ustaw
`models.providers.litellm.request.allowPrivateNetwork: true`, ponieważ klucz API jest wysyłany do tego hosta.

## Zaawansowane

<AccordionGroup>
  <Accordion title="Klucze wirtualne">
    Utwórz dla OpenClaw dedykowany klucz z limitami wydatków:

    ```bash
    curl -X POST "http://localhost:4000/key/generate" \
      -H "Authorization: Bearer $LITELLM_MASTER_KEY" \
      -H "Content-Type: application/json" \
      -d '{
        "key_alias": "openclaw",
        "max_budget": 50.00,
        "budget_duration": "monthly"
      }'
    ```

    Użyj wygenerowanego klucza jako `LITELLM_API_KEY`.

  </Accordion>

  <Accordion title="Trasowanie modeli">
    LiteLLM może kierować żądania modeli do różnych backendów. Skonfiguruj to w pliku `config.yaml` LiteLLM:

    ```yaml
    model_list:
      - model_name: claude-opus-4-6
        litellm_params:
          model: claude-opus-4-6
          api_key: os.environ/ANTHROPIC_API_KEY

      - model_name: gpt-4o
        litellm_params:
          model: gpt-4o
          api_key: os.environ/OPENAI_API_KEY
    ```

    OpenClaw nadal wysyła żądania do `claude-opus-4-6`, a LiteLLM zajmuje się trasowaniem.

  </Accordion>

  <Accordion title="Wyświetlanie użycia">
    ```bash
    # Informacje o kluczu
    curl "http://localhost:4000/key/info" \
      -H "Authorization: Bearer sk-litellm-key"

    # Dzienniki wydatków
    curl "http://localhost:4000/spend/logs" \
      -H "Authorization: Bearer $LITELLM_MASTER_KEY"
    ```

  </Accordion>

  <Accordion title="Uwagi dotyczące działania serwera proxy">
    - LiteLLM domyślnie działa pod adresem `http://localhost:4000`.
    - OpenClaw łączy się przez zgodny z OpenAI punkt końcowy `/v1` serwera proxy LiteLLM.
    - Kształtowanie żądań przeznaczone wyłącznie dla natywnego OpenAI nie ma zastosowania w przypadku skonfigurowanego bazowego adresu URL LiteLLM:
      bez `service_tier`, bez `store` interfejsu Responses, bez wskazówek dotyczących pamięci podręcznej promptów i bez
      kształtowania ładunku poziomu intensywności rozumowania OpenAI.
    - Ukryte nagłówki atrybucji OpenClaw (`originator`, `version`, `User-Agent`) są wysyłane tylko do
      zweryfikowanych natywnych punktów końcowych OpenAI, dlatego nie są dodawane przy niestandardowym bazowym adresie URL LiteLLM.
  </Accordion>
</AccordionGroup>

<Note>
Ogólną konfigurację dostawców i działanie przełączania awaryjnego opisano w sekcji [Dostawcy modeli](/pl/concepts/model-providers).
</Note>

## Powiązane materiały

<CardGroup cols={2}>
  <Card title="Dokumentacja LiteLLM" href="https://docs.litellm.ai" icon="book">
    Oficjalna dokumentacja LiteLLM i dokumentacja referencyjna API.
  </Card>
  <Card title="Wybór modelu" href="/pl/concepts/model-providers" icon="layers">
    Przegląd wszystkich dostawców, odwołań do modeli i działania przełączania awaryjnego.
  </Card>
  <Card title="Konfiguracja" href="/pl/gateway/configuration" icon="gear">
    Pełna dokumentacja referencyjna konfiguracji.
  </Card>
  <Card title="Modele" href="/pl/concepts/models" icon="brain">
    Jak wybierać i konfigurować modele.
  </Card>
</CardGroup>
