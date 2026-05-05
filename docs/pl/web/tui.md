---
read_when:
    - Chcesz przyjaznego dla początkujących przewodnika po TUI
    - Potrzebujesz pełnej listy funkcji, poleceń i skrótów TUI
summary: 'Interfejs terminalowy (TUI): połącz się z Gateway lub uruchom lokalnie w trybie osadzonym'
title: TUI
x-i18n:
    generated_at: "2026-05-05T09:59:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2b517ff434cc440aeffd8698df75d4d85c22a19e59b38a1f2383e58e1b4084ff
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

Użyj `--password`, jeśli Twój Gateway używa uwierzytelniania hasłem.

### Tryb lokalny

Uruchom TUI bez Gateway:

```bash
openclaw chat
# or
openclaw tui --local
```

Uwagi:

- `openclaw chat` i `openclaw terminal` są aliasami dla `openclaw tui --local`.
- `--local` nie można łączyć z `--url`, `--token` ani `--password`.
- Tryb lokalny używa bezpośrednio wbudowanego środowiska uruchomieniowego agenta. Większość narzędzi lokalnych działa, ale funkcje dostępne tylko w Gateway są niedostępne.
- `openclaw` i `openclaw crestodian` również używają tej powłoki TUI, z Crestodian jako lokalnym backendem czatu do konfiguracji i napraw.

## Co widzisz

- Nagłówek: adres URL połączenia, bieżący agent, bieżąca sesja.
- Dziennik czatu: wiadomości użytkownika, odpowiedzi asystenta, powiadomienia systemowe, karty narzędzi.
- Wiersz stanu: stan połączenia/uruchomienia (łączenie, uruchomiony, strumieniowanie, bezczynny, błąd).
- Stopka: stan połączenia + agent + sesja + model + think/fast/verbose/trace/reasoning + liczba tokenów + dostarczanie.
- Wejście: edytor tekstu z autouzupełnianiem.

## Model mentalny: agenty + sesje

- Agenty to unikalne identyfikatory typu slug (np. `main`, `research`). Gateway udostępnia listę.
- Sesje należą do bieżącego agenta.
- Klucze sesji są przechowywane jako `agent:<agentId>:<sessionKey>`.
  - Jeśli wpiszesz `/session main`, TUI rozwinie to do `agent:<currentAgent>:main`.
  - Jeśli wpiszesz `/session agent:other:main`, przełączysz się jawnie na sesję tego agenta.
- Zakres sesji:
  - `per-sender` (domyślnie): każdy agent ma wiele sesji.
  - `global`: TUI zawsze używa sesji `global` (selektor może być pusty).
- Bieżący agent + sesja są zawsze widoczne w stopce.
- Po uruchomieniu bez `--session`, TUI w trybie Gateway wznawia ostatnio wybraną sesję dla tego samego Gateway, agenta i zakresu sesji, jeśli ta sesja nadal istnieje. Przekazanie `--session`, `/session`, `/new` lub `/reset` pozostaje jawne.

## Wysyłanie + dostarczanie

- Wiadomości są wysyłane do Gateway; dostarczanie do dostawców jest domyślnie wyłączone.
- Włącz dostarczanie:
  - `/deliver on`
  - albo w panelu Ustawienia
  - albo uruchom z `openclaw tui --deliver`

## Selektory + nakładki

- Selektor modelu: wyświetla dostępne modele i ustawia nadpisanie dla sesji.
- Selektor agenta: wybierz innego agenta.
- Selektor sesji: pokazuje do 50 sesji bieżącego agenta zaktualizowanych w ciągu ostatnich 7 dni. Użyj `/session <key>`, aby przejść do starszej znanej sesji.
- Ustawienia: przełącz dostarczanie, rozwijanie wyjścia narzędzi i widoczność myślenia.

## Skróty klawiaturowe

