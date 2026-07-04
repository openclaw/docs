---
read_when:
    - Chcesz obsługiwać Gateway z przeglądarki
    - Chcesz dostępu do Tailnet bez tuneli SSH
sidebarTitle: Control UI
summary: Interfejs sterowania w przeglądarce dla Gateway (czat, aktywność, węzły, konfiguracja)
title: Interfejs sterowania
x-i18n:
    generated_at: "2026-07-04T20:45:57Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 883e951b304a104a5cb2d0197199d06e372b1b8a25efdfd082ae190575bf409d
    source_path: web/control-ui.md
    workflow: 16
---

Interfejs Control UI to mała jednostronicowa aplikacja **Vite + Lit** obsługiwana przez Gateway:

- domyślnie: `http://<host>:18789/`
- opcjonalny prefiks: ustaw `gateway.controlUi.basePath` (np. `/openclaw`)

Komunikuje się **bezpośrednio z WebSocket Gateway** na tym samym porcie.

## Szybkie otwieranie (lokalnie)

Jeśli Gateway działa na tym samym komputerze, otwórz:

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/) (lub [http://localhost:18789/](http://localhost:18789/))

Jeśli strona się nie ładuje, najpierw uruchom Gateway: `openclaw gateway`.

<Note>
W natywnych powiązaniach LAN w Windows Zapora Windows lub zarządzane przez organizację zasady Group Policy nadal mogą blokować ogłaszany URL LAN, nawet gdy `127.0.0.1` działa na hoście Gateway. Uruchom `openclaw gateway status --deep` na hoście Windows; zgłasza on prawdopodobnie zablokowane porty, niezgodności profili oraz lokalne reguły zapory, które zasady mogą ignorować.
</Note>

Uwierzytelnianie jest przekazywane podczas uzgadniania WebSocket przez:

- `connect.params.auth.token`
- `connect.params.auth.password`
- nagłówki tożsamości Tailscale Serve, gdy `gateway.auth.allowTailscale: true`
- nagłówki tożsamości zaufanego proxy, gdy `gateway.auth.mode: "trusted-proxy"`

Panel ustawień pulpitu przechowuje token dla bieżącej sesji karty przeglądarki i wybranego adresu URL gateway; hasła nie są utrwalane. Onboarding zwykle generuje token gateway dla uwierzytelniania współdzielonym sekretem przy pierwszym połączeniu, ale uwierzytelnianie hasłem także działa, gdy `gateway.auth.mode` ma wartość `"password"`.

## Parowanie urządzenia (pierwsze połączenie)

Gdy łączysz się z interfejsem Control UI z nowej przeglądarki lub urządzenia, Gateway zwykle wymaga **jednorazowego zatwierdzenia parowania**. To środek bezpieczeństwa zapobiegający nieautoryzowanemu dostępowi.

**Co zobaczysz:** „disconnected (1008): pairing required”

<Steps>
  <Step title="List pending requests">
    ```bash
    openclaw devices list
    ```
  </Step>
  <Step title="Approve by request ID">
    ```bash
    openclaw devices approve <requestId>
    ```
  </Step>
</Steps>

Jeśli przeglądarka ponowi parowanie ze zmienionymi szczegółami uwierzytelniania (rola/zakresy/klucz publiczny), poprzednie oczekujące żądanie zostaje zastąpione i tworzone jest nowe `requestId`. Przed zatwierdzeniem ponownie uruchom `openclaw devices list`.

Jeśli przeglądarka jest już sparowana i zmienisz ją z dostępu do odczytu na dostęp do zapisu/administracyjny, jest to traktowane jako podniesienie poziomu zatwierdzenia, a nie ciche ponowne połączenie. OpenClaw zachowuje aktywne stare zatwierdzenie, blokuje szersze ponowne połączenie i prosi o jawne zatwierdzenie nowego zestawu zakresów.

Po zatwierdzeniu urządzenie jest zapamiętywane i nie będzie wymagać ponownego zatwierdzenia, chyba że je odwołasz poleceniem `openclaw devices revoke --device <id> --role <role>`. Zobacz [CLI urządzeń](/pl/cli/devices), aby poznać rotację tokenów i odwoływanie.

Agenci Paperclip łączący się przez adapter `openclaw_gateway` używają tego samego przepływu zatwierdzania przy pierwszym uruchomieniu. Po pierwszej próbie połączenia uruchom `openclaw devices approve --latest`, aby podejrzeć oczekujące żądanie, a następnie ponownie uruchom wypisane polecenie `openclaw devices approve <requestId>`, aby je zatwierdzić. Dla zdalnego gateway przekaż jawne wartości `--url` i `--token`. Aby zatwierdzenia były stabilne między restartami, skonfiguruj w Paperclip trwałe `adapterConfig.devicePrivateKeyPem`, zamiast pozwalać mu generować nową efemeryczną tożsamość urządzenia przy każdym uruchomieniu.

<Note>
- Bezpośrednie połączenia przeglądarki przez local loopback (`127.0.0.1` / `localhost`) są zatwierdzane automatycznie.
- Tailscale Serve może pominąć rundę parowania dla sesji operatora Control UI, gdy `gateway.auth.allowTailscale: true`, tożsamość Tailscale zostanie zweryfikowana, a przeglądarka przedstawi swoją tożsamość urządzenia.
- Bezpośrednie powiązania Tailnet, połączenia przeglądarki przez LAN oraz profile przeglądarki bez tożsamości urządzenia nadal wymagają jawnego zatwierdzenia.
- Każdy profil przeglądarki generuje unikalny identyfikator urządzenia, więc zmiana przeglądarki lub wyczyszczenie danych przeglądarki będzie wymagać ponownego parowania.

</Note>

## Sparuj urządzenie mobilne

Administrator, który jest już sparowany, może utworzyć QR połączenia iOS/Android bez
otwierania terminala:

<Steps>
  <Step title="Open mobile pairing">
    Wybierz **Węzły**, a następnie kliknij **Sparuj urządzenie mobilne** na karcie **Urządzenia**.
  </Step>
  <Step title="Connect the phone">
    W aplikacji mobilnej OpenClaw otwórz **Ustawienia** → **Gateway** i zeskanuj kod QR.
    Zamiast tego możesz skopiować i wkleić kod konfiguracji.
  </Step>
  <Step title="Confirm the connection">
    Oficjalna aplikacja iOS/Android łączy się automatycznie. Jeśli **Urządzenia** pokazują
    oczekujące żądanie, sprawdź jego rolę i zakresy przed zatwierdzeniem.
  </Step>
</Steps>

Utworzenie kodu konfiguracji wymaga `operator.admin`; przycisk jest wyłączony dla
sesji bez tego uprawnienia. Kod konfiguracji zawiera krótkotrwałe poświadczenie
rozruchowe, więc traktuj QR i skopiowany kod jak hasło, dopóki są ważne. Przy zdalnym
parowaniu Gateway musi rozwiązywać się do `wss://` (na przykład przez Tailscale
Serve/Funnel); zwykłe `ws://` jest ograniczone do loopback i prywatnych adresów LAN.
Zobacz [Parowanie](/pl/channels/pairing#pair-from-the-control-ui-recommended), aby poznać
pełne szczegóły bezpieczeństwa i zachowania awaryjnego.

## Tożsamość osobista (lokalna dla przeglądarki)

Control UI obsługuje osobistą tożsamość przypisaną do przeglądarki (nazwę wyświetlaną i awatar), dołączaną do wiadomości wychodzących na potrzeby atrybucji w sesjach współdzielonych. Jest przechowywana w pamięci przeglądarki, ograniczona do bieżącego profilu przeglądarki i nie jest synchronizowana z innymi urządzeniami ani utrwalana po stronie serwera poza zwykłymi metadanymi autorstwa transkrypcji dla wiadomości, które faktycznie wysyłasz. Wyczyszczenie danych witryny lub zmiana przeglądarki resetuje ją do pustej.

Ten sam wzorzec lokalny dla przeglądarki dotyczy nadpisania awatara asystenta. Przesłane awatary asystenta nakładają tożsamość rozwiązaną przez gateway tylko w lokalnej przeglądarce i nigdy nie przechodzą w obie strony przez `config.patch`. Współdzielone pole konfiguracji `ui.assistant.avatar` jest nadal dostępne dla klientów innych niż UI zapisujących pole bezpośrednio (takich jak skryptowe gatewaye lub niestandardowe pulpity).

## Punkt końcowy konfiguracji czasu uruchomienia

Control UI pobiera swoje ustawienia czasu uruchomienia z `/control-ui-config.json`, rozwiązywanego względem ścieżki bazowej Control UI gateway (na przykład `/__openclaw__/control-ui-config.json`, gdy UI jest obsługiwany pod `/__openclaw__/`). Ten punkt końcowy jest chroniony tym samym uwierzytelnianiem gateway co reszta powierzchni HTTP: nieuwierzytelnione przeglądarki nie mogą go pobrać, a udane pobranie wymaga albo już ważnego tokena/hasła gateway, tożsamości Tailscale Serve, albo tożsamości zaufanego proxy.

## Obsługa języków

Control UI może lokalizować się przy pierwszym ładowaniu na podstawie ustawień regionalnych przeglądarki. Aby później je nadpisać, otwórz **Przegląd -> Dostęp do Gateway -> Język**. Selektor ustawień regionalnych znajduje się na karcie Dostęp do Gateway, a nie w sekcji Wygląd.

- Obsługiwane ustawienia regionalne: `en`, `zh-CN`, `zh-TW`, `pt-BR`, `de`, `es`, `ja-JP`, `ko`, `fr`, `ar`, `it`, `tr`, `uk`, `id`, `pl`, `th`, `vi`, `nl`, `fa`
- Tłumaczenia inne niż angielskie są ładowane leniwie w przeglądarce.
- Wybrane ustawienie regionalne jest zapisywane w pamięci przeglądarki i używane ponownie przy przyszłych wizytach.
- Brakujące klucze tłumaczeń wracają do języka angielskiego.

Tłumaczenia dokumentacji są generowane dla tego samego zestawu ustawień regionalnych innych niż angielskie, ale wbudowany selektor języka witryny dokumentacji Mintlify jest ograniczony do kodów ustawień regionalnych akceptowanych przez Mintlify. Dokumentacja tajska (`th`) i perska (`fa`) nadal jest generowana w repozytorium publikacji; może nie pojawiać się w tym selektorze, dopóki Mintlify nie zacznie obsługiwać tych kodów.

## Motywy wyglądu

Panel Wygląd zachowuje wbudowane motywy Claw, Knot i Dash oraz jedno lokalne dla przeglądarki miejsce importu tweakcn. Aby zaimportować motyw, otwórz [edytor tweakcn](https://tweakcn.com/editor/theme), wybierz lub utwórz motyw, kliknij **Udostępnij** i wklej skopiowany link motywu do sekcji Wygląd. Importer akceptuje także adresy URL rejestru `https://tweakcn.com/r/themes/<id>`, adresy URL edytora takie jak `https://tweakcn.com/editor/theme?theme=amethyst-haze`, względne ścieżki `/themes/<id>`, surowe identyfikatory motywów oraz domyślne nazwy motywów, takie jak `amethyst-haze`.

Wygląd obejmuje też lokalne dla przeglądarki ustawienie rozmiaru tekstu. Ustawienie jest przechowywane razem z pozostałymi preferencjami Control UI, dotyczy tekstu czatu, tekstu kompozytora, kart narzędzi i pasków bocznych czatu oraz utrzymuje pola tekstowe na poziomie co najmniej 16px, aby mobilne Safari nie wykonywało automatycznego powiększenia po ustawieniu fokusu.

Zaimportowane motywy są przechowywane tylko w bieżącym profilu przeglądarki. Nie są zapisywane w konfiguracji gateway i nie synchronizują się między urządzeniami. Zastąpienie zaimportowanego motywu aktualizuje jedno lokalne miejsce; wyczyszczenie go przełącza aktywny motyw z powrotem na Claw, jeśli zaimportowany motyw był wybrany.

## Co może zrobić (obecnie)

<AccordionGroup>
  <Accordion title="Chat and Talk">
    - Czat z modelem przez Gateway WS (`chat.history`, `chat.send`, `chat.abort`, `chat.inject`).
    - Odświeżenia historii czatu żądają ograniczonego ostatniego okna z limitami tekstu na wiadomość, aby duże sesje nie zmuszały przeglądarki do renderowania pełnego ładunku transkrypcji, zanim czat stanie się użyteczny.
    - Rozmowa przez sesje czasu rzeczywistego w przeglądarce. OpenAI używa bezpośredniego WebRTC, Google Live używa ograniczonego jednorazowego tokena przeglądarki przez WebSocket, a wtyczki głosu czasu rzeczywistego wyłącznie backendowe używają transportu przekaźnikowego Gateway. Sesje dostawcy należące do klienta zaczynają się od `talk.client.create`; sesje przekaźnika Gateway zaczynają się od `talk.session.create`. Przekaźnik utrzymuje poświadczenia dostawcy w Gateway, podczas gdy przeglądarka strumieniuje PCM mikrofonu przez `talk.session.appendAudio`, przekazuje wywołania narzędzi dostawcy `openclaw_agent_consult` przez `talk.client.toolCall` dla zasad Gateway i większego skonfigurowanego modelu OpenClaw oraz kieruje sterowanie głosem aktywnego uruchomienia przez `talk.client.steer` lub `talk.session.steer`.
    - Strumieniowanie wywołań narzędzi + aktywne karty wyjścia narzędzi w Czacie (zdarzenia agenta).
    - Karta Aktywność z lokalnymi dla przeglądarki, nastawionymi na redakcję podsumowaniami aktywności narzędzi na żywo z istniejącego dostarczania zdarzeń `session.tool` / narzędzi.

  </Accordion>
  <Accordion title="Channels, instances, sessions, dreams">
    - Kanały: wbudowane oraz dołączone/zewnętrzne kanały Plugin, stan, logowanie QR i konfiguracja dla kanału (`channels.status`, `web.login.*`, `config.patch`).
    - Odświeżenia sond kanałów utrzymują widoczny poprzedni zrzut, gdy kończą się powolne kontrole dostawcy, a częściowe zrzuty są oznaczane, gdy sonda lub audyt przekroczy budżet UI.
    - Instancje: lista obecności + odświeżanie (`system-presence`).
    - Sesje: domyślnie lista sesji skonfigurowanych agentów, przypinanie częstych sesji, zmiana ich nazw, archiwizowanie lub przywracanie nieaktywnych sesji, powrót ze starych kluczy sesji nieskonfigurowanych agentów oraz stosowanie nadpisań modelu/myślenia/trybu szybkiego/szczegółowości/śledzenia/rozumowania dla sesji (`sessions.list`, `sessions.patch`). Przypięte sesje sortują się nad ostatnimi nieprzypiętymi sesjami; zarchiwizowane sesje znajdują się w widoku zarchiwizowanych na stronie Sesje i zachowują swoje transkrypcje.
    - Dreams: stan Dreaming, przełącznik włącz/wyłącz oraz czytnik Dream Diary (`doctor.memory.status`, `doctor.memory.dreamDiary`, `config.patch`).

  </Accordion>
  <Accordion title="Cron, skills, nodes, exec approvals">
    - Zadania Cron: lista/dodawanie/edycja/uruchamianie/włączanie/wyłączanie + historia uruchomień (`cron.*`).
    - Skills: stan, włączanie/wyłączanie, instalowanie, aktualizacje klucza API (`skills.*`).
    - Węzły: lista + limity (`node.list`), tworzenie mobilnych kodów konfiguracji oraz zatwierdzanie parowania urządzeń (`device.pair.*`).
    - Zatwierdzenia exec: edycja list dozwolonych gateway lub węzła + zasada pytania dla `exec host=gateway/node` (`exec.approvals.*`).

  </Accordion>
  <Accordion title="Konfiguracja">
    - Wyświetl/edytuj `~/.openclaw/openclaw.json` (`config.get`, `config.set`).
    - MCP ma dedykowaną stronę ustawień dla skonfigurowanych serwerów, włączania, podsumowań OAuth/filtrów/równoległości, typowych poleceń operatorskich oraz zakresowego edytora konfiguracji `mcp`.
    - Zastosuj + uruchom ponownie z walidacją (`config.apply`) i wybudź ostatnią aktywną sesję.
    - Zapisy obejmują zabezpieczenie base-hash, aby zapobiec nadpisaniu równoczesnych edycji.
    - Zapisy (`config.set`/`config.apply`/`config.patch`) w ramach kontroli wstępnej rozpoznają aktywne SecretRef dla referencji w przesłanym ładunku konfiguracji; nierozwiązane aktywne przesłane referencje są odrzucane przed zapisem.
    - Zapisy formularza odrzucają nieaktualne zredagowane symbole zastępcze, których nie można przywrócić z zapisanej konfiguracji, zachowując zredagowane wartości, które nadal mapują się na zapisane sekrety.
    - Renderowanie schematu + formularza (`config.schema` / `config.schema.lookup`, w tym pola `title` / `description`, dopasowane wskazówki UI, podsumowania bezpośrednich elementów podrzędnych, metadane dokumentacji na zagnieżdżonych węzłach obiektów/wieloznaczników/tablic/kompozycji, a także schematy pluginów + kanałów, gdy są dostępne); edytor Raw JSON jest dostępny tylko wtedy, gdy migawka ma bezpieczny surowy round-trip.
    - Jeśli migawka nie może bezpiecznie wykonać round-trip surowego tekstu, Control UI wymusza tryb formularza i wyłącza tryb Raw dla tej migawki.
    - Edytor Raw JSON „Resetuj do zapisanej” zachowuje kształt utworzony w trybie surowym (formatowanie, komentarze, układ `$include`) zamiast ponownie renderować spłaszczoną migawkę, więc zewnętrzne edycje przetrwają reset, gdy migawka może bezpiecznie wykonać round-trip.
    - Strukturalne wartości obiektów SecretRef są renderowane jako tylko do odczytu w tekstowych polach formularza, aby zapobiec przypadkowemu uszkodzeniu przez konwersję obiektu na ciąg znaków.

  </Accordion>
  <Accordion title="Debugowanie, dzienniki, aktualizacja">
    - Debugowanie: migawki statusu/kondycji/modeli + dziennik zdarzeń + ręczne wywołania RPC (`status`, `health`, `models.list`).
    - Dziennik zdarzeń zawiera czasy odświeżania/RPC Control UI, czasy powolnego renderowania czatu/konfiguracji oraz wpisy responsywności przeglądarki dla długich klatek animacji lub długich zadań, gdy przeglądarka udostępnia te typy wpisów PerformanceObserver.
    - Dzienniki: śledzenie na żywo dzienników plików gateway z filtrowaniem/eksportem (`logs.tail`).
    - Aktualizacja: uruchom aktualizację pakietu/git + ponowne uruchomienie (`update.run`) z raportem ponownego uruchomienia, a następnie odpytuj `update.status` po ponownym połączeniu, aby zweryfikować działającą wersję gateway.

  </Accordion>
  <Accordion title="Uwagi dotyczące panelu zadań Cron">
    - Dla izolowanych zadań domyślnym dostarczaniem jest ogłaszanie podsumowania. Możesz przełączyć na brak, jeśli chcesz uruchomień wyłącznie wewnętrznych.
    - Pola kanału/celu pojawiają się po wybraniu ogłaszania.
    - Tryb Webhook używa `delivery.mode = "webhook"` z `delivery.to` ustawionym na prawidłowy URL webhooka HTTP(S).
    - Dla zadań głównej sesji dostępne są tryby dostarczania webhook i brak.
    - Zaawansowane kontrolki edycji obejmują usunięcie po uruchomieniu, wyczyszczenie nadpisania agenta, opcje dokładnego/rozłożonego Cron, nadpisania modelu/myślenia agenta oraz przełączniki dostarczania best-effort.
    - Walidacja formularza jest wbudowana z błędami na poziomie pól; nieprawidłowe wartości wyłączają przycisk zapisu do czasu poprawienia.
    - Ustaw `cron.webhookToken`, aby wysyłać dedykowany token bearer; jeśli zostanie pominięty, webhook zostanie wysłany bez nagłówka uwierzytelniania.
    - Przestarzały mechanizm awaryjny: uruchom `openclaw doctor --fix`, aby zmigrować zapisane starsze zadania z `notify: true` z `cron.webhook` do jawnego webhooka dla zadania lub dostarczania po ukończeniu.

  </Accordion>
</AccordionGroup>

## Strona MCP

Dedykowana strona MCP to widok operatorski dla serwerów MCP zarządzanych przez OpenClaw w `mcp.servers`. Sama nie uruchamia transportów MCP; używaj jej do sprawdzania i edytowania zapisanej konfiguracji, a następnie użyj `openclaw mcp doctor --probe`, gdy potrzebujesz dowodu działania serwera na żywo.

Typowy przepływ pracy:

1. Otwórz **MCP** z paska bocznego.
2. Sprawdź karty podsumowania pod kątem łącznej liczby serwerów oraz liczby serwerów włączonych, OAuth i filtrowanych.
3. Przejrzyj każdy wiersz serwera pod kątem transportu, włączenia, uwierzytelniania, filtrów, limitów czasu i wskazówek poleceń.
4. Przełącz włączenie, gdy serwer powinien pozostać skonfigurowany, ale pozostać poza wykrywaniem w czasie działania.
5. Edytuj zakresową sekcję konfiguracji `mcp` dla definicji serwerów, nagłówków, ścieżek TLS/mTLS, metadanych OAuth, filtrów narzędzi i metadanych projekcji Codex.
6. Użyj **Zapisz** do zapisu konfiguracji albo **Zapisz i opublikuj**, gdy działający Gateway powinien zastosować zmienioną konfigurację.
7. Uruchom `openclaw mcp status --verbose`, `openclaw mcp doctor --probe` albo `openclaw mcp reload` z terminala, gdy edytowany proces potrzebuje statycznej diagnostyki, dowodu na żywo albo usunięcia pamięci podręcznej środowiska wykonawczego.

Strona redaguje wartości podobne do URL-i zawierające poświadczenia przed renderowaniem i ujmuje nazwy serwerów w cudzysłów we fragmentach poleceń, aby skopiowane polecenia nadal działały ze spacjami lub metaznakami powłoki. Pełna dokumentacja CLI i konfiguracji znajduje się w [MCP](/pl/cli/mcp).

## Karta Aktywność

Karta Aktywność jest efemerycznym, lokalnym dla przeglądarki obserwatorem aktywności narzędzi na żywo. Jest wyprowadzona z tego samego strumienia zdarzeń Gateway `session.tool` / narzędzi, który zasila karty narzędzi w czacie; nie dodaje kolejnej rodziny zdarzeń Gateway, punktu końcowego, trwałego magazynu aktywności, kanału metryk ani zewnętrznego strumienia obserwatora.

Wpisy aktywności zachowują tylko oczyszczone podsumowania oraz zredagowane, skrócone podglądy wyjścia. Wartości argumentów narzędzi nie są przechowywane w stanie Aktywności; UI pokazuje, że argumenty są ukryte, i zapisuje tylko liczbę pól argumentów. Lista w pamięci podąża za bieżącą kartą przeglądarki, przetrwa nawigację w obrębie Control UI i resetuje się przy przeładowaniu strony, zmianie sesji lub **Wyczyść**.

## Zachowanie czatu

<AccordionGroup>
  <Accordion title="Semantyka wysyłania i historii">
    - `chat.send` jest **nieblokujące**: natychmiast potwierdza z `{ runId, status: "started" }`, a odpowiedź jest strumieniowana przez zdarzenia `chat`. Zaufani klienci Control UI mogą również otrzymywać opcjonalne metadane czasu ACK do lokalnej diagnostyki.
    - Przesyłanie w czacie akceptuje obrazy oraz pliki inne niż wideo. Obrazy zachowują natywną ścieżkę obrazu; pozostałe pliki są przechowywane jako zarządzane media i pokazywane w historii jako linki załączników.
    - Ponowne wysłanie z tym samym `idempotencyKey` zwraca `{ status: "in_flight" }` podczas działania oraz `{ status: "ok" }` po ukończeniu.
    - Odpowiedzi `chat.history` mają ograniczony rozmiar dla bezpieczeństwa UI. Gdy wpisy transkrypcji są zbyt duże, Gateway może skracać długie pola tekstowe, pomijać ciężkie bloki metadanych i zastępować zbyt duże wiadomości symbolem zastępczym (`[chat.history omitted: message too large]`).
    - Gdy widoczna wiadomość asystenta została skrócona w `chat.history`, boczny czytnik może na żądanie pobrać pełny wpis transkrypcji znormalizowany do wyświetlenia przez `chat.message.get`, używając `sessionKey`, aktywnego `agentId` w razie potrzeby oraz `messageId` transkrypcji. Jeśli Gateway nadal nie może zwrócić więcej, czytnik pokazuje jawny stan niedostępności zamiast po cichu powtarzać skrócony podgląd.
    - Obrazy asystenta/wygenerowane są utrwalane jako zarządzane referencje mediów i zwracane przez uwierzytelnione adresy URL mediów Gateway, więc przeładowania nie zależą od pozostawania surowych ładunków obrazów base64 w odpowiedzi historii czatu.
    - Podczas renderowania `chat.history` Control UI usuwa z widocznego tekstu asystenta wyłącznie wyświetleniowe tagi dyrektyw inline (na przykład `[[reply_to_*]]` i `[[audio_as_voice]]`), tekstowe ładunki XML wywołań narzędzi (w tym `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` i skrócone bloki wywołań narzędzi) oraz ujawnione tokeny sterujące modelu ASCII/full-width, a także pomija wpisy asystenta, których cały widoczny tekst to tylko dokładny cichy token `NO_REPLY` / `no_reply` albo token potwierdzenia heartbeat `HEARTBEAT_OK`.
    - Podczas aktywnego wysyłania i końcowego odświeżenia historii widok czatu zachowuje widoczne lokalne optymistyczne wiadomości użytkownika/asystenta, jeśli `chat.history` krótko zwróci starszą migawkę; kanoniczna transkrypcja zastępuje te lokalne wiadomości, gdy historia Gateway nadrobi zaległość.
    - Zdarzenia `chat` na żywo są stanem dostarczania, podczas gdy `chat.history` jest odbudowywane z trwałej transkrypcji sesji. Po zdarzeniach finalizacji narzędzi Control UI przeładowuje historię i scala tylko niewielką optymistyczną końcówkę; granica transkrypcji jest udokumentowana w [WebChat](/pl/web/webchat).
    - `chat.inject` dołącza notatkę asystenta do transkrypcji sesji i rozgłasza zdarzenie `chat` dla aktualizacji wyłącznie UI (bez uruchomienia agenta, bez dostarczania kanałem).
    - Pasek boczny wyświetla ostatnie sesje z akcją Nowa sesja, linkiem Wszystkie sesje oraz przyciskiem wyszukiwania sesji, który otwiera pełny selektor sesji (zakresowy według wybranego agenta, z wyszukiwaniem i paginacją). Przełączanie agentów pokazuje tylko sesje powiązane z tym agentem i przechodzi awaryjnie do głównej sesji tego agenta, gdy nie ma on jeszcze zapisanych sesji pulpitu.
    - Każdy wiersz selektora sesji może zmienić nazwę, przypiąć lub zarchiwizować sesję. Aktywne uruchomienie i główna sesja agenta nie mogą zostać zarchiwizowane. Zarchiwizowanie aktualnie wybranej sesji przełącza czat z powrotem na główną sesję tego agenta.
    - Na szerokościach desktopowych kontrolki czatu pozostają w jednym kompaktowym wierszu i zwijają się podczas przewijania w dół transkrypcji; przewinięcie w górę, powrót na początek lub dojście do końca przywraca kontrolki.
    - Kolejne zduplikowane wiadomości zawierające tylko tekst renderują się jako jeden dymek z plakietką liczby. Wiadomości zawierające obrazy, załączniki, wyjście narzędzi lub podglądy canvas pozostają niezwinięte.
    - Selektory modelu i myślenia w nagłówku czatu natychmiast aktualizują aktywną sesję przez `sessions.patch`; są trwałymi nadpisaniami sesji, a nie opcjami wysyłania tylko dla jednej tury.
    - Jeśli wyślesz wiadomość, gdy zmiana selektora modelu dla tej samej sesji nadal się zapisuje, kompozytor czeka na tę aktualizację sesji przed wywołaniem `chat.send`, aby wysyłka użyła wybranego modelu.
    - Wpisanie `/new` w Control UI tworzy i przełącza na tę samą świeżą sesję pulpitu co Nowy czat, z wyjątkiem sytuacji, gdy skonfigurowano `session.dmScope: "main"` i bieżący rodzic jest główną sesją agenta; wtedy resetuje główną sesję na miejscu. Wpisanie `/reset` zachowuje jawny reset bieżącej sesji na miejscu w Gateway.
    - Selektor modelu czatu żąda skonfigurowanego widoku modeli Gateway. Jeśli obecne jest `agents.defaults.models`, ta lista dozwolonych wartości steruje selektorem, w tym wpisami `provider/*`, które utrzymują dynamiczne katalogi w zakresie dostawcy. W przeciwnym razie selektor pokazuje jawne wpisy `models.providers.*.models` oraz dostawców z użytecznym uwierzytelnianiem. Pełny katalog pozostaje dostępny przez debugujące RPC `models.list` z `view: "all"`.
    - Gdy świeże raporty użycia sesji Gateway zawierają bieżące tokeny kontekstu, pasek narzędzi kompozytora czatu pokazuje mały pierścień użycia kontekstu z procentem użycia; pełne szczegóły tokenów znajdują się w jego podpowiedzi. Pierścień przełącza się na styl ostrzegawczy przy wysokim obciążeniu kontekstu i, przy zalecanych poziomach Compaction, pokazuje kompaktowy przycisk uruchamiający normalną ścieżkę Compaction sesji. Nieaktualne migawki tokenów są ukryte, dopóki Gateway ponownie nie zgłosi świeżego użycia.

  </Accordion>
  <Accordion title="Tryb rozmowy (realtime w przeglądarce)">
    Tryb rozmowy używa zarejestrowanego dostawcy głosu realtime. Skonfiguruj OpenAI z `talk.realtime.provider: "openai"` oraz profilem uwierzytelniania kluczem API `openai`, `talk.realtime.providers.openai.apiKey` albo `OPENAI_API_KEY`; profile OAuth OpenAI nie konfigurują głosu Realtime. Skonfiguruj Google z `talk.realtime.provider: "google"` oraz `talk.realtime.providers.google.apiKey`. Przeglądarka nigdy nie otrzymuje standardowego klucza API dostawcy. OpenAI otrzymuje efemeryczny sekret klienta Realtime dla WebRTC. Google Live otrzymuje jednorazowy ograniczony token uwierzytelniania Live API dla sesji WebSocket przeglądarki, z instrukcjami i deklaracjami narzędzi zablokowanymi w tokenie przez Gateway. Dostawcy, którzy udostępniają wyłącznie backendowy most realtime, działają przez transport przekaźnika Gateway, więc poświadczenia i gniazda dostawców pozostają po stronie serwera, podczas gdy dźwięk z przeglądarki przechodzi przez uwierzytelnione RPC Gateway. Prompt sesji Realtime jest składany przez Gateway; `talk.client.create` nie akceptuje nadpisań instrukcji dostarczonych przez wywołującego.

    Kompozytor Chatu zawiera przycisk opcji Rozmowy obok przycisku start/stop Rozmowy. Opcje dotyczą następnej sesji Rozmowy i mogą nadpisywać dostawcę, transport, model, głos, wysiłek rozumowania, próg VAD, czas ciszy oraz dopełnienie prefiksu. Gdy opcja jest pusta, Gateway używa skonfigurowanych wartości domyślnych, jeśli są dostępne, albo wartości domyślnej dostawcy. Wybranie przekaźnika Gateway wymusza ścieżkę przekaźnika backendu; wybranie WebRTC utrzymuje sesję po stronie klienta i powoduje błąd zamiast cichego przełączenia na przekaźnik, jeśli dostawca nie może utworzyć sesji przeglądarkowej.

    W kompozytorze Chatu kontrolka Rozmowy to przycisk z falami obok przycisku dyktowania mikrofonem. Po rozpoczęciu Rozmowy w wierszu stanu kompozytora pojawia się `Connecting Talk...`, następnie `Talk live`, gdy audio jest połączone, albo `Asking OpenClaw...`, gdy wywołanie narzędzia czasu rzeczywistego konsultuje skonfigurowany większy model przez `talk.client.toolCall`.

    Smoke test live dla maintainerów: `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts` weryfikuje most WebSocket backendu OpenAI, wymianę SDP WebRTC przeglądarki OpenAI, konfigurację przeglądarkowego WebSocket Google Live z ograniczonym tokenem oraz adapter przeglądarkowego przekaźnika Gateway z fałszywym nośnikiem mikrofonu. Polecenie wypisuje tylko status dostawcy i nie loguje sekretów.

  </Accordion>
  <Accordion title="Stop and abort">
    - Kliknij **Zatrzymaj** (wywołuje `chat.abort`).
    - Gdy uruchomienie jest aktywne, zwykłe kolejne wiadomości trafiają do kolejki. Kliknij **Steruj** przy wiadomości w kolejce, aby wstrzyknąć tę kolejną wiadomość do trwającej tury.
    - Wpisz `/stop` (albo samodzielne frazy przerwania, takie jak `stop`, `stop action`, `stop run`, `stop openclaw`, `please stop`), aby przerwać poza pasmem.
    - `chat.abort` obsługuje `{ sessionKey }` (bez `runId`), aby przerwać wszystkie aktywne uruchomienia dla tej sesji.

  </Accordion>
  <Accordion title="Abort partial retention">
    - Po przerwaniu uruchomienia częściowy tekst asystenta nadal może być widoczny w UI.
    - Gateway zapisuje przerwany częściowy tekst asystenta w historii transkrypcji, gdy istnieją zbuforowane dane wyjściowe.
    - Zapisane wpisy zawierają metadane przerwania, dzięki czemu konsumenci transkrypcji mogą odróżnić częściowe wyniki po przerwaniu od zwykłego wyniku ukończenia.

  </Accordion>
</AccordionGroup>

## Instalacja PWA i Web Push

Control UI dostarcza `manifest.webmanifest` oraz service worker, dzięki czemu nowoczesne przeglądarki mogą zainstalować je jako samodzielną aplikację PWA. Web Push pozwala Gateway wybudzać zainstalowaną PWA powiadomieniami nawet wtedy, gdy karta lub okno przeglądarki nie jest otwarte.

Jeśli strona pokazuje **Niezgodność protokołu** tuż po aktualizacji OpenClaw, najpierw ponownie otwórz dashboard poleceniem `openclaw dashboard` i wykonaj twarde odświeżenie strony. Jeśli nadal występuje błąd, wyczyść dane witryny dla originu dashboardu albo przetestuj w prywatnym oknie przeglądarki; stara karta lub cache service workera przeglądarki może nadal uruchamiać pakiet Control UI sprzed aktualizacji względem nowszego Gateway.

| Powierzchnia                                          | Co robi                                                            |
| ----------------------------------------------------- | ------------------------------------------------------------------ |
| `ui/public/manifest.webmanifest`                      | Manifest PWA. Przeglądarki oferują „Zainstaluj aplikację”, gdy jest osiągalny. |
| `ui/public/sw.js`                                     | Service worker obsługujący zdarzenia `push` i kliknięcia powiadomień. |
| `push/vapid-keys.json` (w katalogu stanu OpenClaw)    | Automatycznie wygenerowana para kluczy VAPID używana do podpisywania ładunków Web Push. |
| `push/web-push-subscriptions.json`                    | Utrwalone endpointy subskrypcji przeglądarki.                      |

Nadpisz parę kluczy VAPID przez zmienne środowiskowe w procesie Gateway, gdy chcesz przypiąć klucze (dla wdrożeń wielohostowych, rotacji sekretów lub testów):

- `OPENCLAW_VAPID_PUBLIC_KEY`
- `OPENCLAW_VAPID_PRIVATE_KEY`
- `OPENCLAW_VAPID_SUBJECT` (domyślnie `https://openclaw.ai`)

Control UI używa tych metod Gateway ograniczonych zakresem, aby rejestrować i testować subskrypcje przeglądarki:

- `push.web.vapidPublicKey` — pobiera aktywny klucz publiczny VAPID.
- `push.web.subscribe` — rejestruje `endpoint` oraz `keys.p256dh`/`keys.auth`.
- `push.web.unsubscribe` — usuwa zarejestrowany endpoint.
- `push.web.test` — wysyła powiadomienie testowe do subskrypcji wywołującego.

<Note>
Web Push jest niezależny od ścieżki przekaźnika APNS iOS (zobacz [Konfiguracja](/pl/gateway/configuration) dla powiadomień push opartych na przekaźniku) oraz istniejącej metody `push.test`, które są przeznaczone dla natywnego parowania mobilnego.
</Note>

## Hostowane osadzenia

Wiadomości asystenta mogą renderować hostowane treści WWW inline za pomocą shortcode’u `[embed ...]`. Polityka sandboxa iframe jest kontrolowana przez `gateway.controlUi.embedSandbox`:

<Tabs>
  <Tab title="strict">
    Wyłącza wykonywanie skryptów wewnątrz hostowanych osadzeń.
  </Tab>
  <Tab title="scripts (default)">
    Zezwala na interaktywne osadzenia przy zachowaniu izolacji originu; jest to ustawienie domyślne i zwykle wystarcza dla samodzielnych gier/widgetów przeglądarkowych.
  </Tab>
  <Tab title="trusted">
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
Używaj `trusted` tylko wtedy, gdy osadzony dokument rzeczywiście potrzebuje zachowania same-origin. Dla większości gier generowanych przez agentów i interaktywnych płócien bezpieczniejszym wyborem jest `scripts`.
</Warning>

Bezwzględne zewnętrzne URL-e osadzeń `http(s)` pozostają domyślnie blokowane. Jeśli celowo chcesz, aby `[embed url="https://..."]` ładował strony zewnętrzne, ustaw `gateway.controlUi.allowExternalEmbedUrls: true`.

## Szerokość wiadomości Chatu

Zgrupowane wiadomości Chatu używają domyślnej maksymalnej szerokości ułatwiającej czytanie. Wdrożenia na szerokich monitorach mogą ją nadpisać bez modyfikowania dołączonego CSS, ustawiając `gateway.controlUi.chatMessageMaxWidth`:

```json5
{
  gateway: {
    controlUi: {
      chatMessageMaxWidth: "min(1280px, 82%)",
    },
  },
}
```

Wartość jest walidowana, zanim trafi do przeglądarki. Obsługiwane wartości obejmują zwykłe długości i procenty, takie jak `960px` lub `82%`, a także ograniczone wyrażenia szerokości `min(...)`, `max(...)`, `clamp(...)`, `calc(...)` i `fit-content(...)`.

## Dostęp przez tailnet (zalecane)

<Tabs>
  <Tab title="Integrated Tailscale Serve (preferred)">
    Utrzymaj Gateway na local loopback i pozwól Tailscale Serve pośredniczyć przez HTTPS:

    ```bash
    openclaw gateway --tailscale serve
    ```

    Otwórz:

    - `https://<magicdns>/` (albo skonfigurowane `gateway.controlUi.basePath`)

    Domyślnie żądania Control UI/WebSocket Serve mogą uwierzytelniać się przez nagłówki tożsamości Tailscale (`tailscale-user-login`), gdy `gateway.auth.allowTailscale` ma wartość `true`. OpenClaw weryfikuje tożsamość, rozpoznając adres `x-forwarded-for` za pomocą `tailscale whois` i dopasowując go do nagłówka, oraz akceptuje je tylko wtedy, gdy żądanie trafia na loopback z nagłówkami `x-forwarded-*` Tailscale. Dla sesji operatora Control UI z tożsamością urządzenia przeglądarki ta zweryfikowana ścieżka Serve pomija też rundę parowania urządzenia; przeglądarki bez urządzenia i połączenia w roli węzła nadal przechodzą zwykłe kontrole urządzenia. Ustaw `gateway.auth.allowTailscale: false`, jeśli chcesz wymagać jawnych poświadczeń współdzielonego sekretu nawet dla ruchu Serve. Następnie użyj `gateway.auth.mode: "token"` lub `"password"`.

    Dla tej asynchronicznej ścieżki tożsamości Serve nieudane próby uwierzytelnienia dla tego samego IP klienta i zakresu uwierzytelniania są serializowane przed zapisami limitu szybkości. Współbieżne błędne ponowienia z tej samej przeglądarki mogą więc pokazać `retry later` przy drugim żądaniu zamiast dwóch zwykłych niezgodności ścigających się równolegle.

    <Warning>
    Uwierzytelnianie Serve bez tokena zakłada, że host gateway jest zaufany. Jeśli na tym hoście może działać niezaufany lokalny kod, wymagaj uwierzytelniania tokenem/hasłem.
    </Warning>

  </Tab>
  <Tab title="Bind to tailnet + token">
    ```bash
    openclaw gateway --bind tailnet --token "$(openssl rand -hex 32)"
    ```

    Następnie otwórz:

    - `http://<tailscale-ip>:18789/` (albo skonfigurowane `gateway.controlUi.basePath`)

    Wklej pasujący współdzielony sekret w ustawieniach UI (wysyłany jako `connect.params.auth.token` albo `connect.params.auth.password`).

  </Tab>
</Tabs>

## Niezabezpieczony HTTP

Jeśli otworzysz dashboard przez zwykły HTTP (`http://<lan-ip>` lub `http://<tailscale-ip>`), przeglądarka działa w **niezabezpieczonym kontekście** i blokuje WebCrypto. Domyślnie OpenClaw **blokuje** połączenia Control UI bez tożsamości urządzenia.

Udokumentowane wyjątki:

- zgodność niezabezpieczonego HTTP tylko dla localhost z `gateway.controlUi.allowInsecureAuth=true`
- skuteczne uwierzytelnianie operatora Control UI przez `gateway.auth.mode: "trusted-proxy"`
- awaryjne `gateway.controlUi.dangerouslyDisableDeviceAuth=true`

**Zalecana poprawka:** użyj HTTPS (Tailscale Serve) albo otwórz UI lokalnie:

- `https://<magicdns>/` (Serve)
- `http://127.0.0.1:18789/` (na hoście gateway)

<AccordionGroup>
  <Accordion title="Insecure-auth toggle behavior">
    ```json5
    {
      gateway: {
        controlUi: { allowInsecureAuth: true },
        bind: "tailnet",
        auth: { mode: "token", token: "replace-me" },
      },
    }
    ```

    `allowInsecureAuth` to wyłącznie lokalny przełącznik zgodności:

    - Pozwala sesjom Control UI na localhost kontynuować bez tożsamości urządzenia w niezabezpieczonych kontekstach HTTP.
    - Nie omija kontroli parowania.
    - Nie rozluźnia wymagań tożsamości urządzenia dla zdalnych (nie-localhost) połączeń.

  </Accordion>
  <Accordion title="Break-glass only">
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
    `dangerouslyDisableDeviceAuth` wyłącza kontrole tożsamości urządzenia Control UI i jest poważnym obniżeniem bezpieczeństwa. Cofnij szybko po użyciu awaryjnym.
    </Warning>

  </Accordion>
  <Accordion title="Trusted-proxy note">
    - Skuteczne uwierzytelnianie trusted-proxy może dopuścić sesje Control UI **operatora** bez tożsamości urządzenia.
    - Nie rozszerza się to na sesje Control UI w roli węzła.
    - Reverse proxy local loopback na tym samym hoście nadal nie spełniają warunków uwierzytelniania trusted-proxy; zobacz [Uwierzytelnianie trusted proxy](/pl/gateway/trusted-proxy-auth).

  </Accordion>
</AccordionGroup>

Zobacz [Tailscale](/pl/gateway/tailscale), aby uzyskać wskazówki dotyczące konfiguracji HTTPS.

## Polityka bezpieczeństwa treści

Control UI jest dostarczane z restrykcyjną polityką `img-src`: dozwolone są tylko zasoby **same-origin**, URL-e `data:` oraz lokalnie wygenerowane URL-e `blob:`. Zdalne adresy obrazów `http(s)` i względne względem protokołu są odrzucane przez przeglądarkę i nie powodują pobrań sieciowych.

Co to oznacza w praktyce:

- Awatary i obrazy serwowane pod ścieżkami względnymi (na przykład `/avatars/<id>`) nadal się renderują, w tym uwierzytelnione trasy awatarów, które UI pobiera i konwertuje na lokalne URL-e `blob:`.
- Inline URL-e `data:image/...` nadal się renderują (przydatne dla ładunków w protokole).
- Lokalne URL-e `blob:` utworzone przez Control UI nadal się renderują.
- Zdalne URL-e awatarów emitowane przez metadane kanałów są usuwane przez helpery awatarów Control UI i zastępowane wbudowanym logo/odznaką, więc przejęty lub złośliwy kanał nie może wymusić dowolnych zdalnych pobrań obrazów z przeglądarki operatora.

Nie musisz niczego zmieniać, aby uzyskać to zachowanie — jest zawsze włączone i niekonfigurowalne.

## Uwierzytelnianie trasy awatara

Gdy uwierzytelnianie gateway jest skonfigurowane, endpoint awatara Control UI wymaga tego samego tokena gateway co reszta API:

- `GET /avatar/<agentId>` zwraca obraz awatara tylko uwierzytelnionym wywołującym. `GET /avatar/<agentId>?meta=1` zwraca metadane awatara na tej samej zasadzie.
- Nieuwierzytelnione żądania do obu tras są odrzucane (zgodnie z siostrzaną trasą assistant-media). Zapobiega to wyciekowi tożsamości agenta przez trasę awatara na hostach, które poza tym są chronione.
- Control UI samo przekazuje token gateway jako nagłówek bearer podczas pobierania awatarów i używa uwierzytelnionych URL-i blob, dzięki czemu obraz nadal renderuje się w dashboardach.

Jeśli wyłączysz uwierzytelnianie Gateway (niezalecane na współdzielonych hostach), trasa awatara również stanie się nieuwierzytelniona, zgodnie z resztą Gateway.

## Uwierzytelnianie trasy multimediów asystenta

Gdy uwierzytelnianie Gateway jest skonfigurowane, podglądy lokalnych multimediów asystenta używają dwuetapowej trasy:

- `GET /__openclaw__/assistant-media?meta=1&source=<path>` wymaga standardowego uwierzytelniania operatora Control UI. Przeglądarka wysyła token Gateway jako nagłówek bearer podczas sprawdzania dostępności.
- Pomyślne odpowiedzi metadanych zawierają krótkotrwały `mediaTicket` ograniczony do dokładnie tej ścieżki źródłowej.
- Adresy URL obrazów, audio, wideo i dokumentów renderowanych przez przeglądarkę używają `mediaTicket=<ticket>` zamiast aktywnego tokenu Gateway lub hasła. Bilet szybko wygasa i nie może autoryzować innego źródła.

Dzięki temu zwykłe renderowanie multimediów pozostaje zgodne z natywnymi elementami multimedialnymi przeglądarki bez umieszczania wielokrotnego użytku poświadczeń Gateway w widocznych adresach URL multimediów.

## Budowanie UI

Gateway serwuje pliki statyczne z `dist/control-ui`. Zbuduj je za pomocą:

```bash
pnpm ui:build
```

Opcjonalna bezwzględna baza (gdy chcesz mieć stałe adresy URL zasobów):

```bash
OPENCLAW_CONTROL_UI_BASE_PATH=/openclaw/ pnpm ui:build
```

Do lokalnego programowania (oddzielny serwer deweloperski):

```bash
pnpm ui:dev
```

Następnie skieruj UI na adres URL WS swojego Gateway (np. `ws://127.0.0.1:18789`).

## Pusta strona Control UI

Jeśli przeglądarka ładuje pusty panel, a DevTools nie pokazuje użytecznego błędu, rozszerzenie lub wczesny skrypt treści mógł uniemożliwić wykonanie modułu JavaScript aplikacji. Strona statyczna zawiera zwykły panel odzyskiwania HTML, który pojawia się, gdy `<openclaw-app>` nie zostanie zarejestrowany po uruchomieniu.

Użyj akcji **Spróbuj ponownie** w panelu po zmianie środowiska przeglądarki albo przeładuj ręcznie po tych kontrolach:

- Wyłącz rozszerzenia, które wstrzykują się do wszystkich stron, szczególnie rozszerzenia ze skryptami treści `<all_urls>`.
- Spróbuj użyć okna prywatnego, czystego profilu przeglądarki albo innej przeglądarki.
- Pozostaw Gateway uruchomiony i zweryfikuj ten sam adres URL panelu po zmianie przeglądarki.

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

    Opcjonalne jednorazowe uwierzytelnienie (jeśli potrzebne):

    ```text
    http://localhost:5173/?gatewayUrl=wss%3A%2F%2F<gateway-host>%3A18789#token=<gateway-token>
    ```

  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Notes">
    - `gatewayUrl` jest przechowywane w localStorage po załadowaniu i usuwane z adresu URL.
    - Jeśli przekazujesz pełny punkt końcowy `ws://` lub `wss://` przez `gatewayUrl`, zakoduj wartość `gatewayUrl` w adresie URL, aby przeglądarka poprawnie sparsowała ciąg zapytania.
    - `token` powinien być przekazywany przez fragment adresu URL (`#token=...`), gdy tylko jest to możliwe. Fragmenty nie są wysyłane na serwer, co pozwala uniknąć wycieku w dziennikach żądań i nagłówku Referer. Starsze parametry zapytania `?token=` nadal są importowane jednorazowo ze względu na zgodność, ale tylko jako mechanizm awaryjny, i są usuwane natychmiast po bootstrapie.
    - `password` jest przechowywane wyłącznie w pamięci.
    - Gdy `gatewayUrl` jest ustawione, UI nie wraca do poświadczeń z konfiguracji ani środowiska. Podaj `token` (lub `password`) jawnie. Brak jawnych poświadczeń jest błędem.
    - Używaj `wss://`, gdy Gateway znajduje się za TLS (Tailscale Serve, proxy HTTPS itd.).
    - `gatewayUrl` jest akceptowane tylko w oknie najwyższego poziomu (nie osadzone), aby zapobiec clickjackingowi.
    - Publiczne wdrożenia Control UI poza pętlą zwrotną muszą jawnie ustawić `gateway.controlUi.allowedOrigins` (pełne źródła). Prywatne ładowania LAN/Tailnet z tego samego źródła z local loopback, RFC1918/link-local, `.local`, `.ts.net` lub hostów Tailscale CGNAT są akceptowane bez włączania mechanizmu awaryjnego nagłówka Host.
    - Uruchomienie Gateway może zainicjować lokalne źródła, takie jak `http://localhost:<port>` i `http://127.0.0.1:<port>`, na podstawie efektywnego wiązania i portu środowiska uruchomieniowego, ale zdalne źródła przeglądarki nadal wymagają jawnych wpisów.
    - Nie używaj `gateway.controlUi.allowedOrigins: ["*"]` poza ściśle kontrolowanymi testami lokalnymi. Oznacza to zezwolenie na dowolne źródło przeglądarki, a nie „dopasuj dowolny host, którego używam”.
    - `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` włącza tryb mechanizmu awaryjnego źródła z nagłówka Host, ale jest to niebezpieczny tryb zabezpieczeń.

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
- [WebChat](/pl/web/webchat) — interfejs czatu w przeglądarce
