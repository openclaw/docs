---
read_when:
    - Tworzysz zewnętrzną aplikację, skrypt, pulpit, zadanie CI lub rozszerzenie IDE, które komunikuje się z OpenClaw
    - Wybierasz między RPC Gateway a SDK Pluginu
    - Integrujesz się z uruchomieniami agentów Gateway, sesjami, zdarzeniami, zatwierdzeniami, modelami lub narzędziami
    - Parujesz kontroler hostingu z zewnętrznym harmonogramem wybudzania
sidebarTitle: External apps
summary: Aktualna ścieżka integracji dla zewnętrznych aplikacji, skryptów, pulpitów nawigacyjnych, zadań CI i rozszerzeń IDE
title: Integracje Gateway dla aplikacji zewnętrznych
x-i18n:
    generated_at: "2026-07-12T15:04:23Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0034db64dea64f8c5c400cf2adc69c6e046d0cd574914fe7497099018cb28745
    source_path: gateway/external-apps.md
    workflow: 16
---

Aplikacje zewnętrzne komunikują się z OpenClaw za pośrednictwem protokołu Gateway: transportu WebSocket oraz metod RPC. Użyj go, gdy skrypt, pulpit, zadanie CI, rozszerzenie IDE lub inny proces chce uruchamiać wykonania agentów, strumieniować zdarzenia, oczekiwać na wyniki, anulować pracę albo przeglądać zasoby Gateway.

<Warning>
  Publiczny pakiet kliencki npm nie jest jeszcze dostępny. Nie dodawaj nazw pakietów klienckich OpenClaw jako zależności aplikacji, dopóki informacje o wydaniu nie ogłoszą opublikowanego pakietu, a ta strona nie będzie zawierać instrukcji instalacji.
</Warning>

<Note>
  Ta strona dotyczy kodu działającego poza procesem OpenClaw. Kod Pluginu działający wewnątrz OpenClaw powinien zamiast tego używać udokumentowanych ścieżek podrzędnych `openclaw/plugin-sdk/*`.
</Note>

## Co jest obecnie dostępne

| Powierzchnia                             | Stan    | Zastosowanie                                                                                                  |
| --------------------------------------- | ------- | ------------------------------------------------------------------------------------------------------------- |
| [Protokół Gateway](/pl/gateway/protocol)   | Gotowe  | Transport WebSocket, uzgadnianie połączenia, zakresy uwierzytelniania, wersjonowanie protokołu i zdarzenia.   |
| [Dokumentacja RPC Gateway](/pl/reference/rpc) | Gotowe | Bieżące metody Gateway dla agentów, sesji, zadań, modeli, narzędzi, artefaktów i zatwierdzeń.                  |
| [`openclaw agent`](/pl/cli/agent)          | Gotowe  | Jednorazowa integracja ze skryptem, gdy wystarcza wywołanie CLI z powłoki.                                    |
| [`openclaw message`](/pl/cli/message)      | Gotowe  | Wysyłanie wiadomości lub wykonywanie działań kanału ze skryptów.                                              |

Prace nad przyszłym pakietem biblioteki klienckiej trwają wewnętrznie, ale nie jest on jeszcze publicznie dostępny do instalacji. Traktuj go jako szczegół implementacyjny wersji zapoznawczej, dopóki wydanie nie ogłosi opublikowanego, wersjonowanego pakietu.

## Zalecana ścieżka

1. Uruchom lub wykryj Gateway.
2. Połącz się za pomocą [protokołu Gateway](/pl/gateway/protocol).
3. Wywołuj udokumentowane metody RPC z [dokumentacji RPC Gateway](/pl/reference/rpc).
4. Przypnij testowaną wersję OpenClaw.
5. Po aktualizacji OpenClaw ponownie sprawdź dokumentację RPC.

W przypadku wykonań agentów zacznij od RPC `agent` i połącz je z `agent.wait`, aby uzyskać wynik końcowy. Do trwałego przechowywania stanu konwersacji używaj metod `sessions.*`. W integracjach interfejsu użytkownika subskrybuj zdarzenia Gateway i renderuj wyłącznie rodziny zdarzeń obsługiwane przez aplikację.

## Kooperacyjne wstrzymywanie hosta

Kontrolery hostingu, które zamrażają działający proces lub tworzą jego migawkę, mogą korzystać z niezależnego od hosta uzgadniania wstrzymania:

1. Przestań przyjmować zewnętrzny ruch przychodzący kontrolowany przez hosta.
2. Wywołaj `gateway.suspend.prepare` ze stabilnym, unikatowym identyfikatorem `requestId`.
3. Jeśli odpowiedzią jest `busy`, pozostaw proces uruchomiony i ponów próbę później.
4. Jeśli odpowiedzią jest `ready`, zapisz zwrócony identyfikator `suspensionId`, a następnie zamroź proces lub utwórz jego migawkę przed czasem `expiresAtMs`.
5. Po wznowieniu albo po rezygnacji ze wstrzymania wywołaj `gateway.suspend.resume` z tym identyfikatorem `suspensionId` przez istniejące połączenie WebSocket lub ścieżkę sterowania Admin HTTP.

Przygotowany Gateway odrzuca nowe uzgadniania WebSocket. Kontroler WebSocket musi utrzymać otwarte uwierzytelnione połączenie przez cały czas operacji hosta. Jeśli nie można tego zagwarantować, przed przygotowaniem włącz i użyj [Pluginu RPC Admin HTTP](/pl/plugins/admin-http-rpc). Jeśli ścieżka sterowania zostanie utracona, przed ponownym połączeniem poczekaj na wygaśnięcie dwuminutowej dzierżawy; po wygaśnięciu przyjmowanie połączeń zostanie automatycznie wznowione.

Kontrakt RPC wygląda następująco:

- `gateway.suspend.prepare` — `operator.admin`; parametry
  `{ "requestId": "stable-host-operation-id" }`
- `gateway.suspend.status` — `operator.read`; parametry
  `{ "suspensionId": "id-from-prepare" }`
- `gateway.suspend.resume` — `operator.admin`; parametry
  `{ "suspensionId": "id-from-prepare" }`

Identyfikatory są przycinane, muszą zawierać znak inny niż biały i są ograniczone do 128 znaków. Wynik zajętości przygotowania ma `status: "busy"`, `reason`, `retryAfterMs`, `activeCount` oraz `blockers`. Wynik gotowości ma następującą postać:

```json
{
  "status": "ready",
  "suspensionId": "2c3f...",
  "expiresAtMs": 1770000000000,
  "activeCount": 0,
  "blockers": []
}
```

Zapytanie o stan zwraca `{"status":"running"}` albo wynik gotowości z `expiresAtMs`. Wznowienie zwraca `{"ok":true,"status":"running","resumed":true}`; ponowne wywołanie po pomyślnym wznowieniu zwraca `resumed: false`.

Konkurencyjny identyfikator żądania lub przejściowy błąd wznowienia harmonogramu zwraca możliwy do ponowienia błąd `UNAVAILABLE` z `retryAfterMs`. Podczas odzyskiwania harmonogramu operacje przygotowania, sprawdzania stanu i wznowienia zwracają ten błąd, Gateway pozostaje niegotowy i działa w trybie bezpiecznego zamknięcia, a host nie może go zamrażać ani tworzyć jego migawki. OpenClaw automatycznie ponawia próbę uruchomienia harmonogramu i wznawia przyjmowanie połączeń dopiero po pomyślnym odzyskaniu. Niedopasowany identyfikator wznowienia zwraca `INVALID_REQUEST`. Przygotowanie korzysta ze wspólnego budżetu zapisu płaszczyzny sterowania Gateway wynoszącego trzy próby na minutę; przestrzegaj zwróconego opóźnienia ponowienia. Klienci WebSocket są grupowani według urządzenia i adresu IP. Kontrolery Admin HTTP są grupowane według ustalonego adresu IP klienta, dlatego kontrolery za jednym serwerem proxy mogą współdzielić budżet.

Przygotowanie służy wyłącznie do odmowy: OpenClaw zamyka przyjmowanie nowych operacji głównych, sesji i poleceń, wstrzymuje automatyczne cykle Cron oraz synchronicznie sprawdza wykonywaną pracę. Jeśli cokolwiek jest aktywne, wznawia harmonogram i ponownie otwiera przyjmowanie operacji przed zwróceniem `busy`; nie przerywa ani nie opróżnia tej pracy. Gotowa dzierżawa trwa dwie minuty. Ponowne wywołanie `prepare` z tym samym `requestId` odnawia ją; wygaśnięcie wznawia harmonogram przed ponownym otwarciem przyjmowania operacji.
Emisja ponownego uruchomienia, której termin przypada podczas gotowej dzierżawy, czeka na jej wznowienie; trwające ponowne uruchomienie powoduje, że przygotowanie zwraca `busy`.

