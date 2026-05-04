---
read_when:
    - Chcesz, aby agent OpenClaw dołączył do spotkania Google Meet
    - Chcesz, aby agent OpenClaw utworzył nowe połączenie Google Meet
    - Konfigurujesz Chrome, węzeł Chrome lub Twilio jako transport Google Meet
summary: 'Plugin Google Meet: dołączaj do podanych jawnie adresów URL Meet przez Chrome lub Twilio z domyślnymi ustawieniami głosu w czasie rzeczywistym'
title: Plugin Google Meet
x-i18n:
    generated_at: "2026-05-04T02:25:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: 77ab70d27d47bcc037144c7c6cfad6f93f307355b6ebcf3ee75c85b96a24af2f
    source_path: plugins/google-meet.md
    workflow: 16
---

Obsługa uczestnika Google Meet w OpenClaw — plugin jest celowo jawny z założenia:

- Dołącza tylko do jawnego adresu URL `https://meet.google.com/...`.
- Może utworzyć nową przestrzeń Meet przez Google Meet API, a następnie dołączyć do
  zwróconego adresu URL.
- `realtime` to domyślny tryb głosu.
- Głos w czasie rzeczywistym może wywołać pełnego agenta OpenClaw, gdy potrzebne
  jest głębsze rozumowanie lub narzędzia.
- Agenci wybierają zachowanie dołączania za pomocą `mode`: użyj `realtime` do
  słuchania/odpowiadania na żywo albo `transcribe`, aby dołączyć/sterować
  przeglądarką bez mostu głosu w czasie rzeczywistym.
- Uwierzytelnianie zaczyna się jako osobiste Google OAuth albo już zalogowany
  profil Chrome.
- Nie ma automatycznego komunikatu o zgodzie.
- Domyślnym backendem audio Chrome jest `BlackHole 2ch`.
- Chrome może działać lokalnie albo na sparowanym hoście węzła.
- Twilio przyjmuje numer do połączenia telefonicznego oraz opcjonalny PIN lub
  sekwencję DTMF; nie może bezpośrednio wybrać adresu URL Meet.
- Polecenie CLI to `googlemeet`; `meet` jest zarezerwowane dla szerszych
  przepływów telekonferencji agenta.

## Szybki start

Zainstaluj lokalne zależności audio i skonfiguruj backendowego dostawcę głosu
w czasie rzeczywistym. OpenAI jest domyślne; Google Gemini Live również działa z
`realtime.provider: "google"`:

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
# or
export GEMINI_API_KEY=...
```

`blackhole-2ch` instaluje wirtualne urządzenie audio `BlackHole 2ch`. Instalator
Homebrew wymaga ponownego uruchomienia, zanim macOS udostępni urządzenie:

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

Sprawdź konfigurację:

```bash
openclaw googlemeet setup
```

Wynik konfiguracji ma być czytelny dla agenta i świadomy trybu. Raportuje profil
Chrome, przypięcie węzła oraz, dla dołączeń Chrome w czasie rzeczywistym, most
audio BlackHole/SoX i opóźnione kontrole wstępu w czasie rzeczywistym. Dla
dołączeń tylko do obserwacji sprawdź ten sam transport z `--mode transcribe`;
ten tryb pomija wymagania wstępne audio w czasie rzeczywistym, ponieważ nie
słucha ani nie mówi przez most:

```bash
openclaw googlemeet setup --transport chrome-node --mode transcribe
```

Gdy skonfigurowano delegowanie Twilio, konfiguracja raportuje też, czy plugin
`voice-call`, dane uwierzytelniające Twilio i publiczna ekspozycja Webhook są
gotowe. Każdą kontrolę `ok: false` traktuj jako blokadę dla sprawdzanego
transportu i trybu, zanim poprosisz agenta o dołączenie. Użyj
`openclaw googlemeet setup --json` dla skryptów lub wyniku czytelnego maszynowo.
Użyj `--transport chrome`, `--transport chrome-node` albo `--transport twilio`,
aby wstępnie sprawdzić konkretny transport, zanim agent go spróbuje.

Dla Twilio zawsze jawnie sprawdzaj transport wstępnie, gdy domyślnym transportem
jest Chrome:

```bash
openclaw googlemeet setup --transport twilio
```

To wykrywa brakujące podłączenie `voice-call`, dane uwierzytelniające Twilio
albo niedostępną ekspozycję Webhook, zanim agent spróbuje zadzwonić na spotkanie.

Dołącz do spotkania:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij
```

Albo pozwól agentowi dołączyć przez narzędzie `google_meet`:

```json
{
  "action": "join",
  "url": "https://meet.google.com/abc-defg-hij",
  "transport": "chrome-node",
  "mode": "agent"
}
```

Narzędzie `google_meet` dostępne dla agenta pozostaje dostępne na hostach innych
niż macOS dla przepływów artefaktów, kalendarza, konfiguracji, transkrypcji,
Twilio i `chrome-node`. Lokalne działania Chrome z odpowiedzią głosową są tam
blokowane, ponieważ dołączona ścieżka audio Chrome obecnie zależy od macOS
`BlackHole 2ch`. Na Linuxie użyj `mode: "transcribe"`, połączenia telefonicznego
Twilio albo hosta macOS `chrome-node` do udziału Chrome z odpowiedzią głosową.

Utwórz nowe spotkanie i dołącz do niego:

```bash
openclaw googlemeet create --transport chrome-node --mode realtime
```

Dla pokoi utworzonych przez API użyj Google Meet `SpaceConfig.accessType`, gdy
chcesz, aby zasada pokoju bez pukania była jawna zamiast dziedziczona z
domyślnych ustawień konta Google:

```bash
openclaw googlemeet create --access-type OPEN --transport chrome-node --mode realtime
```

`OPEN` pozwala każdemu z adresem URL Meet dołączyć bez pukania. `TRUSTED`
pozwala zaufanym użytkownikom organizacji gospodarza, zaproszonym użytkownikom
zewnętrznym i użytkownikom dołączającym telefonicznie dołączyć bez pukania.
`RESTRICTED` ogranicza wejście bez pukania do zaproszonych osób. Te ustawienia
mają zastosowanie tylko do oficjalnej ścieżki tworzenia Google Meet API, więc
dane uwierzytelniające OAuth muszą być skonfigurowane.

Jeśli uwierzytelniłeś Google Meet, zanim ta opcja była dostępna, uruchom ponownie
`openclaw googlemeet auth login --json` po dodaniu zakresu
`meetings.space.settings` do ekranu zgody Google OAuth.

Utwórz tylko adres URL bez dołączania:

```bash
openclaw googlemeet create --no-join
```

`googlemeet create` ma dwie ścieżki:

- Tworzenie przez API: używane, gdy skonfigurowano dane uwierzytelniające
  Google Meet OAuth. To najbardziej deterministyczna ścieżka i nie zależy od
  stanu interfejsu przeglądarki.
- Awaryjna ścieżka przez przeglądarkę: używana, gdy brakuje danych
  uwierzytelniających OAuth. OpenClaw używa przypiętego węzła Chrome, otwiera
  `https://meet.google.com/new`, czeka, aż Google przekieruje do prawdziwego
  adresu URL z kodem spotkania, a następnie zwraca ten adres URL. Ta ścieżka
  wymaga, aby profil OpenClaw Chrome na węźle był już zalogowany do Google.
  Automatyzacja przeglądarki obsługuje własny monit Meet o mikrofon przy
  pierwszym uruchomieniu; ten monit nie jest traktowany jako błąd logowania do
  Google.
  Przepływy dołączania i tworzenia próbują też ponownie użyć istniejącej karty
  Meet przed otwarciem nowej. Dopasowywanie ignoruje nieszkodliwe ciągi zapytania
  URL, takie jak `authuser`, więc ponowienie agenta powinno ustawić fokus na już
  otwartym spotkaniu zamiast tworzyć drugą kartę Chrome.

Wynik polecenia/narzędzia zawiera pole `source` (`api` albo `browser`), aby
agenci mogli wyjaśnić, której ścieżki użyto. `create` domyślnie dołącza do
nowego spotkania i zwraca `joined: true` oraz sesję dołączenia. Aby tylko
utworzyć adres URL, użyj `create --no-join` w CLI albo przekaż `"join": false`
do narzędzia.

Albo powiedz agentowi: „Utwórz Google Meet, dołącz do niego z głosem w czasie
rzeczywistym i wyślij mi link”. Agent powinien wywołać `google_meet` z
`action: "create"`, a następnie udostępnić zwrócone `meetingUri`.

```json
{
  "action": "create",
  "transport": "chrome-node",
  "mode": "realtime"
}
```

Dla dołączenia tylko do obserwacji/sterowania przeglądarką ustaw
`"mode": "transcribe"`. Nie uruchamia to dupleksowego mostu głosu w czasie
rzeczywistym, nie wymaga BlackHole ani SoX i nie będzie odpowiadać głosowo na
spotkaniu. Dołączenia Chrome w tym trybie unikają też przyznania uprawnień
mikrofonu/kamery przez OpenClaw i ścieżki Meet **Użyj mikrofonu**. Jeśli Meet
pokaże ekran pośredni wyboru audio, automatyzacja próbuje ścieżki bez mikrofonu,
a w przeciwnym razie zgłasza działanie ręczne zamiast otwierać lokalny mikrofon.
W trybie transkrypcji zarządzane transporty Chrome instalują też, w miarę
możliwości, obserwator napisów Meet. `googlemeet status --json` i
`googlemeet doctor` pokazują `captioning`, `captionsEnabledAttempted`,
`transcriptLines`, `lastCaptionAt`, `lastCaptionSpeaker`, `lastCaptionText`
oraz krótki ogon `recentTranscript`, aby operatorzy mogli stwierdzić, czy
przeglądarka dołączyła do rozmowy i czy napisy Meet generują tekst.
Użyj `openclaw googlemeet test-listen <meet-url> --transport chrome-node`, gdy
potrzebujesz sondy tak/nie: dołącza w trybie transkrypcji, czeka na świeży ruch
napisów lub transkryptu i zwraca `listenVerified`, `listenTimedOut`, pola działań
ręcznych oraz najnowszy stan napisów.

