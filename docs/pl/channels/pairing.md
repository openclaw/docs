---
read_when:
    - Konfigurowanie kontroli dostępu do wiadomości prywatnych
    - Parowanie nowego Node iOS/Android
    - Przegląd stanu bezpieczeństwa OpenClaw
summary: 'Przegląd parowania: zatwierdź, kto może wysyłać ci wiadomości prywatne + które węzły mogą dołączyć'
title: Parowanie
x-i18n:
    generated_at: "2026-05-10T19:23:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0e26bfd98d9de3b834b737be1aa70eb2272267b3cb9cf6d66b030629111a12fc
    source_path: channels/pairing.md
    workflow: 16
---

„Parowanie” to jawny krok zatwierdzania dostępu w OpenClaw.
Jest używane w dwóch miejscach:

1. **Parowanie DM** (kto może rozmawiać z botem)
2. **Parowanie Node** (które urządzenia/węzły mogą dołączyć do sieci Gateway)

Kontekst bezpieczeństwa: [Bezpieczeństwo](/pl/gateway/security)

## 1) Parowanie DM (dostęp do czatu przychodzącego)

Gdy kanał jest skonfigurowany z zasadą DM `pairing`, nieznani nadawcy otrzymują krótki kod, a ich wiadomość **nie jest przetwarzana**, dopóki jej nie zatwierdzisz.

Domyślne zasady DM są udokumentowane tutaj: [Bezpieczeństwo](/pl/gateway/security)

`dmPolicy: "open"` jest publiczne tylko wtedy, gdy efektywna lista dozwolonych nadawców DM zawiera `"*"`.
Konfiguracja i walidacja wymagają tego symbolu wieloznacznego dla publicznych konfiguracji otwartych. Jeśli istniejący
stan zawiera `open` z konkretnymi wpisami `allowFrom`, środowisko uruchomieniowe nadal dopuszcza
tylko tych nadawców, a zatwierdzenia w magazynie parowania nie rozszerzają dostępu `open`.

Kody parowania:

- 8 znaków, wielkie litery, bez niejednoznacznych znaków (`0O1I`).
- **Wygasają po 1 godzinie**. Bot wysyła wiadomość parowania tylko wtedy, gdy tworzone jest nowe żądanie (mniej więcej raz na godzinę dla każdego nadawcy).
- Oczekujące żądania parowania DM są domyślnie ograniczone do **3 na kanał**; dodatkowe żądania są ignorowane, dopóki jedno nie wygaśnie albo nie zostanie zatwierdzone.

### Zatwierdzanie nadawcy

```bash
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

Jeśli właściciel poleceń nie został jeszcze skonfigurowany, zatwierdzenie kodu parowania DM uruchamia także
`commands.ownerAllowFrom` dla zatwierdzonego nadawcy, na przykład `telegram:123456789`.
Daje to pierwszym konfiguracjom jawnego właściciela dla uprzywilejowanych poleceń i monitów
zatwierdzania wykonywania. Gdy właściciel już istnieje, późniejsze zatwierdzenia parowania przyznają tylko dostęp
DM; nie dodają kolejnych właścicieli.

Obsługiwane kanały: `discord`, `feishu`, `googlechat`, `imessage`, `irc`, `line`, `matrix`, `mattermost`, `msteams`, `nextcloud-talk`, `nostr`, `openclaw-weixin`, `signal`, `slack`, `synology-chat`, `telegram`, `twitch`, `whatsapp`, `zalo`, `zalouser`.

### Grupy nadawców wielokrotnego użycia

Użyj najwyższego poziomu `accessGroups`, gdy ten sam zestaw zaufanych nadawców powinien mieć zastosowanie do
wielu kanałów wiadomości albo zarówno do list dozwolonych DM, jak i grup.

Grupy statyczne używają `type: "message.senders"` i są odwoływane za pomocą
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

- Konta inne niż domyślne odczytują/zapisują tylko swój plik listy dozwolonych z zakresem.
- Konto domyślne używa pliku listy dozwolonych o zakresie kanału bez dodatkowego zakresu.

Traktuj je jako wrażliwe (kontrolują dostęp do twojego asystenta).

<Note>
Magazyn listy dozwolonych parowania służy do dostępu DM. Autoryzacja grupowa jest osobna.
Zatwierdzenie kodu parowania DM nie zezwala automatycznie temu nadawcy na uruchamianie poleceń grupowych
ani sterowanie botem w grupach. Pierwsze uruchomienie właściciela jest osobnym stanem konfiguracji
w `commands.ownerAllowFrom`, a dostarczanie czatu grupowego nadal podlega listom dozwolonych grup
kanału (na przykład `groupAllowFrom`, `groups` albo zastąpieniom dla poszczególnych grup
lub tematów, zależnie od kanału).
</Note>

## 2) Parowanie urządzeń Node (węzły iOS/Android/macOS/headless)

Węzły łączą się z Gateway jako **urządzenia** z `role: node`. Gateway
tworzy żądanie parowania urządzenia, które musi zostać zatwierdzone.

### Parowanie przez Telegram (zalecane dla iOS)

Jeśli używasz pluginu `device-pair`, pierwsze parowanie urządzenia możesz wykonać w całości z Telegram:

1. W Telegram wyślij wiadomość do bota: `/pair`
2. Bot odpowiada dwiema wiadomościami: wiadomością z instrukcjami i osobną wiadomością z **kodem konfiguracji** (łatwą do skopiowania/wklejenia w Telegram).
3. Na telefonie otwórz aplikację OpenClaw iOS → Settings → Gateway.
4. Zeskanuj kod QR albo wklej kod konfiguracji i połącz.
5. Z powrotem w Telegram: `/pair pending` (przejrzyj identyfikatory żądań, rolę i zakresy), a następnie zatwierdź.

Kod konfiguracji to zakodowany base64 ładunek JSON, który zawiera:

- `url`: adres URL WebSocket Gateway (`ws://...` albo `wss://...`)
- `bootstrapToken`: krótkotrwały token startowy dla pojedynczego urządzenia, używany do początkowego uzgadniania parowania

