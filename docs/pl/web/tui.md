---
read_when:
    - Chcesz przyjaznego dla początkujących przewodnika po TUI
    - Potrzebujesz pełnej listy funkcji, poleceń i skrótów TUI
summary: 'Terminal UI (TUI): połącz się z Gateway lub uruchom lokalnie w trybie osadzonym'
title: TUI
x-i18n:
    generated_at: "2026-06-27T18:33:37Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ed02875ea5dcb8cef987d16fe11701eba11160525caf9791f74c610b1b6bec6e
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
- Po tym, jak plik konfiguracji będzie zawierał ustawienia, `openclaw` i `openclaw crestodian` również używają tej powłoki TUI, z Crestodian jako lokalnym backendem czatu do konfiguracji i napraw.

## Co zobaczysz

- Nagłówek: URL połączenia, bieżący agent, bieżąca sesja.
- Dziennik czatu: wiadomości użytkownika, odpowiedzi asystenta, powiadomienia systemowe, karty narzędzi.
- Wiersz statusu: stan połączenia/uruchomienia (łączenie, działanie, streaming, bezczynność, błąd).
- Stopka: agent + sesja + model + stan celu + think/fast/verbose/trace/reasoning + liczba tokenów + dostarczanie. Gdy `tui.footer.showRemoteHost` jest włączone, zdalne połączenia Gateway pokazują też host połączenia.
- Wejście: edytor tekstu z autouzupełnianiem.

## Model mentalny: agenci + sesje

- Agenci to unikalne slugi (np. `main`, `research`). Gateway udostępnia listę.
- Sesje należą do bieżącego agenta.
- Klucze sesji są przechowywane jako `agent:<agentId>:<sessionKey>`.
  - Jeśli wpiszesz `/session main`, TUI rozszerzy to do `agent:<currentAgent>:main`.
  - Jeśli wpiszesz `/session agent:other:main`, jawnie przełączysz się na sesję tego agenta.
- Zakres sesji:
  - `per-sender` (domyślnie): każdy agent ma wiele sesji.
  - `global`: TUI zawsze używa sesji `global` (selektor może być pusty).
- Bieżący agent + sesja są zawsze widoczne w stopce.
- Aby pokazywać host Gateway dla połączeń opartych na nielokalnym URL, włącz tę opcję:

  ```bash
  openclaw config set tui.footer.showRemoteHost true
  ```

  Połączenia Loopback i wbudowane połączenia lokalne nigdy nie pokazują etykiety hosta.

- Jeśli sesja ma [cel](/pl/tools/goal), stopka pokazuje jego zwięzły stan,
  taki jak `Pursuing goal`, `Goal paused (/goal resume)` lub
  `Goal achieved`.
- Po uruchomieniu bez `--session` TUI w trybie Gateway wznawia ostatnio wybraną sesję dla tego samego gateway, agenta i zakresu sesji, jeśli ta sesja nadal istnieje. Przekazanie `--session`, `/session`, `/new` lub `/reset` pozostaje jawne.

## Wysyłanie + dostarczanie

- Wiadomości są wysyłane do Gateway; dostarczanie do dostawców jest domyślnie wyłączone.
- TUI jest wewnętrzną powierzchnią źródłową, taką jak WebChat, a nie ogólnym kanałem wychodzącym. Harnessy wymagające `tools.message` dla widocznych odpowiedzi mogą obsłużyć aktywną turę TUI za pomocą bezdocelowego `message.send`; jawne dostarczanie do dostawcy nadal używa normalnie skonfigurowanych kanałów i nigdy nie przechodzi awaryjnie na `lastChannel`.
- Włącz dostarczanie:
  - `/deliver on`
  - albo w panelu Settings
  - albo uruchom z `openclaw tui --deliver`

## Selektory + nakładki

- Selektor modelu: wyświetla dostępne modele i ustawia nadpisanie dla sesji.
- Selektor agenta: wybierz innego agenta.
- Selektor sesji: pokazuje do 50 sesji bieżącego agenta zaktualizowanych w ostatnich 7 dniach. Użyj `/session <key>`, aby przejść do starszej znanej sesji.
- Ustawienia: przełącz dostarczanie, rozwijanie danych wyjściowych narzędzi i widoczność myślenia.

## Skróty klawiaturowe

- Enter: wyślij wiadomość
- Esc: przerwij aktywne uruchomienie
- Ctrl+C: wyczyść wejście (naciśnij dwa razy, aby wyjść)
- Ctrl+D: wyjdź
- Ctrl+L: selektor modelu
- Ctrl+G: selektor agenta
- Ctrl+P: selektor sesji
- Ctrl+O: przełącz rozwijanie danych wyjściowych narzędzi
- Ctrl+T: przełącz widoczność myślenia (ponownie ładuje historię)

## Polecenia ukośnikiem

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
- `/usage <off|tokens|full|reset>` (`reset`/`inherit`/`clear`/`default` czyści nadpisanie sesji)
- `/goal [status] | /goal start <objective> | /goal pause|resume|complete|block|clear`
- `/elevated <on|off|ask|full>` (alias: `/elev`)
- `/activation <mention|always>`
- `/deliver <on|off>`

Cykl życia sesji:

- `/new` lub `/reset` (resetuje sesję)
- `/abort` (przerywa aktywne uruchomienie)
- `/settings`
- `/exit`

Tylko tryb lokalny:

- `/auth [provider]` otwiera przepływ uwierzytelniania/logowania dostawcy wewnątrz TUI.

Inne polecenia ukośnikiem Gateway (na przykład `/context`) są przekazywane do Gateway i pokazywane jako wyjście systemowe. Zobacz [Polecenia ukośnikiem](/pl/tools/slash-commands).

