---
read_when:
    - Praca nad zachowaniem kanału WhatsApp/web lub routingiem skrzynki odbiorczej
summary: Obsługa kanału WhatsApp, kontrola dostępu, sposób dostarczania i operacje
title: WhatsApp
x-i18n:
    generated_at: "2026-05-02T22:16:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: ffe2fce121dd1230fbcf20d55ec3855beb22c39f80b926eed41bf56183178ab2
    source_path: channels/whatsapp.md
    workflow: 16
---

Status: gotowe do użycia produkcyjnego przez WhatsApp Web (Baileys). Gateway zarządza połączonymi sesjami.

## Instalacja (na żądanie)

- Onboarding (`openclaw onboard`) i `openclaw channels add --channel whatsapp`
  proszą o zainstalowanie Pluginu WhatsApp przy pierwszym wyborze.
- `openclaw channels login --channel whatsapp` również proponuje przepływ instalacji, gdy
  Plugin nie jest jeszcze obecny.
- Kanał deweloperski + checkout git: domyślnie używa lokalnej ścieżki Pluginu.
- Stable/Beta: używa pakietu npm `@openclaw/whatsapp` na bieżącym oficjalnym
  tagu wydania.

Instalacja ręczna pozostaje dostępna:

```bash
openclaw plugins install @openclaw/whatsapp
```

Użyj samego pakietu, aby śledzić bieżący oficjalny tag wydania. Przypnij dokładną
wersję tylko wtedy, gdy potrzebujesz powtarzalnej instalacji.

<CardGroup cols={3}>
  <Card title="Parowanie" icon="link" href="/pl/channels/pairing">
    Domyślna zasada DM to parowanie dla nieznanych nadawców.
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

    Aby dołączyć istniejący/niestandardowy katalog autoryzacji WhatsApp Web przed logowaniem:

```bash
openclaw channels add --channel whatsapp --account work --auth-dir /path/to/wa-auth
openclaw channels login --channel whatsapp --account work
```

  </Step>

  <Step title="Uruchom Gateway">

```bash
openclaw gateway
```

  </Step>

  <Step title="Zatwierdź pierwsze żądanie parowania (jeśli używasz trybu parowania)">

```bash
openclaw pairing list whatsapp
openclaw pairing approve whatsapp <CODE>
```

    Żądania parowania wygasają po 1 godzinie. Liczba oczekujących żądań jest ograniczona do 3 na kanał.

  </Step>
</Steps>

<Note>
OpenClaw zaleca uruchamianie WhatsApp na osobnym numerze, gdy jest to możliwe. (Metadane kanału i przepływ konfiguracji są zoptymalizowane pod taki układ, ale konfiguracje z numerem osobistym również są obsługiwane.)
</Note>

## Wzorce wdrożenia

<AccordionGroup>
  <Accordion title="Dedykowany numer (zalecane)">
    To najczystszy tryb operacyjny:

    - osobna tożsamość WhatsApp dla OpenClaw
    - czytelniejsze listy dozwolonych DM i granice routingu
    - mniejsze ryzyko pomyłek w czacie z samym sobą

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

    W czasie działania zabezpieczenia czatu z samym sobą opierają się na połączonym własnym numerze i `allowFrom`.

  </Accordion>

  <Accordion title="Zakres kanału tylko WhatsApp Web">
    Kanał platformy komunikacyjnej jest oparty na WhatsApp Web (`Baileys`) w bieżącej architekturze kanałów OpenClaw.

    W wbudowanym rejestrze kanałów czatu nie ma osobnego kanału wiadomości Twilio WhatsApp.

  </Accordion>
</AccordionGroup>

## Model czasu działania

