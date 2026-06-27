---
read_when:
    - Konfigurowanie kontroli dostępu do DM
    - Parowanie nowego węzła iOS/Android
    - Przegląd stanu zabezpieczeń OpenClaw
summary: 'Omówienie parowania: zatwierdź, kto może wysyłać Ci DM + które węzły mogą dołączać'
title: Parowanie
x-i18n:
    generated_at: "2026-06-27T17:13:20Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 92870489b62aeec710f49ec92908f4b83c7d9ee2ce34174b42e283839748e549
    source_path: channels/pairing.md
    workflow: 16
---

„Parowanie” to jawny krok zatwierdzenia dostępu w OpenClaw.
Jest używane w dwóch miejscach:

1. **Parowanie DM** (kto może rozmawiać z botem)
2. **Parowanie Node** (które urządzenia/węzły mogą dołączyć do sieci Gateway)

Kontekst bezpieczeństwa: [Bezpieczeństwo](/pl/gateway/security)

## 1) Parowanie DM (dostęp do czatu przychodzącego)

Gdy kanał jest skonfigurowany z zasadą DM `pairing`, nieznani nadawcy otrzymują krótki kod, a ich wiadomość **nie jest przetwarzana**, dopóki jej nie zatwierdzisz.

Domyślne zasady DM są udokumentowane w: [Bezpieczeństwo](/pl/gateway/security)

`dmPolicy: "open"` jest publiczne tylko wtedy, gdy efektywna lista dozwolonych nadawców DM zawiera `"*"`.
Konfiguracja i walidacja wymagają tego symbolu wieloznacznego dla publicznie otwartych konfiguracji. Jeśli istniejący
stan zawiera `open` z konkretnymi wpisami `allowFrom`, runtime nadal dopuszcza
tylko tych nadawców, a zatwierdzenia w magazynie parowania nie rozszerzają dostępu `open`.

Kody parowania:

- 8 znaków, wielkie litery, bez niejednoznacznych znaków (`0O1I`).
- **Wygasają po 1 godzinie**. Bot wysyła wiadomość parowania tylko wtedy, gdy zostanie utworzone nowe żądanie (mniej więcej raz na godzinę na nadawcę).
- Oczekujące żądania parowania DM są domyślnie ograniczone do **3 na kanał**; dodatkowe żądania są ignorowane, dopóki jedno nie wygaśnie lub nie zostanie zatwierdzone.

### Zatwierdzanie nadawcy

```bash
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

Jeśli właściciel poleceń nie jest jeszcze skonfigurowany, zatwierdzenie kodu parowania DM uruchamia także
`commands.ownerAllowFrom` dla zatwierdzonego nadawcy, takiego jak `telegram:123456789`.
Daje to pierwszym konfiguracjom jawnego właściciela dla uprzywilejowanych poleceń i monitów
zatwierdzania exec. Po utworzeniu właściciela późniejsze zatwierdzenia parowania przyznają tylko
dostęp DM; nie dodają kolejnych właścicieli.

Obsługiwane kanały: `discord`, `feishu`, `googlechat`, `imessage`, `irc`, `line`, `matrix`, `mattermost`, `msteams`, `nextcloud-talk`, `nostr`, `openclaw-weixin`, `signal`, `slack`, `synology-chat`, `telegram`, `twitch`, `whatsapp`, `zalo`, `zalouser`.

### Grupy nadawców wielokrotnego użytku

Użyj najwyższego poziomu `accessGroups`, gdy ten sam zestaw zaufanych nadawców powinien mieć zastosowanie do
wielu kanałów wiadomości albo zarówno do list dozwolonych DM, jak i grup.

Grupy statyczne używają `type: "message.senders"` i są przywoływane za pomocą
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

- Konta inne niż domyślne odczytują/zapisują tylko swój plik listy dozwolonych o określonym zakresie.
- Konto domyślne używa pliku listy dozwolonych bez określonego zakresu, przypisanego do kanału.

Traktuj je jako wrażliwe (bramkują dostęp do Twojego asystenta).

<Note>
Magazyn listy dozwolonych parowania służy do dostępu DM. Autoryzacja grupowa jest oddzielna.
Zatwierdzenie kodu parowania DM nie pozwala temu nadawcy automatycznie uruchamiać poleceń grupowych
ani kontrolować bota w grupach. Pierwsza inicjalizacja właściciela jest oddzielnym stanem konfiguracji
w `commands.ownerAllowFrom`, a dostarczanie na czacie grupowym nadal podlega listom dozwolonych grup
kanału (na przykład `groupAllowFrom`, `groups` albo nadpisaniom dla grupy
lub tematu, zależnie od kanału).
</Note>

## 2) Parowanie urządzeń Node (iOS/Android/macOS/bezgłowe Node)

Node łączą się z Gateway jako **urządzenia** z `role: node`. Gateway
tworzy żądanie parowania urządzenia, które musi zostać zatwierdzone.

### Parowanie przez Telegram (zalecane dla iOS)

Jeśli używasz Pluginu `device-pair`, możesz wykonać pierwsze parowanie urządzenia całkowicie z Telegram:

1. W Telegram wyślij wiadomość do swojego bota: `/pair`
2. Bot odpowiada dwiema wiadomościami: wiadomością instruktażową i oddzielną wiadomością z **kodem konfiguracji** (łatwą do skopiowania/wklejenia w Telegram).
3. Na telefonie otwórz aplikację OpenClaw iOS → Settings → Gateway.
4. Zeskanuj kod QR albo wklej kod konfiguracji i połącz się.
5. Wróć do Telegram: `/pair pending` (sprawdź identyfikatory żądań, rolę i zakresy), a następnie zatwierdź.

Kod konfiguracji to zakodowany base64 ładunek JSON, który zawiera:

- `url`: adres URL WebSocket Gateway (`ws://...` albo `wss://...`)
- `bootstrapToken`: krótkotrwały token rozruchowy dla jednego urządzenia używany do początkowego uzgadniania parowania

