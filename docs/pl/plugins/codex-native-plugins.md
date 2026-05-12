---
read_when:
    - Chcesz, aby agenci OpenClaw w trybie Codex używali natywnych pluginów Codex
    - Migrujesz zainstalowane ze źródła pluginy Codex wyselekcjonowane przez OpenAI
    - Rozwiązujesz problemy z codexPlugins, inwentarzem aplikacji, działaniami destrukcyjnymi lub diagnostyką aplikacji Plugin
summary: Skonfiguruj zmigrowane natywne pluginy Codex dla agentów OpenClaw w trybie Codex
title: Natywne Pluginy Codex
x-i18n:
    generated_at: "2026-05-12T23:31:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: ddec40cd5f9a74b43d55f327cdcd7088e024392fbafc7f1aa5bd9b136d3ecc13
    source_path: plugins/codex-native-plugins.md
    workflow: 16
---

Natywna obsługa pluginów Codex pozwala agentowi OpenClaw w trybie Codex używać
własnych możliwości aplikacji i pluginów app-server Codex w tym samym wątku Codex,
który obsługuje turę OpenClaw.

OpenClaw nie tłumaczy pluginów Codex na syntetyczne dynamiczne narzędzia
OpenClaw `codex_plugin_*`. Wywołania pluginów pozostają w natywnym transkrypcie
Codex, a app-server Codex odpowiada za wykonanie MCP wspierane przez aplikację.

Użyj tej strony po uruchomieniu bazowego [harnessu Codex](/pl/plugins/codex-harness).

## Wymagania

- Wybranym środowiskiem wykonawczym agenta OpenClaw musi być natywny harness Codex.
- `plugins.entries.codex.enabled` musi mieć wartość true.
- `plugins.entries.codex.config.codexPlugins.enabled` musi mieć wartość true.
- V1 obsługuje tylko pluginy `openai-curated`, które migracja zaobserwowała jako
  zainstalowane ze źródła w źródłowym katalogu domowym Codex.
- Docelowy app-server Codex musi widzieć oczekiwany marketplace,
  plugin i inwentarz aplikacji.

`codexPlugins` nie ma wpływu na uruchomienia PI, zwykłe uruchomienia dostawcy
OpenAI, powiązania konwersacji ACP ani inne harnessy, ponieważ te ścieżki nie
tworzą wątków app-server Codex z natywną konfiguracją `apps`.

## Szybki start

Podejrzyj migrację ze źródłowego katalogu domowego Codex:

```bash
openclaw migrate codex --dry-run
```

Użyj ścisłej weryfikacji aplikacji źródłowej, gdy chcesz, aby migracja sprawdziła
dostępność aplikacji źródłowej przed zaplanowaniem natywnej aktywacji pluginu:

```bash
openclaw migrate codex --dry-run --verify-plugin-apps
```

Zastosuj migrację, gdy plan wygląda poprawnie:

```bash
openclaw migrate apply codex --yes
```

