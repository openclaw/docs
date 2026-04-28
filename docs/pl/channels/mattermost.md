---
read_when:
    - Konfigurowanie Mattermost
    - Debugowanie trasowania Mattermost
sidebarTitle: Mattermost
summary: Konfiguracja bota Mattermost i konfiguracja OpenClaw
title: Mattermost
x-i18n:
    generated_at: "2026-04-26T11:23:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: 22916fcff2eeccf53055f2ebf60fc621d595991d0ca4cd148015b61cce09c52f
    source_path: channels/mattermost.md
    workflow: 15
---

Status: dołączony Plugin (token bota + zdarzenia WebSocket). Obsługiwane są kanały, grupy i wiadomości prywatne. Mattermost to platforma komunikacji zespołowej, którą można hostować samodzielnie; szczegóły produktu i pliki do pobrania znajdziesz na oficjalnej stronie [mattermost.com](https://mattermost.com).

## Dołączony Plugin

<Note>
Mattermost jest dostarczany jako dołączony Plugin w bieżących wydaniach OpenClaw, więc standardowe zbudowane pakiety nie wymagają osobnej instalacji.
</Note>

Jeśli używasz starszej kompilacji albo niestandardowej instalacji, która nie zawiera Mattermost, zainstaluj go ręcznie:

<Tabs>
  <Tab title="rejestr npm">
    ```bash
    openclaw plugins install @openclaw/mattermost
    ```
  </Tab>
  <Tab title="Lokalne repozytorium">
    ```bash
    openclaw plugins install ./path/to/local/mattermost-plugin
    ```
  </Tab>
</Tabs>

Szczegóły: [Plugins](/pl/tools/plugin)

## Szybka konfiguracja

<Steps>
  <Step title="Upewnij się, że Plugin jest dostępny">
    Bieżące pakietowane wydania OpenClaw już go zawierają. W starszych/niestandardowych instalacjach można dodać go ręcznie za pomocą powyższych poleceń.
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

Natywne polecenia slash są opcjonalne. Gdy są włączone, OpenClaw rejestruje polecenia slash `oc_*` przez API Mattermost i odbiera zwrotne żądania POST na serwerze HTTP Gateway.

```json5
{
  channels: {
    mattermost: {
      commands: {
        native: true,
        nativeSkills: true,
        callbackPath: "/api/channels/mattermost/command",
        // Użyj, gdy Mattermost nie może bezpośrednio dotrzeć do Gateway (reverse proxy/publiczny URL).
        callbackUrl: "https://gateway.example.com/api/channels/mattermost/command",
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Uwagi o działaniu">
    - `native: "auto"` domyślnie jest wyłączone dla Mattermost. Ustaw `native: true`, aby włączyć.
    - Jeśli pominięto `callbackUrl`, OpenClaw wyprowadza go z hosta/portu Gateway + `callbackPath`.
    - W konfiguracjach z wieloma kontami `commands` można ustawić na najwyższym poziomie albo w `channels.mattermost.accounts.<id>.commands` (wartości konta zastępują pola najwyższego poziomu).
    - Zwrotne wywołania poleceń są weryfikowane za pomocą tokenów per polecenie zwracanych przez Mattermost, gdy OpenClaw rejestruje polecenia `oc_*`.
    - Zwrotne wywołania slash domyślnie kończą się odmową, gdy rejestracja się nie powiodła, uruchomienie było częściowe albo token callbacku nie pasuje do żadnego z zarejestrowanych poleceń.
  </Accordion>
  <Accordion title="Wymaganie osiągalności">
    Endpoint callbacku musi być osiągalny z serwera Mattermost.

    - Nie ustawiaj `callbackUrl` na `localhost`, chyba że Mattermost działa na tym samym hoście / w tej samej przestrzeni nazw sieci co OpenClaw.
    - Nie ustawiaj `callbackUrl` na bazowy URL Mattermost, chyba że ten URL przez reverse proxy przekazuje `/api/channels/mattermost/command` do OpenClaw.
    - Szybki test to `curl https://<gateway-host>/api/channels/mattermost/command`; żądanie GET powinno zwrócić z OpenClaw `405 Method Not Allowed`, a nie `404`.

  </Accordion>
  <Accordion title="Lista dozwolonych połączeń wychodzących Mattermost">
    Jeśli callback kieruje do adresów prywatnych/tailnet/wewnętrznych, ustaw `ServiceSettings.AllowedUntrustedInternalConnections` w Mattermost tak, aby zawierało host/domenę callbacku.

    Używaj wpisów hosta/domeny, a nie pełnych URL-i.

    - Dobrze: `gateway.tailnet-name.ts.net`
    - Źle: `https://gateway.tailnet-name.ts.net`

  </Accordion>
</AccordionGroup>

## Zmienne środowiskowe (konto domyślne)

Ustaw je na hoście Gateway, jeśli wolisz zmienne środowiskowe:

- `MATTERMOST_BOT_TOKEN=...`
- `MATTERMOST_URL=https://chat.example.com`

<Note>
Zmienne środowiskowe mają zastosowanie tylko do konta **domyślnego** (`default`). Inne konta muszą używać wartości z konfiguracji.

`MATTERMOST_URL` nie można ustawić z poziomu roboczego `.env`; zobacz [Pliki `.env` workspace](/pl/gateway/security).
</Note>

## Tryby czatu

Mattermost odpowiada automatycznie na wiadomości prywatne. Zachowanie kanałów kontroluje `chatmode`:

<Tabs>
  <Tab title="oncall (domyślnie)">
    Odpowiada tylko po wzmiance @ w kanałach.
  </Tab>
  <Tab title="onmessage">
    Odpowiada na każdą wiadomość kanałową.
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
      oncharPrefixes: [">", "!"],
    },
  },
}
```

Uwagi:

- `onchar` nadal odpowiada na jawne wzmianki @.
- `channels.mattermost.requireMention` jest honorowane w starszych konfiguracjach, ale preferowane jest `chatmode`.

## Wątki i sesje

Użyj `channels.mattermost.replyToMode`, aby określić, czy odpowiedzi w kanałach i grupach pozostają w głównym kanale, czy rozpoczynają wątek pod postem wyzwalającym.

- `off` (domyślnie): odpowiada w wątku tylko wtedy, gdy przychodzący post już się w nim znajduje.
- `first`: dla postów najwyższego poziomu w kanałach/grupach rozpoczyna wątek pod tym postem i kieruje rozmowę do sesji o zakresie wątku.
- `all`: obecnie w Mattermost działa tak samo jak `first`.
- Wiadomości prywatne ignorują to ustawienie i pozostają niewątkowane.

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

- Sesje o zakresie wątku używają identyfikatora posta wyzwalającego jako korzenia wątku.
- `first` i `all` są obecnie równoważne, ponieważ gdy Mattermost ma już korzeń wątku, kolejne fragmenty i multimedia są kontynuowane w tym samym wątku.

## Kontrola dostępu (wiadomości prywatne)

- Domyślnie: `channels.mattermost.dmPolicy = "pairing"` (nieznani nadawcy otrzymują kod parowania).
- Zatwierdzanie przez:
  - `openclaw pairing list mattermost`
  - `openclaw pairing approve mattermost <CODE>`
- Publiczne wiadomości prywatne: `channels.mattermost.dmPolicy="open"` plus `channels.mattermost.allowFrom=["*"]`.

## Kanały (grupy)

- Domyślnie: `channels.mattermost.groupPolicy = "allowlist"` (z kontrolą przez wzmianki).
- Dodawaj nadawców do listy dozwolonych przez `channels.mattermost.groupAllowFrom` (zalecane identyfikatory użytkowników).
- Nadpisania wzmianki per kanał znajdują się w `channels.mattermost.groups.<channelId>.requireMention` albo w `channels.mattermost.groups["*"].requireMention` jako ustawienie domyślne.
- Dopasowywanie `@username` jest zmienne i włączane tylko wtedy, gdy `channels.mattermost.dangerouslyAllowNameMatching: true`.
- Otwarte kanały: `channels.mattermost.groupPolicy="open"` (z kontrolą przez wzmianki).
- Uwaga wykonawcza: jeśli `channels.mattermost` całkowicie nie istnieje, środowisko wykonawcze wraca do `groupPolicy="allowlist"` przy sprawdzaniu grup (nawet jeśli ustawiono `channels.defaults.groupPolicy`).

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

Używaj tych formatów celu z `openclaw message send` albo z Cron/Webhookami:

- `channel:<id>` dla kanału
- `user:<id>` dla wiadomości prywatnej
- `@username` dla wiadomości prywatnej (rozwiązywane przez API Mattermost)

<Warning>
Surowe nieprzezroczyste identyfikatory (takie jak `64ifufp...`) są w Mattermost **niejednoznaczne** (identyfikator użytkownika vs identyfikator kanału).

OpenClaw rozwiązuje je **najpierw jako użytkownika**:

- Jeśli identyfikator istnieje jako użytkownik (`GET /api/v4/users/<id>` kończy się powodzeniem), OpenClaw wysyła **wiadomość prywatną** przez rozwiązanie kanału bezpośredniego przez `/api/v4/channels/direct`.
- W przeciwnym razie identyfikator jest traktowany jako **identyfikator kanału**.

Jeśli potrzebujesz deterministycznego zachowania, zawsze używaj jawnych prefiksów (`user:<id>` / `channel:<id>`).
</Warning>

## Ponowienia kanału wiadomości prywatnej

Gdy OpenClaw wysyła do celu wiadomości prywatnej Mattermost i musi najpierw rozwiązać kanał bezpośredni, domyślnie ponawia przejściowe niepowodzenia tworzenia kanału bezpośredniego.

Użyj `channels.mattermost.dmChannelRetry`, aby globalnie dostroić to zachowanie dla Pluginu Mattermost, albo `channels.mattermost.accounts.<id>.dmChannelRetry` dla jednego konta.

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

- Dotyczy to tylko tworzenia kanału wiadomości prywatnej (`/api/v4/channels/direct`), a nie każdego wywołania API Mattermost.
- Ponowienia dotyczą przejściowych błędów, takich jak limity szybkości, odpowiedzi 5xx oraz błędy sieci lub przekroczenia czasu.
- Błędy klienta 4xx inne niż `429` są traktowane jako trwałe i nie są ponawiane.

## Strumieniowanie podglądu

Mattermost strumieniuje tok rozumowania, aktywność narzędzi i częściowy tekst odpowiedzi do pojedynczego **posta roboczego podglądu**, który jest finalizowany w miejscu, gdy końcowa odpowiedź może zostać bezpiecznie wysłana. Podgląd aktualizuje się na tym samym identyfikatorze posta zamiast zaśmiecać kanał wiadomościami per fragment. Końcowe odpowiedzi z multimediami/błędami anulują oczekujące edycje podglądu i używają zwykłego dostarczania zamiast opróżniania jednorazowego posta podglądu.

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
    - `partial` to zwykle najlepszy wybór: jeden post podglądu, który jest edytowany w miarę rozrastania się odpowiedzi, a następnie finalizowany pełną odpowiedzią.
    - `block` używa fragmentów roboczych w stylu dopisywania wewnątrz posta podglądu.
    - `progress` pokazuje podgląd statusu podczas generowania i publikuje końcową odpowiedź dopiero po zakończeniu.
    - `off` wyłącza strumieniowanie podglądu.
  </Accordion>
  <Accordion title="Uwagi o działaniu strumieniowania">
    - Jeśli strumienia nie można sfinalizować w miejscu (na przykład post został usunięty w trakcie strumieniowania), OpenClaw wraca do wysłania nowego końcowego posta, więc odpowiedź nigdy nie zostanie utracona.
    - Ładunki zawierające wyłącznie rozumowanie są pomijane w postach kanałowych, w tym tekst docierający jako blok cytatu `> Reasoning:`. Ustaw `/reasoning on`, aby widzieć tok myślenia w innych powierzchniach; końcowy post Mattermost zawiera tylko odpowiedź.
    - Zobacz [Streaming](/pl/concepts/streaming#preview-streaming-modes), aby poznać macierz mapowania kanałów.
  </Accordion>
</AccordionGroup>

## Reakcje (narzędzie message)

- Użyj `message action=react` z `channel=mattermost`.
- `messageId` to identyfikator posta Mattermost.
- `emoji` akceptuje nazwy takie jak `thumbsup` albo `:+1:` (dwukropki są opcjonalne).
- Ustaw `remove=true` (boolean), aby usunąć reakcję.
- Zdarzenia dodania/usunięcia reakcji są przekazywane jako zdarzenia systemowe do trasowanej sesji agenta.

Przykłady:

```
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup remove=true
```

Konfiguracja:

- `channels.mattermost.actions.reactions`: włączanie/wyłączanie akcji reakcji (domyślnie true).
- Nadpisanie per konto: `channels.mattermost.accounts.<id>.actions.reactions`.

## Interaktywne przyciski (narzędzie message)

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

Użyj `message action=send` z parametrem `buttons`. Przyciski to tablica 2D (wiersze przycisków):

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
    Wszystkie przyciski są zastępowane wierszem potwierdzenia (np. „✓ **Tak** wybrane przez @user”).
  </Step>
  <Step title="Agent otrzymuje wybór">
    Agent otrzymuje wybór jako wiadomość przychodzącą i odpowiada.
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Uwagi implementacyjne">
    - Callbacki przycisków używają weryfikacji HMAC-SHA256 (automatycznie, bez potrzeby konfiguracji).
    - Mattermost usuwa dane callbacku ze swoich odpowiedzi API (funkcja bezpieczeństwa), więc po kliknięciu usuwane są wszystkie przyciski — częściowe usunięcie nie jest możliwe.
    - Identyfikatory akcji zawierające myślniki lub podkreślenia są automatycznie sanityzowane (ograniczenie routingu Mattermost).
  </Accordion>
  <Accordion title="Konfiguracja i osiągalność">
    - `channels.mattermost.capabilities`: tablica ciągów możliwości. Dodaj `"inlineButtons"`, aby włączyć opis narzędzia przycisków w promptcie systemowym agenta.
    - `channels.mattermost.interactions.callbackBaseUrl`: opcjonalny zewnętrzny bazowy URL dla callbacków przycisków (na przykład `https://gateway.example.com`). Użyj tego, gdy Mattermost nie może bezpośrednio dotrzeć do Gateway pod jego hostem powiązania.
    - W konfiguracjach z wieloma kontami możesz też ustawić to samo pole w `channels.mattermost.accounts.<id>.interactions.callbackBaseUrl`.
    - Jeśli pominięto `interactions.callbackBaseUrl`, OpenClaw wyprowadza URL callbacku z `gateway.customBindHost` + `gateway.port`, a następnie wraca do `http://localhost:<port>`.
    - Reguła osiągalności: URL callbacku przycisku musi być osiągalny z serwera Mattermost. `localhost` działa tylko wtedy, gdy Mattermost i OpenClaw działają na tym samym hoście / w tej samej przestrzeni nazw sieci.
    - Jeśli cel callbacku jest prywatny/tailnet/wewnętrzny, dodaj jego host/domenę do `ServiceSettings.AllowedUntrustedInternalConnections` w Mattermost.
  </Accordion>
