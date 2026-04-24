---
read_when:
    - Konfigurowanie Mattermost
    - Debugowanie routingu Mattermost
summary: Konfiguracja bota Mattermost i konfiguracja OpenClaw
title: Mattermost
x-i18n:
    generated_at: "2026-04-24T08:58:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: 09c91790a2ea0149c179031b6c08e06358cb4efa5a027778cec87b38444d7718
    source_path: channels/mattermost.md
    workflow: 15
---

Status: dołączony Plugin (token bota + zdarzenia WebSocket). Obsługiwane są kanały, grupy i wiadomości prywatne.
Mattermost to samodzielnie hostowana platforma komunikacji zespołowej; szczegóły produktu i pliki do pobrania znajdziesz na oficjalnej stronie
[mattermost.com](https://mattermost.com).

## Dołączony Plugin

Mattermost jest dostarczany jako dołączony Plugin w bieżących wydaniach OpenClaw, więc standardowe
spakowane kompilacje nie wymagają osobnej instalacji.

Jeśli używasz starszej kompilacji lub niestandardowej instalacji bez Mattermost,
zainstaluj go ręcznie:

Instalacja przez CLI (rejestr npm):

```bash
openclaw plugins install @openclaw/mattermost
```

Lokalny checkout (przy uruchamianiu z repozytorium git):

```bash
openclaw plugins install ./path/to/local/mattermost-plugin
```

Szczegóły: [Pluginy](/pl/tools/plugin)

## Szybka konfiguracja

1. Upewnij się, że Plugin Mattermost jest dostępny.
   - Bieżące spakowane wydania OpenClaw zawierają go już w pakiecie.
   - Starsze/niestandardowe instalacje mogą dodać go ręcznie za pomocą powyższych poleceń.
2. Utwórz konto bota Mattermost i skopiuj **token bota**.
3. Skopiuj **bazowy URL** Mattermost (np. `https://chat.example.com`).
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

## Natywne polecenia ukośnikowe

Natywne polecenia ukośnikowe są opcjonalne. Po ich włączeniu OpenClaw rejestruje polecenia ukośnikowe `oc_*` przez
API Mattermost i odbiera callbacki POST na serwerze HTTP Gateway.

```json5
{
  channels: {
    mattermost: {
      commands: {
        native: true,
        nativeSkills: true,
        callbackPath: "/api/channels/mattermost/command",
        // Użyj, gdy Mattermost nie może połączyć się z Gateway bezpośrednio (reverse proxy/publiczny URL).
        callbackUrl: "https://gateway.example.com/api/channels/mattermost/command",
      },
    },
  },
}
```

Uwagi:

- `native: "auto"` domyślnie wyłącza tę funkcję dla Mattermost. Ustaw `native: true`, aby ją włączyć.
- Jeśli `callbackUrl` zostanie pominięty, OpenClaw wyprowadza go z hosta/portu Gateway + `callbackPath`.
- W konfiguracjach wielokontowych `commands` można ustawić na poziomie głównym lub w
  `channels.mattermost.accounts.<id>.commands` (wartości konta zastępują pola najwyższego poziomu).
- Callbacki poleceń są weryfikowane za pomocą tokenów per polecenie zwracanych przez
  Mattermost, gdy OpenClaw rejestruje polecenia `oc_*`.
- Callbacki poleceń są domyślnie blokowane przy błędzie, jeśli rejestracja się nie powiodła, uruchomienie było częściowe lub
  token callbacku nie odpowiada żadnemu z zarejestrowanych poleceń.
- Wymaganie dostępności: punkt końcowy callbacku musi być osiągalny z serwera Mattermost.
  - Nie ustawiaj `callbackUrl` na `localhost`, chyba że Mattermost działa na tym samym hoście/w tej samej przestrzeni nazw sieci co OpenClaw.
  - Nie ustawiaj `callbackUrl` na bazowy URL Mattermost, chyba że ten URL wykonuje reverse proxy dla `/api/channels/mattermost/command` do OpenClaw.
  - Szybki test to `curl https://<gateway-host>/api/channels/mattermost/command`; żądanie GET powinno zwrócić z OpenClaw `405 Method Not Allowed`, a nie `404`.
- Wymaganie allowlisty ruchu wychodzącego Mattermost:
  - Jeśli callback wskazuje na adresy prywatne/tailnet/wewnętrzne, ustaw w Mattermost
    `ServiceSettings.AllowedUntrustedInternalConnections`, aby zawierało host/domenę callbacku.
  - Używaj wpisów hosta/domeny, a nie pełnych URL-i.
    - Dobrze: `gateway.tailnet-name.ts.net`
    - Źle: `https://gateway.tailnet-name.ts.net`

## Zmienne środowiskowe (konto domyślne)

Ustaw je na hoście Gateway, jeśli wolisz używać zmiennych środowiskowych:

- `MATTERMOST_BOT_TOKEN=...`
- `MATTERMOST_URL=https://chat.example.com`

Zmienne środowiskowe dotyczą tylko **domyślnego** konta (`default`). Inne konta muszą używać wartości z konfiguracji.

`MATTERMOST_URL` nie może być ustawione z pliku `.env` obszaru roboczego; zobacz [Pliki `.env` obszaru roboczego](/pl/gateway/security).

## Tryby czatu

Mattermost odpowiada na wiadomości prywatne automatycznie. Zachowanie kanałów jest kontrolowane przez `chatmode`:

- `oncall` (domyślnie): odpowiadaj tylko po @wzmiance w kanałach.
- `onmessage`: odpowiadaj na każdą wiadomość kanałową.
- `onchar`: odpowiadaj, gdy wiadomość zaczyna się od prefiksu wyzwalającego.

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
- `channels.mattermost.requireMention` jest uwzględniane w starszych konfiguracjach, ale preferowane jest `chatmode`.

## Wątki i sesje

Użyj `channels.mattermost.replyToMode`, aby określić, czy odpowiedzi w kanałach i grupach mają pozostawać w
głównym kanale, czy rozpoczynać wątek pod postem wyzwalającym.

- `off` (domyślnie): odpowiadaj w wątku tylko wtedy, gdy przychodzący post już się w nim znajduje.
- `first`: dla postów najwyższego poziomu w kanałach/grupach rozpocznij wątek pod tym postem i kieruj
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

- Sesje ograniczone do wątku używają identyfikatora posta wyzwalającego jako korzenia wątku.
- `first` i `all` są obecnie równoważne, ponieważ gdy Mattermost ma już korzeń wątku,
  kolejne fragmenty i multimedia trafiają do tego samego wątku.

## Kontrola dostępu (wiadomości prywatne)

- Domyślnie: `channels.mattermost.dmPolicy = "pairing"` (nieznani nadawcy otrzymują kod parowania).
- Zatwierdzanie przez:
  - `openclaw pairing list mattermost`
  - `openclaw pairing approve mattermost <CODE>`
- Publiczne wiadomości prywatne: `channels.mattermost.dmPolicy="open"` plus `channels.mattermost.allowFrom=["*"]`.

## Kanały (grupy)

- Domyślnie: `channels.mattermost.groupPolicy = "allowlist"` (z bramkowaniem przez wzmianki).
- Dodawaj nadawców do allowlisty przez `channels.mattermost.groupAllowFrom` (zalecane są identyfikatory użytkowników).
- Nadpisania wymogu wzmianki per kanał znajdują się w `channels.mattermost.groups.<channelId>.requireMention`
  lub `channels.mattermost.groups["*"].requireMention` jako wartość domyślna.
- Dopasowywanie `@username` jest zmienne i włączane tylko, gdy `channels.mattermost.dangerouslyAllowNameMatching: true`.
- Otwarte kanały: `channels.mattermost.groupPolicy="open"` (z bramkowaniem przez wzmianki).
- Uwaga wykonawcza: jeśli `channels.mattermost` jest całkowicie nieobecne, środowisko wykonawcze wraca do `groupPolicy="allowlist"` przy sprawdzaniu grup (nawet jeśli ustawiono `channels.defaults.groupPolicy`).

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
- `user:<id>` dla wiadomości prywatnej
- `@username` dla wiadomości prywatnej (rozwiązywane przez API Mattermost)

Surowe niejawne identyfikatory (takie jak `64ifufp...`) są w Mattermost **niejednoznaczne** (ID użytkownika lub ID kanału).

OpenClaw rozwiązuje je **najpierw jako użytkownika**:

- Jeśli ID istnieje jako użytkownik (`GET /api/v4/users/<id>` zwraca sukces), OpenClaw wysyła **wiadomość prywatną**, rozwiązując kanał bezpośredni przez `/api/v4/channels/direct`.
- W przeciwnym razie ID jest traktowane jako **ID kanału**.

Jeśli potrzebujesz deterministycznego zachowania, zawsze używaj jawnych prefiksów (`user:<id>` / `channel:<id>`).

## Ponawianie dla kanału wiadomości prywatnych

Gdy OpenClaw wysyła do celu wiadomości prywatnej Mattermost i musi najpierw rozwiązać kanał bezpośredni,
domyślnie ponawia przejściowe błędy tworzenia kanału bezpośredniego.

Użyj `channels.mattermost.dmChannelRetry`, aby dostroić to zachowanie globalnie dla Pluginu Mattermost,
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
- Ponowienia dotyczą przejściowych błędów, takich jak limity szybkości, odpowiedzi 5xx oraz błędy sieci lub przekroczenia czasu.
- Błędy klienta 4xx inne niż `429` są traktowane jako trwałe i nie są ponawiane.

## Podgląd strumieniowy

Mattermost przesyła strumieniowo myślenie, aktywność narzędzi i częściowy tekst odpowiedzi do jednego **roboczego posta podglądu**, który jest finalizowany w tym samym miejscu, gdy końcowa odpowiedź jest gotowa do bezpiecznego wysłania. Podgląd aktualizuje się na tym samym identyfikatorze posta, zamiast zaśmiecać kanał wiadomościami dla każdego fragmentu. Końcowe wiadomości z multimediami/błędami anulują oczekujące edycje podglądu i używają zwykłego dostarczania zamiast publikowania jednorazowego posta podglądu.

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

- `partial` to zwykle najlepszy wybór: jeden post podglądu, który jest edytowany w miarę rozrastania się odpowiedzi, a następnie finalizowany kompletną odpowiedzią.
- `block` używa fragmentów roboczych dopisywanych wewnątrz posta podglądu.
- `progress` pokazuje podgląd statusu podczas generowania i publikuje końcową odpowiedź dopiero po zakończeniu.
- `off` wyłącza podgląd strumieniowy.
- Jeśli strumienia nie da się sfinalizować w miejscu (na przykład post został usunięty w trakcie), OpenClaw wraca do wysłania nowego końcowego posta, aby odpowiedź nigdy nie została utracona.
- Ładunki zawierające wyłącznie rozumowanie są pomijane w postach kanałowych, w tym tekst przychodzący jako blok cytatu `> Reasoning:`. Ustaw `/reasoning on`, aby widzieć tok myślenia na innych powierzchniach; końcowy post Mattermost zawiera tylko odpowiedź.
- Zobacz [Strumieniowanie](/pl/concepts/streaming#preview-streaming-modes), aby poznać macierz mapowania kanałów.

## Reakcje (narzędzie wiadomości)

- Użyj `message action=react` z `channel=mattermost`.
- `messageId` to identyfikator posta Mattermost.
- `emoji` akceptuje nazwy takie jak `thumbsup` lub `:+1:` (dwukropki są opcjonalne).
- Ustaw `remove=true` (wartość logiczna), aby usunąć reakcję.
- Zdarzenia dodawania/usuwania reakcji są przekazywane jako zdarzenia systemowe do kierowanej sesji agenta.

Przykłady:

```
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup remove=true
```

Konfiguracja:

- `channels.mattermost.actions.reactions`: włącz/wyłącz działania reakcji (domyślnie true).
- Nadpisanie per konto: `channels.mattermost.accounts.<id>.actions.reactions`.

## Przyciski interaktywne (narzędzie wiadomości)

Wysyłaj wiadomości z klikalnymi przyciskami. Gdy użytkownik kliknie przycisk, agent otrzymuje
wybór i może odpowiedzieć.

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

- `text` (wymagane): etykieta wyświetlana.
- `callback_data` (wymagane): wartość odsyłana po kliknięciu (używana jako identyfikator działania).
- `style` (opcjonalne): `"default"`, `"primary"` lub `"danger"`.

Gdy użytkownik kliknie przycisk:

1. Wszystkie przyciski są zastępowane linią potwierdzenia (np. "✓ **Yes** selected by @user").
2. Agent otrzymuje wybór jako wiadomość przychodzącą i odpowiada.

Uwagi:

- Callbacki przycisków używają weryfikacji HMAC-SHA256 (automatycznie, bez potrzeby konfiguracji).
- Mattermost usuwa dane callbacku ze swoich odpowiedzi API (funkcja bezpieczeństwa), więc wszystkie przyciski
  są usuwane po kliknięciu — częściowe usuwanie nie jest możliwe.
- Identyfikatory działań zawierające łączniki lub podkreślenia są automatycznie sanityzowane
  (ograniczenie routingu Mattermost).

Konfiguracja:

- `channels.mattermost.capabilities`: tablica ciągów możliwości. Dodaj `"inlineButtons"`, aby
  włączyć opis narzędzia przycisków w prompcie systemowym agenta.
- `channels.mattermost.interactions.callbackBaseUrl`: opcjonalny zewnętrzny bazowy URL dla callbacków
  przycisków (na przykład `https://gateway.example.com`). Użyj tego, gdy Mattermost nie może
  bezpośrednio połączyć się z Gateway pod jego hostem powiązania.
- W konfiguracjach wielokontowych możesz także ustawić to samo pole w
  `channels.mattermost.accounts.<id>.interactions.callbackBaseUrl`.
- Jeśli `interactions.callbackBaseUrl` zostanie pominięte, OpenClaw wyprowadza URL callbacku z
  `gateway.customBindHost` + `gateway.port`, a następnie wraca do `http://localhost:<port>`.
- Reguła dostępności: URL callbacku przycisku musi być osiągalny z serwera Mattermost.
  `localhost` działa tylko wtedy, gdy Mattermost i OpenClaw działają na tym samym hoście/w tej samej przestrzeni nazw sieci.
- Jeśli cel callbacku jest prywatny/tailnet/wewnętrzny, dodaj jego host/domenę do
  `ServiceSettings.AllowedUntrustedInternalConnections` w Mattermost.

### Bezpośrednia integracja z API (zewnętrzne skrypty)

Zewnętrzne skrypty i Webhooki mogą publikować przyciski bezpośrednio przez REST API Mattermost
zamiast przez narzędzie `message` agenta. Gdy to możliwe, używaj `buildButtonAttachments()` z
Pluginu; jeśli publikujesz surowy JSON, stosuj się do tych zasad:

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
            id: "mybutton01", // tylko znaki alfanumeryczne — patrz niżej
            type: "button", // wymagane, inaczej kliknięcia są po cichu ignorowane
            name: "Approve", // etykieta wyświetlana
            style: "primary", // opcjonalne: "default", "primary", "danger"
            integration: {
              url: "https://gateway.example.com/mattermost/interactions/default",
              context: {
                action_id: "mybutton01", // musi pasować do id przycisku (na potrzeby wyszukiwania nazwy)
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

**Krytyczne zasady:**

1. Załączniki trafiają do `props.attachments`, a nie do najwyższego poziomu `attachments` (w przeciwnym razie są po cichu ignorowane).
2. Każda akcja potrzebuje `type: "button"` — bez tego kliknięcia są po cichu pochłaniane.
3. Każda akcja potrzebuje pola `id` — Mattermost ignoruje akcje bez identyfikatorów.
4. `id` akcji musi zawierać **wyłącznie znaki alfanumeryczne** (`[a-zA-Z0-9]`). Łączniki i podkreślenia psują
   routowanie akcji po stronie serwera Mattermost (zwraca 404). Usuń je przed użyciem.
5. `context.action_id` musi odpowiadać `id` przycisku, aby komunikat potwierdzenia wyświetlał
   nazwę przycisku (np. "Approve"), a nie surowy identyfikator.
6. `context.action_id` jest wymagane — bez niego obsługa interakcji zwraca 400.

**Generowanie tokenu HMAC:**

Gateway weryfikuje kliknięcia przycisków za pomocą HMAC-SHA256. Zewnętrzne skrypty muszą generować tokeny
zgodne z logiką weryfikacji Gateway:

1. Wyprowadź sekret z tokenu bota:
   `HMAC-SHA256(key="openclaw-mattermost-interactions", data=botToken)`
2. Zbuduj obiekt kontekstu ze wszystkimi polami **oprócz** `_token`.
3. Serializuj z **posortowanymi kluczami** i **bez spacji** (Gateway używa `JSON.stringify`
   z posortowanymi kluczami, co daje zwarty wynik).
4. Podpisz: `HMAC-SHA256(key=secret, data=serializedContext)`
5. Dodaj wynikowy skrót szesnastkowy jako `_token` w kontekście.

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

Typowe pułapki związane z HMAC:

- `json.dumps` w Pythonie domyślnie dodaje spacje (`{"key": "val"}`). Użyj
  `separators=(",", ":")`, aby dopasować zwarty wynik JavaScript (`{"key":"val"}`).
- Zawsze podpisuj **wszystkie** pola kontekstu (bez `_token`). Gateway usuwa `_token`, a potem
  podpisuje wszystko, co pozostało. Podpisanie tylko podzbioru powoduje cichą porażkę weryfikacji.
- Użyj `sort_keys=True` — Gateway sortuje klucze przed podpisaniem, a Mattermost może
  zmieniać kolejność pól kontekstu podczas przechowywania ładunku.
- Wyprowadź sekret z tokenu bota (deterministycznie), a nie z losowych bajtów. Sekret
  musi być taki sam w procesie tworzącym przyciski i w Gateway, które je weryfikuje.

## Adapter katalogu

Plugin Mattermost zawiera adapter katalogu, który rozwiązuje nazwy kanałów i użytkowników
przez API Mattermost. Dzięki temu cele `#channel-name` i `@username` działają w
`openclaw message send` oraz w dostarczaniu Cron/Webhook.

Nie jest wymagana żadna konfiguracja — adapter używa tokenu bota z konfiguracji konta.

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

- Brak odpowiedzi w kanałach: upewnij się, że bot jest w kanale i oznaczasz go wzmianką (oncall), użyj prefiksu wyzwalającego (onchar) lub ustaw `chatmode: "onmessage"`.
- Błędy uwierzytelniania: sprawdź token bota, bazowy URL i to, czy konto jest włączone.
- Problemy z wieloma kontami: zmienne środowiskowe dotyczą tylko konta `default`.
- Natywne polecenia ukośnikowe zwracają `Unauthorized: invalid command token.`: OpenClaw
  nie zaakceptował tokenu callbacku. Typowe przyczyny:
  - rejestracja poleceń ukośnikowych nie powiodła się lub zakończyła się tylko częściowo podczas uruchamiania
  - callback trafia do niewłaściwego Gateway/konta
  - Mattermost nadal ma stare polecenia wskazujące na poprzedni cel callbacku
  - Gateway uruchomiono ponownie bez ponownej aktywacji poleceń ukośnikowych
- Jeśli natywne polecenia ukośnikowe przestaną działać, sprawdź logi pod kątem
  `mattermost: failed to register slash commands` lub
  `mattermost: native slash commands enabled but no commands could be registered`.
- Jeśli `callbackUrl` zostanie pominięte, a logi ostrzegają, że callback został rozwiązany do
  `http://127.0.0.1:18789/...`, ten URL prawdopodobnie jest osiągalny tylko wtedy,
  gdy Mattermost działa na tym samym hoście/w tej samej przestrzeni nazw sieci co OpenClaw. Ustaw
  jawny, zewnętrznie osiągalny `commands.callbackUrl`.
- Przyciski pojawiają się jako białe pola: agent może wysyłać nieprawidłowe dane przycisków. Sprawdź, czy każdy przycisk ma pola `text` i `callback_data`.
- Przyciski renderują się, ale kliknięcia nic nie robią: sprawdź, czy `AllowedUntrustedInternalConnections` w konfiguracji serwera Mattermost zawiera `127.0.0.1 localhost` oraz czy `EnablePostActionIntegration` ma wartość `true` w `ServiceSettings`.
- Kliknięcie przycisków zwraca 404: `id` przycisku prawdopodobnie zawiera łączniki lub podkreślenia. Router akcji Mattermost nie działa z niealfanumerycznymi identyfikatorami. Używaj wyłącznie `[a-zA-Z0-9]`.
- Gateway zapisuje w logach `invalid _token`: niedopasowanie HMAC. Sprawdź, czy podpisujesz wszystkie pola kontekstu (a nie tylko podzbiór), używasz posortowanych kluczy i zwartego JSON-u (bez spacji). Zobacz sekcję HMAC powyżej.
- Gateway zapisuje w logach `missing _token in context`: pole `_token` nie znajduje się w kontekście przycisku. Upewnij się, że jest dołączane przy budowaniu ładunku integracji.
- Potwierdzenie pokazuje surowy identyfikator zamiast nazwy przycisku: `context.action_id` nie odpowiada `id` przycisku. Ustaw oba na tę samą sanityzowaną wartość.
- Agent nie wie o przyciskach: dodaj `capabilities: ["inlineButtons"]` do konfiguracji kanału Mattermost.

## Powiązane

- [Przegląd kanałów](/pl/channels) — wszystkie obsługiwane kanały
- [Parowanie](/pl/channels/pairing) — uwierzytelnianie wiadomości prywatnych i przepływ parowania
- [Grupy](/pl/channels/groups) — zachowanie czatów grupowych i bramkowanie wzmianek
- [Routing kanałów](/pl/channels/channel-routing) — routing sesji dla wiadomości
- [Bezpieczeństwo](/pl/gateway/security) — model dostępu i utwardzanie
