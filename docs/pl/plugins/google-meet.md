---
read_when:
    - Chcesz, aby agent OpenClaw dołączył do rozmowy w Google Meet
    - Chcesz, aby agent OpenClaw utworzył nowe spotkanie w Google Meet
    - Konfigurujesz Chrome, węzeł Chrome lub Twilio jako transport Google Meet
summary: 'Plugin Google Meet: dołączanie do jawnie podanych adresów URL Meet przez Chrome lub Twilio z domyślnymi ustawieniami odpowiedzi głosowych agenta'
title: Plugin Google Meet
x-i18n:
    generated_at: "2026-07-16T18:50:09Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 5a3a0d2675bdfaeaa869652593fd1931c3afdefe0ed95f13935dade976ff038c
    source_path: plugins/google-meet.md
    workflow: 16
---

Plugin `google-meet` dołącza do spotkań pod wyraźnie podanymi adresami URL Meet w imieniu agenta OpenClaw. Jego zakres jest celowo ograniczony:

- Dołącza wyłącznie przy użyciu adresów URL `https://meet.google.com/...`; nigdy nie łączy się ze spotkaniem za pomocą samodzielnie wykrytego numeru telefonu.
- `googlemeet create` może utworzyć nowy adres URL Meet za pomocą interfejsu Google Meet API (lub rozwiązania zastępczego opartego na przeglądarce) i domyślnie do niego dołączyć.
- Uczestnictwo przez Chrome korzysta z zalogowanego profilu Chrome, opcjonalnie na sparowanym węźle. Uczestnictwo przez Twilio polega na wybraniu numeru telefonu wraz z kodem PIN/DTMF za pośrednictwem [pluginu połączeń głosowych](/pl/plugins/voice-call); nie może ono bezpośrednio wybrać adresu URL Meet.
- `mode: "agent"` (domyślnie) transkrybuje wypowiedzi uczestników za pomocą dostawcy działającego w czasie rzeczywistym, przekazuje je do skonfigurowanego agenta OpenClaw i odczytuje odpowiedź przy użyciu standardowego TTS OpenClaw. `mode: "bidi"` umożliwia bezpośrednie odpowiadanie przez model głosowy działający w czasie rzeczywistym. `mode: "transcribe"` dołącza wyłącznie w celu obserwacji, bez możliwości odpowiadania głosowego.
- Plugin nie odtwarza automatycznego komunikatu o zgodzie po dołączeniu do rozmowy.
- Polecenie CLI to `googlemeet`; `meet` jest zarezerwowane dla szerszych przepływów telekonferencyjnych agenta.

## Szybki start

Zainstaluj lokalne zależności audio, a następnie ustaw klucz dostawcy działającego w czasie rzeczywistym. OpenAI jest domyślnym dostawcą transkrypcji w trybie `agent`; Google Gemini Live jest dostępny jako dostawca głosu w trybie `bidi`:

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
# wymagane tylko wtedy, gdy realtime.voiceProvider ma wartość "google" w trybie bidi
export GEMINI_API_KEY=...
```

`blackhole-2ch` instaluje wirtualne urządzenie audio `BlackHole 2ch`, przez które Chrome kieruje dźwięk. Instalator Homebrew wymaga ponownego uruchomienia systemu, zanim macOS udostępni urządzenie:

```bash
sudo reboot
```

Po ponownym uruchomieniu zweryfikuj oba elementy:

```bash
system_profiler SPAudioDataType | grep -i BlackHole
command -v sox
```

Włącz plugin:

```json5
{
  plugins: {
    entries: {
      "google-meet": {
        enabled: true,
        config: {},
      },
    },
  },
}
```

Sprawdź konfigurację, a następnie dołącz:

```bash
openclaw googlemeet setup
openclaw googlemeet join https://meet.google.com/abc-defg-hij
```

Dane wyjściowe `setup` są czytelne dla agenta i uwzględniają tryb oraz transport: raportują profil Chrome, przypięcie węzła, a w przypadku połączeń Chrome w czasie rzeczywistym także most audio BlackHole/SoX i kontrolę opóźnionego wprowadzenia. Połączenia wyłącznie obserwacyjne pomijają wymagania wstępne trybu czasu rzeczywistego:

```bash
openclaw googlemeet setup --transport chrome-node --mode transcribe
```

Gdy skonfigurowano delegowanie do Twilio, `setup` informuje również, czy `voice-call`, dane uwierzytelniające Twilio i publiczne udostępnienie Webhooka są gotowe. Każdą kontrolę `ok: false` należy traktować jako blokadę danego transportu lub trybu, zanim agent dołączy. Użyj `--json`, aby uzyskać dane wyjściowe przeznaczone do przetwarzania maszynowego, oraz `--transport chrome|chrome-node|twilio`, aby wcześniej sprawdzić konkretny transport:

```bash
openclaw googlemeet setup --transport twilio
```

Można też pozwolić agentowi dołączyć za pomocą narzędzia `google_meet`:

```json
{
  "action": "join",
  "url": "https://meet.google.com/abc-defg-hij",
  "transport": "chrome-node",
  "mode": "agent"
}
```

Na hostach Gateway innych niż macOS `google_meet` pozostaje dostępne dla artefaktów, kalendarza, konfiguracji, transkrypcji, Twilio i działań `chrome-node`, ale lokalne odpowiadanie głosowe przez Chrome (`transport: "chrome"` z `mode: "agent"` lub `"bidi"`) jest blokowane przed dotarciem do mostu audio, ponieważ ta ścieżka obecnie zależy od `BlackHole 2ch` systemu macOS. Zamiast tego użyj `mode: "transcribe"`, połączenia telefonicznego Twilio lub hosta `chrome-node` z systemem macOS.

### Tworzenie spotkania

```bash
openclaw googlemeet create --transport chrome-node --mode agent
openclaw googlemeet create --no-join
```

`create` ma dwie ścieżki, wskazywane w polu `source` wyniku:

- **`api`**: używana, gdy skonfigurowano dane uwierzytelniające OAuth Google Meet. Jest deterministyczna i nie zależy od stanu interfejsu przeglądarki.
- **`browser`**: używana bez danych uwierzytelniających OAuth. OpenClaw otwiera `https://meet.google.com/new` na przypiętym węźle Chrome i czeka, aż Google przekieruje do rzeczywistego adresu URL z kodem spotkania; profil Chrome OpenClaw na tym węźle musi być już zalogowany w Google. Zarówno dołączanie, jak i tworzenie ponownie wykorzystuje istniejącą kartę Meet (lub kartę z trwającym `.../new` albo monitem dotyczącym konta Google) przed otwarciem nowej; dopasowywanie kart ignoruje nieistotne ciągi zapytania, takie jak `authuser`.

`create` domyślnie dołącza i zwraca `joined: true` wraz z sesją dołączenia. Przekaż `--no-join` (CLI) lub `"join": false` (narzędzie), aby tylko utworzyć adres URL.

W przypadku pokojów utworzonych przez API ustaw jawną zasadę dostępu zamiast dziedziczyć ustawienie domyślne konta Google:

```bash
openclaw googlemeet create --access-type OPEN --transport chrome-node --mode agent
```

| `--access-type` | Kto może dołączyć bez proszenia o zgodę                              |
| --------------- | ------------------------------------------------------------------- |
| `OPEN`          | Każdy, kto ma adres URL Meet                                        |
| `TRUSTED`       | Zaufani użytkownicy organizacji gospodarza, zaproszeni użytkownicy zewnętrzni i użytkownicy dołączający telefonicznie |
| `RESTRICTED`    | Tylko zaproszone osoby                                               |

Dotyczy to wyłącznie pokojów utworzonych przez API, dlatego OAuth musi być skonfigurowane. Jeśli uwierzytelnienie wykonano przed wprowadzeniem tej opcji, uruchom ponownie `openclaw googlemeet auth login --json` po dodaniu zakresu `meetings.space.settings` do ekranu zgody OAuth.

Jeśli rozwiązanie zastępcze oparte na przeglądarce napotka blokadę logowania do Google lub uprawnień Meet, narzędzie zwróci `manualActionRequired: true` z `manualActionReason`, `manualActionMessage` oraz `browser.nodeId`/`browser.targetId`/`browserUrl`. Zgłoś ten komunikat i przestań otwierać nowe karty Meet, dopóki operator nie ukończy czynności w przeglądarce.

### Dołączenie wyłącznie obserwacyjne

Ustaw `"mode": "transcribe"`, aby pominąć dwukierunkowy most czasu rzeczywistego (bez wymagania BlackHole/SoX i bez odpowiadania głosowego). Połączenia Chrome w trybie transkrypcji pomijają także przyznawanie przez OpenClaw uprawnień do mikrofonu i kamery oraz ścieżkę Meet **Use microphone**; jeśli Meet wyświetli ekran wyboru dźwięku, automatyzacja najpierw spróbuje użyć opcji **Continue without microphone**. Zarządzane transporty Chrome w tym trybie instalują obserwator napisów Meet działający w miarę możliwości. `googlemeet status --json` i `googlemeet doctor` raportują `captioning`, `captionsEnabledAttempted`, `transcriptLines`, `lastCaptionAt`, `lastCaptionSpeaker`, `lastCaptionText` oraz końcowy fragment `recentTranscript`.

Aby odczytać ograniczoną transkrypcję sesji, użyj dokładnie śledzonej karty Meet:

```bash
openclaw googlemeet transcript <session-id>
openclaw googlemeet transcript <session-id> --since <next-index> --json
```

Obserwator przechowuje na stronie Meet maksymalnie 2 000 ukończonych wierszy napisów. Widoczny, stopniowo pojawiający się tekst pozostaje w końcowym fragmencie stanu kondycji do czasu ukończenia wiersza napisów, dlatego zapisanie `nextIndex` nie może pominąć późniejszego rozszerzenia tekstu; opuszczenie spotkania finalizuje widoczne wiersze przed wykonaniem migawki. `droppedLines` raportuje wiersze utracone z początku po przekroczeniu limitu. Transkrypcje czterech ostatnio zakończonych sesji pozostają dostępne do odczytu aż do ponownego uruchomienia gatewaya. Starsze zakończone transkrypcje zwracają `evicted: true`. Jest to celowo pamięć środowiska uruchomieniowego, a nie trwały magazyn historii spotkań: ponowne uruchomienie gatewaya, zamknięcie karty przed wykonaniem migawki lub przekroczenie udokumentowanych limitów może spowodować utratę napisów.

