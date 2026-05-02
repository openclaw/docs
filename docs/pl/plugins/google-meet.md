---
read_when:
    - Chcesz, aby agent OpenClaw dołączył do rozmowy w Google Meet
    - Chcesz, aby agent OpenClaw utworzył nowe spotkanie Google Meet
    - Konfigurujesz Chrome, węzeł Chrome lub Twilio jako transport Google Meet
summary: 'Plugin Google Meet: dołączaj do jawnie podanych adresów URL Meet przez Chrome lub Twilio z domyślnymi ustawieniami głosu w czasie rzeczywistym'
title: Plugin Google Meet
x-i18n:
    generated_at: "2026-05-02T09:57:34Z"
    model: gpt-5.5
    provider: openai
    source_hash: d97ad823b34264f0a1d8117d4517a4375ae414341c521b4c6d6d9a4db3f9d2bf
    source_path: plugins/google-meet.md
    workflow: 16
---

Obsługa uczestnictwa w Google Meet dla OpenClaw — Plugin jest jawnie zaprojektowany w ten sposób:

- Dołącza tylko do jawnego adresu URL `https://meet.google.com/...`.
- Może utworzyć nową przestrzeń Meet przez Google Meet API, a następnie dołączyć do
  zwróconego adresu URL.
- `realtime` voice jest domyślnym trybem.
- Realtime voice może wywołać pełnego agenta OpenClaw, gdy potrzebne jest głębsze
  rozumowanie lub narzędzia.
- Agenci wybierają zachowanie dołączania za pomocą `mode`: użyj `realtime` do live
  słuchania/odpowiadania głosem albo `transcribe`, aby dołączyć/kontrolować przeglądarkę bez
  mostka realtime voice.
- Uwierzytelnianie zaczyna się jako osobiste Google OAuth albo już zalogowany profil Chrome.
- Nie ma automatycznego ogłoszenia zgody.
- Domyślnym backendem audio Chrome jest `BlackHole 2ch`.
- Chrome może działać lokalnie lub na sparowanym hoście Node.
- Twilio przyjmuje numer dial-in oraz opcjonalny PIN lub sekwencję DTMF; nie
  może bezpośrednio wybrać adresu URL Meet.
- Polecenie CLI to `googlemeet`; `meet` jest zarezerwowane dla szerszych przepływów telekonferencji
  agentów.

## Szybki start

Zainstaluj lokalne zależności audio i skonfiguruj backend dostawcy realtime voice.
OpenAI jest domyślne; Google Gemini Live także działa z
`realtime.provider: "google"`:

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
# lub
export GEMINI_API_KEY=...
```

`blackhole-2ch` instaluje wirtualne urządzenie audio `BlackHole 2ch`. Instalator Homebrew
wymaga ponownego uruchomienia, zanim macOS udostępni urządzenie:

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

Dane wyjściowe konfiguracji mają być czytelne dla agenta i świadome trybu. Raportują profil Chrome,
przypięcie Node oraz, dla dołączeń realtime Chrome, mostek audio BlackHole/SoX
i opóźnione kontrole wprowadzenia realtime. W przypadku dołączeń tylko obserwacyjnych sprawdź ten sam
transport za pomocą `--mode transcribe`; ten tryb pomija wymagania wstępne realtime audio,
ponieważ nie słucha ani nie mówi przez mostek:

```bash
openclaw googlemeet setup --transport chrome-node --mode transcribe
```

Gdy skonfigurowana jest delegacja Twilio, konfiguracja raportuje także, czy Plugin
`voice-call`, poświadczenia Twilio i publiczna ekspozycja Webhook są gotowe.
Traktuj każdą kontrolę `ok: false` jako blokadę dla sprawdzanego transportu i trybu
przed poproszeniem agenta o dołączenie. Użyj `openclaw googlemeet setup --json` dla
skryptów lub danych wyjściowych czytelnych maszynowo. Użyj `--transport chrome`,
`--transport chrome-node` albo `--transport twilio`, aby wstępnie sprawdzić konkretny
transport, zanim agent go spróbuje.

Dla Twilio zawsze wstępnie sprawdzaj transport jawnie, gdy domyślnym transportem
jest Chrome:

```bash
openclaw googlemeet setup --transport twilio
```

To wykrywa brakujące połączenie `voice-call`, poświadczenia Twilio lub nieosiągalną
ekspozycję Webhook, zanim agent spróbuje wybrać numer spotkania.

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

Narzędzie `google_meet` dostępne dla agenta pozostaje dostępne na hostach innych niż macOS dla
artefaktów, kalendarza, konfiguracji, transkrypcji, Twilio i przepływów `chrome-node`. Lokalne
akcje Chrome realtime są tam blokowane, ponieważ dołączona ścieżka audio realtime Chrome
obecnie zależy od macOS `BlackHole 2ch`. Na Linux użyj
`mode: "transcribe"`, dial-in Twilio albo hosta macOS `chrome-node` do realtime
uczestnictwa przez Chrome.

Utwórz nowe spotkanie i dołącz do niego:

```bash
openclaw googlemeet create --transport chrome-node --mode realtime
```

Dla pokojów tworzonych przez API użyj Google Meet `SpaceConfig.accessType`, gdy chcesz,
aby zasada pokoju bez pukania była jawna, a nie dziedziczona z domyślnych ustawień konta
Google:

```bash
openclaw googlemeet create --access-type OPEN --transport chrome-node --mode realtime
```

`OPEN` pozwala każdemu z adresem URL Meet dołączyć bez pukania. `TRUSTED` pozwala
zaufanym użytkownikom organizacji hosta, zaproszonym użytkownikom zewnętrznym i użytkownikom dial-in
dołączać bez pukania. `RESTRICTED` ogranicza wejście bez pukania do zaproszonych osób. Te
ustawienia dotyczą tylko oficjalnej ścieżki tworzenia przez Google Meet API, więc poświadczenia
OAuth muszą być skonfigurowane.

Jeśli uwierzytelniłeś Google Meet, zanim ta opcja była dostępna, uruchom ponownie
`openclaw googlemeet auth login --json` po dodaniu zakresu
`meetings.space.settings` do ekranu zgody Google OAuth.

Utwórz tylko adres URL bez dołączania:

```bash
openclaw googlemeet create --no-join
```

`googlemeet create` ma dwie ścieżki:

- Tworzenie przez API: używane, gdy skonfigurowano poświadczenia Google Meet OAuth. To jest
  najbardziej deterministyczna ścieżka i nie zależy od stanu UI przeglądarki.
- Awaryjna ścieżka przeglądarki: używana, gdy brak poświadczeń OAuth. OpenClaw używa
  przypiętego Node Chrome, otwiera `https://meet.google.com/new`, czeka, aż Google
  przekieruje do prawdziwego adresu URL z kodem spotkania, a następnie zwraca ten adres URL. Ta ścieżka wymaga,
  aby profil Chrome OpenClaw na Node był już zalogowany w Google.
  Automatyzacja przeglądarki obsługuje własny monit Meet przy pierwszym uruchomieniu dotyczący mikrofonu; ten monit
  nie jest traktowany jako niepowodzenie logowania Google.
  Przepływy dołączania i tworzenia próbują też ponownie użyć istniejącej karty Meet przed otwarciem
  nowej. Dopasowywanie ignoruje nieszkodliwe ciągi zapytań URL, takie jak `authuser`, więc ponowna próba
  agenta powinna ustawić fokus na już otwartym spotkaniu zamiast tworzyć drugą
  kartę Chrome.

