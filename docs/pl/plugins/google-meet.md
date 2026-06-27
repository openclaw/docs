---
read_when:
    - Chcesz, aby agent OpenClaw dołączył do rozmowy Google Meet
    - Chcesz, aby agent OpenClaw utworzył nowe połączenie Google Meet
    - Konfigurujesz Chrome, węzeł Chrome lub Twilio jako transport Google Meet
summary: 'Plugin Google Meet: dołączanie do jawnych adresów URL Meet przez Chrome lub Twilio z domyślnymi ustawieniami odpowiedzi agenta'
title: Plugin Google Meet
x-i18n:
    generated_at: "2026-06-27T17:53:22Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e85d531897e3aeadf0ac718f82a7aac5ce73715e182e96ceba77cb76eff094c4
    source_path: plugins/google-meet.md
    workflow: 16
---

Google Meet: obsługa uczestników w OpenClaw — plugin jest celowo jawny z założenia:

- Dołącza tylko do jawnego adresu URL `https://meet.google.com/...`.
- Może utworzyć nową przestrzeń Meet przez Google Meet API, a następnie dołączyć do
  zwróconego adresu URL.
- `agent` to domyślny tryb odpowiedzi głosowej: transkrypcja w czasie rzeczywistym nasłuchuje,
  skonfigurowany agent OpenClaw odpowiada, a zwykłe TTS OpenClaw mówi w Meet.
- `bidi` pozostaje dostępny jako zapasowy tryb bezpośredniego modelu głosowego w czasie rzeczywistym.
- Agenci wybierają sposób dołączenia za pomocą `mode`: użyj `agent` do nasłuchiwania
  i odpowiedzi głosowej na żywo, `bidi` jako bezpośredniego zapasowego trybu głosu w czasie rzeczywistym albo `transcribe`
  do dołączenia/sterowania przeglądarką bez mostka odpowiedzi głosowej.
- Uwierzytelnianie zaczyna się jako osobisty Google OAuth albo już zalogowany profil Chrome.
- Nie ma automatycznego komunikatu o zgodzie.
- Domyślny backend audio Chrome to `BlackHole 2ch`.
- Chrome może działać lokalnie albo na sparowanym hoście węzła.
- Twilio przyjmuje numer do wdzwaniania oraz opcjonalny PIN lub sekwencję DTMF; nie
  może bezpośrednio wybierać adresu URL Meet.
- Polecenie CLI to `googlemeet`; `meet` jest zarezerwowane dla szerszych przepływów pracy telekonferencji agenta.

## Szybki start

Zainstaluj lokalne zależności audio i skonfiguruj dostawcę transkrypcji w czasie rzeczywistym
oraz zwykłe TTS OpenClaw. OpenAI jest domyślnym dostawcą transkrypcji;
Google Gemini Live działa również jako oddzielny zapasowy tryb głosowy `bidi` z
`realtime.voiceProvider: "google"`:

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
# wymagane tylko wtedy, gdy realtime.voiceProvider ma wartość "google" dla trybu bidi
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

Dane wyjściowe konfiguracji są przeznaczone do odczytu przez agenta i uwzględniają tryb. Raportują profil Chrome,
przypięcie węzła oraz, dla dołączeń przez Chrome w czasie rzeczywistym, mostek audio
BlackHole/SoX i opóźnione kontrole wprowadzenia w czasie rzeczywistym. Dla dołączeń tylko do obserwacji sprawdź ten sam
transport za pomocą `--mode transcribe`; ten tryb pomija wymagania wstępne audio w czasie rzeczywistym,
ponieważ nie nasłuchuje przez mostek ani przez niego nie mówi:

```bash
openclaw googlemeet setup --transport chrome-node --mode transcribe
```

Gdy delegowanie Twilio jest skonfigurowane, konfiguracja raportuje również, czy
plugin `voice-call`, poświadczenia Twilio i publiczna ekspozycja Webhook są gotowe.
Traktuj każdą kontrolę `ok: false` jako blokującą dla sprawdzanego transportu i trybu,
zanim poprosisz agenta o dołączenie. Użyj `openclaw googlemeet setup --json` dla
skryptów lub danych wyjściowych czytelnych maszynowo. Użyj `--transport chrome`,
`--transport chrome-node` albo `--transport twilio`, aby wstępnie sprawdzić konkretny
transport, zanim agent go wypróbuje.

W przypadku Twilio zawsze wstępnie sprawdzaj transport jawnie, gdy domyślnym transportem
jest Chrome:

```bash
openclaw googlemeet setup --transport twilio
```

Wykrywa to brakujące okablowanie `voice-call`, poświadczenia Twilio lub nieosiągalną
ekspozycję Webhook, zanim agent spróbuje wdzwaniać się na spotkanie.

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

Narzędzie `google_meet` dla agentów pozostaje dostępne na hostach innych niż macOS dla
przepływów artefaktów, kalendarza, konfiguracji, transkrypcji, Twilio i `chrome-node`. Lokalne
akcje odpowiedzi głosowej Chrome są tam blokowane, ponieważ dołączona ścieżka audio Chrome
obecnie zależy od macOS `BlackHole 2ch`. W Linuksie użyj `mode: "transcribe"`,
wdzwaniania Twilio albo hosta macOS `chrome-node` dla udziału w Chrome z odpowiedzią głosową.

Utwórz nowe spotkanie i dołącz do niego:

```bash
openclaw googlemeet create --transport chrome-node --mode agent
```

W przypadku pokoi utworzonych przez API użyj Google Meet `SpaceConfig.accessType`, gdy chcesz,
aby polityka pokoju dotycząca dołączania bez proszenia o wpuszczenie była jawna zamiast odziedziczona z domyślnych ustawień konta Google:

```bash
openclaw googlemeet create --access-type OPEN --transport chrome-node --mode agent
```

`OPEN` pozwala każdemu z adresem URL Meet dołączyć bez proszenia o wpuszczenie. `TRUSTED` pozwala
zaufanym użytkownikom organizacji gospodarza, zaproszonym użytkownikom zewnętrznym i użytkownikom wdzwaniającym się
dołączyć bez proszenia o wpuszczenie. `RESTRICTED` ogranicza wejście bez proszenia o wpuszczenie do zaproszonych osób. Te
ustawienia mają zastosowanie tylko do oficjalnej ścieżki tworzenia przez Google Meet API, więc poświadczenia
OAuth muszą być skonfigurowane.

Jeśli uwierzytelniłeś Google Meet, zanim ta opcja była dostępna, uruchom ponownie
`openclaw googlemeet auth login --json` po dodaniu zakresu
`meetings.space.settings` do ekranu zgody Google OAuth.

Utwórz tylko adres URL bez dołączania:

```bash
openclaw googlemeet create --no-join
```

`googlemeet create` ma dwie ścieżki:

- Tworzenie przez API: używane, gdy skonfigurowane są poświadczenia Google Meet OAuth. To
  najbardziej deterministyczna ścieżka i nie zależy od stanu interfejsu przeglądarki.
- Zapasowa ścieżka przeglądarki: używana, gdy brakuje poświadczeń OAuth. OpenClaw używa
  przypiętego węzła Chrome, otwiera `https://meet.google.com/new`, czeka, aż Google
  przekieruje do prawdziwego adresu URL z kodem spotkania, a następnie zwraca ten adres URL. Ta ścieżka wymaga,
  aby profil OpenClaw Chrome na węźle był już zalogowany do Google.
  Automatyzacja przeglądarki obsługuje własny monit Meet pierwszego uruchomienia o mikrofon; ten monit
  nie jest traktowany jako niepowodzenie logowania Google.
  Przepływy dołączania i tworzenia próbują też ponownie użyć istniejącej karty Meet przed otwarciem
  nowej. Dopasowywanie ignoruje nieszkodliwe ciągi zapytania URL, takie jak `authuser`, więc
  ponowna próba agenta powinna skupić już otwarte spotkanie zamiast tworzyć drugą
  kartę Chrome.

