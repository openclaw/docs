---
read_when:
    - Chcesz używać Meta z OpenClaw
    - Potrzebujesz zmiennej środowiskowej MODEL_API_KEY lub opcji uwierzytelniania w CLI
summary: Konfiguracja Meta (uwierzytelnianie + wybór modelu muse-spark-1.1)
title: Meta
x-i18n:
    generated_at: "2026-07-12T15:30:21Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f2ce7616d9abc14a2d15ee53ea7725d3e70059af1a38bb61dbfe5b3969106432
    source_path: providers/meta.md
    workflow: 16
---

**Meta API** korzysta ze zgodnego z OpenAI interfejsu **Responses API** (`POST /v1/responses`)
dla modelu rozumowania `muse-spark-1.1`. Dostawca jest dystrybuowany jako wbudowany
plugin OpenClaw.

| Właściwość                  | Wartość                            |
| --------------------------- | ---------------------------------- |
| Identyfikator dostawcy      | `meta`                             |
| Plugin                      | wbudowany dostawca                 |
| Zmienna środowiskowa uwierzytelniania | `MODEL_API_KEY`          |
| Flaga wdrażania             | `--auth-choice meta-api-key`       |
| Bezpośrednia flaga CLI      | `--meta-api-key <key>`             |
| API                         | Responses API (`openai-responses`) |
| Bazowy adres URL            | `https://api.meta.ai/v1`           |
| Model domyślny              | `meta/muse-spark-1.1`              |
| Domyślny poziom rozumowania | `high` (`reasoning.effort`)        |

## Pierwsze kroki

<Steps>
  <Step title="Ustaw klucz API">
    <CodeGroup>

```bash Onboarding
openclaw onboard --auth-choice meta-api-key
```

```bash Direct flag
openclaw onboard --non-interactive --accept-risk \
  --auth-choice meta-api-key \
  --meta-api-key "$MODEL_API_KEY"
```

```bash Env only
export MODEL_API_KEY=<key>
```

    </CodeGroup>

  </Step>
  <Step title="Sprawdź dostępność modeli">
    ```bash
    openclaw models list --provider meta
    ```

    Wyświetla statyczny wpis katalogu `muse-spark-1.1`. Jeśli nie można rozpoznać
    `MODEL_API_KEY`, polecenie `openclaw models status --json` zgłasza brakujące dane
    uwierzytelniające w `auth.unusableProfiles`.

  </Step>
</Steps>

## Konfiguracja nieinteraktywna

```bash
openclaw onboard --non-interactive --accept-risk \
  --mode local \
  --auth-choice meta-api-key \
  --meta-api-key "$MODEL_API_KEY"
```

## Wbudowany katalog

| Odwołanie do modelu   | Nazwa          | Rozumowanie | Okno kontekstu | Maks. wynik |
| --------------------- | -------------- | ----------- | -------------- | ----------- |
| `meta/muse-spark-1.1` | Muse Spark 1.1 | tak         | 1,048,576      | 131,072     |

Możliwości:

- Dane wejściowe w postaci tekstu i obrazów
- Wywoływanie narzędzi i strumieniowanie
- Poziom rozumowania: `minimal`, `low`, `medium`, `high`, `xhigh` (domyślnie: `high`)
- Bezstanowe odtwarzanie zaszyfrowanego rozumowania (`store: false`, `include: ["reasoning.encrypted_content"]`)

<Warning>
`muse-spark-1.1` nie akceptuje wartości `reasoning.effort: "none"`. OpenClaw mapuje
`--thinking off` na `minimal` dla tego dostawcy.
</Warning>

## Konfiguracja ręczna

```json5
{
  env: { MODEL_API_KEY: "<key>" },
  agents: {
    defaults: {
      model: { primary: "meta/muse-spark-1.1" },
      models: {
        "meta/muse-spark-1.1": { alias: "Muse Spark 1.1" },
      },
    },
  },
}
```

<Note>
Jeśli Gateway działa jako demon (launchd, systemd, Docker), upewnij się, że
`MODEL_API_KEY` jest dostępna dla tego procesu — na przykład w
`~/.openclaw/.env` lub przez `env.shellEnv`. Klucz wyeksportowany wyłącznie
w interaktywnej powłoce nie będzie dostępny dla zarządzanej usługi, chyba że
środowisko zostanie zaimportowane oddzielnie.
</Note>

## Test dymny

```bash
export MODEL_API_KEY=<key>
pnpm test:live -- extensions/meta/meta.live.test.ts
```

Testy na żywo używają modelu `muse-spark-1.1` z żądaniami do `POST /v1/responses`.

## Powiązane

<CardGroup cols={2}>
  <Card title="Dostawcy modeli" href="/pl/concepts/model-providers" icon="layers">
    Wybieranie dostawców, odwołań do modeli i sposobu przełączania awaryjnego.
  </Card>
  <Card title="Tryby myślenia" href="/pl/tools/thinking" icon="brain">
    Poziomy intensywności rozumowania dla modelu muse-spark-1.1.
  </Card>
  <Card title="Dokumentacja konfiguracji" href="/pl/gateway/config-agents#agent-defaults" icon="gear">
    Domyślne ustawienia agentów i konfiguracja modeli.
  </Card>
</CardGroup>
