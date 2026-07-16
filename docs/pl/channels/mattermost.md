---
read_when:
    - Konfigurowanie Mattermost
    - Debugowanie routingu Mattermost
sidebarTitle: Mattermost
summary: Konfiguracja bota Mattermost i OpenClaw
title: Mattermost
x-i18n:
    generated_at: "2026-07-16T18:05:11Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: e7d2233e26c6c0a510a264001a1e0d3e528d8645ffbe2affa3f1672304185ef5
    source_path: channels/mattermost.md
    workflow: 16
---

Status: Plugin do pobrania (token bota + zdarzenia WebSocket). Obsługiwane są kanały, kanały prywatne, grupowe wiadomości bezpośrednie i wiadomości bezpośrednie. Mattermost to platforma komunikacji zespołowej, którą można hostować samodzielnie ([mattermost.com](https://mattermost.com)).

## Instalacja

<Tabs>
  <Tab title="Rejestr npm">
    ```bash
    openclaw plugins install @openclaw/mattermost
    ```
  </Tab>
  <Tab title="Lokalna kopia repozytorium">
    ```bash
    openclaw plugins install ./path/to/local/mattermost-plugin
    ```
  </Tab>
</Tabs>

Szczegóły: [Pluginy](/pl/tools/plugin)

## Szybka konfiguracja

<Steps>
  <Step title="Zapewnienie dostępności Pluginu">
    Zainstaluj `@openclaw/mattermost` za pomocą powyższego polecenia, a następnie uruchom ponownie Gateway, jeśli jest już uruchomiony.
  </Step>
  <Step title="Utworzenie bota Mattermost">
    Utwórz konto bota Mattermost, skopiuj **token bota** i dodaj bota do zespołów oraz kanałów, które ma odczytywać.
  </Step>
  <Step title="Skopiowanie bazowego adresu URL">
    Skopiuj **bazowy adres URL** Mattermost (np. `https://chat.example.com`). Końcowy `/api/v4` jest automatycznie usuwany.
  </Step>
  <Step title="Konfiguracja OpenClaw i uruchomienie Gateway">
    Minimalna konfiguracja:

    ```json5
    {
      channels: {
        mattermost: {
          enabled: true,
          botToken: "mm-token",
          baseUrl: "https://chat.example.com",
          dmPolicy: "pairing",
        },
      },
    }
    ```

    Alternatywa nieinteraktywna:

    ```bash
    openclaw channels add --channel mattermost --bot-token <token> --http-url https://chat.example.com
    ```

  </Step>
</Steps>

<Note>
W przypadku samodzielnie hostowanego Mattermost pod prywatnym adresem, adresem LAN lub adresem tailnet wychodzące żądania do API Mattermost przechodzą przez zabezpieczenie SSRF, które domyślnie blokuje prywatne i wewnętrzne adresy IP. Można je włączyć za pomocą `channels.mattermost.network.dangerouslyAllowPrivateNetwork: true` (dla poszczególnych kont: `channels.mattermost.accounts.<id>.network.dangerouslyAllowPrivateNetwork`).
</Note>

## Natywne polecenia ukośnikowe

Natywne polecenia ukośnikowe wymagają jawnego włączenia. Po ich włączeniu OpenClaw rejestruje polecenia ukośnikowe `oc_*` w każdym zespole, do którego należy bot, i odbiera wywołania zwrotne POST na serwerze HTTP Gateway.

```json5
{
  channels: {
    mattermost: {
      commands: {
        native: true,
        nativeSkills: true,
        callbackPath: "/api/channels/mattermost/command",
        // Użyj, gdy Mattermost nie może bezpośrednio uzyskać dostępu do Gateway (odwrotne proxy/publiczny adres URL).
        callbackUrl: "https://gateway.example.com/api/channels/mattermost/command",
      },
    },
  },
}
```

Zarejestrowane polecenia: `/oc_status`, `/oc_model`, `/oc_models`, `/oc_new`, `/oc_help`, `/oc_think`, `/oc_reasoning`, `/oc_verbose`, `/oc_queue`. W przypadku `nativeSkills: true` polecenia Skills są również rejestrowane jako `/oc_<skill>`.

<AccordionGroup>
  <Accordion title="Uwagi dotyczące działania">
    - `native` i `nativeSkills` mają domyślną wartość `"auto"`, która w przypadku Mattermost oznacza wyłączenie. Należy jawnie ustawić je na `true`.
    - `callbackPath` ma domyślną wartość `/api/channels/mattermost/command`.
    - Jeśli pominięto `callbackUrl`, OpenClaw wyznacza `http://<gateway.customBindHost or localhost>:<gateway.port, default 18789><callbackPath>`. Hosty nasłuchujące na symbolu wieloznacznym (`0.0.0.0`, `::`) korzystają awaryjnie z `localhost`.
    - W konfiguracjach z wieloma kontami `commands` można ustawić na najwyższym poziomie lub w `channels.mattermost.accounts.<id>.commands` (wartości konta zastępują pola najwyższego poziomu).
    - Istniejące polecenia ukośnikowe z tym samym wyzwalaczem, utworzone przez inne integracje, pozostają niezmienione (są pomijane podczas rejestracji); polecenia utworzone przez bota są aktualizowane lub tworzone ponownie, gdy zmieni się adres URL wywołania zwrotnego.
    - Wywołania zwrotne poleceń są weryfikowane za pomocą tokenów poszczególnych poleceń zwracanych przez Mattermost podczas rejestrowania przez OpenClaw poleceń `oc_*`.
    - Przed zaakceptowaniem każdego wywołania zwrotnego OpenClaw odświeża bieżącą rejestrację poleceń Mattermost, dzięki czemu nieaktualne tokeny usuniętych lub ponownie wygenerowanych poleceń ukośnikowych przestają być akceptowane bez ponownego uruchamiania Gateway.
    - Walidacja wywołania zwrotnego kończy się odmową, jeśli API Mattermost nie może potwierdzić, że polecenie jest nadal aktualne; nieudane walidacje są krótko buforowane, równoczesne wyszukiwania są scalane, a częstotliwość rozpoczynania nowych wyszukiwań jest ograniczana dla każdego polecenia, aby ograniczyć obciążenie powodowane przez próby powtórzenia.
    - Wywołania zwrotne poleceń ukośnikowych kończą się odmową, gdy rejestracja się nie powiodła, uruchamianie było częściowe lub token wywołania zwrotnego nie odpowiada zarejestrowanemu tokenowi rozpoznanego polecenia (token prawidłowy dla jednego polecenia nie może dotrzeć do walidacji nadrzędnej dla innego polecenia).
    - Zaakceptowane wywołania zwrotne są potwierdzane efemeryczną odpowiedzią „Przetwarzanie...”; właściwa odpowiedź jest dostarczana jako zwykła wiadomość.

  </Accordion>
  <Accordion title="Wymaganie dotyczące osiągalności">
    Punkt końcowy wywołania zwrotnego musi być osiągalny z serwera Mattermost.

    - Nie należy ustawiać `callbackUrl` na `localhost`, chyba że Mattermost działa na tym samym hoście lub w tej samej przestrzeni nazw sieci co OpenClaw.
    - Nie należy ustawiać `callbackUrl` na bazowy adres URL Mattermost, chyba że ten adres URL przekazuje `/api/channels/mattermost/command` do OpenClaw przez odwrotne proxy.
    - Szybkie sprawdzenie można wykonać za pomocą `curl https://<gateway-host>/api/channels/mattermost/command`; żądanie GET powinno zwrócić `405 Method Not Allowed` z OpenClaw, a nie `404`.

  </Accordion>
  <Accordion title="Lista dozwolonych adresów wyjściowych Mattermost">
    Jeśli wywołanie zwrotne jest kierowane na adresy prywatne, tailnet lub wewnętrzne, należy ustawić `ServiceSettings.AllowedUntrustedInternalConnections` w Mattermost tak, aby obejmowało host lub domenę wywołania zwrotnego.

    Należy używać wpisów hostów lub domen, a nie pełnych adresów URL.

    - Poprawnie: `gateway.tailnet-name.ts.net`
    - Niepoprawnie: `https://gateway.tailnet-name.ts.net`

  </Accordion>
</AccordionGroup>

## Zmienne środowiskowe (konto domyślne)

Jeśli preferowane są zmienne środowiskowe, należy ustawić je na hoście Gateway:

- `MATTERMOST_BOT_TOKEN=...`
- `MATTERMOST_URL=https://chat.example.com`

<Note>
Zmienne środowiskowe mają zastosowanie tylko do konta **domyślnego** (`default`). Inne konta muszą używać wartości konfiguracyjnych.

Nie można ustawić `MATTERMOST_URL` z pliku `.env` obszaru roboczego; zobacz [Pliki .env obszaru roboczego](/pl/gateway/security).
</Note>

## Tryby czatu

Mattermost automatycznie odpowiada na wiadomości bezpośrednie. Zachowaniem w kanałach steruje `chatmode`:

<Tabs>
  <Tab title="oncall (domyślnie)">
    Odpowiada tylko po oznaczeniu @wzmianką na kanałach.
  </Tab>
  <Tab title="onmessage">
    Odpowiada na każdą wiadomość na kanale.
  </Tab>
  <Tab title="onchar">
    Odpowiada, gdy wiadomość zaczyna się od prefiksu wyzwalającego.
  </Tab>
</Tabs>

Przykład konfiguracji:

```json5
{
  channels: {
    mattermost: {
      chatmode: "onchar",
      oncharPrefixes: [">", "!"], // domyślnie
    },
  },
}
```

Uwagi:

- `onchar` nadal odpowiada na jawne @wzmianki.
- `channels.mattermost.requireMention` jest nadal uwzględniane, ale preferowane jest `chatmode`. Ustawienia `groups.<channelId>.requireMention` poszczególnych kanałów mają pierwszeństwo przed oboma.
- Gdy bot wyśle widoczną odpowiedź w wątku kanału, na późniejsze wiadomości w tym samym wątku odpowiada bez nowej @wzmianki lub prefiksu `onchar`, dzięki czemu wieloetapowe rozmowy w wątku mogą być płynnie kontynuowane. Udział jest zapamiętywany przez 7 dni od ostatniej odpowiedzi bota w danym wątku i zachowywany po ponownym uruchomieniu Gateway. Nie wpływa to na wątki, które bot tylko obserwował; aby ponownie wymagać jawnej wzmianki, należy rozpocząć nową wiadomość najwyższego poziomu.

## Wątki i sesje

Za pomocą `channels.mattermost.replyToMode` można określić, czy odpowiedzi na kanałach i w grupach pozostają w głównym kanale, czy rozpoczynają wątek pod postem wyzwalającym.

- `off` (domyślnie): odpowiedź trafia do wątku tylko wtedy, gdy post przychodzący już się w nim znajduje.
- `first`: w przypadku postów najwyższego poziomu na kanałach lub w grupach rozpoczyna wątek pod danym postem i kieruje rozmowę do sesji powiązanej z wątkiem.
- `all` i `batched`: obecnie w Mattermost działają tak samo jak `first`, ponieważ po utworzeniu głównego postu wątku w Mattermost kolejne fragmenty i multimedia pozostają w tym samym wątku.
- Wiadomości bezpośrednie domyślnie używają `off`, nawet gdy ustawiono `replyToMode`.

Za pomocą `channels.mattermost.replyToModeByChatType` można zastąpić tryb dla czatów `direct`, `group` lub `channel`. Aby włączyć wątki dla wiadomości bezpośrednich, należy ustawić `direct`:

- `off` (domyślnie): wiadomości bezpośrednie pozostają poza wątkami w jednej ciągłej sesji.
- `first`, `all` lub `batched`: każda wiadomość bezpośrednia najwyższego poziomu rozpoczyna wątek Mattermost obsługiwany przez nową, niezależną sesję.

```json5
{
  channels: {
    mattermost: {
      replyToMode: "all",
      replyToModeByChatType: {
        direct: "first",
      },
    },
  },
}
```

Uwagi:

- Sesje powiązane z wątkiem używają identyfikatora postu wyzwalającego jako głównego postu wątku.
- `first` i `all` są obecnie równoważne, ponieważ po utworzeniu głównego postu wątku w Mattermost kolejne fragmenty i multimedia pozostają w tym samym wątku.
- Ustawienia dla poszczególnych typów czatu mają pierwszeństwo przed `replyToMode`. Bez ustawienia `direct` istniejące wdrożenia zachowują płaskie wiadomości bezpośrednie bez wątków.

## Kontrola dostępu (wiadomości bezpośrednie)

- Domyślnie: `channels.mattermost.dmPolicy = "pairing"` (nieznani nadawcy otrzymują kod parowania). Inne wartości: `allowlist`, `open`, `disabled`.
- Zatwierdzanie za pomocą:
  - `openclaw pairing list mattermost`
  - `openclaw pairing approve mattermost <CODE>`
- Publiczne wiadomości bezpośrednie: `channels.mattermost.dmPolicy="open"` oraz `channels.mattermost.allowFrom=["*"]` (schemat konfiguracji wymusza symbol wieloznaczny).
- `channels.mattermost.allowFrom` przyjmuje identyfikatory użytkowników (zalecane) oraz wpisy `accessGroup:<name>`. Zobacz [Grupy dostępu](/pl/channels/access-groups).

## Kanały (grupy)

- Domyślnie: `channels.mattermost.groupPolicy = "allowlist"` (wymaga wzmianki).
- Nadawców można dodać do listy dozwolonych za pomocą `channels.mattermost.groupAllowFrom` (zalecane są identyfikatory użytkowników).
- `channels.mattermost.groupAllowFrom` przyjmuje wpisy `accessGroup:<name>`. Zobacz [Grupy dostępu](/pl/channels/access-groups).
- Ustawienia wzmianki dla poszczególnych kanałów znajdują się w `channels.mattermost.groups.<channelId>.requireMention`, a wartość domyślna w `channels.mattermost.groups["*"].requireMention`.
- Dopasowanie `@username` jest zmienne i włączone tylko wtedy, gdy `channels.mattermost.dangerouslyAllowNameMatching: true`.
- Otwarte kanały: `channels.mattermost.groupPolicy="open"` (wymagają wzmianki).
- Kolejność rozpoznawania: `channels.mattermost.groupPolicy`, następnie `channels.defaults.groupPolicy`, a potem `"allowlist"`.
- Uwaga dotycząca środowiska wykonawczego: jeśli sekcja `channels.mattermost` jest całkowicie nieobecna, środowisko wykonawcze bezpiecznie stosuje `groupPolicy="allowlist"` podczas kontroli grup (nawet jeśli ustawiono `channels.defaults.groupPolicy`) i rejestruje jednorazowe ostrzeżenie.

Przykład:

```json5
{
  channels: {
    mattermost: {
      groupPolicy: "open",
      groups: {
        "*": { requireMention: true },
        "team-channel-id": { requireMention: false },
      },
    },
  },
}
```

## Cele dostarczania wychodzącego

Tych formatów celów należy używać z `openclaw message send` lub mechanizmami cron/webhook:

| Cel                                 | Miejsce dostarczenia                                         |
| ----------------------------------- | ------------------------------------------------------------- |
| `channel:<id>`                      | Kanał według identyfikatora                                  |
| `channel:<name>` lub `#channel-name` | Kanał według nazwy, wyszukiwany we wszystkich zespołach, do których należy bot |
| `user:<id>` lub `mattermost:<id>`    | Wiadomość bezpośrednia do danego użytkownika                 |
| `@username`                         | Wiadomość bezpośrednia (nazwa użytkownika rozpoznawana przez API Mattermost) |

Wysyłane wiadomości obsługują najwyżej jeden załącznik na wiadomość; wiele plików należy rozdzielić na osobne wysyłki.

<Warning>
Same nieprzejrzyste identyfikatory (takie jak `64ifufp...`) są w Mattermost **niejednoznaczne** (identyfikator użytkownika lub identyfikator kanału).

OpenClaw rozpoznaje je **najpierw jako użytkownika**:

- Jeśli identyfikator istnieje jako użytkownik (`GET /api/v4/users/<id>` kończy się powodzeniem), OpenClaw wysyła **wiadomość bezpośrednią**, rozpoznając kanał bezpośredni za pomocą `/api/v4/channels/direct`.
- W przeciwnym razie identyfikator jest traktowany jako **identyfikator kanału**.

Aby uzyskać deterministyczne zachowanie, należy zawsze używać jawnych prefiksów (`user:<id>` / `channel:<id>`).
</Warning>

## Ponawianie dla kanału wiadomości bezpośrednich

Gdy OpenClaw wysyła wiadomość do docelowej rozmowy prywatnej w Mattermost i musi najpierw rozpoznać kanał bezpośredni, domyślnie ponawia próbę po przejściowych niepowodzeniach utworzenia kanału bezpośredniego.

Użyj `channels.mattermost.dmChannelRetry`, aby dostosować to zachowanie globalnie dla pluginu Mattermost, albo `channels.mattermost.accounts.<id>.dmChannelRetry` dla jednego konta. Wartości domyślne:

```json5
{
  channels: {
    mattermost: {
      dmChannelRetry: {
        maxRetries: 3,
        initialDelayMs: 1000,
        maxDelayMs: 10000,
        timeoutMs: 30000,
      },
    },
  },
}
```

Uwagi:

- Dotyczy to wyłącznie tworzenia kanału rozmowy prywatnej (`/api/v4/channels/direct`), a nie każdego wywołania API Mattermost.
- Ponowienia wykorzystują wykładniczo rosnące opóźnienie z losowym rozrzutem i dotyczą przejściowych niepowodzeń, takich jak limity częstotliwości, odpowiedzi 5xx oraz błędy sieciowe lub przekroczenia limitu czasu.
- Błędy klienta 4xx inne niż `429` są uznawane za trwałe i próby nie są ponawiane.

## Strumieniowe przesyłanie podglądu

Mattermost przesyła tok rozumowania, aktywność narzędzi i częściowy tekst odpowiedzi do **roboczego wpisu podglądu**, który jest finalizowany w miejscu, gdy wysłanie ostatecznej odpowiedzi jest bezpieczne. W trybie `partial` podgląd jest aktualizowany w ramach tego samego identyfikatora wpisu, zamiast zaśmiecać kanał wiadomościami dla każdego fragmentu. W trybie `block` podgląd przełącza się między ukończonym tekstem a blokami aktywności narzędzi, dzięki czemu wcześniejsze bloki pozostają widoczne jako osobne wpisy, zamiast być nadpisywane przez kolejny. Ostateczne odpowiedzi z multimediami lub błędami anulują oczekujące edycje podglądu i korzystają ze standardowego dostarczania, zamiast publikować zbędny wpis podglądu.

Strumieniowe przesyłanie podglądu jest **domyślnie włączone** w trybie `partial`. Skonfiguruj je za pomocą `channels.mattermost.streaming.mode` (starsze wartości skalarne/logiczne `streaming` są migrowane przez `openclaw doctor --fix`):

```json5
{
  channels: {
    mattermost: {
      streaming: { mode: "partial" }, // off | partial | block | progress
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Tryby przesyłania strumieniowego">
    - `partial` (domyślny): jeden wpis podglądu edytowany w miarę powstawania odpowiedzi, a następnie finalizowany pełną odpowiedzią.
    - `block` przełącza podgląd między ukończonym tekstem a blokami aktywności narzędzi, dzięki czemu każdy blok pozostaje widoczny jako osobny wpis, zamiast być nadpisywany w miejscu. Równoległe i następujące po sobie aktualizacje narzędzi współdzielą bieżący wpis aktywności narzędzi.
    - `progress` wyświetla podgląd stanu podczas generowania i publikuje ostateczną odpowiedź dopiero po zakończeniu.
    - `off` wyłącza strumieniowe przesyłanie podglądu. Przy `streaming.block.enabled: true` ukończone bloki asystenta są nadal dostarczane jako zwykłe odpowiedzi blokowe (osobne wpisy), a nie jako pojedynczy scalony wpis końcowy.

  </Accordion>
  <Accordion title="Uwagi dotyczące przesyłania strumieniowego">
    - Jeśli strumienia nie można sfinalizować w miejscu (na przykład wpis usunięto w trakcie przesyłania), OpenClaw przechodzi na wysłanie nowego wpisu końcowego, dzięki czemu odpowiedź nigdy nie zostaje utracona.
    - Ładunki zawierające wyłącznie tok rozumowania nie są publikowane na kanale, w tym tekst otrzymany jako cytat blokowy `> Thinking`. Ustaw `/reasoning on`, aby wyświetlać tok rozumowania w innych miejscach; końcowy wpis Mattermost zawiera wyłącznie odpowiedź.
    - Macierz mapowania kanałów znajduje się w sekcji [Przesyłanie strumieniowe](/pl/concepts/streaming#preview-streaming-modes).

  </Accordion>
</AccordionGroup>

## Reakcje (narzędzie wiadomości)

- Użyj `message action=react` z `channel=mattermost`.
- `messageId` to identyfikator wpisu Mattermost.
- `emoji` przyjmuje nazwy takie jak `thumbsup` lub `:+1:` (dwukropki są opcjonalne).
- Ustaw `remove=true` (wartość logiczna), aby usunąć reakcję.
- Zdarzenia dodawania i usuwania reakcji są przekazywane jako zdarzenia systemowe do kierowanej sesji agenta i podlegają tym samym kontrolom zasad rozmów prywatnych/grupowych co wiadomości.

Przykłady:

```text
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup remove=true
```

Konfiguracja:

- `channels.mattermost.actions.reactions`: włącza/wyłącza akcje reakcji (domyślnie true).
- Nadpisanie dla konta: `channels.mattermost.accounts.<id>.actions.reactions`.

## Przyciski interaktywne (narzędzie wiadomości)

Wysyłaj wiadomości z klikalnymi przyciskami. Gdy użytkownik kliknie przycisk, agent otrzymuje wybór i może odpowiedzieć.

Przyciski pochodzą z semantycznego ładunku `presentation` (w zwykłych odpowiedziach agenta i w `message action=send`). OpenClaw renderuje przyciski z wartościami jako interaktywne przyciski Mattermost, pozostawia przyciski URL widoczne w tekście wiadomości i upraszcza menu wyboru do czytelnego tekstu.

```text
message action=send channel=mattermost target=channel:<channelId> presentation={"blocks":[{"type":"buttons","buttons":[{"label":"Tak","value":"yes"},{"label":"Nie","value":"no"}]}]}
```

Pola przycisku prezentacji:

<ParamField path="label" type="string" required>
  Wyświetlana etykieta (alias: `text`).
</ParamField>
<ParamField path="value" type="string">
  Wartość odsyłana po kliknięciu, używana jako identyfikator akcji (aliasy: `callback_data`, `callbackData`). Wymagana dla klikalnego przycisku, chyba że ustawiono `url`.
</ParamField>
<ParamField path="url" type="string">
  Przycisk odsyłacza; renderowany w treści wiadomości jako tekst `label: url`, a nie jako przycisk interaktywny.
</ParamField>
<ParamField path="style" type='"primary" | "secondary" | "success" | "danger"'>
  Styl przycisku. Mattermost stosuje domyślny styl do wartości, których nie obsługuje.
</ParamField>

Aby poinformować o obsłudze przycisków w systemowym prompcie agenta, dodaj `inlineButtons` do możliwości kanału:

```json5
{
  channels: {
    mattermost: {
      capabilities: ["inlineButtons"],
    },
  },
}
```

Gdy użytkownik kliknie przycisk:

<Steps>
  <Step title="Kontrola dostępu">
    Osoba klikająca musi przejść te same kontrole zasad rozmów prywatnych/grupowych co nadawca wiadomości; nieautoryzowane kliknięcia otrzymują tymczasowe powiadomienie i są ignorowane.
  </Step>
  <Step title="Zastąpienie przycisków potwierdzeniem">
    Wszystkie przyciski są zastępowane wierszem potwierdzenia (np. „✓ **Tak** — wybrane przez @user”).
  </Step>
  <Step title="Agent otrzymuje wybór">
    Agent otrzymuje wybór jako wiadomość przychodzącą (oraz zdarzenie systemowe) i odpowiada.
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Uwagi dotyczące implementacji">
    - Wywołania zwrotne przycisków korzystają z weryfikacji HMAC-SHA256 (automatycznie, bez konieczności konfiguracji).
    - Po kliknięciu zastępowany jest cały blok załącznika, dlatego wszystkie przyciski są usuwane razem — częściowe usunięcie nie jest możliwe.
    - Identyfikatory akcji zawierające łączniki lub podkreślenia są automatycznie oczyszczane (ograniczenie routingu Mattermost).
    - Kliknięcia, których `action_id` nie odpowiada akcji w oryginalnym wpisie, są odrzucane z `403` („Nieznana akcja”).

  </Accordion>
  <Accordion title="Konfiguracja i osiągalność">
    - `channels.mattermost.capabilities`: tablica ciągów możliwości. Dodaj `"inlineButtons"`, aby włączyć opis narzędzia przycisków w systemowym prompcie agenta.
    - `channels.mattermost.interactions.callbackBaseUrl`: opcjonalny zewnętrzny bazowy adres URL wywołań zwrotnych przycisków (na przykład `https://gateway.example.com`). Użyj go, gdy Mattermost nie może bezpośrednio połączyć się z Gateway pod jego adresem nasłuchiwania.
    - W konfiguracjach z wieloma kontami można również ustawić to samo pole w `channels.mattermost.accounts.<id>.interactions.callbackBaseUrl`.
    - Jeśli pominięto `interactions.callbackBaseUrl`, OpenClaw wyznacza adres URL wywołania zwrotnego na podstawie `gateway.customBindHost` + `gateway.port` (domyślnie 18789), a następnie przechodzi awaryjnie na `http://localhost:<port>`. Ścieżka wywołania zwrotnego to `/mattermost/interactions/<accountId>`.
    - Reguła osiągalności: adres URL wywołania zwrotnego przycisku musi być osiągalny z serwera Mattermost. `localhost` działa tylko wtedy, gdy Mattermost i OpenClaw działają na tym samym hoście lub w tej samej przestrzeni nazw sieci.
    - `channels.mattermost.interactions.allowedSourceIps`: lista dozwolonych źródłowych adresów IP dla wywołań zwrotnych przycisków. Bez niej akceptowane są tylko źródła pętli zwrotnej (`127.0.0.1`, `::1`), dlatego zdalny serwer Mattermost musi zostać dodany do tej listy, w przeciwnym razie jego kliknięcia zostaną odrzucone z `403`. W przypadku korzystania z odwrotnego serwera proxy ustaw również `gateway.trustedProxies`, aby rzeczywisty adres IP klienta był ustalany na podstawie przekazanych nagłówków.
    - Jeśli cel wywołania zwrotnego jest prywatny, wewnętrzny lub znajduje się w sieci tailnet, dodaj jego host/domenę do `ServiceSettings.AllowedUntrustedInternalConnections` w Mattermost.

  </Accordion>
</AccordionGroup>

### Bezpośrednia integracja z API (skrypty zewnętrzne)

Skrypty zewnętrzne i webhooki mogą publikować przyciski bezpośrednio przez REST API Mattermost, zamiast korzystać z narzędzia `message` agenta. Preferowane jest narzędzie `message` OpenClaw. W przypadku integracji bezpośrednich zaimportuj `buildButtonAttachments` z `@openclaw/mattermost/api.js`; jeśli publikowany jest surowy JSON, należy przestrzegać następujących reguł:

**Struktura ładunku:**

```json5
{
  channel_id: "<channelId>",
  message: "Wybierz opcję:",
  props: {
    attachments: [
      {
        actions: [
          {
            id: "mybutton01", // tylko znaki alfanumeryczne — patrz poniżej
            type: "button", // wymagane, w przeciwnym razie kliknięcia są po cichu ignorowane
            name: "Zatwierdź", // wyświetlana etykieta
            style: "primary", // opcjonalne: "default", "primary", "danger"
            integration: {
              url: "https://gateway.example.com/mattermost/interactions/default",
              context: {
                action_id: "mybutton01", // musi odpowiadać identyfikatorowi przycisku
                action: "approve",
                // ... dowolne pola niestandardowe ...
                _token: "<hmac>", // patrz sekcja HMAC poniżej
              },
            },
          },
        ],
      },
    ],
  },
}
```

<Warning>
**Reguły krytyczne**

1. Załączniki należy umieścić w `props.attachments`, a nie w `attachments` najwyższego poziomu (są wtedy po cichu ignorowane).
2. Każda akcja wymaga `type: "button"` — bez niego kliknięcia są po cichu pochłaniane.
3. Każda akcja wymaga pola `id` — Mattermost ignoruje akcje bez identyfikatorów.
4. `id` akcji może zawierać **wyłącznie znaki alfanumeryczne** (`[a-zA-Z0-9]`). Łączniki i podkreślenia zakłócają routing akcji po stronie serwera Mattermost (zwracany jest kod 404). Usuń je przed użyciem.
5. `context.action_id` musi odpowiadać `id` przycisku; Gateway odrzuca kliknięcia, których `action_id` nie istnieje we wpisie.
6. `context.action_id` jest wymagane — bez niego procedura obsługi interakcji zwraca kod 400.
7. Źródłowy adres IP wywołania zwrotnego musi być dozwolony (patrz `interactions.allowedSourceIps` powyżej).

</Warning>

**Generowanie tokenu HMAC**

Gateway weryfikuje kliknięcia przycisków za pomocą HMAC-SHA256. Skrypty zewnętrzne muszą generować tokeny zgodne z logiką weryfikacji Gateway:

<Steps>
  <Step title="Wyprowadzenie sekretu z tokenu bota">
    `HMAC-SHA256(key="openclaw-mattermost-interactions", data=botToken)`, zakodowane szesnastkowo.
  </Step>
  <Step title="Utworzenie obiektu kontekstu">
    Utwórz obiekt kontekstu ze wszystkimi polami **oprócz** `_token`.
  </Step>
  <Step title="Serializacja z posortowanymi kluczami">
    Serializuj z **rekurencyjnie posortowanymi kluczami** i **bez spacji** (Gateway kanonizuje również zagnieżdżone obiekty i generuje zwarty JSON).
  </Step>
  <Step title="Podpisanie ładunku">
    `HMAC-SHA256(key=secret, data=serializedContext)`
  </Step>
  <Step title="Dodanie tokenu">
    Dodaj wynikowy skrót szesnastkowy jako `_token` w kontekście.
  </Step>
</Steps>

Przykład w Pythonie:

```python
import hmac, hashlib, json

secret = hmac.new(
    b"openclaw-mattermost-interactions",
    bot_token.encode(), hashlib.sha256
).hexdigest()

ctx = {"action_id": "mybutton01", "action": "approve"}
payload = json.dumps(ctx, sort_keys=True, separators=(",", ":"))
token = hmac.new(secret.encode(), payload.encode(), hashlib.sha256).hexdigest()

context = {**ctx, "_token": token}
```

<AccordionGroup>
  <Accordion title="Typowe pułapki HMAC">
    - `json.dumps` w Pythonie domyślnie dodaje spacje (`{"key": "val"}`). Użyj `separators=(",", ":")`, aby uzyskać zwarty format wyjściowy JavaScriptu (`{"key":"val"}`).
    - Zawsze podpisuj **wszystkie** pola kontekstu (z wyjątkiem `_token`). Gateway usuwa `_token`, a następnie podpisuje wszystko, co pozostało. Podpisanie tylko podzbioru powoduje cichy błąd weryfikacji.
    - Użyj `sort_keys=True` — Gateway sortuje klucze przed podpisaniem, a Mattermost może zmienić kolejność pól kontekstu podczas zapisywania ładunku.
    - Wyprowadź sekret z tokenu bota (deterministycznie), zamiast używać losowych bajtów. Sekret musi być taki sam w procesie tworzącym przyciski i w Gatewayu przeprowadzającym weryfikację.

  </Accordion>
</AccordionGroup>

## Adapter katalogu

Plugin Mattermost zawiera adapter katalogu, który rozpoznaje nazwy kanałów i użytkowników za pośrednictwem API Mattermost. Umożliwia to korzystanie z celów `#channel-name` i `@username` w `openclaw message send` oraz dostarczanie przez Cron/Webhook.

Konfiguracja nie jest wymagana — adapter używa tokenu bota z konfiguracji konta.

## Wiele kont

Mattermost obsługuje wiele kont w ramach `channels.mattermost.accounts`:

```json5
{
  channels: {
    mattermost: {
      accounts: {
        default: { name: "Primary", botToken: "mm-token", baseUrl: "https://chat.example.com" },
        alerts: { name: "Alerts", botToken: "mm-token-2", baseUrl: "https://alerts.example.com" },
      },
    },
  },
}
```

Wartości konta zastępują pola najwyższego poziomu; `channels.mattermost.defaultAccount` określa konto używane, gdy nie wskazano żadnego.

## Rozwiązywanie problemów

<AccordionGroup>
  <Accordion title="Brak odpowiedzi na kanałach">
    Upewnij się, że bot znajduje się na kanale, i wspomnij go (oncall), użyj prefiksu wyzwalającego (onchar) albo ustaw `chatmode: "onmessage"`.
  </Accordion>
  <Accordion title="Błędy uwierzytelniania lub wielu kont">
    - Sprawdź token bota, bazowy adres URL oraz czy konto jest włączone.
    - Problemy z wieloma kontami: zmienne środowiskowe dotyczą tylko konta `default`.
    - Prywatne lub lokalne hosty Mattermost wymagają ustawienia `network.dangerouslyAllowPrivateNetwork: true` (ochrona przed SSRF domyślnie blokuje prywatne adresy IP).

  </Accordion>
  <Accordion title="Natywne polecenia z ukośnikiem nie działają">
    - `Unauthorized: invalid command token.`: OpenClaw nie zaakceptował tokenu wywołania zwrotnego. Typowe przyczyny:
      - rejestracja polecenia z ukośnikiem nie powiodła się lub została ukończona tylko częściowo podczas uruchamiania
      - wywołanie zwrotne trafia do niewłaściwego Gatewaya lub konta
      - Mattermost nadal ma stare polecenia wskazujące poprzedni cel wywołania zwrotnego
      - Gateway został ponownie uruchomiony bez ponownej aktywacji poleceń z ukośnikiem
    - Jeśli natywne polecenia z ukośnikiem przestaną działać, sprawdź, czy w dziennikach występuje `mattermost: failed to register slash commands` lub `mattermost: native slash commands enabled but no commands could be registered`.
    - Jeśli pominięto `callbackUrl`, a dzienniki ostrzegają, że wywołanie zwrotne prowadzi do adresu pętli zwrotnej, takiego jak `http://localhost:18789/...`, ten adres prawdopodobnie jest dostępny tylko wtedy, gdy Mattermost działa na tym samym hoście lub w tej samej przestrzeni nazw sieci co OpenClaw. Zamiast tego ustaw jawny, dostępny z zewnątrz adres `commands.callbackUrl`.

  </Accordion>
  <Accordion title="Problemy z przyciskami">
    - Przyciski są wyświetlane jako białe pola albo nie są wyświetlane wcale: dane przycisków są nieprawidłowe. Każdy przycisk prezentacji wymaga `label` i `value` (przyciski bez któregokolwiek z nich są odrzucane).
    - Przyciski są wyświetlane, ale kliknięcia nie działają: sprawdź, czy Gateway jest dostępny z serwera Mattermost, adres IP serwera Mattermost znajduje się w `channels.mattermost.interactions.allowedSourceIps` (bez tego akceptowana jest tylko pętla zwrotna), a `ServiceSettings.AllowedUntrustedInternalConnections` zawiera host wywołania zwrotnego dla celów prywatnych.
    - Kliknięcie przycisku zwraca błąd 404: `id` przycisku prawdopodobnie zawiera łączniki lub podkreślenia. Router akcji Mattermost nie obsługuje identyfikatorów zawierających znaki inne niż alfanumeryczne. Używaj wyłącznie `[a-zA-Z0-9]`.
    - Gateway zapisuje w dzienniku `rejected callback source`: kliknięcie pochodziło z adresu IP spoza `interactions.allowedSourceIps`. Dodaj serwer Mattermost lub punkt wejścia do listy dozwolonych i ustaw `gateway.trustedProxies` za odwrotnym serwerem proxy.
    - Gateway zapisuje w dzienniku `invalid _token`: niezgodność HMAC. Sprawdź, czy podpisywane są wszystkie pola kontekstu (a nie tylko ich podzbiór), klucze są posortowane oraz używany jest zwarty JSON (bez spacji). Zobacz powyższą sekcję dotyczącą HMAC.
    - Gateway zapisuje w dzienniku `missing _token in context`: pole `_token` nie znajduje się w kontekście przycisku. Upewnij się, że zostało uwzględnione podczas tworzenia ładunku integracji.
    - Gateway odrzuca kliknięcie z komunikatem `Unknown action`: `context.action_id` nie odpowiada żadnej wartości `id` akcji we wpisie. Ustaw oba na tę samą oczyszczoną wartość.
    - Agent nie oferuje przycisków: dodaj `capabilities: ["inlineButtons"]` do konfiguracji kanału Mattermost.

  </Accordion>
</AccordionGroup>

## Powiązane materiały

- [Trasowanie kanałów](/pl/channels/channel-routing) — trasowanie sesji dla wiadomości
- [Przegląd kanałów](/pl/channels) — wszystkie obsługiwane kanały
- [Grupy](/pl/channels/groups) — działanie czatu grupowego i ograniczanie za pomocą wzmianek
- [Parowanie](/pl/channels/pairing) — uwierzytelnianie w wiadomościach bezpośrednich i proces parowania
- [Bezpieczeństwo](/pl/gateway/security) — model dostępu i wzmacnianie zabezpieczeń
