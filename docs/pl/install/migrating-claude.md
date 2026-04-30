---
read_when:
    - Przechodzisz z Claude Code lub Claude Desktop i chcesz zachować instrukcje, serwery MCP oraz Skills
    - Musisz zrozumieć, co OpenClaw importuje automatycznie, a co pozostaje tylko w archiwum
summary: Przenieś lokalny stan Claude Code i Claude Desktop do OpenClaw za pomocą importu z podglądem
title: Migracja z Claude
x-i18n:
    generated_at: "2026-04-30T10:01:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1b44eda85f3a3714d7d360d04fdd2c99a692fa6491f12e73847c5f08d702a62c
    source_path: install/migrating-claude.md
    workflow: 16
---

OpenClaw importuje lokalny stan Claude przez dołączonego dostawcę migracji Claude. Dostawca pokazuje podgląd każdego elementu przed zmianą stanu, redaguje sekrety w planach i raportach oraz tworzy zweryfikowaną kopię zapasową przed zastosowaniem zmian.

<Note>
Importy podczas wdrażania wymagają świeżej konfiguracji OpenClaw. Jeśli masz już lokalny stan OpenClaw, najpierw zresetuj konfigurację, poświadczenia, sesje i przestrzeń roboczą albo użyj bezpośrednio `openclaw migrate` z `--overwrite` po sprawdzeniu planu.
</Note>

## Dwa sposoby importu

<Tabs>
  <Tab title="Kreator wdrażania">
    Kreator proponuje Claude, gdy wykryje lokalny stan Claude.

    ```bash
    openclaw onboard --flow import
    ```

    Albo wskaż konkretne źródło:

    ```bash
    openclaw onboard --import-from claude --import-source ~/.claude
    ```

  </Tab>
  <Tab title="CLI">
    Użyj `openclaw migrate` do uruchomień skryptowych lub powtarzalnych. Pełny opis znajdziesz w [`openclaw migrate`](/pl/cli/migrate).

    ```bash
    openclaw migrate claude --dry-run
    openclaw migrate apply claude --yes
    ```

    Dodaj `--from <path>`, aby zaimportować konkretny katalog domowy Claude Code lub katalog główny projektu.

  </Tab>
</Tabs>

## Co jest importowane

<AccordionGroup>
  <Accordion title="Instrukcje i pamięć">
    - Zawartość projektu `CLAUDE.md` i `.claude/CLAUDE.md` jest kopiowana lub dołączana do `AGENTS.md` w przestrzeni roboczej agenta OpenClaw.
    - Zawartość użytkownika `~/.claude/CLAUDE.md` jest dołączana do `USER.md` w przestrzeni roboczej.

  </Accordion>
  <Accordion title="Serwery MCP">
    Definicje serwerów MCP są importowane z projektu `.mcp.json`, Claude Code `~/.claude.json` oraz Claude Desktop `claude_desktop_config.json`, gdy są obecne.
  </Accordion>
  <Accordion title="Skills i polecenia">
    - Claude Skills z plikiem `SKILL.md` są kopiowane do katalogu Skills przestrzeni roboczej OpenClaw.
    - Pliki Markdown poleceń Claude w `.claude/commands/` lub `~/.claude/commands/` są konwertowane na OpenClaw Skills z `disable-model-invocation: true`.

  </Accordion>
</AccordionGroup>

## Co pozostaje tylko w archiwum

Dostawca kopiuje te elementy do raportu migracji do ręcznego przeglądu, ale **nie** ładuje ich do aktywnej konfiguracji OpenClaw:

- hooki Claude
- uprawnienia Claude i szerokie listy dozwolonych narzędzi
- domyślne wartości środowiska Claude
- `CLAUDE.local.md`
- `.claude/rules/`
- podagenci Claude w `.claude/agents/` lub `~/.claude/agents/`
- katalogi pamięci podręcznej, planów i historii projektu Claude Code
- rozszerzenia Claude Desktop i poświadczenia przechowywane przez system operacyjny

OpenClaw odmawia automatycznego wykonywania hooków, ufania listom dozwolonych uprawnień albo dekodowania nieprzezroczystego stanu poświadczeń OAuth i Desktop. Przenieś potrzebne elementy ręcznie po sprawdzeniu archiwum.

## Wybór źródła

Bez `--from` OpenClaw sprawdza domyślny katalog domowy Claude Code w `~/.claude`, przykładowy plik stanu Claude Code `~/.claude.json` oraz konfigurację MCP Claude Desktop na macOS.

