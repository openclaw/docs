---
read_when:
    - Masz problemy z łącznością lub uwierzytelnianiem i potrzebujesz wskazówek dotyczących ich rozwiązania
    - Wprowadzono aktualizację i potrzebna jest szybka kontrola poprawności
summary: Dokumentacja CLI dla `openclaw doctor` (kontrole stanu + naprawy z instrukcjami)
title: Diagnostyka
x-i18n:
    generated_at: "2026-07-16T18:10:35Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 322af63f52a3d864e46da332353ca921a4462e13fa849986d936524759f80ccc
    source_path: cli/doctor.md
    workflow: 16
---

# `openclaw doctor`

Kontrole kondycji i szybkie poprawki dla Gateway, kanałów, pluginów, Skills, routingu modeli, stanu lokalnego i migracji konfiguracji. Należy ich używać, gdy coś nie działa zgodnie z oczekiwaniami i potrzebne jest jedno polecenie wyjaśniające problem.

Powiązane:

- Rozwiązywanie problemów: [Rozwiązywanie problemów](/pl/gateway/troubleshooting)
- Audyt bezpieczeństwa: [Bezpieczeństwo](/pl/gateway/security)

## Tryby działania

Doctor ma pięć trybów działania:

| Tryb działania            | Polecenie                                 | Zachowanie                                                                      |
| ------------------------- | ----------------------------------------- | ------------------------------------------------------------------------------- |
| Inspekcja                 | `openclaw doctor`                         | Kontrole przeznaczone dla człowieka i interaktywne wskazówki.                   |
| Naprawa                   | `openclaw doctor --fix`                   | Stosuje obsługiwane naprawy, używając monitów, chyba że naprawa nieinteraktywna jest bezpieczna. |
| Lint                      | `openclaw doctor --lint`                  | Ustrukturyzowane ustalenia tylko do odczytu dla CI, kontroli wstępnych i bramek przeglądu. |
| Konserwacja współdzielonej bazy SQLite | `openclaw doctor --state-sqlite compact`  | Jawnie tworzy punkt kontrolny, kompaktuje i weryfikuje kanoniczną współdzieloną bazę danych stanu. |
| Migracja sesji SQLite     | `openclaw doctor --session-sqlite <mode>` | Sprawdza, importuje, weryfikuje, kompaktuje, odzyskuje lub przywraca stan sesji. |

Należy preferować `--lint`, gdy automatyzacja wymaga stabilnego wyniku. Należy preferować `--fix`, gdy operator chce, aby doctor zmodyfikował konfigurację lub stan.

## Przykłady

```bash
openclaw doctor
openclaw doctor --lint
openclaw doctor --lint --json
openclaw doctor --lint --severity-min warning
openclaw doctor --lint --all
openclaw doctor --lint --allow-exec
openclaw doctor --deep
openclaw doctor --fix
openclaw doctor --fix --non-interactive
openclaw doctor --generate-gateway-token
openclaw doctor --post-upgrade
openclaw doctor --post-upgrade --json
openclaw doctor --state-sqlite compact
openclaw doctor --state-sqlite compact --json
openclaw doctor --session-sqlite inspect --session-sqlite-all-agents
openclaw doctor --session-sqlite dry-run --session-sqlite-agent main --json
openclaw doctor --session-sqlite import --session-sqlite-all-agents
openclaw doctor --session-sqlite validate --session-sqlite-all-agents --json
openclaw doctor --session-sqlite compact --session-sqlite-all-agents
openclaw doctor --session-sqlite recover --github-issue
openclaw doctor --session-sqlite restore --session-sqlite-all-agents
```

W przypadku uprawnień specyficznych dla kanału należy używać sond kanałów zamiast `doctor`:

```bash
openclaw channels capabilities --channel discord --target channel:<channel-id>
openclaw channels status --probe
```

`channels capabilities` zgłasza efektywne uprawnienia bota dla określonego kanału docelowego. `channels status --probe` audytuje wszystkie skonfigurowane kanały i docelowe kanały automatycznego dołączania głosowego.

## Opcje

