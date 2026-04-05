---
read_when:
    - Chcesz używać DeepSeek z OpenClaw
    - Potrzebujesz zmiennej środowiskowej klucza API lub opcji uwierzytelniania CLI
summary: Konfiguracja DeepSeek (uwierzytelnianie + wybór modelu)
x-i18n:
    generated_at: "2026-04-05T14:02:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: 35f339ca206399496ce094eb8350e0870029ce9605121bcf86c4e9b94f3366c6
    source_path: providers/deepseek.md
    workflow: 15
---

# DeepSeek

[DeepSeek](https://www.deepseek.com) oferuje potężne modele AI z interfejsem API zgodnym z OpenAI.

- Provider: `deepseek`
- Uwierzytelnianie: `DEEPSEEK_API_KEY`
- API: zgodne z OpenAI
- Base URL: `https://api.deepseek.com`

## Szybki start

Ustaw klucz API (zalecane: zapisz go dla Gateway):

```bash
openclaw onboard --auth-choice deepseek-api-key
```

To poprosi o podanie klucza API i ustawi `deepseek/deepseek-chat` jako model domyślny.

## Przykład nieinteraktywny

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice deepseek-api-key \
  --deepseek-api-key "$DEEPSEEK_API_KEY" \
  --skip-health \
  --accept-risk
```

## Uwaga dotycząca środowiska

Jeśli Gateway działa jako demon (launchd/systemd), upewnij się, że `DEEPSEEK_API_KEY`
jest dostępny dla tego procesu (na przykład w `~/.openclaw/.env` lub przez
`env.shellEnv`).

## Wbudowany katalog

| Odwołanie do modelu          | Nazwa             | Wejście | Kontekst | Maks. wyjście | Uwagi                                             |
| ---------------------------- | ----------------- | ------- | -------- | ------------- | ------------------------------------------------- |
| `deepseek/deepseek-chat`     | DeepSeek Chat     | text    | 131,072  | 8,192         | Model domyślny; powierzchnia DeepSeek V3.2 bez trybu myślenia |
| `deepseek/deepseek-reasoner` | DeepSeek Reasoner | text    | 131,072  | 65,536        | Powierzchnia V3.2 z obsługą rozumowania                    |

Oba dołączone modele obecnie deklarują w kodzie źródłowym zgodność ze strumieniowaniem użycia.

Pobierz swój klucz API na stronie [platform.deepseek.com](https://platform.deepseek.com/api_keys).
