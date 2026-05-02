---
read_when:
    - Praca nad zachowaniem kanału WhatsApp/web lub trasowaniem skrzynki odbiorczej
summary: Obsługa kanału WhatsApp, kontrola dostępu, zachowanie dostarczania i operacje
title: WhatsApp
x-i18n:
    generated_at: "2026-05-02T09:44:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0a38b2338056b55364577c72b643dac28ebb0006cdc61b480555e6079fb71573
    source_path: channels/whatsapp.md
    workflow: 16
---

Status: gotowe do produkcji przez WhatsApp Web (Baileys). Gateway zarządza połączonymi sesjami.

## Instalacja (na żądanie)

- Onboarding (`openclaw onboard`) i `openclaw channels add --channel whatsapp`
  wyświetlają monit o instalację pluginu WhatsApp przy pierwszym wyborze.
- `openclaw channels login --channel whatsapp` również oferuje przepływ instalacji, gdy
  plugin nie jest jeszcze obecny.
- Kanał deweloperski + checkout git: domyślnie używa lokalnej ścieżki pluginu.
- Stable/Beta: używa pakietu npm `@openclaw/whatsapp`, gdy opublikowany jest aktualny pakiet.

Ręczna instalacja pozostaje dostępna:

```bash
openclaw plugins install @openclaw/whatsapp
```

Jeśli npm zgłasza pakiet należący do OpenClaw jako przestarzały lub brakujący, użyj
aktualnej spakowanej kompilacji OpenClaw albo lokalnego checkoutu, aż ciąg pakietów npm
nadrobi zaległości.

<CardGroup cols={3}>
  <Card title="Parowanie" icon="link" href="/pl/channels/pairing">
    Domyślna polityka DM dla nieznanych nadawców to parowanie.
  </Card>
  <Card title="Rozwiązywanie problemów z kanałami" icon="wrench" href="/pl/channels/troubleshooting">
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

    Aby podpiąć istniejący/niestandardowy katalog uwierzytelniania WhatsApp Web przed logowaniem:

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
OpenClaw zaleca uruchamianie WhatsApp na osobnym numerze, gdy to możliwe. (Metadane kanału i przepływ konfiguracji są zoptymalizowane pod taką konfigurację, ale konfiguracje z numerem osobistym też są obsługiwane).
</Note>

## Wzorce wdrożenia

<AccordionGroup>
  <Accordion title="Dedykowany numer (zalecane)">
    To najczystszy tryb operacyjny:

    - osobna tożsamość WhatsApp dla OpenClaw
    - czytelniejsze listy dozwolonych DM i granice routingu
    - mniejsze ryzyko pomylenia z czatem do samego siebie

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

  <Accordion title="Tryb awaryjny z numerem osobistym">
    Onboarding obsługuje tryb numeru osobistego i zapisuje bazową konfigurację przyjazną dla czatu z samym sobą:

    - `dmPolicy: "allowlist"`
    - `allowFrom` zawiera Twój numer osobisty
    - `selfChatMode: true`

    W czasie działania zabezpieczenia czatu z samym sobą opierają się na połączonym własnym numerze i `allowFrom`.

  </Accordion>

  <Accordion title="Zakres kanału tylko WhatsApp Web">
    Kanał platformy komunikacyjnej jest oparty na WhatsApp Web (`Baileys`) w obecnej architekturze kanałów OpenClaw.

    We wbudowanym rejestrze kanałów czatu nie ma osobnego kanału komunikacyjnego Twilio WhatsApp.

  </Accordion>
</AccordionGroup>

## Model działania

