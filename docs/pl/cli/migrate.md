---
read_when:
    - Chcesz przeprowadzić migrację z Hermes lub innego systemu agentów do OpenClaw
    - Dodajesz dostawcę migracji należącego do Plugin
summary: Dokumentacja CLI dla `openclaw migrate` (importowanie stanu z innego systemu agentów)
title: Migracja
x-i18n:
    generated_at: "2026-05-12T00:58:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: 95d31d2995d426c7886700c9e0e6c6fa0c013a27c0bfe7cf91380c8029d6df89
    source_path: cli/migrate.md
    workflow: 16
---

# `openclaw migrate`

Importuj stan z innego systemu agentów przez dostawcę migracji należącego do Plugin. Wbudowani dostawcy obejmują stan Codex CLI, [Claude](/pl/install/migrating-claude) i [Hermes](/pl/install/migrating-hermes); Plugin innych firm mogą rejestrować dodatkowych dostawców.

<Tip>
Przewodniki dla użytkowników znajdziesz w [Migracja z Claude](/pl/install/migrating-claude) i [Migracja z Hermes](/pl/install/migrating-hermes). [Centrum migracji](/pl/install/migrating) zawiera listę wszystkich ścieżek.
</Tip>

## Polecenia

```bash
openclaw migrate list
openclaw migrate claude --dry-run
openclaw migrate codex --dry-run
openclaw migrate codex --skill gog-vault77-google-workspace
openclaw migrate codex --plugin google-calendar --dry-run
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

<ParamField path="<provider>" type="string">
  Nazwa zarejestrowanego dostawcy migracji, na przykład `hermes`. Uruchom `openclaw migrate list`, aby zobaczyć zainstalowanych dostawców.
</ParamField>
<ParamField path="--dry-run" type="boolean">
  Zbuduj plan i zakończ bez zmieniania stanu.
</ParamField>
<ParamField path="--from <path>" type="string">
  Zastąp katalog stanu źródłowego. Hermes domyślnie używa `~/.hermes`.
</ParamField>
<ParamField path="--include-secrets" type="boolean">
  Importuj obsługiwane dane uwierzytelniające. Domyślnie wyłączone.
</ParamField>
<ParamField path="--overwrite" type="boolean">
  Pozwól, aby apply zastępowało istniejące cele, gdy plan zgłasza konflikty.
</ParamField>
<ParamField path="--yes" type="boolean">
  Pomiń monit o potwierdzenie. Wymagane w trybie nieinteraktywnym.
</ParamField>
<ParamField path="--skill <name>" type="string">
  Wybierz jeden element kopiowania skill według nazwy skill lub identyfikatora elementu. Powtórz flagę, aby zmigrować wiele skills. Gdy pominięte, interaktywne migracje Codex pokazują selektor pól wyboru, a migracje nieinteraktywne zachowują wszystkie zaplanowane skills.
</ParamField>
<ParamField path="--plugin <name>" type="string">
  Wybierz jeden element instalacji Plugin Codex według nazwy Plugin lub identyfikatora elementu. Powtórz flagę, aby zmigrować wiele Plugin Codex. Gdy pominięte, interaktywne migracje Codex pokazują natywny selektor pól wyboru Plugin Codex, a migracje nieinteraktywne zachowują wszystkie zaplanowane Plugin. Dotyczy to tylko zainstalowanych ze źródła Plugin Codex `openai-curated` wykrytych przez inwentarz serwera aplikacji Codex.
</ParamField>
<ParamField path="--no-backup" type="boolean">
  Pomiń kopię zapasową przed apply. Wymaga `--force`, gdy istnieje lokalny stan OpenClaw.
</ParamField>
<ParamField path="--force" type="boolean">
  Wymagane razem z `--no-backup`, gdy apply w przeciwnym razie odmówiłoby pominięcia kopii zapasowej.
</ParamField>
<ParamField path="--json" type="boolean">
  Wydrukuj plan lub wynik apply jako JSON. Z `--json` i bez `--yes` apply drukuje plan i nie modyfikuje stanu.
</ParamField>

## Model bezpieczeństwa

`openclaw migrate` działa najpierw w trybie podglądu.

<AccordionGroup>
  <Accordion title="Podgląd przed apply">
    Dostawca zwraca szczegółowy plan, zanim cokolwiek się zmieni, w tym konflikty, pominięte elementy i elementy wrażliwe. Plany JSON, dane wyjściowe apply i raporty migracji redagują zagnieżdżone klucze wyglądające jak sekrety, takie jak klucze API, tokeny, nagłówki autoryzacji, pliki cookie i hasła.

    `openclaw migrate apply <provider>` wyświetla podgląd planu i pyta o potwierdzenie przed zmianą stanu, chyba że ustawiono `--yes`. W trybie nieinteraktywnym apply wymaga `--yes`.

  </Accordion>
  <Accordion title="Kopie zapasowe">
    Apply tworzy i weryfikuje kopię zapasową OpenClaw przed zastosowaniem migracji. Jeśli lokalny stan OpenClaw jeszcze nie istnieje, krok kopii zapasowej jest pomijany, a migracja może być kontynuowana. Aby pominąć kopię zapasową, gdy stan istnieje, przekaż zarówno `--no-backup`, jak i `--force`.
  </Accordion>
  <Accordion title="Konflikty">
    Apply odmawia kontynuowania, gdy plan ma konflikty. Przejrzyj plan, a następnie uruchom ponownie z `--overwrite`, jeśli zastępowanie istniejących celów jest zamierzone. Dostawcy mogą nadal zapisywać kopie zapasowe na poziomie elementu dla nadpisanych plików w katalogu raportu migracji.
  </Accordion>
  <Accordion title="Sekrety">
    Sekrety nigdy nie są importowane domyślnie. Użyj `--include-secrets`, aby zaimportować obsługiwane dane uwierzytelniające.
  </Accordion>
</AccordionGroup>

## Dostawca Claude

Wbudowany dostawca Claude domyślnie wykrywa stan Claude Code w `~/.claude`. Użyj `--from <path>`, aby zaimportować konkretny katalog domowy lub katalog główny projektu Claude Code.

<Tip>
Przewodnik dla użytkowników znajdziesz w [Migracja z Claude](/pl/install/migrating-claude).
</Tip>

### Co importuje Claude

- Projektowe `CLAUDE.md` i `.claude/CLAUDE.md` do przestrzeni roboczej agenta OpenClaw.
- Użytkownika `~/.claude/CLAUDE.md` dołączone do `USER.md` przestrzeni roboczej.
- Definicje serwerów MCP z projektowego `.mcp.json`, Claude Code `~/.claude.json` i Claude Desktop `claude_desktop_config.json`.
- Katalogi skill Claude, które zawierają `SKILL.md`.
- Pliki Markdown poleceń Claude przekonwertowane na skills OpenClaw tylko z ręcznym wywołaniem.

### Stan archiwum i ręcznego przeglądu

Hooki Claude, uprawnienia, domyślne środowisko, pamięć lokalna, reguły ograniczone do ścieżek, subagenci, pamięci podręczne, plany i historia projektu są zachowywane w raporcie migracji lub zgłaszane jako elementy do ręcznego przeglądu. OpenClaw nie wykonuje hooków, nie kopiuje szerokich list dozwolonych elementów ani nie importuje automatycznie stanu danych uwierzytelniających OAuth/Desktop.

## Dostawca Codex

Wbudowany dostawca Codex domyślnie wykrywa stan Codex CLI w `~/.codex` albo
w `CODEX_HOME`, gdy ta zmienna środowiskowa jest ustawiona. Użyj `--from <path>`, aby
zinwentaryzować konkretny katalog domowy Codex.

Użyj tego dostawcy podczas przechodzenia na uprząż OpenClaw Codex i gdy chcesz
celowo promować przydatne osobiste zasoby Codex CLI. Lokalne uruchomienia
serwera aplikacji Codex używają katalogów `CODEX_HOME` i `HOME` przypisanych do
agenta, więc domyślnie nie odczytują osobistego stanu Codex CLI.

Uruchomienie `openclaw migrate codex` w terminalu interaktywnym pokazuje podgląd pełnego
planu, a następnie otwiera selektory pól wyboru przed końcowym potwierdzeniem apply. Elementy
kopiowania skill są pytane jako pierwsze. Użyj `Toggle all on` lub `Toggle all off` do zbiorczego
wyboru; zaplanowane skills zaczynają jako zaznaczone, skills z konfliktem zaczynają jako odznaczone, a
`Skip for now` pomija kopie skill w tym uruchomieniu, nadal przechodząc do wyboru
Plugin. Gdy zainstalowane ze źródła kuratorowane Plugin Codex nadają się do migracji, a
`--plugin` nie podano, migracja następnie pyta o aktywację natywnego Plugin Codex
według nazwy Plugin. Elementy Plugin
zaczynają jako zaznaczone, chyba że docelowa konfiguracja Plugin OpenClaw Codex już ma ten
Plugin. Istniejące docelowe Plugin zaczynają jako odznaczone i pokazują wskazówkę konfliktu, taką jak
`conflict: plugin exists`; wybierz `Toggle all off`, aby nie migrować żadnych natywnych Plugin Codex
w tym uruchomieniu, albo `Skip for now`, aby zatrzymać się przed apply. Dla skryptowanych lub
dokładnych uruchomień przekaż `--skill <name>` raz na skill, na przykład:

```bash
openclaw migrate codex --dry-run --skill gog-vault77-google-workspace
openclaw migrate apply codex --yes --skill gog-vault77-google-workspace
```

Użyj `--plugin <name>`, aby nieinteraktywnie ograniczyć migrację natywnego Plugin Codex
do jednego lub wielu zainstalowanych ze źródła kuratorowanych Plugin:

```bash
openclaw migrate codex --dry-run --plugin google-calendar
openclaw migrate apply codex --yes --plugin google-calendar
```

### Co importuje Codex

- Katalogi Skills Codex CLI pod `$CODEX_HOME/skills`, z wyłączeniem pamięci podręcznej
  `.system` Codex.
- Osobiste AgentSkills pod `$HOME/.agents/skills`, kopiowane do bieżącej
  przestrzeni roboczej agenta OpenClaw, gdy chcesz własności przypisanej do agenta.
- Zainstalowane ze źródła Plugin Codex `openai-curated` wykryte przez
  app-server Codex `plugin/list`. Apply wywołuje app-server `plugin/install` dla każdego
  wybranego Plugin, nawet jeśli docelowy app-server już zgłasza ten Plugin jako
  zainstalowany i włączony. Zmigrowane Plugin Codex są używalne tylko w sesjach, które
  wybierają natywną uprząż Codex; nie są udostępniane Pi, normalnym uruchomieniom dostawcy
  OpenAI, powiązaniom konwersacji ACP ani innym uprzężom.

### Stan Codex do ręcznego przeglądu

Codex `config.toml`, natywne `hooks/hooks.json`, niekuratorowane marketplace'y i
buforowane pakiety Plugin, które nie są zainstalowanymi ze źródła kuratorowanymi Plugin, nie są
aktywowane automatycznie. Są kopiowane lub zgłaszane w raporcie migracji do
ręcznego przeglądu.

Dla zmigrowanych zainstalowanych ze źródła kuratorowanych Plugin apply zapisuje:

- `plugins.entries.codex.enabled: true`
- `plugins.entries.codex.config.codexPlugins.enabled: true`
- `plugins.entries.codex.config.codexPlugins.allow_destructive_actions: true`
- jeden jawny wpis Plugin z `marketplaceName: "openai-curated"` i
  `pluginName` dla każdego wybranego Plugin

Migracja nigdy nie zapisuje `plugins["*"]` i nigdy nie przechowuje lokalnych ścieżek pamięci podręcznej marketplace.
Instalacje wymagające uwierzytelnienia są zgłaszane dla odpowiedniego elementu Plugin z
`status: "skipped"`, `reason: "auth_required"` i oczyszczonymi identyfikatorami aplikacji.
Ich jawne wpisy konfiguracji są zapisywane jako wyłączone, dopóki nie przeprowadzisz ponownej autoryzacji i
ich nie włączysz. Inne błędy instalacji są wynikami `error` ograniczonymi do elementu.

Jeśli inwentarz Plugin serwera aplikacji Codex jest niedostępny podczas planowania, migracja
wraca do doradczych elementów z buforowanych pakietów zamiast kończyć niepowodzeniem całą
migrację.

## Dostawca Hermes

Wbudowany dostawca Hermes domyślnie wykrywa stan w `~/.hermes`. Użyj `--from <path>`, gdy Hermes znajduje się gdzie indziej.

### Co importuje Hermes

- Domyślną konfigurację modelu z `config.yaml`.
- Skonfigurowanych dostawców modeli i niestandardowe punkty końcowe zgodne z OpenAI z `providers` i `custom_providers`.
- Definicje serwerów MCP z `mcp_servers` lub `mcp.servers`.
- `SOUL.md` i `AGENTS.md` do przestrzeni roboczej agenta OpenClaw.
- `memories/MEMORY.md` i `memories/USER.md` dołączone do plików pamięci przestrzeni roboczej.
- Domyślne ustawienia konfiguracji pamięci dla pamięci plikowej OpenClaw oraz elementy archiwum lub ręcznego przeglądu dla zewnętrznych dostawców pamięci, takich jak Honcho.
- Skills, które zawierają plik `SKILL.md` pod `skills/<name>/`.
- Wartości konfiguracji przypisane do skill z `skills.config`.
- Obsługiwane klucze API z `.env`, tylko z `--include-secrets`.

### Obsługiwane klucze `.env`

`OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `OPENROUTER_API_KEY`, `GOOGLE_API_KEY`, `GEMINI_API_KEY`, `GROQ_API_KEY`, `XAI_API_KEY`, `MISTRAL_API_KEY`, `DEEPSEEK_API_KEY`.

