---
read_when:
    - Potrzebujesz przystępnego dla początkujących przewodnika po TUI
    - Potrzebujesz pełnej listy funkcji, poleceń i skrótów TUI
summary: 'Interfejs terminalowy (TUI): połącz się z Gateway lub uruchom lokalnie w trybie osadzonym'
title: TUI
x-i18n:
    generated_at: "2026-07-12T15:42:51Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d7181ea88643a129532f698908fd3dd3d93078b7e33b0ab1166dcfca2ecc2abd
    source_path: web/tui.md
    workflow: 16
---

## Szybki start

### Tryb Gateway

1. Uruchom Gateway.

```bash
openclaw gateway
```

2. Otwórz TUI.

```bash
openclaw tui
```

3. Wpisz wiadomość i naciśnij Enter.

Zdalny Gateway:

```bash
openclaw tui --url ws://<host>:<port> --token <gateway-token>
```

Użyj `--password`, jeśli Gateway korzysta z uwierzytelniania hasłem.

### Tryb lokalny

Uruchom TUI bez Gateway:

```bash
openclaw chat
# lub
openclaw tui --local
```

- `openclaw chat` i `openclaw terminal` są aliasami polecenia `openclaw tui --local`.
- Opcji `--local` nie można łączyć z `--url`, `--token` ani `--password`.
- Tryb lokalny korzysta bezpośrednio z osadzonego środowiska wykonawczego agenta. Większość lokalnych narzędzi działa, ale funkcje dostępne wyłącznie w Gateway są niedostępne.
- Samo `openclaw` (bez podpolecenia) automatycznie wybiera cel: nieskonfigurowana instalacja uruchamia wdrażanie inferencji; nieprawidłowa konfiguracja otwiera klasyczne wskazówki narzędzia Doctor; osiągalny, skonfigurowany Gateway otwiera tę powłokę TUI w trybie Gateway; w przeciwnym razie skonfigurowany model lokalny otwiera ją w trybie lokalnym.

## Co zobaczysz

- Nagłówek: adres URL połączenia, bieżący agent, bieżąca sesja.
- Dziennik czatu: wiadomości użytkownika, odpowiedzi asystenta, powiadomienia systemowe, karty narzędzi.
- Wiersz stanu: stan połączenia/wykonania (łączenie, wykonywanie, strumieniowanie, bezczynność, błąd).
- Stopka: agent + sesja + model + stan celu + myślenie/tryb szybki/szczegółowość/śledzenie/rozumowanie + liczba tokenów + dostarczanie. Gdy włączone jest `tui.footer.showRemoteHost`, zdalne połączenia z Gateway pokazują również host połączenia.
- Pole wprowadzania: edytor tekstu z autouzupełnianiem.

## Model pojęciowy: agenci i sesje

- Agenci mają unikatowe identyfikatory tekstowe (np. `main`, `research`). Gateway udostępnia ich listę.
- Sesje należą do bieżącego agenta.
- Klucze sesji są przechowywane w postaci `agent:<agentId>:<sessionKey>`.
  - Jeśli wpiszesz `/session main`, TUI rozwinie to do `agent:<currentAgent>:main`.
  - Jeśli wpiszesz `/session agent:other:main`, jawnie przełączysz się na sesję tego agenta.
- Zakres sesji:
  - `per-sender` (domyślnie): każdy agent ma wiele sesji.
  - `global`: TUI zawsze używa sesji `global` (selektor może być pusty).
- Bieżący agent i sesja są zawsze widoczni w stopce.
- Aby wyświetlać host Gateway dla połączeń opartych na nielokalnym adresie URL, włącz tę opcję za pomocą:

  ```bash
  openclaw config set tui.footer.showRemoteHost true
  ```

  Wartością domyślną jest `false`. Połączenia local loopback i osadzone połączenia lokalne nigdy nie wyświetlają etykiety hosta.

- Jeśli sesja ma [cel](/pl/tools/goal), stopka pokazuje jego skrócony stan:
  `Realizacja celu`, `Cel wstrzymany (/goal resume)`, `Cel zablokowany (/goal resume)` lub `Cel osiągnięty`.
- Po uruchomieniu bez `--session` TUI w trybie Gateway wznawia ostatnio wybraną sesję dla tego samego Gateway, agenta i zakresu sesji, jeśli ta sesja nadal istnieje. Przekazanie `--session`, `/session`, `/new` lub `/reset` nadal oznacza jawny wybór.

