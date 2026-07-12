---
read_when:
    - Chcesz przejść z Hermesa lub innego systemu agentowego na OpenClaw
    - Dodajesz dostawcę migracji należącego do pluginu
summary: Dokumentacja CLI dla `openclaw migrate` (importowanie stanu z innego systemu agentowego)
title: Migruj
x-i18n:
    generated_at: "2026-07-12T15:01:23Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1160373bfec09de8ec1bac6fbe8a218e8af7ec6a5896bc1fdfe6a0db158d50a1
    source_path: cli/migrate.md
    workflow: 16
---

# `openclaw migrate`

Importuj stan z innego systemu agentowego za pośrednictwem dostawcy migracji należącego do pluginu. Wbudowani dostawcy obsługują Claude, Codex CLI i [Hermes](/pl/install/migrating-hermes); pluginy mogą rejestrować dodatkowych dostawców.

<Tip>
Instrukcje przeznaczone dla użytkowników znajdziesz w sekcjach [Migracja z Claude](/pl/install/migrating-claude) i [Migracja z Hermes](/pl/install/migrating-hermes). [Centrum migracji](/pl/install/migrating) zawiera listę wszystkich ścieżek.
</Tip>

## Polecenia

```bash
openclaw migrate list
openclaw migrate claude --dry-run
openclaw migrate codex --dry-run
openclaw migrate codex --skill gog-vault77-google-workspace
openclaw migrate codex --plugin google-calendar --dry-run
openclaw migrate codex --plugin google-calendar --verify-plugin-apps --dry-run
openclaw migrate hermes --dry-run
openclaw migrate hermes
openclaw migrate apply codex --yes --skill gog-vault77-google-workspace
openclaw migrate apply codex --yes --plugin google-calendar
openclaw migrate apply codex --yes
openclaw migrate apply claude --yes
openclaw migrate apply hermes --yes
openclaw migrate apply hermes --include-secrets --yes
openclaw onboard --flow import
openclaw onboard --import-from claude --import-source ~/.claude
openclaw onboard --import-from hermes --import-source ~/.hermes
```

Uruchomienie `openclaw migrate <provider>` bez innych flag tworzy plan, wyświetla podgląd i (w TTY) prosi o potwierdzenie przed zastosowaniem. Polecenia `openclaw migrate plan <provider>` i `openclaw migrate apply <provider>` rozdzielają podgląd i zastosowanie na osobne podpolecenia z tymi samymi flagami.

<ParamField path="<provider>" type="string">
  Nazwa zarejestrowanego dostawcy migracji, na przykład `hermes`. Uruchom `openclaw migrate list`, aby wyświetlić zainstalowanych dostawców.
</ParamField>
<ParamField path="--dry-run" type="boolean">
  Utwórz plan i zakończ bez zmiany stanu.
</ParamField>
<ParamField path="--from <path>" type="string">
  Zastąp katalog stanu źródłowego. Domyślnie Hermes używa `~/.hermes`, Codex używa `~/.codex` (lub `$CODEX_HOME`), a Claude używa `~/.claude`.
</ParamField>
<ParamField path="--include-secrets" type="boolean">
  Importuj obsługiwane dane uwierzytelniające bez pytania. Podczas interaktywnego stosowania pojawia się pytanie przed zaimportowaniem wykrytych danych uwierzytelniających, z domyślnie wybraną odpowiedzią twierdzącą; w trybie nieinteraktywnym użycie `--yes` wymaga `--include-secrets`, aby je zaimportować.
</ParamField>
<ParamField path="--no-auth-credentials" type="boolean">
  Pomiń import danych uwierzytelniających, w tym pytanie interaktywne.
</ParamField>
<ParamField path="--overwrite" type="boolean">
  Zezwól podczas stosowania na zastąpienie istniejących elementów docelowych, gdy plan zgłasza konflikty.
</ParamField>
<ParamField path="--yes" type="boolean">
  Pomiń pytanie o potwierdzenie. Wymagane w trybie nieinteraktywnym.
