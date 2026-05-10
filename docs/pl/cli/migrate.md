---
read_when:
    - Chcesz przeprowadzić migrację z systemu Hermes lub innego systemu agentowego do OpenClaw
    - Dodajesz dostawcę migracji zarządzanego przez Plugin
summary: Dokumentacja referencyjna CLI dla `openclaw migrate` (import stanu z innego systemu agentów)
title: Migracja
x-i18n:
    generated_at: "2026-05-10T19:29:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: bb32f993d2412a97a1f91bf3f2b3ca1a653d1db3db75aa90d3b834bdc6acbb95
    source_path: cli/migrate.md
    workflow: 16
---

# `openclaw migrate`

Importuj stan z innego systemu agenta przez dostawcę migracji należącego do plugina. Dołączone dostawcy obejmują stan Codex CLI, [Claude](/pl/install/migrating-claude) i [Hermes](/pl/install/migrating-hermes); pluginy firm trzecich mogą rejestrować dodatkowych dostawców.

<Tip>
Instrukcje dla użytkowników znajdziesz w sekcjach [Migracja z Claude](/pl/install/migrating-claude) i [Migracja z Hermes](/pl/install/migrating-hermes). [Centrum migracji](/pl/install/migrating) zawiera listę wszystkich ścieżek.
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
  Pozwól operacji apply zastępować istniejące cele, gdy plan zgłasza konflikty.
</ParamField>
<ParamField path="--yes" type="boolean">
  Pomiń monit potwierdzenia. Wymagane w trybie nieinteraktywnym.
</ParamField>
<ParamField path="--skill <name>" type="string">
  Wybierz jeden element kopiowania umiejętności według nazwy umiejętności lub identyfikatora elementu. Powtórz flagę, aby przenieść wiele umiejętności. Gdy pominięto, interaktywne migracje Codex pokazują selektor pól wyboru, a migracje nieinteraktywne zachowują wszystkie zaplanowane umiejętności.
</ParamField>
<ParamField path="--plugin <name>" type="string">
  Wybierz jeden element instalacji plugina Codex według nazwy plugina lub identyfikatora elementu. Powtórz flagę, aby przenieść wiele pluginów Codex. Gdy pominięto, interaktywne migracje Codex pokazują natywny selektor pól wyboru pluginów Codex, a migracje nieinteraktywne zachowują wszystkie zaplanowane pluginy. Dotyczy to tylko zainstalowanych ze źródła pluginów Codex `openai-curated`, wykrytych przez inwentarz app-servera Codex.
</ParamField>
<ParamField path="--no-backup" type="boolean">
  Pomiń kopię zapasową przed apply. Wymaga `--force`, gdy istnieje lokalny stan OpenClaw.
</ParamField>
<ParamField path="--force" type="boolean">
  Wymagane razem z `--no-backup`, gdy apply w innym przypadku odmówiłby pominięcia kopii zapasowej.
</ParamField>
<ParamField path="--json" type="boolean">
  Wypisz plan lub wynik apply jako JSON. Z `--json` i bez `--yes` apply wypisuje plan i nie modyfikuje stanu.
</ParamField>

## Model bezpieczeństwa

`openclaw migrate` najpierw pokazuje podgląd.

