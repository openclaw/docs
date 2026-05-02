---
read_when:
    - Chcesz przeprowadzić konfigurację z przewodnikiem dla Gateway, obszaru roboczego, uwierzytelniania, kanałów i Skills
summary: Dokumentacja referencyjna CLI dla `openclaw onboard` (interaktywne wprowadzenie)
title: Wprowadzenie
x-i18n:
    generated_at: "2026-05-02T09:46:07Z"
    model: gpt-5.5
    provider: openai
    source_hash: 79fd15da17beb5e66da760bcf490a15340d42af0730c19f04d41908995da8ffb
    source_path: cli/onboard.md
    workflow: 16
---

# `openclaw onboard`

Interaktywna konfiguracja początkowa lokalnego lub zdalnego Gateway.

## Powiązane przewodniki

<CardGroup cols={2}>
  <Card title="Centrum wprowadzania CLI" href="/pl/start/wizard" icon="rocket">
    Przewodnik po interaktywnym przepływie CLI.
  </Card>
  <Card title="Omówienie wprowadzania" href="/pl/start/onboarding-overview" icon="map">
    Jak elementy wprowadzania OpenClaw łączą się ze sobą.
  </Card>
  <Card title="Dokumentacja konfiguracji CLI" href="/pl/start/wizard-cli-reference" icon="book">
    Dane wyjściowe, mechanizmy wewnętrzne i zachowanie poszczególnych kroków.
  </Card>
  <Card title="Automatyzacja CLI" href="/pl/start/wizard-cli-automation" icon="terminal">
    Flagi nieinteraktywne i konfiguracje skryptowe.
  </Card>
  <Card title="Wprowadzanie aplikacji macOS" href="/pl/start/onboarding" icon="apple">
    Przepływ wprowadzania dla aplikacji paska menu macOS.
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

`--flow import` używa należących do Plugin dostawców migracji, takich jak Hermes. Działa tylko na świeżej konfiguracji OpenClaw; jeśli istniejąca konfiguracja, poświadczenia, sesje albo pliki pamięci/tożsamości obszaru roboczego są obecne, zresetuj konfigurację albo wybierz świeżą konfigurację przed importem.

`--modern` uruchamia podgląd konwersacyjnego wprowadzania Crestodian. Bez
`--modern`, `openclaw onboard` zachowuje klasyczny przepływ wprowadzania.

Dla jawnotekstowych celów `ws://` w sieci prywatnej (tylko zaufane sieci), ustaw
`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` w środowisku procesu wprowadzania.
Nie istnieje odpowiednik `openclaw.json` dla tego awaryjnego obejścia transportu
po stronie klienta.

Niestandardowy dostawca nieinteraktywny:

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

`--custom-api-key` jest opcjonalne w trybie nieinteraktywnym. Jeśli zostanie pominięte, wprowadzanie sprawdza `CUSTOM_API_KEY`.
OpenClaw automatycznie oznacza typowe identyfikatory modeli wizyjnych jako obsługujące obrazy. Przekaż `--custom-image-input` dla nieznanych niestandardowych identyfikatorów wizyjnych albo `--custom-text-input`, aby wymusić metadane tylko tekstowe.

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

`--custom-base-url` domyślnie ma wartość `http://127.0.0.1:11434`. `--custom-model-id` jest opcjonalne; jeśli zostanie pominięte, wprowadzanie używa sugerowanych wartości domyślnych Ollama. Identyfikatory modeli chmurowych, takie jak `kimi-k2.5:cloud`, również tutaj działają.

Przechowuj klucze dostawców jako referencje zamiast jawnego tekstu:

```bash
openclaw onboard --non-interactive \
  --auth-choice openai-api-key \
  --secret-input-mode ref \
  --accept-risk
```

Z `--secret-input-mode ref` wprowadzanie zapisuje referencje oparte na zmiennych środowiskowych zamiast jawnych wartości kluczy.
Dla dostawców opartych na profilu uwierzytelniania zapisuje to wpisy `keyRef`; dla dostawców niestandardowych zapisuje to `models.providers.<id>.apiKey` jako referencję środowiskową (na przykład `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`).

Kontrakt trybu nieinteraktywnego `ref`:

- Ustaw zmienną środowiskową dostawcy w środowisku procesu wprowadzania (na przykład `OPENAI_API_KEY`).
- Nie przekazuj wbudowanych flag klucza (na przykład `--openai-api-key`), chyba że ta zmienna środowiskowa jest też ustawiona.
- Jeśli wbudowana flaga klucza zostanie przekazana bez wymaganej zmiennej środowiskowej, wprowadzanie szybko kończy się niepowodzeniem z instrukcją.

Opcje tokenu Gateway w trybie nieinteraktywnym:

