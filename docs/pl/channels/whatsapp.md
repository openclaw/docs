---
read_when:
    - Praca nad zachowaniem kanału WhatsApp/web lub routingiem skrzynki odbiorczej
summary: Obsługa kanału WhatsApp, kontrola dostępu, zachowanie dostarczania i operacje
title: WhatsApp
x-i18n:
    generated_at: "2026-04-22T04:21:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5c527b9f7f58f4bb7272a6d1c0f9a435d7d46a9b99790243594afb5c305606b3
    source_path: channels/whatsapp.md
    workflow: 15
---

# WhatsApp (kanał webowy)

Status: gotowy do produkcji przez WhatsApp Web (Baileys). Gateway jest właścicielem połączonych sesji.

## Instalacja (na żądanie)

- Onboarding (`openclaw onboard`) i `openclaw channels add --channel whatsapp`
  przy pierwszym wyborze tego kanału proponują instalację pluginu WhatsApp.
- `openclaw channels login --channel whatsapp` również oferuje przepływ instalacji, gdy
  plugin nie jest jeszcze obecny.
- Kanał developerski + checkout z gita: domyślnie używa lokalnej ścieżki pluginu.
- Stable/Beta: domyślnie używa pakietu npm `@openclaw/whatsapp`.

Instalacja ręczna nadal jest dostępna:

```bash
openclaw plugins install @openclaw/whatsapp
```

<CardGroup cols={3}>
  <Card title="Parowanie" icon="link" href="/pl/channels/pairing">
    Domyślna polityka DM dla nieznanych nadawców to parowanie.
  </Card>
  <Card title="Rozwiązywanie problemów z kanałem" icon="wrench" href="/pl/channels/troubleshooting">
    Diagnostyka międzykanałowa i scenariusze naprawy.
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
OpenClaw zaleca, aby jeśli to możliwe, uruchamiać WhatsApp na osobnym numerze. (Metadane kanału i przepływ konfiguracji są zoptymalizowane pod taki układ, ale konfiguracje z numerem prywatnym również są obsługiwane.)
</Note>

## Wzorce wdrożenia

<AccordionGroup>
  <Accordion title="Dedykowany numer (zalecane)">
    To najczystszy tryb operacyjny:

    - osobna tożsamość WhatsApp dla OpenClaw
    - wyraźniejsze allowlisty DM i granice routingu
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

  <Accordion title="Tryb awaryjny z numerem prywatnym">
    Onboarding obsługuje tryb numeru prywatnego i zapisuje bazową konfigurację przyjazną dla czatu z samym sobą:

    - `dmPolicy: "allowlist"`
    - `allowFrom` zawiera Twój prywatny numer
    - `selfChatMode: true`

    W środowisku uruchomieniowym zabezpieczenia czatu z samym sobą bazują na połączonym własnym numerze i `allowFrom`.

  </Accordion>

  <Accordion title="Zakres kanału tylko WhatsApp Web">
    Kanał platformy komunikacyjnej w bieżącej architekturze kanałów OpenClaw jest oparty na WhatsApp Web (`Baileys`).

    W wbudowanym rejestrze kanałów czatu nie ma osobnego kanału wiadomości Twilio WhatsApp.

  </Accordion>
</AccordionGroup>

## Model środowiska uruchomieniowego

- Gateway jest właścicielem gniazda WhatsApp i pętli ponownego połączenia.
- Wysyłanie wychodzące wymaga aktywnego listenera WhatsApp dla konta docelowego.
- Czaty statusów i broadcastów są ignorowane (`@status`, `@broadcast`).
- Czaty bezpośrednie używają reguł sesji DM (`session.dmScope`; domyślnie `main` zwija DM do głównej sesji agenta).
- Sesje grupowe są izolowane (`agent:<agentId>:whatsapp:group:<jid>`).
- Transport WhatsApp Web respektuje standardowe zmienne środowiskowe proxy na hoście Gateway (`HTTPS_PROXY`, `HTTP_PROXY`, `NO_PROXY` / warianty małymi literami). Preferuj konfigurację proxy na poziomie hosta zamiast ustawień proxy WhatsApp specyficznych dla kanału.

