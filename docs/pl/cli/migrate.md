---
read_when:
    - Chcesz przeprowadzić migrację z systemu Hermes lub innego systemu agentów do OpenClaw
    - Dodajesz dostawcę migracji zarządzanego przez Plugin
summary: Dokumentacja referencyjna CLI dla `openclaw migrate` (importowanie stanu z innego systemu agentów)
title: Migracja
x-i18n:
    generated_at: "2026-05-06T09:05:56Z"
    model: gpt-5.5
    provider: openai
    source_hash: 021d673f6e51f5c2320278f0a37830c9aa34cdb4628932be1c09714c375066e3
    source_path: cli/migrate.md
    workflow: 16
---

# `openclaw migrate`

Importuj stan z innego systemu agentów przez dostawcę migracji należącego do Plugin. Dostawcy wbudowani obejmują stan Codex CLI, [Claude](/pl/install/migrating-claude) i [Hermes](/pl/install/migrating-hermes); Plugin innych firm mogą rejestrować dodatkowych dostawców.

<Tip>
Instrukcje dla użytkowników znajdziesz w [Migracja z Claude](/pl/install/migrating-claude) i [Migracja z Hermes](/pl/install/migrating-hermes). [Centrum migracji](/pl/install/migrating) zawiera listę wszystkich ścieżek.
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
  Zastąp katalog stanu źródłowego. Hermes domyślnie używa `~/.hermes`.
</ParamField>
<ParamField path="--include-secrets" type="boolean">
  Importuj obsługiwane dane uwierzytelniające. Domyślnie wyłączone.
</ParamField>
<ParamField path="--overwrite" type="boolean">
  Pozwól operacji apply zastępować istniejące cele, gdy plan zgłasza konflikty.
</ParamField>
<ParamField path="--yes" type="boolean">
  Pomiń monit o potwierdzenie. Wymagane w trybie nieinteraktywnym.
</ParamField>
<ParamField path="--skill <name>" type="string">
  Wybierz jeden element kopiowania Skills według nazwy Skills lub identyfikatora elementu. Powtórz flagę, aby migrować wiele Skills. Gdy pominięte, interaktywne migracje Codex pokazują selektor pól wyboru, a migracje nieinteraktywne zachowują wszystkie zaplanowane Skills.
</ParamField>
<ParamField path="--no-backup" type="boolean">
  Pomiń kopię zapasową przed apply. Wymaga `--force`, gdy istnieje lokalny stan OpenClaw.
</ParamField>
<ParamField path="--force" type="boolean">
  Wymagane razem z `--no-backup`, gdy apply w innym przypadku odmówiłoby pominięcia kopii zapasowej.
</ParamField>
<ParamField path="--json" type="boolean">
  Wypisz plan lub wynik apply jako JSON. Z `--json` i bez `--yes`, apply wypisuje plan i nie modyfikuje stanu.
</ParamField>

## Model bezpieczeństwa

`openclaw migrate` najpierw pokazuje podgląd.

<AccordionGroup>
  <Accordion title="Podgląd przed apply">
    Dostawca zwraca wyszczególniony plan, zanim cokolwiek się zmieni, w tym konflikty, pominięte elementy i elementy wrażliwe. Plany JSON, wynik apply i raporty migracji redagują zagnieżdżone klucze wyglądające jak sekrety, takie jak klucze API, tokeny, nagłówki autoryzacji, pliki cookie i hasła.

    `openclaw migrate apply <provider>` wyświetla podgląd planu i pyta o potwierdzenie przed zmianą stanu, chyba że ustawiono `--yes`. W trybie nieinteraktywnym apply wymaga `--yes`.

  </Accordion>
  <Accordion title="Kopie zapasowe">
    Apply tworzy i weryfikuje kopię zapasową OpenClaw przed zastosowaniem migracji. Jeśli lokalny stan OpenClaw jeszcze nie istnieje, krok kopii zapasowej jest pomijany i migracja może być kontynuowana. Aby pominąć kopię zapasową, gdy stan istnieje, przekaż jednocześnie `--no-backup` i `--force`.
  </Accordion>
  <Accordion title="Konflikty">
    Apply odmawia kontynuacji, gdy plan zawiera konflikty. Przejrzyj plan, a następnie uruchom ponownie z `--overwrite`, jeśli zastąpienie istniejących celów jest zamierzone. Dostawcy nadal mogą zapisywać kopie zapasowe na poziomie elementów dla nadpisanych plików w katalogu raportu migracji.
  </Accordion>
  <Accordion title="Sekrety">
    Sekrety nigdy nie są importowane domyślnie. Użyj `--include-secrets`, aby importować obsługiwane dane uwierzytelniające.
  </Accordion>
</AccordionGroup>

## Dostawca Claude

Wbudowany dostawca Claude domyślnie wykrywa stan Claude Code w `~/.claude`. Użyj `--from <path>`, aby importować określony katalog domowy Claude Code lub katalog główny projektu.

<Tip>
Instrukcje dla użytkowników znajdziesz w [Migracja z Claude](/pl/install/migrating-claude).
</Tip>

### Co importuje Claude

