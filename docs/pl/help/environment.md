---
read_when:
    - Musisz wiedzieć, które zmienne środowiskowe są wczytywane i w jakiej kolejności
    - Debugujesz brakujące klucze API w Gateway
    - Dokumentujesz uwierzytelnianie dostawcy lub środowiska wdrożeniowe
summary: Skąd OpenClaw wczytuje zmienne środowiskowe i jaka jest kolejność pierwszeństwa
title: Zmienne środowiskowe
x-i18n:
    generated_at: "2026-07-12T15:10:31Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e0010465008969ea1ebf7bb79d01ee86b7be20f7b6d0d90da72d8b0a3b1ed273
    source_path: help/environment.md
    workflow: 16
---

OpenClaw pobiera zmienne środowiskowe z wielu źródeł. Obowiązuje zasada: **nigdy nie zastępuj istniejących wartości**.
Pliki `.env` obszaru roboczego są źródłem o niższym poziomie zaufania: przed zastosowaniem kolejności pierwszeństwa OpenClaw ignoruje w pliku `.env` obszaru roboczego dane uwierzytelniające dostawców i chronione ustawienia sterujące środowiska uruchomieniowego.

## Kolejność pierwszeństwa (od najwyższej do najniższej)

1. **Środowisko procesu** (wartości, które proces Gateway otrzymał już od nadrzędnej powłoki lub demona).
2. **Plik `.env` w bieżącym katalogu roboczym** (domyślne zachowanie dotenv; nie zastępuje wartości; dane uwierzytelniające dostawców i chronione ustawienia sterujące środowiska uruchomieniowego są ignorowane).
3. **Globalny plik `.env`** w `~/.openclaw/.env` (czyli `$OPENCLAW_STATE_DIR/.env`; zalecany dla kluczy API dostawców; nie zastępuje wartości).
4. **Blok `env` konfiguracji** w `~/.openclaw/openclaw.json` (stosowany tylko wtedy, gdy brakuje wartości).
5. **Opcjonalny import z powłoki logowania** (`env.shellEnv.enabled` lub `OPENCLAW_LOAD_SHELL_ENV=1`), stosowany tylko dla brakujących oczekiwanych kluczy.

W nowych instalacjach Ubuntu korzystających z domyślnego katalogu stanu OpenClaw traktuje również `~/.config/openclaw/gateway.env` jako awaryjne źródło zgodności, używane po globalnym pliku `.env`. Jeśli oba pliki istnieją i zawierają sprzeczne wartości, OpenClaw zachowuje wartości z `~/.openclaw/.env` i wyświetla ostrzeżenie.

Jeśli plik konfiguracji w ogóle nie istnieje, krok 4 jest pomijany; import z powłoki nadal jest wykonywany, jeśli został włączony.

## Dane uwierzytelniające dostawców a plik `.env` obszaru roboczego

Nie przechowuj kluczy API dostawców wyłącznie w pliku `.env` obszaru roboczego. OpenClaw blokuje w plikach `.env` obszaru roboczego obszerny zestaw kluczy danych uwierzytelniających dostawców i kluczy przekierowujących punkty końcowe, w tym wszystkie znane zmienne środowiskowe uwierzytelniania dostawców (na przykład `GEMINI_API_KEY`, `GOOGLE_API_KEY`, `XAI_API_KEY`, `MISTRAL_API_KEY`, `GROQ_API_KEY`, `DEEPSEEK_API_KEY`, `PERPLEXITY_API_KEY`, `BRAVE_API_KEY`, `TAVILY_API_KEY`, `EXA_API_KEY`, `FIRECRAWL_API_KEY`), a także każdy klucz kończący się na `_API_HOST`, `_BASE_URL` lub `_HOMESERVER` oraz całe przestrzenie nazw `OPENCLAW_*`, `CLAWHUB_*`, `ANTHROPIC_API_KEY_*` i `OPENAI_API_KEY_*`.

Zamiast tego użyj jednego z następujących zaufanych źródeł danych uwierzytelniających dostawców:

- Środowiska procesu Gateway, na przykład powłoki, jednostki launchd/systemd, sekretu kontenera lub sekretu CI.
- Globalnego pliku dotenv środowiska uruchomieniowego w `~/.openclaw/.env` lub `$OPENCLAW_STATE_DIR/.env`.
- Bloku `env` konfiguracji w `~/.openclaw/openclaw.json`.
- Opcjonalnego importu z powłoki logowania, gdy włączono `env.shellEnv.enabled` lub `OPENCLAW_LOAD_SHELL_ENV=1`.

Jeśli wcześniej klucze dostawców były przechowywane wyłącznie w pliku `.env` obszaru roboczego, przenieś je do jednego z wymienionych wyżej zaufanych źródeł. Plik `.env` obszaru roboczego nadal może udostępniać zwykłe zmienne projektu, które nie są danymi uwierzytelniającymi, przekierowaniami punktów końcowych, nadpisaniami hostów ani ustawieniami sterującymi środowiska uruchomieniowego `OPENCLAW_*`.

Uzasadnienie dotyczące bezpieczeństwa zawiera sekcja [Pliki `.env` obszaru roboczego](/pl/gateway/security#workspace-env-files).

## Blok `env` konfiguracji

Dwa równoważne sposoby ustawiania zmiennych środowiskowych bezpośrednio w konfiguracji (oba nie zastępują wartości):

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

Blok `env` konfiguracji przyjmuje wyłącznie literały łańcuchowe. Nie rozwija
wartości `file:...`; na przykład `XAI_API_KEY: "file:secrets/xai-api-key.txt"`
jest przekazywane dostawcom jako dokładnie taki łańcuch.

W przypadku kluczy dostawców przechowywanych w plikach użyj SecretRef w polu danych uwierzytelniających, które
go obsługuje:

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

Obsługiwane pola opisano w sekcjach [Zarządzanie sekretami](/pl/gateway/secrets) oraz
[Zakres danych uwierzytelniających SecretRef](/pl/reference/secretref-credential-surface).

## Import środowiska powłoki

`env.shellEnv` uruchamia powłokę logowania i importuje wyłącznie **brakujące** oczekiwane klucze:

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

Odpowiedniki w postaci zmiennych środowiskowych:

- `OPENCLAW_LOAD_SHELL_ENV=1`
- `OPENCLAW_SHELL_ENV_TIMEOUT_MS=15000` (domyślnie `15000`)

## Migawki powłoki poleceń `exec`

Na hostach Gateway innych niż Windows polecenia `exec` powłok bash i zsh domyślnie korzystają z migawki utworzonej podczas uruchamiania.
Aby wyłączyć tę ścieżkę, ustaw `OPENCLAW_EXEC_SHELL_SNAPSHOT=0` w środowisku procesu Gateway.
Wyłączają ją również wartości `false`, `no` i `off`. Wartości `exec.env` poszczególnych wywołań nie mogą przełączać
migawek ani przekierowywać ich pamięci podręcznej.

## Zmienne środowiskowe wstrzykiwane w czasie działania

OpenClaw wstrzykuje również znaczniki kontekstu do uruchamianych procesów potomnych:

- `OPENCLAW_SHELL=exec`: ustawiana dla poleceń uruchamianych za pomocą narzędzia `exec`.
- `OPENCLAW_SHELL=acp-client`: ustawiana dla `openclaw acp client`, gdy uruchamia proces mostu ACP.
- `OPENCLAW_SHELL=tui-local`: ustawiana dla lokalnych poleceń powłoki `!` w TUI.
- `OPENCLAW_CLI=1`: ustawiana dla procesów potomnych uruchamianych przez punkt wejścia CLI.

Są to znaczniki środowiska uruchomieniowego (nie są wymaganą konfiguracją użytkownika). Można ich używać w logice powłoki lub profilu,
aby stosować reguły specyficzne dla kontekstu.

## Zmienne środowiskowe interfejsu użytkownika

- `OPENCLAW_THEME=light`: wymusza jasną paletę TUI, gdy terminal ma jasne tło.
- `OPENCLAW_THEME=dark`: wymusza ciemną paletę TUI.
- `COLORFGBG`: jeśli terminal eksportuje tę zmienną, OpenClaw korzysta ze wskazówki dotyczącej koloru tła, aby automatycznie wybrać paletę TUI.

## Podstawianie zmiennych środowiskowych w konfiguracji

Do zmiennych środowiskowych można odwoływać się bezpośrednio w łańcuchowych wartościach konfiguracji za pomocą składni `${VAR_NAME}`:

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

Pełne informacje zawiera sekcja [Konfiguracja: podstawianie zmiennych środowiskowych](/pl/gateway/configuration-reference#env-var-substitution).

## Odwołania do sekretów a łańcuchy `${ENV}`

OpenClaw obsługuje dwa wzorce oparte na zmiennych środowiskowych:

- Podstawianie łańcuchów `${VAR}` w wartościach konfiguracji.
- Obiekty SecretRef (`{ source: "env", provider: "default", id: "VAR" }`) dla pól obsługujących odwołania do sekretów.

Oba są rozwiązywane na podstawie środowiska procesu podczas aktywacji. Szczegóły dotyczące SecretRef opisano w sekcji [Zarządzanie sekretami](/pl/gateway/secrets).
Sam blok `env` konfiguracji nie rozwiązuje obiektów SecretRef ani skróconych
wartości `file:...`.

## Zmienne środowiskowe związane ze ścieżkami

| Zmienna                  | Przeznaczenie                                                                                                                                                                                                                                           |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_HOME`          | Zastępuje katalog domowy używany w wewnętrznych domyślnych ścieżkach OpenClaw (`~/.openclaw/`, katalogach agentów, sesjach, danych uwierzytelniających, obszarze roboczym instalatora podczas wdrażania oraz domyślnym katalogu roboczym wersji deweloperskiej). Przydatne podczas uruchamiania OpenClaw jako wydzielony użytkownik usługi. |
| `OPENCLAW_STATE_DIR`     | Zastępuje katalog stanu (domyślnie `~/.openclaw`).                                                                                                                                                                                                      |
| `OPENCLAW_CONFIG_PATH`   | Zastępuje ścieżkę pliku konfiguracji (domyślnie `~/.openclaw/openclaw.json`).                                                                                                                                                                            |
| `OPENCLAW_INCLUDE_ROOTS` | Lista ścieżek katalogów, w których dyrektywy `$include` mogą rozwiązywać pliki spoza katalogu konfiguracji (domyślnie: brak — `$include` jest ograniczone do katalogu konfiguracji). Tylda jest rozwijana.                                                    |

## Rejestrowanie

| Zmienna                          | Przeznaczenie                                                                                                                                                                                                 |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_LOG_LEVEL`             | Zastępuje poziom rejestrowania zarówno dla pliku, jak i konsoli (np. `debug`, `trace`). Ma pierwszeństwo przed `logging.level` i `logging.consoleLevel` w konfiguracji. Nieprawidłowe wartości są ignorowane z ostrzeżeniem. |
| `OPENCLAW_DEBUG_MODEL_TRANSPORT` | Generuje ukierunkowaną diagnostykę czasu żądań i odpowiedzi modelu na poziomie `info` bez włączania globalnych dzienników debugowania.                                                                          |
| `OPENCLAW_DEBUG_MODEL_PAYLOAD`   | Diagnostyka ładunku modelu: `summary`, `tools` lub `full-redacted`. Wartość `full-redacted` podlega limitowi i redakcji, ale może zawierać tekst promptu lub wiadomości.                                         |
| `OPENCLAW_DEBUG_SSE`             | Diagnostyka strumieniowania: `events` dla pomiaru czasu pierwszego i końcowego zdarzenia, `peek`, aby uwzględnić pierwszych pięć zredagowanych zdarzeń SSE.                                                       |
| `OPENCLAW_DEBUG_CODE_MODE`       | Diagnostyka powierzchni modelu w trybie kodu, obejmująca ukrywanie narzędzi dostawcy oraz zwarte wymuszanie sterowania i bezpośredniości.                                                                        |

### `OPENCLAW_HOME`

Po ustawieniu `OPENCLAW_HOME` zastępuje systemowy katalog domowy (`$HOME` / `os.homedir()`) w wewnętrznych domyślnych ścieżkach OpenClaw. Obejmuje to domyślny katalog stanu, ścieżkę konfiguracji, katalogi agentów, dane uwierzytelniające, obszar roboczy instalatora podczas wdrażania oraz domyślny katalog roboczy wersji deweloperskiej używany przez `openclaw update --channel dev`.

**Kolejność pierwszeństwa:** `OPENCLAW_HOME` > `$HOME` > `USERPROFILE` > awaryjny katalog domowy `PREFIX` Termux na Androidzie > `os.homedir()`

**Przykład** (LaunchDaemon systemu macOS):

```xml
<key>EnvironmentVariables</key>
<dict>
  <key>OPENCLAW_HOME</key>
  <string>/Users/user</string>
</dict>
```

`OPENCLAW_HOME` można również ustawić na ścieżkę z tyldą (np. `~/svc`), która przed użyciem jest rozwijana przy użyciu tego samego awaryjnego łańcucha ustalania katalogu domowego systemu operacyjnego.

Jawne zmienne ścieżek, takie jak `OPENCLAW_STATE_DIR`, `OPENCLAW_CONFIG_PATH` i `OPENCLAW_GIT_DIR`, nadal mają pierwszeństwo. Zadania związane z kontem systemu operacyjnego, takie jak wykrywanie plików startowych powłoki, konfiguracja menedżera pakietów i rozwijanie `~` przez hosta, mogą nadal używać rzeczywistego systemowego katalogu domowego.

## Użytkownicy nvm: błędy TLS narzędzia `web_fetch`

Jeśli Node.js zainstalowano za pomocą **nvm** (a nie systemowego menedżera pakietów), wbudowana funkcja `fetch()` używa
magazynu urzędów certyfikacji dołączonego do nvm, w którym może brakować współczesnych głównych certyfikatów CA (ISRG Root X1/X2 dla Let's Encrypt,
DigiCert Global Root G2 itd.). Powoduje to błąd `"fetch failed"` narzędzia `web_fetch` w większości witryn HTTPS.

W systemie Linux OpenClaw automatycznie wykrywa nvm i stosuje poprawkę w rzeczywistym środowisku uruchamiania:

- `openclaw gateway install` zapisuje `NODE_EXTRA_CA_CERTS` w środowisku usługi systemd
- punkt wejścia CLI `openclaw` ponownie uruchamia własny proces z ustawioną zmienną `NODE_EXTRA_CA_CERTS` przed uruchomieniem Node

**Poprawka ręczna (dla starszych wersji lub bezpośrednich uruchomień `node ...`):**

Wyeksportuj zmienną przed uruchomieniem OpenClaw:

```bash
export NODE_EXTRA_CA_CERTS=/etc/ssl/certs/ca-certificates.crt
openclaw gateway run
```

W przypadku tej zmiennej nie polegaj wyłącznie na zapisaniu jej w `~/.openclaw/.env`; Node odczytuje
`NODE_EXTRA_CA_CERTS` podczas uruchamiania procesu.

## Starsze zmienne środowiskowe

OpenClaw odczytuje wyłącznie zmienne środowiskowe `OPENCLAW_*`. Starsze
prefiksy `CLAWDBOT_*` i `MOLTBOT_*` z wcześniejszych wydań są po cichu
ignorowane.

Jeśli którekolwiek z nich są nadal ustawione w procesie Gateway podczas uruchamiania, OpenClaw generuje
jedno ostrzeżenie Node o wycofaniu (`OPENCLAW_LEGACY_ENV_VARS`), zawierające listę
wykrytych prefiksów i ich łączną liczbę. Zmień nazwę każdej wartości, zastępując
starszy prefiks prefiksem `OPENCLAW_` (na przykład `CLAWDBOT_GATEWAY_TOKEN` na
`OPENCLAW_GATEWAY_TOKEN`); stare nazwy nie mają żadnego działania.

## Powiązane

- [Konfiguracja Gateway](/pl/gateway/configuration)
- [Często zadawane pytania: zmienne środowiskowe i wczytywanie pliku .env](/pl/help/faq#env-vars-and-env-loading)
- [Omówienie modeli](/pl/concepts/models)