Gdy `--from` wskazuje katalog główny projektu, OpenClaw importuje tylko pliki Claude tego projektu, takie jak `CLAUDE.md`, `.claude/settings.json`, `.claude/commands/`, `.claude/skills/` i `.mcp.json`. Podczas importu z katalogu głównego projektu nie odczytuje globalnego katalogu domowego Claude.

## Zalecany przepływ

<Steps>
  <Step title="Podejrzyj plan">
    ```bash
    openclaw migrate claude --dry-run
    ```

    Plan wymienia wszystko, co zostanie zmienione, w tym konflikty, pominięte elementy i wartości wrażliwe zredagowane z zagnieżdżonych pól MCP `env` lub `headers`.

  </Step>
  <Step title="Zastosuj z kopią zapasową">
    ```bash
    openclaw migrate apply claude --yes
    ```

    OpenClaw tworzy i weryfikuje kopię zapasową przed zastosowaniem zmian.

  </Step>
  <Step title="Uruchom doctor">
    ```bash
    openclaw doctor
    ```

    [Doctor](/pl/gateway/doctor) sprawdza problemy z konfiguracją lub stanem po imporcie.

  </Step>
  <Step title="Uruchom ponownie i zweryfikuj">
    ```bash
    openclaw gateway restart
    openclaw status
    ```

    Potwierdź, że gateway działa poprawnie, a zaimportowane instrukcje, serwery MCP i Skills są załadowane.

  </Step>
</Steps>

## Obsługa konfliktów

Zastosowanie zmian odmawia kontynuowania, gdy plan zgłasza konflikty (plik lub wartość konfiguracji już istnieje w miejscu docelowym).

<Warning>
Uruchom ponownie z `--overwrite` tylko wtedy, gdy zastąpienie istniejącego celu jest zamierzone. Dostawcy nadal mogą zapisywać kopie zapasowe na poziomie elementów dla nadpisanych plików w katalogu raportu migracji.
</Warning>

W świeżej instalacji OpenClaw konflikty są nietypowe. Zwykle pojawiają się, gdy ponownie uruchamiasz import w konfiguracji, która ma już edycje użytkownika.

## Wynik JSON do automatyzacji

```bash
openclaw migrate claude --dry-run --json
openclaw migrate apply claude --json --yes
```

Z `--json` i bez `--yes` zastosowanie zmian wypisuje plan i nie modyfikuje stanu. To najbezpieczniejszy tryb dla CI i współdzielonych skryptów.

## Rozwiązywanie problemów

<AccordionGroup>
  <Accordion title="Stan Claude znajduje się poza ~/.claude">
    Przekaż `--from /actual/path` (CLI) albo `--import-source /actual/path` (wdrażanie).
  </Accordion>
  <Accordion title="Wdrażanie odmawia importu w istniejącej konfiguracji">
    Importy podczas wdrażania wymagają świeżej konfiguracji. Zresetuj stan i ponownie przejdź wdrażanie albo użyj bezpośrednio `openclaw migrate apply claude`, które obsługuje `--overwrite` i jawną kontrolę kopii zapasowej.
  </Accordion>
  <Accordion title="Serwery MCP z Claude Desktop nie zostały zaimportowane">
    Claude Desktop odczytuje `claude_desktop_config.json` ze ścieżki specyficznej dla platformy. Wskaż `--from` na katalog tego pliku, jeśli OpenClaw nie wykrył go automatycznie.
  </Accordion>
  <Accordion title="Polecenia Claude stały się Skills z wyłączonym wywoływaniem modelu">
    Zgodnie z projektem. Polecenia Claude są uruchamiane przez użytkownika, więc OpenClaw importuje je jako Skills z `disable-model-invocation: true`. Edytuj frontmatter każdego Skill, jeśli chcesz, aby agent wywoływał je automatycznie.
  </Accordion>
</AccordionGroup>

## Powiązane

- [`openclaw migrate`](/pl/cli/migrate): pełny opis CLI, kontrakt Plugin i kształty JSON.
- [Przewodnik po migracji](/pl/install/migrating): wszystkie ścieżki migracji.
- [Migracja z Hermes](/pl/install/migrating-hermes): druga ścieżka importu między systemami.
- [Wdrażanie](/pl/cli/onboard): przepływ kreatora i flagi nieinteraktywne.
- [Doctor](/pl/gateway/doctor): kontrola kondycji po migracji.
- [Przestrzeń robocza agenta](/pl/concepts/agent-workspace): gdzie znajdują się `AGENTS.md`, `USER.md` i Skills.
