---
read_when:
    - Konfigurowanie Mattermost
    - Debugowanie routingu Mattermost
sidebarTitle: Mattermost
summary: Konfiguracja bota Mattermost i OpenClaw
title: Mattermost
x-i18n:
    generated_at: "2026-05-02T09:43:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: 319af8ba1cb8ff1aa5b52a57e809e6c76d3723012dc9cae7c456b89687dd6810
    source_path: channels/mattermost.md
    workflow: 16
---

Status: Plugin do pobrania (token bota + zdarzenia WebSocket). Obsługiwane są kanały, grupy i wiadomości DM. Mattermost to platforma komunikacji zespołowej do samodzielnego hostowania; szczegóły produktu i pliki do pobrania znajdziesz na oficjalnej stronie [mattermost.com](https://mattermost.com).

## Instalacja

Zainstaluj Mattermost przed skonfigurowaniem kanału:

<Tabs>
  <Tab title="Rejestr npm">
    ```bash
    openclaw plugins install @openclaw/mattermost
    ```
  </Tab>
  <Tab title="Lokalny checkout">
    ```bash
    openclaw plugins install ./path/to/local/mattermost-plugin
    ```
  </Tab>
</Tabs>

Szczegóły: [Pluginy](/pl/tools/plugin)

## Szybka konfiguracja

<Steps>
  <Step title="Upewnij się, że Plugin jest dostępny">
    Aktualne pakietowane wydania OpenClaw już go zawierają. Starsze/niestandardowe instalacje mogą dodać go ręcznie za pomocą powyższych poleceń.
  </Step>
  <Step title="Utwórz bota Mattermost">
    Utwórz konto bota Mattermost i skopiuj **token bota**.
  </Step>
  <Step title="Skopiuj bazowy URL">
    Skopiuj **bazowy URL** Mattermost (np. `https://chat.example.com`).
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

  </Step>
</Steps>

## Natywne polecenia slash

Natywne polecenia slash są opcjonalne. Po włączeniu OpenClaw rejestruje polecenia slash `oc_*` przez API Mattermost i odbiera zwrotne żądania POST na serwerze HTTP Gateway.

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
  <Accordion title="Uwagi dotyczące zachowania">
    - `native: "auto"` domyślnie jest wyłączone dla Mattermost. Ustaw `native: true`, aby włączyć.
    - Jeśli `callbackUrl` zostanie pominięty, OpenClaw wyprowadza go z hosta/portu Gateway + `callbackPath`.
    - W konfiguracjach z wieloma kontami `commands` można ustawić na najwyższym poziomie albo pod `channels.mattermost.accounts.<id>.commands` (wartości konta zastępują pola najwyższego poziomu).
    - Callbacki poleceń są sprawdzane za pomocą tokenów przypisanych do poleceń, zwracanych przez Mattermost, gdy OpenClaw rejestruje polecenia `oc_*`.
    - OpenClaw odświeża bieżącą rejestrację poleceń Mattermost przed zaakceptowaniem każdego callbacku, dzięki czemu nieaktualne tokeny z usuniętych lub ponownie wygenerowanych poleceń slash przestają być akceptowane bez restartu Gateway.
    - Walidacja callbacku kończy się odmową, jeśli API Mattermost nie może potwierdzić, że polecenie nadal jest aktualne; nieudane walidacje są krótko buforowane, równoczesne wyszukiwania są łączone, a rozpoczęcia świeżych wyszukiwań są ograniczane częstotliwościowo per polecenie, aby ograniczyć presję powtórzeń.
    - Callbacki slash kończą się odmową, gdy rejestracja się nie powiodła, uruchomienie było częściowe albo token callbacku nie pasuje do zarejestrowanego tokena rozwiązanego polecenia (token ważny dla jednego polecenia nie może przejść do walidacji upstream dla innego polecenia).

  </Accordion>
  <Accordion title="Wymóg osiągalności">
    Endpoint callbacku musi być osiągalny z serwera Mattermost.

    - Nie ustawiaj `callbackUrl` na `localhost`, chyba że Mattermost działa na tym samym hoście/przestrzeni nazw sieci co OpenClaw.
    - Nie ustawiaj `callbackUrl` na bazowy URL Mattermost, chyba że ten URL reverse-proxyzuje `/api/channels/mattermost/command` do OpenClaw.
    - Szybki test to `curl https://<gateway-host>/api/channels/mattermost/command`; żądanie GET powinno zwrócić z OpenClaw `405 Method Not Allowed`, a nie `404`.

  </Accordion>
  <Accordion title="Lista dozwolonych połączeń wychodzących Mattermost">
    Jeśli callback wskazuje adresy prywatne/tailnet/wewnętrzne, ustaw w Mattermost `ServiceSettings.AllowedUntrustedInternalConnections`, aby obejmowało host/domenę callbacku.

    Używaj wpisów hosta/domeny, nie pełnych URL-i.

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

`MATTERMOST_URL` nie można ustawić z pliku `.env` workspace; zobacz [Pliki `.env` workspace](/pl/gateway/security).
</Note>

## Tryby czatu

Mattermost automatycznie odpowiada na wiadomości DM. Zachowanie kanału kontroluje `chatmode`:

<Tabs>
  <Tab title="oncall (domyślnie)">
    Odpowiadaj tylko po @wspomnieniu w kanałach.
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

- `onchar` nadal odpowiada na jawne @wspomnienia.
- `channels.mattermost.requireMention` jest respektowane dla starszych konfiguracji, ale preferowane jest `chatmode`.

## Wątki i sesje

Użyj `channels.mattermost.replyToMode`, aby kontrolować, czy odpowiedzi w kanałach i grupach pozostają w głównym kanale, czy rozpoczynają wątek pod postem wyzwalającym.

- `off` (domyślnie): odpowiadaj w wątku tylko wtedy, gdy przychodzący post już w nim jest.
- `first`: dla postów najwyższego poziomu w kanałach/grupach rozpocznij wątek pod tym postem i kieruj rozmowę do sesji ograniczonej do wątku.
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

- Sesje ograniczone do wątku używają identyfikatora postu wyzwalającego jako korzenia wątku.
- `first` i `all` są obecnie równoważne, ponieważ gdy Mattermost ma korzeń wątku, kolejne fragmenty i multimedia są kontynuowane w tym samym wątku.

## Kontrola dostępu (DM)

- Domyślnie: `channels.mattermost.dmPolicy = "pairing"` (nieznani nadawcy otrzymują kod parowania).
- Zatwierdź przez:
  - `openclaw pairing list mattermost`
  - `openclaw pairing approve mattermost <CODE>`
- Publiczne DM: `channels.mattermost.dmPolicy="open"` plus `channels.mattermost.allowFrom=["*"]`.

## Kanały (grupy)

- Domyślnie: `channels.mattermost.groupPolicy = "allowlist"` (z bramką wzmianki).
- Dodaj nadawców do listy dozwolonych za pomocą `channels.mattermost.groupAllowFrom` (zalecane identyfikatory użytkowników).
- Nadpisania wzmianki per kanał znajdują się pod `channels.mattermost.groups.<channelId>.requireMention` albo `channels.mattermost.groups["*"].requireMention` jako ustawienie domyślne.
- Dopasowywanie `@username` jest zmienne i włączone tylko przy `channels.mattermost.dangerouslyAllowNameMatching: true`.
- Otwarte kanały: `channels.mattermost.groupPolicy="open"` (z bramką wzmianki).
- Uwaga runtime: jeśli `channels.mattermost` całkowicie brakuje, runtime wraca do `groupPolicy="allowlist"` dla kontroli grup (nawet jeśli ustawiono `channels.defaults.groupPolicy`).

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

Używaj tych formatów celów z `openclaw message send` albo cron/webhooks:

- `channel:<id>` dla kanału
- `user:<id>` dla DM
- `@username` dla DM (rozwiązywane przez API Mattermost)

<Warning>
Gołe nieprzezroczyste identyfikatory (jak `64ifufp...`) są **niejednoznaczne** w Mattermost (ID użytkownika kontra ID kanału).

OpenClaw rozwiązuje je **najpierw jako użytkownika**:

- Jeśli ID istnieje jako użytkownik (`GET /api/v4/users/<id>` się powiedzie), OpenClaw wysyła **DM**, rozwiązując kanał bezpośredni przez `/api/v4/channels/direct`.
- W przeciwnym razie ID jest traktowane jako **ID kanału**.

Jeśli potrzebujesz deterministycznego zachowania, zawsze używaj jawnych prefiksów (`user:<id>` / `channel:<id>`).
</Warning>

## Ponawianie kanału DM

Gdy OpenClaw wysyła do celu DM Mattermost i musi najpierw rozwiązać kanał bezpośredni, domyślnie ponawia przejściowe błędy tworzenia kanału bezpośredniego.

Użyj `channels.mattermost.dmChannelRetry`, aby dostroić to zachowanie globalnie dla Pluginu Mattermost, albo `channels.mattermost.accounts.<id>.dmChannelRetry` dla jednego konta.

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

- Dotyczy to tylko tworzenia kanału DM (`/api/v4/channels/direct`), nie każdego wywołania API Mattermost.
- Ponowienia dotyczą przejściowych błędów, takich jak limity szybkości, odpowiedzi 5xx oraz błędy sieci lub przekroczenia czasu.
- Błędy klienta 4xx inne niż `429` są traktowane jako trwałe i nie są ponawiane.

## Strumieniowanie podglądu

Mattermost strumieniuje myślenie, aktywność narzędzi i częściowy tekst odpowiedzi do jednego **roboczego posta podglądu**, który finalizuje się w miejscu, gdy ostateczną odpowiedź można bezpiecznie wysłać. Podgląd aktualizuje ten sam identyfikator posta zamiast zasypywać kanał wiadomościami dla każdego fragmentu. Finalne multimedia/błędy anulują oczekujące edycje podglądu i używają normalnego dostarczania zamiast opróżniania jednorazowego posta podglądu.

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
  <Accordion title="Tryby strumieniowania">
    - `partial` to zwykle właściwy wybór: jeden post podglądu, który jest edytowany wraz ze wzrostem odpowiedzi, a następnie finalizowany kompletną odpowiedzią.
    - `block` używa fragmentów roboczych dopisywanych wewnątrz posta podglądu.
    - `progress` pokazuje podgląd statusu podczas generowania i publikuje ostateczną odpowiedź dopiero po zakończeniu.
    - `off` wyłącza strumieniowanie podglądu.

  </Accordion>
  <Accordion title="Uwagi dotyczące zachowania strumieniowania">
    - Jeśli strumienia nie można sfinalizować w miejscu (na przykład post został usunięty w trakcie strumienia), OpenClaw wraca do wysłania świeżego posta finalnego, aby odpowiedź nigdy nie zginęła.
    - Ładunki zawierające tylko rozumowanie są pomijane w postach kanału, w tym tekst przychodzący jako cytat blokowy `> Reasoning:`. Ustaw `/reasoning on`, aby widzieć myślenie w innych powierzchniach; finalny post Mattermost zachowuje tylko odpowiedź.
    - Zobacz [Strumieniowanie](/pl/concepts/streaming#preview-streaming-modes), aby poznać macierz mapowania kanałów.

  </Accordion>
</AccordionGroup>

## Reakcje (narzędzie wiadomości)

- Użyj `message action=react` z `channel=mattermost`.
- `messageId` to identyfikator posta Mattermost.
- `emoji` akceptuje nazwy takie jak `thumbsup` albo `:+1:` (dwukropki są opcjonalne).
- Ustaw `remove=true` (boolean), aby usunąć reakcję.
- Zdarzenia dodania/usunięcia reakcji są przekazywane jako zdarzenia systemowe do kierowanej sesji agenta.

Przykłady:

```
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup remove=true
```

Konfiguracja:

- `channels.mattermost.actions.reactions`: włącz/wyłącz akcje reakcji (domyślnie true).
- Nadpisanie per konto: `channels.mattermost.accounts.<id>.actions.reactions`.

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

Użyj `message action=send` z parametrem `buttons`. Przyciski są tablicą 2D (wierszami przycisków):

```
message action=send channel=mattermost target=channel:<channelId> buttons=[[{"text":"Yes","callback_data":"yes"},{"text":"No","callback_data":"no"}]]
```

Pola przycisku:

<ParamField path="text" type="string" required>
  Etykieta wyświetlana.
</ParamField>
<ParamField path="callback_data" type="string" required>
  Wartość odsyłana po kliknięciu (używana jako identyfikator akcji).
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
  <Accordion title="Uwagi implementacyjne">
    - Wywołania zwrotne przycisków używają weryfikacji HMAC-SHA256 (automatycznie, bez wymaganej konfiguracji).
    - Mattermost usuwa dane wywołania zwrotnego z odpowiedzi API (funkcja bezpieczeństwa), więc po kliknięciu usuwane są wszystkie przyciski — częściowe usunięcie nie jest możliwe.
    - Identyfikatory akcji zawierające łączniki lub podkreślenia są automatycznie sanityzowane (ograniczenie routingu Mattermost).

  </Accordion>
  <Accordion title="Konfiguracja i osiągalność">
    - `channels.mattermost.capabilities`: tablica ciągów możliwości. Dodaj `"inlineButtons"`, aby włączyć opis narzędzia przycisków w systemowym prompcie agenta.
    - `channels.mattermost.interactions.callbackBaseUrl`: opcjonalny zewnętrzny bazowy URL dla wywołań zwrotnych przycisków (na przykład `https://gateway.example.com`). Użyj tego, gdy Mattermost nie może bezpośrednio osiągnąć gateway pod jego hostem wiązania.
    - W konfiguracjach z wieloma kontami możesz też ustawić to samo pole pod `channels.mattermost.accounts.<id>.interactions.callbackBaseUrl`.
    - Jeśli `interactions.callbackBaseUrl` zostanie pominięte, OpenClaw wyprowadza URL wywołania zwrotnego z `gateway.customBindHost` + `gateway.port`, a następnie przechodzi awaryjnie na `http://localhost:<port>`.
    - Reguła osiągalności: URL wywołania zwrotnego przycisku musi być osiągalny z serwera Mattermost. `localhost` działa tylko wtedy, gdy Mattermost i OpenClaw działają na tym samym hoście/przestrzeni nazw sieci.
    - Jeśli cel wywołania zwrotnego jest prywatny/tailnet/wewnętrzny, dodaj jego host/domenę do `ServiceSettings.AllowedUntrustedInternalConnections` w Mattermost.

  </Accordion>
</AccordionGroup>

### Bezpośrednia integracja API (zewnętrzne skrypty)

Zewnętrzne skrypty i webhooki mogą publikować przyciski bezpośrednio przez REST API Mattermost zamiast przechodzić przez narzędzie `message` agenta. Gdy to możliwe, użyj `buildButtonAttachments()` z pluginu; jeśli publikujesz surowy JSON, stosuj te reguły:

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
            id: "mybutton01", // alphanumeric only — see below
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
**Krytyczne reguły**

1. Załączniki trafiają do `props.attachments`, nie do `attachments` najwyższego poziomu (w przeciwnym razie są po cichu ignorowane).
2. Każda akcja wymaga `type: "button"` — bez tego kliknięcia są po cichu pochłaniane.
3. Każda akcja wymaga pola `id` — Mattermost ignoruje akcje bez identyfikatorów.
4. `id` akcji musi być **wyłącznie alfanumeryczne** (`[a-zA-Z0-9]`). Łączniki i podkreślenia psują serwerowy routing akcji Mattermost (zwraca 404). Usuń je przed użyciem.
5. `context.action_id` musi pasować do `id` przycisku, aby komunikat potwierdzenia pokazywał nazwę przycisku (np. „Approve”) zamiast surowego identyfikatora.
6. `context.action_id` jest wymagane — bez niego procedura obsługi interakcji zwraca 400.

</Warning>

**Generowanie tokenu HMAC**

Gateway weryfikuje kliknięcia przycisków za pomocą HMAC-SHA256. Zewnętrzne skrypty muszą generować tokeny zgodne z logiką weryfikacji Gateway:

<Steps>
  <Step title="Wyprowadź sekret z tokenu bota">
    `HMAC-SHA256(key="openclaw-mattermost-interactions", data=botToken)`
  </Step>
  <Step title="Zbuduj obiekt kontekstu">
    Zbuduj obiekt kontekstu ze wszystkimi polami **oprócz** `_token`.
  </Step>
  <Step title="Serializuj z posortowanymi kluczami">
    Serializuj z **posortowanymi kluczami** i **bez spacji** (Gateway używa `JSON.stringify` z posortowanymi kluczami, co daje zwarty wynik).
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
    - Pythonowe `json.dumps` domyślnie dodaje spacje (`{"key": "val"}`). Użyj `separators=(",", ":")`, aby dopasować zwarty wynik JavaScriptu (`{"key":"val"}`).
    - Zawsze podpisuj **wszystkie** pola kontekstu (minus `_token`). Gateway usuwa `_token`, a następnie podpisuje wszystko, co pozostało. Podpisanie podzbioru powoduje ciche niepowodzenie weryfikacji.
    - Użyj `sort_keys=True` — Gateway sortuje klucze przed podpisaniem, a Mattermost może zmienić kolejność pól kontekstu podczas przechowywania ładunku.
    - Wyprowadź sekret z tokenu bota (deterministycznie), nie z losowych bajtów. Sekret musi być taki sam w procesie, który tworzy przyciski, i w Gateway, który je weryfikuje.

  </Accordion>
</AccordionGroup>

## Adapter katalogu

Plugin Mattermost zawiera adapter katalogu, który rozwiązuje nazwy kanałów i użytkowników przez API Mattermost. Umożliwia to używanie celów `#channel-name` i `@username` w `openclaw message send` oraz dostarczaniu przez cron/webhook.

Konfiguracja nie jest potrzebna — adapter używa tokenu bota z konfiguracji konta.

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
    Upewnij się, że bot jest w kanale, i wspomnij o nim (oncall), użyj prefiksu wyzwalacza (onchar) albo ustaw `chatmode: "onmessage"`.
  </Accordion>
  <Accordion title="Błędy uwierzytelniania lub wielu kont">
    - Sprawdź token bota, bazowy URL i to, czy konto jest włączone.
    - Problemy z wieloma kontami: zmienne środowiskowe dotyczą tylko konta `default`.

  </Accordion>
  <Accordion title="Natywne polecenia slash nie działają">
    - `Unauthorized: invalid command token.`: OpenClaw nie zaakceptował tokenu wywołania zwrotnego. Typowe przyczyny:
      - rejestracja polecenia slash nie powiodła się lub została ukończona tylko częściowo przy uruchomieniu
      - wywołanie zwrotne trafia do niewłaściwego gateway/konta
      - Mattermost nadal ma stare polecenia wskazujące poprzedni cel wywołania zwrotnego
      - Gateway został ponownie uruchomiony bez reaktywacji poleceń slash
    - Jeśli natywne polecenia slash przestaną działać, sprawdź w logach `mattermost: failed to register slash commands` albo `mattermost: native slash commands enabled but no commands could be registered`.
    - Jeśli `callbackUrl` zostanie pominięty, a logi ostrzegają, że wywołanie zwrotne rozwiązało się do `http://127.0.0.1:18789/...`, ten URL jest prawdopodobnie osiągalny tylko wtedy, gdy Mattermost działa na tym samym hoście/przestrzeni nazw sieci co OpenClaw. Zamiast tego ustaw jawny, zewnętrznie osiągalny `commands.callbackUrl`.

  </Accordion>
  <Accordion title="Problemy z przyciskami">
    - Przyciski pojawiają się jako białe pola: agent może wysyłać źle sformatowane dane przycisków. Sprawdź, czy każdy przycisk ma pola `text` i `callback_data`.
    - Przyciski się renderują, ale kliknięcia nic nie robią: sprawdź, czy `AllowedUntrustedInternalConnections` w konfiguracji serwera Mattermost zawiera `127.0.0.1 localhost` oraz czy `EnablePostActionIntegration` ma wartość `true` w ServiceSettings.
    - Przyciski zwracają 404 po kliknięciu: `id` przycisku prawdopodobnie zawiera łączniki lub podkreślenia. Router akcji Mattermost psuje się na identyfikatorach niealfanumerycznych. Używaj wyłącznie `[a-zA-Z0-9]`.
    - Logi Gateway pokazują `invalid _token`: niezgodność HMAC. Sprawdź, czy podpisujesz wszystkie pola kontekstu (nie podzbiór), używasz posortowanych kluczy i zwartego JSON (bez spacji). Zobacz sekcję HMAC powyżej.
    - Logi Gateway pokazują `missing _token in context`: pola `_token` nie ma w kontekście przycisku. Upewnij się, że jest dołączane podczas budowania ładunku integracji.
    - Potwierdzenie pokazuje surowy identyfikator zamiast nazwy przycisku: `context.action_id` nie pasuje do `id` przycisku. Ustaw oba na tę samą sanityzowaną wartość.
    - Agent nie wie o przyciskach: dodaj `capabilities: ["inlineButtons"]` do konfiguracji kanału Mattermost.

  </Accordion>
</AccordionGroup>

## Powiązane

- [Routing kanałów](/pl/channels/channel-routing) — routing sesji dla wiadomości
- [Omówienie kanałów](/pl/channels) — wszystkie obsługiwane kanały
- [Grupy](/pl/channels/groups) — zachowanie czatu grupowego i blokowanie bramkowane wzmiankami
- [Parowanie](/pl/channels/pairing) — uwierzytelnianie DM i przepływ parowania
- [Bezpieczeństwo](/pl/gateway/security) — model dostępu i wzmacnianie zabezpieczeń
