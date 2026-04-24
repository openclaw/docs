---
read_when:
    - |-
      Pairing lub ponowne łączenie Node Android】【：】【“】【analysis to=final code>
      Aplikacja Android (Node): procedura połączenia + powierzchnia poleceń Connect/Chat/Voice/Canvas
    - Debugowanie wykrywania Gateway lub auth na Androidzie
    - Weryfikacja zgodności historii czatu między klientami
summary: 'Aplikacja Android (Node): procedura połączenia + powierzchnia poleceń Connect/Chat/Voice/Canvas'
title: Aplikacja Android
x-i18n:
    generated_at: "2026-04-24T09:20:17Z"
    model: gpt-5.4
    provider: openai
    source_hash: 31b538a5bf45e78fde34e77a31384295b3e96f2fff6b3adfe37e5c569d858472
    source_path: platforms/android.md
    workflow: 15
---

> **Uwaga:** Aplikacja Android nie została jeszcze publicznie wydana. Kod źródłowy jest dostępny w [repozytorium OpenClaw](https://github.com/openclaw/openclaw) w `apps/android`. Możesz zbudować ją samodzielnie przy użyciu Java 17 i Android SDK (`./gradlew :app:assemblePlayDebug`). Instrukcje budowania znajdziesz w [apps/android/README.md](https://github.com/openclaw/openclaw/blob/main/apps/android/README.md).

## Przegląd wsparcia

- Rola: aplikacja towarzysząca Node (Android nie hostuje Gateway).
- Gateway wymagany: tak (uruchom go na macOS, Linux lub Windows przez WSL2).
- Instalacja: [Pierwsze kroki](/pl/start/getting-started) + [Pairing](/pl/channels/pairing).
- Gateway: [Runbook](/pl/gateway) + [Konfiguracja](/pl/gateway/configuration).
  - Protokoły: [Protokół Gateway](/pl/gateway/protocol) (Node + control plane).

## Sterowanie systemem

Sterowanie systemem (launchd/systemd) znajduje się na hoście Gateway. Zobacz [Gateway](/pl/gateway).

## Procedura połączenia

Aplikacja Android Node ⇄ (mDNS/NSD + WebSocket) ⇄ **Gateway**

Android łączy się bezpośrednio z WebSocket Gateway i używa parowania urządzenia (`role: node`).

Dla hostów Tailscale lub publicznych Android wymaga bezpiecznego punktu końcowego:

- Preferowane: Tailscale Serve / Funnel z `https://<magicdns>` / `wss://<magicdns>`
- Obsługiwane jest też: dowolny inny URL Gateway `wss://` z prawdziwym punktem końcowym TLS
- Nieszyfrowane `ws://` pozostaje obsługiwane dla prywatnych adresów LAN / hostów `.local`, a także `localhost`, `127.0.0.1` i mostu emulatora Android (`10.0.2.2`)

### Wymagania wstępne

- Możesz uruchomić Gateway na maszynie „master”.
- Urządzenie/emulator Android może dotrzeć do WebSocket Gateway:
  - Ta sama sieć LAN z mDNS/NSD, **lub**
  - Ten sam tailnet Tailscale z Wide-Area Bonjour / unicast DNS-SD (zobacz poniżej), **lub**
  - Ręczne podanie hosta/portu gateway (awaryjnie)
- Parowanie mobilne przez tailnet/publiczne **nie** używa surowych punktów końcowych tailnet IP `ws://`. Zamiast tego użyj Tailscale Serve lub innego URL `wss://`.
- Możesz uruchomić CLI (`openclaw`) na maszynie gateway (lub przez SSH).

### 1) Uruchom Gateway

```bash
openclaw gateway --port 18789 --verbose
```

Potwierdź w logach, że widzisz coś takiego:

- `listening on ws://0.0.0.0:18789`

Dla zdalnego dostępu Android przez Tailscale preferuj Serve/Funnel zamiast surowego powiązania tailnet:

```bash
openclaw gateway --tailscale serve
```

Daje to Androidowi bezpieczny punkt końcowy `wss://` / `https://`. Zwykła konfiguracja `gateway.bind: "tailnet"` nie wystarcza do pierwszego zdalnego Pairing Android, chyba że osobno zakończysz TLS.

### 2) Zweryfikuj wykrywanie (opcjonalnie)

Z maszyny gateway:

```bash
dns-sd -B _openclaw-gw._tcp local.
```

Więcej uwag debugowania: [Bonjour](/pl/gateway/bonjour).

Jeśli skonfigurowałeś też domenę wykrywania wide-area, porównaj z:

```bash
openclaw gateway discover --json
```

To pokazuje `local.` oraz skonfigurowaną domenę wide-area w jednym przebiegu i używa rozwiązanego punktu końcowego usługi zamiast samych wskazówek TXT.

#### Wykrywanie tailnet (Wiedeń ⇄ Londyn) przez unicast DNS-SD

Wykrywanie Android NSD/mDNS nie przechodzi między sieciami. Jeśli Twój Android Node i gateway są w różnych sieciach, ale połączone przez Tailscale, użyj Wide-Area Bonjour / unicast DNS-SD.

Samo wykrywanie nie wystarcza do parowania Android przez tailnet/publicznie. Wykryta trasa nadal wymaga bezpiecznego punktu końcowego (`wss://` lub Tailscale Serve):

1. Skonfiguruj strefę DNS-SD (na przykład `openclaw.internal.`) na hoście gateway i opublikuj rekordy `_openclaw-gw._tcp`.
2. Skonfiguruj Tailscale split DNS dla wybranej domeny, wskazując na ten serwer DNS.

Szczegóły i przykładowa konfiguracja CoreDNS: [Bonjour](/pl/gateway/bonjour).

### 3) Połącz z Androida

W aplikacji Android:

- Aplikacja utrzymuje połączenie z gateway przy życiu przez **foreground service** (trwałe powiadomienie).
- Otwórz kartę **Connect**.
- Użyj trybu **Setup Code** lub **Manual**.
- Jeśli wykrywanie jest zablokowane, użyj ręcznego hosta/portu w **Advanced controls**. Dla prywatnych hostów LAN `ws://` nadal działa. Dla hostów Tailscale/publicznych włącz TLS i użyj punktu końcowego `wss://` / Tailscale Serve.

Po pierwszym udanym Pairing Android automatycznie łączy się ponownie przy uruchomieniu:

- ręczny punkt końcowy (jeśli włączony), w przeciwnym razie
- ostatnio wykryty gateway (best-effort).

### 4) Zatwierdź Pairing (CLI)

Na maszynie gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

Szczegóły Pairing: [Pairing](/pl/channels/pairing).

### 5) Zweryfikuj, że Node jest połączony

- Przez status Node:

  ```bash
  openclaw nodes status
  ```

- Przez Gateway:

  ```bash
  openclaw gateway call node.list --params "{}"
  ```

### 6) Chat + historia

Karta Chat na Androidzie obsługuje wybór sesji (domyślnie `main` oraz inne istniejące sesje):

- Historia: `chat.history` (znormalizowana do wyświetlania; inline tagi dyrektyw są
  usuwane z widocznego tekstu, usuwane są ładunki XML wywołań narzędzi w zwykłym tekście (w tym
  `<tool_call>...</tool_call>`, `<function_call>...</function_call>`,
  `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` oraz
  ucięte bloki wywołań narzędzi) i wyciekające tokeny sterujące modelu ASCII/full-width,
  czyste wiersze asystenta zawierające wyłącznie cichy token, takie jak dokładne `NO_REPLY` /
  `no_reply`, są pomijane, a zbyt duże wiersze mogą zostać zastąpione placeholderami)
- Wysyłanie: `chat.send`
- Aktualizacje push (best-effort): `chat.subscribe` → `event:"chat"`

### 7) Canvas + kamera

#### Gateway Canvas Host (zalecane dla treści web)

Jeśli chcesz, aby Node wyświetlał prawdziwe HTML/CSS/JS, które agent może edytować na dysku, skieruj Node na host canvas Gateway.

Uwaga: Node ładują canvas z serwera HTTP Gateway (ten sam port co `gateway.port`, domyślnie `18789`).

1. Utwórz `~/.openclaw/workspace/canvas/index.html` na hoście gateway.

2. Przejdź do niego na Node (LAN):

```bash
openclaw nodes invoke --node "<Android Node>" --command canvas.navigate --params '{"url":"http://<gateway-hostname>.local:18789/__openclaw__/canvas/"}'
```

Tailnet (opcjonalnie): jeśli oba urządzenia są w Tailscale, użyj nazwy MagicDNS lub tailnet IP zamiast `.local`, na przykład `http://<gateway-magicdns>:18789/__openclaw__/canvas/`.

Ten serwer wstrzykuje klienta live-reload do HTML i przeładowuje przy zmianach pliku.
Host A2UI znajduje się pod `http://<gateway-host>:18789/__openclaw__/a2ui/`.

Polecenia Canvas (tylko na pierwszym planie):

- `canvas.eval`, `canvas.snapshot`, `canvas.navigate` (użyj `{"url":""}` lub `{"url":"/"}`, aby wrócić do domyślnego scaffoldu). `canvas.snapshot` zwraca `{ format, base64 }` (domyślnie `format="jpeg"`).
- A2UI: `canvas.a2ui.push`, `canvas.a2ui.reset` (starszy alias `canvas.a2ui.pushJSONL`)

Polecenia kamery (tylko na pierwszym planie; zależne od uprawnień):

- `camera.snap` (jpg)
- `camera.clip` (mp4)

Parametry i helpery CLI znajdziesz w [Node Camera](/pl/nodes/camera).

### 8) Voice + rozszerzona powierzchnia poleceń Android

- Voice: Android używa pojedynczego przepływu włączania/wyłączania mikrofonu na karcie Voice z przechwytywaniem transkryptu i odtwarzaniem `talk.speak`. Lokalny system TTS jest używany tylko wtedy, gdy `talk.speak` jest niedostępne. Voice zatrzymuje się, gdy aplikacja schodzi z pierwszego planu.
- Przełączniki voice wake/talk-mode są obecnie usunięte z UX/runtime Androida.
- Dodatkowe rodziny poleceń Android (dostępność zależy od urządzenia + uprawnień):
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
Assistant). Gdy jest skonfigurowane, przytrzymanie przycisku home lub powiedzenie „Hey Google, ask
OpenClaw...” otwiera aplikację i przekazuje prompt do edytora czatu.

