---
read_when:
    - Chcesz, aby agent OpenClaw dołączył do spotkania w Google Meet
    - Chcesz, aby agent OpenClaw utworzył nową rozmowę w Google Meet
    - Konfigurujesz Chrome, węzeł Chrome lub Twilio jako transport Google Meet
summary: 'Google Meet Plugin: dołączanie do jawnych adresów URL Meet przez Chrome lub Twilio z domyślnymi ustawieniami odpowiedzi głosowej agenta'
title: Plugin Google Meet
x-i18n:
    generated_at: "2026-05-04T07:05:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4268ad895bbf83d649b9571c0888c27eb982ad9710dfb408f22f7818cdc5dbcb
    source_path: plugins/google-meet.md
    workflow: 16
---

Obsługa uczestników Google Meet dla OpenClaw — Plugin jest celowo jawny:

- Dołącza tylko do jawnego adresu URL `https://meet.google.com/...`.
- Może utworzyć nową przestrzeń Meet przez Google Meet API, a następnie dołączyć do
  zwróconego adresu URL.
- `agent` to domyślny tryb odpowiedzi głosowej: transkrypcja w czasie rzeczywistym nasłuchuje,
  skonfigurowany agent OpenClaw odpowiada, a zwykły OpenClaw TTS mówi w Meet.
- `bidi` pozostaje dostępny jako zapasowy tryb bezpośredniego modelu głosowego w czasie rzeczywistym.
- Agenci wybierają zachowanie dołączania za pomocą `mode`: użyj `agent` do
  nasłuchiwania/odpowiadania głosem na żywo, `bidi` jako zapasowego bezpośredniego głosu w czasie rzeczywistym albo `transcribe`
  do dołączenia/kontrolowania przeglądarki bez mostka odpowiedzi głosowej.
- Uwierzytelnianie zaczyna się jako osobiste Google OAuth albo już zalogowany profil Chrome.
- Nie ma automatycznego ogłoszenia zgody.
- Domyślnym backendem audio Chrome jest `BlackHole 2ch`.
- Chrome może działać lokalnie albo na sparowanym hoście węzła.
- Twilio przyjmuje numer do wdzwonienia oraz opcjonalny PIN albo sekwencję DTMF; nie
  może bezpośrednio wybrać adresu URL Meet.
- Polecenie CLI to `googlemeet`; `meet` jest zarezerwowane dla szerszych przepływów pracy
  telekonferencji agentów.

## Szybki start

Zainstaluj lokalne zależności audio i skonfiguruj dostawcę transkrypcji w czasie rzeczywistym
oraz zwykły OpenClaw TTS. OpenAI jest domyślnym dostawcą transkrypcji;
Google Gemini Live działa także jako osobny zapasowy głos `bidi` z
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
przypięcie węzła oraz, dla dołączeń Chrome w czasie rzeczywistym, mostek audio
BlackHole/SoX i opóźnione kontrole wstępu w czasie rzeczywistym. Dla dołączeń tylko obserwacyjnych sprawdź ten sam
transport za pomocą `--mode transcribe`; ten tryb pomija wymagania wstępne audio w czasie rzeczywistym,
ponieważ nie nasłuchuje ani nie mówi przez mostek:

```bash
openclaw googlemeet setup --transport chrome-node --mode transcribe
```

Gdy skonfigurowano delegowanie Twilio, konfiguracja raportuje także, czy Plugin
`voice-call`, poświadczenia Twilio i publiczna ekspozycja Webhook są gotowe.
Traktuj każdą kontrolę `ok: false` jako blokadę dla sprawdzanego transportu i trybu
przed poproszeniem agenta o dołączenie. Użyj `openclaw googlemeet setup --json` dla
skryptów lub danych wyjściowych czytelnych maszynowo. Użyj `--transport chrome`,
`--transport chrome-node` albo `--transport twilio`, aby wstępnie sprawdzić konkretny
transport, zanim agent go spróbuje.

Dla Twilio zawsze jawnie sprawdzaj transport wstępnie, gdy domyślnym transportem
jest Chrome:

```bash
openclaw googlemeet setup --transport twilio
```

To wykrywa brakujące okablowanie `voice-call`, poświadczenia Twilio albo nieosiągalną
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
  "mode": "agent"
}
```

Narzędzie `google_meet` dostępne dla agenta pozostaje dostępne na hostach innych niż macOS dla
artefaktów, kalendarza, konfiguracji, transkrypcji, Twilio i przepływów `chrome-node`. Lokalna
akcja odpowiedzi głosowej Chrome jest tam blokowana, ponieważ dołączona ścieżka audio Chrome
obecnie zależy od macOS `BlackHole 2ch`. Na Linuksie użyj `mode: "transcribe"`,
wdzwonienia Twilio albo hosta macOS `chrome-node` do uczestnictwa Chrome z odpowiedzią głosową.

Utwórz nowe spotkanie i dołącz do niego:

```bash
openclaw googlemeet create --transport chrome-node --mode agent
```

Dla pokoi utworzonych przez API użyj Google Meet `SpaceConfig.accessType`, gdy chcesz,
aby polityka pokoju bez pukania była jawna zamiast dziedziczona z domyślnych ustawień konta Google:

```bash
openclaw googlemeet create --access-type OPEN --transport chrome-node --mode agent
```

`OPEN` pozwala każdemu z adresem URL Meet dołączyć bez pukania. `TRUSTED` pozwala
zaufanym użytkownikom organizacji hosta, zaproszonym użytkownikom zewnętrznym i użytkownikom
wdzwaniającym się dołączyć bez pukania. `RESTRICTED` ogranicza wejście bez pukania do zaproszonych.
Te ustawienia dotyczą tylko oficjalnej ścieżki tworzenia przez Google Meet API, więc
poświadczenia OAuth muszą być skonfigurowane.

Jeśli uwierzytelniłeś Google Meet, zanim ta opcja była dostępna, uruchom ponownie
`openclaw googlemeet auth login --json` po dodaniu zakresu
`meetings.space.settings` do ekranu zgody Google OAuth.

Utwórz tylko adres URL bez dołączania:

```bash
openclaw googlemeet create --no-join
```

`googlemeet create` ma dwie ścieżki:

- Tworzenie przez API: używane, gdy skonfigurowano poświadczenia Google Meet OAuth. To
  najbardziej deterministyczna ścieżka i nie zależy od stanu interfejsu przeglądarki.
- Zapasowa ścieżka przeglądarki: używana, gdy brak poświadczeń OAuth. OpenClaw używa
  przypiętego węzła Chrome, otwiera `https://meet.google.com/new`, czeka, aż Google
  przekieruje do prawdziwego adresu URL z kodem spotkania, a następnie zwraca ten adres URL. Ta ścieżka wymaga,
  aby profil OpenClaw Chrome na węźle był już zalogowany do Google.
  Automatyzacja przeglądarki obsługuje własny monit Meet o mikrofon przy pierwszym uruchomieniu; ten monit
  nie jest traktowany jako niepowodzenie logowania Google.
  Przepływy dołączania i tworzenia próbują także ponownie użyć istniejącej karty Meet przed otwarciem
  nowej. Dopasowanie ignoruje nieszkodliwe ciągi zapytań URL, takie jak `authuser`, więc ponowna próba
  agenta powinna przenieść fokus na już otwarte spotkanie zamiast tworzyć drugą
  kartę Chrome.

Dane wyjściowe polecenia/narzędzia zawierają pole `source` (`api` albo `browser`), aby agenci
mogli wyjaśnić, której ścieżki użyto. `create` domyślnie dołącza do nowego spotkania i
zwraca `joined: true` oraz sesję dołączenia. Aby tylko wygenerować adres URL, użyj
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

Dla dołączenia tylko obserwacyjnego/kontroli przeglądarki ustaw `"mode": "transcribe"`. To nie
uruchamia dwukierunkowego mostka głosowego w czasie rzeczywistym, nie wymaga BlackHole ani SoX
i nie będzie odpowiadać głosem w spotkaniu. Dołączenia Chrome w tym trybie unikają także
przyznania uprawnień OpenClaw do mikrofonu/kamery i unikają ścieżki Meet **Użyj
mikrofonu**. Jeśli Meet pokazuje ekran pośredni wyboru audio, automatyzacja próbuje
ścieżki bez mikrofonu, a w przeciwnym razie raportuje działanie ręczne zamiast otwierać
lokalny mikrofon. W trybie transkrypcji zarządzane transporty Chrome instalują także
obserwator napisów Meet na zasadzie najlepszej próby. `googlemeet status --json` i
`googlemeet doctor` pokazują `captioning`, `captionsEnabledAttempted`,
`transcriptLines`, `lastCaptionAt`, `lastCaptionSpeaker`, `lastCaptionText`
oraz krótki ogon `recentTranscript`, aby operatorzy mogli stwierdzić, czy przeglądarka
dołączyła do rozmowy i czy napisy Meet generują tekst.
Użyj `openclaw googlemeet test-listen <meet-url> --transport chrome-node`, gdy
potrzebujesz sondy tak/nie: dołącza w trybie transkrypcji, czeka na świeży ruch napisów albo
transkrypcji i zwraca `listenVerified`, `listenTimedOut`, pola działań ręcznych
oraz najnowszy stan napisów.

