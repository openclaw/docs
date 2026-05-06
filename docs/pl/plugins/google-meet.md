---
read_when:
    - Chcesz, aby agent OpenClaw dołączył do spotkania w Google Meet
    - Chcesz, aby agent OpenClaw utworzył nowe spotkanie w Google Meet
    - Konfigurujesz Chrome, węzeł Chrome lub Twilio jako transport Google Meet
summary: 'Plugin Google Meet: dołączanie do wprost podanych adresów URL Meet przez Chrome lub Twilio z domyślnymi ustawieniami odpowiedzi zwrotnej agenta'
title: Plugin Google Meet
x-i18n:
    generated_at: "2026-05-06T17:58:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4b154e9cbce560dbc8327a140b27c17d2614d13d7011032a48b110314772ab0c
    source_path: plugins/google-meet.md
    workflow: 16
---

Obsługa uczestnika Google Meet dla OpenClaw — Plugin jest z założenia jawny:

- Dołącza tylko do jawnego adresu URL `https://meet.google.com/...`.
- Może utworzyć nową przestrzeń Meet przez Google Meet API, a następnie dołączyć do
  zwróconego adresu URL.
- `agent` to domyślny tryb odpowiedzi głosowej: transkrypcja w czasie rzeczywistym nasłuchuje,
  skonfigurowany agent OpenClaw odpowiada, a standardowe OpenClaw TTS mówi w Meet.
- `bidi` pozostaje dostępny jako zapasowy tryb bezpośredniego modelu głosowego czasu rzeczywistego.
- Agenci wybierają sposób dołączenia za pomocą `mode`: użyj `agent` do nasłuchiwania
  i odpowiedzi głosowej na żywo, `bidi` jako bezpośredniej zapasowej obsługi głosu w czasie rzeczywistym albo `transcribe`
  do dołączenia/sterowania przeglądarką bez mostka odpowiedzi głosowej.
- Uwierzytelnianie zaczyna się jako osobisty Google OAuth albo już zalogowany profil Chrome.
- Nie ma automatycznego komunikatu o zgodzie.
- Domyślnym backendem audio Chrome jest `BlackHole 2ch`.
- Chrome może działać lokalnie albo na sparowanym hoście Node.
- Twilio przyjmuje numer do wdzwonienia oraz opcjonalny PIN lub sekwencję DTMF; nie
  może bezpośrednio wybrać adresu URL Meet.
- Polecenie CLI to `googlemeet`; `meet` jest zarezerwowane dla szerszych przepływów
  telekonferencji agentów.

## Szybki start

Zainstaluj lokalne zależności audio i skonfiguruj dostawcę transkrypcji w czasie rzeczywistym
oraz standardowe OpenClaw TTS. OpenAI jest domyślnym dostawcą transkrypcji;
Google Gemini Live działa też jako oddzielny zapasowy tryb głosowy `bidi` z
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

Dane wyjściowe konfiguracji są przeznaczone do odczytu przez agenta i uwzględniają tryb. Raportują profil Chrome,
przypięcie Node oraz, dla dołączeń Chrome w czasie rzeczywistym, mostek audio
BlackHole/SoX i opóźnione kontrole wprowadzenia czasu rzeczywistego. Dla dołączeń tylko obserwacyjnych sprawdź ten sam
transport za pomocą `--mode transcribe`; ten tryb pomija wymagania wstępne audio czasu rzeczywistego,
ponieważ nie nasłuchuje ani nie mówi przez mostek:

```bash
openclaw googlemeet setup --transport chrome-node --mode transcribe
```

Gdy delegowanie Twilio jest skonfigurowane, konfiguracja raportuje też, czy
Plugin `voice-call`, poświadczenia Twilio i publiczna ekspozycja Webhook są gotowe.
Traktuj każdą kontrolę `ok: false` jako blokadę dla sprawdzanego transportu i trybu
przed poproszeniem agenta o dołączenie. Użyj `openclaw googlemeet setup --json` dla
skryptów lub danych wyjściowych czytelnych maszynowo. Użyj `--transport chrome`,
`--transport chrome-node` albo `--transport twilio`, aby wstępnie sprawdzić konkretny
transport, zanim agent go spróbuje.

Dla Twilio zawsze sprawdzaj transport jawnie, gdy domyślnym transportem
jest Chrome:

```bash
openclaw googlemeet setup --transport twilio
```

To wykrywa brakujące połączenia `voice-call`, poświadczenia Twilio lub nieosiągalną
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
  "mode": "agent"
}
```

Narzędzie `google_meet` dostępne dla agentów pozostaje dostępne na hostach innych niż macOS dla
artefaktów, kalendarza, konfiguracji, transkrypcji, Twilio i przepływów `chrome-node`. Lokalne
akcje odpowiedzi głosowej Chrome są tam blokowane, ponieważ dołączona ścieżka audio Chrome
obecnie zależy od macOS `BlackHole 2ch`. W systemie Linux użyj `mode: "transcribe"`,
wdzwonienia Twilio albo hosta macOS `chrome-node` do uczestnictwa Chrome z odpowiedzią głosową.

Utwórz nowe spotkanie i dołącz do niego:

```bash
openclaw googlemeet create --transport chrome-node --mode agent
```

Dla pokoi utworzonych przez API użyj Google Meet `SpaceConfig.accessType`, gdy chcesz,
aby polityka wejścia bez pukania była jawna zamiast dziedziczona z domyślnych ustawień konta Google:

```bash
openclaw googlemeet create --access-type OPEN --transport chrome-node --mode agent
```

`OPEN` pozwala każdemu z adresem URL Meet dołączyć bez pukania. `TRUSTED` pozwala
zaufanym użytkownikom organizacji gospodarza, zaproszonym użytkownikom zewnętrznym i użytkownikom
wdzwaniającym się dołączyć bez pukania. `RESTRICTED` ogranicza wejście bez pukania do zaproszonych. Te
ustawienia dotyczą tylko oficjalnej ścieżki tworzenia Google Meet API, więc poświadczenia
OAuth muszą być skonfigurowane.

Jeśli uwierzytelniłeś Google Meet, zanim ta opcja była dostępna, uruchom ponownie
`openclaw googlemeet auth login --json` po dodaniu zakresu
`meetings.space.settings` do ekranu zgody Google OAuth.

Utwórz tylko adres URL bez dołączania:

```bash
openclaw googlemeet create --no-join
```

`googlemeet create` ma dwie ścieżki:

- Tworzenie API: używane, gdy skonfigurowane są poświadczenia Google Meet OAuth. To
  najbardziej deterministyczna ścieżka i nie zależy od stanu interfejsu przeglądarki.
- Zapasowa ścieżka przeglądarki: używana, gdy brakuje poświadczeń OAuth. OpenClaw używa
  przypiętego Node Chrome, otwiera `https://meet.google.com/new`, czeka, aż Google
  przekieruje do rzeczywistego adresu URL z kodem spotkania, a następnie zwraca ten adres URL. Ta ścieżka wymaga,
  aby profil OpenClaw Chrome na Node był już zalogowany w Google.
  Automatyzacja przeglądarki obsługuje własny monit Meet o mikrofon przy pierwszym uruchomieniu; ten monit
  nie jest traktowany jako błąd logowania Google.
  Przepływy dołączania i tworzenia próbują też ponownie użyć istniejącej karty Meet przed otwarciem
  nowej. Dopasowanie ignoruje nieszkodliwe ciągi zapytania URL, takie jak `authuser`, więc
  ponowienie przez agenta powinno ustawić fokus na już otwartym spotkaniu zamiast tworzyć drugą
  kartę Chrome.

Dane wyjściowe polecenia/narzędzia zawierają pole `source` (`api` albo `browser`), aby agenci
mogli wyjaśnić, która ścieżka została użyta. `create` domyślnie dołącza do nowego spotkania i
zwraca `joined: true` oraz sesję dołączenia. Aby tylko utworzyć adres URL, użyj
`create --no-join` w CLI albo przekaż `"join": false` do narzędzia.

Albo powiedz agentowi: „Utwórz Google Meet, dołącz do niego w trybie odpowiedzi głosowej agenta
i wyślij mi link”. Agent powinien wywołać `google_meet` z
`action: "create"`, a następnie udostępnić zwrócone `meetingUri`.

```json
{
  "action": "create",
  "transport": "chrome-node",
  "mode": "agent"
}
```

