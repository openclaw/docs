---
read_when:
    - Praca nad zachowaniem kanału WhatsApp/web lub routingiem skrzynki odbiorczej
summary: Obsługa kanału WhatsApp, mechanizmy kontroli dostępu, zachowanie dostarczania i operacje
title: WhatsApp
x-i18n:
    generated_at: "2026-05-02T20:41:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: bb8afa93f0470e0454cf59e19193d8c2f204db63b428a4de579e93f01bf3ee62
    source_path: channels/whatsapp.md
    workflow: 16
---

Status: gotowe do produkcji przez WhatsApp Web (Baileys). Gateway zarządza połączonymi sesjami.

## Instalacja (na żądanie)

- Onboarding (`openclaw onboard`) oraz `openclaw channels add --channel whatsapp`
  proszą o zainstalowanie Pluginu WhatsApp przy pierwszym wybraniu go.
- `openclaw channels login --channel whatsapp` również oferuje przepływ instalacji, gdy
  Plugin nie jest jeszcze obecny.
- Kanał deweloperski + checkout git: domyślnie używa lokalnej ścieżki Pluginu.
- Stable/Beta: używa pakietu npm `@openclaw/whatsapp`, gdy aktualny pakiet
  jest opublikowany.

Instalacja ręczna pozostaje dostępna:

```bash
openclaw plugins install @openclaw/whatsapp
```

Jeśli npm zgłasza pakiet należący do OpenClaw jako przestarzały lub brakujący, użyj
aktualnej spakowanej kompilacji OpenClaw albo lokalnego checkoutu, dopóki ciąg pakietów npm
nie nadrobi zaległości.

<CardGroup cols={3}>
  <Card title="Parowanie" icon="link" href="/pl/channels/pairing">
    Domyślna zasada DM dla nieznanych nadawców to parowanie.
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
  <Step title="Skonfiguruj zasady dostępu do WhatsApp">

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

    Prośby o parowanie wygasają po 1 godzinie. Oczekujące prośby są ograniczone do 3 na kanał.

  </Step>
</Steps>

<Note>
OpenClaw zaleca uruchamianie WhatsApp na osobnym numerze, gdy to możliwe. (Metadane kanału i przepływ konfiguracji są zoptymalizowane pod taki układ, ale konfiguracje z numerem osobistym również są obsługiwane).
</Note>

## Wzorce wdrożenia

<AccordionGroup>
  <Accordion title="Dedykowany numer (zalecane)">
    To najczystszy tryb operacyjny:

    - osobna tożsamość WhatsApp dla OpenClaw
    - czytelniejsze listy dozwolonych DM i granice routingu
    - mniejsze ryzyko pomyłek związanych z czatem z samym sobą

    Minimalny wzorzec zasad:

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

  <Accordion title="Tryb awaryjny z numerem osobistym">
    Onboarding obsługuje tryb numeru osobistego i zapisuje bazową konfigurację przyjazną dla czatu z samym sobą:

    - `dmPolicy: "allowlist"`
    - `allowFrom` zawiera Twój numer osobisty
    - `selfChatMode: true`

    W czasie działania zabezpieczenia czatu z samym sobą opierają się na połączonym własnym numerze oraz `allowFrom`.

  </Accordion>

  <Accordion title="Zakres kanału tylko WhatsApp Web">
    Kanał platformy wiadomości opiera się na WhatsApp Web (`Baileys`) w obecnej architekturze kanałów OpenClaw.

    Wbudowany rejestr kanałów czatu nie zawiera osobnego kanału wiadomości Twilio WhatsApp.

  </Accordion>
</AccordionGroup>

## Model czasu działania

