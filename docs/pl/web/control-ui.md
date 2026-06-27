---
read_when:
    - Chcesz obsługiwać Gateway z przeglądarki
    - Chcesz dostępu do Tailnet bez tuneli SSH
sidebarTitle: Control UI
summary: Przeglądarkowy interfejs sterowania dla Gateway (czat, aktywność, węzły, konfiguracja)
title: Interfejs sterowania
x-i18n:
    generated_at: "2026-06-27T18:33:15Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: dc8b9675454d57bbfb6be10bb7ef94152a89a72c94affdf72be8c79cf14cbb08
    source_path: web/control-ui.md
    workflow: 16
---

Control UI to mała jednostronicowa aplikacja **Vite + Lit** serwowana przez Gateway:

- domyślnie: `http://<host>:18789/`
- opcjonalny prefiks: ustaw `gateway.controlUi.basePath` (np. `/openclaw`)

Komunikuje się **bezpośrednio z Gateway WebSocket** na tym samym porcie.

## Szybkie otwarcie (lokalnie)

Jeśli Gateway działa na tym samym komputerze, otwórz:

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/) (lub [http://localhost:18789/](http://localhost:18789/))

Jeśli strona się nie ładuje, najpierw uruchom Gateway: `openclaw gateway`.

Uwierzytelnianie jest przekazywane podczas uzgadniania WebSocket przez:

- `connect.params.auth.token`
- `connect.params.auth.password`
- nagłówki tożsamości Tailscale Serve, gdy `gateway.auth.allowTailscale: true`
- nagłówki tożsamości zaufanego proxy, gdy `gateway.auth.mode: "trusted-proxy"`

Panel ustawień pulpitu przechowuje token dla bieżącej sesji karty przeglądarki i wybranego adresu URL gateway; hasła nie są utrwalane. Onboarding zwykle generuje token gateway dla uwierzytelniania wspólnym sekretem przy pierwszym połączeniu, ale uwierzytelnianie hasłem także działa, gdy `gateway.auth.mode` ma wartość `"password"`.

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

Jeśli przeglądarka ponawia parowanie ze zmienionymi szczegółami uwierzytelniania (rola/zakresy/klucz publiczny), poprzednie oczekujące żądanie zostaje zastąpione i tworzony jest nowy `requestId`. Przed zatwierdzeniem ponownie uruchom `openclaw devices list`.

Jeśli przeglądarka jest już sparowana i zmienisz jej dostęp z odczytu na zapis/admin, jest to traktowane jako podniesienie zatwierdzenia, a nie ciche ponowne połączenie. OpenClaw utrzymuje stare zatwierdzenie aktywne, blokuje szersze ponowne połączenie i prosi o jawne zatwierdzenie nowego zestawu zakresów.

Po zatwierdzeniu urządzenie jest zapamiętywane i nie będzie wymagać ponownego zatwierdzenia, chyba że je unieważnisz poleceniem `openclaw devices revoke --device <id> --role <role>`. Zobacz [CLI urządzeń](/pl/cli/devices), aby poznać rotację i unieważnianie tokenów.

Agenci Paperclip łączący się przez adapter `openclaw_gateway` używają tego samego przepływu zatwierdzania przy pierwszym uruchomieniu. Po początkowej próbie połączenia uruchom `openclaw devices approve --latest`, aby podejrzeć oczekujące żądanie, a następnie ponownie uruchom wydrukowane polecenie `openclaw devices approve <requestId>`, aby je zatwierdzić. Dla zdalnego gateway przekaż jawne wartości `--url` i `--token`. Aby zatwierdzenia pozostawały stabilne między restartami, skonfiguruj trwały `adapterConfig.devicePrivateKeyPem` w Paperclip zamiast pozwalać mu generować nową efemeryczną tożsamość urządzenia przy każdym uruchomieniu.

<Note>
- Bezpośrednie połączenia przeglądarki przez lokalny local loopback (`127.0.0.1` / `localhost`) są zatwierdzane automatycznie.
- Tailscale Serve może pominąć rundę parowania dla sesji operatora Control UI, gdy `gateway.auth.allowTailscale: true`, tożsamość Tailscale zostanie zweryfikowana, a przeglądarka przedstawi swoją tożsamość urządzenia.
- Bezpośrednie powiązania Tailnet, połączenia przeglądarki z sieci LAN oraz profile przeglądarki bez tożsamości urządzenia nadal wymagają jawnego zatwierdzenia.
- Każdy profil przeglądarki generuje unikalny identyfikator urządzenia, więc zmiana przeglądarki lub wyczyszczenie danych przeglądarki będzie wymagać ponownego parowania.

</Note>

## Tożsamość osobista (lokalna dla przeglądarki)

Control UI obsługuje osobistą tożsamość per przeglądarka (nazwę wyświetlaną i awatar) dołączaną do wiadomości wychodzących na potrzeby przypisania autorstwa we współdzielonych sesjach. Znajduje się ona w pamięci przeglądarki, jest ograniczona do bieżącego profilu przeglądarki i nie jest synchronizowana z innymi urządzeniami ani utrwalana po stronie serwera poza zwykłymi metadanymi autorstwa transkrypcji dla wiadomości, które faktycznie wysyłasz. Wyczyszczenie danych witryny lub zmiana przeglądarki resetuje ją do pustej wartości.

Ten sam lokalny dla przeglądarki wzorzec dotyczy nadpisania awatara asystenta. Przesłane awatary asystenta nakładają tożsamość rozwiązaną przez gateway tylko w lokalnej przeglądarce i nigdy nie przechodzą w obie strony przez `config.patch`. Współdzielone pole konfiguracji `ui.assistant.avatar` jest nadal dostępne dla klientów innych niż UI, którzy zapisują to pole bezpośrednio (takich jak skryptowe gateway lub niestandardowe pulpity).

## Punkt końcowy konfiguracji środowiska uruchomieniowego

Control UI pobiera ustawienia środowiska uruchomieniowego z `/control-ui-config.json`, rozwiązanego względem ścieżki bazowej Control UI gateway (na przykład `/__openclaw__/control-ui-config.json`, gdy UI jest serwowany pod `/__openclaw__/`). Ten punkt końcowy jest chroniony tym samym uwierzytelnianiem gateway co reszta powierzchni HTTP: nieuwierzytelnione przeglądarki nie mogą go pobrać, a pomyślne pobranie wymaga albo już poprawnego tokenu/hasła gateway, tożsamości Tailscale Serve, albo tożsamości zaufanego proxy.

## Obsługa języków

Control UI może lokalizować się przy pierwszym załadowaniu na podstawie ustawień regionalnych przeglądarki. Aby później je nadpisać, otwórz **Przegląd -> Dostęp do Gateway -> Język**. Selektor ustawień regionalnych znajduje się na karcie Dostęp do Gateway, a nie w sekcji Wygląd.

- Obsługiwane ustawienia regionalne: `en`, `zh-CN`, `zh-TW`, `pt-BR`, `de`, `es`, `ja-JP`, `ko`, `fr`, `ar`, `it`, `tr`, `uk`, `id`, `pl`, `th`, `vi`, `nl`, `fa`
- Tłumaczenia inne niż angielskie są leniwie ładowane w przeglądarce.
- Wybrane ustawienie regionalne jest zapisywane w pamięci przeglądarki i ponownie używane przy kolejnych wizytach.
- Brakujące klucze tłumaczeń wracają do języka angielskiego.

Tłumaczenia dokumentacji są generowane dla tego samego zestawu ustawień regionalnych innych niż angielskie, ale wbudowany selektor języka witryny dokumentacji Mintlify jest ograniczony do kodów ustawień regionalnych akceptowanych przez Mintlify. Dokumentacja tajska (`th`) i perska (`fa`) jest nadal generowana w repozytorium publikacji; może nie pojawić się w tym selektorze, dopóki Mintlify nie będzie obsługiwać tych kodów.

## Motywy wyglądu

Panel Wygląd zachowuje wbudowane motywy Claw, Knot i Dash oraz jedno lokalne dla przeglądarki miejsce importu tweakcn. Aby zaimportować motyw, otwórz [edytor tweakcn](https://tweakcn.com/editor/theme), wybierz lub utwórz motyw, kliknij **Udostępnij** i wklej skopiowany link motywu w sekcji Wygląd. Importer akceptuje także adresy URL rejestru `https://tweakcn.com/r/themes/<id>`, adresy URL edytora, takie jak `https://tweakcn.com/editor/theme?theme=amethyst-haze`, względne ścieżki `/themes/<id>`, surowe identyfikatory motywów oraz domyślne nazwy motywów, takie jak `amethyst-haze`.

Wygląd zawiera też lokalne dla przeglądarki ustawienie rozmiaru tekstu. Ustawienie jest przechowywane razem z pozostałymi preferencjami Control UI, dotyczy tekstu czatu, tekstu kompozytora, kart narzędzi i pasków bocznych czatu oraz utrzymuje pola tekstowe na poziomie co najmniej 16px, aby mobilne Safari nie powiększało automatycznie widoku po ustawieniu fokusu.

Zaimportowane motywy są przechowywane tylko w bieżącym profilu przeglądarki. Nie są zapisywane w konfiguracji gateway i nie synchronizują się między urządzeniami. Zastąpienie zaimportowanego motywu aktualizuje jedno lokalne miejsce; jego wyczyszczenie przełącza aktywny motyw z powrotem na Claw, jeśli zaimportowany motyw był wybrany.

## Co może robić (dzisiaj)

<AccordionGroup>
  <Accordion title="Czat i rozmowa">
    - Rozmawiaj z modelem przez Gateway WS (`chat.history`, `chat.send`, `chat.abort`, `chat.inject`).
    - Odświeżenia historii czatu żądają ograniczonego ostatniego okna z limitami tekstu na wiadomość, aby duże sesje nie zmuszały przeglądarki do renderowania pełnego ładunku transkrypcji, zanim czat stanie się użyteczny.
    - Rozmawiaj przez sesje czasu rzeczywistego w przeglądarce. OpenAI używa bezpośredniego WebRTC, Google Live używa ograniczonego jednorazowego tokenu przeglądarki przez WebSocket, a backendowe Plugin do głosu w czasie rzeczywistym używają transportu przekaźnikowego Gateway. Sesje dostawcy należące do klienta zaczynają się od `talk.client.create`; sesje przekaźnikowe Gateway zaczynają się od `talk.session.create`. Przekaźnik utrzymuje poświadczenia dostawcy w Gateway, podczas gdy przeglądarka strumieniuje PCM mikrofonu przez `talk.session.appendAudio`, przekazuje wywołania narzędzi dostawcy `openclaw_agent_consult` przez `talk.client.toolCall` na potrzeby polityki Gateway i większego skonfigurowanego modelu OpenClaw oraz kieruje sterowanie głosowe aktywnego uruchomienia przez `talk.client.steer` lub `talk.session.steer`.
    - Strumieniuj wywołania narzędzi i karty wyników narzędzi na żywo w czacie (zdarzenia agenta).
    - Karta aktywności z lokalnymi dla przeglądarki, redagowanymi w pierwszej kolejności podsumowaniami aktywności narzędzi na żywo z istniejącego dostarczania zdarzeń `session.tool` / narzędzi.

  </Accordion>
  <Accordion title="Kanały, instancje, sesje, sny">
    - Kanały: wbudowane oraz spakowane/zewnętrzne kanały Plugin, stan, logowanie QR i konfiguracja per kanał (`channels.status`, `web.login.*`, `config.patch`).
    - Odświeżenia sond kanałów utrzymują poprzednią migawkę widoczną podczas kończenia wolnych kontroli dostawcy, a częściowe migawki są oznaczane, gdy sonda lub audyt przekroczy swój budżet UI.
    - Instancje: lista obecności + odświeżanie (`system-presence`).
    - Sesje: domyślnie listuj sesje skonfigurowanych agentów, wycofuj się ze starych kluczy sesji nieskonfigurowanych agentów oraz stosuj nadpisania modelu/myślenia/trybu szybkiego/trybu szczegółowego/śledzenia/rozumowania per sesja (`sessions.list`, `sessions.patch`).
    - Sny: stan Dreaming, przełącznik włącz/wyłącz i czytnik Dziennika snów (`doctor.memory.status`, `doctor.memory.dreamDiary`, `config.patch`).

  </Accordion>
  <Accordion title="Cron, Skills, węzły, zatwierdzenia exec">
    - Zadania Cron: lista/dodaj/edytuj/uruchom/włącz/wyłącz + historia uruchomień (`cron.*`).
    - Skills: stan, włącz/wyłącz, instalacja, aktualizacje kluczy API (`skills.*`).
    - Węzły: lista + limity (`node.list`).
    - Zatwierdzenia exec: edytuj listy dozwolonych gateway lub węzła + politykę pytań dla `exec host=gateway/node` (`exec.approvals.*`).

  </Accordion>
  <Accordion title="Konfiguracja">
    - Wyświetl/edytuj `~/.openclaw/openclaw.json` (`config.get`, `config.set`).
    - MCP ma dedykowaną stronę ustawień dla skonfigurowanych serwerów, włączania, podsumowań OAuth/filtra/równoległości, typowych poleceń operatora oraz ograniczonego do zakresu edytora konfiguracji `mcp`.
    - Zastosuj + uruchom ponownie z walidacją (`config.apply`) i wybudź ostatnią aktywną sesję.
    - Zapisy obejmują zabezpieczenie oparte na hashu bazowym, aby zapobiec nadpisywaniu równoczesnych edycji.
    - Zapisy (`config.set`/`config.apply`/`config.patch`) wykonują preflight rozwiązywania aktywnych SecretRef dla referencji w przesłanym ładunku konfiguracji; nierozwiązane aktywne przesłane referencje są odrzucane przed zapisem.
    - Zapisy formularzy odrzucają nieaktualne zredagowane symbole zastępcze, których nie można odtworzyć z zapisanej konfiguracji, zachowując zredagowane wartości, które nadal mapują się na zapisane sekrety.
    - Renderowanie schematu i formularza (`config.schema` / `config.schema.lookup`, w tym pola `title` / `description`, dopasowane podpowiedzi UI, natychmiastowe podsumowania dzieci, metadane dokumentacji na zagnieżdżonych węzłach obiektów/wieloznaczników/tablic/kompozycji oraz schematy Plugin + kanałów, gdy są dostępne); edytor surowego JSON jest dostępny tylko wtedy, gdy migawka ma bezpieczną surową rundę w obie strony.
    - Jeśli migawka nie może bezpiecznie przejść rundy w obie strony jako surowy tekst, Control UI wymusza tryb Formularz i wyłącza tryb Surowy dla tej migawki.
    - Edytor surowego JSON „Resetuj do zapisanych” zachowuje surowo utworzony kształt (formatowanie, komentarze, układ `$include`) zamiast ponownie renderować spłaszczoną migawkę, więc zewnętrzne edycje przetrwają reset, gdy migawka może bezpiecznie przejść rundę w obie strony.
    - Ustrukturyzowane wartości obiektów SecretRef są renderowane jako tylko do odczytu w tekstowych polach formularza, aby zapobiec przypadkowemu uszkodzeniu typu obiekt-na-ciąg.

  </Accordion>
  <Accordion title="Debugowanie, logi, aktualizacja">
    - Debugowanie: migawki stanu/kondycji/modeli + dziennik zdarzeń + ręczne wywołania RPC (`status`, `health`, `models.list`).
    - Dziennik zdarzeń obejmuje czasy odświeżania/RPC Control UI, czasy powolnego renderowania czatu/konfiguracji oraz wpisy responsywności przeglądarki dla długich klatek animacji lub długich zadań, gdy przeglądarka udostępnia te typy wpisów PerformanceObserver.
    - Logi: ogon na żywo logów plików gateway z filtrem/eksportem (`logs.tail`).
    - Aktualizacja: uruchom aktualizację pakietu/git + restart (`update.run`) z raportem restartu, a następnie odpytuj `update.status` po ponownym połączeniu, aby zweryfikować działającą wersję gateway.

  </Accordion>
  <Accordion title="Notatki panelu zadań Cron">
    - W przypadku izolowanych zadań dostarczanie domyślnie ogłasza podsumowanie. Możesz przełączyć na brak, jeśli chcesz uruchomienia wyłącznie wewnętrzne.
    - Pola kanału/celu pojawiają się po wybraniu ogłaszania.
    - Tryb Webhook używa `delivery.mode = "webhook"` z `delivery.to` ustawionym na prawidłowy adres URL webhooka HTTP(S).
    - W przypadku zadań sesji głównej dostępne są tryby dostarczania Webhook i brak.
    - Zaawansowane elementy edycji obejmują usunięcie po uruchomieniu, wyczyszczenie nadpisania agenta, opcje Cron exact/stagger, nadpisania modelu/myślenia agenta oraz przełączniki dostarczania best-effort.
    - Walidacja formularza jest wbudowana, z błędami na poziomie pól; nieprawidłowe wartości wyłączają przycisk zapisu do czasu poprawienia.
    - Ustaw `cron.webhookToken`, aby wysyłać dedykowany token bearer; jeśli go pominięto, webhook jest wysyłany bez nagłówka uwierzytelniania.
    - Przestarzały fallback: uruchom `openclaw doctor --fix`, aby zmigrować zapisane starsze zadania z `notify: true` z `cron.webhook` do jawnego webhooka dla zadania albo dostarczania po ukończeniu.

  </Accordion>
</AccordionGroup>

## Strona MCP

Dedykowana strona MCP to widok operatora dla serwerów MCP zarządzanych przez OpenClaw w `mcp.servers`. Sama nie uruchamia transportów MCP; używaj jej do sprawdzania i edycji zapisanej konfiguracji, a następnie użyj `openclaw mcp doctor --probe`, gdy potrzebujesz dowodu działania serwera na żywo.

Typowy przepływ pracy:

1. Otwórz **MCP** z paska bocznego.
2. Sprawdź karty podsumowania pod kątem łącznej liczby serwerów, liczby włączonych, OAuth i liczby serwerów po filtrowaniu.
3. Przejrzyj każdy wiersz serwera pod kątem transportu, włączenia, uwierzytelniania, filtrów, limitów czasu i podpowiedzi poleceń.
4. Przełącz włączenie, gdy serwer ma pozostać skonfigurowany, ale nie uczestniczyć w wykrywaniu w czasie działania.
5. Edytuj zakresową sekcję konfiguracji `mcp` dla definicji serwerów, nagłówków, ścieżek TLS/mTLS, metadanych OAuth, filtrów narzędzi i metadanych projekcji Codex.
6. Użyj **Zapisz** do zapisu konfiguracji albo **Zapisz i opublikuj**, gdy działający Gateway powinien zastosować zmienioną konfigurację.
7. Uruchom `openclaw mcp status --verbose`, `openclaw mcp doctor --probe` albo `openclaw mcp reload` z terminala, gdy edytowany proces wymaga statycznej diagnostyki, dowodu na żywo albo usunięcia pamięci podręcznej czasu działania.

Strona redaguje wartości podobne do adresów URL zawierające poświadczenia przed renderowaniem i ujmuje nazwy serwerów w cudzysłowy we fragmentach poleceń, aby skopiowane polecenia nadal działały ze spacjami lub metaznakami powłoki. Pełna dokumentacja CLI i konfiguracji znajduje się w [MCP](/pl/cli/mcp).

## Karta Aktywność

Karta Aktywność jest efemerycznym, lokalnym dla przeglądarki obserwatorem aktywności narzędzi na żywo. Wywodzi się z tego samego strumienia zdarzeń Gateway `session.tool` / narzędzi, który zasila karty narzędzi czatu; nie dodaje kolejnej rodziny zdarzeń Gateway, endpointu, trwałego magazynu aktywności, kanału metryk ani zewnętrznego strumienia obserwatora.

Wpisy aktywności przechowują tylko oczyszczone podsumowania oraz zredagowane, skrócone podglądy wyjścia. Wartości argumentów narzędzi nie są przechowywane w stanie Aktywności; interfejs pokazuje, że argumenty są ukryte, i zapisuje tylko liczbę pól argumentów. Lista w pamięci podąża za bieżącą kartą przeglądarki, przetrwa nawigację w Control UI i resetuje się po przeładowaniu strony, przełączeniu sesji lub kliknięciu **Wyczyść**.

## Zachowanie czatu

<AccordionGroup>
  <Accordion title="Semantyka wysyłania i historii">
    - `chat.send` jest **nieblokujące**: potwierdza natychmiast z `{ runId, status: "started" }`, a odpowiedź jest przesyłana strumieniowo przez zdarzenia `chat`. Zaufani klienci Control UI mogą też otrzymywać opcjonalne metadane czasu ACK do lokalnej diagnostyki.
    - Przesyłanie do czatu akceptuje obrazy oraz pliki inne niż wideo. Obrazy zachowują natywną ścieżkę obrazu; inne pliki są przechowywane jako zarządzane media i pokazywane w historii jako linki załączników.
    - Ponowne wysłanie z tym samym `idempotencyKey` zwraca `{ status: "in_flight" }` podczas działania oraz `{ status: "ok" }` po ukończeniu.
    - Odpowiedzi `chat.history` mają ograniczony rozmiar dla bezpieczeństwa interfejsu. Gdy wpisy transkryptu są zbyt duże, Gateway może skracać długie pola tekstowe, pomijać ciężkie bloki metadanych i zastępować zbyt duże wiadomości symbolem zastępczym (`[chat.history omitted: message too large]`).
    - Gdy widoczna wiadomość asystenta została skrócona w `chat.history`, czytnik boczny może na żądanie pobrać pełny, znormalizowany do wyświetlania wpis transkryptu przez `chat.message.get` według `sessionKey`, aktywnego `agentId`, gdy jest potrzebny, oraz `messageId` transkryptu. Jeśli Gateway nadal nie może zwrócić więcej, czytnik pokazuje jawny stan niedostępności zamiast po cichu powtarzać skrócony podgląd.
    - Obrazy asystenta/wygenerowane obrazy są utrwalane jako referencje zarządzanych mediów i zwracane przez uwierzytelnione adresy URL mediów Gateway, więc przeładowania nie zależą od pozostawania surowych ładunków obrazów base64 w odpowiedzi historii czatu.
    - Podczas renderowania `chat.history` Control UI usuwa z widocznego tekstu asystenta dyrektywy inline tylko do wyświetlania (na przykład `[[reply_to_*]]` i `[[audio_as_voice]]`), ładunki XML wywołań narzędzi w tekście zwykłym (w tym `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` oraz skrócone bloki wywołań narzędzi), a także ujawnione tokeny sterujące modelu ASCII/pełnej szerokości, oraz pomija wpisy asystenta, których cały widoczny tekst to wyłącznie dokładny cichy token `NO_REPLY` / `no_reply` albo token potwierdzenia Heartbeat `HEARTBEAT_OK`.
    - Podczas aktywnego wysyłania i końcowego odświeżania historii widok czatu utrzymuje widoczne lokalne, optymistyczne wiadomości użytkownika/asystenta, jeśli `chat.history` przez krótki czas zwraca starszy zrzut; kanoniczny transkrypt zastępuje te lokalne wiadomości, gdy historia Gateway nadrobi zaległości.
    - Zdarzenia `chat` na żywo są stanem dostarczania, natomiast `chat.history` jest odbudowywane z trwałego transkryptu sesji. Po zdarzeniach końcowych narzędzi Control UI ponownie ładuje historię i scala tylko mały optymistyczny ogon; granica transkryptu jest udokumentowana w [WebChat](/pl/web/webchat).
    - `chat.inject` dołącza notatkę asystenta do transkryptu sesji i rozgłasza zdarzenie `chat` dla aktualizacji wyłącznie interfejsu (bez uruchomienia agenta, bez dostarczania kanałem).
    - Nagłówek czatu pokazuje filtr agenta przed selektorem sesji, a selektor sesji jest zawężony do wybranego agenta. Przełączenie agentów pokazuje tylko sesje powiązane z tym agentem i wraca do głównej sesji tego agenta, gdy nie ma on jeszcze zapisanych sesji pulpitu.
    - Na szerokościach desktopowych elementy sterowania czatem pozostają w jednym kompaktowym wierszu i zwijają się podczas przewijania transkryptu w dół; przewinięcie w górę, powrót na górę lub dotarcie na dół przywraca elementy sterowania.
    - Kolejne zduplikowane wiadomości wyłącznie tekstowe renderują się jako jeden dymek z plakietką liczby. Wiadomości zawierające obrazy, załączniki, wyjście narzędzi albo podglądy canvas pozostają niezwinięte.
    - Selektory modelu i myślenia w nagłówku czatu natychmiast aktualizują aktywną sesję przez `sessions.patch`; są to trwałe nadpisania sesji, a nie opcje wysyłania tylko dla jednej tury.
    - Jeśli wyślesz wiadomość, gdy zmiana selektora modelu dla tej samej sesji wciąż jest zapisywana, kompozytor czeka na tę poprawkę sesji przed wywołaniem `chat.send`, aby wysyłka użyła wybranego modelu.
    - Wpisanie `/new` w Control UI tworzy i przełącza na tę samą świeżą sesję pulpitu co Nowy czat, z wyjątkiem sytuacji, gdy skonfigurowano `session.dmScope: "main"` i bieżący rodzic jest główną sesją agenta; w takim przypadku resetuje główną sesję w miejscu. Wpisanie `/reset` zachowuje jawny reset w miejscu Gateway dla bieżącej sesji.
    - Selektor modelu czatu żąda skonfigurowanego widoku modeli Gateway. Jeśli obecne jest `agents.defaults.models`, ta lista dozwolonych wartości steruje selektorem, w tym wpisami `provider/*`, które utrzymują dynamiczne katalogi zakresowane do dostawcy. W przeciwnym razie selektor pokazuje jawne wpisy `models.providers.*.models` oraz dostawców z użytecznym uwierzytelnianiem. Pełny katalog pozostaje dostępny przez debugujące RPC `models.list` z `view: "all"`.
    - Gdy świeże raporty użycia sesji Gateway zawierają bieżące tokeny kontekstu, obszar kompozytora czatu pokazuje kompaktowy wskaźnik użycia kontekstu. Przełącza się na styl ostrzegawczy przy wysokiej presji kontekstu i, przy zalecanych poziomach Compaction, pokazuje kompaktowy przycisk uruchamiający normalną ścieżkę Compaction sesji. Nieaktualne zrzuty tokenów są ukrywane, dopóki Gateway ponownie nie zgłosi świeżego użycia.

  </Accordion>
  <Accordion title="Tryb rozmowy (czas rzeczywisty w przeglądarce)">
    Tryb rozmowy używa zarejestrowanego dostawcy głosu w czasie rzeczywistym. Skonfiguruj OpenAI za pomocą `talk.realtime.provider: "openai"` oraz profilu uwierzytelniania kluczem API `openai`, `talk.realtime.providers.openai.apiKey` albo `OPENAI_API_KEY`; profile OAuth OpenAI nie konfigurują głosu Realtime. Skonfiguruj Google za pomocą `talk.realtime.provider: "google"` oraz `talk.realtime.providers.google.apiKey`. Przeglądarka nigdy nie otrzymuje standardowego klucza API dostawcy. OpenAI otrzymuje efemeryczny sekret klienta Realtime dla WebRTC. Google Live otrzymuje jednorazowy, ograniczony token uwierzytelniający Live API dla sesji WebSocket przeglądarki, z instrukcjami i deklaracjami narzędzi zablokowanymi w tokenie przez Gateway. Dostawcy, którzy udostępniają tylko backendowy most czasu rzeczywistego, działają przez transport przekaźnika Gateway, więc poświadczenia i gniazda dostawców pozostają po stronie serwera, podczas gdy audio przeglądarki przechodzi przez uwierzytelnione RPC Gateway. Prompt sesji Realtime jest składany przez Gateway; `talk.client.create` nie akceptuje nadpisań instrukcji podanych przez wywołującego.

    Kompozytor czatu zawiera przycisk opcji rozmowy obok przycisku start/stop rozmowy. Opcje dotyczą następnej sesji rozmowy i mogą nadpisywać dostawcę, transport, model, głos, wysiłek rozumowania, próg VAD, czas trwania ciszy i dopełnienie prefiksu. Gdy opcja jest pusta, Gateway używa skonfigurowanych wartości domyślnych, jeśli są dostępne, albo wartości domyślnej dostawcy. Wybranie przekaźnika Gateway wymusza ścieżkę przekaźnika backendowego; wybranie WebRTC zachowuje sesję jako należącą do klienta i kończy się niepowodzeniem zamiast po cichu wracać do przekaźnika, jeśli dostawca nie może utworzyć sesji przeglądarki.

    W kompozytorze czatu element sterowania rozmową to przycisk fal obok przycisku dyktowania mikrofonem. Gdy rozmowa się rozpoczyna, wiersz stanu kompozytora pokazuje `Connecting Talk...`, następnie `Talk live`, gdy audio jest połączone, albo `Asking OpenClaw...`, gdy wywołanie narzędzia w czasie rzeczywistym konsultuje się ze skonfigurowanym większym modelem przez `talk.client.toolCall`.

    Maintainer live smoke: `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts` weryfikuje backendowy most WebSocket OpenAI, wymianę SDP WebRTC przeglądarki OpenAI, konfigurację przeglądarkowego WebSocket Google Live z ograniczonym tokenem oraz adapter przekaźnika Gateway dla przeglądarki z fałszywymi mediami mikrofonu. Polecenie wypisuje tylko status dostawcy i nie rejestruje sekretów.

  </Accordion>
  <Accordion title="Zatrzymanie i przerwanie">
    - Kliknij **Zatrzymaj** (wywołuje `chat.abort`).
    - Gdy uruchomienie jest aktywne, zwykłe dalsze wiadomości trafiają do kolejki. Kliknij **Steruj** na wiadomości w kolejce, aby wstrzyknąć tę dalszą wiadomość do trwającej tury.
    - Wpisz `/stop` (albo samodzielne frazy przerwania, takie jak `stop`, `stop action`, `stop run`, `stop openclaw`, `please stop`), aby przerwać poza pasmem.
    - `chat.abort` obsługuje `{ sessionKey }` (bez `runId`), aby przerwać wszystkie aktywne uruchomienia dla tej sesji.

  </Accordion>
  <Accordion title="Zachowanie częściowych danych po przerwaniu">
    - Gdy uruchomienie zostaje przerwane, częściowy tekst asystenta nadal może być pokazany w interfejsie.
    - Gateway utrwala przerwany częściowy tekst asystenta w historii transkryptu, gdy istnieje zbuforowane wyjście.
    - Utrwalone wpisy zawierają metadane przerwania, aby konsumenci transkryptu mogli odróżnić częściowe wyniki po przerwaniu od normalnego wyjścia ukończenia.

  </Accordion>
</AccordionGroup>

## Instalacja PWA i Web Push

Control UI dostarcza `manifest.webmanifest` oraz service workera, więc nowoczesne przeglądarki mogą zainstalować go jako samodzielną PWA. Web Push pozwala Gateway wybudzać zainstalowaną PWA powiadomieniami nawet wtedy, gdy karta lub okno przeglądarki nie jest otwarte.

Jeśli strona pokazuje **Niezgodność protokołu** zaraz po aktualizacji OpenClaw, najpierw ponownie otwórz pulpit za pomocą `openclaw dashboard` i wykonaj twarde odświeżenie strony. Jeśli nadal się nie powiedzie, wyczyść dane witryny dla źródła pulpitu albo przetestuj w prywatnym oknie przeglądarki; stara karta lub pamięć podręczna service workera przeglądarki może nadal uruchamiać pakiet Control UI sprzed aktualizacji względem nowszego Gateway.

| Powierzchnia                                          | Co robi                                                           |
| ----------------------------------------------------- | ----------------------------------------------------------------- |
| `ui/public/manifest.webmanifest`                      | Manifest PWA. Przeglądarki oferują opcję „Zainstaluj aplikację”, gdy stanie się osiągalna. |
| `ui/public/sw.js`                                     | Proces roboczy usługi obsługujący zdarzenia `push` i kliknięcia powiadomień. |
| `push/vapid-keys.json` (w katalogu stanu OpenClaw)    | Automatycznie wygenerowana para kluczy VAPID używana do podpisywania ładunków Web Push. |
| `push/web-push-subscriptions.json`                    | Utrwalone punkty końcowe subskrypcji przeglądarki.                |

Nadpisz parę kluczy VAPID przez zmienne środowiskowe w procesie Gateway, gdy chcesz przypiąć klucze (dla wdrożeń na wielu hostach, rotacji sekretów lub testów):

- `OPENCLAW_VAPID_PUBLIC_KEY`
- `OPENCLAW_VAPID_PRIVATE_KEY`
- `OPENCLAW_VAPID_SUBJECT` (domyślnie `https://openclaw.ai`)

Interfejs sterowania używa tych metod Gateway ograniczonych zakresem, aby rejestrować i testować subskrypcje przeglądarki:

- `push.web.vapidPublicKey` — pobiera aktywny klucz publiczny VAPID.
- `push.web.subscribe` — rejestruje `endpoint` oraz `keys.p256dh`/`keys.auth`.
- `push.web.unsubscribe` — usuwa zarejestrowany punkt końcowy.
- `push.web.test` — wysyła testowe powiadomienie do subskrypcji wywołującego.

<Note>
Web Push działa niezależnie od ścieżki przekaźnika APNS dla iOS (zobacz [Konfiguracja](/pl/gateway/configuration) dla powiadomień push wspieranych przez przekaźnik) oraz istniejącej metody `push.test`, które są przeznaczone dla natywnego parowania mobilnego.
</Note>

## Hostowane osadzenia

Wiadomości asystenta mogą renderować hostowane treści internetowe bezpośrednio za pomocą skrótu `[embed ...]`. Polityką piaskownicy iframe steruje `gateway.controlUi.embedSandbox`:

<Tabs>
  <Tab title="strict">
    Wyłącza wykonywanie skryptów wewnątrz hostowanych osadzeń.
  </Tab>
  <Tab title="scripts (default)">
    Zezwala na interaktywne osadzenia przy zachowaniu izolacji pochodzenia; to ustawienie domyślne i zwykle wystarcza dla samodzielnych gier/widgetów przeglądarkowych.
  </Tab>
  <Tab title="trusted">
    Dodaje `allow-same-origin` oprócz `allow-scripts` dla dokumentów z tej samej witryny, które celowo potrzebują silniejszych uprawnień.
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
Używaj `trusted` tylko wtedy, gdy osadzony dokument naprawdę potrzebuje zachowania tego samego pochodzenia. Dla większości gier generowanych przez agentów i interaktywnych płócien `scripts` jest bezpieczniejszym wyborem.
</Warning>

Bezwzględne zewnętrzne adresy URL osadzeń `http(s)` pozostają domyślnie zablokowane. Jeśli celowo chcesz, aby `[embed url="https://..."]` ładowało strony zewnętrzne, ustaw `gateway.controlUi.allowExternalEmbedUrls: true`.

## Szerokość wiadomości czatu

Zgrupowane wiadomości czatu używają czytelnej domyślnej szerokości maksymalnej. Wdrożenia na szerokich monitorach mogą ją nadpisać bez modyfikowania dołączonego CSS, ustawiając `gateway.controlUi.chatMessageMaxWidth`:

```json5
{
  gateway: {
    controlUi: {
      chatMessageMaxWidth: "min(1280px, 82%)",
    },
  },
}
```

Wartość jest walidowana, zanim trafi do przeglądarki. Obsługiwane wartości obejmują proste długości i procenty, takie jak `960px` lub `82%`, oraz ograniczone wyrażenia szerokości `min(...)`, `max(...)`, `clamp(...)`, `calc(...)` i `fit-content(...)`.

## Dostęp przez tailnet (zalecane)

<Tabs>
  <Tab title="Integrated Tailscale Serve (preferred)">
    Pozostaw Gateway na local loopback i pozwól Tailscale Serve pośredniczyć przez HTTPS:

    ```bash
    openclaw gateway --tailscale serve
    ```

    Otwórz:

    - `https://<magicdns>/` (lub skonfigurowany `gateway.controlUi.basePath`)

    Domyślnie żądania Serve interfejsu sterowania/WebSocket mogą uwierzytelniać się przez nagłówki tożsamości Tailscale (`tailscale-user-login`), gdy `gateway.auth.allowTailscale` ma wartość `true`. OpenClaw weryfikuje tożsamość, rozwiązując adres `x-forwarded-for` za pomocą `tailscale whois` i dopasowując go do nagłówka, oraz akceptuje je tylko wtedy, gdy żądanie trafia w local loopback z nagłówkami `x-forwarded-*` z Tailscale. Dla sesji operatora interfejsu sterowania z tożsamością urządzenia przeglądarki ta zweryfikowana ścieżka Serve pomija także rundę parowania urządzenia; przeglądarki bez urządzenia i połączenia w roli węzła nadal przechodzą zwykłe kontrole urządzenia. Ustaw `gateway.auth.allowTailscale: false`, jeśli chcesz wymagać jawnych poświadczeń wspólnego sekretu nawet dla ruchu Serve. Następnie użyj `gateway.auth.mode: "token"` lub `"password"`.

    Dla tej asynchronicznej ścieżki tożsamości Serve nieudane próby uwierzytelnienia dla tego samego adresu IP klienta i zakresu uwierzytelniania są serializowane przed zapisami limitu szybkości. Współbieżne błędne ponowienia z tej samej przeglądarki mogą więc pokazać `retry later` przy drugim żądaniu zamiast dwóch zwykłych niedopasowań ścigających się równolegle.

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

    Wklej pasujący wspólny sekret w ustawieniach interfejsu (wysyłany jako `connect.params.auth.token` lub `connect.params.auth.password`).

  </Tab>
</Tabs>

## Niezabezpieczony HTTP

Jeśli otworzysz panel przez zwykły HTTP (`http://<lan-ip>` lub `http://<tailscale-ip>`), przeglądarka działa w **niezabezpieczonym kontekście** i blokuje WebCrypto. Domyślnie OpenClaw **blokuje** połączenia interfejsu sterowania bez tożsamości urządzenia.

Udokumentowane wyjątki:

- zgodność niezabezpieczonego HTTP tylko dla localhost z `gateway.controlUi.allowInsecureAuth=true`
- pomyślne uwierzytelnienie operatora interfejsu sterowania przez `gateway.auth.mode: "trusted-proxy"`
- awaryjne `gateway.controlUi.dangerouslyDisableDeviceAuth=true`

**Zalecana poprawka:** użyj HTTPS (Tailscale Serve) albo otwórz interfejs lokalnie:

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

    - Pozwala sesjom interfejsu sterowania na localhost działać bez tożsamości urządzenia w niezabezpieczonych kontekstach HTTP.
    - Nie omija kontroli parowania.
    - Nie luzuje wymagań tożsamości urządzenia dla zdalnych (nie-localhost) połączeń.

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
    `dangerouslyDisableDeviceAuth` wyłącza kontrole tożsamości urządzenia interfejsu sterowania i jest poważnym obniżeniem poziomu bezpieczeństwa. Wycofaj tę zmianę szybko po użyciu awaryjnym.
    </Warning>

  </Accordion>
  <Accordion title="Trusted-proxy note">
    - Pomyślne uwierzytelnienie trusted-proxy może dopuścić sesje interfejsu sterowania **operatora** bez tożsamości urządzenia.
    - Nie obejmuje to sesji interfejsu sterowania w roli węzła.
    - Odwrotne proxy local loopback na tym samym hoście nadal nie spełniają wymagań uwierzytelniania trusted-proxy; zobacz [Uwierzytelnianie przez zaufane proxy](/pl/gateway/trusted-proxy-auth).

  </Accordion>
</AccordionGroup>

Zobacz [Tailscale](/pl/gateway/tailscale), aby uzyskać wskazówki konfiguracji HTTPS.

## Polityka bezpieczeństwa treści

Interfejs sterowania jest dostarczany z restrykcyjną polityką `img-src`: dozwolone są tylko zasoby **tego samego pochodzenia**, adresy URL `data:` i lokalnie wygenerowane adresy URL `blob:`. Zdalne adresy URL obrazów `http(s)` i względne względem protokołu są odrzucane przez przeglądarkę i nie powodują pobrań sieciowych.

Co to oznacza w praktyce:

- Awatary i obrazy serwowane pod ścieżkami względnymi (na przykład `/avatars/<id>`) nadal się renderują, w tym uwierzytelnione trasy awatarów, które interfejs pobiera i konwertuje na lokalne adresy URL `blob:`.
- Wbudowane adresy URL `data:image/...` nadal się renderują (przydatne dla ładunków w protokole).
- Lokalne adresy URL `blob:` utworzone przez interfejs sterowania nadal się renderują.
- Zdalne adresy URL awatarów emitowane przez metadane kanału są usuwane przez pomocniki awatarów interfejsu sterowania i zastępowane wbudowanym logo/odznaką, więc przejęty lub złośliwy kanał nie może wymusić dowolnych zdalnych pobrań obrazów z przeglądarki operatora.

Nie musisz nic zmieniać, aby uzyskać to zachowanie — jest zawsze włączone i niekonfigurowalne.

## Uwierzytelnianie trasy awatara

Gdy uwierzytelnianie gateway jest skonfigurowane, punkt końcowy awatara interfejsu sterowania wymaga tego samego tokenu gateway co reszta API:

- `GET /avatar/<agentId>` zwraca obraz awatara tylko uwierzytelnionym wywołującym. `GET /avatar/<agentId>?meta=1` zwraca metadane awatara według tej samej reguły.
- Nieuwierzytelnione żądania do dowolnej z tych tras są odrzucane (tak jak w siostrzanej trasie mediów asystenta). Zapobiega to ujawnianiu tożsamości agenta przez trasę awatara na hostach, które poza tym są chronione.
- Sam interfejs sterowania przekazuje token gateway jako nagłówek bearer podczas pobierania awatarów i używa uwierzytelnionych adresów URL blob, aby obraz nadal renderował się w panelach.

Jeśli wyłączysz uwierzytelnianie gateway (niezalecane na współdzielonych hostach), trasa awatara również stanie się nieuwierzytelniona, zgodnie z resztą gateway.

## Uwierzytelnianie trasy mediów asystenta

Gdy uwierzytelnianie gateway jest skonfigurowane, lokalne podglądy multimediów asystenta używają dwuetapowej trasy:

- `GET /__openclaw__/assistant-media?meta=1&source=<path>` wymaga zwykłego uwierzytelnienia operatora interfejsu sterowania. Przeglądarka wysyła token gateway jako nagłówek bearer podczas sprawdzania dostępności.
- Pomyślne odpowiedzi metadanych zawierają krótkotrwały `mediaTicket` ograniczony do dokładnie tej ścieżki źródłowej.
- Adresy URL obrazów, audio, wideo i dokumentów renderowanych przez przeglądarkę używają `mediaTicket=<ticket>` zamiast aktywnego tokenu lub hasła gateway. Bilet szybko wygasa i nie może autoryzować innego źródła.

Dzięki temu normalne renderowanie multimediów pozostaje zgodne z natywnymi elementami multimedialnymi przeglądarki bez umieszczania poświadczeń gateway wielokrotnego użytku w widocznych adresach URL multimediów.

## Budowanie interfejsu

Gateway serwuje pliki statyczne z `dist/control-ui`. Zbuduj je za pomocą:

```bash
pnpm ui:build
```

Opcjonalna bezwzględna baza (gdy chcesz stałych adresów URL zasobów):

```bash
OPENCLAW_CONTROL_UI_BASE_PATH=/openclaw/ pnpm ui:build
```

Do lokalnego programowania (osobny serwer deweloperski):

```bash
pnpm ui:dev
```

Następnie skieruj interfejs na adres URL WS swojego Gateway (np. `ws://127.0.0.1:18789`).

## Pusta strona interfejsu sterowania

Jeśli przeglądarka ładuje pusty panel, a DevTools nie pokazuje użytecznego błędu, rozszerzenie lub wczesny skrypt treści mógł uniemożliwić ocenę aplikacji modułu JavaScript. Strona statyczna zawiera zwykły panel odzyskiwania HTML, który pojawia się, gdy `<openclaw-app>` nie zostanie zarejestrowany po uruchomieniu.

Użyj akcji **Spróbuj ponownie** w panelu po zmianie środowiska przeglądarki albo przeładuj ręcznie po tych kontrolach:

- Wyłącz rozszerzenia, które wstrzykują się na wszystkie strony, zwłaszcza rozszerzenia ze skryptami treści `<all_urls>`.
- Spróbuj okna prywatnego, czystego profilu przeglądarki albo innej przeglądarki.
- Pozostaw Gateway uruchomiony i zweryfikuj ten sam adres URL panelu po zmianie przeglądarki.

## Debugowanie/testowanie: serwer deweloperski + zdalny Gateway

Interfejs sterowania to pliki statyczne; cel WebSocket jest konfigurowalny i może różnić się od pochodzenia HTTP. Jest to przydatne, gdy chcesz uruchomić lokalnie serwer deweloperski Vite, ale Gateway działa gdzie indziej.

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
  <Accordion title="Uwagi">
    - `gatewayUrl` jest przechowywany w localStorage po załadowaniu i usuwany z URL.
    - Jeśli przekazujesz pełny punkt końcowy `ws://` lub `wss://` przez `gatewayUrl`, zakoduj wartość `gatewayUrl` w URL, aby przeglądarka poprawnie parsowała ciąg zapytania.
    - `token` należy przekazywać przez fragment URL (`#token=...`), gdy tylko jest to możliwe. Fragmenty nie są wysyłane na serwer, co zapobiega wyciekowi przez dzienniki żądań i Referer. Starsze parametry zapytania `?token=` są nadal importowane jednorazowo dla zgodności, ale tylko jako mechanizm awaryjny, i są usuwane natychmiast po uruchomieniu.
    - `password` jest przechowywany tylko w pamięci.
    - Gdy ustawiono `gatewayUrl`, UI nie wraca do poświadczeń z konfiguracji ani środowiska. Podaj jawnie `token` (lub `password`). Brak jawnych poświadczeń jest błędem.
    - Używaj `wss://`, gdy Gateway znajduje się za TLS (Tailscale Serve, proxy HTTPS itd.).
    - `gatewayUrl` jest akceptowany tylko w oknie najwyższego poziomu (nie osadzonym), aby zapobiec clickjackingowi.
    - Publiczne wdrożenia Control UI poza loopback muszą jawnie ustawić `gateway.controlUi.allowedOrigins` (pełne źródła). Prywatne ładowania z tej samej domeny w LAN/Tailnet z loopback, RFC1918/link-local, `.local`, `.ts.net` lub hostów Tailscale CGNAT są akceptowane bez włączania mechanizmu awaryjnego nagłówka Host.
    - Uruchomienie Gateway może zainicjować lokalne źródła, takie jak `http://localhost:<port>` i `http://127.0.0.1:<port>`, na podstawie efektywnego powiązania i portu środowiska uruchomieniowego, ale zdalne źródła przeglądarki nadal wymagają jawnych wpisów.
    - Nie używaj `gateway.controlUi.allowedOrigins: ["*"]` poza ściśle kontrolowanym testowaniem lokalnym. Oznacza to zezwolenie na dowolne źródło przeglądarki, a nie „dopasuj dowolny host, którego używam”.
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
- [Kontrole stanu](/pl/gateway/health) — monitorowanie stanu Gateway
- [TUI](/pl/web/tui) — terminalowy interfejs użytkownika
- [WebChat](/pl/web/webchat) — interfejs czatu w przeglądarce