- Gateway zarządza gniazdem WhatsApp i pętlą ponownego łączenia.
- Watchdog ponownego łączenia używa aktywności transportu WhatsApp Web, a nie tylko liczby przychodzących wiadomości aplikacji, więc cicha sesja połączonego urządzenia nie jest restartowana wyłącznie dlatego, że nikt ostatnio nie wysłał wiadomości. Dłuższy limit ciszy aplikacji nadal wymusza ponowne połączenie, jeśli ramki transportu nadal przychodzą, ale żadne wiadomości aplikacji nie są obsługiwane w oknie watchdoga; po przejściowym ponownym połączeniu niedawno aktywnej sesji ta kontrola ciszy aplikacji używa normalnego limitu czasu wiadomości w pierwszym oknie odzyskiwania.
- Czasy gniazda Baileys są jawne w `web.whatsapp.*`: `keepAliveIntervalMs` kontroluje pingi aplikacji WhatsApp Web, `connectTimeoutMs` kontroluje limit czasu otwierającego handshake, a `defaultQueryTimeoutMs` kontroluje limity czasu zapytań Baileys.
- Wysyłki wychodzące wymagają aktywnego listenera WhatsApp dla konta docelowego.
- Czaty statusu i rozgłoszeniowe są ignorowane (`@status`, `@broadcast`).
- Watchdog ponownego łączenia śledzi aktywność transportu WhatsApp Web, a nie tylko liczbę przychodzących wiadomości aplikacji: ciche sesje połączonych urządzeń pozostają aktywne, gdy ramki transportu nadal przychodzą, ale zastój transportu wymusza ponowne połączenie znacznie wcześniej niż późniejsza ścieżka zdalnego rozłączenia.
- Czaty bezpośrednie używają reguł sesji DM (`session.dmScope`; domyślne `main` zwija DM do głównej sesji agenta).
- Sesje grupowe są izolowane (`agent:<agentId>:whatsapp:group:<jid>`).
- Kanały/Newslettery WhatsApp mogą być jawnymi celami wychodzącymi ze swoim natywnym JID `@newsletter`. Wychodzące wysyłki newsletterów używają metadanych sesji kanału (`agent:<agentId>:whatsapp:channel:<jid>`) zamiast semantyki sesji DM.
- Transport WhatsApp Web respektuje standardowe zmienne środowiskowe proxy na hoście Gateway (`HTTPS_PROXY`, `HTTP_PROXY`, `NO_PROXY` / warianty małymi literami). Preferuj konfigurację proxy na poziomie hosta zamiast ustawień proxy WhatsApp specyficznych dla kanału.
- Gdy `messages.removeAckAfterReply` jest włączone, OpenClaw czyści reakcję potwierdzenia WhatsApp po dostarczeniu widocznej odpowiedzi.

## Hooki Pluginów i prywatność

Wiadomości przychodzące WhatsApp mogą zawierać treść wiadomości osobistych, numery telefonów,
identyfikatory grup, nazwy nadawców i pola korelacji sesji. Z tego powodu
WhatsApp nie rozgłasza przychodzących ładunków hooka `message_received` do Pluginów,
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

Włączaj to tylko dla Pluginów, którym ufasz w zakresie odbierania przychodzącej treści wiadomości
WhatsApp i identyfikatorów.

## Kontrola dostępu i aktywacja

