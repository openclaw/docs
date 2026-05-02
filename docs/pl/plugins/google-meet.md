---
read_when:
    - Chcesz, aby agent OpenClaw dołączył do rozmowy Google Meet
    - Chcesz, aby agent OpenClaw utworzył nowe spotkanie Google Meet
    - Konfigurujesz Chrome, węzeł Chrome lub Twilio jako transport Google Meet
summary: 'Plugin Google Meet: dołączanie do jawnych adresów URL Meet przez Chrome lub Twilio z domyślnymi ustawieniami głosu w czasie rzeczywistym'
title: Plugin Google Meet
x-i18n:
    generated_at: "2026-05-02T20:47:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0dc515382d2cc7beacaf18a50b75cb0f4eda3038cfd8efe73ea3ce7b5007bc43
    source_path: plugins/google-meet.md
    workflow: 16
---

Obsługa uczestnika Google Meet dla OpenClaw — Plugin jest celowo jawny:

- Dołącza tylko do jawnego URL `https://meet.google.com/...`.
- Może utworzyć nową przestrzeń Meet przez Google Meet API, a następnie dołączyć do
  zwróconego URL.
- `realtime` voice jest trybem domyślnym.
- Głos w czasie rzeczywistym może wywołać pełnego agenta OpenClaw, gdy potrzebne jest głębsze
  rozumowanie lub narzędzia.
- Agenci wybierają zachowanie dołączania za pomocą `mode`: użyj `realtime` do nasłuchu na żywo
  i odpowiadania głosem albo `transcribe`, aby dołączyć/kontrolować przeglądarkę bez
  mostka głosu w czasie rzeczywistym.
- Uwierzytelnianie zaczyna się od osobistego Google OAuth albo już zalogowanego profilu Chrome.
- Nie ma automatycznego ogłoszenia zgody.
- Domyślnym backendem audio Chrome jest `BlackHole 2ch`.
- Chrome może działać lokalnie albo na sparowanym hoście node.
- Twilio przyjmuje numer telefoniczny plus opcjonalny PIN lub sekwencję DTMF; nie
  może bezpośrednio wybrać URL Meet.
- Polecenie CLI to `googlemeet`; `meet` jest zarezerwowane dla szerszych przepływów
  telekonferencji agenta.

## Szybki start

Zainstaluj lokalne zależności audio i skonfiguruj backendowego dostawcę głosu w czasie rzeczywistym.
OpenAI jest domyślne; Google Gemini Live także działa z
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

Włącz Plugin:

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

Wynik konfiguracji ma być czytelny dla agenta i świadomy trybu. Raportuje profil Chrome,
przypięcie node oraz, dla dołączeń Chrome w czasie rzeczywistym, mostek audio
BlackHole/SoX i opóźnione kontrole wstępu w czasie rzeczywistym. Dla dołączeń tylko obserwacyjnych sprawdź ten sam
transport za pomocą `--mode transcribe`; ten tryb pomija wymagania wstępne audio w czasie rzeczywistym,
ponieważ nie nasłuchuje przez mostek ani przez niego nie mówi:

```bash
openclaw googlemeet setup --transport chrome-node --mode transcribe
```

Gdy skonfigurowano delegowanie Twilio, konfiguracja raportuje także, czy
Plugin `voice-call`, poświadczenia Twilio i publiczna ekspozycja Webhook są gotowe.
Traktuj każdą kontrolę `ok: false` jako blokadę dla sprawdzanego transportu i trybu,
zanim poprosisz agenta o dołączenie. Użyj `openclaw googlemeet setup --json` dla
skryptów lub wyniku czytelnego maszynowo. Użyj `--transport chrome`,
`--transport chrome-node` albo `--transport twilio`, aby wstępnie sprawdzić konkretny
transport, zanim agent go spróbuje.

Dla Twilio zawsze jawnie sprawdzaj transport wstępnie, gdy domyślnym transportem
jest Chrome:

```bash
openclaw googlemeet setup --transport twilio
```

Wychwytuje to brakujące połączenia `voice-call`, poświadczenia Twilio albo nieosiągalną
ekspozycję Webhook, zanim agent spróbuje zadzwonić na spotkanie.

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
  "mode": "realtime"
}
```

Narzędzie `google_meet` widoczne dla agenta pozostaje dostępne na hostach innych niż macOS dla
przepływów artefaktów, kalendarza, konfiguracji, transkrypcji, Twilio i `chrome-node`. Lokalne
akcje Chrome w czasie rzeczywistym są tam blokowane, ponieważ dołączona ścieżka audio Chrome
w czasie rzeczywistym obecnie zależy od macOS `BlackHole 2ch`. Na Linuxie użyj
`mode: "transcribe"`, numeru telefonicznego Twilio albo hosta `chrome-node` na macOS do udziału
Chrome w czasie rzeczywistym.

Utwórz nowe spotkanie i dołącz do niego:

```bash
openclaw googlemeet create --transport chrome-node --mode realtime
```

Dla pokojów utworzonych przez API użyj Google Meet `SpaceConfig.accessType`, gdy chcesz,
aby polityka pokoju bez pukania była jawna zamiast dziedziczona z domyślnych ustawień konta
Google:

```bash
openclaw googlemeet create --access-type OPEN --transport chrome-node --mode realtime
```

`OPEN` pozwala dołączyć bez pukania każdemu, kto ma URL Meet. `TRUSTED` pozwala
zaufanym użytkownikom organizacji hosta, zaproszonym użytkownikom zewnętrznym i użytkownikom
telefonicznym dołączać bez pukania. `RESTRICTED` ogranicza wejście bez pukania do zaproszonych osób. Te
ustawienia dotyczą tylko oficjalnej ścieżki tworzenia Google Meet API, więc poświadczenia
OAuth muszą być skonfigurowane.

Jeśli uwierzytelniłeś Google Meet przed dostępnością tej opcji, uruchom ponownie
`openclaw googlemeet auth login --json` po dodaniu zakresu
`meetings.space.settings` do ekranu zgody Google OAuth.

Utwórz tylko URL bez dołączania:

```bash
openclaw googlemeet create --no-join
```

`googlemeet create` ma dwie ścieżki:

- Tworzenie przez API: używane, gdy skonfigurowano poświadczenia Google Meet OAuth. To
  najbardziej deterministyczna ścieżka i nie zależy od stanu interfejsu przeglądarki.
- Awaryjna ścieżka przeglądarki: używana, gdy nie ma poświadczeń OAuth. OpenClaw używa
  przypiętego node Chrome, otwiera `https://meet.google.com/new`, czeka, aż Google
  przekieruje do prawdziwego URL z kodem spotkania, a następnie zwraca ten URL. Ta ścieżka wymaga,
  aby profil Chrome OpenClaw na node był już zalogowany w Google.
  Automatyzacja przeglądarki obsługuje własny pierwszy monit Meet o mikrofon; ten monit
  nie jest traktowany jako błąd logowania Google.
  Przepływy dołączania i tworzenia próbują też ponownie użyć istniejącej karty Meet przed otwarciem
  nowej. Dopasowanie ignoruje nieszkodliwe ciągi zapytania URL, takie jak `authuser`, więc
  ponowna próba agenta powinna skupić już otwarte spotkanie zamiast tworzyć drugą
  kartę Chrome.

Wynik polecenia/narzędzia zawiera pole `source` (`api` albo `browser`), dzięki czemu agenci
mogą wyjaśnić, której ścieżki użyto. `create` domyślnie dołącza do nowego spotkania i
zwraca `joined: true` oraz sesję dołączenia. Aby tylko utworzyć URL, użyj
`create --no-join` w CLI albo przekaż `"join": false` do narzędzia.

Albo powiedz agentowi: „Utwórz Google Meet, dołącz do niego głosem w czasie rzeczywistym i wyślij
mi link”. Agent powinien wywołać `google_meet` z `action: "create"`, a
następnie udostępnić zwrócone `meetingUri`.

