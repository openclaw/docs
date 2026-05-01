---
read_when:
    - Chcesz, aby agent OpenClaw dołączył do rozmowy w Google Meet
    - Chcesz, aby agent OpenClaw utworzył nowe połączenie Google Meet
    - Konfigurujesz Chrome, węzeł Chrome lub Twilio jako transport Google Meet
summary: 'Plugin Google Meet: dołączanie do jawnych adresów URL Meet przez Chrome lub Twilio z domyślnymi ustawieniami głosu w czasie rzeczywistym'
title: Plugin Google Meet
x-i18n:
    generated_at: "2026-05-01T10:01:34Z"
    model: gpt-5.5
    provider: openai
    source_hash: a9d0d195fc709e487ef1bf5603fdb32fade1b6a0a13aa9bed5110979490f92ff
    source_path: plugins/google-meet.md
    workflow: 16
---

Obsługa uczestników Google Meet w OpenClaw — Plugin jest celowo jawny:

- Dołącza tylko do jawnego URL-a `https://meet.google.com/...`.
- Może utworzyć nową przestrzeń Meet przez Google Meet API, a następnie dołączyć do
  zwróconego URL-a.
- `realtime` voice to tryb domyślny.
- Realtime voice może wywołać pełnego agenta OpenClaw, gdy potrzebne jest głębsze
  rozumowanie lub narzędzia.
- Agenci wybierają zachowanie dołączania za pomocą `mode`: użyj `realtime` do
  słuchania/odpowiadania na żywo albo `transcribe`, aby dołączyć/kontrolować przeglądarkę bez
  mostka realtime voice.
- Uwierzytelnianie zaczyna się od osobistego Google OAuth albo już zalogowanego profilu Chrome.
- Nie ma automatycznego ogłoszenia zgody.
- Domyślny backend audio Chrome to `BlackHole 2ch`.
- Chrome może działać lokalnie albo na sparowanym hoście Node.
- Twilio akceptuje numer dial-in oraz opcjonalny PIN lub sekwencję DTMF.
- Polecenie CLI to `googlemeet`; `meet` jest zarezerwowane dla szerszych przepływów pracy agenta
  związanych z telekonferencjami.

## Szybki start

Zainstaluj lokalne zależności audio i skonfiguruj backendowego dostawcę realtime voice.
OpenAI jest domyślne; Google Gemini Live również działa z
`realtime.provider: "google"`:

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
# or
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

Wynik konfiguracji ma być czytelny dla agenta i świadomy trybu. Raportuje profil Chrome,
przypięcie Node oraz, dla dołączeń Chrome w realtime, mostek audio BlackHole/SoX
i opóźnione kontrole wprowadzenia realtime. Dla dołączeń tylko obserwacyjnych sprawdź ten sam
transport za pomocą `--mode transcribe`; ten tryb pomija wymagania wstępne audio realtime,
ponieważ nie słucha przez mostek ani przez niego nie mówi:

```bash
openclaw googlemeet setup --transport chrome-node --mode transcribe
```

Gdy delegowanie Twilio jest skonfigurowane, konfiguracja raportuje również, czy Plugin
`voice-call`, dane uwierzytelniające Twilio i publiczna ekspozycja Webhook są gotowe.
Traktuj każdy test `ok: false` jako blokujący dla sprawdzanego transportu i trybu,
zanim poprosisz agenta o dołączenie. Użyj `openclaw googlemeet setup --json` dla
skryptów lub wyników czytelnych maszynowo. Użyj `--transport chrome`,
`--transport chrome-node` albo `--transport twilio`, aby wstępnie sprawdzić konkretny
transport, zanim agent go spróbuje.

Dla Twilio zawsze wstępnie sprawdzaj transport jawnie, gdy domyślnym transportem
jest Chrome:

```bash
openclaw googlemeet setup --transport twilio
```

To wykrywa brakujące połączenie `voice-call`, dane uwierzytelniające Twilio lub nieosiągalną
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

Utwórz nowe spotkanie i dołącz do niego:

```bash
openclaw googlemeet create --transport chrome-node --mode realtime
```

Utwórz tylko URL bez dołączania:

```bash
openclaw googlemeet create --no-join
```

`googlemeet create` ma dwie ścieżki:

- Tworzenie przez API: używane, gdy skonfigurowano dane uwierzytelniające Google Meet OAuth. To
  najbardziej deterministyczna ścieżka i nie zależy od stanu interfejsu przeglądarki.
- Rezerwowa ścieżka przeglądarkowa: używana, gdy brakuje danych uwierzytelniających OAuth. OpenClaw używa
  przypiętego Node Chrome, otwiera `https://meet.google.com/new`, czeka, aż Google
  przekieruje do prawdziwego URL-a z kodem spotkania, a następnie zwraca ten URL. Ta ścieżka wymaga,
  aby profil Chrome OpenClaw na Node był już zalogowany w Google.
  Automatyzacja przeglądarki obsługuje własny monit Meet pierwszego uruchomienia o mikrofon; ten monit
  nie jest traktowany jako błąd logowania Google.
  Przepływy dołączania i tworzenia próbują również ponownie użyć istniejącej karty Meet przed otwarciem
  nowej. Dopasowanie ignoruje nieszkodliwe ciągi zapytania URL, takie jak `authuser`, więc
  ponowna próba agenta powinna przenieść fokus na już otwarte spotkanie zamiast tworzyć drugą
  kartę Chrome.

Wynik polecenia/narzędzia zawiera pole `source` (`api` albo `browser`), aby agenci
mogli wyjaśnić, której ścieżki użyto. `create` domyślnie dołącza do nowego spotkania i
zwraca `joined: true` oraz sesję dołączenia. Aby tylko wygenerować URL, użyj
`create --no-join` w CLI albo przekaż `"join": false` do narzędzia.

Albo powiedz agentowi: „Utwórz Google Meet, dołącz do niego z realtime voice i wyślij
mi link”. Agent powinien wywołać `google_meet` z `action: "create"`, a następnie
udostępnić zwrócone `meetingUri`.

```json
{
  "action": "create",
  "transport": "chrome-node",
  "mode": "realtime"
}
```

Dla dołączenia tylko obserwacyjnego/kontroli przeglądarki ustaw `"mode": "transcribe"`. To
nie uruchamia dwukierunkowego mostka modelu realtime, nie wymaga BlackHole ani SoX
i nie będzie odpowiadać głosowo na spotkaniu. Dołączenia Chrome w tym trybie unikają również
przyznania uprawnień OpenClaw do mikrofonu/kamery i omijają ścieżkę Meet **Użyj
mikrofonu**. Jeśli Meet pokaże ekran wyboru audio, automatyzacja próbuje
ścieżki bez mikrofonu, a w przeciwnym razie zgłasza ręczne działanie zamiast otwierania
lokalnego mikrofonu.

