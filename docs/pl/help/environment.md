---
read_when:
    - Musisz wiedzieć, które zmienne środowiskowe są ładowane i w jakiej kolejności
    - Debugujesz brakujące klucze API w Gateway
    - Dokumentujesz uwierzytelnianie dostawcy lub środowiska wdrożeniowe
summary: Gdzie OpenClaw ładuje zmienne środowiskowe i kolejność pierwszeństwa
title: Zmienne środowiskowe
x-i18n:
    generated_at: "2026-06-27T17:39:32Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7e36f93efe29f9cc0e9942659c323a635d21fcaa436427dcb21f5694e5d0458b
    source_path: help/environment.md
    workflow: 16
---

OpenClaw pobiera zmienne środowiskowe z wielu źródeł. Zasada brzmi: **nigdy nie zastępuj istniejących wartości**.
Pliki `.env` w obszarze roboczym są źródłem o niższym poziomie zaufania: OpenClaw ignoruje dane uwierzytelniające dostawców i chronione ustawienia sterujące runtime z pliku `.env` obszaru roboczego przed zastosowaniem pierwszeństwa.

## Pierwszeństwo (najwyższe → najniższe)

1. **Środowisko procesu** (to, co proces Gateway ma już z nadrzędnej powłoki/demona).
2. **`.env` w bieżącym katalogu roboczym** (domyślne dotenv; nie zastępuje; dane uwierzytelniające dostawców i chronione ustawienia sterujące runtime są ignorowane).
3. **Globalny `.env`** w `~/.openclaw/.env` (czyli `$OPENCLAW_STATE_DIR/.env`; zalecane dla kluczy API dostawców; nie zastępuje).
4. **Blok `env` konfiguracji** w `~/.openclaw/openclaw.json` (stosowany tylko wtedy, gdy brakuje wartości).
5. **Opcjonalny import z powłoki logowania** (`env.shellEnv.enabled` lub `OPENCLAW_LOAD_SHELL_ENV=1`), stosowany tylko dla brakujących oczekiwanych kluczy.

W świeżych instalacjach Ubuntu, które używają domyślnego katalogu stanu, OpenClaw traktuje również `~/.config/openclaw/gateway.env` jako zgodnościowy fallback po globalnym `.env`. Jeśli oba pliki istnieją i są niespójne, OpenClaw zachowuje `~/.openclaw/.env` i wypisuje ostrzeżenie.

Jeśli pliku konfiguracji w ogóle brakuje, krok 4 jest pomijany; import z powłoki nadal działa, jeśli jest włączony.

## Dane uwierzytelniające dostawców i `.env` obszaru roboczego

Nie przechowuj kluczy API dostawców wyłącznie w pliku `.env` obszaru roboczego. OpenClaw ignoruje zmienne środowiskowe z danymi uwierzytelniającymi dostawców z plików `.env` obszaru roboczego, w tym typowe klucze, takie jak `GEMINI_API_KEY`, `GOOGLE_API_KEY`, `XAI_API_KEY`, `MISTRAL_API_KEY`, `GROQ_API_KEY`, `DEEPSEEK_API_KEY`, `PERPLEXITY_API_KEY`, `BRAVE_API_KEY`, `TAVILY_API_KEY`, `EXA_API_KEY` i `FIRECRAWL_API_KEY`.

Użyj jednego z tych zaufanych źródeł dla danych uwierzytelniających dostawców:

- Środowisko procesu Gateway, takie jak powłoka, jednostka launchd/systemd, sekret kontenera lub sekret CI.
- Globalny plik dotenv runtime w `~/.openclaw/.env` lub `$OPENCLAW_STATE_DIR/.env`.
- Blok `env` konfiguracji w `~/.openclaw/openclaw.json`.
- Opcjonalny import z powłoki logowania, gdy włączone jest `env.shellEnv.enabled` lub `OPENCLAW_LOAD_SHELL_ENV=1`.

Jeśli wcześniej przechowywano klucze dostawców wyłącznie w pliku `.env` obszaru roboczego, przenieś je do jednego z powyższych zaufanych źródeł. Plik `.env` obszaru roboczego nadal może dostarczać zwykłe zmienne projektu, które nie są danymi uwierzytelniającymi, przekierowaniami endpointów, nadpisaniami hostów ani ustawieniami sterującymi runtime `OPENCLAW_*`.

