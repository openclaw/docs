---
read_when:
    - Konfigurowanie kontroli dostępu do DM-ów
    - Parowanie nowego węzła iOS/Android
    - Przeglądanie modelu bezpieczeństwa OpenClaw
summary: 'Przegląd parowania: zatwierdzanie, kto może wysyłać Ci DM-y i które węzły mogą dołączyć'
title: Parowanie
x-i18n:
    generated_at: "2026-04-05T13:44:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2bd99240b3530def23c05a26915d07cf8b730565c2822c6338437f8fb3f285c9
    source_path: channels/pairing.md
    workflow: 15
---

# Parowanie

„Parowanie” to jawny krok **zatwierdzenia przez właściciela** w OpenClaw.
Jest używany w dwóch miejscach:

1. **Parowanie DM-ów** (kto może rozmawiać z botem)
2. **Parowanie węzłów** (które urządzenia/węzły mogą dołączyć do sieci gatewaya)

Kontekst bezpieczeństwa: [Bezpieczeństwo](/gateway/security)

## 1) Parowanie DM-ów (dostęp do czatu przychodzącego)

Gdy kanał jest skonfigurowany z zasadą DM `pairing`, nieznani nadawcy otrzymują krótki kod, a ich wiadomość **nie jest przetwarzana**, dopóki jej nie zatwierdzisz.

Domyślne zasady DM są opisane w: [Bezpieczeństwo](/gateway/security)

Kody parowania:

- 8 znaków, wielkie litery, bez niejednoznacznych znaków (`0O1I`).
- **Wygasają po 1 godzinie**. Bot wysyła wiadomość parowania tylko wtedy, gdy tworzona jest nowa prośba (mniej więcej raz na godzinę na nadawcę).
- Oczekujące prośby o parowanie DM są domyślnie ograniczone do **3 na kanał**; dodatkowe prośby są ignorowane, dopóki jedna nie wygaśnie lub nie zostanie zatwierdzona.

### Zatwierdzanie nadawcy

```bash
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

Obsługiwane kanały: `bluebubbles`, `discord`, `feishu`, `googlechat`, `imessage`, `irc`, `line`, `matrix`, `mattermost`, `msteams`, `nextcloud-talk`, `nostr`, `openclaw-weixin`, `signal`, `slack`, `synology-chat`, `telegram`, `twitch`, `whatsapp`, `zalo`, `zalouser`.

### Gdzie jest przechowywany stan

Przechowywane w `~/.openclaw/credentials/`:

- Oczekujące prośby: `<channel>-pairing.json`
- Magazyn zatwierdzonej listy dozwolonych:
  - Konto domyślne: `<channel>-allowFrom.json`
  - Konto niedomyślne: `<channel>-<accountId>-allowFrom.json`

Zachowanie zakresu kont:

- Konta niedomyślne odczytują/zapisują wyłącznie swój plik listy dozwolonych objęty zakresem.
- Konto domyślne używa nieobjętego zakresem pliku listy dozwolonych dla kanału.

Traktuj je jako dane wrażliwe (kontrolują dostęp do Twojego asystenta).

Ważne: ten magazyn dotyczy dostępu DM. Autoryzacja grup jest oddzielna.
Zatwierdzenie kodu parowania DM nie powoduje automatycznie, że ten nadawca może uruchamiać polecenia grupowe lub sterować botem w grupach. W przypadku dostępu do grup skonfiguruj jawne listy dozwolonych dla grup w danym kanale (na przykład `groupAllowFrom`, `groups` lub nadpisania per grupa/per temat zależnie od kanału).

## 2) Parowanie urządzeń węzłów (węzły iOS/Android/macOS/bezgłowe)

Węzły łączą się z Gateway jako **urządzenia** z `role: node`. Gateway
tworzy prośbę o sparowanie urządzenia, która musi zostać zatwierdzona.

### Parowanie przez Telegram (zalecane dla iOS)

Jeśli używasz pluginu `device-pair`, możesz przeprowadzić pierwsze parowanie urządzenia całkowicie z Telegrama:

1. W Telegram wyślij do swojego bota: `/pair`
2. Bot odpowie dwiema wiadomościami: wiadomością z instrukcją i osobną wiadomością z **kodem konfiguracji** (łatwym do skopiowania/wklejenia w Telegram).
3. Na telefonie otwórz aplikację OpenClaw na iOS → Ustawienia → Gateway.
4. Wklej kod konfiguracji i połącz się.
5. Wróć do Telegrama: `/pair pending` (przejrzyj identyfikatory próśb, rolę i zakresy), a następnie zatwierdź.

Kod konfiguracji to ładunek JSON zakodowany w base64, który zawiera:

- `url`: URL WebSocket Gatewaya (`ws://...` lub `wss://...`)
- `bootstrapToken`: krótkotrwały token bootstrap dla pojedynczego urządzenia używany w początkowym uzgadnianiu parowania

Ten token bootstrap zawiera wbudowany profil bootstrap parowania:

- główny przekazany token `node` pozostaje `scopes: []`
- każdy przekazany token `operator` pozostaje ograniczony do listy dozwolonych bootstrap:
  `operator.approvals`, `operator.read`, `operator.talk.secrets`, `operator.write`
- sprawdzanie zakresów bootstrap jest poprzedzone rolą, a nie oparte na jednej wspólnej puli zakresów:
  wpisy zakresów operatora spełniają tylko żądania operatora, a role inne niż operator
  nadal muszą żądać zakresów pod własnym prefiksem roli

Traktuj kod konfiguracji jak hasło, dopóki jest ważny.

### Zatwierdzanie urządzenia węzła

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

Jeśli to samo urządzenie spróbuje ponownie z innymi danymi uwierzytelniającymi (na przykład inną
rolą/zakresami/kluczem publicznym), poprzednia oczekująca prośba zostaje zastąpiona i tworzony jest nowy
`requestId`.

### Przechowywanie stanu parowania węzłów

Przechowywane w `~/.openclaw/devices/`:

- `pending.json` (krótkotrwałe; oczekujące prośby wygasają)
- `paired.json` (sparowane urządzenia + tokeny)

### Uwagi

- Starsze API `node.pair.*` (CLI: `openclaw nodes pending|approve|reject|rename`) to
  oddzielny magazyn parowania zarządzany przez gateway. Węzły WS nadal wymagają parowania urządzeń.
- Rekord parowania jest trwałym źródłem prawdy dla zatwierdzonych ról. Aktywne
  tokeny urządzeń pozostają ograniczone do tego zatwierdzonego zestawu ról; przypadkowy wpis tokena
  poza zatwierdzonymi rolami nie tworzy nowego dostępu.

## Powiązana dokumentacja

- Model bezpieczeństwa + prompt injection: [Bezpieczeństwo](/gateway/security)
- Bezpieczne aktualizowanie (uruchom doctor): [Aktualizowanie](/install/updating)
- Konfiguracje kanałów:
  - Telegram: [Telegram](/channels/telegram)
  - WhatsApp: [WhatsApp](/channels/whatsapp)
  - Signal: [Signal](/channels/signal)
  - BlueBubbles (iMessage): [BlueBubbles](/channels/bluebubbles)
  - iMessage (starsze): [iMessage](/channels/imessage)
  - Discord: [Discord](/channels/discord)
  - Slack: [Slack](/channels/slack)
