---
read_when:
    - Konfigurowanie Mattermost
    - Debugowanie routingu Mattermost
summary: Konfiguracja bota Mattermost i konfiguracja OpenClaw
title: Mattermost
x-i18n:
    generated_at: "2026-04-05T13:46:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: f21dc7543176fda0b38b00fab60f0daae38dffcf68fa1cf7930a9f14ec57cb5a
    source_path: channels/mattermost.md
    workflow: 15
---

# Mattermost

Status: plugin dołączony do pakietu (token bota + zdarzenia WebSocket). Obsługiwane są kanały, grupy i wiadomości prywatne.
Mattermost to hostowana samodzielnie platforma do komunikacji zespołowej; szczegóły produktu i pliki do pobrania znajdziesz w oficjalnym serwisie
[mattermost.com](https://mattermost.com).

## Plugin dołączony do pakietu

Mattermost jest dostarczany jako plugin dołączony do pakietu w aktualnych wydaniach OpenClaw, więc zwykłe
spakowane buildy nie wymagają osobnej instalacji.

Jeśli używasz starszego buildu lub niestandardowej instalacji, która nie zawiera Mattermost,
zainstaluj go ręcznie:

Instalacja przez CLI (rejestr npm):

```bash
openclaw plugins install @openclaw/mattermost
```

Lokalny checkout (podczas uruchamiania z repozytorium git):

```bash
openclaw plugins install ./path/to/local/mattermost-plugin
```

Szczegóły: [Plugins](/tools/plugin)

## Szybka konfiguracja

1. Upewnij się, że plugin Mattermost jest dostępny.
   - Aktualne spakowane wydania OpenClaw już go zawierają.
   - W starszych/niestandardowych instalacjach można dodać go ręcznie za pomocą powyższych poleceń.
2. Utwórz konto bota Mattermost i skopiuj **token bota**.
3. Skopiuj **bazowy URL** Mattermost (na przykład `https://chat.example.com`).
4. Skonfiguruj OpenClaw i uruchom gateway.

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

## Natywne polecenia slash

Natywne polecenia slash są opcjonalne. Po włączeniu OpenClaw rejestruje polecenia slash `oc_*` przez
API Mattermost i odbiera callbacki POST na serwerze HTTP gateway.

```json5
{
  channels: {
    mattermost: {
      commands: {
        native: true,
        nativeSkills: true,
        callbackPath: "/api/channels/mattermost/command",
        // Użyj, gdy Mattermost nie może połączyć się bezpośrednio z gateway (reverse proxy/publiczny URL).
        callbackUrl: "https://gateway.example.com/api/channels/mattermost/command",
      },
    },
  },
}
```

Uwagi:

- `native: "auto"` domyślnie jest wyłączone dla Mattermost. Ustaw `native: true`, aby włączyć.
- Jeśli `callbackUrl` zostanie pominięty, OpenClaw wyprowadza go z hosta/portu gateway + `callbackPath`.
- W konfiguracjach z wieloma kontami `commands` można ustawić na poziomie głównym lub w
  `channels.mattermost.accounts.<id>.commands` (wartości konta nadpisują pola z poziomu głównego).
- Callbacki poleceń są weryfikowane za pomocą tokenów per polecenie zwracanych przez
  Mattermost, gdy OpenClaw rejestruje polecenia `oc_*`.
- Callbacki slash są domyślnie odrzucane, gdy rejestracja się nie powiodła, start był częściowy lub
  token callbacku nie pasuje do żadnego z zarejestrowanych poleceń.
- Wymaganie dostępności: endpoint callbacku musi być osiągalny z serwera Mattermost.
  - Nie ustawiaj `callbackUrl` na `localhost`, chyba że Mattermost działa na tym samym hoście/w tej samej przestrzeni nazw sieci co OpenClaw.
  - Nie ustawiaj `callbackUrl` na bazowy URL Mattermost, chyba że ten URL reverse-proxy'uje `/api/channels/mattermost/command` do OpenClaw.
  - Szybkim sprawdzeniem jest `curl https://<gateway-host>/api/channels/mattermost/command`; żądanie GET powinno zwrócić z OpenClaw `405 Method Not Allowed`, a nie `404`.
- Wymaganie dotyczące listy dozwolonego ruchu wychodzącego w Mattermost:
  - Jeśli callback wskazuje na adresy prywatne/tailnet/wewnętrzne, ustaw w Mattermost
    `ServiceSettings.AllowedUntrustedInternalConnections`, aby obejmowało hosta/domenę callbacku.
  - Używaj wpisów host/domena, a nie pełnych URL.
    - Dobrze: `gateway.tailnet-name.ts.net`
    - Źle: `https://gateway.tailnet-name.ts.net`

## Zmienne środowiskowe (konto domyślne)

Ustaw je na hoście gateway, jeśli wolisz używać zmiennych środowiskowych:

- `MATTERMOST_BOT_TOKEN=...`
- `MATTERMOST_URL=https://chat.example.com`

Zmienne środowiskowe dotyczą tylko konta **default** (`default`). Pozostałe konta muszą używać wartości z konfiguracji.

## Tryby czatu

Mattermost automatycznie odpowiada na wiadomości prywatne. Zachowanie na kanałach jest kontrolowane przez `chatmode`:

- `oncall` (domyślnie): odpowiada tylko po wspomnieniu @ w kanałach.
- `onmessage`: odpowiada na każdą wiadomość na kanale.
- `onchar`: odpowiada, gdy wiadomość zaczyna się od prefiksu wyzwalającego.

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
- `channels.mattermost.requireMention` jest honorowane dla starszych konfiguracji, ale preferowane jest `chatmode`.

## Wątki i sesje

Użyj `channels.mattermost.replyToMode`, aby kontrolować, czy odpowiedzi na kanałach i w grupach pozostają w
głównym kanale, czy rozpoczynają wątek pod postem wyzwalającym.

- `off` (domyślnie): odpowiada w wątku tylko wtedy, gdy przychodzący post już w nim jest.
- `first`: dla postów najwyższego poziomu na kanałach/w grupach rozpoczyna wątek pod tym postem i kieruje
  rozmowę do sesji ograniczonej do wątku.
- `all`: obecnie w Mattermost działa tak samo jak `first`.
- Wiadomości prywatne ignorują to ustawienie i pozostają bez wątków.

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
- `first` i `all` są obecnie równoważne, ponieważ gdy Mattermost ma już korzeń wątku,
  kolejne fragmenty i multimedia są kontynuowane w tym samym wątku.

## Kontrola dostępu (wiadomości prywatne)

- Domyślnie: `channels.mattermost.dmPolicy = "pairing"` (nieznani nadawcy otrzymują kod parowania).
- Zatwierdzanie przez:
  - `openclaw pairing list mattermost`
  - `openclaw pairing approve mattermost <CODE>`
- Publiczne wiadomości prywatne: `channels.mattermost.dmPolicy="open"` oraz `channels.mattermost.allowFrom=["*"]`.

## Kanały (grupy)

- Domyślnie: `channels.mattermost.groupPolicy = "allowlist"` (bramkowanie wzmianką).
- Dodawaj nadawców do listy dozwolonych przez `channels.mattermost.groupAllowFrom` (zalecane identyfikatory użytkowników).
- Nadpisania wzmianki per kanał znajdują się w `channels.mattermost.groups.<channelId>.requireMention`
  lub `channels.mattermost.groups["*"].requireMention` jako wartość domyślna.
- Dopasowywanie `@username` jest zmienne i włączane tylko wtedy, gdy `channels.mattermost.dangerouslyAllowNameMatching: true`.
- Otwarte kanały: `channels.mattermost.groupPolicy="open"` (bramkowanie wzmianką).
- Uwaga dotycząca runtime: jeśli `channels.mattermost` jest całkowicie nieobecne, runtime wraca do `groupPolicy="allowlist"` dla sprawdzeń grupowych (nawet jeśli ustawiono `channels.defaults.groupPolicy`).

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

Używaj tych formatów celu z `openclaw message send` lub cron/webhookami:

- `channel:<id>` dla kanału
- `user:<id>` dla wiadomości prywatnej
- `@username` dla wiadomości prywatnej (rozwiązywane przez API Mattermost)

Same nieprzejrzyste identyfikatory (jak `64ifufp...`) są **niejednoznaczne** w Mattermost (ID użytkownika vs ID kanału).

OpenClaw rozwiązuje je **najpierw jako użytkownika**:

- Jeśli identyfikator istnieje jako użytkownik (`GET /api/v4/users/<id>` powiedzie się), OpenClaw wysyła **wiadomość prywatną** przez rozpoznanie kanału bezpośredniego przez `/api/v4/channels/direct`.
- W przeciwnym razie identyfikator jest traktowany jako **ID kanału**.

Jeśli potrzebujesz deterministycznego zachowania, zawsze używaj jawnych prefiksów (`user:<id>` / `channel:<id>`).

## Ponawianie tworzenia kanału wiadomości prywatnej

Gdy OpenClaw wysyła do celu wiadomości prywatnej Mattermost i najpierw musi rozpoznać kanał bezpośredni,
domyślnie ponawia przejściowe błędy tworzenia kanału bezpośredniego.

Użyj `channels.mattermost.dmChannelRetry`, aby globalnie dostroić to zachowanie dla pluginu Mattermost,
lub `channels.mattermost.accounts.<id>.dmChannelRetry` dla jednego konta.

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
- Ponowienia dotyczą przejściowych błędów, takich jak limity szybkości, odpowiedzi 5xx oraz błędy sieciowe lub przekroczenia limitu czasu.
- Błędy klienta 4xx inne niż `429` są traktowane jako trwałe i nie są ponawiane.

## Reakcje (narzędzie wiadomości)

- Użyj `message action=react` z `channel=mattermost`.
- `messageId` to identyfikator postu Mattermost.
- `emoji` akceptuje nazwy takie jak `thumbsup` lub `:+1:` (dwukropki są opcjonalne).
- Ustaw `remove=true` (boolean), aby usunąć reakcję.
- Zdarzenia dodania/usunięcia reakcji są przekazywane jako zdarzenia systemowe do routowanej sesji agenta.

Przykłady:

```
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup remove=true
```

Konfiguracja:

- `channels.mattermost.actions.reactions`: włącza/wyłącza akcje reakcji (domyślnie true).
- Nadpisanie per konto: `channels.mattermost.accounts.<id>.actions.reactions`.

## Interaktywne przyciski (narzędzie wiadomości)

Wysyłaj wiadomości z klikalnymi przyciskami. Gdy użytkownik kliknie przycisk, agent otrzyma
wybór i będzie mógł odpowiedzieć.

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

Pola przycisku:

- `text` (wymagane): etykieta wyświetlana użytkownikowi.
- `callback_data` (wymagane): wartość odsyłana po kliknięciu (używana jako identyfikator akcji).
- `style` (opcjonalne): `"default"`, `"primary"` lub `"danger"`.

Gdy użytkownik kliknie przycisk:

1. Wszystkie przyciski są zastępowane wierszem potwierdzenia (na przykład „✓ **Yes** selected by @user”).
2. Agent otrzymuje wybór jako wiadomość przychodzącą i odpowiada.

Uwagi:

- Callbacki przycisków używają weryfikacji HMAC-SHA256 (automatycznie, bez potrzeby konfiguracji).
- Mattermost usuwa callback data ze swoich odpowiedzi API (funkcja bezpieczeństwa), więc wszystkie przyciski
  są usuwane po kliknięciu — częściowe usunięcie nie jest możliwe.
- Identyfikatory akcji zawierające myślniki lub podkreślenia są automatycznie sanityzowane
  (ograniczenie routingu Mattermost).

Konfiguracja:

- `channels.mattermost.capabilities`: tablica ciągów określających możliwości. Dodaj `"inlineButtons"`, aby
  włączyć opis narzędzia przycisków w systemowym promptcie agenta.
- `channels.mattermost.interactions.callbackBaseUrl`: opcjonalny zewnętrzny bazowy URL dla callbacków
  przycisków (na przykład `https://gateway.example.com`). Użyj tego, gdy Mattermost nie może
  połączyć się z gateway bezpośrednio pod jego hostem bindowania.
- W konfiguracjach z wieloma kontami możesz ustawić to samo pole także w
  `channels.mattermost.accounts.<id>.interactions.callbackBaseUrl`.
- Jeśli `interactions.callbackBaseUrl` zostanie pominięte, OpenClaw wyprowadza URL callbacku z
  `gateway.customBindHost` + `gateway.port`, a następnie wraca do `http://localhost:<port>`.
- Zasada dostępności: URL callbacku przycisku musi być osiągalny z serwera Mattermost.
  `localhost` działa tylko wtedy, gdy Mattermost i OpenClaw działają na tym samym hoście/w tej samej przestrzeni nazw sieci.
- Jeśli cel callbacku jest prywatny/tailnet/wewnętrzny, dodaj jego host/domenę do Mattermost
  `ServiceSettings.AllowedUntrustedInternalConnections`.

### Bezpośrednia integracja z API (zewnętrzne skrypty)

Zewnętrzne skrypty i webhooki mogą publikować przyciski bezpośrednio przez REST API Mattermost
zamiast przez narzędzie `message` agenta. W miarę możliwości używaj `buildButtonAttachments()` z
rozszerzenia; jeśli publikujesz surowy JSON, stosuj się do tych zasad:

**Struktura payloadu:**

```json5
{
  channel_id: "<channelId>",
  message: "Choose an option:",
  props: {
    attachments: [
      {
        actions: [
          {
            id: "mybutton01", // tylko znaki alfanumeryczne — patrz niżej
            type: "button", // wymagane, w przeciwnym razie kliknięcia są po cichu ignorowane
            name: "Approve", // etykieta wyświetlana użytkownikowi
            style: "primary", // opcjonalne: "default", "primary", "danger"
            integration: {
              url: "https://gateway.example.com/mattermost/interactions/default",
              context: {
                action_id: "mybutton01", // musi odpowiadać id przycisku (na potrzeby wyszukiwania nazwy)
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

**Kluczowe zasady:**

1. Attachments trafiają do `props.attachments`, a nie do top-level `attachments` (w przeciwnym razie są po cichu ignorowane).
2. Każda akcja wymaga `type: "button"` — bez tego kliknięcia są po cichu przechwytywane.
3. Każda akcja wymaga pola `id` — Mattermost ignoruje akcje bez identyfikatorów.
4. `id` akcji musi być **wyłącznie alfanumeryczne** (`[a-zA-Z0-9]`). Myślniki i podkreślenia psują
   routowanie akcji po stronie serwera Mattermost (zwraca 404). Usuń je przed użyciem.
5. `context.action_id` musi odpowiadać `id` przycisku, aby wiadomość potwierdzająca pokazywała
   nazwę przycisku (na przykład „Approve”), a nie surowy identyfikator.
6. `context.action_id` jest wymagane — handler interakcji zwraca 400 bez niego.

**Generowanie tokena HMAC:**

Gateway weryfikuje kliknięcia przycisków przy użyciu HMAC-SHA256. Zewnętrzne skrypty muszą generować tokeny
zgodne z logiką weryfikacji gateway:

1. Wyprowadź sekret z tokena bota:
   `HMAC-SHA256(key="openclaw-mattermost-interactions", data=botToken)`
2. Zbuduj obiekt context ze wszystkimi polami **oprócz** `_token`.
3. Zserializuj z **posortowanymi kluczami** i **bez spacji** (gateway używa `JSON.stringify`
   z posortowanymi kluczami, co daje zwięzłe wyjście).
4. Podpisz: `HMAC-SHA256(key=secret, data=serializedContext)`
5. Dodaj wynikowy skrót szesnastkowy jako `_token` w context.

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

Typowe pułapki HMAC:

- `json.dumps` w Pythonie domyślnie dodaje spacje (`{"key": "val"}`). Użyj
  `separators=(",", ":")`, aby dopasować zwarte wyjście JavaScript (`{"key":"val"}`).
- Zawsze podpisuj **wszystkie** pola context (bez `_token`). Gateway usuwa `_token`, a następnie
  podpisuje wszystko, co pozostało. Podpisanie tylko podzbioru powoduje ciche niepowodzenie weryfikacji.
- Użyj `sort_keys=True` — gateway sortuje klucze przed podpisaniem, a Mattermost może
  zmieniać kolejność pól context podczas przechowywania payloadu.
- Wyprowadzaj sekret z tokena bota (deterministycznie), a nie z losowych bajtów. Sekret
  musi być taki sam w procesie tworzącym przyciski i w gateway, który je weryfikuje.

## Adapter katalogu

Plugin Mattermost zawiera adapter katalogu, który rozpoznaje nazwy kanałów i użytkowników
przez API Mattermost. Dzięki temu można używać celów `#channel-name` i `@username` w
`openclaw message send` oraz w dostarczaniu przez cron/webhooki.

Nie jest wymagana żadna konfiguracja — adapter używa tokena bota z konfiguracji konta.

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

- Brak odpowiedzi w kanałach: upewnij się, że bot jest na kanale i wspomnij go (oncall), użyj prefiksu wyzwalającego (onchar) lub ustaw `chatmode: "onmessage"`.
- Błędy uwierzytelniania: sprawdź token bota, bazowy URL i to, czy konto jest włączone.
- Problemy z wieloma kontami: zmienne środowiskowe dotyczą tylko konta `default`.
- Natywne polecenia slash zwracają `Unauthorized: invalid command token.`: OpenClaw
  nie zaakceptował tokena callbacku. Typowe przyczyny:
  - rejestracja poleceń slash nie powiodła się lub została ukończona tylko częściowo przy uruchamianiu
  - callback trafia do niewłaściwego gateway/konta
  - Mattermost nadal ma stare polecenia wskazujące na poprzedni cel callbacku
  - gateway został uruchomiony ponownie bez ponownej aktywacji poleceń slash
- Jeśli natywne polecenia slash przestają działać, sprawdź logi pod kątem
  `mattermost: failed to register slash commands` lub
  `mattermost: native slash commands enabled but no commands could be registered`.
- Jeśli `callbackUrl` zostanie pominięte, a logi ostrzegają, że callback został rozpoznany jako
  `http://127.0.0.1:18789/...`, ten URL prawdopodobnie jest osiągalny tylko wtedy,
  gdy Mattermost działa na tym samym hoście/w tej samej przestrzeni nazw sieci co OpenClaw. Ustaw
  jawny, zewnętrznie osiągalny `commands.callbackUrl`.
- Przyciski pojawiają się jako białe pola: agent może wysyłać nieprawidłowo sformowane dane przycisków. Sprawdź, czy każdy przycisk ma pola `text` i `callback_data`.
- Przyciski się renderują, ale kliknięcia nic nie robią: sprawdź, czy `AllowedUntrustedInternalConnections` w konfiguracji serwera Mattermost zawiera `127.0.0.1 localhost` oraz czy `EnablePostActionIntegration` ma wartość `true` w ServiceSettings.
- Przyciski po kliknięciu zwracają 404: `id` przycisku prawdopodobnie zawiera myślniki lub podkreślenia. Router akcji Mattermost nie działa z niealfanumerycznymi identyfikatorami. Używaj tylko `[a-zA-Z0-9]`.
- Logi gateway zawierają `invalid _token`: niezgodność HMAC. Sprawdź, czy podpisujesz wszystkie pola context (a nie tylko ich podzbiór), używasz posortowanych kluczy i zwartego JSON (bez spacji). Zobacz sekcję HMAC powyżej.
- Logi gateway zawierają `missing _token in context`: pole `_token` nie znajduje się w context przycisku. Upewnij się, że jest uwzględnione podczas budowania payloadu integracji.
- Potwierdzenie pokazuje surowy identyfikator zamiast nazwy przycisku: `context.action_id` nie odpowiada `id` przycisku. Ustaw oba na tę samą zsanityzowaną wartość.
- Agent nie wie o przyciskach: dodaj `capabilities: ["inlineButtons"]` do konfiguracji kanału Mattermost.

## Powiązane

- [Channels Overview](/pl/channels) — wszystkie obsługiwane kanały
- [Pairing](/pl/channels/pairing) — uwierzytelnianie wiadomości prywatnych i przepływ parowania
- [Groups](/pl/channels/groups) — zachowanie czatów grupowych i bramkowanie wzmianką
- [Channel Routing](/pl/channels/channel-routing) — routing sesji dla wiadomości
- [Security](/gateway/security) — model dostępu i utwardzanie
