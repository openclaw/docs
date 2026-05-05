---
read_when:
    - Praca nad zachowaniem kanału WhatsApp/web lub routingiem skrzynki odbiorczej
summary: Obsługa kanału WhatsApp, mechanizmy kontroli dostępu, sposób dostarczania i operacje
title: WhatsApp
x-i18n:
    generated_at: "2026-05-05T06:15:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: 52a81fc323568e06d11606931e34465fe5a823a0699d8e0638195b8667c3ebee
    source_path: channels/whatsapp.md
    workflow: 16
---

Stan: gotowe do produkcji przez WhatsApp Web (Baileys). Gateway zarządza połączonymi sesjami.

## Instalacja (na żądanie)

- Onboarding (`openclaw onboard`) oraz `openclaw channels add --channel whatsapp`
  proszą o zainstalowanie Pluginu WhatsApp przy pierwszym wyborze.
- `openclaw channels login --channel whatsapp` także oferuje przepływ instalacji, gdy
  Plugin nie jest jeszcze obecny.
- Kanał deweloperski + checkout git: domyślnie używa lokalnej ścieżki Pluginu.
- Stable/Beta: używa pakietu npm `@openclaw/whatsapp` z bieżącego oficjalnego
  tagu wydania.

Instalacja ręczna pozostaje dostępna:

```bash
openclaw plugins install @openclaw/whatsapp
```

Użyj samej nazwy pakietu, aby śledzić bieżący oficjalny tag wydania. Przypnij dokładną
wersję tylko wtedy, gdy potrzebujesz powtarzalnej instalacji.

W systemie Windows Plugin WhatsApp wymaga Git w `PATH` podczas instalacji npm, ponieważ
jedna z jego zależności Baileys/libsignal jest pobierana z adresu URL git. Zainstaluj
Git for Windows, następnie uruchom ponownie powłokę i ponów instalację:

```powershell
winget install --id Git.Git -e
```

Portable Git także działa, jeśli jego katalog `bin` znajduje się w `PATH`.

<CardGroup cols={3}>
  <Card title="Parowanie" icon="link" href="/pl/channels/pairing">
    Domyślna polityka DM to parowanie dla nieznanych nadawców.
  </Card>
  <Card title="Rozwiązywanie problemów z kanałem" icon="wrench" href="/pl/channels/troubleshooting">
    Diagnostyka międzykanałowa i procedury naprawcze.
  </Card>
  <Card title="Konfiguracja Gateway" icon="settings" href="/pl/gateway/configuration">
    Pełne wzorce i przykłady konfiguracji kanałów.
  </Card>
</CardGroup>

## Szybka konfiguracja

<Steps>
  <Step title="Skonfiguruj politykę dostępu WhatsApp">

```json5
{
  channels: {
    whatsapp: {
      dmPolicy: "pairing",
      allowFrom: ["+15551234567"],
      groupPolicy: "allowlist",
      groupAllowFrom: ["+15551234567"],
    },
  },
}
```

  </Step>

  <Step title="Połącz WhatsApp (QR)">

```bash
openclaw channels login --channel whatsapp
```

    Dla konkretnego konta:

```bash
openclaw channels login --channel whatsapp --account work
```

    Aby podłączyć istniejący/niestandardowy katalog uwierzytelniania WhatsApp Web przed logowaniem:

```bash
openclaw channels add --channel whatsapp --account work --auth-dir /path/to/wa-auth
openclaw channels login --channel whatsapp --account work
```

  </Step>

  <Step title="Uruchom gateway">

```bash
openclaw gateway
```

  </Step>

  <Step title="Zatwierdź pierwszą prośbę o parowanie (jeśli używasz trybu parowania)">

```bash
openclaw pairing list whatsapp
openclaw pairing approve whatsapp <CODE>
```

    Prośby o parowanie wygasają po 1 godzinie. Liczba oczekujących próśb jest ograniczona do 3 na kanał.

  </Step>
</Steps>

<Note>
OpenClaw zaleca uruchamianie WhatsApp na oddzielnym numerze, gdy jest to możliwe. (Metadane kanału i przepływ konfiguracji są zoptymalizowane pod taką konfigurację, ale konfiguracje z numerem osobistym także są obsługiwane).
</Note>

## Wzorce wdrożenia

