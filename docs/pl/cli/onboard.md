---
read_when:
    - Chcesz przejść przez konfigurację gateway, workspace, uwierzytelniania, kanałów i Skills krok po kroku
summary: Dokumentacja CLI dla `openclaw onboard` (interaktywne wdrożenie)
title: onboard
x-i18n:
    generated_at: "2026-04-05T13:49:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6db61c8002c9e82e48ff44f72e176b58ad85fad5cb8434687455ed40add8cc2a
    source_path: cli/onboard.md
    workflow: 15
---

# `openclaw onboard`

Interaktywne wdrożenie dla lokalnej lub zdalnej konfiguracji Gateway.

## Powiązane przewodniki

- Centrum wdrożenia CLI: [Wdrożenie (CLI)](/start/wizard)
- Omówienie wdrożenia: [Omówienie wdrożenia](/start/onboarding-overview)
- Dokumentacja wdrożenia CLI: [Dokumentacja konfiguracji CLI](/start/wizard-cli-reference)
- Automatyzacja CLI: [Automatyzacja CLI](/start/wizard-cli-automation)
- Wdrożenie macOS: [Wdrożenie (aplikacja macOS)](/start/onboarding)

## Przykłady

```bash
openclaw onboard
openclaw onboard --flow quickstart
openclaw onboard --flow manual
openclaw onboard --mode remote --remote-url wss://gateway-host:18789
```

Dla nieszyfrowanych celów `ws://` w sieci prywatnej (tylko zaufane sieci) ustaw
`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` w środowisku procesu wdrożenia.

Niestandardowy dostawca w trybie nieinteraktywnym:

```bash
openclaw onboard --non-interactive \
  --auth-choice custom-api-key \
  --custom-base-url "https://llm.example.com/v1" \
  --custom-model-id "foo-large" \
  --custom-api-key "$CUSTOM_API_KEY" \
  --secret-input-mode plaintext \
  --custom-compatibility openai
```

`--custom-api-key` jest opcjonalne w trybie nieinteraktywnym. Jeśli zostanie pominięte, wdrożenie sprawdzi `CUSTOM_API_KEY`.

Ollama w trybie nieinteraktywnym:

```bash
openclaw onboard --non-interactive \
  --auth-choice ollama \
  --custom-base-url "http://ollama-host:11434" \
  --custom-model-id "qwen3.5:27b" \
  --accept-risk
```

`--custom-base-url` domyślnie ma wartość `http://127.0.0.1:11434`. `--custom-model-id` jest opcjonalne; jeśli zostanie pominięte, wdrożenie użyje sugerowanych wartości domyślnych Ollama. Identyfikatory modeli chmurowych, takie jak `kimi-k2.5:cloud`, również tutaj działają.

Zapisuj klucze dostawców jako referencje zamiast zwykłego tekstu:

```bash
openclaw onboard --non-interactive \
  --auth-choice openai-api-key \
  --secret-input-mode ref \
  --accept-risk
```

Przy `--secret-input-mode ref` wdrożenie zapisuje referencje oparte na zmiennych środowiskowych zamiast wartości kluczy zapisanych jawnym tekstem.
Dla dostawców opartych na profilach uwierzytelniania zapisuje to wpisy `keyRef`; dla dostawców niestandardowych zapisuje `models.providers.<id>.apiKey` jako referencję env (na przykład `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`).

Kontrakt trybu `ref` w trybie nieinteraktywnym:

- Ustaw zmienną środowiskową dostawcy w środowisku procesu wdrożenia (na przykład `OPENAI_API_KEY`).
- Nie przekazuj flag z kluczami inline (na przykład `--openai-api-key`), chyba że ta zmienna środowiskowa również jest ustawiona.
- Jeśli flaga z kluczem inline zostanie przekazana bez wymaganej zmiennej środowiskowej, wdrożenie zakończy się natychmiast błędem z instrukcjami.

Opcje tokena Gateway w trybie nieinteraktywnym:

- `--gateway-auth token --gateway-token <token>` zapisuje token jawnym tekstem.
- `--gateway-auth token --gateway-token-ref-env <name>` zapisuje `gateway.auth.token` jako env SecretRef.
- `--gateway-token` i `--gateway-token-ref-env` wzajemnie się wykluczają.
- `--gateway-token-ref-env` wymaga niepustej zmiennej środowiskowej w środowisku procesu wdrożenia.
- Przy `--install-daemon`, gdy uwierzytelnianie tokenem wymaga tokena, tokeny Gateway zarządzane przez SecretRef są walidowane, ale nie są utrwalane jako rozwiązany jawny tekst w metadanych środowiska usługi nadzorującej.
- Przy `--install-daemon`, jeśli tryb tokena wymaga tokena, a skonfigurowany SecretRef tokena jest nierozwiązany, wdrożenie kończy się bezpieczną odmową z instrukcjami naprawy.
- Przy `--install-daemon`, jeśli skonfigurowane są zarówno `gateway.auth.token`, jak i `gateway.auth.password`, a `gateway.auth.mode` nie jest ustawione, wdrożenie blokuje instalację, dopóki tryb nie zostanie ustawiony jawnie.
- Lokalne wdrożenie zapisuje `gateway.mode="local"` w konfiguracji. Jeśli w późniejszym pliku konfiguracji brakuje `gateway.mode`, traktuj to jako uszkodzenie konfiguracji lub niekompletną ręczną edycję, a nie jako prawidłowy skrót trybu lokalnego.
- `--allow-unconfigured` to osobny mechanizm awaryjny środowiska uruchomieniowego Gateway. Nie oznacza, że wdrożenie może pominąć `gateway.mode`.

