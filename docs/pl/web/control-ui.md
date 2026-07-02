---
read_when:
    - Chcesz obsługiwać Gateway z poziomu przeglądarki
    - Chcesz mieć dostęp do Tailnet bez tuneli SSH
sidebarTitle: Control UI
summary: Interfejs sterowania oparty na przeglądarce dla Gateway (czat, aktywność, węzły, konfiguracja)
title: Interfejs sterowania
x-i18n:
    generated_at: "2026-07-02T01:18:02Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 643249e6857cc1a32302f5139fcf89d46e01127f741f31efd36db4a6c60ef7b7
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

<Note>
W natywnych powiązaniach LAN w Windows Zapora systemu Windows lub zasady grupy zarządzane przez organizację nadal mogą blokować ogłaszany adres URL LAN, nawet gdy `127.0.0.1` działa na hoście Gateway. Uruchom `openclaw gateway status --deep` na hoście Windows; zgłasza on prawdopodobnie zablokowane porty, niezgodności profili i lokalne reguły zapory, które zasady mogą ignorować.
</Note>

Uwierzytelnianie jest przekazywane podczas uzgadniania WebSocket przez:

- `connect.params.auth.token`
- `connect.params.auth.password`
- nagłówki tożsamości Tailscale Serve, gdy `gateway.auth.allowTailscale: true`
- nagłówki tożsamości zaufanego proxy, gdy `gateway.auth.mode: "trusted-proxy"`

Panel ustawień dashboardu przechowuje token dla bieżącej sesji karty przeglądarki i wybranego adresu URL gateway; hasła nie są utrwalane. Onboarding zwykle generuje token gateway do uwierzytelniania współdzielonym sekretem przy pierwszym połączeniu, ale uwierzytelnianie hasłem również działa, gdy `gateway.auth.mode` ma wartość `"password"`.

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

Jeśli przeglądarka ponawia parowanie ze zmienionymi szczegółami uwierzytelniania (rola/zakresy/klucz publiczny), poprzednie oczekujące żądanie zostaje zastąpione i tworzony jest nowy `requestId`. Przed zatwierdzeniem ponownie uruchom `openclaw devices list`.

Jeśli przeglądarka jest już sparowana i zmienisz jej dostęp z odczytu na zapis/administrację, jest to traktowane jako podniesienie zatwierdzenia, a nie ciche ponowne połączenie. OpenClaw utrzymuje stare zatwierdzenie jako aktywne, blokuje szersze ponowne połączenie i prosi o jawne zatwierdzenie nowego zestawu zakresów.

Po zatwierdzeniu urządzenie zostaje zapamiętane i nie będzie wymagać ponownego zatwierdzenia, chyba że odwołasz je za pomocą `openclaw devices revoke --device <id> --role <role>`. Zobacz [CLI urządzeń](/pl/cli/devices), aby poznać rotację i odwoływanie tokenów.

Agenty Paperclip łączące się przez adapter `openclaw_gateway` używają tego samego przepływu zatwierdzania przy pierwszym uruchomieniu. Po pierwszej próbie połączenia uruchom `openclaw devices approve --latest`, aby podejrzeć oczekujące żądanie, a następnie ponownie uruchom wydrukowane polecenie `openclaw devices approve <requestId>`, aby je zatwierdzić. Dla zdalnego gateway przekaż jawne wartości `--url` i `--token`. Aby zatwierdzenia pozostały stabilne po restartach, skonfiguruj trwały `adapterConfig.devicePrivateKeyPem` w Paperclip zamiast pozwalać mu generować nową efemeryczną tożsamość urządzenia przy każdym uruchomieniu.

<Note>
- Bezpośrednie połączenia przeglądarki przez local loopback (`127.0.0.1` / `localhost`) są zatwierdzane automatycznie.
- Tailscale Serve może pominąć rundę parowania dla sesji operatorskich Control UI, gdy `gateway.auth.allowTailscale: true`, tożsamość Tailscale zostanie zweryfikowana, a przeglądarka przedstawi swoją tożsamość urządzenia.
- Bezpośrednie powiązania Tailnet, połączenia przeglądarki z LAN i profile przeglądarki bez tożsamości urządzenia nadal wymagają jawnego zatwierdzenia.
- Każdy profil przeglądarki generuje unikatowy identyfikator urządzenia, więc zmiana przeglądarki lub wyczyszczenie danych przeglądarki będzie wymagać ponownego parowania.

</Note>

## Tożsamość osobista (lokalna dla przeglądarki)

Control UI obsługuje osobistą tożsamość dla każdej przeglądarki (nazwę wyświetlaną i awatar) dołączaną do wiadomości wychodzących w celu przypisania autorstwa we współdzielonych sesjach. Przechowywana jest w pamięci przeglądarki, ograniczona do bieżącego profilu przeglądarki i nie jest synchronizowana z innymi urządzeniami ani utrwalana po stronie serwera poza zwykłymi metadanymi autorstwa transkrypcji w wiadomościach, które faktycznie wysyłasz. Wyczyszczenie danych witryny lub zmiana przeglądarki resetuje ją do pustej wartości.

Ten sam lokalny dla przeglądarki wzorzec dotyczy nadpisania awatara asystenta. Przesłane awatary asystenta nakładają tożsamość rozwiązaną przez gateway tylko w lokalnej przeglądarce i nigdy nie są przesyłane w obie strony przez `config.patch`. Współdzielone pole konfiguracji `ui.assistant.avatar` nadal jest dostępne dla klientów innych niż UI, którzy zapisują to pole bezpośrednio (takich jak skryptowane gatewaye lub niestandardowe dashboardy).

## Punkt końcowy konfiguracji runtime

Control UI pobiera swoje ustawienia runtime z `/control-ui-config.json`, rozwiązywanego względem ścieżki bazowej Control UI gateway (na przykład `/__openclaw__/control-ui-config.json`, gdy UI jest serwowany pod `/__openclaw__/`). Ten punkt końcowy jest chroniony tym samym uwierzytelnianiem gateway co reszta powierzchni HTTP: nieuwierzytelnione przeglądarki nie mogą go pobrać, a udane pobranie wymaga już prawidłowego tokenu/hasła gateway, tożsamości Tailscale Serve albo tożsamości zaufanego proxy.

