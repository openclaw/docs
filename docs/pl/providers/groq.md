---
read_when:
    - Chcesz używać Groq z OpenClaw
    - Potrzebujesz zmiennej środowiskowej z kluczem API albo wyboru uwierzytelniania CLI
summary: Konfiguracja Groq (uwierzytelnianie + wybór modelu)
title: Groq
x-i18n:
    generated_at: "2026-04-30T10:13:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: ed612471939e7ac5362f8236f179d38ae07f9076709ff55020c1790f7c56a6fa
    source_path: providers/groq.md
    workflow: 16
---

[Groq](https://groq.com) zapewnia ultr szybką inferencję na modelach open-source
(Llama, Gemma, Mistral i innych) przy użyciu niestandardowego sprzętu LPU. OpenClaw łączy się
z Groq przez jego API zgodne z OpenAI.

| Właściwość | Wartość          |
| ---------- | ---------------- |
| Dostawca   | `groq`           |
| Uwierzytelnianie | `GROQ_API_KEY` |
| API        | zgodne z OpenAI  |

## Pierwsze kroki

<Steps>
  <Step title="Uzyskaj klucz API">
    Utwórz klucz API na [console.groq.com/keys](https://console.groq.com/keys).
  </Step>
  <Step title="Ustaw klucz API">
    ```bash
    export GROQ_API_KEY="gsk_..."
    ```
  </Step>
  <Step title="Ustaw model domyślny">
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

### Przykład pliku konfiguracyjnego

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

Katalog modeli Groq często się zmienia. Uruchom `openclaw models list | grep groq`,
aby zobaczyć aktualnie dostępne modele, albo sprawdź
[console.groq.com/docs/models](https://console.groq.com/docs/models).

| Model                       | Uwagi                              |
| --------------------------- | ---------------------------------- |
| **Llama 3.3 70B Versatile** | Ogólnego zastosowania, duży kontekst |
| **Llama 3.1 8B Instant**    | Szybki, lekki                      |
| **Gemma 2 9B**              | Kompaktowy, wydajny                |
| **Mixtral 8x7B**            | Architektura MoE, silne rozumowanie |

<Tip>
Użyj `openclaw models list --provider groq`, aby uzyskać najbardziej aktualną listę
modeli dostępnych na Twoim koncie.
</Tip>

## Modele rozumowania

OpenClaw mapuje swoje współdzielone poziomy `/think` na specyficzne dla modeli Groq
wartości `reasoning_effort`. Dla `qwen/qwen3-32b` wyłączone myślenie wysyła
`none`, a włączone myślenie wysyła `default`. W przypadku modeli rozumowania Groq GPT-OSS
OpenClaw wysyła `low`, `medium` albo `high`; przy wyłączonym myśleniu pomija
`reasoning_effort`, ponieważ te modele nie obsługują wartości wyłączenia.

## Transkrypcja audio

Groq zapewnia także szybką transkrypcję audio opartą na Whisper. Gdy jest skonfigurowany jako
dostawca rozumienia multimediów, OpenClaw używa modelu Groq `whisper-large-v3-turbo`
do transkrybowania wiadomości głosowych przez współdzieloną powierzchnię `tools.media.audio`.

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
  <Accordion title="Szczegóły transkrypcji audio">
    | Właściwość | Wartość |
    |----------|-------|
    | Ścieżka konfiguracji współdzielonej | `tools.media.audio` |
    | Domyślny bazowy URL | `https://api.groq.com/openai/v1` |
    | Domyślny model | `whisper-large-v3-turbo` |
    | Endpoint API | zgodny z OpenAI `/audio/transcriptions` |
  </Accordion>

  <Accordion title="Uwaga dotycząca środowiska">
    Jeśli Gateway działa jako daemon (launchd/systemd), upewnij się, że `GROQ_API_KEY` jest
    dostępny dla tego procesu (na przykład w `~/.openclaw/.env` lub przez
    `env.shellEnv`).

    <Warning>
    Klucze ustawione tylko w interaktywnej powłoce nie są widoczne dla procesów gateway
    zarządzanych przez daemon. Użyj konfiguracji `~/.openclaw/.env` albo `env.shellEnv`,
    aby zapewnić stałą dostępność.
    </Warning>

  </Accordion>
</AccordionGroup>

## Powiązane

<CardGroup cols={2}>
  <Card title="Wybór modelu" href="/pl/concepts/model-providers" icon="layers">
    Wybieranie dostawców, referencji modeli i zachowania przełączania awaryjnego.
  </Card>
  <Card title="Dokumentacja konfiguracji" href="/pl/gateway/configuration-reference" icon="gear">
    Pełny schemat konfiguracji, w tym ustawienia dostawców i audio.
  </Card>
  <Card title="Konsola Groq" href="https://console.groq.com" icon="arrow-up-right-from-square">
    Panel Groq, dokumentacja API i ceny.
  </Card>
  <Card title="Lista modeli Groq" href="https://console.groq.com/docs/models" icon="list">
    Oficjalny katalog modeli Groq.
  </Card>
</CardGroup>
