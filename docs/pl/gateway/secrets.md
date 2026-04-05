---
read_when:
    - Konfigurujesz SecretRef dla danych uwierzytelniających providerów i odwołań w `auth-profiles.json`
    - Obsługujesz bezpiecznie przeładowanie, audyt, konfigurację i zastosowanie sekretów w środowisku produkcyjnym
    - Chcesz zrozumieć zachowanie fail-fast przy starcie, filtrowanie nieaktywnych powierzchni i mechanizm last-known-good
summary: 'Zarządzanie sekretami: kontrakt SecretRef, zachowanie snapshotów runtime i bezpieczne jednokierunkowe usuwanie danych wrażliwych'
title: Zarządzanie sekretami
x-i18n:
    generated_at: "2026-04-05T13:55:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: b91778cb7801fe24f050c15c0a9dd708dda91cb1ce86096e6bae57ebb6e0d41d
    source_path: gateway/secrets.md
    workflow: 15
---

# Zarządzanie sekretami

OpenClaw obsługuje addytywne SecretRef, dzięki czemu obsługiwane dane uwierzytelniające nie muszą być przechowywane w konfiguracji jako plaintext.

Plaintext nadal działa. SecretRef to opcja opt-in dla poszczególnych danych uwierzytelniających.

## Cele i model runtime

Sekrety są rozwiązywane do snapshotu runtime w pamięci.

- Rozwiązywanie jest eager podczas aktywacji, a nie lazy na ścieżkach żądań.
- Uruchomienie kończy się fail-fast, gdy efektywnie aktywny SecretRef nie może zostać rozwiązany.
- Przeładowanie używa atomowej podmiany: pełny sukces albo zachowanie snapshotu last-known-good.
- Naruszenia polityki SecretRef (na przykład profile uwierzytelniania w trybie OAuth połączone z wejściem SecretRef) powodują błąd aktywacji przed podmianą snapshotu runtime.
- Żądania runtime odczytują dane wyłącznie z aktywnego snapshotu w pamięci.
- Po pierwszej pomyślnej aktywacji/wczytaniu konfiguracji ścieżki kodu runtime nadal odczytują ten aktywny snapshot w pamięci aż do pomyślnego przeładowania, które go podmieni.
- Ścieżki dostarczania wychodzącego także odczytują z aktywnego snapshotu (na przykład dostarczanie odpowiedzi/wątków Discord i wysyłanie akcji Telegram); nie rozwiązują ponownie SecretRef przy każdym wysłaniu.

Dzięki temu awarie providerów sekretów nie trafiają na gorące ścieżki żądań.

## Filtrowanie aktywnych powierzchni

SecretRef są walidowane tylko na efektywnie aktywnych powierzchniach.

- Powierzchnie włączone: nierozwiązane odwołania blokują uruchomienie/przeładowanie.
- Powierzchnie nieaktywne: nierozwiązane odwołania nie blokują uruchomienia/przeładowania.
- Nieaktywne odwołania emitują niefatalne diagnostyki z kodem `SECRETS_REF_IGNORED_INACTIVE_SURFACE`.

Przykłady nieaktywnych powierzchni:

- Wyłączone wpisy kanałów/kont.
- Dane uwierzytelniające kanału na poziomie głównym, których nie dziedziczy żadne włączone konto.
- Wyłączone powierzchnie narzędzi/funkcji.
- Klucze specyficzne dla providera wyszukiwania webowego, które nie są wybrane przez `tools.web.search.provider`.
  W trybie auto (provider nieustawiony) klucze są sprawdzane według priorytetu dla automatycznego wykrywania providera, aż jeden zostanie rozwiązany.
  Po wybraniu klucze niewybranego providera są traktowane jako nieaktywne, dopóki nie zostaną wybrane.
- Materiały uwierzytelniające sandbox SSH (`agents.defaults.sandbox.ssh.identityData`,
  `certificateData`, `knownHostsData` oraz nadpisania dla poszczególnych agentów) są aktywne tylko
  wtedy, gdy efektywny backend sandbox dla domyślnego lub włączonego agenta to `ssh`.