Dane wyjściowe polecenia/narzędzia zawierają pole `source` (`api` lub `browser`), aby agenci
mogli wyjaśnić, której ścieżki użyto. `create` domyślnie dołącza do nowego spotkania i
zwraca `joined: true` oraz sesję dołączania. Aby tylko wygenerować adres URL, użyj
`create --no-join` w CLI albo przekaż `"join": false` do narzędzia.

Albo powiedz agentowi: „Utwórz Google Meet, dołącz do niego z realtime voice i wyślij
mi link.” Agent powinien wywołać `google_meet` z `action: "create"`, a następnie
udostępnić zwrócone `meetingUri`.

```json
{
  "action": "create",
  "transport": "chrome-node",
  "mode": "realtime"
}
```

Dla dołączenia tylko obserwacyjnego/kontroli przeglądarki ustaw `"mode": "transcribe"`. To nie
uruchamia dupleksowego mostka modelu realtime, nie wymaga BlackHole ani SoX,
i nie będzie odpowiadać głosem na spotkaniu. Dołączenia Chrome w tym trybie unikają także
przyznawania przez OpenClaw uprawnień mikrofonu/kamery i unikają ścieżki Meet **Użyj
mikrofonu**. Jeśli Meet pokazuje interstitial wyboru audio, automatyzacja próbuje
ścieżki bez mikrofonu, a w przeciwnym razie zgłasza działanie ręczne zamiast otwierać
lokalny mikrofon. W trybie transcribe zarządzane transporty Chrome instalują także
najlepszy dostępny obserwator napisów Meet. `googlemeet status --json` i
`googlemeet doctor` ujawniają `captioning`, `captionsEnabledAttempted`,
`transcriptLines`, `lastCaptionAt`, `lastCaptionSpeaker`, `lastCaptionText`,
oraz krótki ogon `recentTranscript`, aby operatorzy mogli stwierdzić, czy przeglądarka
dołączyła do rozmowy i czy napisy Meet produkują tekst.
Użyj `openclaw googlemeet test-listen <meet-url> --transport chrome-node`, gdy
potrzebujesz sondy tak/nie: dołącza w trybie transcribe, czeka na świeże napisy lub
ruch transkrypcji, i zwraca `listenVerified`, `listenTimedOut`, pola działań ręcznych
oraz najnowszy stan napisów.

Podczas sesji realtime status `google_meet` zawiera stan przeglądarki i mostka audio,
taki jak `inCall`, `manualActionRequired`, `providerConnected`,
`realtimeReady`, `audioInputActive`, `audioOutputActive`, znaczniki czasu ostatniego wejścia/wyjścia,
liczniki bajtów i stan zamknięcia mostka. Jeśli pojawi się bezpieczny monit strony Meet,
automatyzacja przeglądarki obsługuje go, gdy może. Logowanie, przyjęcie przez hosta i
monity uprawnień przeglądarki/OS są zgłaszane jako działanie ręczne z powodem i
komunikatem do przekazania przez agenta. Zarządzane sesje Chrome emitują wprowadzenie lub
frazę testową dopiero po tym, jak stan przeglądarki zgłosi `inCall: true`; w przeciwnym razie status zgłasza
`speechReady: false`, a próba mowy jest blokowana zamiast udawać, że
agent mówił do spotkania.

Lokalne dołączenia Chrome używają zalogowanego profilu przeglądarki OpenClaw. Tryb realtime
wymaga `BlackHole 2ch` dla ścieżki mikrofonu/głośnika używanej przez OpenClaw. Dla
czystego dupleksowego audio użyj oddzielnych urządzeń wirtualnych albo grafu w stylu Loopback; jedno
urządzenie BlackHole wystarczy do pierwszego smoke test, ale może powodować echo.

### Lokalny Gateway + Chrome w Parallels

Nie potrzebujesz pełnego OpenClaw Gateway ani klucza API modelu wewnątrz VM macOS
tylko po to, aby VM była właścicielem Chrome. Uruchom Gateway i agenta lokalnie, a następnie uruchom
host Node w VM. Włącz dołączony Plugin na VM raz, aby Node
reklamował polecenie Chrome:

Co działa gdzie:

- Host Gateway: OpenClaw Gateway, workspace agenta, klucze modelu/API, dostawca realtime
  i konfiguracja Plugin Google Meet.
- VM macOS Parallels: OpenClaw CLI/host Node, Google Chrome, SoX, BlackHole 2ch
  i profil Chrome zalogowany w Google.
- Niepotrzebne w VM: usługa Gateway, konfiguracja agenta, klucz OpenAI/GPT ani konfiguracja
  dostawcy modelu.

Zainstaluj zależności VM:

```bash
brew install blackhole-2ch sox
```

Uruchom ponownie VM po zainstalowaniu BlackHole, aby macOS udostępnił `BlackHole 2ch`:

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

Uruchom host Node w VM:

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name parallels-macos
```

Jeśli `<gateway-host>` jest adresem IP LAN i nie używasz TLS, Node odrzuca
WebSocket w tekście jawnym, chyba że wyrazisz zgodę dla tej zaufanej sieci prywatnej:

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node run --host <gateway-lan-ip> --port 18789 --display-name parallels-macos
```

Użyj tej samej zmiennej środowiskowej podczas instalowania Node jako LaunchAgent:

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node install --host <gateway-lan-ip> --port 18789 --display-name parallels-macos --force
openclaw node restart
```

`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` jest środowiskiem procesu, a nie ustawieniem
`openclaw.json`. `openclaw node install` zapisuje je w środowisku LaunchAgent,
gdy jest obecne w poleceniu instalacji.

Zatwierdź Node z hosta Gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Potwierdź, że Gateway widzi Node i że reklamuje zarówno `googlemeet.chrome`,
jak i capability przeglądarki/`browser.proxy`:

```bash
openclaw nodes status
```

Skieruj Meet przez ten Node na hoście Gateway:

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

Dla jednopoleceniowego smoke test, który tworzy lub ponownie używa sesji, wypowiada znaną
frazę i drukuje stan sesji:

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij
```

Podczas dołączania w czasie rzeczywistym automatyzacja przeglądarki OpenClaw wypełnia nazwę gościa, klika Join/Ask to join i akceptuje wybór pierwszego uruchomienia Meet „Use microphone”, gdy pojawi się ten monit. Podczas dołączania tylko do obserwacji lub tworzenia spotkania wyłącznie w przeglądarce przechodzi dalej przez ten sam monit bez mikrofonu, gdy taka opcja jest dostępna. Jeśli profil przeglądarki nie jest zalogowany, Meet czeka na wpuszczenie przez gospodarza, Chrome potrzebuje uprawnień do mikrofonu/kamery dla dołączenia w czasie rzeczywistym albo Meet utknął na monicie, którego automatyzacja nie mogła rozwiązać, wynik join/test-speech zgłasza `manualActionRequired: true` z `manualActionReason` i `manualActionMessage`. Agenci powinni przestać ponawiać dołączanie, zgłosić dokładnie ten komunikat oraz bieżące `browserUrl`/`browserTitle`, i ponowić próbę dopiero po zakończeniu ręcznej akcji w przeglądarce.

Jeśli `chromeNode.node` zostanie pominięte, OpenClaw wybiera automatycznie tylko wtedy, gdy dokładnie jeden połączony węzeł rozgłasza zarówno `googlemeet.chrome`, jak i sterowanie przeglądarką. Jeśli połączonych jest kilka zgodnych węzłów, ustaw `chromeNode.node` na identyfikator węzła, nazwę wyświetlaną albo zdalny adres IP.

Typowe kontrole awarii:

- `Configured Google Meet node ... is not usable: offline`: przypięty węzeł jest znany Gateway, ale niedostępny. Agenci powinni traktować ten węzeł jako stan diagnostyczny, a nie jako używalny host Chrome, i zgłaszać blokadę konfiguracji zamiast przełączać się na inny transport, chyba że użytkownik o to poprosił.
- `No connected Google Meet-capable node`: uruchom `openclaw node run` w maszynie wirtualnej, zatwierdź parowanie i upewnij się, że `openclaw plugins enable google-meet` oraz `openclaw plugins enable browser` zostały uruchomione w maszynie wirtualnej. Potwierdź też, że host Gateway zezwala na oba polecenia węzła przez `gateway.nodes.allowCommands: ["googlemeet.chrome", "browser.proxy"]`.
- `BlackHole 2ch audio device not found`: zainstaluj `blackhole-2ch` na sprawdzanym hoście i uruchom go ponownie przed użyciem lokalnego audio Chrome.
- `BlackHole 2ch audio device not found on the node`: zainstaluj `blackhole-2ch` w maszynie wirtualnej i uruchom ją ponownie.
- Chrome otwiera się, ale nie może dołączyć: zaloguj się do profilu przeglądarki w maszynie wirtualnej albo pozostaw ustawione `chrome.guestName` dla dołączania jako gość. Automatyczne dołączanie gościa używa automatyzacji przeglądarki OpenClaw przez proxy przeglądarki węzła; upewnij się, że konfiguracja przeglądarki węzła wskazuje profil, którego chcesz użyć, na przykład `browser.defaultProfile: "user"` albo nazwany profil istniejącej sesji.
- Zduplikowane karty Meet: pozostaw włączone `chrome.reuseExistingTab: true`. OpenClaw aktywuje istniejącą kartę dla tego samego URL Meet przed otwarciem nowej, a tworzenie spotkania w przeglądarce ponownie używa trwającej karty `https://meet.google.com/new` albo karty monitu konta Google przed otwarciem kolejnej.
- Brak audio: w Meet poprowadź mikrofon/głośnik przez ścieżkę wirtualnego urządzenia audio używaną przez OpenClaw; użyj oddzielnych urządzeń wirtualnych albo routingu w stylu Loopback dla czystego audio dwukierunkowego.

## Uwagi dotyczące instalacji

Domyślna konfiguracja czasu rzeczywistego Chrome używa dwóch narzędzi zewnętrznych:

- `sox`: narzędzie audio wiersza poleceń. Plugin używa jawnych poleceń urządzenia CoreAudio dla domyślnego mostu audio PCM16 24 kHz.
- `blackhole-2ch`: wirtualny sterownik audio macOS. Tworzy urządzenie audio `BlackHole 2ch`, przez które Chrome/Meet może routować dźwięk.

OpenClaw nie dołącza ani nie redystrybuuje żadnego z tych pakietów. Dokumentacja prosi użytkowników o zainstalowanie ich jako zależności hosta przez Homebrew. SoX jest licencjonowany jako `LGPL-2.0-only AND GPL-2.0-only`; BlackHole jest na licencji GPL-3.0. Jeśli tworzysz instalator albo appliance, który dołącza BlackHole z OpenClaw, sprawdź warunki licencji upstream BlackHole albo uzyskaj osobną licencję od Existential Audio.

## Transporty

### Chrome

Transport Chrome otwiera URL Meet przez sterowanie przeglądarką OpenClaw i dołącza jako zalogowany profil przeglądarki OpenClaw. W macOS Plugin sprawdza obecność `BlackHole 2ch` przed uruchomieniem. Jeśli skonfigurowano, przed otwarciem Chrome uruchamia też polecenie sprawdzania kondycji mostu audio i polecenie startowe. Użyj `chrome`, gdy Chrome/audio działa na hoście Gateway; użyj `chrome-node`, gdy Chrome/audio działa na sparowanym węźle, takim jak maszyna wirtualna Parallels macOS. Dla lokalnego Chrome wybierz profil za pomocą `browser.defaultProfile`; `chrome.browserProfile` jest przekazywane do hostów `chrome-node`.

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome-node
```

Poprowadź audio mikrofonu i głośnika Chrome przez lokalny most audio OpenClaw. Jeśli `BlackHole 2ch` nie jest zainstalowany, dołączanie kończy się błędem konfiguracji zamiast cicho dołączyć bez ścieżki audio.

### Twilio

Transport Twilio to ścisły plan wybierania delegowany do pluginu Voice Call. Nie analizuje stron Meet w celu znalezienia numerów telefonów.

Użyj go, gdy udział przez Chrome nie jest dostępny albo chcesz awaryjne połączenie telefoniczne. Google Meet musi udostępniać numer telefonu do połączenia i PIN dla spotkania; OpenClaw nie wykrywa ich ze strony Meet.

Włącz plugin Voice Call na hoście Gateway, nie na węźle Chrome:

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

Podaj dane uwierzytelniające Twilio przez środowisko albo konfigurację. Środowisko trzyma sekrety poza `openclaw.json`:

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
```

Uruchom ponownie albo przeładuj Gateway po włączeniu `voice-call`; zmiany konfiguracji Plugin nie pojawią się w już działającym procesie Gateway, dopóki nie zostanie przeładowany.

Następnie zweryfikuj:

```bash
openclaw config validate
openclaw plugins list | grep -E 'google-meet|voice-call'
openclaw googlemeet setup
```

Gdy delegowanie Twilio jest podłączone, `googlemeet setup` zawiera pomyślne kontrole `twilio-voice-call-plugin`, `twilio-voice-call-credentials` i `twilio-voice-call-webhook`.

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

OAuth jest opcjonalny przy tworzeniu linku Meet, ponieważ `googlemeet create` może użyć awaryjnie automatyzacji przeglądarki. Skonfiguruj OAuth, gdy chcesz oficjalnego tworzenia przez API, rozwiązywania przestrzeni albo kontroli wstępnych Meet Media API.

Dostęp do Google Meet API używa OAuth użytkownika: utwórz klienta OAuth Google Cloud, poproś o wymagane zakresy, autoryzuj konto Google, a następnie zapisz wynikowy token odświeżania w konfiguracji pluginu Google Meet albo podaj zmienne środowiskowe `OPENCLAW_GOOGLE_MEET_*`.

OAuth nie zastępuje ścieżki dołączania Chrome. Transporty Chrome i Chrome-node nadal dołączają przez zalogowany profil Chrome, BlackHole/SoX oraz połączony węzeł, gdy używasz udziału przez przeglądarkę. OAuth służy wyłącznie do oficjalnej ścieżki Google Meet API: tworzenia przestrzeni spotkań, rozwiązywania przestrzeni i uruchamiania kontroli wstępnych Meet Media API.

### Utwórz dane uwierzytelniające Google

W Google Cloud Console:

1. Utwórz albo wybierz projekt Google Cloud.
2. Włącz **Google Meet REST API** dla tego projektu.
3. Skonfiguruj ekran zgody OAuth.
   - **Internal** jest najprostsze dla organizacji Google Workspace.
   - **External** działa dla konfiguracji osobistych/testowych; gdy aplikacja jest w trybie Testing, dodaj każde konto Google, które będzie autoryzować aplikację, jako użytkownika testowego.
4. Dodaj zakresy, o które prosi OpenClaw:
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
`meetings.space.readonly` pozwala OpenClaw rozwiązywać URL-e/kody Meet na przestrzenie.
`meetings.space.settings` pozwala OpenClaw przekazywać ustawienia `SpaceConfig`, takie jak `accessType`, podczas tworzenia pokoju przez API.
`meetings.conference.media.readonly` służy do kontroli wstępnej Meet Media API i pracy z mediami; Google może wymagać rejestracji w Developer Preview do faktycznego użycia Media API.
Jeśli potrzebujesz tylko dołączeń przez Chrome w przeglądarce, całkowicie pomiń OAuth.