Zobacz [Pliki `.env` obszaru roboczego](/pl/gateway/security#workspace-env-files), aby poznać uzasadnienie bezpieczeństwa.

## Blok `env` konfiguracji

Dwa równoważne sposoby ustawiania wbudowanych zmiennych środowiskowych (oba bez zastępowania):

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

Blok `env` konfiguracji akceptuje tylko dosłowne wartości tekstowe. Nie rozwija
wartości `file:...`; na przykład `XAI_API_KEY: "file:secrets/xai-api-key.txt"`
jest przekazywane dostawcom jako dokładnie ten ciąg znaków.

Dla kluczy dostawców opartych na plikach użyj SecretRef w polu danych uwierzytelniających, które
to obsługuje:

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

Zobacz [Zarządzanie sekretami](/pl/gateway/secrets) oraz
[powierzchnię danych uwierzytelniających SecretRef](/pl/reference/secretref-credential-surface), aby poznać
obsługiwane pola.

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

## Migawki powłoki exec

Na hostach Gateway innych niż Windows polecenia bash i zsh `exec` domyślnie używają migawki startowej.
Ustaw `OPENCLAW_EXEC_SHELL_SNAPSHOT=0` w środowisku procesu Gateway, aby wyłączyć tę ścieżkę.
Wartości `false`, `no` i `off` również ją wyłączają. Wartości `exec.env` dla pojedynczego wywołania nie mogą przełączać
migawek ani przekierowywać pamięci podręcznej migawek.

## Zmienne środowiskowe wstrzykiwane przez runtime

OpenClaw wstrzykuje również znaczniki kontekstu do uruchamianych procesów potomnych:

- `OPENCLAW_SHELL=exec`: ustawiane dla poleceń uruchamianych przez narzędzie `exec`.
- `OPENCLAW_SHELL=acp`: ustawiane dla uruchomień procesów backendu runtime ACP (na przykład `acpx`).
- `OPENCLAW_SHELL=acp-client`: ustawiane dla `openclaw acp client`, gdy uruchamia proces mostka ACP.
- `OPENCLAW_SHELL=tui-local`: ustawiane dla lokalnych poleceń powłoki TUI `!`.
- `OPENCLAW_CLI=1`: ustawiane dla procesów potomnych uruchamianych przez punkt wejścia CLI.

Są to znaczniki runtime (nie wymagana konfiguracja użytkownika). Można ich używać w logice powłoki/profilu
do stosowania reguł zależnych od kontekstu.

## Zmienne środowiskowe UI

- `OPENCLAW_THEME=light`: wymuś jasną paletę TUI, gdy terminal ma jasne tło.
- `OPENCLAW_THEME=dark`: wymuś ciemną paletę TUI.
- `COLORFGBG`: jeśli terminal ją eksportuje, OpenClaw używa wskazówki koloru tła do automatycznego wyboru palety TUI.

## Podstawianie zmiennych środowiskowych w konfiguracji

Możesz odwoływać się do zmiennych środowiskowych bezpośrednio w tekstowych wartościach konfiguracji, używając składni `${VAR_NAME}`:

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

Zobacz [Konfiguracja: podstawianie zmiennych środowiskowych](/pl/gateway/configuration-reference#env-var-substitution), aby poznać pełne szczegóły.

## Odwołania do sekretów a ciągi `${ENV}`

OpenClaw obsługuje dwa wzorce oparte na środowisku:

- Podstawianie ciągów `${VAR}` w wartościach konfiguracji.
- Obiekty SecretRef (`{ source: "env", provider: "default", id: "VAR" }`) dla pól, które obsługują odwołania do sekretów.

Oba są rozwiązywane ze środowiska procesu w momencie aktywacji. Szczegóły SecretRef opisano w [Zarządzaniu sekretami](/pl/gateway/secrets).
Sam blok `env` konfiguracji nie rozwiązuje SecretRefs ani skróconych wartości
`file:...`.

## Zmienne środowiskowe związane ze ścieżkami

| Zmienna                  | Cel                                                                                                                                                                                                                                                    |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `OPENCLAW_HOME`          | Nadpisuje katalog domowy używany dla wewnętrznych domyślnych ścieżek OpenClaw (`~/.openclaw/`, katalogi agentów, sesje, dane uwierzytelniające, onboarding instalatora oraz domyślny checkout deweloperski). Przydatne przy uruchamianiu OpenClaw jako dedykowany użytkownik usługi. |
| `OPENCLAW_STATE_DIR`     | Nadpisuje katalog stanu (domyślnie `~/.openclaw`).                                                                                                                                                                                                     |
| `OPENCLAW_CONFIG_PATH`   | Nadpisuje ścieżkę pliku konfiguracji (domyślnie `~/.openclaw/openclaw.json`).                                                                                                                                                                          |
| `OPENCLAW_INCLUDE_ROOTS` | Lista ścieżek katalogów, w których dyrektywy `$include` mogą rozwiązywać pliki poza katalogiem konfiguracji (domyślnie: brak — `$include` jest ograniczone do katalogu konfiguracji). Rozwija tyldę.                                                   |

## Logowanie

| Zmienna                          | Cel                                                                                                                                                                                                 |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_LOG_LEVEL`             | Nadpisuje poziom logowania zarówno dla pliku, jak i konsoli (np. `debug`, `trace`). Ma pierwszeństwo przed `logging.level` i `logging.consoleLevel` w konfiguracji. Nieprawidłowe wartości są ignorowane z ostrzeżeniem. |
| `OPENCLAW_DEBUG_MODEL_TRANSPORT` | Emituje ukierunkowaną diagnostykę czasów żądań/odpowiedzi modelu na poziomie `info` bez włączania globalnych logów debug.                                                                           |
| `OPENCLAW_DEBUG_MODEL_PAYLOAD`   | Diagnostyka ładunku modelu: `summary`, `tools` lub `full-redacted`. `full-redacted` jest limitowane i redagowane, ale może zawierać tekst promptu/wiadomości.                                      |
| `OPENCLAW_DEBUG_SSE`             | Diagnostyka streamingu: `events` dla czasu pierwszego/końcowego zdarzenia, `peek` aby dołączyć pierwszych pięć zredagowanych zdarzeń SSE.                                                           |
| `OPENCLAW_DEBUG_CODE_MODE`       | Diagnostyka powierzchni modelu w trybie kodu, w tym ukrywanie narzędzi dostawcy oraz wymuszanie wyłącznie exec/wait.                                                                                |

### `OPENCLAW_HOME`

Gdy ustawione, `OPENCLAW_HOME` zastępuje systemowy katalog domowy (`$HOME` / `os.homedir()`) dla wewnętrznych domyślnych ścieżek OpenClaw. Obejmuje to domyślny katalog stanu, ścieżkę konfiguracji, katalogi agentów, dane uwierzytelniające, obszar roboczy onboardingu instalatora oraz domyślny checkout deweloperski używany przez `openclaw update --channel dev`.

**Pierwszeństwo:** `OPENCLAW_HOME` > `$HOME` > `USERPROFILE` > fallback katalogu domowego Termux `PREFIX` na Androidzie > `os.homedir()`

**Przykład** (macOS LaunchDaemon):

```xml
<key>EnvironmentVariables</key>
<dict>
  <key>OPENCLAW_HOME</key>
  <string>/Users/user</string>
</dict>
```

`OPENCLAW_HOME` można również ustawić na ścieżkę z tyldą (np. `~/svc`), która przed użyciem zostanie rozwinięta przy użyciu tego samego łańcucha fallbacków katalogu domowego systemu operacyjnego.

Jawne zmienne ścieżek, takie jak `OPENCLAW_STATE_DIR`, `OPENCLAW_CONFIG_PATH` i `OPENCLAW_GIT_DIR`, nadal mają pierwszeństwo. Zadania konta systemu operacyjnego, takie jak wykrywanie plików startowych powłoki, konfiguracja menedżera pakietów i rozwijanie `~` hosta, mogą nadal używać rzeczywistego systemowego katalogu domowego.

## Użytkownicy nvm: błędy TLS web_fetch

Jeśli Node.js zainstalowano przez **nvm** (a nie systemowy menedżer pakietów), wbudowane `fetch()` używa
dołączonego do nvm magazynu CA, w którym może brakować nowoczesnych głównych CA (ISRG Root X1/X2 dla Let's Encrypt,
DigiCert Global Root G2 itd.). Powoduje to awarię `web_fetch` z `"fetch failed"` na większości stron HTTPS.

Na Linuksie OpenClaw automatycznie wykrywa nvm i stosuje poprawkę w rzeczywistym środowisku startowym:

- `openclaw gateway install` zapisuje `NODE_EXTRA_CA_CERTS` w środowisku usługi systemd
- punkt wejścia CLI `openclaw` uruchamia się ponownie z ustawionym `NODE_EXTRA_CA_CERTS` przed startem Node

**Ręczna poprawka (dla starszych wersji lub bezpośrednich uruchomień `node ...`):**

Wyeksportuj zmienną przed uruchomieniem OpenClaw:

```bash
export NODE_EXTRA_CA_CERTS=/etc/ssl/certs/ca-certificates.crt
openclaw gateway run
```

Nie polegaj na zapisywaniu tej zmiennej wyłącznie do `~/.openclaw/.env`; Node odczytuje
`NODE_EXTRA_CA_CERTS` przy starcie procesu.

## Starsze zmienne środowiskowe

OpenClaw odczytuje tylko zmienne środowiskowe `OPENCLAW_*`. Starsze
prefiksy `CLAWDBOT_*` i `MOLTBOT_*` z wcześniejszych wydań są po cichu
ignorowane.

Jeśli któreś z nich są nadal ustawione w procesie Gateway podczas startu, OpenClaw emituje
pojedyncze ostrzeżenie o wycofaniu Node (`OPENCLAW_LEGACY_ENV_VARS`) zawierające listę
wykrytych prefiksów i łączną liczbę. Zmień nazwę każdej wartości, zastępując
starszy prefiks prefiksem `OPENCLAW_` (na przykład `CLAWDBOT_GATEWAY_TOKEN` →
`OPENCLAW_GATEWAY_TOKEN`); stare nazwy nie mają żadnego efektu.

## Powiązane

- [Konfiguracja Gateway](/pl/gateway/configuration)
- [FAQ: zmienne środowiskowe i ładowanie .env](/pl/help/faq#env-vars-and-env-loading)
- [Omówienie modeli](/pl/concepts/models)
