---
read_when:
    - Parowanie lub ponowne łączenie węzła Androida
    - Debugowanie wykrywania Gateway lub uwierzytelniania w Androidzie
    - Weryfikowanie zgodności historii czatu między klientami
summary: 'Aplikacja Android (Node): runbook połączeń + obszar poleceń Connect/Chat/Voice/Canvas'
title: Aplikacja na Androida
x-i18n:
    generated_at: "2026-04-30T10:04:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: ae8bec406a006165f124f305e00c848f5527d43dba3cbcd07bd0d7e6f0dcc247
    source_path: platforms/android.md
    workflow: 16
---

<Note>
Aplikacja na Androida nie została jeszcze publicznie wydana. Kod źródłowy jest dostępny w [repozytorium OpenClaw](https://github.com/openclaw/openclaw) w katalogu `apps/android`. Możesz zbudować ją samodzielnie przy użyciu Java 17 i Android SDK (`./gradlew :app:assemblePlayDebug`). Instrukcje budowania znajdziesz w [apps/android/README.md](https://github.com/openclaw/openclaw/blob/main/apps/android/README.md).
</Note>

## Migawka obsługi

- Rola: towarzysząca aplikacja węzła (Android nie hostuje Gateway).
- Wymagany Gateway: tak (uruchom go na macOS, Linux albo Windows przez WSL2).
- Instalacja: [Pierwsze kroki](/pl/start/getting-started) + [Parowanie](/pl/channels/pairing).
- Gateway: [Runbook](/pl/gateway) + [Konfiguracja](/pl/gateway/configuration).
  - Protokoły: [Protokół Gateway](/pl/gateway/protocol) (węzły + płaszczyzna sterowania).

## Sterowanie systemem

Sterowanie systemem (launchd/systemd) znajduje się na hoście Gateway. Zobacz [Gateway](/pl/gateway).

## Runbook połączenia

Aplikacja węzła Android ⇄ (mDNS/NSD + WebSocket) ⇄ **Gateway**

Android łączy się bezpośrednio z WebSocket Gateway i używa parowania urządzenia (`role: node`).

W przypadku Tailscale lub hostów publicznych Android wymaga bezpiecznego punktu końcowego:

- Preferowane: Tailscale Serve / Funnel z `https://<magicdns>` / `wss://<magicdns>`
- Obsługiwane także: dowolny inny URL Gateway `wss://` z prawdziwym punktem końcowym TLS
- Nieszyfrowany `ws://` pozostaje obsługiwany dla prywatnych adresów LAN / hostów `.local`, a także `localhost`, `127.0.0.1` oraz mostu emulatora Androida (`10.0.2.2`)

### Wymagania wstępne

- Możesz uruchomić Gateway na maszynie „głównej”.
- Urządzenie/emulator Androida może połączyć się z WebSocket Gateway:
  - Ta sama sieć LAN z mDNS/NSD, **albo**
  - Ten sam tailnet Tailscale z użyciem Wide-Area Bonjour / unicast DNS-SD (zobacz niżej), **albo**
  - Ręczny host/port Gateway (rozwiązanie awaryjne)
- Parowanie mobilne przez tailnet/publiczne hosty **nie** używa surowych punktów końcowych IP tailnetu `ws://`. Zamiast tego użyj Tailscale Serve albo innego URL `wss://`.
- Możesz uruchomić CLI (`openclaw`) na maszynie Gateway (albo przez SSH).

### 1) Uruchom Gateway

```bash
openclaw gateway --port 18789 --verbose
```

Potwierdź, że w logach widzisz coś takiego:

- `listening on ws://0.0.0.0:18789`

W przypadku zdalnego dostępu Androida przez Tailscale preferuj Serve/Funnel zamiast surowego wiązania z tailnetem:

```bash
openclaw gateway --tailscale serve
```

Daje to Androidowi bezpieczny punkt końcowy `wss://` / `https://`. Zwykła konfiguracja `gateway.bind: "tailnet"` nie wystarcza do pierwszego zdalnego parowania Androida, chyba że osobno zakończysz także TLS.

### 2) Zweryfikuj wykrywanie (opcjonalnie)

Z maszyny Gateway:

```bash
dns-sd -B _openclaw-gw._tcp local.
```

Więcej notatek diagnostycznych: [Bonjour](/pl/gateway/bonjour).

Jeśli skonfigurowano także domenę wykrywania szerokoobszarowego, porównaj z:

```bash
openclaw gateway discover --json
```

To pokazuje `local.` oraz skonfigurowaną domenę szerokoobszarową w jednym przebiegu i używa rozwiązanego
punktu końcowego usługi zamiast wskazówek opartych wyłącznie na TXT.

#### Wykrywanie w tailnecie (Wiedeń ⇄ Londyn) przez unicast DNS-SD

Wykrywanie Android NSD/mDNS nie przechodzi między sieciami. Jeśli węzeł Android i Gateway są w różnych sieciach, ale są połączone przez Tailscale, użyj zamiast tego Wide-Area Bonjour / unicast DNS-SD.

Samo wykrywanie nie wystarcza do parowania Androida przez tailnet/publiczne hosty. Wykryta trasa nadal wymaga bezpiecznego punktu końcowego (`wss://` albo Tailscale Serve):

1. Skonfiguruj strefę DNS-SD (przykład `openclaw.internal.`) na hoście Gateway i opublikuj rekordy `_openclaw-gw._tcp`.
2. Skonfiguruj split DNS Tailscale dla wybranej domeny, wskazując na ten serwer DNS.

Szczegóły i przykładowa konfiguracja CoreDNS: [Bonjour](/pl/gateway/bonjour).

### 3) Połącz z Androida

W aplikacji na Androida:

- Aplikacja utrzymuje połączenie z Gateway przy życiu przez **usługę pierwszoplanową** (trwałe powiadomienie).
- Otwórz kartę **Connect**.
- Użyj trybu **Setup Code** albo **Manual**.
- Jeśli wykrywanie jest zablokowane, użyj ręcznego hosta/portu w **Advanced controls**. Dla prywatnych hostów LAN `ws://` nadal działa. Dla hostów Tailscale/publicznych włącz TLS i użyj punktu końcowego `wss://` / Tailscale Serve.

Po pierwszym udanym parowaniu Android automatycznie łączy się ponownie przy uruchomieniu:

- Ręczny punkt końcowy (jeśli włączony), w przeciwnym razie
- Ostatnio wykryty Gateway (najlepsza próba).

### Sygnały obecności alive

Po połączeniu uwierzytelnionej sesji węzła oraz gdy aplikacja przechodzi w tło, podczas gdy
usługa pierwszoplanowa nadal jest połączona, Android wywołuje `node.event` z
`event: "node.presence.alive"`. Gateway zapisuje to jako `lastSeenAtMs`/`lastSeenReason` w
metadanych sparowanego węzła/urządzenia dopiero po poznaniu uwierzytelnionej tożsamości urządzenia węzła.

Aplikacja uznaje sygnał za pomyślnie zapisany tylko wtedy, gdy odpowiedź Gateway zawiera
`handled: true`. Starsze Gateway mogą potwierdzać `node.event` przez `{ "ok": true }`; taka odpowiedź jest
zgodna, ale nie liczy się jako trwała aktualizacja ostatniej widoczności.

### 4) Zatwierdź parowanie (CLI)

Na maszynie Gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

Szczegóły parowania: [Parowanie](/pl/channels/pairing).

Opcjonalnie: jeśli węzeł Android zawsze łączy się z ściśle kontrolowanej podsieci,
możesz włączyć automatyczne zatwierdzanie pierwszego parowania węzła z jawnymi CIDR-ami albo dokładnymi adresami IP:

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

Domyślnie jest to wyłączone. Dotyczy tylko świeżego parowania `role: node`
bez żądanych zakresów. Parowanie operatora/przeglądarki oraz każda zmiana roli, zakresu, metadanych albo
klucza publicznego nadal wymagają ręcznego zatwierdzenia.

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

Karta Chat w Androidzie obsługuje wybór sesji (domyślnie `main` oraz inne istniejące sesje):

- Historia: `chat.history` (znormalizowana do wyświetlania; wbudowane znaczniki dyrektyw są
  usuwane z widocznego tekstu, zwykłotekstowe ładunki XML wywołań narzędzi (w tym
  `<tool_call>...</tool_call>`, `<function_call>...</function_call>`,
  `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` oraz
  ucięte bloki wywołań narzędzi) i ujawnione tokeny sterujące modelu ASCII/pełnej szerokości
  są usuwane, czyste wiersze asystenta z cichym tokenem, takie jak dokładne `NO_REPLY` /
  `no_reply`, są pomijane, a zbyt duże wiersze mogą zostać zastąpione placeholderami)
- Wysyłanie: `chat.send`
- Aktualizacje push (najlepsza próba): `chat.subscribe` → `event:"chat"`

### 7) Canvas + kamera

#### Host Gateway Canvas (zalecany dla treści webowych)

Jeśli chcesz, aby węzeł pokazywał prawdziwy HTML/CSS/JS, który agent może edytować na dysku, skieruj węzeł na hosta Gateway Canvas.

<Note>
Węzły ładują canvas z serwera HTTP Gateway (ten sam port co `gateway.port`, domyślnie `18789`).
</Note>

1. Utwórz `~/.openclaw/workspace/canvas/index.html` na hoście Gateway.

2. Przejdź w węźle do niego (LAN):

```bash
openclaw nodes invoke --node "<Android Node>" --command canvas.navigate --params '{"url":"http://<gateway-hostname>.local:18789/__openclaw__/canvas/"}'
```

Tailnet (opcjonalnie): jeśli oba urządzenia są w Tailscale, użyj nazwy MagicDNS albo IP tailnetu zamiast `.local`, np. `http://<gateway-magicdns>:18789/__openclaw__/canvas/`.

Ten serwer wstrzykuje klienta live-reload do HTML i przeładowuje przy zmianach plików.
Host A2UI znajduje się pod adresem `http://<gateway-host>:18789/__openclaw__/a2ui/`.

Polecenia canvas (tylko na pierwszym planie):

- `canvas.eval`, `canvas.snapshot`, `canvas.navigate` (użyj `{"url":""}` albo `{"url":"/"}`, aby wrócić do domyślnego szkieletu). `canvas.snapshot` zwraca `{ format, base64 }` (domyślnie `format="jpeg"`).
- A2UI: `canvas.a2ui.push`, `canvas.a2ui.reset` (`canvas.a2ui.pushJSONL` jako starszy alias)

Polecenia kamery (tylko na pierwszym planie; chronione uprawnieniami):

- `camera.snap` (jpg)
- `camera.clip` (mp4)

Parametry i pomocniki CLI znajdziesz w [Węzeł kamery](/pl/nodes/camera).

### 8) Głos + rozszerzona powierzchnia poleceń Androida

- Karta Voice: Android ma dwa jawne tryby przechwytywania. **Mic** to ręczna sesja karty Voice, która wysyła każdą pauzę jako turę czatu i zatrzymuje się, gdy aplikacja opuszcza pierwszy plan albo użytkownik opuszcza kartę Voice. **Talk** to ciągły Tryb Talk i nasłuchuje do momentu wyłączenia przełącznikiem albo rozłączenia węzła.
- Tryb Talk promuje istniejącą usługę pierwszoplanową z `dataSync` do `dataSync|microphone` przed rozpoczęciem przechwytywania, a następnie degraduje ją, gdy Tryb Talk się zatrzyma. Android 14+ wymaga deklaracji `FOREGROUND_SERVICE_MICROPHONE`, przyznania uprawnienia runtime `RECORD_AUDIO` oraz typu usługi mikrofonu w czasie działania.
- Odpowiedzi mówione używają `talk.speak` przez skonfigurowanego dostawcę Talk Gateway. Lokalny systemowy TTS jest używany tylko wtedy, gdy `talk.speak` jest niedostępne.
- Wybudzanie głosem pozostaje wyłączone w UX/czasie działania Androida.
- Dodatkowe rodziny poleceń Androida (dostępność zależy od urządzenia i uprawnień):
  - `device.status`, `device.info`, `device.permissions`, `device.health`
  - `notifications.list`, `notifications.actions` (zobacz [Przekazywanie powiadomień](#notification-forwarding) poniżej)
  - `photos.latest`
  - `contacts.search`, `contacts.add`
  - `calendar.events`, `calendar.add`
  - `callLog.search`
  - `sms.search`
  - `motion.activity`, `motion.pedometer`

## Punkty wejścia asystenta

Android obsługuje uruchamianie OpenClaw z systemowego wyzwalacza asystenta (Google
Assistant). Po skonfigurowaniu przytrzymanie przycisku ekranu głównego albo powiedzenie „Hey Google, ask
OpenClaw...” otwiera aplikację i przekazuje prompt do kompozytora czatu.

Wykorzystuje to metadane **App Actions** Androida zadeklarowane w manifeście aplikacji. Po stronie Gateway nie jest potrzebna
dodatkowa konfiguracja -- intencja asystenta jest
obsługiwana całkowicie przez aplikację Androida i przekazywana jako normalna wiadomość czatu.

<Note>
Dostępność App Actions zależy od urządzenia, wersji Google Play Services
oraz od tego, czy użytkownik ustawił OpenClaw jako domyślną aplikację asystenta.
</Note>

## Przekazywanie powiadomień

Android może przekazywać powiadomienia urządzenia do Gateway jako zdarzenia. Kilka kontrolek pozwala określić zakres przekazywanych powiadomień i czas przekazywania.

| Klucz                            | Typ            | Opis                                                                                              |
| -------------------------------- | -------------- | ------------------------------------------------------------------------------------------------- |
| `notifications.allowPackages`    | string[]       | Przekazuj tylko powiadomienia z tych nazw pakietów. Jeśli ustawione, wszystkie pozostałe pakiety są ignorowane. |
| `notifications.denyPackages`     | string[]       | Nigdy nie przekazuj powiadomień z tych nazw pakietów. Stosowane po `allowPackages`.               |
| `notifications.quietHours.start` | string (HH:mm) | Początek okna godzin ciszy (lokalny czas urządzenia). Powiadomienia są wyciszane w tym oknie.    |
| `notifications.quietHours.end`   | string (HH:mm) | Koniec okna godzin ciszy.                                                                         |
| `notifications.rateLimit`        | number         | Maksymalna liczba przekazywanych powiadomień na pakiet na minutę. Nadmiarowe powiadomienia są odrzucane. |

Selektor powiadomień używa także bezpieczniejszego zachowania dla przekazywanych zdarzeń powiadomień, zapobiegając przypadkowemu przekazywaniu poufnych powiadomień systemowych.

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