### Wygeneruj token odświeżania

Skonfiguruj `oauth.clientId` i opcjonalnie `oauth.clientSecret` albo przekaż je jako zmienne środowiskowe, a następnie uruchom:

```bash
openclaw googlemeet auth login --json
```

Polecenie wypisuje blok konfiguracji `oauth` z tokenem odświeżania. Używa PKCE, wywołania zwrotnego localhost pod `http://localhost:8085/oauth2callback` oraz ręcznego przepływu kopiuj/wklej z `--manual`.

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

Zapisz obiekt `oauth` w konfiguracji pluginu Google Meet:

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

Preferuj zmienne środowiskowe, gdy nie chcesz tokenu odświeżania w konfiguracji. Jeśli obecne są zarówno wartości z konfiguracji, jak i środowiska, Plugin najpierw rozwiązuje konfigurację, a następnie używa środowiska jako opcji awaryjnej.

Zgoda OAuth obejmuje tworzenie przestrzeni Meet, dostęp do odczytu przestrzeni Meet oraz dostęp do odczytu mediów konferencji Meet. Jeśli uwierzytelniłeś się przed dodaniem obsługi tworzenia spotkań, uruchom ponownie `openclaw googlemeet auth login --json`, aby token odświeżania miał zakres `meetings.space.created`.

### Zweryfikuj OAuth za pomocą doctor

Uruchom doctor OAuth, gdy chcesz szybką kontrolę kondycji bez sekretów:

```bash
openclaw googlemeet doctor --oauth --json
```

To nie ładuje runtime Chrome ani nie wymaga połączonego węzła Chrome. Sprawdza, czy istnieje konfiguracja OAuth i czy token odświeżania może wygenerować token dostępu. Raport JSON zawiera tylko pola statusu, takie jak `ok`, `configured`, `tokenSource`, `expiresAt` oraz komunikaty kontroli; nie wypisuje tokenu dostępu, tokenu odświeżania ani sekretu klienta.

Typowe wyniki:

| Kontrola             | Znaczenie                                                                                |
| -------------------- | ---------------------------------------------------------------------------------------- |
| `oauth-config`       | Obecny jest `oauth.clientId` plus `oauth.refreshToken` albo buforowany token dostępu.    |
| `oauth-token`        | Buforowany token dostępu jest nadal ważny albo token odświeżania wygenerował nowy token dostępu. |
| `meet-spaces-get`    | Opcjonalna kontrola `--meeting` rozwiązała istniejącą przestrzeń Meet.                   |
| `meet-spaces-create` | Opcjonalna kontrola `--create-space` utworzyła nową przestrzeń Meet.                     |

Aby potwierdzić także włączenie Google Meet API i zakres `spaces.create`, uruchom kontrolę tworzenia z efektami ubocznymi:

```bash
openclaw googlemeet doctor --oauth --create-space --json
openclaw googlemeet create --no-join --json
```

`--create-space` tworzy jednorazowy adres URL Meet. Użyj go, gdy musisz potwierdzić,
że projekt Google Cloud ma włączone Meet API oraz że autoryzowane konto ma zakres
`meetings.space.created`.

Aby udowodnić dostęp do odczytu dla istniejącej przestrzeni spotkania:

```bash
openclaw googlemeet doctor --oauth --meeting https://meet.google.com/abc-defg-hij --json
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
```

`doctor --oauth --meeting` i `resolve-space` potwierdzają dostęp do odczytu do istniejącej
przestrzeni, do której autoryzowane konto Google ma dostęp. Kod `403` z tych sprawdzeń
zwykle oznacza, że Google Meet REST API jest wyłączone, zatwierdzony token odświeżania
nie ma wymaganego zakresu albo konto Google nie może uzyskać dostępu do tej przestrzeni
Meet. Błąd tokenu odświeżania oznacza, że trzeba ponownie uruchomić `openclaw googlemeet auth login
--json` i zapisać nowy blok `oauth`.

Dane uwierzytelniające OAuth nie są potrzebne dla awaryjnego trybu przeglądarki. W tym trybie uwierzytelnianie Google
pochodzi z zalogowanego profilu Chrome na wybranym węźle, a nie z konfiguracji
OpenClaw.

Te zmienne środowiskowe są akceptowane jako wartości awaryjne:

- `OPENCLAW_GOOGLE_MEET_CLIENT_ID` lub `GOOGLE_MEET_CLIENT_ID`
- `OPENCLAW_GOOGLE_MEET_CLIENT_SECRET` lub `GOOGLE_MEET_CLIENT_SECRET`
- `OPENCLAW_GOOGLE_MEET_REFRESH_TOKEN` lub `GOOGLE_MEET_REFRESH_TOKEN`
- `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN` lub `GOOGLE_MEET_ACCESS_TOKEN`
- `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT` lub
  `GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT`
- `OPENCLAW_GOOGLE_MEET_DEFAULT_MEETING` lub `GOOGLE_MEET_DEFAULT_MEETING`
- `OPENCLAW_GOOGLE_MEET_PREVIEW_ACK` lub `GOOGLE_MEET_PREVIEW_ACK`

Rozwiąż adres URL Meet, kod albo `spaces/{id}` przez `spaces.get`:

```bash
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
```

Uruchom sprawdzenie wstępne przed pracą z multimediami:

```bash
openclaw googlemeet preflight --meeting https://meet.google.com/abc-defg-hij
```

Wyświetl artefakty spotkania i frekwencję po tym, jak Meet utworzy rekordy konferencji:

```bash
openclaw googlemeet artifacts --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet attendance --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet export --meeting https://meet.google.com/abc-defg-hij --output ./meet-export
```

Z `--meeting`, `artifacts` i `attendance` domyślnie używają najnowszego rekordu konferencji.
Przekaż `--all-conference-records`, gdy chcesz uzyskać każdy zachowany rekord
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
`--calendar <id>` dla kalendarza innego niż podstawowy. Wyszukiwanie w kalendarzu wymaga świeżego
logowania OAuth obejmującego zakres tylko do odczytu wydarzeń Calendar.
`calendar-events` pokazuje podgląd pasujących wydarzeń Meet i oznacza wydarzenie, które
wybiorą `latest`, `artifacts`, `attendance` albo `export`.

Jeśli znasz już identyfikator rekordu konferencji, wskaż go bezpośrednio:

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

Wywołuje to Google Meet `spaces.endActiveConference` i wymaga OAuth z zakresem
`meetings.space.created` dla przestrzeni, którą autoryzowane konto może zarządzać.
OpenClaw akceptuje jako dane wejściowe adres URL Meet, kod spotkania albo `spaces/{id}` i rozwiązuje je
do zasobu przestrzeni API przed zakończeniem aktywnej konferencji.
Jest to oddzielne od `googlemeet leave`: `leave` zatrzymuje lokalny/sesyjny udział
OpenClaw, a `end-active-conference` prosi Google Meet o zakończenie aktywnej
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
wyszukiwanie wpisów dla dużych spotkań. `attendance` rozwija uczestników do wierszy
sesji uczestników z czasami pierwszego/ostatniego wykrycia, łącznym czasem trwania sesji,
flagami spóźnienia/wcześniejszego wyjścia oraz zduplikowanymi zasobami uczestników scalonymi według zalogowanego
użytkownika lub nazwy wyświetlanej. Przekaż `--no-merge-duplicates`, aby zachować surowe zasoby
uczestników osobno, `--late-after-minutes`, aby dostroić wykrywanie spóźnienia, oraz
`--early-before-minutes`, aby dostroić wykrywanie wcześniejszego wyjścia.