- Gateway zarządza gniazdem WhatsApp i pętlą ponownego łączenia.
- Watchdog ponownego łączenia używa aktywności transportu WhatsApp Web, a nie tylko liczby przychodzących wiadomości aplikacji, więc cicha sesja połączonego urządzenia nie jest restartowana wyłącznie dlatego, że nikt ostatnio nie wysłał wiadomości. Dłuższy limit ciszy aplikacji nadal wymusza ponowne połączenie, jeśli ramki transportowe wciąż przychodzą, ale w oknie watchdoga nie obsłużono żadnych wiadomości aplikacji; po przejściowym ponownym połączeniu dla niedawno aktywnej sesji ten test ciszy aplikacji używa zwykłego limitu czasu wiadomości dla pierwszego okna odzyskiwania.
- Czasy gniazda Baileys są jawnie dostępne pod `web.whatsapp.*`: `keepAliveIntervalMs` kontroluje pingi aplikacyjne WhatsApp Web, `connectTimeoutMs` kontroluje limit czasu otwierającego handshake, a `defaultQueryTimeoutMs` kontroluje limity czasu zapytań Baileys.
- Wysyłanie wychodzące wymaga aktywnego listenera WhatsApp dla docelowego konta.
- Czaty statusu i rozgłoszeniowe są ignorowane (`@status`, `@broadcast`).
- Watchdog ponownego łączenia śledzi aktywność transportu WhatsApp Web, a nie tylko liczbę przychodzących wiadomości aplikacji: ciche sesje połączonych urządzeń pozostają aktywne, gdy ramki transportowe nadal płyną, ale zatrzymanie transportu wymusza ponowne połączenie dużo wcześniej niż późniejsza ścieżka zdalnego rozłączenia.
- Czaty bezpośrednie używają reguł sesji DM (`session.dmScope`; domyślne `main` scala DM z główną sesją agenta).
- Sesje grupowe są izolowane (`agent:<agentId>:whatsapp:group:<jid>`).
- Transport WhatsApp Web honoruje standardowe zmienne środowiskowe proxy na hoście gateway (`HTTPS_PROXY`, `HTTP_PROXY`, `NO_PROXY` / warianty małymi literami). Preferuj konfigurację proxy na poziomie hosta zamiast ustawień proxy WhatsApp specyficznych dla kanału.
- Gdy `messages.removeAckAfterReply` jest włączone, OpenClaw czyści reakcję potwierdzenia WhatsApp po dostarczeniu widocznej odpowiedzi.

## Hooki pluginów i prywatność

Przychodzące wiadomości WhatsApp mogą zawierać osobistą treść wiadomości, numery telefonów,
identyfikatory grup, nazwy nadawców i pola korelacji sesji. Z tego powodu
WhatsApp nie rozgłasza przychodzących payloadów hooka `message_received` do pluginów,
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

Możesz ograniczyć włączenie do jednego konta:

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

Włączaj to tylko dla pluginów, którym ufasz na tyle, aby otrzymywały treść
i identyfikatory przychodzących wiadomości WhatsApp.

## Kontrola dostępu i aktywacja