<AccordionGroup>
  <Accordion title="Dedykowany numer (zalecane)">
    To najczyściejszy tryb operacyjny:

    - oddzielna tożsamość WhatsApp dla OpenClaw
    - czytelniejsze listy dozwolonych DM i granice routingu
    - mniejsze ryzyko pomyłek związanych z czatem z samym sobą

    Minimalny wzorzec polityki:

    ```json5
    {
      channels: {
        whatsapp: {
          dmPolicy: "allowlist",
          allowFrom: ["+15551234567"],
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Fallback z numerem osobistym">
    Onboarding obsługuje tryb numeru osobistego i zapisuje bazową konfigurację przyjazną czatowi z samym sobą:

    - `dmPolicy: "allowlist"`
    - `allowFrom` zawiera Twój numer osobisty
    - `selfChatMode: true`

    W czasie działania zabezpieczenia czatu z samym sobą opierają się na połączonym numerze własnym i `allowFrom`.

  </Accordion>

  <Accordion title="Zakres kanału tylko WhatsApp Web">
    Kanał platformy komunikacyjnej jest oparty na WhatsApp Web (`Baileys`) w bieżącej architekturze kanałów OpenClaw.

    W wbudowanym rejestrze kanałów czatu nie ma oddzielnego kanału komunikacyjnego Twilio WhatsApp.

  </Accordion>
</AccordionGroup>

## Model działania

- Gateway zarządza gniazdem WhatsApp i pętlą ponownego łączenia.
- Watchdog ponownego łączenia używa aktywności transportu WhatsApp Web, a nie tylko wolumenu przychodzących wiadomości aplikacyjnych, więc cicha sesja połączonego urządzenia nie jest restartowana wyłącznie dlatego, że nikt ostatnio nie wysłał wiadomości. Dłuższy limit ciszy aplikacyjnej nadal wymusza ponowne połączenie, jeśli ramki transportowe nadal przychodzą, ale żadne wiadomości aplikacyjne nie są obsługiwane przez czas okna watchdog; po przejściowym ponownym połączeniu dla niedawno aktywnej sesji ten test ciszy aplikacyjnej używa normalnego limitu czasu wiadomości dla pierwszego okna odzyskiwania.
- Czasy gniazda Baileys są jawne w `web.whatsapp.*`: `keepAliveIntervalMs` kontroluje pingi aplikacyjne WhatsApp Web, `connectTimeoutMs` kontroluje limit czasu otwierającego uzgadniania, a `defaultQueryTimeoutMs` kontroluje limity czasu zapytań Baileys.
- Wysyłanie wychodzące wymaga aktywnego nasłuchiwacza WhatsApp dla konta docelowego.
- Wysyłki grupowe dołączają natywne metadane wzmianek dla tokenów `@+<digits>` i `@<digits>` w tekście oraz podpisach mediów, gdy token pasuje do bieżących metadanych uczestników WhatsApp, w tym grup opartych na LID.
- Czaty statusowe i broadcast są ignorowane (`@status`, `@broadcast`).
- Watchdog ponownego łączenia śledzi aktywność transportu WhatsApp Web, a nie tylko wolumen przychodzących wiadomości aplikacyjnych: ciche sesje połączonego urządzenia pozostają aktywne, gdy ramki transportowe nadal płyną, ale zastój transportu wymusza ponowne połączenie dużo wcześniej niż późniejsza ścieżka zdalnego rozłączenia.
- Czaty bezpośrednie używają reguł sesji DM (`session.dmScope`; domyślne `main` zwija DM do głównej sesji agenta).
- Sesje grupowe są izolowane (`agent:<agentId>:whatsapp:group:<jid>`).
- WhatsApp Channels/Newsletters mogą być jawnymi celami wychodzącymi ze swoim natywnym JID `@newsletter`. Wysyłki wychodzące do newslettera używają metadanych sesji kanału (`agent:<agentId>:whatsapp:channel:<jid>`), a nie semantyki sesji DM.
- Transport WhatsApp Web honoruje standardowe zmienne środowiskowe proxy na hoście gateway (`HTTPS_PROXY`, `HTTP_PROXY`, `NO_PROXY` / warianty małymi literami). Preferuj konfigurację proxy na poziomie hosta zamiast ustawień proxy WhatsApp specyficznych dla kanału.
- Gdy `messages.removeAckAfterReply` jest włączone, OpenClaw czyści reakcję potwierdzenia WhatsApp po dostarczeniu widocznej odpowiedzi.

## Hooki Pluginu i prywatność

Wiadomości przychodzące WhatsApp mogą zawierać osobistą treść wiadomości, numery telefonów,
identyfikatory grup, nazwy nadawców i pola korelacji sesji. Z tego powodu
WhatsApp nie rozgłasza przychodzących ładunków hooka `message_received` do Pluginów,
chyba że jawnie to włączysz:

```json5
{
  channels: {
    whatsapp: {
      pluginHooks: {
        messageReceived: true,
      },
    },
  },
}
```

Możesz ograniczyć zgodę do jednego konta:

```json5
{
  channels: {
    whatsapp: {
      accounts: {
        work: {
          pluginHooks: {
            messageReceived: true,
          },
        },
      },
    },
  },
}
```

Włączaj to tylko dla Pluginów, którym ufasz w zakresie otrzymywania treści i identyfikatorów
przychodzących wiadomości WhatsApp.

## Kontrola dostępu i aktywacja

<Tabs>
  <Tab title="Polityka DM">
    `channels.whatsapp.dmPolicy` kontroluje dostęp do czatu bezpośredniego:

    - `pairing` (domyślne)
    - `allowlist`
    - `open` (wymaga, aby `allowFrom` zawierało `"*"`)
    - `disabled`

    `allowFrom` akceptuje numery w stylu E.164 (normalizowane wewnętrznie).

    `allowFrom` to lista kontroli dostępu nadawców DM. Nie ogranicza jawnych wysyłek wychodzących do JID grup WhatsApp ani JID kanałów `@newsletter`.

    Nadpisanie dla wielu kont: `channels.whatsapp.accounts.<id>.dmPolicy` (oraz `allowFrom`) ma pierwszeństwo przed wartościami domyślnymi na poziomie kanału dla tego konta.

    Szczegóły zachowania w czasie działania:

    - parowania są utrwalane w magazynie dozwolonych kanału i scalane ze skonfigurowanym `allowFrom`
    - zaplanowana automatyzacja i fallback odbiorców Heartbeat używają jawnych celów dostarczania albo skonfigurowanego `allowFrom`; zatwierdzenia parowania DM nie są niejawnymi odbiorcami Cron ani Heartbeat
    - jeśli nie skonfigurowano listy dozwolonych, połączony numer własny jest domyślnie dozwolony
    - OpenClaw nigdy nie paruje automatycznie wychodzących DM `fromMe` (wiadomości wysyłanych do siebie z połączonego urządzenia)

  </Tab>

  <Tab title="Polityka grup + listy dozwolonych">
    Dostęp do grup ma dwie warstwy:

    1. **Lista dozwolonych członkostwa w grupach** (`channels.whatsapp.groups`)
       - jeśli `groups` jest pominięte, kwalifikują się wszystkie grupy
       - jeśli `groups` jest obecne, działa jako lista dozwolonych grup (`"*"` dozwolone)

    2. **Polityka nadawców grupowych** (`channels.whatsapp.groupPolicy` + `groupAllowFrom`)
       - `open`: lista dozwolonych nadawców jest pomijana
       - `allowlist`: nadawca musi pasować do `groupAllowFrom` (lub `*`)
       - `disabled`: blokuje wszystkie przychodzące wiadomości grupowe

    Fallback listy dozwolonych nadawców:

    - jeśli `groupAllowFrom` nie jest ustawione, środowisko wykonawcze używa jako fallback `allowFrom`, gdy jest dostępne
    - listy dozwolonych nadawców są oceniane przed aktywacją przez wzmiankę/odpowiedź

    Uwaga: jeśli blok `channels.whatsapp` w ogóle nie istnieje, fallback polityki grup w czasie działania to `allowlist` (z logiem ostrzegawczym), nawet jeśli ustawiono `channels.defaults.groupPolicy`.

  </Tab>

  <Tab title="Wzmianki + /activation">
    Odpowiedzi grupowe domyślnie wymagają wzmianki.

    Wykrywanie wzmianek obejmuje:

    - jawne wzmianki WhatsApp o tożsamości bota
    - skonfigurowane wzorce regex wzmianek (`agents.list[].groupChat.mentionPatterns`, fallback `messages.groupChat.mentionPatterns`)
    - transkrypcje przychodzących notatek głosowych dla autoryzowanych wiadomości grupowych
    - niejawne wykrywanie odpowiedzi do bota (nadawca odpowiedzi pasuje do tożsamości bota)

    Uwaga dotycząca bezpieczeństwa:

    - cytat/odpowiedź spełnia tylko bramkę wzmianki; **nie** przyznaje autoryzacji nadawcy
    - przy `groupPolicy: "allowlist"` nadawcy spoza listy dozwolonych nadal są blokowani, nawet jeśli odpowiadają na wiadomość użytkownika z listy dozwolonych

    Polecenie aktywacji na poziomie sesji:

    - `/activation mention`
    - `/activation always`

    `activation` aktualizuje stan sesji (nie konfigurację globalną). Jest ograniczone do właściciela.

  </Tab>
</Tabs>

## Zachowanie numeru osobistego i czatu z samym sobą

Gdy połączony numer własny jest również obecny w `allowFrom`, aktywują się zabezpieczenia czatu z samym sobą WhatsApp:

- pomijanie potwierdzeń odczytu dla tur czatu z samym sobą
- ignorowanie zachowania automatycznego wyzwalania przez mention-JID, które w przeciwnym razie pingowałoby Ciebie
- jeśli `messages.responsePrefix` nie jest ustawione, odpowiedzi w czacie z samym sobą domyślnie mają postać `[{identity.name}]` lub `[openclaw]`

## Normalizacja wiadomości i kontekst

<AccordionGroup>
  <Accordion title="Koperta przychodząca + kontekst odpowiedzi">
    Przychodzące wiadomości WhatsApp są opakowywane we wspólną kopertę przychodzącą.

    Jeśli istnieje cytowana odpowiedź, kontekst jest dołączany w tej formie:

    ```text
    [Replying to <sender> id:<stanzaId>]
    <quoted body or media placeholder>
    [/Replying]
    ```

    Pola metadanych odpowiedzi są również wypełniane, gdy są dostępne (`ReplyToId`, `ReplyToBody`, `ReplyToSender`, JID/E.164 nadawcy).
    Gdy cytowany cel odpowiedzi jest mediami możliwymi do pobrania, OpenClaw zapisuje je przez
    normalny magazyn mediów przychodzących i udostępnia jako `MediaPath`/`MediaType`, aby
    agent mógł sprawdzić wskazany obraz zamiast widzieć tylko
    `<media:image>`.

  </Accordion>

  <Accordion title="Placeholdery mediów i wyodrębnianie lokalizacji/kontaktów">
    Przychodzące wiadomości zawierające tylko media są normalizowane z placeholderami takimi jak:

    - `<media:image>`
    - `<media:video>`
    - `<media:audio>`
    - `<media:document>`
    - `<media:sticker>`

    Autoryzowane grupowe notatki głosowe są transkrybowane przed bramką wzmianki, gdy
    treść to tylko `<media:audio>`, więc wypowiedzenie wzmianki bota w notatce głosowej może
    wyzwolić odpowiedź. Jeśli transkrypcja nadal nie wspomina bota,
    transkrypcja jest zachowywana w oczekującej historii grupy zamiast surowego placeholdera.

    Treści lokalizacji używają zwięzłego tekstu współrzędnych. Etykiety/komentarze lokalizacji i szczegóły kontaktu/vCard są renderowane jako ogrodzone niezaufane metadane, a nie jako tekst promptu inline.

  </Accordion>

  <Accordion title="Wstrzykiwanie oczekującej historii grupy">
    W przypadku grup nieprzetworzone wiadomości mogą być buforowane i wstrzykiwane jako kontekst, gdy bot zostanie w końcu wyzwolony.

    - domyślny limit: `50`
    - konfiguracja: `channels.whatsapp.historyLimit`
    - rezerwowo: `messages.groupChat.historyLimit`
    - `0` wyłącza

    Znaczniki wstrzyknięcia:

    - `[Chat messages since your last reply - for context]`
    - `[Current message - respond to this]`

  </Accordion>

  <Accordion title="Read receipts">
    Potwierdzenia odczytu są domyślnie włączone dla zaakceptowanych przychodzących wiadomości WhatsApp.

    Wyłącz globalnie:

    ```json5
    {
      channels: {
        whatsapp: {
          sendReadReceipts: false,
        },
      },
    }
    ```

    Nadpisanie dla konta:

    ```json5
    {
      channels: {
        whatsapp: {
          accounts: {
            work: {
              sendReadReceipts: false,
            },
          },
        },
      },
    }
    ```

    Tury czatu z samym sobą pomijają potwierdzenia odczytu nawet wtedy, gdy są globalnie włączone.

  </Accordion>
</AccordionGroup>

## Dostarczanie, dzielenie na fragmenty i multimedia

<AccordionGroup>
  <Accordion title="Text chunking">
    - domyślny limit fragmentu: `channels.whatsapp.textChunkLimit = 4000`
    - `channels.whatsapp.chunkMode = "length" | "newline"`
    - tryb `newline` preferuje granice akapitów (puste wiersze), a potem rezerwowo używa bezpiecznego dzielenia według długości

  </Accordion>

  <Accordion title="Outbound media behavior">
    - obsługuje ładunki obrazów, wideo, audio (notatki głosowej PTT) i dokumentów
    - multimedia audio są wysyłane przez ładunek Baileys `audio` z `ptt: true`, więc klienty WhatsApp renderują je jako notatkę głosową push-to-talk
    - ładunki odpowiedzi zachowują `audioAsVoice`; wyjście notatki głosowej TTS dla WhatsApp pozostaje na tej ścieżce PTT nawet wtedy, gdy dostawca zwraca MP3 lub WebM
    - natywne audio Ogg/Opus jest wysyłane jako `audio/ogg; codecs=opus` dla zgodności z notatkami głosowymi
    - audio inne niż Ogg, w tym wyjście Microsoft Edge TTS MP3/WebM, jest transkodowane za pomocą `ffmpeg` do mono Ogg/Opus 48 kHz przed dostarczeniem PTT
    - `/tts latest` wysyła najnowszą odpowiedź asystenta jako jedną notatkę głosową i blokuje ponowne wysłanie tej samej odpowiedzi; `/tts chat on|off|default` steruje automatycznym TTS dla bieżącego czatu WhatsApp
    - odtwarzanie animowanych GIF-ów jest obsługiwane przez `gifPlayback: true` przy wysyłaniu wideo
    - podpisy są stosowane do pierwszego elementu multimedialnego przy wysyłaniu ładunków odpowiedzi z wieloma multimediami, z wyjątkiem notatek głosowych PTT, które wysyłają najpierw audio, a widoczny tekst osobno, ponieważ klienty WhatsApp nie renderują podpisów notatek głosowych spójnie
    - źródłem multimediów może być HTTP(S), `file://` lub ścieżki lokalne

  </Accordion>

  <Accordion title="Media size limits and fallback behavior">
    - limit zapisu przychodzących multimediów: `channels.whatsapp.mediaMaxMb` (domyślnie `50`)
    - limit wysyłania wychodzących multimediów: `channels.whatsapp.mediaMaxMb` (domyślnie `50`)
    - nadpisania dla kont używają `channels.whatsapp.accounts.<accountId>.mediaMaxMb`
    - obrazy są automatycznie optymalizowane (zmiana rozmiaru/przegląd jakości), aby zmieścić się w limitach
    - w przypadku niepowodzenia wysyłania multimediów rezerwowe zachowanie dla pierwszego elementu wysyła ostrzeżenie tekstowe zamiast po cichu odrzucać odpowiedź

  </Accordion>
