---
read_when:
    - Potrzebujesz przystępnego dla początkujących przewodnika po TUI
    - Potrzebna jest pełna lista funkcji, poleceń i skrótów TUI
summary: 'Interfejs terminalowy (TUI): połączenie z Gateway lub uruchomienie lokalnie w trybie osadzonym'
title: TUI
x-i18n:
    generated_at: "2026-07-16T19:14:23Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 1e171520c24d95ac1d6df28227efea0a1258a0b9e59b61fe02c09a2d87b24391
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

- `openclaw chat` i `openclaw terminal` są aliasami `openclaw tui --local`.
- `--local` nie można łączyć z `--url`, `--token` ani `--password`.
- Tryb lokalny korzysta bezpośrednio z osadzonego środowiska uruchomieniowego agenta. Większość narzędzi lokalnych działa, ale funkcje dostępne wyłącznie w Gateway są niedostępne.
- Samo `openclaw` (bez podpolecenia) automatycznie wybiera cel: nieskonfigurowana instalacja uruchamia wdrażanie wnioskowania; nieprawidłowa konfiguracja otwiera klasyczne wskazówki narzędzia Doctor; osiągalny, skonfigurowany Gateway otwiera tę powłokę TUI w trybie Gateway; w przeciwnym razie skonfigurowany model lokalny otwiera ją w trybie lokalnym.

## Co jest wyświetlane

- Nagłówek: adres URL połączenia, bieżący agent, bieżąca sesja.
- Dziennik czatu: wiadomości użytkownika, odpowiedzi asystenta, powiadomienia systemowe, karty narzędzi.
- Wiersz stanu: stan połączenia/wykonania (łączenie, działanie, strumieniowanie, bezczynność, błąd).
- Stopka: agent + sesja + model + stan celu + myślenie/tryb szybki/szczegółowość/śledzenie/rozumowanie + liczba tokenów + dostarczanie. Gdy włączono `tui.footer.showRemoteHost`, zdalne połączenia z Gateway pokazują również hosta połączenia.
- Pole wprowadzania: edytor tekstu z autouzupełnianiem.

## Model mentalny: agenci + sesje

- Agenci mają unikatowe identyfikatory tekstowe (np. `main`, `research`). Gateway udostępnia ich listę.
- Sesje należą do bieżącego agenta.
- Klucze sesji są przechowywane jako `agent:<agentId>:<sessionKey>`.
  - Po wpisaniu `/session main` TUI rozwija je do `agent:<currentAgent>:main`.
  - Po wpisaniu `/session agent:other:main` następuje jawne przełączenie na sesję tego agenta.
- Zakres sesji:
  - `per-sender` (domyślnie): każdy agent ma wiele sesji.
  - `global`: TUI zawsze używa sesji `global` (selektor może być pusty).
- Bieżący agent i sesja są zawsze widoczne w stopce.
- Aby wyświetlić hosta Gateway dla nielokalnych połączeń opartych na adresie URL, włącz tę opcję za pomocą:

  ```bash
  openclaw config set tui.footer.showRemoteHost true
  ```

  Wartość domyślna to `false`. Połączenia zwrotne i osadzone połączenia lokalne nigdy nie pokazują etykiety hosta.

- Jeśli sesja ma [cel](/pl/tools/goal), stopka pokazuje jego skrócony stan:
  `Pursuing goal`, `Goal paused (/goal resume)`, `Goal blocked (/goal resume)` lub `Goal achieved`.
- Po uruchomieniu bez `--session` TUI w trybie Gateway wznawia ostatnio wybraną sesję dla tego samego Gateway, agenta i zakresu sesji, jeśli ta sesja nadal istnieje. Przekazanie `--session`, `/session`, `/new` lub `/reset` pozostaje wyborem jawnym.

## Wysyłanie + dostarczanie