Dane wyjściowe polecenia/narzędzia zawierają pole `source` (`api` lub `browser`), aby agenci
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

Dla dołączenia tylko do obserwacji/sterowania przeglądarką ustaw `"mode": "transcribe"`. To
nie uruchamia dwukierunkowego mostka głosowego w czasie rzeczywistym, nie wymaga BlackHole ani SoX
i nie będzie odpowiadać głosowo na spotkaniu. Dołączenia Chrome w tym trybie unikają również
przyznania przez OpenClaw uprawnień do mikrofonu/kamery i unikają ścieżki Meet **Użyj
mikrofonu**. Jeśli Meet pokaże ekran pośredni wyboru audio, automatyzacja próbuje
ścieżki bez mikrofonu, a w przeciwnym razie zgłasza ręczną akcję zamiast otwierać
lokalny mikrofon. W trybie transkrypcji zarządzane transporty Chrome instalują również
najlepszy możliwy obserwator napisów Meet. `googlemeet status --json` i
`googlemeet doctor` ujawniają `captioning`, `captionsEnabledAttempted`,
`transcriptLines`, `lastCaptionAt`, `lastCaptionSpeaker`, `lastCaptionText`
oraz krótki ogon `recentTranscript`, aby operatorzy mogli stwierdzić, czy przeglądarka
dołączyła do rozmowy i czy napisy Meet produkują tekst.
Użyj `openclaw googlemeet test-listen <meet-url> --transport chrome-node`, gdy
potrzebujesz sondy tak/nie: dołącza w trybie transkrypcji, czeka na świeży ruch napisów lub
transkryptu i zwraca `listenVerified`, `listenTimedOut`, pola ręcznej
akcji oraz najnowszy stan napisów.

Podczas sesji w czasie rzeczywistym status `google_meet` zawiera stan przeglądarki i mostka audio,
taki jak `inCall`, `manualActionRequired`, `providerConnected`,
`realtimeReady`, `audioInputActive`, `audioOutputActive`, znaczniki czasu ostatniego wejścia/wyjścia,
liczniki bajtów oraz stan zamknięcia mostka. Jeśli pojawi się bezpieczny monit strony Meet,
automatyzacja przeglądarki obsługuje go, gdy może. Logowanie, wpuszczenie przez gospodarza oraz
monity uprawnień przeglądarki/systemu operacyjnego są zgłaszane jako ręczna akcja z powodem i
komunikatem, który agent może przekazać. Zarządzane sesje Chrome emitują wprowadzenie albo
frazę testową dopiero po tym, jak stan przeglądarki zgłosi `inCall: true`; w przeciwnym razie status zgłasza
`speechReady: false`, a próba mówienia jest blokowana zamiast udawać, że
agent przemówił na spotkaniu.

Lokalne dołączenia Chrome przechodzą przez zalogowany profil przeglądarki OpenClaw. Tryb czasu rzeczywistego
wymaga `BlackHole 2ch` dla ścieżki mikrofonu/głośnika używanej przez OpenClaw. Dla
czystego dwukierunkowego audio użyj oddzielnych urządzeń wirtualnych albo grafu w stylu Loopback; pojedyncze
urządzenie BlackHole wystarczy do pierwszego testu dymnego, ale może powodować echo.

### Lokalny Gateway + Chrome w Parallels

**Nie** potrzebujesz pełnego OpenClaw Gateway ani klucza API modelu w maszynie wirtualnej macOS
tylko po to, aby VM była właścicielem Chrome. Uruchom Gateway i agenta lokalnie, a następnie uruchom
hosta węzła w VM. Włącz dołączony plugin w VM jeden raz, aby węzeł
reklamował polecenie Chrome:

Co działa gdzie:

- Host Gateway: OpenClaw Gateway, przestrzeń robocza agenta, klucze modelu/API, dostawca czasu rzeczywistego
  i konfiguracja pluginu Google Meet.
- Maszyna wirtualna Parallels macOS: OpenClaw CLI/host węzła, Google Chrome, SoX, BlackHole 2ch
  i profil Chrome zalogowany do Google.
- Niewymagane w VM: usługa Gateway, konfiguracja agenta, klucz OpenAI/GPT ani konfiguracja
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

Zainstaluj lub zaktualizuj OpenClaw w VM, a następnie włącz tam dołączony plugin:

```bash
openclaw plugins enable google-meet
```

Uruchom hosta węzła w VM:

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name parallels-macos
```

Jeśli `<gateway-host>` to adres IP LAN i nie używasz TLS, węzeł odrzuca
nieszyfrowany WebSocket, chyba że jawnie zgodzisz się na tę zaufaną sieć prywatną:

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
jak i funkcję przeglądarki/`browser.proxy`:

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

albo poproś agenta o użycie narzędzia `google_meet` z `transport: "chrome-node"`.

Dla jedno-poleceniowego testu dymnego, który tworzy lub ponownie używa sesji, wypowiada znaną
frazę i wypisuje stan sesji:

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij
```

Podczas dołączania w trybie realtime automatyzacja przeglądarki OpenClaw wpisuje nazwę gościa, klika
Dołącz/Poproś o dołączenie i akceptuje pierwszy wybór Meet „Użyj mikrofonu”, gdy ten
monit się pojawi. Podczas dołączania tylko do obserwacji albo tworzenia spotkania wyłącznie przez przeglądarkę
przechodzi dalej przez ten sam monit bez mikrofonu, gdy taki wybór jest dostępny.
Jeśli profil przeglądarki nie jest zalogowany, Meet czeka na dopuszczenie przez gospodarza,
Chrome potrzebuje uprawnienia do mikrofonu/kamery dla dołączania w trybie realtime albo Meet utknął
na monicie, którego automatyzacja nie mogła obsłużyć, wynik dołączenia/test-speech zgłasza
`manualActionRequired: true` z `manualActionReason` i
`manualActionMessage`. Agenci powinni przerwać ponawianie dołączania, zgłosić dokładnie ten
komunikat razem z bieżącymi `browserUrl`/`browserTitle` i ponowić próbę dopiero po
ukończeniu ręcznej czynności w przeglądarce.

Jeśli `chromeNode.node` zostanie pominięte, OpenClaw wybiera automatycznie tylko wtedy, gdy dokładnie jeden
połączony węzeł ogłasza zarówno `googlemeet.chrome`, jak i sterowanie przeglądarką. Jeśli
połączonych jest kilka zgodnych węzłów, ustaw `chromeNode.node` na identyfikator węzła,
nazwę wyświetlaną albo zdalny adres IP.

Typowe kontrole awarii:

- `Configured Google Meet node ... is not usable: offline`: przypięty węzeł jest
  znany Gateway, ale niedostępny. Agenci powinni traktować ten węzeł jako
  stan diagnostyczny, a nie używalny host Chrome, i zgłosić blokadę konfiguracji
  zamiast przełączać się na inny transport, chyba że użytkownik o to poprosił.
- `No connected Google Meet-capable node`: uruchom `openclaw node run` w VM,
  zatwierdź parowanie i upewnij się, że w VM uruchomiono
  `openclaw plugins enable google-meet` oraz
  `openclaw plugins enable browser`. Potwierdź też, że host
  Gateway pozwala na oba polecenia węzła za pomocą
  `gateway.nodes.allowCommands: ["googlemeet.chrome", "browser.proxy"]`.
- `BlackHole 2ch audio device not found`: zainstaluj `blackhole-2ch` na sprawdzanym hoście
  i uruchom go ponownie przed użyciem lokalnego audio Chrome.
- `BlackHole 2ch audio device not found on the node`: zainstaluj `blackhole-2ch`
  w VM i uruchom VM ponownie.
