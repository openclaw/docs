---
read_when:
    - Chcesz bezpiecznie zaktualizować checkout źródłowy
    - Debugujesz dane wyjściowe lub opcje `openclaw update`
    - Musisz zrozumieć zachowanie skrótu `--update`
summary: Dokumentacja CLI dla `openclaw update` (w miarę bezpieczna aktualizacja źródła + automatyczne ponowne uruchomienie Gateway)
title: Aktualizuj
x-i18n:
    generated_at: "2026-06-27T17:24:26Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a3503e1cd15baa4d4f6c26734b37556831c612f1da0da5ccfe7bcde35b9be64b
    source_path: cli/update.md
    workflow: 16
---

# `openclaw update`

Bezpiecznie aktualizuj OpenClaw i przełączaj się między kanałami stable/beta/dev.

Jeśli instalacja została wykonana przez **npm/pnpm/bun** (instalacja globalna, bez metadanych git),
aktualizacje odbywają się przez przepływ menedżera pakietów opisany w [Aktualizowanie](/pl/install/updating).

## Użycie

```bash
openclaw update
openclaw update status
openclaw update repair
openclaw update wizard
openclaw update --channel beta
openclaw update --channel dev
openclaw update --tag beta
openclaw update --tag main
openclaw update --dry-run
openclaw update --no-restart
openclaw update --yes
openclaw update --acknowledge-clawhub-risk
openclaw update --json
openclaw --update
```

## Opcje

- `--no-restart`: pomiń ponowne uruchomienie usługi Gateway po udanej aktualizacji. Aktualizacje przez menedżera pakietów, które ponownie uruchamiają Gateway, przed powodzeniem polecenia sprawdzają, czy ponownie uruchomiona usługa zgłasza oczekiwaną zaktualizowaną wersję.
- `--channel <stable|beta|dev>`: ustaw kanał aktualizacji (git + npm; utrwalany w konfiguracji).
- `--tag <dist-tag|version|spec>`: nadpisz docelowy pakiet tylko dla tej aktualizacji. W przypadku instalacji pakietowych `main` mapuje się na `github:openclaw/openclaw#main`; specyfikacje źródłowe GitHub/git są pakowane do tymczasowego archiwum tarball przed etapową globalną instalacją npm.
- `--dry-run`: wyświetl podgląd planowanych działań aktualizacji (kanał/tag/cel/przepływ ponownego uruchomienia) bez zapisywania konfiguracji, instalowania, synchronizowania plugins ani ponownego uruchamiania.
- `--json`: wypisz czytelny maszynowo JSON `UpdateRunResult`, w tym
  `postUpdate.plugins.warnings`, gdy uszkodzone lub niemożliwe do załadowania zarządzane plugins wymagają
  naprawy po udanej aktualizacji rdzenia, szczegóły fallbacku plugins kanału beta,
  gdy plugin nie ma wydania beta, oraz `postUpdate.plugins.integrityDrifts`,
  gdy podczas synchronizacji plugins po aktualizacji zostanie wykryty dryf artefaktów npm plugin.