<Tabs>
  <Tab title="Zasady DM">
    `channels.whatsapp.dmPolicy` kontroluje dostęp do czatu bezpośredniego:

    - `pairing` (domyślnie)
    - `allowlist`
    - `open` (wymaga, aby `allowFrom` zawierało `"*"`)
    - `disabled`

    `allowFrom` akceptuje numery w stylu E.164 (normalizowane wewnętrznie).

    `allowFrom` to lista kontroli dostępu nadawców DM. Nie blokuje jawnych wysyłek wychodzących do JID grup WhatsApp ani JID kanałów `@newsletter`.

    Nadpisanie dla wielu kont: `channels.whatsapp.accounts.<id>.dmPolicy` (i `allowFrom`) mają pierwszeństwo przed domyślnymi ustawieniami na poziomie kanału dla tego konta.

    Szczegóły zachowania w czasie działania:

    - parowania są utrwalane w magazynie dozwolonych kanału i scalane ze skonfigurowanym `allowFrom`
    - zaplanowana automatyzacja i awaryjni odbiorcy Heartbeat używają jawnych celów dostarczania albo skonfigurowanego `allowFrom`; zatwierdzenia parowania DM nie są niejawnymi odbiorcami Cron ani Heartbeat
    - jeśli nie skonfigurowano listy dozwolonych, połączony własny numer jest domyślnie dozwolony
    - OpenClaw nigdy nie paruje automatycznie wychodzących DM `fromMe` (wiadomości wysyłanych do siebie z połączonego urządzenia)

  </Tab>

  <Tab title="Zasady grup + listy dozwolonych">
    Dostęp grupowy ma dwie warstwy:

    1. **Lista dozwolonych członkostwa w grupach** (`channels.whatsapp.groups`)
       - jeśli `groups` jest pominięte, wszystkie grupy kwalifikują się
       - jeśli `groups` jest obecne, działa jako lista dozwolonych grup (`"*"` dozwolone)

    2. **Zasada nadawców grupowych** (`channels.whatsapp.groupPolicy` + `groupAllowFrom`)
       - `open`: lista dozwolonych nadawców pomijana
       - `allowlist`: nadawca musi pasować do `groupAllowFrom` (lub `*`)
       - `disabled`: blokuj wszystkie przychodzące wiadomości grupowe

    Fallback listy dozwolonych nadawców:

    - jeśli `groupAllowFrom` nie jest ustawione, runtime wraca do `allowFrom`, gdy jest dostępne
    - listy dozwolonych nadawców są oceniane przed aktywacją przez wzmiankę/odpowiedź

    Uwaga: jeśli blok `channels.whatsapp` w ogóle nie istnieje, fallback zasad grup w runtime to `allowlist` (z wpisem ostrzeżenia w logu), nawet jeśli `channels.defaults.groupPolicy` jest ustawione.

  </Tab>

  <Tab title="Wzmianki + /activation">
    Odpowiedzi w grupie domyślnie wymagają wzmianki.

    Wykrywanie wzmianki obejmuje:

    - jawne wzmianki WhatsApp o tożsamości bota
    - skonfigurowane wzorce regex wzmianki (`agents.list[].groupChat.mentionPatterns`, fallback `messages.groupChat.mentionPatterns`)
    - transkrypcje przychodzących notatek głosowych dla autoryzowanych wiadomości grupowych
    - niejawne wykrywanie odpowiedzi do bota (nadawca odpowiedzi pasuje do tożsamości bota)

    Uwaga dotycząca bezpieczeństwa:

    - cytat/odpowiedź spełnia tylko warunek wzmianki; **nie** przyznaje autoryzacji nadawcy
    - przy `groupPolicy: "allowlist"` nadawcy spoza listy dozwolonych nadal są blokowani, nawet jeśli odpowiadają na wiadomość użytkownika z listy dozwolonych

    Polecenie aktywacji na poziomie sesji:

    - `/activation mention`
    - `/activation always`

    `activation` aktualizuje stan sesji (nie konfigurację globalną). Jest ograniczone do właściciela.

  </Tab>
</Tabs>

## Numer osobisty i zachowanie czatu z samym sobą

Gdy połączony własny numer jest także obecny w `allowFrom`, aktywują się zabezpieczenia czatu WhatsApp z samym sobą:

- pomijanie potwierdzeń odczytu dla tur czatu z samym sobą
- ignorowanie zachowania automatycznego wyzwalania przez JID wzmianki, które w przeciwnym razie oznaczyłoby Ciebie
- jeśli `messages.responsePrefix` nie jest ustawione, odpowiedzi w czacie z samym sobą domyślnie używają `[{identity.name}]` albo `[openclaw]`