Podczas sesji w czasie rzeczywistym status `google_meet` zawiera stan przeglądarki i mostka audio,
taki jak `inCall`, `manualActionRequired`, `providerConnected`,
`realtimeReady`, `audioInputActive`, `audioOutputActive`, znaczniki czasu ostatniego wejścia/wyjścia,
liczniki bajtów i stan zamknięcia mostka. Jeśli pojawi się bezpieczny monit strony Meet,
automatyzacja przeglądarki obsługuje go, gdy może. Monity logowania, dopuszczenia przez hosta oraz
uprawnień przeglądarki/systemu operacyjnego są raportowane jako działanie ręczne z powodem i
komunikatem do przekazania przez agenta. Zarządzane sesje Chrome emitują wstęp albo
frazę testową dopiero po tym, jak stan przeglądarki zgłosi `inCall: true`; w przeciwnym razie status raportuje
`speechReady: false`, a próba mowy jest blokowana zamiast udawać, że
agent przemówił w spotkaniu.

Lokalne dołączenia Chrome przechodzą przez zalogowany profil przeglądarki OpenClaw. Tryb w czasie rzeczywistym
wymaga `BlackHole 2ch` dla ścieżki mikrofonu/głośnika używanej przez OpenClaw. Dla
czystego dwukierunkowego audio użyj osobnych urządzeń wirtualnych albo grafu w stylu Loopback; jedno
urządzenie BlackHole wystarczy do pierwszego testu dymnego, ale może powodować echo.

### Lokalny Gateway + Parallels Chrome

Nie potrzebujesz pełnego OpenClaw Gateway ani klucza API modelu w maszynie wirtualnej macOS
tylko po to, aby maszyna wirtualna posiadała Chrome. Uruchom Gateway i agenta lokalnie, a następnie uruchom
host węzła w maszynie wirtualnej. Włącz dołączony Plugin w maszynie wirtualnej raz, aby węzeł
reklamował polecenie Chrome:

Co działa gdzie:

- Host Gateway: OpenClaw Gateway, obszar roboczy agenta, klucze modelu/API, dostawca czasu rzeczywistego
  oraz konfiguracja Plugin Google Meet.
- Maszyna wirtualna Parallels macOS: OpenClaw CLI/host węzła, Google Chrome, SoX, BlackHole 2ch
  oraz profil Chrome zalogowany do Google.
- Niepotrzebne w maszynie wirtualnej: usługa Gateway, konfiguracja agenta, klucz OpenAI/GPT ani konfiguracja
  dostawcy modelu.

Zainstaluj zależności maszyny wirtualnej:

```bash
brew install blackhole-2ch sox
```

Uruchom ponownie maszynę wirtualną po zainstalowaniu BlackHole, aby macOS udostępnił `BlackHole 2ch`:

```bash
sudo reboot
```

Po ponownym uruchomieniu zweryfikuj, że maszyna wirtualna widzi urządzenie audio i polecenia SoX:

```bash
system_profiler SPAudioDataType | grep -i BlackHole
command -v sox
```

Zainstaluj albo zaktualizuj OpenClaw w maszynie wirtualnej, a następnie włącz tam dołączony Plugin:

```bash
openclaw plugins enable google-meet
```

Uruchom host węzła w maszynie wirtualnej:

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name parallels-macos
```

Jeśli `<gateway-host>` jest adresem IP sieci LAN i nie używasz TLS, węzeł odrzuci
zwykły WebSocket, chyba że wyrazisz zgodę na tę zaufaną sieć prywatną:

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

Potwierdź, że Gateway widzi węzeł i że reklamuje zarówno `googlemeet.chrome`,
jak i możliwość przeglądarki/`browser.proxy`:

```bash
openclaw nodes status
```

Przekieruj Meet przez ten węzeł na hoście Gateway:

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

Dla testu dymnego jednym poleceniem, który tworzy albo ponownie używa sesji, wypowiada znaną
frazę i wypisuje stan sesji:

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij
```

Podczas dołączania w trybie realtime automatyzacja przeglądarki OpenClaw wpisuje nazwę gościa, klika
Dołącz/Poproś o dołączenie i akceptuje pierwszorazowy wybór Meet „Użyj mikrofonu”, gdy taki
monit się pojawi. Podczas dołączania tylko do obserwacji albo tworzenia spotkania tylko w przeglądarce
przechodzi dalej przez ten sam monit bez mikrofonu, gdy taki wybór jest dostępny.
Jeśli profil przeglądarki nie jest zalogowany, Meet czeka na dopuszczenie przez gospodarza,
Chrome potrzebuje uprawnienia do mikrofonu/kamery przy dołączaniu w trybie realtime albo Meet utknął
na monicie, którego automatyzacja nie mogła rozwiązać, wynik dołączenia/testu mowy raportuje
`manualActionRequired: true` z `manualActionReason` oraz
`manualActionMessage`. Agenci powinni przestać ponawiać dołączanie, zgłosić dokładnie tę
wiadomość wraz z bieżącymi `browserUrl`/`browserTitle` i ponowić próbę dopiero po
ukończeniu ręcznej czynności w przeglądarce.

Jeśli `chromeNode.node` zostanie pominięte, OpenClaw wybiera automatycznie tylko wtedy, gdy dokładnie jeden
połączony Node ogłasza zarówno `googlemeet.chrome`, jak i sterowanie przeglądarką. Jeśli
połączonych jest kilka zdolnych Node, ustaw `chromeNode.node` na identyfikator Node,
nazwę wyświetlaną albo zdalny adres IP.

Typowe kontrole awarii:

- `Configured Google Meet node ... is not usable: offline`: przypięty Node jest
  znany Gateway, ale niedostępny. Agenci powinni traktować ten Node jako
  stan diagnostyczny, a nie jako użyteczny host Chrome, i zgłosić blokadę konfiguracji
  zamiast przełączać się na inny transport, chyba że użytkownik o to poprosił.
- `No connected Google Meet-capable node`: uruchom `openclaw node run` w VM,
  zatwierdź parowanie i upewnij się, że `openclaw plugins enable google-meet` oraz
  `openclaw plugins enable browser` zostały uruchomione w VM. Potwierdź też, że
  host Gateway zezwala na obie komendy Node za pomocą
  `gateway.nodes.allowCommands: ["googlemeet.chrome", "browser.proxy"]`.
- `BlackHole 2ch audio device not found`: zainstaluj `blackhole-2ch` na sprawdzanym hoście
  i uruchom go ponownie przed użyciem lokalnego audio Chrome.
- `BlackHole 2ch audio device not found on the node`: zainstaluj `blackhole-2ch`
  w VM i uruchom VM ponownie.
- Chrome otwiera się, ale nie może dołączyć: zaloguj się do profilu przeglądarki wewnątrz VM albo
  pozostaw ustawione `chrome.guestName` dla dołączenia jako gość. Automatyczne dołączanie gościa używa
  automatyzacji przeglądarki OpenClaw przez proxy przeglądarki Node; upewnij się, że konfiguracja przeglądarki
  Node wskazuje profil, którego chcesz użyć, na przykład
  `browser.defaultProfile: "user"` albo nazwany profil istniejącej sesji.
- Zduplikowane karty Meet: pozostaw włączone `chrome.reuseExistingTab: true`. OpenClaw
  aktywuje istniejącą kartę dla tego samego URL Meet przed otwarciem nowej, a
  tworzenie spotkania w przeglądarce ponownie używa trwającej karty `https://meet.google.com/new`
  albo karty monitu konta Google przed otwarciem kolejnej.
- Brak audio: w Meet skieruj mikrofon/głośnik przez ścieżkę wirtualnego urządzenia audio
  używaną przez OpenClaw; użyj osobnych urządzeń wirtualnych albo trasowania w stylu Loopback
  dla czystego audio dwukierunkowego.

## Uwagi instalacyjne