Dla dołączenia tylko obserwacyjnego/sterowania przeglądarką ustaw `"mode": "transcribe"`. To nie
uruchamia dupleksowego mostka głosowego czasu rzeczywistego, nie wymaga BlackHole ani SoX
i nie będzie odpowiadać głosowo w spotkaniu. Dołączenia Chrome w tym trybie także unikają
przyznawania uprawnień OpenClaw do mikrofonu/kamery i unikają ścieżki Meet **Użyj
mikrofonu**. Jeśli Meet wyświetli ekran wyboru audio, automatyzacja próbuje
ścieżki bez mikrofonu, a w przeciwnym razie raportuje ręczne działanie zamiast otwierać
lokalny mikrofon. W trybie transkrypcji zarządzane transporty Chrome instalują też
obserwator napisów Meet na zasadzie najlepszej próby. `googlemeet status --json` i
`googlemeet doctor` pokazują `captioning`, `captionsEnabledAttempted`,
`transcriptLines`, `lastCaptionAt`, `lastCaptionSpeaker`, `lastCaptionText`
oraz krótki ogon `recentTranscript`, aby operatorzy mogli stwierdzić, czy przeglądarka
dołączyła do rozmowy i czy napisy Meet produkują tekst.
Użyj `openclaw googlemeet test-listen <meet-url> --transport chrome-node`, gdy
potrzebujesz sondy tak/nie: dołącza w trybie transkrypcji, czeka na świeże napisy lub
ruch transkryptu i zwraca `listenVerified`, `listenTimedOut`, pola działań ręcznych
oraz najnowszy stan napisów.

Podczas sesji czasu rzeczywistego status `google_meet` zawiera stan przeglądarki i mostka audio,
taki jak `inCall`, `manualActionRequired`, `providerConnected`,
`realtimeReady`, `audioInputActive`, `audioOutputActive`, ostatnie znaczniki czasu wejścia/wyjścia,
liczniki bajtów i stan zamknięcia mostka. Jeśli pojawi się bezpieczny monit strony Meet,
automatyzacja przeglądarki obsługuje go, gdy może. Logowanie, dopuszczenie przez gospodarza i
monity uprawnień przeglądarki/systemu OS są raportowane jako działanie ręczne z powodem i
komunikatem do przekazania przez agenta. Zarządzane sesje Chrome emitują wprowadzenie lub
frazę testową dopiero po tym, jak stan przeglądarki zgłosi `inCall: true`; w przeciwnym razie status raportuje
`speechReady: false`, a próba mówienia jest blokowana zamiast udawać, że
agent mówił do spotkania.

Lokalne dołączenia Chrome używają zalogowanego profilu przeglądarki OpenClaw. Tryb czasu rzeczywistego
wymaga `BlackHole 2ch` dla ścieżki mikrofonu/głośnika używanej przez OpenClaw. Aby uzyskać
czyste audio dupleksowe, użyj oddzielnych urządzeń wirtualnych albo grafu w stylu Loopback; pojedyncze
urządzenie BlackHole wystarczy do pierwszego testu dymnego, ale może powodować echo.

### Lokalny Gateway + Parallels Chrome

Nie potrzebujesz pełnego OpenClaw Gateway ani klucza API modelu wewnątrz maszyny wirtualnej macOS
tylko po to, aby VM zarządzała Chrome. Uruchom Gateway i agenta lokalnie, a następnie uruchom
host Node w VM. Włącz dołączony Plugin na VM jeden raz, aby Node
ogłaszał polecenie Chrome:

Co działa gdzie:

- Host Gateway: OpenClaw Gateway, przestrzeń robocza agenta, klucze modelu/API, dostawca czasu rzeczywistego
  i konfiguracja Plugin Google Meet.
- Maszyna wirtualna Parallels macOS: OpenClaw CLI/host Node, Google Chrome, SoX, BlackHole 2ch
  oraz profil Chrome zalogowany w Google.
- Niepotrzebne w VM: usługa Gateway, konfiguracja agenta, klucz OpenAI/GPT ani konfiguracja
  dostawcy modelu.

Zainstaluj zależności VM:

```bash
brew install blackhole-2ch sox
```

Uruchom ponownie VM po instalacji BlackHole, aby macOS udostępnił `BlackHole 2ch`:

```bash
sudo reboot
```

Po ponownym uruchomieniu zweryfikuj, czy VM widzi urządzenie audio i polecenia SoX:

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

Jeśli `<gateway-host>` jest adresem IP LAN i nie używasz TLS, Node odmówi
połączenia WebSocket zwykłym tekstem, chyba że jawnie zgodzisz się na tę zaufaną sieć prywatną:

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

Potwierdź, że Gateway widzi Node i że ogłasza zarówno `googlemeet.chrome`,
jak i możliwość przeglądarki/`browser.proxy`:

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

Dla jedno-poleceniowego testu dymnego, który tworzy lub ponownie używa sesji, wypowiada znaną
frazę i drukuje stan sesji:

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij
```

Podczas dołączania w czasie rzeczywistym automatyzacja przeglądarki OpenClaw wypełnia nazwę gościa, klika Join/Ask to join i akceptuje pierwszy wybór Meet „Use microphone”, gdy pojawi się ten monit. Podczas dołączania tylko w trybie obserwacji albo tworzenia spotkania wyłącznie w przeglądarce przechodzi przez ten sam monit bez mikrofonu, gdy taka opcja jest dostępna. Jeśli profil przeglądarki nie jest zalogowany, Meet czeka na dopuszczenie przez hosta, Chrome potrzebuje uprawnień do mikrofonu/kamery dla dołączenia w czasie rzeczywistym albo Meet utknął na monicie, którego automatyzacja nie mogła rozwiązać, wynik join/test-speech zgłasza `manualActionRequired: true` z `manualActionReason` i `manualActionMessage`. Agenci powinni przestać ponawiać dołączenie, zgłosić dokładnie ten komunikat wraz z bieżącymi `browserUrl`/`browserTitle` i ponowić próbę dopiero po wykonaniu ręcznej akcji w przeglądarce.

Jeśli `chromeNode.node` jest pominięte, OpenClaw wybiera automatycznie tylko wtedy, gdy dokładnie jeden połączony Node ogłasza zarówno `googlemeet.chrome`, jak i sterowanie przeglądarką. Jeśli połączonych jest kilka zdolnych Node, ustaw `chromeNode.node` na identyfikator Node, nazwę wyświetlaną albo zdalny adres IP.

Typowe kontrole awarii:

- `Configured Google Meet node ... is not usable: offline`: przypięty Node jest znany Gateway, ale niedostępny. Agenci powinni traktować ten Node jako stan diagnostyczny, a nie jako użyteczny host Chrome, i zgłosić blokadę konfiguracji zamiast przechodzić awaryjnie na inny transport, chyba że użytkownik o to poprosił.
- `No connected Google Meet-capable node`: uruchom `openclaw node run` w VM, zatwierdź parowanie i upewnij się, że `openclaw plugins enable google-meet` oraz `openclaw plugins enable browser` zostały uruchomione w VM. Potwierdź też, że host Gateway zezwala na oba polecenia Node przez `gateway.nodes.allowCommands: ["googlemeet.chrome", "browser.proxy"]`.
- `BlackHole 2ch audio device not found`: zainstaluj `blackhole-2ch` na sprawdzanym hoście i uruchom ponownie przed użyciem lokalnego dźwięku Chrome.
- `BlackHole 2ch audio device not found on the node`: zainstaluj `blackhole-2ch` w VM i uruchom VM ponownie.
- Chrome otwiera się, ale nie może dołączyć: zaloguj się w profilu przeglądarki wewnątrz VM albo pozostaw ustawione `chrome.guestName` dla dołączania jako gość. Automatyczne dołączanie jako gość używa automatyzacji przeglądarki OpenClaw przez proxy przeglądarki Node; upewnij się, że konfiguracja przeglądarki Node wskazuje profil, którego chcesz użyć, na przykład `browser.defaultProfile: "user"` albo nazwany profil istniejącej sesji.
- Zduplikowane karty Meet: pozostaw włączone `chrome.reuseExistingTab: true`. OpenClaw aktywuje istniejącą kartę dla tego samego URL Meet przed otwarciem nowej, a tworzenie spotkania w przeglądarce ponownie używa trwającej karty `https://meet.google.com/new` albo karty monitu konta Google przed otwarciem kolejnej.
- Brak dźwięku: w Meet skieruj mikrofon/głośnik przez ścieżkę wirtualnego urządzenia audio używaną przez OpenClaw; użyj oddzielnych urządzeń wirtualnych albo routingu w stylu Loopback dla czystego dźwięku dwukierunkowego.

