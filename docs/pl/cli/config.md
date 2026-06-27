---
read_when:
    - Chcesz odczytać lub edytować konfigurację nieinteraktywnie
sidebarTitle: Config
summary: Dokumentacja CLI dla `openclaw config` (get/set/patch/unset/file/schema/validate)
title: Konfiguracja
x-i18n:
    generated_at: "2026-06-27T17:19:36Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d658c0edbf900565c4645c1d24a9f3e092a3d8a4fec85f7fc7e3989550d13197
    source_path: cli/config.md
    workflow: 16
---

Pomocniki konfiguracji do nieinteraktywnych edycji w `openclaw.json`: pobieranie/ustawianie/łatkowanie/usuwanie/plik/schemat/walidacja wartości według ścieżki oraz wypisywanie aktywnego pliku konfiguracji. Uruchom bez podpolecenia, aby otworzyć kreator konfiguracji (tak samo jak `openclaw configure`).

<Note>
Gdy `OPENCLAW_NIX_MODE=1`, OpenClaw traktuje `openclaw.json` jako niezmienny. Polecenia tylko do odczytu, takie jak `config get`, `config file`, `config schema` i `config validate`, nadal działają, ale polecenia zapisujące konfigurację odmawiają działania. Agenty powinny zamiast tego edytować źródło Nix dla instalacji; w przypadku własnej dystrybucji nix-openclaw użyj [nix-openclaw Quick Start](https://github.com/openclaw/nix-openclaw#quick-start) i ustaw wartości w `programs.openclaw.config` albo `instances.<name>.config`.
</Note>

## Opcje główne

<ParamField path="--section <section>" type="string">
  Powtarzalny filtr sekcji konfiguracji prowadzonej, gdy uruchamiasz `openclaw config` bez podpolecenia.
</ParamField>

Obsługiwane sekcje prowadzone: `workspace`, `model`, `web`, `gateway`, `daemon`, `channels`, `plugins`, `skills`, `health`.

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

### `config schema`

Wypisz wygenerowany schemat JSON dla `openclaw.json` na standardowe wyjście jako JSON.

<AccordionGroup>
  <Accordion title="Co obejmuje">
    - Bieżący główny schemat konfiguracji oraz główne pole tekstowe `$schema` dla narzędzi edytora.
    - Metadane dokumentacji `title` i `description` pól używane przez Control UI.
    - Zagnieżdżone obiekty, symbole wieloznaczne (`*`) i węzły elementów tablicy (`[]`) dziedziczą te same metadane `title` / `description`, gdy istnieje pasująca dokumentacja pola.
    - Gałęzie `anyOf` / `oneOf` / `allOf` również dziedziczą te same metadane dokumentacji, gdy istnieje pasująca dokumentacja pola.
    - Metadane schematu Plugin + kanału w trybie best-effort, gdy można załadować manifesty runtime.
    - Czysty schemat zastępczy nawet wtedy, gdy bieżąca konfiguracja jest nieprawidłowa.

  </Accordion>
  <Accordion title="Powiązane RPC runtime">
    `config.schema.lookup` zwraca jedną znormalizowaną ścieżkę konfiguracji z płytkim węzłem schematu (`title`, `description`, `type`, `enum`, `const`, typowe ograniczenia), dopasowanymi metadanymi wskazówek UI i podsumowaniami bezpośrednich elementów podrzędnych. Użyj tego do szczegółowego przechodzenia po ścieżce w Control UI albo niestandardowych klientach.
  </Accordion>
</AccordionGroup>

```bash
openclaw config schema
```

Przekieruj wynik do pliku, gdy chcesz go sprawdzić lub zwalidować innymi narzędziami:

```bash
openclaw config schema > openclaw.schema.json
```

### Ścieżki

Ścieżki używają notacji kropkowej lub nawiasowej. Cytuj ścieżki w notacji nawiasowej w przykładach powłoki, aby powłoki takie jak zsh nie rozwinęły `[0]` jako globu, zanim OpenClaw otrzyma ścieżkę:

```bash
openclaw config get agents.defaults.workspace
openclaw config get 'agents.list[0].id'
```

Użyj indeksu listy agentów, aby wskazać konkretnego agenta:

```bash
openclaw config get agents.list
openclaw config set 'agents.list[1].tools.exec.node' "node-id-or-name"
```

## Wartości

Wartości są parsowane jako JSON5, gdy to możliwe; w przeciwnym razie są traktowane jako ciągi znaków. Użyj `--strict-json`, aby wymagać parsowania JSON5. `--json` pozostaje obsługiwane jako starszy alias.

```bash
openclaw config set agents.defaults.heartbeat.every "0m"
openclaw config set gateway.port 19001 --strict-json
openclaw config set channels.whatsapp.groups '["*"]' --strict-json
```

`config get <path> --json` wypisuje surową wartość jako JSON zamiast tekstu sformatowanego dla terminala.

<Note>
Przypisanie obiektu domyślnie zastępuje ścieżkę docelową. Chronione ścieżki map/list, które często przechowują wpisy dodane przez użytkownika, takie jak `agents.defaults.models`, `models.providers`, `models.providers.<id>.models`, `plugins.entries` i `auth.profiles`, odrzucają zastąpienia, które usunęłyby istniejące wpisy, chyba że przekażesz `--replace`.
</Note>

Użyj `--merge`, gdy dodajesz wpisy do tych map:

```bash
openclaw config set agents.defaults.models '{"openai/gpt-5.4":{}}' --strict-json --merge
openclaw config set models.providers.ollama.models '[{"id":"llama3.2","name":"Llama 3.2"}]' --strict-json --merge
```

Użyj `--replace` tylko wtedy, gdy celowo chcesz, aby podana wartość stała się pełną wartością docelową.

## Tryby `config set`

`openclaw config set` obsługuje cztery style przypisywania:

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
    Tryb konstruktora dostawcy wskazuje tylko ścieżki `secrets.providers.<alias>`:

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
Przypisania SecretRef są odrzucane na nieobsługiwanych powierzchniach zmiennych w runtime (na przykład `hooks.token`, `commands.ownerDisplaySecret`, tokeny Webhook wiązania wątków Discord oraz JSON poświadczeń WhatsApp). Zobacz [Powierzchnia poświadczeń SecretRef](/pl/reference/secretref-credential-surface).
</Warning>

Parsowanie wsadowe zawsze używa ładunku wsadowego (`--batch-json`/`--batch-file`) jako źródła prawdy. `--strict-json` / `--json` nie zmieniają zachowania parsowania wsadowego.

## `config patch`

Użyj `config patch`, gdy chcesz wkleić lub przekazać potokiem łatkę o kształcie konfiguracji zamiast uruchamiać wiele poleceń `config set` opartych na ścieżkach. Dane wejściowe są obiektem JSON5. Obiekty scalają się rekurencyjnie, tablice i wartości skalarne zastępują wartość docelową, a `null` usuwa ścieżkę docelową.

```bash
openclaw config patch --file ./openclaw.patch.json5 --dry-run
openclaw config patch --file ./openclaw.patch.json5
```

Możesz też przekazać łatkę przez stdin, co jest przydatne w zdalnych skryptach konfiguracji:

```bash
ssh openclaw-host 'openclaw config patch --stdin --dry-run' < ./openclaw.patch.json5
ssh openclaw-host 'openclaw config patch --stdin' < ./openclaw.patch.json5
```

Przykładowa łatka:

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
      model: { primary: "openai/gpt-5.5" },
      models: {
        "openai/gpt-5.5": { params: { fastMode: true } },
      },
    },
  },
}
```

Użyj `--replace-path <path>`, gdy jeden obiekt lub jedna tablica musi stać się dokładnie podaną wartością zamiast być łatana rekurencyjnie:

```bash
openclaw config patch --file ./discord.patch.json5 --replace-path 'channels.discord.guilds["123"].channels'
```

`--dry-run` uruchamia kontrole schematu i rozwiązywalności SecretRef bez zapisywania. SecretRefy oparte na exec są domyślnie pomijane podczas dry-run; dodaj `--allow-exec`, gdy celowo chcesz, aby dry-run wykonywał polecenia dostawcy.

Tryb ścieżka/wartość JSON pozostaje obsługiwany zarówno dla SecretRefów, jak i dostawców:

```bash
openclaw config set channels.discord.token \
  '{"source":"env","provider":"default","id":"DISCORD_BOT_TOKEN"}' \
  --strict-json