Migracja zapisuje jawne wpisy `codexPlugins` dla kwalifikujących się pluginów i
wywołuje `plugin/install` app-server Codex dla wybranych pluginów. Typowa
zmigrowana konfiguracja wygląda tak:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          codexPlugins: {
            enabled: true,
            allow_destructive_actions: true,
            plugins: {
              "google-calendar": {
                enabled: true,
                marketplaceName: "openai-curated",
                pluginName: "google-calendar",
              },
            },
          },
        },
      },
    },
  },
}
```

Po zmianie `codexPlugins` użyj `/new`, `/reset` albo zrestartuj Gateway, aby
przyszłe sesje harnessu Codex startowały ze zaktualizowanym zestawem aplikacji.

## Jak działa natywna konfiguracja pluginów

Integracja ma trzy oddzielne stany:

- Zainstalowany: Codex ma lokalny pakiet pluginu w docelowym środowisku wykonawczym app-server.
- Włączony: konfiguracja OpenClaw zezwala na udostępnienie pluginu turom
  harnessu Codex.
- Dostępny: app-server Codex potwierdza, że wpisy aplikacji pluginu są dostępne
  dla aktywnego konta i można je zmapować na zmigrowaną tożsamość pluginu.

Migracja jest trwałym krokiem instalacji i kwalifikowalności. Podczas planowania
OpenClaw odczytuje szczegóły `plugin/read` źródłowego Codex i sprawdza, czy
odpowiedź konta źródłowego app-server Codex jest kontem subskrypcji ChatGPT.
Odpowiedzi kont innych niż ChatGPT lub brak odpowiedzi konta pomijają pluginy
wspierane przez aplikację z powodem `codex_subscription_required`. Domyślnie
migracja nie wywołuje źródłowego `app/list`; pluginy źródłowe wspierane przez
aplikację, które przechodzą bramkę konta, są planowane bez weryfikacji
dostępności aplikacji źródłowej, a błędy transportu wyszukiwania konta są
pomijane z powodem `codex_account_unavailable`. Z `--verify-plugin-apps`
migracja pobiera świeży snapshot źródłowego `app/list` i wymaga, aby każda
posiadana aplikacja była obecna, włączona i dostępna przed zaplanowaniem
natywnej aktywacji. W tym trybie błędy transportu wyszukiwania konta przechodzą
do bramki inwentarza aplikacji źródłowych. Inwentarz aplikacji w czasie
wykonania jest kontrolą dostępności sesji docelowej po migracji. Następnie
konfiguracja sesji harnessu Codex oblicza restrykcyjną konfigurację aplikacji
wątku dla włączonych i dostępnych aplikacji pluginów.

Konfiguracja aplikacji wątku jest obliczana, gdy OpenClaw ustanawia sesję
harnessu Codex albo zastępuje przestarzałe powiązanie wątku Codex. Nie jest
obliczana ponownie przy każdej turze.

## Granica obsługi V1

V1 jest celowo wąska:

- Do migracji kwalifikują się tylko pluginy `openai-curated`, które były już
  zainstalowane w inwentarzu źródłowego app-server Codex.
- Pluginy źródłowe wspierane przez aplikację muszą przejść bramkę subskrypcji
  w czasie migracji. `--verify-plugin-apps` dodaje bramkę inwentarza aplikacji
  źródłowych. Konta objęte wymogiem subskrypcji oraz, w trybie weryfikacji,
  niedostępne, wyłączone, brakujące aplikacje źródłowe lub błędy odświeżania
  inwentarza aplikacji źródłowych są zgłaszane jako pominięte elementy ręczne
  zamiast włączonych wpisów konfiguracji. Nieczytelne szczegóły pluginów są
  pomijane przed bramką inwentarza aplikacji źródłowych.
- Migracja zapisuje jawne tożsamości pluginów z `marketplaceName` i
  `pluginName`; nie zapisuje lokalnych ścieżek pamięci podręcznej `marketplacePath`.
- `codexPlugins.enabled` jest globalnym przełącznikiem włączenia.
- Nie ma symbolu wieloznacznego `plugins["*"]` ani klucza konfiguracji, który
  przyznaje arbitralne uprawnienia instalacji.
- Nieobsługiwane marketplace'y, buforowane pakiety pluginów, hooki i pliki
  konfiguracji Codex są zachowywane w raporcie migracji do ręcznego przeglądu.

## Inwentarz aplikacji i własność

OpenClaw odczytuje inwentarz aplikacji Codex przez `app/list` app-server, buforuje
go przez jedną godzinę i asynchronicznie odświeża przestarzałe lub brakujące
wpisy. Pamięć podręczna istnieje tylko w pamięci; restart CLI lub Gateway ją
usuwa, a OpenClaw odbudowuje ją z następnego odczytu `app/list`.

Migracja i czas wykonania używają oddzielnych kluczy pamięci podręcznej:

- Weryfikacja migracji źródłowej używa źródłowego katalogu domowego Codex i
  opcji startowych źródłowego app-server. Działa to tylko wtedy, gdy ustawiono
  `--verify-plugin-apps`, i wymusza świeże przejście po źródłowym `app/list` dla
  danego przebiegu planowania.
- Konfiguracja docelowego czasu wykonania używa tożsamości app-server Codex
  docelowego agenta, gdy buduje konfigurację aplikacji wątku Codex. Aktywacja
  pluginu unieważnia ten docelowy klucz pamięci podręcznej, a następnie wymusza
  jego odświeżenie po `plugin/install`.

Aplikacja pluginu jest ujawniana tylko wtedy, gdy OpenClaw może zmapować ją
z powrotem na zmigrowany plugin przez stabilną własność:

- dokładny identyfikator aplikacji ze szczegółów pluginu
- znana nazwa serwera MCP
- unikalne stabilne metadane

Własność oparta wyłącznie na nazwie wyświetlanej lub niejednoznaczna jest
wykluczana, dopóki następne odświeżenie inwentarza nie potwierdzi własności.

## Konfiguracja aplikacji wątku

OpenClaw wstrzykuje restrykcyjną łatkę `config.apps` dla wątku Codex:
`_default` jest wyłączona i włączone są tylko aplikacje należące do włączonych
zmigrowanych pluginów.

OpenClaw ustawia `destructive_enabled` na poziomie aplikacji na podstawie
obowiązującej globalnej lub per-pluginowej polityki `allow_destructive_actions`
i pozwala Codex egzekwować metadane narzędzi destrukcyjnych z natywnych adnotacji
narzędzi aplikacji. Konfiguracja aplikacji `_default` jest wyłączona z
`open_world_enabled: false`. Włączone aplikacje pluginów są emitowane z
`open_world_enabled: true`; OpenClaw nie udostępnia osobnego pokrętła polityki
open-world dla pluginów i nie utrzymuje per-pluginowych list odmów nazw
narzędzi destrukcyjnych.

Tryb zatwierdzania narzędzi jest domyślnie automatyczny dla aplikacji pluginów,
aby niedestrukcyjne narzędzia odczytu mogły działać bez interfejsu zatwierdzania
w tym samym wątku. Narzędzia destrukcyjne pozostają kontrolowane przez politykę
`destructive_enabled` każdej aplikacji.

## Polityka działań destrukcyjnych

Destrukcyjne wywołania pluginów wymagające elicitation są domyślnie dozwolone
dla zmigrowanych pluginów Codex, natomiast niebezpieczne schematy i
niejednoznaczna własność nadal są zamykane bezpiecznie:

- Globalne `allow_destructive_actions` domyślnie ma wartość `true`.
- Per-pluginowe `allow_destructive_actions` zastępuje globalną politykę dla tego
  pluginu.
- Gdy polityka ma wartość `false`, OpenClaw zwraca deterministyczną odmowę.
- Gdy polityka ma wartość `true`, OpenClaw automatycznie akceptuje tylko
  bezpieczne schematy, które może zmapować na odpowiedź zatwierdzenia, takie jak
  pole logiczne zatwierdzenia.
- Brak tożsamości pluginu, niejednoznaczna własność, brakujący identyfikator
  tury, błędny identyfikator tury lub niebezpieczny schemat elicitation powodują
  odmowę zamiast wyświetlenia prośby.

## Rozwiązywanie problemów

**`auth_required`:** migracja zainstalowała plugin, ale jedna z jego aplikacji
nadal wymaga uwierzytelnienia. Jawny wpis pluginu jest zapisywany jako wyłączony,
dopóki nie autoryzujesz ponownie i go nie włączysz.

**`app_inaccessible`, `app_disabled` lub `app_missing`:**
migracja nie zainstalowała pluginu, ponieważ inwentarz aplikacji źródłowego
Codex nie pokazał wszystkich posiadanych aplikacji jako obecnych, włączonych
i dostępnych, gdy ustawiono `--verify-plugin-apps`. Autoryzuj ponownie lub włącz
aplikację w Codex, a następnie uruchom ponownie migrację z `--verify-plugin-apps`.

**`app_inventory_unavailable`:** migracja nie zainstalowała pluginu, ponieważ
zażądano ścisłej weryfikacji aplikacji źródłowych i odświeżenie inwentarza
aplikacji źródłowego Codex nie powiodło się. Napraw dostęp do źródłowego
app-server Codex albo spróbuj ponownie bez `--verify-plugin-apps`, jeśli
akceptujesz szybszy plan ograniczony bramką konta.

**`codex_subscription_required`:** migracja nie zainstalowała pluginu
wspieranego przez aplikację, ponieważ konto źródłowego app-server Codex nie było
zalogowane przy użyciu konta subskrypcji ChatGPT. Zaloguj się do aplikacji Codex
z uwierzytelnieniem subskrypcji, a następnie uruchom migrację ponownie.

**`codex_account_unavailable`:** migracja nie zainstalowała pluginu wspieranego
przez aplikację, ponieważ nie można było odczytać konta źródłowego app-server
Codex. Napraw uwierzytelnianie źródłowego app-server Codex albo uruchom ponownie
z `--verify-plugin-apps`, jeśli chcesz, aby inwentarz aplikacji źródłowych
decydował o kwalifikowalności, gdy wyszukiwanie konta się nie powiedzie.

**`marketplace_missing` lub `plugin_missing`:** docelowy app-server Codex nie
widzi oczekiwanego marketplace'u lub pluginu `openai-curated`. Uruchom ponownie
migrację względem docelowego środowiska wykonawczego albo sprawdź status pluginu
app-server Codex.

**`app_inventory_missing` lub `app_inventory_stale`:** gotowość aplikacji
pochodziła z pustej lub przestarzałej pamięci podręcznej. OpenClaw planuje
asynchroniczne odświeżenie i wyklucza aplikacje pluginów, dopóki własność
i gotowość nie będą znane.

**`app_ownership_ambiguous`:** inwentarz aplikacji dopasował tylko nazwę
wyświetlaną, więc aplikacja nie jest ujawniana wątkowi Codex.

**Konfiguracja się zmieniła, ale agent nie widzi pluginu:** użyj `/new`,
`/reset` albo zrestartuj Gateway. Istniejące powiązania wątków Codex zachowują
konfigurację aplikacji, z którą zostały uruchomione, dopóki OpenClaw nie ustanowi
nowej sesji harnessu albo nie zastąpi przestarzałego powiązania.

**Działanie destrukcyjne jest odrzucane:** sprawdź globalne i per-pluginowe
wartości `allow_destructive_actions`. Nawet gdy polityka ma wartość true,
niebezpieczne schematy elicitation i niejednoznaczna tożsamość pluginu nadal
są zamykane bezpiecznie.

## Powiązane

- [Harness Codex](/pl/plugins/codex-harness)
- [Dokumentacja referencyjna harnessu Codex](/pl/plugins/codex-harness-reference)
- [Środowisko wykonawcze harnessu Codex](/pl/plugins/codex-harness-runtime)
- [Dokumentacja referencyjna konfiguracji](/pl/gateway/configuration-reference#codex-harness-plugin-config)
- [CLI migracji](/pl/cli/migrate)