```json
{
  "action": "create",
  "transport": "chrome-node",
  "mode": "realtime"
}
```

Dla dołączenia tylko obserwacyjnego/kontrolującego przeglądarkę ustaw `"mode": "transcribe"`. To
nie uruchamia dwukierunkowego mostka modelu w czasie rzeczywistym, nie wymaga BlackHole ani SoX
i nie będzie odpowiadać głosem na spotkaniu. Dołączenia Chrome w tym trybie unikają także
nadawania przez OpenClaw uprawnień do mikrofonu/kamery i unikają ścieżki Meet **Użyj
mikrofonu**. Jeśli Meet pokazuje ekran wyboru audio, automatyzacja próbuje
ścieżki bez mikrofonu, a w przeciwnym razie raportuje ręczną akcję zamiast otwierać
lokalny mikrofon. W trybie transcribe zarządzane transporty Chrome instalują także
obserwator napisów Meet działający w trybie best-effort. `googlemeet status --json` i
`googlemeet doctor` pokazują `captioning`, `captionsEnabledAttempted`,
`transcriptLines`, `lastCaptionAt`, `lastCaptionSpeaker`, `lastCaptionText`,
oraz krótki ogon `recentTranscript`, aby operatorzy mogli stwierdzić, czy przeglądarka
dołączyła do rozmowy i czy napisy Meet produkują tekst.
Użyj `openclaw googlemeet test-listen <meet-url> --transport chrome-node`, gdy
potrzebujesz sondy tak/nie: dołącza w trybie transcribe, czeka na świeży ruch napisów lub
transkrypcji i zwraca `listenVerified`, `listenTimedOut`, pola ręcznej
akcji oraz najnowszy stan napisów.

Podczas sesji w czasie rzeczywistym status `google_meet` zawiera stan przeglądarki i mostka audio,
taki jak `inCall`, `manualActionRequired`, `providerConnected`,
`realtimeReady`, `audioInputActive`, `audioOutputActive`, znaczniki czasu ostatniego wejścia/wyjścia,
liczniki bajtów i stan zamknięcia mostka. Jeśli pojawi się bezpieczny monit strony Meet,
automatyzacja przeglądarki obsługuje go, gdy może. Monity logowania, dopuszczenia przez hosta oraz
uprawnień przeglądarki/systemu operacyjnego są raportowane jako ręczna akcja z powodem i
wiadomością do przekazania przez agenta. Zarządzane sesje Chrome emitują wstęp lub
frazę testową dopiero po zgłoszeniu przez stan przeglądarki `inCall: true`; w przeciwnym razie status raportuje
`speechReady: false`, a próba mowy jest blokowana zamiast udawać, że
agent przemówił na spotkaniu.

Lokalne dołączenia Chrome przechodzą przez zalogowany profil przeglądarki OpenClaw. Tryb czasu rzeczywistego
wymaga `BlackHole 2ch` dla ścieżki mikrofonu/głośnika używanej przez OpenClaw. Dla
czystego dwukierunkowego audio użyj oddzielnych urządzeń wirtualnych albo grafu w stylu Loopback; jedno
urządzenie BlackHole wystarcza do pierwszego testu smoke, ale może powodować echo.

### Lokalny Gateway + Chrome w Parallels

Nie potrzebujesz pełnego OpenClaw Gateway ani klucza API modelu w maszynie wirtualnej macOS
tylko po to, aby VM była właścicielem Chrome. Uruchom Gateway i agenta lokalnie, a następnie uruchom
host node w VM. Włącz raz dołączony Plugin w VM, aby node
reklamował polecenie Chrome:

Co działa gdzie:

- Host Gateway: OpenClaw Gateway, przestrzeń robocza agenta, klucze modelu/API, dostawca czasu rzeczywistego
  i konfiguracja Pluginu Google Meet.
- Maszyna wirtualna macOS Parallels: OpenClaw CLI/host node, Google Chrome, SoX, BlackHole 2ch,
  i profil Chrome zalogowany w Google.
- Niepotrzebne w VM: usługa Gateway, konfiguracja agenta, klucz OpenAI/GPT ani konfiguracja
  dostawcy modelu.

Zainstaluj zależności VM:

```bash
brew install blackhole-2ch sox
```

Uruchom VM ponownie po zainstalowaniu BlackHole, aby macOS udostępnił `BlackHole 2ch`:

```bash
sudo reboot
```

Po ponownym uruchomieniu zweryfikuj, że VM widzi urządzenie audio i polecenia SoX:

```bash
system_profiler SPAudioDataType | grep -i BlackHole
command -v sox
```

Zainstaluj lub zaktualizuj OpenClaw w VM, a następnie włącz tam dołączony Plugin:

```bash
openclaw plugins enable google-meet
```

Uruchom host node w VM:

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name parallels-macos
```

Jeśli `<gateway-host>` jest adresem IP LAN i nie używasz TLS, node odrzuci
jawnym tekstem WebSocket, chyba że świadomie zezwolisz na tę zaufaną sieć prywatną:

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node run --host <gateway-lan-ip> --port 18789 --display-name parallels-macos
```

Użyj tej samej zmiennej środowiskowej podczas instalowania node jako LaunchAgent:

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node install --host <gateway-lan-ip> --port 18789 --display-name parallels-macos --force
openclaw node restart
```

`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` jest środowiskiem procesu, a nie
ustawieniem `openclaw.json`. `openclaw node install` zapisuje je w środowisku
LaunchAgent, gdy jest obecne w poleceniu instalacji.

Zatwierdź node z hosta Gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Potwierdź, że Gateway widzi node i że reklamuje zarówno `googlemeet.chrome`,
jak i capability przeglądarki/`browser.proxy`:

```bash
openclaw nodes status
```

Skieruj Meet przez ten node na hoście Gateway:

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

Dla jednopoleceniowego testu smoke, który tworzy lub ponownie wykorzystuje sesję, wypowiada znaną
frazę i drukuje stan sesji:

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij
```

Podczas dołączania w trybie realtime automatyzacja przeglądarki OpenClaw wypełnia nazwę gościa, klika
Dołącz/Poproś o dołączenie i akceptuje pierwszy wybór Meet „Use microphone”, gdy ten
monit się pojawi. Podczas dołączania tylko do obserwacji lub tworzenia spotkania tylko w przeglądarce
przechodzi dalej przez ten sam monit bez mikrofonu, gdy ta opcja jest dostępna.
Jeśli profil przeglądarki nie jest zalogowany, Meet czeka na dopuszczenie przez gospodarza,
Chrome potrzebuje uprawnień do mikrofonu/kamery dla dołączenia realtime albo Meet utknął
na monicie, którego automatyzacja nie mogła obsłużyć, wynik join/test-speech zgłasza
`manualActionRequired: true` z `manualActionReason` i
`manualActionMessage`. Agenci powinni przestać ponawiać dołączanie, zgłosić dokładnie ten
komunikat wraz z bieżącymi `browserUrl`/`browserTitle` i ponowić próbę dopiero po
ukończeniu ręcznej akcji w przeglądarce.

Jeśli `chromeNode.node` zostanie pominięte, OpenClaw wybiera automatycznie tylko wtedy, gdy dokładnie jeden
połączony węzeł ogłasza zarówno `googlemeet.chrome`, jak i sterowanie przeglądarką. Jeśli
połączonych jest kilka zdolnych węzłów, ustaw `chromeNode.node` na identyfikator węzła,
nazwę wyświetlaną lub zdalny adres IP.

Typowe kontrole błędów:

- `Configured Google Meet node ... is not usable: offline`: przypięty węzeł jest
  znany Gateway, ale niedostępny. Agenci powinni traktować ten węzeł jako
  stan diagnostyczny, a nie jako używalny host Chrome, i zgłosić blokadę konfiguracji
  zamiast przełączać się na inny transport, chyba że użytkownik o to poprosił.