Ten token startowy przenosi wbudowany profil startowy parowania:

- główny przekazany token `node` pozostaje przy `scopes: []`
- każdy przekazany token `operator` pozostaje ograniczony do startowej listy dozwolonych:
  `operator.approvals`, `operator.read`, `operator.talk.secrets`, `operator.write`
- kontrole zakresów startowych są prefiksowane rolą, a nie jedną płaską pulą zakresów:
  wpisy zakresu operatora spełniają tylko żądania operatora, a role inne niż operator
  nadal muszą żądać zakresów z własnym prefiksem roli
- późniejsza rotacja/odwołanie tokenu pozostaje ograniczone zarówno przez zatwierdzony kontrakt
  roli urządzenia, jak i zakresy operatora sesji wywołującej

Traktuj kod konfiguracji jak hasło, dopóki jest ważny.

Dla Tailscale, publicznego lub innego zdalnego parowania mobilnego użyj Tailscale Serve/Funnel
albo innego adresu URL Gateway `wss://`. Kody konfiguracji w postaci zwykłego tekstu `ws://` są akceptowane tylko
dla loopback, prywatnych adresów LAN, hostów Bonjour `.local` i hosta emulatora
Android. Adresy tailnet CGNAT, nazwy `.ts.net` i hosty publiczne nadal
zostaną zamknięte przed wydaniem kodu QR/kodu konfiguracji.

### Zatwierdzanie urządzenia Node

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

Gdy jawne zatwierdzenie zostanie odrzucone, ponieważ sesja zatwierdzającego sparowanego urządzenia
została otwarta z zakresem wyłącznie parowania, CLI ponawia to samo żądanie z
`operator.admin`. Pozwala to istniejącemu sparowanemu urządzeniu z uprawnieniami administratora odzyskać nowe
parowanie Control UI/przeglądarki bez ręcznej edycji `devices/paired.json`. Gateway
nadal waliduje ponowione połączenie; tokeny, które nie mogą uwierzytelnić się
z `operator.admin`, pozostają zablokowane.

Jeśli to samo urządzenie ponowi próbę z innymi szczegółami uwierzytelniania (na przykład inną
rolą/zakresami/kluczem publicznym), poprzednie oczekujące żądanie zostaje zastąpione i tworzony jest nowy
`requestId`.

<Note>
Już sparowane urządzenie nie otrzymuje po cichu szerszego dostępu. Jeśli połączy się ponownie, prosząc o więcej zakresów albo szerszą rolę, OpenClaw pozostawia istniejące zatwierdzenie bez zmian i tworzy świeże oczekujące żądanie rozszerzenia. Użyj `openclaw devices list`, aby porównać obecnie zatwierdzony dostęp z nowo żądanym dostępem przed zatwierdzeniem.
</Note>

### Opcjonalne automatyczne zatwierdzanie Node z zaufanego CIDR

Parowanie urządzeń domyślnie pozostaje ręczne. Dla ściśle kontrolowanych sieci Node
możesz włączyć automatyczne zatwierdzanie pierwszego parowania Node z jawnymi CIDR albo dokładnymi IP:

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
  osobnym magazynem parowania należącym do Gateway. Węzły WS nadal wymagają parowania urządzeń.
- Rekord parowania jest trwałym źródłem prawdy dla zatwierdzonych ról. Aktywne
  tokeny urządzeń pozostają ograniczone do tego zatwierdzonego zestawu ról; przypadkowy wpis tokenu
  poza zatwierdzonymi rolami nie tworzy nowego dostępu.

## Powiązana dokumentacja

- Model bezpieczeństwa + prompt injection: [Bezpieczeństwo](/pl/gateway/security)
- Bezpieczne aktualizowanie (uruchom doctor): [Aktualizowanie](/pl/install/updating)
- Konfiguracje kanałów:
  - Telegram: [Telegram](/pl/channels/telegram)
  - WhatsApp: [WhatsApp](/pl/channels/whatsapp)
  - Signal: [Signal](/pl/channels/signal)
  - iMessage: [iMessage](/pl/channels/imessage)
  - Discord: [Discord](/pl/channels/discord)
  - Slack: [Slack](/pl/channels/slack)
