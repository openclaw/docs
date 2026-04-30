---
read_when:
    - Potrzebujesz pełnoprawnego archiwum kopii zapasowej lokalnego stanu OpenClaw
    - Chcesz podejrzeć, które ścieżki zostałyby uwzględnione przed resetem lub odinstalowaniem
summary: Dokumentacja referencyjna CLI dla `openclaw backup` (tworzenie lokalnych archiwów kopii zapasowych)
title: Kopia zapasowa
x-i18n:
    generated_at: "2026-04-30T09:41:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5c16f953bb32a1613181448f0e4c6ba8777383bce95bddc856dc7e1c3afe8550
    source_path: cli/backup.md
    workflow: 16
---

# `openclaw backup`

Utwórz lokalne archiwum kopii zapasowej stanu OpenClaw, konfiguracji, profili uwierzytelniania, poświadczeń kanałów/dostawców, sesji oraz opcjonalnie przestrzeni roboczych.

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
- Domyślne wyjście to archiwum `.tar.gz` ze znacznikiem czasu w bieżącym katalogu roboczym.
- Jeśli bieżący katalog roboczy znajduje się wewnątrz drzewa źródłowego objętego kopią zapasową, OpenClaw używa katalogu domowego jako domyślnej lokalizacji archiwum.
- Istniejące pliki archiwów nigdy nie są nadpisywane.
- Ścieżki wyjściowe wewnątrz drzew stanu źródłowego/przestrzeni roboczej są odrzucane, aby uniknąć dołączenia archiwum do samego siebie.
- `openclaw backup verify <archive>` sprawdza, czy archiwum zawiera dokładnie jeden główny manifest, odrzuca ścieżki archiwum typu traversal i sprawdza, czy każdy zadeklarowany w manifeście ładunek istnieje w pliku tarball.
- `openclaw backup create --verify` uruchamia tę walidację bezpośrednio po zapisaniu archiwum.
- `openclaw backup create --only-config` tworzy kopię zapasową tylko aktywnego pliku konfiguracji JSON.

## Co jest obejmowane kopią zapasową

`openclaw backup create` planuje źródła kopii zapasowej z lokalnej instalacji OpenClaw:

- Katalog stanu zwracany przez lokalny resolver stanu OpenClaw, zwykle `~/.openclaw`
- Ścieżka aktywnego pliku konfiguracji
- Rozpoznany katalog `credentials/`, gdy istnieje poza katalogiem stanu
- Katalogi przestrzeni roboczych wykryte z bieżącej konfiguracji, chyba że przekażesz `--no-include-workspace`

Profile uwierzytelniania modeli są już częścią katalogu stanu pod
`agents/<agentId>/agent/auth-profiles.json`, więc zwykle obejmuje je wpis
kopii zapasowej stanu.

Jeśli użyjesz `--only-config`, OpenClaw pomija wykrywanie stanu, katalogu poświadczeń i przestrzeni roboczych oraz archiwizuje tylko ścieżkę aktywnego pliku konfiguracji.

OpenClaw kanonikalizuje ścieżki przed zbudowaniem archiwum. Jeśli konfiguracja,
katalog poświadczeń lub przestrzeń robocza już znajdują się wewnątrz katalogu
stanu, nie są duplikowane jako osobne źródła kopii zapasowej najwyższego poziomu. Brakujące ścieżki są
pomijane.

Ładunek archiwum przechowuje zawartość plików z tych drzew źródłowych, a osadzony `manifest.json` rejestruje rozpoznane bezwzględne ścieżki źródłowe oraz układ archiwum użyty dla każdego zasobu.

Zainstalowane pliki źródłowe pluginów i pliki manifestów pod drzewem
`extensions/` katalogu stanu są uwzględniane, ale ich zagnieżdżone drzewa zależności
`node_modules/` są pomijane. Te zależności są odtwarzalnymi artefaktami instalacji; po
przywróceniu archiwum użyj `openclaw plugins update <id>` albo ponownie zainstaluj plugin
za pomocą `openclaw plugins install <spec> --force`, gdy przywrócony plugin zgłasza
brakujące zależności.

## Zachowanie przy nieprawidłowej konfiguracji

`openclaw backup` celowo omija zwykłą wstępną kontrolę konfiguracji, aby nadal mógł pomóc podczas odzyskiwania. Ponieważ wykrywanie przestrzeni roboczych zależy od prawidłowej konfiguracji, `openclaw backup create` obecnie szybko kończy się niepowodzeniem, gdy plik konfiguracji istnieje, ale jest nieprawidłowy, a kopia zapasowa przestrzeni roboczej jest nadal włączona.

Jeśli w takiej sytuacji nadal chcesz utworzyć częściową kopię zapasową, uruchom ponownie:

```bash
openclaw backup create --no-include-workspace
```

Dzięki temu stan, konfiguracja i zewnętrzny katalog poświadczeń pozostają w zakresie,
a wykrywanie przestrzeni roboczych jest całkowicie pomijane.

Jeśli potrzebujesz tylko kopii samego pliku konfiguracji, `--only-config` działa również wtedy, gdy konfiguracja jest zniekształcona, ponieważ nie polega na parsowaniu konfiguracji w celu wykrywania przestrzeni roboczych.

## Rozmiar i wydajność

OpenClaw nie narzuca wbudowanego maksymalnego rozmiaru kopii zapasowej ani limitu rozmiaru pojedynczego pliku.

Praktyczne limity wynikają z lokalnej maszyny i docelowego systemu plików:

- Dostępne miejsce na tymczasowy zapis archiwum oraz końcowe archiwum
- Czas potrzebny na przejście przez duże drzewa przestrzeni roboczych i skompresowanie ich do `.tar.gz`
- Czas potrzebny na ponowne przeskanowanie archiwum, jeśli użyjesz `openclaw backup create --verify` albo uruchomisz `openclaw backup verify`
- Zachowanie systemu plików w ścieżce docelowej. OpenClaw preferuje etap publikacji przez twarde dowiązanie bez nadpisywania i przechodzi na wyłączną kopię, gdy twarde dowiązania nie są obsługiwane

Duże przestrzenie robocze są zwykle głównym czynnikiem wpływającym na rozmiar archiwum. Jeśli chcesz uzyskać mniejszą lub szybszą kopię zapasową, użyj `--no-include-workspace`.

Aby uzyskać najmniejsze archiwum, użyj `--only-config`.

## Powiązane

- [Dokumentacja CLI](/pl/cli)