| Opcja                           | Efekt                                                                                                                                                                                   |
| ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--no-workspace-suggestions`    | Wyłącza sugestie dotyczące pamięci i wyszukiwania w przestrzeni roboczej.                                                                                                                |
| `--yes`                         | Akceptuje wartości domyślne bez wyświetlania monitów.                                                                                                                                    |
| `--repair` / `--fix`            | Stosuje zalecane naprawy niezwiązane z usługami bez wyświetlania monitów (`--fix` jest aliasem). Instalacje lub ponowne zapisywanie usługi Gateway nadal wymagają interaktywnego potwierdzenia albo jawnych poleceń `gateway`. |
| `--force`                       | Stosuje agresywne naprawy, w tym nadpisywanie niestandardowej konfiguracji usługi.                                                                                                       |
| `--non-interactive`             | Działa bez monitów; tylko bezpieczne migracje i naprawy niezwiązane z usługami.                                                                                                          |
| `--generate-gateway-token`      | Generuje i konfiguruje token Gateway.                                                                                                                                                    |
| `--allow-exec`                  | Zezwala doctorowi na wykonywanie skonfigurowanych `exec` SecretRefs podczas weryfikowania sekretów.                                                                                 |
| `--deep`                        | Skanuje usługi systemowe pod kątem dodatkowych instalacji Gateway; zgłasza niedawne przekazania ponownego uruchomienia nadzorcy Gateway.                                                  |
| `--lint`                        | Uruchamia zmodernizowane kontrole kondycji w trybie tylko do odczytu i generuje ustalenia diagnostyczne.                                                                                  |
| `--post-upgrade`                | Uruchamia testy zgodności pluginów po aktualizacji; ustalenia trafiają na standardowe wyjście; kod zakończenia 1, jeśli występuje jakiekolwiek ustalenie na poziomie błędu.                |
| `--state-sqlite <mode>`         | Uruchamia jawną konserwację współdzielonego stanu SQLite. Jedynym trybem jest `compact`.                                                                                               |
| `--session-sqlite <mode>`       | Uruchamia docelowy tryb migracji sesji SQLite: `inspect`, `dry-run`, `import`, `validate`, `compact`, `recover` lub `restore`.                                                         |
| `--session-sqlite-store <path>` | Z `--session-sqlite`: wybiera jedną starszą ścieżkę magazynu `sessions.json`.                                                                                                                |
| `--session-sqlite-agent <id>`   | Z `--session-sqlite`: wybiera jednego skonfigurowanego agenta.                                                                                                                           |
| `--session-sqlite-all-agents`   | Z `--session-sqlite`: wybiera skonfigurowane i wykryte magazyny agentów.                                                                                                                 |
| `--github-issue`                | Z `--session-sqlite recover`: przygotowuje oczyszczone zgłoszenie problemu w openclaw/openclaw; doctor tworzy je za pomocą `gh` po `--yes` lub interaktywnym potwierdzeniu.         |
| `--json`                        | Z `--lint`: ustalenia w formacie JSON. Z `--post-upgrade`: `{ probesRun, findings }`. Z `--state-sqlite` lub `--session-sqlite`: raport konserwacji w formacie JSON.                    |
| `--severity-min <level>`        | Z `--lint`: pomija ustalenia poniżej poziomu `info`, `warning` lub `error`.                                                                                                                 |
| `--all`                         | Z `--lint`: uruchamia wszystkie zarejestrowane kontrole, w tym kontrole opcjonalne wykluczone z zestawu domyślnego.                                                                     |
| `--skip <id>`                   | Z `--lint`: pomija identyfikator kontroli. Opcję można powtarzać.                                                                                                                        |
| `--only <id>`                   | Z `--lint`: uruchamia tylko podane identyfikatory kontroli. Opcję można powtarzać.                                                                                                      |

`--severity-min`, `--all`, `--only` i `--skip` są akceptowane wyłącznie razem z `--lint`; `--json` jest akceptowane z `--lint`, `--post-upgrade`, `--state-sqlite` i `--session-sqlite`.

## Tryb lint

`openclaw doctor --lint` działa tylko do odczytu: bez monitów, napraw ani ponownego zapisywania konfiguracji lub stanu.

```bash
openclaw doctor --lint
openclaw doctor --lint --severity-min warning
openclaw doctor --lint --json
openclaw doctor --lint --all
openclaw doctor --lint --allow-exec
openclaw doctor --lint --only core/doctor/gateway-config --json
openclaw doctor --lint --only core/doctor/local-audio-acceleration --severity-min info
```

Dane wyjściowe dla człowieka są zwięzłe:

```text
doctor --lint: uruchomiono 6 kontroli, liczba ustaleń: 1
  [warning] core/doctor/gateway-config gateway.mode - gateway.mode nie jest ustawione; uruchomienie Gateway zostanie zablokowane.
    poprawka: Uruchom `openclaw configure` i ustaw tryb Gateway (local/remote) albo użyj `openclaw config set gateway.mode local`.