- `No connected Google Meet-capable node`: uruchom `openclaw node run` w maszynie wirtualnej,
  zatwierdź parowanie i upewnij się, że w maszynie wirtualnej uruchomiono
  `openclaw plugins enable google-meet` oraz
  `openclaw plugins enable browser`. Potwierdź też, że host
  Gateway zezwala na oba polecenia węzła za pomocą
  `gateway.nodes.allowCommands: ["googlemeet.chrome", "browser.proxy"]`.
- `BlackHole 2ch audio device not found`: zainstaluj `blackhole-2ch` na sprawdzanym hoście
  i uruchom ponownie przed użyciem lokalnego dźwięku Chrome.
- `BlackHole 2ch audio device not found on the node`: zainstaluj `blackhole-2ch`
  w maszynie wirtualnej i uruchom ją ponownie.
- Chrome otwiera się, ale nie może dołączyć: zaloguj się do profilu przeglądarki wewnątrz maszyny wirtualnej albo
  zachowaj ustawione `chrome.guestName` dla dołączania jako gość. Automatyczne dołączanie gościa używa automatyzacji
  przeglądarki OpenClaw przez proxy przeglądarki węzła; upewnij się, że konfiguracja przeglądarki węzła
  wskazuje profil, którego chcesz użyć, na przykład
  `browser.defaultProfile: "user"` albo nazwany profil istniejącej sesji.
- Zduplikowane karty Meet: pozostaw włączone `chrome.reuseExistingTab: true`. OpenClaw
  aktywuje istniejącą kartę dla tego samego adresu URL Meet przed otwarciem nowej, a
  tworzenie spotkania w przeglądarce ponownie używa trwającej karty `https://meet.google.com/new`
  lub karty monitu konta Google przed otwarciem kolejnej.
- Brak dźwięku: w Meet skieruj mikrofon/głośnik przez ścieżkę wirtualnego urządzenia audio
  używaną przez OpenClaw; używaj oddzielnych urządzeń wirtualnych albo trasowania w stylu Loopback
  dla czystego dźwięku dwukierunkowego.

## Uwagi dotyczące instalacji

Domyślna konfiguracja Chrome realtime używa dwóch zewnętrznych narzędzi:

- `sox`: narzędzie audio wiersza poleceń. Plugin używa jawnych poleceń urządzeń CoreAudio
  dla domyślnego mostu audio PCM16 24 kHz.
- `blackhole-2ch`: wirtualny sterownik audio macOS. Tworzy urządzenie audio `BlackHole 2ch`,
  przez które Chrome/Meet mogą trasować dźwięk.

OpenClaw nie dołącza ani nie redystrybuuje żadnego z tych pakietów. Dokumentacja prosi użytkowników o
zainstalowanie ich jako zależności hosta przez Homebrew. SoX jest licencjonowany jako
`LGPL-2.0-only AND GPL-2.0-only`; BlackHole jest na licencji GPL-3.0. Jeśli budujesz
instalator lub appliance, który dołącza BlackHole z OpenClaw, przejrzyj warunki licencyjne
upstream BlackHole albo uzyskaj oddzielną licencję od Existential Audio.

## Transporty

### Chrome

Transport Chrome otwiera adres URL Meet przez sterowanie przeglądarką OpenClaw i dołącza
jako zalogowany profil przeglądarki OpenClaw. W macOS Plugin sprawdza obecność
`BlackHole 2ch` przed uruchomieniem. Jeśli skonfigurowano, uruchamia też polecenie
kontroli kondycji mostu audio i polecenie startowe przed otwarciem Chrome. Użyj `chrome`, gdy
Chrome/audio działają na hoście Gateway; użyj `chrome-node`, gdy Chrome/audio działają
na sparowanym węźle, takim jak maszyna wirtualna Parallels macOS. Dla lokalnego Chrome wybierz
profil za pomocą `browser.defaultProfile`; `chrome.browserProfile` jest przekazywane do
hostów `chrome-node`.

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome-node
```

Skieruj dźwięk mikrofonu i głośnika Chrome przez lokalny most audio OpenClaw.
Jeśli `BlackHole 2ch` nie jest zainstalowany, dołączenie kończy się błędem konfiguracji
zamiast cicho dołączyć bez ścieżki audio.

### Twilio

Transport Twilio to ścisły plan wybierania delegowany do Plugin Voice Call. Nie
analizuje stron Meet w poszukiwaniu numerów telefonów.

Użyj tego, gdy udział przez Chrome nie jest dostępny albo chcesz awaryjnie użyć
wdzwaniania telefonicznego. Google Meet musi ujawniać numer wdzwonienia i PIN dla
spotkania; OpenClaw nie odkrywa ich ze strony Meet.

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

Podaj poświadczenia Twilio przez środowisko albo konfigurację. Środowisko utrzymuje
sekrety poza `openclaw.json`:

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
```

Uruchom ponownie albo przeładuj Gateway po włączeniu `voice-call`; zmiany konfiguracji Plugin
nie pojawiają się w już działającym procesie Gateway, dopóki nie zostanie przeładowany.

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

## OAuth i preflight

OAuth jest opcjonalny przy tworzeniu linku Meet, ponieważ `googlemeet create` może
użyć awaryjnie automatyzacji przeglądarki. Skonfiguruj OAuth, gdy chcesz oficjalnego tworzenia przez API,
rozwiązywania przestrzeni albo kontroli preflight Meet Media API.

Dostęp do Google Meet API używa OAuth użytkownika: utwórz klienta OAuth Google Cloud,
zażądaj wymaganych zakresów, autoryzuj konto Google, a następnie zapisz
wynikowy token odświeżania w konfiguracji Plugin Google Meet albo podaj zmienne środowiskowe
`OPENCLAW_GOOGLE_MEET_*`.

OAuth nie zastępuje ścieżki dołączania Chrome. Transporty Chrome i Chrome-node
nadal dołączają przez zalogowany profil Chrome, BlackHole/SoX i połączony
węzeł, gdy używasz udziału przez przeglądarkę. OAuth służy tylko do oficjalnej
ścieżki Google Meet API: tworzenia przestrzeni spotkań, rozwiązywania przestrzeni i uruchamiania
kontroli preflight Meet Media API.

### Utwórz poświadczenia Google

W Google Cloud Console:

1. Utwórz albo wybierz projekt Google Cloud.
2. Włącz **Google Meet REST API** dla tego projektu.
3. Skonfiguruj ekran zgody OAuth.
   - **Internal** jest najprostsze dla organizacji Google Workspace.
   - **External** działa dla konfiguracji osobistych/testowych; gdy aplikacja jest w trybie Testing,
     dodaj każde konto Google, które będzie autoryzować aplikację, jako użytkownika testowego.
4. Dodaj zakresy wymagane przez OpenClaw:
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
`meetings.space.readonly` pozwala OpenClaw rozwiązywać adresy URL/kody Meet do przestrzeni.
`meetings.space.settings` pozwala OpenClaw przekazywać ustawienia `SpaceConfig`, takie jak
`accessType`, podczas tworzenia pokoju przez API.
`meetings.conference.media.readonly` służy do preflight Meet Media API i pracy z multimediami;
Google może wymagać rejestracji w Developer Preview do faktycznego użycia Media API.
Jeśli potrzebujesz tylko dołączeń Chrome opartych na przeglądarce, całkowicie pomiń OAuth.

### Wygeneruj token odświeżania

Skonfiguruj `oauth.clientId` i opcjonalnie `oauth.clientSecret` albo przekaż je jako
zmienne środowiskowe, a następnie uruchom:

```bash
openclaw googlemeet auth login --json
```

Polecenie wypisuje blok konfiguracji `oauth` z tokenem odświeżania. Używa PKCE,
lokalnego callbacku na `http://localhost:8085/oauth2callback` i ręcznego
przepływu kopiuj/wklej z `--manual`.

Przykłady:

```bash
OPENCLAW_GOOGLE_MEET_CLIENT_ID="your-client-id" \
OPENCLAW_GOOGLE_MEET_CLIENT_SECRET="your-client-secret" \
openclaw googlemeet auth login --json
```

