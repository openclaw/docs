---
read_when:
    - Przechodzisz z Hermes i chcesz zachować konfigurację modelu, prompty, pamięć oraz Skills
    - Chcesz dowiedzieć się, co OpenClaw importuje automatycznie, a co pozostaje wyłącznie w archiwum
    - Potrzebujesz uporządkowanej, opartej na skryptach ścieżki migracji (CI, świeży laptop, automatyzacja)
summary: Przejdź z Hermes do OpenClaw, korzystając z importu z podglądem i możliwością cofnięcia
title: Migracja z Hermes
x-i18n:
    generated_at: "2026-04-30T10:02:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: 01f8a71e524b31c85864be63e54fc8a2057ecb06a73aac9e6fb107fc0c49757d
    source_path: install/migrating-hermes.md
    workflow: 16
---

OpenClaw importuje stan Hermes przez dołączonego dostawcę migracji. Dostawca wyświetla podgląd wszystkiego przed zmianą stanu, redaguje sekrety w planach i raportach oraz tworzy zweryfikowaną kopię zapasową przed zastosowaniem.

<Note>
Importy wymagają świeżej konfiguracji OpenClaw. Jeśli masz już lokalny stan OpenClaw, najpierw zresetuj konfigurację, poświadczenia, sesje i obszar roboczy albo użyj bezpośrednio `openclaw migrate` z `--overwrite` po sprawdzeniu planu.
</Note>

## Dwa sposoby importu

<Tabs>
  <Tab title="Kreator wdrożenia">
    Najszybsza ścieżka. Kreator wykrywa Hermes w `~/.hermes` i pokazuje podgląd przed zastosowaniem.

    ```bash
    openclaw onboard --flow import
    ```

    Albo wskaż konkretne źródło:

    ```bash
    openclaw onboard --import-from hermes --import-source ~/.hermes
    ```

  </Tab>
  <Tab title="CLI">
    Użyj `openclaw migrate` do uruchomień skryptowych lub powtarzalnych. Pełną dokumentację znajdziesz w [`openclaw migrate`](/pl/cli/migrate).

    ```bash
    openclaw migrate hermes --dry-run    # preview only
    openclaw migrate apply hermes --yes  # apply with confirmation skipped
    ```

    Dodaj `--from <path>`, gdy Hermes znajduje się poza `~/.hermes`.

  </Tab>
</Tabs>

## Co jest importowane