Podczas sesji realtime status `google_meet` obejmuje kondycję przeglądarki i mostka audio,
taką jak `inCall`, `manualActionRequired`, `providerConnected`,
`realtimeReady`, `audioInputActive`, `audioOutputActive`, ostatnie znaczniki czasu wejścia/wyjścia,
liczniki bajtów i stan zamknięcia mostka. Jeśli pojawi się bezpieczny monit strony Meet,
automatyzacja przeglądarki obsługuje go, gdy może. Logowanie, dopuszczenie przez gospodarza oraz
monity uprawnień przeglądarki/systemu operacyjnego są zgłaszane jako ręczne działanie z powodem i
komunikatem, który agent ma przekazać. Zarządzane sesje Chrome emitują wprowadzenie lub
frazę testową dopiero po tym, jak kondycja przeglądarki zgłosi `inCall: true`; w przeciwnym razie status zgłasza
`speechReady: false`, a próba mowy jest blokowana zamiast udawać, że
agent odezwał się na spotkaniu.

Lokalny Chrome dołącza przez zalogowany profil przeglądarki OpenClaw. Tryb czasu rzeczywistego
wymaga `BlackHole 2ch` dla ścieżki mikrofonu/głośnika używanej przez OpenClaw. Aby uzyskać
czysty dźwięk dwukierunkowy, użyj oddzielnych urządzeń wirtualnych albo grafu w stylu Loopback;
pojedyncze urządzenie BlackHole wystarczy do pierwszego testu smoke, ale może powodować echo.

### Lokalny Gateway + Parallels Chrome

**Nie** potrzebujesz pełnego OpenClaw Gateway ani klucza API modelu wewnątrz maszyny wirtualnej macOS
tylko po to, aby maszyna wirtualna była właścicielem Chrome. Uruchom Gateway i agenta lokalnie, a następnie uruchom
host node w maszynie wirtualnej. Włącz raz dołączony Plugin w maszynie wirtualnej, aby node
rozgłaszał polecenie Chrome:

Co działa gdzie:

- Host Gateway: OpenClaw Gateway, obszar roboczy agenta, klucze modelu/API, dostawca czasu rzeczywistego
  oraz konfiguracja Plugin Google Meet.
- Maszyna wirtualna Parallels macOS: OpenClaw CLI/host node, Google Chrome, SoX, BlackHole 2ch
  oraz profil Chrome zalogowany do Google.
- Niepotrzebne w maszynie wirtualnej: usługa Gateway, konfiguracja agenta, klucz OpenAI/GPT ani konfiguracja
  dostawcy modelu.

Zainstaluj zależności maszyny wirtualnej:

```bash
brew install blackhole-2ch sox
```

Uruchom ponownie maszynę wirtualną po instalacji BlackHole, aby macOS udostępnił `BlackHole 2ch`:

```bash
sudo reboot
```

Po ponownym uruchomieniu sprawdź, czy maszyna wirtualna widzi urządzenie audio i polecenia SoX:

```bash
system_profiler SPAudioDataType | grep -i BlackHole
command -v sox
```

Zainstaluj lub zaktualizuj OpenClaw w maszynie wirtualnej, a następnie włącz tam dołączony Plugin:

```bash
openclaw plugins enable google-meet
```

Uruchom host node w maszynie wirtualnej:

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name parallels-macos
```

Jeśli `<gateway-host>` jest adresem IP w sieci LAN i nie używasz TLS, node odrzuci
zwykły tekstowy WebSocket, chyba że jawnie zgodzisz się na użycie tej zaufanej sieci prywatnej:

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

`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` jest środowiskiem procesu, a nie ustawieniem
`openclaw.json`. `openclaw node install` zapisuje je w środowisku LaunchAgent,
gdy jest obecne w poleceniu instalacji.

Zatwierdź node z hosta Gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Potwierdź, że Gateway widzi node i że rozgłasza zarówno `googlemeet.chrome`,
jak i zdolność przeglądarki/`browser.proxy`:

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

albo poproś agenta o użycie narzędzia `google_meet` z `transport: "chrome-node"`.

Dla testu smoke jednym poleceniem, który tworzy albo ponownie używa sesji, wypowiada znaną
frazę i wypisuje stan sesji:

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij
```

Podczas dołączania w czasie rzeczywistym automatyzacja przeglądarki OpenClaw wypełnia nazwę gościa, klika
Dołącz/Poproś o dołączenie i akceptuje pierwszy wybór Meet „Użyj mikrofonu”, gdy ten
komunikat się pojawi. Podczas dołączania tylko do obserwacji albo tworzenia spotkania tylko w przeglądarce
przechodzi dalej przez ten sam komunikat bez mikrofonu, gdy taka opcja jest dostępna.
Jeśli profil przeglądarki nie jest zalogowany, Meet czeka na dopuszczenie przez gospodarza,
Chrome potrzebuje uprawnienia do mikrofonu/kamery dla dołączenia w czasie rzeczywistym albo Meet utknął
na komunikacie, którego automatyzacja nie mogła rozwiązać, wynik join/test-speech zgłasza
`manualActionRequired: true` z `manualActionReason` i
`manualActionMessage`. Agenci powinni przestać ponawiać próbę dołączenia, zgłosić dokładnie tę
wiadomość oraz bieżące `browserUrl`/`browserTitle`, a następnie ponowić próbę dopiero po zakończeniu
ręcznej akcji w przeglądarce.

Jeśli `chromeNode.node` zostanie pominięte, OpenClaw wybiera automatycznie tylko wtedy, gdy dokładnie jeden
połączony node rozgłasza zarówno `googlemeet.chrome`, jak i sterowanie przeglądarką. Jeśli
podłączonych jest kilka zdolnych node, ustaw `chromeNode.node` na identyfikator node,
nazwę wyświetlaną albo zdalny adres IP.

Typowe kontrole awarii:

- `Configured Google Meet node ... is not usable: offline`: przypięty node jest
  znany Gateway, ale niedostępny. Agenci powinni traktować ten node jako stan
  diagnostyczny, a nie jako użyteczny host Chrome, i zgłaszać blokadę
  konfiguracji zamiast przechodzić awaryjnie na inny transport, chyba że
  użytkownik o to poprosił.
- `No connected Google Meet-capable node`: uruchom `openclaw node run` w maszynie
  wirtualnej, zatwierdź parowanie i upewnij się, że w maszynie wirtualnej
  uruchomiono `openclaw plugins enable google-meet` oraz
  `openclaw plugins enable browser`. Potwierdź też, że host Gateway zezwala na
  oba polecenia node za pomocą
  `gateway.nodes.allowCommands: ["googlemeet.chrome", "browser.proxy"]`.
- `BlackHole 2ch audio device not found`: zainstaluj `blackhole-2ch` na
  sprawdzanym hoście i uruchom go ponownie przed użyciem lokalnego dźwięku
  Chrome.
- `BlackHole 2ch audio device not found on the node`: zainstaluj `blackhole-2ch`
  w maszynie wirtualnej i uruchom ją ponownie.
- Chrome otwiera się, ale nie może dołączyć: zaloguj się do profilu przeglądarki
  w maszynie wirtualnej albo pozostaw ustawione `chrome.guestName` dla
  dołączania jako gość. Automatyczne dołączanie jako gość używa automatyzacji
  przeglądarki OpenClaw przez proxy przeglądarki node; upewnij się, że
  konfiguracja przeglądarki node wskazuje żądany profil, na przykład
  `browser.defaultProfile: "user"` albo nazwany profil istniejącej sesji.