```

Dane wyjściowe JSON stanowią interfejs dla skryptów:

```json
{
  "ok": false,
  "checksRun": 5,
  "checksSkipped": 0,
  "findings": [
    {
      "checkId": "core/doctor/gateway-config",
      "severity": "warning",
      "message": "gateway.mode nie jest ustawione; uruchomienie Gateway zostanie zablokowane.",
      "path": "gateway.mode",
      "fixHint": "Uruchom `openclaw configure` i ustaw tryb Gateway (local/remote) albo użyj `openclaw config set gateway.mode local`."
    }
  ]
}
```

Kody zakończenia:

| Kod | Znaczenie                                                     |
| ---- | ------------------------------------------------------------- |
| `0`  | Brak ustaleń na wybranym progu istotności lub powyżej niego.   |
| `1`  | Co najmniej jedno ustalenie osiąga wybrany próg.               |
| `2`  | Błąd polecenia lub środowiska wykonawczego przed wygenerowaniem ustaleń lint. |

`--severity-min` określa zarówno wyświetlane ustalenia, jak i próg zakończenia: `openclaw doctor --lint --severity-min error` może niczego nie wyświetlić i zakończyć działanie kodem `0`, nawet jeśli istnieją ustalenia `info`/`warning` o niższej istotności.

`--all` określa, które kontrole są wybierane przed filtrowaniem według istotności. Domyślne uruchomienie lint wyklucza kontrole głębokie, historyczne lub bardziej skłonne do wykrywania możliwych do naprawienia pozostałości starszych wersji; pełny wykaz można uzyskać za pomocą `--all`. `--only <id>` jest najbardziej precyzyjnym selektorem i może uruchomić dowolną zarejestrowaną kontrolę według identyfikatora.

`core/doctor/local-audio-acceleration` zgłasza automatycznie wybrane lokalne polecenie STT, osobne dowody dotyczące obsługiwanego, żądanego i zaobserwowanego backendu oraz kolejność mechanizmów rezerwowych bez ładowania modelu rozpoznawania mowy. Generuje ustalenie informacyjne, dlatego aby je wyświetlić, należy uwzględnić `--severity-min info`.

## Ustrukturyzowane kontrole kondycji

Nowoczesne kontrole doctor używają niewielkiego, rozdzielonego kontraktu:

```ts
detect(ctx, scope?) -> HealthFinding[]
repair?(ctx, findings) -> HealthRepairResult
```

`detect()` obsługuje `doctor --lint`. `repair()` jest opcjonalne i działa tylko w ramach `doctor --fix` / `doctor --repair`. Kontrole, które nie zostały jeszcze zmigrowane do tej postaci, nadal korzystają ze starszego przepływu rozszerzeń doctor.

Konteksty naprawy mogą zawierać żądania `dryRun`/`diff`; wyniki naprawy mogą zwracać ustrukturyzowane `diffs` (zmiany konfiguracji/plików) i `effects` (efekty uboczne dotyczące usług, procesów, pakietów, stanu lub innych elementów), dzięki czemu przekonwertowane kontrole mogą ewoluować w kierunku `doctor --fix --dry-run` bez przenoszenia planowania modyfikacji do `detect()`.

`repair()` zgłasza `status: "repaired" | "skipped" | "failed"` (pominięty status oznacza `repaired`). Gdy naprawa zwraca `skipped` lub `failed`, doctor zgłasza przyczynę i pomija walidację tego sprawdzenia. Po udanej naprawie doctor ponownie uruchamia `detect()` w zakresie naprawionych ustaleń; jeśli ustalenie nadal występuje, doctor zgłasza ostrzeżenie o naprawie, zamiast uznać zmianę za zakończoną.

Ustalenie zawiera:

| Pole              | Przeznaczenie                                           |
| ----------------- | ------------------------------------------------------ |
| `checkId`         | Stabilny identyfikator dla filtrów pomijania/wyłączności i list dozwolonych w CI. |
| `severity`        | `info`, `warning` lub `error`.                         |
| `message`         | Czytelny dla człowieka opis problemu.                   |
| `path`            | Ścieżka konfiguracji, pliku lub ścieżka logiczna, jeśli jest dostępna. |
| `line` / `column` | Lokalizacja źródłowa, jeśli jest dostępna.              |
| `ocPath`          | Dokładny adres `oc://`, jeśli sprawdzenie może go wskazać. |
| `fixHint`         | Sugerowane działanie operatora lub podsumowanie naprawy. |

Zmodernizowane podstawowe sprawdzenia doctor pozostają dołączone do uporządkowanego wkładu doctor, który odpowiada za ich zachowanie `doctor` / `doctor --fix` przeznaczone dla człowieka. Wspólny rejestr ustrukturyzowanego stanu jest punktem rozszerzeń: sprawdzenia wbudowane i obsługiwane przez pluginy są uruchamiane po podstawowych sprawdzeniach doctor, gdy ich pakiet właścicielski zarejestruje je w aktywnej ścieżce polecenia. `openclaw/plugin-sdk/health` udostępnia ten sam kontrakt autorom pluginów.

## Wybór sprawdzeń

```bash
openclaw doctor --lint --only core/doctor/gateway-config --json
openclaw doctor --lint --skip core/doctor/skills-readiness
openclaw doctor --lint --all --skip core/doctor/session-locks
```

`--only` i `--skip` przyjmują pełne identyfikatory sprawdzeń i mogą być podawane wielokrotnie. Jeśli identyfikator `--only` nie jest zarejestrowany, dla tego identyfikatora nie zostanie uruchomione żadne sprawdzenie; użyj `checksRun`/`checksSkipped` w danych wyjściowych, aby potwierdzić, że ukierunkowana bramka wybiera oczekiwane sprawdzenia.

## Tryb po aktualizacji

`openclaw doctor --post-upgrade` uruchamia testy zgodności pluginów przeznaczone do łączenia w sekwencję po kompilacji lub aktualizacji. Ustalenia trafiają na standardowe wyjście; kod wyjścia wynosi 1, jeśli którekolwiek ustalenie ma `level: "error"`. Dodaj `--json`, aby uzyskać kopertę czytelną maszynowo (`{ probesRun, findings }`), odpowiednią dla CI, społecznościowej umiejętności `fork-upgrade` i innych narzędzi do testów dymnych po aktualizacji. Jeśli indeks zainstalowanych pluginów nie istnieje lub jest nieprawidłowy, tryb JSON nadal emituje kopertę z ustaleniem błędu `plugin.index_unavailable`.

Uruchamianie obrazu kontenera stanowi wyjątek od zwykłego przepływu „uruchom doctor po
aktualizacji”. Gdy `openclaw gateway run` uruchamia się z nową wersją OpenClaw,
przed zgłoszeniem gotowości wykonuje bezpieczne naprawy stanu i pluginów. Jeśli naprawy nie można
bezpiecznie ukończyć, proces uruchamiania kończy działanie i informuje, aby jednorazowo uruchomić ten sam obraz z
`openclaw doctor --fix` względem tego samego zamontowanego stanu/konfiguracji, a następnie
normalnie ponownie uruchomić kontener.

## Compaction współdzielonego stanu SQLite

