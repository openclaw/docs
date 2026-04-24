---
read_when:
    - Chcesz, aby agent OpenClaw dołączył do rozmowy Google Meet
    - Konfigurujesz Chrome, Chrome Node lub Twilio jako transport Google Meet
summary: 'Plugin Google Meet: dołączanie do jawnych URL-i Meet przez Chrome lub Twilio z domyślnymi ustawieniami głosu w czasie rzeczywistym'
title: Plugin Google Meet
x-i18n:
    generated_at: "2026-04-24T09:22:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8d430a1f2d6ee7fc1d997ef388a2e0d2915a6475480343e7060edac799dfc027
    source_path: plugins/google-meet.md
    workflow: 15
---

# Google Meet (Plugin)

Obsługa uczestników Google Meet dla OpenClaw.

Ten Plugin jest z założenia jawny:

- Dołącza tylko do jawnego URL `https://meet.google.com/...`.
- Domyślnym trybem głosowym jest `realtime`.
- Głos w czasie rzeczywistym może wywoływać pełnego agenta OpenClaw, gdy potrzebne są głębsze
  rozumowanie lub narzędzia.
- Uwierzytelnianie zaczyna się od osobistego Google OAuth albo już zalogowanego profilu Chrome.
- Nie ma automatycznego komunikatu o zgodzie.
- Domyślnym backendem audio Chrome jest `BlackHole 2ch`.
- Chrome może działać lokalnie albo na sparowanym hoście Node.
- Twilio akceptuje numer dial-in oraz opcjonalny PIN lub sekwencję DTMF.
- Polecenie CLI to `googlemeet`; `meet` jest zarezerwowane dla szerszych
  przepływów telekonferencji agentów.

## Szybki start

Zainstaluj lokalne zależności audio i upewnij się, że dostawca realtime może używać
OpenAI:

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
```

`blackhole-2ch` instaluje wirtualne urządzenie audio `BlackHole 2ch`. Instalator
Homebrew wymaga restartu, zanim macOS udostępni to urządzenie:

```bash
sudo reboot
```

Po restarcie zweryfikuj oba elementy:

```bash
system_profiler SPAudioDataType | grep -i BlackHole
command -v rec play
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

Dołącz do spotkania:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij
```

Albo pozwól agentowi dołączyć przez narzędzie `google_meet`:

```json
{
  "action": "join",
  "url": "https://meet.google.com/abc-defg-hij"
}
```

Chrome dołącza jako zalogowany profil Chrome. W Meet wybierz `BlackHole 2ch` dla
ścieżki mikrofonu/głośnika używanej przez OpenClaw. Aby uzyskać czysty dźwięk
dupleksowy, użyj oddzielnych urządzeń wirtualnych albo grafu w stylu Loopback; jedno urządzenie BlackHole wystarczy
do pierwszego testu smoke, ale może powodować echo.

### Lokalny Gateway + Chrome w Parallels

Nie potrzebujesz pełnego Gateway OpenClaw ani klucza API modelu wewnątrz maszyny wirtualnej macOS
tylko po to, aby to VM było właścicielem Chrome. Uruchom Gateway i agenta lokalnie, a następnie uruchom
hosta Node w VM. Włącz dołączony Plugin w VM raz, aby Node
ogłaszał polecenie Chrome:

Co działa gdzie:

- Host Gateway: Gateway OpenClaw, obszar roboczy agenta, klucze modelu/API, dostawca realtime
  oraz konfiguracja Pluginu Google Meet.
- VM macOS w Parallels: CLI/node host OpenClaw, Google Chrome, SoX, BlackHole 2ch,
  oraz profil Chrome zalogowany do Google.
- Niewymagane w VM: usługa Gateway, konfiguracja agenta, klucz OpenAI/GPT ani konfiguracja dostawcy modelu.

Zainstaluj zależności VM:

```bash
brew install blackhole-2ch sox
```

Uruchom ponownie VM po instalacji BlackHole, aby macOS udostępnił `BlackHole 2ch`:

```bash
sudo reboot
```

Po restarcie sprawdź, czy VM widzi urządzenie audio i polecenia SoX:

```bash
system_profiler SPAudioDataType | grep -i BlackHole
command -v rec play
```

Zainstaluj lub zaktualizuj OpenClaw w VM, a następnie włącz tam dołączony Plugin:

```bash
openclaw plugins enable google-meet
```

Uruchom hosta Node w VM:

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name parallels-macos
```

