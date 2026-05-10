---
read_when:
    - Chcesz skorzystać z konfiguracji z przewodnikiem dla Gateway, obszaru roboczego, uwierzytelniania, kanałów i Skills
summary: Dokumentacja referencyjna CLI dla `openclaw onboard` (interaktywne wdrażanie)
title: Wprowadzenie
x-i18n:
    generated_at: "2026-05-10T19:29:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: 510b2bbb688605ce1bf30918e4982e783963e7d43be65f9c23cffac11248ffd2
    source_path: cli/onboard.md
    workflow: 16
---

# `openclaw onboard`

Pełne prowadzone wdrożenie dla lokalnej lub zdalnej konfiguracji Gateway. Użyj tego, gdy chcesz, aby OpenClaw przeprowadził konfigurację uwierzytelniania modelu, obszaru roboczego, Gateway, kanałów, skills i kondycji w jednym przepływie.

## Powiązane przewodniki

<CardGroup cols={2}>
  <Card title="Centrum wdrożenia CLI" href="/pl/start/wizard" icon="rocket">
    Przewodnik po interaktywnym przepływie CLI.
  </Card>
  <Card title="Omówienie wdrożenia" href="/pl/start/onboarding-overview" icon="map">
    Jak elementy wdrożenia OpenClaw łączą się ze sobą.
  </Card>
  <Card title="Dokumentacja konfiguracji CLI" href="/pl/start/wizard-cli-reference" icon="book">
    Dane wyjściowe, mechanizmy wewnętrzne i zachowanie poszczególnych kroków.
  </Card>
  <Card title="Automatyzacja CLI" href="/pl/start/wizard-cli-automation" icon="terminal">
    Flagi nieinteraktywne i skryptowane konfiguracje.
  </Card>
  <Card title="Wdrożenie aplikacji macOS" href="/pl/start/onboarding" icon="apple">
    Przepływ wdrożenia dla aplikacji macOS na pasku menu.
  </Card>
</CardGroup>

## Przykłady

```bash
openclaw onboard
openclaw onboard --modern
openclaw onboard --flow quickstart
openclaw onboard --flow manual
openclaw onboard --flow import
openclaw onboard --import-from hermes --import-source ~/.hermes
openclaw onboard --skip-bootstrap
openclaw onboard --mode remote --remote-url wss://gateway-host:18789
```

`--flow import` używa dostawców migracji należących do Plugin, takich jak Hermes. Działa tylko na świeżej konfiguracji OpenClaw; jeśli istnieje już konfiguracja, poświadczenia, sesje albo pliki pamięci/tożsamości obszaru roboczego, zresetuj je albo wybierz świeżą konfigurację przed importem.

`--modern` uruchamia podgląd konwersacyjnego wdrożenia Crestodian. Bez
`--modern`, `openclaw onboard` zachowuje klasyczny przepływ wdrożenia.

Dla celów `ws://` w sieci prywatnej bez szyfrowania tekstu jawnego (tylko zaufane sieci) ustaw
`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` w środowisku procesu wdrożenia.
Nie ma odpowiednika `openclaw.json` dla tego awaryjnego obejścia transportu
po stronie klienta.

Niestandardowy dostawca w trybie nieinteraktywnym:

```bash
openclaw onboard --non-interactive \
  --auth-choice custom-api-key \
  --custom-base-url "https://llm.example.com/v1" \
  --custom-model-id "foo-large" \
  --custom-api-key "$CUSTOM_API_KEY" \
  --secret-input-mode plaintext \
  --custom-compatibility openai \
  --custom-image-input
```

`--custom-api-key` jest opcjonalne w trybie nieinteraktywnym. Jeśli zostanie pominięte, wdrożenie sprawdza `CUSTOM_API_KEY`.
OpenClaw automatycznie oznacza popularne identyfikatory modeli wizyjnych jako obsługujące obrazy. Przekaż `--custom-image-input` dla nieznanych niestandardowych identyfikatorów modeli wizyjnych albo `--custom-text-input`, aby wymusić metadane tylko tekstowe.

LM Studio obsługuje też flagę klucza specyficzną dla dostawcy w trybie nieinteraktywnym:

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

