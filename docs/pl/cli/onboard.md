---
read_when:
    - Chcesz skorzystać z prowadzonej konfiguracji gateway, obszaru roboczego, uwierzytelniania, kanałów i Skills
summary: Dokumentacja referencyjna CLI dla `openclaw onboard` (interaktywne wdrażanie)
title: Wprowadzenie
x-i18n:
    generated_at: "2026-06-30T22:36:59Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6e0a3c2dea3f8116bb3282d5fb160cf34d9a6f0eefcc072abcff2287d5801184
    source_path: cli/onboard.md
    workflow: 16
---

# `openclaw onboard`

Pełna prowadzona konfiguracja początkowa dla lokalnej lub zdalnej konfiguracji Gateway. Użyj tego, gdy chcesz, aby OpenClaw przeprowadził Cię przez uwierzytelnianie modelu, obszar roboczy, Gateway, kanały, Skills i stan kondycji w jednym przepływie.

## Powiązane przewodniki

<CardGroup cols={2}>
  <Card title="Centrum konfiguracji początkowej CLI" href="/pl/start/wizard" icon="rocket">
    Przewodnik po interaktywnym przepływie CLI.
  </Card>
  <Card title="Omówienie konfiguracji początkowej" href="/pl/start/onboarding-overview" icon="map">
    Jak konfiguracja początkowa OpenClaw łączy się w całość.
  </Card>
  <Card title="Dokumentacja konfiguracji CLI" href="/pl/start/wizard-cli-reference" icon="book">
    Dane wyjściowe, mechanizmy wewnętrzne i zachowanie poszczególnych kroków.
  </Card>
  <Card title="Automatyzacja CLI" href="/pl/start/wizard-cli-automation" icon="terminal">
    Flagi nieinteraktywne i skryptowane konfiguracje.
  </Card>
  <Card title="Konfiguracja początkowa aplikacji macOS" href="/pl/start/onboarding" icon="apple">
    Przepływ konfiguracji początkowej dla aplikacji paska menu macOS.
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

`--flow import` używa dostawców migracji należących do Pluginów, takich jak Hermes. Działa tylko na świeżej konfiguracji OpenClaw; jeśli istniejąca konfiguracja, dane logowania, sesje albo pliki pamięci/tożsamości obszaru roboczego są obecne, zresetuj konfigurację albo wybierz świeżą konfigurację przed importem.

`--modern` uruchamia podgląd konwersacyjnej konfiguracji początkowej Crestodian. Bez
`--modern` polecenie `openclaw onboard` zachowuje klasyczny przepływ konfiguracji początkowej.

W świeżej instalacji, w której aktywnego pliku konfiguracji brakuje albo nie ma on autorskich
ustawień (jest pusty lub zawiera tylko metadane), samo `openclaw` również uruchamia klasyczny
przepływ konfiguracji początkowej. Gdy plik konfiguracji ma już autorskie ustawienia, samo `openclaw`
otwiera zamiast tego Crestodian.

Zwykły tekst `ws://` jest akceptowany dla local loopback, literałów prywatnych adresów IP, `.local` oraz
adresów URL Gateway w Tailnet `*.ts.net`. Dla innych zaufanych nazw private-DNS ustaw
`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` w środowisku procesu konfiguracji początkowej.

## Ustawienia regionalne

Interaktywna konfiguracja początkowa używa ustawień regionalnych kreatora CLI dla stałych tekstów konfiguracji. Kolejność
rozstrzygania jest następująca:

1. `OPENCLAW_LOCALE`
2. `LC_ALL`
3. `LC_MESSAGES`
4. `LANG`
5. Rezerwowo angielski

Obsługiwane ustawienia regionalne kreatora to `en`, `zh-CN` i `zh-TW`. Wartości ustawień regionalnych mogą używać
podkreśleń albo form z sufiksami POSIX, takich jak `zh_CN.UTF-8`. Nazwy produktów, nazwy poleceń,
klucze konfiguracji, adresy URL, identyfikatory dostawców, identyfikatory modeli oraz etykiety Pluginów/kanałów
pozostają dosłowne.

Przykład:

```bash
OPENCLAW_LOCALE=zh-CN openclaw onboard
```

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

`--custom-api-key` jest opcjonalne w trybie nieinteraktywnym. Jeśli zostanie pominięte, konfiguracja początkowa sprawdza `CUSTOM_API_KEY`.
OpenClaw automatycznie oznacza typowe identyfikatory modeli wizyjnych jako obsługujące obrazy. Przekaż `--custom-image-input` dla nieznanych niestandardowych identyfikatorów wizyjnych albo `--custom-text-input`, aby wymusić metadane tylko tekstowe.
Użyj `--custom-compatibility openai-responses` dla punktów końcowych zgodnych z OpenAI, które obsługują `/v1/responses`, ale nie `/v1/chat/completions`.