## Wysyłanie i dostarczanie

- Wiadomości zawsze trafiają do Gateway (lub osadzonego środowiska wykonawczego w trybie lokalnym); dostarczenie odpowiedzi asystenta z powrotem do dostawcy czatu jest oddzielnym krokiem, domyślnie wyłączonym.
- TUI jest wewnętrznym interfejsem źródłowym podobnym do WebChat, a nie ogólnym kanałem wychodzącym. Środowiska wymagające `tools.message` do widocznych odpowiedzi mogą obsłużyć aktywną turę TUI za pomocą `message.send` bez określonego celu; jawne dostarczanie przez dostawcę nadal używa standardowych skonfigurowanych kanałów i nigdy nie przełącza się awaryjnie na `lastChannel`.
- Ustawienie dostarczania jest stałe przez całą sesję TUI od momentu uruchomienia: uruchom `openclaw tui --deliver`, aby je włączyć. Nie istnieje polecenie ukośnikowe `/deliver` ani przełącznik w ustawieniach pozwalający zmienić je w trakcie sesji; aby je zmienić, uruchom TUI ponownie.

## Selektory i nakładki

- Selektor modelu: wyświetla dostępne modele i ustawia nadpisanie dla sesji.
- Selektor agenta: umożliwia wybór innego agenta.
- Selektor sesji: pokazuje maksymalnie 50 sesji bieżącego agenta zaktualizowanych w ciągu ostatnich 7 dni. Użyj `/session <key>`, aby przejść do starszej znanej sesji.
- Ustawienia (`/settings`): przełączają rozwinięcie danych wyjściowych narzędzi i widoczność procesu myślenia. Ten panel nie steruje dostarczaniem.

## Skróty klawiaturowe

- Enter: wyślij wiadomość
- Esc: przerwij aktywne wykonanie
- Ctrl+C: wyczyść pole wprowadzania (naciśnij dwukrotnie, aby zakończyć)
- Ctrl+D: zakończ
- Ctrl+L: selektor modelu
- Ctrl+G: selektor agenta
- Ctrl+P: selektor sesji
- Ctrl+O: przełącz rozwinięcie danych wyjściowych narzędzi
- Ctrl+T: przełącz widoczność procesu myślenia (ponownie wczytuje historię)

## Polecenia ukośnikowe

Podstawowe:

- `/help`
- `/status` (przekazywane do Gateway; pokazuje podsumowanie sesji/modelu)
- `/gateway-status` (alias `/gwstatus`; pokazuje bezpośrednio stan połączenia z Gateway)
- `/agent <id>` (lub `/agents`)
- `/session <key>` (lub `/sessions`)
- `/model <provider/model>` (lub `/models`)

Sterowanie sesją:

- `/think <off|minimal|low|medium|high>` (wyższe poziomy mogą dodawać wartości takie jak `xhigh`/`max`, zależnie od modelu)
- `/fast <status|auto|on|off>`
- `/verbose <on|full|off>`
- `/trace <on|off>`
- `/reasoning <on|off|stream>`
- `/usage <off|tokens|full|reset>` (`reset`/`inherit`/`clear`/`default` usuwa nadpisanie sesji)
- `/goal [status] | /goal start <objective> | /goal edit <objective> | /goal pause|resume|complete|block|clear`
- `/elevated <on|off|ask|full>` (alias: `/elev`)
- `/activation <mention|always>`

Cykl życia sesji:

- `/new` (tworzy świeżą, odizolowaną sesję z nowym kluczem; nie wpływa na innych klientów TUI korzystających ze starej sesji)
- `/reset` (resetuje bieżący klucz sesji w miejscu)
- `/abort` (przerywa aktywne wykonanie)
- `/settings`
- `/exit` (lub `/quit`)

Tylko w trybie lokalnym:

- `/auth [provider]` otwiera w TUI proces uwierzytelniania/logowania u dostawcy.

Crestodian:

- `/crestodian [request]` przechodzi ze zwykłego TUI agenta do czatu konfiguracji/naprawy [Crestodian](#crestodian-setup-and-repair-helper), opcjonalnie przekazując jedno żądanie.

Pozostałe polecenia ukośnikowe Gateway (na przykład `/context`) są przekazywane do Gateway i wyświetlane jako dane wyjściowe systemu. Zobacz [Polecenia ukośnikowe](/pl/tools/slash-commands).

## Lokalne polecenia powłoki

- Poprzedź wiersz znakiem `!`, aby uruchomić lokalne polecenie powłoki na hoście TUI.
- TUI raz na sesję prosi o zezwolenie na wykonywanie lokalne; odmowa pozostawia `!` wyłączone przez całą sesję.
- Polecenia działają w świeżej, nieinteraktywnej powłoce w katalogu roboczym TUI (bez trwałego `cd` ani zmiennych środowiskowych).
- Lokalne polecenia powłoki otrzymują w środowisku `OPENCLAW_SHELL=tui-local`.
- Samotny znak `!` jest wysyłany jako zwykła wiadomość; początkowe spacje nie uruchamiają wykonywania lokalnego.

## Asystent konfiguracji i naprawy Crestodian

Crestodian to asystent konfiguracji i naprawy poziomu zerowego, dostępny jako `openclaw crestodian` po pomyślnym sprawdzeniu inferencji na żywo dla skonfigurowanego modelu domyślnego. Jeśli inferencja jest niedostępna, wywołanie interaktywne powraca do wdrażania inferencji, a automatyzacja kończy się niepowodzeniem ze wskazówkami dotyczącymi naprawy. Działa w tej samej lokalnej powłoce TUI co `openclaw tui --local` i korzysta z agenta AI ograniczonego do typowanych operacji Crestodian wymagających zatwierdzenia:

```bash
openclaw crestodian                       # uruchom interaktywnie
openclaw crestodian -m "status"           # wykonaj jedno żądanie i zakończ
openclaw crestodian -m "set default model openai/gpt-5.2" --yes   # zastosuj zapis konfiguracji
```

- Trwałe zapisy konfiguracji wymagają zatwierdzenia: potwierdź je interaktywnie albo przekaż `--yes`.
- `--json` wyświetla przegląd początkowy jako JSON zamiast uruchamiać czat.
- W Crestodian żądanie `open-tui` (na przykład prośba o rozmowę ze zwykłym agentem) zamyka Crestodian i otwiera standardowe TUI agenta; aby wrócić, użyj tam `/crestodian`.

Użyj trybu lokalnego, gdy bieżąca konfiguracja przechodzi już walidację i chcesz, aby osadzony agent sprawdził ją na tym samym komputerze, porównał z dokumentacją i pomógł usunąć rozbieżności bez zależności od działającego Gateway.

Jeśli `openclaw config validate` już kończy się niepowodzeniem, zacznij od `openclaw configure` lub `openclaw doctor --fix`; uruchomienie `openclaw chat` nadal wymaga konfiguracji, którą można wczytać.

Typowy cykl:

1. Uruchom tryb lokalny:

```bash
openclaw chat
```

2. Poproś agenta o sprawdzenie wybranego elementu, na przykład:

```text
Porównaj moją konfigurację uwierzytelniania Gateway z dokumentacją i zaproponuj najmniejszą poprawkę.
```

3. Użyj lokalnych poleceń powłoki, aby uzyskać dokładne dane i przeprowadzić walidację:

```text
!openclaw config file
!openclaw docs gateway auth token secretref
!openclaw config validate
!openclaw doctor
```

4. Wprowadź precyzyjne zmiany za pomocą `openclaw config set` lub `openclaw configure`, a następnie ponownie uruchom `!openclaw config validate`.
5. Jeśli Doctor zaleca automatyczną migrację lub naprawę, przejrzyj ją i uruchom `!openclaw doctor --fix`.

Wskazówki:

- Preferuj `openclaw config set` lub `openclaw configure` zamiast ręcznej edycji `openclaw.json`.
- `openclaw docs "<query>"` przeszukuje aktualny indeks dokumentacji z tego samego komputera.
- `openclaw config validate --json` jest przydatne, gdy potrzebujesz ustrukturyzowanych błędów schematu oraz błędów SecretRef/rozwiązywalności.

## Dane wyjściowe narzędzi

- Wywołania narzędzi są wyświetlane jako karty z argumentami i wynikami.
- Ctrl+O przełącza między widokiem zwiniętym i rozwiniętym.
- Podczas działania narzędzi częściowe aktualizacje są strumieniowane do tej samej karty.

## Kolory terminala

- TUI zachowuje tekst odpowiedzi asystenta w domyślnym kolorze pierwszoplanowym terminala, dzięki czemu pozostaje on czytelny zarówno w ciemnych, jak i jasnych terminalach.
- Jeśli terminal ma jasne tło, a automatyczne wykrywanie działa nieprawidłowo, ustaw `OPENCLAW_THEME=light` przed uruchomieniem `openclaw tui`.
- Aby zamiast tego wymusić pierwotną ciemną paletę, ustaw `OPENCLAW_THEME=dark`.

## Historia i strumieniowanie

- Po połączeniu TUI wczytuje najnowszą historię (domyślnie 200 wiadomości).
- Odpowiedzi strumieniowane są aktualizowane w miejscu aż do zakończenia.
- TUI nasłuchuje również zdarzeń narzędzi agenta, aby prezentować bogatsze karty narzędzi.

## Szczegóły połączenia

- TUI łączy się z identyfikatorem klienta `openclaw-tui` w ogólnym trybie klienta `ui` (tym samym, którego Control UI i WebChat używają na potrzeby zasad Gateway).
- Ponowne połączenia powodują wyświetlenie komunikatu systemowego; luki w zdarzeniach są widoczne w dzienniku.

## Opcje

- `--local`: uruchom z lokalnym osadzonym środowiskiem wykonawczym agenta
- `--url <url>`: adres URL WebSocket Gateway (domyślnie `gateway.remote.url` z konfiguracji lub `ws://127.0.0.1:<port>` przez local loopback)
- `--token <token>`: token Gateway (jeśli jest wymagany)
- `--password <password>`: hasło Gateway (jeśli jest wymagane)
- `--tls-fingerprint <sha256>`: oczekiwany odcisk certyfikatu TLS dla Gateway `wss://` z przypiętym certyfikatem
- `--session <key>`: klucz sesji (domyślnie `main` lub `global`, gdy zakres jest globalny)
- `--deliver`: dostarczaj odpowiedzi asystenta do dostawcy (domyślnie wyłączone)
- `--thinking <level>`: nadpisz poziom myślenia dla wysyłanych wiadomości
- `--message <text>`: wyślij początkową wiadomość po nawiązaniu połączenia
- `--timeout-ms <ms>`: limit czasu agenta w ms (domyślnie `agents.defaults.timeoutSeconds`)
- `--history-limit <n>`: liczba wpisów historii do wczytania (domyślnie `200`)

<Warning>
Po ustawieniu `--url` TUI nie korzysta awaryjnie z poświadczeń z konfiguracji ani zmiennych środowiskowych. Jawnie przekaż `--token` lub `--password`, a także `--tls-fingerprint`, jeśli cel korzysta z przypiętego certyfikatu. Brak jawnych poświadczeń jest błędem. W trybie lokalnym nie przekazuj `--url`, `--token`, `--password` ani `--tls-fingerprint`.
</Warning>

## Rozwiązywanie problemów

Brak danych wyjściowych po wysłaniu wiadomości:

- Uruchom `/status` w TUI, aby potwierdzić, że Gateway jest połączony i bezczynny/zajęty.
- Sprawdź dzienniki Gateway: `openclaw logs --follow`.
- Potwierdź, że agent może działać: `openclaw status` i `openclaw models status`.
- Jeśli oczekujesz wiadomości w kanale czatu, upewnij się, że TUI uruchomiono z `--deliver` (nie można włączyć tej opcji później bez ponownego uruchomienia).

## Rozwiązywanie problemów z połączeniem

- `disconnected`: upewnij się, że Gateway działa, a wartości `--url/--token/--password` są prawidłowe.
- Brak agentów w selektorze: sprawdź `openclaw agents list` i konfigurację routingu.
- Pusty selektor sesji: być może korzystasz z zakresu globalnego lub nie masz jeszcze żadnych sesji.

## Powiązane materiały

- [Control UI](/pl/web/control-ui) — internetowy interfejs sterowania
- [Konfiguracja](/pl/cli/config) — sprawdzanie, walidacja i edycja `openclaw.json`
- [Doctor](/pl/cli/doctor) — wspomagane sprawdzanie napraw i migracji
- [Dokumentacja CLI](/pl/cli) — pełna dokumentacja poleceń CLI
