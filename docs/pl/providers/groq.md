---
read_when:
    - Chcesz używać Groq z OpenClaw
    - Potrzebujesz zmiennej środowiskowej klucza API albo wyboru auth w CLI
summary: Konfiguracja Groq (auth + wybór modelu)
title: Groq
x-i18n:
    generated_at: "2026-04-05T14:03:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7e27532cafcdaf1ac336fa310e08e4e3245d2d0eb0e94e0bcf42c532c6a9a80b
    source_path: providers/groq.md
    workflow: 15
---

# Groq

[Groq](https://groq.com) zapewnia ultraszybką inferencję na modelach open-source
(Llama, Gemma, Mistral i innych) przy użyciu własnego sprzętu LPU. OpenClaw łączy
się z Groq przez jego API zgodne z OpenAI.

- Dostawca: `groq`
- Auth: `GROQ_API_KEY`
- API: zgodne z OpenAI

## Szybki start

1. Pobierz klucz API z [console.groq.com/keys](https://console.groq.com/keys).

2. Ustaw klucz API:

```bash
export GROQ_API_KEY="gsk_..."
```

3. Ustaw model domyślny:

```json5
{
  agents: {
    defaults: {
      model: { primary: "groq/llama-3.3-70b-versatile" },
    },
  },
}
```

## Przykład pliku konfiguracyjnego

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

## Transkrypcja audio

Groq zapewnia także szybką transkrypcję audio opartą na Whisper. Gdy jest skonfigurowany jako dostawca
media-understanding, OpenClaw używa modelu `whisper-large-v3-turbo` Groq
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

## Uwaga dotycząca środowiska

Jeśli Gateway działa jako daemon (launchd/systemd), upewnij się, że `GROQ_API_KEY`
jest dostępne dla tego procesu (na przykład w `~/.openclaw/.env` albo przez
`env.shellEnv`).

## Uwagi o audio

- Współdzielona ścieżka konfiguracji: `tools.media.audio`
- Domyślny podstawowy URL audio Groq: `https://api.groq.com/openai/v1`
- Domyślny model audio Groq: `whisper-large-v3-turbo`
- Transkrypcja audio Groq używa zgodnej z OpenAI ścieżki `/audio/transcriptions`

## Dostępne modele

Katalog modeli Groq często się zmienia. Uruchom `openclaw models list | grep groq`,
aby zobaczyć aktualnie dostępne modele, albo sprawdź
[console.groq.com/docs/models](https://console.groq.com/docs/models).

Popularne opcje obejmują:

- **Llama 3.3 70B Versatile** - ogólnego przeznaczenia, duży kontekst
- **Llama 3.1 8B Instant** - szybki, lekki
- **Gemma 2 9B** - kompaktowy, wydajny
- **Mixtral 8x7B** - architektura MoE, mocne reasoning

## Linki

- [Groq Console](https://console.groq.com)
- [Dokumentacja API](https://console.groq.com/docs)
- [Lista modeli](https://console.groq.com/docs/models)
- [Cennik](https://groq.com/pricing)
