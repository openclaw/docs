---
read_when:
    - Musisz wiedzieć, które zmienne środowiskowe są wczytywane i w jakiej kolejności
    - Debugujesz brakujące klucze API w Gateway
    - Dokumentujesz uwierzytelnianie dostawcy lub środowiska wdrożeniowe
summary: Skąd OpenClaw wczytuje zmienne środowiskowe i kolejność pierwszeństwa
title: Zmienne środowiskowe
x-i18n:
    generated_at: "2026-05-11T20:31:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: b4b91e9bb3c386292f11a3ffe5ae718a74a800bd19fe95073da990d881e6069d
    source_path: help/environment.md
    workflow: 16
---

OpenClaw pobiera zmienne środowiskowe z wielu źródeł. Zasada brzmi: **nigdy nie nadpisuj istniejących wartości**.

## Priorytet (najwyższy → najniższy)

1. **Środowisko procesu** (to, co proces Gateway ma już z nadrzędnej powłoki/demona).
2. **`.env` w bieżącym katalogu roboczym** (domyślne dotenv; nie nadpisuje).
3. **Globalny `.env`** w `~/.openclaw/.env` (czyli `$OPENCLAW_STATE_DIR/.env`; nie nadpisuje).
4. **Blok `env` w konfiguracji** w `~/.openclaw/openclaw.json` (stosowany tylko wtedy, gdy brakuje wartości).
5. **Opcjonalny import z powłoki logowania** (`env.shellEnv.enabled` lub `OPENCLAW_LOAD_SHELL_ENV=1`), stosowany tylko dla brakujących oczekiwanych kluczy.

W świeżych instalacjach Ubuntu używających domyślnego katalogu stanu OpenClaw traktuje też `~/.config/openclaw/gateway.env` jako zapasową ścieżkę zgodności po globalnym `.env`. Jeśli oba pliki istnieją i są ze sobą sprzeczne, OpenClaw zachowuje `~/.openclaw/.env` i wyświetla ostrzeżenie.

Jeśli plik konfiguracyjny w ogóle nie istnieje, krok 4 jest pomijany; import z powłoki nadal działa, jeśli jest włączony.

## Blok `env` w konfiguracji

Dwa równoważne sposoby ustawiania wbudowanych zmiennych env (oba nie nadpisują istniejących wartości):

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

## Import env z powłoki

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

Odpowiedniki jako zmienne env:

- `OPENCLAW_LOAD_SHELL_ENV=1`
- `OPENCLAW_SHELL_ENV_TIMEOUT_MS=15000`

## Zmienne env wstrzykiwane w czasie działania

OpenClaw wstrzykuje też znaczniki kontekstu do uruchamianych procesów podrzędnych:

- `OPENCLAW_SHELL=exec`: ustawiane dla poleceń uruchamianych przez narzędzie `exec`.
- `OPENCLAW_SHELL=acp`: ustawiane dla uruchomień procesów zaplecza środowiska uruchomieniowego ACP (na przykład `acpx`).
- `OPENCLAW_SHELL=acp-client`: ustawiane dla `openclaw acp client`, gdy uruchamia proces mostka ACP.
- `OPENCLAW_SHELL=tui-local`: ustawiane dla lokalnych poleceń powłoki TUI `!`.

Są to znaczniki czasu działania (nie wymagana konfiguracja użytkownika). Można ich używać w logice powłoki/profilu
do stosowania reguł zależnych od kontekstu.

## Zmienne env UI

- `OPENCLAW_THEME=light`: wymusza jasną paletę TUI, gdy terminal ma jasne tło.
- `OPENCLAW_THEME=dark`: wymusza ciemną paletę TUI.
- `COLORFGBG`: jeśli terminal ją eksportuje, OpenClaw używa wskazówki koloru tła do automatycznego wyboru palety TUI.

## Podstawianie zmiennych env w konfiguracji

Możesz odwoływać się do zmiennych env bezpośrednio w wartościach ciągów konfiguracji przy użyciu składni `${VAR_NAME}`:

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