## Uwagi instalacyjne

Domyślne odtwarzanie zwrotne Chrome używa dwóch zewnętrznych narzędzi:

- `sox`: narzędzie audio wiersza poleceń. Plugin używa jawnych poleceń urządzeń CoreAudio dla domyślnego mostka audio PCM16 24 kHz.
- `blackhole-2ch`: wirtualny sterownik audio macOS. Tworzy urządzenie audio `BlackHole 2ch`, przez które Chrome/Meet mogą routować dźwięk.

OpenClaw nie dołącza ani nie redystrybuuje żadnego z tych pakietów. Dokumentacja prosi użytkowników o instalowanie ich jako zależności hosta przez Homebrew. SoX jest licencjonowany jako `LGPL-2.0-only AND GPL-2.0-only`; BlackHole jest objęty GPL-3.0. Jeśli budujesz instalator albo appliance, który dołącza BlackHole z OpenClaw, przejrzyj warunki licencyjne upstream BlackHole albo uzyskaj osobną licencję od Existential Audio.

## Transporty

### Chrome

Transport Chrome otwiera URL Meet przez sterowanie przeglądarką OpenClaw i dołącza jako zalogowany profil przeglądarki OpenClaw. Na macOS Plugin sprawdza obecność `BlackHole 2ch` przed uruchomieniem. Jeśli skonfigurowano, uruchamia też polecenie stanu mostka audio i polecenie startowe przed otwarciem Chrome. Użyj `chrome`, gdy Chrome/audio działają na hoście Gateway; użyj `chrome-node`, gdy Chrome/audio działają na sparowanym Node, takim jak VM macOS w Parallels. Dla lokalnego Chrome wybierz profil przez `browser.defaultProfile`; `chrome.browserProfile` jest przekazywane hostom `chrome-node`.

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome-node
```

Przekieruj dźwięk mikrofonu i głośnika Chrome przez lokalny mostek audio OpenClaw. Jeśli `BlackHole 2ch` nie jest zainstalowany, dołączenie kończy się błędem konfiguracji zamiast cichego dołączenia bez ścieżki audio.

### Twilio

Transport Twilio to ścisły plan wybierania delegowany do Plugin Voice Call. Nie parsuje stron Meet w poszukiwaniu numerów telefonów.

Użyj tego, gdy udział przez Chrome jest niedostępny albo chcesz mieć awaryjne telefoniczne połączenie wdzwaniane. Google Meet musi udostępniać numer telefonu do wdzwaniania i PIN dla spotkania; OpenClaw nie odkrywa ich ze strony Meet.

Włącz Plugin Voice Call na hoście Gateway, nie na Node Chrome:

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

Podaj dane uwierzytelniające Twilio przez środowisko albo konfigurację. Środowisko utrzymuje sekrety poza `openclaw.json`:

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
export GEMINI_API_KEY=...
```

Zamiast tego użyj `realtime.provider: "openai"` z Plugin dostawcy OpenAI i `OPENAI_API_KEY`, jeśli to jest Twój dostawca głosu w czasie rzeczywistym.

Uruchom ponownie albo przeładuj Gateway po włączeniu `voice-call`; zmiany konfiguracji Plugin nie pojawiają się w już działającym procesie Gateway, dopóki nie zostanie przeładowany.

Następnie zweryfikuj:

```bash
openclaw config validate
openclaw plugins list | grep -E 'google-meet|voice-call'
openclaw googlemeet setup
```

Gdy delegacja Twilio jest podłączona, `googlemeet setup` zawiera udane kontrole `twilio-voice-call-plugin`, `twilio-voice-call-credentials` i `twilio-voice-call-webhook`.

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

OAuth jest opcjonalny do tworzenia linku Meet, ponieważ `googlemeet create` może przejść awaryjnie na automatyzację przeglądarki. Skonfiguruj OAuth, gdy chcesz oficjalnego tworzenia przez API, rozwiązywania przestrzeni albo kontroli preflight Meet Media API.

Dostęp do Google Meet API używa OAuth użytkownika: utwórz klienta OAuth Google Cloud, zażądaj wymaganych zakresów, autoryzuj konto Google, a następnie zapisz wynikowy token odświeżania w konfiguracji Plugin Google Meet albo podaj zmienne środowiskowe `OPENCLAW_GOOGLE_MEET_*`.

OAuth nie zastępuje ścieżki dołączania Chrome. Transporty Chrome i Chrome-node nadal dołączają przez zalogowany profil Chrome, BlackHole/SoX oraz połączony Node, gdy używasz udziału przez przeglądarkę. OAuth służy tylko do oficjalnej ścieżki Google Meet API: tworzenia przestrzeni spotkań, rozwiązywania przestrzeni i uruchamiania kontroli preflight Meet Media API.

### Utwórz dane uwierzytelniające Google

W Google Cloud Console:

1. Utwórz albo wybierz projekt Google Cloud.
2. Włącz **Google Meet REST API** dla tego projektu.
3. Skonfiguruj ekran zgody OAuth.
   - **Internal** jest najprostsze dla organizacji Google Workspace.
   - **External** działa dla konfiguracji osobistych/testowych; gdy aplikacja jest w fazie Testing, dodaj każde konto Google, które będzie autoryzować aplikację, jako użytkownika testowego.
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

`meetings.space.created` jest wymagane przez Google Meet `spaces.create`. `meetings.space.readonly` pozwala OpenClaw rozwiązywać URL/kody Meet do przestrzeni. `meetings.space.settings` pozwala OpenClaw przekazywać ustawienia `SpaceConfig`, takie jak `accessType`, podczas tworzenia pokoju przez API. `meetings.conference.media.readonly` służy do preflight Meet Media API i pracy z mediami; Google może wymagać rejestracji w Developer Preview do rzeczywistego użycia Media API. Jeśli potrzebujesz tylko dołączeń Chrome opartych na przeglądarce, całkowicie pomiń OAuth.

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

Preferuj zmienne środowiskowe, gdy nie chcesz tokena odświeżania w konfiguracji. Jeśli obecne są zarówno wartości konfiguracji, jak i środowiska, Plugin najpierw rozwiązuje konfigurację, a potem awaryjnie używa środowiska.

Zgoda OAuth obejmuje tworzenie przestrzeni Meet, dostęp odczytu do przestrzeni Meet oraz dostęp odczytu do multimediów konferencji Meet. Jeśli uwierzytelnienie wykonano przed istnieniem obsługi tworzenia spotkań, uruchom ponownie `openclaw googlemeet auth login --json`, aby token odświeżania miał zakres `meetings.space.created`.

### Zweryfikuj OAuth za pomocą doctor

Uruchom doctor OAuth, gdy chcesz szybkiej, bezsekretowej kontroli stanu:

```bash
openclaw googlemeet doctor --oauth --json
```

Nie ładuje to runtime Chrome ani nie wymaga połączonego Node Chrome. Sprawdza, czy istnieje konfiguracja OAuth oraz czy token odświeżania może wygenerować token dostępu. Raport JSON zawiera tylko pola statusu, takie jak `ok`, `configured`, `tokenSource`, `expiresAt` i komunikaty kontroli; nie wypisuje tokena dostępu, tokena odświeżania ani sekretu klienta.

Typowe wyniki:

| Sprawdzenie          | Znaczenie                                                                               |
| -------------------- | --------------------------------------------------------------------------------------- |
| `oauth-config`       | Obecne jest `oauth.clientId` oraz `oauth.refreshToken` albo token dostępu z pamięci podręcznej. |
| `oauth-token`        | Token dostępu z pamięci podręcznej jest nadal ważny albo token odświeżania wystawił nowy token dostępu. |
| `meet-spaces-get`    | Opcjonalne sprawdzenie `--meeting` rozwiązało istniejącą przestrzeń Meet.               |
| `meet-spaces-create` | Opcjonalne sprawdzenie `--create-space` utworzyło nową przestrzeń Meet.                 |

