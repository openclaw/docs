---
read_when:
    - Praca nad zachowaniem kanału WhatsApp/web lub trasowaniem skrzynki odbiorczej
summary: Obsługa kanału WhatsApp, kontrola dostępu, zachowanie dostarczania i operacje
title: WhatsApp
x-i18n:
    generated_at: "2026-04-26T11:25:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: fd4217adb673bc4c071fc1bff6994fb214966c2b28fe59253a1a6f4b4b7fcdba
    source_path: channels/whatsapp.md
    workflow: 15
---

Status: gotowe do użycia produkcyjnego przez WhatsApp Web (Baileys). Gateway zarządza połączonymi sesjami.

## Instalacja (na żądanie)

- Onboarding (`openclaw onboard`) i `openclaw channels add --channel whatsapp`
  przy pierwszym wyborze proponują instalację Pluginu WhatsApp.
- `openclaw channels login --channel whatsapp` również oferuje proces instalacji, gdy
  Plugin nie jest jeszcze obecny.
- Kanał dev + repozytorium git: domyślnie używa lokalnej ścieżki Pluginu.
- Stable/Beta: domyślnie używa pakietu npm `@openclaw/whatsapp`.

Instalacja ręczna pozostaje dostępna:

```bash
openclaw plugins install @openclaw/whatsapp
```

<CardGroup cols={3}>
  <Card title="Parowanie" icon="link" href="/pl/channels/pairing">
    Domyślna polityka wiadomości prywatnych dla nieznanych nadawców to parowanie.
  </Card>
  <Card title="Rozwiązywanie problemów z kanałem" icon="wrench" href="/pl/channels/troubleshooting">
    Diagnostyka międzykanałowa i instrukcje naprawy.
  </Card>
  <Card title="Konfiguracja Gateway" icon="settings" href="/pl/gateway/configuration">
    Pełne wzorce konfiguracji kanałów i przykłady.
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

  <Step title="Uruchom Gateway">

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
OpenClaw zaleca, aby w miarę możliwości uruchamiać WhatsApp na osobnym numerze. (Metadane kanału i proces konfiguracji są zoptymalizowane pod taki scenariusz, ale konfiguracje z numerem prywatnym są również obsługiwane.)
</Note>

## Wzorce wdrożenia

<AccordionGroup>
  <Accordion title="Dedykowany numer (zalecane)">
    To najczystszy tryb operacyjny:

    - oddzielna tożsamość WhatsApp dla OpenClaw
    - wyraźniejsze listy dozwolone wiadomości prywatnych i granice trasowania
    - mniejsze ryzyko zamieszania z czatem własnym

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

  <Accordion title="Tryb awaryjny z numerem prywatnym">
    Onboarding obsługuje tryb numeru prywatnego i zapisuje bazową konfigurację przyjazną dla czatu własnego:

    - `dmPolicy: "allowlist"`
    - `allowFrom` zawiera Twój numer prywatny
    - `selfChatMode: true`

    Podczas działania zabezpieczenia czatu własnego opierają się na połączonym numerze własnym i `allowFrom`.

  </Accordion>

  <Accordion title="Zakres kanału tylko WhatsApp Web">
    Kanał platformy komunikacyjnej jest oparty na WhatsApp Web (`Baileys`) w obecnej architekturze kanałów OpenClaw.

    W wbudowanym rejestrze kanałów czatu nie ma osobnego kanału komunikacyjnego Twilio WhatsApp.

  </Accordion>
</AccordionGroup>

## Model działania

