---
read_when:
    - Konfigurowanie kontroli dostępu do DM
    - Parowanie nowego Node iOS/Android
    - Przegląd stanu bezpieczeństwa OpenClaw
summary: 'Przegląd parowania: zatwierdź, kto może wysyłać Ci wiadomości prywatne + które węzły mogą dołączyć'
title: Parowanie
x-i18n:
    generated_at: "2026-05-06T09:03:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5543c10868418234714b175cd4bd373818be8dd40327121ac6c44819ed7519b2
    source_path: channels/pairing.md
    workflow: 16
---

„Parowanie” to jawny krok zatwierdzenia dostępu w OpenClaw.
Jest używane w dwóch miejscach:

1. **Parowanie DM** (kto może rozmawiać z botem)
2. **Parowanie Node** (które urządzenia/węzły mogą dołączyć do sieci Gateway)

Kontekst bezpieczeństwa: [Bezpieczeństwo](/pl/gateway/security)

## 1) Parowanie DM (dostęp do czatu przychodzącego)

Gdy kanał jest skonfigurowany z polityką DM `pairing`, nieznani nadawcy otrzymują krótki kod, a ich wiadomość **nie jest przetwarzana**, dopóki jej nie zatwierdzisz.

Domyślne polityki DM są udokumentowane tutaj: [Bezpieczeństwo](/pl/gateway/security)

`dmPolicy: "open"` jest publiczne tylko wtedy, gdy efektywna lista dozwolonych nadawców DM zawiera `"*"`.
Konfiguracja i walidacja wymagają tego symbolu wieloznacznego dla konfiguracji public-open. Jeśli istniejący
stan zawiera `open` z konkretnymi wpisami `allowFrom`, środowisko uruchomieniowe nadal dopuszcza
tylko tych nadawców, a zatwierdzenia w magazynie parowania nie rozszerzają dostępu `open`.

Kody parowania:

- 8 znaków, wielkie litery, bez znaków niejednoznacznych (`0O1I`).
- **Wygasają po 1 godzinie**. Bot wysyła wiadomość parowania tylko wtedy, gdy zostaje utworzone nowe żądanie (mniej więcej raz na godzinę na nadawcę).
- Oczekujące żądania parowania DM są domyślnie ograniczone do **3 na kanał**; dodatkowe żądania są ignorowane, dopóki jedno nie wygaśnie albo nie zostanie zatwierdzone.

### Zatwierdzanie nadawcy

```bash
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

Jeśli właściciel poleceń nie jest jeszcze skonfigurowany, zatwierdzenie kodu parowania DM uruchamia także
`commands.ownerAllowFrom` dla zatwierdzonego nadawcy, na przykład `telegram:123456789`.
Daje to pierwszym konfiguracjom jawnego właściciela dla uprzywilejowanych poleceń i monitów zatwierdzania
wykonań. Po utworzeniu właściciela późniejsze zatwierdzenia parowania przyznają tylko dostęp DM;
nie dodają kolejnych właścicieli.

Obsługiwane kanały: `bluebubbles`, `discord`, `feishu`, `googlechat`, `imessage`, `irc`, `line`, `matrix`, `mattermost`, `msteams`, `nextcloud-talk`, `nostr`, `openclaw-weixin`, `signal`, `slack`, `synology-chat`, `telegram`, `twitch`, `whatsapp`, `zalo`, `zalouser`.

### Grupy nadawców wielokrotnego użytku

Użyj najwyższego poziomu `accessGroups`, gdy ten sam zestaw zaufanych nadawców ma mieć zastosowanie do
wielu kanałów wiadomości albo zarówno do list dozwolonych DM, jak i grup.

Grupy statyczne używają `type: "message.senders"` i są przywoływane przez
`accessGroup:<name>` z list dozwolonych kanałów:

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

Zachowanie zakresu kont:

- Konta inne niż domyślne odczytują/zapisują tylko swój plik listy dozwolonych w zakresie konta.
- Konto domyślne używa niezawężonego pliku listy dozwolonych o zakresie kanału.

Traktuj je jako poufne (kontrolują dostęp do Twojego asystenta).

<Note>
Magazyn listy dozwolonych parowania służy do dostępu DM. Autoryzacja grup jest oddzielna.
Zatwierdzenie kodu parowania DM nie pozwala automatycznie temu nadawcy uruchamiać poleceń grupowych
ani sterować botem w grupach. Bootstrap pierwszego właściciela to oddzielny stan konfiguracji
w `commands.ownerAllowFrom`, a dostarczanie czatu grupowego nadal podlega listom dozwolonych grup
danego kanału (na przykład `groupAllowFrom`, `groups` albo zastąpieniom na grupę
lub na temat, zależnie od kanału).
</Note>

## 2) Parowanie urządzenia Node (węzły iOS/Android/macOS/headless)

Węzły łączą się z Gateway jako **urządzenia** z `role: node`. Gateway
tworzy żądanie parowania urządzenia, które musi zostać zatwierdzone.

### Parowanie przez Telegram (zalecane dla iOS)

Jeśli używasz Plugin `device-pair`, możesz przeprowadzić pierwsze parowanie urządzenia całkowicie z Telegram:

1. W Telegram wyślij wiadomość do swojego bota: `/pair`
2. Bot odpowie dwiema wiadomościami: wiadomością z instrukcjami oraz osobną wiadomością z **kodem konfiguracji** (łatwą do skopiowania/wklejenia w Telegram).
3. Na telefonie otwórz aplikację OpenClaw iOS → Settings → Gateway.
4. Zeskanuj kod QR albo wklej kod konfiguracji i połącz się.
5. Wróć do Telegram: `/pair pending` (sprawdź identyfikatory żądań, rolę i zakresy), a następnie zatwierdź.

Kod konfiguracji to zakodowany w base64 ładunek JSON, który zawiera:

- `url`: adres URL WebSocket Gateway (`ws://...` albo `wss://...`)
- `bootstrapToken`: krótkotrwały token bootstrap pojedynczego urządzenia używany do początkowego uzgadniania parowania