Aby wykonać próbę nasłuchiwania z wynikiem tak/nie:

```bash
openclaw googlemeet test-listen <meet-url> --transport chrome-node
```

Polecenie dołącza w trybie transkrypcji, czeka na nową zmianę napisów lub transkrypcji i zwraca `listenVerified`, `listenTimedOut`, pola czynności ręcznych oraz bieżący stan kondycji napisów.

### Stan sesji czasu rzeczywistego

Podczas sesji z odpowiadaniem głosowym stan `google_meet` raportuje kondycję Chrome i mostu audio: `inCall`, `manualActionRequired`, `providerConnected`, `realtimeReady`, `audioInputActive`, `audioOutputActive`, znaczniki czasu ostatnich danych wejściowych i wyjściowych, liczniki bajtów oraz stan zamknięcia mostu. Zarządzane sesje Chrome wypowiadają frazę wprowadzającą lub testową dopiero wtedy, gdy stan kondycji raportuje `inCall: true`; w przeciwnym razie `speechReady: false`, a próba odtworzenia mowy jest blokowana zamiast bezgłośnie niczego nie robić.

Lokalne połączenia Chrome korzystają z zalogowanego profilu przeglądarki OpenClaw i wymagają `BlackHole 2ch` dla ścieżki mikrofonu i głośnika. Jedno urządzenie BlackHole wystarczy do pierwszego testu podstawowego, ale może powodować echo; aby uzyskać czysty dźwięk dwukierunkowy, użyj oddzielnych urządzeń wirtualnych lub grafu w stylu Loopback.

## Lokalny Gateway i Chrome w Parallels

Pełny Gateway ani klucz API modelu nie są wymagane wewnątrz maszyny wirtualnej macOS, jeśli ma ona tylko udostępniać Chrome. Uruchom Gateway i agenta lokalnie, a host węzła w maszynie wirtualnej.

| Miejsce działania     | Co                                                                                              |
| -------------------- | ----------------------------------------------------------------------------------------------- |
| Host Gateway         | Gateway OpenClaw, przestrzeń robocza agenta, klucze modelu/API, dostawca czasu rzeczywistego, konfiguracja pluginu Google Meet |
| Maszyna wirtualna Parallels macOS | Host CLI/węzła OpenClaw, Chrome, SoX, BlackHole 2ch, profil Chrome zalogowany w Google |
| Niewymagane w maszynie wirtualnej | Usługa Gateway, konfiguracja agenta, konfiguracja dostawcy modelu                        |

Zainstaluj zależności maszyny wirtualnej, uruchom ją ponownie i zweryfikuj:

```bash
brew install blackhole-2ch sox
sudo reboot
system_profiler SPAudioDataType | grep -i BlackHole
command -v sox
```

Włącz plugin w maszynie wirtualnej i uruchom host węzła:

```bash
openclaw plugins enable google-meet
openclaw node run --host <gateway-host> --port 18789 --display-name parallels-macos
```

Jeśli `<gateway-host>` jest adresem IP sieci LAN bez TLS, zezwól na użycie tej zaufanej sieci prywatnej:

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node run --host <gateway-lan-ip> --port 18789 --display-name parallels-macos
```

Użyj tej samej flagi podczas instalowania jako LaunchAgent (jest to środowisko procesu, zapisywane w środowisku LaunchAgent, jeśli występuje w poleceniu instalacji, a nie ustawienie `openclaw.json`):

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node install --host <gateway-lan-ip> --port 18789 --display-name parallels-macos --force
openclaw node restart
```

Zatwierdź węzeł na hoście Gateway, a następnie potwierdź, że ogłasza zarówno `googlemeet.chrome`, jak i funkcję przeglądarki/`browser.proxy`:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw nodes status
```

Skieruj Meet przez ten węzeł:

```json5
{
  gateway: {
    nodes: {
      allowCommands: ["googlemeet.chrome", "browser.proxy"],
    },
  },
  plugins: {
    entries: {
      "google-meet": {
        enabled: true,
        config: {
          defaultTransport: "chrome-node",
          chrome: {
            guestName: "OpenClaw Agent",
            autoJoin: true,
            reuseExistingTab: true,
          },
          chromeNode: {
            node: "parallels-macos",
          },
        },
      },
    },
  },
}
```

Teraz dołącz w zwykły sposób z hosta Gateway:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij
```

Aby przeprowadzić test podstawowy za pomocą jednego polecenia, które tworzy sesję lub używa istniejącej, wypowiada znaną frazę i wyświetla stan sesji:

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij
```

Podczas dołączania w czasie rzeczywistym automatyzacja przeglądarki wypełnia nazwę gościa, klika Join/Ask to join i akceptuje monit Meet „Use microphone” wyświetlany przy pierwszym uruchomieniu (lub „Continue without microphone” podczas dołączania wyłącznie obserwacyjnego i tworzenia spotkania wyłącznie w przeglądarce). Jeśli profil jest wylogowany, Meet czeka na wpuszczenie przez gospodarza, Chrome wymaga uprawnień do mikrofonu lub kamery albo Meet zatrzymał się na nierozwiązanym monicie, wynik raportuje `manualActionRequired: true` wraz z `manualActionReason` i `manualActionMessage`. Przestań ponawiać próby, zgłoś ten komunikat wraz z `browserUrl`/`browserTitle` i spróbuj ponownie dopiero po ukończeniu czynności ręcznej.

Jeśli pominięto `chromeNode.node`, OpenClaw dokonuje automatycznego wyboru tylko wtedy, gdy dokładnie jeden połączony Node udostępnia zarówno `googlemeet.chrome`, jak i sterowanie przeglądarką; gdy połączonych jest kilka odpowiednich Node'ów, przypnij `chromeNode.node` (identyfikator Node'a, nazwę wyświetlaną lub zdalny adres IP).

### Sprawdzanie typowych błędów

| Objaw                                                    | Rozwiązanie                                                                                                                                                                                                                                                                 |
| -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Configured Google Meet node ... is not usable: offline` | Przypięty Node jest znany, ale niedostępny. Zgłoś przeszkodę w konfiguracji; nie przełączaj się po cichu na inny transport, chyba że o to poproszono.                                                                                                                                    |
| `No connected Google Meet-capable node`                  | Uruchom `openclaw node run` w maszynie wirtualnej, zatwierdź parowanie, a następnie uruchom w niej `openclaw plugins enable google-meet` i `openclaw plugins enable browser`. Potwierdź, że `gateway.nodes.allowCommands` zawiera `googlemeet.chrome` i `browser.proxy`.                              |
| `BlackHole 2ch audio device not found`                   | Zainstaluj `blackhole-2ch` na sprawdzanym hoście i uruchom go ponownie.                                                                                                                                                                                                       |
| `BlackHole 2ch audio device not found on the node`       | Zainstaluj `blackhole-2ch` w maszynie wirtualnej i uruchom ją ponownie.                                                                                                                                                                                                                |
| Chrome otwiera się, ale nie może dołączyć                             | Zaloguj się do profilu przeglądarki w maszynie wirtualnej lub pozostaw ustawione `chrome.guestName`. Automatyczne dołączanie gościa korzysta z automatyzacji przeglądarki OpenClaw za pośrednictwem serwera proxy przeglądarki Node'a; skieruj `browser.defaultProfile` Node'a (lub nazwany profil istniejącej sesji) na wybrany profil. |
| Zduplikowane karty Meet                                      | Pozostaw `chrome.reuseExistingTab: true`. OpenClaw aktywuje istniejącą kartę z tym samym adresem URL, a przed otwarciem kolejnej karty proces tworzenia ponownie wykorzystuje trwający monit `.../new` lub monit konta Google.                                                                      |
| Brak dźwięku                                                 | Skieruj mikrofon/głośnik Meet przez wirtualną ścieżkę audio używaną przez OpenClaw; aby uzyskać czysty dźwięk dwukierunkowy, użyj oddzielnych urządzeń wirtualnych lub routingu w stylu Loopback.                                                                                                              |

## Uwagi dotyczące instalacji

Domyślna funkcja zwrotnego przesyłania głosu w Chrome korzysta z dwóch zewnętrznych narzędzi, których OpenClaw nie dołącza ani nie rozpowszechnia; zainstaluj je jako zależności hosta za pomocą Homebrew:

- `sox`: narzędzie audio wiersza poleceń. Plugin wydaje jawne polecenia urządzenia CoreAudio dla domyślnego mostu audio PCM16 24 kHz.
- `blackhole-2ch`: wirtualny sterownik audio systemu macOS udostępniający urządzenie `BlackHole 2ch`, przez które przebiega trasa Chrome/Meet.

SoX jest objęty licencją `LGPL-2.0-only AND GPL-2.0-only`; BlackHole jest objęty licencją GPL-3.0. Jeśli tworzysz instalator lub urządzenie, które dołącza BlackHole do OpenClaw, zapoznaj się z warunkami licencji projektu BlackHole albo uzyskaj oddzielną licencję od Existential Audio.

## Transporty

| Transport     | Zastosowanie                                                                                     |
| ------------- | -------------------------------------------------------------------------------------------- |
| `chrome`      | Chrome/audio działają na hoście Gateway                                                        |
| `chrome-node` | Chrome/audio działają na sparowanym Node (na przykład w maszynie wirtualnej Parallels macOS)                        |
| `twilio`      | Zapasowe telefoniczne połączenie przychodzące za pośrednictwem Pluginu Voice Call, gdy uczestnictwo przez Chrome nie jest dostępne |

### Chrome