- SecretRef `gateway.remote.token` / `gateway.remote.password` są aktywne, jeśli spełniony jest jeden z tych warunków:
  - `gateway.mode=remote`
  - skonfigurowano `gateway.remote.url`
  - `gateway.tailscale.mode` ma wartość `serve` lub `funnel`
  - w trybie lokalnym bez tych zdalnych powierzchni:
    - `gateway.remote.token` jest aktywny, gdy może wygrać uwierzytelnianie tokenem i nie skonfigurowano żadnego tokenu env/auth.
    - `gateway.remote.password` jest aktywny tylko wtedy, gdy może wygrać uwierzytelnianie hasłem i nie skonfigurowano żadnego hasła env/auth.
- SecretRef `gateway.auth.token` jest nieaktywny dla rozwiązywania uwierzytelniania przy starcie, gdy ustawiono `OPENCLAW_GATEWAY_TOKEN`, ponieważ token env ma pierwszeństwo dla tego runtime.

## Diagnostyka powierzchni uwierzytelniania gateway

Gdy SecretRef jest skonfigurowany w `gateway.auth.token`, `gateway.auth.password`,
`gateway.remote.token` lub `gateway.remote.password`, logi uruchomienia/przeładowania gateway jawnie pokazują
stan powierzchni:

- `active`: SecretRef jest częścią efektywnej powierzchni uwierzytelniania i musi zostać rozwiązany.
- `inactive`: SecretRef jest ignorowany dla tego runtime, ponieważ wygrywa inna powierzchnia uwierzytelniania lub
  ponieważ zdalne uwierzytelnianie jest wyłączone/nieaktywne.

Te wpisy są logowane z kodem `SECRETS_GATEWAY_AUTH_SURFACE` i zawierają przyczynę używaną przez
politykę aktywnej powierzchni, dzięki czemu widać, dlaczego dane uwierzytelniające zostały potraktowane jako aktywne lub nieaktywne.

## Walidacja wstępna odwołań podczas onboardingu

Gdy onboarding działa w trybie interaktywnym i wybierzesz przechowywanie SecretRef, OpenClaw uruchamia walidację preflight przed zapisaniem:

- Odwołania env: waliduje nazwę zmiennej env i potwierdza, że podczas konfiguracji widoczna jest niepusta wartość.
- Odwołania providera (`file` lub `exec`): waliduje wybór providera, rozwiązuje `id` i sprawdza typ rozwiązanej wartości.
- Ścieżka ponownego użycia quickstart: gdy `gateway.auth.token` jest już SecretRef, onboarding rozwiązuje je przed bootstrapem probe/dashboard (dla odwołań `env`, `file` i `exec`) przy użyciu tej samej bramki fail-fast.

Jeśli walidacja się nie powiedzie, onboarding wyświetla błąd i pozwala spróbować ponownie.

## Kontrakt SecretRef

Używaj wszędzie jednej postaci obiektu:

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

### `source: "env"`

```json5
{ source: "env", provider: "default", id: "OPENAI_API_KEY" }
```

Walidacja:

- `provider` musi pasować do `^[a-z][a-z0-9_-]{0,63}$`
- `id` musi pasować do `^[A-Z][A-Z0-9_]{0,127}$`

### `source: "file"`

```json5
{ source: "file", provider: "filemain", id: "/providers/openai/apiKey" }
```

Walidacja:

- `provider` musi pasować do `^[a-z][a-z0-9_-]{0,63}$`
- `id` musi być bezwzględnym JSON pointer (`/...`)
- Escaping segmentów zgodnie z RFC6901: `~` => `~0`, `/` => `~1`

### `source: "exec"`

```json5
{ source: "exec", provider: "vault", id: "providers/openai/apiKey" }
```

Walidacja:

- `provider` musi pasować do `^[a-z][a-z0-9_-]{0,63}$`
- `id` musi pasować do `^[A-Za-z0-9][A-Za-z0-9._:/-]{0,255}$`
- `id` nie może zawierać `.` ani `..` jako segmentów ścieżki rozdzielonych ukośnikami (na przykład `a/../b` jest odrzucane)

## Konfiguracja providera

Zdefiniuj providerów w `secrets.providers`:

```json5
{
  secrets: {
    providers: {
      default: { source: "env" },
      filemain: {
        source: "file",
        path: "~/.openclaw/secrets.json",
        mode: "json", // lub "singleValue"
      },
      vault: {
        source: "exec",
        command: "/usr/local/bin/openclaw-vault-resolver",
        args: ["--profile", "prod"],
        passEnv: ["PATH", "VAULT_ADDR"],
        jsonOnly: true,
      },
    },
    defaults: {
      env: "default",
      file: "filemain",
      exec: "vault",
    },
    resolution: {
      maxProviderConcurrency: 4,
      maxRefsPerProvider: 512,
      maxBatchBytes: 262144,
    },
  },
}
```