Aby potwierdzić także włączenie interfejsu Google Meet API i zakres `spaces.create`, uruchom
sprawdzenie tworzenia wywołujące skutek uboczny:

```bash
openclaw googlemeet doctor --oauth --create-space --json
openclaw googlemeet create --no-join --json
```

`--create-space` tworzy jednorazowy adres URL Meet. Użyj go, gdy musisz potwierdzić,
że projekt Google Cloud ma włączone Meet API oraz że autoryzowane konto ma zakres
`meetings.space.created`.

Aby potwierdzić dostęp do odczytu dla istniejącej przestrzeni spotkania:

```bash
openclaw googlemeet doctor --oauth --meeting https://meet.google.com/abc-defg-hij --json
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
```

`doctor --oauth --meeting` i `resolve-space` potwierdzają dostęp do odczytu istniejącej
przestrzeni, do której autoryzowane konto Google ma dostęp. `403` z tych sprawdzeń
zwykle oznacza, że interfejs Google Meet REST API jest wyłączony, zaakceptowanemu tokenowi odświeżania
brakuje wymaganego zakresu albo konto Google nie ma dostępu do tej przestrzeni Meet.
Błąd tokenu odświeżania oznacza, że należy ponownie uruchomić `openclaw googlemeet auth login
--json` i zapisać nowy blok `oauth`.

Dla awaryjnego trybu przeglądarkowego nie są potrzebne żadne poświadczenia OAuth. W tym trybie uwierzytelnianie Google
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

Wyświetl artefakty spotkania i obecność po utworzeniu rekordów konferencji przez Meet:

```bash
openclaw googlemeet artifacts --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet attendance --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet export --meeting https://meet.google.com/abc-defg-hij --output ./meet-export
```

Z `--meeting` polecenia `artifacts` i `attendance` domyślnie używają najnowszego rekordu konferencji.
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

`--today` przeszukuje dzisiejszy kalendarz `primary` pod kątem wydarzenia Calendar z linkiem
Google Meet. Użyj `--event <query>`, aby wyszukać pasujący tekst wydarzenia, oraz
`--calendar <id>` dla kalendarza innego niż podstawowy. Wyszukiwanie w kalendarzu wymaga świeżego
logowania OAuth obejmującego zakres tylko do odczytu wydarzeń Calendar.
`calendar-events` pokazuje podgląd pasujących wydarzeń Meet i oznacza wydarzenie, które
wybierze `latest`, `artifacts`, `attendance` albo `export`.

Jeśli znasz już identyfikator rekordu konferencji, odwołaj się do niego bezpośrednio:

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

Wywołuje to `spaces.endActiveConference` w Google Meet i wymaga OAuth z zakresem
`meetings.space.created` dla przestrzeni, którą autoryzowane konto może zarządzać.
OpenClaw akceptuje adres URL Meet, kod spotkania albo dane wejściowe `spaces/{id}` i rozwiązuje je
do zasobu przestrzeni API przed zakończeniem aktywnej konferencji.
Jest to osobne od `googlemeet leave`: `leave` zatrzymuje lokalny/sesyjny udział
OpenClaw, natomiast `end-active-conference` prosi Google Meet o zakończenie aktywnej
konferencji dla tej przestrzeni.

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
wierszy sesji uczestników z czasami pierwszego/ostatniego zauważenia, całkowitym czasem trwania sesji,
flagami spóźnienia/wcześniejszego wyjścia oraz zduplikowanymi zasobami uczestników scalonymi według zalogowanego
użytkownika albo wyświetlanej nazwy. Przekaż `--no-merge-duplicates`, aby pozostawić surowe zasoby uczestników
oddzielnie, `--late-after-minutes`, aby dostroić wykrywanie spóźnień, oraz
`--early-before-minutes`, aby dostroić wykrywanie wcześniejszego wyjścia.

`export` zapisuje folder zawierający `summary.md`, `attendance.csv`,
`transcript.md`, `artifacts.json`, `attendance.json` i `manifest.json`.
`manifest.json` zapisuje wybrane dane wejściowe, opcje eksportu, rekordy konferencji,
pliki wyjściowe, liczby, źródło tokenu, wydarzenie Calendar, gdy zostało użyte, oraz wszelkie
ostrzeżenia o częściowym pobraniu. Przekaż `--zip`, aby zapisać także przenośne archiwum obok
folderu. Przekaż `--include-doc-bodies`, aby wyeksportować połączony tekst transkrypcji i
inteligentnych notatek Google Docs przez Google Drive `files.export`; wymaga to
świeżego logowania OAuth obejmującego zakres tylko do odczytu Drive Meet. Bez
`--include-doc-bodies` eksport obejmuje tylko metadane Meet i ustrukturyzowane wpisy transkrypcji.
Jeśli Google zwróci częściowy błąd artefaktu, taki jak błąd listy inteligentnych notatek,
wpisu transkrypcji albo treści dokumentu Drive, podsumowanie i
manifest zachowują ostrzeżenie zamiast przerywać cały eksport.
Użyj `--dry-run`, aby pobrać te same dane artefaktów/obecności i wypisać
JSON manifestu bez tworzenia folderu ani pliku ZIP. Jest to przydatne przed zapisaniem
dużego eksportu albo gdy agent potrzebuje tylko liczników, wybranych rekordów i
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

Uruchom strzeżony test smoke na żywo na rzeczywistym zachowanym spotkaniu:

```bash
OPENCLAW_LIVE_TEST=1 \
OPENCLAW_GOOGLE_MEET_LIVE_MEETING=https://meet.google.com/abc-defg-hij \
pnpm test:live -- extensions/google-meet/google-meet.live.test.ts
```

Uruchom przeglądarkową sondę na żywo najpierw nasłuchującą na spotkaniu, na którym ktoś będzie
mówić z dostępnymi napisami Meet:

```bash
openclaw googlemeet setup --transport chrome-node --mode transcribe
openclaw googlemeet test-listen https://meet.google.com/abc-defg-hij --transport chrome-node --timeout-ms 30000
```

Środowisko testu smoke na żywo:

- `OPENCLAW_LIVE_TEST=1` włącza strzeżone testy na żywo.
- `OPENCLAW_GOOGLE_MEET_LIVE_MEETING` wskazuje zachowany adres URL Meet, kod albo
  `spaces/{id}`.
- `OPENCLAW_GOOGLE_MEET_CLIENT_ID` lub `GOOGLE_MEET_CLIENT_ID` zapewnia identyfikator klienta OAuth.
- `OPENCLAW_GOOGLE_MEET_REFRESH_TOKEN` lub `GOOGLE_MEET_REFRESH_TOKEN` zapewnia
  token odświeżania.
- Opcjonalnie: `OPENCLAW_GOOGLE_MEET_CLIENT_SECRET`,
  `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN` i
  `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT` używają tych samych nazw awaryjnych
  bez prefiksu `OPENCLAW_`.

Podstawowy test smoke artefaktów/obecności na żywo wymaga
`https://www.googleapis.com/auth/meetings.space.readonly` i
`https://www.googleapis.com/auth/meetings.conference.media.readonly`. Wyszukiwanie w kalendarzu
wymaga `https://www.googleapis.com/auth/calendar.events.readonly`. Eksport treści dokumentów
Drive wymaga
`https://www.googleapis.com/auth/drive.meet.readonly`.

Utwórz świeżą przestrzeń Meet:

```bash
openclaw googlemeet create
```

Polecenie wypisuje nowe `meeting uri`, źródło i sesję dołączania. Z poświadczeniami OAuth
używa oficjalnego interfejsu Google Meet API. Bez poświadczeń OAuth
używa zalogowanego profilu przeglądarki przypiętego węzła Chrome jako trybu awaryjnego. Agenci mogą
użyć narzędzia `google_meet` z `action: "create"`, aby utworzyć i dołączyć w jednym
kroku. Aby utworzyć tylko adres URL, przekaż `"join": false`.

Przykładowe wyjście JSON z awaryjnego trybu przeglądarkowego:

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

