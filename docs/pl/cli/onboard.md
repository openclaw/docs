---
read_when:
    - Chcesz przejść przez konfigurację z przewodnikiem dla Gateway, obszaru roboczego, uwierzytelniania, kanałów i Skills
summary: Dokumentacja referencyjna CLI dla `openclaw onboard` (interaktywne wprowadzenie)
title: Wdrażanie
x-i18n:
    generated_at: "2026-04-30T09:45:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: 583310458b2e2bc8ddc1513112c960520d972716be0c33e4177d0db30e896504
    source_path: cli/onboard.md
    workflow: 16
---

# `openclaw onboard`

Interaktywne wdrażanie dla lokalnej lub zdalnej konfiguracji Gateway.

## Powiązane przewodniki

<CardGroup cols={2}>
  <Card title="Centrum wdrażania CLI" href="/pl/start/wizard" icon="rocket">
    Przewodnik po interaktywnym przepływie CLI.
  </Card>
  <Card title="Omówienie wdrażania" href="/pl/start/onboarding-overview" icon="map">
    Jak elementy wdrażania OpenClaw łączą się ze sobą.
  </Card>
  <Card title="Informacje referencyjne konfiguracji CLI" href="/pl/start/wizard-cli-reference" icon="book">
    Wyniki, elementy wewnętrzne i zachowanie poszczególnych kroków.
  </Card>
  <Card title="Automatyzacja CLI" href="/pl/start/wizard-cli-automation" icon="terminal">
    Flagi nieinteraktywne i konfiguracje skryptowe.
  </Card>
  <Card title="Wdrażanie aplikacji macOS" href="/pl/start/onboarding" icon="apple">
    Przepływ wdrażania dla aplikacji paska menu macOS.
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

`--flow import` używa dostawców migracji należących do Plugin, takich jak Hermes. Działa tylko względem świeżej konfiguracji OpenClaw; jeśli istniejąca konfiguracja, poświadczenia, sesje albo pliki pamięci/tożsamości obszaru roboczego są obecne, zresetuj je albo wybierz świeżą konfigurację przed importem.

`--modern` uruchamia podgląd konwersacyjnego wdrażania Crestodian. Bez
`--modern`, `openclaw onboard` zachowuje klasyczny przepływ wdrażania.

Dla celów `ws://` w prywatnej sieci z tekstem jawnym (tylko zaufane sieci), ustaw
`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` w środowisku procesu wdrażania.
Nie ma odpowiednika `openclaw.json` dla tego awaryjnego obejścia transportu
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

`--custom-api-key` jest opcjonalne w trybie nieinteraktywnym. Jeśli zostanie pominięte, wdrażanie sprawdza `CUSTOM_API_KEY`.
OpenClaw automatycznie oznacza typowe identyfikatory modeli wizyjnych jako obsługujące obrazy. Przekaż `--custom-image-input` dla nieznanych niestandardowych identyfikatorów wizyjnych albo `--custom-text-input`, aby wymusić metadane tylko tekstowe.

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

`--custom-base-url` domyślnie przyjmuje `http://127.0.0.1:11434`. `--custom-model-id` jest opcjonalne; jeśli zostanie pominięte, wdrażanie używa sugerowanych wartości domyślnych Ollama. Identyfikatory modeli chmurowych, takie jak `kimi-k2.5:cloud`, również tu działają.

Przechowuj klucze dostawców jako referencje zamiast tekstu jawnego:

```bash
openclaw onboard --non-interactive \
  --auth-choice openai-api-key \
  --secret-input-mode ref \
  --accept-risk
```

Z `--secret-input-mode ref` wdrażanie zapisuje referencje oparte na zmiennych środowiskowych zamiast wartości kluczy w tekście jawnym.
Dla dostawców opartych na profilach uwierzytelniania zapisuje to wpisy `keyRef`; dla dostawców niestandardowych zapisuje to `models.providers.<id>.apiKey` jako referencję środowiskową (na przykład `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`).

Kontrakt trybu nieinteraktywnego `ref`:

- Ustaw zmienną środowiskową dostawcy w środowisku procesu wdrażania (na przykład `OPENAI_API_KEY`).
- Nie przekazuj wbudowanych flag klucza (na przykład `--openai-api-key`), chyba że ta zmienna środowiskowa jest również ustawiona.
- Jeśli wbudowana flaga klucza zostanie przekazana bez wymaganej zmiennej środowiskowej, wdrażanie szybko kończy się błędem z instrukcjami.

Opcje tokena Gateway w trybie nieinteraktywnym:

- `--gateway-auth token --gateway-token <token>` przechowuje token w tekście jawnym.
- `--gateway-auth token --gateway-token-ref-env <name>` przechowuje `gateway.auth.token` jako środowiskowy SecretRef.
- `--gateway-token` i `--gateway-token-ref-env` wzajemnie się wykluczają.
- `--gateway-token-ref-env` wymaga niepustej zmiennej środowiskowej w środowisku procesu wdrażania.
- Z `--install-daemon`, gdy uwierzytelnianie tokenem wymaga tokena, tokeny Gateway zarządzane przez SecretRef są walidowane, ale nie są utrwalane jako rozwiązany tekst jawny w metadanych środowiska usługi nadzorcy.
- Z `--install-daemon`, jeśli tryb tokenu wymaga tokena, a skonfigurowany token SecretRef nie może zostać rozwiązany, wdrażanie kończy się bezpiecznym niepowodzeniem z instrukcjami naprawy.
- Z `--install-daemon`, jeśli skonfigurowane są zarówno `gateway.auth.token`, jak i `gateway.auth.password`, a `gateway.auth.mode` nie jest ustawione, wdrażanie blokuje instalację, dopóki tryb nie zostanie ustawiony jawnie.
- Lokalne wdrażanie zapisuje `gateway.mode="local"` w konfiguracji. Jeśli w późniejszym pliku konfiguracji brakuje `gateway.mode`, traktuj to jako uszkodzenie konfiguracji albo niekompletną ręczną edycję, a nie jako poprawny skrót trybu lokalnego.
- `--allow-unconfigured` to osobna awaryjna furtka środowiska uruchomieniowego Gateway. Nie oznacza, że wdrażanie może pominąć `gateway.mode`.

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

Stan lokalnego Gateway w trybie nieinteraktywnym:

- Jeśli nie przekażesz `--skip-health`, wdrażanie czeka na osiągalny lokalny Gateway, zanim zakończy się powodzeniem.
- `--install-daemon` najpierw uruchamia ścieżkę instalacji zarządzanego Gateway. Bez tej flagi musisz mieć już uruchomiony lokalny Gateway, na przykład `openclaw gateway run`.
- Jeśli w automatyzacji chcesz tylko zapisy konfiguracji/obszaru roboczego/bootstrapu, użyj `--skip-health`.
- Jeśli samodzielnie zarządzasz plikami obszaru roboczego, przekaż `--skip-bootstrap`, aby ustawić `agents.defaults.skipBootstrap: true` i pominąć tworzenie `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md` oraz `BOOTSTRAP.md`.
- W natywnym Windows `--install-daemon` najpierw próbuje użyć Zaplanowanych zadań, a jeśli tworzenie zadania zostanie odrzucone, przechodzi do elementu logowania w folderze Autostart użytkownika.

Zachowanie interaktywnego wdrażania w trybie referencji:

- Wybierz **Użyj referencji sekretu**, gdy pojawi się monit.
- Następnie wybierz jedno z:
  - Zmienna środowiskowa
  - Skonfigurowany dostawca sekretów (`file` lub `exec`)
- Wdrażanie wykonuje szybką walidację wstępną przed zapisaniem referencji.
  - Jeśli walidacja się nie powiedzie, wdrażanie pokazuje błąd i pozwala spróbować ponownie.

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
  <Accordion title="Typy przepływów">
    - `quickstart`: minimalne monity, automatycznie generuje token Gateway.
    - `manual`: pełne monity dla portu, powiązania i uwierzytelniania (alias `advanced`).
    - `import`: uruchamia wykrytego dostawcę migracji, pokazuje podgląd planu, a następnie stosuje go po potwierdzeniu.

  </Accordion>
  <Accordion title="Wstępne filtrowanie dostawców">
    Gdy wybór uwierzytelniania wskazuje preferowanego dostawcę, wdrażanie wstępnie filtruje selektory modelu domyślnego i listy dozwolonych pozycji do tego dostawcy. W przypadku Volcengine i BytePlus dopasowuje to również warianty planu kodowania (`volcengine-plan/*`, `byteplus-plan/*`).

    Jeśli filtr preferowanego dostawcy nie zwróci jeszcze żadnych załadowanych modeli, wdrażanie wraca do niefiltrowanego katalogu zamiast pozostawiać selektor pusty.

  </Accordion>
  <Accordion title="Dodatkowe pytania dotyczące wyszukiwania w sieci">
    Niektórzy dostawcy wyszukiwania w sieci uruchamiają dodatkowe monity specyficzne dla dostawcy:

    - **Grok** może zaoferować opcjonalną konfigurację `x_search` z tym samym `XAI_API_KEY` i wyborem modelu `x_search`.
    - **Kimi** może zapytać o region Moonshot API (`api.moonshot.ai` kontra `api.moonshot.cn`) i domyślny model wyszukiwania w sieci Kimi.

  </Accordion>
  <Accordion title="Inne zachowania">
    - Zachowanie zakresu DM lokalnego wdrażania: [informacje referencyjne konfiguracji CLI](/pl/start/wizard-cli-reference#outputs-and-internals).
    - Najszybszy pierwszy czat: `openclaw dashboard` (Control UI, bez konfiguracji kanału).
    - Dostawca niestandardowy: połącz dowolny punkt końcowy zgodny z OpenAI lub Anthropic, w tym hostowanych dostawców, których nie ma na liście. Użyj Nieznany, aby wykryć automatycznie.
    - Jeśli wykryty zostanie stan Hermes, wdrażanie oferuje przepływ migracji. Użyj [Migruj](/pl/cli/migrate), aby uzyskać plany próbne, tryb nadpisywania, raporty i dokładne mapowania.

  </Accordion>
</AccordionGroup>

## Typowe polecenia uzupełniające

```bash
openclaw configure
openclaw agents add <name>
```

<Note>
`--json` nie oznacza trybu nieinteraktywnego. Użyj `--non-interactive` dla skryptów.
</Note>
