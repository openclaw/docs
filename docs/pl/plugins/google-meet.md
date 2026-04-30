---
read_when:
    - Chcesz, aby agent OpenClaw dołączył do rozmowy Google Meet
    - Chcesz, aby agent OpenClaw utworzył nowe połączenie Google Meet
    - Konfigurujesz Chrome, węzeł Chrome lub Twilio jako transport Google Meet
summary: 'Plugin Google Meet: dołączanie do jawnie podanych adresów URL Meet przez Chrome lub Twilio z domyślnymi ustawieniami głosu w czasie rzeczywistym'
title: Plugin Google Meet
x-i18n:
    generated_at: "2026-04-30T10:06:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7b989c872fee0dca31680f67559cd26b715303f7c6f4eeda51fc63889bb0383c
    source_path: plugins/google-meet.md
    workflow: 16
---

Obsługa uczestnika Google Meet dla OpenClaw — Plugin jest z założenia jawny:

- Dołącza tylko do jawnego adresu URL `https://meet.google.com/...`.
- Może utworzyć nową przestrzeń Meet przez Google Meet API, a następnie dołączyć do
  zwróconego adresu URL.
- `realtime` voice jest trybem domyślnym.
- Realtime voice może wywołać z powrotem pełnego agenta OpenClaw, gdy potrzebne są głębsze
  rozumowanie lub narzędzia.
- Agenci wybierają zachowanie dołączania za pomocą `mode`: użyj `realtime` do nasłuchiwania
  i odpowiadania na żywo albo `transcribe`, aby dołączyć i sterować przeglądarką bez
  mostka głosu realtime.
- Uwierzytelnianie zaczyna się od osobistego Google OAuth albo już zalogowanego profilu Chrome.
- Nie ma automatycznego komunikatu o zgodzie.
- Domyślnym backendem audio Chrome jest `BlackHole 2ch`.
- Chrome może działać lokalnie albo na sparowanym hoście node.
- Twilio przyjmuje numer wdzwaniany oraz opcjonalny PIN lub sekwencję DTMF.
- Polecenie CLI to `googlemeet`; `meet` jest zarezerwowane dla szerszych przepływów
  telekonferencyjnych agenta.

## Szybki start

Zainstaluj lokalne zależności audio i skonfiguruj backend dostawcy realtime voice.
OpenAI jest domyślny; Google Gemini Live również działa z
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
przypięcie node oraz, dla dołączeń Chrome w trybie realtime, mostek audio BlackHole/SoX
i opóźnione kontrole wprowadzenia realtime. Dla dołączeń tylko obserwujących sprawdź ten sam
transport za pomocą `--mode transcribe`; ten tryb pomija wymagania wstępne audio realtime,
ponieważ nie nasłuchuje przez mostek ani przez niego nie mówi:

```bash
openclaw googlemeet setup --transport chrome-node --mode transcribe
```

Gdy skonfigurowana jest delegacja Twilio, konfiguracja raportuje też, czy Plugin
`voice-call` i poświadczenia Twilio są gotowe. Traktuj każdą kontrolę `ok: false`
jako blokadę dla sprawdzanego transportu i trybu przed poproszeniem agenta o dołączenie.
Użyj `openclaw googlemeet setup --json` dla skryptów lub wyniku czytelnego maszynowo.
Użyj `--transport chrome`, `--transport chrome-node` albo `--transport twilio`, aby
wstępnie sprawdzić konkretny transport, zanim agent go spróbuje.

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

Utwórz tylko adres URL bez dołączania:

```bash
openclaw googlemeet create --no-join
```

`googlemeet create` ma dwie ścieżki:

- Tworzenie przez API: używane, gdy skonfigurowano poświadczenia Google Meet OAuth. To
  najbardziej deterministyczna ścieżka i nie zależy od stanu interfejsu przeglądarki.
- Awaryjna ścieżka przeglądarki: używana, gdy brakuje poświadczeń OAuth. OpenClaw używa
  przypiętego node Chrome, otwiera `https://meet.google.com/new`, czeka, aż Google
  przekieruje do rzeczywistego adresu URL z kodem spotkania, a następnie zwraca ten adres URL. Ta ścieżka wymaga,
  aby profil Chrome OpenClaw na node był już zalogowany do Google.
  Automatyzacja przeglądarki obsługuje własny monit Meet o mikrofon przy pierwszym uruchomieniu; ten monit
  nie jest traktowany jako błąd logowania Google.
  Przepływy dołączania i tworzenia próbują też ponownie użyć istniejącej karty Meet przed otwarciem
  nowej. Dopasowywanie ignoruje nieszkodliwe ciągi zapytań URL, takie jak `authuser`, więc
  ponowna próba agenta powinna skupić już otwarte spotkanie zamiast tworzyć drugą
  kartę Chrome.

Wynik polecenia/narzędzia zawiera pole `source` (`api` albo `browser`), aby agenci
mogli wyjaśnić, której ścieżki użyto. `create` domyślnie dołącza do nowego spotkania i
zwraca `joined: true` oraz sesję dołączania. Aby tylko wybić adres URL, użyj
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

Dla dołączenia tylko obserwującego/sterowania przeglądarką ustaw `"mode": "transcribe"`. To nie
uruchamia dupleksowego mostka modelu realtime, nie wymaga BlackHole ani SoX
i nie będzie odpowiadać głosem na spotkaniu. Dołączenia Chrome w tym trybie unikają też
nadawania przez OpenClaw uprawnień mikrofonu/kamery oraz unikają ścieżki **Użyj
mikrofonu** w Meet. Jeśli Meet pokazuje ekran pośredni wyboru audio, automatyzacja próbuje
ścieżki bez mikrofonu, a w przeciwnym razie raportuje czynność ręczną zamiast otwierać
lokalny mikrofon.

