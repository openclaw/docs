---
read_when:
    - Chcesz, aby agenci OpenClaw w trybie Codex używali natywnych Pluginów Codex
    - Migrujesz zainstalowane ze źródeł pluginy Codex kuratorowane przez OpenAI
    - Rozwiązujesz problemy z codexPlugins, inwentarzem aplikacji, działaniami destrukcyjnymi lub diagnostyką aplikacji Plugin
summary: Skonfiguruj zmigrowane natywne pluginy Codex dla agentów OpenClaw w trybie Codex
title: Natywne pluginy Codex
x-i18n:
    generated_at: "2026-05-11T20:34:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: 64e8f552e65b3f1c1c62bc1ba1abfc1bf592d1bdc7fbbe2a484f3eb9955159f0
    source_path: plugins/codex-native-plugins.md
    workflow: 16
---

Natywna obsługa pluginów Codex pozwala agentowi OpenClaw w trybie Codex używać
własnych możliwości aplikacji i pluginów serwera aplikacji Codex w tym samym wątku Codex, który
obsługuje turę OpenClaw.

OpenClaw nie tłumaczy pluginów Codex na syntetyczne narzędzia dynamiczne
OpenClaw `codex_plugin_*`. Wywołania pluginów pozostają w natywnym transkrypcie Codex, a
serwer aplikacji Codex odpowiada za wykonanie MCP wspierane przez aplikację.

Użyj tej strony po uruchomieniu podstawowego [harnessu Codex](/pl/plugins/codex-harness).

## Wymagania

- Wybrane środowisko uruchomieniowe agenta OpenClaw musi być natywnym harnessem Codex.
- `plugins.entries.codex.enabled` musi mieć wartość true.
- `plugins.entries.codex.config.codexPlugins.enabled` musi mieć wartość true.
- V1 obsługuje tylko pluginy `openai-curated`, które migracja wykryła jako
  zainstalowane ze źródła w źródłowym katalogu domowym Codex.
- Docelowy serwer aplikacji Codex musi widzieć oczekiwany marketplace,
  plugin i spis aplikacji.

`codexPlugins` nie wpływa na uruchomienia PI, zwykłe uruchomienia dostawcy OpenAI, powiązania
konwersacji ACP ani inne harnessy, ponieważ te ścieżki nie tworzą
wątków serwera aplikacji Codex z natywną konfiguracją `apps`.

## Szybki start

Wyświetl podgląd migracji ze źródłowego katalogu domowego Codex:

```bash
openclaw migrate codex --dry-run
```

Zastosuj migrację, gdy plan wygląda poprawnie:

```bash
openclaw migrate apply codex --yes
```

Migracja zapisuje jawne wpisy `codexPlugins` dla kwalifikujących się pluginów i wywołuje
`plugin/install` serwera aplikacji Codex dla wybranych pluginów. Typowa zmigrowana
konfiguracja wygląda tak:

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

Po zmianie `codexPlugins` użyj `/new`, `/reset` albo uruchom ponownie gateway, aby
przyszłe sesje harnessu Codex startowały ze zaktualizowanym zestawem aplikacji.

## Jak działa konfiguracja natywnych pluginów

Integracja ma trzy oddzielne stany:

- Zainstalowany: Codex ma lokalny pakiet pluginu w docelowym środowisku uruchomieniowym serwera aplikacji.
- Włączony: konfiguracja OpenClaw pozwala udostępnić plugin turom
  harnessu Codex.
- Dostępny: serwer aplikacji Codex potwierdza, że wpisy aplikacji pluginu są dostępne
  dla aktywnego konta i można je zmapować na zmigrowaną tożsamość pluginu.

Migracja jest trwałym krokiem instalacji i kwalifikowania. Spis aplikacji w czasie działania jest
sprawdzeniem dostępności. Następnie konfiguracja sesji harnessu Codex oblicza restrykcyjną
konfigurację aplikacji wątku dla włączonych i dostępnych aplikacji pluginów.

Konfiguracja aplikacji wątku jest obliczana, gdy OpenClaw ustanawia sesję harnessu Codex
albo zastępuje nieaktualne powiązanie wątku Codex. Nie jest przeliczana przy każdej turze.

## Granica obsługi V1

V1 jest celowo wąskie:

- Do migracji kwalifikują się tylko pluginy `openai-curated`, które były już zainstalowane w spisie
  źródłowego serwera aplikacji Codex.
- Migracja zapisuje jawne tożsamości pluginów z `marketplaceName` i
  `pluginName`; nie zapisuje lokalnych ścieżek pamięci podręcznej `marketplacePath`.
- `codexPlugins.enabled` to globalny przełącznik włączenia.
- Nie ma symbolu wieloznacznego `plugins["*"]` ani klucza konfiguracji, który przyznaje dowolne
  uprawnienia instalacyjne.
- Nieobsługiwane marketplace'y, pakiety pluginów z pamięci podręcznej, hooki i pliki konfiguracji Codex
  są zachowywane w raporcie migracji do ręcznej weryfikacji.

## Spis aplikacji i własność

