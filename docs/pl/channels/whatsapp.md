---
read_when:
    - Praca nad zachowaniem kanału WhatsApp/web lub routingiem skrzynki odbiorczej
summary: Obsługa kanału WhatsApp, kontrola dostępu, zachowanie dostarczania i operacje
title: WhatsApp
x-i18n:
    generated_at: "2026-06-27T17:14:58Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 88f81adc38bd64d1e35f382dfc209e690c059d52e522e5cbdf77d1da45c9d15f
    source_path: channels/whatsapp.md
    workflow: 16
---

Status: gotowe do użycia produkcyjnego przez WhatsApp Web (Baileys). Gateway zarządza połączonymi sesjami.

## Instalacja (na żądanie)

- Onboarding (`openclaw onboard`) oraz `openclaw channels add --channel whatsapp`
  proszą o zainstalowanie Plugin WhatsApp przy pierwszym wyborze.
- `openclaw channels login --channel whatsapp` także oferuje przepływ instalacji, gdy
  Plugin nie jest jeszcze obecny.
- Kanał deweloperski + checkout git: domyślnie używa lokalnej ścieżki Plugin.
- Stable/Beta: najpierw instaluje oficjalny Plugin `@openclaw/whatsapp` z ClawHub,
  z npm jako rozwiązaniem zapasowym.
- Runtime WhatsApp jest dystrybuowany poza głównym pakietem npm OpenClaw, aby
  zależności runtime specyficzne dla WhatsApp pozostały przy zewnętrznym Plugin.

Instalacja ręczna pozostaje dostępna:

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
    Diagnostyka międzykanałowa i instrukcje naprawcze.
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

    Obecne logowanie jest oparte na kodzie QR. W środowiskach zdalnych lub bezgłowych upewnij się, że
    masz niezawodny sposób dostarczenia aktywnego kodu QR do telefonu, który go zeskanuje,
    zanim rozpoczniesz logowanie.

    Dla konkretnego konta:

```bash
openclaw channels login --channel whatsapp --account work
```

    Aby podłączyć istniejący/niestandardowy katalog auth WhatsApp Web przed logowaniem:

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
OpenClaw zaleca uruchamianie WhatsApp na osobnym numerze, gdy to możliwe. (Metadane kanału i przepływ konfiguracji są zoptymalizowane pod taki układ, ale konfiguracje z numerem osobistym są również obsługiwane).
</Note>

<Warning>
Obecny przepływ konfiguracji WhatsApp obsługuje wyłącznie kod QR. Kody QR renderowane w terminalu, zrzuty ekranu,
pliki PDF lub załączniki czatu mogą wygasnąć albo stać się nieczytelne podczas przekazywania
ze zdalnej maszyny. W przypadku hostów zdalnych/bezgłowych preferuj bezpośredni sposób przekazania obrazu QR
zamiast ręcznego przechwytywania terminala.
</Warning>

## Wzorce wdrożenia

<AccordionGroup>
  <Accordion title="Dedykowany numer (zalecane)">
    To najczystszy tryb operacyjny:

    - osobna tożsamość WhatsApp dla OpenClaw
    - czytelniejsze listy dozwolonych DM i granice routingu
    - mniejsze ryzyko pomyłek z czatem do samego siebie

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
    Onboarding obsługuje tryb numeru osobistego i zapisuje bazową konfigurację przyjazną dla czatu do samego siebie:

    - `dmPolicy: "allowlist"`
    - `allowFrom` obejmuje Twój numer osobisty
    - `selfChatMode: true`

    W runtime zabezpieczenia czatu do samego siebie opierają się na połączonym własnym numerze i `allowFrom`.

  </Accordion>

  <Accordion title="Zakres kanału tylko WhatsApp Web">
    Kanał platformy komunikacyjnej w obecnej architekturze kanałów OpenClaw jest oparty na WhatsApp Web (`Baileys`).

    We wbudowanym rejestrze kanałów czatu nie ma osobnego kanału wiadomości Twilio WhatsApp.

  </Accordion>
</AccordionGroup>

## Model runtime