Podczas sesji realtime status `google_meet` obejmuje stan przeglądarki i mostka audio,
taki jak `inCall`, `manualActionRequired`, `providerConnected`,
`realtimeReady`, `audioInputActive`, `audioOutputActive`, znaczniki czasu ostatniego wejścia/wyjścia,
liczniki bajtów i stan zamknięcia mostka. Jeśli pojawi się bezpieczny monit strony Meet,
automatyzacja przeglądarki obsługuje go, gdy może. Logowanie, dopuszczenie przez hosta oraz
monity uprawnień przeglądarki/OS są raportowane jako czynność ręczna z przyczyną i
komunikatem do przekazania przez agenta. Zarządzane sesje Chrome emitują wprowadzenie lub
frazę testową dopiero po tym, jak stan przeglądarki zgłosi `inCall: true`; w przeciwnym razie status raportuje
`speechReady: false`, a próba mówienia jest blokowana zamiast udawać, że
agent mówił na spotkaniu.

Lokalne dołączenia Chrome przechodzą przez zalogowany profil przeglądarki OpenClaw. Tryb realtime
wymaga `BlackHole 2ch` dla ścieżki mikrofonu/głośnika używanej przez OpenClaw. Aby uzyskać
czysty dupleks audio, użyj oddzielnych urządzeń wirtualnych albo grafu w stylu Loopback; jedno
urządzenie BlackHole wystarcza do pierwszego testu dymnego, ale może powodować echo.

### Lokalny Gateway + Parallels Chrome

Nie potrzebujesz pełnego OpenClaw Gateway ani klucza API modelu wewnątrz maszyny wirtualnej macOS,
aby tylko VM była właścicielem Chrome. Uruchom Gateway i agenta lokalnie, a następnie uruchom
host node w VM. Włącz dołączony Plugin w VM jeden raz, aby node
ogłaszał polecenie Chrome:

Co działa gdzie:

- Host Gateway: OpenClaw Gateway, przestrzeń robocza agenta, klucze modelu/API, dostawca realtime
  oraz konfiguracja Pluginu Google Meet.
- Parallels macOS VM: OpenClaw CLI/host node, Google Chrome, SoX, BlackHole 2ch
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

Zainstaluj lub zaktualizuj OpenClaw w VM, a następnie włącz tam dołączony Plugin:

```bash
openclaw plugins enable google-meet
```

Uruchom host node w VM:

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name parallels-macos
```

Jeśli `<gateway-host>` jest adresem IP w sieci LAN i nie używasz TLS, node odrzuca
plaintext WebSocket, chyba że wyrazisz zgodę dla tej zaufanej sieci prywatnej:

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

Potwierdź, że Gateway widzi node oraz że ogłasza zarówno `googlemeet.chrome`,
jak i możliwość przeglądarki/`browser.proxy`:

```bash
openclaw nodes status
```

Przekieruj Meet przez ten node na hoście Gateway:

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

Dla jednopoleceniowego testu dymnego, który tworzy lub ponownie używa sesji, wypowiada znaną
frazę i drukuje stan sesji:

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij
```

Podczas dołączania realtime automatyzacja przeglądarki OpenClaw wypełnia nazwę gościa, klika
Dołącz/Poproś o dołączenie i akceptuje wybór „Użyj mikrofonu” przy pierwszym uruchomieniu Meet, gdy ten
monit się pojawi. Podczas dołączania tylko obserwującego albo tworzenia spotkania tylko w przeglądarce
przechodzi dalej przez ten sam monit bez mikrofonu, gdy ta opcja jest dostępna.
Jeśli profil przeglądarki nie jest zalogowany, Meet czeka na dopuszczenie przez hosta,
Chrome potrzebuje uprawnienia mikrofonu/kamery dla dołączenia realtime albo Meet utknął
na monicie, którego automatyzacja nie mogła rozwiązać, wynik dołączania/test-speech raportuje
`manualActionRequired: true` z `manualActionReason` i
`manualActionMessage`. Agenci powinni przestać ponawiać dołączenie, zgłosić dokładnie ten
komunikat wraz z bieżącymi `browserUrl`/`browserTitle` i ponowić próbę dopiero po
ukończeniu ręcznej czynności w przeglądarce.

Jeśli `chromeNode.node` zostanie pominięte, OpenClaw wybiera automatycznie tylko wtedy, gdy dokładnie jeden
połączony node ogłasza zarówno `googlemeet.chrome`, jak i sterowanie przeglądarką. Jeśli
połączonych jest kilka zdolnych node, ustaw `chromeNode.node` na identyfikator node,
nazwę wyświetlaną albo zdalny adres IP.

Typowe kontrole awarii:

- `Configured Google Meet node ... is not usable: offline`: przypięty Node jest
  znany Gateway, ale niedostępny. Agenci powinni traktować ten Node jako
  stan diagnostyczny, a nie jako używalny host Chrome, i zgłaszać blokadę
  konfiguracji zamiast przełączać się na inny transport, chyba że użytkownik
  o to poprosił.
- `No connected Google Meet-capable node`: uruchom `openclaw node run` w VM,
  zatwierdź parowanie i upewnij się, że w VM uruchomiono
  `openclaw plugins enable google-meet` oraz
  `openclaw plugins enable browser`. Potwierdź też, że host Gateway zezwala na
  oba polecenia Node za pomocą
  `gateway.nodes.allowCommands: ["googlemeet.chrome", "browser.proxy"]`.
- `BlackHole 2ch audio device not found`: zainstaluj `blackhole-2ch` na
  sprawdzanym hoście i uruchom go ponownie przed użyciem lokalnego audio Chrome.
- `BlackHole 2ch audio device not found on the node`: zainstaluj
  `blackhole-2ch` w VM i uruchom VM ponownie.
- Chrome otwiera się, ale nie może dołączyć: zaloguj się w profilu przeglądarki
  wewnątrz VM albo pozostaw ustawione `chrome.guestName`, aby dołączyć jako
  gość. Automatyczne dołączanie gościa używa automatyzacji przeglądarki
  OpenClaw przez proxy przeglądarki Node; upewnij się, że konfiguracja
  przeglądarki Node wskazuje profil, którego chcesz użyć, na przykład
  `browser.defaultProfile: "user"` albo nazwany profil istniejącej sesji.