Użyj trybu ręcznego, gdy przeglądarka nie może dosięgnąć lokalnego callbacku:

```bash
OPENCLAW_GOOGLE_MEET_CLIENT_ID="your-client-id" \
OPENCLAW_GOOGLE_MEET_CLIENT_SECRET="your-client-secret" \
openclaw googlemeet auth login --json --manual
```

Dane wyjściowe JSON zawierają:

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

Zapisz obiekt `oauth` w konfiguracji Plugin Google Meet:

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
Jeśli obecne są zarówno wartości z konfiguracji, jak i środowiska, Plugin rozwiązuje najpierw konfigurację,
a potem używa środowiska jako opcji awaryjnej.

Zgoda OAuth obejmuje tworzenie przestrzeni Meet, dostęp do odczytu przestrzeni Meet i dostęp do odczytu
multimediów konferencji Meet. Jeśli uwierzytelniono przed pojawieniem się obsługi
tworzenia spotkań, uruchom ponownie `openclaw googlemeet auth login --json`, aby token odświeżania
miał zakres `meetings.space.created`.

### Zweryfikuj OAuth za pomocą doctor

Uruchom OAuth doctor, gdy chcesz szybkiej kontroli kondycji bez sekretów:

```bash
openclaw googlemeet doctor --oauth --json
```

To nie ładuje środowiska uruchomieniowego Chrome ani nie wymaga połączonego węzła Chrome. Sprawdza,
czy istnieje konfiguracja OAuth i czy token odświeżania może wygenerować token dostępu.
Raport JSON zawiera tylko pola statusu, takie jak `ok`, `configured`,
`tokenSource`, `expiresAt` i komunikaty kontroli; nie wypisuje tokenu dostępu,
tokenu odświeżania ani sekretu klienta.

Typowe wyniki:

| Kontrola             | Znaczenie                                                                               |
| -------------------- | --------------------------------------------------------------------------------------- |
| `oauth-config`       | Obecne jest `oauth.clientId` plus `oauth.refreshToken` albo zapisany w pamięci podręcznej token dostępu. |
| `oauth-token`        | Zapisany w pamięci podręcznej token dostępu jest nadal ważny albo token odświeżania wygenerował nowy token dostępu. |
| `meet-spaces-get`    | Opcjonalna kontrola `--meeting` rozwiązała istniejącą przestrzeń Meet.                  |
| `meet-spaces-create` | Opcjonalna kontrola `--create-space` utworzyła nową przestrzeń Meet.                    |

Aby potwierdzić także włączenie Google Meet API i zakres `spaces.create`, uruchom
kontrolę tworzenia powodującą skutki uboczne:

```bash
openclaw googlemeet doctor --oauth --create-space --json
openclaw googlemeet create --no-join --json
```

`--create-space` tworzy tymczasowy URL Meet. Użyj go, gdy musisz potwierdzić,
że projekt Google Cloud ma włączone Meet API oraz że autoryzowane konto ma
zakres `meetings.space.created`.

Aby potwierdzić dostęp do odczytu dla istniejącej przestrzeni spotkania:

```bash
openclaw googlemeet doctor --oauth --meeting https://meet.google.com/abc-defg-hij --json
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
```

`doctor --oauth --meeting` i `resolve-space` potwierdzają dostęp do odczytu do istniejącej
przestrzeni, do której autoryzowane konto Google ma dostęp. `403` z tych sprawdzeń
zwykle oznacza, że Google Meet REST API jest wyłączone, zaakceptowanemu tokenowi odświeżania
brakuje wymaganego zakresu albo konto Google nie ma dostępu do tej przestrzeni
Meet. Błąd tokena odświeżania oznacza, że należy ponownie uruchomić `openclaw googlemeet auth login
--json` i zapisać nowy blok `oauth`.

Dane uwierzytelniające OAuth nie są potrzebne dla awaryjnego trybu przeglądarki. W tym trybie uwierzytelnianie Google
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

Rozwiąż URL Meet, kod lub `spaces/{id}` przez `spaces.get`:

```bash
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
```

Uruchom kontrolę wstępną przed pracą z mediami:

```bash
openclaw googlemeet preflight --meeting https://meet.google.com/abc-defg-hij
```

Wyświetl artefakty spotkania i obecność po utworzeniu rekordów konferencji przez Meet:

```bash
openclaw googlemeet artifacts --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet attendance --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet export --meeting https://meet.google.com/abc-defg-hij --output ./meet-export
```

Z `--meeting`, `artifacts` i `attendance` domyślnie używają najnowszego rekordu konferencji.
Przekaż `--all-conference-records`, gdy chcesz uzyskać każdy zachowany rekord
dla tego spotkania.

Wyszukiwanie w kalendarzu może rozwiązać URL spotkania z Google Calendar przed odczytem
artefaktów Meet:

```bash
openclaw googlemeet latest --today
openclaw googlemeet calendar-events --today --json
openclaw googlemeet artifacts --event "Weekly sync"
openclaw googlemeet attendance --today --format csv --output attendance.csv
```

`--today` przeszukuje dzisiejszy kalendarz `primary` w poszukiwaniu wydarzenia Calendar z
linkiem Google Meet. Użyj `--event <query>`, aby wyszukać pasujący tekst wydarzenia, oraz
`--calendar <id>` dla kalendarza innego niż podstawowy. Wyszukiwanie w kalendarzu wymaga świeżego
logowania OAuth, które obejmuje zakres tylko do odczytu wydarzeń Calendar.
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

To wywołuje Google Meet `spaces.endActiveConference` i wymaga OAuth z zakresem
`meetings.space.created` dla przestrzeni, którą autoryzowane konto może zarządzać.
OpenClaw akceptuje URL Meet, kod spotkania lub dane wejściowe `spaces/{id}` i rozwiązuje je
do zasobu przestrzeni API przed zakończeniem aktywnej konferencji.
Jest to oddzielne od `googlemeet leave`: `leave` zatrzymuje lokalny/sesyjny
udział OpenClaw, a `end-active-conference` prosi Google Meet o zakończenie aktywnej
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
wyszukiwanie wpisów dla dużych spotkań. `attendance` rozwija uczestników do
wierszy sesji uczestników z czasami pierwszego/ostatniego wykrycia, łącznym czasem trwania sesji,
flagami spóźnienia/wczesnego opuszczenia oraz zduplikowanymi zasobami uczestników scalonymi według zalogowanego
użytkownika lub wyświetlanej nazwy. Przekaż `--no-merge-duplicates`, aby zachować surowe zasoby
uczestników oddzielnie, `--late-after-minutes`, aby dostroić wykrywanie spóźnienia, oraz
`--early-before-minutes`, aby dostroić wykrywanie wczesnego opuszczenia.

`export` zapisuje folder zawierający `summary.md`, `attendance.csv`,
`transcript.md`, `artifacts.json`, `attendance.json` i `manifest.json`.
`manifest.json` rejestruje wybrane dane wejściowe, opcje eksportu, rekordy konferencji,
pliki wyjściowe, liczniki, źródło tokena, wydarzenie Calendar, gdy zostało użyte, oraz wszelkie
ostrzeżenia o częściowym pobraniu. Przekaż `--zip`, aby zapisać także przenośne archiwum obok
folderu. Przekaż `--include-doc-bodies`, aby wyeksportować połączony tekst transkrypcji i
inteligentnych notatek Google Docs przez Google Drive `files.export`; wymaga to
świeżego logowania OAuth, które obejmuje zakres tylko do odczytu Drive Meet. Bez
`--include-doc-bodies` eksporty zawierają tylko metadane Meet i ustrukturyzowane wpisy
transkrypcji. Jeśli Google zwróci częściową awarię artefaktu, taką jak błąd listy inteligentnych notatek,
wpisu transkrypcji lub treści dokumentu Drive, podsumowanie i
manifest zachowują ostrzeżenie zamiast przerywać cały eksport.
Użyj `--dry-run`, aby pobrać te same dane artefaktów/obecności i wydrukować
JSON manifestu bez tworzenia folderu ani pliku ZIP. Jest to przydatne przed zapisaniem
dużego eksportu lub gdy agent potrzebuje tylko liczników, wybranych rekordów i
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

