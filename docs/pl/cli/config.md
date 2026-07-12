---
read_when:
    - Chcesz odczytać lub edytować konfigurację nieinteraktywnie
sidebarTitle: Config
summary: Dokumentacja CLI dla `openclaw config` (pobieranie/ustawianie/modyfikowanie/usuwanie/plik/schemat/walidacja)
title: Konfiguracja
x-i18n:
    generated_at: "2026-07-12T14:53:59Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1a9531407b2314d1a6bc05a87eb7efb6c37a847378b150125693f4d59733a2e9
    source_path: cli/config.md
    workflow: 16
---

Nieinteraktywne narzędzia pomocnicze dla pliku `openclaw.json`: pobieranie/ustawianie/modyfikowanie/usuwanie wartości według ścieżki, wyświetlanie schematu, walidowanie lub wyświetlanie ścieżki aktywnego pliku. Uruchom `openclaw config` bez podpolecenia, aby otworzyć ten sam kreator z instrukcjami co w przypadku `openclaw configure`.

<Note>
Gdy `OPENCLAW_NIX_MODE=1`, OpenClaw traktuje plik `openclaw.json` jako niezmienny. Polecenia tylko do odczytu (`config get`, `config file`, `config schema`, `config validate`) nadal działają, ale polecenia zapisujące konfigurację odmawiają działania. Zamiast tego zmodyfikuj źródło Nix instalacji; w przypadku oficjalnej dystrybucji nix-openclaw skorzystaj z przewodnika [Szybki start nix-openclaw](https://github.com/openclaw/nix-openclaw#quick-start) i ustaw wartości w `programs.openclaw.config` lub `instances.<name>.config`.
</Note>

## Opcje główne

<ParamField path="--section <section>" type="string">
  Powtarzalny filtr sekcji konfiguracji z instrukcjami używany podczas uruchamiania `openclaw config` bez podpolecenia.
</ParamField>

Sekcje z instrukcjami: `workspace`, `model`, `web`, `gateway`, `daemon`, `channels`, `plugins`, `skills`, `health`.

## Przykłady

```bash
openclaw config file
openclaw config --section model
openclaw config --section gateway --section daemon
openclaw config schema
openclaw config get browser.executablePath
openclaw config set browser.executablePath "/usr/bin/google-chrome"
openclaw config set browser.profiles.work.executablePath "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
openclaw config set agents.defaults.heartbeat.every "2h"
openclaw config set 'agents.list[0].tools.exec.node' "node-id-or-name"
openclaw config set agents.defaults.models '{"openai/gpt-5.4":{}}' --strict-json --merge
openclaw config set channels.discord.token --ref-provider default --ref-source env --ref-id DISCORD_BOT_TOKEN
openclaw config set secrets.providers.vaultfile --provider-source file --provider-path /etc/openclaw/secrets.json --provider-mode json
openclaw config patch --file ./openclaw.patch.json5 --dry-run
openclaw config unset plugins.entries.brave.config.webSearch.apiKey
openclaw config set channels.discord.token --ref-provider default --ref-source env --ref-id DISCORD_BOT_TOKEN --dry-run
openclaw config validate
openclaw config validate --json
```

### Ścieżki

Notacja kropkowa lub nawiasowa. W przykładach powłoki ujmuj ścieżki nawiasowe w cudzysłowy, aby powłoka zsh nie rozwijała `[0]` jako wzorca:

```bash
openclaw config get agents.defaults.workspace
openclaw config get 'agents.list[0].id'
openclaw config get agents.list
openclaw config set 'agents.list[1].tools.exec.node' "node-id-or-name"
```

### `config get`

Odczytuje wartość ze zredagowanej migawki konfiguracji (sekrety nigdy nie są wyświetlane). Opcja `--json` wyświetla nieprzetworzoną wartość jako JSON; bez niej ciągi znaków, liczby i wartości logiczne są wyświetlane bez dodatkowego formatowania, a obiekty i tablice jako sformatowany JSON.

```bash
openclaw config get browser.executablePath
openclaw config get agents.defaults.model --json
```

### `config file`

Wyświetla ścieżkę aktywnego pliku konfiguracji, ustaloną na podstawie `OPENCLAW_CONFIG_PATH` lub domyślnej lokalizacji. Ścieżka wskazuje zwykły plik, a nie dowiązanie symboliczne; zobacz [Bezpieczeństwo zapisu](#write-safety).

### `config schema`

Wyświetla wygenerowany schemat JSON pliku `openclaw.json` na standardowym wyjściu.

<AccordionGroup>
  <Accordion title="Co zawiera">
    - Bieżący główny schemat konfiguracji oraz główne pole tekstowe `$schema` dla narzędzi edytora.
    - Metadane dokumentacji pól `title` / `description` używane przez interfejs Control UI.
    - Węzły zagnieżdżonych obiektów, symboli wieloznacznych (`*`) i elementów tablic (`[]`) dziedziczą te same metadane `title` / `description`, gdy istnieje pasująca dokumentacja pól.
    - Gałęzie `anyOf` / `oneOf` / `allOf` również dziedziczą te same metadane dokumentacji.
    - Pozyskiwane na zasadzie „best effort” aktualne metadane schematów pluginów i kanałów, gdy można załadować manifesty środowiska wykonawczego.
    - Poprawny schemat zastępczy, nawet gdy bieżąca konfiguracja jest nieprawidłowa.

  </Accordion>
  <Accordion title="Powiązane RPC środowiska wykonawczego">
    `config.schema.lookup` zwraca jedną znormalizowaną ścieżkę konfiguracji z płytkim węzłem schematu (`title`, `description`, `type`, `enum`, `const`, typowe ograniczenia), dopasowanymi metadanymi wskazówek interfejsu oraz podsumowaniami bezpośrednich elementów podrzędnych. Użyj go do analizy ograniczonej do ścieżki w Control UI lub klientach niestandardowych.
  </Accordion>
</AccordionGroup>

```bash
openclaw config schema
openclaw config schema > openclaw.schema.json
```

### `config validate`

Waliduje bieżącą konfigurację względem aktywnego schematu bez uruchamiania Gateway.

```bash
openclaw config validate
openclaw config validate --json
```

<Note>
Jeśli walidacja już kończy się niepowodzeniem, zacznij od `openclaw configure` lub `openclaw doctor --fix`. Polecenie `openclaw chat` nie omija blokady nieprawidłowej konfiguracji.
</Note>

## Wartości

Wartości są w miarę możliwości analizowane jako JSON5; w przeciwnym razie są traktowane jako nieprzetworzone ciągi znaków. Użyj `--strict-json`, aby wymagać standardowego formatu JSON bez możliwości użycia ciągu znaków jako wartości zastępczej (składnia dostępna wyłącznie w JSON5, taka jak komentarze, końcowe przecinki lub klucze bez cudzysłowów, zostanie wtedy odrzucona). Opcja `--json` jest starszym aliasem `--strict-json` dla polecenia `config set`.

```bash
openclaw config set agents.defaults.heartbeat.every "0m"
openclaw config set gateway.port 19001 --strict-json
openclaw config set channels.whatsapp.groups '["*"]' --strict-json
```

Polecenie `config get <path> --json` wyświetla nieprzetworzoną wartość jako JSON zamiast tekstu sformatowanego dla terminala.

<Note>
Przypisanie obiektu domyślnie zastępuje ścieżkę docelową. Chronione ścieżki, które często zawierają wpisy dodane przez użytkownika, odrzucają zastąpienia usuwające istniejące wpisy, chyba że podasz `--replace`: `agents.defaults.models`, `agents.list`, `models.providers`, `models.providers.<id>`, `models.providers.<id>.models`, `plugins.entries` oraz `auth.profiles`.
</Note>

Podczas dodawania wpisów do tych map użyj `--merge`:

```bash
openclaw config set agents.defaults.models '{"openai/gpt-5.4":{}}' --strict-json --merge
openclaw config set models.providers.ollama.models '[{"id":"llama3.2","name":"Llama 3.2"}]' --strict-json --merge
```

Używaj `--replace` tylko wtedy, gdy podana wartość ma celowo stać się pełną wartością docelową.

## Tryby `config set`

<Tabs>
  <Tab title="Tryb wartości">
    ```bash
    openclaw config set <path> <value>
    ```
  </Tab>
  <Tab title="Tryb konstruktora SecretRef">
    ```bash
    openclaw config set channels.discord.token \
      --ref-provider default \
      --ref-source env \
      --ref-id DISCORD_BOT_TOKEN
    ```
  </Tab>
  <Tab title="Tryb konstruktora dostawcy">
    Dotyczy wyłącznie ścieżek `secrets.providers.<alias>`:

    ```bash
    openclaw config set secrets.providers.vault \
      --provider-source exec \
      --provider-command /usr/local/bin/openclaw-vault \
      --provider-arg read \
      --provider-arg openai/api-key \
      --provider-timeout-ms 5000
    ```

  </Tab>
  <Tab title="Tryb wsadowy">
    ```bash
    openclaw config set --batch-json '[
      {
        "path": "secrets.providers.default",
        "provider": { "source": "env" }
      },
      {
        "path": "channels.discord.token",
        "ref": { "source": "env", "provider": "default", "id": "DISCORD_BOT_TOKEN" }
      }
    ]'
    ```

    ```bash
    openclaw config set --batch-file ./config-set.batch.json --dry-run
    ```

  </Tab>
</Tabs>

<Warning>
Przypisania SecretRef są odrzucane na nieobsługiwanych powierzchniach modyfikowalnych w środowisku wykonawczym (na przykład `hooks.token`, `commands.ownerDisplaySecret`, tokeny Webhook powiązań wątków Discord oraz dane uwierzytelniające WhatsApp w formacie JSON). Zobacz [Powierzchnia danych uwierzytelniających SecretRef](/pl/reference/secretref-credential-surface).
</Warning>

Analizowanie wsadowe zawsze używa ładunku wsadowego (`--batch-json`/`--batch-file`) jako źródła prawdy; opcje `--strict-json` / `--json` nie zmieniają sposobu analizowania wsadowego.

Tryb ścieżki/wartości JSON działa również bezpośrednio z SecretRef i dostawcami:

```bash
openclaw config set channels.discord.token \
  '{"source":"env","provider":"default","id":"DISCORD_BOT_TOKEN"}' \
  --strict-json

openclaw config set secrets.providers.vaultfile \
  '{"source":"file","path":"/etc/openclaw/secrets.json","mode":"json"}' \
  --strict-json
```

### Flagi konstruktora dostawcy

Elementy docelowe konstruktora dostawcy muszą używać ścieżki `secrets.providers.<alias>`.

<AccordionGroup>
  <Accordion title="Wspólne flagi">
    - `--provider-source <env|file|exec>`
    - `--provider-timeout-ms <ms>` (`file`, `exec`)

  </Accordion>
  <Accordion title="Dostawca zmiennych środowiskowych (--provider-source env)">
    - `--provider-allowlist <ENV_VAR>` (powtarzalna)

  </Accordion>
  <Accordion title="Dostawca plikowy (--provider-source file)">
    - `--provider-path <path>` (wymagana)
    - `--provider-mode <singleValue|json>`
    - `--provider-max-bytes <bytes>`
    - `--provider-allow-insecure-path`

  </Accordion>
  <Accordion title="Dostawca wykonawczy (--provider-source exec)">
    - `--provider-command <path>` (wymagana)
    - `--provider-arg <arg>` (powtarzalna)
    - `--provider-no-output-timeout-ms <ms>`
    - `--provider-max-output-bytes <bytes>`
    - `--provider-json-only`
    - `--provider-env <KEY=VALUE>` (powtarzalna)
    - `--provider-pass-env <ENV_VAR>` (powtarzalna)
    - `--provider-trusted-dir <path>` (powtarzalna)
    - `--provider-allow-insecure-path`
    - `--provider-allow-symlink-command`

  </Accordion>
</AccordionGroup>

Przykład wzmocnionego dostawcy wykonawczego:

```bash
openclaw config set secrets.providers.vault \
  --provider-source exec \
  --provider-command /usr/local/bin/openclaw-vault \
  --provider-arg read \
  --provider-arg openai/api-key \
  --provider-json-only \
  --provider-pass-env VAULT_TOKEN \
  --provider-trusted-dir /usr/local/bin \
  --provider-timeout-ms 5000
```

## `config patch`

Wklej lub przekaż potokiem łatę konfiguracji w formacie JSON5 zamiast uruchamiać wiele poleceń `config set` opartych na ścieżkach. Obiekty są scalane rekurencyjnie; tablice i wartości skalarne zastępują element docelowy; `null` usuwa ścieżkę docelową.

```bash
openclaw config patch --file ./openclaw.patch.json5 --dry-run
openclaw config patch --file ./openclaw.patch.json5
```

Przekaż łatę przez standardowe wejście w skryptach zdalnej konfiguracji:

```bash
ssh user@gateway-host 'openclaw config patch --stdin --dry-run' < ./openclaw.patch.json5
ssh user@gateway-host 'openclaw config patch --stdin' < ./openclaw.patch.json5
```

Przykładowa łata:

```json5
{
  channels: {
    slack: {
      enabled: true,
      mode: "socket",
      botToken: { source: "env", provider: "default", id: "SLACK_BOT_TOKEN" },
      appToken: { source: "env", provider: "default", id: "SLACK_APP_TOKEN" },
      groupPolicy: "open",
      requireMention: false,
    },
    discord: {
      enabled: true,
      token: { source: "env", provider: "default", id: "DISCORD_BOT_TOKEN" },
      dmPolicy: "disabled",
      dm: { enabled: false },
      groupPolicy: "allowlist",
    },
  },
  agents: {
    defaults: {
      model: { primary: "openai/gpt-5.6-sol" },
      models: {
        "openai/gpt-5.6-sol": { params: { fastMode: true } },
      },
    },
  },
}
```

Użyj `--replace-path <path>`, gdy jeden obiekt lub jedna tablica ma przyjąć dokładnie podaną wartość zamiast zostać zmodyfikowana rekurencyjnie:

```bash
openclaw config patch --file ./discord.patch.json5 --replace-path 'channels.discord.guilds["123"].channels'
```

Opcja `--dry-run` uruchamia sprawdzanie schematu i możliwości rozwiązania SecretRef bez zapisywania. Odwołania SecretRef korzystające z dostawców wykonawczych są domyślnie pomijane podczas przebiegu próbnego; dodaj `--allow-exec`, jeśli celowo chcesz, aby przebieg próbny wykonywał polecenia dostawcy.

## Przebieg próbny

Opcja `--dry-run` waliduje zmiany bez zapisywania pliku `openclaw.json`. Jest dostępna dla poleceń `config set`, `config patch` i `config unset`.

```bash
openclaw config set channels.discord.token \
  --ref-provider default \
  --ref-source env \
  --ref-id DISCORD_BOT_TOKEN \
  --dry-run \
  --json

openclaw config set channels.discord.token \
  --ref-provider vault \
  --ref-source exec \
  --ref-id discord/token \
  --dry-run \
  --allow-exec
```

<AccordionGroup>
  <Accordion title="Działanie trybu próbnego">
    - Tryb kreatora: uruchamia sprawdzanie możliwości rozwiązania SecretRef dla zmienionych odwołań/dostawców.
    - Tryb JSON (`--strict-json`, `--json` lub tryb wsadowy): uruchamia walidację schematu oraz sprawdzanie możliwości rozwiązania SecretRef.
    - Walidacja zasad jest wykonywana względem pełnej konfiguracji po zmianach, dlatego zapisy obiektów nadrzędnych (na przykład ustawienie `hooks` jako obiektu) nie mogą ominąć walidacji nieobsługiwanych obszarów.
    - Sprawdzanie SecretRef typu exec jest domyślnie pomijane, aby uniknąć skutków ubocznych wykonywania poleceń; przekaż `--allow-exec`, aby je włączyć (może to spowodować wykonanie poleceń dostawcy). Opcja `--allow-exec` działa wyłącznie w trybie próbnym i bez `--dry-run` powoduje błąd.

  </Accordion>
  <Accordion title="Pola --dry-run --json">
    - `ok`: czy tryb próbny zakończył się powodzeniem
    - `operations`: liczba ocenionych przypisań
    - `checks`: czy wykonano sprawdzanie schematu/możliwości rozwiązania
    - `checks.resolvabilityComplete`: czy sprawdzanie możliwości rozwiązania zostało ukończone (wartość false, gdy odwołania exec są pomijane)
    - `refsChecked`: liczba odwołań faktycznie rozwiązanych w trybie próbnym
    - `skippedExecRefs`: liczba odwołań exec pominiętych z powodu nieustawienia `--allow-exec`
    - `errors`: ustrukturyzowane błędy braku ścieżki, schematu lub możliwości rozwiązania, gdy `ok=false`

  </Accordion>
</AccordionGroup>

### Struktura danych wyjściowych JSON

```json5
{
  ok: boolean,
  operations: number,
  configPath: string,
  inputModes: ["value" | "json" | "builder" | "unset", ...],
  checks: {
    schema: boolean,
    resolvability: boolean,
    resolvabilityComplete: boolean,
  },
  refsChecked: number,
  skippedExecRefs: number,
  errors?: [
    {
      kind: "missing-path" | "schema" | "resolvability",
      message: string,
      ref?: string, // obecne w przypadku błędów możliwości rozwiązania
    },
  ],
}
```

<Tabs>
  <Tab title="Przykład powodzenia">
    ```json
    {
      "ok": true,
      "operations": 1,
      "configPath": "~/.openclaw/openclaw.json",
      "inputModes": ["builder"],
      "checks": {
        "schema": false,
        "resolvability": true,
        "resolvabilityComplete": true
      },
      "refsChecked": 1,
      "skippedExecRefs": 0
    }
    ```
  </Tab>
  <Tab title="Przykład niepowodzenia">
    ```json
    {
      "ok": false,
      "operations": 1,
      "configPath": "~/.openclaw/openclaw.json",
      "inputModes": ["builder"],
      "checks": {
        "schema": false,
        "resolvability": true,
        "resolvabilityComplete": true
      },
      "refsChecked": 1,
      "skippedExecRefs": 0,
      "errors": [
        {
          "kind": "resolvability",
          "message": "Błąd: zmienna środowiskowa \"MISSING_TEST_SECRET\" nie jest ustawiona.",
          "ref": "env:default:MISSING_TEST_SECRET"
        }
      ]
    }
    ```
  </Tab>
</Tabs>

<AccordionGroup>
  <Accordion title="Jeśli tryb próbny zakończy się niepowodzeniem">
    - `config schema validation failed`: kształt konfiguracji po zmianach jest nieprawidłowy; popraw ścieżkę/wartość albo kształt obiektu dostawcy/odwołania.
    - `Config policy validation failed: unsupported SecretRef usage`: przenieś to poświadczenie z powrotem do danych wejściowych w postaci zwykłego tekstu/ciągu znaków; używaj SecretRef wyłącznie w obsługiwanych obszarach.
    - `SecretRef assignment(s) could not be resolved`: obecnie nie można rozwiązać wskazanego dostawcy/odwołania (brakująca zmienna środowiskowa, nieprawidłowy wskaźnik pliku, błąd dostawcy exec lub niezgodność dostawcy/źródła).
    - `Dry run note: skipped <n> exec SecretRef resolvability check(s)`: uruchom ponownie z `--allow-exec`, jeśli potrzebujesz walidacji możliwości rozwiązania exec.
    - W trybie wsadowym popraw wpisy powodujące błędy i ponownie uruchom `--dry-run` przed zapisem.

  </Accordion>
</AccordionGroup>

## Stosowanie zmian

Po każdym pomyślnym wykonaniu `config set` / `config patch` / `config unset` CLI wyświetla jedną z trzech wskazówek, dzięki czemu wiadomo, czy Gateway wymaga ponownego uruchomienia:

| Wskazówka                                          | Znaczenie                                                |
| --------------------------------------------------- | -------------------------------------------------------- |
| `Uruchom ponownie Gateway, aby zastosować zmiany.`  | Zmieniona ścieżka wymaga pełnego ponownego uruchomienia. |
| `Zmiana zostanie zastosowana bez ponownego uruchamiania Gateway.` | Przeładowanie na gorąco zastosuje ją automatycznie. |
| `Ponowne uruchomienie Gateway nie jest wymagane.`   | Nie zmieniło się nic istotnego dla środowiska uruchomieniowego. |

Zapisy do `plugins.entries` (lub dowolnej ścieżki podrzędnej) zawsze wymagają ponownego uruchomienia, ponieważ CLI nie może potwierdzić, że metadane przeładowania każdego pluginu zostały wczytane.

## Bezpieczeństwo zapisu

`openclaw config set` i inne należące do OpenClaw narzędzia zapisujące konfigurację weryfikują pełną konfigurację po zmianach przed zapisaniem jej na dysku. Jeśli nowe dane nie przejdą walidacji schematu lub wyglądają na destrukcyjne nadpisanie, aktywna konfiguracja pozostaje niezmieniona, a odrzucone dane są zapisywane obok niej jako `openclaw.json.rejected.*`.

<Warning>
Ścieżka aktywnej konfiguracji musi wskazywać zwykły plik. Układy z `openclaw.json` będącym dowiązaniem symbolicznym nie są obsługiwane przy zapisie; zamiast tego użyj `OPENCLAW_CONFIG_PATH`, aby wskazać bezpośrednio rzeczywisty plik.
</Warning>

W przypadku niewielkich zmian preferuj zapis przez CLI:

```bash
openclaw config set gateway.reload.mode hybrid --dry-run
openclaw config set gateway.reload.mode hybrid
openclaw config validate
```

Jeśli zapis zostanie odrzucony, sprawdź zapisane dane i popraw pełny kształt konfiguracji:

```bash
CONFIG="$(openclaw config file)"
ls -lt "$CONFIG".rejected.* 2>/dev/null | head
openclaw config validate
```

Bezpośrednie zapisy w edytorze są nadal dozwolone, ale działający Gateway traktuje je jako niezaufane, dopóki nie przejdą walidacji. Nieprawidłowe bezpośrednie zmiany uniemożliwiają uruchomienie lub są pomijane podczas przeładowania na gorąco; Gateway nie przepisuje pliku `openclaw.json`. Uruchom `openclaw doctor --fix`, aby naprawić konfigurację z prefiksem lub destrukcyjnie nadpisaną albo przywrócić ostatnią znaną poprawną kopię. Zobacz [rozwiązywanie problemów z Gateway](/pl/gateway/troubleshooting#gateway-rejected-invalid-config).

Odzyskiwanie całego pliku jest zarezerwowane dla napraw wykonywanych przez doctor. Zmiany schematu pluginu lub rozbieżność `minHostVersion` nadal są wyraźnie zgłaszane, zamiast powodować wycofanie niezwiązanych ustawień użytkownika, takich jak modele, dostawcy, profile uwierzytelniania, kanały, ekspozycja Gateway, narzędzia, pamięć, przeglądarka czy konfiguracja cron.

## Pętla naprawcza

Gdy `openclaw config validate` zakończy się powodzeniem, użyj lokalnego TUI, aby osadzony agent porównał aktywną konfigurację z dokumentacją, podczas gdy Ty weryfikujesz każdą zmianę w tym samym terminalu:

```bash
openclaw chat
```

W TUI początkowy znak `!` uruchamia dosłowne lokalne polecenie powłoki (po jednorazowym monicie o potwierdzenie w każdej sesji):

```text
!openclaw config file
!openclaw docs gateway auth token secretref
!openclaw config validate
!openclaw doctor
```

<Steps>
  <Step title="Porównaj z dokumentacją">
    Poproś agenta o porównanie bieżącej konfiguracji z odpowiednią stroną dokumentacji i zasugerowanie najmniejszej poprawki.
  </Step>
  <Step title="Zastosuj ukierunkowane zmiany">
    Zastosuj ukierunkowane zmiany za pomocą `openclaw config set` lub `openclaw configure`.
  </Step>
  <Step title="Ponownie zweryfikuj">
    Po każdej zmianie ponownie uruchom `openclaw config validate`.
  </Step>
  <Step title="Użyj doctor w przypadku problemów ze środowiskiem uruchomieniowym">
    Jeśli walidacja zakończy się powodzeniem, ale środowisko uruchomieniowe nadal działa nieprawidłowo, uruchom `openclaw doctor` lub `openclaw doctor --fix`, aby uzyskać pomoc w migracji i naprawie.
  </Step>
</Steps>

## Powiązane materiały

- [Dokumentacja CLI](/pl/cli)
- [Konfiguracja](/pl/gateway/configuration)
