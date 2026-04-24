---
read_when:
    - Praca nad zachowaniem kanału WhatsApp/web lub routingiem skrzynki odbiorczej
summary: Obsługa kanału WhatsApp, kontrola dostępu, zachowanie dostarczania i operacje
title: WhatsApp
x-i18n:
    generated_at: "2026-04-24T09:00:46Z"
    model: gpt-5.4
    provider: openai
    source_hash: 51305dbf83109edb64d07bcafd5fe738ff97e3d2c779adfaef2e8406d1d93caf
    source_path: channels/whatsapp.md
    workflow: 15
---

Status: gotowe do produkcji przez WhatsApp Web (Baileys). Gateway zarządza połączonymi sesjami.

## Instalacja (na żądanie)

- Onboarding (`openclaw onboard`) i `openclaw channels add --channel whatsapp`
  przy pierwszym wyborze kanału wyświetlają monit o instalację Pluginu WhatsApp.
- `openclaw channels login --channel whatsapp` również oferuje przepływ instalacji, gdy
  Plugin nie jest jeszcze obecny.
- Kanał deweloperski + checkout git: domyślnie używa lokalnej ścieżki Pluginu.
- Stable/Beta: domyślnie używa pakietu npm `@openclaw/whatsapp`.

Instalacja ręczna nadal jest dostępna:

```bash
openclaw plugins install @openclaw/whatsapp
```

<CardGroup cols={3}>
  <Card title="Pairing" icon="link" href="/pl/channels/pairing">
    Domyślną zasadą DM jest pairing dla nieznanych nadawców.
  </Card>
  <Card title="Rozwiązywanie problemów z kanałami" icon="wrench" href="/pl/channels/troubleshooting">
    Diagnostyka międzykanałowa i instrukcje naprawy.
  </Card>
  <Card title="Konfiguracja Gateway" icon="settings" href="/pl/gateway/configuration">
    Pełne wzorce konfiguracji kanałów i przykłady.
  </Card>
</CardGroup>

## Szybka konfiguracja

<Steps>
  <Step title="Skonfiguruj zasadę dostępu WhatsApp">

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

    Aby dołączyć istniejący/niestandardowy katalog uwierzytelniania WhatsApp Web przed logowaniem:

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

  <Step title="Zatwierdź pierwsze żądanie pairingu (jeśli używasz trybu pairingu)">

```bash
openclaw pairing list whatsapp
openclaw pairing approve whatsapp <CODE>
```

    Żądania pairingu wygasają po 1 godzinie. Liczba oczekujących żądań jest ograniczona do 3 na kanał.

  </Step>
</Steps>

<Note>
OpenClaw zaleca, jeśli to możliwe, uruchamianie WhatsApp na osobnym numerze. (Metadane kanału i przepływ konfiguracji są zoptymalizowane pod ten model, ale konfiguracje z numerem osobistym również są obsługiwane.)
</Note>

## Wzorce wdrożenia

<AccordionGroup>
  <Accordion title="Dedykowany numer (zalecane)">
    To najczystszy tryb operacyjny:

    - oddzielna tożsamość WhatsApp dla OpenClaw
    - bardziej przejrzyste listy dozwolonych DM i granice routingu
    - mniejsze ryzyko niejasności związanych z czatem z samym sobą

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
    - `allowFrom` zawiera Twój osobisty numer
    - `selfChatMode: true`

    W czasie działania zabezpieczenia czatu z samym sobą opierają się na połączonym własnym numerze i `allowFrom`.

  </Accordion>

  <Accordion title="Zakres kanału tylko WhatsApp Web">
    Kanał platformy komunikacyjnej w obecnej architekturze kanałów OpenClaw jest oparty na WhatsApp Web (`Baileys`).

    W wbudowanym rejestrze kanałów czatu nie ma oddzielnego kanału wiadomości WhatsApp przez Twilio.

  </Accordion>
</AccordionGroup>

## Model działania