- Zduplikowane karty Meet: pozostaw włączone `chrome.reuseExistingTab: true`.
  OpenClaw aktywuje istniejącą kartę dla tego samego URL Meet przed otwarciem
  nowej, a tworzenie spotkania w przeglądarce ponownie używa trwającej karty
  `https://meet.google.com/new` lub karty monitu konta Google przed otwarciem
  kolejnej.
- Brak audio: w Meet skieruj mikrofon/głośnik przez ścieżkę wirtualnego
  urządzenia audio używaną przez OpenClaw; użyj osobnych urządzeń wirtualnych
  albo routingu w stylu Loopback, aby uzyskać czysty dźwięk dwukierunkowy.

## Uwagi dotyczące instalacji

Domyślna konfiguracja czasu rzeczywistego Chrome używa dwóch narzędzi
zewnętrznych:

- `sox`: narzędzie audio wiersza poleceń. Plugin używa jawnych poleceń
  urządzeń CoreAudio dla domyślnego mostu audio PCM16 24 kHz.
- `blackhole-2ch`: wirtualny sterownik audio macOS. Tworzy urządzenie audio
  `BlackHole 2ch`, przez które Chrome/Meet mogą kierować dźwięk.

OpenClaw nie dołącza ani nie redystrybuuje żadnego z tych pakietów. Dokumentacja
prosi użytkowników o instalowanie ich jako zależności hosta przez Homebrew. SoX
jest licencjonowany jako `LGPL-2.0-only AND GPL-2.0-only`; BlackHole jest na
licencji GPL-3.0. Jeśli budujesz instalator lub appliance, który dołącza
BlackHole z OpenClaw, sprawdź warunki licencji upstream BlackHole albo uzyskaj
osobną licencję od Existential Audio.

## Transporty

### Chrome

Transport Chrome otwiera URL Meet przez sterowanie przeglądarką OpenClaw i
dołącza jako zalogowany profil przeglądarki OpenClaw. Na macOS Plugin sprawdza
obecność `BlackHole 2ch` przed uruchomieniem. Jeśli skonfigurowano, uruchamia
też polecenie sprawdzania kondycji mostu audio i polecenie startowe przed
otwarciem Chrome. Użyj `chrome`, gdy Chrome/audio działają na hoście Gateway;
użyj `chrome-node`, gdy Chrome/audio działają na sparowanym Node, takim jak VM
macOS Parallels. Dla lokalnego Chrome wybierz profil za pomocą
`browser.defaultProfile`; `chrome.browserProfile` jest przekazywane do hostów
`chrome-node`.

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome-node
```

Skieruj audio mikrofonu i głośnika Chrome przez lokalny most audio OpenClaw.
Jeśli `BlackHole 2ch` nie jest zainstalowany, dołączenie kończy się błędem
konfiguracji zamiast cichego dołączenia bez ścieżki audio.

### Twilio

Transport Twilio to ścisły plan wybierania delegowany do Plugin Voice Call. Nie
parsuje stron Meet w poszukiwaniu numerów telefonu.

Użyj tego, gdy udział przez Chrome nie jest dostępny albo chcesz mieć awaryjne
dołączanie telefoniczne. Google Meet musi udostępniać numer telefonu i PIN do
spotkania; OpenClaw nie wykrywa ich ze strony Meet.

Włącz Plugin Voice Call na hoście Gateway, nie na Node Chrome:

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

Podaj dane uwierzytelniające Twilio przez środowisko albo konfigurację.
Środowisko utrzymuje sekrety poza `openclaw.json`:

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

Gdy delegowanie Twilio jest podłączone, `googlemeet setup` zawiera pomyślne
kontrole `twilio-voice-call-plugin` i `twilio-voice-call-credentials`.

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

OAuth jest opcjonalne przy tworzeniu linku Meet, ponieważ `googlemeet create`
może użyć awaryjnie automatyzacji przeglądarki. Skonfiguruj OAuth, gdy chcesz
oficjalne tworzenie przez API, rozwiązywanie przestrzeni albo kontrole wstępne
Meet Media API.

Dostęp do Google Meet API używa użytkownika OAuth: utwórz klienta OAuth w Google
Cloud, poproś o wymagane zakresy, autoryzuj konto Google, a następnie zapisz
wynikowy token odświeżania w konfiguracji Plugin Google Meet albo podaj zmienne
środowiskowe `OPENCLAW_GOOGLE_MEET_*`.

OAuth nie zastępuje ścieżki dołączania Chrome. Transporty Chrome i Chrome-node
nadal dołączają przez zalogowany profil Chrome, BlackHole/SoX oraz połączony
Node, gdy używasz udziału przez przeglądarkę. OAuth służy tylko oficjalnej
ścieżce Google Meet API: tworzeniu przestrzeni spotkań, rozwiązywaniu przestrzeni
i uruchamianiu kontroli wstępnych Meet Media API.

### Utwórz dane uwierzytelniające Google

W Google Cloud Console:

1. Utwórz lub wybierz projekt Google Cloud.
2. Włącz **Google Meet REST API** dla tego projektu.
3. Skonfiguruj ekran zgody OAuth.
   - **Internal** jest najprostsze dla organizacji Google Workspace.
   - **External** działa dla konfiguracji osobistych/testowych; gdy aplikacja
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
`meetings.space.readonly` pozwala OpenClaw rozwiązywać URL-e/kody Meet do
przestrzeni. `meetings.conference.media.readonly` służy do kontroli wstępnej
Meet Media API i pracy z mediami; Google może wymagać rejestracji w Developer
Preview do faktycznego użycia Media API. Jeśli potrzebujesz tylko dołączeń Chrome
opartych na przeglądarce, całkowicie pomiń OAuth.

### Wygeneruj token odświeżania

Skonfiguruj `oauth.clientId` i opcjonalnie `oauth.clientSecret` albo przekaż je
jako zmienne środowiskowe, a następnie uruchom:

```bash
openclaw googlemeet auth login --json
```

Polecenie wypisuje blok konfiguracji `oauth` z tokenem odświeżania. Używa PKCE,
wywołania zwrotnego localhost na `http://localhost:8085/oauth2callback` oraz
ręcznego przepływu kopiuj/wklej z `--manual`.

