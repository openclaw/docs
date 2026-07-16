---
read_when:
    - Chcesz odczytywać lub edytować konfigurację nieinteraktywnie
sidebarTitle: Config
summary: Dokumentacja CLI dla `openclaw config` (get/set/patch/unset/file/schema/validate)
title: Konfiguracja
x-i18n:
    generated_at: "2026-07-16T18:24:59Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 63be5cbac6c7db9c6b93ad690e5decab9f4ce7904e8b10f26a3b1e39e4729450
    source_path: cli/config.md
    workflow: 16
---

Nieinteraktywne narzędzia pomocnicze dla `openclaw.json`: pobieranie/ustawianie/modyfikowanie/usuwanie wartości według ścieżki, wyświetlanie schematu, walidowanie lub wyświetlanie ścieżki aktywnego pliku. Uruchom `openclaw config` bez podpolecenia, aby otworzyć ten sam kreator z instrukcjami co `openclaw configure`.

<Note>
Gdy `OPENCLAW_NIX_MODE=1`, OpenClaw traktuje `openclaw.json` jako niezmienny. Polecenia tylko do odczytu (`config get`, `config file`, `config schema`, `config validate`) nadal działają, ale polecenia zapisujące konfigurację odmawiają działania. Zamiast tego należy edytować źródło Nix instalacji; w przypadku oficjalnej dystrybucji nix-openclaw należy skorzystać z [przewodnika Szybki start dla nix-openclaw](https://github.com/openclaw/nix-openclaw#quick-start) i ustawić wartości w `programs.openclaw.config` lub `instances.<name>.config`.
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

Notacja kropkowa lub nawiasowa. W przykładach powłoki ujmuj ścieżki nawiasowe w cudzysłowy, aby zsh nie rozwijał `[0]` jako wzorca glob:

```bash
openclaw config get agents.defaults.workspace
openclaw config get 'agents.list[0].id'
openclaw config get agents.list
openclaw config set 'agents.list[1].tools.exec.node' "node-id-or-name"
```

### `config get`

Odczytuje wartość ze zredagowanej migawki konfiguracji (sekrety nigdy nie są wyświetlane). `--json` wyświetla nieprzetworzoną wartość jako JSON; w przeciwnym razie ciągi znaków, liczby i wartości logiczne są wyświetlane bez formatowania, a obiekty i tablice jako sformatowany JSON.

```bash
openclaw config get browser.executablePath
openclaw config get agents.defaults.model --json
```

### `config file`

Wyświetla ścieżkę aktywnego pliku konfiguracyjnego, ustaloną na podstawie `OPENCLAW_CONFIG_PATH` lub domyślnej lokalizacji. Ścieżka wskazuje zwykły plik, a nie dowiązanie symboliczne; zobacz [Bezpieczeństwo zapisu](#write-safety).

### `config schema`

Wyświetla na standardowym wyjściu wygenerowany schemat JSON dla `openclaw.json`.

<AccordionGroup>
  <Accordion title="Co zawiera">
    - Bieżący główny schemat konfiguracji wraz z głównym polem tekstowym `$schema` przeznaczonym dla narzędzi edytora.
    - Metadane dokumentacji pól `title` / `description` używane przez interfejs Control UI.
    - Węzły zagnieżdżonych obiektów, symboli wieloznacznych (`*`) i elementów tablicy (`[]`) dziedziczą te same metadane `title` / `description`, gdy istnieje pasująca dokumentacja pól.
    - Gałęzie `anyOf` / `oneOf` / `allOf` również dziedziczą te same metadane dokumentacji.
    - Pozyskiwane w miarę możliwości bieżące metadane schematów pluginów i kanałów, gdy można wczytać manifesty środowiska uruchomieniowego.
    - Poprawny schemat zastępczy nawet wtedy, gdy bieżąca konfiguracja jest nieprawidłowa.

  </Accordion>
  <Accordion title="Powiązane RPC środowiska uruchomieniowego">
    `config.schema.lookup` zwraca jedną znormalizowaną ścieżkę konfiguracji z płytkim węzłem schematu (`title`, `description`, `type`, `enum`, `const`, typowe ograniczenia), dopasowanymi metadanymi wskazówek interfejsu oraz podsumowaniami bezpośrednich elementów podrzędnych. Należy go używać do przeglądania szczegółów w zakresie ścieżki w Control UI lub klientach niestandardowych.
  </Accordion>
</AccordionGroup>

```bash
openclaw config schema
openclaw config schema > openclaw.schema.json
```

### `config validate`

Waliduje bieżącą konfigurację względem aktywnego schematu bez uruchamiania gatewaya.

```bash
openclaw config validate
openclaw config validate --json
```

<Note>
Jeśli walidacja już kończy się niepowodzeniem, należy zacząć od `openclaw configure` lub `openclaw doctor --fix`. `openclaw chat` nie omija zabezpieczenia przed nieprawidłową konfiguracją.
</Note>

## Wartości

Wartości są analizowane jako JSON5, gdy jest to możliwe; w przeciwnym razie są traktowane jako nieprzetworzone ciągi znaków. Użyj `--strict-json`, aby wymagać standardowego formatu JSON bez awaryjnego traktowania wartości jako ciągu znaków (składnia dostępna tylko w JSON5, taka jak komentarze, końcowe przecinki lub klucze bez cudzysłowów, jest wtedy odrzucana). `--json` jest starszym aliasem `--strict-json` w `config set`.

```bash
openclaw config set agents.defaults.heartbeat.every "0m"
openclaw config set gateway.port 19001 --strict-json
openclaw config set channels.whatsapp.groups '["*"]' --strict-json
```

`config get <path> --json` wyświetla nieprzetworzoną wartość jako JSON zamiast tekstu sformatowanego dla terminala.

<Note>
Przypisanie obiektu domyślnie zastępuje ścieżkę docelową. Chronione ścieżki, które często zawierają wpisy dodane przez użytkownika, odrzucają zastąpienia usuwające istniejące wpisy, chyba że przekazano `--replace`: `agents.defaults.models`, `agents.list`, `models.providers`, `models.providers.<id>`, `models.providers.<id>.models`, `plugins.entries` i `auth.profiles`.
</Note>

Podczas dodawania wpisów do tych map należy użyć `--merge`:

```bash
openclaw config set agents.defaults.models '{"openai/gpt-5.4":{}}' --strict-json --merge
openclaw config set models.providers.ollama.models '[{"id":"llama3.2","name":"Llama 3.2"}]' --strict-json --merge
```

Należy używać `--replace` tylko wtedy, gdy podana wartość ma celowo stać się pełną wartością docelową.

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
    Obsługuje tylko ścieżki `secrets.providers.<alias>`:

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
Przypisania SecretRef są odrzucane na nieobsługiwanych powierzchniach modyfikowalnych w czasie działania (na przykład `hooks.token`, `commands.ownerDisplaySecret`, tokenach webhooków powiązań wątków Discord i danych uwierzytelniających WhatsApp w formacie JSON). Zobacz [Powierzchnia danych uwierzytelniających SecretRef](/pl/reference/secretref-credential-surface).
</Warning>

Analiza wsadowa zawsze używa ładunku wsadowego (`--batch-json`/`--batch-file`) jako źródła prawdy; `--strict-json` / `--json` nie zmieniają sposobu analizy wsadowej.

Tryb ścieżki/wartości JSON działa również bezpośrednio dla SecretRef i dostawców:

```bash
openclaw config set channels.discord.token \
  '{"source":"env","provider":"default","id":"DISCORD_BOT_TOKEN"}' \
  --strict-json

openclaw config set secrets.providers.vaultfile \
  '{"source":"file","path":"/etc/openclaw/secrets.json","mode":"json"}' \
  --strict-json
```

### Flagi konstruktora dostawcy

Elementy docelowe konstruktora dostawcy muszą używać `secrets.providers.<alias>` jako ścieżki.

<AccordionGroup>
  <Accordion title="Wspólne flagi">
    - `--provider-source <env|file|exec>`
    - `--provider-timeout-ms <ms>` (`file`, `exec`)

  </Accordion>
  <Accordion title="Dostawca środowiskowy (--provider-source env)">
    - `--provider-allowlist <ENV_VAR>` (powtarzalne)

  </Accordion>
  <Accordion title="Dostawca plikowy (--provider-source file)">
    - `--provider-path <path>` (wymagane)
    - `--provider-mode <singleValue|json>`
    - `--provider-max-bytes <bytes>`
    - `--provider-allow-insecure-path`

  </Accordion>
  <Accordion title="Dostawca wykonawczy (--provider-source exec)">
    - `--provider-command <path>` (wymagane)
    - `--provider-arg <arg>` (powtarzalne)
    - `--provider-no-output-timeout-ms <ms>`
    - `--provider-max-output-bytes <bytes>`
    - `--provider-json-only`
    - `--provider-env <KEY=VALUE>` (powtarzalne)
    - `--provider-pass-env <ENV_VAR>` (powtarzalne)
    - `--provider-trusted-dir <path>` (powtarzalne)
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

Wklej lub przekaż potokiem łatę JSON5 o strukturze konfiguracji zamiast uruchamiać wiele poleceń `config set` opartych na ścieżkach. Obiekty są scalane rekurencyjnie; tablice i wartości skalarne zastępują element docelowy; `null` usuwa ścieżkę docelową.

```bash
openclaw config patch --file ./openclaw.patch.json5 --dry-run
openclaw config patch --file ./openclaw.patch.json5
```

W skryptach zdalnej konfiguracji należy przekazać łatę przez standardowe wejście:

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

Użyj `--replace-path <path>`, gdy jeden obiekt lub jedna tablica musi przyjąć dokładnie podaną wartość zamiast być modyfikowana rekurencyjnie:

```bash
openclaw config patch --file ./discord.patch.json5 --replace-path 'channels.discord.guilds["123"].channels'
```

`--dry-run` przeprowadza kontrolę schematu i rozwiązywalności SecretRef bez zapisywania. Odwołania SecretRef obsługiwane przez polecenia wykonawcze są domyślnie pomijane podczas przebiegu próbnego; dodaj `--allow-exec`, jeśli przebieg próbny ma celowo wykonywać polecenia dostawcy.

## Przebieg próbny

`--dry-run` waliduje zmiany bez zapisywania `openclaw.json`. Dostępne dla `config set`, `config patch` i `config unset`.

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
    - Tryb kreatora: wykonuje sprawdzenia rozwiązywalności SecretRef dla zmienionych odwołań/dostawców.
    - Tryb JSON (`--strict-json`, `--json` lub tryb wsadowy): wykonuje walidację schematu oraz sprawdzenia rozwiązywalności SecretRef.
    - Walidacja zasad jest wykonywana względem pełnej konfiguracji po zmianach, więc zapisy obiektów nadrzędnych (na przykład ustawienie `hooks` jako obiektu) nie mogą ominąć walidacji nieobsługiwanych obszarów.
    - Sprawdzenia SecretRef typu exec są domyślnie pomijane, aby uniknąć skutków ubocznych poleceń; przekaż `--allow-exec`, aby je włączyć (może to spowodować wykonanie poleceń dostawcy). `--allow-exec` działa tylko w trybie próbnym i zgłasza błąd bez `--dry-run`.

  </Accordion>
  <Accordion title="Pola --dry-run --json">
    - `ok`: czy tryb próbny zakończył się powodzeniem
    - `operations`: liczba ocenionych przypisań
    - `checks`: czy wykonano sprawdzenia schematu/rozwiązywalności
    - `checks.resolvabilityComplete`: czy sprawdzenia rozwiązywalności wykonano do końca (wartość false, gdy odwołania exec są pomijane)
    - `refsChecked`: liczba odwołań faktycznie rozwiązanych w trybie próbnym
    - `skippedExecRefs`: liczba odwołań exec pominiętych, ponieważ nie ustawiono `--allow-exec`
    - `errors`: ustrukturyzowane błędy brakujących ścieżek, schematu lub rozwiązywalności, gdy `ok=false`

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
      ref?: string, // obecne w przypadku błędów rozwiązywalności
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
    - `config schema validation failed`: struktura konfiguracji po zmianach jest nieprawidłowa; popraw ścieżkę/wartość albo strukturę obiektu dostawcy/odwołania.
    - `Config policy validation failed: unsupported SecretRef usage`: przenieś te dane uwierzytelniające z powrotem do danych wejściowych w postaci zwykłego tekstu/ciągu znaków; używaj SecretRef tylko w obsługiwanych obszarach.
    - `SecretRef assignment(s) could not be resolved`: obecnie nie można rozwiązać wskazanego dostawcy/odwołania (brak zmiennej środowiskowej, nieprawidłowy wskaźnik pliku, błąd dostawcy exec lub niezgodność dostawcy ze źródłem).
    - `Dry run note: skipped <n> exec SecretRef resolvability check(s)`: uruchom ponownie z `--allow-exec`, jeśli potrzebna jest walidacja rozwiązywalności exec.
    - W trybie wsadowym popraw pozycje powodujące błędy i ponownie uruchom `--dry-run` przed zapisem.

  </Accordion>
</AccordionGroup>

## Stosowanie zmian

Po każdym pomyślnym wykonaniu `config set` / `config patch` / `config unset` CLI wyświetla jedną z trzech wskazówek informujących, czy Gateway wymaga ponownego uruchomienia:

| Wskazówka                                          | Znaczenie                                           |
| --------------------------------------------------- | --------------------------------------------------- |
| `Restart the gateway to apply.`                     | Zmieniona ścieżka wymaga pełnego ponownego uruchomienia. |
| `Change will apply without restarting the gateway.` | Przeładowanie na gorąco zastosuje ją automatycznie. |
| `No gateway restart needed.`                        | Nie zmieniono niczego istotnego dla środowiska uruchomieniowego. |

Zapisy do `plugins.entries` (lub dowolnej podścieżki) zawsze wymagają ponownego uruchomienia, ponieważ CLI nie może potwierdzić, że metadane przeładowania każdego pluginu zostały wczytane.

## Bezpieczeństwo zapisu

`openclaw config set` i inne narzędzia zapisujące konfigurację należące do OpenClaw sprawdzają pełną konfigurację po zmianach przed zapisaniem jej na dysku. Jeśli nowa zawartość nie przejdzie walidacji schematu lub wygląda na destrukcyjne nadpisanie, aktywna konfiguracja pozostaje bez zmian, a odrzucona zawartość jest zapisywana obok niej jako `openclaw.json.rejected.*`.

Operacje zapisu należące do OpenClaw ponownie serializują JSON5 jako standardowy JSON. Jeśli źródło zawiera komentarze, narzędzie ostrzega bezpośrednio przed ich usunięciem; jeśli zachowanie komentarzy jest istotne, należy użyć bezpośrednio edytora.

<Warning>
Ścieżka aktywnej konfiguracji musi wskazywać zwykły plik. Układy `openclaw.json` wykorzystujące dowiązania symboliczne nie są obsługiwane przy zapisie; zamiast tego użyj `OPENCLAW_CONFIG_PATH`, aby wskazać bezpośrednio rzeczywisty plik.
</Warning>

W przypadku niewielkich zmian preferowany jest zapis za pomocą CLI:

```bash
openclaw config set gateway.reload.mode hybrid --dry-run
openclaw config set gateway.reload.mode hybrid
openclaw config validate
```

Jeśli zapis zostanie odrzucony, sprawdź zapisaną zawartość i popraw pełną strukturę konfiguracji:

```bash
CONFIG="$(openclaw config file)"
ls -lt "$CONFIG".rejected.* 2>/dev/null | head
openclaw config validate
```

Bezpośredni zapis z edytora jest nadal dozwolony, ale działający Gateway traktuje takie zmiany jako niezaufane, dopóki nie przejdą walidacji. Nieprawidłowe bezpośrednie zmiany powodują błąd uruchamiania lub są pomijane podczas przeładowania na gorąco; Gateway nie nadpisuje `openclaw.json`. Uruchom `openclaw doctor --fix`, aby naprawić konfigurację z dodanym prefiksem lub nadpisaną konfigurację albo przywrócić ostatnią znaną prawidłową kopię. Zobacz [rozwiązywanie problemów z Gateway](/pl/gateway/troubleshooting#gateway-rejected-invalid-config).

Odzyskiwanie całego pliku jest zarezerwowane dla napraw wykonywanych przez narzędzie doctor. Zmiany schematu pluginu lub rozbieżność `minHostVersion` pozostają wyraźnie zgłaszane zamiast powodować wycofanie niepowiązanych ustawień użytkownika, takich jak konfiguracja modeli, dostawców, profili uwierzytelniania, kanałów, dostępności Gateway, narzędzi, pamięci, przeglądarki lub cron.

## Pętla naprawcza

Po pomyślnym wykonaniu `openclaw config validate` użyj lokalnego TUI, aby osadzony agent porównał aktywną konfigurację z dokumentacją podczas sprawdzania każdej zmiany w tym samym terminalu:

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
    Poproś agenta o porównanie bieżącej konfiguracji z odpowiednią stroną dokumentacji i zaproponowanie najmniejszej poprawki.
  </Step>
  <Step title="Zastosuj ukierunkowane zmiany">
    Zastosuj ukierunkowane zmiany za pomocą `openclaw config set` lub `openclaw configure`.
  </Step>
  <Step title="Ponownie zweryfikuj">
    Po każdej zmianie ponownie uruchom `openclaw config validate`.
  </Step>
  <Step title="Użyj narzędzia doctor w przypadku problemów ze środowiskiem uruchomieniowym">
    Jeśli walidacja zakończy się powodzeniem, ale środowisko uruchomieniowe nadal nie działa prawidłowo, uruchom `openclaw doctor` lub `openclaw doctor --fix`, aby uzyskać pomoc w migracji i naprawie.
  </Step>
</Steps>

## Powiązane materiały

- [Dokumentacja CLI](/pl/cli)
- [Konfiguracja](/pl/gateway/configuration)
