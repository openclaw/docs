---
read_when:
    - Konfigurowanie SecretRefs dla danych uwierzytelniających dostawcy i odwołań `auth-profiles.json`
    - Bezpieczna obsługa ponownego ładowania, audytu, konfiguracji i stosowania sekretów w produkcji
    - Zrozumienie zachowania fail-fast przy uruchamianiu, filtrowania nieaktywnych powierzchni i mechanizmu ostatniego znanego dobrego stanu
sidebarTitle: Secrets management
summary: 'Zarządzanie sekretami: kontrakt SecretRef, zachowanie migawki środowiska uruchomieniowego i bezpieczne jednokierunkowe oczyszczanie'
title: Zarządzanie sekretami
x-i18n:
    generated_at: "2026-06-27T17:37:50Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6d90346b1e4abc39cf1ab314c242f0b976aa83ee06f6dfeb787aafb19fa90de9
    source_path: gateway/secrets.md
    workflow: 16
---

OpenClaw obsługuje addytywne SecretRefs, dzięki czemu obsługiwane poświadczenia nie muszą być przechowywane w konfiguracji jako zwykły tekst.

<Note>
Zwykły tekst nadal działa. SecretRefs są włączane osobno dla każdego poświadczenia.
</Note>

<Warning>
Poświadczenia w zwykłym tekście pozostają czytelne dla agenta, jeśli są zapisane w plikach, które
agent może sprawdzić, w tym `openclaw.json`, `auth-profiles.json`, `.env` lub
wygenerowanych plikach `agents/*/agent/models.json`. SecretRefs zmniejszają ten lokalny promień
oddziaływania dopiero po migracji każdego obsługiwanego poświadczenia oraz gdy
`openclaw secrets audit --check` nie zgłasza żadnych pozostałości sekretów w zwykłym tekście.
</Warning>

## Cele i model runtime

Sekrety są rozwiązywane do przechowywanej w pamięci migawki runtime.

- Rozwiązywanie odbywa się zachłannie podczas aktywacji, a nie leniwie na ścieżkach żądań.
- Uruchamianie kończy się szybko błędem, gdy faktycznie aktywnego SecretRef nie można rozwiązać.
- Ponowne ładowanie używa atomowej podmiany: pełny sukces albo zachowanie ostatniej znanej dobrej migawki.
- Naruszenia zasad SecretRef (na przykład profile uwierzytelniania w trybie OAuth połączone z wejściem SecretRef) przerywają aktywację przed podmianą runtime.
- Żądania runtime czytają wyłącznie z aktywnej migawki w pamięci.
- Po pierwszej udanej aktywacji/wczytaniu konfiguracji ścieżki kodu runtime nadal czytają tę aktywną migawkę w pamięci, dopóki udane ponowne ładowanie jej nie podmieni.
- Ścieżki dostarczania wychodzącego również czytają z tej aktywnej migawki (na przykład dostarczanie odpowiedzi/wątków Discord i wysyłanie akcji Telegram); nie rozwiązują ponownie SecretRefs przy każdym wysłaniu.

Dzięki temu awarie dostawców sekretów pozostają poza gorącymi ścieżkami żądań.

## Granica dostępu agenta

SecretRefs chronią poświadczenia przed utrwalaniem w obsługiwanej konfiguracji i
wygenerowanych powierzchniach modeli, ale nie są granicą izolacji procesu. Jeśli
poświadczenie w zwykłym tekście pozostaje na dysku w ścieżce, którą agent może odczytać, agent może
ominąć redakcję na poziomie API, używając narzędzi plikowych lub powłoki do sprawdzenia tego pliku.

W przypadku wdrożeń produkcyjnych, w których pliki dostępne dla agenta są objęte zakresem, traktuj
migrację SecretRef jako ukończoną tylko wtedy, gdy spełnione są wszystkie poniższe warunki:

- obsługiwane poświadczenia używają SecretRefs zamiast wartości w zwykłym tekście
- pozostałości starszego zwykłego tekstu zostały usunięte z `openclaw.json`,
  `auth-profiles.json`, `.env` oraz wygenerowanych plików `models.json`
