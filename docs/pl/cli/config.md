---
read_when:
    - Chcesz odczytać lub edytować konfigurację nieinteraktywnie
sidebarTitle: Config
summary: Dokumentacja referencyjna CLI dla `openclaw config` (get/set/patch/unset/file/schema/validate)
title: Konfiguracja
x-i18n:
    generated_at: "2026-04-30T09:42:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: f1f55c4b932d469cb9112d9f55b66f0ff88dbe066250651df7a0a753060a223d
    source_path: cli/config.md
    workflow: 16
---

Pomocniki konfiguracji do nieinteraktywnych edycji w `openclaw.json`: pobieraj/ustawiaj/łataj/usuwaj/wyświetlaj plik/schemat/waliduj wartości według ścieżki i wypisuj aktywny plik konfiguracji. Uruchom bez podpolecenia, aby otworzyć kreator konfiguracji (tak samo jak `openclaw configure`).

## Opcje główne

<ParamField path="--section <section>" type="string">
  Powtarzalny filtr sekcji konfiguracji z przewodnikiem, gdy uruchamiasz `openclaw config` bez podpolecenia.
</ParamField>

Obsługiwane sekcje z przewodnikiem: `workspace`, `model`, `web`, `gateway`, `daemon`, `channels`, `plugins`, `skills`, `health`.

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
openclaw config set agents.list[0].tools.exec.node "node-id-or-name"
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

Wypisz wygenerowany schemat JSON dla `openclaw.json` na stdout jako JSON.

<AccordionGroup>
  <Accordion title="Co zawiera">
    - Bieżący główny schemat konfiguracji oraz główne pole tekstowe `$schema` dla narzędzi edytora.
    - Metadane dokumentacji pól `title` i `description` używane przez Control UI.
    - Zagnieżdżone obiekty, symbole wieloznaczne (`*`) i węzły elementów tablicy (`[]`) dziedziczą te same metadane `title` / `description`, gdy istnieje pasująca dokumentacja pola.
    - Gałęzie `anyOf` / `oneOf` / `allOf` także dziedziczą te same metadane dokumentacji, gdy istnieje pasująca dokumentacja pola.
    - Metadane schematu pluginów i kanałów w trybie best-effort, gdy można załadować manifesty środowiska uruchomieniowego.
    - Czysty schemat awaryjny nawet wtedy, gdy bieżąca konfiguracja jest nieprawidłowa.

  </Accordion>
  <Accordion title="Powiązane RPC środowiska uruchomieniowego">
    `config.schema.lookup` zwraca jedną znormalizowaną ścieżkę konfiguracji z płytkim węzłem schematu (`title`, `description`, `type`, `enum`, `const`, typowe ograniczenia), dopasowanymi metadanymi podpowiedzi UI oraz podsumowaniami bezpośrednich elementów podrzędnych. Użyj tego do drążenia danych ograniczonego do ścieżki w Control UI lub klientach niestandardowych.
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

Ścieżki używają notacji kropkowej lub nawiasowej:

```bash
openclaw config get agents.defaults.workspace
openclaw config get agents.list[0].id
```

Użyj indeksu listy agentów, aby wskazać konkretnego agenta:

