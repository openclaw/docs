---
read_when:
    - Musisz wiedzieć, które zmienne środowiskowe są ładowane i w jakiej kolejności
    - Debugujesz brakujące klucze API w Gateway
    - Dokumentujesz uwierzytelnianie dostawców lub środowiska wdrożeniowe
summary: Skąd OpenClaw wczytuje zmienne środowiskowe i jaka jest kolejność priorytetów
title: Zmienne środowiskowe
x-i18n:
    generated_at: "2026-05-02T09:52:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: 66787dd6f87dcaf81f721465e88dda519421b1a598179f71bce0239bb4791c46
    source_path: help/environment.md
    workflow: 16
---

OpenClaw pobiera zmienne środowiskowe z wielu źródeł. Zasada brzmi: **nigdy nie nadpisuj istniejących wartości**.

## Priorytet (najwyższy → najniższy)

1. **Środowisko procesu** (to, co proces Gateway ma już z nadrzędnej powłoki/demona).
2. **`.env` w bieżącym katalogu roboczym** (domyślne zachowanie dotenv; nie nadpisuje).
3. **Globalny `.env`** w `~/.openclaw/.env` (czyli `$OPENCLAW_STATE_DIR/.env`; nie nadpisuje).
4. **Blok `env` konfiguracji** w `~/.openclaw/openclaw.json` (stosowany tylko wtedy, gdy wartości brakuje).
5. **Opcjonalny import z powłoki logowania** (`env.shellEnv.enabled` lub `OPENCLAW_LOAD_SHELL_ENV=1`), stosowany tylko dla brakujących oczekiwanych kluczy.

W świeżych instalacjach Ubuntu używających domyślnego katalogu stanu OpenClaw traktuje też `~/.config/openclaw/gateway.env` jako zapasową ścieżkę zgodności po globalnym `.env`. Jeśli oba pliki istnieją i są rozbieżne, OpenClaw zachowuje `~/.openclaw/.env` i wyświetla ostrzeżenie.

Jeśli plik konfiguracji w ogóle nie istnieje, krok 4 jest pomijany; import z powłoki nadal zostanie uruchomiony, jeśli jest włączony.

## Blok `env` konfiguracji

Dwa równoważne sposoby ustawiania wbudowanych zmiennych środowiskowych (oba bez nadpisywania):

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

`env.shellEnv` uruchamia powłokę logowania i importuje tylko **brakujące** oczekiwane klucze:

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

## Zmienne środowiskowe wstrzykiwane w czasie działania

OpenClaw wstrzykuje też znaczniki kontekstu do uruchamianych procesów potomnych:

- `OPENCLAW_SHELL=exec`: ustawiane dla poleceń uruchamianych przez narzędzie `exec`.
- `OPENCLAW_SHELL=acp`: ustawiane dla uruchomień procesów backendu runtime ACP (na przykład `acpx`).
- `OPENCLAW_SHELL=acp-client`: ustawiane dla `openclaw acp client`, gdy uruchamia proces mostu ACP.
- `OPENCLAW_SHELL=tui-local`: ustawiane dla lokalnych poleceń powłoki TUI `!`.

Są to znaczniki czasu działania (nie wymagana konfiguracja użytkownika). Można ich używać w logice powłoki/profilu
do stosowania reguł zależnych od kontekstu.

## Zmienne środowiskowe UI

- `OPENCLAW_THEME=light`: wymusza jasną paletę TUI, gdy terminal ma jasne tło.
- `OPENCLAW_THEME=dark`: wymusza ciemną paletę TUI.
- `COLORFGBG`: jeśli terminal ją eksportuje, OpenClaw używa podpowiedzi koloru tła do automatycznego wyboru palety TUI.

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

