---
read_when:
    - Chcesz używać DeepSeek z OpenClaw
    - Potrzebujesz zmiennej środowiskowej klucza API lub wyboru uwierzytelniania CLI
summary: Konfiguracja DeepSeek (uwierzytelnianie + wybór modelu)
title: DeepSeek
x-i18n:
    generated_at: "2026-04-30T10:12:54Z"
    model: gpt-5.5
    provider: openai
    source_hash: e84d989a7cba8d259779ac02293718050ce51efe6ce2bdbfacb9e22bbfd294ef
    source_path: providers/deepseek.md
    workflow: 16
---

[DeepSeek](https://www.deepseek.com) udostępnia zaawansowane modele AI z API zgodnym z OpenAI.

| Właściwość | Wartość                   |
| ---------- | ------------------------- |
| Dostawca   | `deepseek`                |
| Auth       | `DEEPSEEK_API_KEY`        |
| API        | Zgodne z OpenAI           |
| Bazowy URL | `https://api.deepseek.com` |

## Pierwsze kroki

<Steps>
  <Step title="Uzyskaj klucz API">
    Utwórz klucz API na [platform.deepseek.com](https://platform.deepseek.com/api_keys).
  </Step>
  <Step title="Uruchom onboarding">
    ```bash
    openclaw onboard --auth-choice deepseek-api-key
    ```

    To wyświetli monit o klucz API i ustawi `deepseek/deepseek-v4-flash` jako model domyślny.

  </Step>
  <Step title="Sprawdź, czy modele są dostępne">
    ```bash
    openclaw models list --provider deepseek
    ```

    Aby sprawdzić dołączony statyczny katalog bez konieczności działania Gateway,
    użyj:

    ```bash
    openclaw models list --all --provider deepseek
    ```

  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Konfiguracja nieinteraktywna">
    W przypadku instalacji skryptowych lub bez interfejsu użytkownika przekaż wszystkie flagi bezpośrednio:

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
jest dostępny dla tego procesu (na przykład w `~/.openclaw/.env` lub przez
`env.shellEnv`).
</Warning>

## Wbudowany katalog

| Odwołanie do modelu          | Nazwa             | Wejście | Kontekst | Maks. wyjście | Uwagi                                      |
| ---------------------------- | ----------------- | ------- | -------- | ------------- | ------------------------------------------ |
| `deepseek/deepseek-v4-flash` | DeepSeek V4 Flash | text    | 1,000,000 | 384,000      | Model domyślny; powierzchnia V4 z obsługą myślenia |
| `deepseek/deepseek-v4-pro`   | DeepSeek V4 Pro   | text    | 1,000,000 | 384,000      | Powierzchnia V4 z obsługą myślenia         |
| `deepseek/deepseek-chat`     | DeepSeek Chat     | text    | 131,072  | 8,192         | Powierzchnia DeepSeek V3.2 bez myślenia    |
| `deepseek/deepseek-reasoner` | DeepSeek Reasoner | text    | 131,072  | 65,536        | Powierzchnia V3.2 z włączonym rozumowaniem |

<Tip>
Modele V4 obsługują sterowanie `thinking` DeepSeek. OpenClaw odtwarza także
DeepSeek `reasoning_content` w kolejnych turach, dzięki czemu sesje myślenia z wywołaniami
narzędzi mogą być kontynuowane.
</Tip>

## Myślenie i narzędzia

Sesje myślenia DeepSeek V4 mają bardziej rygorystyczną umowę odtwarzania niż większość
dostawców zgodnych z OpenAI: po tym, jak tura z włączonym myśleniem użyje narzędzi, DeepSeek
oczekuje, że odtworzone wiadomości asystenta z tej tury będą zawierać
`reasoning_content` w kolejnych żądaniach. OpenClaw obsługuje to wewnątrz
Plugin DeepSeek, więc normalne wieloturowe użycie narzędzi działa z
`deepseek/deepseek-v4-flash` i `deepseek/deepseek-v4-pro`.

Jeśli przełączysz istniejącą sesję z innego dostawcy zgodnego z OpenAI na
model DeepSeek V4, starsze tury wywołań narzędzi asystenta mogą nie mieć natywnego
DeepSeek `reasoning_content`. OpenClaw uzupełnia to brakujące pole w odtwarzanych
wiadomościach asystenta dla żądań myślenia DeepSeek V4, aby dostawca mógł zaakceptować
historię bez konieczności użycia `/new`.

Gdy myślenie jest wyłączone w OpenClaw (w tym przez wybór **None** w UI),
OpenClaw wysyła DeepSeek `thinking: { type: "disabled" }` i usuwa odtworzone
`reasoning_content` z wychodzącej historii. Dzięki temu sesje z wyłączonym myśleniem
pozostają na ścieżce DeepSeek bez myślenia.

Użyj `deepseek/deepseek-v4-flash` jako domyślnej szybkiej ścieżki. Użyj
`deepseek/deepseek-v4-pro`, gdy chcesz mocniejszego modelu V4 i akceptujesz
wyższy koszt lub opóźnienie.

## Testowanie na żywo

Bezpośredni zestaw modeli na żywo obejmuje DeepSeek V4 w nowoczesnym zestawie modeli. Aby
uruchomić tylko bezpośrednie sprawdzenia modeli DeepSeek V4:

```bash
OPENCLAW_LIVE_PROVIDERS=deepseek \
OPENCLAW_LIVE_MODELS="deepseek/deepseek-v4-flash,deepseek/deepseek-v4-pro" \
pnpm test:live src/agents/models.profiles.live.test.ts
```

To sprawdzenie na żywo weryfikuje, że oba modele V4 mogą się zakończyć oraz że kolejne
tury myślenia/narzędzi zachowują ładunek odtwarzania wymagany przez DeepSeek.

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
  <Card title="Wybór modelu" href="/pl/concepts/model-providers" icon="layers">
    Wybieranie dostawców, odwołań do modeli i zachowania przełączania awaryjnego.
  </Card>
  <Card title="Dokumentacja konfiguracji" href="/pl/gateway/configuration-reference" icon="gear">
    Pełna dokumentacja konfiguracji agentów, modeli i dostawców.
  </Card>
</CardGroup>
