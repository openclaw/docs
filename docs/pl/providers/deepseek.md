---
read_when:
    - Chcesz używać DeepSeek z OpenClaw
    - Potrzebujesz zmiennej środowiskowej klucza API lub opcji uwierzytelniania CLI
summary: Konfiguracja DeepSeek (uwierzytelnianie + wybór modelu)
title: DeepSeek
x-i18n:
    generated_at: "2026-04-24T09:27:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: ead407c67c05bd8700db1cba36defdd9d47bdc9a071c76a07c4b4fb82f6b80e2
    source_path: providers/deepseek.md
    workflow: 15
---

[DeepSeek](https://www.deepseek.com) udostępnia wydajne modele AI z interfejsem API zgodnym z OpenAI.

| Właściwość | Wartość                    |
| ---------- | -------------------------- |
| Dostawca   | `deepseek`                 |
| Uwierzytelnianie | `DEEPSEEK_API_KEY`   |
| API        | Zgodne z OpenAI            |
| Base URL   | `https://api.deepseek.com` |

## Pierwsze kroki

<Steps>
  <Step title="Uzyskaj klucz API">
    Utwórz klucz API na stronie [platform.deepseek.com](https://platform.deepseek.com/api_keys).
  </Step>
  <Step title="Uruchom onboarding">
    ```bash
    openclaw onboard --auth-choice deepseek-api-key
    ```

    Spowoduje to wyświetlenie prośby o podanie klucza API i ustawienie `deepseek/deepseek-chat` jako modelu domyślnego.

  </Step>
  <Step title="Sprawdź, czy modele są dostępne">
    ```bash
    openclaw models list --provider deepseek
    ```
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Konfiguracja nieinteraktywna">
    W przypadku instalacji skryptowych lub bezgłowych przekaż wszystkie flagi bezpośrednio:

    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice deepseek-api-key \
      --deepseek-api-key "$DEEPSEEK_API_KEY" \
      --skip-health \
      --accept-risk
    ```

  </Accordion>
</AccordionGroup>

<Warning>
Jeśli Gateway działa jako demon (launchd/systemd), upewnij się, że `DEEPSEEK_API_KEY`
jest dostępne dla tego procesu (na przykład w `~/.openclaw/.env` lub przez
`env.shellEnv`).
</Warning>

## Wbudowany katalog

| Odwołanie do modelu         | Nazwa              | Wejście | Kontekst | Maks. wynik | Uwagi                                              |
| --------------------------- | ------------------ | ------- | -------- | ----------- | -------------------------------------------------- |
| `deepseek/deepseek-chat`     | DeepSeek Chat     | text    | 131,072  | 8,192       | Model domyślny; powierzchnia bez myślenia DeepSeek V3.2 |
| `deepseek/deepseek-reasoner` | DeepSeek Reasoner | text    | 131,072  | 65,536      | Powierzchnia DeepSeek V3.2 z obsługą rozumowania   |

<Tip>
Oba dołączone modele obecnie deklarują w źródle zgodność z użyciem streamingu.
</Tip>

## Przykład konfiguracji

```json5
{
  env: { DEEPSEEK_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: { primary: "deepseek/deepseek-chat" },
    },
  },
}
```

## Powiązane

<CardGroup cols={2}>
  <Card title="Wybór modelu" href="/pl/concepts/model-providers" icon="layers">
    Wybieranie dostawców, odwołań do modeli i zachowania failover.
  </Card>
  <Card title="Informacje o konfiguracji" href="/pl/gateway/configuration-reference" icon="gear">
    Pełne informacje o konfiguracji agentów, modeli i dostawców.
  </Card>
</CardGroup>
