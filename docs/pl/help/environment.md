---
read_when:
    - Musisz wiedzieć, które zmienne środowiskowe są ładowane i w jakiej kolejności
    - Diagnozujesz brakujące klucze API w Gateway
    - Dokumentujesz uwierzytelnianie dostawcy lub środowiska wdrożeniowe
summary: Miejsca, z których OpenClaw ładuje zmienne środowiskowe, oraz kolejność pierwszeństwa
title: Zmienne środowiskowe
x-i18n:
    generated_at: "2026-04-30T09:58:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: d19b9053207a088b3eb39d03e36fc2d415295feb80da51bd71339884466b101b
    source_path: help/environment.md
    workflow: 16
---

OpenClaw pobiera zmienne środowiskowe z wielu źródeł. Reguła brzmi: **nigdy nie nadpisuj istniejących wartości**.

## Priorytet (najwyższy → najniższy)

1. **Środowisko procesu** (to, co proces Gateway już ma z nadrzędnej powłoki/demona).
2. **`.env` w bieżącym katalogu roboczym** (domyślne zachowanie dotenv; nie nadpisuje).
3. **Globalny `.env`** w `~/.openclaw/.env` (czyli `$OPENCLAW_STATE_DIR/.env`; nie nadpisuje).
4. **Blok `env` konfiguracji** w `~/.openclaw/openclaw.json` (stosowany tylko, jeśli brakuje wartości).
5. **Opcjonalny import z powłoki logowania** (`env.shellEnv.enabled` lub `OPENCLAW_LOAD_SHELL_ENV=1`), stosowany tylko dla brakujących oczekiwanych kluczy.

W świeżych instalacjach Ubuntu używających domyślnego katalogu stanu OpenClaw traktuje też `~/.config/openclaw/gateway.env` jako zgodnościowy wariant zapasowy po globalnym `.env`. Jeśli oba pliki istnieją i są sprzeczne, OpenClaw zachowuje `~/.openclaw/.env` i wyświetla ostrzeżenie.

Jeśli plik konfiguracji w ogóle nie istnieje, krok 4 jest pomijany; import powłoki nadal działa, jeśli jest włączony.

## Blok `env` konfiguracji

Dwa równoważne sposoby ustawienia wbudowanych zmiennych środowiskowych (oba nie nadpisują):

```json5
{
  env: {
    OPENROUTER_API_KEY: "sk-or-...",
    vars: {
      GROQ_API_KEY: "gsk-...",
    },
  },
}
```

## Import środowiska powłoki

`env.shellEnv` uruchamia Twoją powłokę logowania i importuje tylko **brakujące** oczekiwane klucze:

```json5
{
  env: {
    shellEnv: {
      enabled: true,
      timeoutMs: 15000,
    },
  },
}
```

Odpowiedniki zmiennych środowiskowych:

- `OPENCLAW_LOAD_SHELL_ENV=1`
- `OPENCLAW_SHELL_ENV_TIMEOUT_MS=15000`

## Zmienne środowiskowe wstrzykiwane w czasie wykonywania

OpenClaw wstrzykuje też znaczniki kontekstu do uruchamianych procesów potomnych:

- `OPENCLAW_SHELL=exec`: ustawiane dla poleceń uruchamianych przez narzędzie `exec`.
- `OPENCLAW_SHELL=acp`: ustawiane dla uruchomień procesów backendu środowiska uruchomieniowego ACP (na przykład `acpx`).
- `OPENCLAW_SHELL=acp-client`: ustawiane dla `openclaw acp client`, gdy uruchamia proces mostu ACP.
- `OPENCLAW_SHELL=tui-local`: ustawiane dla lokalnych poleceń powłoki TUI `!`.

Są to znaczniki czasu wykonywania (nie wymagana konfiguracja użytkownika). Można ich używać w logice powłoki/profilu,
aby stosować reguły specyficzne dla kontekstu.

## Zmienne środowiskowe UI

- `OPENCLAW_THEME=light`: wymusza jasną paletę TUI, gdy terminal ma jasne tło.
- `OPENCLAW_THEME=dark`: wymusza ciemną paletę TUI.
- `COLORFGBG`: jeśli terminal ją eksportuje, OpenClaw używa wskazówki koloru tła do automatycznego wyboru palety TUI.

## Podstawianie zmiennych środowiskowych w konfiguracji

Możesz odwoływać się do zmiennych środowiskowych bezpośrednio w wartościach tekstowych konfiguracji, używając składni `${VAR_NAME}`:

```json5
{
  models: {
    providers: {
      "vercel-gateway": {
        apiKey: "${VERCEL_GATEWAY_API_KEY}",
      },
    },
  },
}
```