- Gateway zarządza gniazdem WhatsApp i pętlą ponownego łączenia.
- Wysyłki wychodzące wymagają aktywnego nasłuchu WhatsApp dla konta docelowego.
- Czaty statusowe i rozgłoszeniowe są ignorowane (`@status`, `@broadcast`).
- Czaty bezpośrednie używają reguł sesji wiadomości prywatnych (`session.dmScope`; domyślnie `main` zwija wiadomości prywatne do głównej sesji agenta).
- Sesje grupowe są izolowane (`agent:<agentId>:whatsapp:group:<jid>`).
- Transport WhatsApp Web respektuje standardowe zmienne środowiskowe proxy na hoście Gateway (`HTTPS_PROXY`, `HTTP_PROXY`, `NO_PROXY` / warianty małymi literami). Preferuj konfigurację proxy na poziomie hosta zamiast ustawień proxy specyficznych dla kanału WhatsApp.
- Gdy `messages.removeAckAfterReply` jest włączone, OpenClaw usuwa reakcję ack w WhatsApp po dostarczeniu widocznej odpowiedzi.

## Hooki Pluginów i prywatność

Przychodzące wiadomości WhatsApp mogą zawierać osobistą treść wiadomości, numery telefonów,
identyfikatory grup, nazwy nadawców oraz pola korelacji sesji. Z tego powodu
WhatsApp nie rozsyła przychodzących ładunków hooka `message_received` do Pluginów,
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

Możesz ograniczyć tę zgodę do jednego konta:

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

Włączaj to tylko dla Pluginów, którym ufasz w zakresie odbierania treści
przychodzących wiadomości WhatsApp i identyfikatorów.

## Kontrola dostępu i aktywacja

<Tabs>
  <Tab title="Polityka wiadomości prywatnych">
    `channels.whatsapp.dmPolicy` kontroluje dostęp do czatów bezpośrednich:

    - `pairing` (domyślnie)
    - `allowlist`
    - `open` (wymaga, aby `allowFrom` zawierało `"*"`)
    - `disabled`

    `allowFrom` akceptuje numery w stylu E.164 (wewnętrznie normalizowane).

    Nadpisanie dla wielu kont: `channels.whatsapp.accounts.<id>.dmPolicy` (oraz `allowFrom`) mają pierwszeństwo przed domyślnymi ustawieniami kanału dla tego konta.

    Szczegóły działania:

    - parowania są zapisywane w magazynie dozwolonych kanału i łączone ze skonfigurowanym `allowFrom`
    - jeśli nie skonfigurowano żadnej listy dozwolonej, połączony numer własny jest domyślnie dozwolony
    - OpenClaw nigdy nie paruje automatycznie wychodzących wiadomości prywatnych `fromMe` (wiadomości wysyłanych do siebie z połączonego urządzenia)

  </Tab>

  <Tab title="Polityka grup + listy dozwolone">
    Dostęp do grup ma dwie warstwy:

    1. **Lista dozwolonych członkostwa grupy** (`channels.whatsapp.groups`)
       - jeśli pominięto `groups`, wszystkie grupy kwalifikują się
       - jeśli `groups` jest obecne, działa jako lista dozwolonych grup (`"*"` dozwolone)

    2. **Polityka nadawcy grupowego** (`channels.whatsapp.groupPolicy` + `groupAllowFrom`)
       - `open`: lista dozwolonych nadawców jest pomijana
       - `allowlist`: nadawca musi pasować do `groupAllowFrom` (lub `*`)
       - `disabled`: blokuje cały ruch przychodzący z grup

    Rezerwa dla listy dozwolonych nadawców:

    - jeśli `groupAllowFrom` nie jest ustawione, środowisko wykonawcze wraca do `allowFrom`, gdy jest dostępne
    - listy dozwolonych nadawców są oceniane przed aktywacją przez wzmiankę/odpowiedź

    Uwaga: jeśli w ogóle nie istnieje blok `channels.whatsapp`, rezerwowa polityka grup w czasie działania to `allowlist` (z logiem ostrzegawczym), nawet jeśli ustawiono `channels.defaults.groupPolicy`.

  </Tab>

  <Tab title="Wzmianki + /activation">
    Odpowiedzi grupowe domyślnie wymagają wzmianki.

    Wykrywanie wzmianki obejmuje:

    - jawne wzmianki WhatsApp o tożsamości bota
    - skonfigurowane wzorce regex wzmianki (`agents.list[].groupChat.mentionPatterns`, rezerwa `messages.groupChat.mentionPatterns`)
    - transkrypcje przychodzących notatek głosowych dla autoryzowanych wiadomości grupowych
    - niejawne wykrywanie odpowiedzi do bota (nadawca odpowiedzi pasuje do tożsamości bota)

    Uwaga dotycząca bezpieczeństwa:

    - cytowanie/odpowiedź spełnia tylko warunek kontroli wzmianki; **nie** przyznaje autoryzacji nadawcy
    - przy `groupPolicy: "allowlist"` nadawcy spoza listy dozwolonej nadal są blokowani, nawet jeśli odpowiadają na wiadomość użytkownika z listy dozwolonej

    Polecenie aktywacji na poziomie sesji:

    - `/activation mention`
    - `/activation always`

    `activation` aktualizuje stan sesji (a nie konfigurację globalną). Jest ograniczone do właściciela.

  </Tab>