- `--timeout <seconds>`: limit czasu dla każdego kroku (domyślnie 1800 s).
- `--yes`: pomiń monity potwierdzenia (na przykład potwierdzenie downgrade'u).
- `--acknowledge-clawhub-risk`: po przejrzeniu ostrzeżeń zaufania dla społecznościowych wydań ClawHub
  pozwól, aby synchronizacja plugins po aktualizacji była kontynuowana bez interaktywnego
  monitu. Bez tej opcji ryzykowne społecznościowe wydania plugins ClawHub są pomijane i
  pozostają bez zmian, gdy OpenClaw nie może wyświetlić monitu. Oficjalne pakiety ClawHub i
  dołączone źródła OpenClaw plugin omijają ten monit zaufania do wydania.

`openclaw update` nie ma flagi `--verbose`. Użyj `--dry-run`, aby podejrzeć
planowane działania kanału/tagu/instalacji/ponownego uruchomienia, `--json` dla czytelnych maszynowo
wyników oraz `openclaw update status --json`, gdy potrzebujesz tylko szczegółów kanału i
dostępności. Jeśli debugujesz logi Gateway wokół aktualizacji,
szczegółowość konsoli i poziom logowania do pliku są oddzielne: Gateway `--verbose` wpływa na
wyjście terminala/WebSocket, natomiast logi plikowe wymagają `logging.level: "debug"` lub
`"trace"` w konfiguracji. Zobacz [Logowanie Gateway](/pl/gateway/logging).

<Note>
W trybie Nix (`OPENCLAW_NIX_MODE=1`) mutujące uruchomienia `openclaw update` są wyłączone. Zamiast tego zaktualizuj źródło Nix lub wejście flake dla tej instalacji; w przypadku nix-openclaw użyj [Szybkiego startu](https://github.com/openclaw/nix-openclaw#quick-start) z podejściem agent-first. `openclaw update status` i `openclaw update --dry-run` pozostają tylko do odczytu.
</Note>

<Warning>
Downgrade'y wymagają potwierdzenia, ponieważ starsze wersje mogą zepsuć konfigurację.
</Warning>

## `update status`

Pokaż aktywny kanał aktualizacji + tag/branch/SHA git (dla checkoutów źródłowych) oraz dostępność aktualizacji.

```bash
openclaw update status
openclaw update status --json
openclaw update status --timeout 10
```

Opcje:

- `--json`: wypisz czytelny maszynowo JSON statusu.
- `--timeout <seconds>`: limit czasu dla sprawdzeń (domyślnie 3 s).

## `update repair`

Ponownie uruchom finalizację aktualizacji po tym, jak pakiet rdzenia już się zmienił, ale późniejsze
prace naprawcze nie zakończyły się poprawnie. To obsługiwana ścieżka odzyskiwania, gdy
`openclaw update` zainstalował nowy pakiet rdzenia, ale synchronizacja plugins po rdzeniu,
metadane zarządzanych npm plugin, odświeżenie rejestru lub naprawa doctor nadal muszą
osiągnąć zbieżność.

```bash
openclaw update repair
openclaw update repair --channel beta
openclaw update repair --acknowledge-clawhub-risk
openclaw update repair --json
```

Opcje:

- `--channel <stable|beta|dev>`: utrwal kanał aktualizacji przed naprawą i
  uruchom zbieżność plugins względem tego kanału.
- `--json`: wypisz czytelny maszynowo JSON finalizacji.
- `--timeout <seconds>`: limit czasu dla kroków naprawy (domyślnie `1800`).
- `--yes`: pomiń monity potwierdzenia.
- `--acknowledge-clawhub-risk`: po przejrzeniu ostrzeżeń zaufania dla społecznościowych wydań ClawHub
  pozwól, aby zbieżność plugins podczas naprawy była kontynuowana bez
  interaktywnego monitu. Oficjalne pakiety ClawHub i dołączone źródła OpenClaw plugin
  omijają ten monit zaufania do wydania.
- `--no-restart`: akceptowane dla spójności z poleceniem aktualizacji; naprawa nigdy nie uruchamia ponownie
  Gateway.

`openclaw update repair` uruchamia `openclaw doctor --fix`, ponownie ładuje naprawioną
konfigurację i rekordy instalacji, synchronizuje śledzone plugins dla aktywnego kanału aktualizacji,
aktualizuje zarządzane instalacje npm plugin, naprawia brakujące skonfigurowane payloady plugin,
odświeża rejestr plugin i zapisuje zbieżne metadane rekordów instalacji.
Nie instaluje nowego pakietu rdzenia i nie uruchamia ponownie Gateway.

## `update wizard`

Interaktywny przepływ wyboru kanału aktualizacji i potwierdzenia, czy ponownie uruchomić Gateway
po aktualizacji (domyślnie ponowne uruchomienie). Jeśli wybierzesz `dev` bez checkoutu git,
zaoferuje jego utworzenie.

Opcje:

- `--timeout <seconds>`: limit czasu dla każdego kroku aktualizacji (domyślnie `1800`)

## Co robi

Gdy jawnie przełączysz kanały (`--channel ...`), OpenClaw utrzymuje też
zgodność metody instalacji:

- `dev` → zapewnia checkout git (domyślnie: `~/openclaw` albo `$OPENCLAW_HOME/openclaw`, gdy
  ustawiono `OPENCLAW_HOME`; nadpisz przez `OPENCLAW_GIT_DIR`),
  aktualizuje go i instaluje globalne CLI z tego checkoutu.
- `stable` → instaluje z npm przy użyciu `latest`.
- `beta` → preferuje npm dist-tag `beta`, ale cofa się do `latest`, gdy beta jest
  niedostępna albo starsza niż bieżące wydanie stable.

Automatyczny aktualizator rdzenia Gateway (gdy włączony przez konfigurację) uruchamia ścieżkę aktualizacji CLI
poza aktywnym handlerem żądania Gateway. Aktualizacje `update.run` przez płaszczyznę sterowania
dla menedżera pakietów i nadzorowane aktualizacje checkoutu git także używają
przekazania zarządzanej usługi zamiast zastępować drzewo pakietu lub przebudowywać
`dist/` wewnątrz aktywnego procesu Gateway. Gateway uruchamia odłączonego pomocnika,
kończy działanie, a pomocnik uruchamia normalną ścieżkę CLI `openclaw update --yes --json`
spoza drzewa procesu Gateway. Jeśli to przekazanie jest niedostępne,
`update.run` zwraca ustrukturyzowaną odpowiedź z bezpiecznym poleceniem powłoki do
ręcznego uruchomienia.

W przypadku instalacji przez menedżera pakietów `openclaw update` rozwiązuje docelową wersję pakietu
przed wywołaniem menedżera pakietów. Globalne instalacje npm używają instalacji etapowej:
OpenClaw instaluje nowy pakiet w tymczasowym prefiksie npm, weryfikuje
spis spakowanego `dist` w tym miejscu, a następnie podmienia to czyste drzewo pakietu w
rzeczywistym prefiksie globalnym. Jeśli weryfikacja się nie powiedzie, post-update doctor, synchronizacja plugin i
prace ponownego uruchomienia nie są wykonywane z podejrzanego drzewa. Nawet gdy zainstalowana wersja
już pasuje do celu, polecenie odświeża globalną instalację pakietu,
a następnie uruchamia synchronizację plugin, odświeżenie uzupełniania poleceń rdzenia i prace ponownego uruchomienia. To
utrzymuje spakowane komponenty pomocnicze i rekordy plugin należące do kanału w zgodzie z
zainstalowaną kompilacją OpenClaw, pozostawiając pełne przebudowy uzupełniania poleceń plugin
jawnym uruchomieniom `openclaw completion --write-state`.

Gdy lokalna zarządzana usługa Gateway jest zainstalowana, a ponowne uruchomienie jest włączone,
aktualizacje przez menedżera pakietów i checkout git zatrzymują działającą usługę przed
zastąpieniem drzewa pakietu lub mutowaniem checkoutu/wyjścia kompilacji. Następnie aktualizator
odświeża metadane usługi ze zaktualizowanej instalacji, ponownie uruchamia
usługę i weryfikuje ponownie uruchomiony Gateway przed zgłoszeniem
`Gateway: restarted and verified.`. Aktualizacje przez menedżera pakietów dodatkowo weryfikują, że
ponownie uruchomiony Gateway zgłasza oczekiwaną wersję pakietu; aktualizacje checkoutu git
weryfikują kondycję gateway i gotowość usługi po przebudowie. W macOS
sprawdzenie po aktualizacji weryfikuje też, że LaunchAgent jest załadowany/działa dla aktywnego
profilu, a skonfigurowany port local loopback jest zdrowy. Jeśli plist jest zainstalowany,
ale launchd go nie nadzoruje, OpenClaw automatycznie ponownie bootstrapuje LaunchAgent,
a następnie ponownie uruchamia sprawdzenia gotowości kondycji/wersji/kanału. Świeży
bootstrap ładuje zadanie RunAtLoad bezpośrednio, więc odzyskiwanie aktualizacji nie wykonuje
natychmiast `kickstart -k` na nowo uruchomionym Gateway. Jeśli Gateway nadal
nie stanie się zdrowy, polecenie kończy się kodem niezerowym i wypisuje ścieżkę logu ponownego uruchomienia
oraz jawne instrukcje ponownego uruchomienia, ponownej instalacji i rollbacku pakietu. Jeśli ponowne uruchomienie
nie może zostać wykonane, polecenie wypisuje `Gateway: restart skipped (...)` lub
`Gateway: restart failed: ...` ze wskazówką ręcznego `openclaw gateway restart`.
Z `--no-restart` zastąpienie pakietu lub przebudowa git nadal zostaje wykonana, ale
zarządzana usługa nie jest zatrzymywana ani ponownie uruchamiana, więc działający Gateway może zachować stary
kod, dopóki nie uruchomisz go ponownie ręcznie.

### Kształt odpowiedzi płaszczyzny sterowania

Gdy `update.run` jest wywoływane przez płaszczyznę sterowania Gateway w
instalacji przez menedżera pakietów lub nadzorowanym checkoutcie git, handler zgłasza
inicjację przekazania oddzielnie od aktualizacji CLI, która trwa po wyjściu
Gateway:

- `ok: true`, `result.status: "skipped"`,
  `result.reason: "managed-service-handoff-started"` oraz
  `handoff.status: "started"` oznaczają, że Gateway utworzył przekazanie zarządzanej usługi
  i zaplanował własne ponowne uruchomienie, aby odłączony pomocnik mógł uruchomić
  `openclaw update --yes --json` poza aktywnym procesem usługi.
- `ok: false`, `result.reason: "managed-service-handoff-unavailable"` oraz
  `handoff.status: "unavailable"` oznaczają, że OpenClaw nie mógł znaleźć nadzorującej
  granicy usługi i trwałej tożsamości usługi do bezpiecznego przekazania. Na
  przykład przekazanie systemd wymaga tożsamości jednostki OpenClaw
  (`OPENCLAW_SYSTEMD_UNIT`), a nie tylko otaczających znaczników procesu systemd. Odpowiedź
  zawiera `handoff.command`, polecenie powłoki do uruchomienia spoza
  Gateway.
- `ok: false`, `result.reason: "managed-service-handoff-failed"` oznacza, że
  Gateway próbował utworzyć przekazanie, ale nie mógł uruchomić odłączonego pomocnika.

Payload `sentinel` nadal jest zapisywany przed wyjściem Gateway, a przekazanie CLI
aktualizuje ten sam sentinel ponownego uruchomienia po zakończeniu sprawdzeń kondycji
ponownego uruchomienia zarządzanej usługi. Podczas przekazania sentinel może zawierać
`stats.reason: "restart-health-pending"` bez kontynuacji sukcesu; ponownie
uruchomiony Gateway nadal go odpytuje i uruchamia kontynuację dopiero po tym, jak CLI
zweryfikuje kondycję usługi i przepisze sentinel z końcowym wynikiem `ok`.
`openclaw status` i `openclaw status --all` pokazują wiersz `Update restart`,
gdy ten sentinel jest oczekujący lub nieudany, a `update.status` odświeża i
zwraca najnowszy sentinel.

## Przepływ checkoutu git

### Wybór kanału

- `stable`: checkout najnowszy tag inny niż beta, następnie wykonaj build i doctor.
- `beta`: preferuj najnowszy tag `-beta`, ale cofnij się do najnowszego tagu stable, gdy beta jest niedostępna lub starsza.
- `dev`: checkout `main`, następnie pobierz i wykonaj rebase.

### Kroki aktualizacji

<Steps>
  <Step title="Sprawdź czyste drzewo robocze">
    Wymaga braku niezatwierdzonych zmian.
  </Step>
  <Step title="Przełącz kanał">
    Przełącza na wybrany kanał (tag lub gałąź).
  </Step>
  <Step title="Pobierz upstream">
    Tylko dev.
  </Step>
  <Step title="Wstępna kompilacja (tylko dev)">
    Uruchamia kompilację TypeScript w tymczasowym drzewie roboczym. Jeśli końcówka się nie powiedzie, cofa się o maksymalnie 10 commitów, aby znaleźć najnowszy commit, który można skompilować. Ustaw `OPENCLAW_UPDATE_PREFLIGHT_LINT=1`, aby podczas tej weryfikacji wstępnej uruchomić również lint; lint działa w ograniczonym trybie szeregowym, ponieważ hosty aktualizacji użytkowników są często mniejsze niż runnerzy CI.
  </Step>
  <Step title="Rebase">
    Wykonuje rebase na wybrany commit (tylko dev).
  </Step>
  <Step title="Zainstaluj zależności">
    Używa menedżera pakietów repozytorium. W przypadku checkoutów pnpm aktualizator bootstrapuje `pnpm` na żądanie (najpierw przez `corepack`, a potem przez tymczasowy fallback `npm install pnpm@11`) zamiast uruchamiać `npm run build` wewnątrz workspace pnpm.
  </Step>
  <Step title="Zbuduj Control UI">
    Buduje gateway i Control UI.
  </Step>
  <Step title="Uruchom doctor">
    `openclaw doctor` uruchamia się jako końcowa kontrola bezpiecznej aktualizacji.
  </Step>
  <Step title="Synchronizuj pluginy">
    Synchronizuje pluginy z aktywnym kanałem. Dev używa pluginów pakietowanych; stable i beta używają npm. Aktualizuje śledzone instalacje pluginów.
  </Step>
</Steps>

Na kanale aktualizacji beta śledzone instalacje pluginów npm i ClawHub, które podążają
domyślną/najnowszą linią, najpierw próbują wydania pluginu `@beta`. Jeśli plugin nie ma
wydania beta, OpenClaw wraca do zarejestrowanej specyfikacji domyślnej/najnowszej i zgłasza
to jako ostrzeżenie. W przypadku pluginów npm OpenClaw cofa się również wtedy, gdy pakiet
beta istnieje, ale nie przechodzi walidacji instalacji. Te ostrzeżenia o fallbacku pluginów
nie powodują niepowodzenia aktualizacji core. Dokładne wersje i jawne tagi nie są
przepisywane.

<Warning>
Jeśli aktualizacja dokładnie przypiętego pluginu npm zostanie rozwiązana do artefaktu, którego integralność różni się od zapisanego rekordu instalacji, `openclaw update` przerywa aktualizację tego artefaktu pluginu zamiast go instalować. Zainstaluj ponownie lub zaktualizuj plugin jawnie dopiero po zweryfikowaniu, że ufasz nowemu artefaktowi.
</Warning>

<Note>
Niepowodzenia synchronizacji pluginów po aktualizacji, które są ograniczone do zarządzanego pluginu i które ścieżka synchronizacji może ominąć (np. nieosiągalny rejestr npm dla nieistotnego pluginu), są zgłaszane jako ostrzeżenia po powodzeniu aktualizacji core. Wynik JSON zachowuje najwyższy poziom aktualizacji `status: "ok"` i zgłasza `postUpdate.plugins.status: "warning"` z zaleceniami `openclaw update repair` oraz `openclaw plugins inspect <id> --runtime --json`. Nieoczekiwane wyjątki aktualizatora lub synchronizacji nadal powodują niepowodzenie wyniku aktualizacji. Napraw błąd instalacji lub aktualizacji pluginu, a następnie ponownie uruchom `openclaw update repair`.

Po kroku synchronizacji dla każdego pluginu `openclaw update` uruchamia obowiązkowe przejście **post-core convergence** przed ponownym uruchomieniem gateway: naprawia brakujące skonfigurowane ładunki pluginów, waliduje każdy _aktywny_ śledzony rekord instalacji na dysku i statycznie sprawdza, czy jego `package.json` da się sparsować (oraz czy istnieje dowolny jawnie zadeklarowany `main`). Niepowodzenia z tego przejścia — oraz nieprawidłowy snapshot konfiguracji OpenClaw — zwracają `postUpdate.plugins.status: "error"` i przełączają najwyższy poziom aktualizacji `status` na `"error"`, więc `openclaw update` kończy się kodem niezerowym, a gateway _nie_ zostaje ponownie uruchomiony z niezweryfikowanym zestawem pluginów. Błąd zawiera ustrukturyzowane wiersze `postUpdate.plugins.warnings[].guidance` wskazujące `openclaw update repair` i `openclaw plugins inspect <id> --runtime --json` jako dalsze kroki. Wyłączone wpisy pluginów i rekordy, które nie są oficjalnymi celami synchronizacji połączonymi z zaufanym źródłem, są tutaj pomijane, zgodnie z polityką `skipDisabledPlugins` używaną przez kontrolę brakującego ładunku, więc nieaktualny rekord wyłączonego pluginu nie może zablokować poza tym poprawnej aktualizacji.

Gdy zaktualizowany Gateway startuje, ładowanie pluginów odbywa się wyłącznie w trybie weryfikacji: start nie
uruchamia menedżerów pakietów ani nie mutuje drzew zależności. Ponowne uruchomienia `update.run`
menedżera pakietów są przekazywane do ścieżki usługi zarządzanej CLI, więc podmiana pakietu odbywa się
poza starym procesem Gateway, a kontrole kondycji usługi decydują, czy
aktualizację można zgłosić jako ukończoną.

Jeśli bootstrap pnpm nadal się nie powiedzie, aktualizator zatrzymuje się wcześnie z błędem specyficznym dla menedżera pakietów zamiast próbować `npm run build` wewnątrz checkoutu.
</Note>

## Skrót `--update`

`openclaw --update` jest przepisywane na `openclaw update` (przydatne dla powłok i skryptów uruchamiających).

## Powiązane

- `openclaw doctor` (proponuje najpierw uruchomienie aktualizacji w checkoutach git)
- [Kanały deweloperskie](/pl/install/development-channels)
- [Aktualizowanie](/pl/install/updating)
- [Referencja CLI](/pl/cli)
