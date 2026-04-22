---
read_when:
    - Chcesz jednego klucza API do wielu LLM-ów
    - Chcesz uruchamiać modele przez OpenRouter w OpenClaw
summary: Używaj zunifikowanego API OpenRouter, aby uzyskać dostęp do wielu modeli w OpenClaw
title: OpenRouter
x-i18n:
    generated_at: "2026-04-22T04:28:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3a8d1e6191d98e3f5284ebc77e0b8b855a04f3fbed09786d6125b622333ac807
    source_path: providers/openrouter.md
    workflow: 15
---

# OpenRouter

OpenRouter udostępnia **zunifikowane API**, które trasuje żądania do wielu modeli za jednym
endpointem i jednym kluczem API. Jest zgodne z OpenAI, więc większość SDK OpenAI działa po zmianie base URL.

## Pierwsze kroki

<Steps>
  <Step title="Pobierz swój klucz API">
    Utwórz klucz API na [openrouter.ai/keys](https://openrouter.ai/keys).
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

## Referencje modeli

<Note>
Referencje modeli mają postać `openrouter/<provider>/<model>`. Pełną listę
dostępnych providerów i modeli znajdziesz w [/concepts/model-providers](/pl/concepts/model-providers).
</Note>

Przykłady dołączonego fallbacku:

| Referencja modelu                    | Uwagi                         |
| ------------------------------------ | ----------------------------- |
| `openrouter/auto`                    | Automatyczne trasowanie OpenRouter |
| `openrouter/moonshotai/kimi-k2.6`    | Kimi K2.6 przez MoonshotAI    |
| `openrouter/openrouter/healer-alpha` | Trasa OpenRouter Healer Alpha |
| `openrouter/openrouter/hunter-alpha` | Trasa OpenRouter Hunter Alpha |

## Uwierzytelnianie i nagłówki

OpenRouter wewnętrznie używa tokenu Bearer z twoim kluczem API.

Przy rzeczywistych żądaniach OpenRouter (`https://openrouter.ai/api/v1`) OpenClaw dodaje również
udokumentowane nagłówki atrybucji aplikacji OpenRouter:

| Nagłówek                 | Wartość               |
| ------------------------ | --------------------- |
| `HTTP-Referer`           | `https://openclaw.ai` |
| `X-OpenRouter-Title`     | `OpenClaw`            |
| `X-OpenRouter-Categories` | `cli-agent`          |

<Warning>
Jeśli przekażesz providerowi OpenRouter inny proxy lub base URL, OpenClaw
**nie** wstrzykuje tych nagłówków specyficznych dla OpenRouter ani znaczników cache Anthropic.
</Warning>

## Uwagi zaawansowane

<AccordionGroup>
  <Accordion title="Znaczniki cache Anthropic">
    Na zweryfikowanych trasach OpenRouter referencje modeli Anthropic zachowują
    znaczniki `cache_control` specyficzne dla OpenRouter, których OpenClaw używa do
    lepszego ponownego wykorzystania prompt-cache dla bloków system/developer prompt.
  </Accordion>

  <Accordion title="Wstrzykiwanie thinking / reasoning">
    Na obsługiwanych trasach innych niż `auto` OpenClaw mapuje wybrany poziom myślenia na
    payloady reasoning proxy OpenRouter. Nieobsługiwane wskazówki modelu i
    `openrouter/auto` pomijają to wstrzykiwanie reasoning.
  </Accordion>

  <Accordion title="Kształtowanie żądań tylko dla OpenAI">
    OpenRouter nadal działa przez ścieżkę proxy w stylu zgodnym z OpenAI, więc
    natywne kształtowanie żądań specyficzne wyłącznie dla OpenAI, takie jak `serviceTier`, `store` w Responses,
    payloady reasoning-compat OpenAI i wskazówki prompt-cache, nie są przekazywane dalej.
  </Accordion>

  <Accordion title="Trasy oparte na Gemini">
    Referencje OpenRouter oparte na Gemini pozostają na ścieżce proxy-Gemini: OpenClaw zachowuje
    tam sanityzację sygnatur myśli Gemini, ale nie włącza natywnej
    walidacji replay Gemini ani przepisań bootstrapu.
  </Accordion>

  <Accordion title="Metadane trasowania providera">
    Jeśli przekażesz trasowanie providera OpenRouter w parametrach modelu, OpenClaw przekaże
    je jako metadane trasowania OpenRouter, zanim uruchomione zostaną współdzielone wrappery strumieni.
  </Accordion>
</AccordionGroup>

## Powiązane

<CardGroup cols={2}>
  <Card title="Wybór modelu" href="/pl/concepts/model-providers" icon="layers">
    Wybór providerów, referencji modeli i zachowania failover.
  </Card>
  <Card title="Dokumentacja konfiguracji" href="/pl/gateway/configuration-reference" icon="gear">
    Pełna dokumentacja konfiguracji agentów, modeli i providerów.
  </Card>
</CardGroup>
