---
read_when:
    - Chcesz, aby agenci OpenClaw w trybie Codex używali natywnych wtyczek Codex
    - Migrujesz zainstalowane ze źródła wyselekcjonowane przez OpenAI Pluginy Codex
    - Diagnozujesz problemy z codexPlugins, inwentaryzacją aplikacji, działaniami destrukcyjnymi lub diagnostyką aplikacji Plugin
summary: Skonfiguruj zmigrowane natywne Plugin Codex dla agentów OpenClaw w trybie Codex
title: Natywne pluginy Codex
x-i18n:
    generated_at: "2026-06-27T17:52:05Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 82d8eb7ca7c10db5220c49426f5e9db5992ee751d48b2ac8c89e93773fc87776
    source_path: plugins/codex-native-plugins.md
    workflow: 16
---

Natywna obsługa pluginów Codex pozwala agentowi OpenClaw w trybie Codex używać własnych możliwości aplikacji i pluginów app-server Codex w tym samym wątku Codex, który obsługuje turę OpenClaw.

OpenClaw nie tłumaczy pluginów Codex na syntetyczne narzędzia dynamiczne OpenClaw `codex_plugin_*`. Wywołania Plugin pozostają w natywnej transkrypcji Codex, a app-server Codex odpowiada za wykonywanie MCP wspierane przez aplikacje.

Użyj tej strony po uruchomieniu bazowego [harnessu Codex](/pl/plugins/codex-harness).

## Wymagania

- Wybranym runtime agenta OpenClaw musi być natywny harness Codex.
- `plugins.entries.codex.enabled` musi mieć wartość true.
- `plugins.entries.codex.config.codexPlugins.enabled` musi mieć wartość true.
- V1 obsługuje tylko pluginy `openai-curated`, które migracja wykryła jako zainstalowane ze źródła w źródłowym katalogu domowym Codex.
- Docelowy app-server Codex musi widzieć oczekiwany marketplace, Plugin i spis aplikacji.

`codexPlugins` nie wpływa na uruchomienia OpenClaw, zwykłe uruchomienia dostawcy OpenAI, powiązania konwersacji ACP ani inne harnessy, ponieważ te ścieżki nie tworzą wątków app-server Codex z natywną konfiguracją `apps`.