</Tabs>

## Zachowanie numeru prywatnego i czatu własnego

Gdy połączony numer własny jest również obecny w `allowFrom`, aktywowane są zabezpieczenia czatu własnego WhatsApp:

- pomijanie potwierdzeń odczytu dla tur czatu własnego
- ignorowanie zachowania automatycznego wyzwalania wzmianką JID, które w przeciwnym razie powodowałoby ping do samego siebie
- jeśli `messages.responsePrefix` nie jest ustawione, odpowiedzi czatu własnego domyślnie używają `[{identity.name}]` lub `[openclaw]`

## Normalizacja wiadomości i kontekst

<AccordionGroup>
  <Accordion title="Koperta przychodząca + kontekst odpowiedzi">
    Przychodzące wiadomości WhatsApp są opakowywane we współdzieloną kopertę przychodzącą.

    Jeśli istnieje cytowana odpowiedź, kontekst jest dopisywany w tej postaci:

    ```text
    [Odpowiedź na <sender> id:<stanzaId>]
    <cytowana treść lub placeholder multimediów>
    [/Odpowiedź]
    ```

    Pola metadanych odpowiedzi są również uzupełniane, gdy są dostępne (`ReplyToId`, `ReplyToBody`, `ReplyToSender`, JID/E.164 nadawcy).

  </Accordion>

  <Accordion title="Placeholdery multimediów oraz wyodrębnianie lokalizacji/kontaktów">
    Przychodzące wiadomości zawierające tylko multimedia są normalizowane za pomocą placeholderów takich jak:

    - `<media:image>`
    - `<media:video>`
    - `<media:audio>`
    - `<media:document>`
    - `<media:sticker>`

    Autoryzowane grupowe notatki głosowe są transkrybowane przed kontrolą wzmianki, gdy
    treść to wyłącznie `<media:audio>`, więc wypowiedzenie wzmianki o bocie w notatce głosowej może
    wyzwolić odpowiedź. Jeśli transkrypt nadal nie zawiera wzmianki o bocie,
    transkrypt zostaje zachowany w oczekującej historii grupy zamiast surowego placeholdera.

    Treści lokalizacji używają zwięzłego tekstu współrzędnych. Etykiety/komentarze lokalizacji oraz szczegóły kontaktu/vCard są renderowane jako ogrodzone niezaufane metadane, a nie jako tekst inline w promptcie.

  </Accordion>

  <Accordion title="Wstrzykiwanie oczekującej historii grupy">
    W grupach nieprzetworzone wiadomości mogą być buforowane i wstrzykiwane jako kontekst, gdy bot zostanie w końcu wyzwolony.

    - domyślny limit: `50`
    - konfiguracja: `channels.whatsapp.historyLimit`
    - rezerwa: `messages.groupChat.historyLimit`
    - `0` wyłącza

    Znaczniki wstrzyknięcia:

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

    Tury czatu własnego pomijają potwierdzenia odczytu nawet wtedy, gdy są globalnie włączone.

  </Accordion>
</AccordionGroup>

