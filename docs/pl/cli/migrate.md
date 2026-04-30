---
read_when:
    - Chcesz przeprowadzić migrację z Hermesa lub innego systemu agentowego do OpenClaw
    - Dodajesz dostawcę migracji zarządzanego przez Plugin
summary: Dokumentacja CLI dla `openclaw migrate` (importowanie stanu z innego systemu agentów)
title: Migracja
x-i18n:
    generated_at: "2026-04-30T20:05:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: ffcd9e874bdaa0a5195e712d4fccd7b3d53034cb362c7f7462e9c7df72477b1a
    source_path: cli/migrate.md
    workflow: 16
---

# `openclaw migrate`

Importuj stan z innego systemu agentów za pośrednictwem dostawcy migracji należącego do Plugin. Wbudowani dostawcy obejmują stan Codex CLI, [Claude](/pl/install/migrating-claude) i [Hermes](/pl/install/migrating-hermes); Pluginy zewnętrzne mogą rejestrować dodatkowych dostawców.

<Tip>
Instrukcje dla użytkowników znajdziesz w sekcjach [Migracja z Claude](/pl/install/migrating-claude) i [Migracja z Hermes](/pl/install/migrating-hermes). [Centrum migracji](/pl/install/migrating) zawiera listę wszystkich ścieżek.
</Tip>

## Polecenia