- `openclaw secrets audit --check` jest czysty po migracji
- wszelkie pozostałe nieobsługiwane lub rotowane poświadczenia są chronione przez izolację
  systemu operacyjnego, izolację kontenera albo zewnętrzny proxy poświadczeń

Dlatego przepływ audit/configure/apply jest bramą migracji bezpieczeństwa, a nie
tylko pomocnikiem wygody.

<Warning>
SecretRefs nie sprawiają, że dowolne czytelne pliki stają się bezpieczne. Kopie zapasowe, skopiowane konfiguracje,
stare wygenerowane katalogi modeli i nieobsługiwane klasy poświadczeń muszą być traktowane
jak sekrety produkcyjne, dopóki nie zostaną usunięte, przeniesione poza granicę zaufania agenta
albo zabezpieczone osobną warstwą izolacji.
</Warning>

## Filtrowanie aktywnych powierzchni

SecretRefs są walidowane tylko na faktycznie aktywnych powierzchniach.

- Włączone powierzchnie: nierozwiązane refs blokują uruchomienie/ponowne ładowanie.
- Nieaktywne powierzchnie: nierozwiązane refs nie blokują uruchomienia/ponownego ładowania.
- Nieaktywne refs emitują niekrytyczne diagnostyki z kodem `SECRETS_REF_IGNORED_INACTIVE_SURFACE`.

<AccordionGroup>
  <Accordion title="Przykłady nieaktywnych powierzchni">
    - Wyłączone wpisy kanału/konta.
    - Poświadczenia kanału najwyższego poziomu, których nie dziedziczy żadne włączone konto.
    - Wyłączone powierzchnie narzędzi/funkcji.
    - Klucze specyficzne dla dostawcy wyszukiwania w sieci, które nie zostały wybrane przez `tools.web.search.provider`. W trybie automatycznym (bez ustawionego dostawcy) klucze są sprawdzane według priorytetu na potrzeby automatycznego wykrywania dostawcy, aż jeden zostanie rozwiązany. Po wyborze klucze niewybranego dostawcy są traktowane jako nieaktywne, dopóki nie zostaną wybrane.
    - Materiał uwierzytelniania SSH sandboxa (`agents.defaults.sandbox.ssh.identityData`, `certificateData`, `knownHostsData` oraz nadpisania dla poszczególnych agentów) jest aktywny tylko wtedy, gdy efektywny backend sandboxa to `ssh` dla domyślnego agenta lub włączonego agenta.
    - SecretRefs `gateway.remote.token` / `gateway.remote.password` są aktywne, jeśli spełniony jest jeden z tych warunków:
      - `gateway.mode=remote`
      - skonfigurowano `gateway.remote.url`
      - `gateway.tailscale.mode` ma wartość `serve` lub `funnel`
      - W trybie lokalnym bez tych zdalnych powierzchni:
        - `gateway.remote.token` jest aktywny, gdy uwierzytelnianie tokenem może wygrać i nie skonfigurowano tokena z env/auth.
        - `gateway.remote.password` jest aktywny tylko wtedy, gdy uwierzytelnianie hasłem może wygrać i nie skonfigurowano hasła z env/auth.
    - SecretRef `gateway.auth.token` jest nieaktywny dla rozwiązywania uwierzytelniania podczas uruchamiania, gdy ustawiono `OPENCLAW_GATEWAY_TOKEN`, ponieważ wejście tokena z env wygrywa dla tego runtime.

  </Accordion>
</AccordionGroup>

## Diagnostyka powierzchni uwierzytelniania Gateway

Gdy SecretRef jest skonfigurowany w `gateway.auth.token`, `gateway.auth.password`, `gateway.remote.token` lub `gateway.remote.password`, uruchomienie/ponowne ładowanie Gateway jawnie loguje stan powierzchni:

- `active`: SecretRef jest częścią efektywnej powierzchni uwierzytelniania i musi zostać rozwiązany.
- `inactive`: SecretRef jest ignorowany dla tego runtime, ponieważ wygrywa inna powierzchnia uwierzytelniania albo zdalne uwierzytelnianie jest wyłączone/nieaktywne.