Ustaw `"dryRun": true`, aby zwrócić tylko manifest eksportu i pominąć zapisywanie plików.

Agenci mogą także utworzyć pokój oparty na API z jawną polityką dostępu:

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

Do walidacji z najpierw nasłuchem agenci powinni użyć `test_listen`, zanim stwierdzą, że
spotkanie jest przydatne:

```json
{
  "action": "test_listen",
  "url": "https://meet.google.com/abc-defg-hij",
  "transport": "chrome-node",
  "timeoutMs": 30000
}
```

Uruchom strzeżony test live smoke wobec rzeczywistego zachowanego spotkania:

```bash
OPENCLAW_LIVE_TEST=1 \
OPENCLAW_GOOGLE_MEET_LIVE_MEETING=https://meet.google.com/abc-defg-hij \
pnpm test:live -- extensions/google-meet/google-meet.live.test.ts
```

Uruchom przeglądarkową sondę live z najpierw nasłuchem wobec spotkania, na którym ktoś będzie
mówić przy dostępnych napisach Meet:

```bash
openclaw googlemeet setup --transport chrome-node --mode transcribe
openclaw googlemeet test-listen https://meet.google.com/abc-defg-hij --transport chrome-node --timeout-ms 30000
```

Środowisko live smoke:

- `OPENCLAW_LIVE_TEST=1` włącza strzeżone testy live.
- `OPENCLAW_GOOGLE_MEET_LIVE_MEETING` wskazuje zachowany URL Meet, kod lub
  `spaces/{id}`.
- `OPENCLAW_GOOGLE_MEET_CLIENT_ID` lub `GOOGLE_MEET_CLIENT_ID` dostarcza identyfikator klienta OAuth.
- `OPENCLAW_GOOGLE_MEET_REFRESH_TOKEN` lub `GOOGLE_MEET_REFRESH_TOKEN` dostarcza
  token odświeżania.
- Opcjonalnie: `OPENCLAW_GOOGLE_MEET_CLIENT_SECRET`,
  `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN` i
  `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT` używają tych samych nazw awaryjnych
  bez prefiksu `OPENCLAW_`.

Podstawowy live smoke artefaktów/obecności wymaga
`https://www.googleapis.com/auth/meetings.space.readonly` i
`https://www.googleapis.com/auth/meetings.conference.media.readonly`. Wyszukiwanie w kalendarzu
wymaga `https://www.googleapis.com/auth/calendar.events.readonly`. Eksport treści dokumentu Drive
wymaga
`https://www.googleapis.com/auth/drive.meet.readonly`.

Utwórz świeżą przestrzeń Meet:

```bash
openclaw googlemeet create
```

Polecenie wypisuje nowy `meeting uri`, źródło i sesję dołączenia. Z danymi
uwierzytelniającymi OAuth używa oficjalnego Google Meet API. Bez danych uwierzytelniających OAuth
używa zalogowanego profilu przeglądarki przypiętego węzła Chrome jako trybu awaryjnego. Agenci mogą
użyć narzędzia `google_meet` z `action: "create"`, aby utworzyć i dołączyć w jednym
kroku. Aby utworzyć tylko URL, przekaż `"join": false`.

Przykładowe wyjście JSON z awaryjnego trybu przeglądarki:

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

Jeśli awaryjny tryb przeglądarki napotka logowanie Google lub blokadę uprawnień Meet, zanim
będzie mógł utworzyć URL, metoda Gateway zwraca nieudaną odpowiedź, a
narzędzie `google_meet` zwraca ustrukturyzowane szczegóły zamiast zwykłego ciągu tekstowego:

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

Gdy agent zobaczy `manualActionRequired: true`, powinien zgłosić
`manualActionMessage` oraz kontekst węzła/karty przeglądarki i przestać otwierać nowe
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

Tworzenie Meet domyślnie dołącza do spotkania. Transport Chrome lub Chrome-node nadal
potrzebuje zalogowanego profilu Google Chrome, aby dołączyć przez przeglądarkę. Jeśli
profil jest wylogowany, OpenClaw zgłasza `manualActionRequired: true` lub błąd
awaryjnego trybu przeglądarki i prosi operatora o dokończenie logowania Google przed
ponowną próbą.

Ustaw `preview.enrollmentAcknowledged: true` dopiero po potwierdzeniu, że Twój projekt Cloud,
podmiot OAuth i uczestnicy spotkania są zarejestrowani w Google
Workspace Developer Preview Program dla interfejsów Meet media APIs.

## Konfiguracja

Wspólna ścieżka Chrome realtime wymaga tylko włączenia pluginu, BlackHole, SoX
oraz klucza backendowego dostawcy głosu realtime. OpenAI jest domyślne; ustaw
`realtime.provider: "google"`, aby użyć Google Gemini Live:

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

Domyślne wartości:

- `defaultTransport: "chrome"`
- `defaultMode: "realtime"`
- `chromeNode.node`: opcjonalny identyfikator/nazwa/IP węzła dla `chrome-node`
- `chrome.audioBackend: "blackhole-2ch"`
- `chrome.guestName: "OpenClaw Agent"`: nazwa używana na ekranie gościa Meet niezalogowanego użytkownika
- `chrome.autoJoin: true`: best-effort wypełnienie nazwy gościa i kliknięcie Dołącz teraz przez automatyzację przeglądarki OpenClaw na `chrome-node`
- `chrome.reuseExistingTab: true`: aktywuj istniejącą kartę Meet zamiast otwierać duplikaty
- `chrome.waitForInCallMs: 20000`: poczekaj, aż karta Meet zgłosi, że jest w połączeniu, zanim zostanie uruchomione wprowadzenie realtime
- `chrome.audioFormat: "pcm16-24khz"`: format audio pary poleceń. Używaj `"g711-ulaw-8khz"` tylko dla starszych/niestandardowych par poleceń, które nadal emitują audio telefoniczne.
- `chrome.audioInputCommand`: polecenie SoX odczytujące z CoreAudio `BlackHole 2ch` i zapisujące audio w `chrome.audioFormat`
- `chrome.audioOutputCommand`: polecenie SoX odczytujące audio w `chrome.audioFormat` i zapisujące do CoreAudio `BlackHole 2ch`
- `chrome.bargeInInputCommand`: opcjonalne polecenie lokalnego mikrofonu zapisujące podpisane 16-bitowe little-endian mono PCM do wykrywania przerwania przez człowieka, gdy odtwarzanie asystenta jest aktywne. Obecnie dotyczy to hostowanego przez Gateway mostu par poleceń `chrome`.
- `chrome.bargeInRmsThreshold: 650`: poziom RMS liczony jako przerwanie przez człowieka w `chrome.bargeInInputCommand`
- `chrome.bargeInPeakThreshold: 2500`: poziom szczytowy liczony jako przerwanie przez człowieka w `chrome.bargeInInputCommand`
- `chrome.bargeInCooldownMs: 900`: minimalne opóźnienie między powtarzanymi wyczyszczeniami przerwań przez człowieka
- `realtime.provider: "openai"`
- `realtime.toolPolicy: "safe-read-only"`
- `realtime.instructions`: krótkie odpowiedzi mówione, z `openclaw_agent_consult` dla głębszych odpowiedzi
- `realtime.introMessage`: krótki mówiony test gotowości, gdy most realtime się połączy; ustaw na `""`, aby dołączyć po cichu
- `realtime.agentId`: opcjonalny identyfikator agenta OpenClaw dla `openclaw_agent_consult`; domyślnie `main`

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

