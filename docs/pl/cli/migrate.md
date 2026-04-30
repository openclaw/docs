---
read_when:
    - Chcesz przeprowadzić migrację z systemu Hermes lub innego systemu agentowego do OpenClaw
    - Dodajesz dostawcę migracji zarządzanego przez Plugin
summary: Dokumentacja CLI dla `openclaw migrate` (importowanie stanu z innego systemu agentów)
title: Migracja
x-i18n:
    generated_at: "2026-04-30T09:44:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: d3db14c16b8f9dcbf86a4f12558cf4e8555aa9a255637034fb804148996a225e
    source_path: cli/migrate.md
    workflow: 16
---

# `openclaw migrate`

Importuj stan z innego systemu agentów przez dostawcę migracji należącego do pluginu. Wbudowani dostawcy obejmują [Claude](/pl/install/migrating-claude) i [Hermes](/pl/install/migrating-hermes); pluginy firm trzecich mogą rejestrować dodatkowych dostawców.

<Tip>
Instrukcje dla użytkowników znajdziesz w [Migracja z Claude](/pl/install/migrating-claude) i [Migracja z Hermes](/pl/install/migrating-hermes). [Centrum migracji](/pl/install/migrating) zawiera listę wszystkich ścieżek.
</Tip>

## Polecenia

```bash
openclaw migrate list
openclaw migrate claude --dry-run
openclaw migrate hermes --dry-run
openclaw migrate hermes
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
  Zezwól, aby zastosowanie zastępowało istniejące cele, gdy plan zgłasza konflikty.
</ParamField>
<ParamField path="--yes" type="boolean">
  Pomiń monit o potwierdzenie. Wymagane w trybie nieinteraktywnym.
</ParamField>
<ParamField path="--no-backup" type="boolean">
  Pomiń kopię zapasową przed zastosowaniem. Wymaga `--force`, gdy istnieje lokalny stan OpenClaw.
</ParamField>
<ParamField path="--force" type="boolean">
  Wymagane razem z `--no-backup`, gdy zastosowanie w przeciwnym razie odmówiłoby pominięcia kopii zapasowej.
</ParamField>
<ParamField path="--json" type="boolean">
  Wypisz plan lub wynik zastosowania jako JSON. Z `--json` i bez `--yes` zastosowanie wypisuje plan i nie modyfikuje stanu.
</ParamField>

## Model bezpieczeństwa

`openclaw migrate` działa najpierw w trybie podglądu.

<AccordionGroup>
  <Accordion title="Podgląd przed zastosowaniem">
    Dostawca zwraca szczegółowy plan przed jakimikolwiek zmianami, w tym konflikty, pominięte elementy i elementy wrażliwe. Plany JSON, dane wyjściowe zastosowania i raporty migracji redagują zagnieżdżone klucze wyglądające na tajne, takie jak klucze API, tokeny, nagłówki autoryzacji, pliki cookie i hasła.

    `openclaw migrate apply <provider>` wyświetla podgląd planu i pyta przed zmianą stanu, chyba że ustawiono `--yes`. W trybie nieinteraktywnym zastosowanie wymaga `--yes`.

  </Accordion>
  <Accordion title="Kopie zapasowe">
    Zastosowanie tworzy i weryfikuje kopię zapasową OpenClaw przed zastosowaniem migracji. Jeśli lokalny stan OpenClaw jeszcze nie istnieje, krok kopii zapasowej jest pomijany i migracja może być kontynuowana. Aby pominąć kopię zapasową, gdy stan istnieje, przekaż zarówno `--no-backup`, jak i `--force`.
  </Accordion>
  <Accordion title="Konflikty">
    Zastosowanie odmawia kontynuowania, gdy plan zawiera konflikty. Przejrzyj plan, a następnie uruchom ponownie z `--overwrite`, jeśli zastąpienie istniejących celów jest zamierzone. Dostawcy nadal mogą zapisywać kopie zapasowe na poziomie elementu dla nadpisanych plików w katalogu raportu migracji.
  </Accordion>
  <Accordion title="Sekrety">
    Sekrety nigdy nie są importowane domyślnie. Użyj `--include-secrets`, aby importować obsługiwane dane uwierzytelniające.
  </Accordion>
</AccordionGroup>

## Dostawca Claude

Wbudowany dostawca Claude domyślnie wykrywa stan Claude Code w `~/.claude`. Użyj `--from <path>`, aby zaimportować określony katalog domowy Claude Code lub katalog główny projektu.

<Tip>
Instrukcję dla użytkowników znajdziesz w [Migracja z Claude](/pl/install/migrating-claude).
</Tip>

### Co importuje Claude

- Projektowe `CLAUDE.md` i `.claude/CLAUDE.md` do obszaru roboczego agenta OpenClaw.
- Użytkownika `~/.claude/CLAUDE.md` dołączone do obszaru roboczego `USER.md`.
- Definicje serwerów MCP z projektowego `.mcp.json`, Claude Code `~/.claude.json` i Claude Desktop `claude_desktop_config.json`.
- Katalogi Skills Claude zawierające `SKILL.md`.
- Pliki Markdown poleceń Claude przekonwertowane na Skills OpenClaw tylko z ręcznym wywołaniem.

### Stan archiwum i ręcznego przeglądu

Hooki Claude, uprawnienia, domyślne wartości środowiska, pamięć lokalna, reguły zakresowane ścieżką, podagenci, pamięci podręczne, plany i historia projektu są zachowywane w raporcie migracji lub zgłaszane jako elementy do ręcznego przeglądu. OpenClaw nie wykonuje hooków, nie kopiuje szerokich list dozwolonych ani nie importuje automatycznie stanu danych uwierzytelniających OAuth/Desktop.

## Dostawca Hermes

Wbudowany dostawca Hermes domyślnie wykrywa stan w `~/.hermes`. Użyj `--from <path>`, gdy Hermes znajduje się gdzie indziej.

### Co importuje Hermes

- Domyślną konfigurację modelu z `config.yaml`.
- Skonfigurowanych dostawców modeli i niestandardowe punkty końcowe zgodne z OpenAI z `providers` i `custom_providers`.
- Definicje serwerów MCP z `mcp_servers` lub `mcp.servers`.
- `SOUL.md` i `AGENTS.md` do obszaru roboczego agenta OpenClaw.
- `memories/MEMORY.md` i `memories/USER.md` dołączone do plików pamięci obszaru roboczego.
- Domyślne wartości konfiguracji pamięci dla pamięci plikowej OpenClaw oraz elementy archiwum lub ręcznego przeglądu dla zewnętrznych dostawców pamięci, takich jak Honcho.
- Skills zawierające plik `SKILL.md` pod `skills/<name>/`.
- Wartości konfiguracji dla poszczególnych Skills z `skills.config`.
- Obsługiwane klucze API z `.env`, tylko z `--include-secrets`.

### Obsługiwane klucze `.env`

`OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `OPENROUTER_API_KEY`, `GOOGLE_API_KEY`, `GEMINI_API_KEY`, `GROQ_API_KEY`, `XAI_API_KEY`, `MISTRAL_API_KEY`, `DEEPSEEK_API_KEY`.