<Tabs>
  <Tab title="Polityka DM">
    `channels.whatsapp.dmPolicy` kontroluje dostęp do czatu bezpośredniego:

    - `pairing` (domyślnie)
    - `allowlist`
    - `open` (wymaga, aby `allowFrom` zawierało `"*"`)
    - `disabled`

    `allowFrom` akceptuje numery w stylu E.164 (normalizowane wewnętrznie).

    Nadpisanie dla wielu kont: `channels.whatsapp.accounts.<id>.dmPolicy` (oraz `allowFrom`) ma pierwszeństwo przed domyślnymi ustawieniami na poziomie kanału dla tego konta.

    Szczegóły zachowania w czasie działania:

    - parowania są utrwalane w magazynie dozwolonych kanału i scalane ze skonfigurowanym `allowFrom`
    - zaplanowana automatyzacja i awaryjny odbiorca Heartbeat używają jawnych celów dostarczenia lub skonfigurowanego `allowFrom`; zatwierdzenia parowania DM nie są niejawnymi odbiorcami Cron ani Heartbeat
    - jeśli nie skonfigurowano listy dozwolonych, połączony własny numer jest domyślnie dozwolony
    - OpenClaw nigdy automatycznie nie paruje wychodzących DM `fromMe` (wiadomości wysyłanych do siebie z połączonego urządzenia)

  </Tab>

  <Tab title="Polityka grup + listy dozwolonych">
    Dostęp grupowy ma dwie warstwy:

    1. **Lista dozwolonych członkostwa w grupach** (`channels.whatsapp.groups`)
       - jeśli `groups` jest pominięte, kwalifikują się wszystkie grupy
       - jeśli `groups` jest obecne, działa jako lista dozwolonych grup (`"*"` dozwolone)

    2. **Polityka nadawcy grupowego** (`channels.whatsapp.groupPolicy` + `groupAllowFrom`)
       - `open`: lista dozwolonych nadawców pomijana
       - `allowlist`: nadawca musi pasować do `groupAllowFrom` (lub `*`)
       - `disabled`: blokuj wszystkie przychodzące wiadomości grupowe

    Fallback listy dozwolonych nadawców:

    - jeśli `groupAllowFrom` nie jest ustawione, runtime wraca do `allowFrom`, gdy jest dostępne
    - listy dozwolonych nadawców są oceniane przed aktywacją przez wzmiankę/odpowiedź

    Uwaga: jeśli blok `channels.whatsapp` w ogóle nie istnieje, fallback polityki grup w runtime to `allowlist` (z logiem ostrzegawczym), nawet jeśli ustawiono `channels.defaults.groupPolicy`.

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
    - przy `groupPolicy: "allowlist"` nadawcy spoza listy dozwolonych nadal są blokowani, nawet jeśli odpowiedzą na wiadomość użytkownika z listy dozwolonych

    Polecenie aktywacji na poziomie sesji:

    - `/activation mention`
    - `/activation always`

    `activation` aktualizuje stan sesji (nie globalną konfigurację). Jest ograniczone do właściciela.

  </Tab>
</Tabs>

## Numer osobisty i zachowanie czatu z samym sobą

Gdy połączony własny numer jest także obecny w `allowFrom`, aktywują się zabezpieczenia czatu z samym sobą w WhatsApp:

- pomijanie potwierdzeń odczytu dla tur czatu z samym sobą
- ignorowanie zachowania automatycznego wyzwalania przez mention-JID, które w innym przypadku pingowałoby Ciebie
- jeśli `messages.responsePrefix` nie jest ustawione, odpowiedzi w czacie z samym sobą domyślnie używają `[{identity.name}]` lub `[openclaw]`

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

    Pola metadanych odpowiedzi są także wypełniane, gdy są dostępne (`ReplyToId`, `ReplyToBody`, `ReplyToSender`, JID/E.164 nadawcy).
    Gdy docelowa cytowana odpowiedź to media do pobrania, OpenClaw zapisuje ją przez
    normalny magazyn mediów przychodzących i udostępnia jako `MediaPath`/`MediaType`, aby
    agent mógł obejrzeć wskazany obraz zamiast widzieć tylko
    `<media:image>`.

  </Accordion>

  <Accordion title="Placeholdery mediów oraz ekstrakcja lokalizacji/kontaktów">
    Przychodzące wiadomości zawierające tylko media są normalizowane z placeholderami takimi jak:

    - `<media:image>`
    - `<media:video>`
    - `<media:audio>`
    - `<media:document>`
    - `<media:sticker>`

    Autoryzowane grupowe notatki głosowe są transkrybowane przed bramkowaniem wzmianki, gdy
    treść to tylko `<media:audio>`, więc wypowiedzenie wzmianki o bocie w notatce głosowej może
    wyzwolić odpowiedź. Jeśli transkrypcja nadal nie wspomina bota,
    transkrypcja jest zachowywana w oczekującej historii grupy zamiast surowego placeholdera.

    Treści lokalizacji używają zwięzłego tekstu współrzędnych. Etykiety/komentarze lokalizacji i szczegóły kontaktu/vCard są renderowane jako ogrodzone niezaufane metadane, a nie tekst promptu inline.

  </Accordion>

  <Accordion title="Wstrzykiwanie oczekującej historii grupy">
    W grupach nieprzetworzone wiadomości mogą być buforowane i wstrzykiwane jako kontekst, gdy bot zostanie ostatecznie wyzwolony.

    - domyślny limit: `50`
    - konfiguracja: `channels.whatsapp.historyLimit`
    - fallback: `messages.groupChat.historyLimit`
    - `0` wyłącza

    Markery wstrzyknięcia:

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

    Tury czatu z samym sobą pomijają potwierdzenia odczytu nawet wtedy, gdy są globalnie włączone.

  </Accordion>