```bash
openclaw migrate list
openclaw migrate claude --dry-run
openclaw migrate codex --dry-run
openclaw migrate codex --skill gog-vault77-google-workspace
openclaw migrate hermes --dry-run
openclaw migrate hermes
openclaw migrate apply codex --yes --skill gog-vault77-google-workspace
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
  Zastąp katalog źródłowy stanu. Hermes domyślnie używa `~/.hermes`.
</ParamField>
<ParamField path="--include-secrets" type="boolean">
  Importuj obsługiwane dane uwierzytelniające. Domyślnie wyłączone.
</ParamField>
<ParamField path="--overwrite" type="boolean">
  Pozwól, aby zastosowanie migracji zastępowało istniejące cele, gdy plan zgłasza konflikty.
</ParamField>
<ParamField path="--yes" type="boolean">
  Pomiń monit o potwierdzenie. Wymagane w trybie nieinteraktywnym.
</ParamField>
<ParamField path="--skill <name>" type="string">
  Wybierz jeden element kopiowania umiejętności według nazwy umiejętności lub identyfikatora elementu. Powtórz flagę, aby zmigrować wiele umiejętności. Gdy flaga zostanie pominięta, interaktywne migracje Codex pokazują selektor z polami wyboru, a migracje nieinteraktywne zachowują wszystkie zaplanowane umiejętności.
</ParamField>
<ParamField path="--no-backup" type="boolean">
  Pomiń kopię zapasową przed zastosowaniem. Wymaga `--force`, gdy istnieje lokalny stan OpenClaw.
</ParamField>
<ParamField path="--force" type="boolean">
  Wymagane razem z `--no-backup`, gdy zastosowanie w przeciwnym razie odmówiłoby pominięcia kopii zapasowej.
</ParamField>
<ParamField path="--json" type="boolean">
  Wypisz plan lub wynik zastosowania jako JSON. Z `--json` i bez `--yes`, zastosowanie wypisuje plan i nie modyfikuje stanu.
</ParamField>

## Model bezpieczeństwa

`openclaw migrate` działa najpierw w trybie podglądu.

<AccordionGroup>
  <Accordion title="Podgląd przed zastosowaniem">
    Dostawca zwraca wyszczególniony plan, zanim cokolwiek się zmieni, w tym konflikty, pominięte elementy i elementy wrażliwe. Plany JSON, dane wyjściowe zastosowania i raporty migracji redagują zagnieżdżone klucze wyglądające jak sekrety, takie jak klucze API, tokeny, nagłówki autoryzacji, ciasteczka i hasła.

    `openclaw migrate apply <provider>` wyświetla podgląd planu i prosi o potwierdzenie przed zmianą stanu, chyba że ustawiono `--yes`. W trybie nieinteraktywnym zastosowanie wymaga `--yes`.

  </Accordion>
  <Accordion title="Kopie zapasowe">
    Zastosowanie tworzy i weryfikuje kopię zapasową OpenClaw przed zastosowaniem migracji. Jeśli lokalny stan OpenClaw jeszcze nie istnieje, krok kopii zapasowej jest pomijany, a migracja może być kontynuowana. Aby pominąć kopię zapasową, gdy stan istnieje, przekaż zarówno `--no-backup`, jak i `--force`.
  </Accordion>
  <Accordion title="Konflikty">
    Zastosowanie odmawia kontynuacji, gdy plan zawiera konflikty. Przejrzyj plan, a następnie uruchom ponownie z `--overwrite`, jeśli zastąpienie istniejących celów jest zamierzone. Dostawcy nadal mogą zapisywać kopie zapasowe na poziomie elementów dla nadpisanych plików w katalogu raportu migracji.
  </Accordion>
  <Accordion title="Sekrety">
    Sekrety nigdy nie są domyślnie importowane. Użyj `--include-secrets`, aby zaimportować obsługiwane dane uwierzytelniające.
  </Accordion>
</AccordionGroup>

## Dostawca Claude

Wbudowany dostawca Claude domyślnie wykrywa stan Claude Code w `~/.claude`. Użyj `--from <path>`, aby zaimportować określony katalog domowy Claude Code lub katalog główny projektu.

<Tip>
Instrukcję dla użytkowników znajdziesz w sekcji [Migracja z Claude](/pl/install/migrating-claude).
</Tip>

### Co importuje Claude

- Projektowe `CLAUDE.md` i `.claude/CLAUDE.md` do obszaru roboczego agenta OpenClaw.
- Użytkownika `~/.claude/CLAUDE.md` dołączony do `USER.md` w obszarze roboczym.
- Definicje serwerów MCP z projektowego `.mcp.json`, Claude Code `~/.claude.json` i Claude Desktop `claude_desktop_config.json`.
- Katalogi umiejętności Claude zawierające `SKILL.md`.
- Pliki Markdown poleceń Claude przekonwertowane na umiejętności OpenClaw wyłącznie z ręcznym wywołaniem.

### Stan archiwum i ręcznego przeglądu

Hooki Claude, uprawnienia, domyślne ustawienia środowiska, pamięć lokalna, reguły ograniczone ścieżką, subagenci, pamięci podręczne, plany i historia projektu są zachowywane w raporcie migracji lub zgłaszane jako elementy do ręcznego przeglądu. OpenClaw nie wykonuje hooków, nie kopiuje szerokich list zezwoleń ani automatycznie nie importuje stanu danych uwierzytelniających OAuth/Desktop.

## Dostawca Codex

Wbudowany dostawca Codex domyślnie wykrywa stan Codex CLI w `~/.codex` albo
w `CODEX_HOME`, gdy ta zmienna środowiskowa jest ustawiona. Użyj `--from <path>`, aby
zinwentaryzować określony katalog domowy Codex.

Użyj tego dostawcy podczas przechodzenia na harness OpenClaw Codex, gdy chcesz
świadomie promować przydatne osobiste zasoby Codex CLI. Lokalne uruchomienia
serwera aplikacji Codex używają katalogów `CODEX_HOME` i `HOME` przypisanych do agenta, więc domyślnie nie czytają
Twojego osobistego stanu Codex CLI.

Uruchomienie `openclaw migrate codex` w interaktywnym terminalu pokazuje podgląd pełnego
planu, a następnie otwiera selektor z polami wyboru dla elementów kopiowania umiejętności przed końcowym
potwierdzeniem zastosowania. Wszystkie umiejętności są początkowo zaznaczone; odznacz dowolną umiejętność, której nie chcesz
skopiować do tego agenta. Dla uruchomień skryptowych lub dokładnych przekaż `--skill <name>` raz
na umiejętność, na przykład:

```bash
openclaw migrate codex --dry-run --skill gog-vault77-google-workspace
openclaw migrate apply codex --yes --skill gog-vault77-google-workspace
```

### Co importuje Codex

- Katalogi umiejętności Codex CLI w `$CODEX_HOME/skills`, z wyłączeniem pamięci podręcznej
  `.system` Codex.
- Osobiste AgentSkills w `$HOME/.agents/skills`, kopiowane do bieżącego
  obszaru roboczego agenta OpenClaw, gdy chcesz mieć własność przypisaną do agenta.

### Stan Codex do ręcznego przeglądu

Natywne Pluginy Codex, `config.toml` i natywne `hooks/hooks.json` nie są
aktywowane automatycznie. Pluginy mogą udostępniać serwery MCP, aplikacje, hooki lub inne
zachowania wykonywalne, więc dostawca zgłasza je do przeglądu zamiast ładować
do OpenClaw. Pliki konfiguracji i hooków są kopiowane do raportu migracji
do ręcznego przeglądu.

## Dostawca Hermes

Wbudowany dostawca Hermes domyślnie wykrywa stan w `~/.hermes`. Użyj `--from <path>`, gdy Hermes znajduje się gdzie indziej.

### Co importuje Hermes

- Domyślna konfiguracja modelu z `config.yaml`.
- Skonfigurowani dostawcy modeli i niestandardowe punkty końcowe zgodne z OpenAI z `providers` i `custom_providers`.
- Definicje serwerów MCP z `mcp_servers` lub `mcp.servers`.
- `SOUL.md` i `AGENTS.md` do obszaru roboczego agenta OpenClaw.
- `memories/MEMORY.md` i `memories/USER.md` dołączone do plików pamięci obszaru roboczego.
- Domyślne ustawienia konfiguracji pamięci dla pamięci plikowej OpenClaw oraz elementy archiwum lub ręcznego przeglądu dla zewnętrznych dostawców pamięci, takich jak Honcho.
- Skills zawierające plik `SKILL.md` w `skills/<name>/`.
- Wartości konfiguracji poszczególnych umiejętności z `skills.config`.
- Obsługiwane klucze API z `.env`, tylko z `--include-secrets`.

### Obsługiwane klucze `.env`

`OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `OPENROUTER_API_KEY`, `GOOGLE_API_KEY`, `GEMINI_API_KEY`, `GROQ_API_KEY`, `XAI_API_KEY`, `MISTRAL_API_KEY`, `DEEPSEEK_API_KEY`.

