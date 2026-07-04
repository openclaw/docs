---
read_when:
    - Chcesz obsługiwać Gateway z przeglądarki
    - Chcesz dostępu do Tailnet bez tuneli SSH
sidebarTitle: Control UI
summary: Oparta na przeglądarce kontrolka interfejsu użytkownika dla Gateway (czat, aktywność, węzły, konfiguracja)
title: Interfejs sterowania
x-i18n:
    generated_at: "2026-07-04T18:24:11Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d00575a4633b192b6121145476c3b15b6b68cfd177322f409cacbb7ef331d09d
    source_path: web/control-ui.md
    workflow: 16
---

Interfejs Control UI to mała aplikacja jednostronicowa **Vite + Lit** udostępniana przez Gateway:

- domyślnie: `http://<host>:18789/`
- opcjonalny prefiks: ustaw `gateway.controlUi.basePath` (np. `/openclaw`)

Komunikuje się **bezpośrednio z Gateway WebSocket** na tym samym porcie.

## Szybkie otwarcie (lokalnie)

Jeśli Gateway działa na tym samym komputerze, otwórz:

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/) (lub [http://localhost:18789/](http://localhost:18789/))

Jeśli strona się nie ładuje, najpierw uruchom Gateway: `openclaw gateway`.

<Note>
Przy natywnych powiązaniach LAN w Windows Zapora systemu Windows lub zarządzane przez organizację zasady grupy nadal mogą blokować ogłaszany adres URL LAN, nawet gdy `127.0.0.1` działa na hoście Gateway. Uruchom `openclaw gateway status --deep` na hoście Windows; zgłasza on prawdopodobnie zablokowane porty, niezgodności profili i lokalne reguły zapory, które zasady mogą ignorować.
</Note>

Uwierzytelnianie jest przekazywane podczas uzgadniania WebSocket przez:

- `connect.params.auth.token`
- `connect.params.auth.password`
- nagłówki tożsamości Tailscale Serve, gdy `gateway.auth.allowTailscale: true`
- nagłówki tożsamości zaufanego proxy, gdy `gateway.auth.mode: "trusted-proxy"`

Panel ustawień pulpitu przechowuje token dla bieżącej sesji karty przeglądarki i wybranego adresu URL gateway; hasła nie są utrwalane. Onboarding zwykle generuje token gateway do uwierzytelniania sekretem współdzielonym przy pierwszym połączeniu, ale uwierzytelnianie hasłem również działa, gdy `gateway.auth.mode` ma wartość `"password"`.

## Parowanie urządzenia (pierwsze połączenie)

Gdy łączysz się z Control UI z nowej przeglądarki lub urządzenia, Gateway zwykle wymaga **jednorazowego zatwierdzenia parowania**. To środek bezpieczeństwa zapobiegający nieautoryzowanemu dostępowi.

**Co zobaczysz:** „disconnected (1008): pairing required”

<Steps>
  <Step title="Wyświetl oczekujące żądania">
    ```bash
    openclaw devices list
    ```
  </Step>
  <Step title="Zatwierdź według identyfikatora żądania">
    ```bash
    openclaw devices approve <requestId>
    ```
  </Step>
</Steps>

Jeśli przeglądarka ponawia próbę parowania ze zmienionymi danymi uwierzytelniania (rola/zakresy/klucz publiczny), poprzednie oczekujące żądanie zostaje zastąpione i tworzony jest nowy `requestId`. Przed zatwierdzeniem ponownie uruchom `openclaw devices list`.

Jeśli przeglądarka jest już sparowana i zmienisz jej dostęp z odczytu na zapis/admin, jest to traktowane jako rozszerzenie zatwierdzenia, a nie ciche ponowne połączenie. OpenClaw zachowuje stare zatwierdzenie jako aktywne, blokuje ponowne połączenie z szerszymi uprawnieniami i prosi o jawne zatwierdzenie nowego zestawu zakresów.

Po zatwierdzeniu urządzenie zostaje zapamiętane i nie będzie wymagać ponownego zatwierdzenia, chyba że je unieważnisz poleceniem `openclaw devices revoke --device <id> --role <role>`. Zobacz [CLI urządzeń](/pl/cli/devices), aby poznać rotację i unieważnianie tokenów.

Agenci Paperclip, którzy łączą się przez adapter `openclaw_gateway`, używają tego samego przepływu zatwierdzania przy pierwszym uruchomieniu. Po pierwszej próbie połączenia uruchom `openclaw devices approve --latest`, aby podejrzeć oczekujące żądanie, a następnie ponownie uruchom wypisane polecenie `openclaw devices approve <requestId>`, aby je zatwierdzić. Dla zdalnego gateway przekaż jawne wartości `--url` i `--token`. Aby zatwierdzenia pozostawały stabilne między restartami, skonfiguruj w Paperclip trwałe `adapterConfig.devicePrivateKeyPem` zamiast pozwalać mu generować nową efemeryczną tożsamość urządzenia przy każdym uruchomieniu.

<Note>
- Bezpośrednie połączenia przeglądarki przez local loopback (`127.0.0.1` / `localhost`) są zatwierdzane automatycznie.
- Tailscale Serve może pominąć rundę parowania dla sesji operatora Control UI, gdy `gateway.auth.allowTailscale: true`, tożsamość Tailscale zostanie zweryfikowana, a przeglądarka przedstawi swoją tożsamość urządzenia.
- Bezpośrednie powiązania Tailnet, połączenia przeglądarki przez LAN i profile przeglądarki bez tożsamości urządzenia nadal wymagają jawnego zatwierdzenia.
- Każdy profil przeglądarki generuje unikalny identyfikator urządzenia, więc zmiana przeglądarki lub wyczyszczenie danych przeglądarki będzie wymagać ponownego parowania.

</Note>

## Sparuj urządzenie mobilne

Już sparowany administrator może utworzyć kod QR połączenia iOS/Android bez
otwierania terminala:

<Steps>
  <Step title="Otwórz parowanie mobilne">
    Wybierz **Węzły**, a następnie kliknij **Sparuj urządzenie mobilne** na karcie **Urządzenia**.
  </Step>
  <Step title="Połącz telefon">
    W aplikacji mobilnej OpenClaw otwórz **Ustawienia** → **Gateway** i zeskanuj kod QR.
    Zamiast tego możesz skopiować i wkleić kod konfiguracji.
  </Step>
  <Step title="Potwierdź połączenie">
    Oficjalna aplikacja iOS/Android łączy się automatycznie. Jeśli **Urządzenia** pokazują
    oczekujące żądanie, sprawdź jego rolę i zakresy przed zatwierdzeniem.
  </Step>
</Steps>

Utworzenie kodu konfiguracji wymaga `operator.admin`; przycisk jest wyłączony dla
sesji bez tego uprawnienia. Kod konfiguracji zawiera krótkotrwałe poświadczenie bootstrap,
więc traktuj kod QR i skopiowany kod jak hasło, dopóki są ważne. Przy zdalnym
parowaniu Gateway musi rozwiązywać się do `wss://` (na przykład przez Tailscale
Serve/Funnel); zwykłe `ws://` jest ograniczone do adresów loopback i prywatnych adresów LAN.
Zobacz [Parowanie](/pl/channels/pairing#pair-from-the-control-ui-recommended), aby poznać
pełne szczegóły zabezpieczeń i rozwiązań awaryjnych.

## Tożsamość osobista (lokalna w przeglądarce)

Control UI obsługuje osobistą tożsamość dla każdej przeglądarki (nazwa wyświetlana i awatar) dołączaną do wychodzących wiadomości na potrzeby atrybucji w sesjach współdzielonych. Przechowywana jest w pamięci przeglądarki, ograniczona do bieżącego profilu przeglądarki i nie jest synchronizowana z innymi urządzeniami ani utrwalana po stronie serwera poza normalnymi metadanymi autorstwa transkryptu w wiadomościach, które faktycznie wysyłasz. Wyczyszczenie danych witryny lub zmiana przeglądarki resetuje ją do pustej wartości.

Ten sam lokalny dla przeglądarki wzorzec dotyczy nadpisania awatara asystenta. Przesłane awatary asystenta nakładają tożsamość rozwiązaną przez gateway tylko w lokalnej przeglądarce i nigdy nie przechodzą przez `config.patch`. Wspólne pole konfiguracji `ui.assistant.avatar` jest nadal dostępne dla klientów spoza UI zapisujących to pole bezpośrednio (takich jak skryptowane gateway lub niestandardowe pulpity).

## Endpoint konfiguracji runtime

Control UI pobiera swoje ustawienia runtime z `/control-ui-config.json`, rozwiązywanego względem ścieżki bazowej Control UI gateway (na przykład `/__openclaw__/control-ui-config.json`, gdy UI jest udostępniany pod `/__openclaw__/`). Ten endpoint jest chroniony tym samym uwierzytelnianiem gateway co reszta powierzchni HTTP: nieuwierzytelnione przeglądarki nie mogą go pobrać, a pomyślne pobranie wymaga już ważnego tokenu/hasła gateway, tożsamości Tailscale Serve albo tożsamości zaufanego proxy.

## Obsługa języków

Control UI może lokalizować się przy pierwszym załadowaniu na podstawie ustawień regionalnych przeglądarki. Aby później to zmienić, otwórz **Przegląd -> Dostęp do Gateway -> Język**. Selektor ustawień regionalnych znajduje się na karcie Dostęp do Gateway, a nie w sekcji Wygląd.

- Obsługiwane ustawienia regionalne: `en`, `zh-CN`, `zh-TW`, `pt-BR`, `de`, `es`, `ja-JP`, `ko`, `fr`, `ar`, `it`, `tr`, `uk`, `id`, `pl`, `th`, `vi`, `nl`, `fa`
- Tłumaczenia inne niż angielskie są ładowane leniwie w przeglądarce.
- Wybrane ustawienia regionalne są zapisywane w pamięci przeglądarki i używane ponownie przy kolejnych wizytach.
- Brakujące klucze tłumaczeń wracają do angielskiego.

Tłumaczenia dokumentacji są generowane dla tego samego zestawu ustawień regionalnych innych niż angielskie, ale wbudowany selektor języka witryny dokumentacji Mintlify jest ograniczony do kodów ustawień regionalnych akceptowanych przez Mintlify. Dokumentacja tajska (`th`) i perska (`fa`) nadal jest generowana w repozytorium publikacji; może nie pojawiać się w tym selektorze, dopóki Mintlify nie obsłuży tych kodów.

## Motywy wyglądu

Panel Wygląd zachowuje wbudowane motywy Claw, Knot i Dash oraz jedno lokalne dla przeglądarki miejsce importu tweakcn. Aby zaimportować motyw, otwórz [edytor tweakcn](https://tweakcn.com/editor/theme), wybierz lub utwórz motyw, kliknij **Udostępnij** i wklej skopiowany link motywu w sekcji Wygląd. Importer akceptuje też adresy URL rejestru `https://tweakcn.com/r/themes/<id>`, adresy URL edytora takie jak `https://tweakcn.com/editor/theme?theme=amethyst-haze`, względne ścieżki `/themes/<id>`, surowe identyfikatory motywów i domyślne nazwy motywów, takie jak `amethyst-haze`.

Wygląd obejmuje też lokalne dla przeglądarki ustawienie Rozmiar tekstu. Ustawienie jest przechowywane razem z pozostałymi preferencjami Control UI, ma zastosowanie do tekstu czatu, tekstu kompozytora, kart narzędzi i pasków bocznych czatu oraz utrzymuje pola tekstowe na poziomie co najmniej 16px, aby mobilne Safari nie powiększało automatycznie po fokusie.

Zaimportowane motywy są przechowywane tylko w bieżącym profilu przeglądarki. Nie są zapisywane do konfiguracji gateway i nie synchronizują się między urządzeniami. Zastąpienie zaimportowanego motywu aktualizuje jedno lokalne miejsce; wyczyszczenie go przełącza aktywny motyw z powrotem na Claw, jeśli wybrany był zaimportowany motyw.

## Co potrafi (dzisiaj)

<AccordionGroup>
  <Accordion title="Czat i rozmowa">
    - Czatuj z modelem przez Gateway WS (`chat.history`, `chat.send`, `chat.abort`, `chat.inject`).
    - Odświeżenia historii czatu żądają ograniczonego ostatniego okna z limitami tekstu na wiadomość, aby duże sesje nie zmuszały przeglądarki do renderowania pełnego ładunku transkryptu, zanim czat stanie się użyteczny.
    - Rozmawiaj przez przeglądarkowe sesje czasu rzeczywistego. OpenAI używa bezpośredniego WebRTC, Google Live używa ograniczonego jednorazowego tokenu przeglądarki przez WebSocket, a pluginy głosu czasu rzeczywistego wyłącznie po stronie backendu używają transportu przekaźnikowego Gateway. Sesje dostawcy należące do klienta zaczynają się od `talk.client.create`; sesje przekaźnikowe Gateway zaczynają się od `talk.session.create`. Przekaźnik utrzymuje poświadczenia dostawcy na Gateway, podczas gdy przeglądarka przesyła PCM mikrofonu przez `talk.session.appendAudio`, przekazuje wywołania narzędzi dostawcy `openclaw_agent_consult` przez `talk.client.toolCall` dla zasad Gateway i większego skonfigurowanego modelu OpenClaw oraz kieruje sterowanie głosem aktywnego uruchomienia przez `talk.client.steer` lub `talk.session.steer`.
    - Strumieniuj wywołania narzędzi + karty wyjścia narzędzi na żywo w Czacie (zdarzenia agenta).
    - Karta Aktywność z lokalnymi dla przeglądarki, nastawionymi na redakcję podsumowaniami aktywności narzędzi na żywo z istniejącego dostarczania zdarzeń `session.tool` / narzędzi.

  </Accordion>
  <Accordion title="Kanały, instancje, sesje, sny">
    - Kanały: wbudowany status oraz status kanałów pluginów dołączonych/zewnętrznych, logowanie QR i konfiguracja dla każdego kanału (`channels.status`, `web.login.*`, `config.patch`).
    - Odświeżenia sond kanałów utrzymują poprzednią migawkę jako widoczną, gdy powolne kontrole dostawców się kończą, a częściowe migawki są oznaczane, gdy sonda lub audyt przekracza swój budżet UI.
    - Instancje: lista obecności + odświeżanie (`system-presence`).
    - Sesje: domyślnie wyświetlaj sesje skonfigurowanych agentów, wycofuj się ze starych kluczy sesji nieskonfigurowanych agentów i stosuj zastąpienia modelu/myślenia/trybu szybkiego/trybu szczegółowego/śledzenia/rozumowania dla każdej sesji (`sessions.list`, `sessions.patch`).
    - Sny: status dreaming, przełącznik włącz/wyłącz i czytnik Dziennika snów (`doctor.memory.status`, `doctor.memory.dreamDiary`, `config.patch`).

  </Accordion>
  <Accordion title="Cron, Skills, węzły, zatwierdzenia exec">
    - Zadania Cron: lista/dodaj/edytuj/uruchom/włącz/wyłącz + historia uruchomień (`cron.*`).
    - Skills: status, włącz/wyłącz, zainstaluj, aktualizacje kluczy API (`skills.*`).
    - Węzły: lista + limity (`node.list`), tworzenie mobilnych kodów konfiguracji i zatwierdzanie parowania urządzeń (`device.pair.*`).
    - Zatwierdzenia exec: edytuj listy dozwolonych gateway lub węzła + zasada pytania dla `exec host=gateway/node` (`exec.approvals.*`).

  </Accordion>
  <Accordion title="Konfiguracja">
    - Wyświetl/edytuj `~/.openclaw/openclaw.json` (`config.get`, `config.set`).
    - MCP ma dedykowaną stronę ustawień dla skonfigurowanych serwerów, włączania, podsumowań OAuth/filtrów/równoległości, typowych poleceń operatora oraz zakresowego edytora konfiguracji `mcp`.
    - Zastosuj i uruchom ponownie z walidacją (`config.apply`) oraz wybudź ostatnią aktywną sesję.
    - Zapisy zawierają zabezpieczenie haszem bazowym, aby zapobiec nadpisaniu równoległych edycji.
    - Zapisy (`config.set`/`config.apply`/`config.patch`) wykonują przed zapisem kontrolę rozwiązywania aktywnych SecretRef dla referencji w przesłanym ładunku konfiguracji; nierozwiązane aktywne przesłane referencje są odrzucane przed zapisem.
    - Zapisy formularzy odrzucają nieaktualne zredagowane symbole zastępcze, których nie można odtworzyć z zapisanej konfiguracji, zachowując zredagowane wartości, które nadal mapują się na zapisane sekrety.
    - Renderowanie schematu i formularza (`config.schema` / `config.schema.lookup`, w tym pól `title` / `description`, dopasowanych wskazówek UI, podsumowań bezpośrednich elementów podrzędnych, metadanych dokumentacji na zagnieżdżonych węzłach obiektu/wieloznacznika/tablicy/kompozycji, a także schematów Plugin + kanału, gdy są dostępne); edytor surowego JSON jest dostępny tylko wtedy, gdy migawka ma bezpieczny surowy zapis i odczyt.
    - Jeśli migawka nie może bezpiecznie przejść pełnego cyklu surowego tekstu, Control UI wymusza tryb formularza i wyłącza tryb surowy dla tej migawki.
    - W edytorze surowego JSON opcja „Przywróć zapisane” zachowuje kształt utworzony w trybie surowym (formatowanie, komentarze, układ `$include`) zamiast ponownie renderować spłaszczoną migawkę, dzięki czemu zewnętrzne edycje przetrwają reset, gdy migawka może bezpiecznie przejść pełny cykl.
    - Ustrukturyzowane wartości obiektów SecretRef są renderowane w polach tekstowych formularza jako tylko do odczytu, aby zapobiec przypadkowemu uszkodzeniu przez konwersję obiektu na ciąg znaków.

  </Accordion>
  <Accordion title="Debugowanie, logi, aktualizacja">
    - Debugowanie: migawki statusu/kondycji/modeli + dziennik zdarzeń + ręczne wywołania RPC (`status`, `health`, `models.list`).
    - Dziennik zdarzeń obejmuje czasy odświeżania/RPC Control UI, czasy powolnego renderowania czatu/konfiguracji oraz wpisy responsywności przeglądarki dla długich klatek animacji lub długich zadań, gdy przeglądarka udostępnia te typy wpisów PerformanceObserver.
    - Logi: śledzenie na żywo logów plikowych gateway z filtrowaniem/eksportem (`logs.tail`).
    - Aktualizacja: uruchom aktualizację pakietu/git + restart (`update.run`) z raportem restartu, a następnie odpytaj `update.status` po ponownym połączeniu, aby zweryfikować działającą wersję gateway.

  </Accordion>
  <Accordion title="Uwagi do panelu zadań Cron">
    - Dla izolowanych zadań domyślną dostawą jest ogłoszenie podsumowania. Możesz przełączyć na brak, jeśli chcesz uruchomienia wyłącznie wewnętrzne.
    - Pola kanału/celu pojawiają się po wybraniu ogłoszenia.
    - Tryb Webhook używa `delivery.mode = "webhook"` z `delivery.to` ustawionym na prawidłowy URL webhooka HTTP(S).
    - Dla zadań sesji głównej dostępne są tryby dostawy webhook i brak.
    - Zaawansowane kontrolki edycji obejmują usunięcie po uruchomieniu, wyczyszczenie nadpisania agenta, dokładne/rozłożone opcje cron, nadpisania modelu/myślenia agenta oraz przełączniki dostawy best-effort.
    - Walidacja formularza jest wbudowana z błędami na poziomie pól; nieprawidłowe wartości wyłączają przycisk zapisu do czasu poprawienia.
    - Ustaw `cron.webhookToken`, aby wysłać dedykowany token bearer; jeśli zostanie pominięty, webhook jest wysyłany bez nagłówka uwierzytelniania.
    - Przestarzały fallback: uruchom `openclaw doctor --fix`, aby zmigrować zapisane starsze zadania z `notify: true` z `cron.webhook` do jawnego webhooka na zadanie albo dostawy po ukończeniu.

  </Accordion>
</AccordionGroup>

## Strona MCP

Dedykowana strona MCP to widok operatora dla serwerów MCP zarządzanych przez OpenClaw w `mcp.servers`. Sama nie uruchamia transportów MCP; używaj jej do sprawdzania i edycji zapisanej konfiguracji, a następnie użyj `openclaw mcp doctor --probe`, gdy potrzebujesz dowodu działania serwera na żywo.

Typowy przepływ pracy:

1. Otwórz **MCP** z paska bocznego.
2. Sprawdź karty podsumowania pod kątem łącznej liczby serwerów, liczby włączonych serwerów, OAuth oraz serwerów filtrowanych.
3. Przejrzyj każdy wiersz serwera pod kątem transportu, włączenia, uwierzytelniania, filtrów, limitów czasu i wskazówek poleceń.
4. Przełącz włączenie, gdy serwer powinien pozostać skonfigurowany, ale nie uczestniczyć w wykrywaniu w czasie działania.
5. Edytuj zakresową sekcję konfiguracji `mcp` dla definicji serwerów, nagłówków, ścieżek TLS/mTLS, metadanych OAuth, filtrów narzędzi i metadanych projekcji Codex.
6. Użyj **Zapisz** do zapisu konfiguracji albo **Zapisz i opublikuj**, gdy działający Gateway powinien zastosować zmienioną konfigurację.
7. Uruchom `openclaw mcp status --verbose`, `openclaw mcp doctor --probe` albo `openclaw mcp reload` z terminala, gdy edytowany proces potrzebuje statycznej diagnostyki, dowodu na żywo albo usunięcia buforowanego środowiska uruchomieniowego.

Strona redaguje wartości podobne do URL-i zawierające poświadczenia przed renderowaniem i ujmuje nazwy serwerów w cudzysłowy w fragmentach poleceń, aby skopiowane polecenia nadal działały ze spacjami lub metaznakami powłoki. Pełna referencja CLI i konfiguracji znajduje się w [MCP](/pl/cli/mcp).

## Karta Aktywność

Karta Aktywność jest ulotnym, lokalnym dla przeglądarki obserwatorem aktywności narzędzi na żywo. Pochodzi z tego samego strumienia zdarzeń Gateway `session.tool` / narzędzi, który zasila karty narzędzi czatu; nie dodaje kolejnej rodziny zdarzeń Gateway, punktu końcowego, trwałego magazynu aktywności, kanału metryk ani zewnętrznego strumienia obserwatora.

Wpisy aktywności przechowują wyłącznie oczyszczone podsumowania oraz zredagowane, skrócone podglądy wyjścia. Wartości argumentów narzędzi nie są przechowywane w stanie Aktywności; UI pokazuje, że argumenty są ukryte, i zapisuje tylko liczbę pól argumentów. Lista w pamięci podąża za bieżącą kartą przeglądarki, przetrwa nawigację w Control UI i resetuje się po przeładowaniu strony, zmianie sesji albo użyciu **Wyczyść**.

## Zachowanie czatu

<AccordionGroup>
  <Accordion title="Semantyka wysyłania i historii">
    - `chat.send` jest **nieblokujące**: natychmiast potwierdza z `{ runId, status: "started" }`, a odpowiedź jest strumieniowana przez zdarzenia `chat`. Zaufani klienci Control UI mogą także otrzymywać opcjonalne metadane czasu ACK do lokalnej diagnostyki.
    - Przesyłanie plików w czacie akceptuje obrazy oraz pliki inne niż wideo. Obrazy zachowują natywną ścieżkę obrazu; pozostałe pliki są przechowywane jako zarządzane media i pokazywane w historii jako linki do załączników.
    - Ponowne wysłanie z tym samym `idempotencyKey` zwraca `{ status: "in_flight" }` podczas działania oraz `{ status: "ok" }` po ukończeniu.
    - Odpowiedzi `chat.history` są ograniczane rozmiarem dla bezpieczeństwa UI. Gdy wpisy transkrypcji są zbyt duże, Gateway może skrócić długie pola tekstowe, pominąć ciężkie bloki metadanych i zastąpić zbyt duże wiadomości symbolem zastępczym (`[chat.history omitted: message too large]`).
    - Gdy widoczna wiadomość asystenta została skrócona w `chat.history`, czytnik boczny może na żądanie pobrać pełny, znormalizowany do wyświetlania wpis transkrypcji przez `chat.message.get`, używając `sessionKey`, aktywnego `agentId` w razie potrzeby oraz `messageId` transkrypcji. Jeśli Gateway nadal nie może zwrócić więcej, czytnik pokazuje jawny stan niedostępności zamiast po cichu powtarzać skrócony podgląd.
    - Obrazy asystenta/wygenerowane są utrwalane jako referencje do zarządzanych mediów i udostępniane z powrotem przez uwierzytelnione URL-e mediów Gateway, więc przeładowania nie zależą od pozostawania surowych ładunków obrazów base64 w odpowiedzi historii czatu.
    - Podczas renderowania `chat.history` Control UI usuwa z widocznego tekstu asystenta wyłącznie wyświetleniowe znaczniki dyrektyw inline (na przykład `[[reply_to_*]]` i `[[audio_as_voice]]`), tekstowe ładunki XML wywołań narzędzi (w tym `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` oraz skrócone bloki wywołań narzędzi), a także wyciekłe tokeny sterujące modelu ASCII/pełnej szerokości, i pomija wpisy asystenta, których cały widoczny tekst jest wyłącznie dokładnym tokenem ciszy `NO_REPLY` / `no_reply` albo tokenem potwierdzenia Heartbeat `HEARTBEAT_OK`.
    - Podczas aktywnego wysyłania i końcowego odświeżania historii widok czatu utrzymuje widoczne lokalne optymistyczne wiadomości użytkownika/asystenta, jeśli `chat.history` na krótko zwróci starszą migawkę; kanoniczna transkrypcja zastępuje te lokalne wiadomości, gdy historia Gateway nadrobi zaległości.
    - Zdarzenia `chat` na żywo są stanem dostawy, podczas gdy `chat.history` jest odbudowywane z trwałej transkrypcji sesji. Po końcowych zdarzeniach narzędzi Control UI przeładowuje historię i scala tylko mały optymistyczny ogon; granica transkrypcji jest udokumentowana w [WebChat](/pl/web/webchat).
    - `chat.inject` dołącza notatkę asystenta do transkrypcji sesji i rozgłasza zdarzenie `chat` dla aktualizacji wyłącznie UI (bez uruchomienia agenta, bez dostawy kanałem).
    - Pasek boczny wyświetla ostatnie sesje z akcją Nowa sesja, linkiem Wszystkie sesje oraz przyciskiem wyszukiwania sesji, który otwiera pełny selektor sesji (ograniczony do wybranego agenta, z wyszukiwaniem i paginacją). Zmiana agentów pokazuje tylko sesje powiązane z tym agentem i przełącza się na główną sesję tego agenta, gdy nie ma on jeszcze zapisanych sesji dashboardu.
    - Na szerokościach desktopowych kontrolki czatu pozostają w jednym zwartym wierszu i zwijają się podczas przewijania w dół transkrypcji; przewinięcie w górę, powrót na początek albo dotarcie do dołu przywraca kontrolki.
    - Kolejne zduplikowane wiadomości zawierające wyłącznie tekst renderują się jako jeden dymek z odznaką liczby. Wiadomości zawierające obrazy, załączniki, wyjście narzędzia lub podglądy canvas pozostają niezwinięte.
    - Selektory modelu i myślenia w nagłówku czatu natychmiast łatają aktywną sesję przez `sessions.patch`; są to trwałe nadpisania sesji, a nie opcje wysyłania tylko dla jednej tury.
    - Jeśli wyślesz wiadomość, gdy zmiana selektora modelu dla tej samej sesji nadal się zapisuje, kompozytor czeka na tę łatkę sesji przed wywołaniem `chat.send`, aby wysłanie użyło wybranego modelu.
    - Wpisanie `/new` w Control UI tworzy i przełącza na tę samą świeżą sesję dashboardu co Nowy czat, z wyjątkiem sytuacji, gdy skonfigurowano `session.dmScope: "main"` i bieżący rodzic jest główną sesją agenta; w takim przypadku resetuje główną sesję w miejscu. Wpisanie `/reset` zachowuje jawny reset w miejscu Gateway dla bieżącej sesji.
    - Selektor modelu czatu żąda skonfigurowanego widoku modeli Gateway. Jeśli obecne jest `agents.defaults.models`, ta lista dozwolonych wartości steruje selektorem, w tym wpisami `provider/*`, które utrzymują katalogi zakresowane dostawcą jako dynamiczne. W przeciwnym razie selektor pokazuje jawne wpisy `models.providers.*.models` oraz dostawców z użytecznym uwierzytelnianiem. Pełny katalog pozostaje dostępny przez debugowe RPC `models.list` z `view: "all"`.
    - Gdy świeże raporty użycia sesji Gateway zawierają bieżące tokeny kontekstu, pasek narzędzi kompozytora czatu pokazuje mały pierścień użycia kontekstu z użytym procentem; pełne szczegóły tokenów znajdują się w jego etykiecie narzędzia. Pierścień przełącza się na styl ostrzegawczy przy wysokiej presji kontekstu, a przy zalecanych poziomach Compaction pokazuje zwarty przycisk uruchamiający normalną ścieżkę Compaction sesji. Nieaktualne migawki tokenów są ukrywane, dopóki Gateway ponownie nie zgłosi świeżego użycia.

  </Accordion>
  <Accordion title="Tryb rozmowy (czas rzeczywisty w przeglądarce)">
    Tryb rozmowy używa zarejestrowanego dostawcy głosu w czasie rzeczywistym. Skonfiguruj OpenAI za pomocą `talk.realtime.provider: "openai"` oraz profilu uwierzytelniania kluczem API `openai`, `talk.realtime.providers.openai.apiKey` albo `OPENAI_API_KEY`; profile OAuth OpenAI nie konfigurują głosu Realtime. Skonfiguruj Google za pomocą `talk.realtime.provider: "google"` oraz `talk.realtime.providers.google.apiKey`. Przeglądarka nigdy nie otrzymuje standardowego klucza API dostawcy. OpenAI otrzymuje ulotny sekret klienta Realtime dla WebRTC. Google Live otrzymuje jednorazowy ograniczony token uwierzytelniania Live API dla sesji WebSocket przeglądarki, z instrukcjami i deklaracjami narzędzi zablokowanymi w tokenie przez Gateway. Dostawcy, którzy udostępniają tylko backendowy most czasu rzeczywistego, działają przez transport przekaźnikowy Gateway, więc poświadczenia i gniazda dostawcy pozostają po stronie serwera, podczas gdy dźwięk przeglądarki przechodzi przez uwierzytelnione RPC Gateway. Prompt sesji Realtime jest składany przez Gateway; `talk.client.create` nie akceptuje nadpisań instrukcji dostarczonych przez wywołującego.

    Kompozytor Chat zawiera przycisk opcji Talk obok przycisku uruchamiania/zatrzymywania Talk. Opcje dotyczą następnej sesji Talk i mogą nadpisywać dostawcę, transport, model, głos, nakład rozumowania, próg VAD, czas ciszy oraz dopełnienie prefiksu. Gdy opcja jest pusta, Gateway używa skonfigurowanych wartości domyślnych tam, gdzie są dostępne, albo wartości domyślnej dostawcy. Wybranie przekaźnika Gateway wymusza ścieżkę przekaźnika backendu; wybranie WebRTC utrzymuje sesję po stronie klienta i kończy się błędem zamiast po cichu przełączać się na przekaźnik, jeśli dostawca nie może utworzyć sesji przeglądarkowej.

    W kompozytorze Chat kontrolka Talk to przycisk z falami obok przycisku dyktowania mikrofonem. Gdy Talk się uruchamia, wiersz statusu kompozytora pokazuje `Connecting Talk...`, następnie `Talk live`, gdy audio jest połączone, albo `Asking OpenClaw...`, gdy wywołanie narzędzia realtime konsultuje skonfigurowany większy model przez `talk.client.toolCall`.

    Utrzymaniowy dymny test live: `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts` weryfikuje most WebSocket backendu OpenAI, wymianę SDP WebRTC przeglądarki OpenAI, konfigurację przeglądarkowego WebSocket Google Live z ograniczoną liczbą tokenów oraz adapter przeglądarkowy przekaźnika Gateway z fałszywym nośnikiem mikrofonu. Polecenie wypisuje tylko status dostawcy i nie loguje sekretów.

  </Accordion>
  <Accordion title="Zatrzymanie i przerwanie">
    - Kliknij **Zatrzymaj** (wywołuje `chat.abort`).
    - Gdy uruchomienie jest aktywne, zwykłe odpowiedzi uzupełniające trafiają do kolejki. Kliknij **Steruj** przy wiadomości w kolejce, aby wstrzyknąć tę odpowiedź uzupełniającą do trwającej tury.
    - Wpisz `/stop` (albo samodzielne frazy przerywające, takie jak `stop`, `stop action`, `stop run`, `stop openclaw`, `please stop`), aby przerwać poza pasmem.
    - `chat.abort` obsługuje `{ sessionKey }` (bez `runId`), aby przerwać wszystkie aktywne uruchomienia dla tej sesji.

  </Accordion>
  <Accordion title="Zachowanie części po przerwaniu">
    - Gdy uruchomienie zostanie przerwane, częściowy tekst asystenta nadal może być pokazany w UI.
    - Gateway utrwala przerwany częściowy tekst asystenta w historii transkrypcji, gdy istnieje zbuforowane wyjście.
    - Utrwalone wpisy zawierają metadane przerwania, aby konsumenci transkrypcji mogli odróżnić części po przerwaniu od zwykłego wyniku ukończenia.

  </Accordion>
</AccordionGroup>

## Instalacja PWA i Web Push

Control UI dostarcza `manifest.webmanifest` oraz service worker, więc nowoczesne przeglądarki mogą zainstalować go jako samodzielną PWA. Web Push pozwala Gateway wybudzać zainstalowaną PWA powiadomieniami nawet wtedy, gdy karta lub okno przeglądarki nie jest otwarte.

Jeśli strona pokazuje **Niezgodność protokołu** zaraz po aktualizacji OpenClaw, najpierw ponownie otwórz pulpit poleceniem `openclaw dashboard` i wykonaj twarde odświeżenie strony. Jeśli nadal występuje błąd, wyczyść dane witryny dla pochodzenia pulpitu albo przetestuj w prywatnym oknie przeglądarki; stara karta lub pamięć podręczna service worker przeglądarki może nadal uruchamiać pakiet Control UI sprzed aktualizacji wobec nowszego Gateway.

| Powierzchnia                                          | Co robi                                                            |
| ----------------------------------------------------- | ------------------------------------------------------------------ |
| `ui/public/manifest.webmanifest`                      | Manifest PWA. Przeglądarki oferują „Zainstaluj aplikację”, gdy jest osiągalny. |
| `ui/public/sw.js`                                     | Service worker obsługujący zdarzenia `push` i kliknięcia powiadomień. |
| `push/vapid-keys.json` (w katalogu stanu OpenClaw)    | Automatycznie generowana para kluczy VAPID używana do podpisywania ładunków Web Push. |
| `push/web-push-subscriptions.json`                    | Utrwalone punkty końcowe subskrypcji przeglądarki.                 |

Nadpisz parę kluczy VAPID przez zmienne środowiskowe w procesie Gateway, gdy chcesz przypiąć klucze (dla wdrożeń wielohostowych, rotacji sekretów albo testów):

- `OPENCLAW_VAPID_PUBLIC_KEY`
- `OPENCLAW_VAPID_PRIVATE_KEY`
- `OPENCLAW_VAPID_SUBJECT` (domyślnie `https://openclaw.ai`)

Control UI używa tych metod Gateway ograniczonych zakresem, aby rejestrować i testować subskrypcje przeglądarki:

- `push.web.vapidPublicKey` — pobiera aktywny klucz publiczny VAPID.
- `push.web.subscribe` — rejestruje `endpoint` oraz `keys.p256dh`/`keys.auth`.
- `push.web.unsubscribe` — usuwa zarejestrowany punkt końcowy.
- `push.web.test` — wysyła powiadomienie testowe do subskrypcji wywołującego.

<Note>
Web Push jest niezależny od ścieżki przekaźnika APNS iOS (zobacz [Konfiguracja](/pl/gateway/configuration) dla powiadomień push opartych na przekaźniku) oraz istniejącej metody `push.test`, które są kierowane do natywnego parowania mobilnego.
</Note>

## Hostowane osadzenia

Wiadomości asystenta mogą renderować hostowaną treść webową inline za pomocą shortcode’u `[embed ...]`. Polityka piaskownicy iframe jest kontrolowana przez `gateway.controlUi.embedSandbox`:

<Tabs>
  <Tab title="ścisła">
    Wyłącza wykonywanie skryptów wewnątrz hostowanych osadzeń.
  </Tab>
  <Tab title="skrypty (domyślnie)">
    Pozwala na interaktywne osadzenia, zachowując izolację pochodzenia; jest to ustawienie domyślne i zwykle wystarcza dla samodzielnych gier/widgetów przeglądarkowych.
  </Tab>
  <Tab title="zaufane">
    Dodaje `allow-same-origin` oprócz `allow-scripts` dla dokumentów tej samej witryny, które celowo potrzebują silniejszych uprawnień.
  </Tab>
</Tabs>

Przykład:

```json5
{
  gateway: {
    controlUi: {
      embedSandbox: "scripts",
    },
  },
}
```

<Warning>
Używaj `trusted` tylko wtedy, gdy osadzony dokument naprawdę potrzebuje zachowania tego samego pochodzenia. Dla większości gier generowanych przez agenta i interaktywnych canvasów `scripts` jest bezpieczniejszym wyborem.
</Warning>

Bezwzględne zewnętrzne adresy URL osadzeń `http(s)` pozostają domyślnie zablokowane. Jeśli celowo chcesz, aby `[embed url="https://..."]` ładowało strony firm trzecich, ustaw `gateway.controlUi.allowExternalEmbedUrls: true`.

## Szerokość wiadomości Chat

Zgrupowane wiadomości Chat używają czytelnej domyślnej maksymalnej szerokości. Wdrożenia na szerokich monitorach mogą ją nadpisać bez łatania dołączonego CSS przez ustawienie `gateway.controlUi.chatMessageMaxWidth`:

```json5
{
  gateway: {
    controlUi: {
      chatMessageMaxWidth: "min(1280px, 82%)",
    },
  },
}
```

Wartość jest walidowana, zanim trafi do przeglądarki. Obsługiwane wartości obejmują zwykłe długości i procenty, takie jak `960px` albo `82%`, oraz ograniczone wyrażenia szerokości `min(...)`, `max(...)`, `clamp(...)`, `calc(...)` i `fit-content(...)`.

## Dostęp przez tailnet (zalecane)

<Tabs>
  <Tab title="Zintegrowane Tailscale Serve (preferowane)">
    Utrzymaj Gateway na local loopback i pozwól Tailscale Serve pośredniczyć przez HTTPS:

    ```bash
    openclaw gateway --tailscale serve
    ```

    Otwórz:

    - `https://<magicdns>/` (albo skonfigurowany `gateway.controlUi.basePath`)

    Domyślnie żądania Control UI/WebSocket Serve mogą uwierzytelniać się przez nagłówki tożsamości Tailscale (`tailscale-user-login`), gdy `gateway.auth.allowTailscale` ma wartość `true`. OpenClaw weryfikuje tożsamość, rozwiązując adres `x-forwarded-for` za pomocą `tailscale whois` i dopasowując go do nagłówka, oraz akceptuje je tylko wtedy, gdy żądanie trafia na local loopback z nagłówkami `x-forwarded-*` Tailscale. Dla sesji operatorskich Control UI z tożsamością urządzenia przeglądarki ta zweryfikowana ścieżka Serve pomija też obieg parowania urządzenia; przeglądarki bez urządzenia i połączenia z rolą węzła nadal przechodzą zwykłe sprawdzenia urządzenia. Ustaw `gateway.auth.allowTailscale: false`, jeśli chcesz wymagać jawnych poświadczeń ze współdzielonym sekretem nawet dla ruchu Serve. Następnie użyj `gateway.auth.mode: "token"` albo `"password"`.

    Dla tej asynchronicznej ścieżki tożsamości Serve nieudane próby uwierzytelniania dla tego samego adresu IP klienta i zakresu uwierzytelniania są serializowane przed zapisami limitu szybkości. Równoczesne błędne ponowienia z tej samej przeglądarki mogą więc pokazać `retry later` przy drugim żądaniu zamiast dwóch zwykłych niezgodności ścigających się równolegle.

    <Warning>
    Uwierzytelnianie Serve bez tokena zakłada, że host gateway jest zaufany. Jeśli na tym hoście może działać niezaufany kod lokalny, wymagaj uwierzytelniania tokenem/hasłem.
    </Warning>

  </Tab>
  <Tab title="Powiąż z tailnet + token">
    ```bash
    openclaw gateway --bind tailnet --token "$(openssl rand -hex 32)"
    ```

    Następnie otwórz:

    - `http://<tailscale-ip>:18789/` (albo skonfigurowany `gateway.controlUi.basePath`)

    Wklej pasujący współdzielony sekret w ustawieniach UI (wysyłany jako `connect.params.auth.token` albo `connect.params.auth.password`).

  </Tab>
</Tabs>

## Niezabezpieczony HTTP

Jeśli otworzysz pulpit przez zwykły HTTP (`http://<lan-ip>` albo `http://<tailscale-ip>`), przeglądarka działa w **niezabezpieczonym kontekście** i blokuje WebCrypto. Domyślnie OpenClaw **blokuje** połączenia Control UI bez tożsamości urządzenia.

Udokumentowane wyjątki:

- zgodność niezabezpieczonego HTTP tylko dla localhost z `gateway.controlUi.allowInsecureAuth=true`
- pomyślne uwierzytelnienie operatorskiego Control UI przez `gateway.auth.mode: "trusted-proxy"`
- awaryjne `gateway.controlUi.dangerouslyDisableDeviceAuth=true`

**Zalecana poprawka:** użyj HTTPS (Tailscale Serve) albo otwórz UI lokalnie:

- `https://<magicdns>/` (Serve)
- `http://127.0.0.1:18789/` (na hoście gateway)

<AccordionGroup>
  <Accordion title="Zachowanie przełącznika niezabezpieczonego uwierzytelniania">
    ```json5
    {
      gateway: {
        controlUi: { allowInsecureAuth: true },
        bind: "tailnet",
        auth: { mode: "token", token: "replace-me" },
      },
    }
    ```

    `allowInsecureAuth` jest wyłącznie lokalnym przełącznikiem zgodności:

    - Pozwala sesjom Control UI na localhost kontynuować bez tożsamości urządzenia w niezabezpieczonych kontekstach HTTP.
    - Nie omija sprawdzeń parowania.
    - Nie rozluźnia wymagań tożsamości urządzenia zdalnego (spoza localhost).

  </Accordion>
  <Accordion title="Tylko awaryjnie">
    ```json5
    {
      gateway: {
        controlUi: { dangerouslyDisableDeviceAuth: true },
        bind: "tailnet",
        auth: { mode: "token", token: "replace-me" },
      },
    }
    ```

    <Warning>
    `dangerouslyDisableDeviceAuth` wyłącza sprawdzenia tożsamości urządzenia Control UI i jest poważnym obniżeniem bezpieczeństwa. Wycofaj szybko po użyciu awaryjnym.
    </Warning>

  </Accordion>
  <Accordion title="Uwaga o zaufanym proxy">
    - Pomyślne uwierzytelnienie trusted-proxy może dopuścić sesje Control UI **operatora** bez tożsamości urządzenia.
    - Nie obejmuje to sesji Control UI z rolą węzła.
    - Zwrotne proxy zwrotne na tym samym hoście nadal nie spełniają wymagań uwierzytelniania trusted-proxy; zobacz [Uwierzytelnianie przez zaufane proxy](/pl/gateway/trusted-proxy-auth).

  </Accordion>
</AccordionGroup>

Zobacz [Tailscale](/pl/gateway/tailscale), aby uzyskać wskazówki konfiguracji HTTPS.

## Polityka bezpieczeństwa treści

Control UI jest dostarczany z restrykcyjną polityką `img-src`: dozwolone są tylko zasoby **tego samego pochodzenia**, adresy URL `data:` oraz lokalnie wygenerowane adresy URL `blob:`. Zdalne adresy URL obrazów `http(s)` i względne względem protokołu są odrzucane przez przeglądarkę i nie powodują pobrań sieciowych.

Co to oznacza w praktyce:

- Awatary i obrazy serwowane pod ścieżkami względnymi (na przykład `/avatars/<id>`) nadal się renderują, w tym uwierzytelnione trasy awatarów, które UI pobiera i konwertuje na lokalne adresy URL `blob:`.
- Inline’owe adresy URL `data:image/...` nadal się renderują (przydatne dla ładunków w protokole).
- Lokalne adresy URL `blob:` utworzone przez Control UI nadal się renderują.
- Zdalne adresy URL awatarów emitowane przez metadane kanału są usuwane w helperach awatarów Control UI i zastępowane wbudowanym logo/odznaką, więc przejęty lub złośliwy kanał nie może wymusić dowolnych zdalnych pobrań obrazów z przeglądarki operatora.

Nie musisz nic zmieniać, aby uzyskać to zachowanie — jest zawsze włączone i nie można go konfigurować.

## Uwierzytelnianie trasy awatara

Gdy uwierzytelnianie gateway jest skonfigurowane, punkt końcowy awatara Control UI wymaga tego samego tokenu gateway co reszta API:

- `GET /avatar/<agentId>` zwraca obraz awatara tylko uwierzytelnionym wywołującym. `GET /avatar/<agentId>?meta=1` zwraca metadane awatara na tej samej zasadzie.
- Nieuwierzytelnione żądania do którejkolwiek trasy są odrzucane (tak jak pokrewna trasa assistant-media). Zapobiega to wyciekowi tożsamości agenta przez trasę awatara na hostach, które są poza tym chronione.
- Sam Control UI przekazuje token gateway jako nagłówek bearer podczas pobierania awatarów i używa uwierzytelnionych adresów URL blob, dzięki czemu obraz nadal renderuje się w pulpitach.

Jeśli wyłączysz uwierzytelnianie Gateway (niezalecane na współdzielonych hostach), trasa awatara również stanie się nieuwierzytelniona, zgodnie z resztą Gateway.

## Uwierzytelnianie trasy multimediów asystenta

Gdy uwierzytelnianie Gateway jest skonfigurowane, lokalne podglądy multimediów asystenta używają trasy dwuetapowej:

- `GET /__openclaw__/assistant-media?meta=1&source=<path>` wymaga standardowego uwierzytelnienia operatora Control UI. Przeglądarka wysyła token Gateway jako nagłówek bearer podczas sprawdzania dostępności.
- Pomyślne odpowiedzi metadanych zawierają krótkotrwały `mediaTicket` ograniczony do dokładnie tej ścieżki źródłowej.
- Adresy URL obrazów, audio, wideo i dokumentów renderowanych w przeglądarce używają `mediaTicket=<ticket>` zamiast aktywnego tokenu lub hasła Gateway. Bilet szybko wygasa i nie może autoryzować innego źródła.

Dzięki temu standardowe renderowanie multimediów pozostaje zgodne z natywnymi elementami multimedialnymi przeglądarki bez umieszczania wielokrotnego użytku poświadczeń Gateway w widocznych adresach URL multimediów.

## Budowanie UI

Gateway udostępnia pliki statyczne z `dist/control-ui`. Zbuduj je poleceniem:

```bash
pnpm ui:build
```

Opcjonalna bezwzględna baza (gdy chcesz mieć stałe adresy URL zasobów):

```bash
OPENCLAW_CONTROL_UI_BASE_PATH=/openclaw/ pnpm ui:build
```

Do lokalnego programowania (osobny serwer deweloperski):

```bash
pnpm ui:dev
```

Następnie skieruj UI na adres URL WS swojego Gateway (np. `ws://127.0.0.1:18789`).

## Pusta strona Control UI

Jeśli przeglądarka ładuje pusty panel, a DevTools nie pokazuje użytecznego błędu, rozszerzenie lub wczesny skrypt treści mógł uniemożliwić wykonanie aplikacji modułu JavaScript. Strona statyczna zawiera prosty panel odzyskiwania HTML, który pojawia się, gdy `<openclaw-app>` nie zostanie zarejestrowany po uruchomieniu.

Użyj akcji **Spróbuj ponownie** w panelu po zmianie środowiska przeglądarki albo przeładuj ręcznie po tych sprawdzeniach:

- Wyłącz rozszerzenia wstrzykujące kod do wszystkich stron, zwłaszcza rozszerzenia ze skryptami treści `<all_urls>`.
- Spróbuj użyć okna prywatnego, czystego profilu przeglądarki albo innej przeglądarki.
- Utrzymaj działanie Gateway i sprawdź ten sam adres URL panelu po zmianie przeglądarki.

## Debugowanie/testowanie: serwer deweloperski + zdalny Gateway

Control UI to pliki statyczne; cel WebSocket jest konfigurowalny i może różnić się od źródła HTTP. Jest to przydatne, gdy chcesz używać lokalnie serwera deweloperskiego Vite, ale Gateway działa gdzie indziej.

<Steps>
  <Step title="Start the UI dev server">
    ```bash
    pnpm ui:dev
    ```
  </Step>
  <Step title="Open with gatewayUrl">
    ```text
    http://localhost:5173/?gatewayUrl=ws%3A%2F%2F<gateway-host>%3A18789
    ```

    Opcjonalne jednorazowe uwierzytelnienie (w razie potrzeby):

    ```text
    http://localhost:5173/?gatewayUrl=wss%3A%2F%2F<gateway-host>%3A18789#token=<gateway-token>
    ```

  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Notes">
    - `gatewayUrl` jest zapisywany w localStorage po załadowaniu i usuwany z adresu URL.
    - Jeśli przekazujesz pełny punkt końcowy `ws://` lub `wss://` przez `gatewayUrl`, zakoduj wartość `gatewayUrl` w URL, aby przeglądarka poprawnie przeanalizowała ciąg zapytania.
    - `token` należy przekazywać przez fragment URL (`#token=...`), gdy tylko jest to możliwe. Fragmenty nie są wysyłane do serwera, co zapobiega wyciekom w logach żądań i nagłówku Referer. Starsze parametry zapytania `?token=` nadal są importowane jednorazowo dla zgodności, ale tylko jako rozwiązanie awaryjne, i są natychmiast usuwane po bootstrapie.
    - `password` jest przechowywane wyłącznie w pamięci.
    - Gdy `gatewayUrl` jest ustawiony, UI nie wraca do poświadczeń z konfiguracji ani środowiska. Podaj `token` (lub `password`) jawnie. Brak jawnych poświadczeń jest błędem.
    - Użyj `wss://`, gdy Gateway znajduje się za TLS (Tailscale Serve, proxy HTTPS itp.).
    - `gatewayUrl` jest akceptowany tylko w oknie najwyższego poziomu (nie osadzonym), aby zapobiec clickjackingowi.
    - Publiczne wdrożenia Control UI poza loopback muszą jawnie ustawić `gateway.controlUi.allowedOrigins` (pełne źródła). Prywatne ładowania z tej samej domeny w LAN/Tailnet z loopback, RFC1918/link-local, `.local`, `.ts.net` lub hostów Tailscale CGNAT są akceptowane bez włączania awaryjnego dopasowania na podstawie nagłówka Host.
    - Uruchomienie Gateway może zasilić lokalne źródła, takie jak `http://localhost:<port>` i `http://127.0.0.1:<port>`, z efektywnego wiązania i portu środowiska uruchomieniowego, ale źródła zdalnych przeglądarek nadal wymagają jawnych wpisów.
    - Nie używaj `gateway.controlUi.allowedOrigins: ["*"]` poza ściśle kontrolowanymi testami lokalnymi. Oznacza to zezwolenie na dowolne źródło przeglądarki, a nie „dopasuj dowolny host, którego używam”.
    - `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` włącza tryb awaryjnego źródła na podstawie nagłówka Host, ale jest to niebezpieczny tryb bezpieczeństwa.

  </Accordion>
</AccordionGroup>

Przykład:

```json5
{
  gateway: {
    controlUi: {
      allowedOrigins: ["http://localhost:5173"],
    },
  },
}
```

Szczegóły konfiguracji dostępu zdalnego: [Dostęp zdalny](/pl/gateway/remote).

## Powiązane

- [Panel](/pl/web/dashboard) — panel Gateway
- [Kontrole kondycji](/pl/gateway/health) — monitorowanie kondycji Gateway
- [TUI](/pl/web/tui) — terminalowy interfejs użytkownika
- [WebChat](/pl/web/webchat) — interfejs czatu oparty na przeglądarce
