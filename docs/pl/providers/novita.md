---
read_when:
    - Chcesz uruchomić OpenClaw z modelami NovitaAI
    - Potrzebujesz identyfikatora dostawcy Novita, klucza lub punktu końcowego
summary: Korzystaj z interfejsu API NovitaAI zgodnego z OpenAI za pomocą OpenClaw
title: NovitaAI
x-i18n:
    generated_at: "2026-07-12T15:33:18Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 83e0e43e68d85d73e790023858a49f971b683129dbbdf6092fbd8bba4d8da331
    source_path: providers/novita.md
    workflow: 16
---

NovitaAI to dostawca hostowanej infrastruktury AI z interfejsem API zgodnym z OpenAI.
Jest dostarczany jako wbudowany dostawca OpenClaw (bez instalowania osobnego pluginu), dlatego
dane uwierzytelniające są obsługiwane przez standardowy proces uwierzytelniania modeli, a odwołania do modeli mają postać
`novita/deepseek/deepseek-v3-0324`.

## Konfiguracja

Utwórz klucz API na stronie [novita.ai/settings/key-management](https://novita.ai/settings/key-management), a następnie uruchom:

```bash
openclaw onboard --auth-choice novita-api-key
```

Możesz też ustawić:

```bash
export NOVITA_API_KEY="<your-novita-api-key>" # pragma: allowlist secret
```

## Wartości domyślne

| Ustawienie       | Wartość                            |
| ---------------- | ---------------------------------- |
| Identyfikator dostawcy | `novita`                    |
| Aliasy            | `novita-ai`, `novitaai`            |
| Bazowy adres URL  | `https://api.novita.ai/openai/v1`  |
| Zmienna środowiskowa | `NOVITA_API_KEY`                |
| Model domyślny    | `novita/deepseek/deepseek-v3-0324` |

## Wbudowany katalog modeli

- `novita/moonshotai/kimi-k2.5`
- `novita/minimax/minimax-m2.7`
- `novita/zai-org/glm-5`
- `novita/deepseek/deepseek-v3-0324`
- `novita/deepseek/deepseek-r1-0528`
- `novita/qwen/qwen3-235b-a22b-fp8`

Jest to punkt wyjścia, a nie katalog aktualizowany na bieżąco. Twoje konto, region lub
bieżąca oferta Novita mogą dodawać, usuwać albo ograniczać trasy. Sprawdź to przed
ustawieniem długoterminowego modelu domyślnego:

```bash
openclaw models list --provider novita
```

## Kiedy wybrać Novita

- Dostęp do hostowanych modeli z otwartymi wagami przez interfejs API zgodny z OpenAI.
- Trasy modeli z rodzin DeepSeek, Kimi, MiniMax, GLM lub Qwen w ramach jednego konta
  dostawcy.
- Dodatkowa hostowana ścieżka awaryjna obok DeepInfra, GMI, OpenRouter lub bezpośrednich
  interfejsów API dostawców.
- Hostowanie modeli po stronie dostawcy zamiast utrzymywania infrastruktury LM Studio, Ollama,
  SGLang lub vLLM.

Wybierz bezpośredniego dostawcę, gdy potrzebujesz natywnych parametrów żądań
lub umów wsparcia danego dostawcy. Wybierz dostawcę lokalnego, gdy model musi
działać na Twoim własnym sprzęcie lub w granicach Twojej sieci.

## Rozwiązywanie problemów

- `401`/`403`: sprawdź klucz na stronie zarządzania kluczami Novita i ponownie uruchom
  `openclaw onboard --auth-choice novita-api-key`, jeśli zapisany profil jest
  nieaktualny.
- Błędy nieznanego modelu: użyj dokładnego identyfikatora `novita/<route-id>` zwróconego przez
  `openclaw models list --provider novita`.
- Wolne lub niedziałające trasy: wypróbuj inną trasę modelu Novita albo ustaw Novita jako
  dostawcę awaryjnego dla obciążeń, które tolerują różnice
  charakterystyczne dla poszczególnych dostawców.

## Powiązane

- [Dostawcy modeli](/pl/concepts/model-providers)
- [Katalog dostawców](/pl/providers/index)