<AccordionGroup>
  <Accordion title="Podgląd przed apply">
    Dostawca zwraca szczegółowy plan, zanim cokolwiek się zmieni, w tym konflikty, pominięte elementy i elementy wrażliwe. Plany JSON, dane wyjściowe apply i raporty migracji redagują zagnieżdżone klucze wyglądające jak sekrety, takie jak klucze API, tokeny, nagłówki autoryzacji, pliki cookie i hasła.

    `openclaw migrate apply <provider>` pokazuje podgląd planu i pyta przed zmianą stanu, chyba że ustawiono `--yes`. W trybie nieinteraktywnym apply wymaga `--yes`.

  </Accordion>
  <Accordion title="Kopie zapasowe">
    Apply tworzy i weryfikuje kopię zapasową OpenClaw przed zastosowaniem migracji. Jeśli lokalny stan OpenClaw jeszcze nie istnieje, etap kopii zapasowej jest pomijany, a migracja może być kontynuowana. Aby pominąć kopię zapasową, gdy stan istnieje, przekaż zarówno `--no-backup`, jak i `--force`.
  </Accordion>
  <Accordion title="Konflikty">
    Apply odmawia kontynuacji, gdy plan zawiera konflikty. Przejrzyj plan, a następnie uruchom ponownie z `--overwrite`, jeśli zastąpienie istniejących celów jest zamierzone. Dostawcy nadal mogą zapisywać kopie zapasowe na poziomie elementu dla nadpisanych plików w katalogu raportu migracji.
  </Accordion>
  <Accordion title="Sekrety">
    Sekrety nigdy nie są importowane domyślnie. Użyj `--include-secrets`, aby zaimportować obsługiwane dane uwierzytelniające.
  </Accordion>
</AccordionGroup>

## Dostawca Claude

Dołączony dostawca Claude domyślnie wykrywa stan Claude Code w `~/.claude`. Użyj `--from <path>`, aby zaimportować określony katalog domowy Claude Code lub katalog główny projektu.

<Tip>
Instrukcję dla użytkowników znajdziesz w sekcji [Migracja z Claude](/pl/install/migrating-claude).
</Tip>

### Co importuje Claude

- Projektowe `CLAUDE.md` i `.claude/CLAUDE.md` do przestrzeni roboczej agenta OpenClaw.
- Użytkownika `~/.claude/CLAUDE.md` dołączone do `USER.md` w przestrzeni roboczej.
- Definicje serwerów MCP z projektowego `.mcp.json`, Claude Code `~/.claude.json` i Claude Desktop `claude_desktop_config.json`.
- Katalogi umiejętności Claude, które zawierają `SKILL.md`.
- Pliki Markdown poleceń Claude przekonwertowane na umiejętności OpenClaw wywoływane tylko ręcznie.

### Stan archiwum i przeglądu ręcznego

Hooki Claude, uprawnienia, domyślne środowiska, pamięć lokalna, reguły ograniczone ścieżką, podagenci, pamięci podręczne, plany i historia projektu są zachowywane w raporcie migracji albo zgłaszane jako elementy do przeglądu ręcznego. OpenClaw nie wykonuje hooków, nie kopiuje szerokich list dozwolonych ani nie importuje automatycznie stanu danych uwierzytelniających OAuth/Desktop.

## Dostawca Codex

Dołączony dostawca Codex domyślnie wykrywa stan Codex CLI w `~/.codex` albo
w `CODEX_HOME`, gdy ta zmienna środowiskowa jest ustawiona. Użyj `--from <path>`, aby
zinwentaryzować określony katalog domowy Codex.

Użyj tego dostawcy przy przechodzeniu na harness OpenClaw Codex, gdy chcesz
świadomie promować przydatne osobiste zasoby Codex CLI. Lokalne uruchomienia
app-servera Codex używają katalogów `CODEX_HOME` i `HOME` przypisanych do agenta,
więc domyślnie nie odczytują twojego osobistego stanu Codex CLI.

Uruchomienie `openclaw migrate codex` w terminalu interaktywnym pokazuje pełny
podgląd planu, a następnie otwiera selektory pól wyboru przed ostatecznym
potwierdzeniem apply. Elementy kopiowania umiejętności są pytane jako pierwsze.
Użyj `Toggle all on` lub `Toggle all off` do wyboru zbiorczego; zaplanowane
umiejętności zaczynają jako zaznaczone, umiejętności z konfliktem jako
niezaznaczone, a `Skip for now` pomija kopiowanie umiejętności w tym uruchomieniu,
nadal przechodząc do wyboru pluginów. Gdy zainstalowane ze źródła wyselekcjonowane
pluginy Codex można migrować, a `--plugin` nie zostało podane, migracja następnie
pyta o natywną aktywację plugina Codex według nazwy plugina. Elementy pluginów
zaczynają jako zaznaczone, chyba że docelowa konfiguracja plugina OpenClaw Codex
już ma ten plugin. Istniejące pluginy docelowe zaczynają jako niezaznaczone i
pokazują wskazówkę konfliktu, taką jak `conflict: plugin exists`; wybierz
`Toggle all off`, aby nie migrować natywnych pluginów Codex w tym uruchomieniu,
albo `Skip for now`, aby zatrzymać się przed zastosowaniem. W przypadku uruchomień
skryptowych lub dokładnych przekaż `--skill <name>` raz na każdą umiejętność, na przykład:

```bash
openclaw migrate codex --dry-run --skill gog-vault77-google-workspace
openclaw migrate apply codex --yes --skill gog-vault77-google-workspace
```

Użyj `--plugin <name>`, aby nieinteraktywnie ograniczyć migrację natywnych
pluginów Codex do jednego lub większej liczby zainstalowanych ze źródła
wyselekcjonowanych pluginów:

```bash
openclaw migrate codex --dry-run --plugin google-calendar
openclaw migrate apply codex --yes --plugin google-calendar
```

### Co importuje Codex

- Katalogi umiejętności Codex CLI pod `$CODEX_HOME/skills`, z wyłączeniem
  pamięci podręcznej `.system` Codex.
- Osobiste AgentSkills pod `$HOME/.agents/skills`, kopiowane do bieżącej
  przestrzeni roboczej agenta OpenClaw, gdy chcesz własności na poziomie agenta.
- Zainstalowane ze źródła pluginy Codex `openai-curated` wykryte przez
  app-server Codex `plugin/list`. Apply wywołuje app-server `plugin/install` dla
  każdego wybranego plugina, nawet jeśli docelowy app-server już zgłasza ten
  plugin jako zainstalowany i włączony. Zmigrowane pluginy Codex są użyteczne
  tylko w sesjach, które wybierają natywny harness Codex; nie są udostępniane Pi,
  zwykłym uruchomieniom dostawcy OpenAI, powiązaniom rozmów ACP ani innym harnessom.

### Stan Codex do przeglądu ręcznego

Codex `config.toml`, natywne `hooks/hooks.json`, nieselekcjonowane marketplace’y i
buforowane pakiety pluginów, które nie są zainstalowanymi ze źródła
wyselekcjonowanymi pluginami, nie są aktywowane automatycznie. Są kopiowane albo
zgłaszane w raporcie migracji do przeglądu ręcznego.

Dla zmigrowanych zainstalowanych ze źródła wyselekcjonowanych pluginów apply zapisuje:

- `plugins.entries.codex.enabled: true`
- `plugins.entries.codex.config.codexPlugins.enabled: true`
- `plugins.entries.codex.config.codexPlugins.allow_destructive_actions: false`
- jeden jawny wpis plugina z `marketplaceName: "openai-curated"` i
  `pluginName` dla każdego wybranego plugina

Migracja nigdy nie zapisuje `plugins["*"]` i nigdy nie przechowuje lokalnych
ścieżek pamięci podręcznej marketplace. Instalacje wymagające uwierzytelnienia są
zgłaszane na dotkniętym elemencie plugina z `status: "skipped"`,
`reason: "auth_required"` i oczyszczonymi identyfikatorami aplikacji.
Ich jawne wpisy konfiguracji są zapisywane jako wyłączone, dopóki ponownie nie
autoryzujesz i ich nie włączysz. Inne niepowodzenia instalacji są wynikami
`error` ograniczonymi do elementu.

Jeśli inwentarz pluginów app-servera Codex jest niedostępny podczas planowania,
migracja wraca do elementów doradczych z buforowanych pakietów zamiast kończyć
niepowodzeniem całą migrację.

## Dostawca Hermes

Dołączony dostawca Hermes domyślnie wykrywa stan w `~/.hermes`. Użyj `--from <path>`, gdy Hermes znajduje się gdzie indziej.

### Co importuje Hermes

