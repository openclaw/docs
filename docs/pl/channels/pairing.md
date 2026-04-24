---
read_when:
    - Konfigurowanie kontroli dostępu do wiadomości bezpośrednich
    - Parowanie nowego Node iOS/Android
    - Przeglądanie stanu bezpieczeństwa OpenClaw
summary: 'Przegląd parowania: zatwierdzanie, kto może wysyłać Ci wiadomości bezpośrednie i które Node mogą dołączać'
title: Parowanie
x-i18n:
    generated_at: "2026-04-24T08:59:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: 373eaa02865995ada0c906df9bad4e8328f085a8bb3679b0a5820dc397130137
    source_path: channels/pairing.md
    workflow: 15
---

„Parowanie” to jawny krok **zatwierdzenia przez właściciela** w OpenClaw.
Jest używany w dwóch miejscach:

1. **Parowanie wiadomości bezpośrednich** (kto może rozmawiać z botem)
2. **Parowanie Node** (które urządzenia/Node mogą dołączyć do sieci gateway)

Kontekst bezpieczeństwa: [Bezpieczeństwo](/pl/gateway/security)

## 1) Parowanie wiadomości bezpośrednich (przychodzący dostęp do czatu)

Gdy kanał jest skonfigurowany z zasadą wiadomości bezpośrednich `pairing`, nieznani nadawcy otrzymują krótki kod, a ich wiadomość **nie jest przetwarzana**, dopóki jej nie zatwierdzisz.

Domyślne zasady wiadomości bezpośrednich są opisane w: [Bezpieczeństwo](/pl/gateway/security)

Kody parowania:

- 8 znaków, wielkie litery, bez niejednoznacznych znaków (`0O1I`).
- **Wygasają po 1 godzinie**. Bot wysyła wiadomość parowania tylko wtedy, gdy tworzona jest nowa prośba (mniej więcej raz na godzinę na nadawcę).
- Oczekujące prośby o parowanie wiadomości bezpośrednich są domyślnie ograniczone do **3 na kanał**; dodatkowe prośby są ignorowane, dopóki jedna nie wygaśnie lub nie zostanie zatwierdzona.

### Zatwierdzanie nadawcy

```bash
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

Obsługiwane kanały: `bluebubbles`, `discord`, `feishu`, `googlechat`, `imessage`, `irc`, `line`, `matrix`, `mattermost`, `msteams`, `nextcloud-talk`, `nostr`, `openclaw-weixin`, `signal`, `slack`, `synology-chat`, `telegram`, `twitch`, `whatsapp`, `zalo`, `zalouser`.

### Gdzie przechowywany jest stan

Przechowywane w `~/.openclaw/credentials/`:

- Oczekujące prośby: `<channel>-pairing.json`
- Magazyn zatwierdzonej listy dozwolonych:
  - Konto domyślne: `<channel>-allowFrom.json`
  - Konto niedomyślne: `<channel>-<accountId>-allowFrom.json`

Zachowanie zakresu kont:

- Konta niedomyślne odczytują/zapisują tylko swój plik listy dozwolonych z odpowiednim zakresem.
- Konto domyślne używa nieobjętego zakresem pliku listy dozwolonych dla kanału.

Traktuj te pliki jako wrażliwe (kontrolują dostęp do Twojego asystenta).

Ważne: ten magazyn dotyczy dostępu do wiadomości bezpośrednich. Autoryzacja grup jest oddzielna.
Zatwierdzenie kodu parowania wiadomości bezpośrednich nie powoduje automatycznie, że ten nadawca może uruchamiać polecenia grupowe lub sterować botem w grupach. W przypadku dostępu grupowego skonfiguruj jawne listy dozwolonych dla grup w danym kanale (na przykład `groupAllowFrom`, `groups` albo nadpisania dla poszczególnych grup/tematów, zależnie od kanału).

## 2) Parowanie urządzeń Node (Node iOS/Android/macOS/headless)

Node łączą się z Gateway jako **urządzenia** z `role: node`. Gateway
tworzy prośbę o sparowanie urządzenia, którą trzeba zatwierdzić.

### Parowanie przez Telegram (zalecane dla iOS)

Jeśli używasz Plugin `device-pair`, możesz wykonać pierwsze parowanie urządzenia całkowicie z poziomu Telegrama:

1. W Telegramie wyślij wiadomość do swojego bota: `/pair`
2. Bot odpowie dwiema wiadomościami: wiadomością z instrukcją i osobną wiadomością z **kodem konfiguracji** (łatwym do skopiowania/wklejenia w Telegramie).
3. Na telefonie otwórz aplikację OpenClaw na iOS → Ustawienia → Gateway.
4. Wklej kod konfiguracji i połącz się.
5. Z powrotem w Telegramie: `/pair pending` (przejrzyj identyfikatory próśb, rolę i zakresy), a następnie zatwierdź.

Kod konfiguracji to zakodowany w base64 ładunek JSON, który zawiera:

- `url`: URL WebSocket Gateway (`ws://...` lub `wss://...`)
- `bootstrapToken`: krótkotrwały token bootstrap dla pojedynczego urządzenia używany podczas początkowego handshake parowania