<AccordionGroup>
  <Accordion title="Konfiguracja modelu">
    - Domyślny wybór modelu z Hermes `config.yaml`.
    - Skonfigurowani dostawcy modeli oraz niestandardowe punkty końcowe zgodne z OpenAI z `providers` i `custom_providers`.

  </Accordion>
  <Accordion title="Serwery MCP">
    Definicje serwerów MCP z `mcp_servers` lub `mcp.servers`.
  </Accordion>
  <Accordion title="Pliki obszaru roboczego">
    - `SOUL.md` i `AGENTS.md` są kopiowane do obszaru roboczego agenta OpenClaw.
    - `memories/MEMORY.md` i `memories/USER.md` są **dopisywane** do odpowiadających im plików pamięci OpenClaw zamiast je nadpisywać.

  </Accordion>
  <Accordion title="Konfiguracja pamięci">
    Domyślne ustawienia konfiguracji pamięci dla pamięci plikowej OpenClaw. Zewnętrzni dostawcy pamięci, tacy jak Honcho, są zapisywani jako elementy archiwalne lub do ręcznego przeglądu, aby można było przenieść je świadomie.
  </Accordion>
  <Accordion title="Skills">
    Skills z plikiem `SKILL.md` w `skills/<name>/` są kopiowane wraz z wartościami konfiguracji poszczególnych Skills z `skills.config`.
  </Accordion>
  <Accordion title="Klucze API (opcjonalnie)">
    Ustaw `--include-secrets`, aby zaimportować obsługiwane klucze `.env`: `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `OPENROUTER_API_KEY`, `GOOGLE_API_KEY`, `GEMINI_API_KEY`, `GROQ_API_KEY`, `XAI_API_KEY`, `MISTRAL_API_KEY`, `DEEPSEEK_API_KEY`. Bez tej flagi sekrety nigdy nie są kopiowane.
  </Accordion>
</AccordionGroup>

## Co pozostaje tylko w archiwum

Dostawca kopiuje te elementy do katalogu raportu migracji do ręcznego przeglądu, ale **nie** ładuje ich do aktywnej konfiguracji ani poświadczeń OpenClaw:

- `plugins/`
- `sessions/`
- `logs/`
- `cron/`
- `mcp-tokens/`
- `auth.json`
- `state.db`

OpenClaw odmawia automatycznego wykonywania lub uznania tego stanu za zaufany, ponieważ formaty i założenia zaufania mogą różnić się między systemami. Po sprawdzeniu archiwum przenieś ręcznie to, czego potrzebujesz.

## Zalecany przepływ

<Steps>
  <Step title="Wyświetl podgląd planu">
    ```bash
    openclaw migrate hermes --dry-run
    ```

    Plan zawiera wszystko, co zostanie zmienione, w tym konflikty, pominięte elementy i wszelkie elementy wrażliwe. Dane wyjściowe planu redagują zagnieżdżone klucze wyglądające jak sekrety.

  </Step>
  <Step title="Zastosuj z kopią zapasową">
    ```bash
    openclaw migrate apply hermes --yes
    ```

    OpenClaw tworzy i weryfikuje kopię zapasową przed zastosowaniem. Jeśli potrzebujesz zaimportować klucze API, dodaj `--include-secrets`.

  </Step>
  <Step title="Uruchom doctor">
    ```bash
    openclaw doctor
    ```

    [Doctor](/pl/gateway/doctor) ponownie stosuje wszystkie oczekujące migracje konfiguracji i sprawdza problemy wprowadzone podczas importu.

  </Step>
  <Step title="Uruchom ponownie i zweryfikuj">
    ```bash
    openclaw gateway restart
    openclaw status
    ```

    Potwierdź, że Gateway działa poprawnie, a zaimportowany model, pamięć i Skills są załadowane.

  </Step>
</Steps>

## Obsługa konfliktów

Zastosowanie odmawia kontynuowania, gdy plan zgłasza konflikty (plik lub wartość konfiguracji już istnieje w miejscu docelowym).

<Warning>
Uruchom ponownie z `--overwrite` tylko wtedy, gdy zastąpienie istniejącego miejsca docelowego jest zamierzone. Dostawcy nadal mogą zapisywać kopie zapasowe na poziomie elementów dla nadpisanych plików w katalogu raportu migracji.
</Warning>

W świeżej instalacji OpenClaw konflikty są nietypowe. Zazwyczaj pojawiają się po ponownym uruchomieniu importu w konfiguracji, która ma już zmiany użytkownika.

Jeśli konflikt pojawi się w trakcie zastosowania (na przykład nieoczekiwany wyścig na pliku konfiguracji), Hermes oznacza pozostałe zależne elementy konfiguracji jako `skipped` z powodem `blocked by earlier apply conflict` zamiast zapisywać je częściowo. Raport migracji zapisuje każdy zablokowany element, aby można było rozwiązać pierwotny konflikt i ponownie uruchomić import.

## Sekrety

Sekrety nigdy nie są importowane domyślnie.

- Najpierw uruchom `openclaw migrate apply hermes --yes`, aby zaimportować stan bez sekretów.
- Jeśli chcesz też skopiować obsługiwane klucze `.env`, uruchom ponownie z `--include-secrets`.
- W przypadku poświadczeń zarządzanych przez SecretRef skonfiguruj źródło SecretRef po zakończeniu importu.

## Dane wyjściowe JSON do automatyzacji

```bash
openclaw migrate hermes --dry-run --json
openclaw migrate apply hermes --json --yes
```

Z `--json` i bez `--yes` zastosowanie wypisuje plan i nie modyfikuje stanu. To najbezpieczniejszy tryb dla CI i współdzielonych skryptów.

## Rozwiązywanie problemów

<AccordionGroup>
  <Accordion title="Zastosowanie odmawia z powodu konfliktów">
    Sprawdź dane wyjściowe planu. Każdy konflikt wskazuje ścieżkę źródłową i istniejące miejsce docelowe. Zdecyduj dla każdego elementu, czy go pominąć, edytować miejsce docelowe, czy uruchomić ponownie z `--overwrite`.
  </Accordion>
  <Accordion title="Hermes znajduje się poza ~/.hermes">
    Przekaż `--from /actual/path` (CLI) albo `--import-source /actual/path` (wdrożenie).
  </Accordion>
  <Accordion title="Wdrożenie odmawia importu w istniejącej konfiguracji">
    Importy wdrożeniowe wymagają świeżej konfiguracji. Zresetuj stan i uruchom wdrożenie ponownie albo użyj bezpośrednio `openclaw migrate apply hermes`, które obsługuje `--overwrite` i jawną kontrolę kopii zapasowej.
  </Accordion>
  <Accordion title="Klucze API nie zostały zaimportowane">
    Wymagane jest `--include-secrets`, a rozpoznawane są tylko klucze wymienione powyżej. Inne zmienne w `.env` są ignorowane.
  </Accordion>
</AccordionGroup>

## Powiązane

- [`openclaw migrate`](/pl/cli/migrate): pełna dokumentacja CLI, kontrakt Plugin i kształty JSON.
- [Wdrożenie](/pl/cli/onboard): przepływ kreatora i flagi nieinteraktywne.
- [Migracja](/pl/install/migrating): przenoszenie instalacji OpenClaw między maszynami.
- [Doctor](/pl/gateway/doctor): kontrola kondycji po migracji.
- [Obszar roboczy agenta](/pl/concepts/agent-workspace): miejsce, w którym znajdują się `SOUL.md`, `AGENTS.md` i pliki pamięci.
