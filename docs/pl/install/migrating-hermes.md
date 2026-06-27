---
read_when:
    - Przechodzisz z Hermes i chcesz zachować konfigurację modelu, prompty, pamięć oraz Skills
    - Chcesz wiedzieć, co OpenClaw importuje automatycznie, a co pozostaje tylko w archiwum
    - Potrzebujesz czystej, oskryptowanej ścieżki migracji (CI, świeży laptop, automatyzacja)
summary: Przejdź z Hermes do OpenClaw z importem z podglądem i możliwością cofnięcia
title: Migracja z Hermes
x-i18n:
    generated_at: "2026-06-27T17:43:27Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4f2a2bfea4fd276e3392261e8ecea09d147424636efb200ced1deb86ac0161b5
    source_path: install/migrating-hermes.md
    workflow: 16
---

OpenClaw importuje stan Hermes przez dołączonego dostawcę migracji. Dostawca pokazuje podgląd wszystkiego przed zmianą stanu, redaguje sekrety w planach i raportach oraz tworzy zweryfikowaną kopię zapasową przed zastosowaniem.

<Note>
Importy wymagają świeżej konfiguracji OpenClaw. Jeśli masz już lokalny stan OpenClaw, najpierw zresetuj konfigurację, dane uwierzytelniające, sesje i obszar roboczy albo użyj bezpośrednio `openclaw migrate` z `--overwrite` po przejrzeniu planu.
</Note>

## Dwa sposoby importu

<Tabs>
  <Tab title="Kreator wdrażania">
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
    Użyj `openclaw migrate` do uruchomień skryptowych lub powtarzalnych. Pełny opis znajdziesz w [`openclaw migrate`](/pl/cli/migrate).

    ```bash
    openclaw migrate hermes --dry-run    # tylko podgląd
    openclaw migrate apply hermes --yes  # zastosuj z pominięciem potwierdzenia
    ```

    Dodaj `--from <path>`, gdy Hermes znajduje się poza `~/.hermes`.

  </Tab>
</Tabs>

## Co jest importowane