- Zduplikowane karty Meet: pozostaw włączone `chrome.reuseExistingTab: true`.
  OpenClaw aktywuje istniejącą kartę dla tego samego URL Meet przed otwarciem
  nowej, a tworzenie spotkania przez przeglądarkę ponownie używa trwającej karty
  `https://meet.google.com/new` lub karty monitu konta Google przed otwarciem
  kolejnej.
- Brak dźwięku: w Meet skieruj mikrofon/głośnik przez ścieżkę wirtualnego
  urządzenia audio używaną przez OpenClaw; użyj osobnych urządzeń wirtualnych
  albo routingu w stylu Loopback, aby uzyskać czysty dwukierunkowy dźwięk.

## Uwagi instalacyjne

Domyślna konfiguracja Chrome czasu rzeczywistego używa dwóch narzędzi
zewnętrznych:

- `sox`: narzędzie audio wiersza poleceń. Plugin używa jawnych poleceń urządzeń
  CoreAudio dla domyślnego mostka audio 24 kHz PCM16.
- `blackhole-2ch`: wirtualny sterownik audio macOS. Tworzy urządzenie audio
  `BlackHole 2ch`, przez które Chrome/Meet może kierować dźwięk.

OpenClaw nie dołącza ani nie redystrybuuje żadnego z tych pakietów. Dokumentacja
prosi użytkowników o zainstalowanie ich jako zależności hosta przez Homebrew.
SoX jest licencjonowany jako `LGPL-2.0-only AND GPL-2.0-only`; BlackHole jest na
licencji GPL-3.0. Jeśli budujesz instalator lub urządzenie, które dołącza
BlackHole z OpenClaw, sprawdź warunki licencyjne upstream BlackHole albo uzyskaj
oddzielną licencję od Existential Audio.

## Transporty

### Chrome

Transport Chrome otwiera URL Meet przez sterowanie przeglądarką OpenClaw i
dołącza jako zalogowany profil przeglądarki OpenClaw. W macOS Plugin sprawdza
obecność `BlackHole 2ch` przed uruchomieniem. Jeśli jest skonfigurowany,
uruchamia też polecenie kontroli kondycji mostka audio i polecenie startowe
przed otwarciem Chrome. Użyj `chrome`, gdy Chrome/dźwięk działają na hoście
Gateway; użyj `chrome-node`, gdy Chrome/dźwięk działają na sparowanym node,
takim jak maszyna wirtualna Parallels macOS. Dla lokalnego Chrome wybierz profil
za pomocą `browser.defaultProfile`; `chrome.browserProfile` jest przekazywane do
hostów `chrome-node`.

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome-node
```

Skieruj dźwięk mikrofonu i głośnika Chrome przez lokalny mostek audio OpenClaw.
Jeśli `BlackHole 2ch` nie jest zainstalowany, dołączenie kończy się błędem
konfiguracji zamiast cicho dołączyć bez ścieżki audio.

### Twilio

Transport Twilio to ścisły plan wybierania delegowany do Plugin Voice Call. Nie
analizuje stron Meet w poszukiwaniu numerów telefonów.

Użyj go, gdy uczestnictwo przez Chrome jest niedostępne albo chcesz awaryjnego
dołączenia telefonicznego. Google Meet musi udostępniać numer telefoniczny
dołączenia i PIN dla spotkania; OpenClaw nie odkrywa ich ze strony Meet.

Włącz Plugin Voice Call na hoście Gateway, nie na node Chrome:

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

Podaj poświadczenia Twilio przez środowisko lub konfigurację. Środowisko
utrzymuje sekrety poza `openclaw.json`:

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
```

Uruchom ponownie albo przeładuj Gateway po włączeniu `voice-call`; zmiany
konfiguracji Plugin nie pojawią się w już działającym procesie Gateway, dopóki
nie zostanie przeładowany.

Następnie zweryfikuj:

```bash
openclaw config validate
openclaw plugins list | grep -E 'google-meet|voice-call'
openclaw googlemeet setup
```

Gdy delegowanie Twilio jest podłączone, `googlemeet setup` zawiera udane kontrole
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
awaryjnie użyć automatyzacji przeglądarki. Skonfiguruj OAuth, gdy chcesz używać
oficjalnego tworzenia przez API, rozpoznawania przestrzeni lub kontroli
wstępnych Meet Media API.

Dostęp do Google Meet API używa OAuth użytkownika: utwórz klienta OAuth Google
Cloud, zażądaj wymaganych zakresów, autoryzuj konto Google, a następnie zapisz
uzyskany token odświeżania w konfiguracji Plugin Google Meet albo podaj zmienne
środowiskowe `OPENCLAW_GOOGLE_MEET_*`.

OAuth nie zastępuje ścieżki dołączania przez Chrome. Transporty Chrome i
Chrome-node nadal dołączają przez zalogowany profil Chrome, BlackHole/SoX oraz
połączony node, gdy używasz uczestnictwa przez przeglądarkę. OAuth służy tylko
do oficjalnej ścieżki Google Meet API: tworzenia przestrzeni spotkań,
rozpoznawania przestrzeni i uruchamiania kontroli wstępnych Meet Media API.

### Utwórz poświadczenia Google

W Google Cloud Console:

1. Utwórz albo wybierz projekt Google Cloud.
2. Włącz **Google Meet REST API** dla tego projektu.
3. Skonfiguruj ekran zgody OAuth.
   - **Internal** jest najprostsze dla organizacji Google Workspace.
   - **External** działa w konfiguracjach osobistych/testowych; gdy aplikacja
     jest w trybie Testing, dodaj każde konto Google, które będzie autoryzować
     aplikację, jako użytkownika testowego.
4. Dodaj zakresy wymagane przez OpenClaw:
   - `https://www.googleapis.com/auth/meetings.space.created`
   - `https://www.googleapis.com/auth/meetings.space.readonly`
   - `https://www.googleapis.com/auth/meetings.conference.media.readonly`
5. Utwórz identyfikator klienta OAuth.
   - Typ aplikacji: **Web application**.
   - Autoryzowany URI przekierowania:

     ```text
     http://localhost:8085/oauth2callback
     ```

6. Skopiuj identyfikator klienta i sekret klienta.

`meetings.space.created` jest wymagane przez Google Meet `spaces.create`.
`meetings.space.readonly` pozwala OpenClaw rozpoznawać URL-e/kody Meet na
przestrzenie. `meetings.conference.media.readonly` służy do kontroli wstępnej
Meet Media API i pracy z mediami; Google może wymagać rejestracji w Developer
Preview do faktycznego użycia Media API. Jeśli potrzebujesz tylko dołączeń przez
Chrome opartych na przeglądarce, całkowicie pomiń OAuth.

### Wygeneruj token odświeżania

Skonfiguruj `oauth.clientId` i opcjonalnie `oauth.clientSecret` albo przekaż je
jako zmienne środowiskowe, a następnie uruchom:

```bash
openclaw googlemeet auth login --json
```

Polecenie wypisuje blok konfiguracji `oauth` z tokenem odświeżania. Używa PKCE,
wywołania zwrotnego localhost pod adresem
`http://localhost:8085/oauth2callback` oraz ręcznego przepływu
kopiowania/wklejania z `--manual`.

Przykłady:

```bash
OPENCLAW_GOOGLE_MEET_CLIENT_ID="your-client-id" \
OPENCLAW_GOOGLE_MEET_CLIENT_SECRET="your-client-secret" \
openclaw googlemeet auth login --json
```