</ParamField>
<ParamField path="--skill <name>" type="string">
  Wybierz jeden element kopiowania umiejętności według nazwy umiejętności lub identyfikatora elementu. Powtórz flagę, aby zmigrować wiele umiejętności. Jeśli flaga zostanie pominięta, interaktywne migracje Codex wyświetlają selektor pól wyboru, a migracje nieinteraktywne zachowują wszystkie zaplanowane umiejętności.
</ParamField>
<ParamField path="--plugin <name>" type="string">
  Wybierz jeden element instalacji pluginu Codex według nazwy pluginu lub identyfikatora elementu. Powtórz flagę, aby zmigrować wiele pluginów Codex. Jeśli flaga zostanie pominięta, interaktywne migracje Codex wyświetlają natywny selektor pól wyboru pluginów Codex, a migracje nieinteraktywne zachowują wszystkie zaplanowane pluginy. Dotyczy wyłącznie instalowanych ze źródła pluginów Codex `openai-curated`, wykrytych przez spis serwera aplikacji Codex.
</ParamField>
<ParamField path="--verify-plugin-apps" type="boolean">
  Tylko Codex. Wymusza ponowne przejście źródłowego serwera aplikacji Codex przez `app/list` przed zaplanowaniem aktywacji natywnego pluginu. Domyślnie wyłączone, aby planowanie migracji było szybkie.
</ParamField>
<ParamField path="--backup-output <path>" type="string">
  Ścieżka lub katalog archiwum kopii zapasowej sprzed migracji. Przekazywane do `openclaw backup create`.
</ParamField>
<ParamField path="--no-backup" type="boolean">
  Pomiń kopię zapasową przed zastosowaniem. Wymaga `--force`, gdy istnieje lokalny stan OpenClaw.
</ParamField>
<ParamField path="--force" type="boolean">
  Wymagane razem z `--no-backup`, gdy zastosowanie w przeciwnym razie odmówiłoby pominięcia kopii zapasowej.
</ParamField>
<ParamField path="--json" type="boolean">
  Wyświetl plan lub wynik zastosowania jako JSON. W przypadku użycia `--json` bez `--yes` polecenie zastosowania wyświetla plan i nie zmienia stanu.
</ParamField>

## Model bezpieczeństwa

`openclaw migrate` działa w modelu najpierw podgląd.

<AccordionGroup>
  <Accordion title="Podgląd przed zastosowaniem">
    Dostawca zwraca szczegółowy plan przed wprowadzeniem jakichkolwiek zmian, obejmujący konflikty, pominięte elementy i elementy poufne. Plany JSON, dane wyjściowe zastosowania i raporty migracji maskują zagnieżdżone klucze wyglądające na tajne, takie jak klucze API, tokeny, nagłówki autoryzacji, pliki cookie i hasła.

    `openclaw migrate apply <provider>` wyświetla podgląd planu i prosi o potwierdzenie przed zmianą stanu, chyba że ustawiono `--yes`. W trybie nieinteraktywnym zastosowanie wymaga `--yes`.

  </Accordion>
  <Accordion title="Kopie zapasowe">
    Przed zastosowaniem migracji polecenie zastosowania tworzy i weryfikuje kopię zapasową OpenClaw. Jeśli lokalny stan OpenClaw jeszcze nie istnieje, etap tworzenia kopii zapasowej jest pomijany, a migracja jest kontynuowana. Aby pominąć kopię zapasową, gdy stan istnieje, przekaż jednocześnie `--no-backup` i `--force`.
  </Accordion>
  <Accordion title="Konflikty">
    Polecenie zastosowania odmawia kontynuacji, gdy plan zawiera konflikty. Przejrzyj plan, a następnie uruchom polecenie ponownie z `--overwrite`, jeśli zastąpienie istniejących elementów docelowych jest zamierzone. Dostawcy mogą nadal zapisywać kopie zapasowe poszczególnych zastępowanych plików w katalogu raportu migracji.
  </Accordion>
  <Accordion title="Dane poufne">
    Podczas interaktywnego stosowania pojawia się pytanie, czy zaimportować wykryte dane uwierzytelniające, z domyślnie wybraną odpowiedzią twierdzącą. Użyj `--no-auth-credentials`, aby je pominąć, albo `--include-secrets`, aby importować dane uwierzytelniające bez nadzoru przy użyciu `--yes`.
  </Accordion>
</AccordionGroup>