`export` zapisuje folder zawierający `summary.md`, `attendance.csv`,
`transcript.md`, `artifacts.json`, `attendance.json` i `manifest.json`.
`manifest.json` rejestruje wybrane dane wejściowe, opcje eksportu, rekordy konferencji,
pliki wyjściowe, liczby, źródło tokenu, wydarzenie Calendar, gdy zostało użyte, oraz wszelkie
ostrzeżenia o częściowym pobraniu. Przekaż `--zip`, aby dodatkowo zapisać przenośne archiwum obok
folderu. Przekaż `--include-doc-bodies`, aby wyeksportować tekst połączonych transkrypcji i
inteligentnych notatek Google Docs przez Google Drive `files.export`; wymaga to
świeżego logowania OAuth obejmującego zakres tylko do odczytu Drive Meet. Bez
`--include-doc-bodies`, eksporty zawierają tylko metadane Meet i ustrukturyzowane wpisy transkrypcji.
Jeśli Google zwróci częściowe niepowodzenie artefaktu, takie jak błąd listowania inteligentnych notatek,
wpisu transkrypcji albo treści dokumentu Drive, podsumowanie i
manifest zachowują ostrzeżenie zamiast powodować niepowodzenie całego eksportu.
Użyj `--dry-run`, aby pobrać te same dane artefaktów/frekwencji i wydrukować
JSON manifestu bez tworzenia folderu ani ZIP. Jest to przydatne przed zapisaniem
dużego eksportu albo gdy agent potrzebuje tylko liczby, wybranych rekordów i
ostrzeżeń.

Agenci mogą też utworzyć ten sam pakiet przez narzędzie `google_meet`:

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

Agenci mogą też utworzyć pokój wspierany przez API z jawną polityką dostępu:

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

Uruchom chroniony test live smoke na rzeczywistym zachowanym spotkaniu:

```bash
OPENCLAW_LIVE_TEST=1 \
OPENCLAW_GOOGLE_MEET_LIVE_MEETING=https://meet.google.com/abc-defg-hij \
pnpm test:live -- extensions/google-meet/google-meet.live.test.ts
```

Uruchom przeglądarkowy test live z najpierw nasłuchem na spotkaniu, na którym ktoś będzie
mówić przy dostępnych napisach Meet:

```bash
openclaw googlemeet setup --transport chrome-node --mode transcribe
openclaw googlemeet test-listen https://meet.google.com/abc-defg-hij --transport chrome-node --timeout-ms 30000
```

Środowisko testu live smoke:

- `OPENCLAW_LIVE_TEST=1` włącza chronione testy live.
- `OPENCLAW_GOOGLE_MEET_LIVE_MEETING` wskazuje zachowany adres URL Meet, kod albo
  `spaces/{id}`.
- `OPENCLAW_GOOGLE_MEET_CLIENT_ID` lub `GOOGLE_MEET_CLIENT_ID` dostarcza identyfikator klienta OAuth.
- `OPENCLAW_GOOGLE_MEET_REFRESH_TOKEN` lub `GOOGLE_MEET_REFRESH_TOKEN` dostarcza
  token odświeżania.
- Opcjonalnie: `OPENCLAW_GOOGLE_MEET_CLIENT_SECRET`,
  `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN` i
  `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT` używają tych samych nazw awaryjnych
  bez prefiksu `OPENCLAW_`.

Podstawowy test live smoke artefaktów/frekwencji wymaga
`https://www.googleapis.com/auth/meetings.space.readonly` oraz
`https://www.googleapis.com/auth/meetings.conference.media.readonly`. Wyszukiwanie
w kalendarzu wymaga `https://www.googleapis.com/auth/calendar.events.readonly`. Eksport
treści dokumentów Drive wymaga
`https://www.googleapis.com/auth/drive.meet.readonly`.

Utwórz świeżą przestrzeń Meet:

```bash
openclaw googlemeet create
```

Polecenie wypisuje nowy `meeting uri`, źródło i sesję dołączenia. Z danymi
uwierzytelniającymi OAuth używa oficjalnego Google Meet API. Bez danych uwierzytelniających OAuth
używa zalogowanego profilu przeglądarki przypiętego węzła Chrome jako trybu awaryjnego. Agenci mogą
użyć narzędzia `google_meet` z `action: "create"`, aby utworzyć spotkanie i dołączyć w jednym
kroku. Do utworzenia tylko adresu URL przekaż `"join": false`.

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

Jeśli awaryjny tryb przeglądarki trafi na logowanie Google albo blokadę uprawnień Meet, zanim
będzie mógł utworzyć adres URL, metoda Gateway zwraca odpowiedź niepowodzenia, a
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

Utworzenie Meet domyślnie powoduje dołączenie. Transport Chrome lub Chrome-node nadal
potrzebuje zalogowanego profilu Google Chrome, aby dołączyć przez przeglądarkę. Jeśli
profil jest wylogowany, OpenClaw zgłasza `manualActionRequired: true` albo błąd
awaryjnego trybu przeglądarki i prosi operatora o dokończenie logowania Google przed
ponowną próbą.

Ustaw `preview.enrollmentAcknowledged: true` dopiero po potwierdzeniu, że projekt Cloud,
podmiot OAuth i uczestnicy spotkania są zapisani do Google
Workspace Developer Preview Program dla interfejsów API multimediów Meet.

## Konfiguracja

Wspólna ścieżka realtime Chrome wymaga tylko włączonego Plugin, BlackHole, SoX
oraz klucza dostawcy głosu realtime backendu. OpenAI jest domyślne; ustaw
`realtime.provider: "google"`, aby używać Google Gemini Live:

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
- `defaultMode: "realtime"`
- `chromeNode.node`: opcjonalny identyfikator/nazwa/IP węzła dla `chrome-node`
- `chrome.audioBackend: "blackhole-2ch"`
- `chrome.guestName: "OpenClaw Agent"`: nazwa używana na ekranie wylogowanego gościa Meet
- `chrome.autoJoin: true`: best-effort wypełnienie nazwy gościa i kliknięcie Join Now przez automatyzację przeglądarki OpenClaw na `chrome-node`
- `chrome.reuseExistingTab: true`: aktywuj istniejącą kartę Meet zamiast otwierać duplikaty
- `chrome.waitForInCallMs: 20000`: poczekaj, aż karta Meet zgłosi obecność w połączeniu, zanim zostanie wyzwolone wprowadzenie realtime
- `chrome.audioFormat: "pcm16-24khz"`: format audio pary poleceń. Używaj `"g711-ulaw-8khz"` tylko dla starszych/niestandardowych par poleceń, które nadal emitują audio telefoniczne.
- `chrome.audioInputCommand`: polecenie SoX odczytujące z CoreAudio `BlackHole 2ch` i zapisujące audio w `chrome.audioFormat`
- `chrome.audioOutputCommand`: polecenie SoX odczytujące audio w `chrome.audioFormat` i zapisujące do CoreAudio `BlackHole 2ch`
- `chrome.bargeInInputCommand`: opcjonalne polecenie lokalnego mikrofonu, które zapisuje 16-bitowy, little-endian, mono PCM ze znakiem do wykrywania wejścia człowieka podczas aktywnego odtwarzania asystenta. Obecnie dotyczy to hostowanego przez Gateway mostka par poleceń `chrome`.
- `chrome.bargeInRmsThreshold: 650`: poziom RMS liczony jako przerwanie przez człowieka w `chrome.bargeInInputCommand`
- `chrome.bargeInPeakThreshold: 2500`: poziom szczytowy liczony jako przerwanie przez człowieka w `chrome.bargeInInputCommand`
- `chrome.bargeInCooldownMs: 900`: minimalne opóźnienie między powtarzanymi wyczyszczeniami przerwań przez człowieka
- `realtime.provider: "openai"`
- `realtime.toolPolicy: "safe-read-only"`
- `realtime.instructions`: krótkie odpowiedzi mówione, z `openclaw_agent_consult` dla głębszych odpowiedzi
- `realtime.introMessage`: krótki mówiony test gotowości, gdy mostek realtime się łączy; ustaw na `""`, aby dołączyć po cichu
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