Użyj trybu ręcznego, gdy przeglądarka nie może połączyć się z lokalnym
wywołaniem zwrotnym:

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

Zapisz obiekt `oauth` pod konfiguracją Plugin Google Meet:

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
Jeśli obecne są zarówno wartości konfiguracji, jak i środowiska, Plugin najpierw
rozwiązuje konfigurację, a potem używa środowiska jako awaryjnego źródła.

Zgoda OAuth obejmuje tworzenie przestrzeni Meet, dostęp do odczytu przestrzeni
Meet oraz dostęp do odczytu mediów konferencji Meet. Jeśli uwierzytelniłeś się
przed istnieniem obsługi tworzenia spotkań, uruchom ponownie
`openclaw googlemeet auth login --json`, aby token odświeżania miał zakres
`meetings.space.created`.

### Zweryfikuj OAuth za pomocą doctor

Uruchom OAuth doctor, gdy chcesz szybkiej kontroli kondycji bez sekretów:

```bash
openclaw googlemeet doctor --oauth --json
```

To nie ładuje środowiska uruchomieniowego Chrome ani nie wymaga połączonego node
Chrome. Sprawdza, czy istnieje konfiguracja OAuth i czy token odświeżania może
wygenerować token dostępu. Raport JSON zawiera tylko pola statusu, takie jak
`ok`, `configured`, `tokenSource`, `expiresAt` i komunikaty kontroli; nie
wypisuje tokenu dostępu, tokenu odświeżania ani sekretu klienta.

Typowe wyniki:

| Kontrola             | Znaczenie                                                                               |
| -------------------- | --------------------------------------------------------------------------------------- |
| `oauth-config`       | Obecne jest `oauth.clientId` wraz z `oauth.refreshToken` albo buforowany token dostępu. |
| `oauth-token`        | Buforowany token dostępu jest nadal ważny albo token odświeżania wygenerował nowy token dostępu. |
| `meet-spaces-get`    | Opcjonalna kontrola `--meeting` rozpoznała istniejącą przestrzeń Meet.                  |
| `meet-spaces-create` | Opcjonalna kontrola `--create-space` utworzyła nową przestrzeń Meet.                    |

Aby potwierdzić także włączenie Google Meet API i zakres `spaces.create`,
uruchom kontrolę tworzenia powodującą skutki uboczne:

```bash
openclaw googlemeet doctor --oauth --create-space --json
openclaw googlemeet create --no-join --json
```

`--create-space` tworzy jednorazowy URL Meet. Użyj go, gdy musisz potwierdzić,
że projekt Google Cloud ma włączone Meet API i że autoryzowane konto ma zakres
`meetings.space.created`.

Aby potwierdzić dostęp do odczytu istniejącej przestrzeni spotkania:

```bash
openclaw googlemeet doctor --oauth --meeting https://meet.google.com/abc-defg-hij --json
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
```

`doctor --oauth --meeting` i `resolve-space` potwierdzają dostęp do odczytu
istniejącej przestrzeni, do której autoryzowane konto Google ma dostęp. `403` z
tych kontroli zwykle oznacza, że Google Meet REST API jest wyłączone, uzgodniony
token odświeżania nie ma wymaganego zakresu albo konto Google nie ma dostępu do
tej przestrzeni Meet. Błąd tokenu odświeżania oznacza, że należy ponownie
uruchomić `openclaw googlemeet auth login --json` i zapisać nowy blok `oauth`.

Do awaryjnego trybu przeglądarki nie są potrzebne poświadczenia OAuth. W tym
trybie uwierzytelnianie Google pochodzi z zalogowanego profilu Chrome na
wybranym node, a nie z konfiguracji OpenClaw.

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

Uruchom kontrolę wstępną przed pracą z multimediami:

```bash
openclaw googlemeet preflight --meeting https://meet.google.com/abc-defg-hij
```

Wyświetl artefakty spotkania i obecność po utworzeniu rekordów konferencji przez Meet:

```bash
openclaw googlemeet artifacts --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet attendance --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet export --meeting https://meet.google.com/abc-defg-hij --output ./meet-export
```

Z `--meeting` polecenia `artifacts` i `attendance` domyślnie używają najnowszego rekordu konferencji. Przekaż `--all-conference-records`, gdy chcesz uzyskać każdy zachowany rekord dla tego spotkania.

Wyszukiwanie w kalendarzu może rozwiązać adres URL spotkania z Google Calendar przed odczytem artefaktów Meet:

```bash
openclaw googlemeet latest --today
openclaw googlemeet calendar-events --today --json
openclaw googlemeet artifacts --event "Weekly sync"
openclaw googlemeet attendance --today --format csv --output attendance.csv
```

`--today` przeszukuje dzisiejszy kalendarz `primary` pod kątem wydarzenia Calendar z linkiem Google Meet. Użyj `--event <query>`, aby wyszukać pasujący tekst wydarzenia, oraz `--calendar <id>` dla kalendarza innego niż główny. Wyszukiwanie w kalendarzu wymaga świeżego logowania OAuth obejmującego zakres tylko do odczytu wydarzeń Calendar. `calendar-events` pokazuje podgląd pasujących wydarzeń Meet i oznacza wydarzenie, które wybiorą `latest`, `artifacts`, `attendance` lub `export`.

Jeśli znasz już identyfikator rekordu konferencji, zaadresuj go bezpośrednio:

```bash
openclaw googlemeet latest --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet artifacts --conference-record conferenceRecords/abc123 --json
openclaw googlemeet attendance --conference-record conferenceRecords/abc123 --json
```

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

`artifacts` zwraca metadane rekordu konferencji oraz metadane zasobów uczestników, nagrań, transkrypcji, strukturalnych wpisów transkrypcji i inteligentnych notatek, gdy Google udostępnia je dla spotkania. Użyj `--no-transcript-entries`, aby pominąć wyszukiwanie wpisów dla dużych spotkań. `attendance` rozwija uczestników do wierszy sesji uczestnika z czasami pierwszego i ostatniego wykrycia, łącznym czasem trwania sesji, flagami spóźnienia i wcześniejszego wyjścia oraz zduplikowanymi zasobami uczestników scalonymi według zalogowanego użytkownika lub nazwy wyświetlanej. Przekaż `--no-merge-duplicates`, aby zachować surowe zasoby uczestników oddzielnie, `--late-after-minutes`, aby dostroić wykrywanie spóźnień, oraz `--early-before-minutes`, aby dostroić wykrywanie wcześniejszego wyjścia.