`--custom-base-url` domyślnie ma wartość `http://127.0.0.1:11434`. `--custom-model-id` jest opcjonalne; jeśli zostanie pominięte, wdrożenie używa sugerowanych wartości domyślnych Ollama. Identyfikatory modeli chmurowych, takie jak `kimi-k2.5:cloud`, również działają tutaj.

Przechowuj klucze dostawców jako odwołania zamiast tekstu jawnego:

```bash
openclaw onboard --non-interactive \
  --auth-choice openai-api-key \
  --secret-input-mode ref \
  --accept-risk
```

Z `--secret-input-mode ref` wdrożenie zapisuje odwołania oparte na zmiennych środowiskowych zamiast wartości kluczy w tekście jawnym.
Dla dostawców opartych na profilach uwierzytelniania zapisuje to wpisy `keyRef`; dla dostawców niestandardowych zapisuje to `models.providers.<id>.apiKey` jako odwołanie środowiskowe (na przykład `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`).

Kontrakt trybu nieinteraktywnego `ref`:

- Ustaw zmienną środowiskową dostawcy w środowisku procesu wdrożenia (na przykład `OPENAI_API_KEY`).
- Nie przekazuj flag klucza w wierszu poleceń (na przykład `--openai-api-key`), chyba że ta zmienna środowiskowa też jest ustawiona.
- Jeśli flaga klucza w wierszu poleceń zostanie przekazana bez wymaganej zmiennej środowiskowej, wdrożenie szybko kończy się błędem z instrukcjami.

Opcje tokena Gateway w trybie nieinteraktywnym:

- `--gateway-auth token --gateway-token <token>` przechowuje token w tekście jawnym.
- `--gateway-auth token --gateway-token-ref-env <name>` przechowuje `gateway.auth.token` jako środowiskowy SecretRef.
- `--gateway-token` i `--gateway-token-ref-env` wzajemnie się wykluczają.
- `--gateway-token-ref-env` wymaga niepustej zmiennej środowiskowej w środowisku procesu wdrożenia.
- Z `--install-daemon`, gdy uwierzytelnianie tokenem wymaga tokena, tokeny Gateway zarządzane przez SecretRef są walidowane, ale nie są utrwalane jako rozwiązany tekst jawny w metadanych środowiska usługi nadzorcy.
- Z `--install-daemon`, jeśli tryb tokena wymaga tokena, a skonfigurowany SecretRef tokena jest nierozwiązany, wdrożenie kończy się bezpiecznie niepowodzeniem z instrukcjami naprawy.
- Z `--install-daemon`, jeśli skonfigurowane są zarówno `gateway.auth.token`, jak i `gateway.auth.password`, a `gateway.auth.mode` nie jest ustawione, wdrożenie blokuje instalację do czasu jawnego ustawienia trybu.
- Wdrożenie lokalne zapisuje `gateway.mode="local"` w konfiguracji. Jeśli w późniejszym pliku konfiguracji brakuje `gateway.mode`, traktuj to jako uszkodzenie konfiguracji albo niepełną ręczną edycję, a nie jako prawidłowy skrót trybu lokalnego.
- Wdrożenie lokalne instaluje wybrane pobieralne plugins, gdy wymaga ich wybrana ścieżka konfiguracji.
- Wdrożenie zdalne zapisuje tylko informacje o połączeniu ze zdalnym Gateway i nie instaluje lokalnych pakietów Plugin.
- `--allow-unconfigured` to osobna awaryjna opcja uruchomieniowa Gateway. Nie oznacza, że wdrożenie może pominąć `gateway.mode`.

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
- `--install-daemon` najpierw uruchamia zarządzaną ścieżkę instalacji Gateway. Bez tego musisz już mieć uruchomiony lokalny Gateway, na przykład `openclaw gateway run`.
- Jeśli w automatyzacji chcesz tylko zapisy konfiguracji/obszaru roboczego/bootstrapu, użyj `--skip-health`.
- Jeśli samodzielnie zarządzasz plikami obszaru roboczego, przekaż `--skip-bootstrap`, aby ustawić `agents.defaults.skipBootstrap: true` i pominąć tworzenie `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md` oraz `BOOTSTRAP.md`.
- Na natywnym Windows `--install-daemon` najpierw próbuje Scheduled Tasks, a jeśli utworzenie zadania zostanie odrzucone, wraca do elementu logowania w folderze Startup dla użytkownika.