## Normalizacja wiadomości i kontekst

<AccordionGroup>
  <Accordion title="Koperta przychodząca + kontekst odpowiedzi">
    Przychodzące wiadomości WhatsApp są opakowywane we współdzieloną kopertę przychodzącą.

    Jeśli istnieje cytowana odpowiedź, kontekst jest dołączany w tej formie:

    ```text
    [Replying to <sender> id:<stanzaId>]
    <quoted body or media placeholder>
    [/Replying]
    ```

    Pola metadanych odpowiedzi są również wypełniane, gdy są dostępne (`ReplyToId`, `ReplyToBody`, `ReplyToSender`, JID/E.164 nadawcy).
    Gdy cel cytowanej odpowiedzi to możliwe do pobrania media, OpenClaw zapisuje je przez
    normalny magazyn mediów przychodzących i udostępnia jako `MediaPath`/`MediaType`, aby
    agent mógł sprawdzić obraz, do którego odnosi się wiadomość, zamiast widzieć tylko
    `<media:image>`.

  </Accordion>

  <Accordion title="Symbole zastępcze mediów oraz wyodrębnianie lokalizacji/kontaktów">
    Przychodzące wiadomości zawierające tylko media są normalizowane z symbolami zastępczymi, takimi jak:

    - `<media:image>`
    - `<media:video>`
    - `<media:audio>`
    - `<media:document>`
    - `<media:sticker>`

    Autoryzowane grupowe notatki głosowe są transkrybowane przed warunkiem wzmianki, gdy
    treść to tylko `<media:audio>`, więc wypowiedzenie wzmianki o bocie w notatce głosowej może
    wyzwolić odpowiedź. Jeśli transkrypcja nadal nie wspomina bota,
    transkrypcja jest zachowywana w oczekującej historii grupy zamiast surowego symbolu zastępczego.

    Treści lokalizacji używają zwięzłego tekstu współrzędnych. Etykiety/komentarze lokalizacji i szczegóły kontaktu/vCard są renderowane jako wydzielone niezaufane metadane, a nie jako tekst promptu w treści.

  </Accordion>

  <Accordion title="Wstrzykiwanie oczekującej historii grupy">
    W grupach nieprzetworzone wiadomości mogą być buforowane i wstrzykiwane jako kontekst, gdy bot zostanie w końcu wyzwolony.

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

    W turach czatu z samym sobą potwierdzenia odczytu są pomijane nawet wtedy, gdy są włączone globalnie.

  </Accordion>
</AccordionGroup>

## Dostarczanie, dzielenie na fragmenty i multimedia