## Lokalne polecenia powłoki

- Poprzedź wiersz znakiem `!`, aby uruchomić lokalne polecenie powłoki na hoście TUI.
- TUI raz na sesję prosi o zezwolenie na lokalne wykonywanie; odmowa pozostawia `!` wyłączone dla sesji.
- Polecenia działają w świeżej, nieinteraktywnej powłoce w katalogu roboczym TUI (bez trwałego `cd`/env).
- Lokalne polecenia powłoki otrzymują w swoim środowisku `OPENCLAW_SHELL=tui-local`.
- Samotny `!` jest wysyłany jako normalna wiadomość; początkowe spacje nie uruchamiają lokalnego wykonania.

## Naprawa konfiguracji z lokalnego TUI

Użyj trybu lokalnego, gdy bieżąca konfiguracja już przechodzi walidację i chcesz, aby
wbudowany agent sprawdził ją na tej samej maszynie, porównał z dokumentacją
i pomógł naprawić dryf bez zależności od działającego Gateway.

Jeśli `openclaw config validate` już kończy się niepowodzeniem, zacznij od `openclaw configure`
lub najpierw `openclaw doctor --fix`. `openclaw chat` nie omija zabezpieczenia przed nieprawidłową
konfiguracją.

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
5. Jeśli Doctor zaleca automatyczną migrację lub naprawę, przejrzyj ją i uruchom `!openclaw doctor --fix`.

Wskazówki:

- Preferuj `openclaw config set` lub `openclaw configure` zamiast ręcznej edycji `openclaw.json`.
- `openclaw docs "<query>"` przeszukuje indeks dokumentacji live z tej samej maszyny.
- `openclaw config validate --json` jest przydatne, gdy potrzebujesz ustrukturyzowanych błędów schematu i rozwiązywalności SecretRef.

## Dane wyjściowe narzędzi

- Wywołania narzędzi są pokazywane jako karty z argumentami + wynikami.
- Ctrl+O przełącza między widokami zwiniętym i rozwiniętym.
- Podczas działania narzędzi częściowe aktualizacje streamują do tej samej karty.

## Kolory terminala

- TUI zachowuje tekst główny asystenta w domyślnym kolorze pierwszego planu terminala, aby zarówno ciemne, jak i jasne terminale pozostały czytelne.
- Jeśli terminal używa jasnego tła, a automatyczne wykrywanie jest błędne, ustaw `OPENCLAW_THEME=light` przed uruchomieniem `openclaw tui`.
- Aby zamiast tego wymusić oryginalną ciemną paletę, ustaw `OPENCLAW_THEME=dark`.

## Historia + streaming

- Po połączeniu TUI ładuje najnowszą historię (domyślnie 200 wiadomości).
- Odpowiedzi streamingowe aktualizują się w miejscu do czasu finalizacji.
- TUI nasłuchuje też zdarzeń narzędzi agenta, aby tworzyć bogatsze karty narzędzi.

## Szczegóły połączenia

- TUI rejestruje się w Gateway jako `mode: "tui"`.
- Ponowne połączenia pokazują komunikat systemowy; luki w zdarzeniach są ujawniane w dzienniku.

## Opcje

- `--local`: Uruchom względem lokalnego wbudowanego środowiska uruchomieniowego agenta
- `--url <url>`: URL WebSocket Gateway (domyślnie z konfiguracji lub `ws://127.0.0.1:<port>`)
- `--token <token>`: Token Gateway (jeśli wymagany)
- `--password <password>`: Hasło Gateway (jeśli wymagane)
- `--session <key>`: Klucz sesji (domyślnie: `main`, lub `global`, gdy zakres jest globalny)
- `--deliver`: Dostarczaj odpowiedzi asystenta do dostawcy (domyślnie wyłączone)
- `--thinking <level>`: Nadpisz poziom myślenia dla wysyłek
- `--message <text>`: Wyślij początkową wiadomość po połączeniu
- `--timeout-ms <ms>`: Limit czasu agenta w ms (domyślnie `agents.defaults.timeoutSeconds`)
- `--history-limit <n>`: Wpisy historii do załadowania (domyślnie `200`)

<Warning>
Gdy ustawisz `--url`, TUI nie przechodzi awaryjnie na poświadczenia z konfiguracji ani środowiska. Przekaż jawnie `--token` lub `--password`. Brak jawnych poświadczeń jest błędem. W trybie lokalnym nie przekazuj `--url`, `--token` ani `--password`.
</Warning>

## Rozwiązywanie problemów

Brak danych wyjściowych po wysłaniu wiadomości:

- Uruchom `/status` w TUI, aby potwierdzić, że Gateway jest połączony i bezczynny/zajęty.
- Sprawdź dzienniki Gateway: `openclaw logs --follow`.
- Potwierdź, że agent może działać: `openclaw status` i `openclaw models status`.
- Jeśli oczekujesz wiadomości w kanale czatu, włącz dostarczanie (`/deliver on` lub `--deliver`).

## Rozwiązywanie problemów z połączeniem

- `disconnected`: upewnij się, że Gateway działa, a Twoje `--url/--token/--password` są poprawne.
- Brak agentów w selektorze: sprawdź `openclaw agents list` i konfigurację routingu.
- Pusty selektor sesji: możesz być w zakresie globalnym albo nie mieć jeszcze żadnych sesji.

## Powiązane

- [Control UI](/pl/web/control-ui) — webowy interfejs sterowania
- [Config](/pl/cli/config) — sprawdzaj, waliduj i edytuj `openclaw.json`
- [Doctor](/pl/cli/doctor) — wspomagane kontrole naprawy i migracji
- [Dokumentacja CLI](/pl/cli) — pełna dokumentacja poleceń CLI