Jeśli `<gateway-host>` jest adresem IP LAN i nie używasz TLS, Node odrzuci to
jawne połączenie WebSocket, chyba że jawnie zezwolisz na tę zaufaną sieć prywatną:

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node run --host <gateway-lan-ip> --port 18789 --display-name parallels-macos
```

Użyj tej samej zmiennej środowiskowej przy instalowaniu Node jako LaunchAgent:

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node install --host <gateway-lan-ip> --port 18789 --display-name parallels-macos --force
openclaw node restart
```

`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` to środowisko procesu, a nie
ustawienie `openclaw.json`. `openclaw node install` zapisuje je w środowisku LaunchAgent,
gdy jest obecne w poleceniu instalacji.

Zatwierdź Node z hosta Gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Potwierdź, że Gateway widzi Node i że ogłasza `googlemeet.chrome`:

```bash
openclaw nodes status
```

Skieruj Meet przez ten Node na hoście Gateway:

```json5
{
  gateway: {
    nodes: {
      allowCommands: ["googlemeet.chrome"],
    },
  },
  plugins: {
    entries: {
      "google-meet": {
        enabled: true,
        config: {
          defaultTransport: "chrome-node",
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

Jeśli `chromeNode.node` zostanie pominięte, OpenClaw automatycznie wybiera tylko wtedy, gdy dokładnie jeden
podłączony Node ogłasza `googlemeet.chrome`. Jeśli podłączonych jest kilka
obsługiwanych Node, ustaw `chromeNode.node` na identyfikator Node, nazwę wyświetlaną lub zdalny adres IP.

Typowe kontrole awarii:

- `No connected Google Meet-capable node`: uruchom `openclaw node run` w VM,
  zatwierdź parowanie i upewnij się, że w VM uruchomiono `openclaw plugins enable google-meet`.
  Potwierdź też, że host Gateway zezwala na polecenie Node przez
  `gateway.nodes.allowCommands: ["googlemeet.chrome"]`.
- `BlackHole 2ch audio device not found on the node`: zainstaluj `blackhole-2ch`
  w VM i uruchom ponownie VM.
- Chrome otwiera się, ale nie może dołączyć: zaloguj się do Chrome wewnątrz VM i potwierdź, że
  ten profil może ręcznie dołączyć do URL Meet.
- Brak audio: w Meet skieruj mikrofon/głośnik przez ścieżkę wirtualnego urządzenia audio
  używaną przez OpenClaw; dla czystego dupleksu użyj oddzielnych urządzeń wirtualnych albo routingu
  w stylu Loopback.

## Uwagi dotyczące instalacji

Domyślna ścieżka Chrome realtime używa dwóch zewnętrznych narzędzi:

- `sox`: narzędzie audio w wierszu poleceń. Plugin używa jego poleceń `rec` i `play`
  dla domyślnego mostu audio 8 kHz G.711 mu-law.
- `blackhole-2ch`: wirtualny sterownik audio macOS. Tworzy urządzenie audio `BlackHole 2ch`,
  przez które Chrome/Meet mogą kierować dźwięk.

OpenClaw nie dołącza ani nie redystrybuuje żadnego z tych pakietów. Dokumentacja prosi użytkowników o
instalację ich jako zależności hosta przez Homebrew. SoX jest licencjonowany jako
`LGPL-2.0-only AND GPL-2.0-only`; BlackHole jako GPL-3.0. Jeśli budujesz
instalator lub appliance, który dołącza BlackHole do OpenClaw, sprawdź
warunki licencyjne upstream BlackHole albo uzyskaj osobną licencję od Existential Audio.

## Transporty

### Chrome

Transport Chrome otwiera URL Meet w Google Chrome i dołącza jako zalogowany
profil Chrome. Na macOS Plugin sprawdza obecność `BlackHole 2ch` przed uruchomieniem.
Jeśli jest skonfigurowany, uruchamia też polecenie sprawdzania kondycji mostu audio oraz polecenie startowe
przed otwarciem Chrome. Użyj `chrome`, gdy Chrome/audio działają na hoście Gateway;
użyj `chrome-node`, gdy Chrome/audio działają na sparowanym Node, takim jak VM macOS w Parallels.

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome-node
```