<AccordionGroup>
  <Accordion title="Dzielenie tekstu na fragmenty">
    - domyślny limit fragmentu: `channels.whatsapp.textChunkLimit = 4000`
    - `channels.whatsapp.chunkMode = "length" | "newline"`
    - tryb `newline` preferuje granice akapitów (puste wiersze), a następnie przechodzi do bezpiecznego dzielenia według długości

  </Accordion>

  <Accordion title="Zachowanie multimediów wychodzących">
    - obsługuje ładunki obrazów, wideo, audio (notatka głosowa PTT) i dokumentów
    - multimedia audio są wysyłane przez ładunek `audio` Baileys z `ptt: true`, dzięki czemu klienci WhatsApp renderują je jako notatkę głosową push-to-talk
    - ładunki odpowiedzi zachowują `audioAsVoice`; wyjście notatki głosowej TTS dla WhatsApp pozostaje na tej ścieżce PTT nawet wtedy, gdy dostawca zwraca MP3 lub WebM
    - natywne audio Ogg/Opus jest wysyłane jako `audio/ogg; codecs=opus` dla zgodności z notatkami głosowymi
    - audio inne niż Ogg, w tym wyjście MP3/WebM z Microsoft Edge TTS, jest transkodowane za pomocą `ffmpeg` do mono Ogg/Opus 48 kHz przed dostarczeniem PTT
    - `/tts latest` wysyła najnowszą odpowiedź asystenta jako jedną notatkę głosową i blokuje ponowne wysyłki tej samej odpowiedzi; `/tts chat on|off|default` kontroluje automatyczny TTS dla bieżącego czatu WhatsApp
    - odtwarzanie animowanych GIF-ów jest obsługiwane przez `gifPlayback: true` przy wysyłkach wideo
    - podpisy są stosowane do pierwszego elementu multimedialnego przy wysyłaniu ładunków odpowiedzi z wieloma multimediami, z wyjątkiem notatek głosowych PTT, które wysyłają najpierw audio, a widoczny tekst osobno, ponieważ klienci WhatsApp nie renderują podpisów notatek głosowych spójnie
    - źródłem multimediów może być HTTP(S), `file://` lub ścieżki lokalne

  </Accordion>

  <Accordion title="Limity rozmiaru multimediów i zachowanie awaryjne">
    - limit zapisu multimediów przychodzących: `channels.whatsapp.mediaMaxMb` (domyślnie `50`)
    - limit wysyłania multimediów wychodzących: `channels.whatsapp.mediaMaxMb` (domyślnie `50`)
    - nadpisania dla poszczególnych kont używają `channels.whatsapp.accounts.<accountId>.mediaMaxMb`
    - obrazy są automatycznie optymalizowane (zmiana rozmiaru/przegląd jakości), aby zmieściły się w limitach
    - przy niepowodzeniu wysyłania multimediów awaryjna obsługa pierwszego elementu wysyła ostrzeżenie tekstowe zamiast po cichu porzucać odpowiedź

  </Accordion>
</AccordionGroup>

## Cytowanie w odpowiedziach

WhatsApp obsługuje natywne cytowanie w odpowiedziach, w którym odpowiedzi wychodzące widocznie cytują wiadomość przychodzącą. Kontroluj je za pomocą `channels.whatsapp.replyToMode`.

| Wartość     | Zachowanie                                                           |
| ----------- | -------------------------------------------------------------------- |
| `"off"`     | Nigdy nie cytuj; wyślij jako zwykłą wiadomość                        |
| `"first"`   | Cytuj tylko pierwszy fragment odpowiedzi wychodzącej                 |
| `"all"`     | Cytuj każdy fragment odpowiedzi wychodzącej                          |
| `"batched"` | Cytuj zakolejkowane odpowiedzi zbiorcze, pozostawiając odpowiedzi natychmiastowe bez cytowania |

Wartość domyślna to `"off"`. Nadpisania dla poszczególnych kont używają `channels.whatsapp.accounts.<id>.replyToMode`.

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

| Poziom        | Reakcje potwierdzające | Reakcje inicjowane przez agenta | Opis                                             |
| ------------- | ---------------------- | -------------------------------- | ------------------------------------------------ |
| `"off"`       | Nie                    | Nie                              | Brak reakcji                                     |
| `"ack"`       | Tak                    | Nie                              | Tylko reakcje potwierdzające (potwierdzenie przed odpowiedzią) |
| `"minimal"`   | Tak                    | Tak (zachowawczo)                | Potwierdzenia + reakcje agenta z zachowawczymi wskazówkami |
| `"extensive"` | Tak                    | Tak (zalecane)                   | Potwierdzenia + reakcje agenta z zachęcającymi wskazówkami |

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
- niepowodzenia są zapisywane w logach, ale nie blokują normalnego dostarczania odpowiedzi
- tryb grupy `mentions` reaguje w turach wyzwolonych wzmianką; aktywacja grupy `always` działa jako obejście tego sprawdzenia
- WhatsApp używa `channels.whatsapp.ackReaction` (starsze `messages.ackReaction` nie jest tutaj używane)

## Wiele kont i poświadczenia

