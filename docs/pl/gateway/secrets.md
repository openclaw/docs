---
read_when:
    - Konfigurowanie SecretRefs dla poświadczeń dostawcy i odwołań `auth-profiles.json`
    - Bezpieczne przeładowywanie, audytowanie, konfigurowanie i stosowanie sekretów w środowisku produkcyjnym
    - Omówienie szybkiego przerywania uruchamiania w razie błędu, filtrowania nieaktywnych powierzchni i działania ostatniej znanej poprawnej konfiguracji
sidebarTitle: Secrets management
summary: 'Zarządzanie sekretami: kontrakt SecretRef, zachowanie migawek środowiska wykonawczego i bezpieczne jednokierunkowe usuwanie danych wrażliwych'
title: Zarządzanie sekretami
x-i18n:
    generated_at: "2026-07-16T18:29:16Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 9fbcac081a7b9bd8bc298b9fb2b7437f3bea4dad85338eed7db4cb4db051cfc7
    source_path: gateway/secrets.md
    workflow: 16
---

OpenClaw obsługuje addytywne SecretRefs, dzięki czemu obsługiwane dane uwierzytelniające nie muszą być przechowywane w konfiguracji jako zwykły tekst.

<Note>
Zwykły tekst nadal działa. SecretRefs są opcjonalne dla każdego rodzaju danych uwierzytelniających.
</Note>

<Warning>
Dane uwierzytelniające w postaci zwykłego tekstu pozostają dostępne do odczytu przez agenta, jeśli znajdują się w plikach, które agent może przeglądać, w tym `openclaw.json`, `auth-profiles.json`, `.env` lub wygenerowanych plikach `agents/*/agent/models.json`. SecretRefs ograniczają ten lokalny zakres potencjalnych szkód dopiero po zmigrowaniu wszystkich obsługiwanych danych uwierzytelniających i gdy `openclaw secrets audit --check` nie zgłasza żadnych pozostałości zwykłego tekstu.
</Warning>

## Model środowiska uruchomieniowego

- Sekrety są rozwiązywane do migawki środowiska uruchomieniowego przechowywanej w pamięci — z wyprzedzeniem podczas aktywacji, a nie leniwie w ścieżkach żądań.
- Uruchamianie natychmiast kończy się niepowodzeniem, gdy nie można rozwiązać faktycznie aktywnego SecretRef.
- Ponowne wczytanie jest atomową zamianą: pełny sukces albo zachowanie ostatniej poprawnej migawki.
- Naruszenia zasad (na przykład profil uwierzytelniania w trybie OAuth połączony z danymi wejściowymi SecretRef) powodują niepowodzenie aktywacji przed zamianą migawki środowiska uruchomieniowego.
- Żądania środowiska uruchomieniowego odczytują wyłącznie aktywną migawkę w pamięci. Dane uwierzytelniające SecretRef dostawców modeli przechodzą przez magazyn uwierzytelniania i opcje strumienia jako lokalne dla procesu wartości zastępcze aż do wysłania. Ścieżki dostarczania wychodzącego (dostarczanie odpowiedzi i wątków w Discordzie oraz wysyłanie działań w Telegramie) również odczytują tę migawkę i nie rozwiązują ponownie odwołań przy każdym wysłaniu.

Dzięki temu awarie dostawców sekretów nie wpływają na intensywnie używane ścieżki żądań.

## Wstrzykiwanie podczas wysyłania (wartości zastępcze)

W przypadku danych uwierzytelniających dostawców modeli opartych na SecretRefs OpenClaw tworzy nieprzejrzystą, lokalną dla procesu wartość zastępczą podczas rozwiązywania uwierzytelniania modelu. Magazyn uwierzytelniania, opcje strumienia, konfiguracja SDK, dzienniki, obiekty błędów i większość mechanizmów introspekcji środowiska uruchomieniowego widzą więc wartość taką jak `oc-sent-v1-...`, a nie dane uwierzytelniające dostawcy. Chronione pobieranie modelu i zarządzane sondy kondycji lokalnego dostawcy zastępują znane wartości zastępcze w adresach URL i wartościach nagłówków bezpośrednio przed opuszczeniem procesu przez każde żądanie.

Nieznane wartości o formacie wartości zastępczej powodują bezpieczne przerwanie działania przed rozpoczęciem aktywności sieciowej. OpenClaw odmawia wysłania żądania zamiast przekazać dostawcy nierozwiązaną wartość zastępczą. Rozwiązane wartości sekretów są również rejestrowane na potrzeby redagowania ich dokładnych wartości w dziennikach jako dodatkowy mechanizm ochronny.

Adaptery dostawców korzystają z najpóźniejszego punktu wstrzykiwania obsługiwanego przez ich SDK:

