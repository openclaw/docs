---
read_when:
    - Chcesz przeprowadzić konfigurację z przewodnikiem dla Gateway, obszaru roboczego, uwierzytelniania, kanałów i Skills
summary: Dokumentacja referencyjna CLI dla `openclaw onboard` (interaktywne wdrażanie)
title: Wdrożenie
x-i18n:
    generated_at: "2026-07-04T20:44:56Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 99362cdca49929f7d05c2bf7bd8b0a55811b7ad6c618be90effb8869cd2ad839
    source_path: cli/onboard.md
    workflow: 16
---

# `openclaw onboard`

Pełne prowadzone wdrożenie dla lokalnej lub zdalnej konfiguracji Gateway. Użyj tego, gdy chcesz, aby OpenClaw przeprowadził Cię przez uwierzytelnianie modelu, workspace, Gateway, kanały, Skills i stan działania w jednym przepływie.

## Powiązane przewodniki

<CardGroup cols={2}>
  <Card title="CLI onboarding hub" href="/pl/start/wizard" icon="rocket">
    Omówienie interaktywnego przepływu CLI.
  </Card>
  <Card title="Onboarding overview" href="/pl/start/onboarding-overview" icon="map">
    Jak elementy wdrożenia OpenClaw łączą się ze sobą.
  </Card>
  <Card title="CLI setup reference" href="/pl/start/wizard-cli-reference" icon="book">
    Dane wyjściowe, elementy wewnętrzne i zachowanie poszczególnych kroków.
  </Card>
  <Card title="CLI automation" href="/pl/start/wizard-cli-automation" icon="terminal">
    Flagi nieinteraktywne i konfiguracje skryptowe.
  </Card>
  <Card title="macOS app onboarding" href="/pl/start/onboarding" icon="apple">
    Przepływ wdrożenia dla aplikacji paska menu macOS.
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

`--flow import` używa dostawców migracji należących do pluginu, takich jak Hermes. Działa tylko na świeżej konfiguracji OpenClaw; jeśli istniejąca konfiguracja, poświadczenia, sesje albo pliki pamięci/tożsamości workspace są obecne, zresetuj je lub wybierz świeżą konfigurację przed importem.

`--modern` uruchamia podgląd konwersacyjnego wdrożenia Crestodian. Bez
`--modern`, `openclaw onboard` zachowuje klasyczny przepływ wdrożenia.

W interaktywnym terminalu samo `openclaw` (bez podkomendy) wybiera ścieżkę według stanu
konfiguracji:

- Jeśli aktywnego pliku konfiguracji brakuje albo nie ma żadnych ustawień utworzonych przez użytkownika (jest pusty lub
  zawiera tylko metadane), uruchamia ten klasyczny przepływ wdrożenia.
- Jeśli plik konfiguracji istnieje, ale nie przechodzi walidacji, uruchamia
  [Crestodian](/pl/cli/crestodian) w celu naprawy.
- Jeśli plik konfiguracji jest poprawny, otwiera normalny TUI agenta, lokalnie
  albo połączony z osiągalnym skonfigurowanym Gateway. W skonfigurowanej instalacji
  uruchom Crestodian przez `/crestodian` w TUI albo `openclaw crestodian`.

Zwykły tekst `ws://` jest akceptowany dla pętli zwrotnej, prywatnych literałów IP, `.local` oraz
adresów URL Gateway w Tailnet `*.ts.net`. Dla innych zaufanych nazw prywatnego DNS ustaw
`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` w środowisku procesu wdrożenia.

## Ustawienia regionalne

Interaktywne wdrożenie używa ustawień regionalnych kreatora CLI dla stałego tekstu konfiguracji. Kolejność
rozstrzygania jest następująca:

1. `OPENCLAW_LOCALE`
2. `LC_ALL`
3. `LC_MESSAGES`
4. `LANG`
5. Awaryjnie angielski

Obsługiwane ustawienia regionalne kreatora to `en`, `zh-CN` i `zh-TW`. Wartości ustawień regionalnych mogą używać
podkreślenia lub form z sufiksem POSIX, takich jak `zh_CN.UTF-8`. Nazwy produktów, nazwy poleceń,
klucze konfiguracji, adresy URL, identyfikatory dostawców, identyfikatory modeli oraz etykiety pluginów/kanałów
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

`--custom-api-key` jest opcjonalne w trybie nieinteraktywnym. Jeśli zostanie pominięte, wdrożenie sprawdza `CUSTOM_API_KEY`.
OpenClaw automatycznie oznacza typowe identyfikatory modeli wizyjnych jako obsługujące obrazy. Przekaż `--custom-image-input` dla nieznanych niestandardowych identyfikatorów wizyjnych albo `--custom-text-input`, aby wymusić metadane tylko tekstowe.
Użyj `--custom-compatibility openai-responses` dla punktów końcowych zgodnych z OpenAI, które obsługują `/v1/responses`, ale nie `/v1/chat/completions`.

