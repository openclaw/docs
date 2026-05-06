---
read_when:
    - Parowanie lub ponowne łączenie węzła Androida
    - Debugowanie wykrywania lub uwierzytelniania Gateway na Androidzie
    - Weryfikowanie zgodności historii czatu między klientami
summary: 'Aplikacja Android (węzeł): runbook połączeń + powierzchnia poleceń Połącz/Czat/Głos/Kanwa'
title: Aplikacja na Androida
x-i18n:
    generated_at: "2026-05-06T09:20:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: cce53df4675e01858ced3d58142512ad096ced0ef50cd617e57b65f9cf911c05
    source_path: platforms/android.md
    workflow: 16
---

<Note>
Aplikacja Android nie została jeszcze publicznie wydana. Kod źródłowy jest dostępny w [repozytorium OpenClaw](https://github.com/openclaw/openclaw) w `apps/android`. Możesz zbudować ją samodzielnie przy użyciu Java 17 i Android SDK (`./gradlew :app:assemblePlayDebug`). Instrukcje budowania znajdziesz w [apps/android/README.md](https://github.com/openclaw/openclaw/blob/main/apps/android/README.md).
</Note>

## Migawka wsparcia

- Rola: aplikacja węzła towarzyszącego (Android nie hostuje Gateway).
- Wymagany Gateway: tak (uruchom go na macOS, Linux albo Windows przez WSL2).
- Instalacja: [Pierwsze kroki](/pl/start/getting-started) + [Parowanie](/pl/channels/pairing).
- Gateway: [Runbook](/pl/gateway) + [Konfiguracja](/pl/gateway/configuration).
  - Protokoły: [Protokół Gateway](/pl/gateway/protocol) (węzły + płaszczyzna sterowania).

## Sterowanie systemowe

Sterowanie systemowe (launchd/systemd) znajduje się na hoście Gateway. Zobacz [Gateway](/pl/gateway).

## Runbook połączenia

Aplikacja węzła Android ⇄ (mDNS/NSD + WebSocket) ⇄ **Gateway**

Android łączy się bezpośrednio z WebSocket Gateway i używa parowania urządzenia (`role: node`).

W przypadku Tailscale lub hostów publicznych Android wymaga bezpiecznego punktu końcowego:

- Preferowane: Tailscale Serve / Funnel z `https://<magicdns>` / `wss://<magicdns>`
- Obsługiwane także: dowolny inny URL Gateway `wss://` z prawdziwym punktem końcowym TLS
- Nieszyfrowane `ws://` pozostaje obsługiwane dla prywatnych adresów LAN / hostów `.local`, a także `localhost`, `127.0.0.1` oraz mostu emulatora Android (`10.0.2.2`)

### Wymagania wstępne

- Możesz uruchomić Gateway na maszynie „głównej”.
- Urządzenie/emulator Android może dosięgnąć WebSocket gateway:
  - Ta sama sieć LAN z mDNS/NSD, **albo**
  - Ten sam tailnet Tailscale z użyciem Wide-Area Bonjour / unicast DNS-SD (zobacz niżej), **albo**
  - Ręczny host/port gateway (awaryjnie)
- Parowanie mobilne przez tailnet/publiczne nie używa surowych punktów końcowych IP tailnet `ws://`. Zamiast tego użyj Tailscale Serve albo innego URL `wss://`.
- Możesz uruchomić CLI (`openclaw`) na maszynie gateway (albo przez SSH).

### 1) Uruchom Gateway

```bash
openclaw gateway --port 18789 --verbose
```

Potwierdź w logach, że widzisz coś podobnego do:

- `listening on ws://0.0.0.0:18789`

Do zdalnego dostępu Android przez Tailscale preferuj Serve/Funnel zamiast surowego bindowania tailnet:

```bash
openclaw gateway --tailscale serve
```

Daje to Android bezpieczny punkt końcowy `wss://` / `https://`. Zwykła konfiguracja `gateway.bind: "tailnet"` nie wystarczy do pierwszego zdalnego parowania Android, chyba że osobno terminujesz także TLS.

### 2) Zweryfikuj wykrywanie (opcjonalnie)

Z maszyny gateway:

```bash
dns-sd -B _openclaw-gw._tcp local.
```

Więcej notatek diagnostycznych: [Bonjour](/pl/gateway/bonjour).

Jeśli skonfigurowano także domenę wykrywania rozległego, porównaj z:

```bash
openclaw gateway discover --json
```

Pokazuje to `local.` oraz skonfigurowaną domenę rozległą w jednym przebiegu i używa rozwiązanego
punktu końcowego usługi zamiast wskazówek wyłącznie z TXT.

#### Wykrywanie tailnet (Wiedeń ⇄ Londyn) przez unicast DNS-SD

Wykrywanie Android NSD/mDNS nie przejdzie między sieciami. Jeśli węzeł Android i gateway są w różnych sieciach, ale połączone przez Tailscale, użyj zamiast tego Wide-Area Bonjour / unicast DNS-SD.

Samo wykrywanie nie wystarcza do parowania Android przez tailnet/publiczne. Wykryta trasa nadal potrzebuje bezpiecznego punktu końcowego (`wss://` albo Tailscale Serve):

1. Skonfiguruj strefę DNS-SD (przykład `openclaw.internal.`) na hoście gateway i opublikuj rekordy `_openclaw-gw._tcp`.
2. Skonfiguruj Tailscale split DNS dla wybranej domeny, wskazując ten serwer DNS.

Szczegóły i przykładowa konfiguracja CoreDNS: [Bonjour](/pl/gateway/bonjour).

### 3) Połącz z Android

W aplikacji Android:

- Aplikacja utrzymuje połączenie z gateway przy życiu za pomocą **usługi pierwszoplanowej** (trwałe powiadomienie).
- Otwórz kartę **Połącz**.
- Użyj trybu **Kod konfiguracji** albo **Ręczny**.
- Jeśli wykrywanie jest zablokowane, użyj ręcznego hosta/portu w **Zaawansowanych kontrolkach**. Dla prywatnych hostów LAN `ws://` nadal działa. Dla hostów Tailscale/publicznych włącz TLS i użyj punktu końcowego `wss://` / Tailscale Serve.

Po pierwszym udanym parowaniu Android automatycznie łączy się ponownie przy uruchomieniu:

- Ręczny punkt końcowy (jeśli włączony), w przeciwnym razie
- Ostatnio wykryty gateway (najlepszym staraniem).

### Sygnały obecności alive

Po połączeniu uwierzytelnionej sesji węzła oraz gdy aplikacja przechodzi do tła, podczas gdy
usługa pierwszoplanowa nadal jest połączona, Android wywołuje `node.event` z
`event: "node.presence.alive"`. Gateway zapisuje to jako `lastSeenAtMs`/`lastSeenReason` w
metadanych sparowanego węzła/urządzenia dopiero po poznaniu tożsamości uwierzytelnionego urządzenia węzła.

Aplikacja uznaje sygnał za pomyślnie zapisany tylko wtedy, gdy odpowiedź gateway zawiera
`handled: true`. Starsze gateway mogą potwierdzać `node.event` przez `{ "ok": true }`; ta odpowiedź jest
zgodna, ale nie liczy się jako trwała aktualizacja ostatniej aktywności.

### 4) Zatwierdź parowanie (CLI)

Na maszynie gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

Szczegóły parowania: [Parowanie](/pl/channels/pairing).

Opcjonalnie: jeśli węzeł Android zawsze łączy się z ściśle kontrolowanej podsieci,
możesz włączyć automatyczne zatwierdzanie węzła przy pierwszym połączeniu z jawnymi CIDR-ami lub dokładnymi adresami IP:

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

Karta Czat w Android obsługuje wybór sesji (domyślnie `main`, plus inne istniejące sesje):

- Historia: `chat.history` (znormalizowana do wyświetlania; wbudowane tagi dyrektyw są
  usuwane z widocznego tekstu, tekstowe ładunki XML wywołań narzędzi (w tym
  `<tool_call>...</tool_call>`, `<function_call>...</function_call>`,
  `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` oraz
  obcięte bloki wywołań narzędzi) i ujawnione tokeny sterujące modelu ASCII/pełnej szerokości
  są usuwane, czyste wiersze asystenta z cichymi tokenami, takie jak dokładne `NO_REPLY` /
  `no_reply`, są pomijane, a nadmiernie duże wiersze mogą zostać zastąpione placeholderami)
- Wysyłanie: `chat.send`
- Aktualizacje push (najlepszym staraniem): `chat.subscribe` → `event:"chat"`

### 7) Canvas + kamera

#### Host Canvas Gateway (zalecany dla treści webowych)

Jeśli chcesz, aby węzeł pokazywał prawdziwe HTML/CSS/JS, które agent może edytować na dysku, skieruj węzeł na host Canvas Gateway.

<Note>
Węzły ładują Canvas z serwera HTTP Gateway (ten sam port co `gateway.port`, domyślnie `18789`).
</Note>

1. Utwórz `~/.openclaw/workspace/canvas/index.html` na hoście gateway.

2. Przejdź w węźle do niego (LAN):

```bash
openclaw nodes invoke --node "<Android Node>" --command canvas.navigate --params '{"url":"http://<gateway-hostname>.local:18789/__openclaw__/canvas/"}'
```

Tailnet (opcjonalnie): jeśli oba urządzenia są w Tailscale, użyj nazwy MagicDNS albo adresu IP tailnet zamiast `.local`, np. `http://<gateway-magicdns>:18789/__openclaw__/canvas/`.

Ten serwer wstrzykuje klienta live-reload do HTML i przeładowuje przy zmianach plików.
Host A2UI znajduje się pod `http://<gateway-host>:18789/__openclaw__/a2ui/`.

Polecenia Canvas (tylko na pierwszym planie):

- `canvas.eval`, `canvas.snapshot`, `canvas.navigate` (użyj `{"url":""}` albo `{"url":"/"}`, aby wrócić do domyślnego szkieletu). `canvas.snapshot` zwraca `{ format, base64 }` (domyślnie `format="jpeg"`).
- A2UI: `canvas.a2ui.push`, `canvas.a2ui.reset` (`canvas.a2ui.pushJSONL` starszy alias)

Polecenia kamery (tylko na pierwszym planie; chronione uprawnieniami):

- `camera.snap` (jpg)
- `camera.clip` (mp4)

Parametry i pomocnicze polecenia CLI znajdziesz w [Węzeł kamery](/pl/nodes/camera).

### 8) Głos + rozszerzona powierzchnia poleceń Android

- Karta Głos: Android ma dwa jawne tryby przechwytywania. **Mikrofon** to ręczna sesja karty Głos, która wysyła każdą pauzę jako turę czatu i zatrzymuje się, gdy aplikacja opuszcza pierwszy plan albo użytkownik opuszcza kartę Głos. **Rozmowa** to ciągły tryb rozmowy, który słucha do czasu wyłączenia przełącznikiem albo rozłączenia węzła.
- Tryb rozmowy promuje istniejącą usługę pierwszoplanową z `dataSync` do `dataSync|microphone` przed rozpoczęciem przechwytywania, a potem degraduje ją po zatrzymaniu trybu rozmowy. Android 14+ wymaga deklaracji `FOREGROUND_SERVICE_MICROPHONE`, uprawnienia runtime `RECORD_AUDIO` oraz typu usługi mikrofonu w czasie działania.
- Wypowiadane odpowiedzi używają `talk.speak` przez skonfigurowanego dostawcę rozmowy gateway. Lokalny systemowy TTS jest używany tylko wtedy, gdy `talk.speak` jest niedostępne.
- Wybudzanie głosem pozostaje wyłączone w UX/runtime Android.
- Dodatkowe rodziny poleceń Android (dostępność zależy od urządzenia + uprawnień):
  - `device.status`, `device.info`, `device.permissions`, `device.health`
  - `notifications.list`, `notifications.actions` (zobacz [Przekazywanie powiadomień](#notification-forwarding) niżej)
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

Wykorzystuje to metadane Android **App Actions** zadeklarowane w manifeście aplikacji. Po stronie gateway nie jest potrzebna
dodatkowa konfiguracja -- intent asystenta jest
obsługiwany w całości przez aplikację Android i przekazywany jako zwykła wiadomość czatu.

<Note>
Dostępność App Actions zależy od urządzenia, wersji Google Play Services
oraz tego, czy użytkownik ustawił OpenClaw jako domyślną aplikację asystenta.
</Note>

## Przekazywanie powiadomień

Android może przekazywać powiadomienia urządzenia do gateway jako zdarzenia. Kilka kontrolek pozwala określić, które powiadomienia są przekazywane i kiedy.

| Klucz                            | Typ            | Opis                                                                                              |
| -------------------------------- | -------------- | ------------------------------------------------------------------------------------------------- |
| `notifications.allowPackages`    | string[]       | Przekazuj tylko powiadomienia z tych nazw pakietów. Jeśli ustawione, wszystkie inne pakiety są ignorowane. |
| `notifications.denyPackages`     | string[]       | Nigdy nie przekazuj powiadomień z tych nazw pakietów. Stosowane po `allowPackages`.               |
| `notifications.quietHours.start` | string (HH:mm) | Początek okna godzin ciszy (lokalny czas urządzenia). Powiadomienia są wyciszane w tym oknie.    |
| `notifications.quietHours.end`   | string (HH:mm) | Koniec okna godzin ciszy.                                                                         |
| `notifications.rateLimit`        | number         | Maksymalna liczba przekazanych powiadomień na pakiet na minutę. Nadmiarowe powiadomienia są odrzucane. |

Selektor powiadomień używa także bezpieczniejszego zachowania dla przekazywanych zdarzeń powiadomień, zapobiegając przypadkowemu przekazywaniu wrażliwych powiadomień systemowych.

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
