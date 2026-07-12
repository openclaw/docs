---
read_when:
    - Przechodzisz z Claude Code lub Claude Desktop i chcesz zachować instrukcje, serwery MCP oraz Skills
    - Musisz zrozumieć, co OpenClaw importuje automatycznie, a co pozostaje wyłącznie w archiwum
summary: Przenieś lokalny stan Claude Code i Claude Desktop do OpenClaw, korzystając z importu z podglądem
title: Migracja z Claude
x-i18n:
    generated_at: "2026-07-12T15:16:16Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f31088b749a1bebe39b16f519b1817ffeb71ca31e8cbf46fd59db6ff603dbe0f
    source_path: install/migrating-claude.md
    workflow: 16
---

OpenClaw importuje lokalny stan Claude za pomocą dołączonego dostawcy migracji Claude. Dostawca wyświetla podgląd każdego elementu przed zmianą stanu, utajnia dane poufne w planach i raportach oraz tworzy zweryfikowaną kopię zapasową przed zastosowaniem zmian.

<Note>
Import podczas wdrażania wymaga świeżej konfiguracji OpenClaw. Jeśli masz już lokalny stan OpenClaw, najpierw zresetuj konfigurację, dane uwierzytelniające, sesje i obszar roboczy albo użyj bezpośrednio polecenia `openclaw migrate` z opcją `--overwrite` po przejrzeniu planu.
</Note>

## Dwa sposoby importowania

<Tabs>
  <Tab title="Kreator wdrażania">
    Kreator oferuje import z Claude po wykryciu lokalnego stanu Claude.

    ```bash
    openclaw onboard --flow import
    ```

    Możesz też wskazać konkretne źródło:

    ```bash
    openclaw onboard --import-from claude --import-source ~/.claude
    ```

  </Tab>
  <Tab title="CLI">
    Użyj `openclaw migrate` do uruchomień skryptowych lub powtarzalnych. Pełną dokumentację zawiera strona [`openclaw migrate`](/pl/cli/migrate).

    ```bash
    openclaw migrate claude --dry-run
    openclaw migrate apply claude --yes
    ```

    Dodaj `--from <path>`, aby zaimportować określony katalog domowy Claude Code lub katalog główny projektu.

  </Tab>
</Tabs>

## Co jest importowane

<AccordionGroup>
  <Accordion title="Instrukcje i pamięć">
    - Zawartość plików projektu `CLAUDE.md` i `.claude/CLAUDE.md` jest kopiowana lub dopisywana do pliku `AGENTS.md` w obszarze roboczym agenta OpenClaw.
    - Zawartość pliku użytkownika `~/.claude/CLAUDE.md` jest dopisywana do pliku `USER.md` w obszarze roboczym.

  </Accordion>
  <Accordion title="Serwery MCP">
    Definicje serwerów MCP są importowane z pliku projektu `.mcp.json`, pliku Claude Code `~/.claude.json` oraz pliku Claude Desktop `claude_desktop_config.json`, jeśli są dostępne.
  </Accordion>
  <Accordion title="Skills i polecenia">
    - Skills Claude zawierające plik `SKILL.md` są kopiowane do katalogu Skills w obszarze roboczym OpenClaw.
    - Pliki Markdown poleceń Claude znajdujące się w `.claude/commands/` lub `~/.claude/commands/` są konwertowane na Skills OpenClaw z ustawieniem `disable-model-invocation: true`.

  </Accordion>
</AccordionGroup>

## Co pozostaje wyłącznie w archiwum

Dostawca kopiuje poniższe elementy do raportu migracji w celu ręcznego przejrzenia, ale **nie** wczytuje ich do aktywnej konfiguracji OpenClaw:

- hooki Claude
- uprawnienia Claude i szerokie listy dozwolonych narzędzi
- domyślne ustawienia środowiska Claude
- `CLAUDE.local.md`
- `.claude/rules/`
- podagenci Claude w `.claude/agents/` lub `~/.claude/agents/`
- katalogi pamięci podręcznej, planów i historii projektów Claude Code
- rozszerzenia Claude Desktop i dane uwierzytelniające przechowywane przez system operacyjny

OpenClaw odmawia automatycznego wykonywania hooków, uznawania list dozwolonych uprawnień oraz dekodowania nieprzejrzystego stanu danych uwierzytelniających OAuth i Claude Desktop. Po przejrzeniu archiwum przenieś ręcznie potrzebne elementy.

## Wybór źródła

Bez opcji `--from` OpenClaw sprawdza domyślny katalog domowy Claude Code w `~/.claude`, przykładowy plik stanu Claude Code `~/.claude.json` oraz konfigurację MCP Claude Desktop w systemie macOS.

