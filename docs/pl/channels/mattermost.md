---
read_when:
    - Konfigurowanie Mattermost
    - Debugowanie routingu Mattermost
sidebarTitle: Mattermost
summary: Konfiguracja bota Mattermost i konfiguracja OpenClaw
title: Mattermost
x-i18n:
    generated_at: "2026-05-06T09:03:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: 784138a30529971b4f80a1a764eef8992f6a8290a6032e34abae864e52dc212b
    source_path: channels/mattermost.md
    workflow: 16
---

Status: Plugin do pobrania (token bota + zdarzenia WebSocket). Obsługiwane są kanały, grupy i wiadomości DM. Mattermost to platforma do zespołowej komunikacji, którą można hostować samodzielnie; szczegóły produktu i pliki do pobrania znajdziesz na oficjalnej stronie [mattermost.com](https://mattermost.com).

## Instalacja

Zainstaluj Mattermost przed skonfigurowaniem kanału:

<Tabs>
  <Tab title="npm registry">
    ```bash
    openclaw plugins install @openclaw/mattermost
    ```
  </Tab>
  <Tab title="Local checkout">
    ```bash
    openclaw plugins install ./path/to/local/mattermost-plugin
    ```
  </Tab>
</Tabs>

Szczegóły: [Plugins](/pl/tools/plugin)

## Szybka konfiguracja

<Steps>
  <Step title="Ensure plugin is available">
    Bieżące pakietowane wydania OpenClaw już go zawierają. Starsze lub niestandardowe instalacje mogą dodać go ręcznie za pomocą powyższych poleceń.
  </Step>
  <Step title="Create a Mattermost bot">
    Utwórz konto bota Mattermost i skopiuj **token bota**.
  </Step>
  <Step title="Copy the base URL">
    Skopiuj **bazowy URL** Mattermost (np. `https://chat.example.com`).
  </Step>
  <Step title="Configure OpenClaw and start the gateway">
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

  </Step>
</Steps>

## Natywne polecenia slash

Natywne polecenia slash są opcjonalne. Po włączeniu OpenClaw rejestruje polecenia slash `oc_*` przez API Mattermost i odbiera żądania zwrotne POST na serwerze HTTP Gateway.

```json5
{
  channels: {
    mattermost: {
      commands: {
        native: true,
        nativeSkills: true,
        callbackPath: "/api/channels/mattermost/command",
        // Use when Mattermost cannot reach the gateway directly (reverse proxy/public URL).
        callbackUrl: "https://gateway.example.com/api/channels/mattermost/command",
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Behavior notes">
    - `native: "auto"` domyślnie jest wyłączone dla Mattermost. Ustaw `native: true`, aby włączyć.
    - Jeśli `callbackUrl` zostanie pominięty, OpenClaw wyprowadzi go z hosta/portu Gateway + `callbackPath`.
    - W konfiguracjach z wieloma kontami `commands` można ustawić na najwyższym poziomie albo pod `channels.mattermost.accounts.<id>.commands` (wartości konta zastępują pola najwyższego poziomu).
    - Żądania zwrotne poleceń są weryfikowane za pomocą tokenów poszczególnych poleceń zwróconych przez Mattermost, gdy OpenClaw rejestruje polecenia `oc_*`.
    - OpenClaw odświeża bieżącą rejestrację poleceń Mattermost przed zaakceptowaniem każdego żądania zwrotnego, więc nieaktualne tokeny z usuniętych lub ponownie wygenerowanych poleceń slash przestają być akceptowane bez restartu Gateway.
    - Walidacja żądania zwrotnego jest domyślnie odrzucana, jeśli API Mattermost nie może potwierdzić, że polecenie jest nadal aktualne; nieudane walidacje są krótko buforowane, równoczesne wyszukiwania są łączone, a rozpoczęcia świeżych wyszukiwań są limitowane według polecenia, aby ograniczyć presję powtórek.
    - Żądania zwrotne slash są odrzucane, gdy rejestracja się nie powiodła, uruchomienie było częściowe albo token żądania zwrotnego nie pasuje do zarejestrowanego tokenu rozpoznanego polecenia (token ważny dla jednego polecenia nie może przejść walidacji upstream dla innego polecenia).

  </Accordion>
  <Accordion title="Reachability requirement">
    Punkt końcowy żądania zwrotnego musi być osiągalny z serwera Mattermost.

    - Nie ustawiaj `callbackUrl` na `localhost`, chyba że Mattermost działa na tym samym hoście/przestrzeni nazw sieci co OpenClaw.
    - Nie ustawiaj `callbackUrl` na bazowy URL Mattermost, chyba że ten URL przekierowuje przez reverse proxy `/api/channels/mattermost/command` do OpenClaw.
    - Szybki test to `curl https://<gateway-host>/api/channels/mattermost/command`; GET powinien zwrócić z OpenClaw `405 Method Not Allowed`, a nie `404`.

  </Accordion>
  <Accordion title="Mattermost egress allowlist">
    Jeśli żądanie zwrotne wskazuje adresy prywatne/tailnet/wewnętrzne, ustaw Mattermost `ServiceSettings.AllowedUntrustedInternalConnections` tak, aby zawierało host/domenę żądania zwrotnego.

    Użyj wpisów hosta/domeny, a nie pełnych URL-i.

    - Dobrze: `gateway.tailnet-name.ts.net`
    - Źle: `https://gateway.tailnet-name.ts.net`

  </Accordion>
</AccordionGroup>

## Zmienne środowiskowe (konto domyślne)

Ustaw je na hoście Gateway, jeśli wolisz zmienne środowiskowe:

- `MATTERMOST_BOT_TOKEN=...`
- `MATTERMOST_URL=https://chat.example.com`

<Note>
Zmienne środowiskowe dotyczą tylko konta **domyślnego** (`default`). Inne konta muszą używać wartości konfiguracyjnych.

`MATTERMOST_URL` nie można ustawić z pliku `.env` obszaru roboczego; zobacz [Pliki `.env` obszaru roboczego](/pl/gateway/security).
</Note>

## Tryby czatu

Mattermost odpowiada na DM-y automatycznie. Zachowaniem kanału steruje `chatmode`:

<Tabs>
  <Tab title="oncall (default)">
    Odpowiadaj tylko po @wzmiance w kanałach.
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
      oncharPrefixes: [">", "!"],
    },
  },
}
```

Uwagi:

- `onchar` nadal odpowiada na jawne @wzmianki.
- `channels.mattermost.requireMention` jest respektowane dla starszych konfiguracji, ale preferowane jest `chatmode`.

## Wątki i sesje

Użyj `channels.mattermost.replyToMode`, aby kontrolować, czy odpowiedzi w kanałach i grupach pozostają w głównym kanale, czy rozpoczynają wątek pod postem wyzwalającym.

- `off` (domyślnie): odpowiadaj w wątku tylko wtedy, gdy przychodzący post już w nim jest.
- `first`: dla postów najwyższego poziomu w kanale/grupie rozpocznij wątek pod tym postem i przekieruj rozmowę do sesji ograniczonej do wątku.
- `all`: obecnie takie samo zachowanie jak `first` dla Mattermost.
- Wiadomości bezpośrednie ignorują to ustawienie i pozostają bez wątków.

Przykład konfiguracji:

```json5
{
  channels: {
    mattermost: {
      replyToMode: "all",
    },
  },
}
```

Uwagi:

- Sesje ograniczone do wątku używają identyfikatora posta wyzwalającego jako korzenia wątku.
- `first` i `all` są obecnie równoważne, ponieważ gdy Mattermost ma korzeń wątku, kolejne fragmenty i media są kontynuowane w tym samym wątku.

## Kontrola dostępu (DM-y)

- Domyślnie: `channels.mattermost.dmPolicy = "pairing"` (nieznani nadawcy otrzymują kod parowania).
- Zatwierdzanie przez:
  - `openclaw pairing list mattermost`
  - `openclaw pairing approve mattermost <CODE>`
- Publiczne DM-y: `channels.mattermost.dmPolicy="open"` plus `channels.mattermost.allowFrom=["*"]`.

## Kanały (grupy)

- Domyślnie: `channels.mattermost.groupPolicy = "allowlist"` (bramkowane wzmianką).
- Dodaj nadawców do listy dozwolonych przez `channels.mattermost.groupAllowFrom` (zalecane identyfikatory użytkowników).
- Zastąpienia wzmianek dla poszczególnych kanałów znajdują się pod `channels.mattermost.groups.<channelId>.requireMention` albo `channels.mattermost.groups["*"].requireMention` jako wartość domyślna.
- Dopasowywanie `@username` jest zmienne i włączone tylko wtedy, gdy `channels.mattermost.dangerouslyAllowNameMatching: true`.
- Otwarte kanały: `channels.mattermost.groupPolicy="open"` (bramkowane wzmianką).
- Uwaga dotycząca środowiska uruchomieniowego: jeśli `channels.mattermost` całkowicie brakuje, środowisko uruchomieniowe używa awaryjnie `groupPolicy="allowlist"` dla kontroli grup (nawet jeśli ustawiono `channels.defaults.groupPolicy`).

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

## Cele dla dostarczania wychodzącego

Użyj tych formatów celów z `openclaw message send` albo cron/webhooks:

- `channel:<id>` dla kanału
- `user:<id>` dla DM
- `@username` dla DM (rozpoznawane przez API Mattermost)

<Warning>
Same nieprzezroczyste identyfikatory (takie jak `64ifufp...`) są **niejednoznaczne** w Mattermost (identyfikator użytkownika vs identyfikator kanału).

OpenClaw rozpoznaje je **najpierw jako użytkownika**:

- Jeśli identyfikator istnieje jako użytkownik (`GET /api/v4/users/<id>` się powiedzie), OpenClaw wysyła **DM**, rozpoznając kanał bezpośredni przez `/api/v4/channels/direct`.
- W przeciwnym razie identyfikator jest traktowany jako **identyfikator kanału**.

Jeśli potrzebujesz deterministycznego zachowania, zawsze używaj jawnych prefiksów (`user:<id>` / `channel:<id>`).
</Warning>

## Ponawianie kanału DM

Gdy OpenClaw wysyła do celu DM Mattermost i musi najpierw rozpoznać kanał bezpośredni, domyślnie ponawia przejściowe błędy tworzenia kanału bezpośredniego.

Użyj `channels.mattermost.dmChannelRetry`, aby dostroić to zachowanie globalnie dla Plugin Mattermost, albo `channels.mattermost.accounts.<id>.dmChannelRetry` dla jednego konta.

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

- Dotyczy to tylko tworzenia kanału DM (`/api/v4/channels/direct`), a nie każdego wywołania API Mattermost.
- Ponowienia dotyczą przejściowych błędów, takich jak limity szybkości, odpowiedzi 5xx oraz błędy sieci lub przekroczenia czasu.
- Błędy klienta 4xx inne niż `429` są traktowane jako trwałe i nie są ponawiane.

## Strumieniowanie podglądu

Mattermost strumieniuje myślenie, aktywność narzędzi i częściowy tekst odpowiedzi do jednego **roboczego posta podglądu**, który jest finalizowany w miejscu, gdy końcowa odpowiedź jest bezpieczna do wysłania. Podgląd jest aktualizowany na tym samym identyfikatorze posta zamiast zasypywać kanał wiadomościami dla każdego fragmentu. Końcowe wiadomości z mediami/błędami anulują oczekujące edycje podglądu i używają normalnego dostarczania zamiast opróżniać jednorazowy post podglądu.

Włącz przez `channels.mattermost.streaming`:

```json5
{
  channels: {
    mattermost: {
      streaming: "partial", // off | partial | block | progress
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Streaming modes">
    - `partial` to zwykły wybór: jeden post podglądu, który jest edytowany w miarę narastania odpowiedzi, a następnie finalizowany kompletną odpowiedzią.
    - `block` używa roboczych fragmentów w stylu dopisywania wewnątrz posta podglądu.
    - `progress` pokazuje podgląd statusu podczas generowania i publikuje końcową odpowiedź dopiero po zakończeniu.
    - `off` wyłącza strumieniowanie podglądu.

  </Accordion>
  <Accordion title="Streaming behavior notes">
    - Jeśli strumienia nie można sfinalizować w miejscu (na przykład post został usunięty w trakcie strumieniowania), OpenClaw awaryjnie wysyła świeży post końcowy, aby odpowiedź nigdy nie została utracona.
    - Ładunki zawierające tylko rozumowanie są ukrywane w postach kanału, w tym tekst przychodzący jako cytat blokowy `> Reasoning:`. Ustaw `/reasoning on`, aby widzieć myślenie w innych powierzchniach; końcowy post Mattermost zachowuje tylko odpowiedź.
    - Zobacz [Strumieniowanie](/pl/concepts/streaming#preview-streaming-modes), aby poznać macierz mapowania kanałów.

  </Accordion>
</AccordionGroup>

## Reakcje (narzędzie wiadomości)

- Użyj `message action=react` z `channel=mattermost`.
- `messageId` to identyfikator posta Mattermost.
- `emoji` przyjmuje nazwy takie jak `thumbsup` albo `:+1:` (dwukropki są opcjonalne).
- Ustaw `remove=true` (wartość logiczna), aby usunąć reakcję.
- Zdarzenia dodania/usunięcia reakcji są przekazywane jako zdarzenia systemowe do skierowanej sesji agenta.

Przykłady:

```
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup remove=true
```

Konfiguracja:

- `channels.mattermost.actions.reactions`: włącza/wyłącza akcje reakcji (domyślnie true).
- Zastąpienie dla konta: `channels.mattermost.accounts.<id>.actions.reactions`.

## Interaktywne przyciski (narzędzie wiadomości)

Wysyłaj wiadomości z klikalnymi przyciskami. Gdy użytkownik kliknie przycisk, agent otrzymuje wybór i może odpowiedzieć.

Włącz przyciski, dodając `inlineButtons` do możliwości kanału:

```json5
{
  channels: {
    mattermost: {
      capabilities: ["inlineButtons"],
    },
  },
}
```

Użyj `message action=send` z parametrem `buttons`. Przyciski są tablicą 2D (wiersze przycisków):

```
message action=send channel=mattermost target=channel:<channelId> buttons=[[{"text":"Yes","callback_data":"yes"},{"text":"No","callback_data":"no"}]]
```

Pola przycisków:

<ParamField path="text" type="string" required>
  Etykieta wyświetlana.
</ParamField>
<ParamField path="callback_data" type="string" required>
  Wartość odsyłana po kliknięciu (używana jako ID akcji).
</ParamField>
<ParamField path="style" type='"default" | "primary" | "danger"'>
  Styl przycisku.
</ParamField>

Gdy użytkownik kliknie przycisk:

<Steps>
  <Step title="Przyciski zastąpione potwierdzeniem">
    Wszystkie przyciski są zastępowane wierszem potwierdzenia (np. „✓ **Yes** selected by @user”).
  </Step>
  <Step title="Agent otrzymuje wybór">
    Agent otrzymuje wybór jako wiadomość przychodzącą i odpowiada.
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Uwagi dotyczące implementacji">
    - Callbacki przycisków używają weryfikacji HMAC-SHA256 (automatycznie, bez wymaganej konfiguracji).
    - Mattermost usuwa dane callbacku ze swoich odpowiedzi API (funkcja bezpieczeństwa), więc wszystkie przyciski są usuwane po kliknięciu - częściowe usunięcie nie jest możliwe.
    - ID akcji zawierające łączniki lub podkreślenia są automatycznie oczyszczane (ograniczenie routingu Mattermost).

  </Accordion>
  <Accordion title="Konfiguracja i osiągalność">
    - `channels.mattermost.capabilities`: tablica ciągów funkcji. Dodaj `"inlineButtons"`, aby włączyć opis narzędzia przycisków w systemowym prompcie agenta.
    - `channels.mattermost.interactions.callbackBaseUrl`: opcjonalny zewnętrzny bazowy URL dla callbacków przycisków (na przykład `https://gateway.example.com`). Użyj tego, gdy Mattermost nie może bezpośrednio połączyć się z gatewayem pod jego hostem wiązania.
    - W konfiguracjach z wieloma kontami możesz też ustawić to samo pole pod `channels.mattermost.accounts.<id>.interactions.callbackBaseUrl`.
    - Jeśli `interactions.callbackBaseUrl` zostanie pominięte, OpenClaw wyprowadza URL callbacku z `gateway.customBindHost` + `gateway.port`, a następnie wraca do `http://localhost:<port>`.
    - Reguła osiągalności: URL callbacku przycisku musi być osiągalny z serwera Mattermost. `localhost` działa tylko wtedy, gdy Mattermost i OpenClaw działają na tym samym hoście/przestrzeni nazw sieci.
    - Jeśli cel callbacku jest prywatny/tailnet/wewnętrzny, dodaj jego host/domenę do `ServiceSettings.AllowedUntrustedInternalConnections` Mattermost.

  </Accordion>
</AccordionGroup>

### Bezpośrednia integracja API (skrypty zewnętrzne)

Skrypty zewnętrzne i Webhooki mogą publikować przyciski bezpośrednio przez Mattermost REST API zamiast przez narzędzie `message` agenta. Gdy to możliwe, używaj `buildButtonAttachments()` z Plugin; jeśli publikujesz surowy JSON, przestrzegaj tych reguł:

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
                action_id: "mybutton01", // must match button id (for name lookup)
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

1. Załączniki trafiają do `props.attachments`, nie do `attachments` najwyższego poziomu (zostaną po cichu zignorowane).
2. Każda akcja wymaga `type: "button"` - bez tego kliknięcia są po cichu pochłaniane.
3. Każda akcja wymaga pola `id` - Mattermost ignoruje akcje bez ID.
4. `id` akcji musi być **wyłącznie alfanumeryczne** (`[a-zA-Z0-9]`). Łączniki i podkreślenia psują routing akcji po stronie serwera Mattermost (zwraca 404). Usuń je przed użyciem.
5. `context.action_id` musi odpowiadać `id` przycisku, aby wiadomość potwierdzająca pokazywała nazwę przycisku (np. „Approve”) zamiast surowego ID.
6. `context.action_id` jest wymagane - bez niego obsługa interakcji zwraca 400.

</Warning>

**Generowanie tokenu HMAC**

Gateway weryfikuje kliknięcia przycisków za pomocą HMAC-SHA256. Skrypty zewnętrzne muszą generować tokeny zgodne z logiką weryfikacji gatewaya:

<Steps>
  <Step title="Wyprowadź sekret z tokenu bota">
    `HMAC-SHA256(key="openclaw-mattermost-interactions", data=botToken)`
  </Step>
  <Step title="Zbuduj obiekt kontekstu">
    Zbuduj obiekt kontekstu ze wszystkimi polami **oprócz** `_token`.
  </Step>
  <Step title="Serializuj z posortowanymi kluczami">
    Serializuj z **posortowanymi kluczami** i **bez spacji** (gateway używa `JSON.stringify` z posortowanymi kluczami, co tworzy kompaktowe wyjście).
  </Step>
  <Step title="Podpisz ładunek">
    `HMAC-SHA256(key=secret, data=serializedContext)`
  </Step>
  <Step title="Dodaj token">
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
    - Pythonowe `json.dumps` domyślnie dodaje spacje (`{"key": "val"}`). Użyj `separators=(",", ":")`, aby dopasować kompaktowe wyjście JavaScript (`{"key":"val"}`).
    - Zawsze podpisuj **wszystkie** pola kontekstu (bez `_token`). Gateway usuwa `_token`, a następnie podpisuje wszystko, co pozostało. Podpisanie podzbioru powoduje cichą porażkę weryfikacji.
    - Użyj `sort_keys=True` - gateway sortuje klucze przed podpisaniem, a Mattermost może zmienić kolejność pól kontekstu podczas przechowywania ładunku.
    - Wyprowadź sekret z tokenu bota (deterministycznie), a nie z losowych bajtów. Sekret musi być taki sam w procesie tworzącym przyciski i w gatewayu, który je weryfikuje.

  </Accordion>
</AccordionGroup>

## Adapter katalogu

Plugin Mattermost zawiera adapter katalogu, który rozwiązuje nazwy kanałów i użytkowników przez Mattermost API. Umożliwia to używanie celów `#channel-name` i `@username` w `openclaw message send` oraz dostawach Cron/Webhook.

Konfiguracja nie jest potrzebna - adapter używa tokenu bota z konfiguracji konta.

## Wiele kont

Mattermost obsługuje wiele kont pod `channels.mattermost.accounts`:

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

## Rozwiązywanie problemów

<AccordionGroup>
  <Accordion title="Brak odpowiedzi w kanałach">
    Upewnij się, że bot jest w kanale, i wspomnij go (oncall), użyj prefiksu wyzwalacza (onchar) albo ustaw `chatmode: "onmessage"`.
  </Accordion>
  <Accordion title="Błędy uwierzytelniania lub wielu kont">
    - Sprawdź token bota, bazowy URL oraz czy konto jest włączone.
    - Problemy z wieloma kontami: zmienne środowiskowe dotyczą tylko konta `default`.

  </Accordion>
  <Accordion title="Natywne polecenia ukośnikowe zawodzą">
    - `Unauthorized: invalid command token.`: OpenClaw nie zaakceptował tokenu callbacku. Typowe przyczyny:
      - rejestracja polecenia ukośnikowego nie powiodła się lub została ukończona tylko częściowo podczas uruchamiania
      - callback trafia do niewłaściwego gatewaya/konta
      - Mattermost nadal ma stare polecenia wskazujące poprzedni cel callbacku
      - gateway został ponownie uruchomiony bez ponownej aktywacji poleceń ukośnikowych
    - Jeśli natywne polecenia ukośnikowe przestaną działać, sprawdź logi pod kątem `mattermost: failed to register slash commands` lub `mattermost: native slash commands enabled but no commands could be registered`.
    - Jeśli `callbackUrl` jest pominięte, a logi ostrzegają, że callback został rozwiązany do `http://127.0.0.1:18789/...`, ten URL prawdopodobnie jest osiągalny tylko wtedy, gdy Mattermost działa na tym samym hoście/przestrzeni nazw sieci co OpenClaw. Zamiast tego ustaw jawne, zewnętrznie osiągalne `commands.callbackUrl`.

  </Accordion>
  <Accordion title="Problemy z przyciskami">
    - Przyciski pojawiają się jako białe pola: agent może wysyłać nieprawidłowo sformowane dane przycisków. Sprawdź, czy każdy przycisk ma pola `text` i `callback_data`.
    - Przyciski są renderowane, ale kliknięcia nic nie robią: sprawdź, czy `AllowedUntrustedInternalConnections` w konfiguracji serwera Mattermost obejmuje `127.0.0.1 localhost` oraz czy `EnablePostActionIntegration` ma wartość `true` w ServiceSettings.
    - Przyciski zwracają 404 po kliknięciu: `id` przycisku prawdopodobnie zawiera łączniki lub podkreślenia. Router akcji Mattermost psuje się na ID niealfanumerycznych. Używaj tylko `[a-zA-Z0-9]`.
    - Logi gatewaya pokazują `invalid _token`: niezgodność HMAC. Sprawdź, czy podpisujesz wszystkie pola kontekstu (nie podzbiór), używasz posortowanych kluczy i kompaktowego JSON (bez spacji). Zobacz sekcję HMAC powyżej.
    - Logi gatewaya pokazują `missing _token in context`: pola `_token` nie ma w kontekście przycisku. Upewnij się, że jest dołączone podczas budowania ładunku integracji.
    - Potwierdzenie pokazuje surowe ID zamiast nazwy przycisku: `context.action_id` nie odpowiada `id` przycisku. Ustaw oba na tę samą oczyszczoną wartość.
    - Agent nie wie o przyciskach: dodaj `capabilities: ["inlineButtons"]` do konfiguracji kanału Mattermost.

  </Accordion>
</AccordionGroup>

## Powiązane

- [Routing kanałów](/pl/channels/channel-routing) - routing sesji dla wiadomości
- [Przegląd kanałów](/pl/channels) - wszystkie obsługiwane kanały
- [Grupy](/pl/channels/groups) - zachowanie czatu grupowego i bramkowanie wzmianek
- [Parowanie](/pl/channels/pairing) - uwierzytelnianie DM i przepływ parowania
- [Bezpieczeństwo](/pl/gateway/security) - model dostępu i wzmacnianie zabezpieczeń
