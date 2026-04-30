---
read_when:
    - Praca nad zachowaniem kanału WhatsApp/web lub routingiem skrzynki odbiorczej
summary: Obsługa kanału WhatsApp, mechanizmy kontroli dostępu, zachowanie dostarczania i operacje
title: WhatsApp
x-i18n:
    generated_at: "2026-04-30T09:40:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5d0268e068de0001a11a6ed87fe70df8e685d1dcc87c8142ee5b3c77d7a727f3
    source_path: channels/whatsapp.md
    workflow: 16
---

Status: gotowe do produkcji za pośrednictwem WhatsApp Web (Baileys). Gateway zarządza połączonymi sesjami.

## Instalacja (na żądanie)

- Onboarding (`openclaw onboard`) i `openclaw channels add --channel whatsapp`
  proszą o instalację Plugin WhatsApp przy pierwszym wyborze.
- `openclaw channels login --channel whatsapp` również oferuje przepływ instalacji, gdy
  Plugin nie jest jeszcze obecny.
- Kanał deweloperski + checkout git: domyślnie używa lokalnej ścieżki Plugin.
- Stable/Beta: używa pakietu npm `@openclaw/whatsapp`, gdy opublikowany jest
  aktualny pakiet.

Instalacja ręczna pozostaje dostępna:

```bash
openclaw plugins install @openclaw/whatsapp
```

Jeśli npm zgłasza pakiet należący do OpenClaw jako przestarzały lub brakujący, użyj
aktualnej spakowanej kompilacji OpenClaw albo lokalnego checkoutu, dopóki pociąg
pakietów npm nie nadrobi zaległości.

<CardGroup cols={3}>
  <Card title="Pairing" icon="link" href="/pl/channels/pairing">
    Domyślna polityka DM to parowanie dla nieznanych nadawców.
  </Card>
  <Card title="Channel troubleshooting" icon="wrench" href="/pl/channels/troubleshooting">
    Diagnostyka międzykanałowa i procedury naprawcze.
  </Card>
  <Card title="Gateway configuration" icon="settings" href="/pl/gateway/configuration">
    Pełne wzorce i przykłady konfiguracji kanałów.
  </Card>
</CardGroup>

## Szybka konfiguracja

<Steps>
  <Step title="Configure WhatsApp access policy">

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

  <Step title="Link WhatsApp (QR)">

```bash
openclaw channels login --channel whatsapp
```

    Dla określonego konta:

```bash
openclaw channels login --channel whatsapp --account work
```

    Aby podłączyć istniejący/niestandardowy katalog uwierzytelniania WhatsApp Web przed logowaniem:

```bash
openclaw channels add --channel whatsapp --account work --auth-dir /path/to/wa-auth
openclaw channels login --channel whatsapp --account work
```

  </Step>

  <Step title="Start the gateway">

```bash
openclaw gateway
```

  </Step>

  <Step title="Approve first pairing request (if using pairing mode)">

```bash
openclaw pairing list whatsapp
openclaw pairing approve whatsapp <CODE>
```

    Żądania parowania wygasają po 1 godzinie. Liczba oczekujących żądań jest ograniczona do 3 na kanał.

  </Step>
</Steps>

<Note>
OpenClaw zaleca używanie WhatsApp na osobnym numerze, gdy to możliwe. (Metadane kanału i przepływ konfiguracji są zoptymalizowane pod ten układ, ale konfiguracje z numerem osobistym również są obsługiwane).
</Note>

## Wzorce wdrożenia

<AccordionGroup>
  <Accordion title="Dedicated number (recommended)">
    To najczystszy tryb operacyjny:

    - osobna tożsamość WhatsApp dla OpenClaw
    - czytelniejsze listy dozwolonych DM i granice routingu
    - mniejsze ryzyko nieporozumień związanych z czatem z samym sobą

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

  <Accordion title="Personal-number fallback">
    Onboarding obsługuje tryb numeru osobistego i zapisuje bazową konfigurację przyjazną dla czatu z samym sobą:

    - `dmPolicy: "allowlist"`
    - `allowFrom` zawiera Twój numer osobisty
    - `selfChatMode: true`

    W czasie działania zabezpieczenia czatu z samym sobą opierają się na połączonym własnym numerze i `allowFrom`.

  </Accordion>

  <Accordion title="WhatsApp Web-only channel scope">
    Kanał platformy wiadomości w obecnej architekturze kanałów OpenClaw jest oparty na WhatsApp Web (`Baileys`).

    We wbudowanym rejestrze kanałów czatu nie ma osobnego kanału wiadomości Twilio WhatsApp.

  </Accordion>
