---
read_when:
    - Chcesz przyjazny dla początkujących przewodnik po TUI
    - Potrzebujesz pełnej listy funkcji TUI, poleceń i skrótów
summary: 'Terminalowy interfejs użytkownika (TUI): połącz się z Gateway lub uruchom lokalnie w trybie osadzonym'
title: TUI
x-i18n:
    generated_at: "2026-04-30T10:26:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5caca4b3f4df02ce1226a8ed0d759023464e5b0752b9cd1b7922b20099d58df1
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
- Tryb lokalny używa bezpośrednio wbudowanego środowiska uruchomieniowego agenta. Większość narzędzi lokalnych działa, ale funkcje dostępne tylko przez Gateway są niedostępne.
- `openclaw` i `openclaw crestodian` również używają tej powłoki TUI, z Crestodian jako lokalnym backendem czatu do konfiguracji i naprawy.

## Co widzisz

- Nagłówek: URL połączenia, bieżący agent, bieżąca sesja.
- Dziennik czatu: wiadomości użytkownika, odpowiedzi asystenta, powiadomienia systemowe, karty narzędzi.
- Wiersz stanu: stan połączenia/uruchomienia (łączenie, uruchomione, strumieniowanie, bezczynność, błąd).
- Stopka: stan połączenia + agent + sesja + model + think/fast/verbose/trace/reasoning + liczby tokenów + dostarczanie.
- Wejście: edytor tekstu z autouzupełnianiem.

## Model mentalny: agenci + sesje

- Agenci to unikalne slugi (np. `main`, `research`). Gateway udostępnia listę.
- Sesje należą do bieżącego agenta.
- Klucze sesji są przechowywane jako `agent:<agentId>:<sessionKey>`.
  - Jeśli wpiszesz `/session main`, TUI rozwinie to do `agent:<currentAgent>:main`.
  - Jeśli wpiszesz `/session agent:other:main`, jawnie przełączysz się na tę sesję agenta.
- Zakres sesji:
  - `per-sender` (domyślnie): każdy agent ma wiele sesji.
  - `global`: TUI zawsze używa sesji `global` (selektor może być pusty).
- Bieżący agent + sesja są zawsze widoczne w stopce.

## Wysyłanie + dostarczanie

- Wiadomości są wysyłane do Gateway; dostarczanie do dostawców jest domyślnie wyłączone.
- Włącz dostarczanie:
  - `/deliver on`
  - albo panel Ustawienia
  - albo uruchom z `openclaw tui --deliver`

## Selektory + nakładki

- Selektor modelu: wyświetla dostępne modele i ustawia nadpisanie dla sesji.
- Selektor agenta: wybierz innego agenta.
- Selektor sesji: pokazuje tylko sesje dla bieżącego agenta.
- Ustawienia: przełączaj dostarczanie, rozwijanie wyjścia narzędzi oraz widoczność myślenia.

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

## Polecenia ukośnikowe

Podstawowe:

- `/help`
- `/status`
- `/agent <id>` (lub `/agents`)
- `/session <key>` (lub `/sessions`)
- `/model <provider/model>` (lub `/models`)

Elementy sterujące sesją:

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

- `/new` lub `/reset` (resetuje sesję)
- `/abort` (przerywa aktywne uruchomienie)
- `/settings`
- `/exit`

Tylko tryb lokalny:

- `/auth [provider]` otwiera przepływ uwierzytelniania/logowania dostawcy w TUI.

Inne polecenia ukośnikowe Gateway (na przykład `/context`) są przekazywane do Gateway i pokazywane jako wyjście systemowe. Zobacz [Polecenia ukośnikowe](/pl/tools/slash-commands).

## Lokalne polecenia powłoki

- Poprzedź wiersz znakiem `!`, aby uruchomić lokalne polecenie powłoki na hoście TUI.
- TUI raz na sesję prosi o zezwolenie na lokalne wykonywanie; odmowa pozostawia `!` wyłączone dla sesji.
- Polecenia działają w świeżej, nieinteraktywnej powłoce w katalogu roboczym TUI (bez trwałego `cd`/env).
- Lokalne polecenia powłoki otrzymują w swoim środowisku `OPENCLAW_SHELL=tui-local`.
- Samotny `!` jest wysyłany jako zwykła wiadomość; spacje na początku nie uruchamiają lokalnego wykonywania.

## Naprawa konfiguracji z lokalnego TUI

Użyj trybu lokalnego, gdy bieżąca konfiguracja już przechodzi walidację i chcesz, aby
wbudowany agent sprawdził ją na tej samej maszynie, porównał z dokumentacją
i pomógł naprawić rozbieżności bez zależności od działającego Gateway.

