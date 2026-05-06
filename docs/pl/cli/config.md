---
read_when:
    - Chcesz odczytać lub edytować konfigurację w trybie nieinteraktywnym
sidebarTitle: Config
summary: Dokumentacja referencyjna CLI dla `openclaw config` (get/set/patch/unset/file/schema/validate)
title: Konfiguracja
x-i18n:
    generated_at: "2026-05-06T17:52:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: e4e0d580347e162278277ddb33eed0e42105c5e85bac4325c07fa2cd700b831d
    source_path: cli/config.md
    workflow: 16
---

Pomocnicze narzędzia konfiguracji do nieinteraktywnych edycji w `openclaw.json`: pobieranie/ustawianie/łatanie/usuwanie/plik/schemat/walidacja wartości według ścieżki oraz wypisywanie aktywnego pliku konfiguracji. Uruchom bez podkomendy, aby otworzyć kreator konfiguracji (tak samo jak `openclaw configure`).

<Note>
Gdy `OPENCLAW_NIX_MODE=1`, OpenClaw traktuje `openclaw.json` jako niemodyfikowalny. Polecenia tylko do odczytu, takie jak `config get`, `config file`, `config schema` i `config validate`, nadal działają, ale polecenia zapisujące konfigurację odmawiają działania. Agenci powinni zamiast tego edytować źródło Nix dla instalacji; dla własnej dystrybucji nix-openclaw użyj [nix-openclaw Quick Start](https://github.com/openclaw/nix-openclaw#quick-start) i ustaw wartości pod `programs.openclaw.config` lub `instances.<name>.config`.
</Note>

## Opcje główne

<ParamField path="--section <section>" type="string">
  Powtarzalny filtr sekcji konfiguracji prowadzonej, gdy uruchamiasz `openclaw config` bez podkomendy.
</ParamField>

Obsługiwane sekcje konfiguracji prowadzonej: `workspace`, `model`, `web`, `gateway`, `daemon`, `channels`, `plugins`, `skills`, `health`.

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
    - Bieżący główny schemat konfiguracji oraz główne pole ciągu znaków `$schema` dla narzędzi edytora.
    - Metadane dokumentacji pól `title` i `description` używane przez Control UI.
    - Zagnieżdżone obiekty, wildcard (`*`) i węzły elementów tablicy (`[]`) dziedziczą te same metadane `title` / `description`, gdy istnieje pasująca dokumentacja pola.
    - Gałęzie `anyOf` / `oneOf` / `allOf` również dziedziczą te same metadane dokumentacji, gdy istnieje pasująca dokumentacja pola.
    - Metadane schematu Plugin + kanału w trybie best-effort na żywo, gdy można wczytać manifesty środowiska uruchomieniowego.
    - Czysty schemat awaryjny nawet wtedy, gdy bieżąca konfiguracja jest nieprawidłowa.

  </Accordion>
  <Accordion title="Powiązane RPC środowiska uruchomieniowego">
    `config.schema.lookup` zwraca jedną znormalizowaną ścieżkę konfiguracji z płytkim węzłem schematu (`title`, `description`, `type`, `enum`, `const`, typowe ograniczenia), dopasowanymi metadanymi wskazówek UI oraz podsumowaniami bezpośrednich elementów podrzędnych. Użyj go do zagłębiania się według ścieżki w Control UI lub klientach niestandardowych.
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

Wartości są analizowane jako JSON5, gdy to możliwe; w przeciwnym razie są traktowane jako ciągi znaków. Użyj `--strict-json`, aby wymagać analizy JSON5. `--json` pozostaje obsługiwany jako starszy alias.

```bash
openclaw config set agents.defaults.heartbeat.every "0m"
openclaw config set gateway.port 19001 --strict-json
openclaw config set channels.whatsapp.groups '["*"]' --strict-json
```

`config get <path> --json` wypisuje surową wartość jako JSON zamiast tekstu formatowanego dla terminala.

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
    Tryb konstruktora dostawcy celuje wyłącznie w ścieżki `secrets.providers.<alias>`:

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
Przypisania SecretRef są odrzucane na nieobsługiwanych powierzchniach modyfikowalnych w czasie działania (na przykład `hooks.token`, `commands.ownerDisplaySecret`, tokeny Webhook powiązania wątków Discord oraz JSON z poświadczeniami WhatsApp). Zobacz [SecretRef Credential Surface](/pl/reference/secretref-credential-surface).
</Warning>

Analiza wsadowa zawsze używa ładunku wsadowego (`--batch-json`/`--batch-file`) jako źródła prawdy. `--strict-json` / `--json` nie zmieniają zachowania analizy wsadowej.

## `config patch`

Użyj `config patch`, gdy chcesz wkleić lub przesłać potokiem łatkę w kształcie konfiguracji zamiast uruchamiać wiele poleceń `config set` opartych na ścieżkach. Wejście jest obiektem JSON5. Obiekty są scalane rekurencyjnie, tablice i wartości skalarne zastępują wartość docelową, a `null` usuwa ścieżkę docelową.

```bash
openclaw config patch --file ./openclaw.patch.json5 --dry-run
openclaw config patch --file ./openclaw.patch.json5
```

Możesz też przesłać łatkę potokiem przez stdin, co jest przydatne w zdalnych skryptach konfiguracji:

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

Użyj `--replace-path <path>`, gdy jeden obiekt lub tablica musi stać się dokładnie podaną wartością zamiast być łatana rekurencyjnie:

```bash
openclaw config patch --file ./discord.patch.json5 --replace-path 'channels.discord.guilds["123"].channels'
```

`--dry-run` uruchamia kontrole schematu i rozwiązywalności SecretRef bez zapisu. SecretRef oparte na exec są domyślnie pomijane podczas próby na sucho; dodaj `--allow-exec`, gdy celowo chcesz, aby próba na sucho wykonała polecenia dostawcy.

Tryb ścieżki/wartości JSON pozostaje obsługiwany zarówno dla SecretRef, jak i dostawców:

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

## Próba na sucho

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
  <Accordion title="Zachowanie próby na sucho">
    - Tryb konstruktora: uruchamia kontrole rozwiązywalności SecretRef dla zmienionych referencji/dostawców.
    - Tryb JSON (`--strict-json`, `--json` lub tryb wsadowy): uruchamia walidację schematu oraz kontrole rozwiązywalności SecretRef.
    - Walidacja zasad działa również dla znanych nieobsługiwanych powierzchni docelowych SecretRef.
    - Kontrole zasad oceniają pełną konfigurację po zmianie, więc zapisy obiektu nadrzędnego (na przykład ustawienie `hooks` jako obiektu) nie mogą ominąć walidacji nieobsługiwanej powierzchni.
    - Kontrole SecretRef typu exec są domyślnie pomijane podczas próby na sucho, aby uniknąć skutków ubocznych poleceń.
    - Użyj `--allow-exec` z `--dry-run`, aby włączyć kontrole SecretRef typu exec (może to wykonać polecenia dostawcy).
    - `--allow-exec` działa tylko przy próbie na sucho i zgłasza błąd, jeśli zostanie użyte bez `--dry-run`.

  </Accordion>
  <Accordion title="Pola --dry-run --json">
    `--dry-run --json` wypisuje raport czytelny maszynowo:

    - `ok`: czy dry-run zakończył się powodzeniem
    - `operations`: liczba ocenionych przypisań
    - `checks`: czy uruchomiono kontrole schematu/rozwiązywalności
    - `checks.resolvabilityComplete`: czy kontrole rozwiązywalności dobiegły końca (false, gdy odwołania exec są pomijane)
    - `refsChecked`: liczba odwołań faktycznie rozwiązanych podczas dry-run
    - `skippedExecRefs`: liczba odwołań exec pominiętych, ponieważ nie ustawiono `--allow-exec`
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
  <Accordion title="Jeśli dry-run się nie powiedzie">
    - `config schema validation failed`: kształt konfiguracji po zmianie jest nieprawidłowy; popraw ścieżkę/wartość albo kształt obiektu provider/ref.
    - `Config policy validation failed: unsupported SecretRef usage`: przenieś te dane uwierzytelniające z powrotem do wejścia zwykłym tekstem/ciągiem i pozostaw SecretRefs tylko na obsługiwanych powierzchniach.
    - `SecretRef assignment(s) could not be resolved`: wskazany provider/ref nie może obecnie zostać rozwiązany (brakująca zmienna środowiskowa, nieprawidłowy wskaźnik pliku, awaria providera exec albo niezgodność providera/źródła).
    - `Dry run note: skipped <n> exec SecretRef resolvability check(s)`: dry-run pominął odwołania exec; uruchom ponownie z `--allow-exec`, jeśli potrzebujesz walidacji rozwiązywalności exec.
    - W trybie wsadowym popraw błędne wpisy i uruchom ponownie `--dry-run` przed zapisem.

  </Accordion>
</AccordionGroup>

## Bezpieczeństwo zapisu

`openclaw config set` i inne narzędzia zapisujące konfigurację należące do OpenClaw walidują pełną konfigurację po zmianie przed zapisaniem jej na dysku. Jeśli nowy ładunek nie przejdzie walidacji schematu albo wygląda jak destrukcyjne nadpisanie, aktywna konfiguracja pozostaje bez zmian, a odrzucony ładunek zostaje zapisany obok niej jako `openclaw.json.rejected.*`.

<Warning>
Ścieżka aktywnej konfiguracji musi wskazywać zwykły plik. Układy `openclaw.json` oparte na dowiązaniach symbolicznych nie są obsługiwane przy zapisie; zamiast tego użyj `OPENCLAW_CONFIG_PATH`, aby wskazać bezpośrednio rzeczywisty plik.
</Warning>

Preferuj zapisy przez CLI przy małych zmianach:

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

Bezpośrednie zapisy w edytorze nadal są dozwolone, ale uruchomiony Gateway traktuje je jako niezaufane, dopóki nie przejdą walidacji. Nieprawidłowe bezpośrednie edycje powodują błąd uruchamiania albo są pomijane przez przeładowanie na gorąco; Gateway nie przepisuje `openclaw.json`. Uruchom `openclaw doctor --fix`, aby naprawić konfigurację z prefiksem/nadpisaną albo przywrócić ostatnią znaną dobrą kopię. Zobacz [rozwiązywanie problemów z Gateway](/pl/gateway/troubleshooting#gateway-rejected-invalid-config).

Odzyskiwanie całego pliku jest zarezerwowane dla naprawy przez doctor. Zmiany schematu Plugin lub rozbieżność `minHostVersion` pozostają głośne zamiast wycofywać niepowiązane ustawienia użytkownika, takie jak modele, providerzy, profile uwierzytelniania, kanały, ekspozycja Gateway, narzędzia, pamięć, przeglądarka czy konfiguracja cron.

## Podkomendy

- `config file`: Wypisuje ścieżkę aktywnego pliku konfiguracji (rozwiązaną z `OPENCLAW_CONFIG_PATH` albo domyślnej lokalizacji). Ścieżka powinna wskazywać zwykły plik, a nie dowiązanie symboliczne.

Uruchom ponownie gateway po zmianach.

## Walidacja

Zweryfikuj bieżącą konfigurację względem aktywnego schematu bez uruchamiania gateway.

```bash
openclaw config validate
openclaw config validate --json
```

Gdy `openclaw config validate` przechodzi poprawnie, możesz użyć lokalnego TUI, aby osadzony agent porównał aktywną konfigurację z dokumentacją, podczas gdy walidujesz każdą zmianę z tego samego terminala:

<Note>
Jeśli walidacja już się nie powodzi, zacznij od `openclaw configure` albo `openclaw doctor --fix`. `openclaw chat` nie omija zabezpieczenia przed nieprawidłową konfiguracją.
</Note>

```bash
openclaw chat
```

Następnie wewnątrz TUI:

```text
!openclaw config file
!openclaw docs gateway auth token secretref
!openclaw config validate
!openclaw doctor
```

Typowa pętla naprawy:

<Steps>
  <Step title="Porównaj z dokumentacją">
    Poproś agenta o porównanie bieżącej konfiguracji z odpowiednią stroną dokumentacji i zaproponowanie najmniejszej poprawki.
  </Step>
  <Step title="Zastosuj ukierunkowane edycje">
    Zastosuj ukierunkowane edycje za pomocą `openclaw config set` albo `openclaw configure`.
  </Step>
  <Step title="Zweryfikuj ponownie">
    Uruchom ponownie `openclaw config validate` po każdej zmianie.
  </Step>
  <Step title="Doctor przy problemach w czasie działania">
    Jeśli walidacja przechodzi, ale środowisko wykonawcze nadal jest niezdrowe, uruchom `openclaw doctor` albo `openclaw doctor --fix`, aby uzyskać pomoc przy migracji i naprawie.
  </Step>
</Steps>

## Powiązane

- [Dokumentacja CLI](/pl/cli)
- [Konfiguracja](/pl/gateway/configuration)
