---
read_when:
    - Chcesz przyjazny dla początkujących przewodnik po TUI
    - Potrzebujesz pełnej listy funkcji, poleceń i skrótów TUI
summary: 'Interfejs terminalowy (TUI): połącz się z Gateway lub uruchom lokalnie w trybie osadzonym'
title: TUI
x-i18n:
    generated_at: "2026-05-02T10:06:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5c13268991bf11eece9984f21eb959e7a5fab7071be6dc3a47855b525bfe80d8
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

- `openclaw chat` i `openclaw terminal` są aliasami `openclaw tui --local`.
- `--local` nie można łączyć z `--url`, `--token` ani `--password`.
- Tryb lokalny używa bezpośrednio wbudowanego środowiska uruchomieniowego agenta. Większość lokalnych narzędzi działa, ale funkcje dostępne tylko przez Gateway są niedostępne.
- `openclaw` i `openclaw crestodian` również używają tej powłoki TUI, z Crestodian jako lokalnym backendem czatu do konfiguracji i naprawy.

## Co widzisz

- Nagłówek: URL połączenia, bieżący agent, bieżąca sesja.
- Dziennik czatu: wiadomości użytkownika, odpowiedzi asystenta, powiadomienia systemowe, karty narzędzi.
- Wiersz stanu: stan połączenia/uruchomienia (łączenie, uruchomione, strumieniowanie, bezczynne, błąd).
- Stopka: stan połączenia + agent + sesja + model + think/fast/verbose/trace/reasoning + liczby tokenów + dostarczanie.
- Wejście: edytor tekstu z autouzupełnianiem.

## Model mentalny: agenci + sesje

- Agenci to unikalne slugi (np. `main`, `research`). Gateway udostępnia listę.
- Sesje należą do bieżącego agenta.
- Klucze sesji są przechowywane jako `agent:<agentId>:<sessionKey>`.
  - Jeśli wpiszesz `/session main`, TUI rozwinie to do `agent:<currentAgent>:main`.
  - Jeśli wpiszesz `/session agent:other:main`, przełączysz się jawnie na tę sesję agenta.
- Zakres sesji:
  - `per-sender` (domyślnie): każdy agent ma wiele sesji.
  - `global`: TUI zawsze używa sesji `global` (selektor może być pusty).
- Bieżący agent + sesja są zawsze widoczne w stopce.
- Po uruchomieniu bez `--session`, TUI w trybie Gateway wznawia ostatnio wybraną sesję dla tego samego Gateway, agenta i zakresu sesji, jeśli ta sesja nadal istnieje. Przekazanie `--session`, `/session`, `/new` lub `/reset` pozostaje jawne.

## Wysyłanie + dostarczanie

- Wiadomości są wysyłane do Gateway; dostarczanie do dostawców jest domyślnie wyłączone.
- Włącz dostarczanie:
  - `/deliver on`
  - albo panel Ustawień
  - albo uruchom z `openclaw tui --deliver`

## Selektory + nakładki

- Selektor modelu: wyświetla dostępne modele i ustawia nadpisanie dla sesji.
- Selektor agenta: wybiera innego agenta.
- Selektor sesji: pokazuje tylko sesje bieżącego agenta.
- Ustawienia: przełączanie dostarczania, rozwijania wyjścia narzędzi i widoczności myślenia.

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

## Polecenia z ukośnikiem

Podstawowe:

- `/help`
- `/status`
- `/agent <id>` (lub `/agents`)
- `/session <key>` (lub `/sessions`)
- `/model <provider/model>` (lub `/models`)

Sterowanie sesją:

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

- `/auth [provider]` otwiera przepływ uwierzytelniania/logowania dostawcy wewnątrz TUI.

Inne polecenia z ukośnikiem Gateway (na przykład `/context`) są przekazywane do Gateway i wyświetlane jako wyjście systemowe. Zobacz [Polecenia z ukośnikiem](/pl/tools/slash-commands).

## Lokalne polecenia powłoki

- Poprzedź wiersz znakiem `!`, aby uruchomić lokalne polecenie powłoki na hoście TUI.
- TUI raz na sesję prosi o zgodę na lokalne wykonywanie; odmowa pozostawia `!` wyłączone dla sesji.
- Polecenia są uruchamiane w świeżej, nieinteraktywnej powłoce w katalogu roboczym TUI (bez trwałego `cd`/env).
- Lokalne polecenia powłoki otrzymują w swoim środowisku `OPENCLAW_SHELL=tui-local`.
- Samotne `!` jest wysyłane jako zwykła wiadomość; spacje na początku nie uruchamiają lokalnego wykonywania.

## Naprawianie konfiguracji z lokalnego TUI

Użyj trybu lokalnego, gdy bieżąca konfiguracja już przechodzi walidację i chcesz, aby
wbudowany agent sprawdził ją na tej samej maszynie, porównał z dokumentacją
i pomógł naprawić rozjazdy bez zależności od działającego Gateway.