`export` zapisuje folder zawierający `summary.md`, `attendance.csv`, `transcript.md`, `artifacts.json`, `attendance.json` i `manifest.json`. `manifest.json` rejestruje wybrane wejście, opcje eksportu, rekordy konferencji, pliki wyjściowe, liczby, źródło tokenu, wydarzenie Calendar, jeśli zostało użyte, oraz wszelkie ostrzeżenia o częściowym pobieraniu. Przekaż `--zip`, aby dodatkowo zapisać przenośne archiwum obok folderu. Przekaż `--include-doc-bodies`, aby wyeksportować tekst połączonych transkrypcji i inteligentnych notatek Google Docs przez Google Drive `files.export`; wymaga to świeżego logowania OAuth obejmującego zakres Meet tylko do odczytu w Drive. Bez `--include-doc-bodies` eksporty zawierają tylko metadane Meet i strukturalne wpisy transkrypcji. Jeśli Google zwróci częściowy błąd artefaktu, taki jak błąd listowania inteligentnych notatek, wpisu transkrypcji lub treści dokumentu Drive, podsumowanie i manifest zachowają ostrzeżenie zamiast przerywać cały eksport. Użyj `--dry-run`, aby pobrać te same dane artefaktów/obecności i wypisać JSON manifestu bez tworzenia folderu ani ZIP. Jest to przydatne przed zapisaniem dużego eksportu lub gdy agent potrzebuje tylko liczników, wybranych rekordów i ostrzeżeń.

Agenci mogą też utworzyć ten sam pakiet za pomocą narzędzia `google_meet`:

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

Uruchom chroniony live smoke na prawdziwym zachowanym spotkaniu:

```bash
OPENCLAW_LIVE_TEST=1 \
OPENCLAW_GOOGLE_MEET_LIVE_MEETING=https://meet.google.com/abc-defg-hij \
pnpm test:live -- extensions/google-meet/google-meet.live.test.ts
```

Środowisko live smoke:

- `OPENCLAW_LIVE_TEST=1` włącza chronione testy live.
- `OPENCLAW_GOOGLE_MEET_LIVE_MEETING` wskazuje zachowany adres URL Meet, kod lub
  `spaces/{id}`.
- `OPENCLAW_GOOGLE_MEET_CLIENT_ID` lub `GOOGLE_MEET_CLIENT_ID` zapewnia identyfikator klienta OAuth.
- `OPENCLAW_GOOGLE_MEET_REFRESH_TOKEN` lub `GOOGLE_MEET_REFRESH_TOKEN` zapewnia token odświeżania.
- Opcjonalnie: `OPENCLAW_GOOGLE_MEET_CLIENT_SECRET`,
  `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN` i
  `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT` używają tych samych nazw zastępczych
  bez prefiksu `OPENCLAW_`.

Podstawowy live smoke artefaktów/obecności potrzebuje
`https://www.googleapis.com/auth/meetings.space.readonly` i
`https://www.googleapis.com/auth/meetings.conference.media.readonly`. Wyszukiwanie w kalendarzu potrzebuje `https://www.googleapis.com/auth/calendar.events.readonly`. Eksport treści dokumentu Drive potrzebuje
`https://www.googleapis.com/auth/drive.meet.readonly`.

Utwórz świeżą przestrzeń Meet:

```bash
openclaw googlemeet create
```

Polecenie wypisuje nowe `meeting uri`, źródło i sesję dołączenia. Z poświadczeniami OAuth używa oficjalnego Google Meet API. Bez poświadczeń OAuth używa jako rozwiązania zastępczego zalogowanego profilu przeglądarki przypiętego węzła Chrome. Agenci mogą użyć narzędzia `google_meet` z `action: "create"`, aby utworzyć spotkanie i dołączyć do niego w jednym kroku. Do tworzenia tylko adresu URL przekaż `"join": false`.

Przykładowe wyjście JSON z rozwiązania zastępczego przeglądarki:

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

Jeśli rozwiązanie zastępcze przeglądarki trafi na logowanie Google lub blokadę uprawnień Meet, zanim będzie mogło utworzyć adres URL, metoda Gateway zwraca nieudaną odpowiedź, a narzędzie `google_meet` zwraca strukturalne szczegóły zamiast zwykłego ciągu:

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

Gdy agent widzi `manualActionRequired: true`, powinien zgłosić `manualActionMessage` wraz z kontekstem węzła/karty przeglądarki i przestać otwierać nowe karty Meet, dopóki operator nie wykona kroku w przeglądarce.

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

Tworzenie Meet domyślnie dołącza do spotkania. Transport Chrome lub Chrome-node nadal wymaga zalogowanego profilu Google Chrome, aby dołączyć przez przeglądarkę. Jeśli profil jest wylogowany, OpenClaw zgłasza `manualActionRequired: true` lub błąd rozwiązania zastępczego przeglądarki i prosi operatora o dokończenie logowania Google przed ponowną próbą.

Ustaw `preview.enrollmentAcknowledged: true` dopiero po potwierdzeniu, że Twój projekt Cloud, podmiot OAuth i uczestnicy spotkania są zapisani do Google Workspace Developer Preview Program dla Meet media APIs.

## Konfiguracja

