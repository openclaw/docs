---
read_when:
    - Chcesz, aby agent OpenClaw dołączył do rozmowy w Google Meet
    - Chcesz, aby agent OpenClaw utworzył nowe połączenie Google Meet
    - Konfigurujesz Chrome, węzeł Chrome lub Twilio jako transport Google Meet
summary: 'Plugin Google Meet: dołączanie do jawnie podanych adresów URL Meet przez Chrome lub Twilio z domyślnymi ustawieniami odpowiedzi agenta'
title: Plugin Google Meet
x-i18n:
    generated_at: "2026-05-06T09:23:07Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9c1de7528ddabe6411598eea362d4a21c6f95f374700046c18294b215a1333d3
    source_path: plugins/google-meet.md
    workflow: 16
---

Obsługa uczestnika Google Meet w OpenClaw — plugin jest celowo jawny:

- Dołącza tylko do jawnego adresu URL `https://meet.google.com/...`.
- Może utworzyć nową przestrzeń Meet przez Google Meet API, a następnie dołączyć do
  zwróconego adresu URL.
- `agent` to domyślny tryb odpowiedzi głosowej: transkrypcja w czasie rzeczywistym nasłuchuje,
  skonfigurowany agent OpenClaw odpowiada, a zwykłe OpenClaw TTS mówi w Meet.
- `bidi` pozostaje dostępny jako zapasowy tryb bezpośredniego modelu głosowego w czasie rzeczywistym.
- Agenty wybierają zachowanie dołączania za pomocą `mode`: użyj `agent` do żywego
  nasłuchiwania/odpowiedzi głosowej, `bidi` jako zapasowego bezpośredniego trybu głosowego w czasie rzeczywistym albo `transcribe`
  do dołączenia/kontrolowania przeglądarki bez mostka odpowiedzi głosowej.
- Uwierzytelnianie zaczyna się jako osobiste Google OAuth albo już zalogowany profil Chrome.
- Nie ma automatycznego ogłoszenia zgody.
- Domyślny backend audio Chrome to `BlackHole 2ch`.
- Chrome może działać lokalnie albo na sparowanym hoście węzła.
- Twilio akceptuje numer wdzwonienia oraz opcjonalny PIN lub sekwencję DTMF; nie
  może bezpośrednio wybrać adresu URL Meet.
- Polecenie CLI to `googlemeet`; `meet` jest zarezerwowane dla szerszych przepływów
  telekonferencji agentów.

## Szybki start

Zainstaluj lokalne zależności audio i skonfiguruj dostawcę transkrypcji w czasie rzeczywistym
oraz zwykłe OpenClaw TTS. OpenAI jest domyślnym dostawcą transkrypcji;
Google Gemini Live działa też jako osobny zapasowy głos `bidi` z
`realtime.voiceProvider: "google"`:

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
# only needed when realtime.voiceProvider is "google" for bidi mode
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

Wynik konfiguracji jest przeznaczony do odczytu przez agenta i świadomy trybu. Raportuje profil Chrome,
przypięcie węzła oraz, dla dołączeń Chrome w czasie rzeczywistym, mostek audio
BlackHole/SoX i opóźnione kontrole wstępu w czasie rzeczywistym. Dla dołączeń tylko obserwacyjnych sprawdź ten sam
transport za pomocą `--mode transcribe`; ten tryb pomija wymagania wstępne audio w czasie rzeczywistym,
ponieważ nie nasłuchuje ani nie mówi przez mostek:

```bash
openclaw googlemeet setup --transport chrome-node --mode transcribe
```

Gdy skonfigurowano delegowanie Twilio, konfiguracja raportuje też, czy plugin
`voice-call`, dane uwierzytelniające Twilio i publiczna ekspozycja Webhook są gotowe.
Traktuj każdą kontrolę `ok: false` jako blokadę dla sprawdzanego transportu i trybu,
zanim poprosisz agenta o dołączenie. Użyj `openclaw googlemeet setup --json` dla
skryptów albo wyniku do odczytu maszynowego. Użyj `--transport chrome`,
`--transport chrome-node` albo `--transport twilio`, aby wstępnie sprawdzić konkretny
transport, zanim agent go spróbuje.

Dla Twilio zawsze wstępnie sprawdzaj transport jawnie, gdy domyślnym transportem
jest Chrome:

```bash
openclaw googlemeet setup --transport twilio
```

To wykrywa brakujące połączenie `voice-call`, dane uwierzytelniające Twilio albo nieosiągalną
ekspozycję Webhook, zanim agent spróbuje wdzwonić się na spotkanie.

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

Narzędzie `google_meet` dostępne dla agenta pozostaje dostępne na hostach innych niż macOS dla
artefaktów, kalendarza, konfiguracji, transkrypcji, Twilio i przepływów `chrome-node`. Lokalne
akcje odpowiedzi głosowej Chrome są tam blokowane, ponieważ dołączona ścieżka audio Chrome
obecnie zależy od macOS `BlackHole 2ch`. W systemie Linux użyj `mode: "transcribe"`,
wdzwonienia Twilio albo hosta macOS `chrome-node` do udziału Chrome z odpowiedzią głosową.

Utwórz nowe spotkanie i dołącz do niego:

```bash
openclaw googlemeet create --transport chrome-node --mode agent
```

Dla pokoi tworzonych przez API użyj Google Meet `SpaceConfig.accessType`, gdy chcesz,
aby polityka pokoju bez pukania była jawna zamiast dziedziczona z domyślnych ustawień konta
Google:

```bash
openclaw googlemeet create --access-type OPEN --transport chrome-node --mode agent
```

`OPEN` pozwala każdemu z adresem URL Meet dołączyć bez pukania. `TRUSTED` pozwala
zaufanym użytkownikom organizacji hosta, zaproszonym użytkownikom zewnętrznym i użytkownikom
wdzwaniającym się dołączyć bez pukania. `RESTRICTED` ogranicza wejście bez pukania do zaproszonych. Te
ustawienia mają zastosowanie tylko do oficjalnej ścieżki tworzenia Google Meet API, więc dane
uwierzytelniające OAuth muszą być skonfigurowane.

Jeśli uwierzytelniłeś Google Meet przed dostępnością tej opcji, uruchom ponownie
`openclaw googlemeet auth login --json` po dodaniu zakresu
`meetings.space.settings` do ekranu zgody Google OAuth.

Utwórz tylko adres URL bez dołączania:

```bash
openclaw googlemeet create --no-join
```

`googlemeet create` ma dwie ścieżki:

- Tworzenie przez API: używane, gdy skonfigurowano dane uwierzytelniające Google Meet OAuth. To
  najbardziej deterministyczna ścieżka i nie zależy od stanu interfejsu przeglądarki.
- Zapasowa ścieżka przeglądarkowa: używana, gdy brak danych uwierzytelniających OAuth. OpenClaw używa
  przypiętego węzła Chrome, otwiera `https://meet.google.com/new`, czeka, aż Google
  przekieruje do prawdziwego adresu URL z kodem spotkania, a następnie zwraca ten URL. Ta ścieżka wymaga,
  aby profil Chrome OpenClaw na węźle był już zalogowany do Google.
  Automatyzacja przeglądarki obsługuje własny monit Meet o mikrofon przy pierwszym uruchomieniu; ten monit
  nie jest traktowany jako błąd logowania Google.
  Przepływy dołączania i tworzenia próbują też ponownie użyć istniejącej karty Meet przed otwarciem
  nowej. Dopasowanie ignoruje nieistotne ciągi zapytań URL, takie jak `authuser`, więc ponowna próba
  agenta powinna skupić już otwarte spotkanie zamiast tworzyć drugą
  kartę Chrome.

Wynik polecenia/narzędzia zawiera pole `source` (`api` albo `browser`), aby agenty
mogły wyjaśnić, której ścieżki użyto. `create` domyślnie dołącza do nowego spotkania i
zwraca `joined: true` oraz sesję dołączenia. Aby tylko wygenerować adres URL, użyj
`create --no-join` w CLI albo przekaż `"join": false` do narzędzia.

Albo powiedz agentowi: „Utwórz Google Meet, dołącz do niego w trybie odpowiedzi głosowej agenta
i wyślij mi link”. Agent powinien wywołać `google_meet` z
`action: "create"`, a potem udostępnić zwrócone `meetingUri`.

```json
{
  "action": "create",
  "transport": "chrome-node",
  "mode": "agent"
}
```