### Stan tylko do archiwum

Stan Hermes, którego OpenClaw nie może bezpiecznie zinterpretować, jest kopiowany do raportu migracji do ręcznego przeglądu, ale nie jest ładowany do aktywnej konfiguracji ani danych uwierzytelniających OpenClaw. Zachowuje to nieprzezroczysty lub niebezpieczny stan bez udawania, że OpenClaw może go automatycznie wykonać lub mu zaufać:

- `plugins/`
- `sessions/`
- `logs/`
- `cron/`
- `mcp-tokens/`
- `auth.json`
- `state.db`

### Po zastosowaniu

```bash
openclaw doctor
```

## Kontrakt Plugin

Źródła migracji są Plugin. Plugin deklaruje swoje identyfikatory dostawców w `openclaw.plugin.json`:

```json
{
  "contracts": {
    "migrationProviders": ["hermes"]
  }
}
```

W czasie działania Plugin wywołuje `api.registerMigrationProvider(...)`. Dostawca implementuje `detect`, `plan` i `apply`. Core odpowiada za orkiestrację CLI, politykę kopii zapasowych, monity, dane wyjściowe JSON i wstępne sprawdzanie konfliktów. Core przekazuje przejrzany plan do `apply(ctx, plan)`, a dostawcy mogą odbudować plan tylko wtedy, gdy ten argument jest nieobecny ze względów zgodności.