Domyślne odtwarzanie zwrotne Chrome używa dwóch zewnętrznych narzędzi:

- `sox`: narzędzie audio wiersza poleceń. Plugin używa jawnych komend urządzenia CoreAudio
  dla domyślnego mostka audio 24 kHz PCM16.
- `blackhole-2ch`: wirtualny sterownik audio macOS. Tworzy urządzenie audio `BlackHole 2ch`,
  przez które Chrome/Meet może trasować dźwięk.

OpenClaw nie dołącza ani nie redystrybuuje żadnego z tych pakietów. Dokumentacja prosi użytkowników o
zainstalowanie ich jako zależności hosta przez Homebrew. SoX jest licencjonowany jako
`LGPL-2.0-only AND GPL-2.0-only`; BlackHole jest na licencji GPL-3.0. Jeśli budujesz
instalator albo appliance, który dołącza BlackHole z OpenClaw, sprawdź warunki licencyjne
upstream BlackHole albo uzyskaj osobną licencję od Existential Audio.

## Transporty

### Chrome

Transport Chrome otwiera URL Meet przez sterowanie przeglądarką OpenClaw i dołącza
jako zalogowany profil przeglądarki OpenClaw. W macOS Plugin sprawdza obecność
`BlackHole 2ch` przed uruchomieniem. Jeśli skonfigurowano, uruchamia też komendę kontroli kondycji
mostka audio oraz komendę startową przed otwarciem Chrome. Użyj `chrome`, gdy
Chrome/audio działają na hoście Gateway; użyj `chrome-node`, gdy Chrome/audio działają
na sparowanym Node, takim jak VM Parallels macOS. Dla lokalnego Chrome wybierz
profil za pomocą `browser.defaultProfile`; `chrome.browserProfile` jest przekazywane do
hostów `chrome-node`.

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome-node
```

Skieruj audio mikrofonu i głośnika Chrome przez lokalny mostek audio OpenClaw.
Jeśli `BlackHole 2ch` nie jest zainstalowany, dołączanie kończy się błędem konfiguracji
zamiast po cichu dołączyć bez ścieżki audio.

### Twilio

Transport Twilio to ścisły plan wybierania delegowany do Plugin Voice Call. Nie
parsuje stron Meet w poszukiwaniu numerów telefonów.

Użyj tego, gdy udział przez Chrome jest niedostępny albo chcesz mieć awaryjne
połączenie telefoniczne. Google Meet musi udostępniać numer telefonu do połączenia i PIN dla
spotkania; OpenClaw nie odkrywa ich ze strony Meet.

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

Podaj poświadczenia Twilio przez środowisko albo konfigurację. Środowisko utrzymuje
sekrety poza `openclaw.json`:

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
export GEMINI_API_KEY=...
```

Zamiast tego użyj `realtime.provider: "openai"` z Plugin dostawcy OpenAI oraz
`OPENAI_API_KEY`, jeśli to jest twój dostawca głosu realtime.

Uruchom ponownie albo przeładuj Gateway po włączeniu `voice-call`; zmiany konfiguracji Plugin
nie pojawiają się w już działającym procesie Gateway, dopóki nie zostanie przeładowany.

Następnie zweryfikuj:

```bash
openclaw config validate
openclaw plugins list | grep -E 'google-meet|voice-call'
openclaw googlemeet setup
```

Gdy delegowanie Twilio jest podłączone, `googlemeet setup` zawiera udane kontrole
`twilio-voice-call-plugin`, `twilio-voice-call-credentials` oraz
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

OAuth jest opcjonalny do tworzenia linku Meet, ponieważ `googlemeet create` może
wrócić do automatyzacji przeglądarki. Skonfiguruj OAuth, gdy chcesz oficjalnego tworzenia przez API,
rozwiązywania przestrzeni albo kontroli preflight Meet Media API.

Dostęp do Google Meet API używa OAuth użytkownika: utwórz klienta Google Cloud OAuth,
zażądaj wymaganych zakresów, autoryzuj konto Google, a następnie zapisz
wynikowy token odświeżania w konfiguracji Plugin Google Meet albo podaj
zmienne środowiskowe `OPENCLAW_GOOGLE_MEET_*`.

OAuth nie zastępuje ścieżki dołączania przez Chrome. Transporty Chrome i Chrome-node
nadal dołączają przez zalogowany profil Chrome, BlackHole/SoX oraz połączony
Node, gdy używasz udziału przez przeglądarkę. OAuth jest tylko dla oficjalnej
ścieżki Google Meet API: tworzenia przestrzeni spotkań, rozwiązywania przestrzeni oraz uruchamiania
kontroli preflight Meet Media API.

### Utwórz poświadczenia Google

W Google Cloud Console:

1. Utwórz albo wybierz projekt Google Cloud.
2. Włącz **Google Meet REST API** dla tego projektu.
3. Skonfiguruj ekran zgody OAuth.
   - **Internal** jest najprostsze dla organizacji Google Workspace.
   - **External** działa dla konfiguracji osobistych/testowych; gdy aplikacja jest w trybie Testing,
     dodaj każde konto Google, które będzie autoryzować aplikację, jako użytkownika testowego.
4. Dodaj zakresy, których żąda OpenClaw:
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

`meetings.space.created` jest wymagany przez Google Meet `spaces.create`.
`meetings.space.readonly` pozwala OpenClaw rozwiązywać URL-e/kody Meet do przestrzeni.
`meetings.space.settings` pozwala OpenClaw przekazywać ustawienia `SpaceConfig`, takie jak
`accessType`, podczas tworzenia pokoju przez API.
`meetings.conference.media.readonly` służy do preflight Meet Media API i pracy z mediami;
Google może wymagać rejestracji w Developer Preview do faktycznego użycia Media API.
Jeśli potrzebujesz tylko dołączeń przez Chrome opartych na przeglądarce, całkowicie pomiń OAuth.

### Wygeneruj token odświeżania

Skonfiguruj `oauth.clientId` i opcjonalnie `oauth.clientSecret` albo przekaż je jako
zmienne środowiskowe, a następnie uruchom:

```bash
openclaw googlemeet auth login --json
```

Komenda wypisuje blok konfiguracji `oauth` z tokenem odświeżania. Używa PKCE,
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

Wynik JSON zawiera:

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
a potem używa środowiska jako fallbacku.

Zgoda OAuth obejmuje tworzenie przestrzeni Meet, dostęp do odczytu przestrzeni Meet oraz dostęp
do odczytu multimediów konferencji Meet. Jeśli uwierzytelnienie wykonano przed pojawieniem się
obsługi tworzenia spotkań, uruchom ponownie `openclaw googlemeet auth login --json`, aby token odświeżania
miał zakres `meetings.space.created`.

### Zweryfikuj OAuth za pomocą doctor

Uruchom OAuth doctor, gdy chcesz szybkiej, bezsekretowej kontroli kondycji:

```bash
openclaw googlemeet doctor --oauth --json
```

Nie ładuje to runtime Chrome ani nie wymaga połączonego Node Chrome. Sprawdza,
czy konfiguracja OAuth istnieje i czy token odświeżania może wygenerować token dostępu.
Raport JSON zawiera tylko pola statusu, takie jak `ok`, `configured`,
`tokenSource`, `expiresAt` i komunikaty kontroli; nie wypisuje tokenu dostępu,
tokenu odświeżania ani sekretu klienta.

Typowe wyniki:

| Kontrola             | Znaczenie                                                                               |
| -------------------- | --------------------------------------------------------------------------------------- |
| `oauth-config`       | Obecne jest `oauth.clientId` wraz z `oauth.refreshToken` albo token dostępu z pamięci podręcznej. |
| `oauth-token`        | Token dostępu z pamięci podręcznej jest nadal ważny albo token odświeżania wydał nowy token dostępu. |
| `meet-spaces-get`    | Opcjonalna kontrola `--meeting` odnalazła istniejącą przestrzeń Meet.                   |
| `meet-spaces-create` | Opcjonalna kontrola `--create-space` utworzyła nową przestrzeń Meet.                    |

Aby potwierdzić także włączenie Google Meet API oraz zakres `spaces.create`,
uruchom kontrolę tworzenia wywołującą skutki uboczne:

```bash
openclaw googlemeet doctor --oauth --create-space --json
openclaw googlemeet create --no-join --json
```

`--create-space` tworzy jednorazowy adres URL Meet. Użyj go, gdy musisz
potwierdzić, że projekt Google Cloud ma włączone Meet API oraz że autoryzowane
konto ma zakres `meetings.space.created`.

Aby potwierdzić dostęp do odczytu dla istniejącej przestrzeni spotkania:

```bash
openclaw googlemeet doctor --oauth --meeting https://meet.google.com/abc-defg-hij --json
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
```

`doctor --oauth --meeting` i `resolve-space` potwierdzają dostęp do odczytu
istniejącej przestrzeni, do której autoryzowane konto Google ma dostęp. `403` z
tych kontroli zwykle oznacza, że Google Meet REST API jest wyłączone, zatwierdzony
token odświeżania nie ma wymaganego zakresu albo konto Google nie ma dostępu do
tej przestrzeni Meet. Błąd tokenu odświeżania oznacza, że należy ponownie
uruchomić `openclaw googlemeet auth login --json` i zapisać nowy blok `oauth`.

Dla awaryjnego trybu przeglądarki nie są potrzebne żadne poświadczenia OAuth. W
tym trybie uwierzytelnianie Google pochodzi z zalogowanego profilu Chrome na
wybranym Node, a nie z konfiguracji OpenClaw.

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

Uruchom kontrolę wstępną przed pracą z multimediami:

```bash
openclaw googlemeet preflight --meeting https://meet.google.com/abc-defg-hij
```

Wyświetl artefakty spotkania i obecność po utworzeniu przez Meet rekordów konferencji:

```bash
openclaw googlemeet artifacts --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet attendance --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet export --meeting https://meet.google.com/abc-defg-hij --output ./meet-export
```

Z `--meeting`, `artifacts` i `attendance` domyślnie używają najnowszego rekordu
konferencji. Przekaż `--all-conference-records`, gdy chcesz uzyskać każdy
zachowany rekord dla tego spotkania.

Wyszukiwanie w kalendarzu może rozwiązać adres URL spotkania z Google Calendar
przed odczytem artefaktów Meet:

```bash
openclaw googlemeet latest --today
openclaw googlemeet calendar-events --today --json
openclaw googlemeet artifacts --event "Weekly sync"
openclaw googlemeet attendance --today --format csv --output attendance.csv
```

`--today` przeszukuje dzisiejszy kalendarz `primary` pod kątem wydarzenia
Calendar z linkiem Google Meet. Użyj `--event <query>`, aby wyszukać pasujący
tekst wydarzenia, oraz `--calendar <id>` dla kalendarza innego niż główny.
Wyszukiwanie w kalendarzu wymaga świeżego logowania OAuth, które obejmuje zakres
tylko do odczytu wydarzeń Calendar. `calendar-events` pokazuje podgląd pasujących
wydarzeń Meet i oznacza wydarzenie, które wybierze `latest`, `artifacts`,
`attendance` albo `export`.

Jeśli znasz już identyfikator rekordu konferencji, zaadresuj go bezpośrednio:

```bash
openclaw googlemeet latest --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet artifacts --conference-record conferenceRecords/abc123 --json
openclaw googlemeet attendance --conference-record conferenceRecords/abc123 --json
```

Zakończ aktywną konferencję dla przestrzeni utworzonej przez API, gdy chcesz
zamknąć pokój po rozmowie:

```bash
openclaw googlemeet end-active-conference https://meet.google.com/abc-defg-hij
```

To wywołuje Google Meet `spaces.endActiveConference` i wymaga OAuth z zakresem
`meetings.space.created` dla przestrzeni, którą autoryzowane konto może zarządzać.
OpenClaw akceptuje jako wejście adres URL Meet, kod spotkania albo `spaces/{id}`
i rozwiązuje je do zasobu przestrzeni API przed zakończeniem aktywnej konferencji.
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

`artifacts` zwraca metadane rekordu konferencji oraz metadane zasobów
uczestników, nagrań, transkrypcji, uporządkowanych wpisów transkrypcji i
inteligentnych notatek, gdy Google udostępnia je dla spotkania. Użyj
`--no-transcript-entries`, aby pominąć wyszukiwanie wpisów dla dużych spotkań.
`attendance` rozwija uczestników do wierszy sesji uczestników z czasem pierwszego
i ostatniego zaobserwowania, całkowitym czasem trwania sesji, flagami spóźnienia
i wcześniejszego wyjścia oraz zduplikowanymi zasobami uczestników scalonymi według
zalogowanego użytkownika albo nazwy wyświetlanej. Przekaż
`--no-merge-duplicates`, aby zachować surowe zasoby uczestników osobno,
`--late-after-minutes`, aby dostroić wykrywanie spóźnień, oraz
`--early-before-minutes`, aby dostroić wykrywanie wcześniejszego wyjścia.

`export` zapisuje folder zawierający `summary.md`, `attendance.csv`,
`transcript.md`, `artifacts.json`, `attendance.json` i `manifest.json`.
`manifest.json` zapisuje wybrane wejście, opcje eksportu, rekordy konferencji,
pliki wyjściowe, liczby, źródło tokenu, wydarzenie Calendar, jeśli zostało użyte,
oraz wszystkie ostrzeżenia o częściowym pobraniu. Przekaż `--zip`, aby dodatkowo
zapisać przenośne archiwum obok folderu. Przekaż `--include-doc-bodies`, aby
wyeksportować tekst połączonych transkrypcji i inteligentnych notatek Google Docs
przez Google Drive `files.export`; wymaga to świeżego logowania OAuth, które
obejmuje zakres tylko do odczytu Drive Meet. Bez `--include-doc-bodies` eksporty
zawierają tylko metadane Meet i uporządkowane wpisy transkrypcji. Jeśli Google
zwróci częściowy błąd artefaktu, taki jak błąd listy inteligentnych notatek,
wpisu transkrypcji albo treści dokumentu Drive, podsumowanie i manifest zachowują
ostrzeżenie zamiast kończyć cały eksport niepowodzeniem. Użyj `--dry-run`, aby
pobrać te same dane artefaktów/obecności i wydrukować JSON manifestu bez tworzenia
folderu ani pliku ZIP. Jest to przydatne przed zapisaniem dużego eksportu albo
gdy agent potrzebuje tylko liczników, wybranych rekordów i ostrzeżeń.

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

Ustaw `"dryRun": true`, aby zwrócić tylko manifest eksportu i pominąć zapisy plików.

Agenci mogą też utworzyć pokój wspierany przez API z jawną polityką dostępu:

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

W przypadku walidacji najpierw przez nasłuchiwanie agenci powinni użyć
`test_listen`, zanim stwierdzą, że spotkanie jest użyteczne:

```json
{
  "action": "test_listen",
  "url": "https://meet.google.com/abc-defg-hij",
  "transport": "chrome-node",
  "timeoutMs": 30000
}
```

Uruchom strzeżony test live smoke na rzeczywistym zachowanym spotkaniu:

```bash
OPENCLAW_LIVE_TEST=1 \
OPENCLAW_GOOGLE_MEET_LIVE_MEETING=https://meet.google.com/abc-defg-hij \
pnpm test:live -- extensions/google-meet/google-meet.live.test.ts
```

Uruchom przeglądarkową sondę live najpierw przez nasłuchiwanie na spotkaniu, na
którym ktoś będzie mówić i dostępne będą napisy Meet:

```bash
openclaw googlemeet setup --transport chrome-node --mode transcribe
openclaw googlemeet test-listen https://meet.google.com/abc-defg-hij --transport chrome-node --timeout-ms 30000
```

Środowisko live smoke:

- `OPENCLAW_LIVE_TEST=1` włącza strzeżone testy live.
- `OPENCLAW_GOOGLE_MEET_LIVE_MEETING` wskazuje zachowany adres URL Meet, kod albo
  `spaces/{id}`.
- `OPENCLAW_GOOGLE_MEET_CLIENT_ID` lub `GOOGLE_MEET_CLIENT_ID` dostarcza
  identyfikator klienta OAuth.
- `OPENCLAW_GOOGLE_MEET_REFRESH_TOKEN` lub `GOOGLE_MEET_REFRESH_TOKEN` dostarcza
  token odświeżania.
- Opcjonalnie: `OPENCLAW_GOOGLE_MEET_CLIENT_SECRET`,
  `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN` i
  `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT` używają tych samych nazw
  awaryjnych bez prefiksu `OPENCLAW_`.

Podstawowy live smoke artefaktów/obecności wymaga
`https://www.googleapis.com/auth/meetings.space.readonly` i
`https://www.googleapis.com/auth/meetings.conference.media.readonly`.
Wyszukiwanie w kalendarzu wymaga
`https://www.googleapis.com/auth/calendar.events.readonly`. Eksport treści
dokumentu Drive wymaga `https://www.googleapis.com/auth/drive.meet.readonly`.

