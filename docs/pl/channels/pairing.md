---
read_when:
    - Konfigurowanie kontroli dostępu do wiadomości prywatnych
    - Parowanie nowego Node iOS/Android
    - Przegląd stanu bezpieczeństwa OpenClaw
summary: 'Przegląd parowania: zatwierdź, kto może wysyłać Ci wiadomości prywatne i które węzły mogą dołączyć'
title: Parowanie
x-i18n:
    generated_at: "2026-05-07T01:51:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6e1b9082342209b7d37a790ecc61330f74131b070d0560cb71fb533379d9016a
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
Konfiguracja i walidacja wymagają tego wieloznacznika dla publicznych konfiguracji otwartych. Jeśli istniejący
stan zawiera `open` z konkretnymi wpisami `allowFrom`, runtime nadal dopuszcza
tylko tych nadawców, a zatwierdzenia w magazynie parowania nie rozszerzają dostępu `open`.

Kody parowania:

- 8 znaków, wielkie litery, bez niejednoznacznych znaków (`0O1I`).
- **Wygasają po 1 godzinie**. Bot wysyła wiadomość parowania tylko wtedy, gdy tworzone jest nowe żądanie (mniej więcej raz na godzinę na nadawcę).
- Oczekujące żądania parowania DM są domyślnie ograniczone do **3 na kanał**; dodatkowe żądania są ignorowane, dopóki jedno nie wygaśnie albo nie zostanie zatwierdzone.

### Zatwierdzanie nadawcy

```bash
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

Jeśli właściciel poleceń nie jest jeszcze skonfigurowany, zatwierdzenie kodu parowania DM także inicjalizuje
`commands.ownerAllowFrom` zatwierdzonym nadawcą, na przykład `telegram:123456789`.
Daje to pierwszym konfiguracjom jawnego właściciela dla uprzywilejowanych poleceń i monitów
zatwierdzania exec. Po utworzeniu właściciela późniejsze zatwierdzenia parowania przyznają tylko
dostęp DM; nie dodają kolejnych właścicieli.

Obsługiwane kanały: `bluebubbles`, `discord`, `feishu`, `googlechat`, `imessage`, `irc`, `line`, `matrix`, `mattermost`, `msteams`, `nextcloud-talk`, `nostr`, `openclaw-weixin`, `signal`, `slack`, `synology-chat`, `telegram`, `twitch`, `whatsapp`, `zalo`, `zalouser`.

### Grupy nadawców wielokrotnego użytku

Używaj najwyższego poziomu `accessGroups`, gdy ten sam zaufany zestaw nadawców powinien mieć zastosowanie do
wielu kanałów wiadomości albo zarówno do list dozwolonych DM, jak i grup.

Grupy statyczne używają `type: "message.senders"` i są przywoływane jako
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

Zachowanie zakresu konta:

- Konta inne niż domyślne odczytują/zapisują tylko swój plik listy dozwolonych w zakresie.
- Konto domyślne używa niezakresowego pliku listy dozwolonych w zakresie kanału.

Traktuj je jako poufne (kontrolują dostęp do twojego asystenta).

<Note>
Magazyn listy dozwolonych parowania służy do dostępu DM. Autoryzacja grup jest oddzielna.
Zatwierdzenie kodu parowania DM nie zezwala automatycznie temu nadawcy na uruchamianie poleceń
grupowych ani sterowanie botem w grupach. Inicjalizacja pierwszego właściciela to oddzielny stan
konfiguracji w `commands.ownerAllowFrom`, a dostarczanie czatu grupowego nadal podlega
listom dozwolonych grup danego kanału (na przykład `groupAllowFrom`, `groups` albo nadpisaniom dla grupy
lub tematu, zależnie od kanału).
</Note>

## 2) Parowanie urządzenia Node (węzły iOS/Android/macOS/headless)

Węzły łączą się z Gateway jako **urządzenia** z `role: node`. Gateway
tworzy żądanie parowania urządzenia, które musi zostać zatwierdzone.

### Parowanie przez Telegram (zalecane dla iOS)

Jeśli używasz Plugin `device-pair`, możesz wykonać pierwsze parowanie urządzenia całkowicie z Telegram:

1. W Telegram wyślij wiadomość do swojego bota: `/pair`
2. Bot odpowiada dwiema wiadomościami: wiadomością z instrukcją i osobną wiadomością z **kodem konfiguracji** (łatwą do skopiowania/wklejenia w Telegram).
3. Na telefonie otwórz aplikację OpenClaw iOS → Settings → Gateway.
4. Zeskanuj kod QR albo wklej kod konfiguracji i połącz.
5. Z powrotem w Telegram: `/pair pending` (sprawdź identyfikatory żądań, rolę i zakresy), a potem zatwierdź.

Kod konfiguracji to zakodowany w base64 ładunek JSON, który zawiera:

- `url`: adres URL WebSocket Gateway (`ws://...` albo `wss://...`)
- `bootstrapToken`: krótkotrwały token bootstrap pojedynczego urządzenia używany do początkowego uzgadniania parowania