LM Studio obsługuje też flagę klucza specyficzną dla dostawcy w trybie nieinteraktywnym:

```bash
openclaw onboard --non-interactive \
  --auth-choice lmstudio \
  --custom-base-url "http://localhost:1234/v1" \
  --custom-model-id "qwen/qwen3.5-9b" \
  --lmstudio-api-key "$LM_API_TOKEN" \
  --accept-risk
```

Ollama w trybie nieinteraktywnym:

```bash
openclaw onboard --non-interactive \
  --auth-choice ollama \
  --custom-base-url "http://ollama-host:11434" \
  --custom-model-id "qwen3.5:27b" \
  --accept-risk
```

`--custom-base-url` domyślnie przyjmuje `http://127.0.0.1:11434`. `--custom-model-id` jest opcjonalne; jeśli zostanie pominięte, konfiguracja początkowa używa sugerowanych wartości domyślnych Ollama. Identyfikatory modeli chmurowych, takie jak `kimi-k2.5:cloud`, też tu działają.

Przechowuj klucze dostawców jako odwołania zamiast zwykłego tekstu:

```bash
openclaw onboard --non-interactive \
  --auth-choice openai-api-key \
  --secret-input-mode ref \
  --accept-risk
```

Z `--secret-input-mode ref` konfiguracja początkowa zapisuje odwołania oparte na zmiennych środowiskowych zamiast wartości kluczy w zwykłym tekście.
Dla dostawców opartych na profilach uwierzytelniania zapisuje to wpisy `keyRef`; dla niestandardowych dostawców zapisuje `models.providers.<id>.apiKey` jako odwołanie do zmiennej środowiskowej (na przykład `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`).

Kontrakt trybu nieinteraktywnego `ref`:

- Ustaw zmienną środowiskową dostawcy w środowisku procesu konfiguracji początkowej (na przykład `OPENAI_API_KEY`).
- Nie przekazuj wbudowanych flag kluczy (na przykład `--openai-api-key`), chyba że ta zmienna środowiskowa też jest ustawiona.
- Jeśli wbudowana flaga klucza zostanie przekazana bez wymaganej zmiennej środowiskowej, konfiguracja początkowa szybko kończy się niepowodzeniem z instrukcją.

Opcje tokenu Gateway w trybie nieinteraktywnym:

- `--gateway-auth token --gateway-token <token>` przechowuje token w zwykłym tekście.
- `--gateway-auth token --gateway-token-ref-env <name>` przechowuje `gateway.auth.token` jako env SecretRef.
- `--gateway-token` i `--gateway-token-ref-env` wzajemnie się wykluczają.
- `--gateway-token-ref-env` wymaga niepustej zmiennej środowiskowej w środowisku procesu konfiguracji początkowej.
- Z `--install-daemon`, gdy uwierzytelnianie tokenem wymaga tokenu, tokeny Gateway zarządzane przez SecretRef są walidowane, ale nie są utrwalane jako rozwiązany zwykły tekst w metadanych środowiska usługi nadzorcy.
- Z `--install-daemon`, jeśli tryb tokenu wymaga tokenu, a skonfigurowany token SecretRef nie może zostać rozwiązany, konfiguracja początkowa odmawia kontynuowania z instrukcją naprawy.
- Z `--install-daemon`, jeśli skonfigurowane są zarówno `gateway.auth.token`, jak i `gateway.auth.password`, a `gateway.auth.mode` nie jest ustawione, konfiguracja początkowa blokuje instalację, dopóki tryb nie zostanie ustawiony jawnie.
- Lokalna konfiguracja początkowa zapisuje `gateway.mode="local"` w konfiguracji. Jeśli w późniejszym pliku konfiguracji brakuje `gateway.mode`, traktuj to jako uszkodzenie konfiguracji albo niekompletną ręczną edycję, a nie jako poprawny skrót trybu lokalnego.
- Lokalna konfiguracja początkowa instaluje wybrane pobieralne Pluginy, gdy wymaga ich wybrana ścieżka konfiguracji.
- Zdalna konfiguracja początkowa zapisuje tylko informacje o połączeniu dla zdalnego Gateway i nie instaluje lokalnych pakietów Pluginów.
- `--allow-unconfigured` jest osobnym awaryjnym obejściem czasu wykonywania Gateway. Nie oznacza, że konfiguracja początkowa może pominąć `gateway.mode`.

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

Stan kondycji lokalnego Gateway w trybie nieinteraktywnym:

- Jeśli nie przekażesz `--skip-health`, konfiguracja początkowa czeka na osiągalny lokalny Gateway, zanim zakończy się powodzeniem.
- `--install-daemon` najpierw uruchamia zarządzaną ścieżkę instalacji Gateway. Bez tej flagi lokalny Gateway musi już działać, na przykład `openclaw gateway run`.
- Jeśli w automatyzacji chcesz tylko zapisy konfiguracji/obszaru roboczego/bootstrap, użyj `--skip-health`.
- Jeśli samodzielnie zarządzasz plikami obszaru roboczego, przekaż `--skip-bootstrap`, aby ustawić `agents.defaults.skipBootstrap: true` i pominąć tworzenie `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md` oraz `BOOTSTRAP.md`.
- W natywnym Windows `--install-daemon` najpierw próbuje użyć Zaplanowanych zadań, a jeśli utworzenie zadania zostanie odrzucone, przechodzi na element logowania w folderze Autostart dla użytkownika.

Zachowanie interaktywnej konfiguracji początkowej w trybie odwołań:

- Wybierz **Użyj odwołania do sekretu**, gdy pojawi się monit.
- Następnie wybierz jedną z opcji:
  - Zmienna środowiskowa
  - Skonfigurowany dostawca sekretów (`file` albo `exec`)
- Konfiguracja początkowa wykonuje szybką walidację wstępną przed zapisaniem odwołania.
  - Jeśli walidacja się nie powiedzie, konfiguracja początkowa pokazuje błąd i pozwala ponowić próbę.

### Wybór punktów końcowych Z.AI w trybie nieinteraktywnym

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

Przykład Mistral w trybie nieinteraktywnym:

```bash
openclaw onboard --non-interactive \
  --auth-choice mistral-api-key \
  --mistral-api-key "$MISTRAL_API_KEY"
```

## Uwagi dotyczące przepływu

<AccordionGroup>
  <Accordion title="Typy przepływów">
    - `quickstart`: minimalne monity, automatycznie generuje token Gateway.
    - `manual`: pełne monity dotyczące portu, powiązania i uwierzytelniania (alias `advanced`).
    - `import`: uruchamia wykrytego dostawcę migracji, pokazuje podgląd planu, a następnie stosuje go po potwierdzeniu.

  </Accordion>
  <Accordion title="Wstępne filtrowanie dostawców">
    Gdy wybór uwierzytelniania implikuje preferowanego dostawcę, konfiguracja początkowa wstępnie filtruje selektory modelu domyślnego i listy dozwolonych wartości do tego dostawcy. Dla Volcengine i BytePlus dopasowuje to też warianty coding-plan (`volcengine-plan/*`, `byteplus-plan/*`).

    Jeśli filtr preferowanego dostawcy nie zwróci jeszcze żadnych załadowanych modeli, konfiguracja początkowa wraca do niefiltrowanego katalogu zamiast zostawiać selektor pusty.

  </Accordion>
  <Accordion title="Dodatkowe pytania dotyczące wyszukiwania w sieci">
    Niektórzy dostawcy wyszukiwania w sieci wyzwalają dodatkowe monity specyficzne dla dostawcy:

    - **Grok** może zaoferować opcjonalną konfigurację `x_search` z tym samym profilem xAI OAuth albo kluczem API oraz wyborem modelu `x_search`.
    - **Kimi** może zapytać o region API Moonshot (`api.moonshot.ai` kontra `api.moonshot.cn`) i domyślny model wyszukiwania w sieci Kimi.

  </Accordion>
  <Accordion title="Inne zachowania">
    - Zachowanie zakresu DM lokalnej konfiguracji początkowej: [Dokumentacja konfiguracji CLI](/pl/start/wizard-cli-reference#outputs-and-internals).
    - Najszybszy pierwszy czat: `openclaw dashboard` (Control UI, bez konfiguracji kanału).
    - Niestandardowy dostawca: połącz dowolny punkt końcowy zgodny z OpenAI albo Anthropic, w tym hostowanych dostawców niewymienionych na liście. Użyj Unknown, aby wykrywać automatycznie.
    - Jeśli zostanie wykryty stan Hermes, konfiguracja początkowa oferuje przepływ migracji. Użyj [Migracji](/pl/cli/migrate), aby uzyskać plany dry-run, tryb nadpisywania, raporty i dokładne mapowania.

  </Accordion>
</AccordionGroup>

## Typowe polecenia uzupełniające

```bash
openclaw channels add
openclaw configure
openclaw agents add <name>
```

Użyj `openclaw setup` jako tego samego prowadzonego punktu wejścia konfiguracji początkowej. Użyj `openclaw setup --baseline`, gdy potrzebujesz tylko bazowej konfiguracji/obszaru roboczego, `openclaw configure` później do ukierunkowanych zmian oraz `openclaw channels add` do konfiguracji samych kanałów.

<Note>
`--json` nie implikuje trybu nieinteraktywnego. Użyj `--non-interactive` dla skryptów.
</Note>
