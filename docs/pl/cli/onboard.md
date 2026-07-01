---
read_when:
    - Chcesz wspomaganej konfiguracji Gateway, obszaru roboczego, uwierzytelniania, kanałów i Skills
summary: Dokumentacja CLI dla `openclaw onboard` (interaktywne wdrażanie)
title: Wprowadzenie
x-i18n:
    generated_at: "2026-07-01T13:24:57Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b8f1f1b1e4f3a9e3c544efede027d50123050660a999ae61573e41cd466bbfa4
    source_path: cli/onboard.md
    workflow: 16
---

# `openclaw onboard`

Pełny prowadzony proces konfiguracji początkowej dla lokalnej lub zdalnej konfiguracji Gateway. Użyj go, gdy chcesz, aby OpenClaw przeprowadził w jednym przepływie przez uwierzytelnianie modelu, obszar roboczy, Gateway, kanały, skills i stan zdrowia.

## Powiązane przewodniki

<CardGroup cols={2}>
  <Card title="CLI onboarding hub" href="/pl/start/wizard" icon="rocket">
    Przewodnik po interaktywnym przepływie CLI.
  </Card>
  <Card title="Onboarding overview" href="/pl/start/onboarding-overview" icon="map">
    Jak elementy onboardingu OpenClaw łączą się ze sobą.
  </Card>
  <Card title="CLI setup reference" href="/pl/start/wizard-cli-reference" icon="book">
    Dane wyjściowe, mechanika wewnętrzna i zachowanie poszczególnych kroków.
  </Card>
  <Card title="CLI automation" href="/pl/start/wizard-cli-automation" icon="terminal">
    Flagi nieinteraktywne i konfiguracje skryptowe.
  </Card>
  <Card title="macOS app onboarding" href="/pl/start/onboarding" icon="apple">
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

`--flow import` używa dostawców migracji należących do pluginów, takich jak Hermes. Działa tylko na świeżej konfiguracji OpenClaw; jeśli istniejąca konfiguracja, poświadczenia, sesje albo pliki pamięci/tożsamości obszaru roboczego są obecne, zresetuj konfigurację albo wybierz świeżą konfigurację przed importem.

`--modern` uruchamia podgląd konwersacyjnego onboardingu Crestodian. Bez
`--modern` polecenie `openclaw onboard` zachowuje klasyczny przepływ onboardingu.

W świeżej instalacji, gdy brakuje aktywnego pliku konfiguracji albo nie ma on
ustawień utworzonych przez użytkownika (jest pusty albo zawiera tylko metadane), samo `openclaw` również uruchamia klasyczny
przepływ onboardingu. Gdy plik konfiguracji ma już ustawienia utworzone przez użytkownika, samo `openclaw`
otwiera zamiast tego Crestodian.

Zwykły tekst `ws://` jest akceptowany dla local loopback, literałów prywatnych adresów IP, `.local` i
adresów URL Gateway w Tailnet `*.ts.net`. Dla innych zaufanych nazw prywatnego DNS ustaw
`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` w środowisku procesu onboardingu.

## Ustawienia regionalne

Interaktywny onboarding używa ustawień regionalnych kreatora CLI dla stałych tekstów konfiguracji. Kolejność
rozstrzygania to:

1. `OPENCLAW_LOCALE`
2. `LC_ALL`
3. `LC_MESSAGES`
4. `LANG`
5. Awaryjnie angielski

Obsługiwane ustawienia regionalne kreatora to `en`, `zh-CN` i `zh-TW`. Wartości ustawień regionalnych mogą używać
podkreślnika albo sufiksów POSIX, takich jak `zh_CN.UTF-8`. Nazwy produktów, nazwy poleceń,
klucze konfiguracji, adresy URL, identyfikatory dostawców, identyfikatory modeli oraz etykiety pluginów/kanałów
pozostają dosłowne.

Przykład:

```bash
OPENCLAW_LOCALE=zh-CN openclaw onboard
```

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

`--custom-api-key` jest opcjonalne w trybie nieinteraktywnym. Jeśli zostanie pominięte, onboarding sprawdza `CUSTOM_API_KEY`.
OpenClaw automatycznie oznacza typowe identyfikatory modeli wizyjnych jako obsługujące obrazy. Przekaż `--custom-image-input` dla nieznanych niestandardowych identyfikatorów modeli wizyjnych albo `--custom-text-input`, aby wymusić metadane tylko tekstowe.
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

`--custom-base-url` domyślnie ma wartość `http://127.0.0.1:11434`. `--custom-model-id` jest opcjonalne; jeśli zostanie pominięte, onboarding używa sugerowanych wartości domyślnych Ollama. Identyfikatory modeli chmurowych, takie jak `kimi-k2.5:cloud`, również tu działają.

Przechowuj klucze dostawców jako referencje zamiast zwykłego tekstu:

```bash
openclaw onboard --non-interactive \
  --auth-choice openai-api-key \
  --secret-input-mode ref \
  --accept-risk
```

Z `--secret-input-mode ref` onboarding zapisuje referencje oparte na zmiennych środowiskowych zamiast wartości kluczy w zwykłym tekście.
Dla dostawców opartych na profilach uwierzytelniania zapisuje to wpisy `keyRef`; dla niestandardowych dostawców zapisuje `models.providers.<id>.apiKey` jako referencję środowiskową (na przykład `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`).

Kontrakt nieinteraktywnego trybu `ref`:

- Ustaw zmienną środowiskową dostawcy w środowisku procesu onboardingu (na przykład `OPENAI_API_KEY`).
- Nie przekazuj wbudowanych flag kluczy (na przykład `--openai-api-key`), chyba że ta zmienna środowiskowa jest również ustawiona.
- Jeśli wbudowana flaga klucza zostanie przekazana bez wymaganej zmiennej środowiskowej, onboarding szybko kończy się niepowodzeniem z instrukcjami.

Opcje tokenu Gateway w trybie nieinteraktywnym:

- `--gateway-auth token --gateway-token <token>` przechowuje token w zwykłym tekście.
- `--gateway-auth token --gateway-token-ref-env <name>` przechowuje `gateway.auth.token` jako środowiskowy SecretRef.
- `--gateway-token` i `--gateway-token-ref-env` wzajemnie się wykluczają.
- `--gateway-token-ref-env` wymaga niepustej zmiennej środowiskowej w środowisku procesu onboardingu.
- Z `--install-daemon`, gdy uwierzytelnianie tokenem wymaga tokenu, tokeny Gateway zarządzane przez SecretRef są walidowane, ale nie są utrwalane jako rozstrzygnięty zwykły tekst w metadanych środowiska usługi nadzorcy.
- Z `--install-daemon`, jeśli tryb tokenu wymaga tokenu, a skonfigurowany SecretRef tokenu jest nierozstrzygnięty, onboarding kończy się zamknięciem z instrukcjami naprawy.
- Z `--install-daemon`, jeśli skonfigurowane są zarówno `gateway.auth.token`, jak i `gateway.auth.password`, a `gateway.auth.mode` nie jest ustawione, onboarding blokuje instalację do czasu jawnego ustawienia trybu.
- Lokalny onboarding zapisuje `gateway.mode="local"` w konfiguracji. Jeśli w późniejszym pliku konfiguracji brakuje `gateway.mode`, potraktuj to jako uszkodzenie konfiguracji albo niepełną ręczną edycję, a nie jako prawidłowy skrót trybu lokalnego.
- Lokalny onboarding instaluje wybrane pluginy do pobrania, gdy wymaga ich wybrana ścieżka konfiguracji.
- Zdalny onboarding zapisuje tylko informacje połączenia dla zdalnego Gateway i nie instaluje lokalnych pakietów pluginów.
- `--allow-unconfigured` to osobna awaryjna ścieżka wykonawcza Gateway. Nie oznacza, że onboarding może pominąć `gateway.mode`.

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

Nieinteraktywny stan zdrowia lokalnego Gateway:

- O ile nie przekażesz `--skip-health`, onboarding czeka na osiągalny lokalny Gateway, zanim zakończy się powodzeniem.
- `--install-daemon` najpierw uruchamia zarządzaną ścieżkę instalacji Gateway. Bez niej musisz już mieć działający lokalny Gateway, na przykład `openclaw gateway run`.
- Jeśli w automatyzacji chcesz tylko zapisów konfiguracji/obszaru roboczego/bootstrapu, użyj `--skip-health`.
- Jeśli samodzielnie zarządzasz plikami obszaru roboczego, przekaż `--skip-bootstrap`, aby ustawić `agents.defaults.skipBootstrap: true` i pominąć tworzenie `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md` i `BOOTSTRAP.md`.
- W natywnym Windows `--install-daemon` najpierw próbuje użyć Zaplanowanych zadań, a jeśli tworzenie zadania zostanie odmówione, przechodzi awaryjnie do elementu logowania w folderze Autostart dla użytkownika.

Zachowanie interaktywnego onboardingu w trybie referencji:

- Wybierz **Użyj referencji sekretu** po wyświetleniu monitu.
- Następnie wybierz jedno z:
  - Zmienna środowiskowa
  - Skonfigurowany dostawca sekretów (`file` lub `exec`)
- Onboarding wykonuje szybką walidację wstępną przed zapisaniem referencji.
  - Jeśli walidacja się nie powiedzie, onboarding pokazuje błąd i pozwala spróbować ponownie.

### Nieinteraktywne wybory punktu końcowego Z.AI

<Note>
`--auth-choice zai-api-key` automatycznie wykrywa najlepszy punkt końcowy i model Z.AI dla
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