- Gateway zarządza gniazdem WhatsApp i pętlą ponownego łączenia.
- Watchdog ponownego łączenia używa aktywności transportu WhatsApp Web, a nie tylko wolumenu przychodzących wiadomości aplikacji, więc cicha sesja połączonego urządzenia nie jest restartowana wyłącznie dlatego, że nikt ostatnio nie wysłał wiadomości. Dłuższy limit ciszy aplikacji nadal wymusza ponowne połączenie, jeśli ramki transportowe wciąż napływają, ale żadne wiadomości aplikacji nie są obsługiwane w oknie watchdog; po przejściowym ponownym połączeniu dla niedawno aktywnej sesji ta kontrola ciszy aplikacji używa normalnego limitu czasu wiadomości w pierwszym oknie odzyskiwania.
- Czasy gniazda Baileys są jawne w `web.whatsapp.*`: `keepAliveIntervalMs` steruje pingami aplikacji WhatsApp Web, `connectTimeoutMs` steruje limitem czasu otwierającego uzgodnienia, a `defaultQueryTimeoutMs` steruje limitami czasu zapytań Baileys.
- Wysyłki wychodzące wymagają aktywnego nasłuchiwacza WhatsApp dla docelowego konta.
- Czaty statusu i emisji są ignorowane (`@status`, `@broadcast`).
- Watchdog ponownego łączenia śledzi aktywność transportu WhatsApp Web, a nie tylko wolumen przychodzących wiadomości aplikacji: ciche sesje połączonego urządzenia pozostają aktywne, gdy ramki transportowe nadal napływają, ale zatrzymanie transportu wymusza ponowne połączenie znacznie wcześniej niż późniejsza ścieżka zdalnego rozłączenia.
- Czaty bezpośrednie używają reguł sesji DM (`session.dmScope`; domyślne `main` zwija DM do głównej sesji agenta).
- Sesje grupowe są izolowane (`agent:<agentId>:whatsapp:group:<jid>`).
- Kanały/Newslettery WhatsApp mogą być jawnymi celami wychodzącymi ze swoim natywnym JID `@newsletter`. Wysyłki wychodzące newslettera używają metadanych sesji kanału (`agent:<agentId>:whatsapp:channel:<jid>`), a nie semantyki sesji DM.
- Transport WhatsApp Web honoruje standardowe zmienne środowiskowe proxy na hoście gateway (`HTTPS_PROXY`, `HTTP_PROXY`, `NO_PROXY` / warianty małymi literami). Preferuj konfigurację proxy na poziomie hosta zamiast ustawień proxy WhatsApp specyficznych dla kanału.
- Gdy `messages.removeAckAfterReply` jest włączone, OpenClaw czyści reakcję potwierdzenia WhatsApp po dostarczeniu widocznej odpowiedzi.

## Hooki Pluginu i prywatność

Wiadomości przychodzące WhatsApp mogą zawierać osobistą treść wiadomości, numery telefonów,
identyfikatory grup, nazwy nadawców oraz pola korelacji sesji. Z tego powodu
WhatsApp nie rozsyła przychodzących ładunków hooka `message_received` do pluginów,
chyba że jawnie wyrazisz na to zgodę:

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

Włączaj to tylko dla pluginów, którym ufasz w zakresie odbierania przychodzącej treści wiadomości
WhatsApp i identyfikatorów.

## Kontrola dostępu i aktywacja

