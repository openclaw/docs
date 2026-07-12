---
read_when:
    - Chcesz używać Hugging Face Inference z OpenClaw
    - Potrzebujesz zmiennej środowiskowej z tokenem HF lub opcji uwierzytelniania w CLI
summary: Konfiguracja Hugging Face Inference (uwierzytelnianie i wybór modelu)
title: Hugging Face (wnioskowanie)
x-i18n:
    generated_at: "2026-07-12T15:34:28Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c4e0d98c844c053484559254a0bdf4258c3d39954ac5804cdb0d081a651b89df
    source_path: providers/huggingface.md
    workflow: 16
---

[Dostawcy wnioskowania Hugging Face](https://huggingface.co/docs/inference-providers) udostępniają zgodny z OpenAI router uzupełnień czatu dla wielu hostowanych modeli (DeepSeek, Llama i innych), dostępny za pomocą jednego tokenu. OpenClaw komunikuje się **wyłącznie z punktem końcowym uzupełnień czatu**; do zamiany tekstu na obraz, osadzeń lub mowy używaj bezpośrednio [klientów wnioskowania HF](https://huggingface.co/docs/api-inference/quicktour).

| Właściwość                  | Wartość                                                                                                                            |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Identyfikator dostawcy      | `huggingface`                                                                                                                      |
| Plugin                      | wbudowany (domyślnie włączony, nie wymaga instalacji)                                                                              |
| Zmienna środowiskowa uwierz. | `HUGGINGFACE_HUB_TOKEN` lub `HF_TOKEN` (token z precyzyjnie określonymi uprawnieniami)                                              |
| API                         | zgodne z OpenAI (`https://router.huggingface.co/v1`)                                                                                |
| Rozliczenia                 | Jeden token HF; [cennik](https://huggingface.co/docs/inference-providers/pricing) jest zgodny ze stawkami dostawcy i obejmuje bezpłatny próg |

## Pierwsze kroki

<Steps>
  <Step title="Utwórz token z precyzyjnie określonymi uprawnieniami">
    Przejdź do strony [Hugging Face Settings Tokens](https://huggingface.co/settings/tokens/new?ownUserPermissions=inference.serverless.write&tokenType=fineGrained) i utwórz nowy token z precyzyjnie określonymi uprawnieniami.

    <Warning>
    Token musi mieć włączone uprawnienie **Make calls to Inference Providers**, w przeciwnym razie żądania API będą odrzucane.
    </Warning>

  </Step>
  <Step title="Uruchom konfigurację początkową">
    Wybierz **Hugging Face** z listy rozwijanej dostawców, a następnie po wyświetleniu monitu wprowadź klucz API:

    ```bash
    openclaw onboard --auth-choice huggingface-api-key
    ```

  </Step>
  <Step title="Wybierz model domyślny">
    Z listy rozwijanej **Default Hugging Face model** wybierz model. Gdy token jest prawidłowy, lista jest pobierana z Inference API; w przeciwnym razie OpenClaw wyświetla poniższy wbudowany katalog. Wybór jest zapisywany jako `agents.defaults.model.primary`:

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
  <Step title="Sprawdź dostępność modelu">
    ```bash
    openclaw models list --provider huggingface
    ```
  </Step>
</Steps>

### Konfiguracja nieinteraktywna

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice huggingface-api-key \
  --huggingface-api-key "$HF_TOKEN"
```

Ustawia `huggingface/deepseek-ai/DeepSeek-R1` jako model domyślny.

## Identyfikatory modeli

Odwołania do modeli mają postać `huggingface/<org>/<model>` (identyfikatory w stylu Hub). Wbudowany katalog OpenClaw:

| Model                        | Odwołanie (z prefiksem `huggingface/`)     |
| ---------------------------- | ------------------------------------------ |
| DeepSeek R1                  | `deepseek-ai/DeepSeek-R1`                  |
| DeepSeek V3.1                | `deepseek-ai/DeepSeek-V3.1`                |
| GPT-OSS 120B                 | `openai/gpt-oss-120b`                      |
| Llama 3.3 70B Instruct Turbo | `meta-llama/Llama-3.3-70B-Instruct-Turbo`  |

<Tip>
Gdy token jest prawidłowy, OpenClaw wykrywa również wszystkie inne modele za pomocą żądania **GET** do `https://router.huggingface.co/v1/models` podczas konfiguracji początkowej i uruchamiania Gateway, dzięki czemu katalog może zawierać znacznie więcej niż cztery powyższe modele. Do dowolnego identyfikatora modelu możesz dodać `:fastest` lub `:cheapest`; router HF przekieruje żądanie do odpowiedniego dostawcy wnioskowania. Ustaw domyślną kolejność dostawców w [ustawieniach dostawców wnioskowania](https://hf.co/settings/inference-providers).
</Tip>

## Konfiguracja zaawansowana

<AccordionGroup>
  <Accordion title="Wykrywanie modeli i lista rozwijana konfiguracji początkowej">
    OpenClaw wykrywa modele za pomocą:

    ```bash
    GET https://router.huggingface.co/v1/models
    Authorization: Bearer $HUGGINGFACE_HUB_TOKEN   # lub $HF_TOKEN
    ```

    Odpowiedź ma format zgodny z OpenAI: `{ "object": "list", "data": [ { "id": "Qwen/Qwen3-8B", "owned_by": "Qwen", ... }, ... ] }`.

    Po skonfigurowaniu klucza (podczas konfiguracji początkowej, w `HUGGINGFACE_HUB_TOKEN` lub `HF_TOKEN`) lista rozwijana **Default Hugging Face model** podczas konfiguracji interaktywnej jest wypełniana danymi z tego punktu końcowego. Podczas uruchamiania Gateway to samo wywołanie jest powtarzane w celu odświeżenia katalogu. Wykryte modele są łączone z powyższym wbudowanym katalogiem (używanym do metadanych, takich jak okno kontekstu i koszt, gdy identyfikator jest zgodny). Jeśli żądanie się nie powiedzie, nie zwróci danych albo nie ustawiono klucza, OpenClaw korzysta wyłącznie z wbudowanego katalogu.

    Wyłącz wykrywanie bez usuwania dostawcy:

    ```bash
    openclaw config set plugins.entries.huggingface.config.discovery.enabled false
    ```

  </Accordion>

  <Accordion title="Nazwy modeli, aliasy i sufiksy zasad">
    - **Nazwa z API:** wykryte modele używają wartości `name`, `title` lub `display_name` z API, jeśli jest dostępna; w przeciwnym razie OpenClaw tworzy nazwę na podstawie identyfikatora modelu (np. `deepseek-ai/DeepSeek-R1` staje się „DeepSeek R1”).
    - **Nadpisanie nazwy wyświetlanej:** ustaw w konfiguracji własną etykietę dla każdego modelu:

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

    - **Sufiksy zasad:** `:fastest` i `:cheapest` są konwencjami routera HF, a OpenClaw ich nie przekształca: sufiks jest wysyłany bez zmian jako część identyfikatora modelu, a router HF wybiera odpowiedniego dostawcę wnioskowania. Jeśli chcesz używać osobnego aliasu dla każdego sufiksu, dodaj każdy wariant jako osobny wpis w `models.providers.huggingface.models` (lub w `model.primary`).
    - **Scalanie konfiguracji:** istniejące wpisy w `models.providers.huggingface.models` (np. w `models.json`) są zachowywane podczas scalania konfiguracji, więc ustawione tam niestandardowe wartości `name`, `alias` lub opcje modelu pozostają dostępne po ponownym uruchomieniu.

  </Accordion>

  <Accordion title="Konfiguracja środowiska i demona">
    Jeśli Gateway działa jako demon (launchd/systemd), upewnij się, że zmienna `HUGGINGFACE_HUB_TOKEN` lub `HF_TOKEN` jest dostępna dla tego procesu (na przykład w `~/.openclaw/.env` albo za pośrednictwem `env.shellEnv`).

    <Note>
    OpenClaw akceptuje zarówno `HUGGINGFACE_HUB_TOKEN`, jak i `HF_TOKEN`. Jeśli ustawiono obie zmienne, pierwszeństwo ma `HUGGINGFACE_HUB_TOKEN`.
    </Note>

  </Accordion>

  <Accordion title="Konfiguracja: DeepSeek R1 z modelem rezerwowym">
    ```json5
    {
      agents: {
        defaults: {
          model: {
            primary: "huggingface/deepseek-ai/DeepSeek-R1",
            fallbacks: ["huggingface/openai/gpt-oss-120b"],
          },
          models: {
            "huggingface/deepseek-ai/DeepSeek-R1": { alias: "DeepSeek R1" },
            "huggingface/openai/gpt-oss-120b": { alias: "GPT-OSS 120B" },
          },
        },
      },
    }
    ```
  </Accordion>

  <Accordion title="Konfiguracja: DeepSeek z najtańszym i najszybszym wariantem">
    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "huggingface/deepseek-ai/DeepSeek-R1" },
          models: {
            "huggingface/deepseek-ai/DeepSeek-R1": { alias: "DeepSeek R1" },
            "huggingface/deepseek-ai/DeepSeek-R1:cheapest": { alias: "DeepSeek R1 (cheapest)" },
            "huggingface/deepseek-ai/DeepSeek-R1:fastest": { alias: "DeepSeek R1 (fastest)" },
          },
        },
      },
    }
    ```
  </Accordion>

  <Accordion title="Konfiguracja: DeepSeek + Llama + GPT-OSS z aliasami">
    ```json5
    {
      agents: {
        defaults: {
          model: {
            primary: "huggingface/deepseek-ai/DeepSeek-V3.1",
            fallbacks: [
              "huggingface/meta-llama/Llama-3.3-70B-Instruct-Turbo",
              "huggingface/openai/gpt-oss-120b",
            ],
          },
          models: {
            "huggingface/deepseek-ai/DeepSeek-V3.1": { alias: "DeepSeek V3.1" },
            "huggingface/meta-llama/Llama-3.3-70B-Instruct-Turbo": { alias: "Llama 3.3 70B Turbo" },
            "huggingface/openai/gpt-oss-120b": { alias: "GPT-OSS 120B" },
          },
        },
      },
    }
    ```
  </Accordion>
</AccordionGroup>

## Powiązane materiały

<CardGroup cols={2}>
  <Card title="Wybór modelu" href="/pl/concepts/model-providers" icon="layers">
    Omówienie wszystkich dostawców, odwołań do modeli i działania przełączania awaryjnego.
  </Card>
  <Card title="Wybór modelu" href="/pl/concepts/models" icon="brain">
    Jak wybierać i konfigurować modele.
  </Card>
  <Card title="Dokumentacja dostawców wnioskowania" href="https://huggingface.co/docs/inference-providers" icon="book">
    Oficjalna dokumentacja dostawców wnioskowania Hugging Face.
  </Card>
  <Card title="Konfiguracja" href="/pl/gateway/configuration" icon="gear">
    Pełna dokumentacja konfiguracji.
  </Card>
</CardGroup>
