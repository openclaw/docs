---
read_when:
    - Parujesz lub ponownie łączysz węzeł Android
    - Debugujesz wykrywanie gateway lub auth na Androidzie
    - Weryfikujesz zgodność historii czatu między klientami
summary: 'Aplikacja Android (węzeł): instrukcja połączenia + powierzchnia poleceń Connect/Chat/Voice/Canvas'
title: Aplikacja Android
x-i18n:
    generated_at: "2026-04-05T13:59:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2223891afc3aa34af4aaf5410b4f1c6aebcf24bab68a6c47dd9832882d5260db
    source_path: platforms/android.md
    workflow: 15
---

# Aplikacja Android (węzeł)

> **Uwaga:** aplikacja Android nie została jeszcze publicznie wydana. Kod źródłowy jest dostępny w [repozytorium OpenClaw](https://github.com/openclaw/openclaw) w `apps/android`. Możesz zbudować ją samodzielnie przy użyciu Java 17 i Android SDK (`./gradlew :app:assemblePlayDebug`). Instrukcje kompilacji znajdziesz w [apps/android/README.md](https://github.com/openclaw/openclaw/blob/main/apps/android/README.md).

## Stan wsparcia

- Rola: aplikacja towarzysząca węzła (Android nie hostuje Gateway).
- Gateway wymagany: tak (uruchom go na macOS, Linux lub Windows przez WSL2).
- Instalacja: [Pierwsze kroki](/start/getting-started) + [Parowanie](/pl/channels/pairing).
- Gateway: [Instrukcja operacyjna](/gateway) + [Configuration](/gateway/configuration).
  - Protokoły: [Protokół Gateway](/gateway/protocol) (węzły + control plane).

## Sterowanie systemem

Sterowanie systemem (launchd/systemd) znajduje się na hoście Gateway. Zobacz [Gateway](/gateway).

## Instrukcja połączenia

Aplikacja węzła Android ⇄ (mDNS/NSD + WebSocket) ⇄ **Gateway**

Android łączy się bezpośrednio z Gateway WebSocket i używa parowania urządzeń (`role: node`).

W przypadku Tailscale lub hostów publicznych Android wymaga bezpiecznego endpointu:

- Preferowane: Tailscale Serve / Funnel z `https://<magicdns>` / `wss://<magicdns>`
- Obsługiwane są także: dowolne inne adresy URL Gateway `wss://` z prawdziwym endpointem TLS
- Nieszyfrowane `ws://` pozostaje obsługiwane dla prywatnych adresów LAN / hostów `.local`, a także `localhost`, `127.0.0.1` i mostu emulatora Android (`10.0.2.2`)

### Wymagania wstępne

- Możesz uruchomić Gateway na „głównej” maszynie.
- Urządzenie/emulator Android może połączyć się z gateway WebSocket:
  - w tej samej sieci LAN z mDNS/NSD, **lub**
  - w tej samej sieci Tailscale przy użyciu Wide-Area Bonjour / unicast DNS-SD (zobacz poniżej), **lub**
  - ręcznie przez host/port gateway (fallback)
- Parowanie mobilne przez tailnet/publiczne **nie** używa surowych endpointów tailnet IP `ws://`. Zamiast tego użyj Tailscale Serve lub innego adresu `wss://`.
- Możesz uruchomić CLI (`openclaw`) na maszynie gateway (lub przez SSH).

### 1) Uruchom Gateway

```bash
openclaw gateway --port 18789 --verbose
```

Potwierdź w logach, że widzisz coś w rodzaju:

- `listening on ws://0.0.0.0:18789`

Dla zdalnego dostępu Android przez Tailscale preferuj Serve/Funnel zamiast surowego bindowania tailnet:

```bash
openclaw gateway --tailscale serve
```

Zapewnia to Androidowi bezpieczny endpoint `wss://` / `https://`. Sama konfiguracja `gateway.bind: "tailnet"` nie wystarcza do pierwszego zdalnego parowania Androida, chyba że osobno zakończysz TLS.

### 2) Zweryfikuj wykrywanie (opcjonalnie)

Na maszynie gateway:

```bash
dns-sd -B _openclaw-gw._tcp local.
```

Więcej uwag do debugowania: [Bonjour](/gateway/bonjour).

Jeśli skonfigurowano też domenę wykrywania wide-area, porównaj z:

```bash
openclaw gateway discover --json
```

Pokazuje to `local.` oraz skonfigurowaną domenę wide-area w jednym przebiegu i używa rozwiązanego
endpointu usługi zamiast wskazówek tylko z TXT.

#### Wykrywanie tailnet (Wiedeń ⇄ Londyn) przez unicast DNS-SD

Wykrywanie Android NSD/mDNS nie przechodzi między sieciami. Jeśli węzeł Android i gateway są w różnych sieciach, ale połączone przez Tailscale, użyj Wide-Area Bonjour / unicast DNS-SD.

Samo wykrycie nie wystarcza do parowania Androida przez tailnet/publicznie. Wykryta trasa nadal potrzebuje bezpiecznego endpointu (`wss://` lub Tailscale Serve):

1. Skonfiguruj strefę DNS-SD (na przykład `openclaw.internal.`) na hoście gateway i opublikuj rekordy `_openclaw-gw._tcp`.
2. Skonfiguruj Tailscale split DNS dla wybranej domeny, wskazując na ten serwer DNS.

Szczegóły i przykładowa konfiguracja CoreDNS: [Bonjour](/gateway/bonjour).

### 3) Połącz z Androida

W aplikacji Android:

- Aplikacja utrzymuje połączenie z gateway przez **foreground service** (trwałe powiadomienie).
- Otwórz kartę **Connect**.
- Użyj trybu **Setup Code** albo **Manual**.
- Jeśli wykrywanie jest zablokowane, użyj ręcznego hosta/portu w **Advanced controls**. Dla prywatnych hostów LAN nadal działa `ws://`. Dla hostów Tailscale/publicznych włącz TLS i użyj endpointu `wss://` / Tailscale Serve.

Po pierwszym udanym parowaniu Android automatycznie łączy się ponownie przy uruchomieniu:

- ręczny endpoint (jeśli włączony), w przeciwnym razie
- ostatnio wykryty gateway (best-effort).

### 4) Zatwierdź parowanie (CLI)

Na maszynie gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

Szczegóły parowania: [Parowanie](/pl/channels/pairing).

### 5) Sprawdź, czy węzeł jest połączony

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

- Historia: `chat.history` (znormalizowana do wyświetlania; wbudowane tagi dyrektyw są
  usuwane z widocznego tekstu, payloady XML wywołań narzędzi w czystym tekście (w tym
  `<tool_call>...</tool_call>`, `<function_call>...</function_call>`,
  `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` oraz
  ucięte bloki wywołań narzędzi) i wyciekłe znaczniki kontrolne modeli ASCII/full-width
  są usuwane, czyste wiersze odpowiedzi asystenta zawierające tylko ciche tokeny, takie jak dokładne `NO_REPLY` /
  `no_reply`, są pomijane, a zbyt duże wiersze mogą zostać zastąpione placeholderami)
- Wysyłanie: `chat.send`
- Aktualizacje push (best-effort): `chat.subscribe` → `event:"chat"`

### 7) Canvas + kamera

#### Gateway Canvas Host (zalecane dla treści webowych)

Jeśli chcesz, aby węzeł wyświetlał prawdziwe HTML/CSS/JS, które agent może edytować na dysku, skieruj węzeł na Gateway canvas host.

Uwaga: węzły ładują canvas z serwera HTTP Gateway (ten sam port co `gateway.port`, domyślnie `18789`).

1. Utwórz `~/.openclaw/workspace/canvas/index.html` na hoście gateway.

2. Przejdź do niego na węźle (LAN):

```bash
openclaw nodes invoke --node "<Android Node>" --command canvas.navigate --params '{"url":"http://<gateway-hostname>.local:18789/__openclaw__/canvas/"}'
```

Tailnet (opcjonalnie): jeśli oba urządzenia są w Tailscale, użyj nazwy MagicDNS lub adresu IP tailnet zamiast `.local`, np. `http://<gateway-magicdns>:18789/__openclaw__/canvas/`.

Ten serwer wstrzykuje klienta live-reload do HTML i przeładowuje przy zmianach plików.
Host A2UI znajduje się pod adresem `http://<gateway-host>:18789/__openclaw__/a2ui/`.

Polecenia canvas (tylko na pierwszym planie):

- `canvas.eval`, `canvas.snapshot`, `canvas.navigate` (użyj `{"url":""}` lub `{"url":"/"}`, aby wrócić do domyślnego scaffold). `canvas.snapshot` zwraca `{ format, base64 }` (domyślnie `format="jpeg"`).
- A2UI: `canvas.a2ui.push`, `canvas.a2ui.reset` (`canvas.a2ui.pushJSONL` to starszy alias)

Polecenia kamery (tylko na pierwszym planie; sterowane uprawnieniami):

- `camera.snap` (jpg)
- `camera.clip` (mp4)

Parametry i pomocniki CLI znajdziesz w [Węzeł kamery](/nodes/camera).

### 8) Voice + rozszerzona powierzchnia poleceń Androida

- Voice: Android używa pojedynczego przepływu włącz/wyłącz mikrofon na karcie Voice z przechwytywaniem transkryptu i odtwarzaniem `talk.speak`. Lokalny systemowy TTS jest używany tylko wtedy, gdy `talk.speak` jest niedostępne. Voice zatrzymuje się, gdy aplikacja opuszcza pierwszy plan.
- Przełączniki voice wake/talk-mode są obecnie usunięte z UX/runtime Androida.
- Dodatkowe rodziny poleceń Androida (dostępność zależy od urządzenia + uprawnień):
  - `device.status`, `device.info`, `device.permissions`, `device.health`
  - `notifications.list`, `notifications.actions` (zobacz [Przekazywanie powiadomień](#przekazywanie-powiadomień) poniżej)
  - `photos.latest`
  - `contacts.search`, `contacts.add`
  - `calendar.events`, `calendar.add`
  - `callLog.search`
  - `sms.search`
  - `motion.activity`, `motion.pedometer`

## Punkty wejścia asystenta

Android obsługuje uruchamianie OpenClaw przez systemowy wyzwalacz asystenta (Google
Assistant). Po skonfigurowaniu przytrzymanie przycisku home lub wypowiedzenie „Hey Google, ask
OpenClaw...” otwiera aplikację i przekazuje prompt do pola tworzenia czatu.

Wykorzystuje to metadane Android **App Actions** zadeklarowane w manifeście aplikacji. Po stronie gateway nie jest wymagana żadna dodatkowa konfiguracja — intent asystenta jest obsługiwany całkowicie przez aplikację Android i przekazywany dalej jako zwykła wiadomość czatu.

<Note>
Dostępność App Actions zależy od urządzenia, wersji Google Play Services
oraz od tego, czy użytkownik ustawił OpenClaw jako domyślną aplikację asystenta.
</Note>

## Przekazywanie powiadomień

Android może przekazywać powiadomienia urządzenia do gateway jako zdarzenia. Kilka kontrolek pozwala ograniczyć zakres przekazywanych powiadomień i określić, kiedy mają być przekazywane.

| Klucz                            | Typ            | Opis                                                                                              |
| -------------------------------- | -------------- | ------------------------------------------------------------------------------------------------- |
| `notifications.allowPackages`    | string[]       | Przekazuj powiadomienia tylko z tych nazw pakietów. Jeśli ustawione, wszystkie inne pakiety są ignorowane. |
| `notifications.denyPackages`     | string[]       | Nigdy nie przekazuj powiadomień z tych nazw pakietów. Stosowane po `allowPackages`.              |
| `notifications.quietHours.start` | string (HH:mm) | Początek okna cichych godzin (lokalny czas urządzenia). W tym oknie powiadomienia są wyciszane. |
| `notifications.quietHours.end`   | string (HH:mm) | Koniec okna cichych godzin.                                                                       |
| `notifications.rateLimit`        | number         | Maksymalna liczba przekazywanych powiadomień na pakiet na minutę. Nadmiarowe powiadomienia są odrzucane. |

Selektor powiadomień używa również bezpieczniejszego zachowania dla przekazywanych zdarzeń powiadomień, zapobiegając przypadkowemu przekazywaniu wrażliwych powiadomień systemowych.

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