Jeśli awaryjny tryb przeglądarkowy trafi na logowanie Google albo blokadę uprawnień Meet, zanim
zdoła utworzyć adres URL, metoda Gateway zwraca nieudaną odpowiedź, a narzędzie
`google_meet` zwraca ustrukturyzowane szczegóły zamiast zwykłego ciągu tekstowego:

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
`manualActionMessage` oraz kontekst węzła/karty przeglądarki i przestać otwierać nowe
karty Meet, dopóki operator nie wykona kroku w przeglądarce.

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
profil jest wylogowany, OpenClaw zgłasza `manualActionRequired: true` albo błąd
mechanizmu zapasowego przeglądarki i prosi operatora o dokończenie logowania do Google przed
ponowieniem próby.

Ustaw `preview.enrollmentAcknowledged: true` dopiero po potwierdzeniu, że Twój projekt Cloud,
podmiot OAuth i uczestnicy spotkania są zapisani do Google
Workspace Developer Preview Program dla Meet media APIs.

## Konfiguracja

Wspólna ścieżka agenta Chrome wymaga tylko włączonego Plugin, BlackHole, SoX, klucza
dostawcy transkrypcji w czasie rzeczywistym oraz skonfigurowanego dostawcy TTS OpenClaw.
OpenAI jest domyślnym dostawcą transkrypcji; ustaw `realtime.voiceProvider` na
`"google"` i `realtime.model`, aby używać Google Gemini Live w trybie `bidi`
bez zmiany domyślnego dostawcy transkrypcji w trybie agenta:

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
- `defaultMode: "agent"` (`"realtime"` jest akceptowane tylko jako starszy
  alias zgodności dla `"agent"`; nowe wywołania narzędzi powinny używać `"agent"`)
- `chromeNode.node`: opcjonalny identyfikator/nazwa/IP węzła dla `chrome-node`
- `chrome.audioBackend: "blackhole-2ch"`
- `chrome.guestName: "OpenClaw Agent"`: nazwa używana na ekranie gościa Meet
  bez zalogowania
- `chrome.autoJoin: true`: wypełnienie nazwy gościa i kliknięcie Dołącz teraz
  na zasadzie najlepszej próby przez automatyzację przeglądarki OpenClaw na `chrome-node`
- `chrome.reuseExistingTab: true`: aktywuje istniejącą kartę Meet zamiast
  otwierać duplikaty
- `chrome.waitForInCallMs: 20000`: czeka, aż karta Meet zgłosi obecność w połączeniu,
  zanim zostanie uruchomione wprowadzenie odpowiedzi głosowej
- `chrome.audioFormat: "pcm16-24khz"`: format dźwięku pary poleceń. Używaj
  `"g711-ulaw-8khz"` tylko dla starszych/niestandardowych par poleceń, które nadal emitują
  dźwięk telefoniczny.
- `chrome.audioBufferBytes: 4096`: bufor przetwarzania SoX dla wygenerowanych poleceń
  dźwięku pary poleceń Chrome. To połowa domyślnego bufora SoX o rozmiarze 8192 bajtów,
  co zmniejsza domyślne opóźnienie potoku, zostawiając miejsce na zwiększenie go na obciążonych hostach.
  Wartości poniżej minimum SoX są ograniczane do 17 bajtów.
- `chrome.audioInputCommand`: polecenie SoX odczytujące z CoreAudio `BlackHole 2ch`
  i zapisujące dźwięk w `chrome.audioFormat`
- `chrome.audioOutputCommand`: polecenie SoX odczytujące dźwięk w `chrome.audioFormat`
  i zapisujące do CoreAudio `BlackHole 2ch`
- `chrome.bargeInInputCommand`: opcjonalne polecenie lokalnego mikrofonu, które zapisuje
  podpisany 16-bitowy little-endian mono PCM do wykrywania przerwania przez człowieka, gdy
  odtwarzanie asystenta jest aktywne. Obecnie dotyczy to hostowanego przez Gateway
  mostka pary poleceń `chrome`.
- `chrome.bargeInRmsThreshold: 650`: poziom RMS liczony jako przerwanie przez człowieka
  w `chrome.bargeInInputCommand`
- `chrome.bargeInPeakThreshold: 2500`: poziom szczytowy liczony jako przerwanie przez człowieka
  w `chrome.bargeInInputCommand`
- `chrome.bargeInCooldownMs: 900`: minimalne opóźnienie między kolejnymi wyczyszczeniami
  przerwania przez człowieka
- `mode: "agent"`: domyślny tryb odpowiedzi głosowej. Mowa uczestników jest transkrybowana przez
  skonfigurowanego dostawcę transkrypcji w czasie rzeczywistym, wysyłana do skonfigurowanego
  agenta OpenClaw w sesji podagenta dla danego spotkania i odtwarzana głosowo przez
  standardowe środowisko wykonawcze TTS OpenClaw.
- `mode: "bidi"`: zapasowy, bezpośredni, dwukierunkowy tryb modelu czasu rzeczywistego.
  Dostawca głosu w czasie rzeczywistym odpowiada bezpośrednio na mowę uczestników i może wywoływać
  `openclaw_agent_consult` w celu uzyskania głębszych odpowiedzi opartych na narzędziach.
- `mode: "transcribe"`: tryb tylko obserwacji bez mostka odpowiedzi głosowej.
- `realtime.provider: "openai"`: zapas zgodności używany, gdy poniższe pola
  dostawcy o węższym zakresie nie są ustawione.
- `realtime.transcriptionProvider: "openai"`: identyfikator dostawcy używany przez tryb `agent`
  do transkrypcji w czasie rzeczywistym.
- `realtime.voiceProvider`: identyfikator dostawcy używany przez tryb `bidi` do bezpośredniego głosu
  w czasie rzeczywistym. Ustaw go na `"google"`, aby używać Gemini Live, pozostawiając
  transkrypcję trybu agenta w OpenAI.
- `realtime.toolPolicy: "safe-read-only"`
- `realtime.instructions`: krótkie odpowiedzi mówione, z
  `openclaw_agent_consult` dla głębszych odpowiedzi
- `realtime.introMessage`: krótki mówiony test gotowości, gdy mostek czasu rzeczywistego
  się połączy; ustaw na `""`, aby dołączyć po cichu
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

ElevenLabs zarówno do słuchania, jak i mówienia w trybie agenta:

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
`messages.tts.providers.elevenlabs.voiceId`. Odpowiedzi agenta mogą też używać
dyrektyw dla pojedynczej odpowiedzi `[[tts:voiceId=... model=eleven_v3]]`, gdy nadpisania modelu TTS
są włączone, ale konfiguracja jest deterministyczną wartością domyślną dla spotkań.
Po dołączeniu logi powinny pokazywać `transcriptionProvider=elevenlabs`, a każda
mówiona odpowiedź powinna logować `provider=elevenlabs model=eleven_v3 voice=<voiceId>`.

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

`voiceCall.enabled` domyślnie ma wartość `true`; z transportem Twilio deleguje
rzeczywiste połączenie PSTN, DTMF i powitanie wstępne do Plugin Voice Call. Voice Call
odtwarza sekwencję DTMF przed otwarciem strumienia multimediów w czasie rzeczywistym, a następnie używa
zapisanego tekstu wstępnego jako początkowego powitania w czasie rzeczywistym. Jeśli `voice-call` nie jest
włączony, Google Meet nadal może zweryfikować i zapisać plan wybierania, ale nie może
nawiązać połączenia Twilio.

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
`transport: "chrome-node"`, gdy Chrome działa na sparowanym węźle, takim jak maszyna wirtualna Parallels.
W obu przypadkach dostawcy modeli i `openclaw_agent_consult` działają na hoście
Gateway, więc poświadczenia modeli pozostają tam. Przy domyślnym `mode: "agent"`
dostawca transkrypcji w czasie rzeczywistym obsługuje słuchanie, skonfigurowany agent OpenClaw
tworzy odpowiedź, a zwykłe TTS OpenClaw wypowiada ją w Meet. Użyj
`mode: "bidi"`, gdy chcesz, aby model głosu w czasie rzeczywistym odpowiadał bezpośrednio.
Surowe `mode: "realtime"` pozostaje akceptowane jako starszy alias zgodności dla
`mode: "agent"`, ale nie jest już reklamowane w schemacie narzędzi agenta.
Logi trybu agenta obejmują rozwiązany dostawca/model transkrypcji podczas uruchamiania mostka
oraz dostawcę TTS, model, głos, format wyjściowy i częstotliwość próbkowania po
każdej zsyntetyzowanej odpowiedzi.