- Gateway zarządza socketem WhatsApp i pętlą ponownego łączenia.
- Watchdog ponownego łączenia używa aktywności transportu WhatsApp Web, a nie tylko wolumenu przychodzących wiadomości aplikacji, więc cicha sesja połączonego urządzenia nie jest restartowana wyłącznie dlatego, że nikt ostatnio nie wysłał wiadomości. Dłuższy limit ciszy aplikacji nadal wymusza ponowne połączenie, jeśli ramki transportu nadal przychodzą, ale żadne wiadomości aplikacji nie są obsługiwane w oknie watchdoga; po przejściowym ponownym połączeniu dla niedawno aktywnej sesji ta kontrola ciszy aplikacji używa normalnego limitu czasu wiadomości w pierwszym oknie odzyskiwania.
- Czasy socketu Baileys są jawne pod `web.whatsapp.*`: `keepAliveIntervalMs` kontroluje pingi aplikacyjne WhatsApp Web, `connectTimeoutMs` kontroluje limit czasu początkowego uzgadniania połączenia, a `defaultQueryTimeoutMs` kontroluje oczekiwania zapytań Baileys oraz lokalne limity operacji wysyłania/presence wychodzących i potwierdzeń odczytu przychodzących w OpenClaw.
- Wysyłki wychodzące wymagają aktywnego listenera WhatsApp dla docelowego konta.
- Wysyłki grupowe dołączają natywne metadane wzmianek dla tokenów `@+<digits>` i `@<digits>` w tekście oraz podpisach mediów, gdy token pasuje do bieżących metadanych uczestnika WhatsApp, w tym grup opartych na LID.
- Czaty statusu i broadcast są ignorowane (`@status`, `@broadcast`).
- Watchdog ponownego łączenia śledzi aktywność transportu WhatsApp Web, a nie tylko wolumen przychodzących wiadomości aplikacji: ciche sesje połączonego urządzenia pozostają aktywne, dopóki ramki transportu nadal przychodzą, ale zastój transportu wymusza ponowne połączenie znacznie wcześniej niż późniejsza ścieżka zdalnego rozłączenia.
- Czaty bezpośrednie używają reguł sesji DM (`session.dmScope`; domyślne `main` zwija DM do głównej sesji agenta).
- Sesje grupowe są izolowane (`agent:<agentId>:whatsapp:group:<jid>`).
- WhatsApp Channels/Newsletters mogą być jawnymi celami wychodzącymi ze swoim natywnym JID `@newsletter`. Wysyłki wychodzące do newslettera używają metadanych sesji kanału (`agent:<agentId>:whatsapp:channel:<jid>`), a nie semantyki sesji DM.
- Transport WhatsApp Web honoruje standardowe zmienne środowiskowe proxy na hoście gateway (`HTTPS_PROXY`, `HTTP_PROXY`, `NO_PROXY` / warianty pisane małymi literami). Preferuj konfigurację proxy na poziomie hosta zamiast ustawień proxy WhatsApp specyficznych dla kanału.
- Gdy `messages.removeAckAfterReply` jest włączone, OpenClaw czyści reakcję potwierdzenia WhatsApp po dostarczeniu widocznej odpowiedzi.

## Monity zatwierdzania

WhatsApp może renderować monity zatwierdzania exec i Plugin z reakcjami `👍` / `👎`. Dostarczaniem
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
transport; nie wysyła monitów zatwierdzania, chyba że odpowiednia rodzina zatwierdzeń jest włączona
i kieruje do WhatsApp. Tryb sesji dostarcza natywne zatwierdzenia emoji tylko dla zatwierdzeń, które
pochodzą z WhatsApp. Tryb celu używa współdzielonego potoku przekazywania dla jawnych celów WhatsApp
i nie tworzy osobnego fanoutu DM do zatwierdzających.

Reakcje zatwierdzania WhatsApp wymagają jawnych zatwierdzających WhatsApp z `allowFrom` lub `"*"`.
`defaultTo` kontroluje zwykłe domyślne cele wiadomości; nie jest zatwierdzającym. Ręczne
polecenia `/approve` nadal przechodzą przez normalną ścieżkę autoryzacji nadawcy WhatsApp przed
rozstrzygnięciem zatwierdzenia.

## Hooki Plugin i prywatność

