---
read_when:
    - Chcesz mieć pełnoprawne archiwum kopii zapasowej lokalnego stanu OpenClaw
    - Chcesz zobaczyć podgląd, które ścieżki zostaną uwzględnione przed resetem lub odinstalowaniem
summary: Dokumentacja CLI dla `openclaw backup` (tworzenie lokalnych archiwów kopii zapasowych)
title: Kopia zapasowa
x-i18n:
    generated_at: "2026-04-24T09:01:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: 88d83cf04c163d76658575aa6d90be1dd7379934fa2822a07e13311c4324f8fd
    source_path: cli/backup.md
    workflow: 15
---

# `openclaw backup`

Utwórz lokalne archiwum kopii zapasowej stanu OpenClaw, konfiguracji, profili uwierzytelniania, poświadczeń kanałów/providerów, sesji oraz opcjonalnie obszarów roboczych.

```bash
openclaw backup create
openclaw backup create --output ~/Backups
openclaw backup create --dry-run --json
openclaw backup create --verify
openclaw backup create --no-include-workspace
openclaw backup create --only-config
openclaw backup verify ./2026-03-09T00-00-00.000Z-openclaw-backup.tar.gz
```

## Uwagi

- Archiwum zawiera plik `manifest.json` z rozwiązanymi ścieżkami źródłowymi i układem archiwum.
- Domyślnym wynikiem jest archiwum `.tar.gz` ze znacznikiem czasu w bieżącym katalogu roboczym.
- Jeśli bieżący katalog roboczy znajduje się wewnątrz drzewa źródłowego objętego kopią zapasową, OpenClaw używa katalogu domowego jako domyślnej lokalizacji archiwum.
- Istniejące pliki archiwum nigdy nie są nadpisywane.
- Ścieżki wyjściowe wewnątrz źródłowych drzew stanu/obszaru roboczego są odrzucane, aby uniknąć dołączania archiwum do samego siebie.
- `openclaw backup verify <archive>` sprawdza, czy archiwum zawiera dokładnie jeden główny manifest, odrzuca ścieżki archiwum w stylu traversal i sprawdza, czy każdy ładunek zadeklarowany w manifeście istnieje w tarballu.
- `openclaw backup create --verify` uruchamia tę walidację natychmiast po zapisaniu archiwum.
- `openclaw backup create --only-config` tworzy kopię zapasową tylko aktywnego pliku konfiguracyjnego JSON.

## Co jest objęte kopią zapasową

`openclaw backup create` planuje źródła kopii zapasowej na podstawie lokalnej instalacji OpenClaw:

- Katalog stanu zwracany przez lokalny resolver stanu OpenClaw, zwykle `~/.openclaw`
- Ścieżka aktywnego pliku konfiguracyjnego
- Rozwiązany katalog `credentials/`, gdy istnieje poza katalogiem stanu
- Katalogi obszaru roboczego wykryte z bieżącej konfiguracji, chyba że przekażesz `--no-include-workspace`

Profile uwierzytelniania modeli są już częścią katalogu stanu w
`agents/<agentId>/agent/auth-profiles.json`, więc zwykle są objęte wpisem kopii
zapasowej stanu.

Jeśli użyjesz `--only-config`, OpenClaw pomija wykrywanie stanu, katalogu poświadczeń i obszarów roboczych, a do archiwum trafia tylko ścieżka aktywnego pliku konfiguracyjnego.

OpenClaw kanonizuje ścieżki przed zbudowaniem archiwum. Jeśli konfiguracja,
katalog poświadczeń lub obszar roboczy już znajdują się wewnątrz katalogu stanu,
nie są duplikowane jako oddzielne źródła kopii zapasowej najwyższego poziomu. Brakujące ścieżki są
pomijane.

Ładunek archiwum przechowuje zawartość plików z tych drzew źródłowych, a osadzony `manifest.json` zapisuje rozwiązane bezwzględne ścieżki źródłowe oraz układ archiwum użyty dla każdego zasobu.

## Zachowanie przy nieprawidłowej konfiguracji

`openclaw backup` celowo pomija zwykły preflight konfiguracji, aby nadal mógł pomóc podczas odzyskiwania. Ponieważ wykrywanie obszarów roboczych zależy od prawidłowej konfiguracji, `openclaw backup create` teraz natychmiast kończy się błędem, gdy plik konfiguracji istnieje, ale jest nieprawidłowy, a kopia zapasowa obszaru roboczego nadal jest włączona.

Jeśli w takiej sytuacji nadal chcesz częściową kopię zapasową, uruchom ponownie:

```bash
openclaw backup create --no-include-workspace
```

To pozostawia w zakresie stan, konfigurację i zewnętrzny katalog poświadczeń, jednocześnie
całkowicie pomijając wykrywanie obszarów roboczych.

Jeśli potrzebujesz tylko kopii samego pliku konfiguracyjnego, `--only-config` również działa, gdy konfiguracja jest nieprawidłowa, ponieważ nie polega na parsowaniu konfiguracji na potrzeby wykrywania obszarów roboczych.

## Rozmiar i wydajność

OpenClaw nie narzuca wbudowanego maksymalnego rozmiaru kopii zapasowej ani limitu rozmiaru pojedynczego pliku.

Praktyczne ograniczenia wynikają z lokalnej maszyny i docelowego systemu plików:

- Dostępne miejsce na tymczasowy zapis archiwum oraz końcowe archiwum
- Czas potrzebny na przejście dużych drzew obszarów roboczych i skompresowanie ich do `.tar.gz`
- Czas potrzebny na ponowne przeskanowanie archiwum, jeśli użyjesz `openclaw backup create --verify` lub uruchomisz `openclaw backup verify`
- Zachowanie systemu plików w ścieżce docelowej. OpenClaw preferuje krok publikacji przez hard link bez nadpisywania i wraca do wyłącznej kopii, gdy hard linki nie są obsługiwane

Duże obszary robocze są zwykle głównym czynnikiem wpływającym na rozmiar archiwum. Jeśli chcesz mniejszą lub szybszą kopię zapasową, użyj `--no-include-workspace`.

Aby uzyskać najmniejsze archiwum, użyj `--only-config`.

## Powiązane

- [CLI reference](/pl/cli)