</AccordionGroup>

## Model uruchomieniowy

- Gateway jest właścicielem gniazda WhatsApp i pętli ponownego łączenia.
- Watchdog ponownego łączenia używa aktywności transportu WhatsApp Web, a nie tylko liczby przychodzących wiadomości aplikacyjnych, więc cicha sesja połączonego urządzenia nie jest restartowana wyłącznie dlatego, że ostatnio nikt nie wysłał wiadomości. Dłuższy limit ciszy aplikacji nadal wymusza ponowne połączenie, jeśli ramki transportu wciąż przychodzą, ale w oknie watchdoga nie obsłużono żadnych wiadomości aplikacyjnych; po przejściowym ponownym połączeniu dla niedawno aktywnej sesji ten test ciszy aplikacji używa normalnego limitu czasu wiadomości w pierwszym oknie odzyskiwania.
- Czasy gniazda Baileys są jawne pod `web.whatsapp.*`: `keepAliveIntervalMs` kontroluje pingi aplikacyjne WhatsApp Web, `connectTimeoutMs` kontroluje limit czasu początkowego uzgadniania, a `defaultQueryTimeoutMs` kontroluje limity czasu zapytań Baileys.
- Wysyłanie wychodzące wymaga aktywnego nasłuchiwacza WhatsApp dla konta docelowego.
- Czaty statusowe i broadcast są ignorowane (`@status`, `@broadcast`).
- Watchdog ponownego łączenia śledzi aktywność transportu WhatsApp Web, a nie tylko liczbę przychodzących wiadomości aplikacyjnych: ciche sesje połączonych urządzeń pozostają aktywne, dopóki ramki transportu nadal napływają, ale zastój transportu wymusza ponowne połączenie znacznie wcześniej niż późniejsza ścieżka zdalnego rozłączenia.
- Czaty bezpośrednie używają reguł sesji DM (`session.dmScope`; domyślne `main` zwija DM do głównej sesji agenta).
- Sesje grupowe są izolowane (`agent:<agentId>:whatsapp:group:<jid>`).
- Transport WhatsApp Web respektuje standardowe zmienne środowiskowe proxy na hoście Gateway (`HTTPS_PROXY`, `HTTP_PROXY`, `NO_PROXY` / warianty małymi literami). Preferuj konfigurację proxy na poziomie hosta zamiast ustawień proxy WhatsApp specyficznych dla kanału.
- Gdy włączone jest `messages.removeAckAfterReply`, OpenClaw czyści reakcję potwierdzenia WhatsApp po dostarczeniu widocznej odpowiedzi.

## Hooki Plugin i prywatność

Przychodzące wiadomości WhatsApp mogą zawierać osobistą treść wiadomości, numery telefonów,
identyfikatory grup, nazwy nadawców i pola korelacji sesji. Z tego powodu
WhatsApp nie rozsyła przychodzących ładunków hooka `message_received` do plugins,
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

Włączaj to tylko dla plugins, którym ufasz w zakresie odbierania treści i identyfikatorów
przychodzących wiadomości WhatsApp.

## Kontrola dostępu i aktywacja

