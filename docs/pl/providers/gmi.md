---
read_when:
    - Chcesz uruchomić OpenClaw z modelami GMI Cloud
    - Potrzebujesz identyfikatora dostawcy GMI, klucza lub punktu końcowego
summary: Używaj API GMI Cloud zgodnego z OpenAI z OpenClaw
title: GMI Cloud
x-i18n:
    generated_at: "2026-06-27T18:12:09Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 119db777a2285259d646c9b5ab7e3885e3c7c714039277fa06a5a881e46284b9
    source_path: providers/gmi.md
    workflow: 16
---

GMI Cloud to hostowana platforma inferencyjna dla modeli frontier i open-weight
udostępnianych przez API zgodne z OpenAI. W OpenClaw jest to oficjalny zewnętrzny
plugin dostawcy, co oznacza, że instalujesz go raz, wybierasz za pomocą identyfikatora dostawcy `gmi`,
przechowujesz dane uwierzytelniające przez zwykłe uwierzytelnianie modelu i używasz odwołań do modeli, takich jak
`gmi/google/gemini-3.1-flash-lite`.

Użyj GMI, gdy chcesz mieć jeden klucz API dla kilku rodzin hostowanych modeli, w tym
tras Google, Anthropic, OpenAI, DeepSeek, Moonshot i Z.AI udostępnianych przez
katalog GMI. Jest przydatny jako dodatkowy dostawca do awaryjnego przełączania modeli, porównywania
hostowanych tras między dostawcami lub gdy GMI udostępnia model wcześniej niż
dostawca główny.

Ten dostawca używa semantyki czatu zgodnej z OpenAI. OpenClaw odpowiada za
identyfikator dostawcy, profil uwierzytelniania, aliasy, początkowy katalog modeli i bazowy adres URL; GMI odpowiada za bieżącą
dostępność modeli, rozliczenia, limity szybkości oraz wszelkie zasady routingu po stronie dostawcy.

## Konfiguracja

Zainstaluj plugin, uruchom ponownie Gateway, a następnie utwórz klucz API w GMI Cloud:

```bash
openclaw plugins install @openclaw/gmi-provider
openclaw gateway restart
```

Następnie uruchom:

```bash
openclaw onboard --auth-choice gmi-api-key
```

Albo ustaw:

```bash
export GMI_API_KEY="<your-gmi-api-key>" # pragma: allowlist secret
```

## Wartości domyślne

- Dostawca: `gmi`
- Aliasy: `gmi-cloud`, `gmicloud`
- Bazowy adres URL: `https://api.gmi-serving.com/v1`
- Zmienna środowiskowa: `GMI_API_KEY`
- Model domyślny: `gmi/google/gemini-3.1-flash-lite`

## Kiedy wybrać GMI

- Chcesz hostowany endpoint zgodny z OpenAI zamiast lokalnego serwera modeli.
- Chcesz wypróbować kilka komercyjnych i open-weight rodzin modeli przez jedno
  konto dostawcy.
- Chcesz dostawcę awaryjnego z innym routingiem upstream niż OpenRouter,
  DeepInfra, Together lub bezpośrednie API dostawców.
- Potrzebujesz identyfikatorów modeli, cennika lub mechanizmów kontroli konta specyficznych dla GMI.

Wybierz zamiast tego bezpośredniego dostawcę, gdy potrzebujesz natywnych funkcji dostawcy,
których GMI nie udostępnia przez swoją trasę zgodną z OpenAI. Wybierz lokalnego
dostawcę, takiego jak Ollama, LM Studio, vLLM lub SGLang, gdy lokalność danych lub lokalna
kontrola GPU są ważniejsze niż wygoda hostowania.

## Modele

Katalog pluginu zawiera początkowy zestaw często dostępnych identyfikatorów tras GMI Cloud, w tym:

- `gmi/zai-org/GLM-5.1-FP8`
- `gmi/deepseek-ai/DeepSeek-V3.2`
- `gmi/moonshotai/Kimi-K2.5`
- `gmi/google/gemini-3.1-flash-lite`
- `gmi/anthropic/claude-sonnet-4.6`
- `gmi/openai/gpt-5.4`

Katalog jest zestawem początkowym, a nie obietnicą, że każde konto może wywołać każdy model
w każdej chwili. Użyj polecenia OpenClaw do listowania modeli, aby zobaczyć, co skonfigurowany
dostawca zgłasza w Twoim środowisku:

```bash
openclaw models list --provider gmi
```

## Rozwiązywanie problemów

- `401` lub `403`: sprawdź, czy `GMI_API_KEY` jest ustawione dla procesu uruchamiającego
  OpenClaw, albo ponownie uruchom onboarding, aby zapisać klucz w profilu uwierzytelniania dostawcy.
- Błędy nieznanego modelu: potwierdź, że model istnieje na Twoim koncie GMI, i użyj
  pełnego odwołania `gmi/<route-id>` pokazanego przez `openclaw models list --provider gmi`.
- Sporadyczne błędy dostawcy: spróbuj innej trasy GMI albo skonfiguruj GMI jako
  dostawcę awaryjnego zamiast jedynego głównego dostawcy modeli.

## Powiązane

- [Dostawcy modeli](/pl/concepts/model-providers)
- [Wszyscy dostawcy](/pl/providers/index)
