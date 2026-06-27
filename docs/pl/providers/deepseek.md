---
read_when:
    - Chcesz używać DeepSeek z OpenClaw
    - Potrzebujesz zmiennej środowiskowej klucza API albo wyboru uwierzytelniania w CLI
summary: Konfiguracja DeepSeek (uwierzytelnianie + wybór modelu)
title: DeepSeek
x-i18n:
    generated_at: "2026-06-27T18:11:28Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0446f78e1cb6412034ca18b0db49f2f3a1958e91a013661b3056bf3687fc2d09
    source_path: providers/deepseek.md
    workflow: 16
---

[DeepSeek](https://www.deepseek.com) udostępnia wydajne modele AI z API zgodnym z OpenAI.

| Właściwość | Wartość                    |
| ---------- | -------------------------- |
| Dostawca   | `deepseek`                 |
| Uwierzytelnianie | `DEEPSEEK_API_KEY`   |
| API        | zgodne z OpenAI            |
| Bazowy URL | `https://api.deepseek.com` |

## Zainstaluj Plugin

Zainstaluj oficjalny Plugin, a następnie uruchom ponownie Gateway:

```bash
openclaw plugins install @openclaw/deepseek-provider
openclaw gateway restart
```

## Pierwsze kroki

<Steps>
  <Step title="Get your API key">
    Utwórz klucz API na [platform.deepseek.com](https://platform.deepseek.com/api_keys).
  </Step>
  <Step title="Run onboarding">
    ```bash
    openclaw onboard --auth-choice deepseek-api-key
    ```

    To poprosi o klucz API i ustawi `deepseek/deepseek-v4-flash` jako model domyślny.

  </Step>
  <Step title="Verify models are available">
    ```bash
    openclaw models list --provider deepseek
    ```

    Aby sprawdzić statyczny katalog Plugin bez wymagania uruchomionego Gateway,
    użyj:

    ```bash
    openclaw models list --all --provider deepseek
    ```

  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Non-interactive setup">
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
Jeśli Gateway działa jako daemon (launchd/systemd), upewnij się, że `DEEPSEEK_API_KEY`
jest dostępny dla tego procesu (na przykład w `~/.openclaw/.env` albo przez
`env.shellEnv`).
</Warning>

## Wbudowany katalog

| Ref modelu                   | Nazwa             | Wejście | Kontekst | Maks. wyjście | Uwagi                                      |
| ---------------------------- | ----------------- | ------- | -------- | ------------- | ------------------------------------------ |
| `deepseek/deepseek-v4-flash` | DeepSeek V4 Flash | tekst   | 1,000,000 | 384,000      | Model domyślny; powierzchnia V4 obsługująca myślenie |
| `deepseek/deepseek-v4-pro`   | DeepSeek V4 Pro   | tekst   | 1,000,000 | 384,000      | Powierzchnia V4 obsługująca myślenie       |
| `deepseek/deepseek-chat`     | DeepSeek Chat     | tekst   | 131,072  | 8,192         | Powierzchnia DeepSeek V3.2 bez myślenia    |
| `deepseek/deepseek-reasoner` | DeepSeek Reasoner | tekst   | 131,072  | 65,536        | Powierzchnia V3.2 z włączonym rozumowaniem |

<Tip>
Modele V4 obsługują sterowanie `thinking` w DeepSeek. OpenClaw odtwarza także
DeepSeek `reasoning_content` w kolejnych turach, dzięki czemu sesje myślenia z
wywołaniami narzędzi mogą być kontynuowane.
Użyj `/think xhigh` lub `/think max` z modelami DeepSeek V4, aby zażądać
maksymalnego `reasoning_effort` DeepSeek.
</Tip>

## Myślenie i narzędzia

Sesje myślenia DeepSeek V4 mają bardziej rygorystyczny kontrakt odtwarzania niż większość
dostawców zgodnych z OpenAI: po tym, jak tura z włączonym myśleniem użyje narzędzi, DeepSeek
oczekuje, że odtwarzane wiadomości asystenta z tej tury będą zawierać
`reasoning_content` w kolejnych żądaniach. OpenClaw obsługuje to wewnątrz
Plugin DeepSeek, więc normalne wieloturowe użycie narzędzi działa z
`deepseek/deepseek-v4-flash` i `deepseek/deepseek-v4-pro`.

Jeśli przełączysz istniejącą sesję z innego dostawcy zgodnego z OpenAI na
model DeepSeek V4, starsze tury wywołań narzędzi asystenta mogą nie mieć natywnego
DeepSeek `reasoning_content`. OpenClaw uzupełnia to brakujące pole w odtwarzanych
wiadomościach asystenta dla żądań myślenia DeepSeek V4, aby dostawca mógł zaakceptować
historię bez wymagania `/new`.

Gdy myślenie jest wyłączone w OpenClaw (w tym wybór **None** w UI),
OpenClaw wysyła DeepSeek `thinking: { type: "disabled" }` i usuwa odtwarzane
`reasoning_content` z historii wychodzącej. Dzięki temu sesje z wyłączonym myśleniem
pozostają na ścieżce DeepSeek bez myślenia.

Użyj `deepseek/deepseek-v4-flash` jako domyślnej szybkiej ścieżki. Użyj
`deepseek/deepseek-v4-pro`, gdy chcesz mocniejszy model V4 i możesz zaakceptować
wyższy koszt lub większe opóźnienie.

## Testowanie na żywo

Bezpośredni zestaw modeli na żywo obejmuje DeepSeek V4 w nowoczesnym zestawie modeli. Aby
uruchomić tylko bezpośrednie testy modeli DeepSeek V4:

```bash
OPENCLAW_LIVE_PROVIDERS=deepseek \
OPENCLAW_LIVE_MODELS="deepseek/deepseek-v4-flash,deepseek/deepseek-v4-pro" \
pnpm test:live src/agents/models.profiles.live.test.ts
```

Ten test na żywo weryfikuje, że oba modele V4 mogą ukończyć odpowiedź oraz że kolejne tury
myślenia/narzędzi zachowują ładunek odtwarzania wymagany przez DeepSeek.

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

## Powiązane

<CardGroup cols={2}>
  <Card title="Model selection" href="/pl/concepts/model-providers" icon="layers">
    Wybieranie dostawców, referencji modeli i zachowania przełączania awaryjnego.
  </Card>
  <Card title="Configuration reference" href="/pl/gateway/configuration-reference" icon="gear">
    Pełna dokumentacja konfiguracji agentów, modeli i dostawców.
  </Card>
</CardGroup>