<Tabs>
  <Tab title="DM policy">
    `channels.whatsapp.dmPolicy` kontroluje dostęp do czatu bezpośredniego:

    - `pairing` (domyślnie)
    - `allowlist`
    - `open` (wymaga, aby `allowFrom` zawierało `"*"`)
    - `disabled`

    `allowFrom` akceptuje numery w stylu E.164 (normalizowane wewnętrznie).

    Nadpisanie dla wielu kont: `channels.whatsapp.accounts.<id>.dmPolicy` (oraz `allowFrom`) ma pierwszeństwo przed domyślnymi ustawieniami na poziomie kanału dla tego konta.

    Szczegóły zachowania w czasie działania:

    - parowania są utrwalane w magazynie zezwoleń kanału i scalane ze skonfigurowanym `allowFrom`
    - jeśli nie skonfigurowano listy dozwolonych, połączony własny numer jest domyślnie dozwolony
    - OpenClaw nigdy automatycznie nie paruje wychodzących DM `fromMe` (wiadomości wysyłanych do siebie z połączonego urządzenia)

  </Tab>

  <Tab title="Group policy + allowlists">
    Dostęp do grup ma dwie warstwy:

    1. **Lista dozwolonych członkostwa w grupach** (`channels.whatsapp.groups`)
       - jeśli `groups` jest pominięte, kwalifikują się wszystkie grupy
       - jeśli `groups` jest obecne, działa jako lista dozwolonych grup (`"*"` dozwolone)

    2. **Polityka nadawców grupowych** (`channels.whatsapp.groupPolicy` + `groupAllowFrom`)
       - `open`: lista dozwolonych nadawców pomijana
       - `allowlist`: nadawca musi pasować do `groupAllowFrom` (lub `*`)
       - `disabled`: blokuj wszystkie przychodzące wiadomości grupowe

    Rezerwowa lista dozwolonych nadawców:

    - jeśli `groupAllowFrom` nie jest ustawione, runtime wraca do `allowFrom`, gdy jest dostępne
    - listy dozwolonych nadawców są oceniane przed aktywacją przez wzmiankę/odpowiedź

    Uwaga: jeśli w ogóle nie istnieje blok `channels.whatsapp`, rezerwową polityką grup w runtime jest `allowlist` (z logiem ostrzegawczym), nawet jeśli ustawiono `channels.defaults.groupPolicy`.

  </Tab>

  <Tab title="Mentions + /activation">
    Odpowiedzi grupowe domyślnie wymagają wzmianki.

    Wykrywanie wzmianki obejmuje:

    - jawne wzmianki WhatsApp o tożsamości bota
    - skonfigurowane wzorce regex wzmianek (`agents.list[].groupChat.mentionPatterns`, rezerwowo `messages.groupChat.mentionPatterns`)
    - transkrypcje przychodzących notatek głosowych dla autoryzowanych wiadomości grupowych
    - niejawne wykrywanie odpowiedzi do bota (nadawca odpowiedzi pasuje do tożsamości bota)

    Uwaga dotycząca bezpieczeństwa:

    - cytat/odpowiedź spełnia tylko bramkę wzmianki; **nie** przyznaje autoryzacji nadawcy
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
- ignorowanie zachowania automatycznego wyzwalania przez mention-JID, które w przeciwnym razie pingowałoby Ciebie
- jeśli `messages.responsePrefix` nie jest ustawione, odpowiedzi w czacie z samym sobą domyślnie używają `[{identity.name}]` albo `[openclaw]`

## Normalizacja wiadomości i kontekst

<AccordionGroup>
  <Accordion title="Inbound envelope + reply context">
    Przychodzące wiadomości WhatsApp są opakowywane we wspólną kopertę przychodzącą.

    Jeśli istnieje cytowana odpowiedź, kontekst jest dołączany w tej formie:

    ```text
    [Replying to <sender> id:<stanzaId>]
    <quoted body or media placeholder>
    [/Replying]
    ```

    Pola metadanych odpowiedzi są również wypełniane, gdy są dostępne (`ReplyToId`, `ReplyToBody`, `ReplyToSender`, JID/E.164 nadawcy).

  </Accordion>

  <Accordion title="Media placeholders and location/contact extraction">
    Przychodzące wiadomości zawierające wyłącznie media są normalizowane z użyciem symboli zastępczych, takich jak:

    - `<media:image>`
    - `<media:video>`
    - `<media:audio>`
    - `<media:document>`
    - `<media:sticker>`

    Autoryzowane grupowe notatki głosowe są transkrybowane przed bramką wzmianki, gdy
    treść to tylko `<media:audio>`, więc wypowiedzenie wzmianki o bocie w notatce głosowej może
    wyzwolić odpowiedź. Jeśli transkrypcja nadal nie wspomina bota, zostaje
    zachowana w oczekującej historii grupy zamiast surowego symbolu zastępczego.

    Treści lokalizacji używają zwięzłego tekstu współrzędnych. Etykiety/komentarze lokalizacji i szczegóły kontaktu/vCard są renderowane jako odgrodzone niezaufane metadane, a nie jako tekst promptu w linii.

  </Accordion>

  <Accordion title="Pending group history injection">
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

## Dostarczanie, dzielenie na fragmenty i media

