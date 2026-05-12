---
read_when:
    - Chcesz, aby agenci OpenClaw w trybie Codex używali natywnych pluginów Codex
    - Migrujesz zainstalowane ze źródła Pluginy Codex wybrane przez OpenAI
    - Rozwiązujesz problemy z codexPlugins, inwentarzem aplikacji, destrukcyjnymi działaniami lub diagnostyką aplikacji pluginów
summary: Skonfiguruj zmigrowane natywne pluginy Codex dla agentów OpenClaw w trybie Codex
title: Natywne pluginy Codex
x-i18n:
    generated_at: "2026-05-12T00:59:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: d4cc1c7b6a97c6eb27eb10a7b14261ecfd398eff58fbd26cc2979a31e6f6a6c4
    source_path: plugins/codex-native-plugins.md
    workflow: 16
---

Natywna obsługa Plugin Codex pozwala agentowi OpenClaw w trybie Codex używać
własnych możliwości aplikacji i Pluginów serwera aplikacji Codex w tym samym wątku Codex,
który obsługuje turę OpenClaw.

OpenClaw nie tłumaczy Pluginów Codex na syntetyczne dynamiczne narzędzia OpenClaw
`codex_plugin_*`. Wywołania Pluginów pozostają w natywnym transkrypcie Codex, a
serwer aplikacji Codex odpowiada za wykonywanie MCP wspierane przez aplikacje.

Użyj tej strony po uruchomieniu podstawowego [harnessu Codex](/pl/plugins/codex-harness).

## Wymagania

- Wybrane środowisko uruchomieniowe agenta OpenClaw musi być natywnym harnessen Codex.
- `plugins.entries.codex.enabled` musi mieć wartość true.
- `plugins.entries.codex.config.codexPlugins.enabled` musi mieć wartość true.
- V1 obsługuje tylko Pluginy `openai-curated`, które migracja wykryła jako
  zainstalowane ze źródła w źródłowym katalogu domowym Codex.
- Docelowy serwer aplikacji Codex musi widzieć oczekiwany marketplace,
  Plugin oraz inwentarz aplikacji.

`codexPlugins` nie ma wpływu na uruchomienia PI, zwykłe uruchomienia providera OpenAI, powiązania
konwersacji ACP ani inne harnessy, ponieważ te ścieżki nie tworzą
wątków serwera aplikacji Codex z natywną konfiguracją `apps`.

## Szybki start

Podejrzyj migrację ze źródłowego katalogu domowego Codex:

```bash
openclaw migrate codex --dry-run
```

Zastosuj migrację, gdy plan wygląda poprawnie:

```bash
openclaw migrate apply codex --yes
```

Migracja zapisuje jawne wpisy `codexPlugins` dla kwalifikujących się Pluginów i wywołuje
`plugin/install` serwera aplikacji Codex dla wybranych Pluginów. Typowa zmigrowana
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

## Jak działa natywna konfiguracja Pluginów

Integracja ma trzy osobne stany:

- Zainstalowany: Codex ma lokalny pakiet Pluginu w docelowym środowisku uruchomieniowym serwera aplikacji.
- Włączony: konfiguracja OpenClaw zezwala na udostępnienie Pluginu
  turom harnessu Codex.
- Dostępny: serwer aplikacji Codex potwierdza, że wpisy aplikacji Pluginu są dostępne
  dla aktywnego konta i można je zmapować na zmigrowaną tożsamość Pluginu.

Migracja jest trwałym krokiem instalacji i kwalifikacji. Inwentarz aplikacji w czasie wykonywania jest
sprawdzeniem dostępności. Następnie konfiguracja sesji harnessu Codex oblicza restrykcyjną
konfigurację aplikacji wątku dla włączonych i dostępnych aplikacji Pluginów.

Konfiguracja aplikacji wątku jest obliczana, gdy OpenClaw ustanawia sesję harnessu Codex
albo zastępuje nieaktualne powiązanie wątku Codex. Nie jest obliczana ponownie przy każdej turze.

## Granica obsługi V1

V1 jest celowo wąska:

- Do migracji kwalifikują się tylko Pluginy `openai-curated`, które były już zainstalowane
  w źródłowym inwentarzu serwera aplikacji Codex.
- Migracja zapisuje jawne tożsamości Pluginów z `marketplaceName` i
  `pluginName`; nie zapisuje lokalnych ścieżek pamięci podręcznej `marketplacePath`.
- `codexPlugins.enabled` jest globalnym przełącznikiem włączenia.
- Nie ma symbolu wieloznacznego `plugins["*"]` ani klucza konfiguracji, który przyznaje dowolne
  uprawnienia instalacji.
- Nieobsługiwane marketplace’y, zbuforowane pakiety Pluginów, hooki i pliki konfiguracji Codex
  są zachowywane w raporcie migracji do ręcznego przeglądu.

## Inwentarz aplikacji i własność

OpenClaw odczytuje inwentarz aplikacji Codex przez `app/list` serwera aplikacji, buforuje go przez
jedną godzinę i asynchronicznie odświeża nieaktualne lub brakujące wpisy.

