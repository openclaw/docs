---
read_when:
    - Chcesz odczytywać lub edytować konfigurację w trybie nieinteraktywnym
summary: Dokumentacja CLI dla `openclaw config` (`get/set/unset/file/schema/validate`)
title: config
x-i18n:
    generated_at: "2026-04-05T13:48:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: e4de30f41e15297019151ad1a5b306cb331fd5c2beefd5ce5b98fcc51e95f0de
    source_path: cli/config.md
    workflow: 15
---

# `openclaw config`

Narzędzia konfiguracji do nieinteraktywnych edycji w `openclaw.json`: wartości get/set/unset/file/schema/validate
według ścieżki oraz wyświetlanie aktywnego pliku konfiguracji. Uruchom bez podkomendy, aby
otworzyć kreator konfiguracji (tak samo jak `openclaw configure`).

Opcje główne:

- `--section <section>`: powtarzalny filtr sekcji konfiguracji prowadzonej, gdy uruchamiasz `openclaw config` bez podkomendy

Obsługiwane sekcje konfiguracji prowadzonej:

- `workspace`
- `model`
- `web`
- `gateway`
- `daemon`
- `channels`
- `plugins`
- `skills`
- `health`

## Przykłady

```bash
openclaw config file
openclaw config --section model
openclaw config --section gateway --section daemon
openclaw config schema
openclaw config get browser.executablePath
openclaw config set browser.executablePath "/usr/bin/google-chrome"
openclaw config set agents.defaults.heartbeat.every "2h"
openclaw config set agents.list[0].tools.exec.node "node-id-or-name"
openclaw config set channels.discord.token --ref-provider default --ref-source env --ref-id DISCORD_BOT_TOKEN
openclaw config set secrets.providers.vaultfile --provider-source file --provider-path /etc/openclaw/secrets.json --provider-mode json
openclaw config unset plugins.entries.brave.config.webSearch.apiKey
openclaw config set channels.discord.token --ref-provider default --ref-source env --ref-id DISCORD_BOT_TOKEN --dry-run
openclaw config validate
openclaw config validate --json
```

### `config schema`

Wyświetla wygenerowany schemat JSON dla `openclaw.json` na stdout jako JSON.

Co zawiera:

- Bieżący główny schemat konfiguracji oraz główne pole tekstowe `$schema` dla narzędzi edytora
- Metadane dokumentacji pól `title` i `description` używane przez interfejs Control UI
- Zagnieżdżone obiekty, węzły wildcard (`*`) i elementy tablic (`[]`) dziedziczą te same metadane `title` / `description`, gdy istnieje pasująca dokumentacja pola
- Gałęzie `anyOf` / `oneOf` / `allOf` również dziedziczą te same metadane dokumentacji, gdy istnieje pasująca dokumentacja pola
- Metadane schematu live pluginów i kanałów w trybie best-effort, gdy można załadować manifesty runtime
- Czysty schemat zapasowy nawet wtedy, gdy bieżąca konfiguracja jest nieprawidłowa

Powiązane RPC runtime:

- `config.schema.lookup` zwraca jedną znormalizowaną ścieżkę konfiguracji z płytkim
  węzłem schematu (`title`, `description`, `type`, `enum`, `const`, typowe ograniczenia),
  dopasowanymi metadanymi podpowiedzi UI oraz podsumowaniami bezpośrednich elementów podrzędnych. Używaj go do
  szczegółowego przeglądania według ścieżki w Control UI lub własnych klientach.

```bash
openclaw config schema
```

Przekieruj do pliku, jeśli chcesz go sprawdzić lub zweryfikować innymi narzędziami:

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

Wartości są parsowane jako JSON5, gdy to możliwe; w przeciwnym razie są traktowane jako ciągi znaków.
Użyj `--strict-json`, aby wymagać parsowania JSON5. `--json` nadal jest obsługiwane jako starszy alias.

```bash
openclaw config set agents.defaults.heartbeat.every "0m"
openclaw config set gateway.port 19001 --strict-json
openclaw config set channels.whatsapp.groups '["*"]' --strict-json
```

`config get <path> --json` wyświetla surową wartość jako JSON zamiast tekstu sformatowanego dla terminala.

## Tryby `config set`

`openclaw config set` obsługuje cztery style przypisania:

1. Tryb wartości: `openclaw config set <path> <value>`
2. Tryb budowania SecretRef:

```bash
openclaw config set channels.discord.token \
  --ref-provider default \
  --ref-source env \
  --ref-id DISCORD_BOT_TOKEN
```

3. Tryb budowania dostawcy (tylko dla ścieżki `secrets.providers.<alias>`):

```bash
openclaw config set secrets.providers.vault \
  --provider-source exec \
  --provider-command /usr/local/bin/openclaw-vault \
  --provider-arg read \
  --provider-arg openai/api-key \
  --provider-timeout-ms 5000
```

4. Tryb wsadowy (`--batch-json` lub `--batch-file`):

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

Uwaga dotycząca zasad:

- Przypisania SecretRef są odrzucane na nieobsługiwanych powierzchniach runtime-mutable (na przykład `hooks.token`, `commands.ownerDisplaySecret`, tokenach webhooków do wiązania wątków Discord i JSON poświadczeń WhatsApp). Zobacz [SecretRef Credential Surface](/reference/secretref-credential-surface).