</AccordionGroup>

## Cytowanie odpowiedzi

WhatsApp obsługuje natywne cytowanie odpowiedzi, w którym odpowiedzi wychodzące widocznie cytują wiadomość przychodzącą. Steruj tym za pomocą `channels.whatsapp.replyToMode`.

| Wartość     | Zachowanie                                                            |
| ----------- | --------------------------------------------------------------------- |
| `"off"`     | Nigdy nie cytuj; wyślij jako zwykłą wiadomość                         |
| `"first"`   | Cytuj tylko pierwszy fragment odpowiedzi wychodzącej                  |
| `"all"`     | Cytuj każdy fragment odpowiedzi wychodzącej                           |
| `"batched"` | Cytuj kolejkowane odpowiedzi grupowane, pozostawiając odpowiedzi natychmiastowe bez cytatu |

Domyślnie: `"off"`. Nadpisania dla kont używają `channels.whatsapp.accounts.<id>.replyToMode`.

```json5
{
  channels: {
    whatsapp: {
      replyToMode: "first",
    },
  },
}
```

## Poziom reakcji

`channels.whatsapp.reactionLevel` steruje tym, jak szeroko agent używa reakcji emoji na WhatsApp:

| Poziom        | Reakcje potwierdzające | Reakcje inicjowane przez agenta | Opis                                             |
| ------------- | ---------------------- | ------------------------------- | ------------------------------------------------ |
| `"off"`       | Nie                    | Nie                             | Brak reakcji                                     |
| `"ack"`       | Tak                    | Nie                             | Tylko reakcje potwierdzające (potwierdzenie przed odpowiedzią) |
| `"minimal"`   | Tak                    | Tak (zachowawczo)               | Reakcje potwierdzające + reakcje agenta z zachowawczymi wskazówkami |
| `"extensive"` | Tak                    | Tak (zalecane)                  | Reakcje potwierdzające + reakcje agenta z zalecanymi wskazówkami |