`voiceCall.enabled` domyślnie ma wartość `true`; z transportem Twilio deleguje rzeczywiste połączenie PSTN, DTMF i powitanie wprowadzające do pluginu Voice Call. Voice Call odtwarza sekwencję DTMF przed otwarciem strumienia mediów realtime, a następnie używa zapisanego tekstu wprowadzającego jako początkowego powitania realtime. Jeśli `voice-call` nie jest włączony, Google Meet nadal może sprawdzić poprawność i zapisać plan wybierania, ale nie może wykonać połączenia Twilio.

## Narzędzie

Agenci mogą używać narzędzia `google_meet`:

```json
{
  "action": "join",
  "url": "https://meet.google.com/abc-defg-hij",
  "transport": "chrome-node",
  "mode": "realtime"
}
```

Użyj `transport: "chrome"`, gdy Chrome działa na hoście Gateway. Użyj `transport: "chrome-node"`, gdy Chrome działa na sparowanym węźle, takim jak maszyna wirtualna Parallels. W obu przypadkach model realtime i `openclaw_agent_consult` działają na hoście Gateway, więc poświadczenia modelu pozostają tam.

Użyj `action: "status"`, aby wyświetlić aktywne sesje lub sprawdzić identyfikator sesji. Użyj `action: "speak"` z `sessionId` i `message`, aby agent realtime natychmiast przemówił. Użyj `action: "test_speech"`, aby utworzyć lub ponownie użyć sesji, wywołać znaną frazę i zwrócić stan `inCall`, gdy host Chrome może go zgłosić. `test_speech` zawsze wymusza `mode: "realtime"` i kończy się niepowodzeniem, jeśli ma zostać uruchomione w `mode: "transcribe"`, ponieważ sesje tylko do obserwacji celowo nie mogą emitować mowy. Wynik `speechOutputVerified` jest oparty na wzroście bajtów wyjściowego audio realtime podczas tego wywołania testowego, więc ponownie użyta sesja ze starszym audio nie liczy się jako świeży, pomyślny test mowy. Użyj `action: "leave"`, aby oznaczyć sesję jako zakończoną.

`status` zawiera stan Chrome, gdy jest dostępny:

- `inCall`: Chrome wydaje się być w połączeniu Meet
- `micMuted`: best-effort stan mikrofonu Meet
- `manualActionRequired` / `manualActionReason` / `manualActionMessage`: profil przeglądarki wymaga ręcznego logowania, dopuszczenia przez gospodarza Meet, uprawnień albo naprawy sterowania przeglądarką, zanim mowa będzie działać
- `speechReady` / `speechBlockedReason` / `speechBlockedMessage`: czy zarządzana mowa Chrome jest teraz dozwolona. `speechReady: false` oznacza, że OpenClaw nie wysłał frazy wprowadzającej/testowej do mostu audio.
- `providerConnected` / `realtimeReady`: stan mostu głosowego realtime
- `lastInputAt` / `lastOutputAt`: ostatnie audio odebrane z mostu lub wysłane do niego
- `lastSuppressedInputAt` / `suppressedInputBytes`: wejście local loopback ignorowane, gdy odtwarzanie asystenta jest aktywne

```json
{
  "action": "speak",
  "sessionId": "meet_...",
  "message": "Say exactly: I'm here and listening."
}
```

## Konsultacja agenta realtime

Tryb realtime Chrome jest zoptymalizowany pod kątem pętli głosowej na żywo. Dostawca głosu realtime słyszy audio spotkania i mówi przez skonfigurowany most audio. Gdy model realtime potrzebuje głębszego rozumowania, aktualnych informacji albo zwykłych narzędzi OpenClaw, może wywołać `openclaw_agent_consult`.

Narzędzie konsultacji uruchamia w tle zwykłego agenta OpenClaw z kontekstem ostatniej transkrypcji spotkania i zwraca zwięzłą odpowiedź mówioną do sesji głosowej realtime. Model głosowy może następnie wypowiedzieć tę odpowiedź z powrotem na spotkaniu. Używa tego samego współdzielonego narzędzia konsultacji realtime co Voice Call.

Domyślnie konsultacje działają na agencie `main`. Ustaw `realtime.agentId`, gdy ścieżka Meet powinna konsultować dedykowany obszar roboczy agenta OpenClaw, domyślne ustawienia modelu, zasady narzędzi, pamięć i historię sesji.

`realtime.toolPolicy` kontroluje przebieg konsultacji:

- `safe-read-only`: udostępnij narzędzie konsultacji i ogranicz zwykłego agenta do `read`, `web_search`, `web_fetch`, `x_search`, `memory_search` i `memory_get`.
- `owner`: udostępnij narzędzie konsultacji i pozwól zwykłemu agentowi używać normalnych zasad narzędzi agenta.
- `none`: nie udostępniaj narzędzia konsultacji modelowi głosowemu realtime.

Klucz sesji konsultacji jest ograniczony do sesji Meet, więc kolejne wywołania konsultacji mogą ponownie używać wcześniejszego kontekstu konsultacji podczas tego samego spotkania.

Aby wymusić mówiony test gotowości po pełnym dołączeniu Chrome do połączenia:

```bash
openclaw googlemeet speak meet_... "Say exactly: I'm here and listening."
```

Pełny smoke test dołączania i mówienia:

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

- `googlemeet setup` jest w całości zielony.
- `googlemeet setup` zawiera `chrome-node-connected`, gdy Chrome-node jest domyślnym transportem albo węzeł jest przypięty.
- `nodes status` pokazuje, że wybrany węzeł jest połączony.
- Wybrany węzeł reklamuje zarówno `googlemeet.chrome`, jak i `browser.proxy`.
- Karta Meet dołącza do połączenia, a `test-speech` zwraca stan Chrome z `inCall: true`.

Dla zdalnego hosta Chrome, takiego jak maszyna wirtualna Parallels macOS, jest to najkrótszy bezpieczny test po aktualizacji Gateway lub maszyny wirtualnej:

```bash
openclaw googlemeet setup
openclaw nodes status --connected
openclaw nodes invoke \
  --node parallels-macos \
  --command googlemeet.chrome \
  --params '{"action":"setup"}'
```

To potwierdza, że plugin Gateway jest załadowany, węzeł maszyny wirtualnej jest połączony z bieżącym tokenem, a most audio Meet jest dostępny, zanim agent otworzy prawdziwą kartę spotkania.

Dla smoke testu Twilio użyj spotkania, które udostępnia szczegóły telefonicznego połączenia wdzwanianego:

```bash
openclaw googlemeet setup
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --pin 123456
```

Oczekiwany stan Twilio:

- `googlemeet setup` zawiera zielone kontrole `twilio-voice-call-plugin`, `twilio-voice-call-credentials` i `twilio-voice-call-webhook`.
- `voicecall` jest dostępne w CLI po przeładowaniu Gateway.
- Zwrócona sesja ma `transport: "twilio"` i `twilio.voiceCallId`.
- `openclaw logs --follow` pokazuje TwiML DTMF obsłużony przed TwiML realtime, a następnie most realtime z początkowym powitaniem w kolejce.
- `googlemeet leave <sessionId>` rozłącza delegowane połączenie głosowe.

## Rozwiązywanie problemów

### Agent nie widzi narzędzia Google Meet

Potwierdź, że plugin jest włączony w konfiguracji Gateway i przeładuj Gateway:

```bash
openclaw plugins list | grep google-meet
openclaw googlemeet setup
```

Jeśli właśnie edytowano `plugins.entries.google-meet`, uruchom ponownie albo przeładuj Gateway. Działający agent widzi tylko narzędzia pluginu zarejestrowane przez bieżący proces Gateway.

Na hostach Gateway innych niż macOS narzędzie `google_meet` widoczne dla agenta pozostaje widoczne, ale lokalne akcje realtime Chrome są blokowane, zanim dotrą do mostu audio. Lokalne audio realtime Chrome obecnie zależy od macOS `BlackHole 2ch`, więc agenci Linux powinni używać `mode: "transcribe"`, połączenia wdzwanianego Twilio albo hosta `chrome-node` macOS zamiast domyślnej lokalnej ścieżki realtime Chrome.

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