- Domyślną konfigurację modelu z `config.yaml`.
- Skonfigurowanych dostawców modeli i niestandardowe punkty końcowe zgodne z OpenAI z `providers` i `custom_providers`.
- Definicje serwerów MCP z `mcp_servers` albo `mcp.servers`.
- `SOUL.md` i `AGENTS.md` do przestrzeni roboczej agenta OpenClaw.
- `memories/MEMORY.md` i `memories/USER.md` dołączone do plików pamięci przestrzeni roboczej.
- Domyślne ustawienia konfiguracji pamięci dla pamięci plikowej OpenClaw, plus elementy archiwum lub przeglądu ręcznego dla zewnętrznych dostawców pamięci, takich jak Honcho.
- Skills zawierające plik `SKILL.md` pod `skills/<name>/`.
- Wartości konfiguracji dla poszczególnych umiejętności z `skills.config`.
- Obsługiwane klucze API z `.env`, tylko z `--include-secrets`.

### Obsługiwane klucze `.env`

`OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `OPENROUTER_API_KEY`, `GOOGLE_API_KEY`, `GEMINI_API_KEY`, `GROQ_API_KEY`, `XAI_API_KEY`, `MISTRAL_API_KEY`, `DEEPSEEK_API_KEY`.

### Stan tylko do archiwum

Stan Hermes, którego OpenClaw nie może bezpiecznie zinterpretować, jest kopiowany do raportu migracji do przeglądu ręcznego, ale nie jest ładowany do aktywnej konfiguracji ani danych uwierzytelniających OpenClaw. Zachowuje to nieprzejrzysty lub niebezpieczny stan bez udawania, że OpenClaw może go automatycznie wykonać albo mu zaufać:

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

## Kontrakt plugina

Źródła migracji są pluginami. Plugin deklaruje identyfikatory swoich dostawców w `openclaw.plugin.json`:

```json
{
  "contracts": {
    "migrationProviders": ["hermes"]
  }
}
```

W czasie wykonywania plugin wywołuje `api.registerMigrationProvider(...)`. Dostawca implementuje `detect`, `plan` i `apply`. Rdzeń odpowiada za orkiestrację CLI, politykę kopii zapasowych, monity, dane wyjściowe JSON i wstępne sprawdzanie konfliktów. Rdzeń przekazuje sprawdzony plan do `apply(ctx, plan)`, a dostawcy mogą przebudować plan tylko wtedy, gdy tego argumentu brakuje ze względu na zgodność.

Pluginy dostawców mogą używać `openclaw/plugin-sdk/migration` do konstruowania elementów i liczników podsumowania, a także `openclaw/plugin-sdk/migration-runtime` do kopii plików świadomych konfliktów, kopii raportów tylko do archiwum, buforowanych wrapperów config-runtime i raportów migracji.

## Integracja onboardingu

Onboarding może zaoferować migrację, gdy dostawca wykryje znane źródło. Zarówno `openclaw onboard --flow import`, jak i `openclaw setup --wizard --import-from hermes` używają tego samego dostawcy migracji plugina i nadal pokazują podgląd przed zastosowaniem.

<Note>
Importy wdrożeniowe wymagają świeżej konfiguracji OpenClaw. Jeśli masz już stan lokalny, najpierw zresetuj konfigurację, dane uwierzytelniające, sesje i obszar roboczy. Importy z kopią zapasową i nadpisaniem lub importy scalające są dostępne za bramką funkcji dla istniejących konfiguracji.
</Note>

## Powiązane

- [Migracja z Hermes](/pl/install/migrating-hermes): przewodnik dla użytkowników.
- [Migracja z Claude](/pl/install/migrating-claude): przewodnik dla użytkowników.
- [Migracja](/pl/install/migrating): przenoszenie OpenClaw na nowy komputer.
- [Diagnostyka](/pl/gateway/doctor): kontrola stanu po zastosowaniu migracji.
- [Pluginy](/pl/tools/plugin): instalacja i rejestracja pluginów.
