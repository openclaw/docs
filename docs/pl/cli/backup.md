---
read_when:
    - Chcesz mieć pełnoprawne archiwum kopii zapasowych lokalnego stanu OpenClaw
    - Chcesz sprawdzić, które ścieżki zostałyby uwzględnione przed resetowaniem lub odinstalowaniem
summary: Dokumentacja referencyjna CLI dla `openclaw backup` (tworzenie lokalnych archiwów kopii zapasowych)
title: Kopia zapasowa
x-i18n:
    generated_at: "2026-06-27T17:19:24Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1ac7d8e4babd24f1c46ac48dca6c413e12361173df83cfe485dd3945ccd30c3e
    source_path: cli/backup.md
    workflow: 16
---

# `openclaw backup`

Utwórz lokalne archiwum kopii zapasowej stanu OpenClaw, konfiguracji, profili uwierzytelniania, danych uwierzytelniających kanałów/dostawców, sesji oraz opcjonalnie obszarów roboczych.

```bash
openclaw backup create
openclaw backup create --output ~/Backups
openclaw backup create --dry-run --json
openclaw backup create --verify
openclaw backup create --no-include-workspace
openclaw backup create --only-config
openclaw backup verify ./2026-03-09T08-00-00.000+08-00-openclaw-backup.tar.gz
```

## Uwagi

- Archiwum zawiera plik `manifest.json` z rozwiązanymi ścieżkami źródłowymi i układem archiwum.
- Domyślnym wyjściem jest archiwum `.tar.gz` ze znacznikiem czasu w bieżącym katalogu roboczym.
- Nazwy plików kopii zapasowych ze znacznikiem czasu używają lokalnej strefy czasowej Twojej maszyny i zawierają przesunięcie UTC.
- Jeśli bieżący katalog roboczy znajduje się wewnątrz drzewa źródłowego objętego kopią zapasową, OpenClaw użyje Twojego katalogu domowego jako domyślnej lokalizacji archiwum.
- Istniejące pliki archiwów nigdy nie są nadpisywane.
- Ścieżki wyjściowe wewnątrz drzew stanu/obszaru roboczego źródła są odrzucane, aby uniknąć samowłączenia.
- `openclaw backup verify <archive>` sprawdza, czy archiwum zawiera dokładnie jeden manifest główny, odrzuca ścieżki archiwum w stylu przechodzenia po katalogach i sprawdza, czy każdy zadeklarowany w manifeście ładunek istnieje w pliku tarball.
- `openclaw backup create --verify` uruchamia tę walidację natychmiast po zapisaniu archiwum.
- `openclaw backup create --only-config` tworzy kopię zapasową tylko aktywnego pliku konfiguracji JSON.

## Co jest obejmowane kopią zapasową

`openclaw backup create` planuje źródła kopii zapasowej z lokalnej instalacji OpenClaw:

- Katalog stanu zwrócony przez lokalny resolver stanu OpenClaw, zwykle `~/.openclaw`
- Ścieżka aktywnego pliku konfiguracji
- Rozwiązany katalog `credentials/`, gdy istnieje poza katalogiem stanu
- Katalogi obszarów roboczych wykryte z bieżącej konfiguracji, chyba że przekażesz `--no-include-workspace`

Profile uwierzytelniania modeli są już częścią katalogu stanu pod
`agents/<agentId>/agent/auth-profiles.json`, więc zwykle obejmuje je wpis
kopii zapasowej stanu.

Jeśli użyjesz `--only-config`, OpenClaw pomija wykrywanie stanu, katalogu danych uwierzytelniających i obszarów roboczych oraz archiwizuje tylko ścieżkę aktywnego pliku konfiguracji.

OpenClaw kanonikalizuje ścieżki przed zbudowaniem archiwum. Jeśli konfiguracja,
katalog danych uwierzytelniających lub obszar roboczy znajdują się już w katalogu stanu,
nie są duplikowane jako osobne źródła kopii zapasowej najwyższego poziomu. Brakujące ścieżki są
pomijane.

Ładunek archiwum przechowuje zawartość plików z tych drzew źródłowych, a osadzony `manifest.json` rejestruje rozwiązane bezwzględne ścieżki źródłowe oraz układ archiwum użyty dla każdego zasobu.

Podczas tworzenia archiwum OpenClaw pomija znane pliki aktywnych mutacji, które nie mają wartości przy przywracaniu, w tym aktywne transkrypcje sesji agentów, dzienniki uruchomień Cron, dzienniki kroczące, kolejki dostarczania, pliki socket/pid/temp w katalogu stanu oraz powiązane pliki tymczasowe trwałej kolejki. Wynik JSON zawiera `skippedVolatileCount`, aby automatyzacja mogła zobaczyć, ile plików celowo pominięto.

Zainstalowane pliki źródłowe i manifesty Plugin pod drzewem
`extensions/` katalogu stanu są uwzględniane, ale ich zagnieżdżone drzewa zależności
`node_modules/` są pomijane. Te zależności są odtwarzalnymi artefaktami instalacji; po
przywróceniu archiwum użyj `openclaw plugins update <id>` albo ponownie zainstaluj Plugin
za pomocą `openclaw plugins install <spec> --force`, gdy przywrócony Plugin zgłasza
brakujące zależności.

## Zachowanie przy nieprawidłowej konfiguracji

`openclaw backup` celowo omija zwykły preflight konfiguracji, aby nadal pomagać podczas odzyskiwania. Ponieważ wykrywanie obszarów roboczych zależy od prawidłowej konfiguracji, `openclaw backup create` kończy się teraz szybko błędem, gdy plik konfiguracji istnieje, ale jest nieprawidłowy, a kopia zapasowa obszaru roboczego jest nadal włączona.

Jeśli w takiej sytuacji nadal chcesz częściową kopię zapasową, uruchom ponownie:

```bash
openclaw backup create --no-include-workspace
```

To pozostawia stan, konfigurację i zewnętrzny katalog danych uwierzytelniających w zakresie,
jednocześnie całkowicie pomijając wykrywanie obszarów roboczych.

Jeśli potrzebujesz tylko kopii samego pliku konfiguracji, `--only-config` działa także wtedy, gdy konfiguracja jest zniekształcona, ponieważ nie polega na parsowaniu konfiguracji w celu wykrywania obszarów roboczych.

## Rozmiar i wydajność

OpenClaw nie wymusza wbudowanego maksymalnego rozmiaru kopii zapasowej ani limitu rozmiaru pojedynczego pliku.

Praktyczne limity wynikają z lokalnej maszyny i docelowego systemu plików:

- Dostępne miejsce na tymczasowy zapis archiwum oraz końcowe archiwum
- Czas potrzebny na przejście dużych drzew obszarów roboczych i skompresowanie ich do `.tar.gz`
- Czas potrzebny na ponowne przeskanowanie archiwum, jeśli użyjesz `openclaw backup create --verify` albo uruchomisz `openclaw backup verify`
- Zachowanie systemu plików w ścieżce docelowej. OpenClaw preferuje krok publikacji bez nadpisywania za pomocą twardego dowiązania i przechodzi na wyłączną kopię, gdy twarde dowiązania nie są obsługiwane

Duże obszary robocze są zwykle głównym czynnikiem wpływającym na rozmiar archiwum. Jeśli chcesz mniejszą lub szybszą kopię zapasową, użyj `--no-include-workspace`.

Aby uzyskać najmniejsze archiwum, użyj `--only-config`.

## Powiązane

- [Dokumentacja CLI](/pl/cli)