<Tabs>
  <Tab title="Zasada DM">
    `channels.whatsapp.dmPolicy` kontroluje dostęp do czatu bezpośredniego:

    - `pairing` (domyślnie)
    - `allowlist`
    - `open` (wymaga, aby `allowFrom` zawierało `"*"`)
    - `disabled`

    `allowFrom` akceptuje numery w stylu E.164 (normalizowane wewnętrznie).

    `allowFrom` to lista kontroli dostępu nadawców DM. Nie ogranicza jawnych wysyłek wychodzących do JID grup WhatsApp ani JID kanałów `@newsletter`.

    Nadpisanie dla wielu kont: `channels.whatsapp.accounts.<id>.dmPolicy` (oraz `allowFrom`) ma pierwszeństwo przed domyślnymi ustawieniami na poziomie kanału dla tego konta.

    Szczegóły zachowania w czasie działania:

    - parowania są utrwalane w magazynie zezwoleń kanału i scalane ze skonfigurowanym `allowFrom`
    - zaplanowana automatyzacja i awaryjny odbiorca Heartbeat używają jawnych celów dostarczania lub skonfigurowanego `allowFrom`; zatwierdzenia parowania DM nie są niejawnymi odbiorcami cron ani Heartbeat
    - jeśli nie skonfigurowano listy dozwolonych, połączony własny numer jest domyślnie dozwolony
    - OpenClaw nigdy nie paruje automatycznie wychodzących DM `fromMe` (wiadomości wysyłanych do siebie z połączonego urządzenia)

  </Tab>

  <Tab title="Zasada grup + listy dozwolonych">
    Dostęp do grup ma dwie warstwy:

    1. **Lista dozwolonych członkostwa w grupach** (`channels.whatsapp.groups`)
       - jeśli `groups` jest pominięte, kwalifikują się wszystkie grupy
       - jeśli `groups` jest obecne, działa jako lista dozwolonych grup (`"*"` dozwolone)

    2. **Zasada nadawców grupowych** (`channels.whatsapp.groupPolicy` + `groupAllowFrom`)
       - `open`: lista dozwolonych nadawców jest pomijana
       - `allowlist`: nadawca musi pasować do `groupAllowFrom` (lub `*`)
       - `disabled`: blokuje wszystkie przychodzące wiadomości grupowe

    Awaryjne zachowanie listy dozwolonych nadawców:

    - jeśli `groupAllowFrom` nie jest ustawione, czas działania wraca do `allowFrom`, gdy jest dostępne
    - listy dozwolonych nadawców są oceniane przed aktywacją przez wzmiankę/odpowiedź

    Uwaga: jeśli blok `channels.whatsapp` w ogóle nie istnieje, awaryjną zasadą grup w czasie działania jest `allowlist` (z logiem ostrzegawczym), nawet jeśli `channels.defaults.groupPolicy` jest ustawione.

  </Tab>

  <Tab title="Wzmianki + /activation">
    Odpowiedzi grupowe domyślnie wymagają wzmianki.

    Wykrywanie wzmianek obejmuje:

    - jawne wzmianki WhatsApp o tożsamości bota
    - skonfigurowane wzorce wyrażeń regularnych wzmianek (`agents.list[].groupChat.mentionPatterns`, awaryjnie `messages.groupChat.mentionPatterns`)
    - transkrypcje przychodzących notatek głosowych dla autoryzowanych wiadomości grupowych
    - niejawne wykrywanie odpowiedzi do bota (nadawca odpowiedzi pasuje do tożsamości bota)

    Uwaga dotycząca bezpieczeństwa:

    - cytat/odpowiedź spełnia tylko bramkowanie wzmianki; **nie** przyznaje autoryzacji nadawcy
    - przy `groupPolicy: "allowlist"` nadawcy spoza listy dozwolonych nadal są blokowani, nawet jeśli odpowiadają na wiadomość użytkownika z listy dozwolonych

    Polecenie aktywacji na poziomie sesji:

    - `/activation mention`
    - `/activation always`

    `activation` aktualizuje stan sesji (nie globalną konfigurację). Jest ograniczone do właściciela.

  </Tab>
</Tabs>

## Zachowanie numeru osobistego i czatu z samym sobą

Gdy połączony własny numer jest również obecny w `allowFrom`, aktywują się zabezpieczenia czatu WhatsApp z samym sobą:

- pomijanie potwierdzeń odczytu dla tur czatu z samym sobą
- ignorowanie zachowania automatycznego wyzwalania mention-JID, które w przeciwnym razie pingowałoby Ciebie
- jeśli `messages.responsePrefix` nie jest ustawione, odpowiedzi w czacie z samym sobą domyślnie używają `[{identity.name}]` albo `[openclaw]`

## Normalizacja wiadomości i kontekst