openclaw config set secrets.providers.vaultfile \
  '{"source":"file","path":"/etc/openclaw/secrets.json","mode":"json"}' \
  --strict-json
```

## Flagi konstruktora dostawcy

Cele konstruktora dostawcy muszą używać `secrets.providers.<alias>` jako ścieżki.

<AccordionGroup>
  <Accordion title="Wspólne flagi">
    - `--provider-source <env|file|exec>`
    - `--provider-timeout-ms <ms>` (`file`, `exec`)

  </Accordion>
  <Accordion title="Dostawca env (--provider-source env)">
    - `--provider-allowlist <ENV_VAR>` (powtarzalne)

  </Accordion>
  <Accordion title="Dostawca plikowy (--provider-source file)">
    - `--provider-path <path>` (wymagane)
    - `--provider-mode <singleValue|json>`
    - `--provider-max-bytes <bytes>`
    - `--provider-allow-insecure-path`

  </Accordion>
  <Accordion title="Dostawca exec (--provider-source exec)">
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

Przykład wzmocnionego dostawcy exec:

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

## Dry run

Użyj `--dry-run`, aby zweryfikować zmiany bez zapisywania `openclaw.json`.

```bash
openclaw config set channels.discord.token \
  --ref-provider default \
  --ref-source env \
  --ref-id DISCORD_BOT_TOKEN \
  --dry-run

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
  <Accordion title="Zachowanie dry-run">
    - Tryb konstruktora: uruchamia kontrole rozwiązywalności SecretRef dla zmienionych referencji/dostawców.
    - Tryb JSON (`--strict-json`, `--json` lub tryb wsadowy): uruchamia walidację schematu oraz kontrole rozwiązywalności SecretRef.
    - Walidacja zasad uruchamia się również dla znanych nieobsługiwanych powierzchni docelowych SecretRef.
    - Kontrole zasad oceniają pełną konfigurację po zmianie, więc zapisy obiektów nadrzędnych (na przykład ustawienie `hooks` jako obiektu) nie mogą obejść walidacji nieobsługiwanej powierzchni.
    - Kontrole SecretRef exec są domyślnie pomijane podczas dry-run, aby uniknąć efektów ubocznych poleceń.
    - Użyj `--allow-exec` z `--dry-run`, aby włączyć kontrole SecretRef exec (może to wykonać polecenia dostawcy).
    - `--allow-exec` działa tylko z dry-run i zgłasza błąd, jeśli zostanie użyte bez `--dry-run`.

  </Accordion>
  <Accordion title="Pola --dry-run --json">
    `--dry-run --json` wypisuje raport czytelny maszynowo:

    - `ok`: czy przebieg próbny się powiódł
    - `operations`: liczba ocenionych przypisań
    - `checks`: czy uruchomiono kontrole schematu/rozwiązywalności
    - `checks.resolvabilityComplete`: czy kontrole rozwiązywalności zostały doprowadzone do końca (false, gdy odwołania exec są pomijane)
    - `refsChecked`: liczba odwołań faktycznie rozwiązanych podczas przebiegu próbnego
    - `skippedExecRefs`: liczba odwołań exec pominiętych, ponieważ nie ustawiono `--allow-exec`
    - `errors`: ustrukturyzowane błędy brakującej ścieżki, schematu lub rozwiązywalności, gdy `ok=false`

  </Accordion>