### Provider env

- Opcjonalna allowlista przez `allowlist`.
- Brakujące/puste wartości env powodują błąd rozwiązywania.

### Provider file

- Odczytuje lokalny plik ze ścieżki `path`.
- `mode: "json"` oczekuje payloadu będącego obiektem JSON i rozwiązuje `id` jako wskaźnik.
- `mode: "singleValue"` oczekuje ref id `"value"` i zwraca zawartość pliku.
- Ścieżka musi przejść kontrole właściciela/uprawnień.
- Uwaga dla Windows fail-closed: jeśli weryfikacja ACL dla ścieżki jest niedostępna, rozwiązywanie kończy się błędem. Tylko dla zaufanych ścieżek ustaw `allowInsecurePath: true` dla tego providera, aby pominąć kontrole bezpieczeństwa ścieżki.

### Provider exec

- Uruchamia skonfigurowaną bezwzględną ścieżkę binarną, bez shella.
- Domyślnie `command` musi wskazywać zwykły plik (nie symlink).
- Ustaw `allowSymlinkCommand: true`, aby dopuścić ścieżki poleceń będące symlinkami (na przykład shimy Homebrew). OpenClaw waliduje ścieżkę rozwiązania celu.
- Łącz `allowSymlinkCommand` z `trustedDirs` dla ścieżek menedżera pakietów (na przykład `["/opt/homebrew"]`).
- Obsługuje timeout, timeout braku wyjścia, limity bajtów wyjścia, allowlistę env i zaufane katalogi.
- Uwaga dla Windows fail-closed: jeśli weryfikacja ACL dla ścieżki polecenia jest niedostępna, rozwiązywanie kończy się błędem. Tylko dla zaufanych ścieżek ustaw `allowInsecurePath: true` dla tego providera, aby pominąć kontrole bezpieczeństwa ścieżki.

Payload żądania (stdin):

```json
{ "protocolVersion": 1, "provider": "vault", "ids": ["providers/openai/apiKey"] }
```

Payload odpowiedzi (stdout):

```jsonc
{ "protocolVersion": 1, "values": { "providers/openai/apiKey": "<openai-api-key>" } } // pragma: allowlist secret
```

Opcjonalne błędy dla poszczególnych id:

```json
{
  "protocolVersion": 1,
  "values": {},
  "errors": { "providers/openai/apiKey": { "message": "not found" } }
}
```

## Przykłady integracji exec

### 1Password CLI

```json5
{
  secrets: {
    providers: {
      onepassword_openai: {
        source: "exec",
        command: "/opt/homebrew/bin/op",
        allowSymlinkCommand: true, // wymagane dla binarek Homebrew będących symlinkami
        trustedDirs: ["/opt/homebrew"],
        args: ["read", "op://Personal/OpenClaw QA API Key/password"],
        passEnv: ["HOME"],
        jsonOnly: false,
      },
    },
  },
  models: {
    providers: {
      openai: {
        baseUrl: "https://api.openai.com/v1",
        models: [{ id: "gpt-5", name: "gpt-5" }],
        apiKey: { source: "exec", provider: "onepassword_openai", id: "value" },
      },
    },
  },
}
```

### HashiCorp Vault CLI

```json5
{
  secrets: {
    providers: {
      vault_openai: {
        source: "exec",
        command: "/opt/homebrew/bin/vault",
        allowSymlinkCommand: true, // wymagane dla binarek Homebrew będących symlinkami
        trustedDirs: ["/opt/homebrew"],
        args: ["kv", "get", "-field=OPENAI_API_KEY", "secret/openclaw"],
        passEnv: ["VAULT_ADDR", "VAULT_TOKEN"],
        jsonOnly: false,
      },
    },
  },
  models: {
    providers: {
      openai: {
        baseUrl: "https://api.openai.com/v1",
        models: [{ id: "gpt-5", name: "gpt-5" }],
        apiKey: { source: "exec", provider: "vault_openai", id: "value" },
      },
    },
  },
}
```

### `sops`