Wiadomości przychodzące WhatsApp mogą zawierać osobistą treść wiadomości, numery telefonów,
identyfikatory grup, nazwy nadawców i pola korelacji sesji. Z tego powodu
WhatsApp nie rozgłasza przychodzących payloadów hooka `message_received` do Plugin,
chyba że jawnie się na to zdecydujesz:

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

Włączaj to tylko dla Plugin, którym ufasz na tyle, aby otrzymywały przychodzącą treść wiadomości
WhatsApp oraz identyfikatory.

## Kontrola dostępu i aktywacja

<Tabs>
  <Tab title="Polityka DM">
    `channels.whatsapp.dmPolicy` kontroluje dostęp do czatu bezpośredniego:

    - `pairing` (domyślnie)
    - `allowlist`
    - `open` (wymaga, aby `allowFrom` obejmowało `"*"`)
    - `disabled`

    `allowFrom` akceptuje numery w stylu E.164 (normalizowane wewnętrznie).

    `allowFrom` to lista kontroli dostępu nadawców DM. Nie blokuje jawnych wysyłek wychodzących do JID grup WhatsApp ani JID kanałów `@newsletter`.

    Nadpisanie dla wielu kont: `channels.whatsapp.accounts.<id>.dmPolicy` (oraz `allowFrom`) mają pierwszeństwo przed domyślnymi ustawieniami poziomu kanału dla tego konta.

    Szczegóły zachowania runtime:

    - parowania są utrwalane w magazynie dozwolonych kanału i scalane ze skonfigurowanym `allowFrom`
    - zaplanowana automatyzacja i awaryjny wybór odbiorców Heartbeat używają jawnych celów dostarczania albo skonfigurowanego `allowFrom`; zatwierdzenia parowania DM nie są domyślnymi odbiorcami Cron ani Heartbeat
    - jeśli nie skonfigurowano listy dozwolonych, połączony własny numer jest domyślnie dozwolony
    - OpenClaw nigdy automatycznie nie paruje wychodzących DM `fromMe` (wiadomości wysyłanych do siebie z połączonego urządzenia)

  </Tab>

  <Tab title="Polityka grup + listy dozwolonych">
    Dostęp grupowy ma dwie warstwy:

    1. **Lista dozwolonych członkostwa w grupach** (`channels.whatsapp.groups`)
       - jeśli `groups` jest pominięte, wszystkie grupy kwalifikują się
       - jeśli `groups` jest obecne, działa jako lista dozwolonych grup (`"*"` dozwolone)

    2. **Polityka nadawców grupowych** (`channels.whatsapp.groupPolicy` + `groupAllowFrom`)
       - `open`: lista dozwolonych nadawców pominięta
       - `allowlist`: nadawca musi pasować do `groupAllowFrom` (lub `*`)
       - `disabled`: blokuj wszystkie przychodzące wiadomości grupowe

    Awaryjne użycie listy dozwolonych nadawców:

    - jeśli `groupAllowFrom` nie jest ustawione, runtime wraca do `allowFrom`, gdy jest dostępne
    - listy dozwolonych nadawców są oceniane przed aktywacją przez wzmiankę/odpowiedź

    Uwaga: jeśli blok `channels.whatsapp` w ogóle nie istnieje, awaryjna polityka grup runtime to `allowlist` (z logiem ostrzegawczym), nawet jeśli ustawiono `channels.defaults.groupPolicy`.

  </Tab>

  <Tab title="Wzmianki + /activation">
    Odpowiedzi grupowe domyślnie wymagają wzmianki.

    Wykrywanie wzmianek obejmuje:

    - jawne wzmianki WhatsApp o tożsamości bota
    - skonfigurowane wzorce regex wzmianek (`agents.list[].groupChat.mentionPatterns`, awaryjnie `messages.groupChat.mentionPatterns`)
    - transkrypcje przychodzących notatek głosowych dla autoryzowanych wiadomości grupowych
    - niejawne wykrywanie odpowiedzi do bota (nadawca odpowiedzi pasuje do tożsamości bota)

    Uwaga bezpieczeństwa:

    - cytat/odpowiedź spełnia tylko warunek wzmianki; **nie** przyznaje autoryzacji nadawcy
    - przy `groupPolicy: "allowlist"` nadawcy spoza listy dozwolonych nadal są blokowani, nawet jeśli odpowiadają na wiadomość użytkownika z listy dozwolonych

    Polecenie aktywacji na poziomie sesji:

    - `/activation mention`
    - `/activation always`

    `activation` aktualizuje stan sesji (nie globalną konfigurację). Jest ograniczone do właściciela.

  </Tab>