- Chrome otwiera się, ale nie może dołączyć: zaloguj się do profilu przeglądarki wewnątrz VM albo
  pozostaw ustawione `chrome.guestName` dla dołączania jako gość. Automatyczne dołączanie gościa używa
  automatyzacji przeglądarki OpenClaw przez proxy przeglądarki węzła; upewnij się, że konfiguracja przeglądarki węzła
  wskazuje profil, którego chcesz użyć, na przykład
  `browser.defaultProfile: "user"` albo nazwany profil istniejącej sesji.
- Zduplikowane karty Meet: pozostaw włączone `chrome.reuseExistingTab: true`. OpenClaw
  aktywuje istniejącą kartę dla tego samego URL Meet przed otwarciem nowej, a
  tworzenie spotkania w przeglądarce ponownie używa trwającej karty `https://meet.google.com/new`
  albo karty monitu konta Google przed otwarciem kolejnej.
- Brak audio: w Meet skieruj mikrofon/głośnik przez ścieżkę wirtualnego urządzenia audio
  używaną przez OpenClaw; użyj osobnych urządzeń wirtualnych albo routingu w stylu Loopback
  dla czystego dwukierunkowego audio.

## Uwagi dotyczące instalacji

Domyślny tryb talk-back Chrome używa dwóch zewnętrznych narzędzi:

- `sox`: narzędzie audio wiersza poleceń. Plugin używa jawnych poleceń urządzeń CoreAudio
  dla domyślnego mostka audio 24 kHz PCM16.
- `blackhole-2ch`: wirtualny sterownik audio macOS. Tworzy urządzenie audio `BlackHole 2ch`,
  przez które Chrome/Meet może kierować audio.

OpenClaw nie dołącza ani nie redystrybuuje żadnego z tych pakietów. Dokumentacja prosi użytkowników o
zainstalowanie ich jako zależności hosta przez Homebrew. SoX jest licencjonowany jako
`LGPL-2.0-only AND GPL-2.0-only`; BlackHole ma licencję GPL-3.0. Jeśli budujesz
instalator albo appliance, który dołącza BlackHole z OpenClaw, przejrzyj warunki licencji
upstream BlackHole albo uzyskaj osobną licencję od Existential Audio.

## Transporty

### Chrome

Transport Chrome otwiera URL Meet przez sterowanie przeglądarką OpenClaw i dołącza
jako zalogowany profil przeglądarki OpenClaw. Na macOS plugin sprawdza obecność
`BlackHole 2ch` przed uruchomieniem. Jeśli skonfigurowano, uruchamia też polecenie
sprawdzenia kondycji mostka audio oraz polecenie startowe przed otwarciem Chrome. Użyj `chrome`, gdy
Chrome/audio działają na hoście Gateway; użyj `chrome-node`, gdy Chrome/audio działają
na sparowanym węźle, takim jak VM macOS Parallels. Dla lokalnego Chrome wybierz
profil za pomocą `browser.defaultProfile`; `chrome.browserProfile` jest przekazywane do
hostów `chrome-node`.

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome-node
```

Skieruj audio mikrofonu i głośnika Chrome przez lokalny mostek audio OpenClaw.
Jeśli `BlackHole 2ch` nie jest zainstalowany, dołączenie kończy się błędem konfiguracji
zamiast cicho dołączać bez ścieżki audio.

### Twilio

Transport Twilio jest ścisłym planem wybierania delegowanym do pluginu Voice Call. Nie
parsuje stron Meet w poszukiwaniu numerów telefonów.

Użyj tego, gdy udział przez Chrome jest niedostępny albo chcesz awaryjne dołączanie
telefoniczne. Google Meet musi udostępniać numer telefoniczny do dołączenia i PIN dla
spotkania; OpenClaw nie wykrywa ich ze strony Meet.

Włącz plugin Voice Call na hoście Gateway, nie na węźle Chrome:

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

Przekaż poświadczenia Twilio przez środowisko albo konfigurację. Środowisko trzyma
sekrety poza `openclaw.json`:

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
export GEMINI_API_KEY=...
```

Zamiast tego użyj `realtime.provider: "openai"` z pluginem dostawcy OpenAI oraz
`OPENAI_API_KEY`, jeśli to jest twój dostawca głosu realtime.

Uruchom ponownie albo przeładuj Gateway po włączeniu `voice-call`; zmiany konfiguracji pluginu
nie pojawią się w już działającym procesie Gateway, dopóki nie zostanie przeładowany.

Następnie zweryfikuj:

```bash
openclaw config validate
openclaw plugins list | grep -E 'google-meet|voice-call'
openclaw googlemeet setup
```

Gdy delegacja Twilio jest podłączona, `googlemeet setup` zawiera pomyślne kontrole
`twilio-voice-call-plugin`, `twilio-voice-call-credentials` oraz
`twilio-voice-call-webhook`.

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --pin 123456
```

Użyj `--dtmf-sequence`, gdy spotkanie wymaga własnej sekwencji:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --dtmf-sequence ww123456#
```

## OAuth i preflight

OAuth jest opcjonalny przy tworzeniu linku Meet, ponieważ `googlemeet create` może przejść
na automatyzację przeglądarki. Skonfiguruj OAuth, gdy chcesz oficjalnego tworzenia przez API,
rozwiązywania przestrzeni albo kontroli preflight Meet Media API.

Dostęp do Google Meet API używa OAuth użytkownika: utwórz klienta OAuth Google Cloud,
zażądaj wymaganych zakresów, autoryzuj konto Google, a następnie zapisz
otrzymany token odświeżania w konfiguracji pluginu Google Meet albo podaj
zmienne środowiskowe `OPENCLAW_GOOGLE_MEET_*`.

OAuth nie zastępuje ścieżki dołączania przez Chrome. Transporty Chrome i Chrome-node
nadal dołączają przez zalogowany profil Chrome, BlackHole/SoX i połączony
węzeł, gdy używasz udziału przez przeglądarkę. OAuth służy tylko do oficjalnej ścieżki
Google Meet API: tworzenia przestrzeni spotkań, rozwiązywania przestrzeni i uruchamiania kontroli
preflight Meet Media API.

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
`meetings.space.readonly` pozwala OpenClaw rozwiązywać URL-e/kody Meet na przestrzenie.
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

Polecenie wypisuje blok konfiguracji `oauth` z tokenem odświeżania. Używa PKCE,
callbacku localhost pod `http://localhost:8085/oauth2callback` oraz ręcznego
przepływu kopiuj/wklej z `--manual`.

Przykłady:

```bash
OPENCLAW_GOOGLE_MEET_CLIENT_ID="your-client-id" \
OPENCLAW_GOOGLE_MEET_CLIENT_SECRET="your-client-secret" \
openclaw googlemeet auth login --json
```

Użyj trybu ręcznego, gdy przeglądarka nie może połączyć się z lokalnym callbackiem:

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

Zapisz obiekt `oauth` pod konfiguracją pluginu Google Meet:

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
Jeśli obecne są zarówno wartości konfiguracji, jak i środowiska, plugin rozwiązuje najpierw konfigurację,
a potem używa środowiska jako fallbacku.

Zgoda OAuth obejmuje tworzenie przestrzeni Meet, dostęp do odczytu przestrzeni Meet oraz dostęp
do odczytu mediów konferencji Meet. Jeśli uwierzytelniłeś się, zanim istniała obsługa
tworzenia spotkań, uruchom ponownie `openclaw googlemeet auth login --json`, aby token odświeżania
miał zakres `meetings.space.created`.

### Zweryfikuj OAuth za pomocą doctor

Uruchom doctor OAuth, gdy chcesz szybką kontrolę kondycji bez sekretów:

```bash
openclaw googlemeet doctor --oauth --json
```

To nie ładuje runtime Chrome ani nie wymaga połączonego węzła Chrome. Sprawdza,
czy istnieje konfiguracja OAuth i czy token odświeżania może wygenerować token dostępu.
Raport JSON zawiera tylko pola statusu, takie jak `ok`, `configured`,
`tokenSource`, `expiresAt` i komunikaty kontroli; nie wypisuje tokenu dostępu,
tokenu odświeżania ani sekretu klienta.

