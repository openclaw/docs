---
read_when:
    - Musisz wiedzieć, które zmienne env są ładowane i w jakiej kolejności
    - Debugujesz brakujące klucze API w Gateway
    - Dokumentujesz uwierzytelnianie providera lub środowiska wdrożeniowe
summary: Skąd OpenClaw ładuje zmienne środowiskowe i jaka jest kolejność pierwszeństwa
title: Zmienne środowiskowe
x-i18n:
    generated_at: "2026-04-05T13:55:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: a80aea69ca2ffe19a4e93140f05dd81fd576955562ff9913135d38a685a0353c
    source_path: help/environment.md
    workflow: 15
---

# Zmienne środowiskowe

OpenClaw pobiera zmienne środowiskowe z wielu źródeł. Zasada brzmi: **nigdy nie nadpisuj istniejących wartości**.

## Pierwszeństwo (od najwyższego → do najniższego)

1. **Środowisko procesu** (to, co proces Gateway już ma od nadrzędnej powłoki/demona).
2. **`.env` w bieżącym katalogu roboczym** (domyślne zachowanie dotenv; bez nadpisywania).
3. **Globalny `.env`** w `~/.openclaw/.env` (czyli `$OPENCLAW_STATE_DIR/.env`; bez nadpisywania).
4. **Blok `env` w config** w `~/.openclaw/openclaw.json` (stosowany tylko wtedy, gdy brakuje wartości).
5. **Opcjonalny import login shell** (`env.shellEnv.enabled` lub `OPENCLAW_LOAD_SHELL_ENV=1`), stosowany tylko dla brakujących oczekiwanych kluczy.

W świeżych instalacjach Ubuntu korzystających z domyślnego katalogu stanu OpenClaw traktuje także `~/.config/openclaw/gateway.env` jako zgodny wstecz fallback po globalnym `.env`. Jeśli oba pliki istnieją i różnią się, OpenClaw zachowuje `~/.openclaw/.env` i drukuje ostrzeżenie.

Jeśli plik config w ogóle nie istnieje, krok 4 jest pomijany; import powłoki nadal działa, jeśli jest włączony.

## Blok `env` w config

Dwa równoważne sposoby ustawiania wbudowanych zmiennych env (oba bez nadpisywania):

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

`env.shellEnv` uruchamia Twoją login shell i importuje tylko **brakujące** oczekiwane klucze:

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

## Zmienne env wstrzykiwane w runtime

OpenClaw wstrzykuje też znaczniki kontekstu do uruchamianych procesów potomnych:

- `OPENCLAW_SHELL=exec`: ustawiane dla poleceń uruchamianych przez narzędzie `exec`.
- `OPENCLAW_SHELL=acp`: ustawiane dla uruchomień procesów backendu runtime ACP (na przykład `acpx`).
- `OPENCLAW_SHELL=acp-client`: ustawiane dla `openclaw acp client`, gdy uruchamia proces mostka ACP.
- `OPENCLAW_SHELL=tui-local`: ustawiane dla lokalnych poleceń powłoki TUI `!`.

Są to znaczniki runtime (nie wymagają konfiguracji użytkownika). Można ich używać w logice powłoki/profilu
do stosowania reguł specyficznych dla kontekstu.

## Zmienne env UI

- `OPENCLAW_THEME=light`: wymuś jasną paletę TUI, gdy terminal ma jasne tło.
- `OPENCLAW_THEME=dark`: wymuś ciemną paletę TUI.
- `COLORFGBG`: jeśli terminal ją eksportuje, OpenClaw używa wskazówki koloru tła do automatycznego wyboru palety TUI.

## Podstawianie zmiennych env w config

Możesz odwoływać się bezpośrednio do zmiennych env w wartościach stringów config przy użyciu składni `${VAR_NAME}`:

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

