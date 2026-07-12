---
read_when:
    - Chcesz używać Cerebras z OpenClaw
    - Potrzebujesz zmiennej środowiskowej z kluczem API Cerebras lub opcji uwierzytelniania w CLI
summary: Konfiguracja Cerebras (uwierzytelnianie + wybór modelu)
title: Cerebras
x-i18n:
    generated_at: "2026-07-12T15:31:19Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fca8110d345c796f0481ebf1a8d85c2cc9630b8bd55db8d4bf60772151b35b37
    source_path: providers/cerebras.md
    workflow: 16
---

[Cerebras](https://www.cerebras.ai) zapewnia szybkie wnioskowanie zgodne z OpenAI na niestandardowym sprzęcie do wnioskowania. Plugin zawiera statyczny katalog czterech modeli (bez wykrywania na żywo).

| Właściwość                    | Wartość                                                   |
| ----------------------------- | --------------------------------------------------------- |
| Identyfikator dostawcy        | `cerebras`                                                |
| Plugin                        | oficjalny pakiet zewnętrzny (`@openclaw/cerebras-provider`) |
| Zmienna środowiskowa uwierzytelniania | `CEREBRAS_API_KEY`                              |
| Flaga wdrażania               | `--auth-choice cerebras-api-key`                          |
| Bezpośrednia flaga CLI        | `--cerebras-api-key <key>`                                |
| API                           | zgodne z OpenAI (`openai-completions`)                    |
| Bazowy adres URL              | `https://api.cerebras.ai/v1`                              |
| Model domyślny                | `cerebras/zai-glm-4.7`                                    |

## Instalowanie pluginu

```bash
openclaw plugins install @openclaw/cerebras-provider
openclaw gateway restart
```

## Pierwsze kroki

<Steps>
  <Step title="Uzyskaj klucz API">
    Utwórz klucz API w [konsoli Cerebras Cloud](https://cloud.cerebras.ai).
  </Step>
  <Step title="Uruchom wdrażanie">
    <CodeGroup>

```bash Wdrażanie
openclaw onboard --auth-choice cerebras-api-key
```

```bash Flaga bezpośrednia
openclaw onboard --non-interactive \
  --auth-choice cerebras-api-key \
  --cerebras-api-key "$CEREBRAS_API_KEY"
```

```bash Tylko zmienna środowiskowa
export CEREBRAS_API_KEY=csk-...
```

    </CodeGroup>

  </Step>
  <Step title="Sprawdź dostępność modeli">
    ```bash
    openclaw models list --provider cerebras
    ```

    Wyświetla wszystkie cztery modele statyczne. Jeśli nie można rozpoznać `CEREBRAS_API_KEY`, polecenie `openclaw models status --json` zgłasza brakujące dane uwierzytelniające w `auth.unusableProfiles`.

  </Step>
</Steps>

## Konfiguracja nieinteraktywna

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice cerebras-api-key \
  --cerebras-api-key "$CEREBRAS_API_KEY"
```

## Wbudowany katalog

Wszystkie cztery modele mają okno kontekstu 128 tys. tokenów i maksymalnie 8192 tokeny wyjściowe.

| Odwołanie do modelu                       | Nazwa                | Rozumowanie | Uwagi                                             |
| ----------------------------------------- | -------------------- | ----------- | ------------------------------------------------- |
| `cerebras/zai-glm-4.7`                    | Z.ai GLM 4.7         | tak         | Model domyślny; model rozumowania w wersji zapoznawczej |
| `cerebras/gpt-oss-120b`                   | GPT OSS 120B         | tak         | Produkcyjny model rozumowania                     |
| `cerebras/qwen-3-235b-a22b-instruct-2507` | Qwen 3 235B Instruct | nie         | Model bez rozumowania w wersji zapoznawczej       |
| `cerebras/llama3.1-8b`                    | Llama 3.1 8B         | nie         | Produkcyjny model zoptymalizowany pod kątem szybkości |

<Warning>
Cerebras oznacza modele `zai-glm-4.7` i `qwen-3-235b-a22b-instruct-2507` jako wersje zapoznawcze, a wycofanie modeli `llama3.1-8b` oraz `qwen-3-235b-a22b-instruct-2507` jest zgodnie z dokumentacją planowane na 27 maja 2026 r. Przed wykorzystaniem ich w obciążeniach produkcyjnych sprawdź [stronę obsługiwanych modeli](https://inference-docs.cerebras.ai/models/overview) Cerebras.
</Warning>

## Konfiguracja ręczna

W większości konfiguracji potrzebny jest tylko klucz API. Użyj jawnej konfiguracji `models.providers.cerebras`, aby zastąpić metadane modeli lub użyć `mode: "merge"` ze statycznym katalogiem:

```json5
{
  env: { CEREBRAS_API_KEY: "csk-..." },
  agents: {
    defaults: {
      model: { primary: "cerebras/zai-glm-4.7" },
    },
  },
  models: {
    mode: "merge",
    providers: {
      cerebras: {
        baseUrl: "https://api.cerebras.ai/v1",
        apiKey: "${CEREBRAS_API_KEY}",
        api: "openai-completions",
        models: [
          { id: "zai-glm-4.7", name: "Z.ai GLM 4.7" },
          { id: "gpt-oss-120b", name: "GPT OSS 120B" },
        ],
      },
    },
  },
}
```

<Note>
Jeśli Gateway działa jako demon (launchd, systemd, Docker), upewnij się, że zmienna `CEREBRAS_API_KEY` jest dostępna dla tego procesu — na przykład w pliku `~/.openclaw/.env` lub przez `env.shellEnv`. Klucz wyeksportowany wyłącznie w interaktywnej powłoce nie będzie dostępny dla zarządzanej usługi, chyba że środowisko zostanie zaimportowane osobno.
</Note>

## Powiązane

<CardGroup cols={2}>
  <Card title="Dostawcy modeli" href="/pl/concepts/model-providers" icon="layers">
    Wybieranie dostawców, odwołań do modeli i sposobu przełączania awaryjnego.
  </Card>
  <Card title="Tryby myślenia" href="/pl/tools/thinking" icon="brain">
    Poziomy intensywności rozumowania dla dwóch modeli Cerebras obsługujących rozumowanie.
  </Card>
  <Card title="Dokumentacja konfiguracji" href="/pl/gateway/config-agents#agent-defaults" icon="gear">
    Wartości domyślne agentów i konfiguracja modeli.
  </Card>
  <Card title="Często zadawane pytania dotyczące modeli" href="/pl/help/faq-models" icon="circle-question">
    Profile uwierzytelniania, przełączanie modeli i rozwiązywanie błędów „brak profilu”.
  </Card>
</CardGroup>
