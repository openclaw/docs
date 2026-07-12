---
read_when:
    - Przechodzisz z Hermes i chcesz zachować konfigurację modelu, prompty, pamięć oraz Skills
    - Chcesz wiedzieć, co OpenClaw importuje automatycznie, a co pozostaje wyłącznie w archiwum
    - Potrzebujesz czystej, skryptowej ścieżki migracji (CI, nowy laptop, automatyzacja)
summary: Przejdź z Hermes na OpenClaw, korzystając z importu z podglądem i możliwością cofnięcia
title: Migracja z Hermes
x-i18n:
    generated_at: "2026-07-12T15:14:14Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: dd9012efb084c00dfe55bb841fea3cc6908c08b528492f1552bf226f125961e6
    source_path: install/migrating-hermes.md
    workflow: 16
---

Dostarczony provider migracji Hermes wykrywa stan w `~/.hermes`, wyświetla podgląd każdej zmiany przed jej zastosowaniem, redaguje sekrety w planach i raportach oraz tworzy zweryfikowaną kopię zapasową OpenClaw, zanim cokolwiek zmodyfikuje.

<Note>
Import wymaga świeżej konfiguracji OpenClaw. Jeśli masz już lokalny stan OpenClaw, najpierw zresetuj konfigurację, dane uwierzytelniające, sesje i obszar roboczy albo użyj bezpośrednio polecenia `openclaw migrate apply hermes` z opcją `--overwrite` po przejrzeniu planu.
</Note>

## Dwa sposoby importowania

<Tabs>
  <Tab title="Kreator wdrażania">
    Wykrywa Hermes w `~/.hermes` i wyświetla podgląd przed zastosowaniem zmian.

    ```bash
    openclaw onboard --flow import
    ```

    Możesz też wskazać konkretne źródło:

    ```bash
    openclaw onboard --import-from hermes --import-source ~/.hermes
    ```

  </Tab>
  <Tab title="CLI">
    Użyj `openclaw migrate` do uruchomień skryptowych lub powtarzalnych. Pełną dokumentację znajdziesz w sekcji [`openclaw migrate`](/pl/cli/migrate).

    ```bash
    openclaw migrate hermes --dry-run    # tylko podgląd
    openclaw migrate apply hermes --yes  # zastosowanie z pominięciem potwierdzenia
    ```

    Dodaj `--from <path>`, jeśli Hermes znajduje się poza `~/.hermes`.

  </Tab>
</Tabs>

## Co jest importowane