<AccordionGroup>
  <Accordion title="Text chunking">
    - domyślny limit fragmentu: `channels.whatsapp.textChunkLimit = 4000`
    - `channels.whatsapp.chunkMode = "length" | "newline"`
    - tryb `newline` preferuje granice akapitów (puste wiersze), a następnie wraca do dzielenia bezpiecznego pod względem długości

  </Accordion>

  <Accordion title="Zachowanie mediów wychodzących">
    - obsługuje obrazy, wideo, audio (notatkę głosową PTT) i ładunki dokumentów
    - media audio są wysyłane przez ładunek Baileys `audio` z `ptt: true`, dzięki czemu klienci WhatsApp renderują je jako notatkę głosową push-to-talk
    - ładunki odpowiedzi zachowują `audioAsVoice`; wyjście notatki głosowej TTS dla WhatsApp pozostaje na tej ścieżce PTT nawet wtedy, gdy dostawca zwraca MP3 lub WebM
    - natywne audio Ogg/Opus jest wysyłane jako `audio/ogg; codecs=opus` dla zgodności z notatkami głosowymi
    - audio inne niż Ogg, w tym wyjście TTS MP3/WebM z Microsoft Edge, jest transkodowane za pomocą `ffmpeg` do mono Ogg/Opus 48 kHz przed dostarczeniem PTT
    - `/tts latest` wysyła najnowszą odpowiedź asystenta jako jedną notatkę głosową i blokuje ponowne wysyłanie tej samej odpowiedzi; `/tts chat on|off|default` kontroluje automatyczne TTS dla bieżącego czatu WhatsApp
    - odtwarzanie animowanych GIF-ów jest obsługiwane przez `gifPlayback: true` przy wysyłaniu wideo
    - podpisy są stosowane do pierwszego elementu mediów podczas wysyłania ładunków odpowiedzi z wieloma mediami, z wyjątkiem notatek głosowych PTT, które wysyłają najpierw audio, a widoczny tekst osobno, ponieważ klienci WhatsApp nie renderują konsekwentnie podpisów notatek głosowych
    - źródłem mediów może być HTTP(S), `file://` lub ścieżki lokalne

  </Accordion>

  <Accordion title="Limity rozmiaru mediów i zachowanie awaryjne">
    - limit zapisu mediów przychodzących: `channels.whatsapp.mediaMaxMb` (domyślnie `50`)
    - limit wysyłania mediów wychodzących: `channels.whatsapp.mediaMaxMb` (domyślnie `50`)
    - nadpisania dla kont używają `channels.whatsapp.accounts.<accountId>.mediaMaxMb`
    - obrazy są automatycznie optymalizowane (zmiana rozmiaru/przegląd jakości), aby mieściły się w limitach
    - po niepowodzeniu wysyłki mediów awaryjne zachowanie pierwszego elementu wysyła ostrzeżenie tekstowe zamiast po cichu porzucać odpowiedź

  </Accordion>
</AccordionGroup>

## Cytowanie odpowiedzi

WhatsApp obsługuje natywne cytowanie odpowiedzi, w którym odpowiedzi wychodzące widocznie cytują wiadomość przychodzącą. Kontroluj je za pomocą `channels.whatsapp.replyToMode`.

| Wartość     | Zachowanie                                                           |
| ----------- | -------------------------------------------------------------------- |
| `"off"`     | Nigdy nie cytuj; wyślij jako zwykłą wiadomość                        |
| `"first"`   | Cytuj tylko pierwszy fragment odpowiedzi wychodzącej                 |
| `"all"`     | Cytuj każdy fragment odpowiedzi wychodzącej                          |
| `"batched"` | Cytuj kolejkowane odpowiedzi zbiorcze, pozostawiając natychmiastowe odpowiedzi bez cytowania |

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

| Poziom        | Reakcje potwierdzenia | Reakcje inicjowane przez agenta | Opis                                                       |
| ------------- | --------------------- | ------------------------------- | ---------------------------------------------------------- |
| `"off"`       | Nie                   | Nie                             | Brak jakichkolwiek reakcji                                 |
| `"ack"`       | Tak                   | Nie                             | Tylko reakcje potwierdzenia (potwierdzenie przed odpowiedzią) |
| `"minimal"`   | Tak                   | Tak (ostrożnie)                 | Potwierdzenia + reakcje agenta z ostrożnymi wskazówkami    |
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

