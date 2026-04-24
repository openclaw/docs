---
read_when:
    - Chcesz konfigurować Gateway, obszar roboczy, uwierzytelnianie, kanały i Skills z przewodnikiem
summary: Dokumentacja referencyjna CLI dla `openclaw onboard` (interaktywne wdrożenie)
title: Onboard
x-i18n:
    generated_at: "2026-04-24T09:03:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: c1959ad7014b891230e497a2e0ab494ba316090c81629f25b8147614b694ead5
    source_path: cli/onboard.md
    workflow: 15
---

# `openclaw onboard`

Interaktywne wdrożenie dla lokalnej lub zdalnej konfiguracji Gateway.

## Powiązane przewodniki

- Centrum wdrożenia CLI: [Onboarding (CLI)](/pl/start/wizard)
- Przegląd wdrożenia: [Onboarding Overview](/pl/start/onboarding-overview)
- Dokumentacja referencyjna wdrożenia CLI: [CLI Setup Reference](/pl/start/wizard-cli-reference)
- Automatyzacja CLI: [CLI Automation](/pl/start/wizard-cli-automation)
- Wdrożenie na macOS: [Onboarding (macOS App)](/pl/start/onboarding)

## Przykłady

```bash
openclaw onboard
openclaw onboard --flow quickstart
openclaw onboard --flow manual
openclaw onboard --mode remote --remote-url wss://gateway-host:18789
```

Dla celów `ws://` w prywatnej sieci używających jawnego tekstu (tylko zaufane sieci) ustaw
`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` w środowisku procesu wdrożenia.
Nie istnieje odpowiednik w `openclaw.json` dla tego awaryjnego obejścia
transportu po stronie klienta.

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

`--custom-api-key` jest opcjonalne w trybie nieinteraktywnym. Jeśli zostanie pominięte, wdrożenie sprawdza `CUSTOM_API_KEY`.

LM Studio obsługuje także flagę klucza specyficzną dla dostawcy w trybie nieinteraktywnym:

```bash
openclaw onboard --non-interactive \
  --auth-choice lmstudio \
  --custom-base-url "http://localhost:1234/v1" \
  --custom-model-id "qwen/qwen3.5-9b" \
  --lmstudio-api-key "$LM_API_TOKEN" \
  --accept-risk
```

Nieinteraktywny Ollama:

```bash
openclaw onboard --non-interactive \
  --auth-choice ollama \
  --custom-base-url "http://ollama-host:11434" \
  --custom-model-id "qwen3.5:27b" \
  --accept-risk
```

`--custom-base-url` ma domyślną wartość `http://127.0.0.1:11434`. `--custom-model-id` jest opcjonalne; jeśli zostanie pominięte, wdrożenie użyje sugerowanych ustawień domyślnych Ollama. Identyfikatory modeli chmurowych, takie jak `kimi-k2.5:cloud`, również tutaj działają.

Przechowuj klucze dostawców jako referencje zamiast jawnego tekstu:

```bash
openclaw onboard --non-interactive \
  --auth-choice openai-api-key \
  --secret-input-mode ref \
  --accept-risk
```

Przy `--secret-input-mode ref` wdrożenie zapisuje referencje oparte na env zamiast jawnych wartości kluczy.
Dla dostawców opartych na profilach uwierzytelniania zapisuje to wpisy `keyRef`; dla dostawców niestandardowych zapisuje `models.providers.<id>.apiKey` jako referencję env (na przykład `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`).

Kontrakt trybu nieinteraktywnego `ref`:

- Ustaw zmienną środowiskową dostawcy w środowisku procesu wdrożenia (na przykład `OPENAI_API_KEY`).
- Nie przekazuj flag z kluczem inline (na przykład `--openai-api-key`), chyba że ta zmienna środowiskowa także jest ustawiona.
- Jeśli flaga klucza inline zostanie przekazana bez wymaganej zmiennej środowiskowej, wdrożenie kończy się natychmiast błędem z podpowiedzią.

Opcje tokenu Gateway w trybie nieinteraktywnym:

- `--gateway-auth token --gateway-token <token>` zapisuje token jawnym tekstem.
- `--gateway-auth token --gateway-token-ref-env <name>` zapisuje `gateway.auth.token` jako env SecretRef.
- `--gateway-token` i `--gateway-token-ref-env` wzajemnie się wykluczają.
- `--gateway-token-ref-env` wymaga niepustej zmiennej środowiskowej w środowisku procesu wdrożenia.
- Przy `--install-daemon`, gdy uwierzytelnianie tokenem wymaga tokenu, tokeny Gateway zarządzane przez SecretRef są walidowane, ale nie są utrwalane jako rozwiązany jawny tekst w metadanych środowiska usługi supervisora.
- Przy `--install-daemon`, jeśli tryb tokenu wymaga tokenu, a skonfigurowany token SecretRef nie może zostać rozwiązany, wdrożenie kończy się bezpieczną blokadą z instrukcją naprawy.
- Przy `--install-daemon`, jeśli skonfigurowano zarówno `gateway.auth.token`, jak i `gateway.auth.password`, a `gateway.auth.mode` nie jest ustawione, wdrożenie blokuje instalację do czasu jawnego ustawienia trybu.
- Lokalne wdrożenie zapisuje `gateway.mode="local"` w konfiguracji. Jeśli późniejszy plik konfiguracji nie zawiera `gateway.mode`, należy to traktować jako uszkodzenie konfiguracji lub niekompletną ręczną edycję, a nie jako prawidłowy skrót dla trybu lokalnego.
- `--allow-unconfigured` to osobne awaryjne obejście runtime Gateway. Nie oznacza, że wdrożenie może pominąć `gateway.mode`.

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

