---
read_when:
    - Chcesz odczytywać lub edytować konfigurację w trybie nieinteraktywnym
sidebarTitle: Config
summary: Dokumentacja CLI dla `openclaw config` (`get`/`set`/`unset`/`file`/`schema`/`validate`)
title: Konfiguracja
x-i18n:
    generated_at: "2026-04-26T11:25:23Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7871ee03a1da6ab5d0881ace7579ce101a89e9f9d05d1a720ff34fd31fa12a9d
    source_path: cli/config.md
    workflow: 15
---

Pomocniki konfiguracji do nieinteraktywnych edycji w `openclaw.json`: pobieranie/ustawianie/usuwanie/plik/schemat/walidacja wartości według ścieżki oraz wypisywanie aktywnego pliku konfiguracji. Uruchomienie bez podpolecenia otwiera kreator konfiguracji (tak samo jak `openclaw configure`).

## Opcje główne

<ParamField path="--section <section>" type="string">
  Powtarzalny filtr sekcji konfiguracji prowadzonej, gdy uruchamiasz `openclaw config` bez podpolecenia.
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
openclaw config unset plugins.entries.brave.config.webSearch.apiKey
openclaw config set channels.discord.token --ref-provider default --ref-source env --ref-id DISCORD_BOT_TOKEN --dry-run
openclaw config validate
openclaw config validate --json
```

### `config schema`

Wypisuje wygenerowany schemat JSON dla `openclaw.json` na stdout jako JSON.

<AccordionGroup>
  <Accordion title="Co zawiera">
    - Bieżący schemat głównej konfiguracji oraz główne pole tekstowe `$schema` dla narzędzi edytora.
    - Metadane dokumentacyjne pól `title` i `description` używane przez Control UI.
    - Zagnieżdżone obiekty, węzły wieloznaczne (`*`) i elementy tablic (`[]`) dziedziczą te same metadane `title` / `description`, gdy istnieje pasująca dokumentacja pola.
    - Gałęzie `anyOf` / `oneOf` / `allOf` również dziedziczą te same metadane dokumentacyjne, gdy istnieje pasująca dokumentacja pola.
    - Metadane schematu Plugin + kanału z aktywnego środowiska uruchomieniowego w miarę możliwości, gdy można załadować manifesty środowiska uruchomieniowego.
    - Czysty schemat zapasowy nawet wtedy, gdy bieżąca konfiguracja jest nieprawidłowa.

  </Accordion>
  <Accordion title="Powiązane RPC środowiska uruchomieniowego">
    `config.schema.lookup` zwraca jedną znormalizowaną ścieżkę konfiguracji z płytkim węzłem schematu (`title`, `description`, `type`, `enum`, `const`, wspólne ograniczenia), dopasowanymi metadanymi podpowiedzi UI oraz podsumowaniami bezpośrednich elementów podrzędnych. Użyj tego do schodzenia w dół według zakresu ścieżki w Control UI lub klientach niestandardowych.
  </Accordion>
</AccordionGroup>

```bash
openclaw config schema
```

Przekieruj do pliku, gdy chcesz go sprawdzić lub zwalidować innymi narzędziami:

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

Wartości są analizowane jako JSON5, jeśli to możliwe; w przeciwnym razie są traktowane jako ciągi znaków. Użyj `--strict-json`, aby wymusić analizę JSON5. `--json` jest nadal obsługiwane jako starszy alias.

```bash
openclaw config set agents.defaults.heartbeat.every "0m"
openclaw config set gateway.port 19001 --strict-json
openclaw config set channels.whatsapp.groups '["*"]' --strict-json
```

`config get <path> --json` wypisuje surową wartość jako JSON zamiast tekstu sformatowanego dla terminala.

<Note>
Przypisanie obiektu domyślnie zastępuje docelową ścieżkę. Chronione ścieżki map/list, które często przechowują wpisy dodane przez użytkownika, takie jak `agents.defaults.models`, `models.providers`, `models.providers.<id>.models`, `plugins.entries` i `auth.profiles`, odmawiają zastąpień, które usunęłyby istniejące wpisy, chyba że przekażesz `--replace`.
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
    Tryb konstruktora dostawcy jest przeznaczony tylko dla ścieżek `secrets.providers.<alias>`:

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
Przypisania SecretRef są odrzucane na nieobsługiwanych powierzchniach zmienialnych w czasie działania (na przykład `hooks.token`, `commands.ownerDisplaySecret`, tokeny Webhook powiązania wątków Discord i JSON poświadczeń WhatsApp). Zobacz [SecretRef Credential Surface](/pl/reference/secretref-credential-surface).
</Warning>

Parsowanie wsadowe zawsze używa ładunku wsadowego (`--batch-json`/`--batch-file`) jako źródła prawdy. `--strict-json` / `--json` nie zmieniają zachowania parsowania wsadowego.

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
  <Accordion title="Wspólne flagi">
    - `--provider-source <env|file|exec>`
    - `--provider-timeout-ms <ms>` (`file`, `exec`)

  </Accordion>
  <Accordion title="Dostawca env (--provider-source env)">
    - `--provider-allowlist <ENV_VAR>` (powtarzalne)

  </Accordion>
  <Accordion title="Dostawca plików (--provider-source file)">
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

## Dry run

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
  <Accordion title="Zachowanie dry-run">
    - Tryb konstruktora: uruchamia kontrole rozwiązywalności SecretRef dla zmienionych odwołań/dostawców.
    - Tryb JSON (`--strict-json`, `--json` lub tryb wsadowy): uruchamia walidację schematu oraz kontrole rozwiązywalności SecretRef.
    - Walidacja polityk działa również dla znanych nieobsługiwanych powierzchni docelowych SecretRef.
    - Kontrole polityk oceniają pełną konfigurację po zmianach, więc zapisy obiektu nadrzędnego (na przykład ustawienie `hooks` jako obiektu) nie mogą omijać walidacji nieobsługiwanej powierzchni.
    - Kontrole exec SecretRef są domyślnie pomijane podczas dry-run, aby uniknąć skutków ubocznych poleceń.
    - Użyj `--allow-exec` razem z `--dry-run`, aby włączyć kontrole exec SecretRef (może to wykonać polecenia dostawcy).
    - `--allow-exec` działa tylko dla dry-run i zgłasza błąd, jeśli zostanie użyte bez `--dry-run`.

  </Accordion>
  <Accordion title="Pola --dry-run --json">
    `--dry-run --json` wypisuje raport czytelny maszynowo:

    - `ok`: czy dry-run zakończył się powodzeniem
    - `operations`: liczba ocenionych przypisań
    - `checks`: czy uruchomiono kontrole schematu/rozwiązywalności
    - `checks.resolvabilityComplete`: czy kontrole rozwiązywalności zostały wykonane do końca (`false`, gdy odwołania exec są pomijane)
    - `refsChecked`: liczba odwołań faktycznie rozwiązanych podczas dry-run
    - `skippedExecRefs`: liczba odwołań exec pominiętych, ponieważ nie ustawiono `--allow-exec`
    - `errors`: strukturalne błędy schematu/rozwiązywalności, gdy `ok=false`

  </Accordion>
</AccordionGroup>

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
  <Tab title="Przykład błędu">
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
    - `config schema validation failed`: kształt konfiguracji po zmianie jest nieprawidłowy; popraw ścieżkę/wartość albo kształt obiektu dostawcy/odwołania.
    - `Config policy validation failed: unsupported SecretRef usage`: przenieś to poświadczenie z powrotem do wejścia plaintext/string i używaj SecretRef tylko na obsługiwanych powierzchniach.
    - `SecretRef assignment(s) could not be resolved`: wskazany dostawca/odwołanie nie może obecnie zostać rozwiązany (brakująca zmienna env, nieprawidłowy wskaźnik pliku, błąd dostawcy exec albo niedopasowanie dostawcy/źródła).
    - `Dry run note: skipped <n> exec SecretRef resolvability check(s)`: dry-run pominął odwołania exec; uruchom ponownie z `--allow-exec`, jeśli potrzebujesz walidacji rozwiązywalności exec.
    - W trybie wsadowym popraw błędne wpisy i uruchom ponownie `--dry-run` przed zapisem.

  </Accordion>
</AccordionGroup>

## Bezpieczeństwo zapisu

`openclaw config set` i inne moduły zapisujące konfigurację zarządzane przez OpenClaw walidują pełną konfigurację po zmianie przed zapisaniem jej na dysku. Jeśli nowy ładunek nie przejdzie walidacji schematu albo wygląda na destrukcyjne nadpisanie, aktywna konfiguracja pozostaje bez zmian, a odrzucony ładunek jest zapisywany obok niej jako `openclaw.json.rejected.*`.

<Warning>
Aktywna ścieżka konfiguracji musi być zwykłym plikiem. Układy `openclaw.json` oparte na dowiązaniach symbolicznych nie są obsługiwane przy zapisie; zamiast tego użyj `OPENCLAW_CONFIG_PATH`, aby wskazać bezpośrednio rzeczywisty plik.
</Warning>

W przypadku małych zmian preferuj zapis przez CLI:

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

Bezpośrednie zapisy z edytora są nadal dozwolone, ale działający Gateway traktuje je jako niezaufane, dopóki nie przejdą walidacji. Nieprawidłowe bezpośrednie edycje mogą zostać przywrócone z ostatniej znanej dobrej kopii zapasowej podczas uruchamiania lub hot reload. Zobacz [Gateway troubleshooting](/pl/gateway/troubleshooting#gateway-restored-last-known-good-config).

Odzyskiwanie całego pliku jest zarezerwowane dla globalnie uszkodzonej konfiguracji, takiej jak błędy parsowania, błędy schematu na poziomie głównym, błędy starszych migracji albo mieszane błędy Plugin i głównej konfiguracji. Jeśli walidacja nie powiedzie się tylko w `plugins.entries.<id>...`, OpenClaw pozostawia aktywny `openclaw.json` na miejscu i zgłasza lokalny problem Plugin zamiast przywracać `.last-good`. Zapobiega to sytuacji, w której zmiany schematu Plugin lub rozbieżność `minHostVersion` cofałyby niezwiązane ustawienia użytkownika, takie jak modele, dostawcy, profile uwierzytelniania, kanały, ekspozycja Gateway, narzędzia, pamięć, przeglądarka albo konfiguracja Cron.

## Podpolecenia

- `config file`: Wypisuje ścieżkę aktywnego pliku konfiguracji (rozwiązaną z `OPENCLAW_CONFIG_PATH` albo lokalizacji domyślnej). Ścieżka powinna wskazywać zwykły plik, a nie dowiązanie symboliczne.

Po edycji uruchom ponownie Gateway.

## Walidacja

Zweryfikuj bieżącą konfigurację względem aktywnego schematu bez uruchamiania Gateway.

```bash
openclaw config validate
openclaw config validate --json
```

Gdy `openclaw config validate` przechodzi pomyślnie, możesz użyć lokalnego TUI, aby osadzony agent porównał aktywną konfigurację z dokumentacją, podczas gdy Ty weryfikujesz każdą zmianę z tego samego terminala:

<Note>
Jeśli walidacja już się nie powodzi, zacznij od `openclaw configure` lub `openclaw doctor --fix`. `openclaw chat` nie omija blokady nieprawidłowej konfiguracji.
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
    Poproś agenta, aby porównał Twoją bieżącą konfigurację z odpowiednią stroną dokumentacji i zasugerował najmniejszą poprawkę.
  </Step>
  <Step title="Zastosuj ukierunkowane zmiany">
    Zastosuj ukierunkowane zmiany za pomocą `openclaw config set` lub `openclaw configure`.
  </Step>
  <Step title="Zweryfikuj ponownie">
    Po każdej zmianie uruchom ponownie `openclaw config validate`.
  </Step>
  <Step title="Doctor dla problemów środowiska uruchomieniowego">
    Jeśli walidacja przechodzi pomyślnie, ale środowisko uruchomieniowe nadal jest w złym stanie, uruchom `openclaw doctor` lub `openclaw doctor --fix`, aby uzyskać pomoc w migracji i naprawie.
  </Step>
</Steps>

## Powiązane

- [Dokumentacja CLI](/pl/cli)
- [Configuration](/pl/gateway/configuration)