<AccordionGroup>
  <Accordion title="Koperta przychodząca + kontekst odpowiedzi">
    Przychodzące wiadomości WhatsApp są opakowywane we wspólną kopertę przychodzącą.

    Jeśli istnieje cytowana odpowiedź, kontekst jest dołączany w tej postaci:

    ```text
    [Replying to <sender> id:<stanzaId>]
    <quoted body or media placeholder>
    [/Replying]
    ```

    Pola metadanych odpowiedzi są również wypełniane, gdy są dostępne (`ReplyToId`, `ReplyToBody`, `ReplyToSender`, JID/E.164 nadawcy).
    Gdy cytowany cel odpowiedzi to media możliwe do pobrania, OpenClaw zapisuje je przez
    normalny magazyn przychodzących mediów i udostępnia jako `MediaPath`/`MediaType`, aby
    agent mógł sprawdzić wskazany obraz zamiast widzieć tylko
    `<media:image>`.

  </Accordion>

  <Accordion title="Symbole zastępcze mediów oraz wyodrębnianie lokalizacji/kontaktów">
    Przychodzące wiadomości zawierające tylko media są normalizowane z symbolami zastępczymi takimi jak:

    - `<media:image>`
    - `<media:video>`
    - `<media:audio>`
    - `<media:document>`
    - `<media:sticker>`

    Autoryzowane grupowe notatki głosowe są transkrybowane przed bramkowaniem wzmianki, gdy
    treść to tylko `<media:audio>`, więc wypowiedzenie wzmianki o bocie w notatce głosowej może
    wyzwolić odpowiedź. Jeśli transkrypcja nadal nie wspomina bota,
    transkrypcja jest zachowywana w oczekującej historii grupy zamiast surowego symbolu zastępczego.

    Treści lokalizacji używają zwięzłego tekstu współrzędnych. Etykiety/komentarze lokalizacji oraz dane kontaktu/vCard są renderowane jako odgrodzone niezaufane metadane, a nie jako tekst promptu inline.

  </Accordion>

  <Accordion title="Wstrzykiwanie oczekującej historii grupy">
    W przypadku grup nieprzetworzone wiadomości mogą być buforowane i wstrzykiwane jako kontekst, gdy bot zostanie w końcu wyzwolony.

    - domyślny limit: `50`
    - konfiguracja: `channels.whatsapp.historyLimit`
    - awaryjnie: `messages.groupChat.historyLimit`
    - `0` wyłącza

    Markery wstrzykiwania:

    - `[Chat messages since your last reply - for context]`
    - `[Current message - respond to this]`

  </Accordion>

  <Accordion title="Potwierdzenia odczytu">
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

    Tury czatu z samym sobą pomijają potwierdzenia odczytu, nawet gdy są włączone globalnie.

  </Accordion>
</AccordionGroup>

## Dostarczanie, dzielenie na fragmenty i media