Utwórz świeżą przestrzeń Meet:

```bash
openclaw googlemeet create
```

Polecenie wypisuje nowy `meeting uri`, źródło i sesję dołączenia. Z
poświadczeniami OAuth używa oficjalnego Google Meet API. Bez poświadczeń OAuth
używa jako trybu awaryjnego zalogowanego profilu przeglądarki przypiętego Node
Chrome. Agenci mogą użyć narzędzia `google_meet` z `action: "create"`, aby
utworzyć i dołączyć w jednym kroku. Aby utworzyć tylko adres URL, przekaż
`"join": false`.

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

Jeśli awaryjny tryb przeglądarki trafi na logowanie Google albo blokadę uprawnień
Meet, zanim będzie mógł utworzyć adres URL, metoda Gateway zwraca odpowiedź
nieudaną, a narzędzie `google_meet` zwraca uporządkowane szczegóły zamiast
zwykłego ciągu znaków:

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
`manualActionMessage` oraz kontekst Node/karty przeglądarki i przestać otwierać
nowe karty Meet, dopóki operator nie wykona kroku w przeglądarce.

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

Utworzenie spotkania Meet domyślnie powoduje dołączenie. Transport Chrome lub Chrome-node nadal
wymaga zalogowanego profilu Google Chrome, aby dołączyć przez przeglądarkę. Jeśli
profil jest wylogowany, OpenClaw zgłasza `manualActionRequired: true` albo błąd
awaryjnego użycia przeglądarki i prosi operatora o dokończenie logowania do Google przed
ponowną próbą.

Ustaw `preview.enrollmentAcknowledged: true` dopiero po potwierdzeniu, że projekt Cloud,
podmiot OAuth i uczestnicy spotkania są zarejestrowani w Google
Workspace Developer Preview Program dla interfejsów API multimediów Meet.

## Konfiguracja