Zachowanie interaktywnego wdrożenia z trybem odwołań:

- Wybierz **Użyj odwołania do sekretu**, gdy pojawi się monit.
- Następnie wybierz jedną z opcji:
  - Zmienna środowiskowa
  - Skonfigurowany dostawca sekretów (`file` lub `exec`)
- Wdrożenie wykonuje szybką walidację wstępną przed zapisaniem odwołania.
  - Jeśli walidacja się nie powiedzie, wdrożenie pokazuje błąd i pozwala spróbować ponownie.

### Nieinteraktywne wybory punktów końcowych Z.AI

<Note>
`--auth-choice zai-api-key` automatycznie wykrywa najlepszy punkt końcowy Z.AI dla Twojego klucza (preferuje ogólne API z `zai/glm-5.1`). Jeśli konkretnie chcesz punkty końcowe GLM Coding Plan, wybierz `zai-coding-global` albo `zai-coding-cn`.
</Note>

```bash
# Promptless endpoint selection
openclaw onboard --non-interactive \
  --auth-choice zai-coding-global \
  --zai-api-key "$ZAI_API_KEY"

# Other Z.AI endpoint choices:
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

## Uwagi dotyczące przepływu

<AccordionGroup>
  <Accordion title="Typy przepływu">
    - `quickstart`: minimalne monity, automatycznie generuje token Gateway.
    - `manual`: pełne monity dotyczące portu, adresu nasłuchiwania i uwierzytelniania (alias `advanced`).
    - `import`: uruchamia wykrytego dostawcę migracji, wyświetla podgląd planu, a następnie stosuje go po potwierdzeniu.

  </Accordion>
  <Accordion title="Wstępne filtrowanie dostawców">
    Gdy wybór uwierzytelniania implikuje preferowanego dostawcę, wdrożenie wstępnie filtruje selektory modelu domyślnego i listy dozwolonych do tego dostawcy. Dla Volcengine i BytePlus dopasowuje to również warianty planu kodowania (`volcengine-plan/*`, `byteplus-plan/*`).

    Jeśli filtr preferowanego dostawcy nie zwróci jeszcze żadnych załadowanych modeli, wdrożenie wraca do niefiltrowanego katalogu zamiast zostawiać selektor pusty.

  </Accordion>
  <Accordion title="Dodatkowe monity wyszukiwania w sieci">
    Niektórzy dostawcy wyszukiwania w sieci wyzwalają dodatkowe monity specyficzne dla dostawcy:

    - **Grok** może zaoferować opcjonalną konfigurację `x_search` z tym samym `XAI_API_KEY` i wyborem modelu `x_search`.
    - **Kimi** może zapytać o region API Moonshot (`api.moonshot.ai` vs `api.moonshot.cn`) i domyślny model wyszukiwania w sieci Kimi.

  </Accordion>
  <Accordion title="Inne zachowania">
    - Zachowanie zakresu DM wdrożenia lokalnego: [Dokumentacja konfiguracji CLI](/pl/start/wizard-cli-reference#outputs-and-internals).
    - Najszybszy pierwszy czat: `openclaw dashboard` (Control UI, bez konfiguracji kanału).
    - Dostawca niestandardowy: połącz dowolny punkt końcowy zgodny z OpenAI lub Anthropic, w tym hostowanych dostawców niewymienionych na liście. Użyj Unknown, aby wykryć automatycznie.
    - Jeśli zostanie wykryty stan Hermes, wdrożenie oferuje przepływ migracji. Użyj [Migracja](/pl/cli/migrate), aby uzyskać plany próbne, tryb nadpisywania, raporty i dokładne mapowania.

  </Accordion>
</AccordionGroup>

## Typowe kolejne polecenia

```bash
openclaw channels add
openclaw configure
openclaw agents add <name>
```

Użyj `openclaw setup`, gdy potrzebujesz tylko bazowej konfiguracji/obszaru roboczego. Użyj później `openclaw configure` do ukierunkowanych zmian, a `openclaw channels add` do konfiguracji dotyczącej wyłącznie kanału.

<Note>
`--json` nie oznacza trybu nieinteraktywnego. Użyj `--non-interactive` w skryptach.
</Note>
