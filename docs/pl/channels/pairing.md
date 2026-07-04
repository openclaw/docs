---
read_when:
    - Konfigurowanie kontroli dostępu do wiadomości prywatnych
    - Parowanie nowego węzła iOS/Android
    - Przegląd stanu bezpieczeństwa OpenClaw
summary: 'Przegląd parowania: zatwierdź, kto może wysłać Ci wiadomość prywatną + które węzły mogą dołączyć'
title: Parowanie
x-i18n:
    generated_at: "2026-07-04T18:22:50Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e9c6508b8fd991f3a61ce026d1d453364de566a5b1373a6311ad24f43dcdb267
    source_path: channels/pairing.md
    workflow: 16
---

„Parowanie” to jawny krok zatwierdzania dostępu w OpenClaw.
Jest używane w dwóch miejscach:

1. **Parowanie DM** (kto może rozmawiać z botem)
2. **Parowanie Node** (które urządzenia/węzły mogą dołączyć do sieci gateway)

Kontekst bezpieczeństwa: [Bezpieczeństwo](/pl/gateway/security)

## 1) Parowanie DM (dostęp do czatu przychodzącego)

Gdy kanał jest skonfigurowany z zasadą DM `pairing`, nieznani nadawcy otrzymują krótki kod, a ich wiadomość **nie jest przetwarzana**, dopóki jej nie zatwierdzisz.

Domyślne zasady DM są udokumentowane tutaj: [Bezpieczeństwo](/pl/gateway/security)

`dmPolicy: "open"` jest publiczne tylko wtedy, gdy efektywna lista dozwolonych DM zawiera `"*"`.
Konfiguracja i walidacja wymagają tego symbolu wieloznacznego dla konfiguracji publicznie otwartych. Jeśli istniejący
stan zawiera `open` z konkretnymi wpisami `allowFrom`, środowisko uruchomieniowe nadal dopuszcza
tylko tych nadawców, a zatwierdzenia w magazynie parowania nie rozszerzają dostępu `open`.

Kody parowania:

- 8 znaków, wielkie litery, bez niejednoznacznych znaków (`0O1I`).
- **Wygasają po 1 godzinie**. Bot wysyła wiadomość parowania tylko wtedy, gdy zostanie utworzone nowe żądanie (mniej więcej raz na godzinę na nadawcę).
- Oczekujące żądania parowania DM są domyślnie ograniczone do **3 na kanał**; dodatkowe żądania są ignorowane, dopóki jedno nie wygaśnie albo nie zostanie zatwierdzone.

### Zatwierdź nadawcę