Użyj `action: "status"`, aby wyświetlić aktywne sesje lub sprawdzić identyfikator sesji. Użyj
`action: "speak"` z `sessionId` i `message`, aby agent czasu rzeczywistego
zaczął mówić natychmiast. Użyj `action: "test_speech"`, aby utworzyć lub ponownie użyć sesji,
wywołać znaną frazę i zwrócić kondycję `inCall`, gdy host Chrome może
ją zgłosić. `test_speech` zawsze wymusza `mode: "agent"` i kończy się niepowodzeniem, jeśli zażądano
uruchomienia w `mode: "transcribe"`, ponieważ sesje tylko obserwacji celowo nie mogą
emitować mowy. Jego wynik `speechOutputVerified` opiera się na wzroście liczby bajtów wyjścia audio
w czasie rzeczywistym podczas tego wywołania testowego, więc ponownie użyta sesja ze starszym dźwiękiem
nie liczy się jako świeży, udany test mowy. Użyj `action: "leave"`, aby oznaczyć
sesję jako zakończoną.

`status` obejmuje kondycję Chrome, gdy jest dostępna:

- `inCall`: Chrome wydaje się być w połączeniu Meet
- `micMuted`: stan mikrofonu Meet na zasadzie najlepszej próby
- `manualActionRequired` / `manualActionReason` / `manualActionMessage`: profil
  przeglądarki wymaga ręcznego logowania, wpuszczenia przez hosta Meet, uprawnień lub
  naprawy sterowania przeglądarką, zanim mowa będzie działać
- `speechReady` / `speechBlockedReason` / `speechBlockedMessage`: czy
  zarządzana mowa Chrome jest teraz dozwolona. `speechReady: false` oznacza, że OpenClaw nie
  wysłał frazy wstępnej/testowej do mostka audio.
- `providerConnected` / `realtimeReady`: stan mostka głosu w czasie rzeczywistym
- `lastInputAt` / `lastOutputAt`: ostatni dźwięk odebrany z mostka lub wysłany do mostka
- `audioOutputRouted` / `audioOutputDeviceLabel`: czy wyjście multimediów karty Meet
  zostało aktywnie skierowane do urządzenia BlackHole używanego przez mostek
- `lastSuppressedInputAt` / `suppressedInputBytes`: wejście local loopback ignorowane, gdy
  odtwarzanie asystenta jest aktywne

```json
{
  "action": "speak",
  "sessionId": "meet_...",
  "message": "Say exactly: I'm here and listening."
}
```

## Tryby agent i bidi

Tryb Chrome `agent` jest zoptymalizowany pod zachowanie „mój agent jest na spotkaniu”.
Dostawca transkrypcji w czasie rzeczywistym słyszy dźwięk spotkania, końcowe transkrypty
uczestników są kierowane przez skonfigurowanego agenta OpenClaw, a odpowiedź jest
wypowiadana przez standardowe środowisko wykonawcze TTS OpenClaw. Ustaw `mode: "bidi"`, gdy chcesz,
aby model głosu w czasie rzeczywistym odpowiadał bezpośrednio.
Pobliskie końcowe fragmenty transkryptu są scalane przed konsultacją, aby jedna wypowiedź
nie generowała kilku nieaktualnych częściowych odpowiedzi. Wejście w czasie rzeczywistym jest także
wyciszane, gdy zakolejkowany dźwięk asystenta nadal jest odtwarzany,
a niedawne echa transkryptu przypominające asystenta są ignorowane przed konsultacją z agentem,
aby local loopback BlackHole nie sprawił, że agent odpowie na własną mowę.

| Tryb    | Kto decyduje o odpowiedzi        | Ścieżka wyjścia mowy                     | Użyj, gdy                                              |
| ------- | ----------------------------- | -------------------------------------- | ----------------------------------------------------- |
| `agent` | Skonfigurowany agent OpenClaw | Standardowe środowisko wykonawcze TTS OpenClaw            | Chcesz zachowania „mój agent jest na spotkaniu”        |
| `bidi`  | Model głosu w czasie rzeczywistym      | Odpowiedź audio dostawcy głosu w czasie rzeczywistym | Chcesz pętli konwersacyjnego głosu o najniższym opóźnieniu |

W trybie `bidi`, gdy model czasu rzeczywistego potrzebuje głębszego rozumowania, aktualnych
informacji lub zwykłych narzędzi OpenClaw, może wywołać `openclaw_agent_consult`.

Narzędzie konsultacji uruchamia w tle zwykłego agenta OpenClaw z kontekstem ostatniej
transkrypcji spotkania i zwraca zwięzłą odpowiedź mówioną. W trybie `agent`
OpenClaw wysyła tę odpowiedź bezpośrednio do środowiska wykonawczego TTS; w trybie `bidi`
model głosu w czasie rzeczywistym może wypowiedzieć wynik konsultacji z powrotem na spotkaniu. Używa
tego samego wspólnego mechanizmu konsultacji co Voice Call.

Domyślnie konsultacje działają z agentem `main`. Ustaw `realtime.agentId`, gdy tor
Meet powinien konsultować się z dedykowanym obszarem roboczym agenta OpenClaw, domyślnymi ustawieniami modelu,
polityką narzędzi, pamięcią i historią sesji.

Konsultacje w trybie agenta używają klucza sesji na spotkanie `agent:<id>:subagent:google-meet:<session>`,
dzięki czemu pytania uzupełniające zachowują kontekst spotkania, jednocześnie dziedzicząc normalną
politykę agenta ze skonfigurowanego agenta.

`realtime.toolPolicy` kontroluje przebieg konsultacji:

- `safe-read-only`: udostępnij narzędzie konsultacji i ogranicz zwykłego agenta do
  `read`, `web_search`, `web_fetch`, `x_search`, `memory_search` oraz
  `memory_get`.
- `owner`: udostępnij narzędzie konsultacji i pozwól zwykłemu agentowi używać normalnej
  polityki narzędzi agenta.
- `none`: nie udostępniaj narzędzia konsultacji modelowi głosu w czasie rzeczywistym.

Klucz sesji konsultacji jest ograniczony do sesji Meet, więc kolejne wywołania konsultacji
mogą ponownie używać wcześniejszego kontekstu konsultacji podczas tego samego spotkania.

Aby wymusić mówione sprawdzenie gotowości po pełnym dołączeniu Chrome do rozmowy:

```bash
openclaw googlemeet speak meet_... "Say exactly: I'm here and listening."
```

Pełny smoke test dołączenia i wypowiedzi:

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
- `googlemeet setup` zawiera `chrome-node-connected`, gdy Chrome-node jest
  domyślnym transportem albo przypięto węzeł.
- `nodes status` pokazuje, że wybrany węzeł jest połączony.
- Wybrany węzeł ogłasza zarówno `googlemeet.chrome`, jak i `browser.proxy`.
- Karta Meet dołącza do rozmowy, a `test-speech` zwraca stan zdrowia Chrome z
  `inCall: true`.

Dla zdalnego hosta Chrome, takiego jak maszyna wirtualna Parallels macOS, to najkrótsze
bezpieczne sprawdzenie po zaktualizowaniu Gateway lub maszyny wirtualnej:

```bash
openclaw googlemeet setup
openclaw nodes status --connected
openclaw nodes invoke \
  --node parallels-macos \
  --command googlemeet.chrome \
  --params '{"action":"setup"}'
```

To potwierdza, że Plugin Gateway jest załadowany, węzeł maszyny wirtualnej jest połączony z
bieżącym tokenem, a most audio Meet jest dostępny, zanim agent otworzy
prawdziwą kartę spotkania.

Dla smoke testu Twilio użyj spotkania, które udostępnia dane telefonicznego wdzwaniania:

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
- `voicecall` jest dostępne w CLI po przeładowaniu Gateway.
- Zwrócona sesja ma `transport: "twilio"` oraz `twilio.voiceCallId`.
- `openclaw logs --follow` pokazuje TwiML DTMF obsłużony przed TwiML w czasie rzeczywistym, a następnie
  most w czasie rzeczywistym z początkowym powitaniem w kolejce.
- `googlemeet leave <sessionId>` rozłącza delegowane połączenie głosowe.

## Rozwiązywanie problemów

### Agent nie widzi narzędzia Google Meet

Potwierdź, że Plugin jest włączony w konfiguracji Gateway, i przeładuj Gateway:

```bash
openclaw plugins list | grep google-meet
openclaw googlemeet setup
```

