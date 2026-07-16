---
read_when:
    - Konfigurowanie kontroli dostępu do wiadomości prywatnych
    - Parowanie nowego węzła iOS/Android
    - Przegląd stanu zabezpieczeń OpenClaw
summary: 'Omówienie parowania: zatwierdzanie, kto może wysyłać Ci wiadomości prywatne i które węzły mogą dołączać'
title: Parowanie
x-i18n:
    generated_at: "2026-07-16T18:05:52Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: ef58100d222604ab2f0e073c268750eb0996b598dc37b3d4ca20a444d2c69f1e
    source_path: channels/pairing.md
    workflow: 16
---

„Parowanie” to jawny etap zatwierdzania dostępu w OpenClaw.
Jest używane w dwóch miejscach:

1. **Parowanie wiadomości prywatnych** (kto może komunikować się z botem)
2. **Parowanie Node** (które urządzenia/węzły mogą dołączać do sieci Gateway)

Kontekst bezpieczeństwa: [Bezpieczeństwo](/pl/gateway/security)

## 1) Parowanie wiadomości prywatnych (dostęp do czatu przychodzącego)

Gdy kanał jest skonfigurowany z zasadą wiadomości prywatnych `pairing`, nieznani nadawcy otrzymują krótki kod, a ich wiadomość **nie jest przetwarzana** do czasu zatwierdzenia.

Domyślne zasady wiadomości prywatnych opisano w: [Bezpieczeństwo](/pl/gateway/security)

`dmPolicy: "open"` jest publiczne tylko wtedy, gdy efektywna lista dozwolonych nadawców wiadomości prywatnych zawiera `"*"`.
Konfiguracja i walidacja wymagają tego symbolu wieloznacznego w konfiguracjach otwartych publicznie. Jeśli istniejący
stan zawiera `open` z konkretnymi wpisami `allowFrom`, środowisko uruchomieniowe nadal dopuszcza
tylko tych nadawców, a zatwierdzenia w magazynie parowania nie rozszerzają dostępu `open`.

Kody parowania:

- 8 znaków, wielkie litery, bez niejednoznacznych znaków (`0O1I`).
- **Wygasają po 1 godzinie**. Bot wysyła wiadomość dotyczącą parowania tylko po utworzeniu nowego żądania (w przybliżeniu raz na godzinę dla każdego nadawcy).
- Liczba oczekujących żądań parowania wiadomości prywatnych jest ograniczona do **3 na konto kanału**; dodatkowe żądania są ignorowane do czasu wygaśnięcia lub zatwierdzenia jednego z nich.

### Zatwierdzanie nadawcy

