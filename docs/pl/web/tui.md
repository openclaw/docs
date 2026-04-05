---
read_when:
    - Chcesz przyjaznego dla początkujących omówienia TUI
    - Potrzebujesz pełnej listy funkcji, poleceń i skrótów TUI
summary: 'Terminal UI (TUI): połącz się z Gateway z dowolnej maszyny'
title: TUI
x-i18n:
    generated_at: "2026-04-05T14:11:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: a73f70d65ecc7bff663e8df28c07d70d2920d4732fbb8288c137d65b8653ac52
    source_path: web/tui.md
    workflow: 15
---

# TUI (Terminal UI)

## Szybki start

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

## Co widzisz

- Nagłówek: URL połączenia, bieżący agent, bieżąca sesja.
- Log czatu: wiadomości użytkownika, odpowiedzi asystenta, komunikaty systemowe, karty narzędzi.
- Linia statusu: stan połączenia/przebiegu (łączenie, uruchomione, streamowanie, bezczynność, błąd).
- Stopka: stan połączenia + agent + sesja + model + think/fast/verbose/reasoning + liczba tokenów + deliver.
- Pole wejściowe: edytor tekstu z autouzupełnianiem.

## Model mentalny: agenci + sesje

- Agenci to unikalne slugi (np. `main`, `research`). Gateway udostępnia ich listę.
- Sesje należą do bieżącego agenta.
- Klucze sesji są przechowywane jako `agent:<agentId>:<sessionKey>`.
  - Jeśli wpiszesz `/session main`, TUI rozwinie to do `agent:<currentAgent>:main`.
  - Jeśli wpiszesz `/session agent:other:main`, jawnie przełączysz się na sesję tego agenta.
- Zakres sesji:
  - `per-sender` (domyślnie): każdy agent ma wiele sesji.
  - `global`: TUI zawsze używa sesji `global` (picker może być pusty).
- Bieżący agent + sesja są zawsze widoczne w stopce.

## Wysyłanie + dostarczanie

- Wiadomości są wysyłane do Gateway; dostarczanie do providerów jest domyślnie wyłączone.
- Włącz dostarczanie:
  - `/deliver on`
  - albo panel Settings
  - albo uruchom przez `openclaw tui --deliver`

## Pickery + nakładki

- Picker modeli: wyświetla dostępne modele i ustawia nadpisanie sesji.
- Picker agentów: wybiera innego agenta.
- Picker sesji: pokazuje tylko sesje dla bieżącego agenta.
- Settings: przełącza deliver, rozwijanie outputu narzędzi i widoczność thinking.

## Skróty klawiaturowe

- Enter: wyślij wiadomość
- Esc: przerwij aktywny przebieg
- Ctrl+C: wyczyść pole wejściowe (naciśnij dwa razy, aby wyjść)
- Ctrl+D: wyjście
- Ctrl+L: picker modeli
- Ctrl+G: picker agentów
- Ctrl+P: picker sesji
- Ctrl+O: przełącz rozwijanie outputu narzędzi
- Ctrl+T: przełącz widoczność thinking (przeładowuje historię)

## Polecenia slash

Podstawowe:

- `/help`
- `/status`
- `/agent <id>` (albo `/agents`)
- `/session <key>` (albo `/sessions`)
- `/model <provider/model>` (albo `/models`)

Sterowanie sesją:

- `/think <off|minimal|low|medium|high>`
- `/fast <status|on|off>`
- `/verbose <on|full|off>`
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

Inne polecenia slash Gateway (na przykład `/context`) są przekazywane do Gateway i pokazywane jako output systemowy. Zobacz [Polecenia slash](/tools/slash-commands).

## Lokalne polecenia powłoki