Wspólna ścieżka agenta Chrome wymaga tylko włączonego pluginu, BlackHole, SoX, klucza
dostawcy transkrypcji w czasie rzeczywistym oraz skonfigurowanego dostawcy TTS OpenClaw.
OpenAI jest domyślnym dostawcą transkrypcji; ustaw `realtime.voiceProvider` na
`"google"` i `realtime.model`, aby używać Google Gemini Live w trybie `bidi`
bez zmiany domyślnego dostawcy transkrypcji dla trybu agenta:

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
# or
export GEMINI_API_KEY=...
```

Ustaw konfigurację pluginu w `plugins.entries.google-meet.config`:

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

Domyślne ustawienia:

- `defaultTransport: "chrome"`
- `defaultMode: "agent"` (`"realtime"` jest akceptowane tylko jako starszy alias
  zgodności dla `"agent"`; nowe wywołania narzędzi powinny używać `"agent"`)
- `chromeNode.node`: opcjonalny identyfikator/nazwa/IP węzła dla `chrome-node`
- `chrome.audioBackend: "blackhole-2ch"`
- `chrome.guestName: "OpenClaw Agent"`: nazwa używana na ekranie gościa Meet
  bez logowania
- `chrome.autoJoin: true`: najlepsza możliwa próba wypełnienia nazwy gościa i kliknięcia Dołącz teraz
  przez automatyzację przeglądarki OpenClaw na `chrome-node`
- `chrome.reuseExistingTab: true`: aktywuje istniejącą kartę Meet zamiast
  otwierać duplikaty
- `chrome.waitForInCallMs: 20000`: czeka, aż karta Meet zgłosi bycie w rozmowie,
  zanim zostanie uruchomione wprowadzenie odpowiedzi głosowej
- `chrome.audioFormat: "pcm16-24khz"`: format dźwięku pary poleceń. Używaj
  `"g711-ulaw-8khz"` tylko dla starszych/niestandardowych par poleceń, które nadal emitują
  dźwięk telefoniczny.
- `chrome.audioBufferBytes: 4096`: bufor przetwarzania SoX dla wygenerowanych poleceń
  dźwięku pary poleceń Chrome. To połowa domyślnego bufora SoX o rozmiarze 8192 bajtów,
  zmniejszająca domyślne opóźnienie potoku, a jednocześnie zostawiająca możliwość zwiększenia go na obciążonych hostach.
  Wartości poniżej minimum SoX są ograniczane do 17 bajtów.
- `chrome.audioInputCommand`: polecenie SoX odczytujące z CoreAudio `BlackHole 2ch`
  i zapisujące dźwięk w `chrome.audioFormat`
- `chrome.audioOutputCommand`: polecenie SoX odczytujące dźwięk w `chrome.audioFormat`
  i zapisujące do CoreAudio `BlackHole 2ch`
- `chrome.bargeInInputCommand`: opcjonalne polecenie lokalnego mikrofonu, które zapisuje
  podpisany 16-bitowy jednokanałowy PCM little-endian do wykrywania przerwań przez człowieka, gdy
  odtwarzanie asystenta jest aktywne. Obecnie dotyczy to hostowanego przez Gateway
  mostu pary poleceń `chrome`.
- `chrome.bargeInRmsThreshold: 650`: poziom RMS liczony jako przerwanie przez człowieka
  w `chrome.bargeInInputCommand`
- `chrome.bargeInPeakThreshold: 2500`: poziom szczytowy liczony jako przerwanie przez człowieka
  w `chrome.bargeInInputCommand`
- `chrome.bargeInCooldownMs: 900`: minimalne opóźnienie między powtarzanymi czyszczeniami
  przerwań przez człowieka
- `mode: "agent"`: domyślny tryb odpowiedzi głosowej. Mowa uczestników jest transkrybowana przez
  skonfigurowanego dostawcę transkrypcji w czasie rzeczywistym, wysyłana do skonfigurowanego
  agenta OpenClaw w sesji podagenta dla danego spotkania i odtwarzana głosowo przez
  zwykły runtime TTS OpenClaw.
- `mode: "bidi"`: awaryjny bezpośredni dwukierunkowy tryb modelu czasu rzeczywistego. Dostawca
  głosu w czasie rzeczywistym odpowiada bezpośrednio na mowę uczestników i może wywołać
  `openclaw_agent_consult`, aby uzyskać głębsze odpowiedzi oparte na narzędziach.
- `mode: "transcribe"`: tryb tylko obserwacji bez mostu odpowiedzi głosowej.
- `realtime.provider: "openai"`: awaryjne ustawienie zgodności używane, gdy poniższe pola
  dostawcy o ograniczonym zakresie nie są ustawione.
- `realtime.transcriptionProvider: "openai"`: identyfikator dostawcy używany przez tryb `agent`
  do transkrypcji w czasie rzeczywistym.
- `realtime.voiceProvider`: identyfikator dostawcy używany przez tryb `bidi` do bezpośredniego głosu
  w czasie rzeczywistym. Ustaw go na `"google"`, aby używać Gemini Live przy zachowaniu transkrypcji
  w trybie agenta w OpenAI.
- `realtime.toolPolicy: "safe-read-only"`
- `realtime.instructions`: krótkie odpowiedzi mówione, z
  `openclaw_agent_consult` dla głębszych odpowiedzi
- `realtime.introMessage`: krótka mówiona kontrola gotowości, gdy most czasu rzeczywistego
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
`messages.tts.providers.elevenlabs.voiceId`. Odpowiedzi agenta mogą też używać
dyrektyw dla pojedynczych odpowiedzi `[[tts:voiceId=... model=eleven_v3]]`, gdy nadpisania modelu TTS
są włączone, ale konfiguracja jest deterministycznym ustawieniem domyślnym dla spotkań.
Przy dołączeniu logi powinny pokazywać `transcriptionProvider=elevenlabs`, a każda
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
rzeczywiste połączenie PSTN, DTMF i powitanie wprowadzające do pluginu Voice Call. Voice Call
odtwarza sekwencję DTMF przed otwarciem strumienia multimediów czasu rzeczywistego, a następnie używa
zapisanego tekstu wprowadzenia jako początkowego powitania czasu rzeczywistego. Jeśli `voice-call` nie jest
włączony, Google Meet nadal może zweryfikować i zapisać plan wybierania, ale nie może
wykonać połączenia Twilio.

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
tworzy odpowiedź, a zwykły TTS OpenClaw wypowiada ją w Meet. Użyj
`mode: "bidi"`, gdy chcesz, aby model głosu w czasie rzeczywistym odpowiadał bezpośrednio.
Surowe `mode: "realtime"` pozostaje akceptowane jako starszy alias zgodności dla
`mode: "agent"`, ale nie jest już reklamowane w schemacie narzędzia agenta.
Logi trybu agenta zawierają rozpoznanego dostawcę/model transkrypcji przy starcie mostu
oraz dostawcę TTS, model, głos, format wyjściowy i częstotliwość próbkowania po
każdej zsyntetyzowanej odpowiedzi.

Użyj `action: "status"`, aby wyświetlić aktywne sesje albo sprawdzić identyfikator sesji. Użyj
`action: "speak"` z `sessionId` i `message`, aby agent czasu rzeczywistego
zaczął mówić natychmiast. Użyj `action: "test_speech"`, aby utworzyć albo ponownie użyć sesji,
wyzwolić znaną frazę i zwrócić stan `inCall`, gdy host Chrome może
go zgłosić. `test_speech` zawsze wymusza `mode: "agent"` i kończy się niepowodzeniem, jeśli zostanie poproszone o
uruchomienie w `mode: "transcribe"`, ponieważ sesje tylko obserwacji celowo nie mogą
emitować mowy. Wynik `speechOutputVerified` jest oparty na wzroście bajtów wyjściowego dźwięku czasu rzeczywistego
podczas tego wywołania testowego, więc ponownie użyta sesja ze starszym dźwiękiem
nie liczy się jako świeżo udana kontrola mowy. Użyj `action: "leave"`, aby oznaczyć
sesję jako zakończoną.

`status` zawiera stan Chrome, gdy jest dostępny:

- `inCall`: Chrome wydaje się być wewnątrz rozmowy Meet
- `micMuted`: najlepszy możliwy stan mikrofonu Meet
- `manualActionRequired` / `manualActionReason` / `manualActionMessage`: profil
  przeglądarki wymaga ręcznego logowania, dopuszczenia przez gospodarza Meet, uprawnień albo
  naprawy sterowania przeglądarką, zanim mowa będzie działać
- `speechReady` / `speechBlockedReason` / `speechBlockedMessage`: czy
  zarządzana mowa Chrome jest teraz dozwolona. `speechReady: false` oznacza, że OpenClaw
  nie wysłał frazy wprowadzającej/testowej do mostu dźwiękowego.
- `providerConnected` / `realtimeReady`: stan mostu głosu w czasie rzeczywistym
- `lastInputAt` / `lastOutputAt`: ostatni dźwięk odebrany z mostu albo wysłany do niego
- `audioOutputRouted` / `audioOutputDeviceLabel`: czy wyjście multimediów karty Meet
  było aktywnie kierowane do urządzenia BlackHole używanego przez most
- `lastSuppressedInputAt` / `suppressedInputBytes`: wejście local loopback ignorowane, gdy
  odtwarzanie asystenta jest aktywne

```json
{
  "action": "speak",
  "sessionId": "meet_...",
  "message": "Say exactly: I'm here and listening."
}
```

## Tryby Agenta i Bidi

Tryb Chrome `agent` jest zoptymalizowany pod kątem zachowania „mój agent jest na spotkaniu”. Dostawca
transkrypcji w czasie rzeczywistym słyszy dźwięk spotkania, finalne transkrypcje uczestników
są kierowane przez skonfigurowanego agenta OpenClaw, a odpowiedź jest
wypowiadana przez zwykły runtime TTS OpenClaw. Ustaw `mode: "bidi"`, gdy chcesz,
aby model głosu w czasie rzeczywistym odpowiadał bezpośrednio.
Pobliskie finalne fragmenty transkrypcji są scalane przed konsultacją, aby jedna wypowiedziana
wypowiedź nie tworzyła kilku nieaktualnych częściowych odpowiedzi. Wejście czasu rzeczywistego jest też
wyciszane, gdy zakolejkowany dźwięk asystenta nadal jest odtwarzany,
a niedawne echa transkrypcji przypominające asystenta są ignorowane przed konsultacją agenta,
aby local loopback BlackHole nie sprawił, że agent odpowie na własną mowę.

| Tryb    | Kto decyduje o odpowiedzi        | Ścieżka wyjścia mowy                     | Użyj, gdy                                              |
| ------- | ----------------------------- | -------------------------------------- | ----------------------------------------------------- |
| `agent` | Skonfigurowany agent OpenClaw | Zwykły runtime TTS OpenClaw            | Chcesz zachowania „mój agent jest na spotkaniu”        |
| `bidi`  | Model głosu w czasie rzeczywistym      | Odpowiedź dźwiękowa dostawcy głosu w czasie rzeczywistym | Chcesz pętli konwersacyjnego głosu o najniższym opóźnieniu |

W trybie `bidi`, gdy model czasu rzeczywistego potrzebuje głębszego rozumowania, aktualnych
informacji albo zwykłych narzędzi OpenClaw, może wywołać `openclaw_agent_consult`.

Narzędzie consult uruchamia zwykłego agenta OpenClaw w tle, z kontekstem ostatniego transkryptu spotkania, i zwraca zwięzłą odpowiedź do wypowiedzenia. W trybie `agent` OpenClaw wysyła tę odpowiedź bezpośrednio do środowiska uruchomieniowego TTS; w trybie `bidi` model głosowy czasu rzeczywistego może wypowiedzieć wynik consult z powrotem na spotkaniu. Używa tego samego współdzielonego mechanizmu consult co Voice Call.

Domyślnie consults działają względem agenta `main`. Ustaw `realtime.agentId`, gdy kanał Meet ma konsultować się z dedykowanym obszarem roboczym agenta OpenClaw, domyślnymi ustawieniami modelu, polityką narzędzi, pamięcią i historią sesji.

Consults w trybie agenta używają klucza sesji per spotkanie `agent:<id>:subagent:google-meet:<session>`, dzięki czemu pytania uzupełniające zachowują kontekst spotkania, jednocześnie dziedzicząc normalną politykę agenta ze skonfigurowanego agenta.

`realtime.toolPolicy` kontroluje uruchomienie consult:

- `safe-read-only`: udostępnia narzędzie consult i ogranicza zwykłego agenta do
  `read`, `web_search`, `web_fetch`, `x_search`, `memory_search` oraz
  `memory_get`.
- `owner`: udostępnia narzędzie consult i pozwala zwykłemu agentowi używać normalnej polityki narzędzi agenta.
- `none`: nie udostępnia narzędzia consult modelowi głosowemu czasu rzeczywistego.

Klucz sesji consult jest ograniczony do danej sesji Meet, więc kolejne wywołania consult mogą ponownie używać wcześniejszego kontekstu consult podczas tego samego spotkania.

Aby wymusić głosowe sprawdzenie gotowości po pełnym dołączeniu Chrome do rozmowy:

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

- `googlemeet setup` jest całe zielone.
- `googlemeet setup` zawiera `chrome-node-connected`, gdy Chrome-node jest
  domyślnym transportem albo przypięty jest węzeł.
- `nodes status` pokazuje, że wybrany węzeł jest połączony.
- Wybrany węzeł ogłasza zarówno `googlemeet.chrome`, jak i `browser.proxy`.
- Karta Meet dołącza do rozmowy, a `test-speech` zwraca stan Chrome z
  `inCall: true`.

Dla zdalnego hosta Chrome, takiego jak maszyna wirtualna Parallels macOS, to najkrótsza bezpieczna kontrola po aktualizacji Gateway albo maszyny wirtualnej:

```bash
openclaw googlemeet setup
openclaw nodes status --connected
openclaw nodes invoke \
  --node parallels-macos \
  --command googlemeet.chrome \
  --params '{"action":"setup"}'
