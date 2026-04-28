---
read_when:
    - Konfigurowanie SecretRef dla poświadczeń providera i referencji `auth-profiles.json`
    - Bezpieczna obsługa przeładowania, audytu, konfiguracji i zastosowania sekretów na produkcji
    - Zrozumienie szybkiego przerywania przy starcie, filtrowania nieaktywnych powierzchni i zachowania last-known-good
sidebarTitle: Secrets management
summary: 'Zarządzanie sekretami: kontrakt SecretRef, zachowanie snapshotów runtime i bezpieczne jednokierunkowe usuwanie danych wrażliwych'
title: Zarządzanie sekretami
x-i18n:
    generated_at: "2026-04-26T11:31:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: a8697a8eb15cf6ef9b105e3f12cfdad6205284d4c45f1314cd7aec2e2c81fed1
    source_path: gateway/secrets.md
    workflow: 15
---

OpenClaw obsługuje addytywne SecretRef, dzięki czemu obsługiwane poświadczenia nie muszą być przechowywane w konfiguracji jako jawny tekst.

<Note>
Jawny tekst nadal działa. SecretRef są opcjonalne dla każdego poświadczenia.
</Note>

## Cele i model runtime

Sekrety są rozwiązywane do snapshotu runtime w pamięci.

- Rozwiązywanie jest eager podczas aktywacji, a nie lazy na ścieżkach żądań.
- Start kończy się szybkim błędem, gdy nie da się rozwiązać efektywnie aktywnego SecretRef.
- Reload używa atomowej podmiany: pełny sukces albo zachowanie snapshotu last-known-good.
- Naruszenia polityki SecretRef (na przykład profile auth w trybie OAuth połączone z wejściem SecretRef) kończą aktywację błędem przed podmianą runtime.
- Żądania runtime odczytują tylko aktywny snapshot w pamięci.
- Po pierwszej pomyślnej aktywacji/wczytaniu konfiguracji ścieżki kodu runtime nadal odczytują ten aktywny snapshot w pamięci, aż pomyślny reload go podmieni.
- Ścieżki dostarczania wychodzącego również odczytują z tego aktywnego snapshotu (na przykład dostarczanie odpowiedzi/wątków Discord i wysyłanie akcji Telegram); nie rozwiązują ponownie SecretRef przy każdej wysyłce.

Dzięki temu awarie providera sekretów nie trafiają na gorące ścieżki żądań.

## Filtrowanie aktywnych powierzchni

SecretRef są walidowane tylko na efektywnie aktywnych powierzchniach.

- Powierzchnie włączone: nierozwiązane ref blokują start/reload.
- Powierzchnie nieaktywne: nierozwiązane ref nie blokują startu/reloadu.
- Nieaktywne ref emitują niefatalną diagnostykę z kodem `SECRETS_REF_IGNORED_INACTIVE_SURFACE`.

<AccordionGroup>
  <Accordion title="Przykłady nieaktywnych powierzchni">
    - Wyłączone wpisy kanałów/kont.
    - Poświadczenia kanału na poziomie najwyższym, których nie dziedziczy żadne włączone konto.
    - Wyłączone powierzchnie narzędzi/funkcji.
    - Klucze specyficzne dla providera wyszukiwania w sieci, które nie są wybrane przez `tools.web.search.provider`. W trybie auto (provider nieustawiony) klucze są sprawdzane według pierwszeństwa do auto-wykrycia providera, aż jeden z nich się rozwiąże. Po wyborze klucze niewybranego providera są traktowane jako nieaktywne, dopóki nie zostaną wybrane.
    - Materiał auth SSH sandboxa (`agents.defaults.sandbox.ssh.identityData`, `certificateData`, `knownHostsData` oraz nadpisania per agent) jest aktywny tylko wtedy, gdy efektywnym backendem sandboxa jest `ssh` dla domyślnego agenta lub włączonego agenta.
    - SecretRef `gateway.remote.token` / `gateway.remote.password` są aktywne, jeśli spełniony jest jeden z tych warunków:
      - `gateway.mode=remote`
      - skonfigurowano `gateway.remote.url`
      - `gateway.tailscale.mode` ma wartość `serve` lub `funnel`
      - W trybie lokalnym bez tych zdalnych powierzchni:
        - `gateway.remote.token` jest aktywny, gdy auth tokenem może wygrać i nie skonfigurowano tokenu env/auth.
        - `gateway.remote.password` jest aktywny tylko wtedy, gdy auth hasłem może wygrać i nie skonfigurowano hasła env/auth.
    - SecretRef `gateway.auth.token` jest nieaktywny dla rozstrzygania auth przy starcie, gdy ustawione jest `OPENCLAW_GATEWAY_TOKEN`, ponieważ wejście tokenu env wygrywa dla tego runtime.

  </Accordion>
