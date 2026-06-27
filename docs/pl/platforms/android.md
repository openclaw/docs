---
read_when:
    - Parowanie lub ponowne łączenie węzła Android
    - Debugowanie wykrywania Gateway lub uwierzytelniania na Androidzie
    - Weryfikacja parzystości historii czatu między klientami
summary: 'Aplikacja Android (node): runbook połączenia + powierzchnia poleceń Connect/Chat/Voice/Canvas'
title: Aplikacja na Androida
x-i18n:
    generated_at: "2026-06-27T17:46:21Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5c02d4921c3f3011c09e564d83b773a7c155d17a82a6e70d3fd3e973597142f1
    source_path: platforms/android.md
    workflow: 16
---

<Note>
Oficjalna aplikacja na Androida jest dostępna w [Google Play](https://play.google.com/store/apps/details?id=ai.openclaw.app&hl=en_IN). Jest to węzeł towarzyszący i wymaga działającego OpenClaw Gateway. Kod źródłowy jest też dostępny w [repozytorium OpenClaw](https://github.com/openclaw/openclaw) w `apps/android`; instrukcje budowania znajdziesz w [apps/android/README.md](https://github.com/openclaw/openclaw/blob/main/apps/android/README.md).
</Note>

## Migawka wsparcia

- Rola: aplikacja węzła towarzyszącego (Android nie hostuje Gateway).
- Wymagany Gateway: tak (uruchom go na macOS, Linux lub Windows przez WSL2).
- Instalacja: [Google Play](https://play.google.com/store/apps/details?id=ai.openclaw.app&hl=en_IN) dla aplikacji, [Pierwsze kroki](/pl/start/getting-started) dla Gateway, a następnie [Parowanie](/pl/channels/pairing).
- Gateway: [Instrukcja operacyjna](/pl/gateway) + [Konfiguracja](/pl/gateway/configuration).
  - Protokoły: [protokół Gateway](/pl/gateway/protocol) (węzły + płaszczyzna sterowania).

## Sterowanie systemem

Sterowanie systemem (launchd/systemd) znajduje się na hoście Gateway. Zobacz [Gateway](/pl/gateway).

## Instrukcja połączenia

Aplikacja węzła Android ⇄ (mDNS/NSD + WebSocket) ⇄ **Gateway**

Android łączy się bezpośrednio z WebSocket Gateway i używa parowania urządzeń (`role: node`).

W przypadku Tailscale lub hostów publicznych Android wymaga bezpiecznego punktu końcowego:

- Preferowane: Tailscale Serve / Funnel z `https://<magicdns>` / `wss://<magicdns>`
- Obsługiwane także: dowolny inny URL Gateway `wss://` z rzeczywistym punktem końcowym TLS
- Jawny tekst `ws://` pozostaje obsługiwany na prywatnych adresach LAN / hostach `.local`, a także `localhost`, `127.0.0.1` i most emulatora Androida (`10.0.2.2`)

### Wymagania wstępne

- Możesz uruchomić Gateway na maszynie „master”.
- Urządzenie/emulator Android może połączyć się z WebSocket Gateway:
  - Ta sama sieć LAN z mDNS/NSD, **albo**
  - Ta sama sieć tailnet Tailscale z Wide-Area Bonjour / unicast DNS-SD (zobacz niżej), **albo**
  - Ręczny host/port Gateway (awaryjnie)
- Parowanie mobilne w sieci tailnet/publiczne **nie** używa surowych punktów końcowych IP tailnet `ws://`. Zamiast tego użyj Tailscale Serve lub innego URL `wss://`.
- Możesz uruchomić CLI (`openclaw`) na maszynie Gateway (lub przez SSH).

### 1) Uruchom Gateway

```bash
openclaw gateway --port 18789 --verbose
```

Potwierdź w logach, że widzisz coś w rodzaju:

- `listening on ws://0.0.0.0:18789`

Do zdalnego dostępu Androida przez Tailscale preferuj Serve/Funnel zamiast surowego powiązania z tailnet:

```bash
openclaw gateway --tailscale serve
```

Daje to Androidowi bezpieczny punkt końcowy `wss://` / `https://`. Zwykła konfiguracja `gateway.bind: "tailnet"` nie wystarcza do pierwszego zdalnego parowania Androida, chyba że osobno kończysz też TLS.

### 2) Zweryfikuj wykrywanie (opcjonalnie)

Z maszyny Gateway:

```bash
dns-sd -B _openclaw-gw._tcp local.
```

Więcej uwag debugowania: [Bonjour](/pl/gateway/bonjour).

Jeśli skonfigurowano też domenę wykrywania szerokiego obszaru, porównaj z:

```bash
openclaw gateway discover --json
```

Pokazuje to `local.` oraz skonfigurowaną domenę szerokiego obszaru w jednym przebiegu i używa rozwiązanego
punktu końcowego usługi zamiast wskazówek wyłącznie z TXT.

#### Wykrywanie w tailnet (Wiedeń ⇄ Londyn) przez unicast DNS-SD

Wykrywanie Android NSD/mDNS nie przechodzi między sieciami. Jeśli węzeł Android i Gateway są w różnych sieciach, ale są połączone przez Tailscale, użyj zamiast tego Wide-Area Bonjour / unicast DNS-SD.

Samo wykrywanie nie wystarcza do parowania Androida w sieci tailnet/publicznie. Wykryta trasa nadal wymaga bezpiecznego punktu końcowego (`wss://` lub Tailscale Serve):

1. Skonfiguruj strefę DNS-SD (przykład `openclaw.internal.`) na hoście Gateway i opublikuj rekordy `_openclaw-gw._tcp`.
2. Skonfiguruj Tailscale split DNS dla wybranej domeny, wskazując ten serwer DNS.

Szczegóły i przykładowa konfiguracja CoreDNS: [Bonjour](/pl/gateway/bonjour).

### 3) Połącz z Androida

W aplikacji Android:

- Aplikacja utrzymuje połączenie z Gateway przy życiu przez **usługę pierwszoplanową** (stałe powiadomienie).
- Otwórz kartę **Połącz**.
- Użyj trybu **Kod konfiguracji** lub **Ręcznie**.
- Jeśli wykrywanie jest zablokowane, użyj ręcznego hosta/portu w **Kontrolkach zaawansowanych**. Dla prywatnych hostów LAN `ws://` nadal działa. Dla hostów Tailscale/publicznych włącz TLS i użyj punktu końcowego `wss://` / Tailscale Serve.

Po pierwszym udanym parowaniu Android automatycznie łączy się ponownie przy uruchomieniu:

- Ręczny punkt końcowy (jeśli włączony), w przeciwnym razie
- Ostatnio wykryty Gateway (najlepsza próba).

### Beacony aktywnej obecności

Po połączeniu uwierzytelnionej sesji węzła oraz gdy aplikacja przechodzi do tła, a
usługa pierwszoplanowa jest nadal połączona, Android wywołuje `node.event` z
`event: "node.presence.alive"`. Gateway zapisuje to jako `lastSeenAtMs`/`lastSeenReason` w
metadanych sparowanego węzła/urządzenia dopiero po poznaniu tożsamości uwierzytelnionego urządzenia węzła.

Aplikacja uznaje beacon za pomyślnie zapisany tylko wtedy, gdy odpowiedź Gateway zawiera
`handled: true`. Starsze Gateway mogą potwierdzać `node.event` za pomocą `{ "ok": true }`; ta odpowiedź jest
zgodna, ale nie liczy się jako trwała aktualizacja ostatniej aktywności.

### 4) Zatwierdź parowanie (CLI)

Na maszynie Gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

Szczegóły parowania: [Parowanie](/pl/channels/pairing).

Opcjonalnie: jeśli węzeł Android zawsze łączy się z ściśle kontrolowanej podsieci,
możesz włączyć automatyczne zatwierdzanie pierwszego parowania węzła za pomocą jawnych CIDR lub dokładnych IP:

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

Domyślnie jest to wyłączone. Dotyczy tylko świeżego parowania `role: node` bez
żądanych zakresów. Parowanie operatora/przeglądarki oraz każda zmiana roli, zakresu, metadanych lub
klucza publicznego nadal wymaga ręcznego zatwierdzenia.

### 5) Zweryfikuj, że węzeł jest połączony

- Przez status węzłów:

  ```bash
  openclaw nodes status
  ```

- Przez Gateway:

  ```bash
  openclaw gateway call node.list --params "{}"
  ```

### 6) Czat + historia

Karta Czat w Androidzie obsługuje wybór sesji (domyślnie `main` oraz inne istniejące sesje):

- Historia: `chat.history` (znormalizowana do wyświetlania; wbudowane znaczniki dyrektyw są
  usuwane z widocznego tekstu, ładunki XML wywołań narzędzi w postaci zwykłego tekstu (w tym
  `<tool_call>...</tool_call>`, `<function_call>...</function_call>`,
  `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` oraz
  ucięte bloki wywołań narzędzi) i ujawnione tokeny sterujące modelu ASCII/pełnej szerokości
  są usuwane, czyste wiersze asystenta z cichymi tokenami, takie jak dokładne `NO_REPLY` /
  `no_reply`, są pomijane, a zbyt duże wiersze mogą być zastępowane placeholderami)
- Wysyłanie: `chat.send`
- Aktualizacje push (najlepsza próba): `chat.subscribe` → `event:"chat"`

### 7) Canvas + kamera

#### Host Canvas Gateway (zalecany dla treści WWW)

Jeśli chcesz, aby węzeł pokazywał prawdziwy HTML/CSS/JS, który agent może edytować na dysku, skieruj węzeł na host Canvas Gateway.

<Note>
Węzły ładują Canvas z serwera HTTP Gateway (ten sam port co `gateway.port`, domyślnie `18789`).
</Note>

1. Utwórz `~/.openclaw/workspace/canvas/index.html` na hoście Gateway.

2. Przekieruj do niego węzeł (LAN):

```bash
openclaw nodes invoke --node "<Android Node>" --command canvas.navigate --params '{"url":"http://<gateway-hostname>.local:18789/__openclaw__/canvas/"}'
```

Tailnet (opcjonalnie): jeśli oba urządzenia są w Tailscale, użyj nazwy MagicDNS lub IP tailnet zamiast `.local`, np. `http://<gateway-magicdns>:18789/__openclaw__/canvas/`.

Ten serwer wstrzykuje klienta live-reload do HTML i przeładowuje po zmianach plików.
Gateway udostępnia też `/__openclaw__/a2ui/`, ale aplikacja Android traktuje zdalne strony A2UI jako tylko do renderowania. Polecenia A2UI zdolne do akcji używają dołączonej strony A2UI należącej do aplikacji przed zastosowaniem wiadomości.

Polecenia Canvas (tylko na pierwszym planie):

- `canvas.eval`, `canvas.snapshot`, `canvas.navigate` (użyj `{"url":""}` lub `{"url":"/"}`, aby wrócić do domyślnego szkieletu). `canvas.snapshot` zwraca `{ format, base64 }` (domyślnie `format="jpeg"`).
- A2UI: `canvas.a2ui.push`, `canvas.a2ui.reset` (`canvas.a2ui.pushJSONL` to starszy alias). Te polecenia używają dołączonej strony A2UI należącej do aplikacji do renderowania zdolnego do akcji.

Polecenia kamery (tylko na pierwszym planie; wymagają uprawnienia):

- `camera.snap` (jpg)
- `camera.clip` (mp4)

Parametry i pomocniki CLI znajdziesz w [Węzeł kamery](/pl/nodes/camera).

### 8) Głos + rozszerzona powierzchnia poleceń Androida

- Karta Głos: Android ma dwa jawne tryby przechwytywania. **Mikrofon** to ręczna sesja karty Głos, która wysyła każdą pauzę jako turę czatu i zatrzymuje się, gdy aplikacja opuszcza pierwszy plan lub użytkownik opuszcza kartę Głos. **Rozmowa** to ciągły tryb Talk Mode i nasłuchuje, dopóki nie zostanie wyłączony lub węzeł się nie rozłączy.
- Talk Mode promuje istniejącą usługę pierwszoplanową z `connectedDevice` do `connectedDevice|microphone` przed rozpoczęciem przechwytywania, a następnie degraduje ją po zatrzymaniu Talk Mode. Usługa węzła deklaruje `FOREGROUND_SERVICE_CONNECTED_DEVICE` z `CHANGE_NETWORK_STATE`; Android 14+ wymaga też deklaracji `FOREGROUND_SERVICE_MICROPHONE`, nadania uprawnienia runtime `RECORD_AUDIO` oraz typu usługi mikrofonu w czasie działania.
- Domyślnie Android Talk używa natywnego rozpoznawania mowy, czatu Gateway i `talk.speak` przez skonfigurowanego dostawcę Talk Gateway. Lokalny systemowy TTS jest używany tylko wtedy, gdy `talk.speak` jest niedostępne.
- Android Talk używa przekaźnika Gateway w czasie rzeczywistym tylko wtedy, gdy `talk.realtime.mode` ma wartość `realtime`, a `talk.realtime.transport` ma wartość `gateway-relay`.
- Wybudzanie głosem pozostaje wyłączone w UX/czasie działania Androida.
- Dodatkowe rodziny poleceń Androida (dostępność zależy od urządzenia, uprawnień i ustawień użytkownika):
  - `device.status`, `device.info`, `device.permissions`, `device.health`
  - `device.apps` tylko wtedy, gdy włączone jest **Ustawienia > Możliwości telefonu > Zainstalowane aplikacje**; domyślnie wyświetla aplikacje widoczne w launcherze.
  - `notifications.list`, `notifications.actions` (zobacz niżej [Przekazywanie powiadomień](#notification-forwarding))
  - `photos.latest`
  - `contacts.search`, `contacts.add`
  - `calendar.events`, `calendar.add`
  - `callLog.search`
  - `sms.search`
  - `motion.activity`, `motion.pedometer`

## Punkty wejścia asystenta

Android obsługuje uruchamianie OpenClaw z systemowego wyzwalacza asystenta (Google
Assistant). Po skonfigurowaniu przytrzymanie przycisku ekranu głównego lub powiedzenie „Hey Google, ask
OpenClaw...” otwiera aplikację i przekazuje prompt do kompozytora czatu.

Używa to metadanych Android **App Actions** zadeklarowanych w manifeście aplikacji. Po stronie
Gateway nie jest potrzebna dodatkowa konfiguracja -- intencja asystenta jest
obsługiwana całkowicie przez aplikację Android i przekazywana jako normalna wiadomość czatu.

<Note>
Dostępność App Actions zależy od urządzenia, wersji Google Play Services
oraz od tego, czy użytkownik ustawił OpenClaw jako domyślną aplikację asystenta.
</Note>

## Przekazywanie powiadomień

Android może przekazywać powiadomienia urządzenia do Gateway jako zdarzenia. Kilka kontrolek pozwala określić, które powiadomienia są przekazywane i kiedy.

| Klucz                            | Typ            | Opis                                                                                                      |
| -------------------------------- | -------------- | --------------------------------------------------------------------------------------------------------- |
| `notifications.allowPackages`    | string[]       | Przekazuj tylko powiadomienia z tych nazw pakietów. Jeśli ustawione, wszystkie inne pakiety są ignorowane. |
| `notifications.denyPackages`     | string[]       | Nigdy nie przekazuj powiadomień z tych nazw pakietów. Stosowane po `allowPackages`.                       |
| `notifications.quietHours.start` | string (HH:mm) | Początek okna godzin ciszy (lokalny czas urządzenia). Powiadomienia są tłumione w tym oknie.              |
| `notifications.quietHours.end`   | string (HH:mm) | Koniec okna godzin ciszy.                                                                                 |
| `notifications.rateLimit`        | number         | Maksymalna liczba przekazanych powiadomień na pakiet na minutę. Nadmiarowe powiadomienia są odrzucane.    |

Selektor powiadomień używa też bezpieczniejszego zachowania dla przekazywanych zdarzeń powiadomień, zapobiegając przypadkowemu przekazywaniu wrażliwych powiadomień systemowych.

Przykładowa konfiguracja:

```json5
{
  notifications: {
    allowPackages: ["com.slack", "com.whatsapp"],
    denyPackages: ["com.android.systemui"],
    quietHours: {
      start: "22:00",
      end: "07:00",
    },
    rateLimit: 5,
  },
}
```

<Note>
Przekazywanie powiadomień wymaga uprawnienia Android Notification Listener. Aplikacja prosi o nie podczas konfiguracji.
</Note>

## Powiązane

- [Aplikacja iOS](/pl/platforms/ios)
- [Węzły](/pl/nodes)
- [Rozwiązywanie problemów z węzłem Android](/pl/nodes/troubleshooting)