Te wpisy są logowane z `SECRETS_GATEWAY_AUTH_SURFACE` i zawierają powód użyty przez zasadę aktywnej powierzchni, dzięki czemu można zobaczyć, dlaczego poświadczenie potraktowano jako aktywne lub nieaktywne.

## Preflight odniesienia podczas onboardingu

Gdy onboarding działa w trybie interaktywnym i wybierzesz przechowywanie SecretRef, OpenClaw uruchamia walidację preflight przed zapisaniem:

- Env refs: waliduje nazwę zmiennej env i potwierdza, że podczas konfiguracji widoczna jest niepusta wartość.
- Provider refs (`file` lub `exec`): waliduje wybór dostawcy, rozwiązuje `id` i sprawdza typ rozwiązanej wartości.
- Ścieżka ponownego użycia Quickstart: gdy `gateway.auth.token` jest już SecretRef, onboarding rozwiązuje go przed bootstrapem probe/dashboard (dla refs `env`, `file` i `exec`) przy użyciu tej samej bramy szybkiego błędu.

Jeśli walidacja się nie powiedzie, onboarding pokazuje błąd i pozwala spróbować ponownie.

## Kontrakt SecretRef

Używaj jednego kształtu obiektu wszędzie:

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

<Tabs>
  <Tab title="env">
    ```json5
    { source: "env", provider: "default", id: "OPENAI_API_KEY" }
    ```

    Obsługiwane pola SecretInput akceptują także dokładne skróty tekstowe:

    ```json5
    "${OPENAI_API_KEY}"
    "$OPENAI_API_KEY"
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
    { source: "exec", provider: "vault", id: "providers/openai/apiKey#value" }
    ```

    Walidacja:

    - `provider` musi pasować do `^[a-z][a-z0-9_-]{0,63}$`
    - `id` musi pasować do `^[A-Za-z0-9][A-Za-z0-9._:/#-]{0,255}$` (obsługuje selektory takie jak `secret#json_key`)
    - `id` nie może zawierać `.` ani `..` jako segmentów ścieżki rozdzielanych ukośnikami (na przykład `a/../b` jest odrzucane)

  </Tab>
</Tabs>