W stanie gotowości `/healthz` nadal działa, a `/readyz` zwraca `503`. Lokalne lub uwierzytelnione odpowiedzi dotyczące gotowości zawierają `gateway-draining`; nieuwierzytelnione zdalne sondy otrzymują wyłącznie `{ "ready": false }`. Sonda kondycji HTTP, metody wstrzymania na istniejących połączeniach WebSocket oraz wcześniej włączona trasa RPC Admin HTTP pozostają dostępne. Inne wywołania RPC zwracają możliwy do ponowienia błąd `UNAVAILABLE`. Wbudowane trasy HTTP obsługujące pracę użytkownika i zwykłe trasy HTTP Pluginów, w tym interfejsy API zgodne z OpenAI, operacje narzędzi i sesji, obserwacje Node oraz skonfigurowane punkty zaczepienia, zwracają `503` z `error.code: "gateway_unavailable"`. Nowe uaktualnienia WebSocket należące do Pluginów również zwracają `503`; obejmuje to własność uaktualnienia, a nie pracę wykonywaną później przez ustanowione gniazdo Pluginu.

To uzgadnianie nie utrwala wiadomości przychodzących, nie zatrzymuje transportów kanałów innych firm ani nie steruje platformą hostingową. Host musi odgrodzić ruch przychodzący przed przygotowaniem i pozostaje odpowiedzialny za wybudzanie, tworzenie migawek lub zamrażanie oraz zatrzymywanie. `activeCount` to łączna liczba śledzonych prac, natomiast `blockers` zawiera niezerowe liczby kategorii i ograniczone szczegóły zadań. Nie jest to ogólna bariera bezczynności procesu. Blokada `background-exec` ma wyłącznie charakter zbiorczy: tekst poleceń, identyfikatory procesów, dane wyjściowe oraz identyfikatory sesji lub zakresów nigdy nie przechodzą przez protokół. Kondycja kanałów, konserwacja, odświeżanie pamięci podręcznej, ustanowione sesje WebSocket Pluginów oraz niezarejestrowana praca w tle należąca do Pluginów mogą pozostać aktywne.
Platforma hostingowa musi spójnie zamrozić pełne drzewo procesów i jego system plików lub utworzyć ich migawkę; ten pierwszy kontrakt nie może potwierdzić bezczynności niezarejestrowanej pracy.

<Tip>
  W przypadku planowania wybudzania hosta utrzymuj część współpracującą z OpenClaw wewnątrz Pluginu działającego w procesie i przekazuj idempotentne pełne migawki do zewnętrznego adaptera hosta. Kontroler hostingu nie powinien importować Plugin SDK ani odtwarzać stanu Cron na podstawie różnic zdarzeń. Zobacz [Bezpieczne zewnętrzne odwzorowanie Cron](/pl/plugins/hooks#safe-external-cron-projection).
</Tip>

## Kod aplikacji a kod Pluginu

Używaj RPC Gateway, gdy kod działa poza OpenClaw:

- skrypty Node uruchamiające lub obserwujące wykonania agentów
- zadania CI wywołujące Gateway
- pulpity i panele administracyjne
- rozszerzenia IDE
- zewnętrzne mosty, które nie muszą stawać się Pluginami kanałów
- testy integracyjne z fikcyjnymi lub rzeczywistymi transportami Gateway

Używaj Plugin SDK, gdy kod działa wewnątrz OpenClaw:

- Pluginy dostawców
- Pluginy kanałów
- punkty zaczepienia narzędzi lub cyklu życia
- Pluginy środowiska wykonawczego agentów
- zaufane pomocnicze komponenty środowiska wykonawczego

Aplikacje zewnętrzne nie powinny importować `openclaw/plugin-sdk/*`; te ścieżki podrzędne są przeznaczone dla Pluginów ładowanych przez OpenClaw.

## Powiązane materiały

- [Protokół Gateway](/pl/gateway/protocol)
- [Dokumentacja RPC Gateway](/pl/reference/rpc)
- [Polecenie agenta CLI](/pl/cli/agent)
- [Polecenie wiadomości CLI](/pl/cli/message)
- [Pętla agenta](/pl/concepts/agent-loop)
- [Środowiska wykonawcze agentów](/pl/concepts/agent-runtimes)
- [Sesje](/pl/concepts/session)
- [Zadania w tle](/pl/automation/tasks)
- [Agenci ACP](/pl/tools/acp-agents)
- [Omówienie Plugin SDK](/pl/plugins/sdk-overview)