</Tabs>

## Skonfigurowane powiązania ACP

WhatsApp obsługuje trwałe powiązania ACP z wpisami najwyższego poziomu `bindings[]`:

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
- Listy dozwolonych grup, zasady nadawców oraz bramkowanie wzmianką lub aktywacją działają, zanim OpenClaw upewni się, że skonfigurowana sesja ACP istnieje.
- Dopasowane skonfigurowane powiązanie ACP jest właścicielem trasy. Grupy rozgłoszeniowe WhatsApp nie rozsyłają tej tury do zwykłych sesji WhatsApp.

## Zachowanie numeru osobistego i czatu z samym sobą

Gdy powiązany własny numer jest też obecny w `allowFrom`, zabezpieczenia czatu WhatsApp z samym sobą zostają aktywowane:

- pomijaj potwierdzenia odczytu dla tur czatu z samym sobą
- ignoruj automatyczne wyzwalanie po mention-JID, które w przeciwnym razie pingowałoby Ciebie
- jeśli `messages.responsePrefix` nie jest ustawione, odpowiedzi w czacie z samym sobą domyślnie używają `[{identity.name}]` lub `[openclaw]`

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
    Gdy cytowany cel odpowiedzi jest multimedium możliwym do pobrania, OpenClaw zapisuje go przez
    normalny magazyn multimediów przychodzących i udostępnia jako `MediaPath`/`MediaType`, aby
    agent mógł sprawdzić wskazany obraz zamiast widzieć tylko
    `<media:image>`.

  </Accordion>

  <Accordion title="Symbole zastępcze multimediów oraz wyodrębnianie lokalizacji/kontaktów">
    Wiadomości przychodzące zawierające wyłącznie multimedia są normalizowane z symbolami zastępczymi, takimi jak:

    - `<media:image>`
    - `<media:video>`
    - `<media:audio>`
    - `<media:document>`
    - `<media:sticker>`

    Autoryzowane grupowe notatki głosowe są transkrybowane przed bramkowaniem wzmianki, gdy
    treść to tylko `<media:audio>`, więc wypowiedzenie wzmianki bota w notatce głosowej może
    wyzwolić odpowiedź. Jeśli transkrypt nadal nie wspomina bota,
    transkrypt jest zachowywany w oczekującej historii grupy zamiast surowego symbolu zastępczego.

    Treści lokalizacji używają zwięzłego tekstu współrzędnych. Etykiety/komentarze lokalizacji oraz szczegóły kontaktu/vCard są renderowane jako ogrodzone niezaufane metadane, a nie jako tekst promptu w treści.

  </Accordion>

  <Accordion title="Wstrzykiwanie oczekującej historii grupy">
    W przypadku grup nieprzetworzone wiadomości mogą być buforowane i wstrzykiwane jako kontekst, gdy bot zostanie ostatecznie wyzwolony.

    - limit domyślny: `50`
    - konfiguracja: `channels.whatsapp.historyLimit`
    - rezerwowo: `messages.groupChat.historyLimit`
    - `0` wyłącza

    Markery wstrzyknięcia:

    - `[Wiadomości czatu od Twojej ostatniej odpowiedzi - dla kontekstu]`
    - `[Bieżąca wiadomość - odpowiedz na nią]`

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

    Tury czatu z samym sobą pomijają potwierdzenia odczytu, nawet gdy są globalnie włączone.

  </Accordion>
</AccordionGroup>

## Dostarczanie, dzielenie na części i multimedia

