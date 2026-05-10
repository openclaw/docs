---
read_when:
    - Potrzebujesz pełnoprawnego archiwum kopii zapasowej lokalnego stanu OpenClaw
    - Chcesz podejrzeć, które ścieżki zostałyby uwzględnione przed zresetowaniem lub odinstalowaniem
summary: Dokumentacja referencyjna CLI dla `openclaw backup` (tworzenie lokalnych archiwów kopii zapasowych)
title: Kopia zapasowa
x-i18n:
    generated_at: "2026-05-10T19:27:52Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2c95cf475a563ad4f0a2dbaeda504b265580545c9d3f6f71d2f4d2a183e76a5c
    source_path: cli/backup.md
    workflow: 16
---

# `openclaw backup`

Utwórz lokalne archiwum kopii zapasowej dla stanu OpenClaw, konfiguracji, profili uwierzytelniania, danych uwierzytelniających kanałów/dostawców, sesji oraz opcjonalnie obszarów roboczych.

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

- Archiwum zawiera plik `manifest.json` z rozpoznanymi ścieżkami źródłowymi i układem archiwum.
- Domyślnym wyjściem jest archiwum `.tar.gz` ze znacznikiem czasu w bieżącym katalogu roboczym.
- Jeśli bieżący katalog roboczy znajduje się wewnątrz drzewa źródłowego objętego kopią zapasową, OpenClaw używa katalogu domowego jako domyślnej lokalizacji archiwum.
- Istniejące pliki archiwów nigdy nie są nadpisywane.
- Ścieżki wyjściowe wewnątrz drzew stanu źródłowego/obszaru roboczego są odrzucane, aby uniknąć samowłączenia.
- `openclaw backup verify <archive>` sprawdza, czy archiwum zawiera dokładnie jeden główny manifest, odrzuca ścieżki archiwum w stylu przechodzenia po katalogach i sprawdza, czy każdy zadeklarowany w manifeście ładunek istnieje w tarballu.
- `openclaw backup create --verify` uruchamia tę walidację natychmiast po zapisaniu archiwum.
- `openclaw backup create --only-config` tworzy kopię zapasową tylko aktywnego pliku konfiguracji JSON.

## Co jest obejmowane kopią zapasową

`openclaw backup create` planuje źródła kopii zapasowej z lokalnej instalacji OpenClaw:

- Katalog stanu zwracany przez lokalny resolver stanu OpenClaw, zwykle `~/.openclaw`
- Ścieżka aktywnego pliku konfiguracji
- Rozpoznany katalog `credentials/`, gdy istnieje poza katalogiem stanu
- Katalogi obszarów roboczych odkryte z bieżącej konfiguracji, chyba że przekażesz `--no-include-workspace`

Profile uwierzytelniania modeli są już częścią katalogu stanu pod
`agents/<agentId>/agent/auth-profiles.json`, więc zwykle są objęte wpisem kopii
zapasowej stanu.

Jeśli użyjesz `--only-config`, OpenClaw pomija wykrywanie stanu, katalogu danych uwierzytelniających i obszaru roboczego oraz archiwizuje tylko ścieżkę aktywnego pliku konfiguracji.

OpenClaw kanonikalizuje ścieżki przed zbudowaniem archiwum. Jeśli konfiguracja,
katalog danych uwierzytelniających lub obszar roboczy już znajdują się w katalogu
stanu, nie są duplikowane jako osobne źródła kopii zapasowej najwyższego poziomu.
Brakujące ścieżki są pomijane.

Ładunek archiwum przechowuje zawartość plików z tych drzew źródłowych, a osadzony `manifest.json` zapisuje rozpoznane bezwzględne ścieżki źródłowe oraz układ archiwum użyty dla każdego zasobu.

Podczas tworzenia archiwum OpenClaw pomija znane pliki modyfikowane na żywo, które nie mają wartości przy przywracaniu, w tym aktywne transkrypty sesji agentów, logi uruchomień Cron, logi rotacyjne, kolejki dostarczania, pliki socket/pid/temp w katalogu stanu oraz powiązane pliki tymczasowe trwałych kolejek. Wynik JSON zawiera `skippedVolatileCount`, aby automatyzacja mogła zobaczyć, ile plików celowo pominięto.

Zainstalowane pliki źródłowe i manifesty pluginów pod drzewem `extensions/`
w katalogu stanu są uwzględniane, ale ich zagnieżdżone drzewa zależności
`node_modules/` są pomijane. Te zależności są odtwarzalnymi artefaktami
instalacji; po przywróceniu archiwum użyj `openclaw plugins update <id>` albo
zainstaluj plugin ponownie za pomocą `openclaw plugins install <spec> --force`,
gdy przywrócony plugin zgłasza brakujące zależności.

## Zachowanie przy nieprawidłowej konfiguracji

`openclaw backup` celowo pomija normalny preflight konfiguracji, aby nadal mógł pomagać podczas odzyskiwania. Ponieważ wykrywanie obszarów roboczych zależy od prawidłowej konfiguracji, `openclaw backup create` teraz szybko kończy się niepowodzeniem, gdy plik konfiguracji istnieje, ale jest nieprawidłowy, a kopia zapasowa obszaru roboczego jest nadal włączona.

Jeśli nadal chcesz w tej sytuacji częściową kopię zapasową, uruchom ponownie:

```bash
openclaw backup create --no-include-workspace
```

To pozostawia w zakresie stan, konfigurację i zewnętrzny katalog danych
uwierzytelniających, jednocześnie całkowicie pomijając wykrywanie obszarów
roboczych.

Jeśli potrzebujesz tylko kopii samego pliku konfiguracji, `--only-config` działa również wtedy, gdy konfiguracja jest zniekształcona, ponieważ nie polega na parsowaniu konfiguracji w celu wykrywania obszarów roboczych.

## Rozmiar i wydajność

OpenClaw nie wymusza wbudowanego maksymalnego rozmiaru kopii zapasowej ani limitu rozmiaru pojedynczego pliku.

Praktyczne limity wynikają z lokalnej maszyny i docelowego systemu plików:

- Dostępne miejsce na tymczasowy zapis archiwum oraz końcowe archiwum
- Czas potrzebny na przejście dużych drzew obszarów roboczych i skompresowanie ich do `.tar.gz`
- Czas potrzebny na ponowne przeskanowanie archiwum, jeśli używasz `openclaw backup create --verify` albo uruchamiasz `openclaw backup verify`
- Zachowanie systemu plików w ścieżce docelowej. OpenClaw preferuje etap publikacji bez nadpisywania przez dowiązanie twarde i przechodzi na wyłączną kopię, gdy dowiązania twarde nie są obsługiwane

Duże obszary robocze są zwykle głównym czynnikiem wpływającym na rozmiar archiwum. Jeśli chcesz mniejszą lub szybszą kopię zapasową, użyj `--no-include-workspace`.

Dla najmniejszego archiwum użyj `--only-config`.

## Powiązane

- [Dokumentacja CLI](/pl/cli)
