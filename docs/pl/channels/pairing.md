---
read_when:
    - Konfigurowanie kontroli dostępu do DM
    - Parowanie nowego Node iOS/Android
    - Przegląd stanu bezpieczeństwa OpenClaw
summary: 'Przegląd parowania: zatwierdź, kto może wysyłać Ci wiadomości prywatne + które węzły mogą dołączać'
title: Parowanie
x-i18n:
    generated_at: "2026-05-04T09:37:07Z"
    model: gpt-5.5
    provider: openai
    source_hash: f2bce4cfba7708b0003f2ffeacada8bc1849cc301f28178b499a9a67bddcf36d
    source_path: channels/pairing.md
    workflow: 16
---

„Parowanie” to jawny krok zatwierdzania dostępu w OpenClaw.
Jest używane w dwóch miejscach:

1. **Parowanie DM** (kto może rozmawiać z botem)
2. **Parowanie Node** (które urządzenia/węzły mogą dołączyć do sieci Gateway)

Kontekst bezpieczeństwa: [Zabezpieczenia](/pl/gateway/security)

## 1) Parowanie DM (dostęp do czatu przychodzącego)

Gdy kanał jest skonfigurowany z zasadą DM `pairing`, nieznani nadawcy otrzymują krótki kod, a ich wiadomość **nie jest przetwarzana**, dopóki jej nie zatwierdzisz.

Domyślne zasady DM są udokumentowane tutaj: [Zabezpieczenia](/pl/gateway/security)

`dmPolicy: "open"` jest publiczne tylko wtedy, gdy efektywna lista dozwolonych nadawców DM zawiera `"*"`.
Konfiguracja i walidacja wymagają tego symbolu wieloznacznego dla publicznych konfiguracji otwartych. Jeśli istniejący
stan zawiera `open` z konkretnymi wpisami `allowFrom`, środowisko uruchomieniowe nadal dopuszcza
tylko tych nadawców, a zatwierdzenia z magazynu parowania nie rozszerzają dostępu `open`.

Kody parowania:

- 8 znaków, wielkie litery, bez niejednoznacznych znaków (`0O1I`).
- **Wygasają po 1 godzinie**. Bot wysyła wiadomość parowania tylko wtedy, gdy tworzone jest nowe żądanie (w przybliżeniu raz na godzinę na nadawcę).
- Oczekujące żądania parowania DM są domyślnie ograniczone do **3 na kanał**; dodatkowe żądania są ignorowane, dopóki jedno nie wygaśnie albo nie zostanie zatwierdzone.

### Zatwierdzanie nadawcy

```bash
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

Jeśli właściciel poleceń nie jest jeszcze skonfigurowany, zatwierdzenie kodu parowania DM inicjalizuje też
`commands.ownerAllowFrom` dla zatwierdzonego nadawcy, na przykład `telegram:123456789`.
Daje to pierwszym konfiguracjom jawnego właściciela dla uprzywilejowanych poleceń i monitów zatwierdzania
wykonania. Po utworzeniu właściciela późniejsze zatwierdzenia parowania przyznają tylko dostęp DM;
nie dodają kolejnych właścicieli.

Obsługiwane kanały: `bluebubbles`, `discord`, `feishu`, `googlechat`, `imessage`, `irc`, `line`, `matrix`, `mattermost`, `msteams`, `nextcloud-talk`, `nostr`, `openclaw-weixin`, `signal`, `slack`, `synology-chat`, `telegram`, `twitch`, `whatsapp`, `zalo`, `zalouser`.

### Wielokrotnego użytku grupy nadawców

Używaj najwyższego poziomu `accessGroups`, gdy ten sam zaufany zestaw nadawców powinien mieć zastosowanie do
wielu kanałów wiadomości albo zarówno do list dozwolonych DM, jak i grup.

Grupy statyczne używają `type: "message.senders"` i są przywoływane za pomocą
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

- Konta inne niż domyślne odczytują/zapisują tylko swój plik listy dozwolonych z zakresem.
- Konto domyślne używa pliku listy dozwolonych bez zakresu, przypisanego do kanału.

Traktuj je jako wrażliwe (kontrolują dostęp do twojego asystenta).

<Note>
Magazyn listy dozwolonych parowania służy do dostępu DM. Autoryzacja grup jest osobna.
Zatwierdzenie kodu parowania DM nie pozwala automatycznie temu nadawcy uruchamiać poleceń
grupowych ani kontrolować bota w grupach. Inicjalizacja pierwszego właściciela jest osobnym stanem
konfiguracji w `commands.ownerAllowFrom`, a dostarczanie czatu grupowego nadal podlega
listom dozwolonych grup danego kanału (na przykład `groupAllowFrom`, `groups` albo nadpisaniom dla poszczególnych grup
lub tematów, zależnie od kanału).
</Note>

## 2) Parowanie urządzeń Node (iOS/Android/macOS/węzły bez interfejsu)

Węzły łączą się z Gateway jako **urządzenia** z `role: node`. Gateway
tworzy żądanie parowania urządzenia, które musi zostać zatwierdzone.

### Parowanie przez Telegram (zalecane dla iOS)

Jeśli używasz Plugin `device-pair`, możesz przeprowadzić pierwsze parowanie urządzenia w całości z poziomu Telegram:

1. W Telegram wyślij wiadomość do bota: `/pair`
2. Bot odpowiada dwiema wiadomościami: wiadomością z instrukcją i osobną wiadomością z **kodem konfiguracji** (łatwym do skopiowania/wklejenia w Telegram).
3. Na telefonie otwórz aplikację OpenClaw na iOS → Ustawienia → Gateway.
4. Zeskanuj kod QR albo wklej kod konfiguracji i połącz się.
5. Wróć do Telegram: `/pair pending` (sprawdź identyfikatory żądań, rolę i zakresy), a następnie zatwierdź.

Kod konfiguracji to zakodowany w base64 ładunek JSON zawierający:

- `url`: adres URL WebSocket Gateway (`ws://...` lub `wss://...`)
- `bootstrapToken`: krótkotrwały token inicjalizacyjny dla jednego urządzenia używany do początkowego uzgadniania parowania