<AccordionGroup>
  <Accordion title="Dzielenie tekstu na części">
    - domyślny limit części: `channels.whatsapp.textChunkLimit = 4000`
    - `channels.whatsapp.chunkMode = "length" | "newline"`
    - tryb `newline` preferuje granice akapitów (puste wiersze), a następnie wraca do dzielenia bezpiecznego długościowo

  </Accordion>

  <Accordion title="Zachowanie multimediów wychodzących">
    - obsługuje ładunki obrazów, wideo, audio (notatka głosowa PTT) i dokumentów
    - multimedia audio są wysyłane przez ładunek Baileys `audio` z `ptt: true`, więc klienci WhatsApp renderują je jako notatkę głosową push-to-talk
    - ładunki odpowiedzi zachowują `audioAsVoice`; wyjście notatki głosowej TTS dla WhatsApp pozostaje na tej ścieżce PTT, nawet gdy dostawca zwraca MP3 lub WebM
    - natywne audio Ogg/Opus jest wysyłane jako `audio/ogg; codecs=opus` dla zgodności z notatkami głosowymi
    - audio inne niż Ogg, w tym wyjście MP3/WebM z Microsoft Edge TTS, jest transkodowane za pomocą `ffmpeg` do mono Ogg/Opus 48 kHz przed dostarczeniem PTT
    - `/tts latest` wysyła najnowszą odpowiedź asystenta jako jedną notatkę głosową i pomija ponowne wysyłki tej samej odpowiedzi; `/tts chat on|off|default` kontroluje automatyczne TTS dla bieżącego czatu WhatsApp
    - odtwarzanie animowanych GIF-ów jest obsługiwane przez `gifPlayback: true` przy wysyłaniu wideo
    - `forceDocument` / `asDocument` wysyła wychodzące obrazy, GIF-y i wideo przez ładunek dokumentu Baileys, aby uniknąć kompresji multimediów WhatsApp, zachowując rozstrzygniętą nazwę pliku i typ MIME
    - podpisy są stosowane do pierwszego elementu multimedialnego podczas wysyłania ładunków odpowiedzi z wieloma multimediami, z wyjątkiem notatek głosowych PTT, które wysyłają najpierw audio, a widoczny tekst osobno, ponieważ klienci WhatsApp nie renderują konsekwentnie podpisów notatek głosowych
    - źródłem multimediów może być HTTP(S), `file://` lub ścieżki lokalne

  </Accordion>

  <Accordion title="Limity rozmiaru multimediów i zachowanie rezerwowe">
    - limit zapisu multimediów przychodzących: `channels.whatsapp.mediaMaxMb` (domyślnie `50`)
    - limit wysyłania multimediów wychodzących: `channels.whatsapp.mediaMaxMb` (domyślnie `50`)
    - nadpisania dla kont używają `channels.whatsapp.accounts.<accountId>.mediaMaxMb`
    - obrazy są automatycznie optymalizowane (zmiana rozmiaru/przegląd jakości), aby zmieścić się w limitach, chyba że `forceDocument` / `asDocument` żąda dostarczenia jako dokument
    - po błędzie wysyłania multimediów zachowanie rezerwowe dla pierwszego elementu wysyła ostrzeżenie tekstowe zamiast po cichu porzucać odpowiedź

  </Accordion>
</AccordionGroup>

## Cytowanie odpowiedzi

WhatsApp obsługuje natywne cytowanie odpowiedzi, w którym odpowiedzi wychodzące widocznie cytują wiadomość przychodzącą. Kontroluj to za pomocą `channels.whatsapp.replyToMode`.

| Wartość     | Zachowanie                                                            |
| ----------- | --------------------------------------------------------------------- |
| `"off"`     | Nigdy nie cytuj; wyślij jako zwykłą wiadomość                         |
| `"first"`   | Cytuj tylko pierwszą część odpowiedzi wychodzącej                     |
| `"all"`     | Cytuj każdą część odpowiedzi wychodzącej                              |
| `"batched"` | Cytuj kolejkowane odpowiedzi wsadowe, pozostawiając natychmiastowe odpowiedzi bez cytatu |

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