Typowe wyniki:

| Sprawdzenie          | Znaczenie                                                                                |
| -------------------- | ---------------------------------------------------------------------------------------- |
| `oauth-config`       | Obecne jest `oauth.clientId` oraz `oauth.refreshToken` albo buforowany token dostępu.    |
| `oauth-token`        | Buforowany token dostępu jest nadal ważny albo token odświeżania wydał nowy token dostępu. |
| `meet-spaces-get`    | Opcjonalne sprawdzenie `--meeting` rozwiązało istniejącą przestrzeń Meet.                |
| `meet-spaces-create` | Opcjonalne sprawdzenie `--create-space` utworzyło nową przestrzeń Meet.                  |

Aby potwierdzić także włączenie Google Meet API i zakres `spaces.create`, uruchom
sprawdzenie tworzenia z efektem ubocznym:

```bash
openclaw googlemeet doctor --oauth --create-space --json
openclaw googlemeet create --no-join --json
```

`--create-space` tworzy jednorazowy adres URL Meet. Użyj go, gdy musisz
potwierdzić, że projekt Google Cloud ma włączone Meet API i że autoryzowane
konto ma zakres `meetings.space.created`.

Aby potwierdzić dostęp do odczytu istniejącej przestrzeni spotkania:

```bash
openclaw googlemeet doctor --oauth --meeting https://meet.google.com/abc-defg-hij --json
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
```

`doctor --oauth --meeting` i `resolve-space` potwierdzają dostęp do odczytu
istniejącej przestrzeni, do której autoryzowane konto Google ma dostęp. `403` z
tych sprawdzeń zwykle oznacza, że Google Meet REST API jest wyłączone, zaakceptowany
token odświeżania nie ma wymaganego zakresu albo konto Google nie może uzyskać
dostępu do tej przestrzeni Meet. Błąd tokenu odświeżania oznacza, że trzeba ponownie
uruchomić `openclaw googlemeet auth login --json` i zapisać nowy blok `oauth`.

Dane logowania OAuth nie są potrzebne dla awaryjnej ścieżki przeglądarkowej. W
tym trybie uwierzytelnianie Google pochodzi z zalogowanego profilu Chrome na
wybranym węźle, a nie z konfiguracji OpenClaw.

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

Wyświetl artefakty spotkania i obecność po tym, jak Meet utworzy rekordy konferencji:

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
tekst wydarzenia, oraz `--calendar <id>` dla kalendarza innego niż podstawowy.
Wyszukiwanie w kalendarzu wymaga świeżego logowania OAuth obejmującego zakres
tylko do odczytu wydarzeń Calendar. `calendar-events` pokazuje podgląd
pasujących wydarzeń Meet i oznacza wydarzenie, które wybiorą `latest`,
`artifacts`, `attendance` albo `export`.

Jeśli znasz już identyfikator rekordu konferencji, odwołaj się do niego bezpośrednio:

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
`meetings.space.created` dla przestrzeni, którą autoryzowane konto może
zarządzać. OpenClaw akceptuje adres URL Meet, kod spotkania albo wejście
`spaces/{id}` i rozwiązuje je do zasobu przestrzeni API przed zakończeniem
aktywnej konferencji. Jest to oddzielne od `googlemeet leave`: `leave` zatrzymuje
lokalny/sesyjny udział OpenClaw, a `end-active-conference` prosi Google Meet o
zakończenie aktywnej konferencji dla przestrzeni.

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
uczestników, nagrań, transkrypcji, strukturalnych wpisów transkrypcji i
inteligentnych notatek, gdy Google udostępnia je dla spotkania. Użyj
`--no-transcript-entries`, aby pominąć wyszukiwanie wpisów dla dużych spotkań.
`attendance` rozwija uczestników do wierszy sesji uczestników z czasami
pierwszego/ostatniego wykrycia, łącznym czasem trwania sesji, flagami spóźnienia
i wcześniejszego opuszczenia oraz zduplikowanymi zasobami uczestników scalonymi
według zalogowanego użytkownika albo nazwy wyświetlanej. Przekaż
`--no-merge-duplicates`, aby zachować surowe zasoby uczestników oddzielnie,
`--late-after-minutes`, aby dostroić wykrywanie spóźnień, oraz
`--early-before-minutes`, aby dostroić wykrywanie wcześniejszego opuszczenia.

`export` zapisuje folder zawierający `summary.md`, `attendance.csv`,
`transcript.md`, `artifacts.json`, `attendance.json` i `manifest.json`.
`manifest.json` rejestruje wybrane wejście, opcje eksportu, rekordy konferencji,
pliki wyjściowe, liczby, źródło tokenu, wydarzenie Calendar, jeśli go użyto, oraz
wszelkie ostrzeżenia o częściowym pobraniu. Przekaż `--zip`, aby zapisać także
przenośne archiwum obok folderu. Przekaż `--include-doc-bodies`, aby wyeksportować
tekst powiązanych dokumentów Google Docs z transkrypcją i inteligentnymi notatkami
przez Google Drive `files.export`; wymaga to świeżego logowania OAuth obejmującego
zakres tylko do odczytu Drive Meet. Bez `--include-doc-bodies` eksporty obejmują
tylko metadane Meet i strukturalne wpisy transkrypcji. Jeśli Google zwróci błąd
częściowego artefaktu, taki jak błąd listowania inteligentnych notatek, wpisu
transkrypcji albo treści dokumentu Drive, podsumowanie i manifest zachowają
ostrzeżenie zamiast przerywać cały eksport. Użyj `--dry-run`, aby pobrać te same
dane artefaktów/obecności i wypisać JSON manifestu bez tworzenia folderu ani
pliku ZIP. Jest to przydatne przed zapisaniem dużego eksportu albo gdy agent
potrzebuje tylko liczników, wybranych rekordów i ostrzeżeń.

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

Agenci mogą też utworzyć pokój oparty na API z jawną polityką dostępu:

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

Do walidacji najpierw przez nasłuch agenci powinni użyć `test_listen`, zanim
stwierdzą, że spotkanie jest użyteczne:

```json
{
  "action": "test_listen",
  "url": "https://meet.google.com/abc-defg-hij",
  "transport": "chrome-node",
  "timeoutMs": 30000
}
```

Uruchom chroniony live smoke względem rzeczywistego zachowanego spotkania:

```bash
OPENCLAW_LIVE_TEST=1 \
OPENCLAW_GOOGLE_MEET_LIVE_MEETING=https://meet.google.com/abc-defg-hij \
pnpm test:live -- extensions/google-meet/google-meet.live.test.ts
```

Uruchom przeglądarkową próbę live „najpierw nasłuch” względem spotkania, na
którym ktoś będzie mówił i dostępne będą napisy Meet:

```bash
openclaw googlemeet setup --transport chrome-node --mode transcribe
openclaw googlemeet test-listen https://meet.google.com/abc-defg-hij --transport chrome-node --timeout-ms 30000
```

Środowisko live smoke:

- `OPENCLAW_LIVE_TEST=1` włącza chronione testy live.
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
dokumentów Drive wymaga `https://www.googleapis.com/auth/drive.meet.readonly`.

Utwórz świeżą przestrzeń Meet:

```bash
openclaw googlemeet create
```

Polecenie wypisuje nowy `meeting uri`, źródło i sesję dołączenia. Z danymi
logowania OAuth używa oficjalnego Google Meet API. Bez danych logowania OAuth
używa jako awaryjnej ścieżki zalogowanego profilu przeglądarki przypiętego węzła
Chrome. Agenci mogą użyć narzędzia `google_meet` z `action: "create"`, aby
utworzyć i dołączyć w jednym kroku. Aby utworzyć tylko adres URL, przekaż
`"join": false`.

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