`openclaw doctor --state-sqlite compact` to jawna konserwacja offline
kanonicznej bazy danych współdzielonego stanu w
`<state-dir>/state/openclaw.sqlite`. Nie przyjmuje dowolnej ścieżki
bazy danych, nigdy nie jest wywoływana podczas normalnego działania Gateway i nie stanowi części
`openclaw doctor --fix`. Polecenie uzyskuje tę samą blokadę własności stanu co
uruchamianie Gateway i utrzymuje ją podczas walidacji, tworzenia punktu kontrolnego, `VACUUM` oraz
końcowych kontroli integralności. Odmawia działania, gdy Gateway lub inne
polecenie konserwacji SQLite jest właścicielem tej blokady. Blokada stanu pozostaje aktywna, gdy
`OPENCLAW_ALLOW_MULTI_GATEWAY=1` pomija singleton Gateway dla danej konfiguracji, dzięki czemu
powłoka operatora nie musi dziedziczyć środowiska usługi Gateway, aby
konserwacja mogła ją wykryć.

Najpierw zatrzymaj Gateway i utwórz zweryfikowaną kopię zapasową:

```bash
openclaw gateway stop
openclaw backup create --verify
openclaw doctor --state-sqlite compact --json
openclaw gateway start
```

Polecenie:

1. Wymaga zwykłego pliku w kanonicznej ścieżce współdzielonego stanu. Brakująca
   baza danych jest zgłaszana jako `skipped`, a polecenie kończy się powodzeniem.
2. Weryfikuje aktualnie obsługiwaną wersję schematu oraz
   `schema_meta.role = "global"` przed utworzeniem punktu kontrolnego lub zmianą pliku.
3. Wymaga niezajętego `wal_checkpoint(TRUNCATE)`. Jeśli punkt kontrolny jest zajęty, zatrzymaj wszystkie pozostałe procesy OpenClaw
   i spróbuj ponownie.
4. Ustawia `auto_vacuum` na `INCREMENTAL`, wykonuje pełne `VACUUM` i ponownie tworzy
   punkt kontrolny.
5. Uruchamia `quick_check`, `integrity_check` i `foreign_key_check`, a następnie
   ponownie stosuje uprawnienia tylko dla właściciela do bazy danych i plików pomocniczych SQLite.

Dane wyjściowe JSON przedstawiają rozmiary bazy danych i WAL, strony listy wolnych stron, rozmiar strony oraz
wartość `auto_vacuum` przed i po Compaction, a także liczbę odzyskanych bajtów i wyniki
`quick_check` oraz `integrity_check`. `foreign_key_check` jest egzekwowane
w trybie bezpiecznej odmowy i nie ma osobnego pola powodzenia. SQLite zgłasza `auto_vacuum` jako
`0` dla braku, `1` dla pełnego oraz `2` dla przyrostowego.

Compaction kończy się niepowodzeniem bez wprowadzania zmian, gdy schemat jest stary, nowszy niż
uruchomiona kompilacja OpenClaw lub należy do bazy danych agenta. W przypadku starszego schematu współdzielonego stanu
najpierw uruchom `openclaw doctor --fix`. W przypadku nowszego schematu przywróć
zgodną kopię zapasową lub zaktualizuj OpenClaw.

## Migracja SQLite sesji

OpenClaw automatycznie importuje starsze wiersze sesji i historię transkrypcji do
bazy danych SQLite każdego agenta podczas uruchamiania Gateway oraz podczas
`openclaw doctor --fix`. `openclaw doctor --session-sqlite <mode>` jest
narzędziem do ukierunkowanej inspekcji i walidacji tej migracji. Bieżące wiersze sesji środowiska wykonawczego
znajdują się w
`~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`. Starsze
pliki `sessions.json` są źródłami migracji. Aktywne pliki JSONL transkrypcji są
importowane i archiwizowane poza aktywnym katalogiem sesji po pomyślnym
imporcie; pliki JSONL warstwy archiwalnej pozostają artefaktami pomocy technicznej, a nie
mechanizmami rezerwowymi środowiska wykonawczego.

Tryby:

| Tryb       | Zachowanie                                                                                                             |
| ---------- | ---------------------------------------------------------------------------------------------------------------------- |
| `inspect`  | Odczytuje liczbę starszych rekordów i rekordów SQLite oraz nieprzywoływane pliki JSONL bez importowania.               |
| `dry-run`  | Analizuje starsze wpisy i pliki JSONL transkrypcji, zlicza wiersze możliwe do zaimportowania i zgłasza problemy bez zapisywania wierszy SQLite. |
| `import`   | Importuje starsze wpisy i zdarzenia transkrypcji do SQLite dla wybranych celów.                                        |
| `validate` | Porównuje wybrane starsze źródła z wierszami SQLite i liczbą zdarzeń transkrypcji.                                      |
| `compact`  | Tworzy punkt kontrolny i wykonuje VACUUM wybranych baz danych SQLite agentów, aby odzyskać wolne strony po dużych usunięciach lub czyszczeniu archiwum. |
| `recover`  | Przywraca najnowsze nieudane uruchomienie migracji, weryfikuje jego cele i przygotowuje oczyszczony raport zgłoszenia GitHub. |
| `restore`  | Przywraca zarchiwizowane artefakty transkrypcji z zapisanych manifestów migracji bez usuwania danych SQLite.            |

Selektory:

- Domyślnie: skonfigurowany domyślny magazyn agenta, jeśli istnieje plik tego starszego magazynu.
- `--session-sqlite-agent <id>`: jeden skonfigurowany agent.
- `--session-sqlite-all-agents`: skonfigurowane magazyny agentów oraz wykryte magazyny agentów.
- `--session-sqlite-store <path>`: jedna jawna ścieżka starszego `sessions.json`.

Sekwencja ręcznej inspekcji:

```bash
openclaw doctor --session-sqlite inspect --session-sqlite-all-agents
openclaw doctor --session-sqlite dry-run --session-sqlite-all-agents --json
openclaw doctor --session-sqlite import --session-sqlite-all-agents
openclaw doctor --session-sqlite validate --session-sqlite-all-agents --json
openclaw doctor --session-sqlite compact --session-sqlite-all-agents
openclaw doctor --session-sqlite recover --github-issue
```

Przed uruchomieniem `import` w instalacji z
ważną historią utwórz kopię zapasową katalogu stanu OpenClaw. `validate` kończy działanie kodem różnym od zera, gdy wybranego starszego wpisu
brakuje w SQLite, identyfikator sesji jest inny lub liczba zdarzeń transkrypcji jest inna.
Podczas korzystania z `--session-sqlite-store <path>` sprawdź, czy raport zawiera
oczekiwaną liczbę celów; nieistniejąca jawna ścieżka magazynu nie wybiera żadnych celów.

Usunięcia w SQLite najpierw odzyskują strony wewnątrz bazy danych; nie muszą
natychmiast zmniejszać pliku bazy danych. Po usunięciu lub zarchiwizowaniu dużych
transkrypcji uruchom `openclaw doctor --session-sqlite compact --session-sqlite-all-agents`,
aby utworzyć punkty kontrolne plików WAL, uruchomić `VACUUM` oraz zgłosić rozmiary bazy danych i WAL
przed operacją i po niej. Compaction wymaga zwykłego pliku z bieżącym schematem agenta,
trwałymi metadanymi właściciela wybranego agenta oraz bez otwartego uchwytu w procesie
doctor. Destrukcyjne tryby `import`, `compact`, `recover` i `restore`
utrzymują tę samą blokadę własności stanu co uruchamianie Gateway przez cały czas działania;
`inspect`, `dry-run` i `validate` pozostają tylko do odczytu i jej nie uzyskują. Najpierw zatrzymaj
Gateway. Tryby destrukcyjne kończą się niepowodzeniem, zamiast konkurować z aktywnymi zapisami lub
innym poleceniem konserwacji. Cel destruktywnego trybu `--session-sqlite-store`
musi znajdować się w aktywnym katalogu stanu; przed konserwacją innej instalacji ustaw `OPENCLAW_STATE_DIR` na
katalog stanu będący właścicielem magazynu.
Istniejące cele połączone dowiązaniami twardymi są odrzucane, ponieważ inna ścieżka może współdzielić
ten sam i-węzeł bazy danych poza zablokowanym katalogiem stanu. Te same kontrole
własności obejmują pliki pomocnicze WAL SQLite, pamięci współdzielonej i dziennika wycofywania.

Każdy import zapisuje manifest w
`~/.openclaw/session-sqlite-migration-runs/` przed przeniesieniem artefaktów transkrypcji
do archiwum. Jeśli uruchamianie zgłosi nieudaną migrację SQLite sesji po
przeniesieniu artefaktów, uruchom odzyskiwanie:

```bash
openclaw doctor --session-sqlite recover --github-issue
```

Odzyskiwanie wybiera najnowszy manifest nieudanej migracji, przywraca wyłącznie
zarchiwizowane artefakty manifestu, weryfikuje objęte nim cele, odświeża
oczyszczone raporty `.failure.md` i `.failure.json` oraz przygotowuje treść zgłoszenia GitHub,
która nie zawiera treści transkrypcji, surowego środowiska, sekretów ani nieograniczonej
konfiguracji. Gdy nie istnieje manifest nieudanej migracji, ale wybrana baza danych SQLite
agenta jest uszkodzona, nie jest bazą danych albo ma pliki pomocnicze dziennika bez głównej
bazy danych, odzyskiwanie kopiuje kompletny zestaw plików do tymczasowego katalogu
inspekcji. SQLite może wycofać prawidłowy aktywny dziennik w tej jednorazowej kopii
przed uruchomieniem `quick_check`, `integrity_check` i `foreign_key_check`, podczas gdy
oryginalne pliki śledcze pozostają nietknięte. Nieudane kontrole integralności lub osierocone
pliki pomocnicze zachowują pliki DB, WAL, SHM i dziennika wycofywania przez zmianę nazwy
całego wykrytego zestawu przy użyciu jednego sufiksu `.corrupt-<timestamp>`. Przechwycona awaria
zmiany nazwy wycofuje przeniesienie już przeniesionych plików przed zgłoszeniem niepowodzenia, dzięki czemu
możliwy do odzyskania zestaw plików nie zostaje po cichu rozdzielony. Przed odzyskiwaniem zatrzymaj Gateway;
kopiowanie lub zmiana nazw aktywnie zmieniającego się zestawu plików SQLite jest niebezpieczna i zachowuje się
odmiennie w różnych systemach operacyjnych. Z `--github-issue --yes` doctor używa
CLI GitHub do utworzenia zgłoszenia w `openclaw/openclaw`; bez potwierdzenia
zapisuje lokalny raport pomocy technicznej i wyświetla wstępnie wypełniony adres URL zgłoszenia.