Podczas sesji w czasie rzeczywistym status `google_meet` zawiera kondycję
przeglądarki i mostu audio, taką jak `inCall`, `manualActionRequired`,
`providerConnected`, `realtimeReady`, `audioInputActive`, `audioOutputActive`,
znaczniki czasu ostatniego wejścia/wyjścia, liczniki bajtów i stan zamknięcia
mostu. Jeśli pojawi się bezpieczny monit strony Meet, automatyzacja przeglądarki
obsługuje go, gdy może. Monity logowania, dopuszczenia przez gospodarza oraz
uprawnień przeglądarki/systemu operacyjnego są zgłaszane jako działanie ręczne
z powodem i komunikatem, który agent ma przekazać. Zarządzane sesje Chrome
emitują wstęp lub frazę testową dopiero po tym, jak kondycja przeglądarki zgłosi
`inCall: true`; w przeciwnym razie status zgłasza `speechReady: false`, a próba
mówienia jest blokowana zamiast udawać, że agent przemówił na spotkaniu.

Lokalne dołączenia Chrome przechodzą przez zalogowany profil przeglądarki
OpenClaw. Tryb czasu rzeczywistego wymaga `BlackHole 2ch` dla ścieżki
mikrofonu/głośnika używanej przez OpenClaw. Aby uzyskać czysty dźwięk
dupleksowy, użyj oddzielnych urządzeń wirtualnych albo grafu w stylu Loopback;
jedno urządzenie BlackHole wystarczy do pierwszego testu dymnego, ale może
powodować echo.

### Lokalny Gateway + Chrome w Parallels

**Nie** potrzebujesz pełnego OpenClaw Gateway ani klucza API modelu wewnątrz VM
macOS tylko po to, aby VM posiadała Chrome. Uruchom Gateway i agenta lokalnie, a
następnie uruchom host węzła w VM. Włącz dołączony plugin na VM jeden raz, aby
węzeł reklamował polecenie Chrome:

Co działa gdzie:

- Host Gateway: OpenClaw Gateway, przestrzeń robocza agenta, klucze modelu/API,
  dostawca czasu rzeczywistego oraz konfiguracja pluginu Google Meet.
- VM macOS Parallels: OpenClaw CLI/host węzła, Google Chrome, SoX, BlackHole 2ch
  oraz profil Chrome zalogowany do Google.
- Niepotrzebne w VM: usługa Gateway, konfiguracja agenta, klucz OpenAI/GPT ani
  konfiguracja dostawcy modelu.

Zainstaluj zależności VM:

```bash
brew install blackhole-2ch sox
```

Uruchom ponownie VM po instalacji BlackHole, aby macOS udostępnił
`BlackHole 2ch`:

```bash
sudo reboot
```

Po ponownym uruchomieniu zweryfikuj, czy VM widzi urządzenie audio i polecenia
SoX:

```bash
system_profiler SPAudioDataType | grep -i BlackHole
command -v sox
```

Zainstaluj lub zaktualizuj OpenClaw w VM, a następnie włącz tam dołączony
plugin:

```bash
openclaw plugins enable google-meet
```

Uruchom host węzła w VM:

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name parallels-macos
```

Jeśli `<gateway-host>` jest adresem IP LAN i nie używasz TLS, węzeł odrzuca
plaintext WebSocket, chyba że jawnie zgodzisz się na tę zaufaną sieć prywatną:

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node run --host <gateway-lan-ip> --port 18789 --display-name parallels-macos
```

Użyj tej samej zmiennej środowiskowej podczas instalowania węzła jako
LaunchAgent:

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node install --host <gateway-lan-ip> --port 18789 --display-name parallels-macos --force
openclaw node restart
```

`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` jest środowiskiem procesu, a nie
ustawieniem `openclaw.json`. `openclaw node install` zapisuje je w środowisku
LaunchAgent, gdy jest obecne w poleceniu instalacji.

Zatwierdź węzeł z hosta Gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Potwierdź, że Gateway widzi węzeł i że reklamuje zarówno `googlemeet.chrome`,
jak i możliwość przeglądarki/`browser.proxy`:

```bash
openclaw nodes status
```

Skieruj Meet przez ten węzeł na hoście Gateway:

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

Teraz dołącz normalnie z hosta Gateway:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij
```

albo poproś agenta, aby użył narzędzia `google_meet` z `transport: "chrome-node"`.

Dla jedno-poleceniowego testu dymnego, który tworzy lub ponownie używa sesji,
wypowiada znaną frazę i wypisuje kondycję sesji:

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij
```

Podczas dołączania w czasie rzeczywistym automatyzacja przeglądarki OpenClaw wpisuje nazwę gościa, klika
Dołącz/Poproś o dołączenie i akceptuje pierwszy wybór Meet „Użyj mikrofonu”, gdy
pojawi się ten monit. Podczas dołączania tylko do obserwacji lub tworzenia spotkania tylko w przeglądarce
przechodzi dalej po tym samym monicie bez mikrofonu, gdy taka opcja jest dostępna.
Jeśli profil przeglądarki nie jest zalogowany, Meet czeka na dopuszczenie przez gospodarza,
Chrome potrzebuje uprawnień mikrofonu/kamery do dołączenia w czasie rzeczywistym albo Meet utknął
na monicie, którego automatyzacja nie mogła rozwiązać, wynik join/test-speech zgłasza
`manualActionRequired: true` z `manualActionReason` i
`manualActionMessage`. Agenci powinni przestać ponawiać próbę dołączenia, zgłosić dokładnie
ten komunikat wraz z bieżącymi `browserUrl`/`browserTitle` i ponowić próbę dopiero po
ukończeniu ręcznej akcji w przeglądarce.

Jeśli `chromeNode.node` zostanie pominięte, OpenClaw wybiera automatycznie tylko wtedy, gdy dokładnie jeden
połączony węzeł ogłasza zarówno `googlemeet.chrome`, jak i sterowanie przeglądarką. Jeśli
połączonych jest kilka zgodnych węzłów, ustaw `chromeNode.node` na identyfikator węzła,
nazwę wyświetlaną lub zdalny adres IP.

Typowe kontrole błędów:

- `Configured Google Meet node ... is not usable: offline`: przypięty węzeł jest
  znany Gateway, ale niedostępny. Agenci powinni traktować ten węzeł jako
  stan diagnostyczny, a nie użyteczny host Chrome, i zgłosić blokadę konfiguracji
  zamiast przełączać się na inny transport, chyba że użytkownik o to poprosił.
- `No connected Google Meet-capable node`: uruchom `openclaw node run` w VM,
  zatwierdź parowanie i upewnij się, że w VM uruchomiono `openclaw plugins enable google-meet` oraz
  `openclaw plugins enable browser`. Potwierdź też, że host Gateway zezwala na oba
  polecenia węzła za pomocą
  `gateway.nodes.allowCommands: ["googlemeet.chrome", "browser.proxy"]`.
- `BlackHole 2ch audio device not found`: zainstaluj `blackhole-2ch` na sprawdzanym hoście
  i uruchom ponownie przed użyciem lokalnego dźwięku Chrome.
- `BlackHole 2ch audio device not found on the node`: zainstaluj `blackhole-2ch`
  w VM i uruchom VM ponownie.
- Chrome otwiera się, ale nie może dołączyć: zaloguj się do profilu przeglądarki w VM albo
  pozostaw ustawione `chrome.guestName` dla dołączenia gościa. Automatyczne dołączanie gościa używa
  automatyzacji przeglądarki OpenClaw przez proxy przeglądarki węzła; upewnij się, że konfiguracja
  przeglądarki węzła wskazuje profil, którego chcesz używać, na przykład
  `browser.defaultProfile: "user"` albo nazwany profil istniejącej sesji.
- Zduplikowane karty Meet: pozostaw włączone `chrome.reuseExistingTab: true`. OpenClaw
  aktywuje istniejącą kartę dla tego samego URL Meet przed otwarciem nowej, a
  tworzenie spotkania w przeglądarce ponownie używa trwającej karty `https://meet.google.com/new`
  lub karty monitu konta Google przed otwarciem kolejnej.
- Brak dźwięku: w Meet skieruj dźwięk mikrofonu/głośnika przez ścieżkę wirtualnego urządzenia audio
  używaną przez OpenClaw; użyj oddzielnych urządzeń wirtualnych albo routingu w stylu Loopback
  dla czystego dźwięku dwukierunkowego.

## Uwagi instalacyjne

Domyślna odpowiedź głosowa Chrome używa dwóch zewnętrznych narzędzi:

- `sox`: narzędzie audio z wiersza poleceń. Plugin używa jawnych poleceń urządzeń CoreAudio
  dla domyślnego mostka audio PCM16 24 kHz.