</AccordionGroup>

### Bezpośrednia integracja z API (zewnętrzne skrypty)

Zewnętrzne skrypty i Webhooki mogą publikować przyciski bezpośrednio przez REST API Mattermost zamiast korzystać z narzędzia `message` agenta. Jeśli to możliwe, używaj `buildButtonAttachments()` z Pluginu; jeśli publikujesz surowy JSON, stosuj się do tych zasad:

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
            id: "mybutton01", // tylko znaki alfanumeryczne — zobacz niżej
            type: "button", // wymagane, inaczej kliknięcia są po cichu ignorowane
            name: "Approve", // etykieta wyświetlana
            style: "primary", // opcjonalnie: "default", "primary", "danger"
            integration: {
              url: "https://gateway.example.com/mattermost/interactions/default",
              context: {
                action_id: "mybutton01", // musi pasować do id przycisku (na potrzeby wyszukiwania nazwy)
                action: "approve",
                // ... dowolne pola niestandardowe ...
                _token: "<hmac>", // zobacz sekcję HMAC poniżej
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
**Krytyczne zasady**

1. Attachments trafiają do `props.attachments`, a nie do najwyższego poziomu `attachments` (w przeciwnym razie są po cichu ignorowane).
2. Każda akcja wymaga `type: "button"` — bez tego kliknięcia są po cichu ignorowane.
3. Każda akcja wymaga pola `id` — Mattermost ignoruje akcje bez identyfikatorów.
4. `id` akcji musi być **wyłącznie alfanumeryczne** (`[a-zA-Z0-9]`). Myślniki i podkreślenia psują serwerowe trasowanie akcji w Mattermost (zwraca 404). Usuń je przed użyciem.
5. `context.action_id` musi odpowiadać `id` przycisku, aby komunikat potwierdzenia pokazywał nazwę przycisku (np. „Approve”), a nie surowy identyfikator.
6. `context.action_id` jest wymagane — obsługa interakcji zwraca 400 bez niego.
</Warning>

**Generowanie tokenu HMAC**

Gateway weryfikuje kliknięcia przycisków za pomocą HMAC-SHA256. Zewnętrzne skrypty muszą generować tokeny zgodne z logiką weryfikacji Gateway:

<Steps>
  <Step title="Wyprowadź sekret z tokenu bota">
    `HMAC-SHA256(key="openclaw-mattermost-interactions", data=botToken)`
  </Step>
  <Step title="Zbuduj obiekt context">
    Zbuduj obiekt context ze wszystkimi polami **poza** `_token`.
  </Step>
  <Step title="Serializuj z posortowanymi kluczami">
    Serializuj z **posortowanymi kluczami** i **bez spacji** (Gateway używa `JSON.stringify` z posortowanymi kluczami, co daje zwarty wynik).
  </Step>
  <Step title="Podpisz ładunek">
    `HMAC-SHA256(key=secret, data=serializedContext)`
  </Step>
  <Step title="Dodaj token">
    Dodaj wynikowy skrót szesnastkowy jako `_token` w context.
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
    - `json.dumps` w Pythonie domyślnie dodaje spacje (`{"key": "val"}`). Użyj `separators=(",", ":")`, aby dopasować zwarty wynik JavaScript (`{"key":"val"}`).
    - Zawsze podpisuj **wszystkie** pola context (bez `_token`). Gateway usuwa `_token`, a następnie podpisuje wszystko, co pozostało. Podpisanie tylko części pól powoduje ciche niepowodzenie weryfikacji.
    - Użyj `sort_keys=True` — Gateway sortuje klucze przed podpisaniem, a Mattermost może zmienić kolejność pól context podczas przechowywania ładunku.
    - Wyprowadzaj sekret z tokenu bota (deterministycznie), a nie z losowych bajtów. Sekret musi być taki sam w procesie tworzącym przyciski i w Gateway, który je weryfikuje.
  </Accordion>
</AccordionGroup>

## Adapter katalogowy

Plugin Mattermost zawiera adapter katalogowy, który rozwiązuje nazwy kanałów i użytkowników przez API Mattermost. Dzięki temu w `openclaw message send` i w dostarczaniu przez Cron/Webhooki można używać celów `#channel-name` i `@username`.

Konfiguracja nie jest wymagana — adapter używa tokenu bota z konfiguracji konta.

## Wiele kont

Mattermost obsługuje wiele kont w `channels.mattermost.accounts`:

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
    Upewnij się, że bot jest w kanale i wspomnij go (oncall), użyj prefiksu wyzwalającego (onchar) albo ustaw `chatmode: "onmessage"`.
  </Accordion>
  <Accordion title="Błędy uwierzytelniania lub wielu kont">
    - Sprawdź token bota, bazowy URL oraz to, czy konto jest włączone.
    - Problemy z wieloma kontami: zmienne środowiskowe dotyczą tylko konta `default`.
  </Accordion>
  <Accordion title="Natywne polecenia slash nie działają">
    - `Unauthorized: invalid command token.`: OpenClaw nie zaakceptował tokenu callbacku. Typowe przyczyny:
      - rejestracja polecenia slash nie powiodła się albo została ukończona tylko częściowo przy uruchomieniu
      - callback trafia do niewłaściwego Gateway/konta
      - Mattermost nadal ma stare polecenia wskazujące poprzedni cel callbacku
      - Gateway uruchomiono ponownie bez ponownej aktywacji poleceń slash
    - Jeśli natywne polecenia slash przestaną działać, sprawdź logi pod kątem `mattermost: failed to register slash commands` lub `mattermost: native slash commands enabled but no commands could be registered`.
    - Jeśli pominięto `callbackUrl`, a logi ostrzegają, że callback został rozwiązany do `http://127.0.0.1:18789/...`, ten URL prawdopodobnie jest osiągalny tylko wtedy, gdy Mattermost działa na tym samym hoście / w tej samej przestrzeni nazw sieci co OpenClaw. Ustaw jawny, zewnętrznie osiągalny `commands.callbackUrl`.
  </Accordion>
  <Accordion title="Problemy z przyciskami">
    - Przyciski wyglądają jak białe pola: agent może wysyłać nieprawidłowo sformatowane dane przycisków. Sprawdź, czy każdy przycisk ma pola `text` i `callback_data`.
    - Przyciski renderują się, ale kliknięcia nic nie robią: sprawdź, czy `AllowedUntrustedInternalConnections` w konfiguracji serwera Mattermost zawiera `127.0.0.1 localhost` oraz czy `EnablePostActionIntegration` ma wartość `true` w `ServiceSettings`.
    - Kliknięcia przycisków zwracają 404: `id` przycisku prawdopodobnie zawiera myślniki lub podkreślenia. Router akcji Mattermost nie działa z identyfikatorami niealfanumerycznymi. Używaj tylko `[a-zA-Z0-9]`.
    - Logi Gateway pokazują `invalid _token`: niedopasowanie HMAC. Sprawdź, czy podpisujesz wszystkie pola context (a nie tylko część), używasz posortowanych kluczy i zwartego JSON-a (bez spacji). Zobacz sekcję HMAC powyżej.
    - Logi Gateway pokazują `missing _token in context`: pole `_token` nie znajduje się w context przycisku. Upewnij się, że jest uwzględnione podczas budowania ładunku integracji.
    - Potwierdzenie pokazuje surowy identyfikator zamiast nazwy przycisku: `context.action_id` nie odpowiada `id` przycisku. Ustaw oba na tę samą sanityzowaną wartość.
    - Agent nie wie o przyciskach: dodaj `capabilities: ["inlineButtons"]` do konfiguracji kanału Mattermost.
  </Accordion>
</AccordionGroup>

## Powiązane

- [Trasowanie kanałów](/pl/channels/channel-routing) — trasowanie sesji dla wiadomości
- [Przegląd kanałów](/pl/channels) — wszystkie obsługiwane kanały
- [Grupy](/pl/channels/groups) — zachowanie czatu grupowego i kontrola przez wzmianki
- [Parowanie](/pl/channels/pairing) — uwierzytelnianie wiadomości prywatnych i przepływ parowania
- [Bezpieczeństwo](/pl/gateway/security) — model dostępu i utwardzanie