`restore` pozostaje operacją cofania niższego poziomu. Używa rekordów
`sourcePath -> archivePath` manifestu, przenosi zarchiwizowane artefakty z powrotem tylko wtedy, gdy
brakuje oryginalnej ścieżki, zgłasza konflikty, gdy istnieją obie ścieżki, i pozostawia
bazę danych SQLite na miejscu.

### Obniżanie wersji po migracji SQLite sesji

Przed uruchomieniem starszej, opartej na plikach wersji OpenClaw przywróć zarchiwizowane
starsze artefakty transkrypcji:

```bash
openclaw doctor --session-sqlite restore --session-sqlite-all-agents
```

Starsze wersje odczytują wpisy `sessions.json` oraz ścieżki `sessionFile` zapisane
w tych wpisach. Po migracji do SQLite pomyślne importy przenoszą aktywne transkrypcje JSONL
do `session-sqlite-import-archive/`, dlatego starsze środowisko wykonawcze nie może
zobaczyć tej historii, dopóki przywracanie nie przeniesie artefaktów zapisanych w manifeście z powrotem do
ich pierwotnych ścieżek.

Przywracanie nie usuwa danych SQLite. Sesje utworzone po przejściu na SQLite
istnieją tylko w SQLite i nie będą widoczne dla starszego środowiska wykonawczego. Jeśli później
ponownie przeprowadzisz aktualizację, uruchom opisaną powyżej standardową sekwencję walidacji migracji, aby OpenClaw mógł
porównać przywrócone starsze artefakty z wierszami SQLite przed importem.

## Uwagi