Dostęp do Codex po stronie OpenAI, dostępność aplikacji oraz kontrolki aplikacji/pluginów w obszarze roboczym pochodzą z zalogowanego konta Codex. Model konta OpenAI i administratora opisuje artykuł [Using Codex with your ChatGPT plan](https://help.openai.com/en/articles/11369540-using-codex-with-your-chatgpt-plan).

## Szybki start

Podejrzyj migrację ze źródłowego katalogu domowego Codex:

```bash
openclaw migrate codex --dry-run
```

Użyj rygorystycznej weryfikacji aplikacji źródłowych, gdy chcesz, aby migracja sprawdziła dostępność aplikacji źródłowej przed zaplanowaniem natywnej aktywacji Plugin:

```bash
openclaw migrate codex --dry-run --verify-plugin-apps
```

Zastosuj migrację, gdy plan wygląda poprawnie:

```bash
openclaw migrate apply codex --yes
```

Migracja zapisuje jawne wpisy `codexPlugins` dla kwalifikujących się pluginów i wywołuje `plugin/install` app-server Codex dla wybranych pluginów. Typowa zmigrowana konfiguracja wygląda tak:

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

Po zmianie `codexPlugins` nowe konwersacje Codex automatycznie pobierają zaktualizowany zestaw aplikacji. Użyj `/new` lub `/reset`, aby odświeżyć bieżącą konwersację. Restart gateway nie jest wymagany przy zmianach włączania lub wyłączania Plugin.

## Zarządzanie pluginami z czatu

Użyj `/codex plugins`, gdy chcesz sprawdzić lub zmienić skonfigurowane natywne pluginy Codex z tego samego czatu, w którym obsługujesz harness Codex:

```text
/codex plugins
/codex plugins list
/codex plugins disable google-calendar
/codex plugins enable google-calendar
```

`/codex plugins` jest aliasem `/codex plugins list`. Wynik listy pokazuje skonfigurowane klucze Plugin, stan włączenia/wyłączenia, nazwę Plugin Codex oraz marketplace z `plugins.entries.codex.config.codexPlugins.plugins`.

`enable` i `disable` zapisują tylko konfigurację OpenClaw w `~/.openclaw/openclaw.json`; nie edytują `~/.codex/config.toml` ani nie instalują nowych pluginów Codex. Stan Plugin może zmienić tylko właściciel albo klient gateway z zakresem `operator.admin`.

Włączenie skonfigurowanego Plugin włącza także globalny przełącznik `codexPlugins.enabled`. Jeśli Plugin został zapisany jako wyłączony, ponieważ migracja zwróciła `auth_required`, ponownie autoryzuj aplikację w Codex przed włączeniem jej w OpenClaw.

## Jak działa natywna konfiguracja Plugin

Integracja ma trzy oddzielne stany:

- Zainstalowany: Codex ma lokalny pakiet Plugin w docelowym runtime app-server.
- Włączony: konfiguracja OpenClaw zezwala na udostępnienie Plugin dla tur harnessu Codex.
- Dostępny: app-server Codex potwierdza, że wpisy aplikacji Plugin są dostępne dla aktywnego konta i można je zmapować na zmigrowaną tożsamość Plugin.

Migracja jest trwałym etapem instalacji/kwalifikacji. Podczas planowania OpenClaw odczytuje szczegóły `plugin/read` źródłowego Codex i sprawdza, czy odpowiedź konta źródłowego app-server Codex jest kontem subskrypcji ChatGPT. Odpowiedzi konta inne niż ChatGPT albo brakujące odpowiedzi pomijają pluginy wspierane przez aplikacje z `codex_subscription_required`. Domyślnie migracja nie wywołuje źródłowego `app/list`; źródłowe pluginy wspierane przez aplikacje, które przejdą bramkę konta, są planowane bez weryfikacji dostępności aplikacji źródłowej, a awarie transportu wyszukiwania konta są pomijane z `codex_account_unavailable`. Z `--verify-plugin-apps` migracja pobiera świeży snapshot źródłowego `app/list` i wymaga, aby każda posiadana aplikacja była obecna, włączona i dostępna przed zaplanowaniem natywnej aktywacji. W tym trybie awarie transportu wyszukiwania konta przechodzą do bramki spisu aplikacji źródłowych. Spis aplikacji runtime jest kontrolą dostępności sesji docelowej po migracji. Konfiguracja sesji harnessu Codex oblicza następnie restrykcyjną konfigurację aplikacji wątku dla włączonych i dostępnych aplikacji Plugin.

Konfiguracja aplikacji wątku jest obliczana, gdy OpenClaw ustanawia sesję harnessu Codex albo zastępuje przestarzałe powiązanie wątku Codex. Nie jest przeliczana przy każdej turze, więc `/codex plugins enable` i `/codex plugins disable` wpływają na nowe konwersacje Codex. Użyj `/new` lub `/reset`, gdy bieżąca konwersacja powinna pobrać zaktualizowany zestaw aplikacji.

## Granica obsługi V1

V1 jest celowo wąskie:

- Do migracji kwalifikują się tylko pluginy `openai-curated`, które były już zainstalowane w spisie źródłowego app-server Codex.
- Źródłowe pluginy wspierane przez aplikacje muszą przejść bramkę subskrypcji w czasie migracji. `--verify-plugin-apps` dodaje bramkę spisu aplikacji źródłowych. Konta zablokowane przez subskrypcję oraz, w trybie weryfikacji, niedostępne, wyłączone, brakujące aplikacje źródłowe albo awarie odświeżania spisu aplikacji źródłowych są raportowane jako pominięte elementy ręczne zamiast włączonych wpisów konfiguracji. Nieczytelne szczegóły Plugin są pomijane przed bramką spisu aplikacji źródłowych.
- Migracja zapisuje jawne tożsamości Plugin z `marketplaceName` i `pluginName`; nie zapisuje lokalnych ścieżek pamięci podręcznej `marketplacePath`.
- `codexPlugins.enabled` jest globalnym przełącznikiem włączenia.
- Nie ma symbolu wieloznacznego `plugins["*"]` ani klucza konfiguracji, który przyznaje dowolne uprawnienia instalacji.
- Nieobsługiwane marketplace'y, pakiety Plugin z pamięci podręcznej, hooki i pliki konfiguracji Codex są zachowywane w raporcie migracji do ręcznego przeglądu.

## Spis aplikacji i własność

OpenClaw odczytuje spis aplikacji Codex przez `app/list` app-server, buforuje go przez godzinę i asynchronicznie odświeża przestarzałe lub brakujące wpisy. Pamięć podręczna jest tylko w pamięci; restart CLI lub gateway ją usuwa, a OpenClaw odbudowuje ją z następnego odczytu `app/list`.

Migracja i runtime używają oddzielnych kluczy pamięci podręcznej:

- Weryfikacja migracji źródłowej używa źródłowego katalogu domowego Codex i opcji uruchamiania źródłowego app-server. Działa to tylko wtedy, gdy ustawiono `--verify-plugin-apps`, i wymusza świeże przejście źródłowego `app/list` dla tego uruchomienia planowania.
- Konfiguracja runtime docelowego używa tożsamości app-server Codex agenta docelowego, gdy buduje konfigurację aplikacji wątku Codex. Aktywacja Plugin unieważnia ten docelowy klucz pamięci podręcznej, a następnie wymusza jego odświeżenie po `plugin/install`.

Aplikacja Plugin jest ujawniana tylko wtedy, gdy OpenClaw może zmapować ją z powrotem na zmigrowany Plugin przez stabilną własność:

- dokładny identyfikator aplikacji ze szczegółów Plugin
- znana nazwa serwera MCP
- unikatowe stabilne metadane

Własność oparta wyłącznie na nazwie wyświetlanej albo niejednoznaczna jest wykluczona do czasu, aż następne odświeżenie spisu potwierdzi własność.

## Konfiguracja aplikacji wątku

OpenClaw wstrzykuje restrykcyjną poprawkę `config.apps` dla wątku Codex: `_default` jest wyłączone i włączone są tylko aplikacje należące do włączonych zmigrowanych pluginów.

OpenClaw ustawia `destructive_enabled` na poziomie aplikacji z efektywnej globalnej lub per-Plugin polityki `allow_destructive_actions` i pozwala Codex egzekwować metadane destrukcyjnych narzędzi z natywnych adnotacji narzędzi aplikacji. `true`, `"auto"` i `"always"` ustawiają `destructive_enabled: true`; `false` ustawia je na false. Konfiguracja aplikacji `_default` jest wyłączona z `open_world_enabled: false`. Włączone aplikacje Plugin są emitowane z `open_world_enabled: true`; OpenClaw nie udostępnia osobnego pokrętła polityki open-world dla Plugin i nie utrzymuje per-Plugin list odrzuceń nazw narzędzi destrukcyjnych.

Tryb zatwierdzania narzędzi jest domyślnie automatyczny dla aplikacji Plugin, więc niedestrukcyjne narzędzia odczytu mogą działać bez interfejsu zatwierdzania w tym samym wątku. Narzędzia destrukcyjne pozostają kontrolowane przez politykę `destructive_enabled` każdej aplikacji.

## Polityka działań destrukcyjnych

Destrukcyjne wezwania Plugin są domyślnie dozwolone dla zmigrowanych pluginów Codex, natomiast niebezpieczne schematy i niejednoznaczna własność nadal kończą się odmową:

- Globalne `allow_destructive_actions` domyślnie ma wartość `true`.
- Per-Plugin `allow_destructive_actions` zastępuje globalną politykę dla tego Plugin.
- Gdy polityka ma wartość `false`, OpenClaw zwraca deterministyczną odmowę.
- Gdy polityka ma wartość `true`, OpenClaw automatycznie akceptuje tylko bezpieczne schematy, które może zmapować na odpowiedź zatwierdzenia, takie jak pole logiczne approve.
- Gdy polityka ma wartość `"auto"`, OpenClaw udostępnia destrukcyjne działania Plugin dla Codex, ale zamienia potwierdzone własnością wezwania zatwierdzania MCP na zatwierdzenia Plugin OpenClaw przed zwróceniem odpowiedzi zatwierdzenia Codex.
- Gdy polityka ma wartość `"always"`, OpenClaw używa tego samego bramkowania zapisu/destrukcji Codex co `"auto"`, czyści trwałe per-narzędzie zastąpienia zatwierdzeń Codex dla aplikacji przed startem wątku i oferuje tylko jednorazowe zatwierdzenie lub odmowę, aby trwałe zatwierdzenia nie mogły tłumić późniejszych monitów o działania zapisu.
- Brakująca tożsamość Plugin, niejednoznaczna własność, brakujący identyfikator tury, błędny identyfikator tury albo niebezpieczny schemat wezwania powodują odmowę zamiast wyświetlenia monitu.

## Rozwiązywanie problemów

**`auth_required`:** migracja zainstalowała Plugin, ale jedna z jego aplikacji nadal wymaga uwierzytelnienia. Jawny wpis Plugin jest zapisywany jako wyłączony do czasu ponownej autoryzacji i włączenia go.

**`app_inaccessible`, `app_disabled` lub `app_missing`:**
migracja nie zainstalowała Plugin, ponieważ spis aplikacji źródłowego Codex nie pokazał wszystkich posiadanych aplikacji jako obecnych, włączonych i dostępnych, gdy ustawiono `--verify-plugin-apps`. Ponownie autoryzuj lub włącz aplikację w Codex, a następnie uruchom ponownie migrację z `--verify-plugin-apps`.

**`app_inventory_unavailable`:** migracja nie zainstalowała Plugin, ponieważ zażądano rygorystycznej weryfikacji aplikacji źródłowych, a odświeżenie spisu aplikacji źródłowego Codex nie powiodło się. Napraw dostęp do źródłowego app-server Codex albo spróbuj ponownie bez `--verify-plugin-apps`, jeśli akceptujesz szybszy plan bramkowany kontem.

**`codex_subscription_required`:** migracja nie zainstalowała Plugin wspieranego przez aplikację, ponieważ konto źródłowego app-server Codex nie było zalogowane jako konto z subskrypcją ChatGPT. Zaloguj się do aplikacji Codex przy użyciu uwierzytelnienia subskrypcji, a następnie uruchom ponownie migrację.

**`codex_account_unavailable`:** migracja nie zainstalowała Plugin wspieranego przez aplikację, ponieważ nie można było odczytać konta źródłowego app-server Codex. Napraw uwierzytelnianie źródłowego app-server Codex albo uruchom ponownie z `--verify-plugin-apps`, jeśli chcesz, aby spis aplikacji źródłowych decydował o kwalifikacji, gdy wyszukiwanie konta się nie powiedzie.

**`marketplace_missing` lub `plugin_missing`:** docelowy app-server Codex nie widzi oczekiwanego marketplace `openai-curated` albo Plugin. Uruchom ponownie migrację względem docelowego runtime albo sprawdź status Plugin app-server Codex.

**`app_inventory_missing` lub `app_inventory_stale`:** gotowość aplikacji pochodziła z pustej lub przestarzałej pamięci podręcznej. OpenClaw planuje asynchroniczne odświeżenie i wyklucza aplikacje Plugin do czasu, aż własność i gotowość będą znane.

**`app_ownership_ambiguous`:** spis aplikacji pasował tylko po nazwie wyświetlanej, więc aplikacja nie jest ujawniana wątkowi Codex.

**Konfiguracja się zmieniła, ale agent nie widzi Plugin:** użyj `/codex plugins list`, aby potwierdzić skonfigurowany stan, a następnie użyj `/new` lub `/reset`. Istniejące powiązania wątków Codex zachowują konfigurację aplikacji, z którą wystartowały, dopóki OpenClaw nie ustanowi nowej sesji harnessu albo nie zastąpi przestarzałego powiązania.

**Działanie destrukcyjne zostało odrzucone:** sprawdź globalne i właściwe dla poszczególnych Pluginów wartości
`allow_destructive_actions`. Nawet gdy zasada ma wartość true, `"auto"` lub
`"always"`, niebezpieczne schematy pozyskiwania danych i niejednoznaczna tożsamość Pluginu nadal kończą się odmową.

## Powiązane

- [Mechanizm Codex](/pl/plugins/codex-harness)
- [Dokumentacja referencyjna mechanizmu Codex](/pl/plugins/codex-harness-reference)
- [Środowisko uruchomieniowe mechanizmu Codex](/pl/plugins/codex-harness-runtime)
- [Dokumentacja referencyjna konfiguracji](/pl/gateway/configuration-reference#codex-harness-plugin-config)
- [Migracja CLI](/pl/cli/migrate)