Używa to metadanych Android **App Actions** zadeklarowanych w manifeście aplikacji. Po stronie gateway nie jest potrzebna żadna dodatkowa konfiguracja — intencja asystenta jest obsługiwana całkowicie przez aplikację Android i przekazywana dalej jako zwykła wiadomość czatu.

<Note>
Dostępność App Actions zależy od urządzenia, wersji Google Play Services
oraz od tego, czy użytkownik ustawił OpenClaw jako domyślną aplikację asystenta.
</Note>

## Przekazywanie powiadomień

Android może przekazywać powiadomienia urządzenia do gateway jako zdarzenia. Kilka ustawień pozwala ograniczyć, które powiadomienia są przekazywane i kiedy.

| Klucz                            | Typ            | Opis                                                                                           |
| -------------------------------- | -------------- | ---------------------------------------------------------------------------------------------- |
| `notifications.allowPackages`    | string[]       | Przekazuj tylko powiadomienia z tych nazw pakietów. Jeśli ustawione, wszystkie inne pakiety są ignorowane. |
| `notifications.denyPackages`     | string[]       | Nigdy nie przekazuj powiadomień z tych nazw pakietów. Stosowane po `allowPackages`.            |
| `notifications.quietHours.start` | string (HH:mm) | Początek okna godzin ciszy (lokalny czas urządzenia). Powiadomienia są tłumione w tym oknie.  |
| `notifications.quietHours.end`   | string (HH:mm) | Koniec okna godzin ciszy.                                                                      |
| `notifications.rateLimit`        | number         | Maksymalna liczba przekazywanych powiadomień na pakiet na minutę. Nadmiarowe powiadomienia są odrzucane. |

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
- [Node](/pl/nodes)
- [Rozwiązywanie problemów z Node Android](/pl/nodes/troubleshooting)