## Kontrola dostępu i aktywacja

<Tabs>
  <Tab title="Polityka DM">
    `channels.whatsapp.dmPolicy` kontroluje dostęp do czatów bezpośrednich:

    - `pairing` (domyślnie)
    - `allowlist`
    - `open` (wymaga, aby `allowFrom` zawierało `"*"`)
    - `disabled`

    `allowFrom` akceptuje numery w stylu E.164 (wewnętrznie normalizowane).

    Nadpisanie dla wielu kont: `channels.whatsapp.accounts.<id>.dmPolicy` (oraz `allowFrom`) ma pierwszeństwo przed domyślnymi wartościami na poziomie kanału dla tego konta.

    Szczegóły zachowania środowiska uruchomieniowego:

    - parowania są zapisywane w channel allow-store i łączone ze skonfigurowanym `allowFrom`
    - jeśli nie skonfigurowano allowlisty, połączony własny numer jest domyślnie dozwolony
    - wychodzące DM `fromMe` nigdy nie są automatycznie parowane

  </Tab>

  <Tab title="Polityka grup + allowlisty">
    Dostęp do grup ma dwie warstwy:

    1. **Allowlista członkostwa grupy** (`channels.whatsapp.groups`)
       - jeśli `groups` zostanie pominięte, wszystkie grupy kwalifikują się
       - jeśli `groups` jest obecne, działa jako allowlista grup (`"*"` dozwolone)

    2. **Polityka nadawców grupy** (`channels.whatsapp.groupPolicy` + `groupAllowFrom`)
       - `open`: allowlista nadawców jest pomijana
       - `allowlist`: nadawca musi pasować do `groupAllowFrom` (lub `*`)
       - `disabled`: blokuje cały ruch przychodzący grup

    Fallback allowlisty nadawców:

    - jeśli `groupAllowFrom` nie jest ustawione, środowisko uruchomieniowe przechodzi do `allowFrom`, gdy jest dostępne
    - allowlisty nadawców są sprawdzane przed aktywacją przez wzmiankę/odpowiedź

    Uwaga: jeśli blok `channels.whatsapp` w ogóle nie istnieje, fallback polityki grup w środowisku uruchomieniowym to `allowlist` (z logiem ostrzegawczym), nawet jeśli ustawiono `channels.defaults.groupPolicy`.

  </Tab>

  <Tab title="Wzmianki + /activation">
    Odpowiedzi grupowe domyślnie wymagają wzmianki.

    Wykrywanie wzmianki obejmuje:

    - jawne wzmianki WhatsApp tożsamości bota
    - skonfigurowane wzorce regex wzmianki (`agents.list[].groupChat.mentionPatterns`, fallback `messages.groupChat.mentionPatterns`)
    - niejawne wykrywanie odpowiedzi do bota (nadawca odpowiedzi odpowiada tożsamości bota)

    Uwaga dotycząca bezpieczeństwa:

    - cytat/odpowiedź spełnia tylko warunek bramki wzmianki; **nie** przyznaje autoryzacji nadawcy
    - przy `groupPolicy: "allowlist"` nadawcy spoza allowlisty nadal są blokowani, nawet jeśli odpowiadają na wiadomość użytkownika z allowlisty

    Polecenie aktywacji na poziomie sesji:

    - `/activation mention`
    - `/activation always`

    `activation` aktualizuje stan sesji (a nie konfigurację globalną). Jest ograniczone do właściciela.

  </Tab>
</Tabs>

## Zachowanie numeru prywatnego i czatu z samym sobą

Gdy połączony własny numer jest też obecny w `allowFrom`, aktywują się zabezpieczenia czatu z samym sobą w WhatsApp:

- pomijanie potwierdzeń odczytu dla tur czatu z samym sobą
- ignorowanie zachowania automatycznego wyzwalania mention-JID, które w przeciwnym razie wywołałoby ping do samego siebie
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

  </Accordion>

  <Accordion title="Placeholders multimediów oraz ekstrakcja lokalizacji/kontaktów">
    Przychodzące wiadomości zawierające wyłącznie multimedia są normalizowane za pomocą placeholderów takich jak:

    - `<media:image>`
    - `<media:video>`
    - `<media:audio>`
    - `<media:document>`
    - `<media:sticker>`

    Ładunki lokalizacji i kontaktów są normalizowane do kontekstu tekstowego przed routingiem.

  </Accordion>

  <Accordion title="Wstrzykiwanie oczekującej historii grupy">
    W przypadku grup nieprzetworzone wiadomości mogą być buforowane i wstrzykiwane jako kontekst, gdy bot zostanie wreszcie wyzwolony.

    - domyślny limit: `50`
    - konfiguracja: `channels.whatsapp.historyLimit`
    - fallback: `messages.groupChat.historyLimit`
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

## Dostarczanie, dzielenie na fragmenty i multimedia

<AccordionGroup>
  <Accordion title="Dzielenie tekstu na fragmenty">
    - domyślny limit fragmentu: `channels.whatsapp.textChunkLimit = 4000`
    - `channels.whatsapp.chunkMode = "length" | "newline"`
    - tryb `newline` preferuje granice akapitów (puste linie), a następnie przechodzi do bezpiecznego dzielenia według długości
  </Accordion>

  <Accordion title="Zachowanie wychodzących multimediów">
    - obsługuje ładunki obrazów, wideo, audio (notatka głosowa PTT) i dokumentów
    - `audio/ogg` jest przepisywane na `audio/ogg; codecs=opus` dla zgodności z notatkami głosowymi
    - odtwarzanie animowanych GIF-ów jest obsługiwane przez `gifPlayback: true` przy wysyłaniu wideo
    - podpisy są stosowane do pierwszego elementu multimedialnego przy wysyłaniu ładunków odpowiedzi z wieloma multimediami
    - źródłem multimediów może być HTTP(S), `file://` lub ścieżki lokalne
  </Accordion>

  <Accordion title="Limity rozmiaru multimediów i zachowanie awaryjne">
    - limit zapisu przychodzących multimediów: `channels.whatsapp.mediaMaxMb` (domyślnie `50`)
    - limit wysyłania wychodzących multimediów: `channels.whatsapp.mediaMaxMb` (domyślnie `50`)
    - nadpisania per konto używają `channels.whatsapp.accounts.<accountId>.mediaMaxMb`
    - obrazy są automatycznie optymalizowane (zmiana rozmiaru/przebieg jakości), aby zmieścić się w limitach
    - przy błędzie wysyłania multimediów fallback pierwszego elementu wysyła tekstowe ostrzeżenie zamiast po cichu porzucać odpowiedź
  </Accordion>
</AccordionGroup>

## Poziom reakcji

`channels.whatsapp.reactionLevel` kontroluje, jak szeroko agent używa reakcji emoji w WhatsApp:

| Poziom        | Reakcje potwierdzające | Reakcje inicjowane przez agenta | Opis                                             |
| ------------- | ---------------------- | ------------------------------- | ------------------------------------------------ |
| `"off"`       | Nie                    | Nie                             | Brak reakcji                                     |
| `"ack"`       | Tak                    | Nie                             | Tylko reakcje potwierdzające (potwierdzenie przed odpowiedzią) |
| `"minimal"`   | Tak                    | Tak (zachowawczo)               | Potwierdzenia + reakcje agenta z zachowawczymi wskazówkami |
| `"extensive"` | Tak                    | Tak (zalecane)                  | Potwierdzenia + reakcje agenta z zalecanymi wskazówkami |

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

WhatsApp obsługuje natychmiastowe reakcje potwierdzające po odebraniu wiadomości przychodzącej przez `channels.whatsapp.ackReaction`.
Reakcje potwierdzające są ograniczane przez `reactionLevel` — są wyciszane, gdy `reactionLevel` ma wartość `"off"`.

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

Uwagi o zachowaniu:

- wysyłane natychmiast po zaakceptowaniu wiadomości przychodzącej (przed odpowiedzią)
- błędy są logowane, ale nie blokują normalnego dostarczenia odpowiedzi
- tryb grupowy `mentions` reaguje przy turach wyzwolonych wzmianką; aktywacja grupy `always` działa jako obejście tego sprawdzenia
- WhatsApp używa `channels.whatsapp.ackReaction` (starsze `messages.ackReaction` nie jest tu używane)

## Wiele kont i poświadczenia

<AccordionGroup>
  <Accordion title="Wybór konta i wartości domyślne">
    - identyfikatory kont pochodzą z `channels.whatsapp.accounts`
    - domyślny wybór konta: `default`, jeśli jest obecne, w przeciwnym razie pierwszy skonfigurowany identyfikator konta (posortowany)
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
- Bramki akcji:
  - `channels.whatsapp.actions.reactions`
  - `channels.whatsapp.actions.polls`
- Zapisy konfiguracji inicjowane z kanału są domyślnie włączone (wyłącz przez `channels.whatsapp.configWrites=false`).

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

    W razie potrzeby połącz ponownie przez `channels login`.

  </Accordion>

  <Accordion title="Brak aktywnego listenera podczas wysyłania">
    Wysyłanie wychodzące kończy się szybkim błędem, gdy dla konta docelowego nie istnieje aktywny listener Gateway.

    Upewnij się, że Gateway działa i konto jest połączone.

  </Accordion>

  <Accordion title="Wiadomości grupowe są nieoczekiwanie ignorowane">
    Sprawdź w tej kolejności:

    - `groupPolicy`
    - `groupAllowFrom` / `allowFrom`
    - wpisy allowlisty `groups`
    - bramkę wzmianki (`requireMention` + wzorce wzmianki)
    - zduplikowane klucze w `openclaw.json` (JSON5): późniejsze wpisy nadpisują wcześniejsze, więc zachowaj pojedyncze `groupPolicy` na zakres

  </Accordion>

  <Accordion title="Ostrzeżenie środowiska uruchomieniowego Bun">
    Środowisko uruchomieniowe Gateway dla WhatsApp powinno używać Node. Bun jest oznaczony jako niezgodny ze stabilną pracą Gateway dla WhatsApp/Telegram.
  </Accordion>
</AccordionGroup>

## Prompty systemowe

WhatsApp obsługuje prompty systemowe w stylu Telegram dla grup i czatów bezpośrednich przez mapy `groups` i `direct`.

Hierarchia rozwiązywania dla wiadomości grupowych:

Najpierw określana jest efektywna mapa `groups`: jeśli konto definiuje własne `groups`, całkowicie zastępuje ono główną mapę `groups` (bez głębokiego scalania). Wyszukiwanie promptu odbywa się następnie na tej jednej wynikowej mapie:

1. **Prompt systemowy specyficzny dla grupy** (`groups["<groupId>"].systemPrompt`): używany, jeśli wpis dla konkretnej grupy definiuje `systemPrompt`.
2. **Prompt systemowy z wildcardem grupy** (`groups["*"].systemPrompt`): używany, gdy wpis dla konkretnej grupy nie istnieje lub nie definiuje `systemPrompt`.

Hierarchia rozwiązywania dla wiadomości bezpośrednich:

Najpierw określana jest efektywna mapa `direct`: jeśli konto definiuje własne `direct`, całkowicie zastępuje ono główną mapę `direct` (bez głębokiego scalania). Wyszukiwanie promptu odbywa się następnie na tej jednej wynikowej mapie:

1. **Prompt systemowy specyficzny dla czatu bezpośredniego** (`direct["<peerId>"].systemPrompt`): używany, jeśli wpis dla konkretnego peer definiuje `systemPrompt`.
2. **Prompt systemowy z wildcardem czatu bezpośredniego** (`direct["*"].systemPrompt`): używany, gdy wpis dla konkretnego peer nie istnieje lub nie definiuje `systemPrompt`.

Uwaga: `dms` pozostaje lekkim zasobnikiem nadpisywania historii per DM (`dms.<id>.historyLimit`); nadpisania promptów znajdują się w `direct`.