| Poziom        | Reakcje potwierdzenia | Reakcje inicjowane przez agenta | Opis                                             |
| ------------- | --------------------- | ------------------------------- | ------------------------------------------------ |
| `"off"`       | Nie                   | Nie                             | Brak jakichkolwiek reakcji                       |
| `"ack"`       | Tak                   | Nie                             | Tylko reakcje potwierdzenia (potwierdzenie przed odpowiedzią) |
| `"minimal"`   | Tak                   | Tak (zachowawczo)               | Potwierdzenia + reakcje agenta z zachowawczymi wskazówkami |
| `"extensive"` | Tak                   | Tak (zalecane)                  | Potwierdzenia + reakcje agenta z zalecającymi wskazówkami |

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
Reakcje potwierdzenia są bramkowane przez `reactionLevel` — są pomijane, gdy `reactionLevel` to `"off"`.

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
- jeśli `ackReaction` jest obecne bez `emoji`, WhatsApp używa emoji tożsamości trasowanego agenta, z wartością rezerwową "👀"; pomiń `ackReaction` lub ustaw `emoji: ""`, aby nie wysyłać reakcji potwierdzenia
- błędy są logowane, ale nie blokują normalnego dostarczania odpowiedzi
- tryb grupowy `mentions` reaguje na tury wyzwolone wzmianką; aktywacja grupowa `always` działa jako obejście tego sprawdzenia
- WhatsApp używa `channels.whatsapp.ackReaction` (starsze `messages.ackReaction` nie jest tutaj używane)

## Reakcje statusu cyklu życia

Ustaw `messages.statusReactions.enabled: true`, aby WhatsApp zastępował reakcję potwierdzenia podczas tury zamiast pozostawiać statyczne emoji potwierdzenia. Po włączeniu OpenClaw używa tego samego slotu reakcji wiadomości przychodzącej dla stanów cyklu życia, takich jak w kolejce, myślenie, aktywność narzędzia, Compaction, gotowe i błąd.

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

