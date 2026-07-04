---
read_when:
    - Praca nad zachowaniem kanału WhatsApp/web lub routingiem skrzynki odbiorczej
summary: Obsługa kanału WhatsApp, mechanizmy kontroli dostępu, zachowanie dostarczania i operacje
title: WhatsApp
x-i18n:
    generated_at: "2026-07-04T11:03:31Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a968c08c461708fb4b8cabe4528af2514b0a5768d272abab8f88e36e24bde302
    source_path: channels/whatsapp.md
    workflow: 16
---

Status: gotowe do produkcji przez WhatsApp Web (Baileys). Gateway zarządza połączonymi sesjami.

## Instalacja (na żądanie)

- Onboarding (`openclaw onboard`) oraz `openclaw channels add --channel whatsapp`
  proszą o instalację Pluginu WhatsApp przy pierwszym wyborze.
- `openclaw channels login --channel whatsapp` także oferuje przepływ instalacji, gdy
  Plugin nie jest jeszcze obecny.
- Kanał deweloperski + checkout z git: domyślnie używa lokalnej ścieżki Pluginu.
- Stable/Beta: najpierw instaluje oficjalny Plugin `@openclaw/whatsapp` z ClawHub,
  z npm jako rozwiązaniem awaryjnym.
- Runtime WhatsApp jest dystrybuowany poza głównym pakietem npm OpenClaw, aby
  zależności runtime specyficzne dla WhatsApp pozostały w zewnętrznym Pluginie.

Ręczna instalacja pozostaje dostępna:

```bash
openclaw plugins install clawhub:@openclaw/whatsapp
```

Używaj samego pakietu npm (`@openclaw/whatsapp`) tylko wtedy, gdy potrzebujesz
awaryjnego użycia rejestru. Przypinaj dokładną wersję tylko wtedy, gdy potrzebujesz powtarzalnej instalacji.

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

    Obecne logowanie opiera się na kodzie QR. W środowiskach zdalnych lub bezobsługowych upewnij się, że
    masz niezawodną ścieżkę dostarczenia aktywnego kodu QR do telefonu, który go zeskanuje,
    przed rozpoczęciem logowania.

    Dla konkretnego konta:

```bash
openclaw channels login --channel whatsapp --account work
```

    Aby dołączyć istniejący/niestandardowy katalog uwierzytelniania WhatsApp Web przed logowaniem:

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
OpenClaw zaleca uruchamianie WhatsApp na osobnym numerze, gdy to możliwe. (Metadane kanału i przepływ konfiguracji są zoptymalizowane pod takie ustawienie, ale konfiguracje z numerem osobistym są także obsługiwane).
</Note>

<Warning>
Obecny przepływ konfiguracji WhatsApp obsługuje wyłącznie QR. Kody QR renderowane w terminalu, zrzuty ekranu,
pliki PDF lub załączniki czatu mogą wygasnąć albo stać się nieczytelne podczas przekazywania
ze zdalnej maszyny. Dla hostów zdalnych/bezobsługowych preferuj bezpośrednią ścieżkę przekazania obrazu QR
zamiast ręcznego przechwytywania terminala.
</Warning>

## Zadzwoń do bieżącego nadawcy za pomocą MeowCaller (eksperymentalne)