`voiceCall.enabled` domyślnie ma wartość `true`; przy transporcie Twilio deleguje właściwe połączenie PSTN, DTMF i powitanie wprowadzające do pluginu Voice Call. Voice Call odtwarza sekwencję DTMF przed otwarciem strumienia mediów realtime, a następnie używa zapisanego tekstu wprowadzenia jako początkowego powitania realtime. Jeśli `voice-call` nie jest włączony, Google Meet nadal może zweryfikować i zapisać plan wybierania, ale nie może wykonać połączenia Twilio.

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

Użyj `transport: "chrome"`, gdy Chrome działa na hoście Gateway. Użyj `transport: "chrome-node"`, gdy Chrome działa na sparowanym węźle, takim jak maszyna wirtualna Parallels. W obu przypadkach model realtime i `openclaw_agent_consult` działają na hoście Gateway, więc dane uwierzytelniające modelu pozostają tam.

Użyj `action: "status"`, aby wyświetlić aktywne sesje lub sprawdzić identyfikator sesji. Użyj `action: "speak"` z `sessionId` i `message`, aby agent realtime natychmiast przemówił. Użyj `action: "test_speech"`, aby utworzyć lub ponownie użyć sesji, wyzwolić znaną frazę i zwrócić stan `inCall`, gdy host Chrome może go zgłosić. `test_speech` zawsze wymusza `mode: "realtime"` i kończy się niepowodzeniem, jeśli ma działać w `mode: "transcribe"`, ponieważ sesje tylko do obserwacji celowo nie mogą emitować mowy. Wynik `speechOutputVerified` opiera się na wzroście liczby bajtów wyjścia audio realtime podczas tego wywołania testowego, więc ponownie użyta sesja ze starszym audio nie liczy się jako świeżo udany test mowy. Użyj `action: "leave"`, aby oznaczyć sesję jako zakończoną.

`status` uwzględnia stan Chrome, gdy jest dostępny:

- `inCall`: Chrome wydaje się być wewnątrz połączenia Meet
- `micMuted`: best-effort stan mikrofonu Meet
- `manualActionRequired` / `manualActionReason` / `manualActionMessage`: profil przeglądarki wymaga ręcznego logowania, wpuszczenia przez gospodarza Meet, uprawnień albo naprawy sterowania przeglądarką, zanim mowa będzie działać
- `speechReady` / `speechBlockedReason` / `speechBlockedMessage`: czy zarządzana mowa Chrome jest teraz dozwolona. `speechReady: false` oznacza, że OpenClaw nie wysłał wprowadzenia/frazy testowej do mostka audio.
- `providerConnected` / `realtimeReady`: stan mostka głosowego realtime
- `lastInputAt` / `lastOutputAt`: ostatnie audio widziane z mostka lub wysłane do mostka
- `lastSuppressedInputAt` / `suppressedInputBytes`: wejście local loopback ignorowane podczas aktywnego odtwarzania asystenta

```json
{
  "action": "speak",
  "sessionId": "meet_...",
  "message": "Say exactly: I'm here and listening."
}
```

## Konsultacja agenta realtime

Tryb realtime Chrome jest zoptymalizowany pod kątem pętli głosowej na żywo. Dostawca głosu realtime słyszy audio spotkania i mówi przez skonfigurowany mostek audio. Gdy model realtime potrzebuje głębszego rozumowania, aktualnych informacji lub zwykłych narzędzi OpenClaw, może wywołać `openclaw_agent_consult`.

Narzędzie konsultacji uruchamia za kulisami zwykłego agenta OpenClaw z kontekstem ostatniego transkryptu spotkania i zwraca zwięzłą odpowiedź mówioną do sesji głosowej realtime. Model głosowy może następnie wypowiedzieć tę odpowiedź z powrotem na spotkaniu. Używa tego samego współdzielonego narzędzia konsultacji realtime co Voice Call.

Domyślnie konsultacje działają względem agenta `main`. Ustaw `realtime.agentId`, gdy pas Meet powinien konsultować dedykowany obszar roboczy agenta OpenClaw, domyślne modele, zasady narzędzi, pamięć i historię sesji.

`realtime.toolPolicy` steruje uruchomieniem konsultacji:

- `safe-read-only`: udostępnij narzędzie konsultacji i ogranicz zwykłego agenta do `read`, `web_search`, `web_fetch`, `x_search`, `memory_search` i `memory_get`.
- `owner`: udostępnij narzędzie konsultacji i pozwól zwykłemu agentowi używać normalnych zasad narzędzi agenta.
- `none`: nie udostępniaj narzędzia konsultacji modelowi głosowemu realtime.

Klucz sesji konsultacji jest ograniczony do danej sesji Meet, więc kolejne wywołania konsultacji mogą ponownie używać wcześniejszego kontekstu konsultacji podczas tego samego spotkania.

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

- `googlemeet setup` jest całe zielone.
- `googlemeet setup` zawiera `chrome-node-connected`, gdy Chrome-node jest domyślnym transportem albo węzeł jest przypięty.
- `nodes status` pokazuje wybrany węzeł jako połączony.
- Wybrany węzeł ogłasza zarówno `googlemeet.chrome`, jak i `browser.proxy`.
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

To potwierdza, że plugin Gateway jest załadowany, węzeł maszyny wirtualnej jest połączony z bieżącym tokenem, a mostek audio Meet jest dostępny, zanim agent otworzy prawdziwą kartę spotkania.

Dla smoke testu Twilio użyj spotkania, które udostępnia szczegóły połączenia telefonicznego:

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
- `openclaw logs --follow` pokazuje DTMF TwiML podane przed realtime TwiML, a następnie mostek realtime z zakolejkowanym początkowym powitaniem.
- `googlemeet leave <sessionId>` rozłącza delegowane połączenie głosowe.

## Rozwiązywanie problemów

### Agent nie widzi narzędzia Google Meet

Potwierdź, że plugin jest włączony w konfiguracji Gateway i przeładuj Gateway:

```bash
openclaw plugins list | grep google-meet
openclaw googlemeet setup
```

Jeśli właśnie edytowano `plugins.entries.google-meet`, uruchom ponownie lub przeładuj Gateway. Działający agent widzi tylko narzędzia pluginów zarejestrowane przez bieżący proces Gateway.

Na hostach Gateway innych niż macOS narzędzie `google_meet` widoczne dla agenta pozostaje widoczne, ale lokalne akcje realtime Chrome są blokowane, zanim trafią do mostka audio. Lokalne audio realtime Chrome obecnie zależy od macOS `BlackHole 2ch`, więc agenci Linux powinni używać `mode: "transcribe"`, połączenia telefonicznego Twilio albo hosta macOS `chrome-node` zamiast domyślnej lokalnej ścieżki realtime Chrome.

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

