---
read_when:
    - Chcesz używać Cohere z OpenClaw
    - Potrzebujesz zmiennej środowiskowej klucza API Cohere albo wyboru uwierzytelniania CLI
summary: Konfiguracja Cohere (uwierzytelnianie + wybór modelu)
title: Cohere
x-i18n:
    generated_at: "2026-06-27T18:11:32Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 76365a5d358bd5576d83a24d62ef30e203ee204bca90a2e50c56cc4c549b52af
    source_path: providers/cohere.md
    workflow: 16
---

[Cohere](https://cohere.com) zapewnia wnioskowanie zgodne z OpenAI przez swój Compatibility API. OpenClaw dostarcza dostawcę Cohere podczas przejścia na eksternalizację, a także publikuje go jako oficjalny zewnętrzny plugin z katalogiem modeli Command A.

| Właściwość                       | Wartość                                                  |
| -------------------------------- | -------------------------------------------------------- |
| Identyfikator dostawcy           | `cohere`                                                 |
| Plugin                           | dołączony w okresie przejściowym; oficjalny pakiet zewnętrzny |
| Zmienna środowiskowa uwierzytelniania | `COHERE_API_KEY`                                         |
| Flaga wdrożenia                  | `--auth-choice cohere-api-key`                           |
| Bezpośrednia flaga CLI           | `--cohere-api-key <key>`                                 |
| API                              | zgodne z OpenAI (`openai-completions`)                   |
| Bazowy adres URL                 | `https://api.cohere.ai/compatibility/v1`                 |
| Model domyślny                   | `cohere/command-a-03-2025`                               |

## Pierwsze kroki

1. Cohere jest zawarty w bieżących pakietach OpenClaw. Jeśli jest niedostępny, zainstaluj zewnętrzny pakiet i uruchom ponownie Gateway:

```bash
openclaw plugins install @openclaw/cohere-provider
openclaw gateway restart
```

2. Utwórz klucz API Cohere.
3. Uruchom wdrożenie:

```bash
openclaw onboard --non-interactive \
  --auth-choice cohere-api-key \
  --cohere-api-key "$COHERE_API_KEY"
```

4. Potwierdź, że katalog jest dostępny:

```bash
openclaw models list --provider cohere
```

Model domyślny jest ustawiany tylko wtedy, gdy nie skonfigurowano jeszcze modelu podstawowego.

## Konfiguracja tylko przez środowisko

Udostępnij `COHERE_API_KEY` procesowi Gateway, a następnie wybierz model Cohere:

```json5
{
  agents: {
    defaults: {
      model: { primary: "cohere/command-a-03-2025" },
    },
  },
}
```

<Note>
Jeśli Gateway działa jako demon lub w Dockerze, skonfiguruj `COHERE_API_KEY` dla tej usługi. Wyeksportowanie go tylko w interaktywnej powłoce nie udostępnia go już uruchomionemu Gateway.
</Note>

## Powiązane

- [Dostawcy modeli](/pl/concepts/model-providers)
- [CLI modeli](/pl/cli/models)
- [Katalog dostawców](/pl/providers)