**Różnica względem zachowania Telegram przy wielu kontach:** W Telegram główne `groups` jest celowo tłumione dla wszystkich kont w konfiguracji wielokontowej — nawet dla kont, które nie definiują własnego `groups` — aby zapobiec odbieraniu przez bota wiadomości grupowych z grup, do których nie należy. WhatsApp nie stosuje tego zabezpieczenia: główne `groups` i główne `direct` są zawsze dziedziczone przez konta, które nie definiują nadpisania na poziomie konta, niezależnie od liczby skonfigurowanych kont. W konfiguracji wielokontowej WhatsApp, jeśli chcesz mieć prompty grupowe lub bezpośrednie per konto, zdefiniuj pełną mapę jawnie pod każdym kontem zamiast polegać na wartościach domyślnych na poziomie głównym.

Ważne zachowanie:

- `channels.whatsapp.groups` jest zarówno mapą konfiguracji per grupa, jak i allowlistą grup na poziomie czatu. W zakresie głównym i zakresach kont `groups["*"]` oznacza „wszystkie grupy są dopuszczone” dla tego zakresu.
- Dodawaj wildcard group `systemPrompt` tylko wtedy, gdy i tak chcesz, aby ten zakres dopuszczał wszystkie grupy. Jeśli nadal chcesz, aby kwalifikował się tylko ustalony zestaw ID grup, nie używaj `groups["*"]` jako domyślnego promptu. Zamiast tego powtórz prompt przy każdym jawnie wpisanym na allowlistę wpisie grupy.
- Dopuszczenie grupy i autoryzacja nadawcy to osobne sprawdzenia. `groups["*"]` poszerza zestaw grup, które mogą trafić do obsługi grupowej, ale samo w sobie nie autoryzuje każdego nadawcy w tych grupach. Dostęp nadawcy jest nadal kontrolowany oddzielnie przez `channels.whatsapp.groupPolicy` i `channels.whatsapp.groupAllowFrom`.
- `channels.whatsapp.direct` nie ma tego samego efektu ubocznego dla DM. `direct["*"]` zapewnia tylko domyślną konfigurację czatu bezpośredniego po tym, jak DM zostanie już dopuszczone przez `dmPolicy` plus `allowFrom` lub reguły pairing-store.

Przykład:

```json5
{
  channels: {
    whatsapp: {
      groups: {
        // Używaj tylko wtedy, gdy wszystkie grupy mają być dopuszczone w zakresie głównym.
        // Dotyczy wszystkich kont, które nie definiują własnej mapy groups.
        "*": { systemPrompt: "Default prompt for all groups." },
      },
      direct: {
        // Dotyczy wszystkich kont, które nie definiują własnej mapy direct.
        "*": { systemPrompt: "Default prompt for all direct chats." },
      },
      accounts: {
        work: {
          groups: {
            // To konto definiuje własne groups, więc główne groups zostaje w pełni
            // zastąpione. Aby zachować wildcard, jawnie zdefiniuj tu również "*".
            "120363406415684625@g.us": {
              requireMention: false,
              systemPrompt: "Focus on project management.",
            },
            // Używaj tylko wtedy, gdy wszystkie grupy mają być dopuszczone na tym koncie.
            "*": { systemPrompt: "Default prompt for work groups." },
          },
          direct: {
            // To konto definiuje własną mapę direct, więc główne wpisy direct są
            // całkowicie zastępowane. Aby zachować wildcard, jawnie zdefiniuj tu również "*".
            "+15551234567": { systemPrompt: "Prompt for a specific work direct chat." },
            "*": { systemPrompt: "Default prompt for work direct chats." },
          },
        },
      },
    },
  },
}
```

## Wskaźniki do referencji konfiguracji

Główna referencja:

- [Referencja konfiguracji - WhatsApp](/pl/gateway/configuration-reference#whatsapp)

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
- [Routing kanałów](/pl/channels/channel-routing)
- [Routing wielu agentów](/pl/concepts/multi-agent)
- [Rozwiązywanie problemów](/pl/channels/troubleshooting)