Wspólna ścieżka czasu rzeczywistego Chrome wymaga tylko włączonego Plugin, BlackHole, SoX i klucza dostawcy głosu czasu rzeczywistego zaplecza. OpenAI jest domyślne; ustaw `realtime.provider: "google"`, aby użyć Google Gemini Live:

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
# or
export GEMINI_API_KEY=...
```

Ustaw konfigurację Plugin w `plugins.entries.google-meet.config`:

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
- `chrome.guestName: "OpenClaw Agent"`: nazwa używana na ekranie gościa Meet, gdy użytkownik nie jest zalogowany
- `chrome.autoJoin: true`: wypełnienie nazwy gościa i kliknięcie Join Now na zasadzie najlepszej próby przez automatyzację przeglądarki OpenClaw na `chrome-node`
- `chrome.reuseExistingTab: true`: aktywuj istniejącą kartę Meet zamiast otwierać duplikaty
- `chrome.waitForInCallMs: 20000`: czekaj, aż karta Meet zgłosi stan rozmowy, zanim zostanie wyzwolone wprowadzenie czasu rzeczywistego
- `chrome.audioFormat: "pcm16-24khz"`: format audio pary poleceń. Użyj
  `"g711-ulaw-8khz"` tylko dla starszych/niestandardowych par poleceń, które nadal emitują audio telefoniczne.
- `chrome.audioInputCommand`: polecenie SoX odczytujące z CoreAudio `BlackHole 2ch` i zapisujące audio w `chrome.audioFormat`
- `chrome.audioOutputCommand`: polecenie SoX odczytujące audio w `chrome.audioFormat` i zapisujące do CoreAudio `BlackHole 2ch`
- `chrome.bargeInInputCommand`: opcjonalne polecenie lokalnego mikrofonu, które zapisuje podpisany 16-bitowy, little-endian, jednokanałowy PCM do wykrywania wtrącenia człowieka, gdy odtwarzanie asystenta jest aktywne. Obecnie dotyczy to hostowanego przez Gateway mostu pary poleceń `chrome`.
- `chrome.bargeInRmsThreshold: 650`: poziom RMS liczony jako przerwanie przez człowieka na `chrome.bargeInInputCommand`
- `chrome.bargeInPeakThreshold: 2500`: poziom szczytowy liczony jako przerwanie przez człowieka na `chrome.bargeInInputCommand`
- `chrome.bargeInCooldownMs: 900`: minimalne opóźnienie między kolejnymi wyczyszczeniami przerwań przez człowieka
- `realtime.provider: "openai"`
- `realtime.toolPolicy: "safe-read-only"`
- `realtime.instructions`: krótkie odpowiedzi mówione, z
  `openclaw_agent_consult` dla głębszych odpowiedzi
- `realtime.introMessage`: krótka mówiona kontrola gotowości, gdy most czasu rzeczywistego się połączy; ustaw na `""`, aby dołączyć po cichu
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

`voiceCall.enabled` domyślnie ma wartość `true`; przy transporcie Twilio deleguje
rzeczywiste połączenie PSTN, DTMF i powitanie wstępne do Pluginu Voice Call. Voice Call
odtwarza sekwencję DTMF przed otwarciem strumienia multimediów w czasie rzeczywistym, a następnie używa
zapisanego tekstu wstępnego jako początkowego powitania w czasie rzeczywistym. Jeśli `voice-call` nie jest
włączony, Google Meet nadal może zweryfikować i zapisać plan wybierania numeru, ale nie może
wykonać połączenia Twilio.

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

Użyj `transport: "chrome"`, gdy Chrome działa na hoście Gateway. Użyj
`transport: "chrome-node"`, gdy Chrome działa na sparowanym Node, takim jak maszyna wirtualna Parallels.
W obu przypadkach model czasu rzeczywistego i `openclaw_agent_consult` działają na hoście
Gateway, więc dane uwierzytelniające modelu pozostają tam.

Użyj `action: "status"`, aby wyświetlić aktywne sesje lub sprawdzić identyfikator sesji. Użyj
`action: "speak"` z `sessionId` i `message`, aby agent czasu rzeczywistego
natychmiast przemówił. Użyj `action: "test_speech"`, aby utworzyć lub ponownie użyć sesji,
wyzwolić znaną frazę i zwrócić stan `inCall`, gdy host Chrome może
go zgłosić. `test_speech` zawsze wymusza `mode: "realtime"` i kończy się niepowodzeniem, jeśli ma
działać w `mode: "transcribe"`, ponieważ sesje tylko do obserwacji celowo nie mogą
emitować mowy. Wynik `speechOutputVerified` jest oparty na zwiększeniu liczby bajtów wyjściowego audio
w czasie rzeczywistym podczas tego testowego wywołania, więc ponownie użyta sesja ze starszym audio
nie liczy się jako świeżo udana kontrola mowy. Użyj `action: "leave"`, aby oznaczyć
sesję jako zakończoną.

`status` zawiera stan Chrome, gdy jest dostępny:

- `inCall`: Chrome wydaje się być w połączeniu Meet
- `micMuted`: najlepszy możliwy stan mikrofonu Meet
- `manualActionRequired` / `manualActionReason` / `manualActionMessage`: profil
  przeglądarki wymaga ręcznego logowania, wpuszczenia przez gospodarza Meet, uprawnień lub
  naprawy sterowania przeglądarką, zanim mowa będzie działać
- `speechReady` / `speechBlockedReason` / `speechBlockedMessage`: czy
  zarządzana mowa Chrome jest teraz dozwolona. `speechReady: false` oznacza, że OpenClaw
  nie wysłał frazy wstępnej/testowej do mostka audio.
- `providerConnected` / `realtimeReady`: stan mostka głosowego czasu rzeczywistego
- `lastInputAt` / `lastOutputAt`: ostatnie audio odebrane z mostka lub wysłane do niego
- `lastSuppressedInputAt` / `suppressedInputBytes`: wejście loopback ignorowane, gdy
  odtwarzanie asystenta jest aktywne

```json
{
  "action": "speak",
  "sessionId": "meet_...",
  "message": "Say exactly: I'm here and listening."
}
```

## Konsultacja agenta w czasie rzeczywistym

Tryb czasu rzeczywistego Chrome jest zoptymalizowany pod kątem żywej pętli głosowej. Dostawca głosu
czasu rzeczywistego słyszy audio spotkania i mówi przez skonfigurowany mostek audio.
Gdy model czasu rzeczywistego potrzebuje głębszego rozumowania, aktualnych informacji lub zwykłych
narzędzi OpenClaw, może wywołać `openclaw_agent_consult`.

Narzędzie konsultacji uruchamia w tle zwykłego agenta OpenClaw z kontekstem ostatniego
transkryptu spotkania i zwraca zwięzłą odpowiedź mówioną do sesji głosowej
czasu rzeczywistego. Model głosowy może następnie wypowiedzieć tę odpowiedź na spotkaniu.
Używa tego samego współdzielonego narzędzia konsultacji czasu rzeczywistego co Voice Call.

Domyślnie konsultacje działają na agencie `main`. Ustaw `realtime.agentId`, gdy
ścieżka Meet ma konsultować dedykowany obszar roboczy agenta OpenClaw, domyślne ustawienia modelu,
politykę narzędzi, pamięć i historię sesji.

`realtime.toolPolicy` kontroluje przebieg konsultacji:

- `safe-read-only`: udostępnij narzędzie konsultacji i ogranicz zwykłego agenta do
  `read`, `web_search`, `web_fetch`, `x_search`, `memory_search` i
  `memory_get`.
- `owner`: udostępnij narzędzie konsultacji i pozwól zwykłemu agentowi używać normalnej
  polityki narzędzi agenta.
- `none`: nie udostępniaj narzędzia konsultacji modelowi głosowemu czasu rzeczywistego.

Klucz sesji konsultacji ma zakres pojedynczej sesji Meet, więc kolejne wywołania konsultacji
mogą ponownie używać wcześniejszego kontekstu konsultacji podczas tego samego spotkania.

Aby wymusić mówioną kontrolę gotowości po pełnym dołączeniu Chrome do połączenia:

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

Użyj tej sekwencji przed przekazaniem spotkania nienadzorowanemu agentowi:

```bash
openclaw googlemeet setup
openclaw nodes status
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij \
  --transport chrome-node \
  --message "Say exactly: Google Meet speech test complete."
```

Oczekiwany stan Chrome-node:

- `googlemeet setup` jest cały zielony.
- `googlemeet setup` zawiera `chrome-node-connected`, gdy Chrome-node jest
  domyślnym transportem lub Node jest przypięty.
- `nodes status` pokazuje wybrany Node jako połączony.
- Wybrany Node ogłasza zarówno `googlemeet.chrome`, jak i `browser.proxy`.
- Karta Meet dołącza do połączenia, a `test-speech` zwraca stan Chrome z
  `inCall: true`.

Dla zdalnego hosta Chrome, takiego jak maszyna wirtualna Parallels macOS, jest to najkrótsza
bezpieczna kontrola po aktualizacji Gateway lub maszyny wirtualnej:

```bash
openclaw googlemeet setup
openclaw nodes status --connected
openclaw nodes invoke \
  --node parallels-macos \
  --command googlemeet.chrome \
  --params '{"action":"setup"}'