## Dostawca Claude

Wbudowany dostawca Claude domyślnie wykrywa stan Claude Code w `~/.claude`. Użyj `--from <path>`, aby zaimportować określony katalog domowy lub katalog główny projektu Claude Code.

<Tip>
Instrukcję przeznaczoną dla użytkowników znajdziesz w sekcji [Migracja z Claude](/pl/install/migrating-claude).
</Tip>

### Co importuje Claude

- Projektowe pliki `CLAUDE.md` i `.claude/CLAUDE.md` do obszaru roboczego agenta OpenClaw (`AGENTS.md`).
- Zawartość użytkownika z `~/.claude/CLAUDE.md` dołączoną do pliku `USER.md` w obszarze roboczym.
- Definicje serwerów MCP z projektowego pliku `.mcp.json`, pliku Claude Code `~/.claude.json` (w tym jego wpisów dla poszczególnych projektów) oraz pliku Claude Desktop `claude_desktop_config.json`.
- Katalogi umiejętności Claude zawierające `SKILL.md` (użytkownika `~/.claude/skills` i projektowe `.claude/skills`).
- Pliki Markdown poleceń Claude (użytkownika `~/.claude/commands` i projektowe `.claude/commands`) przekształcone w umiejętności OpenClaw dostępne wyłącznie do ręcznego wywołania.

### Stan archiwalny i wymagający ręcznego przeglądu

Hooki Claude, uprawnienia, domyślne wartości środowiska, projektowy plik `CLAUDE.local.md`, katalog `.claude/rules`, katalogi `agents/` użytkownika i projektu oraz historia projektu (`projects`, `cache`, `plans` w `~/.claude`) są zachowywane w raporcie migracji lub zgłaszane jako elementy wymagające ręcznego przeglądu. OpenClaw nie wykonuje automatycznie hooków, nie kopiuje ogólnych list dozwolonych elementów ani nie importuje stanu danych uwierzytelniających OAuth/Desktop.

## Dostawca Codex

Wbudowany dostawca Codex domyślnie wykrywa stan Codex CLI w `~/.codex` albo w `CODEX_HOME`, gdy ta zmienna środowiskowa jest ustawiona. Użyj `--from <path>`, aby utworzyć spis określonego katalogu domowego Codex.

Użyj tego dostawcy podczas przechodzenia na środowisko uruchomieniowe Codex w OpenClaw, gdy chcesz celowo przenieść przydatne osobiste zasoby Codex CLI. Lokalne uruchomienia serwera aplikacji Codex używają osobnego `CODEX_HOME` dla każdego agenta, dlatego domyślnie nie odczytują osobistego katalogu `~/.codex`. Zwykła wartość procesu `HOME` jest nadal dziedziczona, dzięki czemu Codex może odczytywać współdzielone umiejętności i wpisy platformy pluginów w `$HOME/.agents/*`, a podprocesy mogą odnajdywać konfigurację i tokeny z katalogu domowego użytkownika.

Uruchomienie `openclaw migrate codex` w terminalu interaktywnym wyświetla podgląd pełnego planu, a następnie przed ostatecznym potwierdzeniem zastosowania otwiera selektory pól wyboru. Najpierw pojawia się wybór elementów kopiowania umiejętności. Użyj `Toggle all on` lub `Toggle all off`, aby wybrać zbiorczo. Naciśnij spację, aby przełączyć wiersze, albo Enter, aby aktywować wyróżniony wiersz i kontynuować. Zaplanowane umiejętności są początkowo zaznaczone, umiejętności powodujące konflikty są początkowo odznaczone, a opcja `Skip for now` pomija kopiowanie umiejętności w tym uruchomieniu, jednocześnie kontynuując wybór pluginów. Gdy zainstalowane ze źródła, nadzorowane pluginy Codex można zmigrować i nie podano `--plugin`, migracja następnie pyta o aktywację natywnego pluginu Codex według nazwy pluginu. Elementy pluginów są początkowo zaznaczone, chyba że docelowa konfiguracja pluginów Codex w OpenClaw już zawiera dany plugin. Istniejące pluginy docelowe są początkowo odznaczone i wyświetlają wskazówkę o konflikcie, taką jak `conflict: plugin exists`; wybierz `Toggle all off`, aby nie migrować żadnych natywnych pluginów Codex w tym uruchomieniu, albo `Skip for now`, aby zatrzymać się przed zastosowaniem.