Gdy opcja `--from` wskazuje katalog główny projektu, OpenClaw importuje tylko pliki Claude tego projektu, takie jak `CLAUDE.md`, `.claude/settings.json`, `.claude/commands/`, `.claude/skills/` i `.mcp.json`. Podczas importowania z katalogu głównego projektu nie odczytuje globalnego katalogu domowego Claude.

## Zalecany przebieg

<Steps>
  <Step title="Wyświetl podgląd planu">
    ```bash
    openclaw migrate claude --dry-run
    ```

    Plan zawiera wszystko, co zostanie zmienione, w tym konflikty, pominięte elementy i wartości poufne utajnione w zagnieżdżonych polach MCP `env` lub `headers`.

  </Step>
  <Step title="Zastosuj z kopią zapasową">
    ```bash
    openclaw migrate apply claude --yes
    ```

    OpenClaw tworzy i weryfikuje kopię zapasową przed zastosowaniem zmian.

  </Step>
  <Step title="Uruchom diagnostykę">
    ```bash
    openclaw doctor
    ```

    [Diagnostyka](/pl/gateway/doctor) sprawdza po imporcie problemy z konfiguracją lub stanem.

  </Step>
  <Step title="Uruchom ponownie i zweryfikuj">
    ```bash
    openclaw gateway restart
    openclaw status
    ```

    Upewnij się, że Gateway działa prawidłowo, a zaimportowane instrukcje, serwery MCP i Skills zostały wczytane.

  </Step>
</Steps>

## Obsługa konfliktów

Zastosowanie zmian zostaje przerwane, gdy plan zgłasza konflikty (plik lub wartość konfiguracji już istnieje w miejscu docelowym).

<Warning>
Uruchom ponownie z opcją `--overwrite` tylko wtedy, gdy celowo chcesz zastąpić istniejący element docelowy. Dostawcy mogą nadal zapisywać kopie zapasowe poszczególnych zastępowanych plików w katalogu raportu migracji.
</Warning>

W świeżej instalacji OpenClaw konflikty występują rzadko. Zwykle pojawiają się po ponownym uruchomieniu importu w konfiguracji zawierającej już zmiany użytkownika.

## Dane wyjściowe JSON do automatyzacji

```bash
openclaw migrate claude --dry-run --json
openclaw migrate apply claude --json --yes
```

Opcja `--yes` jest wymagana dla polecenia `migrate apply` poza terminalem interaktywnym. Bez niej OpenClaw zgłasza błąd zamiast zastosować zmiany, dlatego skrypty i CI muszą jawnie przekazywać `--yes`. Najpierw wyświetl podgląd za pomocą `--dry-run --json`, a gdy plan będzie prawidłowy, zastosuj go za pomocą `--json --yes`.

## Rozwiązywanie problemów

<AccordionGroup>
  <Accordion title="Stan Claude znajduje się poza ~/.claude">
    Przekaż `--from /actual/path` (CLI) lub `--import-source /actual/path` (wdrażanie).
  </Accordion>
  <Accordion title="Wdrażanie odmawia importu do istniejącej konfiguracji">
    Import podczas wdrażania wymaga świeżej konfiguracji. Zresetuj stan i ponownie przeprowadź wdrażanie albo użyj bezpośrednio polecenia `openclaw migrate apply claude`, które obsługuje opcję `--overwrite` i jawną kontrolę kopii zapasowych.
  </Accordion>
  <Accordion title="Serwery MCP z Claude Desktop nie zostały zaimportowane">
    Claude Desktop odczytuje plik `claude_desktop_config.json` ze ścieżki właściwej dla danej platformy. Jeśli OpenClaw nie wykrył go automatycznie, ustaw opcję `--from` na katalog zawierający ten plik.
  </Accordion>
  <Accordion title="Polecenia Claude stały się Skills z wyłączonym wywoływaniem przez model">
    Jest to działanie zamierzone. Polecenia Claude są uruchamiane przez użytkownika, dlatego OpenClaw importuje je jako Skills z ustawieniem `disable-model-invocation: true`. Jeśli chcesz, aby agent wywoływał je automatycznie, zmodyfikuj metadane frontmatter każdego Skill.
  </Accordion>
</AccordionGroup>

## Powiązane materiały

- [`openclaw migrate`](/pl/cli/migrate): pełna dokumentacja CLI, kontrakt Pluginu i struktury JSON.
- [Przewodnik po migracji](/pl/install/migrating): wszystkie ścieżki migracji.
- [Migracja z Hermes](/pl/install/migrating-hermes): druga ścieżka importu między systemami.
- [Wdrażanie](/pl/cli/onboard): przebieg kreatora i flagi trybu nieinteraktywnego.
- [Diagnostyka](/pl/gateway/doctor): kontrola stanu po migracji.
- [Obszar roboczy agenta](/pl/concepts/agent-workspace): miejsce przechowywania plików `AGENTS.md`, `USER.md` i Skills.