- `channels.whatsapp.ackReaction` nadal kontroluje, czy reakcje statusu kwalifikują się do wiadomości bezpośrednich i grup.
- Reakcja statusu w kolejce używa tego samego efektywnego emoji potwierdzenia co zwykłe reakcje potwierdzenia.
- WhatsApp ma jeden slot reakcji bota na wiadomość, więc aktualizacje cyklu życia zastępują bieżącą reakcję w miejscu.
- `messages.removeAckAfterReply: true` czyści końcową reakcję statusu po skonfigurowanym czasie utrzymania stanu gotowe/błąd.
- Kategorie emoji narzędzi obejmują `tool`, `coding`, `web`, `deploy`, `build` i `concierge`.

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

    Gdy Gateway jest osiągalny, wylogowanie najpierw zatrzymuje aktywny nasłuchiwacz WhatsApp dla wybranego konta, aby powiązana sesja nie odbierała dalej wiadomości aż do następnego restartu. `openclaw channels remove --channel whatsapp` również zatrzymuje aktywnego nasłuchiwacza przed wyłączeniem lub usunięciem konfiguracji konta.

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
  <Accordion title="Niepowiązane (wymagany QR)">
    Objaw: status kanału zgłasza brak powiązania.

    Naprawa:

    ```bash
    openclaw channels login --channel whatsapp
    openclaw channels status
    ```

  </Accordion>

  <Accordion title="Powiązane, ale rozłączone / pętla ponownego łączenia">
    Objaw: powiązane konto z powtarzającymi się rozłączeniami lub próbami ponownego połączenia.

    Ciche konta mogą pozostać połączone po normalnym limicie czasu wiadomości; watchdog
    uruchamia ponownie, gdy aktywność transportu WhatsApp Web ustaje, gniazdo zostaje zamknięte lub
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
    gateway i WhatsApp działają poprawnie, uruchom `openclaw doctor`. W systemie Linux doctor
    ostrzega o starszych wpisach crontab, które nadal wywołują
    `~/.openclaw/bin/ensure-whatsapp.sh`; usuń te nieaktualne wpisy za pomocą
    `crontab -e`, ponieważ cron może nie mieć środowiska magistrali użytkownika systemd i
    sprawiać, że stary skrypt błędnie raportuje stan gateway.

    W razie potrzeby połącz ponownie za pomocą `channels login`.

  </Accordion>

  <Accordion title="Logowanie QR przekracza limit czasu za proxy">
    Objaw: `openclaw channels login --channel whatsapp` kończy się niepowodzeniem przed pokazaniem użytecznego kodu QR z `status=408 Request Time-out` albo rozłączeniem gniazda TLS.

    Logowanie WhatsApp Web używa standardowego środowiska proxy hosta gateway (`HTTPS_PROXY`, `HTTP_PROXY`, warianty pisane małymi literami oraz `NO_PROXY`). Sprawdź, czy proces gateway dziedziczy środowisko proxy i czy `NO_PROXY` nie pasuje do `mmg.whatsapp.net`.

  </Accordion>

  <Accordion title="Brak aktywnego listenera podczas wysyłania">
    Wysyłki wychodzące szybko kończą się niepowodzeniem, gdy dla konta docelowego nie istnieje aktywny listener gateway.

    Upewnij się, że gateway działa i konto jest połączone.

  </Accordion>

  <Accordion title="Odpowiedź pojawia się w transkrypcie, ale nie w WhatsApp">
    Wiersze transkryptu zapisują to, co wygenerował agent. Dostarczanie do WhatsApp jest sprawdzane osobno: OpenClaw traktuje automatyczną odpowiedź jako wysłaną dopiero wtedy, gdy Baileys zwróci identyfikator wiadomości wychodzącej dla co najmniej jednej widocznej wysyłki tekstu lub multimediów.

    Reakcje potwierdzające są niezależnymi potwierdzeniami przed odpowiedzią. Udana reakcja nie dowodzi, że późniejsza odpowiedź tekstowa lub multimedialna została zaakceptowana przez WhatsApp.

    Sprawdź logi gateway pod kątem `auto-reply delivery failed` lub `auto-reply was not accepted by WhatsApp provider`.

  </Accordion>

  <Accordion title="Wiadomości grupowe są nieoczekiwanie ignorowane">
    Sprawdź w tej kolejności:

    - `groupPolicy`
    - `groupAllowFrom` / `allowFrom`
    - wpisy listy dozwolonych `groups`
    - bramkowanie wzmianek (`requireMention` + wzorce wzmianek)
    - zduplikowane klucze w `openclaw.json` (JSON5): późniejsze wpisy zastępują wcześniejsze, więc zachowaj pojedynczy `groupPolicy` dla każdego zakresu

    Jeśli `channels.whatsapp.groups` jest obecne, WhatsApp nadal może obserwować wiadomości z innych grup, ale OpenClaw odrzuca je przed trasowaniem sesji. Dodaj JID grupy do `channels.whatsapp.groups` albo dodaj `groups["*"]`, aby dopuścić wszystkie grupy, zachowując autoryzację nadawcy pod `groupPolicy` i `groupAllowFrom`.

  </Accordion>

  <Accordion title="Ostrzeżenie środowiska uruchomieniowego Bun">
    Środowisko uruchomieniowe gateway WhatsApp powinno używać Node. Bun jest oznaczony jako niezgodny ze stabilnym działaniem gateway WhatsApp/Telegram.
  </Accordion>
</AccordionGroup>

## Prompty systemowe

WhatsApp obsługuje prompty systemowe w stylu Telegram dla grup i czatów bezpośrednich przez mapy `groups` i `direct`.

Hierarchia rozstrzygania dla wiadomości grupowych:

Efektywna mapa `groups` jest ustalana jako pierwsza: jeśli konto definiuje własne `groups`, całkowicie zastępuje ono główną mapę `groups` (bez głębokiego scalania). Wyszukiwanie promptu działa następnie na wynikowej pojedynczej mapie:

1. **Prompt systemowy konkretnej grupy** (`groups["<groupId>"].systemPrompt`): używany, gdy konkretny wpis grupy istnieje w mapie **i** jego klucz `systemPrompt` jest zdefiniowany. Jeśli `systemPrompt` jest pustym ciągiem (`""`), symbol wieloznaczny jest tłumiony i nie jest stosowany żaden prompt systemowy.
2. **Prompt systemowy wieloznaczny dla grup** (`groups["*"].systemPrompt`): używany, gdy konkretny wpis grupy jest całkowicie nieobecny w mapie albo gdy istnieje, ale nie definiuje klucza `systemPrompt`.