Domyślnie: `"minimal"`.

Nadpisania dla kont używają `channels.whatsapp.accounts.<id>.reactionLevel`.

```json5
{
  channels: {
    whatsapp: {
      reactionLevel: "ack",
    },
  },
}
```

## Reakcje potwierdzające

WhatsApp obsługuje natychmiastowe reakcje potwierdzające po odebraniu wiadomości przychodzącej przez `channels.whatsapp.ackReaction`.
Reakcje potwierdzające są kontrolowane przez `reactionLevel` — są blokowane, gdy `reactionLevel` to `"off"`.

```json5
{
  channels: {
    whatsapp: {
      ackReaction: {
        emoji: "👀",
        direct: true,
        group: "mentions", // always | mentions | never
      },
    },
  },
}
```

Uwagi dotyczące zachowania:

- wysyłane natychmiast po zaakceptowaniu wiadomości przychodzącej (przed odpowiedzią)
- niepowodzenia są logowane, ale nie blokują normalnego dostarczania odpowiedzi
- tryb grupy `mentions` reaguje w turach wyzwolonych wzmianką; aktywacja grupy `always` działa jako obejście tego sprawdzenia
- WhatsApp używa `channels.whatsapp.ackReaction` (starsze `messages.ackReaction` nie jest tutaj używane)