Jeśli przed chwilą edytowano `plugins.entries.google-meet`, uruchom ponownie lub przeładuj Gateway.
Działający agent widzi tylko narzędzia Plugin zarejestrowane przez bieżący proces
Gateway.

Na hostach Gateway innych niż macOS narzędzie `google_meet` widoczne dla agenta pozostaje widoczne,
ale lokalne akcje odpowiedzi głosowej Chrome są blokowane, zanim trafią do mostu audio.
Lokalne audio odpowiedzi głosowej Chrome obecnie zależy od macOS `BlackHole 2ch`, więc
agenci Linux powinni używać `mode: "transcribe"`, wdzwaniania Twilio albo hosta
`chrome-node` na macOS zamiast domyślnej lokalnej ścieżki agenta Chrome.

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

Węzeł musi być połączony i zawierać `googlemeet.chrome` oraz `browser.proxy`.
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

Jeśli `googlemeet setup` nie przechodzi `chrome-node-connected` albo log Gateway zgłasza
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
dla dołączeń w czasie rzeczywistym, a następnie sprawdź zwrócony stan zdrowia Chrome. Jeśli którykolwiek test
zgłasza `manualActionRequired: true`, pokaż operatorowi `manualActionMessage`
i przestań ponawiać próby, dopóki akcja w przeglądarce nie zostanie ukończona.

Typowe akcje ręczne:

- Zaloguj się do profilu Chrome.
- Wpuść gościa z konta hosta Meet.
- Przyznaj Chrome uprawnienia do mikrofonu/kamery, gdy pojawi się natywny monit uprawnień Chrome.
- Zamknij lub napraw zablokowane okno dialogowe uprawnień Meet.

Nie zgłaszaj „nie zalogowano” tylko dlatego, że Meet pokazuje „Do you want people to
hear you in the meeting?” To ekran pośredni wyboru audio w Meet; OpenClaw
klika **Use microphone** przez automatyzację przeglądarki, gdy jest dostępne, i nadal
czeka na rzeczywisty stan spotkania. W przypadku awaryjnej ścieżki przeglądarkowej tylko do tworzenia OpenClaw
może kliknąć **Continue without microphone**, ponieważ utworzenie URL-a nie wymaga
ścieżki audio w czasie rzeczywistym.

### Tworzenie spotkania kończy się niepowodzeniem

`googlemeet create` najpierw używa punktu końcowego Google Meet API `spaces.create`,
gdy skonfigurowano poświadczenia OAuth. Bez poświadczeń OAuth przechodzi awaryjnie
na przeglądarkę przypiętego węzła Chrome. Potwierdź:

- Dla tworzenia przez API: skonfigurowano `oauth.clientId` i `oauth.refreshToken`
  albo istnieją odpowiadające im zmienne środowiskowe `OPENCLAW_GOOGLE_MEET_*`.
- Dla tworzenia przez API: token odświeżania został wygenerowany po dodaniu
  obsługi tworzenia. Starszym tokenom może brakować zakresu `meetings.space.created`; uruchom ponownie
  `openclaw googlemeet auth login --json` i zaktualizuj konfigurację Plugin.
- Dla awaryjnej ścieżki przeglądarkowej: `defaultTransport: "chrome-node"` oraz
  `chromeNode.node` wskazują połączony węzeł z `browser.proxy` i
  `googlemeet.chrome`.
- Dla awaryjnej ścieżki przeglądarkowej: profil Chrome OpenClaw na tym węźle jest zalogowany
  do Google i może otworzyć `https://meet.google.com/new`.
- Dla awaryjnej ścieżki przeglądarkowej: ponowienia używają istniejącej karty `https://meet.google.com/new`
  albo monitu konta Google przed otwarciem nowej karty. Jeśli agent przekroczy limit czasu,
  ponów wywołanie narzędzia zamiast ręcznie otwierać kolejną kartę Meet.
- Dla awaryjnej ścieżki przeglądarkowej: jeśli narzędzie zwraca `manualActionRequired: true`, użyj
  zwróconych `browser.nodeId`, `browser.targetId`, `browserUrl` oraz
  `manualActionMessage`, aby pokierować operatorem. Nie ponawiaj prób w pętli, dopóki ta
  akcja nie zostanie ukończona.
- Dla awaryjnej ścieżki przeglądarkowej: jeśli Meet pokazuje „Do you want people to hear you in the
  meeting?”, pozostaw kartę otwartą. OpenClaw powinien kliknąć **Use microphone** albo, dla
  awaryjnej ścieżki tylko do tworzenia, **Continue without microphone** przez automatyzację
  przeglądarki i dalej czekać na wygenerowany URL Meet. Jeśli nie może, błąd
  powinien wspominać `meet-audio-choice-required`, a nie `google-login-required`.

### Agent dołącza, ale nie mówi

Sprawdź ścieżkę czasu rzeczywistego:

```bash
openclaw googlemeet setup
openclaw googlemeet doctor
```

Użyj `mode: "agent"` dla normalnej ścieżki STT -> agent OpenClaw -> odpowiedź głosowa TTS,
albo `mode: "bidi"` dla bezpośredniej awaryjnej ścieżki głosu w czasie rzeczywistym. `mode: "transcribe"`
celowo nie uruchamia mostu odpowiedzi głosowej. Do debugowania tylko obserwacyjnego
uruchom `openclaw googlemeet status --json <session-id>` po tym, jak uczestnicy zaczną mówić,
i sprawdź `captioning`, `transcriptLines` oraz `lastCaptionText`. Jeśli `inCall` ma
wartość true, ale `transcriptLines` pozostaje na `0`, napisy Meet mogą być wyłączone, nikt
nie mówił od zainstalowania obserwatora, interfejs Meet się zmienił albo napisy na żywo
są niedostępne dla języka/konta spotkania.

`googlemeet test-speech` zawsze sprawdza ścieżkę czasu rzeczywistego i raportuje, czy
dla tego wywołania zaobserwowano bajty wyjściowe mostu. Jeśli `speechOutputVerified` ma wartość false, a
`speechOutputTimedOut` ma wartość true, dostawca czasu rzeczywistego mógł zaakceptować
wypowiedź, ale OpenClaw nie zobaczył, by nowe bajty wyjściowe dotarły do mostu audio Chrome.

Sprawdź także:

- Klucz dostawcy czasu rzeczywistego jest dostępny na hoście Gateway, na przykład
  `OPENAI_API_KEY` albo `GEMINI_API_KEY`.
- `BlackHole 2ch` jest widoczny na hoście Chrome.
- `sox` istnieje na hoście Chrome.
- Mikrofon i głośnik Meet są kierowane przez wirtualną ścieżkę audio używaną przez
  OpenClaw. `doctor` powinien pokazywać `meet output routed: yes` dla lokalnych dołączeń Chrome
  w czasie rzeczywistym.

`googlemeet doctor [session-id]` wypisuje sesję, węzeł, stan w rozmowie,
powód akcji ręcznej, połączenie z dostawcą czasu rzeczywistego, `realtimeReady`, aktywność
wejścia/wyjścia audio, ostatnie znaczniki czasu audio, liczniki bajtów i URL przeglądarki.
Użyj `googlemeet status [session-id] --json`, gdy potrzebujesz surowego JSON. Użyj
`googlemeet doctor --oauth`, gdy musisz zweryfikować odświeżenie OAuth Google Meet
bez ujawniania tokenów; dodaj `--meeting` albo `--create-space`, gdy potrzebujesz także
dowodu z Google Meet API.

Jeśli agent przekroczył limit czasu i widzisz już otwartą kartę Meet, sprawdź tę kartę
bez otwierania kolejnej:

```bash
openclaw googlemeet recover-tab
openclaw googlemeet recover-tab https://meet.google.com/abc-defg-hij
```

Odpowiadająca akcja narzędzia to `recover_current_tab`. Ustawia fokus na
istniejącej karcie Meet dla wybranego transportu i ją sprawdza. Przy `chrome` używa lokalnego
sterowania przeglądarką przez Gateway; przy `chrome-node` używa skonfigurowanego
węzła Chrome. Nie otwiera nowej karty ani nie tworzy nowej sesji; raportuje
bieżącą blokadę, taką jak logowanie, wpuszczenie, uprawnienia albo stan wyboru audio.
Polecenie CLI komunikuje się ze skonfigurowanym Gateway, więc Gateway musi działać;
`chrome-node` wymaga także połączenia węzła Chrome.