Plugin dostawców mogą używać `openclaw/plugin-sdk/migration` do konstruowania elementów i zliczeń podsumowania oraz `openclaw/plugin-sdk/migration-runtime` do kopiowania plików świadomego konfliktów, kopii raportowych tylko do archiwum, buforowanych wrapperów config-runtime i raportów migracji.

## Integracja z onboardingiem

Onboarding może zaoferować migrację, gdy dostawca wykryje znane źródło. Zarówno `openclaw onboard --flow import`, jak i `openclaw setup --wizard --import-from hermes` używają tego samego dostawcy migracji Plugin i nadal pokazują podgląd przed apply.

<Note>
Importy podczas onboardingu wymagają świeżej konfiguracji OpenClaw. Jeśli masz już stan lokalny, najpierw zresetuj konfigurację, dane uwierzytelniające, sesje i workspace. Importy z kopią zapasową i nadpisaniem albo scalaniem są objęte flagą funkcji dla istniejących konfiguracji.
</Note>

## Powiązane

- [Migracja z Hermes](/pl/install/migrating-hermes): przewodnik dla użytkownika.
- [Migracja z Claude](/pl/install/migrating-claude): przewodnik dla użytkownika.
- [Migracja](/pl/install/migrating): przenoszenie OpenClaw na nową maszynę.
- [Doctor](/pl/gateway/doctor): kontrola kondycji po zastosowaniu migracji.
- [Pluginy](/pl/tools/plugin): instalacja i rejestracja Pluginów.
