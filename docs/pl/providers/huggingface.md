---
read_when:
    - Chcesz używać Hugging Face Inference z OpenClaw
    - Potrzebujesz zmiennej env z tokenem HF albo wyboru auth w CLI
summary: Konfiguracja Hugging Face Inference (auth + wybór modelu)
title: Hugging Face (inferencja)
x-i18n:
    generated_at: "2026-04-24T09:27:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: 93b3049e8d42787acba12ec3ddf70603159251dae1d870047f8ffc9242f202a5
    source_path: providers/huggingface.md
    workflow: 15
---

[Hugging Face Inference Providers](https://huggingface.co/docs/inference-providers) oferują zgodne z OpenAI chat completions przez jedno API routera. Otrzymujesz dostęp do wielu modeli (DeepSeek, Llama i innych) za pomocą jednego tokenu. OpenClaw używa **punktu końcowego zgodnego z OpenAI** (tylko chat completions); dla text-to-image, embeddingów lub mowy używaj bezpośrednio [klientów HF inference](https://huggingface.co/docs/api-inference/quicktour).

- Provider: `huggingface`
- Auth: `HUGGINGFACE_HUB_TOKEN` lub `HF_TOKEN` (token fine-grained z uprawnieniem **Make calls to Inference Providers**)
- API: zgodne z OpenAI (`https://router.huggingface.co/v1`)
- Billing: pojedynczy token HF; [cennik](https://huggingface.co/docs/inference-providers/pricing) jest zgodny ze stawkami dostawców i obejmuje darmowy poziom.

## Pierwsze kroki

<Steps>
  <Step title="Utwórz token fine-grained">
    Przejdź do [Hugging Face Settings Tokens](https://huggingface.co/settings/tokens/new?ownUserPermissions=inference.serverless.write&tokenType=fineGrained) i utwórz nowy token fine-grained.

    <Warning>
    Token musi mieć włączone uprawnienie **Make calls to Inference Providers**, w przeciwnym razie żądania API będą odrzucane.
    </Warning>

  </Step>
  <Step title="Uruchom onboarding">
    Wybierz **Hugging Face** z listy dostawców, a następnie podaj klucz API, gdy pojawi się monit:

    ```bash
    openclaw onboard --auth-choice huggingface-api-key
    ```

  </Step>
  <Step title="Wybierz domyślny model">
    Z listy **Default Hugging Face model** wybierz model, którego chcesz używać. Lista jest ładowana z Inference API, gdy masz prawidłowy token; w przeciwnym razie pokazywana jest lista wbudowana. Twój wybór jest zapisywany jako model domyślny.

    Możesz też ustawić lub zmienić model domyślny później w konfiguracji:

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
  <Step title="Zweryfikuj, że model jest dostępny">
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

To ustawi `huggingface/deepseek-ai/DeepSeek-R1` jako model domyślny.

## Identyfikatory modeli

Model ref mają postać `huggingface/<org>/<model>` (identyfikatory w stylu Hub). Poniższa lista pochodzi z **GET** `https://router.huggingface.co/v1/models`; twój katalog może zawierać więcej.

| Model                  | Ref (dodaj prefiks `huggingface/`) |
| ---------------------- | ---------------------------------- |
| DeepSeek R1            | `deepseek-ai/DeepSeek-R1`          |
| DeepSeek V3.2          | `deepseek-ai/DeepSeek-V3.2`        |
| Qwen3 8B               | `Qwen/Qwen3-8B`                    |
| Qwen2.5 7B Instruct    | `Qwen/Qwen2.5-7B-Instruct`         |
| Qwen3 32B              | `Qwen/Qwen3-32B`                   |
| Llama 3.3 70B Instruct | `meta-llama/Llama-3.3-70B-Instruct` |
| Llama 3.1 8B Instruct  | `meta-llama/Llama-3.1-8B-Instruct` |
| GPT-OSS 120B           | `openai/gpt-oss-120b`              |
| GLM 4.7                | `zai-org/GLM-4.7`                  |
| Kimi K2.5              | `moonshotai/Kimi-K2.5`             |

<Tip>
Możesz dodać `:fastest` albo `:cheapest` do dowolnego identyfikatora modelu. Ustaw domyślną kolejność w [ustawieniach Inference Provider](https://hf.co/settings/inference-providers); pełną listę znajdziesz w [Inference Providers](https://huggingface.co/docs/inference-providers) oraz w **GET** `https://router.huggingface.co/v1/models`.
</Tip>

## Konfiguracja zaawansowana

<AccordionGroup>
  <Accordion title="Wykrywanie modeli i lista rozwijana w onboardingu">
    OpenClaw wykrywa modele, wywołując bezpośrednio **punkt końcowy Inference**:

    ```bash
    GET https://router.huggingface.co/v1/models
    ```

    (Opcjonalnie: wyślij `Authorization: Bearer $HUGGINGFACE_HUB_TOKEN` albo `$HF_TOKEN`, aby uzyskać pełną listę; niektóre punkty końcowe zwracają podzbiór bez auth.) Odpowiedź ma styl OpenAI: `{ "object": "list", "data": [ { "id": "Qwen/Qwen3-8B", "owned_by": "Qwen", ... }, ... ] }`.

    Gdy skonfigurujesz klucz API Hugging Face (przez onboarding, `HUGGINGFACE_HUB_TOKEN` albo `HF_TOKEN`), OpenClaw używa tego GET do wykrywania dostępnych modeli chat-completion. Podczas **interaktywnej konfiguracji**, po podaniu tokenu zobaczysz listę rozwijaną **Default Hugging Face model** wypełnioną danymi z tej listy (albo z wbudowanego katalogu, jeśli żądanie się nie powiedzie). W czasie działania (np. przy uruchamianiu Gateway), gdy klucz jest obecny, OpenClaw ponownie wywołuje **GET** `https://router.huggingface.co/v1/models`, aby odświeżyć katalog. Lista jest scalana z katalogiem wbudowanym (dla metadanych takich jak okno kontekstu i koszt). Jeśli żądanie się nie powiedzie albo nie ustawiono klucza, używany jest tylko katalog wbudowany.

  </Accordion>

  <Accordion title="Nazwy modeli, aliasy i sufiksy polityk">
    - **Nazwa z API:** Wyświetlana nazwa modelu jest **uzupełniana z GET /v1/models**, gdy API zwraca `name`, `title` albo `display_name`; w przeciwnym razie jest wyprowadzana z identyfikatora modelu (np. `deepseek-ai/DeepSeek-R1` staje się „DeepSeek R1”).
    - **Nadpisanie nazwy wyświetlanej:** Możesz ustawić własną etykietę per model w konfiguracji, tak aby była wyświetlana w CLI i UI dokładnie tak, jak chcesz:

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

    - **Sufiksy polityk:** Dołączona dokumentacja i helpery Hugging Face w OpenClaw obecnie traktują te dwa sufiksy jako wbudowane warianty polityk:
      - **`:fastest`** — najwyższa przepustowość.
      - **`:cheapest`** — najniższy koszt na token wyjściowy.

      Możesz dodać je jako osobne wpisy w `models.providers.huggingface.models` albo ustawić `model.primary` z tym sufiksem. Możesz też ustawić domyślną kolejność dostawców w [ustawieniach Inference Provider](https://hf.co/settings/inference-providers) (bez sufiksu = użyj tej kolejności).

    - **Scalanie konfiguracji:** Istniejące wpisy w `models.providers.huggingface.models` (np. w `models.json`) są zachowywane podczas scalania konfiguracji. Oznacza to, że wszelkie własne `name`, `alias` albo opcje modeli ustawione w tym miejscu zostaną zachowane.

  </Accordion>

  <Accordion title="Środowisko i konfiguracja daemona">
    Jeśli Gateway działa jako daemon (launchd/systemd), upewnij się, że `HUGGINGFACE_HUB_TOKEN` albo `HF_TOKEN` jest dostępne dla tego procesu (na przykład w `~/.openclaw/.env` albo przez `env.shellEnv`).

    <Note>
    OpenClaw akceptuje zarówno `HUGGINGFACE_HUB_TOKEN`, jak i `HF_TOKEN` jako aliasy zmiennych env. Działa dowolna z nich; jeśli ustawione są obie, pierwszeństwo ma `HUGGINGFACE_HUB_TOKEN`.
    </Note>

  </Accordion>

  <Accordion title="Config: DeepSeek R1 z fallbackiem Qwen">
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

  <Accordion title="Config: Qwen z wariantami cheapest i fastest">
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

  <Accordion title="Config: DeepSeek + Llama + GPT-OSS z aliasami">
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

  <Accordion title="Config: Wiele modeli Qwen i DeepSeek z sufiksami polityk">
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

## Powiązane

<CardGroup cols={2}>
  <Card title="Wybór modelu" href="/pl/concepts/model-providers" icon="layers">
    Przegląd wszystkich dostawców, model ref i zachowania failoveru.
  </Card>
  <Card title="Wybór modelu" href="/pl/concepts/models" icon="brain">
    Jak wybierać i konfigurować modele.
  </Card>
  <Card title="Dokumentacja Inference Providers" href="https://huggingface.co/docs/inference-providers" icon="book">
    Oficjalna dokumentacja Hugging Face Inference Providers.
  </Card>
  <Card title="Konfiguracja" href="/pl/gateway/configuration" icon="gear">
    Pełna dokumentacja konfiguracji.
  </Card>
</CardGroup>