- SDK z opcją niestandardowego pobierania otrzymują chronioną funkcję pobierania OpenClaw, dzięki czemu SDK zachowuje wartość zastępczą.
- SDK bez opcji niestandardowego pobierania odpakowują wartość zastępczą bezpośrednio przed utworzeniem klienta. Strumienie dostawców należące do pluginów i uprzęże agentów odpakowują ją w ostatnim punkcie przekazania należącym do rdzenia, ponieważ te transporty nie współdzielą chronionej funkcji pobierania OpenClaw.

Wartości zastępcze ograniczają ekspozycję zwykłego tekstu w całym łańcuchu wywołania modelu, ale nie zapewniają izolacji procesu. Rzeczywista wartość nadal istnieje w pamięci tego samego procesu i pojawia się na końcowej granicy adaptera. Dane uwierzytelniające w postaci zwykłego tekstu ze zmiennych środowiskowych, które nie są skonfigurowane za pomocą SecretRefs, pozostają zwykłym tekstem i nie są objęte tym mechanizmem.

Ustaw `OPENCLAW_SECRET_SENTINELS=off` (akceptowane są również `0` lub `false`, bez rozróżniania wielkości liter), aby wyłączyć tworzenie wartości zastępczych podczas reagowania na incydenty lub rozwiązywania problemów ze zgodnością. Wyłącznik awaryjny nie wyłącza rejestrowania dokładnych wartości na potrzeby redagowania.

## Granica dostępu agenta

SecretRefs zapobiegają utrwalaniu danych uwierzytelniających w konfiguracji i wygenerowanych plikach modeli, ale nie stanowią granicy izolacji procesu. Dane uwierzytelniające w postaci zwykłego tekstu pozostawione na dysku w ścieżce, którą agent może odczytać, nadal można odczytać za pomocą narzędzi plikowych lub powłoki, z pominięciem redagowania na poziomie API.

W przypadku wdrożeń produkcyjnych, w których uwzględnia się pliki dostępne dla agenta, migrację należy uznać za zakończoną tylko wtedy, gdy spełnione są wszystkie poniższe warunki:

- Obsługiwane dane uwierzytelniające używają SecretRefs zamiast wartości w postaci zwykłego tekstu.
- Pozostałości starszych danych w postaci zwykłego tekstu zostały usunięte z `openclaw.json`, `auth-profiles.json`, `.env` i wygenerowanych plików `models.json`.
- `openclaw secrets audit --check` nie wykazuje problemów po migracji.
- Wszelkie pozostałe nieobsługiwane lub rotowane dane uwierzytelniające są chronione przez izolację systemu operacyjnego, izolację kontenera albo zewnętrzny serwer proxy danych uwierzytelniających.

Dlatego przepływ audytu, konfiguracji i zastosowania stanowi zabezpieczenie migracji, a nie tylko wygodne narzędzie pomocnicze.

<Warning>
SecretRefs nie zapewniają bezpieczeństwa dowolnym plikom możliwym do odczytu. Kopie zapasowe, skopiowane konfiguracje, stare wygenerowane katalogi modeli i nieobsługiwane klasy danych uwierzytelniających pozostają sekretami produkcyjnymi, dopóki nie zostaną usunięte, przeniesione poza granicę zaufania agenta lub odizolowane osobno.
</Warning>

## Filtrowanie aktywnych powierzchni

SecretRefs są weryfikowane tylko na faktycznie aktywnych powierzchniach:

- **Włączone powierzchnie**: nierozwiązane odwołania blokują uruchamianie lub ponowne wczytanie.
- **Nieaktywne powierzchnie**: nierozwiązane odwołania nie blokują uruchamiania ani ponownego wczytania; generują niekrytyczny komunikat diagnostyczny `SECRETS_REF_IGNORED_INACTIVE_SURFACE`.