Dla dołączenia tylko obserwacyjnego/kontroli przeglądarki ustaw `"mode": "transcribe"`. To nie
uruchamia dwukierunkowego mostka głosowego w czasie rzeczywistym, nie wymaga BlackHole ani SoX
i nie będzie odpowiadać głosowo w spotkaniu. Dołączenia Chrome w tym trybie unikają też
przyznawania przez OpenClaw uprawnień do mikrofonu/kamery i omijają ścieżkę Meet **Użyj
mikrofonu**. Jeśli Meet pokazuje ekran pośredni wyboru audio, automatyzacja próbuje
ścieżki bez mikrofonu, a w przeciwnym razie zgłasza działanie ręczne zamiast otwierać
lokalny mikrofon. W trybie transkrypcji zarządzane transporty Chrome instalują też
obserwatora napisów Meet w trybie najlepszych starań. `googlemeet status --json` i
`googlemeet doctor` pokazują `captioning`, `captionsEnabledAttempted`,
`transcriptLines`, `lastCaptionAt`, `lastCaptionSpeaker`, `lastCaptionText`
oraz krótki ogon `recentTranscript`, aby operatorzy mogli stwierdzić, czy przeglądarka
dołączyła do połączenia i czy napisy Meet tworzą tekst.
Użyj `openclaw googlemeet test-listen <meet-url> --transport chrome-node`, gdy
potrzebujesz sondy tak/nie: dołącza w trybie transkrypcji, czeka na świeży ruch napisów albo
transkrypcji i zwraca `listenVerified`, `listenTimedOut`, pola działania ręcznego
oraz najnowszy stan napisów.

Podczas sesji w czasie rzeczywistym status `google_meet` zawiera stan przeglądarki i mostka audio,
taki jak `inCall`, `manualActionRequired`, `providerConnected`,
`realtimeReady`, `audioInputActive`, `audioOutputActive`, ostatnie znaczniki czasu wejścia/wyjścia,
liczniki bajtów i stan zamknięcia mostka. Jeśli pojawi się bezpieczny monit strony Meet,
automatyzacja przeglądarki obsługuje go, gdy może. Logowanie, dopuszczenie przez hosta oraz
monity uprawnień przeglądarki/systemu operacyjnego są zgłaszane jako działanie ręczne z powodem i
komunikatem do przekazania przez agenta. Zarządzane sesje Chrome emitują wstęp albo
frazę testową dopiero po tym, jak stan przeglądarki zgłosi `inCall: true`; w przeciwnym razie status zgłasza
`speechReady: false`, a próba mowy jest blokowana zamiast udawać, że
agent mówił w spotkaniu.

Lokalne dołączenia Chrome odbywają się przez zalogowany profil przeglądarki OpenClaw. Tryb czasu rzeczywistego
wymaga `BlackHole 2ch` dla ścieżki mikrofonu/głośnika używanej przez OpenClaw. Dla
czystego dwukierunkowego audio użyj oddzielnych urządzeń wirtualnych albo grafu w stylu Loopback; jedno
urządzenie BlackHole wystarczy do pierwszego testu dymnego, ale może powodować echo.

### Lokalny Gateway + Chrome w Parallels

Nie potrzebujesz pełnego OpenClaw Gateway ani klucza API modelu w maszynie VM macOS
tylko po to, aby VM była właścicielem Chrome. Uruchom Gateway i agenta lokalnie, a następnie uruchom
host węzła w VM. Włącz dołączony plugin w VM raz, aby węzeł
reklamował polecenie Chrome:

Co działa gdzie:

- Host Gateway: OpenClaw Gateway, obszar roboczy agenta, klucze modelu/API, dostawca czasu rzeczywistego
  oraz konfiguracja pluginu Google Meet.
- Maszyna VM macOS Parallels: OpenClaw CLI/host węzła, Google Chrome, SoX, BlackHole 2ch
  oraz profil Chrome zalogowany do Google.
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

Po ponownym uruchomieniu sprawdź, czy VM widzi urządzenie audio i polecenia SoX:

```bash
system_profiler SPAudioDataType | grep -i BlackHole
command -v sox
```

Zainstaluj albo zaktualizuj OpenClaw w VM, a następnie włącz tam dołączony plugin:

```bash
openclaw plugins enable google-meet
```

Uruchom host węzła w VM:

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name parallels-macos
```

Jeśli `<gateway-host>` jest adresem IP w sieci LAN i nie używasz TLS, węzeł odrzuca
zwykły WebSocket, chyba że wyrazisz zgodę dla tej zaufanej sieci prywatnej:

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node run --host <gateway-lan-ip> --port 18789 --display-name parallels-macos
```

Użyj tej samej zmiennej środowiskowej podczas instalowania węzła jako LaunchAgent:

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node install --host <gateway-lan-ip> --port 18789 --display-name parallels-macos --force
openclaw node restart
```

`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` jest środowiskiem procesu, a nie ustawieniem
`openclaw.json`. `openclaw node install` zapisuje je w środowisku LaunchAgent,
gdy jest obecne w poleceniu instalacji.

Zatwierdź węzeł z hosta Gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Potwierdź, że Gateway widzi węzeł i że reklamuje on zarówno `googlemeet.chrome`,
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

Dla jednopoleceniowego testu dymnego, który tworzy albo ponownie używa sesji, wypowiada znaną
frazę i wypisuje stan sesji:

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij
```

Podczas dołączania w czasie rzeczywistym automatyzacja przeglądarki OpenClaw wypełnia nazwę gościa, klika
Dołącz/Poproś o dołączenie i akceptuje pierwszy wybór Meet „Użyj mikrofonu”, gdy ten
monit się pojawi. Podczas dołączania tylko do obserwacji lub tworzenia spotkania tylko w przeglądarce
przechodzi przez ten sam monit bez mikrofonu, gdy taka opcja jest dostępna.
Jeśli profil przeglądarki nie jest zalogowany, Meet czeka na dopuszczenie przez hosta,
Chrome potrzebuje uprawnień do mikrofonu/kamery do dołączenia w czasie rzeczywistym albo Meet utknął
na monicie, którego automatyzacja nie mogła rozwiązać, wynik dołączenia/test-speech zgłasza
`manualActionRequired: true` z `manualActionReason` i
`manualActionMessage`. Agenci powinni przestać ponawiać dołączanie, zgłosić dokładnie ten
komunikat oraz bieżące `browserUrl`/`browserTitle`, i ponowić próbę dopiero po
ukończeniu ręcznej akcji w przeglądarce.

Jeśli `chromeNode.node` zostanie pominięte, OpenClaw wybiera automatycznie tylko wtedy, gdy dokładnie jeden
połączony węzeł ogłasza zarówno `googlemeet.chrome`, jak i sterowanie przeglądarką. Jeśli
połączonych jest kilka zdolnych węzłów, ustaw `chromeNode.node` na identyfikator węzła,
nazwę wyświetlaną lub zdalny adres IP.

Typowe kontrole awarii:

- `Configured Google Meet node ... is not usable: offline`: przypięty węzeł jest
  znany Gateway, ale niedostępny. Agenci powinni traktować ten węzeł jako
  stan diagnostyczny, a nie jako używalny host Chrome, i zgłosić blokadę konfiguracji
  zamiast przełączać się na inny transport, chyba że użytkownik o to poprosił.
- `No connected Google Meet-capable node`: uruchom `openclaw node run` w VM,
  zatwierdź parowanie i upewnij się, że `openclaw plugins enable google-meet` oraz
  `openclaw plugins enable browser` zostały uruchomione w VM. Potwierdź także, że
  host Gateway zezwala na oba polecenia węzła za pomocą
  `gateway.nodes.allowCommands: ["googlemeet.chrome", "browser.proxy"]`.
- `BlackHole 2ch audio device not found`: zainstaluj `blackhole-2ch` na sprawdzanym hoście
  i uruchom go ponownie przed użyciem lokalnego audio Chrome.
- `BlackHole 2ch audio device not found on the node`: zainstaluj `blackhole-2ch`
  w VM i uruchom VM ponownie.
- Chrome otwiera się, ale nie może dołączyć: zaloguj się do profilu przeglądarki w VM albo
  pozostaw ustawione `chrome.guestName` dla dołączania jako gość. Automatyczne dołączanie gościa używa
  automatyzacji przeglądarki OpenClaw przez proxy przeglądarki węzła; upewnij się, że konfiguracja
  przeglądarki węzła wskazuje żądany profil, na przykład
  `browser.defaultProfile: "user"` lub nazwany profil istniejącej sesji.
- Zduplikowane karty Meet: pozostaw włączone `chrome.reuseExistingTab: true`. OpenClaw
  aktywuje istniejącą kartę dla tego samego URL Meet przed otwarciem nowej, a
  tworzenie spotkania w przeglądarce ponownie używa trwającej karty `https://meet.google.com/new`
  lub karty monitu konta Google przed otwarciem kolejnej.
- Brak audio: w Meet skieruj mikrofon/głośnik przez ścieżkę wirtualnego urządzenia audio
  używaną przez OpenClaw; użyj oddzielnych urządzeń wirtualnych lub routingu w stylu Loopback
  dla czystego audio dwukierunkowego.

## Uwagi instalacyjne

Domyślna funkcja odtwarzania zwrotnego Chrome używa dwóch zewnętrznych narzędzi:

- `sox`: narzędzie audio wiersza poleceń. Plugin używa jawnych poleceń urządzeń CoreAudio
  dla domyślnego mostka audio 24 kHz PCM16.
- `blackhole-2ch`: wirtualny sterownik audio macOS. Tworzy urządzenie audio `BlackHole 2ch`,
  przez które Chrome/Meet może kierować dźwięk.

