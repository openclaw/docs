---
read_when:
    - Chcesz jednego klucza API do wielu LLM-ów
    - Chcesz uruchamiać modele przez OpenRouter w OpenClaw
    - Chcesz używać OpenRouter do generowania obrazów
summary: Używaj zunifikowanego API OpenRouter, aby uzyskać dostęp do wielu modeli w OpenClaw
title: OpenRouter
x-i18n:
    generated_at: "2026-04-24T09:28:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7516910f67a8adfb107d07cadd73c34ddd110422ecb90278025d4d6344937aac
    source_path: providers/openrouter.md
    workflow: 15
---

OpenRouter udostępnia **zunifikowane API**, które kieruje żądania do wielu modeli za jednym
punktem końcowym i kluczem API. Jest zgodne z OpenAI, więc większość SDK OpenAI działa po zmianie podstawowego adresu URL.

## Pierwsze kroki

<Steps>
  <Step title="Uzyskaj klucz API">
    Utwórz klucz API na stronie [openrouter.ai/keys](https://openrouter.ai/keys).
  </Step>
  <Step title="Uruchom onboarding">
    ```bash
    openclaw onboard --auth-choice openrouter-api-key
    ```
  </Step>
  <Step title="(Opcjonalnie) Przełącz na konkretny model">
    Onboarding domyślnie ustawia `openrouter/auto`. Później wybierz konkretny model:

    ```bash
    openclaw models set openrouter/<provider>/<model>
    ```

  </Step>
</Steps>

## Przykład konfiguracji

```json5
{
  env: { OPENROUTER_API_KEY: "sk-or-..." },
  agents: {
    defaults: {
      model: { primary: "openrouter/auto" },
    },
  },
}
```

## Odwołania do modeli

<Note>
Odwołania do modeli mają postać `openrouter/<provider>/<model>`. Pełną listę
dostępnych dostawców i modeli znajdziesz w [/concepts/model-providers](/pl/concepts/model-providers).
</Note>

Przykłady dołączonych fallbacków:

| Odwołanie do modelu                 | Uwagi                           |
| ----------------------------------- | ------------------------------- |
| `openrouter/auto`                   | Automatyczne trasowanie OpenRouter |
| `openrouter/moonshotai/kimi-k2.6`   | Kimi K2.6 przez MoonshotAI      |
| `openrouter/openrouter/healer-alpha` | Trasa OpenRouter Healer Alpha  |
| `openrouter/openrouter/hunter-alpha` | Trasa OpenRouter Hunter Alpha  |

## Generowanie obrazów

OpenRouter może także obsługiwać narzędzie `image_generate`. Użyj modelu obrazów OpenRouter w `agents.defaults.imageGenerationModel`:

```json5
{
  env: { OPENROUTER_API_KEY: "sk-or-..." },
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "openrouter/google/gemini-3.1-flash-image-preview",
      },
    },
  },
}
```

OpenClaw wysyła żądania obrazów do API obrazów chat completions OpenRouter z `modalities: ["image", "text"]`. Modele obrazów Gemini otrzymują obsługiwane wskazówki `aspectRatio` i `resolution` przez `image_config` OpenRouter.

## Uwierzytelnianie i nagłówki

OpenRouter używa pod maską tokena Bearer z Twoim kluczem API.

W przypadku rzeczywistych żądań OpenRouter (`https://openrouter.ai/api/v1`) OpenClaw dodaje także
udokumentowane nagłówki atrybucji aplikacji OpenRouter:

| Nagłówek                 | Wartość               |
| ------------------------ | --------------------- |
| `HTTP-Referer`           | `https://openclaw.ai` |
| `X-OpenRouter-Title`     | `OpenClaw`            |
| `X-OpenRouter-Categories` | `cli-agent`          |

<Warning>
Jeśli przekierujesz dostawcę OpenRouter na inny proxy lub podstawowy adres URL, OpenClaw
**nie** wstrzykuje tych specyficznych dla OpenRouter nagłówków ani znaczników cache Anthropic.
</Warning>

## Konfiguracja zaawansowana

<AccordionGroup>
  <Accordion title="Znaczniki cache Anthropic">
    Na zweryfikowanych trasach OpenRouter odwołania do modeli Anthropic zachowują
    specyficzne dla OpenRouter znaczniki Anthropic `cache_control`, których OpenClaw używa do
    lepszego ponownego wykorzystania prompt-cache dla bloków promptów systemowych/deweloperskich.
  </Accordion>

  <Accordion title="Wstrzykiwanie myślenia / rozumowania">
    Na obsługiwanych trasach innych niż `auto` OpenClaw mapuje wybrany poziom myślenia na
    ładunki rozumowania proxy OpenRouter. Nieobsługiwane wskazówki modelu i
    `openrouter/auto` pomijają to wstrzykiwanie rozumowania.
  </Accordion>

  <Accordion title="Kształtowanie żądań tylko dla OpenAI">
    OpenRouter nadal działa przez ścieżkę zgodną z OpenAI w stylu proxy, więc
    natywne kształtowanie żądań tylko dla OpenAI, takie jak `serviceTier`, `store` w Responses,
    ładunki zgodności rozumowania OpenAI i wskazówki prompt-cache, nie jest przekazywane dalej.
  </Accordion>

  <Accordion title="Trasy oparte na Gemini">
    Odwołania OpenRouter oparte na Gemini pozostają na ścieżce proxy-Gemini: OpenClaw zachowuje tam
    sanityzację sygnatur myślenia Gemini, ale nie włącza natywnej walidacji replay Gemini
    ani przepisania bootstrap.
  </Accordion>

  <Accordion title="Metadane trasowania dostawcy">
    Jeśli przekażesz trasowanie dostawcy OpenRouter w parametrach modelu, OpenClaw przekaże
    je jako metadane trasowania OpenRouter, zanim uruchomią się współdzielone wrappery strumienia.
  </Accordion>
</AccordionGroup>

## Powiązane

<CardGroup cols={2}>
  <Card title="Wybór modelu" href="/pl/concepts/model-providers" icon="layers">
    Wybieranie dostawców, odwołań do modeli i zachowania failover.
  </Card>
  <Card title="Informacje o konfiguracji" href="/pl/gateway/configuration-reference" icon="gear">
    Pełne informacje o konfiguracji agentów, modeli i dostawców.
  </Card>
</CardGroup>
