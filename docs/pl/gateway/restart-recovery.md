---
read_when:
    - Chcesz wiedzieć, czy ponowne uruchomienie gatewaya powoduje utratę trwającej pracy agenta
    - Działanie agenta zostało przerwane przez ponowne uruchomienie, awarię lub przeładowanie konfiguracji
    - Debugowanie automatycznego odzyskiwania sesji po ponownym uruchomieniu Gatewaya
summary: 'Co przetrwa ponowne uruchomienie lub awarię Gateway: przerwane tury agenta są automatycznie wznawiane, podagenci i zadania w tle są odzyskiwane, a kolejka dostarczania jest opróżniana'
title: Odzyskiwanie po ponownym uruchomieniu
x-i18n:
    generated_at: "2026-07-16T18:39:42Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: f2fc0263d792e78e75fb97be44671b44287d469b949e11640f11b6ff651dafb9
    source_path: gateway/restart-recovery.md
    workflow: 16
---

Ponowne uruchomienie Gateway nie powoduje utraty stanu agenta. Konwersacje, transkrypcje,
zaplanowane zadania, rekordy zadań w tle i wychodzące wiadomości w kolejce są
przechowywane na dysku, a praca przerwana w trakcie tury jest wykrywana i wznawiana
automatycznie po ponownym uruchomieniu Gateway. Nie jest wymagana żadna ręczna
interwencja ani konfiguracja: odzyskiwanie jest zawsze włączone.

Na tej stronie opisano, co zachowuje się po ponownym uruchomieniu, jak wykrywana jest
przerwana praca oraz jak wygląda automatyczne wznawianie.

## Co zachowuje się po ponownym uruchomieniu

| Stan                          | Miejsce przechowywania                       | Zachowanie po ponownym uruchomieniu                                      |
| ----------------------------- | -------------------------------------------- | ------------------------------------------------------------------------ |
| Historia konwersacji          | Baza danych SQLite poszczególnego agenta     | Bez zmian; sesje są kontynuowane od zapisanej transkrypcji               |
| Przerwana tura sesji głównej  | Wiersz sesji i transkrypcja w bazie SQLite poszczególnego agenta | Automatycznie wznawiana lub uzgadniana kilka sekund po uruchomieniu       |
| Uruchomienia podagentów       | SQLite (współdzielona baza danych stanu)     | Rejestr jest przywracany podczas rozruchu; przerwane uruchomienia są wznawiane |
| Zadania w tle                 | SQLite (współdzielona baza danych stanu)     | Uzgadniane podczas rozruchu; osierocone uruchomienia są odzyskiwane lub oznaczane jako utracone |
| Wychodzące dostarczenia w kolejce | Kolejka dostarczania SQLite              | Opróżniana po ponownym uruchomieniu; niedostarczone odpowiedzi są ponawiane |
| Zaplanowane zadania (cron)    | Magazyn cron SQLite                          | Harmonogramy są zachowywane; harmonogram jest ponownie uzbrajany podczas rozruchu |
| Kontynuacja po ponownym uruchomieniu | Znacznik ponownego uruchomienia SQLite | Jednorazowa kontynuacja jest wysyłana do sesji, która zażądała ponownego uruchomienia |

## Łagodne ponowne uruchomienia najpierw kończą trwającą pracę

Żądane ponowne uruchomienie (`openclaw gateway restart`, zmiana konfiguracji wymagająca
ponownego uruchomienia lub aktualizacja Gateway) nie przerywa natychmiast trwającej pracy.
Gateway przestaje przyjmować nową pracę, a następnie czeka na zakończenie aktywnych tur
agenta i zadań w tle, nie dłużej niż wynosi budżet opróżniania (domyślnie 5 minut).
Dlatego większość ponownych uruchomień nie przerywa żadnej pracy.

Przerywana jest tylko praca, której nie można zakończyć w ramach budżetu opróżniania
(lub każde uruchomienie przerwane przez wymuszone ponowne uruchomienie albo awarię) —
a zanim to nastąpi, każda objęta tym sesja jest oznaczana do odzyskania.

## Jak wykrywana jest przerwana praca

Sesje, których tura nie została zakończona, są oznaczane przez trzy uzupełniające się mechanizmy:

