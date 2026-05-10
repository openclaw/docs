---
read_when:
    - Chcesz, aby agenci OpenClaw w trybie Codex używali natywnych Pluginów Codex
    - Migrujesz zainstalowane ze źródeł Pluginy Codex wyselekcjonowane przez OpenAI
    - Rozwiązujesz problemy z codexPlugins, inwentarzem aplikacji, destrukcyjnymi działaniami lub diagnostyką aplikacji Plugin
summary: Skonfiguruj zmigrowane natywne pluginy Codex dla agentów OpenClaw w trybie Codex
title: Natywne pluginy Codex
x-i18n:
    generated_at: "2026-05-10T19:45:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1b9116a479ffb68e3566f6113d9ec9d2a3c33df2dd27ff539f2f27110c7b9d9f
    source_path: plugins/codex-native-plugins.md
    workflow: 16
---

Natywna obsługa Plugin Codex pozwala agentowi OpenClaw w trybie Codex używać
własnych możliwości aplikacji i Plugin serwera aplikacji Codex w tym samym wątku
Codex, który obsługuje turę OpenClaw.

OpenClaw nie tłumaczy Plugin Codex na syntetyczne narzędzia dynamiczne
`codex_plugin_*` OpenClaw. Wywołania Plugin pozostają w natywnym transkrypcie
Codex, a serwer aplikacji Codex odpowiada za wykonywanie MCP oparte na aplikacji.

Użyj tej strony po uruchomieniu bazowego [harnessa Codex](/pl/plugins/codex-harness).

## Wymagania

- Wybranym środowiskiem uruchomieniowym agenta OpenClaw musi być natywny harness Codex.
- `plugins.entries.codex.enabled` musi mieć wartość true.
- `plugins.entries.codex.config.codexPlugins.enabled` musi mieć wartość true.
- V1 obsługuje tylko Plugin `openai-curated`, które migracja wykryła jako
  zainstalowane ze źródła w źródłowym katalogu domowym Codex.
- Docelowy serwer aplikacji Codex musi widzieć oczekiwany marketplace,
  Plugin oraz inwentarz aplikacji.

`codexPlugins` nie ma wpływu na uruchomienia PI, zwykłe uruchomienia dostawcy
OpenAI, powiązania konwersacji ACP ani inne harnessy, ponieważ te ścieżki nie
tworzą wątków serwera aplikacji Codex z natywną konfiguracją `apps`.

## Szybki start

Podejrzyj migrację ze źródłowego katalogu domowego Codex:

```bash
openclaw migrate codex --dry-run
```

Zastosuj migrację, gdy plan wygląda poprawnie:

```bash
openclaw migrate apply codex --yes
```