<Accordion title="Przykłady nieaktywnych powierzchni">
- Wyłączone wpisy kanałów lub kont.
- Dane uwierzytelniające kanału najwyższego poziomu, których nie dziedziczy żadne włączone konto.
- Wyłączone powierzchnie narzędzi lub funkcji.
- Klucze właściwe dla dostawców wyszukiwania internetowego, którzy nie zostali wybrani przez `tools.web.search.provider`. W trybie automatycznym (bez ustawionego dostawcy) klucze są sprawdzane zgodnie z kolejnością pierwszeństwa w celu automatycznego wykrycia, aż jeden z nich zostanie rozwiązany; po dokonaniu wyboru klucze niewybranych dostawców są nieaktywne.
- Materiały uwierzytelniające SSH piaskownicy (`agents.defaults.sandbox.ssh.identityData`, `certificateData`, `knownHostsData` oraz ustawienia zastępujące dla poszczególnych agentów) są aktywne tylko wtedy, gdy faktycznie używany backend piaskownicy to `ssh`, a tryb piaskownicy nie jest ustawiony na `off`, dla agenta domyślnego lub włączonego agenta.
- SecretRefs `gateway.remote.token` / `gateway.remote.password` są aktywne, jeśli zachodzi dowolny z poniższych warunków:
  - `gateway.mode=remote`
  - `gateway.remote.url` jest skonfigurowane
  - `gateway.tailscale.mode` ma wartość `serve` lub `funnel`
  - W trybie lokalnym bez tych powierzchni zdalnych: `gateway.remote.token` jest aktywne, gdy może zostać wybrane uwierzytelnianie tokenem i nie skonfigurowano tokenu środowiskowego ani uwierzytelniającego; `gateway.remote.password` jest aktywne tylko wtedy, gdy może zostać wybrane uwierzytelnianie hasłem i nie skonfigurowano hasła środowiskowego ani uwierzytelniającego.
- SecretRef `gateway.auth.token` jest nieaktywne podczas rozwiązywania uwierzytelniania przy uruchamianiu, gdy ustawiono `OPENCLAW_GATEWAY_TOKEN`, ponieważ dla tego środowiska uruchomieniowego pierwszeństwo ma token ze zmiennej środowiskowej.

</Accordion>

## Diagnostyka powierzchni uwierzytelniania Gateway

Gdy SecretRef jest ustawione w `gateway.auth.token`, `gateway.auth.password`, `gateway.remote.token` lub `gateway.remote.password`, uruchamianie lub ponowne wczytanie Gateway zapisuje stan powierzchni w dzienniku pod kodem `SECRETS_GATEWAY_AUTH_SURFACE`:

- `active`: SecretRef jest częścią faktycznie używanej powierzchni uwierzytelniania i musi zostać rozwiązane.
- `inactive`: pierwszeństwo ma inna powierzchnia uwierzytelniania albo uwierzytelnianie zdalne jest wyłączone lub nieaktywne.

Wpis dziennika zawiera przyczynę zastosowania zasad aktywnej powierzchni.

## Wstępna kontrola odwołań podczas wdrażania

Podczas interaktywnego wdrażania wybranie przechowywania SecretRef powoduje przeprowadzenie wstępnej weryfikacji przed zapisaniem:

- Odwołania do zmiennych środowiskowych: weryfikują nazwę zmiennej środowiskowej i potwierdzają, że podczas konfiguracji widoczna jest niepusta wartość.
- Odwołania do dostawców (`file` lub `exec`): weryfikują wybór dostawcy, rozwiązują `id` i sprawdzają typ rozwiązanej wartości.
- Przepływ szybkiego startu: gdy `gateway.auth.token` jest już SecretRef, wdrażanie rozwiązuje je przed sondą lub inicjalizacją pulpitu (dla odwołań `env`, `file` i `exec`), używając tego samego mechanizmu natychmiastowego przerwania w razie niepowodzenia.

Niepowodzenie weryfikacji powoduje wyświetlenie błędu i umożliwia ponowienie próby.

## Kontrakt SecretRef

Jeden kształt obiektu we wszystkich miejscach:

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

<Tabs>
  <Tab title="env">
    ```json5
    { source: "env", provider: "default", id: "OPENAI_API_KEY" }
    ```

    W polach SecretInput akceptowane są również skrócone ciągi:

    ```json5
    "${OPENAI_API_KEY}"
    "$OPENAI_API_KEY"
    ```

    Weryfikacja:

    - `provider` musi być zgodne z `^[a-z][a-z0-9_-]{0,63}$`
    - `id` musi być zgodne z `^[A-Z][A-Z0-9_]{0,127}$`

  </Tab>
  <Tab title="file">
    ```json5
    { source: "file", provider: "filemain", id: "/providers/openai/apiKey" }
    ```

    Weryfikacja:

    - `provider` musi być zgodne z `^[a-z][a-z0-9_-]{0,63}$`
    - `id` musi być bezwzględnym wskaźnikiem JSON (`/...`) albo literałem `value` dla dostawców `singleValue`
    - Kodowanie znaków w segmentach zgodne z RFC 6901: `~` staje się `~0`, a `/` staje się `~1`

  </Tab>
  <Tab title="exec">
    ```json5
    { source: "exec", provider: "vault", id: "providers/openai/apiKey#value" }
    ```

    Weryfikacja:

    - `provider` musi być zgodne z `^[a-z][a-z0-9_-]{0,63}$`
    - `id` musi być zgodne z `^[A-Za-z0-9][A-Za-z0-9._:/#-]{0,255}$` (obsługuje selektory takie jak `secret#json_key`)
    - `id` nie może zawierać `.` ani `..` jako segmentów ścieżki rozdzielonych ukośnikami (na przykład `a/../b` jest odrzucane)

  </Tab>
