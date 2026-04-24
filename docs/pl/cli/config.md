---
read_when:
    - Chcesz odczytywać lub edytować konfigurację nieinteraktywnie
summary: Dokumentacja CLI dla `openclaw config` (get/set/unset/file/schema/validate)
title: Konfiguracja
x-i18n:
    generated_at: "2026-04-24T09:02:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: 15e2eb75cc415df52ddcd104d8e5295d8d7b84baca65b4368deb3f06259f6bcd
    source_path: cli/config.md
    workflow: 15
---

# `openclaw config`

Pomocniki konfiguracji do nieinteraktywnych edycji w `openclaw.json`: get/set/unset/file/schema/validate
wartości według ścieżki oraz wyświetlanie aktywnego pliku konfiguracyjnego. Uruchom bez podpolecenia, aby
otworzyć kreator konfiguracji (tak samo jak `openclaw configure`).

Opcje główne:

- `--section <section>`: powtarzalny filtr sekcji konfiguracji prowadzonej, gdy uruchamiasz `openclaw config` bez podpolecenia

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
openclaw config set agents.defaults.models '{"openai/gpt-5.4":{}}' --strict-json --merge
openclaw config set channels.discord.token --ref-provider default --ref-source env --ref-id DISCORD_BOT_TOKEN
openclaw config set secrets.providers.vaultfile --provider-source file --provider-path /etc/openclaw/secrets.json --provider-mode json
openclaw config unset plugins.entries.brave.config.webSearch.apiKey
openclaw config set channels.discord.token --ref-provider default --ref-source env --ref-id DISCORD_BOT_TOKEN --dry-run
openclaw config validate
openclaw config validate --json
```

### `config schema`

Wypisz wygenerowany schemat JSON dla `openclaw.json` na stdout jako JSON.

Co zawiera:

- Bieżący główny schemat konfiguracji oraz główne pole tekstowe `$schema` dla narzędzi edytora
- Metadane dokumentacyjne pól `title` i `description` używane przez interfejs Control UI
- Zagnieżdżone obiekty, wildcardy (`*`) i węzły elementów tablicy (`[]`) dziedziczą te same metadane `title` / `description`, gdy istnieje pasująca dokumentacja pola
- Gałęzie `anyOf` / `oneOf` / `allOf` również dziedziczą te same metadane dokumentacyjne, gdy istnieje pasująca dokumentacja pola
- Metadane schematu Plugin + kanałów na zasadzie best-effort, gdy można załadować manifesty runtime
- Czysty schemat zapasowy nawet wtedy, gdy bieżąca konfiguracja jest nieprawidłowa

Powiązane RPC runtime:

- `config.schema.lookup` zwraca jedną znormalizowaną ścieżkę konfiguracji z płytkim
  węzłem schematu (`title`, `description`, `type`, `enum`, `const`, typowe ograniczenia),
  dopasowanymi metadanymi wskazówek interfejsu oraz podsumowaniami bezpośrednich elementów podrzędnych. Używaj tego do
  drążenia ograniczonego do ścieżki w Control UI lub klientach niestandardowych.

```bash
openclaw config schema
```

Przekieruj to do pliku, gdy chcesz to sprawdzić lub zwalidować innymi narzędziami:

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
Użyj `--strict-json`, aby wymusić parsowanie JSON5. `--json` nadal jest obsługiwane jako starszy alias.

```bash
openclaw config set agents.defaults.heartbeat.every "0m"
openclaw config set gateway.port 19001 --strict-json
openclaw config set channels.whatsapp.groups '["*"]' --strict-json
```

`config get <path> --json` wypisuje surową wartość jako JSON zamiast tekstu sformatowanego dla terminala.

Przypisanie obiektu domyślnie zastępuje ścieżkę docelową. Chronione ścieżki map/list,
które często przechowują wpisy dodane przez użytkownika, takie jak `agents.defaults.models`,
`models.providers`, `models.providers.<id>.models`, `plugins.entries` i
`auth.profiles`, odmawiają zastąpienia, które usunęłoby istniejące wpisy, chyba że podasz
`--replace`.

Użyj `--merge`, gdy dodajesz wpisy do tych map:

```bash
openclaw config set agents.defaults.models '{"openai/gpt-5.4":{}}' --strict-json --merge
openclaw config set models.providers.ollama.models '[{"id":"llama3.2","name":"Llama 3.2"}]' --strict-json --merge
```

Używaj `--replace` tylko wtedy, gdy celowo chcesz, aby podana wartość stała się
pełną wartością docelową.

## Tryby `config set`

`openclaw config set` obsługuje cztery style przypisania:

1. Tryb wartości: `openclaw config set <path> <value>`
2. Tryb kreatora SecretRef:

```bash
openclaw config set channels.discord.token \
  --ref-provider default \
  --ref-source env \
  --ref-id DISCORD_BOT_TOKEN