```bash
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

Jeśli właściciel poleceń nie jest jeszcze skonfigurowany, zatwierdzenie kodu parowania DM inicjalizuje także
`commands.ownerAllowFrom` na zatwierdzonego nadawcę, na przykład `telegram:123456789`.
Daje to konfiguracjom tworzonym po raz pierwszy jawnego właściciela dla uprzywilejowanych poleceń i monitów
zatwierdzania wykonywania. Po utworzeniu właściciela późniejsze zatwierdzenia parowania nadają tylko dostęp
DM; nie dodają kolejnych właścicieli.

Obsługiwane kanały: `discord`, `feishu`, `googlechat`, `imessage`, `irc`, `line`, `matrix`, `mattermost`, `msteams`, `nextcloud-talk`, `nostr`, `openclaw-weixin`, `signal`, `slack`, `synology-chat`, `telegram`, `twitch`, `whatsapp`, `zalo`, `zalouser`.

### Grupy nadawców wielokrotnego użytku

Użyj najwyższego poziomu `accessGroups`, gdy ten sam zestaw zaufanych nadawców powinien mieć zastosowanie do
wielu kanałów wiadomości albo zarówno do list dozwolonych DM, jak i grup.

Grupy statyczne używają `type: "message.senders"` i są przywoływane przez
`accessGroup:<name>` z list dozwolonych kanału:

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

Grupy dostępu są szczegółowo udokumentowane tutaj: [Grupy dostępu](/pl/channels/access-groups)

### Gdzie znajduje się stan

Przechowywane w `~/.openclaw/credentials/`:

- Oczekujące żądania: `<channel>-pairing.json`
- Magazyn zatwierdzonej listy dozwolonych:
  - Konto domyślne: `<channel>-allowFrom.json`
  - Konto inne niż domyślne: `<channel>-<accountId>-allowFrom.json`

Zachowanie zakresu konta:

- Konta inne niż domyślne odczytują/zapisują tylko swój plik listy dozwolonych o określonym zakresie.
- Konto domyślne używa pliku listy dozwolonych o zakresie kanału bez dodatkowego zakresu.

Traktuj je jako poufne (kontrolują dostęp do twojego asystenta).

<Note>
Magazyn listy dozwolonych parowania służy do dostępu DM. Autoryzacja grup jest osobna.
Zatwierdzenie kodu parowania DM nie pozwala automatycznie temu nadawcy uruchamiać poleceń
grupowych ani kontrolować bota w grupach. Inicjalizacja pierwszego właściciela to osobny stan
konfiguracji w `commands.ownerAllowFrom`, a dostarczanie czatu grupowego nadal podlega listom
dozwolonych grup danego kanału (na przykład `groupAllowFrom`, `groups` albo nadpisaniom dla grupy
lub tematu, zależnie od kanału).
</Note>

## 2) Parowanie urządzeń Node (węzły iOS/Android/macOS/headless)

Węzły łączą się z Gateway jako **urządzenia** z `role: node`. Gateway
tworzy żądanie parowania urządzenia, które musi zostać zatwierdzone.

### Parowanie z Control UI (zalecane)

Użyj już połączonej sesji Control UI z dostępem `operator.admin`:

1. Otwórz Control UI i wybierz **Węzły**.
2. W sekcji **Urządzenia** kliknij **Sparuj urządzenie mobilne**.
3. Na telefonie otwórz aplikację OpenClaw → **Ustawienia** → **Gateway**.
4. Zeskanuj kod QR albo wklej kod konfiguracji, a następnie połącz się.

Oficjalne aplikacje OpenClaw na iOS i Androida są zatwierdzane automatycznie, gdy ich
metadane kodu konfiguracji pasują. Jeśli sekcja **Urządzenia** pokazuje oczekujące żądanie (na
przykład dla nieoficjalnego klienta albo niezgodnych metadanych), przed zatwierdzeniem sprawdź jego rolę i
zakresy.

Przycisk jest wyłączony, gdy bieżąca sesja Control UI nie ma dostępu
administratora. W takim przypadku użyj poniższego przepływu zatwierdzania przez CLI z hosta Gateway.

### Parowanie przez Telegram

Jeśli używasz Pluginu `device-pair`, pierwsze parowanie urządzenia możesz wykonać w całości z Telegram:

1. W Telegram wyślij wiadomość do swojego bota: `/pair`
2. Bot odpowie dwiema wiadomościami: wiadomością z instrukcją i osobną wiadomością z **kodem konfiguracji** (łatwą do skopiowania/wklejenia w Telegram).
3. Na telefonie otwórz aplikację OpenClaw na iOS → Ustawienia → Gateway.
4. Zeskanuj kod QR albo wklej kod konfiguracji i połącz się.
5. Oficjalna aplikacja mobilna łączy się automatycznie. Jeśli `/pair pending` pokazuje
   żądanie, przed zatwierdzeniem sprawdź jego rolę i zakresy.

Kod konfiguracji to zakodowany w base64 ładunek JSON, który zawiera:

- `url`: adres URL WebSocket Gateway (`ws://...` albo `wss://...`)
- `bootstrapToken`: krótkotrwały token bootstrap pojedynczego urządzenia używany do początkowego uzgadniania parowania

Ten token bootstrap przenosi wbudowany profil bootstrap parowania:

- wbudowany profil konfiguracji zezwala tylko na świeży bazowy zakres QR/kodu konfiguracji:
  `node` plus ograniczone przekazanie `operator`
- przekazany token `node` pozostaje `scopes: []`
- przekazany token `operator` jest ograniczony do `operator.approvals`,
  `operator.read`, `operator.talk.secrets` i `operator.write`
- `operator.admin` nie jest nadawany przez bootstrap QR/kodu konfiguracji; wymaga
  osobnego zatwierdzonego parowania operatora albo przepływu tokenu
