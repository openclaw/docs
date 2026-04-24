---
read_when:
    - Chcesz przyjaznego dla początkujących przewodnika po TUI
    - Potrzebujesz pełnej listy funkcji, poleceń i skrótów TUI
summary: 'Terminal UI (TUI): połącz się z Gateway lub uruchom lokalnie w trybie osadzonym'
title: TUI
x-i18n:
    generated_at: "2026-04-24T09:39:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6168ab6cec8e0069f660ddcfca03275c407b613b6eb756aa6ef7e97f2312effe
    source_path: web/tui.md
    workflow: 15
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

Użyj `--password`, jeśli Twój Gateway korzysta z uwierzytelniania hasłem.

### Tryb lokalny

Uruchom TUI bez Gateway:

```bash
openclaw chat
# lub
openclaw tui --local
```

Uwagi:

- `openclaw chat` i `openclaw terminal` to aliasy dla `openclaw tui --local`.
- `--local` nie można łączyć z `--url`, `--token` ani `--password`.
- Tryb lokalny korzysta bezpośrednio z osadzonego środowiska uruchomieniowego agenta. Większość lokalnych narzędzi działa, ale funkcje dostępne tylko w Gateway są niedostępne.

## Co widzisz

- Nagłówek: URL połączenia, bieżący agent, bieżąca sesja.
- Log czatu: wiadomości użytkownika, odpowiedzi asystenta, komunikaty systemowe, karty narzędzi.
- Wiersz stanu: stan połączenia/przebiegu (łączenie, uruchomiony, strumieniowanie, bezczynność, błąd).
- Stopka: stan połączenia + agent + sesja + model + think/fast/verbose/trace/reasoning + liczba tokenów + deliver.
- Pole wejściowe: edytor tekstu z autouzupełnianiem.

## Model mentalny: agenci + sesje

- Agenci to unikalne slugi (np. `main`, `research`). Gateway udostępnia ich listę.
- Sesje należą do bieżącego agenta.
- Klucze sesji są przechowywane jako `agent:<agentId>:<sessionKey>`.
  - Jeśli wpiszesz `/session main`, TUI rozwinie to do `agent:<currentAgent>:main`.
  - Jeśli wpiszesz `/session agent:other:main`, jawnie przełączysz się na sesję tego agenta.
- Zakres sesji:
  - `per-sender` (domyślnie): każdy agent ma wiele sesji.
  - `global`: TUI zawsze używa sesji `global` (selektor może być pusty).
- Bieżący agent + sesja są zawsze widoczne w stopce.

## Wysyłanie + dostarczanie

- Wiadomości są wysyłane do Gateway; dostarczanie do dostawców jest domyślnie wyłączone.
- Włącz dostarczanie:
  - `/deliver on`
  - albo w panelu Ustawienia
  - albo uruchom przez `openclaw tui --deliver`

## Selektory + nakładki

- Selektor modeli: wyświetla dostępne modele i ustawia nadpisanie dla sesji.
- Selektor agentów: wybierz innego agenta.
- Selektor sesji: pokazuje tylko sesje dla bieżącego agenta.
- Ustawienia: przełączanie deliver, rozwijania danych wyjściowych narzędzi i widoczności myślenia.

## Skróty klawiaturowe

- Enter: wyślij wiadomość
- Esc: przerwij aktywny przebieg
- Ctrl+C: wyczyść pole wejściowe (naciśnij dwa razy, aby wyjść)
- Ctrl+D: wyjdź
- Ctrl+L: selektor modeli
- Ctrl+G: selektor agentów
- Ctrl+P: selektor sesji
- Ctrl+O: przełącz rozwijanie danych wyjściowych narzędzi
- Ctrl+T: przełącz widoczność myślenia (przeładowuje historię)

## Polecenia ukośnikowe

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

- `/new` lub `/reset` (resetuje sesję)
- `/abort` (przerywa aktywny przebieg)
- `/settings`
- `/exit`

Tylko w trybie lokalnym:

- `/auth [provider]` otwiera przepływ uwierzytelniania/logowania dostawcy wewnątrz TUI.

Inne polecenia ukośnikowe Gateway (na przykład `/context`) są przekazywane do Gateway i pokazywane jako dane wyjściowe systemu. Zobacz [Polecenia ukośnikowe](/pl/tools/slash-commands).

## Lokalne polecenia powłoki

- Dodaj `!` na początku wiersza, aby uruchomić lokalne polecenie powłoki na hoście TUI.
- TUI pyta raz na sesję o zgodę na lokalne wykonywanie; odmowa pozostawia `!` wyłączone dla tej sesji.
- Polecenia uruchamiają się w świeżej, nieinteraktywnej powłoce w katalogu roboczym TUI (bez trwałego `cd`/env).
- Lokalne polecenia powłoki otrzymują `OPENCLAW_SHELL=tui-local` w swoim środowisku.
- Samotne `!` jest wysyłane jako zwykła wiadomość; początkowe spacje nie wyzwalają lokalnego exec.

## Naprawianie konfiguracji z lokalnego TUI

Używaj trybu lokalnego, gdy bieżąca konfiguracja już przechodzi walidację, a chcesz, by
osadzony agent sprawdził ją na tej samej maszynie, porównał z dokumentacją
i pomógł naprawić rozjazdy bez zależności od działającego Gateway.

