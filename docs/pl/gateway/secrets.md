---
read_when:
    - Konfigurowanie SecretRefs dla poświadczeń dostawcy i odwołań `auth-profiles.json`
    - Bezpieczna obsługa ponownego wczytywania, audytu, konfiguracji i stosowania sekretów w produkcji
    - Zrozumienie szybkiego przerywania przy uruchamianiu, filtrowania nieaktywnych powierzchni i zachowania ostatniego znanego poprawnego stanu
sidebarTitle: Secrets management
summary: 'Zarządzanie sekretami: kontrakt SecretRef, zachowanie migawki środowiska wykonawczego i bezpieczne jednokierunkowe oczyszczanie'
title: Zarządzanie sekretami
x-i18n:
    generated_at: "2026-04-30T09:56:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: 96fddc346e21cab17d978843dc2a482c6faf8f810b3698a97aa88463133eaca5
    source_path: gateway/secrets.md
    workflow: 16
---

OpenClaw obsługuje addytywne SecretRefs, dzięki czemu obsługiwane dane uwierzytelniające nie muszą być przechowywane w konfiguracji jako tekst jawny.

<Note>
Tekst jawny nadal działa. SecretRefs są opcjonalne dla poszczególnych danych uwierzytelniających.
</Note>

## Cele i model środowiska uruchomieniowego

Sekrety są rozwiązywane do migawki środowiska uruchomieniowego w pamięci.

- Rozwiązywanie odbywa się eager podczas aktywacji, a nie lazy na ścieżkach żądań.
- Uruchamianie kończy się szybkim niepowodzeniem, gdy faktycznie aktywnego SecretRef nie można rozwiązać.
- Przeładowanie używa atomowej podmiany: pełny sukces albo zachowanie ostatniej znanej dobrej migawki.
- Naruszenia zasad SecretRef (na przykład profile uwierzytelniania w trybie OAuth połączone z danymi wejściowymi SecretRef) przerywają aktywację przed podmianą środowiska uruchomieniowego.
- Żądania środowiska uruchomieniowego odczytują wyłącznie aktywną migawkę w pamięci.
- Po pierwszej udanej aktywacji/wczytaniu konfiguracji ścieżki kodu środowiska uruchomieniowego nadal odczytują tę aktywną migawkę w pamięci, dopóki udane przeładowanie jej nie podmieni.
- Ścieżki dostarczania wychodzącego również odczytują tę aktywną migawkę (na przykład dostarczanie odpowiedzi/wątków Discord i wysyłki akcji Telegram); nie rozwiązują ponownie SecretRefs przy każdej wysyłce.

Dzięki temu awarie dostawcy sekretów nie trafiają na krytyczne ścieżki obsługi żądań.

## Filtrowanie aktywnej powierzchni

SecretRefs są weryfikowane tylko na faktycznie aktywnych powierzchniach.

- Włączone powierzchnie: nierozwiązane referencje blokują uruchomienie/przeładowanie.
- Nieaktywne powierzchnie: nierozwiązane referencje nie blokują uruchomienia/przeładowania.
- Nieaktywne referencje emitują niekrytyczne diagnostyki z kodem `SECRETS_REF_IGNORED_INACTIVE_SURFACE`.