</AccordionGroup>

## Dostarczanie, dzielenie na części i media

<AccordionGroup>
  <Accordion title="Dzielenie tekstu na fragmenty">
    - domyślny limit fragmentu: `channels.whatsapp.textChunkLimit = 4000`
    - `channels.whatsapp.chunkMode = "length" | "newline"`
    - tryb `newline` preferuje granice akapitów (puste wiersze), a następnie przechodzi na dzielenie bezpieczne pod względem długości

  </Accordion>

  <Accordion title="Zachowanie mediów wychodzących">
    - obsługuje obrazy, wideo, audio (notatkę głosową PTT) oraz ładunki dokumentów
    - media audio są wysyłane przez ładunek `audio` Baileys z `ptt: true`, więc klienci WhatsApp renderują je jako notatkę głosową push-to-talk
    - ładunki odpowiedzi zachowują `audioAsVoice`; wyjście notatki głosowej TTS dla WhatsApp pozostaje na tej ścieżce PTT nawet wtedy, gdy dostawca zwraca MP3 lub WebM
    - natywne audio Ogg/Opus jest wysyłane jako `audio/ogg; codecs=opus` dla zgodności z notatkami głosowymi
    - audio inne niż Ogg, w tym wyjście MP3/WebM z Microsoft Edge TTS, jest transkodowane za pomocą `ffmpeg` do jednokanałowego Ogg/Opus 48 kHz przed dostarczeniem PTT
    - `/tts latest` wysyła najnowszą odpowiedź asystenta jako jedną notatkę głosową i pomija ponowne wysyłki tej samej odpowiedzi; `/tts chat on|off|default` steruje automatycznym TTS dla bieżącego czatu WhatsApp
    - odtwarzanie animowanych GIF-ów jest obsługiwane przez `gifPlayback: true` przy wysyłaniu wideo
    - podpisy są stosowane do pierwszego elementu multimedialnego podczas wysyłania ładunków odpowiedzi z wieloma mediami, z wyjątkiem notatek głosowych PTT, które wysyłają najpierw audio, a widoczny tekst osobno, ponieważ klienci WhatsApp nie renderują konsekwentnie podpisów notatek głosowych
    - źródłem mediów może być HTTP(S), `file://` lub ścieżki lokalne

  </Accordion>

  <Accordion title="Limity rozmiaru mediów i zachowanie awaryjne">
    - limit zapisu mediów przychodzących: `channels.whatsapp.mediaMaxMb` (domyślnie `50`)
    - limit wysyłania mediów wychodzących: `channels.whatsapp.mediaMaxMb` (domyślnie `50`)
    - nadpisania dla poszczególnych kont używają `channels.whatsapp.accounts.<accountId>.mediaMaxMb`
    - obrazy są automatycznie optymalizowane (zmiana rozmiaru/przegląd jakości), aby zmieścić się w limitach
    - przy niepowodzeniu wysyłania mediów awaryjna obsługa pierwszego elementu wysyła ostrzeżenie tekstowe zamiast po cichu porzucać odpowiedź

  </Accordion>
</AccordionGroup>

## Cytowanie odpowiedzi

WhatsApp obsługuje natywne cytowanie odpowiedzi, w którym odpowiedzi wychodzące widocznie cytują wiadomość przychodzącą. Steruj tym za pomocą `channels.whatsapp.replyToMode`.

| Wartość     | Zachowanie                                                            |
| ----------- | --------------------------------------------------------------------- |
| `"off"`     | Nigdy nie cytuj; wyślij jako zwykłą wiadomość                         |
| `"first"`   | Cytuj tylko pierwszy fragment odpowiedzi wychodzącej                  |
| `"all"`     | Cytuj każdy fragment odpowiedzi wychodzącej                           |
| `"batched"` | Cytuj kolejkowane odpowiedzi zbiorcze, pozostawiając odpowiedzi natychmiastowe bez cytatu |

