---
read_when:
    - Konfigurowanie SecretRef dla poświadczeń dostawców i odwołań `auth-profiles.json`
    - Bezpieczne operowanie przeładowaniem, audytem, konfiguracją i stosowaniem sekretów na produkcji
    - Zrozumienie fail-fast przy starcie, filtrowania nieaktywnych powierzchni i zachowania last-known-good
summary: 'Zarządzanie sekretami: kontrakt SecretRef, zachowanie snapshotu runtime i bezpieczne jednokierunkowe czyszczenie'
title: Zarządzanie sekretami
x-i18n:
    generated_at: "2026-04-24T09:12:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: 18e21f63bbf1815b7166dfe123900575754270de94113b446311d73dfd4f2343
    source_path: gateway/secrets.md
    workflow: 15
---

OpenClaw obsługuje addytywne SecretRef, więc obsługiwane poświadczenia nie muszą być przechowywane jako jawny tekst w konfiguracji.

Jawny tekst nadal działa. SecretRef są opcjonalne dla każdego poświadczenia.

## Cele i model runtime

Sekrety są rozwiązywane do snapshotu runtime w pamięci.

- Rozwiązywanie jest eager podczas aktywacji, a nie lazy na ścieżkach żądań.
- Start kończy się fail-fast, gdy efektywnie aktywny SecretRef nie może zostać rozwiązany.
- Reload używa atomic swap: pełny sukces albo zachowanie snapshotu last-known-good.
- Naruszenia polityki SecretRef (na przykład profile auth w trybie OAuth połączone z wejściem SecretRef) kończą aktywację błędem przed podmianą runtime.
- Żądania runtime odczytują tylko z aktywnego snapshotu w pamięci.
- Po pierwszej udanej aktywacji/załadowaniu konfiguracji ścieżki kodu runtime nadal odczytują ten aktywny snapshot w pamięci, aż udany reload go podmieni.
- Ścieżki dostarczania wychodzącego także odczytują z tego aktywnego snapshotu (na przykład dostarczanie odpowiedzi/wątków Discord i wysyłanie akcji Telegram); nie rozwiązują SecretRef ponownie przy każdym wysłaniu.

To utrzymuje awarie dostawców sekretów poza gorącymi ścieżkami żądań.

## Filtrowanie aktywnych powierzchni

SecretRef są walidowane tylko na efektywnie aktywnych powierzchniach.

- Włączone powierzchnie: nierozwiązane odwołania blokują startup/reload.
- Nieaktywne powierzchnie: nierozwiązane odwołania nie blokują startup/reload.
- Nieaktywne odwołania emitują niekrytyczną diagnostykę z kodem `SECRETS_REF_IGNORED_INACTIVE_SURFACE`.

Przykłady nieaktywnych powierzchni:

- Wyłączone wpisy kanałów/kont.
- Poświadczenia kanału najwyższego poziomu, których nie dziedziczy żadne włączone konto.
- Wyłączone powierzchnie narzędzi/funkcji.
- Klucze specyficzne dla dostawcy wyszukiwania WWW, które nie są wybrane przez `tools.web.search.provider`.
  W trybie auto (provider nieustawiony) klucze są sprawdzane według pierwszeństwa dla automatycznego wykrywania dostawcy, aż jeden się rozwiąże.
  Po wyborze klucze niewybranego dostawcy są traktowane jako nieaktywne, dopóki nie zostaną wybrane.
- Materiały auth SSH sandbox (`agents.defaults.sandbox.ssh.identityData`,
  `certificateData`, `knownHostsData` oraz nadpisania per agent) są aktywne tylko
  wtedy, gdy efektywny backend sandbox dla domyślnego agenta albo włączonego agenta to `ssh`.
- SecretRef `gateway.remote.token` / `gateway.remote.password` są aktywne, jeśli prawdziwy jest jeden z tych warunków:
  - `gateway.mode=remote`
  - skonfigurowano `gateway.remote.url`
  - `gateway.tailscale.mode` ma wartość `serve` albo `funnel`
  - W trybie lokalnym bez tych zdalnych powierzchni:
    - `gateway.remote.token` jest aktywne, gdy auth tokenem może wygrać i nie skonfigurowano tokenu env/auth.
    - `gateway.remote.password` jest aktywne tylko wtedy, gdy auth hasłem może wygrać i nie skonfigurowano hasła env/auth.