<AccordionGroup>
  <Accordion title="Przykłady nieaktywnych powierzchni">
    - Wyłączone wpisy kanału/konta.
    - Dane uwierzytelniające kanału najwyższego poziomu, których nie dziedziczy żadne włączone konto.
    - Wyłączone powierzchnie narzędzi/funkcji.
    - Klucze specyficzne dla dostawcy wyszukiwania w sieci, które nie zostały wybrane przez `tools.web.search.provider`. W trybie automatycznym (dostawca nieustawiony) klucze są sprawdzane według priorytetu na potrzeby automatycznego wykrywania dostawcy, aż jeden zostanie rozwiązany. Po wyborze klucze niewybranego dostawcy są traktowane jako nieaktywne, dopóki nie zostaną wybrane.
    - Materiał uwierzytelniania SSH piaskownicy (`agents.defaults.sandbox.ssh.identityData`, `certificateData`, `knownHostsData` oraz nadpisania per agent) jest aktywny tylko wtedy, gdy faktyczny backend piaskownicy to `ssh` dla agenta domyślnego lub włączonego agenta.
    - SecretRefs `gateway.remote.token` / `gateway.remote.password` są aktywne, jeśli zachodzi jeden z tych warunków:
      - `gateway.mode=remote`
      - `gateway.remote.url` jest skonfigurowane
      - `gateway.tailscale.mode` ma wartość `serve` lub `funnel`
      - W trybie lokalnym bez tych zdalnych powierzchni:
        - `gateway.remote.token` jest aktywny, gdy uwierzytelnianie tokenem może wygrać i nie skonfigurowano tokena env/auth.
        - `gateway.remote.password` jest aktywny tylko wtedy, gdy uwierzytelnianie hasłem może wygrać i nie skonfigurowano hasła env/auth.
    - SecretRef `gateway.auth.token` jest nieaktywny dla rozwiązywania uwierzytelniania podczas uruchamiania, gdy ustawiono `OPENCLAW_GATEWAY_TOKEN`, ponieważ dane wejściowe tokena env wygrywają dla tego środowiska uruchomieniowego.

  </Accordion>
</AccordionGroup>

## Diagnostyka powierzchni uwierzytelniania Gateway

Gdy SecretRef jest skonfigurowany w `gateway.auth.token`, `gateway.auth.password`, `gateway.remote.token` lub `gateway.remote.password`, uruchamianie/przeładowanie Gateway jawnie loguje stan powierzchni:

- `active`: SecretRef jest częścią faktycznej powierzchni uwierzytelniania i musi zostać rozwiązany.
- `inactive`: SecretRef jest ignorowany w tym środowisku uruchomieniowym, ponieważ wygrywa inna powierzchnia uwierzytelniania albo zdalne uwierzytelnianie jest wyłączone/nieaktywne.

Te wpisy są logowane z `SECRETS_GATEWAY_AUTH_SURFACE` i zawierają przyczynę używaną przez zasadę aktywnej powierzchni, dzięki czemu widać, dlaczego dane uwierzytelniające potraktowano jako aktywne lub nieaktywne.

## Wstępna kontrola referencji podczas onboardingu

Gdy onboarding działa w trybie interaktywnym i wybierzesz przechowywanie SecretRef, OpenClaw wykonuje wstępną walidację przed zapisaniem:

- Referencje env: waliduje nazwę zmiennej env i potwierdza, że podczas konfiguracji widoczna jest niepusta wartość.
- Referencje dostawcy (`file` lub `exec`): waliduje wybór dostawcy, rozwiązuje `id` i sprawdza typ rozwiązanej wartości.
- Ścieżka ponownego użycia szybkiego startu: gdy `gateway.auth.token` jest już SecretRef, onboarding rozwiązuje go przed inicjalizacją sondy/panelu (dla referencji `env`, `file` i `exec`), używając tego samego mechanizmu szybkiego przerywania przy błędzie.

Jeśli walidacja się nie powiedzie, onboarding pokazuje błąd i pozwala spróbować ponownie.

## Kontrakt SecretRef

Używaj wszędzie jednego kształtu obiektu:

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
    - Escapowanie RFC6901 w segmentach: `~` => `~0`, `/` => `~1`

  </Tab>
  <Tab title="exec">
    ```json5
    { source: "exec", provider: "vault", id: "providers/openai/apiKey" }
    ```

    Walidacja:

    - `provider` musi pasować do `^[a-z][a-z0-9_-]{0,63}$`
    - `id` musi pasować do `^[A-Za-z0-9][A-Za-z0-9._:/-]{0,255}$`
    - `id` nie może zawierać `.` ani `..` jako segmentów ścieżki rozdzielonych ukośnikami (na przykład `a/../b` jest odrzucane)

  </Tab>