- `blackhole-2ch`: wirtualny sterownik audio macOS. Tworzy urządzenie audio `BlackHole 2ch`,
  przez które Chrome/Meet może routować dźwięk.

OpenClaw nie dołącza ani nie redystrybuuje żadnego z tych pakietów. Dokumentacja prosi użytkowników o
zainstalowanie ich jako zależności hosta przez Homebrew. SoX jest licencjonowany jako
`LGPL-2.0-only AND GPL-2.0-only`; BlackHole jest na GPL-3.0. Jeśli budujesz
instalator lub urządzenie, które dołącza BlackHole z OpenClaw, przejrzyj warunki licencyjne
upstream BlackHole albo uzyskaj oddzielną licencję od Existential Audio.

## Transporty

### Chrome

Transport Chrome otwiera URL Meet przez sterowanie przeglądarką OpenClaw i dołącza
jako zalogowany profil przeglądarki OpenClaw. Na macOS Plugin sprawdza obecność
`BlackHole 2ch` przed uruchomieniem. Jeśli jest skonfigurowany, uruchamia też polecenie
sprawdzenia kondycji mostka audio i polecenie startowe przed otwarciem Chrome. Użyj `chrome`, gdy
Chrome/dźwięk działają na hoście Gateway; użyj `chrome-node`, gdy Chrome/dźwięk działają
na sparowanym węźle, takim jak VM macOS Parallels. Dla lokalnego Chrome wybierz
profil za pomocą `browser.defaultProfile`; `chrome.browserProfile` jest przekazywane do
hostów `chrome-node`.

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome-node
```

Skieruj dźwięk mikrofonu i głośnika Chrome przez lokalny mostek audio OpenClaw.
Jeśli `BlackHole 2ch` nie jest zainstalowany, dołączenie kończy się błędem konfiguracji
zamiast cicho dołączyć bez ścieżki audio.

### Twilio

Transport Twilio jest ścisłym planem wybierania delegowanym do Pluginu Voice Call. Nie
analizuje stron Meet w poszukiwaniu numerów telefonów.

Użyj tego, gdy udział przez Chrome jest niedostępny albo chcesz zapasowe dołączanie telefoniczne.
Google Meet musi udostępniać numer telefoniczny i PIN do spotkania;
OpenClaw nie wykrywa ich ze strony Meet.

Włącz Plugin Voice Call na hoście Gateway, nie na węźle Chrome:

```json5
{
  plugins: {
    allow: ["google-meet", "voice-call"],
    entries: {
      "google-meet": {
        enabled: true,
        config: {
          defaultTransport: "chrome-node",
          // or set "twilio" if Twilio should be the default
        },
      },
      "voice-call": {
        enabled: true,
        config: {
          provider: "twilio",
        },
      },
    },
  },
}
```

Podaj poświadczenia Twilio przez środowisko albo konfigurację. Środowisko trzyma
sekrety poza `openclaw.json`:

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
```

Uruchom ponownie albo przeładuj Gateway po włączeniu `voice-call`; zmiany konfiguracji Pluginu
nie pojawią się w już działającym procesie Gateway, dopóki nie zostanie przeładowany.

Następnie zweryfikuj:

```bash
openclaw config validate
openclaw plugins list | grep -E 'google-meet|voice-call'
openclaw googlemeet setup
```

Gdy delegowanie Twilio jest podłączone, `googlemeet setup` zawiera pomyślne kontrole
`twilio-voice-call-plugin`, `twilio-voice-call-credentials` i
`twilio-voice-call-webhook`.

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --pin 123456
```

Użyj `--dtmf-sequence`, gdy spotkanie wymaga niestandardowej sekwencji:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --dtmf-sequence ww123456#
```

## OAuth i kontrola wstępna

OAuth jest opcjonalny do tworzenia linku Meet, ponieważ `googlemeet create` może
awaryjnie użyć automatyzacji przeglądarki. Skonfiguruj OAuth, gdy chcesz oficjalnego tworzenia przez API,
rozpoznawania przestrzeni albo kontroli wstępnych Meet Media API.

Dostęp do Google Meet API używa OAuth użytkownika: utwórz klienta OAuth Google Cloud,
zażądaj wymaganych zakresów, autoryzuj konto Google, a następnie zapisz
uzyskany token odświeżania w konfiguracji Pluginu Google Meet albo podaj
zmienne środowiskowe `OPENCLAW_GOOGLE_MEET_*`.

OAuth nie zastępuje ścieżki dołączania Chrome. Transporty Chrome i Chrome-node
nadal dołączają przez zalogowany profil Chrome, BlackHole/SoX i połączony
węzeł, gdy używasz udziału przez przeglądarkę. OAuth służy wyłącznie oficjalnej
ścieżce Google Meet API: tworzeniu przestrzeni spotkań, rozpoznawaniu przestrzeni i uruchamianiu
kontroli wstępnych Meet Media API.

### Utwórz poświadczenia Google

W Google Cloud Console:

1. Utwórz albo wybierz projekt Google Cloud.
2. Włącz **Google Meet REST API** dla tego projektu.
3. Skonfiguruj ekran zgody OAuth.
   - **Internal** jest najprostsze dla organizacji Google Workspace.
   - **External** działa dla konfiguracji osobistych/testowych; gdy aplikacja jest w trybie Testing,
     dodaj każde konto Google, które będzie autoryzować aplikację, jako użytkownika testowego.
4. Dodaj zakresy, których wymaga OpenClaw:
   - `https://www.googleapis.com/auth/meetings.space.created`
   - `https://www.googleapis.com/auth/meetings.space.readonly`
   - `https://www.googleapis.com/auth/meetings.space.settings`
   - `https://www.googleapis.com/auth/meetings.conference.media.readonly`
5. Utwórz identyfikator klienta OAuth.
   - Typ aplikacji: **Web application**.
   - Autoryzowany URI przekierowania:

     ```text
     http://localhost:8085/oauth2callback
     ```

6. Skopiuj identyfikator klienta i sekret klienta.

`meetings.space.created` jest wymagane przez Google Meet `spaces.create`.
`meetings.space.readonly` pozwala OpenClaw rozpoznawać URL-e/kody Meet do przestrzeni.
`meetings.space.settings` pozwala OpenClaw przekazywać ustawienia `SpaceConfig`, takie jak
`accessType`, podczas tworzenia pokoju przez API.
`meetings.conference.media.readonly` służy do kontroli wstępnych Meet Media API i pracy z mediami;
Google może wymagać rejestracji w Developer Preview do rzeczywistego użycia Media API.
Jeśli potrzebujesz tylko dołączeń Chrome opartych na przeglądarce, całkowicie pomiń OAuth.

### Wygeneruj token odświeżania

Skonfiguruj `oauth.clientId` i opcjonalnie `oauth.clientSecret` albo przekaż je jako
zmienne środowiskowe, a następnie uruchom:

```bash
openclaw googlemeet auth login --json
```

Polecenie wypisuje blok konfiguracji `oauth` z tokenem odświeżania. Używa PKCE,
lokalnego wywołania zwrotnego pod `http://localhost:8085/oauth2callback` i ręcznego
przepływu kopiuj/wklej z `--manual`.

Przykłady:

```bash
OPENCLAW_GOOGLE_MEET_CLIENT_ID="your-client-id" \
OPENCLAW_GOOGLE_MEET_CLIENT_SECRET="your-client-secret" \
openclaw googlemeet auth login --json
```

Użyj trybu ręcznego, gdy przeglądarka nie może dotrzeć do lokalnego wywołania zwrotnego:

```bash
OPENCLAW_GOOGLE_MEET_CLIENT_ID="your-client-id" \
OPENCLAW_GOOGLE_MEET_CLIENT_SECRET="your-client-secret" \
openclaw googlemeet auth login --json --manual
```

Wyjście JSON zawiera:

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

Zapisz obiekt `oauth` w konfiguracji Pluginu Google Meet:

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

Preferuj zmienne środowiskowe, gdy nie chcesz tokenu odświeżania w konfiguracji.
Jeśli obecne są zarówno wartości konfiguracji, jak i środowiska, Plugin najpierw wybiera konfigurację,
a potem awaryjnie środowisko.

Zgoda OAuth obejmuje tworzenie przestrzeni Meet, dostęp odczytu do przestrzeni Meet oraz dostęp odczytu
do mediów konferencji Meet. Jeśli uwierzytelniono się przed pojawieniem się obsługi
tworzenia spotkań, uruchom ponownie `openclaw googlemeet auth login --json`, aby token odświeżania
miał zakres `meetings.space.created`.

### Zweryfikuj OAuth za pomocą doctor

Uruchom OAuth doctor, gdy chcesz szybkiej kontroli kondycji bez sekretów:

```bash
openclaw googlemeet doctor --oauth --json
```

Nie ładuje to środowiska uruchomieniowego Chrome ani nie wymaga połączonego węzła Chrome. Sprawdza,
czy konfiguracja OAuth istnieje i czy token odświeżania może wygenerować token dostępu.
Raport JSON zawiera tylko pola statusu, takie jak `ok`, `configured`,
`tokenSource`, `expiresAt` i komunikaty kontroli; nie wypisuje tokenu dostępu,
tokenu odświeżania ani sekretu klienta.

Typowe wyniki:

| Kontrola             | Znaczenie                                                                               |
| -------------------- | --------------------------------------------------------------------------------------- |
| `oauth-config`       | Obecne jest `oauth.clientId` plus `oauth.refreshToken` albo buforowany token dostępu.   |
| `oauth-token`        | Buforowany token dostępu jest nadal ważny albo token odświeżania wygenerował nowy token dostępu. |
| `meet-spaces-get`    | Opcjonalna kontrola `--meeting` rozpoznała istniejącą przestrzeń Meet.                  |
| `meet-spaces-create` | Opcjonalna kontrola `--create-space` utworzyła nową przestrzeń Meet.                    |

Aby potwierdzić także włączenie Google Meet API i zakres `spaces.create`, uruchom
kontrolę tworzenia wywołującą skutek uboczny:

```bash
openclaw googlemeet doctor --oauth --create-space --json
openclaw googlemeet create --no-join --json
```

`--create-space` tworzy jednorazowy adres URL Meet. Użyj go, gdy trzeba potwierdzić,
że projekt Google Cloud ma włączony Meet API i że autoryzowane
konto ma zakres `meetings.space.created`.

Aby potwierdzić dostęp do odczytu istniejącej przestrzeni spotkania:

```bash
openclaw googlemeet doctor --oauth --meeting https://meet.google.com/abc-defg-hij --json
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
```

`doctor --oauth --meeting` i `resolve-space` potwierdzają dostęp do odczytu istniejącej
przestrzeni, do której autoryzowane konto Google ma dostęp. `403` z tych kontroli
zwykle oznacza, że Google Meet REST API jest wyłączony, zaakceptowany token odświeżania
nie ma wymaganego zakresu albo konto Google nie ma dostępu do tej przestrzeni Meet.
Błąd tokenu odświeżania oznacza, że trzeba ponownie uruchomić `openclaw googlemeet auth login
--json` i zapisać nowy blok `oauth`.

Dane uwierzytelniające OAuth nie są potrzebne dla trybu awaryjnego przeglądarki. W tym trybie uwierzytelnianie Google
pochodzi z zalogowanego profilu Chrome na wybranym węźle, a nie z
konfiguracji OpenClaw.

Te zmienne środowiskowe są akceptowane jako wartości awaryjne:

- `OPENCLAW_GOOGLE_MEET_CLIENT_ID` lub `GOOGLE_MEET_CLIENT_ID`
- `OPENCLAW_GOOGLE_MEET_CLIENT_SECRET` lub `GOOGLE_MEET_CLIENT_SECRET`
- `OPENCLAW_GOOGLE_MEET_REFRESH_TOKEN` lub `GOOGLE_MEET_REFRESH_TOKEN`
- `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN` lub `GOOGLE_MEET_ACCESS_TOKEN`
- `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT` lub
  `GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT`
- `OPENCLAW_GOOGLE_MEET_DEFAULT_MEETING` lub `GOOGLE_MEET_DEFAULT_MEETING`
- `OPENCLAW_GOOGLE_MEET_PREVIEW_ACK` lub `GOOGLE_MEET_PREVIEW_ACK`

Rozwiąż adres URL Meet, kod lub `spaces/{id}` przez `spaces.get`:

```bash
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
```

Uruchom kontrolę wstępną przed pracą z mediami:

```bash
openclaw googlemeet preflight --meeting https://meet.google.com/abc-defg-hij
```

Wyświetl artefakty spotkania i obecność po utworzeniu przez Meet rekordów konferencji:

```bash
openclaw googlemeet artifacts --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet attendance --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet export --meeting https://meet.google.com/abc-defg-hij --output ./meet-export
```

Z `--meeting`, `artifacts` i `attendance` domyślnie używają najnowszego rekordu konferencji.
Przekaż `--all-conference-records`, gdy chcesz uzyskać wszystkie zachowane rekordy
dla tego spotkania.

Wyszukiwanie w kalendarzu może rozwiązać adres URL spotkania z Google Calendar przed odczytem
artefaktów Meet:

```bash
openclaw googlemeet latest --today
openclaw googlemeet calendar-events --today --json
openclaw googlemeet artifacts --event "Weekly sync"
openclaw googlemeet attendance --today --format csv --output attendance.csv
```

`--today` przeszukuje dzisiejszy kalendarz `primary` pod kątem wydarzenia Calendar z
linkiem Google Meet. Użyj `--event <query>`, aby wyszukać pasujący tekst wydarzenia, oraz
`--calendar <id>` dla kalendarza innego niż główny. Wyszukiwanie w kalendarzu wymaga świeżego
logowania OAuth obejmującego zakres tylko do odczytu wydarzeń Calendar.
`calendar-events` pokazuje podgląd pasujących wydarzeń Meet i oznacza wydarzenie, które
wybiorą `latest`, `artifacts`, `attendance` lub `export`.

Jeśli znasz już identyfikator rekordu konferencji, zaadresuj go bezpośrednio:

```bash
openclaw googlemeet latest --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet artifacts --conference-record conferenceRecords/abc123 --json
openclaw googlemeet attendance --conference-record conferenceRecords/abc123 --json
```

Zakończ aktywną konferencję dla przestrzeni utworzonej przez API, gdy chcesz zamknąć
pokój po rozmowie:

```bash
openclaw googlemeet end-active-conference https://meet.google.com/abc-defg-hij
```

To wywołuje Google Meet `spaces.endActiveConference` i wymaga OAuth z
zakresem `meetings.space.created` dla przestrzeni, którą autoryzowane konto może zarządzać.
OpenClaw akceptuje adres URL Meet, kod spotkania lub wejście `spaces/{id}` i rozwiązuje je
do zasobu przestrzeni API przed zakończeniem aktywnej konferencji.
Jest to odrębne od `googlemeet leave`: `leave` zatrzymuje lokalny/sesyjny
udział OpenClaw, natomiast `end-active-conference` prosi Google Meet o zakończenie aktywnej
konferencji dla przestrzeni.

Zapisz czytelny raport:

```bash
openclaw googlemeet artifacts --conference-record conferenceRecords/abc123 \
  --format markdown --output meet-artifacts.md
openclaw googlemeet attendance --conference-record conferenceRecords/abc123 \
  --format markdown --output meet-attendance.md
openclaw googlemeet attendance --conference-record conferenceRecords/abc123 \
  --format csv --output meet-attendance.csv
openclaw googlemeet export --conference-record conferenceRecords/abc123 \
  --include-doc-bodies --zip --output meet-export
openclaw googlemeet export --conference-record conferenceRecords/abc123 \
  --include-doc-bodies --dry-run
```

`artifacts` zwraca metadane rekordu konferencji oraz metadane zasobów uczestników, nagrań,
transkrypcji, ustrukturyzowanych wpisów transkrypcji i inteligentnych notatek, gdy
Google udostępnia je dla spotkania. Użyj `--no-transcript-entries`, aby pominąć
wyszukiwanie wpisów przy dużych spotkaniach. `attendance` rozwija uczestników do
wierszy sesji uczestników z czasami pierwszego/ostatniego wykrycia, całkowitym czasem trwania sesji,
flagami spóźnienia/wcześniejszego wyjścia oraz zduplikowanymi zasobami uczestników scalonymi według zalogowanego
użytkownika lub nazwy wyświetlanej. Przekaż `--no-merge-duplicates`, aby zachować surowe zasoby
uczestników osobno, `--late-after-minutes`, aby dostroić wykrywanie spóźnień, oraz
`--early-before-minutes`, aby dostroić wykrywanie wcześniejszego wyjścia.

`export` zapisuje folder zawierający `summary.md`, `attendance.csv`,
`transcript.md`, `artifacts.json`, `attendance.json` i `manifest.json`.
`manifest.json` rejestruje wybrane wejście, opcje eksportu, rekordy konferencji,
pliki wyjściowe, liczności, źródło tokenu, wydarzenie Calendar, gdy zostało użyte, oraz wszelkie
ostrzeżenia o częściowym pobieraniu. Przekaż `--zip`, aby dodatkowo zapisać przenośne archiwum obok
folderu. Przekaż `--include-doc-bodies`, aby wyeksportować tekst połączonych dokumentów Google Docs z transkrypcją i
inteligentnymi notatkami przez Google Drive `files.export`; wymaga to
świeżego logowania OAuth obejmującego zakres tylko do odczytu Drive Meet. Bez
`--include-doc-bodies` eksporty zawierają tylko metadane Meet i ustrukturyzowane wpisy transkrypcji.
Jeśli Google zwróci częściowy błąd artefaktu, taki jak błąd listowania inteligentnych notatek,
wpisu transkrypcji lub treści dokumentu Drive, podsumowanie i
manifest zachowują ostrzeżenie zamiast przerywać cały eksport.
Użyj `--dry-run`, aby pobrać te same dane artefaktów/obecności i wypisać
JSON manifestu bez tworzenia folderu lub ZIP. Jest to przydatne przed zapisaniem
dużego eksportu albo gdy agent potrzebuje tylko liczności, wybranych rekordów i
ostrzeżeń.

Agenci mogą także utworzyć ten sam pakiet przez narzędzie `google_meet`:

```json
{
  "action": "export",
  "conferenceRecord": "conferenceRecords/abc123",
  "includeDocumentBodies": true,
  "outputDir": "meet-export",
  "zip": true
}
```

Ustaw `"dryRun": true`, aby zwrócić tylko manifest eksportu i pominąć zapisy plików.

Agenci mogą także utworzyć pokój oparty na API z jawną zasadą dostępu:

```json
{
  "action": "create",
  "transport": "chrome-node",
  "mode": "realtime",
  "accessType": "OPEN"
}
```

