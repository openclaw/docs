---
read_when:
    - Potrzebujesz konfiguracji z przewodnikiem dla Gateway, obszaru roboczego, uwierzytelniania, kanałów i Skills
summary: Referencja CLI dla `openclaw onboard` (interaktywne wdrażanie)
title: Wprowadzenie
x-i18n:
    generated_at: "2026-06-27T17:22:40Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4ffee6b90e72f1859634fbd7ccac2f44e88bc37879b9e5b099c33b760cc0e9af
    source_path: cli/onboard.md
    workflow: 16
---

# `openclaw onboard`

Pełne prowadzone wdrażanie dla lokalnej lub zdalnej konfiguracji Gateway. Użyj tego, gdy chcesz, aby OpenClaw przeprowadził przez uwierzytelnianie modelu, obszar roboczy, Gateway, kanały, Skills i stan zdrowia w jednym przepływie.

## Powiązane przewodniki

<CardGroup cols={2}>
  <Card title="Centrum wdrażania CLI" href="/pl/start/wizard" icon="rocket">
    Przewodnik po interaktywnym przepływie CLI.
  </Card>
  <Card title="Omówienie wdrażania" href="/pl/start/onboarding-overview" icon="map">
    Jak elementy wdrażania OpenClaw współpracują ze sobą.
  </Card>
  <Card title="Dokumentacja konfiguracji CLI" href="/pl/start/wizard-cli-reference" icon="book">
    Wyniki, szczegóły wewnętrzne i zachowanie poszczególnych kroków.
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

`--flow import` używa dostawców migracji należących do pluginów, takich jak Hermes. Działa tylko na świeżej konfiguracji OpenClaw; jeśli istniejąca konfiguracja, poświadczenia, sesje albo pliki pamięci/tożsamości obszaru roboczego są obecne, zresetuj je albo wybierz świeżą konfigurację przed importem.

`--modern` uruchamia podgląd konwersacyjnego wdrażania Crestodian. Bez
`--modern` polecenie `openclaw onboard` zachowuje klasyczny przepływ wdrażania.

W świeżej instalacji, w której brakuje aktywnego pliku konfiguracji albo nie ma on
ustawień utworzonych przez użytkownika (jest pusty albo zawiera tylko metadane), samo `openclaw` również uruchamia klasyczny
przepływ wdrażania. Gdy plik konfiguracji zawiera ustawienia utworzone przez użytkownika, samo `openclaw`
otwiera zamiast tego Crestodian.

Zwykły tekst `ws://` jest akceptowany dla loopback, literalnych prywatnych adresów IP, `.local` oraz
adresów URL Gateway w Tailnet `*.ts.net`. Dla innych zaufanych nazw prywatnego DNS ustaw
`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` w środowisku procesu wdrażania.

## Ustawienia regionalne

Interaktywne wdrażanie używa ustawień regionalnych kreatora CLI dla stałych tekstów konfiguracji. Kolejność
rozpoznawania to:

1. `OPENCLAW_LOCALE`
2. `LC_ALL`
3. `LC_MESSAGES`
4. `LANG`
5. Angielski jako fallback

Obsługiwane ustawienia regionalne kreatora to `en`, `zh-CN` i `zh-TW`. Wartości ustawień regionalnych mogą używać
podkreśleń albo form z sufiksami POSIX, takich jak `zh_CN.UTF-8`. Nazwy produktów, nazwy poleceń,
klucze konfiguracji, adresy URL, identyfikatory dostawców, identyfikatory modeli oraz etykiety pluginów/kanałów
pozostają dosłowne.

Przykład:

```bash
OPENCLAW_LOCALE=zh-CN openclaw onboard
```

Nieinteraktywny dostawca niestandardowy:

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
Użyj `--custom-compatibility openai-responses` dla punktów końcowych zgodnych z OpenAI, które obsługują `/v1/responses`, ale nie `/v1/chat/completions`.

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

`--custom-base-url` domyślnie ma wartość `http://127.0.0.1:11434`. `--custom-model-id` jest opcjonalne; jeśli zostanie pominięte, wdrażanie używa sugerowanych wartości domyślnych Ollama. Identyfikatory modeli chmurowych, takie jak `kimi-k2.5:cloud`, również tu działają.

