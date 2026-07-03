---
read_when:
    - Konfigurowanie kontroli dostępu do DM
    - Parowanie nowego węzła iOS/Android
    - Przegląd stanu bezpieczeństwa OpenClaw
summary: 'Omówienie parowania: zatwierdź, kto może wysyłać Ci wiadomości DM i które węzły mogą dołączać'
title: Parowanie
x-i18n:
    generated_at: "2026-07-03T17:43:32Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c62f42116b71467576b2c1e005fa2e606a3d0f40cbf7b92fc4a7dd47c8f0568e
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

Domyślne zasady DM są udokumentowane w: [Bezpieczeństwo](/pl/gateway/security)

`dmPolicy: "open"` jest publiczne tylko wtedy, gdy efektywna lista dozwolonych DM zawiera `"*"`.
Konfiguracja i walidacja wymagają tego symbolu wieloznacznego dla publicznie otwartych konfiguracji. Jeśli istniejący
stan zawiera `open` z konkretnymi wpisami `allowFrom`, runtime nadal dopuszcza
tylko tych nadawców, a zatwierdzenia z magazynu parowania nie rozszerzają dostępu `open`.

Kody parowania:

- 8 znaków, wielkie litery, bez niejednoznacznych znaków (`0O1I`).
- **Wygasają po 1 godzinie**. Bot wysyła wiadomość parowania tylko po utworzeniu nowego żądania (mniej więcej raz na godzinę na nadawcę).
- Oczekujące żądania parowania DM są domyślnie ograniczone do **3 na kanał**; dodatkowe żądania są ignorowane, dopóki jedno nie wygaśnie lub nie zostanie zatwierdzone.

### Zatwierdzanie nadawcy

```bash
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

Jeśli właściciel poleceń nie jest jeszcze skonfigurowany, zatwierdzenie kodu parowania DM również inicjuje
`commands.ownerAllowFrom` zatwierdzonym nadawcą, takim jak `telegram:123456789`.
Daje to pierwszym konfiguracjom jawnego właściciela dla uprzywilejowanych poleceń i monitów o zatwierdzenie
wykonania. Gdy właściciel już istnieje, późniejsze zatwierdzenia parowania przyznają tylko dostęp DM;
nie dodają kolejnych właścicieli.

Obsługiwane kanały: `discord`, `feishu`, `googlechat`, `imessage`, `irc`, `line`, `matrix`, `mattermost`, `msteams`, `nextcloud-talk`, `nostr`, `openclaw-weixin`, `signal`, `slack`, `synology-chat`, `telegram`, `twitch`, `whatsapp`, `zalo`, `zalouser`.

### Grupy nadawców wielokrotnego użytku

Użyj najwyższego poziomu `accessGroups`, gdy ten sam zestaw zaufanych nadawców ma obowiązywać dla
wielu kanałów wiadomości albo zarówno dla list dozwolonych DM, jak i grup.

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

- Konta inne niż domyślne odczytują/zapisują tylko swój plik listy dozwolonych w danym zakresie.
- Konto domyślne używa pliku listy dozwolonych bez zakresu, przypisanego do kanału.

Traktuj je jako wrażliwe (kontrolują dostęp do twojego asystenta).

<Note>
Magazyn listy dozwolonych parowania służy do dostępu DM. Autoryzacja grup jest osobna.
Zatwierdzenie kodu parowania DM nie pozwala automatycznie temu nadawcy uruchamiać poleceń grupowych
ani kontrolować bota w grupach. Inicjowanie pierwszego właściciela to osobny stan konfiguracji
w `commands.ownerAllowFrom`, a dostarczanie czatu grupowego nadal podlega listom dozwolonych grup
kanału (na przykład `groupAllowFrom`, `groups` albo nadpisaniom per grupa
lub per temat, zależnie od kanału).
</Note>

## 2) Parowanie urządzenia Node (węzły iOS/Android/macOS/headless)

Węzły łączą się z Gateway jako **urządzenia** z `role: node`. Gateway
tworzy żądanie parowania urządzenia, które musi zostać zatwierdzone.

### Parowanie przez Telegram (zalecane dla iOS)

Jeśli używasz Pluginu `device-pair`, możesz wykonać pierwsze parowanie urządzenia w całości z Telegram:

1. W Telegram wyślij wiadomość do bota: `/pair`
2. Bot odpowiada dwiema wiadomościami: wiadomością z instrukcją i osobną wiadomością z **kodem konfiguracji** (łatwą do skopiowania/wklejenia w Telegram).
3. Na telefonie otwórz aplikację OpenClaw na iOS → Ustawienia → Gateway.
4. Zeskanuj kod QR albo wklej kod konfiguracji i połącz.
5. Wróć do Telegram: `/pair pending` (przejrzyj identyfikatory żądań, rolę i zakresy), a następnie zatwierdź.

Kod konfiguracji to zakodowany w base64 ładunek JSON, który zawiera:

- `url`: adres URL WebSocket Gateway (`ws://...` albo `wss://...`)
- `bootstrapToken`: krótkotrwały token inicjujący dla jednego urządzenia, używany do początkowego uzgadniania parowania

