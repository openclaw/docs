---
read_when:
    - Parowanie lub ponowne łączenie Node’a z systemem Android
    - Debugowanie wykrywania Gateway lub uwierzytelniania w Androidzie
    - Klonowanie obrazu lub sterowanie urządzeniem z Androidem ze zdalnego komputera Mac
    - Weryfikowanie zgodności historii czatu między klientami
summary: 'Aplikacja na Androida (Node): procedura operacyjna połączenia + zestaw poleceń Connect/Chat/Voice/Canvas'
title: Aplikacja na Androida
x-i18n:
    generated_at: "2026-07-16T18:43:15Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 8ac11a1d0eb0c601048843ec80c9c76a4ebf76f2c80680ae2a43cb84fc6ec263
    source_path: platforms/android.md
    workflow: 16
---

<Note>
Oficjalna aplikacja na Androida jest dostępna w [Google Play](https://play.google.com/store/apps/details?id=ai.openclaw.app&hl=en_IN) oraz jako podpisany, samodzielny pakiet APK w obsługiwanych [wydaniach GitHub](https://github.com/openclaw/openclaw/releases). Jest to Node towarzyszący i wymaga działającego Gateway OpenClaw. Kod źródłowy: [apps/android](https://github.com/openclaw/openclaw/tree/main/apps/android) ([instrukcje kompilacji](https://github.com/openclaw/openclaw/blob/main/apps/android/README.md)).
</Note>

## Przegląd obsługi

- Rola: aplikacja Node towarzyszącego (Android nie hostuje Gateway).
- Wymagany Gateway: tak (należy go uruchomić w systemie macOS, Linux lub Windows za pośrednictwem WSL2).
- Instalacja: [Google Play](https://play.google.com/store/apps/details?id=ai.openclaw.app&hl=en_IN) lub `OpenClaw-Android.apk` z obsługiwanego [wydania GitHub](https://github.com/openclaw/openclaw/releases), [Pierwsze kroki](/pl/start/getting-started) dla Gateway, a następnie [Parowanie](/pl/channels/pairing).
- Gateway: [Podręcznik operacyjny](/pl/gateway) + [Konfiguracja](/pl/gateway/configuration).
  - Protokoły: [protokół Gateway](/pl/gateway/protocol) (węzły + płaszczyzna sterowania).

Sterowanie systemowe (launchd/systemd) odbywa się na hoście Gateway — zobacz [Gateway](/pl/gateway).

## Instalacja spoza Google Play

Zwykłe wydania końcowe i poprawkowe GitHub zawierają uniwersalne `OpenClaw-Android.apk` oraz `OpenClaw-Android-SHA256SUMS.txt`. Pakiet APK jest kompilowany z tagu wydania, podpisywany kluczem wydania OpenClaw dla Androida i zawiera poświadczenie pochodzenia z GitHub Actions.

Należy wybrać [wydanie](https://github.com/openclaw/openclaw/releases), które zawiera oba zasoby, a następnie pobrać i zweryfikować dokładnie ten tag przed instalacją zewnętrzną:

```bash
release_tag=vYYYY.M.PATCH
gh release download "$release_tag" \
  --repo openclaw/openclaw \
  --pattern OpenClaw-Android.apk \
  --pattern OpenClaw-Android-SHA256SUMS.txt
sha256sum --check OpenClaw-Android-SHA256SUMS.txt
gh attestation verify OpenClaw-Android.apk \
  --repo openclaw/openclaw \
  --signer-workflow openclaw/openclaw/.github/workflows/android-release.yml \
  --source-ref "refs/tags/${release_tag}" \
  --deny-self-hosted-runners
```

<Warning>
Instalacje z Google Play i samodzielnego pakietu APK korzystają z różnych kanałów aktualizacji i mogą mieć różne tożsamości podpisu. Przed zmianą kanału Android może wymagać odinstalowania istniejącej aplikacji, co usuwa jej lokalne dane. W przypadku zwykłych aktualizacji należy pozostać przy jednym kanale.
</Warning>

## Klonowanie ekranu i sterowanie Androidem ze zdalnego komputera Mac

[scrcpy](https://github.com/Genymobile/scrcpy) klonuje ekran Androida w oknie systemu macOS i
przekazuje dane wejściowe klawiatury oraz wskaźnika za pośrednictwem Android Debug Bridge (ADB). Jest to przepływ pracy
po stronie operatora, niezależny od połączenia Node OpenClaw. Jest przydatny, gdy urządzenie z Androidem i
komputer Mac znajdują się w różnych lokalizacjach, ale współdzielą prywatną sieć Tailscale.

### Przed rozpoczęciem

- Zainstaluj Tailscale na urządzeniu z Androidem i komputerze Mac, a następnie połącz oba urządzenia z tym samym tailnetem.
- W systemie Android włącz **Developer options** i **USB debugging**. W systemie Android 16 opcja **Wireless
  debugging** znajduje się w **Settings > System > Developer options**. Zobacz [opcje programistyczne
  Androida](https://developer.android.com/studio/debug/dev-options).
- Zainstaluj scrcpy i ADB na komputerze Mac:

  ```bash
  brew install scrcpy
  brew install --cask android-platform-tools
  ```

- Urządzenie z Androidem musi być dostępne podczas pierwszego połączenia. Android musi zatwierdzić klucz ADB
  każdego komputera Mac, zanim będzie on mógł sterować urządzeniem.

### Włączanie ADB przez TCP

Podczas konfiguracji początkowej podłącz urządzenie z Androidem przez USB do zaufanego komputera i zatwierdź
monit debugowania. Następnie uruchom:

```bash
adb devices
adb tcpip 5555
```

Teraz można odłączyć przewód USB. Jeśli po ponownym uruchomieniu urządzenia lub zresetowaniu debugowania port 5555
przestanie nasłuchiwać, powtórz ten lokalny krok konfiguracji. Android 11 i nowsze wersje mogą również ustanowić początkowe zaufanie za pomocą
**Wireless debugging > Pair device with pairing code** oraz `adb pair`.

### Zezwalanie tylko komputerowi Mac pełniącemu rolę kontrolera

Tailnety z restrykcyjnymi uprawnieniami muszą jawnie zezwolić komputerowi Mac pełniącemu rolę kontrolera na dostęp do portu TCP 5555
urządzenia z Androidem. Dodaj precyzyjną regułę do zasad tailnetu, zastępując przykładowe adresy
stabilnymi adresami IP Tailscale obu urządzeń:

```json5
{
  grants: [
    {
      src: ["<remote-mac-tailnet-ip>"],
      dst: ["<android-tailnet-ip>"],
      ip: ["tcp:5555"],
    },
  ],
}
```

Informacje o aliasach hostów i innych selektorach zawiera dokumentacja [uprawnień Tailscale](https://tailscale.com/docs/reference/syntax/grants).
Nie zezwalaj na dostęp do tego portu z publicznego Internetu ani nie udostępniaj go za pomocą Funnel: autoryzowany klient ADB
ma szerokie uprawnienia do sterowania urządzeniem.

### Nawiązywanie połączenia i rozpoczynanie klonowania ekranu

Na zdalnym komputerze Mac:

```bash
adb connect <android-tailnet-ip>:5555
adb devices
scrcpy --serial <android-tailnet-ip>:5555
```

Pierwsze `adb connect` z tego komputera Mac wyświetla okno autoryzacji w systemie Android. Odblokuj urządzenie,
potwierdź odcisk palca klucza i wybierz **Always allow from this computer** tylko wtedy, gdy komputer Mac jest
zaufany. Prawidłowy wpis `adb devices` kończy się ciągiem `device`; `unauthorized` oznacza, że monit
na urządzeniu nie został zatwierdzony.

Po otwarciu okna scrcpy można używać go bezpośrednio albo wskazać je narzędziu do automatyzacji ekranu w systemie macOS, takiemu
jak [Peekaboo](https://peekaboo.sh/). scrcpy przesyła obraz i dane wejściowe; Tailscale zapewnia wyłącznie
prywatną ścieżkę sieciową.

### Rozwiązywanie problemów

- `Connection timed out`: sprawdź uprawnienie tailnetu dla portu TCP 5555. Pomyślne `tailscale ping` potwierdza
  osiągalność urządzenia równorzędnego, a nie to, że zasady zezwalają na dostęp do tego portu TCP. Przetestuj za pomocą
  `nc -vz <android-tailnet-ip> 5555` na komputerze Mac.
- `unauthorized`: odblokuj Androida i zatwierdź klucz ADB zdalnego komputera Mac albo usuń nieaktualną stację roboczą
  w **Wireless debugging > Paired devices** i sparuj ją ponownie.
- `Connection refused`: ponownie nawiąż połączenie lokalne i jeszcze raz uruchom `adb tcpip 5555`.
- Na liście znajduje się więcej niż jedno urządzenie: zachowaj jawny argument `--serial <android-tailnet-ip>:5555`.

Po zakończeniu zamknij scrcpy i rozłącz ADB:

```bash
adb disconnect <android-tailnet-ip>:5555
```

## Procedura nawiązywania połączenia

Aplikacja Node na Androida ⇄ (mDNS/NSD + WebSocket) ⇄ **Gateway**

Android łączy się bezpośrednio z WebSocket Gateway i korzysta z parowania urządzeń (`role: node`).

W przypadku hostów Tailscale lub publicznych Android wymaga bezpiecznego punktu końcowego:

- Preferowane: Tailscale Serve / Funnel z `https://<magicdns>` / `wss://<magicdns>`
- Obsługiwane również: dowolny inny adres URL Gateway `wss://` z rzeczywistym punktem końcowym TLS
- Nieszyfrowane `ws://` pozostaje obsługiwane dla adresów w prywatnej sieci LAN / hostów `.local`, a także `localhost`, `127.0.0.1` i mostka emulatora Androida (`10.0.2.2`); konfiguracja poza interfejsem pętli zwrotnej automatycznie korzysta z ograniczonego dostępu operatora

### Wymagania wstępne

- Gateway działa na innym komputerze (lub jest osiągalny przez SSH).
- Urządzenie lub emulator z Androidem może połączyć się z WebSocket Gateway:
  - Ta sama sieć LAN z mDNS/NSD, **lub**
  - Ten sam tailnet Tailscale korzystający z Wide-Area Bonjour / DNS-SD w trybie unicast (zobacz poniżej), **lub**
  - Ręcznie określony host/port Gateway (rozwiązanie awaryjne)
- Parowanie mobilne przez tailnet lub host publiczny **nie** korzysta z nieprzetworzonych punktów końcowych IP tailnetu `ws://`. Zamiast tego użyj Tailscale Serve lub innego adresu URL `wss://`.
- CLI `openclaw` jest dostępne na komputerze Gateway (lub przez SSH), aby zatwierdzać żądania parowania.

### 1. Uruchamianie Gateway

```bash
openclaw gateway --port 18789 --verbose
```

Potwierdź, że w dziennikach pojawia się wpis podobny do:

- `listening on ws://0.0.0.0:18789`

W przypadku zdalnego dostępu z Androida przez Tailscale preferuj Serve/Funnel zamiast bezpośredniego powiązania z tailnetem:

```bash
openclaw gateway --tailscale serve
```

Zapewnia to Androidowi bezpieczny punkt końcowy `wss://` / `https://`. Zwykła konfiguracja `gateway.bind: "tailnet"` nie wystarcza do pierwszego zdalnego parowania Androida, chyba że TLS jest również terminowany oddzielnie.

### 2. Weryfikowanie wykrywania (opcjonalnie)

Na komputerze Gateway:

```bash
dns-sd -B _openclaw-gw._tcp local.
```

Więcej uwag dotyczących debugowania: [Bonjour](/pl/gateway/bonjour).

Jeśli skonfigurowano również domenę wykrywania rozległego, porównaj ją za pomocą:

```bash
openclaw gateway discover --json
```

Polecenie wyświetla `local.` i skonfigurowaną domenę rozległą w jednym przebiegu, korzystając z rozpoznanego punktu końcowego usługi zamiast wskazówek pochodzących wyłącznie z TXT.

#### Wykrywanie między sieciami za pomocą DNS-SD w trybie unicast

Wykrywanie Android NSD/mDNS nie działa między sieciami. Jeśli Node Androida i Gateway znajdują się w różnych sieciach, ale są połączone przez Tailscale, należy zamiast tego użyć Wide-Area Bonjour / DNS-SD w trybie unicast. Samo wykrycie nie wystarcza do parowania Androida przez tailnet lub host publiczny — wykryta trasa nadal wymaga bezpiecznego punktu końcowego (`wss://` lub Tailscale Serve):

1. Skonfiguruj strefę DNS-SD (na przykład `openclaw.internal.`) na hoście Gateway i opublikuj rekordy `_openclaw-gw._tcp`.
2. Skonfiguruj podzielony DNS Tailscale dla wybranej domeny, wskazując ten serwer DNS.

Szczegóły i przykładowa konfiguracja CoreDNS: [Bonjour](/pl/gateway/bonjour).

### 3. Nawiązywanie połączenia z Androida

W aplikacji na Androida:

- Aplikacja utrzymuje aktywne połączenie z Gateway za pomocą **usługi pierwszoplanowej** (trwałego powiadomienia).
- Otwórz kartę **Connect**.
- Użyj trybu **Setup Code** lub **Manual**.
- Jeśli wykrywanie jest blokowane, użyj ręcznie określonego hosta/portu w sekcji **Advanced controls**. W przypadku hostów w prywatnej sieci LAN `ws://` nadal działa. W przypadku hostów Tailscale lub publicznych włącz TLS i użyj punktu końcowego `wss://` / Tailscale Serve.

Po pierwszym udanym parowaniu Android automatycznie ponownie nawiązuje połączenie podczas uruchamiania z aktywnym, sparowanym Gateway (w miarę możliwości w przypadku wykrytych Gateway, które muszą być widoczne w sieci).

Oficjalne kody konfiguracji łączą Androida jako Node i domyślnie przyznają pełny dostęp operatora
Gateway przez `wss://`. Konfiguracja nieszyfrowanego `ws://` poza interfejsem pętli zwrotnej
automatycznie korzysta z ograniczonego dostępu ze względu na bezpieczeństwo tokenu okaziciela. **Settings → Gateway**
wyświetla dostęp **Full** lub **Limited**. W przypadku ograniczonego połączenia skonfiguruj
`wss://` lub Tailscale Serve, wygeneruj nowy kod pełnego dostępu w Control UI albo
za pomocą `openclaw qr`, a następnie zeskanuj go lub wklej na tej stronie i ponownie nawiąż połączenie. Operatorzy,
którzy chcą korzystać z ograniczonego profilu, mogą wybrać **Limited access** w Control UI albo uruchomić
`openclaw qr --limited`.

### Wiele Gateway

Aplikacja przechowuje rejestr wszystkich Gateway, z którymi została sparowana, dzięki czemu można przełączać się między nimi bez ponownego parowania:

- **Settings -> Gateways** wyświetla sparowane Gateway i oznacza aktywny. Dotknij wpisu, aby się przełączyć; aplikacja kończy bieżące sesje i ponownie łączy się z wybranym Gateway.
- Karta **Connect** wyświetla szybki przełącznik, gdy sparowano więcej niż jeden Gateway.
- Poświadczenia, tokeny urządzeń, zaufanie TLS, historia czatu i wiadomości oczekujące w trybie offline są przechowywane osobno dla każdego Gateway. Przełączanie nigdy nie miesza stanu między Gateway, a wiadomości umieszczone w kolejce podczas pracy offline są dostarczane wyłącznie do Gateway, dla którego zostały utworzone.
- **Forget** usuwa wpis Gateway z rejestru wraz z jego poświadczeniami, tokenami urządzeń, przypięciem TLS i czatami w pamięci podręcznej.

### Sygnały aktywnej obecności

Po nawiązaniu uwierzytelnionej sesji Node oraz gdy aplikacja przechodzi do działania w tle, a usługa pierwszoplanowa pozostaje połączona, Android wywołuje `node.event` z `event: "node.presence.alive"`. Gateway zapisuje to jako `lastSeenAtMs`/`lastSeenReason` w metadanych sparowanego Node/urządzenia dopiero po poznaniu uwierzytelnionej tożsamości urządzenia Node.

Aplikacja uznaje sygnał za pomyślnie zarejestrowany tylko wtedy, gdy odpowiedź Gateway zawiera `handled: true`. Starsze Gateway mogą potwierdzić `node.event` za pomocą `{ "ok": true }`; taka odpowiedź jest zgodna, ale nie jest uznawana za trwałą aktualizację czasu ostatniej aktywności.

### 4. Zatwierdzanie parowania (CLI)

Na komputerze Gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

Szczegóły parowania: [Parowanie](/pl/channels/pairing).

Opcjonalnie: jeśli węzeł Android zawsze łączy się z ściśle kontrolowanej podsieci, można włączyć automatyczne zatwierdzanie pierwszego parowania węzła, podając jawne zakresy CIDR lub dokładne adresy IP:

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

Domyślnie ta funkcja jest wyłączona. Dotyczy wyłącznie nowego parowania `role: node` bez żądanych zakresów uprawnień. Parowanie operatora/przeglądarki oraz każda zmiana roli, zakresu uprawnień, metadanych lub klucza publicznego nadal wymaga ręcznego zatwierdzenia.

### 5. Sprawdzenie połączenia węzła

```bash
openclaw nodes status
openclaw gateway call node.list --params "{}"
```

### 6. Czat i historia

Karta czatu w systemie Android obsługuje wybór sesji (domyślnie `main`, a także inne istniejące sesje):

- Historia: `chat.history` (znormalizowana na potrzeby wyświetlania — usuwane są wbudowane znaczniki dyrektyw, tekstowe ładunki XML wywołań narzędzi (`<tool_call>`, `<function_call>`, `<tool_calls>`, `<function_calls>` oraz ich skrócone warianty), a także ujawnione tokeny sterujące modelu w formacie ASCII lub pełnej szerokości; wiersze asystenta zawierające wyłącznie tokeny ciszy, takie jak dokładne `NO_REPLY` / `no_reply`, są pomijane; zbyt duże wiersze mogą zostać zastąpione symbolami zastępczymi)
- Wysyłanie: `chat.send`
- Trwałe wysyłanie: każda wysyłka (tekst, wybrane obrazy i notatki głosowe) jest zapisywana w dzienniku lokalnej skrzynki nadawczej przypisanej do danego Gateway przed podjęciem jakiejkolwiek próby sieciowej, dzięki czemu zamknięcie aplikacji nie powoduje utraty przesłanych danych. Wysyłki umieszczone w kolejce w trybie offline są dostarczane po ponownym połączeniu w kolejności, ze stabilnymi kluczami idempotencji, a wysyłka zostaje usunięta z kolejki dopiero wtedy, gdy tura jest widoczna w kanonicznym `chat.history` — samo potwierdzenie nie jest uznawane za dowód dostarczenia. Niejednoznaczne wyniki (utrata potwierdzenia, zamknięcie aplikacji w trakcie wysyłania, ponowne uruchomienie Gateway przed zapisem transkrypcji) są wyświetlane jako widoczne wiersze z jawnymi opcjami **Ponów**/**Usuń**, zamiast automatycznego ponawiania wysyłki. Polecenia ukośnikowe nigdy nie są automatycznie odtwarzane po ponownym połączeniu; oczekują na jawne ponowienie. Kolejka jest ograniczona (50 wiadomości i 48 MB danych załączników na Gateway), a niewysłane wiersze wygasają po 48 godzinach. Wersje robocze w edytorze, które nigdy nie zostały przesłane, nie są trwale zachowywane między procesami.
- Aktualizacje push (w miarę możliwości): `chat.subscribe` -> `event:"chat"`
- Odsłuchiwanie: należy przytrzymać wiadomość asystenta i wybrać **Odsłuchaj**, aby ją usłyszeć; dźwięk jest generowany przez gateway `tts.speak` przy użyciu skonfigurowanego łańcucha dostawców TTS, a systemowy TTS urządzenia jest używany, gdy gateway nie może wygenerować dźwięku. Odtwarzanie zatrzymuje się po zmianie sesji, rozpoczęciu nowego czatu, przejściu aplikacji do tła lub zamknięciu czatu.

### 7. Canvas i kamera

#### Host Canvas w Gateway (zalecany dla treści internetowych)

Aby węzeł wyświetlał rzeczywisty kod HTML/CSS/JS, który agent może edytować na dysku, należy skierować węzeł do hosta Canvas w Gateway.

<Note>
Węzły wczytują Canvas z serwera HTTP Gateway (ten sam port co `gateway.port`, domyślnie `18789`).
</Note>

1. Utwórz `~/.openclaw/workspace/canvas/index.html` na hoście Gateway.
2. Przejdź do niego w węźle (LAN):

```bash
openclaw nodes invoke --node "<Android Node>" --command canvas.navigate --params '{"url":"http://<gateway-hostname>.local:18789/__openclaw__/canvas/"}'
```

Tailnet (opcjonalnie): jeśli oba urządzenia korzystają z Tailscale, zamiast `.local` należy użyć nazwy MagicDNS lub adresu IP tailnetu, np. `http://<gateway-magicdns>:18789/__openclaw__/canvas/`.

Ten serwer wstrzykuje do kodu HTML klienta przeładowywania na żywo i przeładowuje stronę po zmianie plików. Gateway udostępnia także `/__openclaw__/a2ui/`, ale aplikacja Android traktuje zdalne strony A2UI jako przeznaczone wyłącznie do renderowania. Polecenia A2UI obsługujące działania korzystają z dołączonej strony A2UI należącej do aplikacji.

Polecenia Canvas (tylko na pierwszym planie):

- `canvas.eval`, `canvas.snapshot`, `canvas.navigate` (aby powrócić do domyślnego szkieletu, należy użyć `{"url":""}` lub `{"url":"/"}`). `canvas.snapshot` zwraca `{ format, base64 }` (domyślnie `format="jpeg"`).
- A2UI: `canvas.a2ui.push`, `canvas.a2ui.reset` (starszy alias `canvas.a2ui.pushJSONL`). Korzystają one z dołączonej strony A2UI należącej do aplikacji, umożliwiającej renderowanie z obsługą działań.

Polecenia kamery (tylko na pierwszym planie; wymagają uprawnień): `camera.snap` (jpg), `camera.clip` (mp4). Parametry i pomocnicze polecenia CLI opisano w sekcji [Węzeł kamery](/pl/nodes/camera).

### 8. Głos i rozszerzony zestaw poleceń systemu Android

- Karta głosu: Android ma dwa jawne tryby przechwytywania. **Mikrofon** to ręczna sesja na karcie głosu, która wysyła każdą pauzę jako turę czatu i kończy się, gdy aplikacja opuszcza pierwszy plan lub użytkownik opuszcza kartę głosu. **Rozmowa** to ciągły tryb rozmowy, który nasłuchuje do momentu wyłączenia lub rozłączenia węzła.
- Tryb rozmowy podnosi rangę istniejącej usługi pierwszoplanowej z `connectedDevice` do `connectedDevice|microphone` przed rozpoczęciem przechwytywania, a następnie obniża ją po zatrzymaniu trybu rozmowy. Usługa węzła deklaruje `FOREGROUND_SERVICE_CONNECTED_DEVICE` z `CHANGE_NETWORK_STATE`; Android 14+ wymaga także deklaracji `FOREGROUND_SERVICE_MICROPHONE`, przyznania uprawnienia `RECORD_AUDIO` w czasie działania oraz typu usługi mikrofonu w czasie działania.
- Domyślnie funkcja rozmowy w systemie Android korzysta z natywnego rozpoznawania mowy, czatu Gateway oraz `talk.speak` za pośrednictwem skonfigurowanego dostawcy rozmowy Gateway. Lokalny systemowy TTS jest używany tylko wtedy, gdy `talk.speak` jest niedostępne.
- Funkcja rozmowy w systemie Android używa przekaźnika Gateway działającego w czasie rzeczywistym tylko wtedy, gdy `talk.realtime.mode` ma wartość `realtime`, a `talk.realtime.transport` ma wartość `gateway-relay`.
- Android nie ogłasza możliwości `voiceWake`. Do wprowadzania głosowego należy używać funkcji **Mikrofon** lub **Rozmowa**.
- Dodatkowe rodziny poleceń systemu Android (dostępność zależy od urządzenia, uprawnień i ustawień użytkownika):
  - `device.status`, `device.info`, `device.permissions`, `device.health`
  - `device.apps` tylko wtedy, gdy włączono **Settings > Phone Capabilities > Installed Apps**; domyślnie wyświetla aplikacje widoczne w programie uruchamiającym (aby uzyskać pełną listę, należy przekazać `includeNonLaunchable`).
  - `notifications.list`, `notifications.actions` (zobacz [Przekazywanie powiadomień](#notification-forwarding) poniżej)
  - `photos.latest`
  - `contacts.search`, `contacts.add`
  - `calendar.events`, `calendar.add`
  - `callLog.search`
  - `sms.search`
  - `motion.activity`, `motion.pedometer`

### 9. Pliki obszaru roboczego (tylko do odczytu)

Przegląd na stronie głównej zawiera kartę **Pliki**, która umożliwia przeglądanie obszaru roboczego aktywnego agenta za pośrednictwem RPC gateway `agents.workspace.list` / `agents.workspace.get` działających tylko do odczytu: przechodzenie w głąb katalogów, podgląd tekstu i obrazów oraz eksport za pomocą arkusza udostępniania systemu Android. Operacje zapisu nie są dostępne, a rozmiar podglądów jest ograniczany przez gateway.

## Przeglądanie zatwierdzeń poleceń

Połączenie operatora z `operator.admin` albo sparowane
połączenie `operator.approvals` jawnie wskazane przez Gateway może przeglądać
oczekujące żądania wykonania w sekcji **Settings -> Approvals**. Aplikacja wczytuje
oczyszczony rekord zatwierdzenia z Gateway przed włączeniem przycisków, wyświetla
wszelkie ostrzeżenia dotyczące bezpieczeństwa oraz dokładne decyzje oferowane przez żądanie, a następnie przesyła
identyfikator zatwierdzenia i rodzaj właściciela z powrotem do Gateway.

Stan zatwierdzenia jest współdzielony z interfejsem Control UI i obsługiwanymi powierzchniami czatu.
Obowiązuje pierwsza zatwierdzona odpowiedź; Android wyświetla ten kanoniczny wynik, nawet gdy
inna powierzchnia odpowiedziała jako pierwsza. Jeśli odpowiedź rozstrzygająca zostanie utracona lub Gateway
rozłączy się, aplikacja zachowuje blokadę działania i ponownie odczytuje zatwierdzenie,
zanim zaoferuje kolejną decyzję.

Gateway starsze niż ujednolicone metody zatwierdzania korzystają awaryjnie z dostarczonych
metod właściwych dla wykonywania poleceń. Przeglądanie oczekujących żądań nadal działa, ale zachowany stan terminala
i bogatszy wynik współdzielony między powierzchniami wymagają zaktualizowanego Gateway.

## Punkty wejścia asystenta

Android obsługuje uruchamianie OpenClaw za pomocą systemowego wyzwalacza asystenta (Google Assistant). Przytrzymanie przycisku ekranu głównego (lub użycie innego wyzwalacza `ACTION_ASSIST`) otwiera aplikację; wypowiedzenie „Hey Google, ask OpenClaw `<prompt>`” pasuje do wzorca zapytania App Actions zadeklarowanego przez aplikację i przekazuje polecenie do edytora czatu bez automatycznego wysyłania.

Funkcja korzysta z mechanizmu **App Actions** systemu Android (możliwość `shortcuts.xml`) zadeklarowanego w manifeście aplikacji. Konfiguracja po stronie gateway nie jest potrzebna — intencja asystenta jest obsługiwana w całości przez aplikację Android.

<Note>
Dostępność App Actions zależy od urządzenia, wersji Google Play Services oraz od tego, czy OpenClaw ustawiono jako domyślną aplikację asystenta.
</Note>

## Przekazywanie powiadomień

Android może przekazywać powiadomienia urządzenia do gateway jako elementy `node.event`. Konfigurację przeprowadza się **na urządzeniu**, w arkuszu Settings aplikacji — nie w konfiguracji gateway/`openclaw.json`.

| Ustawienie                  | Opis                                                                                                                                                                                                 |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Forward Notification Events | Główny przełącznik. Domyślnie wyłączony; najpierw wymaga przyznania dostępu Notification Listener Access.                                                                                            |
| Package Filter              | **Allowlist** (przekazywane są tylko wymienione identyfikatory pakietów) lub **Blocklist** (domyślnie: wszystkie pakiety oprócz wymienionych identyfikatorów). W trybie Blocklist własny pakiet OpenClaw jest zawsze wykluczony, aby zapobiec pętlom przekazywania. |
| Quiet Hours                 | Lokalne okno początku/końca w formacie HH:mm, które wstrzymuje przekazywanie. Domyślnie wyłączone; po włączeniu przyjmuje wartości `22:00`-`07:00`.                                      |
| Max Events / Minute         | Limit liczby przekazywanych powiadomień na minutę dla każdego urządzenia. Domyślnie 20.                                                                                                               |
| Route Session Key           | Opcjonalne. Przypisuje przekazywane zdarzenia powiadomień do określonej sesji zamiast do domyślnej trasy powiadomień urządzenia.                                                                       |

<Note>
Przekazywanie powiadomień wymaga uprawnienia Notification Listener systemu Android. Aplikacja prosi o nie podczas konfiguracji.
</Note>

Powiadomienia z WhatsApp, WhatsApp Business, Telegram, Telegram X, Discord i Signal są zawsze wykluczone. Ich wiadomości są już obsługiwane przez natywne sesje kanałów OpenClaw; przekazanie powiadomienia systemu Android jako osobnego zdarzenia węzła mogłoby skierować odpowiedź do niewłaściwej rozmowy.

## Powiązane

- [Aplikacja iOS](/pl/platforms/ios)
- [Węzły](/pl/nodes)
- [Rozwiązywanie problemów z węzłem Android](/pl/nodes/troubleshooting)