```

To potwierdza, że Plugin Gateway jest załadowany, Node maszyny wirtualnej jest połączony z
bieżącym tokenem, a mostek audio Meet jest dostępny, zanim agent otworzy
rzeczywistą kartę spotkania.

Dla testu dymnego Twilio użyj spotkania, które udostępnia szczegóły telefonicznego dołączenia:

```bash
openclaw googlemeet setup
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --pin 123456
```

Oczekiwany stan Twilio:

- `googlemeet setup` zawiera zielone kontrole `twilio-voice-call-plugin`,
  `twilio-voice-call-credentials` i `twilio-voice-call-webhook`.
- `voicecall` jest dostępne w CLI po ponownym załadowaniu Gateway.
- Zwrócona sesja ma `transport: "twilio"` i `twilio.voiceCallId`.
- `openclaw logs --follow` pokazuje TwiML DTMF obsłużony przed TwiML czasu rzeczywistego, a następnie
  mostek czasu rzeczywistego z zakolejkowanym początkowym powitaniem.
- `googlemeet leave <sessionId>` rozłącza delegowane połączenie głosowe.

## Rozwiązywanie problemów

### Agent nie widzi narzędzia Google Meet

Potwierdź, że Plugin jest włączony w konfiguracji Gateway i ponownie załaduj Gateway:

```bash
openclaw plugins list | grep google-meet
openclaw googlemeet setup
```

Jeśli właśnie edytowano `plugins.entries.google-meet`, zrestartuj lub ponownie załaduj Gateway.
Działający agent widzi tylko narzędzia pluginu zarejestrowane przez bieżący proces
Gateway.

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

Node musi być połączony i wymieniać `googlemeet.chrome` oraz `browser.proxy`.
Konfiguracja Gateway musi zezwalać na te polecenia Node:

```json5
{
  gateway: {
    nodes: {
      allowCommands: ["browser.proxy", "googlemeet.chrome"],
    },
  },
}
```

Jeśli `googlemeet setup` kończy się niepowodzeniem na `chrome-node-connected` lub log Gateway zgłasza
`gateway token mismatch`, zainstaluj ponownie lub zrestartuj Node z bieżącym tokenem Gateway.
Dla Gateway w sieci LAN zwykle oznacza to:

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

Uruchom `googlemeet test-speech` i sprawdź zwrócony stan Chrome. Jeśli
zgłasza `manualActionRequired: true`, pokaż `manualActionMessage` operatorowi
i przestań ponawiać próby, dopóki działanie w przeglądarce nie zostanie ukończone.

Typowe działania ręczne:

- Zaloguj się do profilu Chrome.
- Wpuść gościa z konta gospodarza Meet.
- Przyznaj Chrome uprawnienia do mikrofonu/kamery, gdy pojawi się natywny monit uprawnień
  Chrome.
- Zamknij lub napraw zablokowane okno dialogowe uprawnień Meet.

Nie zgłaszaj „nie zalogowano” tylko dlatego, że Meet pokazuje „Do you want people to
hear you in the meeting?” To ekran pośredni wyboru audio Meet; OpenClaw
klika **Use microphone** przez automatyzację przeglądarki, gdy jest dostępne, i nadal
czeka na rzeczywisty stan spotkania. Dla zapasowego tworzenia tylko przez przeglądarkę OpenClaw
może kliknąć **Continue without microphone**, ponieważ utworzenie URL nie wymaga
ścieżki audio czasu rzeczywistego.

### Tworzenie spotkania kończy się niepowodzeniem

`googlemeet create` najpierw używa endpointu Google Meet API `spaces.create`,
gdy skonfigurowano dane uwierzytelniające OAuth. Bez danych uwierzytelniających OAuth przełącza się
na przypiętą przeglądarkę Chrome Node. Potwierdź:

- Dla tworzenia przez API: skonfigurowano `oauth.clientId` i `oauth.refreshToken`,
  albo obecne są pasujące zmienne środowiskowe `OPENCLAW_GOOGLE_MEET_*`.
- Dla tworzenia przez API: token odświeżania został wydany po dodaniu obsługi tworzenia.
  Starszym tokenom może brakować zakresu `meetings.space.created`; uruchom ponownie
  `openclaw googlemeet auth login --json` i zaktualizuj konfigurację pluginu.
- Dla zapasowej ścieżki przeglądarki: `defaultTransport: "chrome-node"` i
  `chromeNode.node` wskazują połączony Node z `browser.proxy` i
  `googlemeet.chrome`.
- Dla zapasowej ścieżki przeglądarki: profil OpenClaw Chrome na tym Node jest zalogowany
  do Google i może otworzyć `https://meet.google.com/new`.
- Dla zapasowej ścieżki przeglądarki: ponowne próby używają istniejącej karty
  `https://meet.google.com/new` lub monitu konta Google przed otwarciem nowej karty. Jeśli agent przekroczy limit czasu,
  ponów wywołanie narzędzia zamiast ręcznie otwierać kolejną kartę Meet.
- Dla zapasowej ścieżki przeglądarki: jeśli narzędzie zwróci `manualActionRequired: true`, użyj
  zwróconych `browser.nodeId`, `browser.targetId`, `browserUrl` i
  `manualActionMessage`, aby poprowadzić operatora. Nie ponawiaj prób w pętli, dopóki to
  działanie nie zostanie ukończone.
- Dla zapasowej ścieżki przeglądarki: jeśli Meet pokazuje „Do you want people to hear you in the
  meeting?”, pozostaw kartę otwartą. OpenClaw powinien kliknąć **Use microphone** lub, dla
  zapasowej ścieżki tylko do tworzenia, **Continue without microphone** przez automatyzację
  przeglądarki i kontynuować oczekiwanie na wygenerowany URL Meet. Jeśli nie może, błąd
  powinien wspominać `meet-audio-choice-required`, a nie `google-login-required`.

### Agent dołącza, ale nie mówi

Sprawdź ścieżkę czasu rzeczywistego:

```bash
openclaw googlemeet setup
openclaw googlemeet doctor
```

Użyj `mode: "realtime"` do słuchania/odpowiadania głosem. `mode: "transcribe"` celowo
nie uruchamia dwukierunkowego mostu głosowego realtime. `googlemeet test-speech`
zawsze sprawdza ścieżkę realtime i raportuje, czy dla tego wywołania
zaobserwowano bajty wyjściowe mostu. Jeśli `speechOutputVerified` ma wartość false, a
`speechOutputTimedOut` ma wartość true, dostawca realtime mógł przyjąć
wypowiedź, ale OpenClaw nie zobaczył, aby nowe bajty wyjściowe dotarły do mostu
audio Chrome.

Sprawdź też:

- Klucz dostawcy realtime jest dostępny na hoście Gateway, na przykład
  `OPENAI_API_KEY` lub `GEMINI_API_KEY`.
- `BlackHole 2ch` jest widoczny na hoście Chrome.
- `sox` istnieje na hoście Chrome.
- Mikrofon i głośnik Meet są kierowane przez wirtualną ścieżkę audio używaną przez
  OpenClaw.

`googlemeet doctor [session-id]` wypisuje sesję, Node, stan połączenia,
powód działania ręcznego, połączenie z dostawcą realtime, `realtimeReady`, aktywność
wejścia/wyjścia audio, ostatnie znaczniki czasu audio, liczniki bajtów i URL przeglądarki.
Użyj `googlemeet status [session-id] --json`, gdy potrzebujesz surowego JSON. Użyj
`googlemeet doctor --oauth`, gdy musisz zweryfikować odświeżanie OAuth Google Meet
bez ujawniania tokenów; dodaj `--meeting` lub `--create-space`, gdy potrzebujesz
również dowodu z Google Meet API.

Jeśli agent przekroczył limit czasu i widzisz już otwartą kartę Meet, sprawdź tę kartę
bez otwierania kolejnej:

```bash
openclaw googlemeet recover-tab
openclaw googlemeet recover-tab https://meet.google.com/abc-defg-hij
```

Równoważną akcją narzędzia jest `recover_current_tab`. Ustawia fokus i sprawdza
istniejącą kartę Meet dla wybranego transportu. Z `chrome` używa lokalnego
sterowania przeglądarką przez Gateway; z `chrome-node` używa skonfigurowanego
Node Chrome. Nie otwiera nowej karty ani nie tworzy nowej sesji; raportuje
bieżącą blokadę, taką jak logowanie, przyjęcie, uprawnienia lub stan wyboru audio.
Polecenie CLI komunikuje się ze skonfigurowanym Gateway, więc Gateway musi działać;
`chrome-node` wymaga też, aby Node Chrome był połączony.

### Kontrole konfiguracji Twilio kończą się niepowodzeniem

`twilio-voice-call-plugin` kończy się niepowodzeniem, gdy `voice-call` nie jest dozwolony lub nie jest włączony.
Dodaj go do `plugins.allow`, włącz `plugins.entries.voice-call` i przeładuj
Gateway.

`twilio-voice-call-credentials` kończy się niepowodzeniem, gdy backend Twilio nie ma SID konta,
tokenu uwierzytelniania lub numeru dzwoniącego. Ustaw je na hoście Gateway:

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
```

`twilio-voice-call-webhook` kończy się niepowodzeniem, gdy `voice-call` nie ma publicznej
ekspozycji Webhook albo gdy `publicUrl` wskazuje na przestrzeń pętli zwrotnej lub sieci prywatnej.
Ustaw `plugins.entries.voice-call.config.publicUrl` na publiczny URL dostawcy albo
skonfiguruj tunel/ekspozycję Tailscale dla `voice-call`.

Adresy pętli zwrotnej i prywatne URL-e nie są prawidłowe dla wywołań zwrotnych operatora. Nie używaj
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

Do lokalnego developmentu użyj tunelu lub ekspozycji Tailscale zamiast prywatnego
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

Następnie zrestartuj lub przeładuj Gateway i uruchom:

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
połączenie z powiadomieniem:

```bash
openclaw voicecall smoke --to "+15555550123" --yes
```

### Połączenie Twilio się rozpoczyna, ale nigdy nie dołącza do spotkania

Potwierdź, że zdarzenie Meet udostępnia szczegóły wybierania telefonicznego. Przekaż dokładny numer
do połączenia i PIN albo niestandardową sekwencję DTMF:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --dtmf-sequence ww123456#
```

Użyj początkowego `w` lub przecinków w `--dtmf-sequence`, jeśli dostawca potrzebuje pauzy
przed wprowadzeniem PIN-u.

Jeśli połączenie telefoniczne zostaje utworzone, ale lista uczestników Meet nigdy nie pokazuje
uczestnika dołączającego telefonicznie:

- Uruchom `openclaw voicecall status --call-id <id>` i potwierdź, że połączenie jest nadal
  aktywne.
- Uruchom `openclaw voicecall tail` i sprawdź, czy Webhooki Twilio docierają do
  Gateway.
- Uruchom `openclaw logs --follow` i szukaj sekwencji Twilio Meet: Google
  Meet deleguje dołączenie, Voice Call zapisuje DTMF TwiML sprzed połączenia,
  serwuje ten początkowy TwiML, następnie serwuje TwiML realtime i uruchamia most realtime
  z `initialGreeting=queued`.
- Uruchom ponownie `openclaw googlemeet setup --transport twilio`; zielona kontrola konfiguracji jest
  wymagana, ale nie dowodzi, że sekwencja PIN-u spotkania jest poprawna.
- Potwierdź, że numer do połączenia należy do tego samego zaproszenia Meet i regionu co
  PIN.
- Zwiększ początkowe pauzy w `--dtmf-sequence`, jeśli Meet odpowiada wolno, na
  przykład `wwww123456#`.
- Jeśli uczestnik dołącza, ale nie słyszysz powitania, sprawdź
  `openclaw logs --follow` pod kątem TwiML realtime, uruchomienia mostu realtime i
  `initialGreeting=queued`. Powitanie jest generowane z początkowej
  wiadomości `voicecall.start` po połączeniu mostu realtime.

Jeśli Webhooki nie docierają, najpierw debuguj Plugin Voice Call: dostawca musi
osiągnąć `plugins.entries.voice-call.config.publicUrl` albo skonfigurowany tunel.
Zobacz [Rozwiązywanie problemów z połączeniami głosowymi](/pl/plugins/voice-call#troubleshooting).

## Uwagi

Oficjalne API multimediów Google Meet jest zorientowane na odbiór, więc mówienie do połączenia
Meet nadal wymaga ścieżki uczestnika. Ten Plugin utrzymuje tę granicę widoczną:
Chrome obsługuje uczestnictwo przez przeglądarkę i lokalne routowanie audio; Twilio obsługuje
uczestnictwo przez telefoniczne dołączenie.

Tryb realtime Chrome wymaga `BlackHole 2ch` oraz jednej z poniższych opcji:

- `chrome.audioInputCommand` plus `chrome.audioOutputCommand`: OpenClaw jest właścicielem
  mostu modelu realtime i przesyła audio w `chrome.audioFormat` między tymi
  poleceniami a wybranym dostawcą głosu realtime. Domyślna ścieżka Chrome to
  24 kHz PCM16; 8 kHz G.711 mu-law pozostaje dostępne dla starszych par poleceń.
- `chrome.audioBridgeCommand`: zewnętrzne polecenie mostu jest właścicielem całej lokalnej
  ścieżki audio i musi zakończyć działanie po uruchomieniu lub zweryfikowaniu swojego demona.

Aby uzyskać czyste audio dwukierunkowe, kieruj wyjście Meet i mikrofon Meet przez oddzielne
urządzenia wirtualne albo graf urządzeń wirtualnych w stylu Loopback. Jedno współdzielone
urządzenie BlackHole może odbijać innych uczestników z powrotem do połączenia.

W przypadku mostu Chrome opartego na parze poleceń `chrome.bargeInInputCommand` może nasłuchiwać
oddzielnego lokalnego mikrofonu i wyczyścić odtwarzanie asystenta, gdy człowiek zacznie
mówić. Dzięki temu mowa człowieka ma pierwszeństwo przed wyjściem asystenta nawet wtedy, gdy współdzielone
wejście pętli zwrotnej BlackHole jest tymczasowo tłumione podczas odtwarzania asystenta.
Podobnie jak `chrome.audioInputCommand` i `chrome.audioOutputCommand`, jest to
lokalne polecenie skonfigurowane przez operatora. Użyj jawnej zaufanej ścieżki polecenia lub
listy argumentów i nie wskazuj na skrypty z niezaufanych lokalizacji.

`googlemeet speak` wyzwala aktywny most audio realtime dla sesji Chrome.
`googlemeet leave` zatrzymuje ten most. W przypadku sesji Twilio delegowanych
przez Plugin Voice Call, `leave` rozłącza również bazowe połączenie głosowe.

## Powiązane

- [Plugin połączeń głosowych](/pl/plugins/voice-call)
- [Tryb rozmowy](/pl/nodes/talk)
- [Tworzenie Pluginów](/pl/plugins/building-plugins)