Węzeł musi być połączony i wyświetlać `googlemeet.chrome` oraz `browser.proxy`. Konfiguracja Gateway musi zezwalać na te polecenia węzła:

```json5
{
  gateway: {
    nodes: {
      allowCommands: ["browser.proxy", "googlemeet.chrome"],
    },
  },
}
```

Jeśli `googlemeet setup` nie przechodzi `chrome-node-connected` albo log Gateway zgłasza `gateway token mismatch`, zainstaluj ponownie albo uruchom ponownie węzeł z bieżącym tokenem Gateway. Dla Gateway w sieci LAN zwykle oznacza to:

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

Uruchom `googlemeet test-listen` dla dołączeń tylko do obserwacji albo `googlemeet test-speech` dla dołączeń realtime, a następnie sprawdź zwrócony stan Chrome. Jeśli którykolwiek test zgłasza `manualActionRequired: true`, pokaż operatorowi `manualActionMessage` i przestań ponawiać próby, dopóki działanie w przeglądarce nie zostanie ukończone.

Typowe działania ręczne:

- Zaloguj się do profilu Chrome.
- Dopuść gościa z konta gospodarza Meet.
- Nadaj uprawnienia do mikrofonu/kamery Chrome, gdy pojawi się natywny monit uprawnień Chrome.
- Zamknij albo napraw zablokowane okno dialogowe uprawnień Meet.

Nie zgłaszaj „not signed in” tylko dlatego, że Meet pokazuje „Do you want people to
hear you in the meeting?” To ekran pośredni wyboru dźwięku w Meet; OpenClaw
klika **Use microphone** przez automatyzację przeglądarki, gdy jest dostępna, i dalej
czeka na rzeczywisty stan spotkania. W przypadku rezerwowego tworzenia tylko przez przeglądarkę OpenClaw
może kliknąć **Continue without microphone**, ponieważ utworzenie URL-a nie wymaga
ścieżki dźwięku w czasie rzeczywistym.

### Tworzenie spotkania kończy się niepowodzeniem

`googlemeet create` najpierw używa endpointu Google Meet API `spaces.create`,
gdy skonfigurowane są dane logowania OAuth. Bez danych logowania OAuth przełącza się
na przypiętą przeglądarkę Chrome node. Sprawdź:

- Dla tworzenia przez API: `oauth.clientId` i `oauth.refreshToken` są skonfigurowane
  albo dostępne są pasujące zmienne środowiskowe `OPENCLAW_GOOGLE_MEET_*`.
- Dla tworzenia przez API: token odświeżania został wydany po dodaniu obsługi
  tworzenia. Starszym tokenom może brakować zakresu `meetings.space.created`; uruchom ponownie
  `openclaw googlemeet auth login --json` i zaktualizuj konfigurację pluginu.
- Dla rezerwowego trybu przeglądarki: `defaultTransport: "chrome-node"` oraz
  `chromeNode.node` wskazują połączony node z `browser.proxy` i
  `googlemeet.chrome`.
- Dla rezerwowego trybu przeglądarki: profil Chrome OpenClaw na tym node jest zalogowany
  do Google i może otworzyć `https://meet.google.com/new`.
- Dla rezerwowego trybu przeglądarki: ponowne próby używają istniejącej karty `https://meet.google.com/new`
  lub karty monitu konta Google przed otwarciem nowej karty. Jeśli agent przekroczy limit czasu,
  ponów wywołanie narzędzia zamiast ręcznie otwierać kolejną kartę Meet.
- Dla rezerwowego trybu przeglądarki: jeśli narzędzie zwróci `manualActionRequired: true`, użyj
  zwróconych `browser.nodeId`, `browser.targetId`, `browserUrl` i
  `manualActionMessage`, aby poprowadzić operatora. Nie ponawiaj w pętli, dopóki ta
  czynność nie zostanie wykonana.
- Dla rezerwowego trybu przeglądarki: jeśli Meet pokazuje „Do you want people to hear you in the
  meeting?”, pozostaw kartę otwartą. OpenClaw powinien kliknąć **Use microphone** albo, dla
  rezerwowego tworzenia tylko przez przeglądarkę, **Continue without microphone** przez automatyzację
  przeglądarki i kontynuować oczekiwanie na wygenerowany URL Meet. Jeśli nie może tego zrobić,
  błąd powinien wskazywać `meet-audio-choice-required`, a nie `google-login-required`.

### Agent dołącza, ale nie mówi

Sprawdź ścieżkę czasu rzeczywistego:

```bash
openclaw googlemeet setup
openclaw googlemeet doctor
```

Użyj `mode: "realtime"` do nasłuchiwania i odpowiadania głosem. `mode: "transcribe"` celowo
nie uruchamia dwukierunkowego mostu głosowego czasu rzeczywistego. Do debugowania tylko obserwacji
uruchom `openclaw googlemeet status --json <session-id>` po tym, jak uczestnicy zaczną mówić,
i sprawdź `captioning`, `transcriptLines` oraz `lastCaptionText`. Jeśli `inCall` ma wartość
true, ale `transcriptLines` pozostaje na `0`, napisy Meet mogą być wyłączone, nikt
nie mówił od czasu zainstalowania obserwatora, interfejs Meet się zmienił albo napisy na żywo
są niedostępne dla języka lub konta spotkania.

`googlemeet test-speech` zawsze sprawdza ścieżkę czasu rzeczywistego i raportuje, czy
dla tego wywołania zaobserwowano bajty wyjściowe mostu. Jeśli `speechOutputVerified` ma wartość false, a
`speechOutputTimedOut` ma wartość true, dostawca czasu rzeczywistego mógł przyjąć
wypowiedź, ale OpenClaw nie zobaczył nowych bajtów wyjściowych docierających do mostu audio Chrome.

Sprawdź też:

- Klucz dostawcy czasu rzeczywistego jest dostępny na hoście Gateway, na przykład
  `OPENAI_API_KEY` lub `GEMINI_API_KEY`.
- `BlackHole 2ch` jest widoczny na hoście Chrome.
- `sox` istnieje na hoście Chrome.
- Mikrofon i głośnik Meet są poprowadzone przez wirtualną ścieżkę audio używaną przez
  OpenClaw.

`googlemeet doctor [session-id]` wypisuje sesję, node, stan połączenia,
powód ręcznej czynności, połączenie z dostawcą czasu rzeczywistego, `realtimeReady`, aktywność
wejścia/wyjścia audio, ostatnie znaczniki czasu audio, liczniki bajtów i URL przeglądarki.
Użyj `googlemeet status [session-id] --json`, gdy potrzebujesz surowego JSON-u. Użyj
`googlemeet doctor --oauth`, gdy musisz zweryfikować odświeżanie OAuth Google Meet
bez ujawniania tokenów; dodaj `--meeting` lub `--create-space`, gdy potrzebujesz również
dowodu z Google Meet API.

Jeśli agent przekroczył limit czasu i widzisz już otwartą kartę Meet, sprawdź tę kartę
bez otwierania kolejnej:

```bash
openclaw googlemeet recover-tab
openclaw googlemeet recover-tab https://meet.google.com/abc-defg-hij
```

Równoważną akcją narzędzia jest `recover_current_tab`. Ustawia fokus i sprawdza
istniejącą kartę Meet dla wybranego transportu. Z `chrome` używa lokalnego
sterowania przeglądarką przez Gateway; z `chrome-node` używa skonfigurowanego
Chrome node. Nie otwiera nowej karty ani nie tworzy nowej sesji; raportuje
aktualną blokadę, taką jak logowanie, dopuszczenie, uprawnienia lub stan wyboru dźwięku.
Polecenie CLI komunikuje się ze skonfigurowanym Gateway, więc Gateway musi działać;
`chrome-node` wymaga również, aby Chrome node był połączony.