## Obsługa języków

Control UI może lokalizować się przy pierwszym ładowaniu na podstawie ustawień regionalnych przeglądarki. Aby później to nadpisać, otwórz **Przegląd -> Dostęp do Gateway -> Język**. Selektor ustawień regionalnych znajduje się na karcie Dostęp do Gateway, a nie w sekcji Wygląd.

- Obsługiwane ustawienia regionalne: `en`, `zh-CN`, `zh-TW`, `pt-BR`, `de`, `es`, `ja-JP`, `ko`, `fr`, `ar`, `it`, `tr`, `uk`, `id`, `pl`, `th`, `vi`, `nl`, `fa`
- Tłumaczenia inne niż angielskie są leniwie ładowane w przeglądarce.
- Wybrane ustawienie regionalne jest zapisywane w pamięci przeglądarki i ponownie używane podczas kolejnych wizyt.
- Brakujące klucze tłumaczeń wracają do angielskiego.

Tłumaczenia dokumentacji są generowane dla tego samego zestawu ustawień regionalnych innych niż angielskie, ale wbudowany w witrynę dokumentacji selektor języka Mintlify jest ograniczony do kodów ustawień regionalnych akceptowanych przez Mintlify. Dokumentacja w języku tajskim (`th`) i perskim (`fa`) nadal jest generowana w repo publikacji; może nie pojawiać się w tym selektorze, dopóki Mintlify nie będzie obsługiwać tych kodów.

## Motywy wyglądu