```bash
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

Dodaj `--notify` do polecenia zatwierdzającego, aby powiadomić osobę wysyłającą żądanie w tym samym kanale. Kanały obsługujące wiele kont przyjmują `--account <id>`.

Jeśli nie skonfigurowano jeszcze właściciela poleceń, zatwierdzenie kodu parowania wiadomości prywatnej inicjuje również
`commands.ownerAllowFrom` dla zatwierdzonego nadawcy, na przykład `telegram:123456789`.
Zapewnia to nowym konfiguracjom jawnego właściciela poleceń uprzywilejowanych i monitów
o zatwierdzenie wykonywania poleceń. Gdy właściciel już istnieje, późniejsze zatwierdzenia parowania przyznają tylko dostęp
do wiadomości prywatnych; nie dodają kolejnych właścicieli.

Obsługiwane kanały (każdy zainstalowany Plugin kanału deklarujący parowanie; zewnętrzne Pluginy, takie jak `openclaw-weixin`, mogą dodawać kolejne): `discord`, `feishu`, `googlechat`, `imessage`, `irc`, `line`, `matrix`, `mattermost`, `msteams`, `nextcloud-talk`, `nostr`, `signal`, `slack`, `sms`, `synology-chat`, `telegram`, `twitch`, `whatsapp`, `zalo`, `zalouser`.

### Grupy nadawców wielokrotnego użytku

Użyj `accessGroups` najwyższego poziomu, gdy ten sam zestaw zaufanych nadawców ma być stosowany do
wielu kanałów wiadomości lub zarówno do list dozwolonych nadawców wiadomości prywatnych, jak i grupowych.

Grupy statyczne używają `type: "message.senders"` i są przywoływane przez
`accessGroup:<name>` na listach dozwolonych nadawców kanałów:

```json5
{
  accessGroups: {
    operators: {
      type: "message.senders",
      members: {
        discord: ["discord:123456789012345678"],
        telegram: ["987654321"],
        whatsapp: ["+15551234567"],
      },
    },
  },
  channels: {
    telegram: { dmPolicy: "allowlist", allowFrom: ["accessGroup:operators"] },
    whatsapp: { groupPolicy: "allowlist", groupAllowFrom: ["accessGroup:operators"] },
  },
}
```

Grupy dostępu opisano szczegółowo tutaj: [Grupy dostępu](/pl/channels/access-groups)

### Lokalizacja stanu

Stan jest przechowywany we współdzielonej bazie danych stanu SQLite pod adresem
`~/.openclaw/state/openclaw.sqlite`:

- oczekujące żądania w `channel_pairing_requests`
- zatwierdzeni nadawcy w `channel_pairing_allow_entries`

Zakres kont:

- każde żądanie i każdy zatwierdzony nadawca są identyfikowani według kanału i konta
- środowisko uruchomieniowe odczytuje tylko kanoniczne wiersze SQLite; nie scala starszych plików

Starsze wersje Gateway zapisywały `<channel>-pairing.json` i
`<channel>-<accountId>-allowFrom.json` w `~/.openclaw/credentials/`.
Migracja podczas uruchamiania i `openclaw doctor --fix` importują te pliki do SQLite i
usuwają każde źródło po pomyślnym imporcie. Bazę danych SQLite należy traktować jako
poufną, ponieważ te wiersze kontrolują dostęp do asystenta.

<Note>
Magazyn listy dozwolonych nadawców parowania służy do obsługi dostępu do wiadomości prywatnych. Autoryzacja grupowa jest oddzielna.
Zatwierdzenie kodu parowania wiadomości prywatnej nie zezwala automatycznie temu nadawcy na wykonywanie poleceń
grupowych ani sterowanie botem w grupach. Inicjalizacja pierwszego właściciela stanowi oddzielny stan konfiguracji
w `commands.ownerAllowFrom`, a dostarczanie wiadomości na czacie grupowym nadal podlega
listom dozwolonych nadawców grupowych kanału (na przykład `groupAllowFrom`, `groups` albo nadpisaniom dla poszczególnych grup
lub tematów, zależnie od kanału).
</Note>

## 2) Parowanie urządzeń Node (węzły iOS/Android/macOS/bez interfejsu)

Węzły łączą się z Gateway jako **urządzenia** z `role: node`. Gateway
tworzy żądanie parowania urządzenia, które musi zostać zatwierdzone.

### Parowanie z poziomu Control UI (zalecane)

Użyj już połączonej sesji Control UI z dostępem `operator.admin`:

1. Otwórz Control UI i przejdź do **Settings → Devices**.
2. Na stronie **Devices** kliknij **Pair mobile device**.
3. Pozostaw wybraną opcję **Full access (recommended)** lub wybierz **Limited access**, aby pominąć
   administracyjne elementy sterujące Gateway.
4. Kliknij **Create setup code**.
5. Na telefonie otwórz aplikację OpenClaw → **Settings** → **Gateway**.
6. Zeskanuj kod QR lub wklej kod konfiguracji, a następnie nawiąż połączenie.

Oficjalne aplikacje OpenClaw na iOS i Androida są zatwierdzane automatycznie, gdy ich
metadane kodu konfiguracji są zgodne. Jeśli w sekcji **Pending approval** pojawi się żądanie (na
przykład od nieoficjalnego klienta lub z niezgodnymi metadanymi), przed zatwierdzeniem należy
sprawdzić jego rolę i zakresy.

Przycisk jest wyłączony, gdy bieżąca sesja Control UI nie ma
dostępu administratora. W takim przypadku należy użyć poniższego procesu zatwierdzania za pomocą CLI na hoście Gateway.

### Parowanie przez Telegram

Jeśli używany jest Plugin `device-pair`, pierwsze parowanie urządzenia można przeprowadzić w całości w Telegram:

1. W Telegram wyślij do bota wiadomość: `/pair`
2. Bot odpowie dwiema wiadomościami: wiadomością z instrukcjami i oddzielną wiadomością zawierającą **kod konfiguracji** (łatwy do skopiowania i wklejenia w Telegram).
3. Na telefonie otwórz aplikację OpenClaw na iOS → Settings → Gateway.
4. Zeskanuj kod QR (`/pair qr`) lub wklej kod konfiguracji i nawiąż połączenie.
5. Oficjalna aplikacja mobilna połączy się automatycznie. Jeśli `/pair pending` wyświetli
   żądanie, przed jego zatwierdzeniem należy sprawdzić rolę i zakresy.

Kod konfiguracji jest zakodowanym w base64 ładunkiem JSON zawierającym:

- `url`: adres URL WebSocket Gateway (`ws://...` lub `wss://...`)
- `urls`: jeśli są dostępne, uporządkowane trasy LAN/Tailnet, które aplikacja mobilna może wypróbować
- `bootstrapToken`: jednorazowy token inicjujący pierwszą procedurę uzgadniania parowania; Gateway unieważnia go po 10 minutach

