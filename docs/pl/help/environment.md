---
read_when:
    - Musisz wiedzieć, które zmienne środowiskowe są ładowane i w jakiej kolejności
    - Debugujesz brakujące klucze API w Gateway
    - Dokumentujesz uwierzytelnianie dostawcy lub środowiska wdrożeniowe
summary: Skąd OpenClaw ładuje zmienne środowiskowe i jaka jest kolejność pierwszeństwa
title: Zmienne środowiskowe
x-i18n:
    generated_at: "2026-04-24T09:13:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: b0538e07cc2f785224b5f061bdaee982c4c849838e9d637defcc86a5121710df
    source_path: help/environment.md
    workflow: 15
---

OpenClaw pobiera zmienne środowiskowe z wielu źródeł. Zasada brzmi: **nigdy nie nadpisuj istniejących wartości**.

## Pierwszeństwo (od najwyższego do najniższego)

1. **Środowisko procesu** (to, co proces Gateway już ma z nadrzędnej powłoki/daemona).
2. **`.env` w bieżącym katalogu roboczym** (domyślne zachowanie dotenv; bez nadpisywania).
3. **Globalny `.env`** w `~/.openclaw/.env` (czyli `$OPENCLAW_STATE_DIR/.env`; bez nadpisywania).
4. **Blok `env` w konfiguracji** w `~/.openclaw/openclaw.json` (stosowany tylko wtedy, gdy brakuje wartości).
5. **Opcjonalny import powłoki logowania** (`env.shellEnv.enabled` lub `OPENCLAW_LOAD_SHELL_ENV=1`), stosowany tylko dla brakujących oczekiwanych kluczy.

W przypadku świeżych instalacji Ubuntu używających domyślnego katalogu stanu OpenClaw traktuje także `~/.config/openclaw/gateway.env` jako zgodny wstecz fallback po globalnym `.env`. Jeśli oba pliki istnieją i różnią się, OpenClaw zachowuje `~/.openclaw/.env` i wypisuje ostrzeżenie.

Jeśli plik konfiguracji w ogóle nie istnieje, krok 4 jest pomijany; import powłoki nadal działa, jeśli jest włączony.

## Blok `env` w konfiguracji

Dwa równoważne sposoby ustawiania zmiennych env inline (oba bez nadpisywania):

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

## Zmienne env wstrzykiwane w runtime

OpenClaw wstrzykuje także znaczniki kontekstu do uruchamianych procesów potomnych:

- `OPENCLAW_SHELL=exec`: ustawiane dla poleceń uruchamianych przez narzędzie `exec`.
- `OPENCLAW_SHELL=acp`: ustawiane dla uruchomień procesów backendu runtime ACP (na przykład `acpx`).
- `OPENCLAW_SHELL=acp-client`: ustawiane dla `openclaw acp client`, gdy uruchamia proces mostu ACP.
- `OPENCLAW_SHELL=tui-local`: ustawiane dla lokalnych poleceń powłoki `!` w TUI.

To znaczniki runtime (nie wymagana konfiguracja użytkownika). Mogą być używane w logice powłoki/profilu
do stosowania reguł specyficznych dla kontekstu.

## Zmienne env interfejsu

- `OPENCLAW_THEME=light`: wymusza jasną paletę TUI, gdy terminal ma jasne tło.
- `OPENCLAW_THEME=dark`: wymusza ciemną paletę TUI.
- `COLORFGBG`: jeśli terminal ją eksportuje, OpenClaw używa wskazówki koloru tła do automatycznego wyboru palety TUI.

## Podstawianie zmiennych env w konfiguracji

Możesz odwoływać się bezpośrednio do zmiennych env w wartościach ciągów konfiguracji, używając składni `${VAR_NAME}`:

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