```

3. Tryb kreatora providera (tylko ścieżka `secrets.providers.<alias>`):

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

- Przypisania SecretRef są odrzucane na nieobsługiwanych powierzchniach mutowalnych runtime (na przykład `hooks.token`, `commands.ownerDisplaySecret`, tokeny webhooków powiązania wątków Discord i JSON poświadczeń WhatsApp). Zobacz [SecretRef Credential Surface](/pl/reference/secretref-credential-surface).

Parsowanie wsadowe zawsze używa ładunku wsadowego (`--batch-json`/`--batch-file`) jako źródła prawdy.
`--strict-json` / `--json` nie zmieniają zachowania parsowania wsadowego.

Tryb ścieżki/wartości JSON pozostaje obsługiwany zarówno dla SecretRefs, jak i providerów:

```bash
openclaw config set channels.discord.token \
  '{"source":"env","provider":"default","id":"DISCORD_BOT_TOKEN"}' \
  --strict-json

openclaw config set secrets.providers.vaultfile \
  '{"source":"file","path":"/etc/openclaw/secrets.json","mode":"json"}' \
  --strict-json
```

## Flagi kreatora providera

Cele kreatora providera muszą używać `secrets.providers.<alias>` jako ścieżki.

Typowe flagi:

- `--provider-source <env|file|exec>`
- `--provider-timeout-ms <ms>` (`file`, `exec`)

Provider env (`--provider-source env`):

- `--provider-allowlist <ENV_VAR>` (powtarzalne)

Provider file (`--provider-source file`):

- `--provider-path <path>` (wymagane)
- `--provider-mode <singleValue|json>`
- `--provider-max-bytes <bytes>`
- `--provider-allow-insecure-path`

Provider exec (`--provider-source exec`):

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

Przykład utwardzonego providera exec:

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

## Symulacja

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

Zachowanie `dry-run`:

- Tryb kreatora: uruchamia sprawdzenia rozwiązywalności SecretRef dla zmienionych refów/providerów.
- Tryb JSON (`--strict-json`, `--json` lub tryb wsadowy): uruchamia walidację schematu oraz sprawdzenia rozwiązywalności SecretRef.
- Walidacja zasad również działa dla znanych nieobsługiwanych powierzchni docelowych SecretRef.
- Sprawdzenia zasad oceniają pełną konfigurację po zmianie, więc zapisy obiektów nadrzędnych (na przykład ustawienie `hooks` jako obiektu) nie mogą ominąć walidacji nieobsługiwanych powierzchni.
- Sprawdzenia SecretRef exec są domyślnie pomijane podczas `dry-run`, aby uniknąć skutków ubocznych poleceń.
- Użyj `--allow-exec` z `--dry-run`, aby włączyć sprawdzenia SecretRef exec (może to wykonać polecenia providera).
- `--allow-exec` działa tylko z `dry-run` i zgłasza błąd, jeśli zostanie użyte bez `--dry-run`.

`--dry-run --json` wypisuje raport czytelny maszynowo:

- `ok`: czy `dry-run` się powiódł
- `operations`: liczba ocenionych przypisań
- `checks`: czy uruchomiono sprawdzenia schematu/rozwiązywalności
- `checks.resolvabilityComplete`: czy sprawdzenia rozwiązywalności zakończyły się w całości (false, gdy refy exec są pomijane)
- `refsChecked`: liczba refów rzeczywiście rozwiązanych podczas `dry-run`
- `skippedExecRefs`: liczba refów exec pominiętych, ponieważ nie ustawiono `--allow-exec`
- `errors`: ustrukturyzowane błędy schematu/rozwiązywalności, gdy `ok=false`

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
      ref?: string, // present for resolvability errors
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

Przykład błędu:

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

Jeśli `dry-run` zakończy się błędem:

- `config schema validation failed`: kształt konfiguracji po zmianie jest nieprawidłowy; popraw ścieżkę/wartość albo kształt obiektu providera/refa.
- `Config policy validation failed: unsupported SecretRef usage`: przenieś to poświadczenie z powrotem do wejścia plaintext/string i pozostaw SecretRefs tylko na obsługiwanych powierzchniach.
- `SecretRef assignment(s) could not be resolved`: wskazany provider/ref obecnie nie może zostać rozwiązany (brakująca zmienna środowiskowa, nieprawidłowy wskaźnik pliku, błąd providera exec lub niedopasowanie providera/źródła).
- `Dry run note: skipped <n> exec SecretRef resolvability check(s)`: `dry-run` pominął refy exec; uruchom ponownie z `--allow-exec`, jeśli potrzebujesz walidacji rozwiązywalności exec.
- W trybie wsadowym popraw błędne wpisy i uruchom ponownie `--dry-run` przed zapisem.

## Bezpieczeństwo zapisu

`openclaw config set` i inne programy zapisujące konfigurację należące do OpenClaw walidują pełną
konfigurację po zmianie przed zapisaniem jej na dysku. Jeśli nowy ładunek nie przejdzie walidacji schematu
albo wygląda na destrukcyjne nadpisanie, aktywna konfiguracja pozostaje bez zmian,
a odrzucony ładunek jest zapisywany obok niej jako `openclaw.json.rejected.*`.
Aktywna ścieżka konfiguracji musi być zwykłym plikiem. Układy `openclaw.json`
oparte na dowiązaniach symbolicznych nie są obsługiwane przy zapisach; użyj `OPENCLAW_CONFIG_PATH`, aby wskazać bezpośrednio
rzeczywisty plik.

Preferuj zapisy przez CLI dla małych zmian:

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

Bezpośrednie zapisy z edytora są nadal dozwolone, ale działający Gateway traktuje je jako
niezaufane, dopóki nie przejdą walidacji. Nieprawidłowe bezpośrednie edycje mogą zostać przywrócone z
ostatniej znanej dobrej kopii zapasowej podczas uruchamiania lub hot reload. Zobacz
[Gateway troubleshooting](/pl/gateway/troubleshooting#gateway-restored-last-known-good-config).

## Podpolecenia

- `config file`: Wypisz ścieżkę aktywnego pliku konfiguracyjnego (rozwiązaną z `OPENCLAW_CONFIG_PATH` lub z lokalizacji domyślnej). Ścieżka powinna wskazywać zwykły plik, a nie dowiązanie symboliczne.

Uruchom ponownie gateway po edycjach.

## Validate

Zweryfikuj bieżącą konfigurację względem aktywnego schematu bez uruchamiania
gateway.

```bash
openclaw config validate
openclaw config validate --json
```

Gdy `openclaw config validate` przechodzi pomyślnie, możesz użyć lokalnego TUI, aby
osadzony agent porównał aktywną konfigurację z dokumentacją, podczas gdy Ty weryfikujesz
każdą zmianę z tego samego terminala:

Jeśli walidacja już kończy się błędem, zacznij od `openclaw configure` lub
`openclaw doctor --fix`. `openclaw chat` nie omija
zabezpieczenia przed nieprawidłową konfiguracją.

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

Typowa pętla naprawcza:

- Poproś agenta, aby porównał Twoją bieżącą konfigurację z odpowiednią stroną dokumentacji i zasugerował najmniejszą poprawkę.
- Zastosuj ukierunkowane edycje za pomocą `openclaw config set` lub `openclaw configure`.
- Uruchamiaj ponownie `openclaw config validate` po każdej zmianie.
- Jeśli walidacja przechodzi, ale runtime nadal jest w niezdrowym stanie, uruchom `openclaw doctor` lub `openclaw doctor --fix`, aby uzyskać pomoc w migracji i naprawie.

## Powiązane

- [CLI reference](/pl/cli)
- [Configuration](/pl/gateway/configuration)