Otwiera adres URL Meet za pomocą sterowania przeglądarką OpenClaw i dołącza jako zalogowany profil przeglądarki OpenClaw. W systemie macOS Plugin sprawdza przed uruchomieniem obecność `BlackHole 2ch`, a jeśli jest skonfigurowane, uruchamia polecenie kontroli stanu/uruchamiania mostu audio przed otwarciem Chrome. W przypadku lokalnego Chrome wybierz profil za pomocą `browser.defaultProfile`; parametr `chrome.browserProfile` jest przekazywany zamiast tego do hostów `chrome-node`.

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome-node
```

Dźwięk mikrofonu/głośnika Chrome jest kierowany przez lokalny most audio OpenClaw. Jeśli `BlackHole 2ch` nie jest zainstalowane, próba dołączenia kończy się błędem konfiguracji zamiast dołączeniem bez ścieżki audio.

### Twilio

Ścisły plan wybierania delegowany do [Pluginu Voice Call](/pl/plugins/voice-call). Nie analizuje stron Meet w poszukiwaniu numerów telefonów; Google Meet musi udostępniać numer telefoniczny i kod PIN do spotkania.

Włącz Voice Call na hoście Gateway, a nie na Node Chrome:

```json5
{
  plugins: {
    allow: ["google-meet", "voice-call", "google"],
    entries: {
      "google-meet": {
        enabled: true,
        config: {
          defaultTransport: "chrome-node",
          // lub ustaw "twilio", jeśli Twilio ma być domyślne
        },
      },
      "voice-call": {
        enabled: true,
        config: {
          provider: "twilio",
          inboundPolicy: "allowlist",
          realtime: {
            enabled: true,
            provider: "google",
            instructions: "Dołącz do tego spotkania Google Meet jako agent OpenClaw. Mów zwięźle.",
            toolPolicy: "safe-read-only",
            providers: {
              google: {
                silenceDurationMs: 500,
                startSensitivity: "high",
              },
            },
          },
        },
      },
      google: {
        enabled: true,
      },
    },
  },
}
```

Przekaż dane uwierzytelniające Twilio przez zmienne środowiskowe, aby nie przechowywać sekretów w `openclaw.json`:

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
export GEMINI_API_KEY=...
```

Jeśli dostawcą głosu w czasie rzeczywistym jest OpenAI, użyj zamiast tego `realtime.provider: "openai"` z `OPENAI_API_KEY`.

Po włączeniu `voice-call` uruchom ponownie lub przeładuj Gateway; zmiany konfiguracji Pluginu nie zaczną obowiązywać przed przeładowaniem. Sprawdź:

```bash
openclaw config validate
openclaw plugins list | grep -E 'google-meet|voice-call'
openclaw googlemeet setup
```

Gdy delegowanie Twilio jest podłączone, `googlemeet setup` obejmuje kontrole `twilio-voice-call-plugin`, `twilio-voice-call-credentials` i `twilio-voice-call-webhook`.

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --pin 123456
```

Aby użyć niestandardowej sekwencji, zastosuj `--dtmf-sequence`, dodając na początku `w` lub przecinki, aby wprowadzić pauzę przed kodem PIN:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --dtmf-sequence ww123456#
```

## OAuth i kontrola wstępna

OAuth jest opcjonalny podczas tworzenia linku Meet, ponieważ `googlemeet create` może użyć automatyzacji przeglądarki jako rozwiązania zapasowego. Skonfiguruj OAuth na potrzeby tworzenia przez oficjalne API, rozpoznawania przestrzeni lub kontroli wstępnej Meet Media API. Dołączanie przez Chrome/Chrome-node nigdy nie zależy od OAuth; zawsze korzysta z zalogowanego profilu Chrome, BlackHole/SoX oraz — w przypadku `chrome-node` — połączonego Node'a.

### Tworzenie danych uwierzytelniających Google

W Google Cloud Console:

<Steps>
<Step title="Utwórz lub wybierz projekt">
</Step>
<Step title="Włącz Google Meet REST API">
</Step>
<Step title="Skonfiguruj ekran zgody OAuth">
Opcja Internal jest najprostsza dla organizacji Google Workspace. Opcja External działa w konfiguracjach osobistych/testowych; gdy aplikacja ma stan Testing, dodaj jako użytkownika testowego każde konto Google, które będzie ją autoryzować.
</Step>
<Step title="Dodaj wymagane zakresy">
- `https://www.googleapis.com/auth/meetings.space.created`
- `https://www.googleapis.com/auth/meetings.space.readonly`
- `https://www.googleapis.com/auth/meetings.space.settings`
- `https://www.googleapis.com/auth/meetings.conference.media.readonly`
- `https://www.googleapis.com/auth/calendar.events.readonly` (wyszukiwanie w Kalendarzu)
- `https://www.googleapis.com/auth/drive.meet.readonly` (eksport treści dokumentu transkrypcji/inteligentnej notatki)

</Step>
<Step title="Utwórz identyfikator klienta OAuth">
Typ aplikacji **Web application**. Autoryzowany identyfikator URI przekierowania:

```text
http://localhost:8085/oauth2callback
```

</Step>
<Step title="Skopiuj identyfikator klienta i sekret klienta">
</Step>
</Steps>

`meetings.space.created` jest wymagane przez `spaces.create`. `meetings.space.readonly` rozpoznaje adresy URL/kody Meet jako przestrzenie. `meetings.space.settings` umożliwia OpenClaw przekazywanie ustawień `SpaceConfig`, takich jak `accessType`, podczas tworzenia pokoju przez API. `meetings.conference.media.readonly` służy do kontroli wstępnej Meet Media API i operacji na multimediach; Google może wymagać rejestracji w programie Developer Preview w celu faktycznego korzystania z Media API. `calendar.events.readonly` jest potrzebne tylko do wyszukiwania w kalendarzu za pomocą `--today`/`--event`. `drive.meet.readonly` jest potrzebne tylko do eksportu `--include-doc-bodies`. Jeśli potrzebne jest wyłącznie dołączanie przez Chrome oparte na przeglądarce, całkowicie pomiń OAuth.

### Generowanie tokenu odświeżania

Skonfiguruj `oauth.clientId` i opcjonalnie `oauth.clientSecret` (lub przekaż je jako zmienne środowiskowe), a następnie uruchom:

```bash
openclaw googlemeet auth login --json
```

Uruchamia to przepływ PKCE z lokalnym wywołaniem zwrotnym na `http://localhost:8085/oauth2callback` i wyświetla blok konfiguracji `oauth` z tokenem odświeżania. Dodaj `--manual`, aby użyć przepływu kopiowania i wklejania, gdy przeglądarka nie może uzyskać dostępu do lokalnego wywołania zwrotnego:

```bash
OPENCLAW_GOOGLE_MEET_CLIENT_ID="your-client-id" \
OPENCLAW_GOOGLE_MEET_CLIENT_SECRET="your-client-secret" \
openclaw googlemeet auth login --json --manual
```

Dane wyjściowe JSON:

```json
{
  "oauth": {
    "clientId": "your-client-id",
    "clientSecret": "your-client-secret",
    "refreshToken": "refresh-token",
    "accessToken": "access-token",
    "expiresAt": 1770000000000
  },
  "scope": "..."
}
```

Zapisz obiekt `oauth` w konfiguracji Pluginu:

```json5
{
  plugins: {
    entries: {
      "google-meet": {
        enabled: true,
        config: {
          oauth: {
            clientId: "your-client-id",
            clientSecret: "your-client-secret",
            refreshToken: "refresh-token",
          },
        },
      },
    },
  },
}
```

Jeśli token odświeżania nie powinien znajdować się w konfiguracji, preferuj zmienne środowiskowe; najpierw rozpoznawana jest konfiguracja, a następnie jako rozwiązanie zapasowe środowisko. Jeśli uwierzytelnienie przeprowadzono, zanim dostępna była obsługa tworzenia spotkań, wyszukiwania w kalendarzu lub eksportu treści dokumentów, uruchom ponownie `openclaw googlemeet auth login --json`, aby token odświeżania obejmował aktualny zestaw zakresów.

### Weryfikowanie OAuth za pomocą narzędzia doctor

```bash
openclaw googlemeet doctor --oauth --json
```

Sprawdza to, czy istnieje konfiguracja OAuth i czy token odświeżania może wygenerować token dostępu, bez ładowania środowiska wykonawczego Chrome ani wymagania połączonego Node'a. Raport zawiera wyłącznie pola stanu (`ok`, `configured`, `tokenSource`, `expiresAt`, komunikaty kontroli) i nigdy nie wyświetla tokenu dostępu, tokenu odświeżania ani sekretu klienta.

| Kontrola             | Znaczenie                                                                          |
| -------------------- | -------------------------------------------------------------------------------- |
| `oauth-config`       | Obecne są `oauth.clientId` oraz `oauth.refreshToken` albo token dostępu z pamięci podręcznej |
| `oauth-token`        | Token dostępu z pamięci podręcznej jest nadal ważny lub token odświeżania wygenerował nowy    |
| `meet-spaces-get`    | Opcjonalna kontrola `--meeting` rozpoznała istniejącą przestrzeń Meet                       |
| `meet-spaces-create` | Opcjonalna kontrola `--create-space` utworzyła nową przestrzeń Meet                         |

Potwierdź włączenie Meet API i zakres `spaces.create` za pomocą testu tworzenia powodującego efekt uboczny:

```bash
openclaw googlemeet doctor --oauth --create-space --json
```

Potwierdź dostęp do odczytu istniejącej przestrzeni:

```bash
openclaw googlemeet doctor --oauth --meeting https://meet.google.com/abc-defg-hij --json
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
```

Błąd `403` zwracany przez te testy zwykle oznacza, że Meet REST API jest wyłączone, token odświeżania nie ma wymaganego zakresu albo konto Google nie ma dostępu do tej przestrzeni. Błąd tokenu odświeżania oznacza, że należy ponownie uruchomić `openclaw googlemeet auth login --json` i zapisać nowy blok `oauth`.

OAuth nie jest potrzebne w przypadku mechanizmu zastępczego opartego na przeglądarce; uwierzytelnianie Google pochodzi wtedy z profilu Chrome zalogowanego na wybranym węźle, a nie z konfiguracji OpenClaw.

Następujące zmienne środowiskowe są akceptowane jako wartości zastępcze:

- `OPENCLAW_GOOGLE_MEET_CLIENT_ID` lub `GOOGLE_MEET_CLIENT_ID`
- `OPENCLAW_GOOGLE_MEET_CLIENT_SECRET` lub `GOOGLE_MEET_CLIENT_SECRET`
- `OPENCLAW_GOOGLE_MEET_REFRESH_TOKEN` lub `GOOGLE_MEET_REFRESH_TOKEN`
- `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN` lub `GOOGLE_MEET_ACCESS_TOKEN`
- `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT` lub `GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT`
- `OPENCLAW_GOOGLE_MEET_DEFAULT_MEETING` lub `GOOGLE_MEET_DEFAULT_MEETING`
- `OPENCLAW_GOOGLE_MEET_PREVIEW_ACK` lub `GOOGLE_MEET_PREVIEW_ACK`

### Rozwiązywanie, kontrola wstępna i odczytywanie artefaktów

```bash
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet preflight --meeting https://meet.google.com/abc-defg-hij
```

Po utworzeniu przez Meet rekordów konferencji:

```bash
openclaw googlemeet artifacts --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet attendance --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet export --meeting https://meet.google.com/abc-defg-hij --output ./meet-export
```

W przypadku `--meeting`, `artifacts` i `attendance` domyślnie używany jest najnowszy rekord konferencji; należy przekazać `--all-conference-records`, aby uwzględnić każdy zachowany rekord.

Wyszukiwanie w kalendarzu rozwiązuje adres URL spotkania za pomocą Google Calendar przed odczytaniem artefaktów (wymaga tokenu odświeżania obejmującego zakres tylko do odczytu wydarzeń Kalendarza):

```bash
openclaw googlemeet latest --today
openclaw googlemeet calendar-events --today --json
openclaw googlemeet artifacts --event "Weekly sync"
openclaw googlemeet attendance --today --format csv --output attendance.csv
```

`--today` przeszukuje dzisiejszy kalendarz `primary` w celu znalezienia wydarzenia z linkiem Meet; `--event <query>` wyszukuje pasujący tekst wydarzenia; `--calendar <id>` wskazuje kalendarz inny niż główny. `calendar-events` wyświetla podgląd pasujących wydarzeń i oznacza, które z nich wybiorą `latest`/`artifacts`/`attendance`/`export`.

Jeśli identyfikator rekordu konferencji jest już znany, można odwołać się do niego bezpośrednio:

```bash
openclaw googlemeet latest --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet artifacts --conference-record conferenceRecords/abc123 --json
openclaw googlemeet attendance --conference-record conferenceRecords/abc123 --json
```

Zamknij pokój przestrzeni utworzonej przez API:

```bash
openclaw googlemeet end-active-conference https://meet.google.com/abc-defg-hij
```

Wywołuje `spaces.endActiveConference` i wymaga OAuth z zakresem `meetings.space.created` dla przestrzeni, którą autoryzowane konto może zarządzać. Akceptuje adres URL Meet, kod spotkania lub `spaces/{id}`, a następnie najpierw rozwiązuje go do zasobu przestrzeni API. Jest to niezależne od `googlemeet leave`: `leave` kończy lokalny udział OpenClaw lub udział w sesji; `end-active-conference` zleca Google Meet zakończenie aktywnej konferencji w tej przestrzeni.

Zapisz czytelny raport:

```bash
openclaw googlemeet artifacts --conference-record conferenceRecords/abc123 \
  --format markdown --output meet-artifacts.md
openclaw googlemeet attendance --conference-record conferenceRecords/abc123 \
  --format csv --output meet-attendance.csv
openclaw googlemeet export --conference-record conferenceRecords/abc123 \
  --include-doc-bodies --zip --output meet-export
openclaw googlemeet export --conference-record conferenceRecords/abc123 \
  --include-doc-bodies --dry-run
```

`artifacts` zwraca metadane rekordu konferencji oraz metadane zasobów uczestników, nagrań, transkrypcji, ustrukturyzowanych wpisów transkrypcji i inteligentnych notatek, gdy Google je udostępnia. `--no-transcript-entries` pomija wyszukiwanie wpisów w przypadku dużych spotkań. `attendance` rozwija uczestników do wierszy sesji uczestników zawierających czas pierwszej i ostatniej obecności, łączny czas trwania sesji, flagi spóźnienia i wcześniejszego opuszczenia oraz scala zduplikowane zasoby uczestników według zalogowanego użytkownika lub nazwy wyświetlanej; `--no-merge-duplicates` zachowuje nieprzetworzone zasoby oddzielnie, a `--late-after-minutes`/`--early-before-minutes` dostosowują wartości progowe.

`export` zapisuje folder zawierający `summary.md`, `attendance.csv`, `transcript.md`, `artifacts.json`, `attendance.json` i `manifest.json`. `manifest.json` rejestruje wybrane dane wejściowe, opcje eksportu, rekordy konferencji, pliki wyjściowe, liczby, źródło tokenu, użyte wydarzenie Kalendarza oraz ostrzeżenia o częściowym pobraniu. `--zip` zapisuje również przenośne archiwum obok folderu. `--include-doc-bodies` eksportuje tekst powiązanych Dokumentów Google z transkrypcjami i inteligentnymi notatkami za pośrednictwem Drive `files.export` (wymaga zakresu Drive Meet tylko do odczytu); bez niego eksport obejmuje wyłącznie metadane Meet i ustrukturyzowane wpisy transkrypcji. Częściowy błąd artefaktu (błąd wyświetlania listy inteligentnych notatek, wpisu transkrypcji lub treści dokumentu) zachowuje ostrzeżenie w podsumowaniu/manifeście zamiast powodować niepowodzenie całego eksportu. `--dry-run` pobiera te same dane i wyświetla manifest w formacie JSON bez tworzenia folderu ani pliku ZIP.