Ten token bootstrap przenosi wbudowany profil bootstrap parowania:

- przekazany podstawowy token `node` pozostaje z `scopes: []`
- każdy przekazany token `operator` pozostaje ograniczony do listy dozwolonych bootstrap:
  `operator.approvals`, `operator.read`, `operator.talk.secrets`, `operator.write`
- kontrole zakresów bootstrap są prefiksowane rolą, a nie jedną płaską pulą zakresów:
  wpisy zakresu operatora spełniają tylko żądania operatora, a role inne niż operator
  nadal muszą żądać zakresów z własnym prefiksem roli
- późniejsza rotacja/unieważnianie tokenów pozostaje ograniczone zarówno przez zatwierdzony
  kontrakt roli urządzenia, jak i zakresy operatora sesji wywołującej

Traktuj kod konfiguracji jak hasło, dopóki jest ważny.

Dla Tailscale, publicznego albo innego zdalnego parowania mobilnego użyj Tailscale Serve/Funnel
albo innego adresu URL Gateway `wss://`. Kody konfiguracji w postaci zwykłego tekstu `ws://` są akceptowane tylko
dla local loopback, prywatnych adresów LAN, hostów Bonjour `.local` oraz hosta emulatora
Android. Adresy Tailnet CGNAT, nazwy `.ts.net` i hosty publiczne nadal
kończą się niepowodzeniem przed wydaniem kodu QR/kodu konfiguracji.

### Zatwierdzanie urządzenia Node

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

Gdy jawne zatwierdzenie zostaje odrzucone, ponieważ zatwierdzająca sesja sparowanego urządzenia
została otwarta z zakresem tylko do parowania, CLI ponawia to samo żądanie z
`operator.admin`. Pozwala to istniejącemu sparowanemu urządzeniu z uprawnieniami administratora odzyskać nowe
parowanie Control UI/przeglądarki bez ręcznej edycji `devices/paired.json`. Gateway
nadal waliduje ponowione połączenie; tokeny, które nie mogą uwierzytelnić się
z `operator.admin`, pozostają zablokowane.

Jeśli to samo urządzenie ponawia próbę z innymi szczegółami uwierzytelniania (na przykład inną
rolą/zakresami/kluczem publicznym), poprzednie oczekujące żądanie zostaje zastąpione i tworzony jest nowy
`requestId`.

<Note>
Już sparowane urządzenie nie otrzymuje po cichu szerszego dostępu. Jeśli połączy się ponownie, prosząc o więcej zakresów albo szerszą rolę, OpenClaw pozostawia istniejące zatwierdzenie bez zmian i tworzy nowe oczekujące żądanie rozszerzenia. Użyj `openclaw devices list`, aby porównać obecnie zatwierdzony dostęp z nowo żądanym dostępem przed zatwierdzeniem.
</Note>

### Opcjonalne automatyczne zatwierdzanie Node z zaufanych CIDR

Parowanie urządzeń pozostaje domyślnie ręczne. W ściśle kontrolowanych sieciach Node
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

Dotyczy to wyłącznie nowych żądań parowania `role: node` bez żądanych
zakresów. Operator, przeglądarka, Control UI i klienci WebChat nadal wymagają ręcznego
zatwierdzenia. Zmiany roli, zakresu, metadanych i klucza publicznego nadal wymagają ręcznego
zatwierdzenia.

### Przechowywanie stanu parowania Node

Przechowywane w `~/.openclaw/devices/`:

- `pending.json` (krótkotrwały; oczekujące żądania wygasają)
- `paired.json` (sparowane urządzenia + tokeny)

### Uwagi

- Starsze API `node.pair.*` (CLI: `openclaw nodes pending|approve|reject|remove|rename`) jest
  oddzielnym magazynem parowania należącym do Gateway. Węzły WS nadal wymagają parowania urządzenia.
- Rekord parowania jest trwałym źródłem prawdy dla zatwierdzonych ról. Aktywne
  tokeny urządzeń pozostają ograniczone do tego zatwierdzonego zestawu ról; przypadkowy wpis tokenu
  poza zatwierdzonymi rolami nie tworzy nowego dostępu.

## Powiązana dokumentacja

- Model bezpieczeństwa + wstrzykiwanie promptów: [Bezpieczeństwo](/pl/gateway/security)
- Bezpieczna aktualizacja (uruchom doctor): [Aktualizacja](/pl/install/updating)
- Konfiguracje kanałów:
  - Telegram: [Telegram](/pl/channels/telegram)
  - WhatsApp: [WhatsApp](/pl/channels/whatsapp)
  - Signal: [Signal](/pl/channels/signal)
  - BlueBubbles (iMessage): [BlueBubbles](/pl/channels/bluebubbles)
  - iMessage (starsze): [iMessage](/pl/channels/imessage)
  - Discord: [Discord](/pl/channels/discord)
  - Slack: [Slack](/pl/channels/slack)