- Projektowe `CLAUDE.md` i `.claude/CLAUDE.md` do przestrzeni roboczej agenta OpenClaw.
- Użytkownika `~/.claude/CLAUDE.md` dołączone do `USER.md` w przestrzeni roboczej.
- Definicje serwerów MCP z projektowego `.mcp.json`, Claude Code `~/.claude.json` i Claude Desktop `claude_desktop_config.json`.
- Katalogi Skills Claude, które zawierają `SKILL.md`.
- Pliki Markdown poleceń Claude przekonwertowane na Skills OpenClaw tylko z ręcznym wywołaniem.

### Stan archiwum i ręcznego przeglądu

Hooki Claude, uprawnienia, domyślne ustawienia środowiska, pamięć lokalna, reguły zakresowane ścieżkami, subagenci, pamięci podręczne, plany i historia projektu są zachowywane w raporcie migracji lub zgłaszane jako elementy do ręcznego przeglądu. OpenClaw nie wykonuje hooków, nie kopiuje szerokich list dozwolonych ani nie importuje automatycznie stanu danych uwierzytelniających OAuth/Desktop.

## Dostawca Codex

Wbudowany dostawca Codex domyślnie wykrywa stan Codex CLI w `~/.codex` lub
w `CODEX_HOME`, gdy ta zmienna środowiskowa jest ustawiona. Użyj `--from <path>`, aby
zinwentaryzować określony katalog domowy Codex.

Użyj tego dostawcy, gdy przechodzisz na harness OpenClaw Codex i chcesz
świadomie promować przydatne osobiste zasoby Codex CLI. Lokalne uruchomienia
serwera aplikacji Codex używają katalogów `CODEX_HOME` i `HOME` dla danego agenta,
więc domyślnie nie odczytują osobistego stanu Codex CLI.

Uruchomienie `openclaw migrate codex` w interaktywnym terminalu pokazuje podgląd pełnego
planu, a następnie otwiera selektor pól wyboru dla elementów kopiowania Skills przed końcowym
potwierdzeniem apply. Użyj `Toggle all on` lub `Toggle all off` do wyboru zbiorczego;
zaplanowane Skills zaczynają jako zaznaczone, Skills z konfliktami jako niezaznaczone, a `Skip for now`
pozostawia Skills bez zmian bez stosowania. Do uruchomień skryptowych lub dokładnych przekaż
`--skill <name>` raz na Skills, na przykład:

```bash
openclaw migrate codex --dry-run --skill gog-vault77-google-workspace
openclaw migrate apply codex --yes --skill gog-vault77-google-workspace
```

### Co importuje Codex

- Katalogi Skills Codex CLI pod `$CODEX_HOME/skills`, z wyłączeniem pamięci podręcznej
  `.system` Codex.
- Osobiste AgentSkills pod `$HOME/.agents/skills`, kopiowane do bieżącej
  przestrzeni roboczej agenta OpenClaw, gdy chcesz własności na poziomie agenta.

### Stan Codex do ręcznego przeglądu

Natywne Plugin Codex, `config.toml` i natywne `hooks/hooks.json` nie są
aktywowane automatycznie. Plugin mogą udostępniać serwery MCP, aplikacje, hooki lub inne
zachowanie wykonywalne, więc dostawca zgłasza je do przeglądu zamiast ładować
je do OpenClaw. Pliki konfiguracji i hooków są kopiowane do raportu migracji
do ręcznego przeglądu.

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
- Wartości konfiguracji dla poszczególnych Skills z `skills.config`.
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

Źródła migracji to Plugin. Plugin deklaruje identyfikatory dostawców w `openclaw.plugin.json`:

```json
{
  "contracts": {
    "migrationProviders": ["hermes"]
  }
}
```

W czasie działania Plugin wywołuje `api.registerMigrationProvider(...)`. Dostawca implementuje `detect`, `plan` i `apply`. Core odpowiada za orkiestrację CLI, politykę kopii zapasowych, monity, wyjście JSON i wstępne sprawdzanie konfliktów. Core przekazuje przejrzany plan do `apply(ctx, plan)`, a dostawcy mogą przebudować plan tylko wtedy, gdy ten argument jest nieobecny ze względu na zgodność.

Plugin dostawców mogą używać `openclaw/plugin-sdk/migration` do konstruowania elementów i zliczeń podsumowania oraz `openclaw/plugin-sdk/migration-runtime` do kopiowania plików z uwzględnieniem konfliktów, kopii raportów tylko do archiwum, buforowanych wrapperów config-runtime i raportów migracji.

## Integracja onboardingu

Onboarding może zaproponować migrację, gdy dostawca wykryje znane źródło. Zarówno `openclaw onboard --flow import`, jak i `openclaw setup --wizard --import-from hermes` używają tego samego dostawcy migracji Plugin i nadal pokazują podgląd przed zastosowaniem.

<Note>
Importy onboardingu wymagają świeżej konfiguracji OpenClaw. Jeśli masz już lokalny stan, najpierw zresetuj konfigurację, dane uwierzytelniające, sesje i przestrzeń roboczą. Importy z kopią zapasową i nadpisaniem albo scalaniem są objęte flagą funkcji dla istniejących konfiguracji.
</Note>

## Powiązane

- [Migracja z Hermes](/pl/install/migrating-hermes): instrukcja dla użytkowników.
- [Migracja z Claude](/pl/install/migrating-claude): instrukcja dla użytkowników.
- [Migracja](/pl/install/migrating): przenieś OpenClaw na nową maszynę.
- [Doctor](/pl/gateway/doctor): kontrola kondycji po zastosowaniu migracji.
- [Plugin](/pl/tools/plugin): instalacja i rejestracja Plugin.