Agenci korzystają z tych samych działań za pośrednictwem narzędzia `google_meet` (`export`, `create` z `accessType`, `end_active_conference`, `test_listen`); zobacz [Narzędzie](#tool).

### Test dymny na żywo

```bash
OPENCLAW_LIVE_TEST=1 \
OPENCLAW_GOOGLE_MEET_LIVE_MEETING=https://meet.google.com/abc-defg-hij \
pnpm test:live -- extensions/google-meet/google-meet.live.test.ts
```

```bash
openclaw googlemeet setup --transport chrome-node --mode transcribe
openclaw googlemeet test-listen https://meet.google.com/abc-defg-hij --transport chrome-node --timeout-ms 30000
```

| Zmienna                                                                                                                  | Przeznaczenie                                                                |
| ------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| `OPENCLAW_LIVE_TEST=1`                                                                                                    | Włącza zabezpieczone testy na żywo                                             |
| `OPENCLAW_GOOGLE_MEET_LIVE_MEETING`                                                                                       | Zachowany adres URL Meet, kod lub `spaces/{id}`                              |
| `OPENCLAW_GOOGLE_MEET_CLIENT_ID` / `GOOGLE_MEET_CLIENT_ID`                                                                | Identyfikator klienta OAuth                                                        |
| `OPENCLAW_GOOGLE_MEET_REFRESH_TOKEN` / `GOOGLE_MEET_REFRESH_TOKEN`                                                        | Token odświeżania                                                          |
| `OPENCLAW_GOOGLE_MEET_CLIENT_SECRET`, `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN`, `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT` | Opcjonalne; działają również te same nazwy zastępcze bez prefiksu `OPENCLAW_` |

Podstawowy test dymny artefaktów/obecności wymaga `meetings.space.readonly` i `meetings.conference.media.readonly`. Wyszukiwanie w kalendarzu wymaga `calendar.events.readonly`. Eksport treści dokumentów z Drive wymaga `drive.meet.readonly`.

### Przykłady tworzenia

```bash
openclaw googlemeet create
```

Wyświetla identyfikator URI nowego spotkania, źródło i sesję dołączania. Z OAuth używa Meet API; bez niego korzysta z zalogowanego profilu przypiętego węzła Chrome. JSON mechanizmu zastępczego przeglądarki:

```json
{
  "source": "browser",
  "meetingUri": "https://meet.google.com/abc-defg-hij",
  "joined": true,
  "browser": {
    "nodeId": "ba0f4e4bc...",
    "targetId": "tab-1"
  },
  "join": {
    "session": {
      "id": "meet_...",
      "url": "https://meet.google.com/abc-defg-hij"
    }
  }
}
```

Jeśli mechanizm zastępczy przeglądarki najpierw napotka ekran logowania Google lub blokadę uprawnień Meet, `google_meet` zwraca ustrukturyzowane szczegóły zamiast zwykłego ciągu znaków:

```json
{
  "source": "browser",
  "error": "google-login-required: Sign in to Google in the OpenClaw browser profile, then retry meeting creation.",
  "manualActionRequired": true,
  "manualActionReason": "google-login-required",
  "manualActionMessage": "Sign in to Google in the OpenClaw browser profile, then retry meeting creation.",
  "browser": {
    "nodeId": "ba0f4e4bc...",
    "targetId": "tab-1",
    "browserUrl": "https://accounts.google.com/signin",
    "browserTitle": "Sign in - Google Accounts"
  }
}
```

JSON tworzenia przez API:

```json
{
  "source": "api",
  "meetingUri": "https://meet.google.com/abc-defg-hij",
  "joined": true,
  "space": {
    "name": "spaces/abc-defg-hij",
    "meetingCode": "abc-defg-hij",
    "meetingUri": "https://meet.google.com/abc-defg-hij"
  },
  "join": {
    "session": {
      "id": "meet_...",
      "url": "https://meet.google.com/abc-defg-hij"
    }
  }
}
```

Tworzenie domyślnie dołącza do spotkania, ale Chrome/Chrome-node nadal wymaga zalogowanego profilu Google, aby dołączyć przez przeglądarkę; jeśli profil jest wylogowany, OpenClaw zgłasza `manualActionRequired: true` lub błąd mechanizmu zastępczego przeglądarki i prosi operatora o dokończenie logowania do Google przed ponowną próbą.

Ustaw `preview.enrollmentAcknowledged: true` dopiero po potwierdzeniu, że projekt Cloud, podmiot OAuth i uczestnicy spotkania są zarejestrowani w programie Google Workspace Developer Preview Program dla interfejsów Meet Media API.

## Konfiguracja

Typowa ścieżka agenta Chrome wymaga jedynie włączonego pluginu, BlackHole, SoX, klucza dostawcy czasu rzeczywistego oraz skonfigurowanego dostawcy TTS OpenClaw:

```json5
{
  plugins: {
    entries: {
      "google-meet": {
        enabled: true,
        config: {},
      },
    },
  },
}
```

### Wartości domyślne

| Klucz                               | Wartość domyślna                                  | Uwagi                                                                                                                                                                                                             |
| --------------------------------- | ---------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `defaultTransport`                | `"chrome"`                               |                                                                                                                                                                                                                   |
| `defaultMode`                     | `"agent"`                                | `"realtime"` jest akceptowane jako starszy alias dla `"agent"`; nowe wywołania powinny używać `"agent"`                                                                                                                        |
| `chromeNode.node`                 | nieustawione                                    | Identyfikator/nazwa/adres IP Node dla `chrome-node`; wymagane, gdy może być połączony więcej niż jeden odpowiedni Node                                                                                                                      |
| `chrome.launch`                   | `true`                                   | Uruchamia Chrome w celu dołączenia; `false` należy ustawić tylko w przypadku ponownego użycia już otwartej sesji                                                                                                                                 |
| `chrome.audioBackend`             | `"blackhole-2ch"`                        |                                                                                                                                                                                                                   |
| `chrome.guestName`                | `"OpenClaw Agent"`                       | Wyświetlane na ekranie gościa Meet bez zalogowania                                                                                                                                                                         |
| `chrome.autoJoin`                 | `true`                                   | Próbuje uzupełnić nazwę gościa i kliknąć Join Now w `chrome-node`                                                                                                                                                   |
| `chrome.reuseExistingTab`         | `true`                                   | Aktywuje istniejącą kartę Meet zamiast otwierać duplikaty                                                                                                                                                      |
| `chrome.waitForInCallMs`          | `20000`                                  | Czeka, aż karta Meet zgłosi trwające połączenie, zanim zostanie odtworzone wprowadzenie głosowe                                                                                                                                          |
| `chrome.audioFormat`              | `"pcm16-24khz"`                          | Format dźwięku pary poleceń; `"g711-ulaw-8khz"` służy wyłącznie do starszych/niestandardowych par poleceń generujących dźwięk telefoniczny                                                                                                   |
| `chrome.audioBufferBytes`         | `4096`                                   | Bufor przetwarzania SoX dla generowanych poleceń dźwiękowych pary poleceń (połowa domyślnego bufora SoX wynoszącego 8192 bajty, co zmniejsza opóźnienie potoku); wartości są ograniczane do minimum 17 bajtów                                         |
| `chrome.audioInputCommand`        | wygenerowane polecenie SoX                    | Odczytuje z CoreAudio `BlackHole 2ch`, zapisuje dźwięk w `chrome.audioFormat`                                                                                                                                        |
| `chrome.audioOutputCommand`       | wygenerowane polecenie SoX                    | Odczytuje dźwięk w `chrome.audioFormat`, zapisuje do CoreAudio `BlackHole 2ch`                                                                                                                                          |
| `chrome.bargeInInputCommand`      | nieustawione                                    | Opcjonalne lokalne polecenie mikrofonu zapisujące jednokanałowy PCM ze znakiem, 16-bitowy, little-endian, służący do wykrywania przerwania przez człowieka podczas odtwarzania odpowiedzi asystenta; dotyczy mostu pary poleceń hostowanego przez Gateway                          |
| `chrome.bargeInRmsThreshold`      | `650`                                    | Poziom RMS uznawany za przerwanie przez człowieka                                                                                                                                                                           |
| `chrome.bargeInPeakThreshold`     | `2500`                                   | Poziom szczytowy uznawany za przerwanie przez człowieka                                                                                                                                                                          |
| `chrome.bargeInCooldownMs`        | `900`                                    | Minimalne opóźnienie między kolejnymi wyczyszczeniami przerwania                                                                                                                                                                |
| `mode` (dla każdego żądania)              | `"agent"`                                | Tryb odpowiedzi głosowej; zobacz tabelę [Tryby agenta i dwukierunkowe](#agent-and-bidi-modes)                                                                                                                                       |
| `realtime.provider`               | `"openai"`                               | Zgodnościowy mechanizm rezerwowy używany, gdy poniższe pola o ograniczonym zakresie są nieustawione                                                                                                                                                |
| `realtime.transcriptionProvider`  | `"openai"`                               | Identyfikator dostawcy używany przez tryb `agent` do transkrypcji w czasie rzeczywistym                                                                                                                                                       |
| `realtime.voiceProvider`          | nieustawione                                    | Identyfikator dostawcy używany przez tryb `bidi` do bezpośredniej komunikacji głosowej w czasie rzeczywistym; ustaw `"google"` dla Gemini Live, zachowując transkrypcję trybu agenta w OpenAI. Połącz z `realtime.model`, aby wybrać konkretny model Gemini Live. |
| `realtime.toolPolicy`             | `"safe-read-only"`                       | Zobacz [Tryby agenta i dwukierunkowe](#agent-and-bidi-modes)                                                                                                                                                                 |
| `realtime.instructions`           | instrukcje dotyczące krótkich odpowiedzi głosowych          | Nakazuje modelowi wypowiadać się krótko i używać `openclaw_agent_consult` do udzielania bardziej szczegółowych odpowiedzi                                                                                                                              |
| `realtime.introMessage`           | `"Say exactly: I'm here and listening."` | Wypowiadane raz po połączeniu mostu czasu rzeczywistego; ustaw `""`, aby dołączyć bezgłośnie                                                                                                                                       |
| `realtime.agentId`                | `"main"`                                 | Identyfikator agenta OpenClaw używany dla `openclaw_agent_consult`                                                                                                                                                               |
| `voiceCall.enabled`               | `true`                                   | Deleguje połączenie Twilio PSTN, DTMF i powitanie wstępne do pluginu Voice Call                                                                                                                                 |
| `voiceCall.dtmfDelayMs`           | `12000`                                  | Początkowe oczekiwanie przed odtworzeniem przez Twilio sekwencji DTMF utworzonej na podstawie kodu PIN                                                                                                                                               |
| `voiceCall.postDtmfSpeechDelayMs` | `5000`                                   | Opóźnienie przed zażądaniem powitania wstępnego w czasie rzeczywistym po rozpoczęciu przez Voice Call części połączenia Twilio                                                                                                                        |

`chrome.audioBridgeCommand` i `chrome.audioBridgeHealthCommand` pozwalają zewnętrznemu mostowi zarządzać całą lokalną ścieżką dźwiękową zamiast `chrome.audioInputCommand`/`chrome.audioOutputCommand`; ograniczenie dotyczące trybu, w którym można ich używać, opisano w sekcji [Uwagi](#notes).

Istnieje migracja `openclaw doctor --fix` dla starszej struktury `realtime.provider: "google"`: przenosi ona tę intencję do `realtime.voiceProvider: "google"` oraz `realtime.transcriptionProvider: "openai"`, jeśli te pola nie są jeszcze ustawione.

### Opcjonalne nadpisania

```json5
{
  defaults: {
    meeting: "https://meet.google.com/abc-defg-hij",
  },
  browser: {
    defaultProfile: "openclaw",
  },
  chrome: {
    guestName: "OpenClaw Agent",
    waitForInCallMs: 30000,
    bargeInInputCommand: [
      "sox",
      "-q",
      "-t",
      "coreaudio",
      "External Microphone",
      "-r",
      "24000",
      "-c",
      "1",
      "-b",
      "16",
      "-e",
      "signed-integer",
      "-t",
      "raw",
      "-",
    ],
  },
  chromeNode: {
    node: "parallels-macos",
  },
  defaultMode: "agent",
  realtime: {
    provider: "openai",
    transcriptionProvider: "openai",
    voiceProvider: "google",
    model: "gemini-3.1-flash-live-preview",
    agentId: "jay",
    toolPolicy: "owner",
    introMessage: "Say exactly: I'm here.",
    providers: {
      google: {
        speakerVoice: "Kore",
      },
    },
  },
}
```

ElevenLabs do słuchania i mówienia w trybie agenta:

```json5
{
  messages: {
    tts: {
      provider: "elevenlabs",
      providers: {
        elevenlabs: {
          modelId: "eleven_v3",
          speakerVoiceId: "pMsXgVXv3BLzUgSXRplE",
        },
      },
    },
  },
  plugins: {
    entries: {
      "google-meet": {
        config: {
          realtime: {
            transcriptionProvider: "elevenlabs",
            providers: {
              elevenlabs: {
                modelId: "scribe_v2_realtime",
                audioFormat: "ulaw_8000",
                sampleRate: 8000,
                commitStrategy: "vad",
              },
            },
          },
        },
      },
    },
  },
}
```

Stały głos Meet pochodzi z `messages.tts.providers.elevenlabs.speakerVoiceId`. Odpowiedzi agenta mogą również używać dyrektyw `[[tts:speakerVoiceId=... model=eleven_v3]]` dla poszczególnych odpowiedzi, gdy włączone jest nadpisywanie modelu TTS, ale konfiguracja stanowi deterministyczną wartość domyślną dla spotkań. Podczas dołączania dzienniki pokazują `transcriptionProvider=elevenlabs`, a każda odpowiedź głosowa jest rejestrowana jako `provider=elevenlabs model=eleven_v3 speakerVoiceId=<voiceId>`.

Konfiguracja wyłącznie dla Twilio:

```json5
{
  defaultTransport: "twilio",
  twilio: {
    defaultDialInNumber: "+15551234567",
    defaultPin: "123456",
  },
  voiceCall: {
    gatewayUrl: "ws://127.0.0.1:18789",
  },
}
```

Przy `voiceCall.enabled: true` (wartości domyślnej) i transporcie Twilio plugin Voice Call wysyła sekwencję DTMF przed otwarciem strumienia multimediów czasu rzeczywistego, a następnie używa zapisanego tekstu wprowadzenia jako początkowego powitania w czasie rzeczywistym. Jeśli `voice-call` nie jest włączone, Google Meet nadal może sprawdzić i zarejestrować plan wybierania, ale nie może nawiązać połączenia Twilio.

Pozostaw `voiceCall.gatewayUrl` bez ustawienia, aby używać lokalnego zaufanego środowiska uruchomieniowego Gateway, które zachowuje
agenta wywołującego przez cały czas trwania wywołania. Skonfigurowany adres URL Gateway pozostaje jawnym celem WebSocket i
nie może uwierzytelnić pochodzenia pluginu; dołączenie agenta innego niż domyślny kończy się bezpiecznym niepowodzeniem zamiast cichego
użycia innego agenta. Gdy wymagane jest kierowanie według agentów, uruchom Google Meet i Voice Call w tym samym procesie Gateway.

## Narzędzie

Agenci używają narzędzia `google_meet`:

```json
{
  "action": "join",
  "url": "https://meet.google.com/abc-defg-hij",
  "transport": "chrome-node",
  "mode": "agent"
}
```

| `action`                | Przeznaczenie                                                                                           |
| ----------------------- | ------------------------------------------------------------------------------------------------- |
| `join`                  | Dołączenie przy użyciu jawnego adresu URL Meet                                                                         |
| `create`                | Utworzenie przestrzeni (i domyślnie dołączenie); obsługuje `accessType`/`entryPointAccess`                    |
| `status`                | Wyświetlenie aktywnych sesji lub sprawdzenie jednej według `sessionId`                                               |
| `setup_status`          | Uruchomienie tych samych kontroli co `googlemeet setup`                                                         |
| `resolve_space`         | Rozpoznanie adresu URL/kodu/`spaces/{id}` za pomocą `spaces.get`                                                 |
| `preflight`             | Weryfikacja OAuth i wymagań wstępnych rozpoznawania spotkania                                                 |
| `latest`                | Znalezienie najnowszego rekordu konferencji dla spotkania                                                   |
| `calendar_events`       | Podgląd wydarzeń Kalendarza z linkami Meet                                                           |
| `artifacts`             | Wyświetlenie rekordów konferencji oraz metadanych uczestników/nagrań/transkrypcji/inteligentnych notatek                  |
| `attendance`            | Wyświetlenie uczestników i sesji uczestników                                                        |
| `export`                | Zapisanie pakietu artefaktów/obecności/transkrypcji/manifestu; ustaw `"dryRun": true`, aby zapisać tylko manifest |
| `recover_current_tab`   | Uaktywnienie/sprawdzenie istniejącej karty Meet bez otwierania nowej                                      |
| `transcript`            | Odczyt ograniczonej transkrypcji napisów; `sinceIndex` wznawia od poprzedniego `nextIndex`           |
| `leave`                 | Zakończenie sesji (Chrome klika przycisk opuszczenia; zamyka tylko otwarte przez siebie karty; Twilio kończy połączenie)                  |
| `end_active_conference` | Zakończenie aktywnej konferencji Google Meet w przestrzeni zarządzanej przez API                                    |
| `speak`                 | Natychmiastowe odtworzenie wypowiedzi przez agenta czasu rzeczywistego na podstawie `sessionId` i `message`                        |
| `test_speech`           | Utworzenie/ponowne użycie sesji, wywołanie znanej frazy i zwrócenie stanu Chrome                              |
| `test_listen`           | Utworzenie/ponowne użycie sesji wyłącznie obserwacyjnej i oczekiwanie na zmianę napisów/transkrypcji                        |

`test_speech` zawsze wymusza `mode: "agent"` lub `"bidi"` i kończy się niepowodzeniem przy próbie uruchomienia w trybie `mode: "transcribe"`, ponieważ sesje wyłącznie obserwacyjne nie mogą emitować mowy. Wynik `speechOutputVerified` opiera się na wzroście liczby bajtów wyjściowego dźwięku czasu rzeczywistego podczas tego wywołania, dlatego ponownie użyta sesja ze starszym dźwiękiem nie jest uznawana za nową kontrolę.

W przypadku transportów Chrome `leave` pozostawia otwartą ponownie używaną kartę należącą do użytkownika po kliknięciu przycisku opuszczenia rozmowy w Meet. Karty otwarte przez OpenClaw są zamykane po opuszczeniu spotkania.

Użyj `transport: "chrome"`, gdy Chrome działa na hoście Gateway, a `transport: "chrome-node"`, gdy działa na sparowanym Node. W obu przypadkach dostawcy modeli i `openclaw_agent_consult` działają na hoście Gateway, więc dane uwierzytelniające modeli pozostają na nim. Dzienniki trybu agenta zawierają rozpoznanego dostawcę/model transkrypcji podczas uruchamiania mostka oraz dostawcę/model/głos/format wyjściowy/częstotliwość próbkowania TTS po każdej zsyntetyzowanej odpowiedzi. Surowa wartość `mode: "realtime"` jest nadal akceptowana jako starszy alias zgodności dla `mode: "agent"`, ale nie jest już ogłaszana w wyliczeniu `mode` narzędzia.

`create` z pokojem obsługiwanym przez API i jawną polityką dostępu:

```json
{
  "action": "create",
  "transport": "chrome-node",
  "mode": "agent",
  "accessType": "OPEN"
}
```

Kończenie aktywnej konferencji w znanym pokoju:

```json
{
  "action": "end_active_conference",
  "meeting": "https://meet.google.com/abc-defg-hij"
}
```

Walidacja najpierw przez nasłuchiwanie przed uznaniem spotkania za użyteczne:

```json
{
  "action": "test_listen",
  "url": "https://meet.google.com/abc-defg-hij",
  "transport": "chrome-node",
  "timeoutMs": 30000
}
```

Mówienie na żądanie:

```json
{
  "action": "speak",
  "sessionId": "meet_...",
  "message": "Powiedz dokładnie: Jestem tutaj i słucham."
}
```

`status` zawiera stan Chrome, gdy jest dostępny:

| Pole                                                                 | Znaczenie                                                                                                                |
| --------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `inCall`                                                              | Wygląda na to, że Chrome znajduje się w rozmowie Meet                                                                              |
| `micMuted`                                                            | Ustalony z dołożeniem starań stan mikrofonu Meet                                                                                      |
| `manualActionRequired` / `manualActionReason` / `manualActionMessage` | Profil przeglądarki wymaga ręcznego zalogowania, wpuszczenia przez gospodarza Meet, nadania uprawnień lub naprawy sterowania przeglądarką, zanim mowa będzie mogła działać |
| `speechReady` / `speechBlockedReason` / `speechBlockedMessage`        | Czy zarządzana mowa Chrome jest obecnie dozwolona; `speechReady: false` oznacza, że OpenClaw nie wysłał frazy wprowadzającej/testowej   |
| `providerConnected` / `realtimeReady`                                 | Stan mostka głosowego czasu rzeczywistego                                                                                            |
| `lastInputAt` / `lastOutputAt`                                        | Ostatni dźwięk odebrany z mostka/wysłany do niego                                                                                |
| `audioOutputRouted` / `audioOutputDeviceLabel`                        | Czy wyjście multimediów karty Meet było aktywnie kierowane do urządzenia BlackHole mostka                               |
| `lastSuppressedInputAt` / `suppressedInputBytes`                      | Wejście pętli zwrotnej ignorowane podczas aktywnego odtwarzania dźwięku asystenta                                                              |

## Tryby agenta i bidi

| Tryb    | Kto decyduje o odpowiedzi        | Ścieżka wyjścia mowy                     | Zastosowanie                                              |
| ------- | ----------------------------- | -------------------------------------- | ----------------------------------------------------- |
| `agent` | Skonfigurowany agent OpenClaw | Zwykłe środowisko uruchomieniowe TTS OpenClaw            | Gdy potrzebne jest zachowanie „mój agent jest na spotkaniu”        |
| `bidi`  | Model głosowy czasu rzeczywistego      | Odpowiedź dźwiękowa dostawcy głosu czasu rzeczywistego | Gdy potrzebna jest konwersacyjna pętla głosowa o najmniejszym opóźnieniu |

Tryb `agent`: dostawca transkrypcji czasu rzeczywistego odbiera dźwięk spotkania, końcowe transkrypcje uczestników są kierowane przez skonfigurowanego agenta OpenClaw, a odpowiedź jest wypowiadana za pomocą standardowego TTS OpenClaw. Sąsiadujące fragmenty końcowej transkrypcji są scalane przed konsultacją, aby jedna wypowiedź nie generowała kilku nieaktualnych częściowych odpowiedzi; wejście czasu rzeczywistego jest wstrzymywane, dopóki dźwięk asystenta w kolejce nadal jest odtwarzany, a niedawne echa transkrypcji przypominające wypowiedzi asystenta są ignorowane przed konsultacją, aby pętla zwrotna BlackHole nie powodowała odpowiadania agenta na własną mowę.

Tryb `bidi`: model głosowy czasu rzeczywistego odpowiada bezpośrednio i może wywołać `openclaw_agent_consult`, aby uzyskać pogłębione rozumowanie, aktualne informacje lub zwykłe narzędzia OpenClaw. Narzędzie konsultacyjne uruchamia w tle zwykłego agenta OpenClaw z kontekstem niedawnej transkrypcji spotkania i zwraca zwięzłą odpowiedź do wypowiedzenia; w trybie `agent` OpenClaw wysyła tę odpowiedź bezpośrednio do TTS, a w trybie `bidi` model głosowy czasu rzeczywistego może ją wypowiedzieć. Używa tego samego współdzielonego mechanizmu konsultacji co Voice Call.

Domyślnie konsultacje są uruchamiane względem agenta `main`; ustaw `realtime.agentId`, aby skierować kanał Meet do dedykowanego obszaru roboczego agenta, domyślnych modeli, polityki narzędzi, pamięci i historii sesji. Konsultacje w trybie agenta używają klucza sesji `agent:<id>:subagent:google-meet:<session>` przypisanego do spotkania, dzięki czemu pytania uzupełniające zachowują kontekst spotkania, a jednocześnie dziedziczą zwykłą politykę agenta. Gdy agent wywołuje `google_meet` w trybie agenta, sesja konsultanta tworzy odgałęzienie bieżącej transkrypcji wywołującego przed odpowiedzią na wypowiedź uczestnika; sesja Meet pozostaje oddzielna, więc pytania uzupełniające ze spotkania nie modyfikują bezpośrednio transkrypcji wywołującego.

`realtime.toolPolicy` steruje przebiegiem konsultacji:

| Polityka           | Zachowanie                                                                                                                         |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `safe-read-only` | Udostępnienie narzędzia konsultacyjnego; ograniczenie zwykłego agenta do `read`, `web_search`, `web_fetch`, `x_search`, `memory_search`, `memory_get` |
| `owner`          | Udostępnienie narzędzia konsultacyjnego; zezwolenie zwykłemu agentowi na używanie jego normalnej polityki narzędzi                                                        |
| `none`           | Nieudostępnianie narzędzia konsultacyjnego modelowi głosowemu czasu rzeczywistego                                                                       |

Klucz sesji konsultacji ma zakres pojedynczej sesji Meet, dlatego kolejne wywołania konsultacji podczas tego samego spotkania ponownie wykorzystują wcześniejszy kontekst konsultacji.

Wymuszenie głosowej kontroli gotowości po pełnym dołączeniu Chrome:

```bash
openclaw googlemeet speak meet_... "Say exactly: I'm here and listening."
```

Pełny test dymny dołączenia i mówienia:

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij \
  --transport chrome-node \
  --message "Say exactly: I'm here and listening."
```

## Lista kontrolna testu na żywo

Przed przekazaniem spotkania agentowi działającemu bez nadzoru:

```bash
openclaw googlemeet setup
openclaw nodes status
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij \
  --transport chrome-node \
  --message "Say exactly: Google Meet speech test complete."
```

Oczekiwany stan Chrome-node:

- `googlemeet setup` ma wszystkie wskaźniki zielone i zawiera `chrome-node-connected`, gdy Chrome-node jest domyślnym transportem lub przypięto Node.
- `nodes status` pokazuje wybrany połączony Node, ogłaszający zarówno `googlemeet.chrome`, jak i `browser.proxy`.
- Karta Meet dołącza, a `test-speech` zwraca stan Chrome z `inCall: true`.

W przypadku zdalnego hosta Chrome, takiego jak maszyna wirtualna Parallels z macOS, najkrótsza bezpieczna kontrola po aktualizacji Gateway lub maszyny wirtualnej:

```bash
openclaw googlemeet setup
openclaw nodes status --connected
openclaw nodes invoke \
  --node parallels-macos \
  --command googlemeet.chrome \
  --params '{"action":"setup"}'
```

Dowodzi to, że plugin Gateway został załadowany, Node maszyny wirtualnej jest połączony z użyciem bieżącego tokenu, a mostek dźwiękowy Meet jest dostępny, zanim agent otworzy kartę rzeczywistego spotkania.

W przypadku testu dymnego Twilio użyj spotkania udostępniającego dane telefoniczne do dołączenia:

```bash
openclaw googlemeet setup
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --pin 123456
```

Oczekiwany stan Twilio:

- `googlemeet setup` obejmuje pomyślne testy `twilio-voice-call-plugin`, `twilio-voice-call-credentials` i `twilio-voice-call-webhook`.
- `voicecall` jest dostępne w CLI po ponownym wczytaniu Gateway.
- Zwrócona sesja ma `transport: "twilio"` oraz `twilio.voiceCallId`.
- `openclaw logs --follow` pokazuje, że TwiML DTMF jest udostępniany przed TwiML czasu rzeczywistego, a następnie ustanawiany jest most czasu rzeczywistego z powitaniem dodanym do kolejki.
- `googlemeet leave <sessionId>` rozłącza delegowane połączenie głosowe.

## Rozwiązywanie problemów

### Agent nie widzi narzędzia Google Meet

Należy potwierdzić, że plugin jest włączony, i ponownie wczytać Gateway; działający agent widzi tylko narzędzia pluginów zarejestrowane przez bieżący proces Gateway:

```bash
openclaw plugins list | grep google-meet
openclaw googlemeet setup
```

Na hostach Gateway innych niż macOS opcja `google_meet` pozostaje widoczna, ale lokalne działania zwrotnego przesyłania mowy w Chrome są blokowane, zanim dotrą do mostu audio. Zamiast domyślnej ścieżki lokalnego agenta Chrome należy użyć `mode: "transcribe"`, połączenia telefonicznego Twilio lub hosta macOS `chrome-node`.

### Brak połączonego węzła obsługującego Google Meet

Na hoście węzła:

```bash
openclaw plugins enable google-meet
openclaw plugins enable browser
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node run --host <gateway-lan-ip> --port 18789 --display-name parallels-macos
```

Na hoście Gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw nodes status
```

Węzeł musi być połączony i zawierać na liście `googlemeet.chrome` oraz `browser.proxy`; konfiguracja Gateway musi zezwalać na oba polecenia:

```json5
{
  gateway: {
    nodes: {
      allowCommands: ["browser.proxy", "googlemeet.chrome"],
    },
  },
}
```

Jeśli `googlemeet setup` nie przechodzi `chrome-node-connected` lub dziennik Gateway zgłasza `gateway token mismatch`, należy ponownie zainstalować lub uruchomić węzeł z bieżącym tokenem Gateway:

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node install \
  --host <gateway-lan-ip> \
  --port 18789 \
  --display-name parallels-macos \
  --force
```

Następnie należy ponownie wczytać usługę węzła i ponownie uruchomić:

```bash
openclaw googlemeet setup
openclaw nodes status --connected
```

### Przeglądarka się otwiera, ale agent nie może dołączyć

Należy uruchomić `googlemeet test-listen` w celu dołączenia wyłącznie w trybie obserwacji lub `googlemeet test-speech` w celu dołączenia w czasie rzeczywistym, a następnie sprawdzić zwrócony stan Chrome. Jeśli którekolwiek zgłasza `manualActionRequired: true`, należy pokazać operatorowi `manualActionMessage` i nie ponawiać prób do czasu ukończenia działania w przeglądarce.

Typowe działania ręczne: zalogowanie się w profilu Chrome; wpuszczenie gościa z konta gospodarza Meet; przyznanie Chrome uprawnień do mikrofonu i kamery po wyświetleniu natywnego monitu; zamknięcie lub naprawienie zablokowanego okna uprawnień Meet.

Nie należy zgłaszać „braku zalogowania” tylko dlatego, że Meet pyta „Do you want people to hear you in the meeting?”; jest to ekran pośredni wyboru dźwięku w Meet. OpenClaw klika **Use microphone** za pomocą automatyzacji przeglądarki, gdy jest to możliwe, i nadal oczekuje na właściwy stan spotkania; w przypadku awaryjnego użycia przeglądarki wyłącznie do utworzenia spotkania może zamiast tego kliknąć **Continue without microphone**, ponieważ wygenerowanie adresu URL nie wymaga ścieżki dźwięku w czasie rzeczywistym.

### Nie można utworzyć spotkania

`googlemeet create` używa interfejsu Meet API `spaces.create`, gdy skonfigurowano OAuth, a w przeciwnym razie przypiętej przeglądarki Chrome węzła. Należy potwierdzić:

- **Tworzenie przez API**: dostępne są `oauth.clientId` i `oauth.refreshToken` (lub odpowiadające im zmienne środowiskowe `OPENCLAW_GOOGLE_MEET_*`), a token odświeżania został wygenerowany po dodaniu obsługi tworzenia; starsze tokeny mogą nie mieć `meetings.space.created`, dlatego należy ponownie uruchomić `openclaw googlemeet auth login --json`.
- **Awaryjne użycie przeglądarki**: `defaultTransport: "chrome-node"` i `chromeNode.node` wskazują połączony węzeł z `browser.proxy` oraz `googlemeet.chrome`; profil OpenClaw w Chrome na tym węźle jest zalogowany i może otworzyć `https://meet.google.com/new`.
- **Ponawianie awaryjnego użycia przeglądarki**: przed otwarciem nowej karty należy ponownie użyć istniejącej karty `.../new` lub monitu konta Google; należy ponowić wywołanie narzędzia zamiast ręcznie otwierać kolejną kartę.
- **Działanie ręczne**: jeśli narzędzie zwróci `manualActionRequired: true`, należy użyć `browser.nodeId`, `browser.targetId`, `browserUrl` i `manualActionMessage`, aby pokierować operatorem; nie należy ponawiać prób w pętli.
- **Ekran pośredni wyboru dźwięku**: jeśli Meet wyświetla „Do you want people to hear you in the meeting?”, należy pozostawić kartę otwartą. OpenClaw powinien kliknąć **Use microphone** lub — tylko podczas tworzenia — **Continue without microphone** i nadal oczekiwać na wygenerowany adres URL; jeśli nie może tego zrobić, błąd powinien wskazywać `meet-audio-choice-required`, a nie `google-login-required`.

### Agent dołącza, ale nie mówi

```bash
openclaw googlemeet setup
openclaw googlemeet doctor
```

Należy użyć `mode: "agent"` dla ścieżki STT -> agent OpenClaw -> TTS, a `mode: "bidi"` dla bezpośredniego awaryjnego trybu głosowego czasu rzeczywistego. `mode: "transcribe"` celowo nie uruchamia mostu zwrotnego przesyłania mowy. Podczas debugowania wyłącznie w trybie obserwacji należy uruchomić `openclaw googlemeet status --json <session-id>`, gdy uczestnicy zaczną mówić, i sprawdzić `captioning`, `transcriptLines`, `lastCaptionText`. Jeśli `inCall` ma wartość true, ale `transcriptLines` pozostaje `0`, napisy w Meet mogą być wyłączone, nikt nie odezwał się od czasu zainstalowania obserwatora, interfejs Meet mógł się zmienić albo napisy na żywo mogą być niedostępne dla danego języka spotkania lub konta.

`googlemeet test-speech` zawsze sprawdza ścieżkę czasu rzeczywistego i informuje, czy dla danego wywołania zaobserwowano bajty wyjściowe mostu. Jeśli `speechOutputVerified` ma wartość false, a `speechOutputTimedOut` ma wartość true, dostawca czasu rzeczywistego mógł zaakceptować wypowiedź, ale OpenClaw nie wykrył nowych bajtów wyjściowych docierających do mostu audio Chrome.

Należy również sprawdzić: klucz dostawcy czasu rzeczywistego (`OPENAI_API_KEY` lub `GEMINI_API_KEY`) jest dostępny na hoście Gateway; `BlackHole 2ch` jest widoczny na hoście Chrome; istnieje tam `sox`; mikrofon i głośnik Meet są kierowane przez wirtualną ścieżkę audio (`doctor` powinien pokazywać `meet output routed: yes` dla lokalnych połączeń Chrome w czasie rzeczywistym).

`googlemeet doctor [session-id]` wyświetla sesję, węzeł, stan połączenia, przyczynę konieczności ręcznego działania, połączenie z dostawcą czasu rzeczywistego, `realtimeReady`, aktywność wejścia i wyjścia audio, znaczniki czasu ostatniej aktywności audio, liczniki bajtów oraz adres URL przeglądarki. Należy użyć `googlemeet status [session-id] --json` dla nieprzetworzonego formatu JSON oraz `googlemeet doctor --oauth` (z dodatkiem `--meeting` lub `--create-space`), aby zweryfikować odświeżanie OAuth bez ujawniania tokenów.

Jeśli agent przekroczył limit czasu, a karta Meet jest już otwarta, należy ją sprawdzić bez otwierania kolejnej:

```bash
openclaw googlemeet recover-tab
openclaw googlemeet recover-tab https://meet.google.com/abc-defg-hij
```

Odpowiadającym działaniem narzędzia jest `recover_current_tab`: aktywuje ono i sprawdza istniejącą kartę Meet dla wybranego transportu (lokalne sterowanie przeglądarką dla `chrome`, skonfigurowany węzeł dla `chrome-node`) bez otwierania nowej karty ani sesji oraz zgłasza bieżącą przeszkodę (logowanie, wpuszczenie, uprawnienia, stan wyboru dźwięku). Polecenie CLI komunikuje się ze skonfigurowanym Gateway, który musi być uruchomiony; `chrome-node` wymaga również połączenia węzła.

### Testy konfiguracji Twilio kończą się niepowodzeniem

`twilio-voice-call-plugin` kończy się niepowodzeniem, gdy `voice-call` nie jest dozwolone lub włączone: należy dodać je do `plugins.allow`, włączyć `plugins.entries.voice-call` i ponownie wczytać Gateway.

`twilio-voice-call-credentials` kończy się niepowodzeniem, gdy backend Twilio nie ma identyfikatora SID konta, tokenu uwierzytelniającego lub numeru wywołującego:

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
```

`twilio-voice-call-webhook` kończy się niepowodzeniem, gdy `voice-call` nie ma publicznie dostępnego Webhooka lub `publicUrl` wskazuje przestrzeń adresową pętli zwrotnej albo sieci prywatnej. Nie należy używać `localhost`, `127.0.0.1`, `0.0.0.0`, `10.x`, `172.16.x`-`172.31.x`, `192.168.x`, `169.254.x`, `fc00::/7` ani `fd00::/8` jako `publicUrl`; wywołania zwrotne operatora nie mogą dotrzeć do tych adresów. Należy ustawić `plugins.entries.voice-call.config.publicUrl` na publiczny adres URL lub skonfigurować udostępnienie przez tunel/Tailscale:

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        enabled: true,
        config: {
          provider: "twilio",
          fromNumber: "+15550001234",
          publicUrl: "https://voice.example.com/voice/webhook",
        },
      },
    },
  },
}
```

W przypadku programowania lokalnego należy użyć tunelu lub udostępnienia Tailscale zamiast adresu URL prywatnego hosta:

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          tunnel: { provider: "ngrok" },
          // lub
          tailscale: { mode: "funnel", path: "/voice/webhook" },
        },
      },
    },
  },
}
```

Należy ponownie uruchomić lub wczytać Gateway, a następnie wykonać:

```bash
openclaw googlemeet setup --transport twilio
openclaw voicecall setup
openclaw voicecall smoke
```

Domyślnie `voicecall smoke` służy wyłącznie do sprawdzania gotowości. Aby przeprowadzić próbę bez wykonywania połączenia dla określonego numeru:

```bash
openclaw voicecall smoke --to "+15555550123"
```

Opcję `--yes` należy dodać tylko w celu świadomego wykonania rzeczywistego połączenia wychodzącego:

```bash
openclaw voicecall smoke --to "+15555550123" --yes
```

### Połączenie Twilio się rozpoczyna, ale nigdy nie dołącza do spotkania

Należy potwierdzić, że wydarzenie Meet udostępnia dane telefonicznego dołączania, i przekazać dokładny numer telefoniczny oraz PIN lub niestandardową sekwencję DTMF:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --dtmf-sequence ww123456#
```