Panel Wygląd zachowuje wbudowane motywy Claw, Knot i Dash oraz jedno lokalne dla przeglądarki miejsce importu tweakcn. Aby zaimportować motyw, otwórz [edytor tweakcn](https://tweakcn.com/editor/theme), wybierz lub utwórz motyw, kliknij **Udostępnij** i wklej skopiowany link motywu do sekcji Wygląd. Importer akceptuje także adresy URL rejestru `https://tweakcn.com/r/themes/<id>`, adresy URL edytora takie jak `https://tweakcn.com/editor/theme?theme=amethyst-haze`, względne ścieżki `/themes/<id>`, surowe identyfikatory motywów oraz domyślne nazwy motywów, takie jak `amethyst-haze`.

Wygląd obejmuje także lokalne dla przeglądarki ustawienie rozmiaru tekstu. Ustawienie jest przechowywane razem z pozostałymi preferencjami Control UI, dotyczy tekstu czatu, tekstu kompozytora, kart narzędzi i pasków bocznych czatu oraz utrzymuje pola tekstowe na poziomie co najmniej 16px, aby mobilne Safari nie powiększało automatycznie widoku po ustawieniu fokusu.

Zaimportowane motywy są przechowywane tylko w bieżącym profilu przeglądarki. Nie są zapisywane w konfiguracji gateway i nie synchronizują się między urządzeniami. Zastąpienie zaimportowanego motywu aktualizuje jedno lokalne miejsce; wyczyszczenie go przełącza aktywny motyw z powrotem na Claw, jeśli zaimportowany motyw był wybrany.

## Co potrafi (dzisiaj)

<AccordionGroup>
  <Accordion title="Czat i rozmowa">
    - Czatuj z modelem przez Gateway WS (`chat.history`, `chat.send`, `chat.abort`, `chat.inject`).
    - Odświeżenia historii czatu żądają ograniczonego ostatniego okna z limitami tekstu dla każdej wiadomości, aby duże sesje nie zmuszały przeglądarki do renderowania pełnego ładunku transkrypcji, zanim czat stanie się użyteczny.
    - Rozmawiaj przez przeglądarkowe sesje realtime. OpenAI używa bezpośredniego WebRTC, Google Live używa ograniczonego jednorazowego tokenu przeglądarki przez WebSocket, a backendowe Pluginy głosu realtime używają transportu przekaźnikowego Gateway. Sesje dostawcy należące do klienta zaczynają się od `talk.client.create`; sesje przekaźnikowe Gateway zaczynają się od `talk.session.create`. Przekaźnik przechowuje poświadczenia dostawcy w Gateway, podczas gdy przeglądarka strumieniuje PCM z mikrofonu przez `talk.session.appendAudio`, przekazuje wywołania narzędzi dostawcy `openclaw_agent_consult` przez `talk.client.toolCall` do zasad Gateway i większego skonfigurowanego modelu OpenClaw oraz kieruje sterowanie głosem aktywnego przebiegu przez `talk.client.steer` albo `talk.session.steer`.
    - Strumieniuj wywołania narzędzi i karty wyników narzędzi na żywo w czacie (zdarzenia agenta).
    - Karta aktywności z lokalnymi dla przeglądarki, priorytetowo redagowanymi podsumowaniami aktywności narzędzi na żywo z istniejącego dostarczania zdarzeń `session.tool` / narzędzi.

  </Accordion>
  <Accordion title="Kanały, instancje, sesje, sny">
    - Kanały: status kanałów wbudowanych oraz z bundled/zewnętrznych Pluginów, logowanie QR i konfiguracja dla każdego kanału (`channels.status`, `web.login.*`, `config.patch`).
    - Odświeżenia sond kanałów utrzymują poprzedni zrzut widoczny podczas kończenia wolnych sprawdzeń dostawcy, a częściowe zrzuty są oznaczane, gdy sonda lub audyt przekroczy budżet UI.
    - Instancje: lista obecności + odświeżanie (`system-presence`).
    - Sesje: domyślnie wyświetlają sesje skonfigurowanych agentów, wracają ze starych kluczy sesji nieskonfigurowanych agentów i stosują nadpisania modelu/myślenia/trybu szybkiego/trybu szczegółowego/śledzenia/rozumowania dla każdej sesji (`sessions.list`, `sessions.patch`).
    - Sny: status Dreaming, przełącznik włącz/wyłącz i czytnik Dziennika snów (`doctor.memory.status`, `doctor.memory.dreamDiary`, `config.patch`).

  </Accordion>
  <Accordion title="Cron, Skills, węzły, zatwierdzenia exec">
    - Zadania Cron: wyświetlanie/dodawanie/edytowanie/uruchamianie/włączanie/wyłączanie + historia uruchomień (`cron.*`).
    - Skills: status, włączanie/wyłączanie, instalowanie, aktualizacje kluczy API (`skills.*`).
    - Węzły: lista + limity możliwości (`node.list`).
    - Zatwierdzenia exec: edytuj listy dozwolone gateway lub węzłów + zasady pytania dla `exec host=gateway/node` (`exec.approvals.*`).

  </Accordion>
  <Accordion title="Konfiguracja">
    - Wyświetl/edytuj `~/.openclaw/openclaw.json` (`config.get`, `config.set`).
    - MCP ma dedykowaną stronę ustawień dla skonfigurowanych serwerów, włączenia, podsumowań OAuth/filtrów/równoległości, typowych poleceń operatorskich i edytora konfiguracji `mcp` o ograniczonym zakresie.
    - Zastosuj + uruchom ponownie z walidacją (`config.apply`) i wybudź ostatnią aktywną sesję.
    - Zapisy obejmują strażnika bazowego hasha, aby zapobiec nadpisaniu równoległych edycji.
    - Zapisy (`config.set`/`config.apply`/`config.patch`) wstępnie sprawdzają aktywne rozwiązywanie SecretRef dla referencji w przesłanym ładunku konfiguracji; nierozwiązane aktywne przesłane referencje są odrzucane przed zapisem.
    - Zapisy formularzy odrzucają nieaktualne zredagowane symbole zastępcze, których nie można przywrócić z zapisanej konfiguracji, zachowując zredagowane wartości, które nadal mapują się na zapisane sekrety.
    - Renderowanie schematu i formularza (`config.schema` / `config.schema.lookup`, w tym pola `title` / `description`, dopasowane wskazówki UI, natychmiastowe podsumowania dzieci, metadane dokumentacji na zagnieżdżonych węzłach obiektu/wieloznacznika/tablicy/kompozycji oraz schematy Pluginów i kanałów, gdy są dostępne); edytor surowego JSON jest dostępny tylko wtedy, gdy zrzut ma bezpieczny surowy obieg w obie strony.
    - Jeśli zrzut nie może bezpiecznie przejść surowego obiegu tekstu w obie strony, Control UI wymusza tryb formularza i wyłącza tryb surowy dla tego zrzutu.
    - Edytor surowego JSON "Resetuj do zapisanej" zachowuje kształt utworzony w surowej postaci (formatowanie, komentarze, układ `$include`) zamiast ponownie renderować spłaszczony zrzut, dzięki czemu zewnętrzne edycje przetrwają reset, gdy zrzut może bezpiecznie przejść obieg w obie strony.
    - Strukturalne wartości obiektów SecretRef są renderowane jako tylko do odczytu w tekstowych polach formularza, aby zapobiec przypadkowemu uszkodzeniu przez konwersję obiektu na ciąg znaków.

  </Accordion>
  <Accordion title="Debugowanie, logi, aktualizacja">
    - Debugowanie: zrzuty statusu/kondycji/modeli + dziennik zdarzeń + ręczne wywołania RPC (`status`, `health`, `models.list`).
    - Dziennik zdarzeń obejmuje czasy odświeżania/RPC Control UI, czasy wolnego renderowania czatu/konfiguracji oraz wpisy responsywności przeglądarki dla długich klatek animacji lub długich zadań, gdy przeglądarka udostępnia te typy wpisów PerformanceObserver.
    - Logi: aktywny tail logów plikowych gateway z filtrem/eksportem (`logs.tail`).
    - Aktualizacja: uruchom aktualizację pakietu/git + restart (`update.run`) z raportem restartu, a następnie odpytuj `update.status` po ponownym połączeniu, aby zweryfikować działającą wersję gateway.

  </Accordion>
  <Accordion title="Uwagi panelu zadań Cron">
    - W przypadku izolowanych zadań dostarczanie domyślnie ogłasza podsumowanie. Możesz przełączyć na brak, jeśli chcesz uruchomienia wyłącznie wewnętrzne.
    - Pola kanału/celu pojawiają się, gdy wybrano ogłaszanie.
    - Tryb Webhook używa `delivery.mode = "webhook"` z `delivery.to` ustawionym na prawidłowy URL Webhook HTTP(S).
    - W przypadku zadań sesji głównej dostępne są tryby dostarczania Webhook i brak.
    - Zaawansowane kontrolki edycji obejmują usuwanie po uruchomieniu, czyszczenie nadpisania agenta, opcje dokładnego/rozłożonego Cron, nadpisania modelu/myślenia agenta oraz przełączniki dostarczania w trybie najlepszych starań.
    - Walidacja formularza jest wbudowana, z błędami na poziomie pól; nieprawidłowe wartości wyłączają przycisk zapisu do czasu ich naprawienia.
    - Ustaw `cron.webhookToken`, aby wysłać dedykowany token bearer; jeśli zostanie pominięty, Webhook jest wysyłany bez nagłówka uwierzytelniania.
    - Przestarzały mechanizm awaryjny: uruchom `openclaw doctor --fix`, aby zmigrować zapisane starsze zadania z `notify: true` z `cron.webhook` do jawnego Webhook dla zadania albo dostarczania po ukończeniu.

  </Accordion>
</AccordionGroup>

## Strona MCP

Dedykowana strona MCP to widok operatorski dla serwerów MCP zarządzanych przez OpenClaw w `mcp.servers`. Sama nie uruchamia transportów MCP; używaj jej do sprawdzania i edycji zapisanej konfiguracji, a następnie użyj `openclaw mcp doctor --probe`, gdy potrzebujesz dowodu działania serwera na żywo.

Typowy przepływ pracy:

1. Otwórz **MCP** z paska bocznego.
2. Sprawdź karty podsumowania pod kątem łącznej liczby serwerów, serwerów włączonych, OAuth i przefiltrowanych.
3. Przejrzyj każdy wiersz serwera pod kątem transportu, włączenia, uwierzytelniania, filtrów, limitów czasu i podpowiedzi poleceń.
4. Przełącz włączenie, gdy serwer ma pozostać skonfigurowany, ale nie ma być uwzględniany w wykrywaniu w czasie działania.
5. Edytuj zakresową sekcję konfiguracji `mcp` dla definicji serwerów, nagłówków, ścieżek TLS/mTLS, metadanych OAuth, filtrów narzędzi i metadanych projekcji Codex.
6. Użyj **Zapisz**, aby zapisać konfigurację, albo **Zapisz i opublikuj**, gdy działający Gateway ma zastosować zmienioną konfigurację.
7. Uruchom `openclaw mcp status --verbose`, `openclaw mcp doctor --probe` lub `openclaw mcp reload` z terminala, gdy edytowany proces wymaga diagnostyki statycznej, dowodu na żywo lub usunięcia buforowanego środowiska wykonawczego.

Strona redaguje wartości przypominające URL i zawierające poświadczenia przed renderowaniem oraz ujmuje nazwy serwerów w cudzysłowy w fragmentach poleceń, aby skopiowane polecenia nadal działały ze spacjami lub metaznakami powłoki. Pełna dokumentacja CLI i konfiguracji znajduje się w [MCP](/pl/cli/mcp).

## Karta Activity

Karta Activity to efemeryczny, lokalny dla przeglądarki obserwator aktywności narzędzi na żywo. Jest wyprowadzana z tego samego strumienia zdarzeń Gateway `session.tool` / narzędzi, który zasila karty narzędzi w Chat; nie dodaje kolejnej rodziny zdarzeń Gateway, punktu końcowego, trwałego magazynu aktywności, strumienia metryk ani zewnętrznego strumienia obserwatora.

Wpisy Activity przechowują tylko oczyszczone podsumowania oraz zredagowane, obcięte podglądy wyjścia. Wartości argumentów narzędzi nie są przechowywane w stanie Activity; UI pokazuje, że argumenty są ukryte, i zapisuje tylko liczbę pól argumentów. Lista w pamięci podąża za bieżącą kartą przeglądarki, przetrwa nawigację w Control UI i resetuje się po przeładowaniu strony, zmianie sesji lub użyciu **Wyczyść**.

## Zachowanie Chat

<AccordionGroup>
  <Accordion title="Semantyka wysyłania i historii">
    - `chat.send` jest **nieblokujące**: natychmiast potwierdza `{ runId, status: "started" }`, a odpowiedź jest przesyłana strumieniowo przez zdarzenia `chat`. Zaufani klienci Control UI mogą też otrzymywać opcjonalne metadane czasu ACK do diagnostyki lokalnej.
    - Przesyłanie plików w Chat akceptuje obrazy oraz pliki inne niż wideo. Obrazy zachowują natywną ścieżkę obrazu; inne pliki są przechowywane jako zarządzane media i pokazywane w historii jako linki załączników.
    - Ponowne wysłanie z tym samym `idempotencyKey` zwraca `{ status: "in_flight" }` podczas działania oraz `{ status: "ok" }` po ukończeniu.
    - Odpowiedzi `chat.history` mają ograniczony rozmiar dla bezpieczeństwa UI. Gdy wpisy transkrypcji są zbyt duże, Gateway może obcinać długie pola tekstowe, pomijać ciężkie bloki metadanych i zastępować zbyt duże wiadomości symbolem zastępczym (`[chat.history omitted: message too large]`).
    - Gdy widoczna wiadomość asystenta została obcięta w `chat.history`, boczny czytnik może pobrać pełny, znormalizowany do wyświetlania wpis transkrypcji na żądanie przez `chat.message.get`, używając `sessionKey`, aktywnego `agentId` w razie potrzeby oraz `messageId` transkrypcji. Jeśli Gateway nadal nie może zwrócić więcej, czytnik pokazuje jawny stan niedostępności zamiast po cichu powtarzać obcięty podgląd.
    - Obrazy asystenta/wygenerowane są utrwalane jako zarządzane odwołania do mediów i serwowane z powrotem przez uwierzytelnione URL-e mediów Gateway, dzięki czemu przeładowania nie zależą od pozostawania surowych ładunków obrazów base64 w odpowiedzi historii czatu.
    - Podczas renderowania `chat.history` Control UI usuwa z widocznego tekstu asystenta wyłącznie prezentacyjne znaczniki dyrektyw inline (na przykład `[[reply_to_*]]` i `[[audio_as_voice]]`), tekstowe ładunki XML wywołań narzędzi (w tym `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` oraz obcięte bloki wywołań narzędzi), a także ujawnione tokeny sterujące modelu ASCII/pełnej szerokości, i pomija wpisy asystenta, których cały widoczny tekst to wyłącznie dokładny cichy token `NO_REPLY` / `no_reply` albo token potwierdzenia Heartbeat `HEARTBEAT_OK`.
    - Podczas aktywnego wysyłania i końcowego odświeżenia historii widok czatu utrzymuje widoczne lokalne optymistyczne wiadomości użytkownika/asystenta, jeśli `chat.history` na krótko zwróci starszy zrzut; kanoniczna transkrypcja zastępuje te lokalne wiadomości, gdy historia Gateway nadrobi zaległość.
    - Zdarzenia `chat` na żywo są stanem dostarczania, natomiast `chat.history` jest odbudowywane z trwałej transkrypcji sesji. Po zdarzeniach końcowych narzędzi Control UI ponownie ładuje historię i scala tylko mały optymistyczny ogon; granica transkrypcji jest udokumentowana w [WebChat](/pl/web/webchat).
    - `chat.inject` dodaje notatkę asystenta do transkrypcji sesji i rozgłasza zdarzenie `chat` dla aktualizacji wyłącznie w UI (bez uruchomienia agenta, bez dostarczania kanałem).
    - Nagłówek czatu pokazuje filtr agenta przed wybierakiem sesji, a wybierak sesji jest ograniczony do wybranego agenta. Przełączanie agentów pokazuje tylko sesje powiązane z tym agentem i wraca do głównej sesji tego agenta, gdy nie ma on jeszcze zapisanych sesji pulpitu.
    - Na szerokościach desktopowych kontrolki czatu pozostają w jednym kompaktowym wierszu i zwijają się podczas przewijania transkrypcji w dół; przewijanie w górę, powrót na początek lub dotarcie na dół przywraca kontrolki.
    - Kolejne zduplikowane wiadomości wyłącznie tekstowe są renderowane jako jeden dymek z odznaką liczby. Wiadomości zawierające obrazy, załączniki, wyjście narzędzi lub podglądy kanwy pozostają niezwinięte.
    - Wybieraki modelu i myślenia w nagłówku czatu natychmiast aktualizują aktywną sesję przez `sessions.patch`; są to trwałe nadpisania sesji, a nie opcje wysyłki tylko na jedną turę.
    - Jeśli wyślesz wiadomość, gdy zmiana wybieraka modelu dla tej samej sesji nadal się zapisuje, kompozytor czeka na tę poprawkę sesji przed wywołaniem `chat.send`, aby wysyłka użyła wybranego modelu.
    - Wpisanie `/new` w Control UI tworzy i przełącza na tę samą świeżą sesję pulpitu co New Chat, z wyjątkiem sytuacji, gdy skonfigurowano `session.dmScope: "main"` i bieżącym rodzicem jest główna sesja agenta; wtedy resetuje główną sesję w miejscu. Wpisanie `/reset` zachowuje jawny reset w miejscu Gateway dla bieżącej sesji.
    - Wybierak modelu czatu żąda skonfigurowanego widoku modeli Gateway. Jeśli obecne jest `agents.defaults.models`, ta lista dozwolonych wartości steruje wybierakiem, w tym wpisami `provider/*`, które utrzymują dynamiczne katalogi o zakresie dostawcy. W przeciwnym razie wybierak pokazuje jawne wpisy `models.providers.*.models` oraz dostawców z użytecznym uwierzytelnianiem. Pełny katalog pozostaje dostępny przez debugowe RPC `models.list` z `view: "all"`.
    - Gdy świeże raporty użycia sesji Gateway zawierają bieżące tokeny kontekstu, obszar kompozytora czatu pokazuje kompaktowy wskaźnik użycia kontekstu. Przełącza się na styl ostrzegawczy przy wysokiej presji kontekstu i, na zalecanych poziomach Compaction, pokazuje kompaktowy przycisk uruchamiający normalną ścieżkę Compaction sesji. Nieaktualne zrzuty tokenów są ukryte, dopóki Gateway ponownie nie zgłosi świeżego użycia.

  </Accordion>
  <Accordion title="Tryb Talk (czas rzeczywisty w przeglądarce)">
    Tryb Talk używa zarejestrowanego dostawcy głosu w czasie rzeczywistym. Skonfiguruj OpenAI z `talk.realtime.provider: "openai"` oraz profilem uwierzytelniania kluczem API `openai`, `talk.realtime.providers.openai.apiKey` albo `OPENAI_API_KEY`; profile OAuth OpenAI nie konfigurują głosu Realtime. Skonfiguruj Google z `talk.realtime.provider: "google"` oraz `talk.realtime.providers.google.apiKey`. Przeglądarka nigdy nie otrzymuje standardowego klucza API dostawcy. OpenAI otrzymuje efemeryczny sekret klienta Realtime dla WebRTC. Google Live otrzymuje jednorazowy ograniczony token uwierzytelniania Live API dla sesji WebSocket w przeglądarce, z instrukcjami i deklaracjami narzędzi zablokowanymi w tokenie przez Gateway. Dostawcy, którzy udostępniają wyłącznie backendowy most czasu rzeczywistego, działają przez transport przekaźnika Gateway, więc poświadczenia i gniazda dostawcy pozostają po stronie serwera, a audio przeglądarki przechodzi przez uwierzytelnione RPC Gateway. Prompt sesji Realtime jest składany przez Gateway; `talk.client.create` nie akceptuje nadpisań instrukcji podanych przez wywołującego.

    Kompozytor Chat zawiera przycisk opcji Talk obok przycisku start/stop Talk. Opcje mają zastosowanie do następnej sesji Talk i mogą nadpisać dostawcę, transport, model, głos, wysiłek rozumowania, próg VAD, czas ciszy oraz dopełnienie prefiksu. Gdy opcja jest pusta, Gateway używa skonfigurowanych wartości domyślnych, jeśli są dostępne, albo wartości domyślnej dostawcy. Wybranie przekaźnika Gateway wymusza backendową ścieżkę przekaźnika; wybranie WebRTC utrzymuje sesję po stronie klienta i kończy się błędem, zamiast po cichu wracać do przekaźnika, jeśli dostawca nie może utworzyć sesji przeglądarkowej.

    W kompozytorze Chat kontrolka Talk to przycisk fal obok przycisku dyktowania mikrofonem. Gdy Talk startuje, wiersz statusu kompozytora pokazuje `Connecting Talk...`, następnie `Talk live`, gdy audio jest połączone, albo `Asking OpenClaw...`, gdy wywołanie narzędzia czasu rzeczywistego konsultuje skonfigurowany większy model przez `talk.client.toolCall`.

    Smoke test na żywo dla maintainerów: `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts` weryfikuje most backendowy WebSocket OpenAI, wymianę SDP WebRTC OpenAI w przeglądarce, konfigurację przeglądarkowego WebSocket Google Live z ograniczonym tokenem oraz adapter przeglądarkowy przekaźnika Gateway z fałszywym nośnikiem mikrofonu. Polecenie wypisuje tylko status dostawcy i nie loguje sekretów.

  </Accordion>
  <Accordion title="Zatrzymanie i przerwanie">
    - Kliknij **Zatrzymaj** (wywołuje `chat.abort`).
    - Gdy uruchomienie jest aktywne, zwykłe dalsze wiadomości trafiają do kolejki. Kliknij **Steruj** przy wiadomości w kolejce, aby wstrzyknąć tę dalszą wiadomość do działającej tury.
    - Wpisz `/stop` (albo samodzielne frazy przerwania, takie jak `stop`, `stop action`, `stop run`, `stop openclaw`, `please stop`), aby przerwać poza pasmem.
    - `chat.abort` obsługuje `{ sessionKey }` (bez `runId`), aby przerwać wszystkie aktywne uruchomienia dla tej sesji.

  </Accordion>
  <Accordion title="Zachowanie części po przerwaniu">
    - Gdy uruchomienie zostanie przerwane, częściowy tekst asystenta może nadal być pokazywany w UI.
    - Gateway utrwala przerwany częściowy tekst asystenta w historii transkrypcji, gdy istnieje zbuforowane wyjście.
    - Utrwalone wpisy zawierają metadane przerwania, aby konsumenci transkrypcji mogli odróżnić części po przerwaniu od normalnego wyjścia ukończenia.

  </Accordion>
</AccordionGroup>

## Instalacja PWA i Web Push

Control UI dostarcza `manifest.webmanifest` oraz service worker, więc nowoczesne przeglądarki mogą zainstalować je jako samodzielną PWA. Web Push pozwala Gateway wybudzać zainstalowaną PWA powiadomieniami nawet wtedy, gdy karta lub okno przeglądarki nie jest otwarte.

Jeśli strona pokazuje **Niezgodność protokołu** zaraz po aktualizacji OpenClaw, najpierw otwórz pulpit ponownie za pomocą `openclaw dashboard` i wykonaj twarde odświeżenie strony. Jeśli nadal się nie uda, wyczyść dane witryny dla źródła pulpitu albo przetestuj w prywatnym oknie przeglądarki; stara karta lub pamięć podręczna service workera przeglądarki może nadal uruchamiać pakiet Control UI sprzed aktualizacji względem nowszego Gateway.

| Powierzchnia                                         | Co robi                                                            |
| ----------------------------------------------------- | ------------------------------------------------------------------ |
| `ui/public/manifest.webmanifest`                      | Manifest PWA. Przeglądarki oferują „Zainstaluj aplikację”, gdy stanie się dostępna. |
| `ui/public/sw.js`                                     | Service worker obsługujący zdarzenia `push` i kliknięcia powiadomień. |
| `push/vapid-keys.json` (w katalogu stanu OpenClaw)    | Automatycznie wygenerowana para kluczy VAPID używana do podpisywania ładunków Web Push. |
| `push/web-push-subscriptions.json`                    | Utrwalone punkty końcowe subskrypcji przeglądarek.                 |

Nadpisz parę kluczy VAPID przez zmienne środowiskowe w procesie Gateway, gdy chcesz przypiąć klucze (dla wdrożeń na wielu hostach, rotacji sekretów lub testów):

- `OPENCLAW_VAPID_PUBLIC_KEY`
- `OPENCLAW_VAPID_PRIVATE_KEY`
- `OPENCLAW_VAPID_SUBJECT` (domyślnie `https://openclaw.ai`)

Control UI używa tych metod Gateway ograniczonych zakresem do rejestrowania i testowania subskrypcji przeglądarki:

- `push.web.vapidPublicKey` — pobiera aktywny klucz publiczny VAPID.
- `push.web.subscribe` — rejestruje `endpoint` oraz `keys.p256dh`/`keys.auth`.
- `push.web.unsubscribe` — usuwa zarejestrowany punkt końcowy.
- `push.web.test` — wysyła powiadomienie testowe do subskrypcji wywołującego.

<Note>
Web Push jest niezależny od ścieżki przekaźnika APNS dla iOS (zobacz [Konfiguracja](/pl/gateway/configuration) dla powiadomień push opartych na przekaźniku) oraz od istniejącej metody `push.test`, które są przeznaczone dla natywnego parowania mobilnego.
</Note>

## Hostowane osadzenia

Wiadomości asystenta mogą renderować hostowaną treść internetową w wierszu za pomocą shortcode’u `[embed ...]`. Polityką piaskownicy iframe steruje `gateway.controlUi.embedSandbox`:

<Tabs>
  <Tab title="strict">
    Wyłącza wykonywanie skryptów w hostowanych osadzeniach.
  </Tab>
  <Tab title="scripts (default)">
    Pozwala na interaktywne osadzenia przy zachowaniu izolacji źródła; jest to ustawienie domyślne i zwykle wystarcza dla samodzielnych gier/widgetów przeglądarkowych.
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
Używaj `trusted` tylko wtedy, gdy osadzony dokument rzeczywiście potrzebuje zachowania tego samego źródła. Dla większości gier i interaktywnych płócien generowanych przez agentów `scripts` jest bezpieczniejszym wyborem.
</Warning>

Bezwzględne zewnętrzne adresy URL osadzeń `http(s)` pozostają domyślnie blokowane. Jeśli celowo chcesz, aby `[embed url="https://..."]` ładował strony innych firm, ustaw `gateway.controlUi.allowExternalEmbedUrls: true`.

## Szerokość wiadomości czatu

Zgrupowane wiadomości czatu używają domyślnej maksymalnej szerokości zapewniającej czytelność. Wdrożenia na szerokich monitorach mogą ją nadpisać bez modyfikowania dołączonego CSS, ustawiając `gateway.controlUi.chatMessageMaxWidth`:

```json5
{
  gateway: {
    controlUi: {
      chatMessageMaxWidth: "min(1280px, 82%)",
    },
  },
}
```

Wartość jest walidowana, zanim trafi do przeglądarki. Obsługiwane wartości obejmują zwykłe długości i wartości procentowe, takie jak `960px` lub `82%`, a także ograniczone wyrażenia szerokości `min(...)`, `max(...)`, `clamp(...)`, `calc(...)` i `fit-content(...)`.

## Dostęp przez tailnet (zalecane)

<Tabs>
  <Tab title="Zintegrowane Tailscale Serve (preferowane)">
    Utrzymaj Gateway na loopback i pozwól Tailscale Serve pośredniczyć przez HTTPS:

    ```bash
    openclaw gateway --tailscale serve
    ```

    Otwórz:

    - `https://<magicdns>/` (lub skonfigurowany `gateway.controlUi.basePath`)

    Domyślnie żądania Control UI/WebSocket Serve mogą uwierzytelniać się przez nagłówki tożsamości Tailscale (`tailscale-user-login`), gdy `gateway.auth.allowTailscale` ma wartość `true`. OpenClaw weryfikuje tożsamość, rozwiązując adres `x-forwarded-for` za pomocą `tailscale whois` i dopasowując go do nagłówka, oraz akceptuje je tylko wtedy, gdy żądanie trafia na loopback z nagłówkami `x-forwarded-*` od Tailscale. Dla sesji operatora Control UI z tożsamością urządzenia przeglądarki ta zweryfikowana ścieżka Serve pomija też rundę parowania urządzenia; przeglądarki bez urządzenia i połączenia z rolą node nadal przechodzą standardowe kontrole urządzenia. Ustaw `gateway.auth.allowTailscale: false`, jeśli chcesz wymagać jawnych poświadczeń wspólnego sekretu nawet dla ruchu Serve. Następnie użyj `gateway.auth.mode: "token"` lub `"password"`.

    Dla tej asynchronicznej ścieżki tożsamości Serve nieudane próby uwierzytelniania dla tego samego IP klienta i zakresu uwierzytelniania są serializowane przed zapisami limitu szybkości. Współbieżne błędne ponowienia z tej samej przeglądarki mogą więc pokazać `retry later` przy drugim żądaniu zamiast dwóch zwykłych niedopasowań ścigających się równolegle.

    <Warning>
    Uwierzytelnianie Serve bez tokena zakłada, że host gateway jest zaufany. Jeśli na tym hoście może działać niezaufany kod lokalny, wymagaj uwierzytelniania tokenem/hasłem.
    </Warning>

  </Tab>
  <Tab title="Powiąż z tailnet + token">
    ```bash
    openclaw gateway --bind tailnet --token "$(openssl rand -hex 32)"
    ```

    Następnie otwórz:

    - `http://<tailscale-ip>:18789/` (lub skonfigurowany `gateway.controlUi.basePath`)

    Wklej pasujący wspólny sekret w ustawieniach UI (wysyłany jako `connect.params.auth.token` lub `connect.params.auth.password`).

  </Tab>
</Tabs>

## Niezabezpieczony HTTP

Jeśli otworzysz pulpit przez zwykły HTTP (`http://<lan-ip>` lub `http://<tailscale-ip>`), przeglądarka działa w **niezabezpieczonym kontekście** i blokuje WebCrypto. Domyślnie OpenClaw **blokuje** połączenia Control UI bez tożsamości urządzenia.

Udokumentowane wyjątki:

- zgodność z niezabezpieczonym HTTP tylko dla localhost z `gateway.controlUi.allowInsecureAuth=true`
- pomyślne uwierzytelnienie operatora Control UI przez `gateway.auth.mode: "trusted-proxy"`
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
    - Nie omija kontroli parowania.
    - Nie łagodzi wymagań tożsamości urządzenia dla zdalnych (innych niż localhost) połączeń.

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
    `dangerouslyDisableDeviceAuth` wyłącza kontrole tożsamości urządzenia Control UI i jest poważnym obniżeniem poziomu bezpieczeństwa. Wycofaj to szybko po użyciu awaryjnym.
    </Warning>

  </Accordion>
  <Accordion title="Uwaga dotycząca trusted-proxy">
    - Pomyślne uwierzytelnienie trusted-proxy może dopuścić sesje **operatora** Control UI bez tożsamości urządzenia.
    - Nie obejmuje to sesji Control UI z rolą node.
    - Zwrotne proxy loopback na tym samym hoście nadal nie spełniają uwierzytelniania trusted-proxy; zobacz [Uwierzytelnianie trusted proxy](/pl/gateway/trusted-proxy-auth).

  </Accordion>
</AccordionGroup>

Zobacz [Tailscale](/pl/gateway/tailscale), aby uzyskać wskazówki dotyczące konfiguracji HTTPS.

## Polityka bezpieczeństwa treści

Control UI jest dostarczany z rygorystyczną polityką `img-src`: dozwolone są tylko zasoby **z tego samego źródła**, adresy URL `data:` i lokalnie wygenerowane adresy URL `blob:`. Zdalne adresy URL obrazów `http(s)` oraz względne względem protokołu są odrzucane przez przeglądarkę i nie powodują żądań sieciowych.

Co to oznacza w praktyce:

- Awatary i obrazy serwowane pod ścieżkami względnymi (na przykład `/avatars/<id>`) nadal się renderują, w tym uwierzytelnione trasy awatarów, które UI pobiera i konwertuje na lokalne adresy URL `blob:`.
- Wbudowane adresy URL `data:image/...` nadal się renderują (przydatne dla ładunków w protokole).
- Lokalne adresy URL `blob:` utworzone przez Control UI nadal się renderują.
- Zdalne adresy URL awatarów emitowane przez metadane kanału są usuwane w helperach awatarów Control UI i zastępowane wbudowanym logo/znaczkiem, więc przejęty lub złośliwy kanał nie może wymusić dowolnych zdalnych pobrań obrazów z przeglądarki operatora.

Nie musisz niczego zmieniać, aby uzyskać to zachowanie — jest zawsze włączone i nie można go konfigurować.

## Uwierzytelnianie trasy awatara

Gdy uwierzytelnianie gateway jest skonfigurowane, punkt końcowy awatara Control UI wymaga tego samego tokena gateway co reszta API:

- `GET /avatar/<agentId>` zwraca obraz awatara tylko uwierzytelnionym wywołującym. `GET /avatar/<agentId>?meta=1` zwraca metadane awatara według tej samej reguły.
- Nieuwierzytelnione żądania do którejkolwiek z tras są odrzucane (tak samo jak pokrewna trasa assistant-media). Zapobiega to ujawnianiu przez trasę awatara tożsamości agenta na hostach, które poza tym są chronione.
- Sam Control UI przekazuje token gateway jako nagłówek bearer podczas pobierania awatarów i używa uwierzytelnionych adresów URL blob, dzięki czemu obraz nadal renderuje się w pulpitach.

Jeśli wyłączysz uwierzytelnianie gateway (niezalecane na hostach współdzielonych), trasa awatara również stanie się nieuwierzytelniona, zgodnie z resztą gateway.

## Uwierzytelnianie trasy mediów asystenta

Gdy uwierzytelnianie gateway jest skonfigurowane, lokalne podglądy mediów asystenta używają dwuetapowej trasy:

- `GET /__openclaw__/assistant-media?meta=1&source=<path>` wymaga normalnego uwierzytelnienia operatora Control UI. Przeglądarka wysyła token gateway jako nagłówek bearer podczas sprawdzania dostępności.
- Pomyślne odpowiedzi metadanych zawierają krótkotrwały `mediaTicket` ograniczony zakresem do dokładnie tej ścieżki źródłowej.
- Renderowane przez przeglądarkę adresy URL obrazów, dźwięku, wideo i dokumentów używają `mediaTicket=<ticket>` zamiast aktywnego tokena lub hasła gateway. Bilet szybko wygasa i nie może autoryzować innego źródła.

Dzięki temu zwykłe renderowanie mediów pozostaje zgodne z natywnymi elementami mediów w przeglądarce bez umieszczania poświadczeń gateway wielokrotnego użytku w widocznych adresach URL mediów.

## Budowanie UI

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

Następnie skieruj UI na adres URL WS swojego Gateway (np. `ws://127.0.0.1:18789`).

## Pusta strona Control UI

Jeśli przeglądarka ładuje pusty pulpit, a DevTools nie pokazuje użytecznego błędu, rozszerzenie lub wczesny skrypt treści mógł uniemożliwić ocenę aplikacji modułu JavaScript. Strona statyczna zawiera prosty panel odzyskiwania HTML, który pojawia się, gdy `<openclaw-app>` nie zostanie zarejestrowany po uruchomieniu.

Użyj akcji **Spróbuj ponownie** w panelu po zmianie środowiska przeglądarki albo przeładuj ręcznie po tych kontrolach:

- Wyłącz rozszerzenia, które wstrzykują się do wszystkich stron, zwłaszcza rozszerzenia ze skryptami treści `<all_urls>`.
- Spróbuj okna prywatnego, czystego profilu przeglądarki albo innej przeglądarki.
- Utrzymaj Gateway w działaniu i zweryfikuj ten sam adres URL pulpitu po zmianie przeglądarki.

## Debugowanie/testowanie: serwer deweloperski + zdalny Gateway

Control UI to pliki statyczne; cel WebSocket jest konfigurowalny i może różnić się od źródła HTTP. Jest to przydatne, gdy chcesz mieć lokalnie serwer deweloperski Vite, ale Gateway działa gdzie indziej.

<Steps>
  <Step title="Uruchom serwer deweloperski UI">
    ```bash
    pnpm ui:dev
    ```
  </Step>
  <Step title="Otwórz z gatewayUrl">
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
  <Accordion title="Notatki">
    - `gatewayUrl` jest przechowywany w localStorage po załadowaniu i usuwany z URL.
    - Jeśli przekazujesz pełny endpoint `ws://` lub `wss://` przez `gatewayUrl`, zakoduj wartość `gatewayUrl` jako URL, aby przeglądarka poprawnie przeanalizowała query string.
    - `token` powinien być przekazywany przez fragment URL (`#token=...`), gdy tylko jest to możliwe. Fragmenty nie są wysyłane do serwera, co zapobiega wyciekom przez logi żądań i Referer. Starsze parametry zapytania `?token=` są nadal importowane jednorazowo ze względu na zgodność, ale tylko jako mechanizm awaryjny, i są natychmiast usuwane po bootstrapie.
    - `password` jest przechowywane tylko w pamięci.
    - Gdy `gatewayUrl` jest ustawiony, UI nie wraca do danych uwierzytelniających z konfiguracji ani środowiska. Podaj jawnie `token` (lub `password`). Brak jawnych danych uwierzytelniających jest błędem.
    - Używaj `wss://`, gdy Gateway działa za TLS (Tailscale Serve, proxy HTTPS itd.).
    - `gatewayUrl` jest akceptowany tylko w oknie najwyższego poziomu (nie osadzonym), aby zapobiec clickjackingowi.
    - Publiczne wdrożenia Control UI poza loopbackiem muszą jawnie ustawić `gateway.controlUi.allowedOrigins` (pełne origins). Prywatne ładowania LAN/Tailnet z tego samego originu z loopbacka, RFC1918/link-local, `.local`, `.ts.net` lub hostów Tailscale CGNAT są akceptowane bez włączania awaryjnego dopasowania nagłówka Host.
    - Uruchamianie Gateway może zasilić lokalne origins, takie jak `http://localhost:<port>` i `http://127.0.0.1:<port>`, na podstawie efektywnego bindowania i portu środowiska wykonawczego, ale origins z przeglądarek zdalnych nadal wymagają jawnych wpisów.
    - Nie używaj `gateway.controlUi.allowedOrigins: ["*"]` poza ściśle kontrolowanymi testami lokalnymi. Oznacza to zezwolenie na dowolny origin przeglądarki, a nie „dopasuj dowolny host, którego używam”.
    - `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` włącza tryb awaryjnego dopasowania originu na podstawie nagłówka Host, ale jest to niebezpieczny tryb zabezpieczeń.

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

- [Dashboard](/pl/web/dashboard) — dashboard Gateway
- [Health Checks](/pl/gateway/health) — monitorowanie stanu Gateway
- [TUI](/pl/web/tui) — terminalowy interfejs użytkownika
- [WebChat](/pl/web/webchat) — interfejs czatu w przeglądarce
