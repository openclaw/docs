---
read_when:
    - Aktualizowanie OpenClaw
    - Coś przestaje działać po aktualizacji
summary: Bezpieczna aktualizacja OpenClaw (instalacja globalna lub ze źródeł) oraz strategia wycofywania zmian
title: Aktualizowanie
x-i18n:
    generated_at: "2026-07-16T18:38:16Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: baf849d27fd1132833832734ff5b1648b7401d53925a624176832bca614d1160
    source_path: install/updating.md
    workflow: 16
---

Dbaj o aktualność OpenClaw.

Informacje o zastępowaniu obrazów Docker, Podman i Kubernetes znajdują się w sekcji
[Uaktualnianie obrazów kontenerów](/pl/install/docker#upgrading-container-images). Gateway
przed osiągnięciem gotowości wykonuje bezpieczne podczas uruchamiania działania aktualizacyjne
i kończy działanie, jeśli zamontowany stan wymaga ręcznej naprawy.

## Zalecane: `openclaw update`

Wykrywa typ instalacji (npm, pnpm, Bun lub git), pobiera najnowszą wersję, uruchamia `openclaw doctor` i ponownie uruchamia Gateway.

```bash
openclaw update
```

Przełącz kanał lub wybierz konkretną wersję:

```bash
openclaw update --channel beta
openclaw update --channel extended-stable
openclaw update --channel dev
openclaw update --dry-run   # podgląd bez stosowania zmian
```

`openclaw update` nie ma flagi `--verbose` (instalator ją ma). Do diagnostyki użyj
`--dry-run`, aby wyświetlić podgląd planowanych działań, `--json`, aby uzyskać wyniki strukturalne, lub
`openclaw update status --json`, aby sprawdzić stan kanału i dostępności.

`--channel beta` preferuje znacznik dist-tag beta npm, ale przełącza się na stable/latest,
gdy brakuje znacznika beta lub jego wersja jest starsza niż najnowsze stabilne
wydanie. Zamiast tego użyj `--tag beta`, aby wykonać jednorazową aktualizację pakietu przypiętą do surowego
znacznika dist-tag beta npm.

`--channel extended-stable` dotyczy wyłącznie pakietów, a instalacja nadal
odbywa się wyłącznie na pierwszym planie. OpenClaw odczytuje publiczny selektor npm `extended-stable`,
weryfikuje dokładnie wybrany pakiet i instaluje tę konkretną wersję. Brakujące
lub niespójne dane rejestru powodują bezpieczne przerwanie operacji; nigdy nie następuje przełączenie na `latest`.
Jeśli wybrana wersja jest starsza niż zainstalowana, nadal obowiązuje standardowe
potwierdzenie obniżenia wersji. CLI utrwala kanał po
pomyślnej aktualizacji rdzenia; bezpośrednie `npm install -g openclaw@extended-stable`
nie aktualizuje `update.channel`.
Po wymianie rdzenia kwalifikujące się oficjalne pluginy npm z zamiarem bare/default lub
`latest` zostają ujednolicone do dokładnie tej wersji rdzenia. Dokładnie przypięte wersje i jawne
znaczniki inne niż `latest`, pluginy innych firm oraz źródła inne niż npm pozostają bez zmian.
Instalacje z katalogu utworzone przez bieżące wersje OpenClaw zachowują ten domyślny
zamiar. Starsze rekordy zawierające tylko dokładną wersję pozostają przypięte, ponieważ
OpenClaw nie może bezpiecznie odróżnić starego automatycznego przypięcia od przypięcia użytkownika; uruchom
`openclaw plugins update @openclaw/name` jeden raz na kanale extended-stable,
aby ponownie włączyć dla tego pluginu śledzenie dokładnej wersji rdzenia.

`--channel dev` zapewnia trwałą, podążającą za zmianami kopię roboczą GitHub `main`. W przypadku jednorazowej
aktualizacji pakietu `--tag main` jest mapowane na specyfikację pakietu
`github:openclaw/openclaw#main` i instalowane bezpośrednio przez docelowego menedżera pakietów (npm/pnpm/bun).

W przypadku zarządzanych pluginów brak wydania beta jest ostrzeżeniem, a nie błędem:
aktualizacja rdzenia nadal może się powieść, podczas gdy plugin przełączy się
na zapisane wydanie default/latest.

Znaczenie kanałów opisano w sekcji [Kanały wydań](/pl/install/development-channels).

## Przełączanie między instalacjami npm i git

Do zmiany typu instalacji służą kanały. Aktualizator zachowuje stan, konfigurację,
dane uwierzytelniające i obszar roboczy w `~/.openclaw`; zmienia jedynie instalację kodu OpenClaw,
z której korzystają CLI i Gateway.

```bash
# instalacja pakietu npm -> edytowalna kopia robocza git
openclaw update --channel dev

# kopia robocza git -> instalacja pakietu npm
openclaw update --channel stable
```

Najpierw wyświetl podgląd zmiany trybu instalacji:

```bash
openclaw update --channel dev --dry-run
openclaw update --channel stable --dry-run
```

`dev` zapewnia kopię roboczą git, buduje ją i instaluje z niej globalne CLI.
Kanały `stable`, `extended-stable` i `beta` korzystają z instalacji
pakietów. Kanał extended-stable jest odrzucany w kopii roboczej git bez jej modyfikowania ani
konwertowania. Jeśli Gateway jest już zainstalowany, `openclaw update` odświeża
metadane usługi i uruchamia ją ponownie, chyba że zostanie przekazane `--no-restart`.

W przypadku instalacji pakietowych z zarządzaną usługą Gateway `openclaw update` wskazuje
katalog główny pakietu używany przez tę usługę. Jeśli polecenie powłoki `openclaw` pochodzi
z innej instalacji, aktualizator wyświetla oba katalogi główne oraz ścieżkę Node zarządzanej
usługi, a przed zastąpieniem pakietu sprawdza tę wersję Node względem wymagania
`engines.node` docelowego wydania.

## Alternatywa: ponowne uruchomienie instalatora

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

Dodaj `--no-onboard`, aby pominąć wdrażanie początkowe. Aby wymusić konkretny typ instalacji, przekaż
`--install-method git --no-onboard` lub `--install-method npm --no-onboard`.

Jeśli `openclaw update` zakończy się niepowodzeniem po etapie instalacji pakietu npm, uruchom ponownie
instalator. Nie wywołuje on aktualizatora; wykonuje bezpośrednio globalną instalację
pakietu i może naprawić częściowo zaktualizowaną instalację npm.

```bash
curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm
```

Przypnij odzyskiwanie do konkretnej wersji lub znacznika dist-tag za pomocą `--version`:

```bash
curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm --version <version-or-dist-tag>
```

## Alternatywa: ręcznie za pomocą npm, pnpm lub bun

```bash
npm i -g openclaw@latest
```

W instalacjach nadzorowanych preferowane jest `openclaw update`: może ono skoordynować wymianę
pakietu z działającą usługą Gateway. W przypadku ręcznej aktualizacji instalacji nadzorowanej
najpierw zatrzymaj zarządzany Gateway. Menedżery pakietów zastępują pliki
w miejscu, a działający Gateway mógłby w przeciwnym razie próbować wczytać pliki rdzenia lub pluginu
w trakcie wymiany. Po zakończeniu pracy menedżera pakietów ponownie uruchom Gateway, aby używał
nowej instalacji.

W przypadku ogólnosystemowej instalacji w systemie Linux należącej do użytkownika root, jeśli `openclaw update` zakończy się niepowodzeniem z komunikatem
`EACCES`, wykonaj odzyskiwanie za pomocą systemowego npm, pozostawiając Gateway zatrzymany na czas
ręcznego zastępowania. Użyj tych samych flag profilu i zmiennych środowiskowych, których zwykle używa
ten Gateway. Zastąp `/usr/bin/npm` systemowym npm, który jest właścicielem
globalnego prefiksu należącego do użytkownika root na hoście:

```bash
openclaw gateway stop
sudo /usr/bin/npm i -g openclaw@latest
openclaw gateway install --force
openclaw gateway restart
```

Następnie zweryfikuj:

```bash
openclaw --version
curl -fsS http://127.0.0.1:18789/readyz
openclaw plugins list --json
openclaw gateway status --deep --json
openclaw doctor --lint --json
```

Gdy `openclaw update` zarządza globalną instalacją npm, najpierw instaluje docelową wersję
w tymczasowym prefiksie npm. Pakiet kandydujący weryfikuje wersję Node hosta
podczas `preinstall`; dopiero wtedy OpenClaw weryfikuje spakowany
spis `dist` i zamienia czyste drzewo pakietu w rzeczywistym globalnym prefiksie. Z oczekiwanego spisu
pomijany jest spakowany mechanizm zabezpieczający ukończenie, który zostaje usunięty dopiero
po pomyślnym wykonaniu `preinstall`, dzięki czemu pominięte skrypty cyklu życia również powodują błąd przed
wymianą. W npm 12 i nowszych aktualizator zezwala tylko na cykl życia kandydującego pakietu OpenClaw;
skrypty zależności przechodnich pozostają zablokowane. Zapobiega to
nakładaniu przez npm nowego pakietu na nieaktualne pliki poprzedniego. Jeśli polecenie
instalacji zakończy się niepowodzeniem, OpenClaw ponawia je raz z `--omit=optional`, co pomaga na hostach,
na których nie można skompilować natywnych zależności opcjonalnych.

Zarządzane przez OpenClaw polecenia aktualizacji npm i aktualizacji pluginów usuwają również dla procesu podrzędnego npm
kwarantannę łańcucha dostaw `min-release-age` (lub starszy klucz konfiguracji `before`).
Ta zasada służy ogólnej ochronie, ale jawna aktualizacja OpenClaw oznacza
„zainstaluj teraz wybrane wydanie”.

```bash
pnpm add -g openclaw@latest
```

Jeśli pnpm 11 zainstalował OpenClaw 2026.7.1, uruchom to polecenie ręczne jeden raz. To
wydanie poprzedza izolowany układ pakietów globalnych w pnpm 11, więc jego aktualizator może
pomylić inną instalację npm z działającym CLI. Późniejsze wydania zachowują
własność pnpm i podczas aktualizacji podążają za katalogiem głównym pakietu zastępczego. Korzystają
również z globalnego katalogu bin zgłoszonego przez właściwego menedżera i zatrzymują się przed
modyfikacją, gdy dostępne polecenie pnpm zgłasza inny globalny katalog główny lub wersję główną,
albo gdy pakiet wywołujący jest osierocony lub nie jest jedyną aktywną instalacją OpenClaw
w tym miejscu.

Jeśli OpenClaw współdzieli globalną grupę instalacyjną pnpm 11 z innym pakietem,
automatyczny aktualizator zatrzymuje się przed zmianą grupy. Zaktualizuj ręcznie pierwotną
grupę rozdzielaną przecinkami, aby zachować jej pakiety siostrzane i zasady budowania.

```bash
bun add -g openclaw@latest
```

### Zaawansowane zagadnienia instalacji npm

<AccordionGroup>
  <Accordion title="Drzewo pakietów tylko do odczytu">
    OpenClaw traktuje spakowane instalacje globalne jako tylko do odczytu w czasie działania, nawet jeśli globalny katalog pakietu jest zapisywalny dla bieżącego użytkownika. Instalacje pakietów pluginów znajdują się w należących do OpenClaw katalogach głównych npm/git w katalogu konfiguracji użytkownika, a uruchomienie Gateway nie modyfikuje drzewa pakietów OpenClaw.

    Niektóre konfiguracje npm w systemie Linux instalują pakiety globalne w katalogach należących do użytkownika root, takich jak `/usr/lib/node_modules/openclaw`. OpenClaw obsługuje ten układ, ponieważ polecenia instalacji i aktualizacji pluginów zapisują dane poza tym globalnym katalogiem pakietu.

  </Accordion>
  <Accordion title="Wzmocnione jednostki systemd">
    Przyznaj OpenClaw dostęp do zapisu w katalogach głównych konfiguracji i stanu, aby jawne instalacje pluginów, aktualizacje pluginów i czyszczenie przez doctor mogły utrwalać zmiany:

    ```ini
    ReadWritePaths=/var/lib/openclaw /home/openclaw/.openclaw /tmp
    ```

  </Accordion>
  <Accordion title="Wstępne sprawdzenie miejsca na dysku">
    Przed aktualizacjami pakietów i jawnymi instalacjami pluginów OpenClaw podejmuje próbę sprawdzenia dostępnego miejsca na woluminie docelowym. Mała ilość miejsca powoduje wyświetlenie ostrzeżenia ze sprawdzoną ścieżką, ale nie blokuje aktualizacji, ponieważ limity systemu plików, migawki i woluminy sieciowe mogą zmienić się po sprawdzeniu. Rozstrzygające pozostają faktyczna instalacja przez menedżera pakietów i weryfikacja po instalacji.
  </Accordion>
</AccordionGroup>

## Automatyczny aktualizator

Domyślnie wyłączony. Włącz go w `~/.openclaw/openclaw.json`:

```json5
{
  update: {
    channel: "stable",
    auto: {
      enabled: true,
      stableDelayHours: 6,
      stableJitterHours: 12,
      betaCheckIntervalHours: 1,
    },
  },
}
```

| Kanał           | Zachowanie                                                                                                                                     |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `stable`          | Czeka `stableDelayHours` (domyślnie: 6), a następnie stosuje aktualizację z deterministycznym rozproszeniem w zakresie `stableJitterHours` (domyślnie: 12), aby rozłożyć wdrożenie w czasie. |
| `extended-stable` | Sprawdza podczas uruchamiania i co 24 godziny wskazówkę o aktualizacji tylko do odczytu, gdy włączone jest `checkOnStart`. Nigdy nie stosuje aktualizacji automatycznie.                |
| `beta`            | Sprawdza co `betaCheckIntervalHours` (domyślnie: 1) i natychmiast stosuje aktualizację.                                                                  |
| `dev`             | Brak automatycznego stosowania. Użyj ręcznie `openclaw update`.                                                                                          |

Gateway rejestruje również podczas uruchamiania wskazówkę o aktualizacji (można ją wyłączyć za pomocą
`update.checkOnStart: false`). Zapisane wybory extended-stable korzystają z tej
ścieżki wskazówek tylko do odczytu i istniejącego 24-godzinnego interwału wskazówek, ale nigdy nie wywołują
automatycznej instalacji, przekazania sterowania, ponownego uruchomienia, stabilnego opóźnienia/rozproszenia ani odpytywania wersji beta.
Aby obniżyć wersję lub odzyskać sprawność po incydencie, ustaw `OPENCLAW_NO_AUTO_UPDATE=1` w środowisku Gateway, aby zablokować automatyczne stosowanie aktualizacji nawet wtedy, gdy skonfigurowano `update.auto.enabled`. Wskazówki o aktualizacji podczas uruchamiania nadal mogą działać, chyba że wyłączono również `update.checkOnStart`.

Aktualizacje menedżera pakietów żądane przez aktywną płaszczyznę sterowania Gateway
(`update.run`) nie zastępują drzewa pakietów wewnątrz działającego procesu Gateway.
W instalacjach z usługą zarządzaną Gateway uruchamia odłączone przekazanie sterowania,
kończy działanie i pozwala standardowej ścieżce CLI `openclaw update --yes --json` zatrzymać
usługę, zastąpić pakiet, odświeżyć metadane usługi, uruchomić ją ponownie, zweryfikować
wersję i osiągalność Gateway oraz, gdy to możliwe, odzyskać zainstalowany, ale niewczytany
LaunchAgent systemu macOS. Jeśli Gateway nie może bezpiecznie wykonać takiego przekazania,
`update.run` zgłasza bezpieczne polecenie powłoki zamiast uruchamiać menedżera
pakietów wewnątrz procesu.

Karta aktualizacji na pasku bocznym interfejsu Control UI wyświetla **Zaktualizuj Gateway**, gdy bezpośrednio uruchomi
ten przepływ `update.run`. Dotyczy to interfejsu Control UI działającego w przeglądarce, zdalnych
Gatewayów oraz ręcznie zarządzanych lokalnych Gatewayów.

W podpisanej aplikacji macOS lokalny Gateway należący do aplikacji zmienia tę kartę na
**Zaktualizuj aplikację Mac + Gateway**. Sparkle najpierw aktualizuje aplikację; po ponownym uruchomieniu
aplikacja wykonuje `openclaw update --tag <app-version> --json`, ponownie uruchamia swój Gateway
i weryfikuje jego stan w oknie postępu przypominającym proces konfiguracji. Okno pojawia się tylko
wtedy, gdy ten zarządzany Gateway wymaga aktualizacji, naprawy lub instalacji; aktualizacje dotyczące tylko aplikacji po ponownym uruchomieniu
przechodzą bezpośrednio do aplikacji. Szczegóły błędu pozostają widoczne wraz z działaniami Ponów próbę, [Instrukcja aktualizacji](/pl/install/updating) oraz
[Discord](https://discord.gg/clawd). Aplikacja nigdy nie używa tej skoordynowanej
ścieżki dla zdalnego lub zarządzanego zewnętrznie Gatewaya, nigdy nie obniża wersji nowszego
Gatewaya ani nigdy nie zastępuje przypięcia kanału `extended-stable`.

Po pomyślnym zakończeniu aktualizacji aplikacja umieszcza w kolejce jednorazowe zdarzenie powitalne dla najnowszej
bezpośredniej sesji najwyższego poziomu, w której nastąpiła rzeczywista interakcja z użytkownikiem lub kanałem. Uruchomienia Cron,
heartbeat oraz aktualizacje sesji działających wyłącznie w tle nie zmieniają tego wyboru. W
trybie zdalnym aplikacja aktualizuje tylko środowisko uruchomieniowe lokalnego węzła Mac i wysyła zdarzenie
tylko wtedy, gdy połączony zdalny Gateway jest co najmniej tak nowy jak aplikacja.

## Po aktualizacji

<Steps>

### Uruchom doctor

```bash
openclaw doctor
```

Migruje konfigurację, przeprowadza audyt zasad wiadomości bezpośrednich i sprawdza stan Gatewaya. Szczegóły: [Doctor](/pl/gateway/doctor)

### Uruchom ponownie Gateway

```bash
openclaw gateway restart
```

### Zweryfikuj

```bash
openclaw health
```

</Steps>

## Wycofywanie zmian

Wycofywanie zmian ma dwie warstwy:

1. Ponownie zainstaluj starszy kod OpenClaw, zachowując bieżący stan.
2. Przywróć stan sprzed aktualizacji tylko wtedy, gdy starszy kod nie może używać zmigrowanej
   konfiguracji lub bazy danych.

Zacznij od wycofania tylko kodu. Przywrócenie stanu odrzuca zmiany wprowadzone po
utworzeniu kopii zapasowej.

### Przed aktualizacją: utwórz zweryfikowaną kopię zapasową

`openclaw update` zachowuje automatyczną kopię konfiguracji sprzed aktualizacji, ale nie
tworzy pełnego punktu odzyskiwania stanu. Przed istotną aktualizacją utwórz go
jawnie:

```bash
mkdir -p ~/Backups/openclaw
openclaw backup create --output ~/Backups/openclaw --verify
```

Manifest archiwum zapisuje wersję OpenClaw oraz ścieżki źródłowe uwzględnione
w kopii zapasowej. Archiwum może zawierać dane uwierzytelniające, profile uwierzytelniania i stan
kanałów, dlatego przechowuj je z uprawnieniami wyłącznie dla właściciela i takim samym poziomem ochrony jak
aktywny katalog stanu. Informacje o uwzględnionych i celowo
pominiętych plikach zawiera sekcja [Kopia zapasowa](/pl/cli/backup).

Aby utworzyć punkt odzyskiwania identyczny bajt po bajcie, obejmujący ulotne artefakty pominięte w
przenośnym archiwum, zatrzymaj Gateway i użyj migawki systemu plików, woluminu lub maszyny wirtualnej
udostępnianej przez platformę.

### Wycofaj instalację pakietu

Wyświetl opublikowane wersje, a następnie wyświetl podgląd i zainstaluj znaną, prawidłowo działającą wersję:

```bash
npm view openclaw versions --json
openclaw update --tag <known-good-version> --dry-run
openclaw update --tag <known-good-version>
```

`openclaw update --tag` jest zalecane zamiast bezpośredniej instalacji za pomocą menedżera pakietów. Polecenie
wykrywa obniżenie wersji, prosi o potwierdzenie, uruchamia uzgadnianie zarządzanych pluginów
oraz kontrole zgodności z zainstalowaną wersją docelową, odświeża metadane
usługi, ponownie uruchamia Gateway i weryfikuje działającą wersję. Jeśli zapisanym
kanałem jest `extended-stable`, użyj
`--channel stable --tag <known-good-version>`, ponieważ jednorazowych, dokładnych tagów nie można
łączyć z selektorem `extended-stable`.

Aktualizacje pakietów przygotowują i weryfikują wersję kandydującą przed aktywacją. Jeśli
zamiana w systemie plików lub zastąpienie otoczki polecenia zakończy się niepowodzeniem, OpenClaw automatycznie przywróci stary
pakiet. Po pomyślnej zamianie późniejszy błąd kontroli stanu Gatewaya
zgłasza poprzednią wersję i instrukcje ręcznego wycofania zamiast
ponownego automatycznego zastępowania pakietu.

Jeśli ścieżka aktualizacji CLI jest niedostępna, użyj tego samego menedżera pakietów i zakresu
instalacji, do których należy bieżący Gateway:

```bash
openclaw gateway stop
npm i -g openclaw@<known-good-version>
openclaw gateway install --force
openclaw gateway restart
```

Zastąp `npm` wartością `pnpm` lub `bun`, jeśli ten menedżer jest właścicielem instalacji. Podczas
odzyskiwania po incydencie zapobiegnij natychmiastowemu zastosowaniu
nowszej wersji przez włączony automatyczny aktualizator, ustawiając `OPENCLAW_NO_AUTO_UPDATE=1` w środowisku Gatewaya.

### Wycofaj zmiany w kopii roboczej kodu źródłowego

Użyj czystej kopii roboczej i wybierz znany, prawidłowo działający tag lub commit:

```bash
git fetch --all --tags
git checkout --detach <known-good-tag-or-commit>
pnpm install && pnpm build
openclaw gateway restart
```

Aby wrócić do najnowszej wersji: `git checkout main && git pull`.

Aktualizator automatycznie przywraca poprzednią gałąź i
SHA kopii roboczej Git, gdy instalacja zależności, kompilacja, kompilacja interfejsu użytkownika lub doctor zakończy się niepowodzeniem po rozpoczęciu
aktualizacji Git. Ręczne przełączenie kopii roboczej jest nadal wymagane, gdy celowo wybierany jest
starszy commit.

### Obniżanie wersji po migracji sesji do SQLite

Przed uruchomieniem starszej wersji OpenClaw korzystającej z plików użyj bieżącego CLI, aby
przywrócić zarchiwizowane starsze artefakty transkrypcji:

```bash
openclaw gateway stop
openclaw doctor --session-sqlite restore --session-sqlite-all-agents
```

Nie powoduje to usunięcia danych SQLite. Sesje utworzone po migracji do SQLite
istnieją wyłącznie w SQLite i nie pojawią się w starszym środowisku uruchomieniowym. Zobacz
[Obniżanie wersji po migracji sesji do SQLite](/pl/cli/doctor#downgrading-after-session-sqlite-migration).

### Przywracaj stan tylko w razie konieczności

Jeśli starszy kod nie może odczytać nowszej konfiguracji lub schematu bazy danych, zatrzymaj
Gateway i przywróć zweryfikowaną migawkę systemu plików, woluminu lub maszyny wirtualnej sprzed aktualizacji.
Przed przywróceniem zachowaj bieżący stan oddzielnie, ponieważ operacja ta usuwa
zmiany wprowadzone po utworzeniu migawki.

Ogólne archiwa `openclaw backup create` obsługują tworzenie i weryfikację, ale
nie aktywację całego archiwum w miejscu. Wyodrębnij ogólne archiwum do katalogu
przejściowego i użyj jego mapowania źródła na archiwum `manifest.json` do przywracania
offline. `openclaw backup sqlite restore` podobnie zapisuje zweryfikowaną bazę danych
w nowej lokalizacji docelowej; aktywacja tej lokalizacji pozostaje jawnym krokiem operatora
wykonywanym offline.

### Zweryfikuj wycofanie zmian

```bash
openclaw --version
openclaw health
openclaw plugins list --json
openclaw gateway status --deep --json
openclaw doctor --lint --json
```

## W razie problemów

- Uruchom ponownie `openclaw doctor` i uważnie przeczytaj dane wyjściowe.
- W przypadku `openclaw update --channel dev` w kopiach roboczych kodu źródłowego aktualizator automatycznie inicjalizuje `pnpm`, gdy jest to potrzebne. Jeśli pojawi się błąd inicjalizacji pnpm/corepack, zainstaluj ręcznie `pnpm` (lub ponownie włącz `corepack`) i ponownie uruchom aktualizację.
- Sprawdź: [Rozwiązywanie problemów](/pl/gateway/troubleshooting)
- Zapytaj na Discordzie: [https://discord.gg/clawd](https://discord.gg/clawd)

## Powiązane

- [Omówienie instalacji](/pl/install): wszystkie metody instalacji.
- [Doctor](/pl/gateway/doctor): kontrole stanu po aktualizacjach.
- [Migracja](/pl/install/migrating): przewodniki dotyczące migracji między głównymi wersjami.