Jeśli `openclaw config validate` już zgłasza błędy, najpierw zacznij od `openclaw configure`
albo `openclaw doctor --fix`. `openclaw chat` nie omija blokady nieprawidłowej
konfiguracji.

Typowa pętla:

1. Uruchom tryb lokalny:

```bash
openclaw chat
```

2. Powiedz agentowi, co ma sprawdzić, na przykład:

```text
Porównaj moją konfigurację uwierzytelniania gateway z dokumentacją i zasugeruj najmniejszą poprawkę.
```

3. Użyj lokalnych poleceń powłoki, aby uzyskać dokładne dane i przeprowadzić walidację:

```text
!openclaw config file
!openclaw docs gateway auth token secretref
!openclaw config validate
!openclaw doctor
```

4. Zastosuj wąskie zmiany za pomocą `openclaw config set` lub `openclaw configure`, a potem ponownie uruchom `!openclaw config validate`.
5. Jeśli Doctor zaleca automatyczną migrację lub naprawę, przejrzyj ją i uruchom `!openclaw doctor --fix`.

Wskazówki:

- Preferuj `openclaw config set` lub `openclaw configure` zamiast ręcznego edytowania `openclaw.json`.
- `openclaw docs "<query>"` przeszukuje indeks aktualnej dokumentacji z tej samej maszyny.
- `openclaw config validate --json` jest przydatne, gdy chcesz uzyskać uporządkowane błędy schematu i SecretRef/rozwiązywalności.

## Dane wyjściowe narzędzi

- Wywołania narzędzi są pokazywane jako karty z argumentami + wynikami.
- Ctrl+O przełącza między widokiem zwiniętym i rozwiniętym.
- Podczas działania narzędzi częściowe aktualizacje są strumieniowane do tej samej karty.

## Kolory terminala

- TUI pozostawia treść odpowiedzi asystenta w domyślnym kolorze pierwszego planu terminala, aby zarówno ciemne, jak i jasne terminale pozostawały czytelne.
- Jeśli Twój terminal używa jasnego tła, a automatyczne wykrywanie się myli, ustaw `OPENCLAW_THEME=light` przed uruchomieniem `openclaw tui`.
- Aby zamiast tego wymusić oryginalną ciemną paletę, ustaw `OPENCLAW_THEME=dark`.

## Historia + strumieniowanie

- Przy połączeniu TUI ładuje najnowszą historię (domyślnie 200 wiadomości).
- Odpowiedzi strumieniowane są aktualizowane na miejscu aż do finalizacji.
- TUI nasłuchuje także zdarzeń narzędzi agenta, aby wyświetlać bogatsze karty narzędzi.

## Szczegóły połączenia

- TUI rejestruje się w Gateway jako `mode: "tui"`.
- Ponowne połączenia pokazują komunikat systemowy; luki w zdarzeniach są ujawniane w logu.

## Opcje

- `--local`: uruchom względem lokalnego osadzonego środowiska uruchomieniowego agenta
- `--url <url>`: URL WebSocket Gateway (domyślnie z konfiguracji albo `ws://127.0.0.1:<port>`)
- `--token <token>`: token Gateway (jeśli wymagany)
- `--password <password>`: hasło Gateway (jeśli wymagane)
- `--session <key>`: klucz sesji (domyślnie: `main`, albo `global`, gdy zakres jest globalny)
- `--deliver`: dostarczaj odpowiedzi asystenta do dostawcy (domyślnie wyłączone)
- `--thinking <level>`: nadpisz poziom myślenia dla wysyłek
- `--message <text>`: wyślij początkową wiadomość po połączeniu
- `--timeout-ms <ms>`: limit czasu agenta w ms (domyślnie `agents.defaults.timeoutSeconds`)
- `--history-limit <n>`: liczba wpisów historii do załadowania (domyślnie `200`)

Uwaga: gdy ustawisz `--url`, TUI nie wraca do poświadczeń z konfiguracji ani środowiska.
Przekaż jawnie `--token` lub `--password`. Brak jawnych poświadczeń jest błędem.
W trybie lokalnym nie przekazuj `--url`, `--token` ani `--password`.

## Rozwiązywanie problemów

Brak danych wyjściowych po wysłaniu wiadomości:

- Uruchom `/status` w TUI, aby potwierdzić, że Gateway jest połączony i jest bezczynny/zajęty.
- Sprawdź logi Gateway: `openclaw logs --follow`.
- Potwierdź, że agent może działać: `openclaw status` i `openclaw models status`.
- Jeśli oczekujesz wiadomości w kanale czatu, włącz dostarczanie (`/deliver on` albo `--deliver`).

## Rozwiązywanie problemów z połączeniem

- `disconnected`: upewnij się, że Gateway działa i że Twoje `--url/--token/--password` są poprawne.
- Brak agentów w selektorze: sprawdź `openclaw agents list` i swoją konfigurację routingu.
- Pusty selektor sesji: możesz być w zakresie globalnym albo nie mieć jeszcze żadnych sesji.

## Powiązane

- [Control UI](/pl/web/control-ui) — webowy interfejs sterowania
- [Config](/pl/cli/config) — sprawdzanie, walidacja i edycja `openclaw.json`
- [Doctor](/pl/cli/doctor) — prowadzone naprawy i kontrole migracji
- [Dokumentacja referencyjna CLI](/pl/cli) — pełna dokumentacja referencyjna poleceń CLI