Po zakończeniu parowania uruchom `/pair cleanup`, aby unieważnić niewykorzystane kody konfiguracji.

Ten token inicjujący zawiera wbudowany profil inicjowania parowania:

- bezpieczna konfiguracja `wss://` (lub sprzężenie zwrotne tego samego hosta) domyślnie zapewnia `node` oraz pełny
  natywny mobilny dostęp `operator`
- przekazany token `node` pozostaje `scopes: []`
- domyślny przekazany token `operator` obejmuje `operator.admin`,
  `operator.approvals`, `operator.read`, `operator.talk.secrets` oraz
  `operator.write`
- Opcja Control UI **Limited access** oraz `openclaw qr --limited` pomijają
  `operator.admin`, zachowując pozostałe zakresy operatora
- konfiguracja zwykłego tekstu `ws://` w sieci LAN automatycznie używa tego samego ograniczonego profilu;
  skonfiguruj `wss://` lub Tailscale Serve i wygeneruj nowy kod, aby uzyskać pełny dostęp
- późniejsze obracanie lub unieważnianie tokenów pozostaje ograniczone zarówno przez zatwierdzoną
  umowę roli urządzenia, jak i zakresy operatora sesji wywołującej

Kod konfiguracji należy traktować jak hasło, dopóki jest ważny.

Strony **Settings → Gateway** w aplikacjach na iOS i Androida wyświetlają dostęp **Full** lub **Limited**.
Aby rozszerzyć dostęp telefonu z ograniczonego, należy najpierw skonfigurować bezpieczną trasę `wss://` lub
Tailscale Serve, następnie wygenerować nowy kod konfiguracji z pełnym dostępem, zeskanować go lub wkleić
na tej stronie ustawień i ponownie nawiązać połączenie.

Do zdalnego parowania urządzeń mobilnych za pośrednictwem Tailscale, sieci publicznej lub innych metod należy użyć Tailscale Serve/Funnel
albo innego adresu URL Gateway `wss://`. Kody konfiguracji ze zwykłym tekstem `ws://` są akceptowane tylko
dla adresów sprzężenia zwrotnego, prywatnych adresów LAN, hostów Bonjour `.local` i hosta
emulatora Androida. Trasy ze zwykłym tekstem niebędące sprzężeniem zwrotnym otrzymują ograniczony dostęp. Adresy CGNAT
Tailnet, nazwy `.ts.net` i hosty publiczne nadal są domyślnie odrzucane przed
wydaniem kodu QR/kodu konfiguracji.

W przypadku adresów URL konfiguracji `gateway.bind=lan` OpenClaw wykrywa trwałe główne adresy HTTPS Tailscale Serve,
które pośredniczą do portu sprzężenia zwrotnego aktywnego Gateway, i ogłasza je
wraz z trasą LAN. Polecenie konfiguracji dodaje tę trasę awaryjną tylko
dla `lan`; `custom` i `tailnet` zachowują jawnie ogłaszane trasy. Aplikacja
na iOS sprawdza ogłaszane trasy w kolejności i zapisuje pierwszy osiągalny
punkt końcowy.