- Gateway zarządza gniazdem WhatsApp i pętlą ponownych połączeń.
- Wysyłanie wychodzące wymaga aktywnego listenera WhatsApp dla konta docelowego.
- Czaty statusów i rozgłoszeniowe są ignorowane (`@status`, `@broadcast`).
- Czaty bezpośrednie używają reguł sesji DM (`session.dmScope`; domyślne `main` zwija DM do głównej sesji agenta).
- Sesje grupowe są odizolowane (`agent:<agentId>:whatsapp:group:<jid>`).
- Transport WhatsApp Web respektuje standardowe zmienne środowiskowe proxy na hoście Gateway (`HTTPS_PROXY`, `HTTP_PROXY`, `NO_PROXY` / warianty małymi literami). Preferuj konfigurację proxy na poziomie hosta zamiast ustawień proxy specyficznych dla kanału WhatsApp.

## Kontrola dostępu i aktywacja

<Tabs>
  <Tab title="Zasada DM">
    `channels.whatsapp.dmPolicy` kontroluje dostęp do czatów bezpośrednich:

    - `pairing` (domyślnie)
    - `allowlist`
    - `open` (wymaga, aby `allowFrom` zawierało `"*"`)
    - `disabled`

    `allowFrom` akceptuje numery w stylu E.164 (wewnętrznie normalizowane).

    Nadpisanie dla wielu kont: `channels.whatsapp.accounts.<id>.dmPolicy` (oraz `allowFrom`) mają pierwszeństwo nad domyślnymi ustawieniami kanału dla tego konta.

    Szczegóły zachowania w czasie działania:

    - pairingi są utrwalane w magazynie listy dozwolonych kanału i scalane ze skonfigurowanym `allowFrom`
    - jeśli nie skonfigurowano listy dozwolonych, połączony własny numer jest domyślnie dozwolony
    - OpenClaw nigdy nie wykonuje automatycznego pairingu wychodzących wiadomości DM `fromMe` (wiadomości, które wysyłasz do siebie z połączonego urządzenia)

  </Tab>

  <Tab title="Zasada grup i listy dozwolonych">
    Dostęp do grup ma dwie warstwy:

    1. **Lista dozwolonego członkostwa w grupach** (`channels.whatsapp.groups`)
       - jeśli `groups` jest pominięte, wszystkie grupy kwalifikują się
       - jeśli `groups` jest obecne, działa jako lista dozwolonych grup (`"*"` jest dozwolone)

    2. **Zasada nadawcy grupowego** (`channels.whatsapp.groupPolicy` + `groupAllowFrom`)
       - `open`: lista dozwolonych nadawców jest pomijana
       - `allowlist`: nadawca musi pasować do `groupAllowFrom` (lub `*`)
       - `disabled`: blokuje cały przychodzący ruch grupowy

    Rezerwa listy dozwolonych nadawców:

    - jeśli `groupAllowFrom` nie jest ustawione, środowisko działania używa `allowFrom`, gdy jest dostępne
    - listy dozwolonych nadawców są oceniane przed aktywacją przez wzmiankę/odpowiedź

    Uwaga: jeśli blok `channels.whatsapp` w ogóle nie istnieje, rezerwowa zasada grupy w czasie działania to `allowlist` (z ostrzeżeniem w logu), nawet jeśli ustawiono `channels.defaults.groupPolicy`.

  </Tab>

  <Tab title="Wzmianki + /activation">
    Odpowiedzi grupowe domyślnie wymagają wzmianki.

    Wykrywanie wzmianki obejmuje:

    - jawne wzmianki WhatsApp o tożsamości bota
    - skonfigurowane wzorce regex wzmianki (`agents.list[].groupChat.mentionPatterns`, rezerwa: `messages.groupChat.mentionPatterns`)
    - niejawne wykrywanie odpowiedzi do bota (nadawca odpowiedzi pasuje do tożsamości bota)

    Uwaga dotycząca Security:

    - cytat/odpowiedź spełnia tylko warunek ograniczania wzmianką; **nie** przyznaje autoryzacji nadawcy
    - przy `groupPolicy: "allowlist"` nadawcy spoza listy dozwolonych nadal są blokowani, nawet jeśli odpowiadają na wiadomość użytkownika z listy dozwolonych

    Polecenie aktywacji na poziomie sesji:

    - `/activation mention`
    - `/activation always`

    `activation` aktualizuje stan sesji (nie konfigurację globalną). Jest ograniczone do właściciela.

  </Tab>