```bash
openclaw config get agents.list
openclaw config set agents.list[1].tools.exec.node "node-id-or-name"
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

`openclaw config set` obsługuje cztery style przypisania:

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
    Tryb konstruktora dostawcy obsługuje tylko ścieżki `secrets.providers.<alias>`:

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
Przypisania SecretRef są odrzucane na nieobsługiwanych powierzchniach modyfikowalnych w czasie działania (na przykład `hooks.token`, `commands.ownerDisplaySecret`, tokeny Webhook wiązania wątków Discord oraz JSON poświadczeń WhatsApp). Zobacz [Powierzchnia poświadczeń SecretRef](/pl/reference/secretref-credential-surface).
</Warning>

Parsowanie wsadowe zawsze używa ładunku wsadowego (`--batch-json`/`--batch-file`) jako źródła prawdy. `--strict-json` / `--json` nie zmieniają zachowania parsowania wsadowego.

## `config patch`

Użyj `config patch`, gdy chcesz wkleić lub przekazać potokiem łatkę o kształcie konfiguracji zamiast uruchamiać wiele poleceń `config set` opartych na ścieżkach. Dane wejściowe to obiekt JSON5. Obiekty są scalane rekursywnie, tablice i wartości skalarne zastępują wartość docelową, a `null` usuwa ścieżkę docelową.

```bash
openclaw config patch --file ./openclaw.patch.json5 --dry-run
openclaw config patch --file ./openclaw.patch.json5
```

Możesz także przekazać łatkę przez stdin, co jest przydatne w skryptach zdalnej konfiguracji:

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

Użyj `--replace-path <path>`, gdy jeden obiekt lub jedna tablica ma stać się dokładnie podaną wartością zamiast być łatana rekursywnie:

```bash
openclaw config patch --file ./discord.patch.json5 --replace-path 'channels.discord.guilds["123"].channels'
```

`--dry-run` uruchamia kontrole schematu i rozwiązywalności SecretRef bez zapisywania. SecretRefy oparte na exec są domyślnie pomijane podczas próby bez zapisu; dodaj `--allow-exec`, gdy celowo chcesz, aby próba bez zapisu wykonywała polecenia dostawcy.

Tryb ścieżki/wartości JSON pozostaje obsługiwany zarówno dla SecretRefów, jak i dostawców:

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
  <Accordion title="Typowe flagi">
    - `--provider-source <env|file|exec>`
    - `--provider-timeout-ms <ms>` (`file`, `exec`)

  </Accordion>
  <Accordion title="Dostawca env (--provider-source env)">
    - `--provider-allowlist <ENV_VAR>` (powtarzalne)

  </Accordion>
  <Accordion title="Dostawca pliku (--provider-source file)">
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

## Próba bez zapisu

Użyj `--dry-run`, aby zwalidować zmiany bez zapisywania `openclaw.json`.

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
  <Accordion title="Zachowanie próby bez zapisu">
    - Tryb konstruktora: uruchamia kontrole rozwiązywalności SecretRefów dla zmienionych referencji/dostawców.
    - Tryb JSON (`--strict-json`, `--json` lub tryb wsadowy): uruchamia walidację schematu oraz kontrole rozwiązywalności SecretRefów.
    - Walidacja zasad działa również dla znanych nieobsługiwanych powierzchni docelowych SecretRef.
    - Kontrole zasad oceniają pełną konfigurację po zmianie, więc zapisy obiektu nadrzędnego (na przykład ustawienie `hooks` jako obiektu) nie mogą ominąć walidacji nieobsługiwanej powierzchni.
    - Kontrole SecretRefów exec są domyślnie pomijane podczas próby bez zapisu, aby uniknąć efektów ubocznych poleceń.
    - Użyj `--allow-exec` z `--dry-run`, aby włączyć kontrole SecretRefów exec (może to wykonać polecenia dostawcy).
    - `--allow-exec` działa tylko w próbie bez zapisu i zgłasza błąd, jeśli zostanie użyte bez `--dry-run`.

  </Accordion>
  <Accordion title="Pola --dry-run --json">
    `--dry-run --json` wypisuje raport czytelny maszynowo:

    - `ok`: czy próba bez zapisu zakończyła się powodzeniem
    - `operations`: liczba ocenionych przypisań
    - `checks`: czy uruchomiono kontrole schematu/rozwiązywalności
    - `checks.resolvabilityComplete`: czy kontrole rozwiązywalności dobiegły końca (false, gdy referencje exec są pomijane)
    - `refsChecked`: liczba referencji faktycznie rozwiązanych podczas próby bez zapisu
    - `skippedExecRefs`: liczba referencji exec pominiętych, ponieważ `--allow-exec` nie zostało ustawione
    - `errors`: ustrukturyzowane błędy schematu/rozwiązywalności, gdy `ok=false`

  </Accordion>
</AccordionGroup>

### Kształt danych wyjściowych JSON

```json5
{
  ok: boolean,
  operations: number,
  configPath: string,
  inputModes: ["value" | "json" | "builder", ...],
  checks: {
    schema: boolean,
    resolvability: boolean,
    resolvabilityComplete: boolean,
  },
  refsChecked: number,
  skippedExecRefs: number,
  errors?: [
    {
      kind: "schema" | "resolvability",
      message: string,
      ref?: string, // present for resolvability errors
    },
  ],
}
```

<Tabs>
  <Tab title="Success example">
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
  <Tab title="Failure example">
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
  <Accordion title="If dry-run fails">
    - `config schema validation failed`: kształt konfiguracji po zmianie jest nieprawidłowy; popraw ścieżkę/wartość albo kształt obiektu dostawcy/odwołania.
    - `Config policy validation failed: unsupported SecretRef usage`: przenieś te dane uwierzytelniające z powrotem do wejścia zwykłego tekstu/ciągu znaków i używaj SecretRefs tylko na obsługiwanych powierzchniach.
    - `SecretRef assignment(s) could not be resolved`: wskazany dostawca/odwołanie obecnie nie może zostać rozwiązane (brakująca zmienna env, nieprawidłowy wskaźnik pliku, błąd dostawcy exec albo niezgodność dostawcy/źródła).
    - `Dry run note: skipped <n> exec SecretRef resolvability check(s)`: dry-run pominął odwołania exec; uruchom ponownie z `--allow-exec`, jeśli potrzebujesz walidacji rozwiązywalności exec.
    - W trybie wsadowym popraw błędne wpisy i uruchom ponownie `--dry-run` przed zapisem.

  </Accordion>
</AccordionGroup>

## Bezpieczeństwo zapisu

`openclaw config set` oraz inne moduły zapisujące konfigurację należące do OpenClaw walidują pełną konfigurację po zmianie przed zapisaniem jej na dysku. Jeśli nowy ładunek nie przejdzie walidacji schematu albo wygląda na destrukcyjne nadpisanie, aktywna konfiguracja pozostaje bez zmian, a odrzucony ładunek zostaje zapisany obok niej jako `openclaw.json.rejected.*`.

<Warning>
Aktywna ścieżka konfiguracji musi być zwykłym plikiem. Układy `openclaw.json` oparte na dowiązaniach symbolicznych nie są obsługiwane przy zapisie; zamiast tego użyj `OPENCLAW_CONFIG_PATH`, aby wskazać bezpośrednio rzeczywisty plik.
</Warning>

Przy małych zmianach preferuj zapis przez CLI:

```bash
openclaw config set gateway.reload.mode hybrid --dry-run
openclaw config set gateway.reload.mode hybrid
openclaw config validate
```

Jeśli zapis zostanie odrzucony, sprawdź zapisany ładunek i popraw pełny kształt konfiguracji:

```bash
CONFIG="$(openclaw config file)"
ls -lt "$CONFIG".rejected.* 2>/dev/null | head
openclaw config validate
```

Bezpośrednie zapisy w edytorze są nadal dozwolone, ale działający Gateway traktuje je jako niezaufane, dopóki nie przejdą walidacji. Nieprawidłowe bezpośrednie zmiany mogą zostać przywrócone z ostatniej znanej dobrej kopii zapasowej podczas uruchamiania lub hot reload. Zobacz [rozwiązywanie problemów z Gateway](/pl/gateway/troubleshooting#gateway-restored-last-known-good-config).

Odzyskiwanie całego pliku jest zarezerwowane dla globalnie uszkodzonej konfiguracji, takiej jak błędy parsowania, błędy schematu na poziomie głównym, błędy migracji starszych wersji albo mieszane błędy Plugin i poziomu głównego. Jeśli walidacja nie powiedzie się tylko pod `plugins.entries.<id>...`, OpenClaw pozostawia aktywny `openclaw.json` na miejscu i zgłasza lokalny problem Plugin zamiast przywracać `.last-good`. Zapobiega to wycofaniu niepowiązanych ustawień użytkownika, takich jak konfiguracja modeli, dostawców, profili uwierzytelniania, kanałów, ekspozycji Gateway, narzędzi, pamięci, przeglądarki czy cron, z powodu zmian schematu Plugin lub rozjazdu `minHostVersion`.

## Podpolecenia

- `config file`: Wypisz ścieżkę aktywnego pliku konfiguracji (ustaloną z `OPENCLAW_CONFIG_PATH` lub domyślnej lokalizacji). Ścieżka powinna wskazywać zwykły plik, a nie dowiązanie symboliczne.

Uruchom ponownie Gateway po edycjach.

## Walidacja

Sprawdź bieżącą konfigurację względem aktywnego schematu bez uruchamiania Gateway.

```bash
openclaw config validate
openclaw config validate --json
```

Gdy `openclaw config validate` przechodzi poprawnie, możesz użyć lokalnego TUI, aby osadzony agent porównał aktywną konfigurację z dokumentacją, podczas gdy weryfikujesz każdą zmianę z tego samego terminala:

<Note>
Jeśli walidacja już kończy się niepowodzeniem, zacznij od `openclaw configure` lub `openclaw doctor --fix`. `openclaw chat` nie omija zabezpieczenia przed nieprawidłową konfiguracją.
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

Typowa pętla naprawy:

<Steps>
  <Step title="Porównaj z dokumentacją">
    Poproś agenta o porównanie bieżącej konfiguracji z odpowiednią stroną dokumentacji i zasugerowanie najmniejszej poprawki.
  </Step>
  <Step title="Zastosuj ukierunkowane edycje">
    Zastosuj ukierunkowane edycje za pomocą `openclaw config set` lub `openclaw configure`.
  </Step>
  <Step title="Zweryfikuj ponownie">
    Uruchom ponownie `openclaw config validate` po każdej zmianie.
  </Step>
  <Step title="Doctor dla problemów w czasie działania">
    Jeśli walidacja przechodzi, ale środowisko uruchomieniowe nadal jest w złym stanie, uruchom `openclaw doctor` lub `openclaw doctor --fix`, aby uzyskać pomoc w migracji i naprawie.
  </Step>
</Steps>

## Powiązane

- [Dokumentacja CLI](/pl/cli)
- [Konfiguracja](/pl/gateway/configuration)
