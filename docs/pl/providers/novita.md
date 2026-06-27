---
read_when:
    - Chcesz uruchomić OpenClaw z modelami NovitaAI
    - Potrzebujesz identyfikatora dostawcy Novita, klucza lub punktu końcowego
summary: Używaj API NovitaAI zgodnego z OpenAI z OpenClaw
title: NovitaAI
x-i18n:
    generated_at: "2026-06-27T18:13:30Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 602df700662dbf2176acabcad7d23950e8240158f58d115f8e56bf1fb9f43bcb
    source_path: providers/novita.md
    workflow: 16
---

NovitaAI to hostowany dostawca infrastruktury AI z API modeli zgodnym z OpenAI. W OpenClaw jest to wbudowany dostawca modeli, więc identyfikator dostawcy to `novita`, dane uwierzytelniające przechodzą przez standardowy przepływ uwierzytelniania modeli, a odwołania do modeli wyglądają jak `novita/deepseek/deepseek-v3-0324`.

Użyj Novita, gdy chcesz hostowanego dostępu do otwartych wag i tras modeli innych firm bez uruchamiania własnego serwera inferencji. Wbudowany katalog koncentruje się na modelach czatu praktycznych dla tur agentów, w tym trasach DeepSeek, Moonshot, MiniMax, GLM i Qwen udostępnianych przez Novita.

Ten dostawca używa punktu końcowego Novita zgodnego z OpenAI. OpenClaw obsługuje rejestrację dostawcy, uwierzytelnianie, aliasy, normalizację odwołań do modeli i wybór bazowego adresu URL; Novita kontroluje bieżącą dostępność modeli, uprawnienia konta, ceny i limity szybkości.

## Konfiguracja

Utwórz klucz API na [novita.ai/settings/key-management](https://novita.ai/settings/key-management), a następnie uruchom:

```bash
openclaw onboard --auth-choice novita-api-key
```

Albo ustaw:

```bash
export NOVITA_API_KEY="<your-novita-api-key>" # pragma: allowlist secret
```

## Domyślne ustawienia

- Dostawca: `novita`
- Aliasy: `novita-ai`, `novitaai`
- Bazowy adres URL: `https://api.novita.ai/openai/v1`
- Zmienna środowiskowa: `NOVITA_API_KEY`
- Domyślny model: `novita/deepseek/deepseek-v3-0324`

## Kiedy wybrać Novita

- Chcesz hostowanego dostępu do modeli z otwartymi wagami przez API zgodne z OpenAI.
- Chcesz tras z rodzin DeepSeek, Kimi, MiniMax, GLM lub Qwen przez jedno konto dostawcy.
- Chcesz innej hostowanej ścieżki awaryjnej obok OpenRouter, GMI, DeepInfra lub bezpośrednich API dostawców.
- Wolisz hosting modeli po stronie dostawcy zamiast utrzymywania infrastruktury vLLM, SGLang, LM Studio lub Ollama.

Wybierz bezpośredniego dostawcę producenta, gdy potrzebujesz natywnych dla producenta parametrów żądań lub umów wsparcia. Wybierz dostawcę lokalnego, gdy model musi działać na Twoim własnym sprzęcie lub za Twoją własną granicą sieciową.

## Modele

Wbudowany katalog inicjuje powszechnie dostępne identyfikatory tras NovitaAI, w tym:

- `novita/moonshotai/kimi-k2.5`
- `novita/minimax/minimax-m2.7`
- `novita/zai-org/glm-5`
- `novita/deepseek/deepseek-v3-0324`
- `novita/deepseek/deepseek-r1-0528`
- `novita/qwen/qwen3-235b-a22b-fp8`

Katalog jest punktem wyjścia do wyboru modeli w OpenClaw. Twoje konto, region lub bieżący katalog Novita mogą dodawać, usuwać albo ograniczać trasy. Sprawdź dostawcę z CLI przed ustawieniem długotrwałej wartości domyślnej:

```bash
openclaw models list --provider novita
```

## Rozwiązywanie problemów

- `401` lub `403`: zweryfikuj klucz na stronie zarządzania kluczami Novita i uruchom ponownie `openclaw onboard --auth-choice novita-api-key`, jeśli zapisany profil jest nieaktualny.
- Błędy nieznanego modelu: użyj dokładnego `novita/<route-id>` zwróconego przez `openclaw models list --provider novita`.
- Powolne lub nieudane trasy: spróbuj innej trasy modelu Novita albo ustaw Novita jako dostawcę awaryjnego dla obciążeń, które tolerują zróżnicowanie specyficzne dla dostawcy.

## Powiązane

- [Dostawcy modeli](/pl/concepts/model-providers)
- [Wszyscy dostawcy](/pl/providers/index)