Skieruj dźwięk mikrofonu i głośnika Chrome przez lokalny most audio OpenClaw.
Jeśli `BlackHole 2ch` nie jest zainstalowane, dołączenie kończy się błędem konfiguracji
zamiast po cichu dołączyć bez ścieżki audio.

### Twilio

Transport Twilio to ścisły plan wybierania delegowany do Pluginu Voice Call. Nie
parsuje stron Meet w poszukiwaniu numerów telefonów.

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

Dostęp do Google Meet Media API najpierw używa osobistego klienta OAuth. Skonfiguruj
`oauth.clientId` i opcjonalnie `oauth.clientSecret`, a następnie uruchom:

```bash
openclaw googlemeet auth login --json
```

Polecenie wypisuje blok konfiguracji `oauth` z tokenem odświeżania. Używa PKCE,
callbacku localhost pod `http://localhost:8085/oauth2callback` oraz ręcznego
przepływu kopiuj/wklej z `--manual`.

Te zmienne środowiskowe są akceptowane jako fallbacki:

- `OPENCLAW_GOOGLE_MEET_CLIENT_ID` albo `GOOGLE_MEET_CLIENT_ID`
- `OPENCLAW_GOOGLE_MEET_CLIENT_SECRET` albo `GOOGLE_MEET_CLIENT_SECRET`
- `OPENCLAW_GOOGLE_MEET_REFRESH_TOKEN` albo `GOOGLE_MEET_REFRESH_TOKEN`
- `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN` albo `GOOGLE_MEET_ACCESS_TOKEN`
- `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT` albo
  `GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT`
- `OPENCLAW_GOOGLE_MEET_DEFAULT_MEETING` albo `GOOGLE_MEET_DEFAULT_MEETING`
- `OPENCLAW_GOOGLE_MEET_PREVIEW_ACK` albo `GOOGLE_MEET_PREVIEW_ACK`

Rozwiąż URL Meet, kod albo `spaces/{id}` przez `spaces.get`:

```bash
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
```

Uruchom preflight przed pracą z multimediami:

```bash
openclaw googlemeet preflight --meeting https://meet.google.com/abc-defg-hij
```

Ustaw `preview.enrollmentAcknowledged: true` dopiero po potwierdzeniu, że twój
projekt Cloud, principal OAuth i uczestnicy spotkania są zapisani do programu Google
Workspace Developer Preview dla interfejsów Meet media API.

## Konfiguracja