### Zatwierdzanie urządzenia Node

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

Gdy jawne zatwierdzenie zostanie odrzucone, ponieważ sesja zatwierdzającego sparowanego urządzenia
została otwarta z zakresem wyłącznie do parowania, CLI ponawia to samo żądanie z
`operator.admin`. Pozwala to istniejącemu sparowanemu urządzeniu z uprawnieniami administratora odzyskać nowe
parowanie Control UI/przeglądarki bez ręcznego edytowania magazynu parowania. Gateway
nadal weryfikuje ponowione połączenie; tokeny, które nie mogą zostać uwierzytelnione
za pomocą `operator.admin`, pozostają zablokowane.

Jeśli to samo urządzenie ponowi próbę z innymi danymi uwierzytelniającymi (na przykład inną
rolą, innymi zakresami lub kluczem publicznym), poprzednie oczekujące żądanie zostanie zastąpione i zostanie utworzony nowy
`requestId`.

<Note>
Już sparowane urządzenie nie uzyskuje po cichu szerszego dostępu. Jeśli ponownie łączy się, żądając większej liczby zakresów lub szerszej roli, OpenClaw pozostawia istniejące zatwierdzenie bez zmian i tworzy nowe oczekujące żądanie rozszerzenia. Przed zatwierdzeniem użyj `openclaw devices list`, aby porównać obecnie zatwierdzony dostęp z nowo żądanym dostępem.
</Note>

### Opcjonalne automatyczne zatwierdzanie Node z zaufanych zakresów CIDR

Parowanie urządzeń domyślnie pozostaje ręczne. W ściśle kontrolowanych sieciach węzłów
można włączyć automatyczne zatwierdzanie pierwszego parowania Node za pomocą jawnych zakresów CIDR lub dokładnych adresów IP:

```json5
{
  gateway: {
    nodes: {
      pairing: {
        autoApproveCidrs: ["192.168.1.0/24"],
      },
    },
  },
}
```

Dotyczy to tylko nowych żądań parowania `role: node`, które nie mają żądanych
zakresów. Klienci operatora, przeglądarki, Control UI i WebChat nadal wymagają ręcznego
zatwierdzenia. Zmiany roli, zakresu, metadanych i klucza publicznego nadal wymagają ręcznego
zatwierdzenia.

### Przechowywanie stanu parowania Node

Stan jest przechowywany we współdzielonej bazie danych stanu SQLite pod adresem `~/.openclaw/state/openclaw.sqlite`:

- oczekujące żądania parowania urządzeń (krótkotrwałe; wygasają po 5 minutach)
- sparowane urządzenia i tokeny

Starsze wersje Gateway przechowywały ten stan w `~/.openclaw/devices/*.json`; pliki te są
importowane do SQLite podczas uruchamiania Gateway i archiwizowane z przyrostkiem `.migrated`.

### Uwagi

- Interfejs API `node.pair.*` (CLI: `openclaw nodes pending|approve|reject|remove|rename`) zarządza
  zatwierdzeniami możliwości Node przechowywanymi w tych samych rekordach sparowanych urządzeń. Węzły WS
  nadal wymagają parowania urządzenia; zobacz [Parowanie Node](/pl/gateway/pairing).
- Rekord parowania jest trwałym źródłem prawdy o zatwierdzonych rolach. Aktywne
  tokeny urządzeń pozostają ograniczone do tego zatwierdzonego zestawu ról; przypadkowy wpis tokenu
  spoza zatwierdzonych ról nie tworzy nowego dostępu.

## Powiązana dokumentacja

- Model bezpieczeństwa i wstrzykiwanie promptów: [Bezpieczeństwo](/pl/gateway/security)
- Bezpieczne aktualizowanie (uruchom doctor): [Aktualizowanie](/pl/install/updating)
- Konfiguracje kanałów:
  - Telegram: [Telegram](/pl/channels/telegram)
  - WhatsApp: [WhatsApp](/pl/channels/whatsapp)
  - Signal: [Signal](/pl/channels/signal)
  - iMessage: [iMessage](/pl/channels/imessage)
  - Discord: [Discord](/pl/channels/discord)
  - Slack: [Slack](/pl/channels/slack)