Węzeł musi być połączony i wymieniać `googlemeet.chrome` oraz `browser.proxy`. Konfiguracja Gateway musi zezwalać na te polecenia węzła:

```json5
{
  gateway: {
    nodes: {
      allowCommands: ["browser.proxy", "googlemeet.chrome"],
    },
  },
}
```

Jeśli `googlemeet setup` nie zalicza `chrome-node-connected` albo log Gateway zgłasza `gateway token mismatch`, zainstaluj ponownie lub uruchom ponownie węzeł z bieżącym tokenem Gateway. Dla Gateway w sieci LAN zwykle oznacza to:

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

Uruchom `googlemeet test-listen` dla dołączeń tylko do obserwacji albo `googlemeet test-speech` dla dołączeń realtime, a następnie sprawdź zwrócony stan Chrome. Jeśli którakolwiek sonda zgłasza `manualActionRequired: true`, pokaż `manualActionMessage` operatorowi i przestań ponawiać próby do czasu ukończenia działania w przeglądarce.

Typowe ręczne działania:

- Zaloguj się do profilu Chrome.
- Wpuść gościa z konta gospodarza Meet.
- Przyznaj Chrome uprawnienia mikrofonu/kamery, gdy pojawi się natywne okno uprawnień Chrome.
- Zamknij lub napraw zablokowane okno dialogowe uprawnień Meet.

Nie zgłaszaj „nie zalogowano” tylko dlatego, że Meet pokazuje „Czy chcesz, aby inni słyszeli Cię na spotkaniu?” To ekran pośredni wyboru dźwięku w Meet; OpenClaw klika **Użyj mikrofonu** przez automatyzację przeglądarki, gdy jest dostępny, i nadal czeka na rzeczywisty stan spotkania. W przypadku awaryjnego trybu przeglądarki tylko do tworzenia OpenClaw może kliknąć **Kontynuuj bez mikrofonu**, ponieważ utworzenie adresu URL nie wymaga ścieżki dźwięku w czasie rzeczywistym.

### Tworzenie spotkania kończy się niepowodzeniem

`googlemeet create` najpierw używa punktu końcowego Google Meet API `spaces.create`, gdy poświadczenia OAuth są skonfigurowane. Bez poświadczeń OAuth przełącza się na przypiętą przeglądarkę Chrome node. Sprawdź:

- Dla tworzenia przez API: `oauth.clientId` i `oauth.refreshToken` są skonfigurowane albo obecne są pasujące zmienne środowiskowe `OPENCLAW_GOOGLE_MEET_*`.
- Dla tworzenia przez API: token odświeżania został wygenerowany po dodaniu obsługi tworzenia. Starszym tokenom może brakować zakresu `meetings.space.created`; uruchom ponownie `openclaw googlemeet auth login --json` i zaktualizuj konfigurację Plugin.
- Dla awaryjnego trybu przeglądarki: `defaultTransport: "chrome-node"` i `chromeNode.node` wskazują na połączony node z `browser.proxy` i `googlemeet.chrome`.
- Dla awaryjnego trybu przeglądarki: profil Chrome OpenClaw na tym node jest zalogowany w Google i może otworzyć `https://meet.google.com/new`.
- Dla awaryjnego trybu przeglądarki: ponowne próby używają istniejącej karty `https://meet.google.com/new` lub monitu konta Google przed otwarciem nowej karty. Jeśli agent przekroczy limit czasu, ponów wywołanie narzędzia zamiast ręcznie otwierać kolejną kartę Meet.
- Dla awaryjnego trybu przeglądarki: jeśli narzędzie zwróci `manualActionRequired: true`, użyj zwróconych wartości `browser.nodeId`, `browser.targetId`, `browserUrl` i `manualActionMessage`, aby pokierować operatorem. Nie ponawiaj w pętli, dopóki ta czynność nie zostanie ukończona.
- Dla awaryjnego trybu przeglądarki: jeśli Meet pokazuje „Czy chcesz, aby inni słyszeli Cię na spotkaniu?”, pozostaw kartę otwartą. OpenClaw powinien kliknąć **Użyj mikrofonu** albo, w przypadku awaryjnego trybu tylko do tworzenia, **Kontynuuj bez mikrofonu** przez automatyzację przeglądarki i dalej czekać na wygenerowany adres URL Meet. Jeśli nie może tego zrobić, błąd powinien wspominać `meet-audio-choice-required`, a nie `google-login-required`.

### Agent dołącza, ale nie mówi

Sprawdź ścieżkę czasu rzeczywistego:

```bash
openclaw googlemeet setup
openclaw googlemeet doctor
```

Użyj `mode: "realtime"` do nasłuchiwania/odpowiadania głosem. `mode: "transcribe"` celowo nie uruchamia dwukierunkowego mostu głosowego czasu rzeczywistego. Do debugowania wyłącznie obserwacyjnego uruchom `openclaw googlemeet status --json <session-id>` po tym, jak uczestnicy zaczną mówić, i sprawdź `captioning`, `transcriptLines` oraz `lastCaptionText`. Jeśli `inCall` ma wartość true, ale `transcriptLines` pozostaje na `0`, napisy Meet mogą być wyłączone, nikt nie mówił od zainstalowania obserwatora, interfejs Meet się zmienił albo napisy na żywo są niedostępne dla języka/konta spotkania.

`googlemeet test-speech` zawsze sprawdza ścieżkę czasu rzeczywistego i raportuje, czy dla tego wywołania zaobserwowano bajty wyjściowe mostu. Jeśli `speechOutputVerified` ma wartość false, a `speechOutputTimedOut` ma wartość true, dostawca czasu rzeczywistego mógł zaakceptować wypowiedź, ale OpenClaw nie zobaczył nowych bajtów wyjściowych docierających do mostu audio Chrome.

Sprawdź także:

- Klucz dostawcy czasu rzeczywistego jest dostępny na hoście Gateway, na przykład `OPENAI_API_KEY` lub `GEMINI_API_KEY`.
- `BlackHole 2ch` jest widoczny na hoście Chrome.
- `sox` istnieje na hoście Chrome.
- Mikrofon i głośnik Meet są kierowane przez wirtualną ścieżkę audio używaną przez OpenClaw.

`googlemeet doctor [session-id]` wypisuje sesję, node, stan połączenia, powód działania ręcznego, połączenie z dostawcą czasu rzeczywistego, `realtimeReady`, aktywność wejścia/wyjścia audio, ostatnie znaczniki czasu audio, liczniki bajtów i adres URL przeglądarki. Użyj `googlemeet status [session-id] --json`, gdy potrzebujesz surowego JSON. Użyj `googlemeet doctor --oauth`, gdy musisz zweryfikować odświeżenie OAuth Google Meet bez ujawniania tokenów; dodaj `--meeting` lub `--create-space`, gdy potrzebujesz również potwierdzenia Google Meet API.

Jeśli agent przekroczył limit czasu i widzisz już otwartą kartę Meet, sprawdź tę kartę bez otwierania kolejnej:

```bash
openclaw googlemeet recover-tab
openclaw googlemeet recover-tab https://meet.google.com/abc-defg-hij
```

Równoważną akcją narzędzia jest `recover_current_tab`. Ustawia fokus i sprawdza istniejącą kartę Meet dla wybranego transportu. Z `chrome` używa lokalnego sterowania przeglądarką przez Gateway; z `chrome-node` używa skonfigurowanego Chrome node. Nie otwiera nowej karty ani nie tworzy nowej sesji; raportuje bieżącą blokadę, taką jak logowanie, dopuszczenie, uprawnienia lub stan wyboru dźwięku. Polecenie CLI komunikuje się ze skonfigurowanym Gateway, więc Gateway musi działać; `chrome-node` wymaga również, aby Chrome node był połączony.

