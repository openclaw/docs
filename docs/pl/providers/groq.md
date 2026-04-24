---
read_when:
    - Chcesz używać Groq z OpenClaw
    - Potrzebujesz zmiennej środowiskowej z kluczem API albo wyboru uwierzytelniania w CLI
summary: Konfiguracja Groq (uwierzytelnianie + wybór modelu)
title: Groq
x-i18n:
    generated_at: "2026-04-24T09:27:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1c711297d42dea7fabe8ba941f75ef9dc82bd9b838f78d5dc4385210d9f65ade
    source_path: providers/groq.md
    workflow: 15
---

[Groq](https://groq.com) zapewnia ultraszybkie wnioskowanie na modelach open-source
(Llama, Gemma, Mistral i innych) przy użyciu własnego sprzętu LPU. OpenClaw łączy się
z Groq przez jego API kompatybilne z OpenAI.

| Właściwość | Wartość          |
| ---------- | ---------------- |
| Provider   | `groq`           |
| Auth       | `GROQ_API_KEY`   |
| API        | kompatybilne z OpenAI |

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
| **Llama 3.3 70B Versatile** | Ogólnego przeznaczenia, duży kontekst |
| **Llama 3.1 8B Instant**    | Szybki, lekki                      |
| **Gemma 2 9B**              | Kompaktowy, wydajny                |
| **Mixtral 8x7B**            | Architektura MoE, mocne rozumowanie |

<Tip>
Użyj `openclaw models list --provider groq`, aby uzyskać najbardziej aktualną listę
modeli dostępnych na Twoim koncie.
</Tip>

## Transkrypcja audio

Groq zapewnia także szybką transkrypcję audio opartą na Whisper. Gdy jest skonfigurowany jako
provider rozumienia mediów, OpenClaw używa modelu `whisper-large-v3-turbo`
od Groq do transkrypcji wiadomości głosowych przez współdzieloną powierzchnię `tools.media.audio`.

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
    | Współdzielona ścieżka konfiguracji | `tools.media.audio` |
    | Domyślny base URL   | `https://api.groq.com/openai/v1` |
    | Domyślny model      | `whisper-large-v3-turbo` |
    | Endpoint API        | kompatybilny z OpenAI `/audio/transcriptions` |
  </Accordion>

  <Accordion title="Uwaga o środowisku">
    Jeśli Gateway działa jako daemon (launchd/systemd), upewnij się, że `GROQ_API_KEY` jest
    dostępne dla tego procesu (na przykład w `~/.openclaw/.env` albo przez
    `env.shellEnv`).

    <Warning>
    Klucze ustawione tylko w interaktywnej powłoce nie są widoczne dla procesów
    gateway zarządzanych przez daemon. Użyj `~/.openclaw/.env` albo konfiguracji `env.shellEnv`, aby
    zapewnić trwałą dostępność.
    </Warning>

  </Accordion>
</AccordionGroup>

## Powiązane

<CardGroup cols={2}>
  <Card title="Model selection" href="/pl/concepts/model-providers" icon="layers">
    Wybór providerów, referencji modeli i zachowania failover.
  </Card>
  <Card title="Configuration reference" href="/pl/gateway/configuration-reference" icon="gear">
    Pełny schemat konfiguracji, w tym ustawienia providera i audio.
  </Card>
  <Card title="Groq Console" href="https://console.groq.com" icon="arrow-up-right-from-square">
    Panel Groq, dokumentacja API i cennik.
  </Card>
  <Card title="Groq model list" href="https://console.groq.com/docs/models" icon="list">
    Oficjalny katalog modeli Groq.
  </Card>
</CardGroup>