Jeśli `openclaw config validate` już kończy się niepowodzeniem, zacznij najpierw od `openclaw configure`
lub `openclaw doctor --fix`. `openclaw chat` nie omija zabezpieczenia przed nieprawidłową
konfiguracją.

Typowa pętla:

1. Uruchom tryb lokalny:

```bash
openclaw chat
```

2. Zapytaj agenta, co ma sprawdzić, na przykład:

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

4. Zastosuj wąskie zmiany za pomocą `openclaw config set` lub `openclaw configure`, a potem ponownie uruchom `!openclaw config validate`.
5. Jeśli Doctor zaleca automatyczną migrację lub naprawę, przejrzyj ją i uruchom `!openclaw doctor --fix`.

Wskazówki:

- Preferuj `openclaw config set` lub `openclaw configure` zamiast ręcznej edycji `openclaw.json`.
- `openclaw docs "<query>"` przeszukuje indeks aktywnej dokumentacji z tej samej maszyny.
- `openclaw config validate --json` jest przydatne, gdy potrzebujesz ustrukturyzowanych błędów schematu oraz błędów SecretRef/rozwiązywalności.

## Wyjście narzędzi

- Wywołania narzędzi są wyświetlane jako karty z argumentami + wynikami.
- Ctrl+O przełącza między widokiem zwiniętym i rozwiniętym.
- Gdy narzędzia działają, częściowe aktualizacje są strumieniowane do tej samej karty.

## Kolory terminala

- TUI utrzymuje tekst treści asystenta w domyślnym kolorze pierwszoplanowym Twojego terminala, aby terminale ciemne i jasne pozostały czytelne.
- Jeśli Twój terminal używa jasnego tła, a automatyczne wykrywanie jest błędne, ustaw `OPENCLAW_THEME=light` przed uruchomieniem `openclaw tui`.
- Aby zamiast tego wymusić oryginalną ciemną paletę, ustaw `OPENCLAW_THEME=dark`.

## Historia + strumieniowanie

- Po połączeniu TUI ładuje najnowszą historię (domyślnie 200 wiadomości).
- Strumieniowane odpowiedzi aktualizują się w miejscu aż do finalizacji.
- TUI nasłuchuje również zdarzeń narzędzi agenta, aby zapewnić bogatsze karty narzędzi.

## Szczegóły połączenia

- TUI rejestruje się w Gateway jako `mode: "tui"`.
- Ponowne połączenia pokazują komunikat systemowy; luki w zdarzeniach są ujawniane w dzienniku.

## Opcje

- `--local`: Uruchom względem lokalnego wbudowanego środowiska uruchomieniowego agenta
- `--url <url>`: URL WebSocket Gateway (domyślnie z konfiguracji albo `ws://127.0.0.1:<port>`)
- `--token <token>`: Token Gateway (jeśli wymagany)
- `--password <password>`: Hasło Gateway (jeśli wymagane)
- `--session <key>`: Klucz sesji (domyślnie: `main`, albo `global`, gdy zakres jest globalny)
- `--deliver`: Dostarczaj odpowiedzi asystenta do dostawcy (domyślnie wyłączone)
- `--thinking <level>`: Nadpisz poziom myślenia dla wysyłania
- `--message <text>`: Wyślij początkową wiadomość po połączeniu
- `--timeout-ms <ms>`: Limit czasu agenta w ms (domyślnie `agents.defaults.timeoutSeconds`)
- `--history-limit <n>`: Wpisy historii do załadowania (domyślnie `200`)

<Warning>
Gdy ustawisz `--url`, TUI nie wraca do konfiguracji ani danych uwierzytelniających ze środowiska. Przekaż jawnie `--token` lub `--password`. Brak jawnych danych uwierzytelniających jest błędem. W trybie lokalnym nie przekazuj `--url`, `--token` ani `--password`.
</Warning>

## Rozwiązywanie problemów

Brak wyjścia po wysłaniu wiadomości:

- Uruchom `/status` w TUI, aby potwierdzić, że Gateway jest połączony i bezczynny/zajęty.
- Sprawdź dzienniki Gateway: `openclaw logs --follow`.
- Potwierdź, że agent może działać: `openclaw status` i `openclaw models status`.
- Jeśli oczekujesz wiadomości w kanale czatu, włącz dostarczanie (`/deliver on` lub `--deliver`).

## Rozwiązywanie problemów z połączeniem

- `disconnected`: upewnij się, że Gateway działa, a Twoje `--url/--token/--password` są poprawne.
- Brak agentów w selektorze: sprawdź `openclaw agents list` i swoją konfigurację routingu.
- Pusty selektor sesji: możesz być w zakresie globalnym albo nie mieć jeszcze żadnych sesji.

## Powiązane

- [Control UI](/pl/web/control-ui) — webowy interfejs sterowania
- [Konfiguracja](/pl/cli/config) — sprawdzanie, walidowanie i edytowanie `openclaw.json`
- [Doctor](/pl/cli/doctor) — prowadzona naprawa i kontrole migracji
- [Dokumentacja CLI](/pl/cli) — pełna dokumentacja poleceń CLI
