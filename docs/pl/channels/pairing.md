---
read_when:
    - Konfigurowanie kontroli dostępu do wiadomości prywatnych
    - Parowanie nowego Node iOS/Android
    - Przegląd stanu zabezpieczeń OpenClaw
summary: 'Omówienie parowania: zatwierdź, kto może wysyłać Ci wiadomości prywatne + które węzły mogą dołączyć'
title: Parowanie
x-i18n:
    generated_at: "2026-04-30T09:38:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: cfdcaf831aedb122ea85200518b8dc1c6f42eff365444dee6c4b740050b1ce26
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

`dmPolicy: "open"` jest publiczne tylko wtedy, gdy efektywna lista dozwolonych DM zawiera `"*"`.
Konfiguracja i walidacja wymagają tego wieloznacznika dla konfiguracji publicznie otwartych. Jeśli istniejący
stan zawiera `open` z konkretnymi wpisami `allowFrom`, środowisko uruchomieniowe nadal dopuszcza
tylko tych nadawców, a zatwierdzenia z magazynu parowania nie rozszerzają dostępu `open`.

Kody parowania:

- 8 znaków, wielkie litery, bez niejednoznacznych znaków (`0O1I`).
- **Wygasają po 1 godzinie**. Bot wysyła wiadomość parowania tylko wtedy, gdy tworzone jest nowe żądanie (mniej więcej raz na godzinę na nadawcę).
- Oczekujące żądania parowania DM są domyślnie ograniczone do **3 na kanał**; dodatkowe żądania są ignorowane, dopóki jedno nie wygaśnie albo nie zostanie zatwierdzone.

### Zatwierdź nadawcę

```bash
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

Jeśli właściciel poleceń nie jest jeszcze skonfigurowany, zatwierdzenie kodu parowania DM uruchamia także
`commands.ownerAllowFrom` dla zatwierdzonego nadawcy, na przykład `telegram:123456789`.
Daje to pierwszym konfiguracjom jawnego właściciela dla poleceń uprzywilejowanych oraz monitów zatwierdzania
wykonania. Po utworzeniu właściciela późniejsze zatwierdzenia parowania przyznają tylko dostęp DM;
nie dodają kolejnych właścicieli.

Obsługiwane kanały: `bluebubbles`, `discord`, `feishu`, `googlechat`, `imessage`, `irc`, `line`, `matrix`, `mattermost`, `msteams`, `nextcloud-talk`, `nostr`, `openclaw-weixin`, `signal`, `slack`, `synology-chat`, `telegram`, `twitch`, `whatsapp`, `zalo`, `zalouser`.

### Gdzie znajduje się stan

Przechowywane w `~/.openclaw/credentials/`:

- Oczekujące żądania: `<channel>-pairing.json`
- Magazyn zatwierdzonej listy dozwolonych:
  - Konto domyślne: `<channel>-allowFrom.json`
  - Konto inne niż domyślne: `<channel>-<accountId>-allowFrom.json`

Zachowanie zakresu kont:

- Konta inne niż domyślne odczytują/zapisują tylko swój plik listy dozwolonych w zakresie konta.
- Konto domyślne używa niezakresowanego pliku listy dozwolonych w zakresie kanału.

Traktuj je jako poufne (kontrolują dostęp do Twojego asystenta).

<Note>
Magazyn listy dozwolonych parowania służy do dostępu DM. Autoryzacja grup jest oddzielna.
Zatwierdzenie kodu parowania DM nie zezwala automatycznie temu nadawcy na uruchamianie poleceń
grupowych ani sterowanie botem w grupach. Bootstrap pierwszego właściciela to oddzielny stan
konfiguracji w `commands.ownerAllowFrom`, a dostarczanie czatu grupowego nadal podlega listom dozwolonych
grup kanału (na przykład `groupAllowFrom`, `groups` albo nadpisaniom dla grup
lub tematów, zależnie od kanału).
</Note>

## 2) Parowanie urządzeń Node (węzły iOS/Android/macOS/headless)

Węzły łączą się z Gateway jako **urządzenia** z `role: node`. Gateway
tworzy żądanie parowania urządzenia, które musi zostać zatwierdzone.

### Parowanie przez Telegram (zalecane dla iOS)

Jeśli używasz Plugin `device-pair`, możesz wykonać pierwsze parowanie urządzenia całkowicie z Telegram:

1. W Telegram wyślij wiadomość do swojego bota: `/pair`
2. Bot odpowiada dwiema wiadomościami: wiadomością z instrukcjami oraz osobną wiadomością z **kodem konfiguracji** (łatwą do skopiowania/wklejenia w Telegram).
3. Na telefonie otwórz aplikację OpenClaw iOS → Ustawienia → Gateway.
4. Wklej kod konfiguracji i połącz się.
5. Z powrotem w Telegram: `/pair pending` (sprawdź identyfikatory żądań, rolę i zakresy), a następnie zatwierdź.

Kod konfiguracji to zakodowany w base64 ładunek JSON, który zawiera:

- `url`: adres URL WebSocket Gateway (`ws://...` albo `wss://...`)
- `bootstrapToken`: krótkotrwały token bootstrap dla pojedynczego urządzenia używany do początkowego uzgodnienia parowania

Ten token bootstrap niesie wbudowany profil bootstrap parowania:

- podstawowy przekazany token `node` pozostaje przy `scopes: []`
- każdy przekazany token `operator` pozostaje ograniczony do listy dozwolonych bootstrap:
  `operator.approvals`, `operator.read`, `operator.talk.secrets`, `operator.write`
- kontrole zakresów bootstrap mają prefiks roli, nie są jedną płaską pulą zakresów:
  wpisy zakresu operatora spełniają tylko żądania operatora, a role niebędące operatorem
  nadal muszą żądać zakresów pod własnym prefiksem roli
- późniejsza rotacja/unieważnianie tokenów pozostaje ograniczone zarówno zatwierdzonym
  kontraktem roli urządzenia, jak i zakresami operatora sesji wywołującej

Traktuj kod konfiguracji jak hasło, dopóki jest ważny.

### Zatwierdź urządzenie Node

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

Jeśli to samo urządzenie ponowi próbę z innymi szczegółami uwierzytelniania (na przykład inną
rolą/zakresami/kluczem publicznym), poprzednie oczekujące żądanie zostaje zastąpione i tworzony jest nowy
`requestId`.

<Note>
Już sparowane urządzenie nie uzyskuje po cichu szerszego dostępu. Jeśli ponownie połączy się, prosząc o więcej zakresów lub szerszą rolę, OpenClaw pozostawia istniejące zatwierdzenie bez zmian i tworzy nowe oczekujące żądanie podniesienia uprawnień. Użyj `openclaw devices list`, aby porównać aktualnie zatwierdzony dostęp z nowo żądanym dostępem, zanim zatwierdzisz.
</Note>

### Opcjonalne automatyczne zatwierdzanie Node z zaufanego CIDR

Parowanie urządzeń pozostaje domyślnie ręczne. W ściśle kontrolowanych sieciach Node
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