<AccordionGroup>
  <Accordion title="Wybór konta i wartości domyślne">
    - identyfikatory kont pochodzą z `channels.whatsapp.accounts`
    - domyślny wybór konta: `default`, jeśli istnieje, w przeciwnym razie pierwszy skonfigurowany identyfikator konta (posortowany)
    - identyfikatory kont są normalizowane wewnętrznie na potrzeby wyszukiwania

  </Accordion>

  <Accordion title="Ścieżki poświadczeń i zgodność ze starszymi wersjami">
    - bieżąca ścieżka uwierzytelniania: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
    - plik kopii zapasowej: `creds.json.bak`
    - starsze domyślne uwierzytelnianie w `~/.openclaw/credentials/` jest nadal rozpoznawane/migrowane dla przepływów konta domyślnego

  </Accordion>

  <Accordion title="Zachowanie wylogowania">
    `openclaw channels logout --channel whatsapp [--account <id>]` czyści stan uwierzytelniania WhatsApp dla tego konta.

    Gdy Gateway jest osiągalny, wylogowanie najpierw zatrzymuje aktywny nasłuch WhatsApp dla wybranego konta, aby połączona sesja nie odbierała dalej wiadomości aż do następnego restartu. `openclaw channels remove --channel whatsapp` także zatrzymuje aktywny nasłuch przed wyłączeniem lub usunięciem konfiguracji konta.

    W starszych katalogach uwierzytelniania `oauth.json` jest zachowywany, a pliki uwierzytelniania Baileys są usuwane.

  </Accordion>
</AccordionGroup>

## Narzędzia, działania i zapisy konfiguracji

- Obsługa narzędzi agenta obejmuje działanie reakcji WhatsApp (`react`).
- Bramki działań:
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

    Ciche konta mogą pozostać połączone po zwykłym limicie czasu wiadomości; mechanizm nadzorujący
    uruchamia się ponownie, gdy aktywność transportu WhatsApp Web ustaje, gniazdo zostaje zamknięte lub
    aktywność na poziomie aplikacji pozostaje cicha dłużej niż przewiduje dłuższe okno bezpieczeństwa.

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

    Jeśli `~/.openclaw/logs/whatsapp-health.log` mówi `Gateway inactive`, ale
    `openclaw gateway status` i `openclaw channels status --probe` pokazują, że
    Gateway i WhatsApp działają prawidłowo, uruchom `openclaw doctor`. W systemie Linux doctor
    ostrzega o starszych wpisach crontab, które nadal wywołują
    `~/.openclaw/bin/ensure-whatsapp.sh`; usuń te nieaktualne wpisy za pomocą
    `crontab -e`, ponieważ Cron może nie mieć środowiska magistrali użytkownika systemd i
    powodować, że ten stary skrypt błędnie raportuje stan Gateway.

    W razie potrzeby połącz ponownie za pomocą `channels login`.

  </Accordion>

  <Accordion title="Logowanie QR przekracza limit czasu za proxy">
    Objaw: `openclaw channels login --channel whatsapp` kończy się niepowodzeniem przed wyświetleniem użytecznego kodu QR z `status=408 Request Time-out` lub rozłączeniem gniazda TLS.

    Logowanie WhatsApp Web używa standardowego środowiska proxy hosta Gateway (`HTTPS_PROXY`, `HTTP_PROXY`, warianty pisane małymi literami oraz `NO_PROXY`). Sprawdź, czy proces Gateway dziedziczy zmienne środowiskowe proxy i czy `NO_PROXY` nie pasuje do `mmg.whatsapp.net`.

  </Accordion>

  <Accordion title="Brak aktywnego nasłuchiwania podczas wysyłania">
    Wysyłki wychodzące szybko kończą się niepowodzeniem, gdy nie istnieje aktywne nasłuchiwanie Gateway dla konta docelowego.

    Upewnij się, że Gateway działa, a konto jest połączone.

  </Accordion>

  <Accordion title="Odpowiedź pojawia się w transkrypcie, ale nie w WhatsApp">
    Wiersze transkryptu zapisują to, co wygenerował agent. Dostarczanie WhatsApp jest sprawdzane osobno: OpenClaw uznaje automatyczną odpowiedź za wysłaną dopiero po tym, jak Baileys zwróci identyfikator wiadomości wychodzącej dla co najmniej jednej widocznej wysyłki tekstu lub multimediów.

    Reakcje potwierdzające są niezależnymi potwierdzeniami przed odpowiedzią. Udana reakcja nie dowodzi, że późniejsza odpowiedź tekstowa lub multimedialna została zaakceptowana przez WhatsApp.

    Sprawdź logi Gateway pod kątem `auto-reply delivery failed` lub `auto-reply was not accepted by WhatsApp provider`.

  </Accordion>

  <Accordion title="Wiadomości grupowe są nieoczekiwanie ignorowane">
    Sprawdź w tej kolejności:

    - `groupPolicy`
    - `groupAllowFrom` / `allowFrom`
    - wpisy listy dozwolonych `groups`
    - bramkowanie wzmianek (`requireMention` + wzorce wzmianek)
    - zduplikowane klucze w `openclaw.json` (JSON5): późniejsze wpisy zastępują wcześniejsze, więc zachowaj pojedynczy `groupPolicy` dla każdego zakresu

  </Accordion>

  <Accordion title="Ostrzeżenie dotyczące środowiska uruchomieniowego Bun">
    Środowisko uruchomieniowe Gateway WhatsApp powinno używać Node. Bun jest oznaczony jako niezgodny ze stabilnym działaniem Gateway WhatsApp/Telegram.
  </Accordion>