Parsowanie wsadowe zawsze używa ładunku wsadowego (`--batch-json`/`--batch-file`) jako źródła prawdy.
`--strict-json` / `--json` nie zmieniają zachowania parsowania wsadowego.

Tryb ścieżki/wartości JSON nadal jest obsługiwany zarówno dla SecretRef, jak i dostawców:

```bash
openclaw config set channels.discord.token \
  '{"source":"env","provider":"default","id":"DISCORD_BOT_TOKEN"}' \
  --strict-json

openclaw config set secrets.providers.vaultfile \
  '{"source":"file","path":"/etc/openclaw/secrets.json","mode":"json"}' \
  --strict-json
```

## Flagi budowania dostawcy

Cele budowania dostawcy muszą używać `secrets.providers.<alias>` jako ścieżki.

Wspólne flagi:

- `--provider-source <env|file|exec>`
- `--provider-timeout-ms <ms>` (`file`, `exec`)

Dostawca env (`--provider-source env`):

- `--provider-allowlist <ENV_VAR>` (można powtarzać)

Dostawca file (`--provider-source file`):

- `--provider-path <path>` (wymagane)
- `--provider-mode <singleValue|json>`
- `--provider-max-bytes <bytes>`

Dostawca exec (`--provider-source exec`):

- `--provider-command <path>` (wymagane)
- `--provider-arg <arg>` (można powtarzać)
- `--provider-no-output-timeout-ms <ms>`
- `--provider-max-output-bytes <bytes>`
- `--provider-json-only`
- `--provider-env <KEY=VALUE>` (można powtarzać)
- `--provider-pass-env <ENV_VAR>` (można powtarzać)
- `--provider-trusted-dir <path>` (można powtarzać)
- `--provider-allow-insecure-path`
- `--provider-allow-symlink-command`

Przykład utwardzonego dostawcy exec:

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

Zachowanie `dry-run`:

- Tryb builder: uruchamia kontrole rozwiązywalności SecretRef dla zmienionych refów/dostawców.
- Tryb JSON (`--strict-json`, `--json` lub tryb wsadowy): uruchamia walidację schematu oraz kontrole rozwiązywalności SecretRef.
- Walidacja zasad również działa dla znanych nieobsługiwanych powierzchni docelowych SecretRef.
- Kontrole zasad oceniają pełną konfigurację po zmianie, więc zapisy obiektów nadrzędnych (na przykład ustawienie `hooks` jako obiektu) nie mogą ominąć walidacji nieobsługiwanych powierzchni.
- Kontrole exec SecretRef są domyślnie pomijane podczas `dry-run`, aby uniknąć skutków ubocznych wykonywania poleceń.
- Użyj `--allow-exec` razem z `--dry-run`, aby włączyć kontrole exec SecretRef (może to wykonać polecenia dostawcy).
- `--allow-exec` działa tylko z `dry-run` i zgłasza błąd, jeśli zostanie użyte bez `--dry-run`.

`--dry-run --json` wyświetla raport w formacie do odczytu maszynowego:

- `ok`: czy `dry-run` zakończyło się powodzeniem
- `operations`: liczba ocenionych przypisań
- `checks`: czy uruchomiono kontrole schematu/rozwiązywalności
- `checks.resolvabilityComplete`: czy kontrole rozwiązywalności zostały wykonane do końca (false, gdy refy exec są pomijane)
- `refsChecked`: liczba refów faktycznie rozwiązanych podczas `dry-run`
- `skippedExecRefs`: liczba pominiętych refów exec, ponieważ nie ustawiono `--allow-exec`
- `errors`: strukturalne błędy schematu/rozwiązywalności, gdy `ok=false`

### Kształt wyjścia JSON

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
      ref?: string, // obecne dla błędów rozwiązywalności
    },
  ],
}
```

Przykład powodzenia:

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

Przykład niepowodzenia:

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

Jeśli `dry-run` się nie powiedzie:

- `config schema validation failed`: kształt konfiguracji po zmianie jest nieprawidłowy; popraw ścieżkę/wartość albo kształt obiektu dostawcy/refa.
- `Config policy validation failed: unsupported SecretRef usage`: przenieś to poświadczenie z powrotem do zwykłego wejścia tekstowego/string i pozostaw SecretRef tylko na obsługiwanych powierzchniach.
- `SecretRef assignment(s) could not be resolved`: wskazany dostawca/ref nie może obecnie zostać rozwiązany (brakująca zmienna środowiskowa, nieprawidłowy wskaźnik pliku, błąd dostawcy exec lub niedopasowanie dostawcy/źródła).
- `Dry run note: skipped <n> exec SecretRef resolvability check(s)`: `dry-run` pominął refy exec; uruchom ponownie z `--allow-exec`, jeśli potrzebujesz walidacji rozwiązywalności exec.
- Dla trybu wsadowego popraw błędne wpisy i uruchom ponownie `--dry-run` przed zapisem.

## Podkomendy

- `config file`: wyświetla ścieżkę aktywnego pliku konfiguracji (ustaloną z `OPENCLAW_CONFIG_PATH` lub domyślnej lokalizacji).

Po edycjach uruchom ponownie gateway.

## Walidacja

Zweryfikuj bieżącą konfigurację względem aktywnego schematu bez uruchamiania
gateway.

```bash
openclaw config validate
openclaw config validate --json
```