Przykłady:

```bash
OPENCLAW_GOOGLE_MEET_CLIENT_ID="your-client-id" \
OPENCLAW_GOOGLE_MEET_CLIENT_SECRET="your-client-secret" \
openclaw googlemeet auth login --json
```

Użyj trybu ręcznego, gdy przeglądarka nie może dosięgnąć lokalnego wywołania
zwrotnego:

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
Jeśli obecne są zarówno wartości konfiguracji, jak i środowiska, Plugin najpierw
rozwiązuje konfigurację, a następnie używa środowiska jako opcji awaryjnej.

Zgoda OAuth obejmuje tworzenie przestrzeni Meet, dostęp do odczytu przestrzeni
Meet i dostęp do odczytu mediów konferencji Meet. Jeśli uwierzytelniłeś się
przed dodaniem obsługi tworzenia spotkań, uruchom ponownie
`openclaw googlemeet auth login --json`, aby token odświeżania miał zakres
`meetings.space.created`.

### Zweryfikuj OAuth za pomocą doctor

Uruchom doctor OAuth, gdy chcesz szybką kontrolę kondycji bez sekretów:

```bash
openclaw googlemeet doctor --oauth --json
```

Nie ładuje to środowiska uruchomieniowego Chrome ani nie wymaga połączonego Node
Chrome. Sprawdza, czy istnieje konfiguracja OAuth i czy token odświeżania może
wygenerować token dostępu. Raport JSON zawiera tylko pola stanu, takie jak `ok`,
`configured`, `tokenSource`, `expiresAt` i komunikaty kontroli; nie wypisuje
tokenu dostępu, tokenu odświeżania ani sekretu klienta.

Typowe wyniki:

| Kontrola             | Znaczenie                                                                               |
| -------------------- | --------------------------------------------------------------------------------------- |
| `oauth-config`       | Obecne jest `oauth.clientId` plus `oauth.refreshToken` albo token dostępu w cache.      |
| `oauth-token`        | Token dostępu w cache jest nadal ważny albo token odświeżania wygenerował nowy token dostępu. |
| `meet-spaces-get`    | Opcjonalna kontrola `--meeting` rozwiązała istniejącą przestrzeń Meet.                  |
| `meet-spaces-create` | Opcjonalna kontrola `--create-space` utworzyła nową przestrzeń Meet.                   |

Aby potwierdzić także włączenie Google Meet API i zakres `spaces.create`,
uruchom kontrolę tworzenia z efektem ubocznym:

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
tych kontroli zwykle oznacza, że Google Meet REST API jest wyłączone, token
odświeżania ze zgodą nie ma wymaganego zakresu albo konto Google nie ma dostępu
do tej przestrzeni Meet. Błąd tokenu odświeżania oznacza, że należy ponownie
uruchomić `openclaw googlemeet auth login --json` i zapisać nowy blok `oauth`.

Do awaryjnej ścieżki przeglądarki nie są potrzebne dane uwierzytelniające
OAuth. W tym trybie uwierzytelnianie Google pochodzi z zalogowanego profilu
Chrome na wybranym Node, a nie z konfiguracji OpenClaw.

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

Uruchom preflight przed pracą z multimediami:

```bash
openclaw googlemeet preflight --meeting https://meet.google.com/abc-defg-hij
```

Wyświetl listę artefaktów spotkania i obecności po utworzeniu przez Meet rekordów konferencji:

```bash
openclaw googlemeet artifacts --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet attendance --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet export --meeting https://meet.google.com/abc-defg-hij --output ./meet-export
```

Z `--meeting` polecenia `artifacts` i `attendance` domyślnie używają najnowszego rekordu konferencji. Przekaż `--all-conference-records`, gdy chcesz uzyskać wszystkie zachowane rekordy dla tego spotkania.

Wyszukiwanie w kalendarzu może rozwiązać adres URL spotkania z Google Calendar przed odczytaniem artefaktów Meet:

```bash
openclaw googlemeet latest --today
openclaw googlemeet calendar-events --today --json
openclaw googlemeet artifacts --event "Weekly sync"
openclaw googlemeet attendance --today --format csv --output attendance.csv
```

`--today` przeszukuje dzisiejszy kalendarz `primary` pod kątem wydarzenia Calendar z linkiem Google Meet. Użyj `--event <query>`, aby wyszukać pasujący tekst wydarzenia, oraz `--calendar <id>` dla kalendarza innego niż główny. Wyszukiwanie w kalendarzu wymaga świeżego logowania OAuth obejmującego zakres tylko do odczytu wydarzeń Calendar. `calendar-events` pokazuje podgląd pasujących wydarzeń Meet i oznacza wydarzenie, które wybierze `latest`, `artifacts`, `attendance` lub `export`.

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

`artifacts` zwraca metadane rekordu konferencji oraz metadane zasobów uczestnika, nagrania, transkrypcji, ustrukturyzowanego wpisu transkrypcji i inteligentnej notatki, gdy Google udostępnia je dla spotkania. Użyj `--no-transcript-entries`, aby pominąć wyszukiwanie wpisów przy dużych spotkaniach. `attendance` rozwija uczestników do wierszy sesji uczestników z czasem pierwszego i ostatniego wykrycia, łącznym czasem trwania sesji, flagami spóźnienia i wcześniejszego wyjścia oraz zduplikowanymi zasobami uczestników scalonymi według zalogowanego użytkownika lub nazwy wyświetlanej. Przekaż `--no-merge-duplicates`, aby zachować surowe zasoby uczestników osobno, `--late-after-minutes`, aby dostroić wykrywanie spóźnień, oraz `--early-before-minutes`, aby dostroić wykrywanie wcześniejszego wyjścia.