## Dostarczanie, dzielenie na fragmenty i multimedia

<AccordionGroup>
  <Accordion title="Dzielenie tekstu na fragmenty">
    - domyślny limit fragmentu: `channels.whatsapp.textChunkLimit = 4000`
    - `channels.whatsapp.chunkMode = "length" | "newline"`
    - tryb `newline` preferuje granice akapitów (puste wiersze), a następnie wraca do bezpiecznego dzielenia według długości

  </Accordion>

  <Accordion title="Zachowanie mediów wychodzących">
    - obsługuje ładunki obrazów, wideo, audio (notatki głosowe PTT) i dokumentów
    - multimedia audio są wysyłane przez ładunek Baileys `audio` z `ptt: true`, więc klienci WhatsApp renderują je jako notatkę głosową push-to-talk
    - ładunki odpowiedzi zachowują `audioAsVoice`; wyjście notatek głosowych TTS dla WhatsApp pozostaje na tej ścieżce PTT nawet wtedy, gdy dostawca zwraca MP3 lub WebM
    - natywne audio Ogg/Opus jest wysyłane jako `audio/ogg; codecs=opus` dla zgodności z notatkami głosowymi
    - audio inne niż Ogg, w tym wyjście MP3/WebM Microsoft Edge TTS, jest transkodowane przez `ffmpeg` do 48 kHz mono Ogg/Opus przed dostarczeniem PTT
    - `/tts latest` wysyła ostatnią odpowiedź asystenta jako jedną notatkę głosową i tłumi powtórne wysyłki dla tej samej odpowiedzi; `/tts chat on|off|default` kontroluje automatyczne TTS dla bieżącego czatu WhatsApp
    - odtwarzanie animowanych GIF-ów jest obsługiwane przez `gifPlayback: true` przy wysyłkach wideo
    - podpisy są stosowane do pierwszego elementu multimedialnego przy wysyłaniu ładunków odpowiedzi z wieloma mediami, z wyjątkiem notatek głosowych PTT, które wysyłają najpierw audio, a widoczny tekst osobno, ponieważ klienci WhatsApp nie renderują podpisów notatek głosowych w sposób spójny
    - źródłem multimediów może być HTTP(S), `file://` lub ścieżki lokalne

  </Accordion>

  <Accordion title="Limity rozmiaru mediów i zachowanie awaryjne">
    - limit zapisu mediów przychodzących: `channels.whatsapp.mediaMaxMb` (domyślnie `50`)
    - limit wysyłania mediów wychodzących: `channels.whatsapp.mediaMaxMb` (domyślnie `50`)
    - nadpisania per konto używają `channels.whatsapp.accounts.<accountId>.mediaMaxMb`
    - obrazy są automatycznie optymalizowane (zmiana rozmiaru/przegląd jakości), aby zmieścić się w limitach
    - przy niepowodzeniu wysyłania mediów awaryjny mechanizm pierwszego elementu wysyła ostrzeżenie tekstowe zamiast po cichu porzucać odpowiedź

  </Accordion>
</AccordionGroup>

## Cytowanie odpowiedzi

WhatsApp obsługuje natywne cytowanie odpowiedzi, gdzie odpowiedzi wychodzące widocznie cytują wiadomość przychodzącą. Steruje tym `channels.whatsapp.replyToMode`.

| Wartość     | Zachowanie                                                           |
| ----------- | -------------------------------------------------------------------- |
| `"off"`     | Nigdy nie cytuje; wysyła jako zwykłą wiadomość                       |
| `"first"`   | Cytuje tylko pierwszy fragment odpowiedzi wychodzącej                |
| `"all"`     | Cytuje każdy fragment odpowiedzi wychodzącej                         |
| `"batched"` | Cytuje kolejkowane odpowiedzi wsadowe, pozostawiając natychmiastowe odpowiedzi bez cytatu |

Wartość domyślna to `"off"`. Nadpisania per konto używają `channels.whatsapp.accounts.<id>.replyToMode`.

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