- Poprzedź linię znakiem `!`, aby uruchomić lokalne polecenie powłoki na hoście TUI.
- TUI pyta raz na sesję o zgodę na lokalne wykonanie; odmowa pozostawia `!` wyłączone dla sesji.
- Polecenia są uruchamiane w świeżej, nieinteraktywnej powłoce w katalogu roboczym TUI (bez trwałego `cd`/env).
- Lokalne polecenia powłoki otrzymują `OPENCLAW_SHELL=tui-local` w swoim środowisku.
- Samotne `!` jest wysyłane jako zwykła wiadomość; początkowe spacje nie uruchamiają lokalnego `exec`.

## Output narzędzi

- Wywołania narzędzi są pokazywane jako karty z argumentami + wynikami.
- Ctrl+O przełącza między widokiem zwiniętym/rozwiniętym.
- Gdy narzędzia działają, częściowe aktualizacje streamują do tej samej karty.

## Kolory terminala

- TUI zachowuje tekst treści asystenta w domyślnym kolorze pierwszego planu Twojego terminala, dzięki czemu zarówno ciemne, jak i jasne terminale pozostają czytelne.
- Jeśli Twój terminal używa jasnego tła i automatyczne wykrywanie jest błędne, ustaw `OPENCLAW_THEME=light` przed uruchomieniem `openclaw tui`.
- Aby zamiast tego wymusić oryginalną ciemną paletę, ustaw `OPENCLAW_THEME=dark`.

## Historia + streamowanie

- Po połączeniu TUI ładuje najnowszą historię (domyślnie 200 wiadomości).
- Odpowiedzi streamowane aktualizują się w miejscu aż do finalizacji.
- TUI nasłuchuje też zdarzeń narzędzi agenta, aby tworzyć bogatsze karty narzędzi.

## Szczegóły połączenia

- TUI rejestruje się w Gateway jako `mode: "tui"`.
- Ponowne połączenia pokazują komunikat systemowy; luki w zdarzeniach są sygnalizowane w logu.

## Opcje

- `--url <url>`: URL WebSocket Gateway (domyślnie z config albo `ws://127.0.0.1:<port>`)
- `--token <token>`: token Gateway (jeśli wymagany)
- `--password <password>`: hasło Gateway (jeśli wymagane)
- `--session <key>`: klucz sesji (domyślnie: `main`, albo `global`, gdy zakres jest globalny)
- `--deliver`: dostarczaj odpowiedzi asystenta do providera (domyślnie wyłączone)
- `--thinking <level>`: nadpisuje poziom thinking dla wysyłanych wiadomości
- `--message <text>`: wyślij początkową wiadomość po połączeniu
- `--timeout-ms <ms>`: timeout agenta w ms (domyślnie `agents.defaults.timeoutSeconds`)
- `--history-limit <n>`: liczba wpisów historii do załadowania (domyślnie `200`)

Uwaga: gdy ustawisz `--url`, TUI nie wraca do poświadczeń z config ani środowiska.
Przekaż jawnie `--token` albo `--password`. Brak jawnych poświadczeń jest błędem.

## Rozwiązywanie problemów

Brak outputu po wysłaniu wiadomości:

- Uruchom `/status` w TUI, aby potwierdzić, że Gateway jest połączony i bezczynny/zajęty.
- Sprawdź logi Gateway: `openclaw logs --follow`.
- Potwierdź, że agent może działać: `openclaw status` i `openclaw models status`.
- Jeśli oczekujesz wiadomości na kanale czatu, włącz dostarczanie (`/deliver on` lub `--deliver`).

## Rozwiązywanie problemów z połączeniem

- `disconnected`: upewnij się, że Gateway działa oraz że `--url/--token/--password` są poprawne.
- Brak agentów w pickerze: sprawdź `openclaw agents list` i swoją konfigurację routingu.
- Pusty picker sesji: możesz być w zakresie globalnym albo nie mieć jeszcze żadnych sesji.

## Powiązane

- [Control UI](/web/control-ui) — internetowy interfejs sterowania
- [CLI Reference](/cli) — pełna referencja poleceń CLI