Pełne szczegóły znajdziesz w sekcji [Konfiguracja: podstawianie zmiennych env](/pl/gateway/configuration-reference#env-var-substitution).

## Odwołania do sekretów a ciągi `${ENV}`

OpenClaw obsługuje dwa wzorce oparte na env:

- Podstawianie ciągów `${VAR}` w wartościach konfiguracji.
- Obiekty SecretRef (`{ source: "env", provider: "default", id: "VAR" }`) dla pól, które obsługują odwołania do sekretów.

Oba są rozwiązywane ze środowiska procesu w momencie aktywacji. Szczegóły SecretRef są udokumentowane w sekcji [Zarządzanie sekretami](/pl/gateway/secrets).

## Zmienne env związane ze ścieżkami

| Zmienna                  | Cel                                                                                                                                                                                                 |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_HOME`          | Nadpisuje katalog domowy używany do całego wewnętrznego rozwiązywania ścieżek (`~/.openclaw/`, katalogi agentów, sesje, poświadczenia). Przydatne podczas uruchamiania OpenClaw jako dedykowany użytkownik usługi. |
| `OPENCLAW_STATE_DIR`     | Nadpisuje katalog stanu (domyślnie `~/.openclaw`).                                                                                                                                                  |
| `OPENCLAW_CONFIG_PATH`   | Nadpisuje ścieżkę pliku konfiguracyjnego (domyślnie `~/.openclaw/openclaw.json`).                                                                                                                    |
| `OPENCLAW_INCLUDE_ROOTS` | Lista ścieżek katalogów, w których dyrektywy `$include` mogą rozwiązywać pliki poza katalogiem konfiguracji (domyślnie: brak — `$include` jest ograniczone do katalogu konfiguracji). Rozwijane z tyldą. |

## Logowanie

| Zmienna                          | Cel                                                                                                                                                                                                 |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_LOG_LEVEL`             | Nadpisuje poziom logowania dla pliku i konsoli (np. `debug`, `trace`). Ma pierwszeństwo przed `logging.level` i `logging.consoleLevel` w konfiguracji. Nieprawidłowe wartości są ignorowane z ostrzeżeniem. |
| `OPENCLAW_DEBUG_MODEL_TRANSPORT` | Emituje ukierunkowaną diagnostykę czasu żądań/odpowiedzi modelu na poziomie `info` bez włączania globalnych logów debugowania.                                                                       |
| `OPENCLAW_DEBUG_MODEL_PAYLOAD`   | Diagnostyka ładunku modelu: `summary`, `tools` lub `full-redacted`. `full-redacted` jest ograniczone i zredagowane, ale może zawierać tekst promptu/wiadomości.                                      |
| `OPENCLAW_DEBUG_SSE`             | Diagnostyka strumieniowania: `events` dla czasu pierwszego/ukończonego zdarzenia, `peek`, aby uwzględnić pierwsze pięć zredagowanych zdarzeń SSE.                                                    |
| `OPENCLAW_DEBUG_CODE_MODE`       | Diagnostyka powierzchni modelu w trybie kodu, w tym ukrywanie narzędzi providera oraz wymuszanie tylko exec/wait.                                                                                     |

### `OPENCLAW_HOME`

Gdy jest ustawione, `OPENCLAW_HOME` zastępuje systemowy katalog domowy (`$HOME` / `os.homedir()`) dla całego wewnętrznego rozwiązywania ścieżek. Umożliwia to pełną izolację systemu plików dla bezgłowych kont usługowych.

**Priorytet:** `OPENCLAW_HOME` > `$HOME` > `USERPROFILE` > `os.homedir()`

**Przykład** (macOS LaunchDaemon):

```xml
<key>EnvironmentVariables</key>
<dict>
  <key>OPENCLAW_HOME</key>
  <string>/Users/user</string>
</dict>
```

`OPENCLAW_HOME` można też ustawić na ścieżkę z tyldą (np. `~/svc`), która przed użyciem zostanie rozwinięta przy użyciu `$HOME`.

## Użytkownicy nvm: błędy TLS w web_fetch

Jeśli Node.js został zainstalowany przez **nvm** (a nie systemowego menedżera pakietów), wbudowane `fetch()` używa
dołączonego magazynu CA z nvm, w którym może brakować nowoczesnych głównych CA (ISRG Root X1/X2 dla Let's Encrypt,
DigiCert Global Root G2 itd.). Powoduje to niepowodzenie `web_fetch` z błędem `"fetch failed"` w większości witryn HTTPS.

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
`NODE_EXTRA_CA_CERTS` przy starcie procesu.

## Starsze zmienne środowiskowe

OpenClaw odczytuje tylko zmienne środowiskowe `OPENCLAW_*`. Starsze prefiksy
`CLAWDBOT_*` i `MOLTBOT_*` z wcześniejszych wersji są po cichu
ignorowane.

Jeśli którekolwiek z nich nadal są ustawione w procesie Gateway podczas startu, OpenClaw emituje
pojedyncze ostrzeżenie o wycofaniu Node (`OPENCLAW_LEGACY_ENV_VARS`) z listą
wykrytych prefiksów i łączną liczbą. Zmień nazwę każdej wartości, zastępując
starszy prefiks prefiksem `OPENCLAW_` (na przykład `CLAWDBOT_GATEWAY_TOKEN` →
`OPENCLAW_GATEWAY_TOKEN`); stare nazwy nie mają żadnego efektu.

## Powiązane

- [Konfiguracja Gateway](/pl/gateway/configuration)
- [FAQ: zmienne env i ładowanie .env](/pl/help/faq#env-vars-and-env-loading)
- [Omówienie modeli](/pl/concepts/models)