Przechowuj klucze dostawców jako odwołania zamiast zwykłego tekstu:

```bash
openclaw onboard --non-interactive \
  --auth-choice openai-api-key \
  --secret-input-mode ref \
  --accept-risk
```

Z `--secret-input-mode ref` wdrażanie zapisuje odwołania oparte na zmiennych środowiskowych zamiast wartości kluczy w zwykłym tekście.
Dla dostawców opartych na profilach uwierzytelniania zapisuje to wpisy `keyRef`; dla dostawców niestandardowych zapisuje `models.providers.<id>.apiKey` jako odwołanie env (na przykład `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`).

Kontrakt nieinteraktywnego trybu `ref`:

- Ustaw zmienną środowiskową dostawcy w środowisku procesu wdrażania (na przykład `OPENAI_API_KEY`).
- Nie przekazuj wbudowanych flag kluczy (na przykład `--openai-api-key`), chyba że ta zmienna środowiskowa też jest ustawiona.
- Jeśli wbudowana flaga klucza zostanie przekazana bez wymaganej zmiennej środowiskowej, wdrażanie szybko kończy się niepowodzeniem z instrukcjami.

Opcje tokenu Gateway w trybie nieinteraktywnym:

- `--gateway-auth token --gateway-token <token>` przechowuje token w zwykłym tekście.
- `--gateway-auth token --gateway-token-ref-env <name>` przechowuje `gateway.auth.token` jako env SecretRef.
- `--gateway-token` i `--gateway-token-ref-env` wzajemnie się wykluczają.
- `--gateway-token-ref-env` wymaga niepustej zmiennej środowiskowej w środowisku procesu wdrażania.
- Z `--install-daemon`, gdy uwierzytelnianie tokenem wymaga tokenu, tokeny Gateway zarządzane przez SecretRef są walidowane, ale nie są utrwalane jako rozwiązany zwykły tekst w metadanych środowiska usługi supervisora.
- Z `--install-daemon`, jeśli tryb tokenu wymaga tokenu, a skonfigurowane SecretRef tokenu jest nierozwiązane, wdrażanie kończy się niepowodzeniem w trybie zamkniętym z instrukcjami naprawy.
- Z `--install-daemon`, jeśli skonfigurowane są zarówno `gateway.auth.token`, jak i `gateway.auth.password`, a `gateway.auth.mode` nie jest ustawione, wdrażanie blokuje instalację, dopóki tryb nie zostanie ustawiony jawnie.
- Lokalne wdrażanie zapisuje `gateway.mode="local"` w konfiguracji. Jeśli w późniejszym pliku konfiguracji brakuje `gateway.mode`, traktuj to jako uszkodzenie konfiguracji albo niekompletną ręczną edycję, a nie jako prawidłowy skrót trybu lokalnego.
- Lokalne wdrażanie instaluje wybrane pluginy do pobrania, gdy wymaga ich wybrana ścieżka konfiguracji.
- Zdalne wdrażanie zapisuje tylko informacje o połączeniu ze zdalnym Gateway i nie instaluje lokalnych pakietów pluginów.
- `--allow-unconfigured` jest osobną furtką awaryjną środowiska uruchomieniowego Gateway. Nie oznacza, że wdrażanie może pominąć `gateway.mode`.

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

- O ile nie przekażesz `--skip-health`, wdrażanie czeka na osiągalny lokalny Gateway, zanim zakończy się powodzeniem.
- `--install-daemon` najpierw uruchamia ścieżkę instalacji zarządzanego Gateway. Bez niej musisz mieć już uruchomiony lokalny Gateway, na przykład `openclaw gateway run`.
- Jeśli w automatyzacji chcesz tylko zapisy konfiguracji/obszaru roboczego/bootstrapu, użyj `--skip-health`.
- Jeśli samodzielnie zarządzasz plikami obszaru roboczego, przekaż `--skip-bootstrap`, aby ustawić `agents.defaults.skipBootstrap: true` i pominąć tworzenie `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md` i `BOOTSTRAP.md`.
- W natywnym Windows `--install-daemon` najpierw próbuje użyć Zaplanowanych zadań, a jeśli utworzenie zadania zostanie odrzucone, wraca do elementu logowania w folderze Startup użytkownika.