Ten token inicjalizacyjny zawiera wbudowany profil inicjalizacji parowania:

- podstawowy przekazany token `node` pozostaje `scopes: []`
- każdy przekazany token `operator` pozostaje ograniczony do inicjalizacyjnej listy dozwolonych:
  `operator.approvals`, `operator.read`, `operator.talk.secrets`, `operator.write`
- kontrole zakresów inicjalizacyjnych są prefiksowane rolą, a nie stanowią jednej płaskiej puli zakresów:
  wpisy zakresów operatora spełniają tylko żądania operatora, a role inne niż operator
  nadal muszą żądać zakresów pod prefiksem własnej roli
- późniejsza rotacja/odwołanie tokena pozostaje ograniczone zarówno przez zatwierdzony kontrakt roli urządzenia,
  jak i zakresy operatora sesji wywołującej

Traktuj kod konfiguracji jak hasło, dopóki jest ważny.

W przypadku Tailscale, publicznego lub innego mobilnego parowania poza loopback użyj Tailscale
Serve/Funnel albo innego adresu URL Gateway `wss://`. Bezpośrednie adresy URL konfiguracji `ws://` poza loopback
są odrzucane przed wydaniem kodu QR/kodu konfiguracji. Kody konfiguracji w jawnym tekście `ws://`
są ograniczone do adresów URL loopback; klienci `ws://` w sieci prywatnej nadal wymagają jawnego
awaryjnego ustawienia `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` opisanego w przewodniku po zdalnym
Gateway.

### Zatwierdzanie urządzenia Node

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

Gdy jawne zatwierdzenie zostanie odrzucone, ponieważ sesja zatwierdzającego sparowanego urządzenia
została otwarta tylko z zakresem parowania, CLI ponawia to samo żądanie z
`operator.admin`. Pozwala to istniejącemu sparowanemu urządzeniu z uprawnieniami administratora odzyskać nowe
parowanie Control UI/przeglądarki bez ręcznego edytowania `devices/paired.json`. Gateway
nadal waliduje ponawiane połączenie; tokeny, które nie mogą uwierzytelnić się
z `operator.admin`, pozostają zablokowane.

Jeśli to samo urządzenie ponowi próbę z innymi szczegółami uwierzytelniania (na przykład inną
rolą/zakresami/kluczem publicznym), poprzednie oczekujące żądanie zostaje zastąpione i tworzony jest nowy
`requestId`.

<Note>
Już sparowane urządzenie nie otrzymuje po cichu szerszego dostępu. Jeśli połączy się ponownie, prosząc o więcej zakresów lub szerszą rolę, OpenClaw zachowuje istniejące zatwierdzenie bez zmian i tworzy nowe oczekujące żądanie rozszerzenia. Użyj `openclaw devices list`, aby porównać aktualnie zatwierdzony dostęp z nowo żądanym dostępem przed zatwierdzeniem.
</Note>

### Opcjonalne automatyczne zatwierdzanie Node z zaufanych CIDR

Parowanie urządzeń pozostaje domyślnie ręczne. W ściśle kontrolowanych sieciach Node
możesz włączyć automatyczne zatwierdzanie pierwszego parowania Node z jawnymi CIDR lub dokładnymi adresami IP:

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
zakresów. Operator, przeglądarka, Control UI i klienci WebChat nadal wymagają ręcznego
zatwierdzenia. Zmiany roli, zakresu, metadanych i klucza publicznego nadal wymagają ręcznego
zatwierdzenia.

### Przechowywanie stanu parowania Node

Przechowywane w `~/.openclaw/devices/`:

- `pending.json` (krótkotrwały; oczekujące żądania wygasają)
- `paired.json` (sparowane urządzenia + tokeny)

### Uwagi

- Starsze API `node.pair.*` (CLI: `openclaw nodes pending|approve|reject|remove|rename`) jest
  osobnym magazynem parowania należącym do Gateway. Węzły WS nadal wymagają parowania urządzenia.
- Rekord parowania jest trwałym źródłem prawdy dla zatwierdzonych ról. Aktywne
  tokeny urządzeń pozostają ograniczone do tego zatwierdzonego zestawu ról; przypadkowy wpis tokena
  poza zatwierdzonymi rolami nie tworzy nowego dostępu.

## Powiązane dokumenty

- Model bezpieczeństwa + wstrzykiwanie promptów: [Zabezpieczenia](/pl/gateway/security)
- Bezpieczne aktualizowanie (uruchom doctor): [Aktualizowanie](/pl/install/updating)
- Konfiguracje kanałów:
  - Telegram: [Telegram](/pl/channels/telegram)
  - WhatsApp: [WhatsApp](/pl/channels/whatsapp)
  - Signal: [Signal](/pl/channels/signal)
  - BlueBubbles (iMessage): [BlueBubbles](/pl/channels/bluebubbles)
  - iMessage (starsze): [iMessage](/pl/channels/imessage)
  - Discord: [Discord](/pl/channels/discord)
  - Slack: [Slack](/pl/channels/slack)