## Dodatkowe flagi nieinteraktywne

Uwierzytelnianie modelu oparte na tokenie (nieinteraktywne; używane z `--auth-choice token`):

- `--token-provider <id>` — identyfikator dostawcy tokenu. Określa, który dostawca wydaje token.
- `--token <token>` — wartość tokenu do uwierzytelniania modelu.
- `--token-profile-id <id>` — identyfikator profilu uwierzytelniania. Ogólne przechowywanie tokenów domyślnie używa `<provider>:manual`; przepływy konfiguracji należące do dostawcy mogą używać własnej wartości domyślnej, takiej jak `anthropic:default`.
- `--token-expires-in <duration>` — opcjonalny czas wygaśnięcia tokenu (np. `365d`, `12h`).

Cloudflare AI Gateway (nieinteraktywnie):

- `--cloudflare-ai-gateway-account-id <id>` — identyfikator konta Cloudflare do routingu przez Cloudflare AI Gateway.
- `--cloudflare-ai-gateway-gateway-id <id>` — identyfikator Cloudflare AI Gateway.

Kontrola instalacji demona:

- `--no-install-daemon` — jawnie pomiń instalację usługi Gateway.
- `--skip-daemon` — alias dla `--no-install-daemon`.

Kontrola konfiguracji UI i hooków:

- `--skip-ui` — pomiń monity Control UI / TUI podczas onboardingu.
- `--skip-hooks` — pomiń monity konfiguracji webhooka / hooka podczas onboardingu.

Wyciszenie danych wyjściowych:

- `--suppress-gateway-token-output` — wycisz dane wyjściowe Gateway/UI zawierające token (wskazówki tokenu, adres URL automatycznego logowania z osadzonym tokenem i automatyczne uruchomienie Control UI). Przydatne we współdzielonych terminalach i środowiskach CI.

## Uwagi dotyczące przepływu

<AccordionGroup>
  <Accordion title="Flow types">
    - `quickstart`: minimalne monity, automatycznie generuje token Gateway.
    - `manual`: pełne monity dotyczące portu, wiązania i uwierzytelniania (alias `advanced`).
    - `import`: uruchamia wykrytego dostawcę migracji, wyświetla podgląd planu, a następnie stosuje go po potwierdzeniu.

  </Accordion>
  <Accordion title="Provider prefiltering">
    Gdy wybór uwierzytelniania sugeruje preferowanego dostawcę, onboarding wstępnie filtruje selektory modelu domyślnego i allowlisty do tego dostawcy. Dla Volcengine i BytePlus dopasowuje to również warianty coding-plan (`volcengine-plan/*`, `byteplus-plan/*`).

    Jeśli filtr preferowanego dostawcy nie zwraca jeszcze żadnych załadowanych modeli, onboarding przechodzi awaryjnie do niefiltrowanego katalogu zamiast zostawiać selektor pusty.

  </Accordion>
  <Accordion title="Web-search follow-ups">
    Niektórzy dostawcy wyszukiwania w sieci uruchamiają monity uzupełniające specyficzne dla dostawcy:

    - **Grok** może zaoferować opcjonalną konfigurację `x_search` z tym samym profilem OAuth xAI lub kluczem API oraz wyborem modelu `x_search`.
    - **Kimi** może zapytać o region API Moonshot (`api.moonshot.ai` vs `api.moonshot.cn`) i domyślny model wyszukiwania w sieci Kimi.

  </Accordion>
  <Accordion title="Other behaviors">
    - Zachowanie zakresu DM lokalnego onboardingu: [referencja konfiguracji CLI](/pl/start/wizard-cli-reference#outputs-and-internals).
    - Najszybszy pierwszy czat: `openclaw dashboard` (Control UI, bez konfiguracji kanału).
    - Niestandardowy dostawca: połącz dowolny punkt końcowy zgodny z OpenAI lub Anthropic, w tym hostowanych dostawców spoza listy. Użyj Unknown, aby wykryć automatycznie.
    - Jeśli zostanie wykryty stan Hermes, onboarding oferuje przepływ migracji. Użyj [Migrate](/pl/cli/migrate) dla planów dry-run, trybu nadpisywania, raportów i dokładnych mapowań.

  </Accordion>
</AccordionGroup>

## Typowe polecenia uzupełniające

```bash
openclaw channels add
openclaw configure
openclaw agents add <name>
```

Użyj `openclaw setup` jako tego samego prowadzonego punktu wejścia onboardingu. Użyj `openclaw setup --baseline`, gdy potrzebujesz tylko bazowej konfiguracji/obszaru roboczego, później `openclaw configure` do ukierunkowanych zmian oraz `openclaw channels add` do konfiguracji wyłącznie kanałów.

<Note>
`--json` nie oznacza trybu nieinteraktywnego. W skryptach używaj `--non-interactive`.
</Note>