<AccordionGroup>
  <Accordion title="Dzielenie tekstu na fragmenty">
    - domyślny limit fragmentu: `channels.whatsapp.textChunkLimit = 4000`
    - `channels.whatsapp.chunkMode = "length" | "newline"`
    - tryb `newline` preferuje granice akapitów (puste wiersze), a następnie wraca do dzielenia bezpiecznego pod względem długości

  </Accordion>

  <Accordion title="Zachowanie mediów wychodzących">
    - obsługuje ładunki obrazu, wideo, audio (notatka głosowa PTT) i dokumentów
    - media audio są wysyłane przez ładunek Baileys `audio` z `ptt: true`, więc klienci WhatsApp renderują je jako notatkę głosową push-to-talk
    - ładunki odpowiedzi zachowują `audioAsVoice`; wyjście notatki głosowej TTS dla WhatsApp pozostaje na tej ścieżce PTT, nawet gdy dostawca zwraca MP3 lub WebM
    - natywne audio Ogg/Opus jest wysyłane jako `audio/ogg; codecs=opus` dla zgodności z notatkami głosowymi
    - audio inne niż Ogg, w tym wyjście Microsoft Edge TTS MP3/WebM, jest transkodowane za pomocą `ffmpeg` do mono Ogg/Opus 48 kHz przed dostarczeniem PTT
    - `/tts latest` wysyła najnowszą odpowiedź asystenta jako jedną notatkę głosową i blokuje ponowne wysłanie tej samej odpowiedzi; `/tts chat on|off|default` steruje automatycznym TTS dla bieżącego czatu WhatsApp
    - odtwarzanie animowanych GIF-ów jest obsługiwane przez `gifPlayback: true` przy wysyłaniu wideo
    - podpisy są stosowane do pierwszego elementu multimedialnego przy wysyłaniu ładunków odpowiedzi z wieloma mediami, z wyjątkiem notatek głosowych PTT, które wysyłają najpierw audio, a widoczny tekst osobno, ponieważ klienci WhatsApp nie renderują spójnie podpisów notatek głosowych
    - źródłem mediów może być HTTP(S), `file://` lub ścieżki lokalne

  </Accordion>

  <Accordion title="Limity rozmiaru mediów i zachowanie awaryjne">
    - limit zapisu mediów przychodzących: `channels.whatsapp.mediaMaxMb` (domyślnie `50`)
    - limit wysyłania mediów wychodzących: `channels.whatsapp.mediaMaxMb` (domyślnie `50`)
    - nadpisania dla kont używają `channels.whatsapp.accounts.<accountId>.mediaMaxMb`
    - obrazy są automatycznie optymalizowane (zmiana rozmiaru/przebieg jakości), aby zmieścić się w limitach
    - przy niepowodzeniu wysyłania mediów awaryjne zachowanie dla pierwszego elementu wysyła ostrzeżenie tekstowe zamiast po cichu odrzucać odpowiedź

  </Accordion>
</AccordionGroup>

## Cytowanie odpowiedzi

WhatsApp obsługuje natywne cytowanie odpowiedzi, w którym odpowiedzi wychodzące widocznie cytują wiadomość przychodzącą. Steruj tym za pomocą `channels.whatsapp.replyToMode`.

| Wartość     | Zachowanie                                                            |
| ----------- | --------------------------------------------------------------------- |
| `"off"`     | Nigdy nie cytuj; wyślij jako zwykłą wiadomość                         |
| `"first"`   | Cytuj tylko pierwszy fragment odpowiedzi wychodzącej                  |
| `"all"`     | Cytuj każdy fragment odpowiedzi wychodzącej                           |
| `"batched"` | Cytuj kolejkowane odpowiedzi wsadowe, pozostawiając natychmiastowe odpowiedzi bez cytatu |

Domyślnie jest to `"off"`. Nadpisania dla kont używają `channels.whatsapp.accounts.<id>.replyToMode`.

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

`channels.whatsapp.reactionLevel` kontroluje, jak szeroko agent używa reakcji emoji w WhatsApp:

| Poziom        | Reakcje potwierdzenia | Reakcje inicjowane przez agenta | Opis                                             |
| ------------- | --------------------- | ------------------------------- | ------------------------------------------------ |
| `"off"`       | Nie                   | Nie                             | Brak jakichkolwiek reakcji                       |
| `"ack"`       | Tak                   | Nie                             | Tylko reakcje potwierdzenia (potwierdzenie przed odpowiedzią) |
| `"minimal"`   | Tak                   | Tak (zachowawczo)               | Potwierdzenia + reakcje agenta z zachowawczymi wskazówkami |
| `"extensive"` | Tak                   | Tak (zalecane)                  | Potwierdzenia + reakcje agenta z zachęcającymi wskazówkami |

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

## Reakcje potwierdzenia

WhatsApp obsługuje natychmiastowe reakcje potwierdzenia po odebraniu wiadomości przychodzącej przez `channels.whatsapp.ackReaction`.
Reakcje potwierdzenia są ograniczane przez `reactionLevel` — są wyciszane, gdy `reactionLevel` ma wartość `"off"`.

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
- niepowodzenia są zapisywane w logach, ale nie blokują normalnego dostarczenia odpowiedzi
- tryb grupy `mentions` reaguje w turach wyzwalanych wzmianką; aktywacja grupy `always` działa jako obejście tego sprawdzenia
- WhatsApp używa `channels.whatsapp.ackReaction` (starsze `messages.ackReaction` nie jest tutaj używane)