Domyślnie jest `"off"`. Nadpisania dla poszczególnych kont używają `channels.whatsapp.accounts.<id>.replyToMode`.

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

`channels.whatsapp.reactionLevel` steruje tym, jak szeroko agent używa reakcji emoji w WhatsApp:

| Poziom       | Reakcje potwierdzające | Reakcje inicjowane przez agenta | Opis                                             |
| ------------- | ------------- | ------------------------- | ------------------------------------------------ |
| `"off"`       | Nie           | Nie                       | Brak jakichkolwiek reakcji                       |
| `"ack"`       | Tak           | Nie                       | Tylko reakcje potwierdzające (potwierdzenie przed odpowiedzią) |
| `"minimal"`   | Tak           | Tak (konserwatywnie)      | Potwierdzenia + reakcje agenta z konserwatywnymi wskazówkami |
| `"extensive"` | Tak           | Tak (zalecane)            | Potwierdzenia + reakcje agenta z zalecanymi wskazówkami |

Domyślnie: `"minimal"`.

Nadpisania dla poszczególnych kont używają `channels.whatsapp.accounts.<id>.reactionLevel`.

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
Reakcje potwierdzające są ograniczane przez `reactionLevel` — są pomijane, gdy `reactionLevel` ma wartość `"off"`.

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

## Wiele kont i poświadczenia