</Tabs>

## Konfiguracja dostawców

Zdefiniuj dostawców w `secrets.providers`:

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
  <Accordion title="Dostawca env">
    - Opcjonalna lista dozwolonych przez `allowlist`.
    - Brakujące lub puste wartości env powodują niepowodzenie rozwiązywania.

  </Accordion>
  <Accordion title="Dostawca file">
    - Odczytuje lokalny plik z `path`.
    - `mode: "json"` oczekuje ładunku obiektu JSON i rozwiązuje `id` jako wskaźnik.
    - `mode: "singleValue"` oczekuje identyfikatora referencji `"value"` i zwraca zawartość pliku.
    - Ścieżka musi przejść kontrole właściciela/uprawnień.
    - Uwaga dotycząca odmowy przy błędzie w Windows: jeśli weryfikacja ACL jest niedostępna dla ścieżki, rozwiązywanie kończy się niepowodzeniem. Tylko dla zaufanych ścieżek ustaw `allowInsecurePath: true` u tego dostawcy, aby pominąć kontrole bezpieczeństwa ścieżki.

  </Accordion>
  <Accordion title="Dostawca exec">
    - Uruchamia skonfigurowaną bezwzględną ścieżkę binarną, bez powłoki.
    - Domyślnie `command` musi wskazywać zwykły plik (nie dowiązanie symboliczne).
    - Ustaw `allowSymlinkCommand: true`, aby zezwolić na ścieżki poleceń będące dowiązaniami symbolicznymi (na przykład nakładki Homebrew). OpenClaw weryfikuje rozwiązaną ścieżkę docelową.
    - Połącz `allowSymlinkCommand` z `trustedDirs` dla ścieżek menedżera pakietów (na przykład `["/opt/homebrew"]`).
    - Obsługuje limit czasu, limit czasu bez wyjścia, limity bajtów wyjścia, listę dozwolonych env i zaufane katalogi.
    - Uwaga dotycząca odmowy przy błędzie w Windows: jeśli weryfikacja ACL jest niedostępna dla ścieżki polecenia, rozwiązywanie kończy się niepowodzeniem. Tylko dla zaufanych ścieżek ustaw `allowInsecurePath: true` u tego dostawcy, aby pominąć kontrole bezpieczeństwa ścieżki.

    Ładunek żądania (stdin):

    ```json
    { "protocolVersion": 1, "provider": "vault", "ids": ["providers/openai/apiKey"] }
    ```

    Ładunek odpowiedzi (stdout):

    ```jsonc
    { "protocolVersion": 1, "values": { "providers/openai/apiKey": "<openai-api-key>" } } // pragma: allowlist secret
    ```

    Opcjonalne błędy dla poszczególnych identyfikatorów:

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
  <Accordion title="1Password CLI">
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
  <Accordion title="HashiCorp Vault CLI">
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

Zmienne env serwera MCP skonfigurowane przez `plugins.entries.acpx.config.mcpServers` obsługują SecretInput. Dzięki temu klucze API i tokeny nie trafiają do konfiguracji w tekście jawnym:

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

Wartości tekstowe w tekście jawnym nadal działają. Referencje szablonów env, takie jak `${MCP_SERVER_API_KEY}`, oraz obiekty SecretRef są rozwiązywane podczas aktywacji Gateway, zanim proces serwera MCP zostanie uruchomiony. Tak jak w przypadku innych powierzchni SecretRef, nierozwiązane referencje blokują aktywację tylko wtedy, gdy plugin `acpx` jest faktycznie aktywny.

## Materiał uwierzytelniania SSH piaskownicy

Główny backend piaskownicy `ssh` również obsługuje SecretRefs dla materiału uwierzytelniania SSH:

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

Zachowanie środowiska uruchomieniowego:

- OpenClaw rozwiązuje te odwołania podczas aktywacji sandboxa, a nie leniwie przy każdym wywołaniu SSH.
- Rozwiązane wartości są zapisywane do plików tymczasowych z restrykcyjnymi uprawnieniami i używane w wygenerowanej konfiguracji SSH.
- Jeśli efektywnym backendem sandboxa nie jest `ssh`, te odwołania pozostają nieaktywne i nie blokują uruchamiania.

## Obsługiwany zakres poświadczeń

Kanoniczne obsługiwane i nieobsługiwane poświadczenia są wymienione w:

- [Zakres poświadczeń SecretRef](/pl/reference/secretref-credential-surface)

<Note>
Poświadczenia tworzone w środowisku wykonawczym lub rotowane oraz materiały odświeżania OAuth są celowo wyłączone z rozwiązywania SecretRef tylko do odczytu.
</Note>

## Wymagane zachowanie i kolejność pierwszeństwa

- Pole bez odwołania: bez zmian.
- Pole z odwołaniem: wymagane na aktywnych powierzchniach podczas aktywacji.
- Jeśli obecne są zarówno tekst jawny, jak i odwołanie, odwołanie ma pierwszeństwo na obsługiwanych ścieżkach pierwszeństwa.
- Sentinel redakcji `__OPENCLAW_REDACTED__` jest zarezerwowany do wewnętrznej redakcji/przywracania konfiguracji i jest odrzucany jako dosłowne przesłane dane konfiguracji.

Sygnały ostrzeżeń i audytu:

- `SECRETS_REF_OVERRIDES_PLAINTEXT` (ostrzeżenie środowiska wykonawczego)
- `REF_SHADOWED` (ustalenie audytu, gdy poświadczenia z `auth-profiles.json` mają pierwszeństwo przed odwołaniami z `openclaw.json`)

Zachowanie zgodności Google Chat:

- `serviceAccountRef` ma pierwszeństwo przed tekstem jawnym `serviceAccount`.
- Wartość tekstu jawnego jest ignorowana, gdy ustawione jest sąsiednie odwołanie.

## Wyzwalacze aktywacji

Aktywacja sekretów uruchamia się przy:

- Uruchomieniu (kontrola wstępna plus końcowa aktywacja)
- Ścieżce przeładowania konfiguracji z zastosowaniem na gorąco
- Ścieżce przeładowania konfiguracji ze sprawdzeniem restartu
- Ręcznym przeładowaniu przez `secrets.reload`
- Kontroli wstępnej RPC zapisu konfiguracji Gateway (`config.set` / `config.apply` / `config.patch`) pod kątem możliwości rozwiązania SecretRef z aktywnej powierzchni w przesłanym ładunku konfiguracji przed utrwaleniem edycji

Kontrakt aktywacji:

- Sukces atomowo podmienia migawkę.
- Błąd uruchamiania przerywa start gatewaya.
- Błąd przeładowania w środowisku wykonawczym zachowuje ostatnią znaną dobrą migawkę.
- Błąd kontroli wstępnej RPC zapisu odrzuca przesłaną konfigurację i pozostawia zarówno konfigurację na dysku, jak i aktywną migawkę środowiska wykonawczego bez zmian.
- Podanie jawnego tokenu kanału dla pojedynczego wywołania do wychodzącego wywołania pomocnika/narzędzia nie wyzwala aktywacji SecretRef; punktami aktywacji pozostają uruchomienie, przeładowanie i jawne `secrets.reload`.

## Sygnały degradacji i odzyskania

Gdy aktywacja podczas przeładowania nie powiedzie się po zdrowym stanie, OpenClaw przechodzi w zdegradowany stan sekretów.

Jednorazowe zdarzenie systemowe i kody dziennika:

- `SECRETS_RELOADER_DEGRADED`
- `SECRETS_RELOADER_RECOVERED`

Zachowanie:

- Zdegradowany: środowisko wykonawcze zachowuje ostatnią znaną dobrą migawkę.
- Odzyskany: emitowane raz po następnej udanej aktywacji.
- Powtarzające się błędy, gdy stan jest już zdegradowany, zapisują ostrzeżenia w dzienniku, ale nie zalewają zdarzeniami.
- Szybkie przerwanie uruchamiania nie emituje zdarzeń degradacji, ponieważ środowisko wykonawcze nigdy nie stało się aktywne.

## Rozwiązywanie ścieżki polecenia

Ścieżki poleceń mogą włączyć obsługiwane rozwiązywanie SecretRef przez RPC migawki Gateway.

Istnieją dwa szerokie zachowania:

<Tabs>
  <Tab title="Ścisłe ścieżki poleceń">
    Na przykład ścieżki zdalnej pamięci `openclaw memory` oraz `openclaw qr --remote`, gdy wymaga zdalnych odwołań do współdzielonego sekretu. Odczytują z aktywnej migawki i szybko kończą się błędem, gdy wymagany SecretRef jest niedostępny.
  </Tab>
  <Tab title="Ścieżki poleceń tylko do odczytu">
    Na przykład `openclaw status`, `openclaw status --all`, `openclaw channels status`, `openclaw channels resolve`, `openclaw security audit` oraz przepływy naprawy doctor/konfiguracji tylko do odczytu. One także preferują aktywną migawkę, ale degradują działanie zamiast przerywać, gdy docelowy SecretRef jest niedostępny w tej ścieżce polecenia.

    Zachowanie tylko do odczytu:

    - Gdy Gateway działa, te polecenia najpierw odczytują z aktywnej migawki.
    - Jeśli rozwiązywanie przez Gateway jest niekompletne albo Gateway jest niedostępny, próbują docelowego lokalnego mechanizmu awaryjnego dla konkretnej powierzchni polecenia.
    - Jeśli docelowy SecretRef nadal jest niedostępny, polecenie kontynuuje ze zdegradowanym wynikiem tylko do odczytu i jawną diagnostyką, taką jak „skonfigurowano, ale niedostępne w tej ścieżce polecenia”.
    - To zdegradowane zachowanie ma wyłącznie lokalny zakres polecenia. Nie osłabia ścieżek uruchamiania, przeładowania ani wysyłania/uwierzytelniania w środowisku wykonawczym.

  </Tab>
</Tabs>

Inne uwagi:

- Odświeżanie migawki po rotacji sekretu backendu obsługuje `openclaw secrets reload`.
- Metoda RPC Gateway używana przez te ścieżki poleceń: `secrets.resolve`.

## Przepływ audytu i konfiguracji

Domyślny przepływ operatora:

<Steps>
  <Step title="Audyt bieżącego stanu">
    ```bash
    openclaw secrets audit --check
    ```
  </Step>
  <Step title="Konfiguracja SecretRefs">
    ```bash
    openclaw secrets configure
    ```
  </Step>
  <Step title="Ponowny audyt">
    ```bash
    openclaw secrets audit --check
    ```
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="secrets audit">
    Ustalenia obejmują:

    - wartości w tekście jawnym zapisane w spoczynku (`openclaw.json`, `auth-profiles.json`, `.env` oraz wygenerowane `agents/*/agent/models.json`)
    - pozostałości wrażliwych nagłówków dostawców w tekście jawnym w wygenerowanych wpisach `models.json`
    - nierozwiązane odwołania
    - przesłanianie pierwszeństwa (`auth-profiles.json` mający priorytet przed odwołaniami z `openclaw.json`)
    - starsze pozostałości (`auth.json`, przypomnienia OAuth)

    Uwaga dotycząca exec:

    - Domyślnie audyt pomija kontrole możliwości rozwiązania SecretRef typu exec, aby uniknąć skutków ubocznych poleceń.
    - Użyj `openclaw secrets audit --allow-exec`, aby wykonywać dostawców exec podczas audytu.

    Uwaga dotycząca pozostałości nagłówków:

    - Wykrywanie wrażliwych nagłówków dostawców opiera się na heurystyce nazw (typowe nazwy i fragmenty nagłówków uwierzytelniania/poświadczeń, takie jak `authorization`, `x-api-key`, `token`, `secret`, `password` oraz `credential`).

  </Accordion>
  <Accordion title="secrets configure">
    Interaktywny pomocnik, który:

    - najpierw konfiguruje `secrets.providers` (`env`/`file`/`exec`, dodawanie/edycja/usuwanie)
    - pozwala wybrać obsługiwane pola zawierające sekrety w `openclaw.json` oraz `auth-profiles.json` dla jednego zakresu agenta
    - może utworzyć nowe mapowanie `auth-profiles.json` bezpośrednio w selektorze celu
    - przechwytuje szczegóły SecretRef (`source`, `provider`, `id`)
    - uruchamia kontrolę wstępną rozwiązywania
    - może zastosować zmiany natychmiast

    Uwaga dotycząca exec:

    - Kontrola wstępna pomija kontrole SecretRef typu exec, chyba że ustawiono `--allow-exec`.
    - Jeśli stosujesz bezpośrednio z `configure --apply`, a plan zawiera odwołania/dostawców exec, pozostaw `--allow-exec` ustawione także dla kroku apply.

    Pomocne tryby:

    - `openclaw secrets configure --providers-only`
    - `openclaw secrets configure --skip-provider-setup`
    - `openclaw secrets configure --agent <id>`

    Domyślne ustawienia zastosowania `configure`:

    - czyści pasujące statyczne poświadczenia z `auth-profiles.json` dla docelowych dostawców
    - czyści starsze statyczne wpisy `api_key` z `auth.json`
    - czyści pasujące znane linie sekretów z `<config-dir>/.env`

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
    - tryb zapisu odrzuca plany zawierające SecretRefs/dostawców exec, chyba że ustawiono `--allow-exec`.

    Szczegóły ścisłego kontraktu celu/ścieżki i dokładne reguły odrzucania znajdziesz w [Kontrakcie planu Secrets Apply](/pl/gateway/secrets-plan-contract).

  </Accordion>
</AccordionGroup>

## Jednokierunkowa polityka bezpieczeństwa

<Warning>
OpenClaw celowo nie zapisuje kopii zapasowych przywracania zawierających historyczne wartości sekretów w tekście jawnym.
</Warning>

Model bezpieczeństwa:

- kontrola wstępna musi zakończyć się powodzeniem przed trybem zapisu
- aktywacja w środowisku wykonawczym jest weryfikowana przed zatwierdzeniem
- apply aktualizuje pliki przy użyciu atomowej podmiany pliku i najlepszej możliwej próby przywrócenia po błędzie

## Uwagi dotyczące zgodności ze starszym uwierzytelnianiem

W przypadku statycznych poświadczeń środowisko wykonawcze nie zależy już od starszego magazynu uwierzytelniania w tekście jawnym.

- Źródłem poświadczeń środowiska wykonawczego jest rozwiązana migawka w pamięci.
- Starsze statyczne wpisy `api_key` są czyszczone po wykryciu.
- Zachowanie zgodności związane z OAuth pozostaje oddzielne.

## Uwaga dotycząca Web UI

Niektóre unie SecretInput łatwiej skonfigurować w trybie surowego edytora niż w trybie formularza.

## Powiązane

- [Uwierzytelnianie](/pl/gateway/authentication) — konfiguracja uwierzytelniania
- [CLI: secrets](/pl/cli/secrets) — polecenia CLI
- [Zmienne środowiskowe](/pl/help/environment) — pierwszeństwo środowiska
- [Zakres poświadczeń SecretRef](/pl/reference/secretref-credential-surface) — zakres poświadczeń
- [Kontrakt planu Secrets Apply](/pl/gateway/secrets-plan-contract) — szczegóły kontraktu planu
- [Bezpieczeństwo](/pl/gateway/security) — postawa bezpieczeństwa