`channels.whatsapp.reactionLevel` określa, jak szeroko agent używa reakcji emoji w WhatsApp:

| Poziom        | Reakcje ack | Reakcje inicjowane przez agenta | Opis                                             |
| ------------- | ----------- | ------------------------------- | ------------------------------------------------ |
| `"off"`       | Nie         | Nie                             | Brak reakcji                                     |
| `"ack"`       | Tak         | Nie                             | Tylko reakcje ack (potwierdzenie przed odpowiedzią) |
| `"minimal"`   | Tak         | Tak (zachowawczo)               | Ack + reakcje agenta z zachowawczymi wskazówkami |
| `"extensive"` | Tak         | Tak (zalecane)                  | Ack + reakcje agenta z zalecanymi wskazówkami    |

Domyślnie: `"minimal"`.

Nadpisania per konto używają `channels.whatsapp.accounts.<id>.reactionLevel`.

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

WhatsApp obsługuje natychmiastowe reakcje ack po odebraniu wiadomości przychodzącej przez `channels.whatsapp.ackReaction`.
Reakcje ack są ograniczane przez `reactionLevel` — są wyciszane, gdy `reactionLevel` ma wartość `"off"`.

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

Uwagi dotyczące działania:

- wysyłane natychmiast po zaakceptowaniu wiadomości przychodzącej (przed odpowiedzią)
- błędy są logowane, ale nie blokują zwykłego dostarczenia odpowiedzi
- tryb grupowy `mentions` reaguje na tury wyzwolone wzmianką; aktywacja grupy `always` działa jako obejście tego sprawdzenia
- WhatsApp używa `channels.whatsapp.ackReaction` (starsze `messages.ackReaction` nie jest tutaj używane)

## Wiele kont i poświadczenia

<AccordionGroup>
  <Accordion title="Wybór konta i wartości domyślne">
    - identyfikatory kont pochodzą z `channels.whatsapp.accounts`
    - domyślny wybór konta: `default`, jeśli istnieje, w przeciwnym razie pierwszy skonfigurowany identyfikator konta (posortowany)
    - identyfikatory kont są wewnętrznie normalizowane na potrzeby wyszukiwania

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
- Ograniczenia akcji:
  - `channels.whatsapp.actions.reactions`
  - `channels.whatsapp.actions.polls`
- Zapisy konfiguracji inicjowane z kanału są domyślnie włączone (wyłącz przez `channels.whatsapp.configWrites=false`).

## Rozwiązywanie problemów

<AccordionGroup>
  <Accordion title="Brak połączenia (wymagany QR)">
    Objaw: status kanału zgłasza brak połączenia.

    Naprawa:

    ```bash
    openclaw channels login --channel whatsapp
    openclaw channels status
    ```

  </Accordion>

  <Accordion title="Połączone, ale rozłączone / pętla ponownego łączenia">
    Objaw: połączone konto z powtarzającymi się rozłączeniami lub próbami ponownego połączenia.

    Naprawa:

    ```bash
    openclaw doctor
    openclaw logs --follow
    ```

    W razie potrzeby połącz ponownie przez `channels login`.

  </Accordion>

  <Accordion title="Brak aktywnego nasłuchu podczas wysyłania">
    Wysyłki wychodzące kończą się natychmiast błędem, gdy nie istnieje aktywny nasłuch Gateway dla konta docelowego.

    Upewnij się, że Gateway działa i konto jest połączone.

  </Accordion>

  <Accordion title="Wiadomości grupowe są nieoczekiwanie ignorowane">
    Sprawdź w tej kolejności:

    - `groupPolicy`
    - `groupAllowFrom` / `allowFrom`
    - wpisy listy dozwolonych `groups`
    - kontrolę przez wzmianki (`requireMention` + wzorce wzmianki)
    - zduplikowane klucze w `openclaw.json` (JSON5): późniejsze wpisy zastępują wcześniejsze, więc utrzymuj pojedyncze `groupPolicy` dla danego zakresu

  </Accordion>

  <Accordion title="Ostrzeżenie środowiska uruchomieniowego Bun">
    Środowisko uruchomieniowe Gateway dla WhatsApp powinno używać Node. Bun jest oznaczony jako niezgodny ze stabilnym działaniem Gateway dla WhatsApp/Telegram.
  </Accordion>