Jeśli awaryjna ścieżka przeglądarkowa natrafi na logowanie Google albo blokadę
uprawnień Meet, zanim będzie mogła utworzyć adres URL, metoda Gateway zwróci
nieudaną odpowiedź, a narzędzie `google_meet` zwróci strukturalne szczegóły
zamiast zwykłego ciągu znaków:

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
`manualActionMessage` wraz z kontekstem węzła/karty przeglądarki i przestać
otwierać nowe karty Meet, dopóki operator nie ukończy kroku w przeglądarce.

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

Utworzenie Meet domyślnie dołącza do spotkania. Transport Chrome lub Chrome-node nadal
wymaga zalogowanego profilu Google Chrome, aby dołączyć przez przeglądarkę. Jeśli
profil jest wylogowany, OpenClaw zgłasza `manualActionRequired: true` albo błąd
awaryjnego użycia przeglądarki i prosi operatora o dokończenie logowania do Google przed
ponowną próbą.

Ustaw `preview.enrollmentAcknowledged: true` dopiero po potwierdzeniu, że Twój projekt Cloud,
principal OAuth oraz uczestnicy spotkania są zarejestrowani w Google
Workspace Developer Preview Program dla interfejsów Meet media API.

## Konfiguracja

Wspólna ścieżka agenta Chrome wymaga tylko włączonego Plugin, BlackHole, SoX, klucza
dostawcy transkrypcji w czasie rzeczywistym oraz skonfigurowanego dostawcy OpenClaw TTS.
OpenAI jest domyślnym dostawcą transkrypcji; ustaw `realtime.voiceProvider` na
`"google"` i `realtime.model`, aby używać Google Gemini Live w trybie `bidi`
bez zmieniania domyślnego dostawcy transkrypcji dla trybu agenta:

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
- `defaultMode: "agent"` (`"realtime"` jest akceptowane wyłącznie jako starszy
  alias zgodności dla `"agent"`; nowe wywołania narzędzi powinny podawać `"agent"`)
- `chromeNode.node`: opcjonalny identyfikator/nazwa/IP węzła dla `chrome-node`
- `chrome.audioBackend: "blackhole-2ch"`
- `chrome.guestName: "OpenClaw Agent"`: nazwa używana na ekranie gościa Meet
  bez zalogowania
- `chrome.autoJoin: true`: podejmowana w miarę możliwości próba wypełnienia nazwy gościa i kliknięcia Dołącz teraz
  przez automatyzację przeglądarki OpenClaw w `chrome-node`
- `chrome.reuseExistingTab: true`: aktywuj istniejącą kartę Meet zamiast
  otwierać duplikaty
- `chrome.waitForInCallMs: 20000`: czekaj, aż karta Meet zgłosi stan połączenia,
  zanim zostanie uruchomione wprowadzenie mówione
- `chrome.audioFormat: "pcm16-24khz"`: format audio pary poleceń. Używaj
  `"g711-ulaw-8khz"` tylko dla starszych/niestandardowych par poleceń, które nadal emitują
  audio telefoniczne.
- `chrome.audioBufferBytes: 4096`: bufor przetwarzania SoX dla generowanych poleceń
  audio pary poleceń Chrome. To połowa domyślnego bufora SoX o rozmiarze 8192 bajtów,
  co zmniejsza domyślne opóźnienie potoku, pozostawiając możliwość zwiększenia go na obciążonych hostach.
  Wartości poniżej minimum SoX są ograniczane do 17 bajtów.
- `chrome.audioInputCommand`: polecenie SoX czytające z CoreAudio `BlackHole 2ch`
  i zapisujące audio w `chrome.audioFormat`
- `chrome.audioOutputCommand`: polecenie SoX czytające audio w `chrome.audioFormat`
  i zapisujące do CoreAudio `BlackHole 2ch`
- `chrome.bargeInInputCommand`: opcjonalne polecenie lokalnego mikrofonu, które zapisuje
  podpisany 16-bitowy, little-endian, jednokanałowy PCM do wykrywania przerwania przez człowieka, gdy
  odtwarzanie asystenta jest aktywne. Obecnie dotyczy to hostowanego przez Gateway
  mostu pary poleceń `chrome`.
- `chrome.bargeInRmsThreshold: 650`: poziom RMS liczony jako przerwanie przez człowieka
  w `chrome.bargeInInputCommand`
- `chrome.bargeInPeakThreshold: 2500`: poziom szczytowy liczony jako przerwanie przez człowieka
  w `chrome.bargeInInputCommand`
- `chrome.bargeInCooldownMs: 900`: minimalne opóźnienie między kolejnymi wyczyszczeniami
  przerwań przez człowieka
- `mode: "agent"`: domyślny tryb odpowiedzi mówionej. Mowa uczestnika jest transkrybowana przez
  skonfigurowanego dostawcę transkrypcji w czasie rzeczywistym, wysyłana do skonfigurowanego
  agenta OpenClaw w sesji podagenta dla danego spotkania i odtwarzana przez
  standardowe środowisko wykonawcze OpenClaw TTS.
- `mode: "bidi"`: awaryjny bezpośredni, dwukierunkowy tryb modelu czasu rzeczywistego. Dostawca głosu
  czasu rzeczywistego odpowiada bezpośrednio na mowę uczestnika i może wywołać
  `openclaw_agent_consult`, aby uzyskać głębsze odpowiedzi lub odpowiedzi oparte na narzędziach.
- `mode: "transcribe"`: tryb wyłącznie obserwacyjny bez mostu odpowiedzi mówionej.
- `realtime.provider: "openai"`: awaryjna zgodność używana, gdy poniższe pola
  dostawcy o ograniczonym zakresie nie są ustawione.
- `realtime.transcriptionProvider: "openai"`: identyfikator dostawcy używany przez tryb `agent`
  do transkrypcji w czasie rzeczywistym.
- `realtime.voiceProvider`: identyfikator dostawcy używany przez tryb `bidi` do bezpośredniego głosu
  w czasie rzeczywistym. Ustaw go na `"google"`, aby używać Gemini Live przy zachowaniu transkrypcji
  trybu agenta w OpenAI.
- `realtime.toolPolicy: "safe-read-only"`
- `realtime.instructions`: krótkie odpowiedzi mówione, z
  `openclaw_agent_consult` dla głębszych odpowiedzi
- `realtime.introMessage`: krótki mówiony test gotowości po połączeniu mostu czasu rzeczywistego;
  ustaw na `""`, aby dołączyć po cichu
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

Trwały głos Meet pochodzi z
`messages.tts.providers.elevenlabs.speakerVoiceId`. Odpowiedzi agenta mogą również używać
dyrektyw dla odpowiedzi `[[tts:speakerVoiceId=... model=eleven_v3]]`, gdy nadpisania modelu TTS
są włączone, ale konfiguracja jest deterministyczną wartością domyślną dla spotkań.
Po dołączeniu logi powinny pokazywać `transcriptionProvider=elevenlabs`, a każda
wypowiedziana odpowiedź powinna logować `provider=elevenlabs model=eleven_v3 speakerVoiceId=<voiceId>`.

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

`voiceCall.enabled` ma domyślnie wartość `true`; z transportem Twilio deleguje
właściwe połączenie PSTN, DTMF i powitanie wprowadzające do Plugin Voice Call. Voice Call
odtwarza sekwencję DTMF przed otwarciem strumienia multimediów czasu rzeczywistego, a następnie używa
zapisanego tekstu wprowadzenia jako początkowego powitania w czasie rzeczywistym. Jeśli `voice-call` nie jest
włączony, Google Meet nadal może zweryfikować i zarejestrować plan wybierania, ale nie może
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
generuje odpowiedź, a zwykły OpenClaw TTS wypowiada ją w Meet. Użyj
`mode: "bidi"`, gdy chcesz, aby model głosu w czasie rzeczywistym odpowiadał bezpośrednio.
Surowe `mode: "realtime"` pozostaje akceptowane jako starszy alias zgodności dla
`mode: "agent"`, ale nie jest już reklamowane w schemacie narzędzia agenta.
Logi trybu agenta zawierają rozwiązanego dostawcę/model transkrypcji podczas uruchamiania mostu
oraz dostawcę TTS, model, głos, format wyjściowy i częstotliwość próbkowania po
każdej zsyntetyzowanej odpowiedzi.

