---
read_when:
    - Chcesz zarządzać hookami agenta
    - Chcesz sprawdzić dostępność hooków lub włączyć hooki obszaru roboczego
summary: Dokumentacja CLI dla `openclaw hooks` (hooki agenta)
title: Hooki
x-i18n:
    generated_at: "2026-07-12T14:54:55Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f33d1e343771971bdc17dcafdabc6c4fc893b3080897862475a148e5f3957796
    source_path: cli/hooks.md
    workflow: 16
---

# `openclaw hooks`

Zarządzaj hookami agenta (automatyzacjami sterowanymi zdarzeniami dla poleceń takich jak `/new` i `/reset` oraz uruchamiania Gateway). Samo `openclaw hooks` jest równoważne poleceniu `openclaw hooks list`.

Powiązane: [Hooki](/pl/automation/hooks) — [Hooki Pluginów](/pl/plugins/hooks)

## Wyświetlanie hooków

```bash
openclaw hooks list [--eligible] [--json] [-v|--verbose]
```

Wyświetla hooki wykryte w katalogach obszaru roboczego, zarządzanych, dodatkowych i dołączonych.

- `--eligible`: tylko hooki, których wymagania są spełnione.
- `--json`: ustrukturyzowane dane wyjściowe.
- `-v, --verbose`: dołącza kolumnę braków z niespełnionymi wymaganiami.

```
Hooki (4/5 gotowych)

Gotowe:
  🚀 boot-md ✓ - Uruchamia BOOT.md podczas uruchamiania Gateway
  📎 bootstrap-extra-files ✓ - Wstrzykuje dodatkowe pliki inicjalizacyjne obszaru roboczego podczas inicjalizacji agenta
  📝 command-logger ✓ - Rejestruje wszystkie zdarzenia poleceń w scentralizowanym pliku audytu
  💾 session-memory ✓ - Zapisuje kontekst sesji w pamięci po wydaniu polecenia /new lub /reset
```

## Pobieranie informacji o hooku

```bash
openclaw hooks info <name> [--json]
```

`<name>` to nazwa lub klucz hooka (na przykład `session-memory`). Wyświetla źródło, ścieżki pliku i procedury obsługi, stronę główną, zdarzenia oraz stan poszczególnych wymagań (pliki wykonywalne, środowisko, konfiguracja, system operacyjny).

## Sprawdzanie dostępności

```bash
openclaw hooks check [--json]
```

Wyświetla podsumowanie liczby gotowych i niegotowych hooków; jeśli niektóre hooki nie są gotowe, wyświetla każdy z nich wraz z przyczyną blokady.

## Włączanie hooka

```bash
openclaw hooks enable <name>
```

Dodaje lub aktualizuje w konfiguracji ustawienie `hooks.internal.entries.<name>.enabled = true`, a także włącza główny przełącznik `hooks.internal.enabled` (Gateway nie wczytuje żadnej wewnętrznej procedury obsługi hooka, dopóki nie zostanie skonfigurowany co najmniej jeden hook). Polecenie kończy się niepowodzeniem, jeśli hook nie istnieje, jest zarządzany przez Plugin lub nie jest dostępny (brakujące wymagania).

Hooki zarządzane przez Plugin mają oznaczenie `plugin:<id>` w wyniku `hooks list` i nie można ich tutaj włączać ani wyłączać; zamiast tego włącz lub wyłącz Plugin będący ich właścicielem.

Po włączeniu uruchom ponownie Gateway (uruchom ponownie aplikację paska menu systemu macOS lub proces Gateway w środowisku programistycznym), aby ponownie wczytał hooki.

## Wyłączanie hooka

```bash
openclaw hooks disable <name>
```

Ustawia `hooks.internal.entries.<name>.enabled = false`. Następnie uruchom ponownie Gateway.

## Instalowanie i aktualizowanie pakietów hooków