</Tabs>

## Zachowanie numeru osobistego i czatu z samym sobą

Gdy połączony własny numer jest również obecny w `allowFrom`, aktywują się zabezpieczenia czatu z samym sobą w WhatsApp:

- pomijanie potwierdzeń odczytu dla tur czatu z samym sobą
- ignorowanie zachowania automatycznego wyzwalania przez mention-JID, które w przeciwnym razie powodowałoby pingowanie samego siebie
- jeśli `messages.responsePrefix` nie jest ustawione, odpowiedzi w czacie z samym sobą domyślnie używają `[{identity.name}]` lub `[openclaw]`

## Normalizacja wiadomości i kontekst

<AccordionGroup>
  <Accordion title="Przychodząca koperta + kontekst odpowiedzi">
    Przychodzące wiadomości WhatsApp są opakowywane we współdzieloną kopertę przychodzącą.

    Jeśli istnieje cytowana odpowiedź, kontekst jest dołączany w tej postaci:

    ```text
    [Replying to <sender> id:<stanzaId>]
    <quoted body or media placeholder>
    [/Replying]
    ```

    Pola metadanych odpowiedzi są również wypełniane, gdy są dostępne (`ReplyToId`, `ReplyToBody`, `ReplyToSender`, sender JID/E.164).

  </Accordion>

  <Accordion title="Symbole zastępcze multimediów i wyodrębnianie lokalizacji/kontaktów">
    Przychodzące wiadomości zawierające tylko multimedia są normalizowane z symbolami zastępczymi takimi jak:

    - `<media:image>`
    - `<media:video>`
    - `<media:audio>`
    - `<media:document>`
    - `<media:sticker>`

    Treści lokalizacji używają zwięzłego tekstu współrzędnych. Etykiety/komentarze lokalizacji oraz szczegóły kontaktów/vCard są renderowane jako wydzielone metadane niezaufane, a nie jako tekst promptu inline.

  </Accordion>

  <Accordion title="Wstrzykiwanie oczekującej historii grupy">
    W grupach nieprzetworzone wiadomości mogą być buforowane i wstrzykiwane jako kontekst, gdy bot zostanie w końcu wyzwolony.

    - domyślny limit: `50`
    - konfiguracja: `channels.whatsapp.historyLimit`
    - rezerwa: `messages.groupChat.historyLimit`
    - `0` wyłącza

    Znaczniki wstrzyknięcia:

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

    Nadpisanie per konto:

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

## Dostarczanie, dzielenie i multimedia

