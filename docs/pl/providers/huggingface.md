---
read_when:
    - Chcesz używać Hugging Face Inference z OpenClaw
    - Potrzebujesz zmiennej środowiskowej tokena HF lub opcji uwierzytelniania CLI
summary: Konfiguracja Hugging Face Inference (uwierzytelnianie + wybór modelu)
title: Hugging Face (Inference)
x-i18n:
    generated_at: "2026-04-05T14:03:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: 692d2caffbaf991670260da393c67ae7e6349b9e1e3ed5cb9a514f8a77192e86
    source_path: providers/huggingface.md
    workflow: 15
---

# Hugging Face (Inference)

[Hugging Face Inference Providers](https://huggingface.co/docs/inference-providers) oferują zgodne z OpenAI chat completions przez pojedyncze API routera. Otrzymujesz dostęp do wielu modeli (DeepSeek, Llama i innych) za pomocą jednego tokena. OpenClaw używa **endpointu zgodnego z OpenAI** (tylko chat completions); do text-to-image, embeddingów lub mowy użyj bezpośrednio [klientów HF inference](https://huggingface.co/docs/api-inference/quicktour).

- Provider: `huggingface`
- Uwierzytelnianie: `HUGGINGFACE_HUB_TOKEN` lub `HF_TOKEN` (token o szczegółowych uprawnieniach z uprawnieniem **Make calls to Inference Providers**)
- API: zgodne z OpenAI (`https://router.huggingface.co/v1`)
- Rozliczenia: jeden token HF; [cennik](https://huggingface.co/docs/inference-providers/pricing) opiera się na stawkach providerów i obejmuje darmowy poziom.

## Szybki start

1. Utwórz token o szczegółowych uprawnieniach na stronie [Hugging Face → Settings → Tokens](https://huggingface.co/settings/tokens/new?ownUserPermissions=inference.serverless.write&tokenType=fineGrained) z uprawnieniem **Make calls to Inference Providers**.
2. Uruchom onboarding i wybierz **Hugging Face** z listy rozwijanej providerów, a następnie wprowadź klucz API, gdy pojawi się monit:

```bash
openclaw onboard --auth-choice huggingface-api-key
```

3. Na liście rozwijanej **Default Hugging Face model** wybierz model, którego chcesz używać (lista jest ładowana z Inference API, gdy masz prawidłowy token; w przeciwnym razie wyświetlana jest wbudowana lista). Twój wybór zostanie zapisany jako model domyślny.
4. Możesz też ustawić lub zmienić model domyślny później w konfiguracji:

```json5
{
  agents: {
    defaults: {
      model: { primary: "huggingface/deepseek-ai/DeepSeek-R1" },
    },
  },
}
```

## Przykład nieinteraktywny

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice huggingface-api-key \
  --huggingface-api-key "$HF_TOKEN"
```

To ustawi `huggingface/deepseek-ai/DeepSeek-R1` jako model domyślny.

## Uwaga dotycząca środowiska

Jeśli Gateway działa jako demon (launchd/systemd), upewnij się, że `HUGGINGFACE_HUB_TOKEN` lub `HF_TOKEN`
jest dostępny dla tego procesu (na przykład w `~/.openclaw/.env` lub przez
`env.shellEnv`).

## Wykrywanie modeli i lista rozwijana onboardingu

OpenClaw wykrywa modele, wywołując **endpoint Inference bezpośrednio**:

```bash
GET https://router.huggingface.co/v1/models
```

(Opcjonalnie: wyślij `Authorization: Bearer $HUGGINGFACE_HUB_TOKEN` lub `$HF_TOKEN`, aby uzyskać pełną listę; niektóre endpointy bez uwierzytelniania zwracają tylko podzbiór.) Odpowiedź ma styl OpenAI: `{ "object": "list", "data": [ { "id": "Qwen/Qwen3-8B", "owned_by": "Qwen", ... }, ... ] }`.

Gdy skonfigurujesz klucz API Hugging Face (przez onboarding, `HUGGINGFACE_HUB_TOKEN` lub `HF_TOKEN`), OpenClaw użyje tego żądania GET do wykrycia dostępnych modeli chat-completion. Podczas **konfiguracji interaktywnej**, po wprowadzeniu tokena zobaczysz listę rozwijaną **Default Hugging Face model** wypełnioną na podstawie tej listy (lub wbudowanego katalogu, jeśli żądanie się nie powiedzie). W czasie działania (np. przy uruchamianiu Gateway), gdy klucz jest dostępny, OpenClaw ponownie wywołuje **GET** `https://router.huggingface.co/v1/models`, aby odświeżyć katalog. Lista jest scalana z wbudowanym katalogiem (dla metadanych, takich jak okno kontekstu i koszt). Jeśli żądanie się nie powiedzie lub nie ustawiono klucza, używany jest tylko wbudowany katalog.

## Nazwy modeli i opcje edytowalne

- **Nazwa z API:** Wyświetlana nazwa modelu jest **uzupełniana z GET /v1/models**, gdy API zwraca `name`, `title` lub `display_name`; w przeciwnym razie jest wyprowadzana z identyfikatora modelu (np. `deepseek-ai/DeepSeek-R1` → „DeepSeek R1”).
- **Nadpisanie nazwy wyświetlanej:** Możesz ustawić własną etykietę dla każdego modelu w konfiguracji, aby był wyświetlany tak, jak chcesz w CLI i UI:

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

  Możesz dodać je jako osobne wpisy w `models.providers.huggingface.models` lub ustawić `model.primary` z tym sufiksem. Możesz też ustawić domyślną kolejność providerów w [ustawieniach Inference Providers](https://hf.co/settings/inference-providers) (brak sufiksu = użyj tej kolejności).

- **Scalanie konfiguracji:** Istniejące wpisy w `models.providers.huggingface.models` (np. w `models.json`) są zachowywane podczas scalania konfiguracji. Oznacza to, że wszystkie ustawione tam własne `name`, `alias` lub opcje modelu zostaną zachowane.

## Identyfikatory modeli i przykłady konfiguracji

Odwołania do modeli mają postać `huggingface/<org>/<model>` (identyfikatory w stylu Hub). Lista poniżej pochodzi z **GET** `https://router.huggingface.co/v1/models`; Twój katalog może zawierać więcej pozycji.

**Przykładowe identyfikatory (z endpointu inference):**

| Model                  | Ref (z prefiksem `huggingface/`)    |
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

Możesz dodać `:fastest` lub `:cheapest` do identyfikatora modelu. Ustaw domyślną kolejność w [ustawieniach Inference Providers](https://hf.co/settings/inference-providers); pełną listę znajdziesz w [Inference Providers](https://huggingface.co/docs/inference-providers) oraz pod **GET** `https://router.huggingface.co/v1/models`.

### Pełne przykłady konfiguracji

**Główny model DeepSeek R1 z fallbackiem do Qwen:**

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

**Qwen jako domyślny, z wariantami `:cheapest` i `:fastest`:**

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

**DeepSeek + Llama + GPT-OSS z aliasami:**

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

**Wiele modeli Qwen i DeepSeek z sufiksami polityk:**

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