</AccordionGroup>

## Diagnostyka powierzchni auth Gateway

Gdy SecretRef jest skonfigurowany na `gateway.auth.token`, `gateway.auth.password`, `gateway.remote.token` lub `gateway.remote.password`, start/reload Gateway jawnie loguje stan powierzchni:

- `active`: SecretRef jest częścią efektywnej powierzchni auth i musi się rozwiązać.
- `inactive`: SecretRef jest ignorowany dla tego runtime, ponieważ wygrywa inna powierzchnia auth albo ponieważ zdalne auth jest wyłączone/nieaktywne.

Te wpisy są logowane z `SECRETS_GATEWAY_AUTH_SURFACE` i zawierają przyczynę używaną przez politykę aktywnej powierzchni, dzięki czemu widać, dlaczego poświadczenie zostało potraktowane jako aktywne lub nieaktywne.

## Preflight referencji podczas onboardingu

Gdy onboarding działa w trybie interaktywnym i wybierzesz przechowywanie SecretRef, OpenClaw uruchamia walidację preflight przed zapisem:

- Ref env: waliduje nazwę zmiennej env i potwierdza, że podczas konfiguracji widoczna jest niepusta wartość.
- Ref providera (`file` lub `exec`): waliduje wybór providera, rozstrzyga `id` i sprawdza typ rozstrzygniętej wartości.
- Ścieżka ponownego użycia quickstart: gdy `gateway.auth.token` jest już SecretRef, onboarding rozwiązuje go przed bootstrapem probe/dashboard (dla ref `env`, `file` i `exec`) przy użyciu tej samej bramki fail-fast.

Jeśli walidacja się nie powiedzie, onboarding pokaże błąd i pozwoli spróbować ponownie.

## Kontrakt SecretRef

Wszędzie używaj jednego kształtu obiektu:

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

<Tabs>
  <Tab title="env">
    ```json5
    { source: "env", provider: "default", id: "OPENAI_API_KEY" }
    ```

    Walidacja:

    - `provider` musi pasować do `^[a-z][a-z0-9_-]{0,63}$`
    - `id` musi pasować do `^[A-Z][A-Z0-9_]{0,127}$`

  </Tab>
  <Tab title="file">
    ```json5
    { source: "file", provider: "filemain", id: "/providers/openai/apiKey" }
    ```

    Walidacja:

    - `provider` musi pasować do `^[a-z][a-z0-9_-]{0,63}$`
    - `id` musi być bezwzględnym wskaźnikiem JSON (`/...`)
    - Escaping RFC6901 w segmentach: `~` => `~0`, `/` => `~1`

  </Tab>
  <Tab title="exec">
    ```json5
    { source: "exec", provider: "vault", id: "providers/openai/apiKey" }
    ```

    Walidacja:

    - `provider` musi pasować do `^[a-z][a-z0-9_-]{0,63}$`
    - `id` musi pasować do `^[A-Za-z0-9][A-Za-z0-9._:/-]{0,255}$`
    - `id` nie może zawierać `.` ani `..` jako segmentów ścieżki rozdzielonych ukośnikiem (na przykład `a/../b` jest odrzucane)

  </Tab>
</Tabs>

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

<AccordionGroup>
  <Accordion title="Provider env">
    - Opcjonalna allowlista przez `allowlist`.
    - Brakujące/puste wartości env powodują błąd rozwiązywania.

  </Accordion>
  <Accordion title="Provider file">
    - Odczytuje plik lokalny ze `path`.
    - `mode: "json"` oczekuje payloadu obiektu JSON i rozwiązuje `id` jako wskaźnik.
    - `mode: "singleValue"` oczekuje identyfikatora ref `"value"` i zwraca zawartość pliku.
    - Ścieżka musi przejść kontrole właściciela/uprawnień.
    - Uwaga fail-closed dla Windows: jeśli weryfikacja ACL nie jest dostępna dla ścieżki, rozwiązywanie kończy się błędem. Tylko dla zaufanych ścieżek ustaw `allowInsecurePath: true` dla tego providera, aby ominąć kontrole bezpieczeństwa ścieżki.

  </Accordion>
  <Accordion title="Provider exec">
    - Uruchamia skonfigurowaną bezwzględną ścieżkę binarki, bez powłoki.
    - Domyślnie `command` musi wskazywać zwykły plik (nie symlink).
    - Ustaw `allowSymlinkCommand: true`, aby dopuścić ścieżki poleceń będące symlinkami (na przykład shimy Homebrew). OpenClaw waliduje rozstrzygniętą ścieżkę celu.
    - Połącz `allowSymlinkCommand` z `trustedDirs` dla ścieżek menedżera pakietów (na przykład `["/opt/homebrew"]`).
    - Obsługuje timeout, timeout bez wyjścia, limity bajtów wyjścia, allowlistę env i zaufane katalogi.
    - Uwaga fail-closed dla Windows: jeśli weryfikacja ACL nie jest dostępna dla ścieżki polecenia, rozwiązywanie kończy się błędem. Tylko dla zaufanych ścieżek ustaw `allowInsecurePath: true` dla tego providera, aby ominąć kontrole bezpieczeństwa ścieżki.

    Payload żądania (stdin):

    ```json
    { "protocolVersion": 1, "provider": "vault", "ids": ["providers/openai/apiKey"] }
    ```

    Payload odpowiedzi (stdout):

    ```jsonc
    { "protocolVersion": 1, "values": { "providers/openai/apiKey": "<openai-api-key>" } } // pragma: allowlist secret
    ```

    Opcjonalne błędy per id:

    ```json
    {
      "protocolVersion": 1,
      "values": {},
      "errors": { "providers/openai/apiKey": { "message": "not found" } }
    }
    ```

  </Accordion>