- **Podczas przyjmowania tury:** w przypadku zwykłej tury tekstowej w istniejącej
  sesji głównej Gateway dołącza wiadomość użytkownika, oznacza sesję jako uruchomioną
  i zapisuje jej deklarację dostarczenia odzyskiwania w jednej transakcji SQLite przed
  wykonaniem modelu lub zaczepu `before_agent_reply`. Control UI wykonuje to przed zwróceniem
  potwierdzenia `started`; dyspozytor kanału wykonuje to, gdy przygotowana tura
  przejmuje uruchomienie agenta.
  Polecenia, załączniki, nadpisania dla poszczególnych tur, oczekujące dostarczenia,
  wcześniejsze wskazówki przerwania, sesje należące do pluginów i tury z zaczepami
  wykonania zachowują swoje wyspecjalizowane ścieżki przyjmowania.
  Jeśli zainstalowano zaczep `before_agent_reply`, podczas przyjmowania zapisywana jest
  również jego faza. Odzyskiwanie nigdy nie odtwarza zaczepu przerwanego w trakcie
  wywołania. Gdy nieobsłużony zaczep zakończy działanie, jego punkt kontrolny zapisuje
  ten wynik, ale odzyskiwanie nadal stosuje zasadę bezpiecznej odmowy, dopóki zaczep
  pozostaje aktywny: punkt kontrolny nie może dowieść, że po ponownym uruchomieniu
  załadowano ten sam kod i tę samą konfigurację pluginu. Obsłużone wyniki tekstowe
  i ciche są zapisywane w osobnych punktach kontrolnych, aby zapewnić deterministyczne
  rozstrzygnięcie. Trwałe deklaracje odzyskiwania zapisane przez starsze wersje nie
  mają znacznika własności źródła, dlatego podczas aktualizacji podlegają tej samej
  kontroli zaczepu zgodnej z zasadą bezpiecznej odmowy.
- **Podczas zamykania:** w trakcie opróżniania przed ponownym uruchomieniem każda
  sesja z aktywnym uruchomieniem otrzymuje znacznik odzyskiwania w magazynie sesji,
  zanim uruchomienie zostanie przerwane.
- **Podczas uruchamiania:** Gateway skanuje magazyny sesji w poszukiwaniu sesji,
  które nadal deklarują stan uruchomienia, ale nie mają aktywnego właściciela w nowym
  procesie. Pozwala to wykryć poważne awarie i wymuszone zakończenia, podczas których
  nie wykonano kodu zamykającego. Jednocześnie usuwane są nieaktualne pliki blokad
  transkrypcji.

## Automatyczne wznawianie

Kilka sekund po uruchomieniu Gateway ponownie wysyła każdą oznaczoną sesję
z syntetyczną wiadomością systemową informującą agenta, że jego poprzednia tura
została przerwana przez ponowne uruchomienie i należy ją kontynuować na podstawie
istniejącej transkrypcji. Jeśli ostateczna odpowiedź została już wygenerowana, ale
nie dostarczona, jej tekst zostaje dołączony, aby agent mógł ją dostarczyć zamiast
ponownie wykonywać pracę. Odzyskiwanie jest ponawiane maksymalnie 3 razy
z wykładniczo rosnącym opóźnieniem. Każda próba używa jednego trwałego identyfikatora
wysyłki, dzięki czemu niejednoznaczna awaria połączenia nie może dwukrotnie uruchomić
tego samego odzyskiwania. Zakończone i niemożliwe do wznowienia tury Control UI
zachowują również ograniczone trwałe nagrobki idempotencji, dzięki czemu ponownie
łącząca się skrzynka nadawcza może je wycofać bez ponownego wykonania żądania.

Odpowiedzi wysyłane wyłącznie przez narzędzie wiadomości używają drugiej trwałej
korelacji. Zanim końcowa wysyłka w tej samej konwersacji dotrze do kanału, Gateway
zapisuje nierozstrzygnięty zamiar dostarczenia dla dokładnie tej sesji i tury
źródłowej. Potwierdzone powodzenie po stronie dostawcy rozstrzyga go jako trwałe
potwierdzenie dostarczenia; potwierdzona porażka go usuwa. Odzyskiwanie realizuje
potwierdzenie dostarczenia bez ponownego uruchamiania narzędzi. Jeśli po awarii wynik
po stronie dostawcy pozostaje nieznany, odzyskiwanie stosuje zasadę bezpiecznej
odmowy zamiast powtarzać efekt zewnętrzny.

Dostarczona odpowiedź jest również odzwierciedlana w transkrypcji wraz z identyfikatorem
wiadomości źródłowej. Odzwierciedlenia końcowe używają odrębnego klucza potwierdzenia,
więc wysyłka postępu z tym samym kluczem idempotencji dostawcy nie może przesłonić
znacznika końcowego. Wysyłki postępu i potwierdzenia ze starszych tur nie mogą
zakończyć bieżącej tury. Tylko trwałe deklaracje przyjęcia z kanału mogą przywrócić
uprawnienia do wykonywania działań na wiadomościach. Wznowione uruchomienie zachowuje
pierwotny tryb dostarczenia źródłowego i korelację źródłową, w tym tożsamość
żądającego oraz wszelkie ograniczenia do tego samego kanału lub wątku, dzięki czemu
to samo potwierdzenie pozostaje miarodajne nawet wtedy, gdy podczas odzyskiwania
nastąpi kolejne ponowne uruchomienie. Tura używająca wyłącznie narzędzia wiadomości,
dla której nie można odtworzyć uprawnień kanału, stosuje zasadę bezpiecznej odmowy
i otrzymuje jednorazowe powiadomienie o konieczności ponownego wysłania.