</Tabs>

## Konfiguracja dostawcy

Dostawców należy zdefiniować w `secrets.providers`:

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

<Accordion title="Dostawca zmiennych środowiskowych">
- Opcjonalna lista dozwolonych dokładnych nazw za pomocą `allowlist`.
- Brakujące lub puste wartości zmiennych środowiskowych powodują niepowodzenie rozwiązywania.

</Accordion>

<Accordion title="Dostawca plikowy">
- Odczytuje lokalny plik z `path`.
- `mode: "json"` (domyślnie) oczekuje ładunku obiektu JSON i rozwiązuje `id` jako wskaźnik JSON.
- `mode: "singleValue"` oczekuje identyfikatora odwołania `"value"` i zwraca nieprzetworzoną zawartość pliku (z usuniętym końcowym znakiem nowego wiersza).
- Ścieżka musi przejść kontrole własności i uprawnień; `timeoutMs` (domyślnie 5000) i `maxBytes` (domyślnie 1 MiB) ograniczają odczyt.
- Bezpieczne przerywanie w systemie Windows: jeśli weryfikacja list ACL jest niedostępna dla ścieżki, rozwiązywanie kończy się niepowodzeniem. Tylko w przypadku zaufanych ścieżek należy ustawić `allowInsecurePath: true` dla tego dostawcy, aby pominąć kontrolę.

</Accordion>

<Accordion title="Dostawca exec">
- Uruchamia bezpośrednio skonfigurowaną bezwzględną ścieżkę pliku binarnego, bez powłoki.
- Domyślnie `command` musi być zwykłym plikiem, a nie dowiązaniem symbolicznym. Ustaw `allowSymlinkCommand: true`, aby zezwolić na ścieżki poleceń będące dowiązaniami symbolicznymi (na przykład pliki pośredniczące Homebrew), i połącz tę opcję z `trustedDirs` (na przykład `["/opt/homebrew"]`), aby kwalifikowały się tylko ścieżki menedżera pakietów.
- Obsługuje `timeoutMs` (domyślnie 5000), `noOutputTimeoutMs` (domyślnie równe `timeoutMs`), `maxOutputBytes` (domyślnie 1 MiB), listę dozwolonych wartości `env`/`passEnv` oraz `trustedDirs`.
- `jsonOnly` ma domyślnie wartość `true`. Gdy ustawiono `jsonOnly: false` i żądany jest pojedynczy identyfikator, zwykłe dane stdout niebędące JSON-em są akceptowane jako wartość tego identyfikatora.
- System Windows działa w trybie bezpiecznego odrzucenia: jeśli weryfikacja listy ACL ścieżki polecenia jest niedostępna, rozwiązywanie kończy się niepowodzeniem. Tylko w przypadku zaufanych ścieżek ustaw `allowInsecurePath: true` dla tego dostawcy, aby pominąć sprawdzanie.
- Dostawcy exec zarządzani przez Plugin mogą używać `pluginIntegration` zamiast skopiowanych wartości `command`/`args`. Podczas uruchamiania lub ponownego wczytywania OpenClaw pobiera bieżące szczegóły polecenia z manifestu zainstalowanego pluginu. Jeśli plugin jest wyłączony, usunięty, niezaufany albo nie deklaruje już integracji, aktywne odwołania SecretRef tego dostawcy są bezpiecznie odrzucane.

Dane żądania (stdin):

```json
{ "protocolVersion": 1, "provider": "vault", "ids": ["providers/openai/apiKey"] }
```

Dane odpowiedzi (stdout):

```jsonc
{ "protocolVersion": 1, "values": { "providers/openai/apiKey": "<openai-api-key>" } } // pragma: allowlist secret
```

Opcjonalne błędy dla poszczególnych identyfikatorów:

```json
{
  "protocolVersion": 1,
  "values": {},
  "errors": { "providers/openai/apiKey": { "code": "NOT_FOUND" } }
}
```

`code` jest opcjonalną diagnostyką przeznaczoną do odczytu maszynowego. OpenClaw wyświetla rozpoznawane
kody `NOT_FOUND` i `AMBIGUOUS_DUPLICATE_KEY` wraz z dostawcą i identyfikatorem odwołania. Inne
kody i pola o dowolnej postaci, takie jak `message`, są akceptowane w celu zachowania zgodności z protokołem v1,
ale nie są wyświetlane, ponieważ dane wyjściowe resolvera mogą zawierać materiały uwierzytelniające.

</Accordion>

## Klucze API przechowywane w plikach