<AccordionGroup>
  <Accordion title="Konfiguracja modelu">
    - Domyślny wybór modelu z pliku Hermes `config.yaml`.
    - Skonfigurowani providerzy modeli i niestandardowe punkty końcowe zgodne z OpenAI z `providers` oraz `custom_providers`.

  </Accordion>
  <Accordion title="Serwery MCP">
    Definicje serwerów MCP z `mcp_servers` lub `mcp.servers`.
  </Accordion>
  <Accordion title="Pliki obszaru roboczego">
    - Pliki `SOUL.md` i `AGENTS.md` są kopiowane do obszaru roboczego agenta OpenClaw.
    - Pliki `memories/MEMORY.md` i `memories/USER.md` są **dołączane** do odpowiednich plików pamięci OpenClaw zamiast ich nadpisywania.

  </Accordion>
  <Accordion title="Konfiguracja pamięci">
    Domyślna konfiguracja pamięci plikowej OpenClaw. Zewnętrzni providerzy pamięci, tacy jak Honcho, są zapisywani jako elementy archiwalne lub wymagające ręcznego przeglądu, aby można było przenieść je świadomie.
  </Accordion>
  <Accordion title="Skills">
    Skills zawierające plik `SKILL.md` w katalogu `skills/<name>/` są kopiowane wraz z wartościami konfiguracji poszczególnych Skills z `skills.config`.
  </Accordion>
  <Accordion title="Dane uwierzytelniające">
    Interaktywne polecenie `openclaw migrate` pyta przed zaimportowaniem danych uwierzytelniających, przy czym domyślnie wybrana jest odpowiedź „tak”. Zaakceptowanie powoduje import wpisów OpenCode OpenAI OAuth i GitHub Copilot z pliku `auth.json` OpenCode oraz [obsługiwanych kluczy `.env` Hermes](/pl/cli/migrate#supported-env-keys). Wpisy OAuth z własnego pliku `auth.json` Hermes stanowią starszy stan: zamiast importowania ich do aktywnego uwierzytelniania są zgłaszane jako element wymagający ręcznego ponownego uwierzytelnienia lub użycia narzędzia doctor. Użyj `--include-secrets`, aby zaimportować dane uwierzytelniające podczas uruchomienia nieinteraktywnego, `--no-auth-credentials`, aby całkowicie pominąć ich import, albo flagi `--import-secrets` kreatora wdrażania.
  </Accordion>
</AccordionGroup>

## Co pozostaje wyłącznie w archiwum

Provider kopiuje poniższe elementy do katalogu raportu migracji w celu ręcznego przeglądu, ale **nie** wczytuje ich do aktywnej konfiguracji ani danych uwierzytelniających OpenClaw:

- `plugins/`
- `sessions/`
- `logs/`
- `cron/`
- `mcp-tokens/`
- `state.db`

OpenClaw odmawia automatycznego wykonywania lub uznawania tego stanu za zaufany, ponieważ formaty i założenia dotyczące zaufania mogą różnić się między systemami. Po przejrzeniu archiwum przenieś ręcznie potrzebne elementy.

## Zalecany przebieg

<Steps>
  <Step title="Wyświetl podgląd planu">
    ```bash
    openclaw migrate hermes --dry-run
    ```

    Plan zawiera wszystkie przyszłe zmiany, w tym konflikty, pominięte elementy i elementy poufne. Zagnieżdżone klucze przypominające sekrety są redagowane w danych wyjściowych.

  </Step>
  <Step title="Zastosuj z kopią zapasową">
    ```bash
    openclaw migrate apply hermes --yes
    ```

    Przed zastosowaniem zmian OpenClaw tworzy i weryfikuje kopię zapasową. Ten przykład nieinteraktywny importuje wyłącznie stan niezawierający sekretów. Uruchom polecenie bez `--yes`, aby interaktywnie odpowiedzieć na pytanie dotyczące danych uwierzytelniających, albo dodaj `--include-secrets`, aby uwzględnić obsługiwane dane uwierzytelniające podczas uruchomienia bez nadzoru.

  </Step>
  <Step title="Uruchom narzędzie doctor">
    ```bash
    openclaw doctor
    ```

    [Doctor](/pl/gateway/doctor) ponownie stosuje wszystkie oczekujące migracje konfiguracji i sprawdza problemy powstałe podczas importowania.

  </Step>
  <Step title="Uruchom ponownie i zweryfikuj">
    ```bash
    openclaw gateway restart
    openclaw status
    ```

    Sprawdź, czy Gateway działa prawidłowo oraz czy zaimportowany model, pamięć i Skills zostały wczytane.

  </Step>
</Steps>

## Obsługa konfliktów

Zastosowanie zmian nie będzie kontynuowane, jeśli plan zgłosi konflikty — plik lub wartość konfiguracji już istnieje w miejscu docelowym.

<Warning>
Uruchom ponownie z opcją `--overwrite` tylko wtedy, gdy zamierzasz zastąpić istniejący element docelowy. Providerzy mogą nadal tworzyć kopie zapasowe nadpisywanych plików na poziomie poszczególnych elementów w katalogu raportu migracji.
</Warning>

Konflikty występują rzadko w świeżej instalacji. Zwykle pojawiają się po ponownym uruchomieniu importu względem konfiguracji, która zawiera już zmiany użytkownika.

Jeśli konflikt wystąpi w trakcie stosowania zmian, na przykład z powodu nieoczekiwanego wyścigu dotyczącego pliku konfiguracyjnego, Hermes oznaczy pozostałe zależne elementy konfiguracji jako `skipped` z powodem `blocked by earlier apply conflict`, zamiast zapisywać je częściowo. Raport migracji rejestruje każdy zablokowany element, aby umożliwić rozwiązanie pierwotnego konfliktu i ponowne uruchomienie importu.

## Sekrety

Interaktywne polecenie `openclaw migrate` pyta, czy zaimportować wykryte dane uwierzytelniające, przy czym domyślnie wybrana jest odpowiedź „tak”.

- Zaakceptowanie powoduje import wpisów OpenCode OpenAI OAuth i GitHub Copilot z pliku `auth.json` OpenCode oraz [obsługiwanych kluczy `.env`](/pl/cli/migrate#supported-env-keys). Wpisy OAuth z własnego pliku `auth.json` Hermes są natomiast zgłaszane do ręcznego ponownego uwierzytelnienia OpenAI lub naprawy za pomocą narzędzia doctor.
- Użyj `--no-auth-credentials` lub odpowiedz „nie” na pytanie, aby zaimportować wyłącznie stan niezawierający sekretów.
- Użyj `--include-secrets`, aby zaimportować dane uwierzytelniające podczas uruchomienia `--yes` bez nadzoru.
- Użyj flagi `--import-secrets` kreatora wdrażania, aby zaimportować dane uwierzytelniające za pomocą kreatora.

## Dane wyjściowe JSON na potrzeby automatyzacji

```bash
openclaw migrate hermes --dry-run --json
openclaw migrate apply hermes --json --yes
```

W przypadku użycia `--json` bez `--yes` zastosowanie zmian wyświetla plan i nie modyfikuje stanu — jest to najbezpieczniejszy tryb dla CI i współdzielonych skryptów.

## Rozwiązywanie problemów

<AccordionGroup>
  <Accordion title="Zastosowanie zmian zostaje odrzucone z powodu konfliktów">
    Sprawdź dane wyjściowe planu. Każdy konflikt wskazuje ścieżkę źródłową i istniejący element docelowy. Dla każdego elementu zdecyduj, czy go pominąć, edytować element docelowy, czy ponownie uruchomić polecenie z opcją `--overwrite`.
  </Accordion>
  <Accordion title="Hermes znajduje się poza ~/.hermes">
    Przekaż `--from /actual/path` w CLI lub `--import-source /actual/path` podczas wdrażania.
  </Accordion>
  <Accordion title="Kreator wdrażania odmawia importu do istniejącej konfiguracji">
    Importowanie podczas wdrażania wymaga świeżej konfiguracji. Zresetuj stan i ponownie przeprowadź wdrażanie albo użyj bezpośrednio polecenia `openclaw migrate apply hermes`, które obsługuje `--overwrite` oraz jawne sterowanie kopiami zapasowymi.
  </Accordion>
  <Accordion title="Klucze API nie zostały zaimportowane">
    Interaktywne polecenie `openclaw migrate` importuje klucze API tylko po zaakceptowaniu pytania dotyczącego danych uwierzytelniających. Nieinteraktywne uruchomienia z `--yes` wymagają opcji `--include-secrets`, a importowanie podczas wdrażania wymaga `--import-secrets`. Rozpoznawane są wyłącznie [obsługiwane klucze `.env`](/pl/cli/migrate#supported-env-keys) — pozostałe zmienne `.env` są ignorowane.
  </Accordion>
</AccordionGroup>

## Powiązane materiały

- [`openclaw migrate`](/pl/cli/migrate): pełna dokumentacja CLI, kontrakt Pluginu i struktury JSON.
- [Wdrażanie](/pl/cli/onboard): przebieg kreatora i flagi trybu nieinteraktywnego.
- [Migracja](/pl/install/migrating): przenoszenie instalacji OpenClaw między komputerami.
- [Doctor](/pl/gateway/doctor): kontrola stanu po migracji.
- [Obszar roboczy agenta](/pl/concepts/agent-workspace): lokalizacja plików `SOUL.md`, `AGENTS.md` i plików pamięci.