<AccordionGroup>
  <Accordion title="Konfiguracja modelu">
    - Domyślny wybór modelu z Hermes `config.yaml`.
    - Skonfigurowani dostawcy modeli i niestandardowe punkty końcowe zgodne z OpenAI z `providers` i `custom_providers`.

  </Accordion>
  <Accordion title="Serwery MCP">
    Definicje serwerów MCP z `mcp_servers` lub `mcp.servers`.
  </Accordion>
  <Accordion title="Pliki obszaru roboczego">
    - `SOUL.md` i `AGENTS.md` są kopiowane do obszaru roboczego agenta OpenClaw.
    - `memories/MEMORY.md` i `memories/USER.md` są **dołączane** do odpowiadających im plików pamięci OpenClaw zamiast je nadpisywać.

  </Accordion>
  <Accordion title="Konfiguracja pamięci">
    Domyślne ustawienia konfiguracji pamięci dla pamięci plikowej OpenClaw. Zewnętrzni dostawcy pamięci, tacy jak Honcho, są zapisywani jako elementy archiwalne lub wymagające ręcznego przeglądu, aby można było przenieść je świadomie.
  </Accordion>
  <Accordion title="Skills">
    Skills z plikiem `SKILL.md` w `skills/<name>/` są kopiowane razem z wartościami konfiguracji dla poszczególnych Skills z `skills.config`.
  </Accordion>
  <Accordion title="Dane uwierzytelniające">
    Interaktywne `openclaw migrate` pyta przed zaimportowaniem danych uwierzytelniających, z domyślnie wybraną odpowiedzią tak. Akceptowane importy obejmują dane uwierzytelniające OpenCode OpenAI OAuth z OpenCode `auth.json`, wpisy OpenCode i GitHub Copilot z OpenCode `auth.json` oraz [obsługiwane klucze `.env`](/pl/cli/migrate#supported-env-keys). Wpisy OAuth Hermes `auth.json` są stanem starszego typu i są pokazywane jako ręczne ponowne uwierzytelnienie lub praca dla doctor zamiast importowania ich do aktywnego uwierzytelniania. Użyj `--include-secrets` przy nieinteraktywnym imporcie danych uwierzytelniających przez `openclaw migrate`, `--no-auth-credentials`, aby go pominąć, albo onboarding `--import-secrets` podczas importowania z kreatora wdrażania.
  </Accordion>
</AccordionGroup>

## Co pozostaje tylko w archiwum

Dostawca kopiuje te elementy do katalogu raportu migracji do ręcznego przeglądu, ale **nie** ładuje ich do aktywnej konfiguracji ani danych uwierzytelniających OpenClaw:

- `plugins/`
- `sessions/`
- `logs/`
- `cron/`
- `mcp-tokens/`
- `state.db`

OpenClaw odmawia automatycznego wykonywania lub zaufania temu stanowi, ponieważ formaty i założenia zaufania mogą różnić się między systemami. Przenieś potrzebne elementy ręcznie po przejrzeniu archiwum.

## Zalecany przepływ

<Steps>
  <Step title="Podejrzyj plan">
    ```bash
    openclaw migrate hermes --dry-run
    ```

    Plan wymienia wszystko, co zostanie zmienione, w tym konflikty, pominięte elementy i wszelkie elementy wrażliwe. Dane wyjściowe planu redagują zagnieżdżone klucze wyglądające na sekrety.

  </Step>
  <Step title="Zastosuj z kopią zapasową">
    ```bash
    openclaw migrate apply hermes --yes
    ```

    OpenClaw tworzy i weryfikuje kopię zapasową przed zastosowaniem. Ten nieinteraktywny przykład importuje stan bez sekretów. Uruchom bez `--yes`, aby odpowiedzieć na monit o dane uwierzytelniające, albo dodaj `--include-secrets`, aby uwzględnić obsługiwane dane uwierzytelniające w uruchomieniach bez nadzoru.

  </Step>
  <Step title="Uruchom doctor">
    ```bash
    openclaw doctor
    ```

    [Doctor](/pl/gateway/doctor) ponownie stosuje oczekujące migracje konfiguracji i sprawdza problemy wprowadzone podczas importu.

  </Step>
  <Step title="Uruchom ponownie i zweryfikuj">
    ```bash
    openclaw gateway restart
    openclaw status
    ```

    Potwierdź, że Gateway jest sprawny, a zaimportowany model, pamięć i Skills są załadowane.

  </Step>
</Steps>

## Obsługa konfliktów

Zastosowanie odmawia kontynuacji, gdy plan zgłasza konflikty (plik lub wartość konfiguracji już istnieje w miejscu docelowym).

<Warning>
Uruchom ponownie z `--overwrite` tylko wtedy, gdy zastąpienie istniejącego celu jest zamierzone. Dostawcy nadal mogą zapisywać kopie zapasowe na poziomie elementów dla nadpisanych plików w katalogu raportu migracji.
</Warning>

W przypadku świeżej instalacji OpenClaw konflikty są nietypowe. Zwykle pojawiają się, gdy ponownie uruchamiasz import w konfiguracji, która ma już edycje użytkownika.

Jeśli konflikt pojawi się w trakcie stosowania (na przykład nieoczekiwany wyścig na pliku konfiguracji), Hermes oznaczy pozostałe zależne elementy konfiguracji jako `skipped` z powodem `blocked by earlier apply conflict` zamiast zapisywać je częściowo. Raport migracji zapisuje każdy zablokowany element, aby można było rozwiązać pierwotny konflikt i ponownie uruchomić import.

## Sekrety

Interaktywne `openclaw migrate` pyta, czy zaimportować wykryte dane uwierzytelniające, z domyślnie wybraną odpowiedzią tak.

- Akceptacja monitu importuje dane uwierzytelniające OpenCode OpenAI OAuth z OpenCode `auth.json`, wpisy OpenCode i GitHub Copilot z OpenCode `auth.json` oraz [obsługiwane klucze `.env`](/pl/cli/migrate#supported-env-keys). Wpisy OAuth Hermes `auth.json` są zgłaszane do ręcznego ponownego uwierzytelnienia OpenAI lub naprawy przez doctor.
- Użyj `--no-auth-credentials` albo wybierz nie w monicie, aby zaimportować tylko stan bez sekretów.
- Użyj `--include-secrets` podczas uruchamiania bez nadzoru z `--yes`.
- Użyj onboarding `--import-secrets` podczas importowania danych uwierzytelniających z kreatora wdrażania.
- W przypadku danych uwierzytelniających zarządzanych przez SecretRef skonfiguruj źródło SecretRef po zakończeniu importu.

## Dane wyjściowe JSON do automatyzacji

```bash
openclaw migrate hermes --dry-run --json
openclaw migrate apply hermes --json --yes
```

Z `--json` i bez `--yes` zastosowanie wypisuje plan i nie modyfikuje stanu. To najbezpieczniejszy tryb dla CI i współdzielonych skryptów.

## Rozwiązywanie problemów

<AccordionGroup>
  <Accordion title="Zastosowanie odmawia z powodu konfliktów">
    Sprawdź dane wyjściowe planu. Każdy konflikt identyfikuje ścieżkę źródłową i istniejący cel. Dla każdego elementu zdecyduj, czy go pominąć, edytować cel, czy uruchomić ponownie z `--overwrite`.
  </Accordion>
  <Accordion title="Hermes znajduje się poza ~/.hermes">
    Przekaż `--from /actual/path` (CLI) albo `--import-source /actual/path` (onboarding).
  </Accordion>
  <Accordion title="Onboarding odmawia importu w istniejącej konfiguracji">
    Importy przez onboarding wymagają świeżej konfiguracji. Zresetuj stan i ponownie przejdź onboarding albo użyj bezpośrednio `openclaw migrate apply hermes`, które obsługuje `--overwrite` i jawne sterowanie kopią zapasową.
  </Accordion>
  <Accordion title="Klucze API nie zostały zaimportowane">
    Interaktywne `openclaw migrate` importuje klucze API tylko wtedy, gdy zaakceptujesz monit o dane uwierzytelniające. Nieinteraktywne uruchomienia `--yes` wymagają `--include-secrets`; importy przez onboarding wymagają `--import-secrets`. Rozpoznawane są tylko [obsługiwane klucze `.env`](/pl/cli/migrate#supported-env-keys); inne zmienne w `.env` są ignorowane.
  </Accordion>
</AccordionGroup>

## Powiązane

- [`openclaw migrate`](/pl/cli/migrate): pełny opis CLI, kontrakt Plugin i kształty JSON.
- [Onboarding](/pl/cli/onboard): przepływ kreatora i flagi nieinteraktywne.
- [Migracja](/pl/install/migrating): przenieś instalację OpenClaw między maszynami.
- [Doctor](/pl/gateway/doctor): kontrola kondycji po migracji.
- [Obszar roboczy agenta](/pl/concepts/agent-workspace): miejsce, w którym znajdują się `SOUL.md`, `AGENTS.md` i pliki pamięci.