- Enter: wyślij wiadomość
- Esc: przerwij aktywne uruchomienie
- Ctrl+C: wyczyść wejście (naciśnij dwa razy, aby wyjść)
- Ctrl+D: wyjdź
- Ctrl+L: selektor modelu
- Ctrl+G: selektor agenta
- Ctrl+P: selektor sesji
- Ctrl+O: przełącz rozwijanie wyjścia narzędzi
- Ctrl+T: przełącz widoczność myślenia (ponownie ładuje historię)

## Polecenia slash

Podstawowe:

- `/help`
- `/status`
- `/agent <id>` (lub `/agents`)
- `/session <key>` (lub `/sessions`)
- `/model <provider/model>` (lub `/models`)

Kontrola sesji:

- `/think <off|minimal|low|medium|high>`
- `/fast <status|on|off>`
- `/verbose <on|full|off>`
- `/trace <on|off>`
- `/reasoning <on|off|stream>`
- `/usage <off|tokens|full>`
- `/elevated <on|off|ask|full>` (alias: `/elev`)
- `/activation <mention|always>`
- `/deliver <on|off>`

Cykl życia sesji:

- `/new` lub `/reset` (zresetuj sesję)
- `/abort` (przerwij aktywne uruchomienie)
- `/settings`
- `/exit`

Tylko tryb lokalny:

- `/auth [provider]` otwiera przepływ uwierzytelniania/logowania dostawcy w TUI.

Inne polecenia slash Gateway (na przykład `/context`) są przekazywane do Gateway i pokazywane jako wyjście systemowe. Zobacz [Polecenia slash](/pl/tools/slash-commands).

## Lokalne polecenia powłoki

- Poprzedź wiersz znakiem `!`, aby uruchomić lokalne polecenie powłoki na hoście TUI.
- TUI raz na sesję prosi o pozwolenie na lokalne wykonywanie; odmowa pozostawia `!` wyłączone dla sesji.
- Polecenia uruchamiają się w świeżej, nieinteraktywnej powłoce w katalogu roboczym TUI (brak trwałego `cd`/env).
- Lokalne polecenia powłoki otrzymują w środowisku `OPENCLAW_SHELL=tui-local`.
- Samotny `!` jest wysyłany jako normalna wiadomość; początkowe spacje nie uruchamiają lokalnego wykonywania.

## Naprawianie konfiguracji z lokalnego TUI

Użyj trybu lokalnego, gdy bieżąca konfiguracja już przechodzi walidację i chcesz, aby wbudowany agent sprawdził ją na tej samej maszynie, porównał z dokumentacją i pomógł naprawić rozbieżności bez zależności od działającego Gateway.

Jeśli `openclaw config validate` już kończy się błędem, najpierw zacznij od `openclaw configure` albo `openclaw doctor --fix`. `openclaw chat` nie omija blokady nieprawidłowej konfiguracji.

Typowa pętla:

1. Uruchom tryb lokalny:

```bash
openclaw chat
```

2. Zapytaj agenta, co chcesz sprawdzić, na przykład:

```text
Compare my gateway auth config with the docs and suggest the smallest fix.
```

3. Użyj lokalnych poleceń powłoki, aby uzyskać dokładne dowody i walidację:

```text
!openclaw config file
!openclaw docs gateway auth token secretref
!openclaw config validate
!openclaw doctor
```

4. Zastosuj wąskie zmiany za pomocą `openclaw config set` albo `openclaw configure`, a następnie ponownie uruchom `!openclaw config validate`.
5. Jeśli Doctor zaleci automatyczną migrację lub naprawę, przejrzyj ją i uruchom `!openclaw doctor --fix`.

Wskazówki:

- Preferuj `openclaw config set` albo `openclaw configure` zamiast ręcznego edytowania `openclaw.json`.
- `openclaw docs "<query>"` przeszukuje indeks dokumentacji na żywo z tej samej maszyny.
- `openclaw config validate --json` jest przydatne, gdy chcesz uzyskać ustrukturyzowane błędy schematu oraz błędy SecretRef/rozwiązywalności.