Nie umieszczaj ciągów `file:...` w bloku konfiguracji `env`. Ten blok ma charakter dosłowny i nie jest nadpisywany, dlatego `file:...` nigdy nie jest w nim rozwiązywane.

Zamiast tego użyj plikowego SecretRef w obsługiwanym polu danych uwierzytelniających:

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

Dla `mode: "singleValue"` wartością `id` odwołania SecretRef jest `"value"`. Dla `mode: "json"` użyj bezwzględnego wskaźnika JSON, takiego jak `"/providers/xai/apiKey"`.

Pola akceptujące odwołania SecretRef opisano w sekcji [Obsługiwane pola danych uwierzytelniających SecretRef](/pl/reference/secretref-credential-surface).

## Przykłady integracji exec

Dedykowany przewodnik po 1Password, obejmujący konta usług, dołączoną umiejętność agenta i rozwiązywanie problemów, znajduje się w sekcji [1Password](/gateway/1password).

<AccordionGroup>
  <Accordion title="CLI 1Password">
    ```json5
    {
      secrets: {
        providers: {
          onepassword_openai: {
            source: "exec",
            command: "/opt/homebrew/bin/op",
            allowSymlinkCommand: true, // wymagane dla plików binarnych Homebrew będących dowiązaniami symbolicznymi
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
    Użyj opakowania resolvera, aby mapować identyfikatory SecretRef na klucze elementów Bitwarden Secrets Manager. Repozytorium zawiera `scripts/secrets/openclaw-bws-resolver.mjs`; zainstaluj lub skopiuj je do bezwzględnej zaufanej ścieżki na hoście, na którym działa Gateway.

    Wymagania:

    - CLI Bitwarden Secrets Manager (`bws`) zainstalowane na hoście Gateway.
    - `BWS_ACCESS_TOKEN` dostępne dla usługi Gateway.
    - `PATH` przekazane do resolvera lub `BWS_BIN` ustawione na bezwzględną ścieżkę pliku binarnego `bws`.
    - `BWS_SERVER_URL` ustawione w środowisku podczas używania samodzielnie hostowanej instancji Bitwarden.

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

    Resolver grupuje żądane identyfikatory, uruchamia `bws secret list` i zwraca wartości pasujących pól `key` wpisów tajnych. Używaj kluczy spełniających wymagania identyfikatora exec SecretRef, takich jak `openclaw/providers/openai/apiKey`; klucze w stylu zmiennych środowiskowych zawierające podkreślenia są odrzucane przed uruchomieniem resolvera. Jeśli więcej niż jeden widoczny wpis tajny Bitwarden ma żądany klucz, resolver oznacza ten identyfikator jako niejednoznaczny, zamiast zgadywać. Po zaktualizowaniu konfiguracji zweryfikuj ścieżkę resolvera:

    ```bash
    openclaw secrets audit --allow-exec
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
            allowSymlinkCommand: true, // wymagane dla plików binarnych Homebrew będących dowiązaniami symbolicznymi
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
    Użyj małego opakowania resolvera, aby mapować identyfikatory SecretRef bezpośrednio na wpisy `pass`. Zapisz je jako plik wykonywalny pod bezwzględną ścieżką, która przechodzi kontrolę ścieżek dostawcy exec, na przykład `/usr/local/bin/openclaw-pass-resolver`. Shebang `#!/usr/bin/env node` wyszukuje `node` w zmiennej `PATH` procesu resolvera, dlatego uwzględnij `PATH` w `passEnv`. Jeśli `pass` nie znajduje się w tej zmiennej `PATH`, ustaw `PASS_BIN` w środowisku nadrzędnym i również uwzględnij ją w `passEnv`:

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
        process.stderr.write(`Nie udało się przeanalizować żądania: ${err.message}\n`);
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
          errors[id] = { message: (result.stderr || `polecenie pass zakończyło się ze stanem ${result.status}`).trim() };
        }
      }

      process.stdout.write(JSON.stringify({ protocolVersion: 1, values, errors }));
    });
    ```

    Następnie skonfiguruj dostawcę exec i ustaw `apiKey` na ścieżkę wpisu `pass`:

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

    Przechowuj wpis tajny w pierwszym wierszu wpisu `pass` albo dostosuj opakowanie tak, aby zamiast tego zwracało pełne dane wyjściowe `pass show`. Po zaktualizowaniu konfiguracji zweryfikuj zarówno audyt statyczny, jak i ścieżkę resolvera exec:

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
            allowSymlinkCommand: true, // wymagane dla plików binarnych Homebrew będących dowiązaniami symbolicznymi
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

Zmienne środowiskowe serwera MCP skonfigurowane za pomocą `plugins.entries.acpx.config.mcpServers` akceptują SecretInput, dzięki czemu klucze API i tokeny nie trafiają do konfiguracji w postaci zwykłego tekstu:

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

Wartości ciągów w postaci zwykłego tekstu nadal działają. Odwołania szablonów środowiskowych, takie jak `${MCP_SERVER_API_KEY}`, oraz obiekty SecretRef są rozwiązywane podczas aktywacji Gateway, zanim zostanie uruchomiony proces serwera MCP. Tak jak w przypadku innych powierzchni SecretRef, nierozwiązane odwołania blokują aktywację tylko wtedy, gdy plugin `acpx` jest faktycznie aktywny.

## Materiały uwierzytelniające SSH piaskownicy

Podstawowy backend piaskownicy `ssh` obsługuje również odwołania SecretRef dla materiałów uwierzytelniających SSH:

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

- OpenClaw rozwiązuje te odwołania podczas aktywacji piaskownicy, a nie leniwie przy każdym wywołaniu SSH.
- Rozwiązane wartości są zapisywane w katalogu tymczasowym z restrykcyjnymi uprawnieniami do plików (`0o600`) i używane w wygenerowanej konfiguracji SSH.
- Jeśli efektywnym backendem piaskownicy nie jest `ssh` (lub trybem piaskownicy jest `off`), te odwołania pozostają nieaktywne i nie blokują uruchamiania.

## Obsługiwany zakres poświadczeń

Kanoniczna lista obsługiwanych i nieobsługiwanych poświadczeń znajduje się w dokumencie [Zakres poświadczeń SecretRef](/pl/reference/secretref-credential-surface).

<Note>
Poświadczenia generowane w czasie działania lub rotacyjne oraz dane odświeżania OAuth są celowo wyłączone z rozwiązywania SecretRef tylko do odczytu.
</Note>

## Wymagane zachowanie i pierwszeństwo

- Pole bez odwołania: bez zmian.
- Pole z odwołaniem: wymagane na aktywnych powierzchniach podczas aktywacji.
- Jeśli obecne są zarówno zwykły tekst, jak i odwołanie, odwołanie ma pierwszeństwo na obsługiwanych ścieżkach pierwszeństwa.
- Znacznik redakcji `__OPENCLAW_REDACTED__` jest zarezerwowany do wewnętrznej redakcji i przywracania konfiguracji, a jego dosłowne użycie w przesłanych danych konfiguracyjnych jest odrzucane.

Sygnały ostrzegawcze i audytowe:

- `SECRETS_REF_OVERRIDES_PLAINTEXT` (ostrzeżenie w czasie działania)
- `REF_SHADOWED` (ustalenie audytu, gdy poświadczenia `auth-profiles.json` mają pierwszeństwo przed odwołaniami `openclaw.json`)

Zgodność z Google Chat: `serviceAccountRef` ma pierwszeństwo przed wartością zwykłego tekstu `serviceAccount`; po ustawieniu sąsiedniego odwołania wartość zwykłego tekstu jest ignorowana.

## Wyzwalacze aktywacji

Aktywacja sekretów jest uruchamiana podczas:

- Uruchamiania (kontrola wstępna i końcowa aktywacja)
- Ścieżki natychmiastowego zastosowania po ponownym wczytaniu konfiguracji
- Ścieżki sprawdzania konieczności ponownego uruchomienia po ponownym wczytaniu konfiguracji
- Ręcznego ponownego wczytania za pomocą `secrets.reload`
- Kontroli wstępnej RPC zapisu konfiguracji Gateway (`config.set` / `config.apply` / `config.patch`), sprawdzającej możliwość rozwiązania SecretRef na aktywnych powierzchniach w przesłanym ładunku konfiguracji przed utrwaleniem zmian

Kontrakt aktywacji:

- Powodzenie atomowo podmienia migawkę.
- Błąd podczas uruchamiania przerywa uruchamianie Gateway.
- Błąd ponownego wczytania w czasie działania zachowuje ostatnią prawidłową migawkę.
- Błąd kontroli wstępnej RPC zapisu odrzuca przesłaną konfigurację; zarówno konfiguracja na dysku, jak i aktywna migawka środowiska wykonawczego pozostają bez zmian.
- Przekazanie jawnego tokenu kanału dla pojedynczego wywołania do wychodzącego pomocnika lub wywołania narzędzia nie uruchamia aktywacji SecretRef; punktami aktywacji pozostają uruchamianie, ponowne wczytanie i jawne `secrets.reload`.

## Sygnały degradacji i odzyskania

Gdy aktywacja podczas ponownego wczytania zakończy się niepowodzeniem po osiągnięciu prawidłowego stanu, OpenClaw przechodzi w zdegradowany stan sekretów, emitując jednorazowe zdarzenia systemowe i kody dziennika:

- `SECRETS_RELOADER_DEGRADED`
- `SECRETS_RELOADER_RECOVERED`

Zachowanie:

- Degradacja: środowisko wykonawcze zachowuje ostatnią prawidłową migawkę.
- Odzyskanie: emitowane raz po kolejnej udanej aktywacji.
- Powtarzające się błędy w już zdegradowanym stanie zapisują ostrzeżenia w dzienniku, ale nie emitują ponownie zdarzenia.
- Szybkie przerwanie podczas uruchamiania nigdy nie emituje zdarzenia degradacji, ponieważ środowisko wykonawcze nie stało się aktywne.

## Rozwiązywanie ścieżek poleceń

Ścieżki poleceń mogą włączyć obsługiwane rozwiązywanie SecretRef za pośrednictwem RPC migawki Gateway. Obowiązują dwa ogólne zachowania:

<Tabs>
  <Tab title="Rygorystyczne ścieżki poleceń">
    Na przykład ścieżki zdalnej pamięci `openclaw memory` oraz `openclaw qr --remote`, gdy wymagane są zdalne odwołania do sekretów współdzielonych. Odczytują dane z aktywnej migawki i natychmiast kończą się niepowodzeniem, gdy wymagany SecretRef jest niedostępny.
  </Tab>
  <Tab title="Ścieżki poleceń tylko do odczytu">
    Na przykład `openclaw status`, `openclaw status --all`, `openclaw channels status`, `openclaw channels resolve`, `openclaw security audit` oraz przepływy naprawy przez doctor/konfigurację tylko do odczytu. One również preferują aktywną migawkę, ale zamiast przerywać działanie przechodzą w tryb zdegradowany, gdy docelowy SecretRef jest niedostępny.

    Zachowanie tylko do odczytu:

    - Gdy Gateway działa, te polecenia najpierw odczytują dane z aktywnej migawki.
    - Jeśli rozwiązywanie przez Gateway jest niepełne lub Gateway jest niedostępny, podejmują próbę ukierunkowanego lokalnego rozwiązania awaryjnego dla danej powierzchni polecenia.
    - Jeśli docelowy SecretRef nadal jest niedostępny, polecenie kontynuuje działanie ze zdegradowanymi danymi wyjściowymi tylko do odczytu i jawnym komunikatem diagnostycznym, że odwołanie jest skonfigurowane, ale niedostępne w tej ścieżce polecenia.
    - To zdegradowane zachowanie dotyczy wyłącznie lokalnego polecenia; nie osłabia uruchamiania środowiska wykonawczego, ponownego wczytywania ani ścieżek wysyłania/uwierzytelniania.

  </Tab>
</Tabs>

Pozostałe uwagi:

- Odświeżanie migawki po rotacji sekretu backendu jest obsługiwane przez `openclaw secrets reload`.
- Metoda RPC Gateway używana przez te ścieżki poleceń: `secrets.resolve`.

## Przepływ audytu i konfiguracji

Domyślny przepływ operatora:

<Steps>
  <Step title="Przeprowadź audyt bieżącego stanu">
    ```bash
    openclaw secrets audit --check
    ```
  </Step>
  <Step title="Skonfiguruj i zastosuj SecretRef">
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

Nie należy uznawać migracji za zakończoną, dopóki ponowny audyt nie wykaże braku problemów. Jeśli audyt nadal zgłasza przechowywane wartości zwykłego tekstu, ryzyko dostępu agenta pozostaje, nawet gdy interfejsy API środowiska wykonawczego zwracają zredagowane wartości.

Jeśli podczas `configure` plan zostanie zapisany zamiast zastosowany, przed ponownym audytem należy zastosować zapisany plan za pomocą `openclaw secrets apply --from <plan-path>`.

<AccordionGroup>
  <Accordion title="secrets audit">
    Ustalenia obejmują:

    - Przechowywane wartości zwykłego tekstu (`openclaw.json`, `auth-profiles.json`, `.env` oraz wygenerowane `agents/*/agent/models.json`).
    - Pozostałości wrażliwych nagłówków dostawcy w postaci zwykłego tekstu w wygenerowanych wpisach `models.json`.
    - Nierozwiązane odwołania.
    - Przesłanianie według pierwszeństwa (`auth-profiles.json` ma pierwszeństwo przed odwołaniami `openclaw.json`).
    - Pozostałości starszych mechanizmów (`auth.json`, przypomnienia OAuth).

    Uwaga dotycząca exec: domyślnie audyt pomija sprawdzanie możliwości rozwiązania SecretRef typu exec, aby uniknąć skutków ubocznych poleceń. Aby wykonywać dostawców exec podczas audytu, należy użyć `openclaw secrets audit --allow-exec`.

    Uwaga dotycząca pozostałości nagłówków: wykrywanie wrażliwych nagłówków dostawców opiera się na heurystyce nazw (typowe nazwy nagłówków uwierzytelniania/poświadczeń i fragmenty takie jak `authorization`, `x-api-key`, `token`, `secret`, `password` oraz `credential`).

  </Accordion>
  <Accordion title="secrets configure">
    Interaktywny pomocnik, który:

    - Najpierw konfiguruje `secrets.providers` (`env`/`file`/`exec`, dodawanie/edycja/usuwanie).
    - Umożliwia wybranie obsługiwanych pól zawierających sekrety w `openclaw.json` oraz `auth-profiles.json` dla zakresu jednego agenta.
    - Może utworzyć nowe mapowanie `auth-profiles.json` bezpośrednio w selektorze celu.
    - Pobiera szczegóły SecretRef (`source`, `provider`, `id`).
    - Uruchamia rozwiązywanie wstępne i może natychmiast zastosować zmiany.

    Uwaga dotycząca exec: kontrola wstępna pomija sprawdzanie SecretRef typu exec, chyba że ustawiono `--allow-exec`. Jeśli plan jest stosowany bezpośrednio z `configure --apply` i zawiera odwołania lub dostawców exec, należy pozostawić ustawione `--allow-exec` również na etapie stosowania.

    Przydatne tryby:

    - `openclaw secrets configure --providers-only`
    - `openclaw secrets configure --skip-provider-setup`
    - `openclaw secrets configure --agent <id>`

    Domyślne ustawienia stosowania `configure`:

    - Usuwa pasujące statyczne poświadczenia z `auth-profiles.json` dla wskazanych dostawców.
    - Usuwa starsze statyczne wpisy `api_key` z `auth.json`.
    - Usuwa pasujące znane wiersze sekretów z `<config-dir>/.env`.

  </Accordion>
  <Accordion title="secrets apply">
    Zastosowanie zapisanego planu:

    ```bash
    openclaw secrets apply --from /tmp/openclaw-secrets-plan.json
    openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --allow-exec
    openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run
    openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run --allow-exec
    ```

    Uwaga dotycząca exec: tryb próbny pomija sprawdzanie exec, chyba że ustawiono `--allow-exec`; tryb zapisu odrzuca plany zawierające SecretRef lub dostawców exec, chyba że ustawiono `--allow-exec`.

    Szczegóły rygorystycznego kontraktu celu/ścieżki i dokładne reguły odrzucania opisano w dokumencie [Kontrakt planu stosowania sekretów](/pl/gateway/secrets-plan-contract).

  </Accordion>
</AccordionGroup>

## Jednokierunkowa polityka bezpieczeństwa

<Warning>
OpenClaw celowo nie zapisuje kopii zapasowych wycofania zawierających historyczne wartości sekretów w postaci zwykłego tekstu.
</Warning>

Model bezpieczeństwa:

- Kontrola wstępna musi zakończyć się powodzeniem przed przejściem do trybu zapisu.
- Aktywacja środowiska wykonawczego jest weryfikowana przed zatwierdzeniem.
- Operacja zastosowania aktualizuje pliki za pomocą atomowej zamiany plików i podejmuje możliwie najlepszą próbę przywrócenia po błędzie.

## Uwagi dotyczące zgodności ze starszym uwierzytelnianiem

W przypadku statycznych poświadczeń środowisko wykonawcze nie zależy już od starszego magazynu uwierzytelniania w postaci zwykłego tekstu.

- Źródłem poświadczeń środowiska wykonawczego jest rozwiązana migawka w pamięci.
- Starsze statyczne wpisy `api_key` są usuwane po wykryciu.
- Zachowanie zgodności związane z OAuth pozostaje odrębne.

## Uwaga dotycząca interfejsu WWW

Niektóre unie SecretInput łatwiej skonfigurować w trybie edytora surowego niż w trybie formularza.

## Powiązane

- [Uwierzytelnianie](/pl/gateway/authentication) - konfiguracja uwierzytelniania
- [CLI: sekrety](/pl/cli/secrets) - polecenia CLI
- [SecretRef magazynu Vault](/pl/plugins/vault) - konfiguracja dostawcy HashiCorp Vault
- [Zmienne środowiskowe](/pl/help/environment) - pierwszeństwo zmiennych środowiskowych
- [Zakres poświadczeń SecretRef](/pl/reference/secretref-credential-surface) - zakres poświadczeń
- [Kontrakt planu stosowania sekretów](/pl/gateway/secrets-plan-contract) - szczegóły kontraktu planu
- [Bezpieczeństwo](/pl/gateway/security) - podejście do bezpieczeństwa