WhatsApp obsługuje natychmiastowe reakcje potwierdzenia przy odbiorze wiadomości przychodzącej za pomocą `channels.whatsapp.ackReaction`.
Reakcje potwierdzenia są ograniczane przez `reactionLevel` — są wyłączane, gdy `reactionLevel` ma wartość `"off"`.

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
- błędy są rejestrowane, ale nie blokują normalnego dostarczenia odpowiedzi
- tryb grupy `mentions` reaguje w turach wywołanych wzmianką; aktywacja grupy `always` działa jako obejście tego sprawdzenia
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

  <Accordion title="Zachowanie wylogowania">
    `openclaw channels logout --channel whatsapp [--account <id>]` czyści stan uwierzytelniania WhatsApp dla tego konta.

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
  <Accordion title="Nie połączono (wymagany kod QR)">
    Objaw: status kanału zgłasza brak połączenia.

    Naprawa:

    ```bash
    openclaw channels login --channel whatsapp
    openclaw channels status
    ```

  </Accordion>

  <Accordion title="Połączono, ale rozłączono / pętla ponownego łączenia">
    Objaw: połączone konto z powtarzającymi się rozłączeniami lub próbami ponownego połączenia.

    Ciche konta mogą pozostać połączone po przekroczeniu normalnego limitu czasu wiadomości; watchdog
    uruchamia ponownie, gdy aktywność transportu WhatsApp Web ustaje, gniazdo zostaje zamknięte lub
    aktywność na poziomie aplikacji pozostaje cicha dłużej niż dłuższe okno bezpieczeństwa.

    Jeśli logi pokazują powtarzające się `status=408 Request Time-out Connection was lost`, dostrój
    czasy gniazda Baileys w `web.whatsapp`. Zacznij od skrócenia
    `keepAliveIntervalMs` poniżej limitu bezczynności swojej sieci i zwiększenia
    `connectTimeoutMs` na wolnych lub zawodnych łączach:

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

    W razie potrzeby połącz ponownie za pomocą `channels login`.

  </Accordion>

  <Accordion title="Logowanie QR wygasa za proxy">
    Objaw: `openclaw channels login --channel whatsapp` kończy się niepowodzeniem przed pokazaniem użytecznego kodu QR z `status=408 Request Time-out` albo rozłączeniem gniazda TLS.

    Logowanie WhatsApp Web używa standardowego środowiska proxy hosta gateway (`HTTPS_PROXY`, `HTTP_PROXY`, warianty pisane małymi literami i `NO_PROXY`). Sprawdź, czy proces gateway dziedziczy środowisko proxy i czy `NO_PROXY` nie pasuje do `mmg.whatsapp.net`.

  </Accordion>

  <Accordion title="Brak aktywnego nasłuchiwania podczas wysyłania">
    Wysyłki wychodzące szybko kończą się niepowodzeniem, gdy nie istnieje aktywne nasłuchiwanie gateway dla docelowego konta.

    Upewnij się, że gateway działa i konto jest połączone.

  </Accordion>

  <Accordion title="Odpowiedź pojawia się w transkrypcie, ale nie w WhatsApp">
    Wiersze transkryptu zapisują to, co wygenerował agent. Dostarczanie do WhatsApp jest sprawdzane osobno: OpenClaw uznaje automatyczną odpowiedź za wysłaną dopiero po tym, jak Baileys zwróci identyfikator wiadomości wychodzącej dla co najmniej jednej widocznej wysyłki tekstu lub mediów.

    Reakcje potwierdzenia są niezależnymi potwierdzeniami przed odpowiedzią. Udana reakcja nie dowodzi, że późniejsza odpowiedź tekstowa lub medialna została zaakceptowana przez WhatsApp.

    Sprawdź logi gateway pod kątem `auto-reply delivery failed` lub `auto-reply was not accepted by WhatsApp provider`.

  </Accordion>

  <Accordion title="Wiadomości grupowe są nieoczekiwanie ignorowane">
    Sprawdź w tej kolejności:

    - `groupPolicy`
    - `groupAllowFrom` / `allowFrom`
    - wpisy listy dozwolonych `groups`
    - bramkowanie wzmianek (`requireMention` + wzorce wzmianek)
    - zduplikowane klucze w `openclaw.json` (JSON5): późniejsze wpisy nadpisują wcześniejsze, więc zachowaj pojedyncze `groupPolicy` dla każdego zakresu

  </Accordion>

  <Accordion title="Ostrzeżenie środowiska uruchomieniowego Bun">
    Środowisko uruchomieniowe gateway WhatsApp powinno używać Node. Bun jest oznaczony jako niezgodny ze stabilnym działaniem gateway WhatsApp/Telegram.
  </Accordion>
</AccordionGroup>

## Prompty systemowe

WhatsApp obsługuje prompty systemowe w stylu Telegram dla grup i czatów bezpośrednich za pomocą map `groups` i `direct`.

Hierarchia rozwiązywania dla wiadomości grupowych:

Efektywna mapa `groups` jest ustalana najpierw: jeśli konto definiuje własne `groups`, całkowicie zastępuje ona główną mapę `groups` (bez głębokiego scalania). Wyszukiwanie promptu działa następnie na wynikowej pojedynczej mapie:

1. **Prompt systemowy specyficzny dla grupy** (`groups["<groupId>"].systemPrompt`): używany, gdy konkretny wpis grupy istnieje w mapie **i** jego klucz `systemPrompt` jest zdefiniowany. Jeśli `systemPrompt` jest pustym ciągiem (`""`), wildcard jest wyłączany i nie jest stosowany żaden prompt systemowy.
2. **Prompt systemowy wildcard dla grup** (`groups["*"].systemPrompt`): używany, gdy konkretny wpis grupy jest całkowicie nieobecny w mapie albo gdy istnieje, ale nie definiuje klucza `systemPrompt`.

Hierarchia rozwiązywania dla wiadomości bezpośrednich:

Efektywna mapa `direct` jest ustalana najpierw: jeśli konto definiuje własne `direct`, całkowicie zastępuje ona główną mapę `direct` (bez głębokiego scalania). Wyszukiwanie promptu działa następnie na wynikowej pojedynczej mapie:

1. **Prompt systemowy specyficzny dla wiadomości bezpośredniej** (`direct["<peerId>"].systemPrompt`): używany, gdy konkretny wpis peera istnieje w mapie **i** jego klucz `systemPrompt` jest zdefiniowany. Jeśli `systemPrompt` jest pustym ciągiem (`""`), wildcard jest wyłączany i nie jest stosowany żaden prompt systemowy.
2. **Prompt systemowy wildcard dla wiadomości bezpośrednich** (`direct["*"].systemPrompt`): używany, gdy konkretny wpis peera jest całkowicie nieobecny w mapie albo gdy istnieje, ale nie definiuje klucza `systemPrompt`.

<Note>
`dms` pozostaje lekkim kubełkiem nadpisania historii dla poszczególnych DM (`dms.<id>.historyLimit`). Nadpisania promptów znajdują się pod `direct`.
</Note>

**Różnica względem zachowania Telegram z wieloma kontami:** W Telegram główne `groups` jest celowo wyłączane dla wszystkich kont w konfiguracji wielokontowej — nawet kont, które nie definiują własnych `groups` — aby zapobiec odbieraniu przez bota wiadomości grupowych dla grup, do których nie należy. WhatsApp nie stosuje tego zabezpieczenia: główne `groups` i główne `direct` są zawsze dziedziczone przez konta, które nie definiują nadpisania na poziomie konta, niezależnie od liczby skonfigurowanych kont. W konfiguracji wielokontowej WhatsApp, jeśli chcesz mieć prompty grupowe lub bezpośrednie dla poszczególnych kont, zdefiniuj pełną mapę jawnie pod każdym kontem zamiast polegać na domyślnych ustawieniach z poziomu głównego.

Ważne zachowanie:

- `channels.whatsapp.groups` jest zarówno mapą konfiguracji dla poszczególnych grup, jak i listą dozwolonych grup na poziomie czatu. W zakresie głównym albo zakresie konta `groups["*"]` oznacza „wszystkie grupy są dopuszczone” dla tego zakresu.
- Dodawaj grupę z symbolem wieloznacznym `systemPrompt` tylko wtedy, gdy już chcesz, aby ten zakres dopuszczał wszystkie grupy. Jeśli nadal chcesz, aby kwalifikował się tylko stały zestaw identyfikatorów grup, nie używaj `groups["*"]` jako domyślnej wartości promptu. Zamiast tego powtórz prompt w każdej jawnie dozwolonej pozycji grupy.
- Dopuszczenie grupy i autoryzacja nadawcy to osobne kontrole. `groups["*"]` rozszerza zestaw grup, które mogą trafić do obsługi grup, ale samo w sobie nie autoryzuje każdego nadawcy w tych grupach. Dostęp nadawcy jest nadal kontrolowany osobno przez `channels.whatsapp.groupPolicy` i `channels.whatsapp.groupAllowFrom`.
- `channels.whatsapp.direct` nie ma tego samego efektu ubocznego dla wiadomości prywatnych. `direct["*"]` zapewnia tylko domyślną konfigurację czatu bezpośredniego po tym, jak wiadomość prywatna została już dopuszczona przez `dmPolicy` oraz `allowFrom` albo reguły magazynu parowania.

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
- [Routing wielu agentów](/pl/concepts/multi-agent)
- [Rozwiązywanie problemów](/pl/channels/troubleshooting)