### Kontrole konfiguracji Twilio kończą się niepowodzeniem

`twilio-voice-call-plugin` kończy się niepowodzeniem, gdy `voice-call` nie jest dozwolony lub nie jest włączony.
Dodaj go do `plugins.allow`, włącz `plugins.entries.voice-call` i przeładuj
Gateway.

`twilio-voice-call-credentials` kończy się niepowodzeniem, gdy backend Twilio nie ma identyfikatora SID konta,
tokenu uwierzytelniania lub numeru dzwoniącego. Ustaw je na hoście Gateway:

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
```

`twilio-voice-call-webhook` kończy się niepowodzeniem, gdy `voice-call` nie ma publicznej ekspozycji
Webhook albo gdy `publicUrl` wskazuje na local loopback lub prywatną przestrzeń sieciową.
Ustaw `plugins.entries.voice-call.config.publicUrl` na publiczny URL dostawcy albo
skonfiguruj tunel `voice-call` lub ekspozycję Tailscale.

Adresy URL local loopback i prywatne nie są prawidłowe dla wywołań zwrotnych operatora. Nie używaj
`localhost`, `127.0.0.1`, `0.0.0.0`, `10.x`, `172.16.x`-`172.31.x`,
`192.168.x`, `169.254.x`, `fc00::/7` ani `fd00::/8` jako `publicUrl`.

Dla stabilnego publicznego URL-a:

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

Do lokalnego rozwoju użyj tunelu lub ekspozycji Tailscale zamiast prywatnego
URL-a hosta:

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

Następnie uruchom ponownie lub przeładuj Gateway i uruchom:

```bash
openclaw googlemeet setup --transport twilio
openclaw voicecall setup
openclaw voicecall smoke
```

`voicecall smoke` domyślnie sprawdza tylko gotowość. Aby wykonać próbę na konkretnym numerze:

```bash
openclaw voicecall smoke --to "+15555550123"
```

Dodaj `--yes` tylko wtedy, gdy celowo chcesz wykonać rzeczywiste wychodzące połączenie
powiadamiające:

```bash
openclaw voicecall smoke --to "+15555550123" --yes
```

### Połączenie Twilio rozpoczyna się, ale nigdy nie wchodzi do spotkania

Potwierdź, że wydarzenie Meet udostępnia szczegóły wybierania telefonicznego. Przekaż dokładny numer
dial-in i PIN albo niestandardową sekwencję DTMF:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --dtmf-sequence ww123456#
```

Użyj początkowego `w` albo przecinków w `--dtmf-sequence`, jeśli dostawca potrzebuje pauzy
przed wpisaniem PIN-u.

Jeśli połączenie telefoniczne zostało utworzone, ale lista uczestników Meet nigdy nie pokazuje uczestnika
dial-in:

- Uruchom `openclaw googlemeet doctor <session-id>`, aby potwierdzić delegowany identyfikator połączenia Twilio,
  czy DTMF został zakolejkowany i czy poproszono o powitanie wstępne.
- Uruchom `openclaw voicecall status --call-id <id>` i potwierdź, że połączenie nadal jest
  aktywne.
- Uruchom `openclaw voicecall tail` i sprawdź, czy Webhooki Twilio docierają do
  Gateway.
- Uruchom `openclaw logs --follow` i szukaj sekwencji Twilio Meet: Google
  Meet deleguje dołączenie, Voice Call uruchamia część telefoniczną, Google Meet czeka
  `voiceCall.dtmfDelayMs`, wysyła DTMF przez `voicecall.dtmf`, czeka
  `voiceCall.postDtmfSpeechDelayMs`, a następnie żąda mowy powitalnej przez
  `voicecall.speak`.
- Uruchom ponownie `openclaw googlemeet setup --transport twilio`; zielona kontrola konfiguracji jest
  wymagana, ale nie dowodzi, że sekwencja PIN spotkania jest poprawna.
- Potwierdź, że numer dial-in należy do tego samego zaproszenia Meet i regionu co
  PIN.
- Zwiększ `voiceCall.dtmfDelayMs`, jeśli Meet odpowiada wolno albo transkrypcja połączenia
  nadal pokazuje monit proszący o PIN po wysłaniu DTMF.
- Jeśli uczestnik dołącza, ale nie słyszysz powitania, sprawdź
  `openclaw logs --follow` pod kątem żądania `voicecall.speak` po DTMF oraz
  odtwarzania TTS strumienia multimediów albo rezerwowego Twilio `<Say>`. Jeśli transkrypcja połączenia
  nadal zawiera „enter the meeting PIN”, część telefoniczna nie dołączyła jeszcze
  do pokoju Meet, więc uczestnicy spotkania nie usłyszą mowy.

Jeśli Webhooki nie docierają, najpierw debuguj plugin Voice Call: dostawca musi
osiągnąć `plugins.entries.voice-call.config.publicUrl` albo skonfigurowany tunel.
Zobacz [Rozwiązywanie problemów z połączeniami głosowymi](/pl/plugins/voice-call#troubleshooting).

## Uwagi

Oficjalne API mediów Google Meet jest ukierunkowane na odbiór, więc mówienie do połączenia
Meet nadal wymaga ścieżki uczestnika. Ten plugin pokazuje tę granicę:
Chrome obsługuje uczestnictwo w przeglądarce i lokalne routowanie audio; Twilio obsługuje
uczestnictwo przez wybieranie telefoniczne.

Tryb czasu rzeczywistego Chrome wymaga `BlackHole 2ch` oraz jednego z poniższych:

- `chrome.audioInputCommand` plus `chrome.audioOutputCommand`: OpenClaw zarządza
  mostem modelu czasu rzeczywistego i przesyła audio w `chrome.audioFormat` między tymi
  poleceniami a wybranym dostawcą głosu czasu rzeczywistego. Domyślna ścieżka Chrome to
  24 kHz PCM16; 8 kHz G.711 mu-law pozostaje dostępne dla starszych par poleceń.
- `chrome.audioBridgeCommand`: zewnętrzne polecenie mostu zarządza całą lokalną
  ścieżką audio i musi zakończyć działanie po uruchomieniu lub zweryfikowaniu swojego demona.

Aby uzyskać czysty dwukierunkowy dźwięk, poprowadź wyjście Meet i mikrofon Meet przez oddzielne
urządzenia wirtualne albo graf urządzeń wirtualnych w stylu Loopback. Jedno współdzielone
urządzenie BlackHole może odbijać innych uczestników z powrotem do połączenia.

W przypadku mostu Chrome opartego na parze poleceń `chrome.bargeInInputCommand` może nasłuchiwać
oddzielnego lokalnego mikrofonu i czyścić odtwarzanie asystenta, gdy człowiek zaczyna
mówić. Dzięki temu mowa człowieka ma pierwszeństwo przed wyjściem asystenta nawet wtedy, gdy współdzielone
wejście local loopback BlackHole jest tymczasowo tłumione podczas odtwarzania asystenta.
Podobnie jak `chrome.audioInputCommand` i `chrome.audioOutputCommand`, jest to
lokalne polecenie skonfigurowane przez operatora. Użyj jawnej zaufanej ścieżki polecenia lub
listy argumentów i nie kieruj go na skrypty z niezaufanych lokalizacji.

`googlemeet speak` uruchamia aktywny most audio czasu rzeczywistego dla sesji Chrome.
`googlemeet leave` zatrzymuje ten most. W przypadku sesji Twilio delegowanych
przez plugin Voice Call `leave` także rozłącza bazowe połączenie głosowe.
Użyj `googlemeet end-active-conference`, gdy chcesz również zamknąć aktywną
konferencję Google Meet dla przestrzeni zarządzanej przez API.

## Powiązane

- [Plugin połączeń głosowych](/pl/plugins/voice-call)
- [Tryb rozmowy](/pl/nodes/talk)
- [Tworzenie pluginów](/pl/plugins/building-plugins)