OpenClaw nie dołącza ani nie redystrybuuje żadnego z tych pakietów. Dokumentacja prosi użytkowników o
instalowanie ich jako zależności hosta przez Homebrew. SoX jest licencjonowany jako
`LGPL-2.0-only AND GPL-2.0-only`; BlackHole jest na GPL-3.0. Jeśli budujesz
instalator lub urządzenie, które dołącza BlackHole z OpenClaw, sprawdź warunki licencji
upstream BlackHole albo uzyskaj oddzielną licencję od Existential Audio.

## Transporty

### Chrome

Transport Chrome otwiera URL Meet przez sterowanie przeglądarką OpenClaw i dołącza
jako zalogowany profil przeglądarki OpenClaw. Na macOS Plugin sprawdza obecność
`BlackHole 2ch` przed uruchomieniem. Jeśli skonfigurowano, uruchamia też polecenie
sprawdzania kondycji mostka audio i polecenie startowe przed otwarciem Chrome. Użyj `chrome`, gdy
Chrome/audio działa na hoście Gateway; użyj `chrome-node`, gdy Chrome/audio działa
na sparowanym węźle, takim jak VM Parallels macOS. Dla lokalnego Chrome wybierz
profil za pomocą `browser.defaultProfile`; `chrome.browserProfile` jest przekazywane do
hostów `chrome-node`.

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome-node
```

Skieruj audio mikrofonu i głośnika Chrome przez lokalny mostek audio OpenClaw.
Jeśli `BlackHole 2ch` nie jest zainstalowany, dołączanie kończy się błędem konfiguracji
zamiast cicho dołączać bez ścieżki audio.

### Twilio

Transport Twilio to ścisły plan wybierania delegowany do Plugin Voice Call. Nie
analizuje stron Meet w poszukiwaniu numerów telefonów.

Użyj tego, gdy uczestnictwo przez Chrome nie jest dostępne albo chcesz mieć zapasową
opcję telefoniczną. Google Meet musi udostępniać numer telefonu do połączenia i PIN dla
spotkania; OpenClaw nie wykrywa ich ze strony Meet.

Włącz Plugin Voice Call na hoście Gateway, nie na węźle Chrome:

```json5
{
  plugins: {
    allow: ["google-meet", "voice-call", "google"],
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
          inboundPolicy: "allowlist",
          realtime: {
            enabled: true,
            provider: "google",
            instructions: "Join this Google Meet as an OpenClaw agent. Be brief.",
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

Podaj dane uwierzytelniające Twilio przez środowisko lub konfigurację. Środowisko utrzymuje
sekrety poza `openclaw.json`:

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
export GEMINI_API_KEY=...
```

Użyj zamiast tego `realtime.provider: "openai"` z OpenAI provider plugin i
`OPENAI_API_KEY`, jeśli to jest Twój dostawca głosu w czasie rzeczywistym.

Uruchom ponownie lub przeładuj Gateway po włączeniu `voice-call`; zmiany konfiguracji Plugin
nie pojawią się w już uruchomionym procesie Gateway, dopóki nie zostanie przeładowany.

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

OAuth jest opcjonalne przy tworzeniu linku Meet, ponieważ `googlemeet create` może przełączyć się
na automatyzację przeglądarki. Skonfiguruj OAuth, gdy chcesz oficjalne tworzenie przez API,
rozpoznawanie przestrzeni lub kontrole preflight Meet Media API.

Dostęp do Google Meet API używa OAuth użytkownika: utwórz klienta Google Cloud OAuth,
zażądaj wymaganych zakresów, autoryzuj konto Google, a następnie zapisz
wynikowy token odświeżania w konfiguracji Plugin Google Meet albo podaj zmienne środowiskowe
`OPENCLAW_GOOGLE_MEET_*`.

OAuth nie zastępuje ścieżki dołączania przez Chrome. Transporty Chrome i Chrome-node
nadal dołączają przez zalogowany profil Chrome, BlackHole/SoX i połączony
węzeł, gdy używasz uczestnictwa przez przeglądarkę. OAuth służy tylko do oficjalnej ścieżki
Google Meet API: tworzenia przestrzeni spotkań, rozpoznawania przestrzeni i uruchamiania
kontroli preflight Meet Media API.

### Tworzenie danych uwierzytelniających Google

W Google Cloud Console:

1. Utwórz lub wybierz projekt Google Cloud.
2. Włącz **Google Meet REST API** dla tego projektu.
3. Skonfiguruj ekran zgody OAuth.
   - **Internal** jest najprostsze dla organizacji Google Workspace.
   - **External** działa dla konfiguracji osobistych/testowych; gdy aplikacja jest w trybie Testing,
     dodaj każde konto Google, które będzie autoryzować aplikację, jako użytkownika testowego.
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
`meetings.space.readonly` pozwala OpenClaw rozpoznawać URL-e/kody Meet jako przestrzenie.
`meetings.space.settings` pozwala OpenClaw przekazywać ustawienia `SpaceConfig`, takie jak
`accessType`, podczas tworzenia pokoju przez API.
`meetings.conference.media.readonly` służy do preflight Meet Media API i pracy z mediami;
Google może wymagać rejestracji w Developer Preview do faktycznego użycia Media API.
Jeśli potrzebujesz tylko dołączeń Chrome opartych na przeglądarce, całkowicie pomiń OAuth.

### Wystawianie tokenu odświeżania

Skonfiguruj `oauth.clientId` i opcjonalnie `oauth.clientSecret` albo przekaż je jako
zmienne środowiskowe, a następnie uruchom:

```bash
openclaw googlemeet auth login --json
```

Polecenie wypisuje blok konfiguracji `oauth` z tokenem odświeżania. Używa PKCE,
wywołania zwrotnego localhost pod `http://localhost:8085/oauth2callback` oraz ręcznego
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
Jeśli obecne są zarówno wartości konfiguracji, jak i środowiska, Plugin najpierw rozwiązuje konfigurację,
a potem używa środowiska jako rezerwy.

Zgoda OAuth obejmuje tworzenie przestrzeni Meet, dostęp do odczytu przestrzeni Meet oraz dostęp
do odczytu multimediów konferencji Meet. Jeśli uwierzytelnienie wykonano przed dodaniem obsługi
tworzenia spotkań, uruchom ponownie `openclaw googlemeet auth login --json`, aby token odświeżania
miał zakres `meetings.space.created`.

### Weryfikacja OAuth za pomocą doctor

Uruchom doctor OAuth, gdy chcesz szybką, niesekretną kontrolę kondycji:

```bash
openclaw googlemeet doctor --oauth --json
```

To nie ładuje środowiska uruchomieniowego Chrome ani nie wymaga połączonego węzła Chrome. Sprawdza,
czy konfiguracja OAuth istnieje oraz czy token odświeżania może wystawić token dostępu.
Raport JSON zawiera tylko pola statusu, takie jak `ok`, `configured`,
`tokenSource`, `expiresAt` i komunikaty kontroli; nie wypisuje tokenu dostępu,
tokenu odświeżania ani sekretu klienta.

Typowe wyniki:

| Kontrola             | Znaczenie                                                                               |
| -------------------- | --------------------------------------------------------------------------------------- |
| `oauth-config`       | Obecne jest `oauth.clientId` oraz `oauth.refreshToken` albo pamiętany token dostępu.    |
| `oauth-token`        | Pamiętany token dostępu jest nadal ważny albo token odświeżania wydał nowy token dostępu. |
| `meet-spaces-get`    | Opcjonalna kontrola `--meeting` rozwiązała istniejący obszar Meet.                      |
| `meet-spaces-create` | Opcjonalna kontrola `--create-space` utworzyła nowy obszar Meet.                        |

Aby potwierdzić także włączenie Google Meet API i zakres `spaces.create`, uruchom
kontrolę tworzenia wywołującą efekt uboczny:

```bash
openclaw googlemeet doctor --oauth --create-space --json
openclaw googlemeet create --no-join --json
```

`--create-space` tworzy jednorazowy URL Meet. Użyj go, gdy musisz potwierdzić,
że projekt Google Cloud ma włączone Meet API oraz że autoryzowane konto ma zakres
`meetings.space.created`.

Aby potwierdzić dostęp do odczytu istniejącego obszaru spotkania:

```bash
openclaw googlemeet doctor --oauth --meeting https://meet.google.com/abc-defg-hij --json
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
```

`doctor --oauth --meeting` i `resolve-space` potwierdzają dostęp do odczytu istniejącego
obszaru, do którego autoryzowane konto Google ma dostęp. Kod `403` z tych kontroli
zwykle oznacza, że Google Meet REST API jest wyłączone, zatwierdzonemu tokenowi
odświeżania brakuje wymaganego zakresu albo konto Google nie ma dostępu do tego
obszaru Meet. Błąd tokenu odświeżania oznacza, że należy ponownie uruchomić
`openclaw googlemeet auth login --json` i zapisać nowy blok `oauth`.

Dane logowania OAuth nie są potrzebne dla awaryjnej ścieżki przeglądarkowej. W tym
trybie uwierzytelnianie Google pochodzi z zalogowanego profilu Chrome na wybranym
Node, a nie z konfiguracji OpenClaw.

Te zmienne środowiskowe są akceptowane jako wartości awaryjne:

- `OPENCLAW_GOOGLE_MEET_CLIENT_ID` lub `GOOGLE_MEET_CLIENT_ID`
- `OPENCLAW_GOOGLE_MEET_CLIENT_SECRET` lub `GOOGLE_MEET_CLIENT_SECRET`
- `OPENCLAW_GOOGLE_MEET_REFRESH_TOKEN` lub `GOOGLE_MEET_REFRESH_TOKEN`
- `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN` lub `GOOGLE_MEET_ACCESS_TOKEN`
- `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT` lub
  `GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT`
- `OPENCLAW_GOOGLE_MEET_DEFAULT_MEETING` lub `GOOGLE_MEET_DEFAULT_MEETING`
- `OPENCLAW_GOOGLE_MEET_PREVIEW_ACK` lub `GOOGLE_MEET_PREVIEW_ACK`

Rozwiąż URL Meet, kod albo `spaces/{id}` przez `spaces.get`:

```bash
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
```

Uruchom kontrolę wstępną przed pracą z multimediami:

```bash
openclaw googlemeet preflight --meeting https://meet.google.com/abc-defg-hij
```

Wyświetl artefakty spotkania i frekwencję po utworzeniu rekordów konferencji przez Meet:

```bash
openclaw googlemeet artifacts --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet attendance --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet export --meeting https://meet.google.com/abc-defg-hij --output ./meet-export
```

Z `--meeting` polecenia `artifacts` i `attendance` domyślnie używają najnowszego rekordu
konferencji. Przekaż `--all-conference-records`, gdy chcesz uzyskać każdy zachowany
rekord dla tego spotkania.

Wyszukiwanie w kalendarzu może rozwiązać URL spotkania z Google Calendar przed odczytem
artefaktów Meet:

```bash
openclaw googlemeet latest --today
openclaw googlemeet calendar-events --today --json
openclaw googlemeet artifacts --event "Weekly sync"
openclaw googlemeet attendance --today --format csv --output attendance.csv
```

`--today` przeszukuje dzisiejszy kalendarz `primary` w poszukiwaniu wydarzenia Calendar
z linkiem Google Meet. Użyj `--event <query>`, aby wyszukać pasujący tekst wydarzenia, oraz
`--calendar <id>` dla kalendarza innego niż główny. Wyszukiwanie w kalendarzu wymaga
świeżego logowania OAuth obejmującego zakres tylko do odczytu wydarzeń Calendar.
`calendar-events` pokazuje podgląd pasujących wydarzeń Meet i oznacza wydarzenie, które
wybierze `latest`, `artifacts`, `attendance` albo `export`.

Jeśli znasz już identyfikator rekordu konferencji, zaadresuj go bezpośrednio:

```bash
openclaw googlemeet latest --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet artifacts --conference-record conferenceRecords/abc123 --json
openclaw googlemeet attendance --conference-record conferenceRecords/abc123 --json
```

Zakończ aktywną konferencję dla obszaru utworzonego przez API, gdy chcesz zamknąć
pokój po rozmowie:

```bash
openclaw googlemeet end-active-conference https://meet.google.com/abc-defg-hij
```

To wywołuje Google Meet `spaces.endActiveConference` i wymaga OAuth z zakresem
`meetings.space.created` dla obszaru, którym autoryzowane konto może zarządzać.
OpenClaw akceptuje URL Meet, kod spotkania albo wejście `spaces/{id}` i rozwiązuje je
do zasobu obszaru API przed zakończeniem aktywnej konferencji.
Jest to oddzielne od `googlemeet leave`: `leave` zatrzymuje lokalne/sesyjne
uczestnictwo OpenClaw, natomiast `end-active-conference` prosi Google Meet o zakończenie
aktywnej konferencji dla obszaru.

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

`artifacts` zwraca metadane rekordu konferencji oraz metadane zasobów uczestników,
nagrania, transkrypcji, strukturalnego wpisu transkrypcji i inteligentnej notatki,
gdy Google udostępnia je dla spotkania. Użyj `--no-transcript-entries`, aby pominąć
wyszukiwanie wpisów dla dużych spotkań. `attendance` rozwija uczestników do wierszy
sesji uczestnika z czasami pierwszego/ostatniego zauważenia, całkowitym czasem trwania
sesji, flagami spóźnienia/wczesnego opuszczenia oraz zduplikowanymi zasobami uczestników
scalonymi według zalogowanego użytkownika albo nazwy wyświetlanej. Przekaż
`--no-merge-duplicates`, aby zachować surowe zasoby uczestników oddzielnie,
`--late-after-minutes`, aby dostroić wykrywanie spóźnień, oraz
`--early-before-minutes`, aby dostroić wykrywanie wczesnego opuszczenia.

`export` zapisuje folder zawierający `summary.md`, `attendance.csv`, `transcript.md`,
`artifacts.json`, `attendance.json` i `manifest.json`.
`manifest.json` rejestruje wybrane wejście, opcje eksportu, rekordy konferencji,
pliki wyjściowe, liczby, źródło tokenu, wydarzenie Calendar, gdy zostało użyte, oraz
wszelkie ostrzeżenia o częściowym pobraniu. Przekaż `--zip`, aby zapisać także przenośne
archiwum obok folderu. Przekaż `--include-doc-bodies`, aby wyeksportować tekst
powiązanych transkrypcji i inteligentnych notatek Google Docs przez Google Drive
`files.export`; wymaga to świeżego logowania OAuth obejmującego zakres Drive Meet tylko
do odczytu. Bez `--include-doc-bodies` eksporty obejmują tylko metadane Meet i
strukturalne wpisy transkrypcji. Jeśli Google zwróci częściową awarię artefaktu, taką
jak błąd listingu inteligentnych notatek, wpisu transkrypcji albo treści dokumentu Drive,
podsumowanie i manifest zachowują ostrzeżenie zamiast przerywać cały eksport.
Użyj `--dry-run`, aby pobrać te same dane artefaktów/frekwencji i wydrukować JSON
manifestu bez tworzenia folderu ani ZIP. Jest to przydatne przed zapisaniem dużego
eksportu albo gdy agent potrzebuje tylko liczników, wybranych rekordów i ostrzeżeń.

Agenci mogą również utworzyć ten sam pakiet przez narzędzie `google_meet`:

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

Agenci mogą również utworzyć pokój oparty na API z jawną polityką dostępu:

```json
{
  "action": "create",
  "transport": "chrome-node",
  "mode": "agent",
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

Do walidacji z nasłuchem jako pierwszym krokiem agenci powinni użyć `test_listen`, zanim
stwierdzą, że spotkanie jest użyteczne:

```json
{
  "action": "test_listen",
  "url": "https://meet.google.com/abc-defg-hij",
  "transport": "chrome-node",
  "timeoutMs": 30000
}
```

Uruchom chroniony test dymny na żywo względem rzeczywistego zachowanego spotkania:

```bash
OPENCLAW_LIVE_TEST=1 \
OPENCLAW_GOOGLE_MEET_LIVE_MEETING=https://meet.google.com/abc-defg-hij \
pnpm test:live -- extensions/google-meet/google-meet.live.test.ts
```

Uruchom przeglądarkową sondę na żywo z nasłuchem jako pierwszym krokiem względem
spotkania, na którym ktoś będzie mówić przy dostępnych napisach Meet:

```bash
openclaw googlemeet setup --transport chrome-node --mode transcribe
openclaw googlemeet test-listen https://meet.google.com/abc-defg-hij --transport chrome-node --timeout-ms 30000
```

Środowisko testu dymnego na żywo:

- `OPENCLAW_LIVE_TEST=1` włącza chronione testy na żywo.
- `OPENCLAW_GOOGLE_MEET_LIVE_MEETING` wskazuje zachowany URL Meet, kod albo
  `spaces/{id}`.
- `OPENCLAW_GOOGLE_MEET_CLIENT_ID` lub `GOOGLE_MEET_CLIENT_ID` dostarcza identyfikator
  klienta OAuth.
- `OPENCLAW_GOOGLE_MEET_REFRESH_TOKEN` lub `GOOGLE_MEET_REFRESH_TOKEN` dostarcza
  token odświeżania.
- Opcjonalnie: `OPENCLAW_GOOGLE_MEET_CLIENT_SECRET`,
  `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN` i
  `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT` używają tych samych nazw awaryjnych
  bez prefiksu `OPENCLAW_`.

Podstawowy test dymny artefaktów/frekwencji na żywo wymaga
`https://www.googleapis.com/auth/meetings.space.readonly` i
`https://www.googleapis.com/auth/meetings.conference.media.readonly`. Wyszukiwanie
w kalendarzu wymaga `https://www.googleapis.com/auth/calendar.events.readonly`. Eksport
treści dokumentów Drive wymaga
`https://www.googleapis.com/auth/drive.meet.readonly`.

Utwórz świeży obszar Meet:

```bash
openclaw googlemeet create
```

Polecenie wypisuje nowy `meeting uri`, źródło i sesję dołączania. Z danymi logowania
OAuth używa oficjalnego Google Meet API. Bez danych logowania OAuth używa jako ścieżki
awaryjnej zalogowanego profilu przeglądarki przypiętego Chrome Node. Agenci mogą użyć
narzędzia `google_meet` z `action: "create"`, aby utworzyć spotkanie i dołączyć w jednym
kroku. Aby utworzyć tylko URL, przekaż `"join": false`.

Przykładowe wyjście JSON z awaryjnej ścieżki przeglądarkowej:

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

Jeśli awaryjna ścieżka przeglądarkowa natrafi na logowanie Google albo blokadę uprawnień
Meet, zanim zdoła utworzyć URL, metoda Gateway zwraca nieudaną odpowiedź, a narzędzie
`google_meet` zwraca strukturalne szczegóły zamiast zwykłego ciągu tekstowego:

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
`manualActionMessage` wraz z kontekstem Node/karty przeglądarki i przestać otwierać nowe
karty Meet, dopóki operator nie ukończy kroku w przeglądarce.

Przykładowe wyjście JSON z tworzenia przez API:

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

Utworzenie Meet domyślnie do niego dołącza. Transport Chrome lub Chrome-node nadal
wymaga zalogowanego profilu Google Chrome, aby dołączyć przez przeglądarkę. Jeśli
profil jest wylogowany, OpenClaw zgłasza `manualActionRequired: true` lub błąd
awaryjnego trybu przeglądarki i prosi operatora o ukończenie logowania Google przed
ponowną próbą.

Ustaw `preview.enrollmentAcknowledged: true` dopiero po potwierdzeniu, że Twój projekt
Cloud, podmiot OAuth i uczestnicy spotkania są zapisani do Google Workspace Developer
Preview Program dla interfejsów Meet media APIs.

## Konfiguracja

Wspólna ścieżka agenta Chrome wymaga tylko włączonego Plugin, BlackHole, SoX,
klucza dostawcy transkrypcji w czasie rzeczywistym oraz skonfigurowanego dostawcy
OpenClaw TTS. OpenAI jest domyślnym dostawcą transkrypcji; ustaw
`realtime.voiceProvider` na `"google"` i `realtime.model`, aby używać Google Gemini
Live w trybie `bidi` bez zmieniania domyślnego dostawcy transkrypcji trybu agenta:

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
# or
export GEMINI_API_KEY=...
```

Ustaw konfigurację Plugin pod `plugins.entries.google-meet.config`:

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
- `defaultMode: "agent"` (`"realtime"` jest akceptowane tylko jako starszy alias
  zgodności dla `"agent"`; nowe wywołania narzędzi powinny używać `"agent"`)
- `chromeNode.node`: opcjonalny identyfikator/nazwa/IP node dla `chrome-node`
- `chrome.audioBackend: "blackhole-2ch"`
- `chrome.guestName: "OpenClaw Agent"`: nazwa używana na ekranie gościa Meet po
  wylogowaniu
- `chrome.autoJoin: true`: podejmowana w najlepszym możliwym zakresie próba
  wypełnienia nazwy gościa i kliknięcia Dołącz teraz przez automatyzację
  przeglądarki OpenClaw na `chrome-node`
- `chrome.reuseExistingTab: true`: aktywuj istniejącą kartę Meet zamiast otwierać
  duplikaty
- `chrome.waitForInCallMs: 20000`: czekaj, aż karta Meet zgłosi stan połączenia,
  zanim zostanie uruchomione wprowadzenie z odpowiedzią głosową
- `chrome.audioFormat: "pcm16-24khz"`: format dźwięku pary poleceń. Używaj
  `"g711-ulaw-8khz"` tylko dla starszych/niestandardowych par poleceń, które nadal
  emitują dźwięk telefoniczny.
- `chrome.audioBufferBytes: 4096`: bufor przetwarzania SoX dla generowanych poleceń
  audio pary poleceń Chrome. To połowa domyślnego bufora SoX o rozmiarze 8192 bajtów,
  co zmniejsza domyślne opóźnienie potoku, pozostawiając możliwość zwiększenia go na
  obciążonych hostach. Wartości poniżej minimum SoX są ograniczane do 17 bajtów.
- `chrome.audioInputCommand`: polecenie SoX odczytujące z CoreAudio `BlackHole 2ch`
  i zapisujące audio w `chrome.audioFormat`
- `chrome.audioOutputCommand`: polecenie SoX odczytujące audio w `chrome.audioFormat`
  i zapisujące do CoreAudio `BlackHole 2ch`
- `chrome.bargeInInputCommand`: opcjonalne polecenie lokalnego mikrofonu, które
  zapisuje podpisane 16-bitowe mało endianowe mono PCM do wykrywania przerwania
  przez człowieka podczas aktywnego odtwarzania asystenta. Obecnie dotyczy to
  mostka pary poleceń `chrome` hostowanego przez Gateway.
- `chrome.bargeInRmsThreshold: 650`: poziom RMS uznawany za przerwanie przez
  człowieka w `chrome.bargeInInputCommand`
- `chrome.bargeInPeakThreshold: 2500`: poziom szczytowy uznawany za przerwanie przez
  człowieka w `chrome.bargeInInputCommand`
- `chrome.bargeInCooldownMs: 900`: minimalne opóźnienie między kolejnymi
  czyszczeniami przerwań przez człowieka
- `mode: "agent"`: domyślny tryb odpowiedzi głosowej. Mowa uczestników jest
  transkrybowana przez skonfigurowanego dostawcę transkrypcji w czasie rzeczywistym,
  wysyłana do skonfigurowanego agenta OpenClaw w sesji sub-agenta dla danego
  spotkania i odtwarzana głosowo przez normalne środowisko wykonawcze OpenClaw TTS.
- `mode: "bidi"`: awaryjny bezpośredni dwukierunkowy tryb modelu czasu rzeczywistego.
  Dostawca głosu w czasie rzeczywistym odpowiada bezpośrednio na mowę uczestników i
  może wywoływać `openclaw_agent_consult` dla głębszych odpowiedzi wspartych
  narzędziami.
- `mode: "transcribe"`: tryb tylko obserwacyjny bez mostka odpowiedzi głosowej.
- `realtime.provider: "openai"`: awaryjna zgodność używana, gdy poniższe pola
  dostawcy o określonym zakresie nie są ustawione.
- `realtime.transcriptionProvider: "openai"`: identyfikator dostawcy używany przez
  tryb `agent` do transkrypcji w czasie rzeczywistym.
- `realtime.voiceProvider`: identyfikator dostawcy używany przez tryb `bidi` do
  bezpośredniego głosu w czasie rzeczywistym. Ustaw go na `"google"`, aby używać
  Gemini Live, zachowując transkrypcję trybu agenta w OpenAI.
- `realtime.toolPolicy: "safe-read-only"`
- `realtime.instructions`: krótkie odpowiedzi mówione, z
  `openclaw_agent_consult` dla głębszych odpowiedzi
- `realtime.introMessage`: krótka mówiona kontrola gotowości po połączeniu mostka
  czasu rzeczywistego; ustaw ją na `""`, aby dołączyć po cichu
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
    provider: "openai",
    transcriptionProvider: "openai",
    voiceProvider: "google",
    model: "gemini-2.5-flash-native-audio-preview-12-2025",
    agentId: "jay",
    toolPolicy: "owner",
    introMessage: "Say exactly: I'm here.",
    providers: {
      google: {
        voice: "Kore",
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
          voiceId: "pMsXgVXv3BLzUgSXRplE",
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

Trwały głos Meet pochodzi z
`messages.tts.providers.elevenlabs.voiceId`. Odpowiedzi agenta mogą także używać
dyrektyw dla pojedynczej odpowiedzi `[[tts:voiceId=... model=eleven_v3]]`, gdy
nadpisania modelu TTS są włączone, ale konfiguracja jest deterministyczną wartością
domyślną dla spotkań. Po dołączeniu logi powinny pokazywać
`transcriptionProvider=elevenlabs`, a każda wypowiedziana odpowiedź powinna logować
`provider=elevenlabs model=eleven_v3 voice=<voiceId>`.

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

`voiceCall.enabled` domyślnie ma wartość `true`; przy transporcie Twilio deleguje
rzeczywiste połączenie PSTN, DTMF i powitanie wprowadzające do Plugin Voice Call.
Voice Call odtwarza sekwencję DTMF przed otwarciem strumienia multimediów w czasie
rzeczywistym, a następnie używa zapisanego tekstu wprowadzenia jako początkowego
powitania w czasie rzeczywistym. Jeśli `voice-call` nie jest włączony, Google Meet
nadal może zweryfikować i zapisać plan wybierania, ale nie może wykonać połączenia
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
`transport: "chrome-node"`, gdy Chrome działa na sparowanym node, takim jak maszyna
wirtualna Parallels. W obu przypadkach dostawcy modeli i `openclaw_agent_consult`
działają na hoście Gateway, więc poświadczenia modeli pozostają tam. Przy domyślnym
`mode: "agent"` dostawca transkrypcji w czasie rzeczywistym obsługuje słuchanie,
skonfigurowany agent OpenClaw tworzy odpowiedź, a zwykłe OpenClaw TTS wypowiada ją
w Meet. Użyj `mode: "bidi"`, gdy chcesz, aby model głosu w czasie rzeczywistym
odpowiadał bezpośrednio.
Surowe `mode: "realtime"` pozostaje akceptowane jako starszy alias zgodności dla
`mode: "agent"`, ale nie jest już reklamowane w schemacie narzędzia agenta.
Logi trybu agenta obejmują rozwiązanego dostawcę/model transkrypcji przy uruchomieniu
mostka oraz dostawcę TTS, model, głos, format wyjściowy i częstotliwość próbkowania po
każdej zsyntetyzowanej odpowiedzi.

Użyj `action: "status"`, aby wyświetlić aktywne sesje lub sprawdzić identyfikator
sesji. Użyj `action: "speak"` z `sessionId` i `message`, aby agent czasu rzeczywistego
natychmiast przemówił. Użyj `action: "test_speech"`, aby utworzyć lub ponownie użyć
sesji, wyzwolić znaną frazę i zwrócić kondycję `inCall`, gdy host Chrome może ją
zgłosić. `test_speech` zawsze wymusza `mode: "agent"` i kończy się niepowodzeniem,
jeśli zostanie poproszone o działanie w `mode: "transcribe"`, ponieważ sesje tylko
obserwacyjne celowo nie mogą emitować mowy. Wynik `speechOutputVerified` opiera się
na wzroście bajtów wyjścia audio w czasie rzeczywistym podczas tego wywołania
testowego, więc ponownie użyta sesja ze starszym audio nie liczy się jako świeże,
udane sprawdzenie mowy. Użyj `action: "leave"`, aby oznaczyć sesję jako zakończoną.

`status` zawiera kondycję Chrome, gdy jest dostępna:

- `inCall`: Chrome wydaje się być wewnątrz rozmowy Meet
- `micMuted`: najlepszy możliwy do ustalenia stan mikrofonu Meet
- `manualActionRequired` / `manualActionReason` / `manualActionMessage`: profil
  przeglądarki wymaga ręcznego logowania, dopuszczenia przez gospodarza Meet,
  uprawnień lub naprawy sterowania przeglądarką, zanim mowa będzie działać
- `speechReady` / `speechBlockedReason` / `speechBlockedMessage`: czy zarządzana mowa
  Chrome jest teraz dozwolona. `speechReady: false` oznacza, że OpenClaw nie wysłał
  frazy wprowadzającej/testowej do mostka audio.
- `providerConnected` / `realtimeReady`: stan mostka głosu w czasie rzeczywistym
- `lastInputAt` / `lastOutputAt`: ostatnie audio odebrane z mostka lub wysłane do niego
- `audioOutputRouted` / `audioOutputDeviceLabel`: czy wyjście multimediów karty Meet
  zostało aktywnie skierowane do urządzenia BlackHole używanego przez mostek
- `lastSuppressedInputAt` / `suppressedInputBytes`: wejście loopback ignorowane, gdy
  odtwarzanie asystenta jest aktywne

```json
{
  "action": "speak",
  "sessionId": "meet_...",
  "message": "Say exactly: I'm here and listening."
}
```

## Tryby agenta i Bidi

Tryb Chrome `agent` jest zoptymalizowany pod zachowanie „mój agent jest na spotkaniu”.
Dostawca transkrypcji w czasie rzeczywistym słyszy audio spotkania, końcowe
transkrypcje uczestników są przekierowywane przez skonfigurowanego agenta OpenClaw,
a odpowiedź jest wypowiadana przez normalne środowisko wykonawcze OpenClaw TTS. Ustaw
`mode: "bidi"`, gdy chcesz, aby model głosu w czasie rzeczywistym odpowiadał
bezpośrednio.
Bliskie końcowe fragmenty transkrypcji są scalane przed konsultacją, aby jedna
wypowiedziana tura nie tworzyła kilku nieaktualnych częściowych odpowiedzi. Wejście
w czasie rzeczywistym jest również wyciszane, gdy zakolejkowane audio asystenta nadal
jest odtwarzane,
a ostatnie echa transkrypcji podobne do asystenta są ignorowane przed konsultacją z
agentem, aby BlackHole loopback nie sprawiał, że agent odpowiada na własną mowę.

| Tryb    | Kto decyduje o odpowiedzi        | Ścieżka wyjścia mowy                   | Kiedy używać                                           |
| ------- | -------------------------------- | -------------------------------------- | ----------------------------------------------------- |
| `agent` | Skonfigurowany agent OpenClaw    | Normalne środowisko wykonawcze OpenClaw TTS | Gdy chcesz zachowania „mój agent jest na spotkaniu”   |
| `bidi`  | Model głosu w czasie rzeczywistym | Odpowiedź audio dostawcy głosu w czasie rzeczywistym | Gdy chcesz pętli rozmowy głosowej o najniższym opóźnieniu |

W trybie `bidi`, gdy model czasu rzeczywistego potrzebuje głębszego rozumowania,
aktualnych informacji lub normalnych narzędzi OpenClaw, może wywołać
`openclaw_agent_consult`.

Narzędzie consult uruchamia zwykłego agenta OpenClaw w tle, z kontekstem ostatniej transkrypcji spotkania, i zwraca zwięzłą odpowiedź do wypowiedzenia. W trybie `agent` OpenClaw wysyła tę odpowiedź bezpośrednio do środowiska uruchomieniowego TTS; w trybie `bidi` model głosowy czasu rzeczywistego może wypowiedzieć wynik consult z powrotem na spotkaniu. Używa tego samego współdzielonego mechanizmu consult co Voice Call.

Domyślnie consult działa na agencie `main`. Ustaw `realtime.agentId`, gdy ścieżka Meet powinna konsultować się z dedykowanym obszarem roboczym agenta OpenClaw, domyślnymi ustawieniami modelu, zasadami narzędzi, pamięcią i historią sesji.

Consult w trybie agenta używa klucza sesji dla spotkania `agent:<id>:subagent:google-meet:<session>`, dzięki czemu pytania uzupełniające zachowują kontekst spotkania, jednocześnie dziedzicząc standardowe zasady agenta ze skonfigurowanego agenta.

`realtime.toolPolicy` kontroluje uruchomienie consult:

- `safe-read-only`: udostępnia narzędzie consult i ogranicza zwykłego agenta do `read`, `web_search`, `web_fetch`, `x_search`, `memory_search` oraz `memory_get`.
- `owner`: udostępnia narzędzie consult i pozwala zwykłemu agentowi używać standardowych zasad narzędzi agenta.
- `none`: nie udostępnia narzędzia consult modelowi głosowemu czasu rzeczywistego.

Klucz sesji consult jest ograniczony do danej sesji Meet, więc kolejne wywołania consult mogą ponownie używać wcześniejszego kontekstu consult podczas tego samego spotkania.

Aby wymusić mówiony test gotowości po pełnym dołączeniu Chrome do rozmowy:

```bash
openclaw googlemeet speak meet_... "Say exactly: I'm here and listening."
```

Pełny test smoke dołączenia i wypowiedzi:

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij \
  --transport chrome-node \
  --message "Say exactly: I'm here and listening."
```

## Lista kontrolna testu live

Użyj tej sekwencji przed przekazaniem spotkania agentowi bez nadzoru:

```bash
openclaw googlemeet setup
openclaw nodes status
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij \
  --transport chrome-node \
  --message "Say exactly: Google Meet speech test complete."
```

Oczekiwany stan Chrome-node:

- `googlemeet setup` jest w całości zielony.
- `googlemeet setup` zawiera `chrome-node-connected`, gdy Chrome-node jest domyślnym transportem albo Node jest przypięty.
- `nodes status` pokazuje, że wybrany Node jest połączony.
- Wybrany Node ogłasza zarówno `googlemeet.chrome`, jak i `browser.proxy`.
- Karta Meet dołącza do rozmowy, a `test-speech` zwraca stan Chrome z `inCall: true`.

Dla zdalnego hosta Chrome, takiego jak maszyna wirtualna Parallels macOS, to najkrótszy bezpieczny test po aktualizacji Gateway lub maszyny wirtualnej:

```bash
openclaw googlemeet setup
openclaw nodes status --connected
openclaw nodes invoke \
  --node parallels-macos \
  --command googlemeet.chrome \
  --params '{"action":"setup"}'
```

To dowodzi, że Plugin Gateway jest załadowany, Node maszyny wirtualnej jest połączony z bieżącym tokenem, a most audio Meet jest dostępny, zanim agent otworzy prawdziwą kartę spotkania.

Dla testu smoke Twilio użyj spotkania, które udostępnia szczegóły telefonicznego wdzwaniania:

```bash
openclaw googlemeet setup
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --pin 123456
```

Oczekiwany stan Twilio:

- `googlemeet setup` zawiera zielone kontrole `twilio-voice-call-plugin`, `twilio-voice-call-credentials` oraz `twilio-voice-call-webhook`.
- `voicecall` jest dostępne w CLI po ponownym załadowaniu Gateway.
- Zwrócona sesja ma `transport: "twilio"` oraz `twilio.voiceCallId`.
- `openclaw logs --follow` pokazuje TwiML DTMF obsłużony przed TwiML czasu rzeczywistego, a następnie most czasu rzeczywistego z początkowym powitaniem w kolejce.
- `googlemeet leave <sessionId>` rozłącza delegowane połączenie głosowe.

## Rozwiązywanie problemów

### Agent nie widzi narzędzia Google Meet

Potwierdź, że Plugin jest włączony w konfiguracji Gateway, i ponownie załaduj Gateway:

```bash
openclaw plugins list | grep google-meet
openclaw googlemeet setup
```

Jeśli właśnie edytowano `plugins.entries.google-meet`, zrestartuj lub ponownie załaduj Gateway. Działający agent widzi tylko narzędzia Plugin zarejestrowane przez bieżący proces Gateway.

Na hostach Gateway innych niż macOS narzędzie `google_meet` widoczne dla agenta pozostaje dostępne, ale lokalne akcje mówienia zwrotnego Chrome są blokowane, zanim trafią do mostu audio. Lokalny dźwięk mówienia zwrotnego Chrome obecnie zależy od `BlackHole 2ch` w macOS, więc agenci Linux powinni używać `mode: "transcribe"`, telefonicznego wdzwaniania Twilio albo hosta `chrome-node` z macOS zamiast domyślnej ścieżki lokalnego agenta Chrome.

### Brak połączonego Node obsługującego Google Meet

Na hoście Node uruchom:

```bash
openclaw plugins enable google-meet
openclaw plugins enable browser
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node run --host <gateway-lan-ip> --port 18789 --display-name parallels-macos
```

Na hoście Gateway zatwierdź Node i zweryfikuj polecenia:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw nodes status
```

Node musi być połączony i wymieniać `googlemeet.chrome` oraz `browser.proxy`. Konfiguracja Gateway musi zezwalać na te polecenia Node:

```json5
{
  gateway: {
    nodes: {
      allowCommands: ["browser.proxy", "googlemeet.chrome"],
    },
  },
}
```

Jeśli `googlemeet setup` nie przechodzi `chrome-node-connected` albo dziennik Gateway zgłasza `gateway token mismatch`, zainstaluj ponownie albo uruchom ponownie Node z bieżącym tokenem Gateway. Dla Gateway w sieci LAN zwykle oznacza to:

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node install \
  --host <gateway-lan-ip> \
  --port 18789 \
  --display-name parallels-macos \
  --force
```

Następnie ponownie załaduj usługę Node i uruchom ponownie:

```bash
openclaw googlemeet setup
openclaw nodes status --connected
```

### Przeglądarka się otwiera, ale agent nie może dołączyć

Uruchom `googlemeet test-listen` dla dołączeń tylko obserwacyjnych albo `googlemeet test-speech` dla dołączeń czasu rzeczywistego, a następnie sprawdź zwrócony stan Chrome. Jeśli którykolwiek test zgłasza `manualActionRequired: true`, pokaż operatorowi `manualActionMessage` i przestań ponawiać próby, dopóki akcja w przeglądarce nie zostanie zakończona.

Typowe akcje ręczne:

- Zalogowanie się do profilu Chrome.
- Dopuszczenie gościa z konta gospodarza Meet.
- Przyznanie uprawnień mikrofonu/kamery Chrome, gdy pojawi się natywny monit uprawnień Chrome.
- Zamknięcie albo naprawa zablokowanego okna dialogowego uprawnień Meet.

Nie zgłaszaj „brak logowania” tylko dlatego, że Meet pokazuje „Do you want people to hear you in the meeting?” To ekran pośredni wyboru audio Meet; OpenClaw klika **Use microphone** za pomocą automatyzacji przeglądarki, gdy jest dostępna, i nadal czeka na rzeczywisty stan spotkania. Dla awaryjnego tworzenia tylko przez przeglądarkę OpenClaw może kliknąć **Continue without microphone**, ponieważ utworzenie URL-a nie wymaga ścieżki audio czasu rzeczywistego.

### Tworzenie spotkania kończy się niepowodzeniem

`googlemeet create` najpierw używa punktu końcowego Google Meet API `spaces.create`, gdy skonfigurowano poświadczenia OAuth. Bez poświadczeń OAuth przełącza się na przypiętą przeglądarkę Chrome Node. Potwierdź:

- Dla tworzenia przez API: skonfigurowano `oauth.clientId` i `oauth.refreshToken` albo obecne są pasujące zmienne środowiskowe `OPENCLAW_GOOGLE_MEET_*`.
- Dla tworzenia przez API: token odświeżania został utworzony po dodaniu obsługi tworzenia. Starszym tokenom może brakować zakresu `meetings.space.created`; uruchom ponownie `openclaw googlemeet auth login --json` i zaktualizuj konfigurację Plugin.
- Dla awaryjnego trybu przeglądarki: `defaultTransport: "chrome-node"` oraz `chromeNode.node` wskazują połączony Node z `browser.proxy` i `googlemeet.chrome`.
- Dla awaryjnego trybu przeglądarki: profil Chrome OpenClaw na tym Node jest zalogowany do Google i może otworzyć `https://meet.google.com/new`.
- Dla awaryjnego trybu przeglądarki: ponowne próby używają istniejącej karty `https://meet.google.com/new` albo karty monitu konta Google przed otwarciem nowej karty. Jeśli agent przekroczy limit czasu, ponów wywołanie narzędzia zamiast ręcznie otwierać kolejną kartę Meet.
- Dla awaryjnego trybu przeglądarki: jeśli narzędzie zwróci `manualActionRequired: true`, użyj zwróconych `browser.nodeId`, `browser.targetId`, `browserUrl` oraz `manualActionMessage`, aby pokierować operatorem. Nie ponawiaj prób w pętli, dopóki ta akcja nie zostanie zakończona.
- Dla awaryjnego trybu przeglądarki: jeśli Meet pokazuje „Do you want people to hear you in the meeting?”, zostaw kartę otwartą. OpenClaw powinien kliknąć **Use microphone** albo, dla awaryjnego tworzenia tylko przez przeglądarkę, **Continue without microphone** przez automatyzację przeglądarki i nadal czekać na wygenerowany URL Meet. Jeśli nie może, błąd powinien wspominać `meet-audio-choice-required`, a nie `google-login-required`.

### Agent dołącza, ale nie mówi

Sprawdź ścieżkę czasu rzeczywistego:

```bash
openclaw googlemeet setup
openclaw googlemeet doctor
```

Użyj `mode: "agent"` dla standardowej ścieżki STT -> agent OpenClaw -> mówienie zwrotne TTS albo `mode: "bidi"` dla bezpośredniego awaryjnego trybu głosu czasu rzeczywistego. `mode: "transcribe"` celowo nie uruchamia mostu mówienia zwrotnego. Do debugowania tylko obserwacyjnego uruchom `openclaw googlemeet status --json <session-id>` po wypowiedziach uczestników i sprawdź `captioning`, `transcriptLines` oraz `lastCaptionText`. Jeśli `inCall` ma wartość true, ale `transcriptLines` pozostaje `0`, napisy Meet mogą być wyłączone, nikt nie mówił od zainstalowania obserwatora, interfejs Meet się zmienił albo napisy na żywo są niedostępne dla języka/konta spotkania.

`googlemeet test-speech` zawsze sprawdza ścieżkę czasu rzeczywistego i raportuje, czy dla tego wywołania zaobserwowano bajty wyjściowe mostu. Jeśli `speechOutputVerified` ma wartość false, a `speechOutputTimedOut` ma wartość true, dostawca czasu rzeczywistego mógł zaakceptować wypowiedź, ale OpenClaw nie zobaczył nowych bajtów wyjściowych docierających do mostu audio Chrome.

Zweryfikuj także:

- Klucz dostawcy czasu rzeczywistego jest dostępny na hoście Gateway, na przykład `OPENAI_API_KEY` albo `GEMINI_API_KEY`.
- `BlackHole 2ch` jest widoczny na hoście Chrome.
- `sox` istnieje na hoście Chrome.
- Mikrofon i głośnik Meet są kierowane przez wirtualną ścieżkę audio używaną przez OpenClaw. `doctor` powinien pokazać `meet output routed: yes` dla lokalnych dołączeń Chrome czasu rzeczywistego.

`googlemeet doctor [session-id]` wypisuje sesję, Node, stan w rozmowie, powód akcji ręcznej, połączenie dostawcy czasu rzeczywistego, `realtimeReady`, aktywność wejścia/wyjścia audio, ostatnie znaczniki czasu audio, liczniki bajtów oraz URL przeglądarki. Użyj `googlemeet status [session-id] --json`, gdy potrzebujesz surowego JSON. Użyj `googlemeet doctor --oauth`, gdy potrzebujesz zweryfikować odświeżanie OAuth Google Meet bez ujawniania tokenów; dodaj `--meeting` albo `--create-space`, gdy potrzebujesz również dowodu Google Meet API.

Jeśli agent przekroczył limit czasu i widzisz już otwartą kartę Meet, sprawdź tę kartę bez otwierania kolejnej:

```bash
openclaw googlemeet recover-tab
openclaw googlemeet recover-tab https://meet.google.com/abc-defg-hij
```

Równoważną akcją narzędzia jest `recover_current_tab`. Ustawia fokus na istniejącej karcie Meet i sprawdza ją dla wybranego transportu. Z `chrome` używa lokalnego sterowania przeglądarką przez Gateway; z `chrome-node` używa skonfigurowanego Chrome Node. Nie otwiera nowej karty ani nie tworzy nowej sesji; zgłasza bieżącą przeszkodę, taką jak logowanie, dopuszczenie, uprawnienia albo stan wyboru audio. Polecenie CLI komunikuje się ze skonfigurowanym Gateway, więc Gateway musi działać; `chrome-node` wymaga również połączenia Chrome Node.

### Kontrole konfiguracji Twilio kończą się niepowodzeniem

`twilio-voice-call-plugin` kończy się niepowodzeniem, gdy `voice-call` nie jest dozwolony albo nie jest włączony. Dodaj go do `plugins.allow`, włącz `plugins.entries.voice-call` i ponownie załaduj Gateway.

`twilio-voice-call-credentials` kończy się niepowodzeniem, gdy backend Twilio nie ma identyfikatora SID konta, tokenu uwierzytelniania albo numeru wywołującego. Ustaw je na hoście Gateway:

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
```

`twilio-voice-call-webhook` kończy się niepowodzeniem, gdy `voice-call` nie ma publicznej ekspozycji Webhook albo gdy `publicUrl` wskazuje na local loopback lub przestrzeń sieci prywatnej. Ustaw `plugins.entries.voice-call.config.publicUrl` na publiczny URL dostawcy albo skonfiguruj tunel/ekspozycję Tailscale dla `voice-call`.

Adresy URL local loopback i prywatne nie są prawidłowe dla callbacków operatora. Nie używaj `localhost`, `127.0.0.1`, `0.0.0.0`, `10.x`, `172.16.x`-`172.31.x`, `192.168.x`, `169.254.x`, `fc00::/7` ani `fd00::/8` jako `publicUrl`.

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

Do lokalnego programowania użyj tunelu lub ekspozycji przez Tailscale zamiast prywatnego
adresu URL hosta:

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

`voicecall smoke` domyślnie sprawdza tylko gotowość. Aby wykonać próbne uruchomienie dla konkretnego numeru:

```bash
openclaw voicecall smoke --to "+15555550123"
```

Dodaj `--yes` tylko wtedy, gdy celowo chcesz wykonać rzeczywiste wychodzące połączenie
z powiadomieniem:

```bash
openclaw voicecall smoke --to "+15555550123" --yes
```

### Połączenie Twilio się rozpoczyna, ale nigdy nie dołącza do spotkania

Upewnij się, że zdarzenie Meet udostępnia dane telefonicznego dołączenia. Podaj dokładny numer
telefonicznego dołączenia i PIN albo niestandardową sekwencję DTMF:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --dtmf-sequence ww123456#
```

Użyj początkowego `w` lub przecinków w `--dtmf-sequence`, jeśli dostawca potrzebuje pauzy
przed wpisaniem PIN-u.

Jeśli połączenie telefoniczne zostało utworzone, ale lista uczestników Meet nigdy nie pokazuje
uczestnika telefonicznego:

- Uruchom `openclaw googlemeet doctor <session-id>`, aby potwierdzić delegowany identyfikator
  połączenia Twilio, czy DTMF zostało zakolejkowane oraz czy zażądano powitania wstępnego.
- Uruchom `openclaw voicecall status --call-id <id>` i potwierdź, że połączenie nadal jest
  aktywne.
- Uruchom `openclaw voicecall tail` i sprawdź, czy webhooki Twilio docierają do
  Gateway.
- Uruchom `openclaw logs --follow` i poszukaj sekwencji Twilio Meet: Google
  Meet deleguje dołączenie, Voice Call zapisuje i serwuje TwiML DTMF przed połączeniem,
  Voice Call serwuje TwiML czasu rzeczywistego dla połączenia Twilio, a następnie Google Meet żąda
  mowy wstępnej przez `voicecall.speak`.
- Uruchom ponownie `openclaw googlemeet setup --transport twilio`; zielony wynik konfiguracji jest
  wymagany, ale nie dowodzi, że sekwencja PIN-u spotkania jest poprawna.
- Upewnij się, że numer telefonicznego dołączenia należy do tego samego zaproszenia Meet i regionu co
  PIN.
- Zwiększ `voiceCall.dtmfDelayMs` z domyślnych 12 sekund, jeśli Meet odpowiada
  powoli albo transkrypt połączenia nadal pokazuje monit o PIN po wysłaniu
  DTMF przed połączeniem.
- Jeśli uczestnik dołącza, ale nie słyszysz powitania, sprawdź
  `openclaw logs --follow` pod kątem żądania `voicecall.speak` po DTMF oraz
  odtwarzania TTS przez strumień multimediów albo awaryjnego Twilio `<Say>`. Jeśli transkrypt połączenia
  nadal zawiera „enter the meeting PIN”, telefoniczna część połączenia nie dołączyła jeszcze
  do pokoju Meet, więc uczestnicy spotkania nie usłyszą mowy.

Jeśli webhooki nie docierają, najpierw debuguj Plugin Voice Call: dostawca musi
osiągnąć `plugins.entries.voice-call.config.publicUrl` albo skonfigurowany tunel.
Zobacz [Rozwiązywanie problemów z połączeniami głosowymi](/pl/plugins/voice-call#troubleshooting).

## Uwagi

Oficjalne API mediów Google Meet jest ukierunkowane na odbiór, więc mówienie do połączenia
Meet nadal wymaga ścieżki uczestnika. Ten Plugin zachowuje widoczność tej granicy:
Chrome obsługuje uczestnictwo przez przeglądarkę i lokalne routowanie audio; Twilio obsługuje
uczestnictwo przez telefoniczne dołączenie.

Tryby odpowiedzi głosowej Chrome wymagają `BlackHole 2ch` oraz jednego z poniższych:

- `chrome.audioInputCommand` plus `chrome.audioOutputCommand`: OpenClaw obsługuje
  mostek i przesyła audio w `chrome.audioFormat` między tymi poleceniami a
  wybranym dostawcą. Tryb agenta używa transkrypcji w czasie rzeczywistym oraz zwykłego TTS;
  tryb dwukierunkowy używa dostawcy głosu czasu rzeczywistego. Domyślna ścieżka Chrome to 24 kHz
  PCM16 z `chrome.audioBufferBytes: 4096`; 8 kHz G.711 mu-law pozostaje
  dostępne dla starszych par poleceń.
- `chrome.audioBridgeCommand`: zewnętrzne polecenie mostka obsługuje całą lokalną
  ścieżkę audio i musi zakończyć działanie po uruchomieniu lub zweryfikowaniu swojego demona. Jest to
  prawidłowe tylko dla `bidi`, ponieważ tryb `agent` wymaga bezpośredniego dostępu do pary poleceń dla TTS.

Gdy agent wywołuje narzędzie `google_meet` w trybie agenta, sesja konsultanta spotkania
rozwidla bieżący transkrypt wywołującego przed odpowiadaniem na mowę uczestników.
Sesja Meet nadal pozostaje oddzielna (`agent:<agentId>:subagent:google-meet:<sessionId>`),
więc dalsze działania dotyczące spotkania nie modyfikują bezpośrednio transkryptu wywołującego.

Aby uzyskać czyste audio dwukierunkowe, routuj wyjście Meet i mikrofon Meet przez oddzielne
urządzenia wirtualne albo graf urządzeń wirtualnych w stylu Loopback. Jedno współdzielone
urządzenie BlackHole może odbijać innych uczestników z powrotem do połączenia.

W przypadku mostka Chrome opartego na parze poleceń `chrome.bargeInInputCommand` może nasłuchiwać na
oddzielnym lokalnym mikrofonie i czyścić odtwarzanie asystenta, gdy człowiek zaczyna
mówić. Dzięki temu mowa człowieka ma pierwszeństwo przed wyjściem asystenta nawet wtedy, gdy współdzielone
wejście local loopback BlackHole jest tymczasowo wyciszone podczas odtwarzania przez asystenta.
Podobnie jak `chrome.audioInputCommand` i `chrome.audioOutputCommand`, jest to
lokalne polecenie skonfigurowane przez operatora. Użyj jawnej zaufanej ścieżki polecenia lub
listy argumentów i nie kieruj jej na skrypty z niezaufanych lokalizacji.

`googlemeet speak` uruchamia aktywny mostek audio odpowiedzi głosowej dla sesji Chrome.
`googlemeet leave` zatrzymuje ten mostek. W przypadku sesji Twilio delegowanych
przez Plugin Voice Call, `leave` także rozłącza bazowe połączenie głosowe.
Użyj `googlemeet end-active-conference`, gdy chcesz również zamknąć aktywną
konferencję Google Meet dla przestrzeni zarządzanej przez API.

## Powiązane

- [Plugin połączeń głosowych](/pl/plugins/voice-call)
- [Tryb rozmowy](/pl/nodes/talk)
- [Tworzenie pluginów](/pl/plugins/building-plugins)
