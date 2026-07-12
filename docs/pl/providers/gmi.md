---
read_when:
    - Chcesz uruchomić OpenClaw z modelami GMI Cloud
    - Potrzebujesz identyfikatora dostawcy GMI, klucza lub punktu końcowego
summary: Używanie interfejsu API GMI Cloud zgodnego z OpenAI w OpenClaw
title: GMI Cloud
x-i18n:
    generated_at: "2026-07-12T15:29:49Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a21fd2a997f44e1f78d97a0fba24ca2bbc00dd193323da712d650ed4ba105355
    source_path: providers/gmi.md
    workflow: 16
---

GMI Cloud to hostowana platforma wnioskowania dla modeli frontier i modeli z otwartymi wagami,
udostępniana za pośrednictwem interfejsu API zgodnego z OpenAI. W OpenClaw jest oficjalnym zewnętrznym
Pluginem dostawcy: zainstaluj go raz, zapisz dane uwierzytelniające za pomocą standardowego uwierzytelniania
modelu i używaj odwołań do modeli, takich jak `gmi/google/gemini-3.1-flash-lite`.

Użyj GMI, jeśli chcesz korzystać z jednego klucza API dla kilku hostowanych rodzin modeli, w tym
tras Anthropic, DeepSeek, Google, Moonshot, OpenAI i Z.AI udostępnianych w katalogu
GMI. Może działać jako dodatkowy dostawca na potrzeby przełączania awaryjnego modeli, porównywania
hostowanych tras różnych dostawców lub gdy GMI udostępnia model wcześniej niż
Twój główny dostawca. OpenClaw odpowiada za identyfikator dostawcy, profil uwierzytelniania, aliasy,
początkowy katalog modeli i bazowy adres URL; GMI odpowiada za bieżącą dostępność modeli, rozliczenia,
limity żądań oraz wszelkie zasady routingu po stronie dostawcy.

| Właściwość                 | Wartość                                  |
| -------------------------- | ---------------------------------------- |
| Identyfikator dostawcy     | `gmi` (aliasy: `gmi-cloud`, `gmicloud`)  |
| Pakiet                     | `@openclaw/gmi-provider`                 |
| Zmienna środowiskowa uwierzytelniania | `GMI_API_KEY`                 |
| API                        | Zgodne z OpenAI (`openai-completions`)   |
| Bazowy adres URL           | `https://api.gmi-serving.com/v1`         |
| Domyślny model             | `gmi/google/gemini-3.1-flash-lite`       |

## Konfiguracja

Zainstaluj Plugin, uruchom ponownie Gateway, a następnie utwórz klucz API w GMI Cloud
(`https://www.gmicloud.ai/`):

```bash
openclaw plugins install @openclaw/gmi-provider
openclaw gateway restart
```

Następnie uruchom:

```bash
openclaw onboard --auth-choice gmi-api-key
```

W konfiguracjach nieinteraktywnych można przekazać `--gmi-api-key <key>` lub ustawić:

```bash
export GMI_API_KEY="<your-gmi-api-key>" # pragma: allowlist secret
```

## Kiedy wybrać GMI

- Chcesz korzystać z hostowanego punktu końcowego zgodnego z OpenAI zamiast lokalnego serwera modeli.
- Chcesz wypróbować kilka komercyjnych rodzin modeli i modeli z otwartymi wagami za pośrednictwem jednego
  konta dostawcy.
- Chcesz mieć dostawcę zapasowego z routingiem źródłowym innym niż w przypadku DeepInfra,
  OpenRouter, Together lub bezpośrednich interfejsów API dostawców.
- Potrzebujesz identyfikatorów modeli, cennika lub mechanizmów zarządzania kontem specyficznych dla GMI.

Zamiast tego wybierz bezpośredniego dostawcę producenta, jeśli potrzebujesz funkcji natywnych dla producenta,
których GMI nie udostępnia za pośrednictwem swojej trasy zgodnej z OpenAI. Wybierz lokalnego
dostawcę, takiego jak LM Studio, Ollama, SGLang lub vLLM, gdy lokalność danych lub kontrola nad lokalnym
GPU są ważniejsze niż wygoda hostowanego rozwiązania.

## Modele

Katalog Pluginu zawiera początkowy zestaw powszechnie dostępnych identyfikatorów tras GMI Cloud:

| Odwołanie do modelu                | Dane wejściowe | Kontekst  | Maks. dane wyjściowe |
| ---------------------------------- | -------------- | --------- | -------------------- |
| `gmi/anthropic/claude-sonnet-4.6`  | tekst + obraz  | 200,000   | 64,000               |
| `gmi/deepseek-ai/DeepSeek-V3.2`    | tekst          | 163,840   | 65,536               |
| `gmi/google/gemini-3.1-flash-lite` | tekst + obraz  | 1,048,576 | 65,536               |
| `gmi/moonshotai/Kimi-K2.5`         | tekst + obraz  | 262,144   | 65,536               |
| `gmi/openai/gpt-5.4`               | tekst + obraz  | 400,000   | 128,000              |
| `gmi/zai-org/GLM-5.1-FP8`          | tekst          | 202,752   | 65,536               |

Katalog jest zestawem początkowym, a nie gwarancją, że każde konto może wywołać każdy model
w dowolnym momencie. Wyświetl modele zgłaszane przez skonfigurowanego dostawcę w swoim środowisku:

```bash
openclaw models list --provider gmi
```

## Rozwiązywanie problemów

- `401` lub `403`: sprawdź, czy `GMI_API_KEY` jest ustawiona dla procesu uruchamiającego
  OpenClaw, albo ponownie przeprowadź konfigurację początkową, aby zapisać klucz w profilu uwierzytelniania dostawcy.
- Błędy nieznanego modelu: upewnij się, że model istnieje na Twoim koncie GMI, i użyj
  pełnego odwołania `gmi/<route-id>` wyświetlanego przez `openclaw models list --provider gmi`.
- Sporadyczne błędy dostawcy: wypróbuj inną trasę GMI lub skonfiguruj GMI jako
  dostawcę zapasowego zamiast jedynego głównego dostawcy modeli.

## Powiązane

- [Dostawcy modeli](/pl/concepts/model-providers)
- [Wszyscy dostawcy](/pl/providers/index)