<AccordionGroup>
  <Accordion title="Dzielenie tekstu">
    - domyślny limit fragmentu: `channels.whatsapp.textChunkLimit = 4000`
    - `channels.whatsapp.chunkMode = "length" | "newline"`
    - tryb `newline` preferuje granice akapitów (puste linie), a następnie wraca do bezpiecznego dzielenia według długości
  </Accordion>

  <Accordion title="Zachowanie multimediów wychodzących">
    - obsługuje ładunki obrazów, wideo, audio (notatka głosowa PTT) oraz dokumentów
    - `audio/ogg` jest przepisywane na `audio/ogg; codecs=opus` dla zgodności z notatkami głosowymi
    - odtwarzanie animowanych GIF-ów jest obsługiwane przez `gifPlayback: true` przy wysyłaniu wideo
    - podpisy są stosowane do pierwszego elementu multimedialnego przy wysyłaniu ładunków odpowiedzi z wieloma multimediami
    - źródłem multimediów może być HTTP(S), `file://` lub ścieżki lokalne
  </Accordion>

  <Accordion title="Limity rozmiaru multimediów i zachowanie rezerwowe">
    - limit zapisu multimediów przychodzących: `channels.whatsapp.mediaMaxMb` (domyślnie `50`)
    - limit wysyłania multimediów wychodzących: `channels.whatsapp.mediaMaxMb` (domyślnie `50`)
    - nadpisania per konto używają `channels.whatsapp.accounts.<accountId>.mediaMaxMb`
    - obrazy są automatycznie optymalizowane (zmiana rozmiaru/przemiatanie jakości), aby zmieścić się w limitach
    - przy błędzie wysyłania multimediów rezerwa dla pierwszego elementu wysyła ostrzeżenie tekstowe zamiast po cichu porzucać odpowiedź
  </Accordion>
</AccordionGroup>

## Cytowanie odpowiedzi

WhatsApp obsługuje natywne cytowanie odpowiedzi, gdzie odpowiedzi wychodzące widocznie cytują wiadomość przychodzącą. Steruje tym `channels.whatsapp.replyToMode`.

| Wartość  | Zachowanie                                                                        |
| -------- | --------------------------------------------------------------------------------- |
| `"auto"` | Cytuje wiadomość przychodzącą, gdy dostawca to obsługuje; w przeciwnym razie pomija cytowanie |
| `"on"`   | Zawsze cytuje wiadomość przychodzącą; wraca do zwykłego wysłania, jeśli cytowanie zostanie odrzucone |
| `"off"`  | Nigdy nie cytuje; wysyła jako zwykłą wiadomość                                    |

Domyślnie jest `"auto"`. Nadpisania per konto używają `channels.whatsapp.accounts.<id>.replyToMode`.

```json5
{
  channels: {
    whatsapp: {
      replyToMode: "on",
    },
  },
}
```

## Poziom reakcji

`channels.whatsapp.reactionLevel` kontroluje, jak szeroko agent używa reakcji emoji w WhatsApp:

| Poziom        | Reakcje potwierdzające | Reakcje inicjowane przez agenta | Opis                                              |
| ------------- | ---------------------- | ------------------------------- | ------------------------------------------------- |
| `"off"`       | Nie                    | Nie                             | Brak reakcji                                      |
| `"ack"`       | Tak                    | Nie                             | Tylko reakcje potwierdzające (potwierdzenie przed odpowiedzią) |
| `"minimal"`   | Tak                    | Tak (zachowawczo)               | Potwierdzenia + reakcje agenta przy zachowawczych wskazówkach |
| `"extensive"` | Tak                    | Tak (zalecane)                  | Potwierdzenia + reakcje agenta przy zalecanych wskazówkach   |

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

WhatsApp obsługuje natychmiastowe reakcje potwierdzające przy odbiorze wiadomości przychodzącej przez `channels.whatsapp.ackReaction`.
Reakcje potwierdzające są ograniczane przez `reactionLevel` — są wyłączane, gdy `reactionLevel` ma wartość `"off"`.

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
- błędy są zapisywane w logach, ale nie blokują normalnego dostarczenia odpowiedzi
- tryb grupowy `mentions` reaguje przy turach wyzwolonych wzmianką; aktywacja grupy `always` działa jako obejście tego sprawdzenia
- WhatsApp używa `channels.whatsapp.ackReaction` (starsze `messages.ackReaction` nie jest tutaj używane)

## Wiele kont i poświadczenia