`export` zapisuje folder zawierający `summary.md`, `attendance.csv`, `transcript.md`, `artifacts.json`, `attendance.json` i `manifest.json`. `manifest.json` rejestruje wybrane wejście, opcje eksportu, rekordy konferencji, pliki wyjściowe, liczby, źródło tokenu, wydarzenie Calendar, gdy zostało użyte, oraz wszelkie ostrzeżenia o częściowym pobraniu. Przekaż `--zip`, aby zapisać także przenośne archiwum obok folderu. Przekaż `--include-doc-bodies`, aby wyeksportować tekst powiązanych transkrypcji i inteligentnych notatek Google Docs przez Google Drive `files.export`; wymaga to świeżego logowania OAuth obejmującego zakres Drive Meet tylko do odczytu. Bez `--include-doc-bodies` eksporty zawierają tylko metadane Meet i ustrukturyzowane wpisy transkrypcji. Jeśli Google zwróci częściową awarię artefaktu, taką jak błąd listowania inteligentnych notatek, wpisu transkrypcji lub treści dokumentu Drive, podsumowanie i manifest zachowują ostrzeżenie zamiast przerywać cały eksport. Użyj `--dry-run`, aby pobrać te same dane artefaktów i obecności oraz wydrukować JSON manifestu bez tworzenia folderu ani pliku ZIP. Jest to przydatne przed zapisaniem dużego eksportu lub gdy agent potrzebuje tylko liczników, wybranych rekordów i ostrzeżeń.

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

Uruchom chroniony test live smoke względem rzeczywistego zachowanego spotkania:

```bash
OPENCLAW_LIVE_TEST=1 \
OPENCLAW_GOOGLE_MEET_LIVE_MEETING=https://meet.google.com/abc-defg-hij \
pnpm test:live -- extensions/google-meet/google-meet.live.test.ts
```

Środowisko live smoke:

- `OPENCLAW_LIVE_TEST=1` włącza chronione testy live.
- `OPENCLAW_GOOGLE_MEET_LIVE_MEETING` wskazuje zachowany adres URL Meet, kod lub
  `spaces/{id}`.
- `OPENCLAW_GOOGLE_MEET_CLIENT_ID` lub `GOOGLE_MEET_CLIENT_ID` dostarcza identyfikator klienta OAuth.
- `OPENCLAW_GOOGLE_MEET_REFRESH_TOKEN` lub `GOOGLE_MEET_REFRESH_TOKEN` dostarcza token odświeżania.
- Opcjonalnie: `OPENCLAW_GOOGLE_MEET_CLIENT_SECRET`,
  `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN` i
  `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT` używają tych samych nazw zastępczych
  bez prefiksu `OPENCLAW_`.

Podstawowy live smoke artefaktów/obecności wymaga
`https://www.googleapis.com/auth/meetings.space.readonly` i
`https://www.googleapis.com/auth/meetings.conference.media.readonly`. Wyszukiwanie w kalendarzu wymaga `https://www.googleapis.com/auth/calendar.events.readonly`. Eksport treści dokumentów Drive wymaga
`https://www.googleapis.com/auth/drive.meet.readonly`.

Utwórz świeżą przestrzeń Meet:

```bash
openclaw googlemeet create
```

Polecenie wypisuje nowy `meeting uri`, źródło i sesję dołączania. Z poświadczeniami OAuth używa oficjalnego interfejsu Google Meet API. Bez poświadczeń OAuth używa jako rozwiązania zastępczego zalogowanego profilu przeglądarki przypiętego węzła Chrome. Agenci mogą użyć narzędzia `google_meet` z `action: "create"`, aby utworzyć i dołączyć w jednym kroku. Do utworzenia samego adresu URL przekaż `"join": false`.

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

Jeśli rozwiązanie zastępcze przeglądarki napotka logowanie Google lub blokadę uprawnień Meet, zanim zdoła utworzyć adres URL, metoda Gateway zwraca nieudaną odpowiedź, a narzędzie `google_meet` zwraca ustrukturyzowane szczegóły zamiast zwykłego ciągu znaków:

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

Gdy agent zobaczy `manualActionRequired: true`, powinien zgłosić `manualActionMessage` wraz z kontekstem węzła/karty przeglądarki i przestać otwierać nowe karty Meet, dopóki operator nie ukończy kroku w przeglądarce.

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

Tworzenie Meet domyślnie dołącza do spotkania. Transport Chrome lub Chrome-node nadal wymaga zalogowanego profilu Google Chrome, aby dołączyć przez przeglądarkę. Jeśli profil jest wylogowany, OpenClaw zgłasza `manualActionRequired: true` lub błąd rozwiązania zastępczego przeglądarki i prosi operatora o ukończenie logowania Google przed ponowną próbą.

Ustaw `preview.enrollmentAcknowledged: true` dopiero po potwierdzeniu, że Twój projekt Cloud, podmiot OAuth i uczestnicy spotkania są zapisani do programu Google Workspace Developer Preview Program dla interfejsów Meet media APIs.

## Konfiguracja

Wspólna ścieżka czasu rzeczywistego Chrome wymaga tylko włączonego pluginu, BlackHole, SoX i klucza dostawcy głosu czasu rzeczywistego backendu. OpenAI jest domyślne; ustaw `realtime.provider: "google"`, aby użyć Google Gemini Live:

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
- `chrome.guestName: "OpenClaw Agent"`: nazwa używana na ekranie gościa Meet po wylogowaniu
- `chrome.autoJoin: true`: wypełnianie nazwy gościa i kliknięcie Join Now przez automatyzację przeglądarki OpenClaw na `chrome-node` w trybie best-effort
- `chrome.reuseExistingTab: true`: aktywuj istniejącą kartę Meet zamiast otwierać duplikaty
- `chrome.waitForInCallMs: 20000`: poczekaj, aż karta Meet zgłosi stan połączenia, zanim zostanie wyzwolone wprowadzenie czasu rzeczywistego
- `chrome.audioFormat: "pcm16-24khz"`: format audio pary poleceń. Używaj
  `"g711-ulaw-8khz"` tylko dla starszych/niestandardowych par poleceń, które nadal emitują
  dźwięk telefoniczny.
- `chrome.audioInputCommand`: polecenie SoX odczytujące z CoreAudio `BlackHole 2ch`
  i zapisujące audio w `chrome.audioFormat`
- `chrome.audioOutputCommand`: polecenie SoX odczytujące audio w `chrome.audioFormat`
  i zapisujące do CoreAudio `BlackHole 2ch`