## Wiele kont i poświadczenia

<AccordionGroup>
  <Accordion title="Wybór konta i wartości domyślne">
    - identyfikatory kont pochodzą z `channels.whatsapp.accounts`
    - domyślny wybór konta: `default`, jeśli istnieje, w przeciwnym razie pierwszy skonfigurowany identyfikator konta (posortowany)
    - identyfikatory kont są normalizowane wewnętrznie do wyszukiwania

  </Accordion>

  <Accordion title="Ścieżki poświadczeń i zgodność ze starszymi wersjami">
    - bieżąca ścieżka uwierzytelniania: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
    - plik kopii zapasowej: `creds.json.bak`
    - starsze domyślne uwierzytelnianie w `~/.openclaw/credentials/` jest nadal rozpoznawane/migrowane dla przepływów konta domyślnego

  </Accordion>

  <Accordion title="Zachowanie przy wylogowaniu">
    `openclaw channels logout --channel whatsapp [--account <id>]` czyści stan uwierzytelniania WhatsApp dla tego konta.

    Gdy Gateway jest osiągalny, wylogowanie najpierw zatrzymuje aktywny nasłuchiwacz WhatsApp dla wybranego konta, aby połączona sesja nie odbierała dalej wiadomości aż do następnego restartu. `openclaw channels remove --channel whatsapp` również zatrzymuje aktywny nasłuchiwacz przed wyłączeniem lub usunięciem konfiguracji konta.

    W starszych katalogach uwierzytelniania `oauth.json` jest zachowywany, a pliki uwierzytelniania Baileys są usuwane.

  </Accordion>
</AccordionGroup>

## Narzędzia, akcje i zapisy konfiguracji

- Obsługa narzędzi agenta obejmuje akcję reakcji WhatsApp (`react`).
- Bramki akcji:
  - `channels.whatsapp.actions.reactions`
  - `channels.whatsapp.actions.polls`
- Zapisy konfiguracji inicjowane przez kanał są domyślnie włączone (wyłącz przez `channels.whatsapp.configWrites=false`).

## Rozwiązywanie problemów