Zachowanie interaktywnego wdrażania w trybie odwołań:

- Wybierz **Użyj odwołania do sekretu**, gdy pojawi się monit.
- Następnie wybierz jedną z opcji:
  - Zmienna środowiskowa
  - Skonfigurowany dostawca sekretów (`file` albo `exec`)
- Wdrażanie wykonuje szybką walidację preflight przed zapisaniem odwołania.
  - Jeśli walidacja się nie powiedzie, wdrażanie pokazuje błąd i pozwala spróbować ponownie.

### Nieinteraktywne wybory punktu końcowego Z.AI

<Note>
`--auth-choice zai-api-key` automatycznie wykrywa najlepszy punkt końcowy Z.AI i model dla
Twojego klucza. Punkty końcowe Coding Plan preferują `zai/glm-5.2`; ogólne punkty końcowe API używają
`zai/glm-5.1`. Aby wymusić punkt końcowy Coding Plan, wybierz `zai-coding-global` albo
`zai-coding-cn`.
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
    - `manual`: pełne monity dotyczące portu, adresu powiązania i uwierzytelniania (alias `advanced`).
    - `import`: uruchamia wykrytego dostawcę migracji, pokazuje podgląd planu, a następnie stosuje go po potwierdzeniu.

  </Accordion>
  <Accordion title="Wstępne filtrowanie dostawców">
    Gdy wybór uwierzytelniania implikuje preferowanego dostawcę, wdrażanie wstępnie filtruje selektory modelu domyślnego i allowlisty do tego dostawcy. Dla Volcengine i BytePlus dopasowuje to również warianty coding-plan (`volcengine-plan/*`, `byteplus-plan/*`).

    Jeśli filtr preferowanego dostawcy nie zwróci jeszcze żadnych załadowanych modeli, wdrażanie wraca do niefiltrowanego katalogu zamiast zostawiać selektor pusty.

  </Accordion>
  <Accordion title="Dodatkowe monity wyszukiwania w sieci">
    Niektórzy dostawcy wyszukiwania w sieci wyzwalają dodatkowe monity specyficzne dla dostawcy:

    - **Grok** może zaoferować opcjonalną konfigurację `x_search` z tym samym profilem OAuth xAI albo kluczem API i wyborem modelu `x_search`.
    - **Kimi** może zapytać o region API Moonshot (`api.moonshot.ai` kontra `api.moonshot.cn`) oraz domyślny model wyszukiwania w sieci Kimi.

  </Accordion>
  <Accordion title="Inne zachowania">
    - Zachowanie zakresu DM lokalnego wdrażania: [Dokumentacja konfiguracji CLI](/pl/start/wizard-cli-reference#outputs-and-internals).
    - Najszybszy pierwszy czat: `openclaw dashboard` (Control UI, bez konfiguracji kanału).
    - Dostawca niestandardowy: połącz dowolny punkt końcowy zgodny z OpenAI lub Anthropic, w tym hostowanych dostawców spoza listy. Użyj Unknown, aby wykryć automatycznie.
    - Jeśli zostanie wykryty stan Hermes, wdrażanie oferuje przepływ migracji. Użyj [Migrate](/pl/cli/migrate), aby uzyskać plany dry-run, tryb nadpisywania, raporty i dokładne mapowania.

  </Accordion>
</AccordionGroup>

## Typowe polecenia uzupełniające

```bash
openclaw channels add
openclaw configure
openclaw agents add <name>
```

Użyj zamiast tego `openclaw setup`, gdy potrzebujesz tylko bazowej konfiguracji/obszaru roboczego. Użyj później `openclaw configure` do ukierunkowanych zmian i `openclaw channels add` do konfiguracji wyłącznie kanałów.

<Note>
`--json` nie oznacza trybu nieinteraktywnego. Użyj `--non-interactive` dla skryptów.
</Note>