```json5
{
  secrets: {
    providers: {
      sops_openai: {
        source: "exec",
        command: "/opt/homebrew/bin/sops",
        allowSymlinkCommand: true, // wymagane dla binarek Homebrew będących symlinkami
        trustedDirs: ["/opt/homebrew"],
        args: ["-d", "--extract", '["providers"]["openai"]["apiKey"]', "/path/to/secrets.enc.json"],
        passEnv: ["SOPS_AGE_KEY_FILE"],
        jsonOnly: false,
      },
    },
  },
  models: {
    providers: {
      openai: {
        baseUrl: "https://api.openai.com/v1",
        models: [{ id: "gpt-5", name: "gpt-5" }],
        apiKey: { source: "exec", provider: "sops_openai", id: "value" },
      },
    },
  },
}
```

## Zmienne środowiskowe serwera MCP

Zmienne env serwera MCP skonfigurowane przez `plugins.entries.acpx.config.mcpServers` obsługują SecretInput. Dzięki temu klucze API i tokeny nie muszą znajdować się w konfiguracji plaintext:

```json5
{
  plugins: {
    entries: {
      acpx: {
        enabled: true,
        config: {
          mcpServers: {
            github: {
              command: "npx",
              args: ["-y", "@modelcontextprotocol/server-github"],
              env: {
                GITHUB_PERSONAL_ACCESS_TOKEN: {
                  source: "env",
                  provider: "default",
                  id: "MCP_GITHUB_PAT",
                },
              },
            },
          },
        },
      },
    },
  },
}
```

Wartości plaintext typu string nadal działają. Odwołania szablonów env takie jak `${MCP_SERVER_API_KEY}` i obiekty SecretRef są rozwiązywane podczas aktywacji gateway, zanim zostanie uruchomiony proces serwera MCP. Podobnie jak w przypadku innych powierzchni SecretRef, nierozwiązane odwołania blokują aktywację tylko wtedy, gdy wtyczka `acpx` jest efektywnie aktywna.

## Materiały uwierzytelniające sandbox SSH