- późniejsza rotacja/odwołanie tokenu pozostaje ograniczone zarówno przez zatwierdzony
  kontrakt roli urządzenia, jak i zakresy operatora sesji wywołującej

Traktuj kod konfiguracji jak hasło, dopóki jest ważny.

W przypadku Tailscale, publicznego albo innego zdalnego parowania mobilnego użyj Tailscale Serve/Funnel
albo innego adresu URL Gateway `wss://`. Kody konfiguracji w postaci zwykłego tekstu `ws://` są akceptowane tylko
dla local loopback, prywatnych adresów LAN, hostów Bonjour `.local` i hosta emulatora
Android. Adresy CGNAT tailnetu, nazwy `.ts.net` i hosty publiczne nadal
odmawiają bezpiecznie przed wydaniem QR/kodu konfiguracji.

### Zatwierdź urządzenie Node

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

Gdy jawne zatwierdzenie zostaje odrzucone, ponieważ zatwierdzająca sesja sparowanego urządzenia
została otwarta z zakresem tylko do parowania, CLI ponawia to samo żądanie z
`operator.admin`. Pozwala to istniejącemu sparowanemu urządzeniu z uprawnieniami administratora odzyskać nowe
parowanie Control UI/przeglądarki bez ręcznej edycji `devices/paired.json`.
Gateway nadal waliduje ponowione połączenie; tokeny, które nie mogą uwierzytelnić się
z `operator.admin`, pozostają zablokowane.

Jeśli to samo urządzenie ponawia próbę z innymi szczegółami uwierzytelniania (na przykład inną
rolą/zakresami/kluczem publicznym), poprzednie oczekujące żądanie zostaje zastąpione i tworzony jest nowy
`requestId`.

<Note>
Już sparowane urządzenie nie otrzymuje po cichu szerszego dostępu. Jeśli ponownie łączy się, prosząc o więcej zakresów albo szerszą rolę, OpenClaw pozostawia istniejące zatwierdzenie bez zmian i tworzy świeże oczekujące żądanie podniesienia uprawnień. Użyj `openclaw devices list`, aby porównać aktualnie zatwierdzony dostęp z nowo żądanym dostępem przed zatwierdzeniem.
</Note>

### Opcjonalne automatyczne zatwierdzanie Node z zaufanego CIDR

Parowanie urządzeń domyślnie pozostaje ręczne. W ściśle kontrolowanych sieciach Node
możesz włączyć automatyczne zatwierdzanie pierwszego parowania Node przy użyciu jawnych CIDR albo dokładnych adresów IP:

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

Dotyczy to tylko świeżych żądań parowania `role: node` bez żądanych
zakresów. Klienci operatora, przeglądarki, Control UI i WebChat nadal wymagają ręcznego
zatwierdzenia. Zmiany roli, zakresu, metadanych i klucza publicznego nadal wymagają ręcznego
zatwierdzenia.

### Przechowywanie stanu parowania Node

Przechowywane w `~/.openclaw/devices/`:

- `pending.json` (krótkotrwałe; oczekujące żądania wygasają)
- `paired.json` (sparowane urządzenia + tokeny)

### Uwagi

- Starsze API `node.pair.*` (CLI: `openclaw nodes pending|approve|reject|remove|rename`) jest
  osobnym magazynem parowania należącym do gateway. Węzły WS nadal wymagają parowania urządzenia.
- Rekord parowania jest trwałym źródłem prawdy dla zatwierdzonych ról. Aktywne
  tokeny urządzenia pozostają ograniczone do tego zatwierdzonego zestawu ról; zabłąkany wpis tokenu
  poza zatwierdzonymi rolami nie tworzy nowego dostępu.

## Powiązana dokumentacja

- Model bezpieczeństwa + wstrzykiwanie promptów: [Bezpieczeństwo](/pl/gateway/security)
- Bezpieczne aktualizowanie (uruchom doctor): [Aktualizowanie](/pl/install/updating)
- Konfiguracje kanałów:
  - Telegram: [Telegram](/pl/channels/telegram)
  - WhatsApp: [WhatsApp](/pl/channels/whatsapp)
  - Signal: [Signal](/pl/channels/signal)
  - iMessage: [iMessage](/pl/channels/imessage)
  - Discord: [Discord](/pl/channels/discord)
  - Slack: [Slack](/pl/channels/slack)