## Konfiguracja dostawcy

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
      "team-secrets": {
        source: "exec",
        pluginIntegration: {
          pluginId: "acme-secrets",
          integrationId: "secret-store",
        },
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
    - Brakujące/puste wartości env powodują błąd rozwiązywania.

  </Accordion>
  <Accordion title="Dostawca plikowy">
    - Odczytuje lokalny plik z `path`.
    - `mode: "json"` oczekuje ładunku obiektu JSON i rozwiązuje `id` jako wskaźnik.
    - `mode: "singleValue"` oczekuje id ref `"value"` i zwraca zawartość pliku.
    - Ścieżka musi przejść sprawdzenia własności/uprawnień.
    - Uwaga o fail-closed w Windows: jeśli weryfikacja ACL jest niedostępna dla ścieżki, rozwiązywanie kończy się błędem. Tylko dla zaufanych ścieżek ustaw `allowInsecurePath: true` u tego dostawcy, aby pominąć sprawdzenia bezpieczeństwa ścieżki.

  </Accordion>
  <Accordion title="Dostawca exec">
    - Uruchamia skonfigurowaną bezwzględną ścieżkę binarną, bez powłoki.
    - Domyślnie `command` musi wskazywać zwykły plik (nie symlink).
    - Ustaw `allowSymlinkCommand: true`, aby zezwolić na ścieżki poleceń będące symlinkami (na przykład shimy Homebrew). OpenClaw waliduje rozwiązaną ścieżkę docelową.
    - Połącz `allowSymlinkCommand` z `trustedDirs` dla ścieżek menedżerów pakietów (na przykład `["/opt/homebrew"]`).
    - Obsługuje timeout, timeout braku wyjścia, limity bajtów wyjścia, listę dozwolonych env i zaufane katalogi.
    - Uwaga o fail-closed w Windows: jeśli weryfikacja ACL jest niedostępna dla ścieżki polecenia, rozwiązywanie kończy się błędem. Tylko dla zaufanych ścieżek ustaw `allowInsecurePath: true` u tego dostawcy, aby pominąć sprawdzenia bezpieczeństwa ścieżki.
    - Dostawcy exec zarządzani przez Plugin mogą używać `pluginIntegration` zamiast
      skopiowanych `command`/`args`. OpenClaw rozwiązuje bieżące szczegóły polecenia
      z manifestu zainstalowanego Plugin podczas uruchamiania/ponownego ładowania. Jeśli Plugin jest
      wyłączony, usunięty, niezaufany albo nie deklaruje już integracji,
      aktywne SecretRefs używające tego dostawcy fail closed.

    Ładunek żądania (stdin):

    ```json
    { "protocolVersion": 1, "provider": "vault", "ids": ["providers/openai/apiKey"] }
    ```

    Ładunek odpowiedzi (stdout):

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

  </Accordion>
</AccordionGroup>

## Klucze API oparte na pliku

Nie umieszczaj ciągów `file:...` w bloku konfiguracji `env`. Blok `env` jest
literalny i nienadpisujący, więc `file:...` nie jest rozwiązywane.

Zamiast tego użyj plikowego SecretRef w obsługiwanym polu poświadczenia:

```json5
{
  secrets: {
    providers: {
      xai_key_file: {
        source: "file",
        path: "~/.openclaw/secrets/xai-api-key.txt",
        mode: "singleValue",
      },
    },
  },
  models: {
    providers: {
      xai: {
        apiKey: { source: "file", provider: "xai_key_file", id: "value" },
      },
    },
  },
}
```

Dla `mode: "singleValue"` `id` SecretRef to `"value"`. Dla
`mode: "json"` użyj bezwzględnego wskaźnika JSON, takiego jak
`"/providers/xai/apiKey"`.

Zobacz [Powierzchnia poświadczeń SecretRef](/pl/reference/secretref-credential-surface), aby poznać
pola konfiguracji akceptujące SecretRefs.

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
  <Accordion title="Bitwarden Secrets Manager (`bws`)">
    Użyj opakowania resolvera, gdy chcesz mapować identyfikatory SecretRef na klucze elementów Bitwarden
    Secrets Manager. Repozytorium zawiera
    `scripts/secrets/openclaw-bws-resolver.mjs`; zainstaluj lub skopiuj go do bezwzględnej,
    zaufanej ścieżki na hoście, który uruchamia Gateway.

    Wymagania:

    - CLI Bitwarden Secrets Manager (`bws`) zainstalowany na hoście Gateway.
    - `BWS_ACCESS_TOKEN` dostępny dla usługi Gateway.
    - `PATH` przekazane do resolvera albo `BWS_BIN` ustawione na bezwzględną ścieżkę
      binarną `bws`.
    - `BWS_SERVER_URL` musi być ustawione w środowisku podczas używania samodzielnie hostowanej
      instancji Bitwarden.

    ```json5
    {
      secrets: {
        providers: {
          bws: {
            source: "exec",
            command: "/usr/local/bin/openclaw-bws-resolver.mjs",
            passEnv: ["BWS_ACCESS_TOKEN", "BWS_SERVER_URL", "PATH", "BWS_BIN"],
            jsonOnly: true,
          },
        },
      },
      models: {
        providers: {
          openai: {
            baseUrl: "https://api.openai.com/v1",
            models: [{ id: "gpt-5", name: "gpt-5" }],
            apiKey: {
              source: "exec",
              provider: "bws",
              id: "openclaw/providers/openai/apiKey",
            },
          },
        },
      },
    }
    ```

    Resolver grupuje żądane identyfikatory, uruchamia `bws secret list` i zwraca
    wartości dla pasujących pól `key` sekretów. Używaj kluczy spełniających kontrakt
    identyfikatora SecretRef exec, takich jak `openclaw/providers/openai/apiKey`; klucze
    w stylu zmiennych środowiskowych z podkreśleniami są odrzucane przed uruchomieniem resolvera. Jeśli więcej
    niż jeden widoczny sekret Bitwarden ma ten sam żądany klucz, resolver
    oznacza ten identyfikator jako niejednoznaczny zamiast wybierać jeden. Po zaktualizowaniu konfiguracji
    zweryfikuj ścieżkę resolvera:

    ```bash
    openclaw secrets audit --allow-exec
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
  <Accordion title="password-store (`pass`)">
    Użyj małego opakowania resolvera, gdy chcesz mapować identyfikatory SecretRef bezpośrednio na
    wpisy `pass`. Zapisz je jako plik wykonywalny pod bezwzględną ścieżką, która przechodzi
    kontrole ścieżek dostawcy exec, na przykład
    `/usr/local/bin/openclaw-pass-resolver`. Shebang `#!/usr/bin/env node`
    rozwiązuje `node` z `PATH` procesu resolvera, więc uwzględnij `PATH` w
    `passEnv`. Jeśli `pass` nie znajduje się w tym `PATH`, ustaw `PASS_BIN` w środowisku
    nadrzędnym i również uwzględnij go w `passEnv`:

    ```js
    #!/usr/bin/env node
    const { spawnSync } = require("node:child_process");

    let stdin = "";
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", (chunk) => {
      stdin += chunk;
    });
    process.stdin.on("error", (err) => {
      process.stderr.write(`${err.message}\n`);
      process.exit(1);
    });
    process.stdin.on("end", () => {
      let request;
      try {
        request = JSON.parse(stdin || "{}");
      } catch (err) {
        process.stderr.write(`Failed to parse request: ${err.message}\n`);
        process.exit(1);
      }

      const passBin = process.env.PASS_BIN || "pass";
      const values = {};
      const errors = {};

      for (const id of request.ids ?? []) {
        const result = spawnSync(passBin, ["show", id], { encoding: "utf8" });
        if (result.status === 0) {
          values[id] = result.stdout.split(/\r?\n/, 1)[0] ?? "";
        } else {
          errors[id] = { message: (result.stderr || `pass exited ${result.status}`).trim() };
        }
      }

      process.stdout.write(JSON.stringify({ protocolVersion: 1, values, errors }));
    });
    ```

    Następnie skonfiguruj dostawcę exec i wskaż `apiKey` na ścieżkę wpisu `pass`:

    ```json5
    {
      secrets: {
        providers: {
          pass_store: {
            source: "exec",
            command: "/usr/local/bin/openclaw-pass-resolver",
            passEnv: ["PATH", "HOME", "GNUPGHOME", "GPG_TTY", "PASSWORD_STORE_DIR", "PASS_BIN"],
            jsonOnly: true,
          },
        },
      },
      models: {
        providers: {
          openai: {
            baseUrl: "https://api.openai.com/v1",
            models: [{ id: "gpt-5", name: "gpt-5" }],
            apiKey: {
              source: "exec",
              provider: "pass_store",
              id: "openclaw/providers/openai/apiKey",
            },
          },
        },
      },
    }
    ```

    Przechowuj sekret w pierwszym wierszu wpisu `pass` albo dostosuj
    opakowanie, jeśli chcesz zamiast tego zwracać pełne wyjście `pass show`. Po
    zaktualizowaniu konfiguracji zweryfikuj zarówno statyczny audyt, jak i ścieżkę resolvera exec:

    ```bash
    openclaw secrets audit --check
    openclaw secrets audit --allow-exec
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

Zmienne środowiskowe serwera MCP skonfigurowane przez `plugins.entries.acpx.config.mcpServers` obsługują SecretInput. Dzięki temu klucze API i tokeny nie trafiają do konfiguracji w postaci zwykłego tekstu:

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

Wartości tekstowe nadal działają. Odwołania szablonów środowiskowych, takie jak `${MCP_SERVER_API_KEY}`, oraz obiekty SecretRef są rozwiązywane podczas aktywacji gateway przed uruchomieniem procesu serwera MCP. Podobnie jak w przypadku innych powierzchni SecretRef, nierozwiązane odwołania blokują aktywację tylko wtedy, gdy plugin `acpx` jest faktycznie aktywny.

## Materiał uwierzytelniający SSH sandboxa

Główny backend sandboxa `ssh` obsługuje również SecretRefs dla materiału uwierzytelniającego SSH:

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

Zachowanie w czasie działania:

- OpenClaw rozwiązuje te odwołania podczas aktywacji sandboxa, a nie leniwie przy każdym wywołaniu SSH.
- Rozwiązane wartości są zapisywane do plików tymczasowych z restrykcyjnymi uprawnieniami i używane w wygenerowanej konfiguracji SSH.
- Jeśli efektywny backend sandboxa nie jest `ssh`, te odwołania pozostają nieaktywne i nie blokują uruchamiania.

## Obsługiwana powierzchnia poświadczeń

Kanoniczne obsługiwane i nieobsługiwane poświadczenia są wymienione w:

- [Powierzchnia poświadczeń SecretRef](/pl/reference/secretref-credential-surface)

<Note>
Poświadczenia generowane w czasie działania lub rotowane oraz materiał odświeżania OAuth są celowo wyłączone z rozwiązywania SecretRef tylko do odczytu.
</Note>

## Wymagane zachowanie i pierwszeństwo

- Pole bez odwołania: bez zmian.
- Pole z odwołaniem: wymagane na aktywnych powierzchniach podczas aktywacji.
- Jeśli obecne są zarówno zwykły tekst, jak i odwołanie, odwołanie ma pierwszeństwo na obsługiwanych ścieżkach pierwszeństwa.
- Sentinel redakcji `__OPENCLAW_REDACTED__` jest zarezerwowany dla wewnętrznej redakcji/przywracania konfiguracji i jest odrzucany jako dosłowne przesłane dane konfiguracji.

Sygnały ostrzeżeń i audytu:

- `SECRETS_REF_OVERRIDES_PLAINTEXT` (ostrzeżenie w czasie działania)
- `REF_SHADOWED` (wynik audytu, gdy poświadczenia `auth-profiles.json` mają pierwszeństwo przed odwołaniami `openclaw.json`)

Zachowanie zgodności Google Chat:

- `serviceAccountRef` ma pierwszeństwo przed zwykłym tekstem `serviceAccount`.
- Wartość w postaci zwykłego tekstu jest ignorowana, gdy ustawione jest siostrzane odwołanie.

## Wyzwalacze aktywacji

Aktywacja sekretów uruchamia się przy:

- Uruchomieniu (kontrola wstępna oraz końcowa aktywacja)
- Ścieżce gorącego zastosowania przeładowania konfiguracji
- Ścieżce sprawdzenia restartu przy przeładowaniu konfiguracji
- Ręcznym przeładowaniu przez `secrets.reload`
- Kontroli wstępnej RPC zapisu konfiguracji Gateway (`config.set` / `config.apply` / `config.patch`) pod kątem rozwiązywalności SecretRef na aktywnej powierzchni w przesłanym ładunku konfiguracji przed utrwaleniem edycji

Kontrakt aktywacji:

- Sukces atomowo podmienia migawkę.
- Niepowodzenie uruchamiania przerywa uruchamianie gateway.
- Niepowodzenie przeładowania w czasie działania zachowuje ostatnią znaną dobrą migawkę.
- Niepowodzenie kontroli wstępnej write-RPC odrzuca przesłaną konfigurację i pozostawia zarówno konfigurację na dysku, jak i aktywną migawkę czasu działania bez zmian.
- Podanie jawnego tokenu kanału dla pojedynczego wywołania do wychodzącego pomocnika/narzędzia nie wyzwala aktywacji SecretRef; punktami aktywacji pozostają uruchamianie, przeładowanie i jawne `secrets.reload`.

## Sygnały degradacji i przywrócenia

Gdy aktywacja podczas przeładowania nie powiedzie się po zdrowym stanie, OpenClaw przechodzi w zdegradowany stan sekretów.

Jednorazowe zdarzenie systemowe i kody dziennika:

- `SECRETS_RELOADER_DEGRADED`
- `SECRETS_RELOADER_RECOVERED`

Zachowanie:

- Zdegradowany: runtime zachowuje ostatnią znaną dobrą migawkę.
- Przywrócony: emitowane raz po następnej udanej aktywacji.
- Powtarzające się niepowodzenia, gdy system jest już zdegradowany, zapisują ostrzeżenia, ale nie zalewają zdarzeniami.
- Szybkie przerwanie uruchamiania nie emituje zdarzeń degradacji, ponieważ runtime nigdy nie stał się aktywny.

## Rozwiązywanie ścieżek poleceń

Ścieżki poleceń mogą włączyć obsługiwane rozwiązywanie SecretRef przez RPC migawki Gateway.

Istnieją dwa ogólne zachowania:

<Tabs>
  <Tab title="Ścisłe ścieżki poleceń">
    Na przykład ścieżki zdalnej pamięci `openclaw memory` oraz `openclaw qr --remote`, gdy potrzebuje zdalnych odwołań do współdzielonego sekretu. Odczytują dane z aktywnej migawki i szybko kończą się błędem, gdy wymagany SecretRef jest niedostępny.
  </Tab>
  <Tab title="Ścieżki poleceń tylko do odczytu">
    Na przykład `openclaw status`, `openclaw status --all`, `openclaw channels status`, `openclaw channels resolve`, `openclaw security audit` oraz przepływy naprawy doctor/config tylko do odczytu. Również preferują aktywną migawkę, ale obniżają jakość działania zamiast przerywać, gdy docelowy SecretRef jest niedostępny w tej ścieżce polecenia.

    Zachowanie tylko do odczytu:

    - Gdy gateway działa, te polecenia najpierw odczytują z aktywnej migawki.
    - Jeśli rozwiązywanie przez gateway jest niekompletne albo gateway jest niedostępny, próbują docelowego lokalnego fallbacku dla konkretnej powierzchni polecenia.
    - Jeśli docelowy SecretRef nadal jest niedostępny, polecenie kontynuuje z obniżoną jakością wyniku tylko do odczytu i jawną diagnostyką, taką jak „skonfigurowano, ale niedostępne w tej ścieżce polecenia”.
    - To obniżone zachowanie jest wyłącznie lokalne dla polecenia. Nie osłabia uruchamiania runtime, przeładowania ani ścieżek wysyłania/auth.

  </Tab>
</Tabs>

Inne uwagi:

- Odświeżanie migawki po rotacji sekretu backendu obsługuje `openclaw secrets reload`.
- Metoda RPC Gateway używana przez te ścieżki poleceń: `secrets.resolve`.

## Przepływ audytu i konfiguracji

Domyślny przepływ operatora:

<Steps>
  <Step title="Przeprowadź audyt bieżącego stanu">
    ```bash
    openclaw secrets audit --check
    ```
  </Step>
  <Step title="Skonfiguruj i zastosuj SecretRefs">
    ```bash
    openclaw secrets configure --apply
    ```
  </Step>
  <Step title="Przeprowadź ponowny audyt">
    ```bash
    openclaw secrets audit --check
    ```
  </Step>
</Steps>

Nie traktuj migracji jako ukończonej, dopóki ponowny audyt nie jest czysty. Jeśli audyt
nadal zgłasza wartości plaintext w spoczynku, ryzyko dostępu agenta nadal istnieje,
nawet gdy API runtime zwracają wartości zredagowane.

Jeśli zapiszesz plan zamiast zastosować go podczas `configure`, zastosuj ten zapisany plan
za pomocą `openclaw secrets apply --from <plan-path>` przed ponownym audytem.

<AccordionGroup>
  <Accordion title="secrets audit">
    Ustalenia obejmują:

    - wartości plaintext w spoczynku (`openclaw.json`, `auth-profiles.json`, `.env` oraz wygenerowane `agents/*/agent/models.json`)
    - pozostałości wrażliwych nagłówków dostawcy plaintext w wygenerowanych wpisach `models.json`
    - nierozwiązane odwołania
    - przesłanianie priorytetem (`auth-profiles.json` ma priorytet nad odwołaniami z `openclaw.json`)
    - pozostałości legacy (`auth.json`, przypomnienia OAuth)

    Uwaga dotycząca exec:

    - Domyślnie audyt pomija sprawdzenia rozwiązywalności SecretRef exec, aby uniknąć skutków ubocznych poleceń.
    - Użyj `openclaw secrets audit --allow-exec`, aby wykonywać dostawców exec podczas audytu.

    Uwaga dotycząca pozostałości nagłówków:

    - Wykrywanie wrażliwych nagłówków dostawcy opiera się na heurystyce nazw (typowe nazwy i fragmenty nagłówków auth/credential, takie jak `authorization`, `x-api-key`, `token`, `secret`, `password` i `credential`).

  </Accordion>
  <Accordion title="secrets configure">
    Interaktywny pomocnik, który:

    - najpierw konfiguruje `secrets.providers` (`env`/`file`/`exec`, dodawanie/edycja/usuwanie)
    - pozwala wybrać obsługiwane pola zawierające sekrety w `openclaw.json` oraz `auth-profiles.json` dla jednego zakresu agenta
    - może utworzyć nowe mapowanie `auth-profiles.json` bezpośrednio w selektorze celu
    - przechwytuje szczegóły SecretRef (`source`, `provider`, `id`)
    - uruchamia rozwiązywanie preflight
    - może zastosować zmiany natychmiast

    Uwaga dotycząca exec:

    - Preflight pomija sprawdzenia SecretRef exec, chyba że ustawiono `--allow-exec`.
    - Jeśli stosujesz bezpośrednio z `configure --apply`, a plan obejmuje odwołania/dostawców exec, pozostaw `--allow-exec` ustawione także dla kroku apply.

    Przydatne tryby:

    - `openclaw secrets configure --providers-only`
    - `openclaw secrets configure --skip-provider-setup`
    - `openclaw secrets configure --agent <id>`

    Domyślne ustawienia apply dla `configure`:

    - usuwa pasujące statyczne poświadczenia z `auth-profiles.json` dla docelowych dostawców
    - usuwa statyczne wpisy legacy `api_key` z `auth.json`
    - usuwa pasujące znane linie sekretów z `<config-dir>/.env`

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

    - dry-run pomija sprawdzenia exec, chyba że ustawiono `--allow-exec`.
    - tryb zapisu odrzuca plany zawierające SecretRefs/dostawców exec, chyba że ustawiono `--allow-exec`.

    Szczegóły ścisłego kontraktu celu/ścieżki i dokładne reguły odrzucania znajdziesz w [Kontrakt planu Secrets Apply](/pl/gateway/secrets-plan-contract).

  </Accordion>
</AccordionGroup>

## Jednokierunkowa polityka bezpieczeństwa

<Warning>
OpenClaw celowo nie zapisuje kopii zapasowych wycofania zawierających historyczne wartości sekretów plaintext.
</Warning>

Model bezpieczeństwa:

- preflight musi zakończyć się powodzeniem przed trybem zapisu
- aktywacja runtime jest walidowana przed zatwierdzeniem
- apply aktualizuje pliki przy użyciu atomowej zamiany pliku i best-effort przywracania w razie niepowodzenia

## Uwagi dotyczące zgodności legacy auth

W przypadku statycznych poświadczeń runtime nie zależy już od magazynu legacy auth w postaci plaintext.

- Źródłem poświadczeń runtime jest rozwiązana migawka w pamięci.
- Statyczne wpisy legacy `api_key` są usuwane po wykryciu.
- Zachowanie zgodności związane z OAuth pozostaje oddzielne.

## Uwaga dotycząca Web UI

Niektóre unie SecretInput łatwiej skonfigurować w trybie surowego edytora niż w trybie formularza.

## Powiązane

- [Uwierzytelnianie](/pl/gateway/authentication) — konfiguracja auth
- [CLI: secrets](/pl/cli/secrets) — polecenia CLI
- [Zmienne środowiskowe](/pl/help/environment) — priorytet środowiska
- [Powierzchnia poświadczeń SecretRef](/pl/reference/secretref-credential-surface) — powierzchnia poświadczeń
- [Kontrakt planu Secrets Apply](/pl/gateway/secrets-plan-contract) — szczegóły kontraktu planu
- [Bezpieczeństwo](/pl/gateway/security) — postawa bezpieczeństwa
