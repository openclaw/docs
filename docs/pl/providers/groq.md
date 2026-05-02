---
read_when:
    - Chcesz używać Groq z OpenClaw
    - Potrzebujesz zmiennej środowiskowej klucza API albo opcji uwierzytelniania CLI
summary: Konfiguracja Groq (uwierzytelnianie + wybór modelu)
title: Groq
x-i18n:
    generated_at: "2026-05-02T10:00:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2cf6678047581a438906420894b250bafb68d71254fbaf30ea5dfcfc4799eac7
    source_path: providers/groq.md
    workflow: 16
---

[Groq](https://groq.com) zapewnia ultraszybkie wnioskowanie na modelach open-source
(Llama, Gemma, Mistral i innych) przy użyciu niestandardowego sprzętu LPU. OpenClaw łączy się
z Groq przez jego API zgodne z OpenAI.

| Właściwość | Wartość          |
| ---------- | ---------------- |
| Dostawca   | `groq`           |
| Uwierzytelnianie | `GROQ_API_KEY` |
| API        | zgodne z OpenAI  |

## Pierwsze kroki

<Steps>
  <Step title="Get an API key">
    Utwórz klucz API na [console.groq.com/keys](https://console.groq.com/keys).
  </Step>
  <Step title="Set the API key">
    ```bash
    export GROQ_API_KEY="gsk_..."
    ```
  </Step>
  <Step title="Set a default model">
    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "groq/llama-3.3-70b-versatile" },
        },
      },
    }
    ```
  </Step>
</Steps>

### Przykład pliku konfiguracji

```json5
{
  env: { GROQ_API_KEY: "gsk_..." },
  agents: {
    defaults: {
      model: { primary: "groq/llama-3.3-70b-versatile" },
    },
  },
}
```

## Wbudowany katalog

OpenClaw dostarcza katalog Groq oparty na manifeście, umożliwiający szybkie listowanie modeli
filtrowane według dostawcy. Uruchom `openclaw models list --all --provider groq`, aby zobaczyć dołączone
wiersze, albo sprawdź
[console.groq.com/docs/models](https://console.groq.com/docs/models).

| Model                       | Uwagi                              |
| --------------------------- | ---------------------------------- |
| **Llama 3.3 70B Versatile** | Ogólnego przeznaczenia, duży kontekst |
| **Llama 3.1 8B Instant**    | Szybki, lekki                      |
| **Gemma 2 9B**              | Kompaktowy, wydajny                |
| **Mixtral 8x7B**            | Architektura MoE, mocne rozumowanie |

<Tip>
Użyj `openclaw models list --all --provider groq`, aby wyświetlić oparte na manifeście wiersze Groq
znane tej wersji OpenClaw.
</Tip>

## Modele rozumowania

OpenClaw mapuje swoje współdzielone poziomy `/think` na specyficzne dla modelu Groq
wartości `reasoning_effort`. Dla `qwen/qwen3-32b` wyłączone myślenie wysyła
`none`, a włączone myślenie wysyła `default`. Dla modeli rozumowania Groq GPT-OSS
OpenClaw wysyła `low`, `medium` lub `high`; wyłączone myślenie pomija
`reasoning_effort`, ponieważ te modele nie obsługują wartości oznaczającej wyłączenie.

## Transkrypcja audio

Groq udostępnia także szybką transkrypcję audio opartą na Whisper. Gdy jest skonfigurowany jako
dostawca rozumienia mediów, OpenClaw używa modelu Groq `whisper-large-v3-turbo`
do transkrypcji wiadomości głosowych przez współdzieloną powierzchnię `tools.media.audio`.

```json5
{
  tools: {
    media: {
      audio: {
        models: [{ provider: "groq" }],
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Audio transcription details">
    | Właściwość | Wartość |
    |----------|-------|
    | Współdzielona ścieżka konfiguracji | `tools.media.audio` |
    | Domyślny bazowy URL | `https://api.groq.com/openai/v1` |
    | Domyślny model | `whisper-large-v3-turbo` |
    | Punkt końcowy API | zgodny z OpenAI `/audio/transcriptions` |
  </Accordion>

  <Accordion title="Environment note">
    Jeśli Gateway działa jako demon (launchd/systemd), upewnij się, że `GROQ_API_KEY` jest
    dostępny dla tego procesu (na przykład w `~/.openclaw/.env` albo przez
    `env.shellEnv`).

    <Warning>
    Klucze ustawione tylko w interaktywnej powłoce nie są widoczne dla procesów
    Gateway zarządzanych jako demony. Użyj konfiguracji `~/.openclaw/.env` albo `env.shellEnv`, aby zapewnić
    trwałą dostępność.
    </Warning>

  </Accordion>
</AccordionGroup>

## Powiązane

<CardGroup cols={2}>
  <Card title="Model selection" href="/pl/concepts/model-providers" icon="layers">
    Wybór dostawców, referencji modeli i zachowania przełączania awaryjnego.
  </Card>
  <Card title="Configuration reference" href="/pl/gateway/configuration-reference" icon="gear">
    Pełny schemat konfiguracji, w tym ustawienia dostawców i audio.
  </Card>
  <Card title="Groq Console" href="https://console.groq.com" icon="arrow-up-right-from-square">
    Panel Groq, dokumentacja API i ceny.
  </Card>
  <Card title="Groq model list" href="https://console.groq.com/docs/models" icon="list">
    Oficjalny katalog modeli Groq.
  </Card>
</CardGroup>