Migracja zapisuje jawne wpisy `codexPlugins` dla kwalifikujących się Plugin
i wywołuje `plugin/install` serwera aplikacji Codex dla wybranych Plugin.
Typowa zmigrowana konfiguracja wygląda tak:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          codexPlugins: {
            enabled: true,
            allow_destructive_actions: false,
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
przyszłe sesje harnessa Codex startowały ze zaktualizowanym zestawem aplikacji.

## Jak działa natywna konfiguracja Plugin

Integracja ma trzy oddzielne stany:

- Zainstalowany: Codex ma lokalny pakiet Plugin w docelowym środowisku uruchomieniowym serwera aplikacji.
- Włączony: konfiguracja OpenClaw dopuszcza udostępnienie Plugin turom
  harnessa Codex.
- Dostępny: serwer aplikacji Codex potwierdza, że wpisy aplikacji Plugin są dostępne
  dla aktywnego konta i można je zmapować do zmigrowanej tożsamości Plugin.

Migracja jest trwałym krokiem instalacji i kwalifikacji. Inwentarz aplikacji w
czasie działania jest sprawdzeniem dostępności. Konfiguracja sesji harnessa
Codex oblicza następnie restrykcyjną konfigurację aplikacji wątku dla włączonych
i dostępnych aplikacji Plugin.

Konfiguracja aplikacji wątku jest obliczana, gdy OpenClaw ustanawia sesję
harnessa Codex albo zastępuje nieaktualne powiązanie wątku Codex. Nie jest
przeliczana przy każdej turze.

## Granica obsługi V1

V1 jest celowo wąski:

- Do migracji kwalifikują się tylko Plugin `openai-curated`, które były już
  zainstalowane w inwentarzu źródłowego serwera aplikacji Codex.
- Migracja zapisuje jawne tożsamości Plugin z `marketplaceName` i
  `pluginName`; nie zapisuje lokalnych ścieżek pamięci podręcznej `marketplacePath`.
- `codexPlugins.enabled` jest globalnym przełącznikiem włączenia.
- Nie ma wieloznacznika `plugins["*"]` ani klucza konfiguracji, który przyznaje
  dowolne uprawnienie do instalacji.
- Nieobsługiwane marketplace, pakiety Plugin z pamięci podręcznej, hooki i pliki
  konfiguracyjne Codex są zachowywane w raporcie migracji do ręcznego przeglądu.

## Inwentarz aplikacji i własność

OpenClaw odczytuje inwentarz aplikacji Codex przez `app/list` serwera aplikacji,
buforuje go przez godzinę i asynchronicznie odświeża nieaktualne lub brakujące wpisy.

Aplikacja Plugin jest udostępniana tylko wtedy, gdy OpenClaw może zmapować ją
z powrotem do zmigrowanego Plugin przez stabilną własność:

- dokładny identyfikator aplikacji ze szczegółów Plugin
- znana nazwa serwera MCP
- unikatowe stabilne metadane

Własność oparta tylko na nazwie wyświetlanej albo niejednoznaczna jest wykluczana,
dopóki następne odświeżenie inwentarza nie potwierdzi własności.

## Konfiguracja aplikacji wątku

OpenClaw wstrzykuje restrykcyjną poprawkę `config.apps` dla wątku Codex:
`_default` jest wyłączone, a włączone są tylko aplikacje należące do
włączonych zmigrowanych Plugin.

OpenClaw ustawia `destructive_enabled` na poziomie aplikacji na podstawie
efektywnej globalnej lub specyficznej dla Plugin polityki
`allow_destructive_actions` i pozwala Codex egzekwować metadane narzędzi
destrukcyjnych na podstawie jego natywnych adnotacji narzędzi aplikacji.
Konfiguracja aplikacji `_default` jest wyłączana z `open_world_enabled: false`.
Włączone aplikacje Plugin są emitowane z `open_world_enabled: true`; OpenClaw
nie udostępnia osobnego pokrętła polityki otwartego świata dla Plugin i nie
utrzymuje list blokowania nazw narzędzi destrukcyjnych dla poszczególnych Plugin.

Tryb zatwierdzania narzędzi jest domyślnie monitowany dla aplikacji Plugin,
ponieważ OpenClaw nie ma interaktywnego UI wywoływania aplikacji w tej ścieżce
tego samego wątku.

## Polityka działań destrukcyjnych

Destrukcyjne wywołania Plugin domyślnie kończą się bezpieczną odmową:

- Globalne `allow_destructive_actions` domyślnie ma wartość `false`.
- `allow_destructive_actions` dla poszczególnych Plugin nadpisuje politykę globalną
  dla tego Plugin.
- Gdy polityka ma wartość `false`, OpenClaw zwraca deterministyczną odmowę.
- Gdy polityka ma wartość `true`, OpenClaw automatycznie akceptuje tylko bezpieczne schematy,
  które może zmapować na odpowiedź zatwierdzającą, na przykład pole logiczne zatwierdzenia.
- Brak tożsamości Plugin, niejednoznaczna własność, brak identyfikatora tury, zły
  identyfikator tury albo niebezpieczny schemat wywołania powodują odmowę zamiast monitu.

## Rozwiązywanie problemów

**`auth_required`:** migracja zainstalowała Plugin, ale jedna z jego aplikacji
nadal wymaga uwierzytelnienia. Jawny wpis Plugin jest zapisywany jako wyłączony,
dopóki ponownie nie autoryzujesz i nie włączysz go.

**`marketplace_missing` lub `plugin_missing`:** docelowy serwer aplikacji Codex
nie widzi oczekiwanego marketplace `openai-curated` albo Plugin. Uruchom migrację
ponownie względem docelowego środowiska uruchomieniowego albo sprawdź status
Plugin serwera aplikacji Codex.

**`app_inventory_missing` lub `app_inventory_stale`:** gotowość aplikacji pochodziła
z pustej albo nieaktualnej pamięci podręcznej. OpenClaw planuje asynchroniczne
odświeżenie i wyklucza aplikacje Plugin, dopóki własność i gotowość nie będą znane.

**`app_ownership_ambiguous`:** inwentarz aplikacji dopasował tylko po nazwie
wyświetlanej, więc aplikacja nie jest udostępniana wątkowi Codex.

**Konfiguracja się zmieniła, ale agent nie widzi Plugin:** użyj `/new`, `/reset`
albo zrestartuj Gateway. Istniejące powiązania wątku Codex zachowują konfigurację
aplikacji, z którą startowały, dopóki OpenClaw nie ustanowi nowej sesji harnessa
albo nie zastąpi nieaktualnego powiązania.

**Działanie destrukcyjne zostało odrzucone:** sprawdź globalne i specyficzne dla
Plugin wartości `allow_destructive_actions`. Nawet gdy polityka ma wartość true,
niebezpieczne schematy wywołania i niejednoznaczna tożsamość Plugin nadal kończą
się bezpieczną odmową.

## Powiązane

- [Harness Codex](/pl/plugins/codex-harness)
- [Dokumentacja referencyjna harnessa Codex](/pl/plugins/codex-harness-reference)
- [Środowisko uruchomieniowe harnessa Codex](/pl/plugins/codex-harness-runtime)
- [Dokumentacja referencyjna konfiguracji](/pl/gateway/configuration-reference#codex-harness-plugin-config)
- [CLI migracji](/pl/cli/migrate)
