---
read_when:
    - Chcesz kierować ruch OpenClaw przez proxy LiteLLM
    - Potrzebujesz śledzenia kosztów, rejestrowania lub routingu modeli przez LiteLLM
summary: Uruchamiaj OpenClaw za pośrednictwem LiteLLM Proxy, aby uzyskać ujednolicony dostęp do modeli i śledzenie kosztów
title: LiteLLM
x-i18n:
    generated_at: "2026-04-30T10:13:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: 26b5150cfca92c9cd425c864c711efb3ab62ef94377b9d1e5d6476b07bf4c800
    source_path: providers/litellm.md
    workflow: 16
---

[LiteLLM](https://litellm.ai) to otwartoźródłowy LLM gateway, który zapewnia ujednolicone API do ponad 100 dostawców modeli. Kieruj OpenClaw przez LiteLLM, aby uzyskać scentralizowane śledzenie kosztów, logowanie oraz elastyczność przełączania backendów bez zmiany konfiguracji OpenClaw.

<Tip>
**Dlaczego używać LiteLLM z OpenClaw?**

- **Śledzenie kosztów** — Zobacz dokładnie, ile OpenClaw wydaje na wszystkie modele
- **Routing modeli** — Przełączaj się między Claude, GPT-4, Gemini, Bedrock bez zmian konfiguracji
- **Klucze wirtualne** — Twórz klucze z limitami wydatków dla OpenClaw
- **Logowanie** — Pełne logi żądań/odpowiedzi do debugowania
- **Mechanizmy awaryjne** — Automatyczne przełączenie awaryjne, jeśli główny dostawca jest niedostępny

</Tip>

## Szybki start

<Tabs>
  <Tab title="Onboarding (recommended)">
    **Najlepsze dla:** najszybszej ścieżki do działającej konfiguracji LiteLLM.

    <Steps>
      <Step title="Run onboarding">
        ```bash
        openclaw onboard --auth-choice litellm-api-key
        ```

        W przypadku nieinteraktywnej konfiguracji zdalnego proxy przekaż jawnie URL proxy:

        ```bash
        openclaw onboard --non-interactive --auth-choice litellm-api-key --litellm-api-key "$LITELLM_API_KEY" --custom-base-url "https://litellm.example/v1"
        ```
      </Step>
    </Steps>

  </Tab>

  <Tab title="Manual setup">
    **Najlepsze dla:** pełnej kontroli nad instalacją i konfiguracją.

    <Steps>
      <Step title="Start LiteLLM Proxy">
        ```bash
        pip install 'litellm[proxy]'
        litellm --model claude-opus-4-6
        ```
      </Step>
      <Step title="Point OpenClaw to LiteLLM">
        ```bash
        export LITELLM_API_KEY="your-litellm-key"

        openclaw
        ```

        To wszystko. OpenClaw kieruje teraz ruch przez LiteLLM.
      </Step>
    </Steps>

  </Tab>
</Tabs>

## Konfiguracja

### Zmienne środowiskowe

```bash
export LITELLM_API_KEY="sk-litellm-key"
```

### Plik konfiguracyjny

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

## Konfiguracja zaawansowana

### Generowanie obrazów

LiteLLM może też obsługiwać narzędzie `image_generate` za pośrednictwem zgodnych z OpenAI
tras `/images/generations` i `/images/edits`. Skonfiguruj model obrazów LiteLLM
w `agents.defaults.imageGenerationModel`:

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

Adresy URL LiteLLM dla local loopback, takie jak `http://localhost:4000`, działają bez globalnego
nadpisania sieci prywatnej. W przypadku proxy hostowanego w sieci LAN ustaw
`models.providers.litellm.request.allowPrivateNetwork: true`, ponieważ klucz API
zostanie wysłany do skonfigurowanego hosta proxy.

<AccordionGroup>
  <Accordion title="Virtual keys">
    Utwórz dedykowany klucz dla OpenClaw z limitami wydatków:

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

  <Accordion title="Model routing">
    LiteLLM może kierować żądania modeli do różnych backendów. Skonfiguruj to w pliku LiteLLM `config.yaml`:

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

    OpenClaw nadal żąda `claude-opus-4-6` — LiteLLM obsługuje routing.

  </Accordion>

  <Accordion title="Viewing usage">
    Sprawdź pulpit LiteLLM lub API:

    ```bash
    # Key info
    curl "http://localhost:4000/key/info" \
      -H "Authorization: Bearer sk-litellm-key"

    # Spend logs
    curl "http://localhost:4000/spend/logs" \
      -H "Authorization: Bearer $LITELLM_MASTER_KEY"
    ```

  </Accordion>

  <Accordion title="Proxy behavior notes">
    - LiteLLM domyślnie działa pod adresem `http://localhost:4000`
    - OpenClaw łączy się przez zgodny z OpenAI endpoint `/v1` LiteLLM w stylu proxy
    - Natywne kształtowanie żądań tylko dla OpenAI nie ma zastosowania przez LiteLLM:
      brak `service_tier`, brak Responses `store`, brak wskazówek pamięci podręcznej promptów i brak
      kształtowania payloadu zgodnego z rozumowaniem OpenAI
    - Ukryte nagłówki atrybucji OpenClaw (`originator`, `version`, `User-Agent`)
      nie są wstrzykiwane dla niestandardowych bazowych adresów URL LiteLLM
  </Accordion>
</AccordionGroup>

<Note>
Ogólną konfigurację dostawców i zachowanie przełączania awaryjnego opisano w [Dostawcy modeli](/pl/concepts/model-providers).
</Note>

## Powiązane

<CardGroup cols={2}>
  <Card title="LiteLLM Docs" href="https://docs.litellm.ai" icon="book">
    Oficjalna dokumentacja LiteLLM i referencja API.
  </Card>
  <Card title="Model selection" href="/pl/concepts/model-providers" icon="layers">
    Przegląd wszystkich dostawców, referencji modeli i zachowania przełączania awaryjnego.
  </Card>
  <Card title="Configuration" href="/pl/gateway/configuration" icon="gear">
    Pełna referencja konfiguracji.
  </Card>
  <Card title="Model selection" href="/pl/concepts/models" icon="brain">
    Jak wybierać i konfigurować modele.
  </Card>
</CardGroup>