```

To potwierdza, że Plugin Gateway jest załadowany, węzeł maszyny wirtualnej jest połączony z bieżącym tokenem, a most audio Meet jest dostępny, zanim agent otworzy prawdziwą kartę spotkania.

Dla testu smoke Twilio użyj spotkania, które udostępnia szczegóły telefonicznego dołączania:

```bash
openclaw googlemeet setup
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --pin 123456
```

Oczekiwany stan Twilio:

- `googlemeet setup` zawiera zielone kontrole `twilio-voice-call-plugin`,
  `twilio-voice-call-credentials` oraz `twilio-voice-call-webhook`.
- `voicecall` jest dostępne w CLI po ponownym załadowaniu Gateway.
- Zwrócona sesja ma `transport: "twilio"` oraz `twilio.voiceCallId`.
- `openclaw logs --follow` pokazuje TwiML DTMF podane przed TwiML czasu rzeczywistego, a następnie most czasu rzeczywistego z zakolejkowanym początkowym powitaniem.
- `googlemeet leave <sessionId>` rozłącza delegowane połączenie głosowe.

## Rozwiązywanie problemów

### Agent nie widzi narzędzia Google Meet

Potwierdź, że Plugin jest włączony w konfiguracji Gateway, i ponownie załaduj Gateway:

```bash
openclaw plugins list | grep google-meet
openclaw googlemeet setup
```

Jeśli właśnie edytowano `plugins.entries.google-meet`, zrestartuj albo ponownie załaduj Gateway. Uruchomiony agent widzi tylko narzędzia Plugin zarejestrowane przez bieżący proces Gateway.

Na hostach Gateway innych niż macOS narzędzie `google_meet` widoczne dla agenta pozostaje widoczne, ale lokalne akcje mówienia zwrotnego Chrome są blokowane, zanim trafią do mostu audio. Lokalny dźwięk mówienia zwrotnego Chrome obecnie zależy od macOS `BlackHole 2ch`, więc agenci Linuksa powinni używać `mode: "transcribe"`, telefonicznego dołączania Twilio albo hosta macOS `chrome-node` zamiast domyślnej ścieżki lokalnego agenta Chrome.

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

Jeśli `googlemeet setup` kończy się niepowodzeniem dla `chrome-node-connected` albo log Gateway zgłasza `gateway token mismatch`, ponownie zainstaluj albo zrestartuj węzeł z bieżącym tokenem Gateway. Dla Gateway w sieci LAN zwykle oznacza to:

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

### Przeglądarka się otwiera, ale agent nie może dołączyć

Uruchom `googlemeet test-listen` dla dołączeń tylko do obserwacji albo `googlemeet test-speech` dla dołączeń czasu rzeczywistego, a następnie sprawdź zwrócony stan Chrome. Jeśli którykolwiek test zgłosi `manualActionRequired: true`, pokaż operatorowi `manualActionMessage` i przestań ponawiać próby, dopóki akcja w przeglądarce nie zostanie zakończona.

Typowe akcje ręczne:

- Zaloguj się do profilu Chrome.
- Wpuść gościa z konta gospodarza Meet.
- Przyznaj Chrome uprawnienia mikrofonu/kamery, gdy pojawi się natywny monit uprawnień Chrome.
- Zamknij albo napraw zablokowane okno dialogowe uprawnień Meet.

Nie zgłaszaj „nie zalogowano” tylko dlatego, że Meet pokazuje „Do you want people to hear you in the meeting?” To ekran pośredni wyboru audio w Meet; OpenClaw klika **Use microphone** przez automatyzację przeglądarki, gdy jest dostępne, i nadal czeka na rzeczywisty stan spotkania. W przypadku awaryjnej ścieżki przeglądarkowej tylko do tworzenia OpenClaw może kliknąć **Continue without microphone**, ponieważ utworzenie URL-a nie wymaga ścieżki audio czasu rzeczywistego.

### Tworzenie spotkania kończy się niepowodzeniem

`googlemeet create` najpierw używa endpointu Google Meet API `spaces.create`, gdy skonfigurowane są dane uwierzytelniające OAuth. Bez danych uwierzytelniających OAuth przełącza się na przypiętą przeglądarkę węzła Chrome. Potwierdź:

- Dla tworzenia przez API: skonfigurowane są `oauth.clientId` i `oauth.refreshToken`
  albo obecne są pasujące zmienne środowiskowe `OPENCLAW_GOOGLE_MEET_*`.
- Dla tworzenia przez API: token odświeżania został wygenerowany po dodaniu obsługi tworzenia. Starszym tokenom może brakować zakresu `meetings.space.created`; uruchom ponownie `openclaw googlemeet auth login --json` i zaktualizuj konfigurację Plugin.
- Dla awaryjnej ścieżki przeglądarkowej: `defaultTransport: "chrome-node"` oraz
  `chromeNode.node` wskazują połączony węzeł z `browser.proxy` i
  `googlemeet.chrome`.
- Dla awaryjnej ścieżki przeglądarkowej: profil OpenClaw Chrome na tym węźle jest zalogowany do Google i może otworzyć `https://meet.google.com/new`.
- Dla awaryjnej ścieżki przeglądarkowej: ponowienia używają istniejącej karty `https://meet.google.com/new` albo monitu konta Google przed otwarciem nowej karty. Jeśli agent przekroczy limit czasu, ponów wywołanie narzędzia zamiast ręcznie otwierać kolejną kartę Meet.
- Dla awaryjnej ścieżki przeglądarkowej: jeśli narzędzie zwraca `manualActionRequired: true`, użyj zwróconych `browser.nodeId`, `browser.targetId`, `browserUrl` i
  `manualActionMessage`, aby poprowadzić operatora. Nie ponawiaj w pętli, dopóki ta akcja nie zostanie zakończona.
- Dla awaryjnej ścieżki przeglądarkowej: jeśli Meet pokazuje „Do you want people to hear you in the meeting?”, zostaw kartę otwartą. OpenClaw powinien kliknąć **Use microphone** albo, dla awaryjnej ścieżki tylko do tworzenia, **Continue without microphone** przez automatyzację przeglądarki i nadal czekać na wygenerowany URL Meet. Jeśli nie może, błąd powinien wspominać `meet-audio-choice-required`, a nie `google-login-required`.

### Agent dołącza, ale nie mówi

Sprawdź ścieżkę czasu rzeczywistego:

```bash
openclaw googlemeet setup
openclaw googlemeet doctor
```

Użyj `mode: "agent"` dla normalnej ścieżki mówienia zwrotnego STT -> agent OpenClaw -> TTS albo `mode: "bidi"` dla bezpośredniej awaryjnej ścieżki głosowej czasu rzeczywistego. `mode: "transcribe"` celowo nie uruchamia mostu mówienia zwrotnego. Do debugowania tylko obserwacji uruchom `openclaw googlemeet status --json <session-id>` po wypowiedziach uczestników i sprawdź `captioning`, `transcriptLines` oraz `lastCaptionText`. Jeśli `inCall` ma wartość
true, ale `transcriptLines` pozostaje na `0`, napisy Meet mogą być wyłączone, nikt nie mówił od czasu zainstalowania obserwatora, interfejs Meet się zmienił albo napisy na żywo są niedostępne dla języka/konta spotkania.

`googlemeet test-speech` zawsze sprawdza ścieżkę czasu rzeczywistego i zgłasza, czy dla tego wywołania zaobserwowano bajty wyjściowe mostu. Jeśli `speechOutputVerified` ma wartość false, a
`speechOutputTimedOut` ma wartość true, dostawca czasu rzeczywistego mógł zaakceptować wypowiedź, ale OpenClaw nie zobaczył, aby nowe bajty wyjściowe dotarły do mostu audio Chrome.

Zweryfikuj również:

- Klucz dostawcy czasu rzeczywistego jest dostępny na hoście Gateway, taki jak
  `OPENAI_API_KEY` albo `GEMINI_API_KEY`.
- `BlackHole 2ch` jest widoczne na hoście Chrome.
- `sox` istnieje na hoście Chrome.
- Mikrofon i głośnik Meet są kierowane przez wirtualną ścieżkę audio używaną przez OpenClaw. `doctor` powinien pokazywać `meet output routed: yes` dla lokalnych dołączeń Chrome czasu rzeczywistego.

`googlemeet doctor [session-id]` wypisuje sesję, węzeł, stan w rozmowie, powód akcji ręcznej, połączenie z dostawcą czasu rzeczywistego, `realtimeReady`, aktywność wejścia/wyjścia audio, ostatnie znaczniki czasu audio, liczniki bajtów i URL przeglądarki.
Użyj `googlemeet status [session-id] --json`, gdy potrzebujesz surowego JSON. Użyj
`googlemeet doctor --oauth`, gdy potrzebujesz zweryfikować odświeżanie OAuth Google Meet bez ujawniania tokenów; dodaj `--meeting` albo `--create-space`, gdy potrzebujesz również dowodu Google Meet API.

Jeśli agent przekroczył limit czasu i widać już otwartą kartę Meet, sprawdź tę kartę bez otwierania kolejnej:

```bash
openclaw googlemeet recover-tab
openclaw googlemeet recover-tab https://meet.google.com/abc-defg-hij
```

Odpowiadająca akcja narzędzia to `recover_current_tab`. Ustawia fokus i sprawdza istniejącą kartę Meet dla wybranego transportu. Z `chrome` używa lokalnego sterowania przeglądarką przez Gateway; z `chrome-node` używa skonfigurowanego węzła Chrome. Nie otwiera nowej karty ani nie tworzy nowej sesji; zgłasza bieżącą blokadę, taką jak logowanie, wpuszczenie, uprawnienia albo stan wyboru audio.
Polecenie CLI komunikuje się ze skonfigurowanym Gateway, więc Gateway musi działać;
`chrome-node` wymaga też, aby węzeł Chrome był połączony.