### Stan tylko do archiwum

Stan Hermes, którego OpenClaw nie może bezpiecznie zinterpretować, jest kopiowany do raportu migracji do ręcznego przeglądu, ale nie jest ładowany do aktywnej konfiguracji ani danych uwierzytelniających OpenClaw. Zachowuje to nieprzejrzysty lub niebezpieczny stan bez udawania, że OpenClaw może go automatycznie wykonać lub mu zaufać:

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

Źródła migracji to Pluginy. Plugin deklaruje identyfikatory swoich dostawców w `openclaw.plugin.json`:

```json
{
  "contracts": {
    "migrationProviders": ["hermes"]
  }
}
```

W czasie wykonywania Plugin wywołuje `api.registerMigrationProvider(...)`. Dostawca implementuje `detect`, `plan` i `apply`. Core odpowiada za orkiestrację CLI, politykę kopii zapasowych, monity, wyjście JSON i wstępną kontrolę konfliktów. Core przekazuje sprawdzony plan do `apply(ctx, plan)`, a dostawcy mogą odbudować plan tylko wtedy, gdy ten argument jest nieobecny ze względów zgodności.

Pluginy dostawców mogą używać `openclaw/plugin-sdk/migration` do tworzenia elementów i liczenia podsumowań oraz `openclaw/plugin-sdk/migration-runtime` do kopiowania plików z uwzględnieniem konfliktów, kopiowania raportów tylko do archiwum, buforowanych wrapperów config-runtime i raportów migracji.

## Integracja onboardingu

Onboarding może zaoferować migrację, gdy dostawca wykryje znane źródło. Zarówno `openclaw onboard --flow import`, jak i `openclaw setup --wizard --import-from hermes` używają tego samego dostawcy migracji Plugin i nadal pokazują podgląd przed zastosowaniem.

<Note>
Importy onboardingowe wymagają świeżej konfiguracji OpenClaw. Najpierw zresetuj konfigurację, dane uwierzytelniające, sesje i obszar roboczy, jeśli masz już lokalny stan. Importy typu kopia zapasowa plus nadpisanie lub scalanie są objęte bramką funkcji dla istniejących konfiguracji.
</Note>

## Powiązane

- [Migracja z Hermes](/pl/install/migrating-hermes): instrukcja dla użytkowników.
- [Migracja z Claude](/pl/install/migrating-claude): instrukcja dla użytkowników.
- [Migracja](/pl/install/migrating): przenoszenie OpenClaw na nową maszynę.
- [Doctor](/pl/gateway/doctor): kontrola kondycji po zastosowaniu migracji.
- [Pluginy](/pl/tools/plugin): instalacja i rejestracja Pluginów.