## Wiele kont i dane uwierzytelniające

<AccordionGroup>
  <Accordion title="Account selection and defaults">
    - identyfikatory kont pochodzą z `channels.whatsapp.accounts`
    - domyślny wybór konta: `default`, jeśli istnieje, w przeciwnym razie pierwszy skonfigurowany identyfikator konta (posortowany)
    - identyfikatory kont są normalizowane wewnętrznie do wyszukiwania

  </Accordion>

  <Accordion title="Credential paths and legacy compatibility">
    - bieżąca ścieżka uwierzytelniania: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
    - plik kopii zapasowej: `creds.json.bak`
    - starsze domyślne uwierzytelnianie w `~/.openclaw/credentials/` jest nadal rozpoznawane/migrowane dla przepływów konta domyślnego

  </Accordion>

  <Accordion title="Logout behavior">
    `openclaw channels logout --channel whatsapp [--account <id>]` czyści stan uwierzytelniania WhatsApp dla tego konta.

    Gdy Gateway jest osiągalny, wylogowanie najpierw zatrzymuje aktywny nasłuchiwacz WhatsApp dla wybranego konta, aby połączona sesja nie odbierała dalej wiadomości aż do następnego restartu. `openclaw channels remove --channel whatsapp` również zatrzymuje aktywny nasłuchiwacz przed wyłączeniem lub usunięciem konfiguracji konta.

    W starszych katalogach uwierzytelniania `oauth.json` jest zachowywany, a pliki uwierzytelniania Baileys są usuwane.

  </Accordion>