OpenClaw odczytuje spis aplikacji Codex przez `app/list` serwera aplikacji, buforuje go przez
jedną godzinę i odświeża nieaktualne lub brakujące wpisy asynchronicznie.

Aplikacja pluginu jest eksponowana tylko wtedy, gdy OpenClaw może zmapować ją z powrotem do zmigrowanego
pluginu przez stabilną własność:

- dokładny identyfikator aplikacji ze szczegółów pluginu
- znana nazwa serwera MCP
- unikalne stabilne metadane

Własność oparta tylko na nazwie wyświetlanej lub niejednoznaczna jest wykluczana, dopóki następne odświeżenie spisu
nie potwierdzi własności.

## Konfiguracja aplikacji wątku

OpenClaw wstrzykuje restrykcyjną poprawkę `config.apps` dla wątku Codex:
`_default` jest wyłączone, a włączone są tylko aplikacje należące do włączonych zmigrowanych pluginów.

OpenClaw ustawia `destructive_enabled` na poziomie aplikacji na podstawie efektywnej globalnej lub
per-pluginowej polityki `allow_destructive_actions` i pozwala Codex egzekwować
metadane destrukcyjnych narzędzi z natywnych adnotacji narzędzi aplikacji. Konfiguracja aplikacji `_default`
jest wyłączona z `open_world_enabled: false`. Włączone aplikacje pluginów
są emitowane z `open_world_enabled: true`; OpenClaw nie udostępnia osobnego
per-pluginowego pokrętła polityki open-world i nie utrzymuje per-pluginowych list odmowy
nazw narzędzi destrukcyjnych.

Tryb zatwierdzania narzędzi jest domyślnie automatyczny dla aplikacji pluginów, dzięki czemu niedestrukcyjne
narzędzia odczytu mogą działać bez interfejsu zatwierdzania w tym samym wątku. Narzędzia destrukcyjne pozostają
kontrolowane przez politykę `destructive_enabled` każdej aplikacji.

## Polityka działań destrukcyjnych

Destrukcyjne elicytacje pluginów domyślnie kończą się bezpieczną odmową:

- Globalne `allow_destructive_actions` domyślnie ma wartość `false`.
- Per-pluginowe `allow_destructive_actions` zastępuje globalną politykę dla tego
  pluginu.
- Gdy polityka ma wartość `false`, OpenClaw zwraca deterministyczną odmowę.
- Gdy polityka ma wartość `true`, OpenClaw automatycznie akceptuje tylko bezpieczne schematy, które może zmapować na
  odpowiedź zatwierdzającą, takie jak boolowskie pole approve.
- Brak tożsamości pluginu, niejednoznaczna własność, brak identyfikatora tury, nieprawidłowy identyfikator tury
  albo niebezpieczny schemat elicytacji powodują odmowę zamiast wyświetlenia prośby o potwierdzenie.

## Rozwiązywanie problemów

**`auth_required`:** migracja zainstalowała plugin, ale jedna z jego aplikacji nadal
wymaga uwierzytelnienia. Jawny wpis pluginu jest zapisywany jako wyłączony, dopóki nie
przeprowadzisz ponownej autoryzacji i go nie włączysz.

**`marketplace_missing` lub `plugin_missing`:** docelowy serwer aplikacji Codex
nie widzi oczekiwanego marketplace'u `openai-curated` ani pluginu. Uruchom ponownie migrację
względem docelowego środowiska uruchomieniowego albo sprawdź status pluginów serwera aplikacji Codex.

**`app_inventory_missing` lub `app_inventory_stale`:** gotowość aplikacji pochodziła z
pustej lub nieaktualnej pamięci podręcznej. OpenClaw planuje asynchroniczne odświeżenie i wyklucza aplikacje
pluginów, dopóki własność i gotowość nie będą znane.

**`app_ownership_ambiguous`:** spis aplikacji dopasował tylko nazwę wyświetlaną, więc
aplikacja nie jest eksponowana w wątku Codex.

**Konfiguracja się zmieniła, ale agent nie widzi pluginu:** użyj `/new`, `/reset` albo
uruchom ponownie gateway. Istniejące powiązania wątków Codex zachowują konfigurację aplikacji, z którą
wystartowały, dopóki OpenClaw nie ustanowi nowej sesji harnessu albo nie zastąpi
nieaktualnego powiązania.

**Działanie destrukcyjne jest odrzucane:** sprawdź globalne i per-pluginowe
wartości `allow_destructive_actions`. Nawet gdy polityka ma wartość true, niebezpieczne schematy elicytacji
i niejednoznaczna tożsamość pluginu nadal kończą się bezpieczną odmową.

## Powiązane

- [Harness Codex](/pl/plugins/codex-harness)
- [Dokumentacja referencyjna harnessu Codex](/pl/plugins/codex-harness-reference)
- [Środowisko uruchomieniowe harnessu Codex](/pl/plugins/codex-harness-runtime)
- [Dokumentacja referencyjna konfiguracji](/pl/gateway/configuration-reference#codex-harness-plugin-config)
- [CLI migracji](/pl/cli/migrate)