Ten token rozruchowy niesie wbudowany profil rozruchowy parowania:

- wbudowany profil konfiguracji dopuszcza tylko świeżą bazę QR/kodu konfiguracji:
  `node` plus ograniczone przekazanie `operator`
- przekazany token `node` pozostaje `scopes: []`
- przekazany token `operator` jest ograniczony do `operator.approvals`,
  `operator.read` i `operator.write`
- `operator.admin` i `operator.pairing` nie są przyznawane przez rozruch
  QR/kodu konfiguracji; wymagają oddzielnego zatwierdzonego parowania operatora lub przepływu tokenu
- późniejsza rotacja/unieważnienie tokenu pozostaje ograniczone zarówno przez zatwierdzony
  kontrakt roli urządzenia, jak i zakresy operatora sesji wywołującej

Traktuj kod konfiguracji jak hasło, dopóki jest ważny.

W przypadku Tailscale, publicznego lub innego zdalnego parowania mobilnego użyj Tailscale Serve/Funnel
albo innego adresu URL Gateway `wss://`. Kody konfiguracji w postaci jawnego tekstu `ws://` są akceptowane tylko
dla loopback, prywatnych adresów LAN, hostów Bonjour `.local` i hosta emulatora
Android. Adresy CGNAT tailnet, nazwy `.ts.net` i hosty publiczne nadal
kończą się błędem zamkniętym przed wydaniem QR/kodu konfiguracji.

### Zatwierdzanie urządzenia Node

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

Gdy jawne zatwierdzenie zostanie odrzucone, ponieważ zatwierdzająca sparowana sesja urządzenia
została otwarta tylko z zakresem parowania, CLI ponawia to samo żądanie z
`operator.admin`. Pozwala to istniejącemu sparowanemu urządzeniu z uprawnieniami administratora odzyskać nowe
parowanie Control UI/przeglądarki bez ręcznej edycji `devices/paired.json`. Gateway
nadal waliduje ponowione połączenie; tokeny, które nie mogą uwierzytelnić się
z `operator.admin`, pozostają zablokowane.

Jeśli to samo urządzenie ponowi próbę z innymi szczegółami uwierzytelnienia (na przykład inną
rolą/zakresami/kluczem publicznym), poprzednie oczekujące żądanie zostaje zastąpione i tworzony jest nowy
`requestId`.

<Note>
Już sparowane urządzenie nie otrzymuje po cichu szerszego dostępu. Jeśli połączy się ponownie, prosząc o więcej zakresów lub szerszą rolę, OpenClaw zachowa istniejące zatwierdzenie bez zmian i utworzy świeże oczekujące żądanie podniesienia uprawnień. Użyj `openclaw devices list`, aby porównać aktualnie zatwierdzony dostęp z nowo żądanym dostępem przed zatwierdzeniem.
</Note>

### Opcjonalne automatyczne zatwierdzanie Node zaufanych CIDR

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

Dotyczy to wyłącznie świeżych żądań parowania `role: node` bez żądanych
zakresów. Klienci operatora, przeglądarki, Control UI i WebChat nadal wymagają ręcznego
zatwierdzenia. Zmiany roli, zakresu, metadanych i klucza publicznego nadal wymagają ręcznego
zatwierdzenia.

### Przechowywanie stanu parowania Node

Przechowywane w `~/.openclaw/devices/`:

- `pending.json` (krótkotrwały; oczekujące żądania wygasają)
- `paired.json` (sparowane urządzenia + tokeny)

### Uwagi

- Starsze API `node.pair.*` (CLI: `openclaw nodes pending|approve|reject|remove|rename`) to
  oddzielny magazyn parowania należący do Gateway. Node WS nadal wymagają parowania urządzeń.
- Rekord parowania jest trwałym źródłem prawdy dla zatwierdzonych ról. Aktywne
  tokeny urządzeń pozostają ograniczone do tego zatwierdzonego zestawu ról; przypadkowy wpis tokenu
  poza zatwierdzonymi rolami nie tworzy nowego dostępu.

## Powiązane dokumenty

- Model bezpieczeństwa + prompt injection: [Bezpieczeństwo](/pl/gateway/security)
- Bezpieczna aktualizacja (uruchom doctor): [Aktualizacja](/pl/install/updating)
- Konfiguracje kanałów:
  - Telegram: [Telegram](/pl/channels/telegram)
  - WhatsApp: [WhatsApp](/pl/channels/whatsapp)
  - Signal: [Signal](/pl/channels/signal)
  - iMessage: [iMessage](/pl/channels/imessage)
  - Discord: [Discord](/pl/channels/discord)
  - Slack: [Slack](/pl/channels/slack)