</AccordionGroup>

## Narzędzia, akcje i zapisy konfiguracji

- Obsługa narzędzi agenta obejmuje akcję reakcji WhatsApp (`react`).
- Bramy akcji:
  - `channels.whatsapp.actions.reactions`
  - `channels.whatsapp.actions.polls`
- Zapisy konfiguracji inicjowane przez kanał są domyślnie włączone (wyłącz przez `channels.whatsapp.configWrites=false`).

## Rozwiązywanie problemów

<AccordionGroup>
  <Accordion title="Not linked (QR required)">
    Objaw: status kanału zgłasza brak połączenia.

    Naprawa:

    ```bash
    openclaw channels login --channel whatsapp
    openclaw channels status
    ```

  </Accordion>

  <Accordion title="Linked but disconnected / reconnect loop">
    Objaw: połączone konto z powtarzającymi się rozłączeniami lub próbami ponownego połączenia.

    Ciche konta mogą pozostać połączone po normalnym limicie czasu wiadomości; watchdog
    restartuje się, gdy aktywność transportu WhatsApp Web ustaje, socket zostaje zamknięty albo
    aktywność na poziomie aplikacji pozostaje cicha poza dłuższym oknem bezpieczeństwa.

    Jeśli logi pokazują powtarzające się `status=408 Request Time-out Connection was lost`, dostrój
    czasy socketu Baileys w `web.whatsapp`. Zacznij od skrócenia
    `keepAliveIntervalMs` poniżej limitu bezczynności swojej sieci i zwiększenia
    `connectTimeoutMs` na wolnych lub stratnych łączach:

    ```json5
    {
      web: {
        whatsapp: {
          keepAliveIntervalMs: 15000,
          connectTimeoutMs: 60000,
          defaultQueryTimeoutMs: 60000,
        },
      },
    }
    ```

    Naprawa:

    ```bash
    openclaw doctor
    openclaw logs --follow
    ```

    Jeśli `~/.openclaw/logs/whatsapp-health.log` mówi `Gateway inactive`, ale
    `openclaw gateway status` i `openclaw channels status --probe` pokazują, że
    gateway i WhatsApp są zdrowe, uruchom `openclaw doctor`. W systemie Linux doctor
    ostrzega o starszych wpisach crontaba, które nadal wywołują
    `~/.openclaw/bin/ensure-whatsapp.sh`; usuń te nieaktualne wpisy za pomocą
    `crontab -e`, ponieważ cron może nie mieć środowiska magistrali użytkownika systemd i
    sprawiać, że ten stary skrypt błędnie raportuje stan gateway.

    W razie potrzeby połącz ponownie za pomocą `channels login`.

  </Accordion>

  <Accordion title="QR login times out behind a proxy">
    Objaw: `openclaw channels login --channel whatsapp` kończy się niepowodzeniem przed pokazaniem użytecznego kodu QR z `status=408 Request Time-out` lub rozłączeniem socketu TLS.

    Logowanie WhatsApp Web używa standardowego środowiska proxy hosta gateway (`HTTPS_PROXY`, `HTTP_PROXY`, wariantów małymi literami i `NO_PROXY`). Sprawdź, czy proces gateway dziedziczy środowisko proxy i czy `NO_PROXY` nie pasuje do `mmg.whatsapp.net`.

  </Accordion>

  <Accordion title="No active listener when sending">
    Wysyłki wychodzące szybko kończą się niepowodzeniem, gdy dla konta docelowego nie istnieje aktywny nasłuchiwacz gateway.

    Upewnij się, że gateway działa i konto jest połączone.

  </Accordion>

  <Accordion title="Reply appears in transcript but not in WhatsApp">
    Wiersze transkrypcji rejestrują to, co wygenerował agent. Dostarczanie WhatsApp jest sprawdzane osobno: OpenClaw uznaje automatyczną odpowiedź za wysłaną dopiero po tym, jak Baileys zwróci identyfikator wiadomości wychodzącej dla co najmniej jednej widocznej wysyłki tekstu lub multimediów.

    Reakcje potwierdzające są niezależnymi potwierdzeniami przed odpowiedzią. Pomyślna reakcja nie dowodzi, że późniejsza odpowiedź tekstowa lub multimedialna została zaakceptowana przez WhatsApp.

    Sprawdź logi gateway pod kątem `auto-reply delivery failed` lub `auto-reply was not accepted by WhatsApp provider`.

  </Accordion>

  <Accordion title="Group messages unexpectedly ignored">
    Sprawdź w tej kolejności:

    - `groupPolicy`
    - `groupAllowFrom` / `allowFrom`
    - wpisy listy dozwolonych `groups`
    - bramkowanie wzmiankami (`requireMention` + wzorce wzmianek)
    - zduplikowane klucze w `openclaw.json` (JSON5): późniejsze wpisy nadpisują wcześniejsze, więc zachowaj pojedynczy `groupPolicy` na zakres

  </Accordion>

  <Accordion title="Bun runtime warning">
    Środowisko uruchomieniowe gateway WhatsApp powinno używać Node. Bun jest oznaczony jako niezgodny ze stabilną pracą gateway WhatsApp/Telegram.
  </Accordion>