- `realtime.provider: "openai"`
- `realtime.toolPolicy: "safe-read-only"`
- `realtime.instructions`: krótkie odpowiedzi mówione, z
  `openclaw_agent_consult` dla głębszych odpowiedzi
- `realtime.introMessage`: krótki mówiony test gotowości, gdy most czasu rzeczywistego
  się łączy; ustaw na `""`, aby dołączyć po cichu
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

`voiceCall.enabled` domyślnie ma wartość `true`; z transportem Twilio deleguje rzeczywiste połączenie PSTN i DTMF do pluginu Voice Call. Jeśli `voice-call` nie jest włączony, Google Meet nadal może zweryfikować i zapisać plan wybierania numeru, ale nie może wykonać połączenia Twilio.

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
`transport: "chrome-node"`, gdy Chrome działa na sparowanym węźle, takim jak VM
Parallels. W obu przypadkach model czasu rzeczywistego i `openclaw_agent_consult` działają na
hoście Gateway, więc dane uwierzytelniające modelu pozostają tam.

Użyj `action: "status"`, aby wyświetlić aktywne sesje lub sprawdzić identyfikator sesji. Użyj
`action: "speak"` z `sessionId` i `message`, aby agent czasu rzeczywistego
natychmiast przemówił. Użyj `action: "test_speech"`, aby utworzyć lub ponownie użyć sesji,
wyzwolić znaną frazę i zwrócić stan `inCall`, gdy host Chrome może go
zgłosić. `test_speech` zawsze wymusza `mode: "realtime"` i kończy się niepowodzeniem, jeśli ma
działać w `mode: "transcribe"`, ponieważ sesje tylko obserwujące celowo nie mogą
emitować mowy. Wynik `speechOutputVerified` opiera się na zwiększeniu liczby bajtów wyjściowego audio czasu rzeczywistego
podczas tego wywołania testowego, więc ponownie użyta sesja ze starszym audio
nie liczy się jako świeżo pomyślne sprawdzenie mowy. Użyj `action: "leave"`, aby oznaczyć
sesję jako zakończoną.

`status` zawiera stan Chrome, gdy jest dostępny:

- `inCall`: Chrome wygląda na obecny w rozmowie Meet
- `micMuted`: najlepsze możliwe ustalenie stanu mikrofonu Meet
- `manualActionRequired` / `manualActionReason` / `manualActionMessage`: profil
  przeglądarki wymaga ręcznego logowania, dopuszczenia przez hosta Meet, uprawnień lub
  naprawy sterowania przeglądarką, zanim mowa będzie mogła działać
- `speechReady` / `speechBlockedReason` / `speechBlockedMessage`: czy
  zarządzana mowa Chrome jest teraz dozwolona. `speechReady: false` oznacza, że OpenClaw nie
  wysłał frazy wprowadzającej/testowej do mostka audio.
- `providerConnected` / `realtimeReady`: stan głosowego mostka czasu rzeczywistego
- `lastInputAt` / `lastOutputAt`: ostatnie audio odebrane z mostka lub wysłane do niego

```json
{
  "action": "speak",
  "sessionId": "meet_...",
  "message": "Say exactly: I'm here and listening."
}
```

## Konsultacja agenta w czasie rzeczywistym

Tryb czasu rzeczywistego Chrome jest zoptymalizowany pod kątem pętli głosowej na żywo. Głosowy
dostawca czasu rzeczywistego słyszy audio spotkania i mówi przez skonfigurowany mostek audio.
Gdy model czasu rzeczywistego potrzebuje głębszego rozumowania, bieżących informacji lub normalnych
narzędzi OpenClaw, może wywołać `openclaw_agent_consult`.

Narzędzie konsultacji uruchamia zwykłego agenta OpenClaw w tle z ostatnim
kontekstem transkrypcji spotkania i zwraca zwięzłą odpowiedź mówioną do sesji głosowej
czasu rzeczywistego. Model głosowy może następnie wypowiedzieć tę odpowiedź na spotkaniu.
Używa tego samego współdzielonego narzędzia konsultacji czasu rzeczywistego co Voice Call.

Domyślnie konsultacje działają względem agenta `main`. Ustaw `realtime.agentId`, gdy tor
Meet ma konsultować się z dedykowaną przestrzenią roboczą agenta OpenClaw, domyślnymi ustawieniami modelu,
polityką narzędzi, pamięcią i historią sesji.

`realtime.toolPolicy` kontroluje uruchomienie konsultacji:

- `safe-read-only`: udostępnij narzędzie konsultacji i ogranicz zwykłego agenta do
  `read`, `web_search`, `web_fetch`, `x_search`, `memory_search` i
  `memory_get`.
- `owner`: udostępnij narzędzie konsultacji i pozwól zwykłemu agentowi używać normalnej
  polityki narzędzi agenta.
- `none`: nie udostępniaj narzędzia konsultacji modelowi głosowemu czasu rzeczywistego.

Klucz sesji konsultacji jest ograniczony do danej sesji Meet, więc kolejne wywołania konsultacji
mogą ponownie używać wcześniejszego kontekstu konsultacji podczas tego samego spotkania.

Aby wymusić mówione sprawdzenie gotowości po pełnym dołączeniu Chrome do rozmowy:

```bash
openclaw googlemeet speak meet_... "Say exactly: I'm here and listening."
```

Dla pełnego smoke testu dołączenia i mówienia:

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

- `googlemeet setup` jest w całości zielony.
- `googlemeet setup` zawiera `chrome-node-connected`, gdy Chrome-node jest
  domyślnym transportem albo przypięto węzeł.
- `nodes status` pokazuje, że wybrany węzeł jest połączony.
- Wybrany węzeł ogłasza zarówno `googlemeet.chrome`, jak i `browser.proxy`.
- Karta Meet dołącza do rozmowy, a `test-speech` zwraca stan Chrome z
  `inCall: true`.

Dla zdalnego hosta Chrome, takiego jak VM Parallels macOS, jest to najkrótsze
bezpieczne sprawdzenie po aktualizacji Gateway albo VM:

```bash
openclaw googlemeet setup
openclaw nodes status --connected
openclaw nodes invoke \
  --node parallels-macos \
  --command googlemeet.chrome \
  --params '{"action":"setup"}'
```

To dowodzi, że Plugin Gateway jest załadowany, węzeł VM jest połączony z
bieżącym tokenem, a mostek audio Meet jest dostępny, zanim agent otworzy
prawdziwą kartę spotkania.

Dla smoke testu Twilio użyj spotkania, które udostępnia szczegóły połączenia telefonicznego:

```bash
openclaw googlemeet setup
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --pin 123456
```

Oczekiwany stan Twilio:

- `googlemeet setup` zawiera zielone sprawdzenia `twilio-voice-call-plugin` i
  `twilio-voice-call-credentials`.
- `voicecall` jest dostępne w CLI po ponownym załadowaniu Gateway.
- Zwrócona sesja ma `transport: "twilio"` i `twilio.voiceCallId`.
- `googlemeet leave <sessionId>` rozłącza delegowane połączenie głosowe.

## Rozwiązywanie problemów

### Agent nie widzi narzędzia Google Meet

Potwierdź, że Plugin jest włączony w konfiguracji Gateway, i ponownie załaduj Gateway:

```bash
openclaw plugins list | grep google-meet
openclaw googlemeet setup
```

Jeśli właśnie edytowano `plugins.entries.google-meet`, uruchom ponownie lub ponownie załaduj Gateway.
Działający agent widzi tylko narzędzia Plugin zarejestrowane przez bieżący proces Gateway.

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

Węzeł musi być połączony i wyświetlać `googlemeet.chrome` oraz `browser.proxy`.
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

Jeśli `googlemeet setup` nie przechodzi `chrome-node-connected` albo dziennik Gateway zgłasza
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

Następnie ponownie załaduj usługę węzła i uruchom ponownie:

```bash
openclaw googlemeet setup
openclaw nodes status --connected
```

### Przeglądarka otwiera się, ale agent nie może dołączyć

Uruchom `googlemeet test-speech` i sprawdź zwrócony stan Chrome. Jeśli
zgłasza `manualActionRequired: true`, pokaż `manualActionMessage` operatorowi
i przestań ponawiać próby, dopóki działanie w przeglądarce nie zostanie ukończone.

Typowe działania ręczne:

- Zaloguj się do profilu Chrome.
- Dopuść gościa z konta hosta Meet.
- Nadaj uprawnienia mikrofonu/kamery Chrome, gdy pojawi się natywny monit uprawnień
  Chrome.
- Zamknij lub napraw zablokowane okno dialogowe uprawnień Meet.

Nie zgłaszaj „brak zalogowania” tylko dlatego, że Meet pokazuje „Do you want people to
hear you in the meeting?” To ekran pośredni wyboru audio Meet; OpenClaw
klika **Use microphone** przez automatyzację przeglądarki, gdy jest dostępna, i dalej
czeka na rzeczywisty stan spotkania. Dla awaryjnego trybu przeglądarki tylko do tworzenia OpenClaw
może kliknąć **Continue without microphone**, ponieważ utworzenie URL-a nie wymaga
ścieżki audio czasu rzeczywistego.

### Tworzenie spotkania kończy się niepowodzeniem

`googlemeet create` najpierw używa punktu końcowego API Google Meet `spaces.create`,
gdy skonfigurowano dane uwierzytelniające OAuth. Bez danych uwierzytelniających OAuth przełącza się awaryjnie
na przeglądarkę przypiętego węzła Chrome. Potwierdź:

- Dla tworzenia przez API: skonfigurowano `oauth.clientId` i `oauth.refreshToken`
  albo są obecne pasujące zmienne środowiskowe `OPENCLAW_GOOGLE_MEET_*`.
- Dla tworzenia przez API: token odświeżania został wygenerowany po dodaniu obsługi tworzenia.
  Starszym tokenom może brakować zakresu `meetings.space.created`; uruchom ponownie
  `openclaw googlemeet auth login --json` i zaktualizuj konfigurację Plugin.
- Dla awaryjnego trybu przeglądarki: `defaultTransport: "chrome-node"` i
  `chromeNode.node` wskazują połączony węzeł z `browser.proxy` i
  `googlemeet.chrome`.
- Dla awaryjnego trybu przeglądarki: profil OpenClaw Chrome na tym węźle jest zalogowany
  do Google i może otworzyć `https://meet.google.com/new`.
- Dla awaryjnego trybu przeglądarki: ponowne próby używają istniejącej karty `https://meet.google.com/new`
  lub monitu konta Google przed otwarciem nowej karty. Jeśli agent przekroczy limit czasu,
  ponów wywołanie narzędzia zamiast ręcznie otwierać kolejną kartę Meet.
- Dla awaryjnego trybu przeglądarki: jeśli narzędzie zwraca `manualActionRequired: true`, użyj
  zwróconych `browser.nodeId`, `browser.targetId`, `browserUrl` i
  `manualActionMessage`, aby poprowadzić operatora. Nie ponawiaj w pętli, dopóki to
  działanie nie zostanie ukończone.
- Dla awaryjnego trybu przeglądarki: jeśli Meet pokazuje „Do you want people to hear you in the
  meeting?”, pozostaw kartę otwartą. OpenClaw powinien kliknąć **Use microphone** albo, dla
  awaryjnego trybu tylko do tworzenia, **Continue without microphone** przez automatyzację
  przeglądarki i dalej czekać na wygenerowany URL Meet. Jeśli nie może, błąd
  powinien wspominać `meet-audio-choice-required`, a nie `google-login-required`.

### Agent dołącza, ale nie mówi

Sprawdź ścieżkę czasu rzeczywistego:

```bash
openclaw googlemeet setup
openclaw googlemeet doctor
```