Pełne szczegóły znajdziesz w [Konfiguracja: podstawianie zmiennych środowiskowych](/pl/gateway/configuration-reference#env-var-substitution).

## Odwołania do sekretów a ciągi `${ENV}`

OpenClaw obsługuje dwa wzorce oparte na środowisku:

- Podstawianie ciągów `${VAR}` w wartościach konfiguracji.
- Obiekty SecretRef (`{ source: "env", provider: "default", id: "VAR" }`) dla pól obsługujących odwołania do sekretów.

Oba są rozwiązywane ze środowiska procesu w momencie aktywacji. Szczegóły SecretRef są udokumentowane w [Zarządzaniu sekretami](/pl/gateway/secrets).

## Zmienne środowiskowe związane ze ścieżkami

| Zmienna                | Cel                                                                                                                                                                                                                   |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_HOME`        | Nadpisuje katalog domowy używany do całego wewnętrznego rozwiązywania ścieżek (`~/.openclaw/`, katalogi agentów, sesje, poświadczenia). Przydatne przy uruchamianiu OpenClaw jako dedykowany użytkownik usługi. |
| `OPENCLAW_STATE_DIR`   | Nadpisuje katalog stanu (domyślnie `~/.openclaw`).                                                                                                                                                                    |
| `OPENCLAW_CONFIG_PATH` | Nadpisuje ścieżkę pliku konfiguracji (domyślnie `~/.openclaw/openclaw.json`).                                                                                                                                         |

## Rejestrowanie

| Zmienna              | Cel                                                                                                                                                                                                                       |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_LOG_LEVEL` | Nadpisuje poziom logów zarówno dla pliku, jak i konsoli (np. `debug`, `trace`). Ma pierwszeństwo przed `logging.level` i `logging.consoleLevel` w konfiguracji. Nieprawidłowe wartości są ignorowane z ostrzeżeniem. |

### `OPENCLAW_HOME`

Po ustawieniu `OPENCLAW_HOME` zastępuje systemowy katalog domowy (`$HOME` / `os.homedir()`) dla całego wewnętrznego rozwiązywania ścieżek. Umożliwia to pełną izolację systemu plików dla bezgłowych kont usługowych.

**Priorytet:** `OPENCLAW_HOME` > `$HOME` > `USERPROFILE` > `os.homedir()`

**Przykład** (macOS LaunchDaemon):

```xml
<key>EnvironmentVariables</key>
<dict>
  <key>OPENCLAW_HOME</key>
  <string>/Users/user</string>
</dict>
```

`OPENCLAW_HOME` można też ustawić na ścieżkę z tyldą (np. `~/svc`), która przed użyciem jest rozwijana przy użyciu `$HOME`.

## Użytkownicy nvm: błędy TLS w web_fetch

Jeśli Node.js został zainstalowany przez **nvm** (a nie systemowego menedżera pakietów), wbudowane `fetch()` używa
dołączonego do nvm magazynu CA, w którym może brakować nowoczesnych głównych CA (ISRG Root X1/X2 dla Let's Encrypt,
DigiCert Global Root G2 itd.). Powoduje to niepowodzenie `web_fetch` z komunikatem `"fetch failed"` w większości witryn HTTPS.

W Linuksie OpenClaw automatycznie wykrywa nvm i stosuje poprawkę w rzeczywistym środowisku startowym:

- `openclaw gateway install` zapisuje `NODE_EXTRA_CA_CERTS` w środowisku usługi systemd
- punkt wejścia CLI `openclaw` uruchamia się ponownie z ustawionym `NODE_EXTRA_CA_CERTS` przed startem Node

**Poprawka ręczna (dla starszych wersji lub bezpośrednich uruchomień `node ...`):**

Wyeksportuj zmienną przed uruchomieniem OpenClaw:

```bash
export NODE_EXTRA_CA_CERTS=/etc/ssl/certs/ca-certificates.crt
openclaw gateway run
```

Nie polegaj na zapisaniu tej zmiennej wyłącznie w `~/.openclaw/.env`; Node odczytuje
`NODE_EXTRA_CA_CERTS` podczas startu procesu.

## Starsze zmienne środowiskowe

OpenClaw odczytuje tylko zmienne środowiskowe `OPENCLAW_*`. Starsze prefiksy
`CLAWDBOT_*` i `MOLTBOT_*` z wcześniejszych wydań są po cichu
ignorowane.

Jeśli podczas startu procesu Gateway któreś z nich są nadal ustawione, OpenClaw emituje
pojedyncze ostrzeżenie o wycofaniu Node (`OPENCLAW_LEGACY_ENV_VARS`) z listą
wykrytych prefiksów i łączną liczbą. Zmień nazwę każdej wartości, zastępując
starszy prefiks prefiksem `OPENCLAW_` (na przykład `CLAWDBOT_GATEWAY_TOKEN` →
`OPENCLAW_GATEWAY_TOKEN`); stare nazwy nie mają żadnego efektu.

## Powiązane

- [Konfiguracja Gateway](/pl/gateway/configuration)
- [FAQ: zmienne środowiskowe i ładowanie .env](/pl/help/faq#env-vars-and-env-loading)
- [Przegląd modeli](/pl/concepts/models)