</AccordionGroup>

## Prompty systemowe

WhatsApp obsługuje prompty systemowe w stylu Telegram dla grup i czatów bezpośrednich przez mapy `groups` i `direct`.

Hierarchia rozstrzygania dla wiadomości grupowych:

Efektywna mapa `groups` jest ustalana najpierw: jeśli konto definiuje własne `groups`, w pełni zastępuje główną mapę `groups` (bez głębokiego scalania). Wyszukiwanie promptu działa potem na wynikowej pojedynczej mapie:

1. **Prompt systemowy konkretnej grupy** (`groups["<groupId>"].systemPrompt`): używany, gdy wpis konkretnej grupy istnieje w mapie **i** jego klucz `systemPrompt` jest zdefiniowany. Jeśli `systemPrompt` jest pustym ciągiem (`""`), wieloznacznik jest blokowany i żaden prompt systemowy nie jest stosowany.
2. **Prompt systemowy wieloznacznika grupy** (`groups["*"].systemPrompt`): używany, gdy wpis konkretnej grupy jest całkowicie nieobecny w mapie albo gdy istnieje, ale nie definiuje klucza `systemPrompt`.

Hierarchia rozstrzygania dla wiadomości bezpośrednich:

Efektywna mapa `direct` jest ustalana najpierw: jeśli konto definiuje własne `direct`, w pełni zastępuje główną mapę `direct` (bez głębokiego scalania). Wyszukiwanie promptu działa potem na wynikowej pojedynczej mapie:

1. **Prompt systemowy specyficzny dla czatu bezpośredniego** (`direct["<peerId>"].systemPrompt`): używany, gdy konkretny wpis peera istnieje w mapie **i** jego klucz `systemPrompt` jest zdefiniowany. Jeśli `systemPrompt` jest pustym ciągiem (`""`), symbol wieloznaczny jest pomijany i żaden prompt systemowy nie jest stosowany.
2. **Prompt systemowy z symbolem wieloznacznym dla czatu bezpośredniego** (`direct["*"].systemPrompt`): używany, gdy konkretny wpis peera całkowicie nie występuje w mapie albo gdy istnieje, ale nie definiuje klucza `systemPrompt`.

<Note>
`dms` pozostaje lekkim zasobnikiem nadpisania historii dla każdego DM (`dms.<id>.historyLimit`). Nadpisania promptów znajdują się pod `direct`.
</Note>