### Kontrole konfiguracji Twilio kończą się niepowodzeniem

`twilio-voice-call-plugin` kończy się niepowodzeniem, gdy `voice-call` nie jest dozwolony lub włączony. Dodaj go do `plugins.allow`, włącz `plugins.entries.voice-call` i przeładuj Gateway.

`twilio-voice-call-credentials` kończy się niepowodzeniem, gdy backend Twilio nie ma identyfikatora SID konta, tokenu uwierzytelniania lub numeru dzwoniącego. Ustaw je na hoście Gateway:

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
```

`twilio-voice-call-webhook` kończy się niepowodzeniem, gdy `voice-call` nie ma publicznej ekspozycji Webhook albo gdy `publicUrl` wskazuje na loopback lub prywatną przestrzeń sieciową. Ustaw `plugins.entries.voice-call.config.publicUrl` na publiczny URL dostawcy albo skonfiguruj tunel/ekspozycję Tailscale dla `voice-call`.

Adresy URL loopback i prywatne nie są prawidłowe dla wywołań zwrotnych operatorów. Nie używaj `localhost`, `127.0.0.1`, `0.0.0.0`, `10.x`, `172.16.x`-`172.31.x`, `192.168.x`, `169.254.x`, `fc00::/7` ani `fd00::/8` jako `publicUrl`.

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

Do lokalnego rozwoju użyj tunelu lub ekspozycji Tailscale zamiast prywatnego URL hosta:

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

Następnie zrestartuj lub przeładuj Gateway i uruchom:

```bash
openclaw googlemeet setup --transport twilio
openclaw voicecall setup
openclaw voicecall smoke
```

`voicecall smoke` domyślnie sprawdza tylko gotowość. Aby wykonać próbę bez wykonywania połączenia dla konkretnego numeru:

```bash
openclaw voicecall smoke --to "+15555550123"
```

Dodaj `--yes` tylko wtedy, gdy celowo chcesz wykonać rzeczywiste wychodzące połączenie powiadamiające:

```bash
openclaw voicecall smoke --to "+15555550123" --yes
```

### Połączenie Twilio zaczyna się, ale nigdy nie wchodzi na spotkanie

Potwierdź, że zdarzenie Meet udostępnia szczegóły wdzwaniania telefonicznego. Podaj dokładny numer wdzwaniania i PIN albo niestandardową sekwencję DTMF:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --dtmf-sequence ww123456#
```

Użyj początkowego `w` lub przecinków w `--dtmf-sequence`, jeśli dostawca potrzebuje pauzy przed wprowadzeniem PIN-u.

Jeśli połączenie telefoniczne zostaje utworzone, ale lista uczestników Meet nigdy nie pokazuje uczestnika wdzwanianego:

- Uruchom `openclaw googlemeet doctor <session-id>`, aby potwierdzić delegowany identyfikator połączenia Twilio, czy DTMF został zakolejkowany i czy poproszono o powitanie wstępne.
- Uruchom `openclaw voicecall status --call-id <id>` i potwierdź, że połączenie jest nadal aktywne.
- Uruchom `openclaw voicecall tail` i sprawdź, czy Webhook Twilio docierają do Gateway.
- Uruchom `openclaw logs --follow` i poszukaj sekwencji Twilio Meet: Google Meet deleguje dołączenie, Voice Call zapisuje przedpołączeniowy DTMF TwiML, obsługuje ten początkowy TwiML, następnie obsługuje TwiML czasu rzeczywistego i uruchamia most czasu rzeczywistego z `initialGreeting=queued`.
- Uruchom ponownie `openclaw googlemeet setup --transport twilio`; zielona kontrola konfiguracji jest wymagana, ale nie dowodzi, że sekwencja PIN-u spotkania jest poprawna.
- Potwierdź, że numer wdzwaniania należy do tego samego zaproszenia Meet i regionu co PIN.
- Zwiększ początkowe pauzy w `--dtmf-sequence`, jeśli Meet odpowiada powoli, na przykład `wwww123456#`.
- Jeśli uczestnik dołącza, ale nie słyszysz powitania, sprawdź `openclaw logs --follow` pod kątem TwiML czasu rzeczywistego, uruchomienia mostu czasu rzeczywistego i `initialGreeting=queued`. Powitanie jest generowane z początkowego komunikatu `voicecall.start` po połączeniu mostu czasu rzeczywistego.

Jeśli Webhook nie docierają, najpierw debuguj Plugin Voice Call: dostawca musi osiągać `plugins.entries.voice-call.config.publicUrl` albo skonfigurowany tunel. Zobacz [Rozwiązywanie problemów z połączeniami głosowymi](/pl/plugins/voice-call#troubleshooting).

## Uwagi

Oficjalne API multimediów Google Meet jest zorientowane na odbiór, więc mówienie do połączenia Meet nadal wymaga ścieżki uczestnika. Ten Plugin utrzymuje tę granicę widoczną: Chrome obsługuje uczestnictwo przez przeglądarkę i lokalne kierowanie audio; Twilio obsługuje uczestnictwo przez wdzwanianie telefoniczne.

Tryb czasu rzeczywistego Chrome potrzebuje `BlackHole 2ch` oraz jednego z poniższych:

- `chrome.audioInputCommand` plus `chrome.audioOutputCommand`: OpenClaw posiada most modelu czasu rzeczywistego i przesyła audio w formacie `chrome.audioFormat` między tymi poleceniami a wybranym dostawcą głosu czasu rzeczywistego. Domyślna ścieżka Chrome to PCM16 24 kHz; 8 kHz G.711 mu-law pozostaje dostępne dla starszych par poleceń.
- `chrome.audioBridgeCommand`: zewnętrzne polecenie mostu posiada całą lokalną ścieżkę audio i musi zakończyć działanie po uruchomieniu lub zweryfikowaniu swojego demona.

Aby uzyskać czysty dwukierunkowy dźwięk, skieruj wyjście Meet i mikrofon Meet przez oddzielne urządzenia wirtualne albo graf urządzeń wirtualnych w stylu Loopback. Jedno współdzielone urządzenie BlackHole może odbijać innych uczestników z powrotem do połączenia.

W przypadku mostu Chrome opartego na parze poleceń `chrome.bargeInInputCommand` może nasłuchiwać oddzielnego lokalnego mikrofonu i czyścić odtwarzanie asystenta, gdy człowiek zaczyna mówić. Dzięki temu mowa człowieka pozostaje przed wyjściem asystenta, nawet gdy współdzielone wejście loopback BlackHole jest tymczasowo wyciszone podczas odtwarzania asystenta. Podobnie jak `chrome.audioInputCommand` i `chrome.audioOutputCommand`, jest to lokalne polecenie konfigurowane przez operatora. Użyj jawnej zaufanej ścieżki polecenia albo listy argumentów i nie wskazuj na skrypty z niezaufanych lokalizacji.

`googlemeet speak` wyzwala aktywny most audio czasu rzeczywistego dla sesji Chrome. `googlemeet leave` zatrzymuje ten most. Dla sesji Twilio delegowanych przez Plugin Voice Call `leave` rozłącza również bazowe połączenie głosowe. Użyj `googlemeet end-active-conference`, gdy chcesz także zamknąć aktywną konferencję Google Meet dla przestrzeni zarządzanej przez API.

## Powiązane

- [Plugin połączeń głosowych](/pl/plugins/voice-call)
- [Tryb rozmowy](/pl/nodes/talk)
- [Tworzenie Plugin](/pl/plugins/building-plugins)