W przypadku uruchomień skryptowych lub wymagających dokładnego wyboru jawnie wybierz co najmniej jedną umiejętność albo co najmniej jeden plugin:

```bash
openclaw migrate codex --dry-run --skill gog-vault77-google-workspace
openclaw migrate apply codex --yes --skill gog-vault77-google-workspace
openclaw migrate codex --dry-run --plugin google-calendar
openclaw migrate apply codex --yes --plugin google-calendar
```

### Co importuje Codex

- Katalogi umiejętności Codex CLI w `$CODEX_HOME/skills`, z wyłączeniem pamięci podręcznej `.system` programu Codex.
- Osobiste AgentSkills w `$HOME/.agents/skills`, kopiowane do bieżącego obszaru roboczego agenta OpenClaw w celu przypisania ich do konkretnego agenta.
- Instalowane ze źródła pluginy Codex `openai-curated`, wykryte przez `plugin/list` serwera aplikacji Codex. Podczas planowania dla każdego włączonego, zainstalowanego pluginu odczytywane jest `plugin/read`.

Migracja pluginów wspieranych przez aplikacje podlega dodatkowym warunkom:

- Pluginy wspierane przez aplikacje wymagają, aby konto źródłowego serwera aplikacji Codex było kontem z subskrypcją ChatGPT. Odpowiedzi dotyczące kont innych niż ChatGPT lub brak odpowiedzi dotyczącej konta powodują pominięcie z powodem `codex_subscription_required`.
- Domyślnie migracja nie wywołuje źródłowego `app/list`, dlatego pluginy wspierane przez aplikacje, które spełniają warunek dotyczący konta, są planowane bez weryfikacji dostępności aplikacji źródłowej, a błędy transportu podczas wyszukiwania konta powodują pominięcie z powodem `codex_account_unavailable`.
- Przekaż `--verify-plugin-apps`, aby wymusić świeżą migawkę źródłowego `app/list` i przed zaplanowaniem natywnej aktywacji wymagać, aby każda należąca do użytkownika aplikacja była obecna, włączona i dostępna. W tym trybie błędy transportu podczas wyszukiwania konta prowadzą do weryfikacji źródłowego spisu aplikacji. Migawka jest przechowywana w pamięci tylko dla bieżącego procesu; nigdy nie jest zapisywana w danych wyjściowych migracji ani w konfiguracji docelowej.

Wyłączone pluginy, nieczytelne szczegóły pluginów, konta źródłowe ograniczone wymogiem subskrypcji oraz — gdy ustawiono `--verify-plugin-apps` — brakujące, wyłączone lub niedostępne aplikacje stają się ręcznie pomijanymi elementami z określonymi typami powodów zamiast wpisami konfiguracji docelowej. Polecenie zastosowania wywołuje `plugin/install` serwera aplikacji dla każdego wybranego kwalifikującego się pluginu, nawet jeśli docelowy serwer aplikacji już zgłasza ten plugin jako zainstalowany i włączony. Zmigrowane pluginy Codex są dostępne wyłącznie w sesjach korzystających z natywnego środowiska uruchomieniowego Codex; nie są udostępniane uruchomieniom dostawców OpenClaw, powiązaniom konwersacji ACP ani innym środowiskom uruchomieniowym.

### Stan Codex wymagający ręcznego przeglądu

Plik Codex `config.toml`, natywne `hooks/hooks.json`, nienadzorowane platformy dystrybucji, zapisane w pamięci podręcznej pakiety pluginów, które nie są nadzorowanymi pluginami instalowanymi ze źródła, oraz pluginy instalowane ze źródła, które nie spełniają źródłowego warunku subskrypcji, nie są aktywowane automatycznie. Gdy ustawiono `--verify-plugin-apps`, pomijane są również pluginy, które nie spełniają warunku źródłowego spisu aplikacji. Wszystkie te elementy są kopiowane lub zgłaszane w raporcie migracji do ręcznego przeglądu.

W przypadku zmigrowanych, instalowanych ze źródła, nadzorowanych pluginów polecenie zastosowania zapisuje:

- `plugins.entries.codex.enabled: true`
- `plugins.entries.codex.config.codexPlugins.enabled: true`
- `plugins.entries.codex.config.codexPlugins.allow_destructive_actions: true`
- jeden jawny wpis pluginu z `marketplaceName: "openai-curated"` i `pluginName` dla każdego wybranego pluginu

Migracja nigdy nie zapisuje `plugins["*"]` ani nie przechowuje lokalnych ścieżek pamięci podręcznej platformy pluginów.

Pominięte pluginy nie są zapisywane w konfiguracji docelowej. Błędy subskrypcji po stronie źródłowej są zgłaszane w elementach wymagających ręcznej obsługi wraz z typowanymi przyczynami: `codex_subscription_required`, `codex_account_unavailable`, `plugin_disabled` lub `plugin_read_unavailable`. W przypadku użycia `--verify-plugin-apps` błędy inwentaryzacji aplikacji źródłowych mogą być również zgłaszane jako `app_inaccessible`, `app_disabled`, `app_missing` lub `app_inventory_unavailable`. Instalacje wymagające uwierzytelnienia po stronie docelowej są zgłaszane w elemencie odpowiedniego pluginu z `status: "skipped"`, `reason: "auth_required"` oraz oczyszczonymi identyfikatorami aplikacji; ich jawne wpisy konfiguracyjne są zapisywane jako wyłączone do czasu ponownej autoryzacji i włączenia. Inne błędy instalacji są wynikami `error` ograniczonymi do poszczególnych elementów.

Jeśli podczas planowania inwentaryzacja pluginów serwera aplikacji Codex jest niedostępna, migracja korzysta z buforowanych elementów informacyjnych pakietu zamiast przerywać całą migrację.

## Dostawca Hermes

Wbudowany dostawca Hermes domyślnie wykrywa stan w `~/.hermes`. Użyj `--from <path>`, jeśli Hermes znajduje się w innym miejscu.

### Co importuje Hermes

- Domyślną konfigurację modelu z `config.yaml`.
- Skonfigurowanych dostawców modeli i niestandardowe punkty końcowe zgodne z OpenAI z `providers` i `custom_providers`.
- Definicje serwerów MCP z `mcp_servers` lub `mcp.servers`.
- Pliki `SOUL.md` i `AGENTS.md` do przestrzeni roboczej agenta OpenClaw.
- Zawartość `memories/MEMORY.md` i `memories/USER.md` dołączaną do plików pamięci przestrzeni roboczej.
- Domyślne ustawienia konfiguracji pamięci plikowej OpenClaw oraz elementy archiwalne lub wymagające ręcznego przeglądu dla zewnętrznych dostawców pamięci, takich jak Honcho.
- Skills zawierające plik `SKILL.md` w katalogu `skills/<name>/`.
- Wartości konfiguracji poszczególnych Skills z `skills.config`.
- Dane uwierzytelniające OpenAI OAuth z pliku `auth.json` OpenCode, gdy zaakceptowano interaktywną migrację danych uwierzytelniających lub ustawiono `--include-secrets`. Wpisy OAuth w pliku `auth.json` Hermes są stanem starszego typu zgłaszanym w celu ręcznego ponownego uwierzytelnienia OpenAI lub naprawy za pomocą narzędzia doctor.
- Obsługiwane klucze API i tokeny z pliku `.env` Hermes oraz pliku `auth.json` OpenCode, gdy zaakceptowano interaktywną migrację danych uwierzytelniających lub ustawiono `--include-secrets`.

### Obsługiwane klucze `.env`