</AccordionGroup>

## Prompty systemowe

WhatsApp obsługuje prompty systemowe w stylu Telegram dla grup i czatów bezpośrednich przez mapy `groups` i `direct`.

Hierarchia rozwiązywania dla wiadomości grupowych:

Najpierw wyznaczana jest efektywna mapa `groups`: jeśli konto definiuje własne `groups`, całkowicie zastępuje ona główną mapę `groups` (bez głębokiego scalania). Następnie wyszukiwanie promptu działa na wynikowej pojedynczej mapie:

1. **Prompt systemowy specyficzny dla grupy** (`groups["<groupId>"].systemPrompt`): używany, gdy wpis konkretnej grupy istnieje w mapie **i** zdefiniowano w nim klucz `systemPrompt`. Jeśli `systemPrompt` jest pustym ciągiem (`""`), wildcard jest tłumiony i nie jest stosowany żaden prompt systemowy.
2. **Wildcard prompt systemowy grupy** (`groups["*"].systemPrompt`): używany, gdy wpis konkretnej grupy całkowicie nie istnieje w mapie albo istnieje, ale nie definiuje klucza `systemPrompt`.

Hierarchia rozwiązywania dla wiadomości prywatnych:

Najpierw wyznaczana jest efektywna mapa `direct`: jeśli konto definiuje własne `direct`, całkowicie zastępuje ona główną mapę `direct` (bez głębokiego scalania). Następnie wyszukiwanie promptu działa na wynikowej pojedynczej mapie:

1. **Prompt systemowy specyficzny dla wiadomości prywatnej** (`direct["<peerId>"].systemPrompt`): używany, gdy wpis konkretnego peera istnieje w mapie **i** zdefiniowano w nim klucz `systemPrompt`. Jeśli `systemPrompt` jest pustym ciągiem (`""`), wildcard jest tłumiony i nie jest stosowany żaden prompt systemowy.
2. **Wildcard prompt systemowy wiadomości prywatnej** (`direct["*"].systemPrompt`): używany, gdy wpis konkretnego peera całkowicie nie istnieje w mapie albo istnieje, ale nie definiuje klucza `systemPrompt`.

Uwaga: `dms` pozostaje lekkim zasobnikiem nadpisywania historii per wiadomość prywatna (`dms.<id>.historyLimit`); nadpisania promptów znajdują się w `direct`.

**Różnica względem zachowania wielu kont w Telegram:** W Telegram główne `groups` jest celowo tłumione dla wszystkich kont w konfiguracji z wieloma kontami — nawet dla kont, które nie definiują własnego `groups` — aby zapobiec odbieraniu przez bota wiadomości grupowych z grup, do których nie należy. WhatsApp nie stosuje tego zabezpieczenia: główne `groups` i główne `direct` są zawsze dziedziczone przez konta, które nie definiują nadpisania na poziomie konta, niezależnie od liczby skonfigurowanych kont. W konfiguracji WhatsApp z wieloma kontami, jeśli chcesz promptów grupowych lub prywatnych per konto, zdefiniuj pełną mapę jawnie pod każdym kontem zamiast polegać na domyślnych ustawieniach poziomu głównego.

Ważne zachowanie:

- `channels.whatsapp.groups` jest zarówno mapą konfiguracji per grupa, jak i listą dozwolonych grup na poziomie czatu. Zarówno w zakresie głównym, jak i konta, `groups["*"]` oznacza „wszystkie grupy są dopuszczone” dla tego zakresu.
- Dodawaj wildcard `systemPrompt` dla grup tylko wtedy, gdy już chcesz, aby ten zakres dopuszczał wszystkie grupy. Jeśli nadal chcesz, aby kwalifikował się tylko stały zestaw identyfikatorów grup, nie używaj `groups["*"]` jako domyślnego promptu. Zamiast tego powtórz prompt przy każdym jawnie wpisanym na listę dozwolonych wpisie grupy.
- Dopuszczenie grupy i autoryzacja nadawcy to oddzielne sprawdzenia. `groups["*"]` poszerza zestaw grup, które mogą wejść do obsługi grupowej, ale samo w sobie nie autoryzuje każdego nadawcy w tych grupach. Dostęp nadawców jest nadal kontrolowany osobno przez `channels.whatsapp.groupPolicy` i `channels.whatsapp.groupAllowFrom`.
- `channels.whatsapp.direct` nie ma tego samego efektu ubocznego dla wiadomości prywatnych. `direct["*"]` dostarcza jedynie domyślną konfigurację czatu bezpośredniego po tym, jak wiadomość prywatna została już dopuszczona przez `dmPolicy` wraz z `allowFrom` albo regułami magazynu parowania.

Przykład:

```json5
{
  channels: {
    whatsapp: {
      groups: {
        // Używaj tylko wtedy, gdy wszystkie grupy mają być dopuszczone w zakresie głównym.
        // Dotyczy wszystkich kont, które nie definiują własnej mapy groups.
        "*": { systemPrompt: "Domyślny prompt dla wszystkich grup." },
      },
      direct: {
        // Dotyczy wszystkich kont, które nie definiują własnej mapy direct.
        "*": { systemPrompt: "Domyślny prompt dla wszystkich czatów bezpośrednich." },
      },
      accounts: {
        work: {
          groups: {
            // To konto definiuje własne groups, więc główne groups jest całkowicie
            // zastępowane. Aby zachować wildcard, zdefiniuj tutaj jawnie również "*".
            "120363406415684625@g.us": {
              requireMention: false,
              systemPrompt: "Skup się na zarządzaniu projektami.",
            },
            // Używaj tylko wtedy, gdy wszystkie grupy mają być dopuszczone na tym koncie.
            "*": { systemPrompt: "Domyślny prompt dla grup roboczych." },
          },
          direct: {
            // To konto definiuje własne direct, więc główne wpisy direct są
            // całkowicie zastępowane. Aby zachować wildcard, zdefiniuj tutaj jawnie również "*".
            "+15551234567": { systemPrompt: "Prompt dla konkretnego roboczego czatu bezpośredniego." },
            "*": { systemPrompt: "Domyślny prompt dla roboczych czatów bezpośrednich." },
          },
        },
      },
    },
  },
}
```

## Wskaźniki do dokumentacji referencyjnej konfiguracji

Główna dokumentacja referencyjna:

- [Dokumentacja referencyjna konfiguracji - WhatsApp](/pl/gateway/config-channels#whatsapp)

Najważniejsze pola WhatsApp:

- dostęp: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`
- dostarczanie: `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `sendReadReceipts`, `ackReaction`, `reactionLevel`
- wiele kont: `accounts.<id>.enabled`, `accounts.<id>.authDir`, nadpisania na poziomie konta
- operacje: `configWrites`, `debounceMs`, `web.enabled`, `web.heartbeatSeconds`, `web.reconnect.*`
- zachowanie sesji: `session.dmScope`, `historyLimit`, `dmHistoryLimit`, `dms.<id>.historyLimit`
- prompty: `groups.<id>.systemPrompt`, `groups["*"].systemPrompt`, `direct.<id>.systemPrompt`, `direct["*"].systemPrompt`

## Powiązane

- [Parowanie](/pl/channels/pairing)
- [Grupy](/pl/channels/groups)
- [Bezpieczeństwo](/pl/gateway/security)
- [Trasowanie kanałów](/pl/channels/channel-routing)
- [Trasowanie wielu agentów](/pl/concepts/multi-agent)
- [Rozwiązywanie problemów](/pl/channels/troubleshooting)
