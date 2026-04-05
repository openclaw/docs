---
read_when:
    - Chcesz utworzyć pełnoprawne archiwum kopii zapasowej dla lokalnego stanu OpenClaw
    - Chcesz podejrzeć, które ścieżki zostałyby uwzględnione przed resetem lub odinstalowaniem
summary: Dokumentacja CLI dla `openclaw backup` (tworzenie lokalnych archiwów kopii zapasowych)
title: backup
x-i18n:
    generated_at: "2026-04-05T13:47:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: 700eda8f9eac1cc93a854fa579f128e5e97d4e6dfc0da75b437c0fb2a898a37d
    source_path: cli/backup.md
    workflow: 15
---

# `openclaw backup`

Utwórz lokalne archiwum kopii zapasowej dla stanu OpenClaw, konfiguracji, profili uwierzytelniania, poświadczeń kanałów/providerów, sesji i opcjonalnie workspace'ów.

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
- Domyślnym wyjściem jest archiwum `.tar.gz` z sygnaturą czasową w bieżącym katalogu roboczym.
- Jeśli bieżący katalog roboczy znajduje się wewnątrz drzewa źródłowego objętego kopią zapasową, OpenClaw używa katalogu domowego jako domyślnej lokalizacji archiwum.
- Istniejące pliki archiwów nigdy nie są nadpisywane.
- Ścieżki wyjściowe wewnątrz źródłowych drzew stanu/workspace są odrzucane, aby uniknąć samouwzględnienia.
- `openclaw backup verify <archive>` sprawdza, czy archiwum zawiera dokładnie jeden główny manifest, odrzuca ścieżki archiwum w stylu traversal i sprawdza, czy każdy payload zadeklarowany w manifeście istnieje w tarballu.
- `openclaw backup create --verify` uruchamia tę walidację natychmiast po zapisaniu archiwum.
- `openclaw backup create --only-config` tworzy kopię zapasową tylko aktywnego pliku konfiguracji JSON.

## Co jest objęte kopią zapasową

`openclaw backup create` planuje źródła kopii zapasowej na podstawie lokalnej instalacji OpenClaw:

- Katalog stanu zwracany przez lokalny resolver stanu OpenClaw, zwykle `~/.openclaw`
- Ścieżka aktywnego pliku konfiguracji
- Rozwiązany katalog `credentials/`, jeśli istnieje poza katalogiem stanu
- Katalogi workspace wykryte na podstawie bieżącej konfiguracji, chyba że przekażesz `--no-include-workspace`

Profile uwierzytelniania modeli są już częścią katalogu stanu w
`agents/<agentId>/agent/auth-profiles.json`, więc zwykle są objęte wpisem
kopii zapasowej stanu.

Jeśli użyjesz `--only-config`, OpenClaw pomija wykrywanie stanu, katalogu poświadczeń i workspace'ów oraz archiwizuje tylko ścieżkę aktywnego pliku konfiguracji.

OpenClaw kanonikalizuje ścieżki przed zbudowaniem archiwum. Jeśli konfiguracja,
katalog poświadczeń lub workspace znajdują się już wewnątrz katalogu stanu,
nie są duplikowane jako osobne źródła kopii zapasowej najwyższego poziomu. Brakujące ścieżki są
pomijane.

Payload archiwum przechowuje zawartość plików z tych drzew źródłowych, a osadzony `manifest.json` zapisuje rozwiązane bezwzględne ścieżki źródłowe oraz układ archiwum użyty dla każdego zasobu.

## Zachowanie przy nieprawidłowej konfiguracji

`openclaw backup` celowo omija standardowy preflight konfiguracji, aby nadal pomagać podczas odzyskiwania. Ponieważ wykrywanie workspace'ów zależy od prawidłowej konfiguracji, `openclaw backup create` teraz szybko kończy się błędem, gdy plik konfiguracji istnieje, ale jest nieprawidłowy, a kopia zapasowa workspace'ów nadal jest włączona.

Jeśli w takiej sytuacji nadal chcesz częściową kopię zapasową, uruchom ponownie:

```bash
openclaw backup create --no-include-workspace
```

To pozostawia w zakresie stan, konfigurację i zewnętrzny katalog poświadczeń, jednocześnie
całkowicie pomijając wykrywanie workspace'ów.

Jeśli potrzebujesz tylko kopii samego pliku konfiguracji, `--only-config` także działa, gdy konfiguracja jest błędna, ponieważ nie polega na parsowaniu konfiguracji do wykrywania workspace'ów.

## Rozmiar i wydajność

OpenClaw nie narzuca wbudowanego maksymalnego rozmiaru kopii zapasowej ani limitu rozmiaru pojedynczego pliku.

Praktyczne ograniczenia wynikają z lokalnej maszyny i docelowego systemu plików:

- Dostępne miejsce na tymczasowy zapis archiwum oraz końcowe archiwum
- Czas potrzebny na przejście przez duże drzewa workspace'ów i skompresowanie ich do `.tar.gz`
- Czas potrzebny na ponowne przeskanowanie archiwum, jeśli używasz `openclaw backup create --verify` lub uruchamiasz `openclaw backup verify`
- Zachowanie systemu plików w ścieżce docelowej. OpenClaw preferuje publikowanie przez krok hard-link bez nadpisywania i wraca do wyłącznej kopii, gdy hard linki nie są obsługiwane

Duże workspace'y są zwykle głównym czynnikiem wpływającym na rozmiar archiwum. Jeśli chcesz mniejszą lub szybszą kopię zapasową, użyj `--no-include-workspace`.

Aby uzyskać najmniejsze archiwum, użyj `--only-config`.