### Kontrole konfiguracji Twilio kończą się niepowodzeniem

`twilio-voice-call-plugin` kończy się niepowodzeniem, gdy `voice-call` nie jest dozwolone albo włączone.
Dodaj je do `plugins.allow`, włącz `plugins.entries.voice-call` i przeładuj
Gateway.

`twilio-voice-call-credentials` kończy się niepowodzeniem, gdy backend Twilio nie ma identyfikatora SID konta,
tokenu uwierzytelniania albo numeru dzwoniącego. Ustaw je na hoście Gateway:

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
```

`twilio-voice-call-webhook` kończy się niepowodzeniem, gdy `voice-call` nie ma publicznej
ekspozycji Webhook albo gdy `publicUrl` wskazuje na local loopback lub przestrzeń sieci prywatnej.
Ustaw `plugins.entries.voice-call.config.publicUrl` na publiczny URL dostawcy albo
skonfiguruj tunel/ekspozycję Tailscale dla `voice-call`.

Adresy local loopback i prywatne URL-e nie są poprawne dla wywołań zwrotnych operatora. Nie używaj
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

Do lokalnego programowania użyj tunelu lub ekspozycji Tailscale zamiast prywatnego
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

`voicecall smoke` domyślnie sprawdza tylko gotowość. Aby wykonać próbę dla konkretnego numeru:

```bash
openclaw voicecall smoke --to "+15555550123"
```

Dodaj `--yes` tylko wtedy, gdy celowo chcesz wykonać rzeczywiste wychodzące połączenie
powiadamiające:

```bash
openclaw voicecall smoke --to "+15555550123" --yes
```

### Połączenie Twilio rozpoczyna się, ale nigdy nie dołącza do spotkania

Potwierdź, że wydarzenie Meet udostępnia szczegóły wdzwonienia telefonicznego. Przekaż dokładny numer
wdzwonienia oraz PIN albo niestandardową sekwencję DTMF:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --dtmf-sequence ww123456#
```

Użyj początkowego `w` lub przecinków w `--dtmf-sequence`, jeśli dostawca potrzebuje pauzy
przed wprowadzeniem PIN-u.

Jeśli połączenie telefoniczne zostanie utworzone, ale lista uczestników Meet nigdy nie pokazuje
uczestnika wdzwonionego telefonicznie:

- Uruchom `openclaw googlemeet doctor <session-id>`, aby potwierdzić delegowany identyfikator połączenia Twilio,
  czy DTMF zostało zakolejkowane oraz czy zażądano powitania wprowadzającego.
- Uruchom `openclaw voicecall status --call-id <id>` i potwierdź, że połączenie nadal jest
  aktywne.
- Uruchom `openclaw voicecall tail` i sprawdź, czy webhooki Twilio docierają do
  Gateway.
- Uruchom `openclaw logs --follow` i poszukaj sekwencji Twilio Meet: Google
  Meet deleguje dołączenie, Voice Call zapisuje i serwuje TwiML DTMF przed połączeniem,
  Voice Call serwuje TwiML czasu rzeczywistego dla połączenia Twilio, a następnie Google Meet żąda
  mowy wprowadzającej przez `voicecall.speak`.
- Uruchom ponownie `openclaw googlemeet setup --transport twilio`; zielony wynik sprawdzenia konfiguracji jest
  wymagany, ale nie dowodzi, że sekwencja PIN-u spotkania jest poprawna.
- Potwierdź, że numer wdzwonienia należy do tego samego zaproszenia Meet i regionu co
  PIN.
- Zwiększ `voiceCall.dtmfDelayMs` z domyślnych 12 sekund, jeśli Meet odpowiada
  wolno albo transkrypcja połączenia nadal pokazuje komunikat proszący o PIN po
  wysłaniu DTMF przed połączeniem.
- Jeśli uczestnik dołącza, ale nie słyszysz powitania, sprawdź
  `openclaw logs --follow` pod kątem żądania `voicecall.speak` po DTMF oraz
  odtwarzania TTS strumienia multimediów albo awaryjnego Twilio `<Say>`. Jeśli transkrypcja połączenia
  nadal zawiera „enter the meeting PIN”, odnoga telefoniczna nie dołączyła jeszcze
  do pokoju Meet, więc uczestnicy spotkania nie usłyszą mowy.

Jeśli webhooki nie docierają, najpierw debuguj Plugin Voice Call: dostawca musi
osiągać `plugins.entries.voice-call.config.publicUrl` albo skonfigurowany tunel.
Zobacz [Rozwiązywanie problemów z połączeniami głosowymi](/pl/plugins/voice-call#troubleshooting).

## Uwagi

Oficjalne API multimediów Google Meet jest zorientowane na odbiór, więc mówienie w połączeniu Meet
nadal wymaga ścieżki uczestnika. Ten Plugin zachowuje tę granicę jako widoczną:
Chrome obsługuje udział przez przeglądarkę i lokalne trasowanie audio; Twilio obsługuje
udział przez wdzwonienie telefoniczne.

Tryby odpowiedzi głosowej Chrome wymagają `BlackHole 2ch` oraz jednego z poniższych:

- `chrome.audioInputCommand` plus `chrome.audioOutputCommand`: OpenClaw kontroluje
  most i przesyła audio w `chrome.audioFormat` między tymi poleceniami a
  wybranym dostawcą. Tryb agenta używa transkrypcji w czasie rzeczywistym oraz zwykłego TTS;
  tryb bidi używa dostawcy głosu czasu rzeczywistego. Domyślna ścieżka Chrome to 24 kHz
  PCM16 z `chrome.audioBufferBytes: 4096`; 8 kHz G.711 mu-law pozostaje
  dostępne dla starszych par poleceń.
- `chrome.audioBridgeCommand`: zewnętrzne polecenie mostu kontroluje całą lokalną
  ścieżkę audio i musi zakończyć działanie po uruchomieniu lub zweryfikowaniu swojego demona. Jest to
  prawidłowe tylko dla `bidi`, ponieważ tryb `agent` wymaga bezpośredniego dostępu do pary poleceń dla TTS.

Gdy agent wywołuje narzędzie `google_meet` w trybie agenta, sesja konsultanta spotkania
forkuje bieżącą transkrypcję wywołującego przed odpowiedzią na mowę uczestników.
Sesja Meet nadal pozostaje oddzielna (`agent:<agentId>:subagent:google-meet:<sessionId>`),
więc dalsze działania spotkania nie mutują bezpośrednio transkrypcji wywołującego.

Aby uzyskać czysty dźwięk dupleksowy, trasuj wyjście Meet i mikrofon Meet przez oddzielne
urządzenia wirtualne albo graf urządzeń wirtualnych w stylu Loopback. Jedno współdzielone
urządzenie BlackHole może odbijać innych uczestników z powrotem do połączenia.

W moście Chrome opartym na parze poleceń `chrome.bargeInInputCommand` może nasłuchiwać
oddzielnego lokalnego mikrofonu i czyścić odtwarzanie asystenta, gdy człowiek zacznie
mówić. Dzięki temu mowa człowieka ma pierwszeństwo przed wyjściem asystenta nawet wtedy, gdy współdzielone
wejście local loopback BlackHole jest tymczasowo wyciszone podczas odtwarzania asystenta.
Podobnie jak `chrome.audioInputCommand` i `chrome.audioOutputCommand`, jest to
lokalne polecenie skonfigurowane przez operatora. Użyj jawnej zaufanej ścieżki polecenia lub
listy argumentów i nie wskazuj skryptów z niezaufanych lokalizacji.

`googlemeet speak` uruchamia aktywny most audio odpowiedzi głosowej dla sesji Chrome.
`googlemeet leave` zatrzymuje ten most. W przypadku sesji Twilio delegowanych
przez Plugin Voice Call `leave` także rozłącza bazowe połączenie głosowe.
Użyj `googlemeet end-active-conference`, gdy chcesz również zamknąć aktywną
konferencję Google Meet dla przestrzeni zarządzanej przez API.

## Powiązane

- [Plugin połączeń głosowych](/pl/plugins/voice-call)
- [Tryb rozmowy](/pl/nodes/talk)
- [Tworzenie plugins](/pl/plugins/building-plugins)
