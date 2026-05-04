---
read_when:
    - Konfigurowanie kontroli dostępu do wiadomości prywatnych
    - Parowanie nowego Node iOS/Android
    - Przegląd stanu zabezpieczeń OpenClaw
summary: 'Omówienie parowania: zatwierdź, kto może wysyłać Ci wiadomości prywatne + które węzły mogą dołączać'
title: Parowanie
x-i18n:
    generated_at: "2026-05-04T02:21:52Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4fb27840f7c9ef55e7270cc29f813e6db90b240aa2180f30952eb9485f0f8874
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
Konfiguracja i walidacja wymagają tego symbolu wieloznacznego dla publicznych konfiguracji open. Jeśli istniejący
stan zawiera `open` z konkretnymi wpisami `allowFrom`, środowisko uruchomieniowe nadal dopuszcza
tylko tych nadawców, a zatwierdzenia w magazynie parowania nie rozszerzają dostępu `open`.

Kody parowania:

- 8 znaków, wielkie litery, bez niejednoznacznych znaków (`0O1I`).
- **Wygasają po 1 godzinie**. Bot wysyła wiadomość parowania tylko wtedy, gdy zostaje utworzone nowe żądanie (w przybliżeniu raz na godzinę na nadawcę).
- Oczekujące żądania parowania DM są domyślnie ograniczone do **3 na kanał**; dodatkowe żądania są ignorowane, dopóki jedno nie wygaśnie lub nie zostanie zatwierdzone.

### Zatwierdzanie nadawcy

```bash
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

Jeśli właściciel poleceń nie jest jeszcze skonfigurowany, zatwierdzenie kodu parowania DM także inicjuje
`commands.ownerAllowFrom` dla zatwierdzonego nadawcy, na przykład `telegram:123456789`.
Daje to pierwszym konfiguracjom jawnego właściciela dla uprzywilejowanych poleceń i monitów zatwierdzania
wykonywania. Po utworzeniu właściciela późniejsze zatwierdzenia parowania przyznają tylko dostęp DM;
nie dodają kolejnych właścicieli.

Obsługiwane kanały: `bluebubbles`, `discord`, `feishu`, `googlechat`, `imessage`, `irc`, `line`, `matrix`, `mattermost`, `msteams`, `nextcloud-talk`, `nostr`, `openclaw-weixin`, `signal`, `slack`, `synology-chat`, `telegram`, `twitch`, `whatsapp`, `zalo`, `zalouser`.

### Grupy nadawców wielokrotnego użytku

Używaj najwyższego poziomu `accessGroups`, gdy ten sam zestaw zaufanych nadawców ma być stosowany do
wielu kanałów wiadomości albo zarówno do list dozwolonych DM, jak i grup.

Grupy statyczne używają `type: "message.senders"` i są wskazywane przez
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
- Magazyn zatwierdzonej listy dozwolonych nadawców:
  - Konto domyślne: `<channel>-allowFrom.json`
  - Konto inne niż domyślne: `<channel>-<accountId>-allowFrom.json`

Zachowanie zakresu kont:

- Konta inne niż domyślne odczytują/zapisują tylko swój plik listy dozwolonych nadawców o odpowiednim zakresie.
- Konto domyślne używa pliku listy dozwolonych nadawców bez zakresu, przypisanego do kanału.

Traktuj je jako poufne (kontrolują dostęp do Twojego asystenta).

<Note>
Magazyn listy dozwolonych nadawców parowania służy do dostępu DM. Autoryzacja grupowa jest oddzielna.
Zatwierdzenie kodu parowania DM nie pozwala automatycznie temu nadawcy uruchamiać poleceń grupowych
ani kontrolować bota w grupach. Inicjalizacja pierwszego właściciela to oddzielny stan konfiguracji
w `commands.ownerAllowFrom`, a dostarczanie czatu grupowego nadal podlega listom dozwolonym grup kanału
(na przykład `groupAllowFrom`, `groups` albo nadpisaniom dla grupy lub tematu, zależnie od kanału).
</Note>

## 2) Parowanie urządzeń Node (węzły iOS/Android/macOS/headless)

Węzły łączą się z Gateway jako **urządzenia** z `role: node`. Gateway
tworzy żądanie parowania urządzenia, które musi zostać zatwierdzone.

### Parowanie przez Telegram (zalecane dla iOS)

Jeśli używasz Plugin `device-pair`, możesz przeprowadzić pierwsze parowanie urządzenia w całości z Telegram:

1. W Telegram wyślij wiadomość do swojego bota: `/pair`
2. Bot odpowie dwiema wiadomościami: wiadomością instruktażową i osobną wiadomością z **kodem konfiguracji** (łatwą do skopiowania/wklejenia w Telegram).
3. Na telefonie otwórz aplikację OpenClaw iOS → Settings → Gateway.
4. Wklej kod konfiguracji i połącz się.
5. Z powrotem w Telegram: `/pair pending` (przejrzyj identyfikatory żądań, rolę i zakresy), a następnie zatwierdź.

Kod konfiguracji to zakodowany w base64 ładunek JSON, który zawiera:

- `url`: adres URL WebSocket Gateway (`ws://...` lub `wss://...`)
- `bootstrapToken`: krótkotrwały token bootstrap pojedynczego urządzenia używany do początkowego uzgadniania parowania