</AccordionGroup>

## Prompty systemowe

WhatsApp obsługuje prompty systemowe w stylu Telegram dla grup i czatów bezpośrednich za pośrednictwem map `groups` i `direct`.

Hierarchia rozstrzygania dla wiadomości grupowych:

Efektywna mapa `groups` jest określana jako pierwsza: jeśli konto definiuje własne `groups`, całkowicie zastępuje główną mapę `groups` (bez głębokiego scalania). Wyszukiwanie promptu działa następnie na wynikowej pojedynczej mapie:

1. **Prompt systemowy konkretnej grupy** (`groups["<groupId>"].systemPrompt`): używany, gdy konkretny wpis grupy istnieje w mapie **i** jego klucz `systemPrompt` jest zdefiniowany. Jeśli `systemPrompt` jest pustym ciągiem (`""`), symbol wieloznaczny jest pomijany i nie jest stosowany żaden prompt systemowy.
2. **Prompt systemowy z symbolem wieloznacznym grupy** (`groups["*"].systemPrompt`): używany, gdy konkretnego wpisu grupy całkowicie nie ma w mapie albo gdy istnieje, ale nie definiuje klucza `systemPrompt`.

Hierarchia rozstrzygania dla wiadomości bezpośrednich:

Efektywna mapa `direct` jest określana jako pierwsza: jeśli konto definiuje własne `direct`, całkowicie zastępuje główną mapę `direct` (bez głębokiego scalania). Wyszukiwanie promptu działa następnie na wynikowej pojedynczej mapie:

1. **Prompt systemowy konkretnego czatu bezpośredniego** (`direct["<peerId>"].systemPrompt`): używany, gdy konkretny wpis rozmówcy istnieje w mapie **i** jego klucz `systemPrompt` jest zdefiniowany. Jeśli `systemPrompt` jest pustym ciągiem (`""`), symbol wieloznaczny jest pomijany i nie jest stosowany żaden prompt systemowy.
2. **Prompt systemowy z symbolem wieloznacznym czatu bezpośredniego** (`direct["*"].systemPrompt`): używany, gdy konkretnego wpisu rozmówcy całkowicie nie ma w mapie albo gdy istnieje, ale nie definiuje klucza `systemPrompt`.