Jeśli `openclaw config validate` już kończy się niepowodzeniem, najpierw zacznij od `openclaw configure`
albo `openclaw doctor --fix`. `openclaw chat` nie omija blokady nieprawidłowej
konfiguracji.

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

4. Zastosuj wąskie zmiany za pomocą `openclaw config set` lub `openclaw configure`, a następnie ponownie uruchom `!openclaw config validate`.
5. Jeśli Doctor zaleci automatyczną migrację lub naprawę, przejrzyj ją i uruchom `!openclaw doctor --fix`.

Wskazówki:

- Preferuj `openclaw config set` lub `openclaw configure` zamiast ręcznej edycji `openclaw.json`.
- `openclaw docs "<query>"` przeszukuje indeks dokumentacji na żywo z tej samej maszyny.
- `openclaw config validate --json` jest przydatne, gdy chcesz uzyskać ustrukturyzowany schemat oraz błędy SecretRef/rozwiązywalności.

## Wyjście narzędzi

- Wywołania narzędzi są pokazywane jako karty z argumentami + wynikami.
- Ctrl+O przełącza między widokami zwiniętymi i rozwiniętymi.
- Gdy narzędzia działają, częściowe aktualizacje są strumieniowane do tej samej karty.

## Kolory terminala

- TUI utrzymuje tekst główny asystenta w domyślnym kolorze pierwszego planu Twojego terminala, aby terminale ciemne i jasne pozostały czytelne.
- Jeśli Twój terminal używa jasnego tła, a automatyczne wykrywanie jest błędne, ustaw `OPENCLAW_THEME=light` przed uruchomieniem `openclaw tui`.
- Aby zamiast tego wymusić oryginalną ciemną paletę, ustaw `OPENCLAW_THEME=dark`.

## Historia + strumieniowanie

- Po połączeniu TUI ładuje najnowszą historię (domyślnie 200 wiadomości).
- Odpowiedzi strumieniowane aktualizują się w miejscu aż do finalizacji.
- TUI nasłuchuje również zdarzeń narzędzi agenta, aby wyświetlać bogatsze karty narzędzi.

## Szczegóły połączenia

- TUI rejestruje się w Gateway jako `mode: "tui"`.
- Ponowne połączenia pokazują wiadomość systemową; luki w zdarzeniach są pokazywane w dzienniku.

## Opcje

- `--local`: Uruchom względem lokalnego wbudowanego środowiska uruchomieniowego agenta
- `--url <url>`: URL WebSocket Gateway (domyślnie z konfiguracji lub `ws://127.0.0.1:<port>`)
- `--token <token>`: token Gateway (jeśli wymagany)
- `--password <password>`: hasło Gateway (jeśli wymagane)
- `--session <key>`: klucz sesji (domyślnie: `main`, albo `global`, gdy zakres jest globalny)
- `--deliver`: Dostarczaj odpowiedzi asystenta do dostawcy (domyślnie wyłączone)
- `--thinking <level>`: Nadpisz poziom myślenia dla wysyłek
- `--message <text>`: Wyślij wiadomość początkową po połączeniu
- `--timeout-ms <ms>`: Limit czasu agenta w ms (domyślnie `agents.defaults.timeoutSeconds`)
- `--history-limit <n>`: Wpisy historii do załadowania (domyślnie `200`)

<Warning>
Gdy ustawisz `--url`, TUI nie wraca do konfiguracji ani poświadczeń ze środowiska. Przekaż jawnie `--token` albo `--password`. Brak jawnych poświadczeń jest błędem. W trybie lokalnym nie przekazuj `--url`, `--token` ani `--password`.
</Warning>

## Rozwiązywanie problemów

Brak wyjścia po wysłaniu wiadomości:

- Uruchom `/status` w TUI, aby potwierdzić, że Gateway jest połączony i bezczynny/zajęty.
- Sprawdź logi Gateway: `openclaw logs --follow`.
- Potwierdź, że agent może działać: `openclaw status` i `openclaw models status`.
- Jeśli oczekujesz wiadomości w kanale czatu, włącz dostarczanie (`/deliver on` lub `--deliver`).

## Rozwiązywanie problemów z połączeniem

- `disconnected`: upewnij się, że Gateway działa oraz że Twoje `--url/--token/--password` są poprawne.
- Brak agentów w selektorze: sprawdź `openclaw agents list` i swoją konfigurację routingu.
- Pusty selektor sesji: możesz być w zakresie globalnym albo nie mieć jeszcze żadnych sesji.

## Powiązane

- [Control UI](/pl/web/control-ui) — webowy interfejs sterowania
- [Konfiguracja](/pl/cli/config) — sprawdzaj, waliduj i edytuj `openclaw.json`
- [Doctor](/pl/cli/doctor) — prowadzone kontrole naprawy i migracji
- [Dokumentacja CLI](/pl/cli) — pełna dokumentacja poleceń CLI