Mogą też zakończyć aktywną konferencję dla znanego pokoju:

```json
{
  "action": "end_active_conference",
  "meeting": "https://meet.google.com/abc-defg-hij"
}
```

Do walidacji najpierw nasłuchującej agenci powinni użyć `test_listen`, zanim stwierdzą, że
spotkanie jest użyteczne:

```json
{
  "action": "test_listen",
  "url": "https://meet.google.com/abc-defg-hij",
  "transport": "chrome-node",
  "timeoutMs": 30000
}
```

Uruchom chroniony test dymny live wobec prawdziwego zachowanego spotkania:

```bash
OPENCLAW_LIVE_TEST=1 \
OPENCLAW_GOOGLE_MEET_LIVE_MEETING=https://meet.google.com/abc-defg-hij \
pnpm test:live -- extensions/google-meet/google-meet.live.test.ts
```

Uruchom live sondę przeglądarkową najpierw nasłuchującą wobec spotkania, na którym ktoś będzie
mówić przy dostępnych napisach Meet:

```bash
openclaw googlemeet setup --transport chrome-node --mode transcribe
openclaw googlemeet test-listen https://meet.google.com/abc-defg-hij --transport chrome-node --timeout-ms 30000
```

Środowisko testu dymnego live:

- `OPENCLAW_LIVE_TEST=1` włącza chronione testy live.
- `OPENCLAW_GOOGLE_MEET_LIVE_MEETING` wskazuje zachowany adres URL Meet, kod lub
  `spaces/{id}`.
- `OPENCLAW_GOOGLE_MEET_CLIENT_ID` lub `GOOGLE_MEET_CLIENT_ID` dostarcza identyfikator klienta OAuth.
- `OPENCLAW_GOOGLE_MEET_REFRESH_TOKEN` lub `GOOGLE_MEET_REFRESH_TOKEN` dostarcza
  token odświeżania.
- Opcjonalnie: `OPENCLAW_GOOGLE_MEET_CLIENT_SECRET`,
  `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN` i
  `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT` używają tych samych nazw awaryjnych
  bez prefiksu `OPENCLAW_`.

Podstawowy test dymny live artefaktów/obecności wymaga
`https://www.googleapis.com/auth/meetings.space.readonly` i
`https://www.googleapis.com/auth/meetings.conference.media.readonly`. Wyszukiwanie w kalendarzu
wymaga `https://www.googleapis.com/auth/calendar.events.readonly`. Eksport treści dokumentów Drive
wymaga
`https://www.googleapis.com/auth/drive.meet.readonly`.

Utwórz świeżą przestrzeń Meet:

```bash
openclaw googlemeet create
```

Polecenie wypisuje nowy `meeting uri`, źródło i sesję dołączania. Z danymi
uwierzytelniającymi OAuth używa oficjalnego Google Meet API. Bez danych uwierzytelniających OAuth
używa zalogowanego profilu przeglądarki przypiętego węzła Chrome jako trybu awaryjnego. Agenci mogą
użyć narzędzia `google_meet` z `action: "create"`, aby utworzyć i dołączyć w jednym
kroku. Do utworzenia tylko adresu URL przekaż `"join": false`.

Przykładowe wyjście JSON z trybu awaryjnego przeglądarki:

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

Jeśli tryb awaryjny przeglądarki napotka logowanie Google lub blokadę uprawnień Meet, zanim
będzie mógł utworzyć adres URL, metoda Gateway zwraca odpowiedź niepowodzenia, a
narzędzie `google_meet` zwraca ustrukturyzowane szczegóły zamiast zwykłego ciągu:

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

Gdy agent widzi `manualActionRequired: true`, powinien zgłosić
`manualActionMessage` wraz z kontekstem węzła/karty przeglądarki i przestać otwierać nowe
karty Meet, dopóki operator nie ukończy kroku w przeglądarce.

Przykładowe wyjście JSON z utworzenia przez API:

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

Utworzenie Meet domyślnie dołącza do spotkania. Transport Chrome lub Chrome-node nadal
wymaga zalogowanego profilu Google Chrome, aby dołączyć przez przeglądarkę. Jeśli
profil jest wylogowany, OpenClaw zgłasza `manualActionRequired: true` albo
błąd trybu awaryjnego przeglądarki i prosi operatora o dokończenie logowania Google przed
ponowną próbą.

Ustaw `preview.enrollmentAcknowledged: true` dopiero po potwierdzeniu, że Twój projekt Cloud,
podmiot OAuth i uczestnicy spotkania są zapisani do Google Workspace Developer Preview Program dla Meet media APIs.

## Konfiguracja

Wspólna ścieżka agenta Chrome wymaga tylko włączonego Plugin, BlackHole, SoX,
klucza dostawcy transkrypcji w czasie rzeczywistym oraz skonfigurowanego dostawcy TTS OpenClaw.
OpenAI jest domyślnym dostawcą transkrypcji; ustaw `realtime.provider: "google"`,
aby używać Google Gemini Live dla trybu `bidi`:

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
# or
export GEMINI_API_KEY=...
```

Ustaw konfigurację pluginu pod `plugins.entries.google-meet.config`:

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

Wartości domyślne:

- `defaultTransport: "chrome"`
- `defaultMode: "agent"` (`"realtime"` jest akceptowane jako alias zgodności dla
  `"agent"`)
- `chromeNode.node`: opcjonalny identyfikator/nazwa/IP węzła dla `chrome-node`
- `chrome.audioBackend: "blackhole-2ch"`
- `chrome.guestName: "OpenClaw Agent"`: nazwa używana na ekranie gościa Meet
  bez zalogowania
- `chrome.autoJoin: true`: najlepsza możliwa próba wypełnienia nazwy gościa i
  kliknięcia Join Now przez automatyzację przeglądarki OpenClaw na `chrome-node`
- `chrome.reuseExistingTab: true`: aktywuj istniejącą kartę Meet zamiast
  otwierać duplikaty
- `chrome.waitForInCallMs: 20000`: poczekaj, aż karta Meet zgłosi stan połączenia,
  zanim zostanie wyzwolone wprowadzenie realtime
- `chrome.audioFormat: "pcm16-24khz"`: format audio pary poleceń. Używaj
  `"g711-ulaw-8khz"` tylko dla starszych/niestandardowych par poleceń, które
  nadal emitują audio telefoniczne.
- `chrome.audioInputCommand`: polecenie SoX odczytujące z CoreAudio `BlackHole 2ch`
  i zapisujące audio w `chrome.audioFormat`
- `chrome.audioOutputCommand`: polecenie SoX odczytujące audio w `chrome.audioFormat`
  i zapisujące do CoreAudio `BlackHole 2ch`
- `chrome.bargeInInputCommand`: opcjonalne polecenie lokalnego mikrofonu, które
  zapisuje podpisany 16-bitowy, mało-endianowy, monofoniczny PCM do wykrywania
  ludzkiego wejścia w słowo podczas aktywnego odtwarzania asystenta. Obecnie
  dotyczy to hostowanego przez Gateway mostu pary poleceń `chrome`.
- `chrome.bargeInRmsThreshold: 650`: poziom RMS liczony jako przerwanie przez
  człowieka na `chrome.bargeInInputCommand`
- `chrome.bargeInPeakThreshold: 2500`: poziom szczytowy liczony jako przerwanie
  przez człowieka na `chrome.bargeInInputCommand`
- `chrome.bargeInCooldownMs: 900`: minimalne opóźnienie między powtarzanymi
  czyszczeniami przerwania przez człowieka
- `mode: "agent"`: domyślny tryb odpowiedzi głosowej. Mowa uczestników jest
  transkrybowana przez skonfigurowanego dostawcę transkrypcji realtime,
  wysyłana do skonfigurowanego agenta OpenClaw w sesji subagenta dla danego
  spotkania i odtwarzana głosem przez zwykłe środowisko wykonawcze TTS OpenClaw.
- `mode: "bidi"`: zapasowy bezpośredni dwukierunkowy tryb modelu realtime.
  Dostawca głosu realtime odpowiada bezpośrednio na mowę uczestników i może
  wywołać `openclaw_agent_consult` dla głębszych odpowiedzi wspartych narzędziami.
- `mode: "transcribe"`: tryb tylko obserwacji bez mostu odpowiedzi głosowej.
- `realtime.provider: "openai"`: identyfikator dostawcy używany przez tryb `agent`
  do transkrypcji realtime i przez tryb `bidi` do głosu realtime.
- `realtime.toolPolicy: "safe-read-only"`
- `realtime.instructions`: krótkie odpowiedzi mówione, z
  `openclaw_agent_consult` dla głębszych odpowiedzi
- `realtime.introMessage`: krótka mówiona kontrola gotowości, gdy most realtime
  się połączy; ustaw ją na `""`, aby dołączyć po cichu
- `realtime.agentId`: opcjonalny identyfikator agenta OpenClaw dla
  `openclaw_agent_consult`; domyślnie `main`

Opcjonalne nadpisania:

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
    provider: "google",
    agentId: "jay",
    toolPolicy: "owner",
    introMessage: "Say exactly: I'm here.",
    providers: {
      google: {
        model: "gemini-2.5-flash-native-audio-preview-12-2025",
        voice: "Kore",
      },
    },
  },
}
```

Konfiguracja tylko dla Twilio:

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