LM Studio obsługuje również flagę klucza specyficzną dla dostawcy w trybie nieinteraktywnym:

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

`--custom-base-url` domyślnie przyjmuje `http://127.0.0.1:11434`. `--custom-model-id` jest opcjonalne; jeśli zostanie pominięte, wdrożenie używa sugerowanych wartości domyślnych Ollama. Identyfikatory modeli chmurowych, takie jak `kimi-k2.5:cloud`, również działają tutaj.

Przechowuj klucze dostawców jako odwołania zamiast zwykłego tekstu:

```bash
openclaw onboard --non-interactive \
  --auth-choice openai-api-key \
  --secret-input-mode ref \
  --accept-risk
```

Z `--secret-input-mode ref` wdrożenie zapisuje odwołania oparte na zmiennych środowiskowych zamiast wartości kluczy w zwykłym tekście.
Dla dostawców opartych na profilu uwierzytelniania zapisuje wpisy `keyRef`; dla niestandardowych dostawców zapisuje `models.providers.<id>.apiKey` jako odwołanie środowiskowe (na przykład `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`).

Kontrakt nieinteraktywnego trybu `ref`:

- Ustaw zmienną środowiskową dostawcy w środowisku procesu wdrożenia (na przykład `OPENAI_API_KEY`).
- Nie przekazuj flag klucza inline (na przykład `--openai-api-key`), chyba że ta zmienna środowiskowa też jest ustawiona.
- Jeśli flaga klucza inline zostanie przekazana bez wymaganej zmiennej środowiskowej, wdrożenie szybko kończy się błędem z instrukcjami.

Opcje tokenu Gateway w trybie nieinteraktywnym:

- `--gateway-auth token --gateway-token <token>` przechowuje token w zwykłym tekście.
- `--gateway-auth token --gateway-token-ref-env <name>` przechowuje `gateway.auth.token` jako środowiskowy SecretRef.
- `--gateway-token` i `--gateway-token-ref-env` wzajemnie się wykluczają.
- `--gateway-token-ref-env` wymaga niepustej zmiennej środowiskowej w środowisku procesu wdrożenia.
- Z `--install-daemon`, gdy uwierzytelnianie tokenem wymaga tokenu, tokeny Gateway zarządzane przez SecretRef są walidowane, ale nie są utrwalane jako rozwiązany zwykły tekst w metadanych środowiska usługi nadzorcy.
- Z `--install-daemon`, jeśli tryb tokenu wymaga tokenu, a skonfigurowany SecretRef tokenu jest nierozwiązany, wdrożenie kończy się zamkniętym błędem z instrukcjami naprawy.
- Z `--install-daemon`, jeśli skonfigurowane są zarówno `gateway.auth.token`, jak i `gateway.auth.password`, a `gateway.auth.mode` nie jest ustawione, wdrożenie blokuje instalację, dopóki tryb nie zostanie ustawiony jawnie.
- Lokalne wdrożenie zapisuje `gateway.mode="local"` w konfiguracji. Jeśli późniejszy plik konfiguracji nie ma `gateway.mode`, traktuj to jako uszkodzenie konfiguracji albo niekompletną ręczną edycję, a nie jako prawidłowy skrót trybu lokalnego.
- Lokalne wdrożenie instaluje wybrane pluginy do pobrania, gdy wybrana ścieżka konfiguracji ich wymaga.
- Zdalne wdrożenie zapisuje tylko informacje o połączeniu dla zdalnego Gateway i nie instaluje lokalnych pakietów pluginów.
- `--allow-unconfigured` to osobna awaryjna furtka środowiska uruchomieniowego Gateway. Nie oznacza, że wdrożenie może pominąć `gateway.mode`.

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

- Jeśli nie przekażesz `--skip-health`, wdrożenie czeka na osiągalny lokalny Gateway, zanim zakończy się powodzeniem.
- `--install-daemon` najpierw uruchamia zarządzaną ścieżkę instalacji Gateway. Bez tego musisz już mieć uruchomiony lokalny Gateway, na przykład `openclaw gateway run`.
- Jeśli w automatyzacji chcesz tylko zapisać konfigurację/workspace/bootstrap, użyj `--skip-health`.
- Jeśli samodzielnie zarządzasz plikami workspace, przekaż `--skip-bootstrap`, aby ustawić `agents.defaults.skipBootstrap: true` i pominąć tworzenie `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md` oraz `BOOTSTRAP.md`.
- W natywnym Windows `--install-daemon` najpierw próbuje użyć Zaplanowanych zadań, a jeśli tworzenie zadania zostanie odrzucone, przechodzi awaryjnie na element logowania w folderze Autostart dla użytkownika.

Zachowanie interaktywnego wdrożenia w trybie odwołań:

- Wybierz **Użyj odwołania do sekretu**, gdy pojawi się monit.
- Następnie wybierz jedno z:
  - Zmienna środowiskowa
  - Skonfigurowany dostawca sekretów (`file` albo `exec`)