<AccordionGroup>
  <Accordion title="Wybór konta i wartości domyślne">
    - identyfikatory kont pochodzą z `channels.whatsapp.accounts`
    - domyślny wybór konta: `default`, jeśli istnieje, w przeciwnym razie pierwszy skonfigurowany identyfikator konta (sortowany)
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

  <Accordion title="Połączone, ale rozłączone / pętla ponownych połączeń">
    Objaw: połączone konto z powtarzającymi się rozłączeniami lub próbami ponownego połączenia.

    Naprawa:

    ```bash
    openclaw doctor
    openclaw logs --follow
    ```

    W razie potrzeby połącz ponownie za pomocą `channels login`.

  </Accordion>

  <Accordion title="Brak aktywnego listenera przy wysyłaniu">
    Wysyłanie wychodzące kończy się natychmiastowym niepowodzeniem, gdy dla konta docelowego nie istnieje aktywny listener Gateway.

    Upewnij się, że Gateway działa i konto jest połączone.

  </Accordion>

  <Accordion title="Wiadomości grupowe są nieoczekiwanie ignorowane">
    Sprawdź w tej kolejności:

    - `groupPolicy`
    - `groupAllowFrom` / `allowFrom`
    - wpisy listy dozwolonych `groups`
    - ograniczanie wzmianką (`requireMention` + wzorce wzmianki)
    - zduplikowane klucze w `openclaw.json` (JSON5): późniejsze wpisy nadpisują wcześniejsze, więc zachowaj jedno `groupPolicy` na zakres

  </Accordion>

  <Accordion title="Ostrzeżenie środowiska wykonawczego Bun">
    Środowisko wykonawcze Gateway WhatsApp powinno używać Node. Bun jest oznaczony jako niezgodny ze stabilnym działaniem Gateway WhatsApp/Telegram.
  </Accordion>
</AccordionGroup>

## Prompty systemowe

WhatsApp obsługuje prompty systemowe w stylu Telegram dla grup i czatów bezpośrednich przez mapy `groups` i `direct`.

Hierarchia rozstrzygania dla wiadomości grupowych:

Najpierw określana jest efektywna mapa `groups`: jeśli konto definiuje własne `groups`, całkowicie zastępuje ono główną mapę `groups` (bez głębokiego scalania). Następnie wyszukiwanie promptu działa na wynikowej pojedynczej mapie:

1. **Prompt systemowy specyficzny dla grupy** (`groups["<groupId>"].systemPrompt`): używany, jeśli wpis konkretnej grupy definiuje `systemPrompt`.
2. **Prompt systemowy wieloznaczny dla grup** (`groups["*"].systemPrompt`): używany, gdy wpis konkretnej grupy jest nieobecny lub nie definiuje `systemPrompt`.

Hierarchia rozstrzygania dla wiadomości bezpośrednich:

Najpierw określana jest efektywna mapa `direct`: jeśli konto definiuje własne `direct`, całkowicie zastępuje ono główną mapę `direct` (bez głębokiego scalania). Następnie wyszukiwanie promptu działa na wynikowej pojedynczej mapie:

1. **Prompt systemowy specyficzny dla czatu bezpośredniego** (`direct["<peerId>"].systemPrompt`): używany, jeśli wpis konkretnego peera definiuje `systemPrompt`.
2. **Prompt systemowy wieloznaczny dla czatów bezpośrednich** (`direct["*"].systemPrompt`): używany, gdy wpis konkretnego peera jest nieobecny lub nie definiuje `systemPrompt`.

Uwaga: `dms` pozostaje lekkim zasobnikiem nadpisywania historii per DM (`dms.<id>.historyLimit`); nadpisania promptów znajdują się w `direct`.

**Różnica względem zachowania wielu kont w Telegram:** W Telegram główne `groups` jest celowo wyłączane dla wszystkich kont w konfiguracji wielu kont — nawet dla kont, które nie definiują własnego `groups` — aby zapobiec odbieraniu przez bota wiadomości grupowych dla grup, do których nie należy. WhatsApp nie stosuje tego zabezpieczenia: główne `groups` i główne `direct` są zawsze dziedziczone przez konta, które nie definiują nadpisania na poziomie konta, niezależnie od liczby skonfigurowanych kont. W konfiguracji wielu kont WhatsApp, jeśli chcesz mieć prompty grupowe lub bezpośrednie per konto, zdefiniuj pełną mapę jawnie pod każdym kontem zamiast polegać na domyślnych ustawieniach poziomu głównego.

