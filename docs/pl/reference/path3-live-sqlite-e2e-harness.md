---
read_when:
    - Weryfikujesz przełączenie magazynu SQLite w Ścieżce 3 względem działającego Gatewaya
    - Należy odróżnić oczekiwane rozbieżności w starszym formacie JSONL od błędów środowiska uruchomieniowego
    - Tworzysz lub przeglądasz sterowany przez agenta zestaw testowy E2E działający na żywej bazie SQLite
summary: Projekt weryfikacji na żywo w Gateway przełączenia sesji/transkrypcji na SQLite w ścieżce 3
title: 'Ścieżka 3: aktywny zestaw testowy E2E SQLite'
x-i18n:
    generated_at: "2026-07-16T19:00:07Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 2749bf47cb4967bc80a5ed37a12f2a553f3b388ed8cd90cfb3217e1b5e8afae9
    source_path: reference/path3-live-sqlite-e2e-harness.md
    workflow: 16
---

Harness E2E Path 3 działający na żywo z SQLite dowodzi, że Gateway używa SQLite jako
kanonicznego magazynu sesji i transkrypcji, natomiast starsze pliki JSONL pozostają
danymi wejściowymi migracji lub materiałem archiwalnym. Jest to harness dowodowy dla opiekunów, a nie
standardowe narzędzie diagnostyczne dla użytkowników.

Po przetworzeniu przez Gateway ruchu po migracji zgodność ze starszymi plikami JSONL nie
jest już prawidłowym sygnałem kondycji środowiska uruchomieniowego. Prawidłowo zmigrowany Gateway może zawierać
wiersze transkrypcji SQLite, których liczba różni się od liczby wpisów w starszych plikach JSONL, ponieważ nowe tury
powinny aktualizować wyłącznie SQLite. Dlatego harness działający na żywo musi mierzyć zachowanie Gateway,
zmiany liczby wierszy SQLite, brak aktywności starszych plików oraz stan logów na każdym
etapie.

## Postać polecenia

Docelowe polecenie działające na żywo:

```bash
node scripts/path3-live-sqlite-e2e.mjs \
  --url http://127.0.0.1:18789 \
  --agent main \
  --session-key agent:main:path3-live-e2e:<timestamp> \
  --json
```

Polecenie łączy się z już uruchomionym Gateway. Nie uruchamia ani nie zatrzymuje Gateway,
nie importuje ani nie wykonuje ponownie migracji, chyba że później zostanie dodany
jawny tryb migracji. Wariant dla CI lub izolowanego środowiska lokalnego może używać
`test/helpers/openclaw-test-instance.ts`, ale ścieżka dowodowa działająca na żywo powinna sprawdzać
rzeczywisty Gateway operatora i jego prawdziwą bazę danych SQLite przypisaną do agenta.

## Izolowany dowód zbudowanego CLI

Runner dowodowy zbudowanego CLI inicjalizuje izolowany starszy magazyn sesji, uruchamia
przebudowany Gateway i dowodzi, że podczas uruchamiania aktywne starsze sesje są importowane do
SQLite przed rozpoczęciem odczytów środowiska uruchomieniowego. Nie wolno uruchamiać `openclaw doctor --fix`
przed pierwszym uruchomieniem Gateway, ponieważ dowodziłoby to ręcznej ścieżki migracji
zamiast ścieżki aktualizacji, którą użytkownicy otrzymują przy pierwszym uruchomieniu po przełączeniu.

Po imporcie podczas uruchamiania izolowany dowód może wykonać
`openclaw doctor --session-sqlite inspect` oraz
`openclaw doctor --session-sqlite validate` jako materiał diagnostyczny. Te
polecenia doctor nie sterują migracją w dowodzie aktualizacji podczas uruchamiania.
Oddzielne scenariusze importu przez doctor powinny inicjalizować starsze pliki transkrypcji wraz
z plikami pomocniczymi trajektorii oraz sprawdzać, czy doctor archiwizuje te artefakty, podczas gdy SQLite
pozostaje magazynem kanonicznym.

## Kontrola wstępna

Kontrola wstępna zbiera stan bazowy i kończy się niepowodzeniem przed wysłaniem tury dowodowej, jeśli
Gateway nie nadaje się do użycia:

- `GET /health` oraz szczegółowy status Gateway muszą wskazywać uruchomiony i osiągalny
  Gateway.
- Wersje CLI i Gateway muszą odpowiadać testowanej gałęzi.
- Harness zapisuje kursor logu aktywnego pliku logu Gateway.
- Harness zapisuje liczbę wierszy tabel SQLite przypisanych do agenta dla `sessions`,
  `session_entries`, `transcript_events`, `transcript_event_identities` oraz
  `session_routes`.
- Harness zapisuje `mtime`, `size` oraz informacje o istnieniu starszego
  `sessions.json`, wskazywanych plików JSONL i potencjalnych ścieżek JSONL
  sesji dowodowej.
- `lsof -p <gateway-pid>` musi wskazywać uchwyty SQLite DB/WAL/SHM i brak aktywnych
  uchwytów `.jsonl` lub `sessions.json`.

`openclaw doctor --session-sqlite validate` ma w trybie działającym na żywo wyłącznie charakter informacyjny.
Po ruchu następującym po przełączeniu może zgłaszać oczekiwane rozbieżności względem starszych plików.
Harness powinien używać danych wyjściowych doctor do klasyfikacji i inwentaryzacji migracji,
a nie jako rozstrzygającego kryterium powodzenia lub niepowodzenia środowiska uruchomieniowego.

## Scenariusz sterowany przez agenta

Scenariusz działający na żywo używa dedykowanego klucza sesji dowodowej i steruje Gateway
przez publiczne ścieżki RPC wszędzie tam, gdzie jest to możliwe. Jedna tura agenta powinna wystarczyć do
sprawdzenia zwykłego utrwalania danych, ale pełny dowód powinien obejmować punkty styku 3.1b,
które wcześniej wymagały oddzielnych kontroli na żywo:

- Zwykła tura czatu: utworzenie lub ponowne użycie sesji dowodowej, wysłanie prawdziwego
  promptu agenta, oczekiwanie na końcowy wynik asystenta i sprawdzenie `chat.history` lub
  równoważnej projekcji Gateway.
- Tożsamość transkrypcji: sprawdzenie, czy ten sam znacznik występuje w historii Gateway i w
  wierszach transkrypcji SQLite, w tym — jeśli istnieją — wierszach o stabilnej tożsamości zdarzenia.
- Akcesory metadanych sesji: odczyt sesji dowodowej i wybranych istniejących aktywnych
  sesji przez akcesory Gateway/sesji oraz porównanie ich z wierszami SQLite.
- Projekcja poprawki sesji: zastosowanie odwracalnej zmiany metadanych modelu/sesji do
  sesji dowodowej, a następnie sprawdzenie zgodności projektowanego wiersza z odpowiedzią Gateway.
- Cykl życia punktu kontrolnego Compaction: wyświetlenie listy, utworzenie gałęzi i przywrócenie punktu kontrolnego wyłącznie
  w sesji dowodowej lub syntetycznej sesji testowej utworzonej przez harness.
- Odzyskiwanie po ponownym uruchomieniu: wykonanie bezpiecznej ścieżki znacznika odzyskiwania względem kontrolowanej sesji
  dowodowej lub izolowanej instancji testowej; w trybie działającym na żywo ten krok można wykonać tylko wtedy, gdy
  docelowy zestaw sesji jest jawnie określony, a operacja odwracalna.
- Cykl życia czyszczenia: usunięcie lub zresetowanie sesji dowodowej, a następnie sprawdzenie wierszy
  cyklu życia SQLite i zarchiwizowanego stanu transkrypcji.

Punkty styku specyficzne dla transportu, których nie można bezpiecznie sprawdzić w Gateway operatora
działającym na żywo, takie jak ruch przychodzący z WhatsApp lub połączeń głosowych, powinny korzystać z sond środowiska uruchomieniowego
na poziomie właściciela, opartych na tym samym kontrakcie SQLite, zamiast symulowanego transportu zewnętrznego.

## Asercje dla poszczególnych kroków

Każdy krok wykonuje migawki stanu przed i po oraz zapisuje ustrukturyzowany rekord
asercji:

- Liczba wierszy SQLite wzrasta tylko tam, gdzie jest to oczekiwane.
- Wiersze środowiska uruchomieniowego trajektorii przyrastają dla sesji dowodowych opartych na znacznikach, które zapisują
  zdarzenia środowiska uruchomieniowego.
- Wiersz sesji dowodowej zawiera oczekiwane `session_id`, status, znaczniki czasu,
  metadane i wiersze tras.
- Projekcja historii/sesji Gateway odpowiada końcowej części transkrypcji SQLite.
- Nie zostaje utworzony ani zmodyfikowany żaden plik JSONL sesji dowodowej.
- Nie zostaje utworzony żaden plik pomocniczy sesji dowodowej `.trajectory.jsonl`, `.trajectory-path.json` ani
  `trajectory/<session>.jsonl` pochodzący od znacznika.
- Istniejące starsze pliki JSONL i `sessions.json` pozostają niezmienione, chyba że
  dany krok jest jawnie operacją migracji offline lub archiwizacji.
- Proces Gateway nie otwiera uchwytów `.jsonl` ani `sessions.json`.
- Logi od poprzedniego kursora nie zawierają `ERROR`, `FATAL`, `SQLITE_`,
  `no such column`, niedostępności magazynu sesji, niepowodzenia odzyskiwania po ponownym uruchomieniu ani
  ostrzeżenia o uzgadnianiu transkrypcji, chyba że scenariusz jawnie umieszcza je na liście dozwolonych.

Skanowanie logów jest częścią kontraktu powodzenia lub niepowodzenia. Gateway, który odpowiada na kontrole
kondycji, ale emituje błędy schematu SQLite lub powtarzające się błędy uzgadniania transkrypcji,
nie ma pozytywnego wyniku dla Path 3.

## Artefakt dowodowy

Harness powinien zapisywać dowody w `.artifacts/path3-live-e2e/<timestamp>/`
i nie dodawać ich do repozytorium git:

- `summary.json`: argumenty polecenia, wersja Gateway, wynik, nieudana asercja i
  ścieżki artefaktów.
- `sqlite-before.json` oraz `sqlite-after.json`: liczby wierszy i wybrane wiersze
  dowodowe.
- `legacy-files.json`: istnienie starszego pliku, `mtime`, rozmiar oraz informacja, czy każdy
  plik został zmieniony.
- `gateway-log-scan.json`: zakres kursora, dopasowane wiersze logu i decyzje dotyczące
  listy dozwolonych.
- `events.jsonl`: uporządkowane obserwacje z poszczególnych kroków, odpowiednie do komentarzy dowodowych w PR.

Dowód w PR powinien podsumowywać te artefakty zamiast wklejać pełne
transkrypcje lub treść prywatnych wiadomości.

## Reguły bezpieczeństwa

- Tryb działający na żywo nigdy nie może ponownie importować starszych plików JSONL podczas działania Gateway.
- Tryb działający na żywo nie może modyfikować sesji innych niż dowodowe, z wyjątkiem jawnie wybranych,
  odwracalnych sond naprawczych.
- Każdy destrukcyjny lub szeroki krok migracji wymaga świeżej kopii zapasowej
  bazy danych SQLite i katalogu starszych sesji, których dotyczy.
- Kopie zapasowe powinny być ograniczone do bazy danych agenta/katalogu sesji objętych zmianą i ponownie wykorzystywane
  podczas jednego przebiegu dowodowego, aby uniknąć nieograniczonego wzrostu użycia dysku.
- Krok czyszczenia nie może pozostawić sesji dowodowej, dowodowego pliku JSONL ani zmodyfikowanego starszego
  pliku, chyba że wywołujący przekaże `--keep-artifacts`.

## Wynik pozytywny

Pozytywny wynik przebiegu działającego na żywo oznacza, że Gateway zaakceptował rzeczywisty przepływ sesji sterowany przez agenta,
cały zaobserwowany stan kanoniczny znajdował się w SQLite, starsze pliki środowiska uruchomieniowego pozostały
nieaktywne, a stan logów był prawidłowy w mierzonym przedziale. Nie oznacza to,
że zgodność ze starszymi plikami JSONL pozostaje zachowana po ruchu na żywo; rozbieżności są oczekiwane,
gdy SQLite staje się magazynem kanonicznym.