<AccordionGroup>
  <Accordion title="Wybór konta i wartości domyślne">
    - identyfikatory kont pochodzą z `channels.whatsapp.accounts`
    - domyślny wybór konta: `default`, jeśli istnieje, w przeciwnym razie pierwszy skonfigurowany identyfikator konta (posortowany)
    - identyfikatory kont są wewnętrznie normalizowane do wyszukiwania

  </Accordion>

  <Accordion title="Ścieżki poświadczeń i zgodność ze starszymi wersjami">
    - bieżąca ścieżka uwierzytelniania: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
    - plik kopii zapasowej: `creds.json.bak`
    - starsze domyślne uwierzytelnianie w `~/.openclaw/credentials/` jest nadal rozpoznawane/migrowane dla przepływów konta domyślnego

  </Accordion>

  <Accordion title="Zachowanie wylogowania">
    `openclaw channels logout --channel whatsapp [--account <id>]` czyści stan uwierzytelniania WhatsApp dla tego konta.

    Gdy Gateway jest osiągalny, wylogowanie najpierw zatrzymuje aktywny listener WhatsApp dla wybranego konta, aby połączona sesja nie odbierała dalej wiadomości aż do następnego restartu. `openclaw channels remove --channel whatsapp` również zatrzymuje aktywny listener przed wyłączeniem lub usunięciem konfiguracji konta.

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

    Naprawa:

    ```bash
    openclaw channels login --channel whatsapp
    openclaw channels status
    ```

  </Accordion>

  <Accordion title="Połączone, ale rozłączone / pętla ponownego łączenia">
    Objaw: połączone konto z powtarzającymi się rozłączeniami lub próbami ponownego połączenia.

    Ciche konta mogą pozostawać połączone po normalnym limicie czasu wiadomości; watchdog
    restartuje się, gdy aktywność transportu WhatsApp Web ustaje, gniazdo zostaje zamknięte lub
    aktywność na poziomie aplikacji pozostaje cicha poza dłuższym oknem bezpieczeństwa.

    Jeśli logi pokazują powtarzające się `status=408 Request Time-out Connection was lost`, dostrój
    czasy gniazda Baileys w `web.whatsapp`. Zacznij od skrócenia
    `keepAliveIntervalMs` poniżej limitu bezczynności Twojej sieci i zwiększenia
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

    Jeśli `~/.openclaw/logs/whatsapp-health.log` mówi `Gateway inactive`, ale
    `openclaw gateway status` i `openclaw channels status --probe` pokazują, że
    Gateway i WhatsApp są zdrowe, uruchom `openclaw doctor`. W systemie Linux doctor
    ostrzega o starszych wpisach crontab, które nadal wywołują
    `~/.openclaw/bin/ensure-whatsapp.sh`; usuń te nieaktualne wpisy za pomocą
    `crontab -e`, ponieważ cron może nie mieć środowiska magistrali użytkownika systemd i
    sprawiać, że ten stary skrypt błędnie raportuje kondycję Gateway.

    W razie potrzeby połącz ponownie za pomocą `channels login`.

  </Accordion>

  <Accordion title="Logowanie QR przekracza limit czasu za proxy">
    Objaw: `openclaw channels login --channel whatsapp` kończy się niepowodzeniem przed pokazaniem użytecznego kodu QR z `status=408 Request Time-out` lub rozłączeniem gniazda TLS.

    Logowanie WhatsApp Web używa standardowego środowiska proxy hosta Gateway (`HTTPS_PROXY`, `HTTP_PROXY`, wariantów z małych liter i `NO_PROXY`). Sprawdź, czy proces Gateway dziedziczy środowisko proxy i czy `NO_PROXY` nie pasuje do `mmg.whatsapp.net`.

  </Accordion>

  <Accordion title="Brak aktywnego listenera podczas wysyłania">
    Wysyłki wychodzące szybko kończą się niepowodzeniem, gdy dla konta docelowego nie istnieje aktywny listener Gateway.

    Upewnij się, że Gateway działa i konto jest połączone.

  </Accordion>

  <Accordion title="Odpowiedź pojawia się w transkrypcie, ale nie w WhatsApp">
    Wiersze transkryptu zapisują to, co agent wygenerował. Dostarczenie do WhatsApp jest sprawdzane osobno: OpenClaw uznaje automatyczną odpowiedź za wysłaną dopiero po tym, jak Baileys zwróci identyfikator wiadomości wychodzącej dla co najmniej jednej widocznej wysyłki tekstu lub mediów.

    Reakcje potwierdzające są niezależnymi potwierdzeniami przed odpowiedzią. Udana reakcja nie dowodzi, że późniejsza odpowiedź tekstowa lub multimedialna została zaakceptowana przez WhatsApp.

    Sprawdź logi Gateway pod kątem `auto-reply delivery failed` lub `auto-reply was not accepted by WhatsApp provider`.

  </Accordion>

  <Accordion title="Wiadomości grupowe są nieoczekiwanie ignorowane">
    Sprawdź w tej kolejności:

    - `groupPolicy`
    - `groupAllowFrom` / `allowFrom`
    - wpisy listy dozwolonych `groups`
    - bramkowanie wzmiankami (`requireMention` + wzorce wzmianek)
    - zduplikowane klucze w `openclaw.json` (JSON5): późniejsze wpisy zastępują wcześniejsze, więc utrzymuj pojedynczy `groupPolicy` dla każdego zakresu

  </Accordion>

  <Accordion title="Ostrzeżenie środowiska uruchomieniowego Bun">
    Środowisko uruchomieniowe Gateway WhatsApp powinno używać Node. Bun jest oznaczony jako niezgodny ze stabilnym działaniem Gateway WhatsApp/Telegram.
  </Accordion>
</AccordionGroup>

## Prompty systemowe

WhatsApp obsługuje prompty systemowe w stylu Telegram dla grup i czatów bezpośrednich przez mapy `groups` i `direct`.

Hierarchia rozstrzygania dla wiadomości grupowych:

Efektywna mapa `groups` jest określana najpierw: jeśli konto definiuje własne `groups`, w pełni zastępuje główną mapę `groups` (bez głębokiego scalania). Wyszukiwanie promptu działa następnie na wynikowej pojedynczej mapie:

1. **Prompt systemowy specyficzny dla grupy** (`groups["<groupId>"].systemPrompt`): używany, gdy określony wpis grupy istnieje w mapie **i** jego klucz `systemPrompt` jest zdefiniowany. Jeśli `systemPrompt` jest pustym ciągiem (`""`), wildcard jest pomijany i nie stosuje się żadnego promptu systemowego.
2. **Prompt systemowy wildcard grupy** (`groups["*"].systemPrompt`): używany, gdy określony wpis grupy jest całkowicie nieobecny w mapie albo gdy istnieje, ale nie definiuje klucza `systemPrompt`.