- Wiadomości zawsze trafiają do Gateway (lub osadzonego środowiska uruchomieniowego w trybie lokalnym); dostarczenie odpowiedzi asystenta z powrotem do dostawcy czatu jest osobnym krokiem, domyślnie wyłączonym.
- TUI jest wewnętrznym interfejsem źródłowym, podobnie jak WebChat, a nie ogólnym kanałem wychodzącym. Środowiska wymagające `tools.message` do wyświetlania odpowiedzi mogą obsłużyć aktywną turę TUI za pomocą bezcelowego `message.send`; jawne dostarczanie przez dostawcę nadal korzysta ze zwykłych skonfigurowanych kanałów i nigdy nie przełącza się awaryjnie na `lastChannel`.
- Ustawienie dostarczania obowiązuje przez całą sesję TUI od chwili uruchomienia: aby je włączyć, uruchom z `openclaw tui --deliver`. Nie ma polecenia ukośnikowego `/deliver` ani przełącznika w Ustawieniach pozwalającego zmienić je w trakcie sesji; aby je zmienić, uruchom TUI ponownie.

## Selektory + nakładki

- Selektor modelu: wyświetla dostępne modele i ustawia nadpisanie dla sesji.
- Selektor agenta: umożliwia wybór innego agenta.
- Selektor sesji: pokazuje maksymalnie 50 sesji bieżącego agenta zaktualizowanych w ciągu ostatnich 7 dni. Użyj `/session <key>`, aby przejść do starszej znanej sesji.
- Ustawienia (`/settings`): przełączanie rozwinięcia wyników narzędzi i widoczności procesu myślenia. Ten panel nie steruje dostarczaniem.

## Skróty klawiaturowe

- Enter: wyślij wiadomość
- Esc: przerwij aktywne wykonanie
- Ctrl+C: wyczyść pole wprowadzania (naciśnij dwukrotnie, aby zakończyć)
- Ctrl+D: zakończ
- Ctrl+L: selektor modelu
- Ctrl+G: selektor agenta
- Ctrl+P: selektor sesji
- Ctrl+O: przełącz rozwinięcie wyników narzędzi
- Ctrl+T: przełącz widoczność procesu myślenia (ponownie wczytuje historię)

## Polecenia ukośnikowe

Podstawowe:

- `/help`
- `/status` (przekazywane do Gateway; pokazuje podsumowanie sesji/modelu)
- `/gateway-status` (alias `/gwstatus`; bezpośrednio pokazuje stan połączenia z Gateway)
- `/agent <id>` (lub `/agents`)
- `/session <key>` (lub `/sessions`)
- `/model <provider/model>` (lub `/models`)

Sterowanie sesją:

- `/think <off|minimal|low|medium|high>` (wyższe poziomy mogą dodawać ustawienia takie jak `xhigh`/`max`, zależnie od modelu)
- `/fast <status|auto|on|off>`
- `/verbose <on|full|off>`
- `/trace <on|off>`
- `/reasoning <on|off|stream>`
- `/usage <off|tokens|full|reset>` (`reset`/`inherit`/`clear`/`default` usuwa nadpisanie sesji)
- `/goal [status] | /goal start <objective> | /goal edit <objective> | /goal pause|resume|complete|block|clear`
- `/elevated <on|off|ask|full>` (alias: `/elev`)
- `/activation <mention|always>`

Cykl życia sesji:

- `/new` (tworzy nową, odizolowaną sesję z nowym kluczem; nie wpływa na innych klientów TUI korzystających ze starej sesji)
- `/reset` (resetuje bieżący klucz sesji w miejscu)
- `/abort` (przerywa aktywne wykonanie)
- `/settings`
- `/exit` (lub `/quit`)

Tylko tryb lokalny:

- `/auth [provider]` otwiera proces uwierzytelniania/logowania u dostawcy wewnątrz TUI.

OpenClaw:

- `/openclaw [request]` pozwala wrócić ze zwykłego TUI agenta do czatu konfiguracji/naprawy [OpenClaw](#openclaw-setup-and-repair-helper), opcjonalnie przekazując jedno żądanie.

Inne polecenia ukośnikowe Gateway (na przykład `/context`) są przekazywane do Gateway i wyświetlane jako wynik systemowy. Zobacz [Polecenia ukośnikowe](/pl/tools/slash-commands).

## Lokalne polecenia powłoki

- Poprzedź wiersz ciągiem `!`, aby uruchomić lokalne polecenie powłoki na hoście TUI.
- TUI raz na sesję prosi o zezwolenie na lokalne wykonywanie poleceń; odmowa pozostawia `!` wyłączone w tej sesji.
- Polecenia działają w nowej, nieinteraktywnej powłoce w katalogu roboczym TUI (bez trwałego `cd`/środowiska).
- Lokalne polecenia powłoki otrzymują w swoim środowisku `OPENCLAW_SHELL=tui-local`.
- Samotne `!` jest wysyłane jako zwykła wiadomość; początkowe spacje nie uruchamiają lokalnego wykonywania.

## Pomocnik konfiguracji i naprawy OpenClaw

OpenClaw jest asystentem konfiguracji/naprawy poziomu zerowego, udostępnianym jako `openclaw setup` po pomyślnym sprawdzeniu wnioskowania na żywo przez skonfigurowany model domyślny. Jeśli wnioskowanie jest niedostępne, wywołanie interaktywne wraca do wdrażania wnioskowania, a automatyzacja kończy się niepowodzeniem ze wskazówkami dotyczącymi naprawy. Działa wewnątrz tej samej lokalnej powłoki TUI co `openclaw tui --local` i korzysta z agenta AI ograniczonego do typowanych operacji OpenClaw wymagających zatwierdzenia:

```bash
openclaw setup                       # uruchom interaktywnie
openclaw setup -m "status"           # wykonaj jedno żądanie i zakończ
openclaw setup -m "set default model openai/gpt-5.2" --yes   # zastosuj zapis konfiguracji
```

- Trwałe zapisy konfiguracji wymagają zatwierdzenia: potwierdź je interaktywnie albo przekaż `--yes`.
- `--json` wyświetla przegląd początkowy jako JSON zamiast uruchamiać czat.
- Wewnątrz OpenClaw żądanie `open-tui` (na przykład prośba o rozmowę ze zwykłym agentem) zamyka OpenClaw i otwiera standardowe TUI agenta; aby wrócić, użyj tam `/openclaw`.

Trybu lokalnego należy używać, gdy bieżąca konfiguracja przechodzi już walidację i osadzony agent ma ją sprawdzić na tym samym komputerze, porównać z dokumentacją i pomóc naprawić rozbieżności bez zależności od działającego Gateway.

Jeśli `openclaw config validate` już kończy się niepowodzeniem, zacznij najpierw od `openclaw configure` lub `openclaw doctor --fix`; `openclaw chat` nadal wymaga możliwej do wczytania konfiguracji, aby się uruchomić.

Typowy cykl:

1. Uruchom tryb lokalny:

```bash
openclaw chat
```

2. Poproś agenta o wykonanie kontroli, na przykład:

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

4. Zastosuj precyzyjne zmiany za pomocą `openclaw config set` lub `openclaw configure`, a następnie ponownie uruchom `!openclaw config validate`.
5. Jeśli Doctor zaleci automatyczną migrację lub naprawę, przejrzyj ją i uruchom `!openclaw doctor --fix`.

Wskazówki:

- Zamiast ręcznej edycji `openclaw.json` preferuj `openclaw config set` lub `openclaw configure`.
- `openclaw docs "<query>"` przeszukuje aktualny indeks dokumentacji z tego samego komputera.
- `openclaw config validate --json` jest przydatne, gdy potrzebne są ustrukturyzowany schemat oraz błędy SecretRef/rozwiązywalności.

## Wyniki narzędzi

- Wywołania narzędzi są wyświetlane jako karty z argumentami i wynikami.
- Ctrl+O przełącza między widokiem zwiniętym i rozwiniętym.
- Podczas działania narzędzi częściowe aktualizacje są strumieniowane do tej samej karty.

## Kolory terminala

- TUI zachowuje dla głównego tekstu asystenta domyślny kolor pierwszoplanowy terminala, dzięki czemu tekst pozostaje czytelny zarówno w ciemnych, jak i jasnych terminalach.
- Jeśli terminal ma jasne tło, a automatyczne wykrywanie działa nieprawidłowo, ustaw `OPENCLAW_THEME=light` przed uruchomieniem `openclaw tui`.
- Aby zamiast tego wymusić oryginalną ciemną paletę, ustaw `OPENCLAW_THEME=dark`.

## Historia + strumieniowanie

- Po nawiązaniu połączenia TUI wczytuje najnowszą historię (domyślnie 200 wiadomości).
- Odpowiedzi strumieniowane są aktualizowane w miejscu do chwili ich ukończenia.
- TUI nasłuchuje również zdarzeń narzędzi agenta, aby wyświetlać bardziej szczegółowe karty narzędzi.

## Szczegóły połączenia

- TUI łączy się z identyfikatorem klienta `openclaw-tui` w ogólnym trybie klienta `ui` (tym samym, którego Control UI i WebChat używają na potrzeby zasad Gateway).
- Ponowne połączenia są sygnalizowane komunikatem systemowym; luki w zdarzeniach są widoczne w dzienniku.

## Opcje

- `--local`: Uruchom z lokalnym, wbudowanym środowiskiem uruchomieniowym agenta
- `--url <url>`: Adres URL WebSocket Gateway (domyślnie `gateway.remote.url` z konfiguracji lub `ws://127.0.0.1:<port>` dla interfejsu pętli zwrotnej)
- `--token <token>`: Token Gateway (jeśli wymagany)
- `--password <password>`: Hasło Gateway (jeśli wymagane)
- `--tls-fingerprint <sha256>`: Oczekiwany odcisk palca certyfikatu TLS dla Gateway `wss://` z przypiętym certyfikatem
- `--session <key>`: Klucz sesji (domyślnie: `main` lub `global`, gdy zakres jest globalny)
- `--deliver`: Dostarczaj odpowiedzi asystenta do dostawcy (domyślnie wyłączone)
- `--thinking <level>`: Zastąp poziom rozumowania dla wysyłanych wiadomości
- `--message <text>`: Wyślij wiadomość początkową po nawiązaniu połączenia
- `--timeout-ms <ms>`: Limit czasu agenta w ms (domyślnie `agents.defaults.timeoutSeconds`)
- `--history-limit <n>`: Liczba wpisów historii do wczytania (domyślnie `200`)

<Warning>
Po ustawieniu `--url` TUI nie korzysta awaryjnie z poświadczeń z konfiguracji ani zmiennych środowiskowych. Należy jawnie przekazać `--token` lub `--password`, a także `--tls-fingerprint`, gdy środowisko docelowe używa przypiętego certyfikatu. Brak jawnie podanych poświadczeń jest błędem. W trybie lokalnym nie należy przekazywać `--url`, `--token`, `--password` ani `--tls-fingerprint`.
</Warning>

## Rozwiązywanie problemów

Brak odpowiedzi po wysłaniu wiadomości:

- Uruchom `/status` w TUI, aby potwierdzić, że Gateway jest połączony i bezczynny lub zajęty.
- Sprawdź dzienniki Gateway: `openclaw logs --follow`.
- Potwierdź, że agent może działać: `openclaw status` i `openclaw models status`.
- Jeśli wiadomości mają pojawiać się na kanale czatu, potwierdź, że TUI uruchomiono z opcją `--deliver` (nie można jej włączyć później bez ponownego uruchomienia).

## Rozwiązywanie problemów z połączeniem

- `disconnected`: upewnij się, że Gateway działa, a `--url/--token/--password` są prawidłowe.
- Brak agentów na liście wyboru: sprawdź `openclaw agents list` i konfigurację routingu.
- Pusta lista wyboru sesji: być może używany jest zakres globalny albo nie ma jeszcze żadnych sesji.

## Powiązane

- [Interfejs sterowania](/pl/web/control-ui) — internetowy interfejs sterowania
- [Konfiguracja](/pl/cli/config) — sprawdzanie, weryfikowanie i edytowanie `openclaw.json`
- [Doctor](/pl/cli/doctor) — wspomagane kontrole napraw i migracji
- [Dokumentacja CLI](/pl/cli) — pełna dokumentacja poleceń CLI