- Wdrożenie wykonuje szybką walidację wstępną przed zapisaniem odwołania.
  - Jeśli walidacja się nie powiedzie, wdrożenie pokazuje błąd i pozwala spróbować ponownie.

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

- `--token-provider <id>` — Identyfikator dostawcy tokenu. Określa, który dostawca wydaje token.
- `--token <token>` — Wartość tokenu do uwierzytelniania modelu.
- `--token-profile-id <id>` — Identyfikator profilu uwierzytelniania. Ogólne przechowywanie tokenów domyślnie używa `<provider>:manual`; przepływy konfiguracji należące do dostawcy mogą używać własnej wartości domyślnej, takiej jak `anthropic:default`.
- `--token-expires-in <duration>` — Opcjonalny czas wygaśnięcia tokenu (np. `365d`, `12h`).

Cloudflare AI Gateway (nieinteraktywne):

- `--cloudflare-ai-gateway-account-id <id>` — Identyfikator konta Cloudflare do routingu przez Cloudflare AI Gateway.
- `--cloudflare-ai-gateway-gateway-id <id>` — Identyfikator Cloudflare AI Gateway.

Sterowanie instalacją demona:

- `--no-install-daemon` — Jawnie pomiń instalację usługi Gateway.
- `--skip-daemon` — Alias dla `--no-install-daemon`.

Sterowanie konfiguracją UI i hooków:

- `--skip-ui` — Pomiń monity Control UI / TUI podczas wdrożenia.
- `--skip-hooks` — Pomiń monity konfiguracji webhooka / hooka podczas wdrożenia.

Wyciszanie wyjścia:

- `--suppress-gateway-token-output` — Wycisz dane wyjściowe Gateway/UI zawierające token (wskazówki tokenu, adres URL automatycznego logowania z osadzonym tokenem oraz automatyczne uruchomienie Control UI). Przydatne we współdzielonych terminalach i środowiskach CI.

## Uwagi o przepływie

<AccordionGroup>
  <Accordion title="Flow types">
    - `quickstart`: minimalne monity, automatycznie generuje token Gateway.
    - `manual`: pełne monity o port, adres nasłuchu i uwierzytelnianie (alias `advanced`).
    - `import`: uruchamia wykrytego dostawcę migracji, pokazuje podgląd planu, a następnie stosuje go po potwierdzeniu.

  </Accordion>
  <Accordion title="Provider prefiltering">
    Gdy wybór uwierzytelniania sugeruje preferowanego dostawcę, wdrożenie wstępnie filtruje selektory modelu domyślnego i listy dozwolonych do tego dostawcy. Dla Volcengine i BytePlus dopasowuje to również warianty Coding Plan (`volcengine-plan/*`, `byteplus-plan/*`).

    Jeśli filtr preferowanego dostawcy nie zwraca jeszcze żadnych załadowanych modeli, wdrożenie wraca do niefiltrowanego katalogu zamiast zostawiać selektor pusty.

  </Accordion>
  <Accordion title="Web-search follow-ups">
    Niektórzy dostawcy wyszukiwania w sieci uruchamiają monity uzupełniające specyficzne dla dostawcy:

    - **Grok** może zaoferować opcjonalną konfigurację `x_search` z tym samym profilem xAI OAuth albo kluczem API oraz wyborem modelu `x_search`.
    - **Kimi** może poprosić o region API Moonshot (`api.moonshot.ai` kontra `api.moonshot.cn`) oraz domyślny model wyszukiwania w sieci Kimi.

  </Accordion>
  <Accordion title="Other behaviors">
    - Zachowanie zakresu DM lokalnego wdrożenia: [referencja konfiguracji CLI](/pl/start/wizard-cli-reference#outputs-and-internals).
    - Najszybszy pierwszy czat: `openclaw dashboard` (Control UI, bez konfiguracji kanału).
    - Niestandardowy dostawca: połącz dowolny punkt końcowy zgodny z OpenAI albo Anthropic, w tym dostawców hostowanych niewymienionych na liście. Użyj Nieznany, aby wykryć automatycznie.
    - Jeśli wykryty zostanie stan Hermes, wdrożenie zaoferuje przepływ migracji. Użyj [Migrate](/pl/cli/migrate) do planów próbnych, trybu nadpisywania, raportów i dokładnych mapowań.

  </Accordion>
</AccordionGroup>

## Typowe polecenia uzupełniające

```bash
openclaw channels add
openclaw configure
openclaw agents add <name>
```

Użyj `openclaw setup` jako tego samego prowadzonego punktu wejścia do onboardingu. Użyj `openclaw setup --baseline`, gdy potrzebujesz tylko bazowej konfiguracji/obszaru roboczego, później `openclaw configure` do ukierunkowanych zmian oraz `openclaw channels add` do konfiguracji wyłącznie kanału.

<Note>
`--json` nie oznacza trybu nieinteraktywnego. W skryptach użyj `--non-interactive`.
</Note>
