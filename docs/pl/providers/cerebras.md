---
read_when:
    - Chcesz używać Cerebras z OpenClaw
    - Potrzebujesz zmiennej środowiskowej klucza API Cerebras albo wyboru uwierzytelniania CLI
summary: Konfiguracja Cerebras (uwierzytelnianie + wybór modelu)
title: Cerebras
x-i18n:
    generated_at: "2026-06-27T18:10:40Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cd21756ac521c7b60ca6d3dfbef8665574dca52d1a25e6293169b24f4af6273e
    source_path: providers/cerebras.md
    workflow: 16
---

[Cerebras](https://www.cerebras.ai) zapewnia szybkie wnioskowanie zgodne z OpenAI na niestandardowym sprzęcie do wnioskowania. Plugin dostawcy Cerebras zawiera statyczny katalog czterech modeli.

| Właściwość                 | Wartość                                  |
| -------------------------- | ---------------------------------------- |
| Identyfikator dostawcy     | `cerebras`                               |
| Plugin                     | oficjalny pakiet zewnętrzny              |
| Zmienna środowiskowa auth  | `CEREBRAS_API_KEY`                       |
| Flaga wdrażania            | `--auth-choice cerebras-api-key`         |
| Bezpośrednia flaga CLI     | `--cerebras-api-key <key>`               |
| API                        | zgodne z OpenAI (`openai-completions`)   |
| Bazowy URL                 | `https://api.cerebras.ai/v1`             |
| Model domyślny             | `cerebras/zai-glm-4.7`                   |

## Zainstaluj Plugin

Zainstaluj oficjalny Plugin, a następnie uruchom ponownie Gateway:

```bash
openclaw plugins install @openclaw/cerebras-provider
openclaw gateway restart
```

## Pierwsze kroki

<Steps>
  <Step title="Uzyskaj klucz API">
    Utwórz klucz API w [Cerebras Cloud Console](https://cloud.cerebras.ai).
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

```bash Tylko env
export CEREBRAS_API_KEY=csk-...
```

    </CodeGroup>

  </Step>
  <Step title="Sprawdź, czy modele są dostępne">
    ```bash
    openclaw models list --provider cerebras
    ```

    Lista powinna zawierać wszystkie cztery statyczne modele. Jeśli `CEREBRAS_API_KEY` nie zostanie rozpoznany, `openclaw models status --json` zgłosi brakujące poświadczenie w `auth.unusableProfiles`.

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

OpenClaw zawiera statyczny katalog Cerebras, który odzwierciedla publiczny endpoint zgodny z OpenAI. Wszystkie cztery modele współdzielą kontekst 128k i 8192 tokeny maksymalnego wyjścia.

| Odwołanie do modelu                       | Nazwa                | Rozumowanie | Uwagi                                          |
| ----------------------------------------- | -------------------- | ----------- | ---------------------------------------------- |
| `cerebras/zai-glm-4.7`                    | Z.ai GLM 4.7         | tak         | Model domyślny; model rozumowania w wersji preview |
| `cerebras/gpt-oss-120b`                   | GPT OSS 120B         | tak         | Produkcyjny model rozumowania                  |
| `cerebras/qwen-3-235b-a22b-instruct-2507` | Qwen 3 235B Instruct | nie         | Model bez rozumowania w wersji preview         |
| `cerebras/llama3.1-8b`                    | Llama 3.1 8B         | nie         | Model produkcyjny skoncentrowany na szybkości  |

<Warning>
  Cerebras oznacza `zai-glm-4.7` i `qwen-3-235b-a22b-instruct-2507` jako modele preview, a `llama3.1-8b` oraz `qwen-3-235b-a22b-instruct-2507` są udokumentowane jako przeznaczone do wycofania 27 maja 2026 r. Przed użyciem ich w obciążeniach produkcyjnych sprawdź stronę obsługiwanych modeli Cerebras.
</Warning>

## Konfiguracja ręczna

Plugin zwykle oznacza, że potrzebujesz tylko klucza API. Użyj jawnej konfiguracji `models.providers.cerebras`, gdy chcesz nadpisać metadane modeli albo działać w `mode: "merge"` względem statycznego katalogu:

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
  Jeśli Gateway działa jako demon (launchd, systemd, Docker), upewnij się, że `CEREBRAS_API_KEY` jest dostępny dla tego procesu — na przykład w `~/.openclaw/.env` albo przez `env.shellEnv`. Klucz wyeksportowany tylko w interaktywnej powłoce nie pomoże zarządzanej usłudze, chyba że env zostanie zaimportowany oddzielnie.
</Note>

## Powiązane

<CardGroup cols={2}>
  <Card title="Dostawcy modeli" href="/pl/concepts/model-providers" icon="layers">
    Wybór dostawców, odwołań do modeli i zachowania przełączania awaryjnego.
  </Card>
  <Card title="Tryby myślenia" href="/pl/tools/thinking" icon="brain">
    Poziomy wysiłku rozumowania dla dwóch modeli Cerebras obsługujących rozumowanie.
  </Card>
  <Card title="Dokumentacja konfiguracji" href="/pl/gateway/config-agents#agent-defaults" icon="gear">
    Domyślne ustawienia agenta i konfiguracja modeli.
  </Card>
  <Card title="FAQ modeli" href="/pl/help/faq-models" icon="circle-question">
    Profile auth, przełączanie modeli i rozwiązywanie błędów „no profile”.
  </Card>
</CardGroup>
