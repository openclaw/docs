---
read_when:
    - Konfigurowanie Mattermost
    - Debugowanie routingu Mattermost
sidebarTitle: Mattermost
summary: Konfiguracja bota Mattermost i OpenClaw
title: Mattermost
x-i18n:
    generated_at: "2026-07-12T14:54:12Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 246535ff433a678624d997db640d2531d6ce434ea064a23b98abe8a9e7e6a117
    source_path: channels/mattermost.md
    workflow: 16
---

Status: plugin do pobrania (token bota + zdarzenia WebSocket). Obsługiwane są kanały, kanały prywatne, grupowe wiadomości bezpośrednie i wiadomości bezpośrednie. Mattermost to platforma do komunikacji zespołowej, którą można hostować samodzielnie ([mattermost.com](https://mattermost.com)).

## Instalacja

<Tabs>
  <Tab title="rejestr npm">
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
  <Step title="Upewnij się, że plugin jest dostępny">
    Zainstaluj `@openclaw/mattermost` za pomocą powyższego polecenia, a następnie uruchom ponownie Gateway, jeśli jest już uruchomiony.
  </Step>
  <Step title="Utwórz bota Mattermost">
    Utwórz konto bota Mattermost, skopiuj **token bota** i dodaj bota do zespołów oraz kanałów, które ma odczytywać.
  </Step>
  <Step title="Skopiuj bazowy adres URL">
    Skopiuj **bazowy adres URL** Mattermost (np. `https://chat.example.com`). Końcowy fragment `/api/v4` jest usuwany automatycznie.
  </Step>
  <Step title="Skonfiguruj OpenClaw i uruchom Gateway">
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
Samodzielnie hostowany Mattermost pod adresem prywatnym/LAN/tailnet: wychodzące żądania do API Mattermost przechodzą przez zabezpieczenie przed SSRF, które domyślnie blokuje prywatne i wewnętrzne adresy IP. Włącz tę możliwość za pomocą `channels.mattermost.network.dangerouslyAllowPrivateNetwork: true` (dla poszczególnych kont: `channels.mattermost.accounts.<id>.network.dangerouslyAllowPrivateNetwork`).
</Note>

## Natywne polecenia z ukośnikiem

Natywne polecenia z ukośnikiem wymagają jawnego włączenia. Po ich włączeniu OpenClaw rejestruje polecenia z ukośnikiem `oc_*` w każdym zespole, do którego należy bot, i odbiera zwrotne żądania POST na serwerze HTTP Gateway.

```json5
{
  channels: {
    mattermost: {
      commands: {
        native: true,
        nativeSkills: true,
        callbackPath: "/api/channels/mattermost/command",
        // Użyj, gdy Mattermost nie może połączyć się bezpośrednio z Gateway (odwrotne proxy/publiczny adres URL).
        callbackUrl: "https://gateway.example.com/api/channels/mattermost/command",
      },
    },
  },
}
```

Zarejestrowane polecenia: `/oc_status`, `/oc_model`, `/oc_models`, `/oc_new`, `/oc_help`, `/oc_think`, `/oc_reasoning`, `/oc_verbose`, `/oc_queue`. Gdy `nativeSkills: true`, polecenia Skills są również rejestrowane jako `/oc_<skill>`.

<AccordionGroup>
  <Accordion title="Uwagi dotyczące działania">
    - Domyślną wartością `native` i `nativeSkills` jest `"auto"`, co w przypadku Mattermost oznacza wyłączenie. Ustaw je jawnie na `true`.
    - Domyślną wartością `callbackPath` jest `/api/channels/mattermost/command`.
    - Jeśli pominięto `callbackUrl`, OpenClaw tworzy `http://<gateway.customBindHost lub localhost>:<gateway.port, domyślnie 18789><callbackPath>`. Symbole wieloznaczne adresów nasłuchiwania (`0.0.0.0`, `::`) są zastępowane przez `localhost`.
    - W konfiguracjach z wieloma kontami `commands` można ustawić na najwyższym poziomie lub w `channels.mattermost.accounts.<id>.commands` (wartości konta zastępują pola najwyższego poziomu).
    - Istniejące polecenia z ukośnikiem z tym samym wyzwalaczem, utworzone przez inne integracje, pozostają niezmienione (rejestracja je pomija); polecenia utworzone przez bota są aktualizowane lub tworzone ponownie, gdy zmieni się adres URL wywołania zwrotnego.
    - Wywołania zwrotne poleceń są weryfikowane za pomocą tokenów poszczególnych poleceń zwróconych przez Mattermost, gdy OpenClaw rejestruje polecenia `oc_*`.
    - Przed zaakceptowaniem każdego wywołania zwrotnego OpenClaw odświeża bieżącą rejestrację poleceń Mattermost, dlatego nieaktualne tokeny usuniętych lub ponownie wygenerowanych poleceń z ukośnikiem przestają być akceptowane bez ponownego uruchamiania Gateway.
    - Walidacja wywołania zwrotnego zostaje bezpiecznie odrzucona, jeśli API Mattermost nie może potwierdzić, że polecenie jest nadal aktualne; nieudane walidacje są krótko przechowywane w pamięci podręcznej, równoczesne wyszukiwania są scalane, a rozpoczynanie nowych wyszukiwań jest ograniczane częstotliwościowo dla każdego polecenia, aby ograniczyć presję związaną z ponawianiem.
    - Wywołania zwrotne poleceń z ukośnikiem zostają bezpiecznie odrzucone, gdy rejestracja nie powiodła się, uruchamianie było częściowe lub token wywołania zwrotnego nie odpowiada zarejestrowanemu tokenowi rozpoznanego polecenia (token ważny dla jednego polecenia nie może przejść do walidacji nadrzędnej dla innego polecenia).
    - Zaakceptowane wywołania zwrotne są potwierdzane efemeryczną odpowiedzią „Przetwarzanie...”; właściwa odpowiedź pojawia się jako zwykła wiadomość.

  </Accordion>
  <Accordion title="Wymaganie dotyczące osiągalności">
    Punkt końcowy wywołania zwrotnego musi być osiągalny z serwera Mattermost.

    - Nie ustawiaj `callbackUrl` na `localhost`, chyba że Mattermost działa na tym samym hoście lub w tej samej przestrzeni nazw sieci co OpenClaw.
    - Nie ustawiaj `callbackUrl` na bazowy adres URL Mattermost, chyba że ten adres URL przekazuje przez odwrotne proxy `/api/channels/mattermost/command` do OpenClaw.
    - Szybki test to `curl https://<gateway-host>/api/channels/mattermost/command`; żądanie GET powinno zwrócić z OpenClaw odpowiedź `405 Method Not Allowed`, a nie `404`.

  </Accordion>
  <Accordion title="Lista dozwolonych połączeń wychodzących Mattermost">
    Jeśli wywołanie zwrotne jest kierowane na adresy prywatne/tailnet/wewnętrzne, ustaw `ServiceSettings.AllowedUntrustedInternalConnections` w Mattermost tak, aby obejmowało host lub domenę wywołania zwrotnego.

    Używaj wpisów hostów lub domen, a nie pełnych adresów URL.

    - Poprawnie: `gateway.tailnet-name.ts.net`
    - Niepoprawnie: `https://gateway.tailnet-name.ts.net`

  </Accordion>
</AccordionGroup>

## Zmienne środowiskowe (konto domyślne)

Jeśli wolisz zmienne środowiskowe, ustaw je na hoście Gateway:

- `MATTERMOST_BOT_TOKEN=...`
- `MATTERMOST_URL=https://chat.example.com`

<Note>
Zmienne środowiskowe dotyczą tylko konta **domyślnego** (`default`). Inne konta muszą używać wartości konfiguracji.

Zmiennej `MATTERMOST_URL` nie można ustawić z pliku `.env` obszaru roboczego; zobacz [Pliki .env obszaru roboczego](/pl/gateway/security).
</Note>

## Tryby czatu

Mattermost automatycznie odpowiada na wiadomości bezpośrednie. Zachowaniem w kanałach steruje `chatmode`:

<Tabs>
  <Tab title="oncall (domyślnie)">
    Odpowiadaj w kanałach tylko po wzmiance @.
  </Tab>
  <Tab title="onmessage">
    Odpowiadaj na każdą wiadomość w kanale.
  </Tab>
  <Tab title="onchar">
    Odpowiadaj, gdy wiadomość zaczyna się od prefiksu wyzwalającego.
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

- `onchar` nadal odpowiada na jawne wzmianki @.
- Ustawienie `channels.mattermost.requireMention` jest nadal respektowane, ale preferowane jest `chatmode`. Ustawienia `groups.<channelId>.requireMention` dla poszczególnych kanałów mają pierwszeństwo przed oboma.
- Gdy bot wyśle widoczną odpowiedź w wątku kanału, kolejne wiadomości w tym samym wątku otrzymują odpowiedzi bez nowej wzmianki @ ani prefiksu `onchar`, dzięki czemu wieloetapowe rozmowy w wątku mogą być płynnie kontynuowane. Uczestnictwo jest zapamiętywane przez 7 dni od ostatniej odpowiedzi bota w danym wątku i zachowywane po ponownym uruchomieniu Gateway. Nie dotyczy to wątków, które bot tylko obserwował; rozpocznij nową wiadomość najwyższego poziomu, aby ponownie wymagać jawnej wzmianki.

## Wątki i sesje

Użyj `channels.mattermost.replyToMode`, aby określić, czy odpowiedzi w kanałach i grupach pozostają w głównym kanale, czy rozpoczynają wątek pod postem wyzwalającym.

- `off` (domyślnie): odpowiadaj w wątku tylko wtedy, gdy przychodzący post już się w nim znajduje.
- `first`: w przypadku postów najwyższego poziomu w kanałach lub grupach rozpocznij wątek pod tym postem i skieruj rozmowę do sesji przypisanej do wątku.
- `all` i `batched`: obecnie w Mattermost działają tak samo jak `first`, ponieważ po utworzeniu korzenia wątku kolejne fragmenty i multimedia są przesyłane dalej w tym samym wątku.
- Wiadomości bezpośrednie domyślnie używają `off`, nawet gdy ustawiono `replyToMode`.

Użyj `channels.mattermost.replyToModeByChatType`, aby zastąpić tryb dla czatów `direct`, `group` lub `channel`. Ustaw `direct`, aby włączyć wątki dla wiadomości bezpośrednich:

- `off` (domyślnie): wiadomości bezpośrednie pozostają bez wątków w jednej ciągłej sesji.
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

- Sesje przypisane do wątku używają identyfikatora postu wyzwalającego jako korzenia wątku.
- `first` i `all` są obecnie równoważne, ponieważ po utworzeniu korzenia wątku w Mattermost kolejne fragmenty i multimedia są przesyłane dalej w tym samym wątku.
- Ustawienia zastępujące dla poszczególnych typów czatu mają pierwszeństwo przed `replyToMode`. Bez ustawienia zastępującego `direct` istniejące wdrożenia zachowują płaskie wiadomości bezpośrednie bez wątków.

## Kontrola dostępu (wiadomości bezpośrednie)

- Domyślnie: `channels.mattermost.dmPolicy = "pairing"` (nieznani nadawcy otrzymują kod parowania). Inne wartości: `allowlist`, `open`, `disabled`.
- Zatwierdź za pomocą:
  - `openclaw pairing list mattermost`
  - `openclaw pairing approve mattermost <CODE>`
- Publiczne wiadomości bezpośrednie: `channels.mattermost.dmPolicy="open"` oraz `channels.mattermost.allowFrom=["*"]` (schemat konfiguracji wymusza symbol wieloznaczny).
- `channels.mattermost.allowFrom` przyjmuje identyfikatory użytkowników (zalecane) oraz wpisy `accessGroup:<name>`. Zobacz [Grupy dostępu](/pl/channels/access-groups).

## Kanały (grupy)

- Domyślnie: `channels.mattermost.groupPolicy = "allowlist"` (wymagana wzmianka).
- Dodaj nadawców do listy dozwolonych za pomocą `channels.mattermost.groupAllowFrom` (zalecane są identyfikatory użytkowników).
- `channels.mattermost.groupAllowFrom` przyjmuje wpisy `accessGroup:<name>`. Zobacz [Grupy dostępu](/pl/channels/access-groups).
- Ustawienia zastępujące wymaganie wzmianki dla poszczególnych kanałów znajdują się w `channels.mattermost.groups.<channelId>.requireMention`, a ustawienie domyślne w `channels.mattermost.groups["*"].requireMention`.
- Dopasowywanie `@username` jest zmienne i zostaje włączone tylko wtedy, gdy `channels.mattermost.dangerouslyAllowNameMatching: true`.
- Otwarte kanały: `channels.mattermost.groupPolicy="open"` (wymagana wzmianka).
- Kolejność rozstrzygania: `channels.mattermost.groupPolicy`, następnie `channels.defaults.groupPolicy`, a potem `"allowlist"`.
- Uwaga dotycząca środowiska wykonawczego: jeśli całkowicie brakuje sekcji `channels.mattermost`, środowisko wykonawcze bezpiecznie przyjmuje `groupPolicy="allowlist"` podczas sprawdzania grup (nawet jeśli ustawiono `channels.defaults.groupPolicy`) i jednorazowo zapisuje ostrzeżenie w dzienniku.

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

Używaj tych formatów celów z `openclaw message send` albo cron/Webhook:

| Cel                                 | Miejsce dostarczenia                                            |
| ----------------------------------- | --------------------------------------------------------------- |
| `channel:<id>`                      | Kanał według identyfikatora                                     |
| `channel:<name>` lub `#channel-name` | Kanał według nazwy, wyszukiwany we wszystkich zespołach bota    |
| `user:<id>` lub `mattermost:<id>`    | Wiadomość bezpośrednia do tego użytkownika                       |
| `@username`                         | Wiadomość bezpośrednia (nazwa użytkownika rozpoznawana przez API Mattermost) |

Wysyłanie wychodzące obsługuje najwyżej jeden załącznik na wiadomość; podziel wiele plików na osobne wysłania.

<Warning>
Same nieprzezroczyste identyfikatory (takie jak `64ifufp...`) są w Mattermost **niejednoznaczne** (identyfikator użytkownika lub identyfikator kanału).

OpenClaw rozpoznaje je **najpierw jako użytkownika**:

- Jeśli identyfikator istnieje jako użytkownik (`GET /api/v4/users/<id>` kończy się powodzeniem), OpenClaw wysyła **wiadomość bezpośrednią**, rozpoznając kanał bezpośredni przez `/api/v4/channels/direct`.
- W przeciwnym razie identyfikator jest traktowany jako **identyfikator kanału**.

Jeśli potrzebujesz deterministycznego działania, zawsze używaj jawnych prefiksów (`user:<id>` / `channel:<id>`).
</Warning>

## Ponawianie dla kanału wiadomości bezpośrednich

Gdy OpenClaw wysyła wiadomość do celu wiadomości bezpośredniej Mattermost i najpierw musi rozpoznać kanał bezpośredni, domyślnie ponawia próbę po przejściowych błędach tworzenia kanału bezpośredniego.

Użyj `channels.mattermost.dmChannelRetry`, aby globalnie dostosować to zachowanie dla pluginu Mattermost, albo `channels.mattermost.accounts.<id>.dmChannelRetry` dla jednego konta. Wartości domyślne:

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

- Dotyczy to wyłącznie tworzenia kanału wiadomości prywatnych (`/api/v4/channels/direct`), a nie każdego wywołania API Mattermost.
- Ponowienia wykorzystują wykładnicze zwiększanie opóźnienia z losowym rozproszeniem i dotyczą błędów przejściowych, takich jak limity częstotliwości, odpowiedzi 5xx oraz błędy sieciowe lub przekroczenia limitu czasu.
- Błędy klienta 4xx inne niż `429` są traktowane jako trwałe i nie są ponawiane.

## Strumieniowanie podglądu

Mattermost przesyła strumieniowo proces myślenia, aktywność narzędzi i częściowy tekst odpowiedzi do **roboczego wpisu podglądu**, który jest finalizowany w miejscu, gdy wysłanie ostatecznej odpowiedzi jest bezpieczne. W trybie `partial` podgląd jest aktualizowany we wpisie o tym samym identyfikatorze, zamiast zaśmiecać kanał osobnymi wiadomościami dla każdego fragmentu. W trybie `block` podgląd przełącza się między ukończonym tekstem a blokami aktywności narzędzi, dzięki czemu wcześniejsze bloki pozostają widoczne jako osobne wpisy, zamiast być zastępowane przez kolejny. Ostateczne odpowiedzi zawierające multimedia lub błędy anulują oczekujące edycje podglądu i korzystają ze zwykłego dostarczania, zamiast publikować zbędny wpis podglądu.

Strumieniowanie podglądu jest **domyślnie włączone** w trybie `partial`. Skonfiguruj je za pomocą `channels.mattermost.streaming` (ciągu znaków określającego tryb, wartości logicznej lub obiektu takiego jak `{ mode: "progress" }`):

```json5
{
  channels: {
    mattermost: {
      streaming: "partial", // wyłączone | częściowe | blokowe | postęp
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Tryby strumieniowania">
    - `partial` (domyślny): jeden wpis podglądu, który jest edytowany wraz z rozbudowywaniem odpowiedzi, a następnie finalizowany pełną odpowiedzią.
    - `block` przełącza podgląd między ukończonym tekstem a blokami aktywności narzędzi, dzięki czemu każdy blok pozostaje widoczny jako osobny wpis, zamiast być zastępowany w miejscu. Równoległe i następujące po sobie aktualizacje narzędzi współdzielą bieżący wpis aktywności narzędzi.
    - `progress` wyświetla podgląd stanu podczas generowania i publikuje ostateczną odpowiedź dopiero po zakończeniu.
    - `off` wyłącza strumieniowanie podglądu. Przy `blockStreaming: true` ukończone bloki asystenta są nadal dostarczane jako zwykłe odpowiedzi blokowe (osobne wpisy), a nie jako pojedynczy scalony wpis końcowy.

  </Accordion>
  <Accordion title="Uwagi dotyczące działania strumieniowania">
    - Jeśli strumienia nie można sfinalizować w miejscu (na przykład wpis został usunięty w trakcie strumieniowania), OpenClaw awaryjnie wysyła nowy wpis końcowy, aby odpowiedź nigdy nie została utracona.
    - Ładunki zawierające wyłącznie proces myślenia są pomijane we wpisach kanału, w tym tekst przychodzący jako cytat blokowy `> Thinking`. Ustaw `/reasoning on`, aby wyświetlać proces myślenia w innych interfejsach; końcowy wpis Mattermost zawiera wyłącznie odpowiedź.
    - Macierz mapowania kanałów znajduje się w sekcji [Strumieniowanie](/pl/concepts/streaming#preview-streaming-modes).

  </Accordion>
</AccordionGroup>

## Reakcje (narzędzie wiadomości)

- Użyj `message action=react` z `channel=mattermost`.
- `messageId` jest identyfikatorem wpisu Mattermost.
- `emoji` przyjmuje nazwy takie jak `thumbsup` lub `:+1:` (dwukropki są opcjonalne).
- Ustaw `remove=true` (wartość logiczna), aby usunąć reakcję.
- Zdarzenia dodania lub usunięcia reakcji są przekazywane jako zdarzenia systemowe do sesji agenta, do której skierowano wiadomość, i podlegają tym samym kontrolom zasad wiadomości prywatnych i grupowych co wiadomości.

Przykłady:

```text
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup remove=true
```

Konfiguracja:

- `channels.mattermost.actions.reactions`: włącza lub wyłącza działania reakcji (domyślnie `true`).
- Nadpisanie dla konkretnego konta: `channels.mattermost.accounts.<id>.actions.reactions`.

## Interaktywne przyciski (narzędzie wiadomości)

Wysyłaj wiadomości z klikalnymi przyciskami. Gdy użytkownik kliknie przycisk, agent otrzymuje wybór i może odpowiedzieć.

Przyciski pochodzą z semantycznego ładunku `presentation` (w zwykłych odpowiedziach agenta i w `message action=send`). OpenClaw renderuje przyciski z wartościami jako interaktywne przyciski Mattermost, pozostawia przyciski URL widoczne w tekście wiadomości i upraszcza menu wyboru do czytelnego tekstu.

```text
message action=send channel=mattermost target=channel:<channelId> presentation={"blocks":[{"type":"buttons","buttons":[{"label":"Yes","value":"yes"},{"label":"No","value":"no"}]}]}
```

Pola przycisków prezentacji:

<ParamField path="label" type="string" required>
  Wyświetlana etykieta (alias: `text`).
</ParamField>
<ParamField path="value" type="string">
  Wartość odsyłana po kliknięciu, używana jako identyfikator działania (aliasy: `callback_data`, `callbackData`). Wymagana dla klikalnego przycisku, chyba że ustawiono `url`.
</ParamField>
<ParamField path="url" type="string">
  Przycisk odsyłacza; renderowany w treści wiadomości jako tekst `label: url`, a nie jako interaktywny przycisk.
</ParamField>
<ParamField path="style" type='"primary" | "secondary" | "success" | "danger"'>
  Styl przycisku. Mattermost stosuje domyślny styl do wartości, których nie obsługuje.
</ParamField>

Aby zadeklarować obsługę przycisków w monicie systemowym agenta, dodaj `inlineButtons` do możliwości kanału:

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
    Osoba klikająca musi przejść te same kontrole zasad wiadomości prywatnych i grupowych co nadawca wiadomości; nieautoryzowane kliknięcia powodują wyświetlenie tymczasowego powiadomienia i są ignorowane.
  </Step>
  <Step title="Zastąpienie przycisków potwierdzeniem">
    Wszystkie przyciski są zastępowane wierszem potwierdzenia (np. „✓ **Tak** wybrane przez @user”).
  </Step>
  <Step title="Agent otrzymuje wybór">
    Agent otrzymuje wybór jako wiadomość przychodzącą (wraz ze zdarzeniem systemowym) i odpowiada.
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Uwagi dotyczące implementacji">
    - Wywołania zwrotne przycisków używają weryfikacji HMAC-SHA256 (automatycznej, niewymagającej konfiguracji).
    - Po kliknięciu zastępowany jest cały blok załącznika, dlatego wszystkie przyciski są usuwane razem — częściowe usunięcie nie jest możliwe.
    - Identyfikatory działań zawierające łączniki lub podkreślenia są automatycznie oczyszczane (ograniczenie routingu Mattermost).
    - Kliknięcia, których `action_id` nie odpowiada działaniu w pierwotnym wpisie, są odrzucane z kodem `403` („Nieznane działanie”).

  </Accordion>
  <Accordion title="Konfiguracja i osiągalność">
    - `channels.mattermost.capabilities`: tablica ciągów znaków określających możliwości. Dodaj `"inlineButtons"`, aby włączyć opis narzędzia przycisków w monicie systemowym agenta.
    - `channels.mattermost.interactions.callbackBaseUrl`: opcjonalny zewnętrzny bazowy adres URL wywołań zwrotnych przycisków (na przykład `https://gateway.example.com`). Użyj go, gdy Mattermost nie może bezpośrednio połączyć się z Gateway pod adresem hosta nasłuchu.
    - W konfiguracjach z wieloma kontami możesz również ustawić to samo pole w `channels.mattermost.accounts.<id>.interactions.callbackBaseUrl`.
    - Jeśli `interactions.callbackBaseUrl` zostanie pominięte, OpenClaw wyprowadza adres URL wywołania zwrotnego z `gateway.customBindHost` + `gateway.port` (domyślnie 18789), a następnie awaryjnie używa `http://localhost:<port>`. Ścieżka wywołania zwrotnego to `/mattermost/interactions/<accountId>`.
    - Reguła osiągalności: adres URL wywołania zwrotnego przycisku musi być osiągalny z serwera Mattermost. `localhost` działa tylko wtedy, gdy Mattermost i OpenClaw działają na tym samym hoście lub w tej samej przestrzeni nazw sieci.
    - `channels.mattermost.interactions.allowedSourceIps`: lista dozwolonych źródłowych adresów IP dla wywołań zwrotnych przycisków. Bez niej akceptowane są wyłącznie źródła local loopback (`127.0.0.1`, `::1`), dlatego zdalny serwer Mattermost musi zostać dodany do tej listy, w przeciwnym razie jego kliknięcia zostaną odrzucone z kodem `403`. W przypadku działania za odwrotnym serwerem proxy ustaw również `gateway.trustedProxies`, aby rzeczywisty adres IP klienta był ustalany z przekazanych nagłówków.
    - Jeśli cel wywołania zwrotnego jest prywatny, znajduje się w sieci tailnet lub sieci wewnętrznej, dodaj jego host lub domenę do `ServiceSettings.AllowedUntrustedInternalConnections` w Mattermost.

  </Accordion>
</AccordionGroup>

### Bezpośrednia integracja z API (skrypty zewnętrzne)

Skrypty zewnętrzne i webhooki mogą publikować przyciski bezpośrednio przez interfejs REST API Mattermost, zamiast korzystać z narzędzia `message` agenta. W miarę możliwości używaj `buildButtonAttachments()` z pluginu; jeśli publikujesz surowy JSON, przestrzegaj następujących reguł:

**Struktura ładunku:**

```json5
{
  channel_id: "<channelId>",
  message: "Choose an option:",
  props: {
    attachments: [
      {
        actions: [
          {
            id: "mybutton01", // alphanumeric only - see below
            type: "button", // required, or clicks are silently ignored
            name: "Approve", // display label
            style: "primary", // optional: "default", "primary", "danger"
            integration: {
              url: "https://gateway.example.com/mattermost/interactions/default",
              context: {
                action_id: "mybutton01", // must match button id
                action: "approve",
                // ... any custom fields ...
                _token: "<hmac>", // see HMAC section below
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

1. Załączniki należy umieścić w `props.attachments`, a nie w `attachments` najwyższego poziomu (w przeciwnym razie są po cichu ignorowane).
2. Każde działanie wymaga `type: "button"` — bez tego kliknięcia są po cichu pomijane.
3. Każde działanie wymaga pola `id` — Mattermost ignoruje działania bez identyfikatorów.
4. `id` działania musi zawierać **wyłącznie znaki alfanumeryczne** (`[a-zA-Z0-9]`). Łączniki i podkreślenia zakłócają routing działań po stronie serwera Mattermost (zwracany jest kod 404). Usuń je przed użyciem.
5. `context.action_id` musi odpowiadać `id` przycisku; Gateway odrzuca kliknięcia, których `action_id` nie istnieje we wpisie.
6. `context.action_id` jest wymagane — bez niego procedura obsługi interakcji zwraca kod 400.
7. Źródłowy adres IP wywołania zwrotnego musi być dozwolony (zobacz `interactions.allowedSourceIps` powyżej).

</Warning>

**Generowanie tokenu HMAC**

Gateway weryfikuje kliknięcia przycisków za pomocą HMAC-SHA256. Skrypty zewnętrzne muszą generować tokeny zgodne z logiką weryfikacji Gateway:

<Steps>
  <Step title="Wyprowadź sekret z tokenu bota">
    `HMAC-SHA256(key="openclaw-mattermost-interactions", data=botToken)`, zakodowany szesnastkowo.
  </Step>
  <Step title="Utwórz obiekt kontekstu">
    Utwórz obiekt kontekstu ze wszystkimi polami **z wyjątkiem** `_token`.
  </Step>
  <Step title="Serializuj z posortowanymi kluczami">
    Serializuj z **rekurencyjnie posortowanymi kluczami** i **bez spacji** (Gateway również kanonizuje zagnieżdżone obiekty i generuje zwarty JSON).
  </Step>
  <Step title="Podpisz ładunek">
    `HMAC-SHA256(key=secret, data=serializedContext)`
  </Step>
  <Step title="Dodaj token">
    Dodaj wynikowy skrót szesnastkowy jako `_token` w kontekście.
  </Step>
</Steps>

Przykład w języku Python:

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
  <Accordion title="Typowe pułapki związane z HMAC">
    - Funkcja `json.dumps` języka Python domyślnie dodaje spacje (`{"key": "val"}`). Użyj `separators=(",", ":")`, aby uzyskać zgodność ze zwartym wynikiem JavaScript (`{"key":"val"}`).
    - Zawsze podpisuj **wszystkie** pola kontekstu (z wyjątkiem `_token`). Gateway usuwa `_token`, a następnie podpisuje całą pozostałą zawartość. Podpisanie podzbioru powoduje cichy błąd weryfikacji.
    - Użyj `sort_keys=True` — Gateway sortuje klucze przed podpisaniem, a Mattermost może zmienić kolejność pól kontekstu podczas przechowywania ładunku.
    - Wyprowadź sekret z tokenu bota (deterministycznie), a nie z losowych bajtów. Sekret musi być taki sam w procesie tworzącym przyciski i weryfikującym je Gateway.

  </Accordion>
</AccordionGroup>

## Adapter katalogu

Plugin Mattermost zawiera adapter katalogu, który rozpoznaje nazwy kanałów i użytkowników za pośrednictwem API Mattermost. Umożliwia to używanie celów `#channel-name` i `@username` w poleceniu `openclaw message send` oraz dostarczanie za pomocą Cron i webhooków.

Konfiguracja nie jest wymagana — adapter używa tokenu bota z konfiguracji konta.

## Wiele kont

Mattermost obsługuje wiele kont w `channels.mattermost.accounts`:

```json5
{
  channels: {
    mattermost: {
      accounts: {
        default: { name: "Główne", botToken: "mm-token", baseUrl: "https://chat.example.com" },
        alerts: { name: "Alerty", botToken: "mm-token-2", baseUrl: "https://alerts.example.com" },
      },
    },
  },
}
```

Wartości konta zastępują pola najwyższego poziomu; `channels.mattermost.defaultAccount` określa konto używane, gdy nie wskazano żadnego.

## Rozwiązywanie problemów

<AccordionGroup>
  <Accordion title="Brak odpowiedzi na kanałach">
    Upewnij się, że bot znajduje się na kanale, i wspomnij o nim (oncall), użyj prefiksu wyzwalającego (onchar) albo ustaw `chatmode: "onmessage"`.
  </Accordion>
  <Accordion title="Błędy uwierzytelniania lub obsługi wielu kont">
    - Sprawdź token bota, bazowy adres URL oraz czy konto jest włączone.
    - Problemy z wieloma kontami: zmienne środowiskowe dotyczą tylko konta `default`.
    - Prywatne/lokalne hosty Mattermost wymagają ustawienia `network.dangerouslyAllowPrivateNetwork: true` (ochrona przed SSRF domyślnie blokuje prywatne adresy IP).

  </Accordion>
  <Accordion title="Natywne polecenia z ukośnikiem nie działają">
    - `Unauthorized: invalid command token.`: OpenClaw nie zaakceptował tokenu wywołania zwrotnego. Typowe przyczyny:
      - rejestracja poleceń z ukośnikiem nie powiodła się lub została ukończona tylko częściowo podczas uruchamiania
      - wywołanie zwrotne trafia do niewłaściwego Gateway lub konta
      - Mattermost nadal ma stare polecenia wskazujące poprzedni cel wywołania zwrotnego
      - Gateway został ponownie uruchomiony bez ponownego aktywowania poleceń z ukośnikiem
    - Jeśli natywne polecenia z ukośnikiem przestaną działać, sprawdź, czy w dziennikach występuje `mattermost: failed to register slash commands` lub `mattermost: native slash commands enabled but no commands could be registered`.
    - Jeśli pominięto `callbackUrl`, a dzienniki ostrzegają, że wywołanie zwrotne zostało rozpoznane jako adres URL local loopback, na przykład `http://localhost:18789/...`, ten adres URL jest prawdopodobnie dostępny tylko wtedy, gdy Mattermost działa na tym samym hoście lub w tej samej przestrzeni nazw sieci co OpenClaw. Zamiast tego ustaw jawny, dostępny z zewnątrz adres `commands.callbackUrl`.

  </Accordion>
  <Accordion title="Problemy z przyciskami">
    - Przyciski są wyświetlane jako białe pola albo nie są wyświetlane wcale: dane przycisku są nieprawidłowe. Każdy przycisk prezentacji wymaga pól `label` i `value` (przyciski bez któregokolwiek z nich są pomijane).
    - Przyciski są wyświetlane, ale kliknięcia niczego nie powodują: sprawdź, czy Gateway jest dostępny z serwera Mattermost, adres IP serwera Mattermost znajduje się w `channels.mattermost.interactions.allowedSourceIps` (bez tego akceptowany jest tylko local loopback), a `ServiceSettings.AllowedUntrustedInternalConnections` zawiera host wywołania zwrotnego dla celów prywatnych.
    - Kliknięcie przycisku zwraca błąd 404: `id` przycisku prawdopodobnie zawiera łączniki lub znaki podkreślenia. Router akcji Mattermost nie obsługuje identyfikatorów zawierających znaki inne niż alfanumeryczne. Używaj wyłącznie `[a-zA-Z0-9]`.
    - Gateway rejestruje w dziennikach `rejected callback source`: kliknięcie pochodziło z adresu IP spoza `interactions.allowedSourceIps`. Dodaj serwer Mattermost lub punkt wejściowy do listy dozwolonych i ustaw `gateway.trustedProxies`, jeśli używasz odwrotnego serwera proxy.
    - Gateway rejestruje w dziennikach `invalid _token`: niezgodność HMAC. Sprawdź, czy podpisujesz wszystkie pola kontekstu (a nie tylko ich podzbiór), używasz posortowanych kluczy oraz zwartego formatu JSON (bez spacji). Zobacz sekcję dotyczącą HMAC powyżej.
    - Gateway rejestruje w dziennikach `missing _token in context`: pole `_token` nie znajduje się w kontekście przycisku. Upewnij się, że jest ono uwzględniane podczas tworzenia ładunku integracji.
    - Gateway odrzuca kliknięcie z komunikatem `Unknown action`: `context.action_id` nie odpowiada żadnemu `id` akcji we wpisie. Ustaw oba na tę samą oczyszczoną wartość.
    - Agent nie oferuje przycisków: dodaj `capabilities: ["inlineButtons"]` do konfiguracji kanału Mattermost.

  </Accordion>
</AccordionGroup>

## Powiązane

- [Trasowanie kanałów](/pl/channels/channel-routing) — trasowanie sesji dla wiadomości
- [Przegląd kanałów](/pl/channels) — wszystkie obsługiwane kanały
- [Grupy](/pl/channels/groups) — działanie czatów grupowych i wymóg wzmianek
- [Parowanie](/pl/channels/pairing) — uwierzytelnianie w wiadomościach prywatnych i proces parowania
- [Bezpieczeństwo](/pl/gateway/security) — model dostępu i wzmacnianie zabezpieczeń