<AccordionGroup>
  <Accordion title="Niepołączone (wymagany QR)">
    Objaw: status kanału zgłasza brak połączenia.

    Rozwiązanie:

    ```bash
    openclaw channels login --channel whatsapp
    openclaw channels status
    ```

  </Accordion>

  <Accordion title="Połączone, ale rozłączone / pętla ponownego łączenia">
    Objaw: połączone konto z powtarzającymi się rozłączeniami lub próbami ponownego połączenia.

    Ciche konta mogą pozostać połączone po przekroczeniu normalnego limitu czasu wiadomości; watchdog
    restartuje się, gdy aktywność transportu WhatsApp Web ustanie, gniazdo zostanie zamknięte lub
    aktywność na poziomie aplikacji pozostaje cicha dłużej niż dłuższe okno bezpieczeństwa.

    Jeśli logi pokazują powtarzające się `status=408 Request Time-out Connection was lost`, dostrój
    czasy gniazda Baileys w `web.whatsapp`. Zacznij od skrócenia
    `keepAliveIntervalMs` poniżej limitu czasu bezczynności sieci i zwiększenia
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

    Rozwiązanie:

    ```bash
    openclaw doctor
    openclaw logs --follow
    ```

    Jeśli `~/.openclaw/logs/whatsapp-health.log` mówi `Gateway inactive`, ale
    `openclaw gateway status` i `openclaw channels status --probe` pokazują, że
    Gateway i WhatsApp są zdrowe, uruchom `openclaw doctor`. W systemie Linux doctor
    ostrzega o starszych wpisach crontab, które nadal wywołują
    `~/.openclaw/bin/ensure-whatsapp.sh`; usuń te nieaktualne wpisy za pomocą
    `crontab -e`, ponieważ cron może nie mieć środowiska magistrali użytkownika systemd i
    sprawiać, że stary skrypt błędnie raportuje stan Gateway.

    W razie potrzeby połącz ponownie za pomocą `channels login`.

  </Accordion>

  <Accordion title="Logowanie QR przekracza limit czasu za proxy">
    Objaw: `openclaw channels login --channel whatsapp` kończy się niepowodzeniem przed pokazaniem użytecznego kodu QR z `status=408 Request Time-out` lub rozłączeniem gniazda TLS.

    Logowanie WhatsApp Web używa standardowego środowiska proxy hosta Gateway (`HTTPS_PROXY`, `HTTP_PROXY`, warianty małymi literami i `NO_PROXY`). Sprawdź, czy proces Gateway dziedziczy środowisko proxy i czy `NO_PROXY` nie pasuje do `mmg.whatsapp.net`.

  </Accordion>

  <Accordion title="Brak aktywnego nasłuchiwacza podczas wysyłania">
    Wysyłanie wychodzące szybko kończy się niepowodzeniem, gdy nie istnieje aktywny nasłuchiwacz Gateway dla konta docelowego.

    Upewnij się, że Gateway działa i konto jest połączone.

  </Accordion>

  <Accordion title="Odpowiedź pojawia się w transkrypcie, ale nie w WhatsApp">
    Wiersze transkryptu rejestrują to, co wygenerował agent. Dostarczenie do WhatsApp jest sprawdzane osobno: OpenClaw uznaje automatyczną odpowiedź za wysłaną dopiero po tym, jak Baileys zwróci identyfikator wiadomości wychodzącej dla co najmniej jednego widocznego tekstu lub wysłania mediów.

    Reakcje potwierdzenia są niezależnymi potwierdzeniami przed odpowiedzią. Udana reakcja nie dowodzi, że późniejsza odpowiedź tekstowa lub multimedialna została zaakceptowana przez WhatsApp.

    Sprawdź logi Gateway pod kątem `auto-reply delivery failed` lub `auto-reply was not accepted by WhatsApp provider`.

  </Accordion>

  <Accordion title="Wiadomości grupowe są nieoczekiwanie ignorowane">
    Sprawdź w tej kolejności:

    - `groupPolicy`
    - `groupAllowFrom` / `allowFrom`
    - wpisy listy dozwolonych `groups`
    - bramkowanie wzmianką (`requireMention` + wzorce wzmianek)
    - zduplikowane klucze w `openclaw.json` (JSON5): późniejsze wpisy nadpisują wcześniejsze, więc zachowaj jeden `groupPolicy` na zakres

  </Accordion>

  <Accordion title="Ostrzeżenie środowiska uruchomieniowego Bun">
    Środowisko uruchomieniowe Gateway dla WhatsApp powinno używać Node. Bun jest oznaczony jako niezgodny ze stabilną pracą Gateway dla WhatsApp/Telegram.
  </Accordion>
</AccordionGroup>

## Prompty systemowe

WhatsApp obsługuje prompty systemowe w stylu Telegram dla grup i czatów bezpośrednich przez mapy `groups` i `direct`.

Hierarchia rozstrzygania dla wiadomości grupowych:

Efektywna mapa `groups` jest ustalana najpierw: jeśli konto definiuje własne `groups`, całkowicie zastępuje główną mapę `groups` (bez głębokiego scalania). Wyszukiwanie promptu uruchamia się następnie na wynikowej pojedynczej mapie:

1. **Prompt systemowy określonej grupy** (`groups["<groupId>"].systemPrompt`): używany, gdy konkretny wpis grupy istnieje w mapie **i** jego klucz `systemPrompt` jest zdefiniowany. Jeśli `systemPrompt` jest pustym ciągiem (`""`), symbol wieloznaczny jest wyciszany i żaden prompt systemowy nie jest stosowany.
2. **Prompt systemowy z symbolem wieloznacznym grupy** (`groups["*"].systemPrompt`): używany, gdy konkretny wpis grupy jest całkowicie nieobecny w mapie albo gdy istnieje, ale nie definiuje klucza `systemPrompt`.