Ten token bootstrap zawiera wbudowany profil bootstrap parowania:

- podstawowy przekazany token `node` pozostaje z `scopes: []`
- każdy przekazany token `operator` pozostaje ograniczony do listy dozwolonych bootstrap:
  `operator.approvals`, `operator.read`, `operator.talk.secrets`, `operator.write`
- sprawdzanie zakresów bootstrap jest poprzedzane rolą, a nie oparte na jednej płaskiej puli zakresów:
  wpisy zakresów operatora spełniają tylko żądania operatora, a role niebędące operatorem
  nadal muszą żądać zakresów pod własnym prefiksem roli

Traktuj kod konfiguracji jak hasło, dopóki jest ważny.

### Zatwierdzanie urządzenia Node

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

Jeśli to samo urządzenie ponowi próbę z innymi danymi uwierzytelniania (na przykład inną
rolą/zakresami/kluczem publicznym), poprzednia oczekująca prośba zostaje zastąpiona i tworzony jest nowy
`requestId`.

Ważne: już sparowane urządzenie nie otrzymuje po cichu szerszego dostępu. Jeśli
połączy się ponownie i poprosi o więcej zakresów lub szerszą rolę, OpenClaw zachowuje
istniejące zatwierdzenie bez zmian i tworzy nową oczekującą prośbę o rozszerzenie uprawnień. Użyj
`openclaw devices list`, aby porównać obecnie zatwierdzony dostęp z nowo
żądanym dostępem przed zatwierdzeniem.

### Przechowywanie stanu parowania Node

Przechowywane w `~/.openclaw/devices/`:

- `pending.json` (krótkotrwały; oczekujące prośby wygasają)
- `paired.json` (sparowane urządzenia + tokeny)

### Uwagi

- Starsze API `node.pair.*` (CLI: `openclaw nodes pending|approve|reject|rename`) to
  oddzielny magazyn parowania zarządzany przez gateway. Node WS nadal wymagają parowania urządzeń.
- Rekord parowania jest trwałym źródłem prawdy dla zatwierdzonych ról. Aktywne
  tokeny urządzeń pozostają ograniczone do zatwierdzonego zestawu ról; przypadkowy wpis tokenu
  poza zatwierdzonymi rolami nie tworzy nowego dostępu.

## Powiązana dokumentacja

- Model bezpieczeństwa + prompt injection: [Bezpieczeństwo](/pl/gateway/security)
- Bezpieczna aktualizacja (uruchom doctor): [Aktualizowanie](/pl/install/updating)
- Konfiguracje kanałów:
  - Telegram: [Telegram](/pl/channels/telegram)
  - WhatsApp: [WhatsApp](/pl/channels/whatsapp)
  - Signal: [Signal](/pl/channels/signal)
  - BlueBubbles (iMessage): [BlueBubbles](/pl/channels/bluebubbles)
  - iMessage (starsze): [iMessage](/pl/channels/imessage)
  - Discord: [Discord](/pl/channels/discord)
  - Slack: [Slack](/pl/channels/slack)