Aby dodać pauzę przed kodem PIN, należy użyć początkowych znaków `w` lub przecinków w `--dtmf-sequence`.

Jeśli połączenie zostało utworzone, ale uczestnik telefoniczny nigdy nie pojawia się na liście Meet:

- `openclaw googlemeet doctor <session-id>`: należy potwierdzić identyfikator delegowanego połączenia Twilio, sprawdzić, czy DTMF został dodany do kolejki i czy zażądano powitania.
- `openclaw voicecall status --call-id <id>`: należy potwierdzić, że połączenie jest nadal aktywne.
- `openclaw voicecall tail`: należy potwierdzić, że Webhooki Twilio docierają do Gateway.
- `openclaw logs --follow`: należy odszukać sekwencję Twilio Meet: Google Meet deleguje dołączenie, Voice Call zapisuje i udostępnia TwiML DTMF przed połączeniem, Voice Call udostępnia TwiML czasu rzeczywistego dla połączenia Twilio, a następnie Google Meet żąda odtworzenia powitania za pomocą `voicecall.speak`.
- Należy ponownie uruchomić `openclaw googlemeet setup --transport twilio`; pomyślny wynik testu konfiguracji jest wymagany, ale nie dowodzi poprawności sekwencji PIN spotkania.
- Należy potwierdzić, że numer telefoniczny należy do tego samego zaproszenia i regionu Meet co kod PIN.
- Należy zwiększyć `voiceCall.dtmfDelayMs` względem domyślnych 12 sekund, jeśli Meet odpowiada powoli lub transkrypcja połączenia nadal zawiera monit o PIN po wysłaniu DTMF przed połączeniem.
- Jeśli uczestnik dołącza, ale powitanie nie jest słyszalne, należy sprawdzić `openclaw logs --follow` pod kątem żądania `voicecall.speak` po DTMF oraz odtwarzania TTS przez strumień multimedialny albo awaryjnego mechanizmu Twilio `<Say>`. Jeśli transkrypcja nadal zawiera komunikat „enter the meeting PIN”, telefoniczna część połączenia nie dołączyła jeszcze do pokoju Meet, dlatego uczestnicy nie usłyszą mowy.