Plugin WhatsApp może udostępniać `whatsapp_call` w turach agenta pochodzących z WhatsApp. Narzędzie
używa [MeowCaller](https://github.com/purpshell/meowcaller), aby wykonać połączenie głosowe WhatsApp do
bieżącego autoryzowanego nadawcy i odtworzyć komunikat OpenClaw TTS po odebraniu. Narzędzie
nie przyjmuje numeru docelowego, więc prompt nie może przekierować połączenia do strony trzeciej.
Ta eksperymentalna funkcja jest domyślnie wyłączona.

<Warning>
MeowCaller jest eksperymentalny, nie ma oznaczonego wydania i używa osobno sparowanej sesji połączonego urządzenia
whatsmeow. Nie może ponownie użyć poświadczeń Baileys Pluginu WhatsApp. Parowanie dodaje
kolejne połączone urządzenie do tego samego konta WhatsApp. Zeskanuj przy użyciu tożsamości WhatsApp używanej przez
OpenClaw. Tryb numeru osobistego/czatu z samym sobą nie może dzwonić do samego siebie; użyj dedykowanego numeru OpenClaw,
aby dzwonić na swój numer osobisty.
</Warning>

<Steps>
  <Step title="Włącz eksperymentalne połączenia">

    Dodaj `actions.calls: true` do kanału WhatsApp w `openclaw.json`:

```json
{
  "channels": {
    "whatsapp": {
      "actions": {
        "calls": true
      }
    }
  }
}
```

    Scal to z istniejącą konfiguracją WhatsApp, a następnie zrestartuj gateway. Gdy
    ustawienie jest nieobecne lub ma wartość `false`, OpenClaw nie udostępnia agentowi narzędzia `whatsapp_call`.

  </Step>

  <Step title="Zainstaluj przejrzany CLI MeowCaller">

    Adapter oczekuje pliku wykonywalnego o nazwie `meowcaller` na `PATH` hosta gateway.
    Do czasu scalenia [MeowCaller PR #7](https://github.com/purpshell/meowcaller/pull/7) zbuduj
    przejrzaną gałąź na commicie `752050471fc2bf7a8cdfbf7dbd3cd4e865d85d3f`:

```bash
git clone --branch feat/send-only-notify https://github.com/steipete/meowcaller.git
cd meowcaller
git checkout 752050471fc2bf7a8cdfbf7dbd3cd4e865d85d3f
mkdir -p "$HOME/.local/bin"
go build -o "$HOME/.local/bin/meowcaller" ./cmd/meowcaller
```

    Upewnij się, że `$HOME/.local/bin` jest także na `PATH` usługi gateway. Ta rewizja zapewnia
    jawne polecenia `pair` oraz `notify` tylko do wysyłania. `notify` nie otwiera mikrofonu, głośnika,
    urządzenia wideo, ujścia dźwięku przychodzącego ani przechwytywania diagnostycznego. Nie zastępuj go przykładowym
    poleceniem CLI `play`.

  </Step>

  <Step title="Sparuj połączone urządzenie MeowCaller">

    Poproś agenta WhatsApp o sprawdzenie konfiguracji połączeń. Akcja statusu `whatsapp_call` zgłasza
    katalog stanu specyficzny dla konta oraz polecenie parowania. Dla konta domyślnego:

```bash
state_dir="$HOME/.openclaw/credentials/whatsapp-calls/default"
mkdir -p "$state_dir"
chmod 700 "$state_dir"
meowcaller pair --store "$state_dir/wa-voip.db"
```

    Uruchom polecenie w interaktywnym terminalu. Zeskanuj jego QR z **WhatsApp > Połączone urządzenia**
    i poczekaj na `MeowCaller linked device ready`. Następnie polecenie kończy działanie. Zachowaj `wa-voip.db`
    jako prywatne; to sesja połączonego urządzenia MeowCaller. Akcja statusu `whatsapp_call`
    zwraca polecenie i powłokę specyficzne dla konta, gdy używasz konta innego niż domyślne. W
    Windows uruchom jego polecenie PowerShell; MeowCaller tworzy katalog magazynu.

  </Step>

  <Step title="Skonfiguruj TTS i zadzwoń z WhatsApp">

    Skonfiguruj [dostawcę TTS](/pl/tools/tts) obsługującego telefonię, zrestartuj gateway, a następnie wyślij
    prośbę WhatsApp, taką jak `Call me and say the build finished.` Narzędzie ustala nadawcę
    z zaufanego kontekstu przychodzącego, syntetyzuje tymczasowy prywatny plik WAV, uruchamia MeowCaller na
    ograniczone okno połączenia i usuwa plik audio po zakończeniu. OpenClaw jawnie przekazuje magazyn
    konta, czeka na zerowy kod wyjścia po odebraniu, odtworzeniu i rozłączeniu, oraz traktuje
    timeout lub niezerowy kod wyjścia jako nieudane wywołanie narzędzia.

  </Step>
</Steps>

Obecne ograniczenia:

- tylko wychodzące połączenia audio jeden do jednego
- brak dowolnych numerów docelowych
- brak współdzielonego uwierzytelniania z połączeniem czatu
- brak połączeń do samego siebie w trybie numeru osobistego/czatu z samym sobą
- zsyntetyzowany dźwięk jest ograniczony do 60 sekund
- brak potwierdzenia słyszalności po stronie telefonu poza zakończeniem odebrania/odtwarzania/rozłączenia przez MeowCaller
- OpenClaw zatrzymuje proces towarzyszący po ograniczonym oknie 115–175 sekund, obejmującym
  fazy połączenia, odebrania, odtwarzania i zamknięcia MeowCaller

## Wzorce wdrożenia

<AccordionGroup>
  <Accordion title="Dedykowany numer (zalecane)">
    To najczystszy tryb operacyjny:

    - osobna tożsamość WhatsApp dla OpenClaw
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

  <Accordion title="Awaryjny tryb numeru osobistego">
    Onboarding obsługuje tryb numeru osobistego i zapisuje bazę przyjazną dla czatu z samym sobą:

    - `dmPolicy: "allowlist"`
    - `allowFrom` zawiera Twój numer osobisty
    - `selfChatMode: true`

    W runtime zabezpieczenia czatu z samym sobą opierają się na połączonym własnym numerze i `allowFrom`.

  </Accordion>

  <Accordion title="Zakres kanału tylko WhatsApp Web">
    Kanał platformy komunikacyjnej w obecnej architekturze kanałów OpenClaw opiera się na WhatsApp Web (`Baileys`).

    W wbudowanym rejestrze kanałów czatu nie ma osobnego kanału komunikacyjnego Twilio WhatsApp.

  </Accordion>
</AccordionGroup>

## Model runtime

- Gateway zarządza gniazdem WhatsApp i pętlą ponownego łączenia.
- Watchdog ponownego łączenia używa aktywności transportu WhatsApp Web, a nie tylko wolumenu przychodzących wiadomości aplikacji, więc cicha sesja połączonego urządzenia nie jest restartowana wyłącznie dlatego, że nikt ostatnio nie wysłał wiadomości. Dłuższy limit ciszy aplikacji nadal wymusza ponowne połączenie, jeśli ramki transportu dalej przychodzą, ale w oknie watchdoga nie są obsługiwane żadne wiadomości aplikacji; po przejściowym ponownym połączeniu dla ostatnio aktywnej sesji ten test ciszy aplikacji używa normalnego timeoutu wiadomości dla pierwszego okna odzyskiwania.
- Czasy gniazda Baileys są jawne pod `web.whatsapp.*`: `keepAliveIntervalMs` kontroluje pingi aplikacji WhatsApp Web, `connectTimeoutMs` kontroluje timeout początkowego uzgadniania połączenia, a `defaultQueryTimeoutMs` kontroluje oczekiwania zapytań Baileys oraz lokalne limity operacji wysyłki wychodzącej/obecności i potwierdzeń odczytu przychodzącego w OpenClaw.
- Wysyłki wychodzące wymagają aktywnego listenera WhatsApp dla konta docelowego.
- Wysyłki grupowe dołączają natywne metadane wzmianek dla tokenów `@+<digits>` i `@<digits>` w tekście i podpisach mediów, gdy token pasuje do bieżących metadanych uczestnika WhatsApp, w tym grup opartych na LID.
- Czaty statusowe i broadcast są ignorowane (`@status`, `@broadcast`).
- Watchdog ponownego łączenia podąża za aktywnością transportu WhatsApp Web, a nie tylko wolumenem przychodzących wiadomości aplikacji: ciche sesje połączonych urządzeń pozostają aktywne, dopóki ramki transportu nadal przychodzą, ale zatrzymanie transportu wymusza ponowne połączenie dużo wcześniej niż późniejsza ścieżka zdalnego rozłączenia.
- Czaty bezpośrednie używają reguł sesji DM (`session.dmScope`; domyślne `main` zwija DM do głównej sesji agenta).
- Sesje grupowe są izolowane (`agent:<agentId>:whatsapp:group:<jid>`).
- Kanały/Newslettery WhatsApp mogą być jawnymi celami wychodzącymi z natywnym JID `@newsletter`. Wysyłki wychodzące do newsletterów używają metadanych sesji kanału (`agent:<agentId>:whatsapp:channel:<jid>`) zamiast semantyki sesji DM.
- Transport WhatsApp Web respektuje standardowe zmienne środowiskowe proxy na hoście gateway (`HTTPS_PROXY`, `HTTP_PROXY`, `NO_PROXY` / warianty małymi literami). Preferuj konfigurację proxy na poziomie hosta zamiast ustawień proxy specyficznych dla kanału WhatsApp.
- Gdy `messages.removeAckAfterReply` jest włączone, OpenClaw czyści reakcję potwierdzenia WhatsApp po dostarczeniu widocznej odpowiedzi.

## Prompty zatwierdzania

WhatsApp może renderować prompty zatwierdzania exec i Pluginu z reakcjami `👍` / `👎`. Dostarczaniem
steruje najwyższego poziomu konfiguracja przekazywania zatwierdzeń:

```json5
{
  approvals: {
    exec: {
      enabled: true,
      mode: "session",
    },
    plugin: {
      enabled: true,
      mode: "targets",
      targets: [{ channel: "whatsapp", to: "+15551234567" }],
    },
  },
}
```

`approvals.exec` i `approvals.plugin` są niezależne. Włączenie WhatsApp jako kanału tylko łączy
transport; nie wysyła promptów zatwierdzania, chyba że odpowiednia rodzina zatwierdzeń jest włączona
i kieruje do WhatsApp. Tryb sesji dostarcza natywne zatwierdzenia emoji tylko dla zatwierdzeń, które
pochodzą z WhatsApp. Tryb celu używa współdzielonego potoku przekazywania dla jawnych celów WhatsApp
i nie tworzy osobnego rozsyłania do DM zatwierdzających.

Reakcje zatwierdzania WhatsApp wymagają jawnych zatwierdzających WhatsApp z `allowFrom` lub `"*"`.
`defaultTo` kontroluje zwykłe domyślne cele wiadomości; nie jest zatwierdzającym zatwierdzeń. Ręczne
polecenia `/approve` nadal przechodzą przez normalną ścieżkę autoryzacji nadawcy WhatsApp przed
rozstrzygnięciem zatwierdzenia.

## Hooki Pluginu i prywatność

Wiadomości przychodzące WhatsApp mogą zawierać osobistą treść wiadomości, numery telefonów,
identyfikatory grup, nazwy nadawców i pola korelacji sesji. Z tego powodu
WhatsApp nie rozsyła przychodzących ładunków haka `message_received` do pluginów,
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
  <Tab title="DM policy">
    `channels.whatsapp.dmPolicy` kontroluje dostęp do czatów bezpośrednich:

    - `pairing` (domyślnie)
    - `allowlist`
    - `open` (wymaga, aby `allowFrom` zawierało `"*"`)
    - `disabled`

    `allowFrom` akceptuje numery w stylu E.164 (normalizowane wewnętrznie).

    `allowFrom` to lista kontroli dostępu nadawców wiadomości prywatnych. Nie ogranicza jawnych wysyłek wychodzących do JID grup WhatsApp ani JID kanałów `@newsletter`.

    Nadpisanie dla wielu kont: `channels.whatsapp.accounts.<id>.dmPolicy` (oraz `allowFrom`) mają pierwszeństwo przed domyślnymi ustawieniami na poziomie kanału dla tego konta.

    Szczegóły zachowania w czasie działania:

    - parowania są utrwalane w magazynie zezwoleń kanału i scalane ze skonfigurowanym `allowFrom`
    - zaplanowana automatyzacja i awaryjny wybór odbiorcy Heartbeat używają jawnych celów dostarczania albo skonfigurowanego `allowFrom`; zatwierdzenia parowania wiadomości prywatnych nie są domyślnymi odbiorcami Cron ani Heartbeat
    - jeśli nie skonfigurowano listy dozwolonych, połączony własny numer jest domyślnie dozwolony
    - OpenClaw nigdy automatycznie nie paruje wychodzących wiadomości prywatnych `fromMe` (wiadomości wysyłanych do siebie z połączonego urządzenia)

  </Tab>

  <Tab title="Group policy + allowlists">
    Dostęp do grup ma dwie warstwy:

    1. **Lista dozwolonych członkostwa w grupach** (`channels.whatsapp.groups`)
       - jeśli `groups` jest pominięte, kwalifikują się wszystkie grupy
       - jeśli `groups` jest obecne, działa jako lista dozwolonych grup (`"*"` dozwolone)

    2. **Polityka nadawców grupowych** (`channels.whatsapp.groupPolicy` + `groupAllowFrom`)
       - `open`: lista dozwolonych nadawców jest pomijana
       - `allowlist`: nadawca musi pasować do `groupAllowFrom` (albo `*`)
       - `disabled`: blokuj wszystkie przychodzące wiadomości grupowe

    Awaryjne zachowanie listy dozwolonych nadawców:

    - jeśli `groupAllowFrom` nie jest ustawione, runtime używa awaryjnie `allowFrom`, gdy jest dostępne
    - listy dozwolonych nadawców są oceniane przed aktywacją przez wzmiankę/odpowiedź

    Uwaga: jeśli blok `channels.whatsapp` w ogóle nie istnieje, awaryjna polityka grup w runtime to `allowlist` (z wpisem ostrzeżenia w logu), nawet jeśli ustawiono `channels.defaults.groupPolicy`.

  </Tab>

  <Tab title="Mentions + /activation">
    Odpowiedzi w grupach domyślnie wymagają wzmianki.

    Wykrywanie wzmianek obejmuje:

    - jawne wzmianki WhatsApp o tożsamości bota
    - skonfigurowane wzorce wyrażeń regularnych wzmianek (`agents.list[].groupChat.mentionPatterns`, awaryjnie `messages.groupChat.mentionPatterns`)
    - transkrypcje przychodzących notatek głosowych dla autoryzowanych wiadomości grupowych
    - niejawne wykrywanie odpowiedzi do bota (nadawca odpowiedzi pasuje do tożsamości bota)

    Uwaga dotycząca bezpieczeństwa:

    - cytat/odpowiedź spełnia tylko bramkowanie wzmianką; **nie** przyznaje autoryzacji nadawcy
    - przy `groupPolicy: "allowlist"` nadawcy spoza listy dozwolonych są nadal blokowani, nawet jeśli odpowiadają na wiadomość użytkownika z listy dozwolonych

    Polecenie aktywacji na poziomie sesji:

    - `/activation mention`
    - `/activation always`

    `activation` aktualizuje stan sesji (nie globalną konfigurację). Jest ograniczone do właściciela.

  </Tab>
</Tabs>

## Skonfigurowane powiązania ACP

WhatsApp obsługuje trwałe powiązania ACP przez wpisy najwyższego poziomu `bindings[]`:

```json5
{
  bindings: [
    {
      type: "acp",
      agentId: "codex",
      match: {
        channel: "whatsapp",
        accountId: "work",
        peer: { kind: "direct", id: "+15555550123" },
      },
    },
    {
      type: "acp",
      agentId: "codex",
      match: {
        channel: "whatsapp",
        accountId: "work",
        peer: { kind: "group", id: "120363424282127706@g.us" },
      },
    },
  ],
}
```

- Czaty bezpośrednie pasują do numerów E.164, takich jak `+15555550123`.
- Grupy pasują do JID grup WhatsApp, takich jak `120363424282127706@g.us`.
- Listy dozwolonych grup, polityka nadawców oraz bramkowanie wzmianką lub aktywacją działają, zanim OpenClaw upewni się, że skonfigurowana sesja ACP istnieje.
- Dopasowane skonfigurowane powiązanie ACP przejmuje trasę. Grupy rozgłoszeniowe WhatsApp nie rozsyłają tej tury do zwykłych sesji WhatsApp.

## Zachowanie numeru osobistego i czatu z samym sobą

Gdy połączony własny numer jest także obecny w `allowFrom`, aktywują się zabezpieczenia czatu WhatsApp z samym sobą:

- pomijanie potwierdzeń odczytu dla tur czatu z samym sobą
- ignorowanie automatycznego wyzwalania przez JID wzmianki, które w przeciwnym razie powiadomiłoby ciebie samego
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

    Pola metadanych odpowiedzi są także wypełniane, gdy są dostępne (`ReplyToId`, `ReplyToBody`, `ReplyToSender`, JID/E.164 nadawcy).
    Gdy cytowany cel odpowiedzi jest możliwym do pobrania medium, OpenClaw zapisuje go przez
    zwykły magazyn mediów przychodzących i udostępnia jako `MediaPath`/`MediaType`, aby
    agent mógł sprawdzić wskazany obraz zamiast widzieć tylko
    `<media:image>`.

  </Accordion>

  <Accordion title="Media placeholders and location/contact extraction">
    Przychodzące wiadomości zawierające tylko media są normalizowane z użyciem symboli zastępczych, takich jak:

    - `<media:image>`
    - `<media:video>`
    - `<media:audio>`
    - `<media:document>`
    - `<media:sticker>`

    Autoryzowane grupowe notatki głosowe są transkrybowane przed bramkowaniem wzmianką, gdy
    treść to tylko `<media:audio>`, więc wypowiedzenie wzmianki o bocie w notatce głosowej może
    wyzwolić odpowiedź. Jeśli transkrypcja nadal nie wspomina bota,
    transkrypcja jest zachowywana w oczekującej historii grupy zamiast surowego symbolu zastępczego.

    Treści lokalizacji używają zwięzłego tekstu współrzędnych. Etykiety/komentarze lokalizacji oraz szczegóły kontaktu/vCard są renderowane jako ogrodzone niezaufane metadane, a nie jako wbudowany tekst promptu.

  </Accordion>

  <Accordion title="Pending group history injection">
    W przypadku grup nieprzetworzone wiadomości mogą być buforowane i wstrzykiwane jako kontekst, gdy bot zostanie w końcu wyzwolony.

    - domyślny limit: `50`
    - konfiguracja: `channels.whatsapp.historyLimit`
    - awaryjnie: `messages.groupChat.historyLimit`
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

    Tury czatu z samym sobą pomijają potwierdzenia odczytu, nawet gdy są globalnie włączone.

  </Accordion>
</AccordionGroup>

## Dostarczanie, dzielenie na fragmenty i media

<AccordionGroup>
  <Accordion title="Text chunking">
    - domyślny limit fragmentu: `channels.whatsapp.textChunkLimit = 4000`
    - `channels.whatsapp.chunkMode = "length" | "newline"`
    - tryb `newline` preferuje granice akapitów (puste wiersze), a następnie awaryjnie używa dzielenia bezpiecznego pod względem długości

  </Accordion>

  <Accordion title="Outbound media behavior">
    - obsługuje ładunki obrazu, wideo, audio (notatka głosowa PTT) i dokumentu
    - media audio są wysyłane przez ładunek Baileys `audio` z `ptt: true`, więc klienci WhatsApp renderują je jako notatkę głosową push-to-talk
    - ładunki odpowiedzi zachowują `audioAsVoice`; wyjście notatki głosowej TTS dla WhatsApp pozostaje na tej ścieżce PTT, nawet gdy dostawca zwraca MP3 lub WebM
    - natywne audio Ogg/Opus jest wysyłane jako `audio/ogg; codecs=opus` dla zgodności z notatkami głosowymi
    - audio inne niż Ogg, w tym wyjście MP3/WebM z Microsoft Edge TTS, jest transkodowane za pomocą `ffmpeg` do mono Ogg/Opus 48 kHz przed dostarczeniem PTT
    - `/tts latest` wysyła najnowszą odpowiedź asystenta jako jedną notatkę głosową i tłumi ponowne wysyłki dla tej samej odpowiedzi; `/tts chat on|off|default` kontroluje automatyczne TTS dla bieżącego czatu WhatsApp
    - odtwarzanie animowanych GIF-ów jest obsługiwane przez `gifPlayback: true` przy wysyłaniu wideo
    - `forceDocument` / `asDocument` wysyła wychodzące obrazy, GIF-y i filmy przez ładunek dokumentu Baileys, aby uniknąć kompresji mediów WhatsApp, zachowując rozwiązaną nazwę pliku i typ MIME
    - podpisy są stosowane do pierwszego elementu multimedialnego przy wysyłaniu ładunków odpowiedzi z wieloma mediami, z wyjątkiem notatek głosowych PTT, które wysyłają najpierw audio, a widoczny tekst osobno, ponieważ klienci WhatsApp nie renderują konsekwentnie podpisów notatek głosowych
    - źródłem mediów może być HTTP(S), `file://` albo ścieżki lokalne

  </Accordion>

  <Accordion title="Media size limits and fallback behavior">
    - limit zapisu mediów przychodzących: `channels.whatsapp.mediaMaxMb` (domyślnie `50`)
    - limit wysyłania mediów wychodzących: `channels.whatsapp.mediaMaxMb` (domyślnie `50`)
    - nadpisania dla kont używają `channels.whatsapp.accounts.<accountId>.mediaMaxMb`
    - obrazy są automatycznie optymalizowane (przeskalowanie/przegląd jakości), aby zmieścić się w limitach, chyba że `forceDocument` / `asDocument` żąda dostarczenia jako dokumentu
    - w razie niepowodzenia wysłania mediów awaryjne zachowanie dla pierwszego elementu wysyła ostrzeżenie tekstowe zamiast po cichu porzucać odpowiedź

  </Accordion>
</AccordionGroup>

## Cytowanie odpowiedzi

WhatsApp obsługuje natywne cytowanie odpowiedzi, w którym odpowiedzi wychodzące widocznie cytują wiadomość przychodzącą. Kontroluj to za pomocą `channels.whatsapp.replyToMode`.

| Wartość     | Zachowanie                                                            |
| ----------- | --------------------------------------------------------------------- |
| `"off"`     | Nigdy nie cytuj; wysyłaj jako zwykłą wiadomość                        |
| `"first"`   | Cytuj tylko pierwszy fragment odpowiedzi wychodzącej                  |
| `"all"`     | Cytuj każdy fragment odpowiedzi wychodzącej                           |
| `"batched"` | Cytuj zakolejkowane odpowiedzi wsadowe, pozostawiając natychmiastowe odpowiedzi bez cytatu |

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

`channels.whatsapp.reactionLevel` kontroluje, jak szeroko agent używa reakcji emoji w WhatsApp:

| Poziom        | Reakcje potwierdzenia | Reakcje inicjowane przez agenta | Opis                                                  |
| ------------- | --------------------- | ------------------------------- | ----------------------------------------------------- |
| `"off"`       | Nie                   | Nie                             | Brak jakichkolwiek reakcji                            |
| `"ack"`       | Tak                   | Nie                             | Tylko reakcje potwierdzenia (potwierdzenie przed odpowiedzią) |
| `"minimal"`   | Tak                   | Tak (ostrożnie)                 | Potwierdzenia + reakcje agenta z ostrożnymi wytycznymi |
| `"extensive"` | Tak                   | Tak (zalecane)                  | Potwierdzenia + reakcje agenta z zalecanymi wytycznymi |

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

WhatsApp obsługuje natychmiastowe reakcje potwierdzenia przy odebraniu wiadomości przychodzącej przez `channels.whatsapp.ackReaction`.
Reakcje potwierdzenia są bramkowane przez `reactionLevel` — są tłumione, gdy `reactionLevel` ma wartość `"off"`.

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
- jeśli `ackReaction` występuje bez `emoji`, WhatsApp używa emoji tożsamości kierowanego agenta, z wycofaniem do "👀"; pomiń `ackReaction` albo ustaw `emoji: ""`, aby nie wysyłać reakcji potwierdzenia
- błędy są logowane, ale nie blokują normalnego dostarczenia odpowiedzi
- tryb grupy `mentions` reaguje na tury wyzwolone wzmianką; aktywacja grupy `always` działa jako obejście tego sprawdzenia
- WhatsApp używa `channels.whatsapp.ackReaction` (starsze `messages.ackReaction` nie jest tutaj używane)

## Reakcje statusu cyklu życia

Ustaw `messages.statusReactions.enabled: true`, aby WhatsApp zastępował reakcję potwierdzenia podczas tury zamiast pozostawiać statyczne emoji potwierdzenia odbioru. Gdy ta opcja jest włączona, OpenClaw używa tego samego miejsca reakcji na wiadomość przychodzącą dla stanów cyklu życia, takich jak w kolejce, myślenie, aktywność narzędzi, Compaction, gotowe i błąd.

```json5
{
  messages: {
    statusReactions: {
      enabled: true,
      emojis: {
        deploy: "🛫",
        build: "🏗️",
        concierge: "💁",
      },
    },
  },
}
```

Uwagi dotyczące zachowania:

- `channels.whatsapp.ackReaction` nadal kontroluje, czy reakcje statusu kwalifikują się dla wiadomości bezpośrednich i grup.
- Reakcja statusu w kolejce używa tego samego efektywnego emoji potwierdzenia co zwykłe reakcje potwierdzenia.
- WhatsApp ma jedno miejsce reakcji bota na wiadomość, więc aktualizacje cyklu życia zastępują bieżącą reakcję w miejscu.
- `messages.removeAckAfterReply: true` czyści końcową reakcję statusu po skonfigurowanym czasie podtrzymania stanu gotowe/błąd.
- Kategorie emoji narzędzi obejmują `tool`, `coding`, `web`, `deploy`, `build` i `concierge`.

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

    Gdy Gateway jest osiągalny, wylogowanie najpierw zatrzymuje aktywny nasłuchiwacz WhatsApp dla wybranego konta, aby połączona sesja nie odbierała dalej wiadomości aż do następnego restartu. `openclaw channels remove --channel whatsapp` również zatrzymuje aktywny nasłuchiwacz przed wyłączeniem lub usunięciem konfiguracji konta.

    W starszych katalogach uwierzytelniania `oauth.json` jest zachowywany, natomiast pliki uwierzytelniania Baileys są usuwane.

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
  <Accordion title="Nie połączono (wymagany QR)">
    Objaw: status kanału zgłasza brak połączenia.

    Naprawa:

    ```bash
    openclaw channels login --channel whatsapp
    openclaw channels status
    ```

  </Accordion>

  <Accordion title="Połączono, ale rozłączone / pętla ponownego łączenia">
    Objaw: połączone konto z powtarzającymi się rozłączeniami lub próbami ponownego połączenia.

    Ciche konta mogą pozostawać połączone dłużej niż normalny limit czasu wiadomości; watchdog
    uruchamia się ponownie, gdy aktywność transportu WhatsApp Web ustaje, gniazdo się zamyka albo
    aktywność na poziomie aplikacji pozostaje cicha poza dłuższym oknem bezpieczeństwa.

    Jeśli logi pokazują powtarzające się `status=408 Request Time-out Connection was lost`, dostrój
    czasy gniazda Baileys w `web.whatsapp`. Zacznij od skrócenia
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
    openclaw channels status --probe
    openclaw doctor
    openclaw logs --follow
    openclaw gateway status
    ```

    Jeśli pętla utrzymuje się po naprawieniu łączności hosta i czasów, wykonaj kopię zapasową
    katalogu uwierzytelniania konta i ponownie połącz to konto:

    ```bash
    cp -a ~/.openclaw/credentials/whatsapp/<accountId> \
      ~/.openclaw/credentials/whatsapp/<accountId>.bak
    openclaw channels logout --channel whatsapp --account <accountId>
    openclaw channels login --channel whatsapp --account <accountId>
    ```

    Jeśli `~/.openclaw/logs/whatsapp-health.log` mówi `Gateway inactive`, ale
    `openclaw gateway status` i `openclaw channels status --probe` pokazują, że
    gateway i WhatsApp są zdrowe, uruchom `openclaw doctor`. W systemie Linux doctor
    ostrzega o starszych wpisach crontab, które nadal wywołują
    `~/.openclaw/bin/ensure-whatsapp.sh`; usuń te nieaktualne wpisy za pomocą
    `crontab -e`, ponieważ cron może nie mieć środowiska magistrali użytkownika systemd i
    sprawiać, że ten stary skrypt błędnie raportuje zdrowie gateway.

    W razie potrzeby ponownie połącz przez `channels login`.

  </Accordion>

  <Accordion title="Logowanie QR przekracza limit czasu za proxy">
    Objaw: `openclaw channels login --channel whatsapp` kończy się niepowodzeniem przed pokazaniem używalnego kodu QR z `status=408 Request Time-out` albo rozłączeniem gniazda TLS.

    Logowanie WhatsApp Web używa standardowego środowiska proxy hosta gateway (`HTTPS_PROXY`, `HTTP_PROXY`, warianty małymi literami i `NO_PROXY`). Sprawdź, czy proces gateway dziedziczy środowisko proxy i czy `NO_PROXY` nie pasuje do `mmg.whatsapp.net`.

  </Accordion>

  <Accordion title="Brak aktywnego nasłuchiwacza podczas wysyłania">
    Wysyłki wychodzące szybko kończą się niepowodzeniem, gdy nie istnieje aktywny nasłuchiwacz gateway dla konta docelowego.

    Upewnij się, że gateway działa i konto jest połączone.

  </Accordion>

  <Accordion title="Odpowiedź pojawia się w transkrypcie, ale nie w WhatsApp">
    Wiersze transkryptu zapisują to, co wygenerował agent. Dostarczenie do WhatsApp jest sprawdzane oddzielnie: OpenClaw traktuje automatyczną odpowiedź jako wysłaną dopiero po tym, jak Baileys zwróci identyfikator wiadomości wychodzącej dla co najmniej jednej widocznej wysyłki tekstu lub multimediów.

    Reakcje potwierdzenia są niezależnymi potwierdzeniami przed odpowiedzią. Udana reakcja nie dowodzi, że późniejsza odpowiedź tekstowa lub multimedialna została zaakceptowana przez WhatsApp.

    Sprawdź logi gateway pod kątem `auto-reply delivery failed` albo `auto-reply was not accepted by WhatsApp provider`.

  </Accordion>

  <Accordion title="Wiadomości grupowe są nieoczekiwanie ignorowane">
    Sprawdź w tej kolejności:

    - `groupPolicy`
    - `groupAllowFrom` / `allowFrom`
    - wpisy listy dozwolonych `groups`
    - bramkowanie wzmianką (`requireMention` + wzorce wzmianki)
    - zduplikowane klucze w `openclaw.json` (JSON5): późniejsze wpisy nadpisują wcześniejsze, więc zachowaj jeden `groupPolicy` na zakres

    Jeśli `channels.whatsapp.groups` istnieje, WhatsApp nadal może obserwować wiadomości z innych grup, ale OpenClaw odrzuca je przed trasowaniem sesji. Dodaj JID grupy do `channels.whatsapp.groups` albo dodaj `groups["*"]`, aby dopuścić wszystkie grupy, zachowując autoryzację nadawcy w `groupPolicy` i `groupAllowFrom`.

  </Accordion>

  <Accordion title="Ostrzeżenie środowiska uruchomieniowego Bun">
    Środowisko uruchomieniowe gateway WhatsApp powinno używać Node. Bun jest oznaczony jako niezgodny ze stabilnym działaniem gateway WhatsApp/Telegram.
  </Accordion>
</AccordionGroup>

## Prompty systemowe

WhatsApp obsługuje prompty systemowe w stylu Telegram dla grup i czatów bezpośrednich przez mapy `groups` i `direct`.

Hierarchia rozstrzygania dla wiadomości grupowych:

Efektywna mapa `groups` jest ustalana najpierw: jeśli konto definiuje własne `groups`, w pełni zastępuje główną mapę `groups` (bez głębokiego scalania). Wyszukiwanie promptu działa potem na wynikowej pojedynczej mapie:

1. **Prompt systemowy specyficzny dla grupy** (`groups["<groupId>"].systemPrompt`): używany, gdy konkretny wpis grupy istnieje w mapie **i** jego klucz `systemPrompt` jest zdefiniowany. Jeśli `systemPrompt` jest pustym ciągiem (`""`), wildcard jest tłumiony i żaden prompt systemowy nie jest stosowany.
2. **Prompt systemowy wildcard grupy** (`groups["*"].systemPrompt`): używany, gdy konkretny wpis grupy jest całkowicie nieobecny w mapie albo gdy istnieje, ale nie definiuje klucza `systemPrompt`.

Hierarchia rozstrzygania dla wiadomości bezpośrednich:

Efektywna mapa `direct` jest ustalana najpierw: jeśli konto definiuje własne `direct`, w pełni zastępuje główną mapę `direct` (bez głębokiego scalania). Wyszukiwanie promptu działa potem na wynikowej pojedynczej mapie:

1. **Prompt systemowy specyficzny dla czatu bezpośredniego** (`direct["<peerId>"].systemPrompt`): używany, gdy konkretny wpis rozmówcy istnieje w mapie **i** jego klucz `systemPrompt` jest zdefiniowany. Jeśli `systemPrompt` jest pustym ciągiem (`""`), wildcard jest tłumiony i żaden prompt systemowy nie jest stosowany.
2. **Prompt systemowy wildcard czatu bezpośredniego** (`direct["*"].systemPrompt`): używany, gdy konkretny wpis rozmówcy jest całkowicie nieobecny w mapie albo gdy istnieje, ale nie definiuje klucza `systemPrompt`.

<Note>
`dms` pozostaje lekkim zasobnikiem nadpisania historii per DM (`dms.<id>.historyLimit`). Nadpisania promptów znajdują się w `direct`.
</Note>

**Różnica względem zachowania Telegram z wieloma kontami:** W Telegram główne `groups` jest celowo tłumione dla wszystkich kont w konfiguracji wielokontowej — nawet kont, które nie definiują własnego `groups` — aby zapobiec odbieraniu przez bota wiadomości grupowych z grup, do których nie należy. WhatsApp nie stosuje tej ochrony: główne `groups` i główne `direct` są zawsze dziedziczone przez konta, które nie definiują nadpisania na poziomie konta, niezależnie od liczby skonfigurowanych kont. W konfiguracji WhatsApp z wieloma kontami, jeśli chcesz promptów grupowych lub bezpośrednich per konto, zdefiniuj pełną mapę jawnie pod każdym kontem zamiast polegać na domyślnych ustawieniach poziomu głównego.

Ważne zachowanie:

- `channels.whatsapp.groups` jest zarówno mapą konfiguracji per grupa, jak i listą dozwolonych grup na poziomie czatu. W zakresie głównym lub konta `groups["*"]` oznacza „wszystkie grupy są dopuszczone” dla tego zakresu.
- Dodawaj wildcard grupy `systemPrompt` tylko wtedy, gdy już chcesz, aby ten zakres dopuszczał wszystkie grupy. Jeśli nadal chcesz, aby kwalifikował się tylko stały zestaw identyfikatorów grup, nie używaj `groups["*"]` jako domyślnego promptu. Zamiast tego powtórz prompt przy każdym jawnie dozwolonym wpisie grupy.
- Dopuszczenie grupy i autoryzacja nadawcy są osobnymi sprawdzeniami. `groups["*"]` poszerza zestaw grup, które mogą dotrzeć do obsługi grup, ale samo w sobie nie autoryzuje każdego nadawcy w tych grupach. Dostęp nadawcy jest nadal kontrolowany oddzielnie przez `channels.whatsapp.groupPolicy` i `channels.whatsapp.groupAllowFrom`.
- `channels.whatsapp.direct` nie ma tego samego efektu ubocznego dla DM. `direct["*"]` zapewnia tylko domyślną konfigurację czatu bezpośredniego po tym, jak DM zostanie już dopuszczony przez `dmPolicy` oraz `allowFrom` albo reguły magazynu parowania.

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

Podstawowa dokumentacja:

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