### Kontrole konfiguracji Twilio kończą się niepowodzeniem

`twilio-voice-call-plugin` kończy się niepowodzeniem, gdy `voice-call` nie jest dozwolone albo nie jest włączone.
Dodaj je do `plugins.allow`, włącz `plugins.entries.voice-call` i ponownie załaduj Gateway.

`twilio-voice-call-credentials` kończy się niepowodzeniem, gdy backendowi Twilio brakuje identyfikatora SID konta, tokena uwierzytelniającego albo numeru dzwoniącego. Ustaw je na hoście Gateway:

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
```

`twilio-voice-call-webhook` kończy się niepowodzeniem, gdy `voice-call` nie ma publicznej ekspozycji Webhook albo gdy `publicUrl` wskazuje na local loopback lub przestrzeń sieci prywatnej.
Ustaw `plugins.entries.voice-call.config.publicUrl` na URL publicznego dostawcy albo skonfiguruj tunel/ekspozycję Tailscale dla `voice-call`.

Adresy local loopback i prywatne URL-e nie są poprawne dla wywołań zwrotnych operatorów. Nie używaj `localhost`, `127.0.0.1`, `0.0.0.0`, `10.x`, `172.16.x`-`172.31.x`,
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

Do programowania lokalnego użyj tunelu lub ekspozycji Tailscale zamiast
adresu URL hosta prywatnego:

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

`voicecall smoke` domyślnie sprawdza wyłącznie gotowość. Aby wykonać próbę na sucho dla konkretnego numeru:

```bash
openclaw voicecall smoke --to "+15555550123"
```

Dodaj `--yes` tylko wtedy, gdy celowo chcesz nawiązać rzeczywiste wychodzące połączenie
powiadamiające:

```bash
openclaw voicecall smoke --to "+15555550123" --yes
```

### Połączenie Twilio rozpoczyna się, ale nigdy nie dołącza do spotkania

Upewnij się, że zdarzenie Meet udostępnia dane telefonicznego dołączania. Podaj dokładny
numer do połączenia telefonicznego i PIN albo niestandardową sekwencję DTMF:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --dtmf-sequence ww123456#
```

Użyj początkowego `w` lub przecinków w `--dtmf-sequence`, jeśli dostawca wymaga pauzy
przed wprowadzeniem PIN-u.

Jeśli połączenie telefoniczne zostało utworzone, ale lista uczestników Meet nigdy nie pokazuje
uczestnika telefonicznego:

- Uruchom `openclaw googlemeet doctor <session-id>`, aby potwierdzić delegowany identyfikator połączenia Twilio,
  czy DTMF zostało umieszczone w kolejce oraz czy zażądano powitalnej zapowiedzi.
- Uruchom `openclaw voicecall status --call-id <id>` i potwierdź, że połączenie nadal
  jest aktywne.
- Uruchom `openclaw voicecall tail` i sprawdź, czy Webhooki Twilio docierają do
  Gateway.
- Uruchom `openclaw logs --follow` i poszukaj sekwencji Twilio Meet: Google
  Meet deleguje dołączenie, Voice Call uruchamia odcinek telefoniczny, Google Meet czeka
  `voiceCall.dtmfDelayMs`, wysyła DTMF przez `voicecall.dtmf`, czeka
  `voiceCall.postDtmfSpeechDelayMs`, a następnie żąda mowy wprowadzającej przez
  `voicecall.speak`.
- Uruchom ponownie `openclaw googlemeet setup --transport twilio`; zielony wynik konfiguracji jest
  wymagany, ale nie dowodzi, że sekwencja PIN-u spotkania jest poprawna.
- Upewnij się, że numer do połączenia telefonicznego należy do tego samego zaproszenia Meet i regionu co
  PIN.
- Zwiększ `voiceCall.dtmfDelayMs`, jeśli Meet odpowiada powoli albo transkrypcja połączenia
  nadal pokazuje monit z prośbą o PIN po wysłaniu DTMF.
- Jeśli uczestnik dołącza, ale nie słyszysz powitania, sprawdź
  `openclaw logs --follow` pod kątem żądania `voicecall.speak` po DTMF oraz
  odtwarzania TTS przez strumień multimediów albo awaryjnego Twilio `<Say>`. Jeśli transkrypcja połączenia
  nadal zawiera „enter the meeting PIN”, odcinek telefoniczny nie dołączył jeszcze
  do pokoju Meet, więc uczestnicy spotkania nie usłyszą mowy.

Jeśli Webhooki nie docierają, najpierw debuguj Plugin Voice Call: dostawca musi
osiągnąć `plugins.entries.voice-call.config.publicUrl` albo skonfigurowany tunel.
Zobacz [Rozwiązywanie problemów z połączeniami głosowymi](/pl/plugins/voice-call#troubleshooting).

## Uwagi

Oficjalne API multimediów Google Meet jest zorientowane na odbiór, więc mówienie w połączeniu
Meet nadal wymaga ścieżki uczestnika. Ten Plugin zachowuje widoczność tej granicy:
Chrome obsługuje udział przez przeglądarkę i lokalne routowanie audio; Twilio obsługuje
udział przez telefoniczne dołączanie.

Tryby odpowiedzi głosowej Chrome wymagają `BlackHole 2ch` oraz jednego z poniższych:

- `chrome.audioInputCommand` plus `chrome.audioOutputCommand`: OpenClaw zarządza
  mostkiem i przesyła audio w `chrome.audioFormat` między tymi poleceniami a
  wybranym dostawcą. Tryb agenta używa transkrypcji w czasie rzeczywistym oraz zwykłego TTS;
  tryb bidi używa dostawcy głosu w czasie rzeczywistym. Domyślna ścieżka Chrome to 24 kHz
  PCM16 z `chrome.audioBufferBytes: 4096`; 8 kHz G.711 mu-law pozostaje
  dostępne dla starszych par poleceń.
- `chrome.audioBridgeCommand`: zewnętrzne polecenie mostka zarządza całą lokalną
  ścieżką audio i musi zakończyć działanie po uruchomieniu albo zweryfikowaniu swojego demona. Jest to
  poprawne tylko dla `bidi`, ponieważ tryb `agent` wymaga bezpośredniego dostępu do pary poleceń dla TTS.

Gdy agent wywołuje narzędzie `google_meet` w trybie agenta, sesja konsultanta spotkania
rozwidla bieżącą transkrypcję wywołującego przed odpowiedzią na mowę uczestnika.
Sesja Meet nadal pozostaje osobna (`agent:<agentId>:subagent:google-meet:<sessionId>`),
więc dalsze działania spotkania nie modyfikują bezpośrednio transkrypcji wywołującego.

Aby uzyskać czysty dźwięk dwukierunkowy, kieruj wyjście Meet i mikrofon Meet przez osobne
urządzenia wirtualne albo graf urządzeń wirtualnych w stylu Loopback. Pojedyncze współdzielone
urządzenie BlackHole może odbijać innych uczestników z powrotem do połączenia.

W przypadku mostka Chrome opartego na parze poleceń `chrome.bargeInInputCommand` może nasłuchiwać
osobnego lokalnego mikrofonu i czyścić odtwarzanie asystenta, gdy człowiek zaczyna
mówić. Dzięki temu mowa człowieka ma pierwszeństwo przed wyjściem asystenta nawet wtedy, gdy współdzielone
wejście local loopback BlackHole jest tymczasowo wyciszone podczas odtwarzania asystenta.
Podobnie jak `chrome.audioInputCommand` i `chrome.audioOutputCommand`, jest to
lokalne polecenie konfigurowane przez operatora. Użyj jawnej, zaufanej ścieżki polecenia albo
listy argumentów i nie wskazuj skryptów z niezaufanych lokalizacji.

`googlemeet speak` uruchamia aktywny mostek audio odpowiedzi głosowej dla sesji Chrome.
`googlemeet leave` zatrzymuje ten mostek. W przypadku sesji Twilio delegowanych
przez Plugin Voice Call `leave` także rozłącza bazowe połączenie głosowe.
Użyj `googlemeet end-active-conference`, gdy chcesz również zamknąć aktywną
konferencję Google Meet dla przestrzeni zarządzanej przez API.

## Powiązane

- [Plugin połączeń głosowych](/pl/plugins/voice-call)
- [Tryb rozmowy](/pl/nodes/talk)
- [Tworzenie Pluginów](/pl/plugins/building-plugins)