Kondycja lokalnego Gateway w trybie nieinteraktywnym:

- O ile nie przekażesz `--skip-health`, wdrożenie czeka na osiągalny lokalny Gateway, zanim zakończy się powodzeniem.
- `--install-daemon` najpierw uruchamia ścieżkę instalacji zarządzanego Gateway. Bez tego musisz już mieć uruchomiony lokalny Gateway, na przykład `openclaw gateway run`.
- Jeśli w automatyzacji chcesz tylko zapisy konfiguracji/obszaru roboczego/bootstrap, użyj `--skip-health`.
- W natywnym systemie Windows `--install-daemon` najpierw próbuje użyć Scheduled Tasks, a jeśli utworzenie zadania zostanie odrzucone, przechodzi do elementu logowania per użytkownik w folderze Startup.

Interaktywne zachowanie wdrożenia w trybie referencji:

- Po wyświetleniu promptu wybierz **Use secret reference**.
- Następnie wybierz jedną z opcji:
  - Environment variable
  - Configured secret provider (`file` lub `exec`)
- Przed zapisaniem referencji wdrożenie wykonuje szybką walidację wstępną.
  - Jeśli walidacja się nie powiedzie, wdrożenie pokaże błąd i pozwoli spróbować ponownie.

Nieinteraktywne wybory endpointów Z.AI:

Uwaga: `--auth-choice zai-api-key` teraz automatycznie wykrywa najlepszy endpoint Z.AI dla Twojego klucza (preferuje ogólne API z `zai/glm-5.1`).
Jeśli konkretnie chcesz endpointy GLM Coding Plan, wybierz `zai-coding-global` lub `zai-coding-cn`.

```bash
# Wybór endpointu bez promptów
openclaw onboard --non-interactive \
  --auth-choice zai-coding-global \
  --zai-api-key "$ZAI_API_KEY"

# Inne wybory endpointów Z.AI:
# --auth-choice zai-coding-cn
# --auth-choice zai-global
# --auth-choice zai-cn
```

Nieinteraktywny przykład Mistral:

```bash
openclaw onboard --non-interactive \
  --auth-choice mistral-api-key \
  --mistral-api-key "$MISTRAL_API_KEY"
```

Uwagi dotyczące flow:

- `quickstart`: minimalna liczba promptów, automatycznie generuje token Gateway.
- `manual`: pełne prompty dla portu/bind/auth (alias `advanced`).
- Gdy wybór uwierzytelniania implikuje preferowanego dostawcę, wdrożenie wstępnie filtruje
  selektory modelu domyślnego i listy dozwolonych do tego dostawcy. W przypadku Volcengine i
  BytePlus obejmuje to także warianty coding-plan
  (`volcengine-plan/*`, `byteplus-plan/*`).
- Jeśli filtr preferowanego dostawcy nie zwróci jeszcze żadnych załadowanych modeli,
  wdrożenie wraca do katalogu bez filtrowania zamiast pozostawiać pusty selektor.
- W kroku wyszukiwania w sieci niektórzy dostawcy mogą wywoływać dodatkowe prompty specyficzne dla dostawcy:
  - **Grok** może oferować opcjonalną konfigurację `x_search` z użyciem tego samego `XAI_API_KEY`
    oraz wyborem modelu `x_search`.
  - **Kimi** może zapytać o region API Moonshot (`api.moonshot.ai` vs
    `api.moonshot.cn`) oraz domyślny model wyszukiwania w sieci Kimi.
- Zachowanie zakresu wiadomości prywatnych przy lokalnym wdrożeniu: [CLI Setup Reference](/pl/start/wizard-cli-reference#outputs-and-internals).
- Najszybszy pierwszy czat: `openclaw dashboard` (Control UI, bez konfiguracji kanału).
- Custom Provider: podłącz dowolny endpoint zgodny z OpenAI lub Anthropic,
  w tym hostowanych dostawców niewymienionych na liście. Użyj Unknown do automatycznego wykrywania.

## Typowe polecenia po wdrożeniu

```bash
openclaw configure
openclaw agents add <name>
```

<Note>
`--json` nie implikuje trybu nieinteraktywnego. W skryptach używaj `--non-interactive`.
</Note>