```bash
openclaw plugins install <package>        # domyślnie npm
openclaw plugins install npm:<package>    # tylko npm
openclaw plugins install <package> --pin  # przypnij ustaloną wersję
openclaw plugins install <path>           # katalog lokalny lub archiwum
openclaw plugins install -l <path>        # dowiąż katalog lokalny zamiast go kopiować

openclaw plugins update <id>
openclaw plugins update --all
openclaw plugins update --dry-run
```

Pakiety hooków są instalowane za pomocą ujednoliconego instalatora i aktualizatora Pluginów; `openclaw hooks install` i `openclaw hooks update` nadal działają jako przestarzałe aliasy, które wyświetlają ostrzeżenie i przekazują wywołanie do poleceń `plugins`.

- Specyfikacje npm dotyczą wyłącznie rejestru: nazwa pakietu z opcjonalną dokładną wersją lub znacznikiem dist-tag. Specyfikacje Git, URL i plików oraz zakresy semver są odrzucane. Zależności są instalowane lokalnie w projekcie z opcją `--ignore-scripts`.
- Specyfikacje bez dodatkowych oznaczeń oraz `@latest` pozostają w kanale stabilnym; jeśli npm wskaże wersję przedpremierową, OpenClaw zatrzyma się i poprosi o jej jawne dopuszczenie (`@beta`, `@rc` lub dokładną wersję przedpremierową).
- Obsługiwane archiwa: `.zip`, `.tgz`, `.tar.gz`, `.tar`.
- `-l, --link` tworzy dowiązanie do katalogu lokalnego zamiast go kopiować (dodaje go do `hooks.internal.load.extraDirs`); dowiązane pakiety hooków są hookami zarządzanymi z katalogu skonfigurowanego przez operatora, a nie hookami obszaru roboczego.
- `--pin` zapisuje instalacje npm jako dokładne, ustalone `name@version` w `hooks.internal.installs`.
- Instalacja kopiuje pakiet do `~/.openclaw/hooks/<id>`, włącza jego hooki w `hooks.internal.entries.*` i zapisuje instalację w `hooks.internal.installs`.
- Jeśli zapisany skrót integralności przestanie odpowiadać pobranemu artefaktowi, OpenClaw wyświetli ostrzeżenie i poprosi o potwierdzenie przed kontynuowaniem; użyj globalnej opcji `--yes`, aby pominąć pytanie (na przykład w CI).

## Dołączone hooki

| Hook                  | Zdarzenia                                         | Działanie                                                                                                    |
| --------------------- | ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| boot-md               | `gateway:startup`                                 | Uruchamia `BOOT.md` podczas uruchamiania Gateway dla każdego skonfigurowanego zakresu agenta                  |
| bootstrap-extra-files | `agent:bootstrap`                                 | Wstrzykuje dodatkowe pliki inicjalizacyjne (na przykład `AGENTS.md`/`TOOLS.md` monorepozytorium) podczas inicjalizacji agenta |
| command-logger        | `command`                                         | Rejestruje zdarzenia poleceń w `~/.openclaw/logs/commands.log`                                               |
| compaction-notifier   | `session:compact:before`, `session:compact:after` | Wysyła widoczne powiadomienia na czacie, gdy rozpoczyna się i kończy Compaction sesji                         |
| session-memory        | `command:new`, `command:reset`                    | Zapisuje kontekst sesji w pamięci po użyciu `/new` lub `/reset`                                              |

Włącz dowolny dołączony hook za pomocą `openclaw hooks enable <hook-name>`. Pełne informacje, klucze konfiguracji i wartości domyślne: [Dołączone hooki](/pl/automation/hooks#bundled-hooks).

### Plik dziennika command-logger

```bash
tail -n 20 ~/.openclaw/logs/commands.log        # ostatnie polecenia
cat ~/.openclaw/logs/commands.log | jq .          # czytelne formatowanie
grep '"action":"new"' ~/.openclaw/logs/commands.log | jq .   # filtrowanie według działania
```

## Uwagi

- `hooks list --json`, `info --json` i `check --json` zapisują ustrukturyzowany kod JSON bezpośrednio na standardowe wyjście.

## Powiązane

- [Dokumentacja CLI](/pl/cli)
- [Hooki automatyzacji](/pl/automation/hooks)
