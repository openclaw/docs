---
read_when:
    - Konfigurowanie Mattermost
    - Debugowanie routingu Mattermost
summary: Konfiguracja bota Mattermost i OpenClaw
title: Mattermost
x-i18n:
    generated_at: "2026-04-22T04:20:07Z"
    model: gpt-5.4
    provider: openai
    source_hash: dd3059c5e64f417edc02c3e850ddd066e38decda0cbdcea31e1c57136e6bcb1d
    source_path: channels/mattermost.md
    workflow: 15
---

# Mattermost

Status: plugin dołączony do pakietu (token bota + zdarzenia WebSocket). Obsługiwane są kanały, grupy i DM.
Mattermost to samohostowalna platforma do komunikacji zespołowej; szczegóły produktu i pliki do pobrania znajdziesz na oficjalnej stronie
[mattermost.com](https://mattermost.com).

## Plugin dołączony do pakietu

Mattermost jest dostarczany jako plugin dołączony do pakietu w bieżących wydaniach OpenClaw, więc standardowe
spakowane kompilacje nie wymagają osobnej instalacji.

Jeśli używasz starszej kompilacji lub niestandardowej instalacji, która nie zawiera Mattermost,
zainstaluj go ręcznie:

Instalacja przez CLI (rejestr npm):

```bash
openclaw plugins install @openclaw/mattermost
```

Lokalny checkout (przy uruchamianiu z repozytorium git):

```bash
openclaw plugins install ./path/to/local/mattermost-plugin
```

Szczegóły: [Plugins](/pl/tools/plugin)

## Szybka konfiguracja

1. Upewnij się, że plugin Mattermost jest dostępny.
   - Bieżące spakowane wydania OpenClaw już go zawierają.
   - Starsze/niestandardowe instalacje mogą dodać go ręcznie za pomocą powyższych poleceń.
2. Utwórz konto bota Mattermost i skopiuj **token bota**.
3. Skopiuj **bazowy URL** Mattermost (na przykład `https://chat.example.com`).
4. Skonfiguruj OpenClaw i uruchom Gateway.

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
API Mattermost i odbiera callbacki POST na serwerze HTTP Gateway.

```json5
{
  channels: {
    mattermost: {
      commands: {
        native: true,
        nativeSkills: true,
        callbackPath: "/api/channels/mattermost/command",
        // Użyj, gdy Mattermost nie może bezpośrednio połączyć się z Gateway (reverse proxy/publiczny URL).
        callbackUrl: "https://gateway.example.com/api/channels/mattermost/command",
      },
    },
  },
}
```

Uwagi:

- `native: "auto"` domyślnie jest wyłączone dla Mattermost. Ustaw `native: true`, aby włączyć.
- Jeśli `callbackUrl` zostanie pominięty, OpenClaw wyprowadzi go z hosta/portu Gateway + `callbackPath`.
- W konfiguracjach wielokontowych `commands` można ustawić na najwyższym poziomie albo w
  `channels.mattermost.accounts.<id>.commands` (wartości konta nadpisują pola najwyższego poziomu).
- Callbacki poleceń są weryfikowane za pomocą tokenów per polecenie zwracanych przez
  Mattermost, gdy OpenClaw rejestruje polecenia `oc_*`.
- Callbacki slash domyślnie kończą się błędem, gdy rejestracja się nie powiodła, uruchomienie było częściowe lub
  token callbacku nie pasuje do żadnego z zarejestrowanych poleceń.
- Wymóg osiągalności: endpoint callbacku musi być osiągalny z serwera Mattermost.
  - Nie ustawiaj `callbackUrl` na `localhost`, chyba że Mattermost działa na tym samym hoście/w tej samej przestrzeni nazw sieci co OpenClaw.
  - Nie ustawiaj `callbackUrl` na bazowy URL Mattermost, chyba że ten URL przez reverse proxy przekierowuje `/api/channels/mattermost/command` do OpenClaw.
  - Szybka kontrola to `curl https://<gateway-host>/api/channels/mattermost/command`; żądanie GET powinno zwrócić z OpenClaw `405 Method Not Allowed`, a nie `404`.
- Wymóg allowlisty ruchu wychodzącego Mattermost:
  - Jeśli callback wskazuje na adresy prywatne/tailnet/wewnętrzne, ustaw w Mattermost
    `ServiceSettings.AllowedUntrustedInternalConnections`, aby zawierało host/domenę callbacku.
  - Używaj wpisów hosta/domeny, a nie pełnych URL-i.
    - Dobrze: `gateway.tailnet-name.ts.net`
    - Źle: `https://gateway.tailnet-name.ts.net`

## Zmienne środowiskowe (konto domyślne)

Ustaw je na hoście Gateway, jeśli wolisz używać zmiennych środowiskowych:

- `MATTERMOST_BOT_TOKEN=...`
- `MATTERMOST_URL=https://chat.example.com`

Zmienne środowiskowe dotyczą tylko konta **default** (`default`). Inne konta muszą używać wartości z konfiguracji.

## Tryby czatu

Mattermost odpowiada na DM automatycznie. Zachowanie na kanałach kontroluje `chatmode`:

- `oncall` (domyślnie): odpowiada tylko po wzmiance @ na kanałach.
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
- `channels.mattermost.requireMention` jest respektowane dla starszych konfiguracji, ale preferowane jest `chatmode`.

## Wątki i sesje

Użyj `channels.mattermost.replyToMode`, aby określić, czy odpowiedzi na kanałach i w grupach mają pozostać w
głównym kanale, czy uruchamiać wątek pod postem wyzwalającym.

- `off` (domyślnie): odpowiada w wątku tylko wtedy, gdy przychodzący post już się w nim znajduje.
- `first`: dla postów najwyższego poziomu na kanałach/w grupach uruchamia wątek pod tym postem i kieruje
  rozmowę do sesji ograniczonej do wątku.
- `all`: dziś w Mattermost działa tak samo jak `first`.
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

- Sesje ograniczone do wątku używają id posta wyzwalającego jako korzenia wątku.
- `first` i `all` są obecnie równoważne, ponieważ gdy Mattermost ma już korzeń wątku,
  kolejne fragmenty i multimedia pozostają w tym samym wątku.

## Kontrola dostępu (DM)

- Domyślnie: `channels.mattermost.dmPolicy = "pairing"` (nieznani nadawcy otrzymują kod parowania).
- Zatwierdzanie przez:
  - `openclaw pairing list mattermost`
  - `openclaw pairing approve mattermost <CODE>`
- Publiczne DM: `channels.mattermost.dmPolicy="open"` plus `channels.mattermost.allowFrom=["*"]`.

## Kanały (grupy)

- Domyślnie: `channels.mattermost.groupPolicy = "allowlist"` (bramka oparta na wzmiankach).
- Dodawaj nadawców do allowlisty przez `channels.mattermost.groupAllowFrom` (zalecane są ID użytkowników).
- Nadpisania wzmianki per kanał znajdują się w `channels.mattermost.groups.<channelId>.requireMention`
  albo w `channels.mattermost.groups["*"].requireMention` jako wartość domyślna.
- Dopasowywanie `@username` jest zmienne i włączane tylko wtedy, gdy `channels.mattermost.dangerouslyAllowNameMatching: true`.
- Otwarte kanały: `channels.mattermost.groupPolicy="open"` (bramka oparta na wzmiankach).
- Uwaga środowiska uruchomieniowego: jeśli `channels.mattermost` jest całkowicie pominięte, środowisko wykonawcze przechodzi na `groupPolicy="allowlist"` przy sprawdzaniu grup (nawet jeśli ustawiono `channels.defaults.groupPolicy`).

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

Używaj tych formatów celu z `openclaw message send` lub Cron/Webhookami:

- `channel:<id>` dla kanału
- `user:<id>` dla DM
- `@username` dla DM (rozwiązywane przez API Mattermost)

Surowe nieprzezroczyste ID (takie jak `64ifufp...`) są w Mattermost **niejednoznaczne** (ID użytkownika vs ID kanału).

OpenClaw rozwiązuje je **najpierw jako użytkownika**:

- Jeśli ID istnieje jako użytkownik (`GET /api/v4/users/<id>` powiedzie się), OpenClaw wysyła **DM**, rozwiązując kanał bezpośredni przez `/api/v4/channels/direct`.
- W przeciwnym razie ID jest traktowane jako **ID kanału**.

Jeśli potrzebujesz deterministycznego zachowania, zawsze używaj jawnych prefiksów (`user:<id>` / `channel:<id>`).

## Ponawianie DM channel

Gdy OpenClaw wysyła do celu DM w Mattermost i musi najpierw rozwiązać kanał bezpośredni,
domyślnie ponawia przejściowe błędy tworzenia kanału bezpośredniego.

Użyj `channels.mattermost.dmChannelRetry`, aby dostroić to zachowanie globalnie dla pluginu Mattermost,
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

- Dotyczy to tylko tworzenia kanału DM (`/api/v4/channels/direct`), a nie każdego wywołania API Mattermost.
- Ponowienia dotyczą przejściowych błędów, takich jak limity szybkości, odpowiedzi 5xx oraz błędy sieci lub timeouty.
- Błędy klienta 4xx inne niż `429` są traktowane jako trwałe i nie są ponawiane.

## Podgląd streamingu

Mattermost streamuje tok rozumowania, aktywność narzędzi i częściowy tekst odpowiedzi do jednego **posta roboczego podglądu**, który jest finalizowany w miejscu, gdy końcowa odpowiedź nadaje się do wysłania. Podgląd aktualizuje się na tym samym id posta zamiast zaśmiecać kanał wiadomościami per fragment. Finalne multimedia/błędy anulują oczekujące edycje podglądu i używają zwykłego dostarczenia zamiast opróżniania jednorazowego posta podglądu.

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

Uwagi:

- `partial` to zwykle najlepszy wybór: jeden post podglądu, który jest edytowany wraz z rozwojem odpowiedzi, a następnie finalizowany pełną odpowiedzią.
- `block` używa fragmentów roboczych w stylu dopisywania w poście podglądu.
- `progress` pokazuje podgląd statusu podczas generowania i publikuje końcową odpowiedź dopiero po zakończeniu.
- `off` wyłącza podgląd streamingu.
- Jeśli streamu nie da się sfinalizować w miejscu (na przykład post został usunięty w trakcie streamu), OpenClaw przechodzi do wysłania nowego posta końcowego, aby odpowiedź nigdy nie została utracona.
- Zobacz [Streaming](/pl/concepts/streaming#preview-streaming-modes), aby poznać macierz mapowania kanałów.

## Reakcje (narzędzie wiadomości)

- Użyj `message action=react` z `channel=mattermost`.
- `messageId` to id posta Mattermost.
- `emoji` przyjmuje nazwy takie jak `thumbsup` lub `:+1:` (dwukropki są opcjonalne).
- Ustaw `remove=true` (boolean), aby usunąć reakcję.
- Zdarzenia dodania/usunięcia reakcji są przekazywane jako zdarzenia systemowe do skierowanej sesji agenta.

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

- `text` (wymagane): etykieta wyświetlana.
- `callback_data` (wymagane): wartość odsyłana po kliknięciu (używana jako ID akcji).
- `style` (opcjonalne): `"default"`, `"primary"` lub `"danger"`.

Gdy użytkownik kliknie przycisk:

1. Wszystkie przyciski są zastępowane linią potwierdzenia (na przykład "✓ **Yes** selected by @user").
2. Agent otrzymuje wybór jako wiadomość przychodzącą i odpowiada.

Uwagi:

- Callbacki przycisków używają weryfikacji HMAC-SHA256 (automatycznie, bez dodatkowej konfiguracji).
- Mattermost usuwa callback data ze swoich odpowiedzi API (funkcja bezpieczeństwa), więc wszystkie przyciski
  są usuwane po kliknięciu — częściowe usunięcie nie jest możliwe.
- ID akcji zawierające łączniki lub podkreślenia są automatycznie sanityzowane
  (ograniczenie routingu Mattermost).

Konfiguracja:

- `channels.mattermost.capabilities`: tablica ciągów możliwości. Dodaj `"inlineButtons"`, aby
  włączyć opis narzędzia przycisków w promptcie systemowym agenta.
- `channels.mattermost.interactions.callbackBaseUrl`: opcjonalny zewnętrzny bazowy URL dla
  callbacków przycisków (na przykład `https://gateway.example.com`). Użyj tego, gdy Mattermost nie może
  bezpośrednio połączyć się z Gateway na jego hoście powiązania.
- W konfiguracjach wielokontowych możesz też ustawić to samo pole w
  `channels.mattermost.accounts.<id>.interactions.callbackBaseUrl`.
- Jeśli `interactions.callbackBaseUrl` zostanie pominięty, OpenClaw wyprowadzi URL callbacku z
  `gateway.customBindHost` + `gateway.port`, a następnie przejdzie do `http://localhost:<port>`.
- Zasada osiągalności: URL callbacku przycisku musi być osiągalny z serwera Mattermost.
  `localhost` działa tylko wtedy, gdy Mattermost i OpenClaw działają na tym samym hoście/w tej samej przestrzeni nazw sieci.
- Jeśli cel callbacku jest prywatny/tailnet/wewnętrzny, dodaj jego host/domenę do ustawienia Mattermost
  `ServiceSettings.AllowedUntrustedInternalConnections`.

### Bezpośrednia integracja API (zewnętrzne skrypty)

Zewnętrzne skrypty i Webhooki mogą publikować przyciski bezpośrednio przez REST API Mattermost
zamiast przez narzędzie `message` agenta. Używaj `buildButtonAttachments()` z
rozszerzenia, gdy to możliwe; jeśli publikujesz surowy JSON, stosuj te zasady:

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
            style: "primary", // opcjonalne: "default", "primary", "danger"
            integration: {
              url: "https://gateway.example.com/mattermost/interactions/default",
              context: {
                action_id: "mybutton01", // musi odpowiadać id przycisku (dla wyszukiwania nazwy)
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

**Krytyczne zasady:**

1. Załączniki trafiają do `props.attachments`, a nie do najwyższego poziomu `attachments` (są po cichu ignorowane).
2. Każda akcja potrzebuje `type: "button"` — bez tego kliknięcia są po cichu pochłaniane.
3. Każda akcja potrzebuje pola `id` — Mattermost ignoruje akcje bez ID.
4. `id` akcji musi być **wyłącznie alfanumeryczne** (`[a-zA-Z0-9]`). Łączniki i podkreślenia psują
   routowanie akcji po stronie serwera Mattermost (zwraca 404). Usuń je przed użyciem.
5. `context.action_id` musi odpowiadać `id` przycisku, aby komunikat potwierdzenia pokazywał
   nazwę przycisku (na przykład "Approve"), a nie surowe ID.
6. `context.action_id` jest wymagane — handler interakcji zwraca 400 bez niego.

**Generowanie tokenu HMAC:**

Gateway weryfikuje kliknięcia przycisków za pomocą HMAC-SHA256. Zewnętrzne skrypty muszą generować tokeny,
które odpowiadają logice weryfikacji Gateway:

1. Wyprowadź sekret z tokenu bota:
   `HMAC-SHA256(key="openclaw-mattermost-interactions", data=botToken)`
2. Zbuduj obiekt context ze wszystkimi polami **poza** `_token`.
3. Serializuj z **posortowanymi kluczami** i **bez spacji** (Gateway używa `JSON.stringify`
   z posortowanymi kluczami, co daje zwarty wynik).
4. Podpisz: `HMAC-SHA256(key=secret, data=serializedContext)`
5. Dodaj wynikowy skrót hex jako `_token` w context.

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
  `separators=(",", ":")`, aby dopasować zwarty wynik JavaScript (`{"key":"val"}`).
- Zawsze podpisuj **wszystkie** pola context (bez `_token`). Gateway usuwa `_token`, a potem
  podpisuje wszystko, co pozostało. Podpisanie tylko podzbioru powoduje cichą porażkę weryfikacji.
- Użyj `sort_keys=True` — Gateway sortuje klucze przed podpisaniem, a Mattermost może
  zmieniać kolejność pól context przy przechowywaniu ładunku.
- Wyprowadzaj sekret z tokenu bota (deterministycznie), a nie z losowych bajtów. Sekret
  musi być taki sam w procesie tworzącym przyciski i w Gateway, który je weryfikuje.

## Adapter katalogu

Plugin Mattermost zawiera adapter katalogu, który rozwiązuje nazwy kanałów i użytkowników
przez API Mattermost. Umożliwia to używanie celów `#channel-name` i `@username` w
`openclaw message send` oraz dostarczaniu przez Cron/Webhooki.

Nie jest potrzebna żadna konfiguracja — adapter używa tokenu bota z konfiguracji konta.

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

- Brak odpowiedzi na kanałach: upewnij się, że bot jest na kanale i wzmiankujesz go (oncall), użyj prefiksu wyzwalającego (onchar) albo ustaw `chatmode: "onmessage"`.
- Błędy uwierzytelniania: sprawdź token bota, bazowy URL i czy konto jest włączone.
- Problemy z wieloma kontami: zmienne środowiskowe dotyczą tylko konta `default`.
- Natywne polecenia slash zwracają `Unauthorized: invalid command token.`: OpenClaw
  nie zaakceptował tokenu callbacku. Typowe przyczyny:
  - rejestracja polecenia slash nie powiodła się albo ukończyła się tylko częściowo przy uruchamianiu
  - callback trafia do niewłaściwego Gateway/konta
  - Mattermost nadal ma stare polecenia wskazujące poprzedni cel callbacku
  - Gateway uruchomił się ponownie bez ponownej aktywacji natywnych poleceń slash
- Jeśli natywne polecenia slash przestaną działać, sprawdź logi pod kątem
  `mattermost: failed to register slash commands` lub
  `mattermost: native slash commands enabled but no commands could be registered`.
- Jeśli `callbackUrl` zostanie pominięty, a logi ostrzegają, że callback rozwiązał się do
  `http://127.0.0.1:18789/...`, ten URL prawdopodobnie jest osiągalny tylko wtedy,
  gdy Mattermost działa na tym samym hoście/w tej samej przestrzeni nazw sieci co OpenClaw. Ustaw
  jawny, zewnętrznie osiągalny `commands.callbackUrl`.
- Przyciski pojawiają się jako białe pola: agent może wysyłać nieprawidłowe dane przycisków. Sprawdź, czy każdy przycisk ma pola `text` i `callback_data`.
- Przyciski renderują się, ale kliknięcia nic nie robią: sprawdź, czy `AllowedUntrustedInternalConnections` w konfiguracji serwera Mattermost zawiera `127.0.0.1 localhost`, oraz czy `EnablePostActionIntegration` ma wartość `true` w `ServiceSettings`.
- Przyciski zwracają 404 po kliknięciu: `id` przycisku prawdopodobnie zawiera łączniki lub podkreślenia. Router akcji Mattermost nie działa z niealfanumerycznymi ID. Używaj wyłącznie `[a-zA-Z0-9]`.
- Logi Gateway pokazują `invalid _token`: niezgodność HMAC. Sprawdź, czy podpisujesz wszystkie pola context (a nie tylko podzbiór), używasz posortowanych kluczy i zwartego JSON-a (bez spacji). Zobacz sekcję HMAC powyżej.
- Logi Gateway pokazują `missing _token in context`: pole `_token` nie znajduje się w context przycisku. Upewnij się, że jest dołączone przy budowaniu ładunku integracji.
- Potwierdzenie pokazuje surowe ID zamiast nazwy przycisku: `context.action_id` nie odpowiada `id` przycisku. Ustaw oba na tę samą zsanityzowaną wartość.
- Agent nie wie o przyciskach: dodaj `capabilities: ["inlineButtons"]` do konfiguracji kanału Mattermost.

## Powiązane

- [Przegląd kanałów](/pl/channels) — wszystkie obsługiwane kanały
- [Parowanie](/pl/channels/pairing) — uwierzytelnianie DM i przepływ parowania
- [Grupy](/pl/channels/groups) — zachowanie czatu grupowego i bramka oparta na wzmiankach
- [Routing kanałów](/pl/channels/channel-routing) — routing sesji dla wiadomości
- [Bezpieczeństwo](/pl/gateway/security) — model dostępu i utwardzanie