Ten token inicjujący przenosi wbudowany profil inicjujący parowanie:

- wbudowany profil konfiguracji zezwala tylko na świeżą bazę QR/kodu konfiguracji:
  `node` oraz ograniczone przekazanie `operator`
- przekazany token `node` pozostaje `scopes: []`
- przekazany token `operator` jest ograniczony do `operator.approvals`,
  `operator.read`, `operator.talk.secrets` i `operator.write`
- `operator.admin` nie jest przyznawany przez inicjowanie QR/kodem konfiguracji; wymaga
  osobnego zatwierdzonego parowania operatora albo przepływu tokenu
- późniejsza rotacja/unieważnienie tokenu pozostaje ograniczone zarówno przez zatwierdzony
  kontrakt roli urządzenia, jak i zakresy operatora sesji wywołującej

Traktuj kod konfiguracji jak hasło, dopóki jest ważny.

Dla Tailscale, publicznego lub innego zdalnego parowania mobilnego użyj Tailscale Serve/Funnel
albo innego adresu URL Gateway `wss://`. Kody konfiguracji w postaci zwykłego tekstu `ws://` są akceptowane tylko
dla local loopback, prywatnych adresów LAN, hostów Bonjour `.local` i hosta emulatora
Android. Adresy CGNAT tailnetu, nazwy `.ts.net` i hosty publiczne nadal
kończą się odmową przed wydaniem QR/kodu konfiguracji.

### Zatwierdzanie urządzenia Node

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

Gdy jawne zatwierdzenie zostaje odrzucone, ponieważ zatwierdzająca sesja sparowanego urządzenia
została otwarta z zakresem tylko do parowania, CLI ponawia to samo żądanie z
`operator.admin`. Pozwala to istniejącemu sparowanemu urządzeniu z uprawnieniami administratora odzyskać nowe
parowanie Control UI/przeglądarki bez ręcznego edytowania `devices/paired.json`. Gateway
nadal waliduje ponowione połączenie; tokeny, które nie mogą uwierzytelnić się
z `operator.admin`, pozostają zablokowane.

Jeśli to samo urządzenie ponawia próbę z innymi szczegółami uwierzytelniania (na przykład inną
rolą/zakresami/kluczem publicznym), poprzednie oczekujące żądanie zostaje zastąpione i tworzony jest nowy
`requestId`.

<Note>
Już sparowane urządzenie nie otrzymuje po cichu szerszego dostępu. Jeśli łączy się ponownie, prosząc o więcej zakresów lub szerszą rolę, OpenClaw pozostawia istniejące zatwierdzenie bez zmian i tworzy świeże oczekujące żądanie podniesienia uprawnień. Użyj `openclaw devices list`, aby porównać obecnie zatwierdzony dostęp z nowo zażądanym dostępem przed zatwierdzeniem.
</Note>

### Opcjonalne automatyczne zatwierdzanie Node z zaufanego CIDR

Parowanie urządzeń domyślnie pozostaje ręczne. W ściśle kontrolowanych sieciach Node
możesz włączyć automatyczne zatwierdzanie pierwszego Node przy użyciu jawnych CIDR lub dokładnych adresów IP:

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
zakresów. Operator, przeglądarka, Control UI i klienci WebChat nadal wymagają ręcznego
zatwierdzenia. Zmiany roli, zakresu, metadanych i klucza publicznego nadal wymagają ręcznego
zatwierdzenia.

### Przechowywanie stanu parowania Node

Przechowywane w `~/.openclaw/devices/`:

- `pending.json` (krótkotrwałe; oczekujące żądania wygasają)
- `paired.json` (sparowane urządzenia + tokeny)

### Uwagi

- Starsze API `node.pair.*` (CLI: `openclaw nodes pending|approve|reject|remove|rename`) to
  osobny magazyn parowania należący do Gateway. Węzły WS nadal wymagają parowania urządzeń.
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
  - iMessage: [iMessage](/pl/channels/imessage)
  - Discord: [Discord](/pl/channels/discord)
  - Slack: [Slack](/pl/channels/slack)