<Note>
`dms` pozostaje lekkim zasobnikiem nadpisania historii dla poszczególnych DM (`dms.<id>.historyLimit`). Nadpisania promptów znajdują się w `direct`.
</Note>

**Różnica względem zachowania wielu kont w Telegram:** W Telegram główne `groups` jest celowo pomijane dla wszystkich kont w konfiguracji z wieloma kontami — nawet dla kont, które nie definiują własnych `groups` — aby zapobiec odbieraniu przez bota wiadomości grupowych z grup, do których nie należy. WhatsApp nie stosuje tego zabezpieczenia: główne `groups` i główne `direct` są zawsze dziedziczone przez konta, które nie definiują nadpisania na poziomie konta, niezależnie od liczby skonfigurowanych kont. W konfiguracji WhatsApp z wieloma kontami, jeśli chcesz mieć monity grupowe lub bezpośrednie osobno dla każdego konta, zdefiniuj pełną mapę jawnie pod każdym kontem zamiast polegać na domyślnych ustawieniach z poziomu głównego.

Ważne zachowanie:

- `channels.whatsapp.groups` jest jednocześnie mapą konfiguracji dla poszczególnych grup oraz listą dozwolonych grup na poziomie czatu. Zarówno w zakresie głównym, jak i konta, `groups["*"]` oznacza „wszystkie grupy są dopuszczone” dla tego zakresu.
- Dodawaj symbol wieloznaczny grupy `systemPrompt` tylko wtedy, gdy już chcesz, aby ten zakres dopuszczał wszystkie grupy. Jeśli nadal chcesz, aby kwalifikował się tylko stały zestaw identyfikatorów grup, nie używaj `groups["*"]` jako domyślnego monitu. Zamiast tego powtórz monit przy każdym jawnie dozwolonym wpisie grupy.
- Dopuszczanie grup i autoryzacja nadawcy to oddzielne kontrole. `groups["*"]` rozszerza zestaw grup, które mogą trafić do obsługi grup, ale samo w sobie nie autoryzuje każdego nadawcy w tych grupach. Dostęp nadawcy nadal jest kontrolowany oddzielnie przez `channels.whatsapp.groupPolicy` i `channels.whatsapp.groupAllowFrom`.
- `channels.whatsapp.direct` nie ma takiego samego efektu ubocznego dla wiadomości prywatnych. `direct["*"]` zapewnia tylko domyślną konfigurację czatu bezpośredniego po tym, jak wiadomość prywatna zostanie już dopuszczona przez `dmPolicy` oraz reguły `allowFrom` lub magazynu parowania.

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

## Wskaźniki odniesienia konfiguracji

Główne odniesienie:

- [Odniesienie konfiguracji - WhatsApp](/pl/gateway/config-channels#whatsapp)

Najważniejsze pola WhatsApp:

- dostęp: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`
- dostarczanie: `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `sendReadReceipts`, `ackReaction`, `reactionLevel`
- wiele kont: `accounts.<id>.enabled`, `accounts.<id>.authDir`, nadpisania na poziomie konta
- operacje: `configWrites`, `debounceMs`, `web.enabled`, `web.heartbeatSeconds`, `web.reconnect.*`, `web.whatsapp.*`
- zachowanie sesji: `session.dmScope`, `historyLimit`, `dmHistoryLimit`, `dms.<id>.historyLimit`
- monity: `groups.<id>.systemPrompt`, `groups["*"].systemPrompt`, `direct.<id>.systemPrompt`, `direct["*"].systemPrompt`

## Powiązane

- [Parowanie](/pl/channels/pairing)
- [Grupy](/pl/channels/groups)
- [Bezpieczeństwo](/pl/gateway/security)
- [Routing kanałów](/pl/channels/channel-routing)
- [Routing wielu agentów](/pl/concepts/multi-agent)
- [Rozwiązywanie problemów](/pl/channels/troubleshooting)