**Różnica względem zachowania wielu kont Telegram:** W Telegram główne `groups` jest celowo pomijane dla wszystkich kont w konfiguracji wielokontowej — nawet dla kont, które nie definiują własnych `groups` — aby zapobiec odbieraniu przez bota wiadomości grupowych z grup, do których nie należy. WhatsApp nie stosuje tego zabezpieczenia: główne `groups` i główne `direct` są zawsze dziedziczone przez konta, które nie definiują nadpisania na poziomie konta, niezależnie od liczby skonfigurowanych kont. W wielokontowej konfiguracji WhatsApp, jeśli chcesz mieć prompty grupowe lub bezpośrednie zależne od konta, zdefiniuj pełną mapę jawnie pod każdym kontem zamiast polegać na domyślnych wartościach z poziomu głównego.

Ważne zachowanie:

- `channels.whatsapp.groups` jest jednocześnie mapą konfiguracji dla każdej grupy oraz listą dozwolonych grup na poziomie czatu. Na poziomie głównym albo konta `groups["*"]` oznacza „wszystkie grupy są dopuszczone” dla tego zakresu.
- Dodawaj grupowy `systemPrompt` z symbolem wieloznacznym tylko wtedy, gdy już chcesz, aby dany zakres dopuszczał wszystkie grupy. Jeśli nadal chcesz, aby kwalifikował się tylko stały zestaw identyfikatorów grup, nie używaj `groups["*"]` jako domyślnego promptu. Zamiast tego powtórz prompt w każdym jawnie dozwolonym wpisie grupy.
- Dopuszczanie grup i autoryzacja nadawców to osobne kontrole. `groups["*"]` poszerza zestaw grup, które mogą trafić do obsługi grupowej, ale samo w sobie nie autoryzuje każdego nadawcy w tych grupach. Dostęp nadawców nadal jest kontrolowany osobno przez `channels.whatsapp.groupPolicy` i `channels.whatsapp.groupAllowFrom`.
- `channels.whatsapp.direct` nie ma takiego samego efektu ubocznego dla DM. `direct["*"]` dostarcza tylko domyślną konfigurację czatu bezpośredniego po tym, jak DM został już dopuszczony przez `dmPolicy` oraz reguły `allowFrom` lub magazynu parowania.

Przykład:

```json5
{
  channels: {
    whatsapp: {
      groups: {
        // Use only if all groups should be admitted at the root scope.
        // Applies to all accounts that do not define their own groups map.
        "*": { systemPrompt: "Default prompt for all groups." },
      },
      direct: {
        // Applies to all accounts that do not define their own direct map.
        "*": { systemPrompt: "Default prompt for all direct chats." },
      },
      accounts: {
        work: {
          groups: {
            // This account defines its own groups, so root groups are fully
            // replaced. To keep a wildcard, define "*" explicitly here too.
            "120363406415684625@g.us": {
              requireMention: false,
              systemPrompt: "Focus on project management.",
            },
            // Use only if all groups should be admitted in this account.
            "*": { systemPrompt: "Default prompt for work groups." },
          },
          direct: {
            // This account defines its own direct map, so root direct entries are
            // fully replaced. To keep a wildcard, define "*" explicitly here too.
            "+15551234567": { systemPrompt: "Prompt for a specific work direct chat." },
            "*": { systemPrompt: "Default prompt for work direct chats." },
          },
        },
      },
    },
  },
}
```

## Wskaźniki dokumentacji konfiguracji

Główna dokumentacja:

- [Dokumentacja konfiguracji - WhatsApp](/pl/gateway/config-channels#whatsapp)

Najważniejsze pola WhatsApp:

- dostęp: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`
- dostarczanie: `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `sendReadReceipts`, `ackReaction`, `reactionLevel`
- wiele kont: `accounts.<id>.enabled`, `accounts.<id>.authDir`, nadpisania na poziomie konta
- operacje: `configWrites`, `debounceMs`, `web.enabled`, `web.heartbeatSeconds`, `web.reconnect.*`, `web.whatsapp.*`
- zachowanie sesji: `session.dmScope`, `historyLimit`, `dmHistoryLimit`, `dms.<id>.historyLimit`
- prompty: `groups.<id>.systemPrompt`, `groups["*"].systemPrompt`, `direct.<id>.systemPrompt`, `direct["*"].systemPrompt`

## Powiązane

- [Parowanie](/pl/channels/pairing)
- [Grupy](/pl/channels/groups)
- [Bezpieczeństwo](/pl/gateway/security)
- [Routing kanałów](/pl/channels/channel-routing)
- [Routing wieloagentowy](/pl/concepts/multi-agent)
- [Rozwiązywanie problemów](/pl/channels/troubleshooting)