### Stan tylko archiwizowany

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

## Kontrakt pluginu

Źródła migracji są pluginami. Plugin deklaruje identyfikatory swoich dostawców w `openclaw.plugin.json`:

```json
{
  "contracts": {
    "migrationProviders": ["hermes"]
  }
}
```

W czasie działania plugin wywołuje `api.registerMigrationProvider(...)`. Dostawca implementuje `detect`, `plan` i `apply`. Rdzeń odpowiada za orkiestrację CLI, zasady kopii zapasowych, monity, dane wyjściowe JSON i wstępną kontrolę konfliktów. Rdzeń przekazuje przejrzany plan do `apply(ctx, plan)`, a dostawcy mogą ponownie zbudować plan tylko wtedy, gdy ten argument jest nieobecny ze względu na zgodność.

Pluginy dostawców mogą używać `openclaw/plugin-sdk/migration` do konstruowania elementów i zliczania podsumowań oraz `openclaw/plugin-sdk/migration-runtime` do kopiowania plików świadomego konfliktów, kopii raportów tylko do archiwum, buforowanych wrapperów config-runtime i raportów migracji.

## Integracja wdrażania

Wdrażanie może zaoferować migrację, gdy dostawca wykryje znane źródło. Zarówno `openclaw onboard --flow import`, jak i `openclaw setup --wizard --import-from hermes` używają tego samego dostawcy migracji pluginu i nadal pokazują podgląd przed zastosowaniem.

<Note>
Importy podczas wdrażania wymagają świeżej konfiguracji OpenClaw. Jeśli masz już lokalny stan, najpierw zresetuj konfigurację, dane uwierzytelniające, sesje i obszar roboczy. Importy typu kopia zapasowa plus nadpisanie lub scalanie są kontrolowane flagą funkcji dla istniejących konfiguracji.
</Note>

## Powiązane

- [Migracja z Hermes](/pl/install/migrating-hermes): instrukcja dla użytkowników.
- [Migracja z Claude](/pl/install/migrating-claude): instrukcja dla użytkowników.
- [Migracja](/pl/install/migrating): przenieś OpenClaw na nową maszynę.
- [Doctor](/pl/gateway/doctor): kontrola kondycji po zastosowaniu migracji.
- [Pluginy](/pl/tools/plugin): instalacja i rejestracja pluginów.