`voiceCall.enabled` ma domyślnie wartość `true`; przy transporcie Twilio deleguje
rzeczywiste połączenie PSTN, DTMF i powitanie wprowadzające do pluginu Voice Call.
Voice Call odtwarza sekwencję DTMF przed otwarciem strumienia multimediów
realtime, a następnie używa zapisanego tekstu wprowadzenia jako początkowego
powitania realtime. Jeśli `voice-call` nie jest włączony, Google Meet nadal może
zweryfikować i zarejestrować plan wybierania, ale nie może wykonać połączenia
Twilio.

## Narzędzie

Agenci mogą używać narzędzia `google_meet`:

```json
{
  "action": "join",
  "url": "https://meet.google.com/abc-defg-hij",
  "transport": "chrome-node",
  "mode": "agent"
}
```

Użyj `transport: "chrome"`, gdy Chrome działa na hoście Gateway. Użyj
`transport: "chrome-node"`, gdy Chrome działa na sparowanym węźle, takim jak
maszyna wirtualna Parallels. W obu przypadkach dostawcy modeli i
`openclaw_agent_consult` działają na hoście Gateway, więc dane uwierzytelniające
modeli pozostają tam. Przy domyślnym `mode: "agent"` dostawca transkrypcji
realtime obsługuje nasłuchiwanie, skonfigurowany agent OpenClaw tworzy odpowiedź,
a zwykłe TTS OpenClaw wypowiada ją w Meet. Użyj `mode: "bidi"`, gdy chcesz, aby
model głosu realtime odpowiadał bezpośrednio. `mode: "realtime"` pozostaje
akceptowane jako alias zgodności dla `mode: "agent"`.

Użyj `action: "status"`, aby wyświetlić aktywne sesje lub sprawdzić identyfikator
sesji. Użyj `action: "speak"` z `sessionId` i `message`, aby agent realtime
natychmiast zaczął mówić. Użyj `action: "test_speech"`, aby utworzyć lub ponownie
użyć sesji, wyzwolić znaną frazę i zwrócić kondycję `inCall`, gdy host Chrome
może ją zgłosić. `test_speech` zawsze wymusza `mode: "agent"` i kończy się
niepowodzeniem przy próbie uruchomienia w `mode: "transcribe"`, ponieważ sesje
tylko obserwacji celowo nie mogą emitować mowy. Wynik `speechOutputVerified`
opiera się na wzroście liczby bajtów wyjścia audio realtime podczas tego wywołania
testowego, więc ponownie użyta sesja ze starszym audio nie liczy się jako świeża,
udana kontrola mowy. Użyj `action: "leave"`, aby oznaczyć sesję jako zakończoną.

`status` obejmuje kondycję Chrome, gdy jest dostępna:

- `inCall`: Chrome wygląda, jakby był wewnątrz połączenia Meet
- `micMuted`: najlepsza możliwa informacja o stanie mikrofonu Meet
- `manualActionRequired` / `manualActionReason` / `manualActionMessage`: profil
  przeglądarki wymaga ręcznego logowania, dopuszczenia przez gospodarza Meet,
  uprawnień lub naprawy sterowania przeglądarką, zanim mowa będzie działać
- `speechReady` / `speechBlockedReason` / `speechBlockedMessage`: czy zarządzana
  mowa Chrome jest teraz dozwolona. `speechReady: false` oznacza, że OpenClaw nie
  wysłał frazy wprowadzającej/testowej do mostu audio.
- `providerConnected` / `realtimeReady`: stan mostu głosu realtime
- `lastInputAt` / `lastOutputAt`: ostatnie audio widziane z mostu lub wysłane do
  mostu
- `audioOutputRouted` / `audioOutputDeviceLabel`: czy wyjście multimediów karty
  Meet zostało aktywnie skierowane do urządzenia BlackHole używanego przez most
- `lastSuppressedInputAt` / `suppressedInputBytes`: wejście local loopback
  ignorowane, gdy odtwarzanie asystenta jest aktywne

```json
{
  "action": "speak",
  "sessionId": "meet_...",
  "message": "Say exactly: I'm here and listening."
}
```

## Tryby agenta i Bidi

Tryb Chrome `agent` jest zoptymalizowany pod zachowanie „mój agent jest na
spotkaniu”. Dostawca transkrypcji realtime słyszy audio spotkania, finalne
transkrypty uczestników są kierowane przez skonfigurowanego agenta OpenClaw,
a odpowiedź jest wypowiadana przez zwykłe środowisko wykonawcze TTS OpenClaw.
Ustaw `mode: "bidi"`, gdy chcesz, aby model głosu realtime odpowiadał
bezpośrednio.
Pobliskie finalne fragmenty transkrypcji są scalane przed konsultacją, aby jedna
wypowiedź nie powodowała kilku nieaktualnych częściowych odpowiedzi. Wejście
realtime jest również wyciszane, gdy zakolejkowane audio asystenta nadal się
odtwarza, a ostatnie echa transkrypcji podobne do asystenta są ignorowane przed
konsultacją agenta, aby local loopback BlackHole nie sprawił, że agent odpowie
na własną wypowiedź.

| Tryb    | Kto decyduje o odpowiedzi        | Ścieżka wyjścia mowy                  | Kiedy używać                                           |
| ------- | -------------------------------- | ------------------------------------- | ------------------------------------------------------ |
| `agent` | Skonfigurowany agent OpenClaw    | Zwykłe środowisko wykonawcze TTS OpenClaw | Gdy chcesz zachowania „mój agent jest na spotkaniu” |
| `bidi`  | Model głosu realtime             | Odpowiedź audio dostawcy głosu realtime | Gdy chcesz pętli głosowej rozmowy o najniższych opóźnieniach |

W trybie `bidi`, gdy model realtime potrzebuje głębszego rozumowania, bieżących
informacji lub zwykłych narzędzi OpenClaw, może wywołać
`openclaw_agent_consult`.

Narzędzie konsultacji uruchamia w tle zwykłego agenta OpenClaw z kontekstem
ostatniego transkryptu spotkania i zwraca zwięzłą odpowiedź mówioną. W trybie
`agent` OpenClaw wysyła tę odpowiedź bezpośrednio do środowiska wykonawczego TTS;
w trybie `bidi` model głosu realtime może wypowiedzieć wynik konsultacji z
powrotem na spotkaniu. Używa tego samego współdzielonego mechanizmu konsultacji
co Voice Call.

Domyślnie konsultacje działają względem agenta `main`. Ustaw `realtime.agentId`,
gdy tor Meet powinien konsultować się z dedykowanym obszarem roboczym agenta
OpenClaw, domyślnymi ustawieniami modelu, polityką narzędzi, pamięcią i historią
sesji.

Konsultacje w trybie agenta używają klucza sesji
`agent:<id>:subagent:google-meet:<session>` dla danego spotkania, dzięki czemu
pytania uzupełniające zachowują kontekst spotkania, dziedzicząc zwykłą politykę
agenta ze skonfigurowanego agenta.

`realtime.toolPolicy` steruje uruchomieniem konsultacji:

- `safe-read-only`: udostępnij narzędzie konsultacji i ogranicz zwykłego agenta do
  `read`, `web_search`, `web_fetch`, `x_search`, `memory_search` oraz
  `memory_get`.
- `owner`: udostępnij narzędzie konsultacji i pozwól zwykłemu agentowi używać
  normalnej polityki narzędzi agenta.
- `none`: nie udostępniaj narzędzia konsultacji modelowi głosu realtime.

Klucz sesji konsultacji jest ograniczony do sesji Meet, więc kolejne wywołania
konsultacji mogą ponownie używać wcześniejszego kontekstu konsultacji podczas
tego samego spotkania.

Aby wymusić mówioną kontrolę gotowości po pełnym dołączeniu Chrome do połączenia:

```bash
openclaw googlemeet speak meet_... "Say exactly: I'm here and listening."
```

Pełny smoke join-and-speak:

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij \
  --transport chrome-node \
  --message "Say exactly: I'm here and listening."
```

## Lista kontrolna testu live

Użyj tej sekwencji przed przekazaniem spotkania nienadzorowanemu agentowi:

```bash
openclaw googlemeet setup
openclaw nodes status
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij \
  --transport chrome-node \
  --message "Say exactly: Google Meet speech test complete."
```

Oczekiwany stan Chrome-node:

- `googlemeet setup` jest w całości zielone.
- `googlemeet setup` obejmuje `chrome-node-connected`, gdy Chrome-node jest
  domyślnym transportem lub gdy przypięto węzeł.
- `nodes status` pokazuje wybrany węzeł jako połączony.
- Wybrany węzeł ogłasza zarówno `googlemeet.chrome`, jak i `browser.proxy`.
- Karta Meet dołącza do połączenia, a `test-speech` zwraca kondycję Chrome z
  `inCall: true`.

Dla zdalnego hosta Chrome, takiego jak maszyna wirtualna Parallels macOS, jest to
najkrótsza bezpieczna kontrola po aktualizacji Gateway lub maszyny wirtualnej:

```bash
openclaw googlemeet setup
openclaw nodes status --connected
openclaw nodes invoke \
  --node parallels-macos \
  --command googlemeet.chrome \
  --params '{"action":"setup"}'