Użyj `action: "status"`, aby wyświetlić aktywne sesje lub sprawdzić identyfikator sesji. Użyj
`action: "speak"` z `sessionId` i `message`, aby agent czasu rzeczywistego
natychmiast przemówił. Użyj `action: "test_speech"`, aby utworzyć lub ponownie użyć sesji,
uruchomić znaną frazę i zwrócić stan `inCall`, gdy host Chrome może
go zgłosić. `test_speech` zawsze wymusza `mode: "agent"` i kończy się niepowodzeniem, jeśli poproszono o
uruchomienie w `mode: "transcribe"`, ponieważ sesje wyłącznie obserwacyjne celowo nie mogą
emitować mowy. Wynik `speechOutputVerified` opiera się na wzroście liczby bajtów wyjścia audio
w czasie rzeczywistym podczas tego wywołania testowego, więc ponownie użyta sesja ze starszym audio
nie liczy się jako świeży, pomyślny test mowy. Użyj `action: "leave"`, aby oznaczyć
sesję jako zakończoną.

`status` zawiera stan Chrome, gdy jest dostępny:

- `inCall`: wygląda na to, że Chrome jest wewnątrz połączenia Meet
- `micMuted`: stan mikrofonu Meet ustalany w miarę możliwości
- `manualActionRequired` / `manualActionReason` / `manualActionMessage`: profil
  przeglądarki wymaga ręcznego logowania, wpuszczenia przez gospodarza Meet, uprawnień albo
  naprawy sterowania przeglądarką, zanim mowa będzie działać
- `speechReady` / `speechBlockedReason` / `speechBlockedMessage`: czy
  zarządzana mowa Chrome jest teraz dozwolona. `speechReady: false` oznacza, że OpenClaw
  nie wysłał frazy wprowadzającej/testowej do mostu audio.
- `providerConnected` / `realtimeReady`: stan mostu głosu w czasie rzeczywistym
- `lastInputAt` / `lastOutputAt`: ostatnie audio odebrane z mostu lub wysłane do niego
- `audioOutputRouted` / `audioOutputDeviceLabel`: czy wyjście multimediów karty Meet
  zostało aktywnie skierowane do urządzenia BlackHole używanego przez most
- `lastSuppressedInputAt` / `suppressedInputBytes`: dane wejściowe local loopback ignorowane, gdy
  odtwarzanie asystenta jest aktywne

```json
{
  "action": "speak",
  "sessionId": "meet_...",
  "message": "Say exactly: I'm here and listening."
}
```

## Tryby agent i bidi

Tryb Chrome `agent` jest zoptymalizowany pod zachowanie „mój agent jest na spotkaniu”. Dostawca
transkrypcji w czasie rzeczywistym słyszy audio spotkania, finalne transkrypcje uczestników
są kierowane przez skonfigurowanego agenta OpenClaw, a odpowiedź jest
wypowiadana przez standardowe środowisko wykonawcze OpenClaw TTS. Ustaw `mode: "bidi"`, gdy chcesz,
aby model głosu w czasie rzeczywistym odpowiadał bezpośrednio.
Pobliskie finalne fragmenty transkrypcji są scalane przed konsultacją, aby jedna wypowiedziana
tura nie generowała kilku nieaktualnych częściowych odpowiedzi. Dane wejściowe czasu rzeczywistego są także
wyciszane, gdy zakolejkowane audio asystenta nadal jest odtwarzane,
a niedawne echa transkrypcji podobne do asystenta są ignorowane przed konsultacją agenta,
aby local loopback BlackHole nie sprawił, że agent odpowie na własną mowę.

| Tryb    | Kto decyduje o odpowiedzi        | Ścieżka wyjścia mowy                     | Użyj, gdy                                              |
| ------- | ----------------------------- | -------------------------------------- | ----------------------------------------------------- |
| `agent` | Skonfigurowany agent OpenClaw | Standardowe środowisko wykonawcze OpenClaw TTS            | Chcesz zachowania „mój agent jest na spotkaniu”        |
| `bidi`  | Model głosu w czasie rzeczywistym      | Odpowiedź audio dostawcy głosu w czasie rzeczywistym | Chcesz pętli konwersacyjnego głosu o najniższym opóźnieniu |

W trybie `bidi`, gdy model czasu rzeczywistego potrzebuje głębszego rozumowania, aktualnych
informacji albo zwykłych narzędzi OpenClaw, może wywołać `openclaw_agent_consult`.

Narzędzie consult uruchamia standardowego agenta OpenClaw w tle z kontekstem
najnowszej transkrypcji spotkania i zwraca zwięzłą odpowiedź mówioną. W trybie `agent`
OpenClaw wysyła tę odpowiedź bezpośrednio do środowiska uruchomieniowego TTS; w trybie `bidi`
model głosowy realtime może wypowiedzieć wynik consult z powrotem na spotkaniu. Używa
tego samego współdzielonego mechanizmu consult co Voice Call.

Domyślnie consult działa na agencie `main`. Ustaw `realtime.agentId`, gdy
ścieżka Meet ma konsultować się z dedykowaną przestrzenią roboczą agenta OpenClaw,
domyślnymi ustawieniami modelu, polityką narzędzi, pamięcią i historią sesji.

Consult w trybie agenta używa klucza sesji dla pojedynczego spotkania
`agent:<id>:subagent:google-meet:<session>`, dzięki czemu pytania uzupełniające
zachowują kontekst spotkania, dziedzicząc normalną politykę agenta ze skonfigurowanego
agenta.

`realtime.toolPolicy` steruje uruchomieniem consult:

- `safe-read-only`: udostępnia narzędzie consult i ogranicza standardowego agenta do
  `read`, `web_search`, `web_fetch`, `x_search`, `memory_search` oraz
  `memory_get`.
- `owner`: udostępnia narzędzie consult i pozwala standardowemu agentowi używać normalnej
  polityki narzędzi agenta.
- `none`: nie udostępnia narzędzia consult modelowi głosowemu realtime.

Klucz sesji consult jest ograniczony do pojedynczej sesji Meet, więc kolejne wywołania consult
mogą ponownie używać wcześniejszego kontekstu consult podczas tego samego spotkania.

Aby wymusić mówiony test gotowości po pełnym dołączeniu Chrome do połączenia:

```bash
openclaw googlemeet speak meet_... "Say exactly: I'm here and listening."
```

Pełny smoke test dołączenia i mówienia:

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
  domyślnym transportem albo węzeł jest przypięty.
- `nodes status` pokazuje, że wybrany węzeł jest połączony.
- Wybrany węzeł ogłasza zarówno `googlemeet.chrome`, jak i `browser.proxy`.
- Karta Meet dołącza do połączenia, a `test-speech` zwraca stan Chrome z
  `inCall: true`.

Dla zdalnego hosta Chrome, takiego jak maszyna wirtualna Parallels macOS, jest to najkrótszy
bezpieczny test po aktualizacji Gateway albo maszyny wirtualnej:

```bash
openclaw googlemeet setup
openclaw nodes status --connected
openclaw nodes invoke \
  --node parallels-macos \
  --command googlemeet.chrome \
  --params '{"action":"setup"}'
```

To dowodzi, że Plugin Gateway jest załadowany, węzeł maszyny wirtualnej jest połączony z
bieżącym tokenem, a mostek audio Meet jest dostępny, zanim agent otworzy
rzeczywistą kartę spotkania.

Dla smoke testu Twilio użyj spotkania, które udostępnia szczegóły połączenia telefonicznego:

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
- Zwrócona sesja ma `transport: "twilio"` oraz `twilio.voiceCallId`.
- `openclaw logs --follow` pokazuje TwiML DTMF obsłużony przed TwiML realtime, a następnie
  mostek realtime z początkowym powitaniem w kolejce.