Użyj `mode: "realtime"` do słuchania/odpowiadania głosem. `mode: "transcribe"` celowo
nie uruchamia dupleksowego głosowego mostka czasu rzeczywistego. `googlemeet test-speech`
zawsze sprawdza ścieżkę czasu rzeczywistego i raportuje, czy dla tego wywołania
zaobserwowano wyjściowe bajty mostka. Jeśli `speechOutputVerified` jest false, a
`speechOutputTimedOut` jest true, dostawca czasu rzeczywistego mógł zaakceptować
wypowiedź, ale OpenClaw nie zobaczył, aby nowe bajty wyjściowe dotarły do mostka audio
Chrome.

Zweryfikuj także:

- Klucz dostawcy czasu rzeczywistego jest dostępny na hoście Gateway, taki jak
  `OPENAI_API_KEY` lub `GEMINI_API_KEY`.
- `BlackHole 2ch` jest widoczny na hoście Chrome.
- `sox` istnieje na hoście Chrome.
- Mikrofon i głośnik Meet są kierowane przez wirtualną ścieżkę audio używaną przez
  OpenClaw.

`googlemeet doctor [session-id]` wypisuje sesję, węzeł, stan w rozmowie,
przyczynę działania ręcznego, połączenie dostawcy czasu rzeczywistego, `realtimeReady`, aktywność
wejścia/wyjścia audio, ostatnie znaczniki czasu audio, liczniki bajtów i URL przeglądarki.
Użyj `googlemeet status [session-id]`, gdy potrzebujesz surowego JSON. Użyj
`googlemeet doctor --oauth`, gdy musisz zweryfikować odświeżanie OAuth Google Meet
bez ujawniania tokenów; dodaj `--meeting` lub `--create-space`, gdy potrzebujesz również
dowodu z API Google Meet.

Jeśli agent przekroczył limit czasu i widzisz już otwartą kartę Meet, sprawdź tę kartę
bez otwierania kolejnej:

```bash
openclaw googlemeet recover-tab
openclaw googlemeet recover-tab https://meet.google.com/abc-defg-hij
```

Równoważna akcja narzędzia to `recover_current_tab`. Ustawia fokus i sprawdza
istniejącą kartę Meet dla wybranego transportu. Z `chrome` używa lokalnego
sterowania przeglądarką przez Gateway; z `chrome-node` używa skonfigurowanego
węzła Chrome. Nie otwiera nowej karty ani nie tworzy nowej sesji; raportuje
bieżącą blokadę, taką jak logowanie, dopuszczenie, uprawnienia lub stan wyboru audio.
Polecenie CLI komunikuje się ze skonfigurowanym Gateway, więc Gateway musi działać;
`chrome-node` wymaga też, aby węzeł Chrome był połączony.

### Sprawdzenia konfiguracji Twilio kończą się niepowodzeniem

`twilio-voice-call-plugin` kończy się niepowodzeniem, gdy `voice-call` nie jest dozwolony lub nie jest włączony.
Dodaj go do `plugins.allow`, włącz `plugins.entries.voice-call` i przeładuj
Gateway.

`twilio-voice-call-credentials` kończy się niepowodzeniem, gdy backend Twilio nie ma
identyfikatora SID konta, tokenu uwierzytelniania lub numeru dzwoniącego. Ustaw je na hoście Gateway:

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
```

Następnie zrestartuj lub przeładuj Gateway i uruchom:

```bash
openclaw googlemeet setup
openclaw voicecall setup
openclaw voicecall smoke
```

`voicecall smoke` domyślnie sprawdza tylko gotowość. Aby wykonać próbę dla konkretnego numeru:

```bash
openclaw voicecall smoke --to "+15555550123"
```

Dodaj `--yes` tylko wtedy, gdy celowo chcesz wykonać wychodzące połączenie
powiadamiające na żywo:

```bash
openclaw voicecall smoke --to "+15555550123" --yes
```

### Połączenie Twilio rozpoczyna się, ale nigdy nie dołącza do spotkania

Upewnij się, że wydarzenie Meet udostępnia dane do połączenia telefonicznego. Podaj dokładny
numer dostępowy i PIN albo niestandardową sekwencję DTMF:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --dtmf-sequence ww123456#
```

Użyj początkowego `w` lub przecinków w `--dtmf-sequence`, jeśli dostawca wymaga pauzy
przed wprowadzeniem PIN-u.

## Uwagi

Oficjalne API multimediów Google Meet jest ukierunkowane na odbiór, więc mówienie w
połączeniu Meet nadal wymaga ścieżki uczestnika. Ten Plugin utrzymuje tę granicę widoczną:
Chrome obsługuje uczestnictwo w przeglądarce i lokalne kierowanie dźwięku; Twilio obsługuje
uczestnictwo przez telefoniczne połączenie dostępowe.

Tryb czasu rzeczywistego Chrome wymaga `BlackHole 2ch` oraz jednego z poniższych:

- `chrome.audioInputCommand` plus `chrome.audioOutputCommand`: OpenClaw zarządza
  mostem modelu czasu rzeczywistego i przesyła dźwięk w `chrome.audioFormat` między tymi
  poleceniami a wybranym dostawcą głosu czasu rzeczywistego. Domyślna ścieżka Chrome to
  24 kHz PCM16; 8 kHz G.711 mu-law pozostaje dostępne dla starszych par poleceń.
- `chrome.audioBridgeCommand`: zewnętrzne polecenie mostu zarządza całą lokalną
  ścieżką dźwięku i musi zakończyć działanie po uruchomieniu lub zweryfikowaniu swojego demona.

Aby uzyskać czysty dźwięk dwukierunkowy, skieruj wyjście Meet i mikrofon Meet przez oddzielne
urządzenia wirtualne albo graf urządzeń wirtualnych w stylu Loopback. Jedno współdzielone
urządzenie BlackHole może odbijać innych uczestników z powrotem do połączenia.

`googlemeet speak` uruchamia aktywny most dźwięku czasu rzeczywistego dla sesji Chrome.
`googlemeet leave` zatrzymuje ten most. W przypadku sesji Twilio delegowanych
przez Plugin Voice Call `leave` także rozłącza bazowe połączenie głosowe.

## Powiązane

- [Plugin połączeń głosowych](/pl/plugins/voice-call)
- [Tryb rozmowy](/pl/nodes/talk)
- [Tworzenie pluginów](/pl/plugins/building-plugins)