```

To dowodzi, że Plugin Gateway jest załadowany, węzeł maszyny wirtualnej jest
połączony z bieżącym tokenem, a most audio Meet jest dostępny, zanim agent otworzy
rzeczywistą kartę spotkania.

Dla smoke Twilio użyj spotkania, które udostępnia szczegóły połączenia
telefonicznego:

```bash
openclaw googlemeet setup
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --pin 123456
```

Oczekiwany stan Twilio:

- `googlemeet setup` obejmuje zielone kontrole `twilio-voice-call-plugin`,
  `twilio-voice-call-credentials` i `twilio-voice-call-webhook`.
- `voicecall` jest dostępne w CLI po przeładowaniu Gateway.
- Zwrócona sesja ma `transport: "twilio"` oraz `twilio.voiceCallId`.
- `openclaw logs --follow` pokazuje TwiML DTMF obsłużone przed TwiML czasu rzeczywistego, a następnie
  most czasu rzeczywistego z zakolejkowanym początkowym powitaniem.
- `googlemeet leave <sessionId>` rozłącza delegowane połączenie głosowe.

## Rozwiązywanie problemów

### Agent nie widzi narzędzia Google Meet

Potwierdź, że Plugin jest włączony w konfiguracji Gateway, i przeładuj Gateway:

```bash
openclaw plugins list | grep google-meet
openclaw googlemeet setup
```

Jeśli właśnie edytowano `plugins.entries.google-meet`, uruchom ponownie lub przeładuj Gateway.
Działający agent widzi tylko narzędzia Pluginów zarejestrowane przez bieżący proces
Gateway.

Na hostach Gateway innych niż macOS narzędzie `google_meet` widoczne dla agenta pozostaje widoczne,
ale lokalne akcje odpowiedzi głosowej Chrome są blokowane, zanim trafią do mostu audio.
Lokalny dźwięk odpowiedzi głosowej Chrome obecnie zależy od macOS `BlackHole 2ch`, więc
agenci Linux powinni używać `mode: "transcribe"`, połączenia Twilio, albo hosta macOS
`chrome-node` zamiast domyślnej ścieżki lokalnego agenta Chrome.

### Brak połączonego węzła obsługującego Google Meet

Na hoście węzła uruchom:

```bash
openclaw plugins enable google-meet
openclaw plugins enable browser
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node run --host <gateway-lan-ip> --port 18789 --display-name parallels-macos
```

Na hoście Gateway zatwierdź węzeł i zweryfikuj polecenia:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw nodes status
```

Węzeł musi być połączony i wymieniać `googlemeet.chrome` oraz `browser.proxy`.
Konfiguracja Gateway musi zezwalać na te polecenia węzła:

```json5
{
  gateway: {
    nodes: {
      allowCommands: ["browser.proxy", "googlemeet.chrome"],
    },
  },
}
```

Jeśli `googlemeet setup` nie przejdzie kontroli `chrome-node-connected` albo log Gateway zgłasza
`gateway token mismatch`, zainstaluj ponownie lub uruchom ponownie węzeł z bieżącym tokenem Gateway.
Dla Gateway w sieci LAN zwykle oznacza to:

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node install \
  --host <gateway-lan-ip> \
  --port 18789 \
  --display-name parallels-macos \
  --force
```

Następnie przeładuj usługę węzła i uruchom ponownie:

```bash
openclaw googlemeet setup
openclaw nodes status --connected
```

### Przeglądarka się otwiera, ale agent nie może dołączyć

Uruchom `googlemeet test-listen` dla dołączeń tylko obserwacyjnych albo `googlemeet test-speech`
dla dołączeń czasu rzeczywistego, a następnie sprawdź zwrócony stan Chrome. Jeśli któraś próba
zgłasza `manualActionRequired: true`, pokaż operatorowi `manualActionMessage`
i przestań ponawiać próby do czasu ukończenia działania w przeglądarce.

Typowe działania ręczne:

- Zalogowanie się do profilu Chrome.
- Wpuszczenie gościa z konta gospodarza Meet.
- Nadanie Chrome uprawnień do mikrofonu/kamery, gdy pojawi się natywny monit uprawnień
  Chrome.
- Zamknięcie lub naprawienie zablokowanego okna dialogowego uprawnień Meet.

Nie zgłaszaj „not signed in” tylko dlatego, że Meet pokazuje „Do you want people to
hear you in the meeting?” To ekran pośredni wyboru audio Meet; OpenClaw
klika **Use microphone** przez automatyzację przeglądarki, gdy jest dostępne, i dalej
czeka na rzeczywisty stan spotkania. Dla awaryjnego tworzenia tylko przez przeglądarkę OpenClaw
może kliknąć **Continue without microphone**, ponieważ utworzenie URL nie wymaga
ścieżki audio czasu rzeczywistego.

### Tworzenie spotkania kończy się niepowodzeniem

`googlemeet create` najpierw używa endpointu Google Meet API `spaces.create`,
gdy skonfigurowano dane uwierzytelniające OAuth. Bez danych uwierzytelniających OAuth przechodzi awaryjnie
na przypiętą przeglądarkę węzła Chrome. Potwierdź:

- Dla tworzenia przez API: skonfigurowano `oauth.clientId` i `oauth.refreshToken`
  albo obecne są pasujące zmienne środowiskowe `OPENCLAW_GOOGLE_MEET_*`.
- Dla tworzenia przez API: token odświeżania został wygenerowany po dodaniu obsługi
  tworzenia. Starszym tokenom może brakować zakresu `meetings.space.created`; uruchom ponownie
  `openclaw googlemeet auth login --json` i zaktualizuj konfigurację Pluginu.
- Dla awaryjnej ścieżki przeglądarki: `defaultTransport: "chrome-node"` i
  `chromeNode.node` wskazują połączony węzeł z `browser.proxy` oraz
  `googlemeet.chrome`.
- Dla awaryjnej ścieżki przeglądarki: profil Chrome OpenClaw na tym węźle jest zalogowany
  do Google i może otworzyć `https://meet.google.com/new`.
- Dla awaryjnej ścieżki przeglądarki: ponowienia używają istniejącej karty
  `https://meet.google.com/new` lub monitu konta Google przed otwarciem nowej karty. Jeśli agent przekroczy limit czasu,
  ponów wywołanie narzędzia zamiast ręcznie otwierać kolejną kartę Meet.
- Dla awaryjnej ścieżki przeglądarki: jeśli narzędzie zwraca `manualActionRequired: true`, użyj
  zwróconych `browser.nodeId`, `browser.targetId`, `browserUrl` oraz
  `manualActionMessage`, aby poprowadzić operatora. Nie ponawiaj prób w pętli, dopóki to
  działanie nie zostanie ukończone.
- Dla awaryjnej ścieżki przeglądarki: jeśli Meet pokazuje „Do you want people to hear you in the
  meeting?”, zostaw kartę otwartą. OpenClaw powinien kliknąć **Use microphone** albo, dla
  awaryjnego tworzenia tylko, **Continue without microphone** przez automatyzację
  przeglądarki i dalej czekać na wygenerowany URL Meet. Jeśli nie może, błąd
  powinien wspominać `meet-audio-choice-required`, a nie `google-login-required`.

### Agent dołącza, ale nie mówi

Sprawdź ścieżkę czasu rzeczywistego:

```bash
openclaw googlemeet setup
openclaw googlemeet doctor
```

Użyj `mode: "agent"` dla normalnej ścieżki STT -> agent OpenClaw -> odpowiedź głosowa TTS,
albo `mode: "bidi"` dla bezpośredniej awaryjnej ścieżki głosu czasu rzeczywistego. `mode: "transcribe"`
celowo nie uruchamia mostu odpowiedzi głosowej. Do debugowania tylko obserwacyjnego
uruchom `openclaw googlemeet status --json <session-id>` po wypowiedziach uczestników
i sprawdź `captioning`, `transcriptLines` oraz `lastCaptionText`. Jeśli `inCall` ma
wartość true, ale `transcriptLines` pozostaje na `0`, napisy Meet mogą być wyłączone, nikt
nie mówił od czasu zainstalowania obserwatora, interfejs Meet się zmienił albo napisy na żywo
są niedostępne dla języka/konta spotkania.

`googlemeet test-speech` zawsze sprawdza ścieżkę czasu rzeczywistego i zgłasza, czy
zaobserwowano bajty wyjściowe mostu dla tego wywołania. Jeśli `speechOutputVerified` ma wartość false, a
`speechOutputTimedOut` ma wartość true, dostawca czasu rzeczywistego mógł zaakceptować
wypowiedź, ale OpenClaw nie zobaczył nowych bajtów wyjściowych docierających do mostu audio
Chrome.

Zweryfikuj także:

- Klucz dostawcy czasu rzeczywistego jest dostępny na hoście Gateway, na przykład
  `OPENAI_API_KEY` albo `GEMINI_API_KEY`.
- `BlackHole 2ch` jest widoczne na hoście Chrome.
- `sox` istnieje na hoście Chrome.
- Mikrofon i głośnik Meet są kierowane przez wirtualną ścieżkę audio używaną przez
  OpenClaw. `doctor` powinien pokazywać `meet output routed: yes` dla lokalnych dołączeń
  Chrome czasu rzeczywistego.

`googlemeet doctor [session-id]` wypisuje sesję, węzeł, stan połączenia,
powód działania ręcznego, połączenie z dostawcą czasu rzeczywistego, `realtimeReady`, aktywność
wejścia/wyjścia audio, ostatnie znaczniki czasu audio, liczniki bajtów i URL przeglądarki.
Użyj `googlemeet status [session-id] --json`, gdy potrzebujesz surowego JSON. Użyj
`googlemeet doctor --oauth`, gdy musisz zweryfikować odświeżanie OAuth Google Meet
bez ujawniania tokenów; dodaj `--meeting` albo `--create-space`, gdy potrzebujesz także
dowodu Google Meet API.