Hierarchia rozstrzygania dla wiadomości bezpośrednich:

Efektywna mapa `direct` jest określana najpierw: jeśli konto definiuje własne `direct`, w pełni zastępuje główną mapę `direct` (bez głębokiego scalania). Wyszukiwanie promptu działa następnie na wynikowej pojedynczej mapie:

1. **Prompt systemowy specyficzny dla wiadomości bezpośredniej** (`direct["<peerId>"].systemPrompt`): używany, gdy określony wpis rozmówcy istnieje w mapie **i** jego klucz `systemPrompt` jest zdefiniowany. Jeśli `systemPrompt` jest pustym ciągiem (`""`), wildcard jest pomijany i nie stosuje się żadnego promptu systemowego.
2. **Prompt systemowy wildcard wiadomości bezpośrednich** (`direct["*"].systemPrompt`): używany, gdy określony wpis rozmówcy jest całkowicie nieobecny w mapie albo gdy istnieje, ale nie definiuje klucza `systemPrompt`.

<Note>
`dms` pozostaje lekkim zasobnikiem nadpisań historii dla poszczególnych DM (`dms.<id>.historyLimit`). Nadpisania promptów znajdują się pod `direct`.
</Note>

**Różnica względem zachowania wielu kont w Telegram:** W Telegram root `groups` jest celowo pomijane dla wszystkich kont w konfiguracji wielu kont, nawet kont, które nie definiują własnych `groups`, aby zapobiec odbieraniu przez bota wiadomości grupowych z grup, do których nie należy. WhatsApp nie stosuje tej ochrony: root `groups` i root `direct` są zawsze dziedziczone przez konta, które nie definiują zastąpienia na poziomie konta, niezależnie od tego, ile kont jest skonfigurowanych. W konfiguracji wielu kont WhatsApp, jeśli chcesz mieć prompty grupowe lub bezpośrednie osobne dla każdego konta, zdefiniuj pełną mapę jawnie pod każdym kontem zamiast polegać na domyślnych ustawieniach z poziomu root.

Ważne zachowanie:

- `channels.whatsapp.groups` jest zarówno mapą konfiguracji dla poszczególnych grup, jak i allowlistą grup na poziomie czatu. W zakresie root albo konta `groups["*"]` oznacza „wszystkie grupy są dopuszczone” dla tego zakresu.
- Dodawaj wildcard grupy `systemPrompt` tylko wtedy, gdy już chcesz, aby dany zakres dopuszczał wszystkie grupy. Jeśli nadal chcesz, aby kwalifikował się tylko stały zestaw identyfikatorów grup, nie używaj `groups["*"]` jako domyślnego promptu. Zamiast tego powtórz prompt przy każdym jawnie dopuszczonym wpisie grupy.
- Dopuszczanie grupy i autoryzacja nadawcy to oddzielne kontrole. `groups["*"]` poszerza zestaw grup, które mogą trafić do obsługi grupowej, ale samo w sobie nie autoryzuje każdego nadawcy w tych grupach. Dostęp nadawcy nadal jest kontrolowany oddzielnie przez `channels.whatsapp.groupPolicy` i `channels.whatsapp.groupAllowFrom`.
- `channels.whatsapp.direct` nie ma takiego samego efektu ubocznego dla DM. `direct["*"]` zapewnia tylko domyślną konfigurację czatu bezpośredniego po tym, jak DM został już dopuszczony przez `dmPolicy` oraz reguły `allowFrom` lub magazynu parowania.

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

## Wskaźniki do dokumentacji konfiguracji

Główna dokumentacja:

- [Dokumentacja konfiguracji - WhatsApp](/pl/gateway/config-channels#whatsapp)

Najważniejsze pola WhatsApp:

- dostęp: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`
- dostarczanie: `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `sendReadReceipts`, `ackReaction`, `reactionLevel`
- wiele kont: `accounts.<id>.enabled`, `accounts.<id>.authDir`, zastąpienia na poziomie konta
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