Pełne szczegóły znajdziesz w [Configuration: Env var substitution](/pl/gateway/configuration-reference#env-var-substitution).

## Referencje SecretRef vs ciągi `${ENV}`

OpenClaw obsługuje dwa wzorce oparte na env:

- podstawianie ciągów `${VAR}` w wartościach konfiguracji.
- obiekty SecretRef (`{ source: "env", provider: "default", id: "VAR" }`) dla pól obsługujących referencje do sekretów.

Oba są rozstrzygane ze środowiska procesu w czasie aktywacji. Szczegóły SecretRef opisano w [Secrets Management](/pl/gateway/secrets).

## Zmienne env związane ze ścieżkami

| Zmienna               | Cel                                                                                                                                                                              |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_HOME`       | Nadpisuje katalog domowy używany do całego wewnętrznego rozstrzygania ścieżek (`~/.openclaw/`, katalogi agentów, sesje, poświadczenia). Przydatne przy uruchamianiu OpenClaw jako dedykowanego użytkownika usługi. |
| `OPENCLAW_STATE_DIR`  | Nadpisuje katalog stanu (domyślnie `~/.openclaw`).                                                                                                                               |
| `OPENCLAW_CONFIG_PATH`| Nadpisuje ścieżkę pliku konfiguracji (domyślnie `~/.openclaw/openclaw.json`).                                                                                                   |

## Logowanie

| Zmienna             | Cel                                                                                                                                                                                          |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_LOG_LEVEL`| Nadpisuje poziom logów zarówno dla pliku, jak i konsoli (np. `debug`, `trace`). Ma pierwszeństwo przed `logging.level` i `logging.consoleLevel` w konfiguracji. Nieprawidłowe wartości są ignorowane z ostrzeżeniem. |

### `OPENCLAW_HOME`

Po ustawieniu `OPENCLAW_HOME` zastępuje katalog domowy systemu (`$HOME` / `os.homedir()`) dla całego wewnętrznego rozstrzygania ścieżek. Umożliwia to pełną izolację systemu plików dla bezgłowych kont usług.

**Pierwszeństwo:** `OPENCLAW_HOME` > `$HOME` > `USERPROFILE` > `os.homedir()`

**Przykład** (macOS LaunchDaemon):

```xml
<key>EnvironmentVariables</key>
<dict>
  <key>OPENCLAW_HOME</key>
  <string>/Users/user</string>
</dict>
```

`OPENCLAW_HOME` może być także ustawione na ścieżkę z tyldą (np. `~/svc`), która przed użyciem zostaje rozwinięta przy użyciu `$HOME`.

## Użytkownicy nvm: błędy TLS `web_fetch`

Jeśli Node.js został zainstalowany przez **nvm** (a nie przez systemowego menedżera pakietów), wbudowane `fetch()` używa
dołączonego przez nvm magazynu CA, w którym mogą brakować nowoczesnych głównych CA (ISRG Root X1/X2 dla Let's Encrypt,
DigiCert Global Root G2 itd.). Powoduje to błędy `web_fetch` z komunikatem `"fetch failed"` na większości witryn HTTPS.

W systemie Linux OpenClaw automatycznie wykrywa nvm i stosuje poprawkę w rzeczywistym środowisku startowym:

- `openclaw gateway install` zapisuje `NODE_EXTRA_CA_CERTS` do środowiska usługi systemd
- punkt wejścia CLI `openclaw` wykonuje ponowne uruchomienie samego siebie z ustawionym `NODE_EXTRA_CA_CERTS` przed startem Node

**Ręczna poprawka (dla starszych wersji lub bezpośrednich uruchomień `node ...`):**

Wyeksportuj zmienną przed uruchomieniem OpenClaw:

```bash
export NODE_EXTRA_CA_CERTS=/etc/ssl/certs/ca-certificates.crt
openclaw gateway run
```

Nie polegaj wyłącznie na zapisie tej zmiennej do `~/.openclaw/.env`; Node odczytuje
`NODE_EXTRA_CA_CERTS` przy starcie procesu.

## Powiązane

- [Konfiguracja Gateway](/pl/gateway/configuration)
- [FAQ: zmienne env i ładowanie .env](/pl/help/faq#env-vars-and-env-loading)
- [Przegląd modeli](/pl/concepts/models)