</AccordionGroup>

## Przykłady integracji exec

<AccordionGroup>
  <Accordion title="CLI 1Password">
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
  </Accordion>
  <Accordion title="CLI HashiCorp Vault">
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
  </Accordion>
  <Accordion title="sops">
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
  </Accordion>
</AccordionGroup>

## Zmienne środowiskowe serwera MCP

Zmienne env serwera MCP skonfigurowane przez `plugins.entries.acpx.config.mcpServers` obsługują SecretInput. Dzięki temu klucze API i tokeny nie trafiają do konfiguracji jako jawny tekst:

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

Jawne wartości tekstowe nadal działają. Ref szablonów env, takie jak `${MCP_SERVER_API_KEY}`, oraz obiekty SecretRef są rozwiązywane podczas aktywacji Gateway przed uruchomieniem procesu serwera MCP. Tak jak w przypadku innych powierzchni SecretRef, nierozwiązane ref blokują aktywację tylko wtedy, gdy plugin `acpx` jest efektywnie aktywny.

## Materiał auth SSH sandboxa

Główny backend sandboxa `ssh` również obsługuje SecretRef dla materiału auth SSH:

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

- OpenClaw rozwiązuje te ref podczas aktywacji sandboxa, a nie leniwie przy każdym wywołaniu SSH.
- Rozstrzygnięte wartości są zapisywane do plików tymczasowych z restrykcyjnymi uprawnieniami i używane w wygenerowanej konfiguracji SSH.
- Jeśli efektywnym backendem sandboxa nie jest `ssh`, te ref pozostają nieaktywne i nie blokują startu.

## Obsługiwana powierzchnia poświadczeń

Kanoniczna lista obsługiwanych i nieobsługiwanych poświadczeń znajduje się w:

- [Powierzchnia poświadczeń SecretRef](/pl/reference/secretref-credential-surface)

<Note>
Poświadczenia generowane w runtime lub rotujące oraz materiał do odświeżania OAuth są celowo wykluczone z rozwiązywania SecretRef tylko do odczytu.
</Note>

## Wymagane zachowanie i pierwszeństwo

- Pole bez ref: bez zmian.
- Pole z ref: wymagane na aktywnych powierzchniach podczas aktywacji.
- Jeśli obecne są jednocześnie jawny tekst i ref, ref ma pierwszeństwo na obsługiwanych ścieżkach pierwszeństwa.
- Sentinel redakcji `__OPENCLAW_REDACTED__` jest zarezerwowany do wewnętrznej redakcji/przywracania konfiguracji i jest odrzucany jako dosłownie przesłane dane konfiguracji.

Sygnały ostrzegawcze i audytowe:

- `SECRETS_REF_OVERRIDES_PLAINTEXT` (ostrzeżenie runtime)
- `REF_SHADOWED` (ustalenie audytu, gdy poświadczenia z `auth-profiles.json` mają pierwszeństwo nad ref w `openclaw.json`)

Zachowanie zgodności z Google Chat:

- `serviceAccountRef` ma pierwszeństwo nad jawnym `serviceAccount`.
- Wartość jawna jest ignorowana, gdy ustawiony jest sąsiedni ref.

## Wyzwalacze aktywacji

Aktywacja sekretów uruchamia się przy:

- Starcie (preflight plus końcowa aktywacja)
- Ścieżce hot-apply reloadu konfiguracji
- Ścieżce restart-check reloadu konfiguracji
- Ręcznym reloadzie przez `secrets.reload`
- Preflight RPC zapisu konfiguracji Gateway (`config.set` / `config.apply` / `config.patch`) dla rozwiązywalności SecretRef aktywnych powierzchni w przesłanym payloadzie konfiguracji przed zapisaniem zmian

Kontrakt aktywacji:

- Sukces podmienia snapshot atomowo.
- Błąd przy starcie przerywa uruchamianie Gateway.
- Błąd reloadu runtime zachowuje snapshot last-known-good.
- Błąd preflight Write-RPC odrzuca przesłaną konfigurację i pozostawia bez zmian zarówno konfigurację na dysku, jak i aktywny snapshot runtime.
- Podanie jawnego tokenu kanału per wywołanie do pomocnika/narzędzia wychodzącego nie wyzwala aktywacji SecretRef; punktami aktywacji pozostają start, reload i jawne `secrets.reload`.

## Sygnały stanu degraded i recovered

Gdy aktywacja przy reloadzie kończy się błędem po wcześniejszym zdrowym stanie, OpenClaw przechodzi w stan degraded secrets.

Jednorazowe kody zdarzeń systemowych i logów:

- `SECRETS_RELOADER_DEGRADED`
- `SECRETS_RELOADER_RECOVERED`

Zachowanie:

- Degraded: runtime zachowuje snapshot last-known-good.
- Recovered: emitowane raz po następnej pomyślnej aktywacji.
- Powtarzające się błędy w stanie już degraded logują ostrzeżenia, ale nie spamują zdarzeniami.
- Fail-fast przy starcie nie emituje zdarzeń degraded, ponieważ runtime nigdy nie stał się aktywny.

## Rozwiązywanie na ścieżce poleceń

Ścieżki poleceń mogą opcjonalnie korzystać z obsługiwanego rozwiązywania SecretRef przez RPC snapshotu Gateway.

Istnieją dwa szerokie zachowania:

<Tabs>
  <Tab title="Ścisłe ścieżki poleceń">
    Na przykład zdalne ścieżki pamięci `openclaw memory` oraz `openclaw qr --remote`, gdy potrzebują zdalnych ref współdzielonego sekretu. Odczytują z aktywnego snapshotu i kończą się szybkim błędem, gdy wymagany SecretRef jest niedostępny.
  </Tab>
  <Tab title="Ścieżki poleceń tylko do odczytu">
    Na przykład `openclaw status`, `openclaw status --all`, `openclaw channels status`, `openclaw channels resolve`, `openclaw security audit` oraz przepływy naprawy doctor/config tylko do odczytu. One również preferują aktywny snapshot, ale przechodzą w tryb degraded zamiast przerywać, gdy docelowy SecretRef jest niedostępny w tej ścieżce polecenia.

    Zachowanie tylko do odczytu:

    - Gdy Gateway działa, te polecenia najpierw odczytują z aktywnego snapshotu.
    - Jeśli rozwiązywanie przez Gateway jest niekompletne albo Gateway jest niedostępny, próbują ukierunkowanego lokalnego fallbacku dla konkretnej powierzchni polecenia.
    - Jeśli docelowy SecretRef nadal jest niedostępny, polecenie kontynuuje z wynikiem only-read degraded i jawną diagnostyką, taką jak „configured but unavailable in this command path”.
    - To zachowanie degraded jest lokalne dla polecenia. Nie osłabia startu runtime, reloadu ani ścieżek send/auth.

  </Tab>
</Tabs>

Inne uwagi:

- Odświeżanie snapshotu po rotacji sekretów w backendzie obsługuje `openclaw secrets reload`.
- Metoda RPC Gateway używana przez te ścieżki poleceń: `secrets.resolve`.

## Przepływ audytu i konfiguracji

Domyślny przepływ operatora:

<Steps>
  <Step title="Przeprowadź audyt bieżącego stanu">
    ```bash
    openclaw secrets audit --check
    ```
  </Step>
  <Step title="Skonfiguruj SecretRef">
    ```bash
    openclaw secrets configure
    ```
  </Step>
  <Step title="Wykonaj ponowny audyt">
    ```bash
    openclaw secrets audit --check
    ```
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="secrets audit">
    Ustalenia obejmują:

    - wartości jawnego tekstu w spoczynku (`openclaw.json`, `auth-profiles.json`, `.env` oraz wygenerowane `agents/*/agent/models.json`)
    - pozostałości wrażliwych nagłówków providera w jawnym tekście w wygenerowanych wpisach `models.json`
    - nierozwiązane ref
    - zacienianie przez pierwszeństwo (`auth-profiles.json` mające priorytet nad ref w `openclaw.json`)
    - starsze pozostałości (`auth.json`, przypomnienia OAuth)

    Uwaga dotycząca exec:

    - Domyślnie audyt pomija kontrole rozwiązywalności SecretRef exec, aby uniknąć skutków ubocznych poleceń.
    - Użyj `openclaw secrets audit --allow-exec`, aby uruchamiać providerów exec podczas audytu.

    Uwaga dotycząca pozostałości nagłówków:

    - Wykrywanie wrażliwych nagłówków providera opiera się na heurystyce nazw (typowe nazwy i fragmenty nagłówków auth/poświadczeń, takie jak `authorization`, `x-api-key`, `token`, `secret`, `password` i `credential`).

  </Accordion>
  <Accordion title="secrets configure">
    Interaktywny pomocnik, który:

    - najpierw konfiguruje `secrets.providers` (`env`/`file`/`exec`, dodawanie/edycja/usuwanie)
    - pozwala wybrać obsługiwane pola zawierające sekrety w `openclaw.json` oraz `auth-profiles.json` dla jednego zakresu agenta
    - może utworzyć nowe mapowanie `auth-profiles.json` bezpośrednio w selektorze celu
    - zbiera szczegóły SecretRef (`source`, `provider`, `id`)
    - uruchamia rozwiązywanie preflight
    - może zastosować zmiany natychmiast

    Uwaga dotycząca exec:

    - Preflight pomija kontrole SecretRef exec, chyba że ustawiono `--allow-exec`.
    - Jeśli stosujesz zmiany bezpośrednio przez `configure --apply`, a plan zawiera ref/providerów exec, pozostaw ustawione `--allow-exec` także dla kroku apply.

    Przydatne tryby:

    - `openclaw secrets configure --providers-only`
    - `openclaw secrets configure --skip-provider-setup`
    - `openclaw secrets configure --agent <id>`

    Domyślne ustawienia apply w `configure`:

    - czyszczenie pasujących statycznych poświadczeń z `auth-profiles.json` dla wskazanych providerów
    - czyszczenie starszych statycznych wpisów `api_key` z `auth.json`
    - czyszczenie pasujących znanych linii sekretów z `<config-dir>/.env`

  </Accordion>
  <Accordion title="secrets apply">
    Zastosuj zapisany plan:

    ```bash
    openclaw secrets apply --from /tmp/openclaw-secrets-plan.json
    openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --allow-exec
    openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run
    openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run --allow-exec
    ```

    Uwaga dotycząca exec:

    - dry-run pomija kontrole exec, chyba że ustawiono `--allow-exec`.
    - tryb zapisu odrzuca plany zawierające SecretRef/providerów exec, chyba że ustawiono `--allow-exec`.

    Szczegóły ścisłego kontraktu target/path i dokładnych reguł odrzucania znajdziesz w [Kontrakt planu apply sekretów](/pl/gateway/secrets-plan-contract).

  </Accordion>
</AccordionGroup>

## Jednokierunkowa polityka bezpieczeństwa

<Warning>
OpenClaw celowo nie zapisuje kopii zapasowych rollback zawierających historyczne wartości sekretów w jawnym tekście.
</Warning>

Model bezpieczeństwa:

- preflight musi się powieść przed trybem zapisu
- aktywacja runtime jest walidowana przed commitem
- apply aktualizuje pliki za pomocą atomowej podmiany pliku i best-effort przywracania po błędzie

## Uwagi o zgodności ze starszym auth

Dla statycznych poświadczeń runtime nie zależy już od starszego przechowywania auth w jawnym tekście.

- Źródłem poświadczeń runtime jest rozstrzygnięty snapshot w pamięci.
- Starsze statyczne wpisy `api_key` są czyszczone po wykryciu.
- Zachowanie zgodności związane z OAuth pozostaje oddzielne.

## Uwaga o interfejsie Web

Niektóre unie SecretInput łatwiej konfiguruje się w trybie edytora raw niż w trybie formularza.

## Powiązane

- [Authentication](/pl/gateway/authentication) — konfiguracja auth
- [CLI: secrets](/pl/cli/secrets) — polecenia CLI
- [Zmienne środowiskowe](/pl/help/environment) — pierwszeństwo środowiska
- [Powierzchnia poświadczeń SecretRef](/pl/reference/secretref-credential-surface) — powierzchnia poświadczeń
- [Kontrakt planu apply sekretów](/pl/gateway/secrets-plan-contract) — szczegóły kontraktu planu
- [Security](/pl/gateway/security) — postawa bezpieczeństwa