Ten token bootstrap przenosi wbudowany profil bootstrap parowania:

- główny przekazany token `node` pozostaje `scopes: []`
- każdy przekazany token `operator` pozostaje ograniczony do listy dozwolonej bootstrap:
  `operator.approvals`, `operator.read`, `operator.talk.secrets`, `operator.write`
- sprawdzanie zakresów bootstrap jest prefiksowane rolą, a nie korzysta z jednej płaskiej puli zakresów:
  wpisy zakresów operatora spełniają tylko żądania operatora, a role niebędące operatorem
  nadal muszą żądać zakresów pod własnym prefiksem roli
- późniejsza rotacja/unieważnianie tokenów pozostaje ograniczone zarówno przez zatwierdzoną umowę roli
  urządzenia, jak i zakresy operatora sesji wywołującego

Traktuj kod konfiguracji jak hasło, dopóki jest ważny.

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

Jeśli to samo urządzenie ponowi próbę z innymi szczegółami uwierzytelniania (na przykład inną
rolą/zakresami/kluczem publicznym), poprzednie oczekujące żądanie zostanie zastąpione i zostanie utworzone nowe
`requestId`.

<Note>
Już sparowane urządzenie nie otrzymuje po cichu szerszego dostępu. Jeśli połączy się ponownie, prosząc o więcej zakresów lub szerszą rolę, OpenClaw pozostawia istniejące zatwierdzenie bez zmian i tworzy nowe oczekujące żądanie rozszerzenia. Użyj `openclaw devices list`, aby porównać obecnie zatwierdzony dostęp z nowo żądanym dostępem przed zatwierdzeniem.
</Note>

### Opcjonalne automatyczne zatwierdzanie Node z zaufanych CIDR

Parowanie urządzeń pozostaje domyślnie ręczne. W ściśle kontrolowanych sieciach węzłów
możesz włączyć automatyczne zatwierdzanie pierwszego Node z jawnymi CIDR lub dokładnymi adresami IP:

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
zakresów. Klienci operatora, przeglądarki, Control UI i WebChat nadal wymagają ręcznego
zatwierdzenia. Zmiany roli, zakresu, metadanych i klucza publicznego nadal wymagają ręcznego
zatwierdzenia.

### Przechowywanie stanu parowania Node

Przechowywane w `~/.openclaw/devices/`:

- `pending.json` (krótkotrwałe; oczekujące żądania wygasają)
- `paired.json` (sparowane urządzenia + tokeny)

### Uwagi

- Starsze API `node.pair.*` (CLI: `openclaw nodes pending|approve|reject|remove|rename`) jest
  oddzielnym magazynem parowania należącym do Gateway. Węzły WS nadal wymagają parowania urządzeń.
- Rekord parowania jest trwałym źródłem prawdy dla zatwierdzonych ról. Aktywne
  tokeny urządzeń pozostają ograniczone do tego zatwierdzonego zestawu ról; przypadkowy wpis tokena
  poza zatwierdzonymi rolami nie tworzy nowego dostępu.

## Powiązane dokumenty

- Model bezpieczeństwa + prompt injection: [Bezpieczeństwo](/pl/gateway/security)
- Bezpieczne aktualizowanie (uruchom doctor): [Aktualizowanie](/pl/install/updating)
- Konfiguracje kanałów:
  - Telegram: [Telegram](/pl/channels/telegram)
  - WhatsApp: [WhatsApp](/pl/channels/whatsapp)
  - Signal: [Signal](/pl/channels/signal)
  - BlueBubbles (iMessage): [BlueBubbles](/pl/channels/bluebubbles)
  - iMessage (starsze): [iMessage](/pl/channels/imessage)
  - Discord: [Discord](/pl/channels/discord)
  - Slack: [Slack](/pl/channels/slack)
