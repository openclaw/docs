---
read_when:
    - Chcesz używać Cerebras z OpenClaw
    - Potrzebujesz zmiennej środowiskowej klucza API Cerebras albo wyboru uwierzytelniania w CLI
summary: Konfiguracja Cerebras (uwierzytelnianie + wybór modelu)
title: Cerebras
x-i18n:
    generated_at: "2026-05-06T09:26:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6ba12fcc214ac756111a94f16ec619d26dc01ee2acc1eaef013fcb70bf752610
    source_path: providers/cerebras.md
    workflow: 16
---

[Cerebras](https://www.cerebras.ai) zapewnia szybkie wnioskowanie zgodne z OpenAI na niestandardowym sprzęcie do wnioskowania. OpenClaw zawiera dołączony Plugin dostawcy Cerebras ze statycznym katalogiem czterech modeli.

| Właściwość              | Wartość                                  |
| ----------------------- | ---------------------------------------- |
| Identyfikator dostawcy  | `cerebras`                               |
| Plugin                  | dołączony, `enabledByDefault: true`      |
| Zmienna env uwierzytelniania | `CEREBRAS_API_KEY`                  |
| Flaga onboardingu       | `--auth-choice cerebras-api-key`         |
| Bezpośrednia flaga CLI  | `--cerebras-api-key <key>`               |
| API                     | zgodne z OpenAI (`openai-completions`)   |
| Bazowy URL              | `https://api.cerebras.ai/v1`             |
| Model domyślny          | `cerebras/zai-glm-4.7`                   |

## Pierwsze kroki

<Steps>
  <Step title="Uzyskaj klucz API">
    Utwórz klucz API w [Cerebras Cloud Console](https://cloud.cerebras.ai).
  </Step>
  <Step title="Uruchom onboarding">
    <CodeGroup>

```bash Onboarding
openclaw onboard --auth-choice cerebras-api-key
```

```bash Direct flag
openclaw onboard --non-interactive \
  --auth-choice cerebras-api-key \
  --cerebras-api-key "$CEREBRAS_API_KEY"
```

```bash Env only
export CEREBRAS_API_KEY=csk-...
```

    </CodeGroup>

  </Step>
  <Step title="Sprawdź, czy modele są dostępne">
    ```bash
    openclaw models list --provider cerebras
    ```

    Lista powinna zawierać wszystkie cztery dołączone modele. Jeśli `CEREBRAS_API_KEY` nie zostanie rozwiązany, `openclaw models status --json` zgłosi brakujące poświadczenie w `auth.unusableProfiles`.

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

OpenClaw dostarcza statyczny katalog Cerebras, który odzwierciedla publiczny punkt końcowy zgodny z OpenAI. Wszystkie cztery modele mają kontekst 128k i maksymalnie 8192 tokeny wyjściowe.

| Ref modelu                                | Nazwa                | Rozumowanie | Uwagi                                      |
| ----------------------------------------- | -------------------- | ----------- | ------------------------------------------ |
| `cerebras/zai-glm-4.7`                    | Z.ai GLM 4.7         | tak         | Model domyślny; model rozumowania preview |
| `cerebras/gpt-oss-120b`                   | GPT OSS 120B         | tak         | Produkcyjny model rozumowania              |
| `cerebras/qwen-3-235b-a22b-instruct-2507` | Qwen 3 235B Instruct | nie         | Model preview bez rozumowania              |
| `cerebras/llama3.1-8b`                    | Llama 3.1 8B         | nie         | Produkcyjny model nastawiony na szybkość   |

<Warning>
  Cerebras oznacza `zai-glm-4.7` i `qwen-3-235b-a22b-instruct-2507` jako modele preview, a `llama3.1-8b` oraz `qwen-3-235b-a22b-instruct-2507` są udokumentowane jako przeznaczone do wycofania 27 maja 2026 r. Sprawdź stronę Cerebras z obsługiwanymi modelami, zanim zaczniesz polegać na nich w obciążeniach produkcyjnych.
</Warning>

## Konfiguracja ręczna

Dołączony Plugin zwykle oznacza, że potrzebujesz tylko klucza API. Użyj jawnej konfiguracji `models.providers.cerebras`, gdy chcesz nadpisać metadane modelu albo działać w `mode: "merge"` względem statycznego katalogu:

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
  Jeśli Gateway działa jako demon (launchd, systemd, Docker), upewnij się, że `CEREBRAS_API_KEY` jest dostępny dla tego procesu — na przykład w `~/.openclaw/.env` albo przez `env.shellEnv`. Klucz znajdujący się tylko w `~/.profile` nie pomoże usłudze zarządzanej, chyba że env zostanie zaimportowany osobno.
</Note>

## Powiązane

<CardGroup cols={2}>
  <Card title="Dostawcy modeli" href="/pl/concepts/model-providers" icon="layers">
    Wybór dostawców, refów modeli i zachowania przełączania awaryjnego.
  </Card>
  <Card title="Tryby myślenia" href="/pl/tools/thinking" icon="brain">
    Poziomy wysiłku rozumowania dla dwóch modeli Cerebras zdolnych do rozumowania.
  </Card>
  <Card title="Dokumentacja konfiguracji" href="/pl/gateway/config-agents#agent-defaults" icon="gear">
    Domyślne ustawienia agenta i konfiguracja modeli.
  </Card>
  <Card title="FAQ modeli" href="/pl/help/faq-models" icon="circle-question">
    Profile uwierzytelniania, przełączanie modeli i rozwiązywanie błędów „no profile”.
  </Card>
</CardGroup>