</AccordionGroup>

### Kształt wyjścia JSON

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
      ref?: string, // obecne dla błędów rozwiązywalności
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
          "message": "Error: Environment variable \"MISSING_TEST_SECRET\" is not set.",
          "ref": "env:default:MISSING_TEST_SECRET"
        }
      ]
    }
    ```
  </Tab>
</Tabs>

<AccordionGroup>
  <Accordion title="Jeśli przebieg próbny się nie powiedzie">
    - `config schema validation failed`: kształt konfiguracji po zmianie jest nieprawidłowy; napraw ścieżkę/wartość albo kształt obiektu dostawcy/odwołania.
    - `Config policy validation failed: unsupported SecretRef usage`: przenieś te dane uwierzytelniające z powrotem do wejścia w postaci zwykłego tekstu/ciągu znaków i pozostaw SecretRef tylko na obsługiwanych powierzchniach.
    - `SecretRef assignment(s) could not be resolved`: wskazany dostawca/odwołanie obecnie nie może zostać rozwiązane (brakująca zmienna env, nieprawidłowy wskaźnik pliku, awaria dostawcy exec lub niezgodność dostawcy/źródła).
    - `Dry run note: skipped <n> exec SecretRef resolvability check(s)`: przebieg próbny pominął odwołania exec; uruchom ponownie z `--allow-exec`, jeśli potrzebujesz walidacji rozwiązywalności exec.
    - W trybie wsadowym napraw wpisy zakończone niepowodzeniem i uruchom ponownie `--dry-run` przed zapisem.

  </Accordion>
</AccordionGroup>

## Bezpieczeństwo zapisu

`openclaw config set` i inne należące do OpenClaw narzędzia zapisujące konfigurację walidują pełną konfigurację po zmianie przed zapisaniem jej na dysku. Jeśli nowy ładunek nie przejdzie walidacji schematu albo wygląda na destrukcyjne nadpisanie, aktywna konfiguracja pozostaje bez zmian, a odrzucony ładunek jest zapisywany obok niej jako `openclaw.json.rejected.*`.

<Warning>
Aktywna ścieżka konfiguracji musi być zwykłym plikiem. Układy `openclaw.json` z dowiązaniem symbolicznym nie są obsługiwane przy zapisach; zamiast tego użyj `OPENCLAW_CONFIG_PATH`, aby wskazać bezpośrednio prawdziwy plik.
</Warning>

Preferuj zapisy przez CLI dla małych edycji:

```bash
openclaw config set gateway.reload.mode hybrid --dry-run
openclaw config set gateway.reload.mode hybrid
openclaw config validate
```

Jeśli zapis zostanie odrzucony, sprawdź zapisany ładunek i napraw pełny kształt konfiguracji:

```bash
CONFIG="$(openclaw config file)"
ls -lt "$CONFIG".rejected.* 2>/dev/null | head
openclaw config validate
```

Bezpośrednie zapisy w edytorze są nadal dozwolone, ale działający Gateway traktuje je jako niezaufane, dopóki nie przejdą walidacji. Nieprawidłowe bezpośrednie edycje powodują niepowodzenie uruchamiania albo są pomijane przez przeładowanie na gorąco; Gateway nie przepisuje `openclaw.json`. Uruchom `openclaw doctor --fix`, aby naprawić konfigurację z prefiksem/nadpisaną albo przywrócić ostatnią znaną dobrą kopię. Zobacz [Rozwiązywanie problemów z Gateway](/pl/gateway/troubleshooting#gateway-rejected-invalid-config).

Odzyskiwanie całego pliku jest zarezerwowane dla naprawy przez doctor. Zmiany schematu Plugin lub rozjazd `minHostVersion` pozostają jawne zamiast wycofywać niepowiązane ustawienia użytkownika, takie jak konfiguracja modeli, dostawców, profili auth, kanałów, ekspozycji gateway, narzędzi, pamięci, przeglądarki czy cron.

## Podkomendy

- `config file`: Wyświetla ścieżkę aktywnego pliku konfiguracji (rozwiązaną z `OPENCLAW_CONFIG_PATH` albo domyślnej lokalizacji). Ścieżka powinna wskazywać zwykły plik, a nie dowiązanie symboliczne.

Uruchom ponownie gateway po edycjach.

## Walidacja

Zweryfikuj bieżącą konfigurację względem aktywnego schematu bez uruchamiania gateway.

```bash
openclaw config validate
openclaw config validate --json
```

Gdy `openclaw config validate` przechodzi, możesz użyć lokalnego TUI, aby osadzony agent porównał aktywną konfigurację z dokumentacją, podczas gdy walidujesz każdą zmianę z tego samego terminala:

<Note>
Jeśli walidacja już kończy się niepowodzeniem, zacznij od `openclaw configure` albo `openclaw doctor --fix`. `openclaw chat` nie omija zabezpieczenia przed nieprawidłową konfiguracją.
</Note>

```bash
openclaw chat
```

Następnie w TUI:

```text
!openclaw config file
!openclaw docs gateway auth token secretref
!openclaw config validate
!openclaw doctor
```

Typowa pętla naprawcza:

<Steps>
  <Step title="Porównaj z dokumentacją">
    Poproś agenta, aby porównał bieżącą konfigurację z odpowiednią stroną dokumentacji i zasugerował najmniejszą poprawkę.
  </Step>
  <Step title="Zastosuj ukierunkowane edycje">
    Zastosuj ukierunkowane edycje za pomocą `openclaw config set` albo `openclaw configure`.
  </Step>
  <Step title="Zweryfikuj ponownie">
    Uruchom ponownie `openclaw config validate` po każdej zmianie.
  </Step>
  <Step title="Doctor dla problemów środowiska uruchomieniowego">
    Jeśli walidacja przechodzi, ale środowisko uruchomieniowe nadal jest w złym stanie, uruchom `openclaw doctor` albo `openclaw doctor --fix`, aby uzyskać pomoc w migracji i naprawie.
  </Step>
</Steps>

## Powiązane

- [Dokumentacja CLI](/pl/cli)
- [Konfiguracja](/pl/gateway/configuration)