- SecretRef `gateway.auth.token` jest nieaktywne dla rozwiązywania auth przy starcie, gdy ustawiono `OPENCLAW_GATEWAY_TOKEN`, ponieważ token env ma pierwszeństwo dla tego runtime.

## Diagnostyka powierzchni auth Gateway

Gdy SecretRef jest skonfigurowane w `gateway.auth.token`, `gateway.auth.password`,
`gateway.remote.token` albo `gateway.remote.password`, startup/reload gateway jawnie loguje
stan powierzchni:

- `active`: SecretRef jest częścią efektywnej powierzchni auth i musi się rozwiązać.
- `inactive`: SecretRef jest ignorowane dla tego runtime, ponieważ wygrywa inna powierzchnia auth albo
  ponieważ zdalne auth jest wyłączone/nieaktywne.

Te wpisy są logowane z `SECRETS_GATEWAY_AUTH_SURFACE` i zawierają powód użyty przez politykę
aktywnej powierzchni, dzięki czemu można zobaczyć, dlaczego poświadczenie potraktowano jako aktywne albo nieaktywne.

## Wstępna walidacja odwołań podczas onboardingu

Gdy onboarding działa w trybie interaktywnym i wybierzesz przechowywanie przez SecretRef, OpenClaw wykonuje walidację wstępną przed zapisem:

- Odwołania env: waliduje nazwę zmiennej env i potwierdza, że podczas konfiguracji widoczna jest niepusta wartość.
- Odwołania provider (`file` albo `exec`): waliduje wybór providera, rozwiązuje `id` i sprawdza typ rozwiązanej wartości.
- Ścieżka ponownego użycia quickstart: gdy `gateway.auth.token` jest już SecretRef, onboarding rozwiązuje je przed bootstrapem probe/dashboard (dla odwołań `env`, `file` i `exec`) przy użyciu tej samej bramki fail-fast.

Jeśli walidacja się nie powiedzie, onboarding pokazuje błąd i pozwala spróbować ponownie.

## Kontrakt SecretRef

Wszędzie używaj jednego kształtu obiektu:

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
- `id` musi być absolutnym wskaźnikiem JSON (`/...`)
- Escaping segmentów zgodnie z RFC6901: `~` => `~0`, `/` => `~1`

### `source: "exec"`

```json5
{ source: "exec", provider: "vault", id: "providers/openai/apiKey" }
```

Walidacja:

- `provider` musi pasować do `^[a-z][a-z0-9_-]{0,63}$`
- `id` musi pasować do `^[A-Za-z0-9][A-Za-z0-9._:/-]{0,255}$`
- `id` nie może zawierać `.` ani `..` jako segmentów ścieżki rozdzielonych ukośnikami (na przykład `a/../b` jest odrzucane)

## Konfiguracja providerów

Zdefiniuj providery w `secrets.providers`:

```json5
{
  secrets: {
    providers: {
      default: { source: "env" },
      filemain: {
        source: "file",
        path: "~/.openclaw/secrets.json",
        mode: "json", // or "singleValue"
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

- Opcjonalna allowlist przez `allowlist`.
- Brakujące/puste wartości env kończą rozwiązywanie błędem.

### Provider file

- Odczytuje lokalny plik ze ścieżki `path`.
- `mode: "json"` oczekuje ładunku w postaci obiektu JSON i rozwiązuje `id` jako wskaźnik.
- `mode: "singleValue"` oczekuje `id` odwołania równego `"value"` i zwraca zawartość pliku.
- Ścieżka musi przejść kontrole właściciela/uprawnień.
- Uwaga fail-closed dla Windows: jeśli weryfikacja ACL nie jest dostępna dla ścieżki, rozwiązywanie kończy się błędem. Tylko dla zaufanych ścieżek ustaw `allowInsecurePath: true` dla tego providera, aby pominąć kontrole bezpieczeństwa ścieżki.

### Provider exec

- Uruchamia skonfigurowaną absolutną ścieżkę do binarium, bez powłoki.
- Domyślnie `command` musi wskazywać zwykły plik (nie dowiązanie symboliczne).
- Ustaw `allowSymlinkCommand: true`, aby zezwolić na ścieżki poleceń będące dowiązaniami symbolicznymi (na przykład shimy Homebrew). OpenClaw waliduje rozwiązaną ścieżkę celu.
- Łącz `allowSymlinkCommand` z `trustedDirs` dla ścieżek menedżerów pakietów (na przykład `["/opt/homebrew"]`).
- Obsługuje timeout, timeout braku wyjścia, limity bajtów wyjścia, allowlist env i zaufane katalogi.
- Uwaga fail-closed dla Windows: jeśli weryfikacja ACL nie jest dostępna dla ścieżki polecenia, rozwiązywanie kończy się błędem. Tylko dla zaufanych ścieżek ustaw `allowInsecurePath: true` dla tego providera, aby pominąć kontrole bezpieczeństwa ścieżki.

Ładunek żądania (`stdin`):

```json
{ "protocolVersion": 1, "provider": "vault", "ids": ["providers/openai/apiKey"] }
```

Ładunek odpowiedzi (`stdout`):

```jsonc
{ "protocolVersion": 1, "values": { "providers/openai/apiKey": "<openai-api-key>" } } // pragma: allowlist secret
```

Opcjonalne błędy per `id`:

```json
{
  "protocolVersion": 1,
  "values": {},
  "errors": { "providers/openai/apiKey": { "message": "not found" } }
}
```

## Przykłady integracji exec

### CLI 1Password

```json5
{
  secrets: {
    providers: {
      onepassword_openai: {
        source: "exec",
        command: "/opt/homebrew/bin/op",
        allowSymlinkCommand: true, // required for Homebrew symlinked binaries
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

### CLI HashiCorp Vault

```json5
{
  secrets: {
    providers: {
      vault_openai: {
        source: "exec",
        command: "/opt/homebrew/bin/vault",
        allowSymlinkCommand: true, // required for Homebrew symlinked binaries
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
        allowSymlinkCommand: true, // required for Homebrew symlinked binaries
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

Zmienne env serwera MCP skonfigurowane przez `plugins.entries.acpx.config.mcpServers` obsługują SecretInput. Dzięki temu klucze API i tokeny nie trafiają do jawnego tekstu konfiguracji:

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

Wartości tekstowe w jawnym tekście nadal działają. Odwołania szablonów env takie jak `${MCP_SERVER_API_KEY}` i obiekty SecretRef są rozwiązywane podczas aktywacji gateway przed uruchomieniem procesu serwera MCP. Tak jak w przypadku innych powierzchni SecretRef, nierozwiązane odwołania blokują aktywację tylko wtedy, gdy Plugin `acpx` jest efektywnie aktywny.

## Materiał auth SSH sandbox

Główny backend sandbox `ssh` także obsługuje SecretRef dla materiału auth SSH:

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
- Rozwiązane wartości są zapisywane do plików tymczasowych z restrykcyjnymi uprawnieniami i używane w wygenerowanej konfiguracji SSH.
- Jeśli efektywny backend sandbox nie ma wartości `ssh`, te odwołania pozostają nieaktywne i nie blokują startupu.

## Obsługiwana powierzchnia poświadczeń

Kanoniczne listy obsługiwanych i nieobsługiwanych poświadczeń znajdują się tutaj:

- [Powierzchnia poświadczeń SecretRef](/pl/reference/secretref-credential-surface)

Poświadczenia tworzone w runtime, rotujące i materiał odświeżania OAuth są celowo wykluczone z rozwiązywania SecretRef tylko do odczytu.

## Wymagane zachowanie i pierwszeństwo

- Pole bez odwołania: bez zmian.
- Pole z odwołaniem: wymagane na aktywnych powierzchniach podczas aktywacji.
- Jeśli obecne są zarówno jawny tekst, jak i odwołanie, odwołanie ma pierwszeństwo na obsługiwanych ścieżkach pierwszeństwa.
- Sentinel redakcji `__OPENCLAW_REDACTED__` jest zarezerwowany do wewnętrznej redakcji/przywracania konfiguracji i jest odrzucany jako dosłownie przesłane dane konfiguracji.

Sygnały ostrzeżeń i audytu:

- `SECRETS_REF_OVERRIDES_PLAINTEXT` (ostrzeżenie runtime)
- `REF_SHADOWED` (ustalenie audytu, gdy poświadczenia `auth-profiles.json` mają pierwszeństwo przed odwołaniami z `openclaw.json`)

Zachowanie zgodności Google Chat:

- `serviceAccountRef` ma pierwszeństwo przed jawnym tekstem `serviceAccount`.
- Wartość jawnego tekstu jest ignorowana, gdy ustawiono sąsiednie odwołanie.

## Triggery aktywacji

Aktywacja sekretów działa przy:

- Starcie (preflight plus końcowa aktywacja)
- Ścieżce hot-apply przeładowania konfiguracji
- Ścieżce restart-check przeładowania konfiguracji
- Ręcznym reloadzie przez `secrets.reload`
- Preflight RPC zapisu konfiguracji gateway (`config.set` / `config.apply` / `config.patch`) dla rozwiązywalności SecretRef aktywnych powierzchni w przesłanym ładunku konfiguracji przed utrwaleniem edycji

Kontrakt aktywacji:

- Sukces podmienia snapshot atomowo.
- Błąd przy starcie przerywa startup gateway.
- Błąd reloadu runtime zachowuje snapshot last-known-good.
- Błąd preflight Write-RPC odrzuca przesłaną konfigurację i pozostawia zarówno konfigurację na dysku, jak i aktywny snapshot runtime bez zmian.
- Podanie jawnego tokenu kanału per wywołanie do pomocnika/narzędzia wychodzącego nie uruchamia aktywacji SecretRef; punktami aktywacji pozostają startup, reload i jawne `secrets.reload`.

## Sygnały stanu pogorszonego i odzyskanego

Gdy aktywacja podczas reloadu zawiedzie po wcześniejszym zdrowym stanie, OpenClaw przechodzi w stan pogorszonych sekretów.

Jednorazowe zdarzenia systemowe i kody logów:

- `SECRETS_RELOADER_DEGRADED`
- `SECRETS_RELOADER_RECOVERED`

Zachowanie:

- Stan pogorszony: runtime zachowuje snapshot last-known-good.
- Stan odzyskany: emitowany raz po następnej udanej aktywacji.
- Powtarzające się błędy przy już pogorszonym stanie logują ostrzeżenia, ale nie spamują zdarzeniami.
- Fail-fast przy starcie nie emituje zdarzeń pogorszenia, ponieważ runtime nigdy nie stał się aktywny.

## Rozwiązywanie na ścieżkach poleceń

Ścieżki poleceń mogą opt-in do obsługiwanego rozwiązywania SecretRef przez RPC snapshotu gateway.

Istnieją dwa szerokie zachowania:

- Ścisłe ścieżki poleceń (na przykład zdalne ścieżki pamięci `openclaw memory` oraz `openclaw qr --remote`, gdy potrzebuje zdalnych odwołań do współdzielonych sekretów) odczytują z aktywnego snapshotu i kończą się fail-fast, gdy wymagany SecretRef jest niedostępny.
- Ścieżki poleceń tylko do odczytu (na przykład `openclaw status`, `openclaw status --all`, `openclaw channels status`, `openclaw channels resolve`, `openclaw security audit` oraz przepływy doctor/naprawy konfiguracji tylko do odczytu) również preferują aktywny snapshot, ale degradują się zamiast przerywać, gdy ukierunkowany SecretRef jest niedostępny na tej ścieżce polecenia.

Zachowanie tylko do odczytu:

- Gdy gateway działa, te polecenia najpierw odczytują z aktywnego snapshotu.
- Jeśli rozwiązywanie przez gateway jest niepełne albo gateway jest niedostępny, próbują ukierunkowanego lokalnego fallbacku dla konkretnej powierzchni polecenia.
- Jeśli ukierunkowany SecretRef nadal jest niedostępny, polecenie działa dalej ze zdegradowanym wyjściem tylko do odczytu i jawną diagnostyką, taką jak „configured but unavailable in this command path”.
- To zdegradowane zachowanie dotyczy tylko konkretnego polecenia. Nie osłabia startupu runtime, reloadu ani ścieżek send/auth.

Inne uwagi:

- Odświeżanie snapshotu po rotacji sekretu w backendzie obsługuje `openclaw secrets reload`.
- Metoda Gateway RPC używana przez te ścieżki poleceń: `secrets.resolve`.

## Przepływ audytu i konfiguracji

Domyślny przepływ operatora:

```bash
openclaw secrets audit --check
openclaw secrets configure
openclaw secrets audit --check
```

### `secrets audit`

Ustalenia obejmują:

- wartości jawnego tekstu w spoczynku (`openclaw.json`, `auth-profiles.json`, `.env` i wygenerowane `agents/*/agent/models.json`)
- pozostałości wrażliwych nagłówków dostawców w jawnej postaci w wygenerowanych wpisach `models.json`
- nierozwiązane odwołania
- przesłanianie przez pierwszeństwo (`auth-profiles.json` mające priorytet nad odwołaniami z `openclaw.json`)
- starsze pozostałości (`auth.json`, przypomnienia OAuth)

Uwaga dotycząca exec:

- Domyślnie audyt pomija sprawdzanie rozwiązywalności SecretRef exec, aby uniknąć efektów ubocznych poleceń.
- Użyj `openclaw secrets audit --allow-exec`, aby wykonywać providery exec podczas audytu.

Uwaga dotycząca pozostałości nagłówków:

- Wykrywanie wrażliwych nagłówków dostawców jest oparte na heurystyce nazw (typowe nazwy i fragmenty nagłówków auth/poświadczeń, takie jak `authorization`, `x-api-key`, `token`, `secret`, `password` i `credential`).

### `secrets configure`

Interaktywny pomocnik, który:

- najpierw konfiguruje `secrets.providers` (`env`/`file`/`exec`, dodaj/edytuj/usuń)
- pozwala wybrać obsługiwane pola zawierające sekrety w `openclaw.json` oraz `auth-profiles.json` dla jednego zakresu agenta
- może utworzyć nowe mapowanie `auth-profiles.json` bezpośrednio w selektorze celu
- zbiera szczegóły SecretRef (`source`, `provider`, `id`)
- uruchamia preflight resolution
- może zastosować zmiany od razu

Uwaga dotycząca exec:

- Preflight pomija sprawdzanie SecretRef exec, chyba że ustawiono `--allow-exec`.
- Jeśli stosujesz zmiany bezpośrednio z `configure --apply`, a plan zawiera odwołania/providery exec, pozostaw `--allow-exec` również dla kroku apply.

Przydatne tryby:

- `openclaw secrets configure --providers-only`
- `openclaw secrets configure --skip-provider-setup`
- `openclaw secrets configure --agent <id>`

Domyślne zachowanie `configure` przy apply:

- czyści pasujące statyczne poświadczenia z `auth-profiles.json` dla ukierunkowanych dostawców
- czyści starsze statyczne wpisy `api_key` z `auth.json`
- czyści pasujące znane linie sekretów z `<config-dir>/.env`

### `secrets apply`

Zastosuj zapisany plan:

```bash
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --allow-exec
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run --allow-exec
```

Uwaga dotycząca exec:

- `dry-run` pomija sprawdzenia exec, chyba że ustawiono `--allow-exec`.
- Tryb zapisu odrzuca plany zawierające SecretRef/providery exec, chyba że ustawiono `--allow-exec`.

Szczegóły ścisłego kontraktu celu/ścieżki i dokładne reguły odrzucania znajdziesz tutaj:

- [Kontrakt planu Secrets Apply](/pl/gateway/secrets-plan-contract)

## Jednokierunkowa polityka bezpieczeństwa

OpenClaw celowo nie zapisuje kopii zapasowych rollback zawierających historyczne wartości sekretów w jawnym tekście.

Model bezpieczeństwa:

- preflight musi się powieść przed trybem zapisu
- aktywacja runtime jest walidowana przed zatwierdzeniem
- apply aktualizuje pliki przez atomową podmianę plików i best-effort restore przy błędzie

## Uwagi dotyczące zgodności starszego auth

Dla statycznych poświadczeń runtime nie zależy już od starszego przechowywania auth w jawnym tekście.

- Źródłem poświadczeń runtime jest rozwiązany snapshot w pamięci.
- Starsze statyczne wpisy `api_key` są czyszczone po wykryciu.
- Zachowanie zgodności związane z OAuth pozostaje osobne.

## Uwaga dotycząca interfejsu Web

Niektóre unie SecretInput łatwiej konfiguruje się w trybie surowego edytora niż w trybie formularza.

## Powiązana dokumentacja

- Polecenia CLI: [secrets](/pl/cli/secrets)
- Szczegóły kontraktu planu: [Kontrakt planu Secrets Apply](/pl/gateway/secrets-plan-contract)
- Powierzchnia poświadczeń: [Powierzchnia poświadczeń SecretRef](/pl/reference/secretref-credential-surface)
- Konfiguracja auth: [Uwierzytelnianie](/pl/gateway/authentication)
- Postura bezpieczeństwa: [Bezpieczeństwo](/pl/gateway/security)
- Pierwszeństwo środowiska: [Zmienne środowiskowe](/pl/help/environment)