## Wyjście narzędzi

- Wywołania narzędzi są pokazywane jako karty z argumentami + wynikami.
- Ctrl+O przełącza między widokami zwiniętym i rozwiniętym.
- Gdy narzędzia działają, częściowe aktualizacje są strumieniowane do tej samej karty.

## Kolory terminala

- TUI utrzymuje tekst treści asystenta w domyślnym kolorze pierwszego planu Twojego terminala, aby terminale ciemne i jasne pozostały czytelne.
- Jeśli Twój terminal używa jasnego tła, a automatyczne wykrywanie jest błędne, ustaw `OPENCLAW_THEME=light` przed uruchomieniem `openclaw tui`.
- Aby wymusić oryginalną ciemną paletę, ustaw zamiast tego `OPENCLAW_THEME=dark`.

## Historia + strumieniowanie

- Po połączeniu TUI ładuje najnowszą historię (domyślnie 200 wiadomości).
- Odpowiedzi strumieniowane są aktualizowane w miejscu aż do finalizacji.
- TUI nasłuchuje również zdarzeń narzędzi agenta, aby wzbogacać karty narzędzi.

## Szczegóły połączenia

- TUI rejestruje się w Gateway jako `mode: "tui"`.
- Ponowne połączenia pokazują komunikat systemowy; luki w zdarzeniach są sygnalizowane w dzienniku.

## Opcje

- `--local`: uruchom względem lokalnego wbudowanego środowiska uruchomieniowego agenta
- `--url <url>`: adres URL WebSocket Gateway (domyślnie z konfiguracji albo `ws://127.0.0.1:<port>`)
- `--token <token>`: token Gateway (jeśli wymagany)
- `--password <password>`: hasło Gateway (jeśli wymagane)
- `--session <key>`: klucz sesji (domyślnie: `main`, albo `global`, gdy zakres jest globalny)
- `--deliver`: dostarczaj odpowiedzi asystenta do dostawcy (domyślnie wyłączone)
- `--thinking <level>`: nadpisz poziom myślenia dla wysyłek
- `--message <text>`: wyślij początkową wiadomość po połączeniu
- `--timeout-ms <ms>`: limit czasu agenta w ms (domyślnie `agents.defaults.timeoutSeconds`)
- `--history-limit <n>`: wpisy historii do załadowania (domyślnie `200`)

<Warning>
Gdy ustawisz `--url`, TUI nie wraca do poświadczeń z konfiguracji ani środowiska. Przekaż `--token` albo `--password` jawnie. Brak jawnych poświadczeń jest błędem. W trybie lokalnym nie przekazuj `--url`, `--token` ani `--password`.
</Warning>

## Rozwiązywanie problemów

Brak wyjścia po wysłaniu wiadomości:

- Uruchom `/status` w TUI, aby potwierdzić, że Gateway jest połączony i bezczynny/zajęty.
- Sprawdź logi Gateway: `openclaw logs --follow`.
- Potwierdź, że agent może działać: `openclaw status` i `openclaw models status`.
- Jeśli oczekujesz wiadomości w kanale czatu, włącz dostarczanie (`/deliver on` lub `--deliver`).

## Rozwiązywanie problemów z połączeniem

- `disconnected`: upewnij się, że Gateway działa, a Twoje `--url/--token/--password` są poprawne.
- Brak agentów w selektorze: sprawdź `openclaw agents list` i konfigurację routingu.
- Pusty selektor sesji: możesz być w zakresie globalnym albo nie mieć jeszcze żadnych sesji.

## Powiązane

- [Control UI](/pl/web/control-ui) — internetowy interfejs sterowania
- [Konfiguracja](/pl/cli/config) — sprawdzaj, waliduj i edytuj `openclaw.json`
- [Doctor](/pl/cli/doctor) — prowadzona naprawa i kontrole migracji
- [Dokumentacja CLI](/pl/cli) — pełna dokumentacja poleceń CLI