`AI_GATEWAY_API_KEY`, `ALIBABA_API_KEY`, `ANTHROPIC_API_KEY`, `ARCEEAI_API_KEY`, `CEREBRAS_API_KEY`, `CHUTES_API_KEY`, `CLOUDFLARE_AI_GATEWAY_API_KEY`, `COPILOT_GITHUB_TOKEN`, `DASHSCOPE_API_KEY`, `DEEPINFRA_API_KEY`, `DEEPSEEK_API_KEY`, `FIREWORKS_API_KEY`, `GEMINI_API_KEY`, `GH_TOKEN`, `GITHUB_TOKEN`, `GLM_API_KEY`, `GOOGLE_API_KEY`, `GROQ_API_KEY`, `HF_TOKEN`, `HUGGINGFACE_HUB_TOKEN`, `KILOCODE_API_KEY`, `KIMICODE_API_KEY`, `KIMI_API_KEY`, `MINIMAX_API_KEY`, `MINIMAX_CODING_API_KEY`, `MISTRAL_API_KEY`, `MODELSTUDIO_API_KEY`, `MOONSHOT_API_KEY`, `NVIDIA_API_KEY`, `OPENAI_API_KEY`, `OPENCODE_API_KEY`, `OPENCODE_GO_API_KEY`, `OPENCODE_ZEN_API_KEY`, `OPENROUTER_API_KEY`, `QIANFAN_API_KEY`, `QWEN_API_KEY`, `TOGETHER_API_KEY`, `VENICE_API_KEY`, `XAI_API_KEY`, `XIAOMI_API_KEY`, `ZAI_API_KEY`, `Z_AI_API_KEY`.

### Stan przeznaczony wyłącznie do archiwizacji

Stan Hermes, którego OpenClaw nie może bezpiecznie zinterpretować, jest kopiowany do raportu migracji w celu ręcznego przeglądu, ale nie jest wczytywany do aktywnej konfiguracji ani danych uwierzytelniających OpenClaw. Pozwala to zachować nieprzejrzysty lub niebezpieczny stan bez sugerowania, że OpenClaw może go automatycznie wykonywać lub uznać za zaufany: `plugins/`, `sessions/`, `logs/`, `cron/`, `mcp-tokens/`, `state.db`.

### Po zastosowaniu

```bash
openclaw doctor
```

## Kontrakt pluginu

Źródłami migracji są pluginy. Plugin deklaruje identyfikatory swoich dostawców w pliku `openclaw.plugin.json`:

```json
{
  "contracts": {
    "migrationProviders": ["hermes"]
  }
}
```

W czasie działania plugin wywołuje `api.registerMigrationProvider(...)`. Dostawca implementuje metody `detect`, `plan` i `apply`. Rdzeń odpowiada za koordynację CLI, zasady tworzenia kopii zapasowych, monity, dane wyjściowe JSON oraz wstępne sprawdzanie konfliktów. Rdzeń przekazuje sprawdzony plan do `apply(ctx, plan)`, a dostawcy mogą ponownie utworzyć plan tylko wtedy, gdy ten argument nie został przekazany ze względów zgodności.

Pluginy dostawców mogą korzystać z `openclaw/plugin-sdk/migration` do tworzenia elementów i zliczania podsumowań, a także z `openclaw/plugin-sdk/migration-runtime` do kopiowania plików z uwzględnieniem konfliktów, kopiowania do raportu elementów przeznaczonych wyłącznie do archiwizacji, buforowanych nakładek środowiska wykonawczego konfiguracji oraz raportów migracji.

## Integracja z wdrażaniem

Proces wdrażania może zaproponować migrację, gdy dostawca wykryje znane źródło. Zarówno `openclaw onboard --flow import`, jak i `openclaw setup --wizard --import-from hermes` korzystają z tego samego dostawcy migracji pluginu i nadal wyświetlają podgląd przed zastosowaniem.

<Note>
Importowanie podczas wdrażania wymaga świeżej konfiguracji OpenClaw. Jeśli masz już stan lokalny, najpierw zresetuj konfigurację, dane uwierzytelniające, sesje i przestrzeń roboczą. Importy z kopią zapasową i nadpisaniem lub scalaniem dla istniejących konfiguracji są dostępne tylko po włączeniu odpowiedniej funkcji.
</Note>

## Powiązane materiały

- [Migracja z Hermes](/pl/install/migrating-hermes): przewodnik dla użytkownika.
- [Migracja z Claude](/pl/install/migrating-claude): przewodnik dla użytkownika.
- [Migracja](/pl/install/migrating): przenoszenie OpenClaw na nowy komputer.
- [Doctor](/pl/gateway/doctor): kontrola stanu po zastosowaniu migracji.
- [Pluginy](/pl/tools/plugin): instalacja i rejestracja pluginów.