Aplikacja Pluginu jest ujawniana tylko wtedy, gdy OpenClaw może zmapować ją z powrotem na zmigrowany
Plugin przez stabilną własność:

- dokładny identyfikator aplikacji ze szczegółów Pluginu
- znana nazwa serwera MCP
- unikalne stabilne metadane

Własność oparta tylko na nazwie wyświetlanej lub niejednoznaczna jest wykluczana do czasu, aż następne odświeżenie inwentarza
potwierdzi własność.

## Konfiguracja aplikacji wątku

OpenClaw wstrzykuje restrykcyjną łatkę `config.apps` dla wątku Codex:
`_default` jest wyłączone, a włączone są tylko aplikacje należące do włączonych zmigrowanych Pluginów.

OpenClaw ustawia `destructive_enabled` na poziomie aplikacji na podstawie efektywnej globalnej lub
per-Pluginowej polityki `allow_destructive_actions` i pozwala Codex wymuszać
metadane narzędzi destrukcyjnych z natywnych adnotacji narzędzi aplikacji. Konfiguracja aplikacji `_default`
jest wyłączona z `open_world_enabled: false`. Włączone aplikacje Pluginów
są emitowane z `open_world_enabled: true`; OpenClaw nie udostępnia osobnego
przełącznika polityki open-world dla Pluginów i nie utrzymuje per-Pluginowych list blokowania
nazw narzędzi destrukcyjnych.

Tryb zatwierdzania narzędzi jest domyślnie automatyczny dla aplikacji Pluginów, więc niedestrukcyjne
narzędzia odczytu mogą działać bez interfejsu zatwierdzania w tym samym wątku. Narzędzia destrukcyjne pozostają
kontrolowane przez politykę `destructive_enabled` każdej aplikacji.

## Polityka działań destrukcyjnych

Destrukcyjne elicitationy Pluginów są domyślnie dozwolone dla zmigrowanych Pluginów Codex,
a niebezpieczne schematy i niejednoznaczna własność nadal kończą się zamkniętą odmową:

- Globalne `allow_destructive_actions` domyślnie ma wartość `true`.
- Per-Pluginowe `allow_destructive_actions` zastępuje globalną politykę dla tego
  Pluginu.
- Gdy polityka ma wartość `false`, OpenClaw zwraca deterministyczną odmowę.
- Gdy polityka ma wartość `true`, OpenClaw automatycznie akceptuje tylko bezpieczne schematy, które może zmapować na
  odpowiedź zatwierdzenia, takie jak boolowskie pole zatwierdzenia.
- Brak tożsamości Pluginu, niejednoznaczna własność, brakujący identyfikator tury, nieprawidłowy identyfikator tury
  albo niebezpieczny schemat elicitation odmawia zamiast pytać użytkownika.

## Rozwiązywanie problemów

**`auth_required`:** migracja zainstalowała Plugin, ale jedna z jego aplikacji nadal
wymaga uwierzytelnienia. Jawny wpis Pluginu jest zapisywany jako wyłączony, dopóki nie
ponownie autoryzujesz i nie włączysz go.

**`marketplace_missing` lub `plugin_missing`:** docelowy serwer aplikacji Codex
nie widzi oczekiwanego marketplace’u albo Pluginu `openai-curated`. Uruchom migrację ponownie
wobec docelowego środowiska uruchomieniowego albo sprawdź status Pluginu serwera aplikacji Codex.

**`app_inventory_missing` lub `app_inventory_stale`:** gotowość aplikacji pochodziła z
pustej lub nieaktualnej pamięci podręcznej. OpenClaw planuje asynchroniczne odświeżenie i wyklucza aplikacje
Pluginów, dopóki własność i gotowość nie będą znane.

**`app_ownership_ambiguous`:** inwentarz aplikacji dopasował tylko nazwę wyświetlaną, więc
aplikacja nie jest ujawniana wątkowi Codex.

**Konfiguracja się zmieniła, ale agent nie widzi Pluginu:** użyj `/new`, `/reset` albo
zrestartuj Gateway. Istniejące powiązania wątków Codex zachowują konfigurację aplikacji, z którą
zaczęły, dopóki OpenClaw nie ustanowi nowej sesji harnessu albo nie zastąpi
nieaktualnego powiązania.

**Działanie destrukcyjne jest odrzucane:** sprawdź globalne i per-Pluginowe
wartości `allow_destructive_actions`. Nawet gdy polityka ma wartość true, niebezpieczne schematy elicitation
i niejednoznaczna tożsamość Pluginu nadal kończą się zamkniętą odmową.

## Powiązane

- [Harness Codex](/pl/plugins/codex-harness)
- [Dokumentacja referencyjna harnessu Codex](/pl/plugins/codex-harness-reference)
- [Środowisko uruchomieniowe harnessu Codex](/pl/plugins/codex-harness-runtime)
- [Dokumentacja referencyjna konfiguracji](/pl/gateway/configuration-reference#codex-harness-plugin-config)
- [CLI migracji](/pl/cli/migrate)
