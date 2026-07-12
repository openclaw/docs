---
read_when:
    - Aktualizowanie OpenClaw
    - Coś przestaje działać po aktualizacji
summary: Bezpieczna aktualizacja OpenClaw (instalacja globalna lub ze źródeł) oraz strategia wycofania zmian
title: Aktualizowanie
x-i18n:
    generated_at: "2026-07-12T15:16:57Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 06b475fcd715afa5f4b9fa3fc7d546ba8dc53805c6a29e12fd4706dceb04cb60
    source_path: install/updating.md
    workflow: 16
---

Dbaj o aktualność OpenClaw.

Informacje o zastępowaniu obrazów Docker, Podman i Kubernetes znajdziesz w sekcji
[Uaktualnianie obrazów kontenerów](/pl/install/docker#upgrading-container-images). Gateway
przed osiągnięciem gotowości wykonuje bezpieczne podczas uruchamiania czynności aktualizacyjne
i kończy działanie, jeśli zamontowany stan wymaga ręcznej naprawy.

## Zalecane: `openclaw update`

Wykrywa typ instalacji (npm lub git), pobiera najnowszą wersję, uruchamia `openclaw doctor` i ponownie uruchamia Gateway.

```bash
openclaw update
```

Zmień kanał lub wskaż konkretną wersję:

```bash
openclaw update --channel beta
openclaw update --channel extended-stable
openclaw update --channel dev
openclaw update --dry-run   # podgląd bez wprowadzania zmian
```

`openclaw update` nie ma flagi `--verbose` (instalator ją ma). Do diagnostyki użyj
`--dry-run`, aby wyświetlić podgląd planowanych działań, `--json`, aby uzyskać wyniki strukturalne, lub
`openclaw update status --json`, aby sprawdzić stan kanału i dostępności.

`--channel beta` preferuje znacznik dystrybucyjny npm beta, ale przechodzi na stable/latest,
gdy brakuje znacznika beta lub jego wersja jest starsza niż najnowsze stabilne
wydanie. Zamiast tego użyj `--tag beta`, aby wykonać jednorazową aktualizację pakietu
przypiętą do bezpośredniego znacznika dystrybucyjnego npm beta.

`--channel extended-stable` obsługuje wyłącznie pakiety, a instalacja jest wykonywana
tylko na pierwszym planie. OpenClaw odczytuje publiczny selektor npm `extended-stable`,
weryfikuje dokładnie wybrany pakiet i instaluje tę konkretną wersję. Brakujące
lub niespójne dane rejestru powodują bezpieczne przerwanie operacji; nigdy nie następuje przejście na `latest`.
Jeśli wybrana wersja jest starsza niż zainstalowana, nadal obowiązuje standardowe
potwierdzenie obniżenia wersji. CLI zachowuje kanał po pomyślnej
aktualizacji rdzenia; bezpośrednie polecenie `npm install -g openclaw@extended-stable`
nie aktualizuje `update.channel`.
Po wymianie rdzenia kwalifikujące się oficjalne Pluginy npm z intencją pustą/domyślną lub
`latest` przechodzą na dokładnie tę samą wersję co rdzeń. Dokładnie przypięte wersje i jawne
znaczniki inne niż `latest`, Pluginy innych firm oraz źródła inne niż npm pozostają bez zmian.
Instalacje z katalogu utworzone przez bieżące wersje OpenClaw zachowują tę domyślną
intencję. Starsze rekordy zawierające wyłącznie dokładną wersję pozostają przypięte, ponieważ
OpenClaw nie może bezpiecznie odróżnić starego automatycznego przypięcia od przypięcia użytkownika; uruchom
jednorazowo `openclaw plugins update @openclaw/name` na kanale extended-stable,
aby ponownie włączyć dla tego Pluginu śledzenie dokładnej wersji rdzenia.

`--channel dev` zapewnia trwałą, podążającą za zmianami kopię roboczą gałęzi GitHub `main`. W przypadku jednorazowej
aktualizacji pakietu `--tag main` jest mapowane na specyfikację pakietu
`github:openclaw/openclaw#main` i instaluje go bezpośrednio przez docelowego menedżera pakietów (npm/pnpm/bun).

W przypadku zarządzanych Pluginów brak wydania beta jest ostrzeżeniem, a nie błędem:
aktualizacja rdzenia może się powieść, a Plugin powróci do swojego zapisanego
domyślnego/najnowszego wydania.

Semantykę kanałów opisano w sekcji [Kanały wydań](/pl/install/development-channels).

## Przełączanie między instalacjami npm i git

Użyj kanałów, aby zmienić typ instalacji. Aktualizator zachowuje stan, konfigurację,
dane uwierzytelniające i przestrzeń roboczą w `~/.openclaw`; zmienia tylko instalację kodu OpenClaw,
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

Kanał `dev` zapewnia kopię roboczą git, kompiluje ją i instaluje globalne CLI z tej
kopii. Kanały `stable`, `extended-stable` i `beta` używają instalacji
pakietów. Kanał extended-stable jest odrzucany w kopii roboczej git bez jej modyfikowania
ani konwertowania. Jeśli Gateway jest już zainstalowany, `openclaw update` odświeża
metadane usługi i uruchamia ją ponownie, chyba że przekażesz `--no-restart`.

W przypadku instalacji pakietowych z zarządzaną usługą Gateway polecenie `openclaw update` wskazuje
katalog główny pakietu używany przez tę usługę. Jeśli polecenie powłoki `openclaw` pochodzi
z innej instalacji, aktualizator wyświetla oba katalogi główne oraz ścieżkę Node
zarządzanej usługi, a przed zastąpieniem pakietu sprawdza zgodność tej wersji Node
z wymaganiem `engines.node` docelowego wydania.

## Alternatywa: ponowne uruchomienie instalatora

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

Dodaj `--no-onboard`, aby pominąć wdrażanie. Aby wymusić określony typ instalacji, przekaż
`--install-method git --no-onboard` lub `--install-method npm --no-onboard`.

Jeśli `openclaw update` nie powiedzie się po etapie instalacji pakietu npm, uruchom ponownie
instalator. Nie wywołuje on aktualizatora; wykonuje bezpośrednio globalną instalację
pakietu i może naprawić częściowo zaktualizowaną instalację npm.

```bash
curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm
```

Przypnij odzyskiwanie do określonej wersji lub znacznika dystrybucyjnego za pomocą `--version`:

```bash
curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm --version <version-or-dist-tag>
```

## Alternatywa: ręcznie przez npm, pnpm lub bun

```bash
npm i -g openclaw@latest
```

W przypadku instalacji nadzorowanych preferuj `openclaw update`: może ono skoordynować wymianę
pakietu z działającą usługą Gateway. Jeśli aktualizujesz instalację nadzorowaną ręcznie,
najpierw zatrzymaj zarządzany Gateway. Menedżery pakietów zastępują pliki
w miejscu, przez co działający Gateway może w trakcie wymiany próbować wczytać pliki rdzenia lub Pluginów.
Po zakończeniu pracy menedżera pakietów uruchom Gateway ponownie, aby zaczął korzystać
z nowej instalacji.

W przypadku należącej do użytkownika root, globalnej instalacji systemowej w systemie Linux, jeśli `openclaw update` zakończy się
błędem `EACCES`, przeprowadź odzyskiwanie za pomocą systemowego npm, utrzymując Gateway zatrzymany podczas
ręcznej wymiany. Użyj tych samych flag profilu/zmiennych środowiskowych, których zwykle używasz dla
tego Gateway. Zastąp `/usr/bin/npm` systemowym npm zarządzającym
należącym do użytkownika root globalnym prefiksem na Twoim hoście:

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

Gdy `openclaw update` zarządza globalną instalacją npm, najpierw instaluje wersję docelową
w tymczasowym prefiksie npm, weryfikuje spis spakowanego katalogu `dist`, a następnie
podmienia czyste drzewo pakietu w rzeczywistym globalnym prefiksie — zapobiegając
nakładaniu przez npm nowego pakietu na nieaktualne pliki ze starego. Jeśli polecenie
instalacji nie powiedzie się, OpenClaw ponawia je raz z opcją `--omit=optional`, co pomaga na hostach,
na których nie można skompilować natywnych opcjonalnych zależności.

Zarządzane przez OpenClaw polecenia aktualizacji npm i aktualizacji Pluginów wyłączają również
kwarantannę łańcucha dostaw `min-release-age` npm (lub starszy klucz konfiguracji `before`)
dla podrzędnego procesu npm. Ta zasada zapewnia ogólną ochronę, ale jawna
aktualizacja OpenClaw oznacza „zainstaluj teraz wybrane wydanie”.

```bash
pnpm add -g openclaw@latest
```

```bash
bun add -g openclaw@latest
```

### Zaawansowane zagadnienia instalacji npm

<AccordionGroup>
  <Accordion title="Drzewo pakietów tylko do odczytu">
    OpenClaw traktuje spakowane instalacje globalne jako przeznaczone tylko do odczytu w czasie działania, nawet gdy bieżący użytkownik może zapisywać w globalnym katalogu pakietów. Instalacje pakietów Pluginów znajdują się w należących do OpenClaw katalogach głównych npm/git w katalogu konfiguracji użytkownika, a uruchomienie Gateway nie modyfikuje drzewa pakietu OpenClaw.

    Niektóre konfiguracje npm w systemie Linux instalują pakiety globalne w katalogach należących do użytkownika root, takich jak `/usr/lib/node_modules/openclaw`. OpenClaw obsługuje taki układ, ponieważ polecenia instalowania i aktualizowania Pluginów zapisują dane poza tym globalnym katalogiem pakietów.

  </Accordion>
  <Accordion title="Wzmocnione jednostki systemd">
    Przyznaj OpenClaw prawo zapisu w jego katalogach głównych konfiguracji i stanu, aby jawne instalacje Pluginów, aktualizacje Pluginów i czyszczenie wykonywane przez doctor mogły trwale zapisywać zmiany:

    ```ini
    ReadWritePaths=/var/lib/openclaw /home/openclaw/.openclaw /tmp
    ```

  </Accordion>
  <Accordion title="Wstępne sprawdzanie miejsca na dysku">
    Przed aktualizacjami pakietów i jawnymi instalacjami Pluginów OpenClaw próbuje w miarę możliwości sprawdzić ilość wolnego miejsca na woluminie docelowym. Mała ilość miejsca powoduje wyświetlenie ostrzeżenia ze sprawdzoną ścieżką, ale nie blokuje aktualizacji, ponieważ przydziały systemu plików, migawki i woluminy sieciowe mogą ulec zmianie po sprawdzeniu. Rozstrzygające pozostają właściwa instalacja wykonywana przez menedżera pakietów i weryfikacja poinstalacyjna.
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

| Kanał             | Działanie                                                                                                                                               |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `stable`          | Czeka przez `stableDelayHours` (domyślnie: 6), a następnie stosuje aktualizację z deterministycznym rozrzutem w okresie `stableJitterHours` (domyślnie: 12), aby rozłożyć wdrożenie w czasie. |
| `extended-stable` | Sprawdza podczas uruchamiania i co 24 godziny wskazówkę o aktualizacji tylko do odczytu, gdy włączono `checkOnStart`. Nigdy nie stosuje aktualizacji automatycznie. |
| `beta`            | Sprawdza co `betaCheckIntervalHours` (domyślnie: 1) i natychmiast stosuje aktualizację.                                                                   |
| `dev`             | Nie stosuje aktualizacji automatycznie. Użyj ręcznie `openclaw update`.                                                                                   |

Gateway zapisuje również w dzienniku wskazówkę dotyczącą aktualizacji podczas uruchamiania (wyłącz ją za pomocą
`update.checkOnStart: false`). Zapisane wybory extended-stable korzystają z tej
ścieżki wskazówek tylko do odczytu i istniejącego 24-godzinnego interwału, ale nigdy nie uruchamiają
automatycznej instalacji, przekazania sterowania, ponownego uruchomienia, opóźnienia/rozrzutu kanału stable ani odpytywania kanału beta.
Aby obniżyć wersję lub odzyskać system po incydencie, ustaw `OPENCLAW_NO_AUTO_UPDATE=1` w środowisku Gateway, by blokować automatyczne stosowanie aktualizacji, nawet gdy skonfigurowano `update.auto.enabled`. Wskazówki dotyczące aktualizacji podczas uruchamiania mogą nadal działać, chyba że wyłączono również `update.checkOnStart`.

Aktualizacje menedżera pakietów żądane przez płaszczyznę sterowania działającego Gateway
(`update.run`) nie zastępują drzewa pakietów wewnątrz działającego procesu Gateway.
W instalacjach z usługą zarządzaną Gateway uruchamia odłączony proces przekazania,
kończy działanie i pozwala standardowej ścieżce CLI `openclaw update --yes --json` zatrzymać
usługę, zastąpić pakiet, odświeżyć metadane usługi, uruchomić ją ponownie, zweryfikować
wersję i osiągalność Gateway oraz, jeśli to możliwe, naprawić zainstalowany, lecz niewczytany
LaunchAgent systemu macOS. Jeśli Gateway nie może bezpiecznie wykonać tego przekazania,
`update.run` zgłasza bezpieczne polecenie powłoki zamiast uruchamiać menedżera
pakietów wewnątrz procesu.

Karta aktualizacji na pasku bocznym Control UI uruchamia ten sam przepływ `update.run`. W
podpisanej aplikacji macOS karta najpierw aktualizuje aplikację za pomocą Sparkle; po ponownym uruchomieniu
aplikacja doprowadza zarządzany lokalny Gateway do zgodnej wersji.

## Po aktualizacji

<Steps>

### Uruchom doctor

```bash
openclaw doctor
```

Migruje konfigurację, kontroluje zasady wiadomości prywatnych i sprawdza stan Gateway. Szczegóły: [Doctor](/pl/gateway/doctor)

### Uruchom ponownie Gateway

```bash
openclaw gateway restart
```

### Zweryfikuj

```bash
openclaw health
```

</Steps>

## Wycofywanie wersji

### Przypnij wersję (npm)

```bash
npm i -g openclaw@<version>
openclaw doctor
openclaw gateway restart
```

<Tip>
`npm view openclaw version` pokazuje obecnie opublikowaną wersję.
</Tip>

### Przypnij commit (kod źródłowy)

```bash
git fetch origin
git checkout "$(git rev-list -n 1 --before=\"2026-01-01\" origin/main)"
pnpm install && pnpm build
openclaw gateway restart
```

Aby wrócić do najnowszej wersji: `git checkout main && git pull`.

## Jeśli utkniesz

- Ponownie uruchom `openclaw doctor` i uważnie przeczytaj dane wyjściowe.
- W przypadku `openclaw update --channel dev` w kopiach roboczych kodu źródłowego aktualizator w razie potrzeby automatycznie przygotowuje `pnpm`. Jeśli zobaczysz błąd przygotowania pnpm/corepack, zainstaluj `pnpm` ręcznie (lub ponownie włącz `corepack`) i ponów aktualizację.
- Sprawdź: [Rozwiązywanie problemów](/pl/gateway/troubleshooting)
- Zapytaj na Discordzie: [https://discord.gg/clawd](https://discord.gg/clawd)

## Powiązane

- [Przegląd instalacji](/pl/install): wszystkie metody instalacji.
- [Diagnostyka](/pl/gateway/doctor): kontrole stanu po aktualizacjach.
- [Migracja](/pl/install/migrating): przewodniki po migracji między głównymi wersjami.
