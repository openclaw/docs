---
read_when:
    - Chcesz obsługiwać Gateway z przeglądarki
    - Chcesz dostępu do Tailnet bez tuneli SSH
sidebarTitle: Control UI
summary: Interfejs sterowania w przeglądarce dla Gateway (czat, aktywność, węzły, konfiguracja)
title: Interfejs sterowania
x-i18n:
    generated_at: "2026-07-03T10:02:42Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b23d0e2aeefc3b746f1ab51cd9049135e2695ab77cf5cbb5eab6ec0df90f011d
    source_path: web/control-ui.md
    workflow: 16
---

Control UI to mała jednostronicowa aplikacja **Vite + Lit** obsługiwana przez Gateway:

- domyślnie: `http://<host>:18789/`
- opcjonalny prefiks: ustaw `gateway.controlUi.basePath` (np. `/openclaw`)

Komunikuje się **bezpośrednio z Gateway WebSocket** na tym samym porcie.

## Szybkie otwarcie (lokalnie)

Jeśli Gateway działa na tym samym komputerze, otwórz:

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/) (lub [http://localhost:18789/](http://localhost:18789/))

Jeśli strona się nie ładuje, najpierw uruchom Gateway: `openclaw gateway`.

<Note>
W natywnych powiązaniach Windows LAN Zapora systemu Windows lub zarządzane przez organizację zasady grupy mogą nadal blokować ogłaszany adres URL LAN, nawet gdy `127.0.0.1` działa na hoście Gateway. Uruchom `openclaw gateway status --deep` na hoście Windows; raportuje prawdopodobnie zablokowane porty, niezgodności profili i lokalne reguły zapory, które zasady mogą ignorować.
</Note>

Uwierzytelnianie jest dostarczane podczas uzgadniania WebSocket przez:

- `connect.params.auth.token`
- `connect.params.auth.password`
- nagłówki tożsamości Tailscale Serve, gdy `gateway.auth.allowTailscale: true`
- nagłówki tożsamości zaufanego proxy, gdy `gateway.auth.mode: "trusted-proxy"`

Panel ustawień pulpitu przechowuje token dla bieżącej sesji karty przeglądarki i wybranego adresu URL gateway; hasła nie są utrwalane. Onboarding zwykle generuje token gateway dla uwierzytelniania współdzielonym sekretem przy pierwszym połączeniu, ale uwierzytelnianie hasłem też działa, gdy `gateway.auth.mode` ma wartość `"password"`.

## Parowanie urządzenia (pierwsze połączenie)

Gdy łączysz się z Control UI z nowej przeglądarki lub urządzenia, Gateway zwykle wymaga **jednorazowego zatwierdzenia parowania**. To środek bezpieczeństwa zapobiegający nieautoryzowanemu dostępowi.

**Co zobaczysz:** "disconnected (1008): pairing required"

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

Jeśli przeglądarka ponawia parowanie ze zmienionymi danymi uwierzytelniania (rola/zakresy/klucz publiczny), poprzednie oczekujące żądanie zostaje zastąpione i tworzony jest nowy `requestId`. Przed zatwierdzeniem uruchom ponownie `openclaw devices list`.

Jeśli przeglądarka jest już sparowana i zmienisz jej dostęp z odczytu na zapis/admin, jest to traktowane jako podniesienie zatwierdzenia, a nie ciche ponowne połączenie. OpenClaw zachowuje stare zatwierdzenie jako aktywne, blokuje szersze ponowne połączenie i prosi o jawne zatwierdzenie nowego zestawu zakresów.

Po zatwierdzeniu urządzenie jest zapamiętywane i nie będzie wymagać ponownego zatwierdzenia, chyba że je unieważnisz poleceniem `openclaw devices revoke --device <id> --role <role>`. Zobacz [CLI urządzeń](/pl/cli/devices), aby poznać rotację i unieważnianie tokenów.

Agenci Paperclip łączący się przez adapter `openclaw_gateway` używają tego samego przepływu zatwierdzania przy pierwszym uruchomieniu. Po pierwszej próbie połączenia uruchom `openclaw devices approve --latest`, aby podejrzeć oczekujące żądanie, a następnie uruchom ponownie wydrukowane polecenie `openclaw devices approve <requestId>`, aby je zatwierdzić. Dla zdalnego gateway przekaż jawne wartości `--url` i `--token`. Aby zatwierdzenia były stabilne między restartami, skonfiguruj trwały `adapterConfig.devicePrivateKeyPem` w Paperclip zamiast pozwalać mu generować nową efemeryczną tożsamość urządzenia przy każdym uruchomieniu.

<Note>
- Bezpośrednie lokalne połączenia przeglądarki przez local loopback (`127.0.0.1` / `localhost`) są zatwierdzane automatycznie.
- Tailscale Serve może pominąć obieg parowania dla sesji operatora Control UI, gdy `gateway.auth.allowTailscale: true`, tożsamość Tailscale zostanie zweryfikowana, a przeglądarka przedstawi swoją tożsamość urządzenia.
- Bezpośrednie powiązania Tailnet, połączenia przeglądarki przez LAN oraz profile przeglądarki bez tożsamości urządzenia nadal wymagają jawnego zatwierdzenia.
- Każdy profil przeglądarki generuje unikalny identyfikator urządzenia, więc zmiana przeglądarki lub wyczyszczenie danych przeglądarki będzie wymagać ponownego parowania.

</Note>

## Tożsamość osobista (lokalna dla przeglądarki)

Control UI obsługuje osobistą tożsamość przypisaną do przeglądarki (nazwę wyświetlaną i awatar), dołączaną do wiadomości wychodzących na potrzeby przypisania autorstwa we współdzielonych sesjach. Przechowywana jest w pamięci przeglądarki, ograniczona do bieżącego profilu przeglądarki i nie jest synchronizowana z innymi urządzeniami ani utrwalana po stronie serwera poza zwykłymi metadanymi autorstwa transkrypcji przy wiadomościach, które faktycznie wysyłasz. Wyczyszczenie danych witryny lub zmiana przeglądarki resetuje ją do pustej wartości.

Ten sam wzorzec lokalny dla przeglądarki dotyczy nadpisania awatara asystenta. Przesłane awatary asystenta nakładają tożsamość rozpoznaną przez gateway tylko w lokalnej przeglądarce i nigdy nie przechodzą w obie strony przez `config.patch`. Współdzielone pole konfiguracji `ui.assistant.avatar` jest nadal dostępne dla klientów innych niż UI, którzy zapisują to pole bezpośrednio (takich jak skryptowane gateway lub niestandardowe pulpity).

## Punkt końcowy konfiguracji runtime

Control UI pobiera swoje ustawienia runtime z `/control-ui-config.json`, rozwiązywane względem ścieżki bazowej Control UI gateway (na przykład `/__openclaw__/control-ui-config.json`, gdy UI jest obsługiwany pod `/__openclaw__/`). Ten punkt końcowy jest chroniony tym samym uwierzytelnianiem gateway co reszta powierzchni HTTP: nieuwierzytelnione przeglądarki nie mogą go pobrać, a udane pobranie wymaga już ważnego tokenu/hasła gateway, tożsamości Tailscale Serve albo tożsamości zaufanego proxy.

## Obsługa języków

Control UI może zlokalizować się przy pierwszym ładowaniu na podstawie ustawień regionalnych przeglądarki. Aby później to nadpisać, otwórz **Przegląd -> Dostęp do Gateway -> Język**. Selektor ustawień regionalnych znajduje się na karcie Dostęp do Gateway, a nie w Wyglądzie.

- Obsługiwane ustawienia regionalne: `en`, `zh-CN`, `zh-TW`, `pt-BR`, `de`, `es`, `ja-JP`, `ko`, `fr`, `ar`, `it`, `tr`, `uk`, `id`, `pl`, `th`, `vi`, `nl`, `fa`
- Tłumaczenia inne niż angielskie są ładowane leniwie w przeglądarce.
- Wybrane ustawienie regionalne jest zapisywane w pamięci przeglądarki i ponownie używane przy kolejnych wizytach.
- Brakujące klucze tłumaczeń wracają do angielskiego.

Tłumaczenia dokumentacji są generowane dla tego samego zestawu ustawień regionalnych innych niż angielskie, ale wbudowany selektor języka witryny dokumentacji Mintlify jest ograniczony do kodów ustawień regionalnych akceptowanych przez Mintlify. Dokumentacja tajska (`th`) i perska (`fa`) nadal jest generowana w repozytorium publikacji; może nie pojawić się w tym selektorze, dopóki Mintlify nie będzie obsługiwać tych kodów.

## Motywy wyglądu

Panel Wygląd zachowuje wbudowane motywy Claw, Knot i Dash oraz jedno lokalne dla przeglądarki miejsce importu tweakcn. Aby zaimportować motyw, otwórz [edytor tweakcn](https://tweakcn.com/editor/theme), wybierz lub utwórz motyw, kliknij **Udostępnij** i wklej skopiowany link motywu w Wyglądzie. Importer akceptuje też adresy URL rejestru `https://tweakcn.com/r/themes/<id>`, adresy URL edytora takie jak `https://tweakcn.com/editor/theme?theme=amethyst-haze`, względne ścieżki `/themes/<id>`, surowe identyfikatory motywów i domyślne nazwy motywów, takie jak `amethyst-haze`.

Wygląd zawiera także lokalne dla przeglądarki ustawienie rozmiaru tekstu. Ustawienie jest przechowywane razem z resztą preferencji Control UI, dotyczy tekstu czatu, tekstu kompozytora, kart narzędzi i bocznych paneli czatu oraz utrzymuje pola tekstowe na poziomie co najmniej 16px, aby mobilne Safari nie powiększało automatycznie widoku przy fokusie.

Zaimportowane motywy są przechowywane tylko w bieżącym profilu przeglądarki. Nie są zapisywane do konfiguracji gateway i nie synchronizują się między urządzeniami. Zastąpienie zaimportowanego motywu aktualizuje jedno lokalne miejsce; wyczyszczenie go przełącza aktywny motyw z powrotem na Claw, jeśli zaimportowany motyw był wybrany.

## Co potrafi (dzisiaj)

<AccordionGroup>
  <Accordion title="Czat i rozmowa">
    - Czat z modelem przez Gateway WS (`chat.history`, `chat.send`, `chat.abort`, `chat.inject`).
    - Odświeżanie historii czatu żąda ograniczonego ostatniego okna z limitami tekstu na wiadomość, aby duże sesje nie zmuszały przeglądarki do renderowania pełnego ładunku transkrypcji, zanim czat stanie się użyteczny.
    - Rozmowa przez przeglądarkowe sesje czasu rzeczywistego. OpenAI używa bezpośredniego WebRTC, Google Live używa ograniczonego jednorazowego tokenu przeglądarki przez WebSocket, a backendowe pluginy głosu czasu rzeczywistego używają transportu przekaźnikowego Gateway. Sesje dostawcy należące do klienta zaczynają się od `talk.client.create`; sesje przekaźnikowe Gateway zaczynają się od `talk.session.create`. Przekaźnik utrzymuje poświadczenia dostawcy w Gateway, podczas gdy przeglądarka strumieniuje mikrofonowe PCM przez `talk.session.appendAudio`, przekazuje wywołania narzędzi dostawcy `openclaw_agent_consult` przez `talk.client.toolCall` dla zasad Gateway i większego skonfigurowanego modelu OpenClaw oraz kieruje sterowanie głosem aktywnego uruchomienia przez `talk.client.steer` lub `talk.session.steer`.
    - Strumieniowanie wywołań narzędzi + karty wyjścia narzędzi na żywo w czacie (zdarzenia agenta).
    - Karta aktywności z lokalnymi dla przeglądarki, zorientowanymi na redakcję podsumowaniami aktywności narzędzi na żywo z istniejącego dostarczania zdarzeń `session.tool` / narzędzi.

  </Accordion>
  <Accordion title="Kanały, instancje, sesje, sny">
    - Kanały: status kanałów wbudowanych oraz kanałów z pluginów dołączonych/zewnętrznych, logowanie QR i konfiguracja per kanał (`channels.status`, `web.login.*`, `config.patch`).
    - Odświeżenia sond kanałów utrzymują poprzedni zrzut widoczny, gdy powolne kontrole dostawcy się kończą, a częściowe zrzuty są oznaczane, gdy sonda lub audyt przekroczy budżet UI.
    - Instancje: lista obecności + odświeżanie (`system-presence`).
    - Sesje: domyślnie wyświetlanie sesji skonfigurowanych agentów, fallback ze starych kluczy sesji nieskonfigurowanych agentów oraz stosowanie nadpisań modelu/thinking/fast/verbose/trace/reasoning per sesja (`sessions.list`, `sessions.patch`).
    - Sny: status Dreaming, przełącznik włącz/wyłącz i czytnik Dziennika snów (`doctor.memory.status`, `doctor.memory.dreamDiary`, `config.patch`).

  </Accordion>
  <Accordion title="Cron, Skills, węzły, zatwierdzenia exec">
    - Zadania Cron: lista/dodawanie/edycja/uruchamianie/włączanie/wyłączanie + historia uruchomień (`cron.*`).
    - Skills: status, włączanie/wyłączanie, instalacja, aktualizacje kluczy API (`skills.*`).
    - Węzły: lista + możliwości (`node.list`).
    - Zatwierdzenia exec: edycja list dozwolonych gateway lub węzła + zasady pytania dla `exec host=gateway/node` (`exec.approvals.*`).

  </Accordion>
  <Accordion title="Konfiguracja">
    - Wyświetlanie/edycja `~/.openclaw/openclaw.json` (`config.get`, `config.set`).
    - MCP ma dedykowaną stronę ustawień dla skonfigurowanych serwerów, włączania, podsumowań OAuth/filtrów/równoległości, typowych poleceń operatora oraz ograniczonego edytora konfiguracji `mcp`.
    - Zastosowanie + restart z walidacją (`config.apply`) i wybudzenie ostatniej aktywnej sesji.
    - Zapisy zawierają zabezpieczenie hashem bazowym zapobiegające nadpisaniu równoległych edycji.
    - Zapisy (`config.set`/`config.apply`/`config.patch`) wstępnie sprawdzają rozwiązywanie aktywnych SecretRef dla referencji w przesłanym ładunku konfiguracji; nierozwiązane aktywne przesłane referencje są odrzucane przed zapisem.
    - Zapisy formularzy odrzucają przestarzałe zredagowane placeholdery, których nie można odtworzyć z zapisanej konfiguracji, zachowując zredagowane wartości, które nadal mapują się na zapisane sekrety.
    - Renderowanie schematu + formularza (`config.schema` / `config.schema.lookup`, w tym pola `title` / `description`, dopasowane wskazówki UI, natychmiastowe podsumowania dzieci, metadane dokumentacji na zagnieżdżonych węzłach obiektów/wieloznacznych/tablic/kompozycji oraz schematy pluginów + kanałów, gdy są dostępne); edytor surowego JSON jest dostępny tylko wtedy, gdy zrzut ma bezpieczny surowy obieg w obie strony.
    - Jeśli zrzut nie może bezpiecznie przejść w obie strony jako surowy tekst, Control UI wymusza tryb Formularza i wyłącza tryb Surowy dla tego zrzutu.
    - Edytor surowego JSON „Resetuj do zapisanej” zachowuje surowy kształt autora (formatowanie, komentarze, układ `$include`) zamiast renderować ponownie spłaszczony zrzut, więc zewnętrzne edycje przetrwają reset, gdy zrzut może bezpiecznie przejść w obie strony.
    - Strukturalne wartości obiektów SecretRef są renderowane jako tylko do odczytu w tekstowych polach formularza, aby zapobiec przypadkowemu uszkodzeniu obiektu przez konwersję na ciąg.

  </Accordion>
  <Accordion title="Debugowanie, logi, aktualizacja">
    - Debugowanie: zrzuty statusu/kondycji/modeli + dziennik zdarzeń + ręczne wywołania RPC (`status`, `health`, `models.list`).
    - Dziennik zdarzeń zawiera czasy odświeżeń/RPC Control UI, czasy powolnego renderowania czatu/konfiguracji oraz wpisy responsywności przeglądarki dla długich klatek animacji lub długich zadań, gdy przeglądarka udostępnia te typy wpisów PerformanceObserver.
    - Logi: bieżące śledzenie logów plikowych gateway z filtrowaniem/eksportem (`logs.tail`).
    - Aktualizacja: uruchom aktualizację pakietu/git + restart (`update.run`) z raportem restartu, a następnie odpytuj `update.status` po ponownym połączeniu, aby zweryfikować działającą wersję gateway.

  </Accordion>
  <Accordion title="Uwagi dotyczące panelu zadań Cron">
    - W przypadku zadań izolowanych dostarczanie domyślnie ogłasza podsumowanie. Możesz przełączyć je na brak, jeśli chcesz uruchomienia wyłącznie wewnętrzne.
    - Pola kanału/celu pojawiają się, gdy wybrane jest ogłaszanie.
    - Tryb Webhook używa `delivery.mode = "webhook"` z `delivery.to` ustawionym na prawidłowy adres URL webhook HTTP(S).
    - Dla zadań sesji głównej dostępne są tryby dostarczania webhook i brak.
    - Zaawansowane elementy edycji obejmują usunięcie po uruchomieniu, wyczyszczenie nadpisania agenta, opcje dokładnego/rozłożonego Cron, nadpisania modelu/myślenia agenta oraz przełączniki dostarczania best-effort.
    - Walidacja formularza jest wbudowana, z błędami na poziomie pól; nieprawidłowe wartości wyłączają przycisk zapisu do czasu ich poprawienia.
    - Ustaw `cron.webhookToken`, aby wysyłać dedykowany token bearer; jeśli zostanie pominięty, webhook zostanie wysłany bez nagłówka uwierzytelniania.
    - Przestarzały fallback: uruchom `openclaw doctor --fix`, aby zmigrować zapisane starsze zadania z `notify: true` z `cron.webhook` do jawnego webhooka dla zadania lub dostarczania po ukończeniu.

  </Accordion>
</AccordionGroup>

## Strona MCP

Dedykowana strona MCP to widok operatora dla serwerów MCP zarządzanych przez OpenClaw w `mcp.servers`. Sama nie uruchamia transportów MCP; używaj jej do sprawdzania i edytowania zapisanej konfiguracji, a następnie użyj `openclaw mcp doctor --probe`, gdy potrzebujesz dowodu działania serwera na żywo.

Typowy przepływ pracy:

1. Otwórz **MCP** z paska bocznego.
2. Sprawdź karty podsumowania pod kątem łącznej liczby serwerów oraz liczby serwerów włączonych, OAuth i przefiltrowanych.
3. Przejrzyj każdy wiersz serwera pod kątem transportu, włączenia, uwierzytelniania, filtrów, limitów czasu i podpowiedzi poleceń.
4. Przełącz włączenie, gdy serwer ma pozostać skonfigurowany, ale nie uczestniczyć w wykrywaniu w czasie działania.
5. Edytuj zakresową sekcję konfiguracji `mcp` dla definicji serwerów, nagłówków, ścieżek TLS/mTLS, metadanych OAuth, filtrów narzędzi i metadanych projekcji Codex.
6. Użyj **Zapisz**, aby zapisać konfigurację, albo **Zapisz i opublikuj**, gdy działający Gateway ma zastosować zmienioną konfigurację.
7. Uruchom `openclaw mcp status --verbose`, `openclaw mcp doctor --probe` lub `openclaw mcp reload` z terminala, gdy edytowany proces wymaga statycznej diagnostyki, dowodu na żywo albo usunięcia buforowanego środowiska uruchomieniowego.

Strona redaguje wartości podobne do URL-i zawierające dane uwierzytelniające przed renderowaniem i ujmuje nazwy serwerów w cudzysłów we fragmentach poleceń, aby skopiowane polecenia nadal działały ze spacjami lub metaznakami powłoki. Pełna dokumentacja CLI i konfiguracji znajduje się w [MCP](/pl/cli/mcp).

## Karta Aktywność

Karta Aktywność jest efemerycznym, lokalnym dla przeglądarki obserwatorem aktywności narzędzi na żywo. Jest wyprowadzana z tego samego strumienia zdarzeń Gateway `session.tool` / narzędzi, który zasila karty narzędzi w czacie; nie dodaje kolejnej rodziny zdarzeń Gateway, punktu końcowego, trwałego magazynu aktywności, źródła metryk ani zewnętrznego strumienia obserwatora.

Wpisy aktywności przechowują wyłącznie oczyszczone podsumowania oraz zredagowane, skrócone podglądy wyjścia. Wartości argumentów narzędzi nie są przechowywane w stanie Aktywności; UI pokazuje, że argumenty są ukryte, i zapisuje tylko liczbę pól argumentów. Lista w pamięci podąża za bieżącą kartą przeglądarki, przetrwa nawigację w obrębie Control UI i resetuje się po ponownym załadowaniu strony, zmianie sesji lub użyciu **Wyczyść**.

## Zachowanie czatu

<AccordionGroup>
  <Accordion title="Semantyka wysyłania i historii">
    - `chat.send` jest **nieblokujące**: natychmiast potwierdza z `{ runId, status: "started" }`, a odpowiedź jest strumieniowana przez zdarzenia `chat`. Zaufani klienci Control UI mogą też otrzymywać opcjonalne metadane czasu ACK do lokalnej diagnostyki.
    - Przesyłanie w czacie akceptuje obrazy oraz pliki inne niż wideo. Obrazy zachowują natywną ścieżkę obrazu; inne pliki są przechowywane jako zarządzane media i pokazywane w historii jako linki załączników.
    - Ponowne wysłanie z tym samym `idempotencyKey` zwraca `{ status: "in_flight" }` podczas działania oraz `{ status: "ok" }` po ukończeniu.
    - Odpowiedzi `chat.history` mają ograniczony rozmiar dla bezpieczeństwa UI. Gdy wpisy transkryptu są zbyt duże, Gateway może skrócić długie pola tekstowe, pominąć ciężkie bloki metadanych i zastąpić zbyt duże wiadomości placeholderem (`[chat.history omitted: message too large]`).
    - Gdy widoczna wiadomość asystenta została skrócona w `chat.history`, czytnik boczny może pobrać pełny, znormalizowany do wyświetlania wpis transkryptu na żądanie przez `chat.message.get`, używając `sessionKey`, aktywnego `agentId` w razie potrzeby oraz `messageId` transkryptu. Jeśli Gateway nadal nie może zwrócić więcej danych, czytnik pokazuje jawny stan niedostępności zamiast po cichu powtarzać skrócony podgląd.
    - Obrazy asystenta/wygenerowane są utrwalane jako zarządzane odwołania do mediów i udostępniane z powrotem przez uwierzytelnione adresy URL mediów Gateway, więc ponowne ładowanie nie zależy od pozostania surowych ładunków obrazów base64 w odpowiedzi historii czatu.
    - Podczas renderowania `chat.history` Control UI usuwa z widocznego tekstu asystenta wyłącznie wyświetlaniowe znaczniki dyrektyw inline (na przykład `[[reply_to_*]]` i `[[audio_as_voice]]`), tekstowe ładunki XML wywołań narzędzi (w tym `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` oraz skrócone bloki wywołań narzędzi), a także ujawnione tokeny sterujące modelu ASCII/pełnej szerokości, i pomija wpisy asystenta, których cały widoczny tekst jest wyłącznie dokładnym cichym tokenem `NO_REPLY` / `no_reply` albo tokenem potwierdzenia Heartbeat `HEARTBEAT_OK`.
    - Podczas aktywnego wysyłania i końcowego odświeżenia historii widok czatu utrzymuje widoczne lokalne optymistyczne wiadomości użytkownika/asystenta, jeśli `chat.history` krótko zwróci starszą migawkę; kanoniczny transkrypt zastępuje te lokalne wiadomości, gdy historia Gateway nadrobi zaległość.
    - Zdarzenia `chat` na żywo są stanem dostarczania, natomiast `chat.history` jest odbudowywane z trwałego transkryptu sesji. Po zdarzeniach końcowych narzędzi Control UI ponownie ładuje historię i scala tylko niewielki optymistyczny ogon; granica transkryptu jest udokumentowana w [WebChat](/pl/web/webchat).
    - `chat.inject` dołącza notatkę asystenta do transkryptu sesji i rozgłasza zdarzenie `chat` dla aktualizacji wyłącznie UI (bez uruchomienia agenta, bez dostarczania kanałem).
    - Pasek boczny pokazuje ostatnie sesje z akcją Nowa sesja, linkiem Wszystkie sesje oraz przyciskiem wyszukiwania sesji, który otwiera pełny selektor sesji (ograniczony do wybranego agenta, z wyszukiwaniem i paginacją). Przełączenie agentów pokazuje tylko sesje powiązane z danym agentem i cofa się do głównej sesji tego agenta, gdy nie ma on jeszcze zapisanych sesji panelu.
    - Na szerokościach desktopowych kontrolki czatu pozostają w jednym kompaktowym wierszu i zwijają się podczas przewijania w dół transkryptu; przewijanie w górę, powrót na początek lub dotarcie do dołu przywraca kontrolki.
    - Kolejne zduplikowane wiadomości wyłącznie tekstowe renderują się jako jeden dymek z plakietką liczby. Wiadomości zawierające obrazy, załączniki, wyjście narzędzi lub podglądy canvas pozostają niezwinięte.
    - Selektory modelu i myślenia w nagłówku czatu natychmiast aktualizują aktywną sesję przez `sessions.patch`; są trwałymi nadpisaniami sesji, a nie opcjami wysyłania tylko dla jednej tury.
    - Jeśli wyślesz wiadomość, gdy zmiana selektora modelu dla tej samej sesji wciąż się zapisuje, edytor poczeka na tę łatkę sesji przed wywołaniem `chat.send`, aby wysłanie użyło wybranego modelu.
    - Wpisanie `/new` w Control UI tworzy i przełącza na tę samą świeżą sesję panelu co Nowy czat, z wyjątkiem sytuacji, gdy skonfigurowano `session.dmScope: "main"` i bieżący rodzic jest główną sesją agenta; wtedy resetuje główną sesję w miejscu. Wpisanie `/reset` zachowuje jawny reset w miejscu Gateway dla bieżącej sesji.
    - Selektor modelu czatu żąda skonfigurowanego widoku modeli Gateway. Jeśli obecne jest `agents.defaults.models`, ta lista dozwolonych modeli steruje selektorem, w tym wpisami `provider/*`, które utrzymują katalogi zakresowe dostawców jako dynamiczne. W przeciwnym razie selektor pokazuje jawne wpisy `models.providers.*.models` oraz dostawców z użytecznym uwierzytelnianiem. Pełny katalog pozostaje dostępny przez debugujące RPC `models.list` z `view: "all"`.
    - Gdy świeże raporty użycia sesji Gateway zawierają bieżące tokeny kontekstu, pasek narzędzi edytora czatu pokazuje mały pierścień użycia kontekstu z użytym procentem; pełne szczegóły tokenów znajdują się w jego dymku. Pierścień przełącza się na styl ostrzegawczy przy wysokim obciążeniu kontekstu i, na zalecanych poziomach Compaction, pokazuje kompaktowy przycisk uruchamiający normalną ścieżkę Compaction sesji. Nieaktualne migawki tokenów są ukrywane, dopóki Gateway ponownie nie zgłosi świeżego użycia.

  </Accordion>
  <Accordion title="Tryb rozmowy (czas rzeczywisty w przeglądarce)">
    Tryb rozmowy używa zarejestrowanego dostawcy głosu czasu rzeczywistego. Skonfiguruj OpenAI z `talk.realtime.provider: "openai"` oraz profilem uwierzytelniania kluczem API `openai`, `talk.realtime.providers.openai.apiKey` lub `OPENAI_API_KEY`; profile OpenAI OAuth nie konfigurują głosu Realtime. Skonfiguruj Google z `talk.realtime.provider: "google"` oraz `talk.realtime.providers.google.apiKey`. Przeglądarka nigdy nie otrzymuje standardowego klucza API dostawcy. OpenAI otrzymuje efemeryczny sekret klienta Realtime dla WebRTC. Google Live otrzymuje jednorazowy ograniczony token uwierzytelniania Live API dla sesji WebSocket w przeglądarce, z instrukcjami i deklaracjami narzędzi zablokowanymi w tokenie przez Gateway. Dostawcy, którzy udostępniają tylko backendowy most czasu rzeczywistego, działają przez transport przekaźnikowy Gateway, więc dane uwierzytelniające i gniazda dostawcy pozostają po stronie serwera, a dźwięk z przeglądarki przechodzi przez uwierzytelnione RPC Gateway. Prompt sesji Realtime jest składany przez Gateway; `talk.client.create` nie akceptuje nadpisań instrukcji dostarczonych przez wywołującego.

    Edytor czatu zawiera przycisk opcji rozmowy obok przycisku start/stop rozmowy. Opcje dotyczą następnej sesji rozmowy i mogą nadpisać dostawcę, transport, model, głos, effort rozumowania, próg VAD, czas ciszy i dopełnienie prefiksu. Gdy opcja jest pusta, Gateway używa skonfigurowanych wartości domyślnych, jeśli są dostępne, albo wartości domyślnej dostawcy. Wybranie przekaźnika Gateway wymusza backendową ścieżkę przekaźnikową; wybranie WebRTC utrzymuje sesję po stronie klienta i kończy się błędem zamiast po cichu cofać się do przekaźnika, jeśli dostawca nie może utworzyć sesji przeglądarkowej.

    W edytorze czatu kontrolka rozmowy to przycisk fal obok przycisku dyktowania mikrofonem. Gdy rozmowa się rozpoczyna, wiersz stanu edytora pokazuje `Connecting Talk...`, następnie `Talk live`, gdy dźwięk jest połączony, albo `Asking OpenClaw...`, gdy wywołanie narzędzia czasu rzeczywistego konsultuje skonfigurowany większy model przez `talk.client.toolCall`.

    Dymny test na żywo dla maintainerów: `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts` weryfikuje backendowy most WebSocket OpenAI, wymianę SDP WebRTC OpenAI w przeglądarce, konfigurację WebSocket w przeglądarce dla Google Live z ograniczonym tokenem oraz przeglądarkowy adapter przekaźnika Gateway z fałszywym nośnikiem mikrofonu. Polecenie wypisuje tylko stan dostawcy i nie loguje sekretów.

  </Accordion>
  <Accordion title="Zatrzymanie i przerwanie">
    - Kliknij **Zatrzymaj** (wywołuje `chat.abort`).
    - Gdy uruchomienie jest aktywne, zwykłe wiadomości uzupełniające trafiają do kolejki. Kliknij **Pokieruj** przy wiadomości w kolejce, aby wstrzyknąć tę wiadomość uzupełniającą do trwającej tury.
    - Wpisz `/stop` (albo samodzielne frazy przerwania, takie jak `stop`, `stop action`, `stop run`, `stop openclaw`, `please stop`), aby przerwać poza pasmem.
    - `chat.abort` obsługuje `{ sessionKey }` (bez `runId`), aby przerwać wszystkie aktywne uruchomienia dla tej sesji.

  </Accordion>
  <Accordion title="Zachowanie części po przerwaniu">
    - Gdy uruchomienie zostanie przerwane, częściowy tekst asystenta nadal może być pokazany w UI.
    - Gateway utrwala częściowy przerwany tekst asystenta w historii transkryptu, gdy istnieje zbuforowane wyjście.
    - Utrwalone wpisy zawierają metadane przerwania, aby konsumenci transkryptu mogli odróżnić części po przerwaniu od normalnego wyjścia ukończenia.

  </Accordion>
</AccordionGroup>

## Instalacja PWA i web push

Control UI dostarcza `manifest.webmanifest` i service worker, więc nowoczesne przeglądarki mogą zainstalować go jako samodzielną PWA. Web Push pozwala Gateway wybudzić zainstalowaną PWA powiadomieniami nawet wtedy, gdy karta lub okno przeglądarki nie jest otwarte.

Jeśli strona pokazuje **Niezgodność protokołu** zaraz po aktualizacji OpenClaw, najpierw ponownie otwórz pulpit poleceniem `openclaw dashboard` i wykonaj twarde odświeżenie strony. Jeśli nadal występuje błąd, wyczyść dane witryny dla źródła pulpitu albo przetestuj w prywatnym oknie przeglądarki; stara karta lub pamięć podręczna service workera przeglądarki może nadal uruchamiać pakiet Control UI sprzed aktualizacji względem nowszego Gateway.

| Powierzchnia                                          | Co robi                                                            |
| ----------------------------------------------------- | ------------------------------------------------------------------ |
| `ui/public/manifest.webmanifest`                      | Manifest PWA. Przeglądarki oferują „Zainstaluj aplikację”, gdy będzie osiągalny. |
| `ui/public/sw.js`                                     | Service worker obsługujący zdarzenia `push` i kliknięcia powiadomień. |
| `push/vapid-keys.json` (w katalogu stanu OpenClaw)    | Automatycznie wygenerowana para kluczy VAPID używana do podpisywania ładunków Web Push. |
| `push/web-push-subscriptions.json`                    | Utrwalone punkty końcowe subskrypcji przeglądarek.                 |

Nadpisz parę kluczy VAPID przez zmienne środowiskowe w procesie Gateway, gdy chcesz przypiąć klucze (dla wdrożeń wielohostowych, rotacji sekretów lub testów):

- `OPENCLAW_VAPID_PUBLIC_KEY`
- `OPENCLAW_VAPID_PRIVATE_KEY`
- `OPENCLAW_VAPID_SUBJECT` (domyślnie `https://openclaw.ai`)

Control UI używa tych metod Gateway ograniczonych zakresem do rejestrowania i testowania subskrypcji przeglądarki:

- `push.web.vapidPublicKey` — pobiera aktywny klucz publiczny VAPID.
- `push.web.subscribe` — rejestruje `endpoint` oraz `keys.p256dh`/`keys.auth`.
- `push.web.unsubscribe` — usuwa zarejestrowany punkt końcowy.
- `push.web.test` — wysyła powiadomienie testowe do subskrypcji wywołującego.

<Note>
Web Push jest niezależny od ścieżki przekaźnika APNS dla iOS (zobacz [Konfiguracja](/pl/gateway/configuration) dla powiadomień push opartych na przekaźniku) oraz istniejącej metody `push.test`, które dotyczą natywnego parowania mobilnego.
</Note>

## Hostowane osadzenia

Wiadomości asystenta mogą renderować hostowane treści internetowe inline za pomocą shortcode’u `[embed ...]`. Polityka sandbox iframe jest kontrolowana przez `gateway.controlUi.embedSandbox`:

<Tabs>
  <Tab title="strict">
    Wyłącza wykonywanie skryptów wewnątrz hostowanych osadzeń.
  </Tab>
  <Tab title="scripts (default)">
    Zezwala na interaktywne osadzenia przy zachowaniu izolacji źródła; jest to wartość domyślna i zwykle wystarcza dla samodzielnych gier/widgetów przeglądarkowych.
  </Tab>
  <Tab title="trusted">
    Dodaje `allow-same-origin` oprócz `allow-scripts` dla dokumentów z tej samej witryny, które celowo wymagają silniejszych uprawnień.
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
Używaj `trusted` tylko wtedy, gdy osadzony dokument rzeczywiście wymaga zachowania same-origin. Dla większości gier generowanych przez agentów i interaktywnych płócien bezpieczniejszym wyborem jest `scripts`.
</Warning>

Bezwzględne zewnętrzne adresy URL osadzeń `http(s)` pozostają domyślnie zablokowane. Jeśli celowo chcesz, aby `[embed url="https://..."]` ładował strony innych firm, ustaw `gateway.controlUi.allowExternalEmbedUrls: true`.

## Szerokość wiadomości czatu

Zgrupowane wiadomości czatu używają czytelnej domyślnej maksymalnej szerokości. Wdrożenia na szerokich monitorach mogą ją nadpisać bez łatania dołączonego CSS, ustawiając `gateway.controlUi.chatMessageMaxWidth`:

```json5
{
  gateway: {
    controlUi: {
      chatMessageMaxWidth: "min(1280px, 82%)",
    },
  },
}
```

Wartość jest walidowana, zanim trafi do przeglądarki. Obsługiwane wartości obejmują zwykłe długości i procenty, takie jak `960px` lub `82%`, oraz ograniczone wyrażenia szerokości `min(...)`, `max(...)`, `clamp(...)`, `calc(...)` i `fit-content(...)`.

## Dostęp przez tailnet (zalecane)

<Tabs>
  <Tab title="Integrated Tailscale Serve (preferred)">
    Pozostaw Gateway na loopback i pozwól Tailscale Serve pośredniczyć do niego przez HTTPS:

    ```bash
    openclaw gateway --tailscale serve
    ```

    Otwórz:

    - `https://<magicdns>/` (lub skonfigurowany `gateway.controlUi.basePath`)

    Domyślnie żądania Control UI/WebSocket Serve mogą uwierzytelniać się przez nagłówki tożsamości Tailscale (`tailscale-user-login`), gdy `gateway.auth.allowTailscale` ma wartość `true`. OpenClaw weryfikuje tożsamość, rozwiązując adres `x-forwarded-for` za pomocą `tailscale whois` i dopasowując go do nagłówka, oraz akceptuje je tylko wtedy, gdy żądanie trafia na loopback z nagłówkami Tailscale `x-forwarded-*`. Dla sesji operatora Control UI z tożsamością urządzenia przeglądarki ta zweryfikowana ścieżka Serve pomija również rundę parowania urządzenia; przeglądarki bez urządzenia i połączenia w roli węzła nadal przechodzą normalne kontrole urządzenia. Ustaw `gateway.auth.allowTailscale: false`, jeśli chcesz wymagać jawnych poświadczeń współdzielonego sekretu nawet dla ruchu Serve. Następnie użyj `gateway.auth.mode: "token"` albo `"password"`.

    Dla tej asynchronicznej ścieżki tożsamości Serve nieudane próby uwierzytelnienia z tego samego adresu IP klienta i zakresu uwierzytelniania są serializowane przed zapisami limitu szybkości. Równoczesne błędne ponowienia z tej samej przeglądarki mogą więc pokazać `retry later` przy drugim żądaniu zamiast dwóch zwykłych niezgodności ścigających się równolegle.

    <Warning>
    Uwierzytelnianie Serve bez tokena zakłada, że host gateway jest zaufany. Jeśli na tym hoście może działać niezaufany kod lokalny, wymagaj uwierzytelniania tokenem/hasłem.
    </Warning>

  </Tab>
  <Tab title="Bind to tailnet + token">
    ```bash
    openclaw gateway --bind tailnet --token "$(openssl rand -hex 32)"
    ```

    Następnie otwórz:

    - `http://<tailscale-ip>:18789/` (lub skonfigurowany `gateway.controlUi.basePath`)

    Wklej pasujący współdzielony sekret w ustawieniach UI (wysyłany jako `connect.params.auth.token` lub `connect.params.auth.password`).

  </Tab>
</Tabs>

## Niezabezpieczony HTTP

Jeśli otworzysz pulpit przez zwykły HTTP (`http://<lan-ip>` lub `http://<tailscale-ip>`), przeglądarka działa w **niezabezpieczonym kontekście** i blokuje WebCrypto. Domyślnie OpenClaw **blokuje** połączenia Control UI bez tożsamości urządzenia.

Udokumentowane wyjątki:

- zgodność niezabezpieczonego HTTP tylko dla localhost z `gateway.controlUi.allowInsecureAuth=true`
- pomyślne uwierzytelnienie operatora Control UI przez `gateway.auth.mode: "trusted-proxy"`
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

    `allowInsecureAuth` jest wyłącznie lokalnym przełącznikiem zgodności:

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
    `dangerouslyDisableDeviceAuth` wyłącza kontrole tożsamości urządzenia Control UI i jest poważnym obniżeniem bezpieczeństwa. Wycofaj szybko po użyciu awaryjnym.
    </Warning>

  </Accordion>
  <Accordion title="Trusted-proxy note">
    - Pomyślne uwierzytelnienie trusted-proxy może dopuścić sesje **operatora** Control UI bez tożsamości urządzenia.
    - Nie obejmuje to sesji Control UI w roli węzła.
    - Zwrotne reverse proxy na tym samym hoście nadal nie spełniają uwierzytelniania trusted-proxy; zobacz [Uwierzytelnianie przez zaufane proxy](/pl/gateway/trusted-proxy-auth).

  </Accordion>
</AccordionGroup>

Zobacz [Tailscale](/pl/gateway/tailscale), aby uzyskać wskazówki konfiguracji HTTPS.

## Polityka bezpieczeństwa treści

Control UI jest dostarczany ze ścisłą polityką `img-src`: dozwolone są tylko zasoby **same-origin**, adresy URL `data:` i lokalnie wygenerowane adresy URL `blob:`. Zdalne adresy URL obrazów `http(s)` i względne względem protokołu są odrzucane przez przeglądarkę i nie wywołują pobrań sieciowych.

Co to oznacza w praktyce:

- Awatary i obrazy serwowane pod ścieżkami względnymi (na przykład `/avatars/<id>`) nadal się renderują, w tym uwierzytelnione trasy awatarów, które UI pobiera i konwertuje na lokalne adresy URL `blob:`.
- Inline adresy URL `data:image/...` nadal się renderują (przydatne dla ładunków w protokole).
- Lokalne adresy URL `blob:` utworzone przez Control UI nadal się renderują.
- Zdalne adresy URL awatarów emitowane przez metadane kanału są usuwane w helperach awatarów Control UI i zastępowane wbudowanym logo/odznaką, więc przejęty lub złośliwy kanał nie może wymusić dowolnych zdalnych pobrań obrazów z przeglądarki operatora.

Nie musisz nic zmieniać, aby uzyskać to zachowanie — jest zawsze włączone i niekonfigurowalne.

## Uwierzytelnianie trasy awatara

Gdy uwierzytelnianie gateway jest skonfigurowane, punkt końcowy awatara Control UI wymaga tego samego tokena gateway co reszta API:

- `GET /avatar/<agentId>` zwraca obraz awatara tylko uwierzytelnionym wywołującym. `GET /avatar/<agentId>?meta=1` zwraca metadane awatara według tej samej reguły.
- Nieuwierzytelnione żądania do którejkolwiek trasy są odrzucane (zgodnie z siostrzaną trasą assistant-media). Zapobiega to wyciekowi tożsamości agenta przez trasę awatara na hostach, które poza tym są chronione.
- Sam Control UI przekazuje token gateway jako nagłówek bearer podczas pobierania awatarów i używa uwierzytelnionych adresów URL blob, dzięki czemu obraz nadal renderuje się w pulpitach.

Jeśli wyłączysz uwierzytelnianie gateway (niezalecane na współdzielonych hostach), trasa awatara również staje się nieuwierzytelniona, zgodnie z resztą gateway.

## Uwierzytelnianie trasy mediów asystenta

Gdy uwierzytelnianie gateway jest skonfigurowane, podglądy lokalnych mediów asystenta używają dwuetapowej trasy:

- `GET /__openclaw__/assistant-media?meta=1&source=<path>` wymaga normalnego uwierzytelnienia operatora Control UI. Przeglądarka wysyła token gateway jako nagłówek bearer podczas sprawdzania dostępności.
- Pomyślne odpowiedzi metadanych zawierają krótkotrwały `mediaTicket` ograniczony do dokładnie tej ścieżki źródłowej.
- Renderowane przez przeglądarkę adresy URL obrazów, audio, wideo i dokumentów używają `mediaTicket=<ticket>` zamiast aktywnego tokena gateway lub hasła. Bilet szybko wygasa i nie może autoryzować innego źródła.

Dzięki temu normalne renderowanie mediów pozostaje zgodne z natywnymi elementami mediów przeglądarki bez umieszczania wielokrotnego użytku poświadczeń gateway w widocznych adresach URL mediów.

## Budowanie UI

Gateway serwuje pliki statyczne z `dist/control-ui`. Zbuduj je poleceniem:

```bash
pnpm ui:build
```

Opcjonalna bezwzględna baza (gdy chcesz stałe adresy URL zasobów):

```bash
OPENCLAW_CONTROL_UI_BASE_PATH=/openclaw/ pnpm ui:build
```

Dla lokalnego rozwoju (osobny serwer deweloperski):

```bash
pnpm ui:dev
```

Następnie skieruj UI na URL WS swojego Gateway (np. `ws://127.0.0.1:18789`).

## Pusta strona Control UI

Jeśli przeglądarka ładuje pusty pulpit, a DevTools nie pokazuje użytecznego błędu, rozszerzenie lub wczesny skrypt treści mógł uniemożliwić wykonanie aplikacji modułu JavaScript. Strona statyczna zawiera prosty panel odzyskiwania HTML, który pojawia się, gdy `<openclaw-app>` nie jest zarejestrowany po starcie.

Użyj akcji **Spróbuj ponownie** w panelu po zmianie środowiska przeglądarki albo przeładuj ręcznie po tych kontrolach:

- Wyłącz rozszerzenia, które wstrzykują się na wszystkie strony, zwłaszcza rozszerzenia ze skryptami treści `<all_urls>`.
- Spróbuj okna prywatnego, czystego profilu przeglądarki albo innej przeglądarki.
- Utrzymaj Gateway uruchomiony i sprawdź ten sam URL pulpitu po zmianie przeglądarki.

## Debugowanie/testowanie: serwer deweloperski + zdalny Gateway

Control UI to pliki statyczne; cel WebSocket jest konfigurowalny i może być inny niż źródło HTTP. Jest to przydatne, gdy chcesz lokalnie używać serwera deweloperskiego Vite, ale Gateway działa gdzie indziej.

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

    Opcjonalne jednorazowe uwierzytelnianie (jeśli potrzebne):

    ```text
    http://localhost:5173/?gatewayUrl=wss%3A%2F%2F<gateway-host>%3A18789#token=<gateway-token>
    ```

  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Uwagi">
    - `gatewayUrl` jest zapisywany w localStorage po załadowaniu i usuwany z URL-a.
    - Jeśli przekazujesz pełny endpoint `ws://` lub `wss://` przez `gatewayUrl`, zakoduj wartość `gatewayUrl` jako URL, aby przeglądarka poprawnie przeanalizowała ciąg zapytania.
    - `token` należy przekazywać przez fragment URL-a (`#token=...`), gdy tylko jest to możliwe. Fragmenty nie są wysyłane na serwer, co zapobiega wyciekom w logach żądań i przez Referer. Starsze parametry zapytania `?token=` nadal są jednorazowo importowane dla zgodności, ale tylko jako mechanizm awaryjny, i są usuwane natychmiast po inicjalizacji.
    - `password` jest przechowywane tylko w pamięci.
    - Gdy ustawiono `gatewayUrl`, UI nie wraca awaryjnie do poświadczeń z konfiguracji ani środowiska. Podaj jawnie `token` (lub `password`). Brak jawnych poświadczeń jest błędem.
    - Użyj `wss://`, gdy Gateway znajduje się za TLS (Tailscale Serve, proxy HTTPS itd.).
    - `gatewayUrl` jest akceptowany tylko w oknie najwyższego poziomu (nie osadzonym), aby zapobiec clickjackingowi.
    - Publiczne wdrożenia Control UI poza loopback muszą jawnie ustawić `gateway.controlUi.allowedOrigins` (pełne originy). Prywatne ładowania z tym samym originem w sieci LAN/Tailnet z loopback, hostów RFC1918/link-local, `.local`, `.ts.net` lub Tailscale CGNAT są akceptowane bez włączania mechanizmu awaryjnego opartego na nagłówku Host.
    - Podczas uruchamiania Gateway może zainicjować lokalne originy, takie jak `http://localhost:<port>` i `http://127.0.0.1:<port>`, na podstawie efektywnego bindowania i portu środowiska uruchomieniowego, ale originy zdalnych przeglądarek nadal wymagają jawnych wpisów.
    - Nie używaj `gateway.controlUi.allowedOrigins: ["*"]` poza ściśle kontrolowanym testowaniem lokalnym. Oznacza to zezwolenie na dowolny origin przeglądarki, a nie „dopasuj host, którego akurat używam”.
    - `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` włącza tryb mechanizmu awaryjnego originu opartego na nagłówku Host, ale jest to niebezpieczny tryb zabezpieczeń.

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

Szczegóły konfiguracji zdalnego dostępu: [Zdalny dostęp](/pl/gateway/remote).

## Powiązane

- [Dashboard](/pl/web/dashboard) — dashboard Gateway
- [Health Checks](/pl/gateway/health) — monitorowanie kondycji Gateway
- [TUI](/pl/web/tui) — terminalowy interfejs użytkownika
- [WebChat](/pl/web/webchat) — interfejs czatu oparty na przeglądarce