Typowa ścieżka Chrome realtime wymaga tylko włączenia Pluginu, BlackHole, SoX
i klucza OpenAI:

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
```

Ustaw konfigurację Pluginu pod `plugins.entries.google-meet.config`:

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
- `chromeNode.node`: opcjonalny identyfikator/nazwa/IP Node dla `chrome-node`
- `chrome.audioBackend: "blackhole-2ch"`
- `chrome.audioInputCommand`: polecenie SoX `rec` zapisujące 8 kHz G.711 mu-law
  audio do stdout
- `chrome.audioOutputCommand`: polecenie SoX `play` odczytujące 8 kHz G.711 mu-law
  audio ze stdin
- `realtime.provider: "openai"`
- `realtime.toolPolicy: "safe-read-only"`
- `realtime.instructions`: krótkie odpowiedzi mówione, z
  `openclaw_agent_consult` dla głębszych odpowiedzi
- `realtime.introMessage`: krótki mówiony komunikat gotowości, gdy most realtime
  się połączy; ustaw na `""`, aby dołączać po cichu

Opcjonalne nadpisania:

```json5
{
  defaults: {
    meeting: "https://meet.google.com/abc-defg-hij",
  },
  chrome: {
    browserProfile: "Default",
  },
  chromeNode: {
    node: "parallels-macos",
  },
  realtime: {
    toolPolicy: "owner",
    introMessage: "Say exactly: I'm here.",
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
`transport: "chrome-node"`, gdy Chrome działa na sparowanym Node, takim jak VM
w Parallels. W obu przypadkach model realtime i `openclaw_agent_consult` działają na
hoście Gateway, więc poświadczenia modelu tam pozostają.

Użyj `action: "status"`, aby wyświetlić aktywne sesje albo sprawdzić identyfikator sesji. Użyj
`action: "speak"` z `sessionId` i `message`, aby agent realtime
natychmiast coś powiedział. Użyj `action: "leave"`, aby oznaczyć sesję jako zakończoną.

```json
{
  "action": "speak",
  "sessionId": "meet_...",
  "message": "Say exactly: I'm here and listening."
}
```

## Realtime agent consult

Tryb Chrome realtime jest zoptymalizowany pod żywą pętlę głosową. Dostawca
głosu realtime słyszy dźwięk spotkania i mówi przez skonfigurowany most audio.
Gdy model realtime potrzebuje głębszego rozumowania, bieżących informacji albo zwykłych
narzędzi OpenClaw, może wywołać `openclaw_agent_consult`.

Narzędzie consult uruchamia w tle zwykłego agenta OpenClaw z ostatnim
kontekstem transkryptu spotkania i zwraca zwięzłą odpowiedź mówioną do sesji
głosowej realtime. Model głosowy może następnie wypowiedzieć tę odpowiedź z powrotem w spotkaniu.

`realtime.toolPolicy` steruje przebiegiem consult:

- `safe-read-only`: udostępnia narzędzie consult i ogranicza zwykłego agenta do
  `read`, `web_search`, `web_fetch`, `x_search`, `memory_search` oraz
  `memory_get`.
- `owner`: udostępnia narzędzie consult i pozwala zwykłemu agentowi używać normalnej
  polityki narzędzi agenta.
- `none`: nie udostępnia narzędzia consult modelowi głosowemu realtime.

Klucz sesji consult jest ograniczony per sesja Meet, dzięki czemu kolejne wywołania consult
mogą ponownie używać wcześniejszego kontekstu consult podczas tego samego spotkania.

Aby wymusić mówiony komunikat gotowości po pełnym dołączeniu Chrome do połączenia:

```bash
openclaw googlemeet speak meet_... "Say exactly: I'm here and listening."
```

## Uwagi

Oficjalne media API Google Meet jest zorientowane na odbiór, więc mówienie do
połączenia Meet nadal wymaga ścieżki uczestnika. Ten Plugin utrzymuje tę granicę jako widoczną:
Chrome obsługuje udział przeglądarki i lokalny routing audio; Twilio obsługuje
udział przez połączenie telefoniczne.

Tryb Chrome realtime wymaga jednego z poniższych:

- `chrome.audioInputCommand` plus `chrome.audioOutputCommand`: OpenClaw przejmuje
  most modelu realtime i przesyła audio 8 kHz G.711 mu-law między tymi
  poleceniami a wybranym dostawcą głosu realtime.
- `chrome.audioBridgeCommand`: zewnętrzne polecenie mostu przejmuje całą lokalną
  ścieżkę audio i musi zakończyć się po uruchomieniu lub zweryfikowaniu swojego demona.

Aby uzyskać czysty dźwięk dupleksowy, kieruj wyjście Meet i mikrofon Meet przez oddzielne
urządzenia wirtualne albo graf urządzeń wirtualnych w stylu Loopback. Pojedyncze współdzielone
urządzenie BlackHole może odbijać innych uczestników z powrotem do połączenia.

`googlemeet speak` wyzwala aktywny most audio realtime dla sesji Chrome.
`googlemeet leave` zatrzymuje ten most. Dla sesji Twilio delegowanych
przez Plugin Voice Call `leave` rozłącza także bazowe połączenie głosowe.

## Powiązane

- [Plugin połączeń głosowych](/pl/plugins/voice-call)
- [Tryb talk](/pl/nodes/talk)
- [Tworzenie Pluginów](/pl/plugins/building-plugins)