Jeśli agent przekroczył limit czasu i widzisz już otwartą kartę Meet, sprawdź tę kartę
bez otwierania kolejnej:

```bash
openclaw googlemeet recover-tab
openclaw googlemeet recover-tab https://meet.google.com/abc-defg-hij
```

Równoważnym działaniem narzędzia jest `recover_current_tab`. Ustawia fokus i sprawdza
istniejącą kartę Meet dla wybranego transportu. Z `chrome` używa lokalnego
sterowania przeglądarką przez Gateway; z `chrome-node` używa skonfigurowanego
węzła Chrome. Nie otwiera nowej karty ani nie tworzy nowej sesji; zgłasza
bieżącą blokadę, taką jak logowanie, wpuszczenie, uprawnienia albo stan wyboru audio.
Polecenie CLI komunikuje się ze skonfigurowanym Gateway, więc Gateway musi działać;
`chrome-node` wymaga także połączenia węzła Chrome.

### Kontrole konfiguracji Twilio kończą się niepowodzeniem

`twilio-voice-call-plugin` kończy się niepowodzeniem, gdy `voice-call` nie jest dozwolone albo nie jest włączone.
Dodaj je do `plugins.allow`, włącz `plugins.entries.voice-call` i przeładuj
Gateway.

`twilio-voice-call-credentials` kończy się niepowodzeniem, gdy backendowi Twilio brakuje identyfikatora SID konta, tokena uwierzytelniającego albo numeru dzwoniącego. Ustaw je na hoście Gateway:

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
```

`twilio-voice-call-webhook` kończy się niepowodzeniem, gdy `voice-call` nie ma publicznego
wystawienia Webhooka albo gdy `publicUrl` wskazuje na local loopback lub przestrzeń sieci prywatnej.
Ustaw `plugins.entries.voice-call.config.publicUrl` na publiczny URL dostawcy albo
skonfiguruj tunel/wystawienie Tailscale dla `voice-call`.

Adresy URL local loopback i prywatne nie są prawidłowe dla wywołań zwrotnych operatorów. Nie używaj
`localhost`, `127.0.0.1`, `0.0.0.0`, `10.x`, `172.16.x`-`172.31.x`,
`192.168.x`, `169.254.x`, `fc00::/7` ani `fd00::/8` jako `publicUrl`.

Dla stabilnego publicznego URL:

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

Do lokalnego programowania użyj tunelu albo wystawienia Tailscale zamiast prywatnego
URL hosta:

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          tunnel: { provider: "ngrok" },
          // or
          tailscale: { mode: "funnel", path: "/voice/webhook" },
        },
      },
    },
  },
}
```

Następnie uruchom ponownie albo przeładuj Gateway i uruchom:

```bash
openclaw googlemeet setup --transport twilio
openclaw voicecall setup
openclaw voicecall smoke
```

`voicecall smoke` domyślnie sprawdza tylko gotowość. Aby wykonać próbę na sucho dla konkretnego numeru:

```bash
openclaw voicecall smoke --to "+15555550123"
```

Dodaj `--yes` tylko wtedy, gdy celowo chcesz wykonać rzeczywiste wychodzące
połączenie powiadamiające:

```bash
openclaw voicecall smoke --to "+15555550123" --yes
```

### Połączenie Twilio się rozpoczyna, ale nigdy nie wchodzi do spotkania

Potwierdź, że zdarzenie Meet udostępnia dane telefonicznego dołączenia. Podaj dokładny numer
telefoniczny i PIN albo niestandardową sekwencję DTMF:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --dtmf-sequence ww123456#
```

Użyj początkowego `w` albo przecinków w `--dtmf-sequence`, jeśli dostawca potrzebuje pauzy
przed wprowadzeniem PIN.

Jeśli połączenie telefoniczne jest utworzone, ale lista uczestników Meet nigdy nie pokazuje uczestnika
telefonicznego:

- Uruchom `openclaw googlemeet doctor <session-id>`, aby potwierdzić delegowany identyfikator połączenia Twilio,
  czy DTMF zostało zakolejkowane i czy zażądano powitania wprowadzającego.
- Uruchom `openclaw voicecall status --call-id <id>` i potwierdź, że połączenie nadal
  jest aktywne.
- Uruchom `openclaw voicecall tail` i sprawdź, czy Webhooki Twilio docierają do
  Gateway.
- Uruchom `openclaw logs --follow` i poszukaj sekwencji Twilio Meet: Google
  Meet deleguje dołączenie, Voice Call rozpoczyna odnogę telefoniczną, Google Meet czeka
  `voiceCall.dtmfDelayMs`, wysyła DTMF przez `voicecall.dtmf`, czeka
  `voiceCall.postDtmfSpeechDelayMs`, a następnie żąda mowy wprowadzającej przez
  `voicecall.speak`.
- Uruchom ponownie `openclaw googlemeet setup --transport twilio`; zielona kontrola konfiguracji jest
  wymagana, ale nie dowodzi, że sekwencja PIN spotkania jest poprawna.
- Potwierdź, że numer telefoniczny należy do tego samego zaproszenia Meet i regionu co
  PIN.
- Zwiększ `voiceCall.dtmfDelayMs`, jeśli Meet odbiera powoli albo transkrypcja połączenia
  nadal pokazuje monit proszący o PIN po wysłaniu DTMF.
- Jeśli uczestnik dołącza, ale nie słyszysz powitania, sprawdź
  `openclaw logs --follow` pod kątem żądania `voicecall.speak` po DTMF oraz
  odtwarzania TTS strumienia multimediów albo awaryjnego `<Say>` Twilio. Jeśli transkrypcja połączenia
  nadal zawiera „enter the meeting PIN”, odnoga telefoniczna jeszcze nie dołączyła
  do pokoju Meet, więc uczestnicy spotkania nie usłyszą mowy.

Jeśli webhooks nie docierają, najpierw debuguj Plugin Voice Call: dostawca musi
osiągać `plugins.entries.voice-call.config.publicUrl` albo skonfigurowany tunel.
Zobacz [rozwiązywanie problemów z połączeniami głosowymi](/pl/plugins/voice-call#troubleshooting).

## Uwagi

Oficjalny interfejs API mediów Google Meet jest ukierunkowany na odbiór, więc
mówienie do połączenia Meet nadal wymaga ścieżki uczestnika. Ten Plugin utrzymuje
tę granicę widoczną: Chrome obsługuje uczestnictwo przeglądarkowe i lokalne
trasowanie dźwięku; Twilio obsługuje uczestnictwo przez telefoniczne wdzwonienie.

Tryby odpowiedzi głosowej Chrome wymagają `BlackHole 2ch` oraz jednego z poniższych:

- `chrome.audioInputCommand` plus `chrome.audioOutputCommand`: OpenClaw jest właścicielem
  mostu i przesyła dźwięk w `chrome.audioFormat` między tymi poleceniami a
  wybranym dostawcą. Tryb agenta używa transkrypcji w czasie rzeczywistym oraz zwykłego TTS;
  tryb bidi używa dostawcy głosu w czasie rzeczywistym. Domyślna ścieżka Chrome to 24 kHz
  PCM16; 8 kHz G.711 mu-law pozostaje dostępne dla starszych par poleceń.
- `chrome.audioBridgeCommand`: zewnętrzne polecenie mostu jest właścicielem całej lokalnej
  ścieżki audio i musi zakończyć działanie po uruchomieniu lub zweryfikowaniu swojego demona. Jest to
  prawidłowe tylko dla `bidi`, ponieważ tryb `agent` wymaga bezpośredniego dostępu do par poleceń dla TTS.

Aby uzyskać czysty dźwięk dupleksowy, trasuj wyjście Meet i mikrofon Meet przez oddzielne
urządzenia wirtualne albo graf urządzeń wirtualnych w stylu Loopback. Jedno współdzielone
urządzenie BlackHole może odsyłać echo innych uczestników z powrotem do połączenia.

W przypadku mostu Chrome opartego na parze poleceń `chrome.bargeInInputCommand` może nasłuchiwać
oddzielnego lokalnego mikrofonu i czyścić odtwarzanie asystenta, gdy człowiek zaczyna
mówić. Dzięki temu mowa człowieka ma pierwszeństwo przed wyjściem asystenta nawet wtedy, gdy współdzielone
wejście loopback BlackHole jest tymczasowo tłumione podczas odtwarzania asystenta.
Podobnie jak `chrome.audioInputCommand` i `chrome.audioOutputCommand`, jest to
lokalne polecenie skonfigurowane przez operatora. Użyj jawnej, zaufanej ścieżki polecenia lub
listy argumentów i nie wskazuj skryptów z niezaufanych lokalizacji.

`googlemeet speak` uruchamia aktywny most audio odpowiedzi głosowej dla sesji Chrome.
`googlemeet leave` zatrzymuje ten most. W przypadku sesji Twilio delegowanych
przez Plugin Voice Call `leave` także rozłącza bazowe połączenie głosowe.
Użyj `googlemeet end-active-conference`, gdy chcesz również zamknąć aktywną
konferencję Google Meet dla przestrzeni zarządzanej przez API.

## Powiązane

- [Plugin Voice Call](/pl/plugins/voice-call)
- [Tryb rozmowy](/pl/nodes/talk)
- [Tworzenie plugins](/pl/plugins/building-plugins)