Przykład:

```bash
export OPENCLAW_GATEWAY_TOKEN="your-token"
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice skip \
  --gateway-auth token \
  --gateway-token-ref-env OPENCLAW_GATEWAY_TOKEN \
  --accept-risk
```

Stan zdrowia lokalnego Gateway w trybie nieinteraktywnym:

- O ile nie przekażesz `--skip-health`, wdrożenie czeka na osiągalny lokalny Gateway, zanim zakończy się pomyślnie.
- `--install-daemon` najpierw uruchamia ścieżkę zarządzanej instalacji Gateway. Bez niej musisz już mieć uruchomiony lokalny Gateway, na przykład `openclaw gateway run`.
- Jeśli w automatyzacji chcesz tylko zapisać konfigurację/workspace/bootstrap, użyj `--skip-health`.
- W natywnym systemie Windows `--install-daemon` najpierw próbuje użyć Scheduled Tasks, a jeśli utworzenie zadania zostanie odrzucone, przechodzi na element logowania per użytkownik w folderze Startup.

Zachowanie interaktywnego wdrożenia w trybie referencji:

- Po wyświetleniu monitu wybierz **Use secret reference**.
- Następnie wybierz jedną z opcji:
  - Zmienna środowiskowa
  - Skonfigurowany dostawca sekretów (`file` lub `exec`)
- Wdrożenie wykonuje szybką walidację wstępną przed zapisaniem referencji.
  - Jeśli walidacja się nie powiedzie, wdrożenie wyświetli błąd i pozwoli spróbować ponownie.

Wybór punktów końcowych Z.AI w trybie nieinteraktywnym:

Uwaga: `--auth-choice zai-api-key` teraz automatycznie wykrywa najlepszy punkt końcowy Z.AI dla Twojego klucza (preferuje ogólne API z `zai/glm-5`).
Jeśli konkretnie chcesz punkty końcowe GLM Coding Plan, wybierz `zai-coding-global` lub `zai-coding-cn`.

```bash
# Wybór punktu końcowego bez promptów
openclaw onboard --non-interactive \
  --auth-choice zai-coding-global \
  --zai-api-key "$ZAI_API_KEY"

# Inne opcje punktów końcowych Z.AI:
# --auth-choice zai-coding-cn
# --auth-choice zai-global
# --auth-choice zai-cn
```

Przykład Mistral w trybie nieinteraktywnym:

```bash
openclaw onboard --non-interactive \
  --auth-choice mistral-api-key \
  --mistral-api-key "$MISTRAL_API_KEY"
```

Uwagi dotyczące przepływu:

- `quickstart`: minimalna liczba promptów, automatycznie generuje token gateway.
- `manual`: pełne prompty dla portu/bind/auth (alias `advanced`).
- Gdy wybór uwierzytelniania implikuje preferowanego dostawcę, wdrożenie wstępnie filtruje selektory
  modelu domyślnego i allowlisty do tego dostawcy. Dla Volcengine i
  BytePlus obejmuje to także warianty coding-plan
  (`volcengine-plan/*`, `byteplus-plan/*`).
- Jeśli filtr preferowanego dostawcy nie zwróci jeszcze żadnych załadowanych modeli,
  wdrożenie wróci do niefiltrowanego katalogu zamiast pozostawiać pusty selektor.
- W kroku wyszukiwania w sieci niektórzy dostawcy mogą uruchamiać
  kolejne prompty specyficzne dla dostawcy:
  - **Grok** może oferować opcjonalną konfigurację `x_search` z tym samym `XAI_API_KEY`
    oraz wybór modelu `x_search`.
  - **Kimi** może pytać o region API Moonshot (`api.moonshot.ai` vs
    `api.moonshot.cn`) oraz domyślny model wyszukiwania w sieci Kimi.
- Zachowanie zakresu DM w lokalnym wdrożeniu: [Dokumentacja konfiguracji CLI](/start/wizard-cli-reference#outputs-and-internals).
- Najszybszy pierwszy czat: `openclaw dashboard` (Control UI, bez konfiguracji kanałów).
- Custom Provider: połącz dowolny punkt końcowy zgodny z OpenAI lub Anthropic,
  w tym hostowanych dostawców niewymienionych na liście. Użyj Unknown, aby wykryć automatycznie.

## Typowe polecenia po wdrożeniu

```bash
openclaw configure
openclaw agents add <name>
```

<Note>
`--json` nie oznacza trybu nieinteraktywnego. W skryptach używaj `--non-interactive`.
</Note>