- `googlemeet leave <sessionId>` rozłącza delegowane połączenie głosowe.

## Rozwiązywanie problemów

### Agent nie widzi narzędzia Google Meet

Potwierdź, że Plugin jest włączony w konfiguracji Gateway, i przeładuj Gateway:

```bash
openclaw plugins list | grep google-meet
openclaw googlemeet setup
```

Jeśli przed chwilą edytowano `plugins.entries.google-meet`, uruchom ponownie albo przeładuj Gateway.
Działający agent widzi tylko narzędzia Pluginów zarejestrowane przez bieżący proces
Gateway.

Na hostach Gateway innych niż macOS narzędzie `google_meet` widoczne dla agenta pozostaje widoczne,
ale lokalne akcje talk-back Chrome są blokowane, zanim dotrą do mostka audio.
Lokalny dźwięk talk-back Chrome obecnie zależy od macOS `BlackHole 2ch`, więc
agenty Linux powinny używać `mode: "transcribe"`, połączenia telefonicznego Twilio albo hosta
macOS `chrome-node` zamiast domyślnej lokalnej ścieżki agenta Chrome.

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

Jeśli `googlemeet setup` nie zalicza `chrome-node-connected` albo log Gateway zgłasza
`gateway token mismatch`, zainstaluj ponownie albo uruchom ponownie węzeł z bieżącym tokenem Gateway.
Dla Gateway w LAN zwykle oznacza to:

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
dla dołączeń realtime, a następnie sprawdź zwrócony stan Chrome. Jeśli którykolwiek test
zgłasza `manualActionRequired: true`, pokaż operatorowi `manualActionMessage`
i przestań ponawiać próby, dopóki akcja w przeglądarce nie zostanie ukończona.

Typowe akcje ręczne:

- Zaloguj się w profilu Chrome.
- Wpuść gościa z konta gospodarza Meet.
- Przyznaj Chrome uprawnienia do mikrofonu/kamery, gdy pojawi się natywny monit uprawnień
  Chrome.
- Zamknij albo napraw zablokowane okno dialogowe uprawnień Meet.

Nie zgłaszaj „niezalogowany” tylko dlatego, że Meet pokazuje „Do you want people to
hear you in the meeting?” To ekran pośredni wyboru audio Meet; OpenClaw
klika **Use microphone** przez automatyzację przeglądarki, gdy jest dostępne, i nadal
czeka na rzeczywisty stan spotkania. Dla awaryjnej ścieżki przeglądarki tylko do tworzenia OpenClaw
może kliknąć **Continue without microphone**, ponieważ utworzenie URL-a nie wymaga
ścieżki audio realtime.

### Tworzenie spotkania kończy się niepowodzeniem

`googlemeet create` najpierw używa punktu końcowego Google Meet API `spaces.create`,
gdy skonfigurowano dane uwierzytelniające OAuth. Bez danych uwierzytelniających OAuth przechodzi awaryjnie
do przeglądarki przypiętego węzła Chrome. Potwierdź:

- Dla tworzenia przez API: skonfigurowano `oauth.clientId` i `oauth.refreshToken`,
  albo obecne są zgodne zmienne środowiskowe `OPENCLAW_GOOGLE_MEET_*`.
- Dla tworzenia przez API: token odświeżania został wygenerowany po dodaniu obsługi tworzenia.
  Starszym tokenom może brakować zakresu `meetings.space.created`; uruchom ponownie
  `openclaw googlemeet auth login --json` i zaktualizuj konfigurację Pluginu.
- Dla awaryjnej ścieżki przeglądarki: `defaultTransport: "chrome-node"` oraz
  `chromeNode.node` wskazują połączony węzeł z `browser.proxy` i
  `googlemeet.chrome`.
- Dla awaryjnej ścieżki przeglądarki: profil Chrome OpenClaw na tym węźle jest zalogowany
  do Google i może otworzyć `https://meet.google.com/new`.
- Dla awaryjnej ścieżki przeglądarki: ponowienia używają istniejącej karty
  `https://meet.google.com/new` albo monitu konta Google przed otwarciem nowej karty. Jeśli agent przekroczy limit czasu,
  ponów wywołanie narzędzia zamiast ręcznie otwierać kolejną kartę Meet.
- Dla awaryjnej ścieżki przeglądarki: jeśli narzędzie zwraca `manualActionRequired: true`, użyj
  zwróconych `browser.nodeId`, `browser.targetId`, `browserUrl` i
  `manualActionMessage`, aby pokierować operatorem. Nie ponawiaj prób w pętli, dopóki ta
  akcja nie zostanie ukończona.
- Dla awaryjnej ścieżki przeglądarki: jeśli Meet pokazuje „Do you want people to hear you in the
  meeting?”, zostaw kartę otwartą. OpenClaw powinien kliknąć **Use microphone** albo, dla
  awaryjnej ścieżki tylko do tworzenia, **Continue without microphone** przez automatyzację
  przeglądarki i kontynuować oczekiwanie na wygenerowany URL Meet. Jeśli nie może tego zrobić, błąd
  powinien wskazywać `meet-audio-choice-required`, a nie `google-login-required`.

### Agent dołącza, ale nie mówi

Sprawdź ścieżkę realtime:

```bash
openclaw googlemeet setup
openclaw googlemeet doctor
```

Użyj `mode: "agent"` dla normalnej ścieżki STT -> agent OpenClaw -> talk-back TTS,
albo `mode: "bidi"` dla bezpośredniej awaryjnej ścieżki głosowej realtime. `mode: "transcribe"`
celowo nie uruchamia mostka talk-back. Do debugowania tylko obserwacyjnego
uruchom `openclaw googlemeet status --json <session-id>` po tym, jak uczestnicy zaczną mówić,
i sprawdź `captioning`, `transcriptLines` oraz `lastCaptionText`. Jeśli `inCall` ma wartość
true, ale `transcriptLines` pozostaje na `0`, napisy Meet mogą być wyłączone, nikt
nie mówił od zainstalowania obserwatora, UI Meet się zmienił albo napisy live
są niedostępne dla języka/konta spotkania.

`googlemeet test-speech` zawsze sprawdza ścieżkę realtime i raportuje, czy
dla tego wywołania zaobserwowano bajty wyjściowe mostka. Jeśli `speechOutputVerified` jest false, a
`speechOutputTimedOut` jest true, dostawca realtime mógł zaakceptować
wypowiedź, ale OpenClaw nie zobaczył, aby nowe bajty wyjściowe dotarły do mostka audio
Chrome.

Zweryfikuj także:

- Klucz dostawcy realtime jest dostępny na hoście Gateway, na przykład
  `OPENAI_API_KEY` albo `GEMINI_API_KEY`.
- `BlackHole 2ch` jest widoczne na hoście Chrome.
- `sox` istnieje na hoście Chrome.
- Mikrofon i głośnik Meet są kierowane przez wirtualną ścieżkę audio używaną przez
  OpenClaw. `doctor` powinien pokazać `meet output routed: yes` dla lokalnych dołączeń
  realtime Chrome.

`googlemeet doctor [session-id]` wypisuje sesję, węzeł, stan w połączeniu,
powód akcji ręcznej, połączenie z dostawcą realtime, `realtimeReady`, aktywność
wejścia/wyjścia audio, ostatnie znaczniki czasu audio, liczniki bajtów i URL przeglądarki.
Użyj `googlemeet status [session-id] --json`, gdy potrzebujesz surowego JSON-a. Użyj
`googlemeet doctor --oauth`, gdy musisz zweryfikować odświeżanie OAuth Google Meet
bez ujawniania tokenów; dodaj `--meeting` albo `--create-space`, gdy potrzebujesz
także dowodu Google Meet API.

