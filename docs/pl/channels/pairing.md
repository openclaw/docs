---
read_when:
    - Konfigurowanie kontroli dostępu do wiadomości bezpośrednich
    - Parowanie nowego Node iOS/Android
    - Przegląd stanu zabezpieczeń OpenClaw
summary: 'Przegląd parowania: zatwierdź, kto może wysyłać Ci wiadomości prywatne + które węzły mogą dołączać'
title: Parowanie
x-i18n:
    generated_at: "2026-05-02T09:43:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: bb68d87c0e1dfe7c9a6a6d9415f4c63625755fb43a2e22a1d1374ff0a63e49c4
    source_path: channels/pairing.md
    workflow: 16
---

“Parowanie” to jawny krok zatwierdzania dostępu w OpenClaw.
Jest używane w dwóch miejscach:

1. **Parowanie DM** (kto może rozmawiać z botem)
2. **Parowanie Node** (które urządzenia/Node'y mogą dołączać do sieci Gateway)

Kontekst bezpieczeństwa: [Bezpieczeństwo](/pl/gateway/security)

## 1) Parowanie DM (dostęp do czatu przychodzącego)

Gdy kanał jest skonfigurowany z zasadą DM `pairing`, nieznani nadawcy otrzymują krótki kod, a ich wiadomość **nie jest przetwarzana**, dopóki jej nie zatwierdzisz.

Domyślne zasady DM są udokumentowane tutaj: [Bezpieczeństwo](/pl/gateway/security)

`dmPolicy: "open"` jest publiczne tylko wtedy, gdy efektywna lista dozwolonych DM zawiera `"*"`.
Konfiguracja i walidacja wymagają tego symbolu wieloznacznego dla publicznie otwartych konfiguracji. Jeśli istniejący
stan zawiera `open` z konkretnymi wpisami `allowFrom`, środowisko uruchomieniowe nadal dopuszcza
tylko tych nadawców, a zatwierdzenia z magazynu parowania nie rozszerzają dostępu `open`.

Kody parowania:

- 8 znaków, wielkie litery, bez mylących znaków (`0O1I`).
- **Wygasają po 1 godzinie**. Bot wysyła wiadomość parowania tylko wtedy, gdy zostanie utworzone nowe żądanie (mniej więcej raz na godzinę na nadawcę).
- Oczekujące żądania parowania DM są domyślnie ograniczone do **3 na kanał**; dodatkowe żądania są ignorowane, dopóki jedno nie wygaśnie albo nie zostanie zatwierdzone.

### Zatwierdzanie nadawcy

```bash
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

Jeśli właściciel poleceń nie jest jeszcze skonfigurowany, zatwierdzenie kodu parowania DM także inicjalizuje
`commands.ownerAllowFrom` zatwierdzonym nadawcą, takim jak `telegram:123456789`.
Daje to pierwszej konfiguracji jawnego właściciela dla poleceń uprzywilejowanych i monitów o zatwierdzenie
exec. Po utworzeniu właściciela późniejsze zatwierdzenia parowania nadają tylko
dostęp DM; nie dodają kolejnych właścicieli.

Obsługiwane kanały: `bluebubbles`, `discord`, `feishu`, `googlechat`, `imessage`, `irc`, `line`, `matrix`, `mattermost`, `msteams`, `nextcloud-talk`, `nostr`, `openclaw-weixin`, `signal`, `slack`, `synology-chat`, `telegram`, `twitch`, `whatsapp`, `zalo`, `zalouser`.

### Wielokrotnego użytku grupy nadawców

Użyj najwyższego poziomu `accessGroups`, gdy ten sam zaufany zestaw nadawców powinien obowiązywać w
wielu kanałach wiadomości albo zarówno na listach dozwolonych DM, jak i grup.

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

Zachowanie zakresu konta:

- Konta inne niż domyślne odczytują/zapisują tylko swój plik listy dozwolonych o określonym zakresie.
- Konto domyślne używa pliku listy dozwolonych o zakresie kanału, bez określonego zakresu konta.

Traktuj je jako poufne (bramkują dostęp do Twojego asystenta).

<Note>
Magazyn listy dozwolonych parowania służy do dostępu DM. Autoryzacja grupowa jest oddzielna.
Zatwierdzenie kodu parowania DM nie pozwala automatycznie temu nadawcy uruchamiać
poleceń grupowych ani kontrolować bota w grupach. Inicjalizacja pierwszego właściciela to oddzielny stan konfiguracji
w `commands.ownerAllowFrom`, a dostarczanie czatu grupowego nadal podlega
listom dozwolonych grup danego kanału (na przykład `groupAllowFrom`, `groups` albo nadpisaniom
dla poszczególnych grup lub tematów, zależnie od kanału).
</Note>

## 2) Parowanie urządzeń Node (Node'y iOS/Android/macOS/headless)

Node'y łączą się z Gateway jako **urządzenia** z `role: node`. Gateway
tworzy żądanie parowania urządzenia, które musi zostać zatwierdzone.

### Parowanie przez Telegram (zalecane dla iOS)

Jeśli używasz Plugin `device-pair`, możesz przeprowadzić pierwsze parowanie urządzenia w całości z Telegram:

1. W Telegram wyślij wiadomość do swojego bota: `/pair`
2. Bot odpowie dwiema wiadomościami: wiadomością z instrukcjami i osobną wiadomością z **kodem konfiguracji** (łatwą do skopiowania/wklejenia w Telegram).
3. Na telefonie otwórz aplikację OpenClaw iOS → Settings → Gateway.
4. Wklej kod konfiguracji i połącz się.
5. Wróć do Telegram: `/pair pending` (przejrzyj identyfikatory żądań, rolę i zakresy), a następnie zatwierdź.

Kod konfiguracji to ładunek JSON zakodowany w base64, który zawiera:

- `url`: URL WebSocket Gateway (`ws://...` albo `wss://...`)
- `bootstrapToken`: krótkotrwały token inicjalizujący dla jednego urządzenia, używany przy początkowym uzgadnianiu parowania

Ten token inicjalizujący niesie wbudowany profil inicjalizacji parowania:

- główny przekazany token `node` pozostaje `scopes: []`
- każdy przekazany token `operator` pozostaje ograniczony do listy dozwolonych inicjalizacji:
  `operator.approvals`, `operator.read`, `operator.talk.secrets`, `operator.write`
- kontrole zakresów inicjalizacji są prefiksowane rolą, a nie jedną płaską pulą zakresów:
  wpisy zakresu operatora spełniają tylko żądania operatora, a role inne niż operator
  nadal muszą żądać zakresów pod własnym prefiksem roli
- późniejsza rotacja/odwołanie tokenów pozostaje ograniczone zarówno zatwierdzonym
  kontraktem roli urządzenia, jak i zakresami operatora sesji wywołującej

Traktuj kod konfiguracji jak hasło, dopóki jest ważny.

### Zatwierdzanie urządzenia Node

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

Jeśli to samo urządzenie ponowi próbę z innymi szczegółami uwierzytelniania (na przykład inną
rolą/zakresami/kluczem publicznym), poprzednie oczekujące żądanie zostanie zastąpione i zostanie utworzony nowy
`requestId`.

<Note>
Już sparowane urządzenie nie otrzymuje po cichu szerszego dostępu. Jeśli połączy się ponownie, prosząc o więcej zakresów albo szerszą rolę, OpenClaw pozostawia istniejące zatwierdzenie bez zmian i tworzy nowe oczekujące żądanie aktualizacji. Użyj `openclaw devices list`, aby porównać obecnie zatwierdzony dostęp z nowo żądanym dostępem przed zatwierdzeniem.
</Note>

### Opcjonalne automatyczne zatwierdzanie Node z zaufanego CIDR

Parowanie urządzeń pozostaje domyślnie ręczne. Dla ściśle kontrolowanych sieci Node
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

Dotyczy to tylko nowych żądań parowania `role: node` bez żądanych
zakresów. Klienci operatora, przeglądarki, Control UI i WebChat nadal wymagają ręcznego
zatwierdzenia. Zmiany roli, zakresu, metadanych i klucza publicznego nadal wymagają ręcznego
zatwierdzenia.

### Przechowywanie stanu parowania Node

Przechowywane w `~/.openclaw/devices/`:

- `pending.json` (krótkotrwały; oczekujące żądania wygasają)
- `paired.json` (sparowane urządzenia + tokeny)

### Uwagi

- Starsze API `node.pair.*` (CLI: `openclaw nodes pending|approve|reject|remove|rename`) jest
  oddzielnym magazynem parowania należącym do Gateway. Node'y WS nadal wymagają parowania urządzeń.
- Rekord parowania jest trwałym źródłem prawdy dla zatwierdzonych ról. Aktywne
  tokeny urządzeń pozostają ograniczone do tego zatwierdzonego zestawu ról; zbłąkany wpis tokenu
  poza zatwierdzonymi rolami nie tworzy nowego dostępu.

## Powiązana dokumentacja

- Model bezpieczeństwa + wstrzykiwanie promptów: [Bezpieczeństwo](/pl/gateway/security)
- Bezpieczne aktualizowanie (uruchom doctor): [Aktualizowanie](/pl/install/updating)
- Konfiguracje kanałów:
  - Telegram: [Telegram](/pl/channels/telegram)
  - WhatsApp: [WhatsApp](/pl/channels/whatsapp)
  - Signal: [Signal](/pl/channels/signal)
  - BlueBubbles (iMessage): [BlueBubbles](/pl/channels/bluebubbles)
  - iMessage (starsze): [iMessage](/pl/channels/imessage)
  - Discord: [Discord](/pl/channels/discord)
  - Slack: [Slack](/pl/channels/slack)
