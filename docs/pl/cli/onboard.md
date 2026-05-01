---
read_when:
    - Potrzebujesz konfiguracji z przewodnikiem dla Gateway, obszaru roboczego, uwierzytelniania, kanałów i Skills
summary: Dokumentacja referencyjna CLI dla `openclaw onboard` (interaktywne wdrażanie)
title: Wprowadzenie
x-i18n:
    generated_at: "2026-05-01T09:57:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1276a0b20f37da470bb4d49b38d06bacc38e7d0e85737a22971a2a9a3d90e244
    source_path: cli/onboard.md
    workflow: 16
---

# `openclaw onboard`

Interaktywny onboarding do konfiguracji lokalnego lub zdalnego Gateway.

## Powiązane przewodniki

<CardGroup cols={2}>
  <Card title="Centrum onboardingu CLI" href="/pl/start/wizard" icon="rocket">
    Przewodnik po interaktywnym przepływie CLI.
  </Card>
  <Card title="Omówienie onboardingu" href="/pl/start/onboarding-overview" icon="map">
    Jak elementy onboardingu OpenClaw łączą się ze sobą.
  </Card>
  <Card title="Dokumentacja konfiguracji CLI" href="/pl/start/wizard-cli-reference" icon="book">
    Dane wyjściowe, mechanizmy wewnętrzne i zachowanie poszczególnych kroków.
  </Card>
  <Card title="Automatyzacja CLI" href="/pl/start/wizard-cli-automation" icon="terminal">
    Flagi nieinteraktywne i skryptowane konfiguracje.
  </Card>
  <Card title="Onboarding aplikacji macOS" href="/pl/start/onboarding" icon="apple">
    Przepływ onboardingu dla aplikacji paska menu macOS.
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

`--flow import` używa dostawców migracji należących do pluginów, takich jak Hermes. Działa tylko wobec świeżej konfiguracji OpenClaw; jeśli istnieją już konfiguracja, dane uwierzytelniające, sesje albo pliki pamięci/tożsamości obszaru roboczego, zresetuj je albo wybierz świeżą konfigurację przed importem.

`--modern` uruchamia podgląd konwersacyjnego onboardingu Crestodian. Bez
`--modern`, `openclaw onboard` zachowuje klasyczny przepływ onboardingu.

Dla zwykłotekstowych celów `ws://` w sieci prywatnej (tylko zaufane sieci), ustaw
`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` w środowisku procesu onboardingu.
Nie istnieje odpowiednik `openclaw.json` dla tego awaryjnego obejścia
transportu po stronie klienta.

Nieinteraktywny niestandardowy dostawca:

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

`--custom-api-key` jest opcjonalne w trybie nieinteraktywnym. Jeśli zostanie pominięte, onboarding sprawdza `CUSTOM_API_KEY`.
OpenClaw automatycznie oznacza popularne identyfikatory modeli wizyjnych jako obsługujące obrazy. Przekaż `--custom-image-input` dla nieznanych identyfikatorów niestandardowych modeli wizyjnych albo `--custom-text-input`, aby wymusić metadane wyłącznie tekstowe.

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

`--custom-base-url` domyślnie ma wartość `http://127.0.0.1:11434`. `--custom-model-id` jest opcjonalne; jeśli zostanie pominięte, onboarding używa sugerowanych wartości domyślnych Ollama. Identyfikatory modeli chmurowych, takie jak `kimi-k2.5:cloud`, także tutaj działają.

Przechowuj klucze dostawców jako odwołania zamiast zwykłego tekstu:

```bash
openclaw onboard --non-interactive \
  --auth-choice openai-api-key \
  --secret-input-mode ref \
  --accept-risk
```

Z `--secret-input-mode ref` onboarding zapisuje odwołania oparte na zmiennych środowiskowych zamiast wartości kluczy w postaci zwykłego tekstu.
Dla dostawców opartych na profilach uwierzytelniania zapisuje to wpisy `keyRef`; dla dostawców niestandardowych zapisuje to `models.providers.<id>.apiKey` jako odwołanie do zmiennej środowiskowej (na przykład `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`).

Kontrakt nieinteraktywnego trybu `ref`:

- Ustaw zmienną środowiskową dostawcy w środowisku procesu onboardingu (na przykład `OPENAI_API_KEY`).
- Nie przekazuj wbudowanych flag klucza (na przykład `--openai-api-key`), chyba że ta zmienna środowiskowa jest także ustawiona.
- Jeśli wbudowana flaga klucza zostanie przekazana bez wymaganej zmiennej środowiskowej, onboarding szybko kończy się niepowodzeniem z instrukcjami.

Opcje tokenu Gateway w trybie nieinteraktywnym:

- `--gateway-auth token --gateway-token <token>` przechowuje token w postaci zwykłego tekstu.
- `--gateway-auth token --gateway-token-ref-env <name>` przechowuje `gateway.auth.token` jako środowiskowy SecretRef.
- `--gateway-token` i `--gateway-token-ref-env` wzajemnie się wykluczają.
- `--gateway-token-ref-env` wymaga niepustej zmiennej środowiskowej w środowisku procesu onboardingu.
- Z `--install-daemon`, gdy uwierzytelnianie tokenem wymaga tokenu, tokeny gateway zarządzane przez SecretRef są walidowane, ale nie są utrwalane jako rozwiązany zwykły tekst w metadanych środowiska usługi nadzorcy.
- Z `--install-daemon`, jeśli tryb tokenu wymaga tokenu, a skonfigurowany SecretRef tokenu jest nierozwiązany, onboarding kończy się w trybie zamkniętym z instrukcjami naprawy.
- Z `--install-daemon`, jeśli skonfigurowane są zarówno `gateway.auth.token`, jak i `gateway.auth.password`, a `gateway.auth.mode` nie jest ustawione, onboarding blokuje instalację do czasu jawnego ustawienia trybu.
- Lokalny onboarding zapisuje `gateway.mode="local"` w konfiguracji. Jeśli w późniejszym pliku konfiguracji brakuje `gateway.mode`, traktuj to jako uszkodzenie konfiguracji albo niepełną ręczną edycję, a nie jako prawidłowy skrót trybu lokalnego.
- Lokalny onboarding materializuje nowo wymagane zależności uruchomieniowe dołączonych pluginów po zapisaniu konfiguracji, zanim będą kontynuowane obszar roboczy/bootstrap, instalacja daemona lub kontrole kondycji. To wąski krok naprawy menedżera pakietów, a nie pełne uruchomienie `openclaw doctor`.
- Zdalny onboarding zapisuje tylko informacje o połączeniu dla zdalnego Gateway i nie instaluje lokalnych zależności dołączonych pluginów.
- `--allow-unconfigured` to osobny awaryjny mechanizm środowiska uruchomieniowego Gateway. Nie oznacza, że onboarding może pominąć `gateway.mode`.

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

Kondycja lokalnego gateway w trybie nieinteraktywnym:

- O ile nie przekażesz `--skip-health`, onboarding czeka na osiągalny lokalny gateway, zanim zakończy się powodzeniem.
- `--install-daemon` najpierw uruchamia ścieżkę zarządzanej instalacji gateway. Bez niej lokalny gateway musi już działać, na przykład `openclaw gateway run`.
- Jeśli w automatyzacji chcesz wyłącznie zapisy konfiguracji/obszaru roboczego/bootstrapu, użyj `--skip-health`.
- Jeśli samodzielnie zarządzasz plikami obszaru roboczego, przekaż `--skip-bootstrap`, aby ustawić `agents.defaults.skipBootstrap: true` i pominąć tworzenie `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md` oraz `BOOTSTRAP.md`.
- W natywnym Windows `--install-daemon` najpierw próbuje użyć Zaplanowanych zadań, a jeśli tworzenie zadania zostanie odrzucone, przechodzi do elementu logowania w folderze Autostart dla użytkownika.

Zachowanie interaktywnego onboardingu w trybie odwołań:

- Wybierz **Użyj odwołania do sekretu**, gdy pojawi się monit.
- Następnie wybierz jedno z:
  - Zmienna środowiskowa
  - Skonfigurowany dostawca sekretów (`file` albo `exec`)
- Onboarding wykonuje szybką walidację wstępną przed zapisaniem odwołania.
  - Jeśli walidacja się nie powiedzie, onboarding pokazuje błąd i pozwala spróbować ponownie.

### Nieinteraktywne wybory punktu końcowego Z.AI

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
    - `quickstart`: minimalne monity, automatycznie generuje token gateway.
    - `manual`: pełne monity dotyczące portu, powiązania i uwierzytelniania (alias `advanced`).
    - `import`: uruchamia wykrytego dostawcę migracji, wyświetla podgląd planu, a następnie stosuje go po potwierdzeniu.

  </Accordion>
  <Accordion title="Wstępne filtrowanie dostawców">
    Gdy wybór uwierzytelniania implikuje preferowanego dostawcę, onboarding wstępnie filtruje selektory modelu domyślnego i listy dozwolonych do tego dostawcy. W przypadku Volcengine i BytePlus dopasowuje to także warianty planu kodowania (`volcengine-plan/*`, `byteplus-plan/*`).

    Jeśli filtr preferowanego dostawcy nie zwróci jeszcze żadnych załadowanych modeli, onboarding wraca do niefiltrowanego katalogu zamiast pozostawiać selektor pusty.

  </Accordion>
  <Accordion title="Dodatkowe monity wyszukiwania w sieci">
    Niektórzy dostawcy wyszukiwania w sieci wyzwalają dodatkowe monity specyficzne dla dostawcy:

    - **Grok** może zaoferować opcjonalną konfigurację `x_search` z tym samym `XAI_API_KEY` i wyborem modelu `x_search`.
    - **Kimi** może zapytać o region API Moonshot (`api.moonshot.ai` albo `api.moonshot.cn`) oraz domyślny model wyszukiwania w sieci Kimi.

  </Accordion>
  <Accordion title="Inne zachowania">
    - Zachowanie zakresu lokalnego onboardingu DM: [dokumentacja konfiguracji CLI](/pl/start/wizard-cli-reference#outputs-and-internals).
    - Najszybszy pierwszy czat: `openclaw dashboard` (Control UI, bez konfiguracji kanału).
    - Dostawca niestandardowy: połącz dowolny punkt końcowy zgodny z OpenAI lub Anthropic, w tym dostawców hostowanych niewymienionych na liście. Użyj Unknown, aby wykryć automatycznie.
    - Jeśli wykryto stan Hermes, onboarding oferuje przepływ migracji. Użyj [Migrate](/pl/cli/migrate), aby uzyskać plany dry-run, tryb nadpisywania, raporty i dokładne mapowania.

  </Accordion>
</AccordionGroup>

## Typowe polecenia następcze

```bash
openclaw configure
openclaw agents add <name>
```

<Note>
`--json` nie oznacza trybu nieinteraktywnego. Użyj `--non-interactive` w skryptach.
</Note>