Jeśli Webhooki nie docierają, należy najpierw debugować plugin Voice Call: dostawca musi mieć dostęp do `plugins.entries.voice-call.config.publicUrl` lub skonfigurowanego tunelu. Zobacz [Rozwiązywanie problemów z połączeniami głosowymi](/pl/plugins/voice-call#troubleshooting).

## Uwagi

Oficjalny interfejs API multimediów Google Meet jest ukierunkowany na odbieranie, dlatego przesyłanie mowy do połączenia nadal wymaga ścieżki uczestnika. Ten plugin wyraźnie zachowuje tę granicę: Chrome obsługuje uczestnictwo przez przeglądarkę i lokalne kierowanie dźwięku; Twilio obsługuje uczestnictwo przez połączenie telefoniczne.

Tryby zwrotnego przesyłania mowy w Chrome wymagają `BlackHole 2ch` oraz jednego z następujących elementów:

- `chrome.audioInputCommand` oraz `chrome.audioOutputCommand`: OpenClaw zarządza mostem i przesyła dźwięk w `chrome.audioFormat` między tymi poleceniami a wybranym dostawcą. Tryb `agent` korzysta z transkrypcji w czasie rzeczywistym oraz zwykłego TTS; tryb `bidi` korzysta z dostawcy głosu działającego w czasie rzeczywistym. Domyślna ścieżka to PCM16 24 kHz z `chrome.audioBufferBytes: 4096`; G.711 mu-law 8 kHz pozostaje dostępny dla starszych par poleceń.
- `chrome.audioBridgeCommand`: zewnętrzne polecenie mostu zarządza całą lokalną ścieżką dźwięku i musi zakończyć działanie po uruchomieniu lub zweryfikowaniu swojego demona. Obowiązuje tylko dla `bidi`, ponieważ tryb `agent` wymaga bezpośredniego dostępu do pary poleceń na potrzeby TTS.

W przypadku mostu Chrome opartego na parze poleceń `chrome.bargeInInputCommand` może nasłuchiwać z oddzielnego lokalnego mikrofonu i wyciszać odtwarzanie odpowiedzi asystenta, gdy człowiek zaczyna mówić, dzięki czemu mowa człowieka ma pierwszeństwo przed dźwiękiem asystenta, nawet gdy współdzielone wejście pętli zwrotnej BlackHole jest tymczasowo wyciszone podczas odtwarzania odpowiedzi asystenta. Podobnie jak `chrome.audioInputCommand`/`chrome.audioOutputCommand`, jest to lokalne polecenie konfigurowane przez operatora: należy używać jawnej, zaufanej ścieżki polecenia lub listy argumentów, nigdy skryptu z niezaufanej lokalizacji.

Aby uzyskać czysty dźwięk dupleksowy, należy kierować wyjście Meet i mikrofon Meet przez oddzielne urządzenia wirtualne lub graf urządzeń wirtualnych w stylu Loopback; pojedyncze współdzielone urządzenie BlackHole może powodować przesyłanie echa innych uczestników z powrotem do połączenia.

`googlemeet speak` uruchamia aktywny most dźwiękowy odpowiedzi głosowej dla sesji Chrome; `googlemeet leave` go zatrzymuje (a w przypadku sesji Twilio delegowanych przez Voice Call rozłącza połączenie bazowe). Użyj `googlemeet end-active-conference`, aby zamknąć również aktywną konferencję Google Meet dla przestrzeni zarządzanej przez API.

## Powiązane

- [Plugin połączeń głosowych](/pl/plugins/voice-call)
- [Tryb rozmowy](/pl/nodes/talk)
- [Tworzenie pluginów](/pl/plugins/building-plugins)