Podstawowy backend sandbox `ssh` także obsługuje SecretRef dla materiałów uwierzytelniających SSH:

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "all",
        backend: "ssh",
        ssh: {
          target: "user@gateway-host:22",
          identityData: { source: "env", provider: "default", id: "SSH_IDENTITY" },
          certificateData: { source: "env", provider: "default", id: "SSH_CERTIFICATE" },
          knownHostsData: { source: "env", provider: "default", id: "SSH_KNOWN_HOSTS" },
        },
      },
    },
  },
}
```

Zachowanie runtime:

- OpenClaw rozwiązuje te odwołania podczas aktywacji sandbox, a nie lazy przy każdym wywołaniu SSH.
- Rozwiązane wartości są zapisywane do plików tymczasowych z restrykcyjnymi uprawnieniami i używane w generowanej konfiguracji SSH.
- Jeśli efektywny backend sandbox nie jest `ssh`, te odwołania pozostają nieaktywne i nie blokują uruchomienia.

## Obsługiwana powierzchnia danych uwierzytelniających

Kanoniczna lista obsługiwanych i nieobsługiwanych danych uwierzytelniających znajduje się tutaj:

- [Powierzchnia danych uwierzytelniających SecretRef](/reference/secretref-credential-surface)

Dane uwierzytelniające tworzone w runtime lub rotujące oraz materiały odświeżania OAuth są celowo wyłączone z rozwiązywania SecretRef tylko do odczytu.

## Wymagane zachowanie i priorytet

- Pole bez ref: bez zmian.
- Pole z ref: wymagane na aktywnych powierzchniach podczas aktywacji.
- Jeśli obecne są jednocześnie plaintext i ref, ref ma pierwszeństwo na obsługiwanych ścieżkach priorytetu.
- Sentinel redakcji `__OPENCLAW_REDACTED__` jest zarezerwowany do wewnętrznej redakcji/przywracania konfiguracji i jest odrzucany jako literalne przesłane dane konfiguracji.

Sygnały ostrzeżeń i audytu:

- `SECRETS_REF_OVERRIDES_PLAINTEXT` (ostrzeżenie runtime)
- `REF_SHADOWED` (ustalenie audytu, gdy dane uwierzytelniające z `auth-profiles.json` mają pierwszeństwo przed refami z `openclaw.json`)

Zachowanie zgodności Google Chat:

- `serviceAccountRef` ma pierwszeństwo przed plaintext `serviceAccount`.
- Wartość plaintext jest ignorowana, gdy ustawiono sąsiedni ref.

## Wyzwalacze aktywacji

Aktywacja sekretów uruchamia się przy:

- Uruchomieniu (preflight + końcowa aktywacja)
- Ścieżce hot-apply przeładowania konfiguracji
- Ścieżce restart-check przeładowania konfiguracji
- Ręcznym przeładowaniu przez `secrets.reload`
- Walidacji preflight RPC zapisu konfiguracji gateway (`config.set` / `config.apply` / `config.patch`) dla rozwiązywalności SecretRef na aktywnych powierzchniach w przesłanym payloadzie konfiguracji przed zapisaniem zmian

Kontrakt aktywacji:

- Sukces atomowo podmienia snapshot.
- Błąd przy uruchomieniu przerywa start gateway.
- Błąd przeładowania w runtime zachowuje snapshot last-known-good.
- Błąd preflight RPC zapisu odrzuca przesłaną konfigurację i pozostawia bez zmian zarówno konfigurację na dysku, jak i aktywny snapshot runtime.
- Podanie jawnego tokenu kanału dla pojedynczego wywołania do pomocnika/narzędzia wychodzącego nie uruchamia aktywacji SecretRef; punktami aktywacji pozostają uruchomienie, przeładowanie i jawne `secrets.reload`.

## Sygnały stanu degradacji i odzyskania

Gdy aktywacja przy przeładowaniu kończy się błędem po wcześniejszym zdrowym stanie, OpenClaw przechodzi w zdegradowany stan sekretów.

Jednorazowe zdarzenia systemowe i kody logów:

- `SECRETS_RELOADER_DEGRADED`
- `SECRETS_RELOADER_RECOVERED`

Zachowanie:

- Zdegradowany: runtime zachowuje snapshot last-known-good.
- Odzyskany: emitowany raz po następnej pomyślnej aktywacji.
- Powtarzające się błędy w już zdegradowanym stanie logują ostrzeżenia, ale nie spamują zdarzeniami.
- Fail-fast przy starcie nie emituje zdarzeń degradacji, ponieważ runtime nigdy nie stał się aktywny.

## Rozwiązywanie na ścieżkach poleceń

Ścieżki poleceń mogą włączyć obsługiwane rozwiązywanie SecretRef przez RPC snapshotu gateway.

Istnieją dwa szerokie zachowania:

- Ścisłe ścieżki poleceń (na przykład zdalne ścieżki pamięci `openclaw memory` i `openclaw qr --remote`, gdy potrzebują zdalnych refów współdzielonego sekretu) odczytują z aktywnego snapshotu i kończą się fail-fast, gdy wymagany SecretRef jest niedostępny.
- Ścieżki poleceń tylko do odczytu (na przykład `openclaw status`, `openclaw status --all`, `openclaw channels status`, `openclaw channels resolve`, `openclaw security audit` oraz przepływy doctor/config repair tylko do odczytu) również preferują aktywny snapshot, ale degradują się zamiast przerywać, gdy docelowy SecretRef jest niedostępny na tej ścieżce polecenia.

Zachowanie tylko do odczytu:

- Gdy gateway działa, te polecenia najpierw odczytują z aktywnego snapshotu.
- Jeśli rozwiązywanie przez gateway jest niepełne lub gateway jest niedostępny, próbują ukierunkowanego lokalnego fallbacku dla konkretnej powierzchni polecenia.
- Jeśli docelowy SecretRef nadal jest niedostępny, polecenie kontynuuje z zdegradowanym wyjściem tylko do odczytu i jawną diagnostyką, taką jak „configured but unavailable in this command path”.
- To zdegradowane zachowanie jest lokalne dla polecenia. Nie osłabia uruchomienia runtime, przeładowania ani ścieżek wysyłania/uwierzytelniania.

Inne uwagi:

- Odświeżenie snapshotu po rotacji sekretów backendu obsługuje `openclaw secrets reload`.
- Metoda RPC gateway używana przez te ścieżki poleceń: `secrets.resolve`.

## Przepływ audytu i konfiguracji

Domyślny przepływ operatora:

```bash
openclaw secrets audit --check
openclaw secrets configure
openclaw secrets audit --check
```

### `secrets audit`

Ustalenia obejmują:

- wartości plaintext zapisane na dysku (`openclaw.json`, `auth-profiles.json`, `.env` oraz wygenerowane `agents/*/agent/models.json`)
- pozostałości wrażliwych nagłówków providerów w wygenerowanych wpisach `models.json`
- nierozwiązane odwołania
- cieniowanie priorytetu (`auth-profiles.json` ma priorytet nad refami z `openclaw.json`)
- starsze pozostałości (`auth.json`, przypomnienia OAuth)

Uwaga dla exec:

- Domyślnie audyt pomija kontrole rozwiązywalności SecretRef typu exec, aby uniknąć skutków ubocznych poleceń.
- Użyj `openclaw secrets audit --allow-exec`, aby wykonywać providery exec podczas audytu.

Uwaga dotycząca pozostałości nagłówków:

- Wykrywanie wrażliwych nagłówków providerów opiera się na heurystykach nazw (typowe nazwy i fragmenty nagłówków uwierzytelniania/danych uwierzytelniających, takie jak `authorization`, `x-api-key`, `token`, `secret`, `password` i `credential`).

### `secrets configure`

Interaktywny pomocnik, który:

- najpierw konfiguruje `secrets.providers` (`env`/`file`/`exec`, dodawanie/edycja/usuwanie)
- pozwala wybrać obsługiwane pola zawierające sekrety w `openclaw.json` oraz `auth-profiles.json` dla jednego zakresu agenta
- może utworzyć nowe mapowanie `auth-profiles.json` bezpośrednio w selektorze celu
- zbiera szczegóły SecretRef (`source`, `provider`, `id`)
- uruchamia rozwiązywanie preflight
- może zastosować zmiany natychmiast

Uwaga dla exec:

- Preflight pomija kontrole SecretRef typu exec, chyba że ustawiono `--allow-exec`.
- Jeśli stosujesz zmiany bezpośrednio przez `configure --apply` i plan zawiera odwołania/providery exec, pozostaw `--allow-exec` także dla kroku apply.

Przydatne tryby:

- `openclaw secrets configure --providers-only`
- `openclaw secrets configure --skip-provider-setup`
- `openclaw secrets configure --agent <id>`

Domyślne działanie apply w `configure`:

- usuwa pasujące statyczne dane uwierzytelniające z `auth-profiles.json` dla docelowych providerów
- usuwa starsze statyczne wpisy `api_key` z `auth.json`
- usuwa pasujące znane linie sekretów z `<config-dir>/.env`

### `secrets apply`

Zastosuj zapisany plan:

```bash
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --allow-exec
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run --allow-exec
```

Uwaga dla exec:

- dry-run pomija kontrole exec, chyba że ustawiono `--allow-exec`.
- tryb zapisu odrzuca plany zawierające SecretRef/providery exec, chyba że ustawiono `--allow-exec`.

Szczegóły ścisłego kontraktu celu/ścieżki i dokładne reguły odrzucania znajdziesz tutaj:

- [Kontrakt planu apply dla sekretów](/gateway/secrets-plan-contract)

## Jednokierunkowa polityka bezpieczeństwa

OpenClaw celowo nie zapisuje kopii zapasowych rollback zawierających historyczne wartości sekretów w plaintext.

Model bezpieczeństwa:

- preflight musi się powieść przed trybem zapisu
- aktywacja runtime jest walidowana przed zatwierdzeniem
- apply aktualizuje pliki przy użyciu atomowego podmieniania plików i best-effort restore w razie błędu

## Uwagi o zgodności ze starszym uwierzytelnianiem

W przypadku statycznych danych uwierzytelniających runtime nie zależy już od starszego magazynu uwierzytelniania w plaintext.

- Źródłem danych uwierzytelniających runtime jest rozwiązany snapshot w pamięci.
- Starsze statyczne wpisy `api_key` są usuwane po wykryciu.
- Zachowanie zgodności związane z OAuth pozostaje osobne.

## Uwaga dotycząca interfejsu webowego

Niektóre unie SecretInput są łatwiejsze do skonfigurowania w trybie edytora raw niż w trybie formularza.

## Powiązana dokumentacja

- Polecenia CLI: [secrets](/cli/secrets)
- Szczegóły kontraktu planu: [Kontrakt planu apply dla sekretów](/gateway/secrets-plan-contract)
- Powierzchnia danych uwierzytelniających: [Powierzchnia danych uwierzytelniających SecretRef](/reference/secretref-credential-surface)
- Konfiguracja uwierzytelniania: [Authentication](/gateway/authentication)
- Postawa bezpieczeństwa: [Security](/gateway/security)
- Priorytet środowiska: [Environment Variables](/help/environment)