Jeśli agent przekroczył limit czasu i widzisz już otwartą kartę Meet, sprawdź tę kartę
bez otwierania kolejnej:

```bash
openclaw googlemeet recover-tab
openclaw googlemeet recover-tab https://meet.google.com/abc-defg-hij
```

Równoważną akcją narzędzia jest `recover_current_tab`. Ustawia fokus i sprawdza
istniejącą kartę Meet dla wybranego transportu. Z `chrome` używa lokalnej
kontroli przeglądarki przez Gateway; z `chrome-node` używa skonfigurowanego
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

`twilio-voice-call-webhook` kończy się niepowodzeniem, gdy `voice-call` nie ma publicznej ekspozycji
Webhooka albo gdy `publicUrl` wskazuje na local loopback lub prywatną przestrzeń sieciową.
Ustaw `plugins.entries.voice-call.config.publicUrl` na publiczny URL dostawcy albo
skonfiguruj tunel/ekspozycję Tailscale dla `voice-call`.

Adresy URL pętli zwrotnej i prywatne nie są poprawne dla wywołań zwrotnych operatora. Nie używaj
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

Do lokalnego programowania użyj tunelu albo ekspozycji Tailscale zamiast prywatnego
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

Następnie uruchom ponownie albo przeładuj Gateway i uruchom:

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
z powiadomieniem:

```bash
openclaw voicecall smoke --to "+15555550123" --yes
```

### Połączenie Twilio się rozpoczyna, ale nigdy nie wchodzi do spotkania

Potwierdź, że wydarzenie Meet udostępnia szczegóły telefonicznego dołączania. Przekaż dokładny
numer telefoniczny i PIN albo niestandardową sekwencję DTMF:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --dtmf-sequence ww123456#
```

Użyj początkowego `w` albo przecinków w `--dtmf-sequence`, jeśli dostawca potrzebuje pauzy
przed wprowadzeniem PIN-u.

Jeśli połączenie telefoniczne zostało utworzone, ale lista uczestników Meet nigdy nie pokazuje
uczestnika dołączonego telefonicznie:

- Uruchom `openclaw googlemeet doctor <session-id>`, aby potwierdzić delegowany identyfikator
  połączenia Twilio, czy DTMF został zakolejkowany i czy poproszono o powitanie wstępne.
- Uruchom `openclaw voicecall status --call-id <id>` i potwierdź, że połączenie nadal jest
  aktywne.
- Uruchom `openclaw voicecall tail` i sprawdź, czy Webhook Twilio docierają do
  Gateway.
- Uruchom `openclaw logs --follow` i poszukaj sekwencji Twilio Meet: Google
  Meet deleguje dołączenie, Voice Call zapisuje i serwuje TwiML DTMF przed połączeniem,
  Voice Call serwuje TwiML czasu rzeczywistego dla połączenia Twilio, a następnie Google Meet żąda
  mowy wprowadzającej przez `voicecall.speak`.
- Uruchom ponownie `openclaw googlemeet setup --transport twilio`; zielony wynik sprawdzenia konfiguracji jest
  wymagany, ale nie dowodzi, że sekwencja PIN-u spotkania jest poprawna.
- Potwierdź, że numer telefoniczny należy do tego samego zaproszenia Meet i regionu co
  PIN.
- Zwiększ `voiceCall.dtmfDelayMs` z domyślnych 12 sekund, jeśli Meet odpowiada
  powoli albo transkrypcja połączenia nadal pokazuje monit proszący o PIN po
  wysłaniu DTMF przed połączeniem.
- Jeśli uczestnik dołącza, ale nie słyszysz powitania, sprawdź
  `openclaw logs --follow` pod kątem żądania `voicecall.speak` po DTMF oraz
  odtwarzania TTS strumienia multimediów albo awaryjnego Twilio `<Say>`. Jeśli transkrypcja
  połączenia nadal zawiera „enter the meeting PIN”, noga telefoniczna nie dołączyła jeszcze
  do pokoju Meet, więc uczestnicy spotkania nie usłyszą mowy.

Jeśli Webhook nie docierają, najpierw debuguj Plugin Voice Call: dostawca musi
osiągać `plugins.entries.voice-call.config.publicUrl` albo skonfigurowany tunel.
Zobacz [Rozwiązywanie problemów z połączeniami głosowymi](/pl/plugins/voice-call#troubleshooting).

## Uwagi

Oficjalne API multimediów Google Meet jest zorientowane na odbiór, więc mówienie w połączeniu Meet
nadal wymaga ścieżki uczestnika. Ten Plugin utrzymuje tę granicę widoczną:
Chrome obsługuje uczestnictwo w przeglądarce i lokalne trasowanie audio; Twilio obsługuje
uczestnictwo przez telefoniczne dołączanie.

Tryby odpowiedzi głosowej Chrome wymagają `BlackHole 2ch` oraz jednego z poniższych:

- `chrome.audioInputCommand` plus `chrome.audioOutputCommand`: OpenClaw zarządza
  mostkiem i przesyła audio w `chrome.audioFormat` między tymi poleceniami a
  wybranym dostawcą. Tryb agenta używa transkrypcji czasu rzeczywistego oraz zwykłego TTS;
  tryb bidi używa dostawcy głosu czasu rzeczywistego. Domyślna ścieżka Chrome to 24 kHz
  PCM16 z `chrome.audioBufferBytes: 4096`; 8 kHz G.711 mu-law pozostaje
  dostępne dla starszych par poleceń.
- `chrome.audioBridgeCommand`: zewnętrzne polecenie mostka zarządza całą lokalną
  ścieżką audio i musi zakończyć działanie po uruchomieniu albo zweryfikowaniu swojego demona. Jest to
  poprawne tylko dla `bidi`, ponieważ tryb `agent` potrzebuje bezpośredniego dostępu do par poleceń dla TTS.

Gdy agent wywołuje narzędzie `google_meet` w trybie agenta, sesja konsultanta spotkania
forkuje bieżącą transkrypcję wywołującego przed odpowiadaniem na mowę uczestników.
Sesja Meet nadal pozostaje oddzielna (`agent:<agentId>:subagent:google-meet:<sessionId>`),
więc dalsze działania spotkania nie mutują bezpośrednio transkrypcji wywołującego.

Aby uzyskać czysty dźwięk dwukierunkowy, trasuj wyjście Meet i mikrofon Meet przez oddzielne
urządzenia wirtualne albo graf urządzeń wirtualnych w stylu Loopback. Jedno współdzielone
urządzenie BlackHole może odbijać innych uczestników z powrotem do połączenia.

Przy mostku Chrome opartym na parze poleceń `chrome.bargeInInputCommand` może nasłuchiwać
oddzielnego lokalnego mikrofonu i czyścić odtwarzanie asystenta, gdy człowiek zaczyna
mówić. Dzięki temu mowa człowieka ma pierwszeństwo przed wyjściem asystenta nawet wtedy, gdy współdzielone
wejście loopback BlackHole jest tymczasowo tłumione podczas odtwarzania asystenta.
Podobnie jak `chrome.audioInputCommand` i `chrome.audioOutputCommand`, jest to
lokalne polecenie konfigurowane przez operatora. Użyj jawnej zaufanej ścieżki polecenia albo
listy argumentów i nie kieruj go do skryptów z niezaufanych lokalizacji.

`googlemeet speak` wyzwala aktywny mostek audio odpowiedzi głosowej dla sesji Chrome.
`googlemeet leave` zatrzymuje ten mostek. W przypadku sesji Twilio delegowanych
przez Plugin Voice Call `leave` rozłącza również bazowe połączenie głosowe.
Użyj `googlemeet end-active-conference`, gdy chcesz także zamknąć aktywną
konferencję Google Meet dla przestrzeni zarządzanej przez API.

## Powiązane

- [Plugin połączeń głosowych](/pl/plugins/voice-call)
- [Tryb rozmowy](/pl/nodes/talk)
- [Tworzenie Plugin](/pl/plugins/building-plugins)