- W trybie Nix (`OPENCLAW_NIX_MODE=1`) kontrole narzędzia doctor tylko do odczytu nadal działają, ale `doctor --fix`, `doctor --repair`, `doctor --yes` i `doctor --generate-gateway-token` są wyłączone, ponieważ `openclaw.json` jest niezmienny. Zamiast tego należy edytować źródło Nix tej instalacji; w przypadku nix-openclaw należy skorzystać z przewodnika [Szybki start](https://github.com/openclaw/nix-openclaw#quick-start), rozpoczynając od agenta.
- Interaktywne monity (poprawki pęku kluczy/OAuth itp.) są uruchamiane tylko wtedy, gdy standardowe wejście jest terminalem TTY, a `--non-interactive` **nie** jest ustawiona. Uruchomienia bez interfejsu (Cron, Telegram, bez terminala) pomijają monity.
- Nieinteraktywne uruchomienia `doctor` pomijają wyprzedzające ładowanie pluginów, dzięki czemu kontrole kondycji bez interfejsu pozostają szybkie. Sesje interaktywne nadal ładują powierzchnie pluginów wymagane przez starszy przepływ kontroli kondycji i naprawy.
- `--lint` jest bardziej rygorystyczne niż `--non-interactive`: zawsze działa tylko do odczytu, nigdy nie wyświetla monitów ani nie stosuje bezpiecznych migracji. Aby narzędzie doctor wprowadziło zmiany, należy użyć `doctor --fix` lub `doctor --repair`.
- Narzędzie doctor domyślnie nie wykonuje SecretRefs `exec` podczas sprawdzania sekretów. Opcji `--allow-exec` (z `--lint` lub bez niej) należy używać tylko wtedy, gdy celowo chce się, aby narzędzie doctor uruchomiło skonfigurowane mechanizmy rozpoznawania sekretów.
- Każdy zapis konfiguracji (w tym naprawa `--fix`) rotuje kopię zapasową do `~/.openclaw/openclaw.json.bak` (z numerowanym pierścieniem `.bak.1`..`.bak.4`). `--fix` usuwa również nieznane klucze konfiguracji zgłoszone przez walidację schematu, wymieniając każde usunięcie; pomija to podczas trwającej aktualizacji, aby częściowo zapisany stan aktualizacji nie został usunięty przed zakończeniem jego migracji.
- Należy ustawić `OPENCLAW_SERVICE_REPAIR_POLICY=external`, gdy inny nadzorca zarządza cyklem życia Gateway. Narzędzie doctor nadal raportuje kondycję Gateway/usługi i stosuje naprawy niezwiązane z usługą, ale pomija instalowanie, uruchamianie, ponowne uruchamianie i inicjowanie usługi oraz czyszczenie starszych usług.
- W systemie Linux narzędzie doctor ignoruje nieaktywne dodatkowe jednostki systemd podobne do Gateway i podczas naprawy nie przepisuje metadanych polecenia/punktu wejścia działającej usługi Gateway w systemd. Najpierw należy zatrzymać usługę albo użyć `openclaw gateway install --force`, aby zastąpić aktywny program uruchamiający.
- `doctor --fix --non-interactive` raportuje brakujące lub nieaktualne definicje usługi Gateway, ale nie instaluje ich ani nie przepisuje poza trybem naprawy aktualizacji. W przypadku brakującej usługi należy uruchomić `openclaw gateway install`, a aby zastąpić program uruchamiający — `openclaw gateway install --force`.
- Kontrole integralności stanu wykrywają osierocone pliki transkrypcji w katalogu sesji. Zarchiwizowanie ich jako `.deleted.<timestamp>` wymaga interaktywnego potwierdzenia; `--fix`, `--yes` i uruchomienia bez interfejsu pozostawiają je na miejscu.
- Narzędzie doctor skanuje `~/.openclaw/cron/jobs.json` (lub `cron.store`) w poszukiwaniu starszych formatów zadań Cron i przepisuje je przed zaimportowaniem kanonicznych wierszy do SQLite.
- Narzędzie doctor raportuje zadania Cron z jawnym nadpisaniem `payload.model`, w tym liczbę przestrzeni nazw dostawców i niezgodności z `agents.defaults.model`, dzięki czemu zaplanowane zadania, które nie dziedziczą modelu domyślnego, są widoczne podczas analiz uwierzytelniania lub rozliczeń.
- Narzędzie doctor raportuje zadania Cron nadal oznaczone jako wykonywane (`state.runningAtMs`), przez co `openclaw cron list` może wyświetlać je jako `running`. Ta kontrola działa tylko do odczytu: jeśli żaden Gateway nie wykonuje obecnie oznaczonego zadania, następne uruchomienie usługi Cron zapisze przerwane wykonanie i usunie znacznik.
- W systemie Linux narzędzie doctor ostrzega, gdy crontab użytkownika nadal uruchamia nieutrzymywane starsze `~/.openclaw/bin/ensure-whatsapp.sh`, które może błędnie raportować `Gateway inactive`, gdy Cron nie ma środowiska magistrali użytkownika systemd.
- Gdy WhatsApp jest włączony, narzędzie doctor sprawdza, czy pętla zdarzeń Gateway nie działa w trybie ograniczonym, gdy nadal działają lokalni klienci `openclaw-tui`. `doctor --fix` zatrzymuje wyłącznie zweryfikowanych lokalnych klientów TUI, aby odpowiedzi WhatsApp nie były kolejkowane za nieaktualnymi pętlami odświeżania TUI.
- Narzędzie doctor przepisuje starsze odwołania do modeli `codex/*` i `openai-codex/*` na kanoniczne odwołania `openai/*` w modelach podstawowych, modelach rezerwowych, listach dozwolonych modeli, modelach generowania obrazów/filmów, nadpisaniach Heartbeat/podagentów/Compaction, hakach, nadpisaniach modeli kanałów, ładunkach Cron oraz nieaktualnych przypięciach tras sesji/transkrypcji. `--fix` bezpiecznie scala również starszą konfigurację `models.providers.codex` i `models.providers.openai-codex`, migruje starsze profile uwierzytelniania `openai-codex:*` i wpisy `auth.order.openai-codex` do `openai:*`, przenosi intencję Codex do wpisów `agentRuntime.id: "codex"` o zakresie dostawcy/modelu, usuwa nieaktualne przypięcia środowiska wykonawczego całego agenta/sesji i zachowuje naprawione odwołania agentów OpenAI w routingu uwierzytelniania Codex zamiast bezpośredniego uwierzytelniania kluczem API OpenAI.
- Narzędzie doctor raportuje niepuste listy `auth.order.<provider>`, których wszystkie wskazane profile już nie istnieją, mimo że dostępne są zgodne zapisane dane uwierzytelniające. `doctor --fix` usuwa tylko te nieaktualne nadpisania, przywracając automatyczny wybór danych uwierzytelniających dla poszczególnych agentów; jawnie puste kolejności, listy zawierające częściowo aktywne wpisy oraz kolejności bez zgodnych zapisanych danych uwierzytelniających pozostają bez zmian. Jeśli aktywny magazyn uwierzytelniania SQLite jest nieczytelny lub ma nieprawidłowy format, narzędzie doctor wyjaśnia, dlaczego pominęło tę naprawę. Przed ponownym sprawdzeniem stanu uwierzytelniania należy ponownie uruchomić działający Gateway, jeśli jego tryb ponownego ładowania konfiguracji nie stosuje zapisu automatycznie.
- Narzędzie doctor czyści starszy stan przygotowania zależności pluginów z poprzednich wersji OpenClaw i ponownie dowiązuje pakiet hosta `openclaw` dla zarządzanych pluginów npm, które deklarują go jako zależność równorzędną. Naprawia również brakujące pluginy do pobrania wskazane w konfiguracji (`plugins.entries`, skonfigurowane kanały, skonfigurowane ustawienia dostawców/wyszukiwania i skonfigurowane środowiska wykonawcze agentów). Podczas aktualizacji pakietów narzędzie doctor pomija naprawę pluginów za pomocą menedżera pakietów do czasu zakończenia zamiany pakietu; jeśli skonfigurowany plugin nadal wymaga odzyskania, należy później ponownie uruchomić `openclaw doctor --fix`. Jeśli pobieranie się nie powiedzie, narzędzie doctor raportuje błąd instalacji i zachowuje skonfigurowany wpis pluginu na potrzeby następnej próby naprawy.
- Narzędzie doctor naprawia nieaktualną konfigurację pluginów, usuwając identyfikatory brakujących pluginów z `plugins.allow`/`plugins.deny`/`plugins.entries` oraz odpowiadającą im osieroconą konfigurację kanałów, cele Heartbeat i nadpisania modeli kanałów, gdy wykrywanie pluginów działa prawidłowo.
- Narzędzie doctor poddaje kwarantannie nieprawidłową konfigurację pluginu, wyłączając odpowiedni wpis `plugins.entries.<id>` i usuwając jego nieprawidłowy ładunek `config`. Podczas uruchamiania Gateway pomijany jest już tylko ten wadliwy plugin, dzięki czemu pozostałe pluginy i kanały nadal działają.
- Narzędzie doctor usuwa wycofane `plugins.entries.codex.config.codexDynamicToolsProfile`; serwer aplikacji Codex zawsze zachowuje natywne narzędzia przestrzeni roboczej Codex jako natywne.
- Narzędzie doctor automatycznie migruje starszą płaską konfigurację Talk (`talk.voiceId`, `talk.modelId` i podobne) do `talk.provider` + `talk.providers.<provider>`. Kolejne uruchomienia `doctor --fix` nie raportują już ani nie stosują normalizacji Talk, gdy jedyną różnicą jest kolejność kluczy obiektu.
- Narzędzie doctor obejmuje kontrolę gotowości wyszukiwania w pamięci i może zalecić `openclaw configure --section model`, gdy brakuje danych uwierzytelniających do osadzania.
- Narzędzie doctor ostrzega, gdy nie skonfigurowano właściciela poleceń. Właścicielem poleceń jest konto operatora będącego człowiekiem, któremu wolno uruchamiać polecenia przeznaczone wyłącznie dla właściciela i zatwierdzać niebezpieczne działania. Parowanie wiadomości prywatnych pozwala jedynie rozmawiać z botem; jeśli nadawca został zatwierdzony przed wprowadzeniem początkowej konfiguracji pierwszego właściciela, należy jawnie ustawić `commands.ownerAllowFrom`.
- Narzędzie doctor wyświetla notę informacyjną, gdy skonfigurowano agentów w trybie Codex, a w katalogu domowym Codex operatora istnieją osobiste zasoby CLI Codex. Lokalne uruchomienia serwera aplikacji Codex używają izolowanych katalogów domowych dla poszczególnych agentów; w razie potrzeby należy najpierw zainstalować plugin Codex, a następnie użyć `openclaw migrate plan codex`, aby zinwentaryzować zasoby, które należy świadomie przenieść.
- Narzędzie doctor ostrzega, gdy Skills dozwolone dla agenta domyślnego są niedostępne w bieżącym środowisku wykonawczym (brak plików binarnych, zmiennych środowiskowych, konfiguracji lub wymagań dotyczących systemu operacyjnego). `doctor --fix` może wyłączyć te niedostępne Skills za pomocą `skills.entries.<skill>.enabled=false`; aby zachować aktywność danej umiejętności, należy zamiast tego zainstalować lub skonfigurować brakujące wymaganie.
- Jeśli tryb piaskownicy jest włączony, ale Docker jest niedostępny, narzędzie doctor wyświetla jednoznaczne ostrzeżenie wraz ze sposobem rozwiązania problemu (`install Docker` lub `openclaw config set agents.defaults.sandbox.mode off`).
- Jeśli istnieją starsze pliki rejestru piaskownicy lub katalogi fragmentów (`~/.openclaw/sandbox/containers.json`, `~/.openclaw/sandbox/browsers.json`, `~/.openclaw/sandbox/containers/` lub `~/.openclaw/sandbox/browsers/`), narzędzie doctor je raportuje; `--fix` migruje prawidłowe wpisy do SQLite i poddaje kwarantannie nieprawidłowe starsze pliki.
- Jeśli `gateway.auth.token`/`gateway.auth.password` są zarządzane przez SecretRef i niedostępne w bieżącej ścieżce polecenia, narzędzie doctor wyświetla ostrzeżenie tylko do odczytu i nie zapisuje zastępczych danych uwierzytelniających w postaci zwykłego tekstu. W przypadku SecretRefs opartych na wykonywaniu poleceń narzędzie doctor pomija ich wykonanie, chyba że obecne jest `--allow-exec`.
- Jeśli inspekcja SecretRef kanału nie powiedzie się w ścieżce naprawy, narzędzie doctor kontynuuje działanie i raportuje ostrzeżenie zamiast kończyć pracę przedwcześnie.
- Po migracji katalogów stanu narzędzie doctor ostrzega, gdy włączone domyślne konta Telegram lub Discord zależą od wartości zastępczych ze środowiska, a `TELEGRAM_BOT_TOKEN` lub `DISCORD_BOT_TOKEN` jest niedostępna dla procesu narzędzia doctor.
- Automatyczne rozpoznawanie nazwy użytkownika `allowFrom` w Telegram (`doctor --fix`) wymaga możliwego do rozpoznania tokenu Telegram w bieżącej ścieżce polecenia. Jeśli inspekcja tokenu jest niedostępna, narzędzie doctor raportuje ostrzeżenie i pomija automatyczne rozpoznawanie w tym przebiegu.

## macOS: nadpisania zmiennych środowiskowych `launchctl`

Jeśli wcześniej uruchomiono `launchctl setenv OPENCLAW_GATEWAY_TOKEN ...` (lub `...PASSWORD`), ta wartość zastępuje plik konfiguracji i może powodować trwałe błędy „unauthorized”.

```bash
launchctl getenv OPENCLAW_GATEWAY_TOKEN
launchctl getenv OPENCLAW_GATEWAY_PASSWORD

launchctl unsetenv OPENCLAW_GATEWAY_TOKEN
launchctl unsetenv OPENCLAW_GATEWAY_PASSWORD
```

## Powiązane

- [Dokumentacja CLI](/pl/cli)
- [Narzędzie doctor dla Gateway](/pl/gateway/doctor)