Ten token bootstrap niesie wbudowany profil bootstrap parowania:

- podstawowy przekazany token `node` pozostaje z `scopes: []`
- każdy przekazany token `operator` pozostaje ograniczony do listy dozwolonych bootstrap:
  `operator.approvals`, `operator.read`, `operator.talk.secrets`, `operator.write`
- kontrole zakresów bootstrap mają prefiks roli, nie jedną płaską pulę zakresów:
  wpisy zakresu operator spełniają tylko żądania operator, a role inne niż operator
  nadal muszą żądać zakresów pod własnym prefiksem roli
- późniejsza rotacja/odwołanie tokenu pozostaje ograniczone zarówno zatwierdzoną
  umową roli urządzenia, jak i zakresami operator sesji wywołującego

Traktuj kod konfiguracji jak hasło, dopóki jest ważny.

W przypadku Tailscale, publicznego lub innego zdalnego parowania mobilnego użyj Tailscale Serve/Funnel
albo innego adresu URL Gateway `wss://`. Kody konfiguracji plaintext `ws://` są akceptowane tylko
dla local loopback, adresów prywatnej sieci LAN, hostów Bonjour `.local` i hosta emulatora
Android. Adresy Tailnet CGNAT, nazwy `.ts.net` i hosty publiczne nadal
zamykają się bezpiecznie przed wydaniem kodu QR/kodu konfiguracji.

### Zatwierdzanie urządzenia Node

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

Gdy jawne zatwierdzenie zostanie odrzucone, ponieważ zatwierdzająca sesja sparowanego urządzenia
została otwarta tylko z zakresem parowania, CLI ponawia to samo żądanie z
`operator.admin`. Pozwala to istniejącemu sparowanemu urządzeniu z uprawnieniami administratora odzyskać nowe
parowanie Control UI/przeglądarki bez ręcznej edycji `devices/paired.json`. Gateway
nadal waliduje ponowione połączenie; tokeny, które nie mogą uwierzytelnić się
z `operator.admin`, pozostają zablokowane.

Jeśli to samo urządzenie ponawia próbę z innymi szczegółami uwierzytelniania (na przykład inną
rolą/zakresami/kluczem publicznym), poprzednie oczekujące żądanie zostaje zastąpione i tworzony jest nowy
`requestId`.

<Note>
Już sparowane urządzenie nie otrzymuje po cichu szerszego dostępu. Jeśli połączy się ponownie, prosząc o więcej zakresów lub szerszą rolę, OpenClaw zachowuje istniejące zatwierdzenie bez zmian i tworzy nowe oczekujące żądanie rozszerzenia. Użyj `openclaw devices list`, aby porównać obecnie zatwierdzony dostęp z nowo żądanym dostępem przed zatwierdzeniem.
</Note>

### Opcjonalne automatyczne zatwierdzanie Node zaufanego CIDR

Parowanie urządzeń pozostaje domyślnie ręczne. Dla ściśle kontrolowanych sieci Node
możesz włączyć automatyczne zatwierdzanie pierwszego parowania Node przy użyciu jawnych CIDR lub dokładnych adresów IP:

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

Dotyczy to tylko nowych żądań parowania `role: node` bez żądanych
zakresów. Klienci operator, przeglądarki, Control UI i WebChat nadal wymagają ręcznego
zatwierdzenia. Zmiany roli, zakresu, metadanych i klucza publicznego nadal wymagają ręcznego
zatwierdzenia.

### Przechowywanie stanu parowania Node

Przechowywane w `~/.openclaw/devices/`:

- `pending.json` (krótkotrwałe; oczekujące żądania wygasają)
- `paired.json` (sparowane urządzenia + tokeny)

### Uwagi

- Starsze API `node.pair.*` (CLI: `openclaw nodes pending|approve|reject|remove|rename`) jest
  oddzielnym magazynem parowania zarządzanym przez gateway. Węzły WS nadal wymagają parowania urządzenia.
- Rekord parowania jest trwałym źródłem prawdy dla zatwierdzonych ról. Aktywne
  tokeny urządzeń pozostają ograniczone do tego zatwierdzonego zestawu ról; przypadkowy wpis tokenu
  poza zatwierdzonymi rolami nie tworzy nowego dostępu.

## Powiązana dokumentacja

- Model bezpieczeństwa + prompt injection: [Bezpieczeństwo](/pl/gateway/security)
- Bezpieczna aktualizacja (uruchom doctor): [Aktualizacja](/pl/install/updating)
- Konfiguracje kanałów:
  - Telegram: [Telegram](/pl/channels/telegram)
  - WhatsApp: [WhatsApp](/pl/channels/whatsapp)
  - Signal: [Signal](/pl/channels/signal)
  - iMessage: [iMessage](/pl/channels/imessage)
  - BlueBubbles (starszy most iMessage): [BlueBubbles](/pl/channels/bluebubbles)
  - Discord: [Discord](/pl/channels/discord)
  - Slack: [Slack](/pl/channels/slack)