Pełne szczegóły znajdziesz w sekcji [Konfiguracja: podstawianie zmiennych środowiskowych](/pl/gateway/configuration-reference#env-var-substitution).

## Odwołania do sekretów a ciągi `${ENV}`

OpenClaw obsługuje dwa wzorce oparte na zmiennych środowiskowych:

- Podstawianie ciągów `${VAR}` w wartościach konfiguracji.
- Obiekty SecretRef (`{ source: "env", provider: "default", id: "VAR" }`) dla pól obsługujących odwołania do sekretów.

Oba są rozwiązywane ze środowiska procesu w momencie aktywacji. Szczegóły SecretRef opisano w sekcji [Zarządzanie sekretami](/pl/gateway/secrets).

## Zmienne środowiskowe związane ze ścieżkami

| Zmienna                  | Cel                                                                                                                                                                                                 |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_HOME`          | Zastępuje katalog domowy używany do całego wewnętrznego rozwiązywania ścieżek (`~/.openclaw/`, katalogi agentów, sesje, poświadczenia). Przydatne przy uruchamianiu OpenClaw jako dedykowany użytkownik usługi. |
| `OPENCLAW_STATE_DIR`     | Zastępuje katalog stanu (domyślnie `~/.openclaw`).                                                                                                                                                  |
| `OPENCLAW_CONFIG_PATH`   | Zastępuje ścieżkę pliku konfiguracji (domyślnie `~/.openclaw/openclaw.json`).                                                                                                                       |
| `OPENCLAW_INCLUDE_ROOTS` | Lista ścieżek katalogów, w których dyrektywy `$include` mogą rozwiązywać pliki spoza katalogu konfiguracji (domyślnie brak — `$include` jest ograniczone do katalogu konfiguracji). Z rozwijaniem tyldy. |

## Rejestrowanie

| Zmienna              | Cel                                                                                                                                                                                           |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_LOG_LEVEL` | Zastępuje poziom rejestrowania zarówno dla pliku, jak i konsoli (np. `debug`, `trace`). Ma pierwszeństwo przed `logging.level` i `logging.consoleLevel` w konfiguracji. Nieprawidłowe wartości są ignorowane z ostrzeżeniem. |

### `OPENCLAW_HOME`

Po ustawieniu `OPENCLAW_HOME` zastępuje systemowy katalog domowy (`$HOME` / `os.homedir()`) dla całego wewnętrznego rozwiązywania ścieżek. Umożliwia to pełną izolację systemu plików dla bezobsługowych kont usługowych.

**Priorytet:** `OPENCLAW_HOME` > `$HOME` > `USERPROFILE` > `os.homedir()`

**Przykład** (macOS LaunchDaemon):

```xml
<key>EnvironmentVariables</key>
<dict>
  <key>OPENCLAW_HOME</key>
  <string>/Users/user</string>
</dict>
```

`OPENCLAW_HOME` można też ustawić na ścieżkę z tyldą (np. `~/svc`), która przed użyciem zostanie rozwinięta za pomocą `$HOME`.

## Użytkownicy nvm: błędy TLS w web_fetch

Jeśli Node.js zainstalowano przez **nvm** (a nie systemowy menedżer pakietów), wbudowane `fetch()` używa
dołączonego do nvm magazynu CA, w którym może brakować nowoczesnych głównych CA (ISRG Root X1/X2 dla Let's Encrypt,
DigiCert Global Root G2 itd.). Powoduje to niepowodzenie `web_fetch` z komunikatem `"fetch failed"` w większości witryn HTTPS.

W systemie Linux OpenClaw automatycznie wykrywa nvm i stosuje poprawkę w rzeczywistym środowisku startowym:

- `openclaw gateway install` zapisuje `NODE_EXTRA_CA_CERTS` w środowisku usługi systemd
- punkt wejścia CLI `openclaw` ponownie uruchamia sam siebie z ustawionym `NODE_EXTRA_CA_CERTS` przed startem Node

**Ręczna poprawka (dla starszych wersji lub bezpośrednich uruchomień `node ...`):**

Wyeksportuj zmienną przed uruchomieniem OpenClaw:

```bash
export NODE_EXTRA_CA_CERTS=/etc/ssl/certs/ca-certificates.crt
openclaw gateway run
```

Nie polegaj na zapisaniu tej zmiennej wyłącznie w `~/.openclaw/.env`; Node odczytuje
`NODE_EXTRA_CA_CERTS` podczas startu procesu.

## Starsze zmienne środowiskowe

OpenClaw odczytuje tylko zmienne środowiskowe `OPENCLAW_*`. Starsze prefiksy
`CLAWDBOT_*` i `MOLTBOT_*` z wcześniejszych wydań są po cichu ignorowane.

Jeśli przy starcie procesu Gateway nadal ustawiono którąkolwiek z nich, OpenClaw emituje
pojedyncze ostrzeżenie o wycofaniu Node (`OPENCLAW_LEGACY_ENV_VARS`), zawierające
wykryte prefiksy i łączną liczbę. Zmień nazwę każdej wartości, zastępując
starszy prefiks prefiksem `OPENCLAW_` (na przykład `CLAWDBOT_GATEWAY_TOKEN` →
`OPENCLAW_GATEWAY_TOKEN`); stare nazwy nie mają żadnego efektu.

## Powiązane

- [Konfiguracja Gateway](/pl/gateway/configuration)
- [FAQ: zmienne środowiskowe i ładowanie .env](/pl/help/faq#env-vars-and-env-loading)
- [Omówienie modeli](/pl/concepts/models)