Ważne zachowanie:

- `channels.whatsapp.groups` jest jednocześnie mapą konfiguracji per grupa i listą dozwolonych grup na poziomie czatu. W zakresie głównym lub konta `groups["*"]` oznacza „wszystkie grupy są dopuszczone” dla tego zakresu.
- Dodawaj wieloznaczny grupowy `systemPrompt` tylko wtedy, gdy chcesz już, aby ten zakres dopuszczał wszystkie grupy. Jeśli nadal chcesz, aby kwalifikował się tylko stały zestaw identyfikatorów grup, nie używaj `groups["*"]` jako domyślnego promptu. Zamiast tego powtórz prompt przy każdym jawnie wpisanym na listę dozwolonych wpisie grupy.
- Dopuszczenie grupy i autoryzacja nadawcy to oddzielne sprawdzenia. `groups["*"]` poszerza zestaw grup, które mogą wejść do obsługi grupowej, ale samo w sobie nie autoryzuje każdego nadawcy w tych grupach. Dostęp nadawcy nadal jest kontrolowany osobno przez `channels.whatsapp.groupPolicy` i `channels.whatsapp.groupAllowFrom`.
- `channels.whatsapp.direct` nie ma tego samego skutku ubocznego dla DM. `direct["*"]` zapewnia tylko domyślną konfigurację czatu bezpośredniego po tym, jak DM zostanie już dopuszczone przez `dmPolicy` wraz z regułami `allowFrom` lub magazynu pairingu.

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
            // zastępowane. Aby zachować wieloznacznik, zdefiniuj tutaj jawnie także "*".
            "120363406415684625@g.us": {
              requireMention: false,
              systemPrompt: "Skup się na zarządzaniu projektami.",
            },
            // Używaj tylko wtedy, gdy wszystkie grupy mają być dopuszczone na tym koncie.
            "*": { systemPrompt: "Domyślny prompt dla grup roboczych." },
          },
          direct: {
            // To konto definiuje własną mapę direct, więc główne wpisy direct są
            // całkowicie zastępowane. Aby zachować wieloznacznik, zdefiniuj tutaj jawnie także "*".
            "+15551234567": { systemPrompt: "Prompt dla konkretnego roboczego czatu bezpośredniego." },
            "*": { systemPrompt: "Domyślny prompt dla roboczych czatów bezpośrednich." },
          },
        },
      },
    },
  },
}
```

## Wskaźniki odwołania do konfiguracji

Główne odwołanie:

- [Odwołanie do konfiguracji - WhatsApp](/pl/gateway/config-channels#whatsapp)

Kluczowe pola WhatsApp:

- dostęp: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`
- dostarczanie: `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `sendReadReceipts`, `ackReaction`, `reactionLevel`
- wiele kont: `accounts.<id>.enabled`, `accounts.<id>.authDir`, nadpisania na poziomie konta
- operacje: `configWrites`, `debounceMs`, `web.enabled`, `web.heartbeatSeconds`, `web.reconnect.*`
- zachowanie sesji: `session.dmScope`, `historyLimit`, `dmHistoryLimit`, `dms.<id>.historyLimit`
- prompty: `groups.<id>.systemPrompt`, `groups["*"].systemPrompt`, `direct.<id>.systemPrompt`, `direct["*"].systemPrompt`

## Powiązane

- [Pairing](/pl/channels/pairing)
- [Groups](/pl/channels/groups)
- [Security](/pl/gateway/security)
- [Channel routing](/pl/channels/channel-routing)
- [Multi-agent routing](/pl/concepts/multi-agent)
- [Troubleshooting](/pl/channels/troubleshooting)
