---
read_when:
    - Chcesz odczytywać lub edytować konfigurację nieinteraktywnie
sidebarTitle: Config
summary: Dokumentacja referencyjna CLI dla `openclaw config` (get/set/patch/unset/file/schema/validate)
title: Konfiguracja
x-i18n:
    generated_at: "2026-06-28T22:33:19Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 92878977e8fb6670f12c0a77937a7c41f9230da82e20ec7690731bbda1e910ca
    source_path: cli/config.md
    workflow: 16
---

Pomocniki konfiguracji do nieinteraktywnych edycji w `openclaw.json`: pobieranie/ustawianie/nakładanie poprawek/usuwanie/plik/schemat/walidacja wartości według ścieżki oraz wypisywanie aktywnego pliku konfiguracji. Uruchom bez podkomendy, aby otworzyć kreator konfiguracji (tak samo jak `openclaw configure`).

<Note>
Gdy `OPENCLAW_NIX_MODE=1`, OpenClaw traktuje `openclaw.json` jako niezmienny. Polecenia tylko do odczytu, takie jak `config get`, `config file`, `config schema` i `config validate`, nadal działają, ale polecenia zapisujące konfigurację odmawiają działania. Agenci powinni zamiast tego edytować źródło Nix dla instalacji; dla własnej dystrybucji nix-openclaw użyj [nix-openclaw Quick Start](https://github.com/openclaw/nix-openclaw#quick-start) i ustaw wartości pod `programs.openclaw.config` lub `instances.<name>.config`.
</Note>

## Opcje główne

<ParamField path="--section <section>" type="string">
  Powtarzalny filtr sekcji konfiguracji prowadzonej, gdy uruchamiasz `openclaw config` bez podkomendy.
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

Wypisuje wygenerowany schemat JSON dla `openclaw.json` na stdout jako JSON.

<AccordionGroup>
  <Accordion title="Co zawiera">
    - Bieżący główny schemat konfiguracji oraz główne pole tekstowe `$schema` dla narzędzi edytora.
    - Metadane dokumentacji pól `title` i `description` używane przez Control UI.
    - Zagnieżdżone obiekty, symbole wieloznaczne (`*`) i węzły elementów tablicy (`[]`) dziedziczą te same metadane `title` / `description`, gdy istnieje pasująca dokumentacja pola.
    - Gałęzie `anyOf` / `oneOf` / `allOf` także dziedziczą te same metadane dokumentacji, gdy istnieje pasująca dokumentacja pola.
    - Metadane schematu Pluginów i kanałów w trybie live na zasadzie najlepszej możliwości, gdy można wczytać manifesty runtime.
    - Czysty schemat awaryjny nawet wtedy, gdy bieżąca konfiguracja jest nieprawidłowa.

  </Accordion>
  <Accordion title="Powiązane runtime RPC">
    `config.schema.lookup` zwraca jedną znormalizowaną ścieżkę konfiguracji z płytkim węzłem schemat (`title`, `description`, `type`, `enum`, `const`, wspólne ograniczenia), dopasowanymi metadanymi podpowiedzi UI oraz podsumowaniami bezpośrednich elementów podrzędnych. Użyj tego do szczegółowego przechodzenia po ścieżkach w Control UI lub klientach niestandardowych.
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

Ścieżki używają notacji kropkowej lub nawiasowej. Cytuj ścieżki w notacji nawiasowej w przykładach powłoki, aby powłoki takie jak zsh nie rozwijały `[0]` jako globu, zanim OpenClaw otrzyma ścieżkę:

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

Wartości są parsowane jako JSON5, gdy to możliwe; w przeciwnym razie są traktowane jako ciągi znaków. Użyj `--strict-json`, aby wymagać standardowego parsowania JSON bez awaryjnego traktowania jako ciąg znaków. `--json` pozostaje obsługiwane jako starszy alias dla `--strict-json`.

```bash
openclaw config set agents.defaults.heartbeat.every "0m"
openclaw config set gateway.port 19001 --strict-json
openclaw config set channels.whatsapp.groups '["*"]' --strict-json
```

Gdy `--strict-json` jest włączone, składnia dostępna tylko w JSON5, taka jak komentarze, końcowe przecinki lub niecytowane klucze obiektów, jest odrzucana. Pomiń `--strict-json`, aby parsować wartości JSON5 z awaryjnym użyciem surowego ciągu znaków.

`config get <path> --json` wypisuje surową wartość jako JSON zamiast tekstu formatowanego dla terminala.

<Note>
Przypisanie obiektu domyślnie zastępuje ścieżkę docelową. Chronione ścieżki map/list, które często przechowują wpisy dodane przez użytkownika, takie jak `agents.defaults.models`, `models.providers`, `models.providers.<id>.models`, `plugins.entries` i `auth.profiles`, odmawiają zastąpień, które usunęłyby istniejące wpisy, chyba że przekażesz `--replace`.
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
  <Tab title="Tryb kreatora SecretRef">
    ```bash
    openclaw config set channels.discord.token \
      --ref-provider default \
      --ref-source env \
      --ref-id DISCORD_BOT_TOKEN
    ```
  </Tab>
  <Tab title="Tryb kreatora dostawcy">
    Tryb kreatora dostawcy obsługuje wyłącznie ścieżki `secrets.providers.<alias>`:

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
Przypisania SecretRef są odrzucane na nieobsługiwanych powierzchniach modyfikowalnych w runtime (na przykład `hooks.token`, `commands.ownerDisplaySecret`, tokeny Webhook powiązania wątku Discord oraz JSON poświadczeń WhatsApp). Zobacz [Powierzchnia poświadczeń SecretRef](/pl/reference/secretref-credential-surface).
</Warning>

Parsowanie wsadowe zawsze używa ładunku wsadowego (`--batch-json`/`--batch-file`) jako źródła prawdy. `--strict-json` / `--json` nie zmieniają zachowania parsowania wsadowego.

## `config patch`

Użyj `config patch`, gdy chcesz wkleić lub przekierować poprawkę w kształcie konfiguracji zamiast uruchamiać wiele poleceń `config set` opartych na ścieżkach. Wejście jest obiektem JSON5. Obiekty scalają się rekurencyjnie, tablice i wartości skalarne zastępują wartość docelową, a `null` usuwa ścieżkę docelową.

```bash
openclaw config patch --file ./openclaw.patch.json5 --dry-run
openclaw config patch --file ./openclaw.patch.json5
```

Możesz także przekazać poprawkę przez stdin, co jest przydatne w skryptach zdalnej konfiguracji:

```bash
ssh openclaw-host 'openclaw config patch --stdin --dry-run' < ./openclaw.patch.json5
ssh openclaw-host 'openclaw config patch --stdin' < ./openclaw.patch.json5
```

Przykładowa poprawka:

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

Użyj `--replace-path <path>`, gdy jeden obiekt lub tablica musi stać się dokładnie podaną wartością zamiast być poprawiany rekurencyjnie:

```bash
openclaw config patch --file ./discord.patch.json5 --replace-path 'channels.discord.guilds["123"].channels'
```

`--dry-run` uruchamia sprawdzanie schematu i rozwiązywalności SecretRef bez zapisywania. SecretRefy oparte na exec są domyślnie pomijane podczas dry-run; dodaj `--allow-exec`, gdy celowo chcesz, aby dry-run wykonywał polecenia dostawcy.

Tryb ścieżki/wartości JSON pozostaje obsługiwany zarówno dla SecretRefów, jak i dostawców:

```bash
openclaw config set channels.discord.token \
  '{"source":"env","provider":"default","id":"DISCORD_BOT_TOKEN"}' \
  --strict-json

openclaw config set secrets.providers.vaultfile \
  '{"source":"file","path":"/etc/openclaw/secrets.json","mode":"json"}' \
  --strict-json
```

## Flagi kreatora dostawcy

Cele kreatora dostawcy muszą używać `secrets.providers.<alias>` jako ścieżki.

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
    - Tryb buildera: uruchamia kontrole rozwiązywalności SecretRef dla zmienionych refs/providers.
    - Tryb JSON (`--strict-json`, `--json` lub tryb wsadowy): uruchamia walidację schematu oraz kontrole rozwiązywalności SecretRef.
    - Walidacja zasad uruchamia się również dla znanych nieobsługiwanych powierzchni docelowych SecretRef.
    - Kontrole zasad oceniają pełną konfigurację po zmianie, więc zapisy obiektu nadrzędnego (na przykład ustawienie `hooks` jako obiektu) nie mogą ominąć walidacji nieobsługiwanej powierzchni.
    - Kontrole exec SecretRef są domyślnie pomijane podczas dry-run, aby uniknąć skutków ubocznych poleceń.
    - Użyj `--allow-exec` z `--dry-run`, aby włączyć kontrole exec SecretRef (może to wykonać polecenia dostawcy).
    - `--allow-exec` działa tylko z dry-run i zgłasza błąd, jeśli zostanie użyte bez `--dry-run`.

  </Accordion>
  <Accordion title="Pola --dry-run --json">
    `--dry-run --json` wypisuje raport czytelny maszynowo:

    - `ok`: czy dry-run zakończył się powodzeniem
    - `operations`: liczba ocenionych przypisań
    - `checks`: czy uruchomiono kontrole schematu/rozwiązywalności
    - `checks.resolvabilityComplete`: czy kontrole rozwiązywalności dobiegły końca (false, gdy refs exec są pomijane)
    - `refsChecked`: liczba refs faktycznie rozwiązanych podczas dry-run
    - `skippedExecRefs`: liczba refs exec pominiętych, ponieważ `--allow-exec` nie zostało ustawione
    - `errors`: ustrukturyzowane błędy brakującej ścieżki, schematu lub rozwiązywalności, gdy `ok=false`

  </Accordion>
</AccordionGroup>

### Kształt danych wyjściowych JSON

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
      ref?: string, // present for resolvability errors
    },
  ],
}
```

<Tabs>
  <Tab title="Przykład sukcesu">
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
    - `Config policy validation failed: unsupported SecretRef usage`: przenieś te dane uwierzytelniające z powrotem do wejścia plaintext/string i utrzymuj SecretRefs tylko na obsługiwanych powierzchniach.
    - `SecretRef assignment(s) could not be resolved`: wskazany provider/ref obecnie nie może zostać rozwiązany (brakująca zmienna env, nieprawidłowy wskaźnik pliku, awaria dostawcy exec albo niezgodność dostawcy/źródła).
    - `Dry run note: skipped <n> exec SecretRef resolvability check(s)`: dry-run pominął refs exec; uruchom ponownie z `--allow-exec`, jeśli potrzebujesz walidacji rozwiązywalności exec.
    - W trybie wsadowym popraw wpisy kończące się niepowodzeniem i uruchom ponownie `--dry-run` przed zapisem.

  </Accordion>
</AccordionGroup>

## Bezpieczeństwo zapisu

`openclaw config set` i inne narzędzia zapisujące konfigurację należące do OpenClaw walidują pełną konfigurację po zmianie przed zapisaniem jej na dysku. Jeśli nowy payload nie przejdzie walidacji schematu albo wygląda jak destrukcyjne nadpisanie, aktywna konfiguracja pozostaje bez zmian, a odrzucony payload jest zapisywany obok niej jako `openclaw.json.rejected.*`.

<Warning>
Aktywna ścieżka konfiguracji musi być zwykłym plikiem. Układy `openclaw.json` jako symlink nie są obsługiwane przy zapisach; zamiast tego użyj `OPENCLAW_CONFIG_PATH`, aby wskazać bezpośrednio rzeczywisty plik.
</Warning>

Preferuj zapisy przez CLI przy małych edycjach:

```bash
openclaw config set gateway.reload.mode hybrid --dry-run
openclaw config set gateway.reload.mode hybrid
openclaw config validate
```

Jeśli zapis zostanie odrzucony, sprawdź zapisany payload i popraw kształt pełnej konfiguracji:

```bash
CONFIG="$(openclaw config file)"
ls -lt "$CONFIG".rejected.* 2>/dev/null | head
openclaw config validate
```

Bezpośrednie zapisy w edytorze nadal są dozwolone, ale działający Gateway traktuje je jako niezaufane, dopóki nie przejdą walidacji. Nieprawidłowe bezpośrednie edycje powodują niepowodzenie uruchamiania albo są pomijane przez hot reload; Gateway nie przepisuje `openclaw.json`. Uruchom `openclaw doctor --fix`, aby naprawić konfigurację z prefiksem/nadpisaną albo przywrócić ostatnią znaną dobrą kopię. Zobacz [rozwiązywanie problemów z Gateway](/pl/gateway/troubleshooting#gateway-rejected-invalid-config).

Odzyskiwanie całego pliku jest zarezerwowane dla naprawy przez doctora. Zmiany schematu Plugin lub rozjazd `minHostVersion` pozostają wyraźnie sygnalizowane zamiast wycofywać niepowiązane ustawienia użytkownika, takie jak modele, dostawcy, profile auth, kanały, ekspozycja Gateway, narzędzia, pamięć, przeglądarka czy konfiguracja cron.

## Podpolecenia

- `config file`: Wypisuje ścieżkę aktywnego pliku konfiguracji (rozwiązaną z `OPENCLAW_CONFIG_PATH` albo domyślnej lokalizacji). Ścieżka powinna wskazywać zwykły plik, a nie symlink.

Po edycjach uruchom ponownie gateway.

## Walidacja

Waliduj bieżącą konfigurację względem aktywnego schematu bez uruchamiania gateway.

```bash
openclaw config validate
openclaw config validate --json
```

Gdy `openclaw config validate` przechodzi, możesz użyć lokalnego TUI, aby osadzony agent porównał aktywną konfigurację z dokumentacją podczas walidowania każdej zmiany z tego samego terminala:

<Note>
Jeśli walidacja już się nie powodzi, zacznij od `openclaw configure` albo `openclaw doctor --fix`. `openclaw chat` nie omija ochrony przed nieprawidłową konfiguracją.
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
    Zastosuj ukierunkowane edycje za pomocą `openclaw config set` albo `openclaw configure`.
  </Step>
  <Step title="Ponownie waliduj">
    Uruchom ponownie `openclaw config validate` po każdej zmianie.
  </Step>
  <Step title="Doctor dla problemów runtime">
    Jeśli walidacja przechodzi, ale runtime nadal jest w złym stanie, uruchom `openclaw doctor` albo `openclaw doctor --fix`, aby uzyskać pomoc w migracji i naprawie.
  </Step>
</Steps>

## Powiązane

- [Referencja CLI](/pl/cli)
- [Konfiguracja](/pl/gateway/configuration)
