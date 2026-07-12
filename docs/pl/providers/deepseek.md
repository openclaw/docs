---
read_when:
    - Chcesz używać DeepSeek z OpenClaw
    - Potrzebujesz zmiennej środowiskowej klucza API lub opcji uwierzytelniania w CLI
summary: Konfiguracja DeepSeek (uwierzytelnianie + wybór modelu)
title: DeepSeek
x-i18n:
    generated_at: "2026-07-12T15:31:54Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 77e074756d593205d7d05f499da93b9bd3c63acdce7092b42fb5562023577925
    source_path: providers/deepseek.md
    workflow: 16
---

[DeepSeek](https://www.deepseek.com) udostępnia zaawansowane modele AI za pośrednictwem API zgodnego z OpenAI.

| Właściwość | Wartość                    |
| ----------- | -------------------------- |
| Dostawca    | `deepseek`                 |
| Uwierzytelnianie | `DEEPSEEK_API_KEY`    |
| API         | Zgodne z OpenAI            |
| Bazowy URL  | `https://api.deepseek.com` |

## Instalacja pluginu

Zainstaluj oficjalny plugin, a następnie uruchom ponownie Gateway:

```bash
openclaw plugins install @openclaw/deepseek-provider
openclaw gateway restart
```

## Pierwsze kroki

<Steps>
  <Step title="Uzyskaj klucz API">
    Utwórz klucz API na stronie [platform.deepseek.com](https://platform.deepseek.com/api_keys).
  </Step>
  <Step title="Uruchom proces wdrażania">
    ```bash
    openclaw onboard --auth-choice deepseek-api-key
    ```

    Monituje o klucz API i ustawia `deepseek/deepseek-v4-flash` jako model domyślny.

  </Step>
  <Step title="Sprawdź dostępność modeli">
    ```bash
    openclaw models list --provider deepseek
    ```

    Aby sprawdzić statyczny katalog pluginu bez uruchomionego Gateway:

    ```bash
    openclaw models list --all --provider deepseek
    ```

  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Konfiguracja nieinteraktywna">
    W przypadku instalacji skryptowych lub bez interfejsu graficznego przekaż wszystkie flagi bezpośrednio:

    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice deepseek-api-key \
      --deepseek-api-key "$DEEPSEEK_API_KEY" \
      --skip-health \
      --accept-risk
    ```

  </Accordion>
</AccordionGroup>

<Warning>
Jeśli Gateway działa jako demon (launchd/systemd), upewnij się, że zmienna `DEEPSEEK_API_KEY` jest
dostępna dla tego procesu (na przykład w `~/.openclaw/.env` lub za pośrednictwem
`env.shellEnv`).
</Warning>

## Wbudowany katalog

| Odwołanie do modelu          | Nazwa             | Dane wejściowe | Kontekst  | Maks. dane wyjściowe | Uwagi                                                    |
| ---------------------------- | ----------------- | -------------- | --------- | -------------------- | -------------------------------------------------------- |
| `deepseek/deepseek-v4-flash` | DeepSeek V4 Flash | tekst          | 1,000,000 | 384,000              | Model domyślny; wariant V4 obsługujący myślenie           |
| `deepseek/deepseek-v4-pro`   | DeepSeek V4 Pro   | tekst          | 1,000,000 | 384,000              | Wariant V4 obsługujący myślenie                           |
| `deepseek/deepseek-chat`     | DeepSeek Chat     | tekst          | 1,000,000 | 384,000              | Przestarzała nazwa zgodności V4 Flash bez trybu myślenia  |
| `deepseek/deepseek-reasoner` | DeepSeek Reasoner | tekst          | 1,000,000 | 384,000              | Przestarzała nazwa zgodności V4 Flash z trybem myślenia   |

<Warning>
DeepSeek wycofa `deepseek-chat` i `deepseek-reasoner` 24 lipca 2026 r.
o 15:59 UTC. Obecnie są one kierowane odpowiednio do DeepSeek V4 Flash w trybie
bez myślenia i z myśleniem. Przed terminem wycofania zmień skonfigurowane odwołania
do modeli na `deepseek/deepseek-v4-flash` lub `deepseek/deepseek-v4-pro`.
</Warning>

Lokalne szacunki kosztów OpenClaw są zgodne z opublikowanymi przez DeepSeek stawkami
za trafienia w pamięci podręcznej, chybienia pamięci podręcznej i dane wyjściowe.
DeepSeek może zmieniać te stawki; jego strona
[Modele i ceny](https://api-docs.deepseek.com/quick_start/pricing/) jest
miarodajnym źródłem informacji dotyczących rozliczeń.

<Tip>
Modele V4 obsługują kontrolę `thinking` platformy DeepSeek. OpenClaw odtwarza również
`reasoning_content` DeepSeek w kolejnych turach, dzięki czemu sesje myślenia
z wywołaniami narzędzi mogą być kontynuowane.
Użyj `/think xhigh` lub `/think max` z modelami DeepSeek V4, aby zażądać maksymalnego
poziomu `reasoning_effort` DeepSeek; oba są mapowane na `"max"`.
</Tip>

## Myślenie i narzędzia

Sesje myślenia DeepSeek V4 wymagają, aby odtwarzane wiadomości asystenta z tury
z włączonym myśleniem zawierały `reasoning_content` w kolejnych żądaniach.
Plugin DeepSeek dla OpenClaw automatycznie uzupełnia to pole, dlatego zwykłe
wieloturowe użycie narzędzi działa z `deepseek/deepseek-v4-flash` i
`deepseek/deepseek-v4-pro`, nawet jeśli historia pochodzi od innego dostawcy
zgodnego z OpenAI (bez natywnego `reasoning_content`) lub ze zwykłej wiadomości
asystenta. Po zmianie dostawcy w trakcie sesji użycie `/new` nie jest wymagane.

Gdy myślenie jest wyłączone (w tym po wybraniu w interfejsie opcji **None**), OpenClaw
wysyła `thinking: { type: "disabled" }` i usuwa odtwarzane `reasoning_content`
z wychodzącej historii, utrzymując sesję na ścieżce DeepSeek bez myślenia.

Użyj `deepseek/deepseek-v4-flash` jako domyślnej szybkiej ścieżki. Użyj
`deepseek/deepseek-v4-pro`, aby korzystać z bardziej zaawansowanego modelu, jeśli
akceptujesz wyższy koszt lub większe opóźnienie.

## Testowanie na żywo

Aby uruchomić tylko bezpośrednie testy modeli DeepSeek V4 z nowoczesnego zestawu testów modeli na żywo:

```bash
OPENCLAW_LIVE_PROVIDERS=deepseek \
OPENCLAW_LIVE_MODELS="deepseek/deepseek-v4-flash,deepseek/deepseek-v4-pro" \
pnpm test:live src/agents/models.profiles.live.test.ts
```

Sprawdza, czy oba modele V4 kończą działanie oraz czy kolejne tury myślenia i użycia
narzędzi zachowują odtwarzany ładunek wymagany przez DeepSeek.

## Przykład konfiguracji

```json5
{
  env: { DEEPSEEK_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: { primary: "deepseek/deepseek-v4-flash" },
    },
  },
}
```

## Powiązane materiały

<CardGroup cols={2}>
  <Card title="Wybór modelu" href="/pl/concepts/model-providers" icon="layers">
    Wybieranie dostawców, odwołań do modeli i zachowania mechanizmu przełączania awaryjnego.
  </Card>
  <Card title="Dokumentacja konfiguracji" href="/pl/gateway/configuration-reference" icon="gear">
    Pełna dokumentacja konfiguracji agentów, modeli i dostawców.
  </Card>
</CardGroup>