Pełne informacje znajdziesz w [Configuration: Env var substitution](/gateway/configuration-reference#env-var-substitution).

## Secret refs a stringi `${ENV}`

OpenClaw obsługuje dwa wzorce oparte na env:

- podstawianie stringów `${VAR}` w wartościach config;
- obiekty SecretRef (`{ source: "env", provider: "default", id: "VAR" }`) dla pól obsługujących odwołania do sekretów.

Oba są rozwiązywane z env procesu w momencie aktywacji. Szczegóły SecretRef opisano w [Secrets Management](/gateway/secrets).

## Zmienne env związane ze ścieżkami

| Zmienna               | Cel                                                                                                                                                                             |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_HOME`       | Nadpisuje katalog domowy używany do całego wewnętrznego rozwiązywania ścieżek (`~/.openclaw/`, katalogi agentów, sesje, poświadczenia). Przydatne przy uruchamianiu OpenClaw jako dedykowany użytkownik usługi. |
| `OPENCLAW_STATE_DIR`  | Nadpisuje katalog stanu (domyślnie `~/.openclaw`).                                                                                                                              |
| `OPENCLAW_CONFIG_PATH` | Nadpisuje ścieżkę pliku config (domyślnie `~/.openclaw/openclaw.json`).                                                                                                       |

## Logowanie

| Zmienna             | Cel                                                                                                                                                                                         |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_LOG_LEVEL` | Nadpisuje poziom logowania zarówno dla pliku, jak i konsoli (np. `debug`, `trace`). Ma pierwszeństwo przed `logging.level` i `logging.consoleLevel` w config. Nieprawidłowe wartości są ignorowane z ostrzeżeniem. |

### `OPENCLAW_HOME`

Gdy jest ustawione, `OPENCLAW_HOME` zastępuje systemowy katalog domowy (`$HOME` / `os.homedir()`) dla całego wewnętrznego rozwiązywania ścieżek. Umożliwia to pełną izolację systemu plików dla bezgłowych kont usług.

**Pierwszeństwo:** `OPENCLAW_HOME` > `$HOME` > `USERPROFILE` > `os.homedir()`

**Przykład** (macOS LaunchDaemon):

```xml
<key>EnvironmentVariables</key>
<dict>
  <key>OPENCLAW_HOME</key>
  <string>/Users/user</string>
</dict>
```

`OPENCLAW_HOME` można również ustawić jako ścieżkę z tyldą (np. `~/svc`), która przed użyciem zostanie rozwinięta z użyciem `$HOME`.

## Użytkownicy nvm: błędy TLS w `web_fetch`

Jeśli Node.js został zainstalowany przez **nvm** (a nie systemowy menedżer pakietów), wbudowane `fetch()` używa
bundlowanego magazynu CA nvm, któremu mogą brakować nowoczesnych głównych urzędów certyfikacji (ISRG Root X1/X2 dla Let's Encrypt,
DigiCert Global Root G2 itd.). Powoduje to, że `web_fetch` kończy się błędem `"fetch failed"` na większości witryn HTTPS.

W Linuksie OpenClaw automatycznie wykrywa nvm i stosuje poprawkę w rzeczywistym środowisku startowym:

- `openclaw gateway install` zapisuje `NODE_EXTRA_CA_CERTS` do środowiska usługi systemd
- entrypoint CLI `openclaw` ponownie uruchamia sam siebie z ustawionym `NODE_EXTRA_CA_CERTS` przed startem Node

**Naprawa ręczna** (dla starszych wersji lub bezpośrednich uruchomień `node ...`):

Wyeksportuj zmienną przed uruchomieniem OpenClaw:

```bash
export NODE_EXTRA_CA_CERTS=/etc/ssl/certs/ca-certificates.crt
openclaw gateway run
```

Nie polegaj wyłącznie na zapisaniu tej zmiennej do `~/.openclaw/.env`; Node odczytuje
`NODE_EXTRA_CA_CERTS` przy starcie procesu.

## Powiązane

- [Gateway configuration](/gateway/configuration)
- [FAQ: env vars and .env loading](/help/faq#env-vars-and-env-loading)
- [Models overview](/concepts/models)