Hierarchia rozstrzygania dla wiadomości bezpośrednich:

Efektywna mapa `direct` jest ustalana jako pierwsza: jeśli konto definiuje własne `direct`, całkowicie zastępuje ono główną mapę `direct` (bez głębokiego scalania). Wyszukiwanie promptu działa następnie na wynikowej pojedynczej mapie:

1. **Prompt systemowy konkretnego czatu bezpośredniego** (`direct["<peerId>"].systemPrompt`): używany, gdy konkretny wpis rozmówcy istnieje w mapie **i** jego klucz `systemPrompt` jest zdefiniowany. Jeśli `systemPrompt` jest pustym ciągiem (`""`), symbol wieloznaczny jest tłumiony i nie jest stosowany żaden prompt systemowy.
2. **Prompt systemowy wieloznaczny dla czatów bezpośrednich** (`direct["*"].systemPrompt`): używany, gdy konkretny wpis rozmówcy jest całkowicie nieobecny w mapie albo gdy istnieje, ale nie definiuje klucza `systemPrompt`.

<Note>
`dms` pozostaje lekkim zasobnikiem nadpisań historii dla poszczególnych DM (`dms.<id>.historyLimit`). Nadpisania promptów znajdują się pod `direct`.
</Note>

**Różnica względem zachowania Telegram z wieloma kontami:** W Telegram główne `groups` jest celowo tłumione dla wszystkich kont w konfiguracji wielokontowej — nawet kont, które nie definiują własnego `groups` — aby zapobiec odbieraniu przez bota wiadomości grupowych z grup, do których nie należy. WhatsApp nie stosuje tej ochrony: główne `groups` i główne `direct` są zawsze dziedziczone przez konta, które nie definiują nadpisania na poziomie konta, niezależnie od liczby skonfigurowanych kont. W konfiguracji WhatsApp z wieloma kontami, jeśli chcesz promptów grupowych lub bezpośrednich per konto, zdefiniuj pełną mapę jawnie pod każdym kontem zamiast polegać na domyślnych ustawieniach poziomu głównego.

Ważne zachowanie:

- `channels.whatsapp.groups` jest zarówno mapą konfiguracji per grupa, jak i listą dozwolonych grup na poziomie czatu. W zakresie głównym albo konta `groups["*"]` oznacza „wszystkie grupy są dopuszczone” dla tego zakresu.
- Dodawaj wieloznaczny `systemPrompt` grupy tylko wtedy, gdy już chcesz, aby ten zakres dopuszczał wszystkie grupy. Jeśli nadal chcesz, aby kwalifikował się tylko stały zestaw identyfikatorów grup, nie używaj `groups["*"]` jako domyślnego promptu. Zamiast tego powtórz prompt przy każdym jawnie dozwolonym wpisie grupy.
- Dopuszczenie grupy i autoryzacja nadawcy to osobne sprawdzenia. `groups["*"]` poszerza zestaw grup, które mogą trafić do obsługi grupowej, ale samo w sobie nie autoryzuje każdego nadawcy w tych grupach. Dostęp nadawcy jest nadal kontrolowany osobno przez `channels.whatsapp.groupPolicy` i `channels.whatsapp.groupAllowFrom`.
- `channels.whatsapp.direct` nie ma takiego samego efektu ubocznego dla DM. `direct["*"]` zapewnia tylko domyślną konfigurację czatu bezpośredniego po tym, jak DM zostanie już dopuszczony przez `dmPolicy` plus `allowFrom` albo reguły magazynu parowania.

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
- prompty: `groups.<id>.systemPrompt`, `groups["*"].systemPrompt`, `direct.<id>.systemPrompt`, `direct["*"].systemPrompt`

## Powiązane

- [Parowanie](/pl/channels/pairing)
- [Grupy](/pl/channels/groups)
- [Bezpieczeństwo](/pl/gateway/security)
- [Trasowanie kanałów](/pl/channels/channel-routing)
- [Trasowanie wielu agentów](/pl/concepts/multi-agent)
- [Rozwiązywanie problemów](/pl/channels/troubleshooting)