Hierarchia rozstrzygania dla wiadomości bezpośrednich:

Efektywna mapa `direct` jest ustalana najpierw: jeśli konto definiuje własne `direct`, całkowicie zastępuje główną mapę `direct` (bez głębokiego scalania). Wyszukiwanie promptu uruchamia się następnie na wynikowej pojedynczej mapie:

1. **Prompt systemowy określonego kontaktu bezpośredniego** (`direct["<peerId>"].systemPrompt`): używany, gdy konkretny wpis kontaktu istnieje w mapie **i** jego klucz `systemPrompt` jest zdefiniowany. Jeśli `systemPrompt` jest pustym ciągiem (`""`), symbol wieloznaczny jest wyciszany i żaden prompt systemowy nie jest stosowany.
2. **Prompt systemowy z symbolem wieloznacznym wiadomości bezpośrednich** (`direct["*"].systemPrompt`): używany, gdy konkretny wpis kontaktu jest całkowicie nieobecny w mapie albo gdy istnieje, ale nie definiuje klucza `systemPrompt`.

<Note>
`dms` pozostaje lekkim zasobnikiem nadpisania historii dla poszczególnych DM (`dms.<id>.historyLimit`). Nadpisania promptów znajdują się w `direct`.
</Note>

**Różnica względem zachowania wielu kont w Telegram:** W Telegram główne `groups` jest celowo pomijane dla wszystkich kont w konfiguracji wielu kont — nawet kont, które nie definiują własnego `groups` — aby zapobiec odbieraniu przez bota wiadomości z grup, do których nie należy. WhatsApp nie stosuje tego zabezpieczenia: główne `groups` i główne `direct` są zawsze dziedziczone przez konta, które nie definiują nadpisania na poziomie konta, niezależnie od liczby skonfigurowanych kont. W konfiguracji wielu kont WhatsApp, jeśli chcesz mieć prompty grupowe lub bezpośrednie osobne dla każdego konta, zdefiniuj pełną mapę jawnie pod każdym kontem, zamiast polegać na domyślnych ustawieniach z poziomu głównego.

Ważne zachowanie:

- `channels.whatsapp.groups` jest jednocześnie mapą konfiguracji dla poszczególnych grup i listą dozwolonych grup na poziomie czatu. Na poziomie głównym albo konta `groups["*"]` oznacza „wszystkie grupy są dopuszczone” dla tego zakresu.
- Dodawaj wildcard grupy `systemPrompt` tylko wtedy, gdy już chcesz, aby dany zakres dopuszczał wszystkie grupy. Jeśli nadal chcesz, aby kwalifikował się tylko stały zestaw identyfikatorów grup, nie używaj `groups["*"]` jako domyślnego promptu. Zamiast tego powtórz prompt w każdym jawnie dopuszczonym wpisie grupy.
- Dopuszczanie grup i autoryzacja nadawców to osobne sprawdzenia. `groups["*"]` rozszerza zestaw grup, które mogą trafić do obsługi grup, ale samo w sobie nie autoryzuje każdego nadawcy w tych grupach. Dostęp nadawców nadal jest kontrolowany osobno przez `channels.whatsapp.groupPolicy` i `channels.whatsapp.groupAllowFrom`.
- `channels.whatsapp.direct` nie ma takiego samego efektu ubocznego dla wiadomości prywatnych. `direct["*"]` zapewnia tylko domyślną konfigurację czatu bezpośredniego po tym, jak wiadomość prywatna została już dopuszczona przez `dmPolicy` plus `allowFrom` albo reguły magazynu parowania.

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

## Odnośniki do dokumentacji konfiguracji

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
- [Routing wielu agentów](/pl/concepts/multi-agent)
- [Rozwiązywanie problemów](/pl/channels/troubleshooting)