- `--gateway-auth token --gateway-token <token>` przechowuje token jako jawny tekst.
- `--gateway-auth token --gateway-token-ref-env <name>` przechowuje `gateway.auth.token` jako środowiskowy SecretRef.
- `--gateway-token` i `--gateway-token-ref-env` wzajemnie się wykluczają.
- `--gateway-token-ref-env` wymaga niepustej zmiennej środowiskowej w środowisku procesu wprowadzania.
- Z `--install-daemon`, gdy uwierzytelnianie tokenem wymaga tokenu, tokeny Gateway zarządzane przez SecretRef są walidowane, ale nie są utrwalane jako rozwiązany jawny tekst w metadanych środowiska usługi nadzorcy.
- Z `--install-daemon`, jeśli tryb tokenu wymaga tokenu, a skonfigurowany token SecretRef jest nierozwiązany, wprowadzanie kończy się bezpieczną blokadą z instrukcją naprawy.
- Z `--install-daemon`, jeśli skonfigurowano zarówno `gateway.auth.token`, jak i `gateway.auth.password`, a `gateway.auth.mode` nie jest ustawione, wprowadzanie blokuje instalację, dopóki tryb nie zostanie ustawiony jawnie.
- Lokalne wprowadzanie zapisuje `gateway.mode="local"` w konfiguracji. Jeśli późniejszy plik konfiguracji nie zawiera `gateway.mode`, traktuj to jako uszkodzenie konfiguracji albo niekompletną ręczną edycję, a nie jako prawidłowy skrót trybu lokalnego.
- Lokalne wprowadzanie instaluje wybrane Plugin do pobrania, gdy wybrana ścieżka konfiguracji ich wymaga.
- Zdalne wprowadzanie zapisuje tylko informacje o połączeniu ze zdalnym Gateway i nie instaluje lokalnych pakietów Plugin.
- `--allow-unconfigured` to osobne awaryjne obejście środowiska uruchomieniowego Gateway. Nie oznacza, że wprowadzanie może pominąć `gateway.mode`.

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

- O ile nie przekażesz `--skip-health`, wprowadzanie czeka na osiągalny lokalny Gateway przed pomyślnym zakończeniem.
- `--install-daemon` najpierw uruchamia ścieżkę instalacji zarządzanego Gateway. Bez tej flagi musisz już mieć uruchomiony lokalny Gateway, na przykład `openclaw gateway run`.
- Jeśli w automatyzacji chcesz tylko zapisy konfiguracji/obszaru roboczego/bootstrapu, użyj `--skip-health`.
- Jeśli samodzielnie zarządzasz plikami obszaru roboczego, przekaż `--skip-bootstrap`, aby ustawić `agents.defaults.skipBootstrap: true` i pominąć tworzenie `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md` oraz `BOOTSTRAP.md`.
- Na natywnym Windows `--install-daemon` najpierw próbuje użyć Zaplanowanych zadań, a jeśli utworzenie zadania zostanie odrzucone, przechodzi do elementu logowania w folderze Autostart użytkownika.

Zachowanie interaktywnego wprowadzania w trybie referencji:

- Wybierz **Użyj referencji sekretu**, gdy pojawi się monit.
- Następnie wybierz jedno z:
  - Zmienna środowiskowa
  - Skonfigurowany dostawca sekretów (`file` lub `exec`)
- Wprowadzanie wykonuje szybką walidację wstępną przed zapisaniem referencji.
  - Jeśli walidacja się nie powiedzie, wprowadzanie pokazuje błąd i pozwala spróbować ponownie.

### Nieinteraktywne wybory punktu końcowego Z.AI

<Note>
`--auth-choice zai-api-key` automatycznie wykrywa najlepszy punkt końcowy Z.AI dla Twojego klucza (preferuje ogólny interfejs API z `zai/glm-5.1`). Jeśli konkretnie chcesz punkty końcowe Planu kodowania GLM, wybierz `zai-coding-global` albo `zai-coding-cn`.
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
  <Accordion title="Typy przepływów">
    - `quickstart`: minimalne monity, automatycznie generuje token Gateway.
    - `manual`: pełne monity dotyczące portu, wiązania i uwierzytelniania (alias `advanced`).
    - `import`: uruchamia wykrytego dostawcę migracji, pokazuje podgląd planu, a następnie stosuje go po potwierdzeniu.

  </Accordion>
  <Accordion title="Wstępne filtrowanie dostawców">
    Gdy wybór uwierzytelniania sugeruje preferowanego dostawcę, wprowadzanie wstępnie filtruje selektory modelu domyślnego i listy dozwolonych do tego dostawcy. W przypadku Volcengine i BytePlus dopasowuje to także warianty planu kodowania (`volcengine-plan/*`, `byteplus-plan/*`).

    Jeśli filtr preferowanego dostawcy nie zwróci jeszcze żadnych załadowanych modeli, wprowadzanie wraca do niefiltrowanego katalogu zamiast zostawiać pusty selektor.

  </Accordion>
  <Accordion title="Dalsze monity wyszukiwania w sieci">
    Niektórzy dostawcy wyszukiwania w sieci uruchamiają specyficzne dla dostawcy dalsze monity:

    - **Grok** może zaoferować opcjonalną konfigurację `x_search` z tym samym `XAI_API_KEY` i wyborem modelu `x_search`.
    - **Kimi** może zapytać o region API Moonshot (`api.moonshot.ai` albo `api.moonshot.cn`) i domyślny model wyszukiwania w sieci Kimi.

  </Accordion>
  <Accordion title="Inne zachowania">
    - Zachowanie zakresu DM lokalnego wprowadzania: [Dokumentacja konfiguracji CLI](/pl/start/wizard-cli-reference#outputs-and-internals).
    - Najszybszy pierwszy czat: `openclaw dashboard` (Control UI, bez konfiguracji kanału).
    - Dostawca niestandardowy: połącz dowolny punkt końcowy zgodny z OpenAI lub Anthropic, w tym hostowanych dostawców spoza listy. Użyj Unknown, aby wykryć automatycznie.
    - Jeśli zostanie wykryty stan Hermes, wprowadzanie oferuje przepływ migracji. Użyj [Migracja](/pl/cli/migrate), aby uzyskać plany dry-run, tryb nadpisywania, raporty i dokładne mapowania.

  </Accordion>
</AccordionGroup>

## Częste polecenia uzupełniające

```bash
openclaw configure
openclaw agents add <name>
```

<Note>
`--json` nie implikuje trybu nieinteraktywnego. Użyj `--non-interactive` w skryptach.
</Note>