Przed wznowieniem Gateway sprawdza, czy można bezpiecznie kontynuować od końca
transkrypcji. Jeśli nie jest to możliwe (na przykład tura zakończyła się na
nieaktualnym oczekującym zatwierdzeniu), sesja nie jest bezwarunkowo uruchamiana
ponownie; zamiast tego agent publikuje krótkie powiadomienie z prośbą o ponowne
wysłanie ostatniego żądania. W przypadku WebChat powiadomienie jest zapisywane
bezpośrednio w historii sesji, dzięki czemu pozostaje widoczne po ponownym połączeniu.

OpenClaw może również odtworzyć przerwaną pracę tylko do odczytu w [Code Mode](/pl/reference/code-mode).
Code Mode oznacza te uruchomienia jako bezpieczne przy ponownym uruchomieniu i odrzuca
narzędzia katalogowe powodujące skutki uboczne lub przestrzenie nazw pluginów, zanim
zostaną wykonane. Jeśli ponowne uruchomienie nastąpi w sterowaniu `wait`,
nowy Gateway odtwarza turę na podstawie jej transkrypcji i wymusza, aby odtworzone
wykonanie pozostało bezpieczne przy ponownym uruchomieniu, nawet jeśli model pominie
lub wyczyści tę flagę. Host ogranicza całą odtworzoną turę do skontrolowanych
narzędzi podstawowych tylko do odczytu oraz jawnie bezpiecznych do ponownego
wykonania narzędzi pluginów, również wtedy, gdy Code Mode zostanie wyłączony po
ponownym uruchomieniu. Praca powodująca skutki uboczne pozostaje chroniona przez
powiadomienie o konieczności ponownego wysłania, zamiast stwarzać ryzyko
zduplikowanego zapisu.

### Podagenci

Uruchomienia podagentów są utrwalane we współdzielonej bazie danych stanu SQLite,
więc rejestr podagentów zachowuje się po zakończeniu procesu. Podczas rozruchu rejestr
jest przywracany, a przerwane sesje podagentów są wznawiane z ich pierwotnym
kontekstem zadania. Obowiązują dwa zabezpieczenia:

- Uruchomienia przerwane ponad 2 godziny temu są finalizowane zamiast wznawiane,
  dzięki czemu Gateway, który nie działał przez noc, nie wskrzesza nieaktualnej pracy.
- Sesja, której odzyskiwanie wielokrotnie się nie udaje, otrzymuje nagrobek
  oznaczający zakleszczenie, aby odzyskiwanie nie mogło trwać w nieskończonej pętli.

### Zadania w tle

[Rejestr zadań w tle](/pl/automation/tasks) korzysta z SQLite i jest uzgadniany podczas
rozruchu oraz w okresowych odstępach: trwałe wyniki zapisane przez zakończone
uruchomienia są odzyskiwane, a uruchomienia, których proces właścicielski zniknął,
są po okresie karencji oznaczane jako utracone, zamiast pozostawać zawieszone
w nieskończoność.

### Ponowne uruchomienia żądane przez agenta

Gdy sam agent wywołuje ponowne uruchomienie (stosując zmianę konfiguracji,
aktualizując Gateway lub jawnie żądając ponownego uruchomienia), przed zakończeniem
procesu w SQLite zapisywany jest znacznik ponownego uruchomienia. Po rozruchu Gateway
publikuje wynik w pierwotnym czacie i wysyła jednorazową turę kontynuacji, aby agent
wznowił pracę dokładnie w miejscu, w którym ją przerwał, w tym samym kanale i wątku.

## Zabezpieczenia i obserwowalność

- **Wyłącznik pętli awarii:** 3 nieczyste rozruchy w ciągu 5 minut uruchamiają
  wyłącznik, który przy następnym rozruchu blokuje automatyczne uruchamianie usług
  pomocniczych, aby awarie Gateway nie powodowały kolejnych awarii. Normalne działanie
  zostaje przywrócone po wygaśnięciu okna nieczystych rozruchów.
- **Metryki:** aktywność odzyskiwania jest eksportowana przez
  [Prometheus](/pl/gateway/prometheus) jako `openclaw_session_recovery_total` i
  `openclaw_session_recovery_age_seconds`.
- **Dzienniki:** decyzje dotyczące odzyskiwania są rejestrowane w podsystemach
  `main-session-restart-recovery` i `subagent-interrupted-resume`.

## Co nie jest wznawiane

- Sesje wykluczone z odzyskiwania sesji głównej, ponieważ obsługuje je już inny
  właściciel: sesje podagentów (odzyskiwanie podagentów), sesje cron (harmonogram
  uruchamia je ponownie zgodnie z harmonogramem) oraz sesje zarządzane przez ACP
  (za wznowienie odpowiada połączone IDE lub klient).
- Sesje, których końca transkrypcji nie można bezpiecznie kontynuować; zamiast
  bezwarunkowego ponownego uruchomienia otrzymują opisane powyżej powiadomienie
  o konieczności ponownego wysłania.
- Praca, która nigdy nie została przyjęta: wiadomości przychodzące w oknie
  opróżniania są odrzucane z jawnym błędem ponownego uruchomienia, zamiast być
  bezgłośnie umieszczane w kolejce kończącego się procesu.
